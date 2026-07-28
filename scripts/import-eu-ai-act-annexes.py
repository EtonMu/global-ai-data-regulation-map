#!/usr/bin/env python3
"""Build the current English EU AI Act Annex corpus from authentic EUR-Lex XHTML.

The importer combines the Official Journal text of Regulation (EU) 2024/1689
with the Annex amendments made by Regulation (EU) 2026/1744, which entered
into force on 27 July 2026. It intentionally does not infer a consolidated
text from recitals or secondary summaries.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Iterable

NS = "{http://www.w3.org/1999/xhtml}"
BASE_SOURCE = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng"
AMENDING_SOURCE = "https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng"
CONSOLIDATED_AS_OF = "2026-07-27"
RETRIEVED_ON = "2026-07-28"
ROMAN_NUMERALS = (
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalise_text(raw: str) -> str:
    text = " ".join(raw.replace("\u00a0", " ").split())
    text = re.sub(r"\s+([,.;:)\]])", r"\1", text)
    text = re.sub(r"([(\[])\s+", r"\1", text)
    # The authentic XHTML contains one missing layout space after Article 6(3).
    # Restoring word separation is a presentation normalisation, not a textual
    # translation or substantive correction.
    text = re.sub(r"\)(?=[A-Za-z])", ") ", text)
    return text.strip()


def element_text(node: ET.Element) -> str:
    return normalise_text("".join(node.itertext()))


def direct_table_rows(table: ET.Element) -> Iterable[ET.Element]:
    yield from table.findall(f"./{NS}tr")
    for body_tag in ("tbody", "thead", "tfoot"):
        yield from table.findall(f"./{NS}{body_tag}/{NS}tr")


def render_table(table: ET.Element) -> list[str]:
    rows: list[str] = []
    for row in direct_table_rows(table):
        cells = []
        for cell in list(row):
            if cell.tag not in {f"{NS}td", f"{NS}th"}:
                continue
            value = element_text(cell)
            if value:
                cells.append(value)
        if cells:
            rows.append(normalise_text(" ".join(cells)))
    return rows


def render_children(node: ET.Element) -> list[str]:
    blocks: list[str] = []
    for child in list(node):
        local_name = child.tag.rsplit("}", 1)[-1]
        if local_name == "p":
            if child.get("class") == "oj-note":
                continue
            value = element_text(child)
            if value:
                blocks.append(value)
        elif local_name == "table":
            blocks.extend(render_table(child))
        elif list(child):
            blocks.extend(render_children(child))
        else:
            value = element_text(child)
            if value:
                blocks.append(value)
    return blocks


def strip_quotation_boundary(blocks: list[str]) -> list[str]:
    if not blocks:
        return blocks
    blocks = list(blocks)
    blocks[0] = blocks[0].removeprefix("‘").strip()
    blocks[-1] = re.sub(r"\.?’\.$", ".", blocks[-1])
    blocks[-1] = blocks[-1].removesuffix("’").strip()
    return blocks


def parse_base_annexes(root: ET.Element) -> dict[str, list[str]]:
    annexes: dict[str, list[str]] = {}
    for numeral in ROMAN_NUMERALS:
        node = root.find(f'.//{NS}div[@id="anx_{numeral}"]')
        if node is None:
            raise ValueError(f"Official base XHTML is missing Annex {numeral}")
        rendered = render_children(node)
        if len(rendered) < 3 or rendered[0] != f"ANNEX {numeral}":
            raise ValueError(f"Unexpected Annex {numeral} structure")
        annexes[numeral] = rendered
    return annexes


def annex_i_point_21(amendment_root: ET.Element) -> str:
    for row in amendment_root.iter(f"{NS}tr"):
        cells = [
            element_text(cell)
            for cell in list(row)
            if cell.tag in {f"{NS}td", f"{NS}th"} and element_text(cell)
        ]
        if len(cells) < 2:
            continue
        marker = cells[0].removeprefix("‘").strip()
        content = cells[1].removesuffix("’").strip()
        if marker == "21." and content.startswith("Regulation (EU) 2023/1230"):
            return normalise_text(f"21. {content}")
    raise ValueError("Regulation 2026/1744 Annex I point 21 was not found")


def parse_annex_xiv(amendment_root: ET.Element) -> list[str]:
    parent_map = {child: parent for parent in amendment_root.iter() for child in parent}
    for paragraph in amendment_root.iter(f"{NS}p"):
        if paragraph.get("class") != "oj-doc-ti oj-quotation-ti":
            continue
        if element_text(paragraph).removeprefix("‘") != "Annex XIV":
            continue
        container = parent_map.get(paragraph)
        if container is None:
            break
        rendered = strip_quotation_boundary(render_children(container))
        if len(rendered) < 5 or rendered[0] != "Annex XIV":
            raise ValueError("Unexpected Annex XIV structure")
        return rendered
    raise ValueError("Regulation 2026/1744 Annex XIV was not found")


def consolidate_annex_i(blocks: list[str], point_21: str) -> list[str]:
    current_section = None
    result: list[str] = []
    deleted = False
    for block in blocks:
        if block.startswith("Section A."):
            current_section = "A"
        elif block.startswith("Section B."):
            current_section = "B"
        if current_section == "A" and re.match(r"^1\.\s", block):
            deleted = True
            continue
        result.append(block)
    if not deleted:
        raise ValueError("Annex I Section A point 1 was not found for deletion")
    if any(block.startswith("21. ") for block in result):
        raise ValueError("Annex I already contains point 21")
    result.append(point_21)
    return result


def consolidate_annex_viii(blocks: list[str]) -> list[str]:
    current_section = None
    deleted: set[str] = set()
    result: list[str] = []
    for block in blocks:
        if block.startswith("Section A"):
            current_section = "A"
        elif block.startswith("Section B"):
            current_section = "B"
        elif block.startswith("Section C"):
            current_section = "C"
        if current_section == "B":
            match = re.match(r"^(7|9)\.\s", block)
            if match:
                deleted.add(match.group(1))
                continue
        result.append(block)
    if deleted != {"7", "9"}:
        raise ValueError(
            f"Annex VIII Section B deletion boundary mismatch: {sorted(deleted)}"
        )
    return result


def build_records(base_path: Path, amendment_path: Path) -> list[dict[str, object]]:
    base_root = ET.parse(base_path).getroot()
    amendment_root = ET.parse(amendment_path).getroot()

    base_annexes = parse_base_annexes(base_root)
    base_annexes["I"] = consolidate_annex_i(
        base_annexes["I"], annex_i_point_21(amendment_root)
    )
    base_annexes["VIII"] = consolidate_annex_viii(base_annexes["VIII"])
    all_annexes = {**base_annexes, "XIV": parse_annex_xiv(amendment_root)}

    source_hashes = {
        "baseOfficialXhtmlSha256": sha256(base_path),
        "amendingOfficialXhtmlSha256": sha256(amendment_path),
    }
    records: list[dict[str, object]] = []
    for numeral in (*ROMAN_NUMERALS, "XIV"):
        rendered = all_annexes[numeral]
        label, title, *paragraphs = rendered
        expected_label = f"ANNEX {numeral}" if numeral != "XIV" else "Annex XIV"
        if label != expected_label:
            raise ValueError(f"Annex {numeral} label mismatch: {label}")
        if not title or not paragraphs:
            raise ValueError(f"Annex {numeral} is incomplete")

        amended = numeral in {"I", "VIII", "XIV"}
        source = AMENDING_SOURCE if numeral == "XIV" else BASE_SOURCE
        source_fragment = (
            f"{AMENDING_SOURCE}#art_1"
            if numeral == "XIV"
            else f"{BASE_SOURCE}#anx_{numeral}"
        )
        record: dict[str, object] = {
            "id": f"eu-ai-act-annex-{numeral.lower()}",
            "instrumentId": "eu-ai-act",
            "provisionType": "annex",
            "annexNumber": numeral,
            "label": f"Annex {numeral}",
            "title": title,
            "paragraphs": paragraphs,
            "fullText": "\n\n".join(paragraphs),
            "language": "en",
            "textAvailability": "full",
            "source": source,
            "sourceFragment": source_fragment,
            "retrievedOn": RETRIEVED_ON,
            "consolidatedAsOf": CONSOLIDATED_AS_OF,
            "sourceSnapshotHashes": source_hashes,
        }
        if amended:
            record["amendingSource"] = f"{AMENDING_SOURCE}#art_1"
            record["amendmentEffectiveFrom"] = CONSOLIDATED_AS_OF
        if numeral == "I":
            record["amendmentOperations"] = [
                "Section A point 1 deleted",
                "Section B point 21 added",
            ]
        elif numeral == "VIII":
            record["amendmentOperations"] = [
                "Section B points 7 and 9 deleted"
            ]
        elif numeral == "XIV":
            record["amendmentOperations"] = [
                "Annex XIV added by Regulation (EU) 2026/1744"
            ]
        records.append(record)
    return records


def build_recital_records(base_path: Path) -> list[dict[str, object]]:
    """Extract the 180 enactment recitals without treating amendment recitals as replacements."""
    root = ET.parse(base_path).getroot()
    source_hash = sha256(base_path)
    records: list[dict[str, object]] = []
    for number in range(1, 181):
        node = root.find(f'.//{NS}div[@id="rct_{number}"]')
        if node is None:
            raise ValueError(f"Official base XHTML is missing Recital {number}")
        paragraphs = render_children(node)
        if len(paragraphs) != 1 or not paragraphs[0].startswith(f"({number}) "):
            raise ValueError(f"Unexpected Recital {number} structure")
        full_text = paragraphs[0]
        records.append(
            {
                "id": f"eu-ai-act-recital-{number}",
                "instrumentId": "eu-ai-act",
                "provisionType": "recital",
                "recitalNumber": str(number),
                "label": f"Recital {number}",
                "title": f"Recital {number}",
                "paragraphs": [full_text],
                "fullText": full_text,
                "language": "en",
                "textAvailability": "full",
                "legalEffectStatus": "non-operative-context-only",
                "researchTreatment": "explanatory-context-only",
                "substantiveConceptMetricEligible": False,
                "source": BASE_SOURCE,
                "sourceFragment": f"{BASE_SOURCE}#rct_{number}",
                "retrievedOn": RETRIEVED_ON,
                "sourceSnapshotSha256": source_hash,
                "documentVersionBoundary": (
                    "Enactment Recital of Regulation (EU) 2024/1689. Recitals to "
                    "Regulation (EU) 2026/1744 explain the amending act and are not "
                    "merged into the 180 Recitals of Regulation (EU) 2024/1689."
                ),
            }
        )
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-xhtml", type=Path, required=True)
    parser.add_argument("--amendment-xhtml", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--recitals-output", type=Path)
    parser.add_argument(
        "--check",
        type=Path,
        help="Compare generated output with an existing JSON file instead of writing.",
    )
    parser.add_argument(
        "--check-recitals",
        type=Path,
        help="Compare generated Recitals with an existing JSON file.",
    )
    args = parser.parse_args()

    records = build_records(args.base_xhtml, args.amendment_xhtml)
    rendered = json.dumps(records, ensure_ascii=False, indent=2) + "\n"
    recital_records = build_recital_records(args.base_xhtml)
    rendered_recitals = (
        json.dumps(recital_records, ensure_ascii=False, indent=2) + "\n"
    )
    if args.check:
        existing = args.check.read_text(encoding="utf-8")
        if existing != rendered:
            print(f"Generated corpus differs from {args.check}", file=sys.stderr)
            return 1
        print(f"Validated {len(records)} current EU AI Act Annexes")
    if args.check_recitals:
        existing = args.check_recitals.read_text(encoding="utf-8")
        if existing != rendered_recitals:
            print(
                f"Generated Recitals differ from {args.check_recitals}",
                file=sys.stderr,
            )
            return 1
        print(f"Validated {len(recital_records)} EU AI Act enactment Recitals")
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    if args.recitals_output:
        args.recitals_output.write_text(rendered_recitals, encoding="utf-8")
    if not args.output and not args.recitals_output and not args.check and not args.check_recitals:
        sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
