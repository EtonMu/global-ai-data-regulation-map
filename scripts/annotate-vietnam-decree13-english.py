#!/usr/bin/env python3
"""Attach a complete nonofficial English reference to historical Decree 13/2023.

The pinned Vietnamese Gazette transcription remains unchanged and controlling.
Every English node is a machine-assisted project reference, locked to the source
hash and explicitly marked as historical because Decree 356/2025 repealed Decree
13/2023 in full from 1 January 2026.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
CORPUS_PATH = DATA / "vn-decree-13-2023-historical-provisions.json"
HANDOFF_PATH = DATA / "legal-corpus-handoff-vietnam.json"
CATALOGUE_PATH = DATA / "source-snapshots" / "vn-decree-13-2023-project-en-draft-2026-07-20.json"
MANIFEST_PATH = DATA / "vn-decree-13-2023-project-english-manifest.json"
AS_OF = "2026-07-20"
SCRIPT_VERSION = "1.1.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
SOURCE_URL = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/4/13nd.signed.pdf"
REPEAL_SOURCE = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf"


ARTICLE_TITLES = {
    1: "Scope and Entities to Which This Decree Applies",
    2: "Interpretation",
    3: "Principles of Personal Data Protection",
    4: "Handling Violations of Personal Data Protection Regulations",
    5: "State Administration of Personal Data Protection",
    6: "Application of This Decree, Related Laws and International Treaties",
    7: "International Cooperation on Personal Data Protection",
    8: "Prohibited Acts",
    9: "Rights of Data Subjects",
    10: "Obligations of Data Subjects",
    11: "Consent of the Data Subject",
    12: "Withdrawal of Consent",
    13: "Notice of Personal Data Processing",
    14: "Provision of Personal Data",
    15: "Rectification of Personal Data",
    16: "Storage, Erasure and Destruction of Personal Data",
    17: "Processing Personal Data Without the Data Subject's Consent",
    18: "Processing Personal Data Obtained from Audio and Video Recording in Public Places",
    19: "Processing Personal Data of Persons Declared Missing or Deceased",
    20: "Processing Children's Personal Data",
    21: "Personal Data Protection in Marketing and Advertising Product Introduction Services",
    22: "Unlawful Collection, Transfer, Purchase and Sale of Personal Data",
    23: "Notification of Personal Data Protection Violations",
    24: "Personal Data Processing Impact Assessment",
    25: "Overseas Transfer of Personal Data",
    26: "Personal Data Protection Measures",
    27: "Protection of Basic Personal Data",
    28: "Protection of Sensitive Personal Data",
    29: "Specialized Personal Data Protection Agency and National Portal for Personal Data Protection",
    30: "Conditions for Personal Data Protection Activities",
    31: "Funding for Personal Data Protection Activities",
    32: "Responsibilities of the Ministry of Public Security",
    33: "Responsibilities of the Ministry of Information and Communications",
    34: "Responsibilities of the Ministry of National Defence",
    35: "Responsibilities of the Ministry of Science and Technology",
    36: "Responsibilities of Ministries, Ministerial-Level Agencies and Government-Attached Agencies",
    37: "Responsibilities of Provincial-Level People's Committees",
    38: "Responsibilities of the Personal Data Controller",
    39: "Responsibilities of the Personal Data Processor",
    40: "Responsibilities of the Personal Data Controller and Processor",
    41: "Responsibilities of Third Parties",
    42: "Responsibilities of Related Organizations and Individuals",
    43: "Entry into Force",
    44: "Implementation Responsibilities",
}

FORM_TITLES = {
    "01": "Personal Data Provision Request Form (for Individuals)",
    "02": "Personal Data Provision Request Form (for Organizations and Enterprises)",
    "03": "Notice of a Personal Data Protection Violation",
    "04": "Notice of Submission of a Personal Data Processing Impact Assessment Dossier",
    "05": "Notice of Changes to Dossier Contents",
    "06": "Overseas Personal Data Transfer Impact Assessment Dossier",
}

# Semantic corrections verified directly against the pinned Vietnamese text.
# Keeping them here makes regeneration deterministic and prevents later draft
# refreshes from reintroducing known machine-translation errors.
ARTICLE_PARAGRAPH_OVERRIDES = {
    (11, 15): "11. Through authorization under the Civil Code, an organization or individual may, on behalf of the data subject, carry out procedures relating to the processing of the data subject's personal data with the Personal Data Controller or the Personal Data Controller and Processor, provided that the data subject has been clearly informed and has consented as prescribed in Clause 3 of this Article, unless otherwise provided by law.",
    (14, 1): "1. The data subject may request the Personal Data Controller or the Personal Data Controller and Processor to provide the data subject with their personal data.",
    (21, 3): "3. Organizations and individuals providing marketing and advertising product-introduction services are responsible for demonstrating that their use of the personal data of customers to whom products are introduced complies with Clauses 1 and 2 of this Article.",
    (24, 22): "5. The Ministry of Public Security (Department of Cybersecurity and High-Tech Crime Prevention) evaluates the Personal Data Processing Impact Assessment Dossier and requires the Personal Data Controller, the Personal Data Controller and Processor, or the Personal Data Processor to complete it if the dossier is incomplete or does not comply with regulations.",
    (24, 23): "6. The Personal Data Controller, the Personal Data Controller and Processor, or the Personal Data Processor must update and supplement the Personal Data Processing Impact Assessment Dossier when the contents of the dossier submitted to the Ministry of Public Security (Department of Cybersecurity and High-Tech Crime Prevention) change, using Form No. 05 in the Appendix to this Decree.",
    (25, 1): "1. Personal data of Vietnamese citizens may be transferred abroad if the Overseas Data Transferor prepares an Overseas Personal Data Transfer Impact Assessment Dossier and carries out the procedures prescribed in Clauses 3, 4 and 5 of this Article. The Overseas Data Transferor includes the Personal Data Controller, the Personal Data Controller and Processor, the Personal Data Processor, and a Third Party.",
    (25, 14): "5. The Ministry of Public Security (Department of Cybersecurity and High-Tech Crime Prevention) evaluates the Overseas Personal Data Transfer Impact Assessment Dossier and requires the Overseas Data Transferor to complete it if the dossier is incomplete or does not comply with regulations.",
    (25, 15): "6. The Overseas Data Transferor must update and supplement the Overseas Personal Data Transfer Impact Assessment Dossier when the contents of the dossier submitted to the Ministry of Public Security (Department of Cybersecurity and High-Tech Crime Prevention) change, using Form No. 05 in the Appendix to this Decree. The Overseas Data Transferor has 10 days from the date of the request to complete the dossier.",
    (42, 1): "1. Take measures to protect their personal data and be responsible for the accuracy of the personal data they provide.",
}

# The official Gazette linearizes form tables and footnotes across display lines.
# These narrowly scoped edits preserve the exact source-line order while correcting
# machine-draft errors that arise from split sentences, column merges and placeholders.
FORM_PARAGRAPH_OVERRIDES = {
    ("01", 0): "Form No. 01",
    ("01", 3): ".........., date ...... month ...... year ......",
    ("01", 4): "PERSONAL DATA PROVISION REQUEST FORM",
    ("01", 6): "To: ..................................................",
    ("01", 16): "8. Number of prior personal data provision requests:",
    ("01", 17): "a) First request b) Other: .......... (state the number of prior requests for provision of the",
    ("01", 18): "above information)",
    ("01", 19): "Copy-request details:",
    ("01", 20): "9. Number of copies: ...............................................................................................",
    ("01", 22): "□ Collect at the place where provision is requested",
    ("01", 27): "11. Attached documents (where applicable): ...........................................",
    ("01", 28): "REQUESTER",
    ("01", 31): "Under Civil Code provisions on representatives and guardians, where the person requesting the",
    ("01", 32): "provision of information is a minor, a person with limited civil act capacity, a person who has lost civil act",
    ("01", 33): "capacity, or a person who has difficulty perceiving or controlling their acts...",
    ("01", 41): "Printed copy, duplicate, photograph or data file.",
    ("02", 0): "Form No. 02",
    ("02", 3): ".........., date ...... month ...... year ......",
    ("02", 4): "PERSONAL DATA PROVISION REQUEST FORM",
    ("02", 6): "To: ...............................................",
    ("02", 10): "Identification-document details:",
    ("02", 11): "3. ID card number/Citizen identification card number/Passport number: ......................................",
    ("02", 15): "Requested-data details:",
    ("02", 16): "6. Personal data requested: ...........................................................................................",
    ("02", 18): "8. Number of prior personal data provision requests:",
    ("02", 19): "a) First request b) Other: ......... (state the number of prior requests for provision of the",
    ("02", 20): "above information)",
    ("02", 21): "Copy-request details:",
    ("02", 22): "9. Number of copies: ...............................................................................................",
    ("02", 23): "Receipt-method details:",
    ("02", 24): "10. Method of receiving documents, dossiers and materials:",
    ("02", 25): "□ Collect at the place where provision of information is requested",
    ("02", 30): "11. Attached documents (where applicable): ....",
    ("02", 31): "REQUESTER",
    ("02", 38): "Printed copy, duplicate, photograph or data file.",
    ("03", 0): "Form No. 03",
    ("03", 1): "NAME OF ORGANIZATION    SOCIALIST REPUBLIC OF VIETNAM",
    ("03", 3): "No.: ....., date ... month ... year ...",
    ("03", 8): "In implementation of the personal data protection regulations, ..................1 notifies the Ministry of Public Security of a personal data protection violation.",
    ("03", 9): "Details are as follows:",
    ("03", 14): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("03", 15): "Registration Certificate/Investment Certificate No. ..... issued by .... on date ... month ...",
    ("03", 25): "- Conduct: ..............................................................................................................",
    ("03", 39): "(Name of agency, organization or enterprise) undertakes to be responsible before",
    ("03", 40): "the law for the accuracy and lawfulness of the information provided and the documents",
    ("03", 41): "attached thereto.",
    ("03", 42): "Recipients:    ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("04", 0): "Form No. 04",
    ("04", 1): "NAME OF ORGANIZATION    SOCIALIST REPUBLIC OF VIETNAM",
    ("04", 3): "No.: ........, date ... month ... year ...",
    ("04", 5): "SUBMISSION OF A PERSONAL DATA PROCESSING IMPACT ASSESSMENT DOSSIER",
    ("04", 9): "In implementation of the personal data protection regulations, ..................1 submits the following Personal Data Processing Impact Assessment",
    ("04", 10): "Dossier to the Ministry of Public Security:",
    ("04", 15): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("04", 16): "Registration Certificate/Investment Certificate No. ..... issued by .... on date ... month ...",
    ("04", 23): "2. Personal Data Processing Impact Assessment Dossier",
    ("04", 27): "(Name of agency, organization or enterprise) undertakes to be responsible before",
    ("04", 28): "the law for the accuracy and lawfulness of the Personal Data Processing Impact Assessment",
    ("04", 29): "Dossier and the documents attached thereto.",
    ("04", 30): "Recipients:    ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("05", 0): "Form No. 05",
    ("05", 1): "NAME OF ORGANIZATION    SOCIALIST REPUBLIC OF VIETNAM",
    ("05", 3): "No.: ........, date ... month ... year ...",
    ("05", 5): "CHANGE TO DOSSIER CONTENTS",
    ("05", 8): "In implementation of the personal data protection regulations, ..................2 submits the following dossier-content change notification to the Ministry of Public Security.",
    ("05", 9): "Details are as follows:",
    ("05", 14): "- Establishment Decision/Enterprise Registration Certificate/Business Registration",
    ("05", 15): "Certificate/Investment Certificate No. ..... issued by .... on date ... month ... year ... at ...",
    ("05", 21): "2. Brief description of changes to the dossier contents",
    ("05", 28): "(Name of agency, organization or enterprise) undertakes to be responsible before the",
    ("05", 29): "law for the accuracy and lawfulness of the changes and the documents attached thereto.",
    ("05", 30): "Recipients:    ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("05", 34): "Dossier name: Personal Data Processing Impact Assessment Dossier or Overseas Personal Data Transfer Impact Assessment",
    ("05", 35): "Dossier.",
    ("06", 0): "Form No. 06",
    ("06", 1): "NAME OF ORGANIZATION    SOCIALIST REPUBLIC OF VIETNAM",
    ("06", 3): "No.: ........, date ... month ... year ...",
    ("06", 4): "PERSONAL DATA TRANSFER IMPACT ASSESSMENT DOSSIER",
    ("06", 5): "FOR TRANSFERS ABROAD",
    ("06", 8): "In implementation of the personal data protection regulations, ..................1 submits the following Overseas Personal Data Transfer Impact Assessment",
    ("06", 9): "Dossier to the Ministry of Public Security:",
    ("06", 14): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("06", 15): "Registration Certificate/Investment Certificate No. ...... issued by .... on date ... month ...",
    ("06", 22): "2. Overseas Personal Data Transfer Impact Assessment Dossier",
    ("06", 26): "(Name of agency, organization or enterprise) undertakes to be responsible before",
    ("06", 27): "the law for the accuracy and lawfulness of the Overseas Personal Data Transfer Impact Assessment",
    ("06", 28): "Dossier and the documents attached thereto.",
    ("06", 29): "Recipients:    ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
}


def sha256(value: str | bytes) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def normalized_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    value = value.translate({0x200B: None, 0x200C: None, 0x200D: None, 0xFEFF: None})
    replacements = [
        (r"\bParty that controls and processes personal data\b", "Personal Data Controller and Processor"),
        (r"\bParty that controls personal data\b", "Personal Data Controller"),
        (r"\bParty processing personal data\b", "Personal Data Processor"),
        (r"\bPersonal Data Processing and Control Party\b", "Personal Data Controller and Processor"),
        (r"\bPersonal Data Processing Party\b", "Personal Data Processor"),
        (r"\bPersonal Data Controller and Processing Party\b", "Personal Data Controller and Processor"),
        (r"\bController and processor of personal data\b", "Personal Data Controller and Processor"),
        (r"\bController of personal data\b", "Personal Data Controller"),
        (r"\bData Controller and Processor\b", "Personal Data Controller and Processor"),
        (r"\bData Controller\b", "Personal Data Controller"),
        (r"\bData Processor\b", "Personal Data Processor"),
        (r"\bThird party\b", "Third Party"),
        (r"\bDepartment of Cyber Security and High-Tech Crime Prevention and Control\b", "Department of Cybersecurity and High-Tech Crime Prevention"),
        (r"\bDepartment of Cyber Security and Crime Prevention Using High Technology\b", "Department of Cybersecurity and High-Tech Crime Prevention"),
        (r"\bDepartment of Cyber Security and High-Tech Crime Prevention\b", "Department of Cybersecurity and High-Tech Crime Prevention"),
        (r"\bNational information portal on personal data protection\b", "National Portal for Personal Data Protection"),
        (r"\bRecord assessing the impact of its personal data processing\b", "Personal Data Processing Impact Assessment Dossier"),
        (r"\bRecords assessing the impact of personal data processing\b", "Personal Data Processing Impact Assessment Dossier"),
        (r"\bDocuments assessing the impact of processing personal data\b", "Personal Data Processing Impact Assessment Dossier"),
        (r"\bPersonal Data Processing Impact Assessment Profile\b", "Personal Data Processing Impact Assessment Dossier"),
        (r"\bDocuments assessing the impact of transferring personal data abroad\b", "Overseas Personal Data Transfer Impact Assessment Dossier"),
        (r"\bDossier assessing the impact of transferring personal data abroad\b", "Overseas Personal Data Transfer Impact Assessment Dossier"),
        (r"\bDossier to assess the impact of transferring personal data abroad\b", "Overseas Personal Data Transfer Impact Assessment Dossier"),
        (r"\bVietnamese Citizens\b", "Vietnamese citizens"),
        (r"\bhis/her\b", "their"),
        (r"\bhimself/herself\b", "themselves"),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)
    value = value.replace("retrieving, retrieving, encoding", "retrieving, recovering, encoding")
    value = value.replace("shall request the Personal Data Controller", "may request the Personal Data Controller")
    value = value.replace("are requested to restrict the processing", "may request restriction of the processing")
    value = value.replace("Protect your personal data; Request", "Protect their personal data; request")
    value = value.replace("your personal data", "their personal data")
    value = value.replace("according to your consent", "in accordance with the data subject's consent")
    value = value.replace("his or her personal data", "their personal data")
    value = re.sub(r"\b(?:Personal\s+){2,}(?=Data\b)", "Personal ", value, flags=re.IGNORECASE)
    return value


def expected_marker(source: str) -> str | None:
    match = re.match(r"^(\d+\.|[a-zđ]\)|□)", source, flags=re.IGNORECASE)
    if not match:
        return None
    marker = match.group(1)
    return "dd)" if marker.lower() == "đ)" else marker


def apply_marker(source: str, translation: str) -> str:
    marker = expected_marker(source)
    if not marker:
        return translation
    if marker == "□":
        return translation if translation.startswith("□") else f"□ {translation.lstrip()}"
    current = re.match(r"^(\d+\.|[a-z]+\))\s*", translation, flags=re.IGNORECASE)
    if current:
        return marker + " " + translation[current.end():].lstrip()
    return marker + " " + translation


def post_edit(unit: dict, draft_paragraphs: list[str]) -> tuple[str, list[str]]:
    if unit["unitType"] == "article":
        number = int(unit["articleNumber"])
        title = ARTICLE_TITLES[number]
    else:
        title = FORM_TITLES[unit["formNumber"]]
    paragraphs = [
        apply_marker(source, normalized_text(draft))
        for source, draft in zip(unit["paragraphs"], draft_paragraphs, strict=True)
    ]
    if unit["unitType"] == "article":
        paragraphs[0] = f"Article {unit['articleNumber']}. {title}"
        article_number = int(unit["articleNumber"])
        for index in range(len(paragraphs)):
            override = ARTICLE_PARAGRAPH_OVERRIDES.get((article_number, index))
            if override is not None:
                paragraphs[index] = override
    else:
        for index in range(len(paragraphs)):
            override = FORM_PARAGRAPH_OVERRIDES.get((unit["formNumber"], index))
            if override is not None:
                paragraphs[index] = override
    return title, paragraphs


def annotate(check_only: bool = False) -> tuple[list[dict], dict, dict]:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    catalogue = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    catalogue_by_id = {unit["id"]: unit for unit in catalogue["units"]}
    if len(corpus) != 50 or len(catalogue_by_id) != 50:
        raise ValueError("expected exactly 50 Decree 13 nodes")

    for unit in corpus:
        draft = catalogue_by_id.get(unit["id"])
        if not draft:
            raise ValueError(f"missing catalogue unit {unit['id']}")
        if draft["sourceContentSha256"] != unit["contentSha256"]:
            raise ValueError(f"source hash mismatch for {unit['id']}")
        if draft["sourceParagraphCount"] != len(unit["paragraphs"]):
            raise ValueError(f"source paragraph count mismatch for {unit['id']}")
        if draft["sourceParagraphSequenceSha256"] != sha256("\n\n".join(unit["paragraphs"])):
            raise ValueError(f"source paragraph sequence mismatch for {unit['id']}")
        if draft["draftParagraphSequenceSha256"] != sha256("\n\n".join(draft["draftParagraphs"])):
            raise ValueError(f"draft hash mismatch for {unit['id']}")

        title, paragraphs = post_edit(unit, draft["draftParagraphs"])
        if len(paragraphs) != len(unit["paragraphs"]):
            raise ValueError(f"translation paragraph count mismatch for {unit['id']}")
        if any(not paragraph.strip() for paragraph in paragraphs):
            raise ValueError(f"empty English paragraph for {unit['id']}")
        for source, paragraph in zip(unit["paragraphs"], paragraphs, strict=True):
            marker = expected_marker(source)
            if marker and not paragraph.startswith(marker):
                raise ValueError(f"list marker drift in {unit['id']}: expected {marker}")
        if any(re.search(r"[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]", p) for p in paragraphs):
            raise ValueError(f"untranslated Vietnamese script remains in {unit['id']}")
        duplicate = re.compile(r"\b([A-Za-z]{3,})\b(?:\s+|,\s+)\1\b", flags=re.IGNORECASE)
        for paragraph in paragraphs:
            match = duplicate.search(paragraph)
            if match and match.group(1).lower() not in {"article", "information"}:
                raise ValueError(f"duplicated English word '{match.group(0)}' in {unit['id']}")

        full_text = "\n\n".join(paragraphs)
        project_rights = {
            "reuseStatus": "cc-by-4.0-project-authored-translation",
            "license": "Creative Commons Attribution 4.0 International",
            "licenseUrl": LICENSE_URL,
            "attribution": "Compliance Compass contributors — nonofficial English reference to historical Decree 13/2023/NĐ-CP",
            "originalTextBoundary": "CC BY 4.0 applies only to the project-authored English reference. The official Vietnamese legislative text is a government edict and remains the controlling source.",
        }
        translation_basis = {
            "method": "project-authored-machine-assisted-reference-translation",
            "sourceLanguage": "vi-VN",
            "sourceContentSha256": unit["contentSha256"],
            "sourceParagraphCount": len(unit["paragraphs"]),
            "draftCatalogue": str(CATALOGUE_PATH.relative_to(ROOT)),
            "draftCatalogueUnitSha256": draft["draftParagraphSequenceSha256"],
            "annotator": "scripts/annotate-vietnam-decree13-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "qualityBoundary": "Paragraph and list order, source hashes, Article/Form identifiers and a controlled personal-data terminology set are mechanically verified or normalized. This is not a certified legal translation.",
        }
        unit["translations"] = unit.get("translations", {})
        unit["translations"]["en"] = {
            "title": title,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "en",
            "coverageStatus": "complete-historical-project-reference",
            "versionAsOf": AS_OF,
            "versionLabel": "Pinned official Vietnamese text of Decree 13/2023/NĐ-CP — effective 1 July 2023 through 31 December 2025",
            "currentTextEquivalent": True,
            "referenceViewEligible": True,
            "legalEffectStatus": "repealed",
            "status": "project-authored-reference-translation-no-legal-effect",
            "note": "Complete English reference for the stored historical Vietnamese node. This project translation is machine-assisted, nonofficial and not legal advice. Decree 13/2023/NĐ-CP was repealed in full from 1 January 2026; Vietnamese controls for its former effective period.",
            "authorityNote": "No complete English translation published by the issuing authority or an openly reusable official Government source was verified. Commercial and subscription translations were not copied.",
            "source": SOURCE_URL,
            "sourceLabel": "Signed Government Vietnamese text — controlling historical source for project reference",
            "translationBasis": translation_basis,
            "contentSha256": sha256(full_text),
            "rights": project_rights,
        }
        unit["translationStatus"] = "project-authored-reference-translation-no-legal-effect"
        unit["englishAvailability"] = {
            "coverageStatus": "complete-historical-project-reference",
            "status": "project-authored-reference-translation-no-legal-effect",
            "versionAsOf": AS_OF,
            "versionLabel": "13/2023/NĐ-CP, historical text effective 2023-07-01 through 2025-12-31",
            "currentTextEquivalent": True,
            "legalEffectStatus": "repealed",
            "authorityNote": "A complete nonofficial project English reference is stored. It is not a Government translation; the Vietnamese text controls.",
            "sourcesChecked": unit.get("englishAvailability", {}).get("sourcesChecked", []),
            "note": "All 44 Articles and six Appendix forms have a complete project English reference. The Decree is historical and repealed, and the reference must never be presented as current Vietnamese law.",
        }
        unit["translationReference"] = {
            "language": "en",
            "availability": "complete-project-authored-historical-reference",
            "sourceVersion": {
                "instrumentNumber": "13/2023/NĐ-CP",
                "issuedOn": "2023-04-17",
                "effectiveFrom": "2023-07-01",
                "repealedFrom": "2026-01-01",
                "historicalEffectivePeriod": {"from": "2023-07-01", "through": "2025-12-31"},
                "versionAlignment": "translation-of-the-pinned-official-vietnamese-historical-node",
            },
            "translationBasis": translation_basis,
            "note": "Nonofficial machine-assisted project reference; Vietnamese controls; the source Decree is repealed.",
        }

    manifest = {
        "schemaVersion": 1,
        "manifestId": "vn-decree-13-2023-project-english-2026-07-20",
        "reviewedAsOf": AS_OF,
        "instrumentId": "vn-decree-13-2023",
        "instrumentNumber": "13/2023/NĐ-CP",
        "scope": {
            "expectedUnitCount": 50,
            "translatedUnitCount": len(corpus),
            "articleCount": sum(unit["unitType"] == "article" for unit in corpus),
            "appendixFormCount": sum(unit["unitType"] == "appendix-form" for unit in corpus),
            "sourceParagraphCount": sum(len(unit["paragraphs"]) for unit in corpus),
            "translationParagraphCount": sum(len(unit["translations"]["en"]["paragraphs"]) for unit in corpus),
            "coverageStatus": "complete-historical-project-reference",
        },
        "legalLifecycle": {
            "status": "repealed",
            "effectiveFrom": "2023-07-01",
            "repealedFrom": "2026-01-01",
            "historicalEffectivePeriod": {"from": "2023-07-01", "through": "2025-12-31"},
            "controllingRepeal": "Decree 356/2025/NĐ-CP, Article 42(2)",
            "controllingRepealSource": REPEAL_SOURCE,
        },
        "versionBoundary": {
            "controllingLanguage": "vi-VN",
            "controllingSource": SOURCE_URL,
            "sourceAsOf": AS_OF,
            "officialEnglishAvailability": "No complete issuing-authority or openly reusable official Government English text was verified.",
            "commercialTranslationBoundary": "Commercial, subscription-database and law-firm translations were not copied into this corpus.",
        },
        "method": {
            "draftGenerator": "scripts/prepare-project-english-translation-drafts.py",
            "annotator": "scripts/annotate-vietnam-decree13-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "cataloguePath": str(CATALOGUE_PATH.relative_to(ROOT)),
            "catalogueSha256": sha256(CATALOGUE_PATH.read_bytes()),
            "sourceHashLock": True,
            "paragraphOrderLock": True,
            "listMarkerLock": True,
            "qualityBoundary": "Machine-assisted project reference with deterministic terminology normalization and structural verification; not a certified legal translation.",
        },
        "rights": {
            "projectEnglishLicense": "CC BY 4.0",
            "projectEnglishLicenseUrl": LICENSE_URL,
            "officialVietnameseBoundary": "The licence applies only to the project-authored English reference. The official Vietnamese text is a government edict and remains controlling.",
        },
        "hashes": {
            "sourceUnitSequenceSha256": sha256("\n\n".join(unit["fullText"] for unit in corpus)),
            "translationUnitSequenceSha256": sha256("\n\n".join(unit["translations"]["en"]["fullText"] for unit in corpus)),
        },
    }

    corpus_json = json.dumps(corpus, ensure_ascii=False, indent=2) + "\n"
    handoff = json.loads(HANDOFF_PATH.read_text(encoding="utf-8"))
    handoff_entry = next(item for item in handoff["corpora"] if item["instrumentId"] == "vn-decree-13-2023")
    handoff_entry["coverage"]["englishTranslation"] = (
        "complete nonofficial project reference for all 44 Articles and six Appendix forms; "
        "machine-assisted, CC BY 4.0, and explicitly historical/repealed"
    )
    handoff_entry["output"]["sha256"] = sha256(corpus_json)
    handoff_entry["englishTranslation"] = {
        "manifest": str(MANIFEST_PATH.relative_to(ROOT)),
        "annotator": "scripts/annotate-vietnam-decree13-english.py",
        "catalogue": str(CATALOGUE_PATH.relative_to(ROOT)),
        "translatedUnitCount": 50,
        "translationParagraphCount": manifest["scope"]["translationParagraphCount"],
        "status": "project-authored-reference-translation-no-legal-effect",
        "coverageStatus": "complete-historical-project-reference",
        "license": "CC BY 4.0",
        "legalEffectStatus": "repealed",
        "currentLawWarning": "Decree 13/2023/NĐ-CP was repealed from 1 January 2026 and must not be presented as current Vietnamese law.",
    }

    if not check_only:
        CORPUS_PATH.write_text(corpus_json, encoding="utf-8")
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        HANDOFF_PATH.write_text(json.dumps(handoff, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return corpus, manifest, handoff


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate inputs and computed annotations without writing")
    args = parser.parse_args()
    corpus, manifest, _handoff = annotate(check_only=args.check)
    print(
        f"Vietnam Decree 13 English: {len(corpus)}/50 nodes, "
        f"{manifest['scope']['translationParagraphCount']} paragraphs; check={args.check}"
    )


if __name__ == "__main__":
    main()
