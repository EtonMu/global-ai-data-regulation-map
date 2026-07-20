#!/usr/bin/env python3
"""Build the Privacy Act 1988 C104 provision corpus from official XHTML.

This importer is deliberately version-locked.  It extracts the operative text of
the current authorised compilation while keeping enacted, uncommenced APP 1.7-
1.9 outside the stored current text and recording those amendments as metadata.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterable
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = (
    ROOT
    / "data/v2/source-snapshots/au-privacy-act-1988-C2026C00227.xhtml"
)
DEFAULT_OUTPUT = ROOT / "data/v2/au-privacy-act-1988-provisions.json"

XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml"
XHTML = f"{{{XHTML_NAMESPACE}}}"

INSTRUMENT_ID = "au-privacy-act-1988"
RETRIEVED_ON = "2026-07-20"
VERSION_AS_OF = "2026-06-04"
OFFICIAL_SOURCE = (
    "https://www.legislation.gov.au/C2004A03712/2026-06-04/2026-06-04/"
    "text/original/epub/OEBPS/document_1/document_1.html"
)
OFFICIAL_DETAILS = "https://www.legislation.gov.au/C2004A03712/latest/details"
AMENDING_ACT_SOURCE = (
    "https://www.legislation.gov.au/C2024A00128/asmade/2024-12-10/"
    "text/original/epub/OEBPS/document_1/document_1.html"
)
APP_COMMENCEMENT_SOURCE = (
    "https://www.legislation.gov.au/C2012A00197/asmade/2012-12-12/"
    "text/original/epub/OEBPS/document_1/document_1.html"
)
NDB_COMMENCEMENT_SOURCE = (
    "https://www.legislation.gov.au/C2017A00012/asmade/2017-02-22/"
    "text/original/epub/OEBPS/document_1/document_1.html"
)
NDB_ORIGINAL_SECTION_LOCATORS = {
    "26WA", "26WB", "26WC", "26WD", "26WE", "26WF", "26WG", "26WH",
    "26WJ", "26WK", "26WL", "26WM", "26WN", "26WP", "26WQ", "26WR",
    "26WS", "26WT",
}
EXPECTED_SNAPSHOT_SHA256 = (
    "6d0a43e5da103d1eeb5317ae9ac213c5b51acab2357dc01b981a91e1052c5c3b"
)

SOURCE_VERSION = {
    "officialTitle": "Privacy Act 1988",
    "titleId": "C2004A03712",
    "compilationId": "C2026C00227",
    "compilationNumber": 104,
    "compilationDate": VERSION_AS_OF,
    "registeredOn": "2026-06-17",
    "includesAmendmentsThrough": "Act No. 75, 2025",
    "versionNote": (
        "Authorised Compilation No. 104 shows the law as amended and in force "
        "on 4 June 2026. In accordance with the compilation notice, the effect "
        "of uncommenced amendments is not shown in the compiled text."
    ),
}

RIGHTS = {
    "reuseStatus": "open-with-exclusions",
    "license": (
        "Creative Commons Attribution 4.0 International, except excluded material"
    ),
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "termsUrl": "https://www.legislation.gov.au/terms-of-use",
    "attribution": (
        "Based on content from the Federal Register of Legislation at 20 July "
        "2026. For the latest information on Australian Government legislation "
        "please go to https://www.legislation.gov.au. Source document: Privacy "
        "Act 1988, Compilation No. 104 (C2026C00227). Changes made: the importer "
        "removes presentation markup, navigation, compilation endnotes and "
        "excluded visual material; normalises whitespace; and renders table "
        "rows with pipe separators."
    ),
    "excludedMaterial": [
        "Commonwealth Coat of Arms",
        "third-party material identified by the Federal Register of Legislation",
    ],
    "extractionBoundary": (
        "The corpus contains operative section, Australian Privacy Principle and "
        "Schedule 2 clause text only. The Coat of Arms image is not extracted."
    ),
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def element_text(element: ET.Element) -> str:
    """Return text while treating XHTML line breaks as whitespace."""

    pieces: list[str] = []

    def visit(node: ET.Element) -> None:
        if node.text:
            pieces.append(node.text)
        for child in node:
            if local_name(child) == "br":
                pieces.append(" ")
            else:
                visit(child)
            if child.tail:
                pieces.append(child.tail)

    visit(element)
    return "".join(pieces)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u00a0", " ")).strip()


def normalized_element_text(element: ET.Element) -> str:
    return normalize_text(element_text(element))


def iter_document_blocks(element: ET.Element) -> Iterable[ET.Element]:
    """Yield paragraphs and tables in source order, treating a table atomically."""

    name = local_name(element)
    if name in {"p", "table"}:
        yield element
        return
    for child in element:
        yield from iter_document_blocks(child)


def table_rows(table: ET.Element) -> list[str]:
    rows: list[str] = []
    for row in table.iter(f"{XHTML}tr"):
        cells: list[str] = []
        for cell in row:
            if local_name(cell) not in {"td", "th"}:
                continue
            paragraphs = [
                normalized_element_text(node)
                for node in cell.iter(f"{XHTML}p")
                if normalized_element_text(node)
            ]
            cell_text = " ".join(paragraphs)
            if not cell_text:
                cell_text = normalized_element_text(cell)
            if cell_text:
                cells.append(cell_text)
        if cells:
            rows.append(" | ".join(cells))
    return rows


def block_text(block: ET.Element) -> list[str]:
    if local_name(block) == "table":
        return table_rows(block)
    value = normalized_element_text(block)
    return [value] if value else []


def nav_number(element: ET.Element) -> int | None:
    match = re.fullmatch(r"navPoint_(\d+)", element.get("id", ""))
    return int(match.group(1)) if match else None


def structure_node(heading: str, anchor: str) -> dict[str, str]:
    label, separator, title = heading.partition("—")
    if not separator:
        label, title = heading, heading
    return {
        "id": f"{INSTRUMENT_ID}-{anchor.lower().replace('_', '-')}",
        "label": label.strip(),
        "title": title.strip(),
        "sourceHeading": heading,
        "sourceFragment": f"{OFFICIAL_SOURCE}#{anchor}",
    }


def parse_provision_heading(
    heading: str,
    anchor_number: int,
) -> tuple[str, str, str, str, str] | None:
    if 2 <= anchor_number <= 405:
        match = re.fullmatch(r"(\d+[A-Z]{0,4})\s+(.+)", heading)
        if not match:
            raise ValueError(f"Unrecognised main Act heading: {heading}")
        locator, title = match.groups()
        return (
            "section",
            locator,
            locator,
            f"Section {locator}",
            title,
        )

    if 409 <= anchor_number <= 425:
        match = re.fullmatch(
            r"(\d+)\s+Australian Privacy Principle\s+\d+—(.+)",
            heading,
        )
        if not match:
            raise ValueError(f"Unrecognised APP heading: {heading}")
        locator, title = match.groups()
        return (
            "australian-privacy-principle",
            locator,
            f"APP {locator}",
            f"Australian Privacy Principle {locator}",
            title,
        )

    if 428 <= anchor_number <= 456:
        match = re.fullmatch(r"(\d+[A-Z]{0,4})\s+(.+)", heading)
        if not match:
            raise ValueError(f"Unrecognised Schedule 2 heading: {heading}")
        locator, title = match.groups()
        return (
            "schedule-clause",
            locator,
            f"Schedule 2 clause {locator}",
            f"Schedule 2, clause {locator}",
            title,
        )

    return None


def record_id(provision_type: str, locator: str) -> str:
    locator_slug = locator.lower()
    if provision_type == "section":
        return f"{INSTRUMENT_ID}-sec-{locator_slug}"
    if provision_type == "australian-privacy-principle":
        return f"{INSTRUMENT_ID}-app-{locator_slug}"
    return f"{INSTRUMENT_ID}-sch-2-cl-{locator_slug}"


def commencement_metadata(
    provision_type: str,
    locator: str,
) -> dict[str, Any]:
    if provision_type == "australian-privacy-principle":
        return {
            "appliesFrom": "2014-03-12",
            "commencement": {
                "status": "in-force",
                "date": "2014-03-12",
                "basis": (
                    "The Australian Privacy Principles were inserted by "
                    "Schedule 1 to the Privacy Amendment (Enhancing Privacy "
                    "Protection) Act 2012. Section 2(1), commencement table "
                    "item 2 commenced Schedules 1 to 4 on 12 March 2014."
                ),
                "amendingAct": (
                    "Privacy Amendment (Enhancing Privacy Protection) Act 2012"
                ),
                "amendingActId": "C2012A00197",
                "amendingProvision": "Schedule 1",
                "commencementAuthority": (
                    "section 2(1), commencement table item 2"
                ),
                "source": APP_COMMENCEMENT_SOURCE,
                "scopeNote": (
                    "This is the commencement of the APP framework; the current "
                    "consolidated wording may include later amendments."
                ),
            },
        }

    if provision_type == "section" and locator in NDB_ORIGINAL_SECTION_LOCATORS:
        return {
            "appliesFrom": "2018-02-22",
            "commencement": {
                "status": "in-force",
                "date": "2018-02-22",
                "basis": (
                    "This provision was inserted in Part IIIC by Schedule 1 to "
                    "the Privacy Amendment (Notifiable Data Breaches) Act 2017. "
                    "Section 2(1), commencement table item 2 records Schedule 1 "
                    "as commencing on 22 February 2018."
                ),
                "amendingAct": (
                    "Privacy Amendment (Notifiable Data Breaches) Act 2017"
                ),
                "amendingActId": "C2017A00012",
                "amendingProvision": "Schedule 1",
                "commencementAuthority": (
                    "section 2(1), commencement table item 2"
                ),
                "source": NDB_COMMENCEMENT_SOURCE,
                "scopeNote": (
                    "This is the original NDB scheme commencement; the current "
                    "consolidated wording may include later amendments."
                ),
            },
        }

    return {}


def future_amendments(record: dict[str, Any]) -> list[dict[str, Any]]:
    common = {
        "id": "privacy-other-legislation-amendment-act-2024-sch1-part15",
        "status": "enacted-not-yet-in-force",
        "effectiveFrom": "2026-12-10",
        "includedInStoredText": False,
        "amendingAct": "Privacy and Other Legislation Amendment Act 2024",
        "amendingActId": "C2024A00128",
        "schedule": "Schedule 1, Part 15",
        "commencementAuthority": "section 2(1), commencement table item 7",
        "source": AMENDING_ACT_SOURCE,
    }

    if record["id"] == f"{INSTRUMENT_ID}-sec-13k":
        return [
            {
                **common,
                "amendingItems": ["87"],
                "locators": ["subparagraph 13K(1)(b)(iia)"],
                "changeNote": (
                    "Item 87 will add Australian Privacy Principle 1.7 to the "
                    "civil penalty provision list in section 13K."
                ),
            }
        ]

    if record["id"] == f"{INSTRUMENT_ID}-app-1":
        return [
            {
                **common,
                "amendingItems": ["88"],
                "applicationItem": "89",
                "locators": ["APP 1.7", "APP 1.8", "APP 1.9"],
                "changeNote": (
                    "Item 88 will add automated-decision disclosures to APP "
                    "privacy policies. Item 89 supplies the application rule."
                ),
            }
        ]

    return []


def build_records(source_path: Path) -> list[dict[str, Any]]:
    source_bytes = source_path.read_bytes()
    snapshot_sha256 = sha256_bytes(source_bytes)
    if snapshot_sha256 != EXPECTED_SNAPSHOT_SHA256:
        raise ValueError(
            "The source snapshot does not match the frozen official C2026C00227 "
            f"XHTML (expected {EXPECTED_SNAPSHOT_SHA256}, got {snapshot_sha256})."
        )

    root = ET.fromstring(source_bytes)
    source_text = normalize_text(element_text(root))
    required_markers = [
        "Privacy Act 1988",
        "Compilation No. 104",
        "Compilation date: 4 June 2026",
        "Includes amendments: Act No. 75, 2025",
        "The effect of uncommenced amendments is not shown",
    ]
    missing_markers = [marker for marker in required_markers if marker not in source_text]
    if missing_markers:
        raise ValueError(f"Source snapshot is missing markers: {missing_markers}")

    hierarchy: dict[str, dict[str, str] | None] = {
        "schedule": None,
        "part": None,
        "division": None,
        "subdivision": None,
    }
    records: list[dict[str, Any]] = []
    pending: dict[str, Any] | None = None
    pending_paragraphs: list[str] = []

    def flush_pending() -> None:
        nonlocal pending, pending_paragraphs
        if pending is None:
            pending_paragraphs = []
            return

        paragraphs = [paragraph for paragraph in pending_paragraphs if paragraph]
        if not paragraphs:
            raise ValueError(f"Provision has no operative text: {pending['id']}")
        full_text = "\n\n".join(paragraphs)
        pending["paragraphs"] = paragraphs
        pending["fullText"] = full_text
        pending["contentSha256"] = sha256_text(full_text)
        pending["futureAmendments"] = future_amendments(pending)
        pending["hasEnactedFutureAmendment"] = bool(pending["futureAmendments"])
        records.append(pending)
        pending = None
        pending_paragraphs = []

    for block in iter_document_blocks(root):
        if local_name(block) == "p":
            css_class = block.get("class", "")
            heading_text = normalized_element_text(block)
            anchor = block.get("id", "")

            if css_class.startswith("ENotesHeading"):
                flush_pending()
                break

            if css_class in {"ActHead1", "ActHead2", "ActHead3", "ActHead4", "ActHead5"}:
                flush_pending()

                if css_class == "ActHead1":
                    hierarchy["schedule"] = structure_node(heading_text, anchor)
                    hierarchy["part"] = None
                    hierarchy["division"] = None
                    hierarchy["subdivision"] = None
                    continue
                if css_class == "ActHead2":
                    hierarchy["part"] = structure_node(heading_text, anchor)
                    hierarchy["division"] = None
                    hierarchy["subdivision"] = None
                    continue
                if css_class == "ActHead3":
                    hierarchy["division"] = structure_node(heading_text, anchor)
                    hierarchy["subdivision"] = None
                    continue
                if css_class == "ActHead4":
                    hierarchy["subdivision"] = structure_node(heading_text, anchor)
                    continue

                anchor_number = nav_number(block)
                if anchor_number is None:
                    raise ValueError(f"Provision heading has no navPoint anchor: {heading_text}")
                parsed = parse_provision_heading(heading_text, anchor_number)
                if parsed is None:
                    continue
                provision_type, locator, article_number, label, title = parsed
                record_structure = deepcopy(hierarchy)
                chapter = deepcopy(record_structure["part"])
                section = deepcopy(
                    record_structure["subdivision"] or record_structure["division"]
                )
                provision_id = record_id(provision_type, locator)
                pending = {
                    "id": provision_id,
                    "instrumentId": INSTRUMENT_ID,
                    "provisionType": provision_type,
                    "provisionNumber": locator,
                    "articleNumber": article_number,
                    "label": label,
                    "title": title,
                    "sourceHeading": heading_text,
                    "summary": f"Official current consolidated text of {label}: {title}.",
                    "chapter": chapter,
                    "section": section,
                    "structure": record_structure,
                    "language": "en-AU",
                    "textAvailability": "official-authorised-current-consolidated-text",
                    "legalEffectStatus": "in-force",
                    **commencement_metadata(provision_type, locator),
                    "compilationStatus": "included-in-current-in-force-compilation",
                    "currentTextOnly": True,
                    "uncommencedAmendmentsIncluded": False,
                    "source": OFFICIAL_SOURCE,
                    "sourceFragment": f"{OFFICIAL_SOURCE}#{anchor}",
                    "sourceAnchor": anchor,
                    "sourceLabel": (
                        "Federal Register of Legislation — Authorised Version "
                        "C2026C00227, Compilation No. 104"
                    ),
                    "sourceDetails": OFFICIAL_DETAILS,
                    "sourceSnapshot": (
                        "data/v2/source-snapshots/"
                        "au-privacy-act-1988-C2026C00227.xhtml"
                    ),
                    "sourceSnapshotSha256": snapshot_sha256,
                    "retrievedOn": RETRIEVED_ON,
                    "versionAsOf": VERSION_AS_OF,
                    "sourceVersion": deepcopy(SOURCE_VERSION),
                    "rights": deepcopy(RIGHTS),
                    "textNormalization": {
                        "format": "normalised-block-text",
                        "whitespace": "collapsed without changing words or punctuation",
                        "tables": "one source row per paragraph; cells separated by ' | '",
                        "excluded": [
                            "presentation markup",
                            "navigation",
                            "compilation endnotes",
                            "Commonwealth Coat of Arms image",
                        ],
                    },
                }
                pending_paragraphs = []
                continue

        if pending is not None:
            pending_paragraphs.extend(block_text(block))

    flush_pending()

    type_counts = {
        provision_type: sum(
            1 for record in records if record["provisionType"] == provision_type
        )
        for provision_type in {
            "section",
            "australian-privacy-principle",
            "schedule-clause",
        }
    }
    expected_counts = {
        "section": 313,
        "australian-privacy-principle": 13,
        "schedule-clause": 26,
    }
    if type_counts != expected_counts:
        raise ValueError(f"Unexpected provision counts: {type_counts}")
    if len({record["id"] for record in records}) != len(records):
        raise ValueError("Duplicate provision IDs detected")

    app_one = next(record for record in records if record["id"].endswith("-app-1"))
    if any(locator in app_one["fullText"] for locator in ("1.7", "1.8", "1.9")):
        raise ValueError("Uncommenced APP 1.7-1.9 leaked into current compiled text")

    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help="Frozen official XHTML source snapshot",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Destination JSON corpus",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    records = build_records(args.source.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    counts = {
        kind: sum(1 for record in records if record["provisionType"] == kind)
        for kind in (
            "section",
            "australian-privacy-principle",
            "schedule-clause",
        )
    }
    print(
        f"{args.output.name}: {len(records)} nodes "
        f"({counts['section']} sections, "
        f"{counts['australian-privacy-principle']} APPs, "
        f"{counts['schedule-clause']} Schedule 2 clauses)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
