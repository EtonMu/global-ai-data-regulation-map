#!/usr/bin/env python3
"""Build the complete current PL 2338/2023 article corpus.

The controlling text boundary is the Senate-approved autograph transmitted to
the Chamber of Deputies.  The bill remains pending and is never represented as
enacted or in force.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path

from project_english_corpus import attach_project_english


TITLES = {
    "1": "Scope, objectives and exclusions",
    "2": "Foundations of AI governance",
    "3": "Principles for AI systems",
    "4": "Definitions",
    "5": "General rights of affected persons",
    "6": "Rights concerning high-risk AI",
    "7": "Procedure for explanations",
    "8": "Human oversight",
    "9": "Notice of procedures for exercising rights",
    "10": "Regulatory guidance on rights",
    "11": "Administrative and judicial enforcement",
    "12": "Preliminary risk assessment",
    "13": "Prohibited excessive-risk uses",
    "14": "High-risk use cases",
    "15": "Criteria for high-risk classification",
    "16": "Updating risk classifications",
    "17": "General duties of AI agents",
    "18": "Governance of high-risk systems",
    "19": "Disclosure of synthetic content",
    "20": "Detection of synthetic content",
    "21": "Conformity of high-risk systems",
    "22": "Public-sector portability and interoperability",
    "23": "Public-sector high-risk governance",
    "24": "Public-sector transparency standards",
    "25": "Algorithmic impact assessment",
    "26": "Timing and updating impact assessments",
    "27": "Combined algorithmic and data-protection assessments",
    "28": "Publication of impact-assessment conclusions",
    "29": "General-purpose AI preliminary assessment",
    "30": "Systemic-risk general-purpose AI obligations",
    "32": "Cooperation with downstream AI developers",
    "33": "Simplified general-purpose AI obligations",
    "34": "Accreditation and conformity assessment",
    "35": "Consumer-law civil liability",
    "36": "General civil liability",
    "37": "Reversal of the burden of proof",
    "38": "Liability in regulatory sandboxes",
    "39": "Preservation of sector-specific liability",
    "40": "Codes of conduct and governance programs",
    "41": "Voluntary self-regulation",
    "42": "Reporting serious incidents",
    "43": "Application of cybersecurity and infrastructure laws",
    "44": "Public database of high-risk AI",
    "45": "National AI regulatory system",
    "46": "Powers of the coordinating authority",
    "47": "Residual regulatory authority",
    "48": "Powers of sectoral authorities",
    "49": "Duties of the competent authority",
    "50": "Administrative sanctions",
    "51": "Preventive and corrective measures",
    "52": "Inter-authority notice of violations",
    "53": "Permanent Regulatory Cooperation Council",
    "54": "AI Experts and Scientists Committee",
    "55": "AI regulatory sandboxes",
    "56": "Sandbox authorization procedures",
    "57": "Responsibility of sandbox participants",
    "58": "Worker-protection guidelines",
    "59": "Innovation and technological development",
    "60": "Energy and resource efficiency",
    "61": "Environmental certification research",
    "62": "Disclosure of copyright-protected training content",
    "63": "Text-and-data-mining copyright exception",
    "64": "Rights-holder opt-out",
    "65": "Remuneration for protected content",
    "66": "Personality rights and synthetic media",
    "67": "Simplified duties for smaller actors",
    "68": "Public-sector AI policy guidelines",
    "69": "Accessible and nationally contextual public AI",
    "70": "Education and workforce programs",
    "71": "National AI studies and planning",
    "72": "Non-exclusivity of rights and principles",
    "73": "Simplified national-development regimes",
    "74": "Executive implementation duties",
    "75": "Algorithmic-literacy amendment",
    "76": "AI-research funding amendment",
    "77": "Online content and freedom of expression",
    "78": "Protection of vested rights and final judgments",
    "79": "Four-year legislative review",
    "80": "Proposed commencement timetable",
}


EXPECTED_NUMBERS = [str(value) for value in [*range(1, 31), *range(32, 81)]]
STATUS_URL = "https://dadosabertos.camara.leg.br/api/v2/proposicoes/2487262"
CANONICAL_URL = (
    "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao/"
    "?idProposicao=2487262"
)
RIGHTS_URL = "https://www.planalto.gov.br/ccivil_03/leis/l9610.htm"
EXPECTED_SOURCE_HASHES = {
    "article_snapshot": "fefdaf54777ac6b79f1c3a1a7f6ec4e1641665c6d30fd9dea4ec1919280b3bd8",
    "chamber_status": "1471f8a6e5534412bb689aa20ae75b6941a12e37ad6e1b34a213b722535fa143",
    "chamber_proceedings": "2765489549dee2f525ab562d810ead90bbb90eaa530ccf33f539d18eedb1bdf2",
    "chamber_record": "715059dd3af848dd352068ad17badebcabd633ca43cb2d7ab64dd9c33cac7c4a",
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def assert_hash(path: Path, role: str) -> str:
    actual = sha256_bytes(path.read_bytes())
    expected = EXPECTED_SOURCE_HASHES[role]
    if actual != expected:
        raise ValueError(f"{role} SHA-256 mismatch: {actual} != {expected}")
    return actual


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("article_snapshot", type=Path)
    parser.add_argument("chamber_status", type=Path)
    parser.add_argument("chamber_proceedings", type=Path)
    parser.add_argument("chamber_record", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    snapshot = load_json(args.article_snapshot)
    status_payload = load_json(args.chamber_status)
    proceedings_payload = load_json(args.chamber_proceedings)
    chamber_record = html.unescape(args.chamber_record.read_text(encoding="utf-8"))
    if snapshot["instrumentId"] != "br-pl-2338-2023-ai-bill":
        raise ValueError("Unexpected PL 2338 article snapshot")
    if snapshot["coverage"]["articleNumbers"] != EXPECTED_NUMBERS:
        raise ValueError("The official autograph numbering boundary changed")
    if list(TITLES) != EXPECTED_NUMBERS:
        raise ValueError("Editorial title coverage does not match the official autograph")

    status = status_payload["dados"]
    current = status["statusProposicao"]
    if status["id"] != 2487262 or status["numero"] != 2338 or status["ano"] != 2023:
        raise ValueError("Unexpected Chamber bill record")
    if current["descricaoSituacao"] != "Aguardando Parecer":
        raise ValueError(f"Unexpected current Chamber status: {current}")
    if status["urnFinal"] is not None:
        raise ValueError("PL 2338 unexpectedly has a final enactment URN")
    if not proceedings_payload.get("dados"):
        raise ValueError("Official Chamber procedural history is empty")

    normalized_record = re.sub(r"\s+", " ", chamber_record)
    required_record_text = [
        "Aguardando Parecer do(a) Relator(a) na Comissão Especial",
        "Comissão Especial sobre Inteligência Artificial (PL 2338/23)",
        "17/06/2026",
    ]
    for phrase in required_record_text:
        if phrase not in normalized_record:
            raise ValueError(f"Official Chamber record is missing: {phrase}")

    snapshot_sha256 = assert_hash(args.article_snapshot, "article_snapshot")
    status_sha256 = assert_hash(args.chamber_status, "chamber_status")
    proceedings_sha256 = assert_hash(args.chamber_proceedings, "chamber_proceedings")
    chamber_record_sha256 = assert_hash(args.chamber_record, "chamber_record")
    source_document = snapshot["sourceDocument"]
    records: list[dict] = []
    for source_article in snapshot["articles"]:
        number = source_article["articleNumber"]
        full_text = source_article["fullText"]
        if full_text != "\n\n".join(source_article["paragraphs"]):
            raise ValueError(f"Article {number} paragraph/full-text mismatch")
        if sha256_text(full_text) != source_article["contentSha256"]:
            raise ValueError(f"Article {number} content hash mismatch")

        title = TITLES[number]
        record = {
            "id": f"br-pl2338-art-{number}",
            "instrumentId": "br-pl-2338-2023-ai-bill",
            "unitType": "article",
            "articleNumber": number,
            "label": f"Art. {number}",
            "title": title,
            "titleProvenance": "project-authored English orientation title; not operative text",
            "chapter": source_article["chapter"],
            "section": source_article["section"],
            "paragraphs": source_article["paragraphs"],
            "fullText": full_text,
            "contentSha256": source_article["contentSha256"],
            "language": "pt-BR",
            "textAvailability": "official-complete-senate-approved-bill-text",
            "englishAvailability": {
                "coverageStatus": "no-source-text",
                "status": "not-available-from-legislature",
                "versionAsOf": args.retrieved_on,
                "versionLabel": (
                    "Senate-approved autograph transmitted to the Chamber; pending "
                    "bill text as of 20 July 2026"
                ),
                "authorityNote": (
                    "Portuguese is the sole official bill text. No complete English "
                    "translation published by the Senado Federal or Câmara dos "
                    "Deputados was verified."
                ),
                "sourcesChecked": [source_document["url"], CANONICAL_URL, STATUS_URL],
                "note": (
                    "No complete official English version was published by the Senado "
                    "Federal or Câmara dos Deputados as of 2026-07-20; no English full "
                    "text from a machine, consultancy or commercial database is "
                    "substituted."
                ),
            },
            "source": source_document["url"],
            "sourceFragment": source_document["url"],
            "sourceLabel": (
                "Câmara dos Deputados — electronically authenticated Senate autograph"
            ),
            "canonicalSource": CANONICAL_URL,
            "statusSource": STATUS_URL,
            "retrievedOn": args.retrieved_on,
            "versionAsOf": args.retrieved_on,
            "statusAsOf": args.retrieved_on,
            "sourcePageRange": source_article["sourcePageRange"],
            "sourceDocumentSha256": source_document["sha256"],
            "sourceSnapshot": {
                "path": (
                    "data/v2/source-snapshots/"
                    "br-pl2338-2023-official-articles.json"
                ),
                "sha256": snapshot_sha256,
                "compactTextSha256": source_article["compactTextSha256"],
            },
            "legalEffectStatus": "pending-bill-not-enacted",
            "effectiveFrom": None,
            "legislativeStatus": {
                "instrumentType": "bill",
                "state": "under-consideration",
                "senateDecision": "substitute approved by plenary",
                "senateApprovedOn": "2024-12-10",
                "autographDatedOn": "2025-01-31",
                "transmittedToChamberOn": "2025-03-17",
                "currentChamber": "Câmara dos Deputados",
                "currentBody": (
                    "Comissão Especial sobre Inteligência Artificial (PL 2338/23)"
                ),
                "currentStage": "Aguardando Parecer do(a) Relator(a)",
                "statusAsOf": args.retrieved_on,
                "notLaw": True,
                "notPublishedAsLaw": True,
                "notInForce": True,
                "statusRecordSha256": status_sha256,
                "proceduralHistorySha256": proceedings_sha256,
                "chamberRecordSha256": chamber_record_sha256,
            },
            "sourceVersion": {
                "label": (
                    "Senate-approved substitute — final autograph transmitted to the "
                    "Chamber of Deputies"
                ),
                "billNumber": "PL 2338/2023",
                "documentDate": "2025-01-31",
                "receivedByChamberOn": "2025-03-17",
                "articleCount": 79,
                "numberingNotice": snapshot["coverage"]["numberingNotice"],
                "statusAsOf": args.retrieved_on,
            },
            "summary": (
                f"Editorial orientation title: {title}. The operative wording below "
                "is the official Portuguese Senate autograph and remains a proposal."
            ),
            "rights": {
                "reuseStatus": "government-edict",
                "license": (
                    "Official acts excluded from copyright protection under Lei nº "
                    "9.610/1998, Article 8(IV)"
                ),
                "licenseUrl": RIGHTS_URL,
                "attribution": (
                    "Source: Senado Federal autograph as authenticated and published "
                    "by Câmara dos Deputados. English headings are project-authored."
                ),
            },
        }
        if number == "80":
            record["proposedCommencement"] = {
                "condition": "only if the bill is enacted and officially published",
                "generalRule": "730 days after official publication",
                "after180Days": [
                    "Article 13",
                    "Chapter IV, Section V",
                    "Chapter X, Section IV, except Article 62",
                ],
                "onPublication": [
                    "Chapter IX, except Article 50",
                    "Chapter X, Sections III and V",
                    "Article 62",
                ],
                "legalEffectAsOf2026-07-20": "none — bill not enacted",
            }
        records.append(record)

    attach_project_english(records, "br-pl-2338-2023-ai-bill")
    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Built {len(records)} complete PL 2338/2023 Article nodes at {args.output}")


if __name__ == "__main__":
    main()
