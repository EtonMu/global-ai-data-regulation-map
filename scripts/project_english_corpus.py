#!/usr/bin/env python3
"""Attach reviewed project-authored English references to source corpora.

This module is deliberately network-free.  The reviewed translation resources
are versioned inputs; source importers call the same function used by the
standalone annotator so regenerated corpora remain byte-for-byte reproducible.
"""

from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"


RESOURCE_PATHS = {
    "br-pl-2338-2023-ai-bill": (
        DATA / "reference-translations" / "br-pl2338-2023-project-en.json"
    ),
    "id-pdp-law-2022": (
        DATA / "reference-translations" / "id-pdp-law-2022-project-en.json"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023": (
        DATA / "reference-translations" / "tw-genai-guidelines-2023-project-en.json"
    ),
}


CONFIG = {
    "br-pl-2338-2023-ai-bill": {
        "coverageStatus": "complete-current-pending-bill-project-reference",
        "versionLabel": (
            "Senate-approved substitute autograph transmitted to the Chamber of "
            "Deputies; pending bill text as of 20 July 2026"
        ),
        "alignmentStatus": "aligned-to-pinned-current-pending-portuguese-autograph",
        "legalEffectStatus": "pending-bill-not-enacted",
        "sourceLanguage": "pt-BR",
        "sourceLabel": (
            "Câmara dos Deputados — electronically authenticated Senate autograph"
        ),
        "note": (
            "Complete English reference for the stored pending Portuguese bill "
            "Article. This is a nonofficial project translation with no legal "
            "effect; the Portuguese autograph controls and the bill is not law."
        ),
        "authorityNote": (
            "No complete English translation published by the Senado Federal or "
            "Câmara dos Deputados was verified. Commercial and subscription "
            "translations were not copied."
        ),
    },
    "id-pdp-law-2022": {
        "coverageStatus": "complete-current-project-reference",
        "versionLabel": (
            "Law No. 27 of 2022, including the current binding interpretation of "
            "Article 53(1)(b) under Constitutional Court Decision "
            "151/PUU-XXII/2024"
        ),
        "alignmentStatus": "aligned-to-pinned-current-operative-indonesian",
        "legalEffectStatus": "in-force",
        "sourceLanguage": "id-ID",
        "sourceLabel": "JDIHN official Gazette PDF — controlling Indonesian text",
        "note": (
            "Complete English reference for the stored current Indonesian Article. "
            "This is a nonofficial project translation with no legal effect; the "
            "Indonesian text and applicable Constitutional Court decisions control."
        ),
        "authorityNote": (
            "No complete English text published as an official Government "
            "translation was verified. A Ministry translation-team publication, "
            "itself expressly labeled nonofficial, was consulted only as a "
            "terminology cross-check and was not copied."
        ),
    },
    "tw-executive-yuan-generative-ai-guidelines-2023": {
        "coverageStatus": "complete-current-guidance-project-reference",
        "versionLabel": "Final ten-point Executive Yuan guidance issued 3 October 2023",
        "alignmentStatus": "aligned-to-pinned-final-traditional-chinese-guidance",
        "legalEffectStatus": "active-non-binding-public-sector-guidance",
        "sourceLanguage": "zh-Hant-TW",
        "sourceLabel": (
            "National Science and Technology Council — official Traditional-Chinese ODT"
        ),
        "note": (
            "Complete English reference for the stored final Traditional-Chinese "
            "guidance node. This is a nonofficial project translation with no legal "
            "effect; the Traditional-Chinese guidance controls and is non-binding."
        ),
        "authorityNote": (
            "The Executive Yuan English press release concerns an earlier draft and "
            "is not a complete translation of the final ten-point guidance. No "
            "commercial or subscription translation was copied."
        ),
    },
}


TW_ENGLISH_TITLES = {
    "tw-executive-yuan-generative-ai-guidelines-2023-general-explanation": (
        "General explanation"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-1": (
        "Purpose and scope of risks"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-2": (
        "Human final judgment and autonomy"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-3": (
        "No generative AI for confidential documents"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-4": (
        "Restrictions on confidential and personal-data inputs"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-5": (
        "Verification and limits on official decision-making"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-6": (
        "Disclosure of generative-AI assistance"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-7": (
        "Information security, data protection, and intellectual property"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-8": (
        "Procurement flow-down requirements"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-9": (
        "Application by public-sector affiliated bodies"
    ),
    "tw-executive-yuan-generative-ai-guidelines-2023-point-10": (
        "Reference use by other government bodies"
    ),
}


def digest_bytes(value: bytes) -> str:
    return sha256(value).hexdigest()


def digest_text(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def translation_title(record: dict, instrument_id: str) -> str:
    if instrument_id == "br-pl-2338-2023-ai-bill":
        return record["title"]
    if instrument_id == "id-pdp-law-2022":
        return f"Article {record['articleNumber']}"
    return TW_ENGLISH_TITLES[record["id"]]


def attach_project_english(
    records: list[dict],
    instrument_id: str,
    resource_path: Path | None = None,
) -> list[dict]:
    """Attach one reviewed English unit to every source record in place."""

    if instrument_id not in CONFIG:
        raise ValueError(f"Unsupported project translation instrument: {instrument_id}")
    path = resource_path or RESOURCE_PATHS[instrument_id]
    raw_bytes = path.read_bytes()
    resource = json.loads(raw_bytes)
    if resource["instrumentId"] != instrument_id:
        raise ValueError("Translation resource instrument mismatch")
    if resource["officialStatus"] != "non-official-no-legal-effect":
        raise ValueError("Translation resource must retain its nonofficial boundary")
    units = {unit["id"]: unit for unit in resource["units"]}
    if len(units) != len(records):
        raise ValueError("Translation resource unit count does not match corpus")

    config = CONFIG[instrument_id]
    relative_resource = path.resolve().relative_to(ROOT).as_posix()
    resource_sha256 = digest_bytes(raw_bytes)
    seen: set[str] = set()
    for record in records:
        unit = units.get(record["id"])
        if unit is None:
            raise ValueError(f"Missing reviewed English unit: {record['id']}")
        if unit["sourceContentSha256"] != digest_text(record["fullText"]):
            raise ValueError(f"Stale English source alignment: {record['id']}")
        if unit["sourceParagraphCount"] != len(record["paragraphs"]):
            raise ValueError(f"English paragraph count mismatch: {record['id']}")
        if len(unit["paragraphs"]) != len(record["paragraphs"]):
            raise ValueError(f"English/source paragraph order mismatch: {record['id']}")
        if unit["fullText"] != "\n\n".join(unit["paragraphs"]):
            raise ValueError(f"English fullText mismatch: {record['id']}")
        if unit["contentSha256"] != digest_text(unit["fullText"]):
            raise ValueError(f"English content hash mismatch: {record['id']}")

        operative_source_sha256 = unit.get(
            "operativeSourceContentSha256", unit["sourceContentSha256"]
        )
        translation = {
            "title": translation_title(record, instrument_id),
            "paragraphs": unit["paragraphs"],
            "fullText": unit["fullText"],
            "language": "en",
            "coverageStatus": config["coverageStatus"],
            "versionAsOf": "2026-07-20",
            "versionLabel": config["versionLabel"],
            "currentTextEquivalent": True,
            "alignmentStatus": config["alignmentStatus"],
            "referenceViewEligible": True,
            "legalEffectStatus": (
                record.get("legalEffectStatus") or config["legalEffectStatus"]
            ),
            "status": "project-authored-reference-translation-no-legal-effect",
            "officialStatus": "non-official-no-legal-effect",
            "note": config["note"],
            "authorityNote": config["authorityNote"],
            "source": record["source"],
            "sourceLabel": config["sourceLabel"],
            "translationBasis": {
                "method": "project-authored-machine-assisted-reference-translation",
                "sourceLanguage": config["sourceLanguage"],
                "sourceContentSha256": operative_source_sha256,
                "sourceParagraphCount": len(record["paragraphs"]),
                "translationResource": relative_resource,
                "translationResourceSha256": resource_sha256,
                "translationResourceManifestSha256": resource[
                    "manifestContentSha256"
                ],
                "translationUnitContentSha256": unit["contentSha256"],
                "annotator": "scripts/annotate-br-id-tw-english.py",
                "annotatorVersion": "1.0.0",
                "qualityBoundary": (
                    "Source and English paragraph counts and order, source hashes, "
                    "Article/Point locators, list-marker classes, source-language "
                    "residue, and known machine artifacts are mechanically checked. "
                    "The English has been editorially normalized but is not a "
                    "certified legal translation."
                ),
            },
            "contentSha256": unit["contentSha256"],
            "rights": {
                "reuseStatus": "cc-by-4.0-project-authored-translation",
                "license": "Creative Commons Attribution 4.0 International",
                "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
                "attribution": (
                    "Compliance Compass contributors — nonofficial English reference"
                ),
                "originalTextBoundary": (
                    "CC BY 4.0 applies only to the project-authored English "
                    "reference. The source-language legal or guidance text remains "
                    "the controlling source and retains its recorded rights status."
                ),
            },
        }
        if "legalEffectAlignment" in unit:
            translation["legalEffectAlignment"] = unit["legalEffectAlignment"]
            translation["translationBasis"][
                "historicalEnactedSourceContentSha256"
            ] = unit["sourceContentSha256"]
        record["translations"] = {"en": translation}
        record["englishAvailability"] = {
            "coverageStatus": config["coverageStatus"],
            "status": "project-authored-reference-translation-no-legal-effect",
            "officialStatus": "no-complete-official-english-text-verified",
            "versionAsOf": "2026-07-20",
            "versionLabel": config["versionLabel"],
            "currentTextEquivalent": True,
            "alignmentStatus": config["alignmentStatus"],
            "legalEffectStatus": translation["legalEffectStatus"],
            "authorityNote": config["authorityNote"],
            "note": (
                "Every stored source-language paragraph has a corresponding "
                "project-authored English reference paragraph."
            ),
        }
        record["translationStatus"] = config["coverageStatus"]
        record["currentLanguageToggleEligible"] = True
        seen.add(record["id"])

    if seen != set(units):
        raise ValueError("Translation resource contains unattached units")
    return records
