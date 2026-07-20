#!/usr/bin/env python3
"""Generate the 66 NDPA 2023 sections and its complete Schedule."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from legal_corpus_utils import (
    assert_sequential,
    content_sha256,
    load_snapshot,
    merge_wrapped_lines,
    normal_key,
    write_json,
)


INSTRUMENT_ID = "ng-data-protection-act-2023"
SOURCE = "https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf"
LANDING_PAGE = "https://ndpc.gov.ng/download/nigeria-data-protection-act-2023"
RIGHTS = {
    "reuseStatus": "government-edict",
    "license": (
        "Official legislative texts and official translations are ineligible for "
        "copyright under section 3(b) of the Copyright Act, 2022"
    ),
    "licenseUrl": (
        "https://www.copyright.gov.ng/wp-content/uploads/2023/04/"
        "CopyrightAct2023FinalPublication1.pdf"
    ),
    "attribution": "Federal Republic of Nigeria Official Gazette; official copy hosted by the NDPC.",
}

PARTS = [
    (1, 3, "I", "Objectives and application"),
    (4, 13, "II", "Establishment of the Nigeria Data Protection Commission and its Governing Council"),
    (14, 18, "III", "Appointment of the National Commissioner and other staff"),
    (19, 23, "IV", "Financial provisions"),
    (24, 33, "V", "Principles and lawful basis governing processing of personal data"),
    (34, 38, "VI", "Rights of a data subject"),
    (39, 40, "VII", "Data security"),
    (41, 43, "VIII", "Cross-border transfers of personal data"),
    (44, 45, "IX", "Registration and fees"),
    (46, 53, "X", "Enforcement"),
    (54, 59, "XI", "Legal proceedings"),
    (60, 66, "XII", "Miscellaneous provisions"),
]

HEADER_PATTERNS = [
    re.compile(r"Nigeria Data Protection Act, 2023 2022 No\. 37 A \d+"),
    re.compile(r"A \d+ 2023 No\. 37 Nigeria Data Protection Act, 2023"),
]

# These are Gazette margin citations to Acts mentioned on the surrounding page,
# not words in the numbered NDPA provisions.  Source-line targeting keeps the
# exclusion auditable and avoids deleting genuine inline citations (for example,
# the Child's Right Act reference in section 65).
MARGINAL_REFERENCE_SOURCE_LINES = {
    369,
    370,
    462,
    463,
    815,
    816,
    1289,
    1290,
    1298,
    1299,
}


def clean_line(value: str) -> str:
    value = value.replace("\u0002", "-").replace("ż42", "42")
    for pattern in HEADER_PATTERNS:
        value = pattern.sub("", value)
    return re.sub(r"\s+", " ", value).strip()


def part_for(number: int) -> dict:
    for first, last, roman, title in PARTS:
        if first <= number <= last:
            return {
                "id": f"{INSTRUMENT_ID}-part-{roman.lower()}",
                "label": f"Part {roman}",
                "title": title,
            }
    raise ValueError(f"No Part mapping for section {number}")


def strip_marginal_titles(lines: list[str], titles: list[str]) -> list[str]:
    """Remove PDF margin headings without deleting statutory body text."""

    values = [line for line in lines if line]
    keys = sorted({normal_key(title): title for title in titles}.items(), key=lambda x: -len(x[0]))
    changed = True
    while changed:
        changed = False
        for start in range(len(values)):
            for size in range(1, min(9, len(values) - start + 1)):
                joined = " ".join(values[start : start + size])
                if any(normal_key(joined) == key for key, _ in keys):
                    del values[start : start + size]
                    changed = True
                    break
            if changed:
                break

    for index, line in enumerate(values):
        for _, title in keys:
            suffix = " " + title
            if line.endswith(suffix) and re.match(r"^\d+\.(?:—|\s)", line):
                values[index] = line[: -len(suffix)].rstrip()
                break
    return [line for line in values if line]


def is_structure(line: str) -> bool:
    if line.startswith("PART "):
        return True
    letters = [char for char in line if char.isalpha()]
    return len(letters) >= 5 and all(char.isupper() for char in letters)


def merge_schedule(lines: list[str]) -> list[str]:
    headings = {
        "Council to Regulate Proceedings",
        "Presiding Officer",
        "Quorum",
        "Voting",
        "Teleconference meeting",
        "Committees of the Council",
        "Seal of the Commission",
        "Miscellaneous",
    }
    paragraphs: list[str] = []
    for line in lines:
        if not line:
            continue
        if not paragraphs or line in headings or re.match(r"^\d+\. ", line):
            paragraphs.append(line)
        else:
            separator = "" if paragraphs[-1].endswith("-") else " "
            paragraphs[-1] += separator + line
    return paragraphs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    _, snapshot_lines = load_snapshot(args.input)
    lines = [
        {"sourceLine": int(item["sourceLine"]), "text": clean_line(str(item["text"]))}
        for item in snapshot_lines
    ]

    titles: dict[int, str] = {}
    for item in lines:
        if item["sourceLine"] >= 100:
            continue
        match = re.match(r"^(\d+)\. (.+)$", item["text"])
        if match:
            number = int(match.group(1))
            if 1 <= number <= 66:
                title = match.group(2).strip()
                for pattern in HEADER_PATTERNS:
                    title = pattern.sub("", title).strip()
                titles[number] = title
    if sorted(titles) != list(range(1, 67)):
        raise ValueError(f"Arrangement did not yield all 66 section titles: {sorted(titles)}")

    starts: list[tuple[int, int, int]] = []
    for index, item in enumerate(lines):
        if not 111 <= item["sourceLine"] <= 1570:
            continue
        match = re.match(r"^(\d+)\.(?:—|\s)", item["text"])
        if match:
            number = int(match.group(1))
            if 1 <= number <= 66:
                starts.append((index, item["sourceLine"], number))
    if [number for _, _, number in starts] != list(range(1, 67)):
        raise ValueError(f"Body did not yield sequential sections 1..66: {starts}")

    schedule_index = next(
        index
        for index, item in enumerate(lines)
        if item["sourceLine"] == 1571 and item["text"].startswith("SCHEDULE")
    )
    all_titles = list(titles.values())
    records: list[dict] = []

    for offset, (start, source_start, number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else schedule_index
        candidates = [
            item["text"]
            for item in lines[start:end]
            if item["text"]
            and item["sourceLine"] not in MARGINAL_REFERENCE_SOURCE_LINES
            and not is_structure(item["text"])
        ]
        candidates = strip_marginal_titles(candidates, all_titles)
        paragraphs = merge_wrapped_lines(candidates)
        if not paragraphs or not re.match(rf"^{number}\.(?:—|\s)", paragraphs[0]):
            raise ValueError(f"Section {number} lost its opening marker: {paragraphs[:2]}")
        full_text = "\n\n".join(paragraphs)
        source_end = max(item["sourceLine"] for item in lines[start:end])
        records.append(
            {
                "id": f"ng-ndpa-2023-s-{number}",
                "instrumentId": INSTRUMENT_ID,
                "articleNumber": str(number),
                "label": f"Section {number}",
                "title": titles[number],
                "chapter": part_for(number),
                "section": None,
                "paragraphs": paragraphs,
                "fullText": full_text,
                "language": "en-NG",
                "textAvailability": "official-enacted-text",
                "source": SOURCE,
                "sourceFragment": SOURCE,
                "canonicalSource": LANDING_PAGE,
                "sourceLabel": "Nigeria Data Protection Commission — official Gazette copy",
                "sourceLineRange": {"start": source_start, "end": source_end},
                "retrievedOn": args.retrieved_on,
                "versionAsOf": args.retrieved_on,
                "effectiveFrom": "2023-06-12",
                "legalEffectStatus": "in-force-unamended",
                "sourceVersion": {
                    "officialTitle": "Nigeria Data Protection Act, 2023",
                    "actNumber": "37 of 2023",
                    "assentedOn": "2023-06-12",
                    "gazettedOn": "2023-07-01",
                    "status": "in-force",
                    "versionNote": (
                        "The official NDPC copy remains the enacted Act. National Assembly "
                        "records reviewed through 20 July 2026 show amendment bills, not an "
                        "enacted amending Act."
                    ),
                },
                "summary": f"Official marginal heading: {titles[number]}. Complete enacted wording is stored.",
                "rights": RIGHTS,
                "contentSha256": content_sha256(full_text),
            }
        )

    schedule_raw = [clean_line(item["text"]) for item in lines[schedule_index:]]
    schedule_raw = [line for line in schedule_raw if line]
    schedule_paragraphs = merge_schedule(schedule_raw)
    schedule_text = "\n\n".join(schedule_paragraphs)
    records.append(
        {
            "id": "ng-ndpa-2023-schedule",
            "instrumentId": INSTRUMENT_ID,
            "articleNumber": "Schedule",
            "label": "Schedule",
            "title": "Supplementary provisions relating to proceedings of the Council",
            "chapter": {"id": f"{INSTRUMENT_ID}-schedule", "label": "Schedule", "title": "Council proceedings"},
            "section": None,
            "paragraphs": schedule_paragraphs,
            "fullText": schedule_text,
            "language": "en-NG",
            "textAvailability": "official-enacted-text",
            "source": SOURCE,
            "sourceFragment": SOURCE,
            "canonicalSource": LANDING_PAGE,
            "sourceLabel": "Nigeria Data Protection Commission — official Gazette copy",
            "sourceLineRange": {
                "start": lines[schedule_index]["sourceLine"],
                "end": lines[-1]["sourceLine"],
            },
            "retrievedOn": args.retrieved_on,
            "versionAsOf": args.retrieved_on,
            "effectiveFrom": "2023-06-12",
            "legalEffectStatus": "in-force-unamended",
            "sourceVersion": {
                "officialTitle": "Nigeria Data Protection Act, 2023 — Schedule",
                "actNumber": "37 of 2023",
                "status": "in-force",
            },
            "summary": "Complete Schedule, including paragraphs 1-18 on Council proceedings.",
            "rights": RIGHTS,
            "contentSha256": content_sha256(schedule_text),
        }
    )

    assert_sequential(
        [record["articleNumber"] for record in records[:-1]], 66, "Nigeria NDPA"
    )
    if len(records) != 67 or records[-1]["articleNumber"] != "Schedule":
        raise ValueError("Expected 66 sections plus one Schedule")
    write_json(args.output, records)
    print(f"Generated {len(records)} Nigeria NDPA units at {args.output}")


if __name__ == "__main__":
    main()
