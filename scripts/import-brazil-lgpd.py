#!/usr/bin/env python3
"""Extract the current Portuguese LGPD consolidation from Planalto HTML."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from lxml import html


TITLES = {
    "1": "Subject matter and objectives",
    "2": "Foundations of personal-data protection",
    "3": "Material and territorial scope",
    "4": "Exclusions from scope",
    "5": "Definitions",
    "6": "Processing principles",
    "7": "Lawful bases for processing",
    "8": "Conditions for consent",
    "9": "Transparent access to processing information",
    "10": "Legitimate-interest processing",
    "11": "Processing sensitive personal data",
    "12": "Anonymised data",
    "13": "Public-health research",
    "14": "Children’s and adolescents’ data",
    "15": "Termination of processing",
    "16": "Retention after processing ends",
    "17": "Data-subject status and fundamental rights",
    "18": "Data-subject requests",
    "19": "Confirmation and access responses",
    "20": "Review of automated decisions",
    "21": "Non-discrimination for exercising rights",
    "22": "Collective defence of data-subject interests",
    "23": "Public-sector processing",
    "24": "State-owned enterprises",
    "25": "Interoperability of public-sector data",
    "26": "Public-sector data sharing",
    "27": "Public-to-private data sharing",
    "28": "Vetoed provision",
    "29": "ANPD review of public-sector processing",
    "30": "Supplementary public-sector rules",
    "31": "Public-body violations",
    "32": "Publication of data-protection impact reports",
    "33": "Permitted international transfers",
    "34": "Adequacy assessment",
    "35": "Contractual clauses and transfer safeguards",
    "36": "Changes to transfer safeguards",
    "37": "Records of processing operations",
    "38": "Data-protection impact report",
    "39": "Processor instructions and compliance",
    "40": "Interoperability and data portability standards",
    "41": "Data-protection officer",
    "42": "Civil liability for damage",
    "43": "Defences to liability",
    "44": "Irregular processing and security expectations",
    "45": "Consumer-law remedies",
    "46": "Security measures",
    "47": "Continuing duty of security",
    "48": "Security-incident notification",
    "49": "Privacy-oriented system design",
    "50": "Governance and good-practice programmes",
    "51": "Technical standards",
    "52": "Administrative sanctions",
    "53": "Sanctioning procedure",
    "54": "Daily fines",
    "55": "Vetoed provision",
    "55-A": "Creation and legal status of the ANPD",
    "55-B": "Repealed provision",
    "55-C": "ANPD composition",
    "55-D": "ANPD Board of Directors",
    "55-E": "Loss of office by Board members",
    "55-F": "Post-office restrictions",
    "55-G": "ANPD organisational structure",
    "55-H": "ANPD commissioned positions",
    "55-I": "ANPD personnel",
    "55-J": "ANPD powers and duties",
    "55-K": "Exclusive sanctioning competence of ANPD",
    "55-L": "ANPD revenues",
    "55-M": "ANPD assets",
    "56": "Vetoed provision",
    "57": "Vetoed provision",
    "58": "Vetoed provision",
    "58-A": "National Council composition",
    "58-B": "National Council powers",
    "59": "Vetoed provision",
    "60": "Amendments to the Brazilian Internet Act",
    "61": "Service on foreign companies",
    "62": "ANPD and education-record access",
    "63": "Progressive compliance for legacy databases",
    "64": "Complementary rights and principles",
    "65": "Entry into force",
}


def normalize(value: str) -> str:
    value = value.replace("\u00a0", " ").replace("\x96", "–")
    return re.sub(r"\s+", " ", value).strip()


def article_match(value: str) -> re.Match[str] | None:
    return re.match(
        r"^Art\.\s*((?:\d\s*)+)(?:-\s*([A-Z]))?(?:º|\.)",
        value,
        re.IGNORECASE,
    )


def article_number(match: re.Match[str]) -> str:
    base = re.sub(r"\s+", "", match.group(1))
    suffix = match.group(2)
    return f"{base}-{suffix.upper()}" if suffix else base


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    document = html.fromstring(args.input.read_bytes().decode("iso-8859-1"))
    paragraphs = document.xpath("//p")
    chapter = {
        "id": "br-lgpd-general-provisions",
        "label": "LGPD",
        "title": "Lei Geral de Proteção de Dados Pessoais",
    }
    current: dict | None = None
    records: list[dict] = []

    def finish() -> None:
        nonlocal current
        if current is None:
            return
        if not current["paragraphs"]:
            raise ValueError(f"No text captured for Article {current['articleNumber']}")
        current["fullText"] = "\n\n".join(current["paragraphs"])
        records.append(current)
        current = None

    for paragraph in paragraphs:
        value = normalize(paragraph.text_content())
        if not value:
            continue
        upper = value.upper()
        if upper.startswith("CAPÍTULO") and len(value) < 180:
            chapter = {
                "id": f"br-lgpd-{re.sub(r'[^0-9a-z]+', '-', value.lower()).strip('-')}",
                "label": value,
                "title": value,
            }
            continue
        match = article_match(value)
        if match:
            finish()
            number = article_number(match)
            title = TITLES.get(number)
            if title is None:
                raise ValueError(f"Missing editorial title for Article {number}")
            slug = number.lower().replace("-", "-")
            current = {
                "id": f"br-lgpd-art-{slug}",
                "instrumentId": "br-lgpd-2018",
                "articleNumber": number,
                "label": f"Art. {number}",
                "title": title,
                "chapter": chapter,
                "section": None,
                "paragraphs": [value],
                "language": "pt-BR",
                "textAvailability": "official-current-consolidated-text",
                "source": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm",
                "sourceFragment": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm",
                "sourceLabel": "Presidência da República — texto compilado oficial",
                "retrievedOn": args.retrieved_on,
                "versionAsOf": args.retrieved_on,
                "summary": f"Editorial orientation title: {title}. Read the official Portuguese text for the operative wording.",
                "rights": {
                    "reuseStatus": "government-edict",
                    "license": "Official acts excluded from copyright under Lei nº 9.610/1998, Article 8(IV)",
                    "licenseUrl": "https://www.planalto.gov.br/ccivil_03/leis/l9610.htm",
                    "attribution": "Source: Presidência da República, official consolidated LGPD text. Editorial English headings are project-authored.",
                },
            }
            continue
        if current is None:
            continue
        if value.startswith("Brasília"):
            finish()
            break
        if upper.startswith(("SEÇÃO ", "SEÇÃO I", "SEÇÃO II", "SEÇÃO III")):
            continue
        current["paragraphs"].append(value)

    finish()
    identifiers = [record["articleNumber"] for record in records]
    if len(records) != 80 or len(set(identifiers)) != 80:
        raise ValueError(
            f"Expected 80 current Article identifiers (including vetoed/repealed and lettered provisions), got {len(records)}"
        )

    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Extracted {len(records)} current LGPD Article identifiers to {args.output}")


if __name__ == "__main__":
    main()
