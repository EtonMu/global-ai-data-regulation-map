#!/usr/bin/env python3
"""Build an aligned bilingual provision corpus from Justice Laws XML."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

LIMS = "http://justice.gc.ca/lims"


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    tokens = [value.replace("\u00a0", " ").strip() for value in element.itertext()]
    value = " ".join(token for token in tokens if token)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([‘“«(])\s+", r"\1", value)
    value = re.sub(r"\s+([’”»)])", r"\1", value)
    return value


def slug(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z]+", "-", value).strip("-").lower()


def direct_substantive_blocks(element: ET.Element) -> list[str]:
    ignored = {
        "MarginalNote",
        "Label",
        "HistoricalNote",
        "Footnote",
        "ScheduleFormHeading",
    }
    blocks = []
    for child in element:
        if child.tag in ignored:
            continue
        if child.tag == "DocumentInternal":
            for nested in child:
                value = normalized_text(nested)
                if value:
                    blocks.append(value)
            continue
        value = normalized_text(child)
        if value:
            blocks.append(value)
    return blocks or [normalized_text(element)]


def label_text(section: ET.Element) -> str:
    value = normalized_text(section.find("Label"))
    if value:
        value = value.lstrip("*").strip()
    if value:
        return value
    whole = normalized_text(section)
    match = re.search(r"(?:^|\s)(\d+(?:\.\d+)?)\s", whole)
    if not match:
        raise ValueError("Section label is missing")
    return match.group(1)


def current_metadata(root: ET.Element) -> tuple[str | None, str | None]:
    current = root.get(f"{{{LIMS}}}current-date")
    amended = root.get(f"{{{LIMS}}}lastAmendedDate")
    return current, amended


def sha256(value: str | bytes) -> str:
    payload = value.encode("utf-8") if isinstance(value, str) else value
    return hashlib.sha256(payload).hexdigest()


def body_units(root: ET.Element) -> list[dict]:
    body = root.find("Body")
    if body is None:
        raise ValueError("Body is missing")
    units = []
    chapter = {"id": "body", "label": "Body", "title": "Act"}
    section_heading = None
    for child in body:
        if child.tag == "Heading":
            level = child.get("level") or "1"
            label = normalized_text(child.find("Label"))
            title = normalized_text(child.find("TitleText")) or label or "Act"
            identifier = slug(" ".join(value for value in (label, title) if value))
            if level == "1":
                chapter = {
                    "id": identifier or "body",
                    "label": label or title,
                    "title": title,
                }
                section_heading = None
            else:
                section_heading = {
                    "id": identifier or f"{chapter['id']}-section",
                    "label": label or title,
                    "title": title,
                }
            continue
        if child.tag != "Section":
            continue
        label = label_text(child)
        locator_key = "-".join(re.findall(r"\d+", label))
        title = normalized_text(child.find("MarginalNote")) or f"Section {label}"
        units.append(
            {
                "key": f"sec-{locator_key or slug(label)}",
                "number": label,
                "label": f"Section {label}",
                "title": title,
                "chapter": chapter,
                "section": section_heading,
                "paragraphs": direct_substantive_blocks(child),
                "effectiveFrom": child.get(f"{{{LIMS}}}inforce-start-date"),
                "lastAmendedOn": child.get(f"{{{LIMS}}}lastAmendedDate"),
            }
        )
    return units


def schedule_units(root: ET.Element) -> list[dict]:
    units = []
    for index, schedule in enumerate(root.findall("Schedule"), start=1):
        if schedule.get("id") == "NifProvs":
            continue
        heading = schedule.find("ScheduleFormHeading")
        label = normalized_text(heading.find("Label") if heading is not None else None)
        label = label or f"SCHEDULE {index}"
        title = normalized_text(heading.find("TitleText") if heading is not None else None)
        title = title or normalized_text(schedule.find(".//title")) or label.title()
        number = re.search(r"\d+", label)
        key = f"sch-{number.group(0) if number else index}"
        units.append(
            {
                "key": key,
                "number": number.group(0) if number else str(index),
                "label": label.title(),
                "title": title,
                "chapter": {
                    "id": "schedules",
                    "label": "Schedules",
                    "title": "Schedules",
                },
                "section": None,
                "paragraphs": direct_substantive_blocks(schedule),
                "effectiveFrom": schedule.get(f"{{{LIMS}}}inforce-start-date"),
                "lastAmendedOn": schedule.get(f"{{{LIMS}}}lastAmendedDate"),
            }
        )
    return units


def aligned_units(english_root: ET.Element, french_root: ET.Element) -> list[tuple[dict, dict]]:
    english = body_units(english_root) + schedule_units(english_root)
    french = body_units(french_root) + schedule_units(french_root)
    if len(english) != len(french):
        raise ValueError(f"EN/FR unit count differs: {len(english)} != {len(french)}")
    aligned = []
    for en_unit, fr_unit in zip(english, french, strict=True):
        if en_unit["key"] != fr_unit["key"]:
            raise ValueError(
                f"EN/FR locator mismatch: {en_unit['key']} != {fr_unit['key']}"
            )
        if len(en_unit["paragraphs"]) != len(fr_unit["paragraphs"]):
            en_unit["paragraphs"] = [" ".join(en_unit["paragraphs"])]
            fr_unit["paragraphs"] = [" ".join(fr_unit["paragraphs"])]
        aligned.append((en_unit, fr_unit))
    return aligned


NIF_TITLES = {
    "389": (
        "Data mobility framework and regulations (proposed sections 10.4–10.6)",
        "Cadre de mobilité des données et règlements (articles 10.4 à 10.6 proposés)",
    ),
    "390": ("Complaints concerning Division 1.2", "Plaintes relatives à la section 1.2"),
    "391": ("Court application concerning Division 1.2", "Demande à la Cour relative à la section 1.2"),
    "392": ("Court remedial power for Division 1.2", "Pouvoir de réparation de la Cour pour la section 1.2"),
    "393": ("Compliance agreements concerning Division 1.2", "Accords de conformité relatifs à la section 1.2"),
    "394": ("Audit authority concerning Division 1.2", "Pouvoir de vérification relatif à la section 1.2"),
    "395": ("Organizational policies for Division 1.2", "Politiques organisationnelles pour la section 1.2"),
    "396": ("Whistleblowing concerning Division 1.2", "Dénonciation relative à la section 1.2"),
    "397": ("Employee protection concerning Division 1.2", "Protection des employés relative à la section 1.2"),
}


NIF_CONCEPTS = {
    "389": [
        "data-subject-rights",
        "security-controls",
        "third-party-supply-chain",
        "accountability-governance",
    ],
    "390": ["data-subject-rights", "accountability-governance"],
    "391": ["data-subject-rights", "accountability-governance"],
    "392": ["data-subject-rights", "accountability-governance"],
    "393": ["accountability-governance", "continuous-assurance"],
    "394": ["accountability-governance", "continuous-assurance"],
    "395": ["accountability-governance", "privacy-by-design-default"],
    "396": ["accountability-governance"],
    "397": ["accountability-governance"],
}


def not_in_force_units(root: ET.Element) -> list[dict]:
    schedule = root.find("./Schedule[@id='NifProvs']")
    if schedule is None:
        return []
    units = []
    for related in schedule.findall(".//RelatedOrNotInForce"):
        section = related.find("./Section")
        if section is None:
            continue
        number = normalized_text(section.find("Label"))
        if number not in NIF_TITLES:
            continue
        citation = normalized_text(related.find("./Heading/TitleText")).lstrip("— ")
        paragraphs = direct_substantive_blocks(section)
        if not paragraphs:
            raise ValueError(f"No text in PIPEDA amendment not in force {number}")
        units.append(
            {
                "key": f"nif-2026-c3-s{number}",
                "number": number,
                "citation": citation,
                "paragraphs": paragraphs,
            }
        )
    expected = [str(number) for number in range(389, 398)]
    if [unit["number"] for unit in units] != expected:
        raise ValueError(
            "Expected PIPEDA amendments not in force 389-397, got "
            f"{[unit['number'] for unit in units]}"
        )
    return units


def aligned_not_in_force_units(
    english_root: ET.Element, french_root: ET.Element
) -> list[tuple[dict, dict]]:
    english = not_in_force_units(english_root)
    french = not_in_force_units(french_root)
    if [unit["number"] for unit in english] != [unit["number"] for unit in french]:
        raise ValueError("English/French amendments-not-in-force alignment differs")
    return list(zip(english, french, strict=True))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("english_xml", type=Path)
    parser.add_argument("french_xml", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--instrument-id", required=True)
    parser.add_argument("--id-prefix", required=True)
    parser.add_argument("--english-url", required=True)
    parser.add_argument("--french-url", required=True)
    parser.add_argument("--retrieved-on", required=True)
    parser.add_argument("--snapshot-directory", type=Path)
    args = parser.parse_args()

    english_bytes = args.english_xml.read_bytes()
    french_bytes = args.french_xml.read_bytes()
    english_root = ET.parse(args.english_xml).getroot()
    french_root = ET.parse(args.french_xml).getroot()
    current_date, last_amended = current_metadata(english_root)
    english_snapshot_name = "ca-pipeda-current-2026-03-31-en.xml"
    french_snapshot_name = "ca-pipeda-current-2026-03-31-fr.xml"
    if args.snapshot_directory:
        args.snapshot_directory.mkdir(parents=True, exist_ok=True)
        (args.snapshot_directory / english_snapshot_name).write_bytes(english_bytes)
        (args.snapshot_directory / french_snapshot_name).write_bytes(french_bytes)
    source_snapshots = {
        "en": {
            "path": f"data/v2/source-snapshots/{english_snapshot_name}",
            "sha256": sha256(english_bytes),
        },
        "fr": {
            "path": f"data/v2/source-snapshots/{french_snapshot_name}",
            "sha256": sha256(french_bytes),
        },
    }
    records = []
    for english, french in aligned_units(english_root, french_root):
        english_full_text = "\n\n".join(english["paragraphs"])
        french_full_text = "\n\n".join(french["paragraphs"])
        records.append(
            {
                "id": f"{args.id_prefix}{english['key']}",
                "instrumentId": args.instrument_id,
                "articleNumber": english["number"],
                "label": english["label"],
                "title": english["title"],
                "originalTitle": french["title"],
                "chapter": english["chapter"],
                "section": english["section"],
                "paragraphs": french["paragraphs"],
                "fullText": french_full_text,
                "contentSha256": sha256(french_full_text),
                "language": "fr",
                "textAvailability": "official-co-authentic-current-in-force-text",
                "source": args.french_url,
                "sourceFragment": args.french_url,
                "sourceLabel": "Justice Laws Website — texte français officiel",
                "retrievedOn": args.retrieved_on,
                "versionAsOf": current_date,
                "effectiveFrom": french["effectiveFrom"],
                "lastAmendedOn": last_amended,
                "sourceSnapshots": source_snapshots,
                "translations": {
                    "en": {
                        "title": english["title"],
                        "paragraphs": english["paragraphs"],
                        "fullText": english_full_text,
                        "contentSha256": sha256(english_full_text),
                        "status": "official",
                        "note": "English and French enactments are equally authoritative. English is the interface default; this field is not an unofficial translation.",
                        "source": {
                            "url": args.english_url,
                            "label": "Justice Laws Website — official English text",
                            "accessedOn": args.retrieved_on,
                        },
                    }
                },
                "rights": {
                    "reuseStatus": "open-government-edict",
                    "license": "Reproduction of Federal Law Order, SI/97-5",
                    "licenseUrl": "https://laws-lois.justice.gc.ca/eng/regulations/si-97-5/page-1.html",
                    "attribution": "Reproduced from the consolidated enactment published by the Minister of Justice; this project does not represent its copy as an official version.",
                },
            }
        )

    for english, french in aligned_not_in_force_units(english_root, french_root):
        number = english["number"]
        english_full_text = "\n\n".join(english["paragraphs"])
        french_full_text = "\n\n".join(french["paragraphs"])
        title_en, title_fr = NIF_TITLES[number]
        records.append(
            {
                "id": f"{args.id_prefix}{english['key']}",
                "instrumentId": args.instrument_id,
                "unitType": "amending-section-not-in-force",
                "articleNumber": f"NIF-{number}",
                "label": f"2026 c. 3, s. {number} — not in force",
                "title": title_en,
                "originalTitle": title_fr,
                "chapter": {
                    "id": "amendments-not-in-force",
                    "label": "Amendments not in force",
                    "title": "S.C. 2026, c. 3, Division 23",
                },
                "section": None,
                "paragraphs": french["paragraphs"],
                "fullText": french_full_text,
                "contentSha256": sha256(french_full_text),
                "language": "fr",
                "textAvailability": "official-co-authentic-enacted-amendment-not-in-force",
                "source": args.french_url,
                "sourceFragment": "https://laws-lois.justice.gc.ca/fra/XML/P-8.6.xml#NifProvs",
                "sourceLabel": "Site Web de la législation (Justice) — modifications non en vigueur",
                "retrievedOn": args.retrieved_on,
                "versionAsOf": current_date,
                "effectiveFrom": None,
                "lastAmendedOn": last_amended,
                "legalEffectStatus": "enacted-not-in-force-order-in-council-required",
                "enactedOn": "2026-03-26",
                "commencementAuthority": "S.C. 2026, c. 3, s. 398",
                "sourceSnapshots": source_snapshots,
                "summary": title_en,
                "coreConceptIds": NIF_CONCEPTS[number],
                "thematicRelevance": {
                    "isRelevant": True,
                    "highlightEntireUnit": True,
                    "themes": ["privacy", "data mobility", "accountability"],
                },
                "translations": {
                    "en": {
                        "title": title_en,
                        "paragraphs": english["paragraphs"],
                        "fullText": english_full_text,
                        "contentSha256": sha256(english_full_text),
                        "status": "official",
                        "note": "English and French enactments are equally authoritative. This enacted amending section is not yet in force; English is the interface default.",
                        "source": {
                            "url": "https://laws-lois.justice.gc.ca/eng/XML/P-8.6.xml#NifProvs",
                            "label": "Justice Laws Website — official amendments-not-in-force text",
                            "accessedOn": args.retrieved_on,
                        },
                    }
                },
                "rights": {
                    "reuseStatus": "open-government-edict",
                    "license": "Reproduction of Federal Law Order, SI/97-5",
                    "licenseUrl": "https://laws-lois.justice.gc.ca/eng/regulations/si-97-5/page-1.html",
                    "attribution": "Reproduced from the enactment and amendments-not-in-force publication of the Minister of Justice; this project does not represent its copy as an official version.",
                },
            }
        )

    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Extracted {len(records)} aligned EN/FR units "
        f"(75 current top-level units plus 9 enacted amendments not in force; "
        f"version {current_date}, last in-force amendment {last_amended}) to {args.output}"
    )


if __name__ == "__main__":
    main()
