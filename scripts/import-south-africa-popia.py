#!/usr/bin/env python3
"""Generate all 115 POPIA sections and the Schedule from a cleaned official snapshot."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from legal_corpus_utils import (
    assert_sequential,
    content_sha256,
    load_snapshot,
    merge_wrapped_lines,
    write_json,
)


INSTRUMENT_ID = "za-popia-4-2013"
SOURCE = "https://www.justice.gov.za/legislation/acts/2013-004.pdf"
GAZETTE_SOURCE = (
    "https://www.gov.za/sites/default/files/gcis_document/201409/"
    "3706726-11act4of2013popi.pdf"
)
PROCLAMATION_R21_SOURCE = (
    "https://www.justice.gov.za/legislation/notices/2020/"
    "20200622-gg43461-rg11136-pr21-POPIAsections.pdf"
)
SECTION_58_NOTICE_SOURCE = (
    "https://justice.gov.za/legislation/notices/2021/"
    "20210625-gg44761gon560-POPIA-S58-2.pdf"
)
RIGHTS = {
    "reuseStatus": "government-edict",
    "license": (
        "Official legislative texts are excluded from copyright by section "
        "12(8)(a) of the Copyright Act 98 of 1978"
    ),
    "licenseUrl": "https://www.thedtic.gov.za/wp-content/uploads/copyright_act.pdf",
    "attribution": (
        "Statutory wording: Republic of South Africa official Gazette and the "
        "Department of Justice current consolidation. Juta page furniture, "
        "footnotes, and editorial annotations are excluded."
    ),
}

CHAPTERS = [
    (1, 2, "1", "Definitions and purpose"),
    (3, 7, "2", "Application provisions"),
    (8, 35, "3", "Conditions for lawful processing of personal information"),
    (36, 38, "4", "Exemption from conditions for processing of personal information"),
    (39, 56, "5", "Supervision"),
    (57, 59, "6", "Prior authorisation"),
    (60, 68, "7", "Codes of conduct"),
    (69, 71, "8", "Rights concerning direct marketing, directories and automated decision making"),
    (72, 72, "9", "Transborder information flows"),
    (73, 99, "10", "Enforcement"),
    (100, 109, "11", "Offences, penalties and administrative fines"),
    (110, 115, "12", "General provisions"),
]

STRUCTURE_TITLES = {
    "Processing of personal information in general",
    "Accountability",
    "Processing limitation",
    "Purpose specification",
    "Further processing limitation",
    "Information quality",
    "Openness",
    "Security safeguards",
    "Data subject participation",
    "Processing of special personal information",
    "Processing of personal information of children",
    "Information Regulator (ss 39-54)",
    "Information Officer",
}


def chapter_for(number: int) -> dict:
    for first, last, chapter_number, title in CHAPTERS:
        if first <= number <= last:
            return {
                "id": f"{INSTRUMENT_ID}-chapter-{chapter_number}",
                "label": f"Chapter {chapter_number}",
                "title": title,
            }
    raise ValueError(f"No chapter mapping for section {number}")


def is_structure(line: str, source_line: int) -> bool:
    if source_line in {332, 333}:  # consolidation footnote, not statutory text
        return True
    if line.startswith("[Date of commencement"):
        return True
    if re.fullmatch(r"CHAPTER \d+", line):
        return True
    if re.search(r"\(s{1,2} \d+(?:-\d+)?\)$", line):
        return True
    if re.fullmatch(r"Part [A-Z]", line) or re.fullmatch(r"Condition \d+", line):
        return True
    if line in STRUCTURE_TITLES:
        return True
    letters = [char for char in line if char.isalpha()]
    if len(letters) >= 4 and all(char.isupper() for char in letters):
        return True
    return False


def merge_schedule_lines(lines: list[str]) -> list[str]:
    """Reconstruct the Schedule table without retaining PDF column wrapping."""

    values = [re.sub(r"\s+", " ", line).strip() for line in lines if line.strip()]
    if values[:3] != [
        "Schedule",
        "LAWS AMENDED BY SECTION 110",
        "No. and year of law Short title Extent of repeal or amendment",
    ]:
        raise ValueError(f"Unexpected POPIA Schedule headings: {values[:3]}")

    paragraphs = values[:3]
    index = 3
    act_row = re.compile(
        r"^(Act \d+ of \d{4} .*?, \d{4})(?: (1\. .*))?$"
    )
    while index < len(values):
        line = values[index]
        if line.startswith("Act "):
            # The short-title column is sometimes wrapped onto the next PDF
            # line.  Join only until the title's terminal year is present.
            while not act_row.fullmatch(line):
                index += 1
                if index >= len(values):
                    raise ValueError(f"Unterminated Schedule Act row: {line}")
                line += " " + values[index]
            match = act_row.fullmatch(line)
            assert match is not None
            paragraphs.append(match.group(1))
            if match.group(2):
                paragraphs.append(match.group(2))
        elif re.match(r"^\d+\. ", line):
            paragraphs.append(line)
        else:
            if len(paragraphs) <= 3:
                raise ValueError(f"Schedule continuation has no row: {line}")
            paragraphs[-1] += ("" if paragraphs[-1].endswith("-") else " ") + line
        index += 1
    return paragraphs


def commencement(number: int) -> dict:
    if number == 1 or 39 <= number <= 54 or number in {112, 113}:
        effective = "2014-04-11"
        note = "Commenced by Proclamation R25, Government Gazette 37544."
        commencement_source = SOURCE
    elif number == 110:
        effective = "2021-06-30"
        note = "Commenced by Proclamation R21, Government Gazette 43461."
        commencement_source = PROCLAMATION_R21_SOURCE
    else:
        effective = "2020-07-01"
        note = "Commenced by Proclamation R21, Government Gazette 43461."
        commencement_source = PROCLAMATION_R21_SOURCE

    value: dict = {
        "effectiveFrom": effective,
        "commencementNote": note,
        "commencementSource": commencement_source,
    }
    if number == 58:
        value["operationalApplication"] = {
            "provision": "section 58(2), insofar as it applies to processing referred to in section 57",
            "applicableFrom": "2022-02-01",
            "source": SECTION_58_NOTICE_SOURCE,
            "note": (
                "The section forms part of the provisions commenced on 1 July 2020; "
                "the specified application of subsection (2) was fixed for 1 February 2022."
            ),
        }
    if number == 114:
        value["commencementSegments"] = [
            {"provisions": "subsections (1)-(3)", "effectiveFrom": "2020-07-01"},
            {"provisions": "subsection (4)", "effectiveFrom": "2021-06-30"},
        ]
        value["commencementNote"] = (
            "Subsections (1)-(3) commenced 1 July 2020; subsection (4) commenced "
            "30 June 2021, both under Proclamation R21."
        )
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    _, source_lines = load_snapshot(args.input)
    lines = [
        {"sourceLine": int(item["sourceLine"]), "text": str(item["text"]).strip()}
        for item in source_lines
    ]

    headings: list[tuple[int, int, str]] = []
    cursor = 0
    for number in range(1, 116):
        pattern = re.compile(rf"^{number} (.+)$")
        found = None
        for index in range(cursor, len(lines)):
            item = lines[index]
            if item["sourceLine"] in {332, 333}:
                continue
            match = pattern.match(item["text"])
            if match:
                found = (index, item["sourceLine"], match.group(1).strip())
                break
        if found is None:
            raise ValueError(f"Missing section heading {number}")
        headings.append(found)
        cursor = found[0] + 1

    schedule_index = next(
        index
        for index, item in enumerate(lines)
        if item["sourceLine"] >= 2133 and item["text"] == "Schedule"
    )

    records: list[dict] = []
    for offset, (start, source_start, title) in enumerate(headings):
        number = offset + 1
        end = headings[offset + 1][0] if offset + 1 < len(headings) else schedule_index
        body_lines = [
            item["text"]
            for item in lines[start + 1 : end]
            if not is_structure(item["text"], item["sourceLine"])
        ]
        paragraphs = [f"{number} {title}", *merge_wrapped_lines(body_lines)]
        if len(paragraphs) < 2:
            raise ValueError(f"Section {number} has no body text")
        full_text = "\n\n".join(paragraphs)
        source_end = max(
            item["sourceLine"]
            for item in lines[start:end]
            if not is_structure(item["text"], item["sourceLine"])
        )
        record = {
            "id": f"za-popia-s-{number}",
            "instrumentId": INSTRUMENT_ID,
            "articleNumber": str(number),
            "label": f"Section {number}",
            "title": title,
            "chapter": chapter_for(number),
            "section": None,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "en-ZA",
            "textAvailability": "official-current-consolidated-statutory-text",
            "source": SOURCE,
            "sourceFragment": SOURCE,
            "canonicalSource": GAZETTE_SOURCE,
            "sourceLabel": "Department of Justice — current POPIA consolidation",
            "sourceLineRange": {"start": source_start, "end": source_end},
            "retrievedOn": args.retrieved_on,
            "versionAsOf": args.retrieved_on,
            "legalEffectStatus": "in-force",
            **commencement(number),
            "sourceVersion": {
                "officialTitle": "Protection of Personal Information Act 4 of 2013",
                "assentedOn": "2013-11-19",
                "publishedOn": "2013-11-26",
                "status": "in-force",
                "versionNote": (
                    "Current Department of Justice consolidation reviewed on "
                    f"{args.retrieved_on}; statutory wording only, excluding the "
                    "publisher's editorial layer."
                ),
            },
            "summary": (
                f"Official section heading: {title}. Complete current statutory wording is stored."
            ),
            "rights": RIGHTS,
            "contentSha256": content_sha256(full_text),
        }
        records.append(record)

    schedule_lines = [item["text"] for item in lines[schedule_index:]]
    schedule_paragraphs = merge_schedule_lines(schedule_lines)
    schedule_text = "\n\n".join(schedule_paragraphs)
    records.append(
        {
            "id": "za-popia-schedule",
            "instrumentId": INSTRUMENT_ID,
            "articleNumber": "Schedule",
            "label": "Schedule",
            "title": "Laws amended by section 110",
            "chapter": chapter_for(110),
            "section": None,
            "paragraphs": schedule_paragraphs,
            "fullText": schedule_text,
            "language": "en-ZA",
            "textAvailability": "official-current-consolidated-statutory-text",
            "source": SOURCE,
            "sourceFragment": SOURCE,
            "canonicalSource": GAZETTE_SOURCE,
            "sourceLabel": "Department of Justice — current POPIA consolidation",
            "sourceLineRange": {
                "start": lines[schedule_index]["sourceLine"],
                "end": lines[-1]["sourceLine"],
            },
            "retrievedOn": args.retrieved_on,
            "versionAsOf": args.retrieved_on,
            "legalEffectStatus": "in-force",
            "effectiveFrom": "2021-06-30",
            "commencementNote": (
                "The amendments effected by section 110 and the Schedule commenced "
                "30 June 2021 under Proclamation R21."
            ),
            "commencementSource": PROCLAMATION_R21_SOURCE,
            "sourceVersion": {
                "officialTitle": "Protection of Personal Information Act 4 of 2013 — Schedule",
                "status": "in-force",
                "versionNote": f"Current consolidation reviewed on {args.retrieved_on}.",
            },
            "summary": "Complete Schedule: laws amended by section 110.",
            "rights": RIGHTS,
            "contentSha256": content_sha256(schedule_text),
        }
    )

    assert_sequential(
        [record["articleNumber"] for record in records[:-1]], 115, "POPIA"
    )
    if len(records) != 116 or records[-1]["articleNumber"] != "Schedule":
        raise ValueError("Expected 115 sections plus one Schedule")
    write_json(args.output, records)
    print(f"Generated {len(records)} POPIA units at {args.output}")


if __name__ == "__main__":
    main()
