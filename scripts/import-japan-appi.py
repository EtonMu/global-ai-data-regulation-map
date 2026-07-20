#!/usr/bin/env python3
"""Build the current Japanese APPI corpus from pinned government snapshots.

The controlling Japanese text is the consolidation effective on 2026-07-20.
Promulgated future amendments are recorded in the companion manifest and are never
merged into that text.  The Ministry of Justice's complete 185-Article English
reference through Act No. 37 of 2021 is compared against the current Japanese
text article by article. Government English is treated as current-equivalent only
when the corresponding official historical and current Japanese nodes have
identical normalized text. Changed Articles receive a separately labelled project
current-alignment reference where a complete, mechanically checked update is
available; otherwise the government English remains an unmistakably historical
reference. The government reference also contains the two appended tables, but
no supplementary provisions.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
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
JA_REFERENCE_NAME = "jp-appi-government-ja-reference-act-37-2021.xml"
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
JA_REFERENCE_SOURCE = (
    "https://www.japaneselawtranslation.go.jp/ja/laws/download/4241/01/"
    "h15Aa000570305ja14.0_r3A37.xml"
)
JA_REFERENCE_PAGE = (
    "https://www.japaneselawtranslation.go.jp/ja/laws/view/4241/ja"
)
EN_HISTORY_SOURCE = (
    "https://www.japaneselawtranslation.go.jp/en/laws/history/4241"
)
PPC_STATUS_SOURCE = "https://www.ppc.go.jp/news/press/2026/260717/"

COMPARISON_METHOD = (
    "recursive-text-content-unicode-nfc-all-unicode-whitespace-removed-v1"
)

# These Articles changed after the Act No. 37 of 2021 JLT release, but their
# complete current English can be produced by narrow, reviewable edits to the
# government reference. Empty replacements mean that the historical English
# already expresses the current Japanese term; the project still assumes
# responsibility for the current-alignment decision and does not present that
# wording as a newly issued government translation.
PROJECT_CURRENT_ARTICLE_REPLACEMENTS: dict[str, tuple[tuple[str, str], ...]] = {
    "48": (),
    "113": (
        (
            "make a proposal in paragraph (1) of the preceding Article",
            "make a proposal referred to in paragraph (1) of the preceding Article",
        ),
        (
            "a person that is a corporation or any other organization, and has any of its officers falls under either of the condition referred to in one of the preceding items.",
            "a corporation or other organization that has an officer who falls under any of the conditions referred to in the preceding items.",
        ),
    ),
    "132": (
        ("Article 2, paragraph (8)", "Article 2, paragraph (9)"),
        ("public relations and an awareness raising", "public relations and awareness-raising"),
        ("affairs which comes under", "affairs that come under"),
        ("an order based to it", "an order based on it"),
    ),
    "136": (
        ("except cases falling", "except in a case falling"),
        ("they having been sentenced", "they have been sentenced"),
        ("the Commission have recognized", "the Commission recognizes"),
        (
            "imprisonment without work or heavier punishment",
            "imprisonment or a heavier punishment",
        ),
    ),
    "150": ((
        "Article 99, Article 101, Article 103, Article 105, Article 106, Article 108 or Article 109",
        "Article 100, paragraph (1), Article 101, Article 102-2, Article 103, Article 105, Article 106 or Article 108",
    ),),
    "162": ((
        "The provisions of Article 99, Article 101, Article 103, Article 105, Article 106, Article 108, and Article 109 of the Code of Civil Procedure apply mutatis mutandis to the service under the preceding Article. In this case, the term \"court execution officer\" in Article 99, paragraph (1) of the Code is deemed to be replaced by \"official of the Personal Information Protection Commission\", and the terms \"presiding judge\" in Article 108 of the Code and the term \"court\" in Article 109 of the Code are deemed to be replaced by \"Personal Information Protection Commission\".",
        "The provisions of Article 100, paragraph (1), Article 101, Article 102-2, Article 103, Article 105, Article 106, and Article 108 of the Code of Civil Procedure apply mutatis mutandis to service under the preceding Article. In this case, the term \"court\" in that paragraph and the term \"presiding judge\" in Article 108 of the Code are deemed to be replaced by \"Personal Information Protection Commission\", and the term \"court execution officer\" in Article 101, paragraph (1) of the Code is deemed to be replaced by \"official of the Personal Information Protection Commission\".",
    ),),
    "164": ((
        "the particulars of the service under Article 109 of the Code of Civil Procedure as applied mutatis mutandis pursuant to Article 162",
        "the particulars of service under Article 100, paragraph (1) of the Code of Civil Procedure as applied mutatis mutandis pursuant to Article 162",
    ),),
    "176": (
        (
            "in an administrative entity. provides other persons",
            "in an administrative entity provides other persons",
        ),
        (
            "imprisonment with work for not more than two years",
            "imprisonment for not more than two years",
        ),
    ),
    "177": ((
        "imprisonment with work for not more than two years",
        "imprisonment for not more than two years",
    ),),
    "178": ((
        "imprisonment with work for not more than one year",
        "imprisonment for not more than one year",
    ),),
    "179": ((
        "imprisonment with work for not more than one year",
        "imprisonment for not more than one year",
    ),),
    "180": ((
        "imprisonment with work for not more than one year",
        "imprisonment for not more than one year",
    ),),
    "181": ((
        "imprisonment with work for not more than one year",
        "imprisonment for not more than one year",
    ),),
}

PROJECT_CURRENT_TABLE_ROWS: dict[
    int, tuple[tuple[tuple[str, str], tuple[str, str]], ...]
] = {
    1: (
        (("名称", "根拠法"), ("Name", "Legal basis")),
        (("沖縄科学技術大学院大学学園", "沖縄科学技術大学院大学学園法（平成二十一年法律第七十六号）"), ("Okinawa Institute of Science and Technology Graduate University", "Okinawa Institute of Science and Technology Graduate University Act (Act No. 76 of 2009)")),
        (("沖縄振興開発金融公庫", "沖縄振興開発金融公庫法（昭和四十七年法律第三十一号）"), ("Okinawa Development Finance Corporation", "Okinawa Development Finance Corporation Act (Act No. 31 of 1972)")),
        (("外国人技能実習機構", "外国人の技能実習の適正な実施及び技能実習生の保護に関する法律（平成二十八年法律第八十九号）"), ("Organization for Technical Intern Training", "Act on Proper Technical Intern Training and Protection of Technical Intern Trainees (Act No. 89 of 2016)")),
        (("株式会社国際協力銀行", "株式会社国際協力銀行法（平成二十三年法律第三十九号）"), ("Japan Bank for International Cooperation", "Japan Bank for International Cooperation Act (Act No. 39 of 2011)")),
        (("株式会社日本政策金融公庫", "株式会社日本政策金融公庫法（平成十九年法律第五十七号）"), ("Japan Finance Corporation", "Japan Finance Corporation Act (Act No. 57 of 2007)")),
        (("株式会社日本貿易保険", "貿易保険法（昭和二十五年法律第六十七号）"), ("Nippon Export and Investment Insurance, Co., Ltd.", "International Trade and Investment Insurance Act (Act No. 67 of 1950)")),
        (("金融経済教育推進機構", "金融サービスの提供及び利用環境の整備等に関する法律（平成十二年法律第百一号）"), ("Japan Financial Literacy and Education Corporation", "Act on the Provision of and the Development of Environment for Using Financial Services (Act No. 101 of 2000)")),
        (("原子力損害賠償・廃炉等支援機構", "原子力損害賠償・廃炉等支援機構法（平成二十三年法律第九十四号）"), ("Nuclear Damage Compensation and Decommissioning Facilitation Corporation", "Nuclear Damage Compensation and Decommissioning Facilitation Corporation Act (Act No. 94 of 2011)")),
        (("国立健康危機管理研究機構", "国立健康危機管理研究機構法（令和五年法律第四十六号）"), ("Japan Institute for Health Security", "Act on Japan Institute for Health Security (Act No. 46 of 2023)")),
        (("国立大学法人", "国立大学法人法（平成十五年法律第百十二号）"), ("National University Corporations", "National University Corporation Act (Act No. 112 of 2003)")),
        (("大学共同利用機関法人", "国立大学法人法"), ("Inter-University Research Institute Corporations", "National University Corporation Act")),
        (("脱炭素成長型経済構造移行推進機構", "脱炭素成長型経済構造への円滑な移行の推進に関する法律（令和五年法律第三十二号）"), ("GX Acceleration Agency", "Act on the Promotion of Smooth Transition to a Decarbonized Growth-Oriented Economic Structure (Act No. 32 of 2023)")),
        (("日本銀行", "日本銀行法（平成九年法律第八十九号）"), ("Bank of Japan", "Bank of Japan Act (Act No. 89 of 1997)")),
        (("日本司法支援センター", "総合法律支援法（平成十六年法律第七十四号）"), ("Japan Legal Support Center", "Comprehensive Legal Support Act (Act No. 74 of 2004)")),
        (("日本私立学校振興・共済事業団", "日本私立学校振興・共済事業団法（平成九年法律第四十八号）"), ("Promotion and Mutual Aid Corporation for Private Schools of Japan", "Act on the Promotion and Mutual Aid Corporation for Private Schools of Japan (Act No. 48 of 1997)")),
        (("日本中央競馬会", "日本中央競馬会法（昭和二十九年法律第二百五号）"), ("Japan Racing Association", "Japan Racing Association Act (Act No. 205 of 1954)")),
        (("日本年金機構", "日本年金機構法（平成十九年法律第百九号）"), ("Japan Pension Service", "Japan Pension Organization Act (Act No. 109 of 2007)")),
        (("農水産業協同組合貯金保険機構", "農水産業協同組合貯金保険法（昭和四十八年法律第五十三号）"), ("Agricultural and Fishery Co-operatives Savings Insurance Corporation", "Agricultural and Fishery Cooperatives Savings Insurance Act (Act No. 53 of 1973)")),
        (("福島国際研究教育機構", "福島復興再生特別措置法（平成二十四年法律第二十五号）"), ("Fukushima Institute for Research, Education and Innovation", "Act on Special Measures for the Reconstruction and Revitalization of Fukushima (Act No. 25 of 2012)")),
        (("放送大学学園", "放送大学学園法（平成十四年法律第百五十六号）"), ("The Open University of Japan", "Act on the Open University of Japan (Act No. 156 of 2002)")),
        (("預金保険機構", "預金保険法（昭和四十六年法律第三十四号）"), ("Deposit Insurance Corporation of Japan", "Deposit Insurance Act (Act No. 34 of 1971)")),
    ),
    2: (
        (("名称", "根拠法"), ("Name", "Legal basis")),
        (("沖縄科学技術大学院大学学園", "沖縄科学技術大学院大学学園法"), ("Okinawa Institute of Science and Technology Graduate University", "Okinawa Institute of Science and Technology Graduate University Act")),
        (("国立研究開発法人", "独立行政法人通則法"), ("National Research and Development Agency", "Act on General Rules for Incorporated Administrative Agencies")),
        (("国立健康危機管理研究機構", "国立健康危機管理研究機構法"), ("Japan Institute for Health Security", "Act on Japan Institute for Health Security")),
        (("国立大学法人", "国立大学法人法"), ("National University Corporations", "National University Corporation Act")),
        (("大学共同利用機関法人", "国立大学法人法"), ("Inter-University Research Institute Corporations", "National University Corporation Act")),
        (("独立行政法人国立病院機構", "独立行政法人国立病院機構法（平成十四年法律第百九十一号）"), ("National Hospital Organization, Incorporated Administrative Agency", "Act on the National Hospital Organization, Incorporated Administrative Agency (Act No. 191 of 2002)")),
        (("独立行政法人地域医療機能推進機構", "独立行政法人地域医療機能推進機構法（平成十七年法律第七十一号）"), ("Japan Community Health Care Organization, Incorporated Administrative Agency", "Act on Japan Community Health Care Organization, Incorporated Administrative Agency (Act No. 71 of 2005)")),
        (("福島国際研究教育機構", "福島復興再生特別措置法"), ("Fukushima Institute for Research, Education and Innovation", "Act on Special Measures for the Reconstruction and Revitalization of Fukushima")),
        (("放送大学学園", "放送大学学園法"), ("The Open University of Japan", "Act on the Open University of Japan")),
    ),
}

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


def english_text(element: ET.Element | None) -> str:
    """Return JLT English text with XML indentation removed, without rewriting it."""

    if element is None:
        return ""
    return re.sub(r"\s+", " ", "".join(element.itertext())).strip()


def element_sha256(element: ET.Element) -> str:
    return content_sha256(ET.tostring(element, encoding="unicode"))


def normalized_japanese_comparison_text(element: ET.Element) -> str:
    """Normalize only Unicode and whitespace for substantive-node comparison."""

    text = unicodedata.normalize("NFC", japanese_text(element))
    return re.sub(r"\s+", "", text)


def japanese_comparison_record(
    *,
    unit_id: str,
    current: ET.Element,
    historical: ET.Element,
    current_xml_path: str,
    historical_xml_path: str,
) -> dict:
    current_normalized = normalized_japanese_comparison_text(current)
    historical_normalized = normalized_japanese_comparison_text(historical)
    record = {
        "unitId": unit_id,
        "method": COMPARISON_METHOD,
        "currentSourceUrl": CURRENT_SOURCE,
        "currentSourceXmlPath": current_xml_path,
        "currentSourceDocumentSha256": None,
        "currentSourceNodeSha256": element_sha256(current),
        "currentNormalizedTextSha256": content_sha256(current_normalized),
        "historicalSourceUrl": JA_REFERENCE_SOURCE,
        "historicalSourcePage": JA_REFERENCE_PAGE,
        "historicalSourceXmlPath": historical_xml_path,
        "historicalSourceDocumentSha256": None,
        "historicalSourceNodeSha256": element_sha256(historical),
        "historicalNormalizedTextSha256": content_sha256(historical_normalized),
        "normalizedTextEquivalent": current_normalized == historical_normalized,
    }
    # Document hashes are filled after the pinned files are loaded. Keeping the
    # digest construction here makes the comparison record deterministic.
    return record


def finalize_comparison_record(
    record: dict,
    *,
    current_document_sha256: str,
    historical_document_sha256: str,
) -> dict:
    record = {
        **record,
        "currentSourceDocumentSha256": current_document_sha256,
        "historicalSourceDocumentSha256": historical_document_sha256,
    }
    record["comparisonRecordSha256"] = content_sha256(
        json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    )
    return record


def current_project_article_english(
    number: str,
    reference_article: ET.Element,
) -> tuple[list[str], str]:
    """Apply an exhaustively checked current-law edit to the JLT reference."""

    caption = english_text(reference_article.find("ArticleCaption"))
    paragraphs, _ = english_article_text(reference_article)
    for old, new in PROJECT_CURRENT_ARTICLE_REPLACEMENTS[number]:
        occurrences = sum(paragraph.count(old) for paragraph in paragraphs)
        if occurrences != 1:
            raise ValueError(
                f"Article {number} expected one current-English replacement for {old!r}; "
                f"found {occurrences}"
            )
        paragraphs = [paragraph.replace(old, new) for paragraph in paragraphs]
    full_text = "\n\n".join(([caption] if caption else []) + paragraphs)
    return paragraphs, full_text


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


def english_paragraph_units(paragraph: ET.Element) -> list[str]:
    head = "".join(
        english_text(child)
        for child in paragraph
        if child.tag in {"ParagraphNum", "ParagraphSentence"}
    )
    units = [head] if head else []
    for child in paragraph:
        if child.tag in {"ParagraphNum", "ParagraphSentence"}:
            continue
        text = english_text(child)
        if text:
            units.append(text)
    if not units:
        text = english_text(paragraph)
        if text:
            units.append(text)
    return units


def english_article_text(article: ET.Element) -> tuple[list[str], str]:
    article_title = english_text(article.find("ArticleTitle"))
    caption = english_text(article.find("ArticleCaption"))
    paragraphs: list[str] = []
    for paragraph in article.findall("Paragraph"):
        paragraphs.extend(english_paragraph_units(paragraph))
    if not paragraphs:
        raise ValueError(f"English reference Article {article.get('Num')} has no Paragraph")
    paragraphs[0] = f"{article_title} {paragraphs[0]}".strip()
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


def english_table_lines(element: ET.Element) -> list[str]:
    lines: list[str] = []
    for row in element.findall(".//TableRow"):
        columns = [
            english_text(column)
            for column in row.findall("TableColumn")
            if english_text(column)
        ]
        if columns:
            lines.append(" | ".join(columns))
    return lines


def english_appendix_text(element: ET.Element) -> tuple[list[str], str]:
    title_node = next(
        (child for child in element if child.tag.endswith("Title")), None
    )
    title = english_text(title_node)
    related_node = element.find("RelatedArticleNum")
    related = english_text(related_node)
    heading = " ".join(part for part in (title, related) if part)
    body_parts: list[str] = []
    for child in element:
        if child is title_node or child is related_node:
            continue
        if child.tag == "TableStruct":
            body_parts.extend(english_table_lines(child))
            continue
        text = english_text(child)
        if text:
            body_parts.append(text)
    full_text = "\n\n".join(([heading] if heading else []) + body_parts)
    return body_parts, full_text


def current_project_appendix_english(
    index: int,
    current_table: ET.Element,
) -> tuple[str, list[str], str]:
    """Build a complete current table after exact Japanese row verification."""

    current_rows = []
    for row in current_table.findall(".//TableRow"):
        columns = tuple(
            japanese_text(column)
            for column in row.findall("TableColumn")
            if japanese_text(column)
        )
        if columns:
            if len(columns) != 2:
                raise ValueError(
                    f"APPI Appended Table {index} has a non-two-column row: {columns}"
                )
            current_rows.append(columns)
    expected = PROJECT_CURRENT_TABLE_ROWS[index]
    expected_japanese = [japanese for japanese, _english in expected]
    if current_rows != expected_japanese:
        raise ValueError(
            f"APPI Appended Table {index} Japanese rows drifted; "
            f"expected {expected_japanese}, got {current_rows}"
        )
    paragraphs = [" | ".join(english) for _japanese, english in expected]
    title = (
        "Appended Table 1 (Re: Article 2)"
        if index == 1
        else "Appended Table 2 (Re: Articles 2 and 58)"
    )
    return title, paragraphs, "\n\n".join([title, *paragraphs])


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
    ja_reference_path = snapshot_dir / JA_REFERENCE_NAME
    en_history_path = snapshot_dir / EN_HISTORY_NAME
    ppc_status_path = snapshot_dir / PPC_STATUS_NAME
    for path in (
        current_path,
        revisions_path,
        en_reference_path,
        ja_reference_path,
        en_history_path,
        ppc_status_path,
    ):
        if not path.exists():
            raise FileNotFoundError(path)

    existing_supplements: dict[str, dict] = {}
    if args.output.exists():
        existing_units = json.loads(args.output.read_text(encoding="utf-8"))
        existing_supplements = {
            unit["id"]: unit
            for unit in existing_units
            if unit.get("unitType") == "supplementary-provision-block"
        }

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
    reference_article_by_number = {
        article.get("Num"): article for article in reference_articles
    }
    if len(reference_article_by_number) != 185:
        raise ValueError("The English reference contains duplicate Article numbers")
    reference_tables = reference_root.findall("./LawBody/AppdxTable")
    if len(reference_tables) != 2:
        raise ValueError("The pinned English reference must contain both appended tables")
    if reference_root.findall("./LawBody/SupplProvision"):
        raise ValueError(
            "The pinned APPI English reference unexpectedly acquired supplementary provisions"
        )
    historical_japanese_root = ET.parse(ja_reference_path).getroot()
    if (
        historical_japanese_root.get("Lang") != "ja"
        or historical_japanese_root.findtext("LawNum")
        != "平成十五年五月三十日法律第五十七号"
    ):
        raise ValueError("Pinned Act No. 37 of 2021 Japanese comparison XML is not APPI")
    historical_japanese_articles = historical_japanese_root.findall(
        "./LawBody/MainProvision//Article"
    )
    if len(historical_japanese_articles) != 185:
        raise ValueError("The pinned historical Japanese APPI source is incomplete")
    historical_japanese_article_by_number = {
        article.get("Num"): article for article in historical_japanese_articles
    }
    if len(historical_japanese_article_by_number) != 185:
        raise ValueError("The historical Japanese source contains duplicate Article numbers")
    historical_japanese_tables = historical_japanese_root.findall(
        "./LawBody/AppdxTable"
    )
    if len(historical_japanese_tables) != 2:
        raise ValueError("The pinned historical Japanese source must contain both tables")
    history_text = en_history_path.read_text(encoding="utf-8")
    if "Act No. 37 of 2021" not in history_text or "November 5, 2021" not in history_text:
        raise ValueError("English reference history metadata changed")
    ppc_text = ppc_status_path.read_text(encoding="utf-8")
    if "令和８年７月17日" not in ppc_text or "２年以内" not in ppc_text:
        raise ValueError("PPC amendment status snapshot lacks the expected status language")

    current_document_sha256 = snapshot_sha256(current_path)
    historical_japanese_document_sha256 = snapshot_sha256(ja_reference_path)
    common_source_version = {
        "lawId": LAW_ID,
        "lawNumber": "平成十五年法律第五十七号",
        "asOf": AS_OF_TEXT,
        "revisionId": CURRENT_REVISION_ID,
        "effectiveRevisionDate": CURRENT_REVISION_DATE,
        "amendingLawNumber": current_revision.get("amendment_law_num"),
        "sourceDocumentSha256": current_document_sha256,
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
    english_rights = {
        "reuseStatus": "public-data-license-1.0",
        "license": "Public Data License (Version 1.0)",
        "licenseUrl": "https://www.japaneselawtranslation.go.jp/en/index/terms",
        "attribution": (
            "Japanese Law Translation Database System, Ministry of Justice, Japan."
        ),
    }
    english_source_version = {
        "lastVersion": "Act No. 37 of 2021",
        "versionAsOf": "2021-05-19",
        "versionLabel": (
            "Act No. 37 of 2021 consolidated government reference "
            "(published 2023-03-01)"
        ),
        "translatedOn": "2021-11-05",
        "publishedOnDatabase": "2023-03-01",
        "dictionaryVersion": "14.0",
        "sourceDocumentSha256": snapshot_sha256(en_reference_path),
        "historicalJapaneseSourceDocumentSha256": (
            historical_japanese_document_sha256
        ),
        "translationHistorySha256": snapshot_sha256(en_history_path),
        "comparedCurrentJapaneseAsOf": AS_OF_TEXT,
        "comparedCurrentJapaneseRevisionId": CURRENT_REVISION_ID,
    }
    equivalent_english_authority_note = (
        "Government-published English reference for APPI as amended through "
        "Act No. 37 of 2021. The corresponding official Japanese node was "
        "compared with the e-Gov consolidation effective 20 July 2026 and is "
        "identical after Unicode NFC normalization and whitespace removal. This "
        "is an article-level current-text-equivalence finding, not a newly issued "
        "government translation. Only the Japanese text has legal effect."
    )
    historical_english_authority_note = (
        "Complete government-published English reference for APPI as amended "
        "through Act No. 37 of 2021. It is not a translation of the Japanese "
        "node effective 20 July 2026 shown alongside it: the two official "
        "Japanese nodes differ after normalized comparison. The Japanese text "
        "has legal effect; this historical English reference does not."
    )
    project_rights = {
        "reuseStatus": "jlt-pdl-1.0-source-and-cc-by-4.0-project-adaptation",
        "license": "Creative Commons Attribution 4.0 International",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "attribution": (
            "Compliance Compass contributors — nonofficial current-alignment "
            "reference adapted from the Japanese Law Translation Database "
            "government reference."
        ),
        "sourceTranslationLicense": "Public Data License (Version 1.0)",
        "sourceTranslationLicenseUrl": (
            "https://www.japaneselawtranslation.go.jp/en/index/terms"
        ),
        "boundary": (
            "The Japanese Law Translation Database source wording remains "
            "attributed under the Public Data License. CC BY 4.0 applies to the "
            "project's current-law adaptation and alignment metadata only."
        ),
    }
    project_english_authority_note = (
        "Complete project-reviewed English reference aligned to the official "
        "Japanese node effective 20 July 2026. It adapts the Act No. 37 of 2021 "
        "government reference only where the compared Japanese text changed. "
        "This project reference is nonofficial, has no legal effect and is not "
        "legal advice; the current Japanese text controls."
    )

    units: list[dict] = []
    comparison_records: list[dict] = []
    government_current_equivalent_ids: list[str] = []
    project_current_alignment_ids: list[str] = []
    historical_mismatch_ids: list[str] = []
    main_articles = list(iter_articles(main_provision))
    numbers = [article.get("Num") for article, _ in main_articles]
    if numbers != [str(index) for index in range(1, 186)]:
        raise ValueError("APPI main articles are not the complete sequence 1..185")

    for article, hierarchy in main_articles:
        number = article.get("Num")
        reference_article = reference_article_by_number[number]
        historical_japanese_article = historical_japanese_article_by_number[number]
        unit_id = f"jp-appi-art-{number}"
        comparison = finalize_comparison_record(
            japanese_comparison_record(
                unit_id=unit_id,
                current=article,
                historical=historical_japanese_article,
                current_xml_path=f"MainProvision/Article[@Num='{number}']",
                historical_xml_path=f"MainProvision/Article[@Num='{number}']",
            ),
            current_document_sha256=current_document_sha256,
            historical_document_sha256=historical_japanese_document_sha256,
        )
        comparison_records.append(comparison)
        caption_node = article.find("ArticleCaption")
        caption = japanese_text(caption_node) if caption_node is not None else ""
        article_title = japanese_text(article.find("ArticleTitle"))
        paragraphs, full_text = article_text(article)
        english_caption = english_text(reference_article.find("ArticleCaption"))
        english_paragraphs, english_full_text = english_article_text(reference_article)
        if comparison["normalizedTextEquivalent"]:
            translation_status = (
                "government-reference-translation-current-text-equivalent-verified"
            )
            government_current_equivalent_ids.append(unit_id)
            english_translation = {
                "title": english_caption.strip("()") or f"Article {number}",
                "paragraphs": english_paragraphs,
                "fullText": english_full_text,
                "language": "en",
                "coverageStatus": (
                    "complete-current-equivalent-government-reference"
                ),
                "versionAsOf": english_source_version["versionAsOf"],
                "versionLabel": english_source_version["versionLabel"],
                "currentTextEquivalent": True,
                "currentAlignmentVerifiedAsOf": AS_OF_TEXT,
                "referenceViewEligible": True,
                "status": (
                    "government-reference-translation-current-text-equivalent-"
                    "verified-no-legal-effect"
                ),
                "note": equivalent_english_authority_note,
                "authorityNote": equivalent_english_authority_note,
                "source": EN_REFERENCE_PAGE,
                "sourceLabel": (
                    "Japanese Law Translation Database — Act No. 37 of 2021 "
                    "reference; current Japanese equivalence verified"
                ),
                "sourceXmlPath": f"MainProvision/Article[@Num='{number}']",
                "sourceNodeSha256": element_sha256(reference_article),
                "sourceVersion": {
                    **english_source_version,
                    "versionAlignment": (
                        "article-level-normalized-japanese-current-equivalence-verified"
                    ),
                    "alignmentComparisonRecordSha256": comparison[
                        "comparisonRecordSha256"
                    ],
                },
                "japaneseTextComparison": comparison,
                "contentSha256": content_sha256(english_full_text),
                "rights": english_rights,
            }
        elif number in PROJECT_CURRENT_ARTICLE_REPLACEMENTS:
            english_paragraphs, english_full_text = current_project_article_english(
                number, reference_article
            )
            translation_status = (
                "project-authored-reference-translation-no-legal-effect"
            )
            project_current_alignment_ids.append(unit_id)
            english_translation = {
                "title": english_caption.strip("()") or f"Article {number}",
                "paragraphs": english_paragraphs,
                "fullText": english_full_text,
                "language": "en",
                "coverageStatus": "complete-current-project-reference",
                "versionAsOf": AS_OF_TEXT,
                "versionLabel": (
                    "Current e-Gov Japanese consolidation as of 20 July 2026 — "
                    "project current-alignment reference"
                ),
                "currentTextEquivalent": True,
                "referenceViewEligible": True,
                "legalEffectStatus": (
                    "project-reference-translation-no-legal-effect"
                ),
                "status": (
                    "project-authored-reference-translation-no-legal-effect"
                ),
                "note": project_english_authority_note,
                "authorityNote": project_english_authority_note,
                "source": CURRENT_PAGE,
                "sourceLabel": (
                    "e-Gov Law Search — controlling Japanese source for "
                    "nonofficial current-alignment reference"
                ),
                "sourceXmlPath": f"MainProvision/Article[@Num='{number}']",
                "sourceNodeSha256": element_sha256(article),
                "sourceVersion": {
                    **common_source_version,
                    "sourceLanguage": "ja-JP",
                    "versionAlignment": (
                        "project-reference-aligned-to-current-japanese-after-"
                        "article-level-difference-review"
                    ),
                    "alignmentComparisonRecordSha256": comparison[
                        "comparisonRecordSha256"
                    ],
                },
                "translationBasis": {
                    "method": (
                        "human-reviewed-current-law-delta-adaptation-of-"
                        "government-reference"
                    ),
                    "sourceLanguage": "ja-JP",
                    "sourceContentSha256": content_sha256(full_text),
                    "sourceParagraphCount": len(paragraphs),
                    "currentJapaneseSourceDocumentSha256": (
                        current_document_sha256
                    ),
                    "currentJapaneseSourceNodeSha256": element_sha256(article),
                    "historicalJapaneseSourceDocumentSha256": (
                        historical_japanese_document_sha256
                    ),
                    "historicalJapaneseSourceNodeSha256": element_sha256(
                        historical_japanese_article
                    ),
                    "governmentEnglishSourceDocumentSha256": snapshot_sha256(
                        en_reference_path
                    ),
                    "governmentEnglishSourceNodeSha256": element_sha256(
                        reference_article
                    ),
                    "comparisonRecordSha256": comparison[
                        "comparisonRecordSha256"
                    ],
                    "qualityBoundary": (
                        "The complete Article is retained, only enumerated "
                        "current-law deltas are edited, and every replacement "
                        "must occur exactly once. This is not a certified legal "
                        "translation."
                    ),
                },
                "japaneseTextComparison": comparison,
                "contentSha256": content_sha256(english_full_text),
                "rights": project_rights,
            }
        else:
            translation_status = (
                "government-reference-translation-outdated-version-labeled"
            )
            historical_mismatch_ids.append(unit_id)
            english_translation = {
                "title": english_caption.strip("()") or f"Article {number}",
                "paragraphs": english_paragraphs,
                "fullText": english_full_text,
                "language": "en",
                "coverageStatus": "complete-versioned-reference",
                "versionAsOf": english_source_version["versionAsOf"],
                "versionLabel": english_source_version["versionLabel"],
                "currentTextEquivalent": False,
                "referenceViewEligible": True,
                "status": (
                    "government-reference-translation-historical-no-legal-effect"
                ),
                "note": historical_english_authority_note,
                "authorityNote": historical_english_authority_note,
                "source": EN_REFERENCE_PAGE,
                "sourceLabel": (
                    "Japanese Law Translation Database — Act No. 37 of 2021 "
                    "historical reference"
                ),
                "sourceXmlPath": f"MainProvision/Article[@Num='{number}']",
                "sourceNodeSha256": element_sha256(reference_article),
                "sourceVersion": {
                    **english_source_version,
                    "versionAlignment": (
                        "article-level-normalized-japanese-difference-verified-"
                        "historical-reference"
                    ),
                    "alignmentComparisonRecordSha256": comparison[
                        "comparisonRecordSha256"
                    ],
                },
                "japaneseTextComparison": comparison,
                "contentSha256": content_sha256(english_full_text),
                "rights": english_rights,
            }
        unit = {
            "id": unit_id,
            "instrumentId": INSTRUMENT_ID,
            "unitType": "article",
            "articleNumber": number,
            "label": f"Article {number}",
            "originalLabel": article_title,
            "title": english_caption.strip("()") or f"Article {number}",
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
            "translationStatus": translation_status,
            "translations": {"en": english_translation},
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
        unit_id = f"jp-appi-suppl-{index}"
        supplement_unit = {
                "id": unit_id,
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
                "translationStatus": (
                    "government-reference-translation-unavailable-for-supplement"
                ),
                "englishAvailability": {
                    "coverageStatus": "no-source-text",
                    "status": "not-available-in-government-reference",
                    "versionAsOf": english_source_version["versionAsOf"],
                    "versionLabel": english_source_version["versionLabel"],
                    "note": (
                        "The government reference contains no supplementary "
                        "provisions; only the current official Japanese text is stored."
                    ),
                },
                "translationReference": {
                    "language": "en",
                    "availability": "not-present-in-government-reference",
                    "sourceVersion": english_source_version,
                    "note": (
                        "The Ministry of Justice Act No. 37 of 2021 English XML "
                        "contains no supplementary provisions. No English text "
                        "is generated or inferred for this current Japanese block."
                    ),
                },
                "rights": rights,
            }
        existing = existing_supplements.get(unit_id)
        if existing:
            if existing.get("contentSha256") != supplement_unit["contentSha256"]:
                raise ValueError(
                    f"Cannot preserve {unit_id} English: Japanese content hash changed"
                )
            if existing.get("sourceNodeSha256") != supplement_unit["sourceNodeSha256"]:
                raise ValueError(
                    f"Cannot preserve {unit_id} English: Japanese source-node hash changed"
                )
            for key in (
                "translationStatus",
                "translations",
                "englishAvailability",
                "translationReference",
                "governmentReferenceAudit",
            ):
                if key in existing:
                    supplement_unit[key] = existing[key]
        units.append(supplement_unit)

    appended_tables = body.findall("AppdxTable")
    if len(appended_tables) != 2:
        raise ValueError(f"Expected two APPI appended tables, got {len(appended_tables)}")
    for index, table in enumerate(appended_tables, start=1):
        paragraphs, full_text = appendix_text(table)
        reference_table = reference_tables[index - 1]
        historical_japanese_table = historical_japanese_tables[index - 1]
        unit_id = f"jp-appi-appended-table-{index}"
        comparison = finalize_comparison_record(
            japanese_comparison_record(
                unit_id=unit_id,
                current=table,
                historical=historical_japanese_table,
                current_xml_path=f"LawBody/AppdxTable[{index}]",
                historical_xml_path=f"LawBody/AppdxTable[{index}]",
            ),
            current_document_sha256=current_document_sha256,
            historical_document_sha256=historical_japanese_document_sha256,
        )
        if comparison["normalizedTextEquivalent"]:
            raise ValueError(
                f"{unit_id} unexpectedly became equivalent; review its alignment status"
            )
        comparison_records.append(comparison)
        project_current_alignment_ids.append(unit_id)
        english_title, english_paragraphs, english_full_text = (
            current_project_appendix_english(index, table)
        )
        title = japanese_text(table.find("AppdxTableTitle")) or f"別表第{index}"
        units.append(
            {
                "id": unit_id,
                "instrumentId": INSTRUMENT_ID,
                "unitType": "appended-table",
                "appendedTableNumber": str(index),
                "label": f"Appended Table {index}",
                "originalLabel": title,
                "title": english_title,
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
                "translationStatus": (
                    "project-authored-reference-translation-no-legal-effect"
                ),
                "translations": {
                    "en": {
                        "title": english_title,
                        "paragraphs": english_paragraphs,
                        "fullText": english_full_text,
                        "language": "en",
                        "coverageStatus": "complete-current-project-reference",
                        "versionAsOf": AS_OF_TEXT,
                        "versionLabel": (
                            "Current e-Gov Japanese consolidation as of 20 July "
                            "2026 — project current-alignment reference"
                        ),
                        "currentTextEquivalent": True,
                        "referenceViewEligible": True,
                        "legalEffectStatus": (
                            "project-reference-translation-no-legal-effect"
                        ),
                        "status": (
                            "project-authored-reference-translation-no-legal-effect"
                        ),
                        "note": project_english_authority_note,
                        "authorityNote": project_english_authority_note,
                        "source": CURRENT_PAGE,
                        "sourceLabel": (
                            "e-Gov Law Search — controlling Japanese source for "
                            "nonofficial current-alignment reference"
                        ),
                        "sourceXmlPath": f"LawBody/AppdxTable[{index}]",
                        "sourceNodeSha256": element_sha256(table),
                        "sourceVersion": {
                            **common_source_version,
                            "sourceLanguage": "ja-JP",
                            "versionAlignment": (
                                "project-reference-aligned-to-current-japanese-"
                                "after-table-level-difference-review"
                            ),
                            "alignmentComparisonRecordSha256": comparison[
                                "comparisonRecordSha256"
                            ],
                        },
                        "translationBasis": {
                            "method": (
                                "human-reviewed-complete-current-table-"
                                "reconstruction-with-exact-japanese-row-lock"
                            ),
                            "sourceLanguage": "ja-JP",
                            "sourceContentSha256": content_sha256(full_text),
                            "sourceParagraphCount": len(paragraphs),
                            "currentJapaneseSourceDocumentSha256": (
                                current_document_sha256
                            ),
                            "currentJapaneseSourceNodeSha256": element_sha256(
                                table
                            ),
                            "historicalJapaneseSourceDocumentSha256": (
                                historical_japanese_document_sha256
                            ),
                            "historicalJapaneseSourceNodeSha256": element_sha256(
                                historical_japanese_table
                            ),
                            "governmentEnglishSourceDocumentSha256": (
                                snapshot_sha256(en_reference_path)
                            ),
                            "governmentEnglishSourceNodeSha256": element_sha256(
                                reference_table
                            ),
                            "comparisonRecordSha256": comparison[
                                "comparisonRecordSha256"
                            ],
                            "terminologySources": [
                                EN_REFERENCE_PAGE,
                                "https://www.japaneselawtranslation.go.jp/en/laws/view/5006/en",
                                "https://www.japaneselawtranslation.go.jp/en/laws/view/4898/en",
                                "https://www.japaneselawtranslation.go.jp/en/laws/view/4931/en",
                                "https://www.japaneselawtranslation.go.jp/en/laws/view/2754/en",
                            ],
                            "qualityBoundary": (
                                "Every current Japanese row and its order are "
                                "locked exactly before the complete English table "
                                "is emitted. Official JLT terminology is reused "
                                "where available. This is not a certified legal "
                                "translation."
                            ),
                        },
                        "japaneseTextComparison": comparison,
                        "contentSha256": content_sha256(english_full_text),
                        "rights": project_rights,
                    }
                },
                "rights": rights,
            }
        )

    expected_changed_ids = [
        "jp-appi-art-48",
        "jp-appi-art-113",
        "jp-appi-art-132",
        "jp-appi-art-136",
        "jp-appi-art-150",
        "jp-appi-art-162",
        "jp-appi-art-164",
        "jp-appi-art-176",
        "jp-appi-art-177",
        "jp-appi-art-178",
        "jp-appi-art-179",
        "jp-appi-art-180",
        "jp-appi-art-181",
        "jp-appi-appended-table-1",
        "jp-appi-appended-table-2",
    ]
    changed_ids = [
        record["unitId"]
        for record in comparison_records
        if not record["normalizedTextEquivalent"]
    ]
    if changed_ids != expected_changed_ids:
        raise ValueError(
            "APPI normalized Japanese comparison changed; expected "
            f"{expected_changed_ids}, got {changed_ids}"
        )
    if len(government_current_equivalent_ids) != 172:
        raise ValueError(
            "Expected 172 normalized-current-equivalent government English units, "
            f"got {len(government_current_equivalent_ids)}"
        )
    if project_current_alignment_ids != expected_changed_ids:
        raise ValueError(
            "Current project-English alignment set drifted: "
            f"{project_current_alignment_ids}"
        )
    if historical_mismatch_ids:
        raise ValueError(
            "No compared APPI main Article or table should remain historical, "
            f"got {historical_mismatch_ids}"
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

    comparison_record_sequence_sha256 = content_sha256(
        "\n".join(
            record["comparisonRecordSha256"] for record in comparison_records
        )
    )
    snapshots = [
        snapshot_entry(snapshot_dir, CURRENT_XML_NAME, CURRENT_SOURCE, "application/xml", "current-effective-text", "egov"),
        snapshot_entry(snapshot_dir, REVISIONS_NAME, REVISIONS_SOURCE, "application/json", "revision-history", "egov"),
        snapshot_entry(snapshot_dir, JA_REFERENCE_NAME, JA_REFERENCE_SOURCE, "application/xml", "historical-japanese-comparison-source", "jlt-pdl-1.0"),
        snapshot_entry(snapshot_dir, EN_REFERENCE_NAME, EN_REFERENCE_SOURCE, "application/xml", "government-reference-translation-and-project-adaptation-base", "jlt-pdl-1.0"),
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
            "status": "mixed-verified-government-and-project-current-references",
            "coverageStatus": "complete-current-aligned-english-reference-for-all-208-nodes",
            "totalNodeCount": 208,
            "currentAlignedUnitCount": 208,
            "temporallyMismatchedUnitCount": 0,
            "unitCountWithoutEnglishReference": 0,
            "governmentReference": {
                "source": EN_REFERENCE_PAGE,
                "lastVersion": "Act No. 37 of 2021",
                "versionAsOf": english_source_version["versionAsOf"],
                "versionLabel": english_source_version["versionLabel"],
                "translatedOn": "2021-11-05",
                "publishedOnDatabase": "2023-03-01",
                "dictionaryVersion": "14.0",
                "mainArticleCount": len(reference_articles),
                "appendedTableCount": len(reference_tables),
                "supplementaryProvisionCount": 0,
                "normalizedCurrentEquivalentUnitCount": len(
                    government_current_equivalent_ids
                ),
                "normalizedChangedUnitCount": len(changed_ids),
                "currentTextEquivalent": (
                    "true-only-for-the-172-unit-ids-verified-by-the-alignment-audit"
                ),
                "applicabilityStatus": (
                    "article-level-current-equivalence-verified; changed-units-"
                    "replaced-by-project-current-references"
                ),
            },
            "projectCurrentAlignmentReference": {
                "versionAsOf": AS_OF_TEXT,
                "unitCount": len(project_current_alignment_ids),
                "mainArticleCount": 13,
                "appendedTableCount": 2,
                "unitIds": project_current_alignment_ids,
                "currentTextEquivalent": True,
                "status": (
                    "project-authored-reference-translation-no-legal-effect"
                ),
                "license": "CC BY 4.0",
                "sourceTranslationLicense": "Public Data License (Version 1.0)",
            },
            "projectSupplementReference": {
                "manifest": (
                    "data/v2/jp-appi-supplement-project-english-manifest.json"
                ),
                "versionAsOf": AS_OF_TEXT,
                "supplementaryProvisionCount": 21,
                "currentTextEquivalent": True,
                "status": (
                    "project-authored-reference-translation-no-legal-effect"
                ),
                "license": "CC BY 4.0",
            },
            "alignmentAudit": {
                "method": COMPARISON_METHOD,
                "comparedUnitCount": len(comparison_records),
                "normalizedEquivalentUnitCount": len(
                    government_current_equivalent_ids
                ),
                "normalizedChangedUnitCount": len(changed_ids),
                "changedUnitIds": changed_ids,
                "projectCurrentAlignmentUnitIds": project_current_alignment_ids,
                "remainingHistoricalMismatchUnitIds": historical_mismatch_ids,
                "currentJapaneseSource": CURRENT_SOURCE,
                "currentJapaneseSourceDocumentSha256": current_document_sha256,
                "historicalJapaneseSource": JA_REFERENCE_SOURCE,
                "historicalJapaneseSourceDocumentSha256": (
                    historical_japanese_document_sha256
                ),
                "comparisonRecordSequenceSha256": (
                    comparison_record_sequence_sha256
                ),
                "recordLocation": (
                    "Each compared Article/table translation stores its complete "
                    "japaneseTextComparison record and record hash."
                ),
            },
            "legalEffect": (
                "Only the original Japanese text has legal effect. Government "
                "English is reused only for normalized-identical Japanese nodes; "
                "changed Articles, tables and all supplementary blocks use "
                "separately labelled nonofficial project references."
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
            "projectCurrentAlignmentReference": project_rights,
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
