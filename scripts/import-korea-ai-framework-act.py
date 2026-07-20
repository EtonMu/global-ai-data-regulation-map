#!/usr/bin/env python3
"""Build the current Korean AI Framework Act corpus from pinned MOLEG XML.

As of 2026-07-20, the final Act No. 21311 phase is still scheduled for the next
day. The emitted corpus therefore has 44 current main Articles. The 46-Article
2026-07-21 projection is frozen separately and never merged into current text.
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
    snapshot_entry,
)
from legal_corpus_utils import content_sha256, snapshot_sha256, write_json


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SNAPSHOT_DIR = ROOT / "data" / "v2" / "source-snapshots"
DEFAULT_OUTPUT = (
    ROOT / "data" / "v2" / "kr-ai-framework-act-2025-current-articles.json"
)
DEFAULT_MANIFEST = (
    ROOT / "data" / "v2" / "kr-ai-framework-act-2025-corpus-manifest.json"
)

AS_OF = "2026-07-20"
CURRENT_NAME = "kr-ai-014820-current-effective-2026-07-20.xml"
INDEX_NAME = "kr-ai-014820-effective-date-index-2026-07-20.xml"
FUTURE_NAME = "kr-ai-014820-future-2026-07-21.xml"
EN_INDEX_NAME = "kr-ai-014820-english-reference-index-2026-07-20.xml"
EN_AUDIT_NAME = "kr-ai-014820-klri-english-reference-audit-2026-07-20.json"

CURRENT_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
    "&MST=282791&efYd=20260122&type=XML"
)
INDEX_API = (
    "https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML"
    "&query=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%20%EB%B0%9C%EC%A0%84%EA%B3%BC%20"
    "%EC%8B%A0%EB%A2%B0%20%EA%B8%B0%EB%B0%98%20%EC%A1%B0%EC%84%B1%20%EB%93%B1%EC%97%90%20"
    "%EA%B4%80%ED%95%9C%20%EA%B8%B0%EB%B3%B8%EB%B2%95&display=100"
)
FUTURE_API = (
    "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
    "&MST=282791&efYd=20260721&type=XML"
)
EN_INDEX_API = (
    "https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML"
    "&query=FRAMEWORK%20ACT%20ON%20THE%20DEVELOPMENT%20OF%20ARTIFICIAL%20"
    "INTELLIGENCE&display=100"
)
KLRI_REFERENCE = (
    "https://elaw.klri.re.kr/eng_mobile/viewer.do?"
    "hseq=73499&key=54&type=sogan"
)

EXPECTED_SNAPSHOT_HASHES = {
    CURRENT_NAME: "a05b63d5021be2ce30076f674213d3e9d04afbd5137966a5ac1e7db50992c27d",
    INDEX_NAME: "acf472c8691c8aaedf78f92692744b2fefbd1e32f820ffd1a742ccb07e8863ca",
    FUTURE_NAME: "1212c9922d92e5c2313a773ee8b4db1931666d0f879cf7b50ee2d60750f98177",
    EN_INDEX_NAME: "01d7b8b5fa07c34e94cdaebf306dbe19c14c503ffd9082a966c8ef7064b87b27",
    EN_AUDIT_NAME: "0edecc47016ffc1d9256e384b146065f4c7f57664303a6e1c9c764883884917a",
}

ENGLISH_TITLE = (
    "FRAMEWORK ACT ON THE DEVELOPMENT OF ARTIFICIAL INTELLIGENCE AND THE "
    "CREATION OF A FOUNDATION FOR TRUST"
)

TRANSLATION_REFERENCE = {
    "language": "en",
    "availability": "external-link-only",
    "title": ENGLISH_TITLE,
    "source": KLRI_REFERENCE,
    "sourceLabel": "KLRI Statutes of the Republic of Korea — reference English",
    "sourceVersion": "Act No. 20676 as amended by Act No. 21311",
    "versionAlignment": (
        "46-English-article-headings-align-with-the-2026-07-21-future-effective-"
        "Korean-phase-not-the-44-Article-current-phase"
    ),
    "legalEffect": "reference-only-no-legal-or-official-authority",
    "currentLanguageToggleEligible": False,
    "reasonNotAttached": (
        "The English reference includes the 2026-07-21 scheduled phase and is not "
        "the 2026-07-20 current consolidation. KLRI also prohibits unauthorized "
        "reproduction or distribution of its translation material."
    ),
    "copyrightPolicy": "https://elaw.klri.re.kr/eng_service/askCopyright.do",
}

CONFIG = KoreanCorpusConfig(
    instrument_id="kr-ai-framework-act-2025",
    law_id="014820",
    mst="282791",
    official_title="인공지능 발전과 신뢰 기반 조성 등에 관한 기본법",
    promulgated_on="2026-01-20",
    promulgation_number="21311",
    effective_phase_date="2026-01-22",
    as_of=AS_OF,
    current_source_url=CURRENT_API,
    current_page_url=(
        "https://www.law.go.kr/LSW/lsInfoP.do?"
        "lsiSeq=282791&efYd=20260122&urlMode=lsInfoP"
    ),
    source_label="Korean Law Information Center — current effective Korean text",
    expected_main_article_count=44,
    expected_structural_heading_count=7,
    expected_supplement_count=3,
    expected_article_sequence_sha256=(
        "f1767c6fbc093e0e21c585471961c5ae70ecdd3c10fa523cd0797c5a900b91e0"
    ),
    translation_status="external-future-phase-reference-not-current-no-toggle",
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


def validate_english_index(path: Path) -> dict:
    root = ET.parse(path).getroot()
    record = next(
        (
            node
            for node in root.findall("law")
            if compact_text(node.findtext("법령명한글"))
            == "인공지능 발전과 신뢰 기반 조성 등에 관한 기본법"
        ),
        None,
    )
    if record is None:
        raise ValueError("AI Framework Act missing from English-reference index")
    expected = {
        "법령일련번호": "268543",
        "현행연혁코드": "연혁",
        "공포일자": "20250121",
        "공포번호": "20676",
        "시행일자": "20260122",
    }
    for tag, value in expected.items():
        actual = compact_text(record.findtext(tag))
        if actual != value:
            raise ValueError(f"English index expected {tag}={value}, got {actual}")
    return {tag: compact_text(record.findtext(tag)) for tag in expected}


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
    future_path = snapshot_dir / FUTURE_NAME
    en_index_path = snapshot_dir / EN_INDEX_NAME
    en_audit_path = snapshot_dir / EN_AUDIT_NAME

    index_records = effective_index_records(index_path, CONFIG.official_title)
    expected_index_phases = {
        ("282791", "현행", "20260122"),
        ("282791", "시행예정", "20260721"),
        ("268543", "연혁", "20260122"),
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
        raise ValueError("Official effective-date index is missing a pinned AI Act phase")

    english_index_record = validate_english_index(en_index_path)
    en_audit = json.loads(en_audit_path.read_text(encoding="utf-8"))
    if (
        en_audit["articleAudit"]["observedArticleHeadingCount"] != 46
        or en_audit["source"]["observedLatestAmendment"]
        != "Act No. 21311, Jan. 20, 2026"
    ):
        raise ValueError("KLRI AI Act reference-version audit is inconsistent")

    corpus, counts = build_current_corpus(current_path, index_path, CONFIG)
    future = inspect_phase(future_path, "2026-07-21")
    if future["mainArticleCount"] != 46:
        raise ValueError("The 2026-07-21 AI Act phase must contain 46 main Articles")
    if (
        future["articleNumberSequenceSha256"]
        != "a029a23aa0ccaecc602ed0d77a2e403231bab60695b6db4b765852a500e6eb6b"
    ):
        raise ValueError("Future AI Act Article number sequence failed audit")

    current_article_ids = {unit["id"] for unit in corpus if unit["unitType"] == "article"}
    for future_id in (
        "kr-ai-framework-act-2025-art-17-2",
        "kr-ai-framework-act-2025-art-22-3",
    ):
        if future_id in current_article_ids:
            raise ValueError(f"Future Article leaked into current corpus: {future_id}")
    if "kr-ai-framework-act-2025-art-22-2" not in current_article_ids:
        raise ValueError("Current Article 22-2 is missing")

    write_json(args.output, corpus)
    manifest = {
        "instrumentId": CONFIG.instrument_id,
        "lawId": CONFIG.law_id,
        "officialTitle": CONFIG.official_title,
        "referenceEnglishTitle": ENGLISH_TITLE,
        "retrievedOn": AS_OF,
        "hashAlgorithm": "SHA-256",
        "enactment": {
            "actNumber": "20676",
            "promulgatedOn": "2025-01-21",
            "generalEffectiveFrom": "2026-01-22",
            "formalStatus": "enacted-binding-framework-statute",
        },
        "interveningAmendment": {
            "actNumber": "21065",
            "promulgatedOn": "2025-10-01",
            "type": "consequential-government-organization-amendment",
            "effectiveWithThisActFrom": "2026-01-22",
        },
        "currentVersion": {
            "asOf": AS_OF,
            "masterSequence": CONFIG.mst,
            "promulgationNumber": CONFIG.promulgation_number,
            "promulgatedOn": CONFIG.promulgated_on,
            "effectivePhaseDate": CONFIG.effective_phase_date,
            "lifecycleStatus": "in-force-with-final-amendment-phase-scheduled-next-day",
            "textStatus": "current-effective-Korean-only",
            "futureEffectiveTextIncluded": False,
            "verification": (
                "The MOLEG effective-date index classifies MST 282791 / "
                "2026-01-22 as 현행 and the 2026-07-21 phase as 시행예정 on "
                "2026-07-20."
            ),
        },
        "corpus": {
            "path": "data/v2/kr-ai-framework-act-2025-current-articles.json",
            **counts,
        },
        "promulgatedFuturePhases": [
            {
                "amendingActNumber": "21311",
                "promulgatedOn": "2026-01-20",
                "masterSequence": "282791",
                **future,
                "includedInCurrentCorpus": False,
                "phaseNote": (
                    "Final Act No. 21311 phase. It adds Articles 17-2 and 22-3 "
                    "and commences specified changes in Articles 3, 6, 16, 18, "
                    "and 35."
                ),
            }
        ],
        "translation": {
            **TRANSLATION_REFERENCE,
            "MOLEGEnglishIndexBoundary": {
                "masterSequence": english_index_record["법령일련번호"],
                "promulgationNumber": english_index_record["공포번호"],
                "promulgatedOn": "2025-01-21",
                "status": "original-enactment-only-outdated-after-Act-No-21311",
            },
            "KLRIReferenceBoundary": {
                "latestAmendment": "Act No. 21311, Jan. 20, 2026",
                "referenceMainArticleCount": 46,
                "referenceArticleNumberSequenceSha256": (
                    en_audit["articleAudit"]["articleNumberSequenceSha256"]
                ),
                "alignment": "future-effective-2026-07-21-phase",
            },
            "bodyStored": False,
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
                "reuseStatus": "external-link-only-no-redistribution",
                "copyrightOwner": "Korea Legislation Research Institute",
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
                FUTURE_NAME,
                FUTURE_API,
                "application/xml",
                "promulgated-future-phase-2026-07-21",
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
