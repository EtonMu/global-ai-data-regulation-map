#!/usr/bin/env python3
"""Build the current bilingual Canadian ADM Directive corpus.

The Treasury Board policy site exposes the current Directive as an interactive
HTML document.  This importer accepts either a saved HTML fragment containing
``#ps-doc`` or the JSON capture produced by the browser-assisted source audit
(``{"html": ...}``).  When ``--snapshot-directory`` is supplied, exact HTML
fragments are pinned before the normalized corpus is generated.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable


INSTRUMENT_ID = "ca-directive-automated-decision-making"
ENGLISH_URL = "https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592"
FRENCH_URL = "https://www.tbs-sct.canada.ca/pol/doc-fra.aspx?id=32592"
VERSION_AS_OF = "2025-06-24"


@dataclass
class Node:
    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["Node | str"] = field(default_factory=list)


class FragmentParser(HTMLParser):
    VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag.lower(), {key: value or "" for key, value in attrs})
        self.stack[-1].children.append(node)
        if tag.lower() not in self.VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in self.VOID_TAGS:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        target = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == target:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


BLOCK_TAGS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "dd",
    "details",
    "div",
    "dl",
    "dt",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "summary",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
}


SUMMARY_BY_KEY = {
    "1": "Sets the Directive's effective date, system-cohort scope, transition deadline, and review cycle.",
    "2": "Links the Directive to the authority of the federal Policy on Service and Digital.",
    "3": "Incorporates the defined terms collected in Appendix A.",
    "4": "States the objectives of lawful, fair, responsible, interpretable, privacy- and security-conscious automated decisions.",
    "5": "Defines the production administrative-decision systems covered by the Directive and excludes research and test environments.",
    "6": "Sets the operational duties for impact assessment, notice and explanation, testing, monitoring, data governance, security, legal review, human involvement, recourse, and reporting.",
    "7": "Assigns central guidance, tool maintenance, coordination, and compliance-support responsibilities to the Treasury Board Secretariat.",
    "8": "Defines the institutions and Agents of Parliament to which the Directive applies, including specified publication exceptions and governance duties.",
    "9": "Identifies the legislation and related federal policy instruments used with the Directive.",
    "10": "Provides the official channels for interpretation and implementation enquiries.",
    "A": "Defines administrative decision, algorithmic impact assessment, automated decision system, human rights, production, proprietary systems, and test environment.",
    "B": "Defines four impact levels by context, affected rights and interests, reversibility, duration, and data risk.",
    "C": "Specifies proportionate notice, explanation, peer review, gender analysis, training, human-involvement, and approval requirements for impact Levels I–IV.",
}


CONCEPTS_BY_KEY = {
    "1": ["accountability-governance", "continuous-assurance"],
    "2": ["accountability-governance"],
    "3": ["automated-decision-safeguards", "transparency-explainability"],
    "4": [
        "ai-risk-management",
        "fairness-nondiscrimination",
        "transparency-explainability",
        "accountability-governance",
    ],
    "5": ["automated-decision-safeguards", "ai-risk-management"],
    "6": [
        "impact-assessment",
        "ai-risk-management",
        "transparency-explainability",
        "fairness-nondiscrimination",
        "training-data-governance",
        "security-controls",
        "continuous-assurance",
        "human-oversight",
        "automated-decision-safeguards",
        "accountability-governance",
    ],
    "7": ["accountability-governance", "global-coordination"],
    "8": ["accountability-governance", "automated-decision-safeguards"],
    "9": ["accountability-governance"],
    "10": ["accountability-governance"],
    "A": ["automated-decision-safeguards", "transparency-explainability"],
    "B": ["impact-assessment", "ai-risk-management", "fairness-nondiscrimination"],
    "C": [
        "impact-assessment",
        "transparency-explainability",
        "fairness-nondiscrimination",
        "human-oversight",
        "accountability-governance",
        "continuous-assurance",
    ],
}


def sha256(value: str | bytes) -> str:
    payload = value.encode("utf-8") if isinstance(value, str) else value
    return hashlib.sha256(payload).hexdigest()


def classes(node: Node) -> set[str]:
    return set(node.attrs.get("class", "").split())


def descendants(node: Node) -> Iterable[Node]:
    for child in node.children:
        if isinstance(child, Node):
            yield child
            yield from descendants(child)


def first_descendant(node: Node, predicate) -> Node | None:
    return next((candidate for candidate in descendants(node) if predicate(candidate)), None)


def text_content(node: Node) -> str:
    return "".join(
        child if isinstance(child, str) else text_content(child)
        for child in node.children
    )


def clean(value: str) -> str:
    value = html.unescape(value).replace("\u00a0", " ")
    value = re.sub(r"[\t\r\f\v ]+", " ", value)
    value = re.sub(r" *\n *", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"^(\d+(?:\.\d+)+)(?=[^\d\s])", r"\1 ", value)
    return value


def inline_text(node: Node) -> str:
    output = []
    for child in node.children:
        if isinstance(child, str):
            output.append(child)
        elif child.tag == "br":
            output.append("\n")
        elif child.tag not in BLOCK_TAGS:
            output.append(inline_text(child))
    return "".join(output)


def direct_table_rows(table: Node) -> list[Node]:
    rows = []

    def visit(node: Node) -> None:
        for child in node.children:
            if not isinstance(child, Node):
                continue
            if child.tag == "table":
                continue
            if child.tag == "tr":
                rows.append(child)
            else:
                visit(child)

    visit(table)
    return rows


def block_lines(root: Node) -> list[str]:
    lines: list[str] = []

    def walk(node: Node) -> None:
        if node.tag == "table":
            for row in direct_table_rows(node):
                cells = [
                    clean(text_content(child))
                    for child in row.children
                    if isinstance(child, Node) and child.tag in {"th", "td"}
                ]
                if any(cells):
                    lines.append(" | ".join(cells))
            return

        run: list[str] = []

        def flush() -> None:
            value = clean("".join(run))
            if value:
                lines.append(value)
            run.clear()

        for child in node.children:
            if isinstance(child, str):
                run.append(child)
            elif child.tag == "br":
                run.append("\n")
            elif child.tag in BLOCK_TAGS:
                flush()
                if child.tag != "hr":
                    walk(child)
            else:
                run.append(inline_text(child))
        flush()

    walk(root)
    return lines


def load_fragment(path: Path) -> str:
    value = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        payload = json.loads(value)
        value = payload.get("html", "")
    if "id=\"ps-doc\"" not in value and "id='ps-doc'" not in value:
        raise ValueError(f"{path} does not contain the official #ps-doc fragment")
    return value


def parse_units(fragment: str) -> list[dict]:
    parser = FragmentParser()
    parser.feed(fragment)
    details = [
        node
        for node in descendants(parser.root)
        if node.tag == "details" and "pol-sec" in classes(node)
    ]
    units = []
    for details_node in details:
        heading = first_descendant(
            details_node,
            lambda node: node.tag in {"h2", "h3"}
            and bool(node.attrs.get("id")),
        )
        content = first_descendant(
            details_node, lambda node: "pol-content" in classes(node)
        )
        if heading is None or content is None:
            continue
        heading_text = clean(text_content(heading))
        source_id = heading.attrs["id"]
        if source_id.startswith("cha"):
            key = source_id.removeprefix("cha")
            label = f"Section {key}"
            title = re.sub(rf"^{re.escape(key)}\.\s*", "", heading_text)
            unit_type = "directive-section"
        elif source_id.startswith("app"):
            key = source_id.removeprefix("app").upper()
            label = f"Appendix {key}"
            title = re.sub(r"^(?:Appendix|Annexe)\s+[A-Z]\s*[-–—]\s*", "", heading_text)
            unit_type = "directive-appendix"
        else:
            raise ValueError(f"Unexpected ADM source unit {source_id}")
        paragraphs = block_lines(content)
        if not paragraphs:
            raise ValueError(f"No substantive text in {source_id}")
        units.append(
            {
                "key": key,
                "sourceId": source_id,
                "label": label,
                "title": title,
                "unitType": unit_type,
                "paragraphs": paragraphs,
                "fullText": "\n\n".join(paragraphs),
            }
        )
    expected = [*[str(number) for number in range(1, 11)], "A", "B", "C"]
    if [unit["key"] for unit in units] != expected:
        raise ValueError(
            f"Expected Directive sections 1-10 and Appendices A-C, got "
            f"{[unit['key'] for unit in units]}"
        )
    return units


def build_records(
    english_units: list[dict],
    french_units: list[dict],
    *,
    retrieved_on: str,
    english_snapshot: str,
    french_snapshot: str,
    english_snapshot_sha256: str,
    french_snapshot_sha256: str,
) -> list[dict]:
    records = []
    for english_unit, french_unit in zip(english_units, french_units, strict=True):
        if english_unit["key"] != french_unit["key"]:
            raise ValueError(
                f"English/French unit mismatch: {english_unit['key']} != "
                f"{french_unit['key']}"
            )
        key = english_unit["key"]
        slug = f"sec-{key}" if key.isdigit() else f"appendix-{key.lower()}"
        source_id = english_unit["sourceId"]
        records.append(
            {
                "id": f"ca-adm-directive-{slug}",
                "instrumentId": INSTRUMENT_ID,
                "unitType": english_unit["unitType"],
                "articleNumber": key,
                "label": english_unit["label"],
                "title": english_unit["title"],
                "originalTitle": french_unit["title"],
                "chapter": {
                    "id": "ca-adm-directive-body"
                    if key.isdigit()
                    else "ca-adm-directive-appendices",
                    "label": "Directive"
                    if key.isdigit()
                    else "Appendices",
                    "title": "Directive on Automated Decision-Making"
                    if key.isdigit()
                    else "Appendices",
                },
                "section": None,
                "paragraphs": english_unit["paragraphs"],
                "fullText": english_unit["fullText"],
                "contentSha256": sha256(english_unit["fullText"]),
                "language": "en-CA",
                "originalLanguages": ["en-CA", "fr-CA"],
                "displayDefaultLanguage": "en-CA",
                "textAvailability": "official-complete-co-published-current-text",
                "source": ENGLISH_URL,
                "sourceFragment": f"{ENGLISH_URL}#{source_id}",
                "sourceLabel": "Treasury Board of Canada Secretariat — official English text",
                "canonicalSource": ENGLISH_URL,
                "retrievedOn": retrieved_on,
                "versionAsOf": VERSION_AS_OF,
                "statusAsOf": retrieved_on,
                "sourceLocator": english_unit["label"],
                "sourceSnapshots": {
                    "en": {
                        "path": english_snapshot,
                        "sha256": english_snapshot_sha256,
                    },
                    "fr": {
                        "path": french_snapshot,
                        "sha256": french_snapshot_sha256,
                    },
                },
                "translations": {
                    "fr": {
                        "title": french_unit["title"],
                        "paragraphs": french_unit["paragraphs"],
                        "fullText": french_unit["fullText"],
                        "contentSha256": sha256(french_unit["fullText"]),
                        "language": "fr-CA",
                        "status": "official-co-published",
                        "officialStatus": "official-co-published",
                        "coverageStatus": "complete-current-official-French-text",
                        "currentTextEquivalent": True,
                        "versionAsOf": VERSION_AS_OF,
                        "source": FRENCH_URL,
                        "sourceLabel": "Secrétariat du Conseil du Trésor du Canada — texte français officiel",
                        "note": "The English and French versions are co-published official policy texts. English remains the interface default.",
                    }
                },
                "legalEffectStatus": "active-mandatory-federal-internal-policy",
                "effectiveFrom": "2019-04-01",
                "applicability": {
                    "generalComplianceRequiredBy": "2020-04-01",
                    "currentRevisionPublishedOn": "2025-06-24",
                    "existingSystemTransitionEndedOn": "2026-06-24",
                    "note": "The 2026-06-24 date is the transition deadline for pre-existing systems and Agents of Parliament, not a universal start date for every requirement.",
                },
                "summary": SUMMARY_BY_KEY[key],
                "coreConceptIds": CONCEPTS_BY_KEY[key],
                "thematicRelevance": {
                    "isRelevant": True,
                    "highlightEntireUnit": key in {"4", "5", "6", "8", "A", "B", "C"},
                    "themes": ["AI governance", "automated decision-making"],
                },
                "rights": {
                    "reuseStatus": "canada-crown-copyright-non-commercial-reproduction",
                    "license": "Canada.ca Terms and Conditions — non-commercial reproduction",
                    "licenseUrl": "https://www.canada.ca/en/transparency/terms.html?lang=en",
                    "attributionRequired": True,
                    "attribution": "Directive on Automated Decision-Making, Treasury Board of Canada Secretariat; reproduced from the version available at the cited official URL.",
                    "note": "Reproduced for this public non-commercial academic project with source title, author organization, URL, accuracy controls, and no claim of affiliation or endorsement. Government symbols are not reproduced.",
                },
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("english_source", type=Path)
    parser.add_argument("french_source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    parser.add_argument("--snapshot-directory", type=Path)
    args = parser.parse_args()

    english_fragment = load_fragment(args.english_source)
    french_fragment = load_fragment(args.french_source)
    english_snapshot_name = "ca-adm-directive-2025-06-24-en.html"
    french_snapshot_name = "ca-adm-directive-2025-06-24-fr.html"
    if args.snapshot_directory:
        args.snapshot_directory.mkdir(parents=True, exist_ok=True)
        (args.snapshot_directory / english_snapshot_name).write_text(
            english_fragment, encoding="utf-8"
        )
        (args.snapshot_directory / french_snapshot_name).write_text(
            french_fragment, encoding="utf-8"
        )
    english_snapshot = f"data/v2/source-snapshots/{english_snapshot_name}"
    french_snapshot = f"data/v2/source-snapshots/{french_snapshot_name}"

    records = build_records(
        parse_units(english_fragment),
        parse_units(french_fragment),
        retrieved_on=args.retrieved_on,
        english_snapshot=english_snapshot,
        french_snapshot=french_snapshot,
        english_snapshot_sha256=sha256(english_fragment),
        french_snapshot_sha256=sha256(french_fragment),
    )
    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Built {len(records)} bilingual ADM Directive units at {args.output} "
        f"(version {VERSION_AS_OF})."
    )


if __name__ == "__main__":
    main()
