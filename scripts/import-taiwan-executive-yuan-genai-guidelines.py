#!/usr/bin/env python3
"""Build the complete Taiwan public-sector GenAI guidance corpus.

The controlling source is the Traditional-Chinese ODT published by Taiwan's
National Science and Technology Council (NSTC).  The document contains a
general explanation followed by ten numbered points.  This importer preserves
all fifteen source paragraphs as one explanation node and ten point nodes.

No English body is emitted.  The Executive Yuan's English page is a contextual
press release about the draft, not a complete official translation of the
final ten-point guidance.
"""

from __future__ import annotations

import argparse
from hashlib import sha256
from html import unescape
import json
from pathlib import Path
import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "v2"
DEFAULT_SNAPSHOT_DIR = DATA_ROOT / "source-snapshots"
DEFAULT_OUTPUT = (
    DATA_ROOT
    / "tw-executive-yuan-generative-ai-guidelines-2023-points.json"
)
DEFAULT_MANIFEST = (
    DATA_ROOT
    / "tw-executive-yuan-generative-ai-guidelines-2023-corpus-manifest.json"
)

AS_OF = "2026-07-20"
INSTRUMENT_ID = "tw-executive-yuan-generative-ai-guidelines-2023"
OFFICIAL_TITLE = "行政院及所屬機關（構）使用生成式AI參考指引"
DISPATCH_NUMBER = "院授科會前字第1120059686號"

NSTC_INDEX_URL = (
    "https://www.nstc.gov.tw/folksonomy/list/"
    "c79bf57b-dc94-4aff-8d14-3262b5559cfc?l=ch"
)
NSTC_ODT_URL = (
    "https://www.nstc.gov.tw/nstc/attachments/"
    "99619717-6c5e-4270-b3b8-46f2041c228c"
)
NSTC_PDF_URL = (
    "https://www.nstc.gov.tw/nstc/attachments/"
    "da74d556-5b1b-4cbd-9015-901cce87ff91"
)
NSTC_RIGHTS_URL = (
    "https://www.nstc.gov.tw/folksonomy/detail/"
    "a22a29a9-03d7-4d55-850a-f4f6ca1a04e9?l=ch"
)
SME_FINAL_NOTICE_URL = "https://www.sme.gov.tw/article-tw-2391-11626"
EY_ENGLISH_CONTEXT_URL = (
    "https://english.ey.gov.tw/Page/61BF20C3E89B856/"
    "d57a1a70-c0b0-4481-9845-a6265437a8ff"
)
NPA_DISPATCH_EVIDENCE_URL = (
    "https://www.pa.npa.gov.tw/ch/app/news/doc?"
    "detailNo=1169462101308084224&module=news&type=s"
)
MODA_RELATED_PLAYBOOK_URL = (
    "https://moda.gov.tw/digital-affairs/digital-service/ai-resource/18248"
)

SNAPSHOTS = {
    "ey_english_context": (
        "tw-genai-guidelines-ey-draft-english-context-2026-07-20.html",
        "f779534bfdf90a77503257ab96b9098352209098d37b813c56bf6507cb23eb00",
    ),
    "npa_dispatch": (
        "tw-genai-guidelines-npa-dispatch-corroboration-2023.pdf",
        "1f2850bfcc280ffd91e4e394c4ea983f062f02d10d5d5f2b4643ea12d9671f41",
    ),
    "moda_related_playbook": (
        "tw-genai-guidelines-moda-related-playbook-2026-07-20.html",
        "857ce09b694229895f9a739b1046d5fcf2cac28a245f15541913a97c0c104735",
    ),
    "nstc_index": (
        "tw-genai-guidelines-nstc-current-index-2026-07-20.html",
        "1178e55ce643591b159ce50adefa9602fffa4ce29e4664fd19f96926a9eda1a0",
    ),
    "nstc_odt": (
        "tw-genai-guidelines-nstc-official-2023-10-03.odt",
        "35261ef2c939eff5334dfeb5c258a5e8cbd1981accdae72b3ca3c2b65933e453",
    ),
    "nstc_pdf": (
        "tw-genai-guidelines-nstc-official-2023-10-03.pdf",
        "d61384ee42bf1f29a1479b45ed9ea26b9f76f9d65ada23930564ca9af9a15e55",
    ),
    "nstc_rights": (
        "tw-genai-guidelines-nstc-open-data-declaration-2026-07-20.html",
        "ebb7cda16f5dab1edc63755b9a7bd48fbf989670cb55a33d979c173ed7546d1e",
    ),
    "sme_final_notice": (
        "tw-genai-guidelines-sme-final-issuance-notice-2026-07-20.html",
        "eee8f948500a20d6fd13aac56e76db1e629654aa091d58a442430a828e116635",
    ),
}

POINT_METADATA = {
    "1": {
        "title": "目的與風險範圍",
        "summary": (
            "以提升行政效率為目的，並將國家安全、資訊安全、人權、隱私、"
            "倫理及法律風險列為各機關使用生成式AI時的基本治理範圍。"
        ),
        "coreConceptIds": [
            "ai-risk-management",
            "security-controls",
            "sensitive-data-protection",
            "accountability-governance",
        ],
    },
    "2": {
        "title": "人工最終判斷與自主性",
        "summary": (
            "生成資訊不得取代承辦人的客觀專業最終判斷、自主思維、創造力"
            "與人際互動。"
        ),
        "coreConceptIds": [
            "human-oversight",
            "ai-risk-management",
            "accountability-governance",
        ],
    },
    "3": {
        "title": "機密文書禁用生成式AI",
        "summary": (
            "國家機密與一般公務機密文書必須由承辦人親自撰寫，禁止使用"
            "生成式AI製作。"
        ),
        "coreConceptIds": ["security-controls", "accountability-governance"],
    },
    "4": {
        "title": "機密與個人資料輸入限制",
        "summary": (
            "不得向生成式AI提供或詢問涉密、公務未公開或個人資料；封閉式"
            "地端部署在確認環境安全後，可依文書或資訊機密等級分級使用。"
        ),
        "coreConceptIds": [
            "security-controls",
            "sensitive-data-protection",
            "data-minimization",
            "privacy-by-design-default",
        ],
    },
    "5": {
        "title": "產出查核與公務決策限制",
        "summary": (
            "機關不得完全信任未經確認的生成內容，也不得直接據此作成行政"
            "行為或將其作為公務決策的唯一依據。"
        ),
        "coreConceptIds": [
            "human-oversight",
            "automated-decision-safeguards",
            "accountability-governance",
            "ai-risk-management",
        ],
    },
    "6": {
        "title": "生成式AI輔助使用揭露",
        "summary": (
            "各機關以生成式AI輔助執行業務或提供服務時，應作適當揭露。"
        ),
        "coreConceptIds": [
            "transparency-explainability",
            "accountability-governance",
        ],
    },
    "7": {
        "title": "法規遵循、權利保護與內控",
        "summary": (
            "使用生成式AI須遵守資通安全、個資、著作權及資訊使用規定，"
            "注意智慧財產權與人格權風險；機關可依設備及業務制定規範或內控。"
        ),
        "coreConceptIds": [
            "security-controls",
            "sensitive-data-protection",
            "accountability-governance",
            "ai-risk-management",
        ],
    },
    "8": {
        "title": "採購與供應商治理",
        "summary": (
            "機關辦理採購時，應要求得標者注意本指引，並遵守機關依第七點"
            "制定的規範或內控措施。"
        ),
        "coreConceptIds": [
            "third-party-supply-chain",
            "accountability-governance",
        ],
    },
    "9": {
        "title": "公營與受政府支持機構準用",
        "summary": (
            "公營事業、公立學校、行政法人及政府捐助的財團法人得準用本指引。"
        ),
        "coreConceptIds": ["accountability-governance"],
    },
    "10": {
        "title": "其他機關參照",
        "summary": (
            "行政院及其所屬機關（構）以外的機關，得參照本指引制定自身的"
            "生成式AI使用規範。"
        ),
        "coreConceptIds": ["accountability-governance"],
    },
}

GENERAL_METADATA = {
    "title": "制定背景與治理原則",
    "summary": (
        "說明生成式AI帶來的行政效率與資訊、權利及機密風險，確立負責任、"
        "可信賴、安全、隱私、資料治理及問責等總體原則，並要求保留人員的"
        "自主權與控制權。"
    ),
    "coreConceptIds": [
        "ai-risk-management",
        "security-controls",
        "sensitive-data-protection",
        "training-data-governance",
        "human-oversight",
        "accountability-governance",
    ],
}

CHINESE_NUMBERS = {
    "一": "1",
    "二": "2",
    "三": "3",
    "四": "4",
    "五": "5",
    "六": "6",
    "七": "7",
    "八": "8",
    "九": "9",
    "十": "10",
}


def digest_bytes(value: bytes) -> str:
    return sha256(value).hexdigest()


def digest_text(value: str) -> str:
    return digest_bytes(value.encode("utf-8"))


def read_snapshot(snapshot_dir: Path, key: str) -> bytes:
    filename, expected = SNAPSHOTS[key]
    path = snapshot_dir / filename
    if not path.exists():
        raise FileNotFoundError(path)
    value = path.read_bytes()
    actual = digest_bytes(value)
    if actual != expected:
        raise ValueError(f"Pinned snapshot hash mismatch for {filename}: {actual}")
    return value


def compact_text(value: str) -> str:
    return re.sub(r"[\t\r\n \u00a0\u3000]+", " ", value).strip()


def visible_html_text(value: bytes) -> str:
    decoded = value.decode("utf-8")
    decoded = re.sub(r"<(script|style)\b[\s\S]*?</\1>", " ", decoded, flags=re.I)
    return compact_text(unescape(re.sub(r"<[^>]+>", " ", decoded)))


def extract_odt_paragraphs(path: Path) -> tuple[list[str], dict[str, str | int]]:
    with ZipFile(path) as archive:
        content = archive.read("content.xml")
        meta = ET.fromstring(archive.read("meta.xml"))

    root = ET.fromstring(content)
    text_namespace = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    paragraph_tags = {
        f"{{{text_namespace}}}p",
        f"{{{text_namespace}}}h",
    }
    paragraphs = [
        compact_text("".join(element.itertext()))
        for element in root.iter()
        if element.tag in paragraph_tags
    ]
    paragraphs = [value for value in paragraphs if value]

    meta_namespace = "urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
    dc_namespace = "http://purl.org/dc/elements/1.1/"
    created = compact_text(
        meta.findtext(f".//{{{meta_namespace}}}creation-date") or ""
    )
    modified = compact_text(meta.findtext(f".//{{{dc_namespace}}}date") or "")
    generator = compact_text(
        meta.findtext(f".//{{{meta_namespace}}}generator") or ""
    )
    return paragraphs, {
        "odtCreationDate": created,
        "odtModifiedDate": modified,
        "odtGenerator": generator,
        "contentXmlSha256": digest_bytes(content),
    }


def parse_document(paragraphs: list[str]) -> tuple[list[str], list[dict]]:
    if paragraphs.count(OFFICIAL_TITLE) != 1:
        raise ValueError("Official title must appear exactly once in the ODT")
    title_index = paragraphs.index(OFFICIAL_TITLE)
    body = paragraphs[title_index + 1 :]
    if len(body) != 15:
        raise ValueError(f"Expected 15 body paragraphs, found {len(body)}")

    numbered = re.compile(r"^([一二三四五六七八九十]+)、")
    first_point = next(
        (index for index, paragraph in enumerate(body) if numbered.match(paragraph)),
        None,
    )
    if first_point != 4:
        raise ValueError("Expected four general-explanation paragraphs")
    general = body[:first_point]

    points: list[dict] = []
    current: dict | None = None
    for source_index, paragraph in enumerate(body[first_point:], start=first_point + 1):
        match = numbered.match(paragraph)
        if match:
            chinese_number = match.group(1)
            if chinese_number not in CHINESE_NUMBERS:
                raise ValueError(f"Unsupported point number: {chinese_number}")
            current = {
                "number": CHINESE_NUMBERS[chinese_number],
                "chineseNumber": chinese_number,
                "paragraphs": [paragraph],
                "sourceParagraphOrdinals": [source_index],
            }
            points.append(current)
        elif current is not None:
            current["paragraphs"].append(paragraph)
            current["sourceParagraphOrdinals"].append(source_index)
        else:
            raise ValueError("Unnumbered paragraph appeared before Point 1")

    actual_numbers = [point["number"] for point in points]
    expected_numbers = [str(index) for index in range(1, 11)]
    if actual_numbers != expected_numbers:
        raise ValueError(f"Expected Points 1-10; found {actual_numbers}")

    reconstructed = list(general)
    for point in points:
        reconstructed.extend(point["paragraphs"])
    if reconstructed != body:
        raise ValueError("ODT source paragraphs were omitted or reordered")
    return general, points


def common_node_fields() -> dict:
    return {
        "instrumentId": INSTRUMENT_ID,
        "language": "zh-Hant-TW",
        "versionAsOf": AS_OF,
        "issuedOn": "2023-10-03",
        "status": "current-active-guidance",
        "legalEffectStatus": "active-non-binding-public-sector-guidance",
        "legalForce": "non-binding-public-sector-guidance",
        "appliesFrom": None,
        "statusNote": (
            "The NSTC FAQ states that the guidance is not a law, is not mandatory, "
            "and establishes no penalty. It remains the single current attachment "
            "set exposed by the official NSTC guidance page as of 2026-07-20."
        ),
        "textAvailability": "full-official-traditional-chinese",
        "source": NSTC_ODT_URL,
        "sourcePage": NSTC_INDEX_URL,
        "sourceLabel": (
            "National Science and Technology Council — official Traditional-"
            "Chinese ODT"
        ),
        "authorityNote": (
            "The complete official Traditional-Chinese text is preserved. The "
            "navigation title and high-level summary are editorial metadata and "
            "are not part of the source document."
        ),
        "translationStatus": "no-complete-official-english-text-located",
        "currentLanguageToggleEligible": False,
        "rightsProfile": "tw-nstc-government-open-data-license-v1",
    }


def build_corpus(general: list[str], points: list[dict]) -> list[dict]:
    corpus: list[dict] = []
    general_text = "\n\n".join(general)
    corpus.append(
        {
            "id": f"{INSTRUMENT_ID}-general-explanation",
            **common_node_fields(),
            "unitType": "general-explanation",
            "unitNumber": None,
            "label": "總說明",
            "officialLabel": "總說明",
            "originalTitle": "總說明",
            "title": GENERAL_METADATA["title"],
            "titleStatus": "editorial-navigation-heading",
            "summary": GENERAL_METADATA["summary"],
            "summaryStatus": "editorial-high-level-summary",
            "paragraphs": general,
            "fullText": general_text,
            "sourceParagraphOrdinals": [1, 2, 3, 4],
            "coreConceptIds": GENERAL_METADATA["coreConceptIds"],
            "thematicRelevance": {
                "isRelevant": True,
                "highlightEntireUnit": True,
                "themes": [
                    "AI governance",
                    "information security",
                    "privacy and data governance",
                    "accountability",
                ],
            },
            "contentSha256": digest_text(general_text),
        }
    )

    for point in points:
        number = point["number"]
        metadata = POINT_METADATA[number]
        full_text = "\n\n".join(point["paragraphs"])
        corpus.append(
            {
                "id": f"{INSTRUMENT_ID}-point-{number}",
                **common_node_fields(),
                "unitType": "numbered-point",
                "unitNumber": number,
                "chineseNumber": point["chineseNumber"],
                "label": f"第{point['chineseNumber']}點",
                "officialLabel": f"{point['chineseNumber']}、",
                "originalTitle": f"第{point['chineseNumber']}點",
                "title": metadata["title"],
                "titleStatus": "editorial-navigation-heading",
                "summary": metadata["summary"],
                "summaryStatus": "editorial-high-level-summary",
                "paragraphs": point["paragraphs"],
                "fullText": full_text,
                "sourceParagraphOrdinals": point["sourceParagraphOrdinals"],
                "coreConceptIds": metadata["coreConceptIds"],
                "thematicRelevance": {
                    "isRelevant": True,
                    "highlightEntireUnit": True,
                    "themes": ["AI governance"],
                },
                "contentSha256": digest_text(full_text),
            }
        )
    return corpus


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def snapshot_entry(
    snapshot_dir: Path,
    key: str,
    source_url: str,
    media_type: str,
    role: str,
    rights_profile: str,
) -> dict:
    filename, expected = SNAPSHOTS[key]
    actual = digest_bytes((snapshot_dir / filename).read_bytes())
    if actual != expected:
        raise ValueError(f"Snapshot changed while importing: {filename}")
    return {
        "path": f"data/v2/source-snapshots/{filename}",
        "sourceUrl": source_url,
        "retrievedOn": AS_OF,
        "mediaType": media_type,
        "role": role,
        "sha256": actual,
        "rightsProfile": rights_profile,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot-dir", type=Path, default=DEFAULT_SNAPSHOT_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    snapshot_dir: Path = args.snapshot_dir
    for key in SNAPSHOTS:
        read_snapshot(snapshot_dir, key)

    nstc_index_text = visible_html_text(read_snapshot(snapshot_dir, "nstc_index"))
    if OFFICIAL_TITLE not in nstc_index_text:
        raise ValueError("NSTC index no longer exposes the official title")
    raw_index = read_snapshot(snapshot_dir, "nstc_index").decode("utf-8")
    for attachment_id in (
        "da74d556-5b1b-4cbd-9015-901cce87ff91",
        "99619717-6c5e-4270-b3b8-46f2041c228c",
    ):
        if raw_index.count(attachment_id) != 1:
            raise ValueError(f"NSTC attachment index mismatch: {attachment_id}")

    final_notice_text = visible_html_text(
        read_snapshot(snapshot_dir, "sme_final_notice")
    )
    if (
        "行政院於112年10月3日函頒" not in final_notice_text
        or "本參考指引共計十點如下" not in final_notice_text
    ):
        raise ValueError("Official final-issuance notice failed version audit")

    rights_text = visible_html_text(read_snapshot(snapshot_dir, "nstc_rights"))
    for anchor in (
        "政府資料開放授權條款-第1版",
        "以無償、非專屬、得由使用者再授權之方式提供公眾使用",
        "使用時應註明出處",
        "不得惡意變更其相關資訊",
    ):
        if anchor not in rights_text:
            raise ValueError(f"NSTC rights declaration missing anchor: {anchor}")

    english_context = visible_html_text(
        read_snapshot(snapshot_dir, "ey_english_context")
    )
    if (
        "Cabinet approves draft guidelines" not in english_context
        or "At Thursday's weekly Cabinet meeting" not in english_context
    ):
        raise ValueError("Executive Yuan English context snapshot is unexpected")

    related_playbook = visible_html_text(
        read_snapshot(snapshot_dir, "moda_related_playbook")
    )
    for anchor in (
        "公部門人工智慧應用參考手冊",
        "建立日期： 2025-12-17",
        "更新日期： 2026-02-03",
        "訂定本手冊，供各機關參考運用",
    ):
        if anchor not in related_playbook:
            raise ValueError(f"MODA related-guidance audit missing anchor: {anchor}")

    odt_path = snapshot_dir / SNAPSHOTS["nstc_odt"][0]
    source_paragraphs, odt_metadata = extract_odt_paragraphs(odt_path)
    general, points = parse_document(source_paragraphs)
    corpus = build_corpus(general, points)

    if len(corpus) != 11:
        raise ValueError("Corpus must contain one explanation and ten points")
    if any("translations" in node for node in corpus):
        raise ValueError("No English translations may be emitted")

    write_json(args.output, corpus)
    corpus_bytes = args.output.read_bytes()
    source_body = "\n\n".join(source_paragraphs[1:])
    corpus_content = "\n\n".join(node["fullText"] for node in corpus)
    if source_body != corpus_content:
        raise ValueError("Corpus does not preserve every official source paragraph")

    manifest = {
        "instrumentId": INSTRUMENT_ID,
        "officialTitle": OFFICIAL_TITLE,
        "retrievedOn": AS_OF,
        "hashAlgorithm": "SHA-256",
        "classification": {
            "category": "government-guideline",
            "hierarchyLevel": "executive-branch-guidance",
            "legalForce": "non-binding-public-sector-guidance",
            "targetAudience": "Executive Yuan and subordinate agencies (institutions)",
        },
        "issuingHistory": {
            "issuingBody": "Executive Yuan",
            "draftingBody": "National Science and Technology Council",
            "cabinetDraftBriefingOn": "2023-08-31",
            "issuedOn": "2023-10-03",
            "dispatchNumber": DISPATCH_NUMBER,
        },
        "currentVersion": {
            "asOf": AS_OF,
            "status": "active-current-official-guidance",
            "officialTitle": OFFICIAL_TITLE,
            "issuedOn": "2023-10-03",
            "dispatchNumber": DISPATCH_NUMBER,
            "latestRevisionOn": None,
            "revisionAuditConclusion": (
                "The official NSTC guidance index exposed one current item and a "
                "single matching PDF/ODT attachment pair as of 2026-07-20. No "
                "official amendment notice or alternate revised full text was "
                "located on the reviewed Executive Yuan and NSTC sources."
            ),
            "attachmentProvenanceNote": (
                "The ODT metadata records 2023-10-30. The origin server reported "
                "the same date as Last-Modified; this is treated as file/upload "
                "provenance, not as an amendment date."
            ),
            "futureRevisionTextIncluded": False,
        },
        "relatedLaterGuidance": {
            "title": "公部門人工智慧應用參考手冊",
            "issuingBody": "Ministry of Digital Affairs",
            "createdOn": "2025-12-17",
            "officialPageUpdatedOn": "2026-02-03",
            "source": MODA_RELATED_PLAYBOOK_URL,
            "relationship": (
                "separate-complementary-public-sector-AI-implementation-playbook"
            ),
            "supersessionStatus": (
                "The reviewed official pages do not state that this separate "
                "playbook amends, replaces, repeals, or supersedes the Executive "
                "Yuan's 2023 ten-point GenAI guidance. It is therefore not merged "
                "into this instrument corpus."
            ),
            "includedInCorpus": False,
        },
        "corpus": {
            "path": (
                "data/v2/tw-executive-yuan-generative-ai-guidelines-2023-"
                "points.json"
            ),
            "nodeCount": len(corpus),
            "generalExplanationNodeCount": 1,
            "generalExplanationParagraphCount": len(general),
            "numberedPointCount": len(points),
            "numberedPointParagraphCount": sum(
                len(point["paragraphs"]) for point in points
            ),
            "sourceBodyParagraphCount": len(source_paragraphs) - 1,
            "normalizedFullTextCharacterCount": sum(
                len(node["fullText"]) for node in corpus
            ),
            "sourceBodySha256": digest_text(source_body),
            "contentSha256": digest_text(corpus_content),
            "fileSha256": digest_bytes(corpus_bytes),
            "completeSourceCoverageVerified": True,
            "pointNumberSequenceSha256": digest_text(
                "\n".join(point["number"] for point in points)
            ),
        },
        "sourceDocumentMetadata": {
            **odt_metadata,
            "sourceParagraphCountIncludingTitle": len(source_paragraphs),
            "normalizedDocumentTextSha256": digest_text(
                "\n\n".join(source_paragraphs)
            ),
        },
        "translation": {
            "language": "en",
            "status": "no-complete-official-english-text-located",
            "bodyStored": False,
            "currentLanguageToggleEligible": False,
            "officialContextSource": EY_ENGLISH_CONTEXT_URL,
            "officialContextSourceStatus": (
                "English Executive Yuan press release about the 2023-08-31 draft; "
                "not a point-by-point or complete translation of the final guidance"
            ),
            "reasonNotAttached": (
                "No complete official English text corresponding to the final "
                "Traditional-Chinese general explanation and ten numbered points "
                "was located. No editorial translation was generated."
            ),
        },
        "rights": {
            "primaryTraditionalChineseText": {
                "reuseStatus": (
                    "government-open-data-license-v1-subject-to-attribution-and-"
                    "published-exceptions"
                ),
                "license": "政府資料開放授權條款－第1版",
                "licenseUrl": NSTC_RIGHTS_URL,
                "attributionRequired": True,
                "attribution": (
                    "Source: National Science and Technology Council, Taiwan — "
                    f"{OFFICIAL_TITLE}."
                ),
                "scopeNote": (
                    "The NSTC declaration applies to copyrightable website data "
                    "and materials unless specially excluded. It excludes other "
                    "intellectual-property rights, agency marks, specified third-"
                    "party works, and requires respect for moral rights and no "
                    "malicious alteration."
                ),
            },
            "editorialMetadata": {
                "license": "repository project license",
                "note": (
                    "Navigation titles, summaries, concept tags, status notes and "
                    "version analysis are editorial and are clearly separated from "
                    "the official source text."
                ),
            },
        },
        "sourceSnapshots": [
            snapshot_entry(
                snapshot_dir,
                "nstc_odt",
                NSTC_ODT_URL,
                "application/vnd.oasis.opendocument.text",
                "complete-current-official-Traditional-Chinese-source",
                "tw-nstc-government-open-data-license-v1",
            ),
            snapshot_entry(
                snapshot_dir,
                "nstc_pdf",
                NSTC_PDF_URL,
                "application/pdf",
                "official-layout-equivalent-source",
                "tw-nstc-government-open-data-license-v1",
            ),
            snapshot_entry(
                snapshot_dir,
                "nstc_index",
                NSTC_INDEX_URL,
                "text/html",
                "current-official-guidance-index-and-attachment-record",
                "tw-nstc-government-open-data-license-v1",
            ),
            snapshot_entry(
                snapshot_dir,
                "sme_final_notice",
                SME_FINAL_NOTICE_URL,
                "text/html",
                "official-final-issuance-date-and-full-point-corroboration",
                "Taiwan-government-website-open-data",
            ),
            snapshot_entry(
                snapshot_dir,
                "npa_dispatch",
                NPA_DISPATCH_EVIDENCE_URL,
                "application/pdf",
                "official-dispatch-number-corroboration",
                "Taiwan-government-publication-audit",
            ),
            snapshot_entry(
                snapshot_dir,
                "ey_english_context",
                EY_ENGLISH_CONTEXT_URL,
                "text/html",
                "English-availability-boundary-draft-context-not-translation",
                "Taiwan-Executive-Yuan-open-data",
            ),
            snapshot_entry(
                snapshot_dir,
                "moda_related_playbook",
                MODA_RELATED_PLAYBOOK_URL,
                "text/html",
                "later-separate-guidance-supersession-boundary",
                "Taiwan-MODA-government-website-open-data",
            ),
            snapshot_entry(
                snapshot_dir,
                "nstc_rights",
                NSTC_RIGHTS_URL,
                "text/html",
                "reuse-rights-and-attribution-policy",
                "tw-nstc-government-open-data-license-v1",
            ),
        ],
        "versionEvidence": {
            "officialCurrentIndex": NSTC_INDEX_URL,
            "officialFinalIssuanceNotice": SME_FINAL_NOTICE_URL,
            "officialDispatchNumberCorroboration": NPA_DISPATCH_EVIDENCE_URL,
            "englishAvailabilityBoundary": EY_ENGLISH_CONTEXT_URL,
            "laterSeparateGuidanceBoundary": MODA_RELATED_PLAYBOOK_URL,
        },
    }
    manifest["manifestContentBasisSha256"] = digest_text(
        json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    )
    write_json(args.manifest, manifest)


if __name__ == "__main__":
    main()
