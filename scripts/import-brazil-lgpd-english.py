#!/usr/bin/env python3
"""Attach complete, versioned English text to the current LGPD corpus.

The ANPD published a complete English reference translation in November 2024.
Law No. 15,352/2026 subsequently changed Articles 5, 55-A and 55-C. For the
other 77 Article identifiers, this importer retains the ANPD wording with only
whitespace reflow. For the three changed Articles it stores a separately
labelled, project-authored translation of the current official Portuguese text
and retains the superseded ANPD wording as historical reference metadata.

The Portuguese consolidation remains the controlling legal text in every case.

The importer is offline-reproducible by default. It reads a repository-pinned,
UTF-8 ``pdftotext`` snapshot whose hash and derivation from the ANPD PDF are
recorded in a source manifest. A caller may still supply the pinned PDF itself;
both inputs are verified against that manifest before any corpus is written.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "v2"
DEFAULT_CORPUS = DATA_ROOT / "brazil-lgpd-articles.json"
DEFAULT_ENGLISH_SNAPSHOT = (
    DATA_ROOT
    / "source-snapshots"
    / "br-lgpd-anpd-en-2024-pdftotext-normalized.txt"
)
DEFAULT_SOURCE_MANIFEST = (
    DATA_ROOT
    / "source-snapshots"
    / "br-lgpd-anpd-en-2024-source-manifest.json"
)


ANPD_ENGLISH_URL = (
    "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/"
    "outros-documentos-e-publicacoes-institucionais/"
    "lgpd-en-lei-no-13-709-capa.pdf/@@display-file/file"
)
ANPD_ENGLISH_PAGE = (
    "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/"
    "outros-documentos-e-publicacoes-institucionais/"
    "lgpd-en-lei-no-13-709-capa.pdf"
)
LAW_15352_URL = (
    "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15352.htm"
)
PROJECT_LICENSE_URL = (
    "https://creativecommons.org/licenses/by/4.0/"
)

ANPD_VERSION = {
    "versionAsOf": "2024-11-06",
    "versionLabel": (
        "ANPD English reference published 6 November 2024; source text "
        "includes amendments through Law No. 14,460/2022"
    ),
}

ANPD_RIGHTS = {
    "reuseStatus": "government-site-cc-by-nd-3.0-format-reflow-only",
    "license": "Creative Commons Attribution-NoDerivs 3.0 Unported",
    "licenseUrl": "https://creativecommons.org/licenses/by-nd/3.0/",
    "attribution": (
        "Brazilian National Data Protection Authority (ANPD), Brazilian Data "
        "Protection Law (LGPD), English reference translation, published 2024."
    ),
    "note": (
        "The government translation is reproduced without substantive change. "
        "PDF line wrapping is converted to article-level plain text."
    ),
}

PROJECT_RIGHTS = {
    "reuseStatus": "project-authored-cc-by-4.0",
    "license": "Creative Commons Attribution 4.0 International",
    "licenseUrl": PROJECT_LICENSE_URL,
    "attribution": (
        "Compliance Compass project-authored current-English orientation; "
        "official Portuguese legal text controls."
    ),
}

CURRENT_PROJECT_TRANSLATIONS = {
    "5": """Article 5. For the purposes of this Law, the following definitions apply:

I – personal data: information relating to an identified or identifiable natural person;

II – sensitive personal data: personal data concerning racial or ethnic origin, religious belief, political opinion, membership in a trade union or in an organization of a religious, philosophical or political nature, data concerning health or sex life, and genetic or biometric data, when linked to a natural person;

III – anonymized data: data relating to a data subject who cannot be identified, taking into account the use of reasonable and available technical means at the time of processing;

IV – database: a structured set of personal data established in one or more locations, in electronic or physical form;

V – data subject: the natural person to whom the personal data being processed relate;

VI – controller: a natural person or legal entity, governed by public or private law, that has authority to make decisions concerning the processing of personal data;

VII – processor: a natural person or legal entity, governed by public or private law, that processes personal data on behalf of the controller;

VIII – data protection officer: a person appointed by the controller and processor to act as a communication channel between the controller, data subjects and the National Data Protection Agency (ANPD); (Wording given by Law No. 15,352/2026)

IX – processing agents: the controller and the processor;

X – processing: every operation performed on personal data, including collection, production, receipt, classification, use, access, reproduction, transmission, distribution, processing, filing, storage, deletion, evaluation or control of information, modification, communication, transfer, dissemination or extraction;

XI – anonymization: the use of reasonable and available technical means at the time of processing by which data lose the possibility of being associated, directly or indirectly, with an individual;

XII – consent: a free, informed and unambiguous manifestation by which the data subject agrees to the processing of their personal data for a specified purpose;

XIII – blocking: the temporary suspension of any processing operation through the retention of the personal data or database;

XIV – deletion: the removal of data or a set of data stored in a database, regardless of the procedure used;

XV – international data transfer: the transfer of personal data to a foreign country or to an international organization of which the country is a member;

XVI – shared use of data: the communication, dissemination, international transfer or interconnection of personal data, or the shared processing of personal databases, by public bodies and entities in the performance of their legal powers; between those public bodies and entities and private entities, on a reciprocal basis and with specific authorization, for one or more forms of processing permitted by those public bodies and entities; or between private entities;

XVII – data protection impact assessment: documentation prepared by the controller that describes personal-data processing operations capable of creating risks to civil liberties and fundamental rights, as well as the measures, safeguards and mechanisms adopted to mitigate those risks;

XVIII – research body: a body or entity of the direct or indirect public administration, or a non-profit legal entity governed by private law and lawfully organized under Brazilian law with headquarters and legal venue in the country, whose institutional mission or corporate or statutory purpose includes basic or applied research of a historical, scientific, technological or statistical nature; and

XIX – national authority: the public-administration entity responsible for ensuring, implementing and supervising compliance with this Law throughout the national territory. (Wording given by Law No. 15,352/2026)""",
    "55-A": """Article 55-A. The National Data Protection Agency (ANPD) is hereby established as a special-status federal autonomous entity linked to the Ministry of Justice and Public Security, endowed with functional, technical, decision-making, administrative and financial autonomy, with its own assets and with headquarters and legal venue in the Federal District, pursuant to Law No. 13,848 of June 25, 2019. (Wording given by Law No. 15,352/2026)

Paragraph 1. (Repealed by Law No. 14,460/2022)

Paragraph 2. (Repealed by Law No. 14,460/2022)

Paragraph 3. (Repealed by Law No. 14,460/2022)""",
    "55-C": """Article 55-C. ANPD consists of:

I – the Board of Directors, its highest governing body;

II – the National Council for the Protection of Personal Data and Privacy;

III – the Internal Affairs Office;

IV – the Ombudsman's Office;

V – (repealed);

V-A – the Attorney's Office;

V-B – the Audit Office; and

VI – administrative units and specialized units.""",
}

NON_OPERATIVE_HEADINGS = {
    "PRELIMINARY PROVISIONS",
    "PROCESSING OF PERSONAL DATA",
    "PROCESSING OF SENSITIVE PERSONAL DATA",
    "PROCESSING OF CHILDREN’S AND ADOLESCENTS’ PERSONAL DATA",
    "TERMINATION OF DATA PROCESSING",
    "DATA SUBJECT’S RIGHTS",
    "PROCESSING OF PERSONAL DATA BY GOVERNMENT AUTHORITIES",
    "INTERNATIONAL DATA TRANSFER",
    "PERSONAL DATA PROCESSING AGENTS",
    "DATA PROTECTION OFFICER",
    "LIABILITY AND DAMAGE COMPENSATION",
    "SECURITY AND GOOD PRACTICES",
    "DATA SECURITY AND CONFIDENTIALITY",
    "GOOD PRACTICES AND GOVERNANCE",
    "ENFORCEMENT",
    "PERSONAL DATA AND PRIVACY PROTECTION",
    "THE NATIONAL DATA PROTECTION AUTHORITY (ANPD)",
    "THE NATIONAL COUNCIL FOR THE PROTECTION OF PERSONAL DATA AND PRIVACY",
    "FINAL AND TRANSITIONAL PROVISIONS",
    "REQUIREMENTS FOR THE PROCESSING OF PERSONAL DATA",
    "RULES",
    "LIABILITY",
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def pdf_text(path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", str(path), "-"],
        check=True,
        stdout=subprocess.PIPE,
    )
    return result.stdout.decode("utf-8")


def remove_non_operative_headings(value: str) -> str:
    kept: list[str] = []
    for raw_line in value.replace("\f", "\n").splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        upper = line.upper()
        if re.fullmatch(r"CHAPTER\s+[IVXLCDM]+", upper):
            continue
        if re.fullmatch(r"SECTION\s+[IVXLCDM]+", upper):
            continue
        if upper in NON_OPERATIVE_HEADINGS:
            continue
        kept.append(raw_line)
    return "\n".join(kept)


def reflow_article(value: str) -> str:
    blocks = []
    for block in re.split(r"\n\s*\n", value):
        text = re.sub(r"\s+", " ", block).strip()
        if text:
            blocks.append(text)
    return "\n\n".join(blocks).strip()


def extract_english_articles(source_text: str) -> dict[str, str]:
    value = remove_non_operative_headings(source_text)
    pattern = re.compile(
        r"(?m)^[ \t]*\.?\s*Article\s+(\d+(?:-[A-Z])?)\.\s*"
    )
    matches = list(pattern.finditer(value))
    articles: dict[str, str] = {}
    for index, match in enumerate(matches):
        number = match.group(1)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(value)
        body = value[match.end():end]
        if number == "65":
            body = re.split(r"(?m)^Brasília,|^MICHEL TEMER", body, maxsplit=1)[0]
        full_text = reflow_article(f"Article {number}. {body}")
        if number in articles:
            raise ValueError(f"Duplicate ANPD English Article {number}")
        articles[number] = full_text

    if len(articles) != 80:
        raise ValueError(
            f"Expected 80 ANPD English Article identifiers; found {len(articles)}"
        )
    return articles


def load_source_manifest(path: Path) -> dict:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != "1.0":
        raise ValueError("Unsupported LGPD English source-manifest schema")
    if manifest.get("instrumentId") != "br-lgpd-2018":
        raise ValueError("LGPD English source manifest has the wrong instrumentId")

    primary = manifest.get("primarySource", {})
    snapshot = manifest.get("normalizedSnapshot", {})
    if not re.fullmatch(r"[0-9a-f]{64}", primary.get("sha256", "")):
        raise ValueError("LGPD English source manifest lacks a valid PDF SHA-256")
    if not re.fullmatch(r"[0-9a-f]{64}", snapshot.get("sha256", "")):
        raise ValueError("LGPD English source manifest lacks a valid snapshot SHA-256")
    if snapshot.get("derivedFromPdfSha256") != primary["sha256"]:
        raise ValueError("LGPD English snapshot/PDF provenance chain is inconsistent")
    return manifest


def load_english_source(path: Path, manifest: dict) -> tuple[str, dict]:
    primary = manifest["primarySource"]
    snapshot = manifest["normalizedSnapshot"]

    payload = path.read_bytes()
    actual_sha256 = sha256_bytes(payload)
    if path.suffix.lower() == ".pdf":
        if actual_sha256 != primary["sha256"]:
            raise ValueError(
                "ANPD English PDF hash does not match the pinned source manifest"
            )
        source_text = pdf_text(path)
    else:
        if actual_sha256 != snapshot["sha256"]:
            raise ValueError(
                "ANPD English text-snapshot hash does not match the pinned source manifest"
            )
        source_text = payload.decode("utf-8")

    provenance = {
        "sourceDocumentSha256": primary["sha256"],
        "sourceTextSnapshot": snapshot["path"],
        "sourceTextSnapshotSha256": snapshot["sha256"],
        "sourceManifest": manifest["manifestPath"],
    }
    return source_text, provenance


def official_translation(number: str, full_text: str, provenance: dict) -> dict:
    authority_note = (
        "The Portuguese consolidation is the controlling legal text. This English "
        "reference was published by ANPD in 2024. Its wording was compared with the "
        "current Portuguese Article as of 20 July 2026; this Article was not changed "
        "by Law No. 15,352/2026."
    )
    return {
        "title": f"Article {number}",
        "paragraphs": [full_text],
        "fullText": full_text,
        "language": "en",
        "coverageStatus": "complete-current-wording-official-reference-translation",
        **ANPD_VERSION,
        "status": "official-reference-translation-no-legal-effect",
        "note": authority_note,
        "authorityNote": authority_note,
        "source": ANPD_ENGLISH_URL,
        "sourcePage": ANPD_ENGLISH_PAGE,
        "sourceLabel": "ANPD official English reference translation",
        **provenance,
        "contentSha256": sha256_text(full_text),
        "rights": ANPD_RIGHTS,
    }


def current_project_translation(
    number: str,
    current_text: str,
    historical_text: str,
    provenance: dict,
) -> dict:
    authority_note = (
        "The official current Portuguese consolidation controls. ANPD's 2024 English "
        "reference predates Law No. 15,352/2026 for this Article. The displayed English "
        "text is a project-authored reference translation of the current Portuguese "
        "wording and has no legal effect."
    )
    return {
        "title": f"Article {number}",
        "paragraphs": [current_text],
        "fullText": current_text,
        "language": "en",
        "coverageStatus": "complete-current-project-reference-translation",
        "versionAsOf": "2026-07-20",
        "versionLabel": (
            "Current Portuguese consolidation through Law No. 15,352/2026"
        ),
        "currentTextEquivalent": True,
        "status": "project-authored-reference-translation-no-legal-effect",
        "note": authority_note,
        "authorityNote": authority_note,
        "source": LAW_15352_URL,
        "sourceLabel": (
            "Presidency of the Republic — current Portuguese consolidation and "
            "Law No. 15,352/2026"
        ),
        "contentSha256": sha256_text(current_text),
        "rights": PROJECT_RIGHTS,
        "historicalOfficialReference": {
            "paragraphs": [historical_text],
            "fullText": historical_text,
            "language": "en",
            "coverageStatus": "complete-superseded-official-reference-translation",
            **ANPD_VERSION,
            "status": "historical-official-reference-translation-no-legal-effect",
            "source": ANPD_ENGLISH_URL,
            "sourcePage": ANPD_ENGLISH_PAGE,
            **provenance,
            "contentSha256": sha256_text(historical_text),
            "rights": ANPD_RIGHTS,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("corpus", nargs="?", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument(
        "english_source",
        nargs="?",
        type=Path,
        default=DEFAULT_ENGLISH_SNAPSHOT,
        help="Pinned normalized text snapshot (default) or the exact pinned ANPD PDF",
    )
    parser.add_argument("output", nargs="?", type=Path)
    parser.add_argument(
        "--source-manifest",
        type=Path,
        default=DEFAULT_SOURCE_MANIFEST,
    )
    args = parser.parse_args()
    output = args.output or args.corpus

    records = json.loads(args.corpus.read_text(encoding="utf-8"))
    manifest = load_source_manifest(args.source_manifest)
    source_text, provenance = load_english_source(args.english_source, manifest)
    english = extract_english_articles(source_text)

    identifiers = [record["articleNumber"] for record in records]
    if len(records) != 80 or set(identifiers) != set(english):
        raise ValueError("Portuguese and ANPD English Article identifiers do not align")

    for record in records:
        number = record["articleNumber"]
        historical = english[number]
        if number in CURRENT_PROJECT_TRANSLATIONS:
            translation = current_project_translation(
                number,
                CURRENT_PROJECT_TRANSLATIONS[number],
                historical,
                provenance,
            )
        else:
            translation = official_translation(number, historical, provenance)
        if translation["fullText"] != "\n\n".join(translation["paragraphs"]):
            raise ValueError(f"English paragraph alignment failed for Article {number}")
        record["translations"] = {"en": translation}
        record["englishAvailability"] = None
        record["summary"] = (
            f"High-level orientation: {record['title']}. Complete current Portuguese "
            "text and a complete, source- and version-labelled English reference are "
            "stored; consult the displayed translation notice for legal authority."
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        "Attached complete English text to 80 LGPD Article identifiers "
        "(77 ANPD-current-wording references; 3 current project references)."
    )


if __name__ == "__main__":
    main()
