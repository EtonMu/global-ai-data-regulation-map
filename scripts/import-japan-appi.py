#!/usr/bin/env python3
"""Build the current Japanese APPI corpus from pinned government snapshots.

The generated corpus contains only the text effective on 2026-07-20.  Promulgated
future amendments are recorded in the companion manifest and are never merged into
the article text.  The Ministry of Justice English translation is retained only as
an audit snapshot because it stops at Act No. 37 of 2021.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

from legal_corpus_utils import content_sha256, snapshot_sha256, write_json


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SNAPSHOT_DIR = ROOT / "data" / "v2" / "source-snapshots"
DEFAULT_OUTPUT = ROOT / "data" / "v2" / "jp-appi-current-articles.json"
DEFAULT_MANIFEST = ROOT / "data" / "v2" / "jp-appi-current-corpus-manifest.json"

AS_OF = date(2026, 7, 20)
AS_OF_TEXT = AS_OF.isoformat()
LAW_ID = "415AC0000000057"
INSTRUMENT_ID = "jp-appi"
CURRENT_REVISION_ID = "415AC0000000057_20260717_508AC0000000062"
CURRENT_REVISION_DATE = "2026-07-17"

CURRENT_XML_NAME = "jp-appi-415AC0000000057-current-2026-07-20.xml"
REVISIONS_NAME = "jp-appi-415AC0000000057-revisions-2026-07-20.json"
EN_REFERENCE_NAME = "jp-appi-government-en-reference-act-37-2021.xml"
EN_HISTORY_NAME = "jp-appi-government-en-reference-history.html"
PPC_STATUS_NAME = "jp-appi-ppc-amendment-status-2026-07-17.html"

CURRENT_SOURCE = (
    "https://laws.e-gov.go.jp/api/2/law_file/xml/"
    f"{LAW_ID}?asof={AS_OF_TEXT}"
)
CURRENT_PAGE = f"https://laws.e-gov.go.jp/law/{LAW_ID}?occasion_date=20260720"
REVISIONS_SOURCE = f"https://laws.e-gov.go.jp/api/2/law_revisions/{LAW_ID}"
EN_REFERENCE_SOURCE = (
    "https://www.japaneselawtranslation.go.jp/en/laws/download/4241/06/"
    "h15Aa000570305en14.0_r3A37.xml"
)
EN_REFERENCE_PAGE = (
    "https://www.japaneselawtranslation.go.jp/en/laws/view/4241/en"
)
EN_HISTORY_SOURCE = (
    "https://www.japaneselawtranslation.go.jp/en/laws/history/4241"
)
PPC_STATUS_SOURCE = "https://www.ppc.go.jp/news/press/2026/260717/"

STRUCTURE_TAGS = {
    "Part": "part",
    "Chapter": "chapter",
    "Section": "section",
    "Subsection": "subsection",
    "Division": "division",
}


def japanese_text(element: ET.Element) -> str:
    """Return typographically normalized Japanese text without XML indentation."""

    parts: list[str] = []

    def visit(node: ET.Element) -> None:
        if node.text and node.text.strip():
            parts.append(re.sub(r"\s+", " ", node.text.strip()))
        for child in node:
            visit(child)
            if child.tail and child.tail.strip():
                parts.append(re.sub(r"\s+", " ", child.tail.strip()))

    visit(element)
    return "".join(parts)


def element_sha256(element: ET.Element) -> str:
    return content_sha256(ET.tostring(element, encoding="unicode"))


def table_lines(element: ET.Element) -> list[str]:
    lines: list[str] = []
    for row in element.findall(".//TableRow"):
        columns = [
            japanese_text(column)
            for column in row.findall("TableColumn")
            if japanese_text(column)
        ]
        if columns:
            lines.append("｜".join(columns))
    return lines


def paragraph_units(paragraph: ET.Element) -> list[str]:
    head = "".join(
        japanese_text(child)
        for child in paragraph
        if child.tag in {"ParagraphNum", "ParagraphSentence"}
    )
    units = [head] if head else []
    for child in paragraph:
        if child.tag in {"ParagraphNum", "ParagraphSentence"}:
            continue
        if child.tag == "TableStruct":
            units.extend(table_lines(child))
            continue
        text = japanese_text(child)
        if text:
            units.append(text)
    if not units:
        text = japanese_text(paragraph)
        if text:
            units.append(text)
    return units


def article_text(article: ET.Element) -> tuple[list[str], str]:
    article_title = japanese_text(article.find("ArticleTitle"))
    caption_node = article.find("ArticleCaption")
    caption = japanese_text(caption_node) if caption_node is not None else ""
    paragraphs: list[str] = []
    for paragraph in article.findall("Paragraph"):
        paragraphs.extend(paragraph_units(paragraph))
    if not paragraphs:
        raise ValueError(f"Article {article.get('Num')} has no Paragraph")
    paragraphs[0] = f"{article_title}　{paragraphs[0]}"
    full_text = "\n\n".join(([caption] if caption else []) + paragraphs)
    return paragraphs, full_text


def supplementary_text(block: ET.Element) -> tuple[list[str], str]:
    label = japanese_text(block.find("SupplProvisionLabel")) or "附　則"
    amend_law_num = block.get("AmendLawNum")
    heading = f"{label}（{amend_law_num}）" if amend_law_num else label
    parts: list[str] = [heading]
    for child in block:
        if child.tag == "SupplProvisionLabel":
            continue
        if child.tag == "Article":
            _, text = article_text(child)
        else:
            text = japanese_text(child)
        if text:
            parts.append(text)
    return parts[1:], "\n\n".join(parts)


def appendix_text(element: ET.Element) -> tuple[list[str], str]:
    title_node = next(
        (child for child in element if child.tag.endswith("Title")), None
    )
    title = japanese_text(title_node) if title_node is not None else ""
    related_node = element.find("RelatedArticleNum")
    related = japanese_text(related_node) if related_node is not None else ""
    heading = f"{title}{related}"
    body_parts: list[str] = []
    for child in element:
        if child is title_node or child is related_node:
            continue
        if child.tag == "TableStruct":
            body_parts.extend(table_lines(child))
            continue
        text = japanese_text(child)
        if text:
            body_parts.append(text)
    full_text = "\n\n".join(([heading] if heading else []) + body_parts)
    return body_parts, full_text


def iter_articles(
    node: ET.Element, hierarchy: dict[str, dict[str, str]] | None = None
):
    hierarchy = hierarchy or {}
    for child in node:
        if child.tag == "Article":
            yield child, hierarchy
            continue
        hierarchy_key = STRUCTURE_TAGS.get(child.tag)
        if hierarchy_key:
            title_node = child.find(f"{child.tag}Title")
            original_title = (
                japanese_text(title_node) if title_node is not None else child.tag
            )
            child_hierarchy = {
                **hierarchy,
                hierarchy_key: {
                    "id": f"jp-appi-{hierarchy_key}-{child.get('Num', '0')}",
                    "label": original_title,
                    "title": original_title,
                    "originalTitle": original_title,
                },
            }
            yield from iter_articles(child, child_hierarchy)
            continue
        yield from iter_articles(child, hierarchy)


def snapshot_entry(
    snapshot_dir: Path,
    filename: str,
    source_url: str,
    media_type: str,
    role: str,
    rights_profile: str,
) -> dict:
    path = snapshot_dir / filename
    return {
        "path": f"data/v2/source-snapshots/{filename}",
        "sourceUrl": source_url,
        "retrievedOn": AS_OF_TEXT,
        "mediaType": media_type,
        "role": role,
        "sha256": snapshot_sha256(path),
        "rightsProfile": rights_profile,
    }


def future_date_certainty(record: dict) -> str:
    comment = record.get("amendment_enforcement_comment") or ""
    if "超えない範囲内" in comment:
        return "statutory-deadline-not-fixed-by-cabinet-order"
    if "施行の日" in comment:
        return "linked-to-another-act"
    return "fixed-date"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot-dir", type=Path, default=DEFAULT_SNAPSHOT_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    snapshot_dir: Path = args.snapshot_dir
    current_path = snapshot_dir / CURRENT_XML_NAME
    revisions_path = snapshot_dir / REVISIONS_NAME
    en_reference_path = snapshot_dir / EN_REFERENCE_NAME
    en_history_path = snapshot_dir / EN_HISTORY_NAME
    ppc_status_path = snapshot_dir / PPC_STATUS_NAME
    for path in (
        current_path,
        revisions_path,
        en_reference_path,
        en_history_path,
        ppc_status_path,
    ):
        if not path.exists():
            raise FileNotFoundError(path)

    root = ET.parse(current_path).getroot()
    if root.get("Lang") != "ja" or root.findtext("LawNum") != "平成十五年法律第五十七号":
        raise ValueError("Pinned current XML is not the Japanese APPI")
    body = root.find("LawBody")
    if body is None or body.findtext("LawTitle") != "個人情報の保護に関する法律":
        raise ValueError("Unexpected APPI title")
    main_provision = body.find("MainProvision")
    if main_provision is None:
        raise ValueError("APPI MainProvision missing")

    revisions = json.loads(revisions_path.read_text(encoding="utf-8"))
    if revisions.get("law_info", {}).get("law_id") != LAW_ID:
        raise ValueError("Revision snapshot has the wrong Law ID")
    revision_rows = revisions.get("revisions", [])
    current_revision = next(
        (row for row in revision_rows if row.get("law_revision_id") == CURRENT_REVISION_ID),
        None,
    )
    if current_revision is None:
        raise ValueError("Current APPI revision is absent from the history snapshot")

    reference_root = ET.parse(en_reference_path).getroot()
    reference_articles = reference_root.findall("./LawBody/MainProvision//Article")
    if len(reference_articles) != 185:
        raise ValueError("The pinned Act No. 37 of 2021 English reference is incomplete")
    history_text = en_history_path.read_text(encoding="utf-8")
    if "Act No. 37 of 2021" not in history_text or "November 5, 2021" not in history_text:
        raise ValueError("English reference history metadata changed")
    ppc_text = ppc_status_path.read_text(encoding="utf-8")
    if "令和８年７月17日" not in ppc_text or "２年以内" not in ppc_text:
        raise ValueError("PPC amendment status snapshot lacks the expected status language")

    common_source_version = {
        "lawId": LAW_ID,
        "lawNumber": "平成十五年法律第五十七号",
        "asOf": AS_OF_TEXT,
        "revisionId": CURRENT_REVISION_ID,
        "effectiveRevisionDate": CURRENT_REVISION_DATE,
        "amendingLawNumber": current_revision.get("amendment_law_num"),
        "sourceDocumentSha256": snapshot_sha256(current_path),
        "revisionHistorySha256": snapshot_sha256(revisions_path),
        "competentAuthoritySnapshotSha256": snapshot_sha256(ppc_status_path),
        "textState": "current-effective-consolidation-only",
        "normalization": (
            "XML indentation is removed; statutory characters and source order are "
            "preserved. Captions and paragraphs are separated for display."
        ),
    }
    rights = {
        "reuseStatus": "e-gov-secondary-use-unrestricted",
        "license": "e-Gov Law Search reuse statement",
        "licenseUrl": "https://laws.e-gov.go.jp/help",
        "attribution": (
            "Source: e-Gov Law Search, Digital Agency, Government of Japan. "
            "e-Gov states that its legal data may be reused and imposes no special "
            "restriction; the original Japanese text controls."
        ),
    }

    units: list[dict] = []
    main_articles = list(iter_articles(main_provision))
    numbers = [article.get("Num") for article, _ in main_articles]
    if numbers != [str(index) for index in range(1, 186)]:
        raise ValueError("APPI main articles are not the complete sequence 1..185")

    for article, hierarchy in main_articles:
        number = article.get("Num")
        caption_node = article.find("ArticleCaption")
        caption = japanese_text(caption_node) if caption_node is not None else ""
        article_title = japanese_text(article.find("ArticleTitle"))
        paragraphs, full_text = article_text(article)
        unit = {
            "id": f"jp-appi-art-{number}",
            "instrumentId": INSTRUMENT_ID,
            "unitType": "article",
            "articleNumber": number,
            "label": f"Article {number}",
            "originalLabel": article_title,
            "title": caption.strip("（）") or article_title,
            "originalTitle": f"{article_title}{caption}",
            "chapter": hierarchy.get("chapter"),
            "section": hierarchy.get("section"),
            "subsection": hierarchy.get("subsection"),
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "ja-JP",
            "textAvailability": "full-current-authoritative-japanese",
            "legalEffectStatus": "in-force",
            "versionAsOf": AS_OF_TEXT,
            "source": CURRENT_PAGE,
            "sourceFragment": f"{CURRENT_PAGE}#Mp-At_{number}",
            "sourceLabel": "e-Gov Law Search — current Japanese consolidation",
            "sourceXmlPath": f"MainProvision/Article[@Num='{number}']",
            "retrievedOn": AS_OF_TEXT,
            "sourceVersion": common_source_version,
            "sourceNodeSha256": element_sha256(article),
            "contentSha256": content_sha256(full_text),
            "translationStatus": "government-reference-translation-outdated-see-manifest",
            "rights": rights,
        }
        for key in ("part", "division"):
            if hierarchy.get(key):
                unit[key] = hierarchy[key]
        units.append(unit)

    supplementary_blocks = body.findall("SupplProvision")
    if len(supplementary_blocks) != 21:
        raise ValueError(f"Expected 21 current supplementary blocks, got {len(supplementary_blocks)}")
    for index, block in enumerate(supplementary_blocks, start=1):
        paragraphs, full_text = supplementary_text(block)
        amend_law_num = block.get("AmendLawNum")
        units.append(
            {
                "id": f"jp-appi-suppl-{index}",
                "instrumentId": INSTRUMENT_ID,
                "unitType": "supplementary-provision-block",
                "supplementNumber": str(index),
                "label": f"Supplementary Provisions {index}",
                "originalLabel": "附則",
                "title": amend_law_num or "制定附則",
                "originalTitle": amend_law_num or "制定附則",
                "amendingLawNumber": amend_law_num,
                "paragraphs": paragraphs,
                "fullText": full_text,
                "language": "ja-JP",
                "textAvailability": "full-current-authoritative-japanese",
                "legalEffectStatus": "in-force-current-consolidation",
                "versionAsOf": AS_OF_TEXT,
                "source": CURRENT_PAGE,
                "sourceFragment": CURRENT_PAGE,
                "sourceLabel": "e-Gov Law Search — current Japanese consolidation",
                "sourceXmlPath": f"LawBody/SupplProvision[{index}]",
                "retrievedOn": AS_OF_TEXT,
                "sourceVersion": common_source_version,
                "sourceNodeSha256": element_sha256(block),
                "contentSha256": content_sha256(full_text),
                "translationStatus": "government-reference-translation-outdated-see-manifest",
                "rights": rights,
            }
        )

    appended_tables = body.findall("AppdxTable")
    if len(appended_tables) != 2:
        raise ValueError(f"Expected two APPI appended tables, got {len(appended_tables)}")
    for index, table in enumerate(appended_tables, start=1):
        paragraphs, full_text = appendix_text(table)
        title = japanese_text(table.find("AppdxTableTitle")) or f"別表第{index}"
        units.append(
            {
                "id": f"jp-appi-appended-table-{index}",
                "instrumentId": INSTRUMENT_ID,
                "unitType": "appended-table",
                "appendedTableNumber": str(index),
                "label": f"Appended Table {index}",
                "originalLabel": title,
                "title": title,
                "originalTitle": title,
                "paragraphs": paragraphs,
                "fullText": full_text,
                "language": "ja-JP",
                "textAvailability": "full-current-authoritative-japanese",
                "legalEffectStatus": "in-force",
                "versionAsOf": AS_OF_TEXT,
                "source": CURRENT_PAGE,
                "sourceFragment": CURRENT_PAGE,
                "sourceLabel": "e-Gov Law Search — current Japanese consolidation",
                "sourceXmlPath": f"LawBody/AppdxTable[{index}]",
                "retrievedOn": AS_OF_TEXT,
                "sourceVersion": common_source_version,
                "sourceNodeSha256": element_sha256(table),
                "contentSha256": content_sha256(full_text),
                "translationStatus": "government-reference-translation-outdated-see-manifest",
                "rights": rights,
            }
        )

    future_revisions = []
    for row in revision_rows:
        enforcement = row.get("amendment_enforcement_date")
        promulgated = row.get("amendment_promulgate_date")
        if not enforcement or not promulgated:
            continue
        if date.fromisoformat(promulgated) > AS_OF or date.fromisoformat(enforcement) <= AS_OF:
            continue
        future_revisions.append(
            {
                "revisionId": row.get("law_revision_id"),
                "amendingLawId": row.get("amendment_law_id"),
                "amendingLawNumber": row.get("amendment_law_num"),
                "amendingLawTitle": row.get("amendment_law_title"),
                "promulgatedOn": promulgated,
                "eGovEnforcementDate": enforcement,
                "eGovScheduledEnforcementDate": row.get("amendment_scheduled_enforcement_date"),
                "enforcementComment": row.get("amendment_enforcement_comment"),
                "dateCertainty": future_date_certainty(row),
                "includedInCurrentCorpus": False,
            }
        )
    future_revisions.sort(key=lambda item: (item["eGovEnforcementDate"], item["revisionId"]))
    if len(future_revisions) != 7:
        raise ValueError(f"Expected seven promulgated future APPI revisions, got {len(future_revisions)}")

    snapshots = [
        snapshot_entry(snapshot_dir, CURRENT_XML_NAME, CURRENT_SOURCE, "application/xml", "current-effective-text", "egov"),
        snapshot_entry(snapshot_dir, REVISIONS_NAME, REVISIONS_SOURCE, "application/json", "revision-history", "egov"),
        snapshot_entry(snapshot_dir, EN_REFERENCE_NAME, EN_REFERENCE_SOURCE, "application/xml", "outdated-government-reference-translation", "jlt-pdl-1.0"),
        snapshot_entry(snapshot_dir, EN_HISTORY_NAME, EN_HISTORY_SOURCE, "text/html", "translation-version-history", "jlt-pdl-1.0"),
        snapshot_entry(snapshot_dir, PPC_STATUS_NAME, PPC_STATUS_SOURCE, "text/html", "competent-authority-amendment-status", "audit-only"),
    ]
    manifest = {
        "instrumentId": INSTRUMENT_ID,
        "lawId": LAW_ID,
        "officialTitle": "個人情報の保護に関する法律",
        "retrievedOn": AS_OF_TEXT,
        "hashAlgorithm": "SHA-256",
        "currentVersion": {
            "asOf": AS_OF_TEXT,
            "revisionId": CURRENT_REVISION_ID,
            "effectiveRevisionDate": CURRENT_REVISION_DATE,
            "amendingLawNumber": current_revision.get("amendment_law_num"),
            "textStatus": "current-effective-only",
            "futureRevisionTextIncluded": False,
            "verification": (
                "The as-of XML is byte-identical to e-Gov law-file revision "
                f"{CURRENT_REVISION_ID}; SHA-256 {snapshot_sha256(current_path)}."
            ),
        },
        "corpus": {
            "path": "data/v2/jp-appi-current-articles.json",
            "nodeCount": len(units),
            "mainArticleCount": len(main_articles),
            "supplementaryProvisionBlockCount": len(supplementary_blocks),
            "appendedTableCount": len(appended_tables),
            "contentSha256": content_sha256(
                "\n\n".join(unit["fullText"] for unit in units)
            ),
        },
        "promulgatedFutureRevisions": future_revisions,
        "translation": {
            "language": "en",
            "status": "government-reference-only-outdated-not-attached-to-current-units",
            "source": EN_REFERENCE_PAGE,
            "lastVersion": "Act No. 37 of 2021",
            "translatedOn": "2021-11-05",
            "publishedOnDatabase": "2023-03-01",
            "dictionaryVersion": "14.0",
            "referenceMainArticleCount": len(reference_articles),
            "versionDifference": (
                "The English reference incorporates through Act No. 37 of 2021. "
                "It does not represent the current 2026 Japanese consolidation or "
                "the promulgated future phases listed in this manifest. No English "
                "reference text is copied into current APPI units."
            ),
            "legalEffect": (
                "Japanese Law Translation states that translations are reference "
                "materials only and that only the original Japanese text has legal effect."
            ),
        },
        "rights": {
            "primaryJapaneseText": rights,
            "referenceTranslation": {
                "reuseStatus": "public-data-license-1.0",
                "license": "Public Data License (Version 1.0)",
                "licenseUrl": "https://www.japaneselawtranslation.go.jp/en/index/terms",
                "attribution": "Japanese Law Translation Database System, Ministry of Justice, Japan.",
            },
        },
        "sourceSnapshots": snapshots,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    write_json(args.output, units)
    write_json(args.manifest, manifest)
    print(
        f"Wrote {len(units)} APPI nodes: {len(main_articles)} main Articles, "
        f"{len(supplementary_blocks)} supplementary blocks, {len(appended_tables)} tables"
    )


if __name__ == "__main__":
    main()
