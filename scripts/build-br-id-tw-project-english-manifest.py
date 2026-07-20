#!/usr/bin/env python3
"""Build the focused BR/ID/TW project-English provenance manifest."""

from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

from legal_corpus_utils import write_json


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
OUTPUT = DATA / "br-id-tw-project-english-corpus-manifest.json"


CONFIGS = [
    {
        "instrumentId": "br-pl-2338-2023-ai-bill",
        "jurisdiction": "Brazil",
        "sourceLanguage": "pt-BR",
        "corpus": "data/v2/br-ai-bill-2338-2023-articles.json",
        "resource": "data/v2/reference-translations/br-pl2338-2023-project-en.json",
        "lifecycle": "pending-bill-not-enacted",
        "controllingSource": (
            "https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?"
            "codteor=2868197&filename=PL+2338%2F2023"
        ),
        "officialEnglishConclusion": (
            "No complete English translation published by the Senate or Chamber "
            "was verified."
        ),
    },
    {
        "instrumentId": "id-pdp-law-2022",
        "jurisdiction": "Indonesia",
        "sourceLanguage": "id-ID",
        "corpus": "data/v2/id-pdp-law-2022-articles.json",
        "resource": "data/v2/reference-translations/id-pdp-law-2022-project-en.json",
        "lifecycle": "in-force-with-Article-53-judicial-overlay",
        "controllingSource": "https://www.jdihn.go.id/files/2098/2022uu027.pdf",
        "officialEnglishConclusion": (
            "No complete English text published as an official Indonesian "
            "Government translation was verified."
        ),
    },
    {
        "instrumentId": "tw-executive-yuan-generative-ai-guidelines-2023",
        "jurisdiction": "Taiwan",
        "sourceLanguage": "zh-Hant-TW",
        "corpus": (
            "data/v2/tw-executive-yuan-generative-ai-guidelines-2023-points.json"
        ),
        "resource": (
            "data/v2/reference-translations/tw-genai-guidelines-2023-project-en.json"
        ),
        "lifecycle": "active-non-binding-public-sector-guidance",
        "controllingSource": (
            "https://www.nstc.gov.tw/nstc/attachments/"
            "99619717-6c5e-4270-b3b8-46f2041c228c"
        ),
        "officialEnglishConclusion": (
            "The located Executive Yuan English page discusses the earlier draft "
            "and is not a complete translation of the final guidance."
        ),
    },
]


def digest_bytes(value: bytes) -> str:
    return sha256(value).hexdigest()


def digest_text(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def main() -> None:
    corpora: list[dict] = []
    for config in CONFIGS:
        corpus_path = ROOT / config["corpus"]
        resource_path = ROOT / config["resource"]
        corpus_bytes = corpus_path.read_bytes()
        resource_bytes = resource_path.read_bytes()
        corpus = json.loads(corpus_bytes)
        resource = json.loads(resource_bytes)
        if len(corpus) != len(resource["units"]):
            raise ValueError(f"Unit-count mismatch: {config['instrumentId']}")
        paragraph_count = sum(len(node["paragraphs"]) for node in corpus)
        english_paragraph_count = sum(
            len(node["translations"]["en"]["paragraphs"]) for node in corpus
        )
        if paragraph_count != english_paragraph_count:
            raise ValueError(f"Paragraph-count mismatch: {config['instrumentId']}")
        corpora.append(
            {
                **config,
                "unitCount": len(corpus),
                "sourceParagraphCount": paragraph_count,
                "englishParagraphCount": english_paragraph_count,
                "completeProjectEnglishCoverage": True,
                "paragraphOrderPreserved": True,
                "projectEnglishStatus": (
                    "project-authored-reference-translation-no-legal-effect"
                ),
                "legalEffect": "none-English-reference-only",
                "corpusSha256": digest_bytes(corpus_bytes),
                "translationResourceSha256": digest_bytes(resource_bytes),
                "translationResourceManifestSha256": resource[
                    "manifestContentSha256"
                ],
                "combinedSourceTextSha256": digest_text(
                    "\n\n".join(node["fullText"] for node in corpus)
                ),
                "combinedEnglishTextSha256": digest_text(
                    "\n\n".join(node["translations"]["en"]["fullText"] for node in corpus)
                ),
            }
        )

    manifest = {
        "schemaVersion": 1,
        "reviewedAsOf": "2026-07-20",
        "purpose": (
            "Focused provenance, lifecycle, rights, and completeness record for "
            "the Brazil, Indonesia, and Taiwan project-authored English references."
        ),
        "translationBoundary": {
            "officialStatus": "non-official-no-legal-effect",
            "method": (
                "Independent source-aligned translation with automated first-draft "
                "assistance, terminology normalization, manual correction, and "
                "structural and residual-language quality checks."
            ),
            "controllingTextRule": (
                "The pinned Portuguese, Indonesian, or Traditional-Chinese source "
                "and applicable legal decisions control."
            ),
            "professionalTranslatorCertification": False,
            "notLegalAdvice": True,
        },
        "rights": {
            "scope": "project-authored English wording only",
            "license": "Creative Commons Attribution 4.0 International",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "attribution": "Compliance Compass contributors",
            "thirdPartyTranslationPolicy": (
                "Commercial, subscription, and ambiguously licensed third-party "
                "translations were not copied."
            ),
        },
        "researchCrossChecks": [
            {
                "instrumentId": "id-pdp-law-2022",
                "source": (
                    "https://jdih.denpasarkota.go.id/public/produk-hukum/"
                    "monografi-hukum/buku-hukum/law-of-the-republic-of-indonesia-"
                    "number-27-of-2022-on-personal-data-protection"
                ),
                "finding": (
                    "Government-library catalogue identifies a Ministry translation-"
                    "team publication that expressly says it is not an official "
                    "Government translation. It was used only to cross-check "
                    "terminology and was not copied because reusable rights were not "
                    "established."
                ),
            },
            {
                "instrumentId": "tw-executive-yuan-generative-ai-guidelines-2023",
                "source": (
                    "https://english.ey.gov.tw/Page/61BF20C3E89B856/"
                    "d57a1a70-c0b0-4481-9845-a6265437a8ff"
                ),
                "finding": (
                    "English contextual release concerns Cabinet approval of a draft, "
                    "not a complete point-by-point translation of the final guidance."
                ),
            },
        ],
        "corpora": corpora,
        "reproducibility": {
            "draftPreparation": "scripts/prepare-project-english-drafts.py",
            "offlineFinalizer": "scripts/finalize-br-id-tw-english-resources.py",
            "offlineAnnotator": "scripts/annotate-br-id-tw-english.py",
            "manifestBuilder": "scripts/build-br-id-tw-project-english-manifest.py",
            "sourceImporters": [
                "scripts/import-brazil-ai-bill-2338.py",
                "scripts/import-indonesia-pdp.py",
                "scripts/import-taiwan-executive-yuan-genai-guidelines.py",
            ],
        },
    }
    manifest["manifestContentBasisSha256"] = digest_text(
        json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    )
    write_json(OUTPUT, manifest)
    print(f"Wrote focused manifest to {OUTPUT}")


if __name__ == "__main__":
    main()
