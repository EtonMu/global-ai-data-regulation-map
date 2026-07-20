#!/usr/bin/env python3
"""Build the current Korean PIPA corpus from pinned MOLEG snapshots.

Only Korean text effective on 2026-07-20 is emitted. Act No. 21445 is preserved
as two future-effective snapshots (2026-09-11 and 2027-07-01) and is never
merged into current provision nodes. The current 126-Article / 12-addenda
government English reference is imported from MOLEG's official Law Open Data
API with a no-official-effect notice and the agency's reuse-policy evidence.
The separately published KLRI version remains an external link only.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from korea_legal_corpus_utils import (
    KoreanCorpusConfig,
    build_current_corpus,
    compact_text,
    effective_index_records,
    inspect_phase,
    parse_moleg_english_open_data,
    snapshot_entry,
)
from legal_corpus_utils import content_sha256, snapshot_sha256, write_json


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SNAPSHOT_DIR = ROOT / "data" / "v2" / "source-snapshots"
DEFAULT_OUTPUT = ROOT / "data" / "v2" / "kr-pipa-2011-current-articles.json"
DEFAULT_MANIFEST = ROOT / "data" / "v2" / "kr-pipa-2011-corpus-manifest.json"

AS_OF = "2026-07-20"
CURRENT_NAME = "kr-pipa-011357-current-effective-2026-07-20.xml"
INDEX_NAME = "kr-pipa-011357-effective-date-index-2026-07-20.xml"
FUTURE_2026_NAME = "kr-pipa-011357-future-2026-09-11.xml"
FUTURE_2027_NAME = "kr-pipa-011357-future-2027-07-01.xml"
EN_INDEX_NAME = "kr-pipa-011357-english-reference-index-2026-07-20.xml"
EN_AUDIT_NAME = "kr-pipa-011357-klri-english-reference-audit-2026-07-20.json"
EN_TEXT_NAME = "kr-pipa-011357-moleg-english-current-2026-07-20.xml"
MOLEG_RIGHTS_NAME = "kr-moleg-legal-effect-copyright-policy-2026-07-20.html"

CURRENT_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
    "&MST=270351&efYd=20251002&type=XML"
)
INDEX_API = (
    "https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML"
    "&query=%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4%20%EB%B3%B4%ED%98%B8%EB%B2%95"
    "&display=100"
)
FUTURE_2026_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
    "&MST=283839&efYd=20260911&type=XML"
)
FUTURE_2027_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
    "&MST=283839&efYd=20270701&type=XML"
)
EN_INDEX_API = (
    "https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML"
    "&query=PERSONAL%20INFORMATION%20PROTECTION%20ACT&display=100"
)
EN_TEXT_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=elaw"
    "&MST=270351&type=XML"
)
EN_TEXT_PAGE = (
    "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=270351&chrClsCd=010203"
    "&urlMode=engLsInfoR&viewCls=engLsInfoR"
)
MOLEG_RIGHTS_PAGE = (
    "https://www.law.go.kr/LSW/lawPetitionForm.do?menuId=13&query=&subMenuId=79"
)
KLRI_REFERENCE = (
    "https://elaw.klri.re.kr/eng_mobile/viewer.do?"
    "hseq=71740&key=71&type=sogan"
)

EXPECTED_SNAPSHOT_HASHES = {
    CURRENT_NAME: "ec140965df7274d13dab65d3a20e3450c5309062e049b50bc6e1016c9f4d4347",
    INDEX_NAME: "4ad63c701bdfd611469c2c0b66a4e1dff8d266a053b04e2d50ab8fe0c0a8042b",
    FUTURE_2026_NAME: "bc5c8a721550e59d337b790dd80633bc01e544a327a947200e28b6ab3f1da003",
    FUTURE_2027_NAME: "439dbb535654eacac7615f030eb72903c4c905c55ffaa1606e9621d0dde8b541",
    EN_INDEX_NAME: "ef23509327605284075650b1dc1214cf8b472d3200833905548fe1389074a85f",
    EN_AUDIT_NAME: "97288d8d89ee7228ed37f51ef3afb8e177313dad4536bdd82c51cb8de83c769d",
    EN_TEXT_NAME: "735ab5302a6a7e90119dda8dd02eac227dc36f06d7adef5a82946c27e3ce1a83",
    MOLEG_RIGHTS_NAME: "984f8e79534da759684858199c60979665b9af3bf504a27d55413e56d8ddc3c5",
}

TRANSLATION_REFERENCE = {
    "language": "en",
    "availability": "complete-current-reference-stored",
    "coverageStatus": "complete-current-reference",
    "title": "PERSONAL INFORMATION PROTECTION ACT",
    "source": EN_TEXT_PAGE,
    "sourceLabel": "Korean Law Information Center — government English reference",
    "sourceVersion": "Act No. 20897, Apr. 1, 2025",
    "versionAsOf": "2025-10-02",
    "versionLabel": "Act No. 20897 (effective 2025-10-02)",
    "versionAlignment": "all-126-main-article-numbers-align-with-current-Korean-MST-270351",
    "legalEffect": "reference-only-no-legal-or-official-authority",
    "currentLanguageToggleEligible": True,
    "rightsBasis": (
        "MOLEG's official legal-information policy opens supplied legal information "
        "for free reuse, including commercial use, while excluding unlicensed "
        "third-party-rights material from the supplied dataset."
    ),
    "rightsPolicy": MOLEG_RIGHTS_PAGE,
}

CONFIG = KoreanCorpusConfig(
    instrument_id="kr-pipa-2011",
    law_id="011357",
    mst="270351",
    official_title="개인정보 보호법",
    promulgated_on="2025-04-01",
    promulgation_number="20897",
    effective_phase_date="2025-10-02",
    as_of=AS_OF,
    current_source_url=CURRENT_API,
    current_page_url=(
        "https://www.law.go.kr/LSW/lsInfoP.do?"
        "lsiSeq=270351&efYd=20251002&urlMode=lsInfoP"
    ),
    source_label="Korean Law Information Center — current effective Korean text",
    expected_main_article_count=126,
    expected_structural_heading_count=13,
    expected_supplement_count=12,
    expected_article_sequence_sha256=(
        "fe8bf7df85b48c94bb60a54ea662942bcc319c666d81f56d3fe68cfc996f9855"
    ),
    translation_status="government-current-reference-stored-no-legal-effect",
    translation_reference=TRANSLATION_REFERENCE,
)


def validate_snapshots(snapshot_dir: Path) -> None:
    for filename, expected_hash in EXPECTED_SNAPSHOT_HASHES.items():
        path = snapshot_dir / filename
        if not path.exists():
            raise FileNotFoundError(path)
        actual = snapshot_sha256(path)
        if actual != expected_hash:
            raise ValueError(f"Pinned snapshot hash mismatch for {filename}: {actual}")


def validate_english_index(path: Path) -> None:
    root = ET.parse(path).getroot()
    record = next(
        (
            node
            for node in root.findall("law")
            if compact_text(node.findtext("법령명한글")) == "개인정보 보호법"
        ),
        None,
    )
    if record is None:
        raise ValueError("PIPA missing from official English-reference index")
    expected = {
        "법령일련번호": "270351",
        "현행연혁코드": "현행",
        "공포일자": "20250401",
        "공포번호": "20897",
        "시행일자": "20251002",
    }
    for tag, value in expected.items():
        actual = compact_text(record.findtext(tag))
        if actual != value:
            raise ValueError(f"English index expected {tag}={value}, got {actual}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot-dir", type=Path, default=DEFAULT_SNAPSHOT_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    snapshot_dir: Path = args.snapshot_dir
    validate_snapshots(snapshot_dir)
    current_path = snapshot_dir / CURRENT_NAME
    index_path = snapshot_dir / INDEX_NAME
    future_2026_path = snapshot_dir / FUTURE_2026_NAME
    future_2027_path = snapshot_dir / FUTURE_2027_NAME
    en_index_path = snapshot_dir / EN_INDEX_NAME
    en_audit_path = snapshot_dir / EN_AUDIT_NAME
    en_text_path = snapshot_dir / EN_TEXT_NAME
    moleg_rights_path = snapshot_dir / MOLEG_RIGHTS_NAME

    rights_text = moleg_rights_path.read_text(encoding="utf-8")
    for required in (
        "영리 목적의 이용을 포함하여 자유로운 활용이 보장됩니다",
        "제3자의 권리가 포함된 것으로",
    ):
        if required not in rights_text:
            raise ValueError(f"MOLEG reuse-policy language missing: {required}")

    index_records = effective_index_records(index_path, CONFIG.official_title)
    expected_index_phases = {
        ("270351", "현행", "20251002"),
        ("283839", "시행예정", "20260911"),
        ("283839", "시행예정", "20270701"),
    }
    actual_index_phases = {
        (
            record["masterSequence"],
            record["lifecycleCode"],
            record["effectiveOn"],
        )
        for record in index_records
    }
    if not expected_index_phases.issubset(actual_index_phases):
        raise ValueError("Official effective-date index is missing a pinned PIPA phase")

    validate_english_index(en_index_path)
    en_audit = json.loads(en_audit_path.read_text(encoding="utf-8"))
    if (
        en_audit["articleAudit"]["observedArticleHeadingCount"] != 126
        or en_audit["source"]["observedLatestAmendment"]
        != "Act No. 20897, Apr. 1, 2025"
    ):
        raise ValueError("KLRI PIPA reference-version audit is inconsistent")

    corpus, counts = build_current_corpus(current_path, index_path, CONFIG)
    english = parse_moleg_english_open_data(en_text_path)
    if (
        english["lawId"] != CONFIG.law_id
        or english["actNumber"] != "20897"
        or english["promulgatedOn"] != "20250401"
        or len(english["articles"]) != 126
        or len(english["supplements"]) != 12
    ):
        raise ValueError("MOLEG PIPA English full-text response has changed")

    english_rights = {
        "reuseStatus": "moleg-law-open-data-free-use",
        "policyUrl": MOLEG_RIGHTS_PAGE,
        "policySnapshotSha256": snapshot_sha256(moleg_rights_path),
        "basis": (
            "MOLEG states that supplied legal information is open to everyone and "
            "may be freely used, including commercially; material with unlicensed "
            "third-party rights is excluded from the supplied dataset."
        ),
        "attribution": (
            "Source: Korean Law Information Center, Ministry of Government "
            "Legislation, Republic of Korea."
        ),
    }
    english_source_version = {
        "masterSequence": "270351",
        "actNumber": "20897",
        "promulgatedOn": "2025-04-01",
        "effectiveFrom": "2025-10-02",
        "versionAsOf": "2025-10-02",
        "versionLabel": "Act No. 20897 (effective 2025-10-02)",
        "sourceDocumentSha256": snapshot_sha256(en_text_path),
        "versionAlignment": (
            "all-126-main-articles-and-12-addenda-align-with-current-Korean-MST-270351"
        ),
    }
    english_note = (
        "Complete government English reference aligned with Act No. 20897 and "
        "the Korean consolidation effective 2 October 2025. MOLEG states that "
        "foreign-language statute information has no official effect; the "
        "promulgated Korean text controls."
    )
    article_units = [unit for unit in corpus if unit["unitType"] == "article"]
    supplement_units = [
        unit for unit in corpus if unit["unitType"] == "supplementary-provision-block"
    ]
    if [unit["articleNumber"] for unit in article_units] != list(english["articles"]):
        raise ValueError("PIPA English and Korean Article number sequences do not align")
    for unit in article_units:
        record = english["articles"][unit["articleNumber"]]
        unit["title"] = record["title"]
        unit["translations"] = {
            "en": {
                "title": record["title"],
                "paragraphs": record["paragraphs"],
                "fullText": record["fullText"],
                "language": "en",
                "status": "government-reference-translation-no-legal-effect",
                "coverageStatus": "complete-current-reference",
                "versionAsOf": "2025-10-02",
                "versionLabel": "Act No. 20897 (effective 2025-10-02)",
                "currentTextEquivalent": True,
                "referenceViewEligible": True,
                "note": english_note,
                "authorityNote": english_note,
                "source": EN_TEXT_PAGE,
                "sourceLabel": (
                    "Korean Law Information Center — government English reference"
                ),
                "sourceXmlPath": record["sourceXmlPath"],
                "sourceNodeSha256": record["sourceNodeSha256"],
                "sourceVersion": english_source_version,
                "contentSha256": record["contentSha256"],
                "rights": english_rights,
            }
        }
    if [unit.get("amendingActNumber") for unit in supplement_units] != [
        record["amendingActNumber"] for record in english["supplements"]
    ]:
        raise ValueError("PIPA English and Korean addenda Act numbers do not align")
    for unit, record in zip(supplement_units, english["supplements"], strict=True):
        unit["translations"] = {
            "en": {
                "title": record["title"],
                "paragraphs": record["paragraphs"],
                "fullText": record["fullText"],
                "language": "en",
                "status": "government-reference-translation-no-legal-effect",
                "coverageStatus": "complete-current-reference",
                "versionAsOf": "2025-10-02",
                "versionLabel": "Act No. 20897 (effective 2025-10-02)",
                "currentTextEquivalent": True,
                "referenceViewEligible": True,
                "note": english_note,
                "authorityNote": english_note,
                "source": EN_TEXT_PAGE,
                "sourceLabel": (
                    "Korean Law Information Center — government English reference"
                ),
                "sourceXmlPath": record["sourceXmlPath"],
                "sourceNodeSha256": record["sourceNodeSha256"],
                "sourceVersion": english_source_version,
                "contentSha256": record["contentSha256"],
                "rights": english_rights,
            }
        }
    future_2026 = inspect_phase(future_2026_path, "2026-09-11")
    future_2027 = inspect_phase(future_2027_path, "2027-07-01")
    if future_2026["mainArticleCount"] != 127:
        raise ValueError("Act No. 21445 first phase must contain 127 main Articles")
    if future_2027["mainArticleCount"] != 127:
        raise ValueError("Act No. 21445 second phase must contain 127 main Articles")

    current_article_ids = {unit["id"] for unit in corpus if unit["unitType"] == "article"}
    if "kr-pipa-2011-art-30-3" in current_article_ids:
        raise ValueError("Future Article 30-3 leaked into current PIPA corpus")
    automated = next(unit for unit in corpus if unit["id"] == "kr-pipa-2011-art-37-2")
    for required in ("거부할 수 있는 권리", "설명 등을 요구", "인적 개입", "쉽게 확인"):
        if required not in automated["fullText"]:
            raise ValueError(f"Article 37-2 audit phrase missing: {required}")

    write_json(args.output, corpus)
    manifest = {
        "instrumentId": CONFIG.instrument_id,
        "lawId": CONFIG.law_id,
        "officialTitle": CONFIG.official_title,
        "referenceEnglishTitle": "Personal Information Protection Act",
        "retrievedOn": AS_OF,
        "hashAlgorithm": "SHA-256",
        "currentVersion": {
            "asOf": AS_OF,
            "masterSequence": CONFIG.mst,
            "promulgationNumber": CONFIG.promulgation_number,
            "promulgatedOn": CONFIG.promulgated_on,
            "effectivePhaseDate": CONFIG.effective_phase_date,
            "lifecycleStatus": "in-force-with-promulgated-future-amendment-phases",
            "textStatus": "current-effective-Korean-only",
            "futureEffectiveTextIncluded": False,
            "verification": (
                "The MOLEG effective-date index classifies MST 270351 / "
                "2025-10-02 as 현행 and Act No. 21445 phases as 시행예정."
            ),
        },
        "corpus": {
            "path": "data/v2/kr-pipa-2011-current-articles.json",
            **counts,
        },
        "automatedDecisionRightsAudit": {
            "status": "verified-current-effective",
            "generalRightSource": "kr-pipa-2011-art-4",
            "detailedRightSource": automated["id"],
            "article37_2ContentSha256": automated["contentSha256"],
            "verifiedElements": [
                "right to refuse a wholly automated decision with significant effects, subject to statutory exceptions",
                "right to request an explanation",
                "controller duty to withhold the automated result or provide human reprocessing or explanation absent just cause",
                "controller transparency duty for criteria, procedure, and processing method",
            ],
        },
        "promulgatedFuturePhases": [
            {
                "amendingActNumber": "21445",
                "promulgatedOn": "2026-03-10",
                "masterSequence": "283839",
                **future_2026,
                "includedInCurrentCorpus": False,
                "phaseNote": (
                    "General Act No. 21445 phase. It adds Article 30-3 and changes, "
                    "among other matters, controller governance and breach notification."
                ),
            },
            {
                "amendingActNumber": "21445",
                "promulgatedOn": "2026-03-10",
                "masterSequence": "283839",
                **future_2027,
                "includedInCurrentCorpus": False,
                "phaseNote": (
                    "Later phase for the mandatory-certification proviso in Article "
                    "32-2(1) and its corresponding administrative fine."
                ),
            },
        ],
        "translation": {
            **TRANSLATION_REFERENCE,
            "officialIndexMasterSequence": "270351",
            "referenceMainArticleCount": 126,
            "referenceSupplementaryProvisionBlockCount": 12,
            "attachedReferenceUnitCount": 138,
            "referenceArticleNumberSequenceSha256": (
                en_audit["articleAudit"]["articleNumberSequenceSha256"]
            ),
            "futureAct21445Included": False,
            "bodyStored": True,
            "sourceDocumentSha256": snapshot_sha256(en_text_path),
            "authorityNote": (
                "MOLEG states that foreign-language statute information has no "
                "official effect and that Korean prevails in case of discrepancy."
            ),
        },
        "rights": {
            "primaryKoreanText": {
                "reuseStatus": "korean-statutory-text-not-copyright-protected",
                "basis": "Republic of Korea Copyright Act Article 7(1)",
                "publicDataPolicy": (
                    "https://www.law.go.kr/LSW/lawPetitionForm.do?"
                    "menuId=13&subMenuId=79"
                ),
            },
            "referenceTranslation": {
                **english_rights,
                "sourceDataset": "MOLEG target=elaw official English-law Open API",
            },
            "alternativeKLRIReference": {
                "reuseStatus": "external-link-only-no-redistribution",
                "copyrightOwner": "Korea Legislation Research Institute",
                "source": KLRI_REFERENCE,
                "copyrightPolicy": "https://elaw.klri.re.kr/eng_service/askCopyright.do",
            },
        },
        "sourceSnapshots": [
            snapshot_entry(
                snapshot_dir,
                CURRENT_NAME,
                CURRENT_API,
                "application/xml",
                "current-effective-text",
                "moleg-open-data-statutory-text",
            ),
            snapshot_entry(
                snapshot_dir,
                INDEX_NAME,
                INDEX_API,
                "application/xml",
                "effective-date-version-index",
                "moleg-open-data",
            ),
            snapshot_entry(
                snapshot_dir,
                FUTURE_2026_NAME,
                FUTURE_2026_API,
                "application/xml",
                "promulgated-future-phase-2026-09-11",
                "moleg-open-data-statutory-text",
            ),
            snapshot_entry(
                snapshot_dir,
                FUTURE_2027_NAME,
                FUTURE_2027_API,
                "application/xml",
                "promulgated-future-phase-2027-07-01",
                "moleg-open-data-statutory-text",
            ),
            snapshot_entry(
                snapshot_dir,
                EN_INDEX_NAME,
                EN_INDEX_API,
                "application/xml",
                "official-English-reference-version-index",
                "moleg-open-data-metadata",
            ),
            snapshot_entry(
                snapshot_dir,
                EN_AUDIT_NAME,
                KLRI_REFERENCE,
                "application/json",
                "English-reference-version-and-rights-audit-no-translation-text",
                "audit-metadata-only",
            ),
            snapshot_entry(
                snapshot_dir,
                EN_TEXT_NAME,
                EN_TEXT_API,
                "application/xml",
                "current-government-English-reference-full-text",
                "moleg-law-open-data-free-use",
            ),
            snapshot_entry(
                snapshot_dir,
                MOLEG_RIGHTS_NAME,
                MOLEG_RIGHTS_PAGE,
                "text/html",
                "government-open-data-reuse-policy",
                "rights-audit",
            ),
        ],
    }
    manifest["corpus"]["fileSha256"] = snapshot_sha256(args.output)
    manifest["manifestContentBasisSha256"] = content_sha256(
        json.dumps(
            {
                "current": manifest["currentVersion"],
                "corpus": manifest["corpus"],
                "future": manifest["promulgatedFuturePhases"],
                "translation": manifest["translation"],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    write_json(args.manifest, manifest)


if __name__ == "__main__":
    main()
