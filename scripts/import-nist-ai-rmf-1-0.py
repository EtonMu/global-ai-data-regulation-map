#!/usr/bin/env python3
"""Build a complete, navigable corpus for NIST AI RMF 1.0.

The controlling edition is NIST AI 100-1 (January 2023).  Frozen AIRC HTML
excerpts provide machine-readable section and table structure, while the
immutable NIST PDF remains the version and text authority.  The Playbook and
NIST AI 600-1 Generative AI Profile are audited only as separate companion
resources and are never imported into this corpus.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "v2"
SNAPSHOT_ROOT = DATA_ROOT / "source-snapshots"
DEFAULT_OUTPUT = DATA_ROOT / "us-nist-ai-rmf-1-0-corpus.json"
DEFAULT_MANIFEST = DATA_ROOT / "us-nist-ai-rmf-1-0-corpus-manifest.json"

INSTRUMENT_ID = "us-nist-ai-rmf-1-0"
AS_OF = "2026-07-20"
PUBLISHED_ON = "2023-01-26"
PDF_URL = "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
DOI_URL = "https://doi.org/10.6028/NIST.AI.100-1"
RIGHTS_PROFILE = "nist-technical-series-17-usc-105"
THIRD_PARTY_LICENSE_BOUNDARY = "third-party-excluded-from-project-license"

THIRD_PARTY_MATERIAL = {
    "contents-tables-and-figures": ["OECD figure-source attribution"],
    "executive-summary": [
        "OECD AI-system and AI-actor definitions",
        "ISO 26000 social-responsibility definition",
        "ISO/IEC TR 24368 sustainability and professional-responsibility definitions",
    ],
    "section-1-1": ["ISO 31000 risk and risk-management definitions"],
    "section-1-2-2": ["ISO Guide 73 risk-tolerance source"],
    "section-1-2-3": ["ISO Guide 73 residual-risk definition"],
    "section-2": ["OECD AI-lifecycle and actor source attribution"],
    "figure-2": ["OECD Framework for the Classification of AI Systems source attribution"],
    "section-3-1": ["ISO 9000 and ISO/IEC TS 5723 definitions"],
    "section-3-2": ["ISO/IEC TS 5723 safety definition"],
    "section-3-3": ["ISO/IEC TS 5723 resilience source"],
}


SOURCES = {
    "pdf": (
        "nist-ai-100-1-ai-rmf-1-0-2023.pdf",
        "7576edb531d9848825814ee88e28b1795d3a84b435b4b797d3670eafdc4a89f1",
        PDF_URL,
        "application/pdf",
        "controlling-complete-official-edition",
    ),
    "raw": (
        "nist-ai-100-1-ai-rmf-1-0-2023-pdftotext-raw.txt",
        "b4fdd26d88a7568744c8b0568c8f5d2348dec6ab46497fa6ddb453998646e2c7",
        PDF_URL,
        "text/plain",
        "derived-audit-extraction-from-controlling-pdf",
    ),
    "publication": (
        "nist-ai-rmf-1-0-publication-record-2026-07-20.html",
        "0728b907e2a848defddb27403c36c838a9459bba812ed0841f743e2cc4cee347",
        "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
        "text/html",
        "official-publication-metadata",
    ),
    "status": (
        "nist-ai-rmf-current-status-2026-07-20.html",
        "a0b4c036ee63c436d6b95f57acca5f40cae2b328ef598b40a878a7dda59a2021",
        "https://www.nist.gov/itl/ai-risk-management-framework",
        "text/html",
        "current-version-and-companion-boundary",
    ),
    "rights": (
        "nist-technical-series-rights-2026-07-20.html",
        "aa14f70c512159991b34b391e8647abbdd388939563b16883161594b9c2a0233",
        "https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications",
        "text/html",
        "official-rights-and-reuse-policy",
    ),
    "airc_root": (
        "nist-airc-ai-rmf-resources-index-2026-07-20.html",
        "97e2f06f8c09085dc1136c084c63f9ed0a20fb53eeb5ea876f25ee5752239e41",
        "https://airc.nist.gov/airmf-resources/",
        "text/html",
        "official-structured-resource-index",
    ),
    "exec": (
        "nist-airc-ai-rmf-1-0-executive-summary-2026-07-20.html",
        "a61650340f4dd63190d7ef76a3c7205bec9ab9dd762652a524bd3d42bd891cf3",
        "https://airc.nist.gov/airmf-resources/airmf/0-ai-rmf-1-0/",
        "text/html",
        "official-structured-excerpt",
    ),
    "risk": (
        "nist-airc-ai-rmf-1-0-framing-risk-2026-07-20.html",
        "be30aa764d79bda43140e5946afebe61bbc8a9aeba972adc12ad34080e8d21a2",
        "https://airc.nist.gov/airmf-resources/airmf/1-sec-risk/",
        "text/html",
        "official-structured-excerpt",
    ),
    "audience": (
        "nist-airc-ai-rmf-1-0-audience-2026-07-20.html",
        "da6c0db630daf650d4e6832ded66e903e56268fbf579bedc7c81bcaa83ee821b",
        "https://airc.nist.gov/airmf-resources/airmf/2-sec-audience/",
        "text/html",
        "official-structured-excerpt",
    ),
    "trust": (
        "nist-airc-ai-rmf-1-0-trustworthiness-2026-07-20.html",
        "a608d2032920df87b090835cc6c59a1f04d3b546cef34d8fde73006be2356ab2",
        "https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/",
        "text/html",
        "official-structured-excerpt",
    ),
    "effectiveness": (
        "nist-airc-ai-rmf-1-0-effectiveness-2026-07-20.html",
        "7a9461d1fc7dfd52f77598a787df39a7b81f641f05d4c89b1d0368083d134612",
        "https://airc.nist.gov/airmf-resources/airmf/4-effectiveness/",
        "text/html",
        "official-structured-excerpt",
    ),
    "core": (
        "nist-airc-ai-rmf-1-0-core-2026-07-20.html",
        "7c1d4cb2ca1aaef9fbcdfec9a41dcfb517642ac0b4d9e4eaed06a45ba66506a2",
        "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
        "text/html",
        "official-structured-excerpt-and-core-tables",
    ),
    "profiles": (
        "nist-airc-ai-rmf-1-0-profiles-2026-07-20.html",
        "d9166bae97bf0d22857d85a660bbbf1ca69e7909937a425172394d950de8a2da",
        "https://airc.nist.gov/airmf-resources/airmf/6-sec-profile/",
        "text/html",
        "official-structured-excerpt",
    ),
    "app_a": (
        "nist-airc-ai-rmf-1-0-appendix-a-2026-07-20.html",
        "5b156e78ef4d956e9eb783b471d6fd63e1f9dcc098d247fafcf83f5cfa85818c",
        "https://airc.nist.gov/airmf-resources/airmf/appendices/app-a-descriptions-of-ai-actor-tasks/",
        "text/html",
        "official-structured-excerpt",
    ),
    "app_b": (
        "nist-airc-ai-rmf-1-0-appendix-b-2026-07-20.html",
        "7430d8afa6eab02c3fe5c855d2df8a8f29057b8cd55031ae33b837189da82fc1",
        "https://airc.nist.gov/airmf-resources/airmf/appendices/app-b-how-ai-risks-differ-from-traditional-software-risks/",
        "text/html",
        "official-structured-excerpt",
    ),
    "app_c": (
        "nist-airc-ai-rmf-1-0-appendix-c-2026-07-20.html",
        "0aab42c0cc4d4a811f034460cc3a9fa8513fb7e81872feafc066ff1e39bdc762",
        "https://airc.nist.gov/airmf-resources/airmf/appendices/app-c-ai-risk-management-and-human-ai-interaction/",
        "text/html",
        "official-structured-excerpt",
    ),
    "app_d": (
        "nist-airc-ai-rmf-1-0-appendix-d-2026-07-20.html",
        "a86d2ce7f6b8543afe8bb9bbc6a40cfccaaf264252c165973e379faeb9d9d568",
        "https://airc.nist.gov/airmf-resources/airmf/appendices/app-d-attributes-of-the-ai-rmf/",
        "text/html",
        "official-structured-excerpt",
    ),
    "playbook": (
        "nist-ai-rmf-playbook-boundary-2026-07-20.html",
        "a080e21cd63442406e7d437990b1a5d7ceffb3c32ff3481148d631eb2f851e0e",
        "https://airc.nist.gov/airmf-resources/playbook/",
        "text/html",
        "separate-companion-not-imported",
    ),
    "genai_profile": (
        "nist-ai-600-1-genai-profile-boundary-2026-07-20.html",
        "8e39f1cf3afe6d613ef7707714c6a6fe1fe7541c1351552d57f68840b8276e5c",
        "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
        "text/html",
        "separate-profile-not-imported",
    ),
}


PAGE_META = {
    "executive-summary": ("1-3", "part-1"),
    "1": ("4", "part-1"),
    "1.1": ("4-5", "section-1"),
    "1.2": ("5", "section-1"),
    "1.2.1": ("5-7", "section-1-2"),
    "1.2.2": ("7", "section-1-2"),
    "1.2.3": ("7-8", "section-1-2"),
    "1.2.4": ("8", "section-1-2"),
    "2": ("9-11", "part-1"),
    "3": ("12-13", "part-1"),
    "3.1": ("13-14", "section-3"),
    "3.2": ("14-15", "section-3"),
    "3.3": ("15", "section-3"),
    "3.4": ("15-16", "section-3"),
    "3.5": ("16-17", "section-3"),
    "3.6": ("17", "section-3"),
    "3.7": ("17-19", "section-3"),
    "4": ("19", "part-1"),
    "5": ("20-21", "part-2"),
    "5.1": ("21-24", "section-5"),
    "5.2": ("24-28", "section-5"),
    "5.3": ("28-31", "section-5"),
    "5.4": ("31-33", "section-5"),
    "6": ("33-35", "part-2"),
    "appendix-a": ("35-38", None),
    "appendix-a-additional-ai-actors": ("37-38", "appendix-a"),
    "appendix-b": ("38-40", None),
    "appendix-c": ("40-42", None),
    "appendix-d": ("42-43", None),
}

TABLE_PAGES = {"GOVERN": "22-24", "MAP": "26-28", "MEASURE": "29-31", "MANAGE": "32-33"}

PDF_FIGURE_CAPTIONS = {
    "1": "Fig. 1. Examples of potential harms related to AI systems. Trustworthy AI systems and their responsible use can mitigate negative risks and contribute to benefits for people, organizations, and ecosystems.",
    "2": "Fig. 2. Lifecycle and Key Dimensions of an AI System. Modified from OECD (2022) OECD Framework for the Classification of AI systems — OECD Digital Economy Papers. The two inner circles show AI systems’ key dimensions and the outer circle shows AI lifecycle stages. Ideally, risk management efforts start with the Plan and Design function in the application context and are performed throughout the AI system lifecycle. See Figure 3 for representative AI actors.",
    "3": "Fig. 3. AI actors across AI lifecycle stages. See Appendix A for detailed descriptions of AI actor tasks, including details about testing, evaluation, verification, and validation tasks. Note that AI actors in the AI Model dimension (Figure 2) are separated as a best practice, with those building and using the models separated from those verifying and validating the models.",
    "4": "Fig. 4. Characteristics of trustworthy AI systems. Valid & Reliable is a necessary condition of trustworthiness and is shown as the base for other trustworthiness characteristics. Accountable & Transparent is shown as a vertical box because it relates to all other characteristics.",
    "5": "Fig. 5. Functions organize AI risk management activities at their highest level to govern, map, measure, and manage AI risks. Governance is designed to be a cross-cutting function to inform and be infused throughout the other three functions.",
}


@dataclass
class Element:
    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["Element | str"] = field(default_factory=list)


class TreeParser(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Element(tag.lower(), {key: value or "" for key, value in attrs})
        self.stack[-1].children.append(node)
        if tag.lower() not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


def digest_bytes(value: bytes) -> str:
    return sha256(value).hexdigest()


def digest_text(value: str) -> str:
    return digest_bytes(value.encode("utf-8"))


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def node_text(node: Element | str) -> str:
    if isinstance(node, str):
        return node
    value = "".join(node_text(child) for child in node.children)
    if "smallcaps" in node.attrs.get("class", "").split():
        value = value.upper()
    return compact(value)


def walk(node: Element) -> Iterable[Element]:
    yield node
    for child in node.children:
        if isinstance(child, Element):
            yield from walk(child)


def has_class(node: Element, class_name: str) -> bool:
    return class_name in node.attrs.get("class", "").split()


def parse_html(path: Path) -> Element:
    parser = TreeParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.root


def semantic_events(content: Element) -> list[tuple[str, Element]]:
    events: list[tuple[str, Element]] = []

    def visit(node: Element) -> None:
        if node.attrs.get("hidden") is not None:
            return
        if node.tag in {"h1", "h2", "h3"}:
            events.append(("heading", node))
            return
        if node.tag == "figure":
            events.append(("figure", node))
            return
        if node.tag == "table":
            events.append(("table", node))
            return
        if node.tag in {"p", "blockquote"}:
            if node_text(node):
                events.append(("paragraph", node))
            return
        if node.tag == "li":
            if node_text(node):
                events.append(("list-item", node))
            return
        for child in node.children:
            if isinstance(child, Element):
                visit(child)

    visit(content)
    return events


def locate_rmf_content(root: Element) -> Element:
    matches = [node for node in walk(root) if has_class(node, "rmf-content")]
    if len(matches) != 1:
        raise ValueError(f"Expected one rmf-content element, found {len(matches)}")
    return matches[0]


def source_bytes(snapshot_root: Path, key: str) -> bytes:
    filename, expected, *_ = SOURCES[key]
    path = snapshot_root / filename
    value = path.read_bytes()
    actual = digest_bytes(value)
    if actual != expected:
        raise ValueError(f"Pinned source mismatch for {filename}: {actual}")
    return value


def slugify(value: str) -> str:
    value = value.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def section_key(heading: Element, source_key: str, index: int) -> str:
    number = heading.attrs.get("data-number", "").strip()
    title = node_text(heading)
    if number:
        if number in {"1.1.1", "1.1.2", "1.1.3", "1.1.4"}:
            # AIRC's current HTML has a display-number bug.  The controlling
            # PDF and its table of contents use 1.2.1 through 1.2.4.
            number = "1.2." + number.rsplit(".", 1)[-1]
        return number
    if source_key == "exec":
        return "executive-summary"
    appendix = {"app_a": "appendix-a", "app_b": "appendix-b", "app_c": "appendix-c", "app_d": "appendix-d"}.get(source_key)
    if appendix:
        return appendix if index == 0 else f"{appendix}-{slugify(title)}"
    raise ValueError(f"Unnumbered heading in {source_key}: {title}")


def official_heading_title(heading: Element, key: str) -> str:
    title = node_text(heading)
    title = re.sub(r"^\s*\d+(?:\.\d+)*\s+", "", title)
    if key.startswith("appendix-") and not title.lower().startswith("appendix"):
        return title
    return title


def extract_sections(snapshot_root: Path, source_key: str) -> tuple[list[dict], list[dict], list[Element]]:
    root = parse_html(snapshot_root / SOURCES[source_key][0])
    content = locate_rmf_content(root)
    sections: list[dict] = []
    figures: list[dict] = []
    tables: list[Element] = []
    current: dict | None = None
    heading_index = 0
    for kind, element in semantic_events(content):
        if kind == "heading":
            key = section_key(element, source_key, heading_index)
            heading_index += 1
            current = {
                "key": key,
                "title": official_heading_title(element, key),
                "blocks": [],
                "sourceKey": source_key,
            }
            sections.append(current)
        elif kind == "paragraph":
            if current is None:
                raise ValueError(f"Paragraph before heading in {source_key}")
            current["blocks"].append(node_text(element))
        elif kind == "list-item":
            if current is None:
                raise ValueError(f"List item before heading in {source_key}")
            current["blocks"].append("• " + node_text(element))
        elif kind == "figure":
            caption = next((node_text(node) for node in walk(element) if node.tag == "figcaption"), "")
            match = re.match(r"Figure\s+(\d+):\s*(.*)", caption, flags=re.I)
            if not match:
                raise ValueError(f"Malformed figure caption: {caption}")
            figures.append({
                "number": match.group(1),
                "caption": f"Figure {match.group(1)}: {match.group(2)}",
                "parentKey": current["key"] if current else None,
                "sourceKey": source_key,
                "altText": next((node.attrs.get("alt", "") for node in walk(element) if node.tag == "img"), ""),
            })
        elif kind == "table":
            tables.append(element)
    if not sections or any(not section["blocks"] for section in sections):
        empty = [section["key"] for section in sections if not section["blocks"]]
        raise ValueError(f"Missing section body in {source_key}: {empty}")
    for section in sections:
        if section["key"] == "3":
            section["blocks"] = [block.replace("Figure 4 above", "Figure 4") for block in section["blocks"]]
        if section["key"] == "appendix-a":
            section["title"] = "Appendix A: Descriptions of AI Actor Tasks from Figures 2 and 3"
    return sections, figures, tables


def direct_descendants(node: Element, tags: set[str]) -> list[Element]:
    return [candidate for candidate in walk(node) if candidate.tag in tags]


def parse_core_table(table: Element) -> dict:
    caption = next((node_text(node) for node in walk(table) if node.tag == "caption"), "")
    match = re.match(r"Table\s+(\d+):\s+Categories and subcategories for the (GOVERN|MAP|MEASURE|MANAGE) function\.?$", caption)
    if not match:
        raise ValueError(f"Unexpected core table caption: {caption}")
    table_number, function = match.groups()
    categories: list[dict] = []
    subcategories: list[dict] = []
    current_category: str | None = None
    for row in (node for node in walk(table) if node.tag == "tr"):
        cells = [child for child in row.children if isinstance(child, Element) and child.tag in {"th", "td"}]
        if not cells:
            continue
        texts = [node_text(cell) for cell in cells]
        if texts == ["Categories", "Subcategories"]:
            continue
        if len(texts) == 2:
            category_text, subcategory_text = texts
            category_match = re.match(rf"{function}\s+(\d+):\s*(.+)", category_text, flags=re.I)
            if not category_match:
                raise ValueError(f"Malformed category: {category_text}")
            current_category = f"{function} {category_match.group(1)}"
            categories.append({"identifier": current_category, "text": category_match.group(2)})
        elif len(texts) == 1:
            subcategory_text = texts[0]
        else:
            raise ValueError(f"Unexpected table row: {texts}")
        subcategory_match = re.match(rf"{function}\s+(\d+\.\d+):\s*(.+)", subcategory_text, flags=re.I)
        if not subcategory_match or current_category is None:
            raise ValueError(f"Malformed subcategory: {subcategory_text}")
        subcategories.append({
            "identifier": f"{function} {subcategory_match.group(1)}",
            "text": subcategory_match.group(2),
            "parent": current_category,
        })
    return {
        "number": table_number,
        "function": function,
        "caption": caption,
        "categories": categories,
        "subcategories": subcategories,
    }


def first_sentence(value: str, limit: int = 360) -> str:
    value = compact(value.replace("• ", ""))
    match = re.match(r"(.+?[.!?])(?:\s|$)", value)
    summary = match.group(1) if match else value
    if len(summary) > limit:
        summary = summary[:limit].rsplit(" ", 1)[0] + "…"
    return summary


CONCEPT_RULES = [
    ("privacy-enhancing-tech", r"privacy-enhanc|privacy risk|privacy"),
    ("security-controls", r"secure|security|cyber|adversarial|attack|confidential"),
    ("fairness-nondiscrimination", r"fair|bias|discrimin|equity|equitable"),
    ("transparency-explainability", r"transparen|explain|interpret|documentation|documented"),
    ("accountability-governance", r"accountab|govern|roles|responsibil|leadership|policy|policies"),
    ("human-oversight", r"human[- ]ai|human oversight|human review|operators|end users"),
    ("impact-assessment", r"impact|harm|assessment|evaluate|evaluation|tevv|test"),
    ("continuous-assurance", r"monitor|continuous|ongoing|periodic|validation|verification|measure"),
    ("third-party-supply-chain", r"third-party|supply chain|acquir|procure|partner"),
    ("incident-response", r"incident|recover|contingency|failure|response"),
    ("data-minimization", r"minimum necessary|data minimization"),
    ("training-data-governance", r"training data|data quality|dataset|data provenance"),
    ("automated-decision-safeguards", r"automated decision|decision-making|appeal system outcomes"),
]


def concepts_for(title: str, full_text: str) -> list[str]:
    haystack = f"{title} {full_text}".lower()
    result = [concept for concept, pattern in CONCEPT_RULES if re.search(pattern, haystack)]
    if "ai-risk-management" not in result:
        result.insert(0, "ai-risk-management")
    return result


def make_node(
    *,
    key: str,
    title: str,
    unit_type: str,
    full_text: str,
    parent_key: str | None,
    source_key: str,
    source_pages: str,
    order: int,
    unit_number: str | None = None,
    extra: dict | None = None,
) -> dict:
    node_id = f"{INSTRUMENT_ID}-{slugify(key)}"
    paragraphs = [value for value in full_text.split("\n\n") if value]
    node = {
        "id": node_id,
        "instrumentId": INSTRUMENT_ID,
        "unitType": unit_type,
        "unitNumber": unit_number,
        "label": unit_number or title,
        "articleNumber": unit_number or f"NIST-RMF-{order:03d}",
        "title": title,
        "titleStatus": "official-heading-or-identifier",
        "summary": first_sentence(full_text),
        "summaryStatus": "extractive-high-level-summary",
        "language": "en",
        "fullText": full_text,
        "paragraphs": paragraphs,
        "contentSha256": digest_text(full_text),
        "publishedOn": PUBLISHED_ON,
        "version": "1.0",
        "versionAsOf": AS_OF,
        "status": "current-published-version-revision-in-progress",
        "legalEffectStatus": "voluntary-non-binding-risk-management-framework",
        "textAvailability": "full-official-english",
        "translationStatus": "original-english",
        "sourceUrl": PDF_URL,
        "source": PDF_URL,
        "structuredSourceUrl": SOURCES[source_key][2] if source_key in SOURCES else None,
        "sourcePages": source_pages,
        "sourceAuthority": "controlling-NIST-AI-100-1-PDF",
        "retrievedOn": AS_OF,
        "parentId": f"{INSTRUMENT_ID}-{slugify(parent_key)}" if parent_key else None,
        "hierarchy": None,
        "navigationOrder": order,
        "coreConceptIds": concepts_for(title, full_text),
        "thematicRelevance": {
            "isRelevant": True,
            "highlightEntireUnit": True,
            "basis": "AI RMF 1.0 is wholly concerned with AI governance and risk management; concept links are editorial discovery metadata.",
        },
        "rightsProfile": RIGHTS_PROFILE,
    }
    if extra:
        node.update(extra)
    third_party_key = slugify(key)
    if third_party_key in THIRD_PARTY_MATERIAL:
        node["projectLicenseBoundary"] = THIRD_PARTY_LICENSE_BOUNDARY
        node["thirdPartyMaterial"] = {
            "items": THIRD_PARTY_MATERIAL[third_party_key],
            "status": "excluded-from-project-license-and-any-public-domain-claim",
            "note": "The NIST source attributes material in this unit to ISO/IEC or OECD. Those attributed portions are not covered by the project's license or by any project-level public-domain claim; consult the cited third-party source before reuse.",
        }
    return node


FRONT_MATTER = [
    {
        "key": "publication-information",
        "title": "Publication Information",
        "unitType": "front-matter",
        "pages": "cover-title page",
        "text": "NIST AI 100-1\n\nArtificial Intelligence Risk Management Framework (AI RMF 1.0)\n\nThis publication is available free of charge from: https://doi.org/10.6028/NIST.AI.100-1\n\nJanuary 2023\n\nU.S. Department of Commerce\nGina M. Raimondo, Secretary\n\nNational Institute of Standards and Technology\nLaurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology",
    },
    {
        "key": "commercial-identification-disclaimer",
        "title": "Commercial Identification Disclaimer",
        "unitType": "front-matter",
        "pages": "unnumbered front matter",
        "text": "Certain commercial entities, equipment, or materials may be identified in this document in order to describe an experimental procedure or concept adequately. Such identification is not intended to imply recommendation or endorsement by the National Institute of Standards and Technology, nor is it intended to imply that the entities, materials, or equipment are necessarily the best available for the purpose.\n\nThis publication is available free of charge from: https://doi.org/10.6028/NIST.AI.100-1",
    },
    {
        "key": "update-schedule-and-versions",
        "title": "Update Schedule and Versions",
        "unitType": "front-matter",
        "pages": "unnumbered front matter",
        "text": "The Artificial Intelligence Risk Management Framework (AI RMF) is intended to be a living document.\n\nNIST will review the content and usefulness of the Framework regularly to determine if an update is appropriate; a review with formal input from the AI community is expected to take place no later than 2028. The Framework will employ a two-number versioning system to track and identify major and minor changes. The first number will represent the generation of the AI RMF and its companion documents (e.g., 1.0) and will change only with major revisions. Minor revisions will be tracked using “.n” after the generation number (e.g., 1.1). All changes will be tracked using a Version Control Table which identifies the history, including version number, date of change, and description of change. NIST plans to update the AI RMF Playbook frequently. Comments on the AI RMF Playbook may be sent via email to AIframework@nist.gov at any time and will be reviewed and integrated on a semi-annual basis.",
    },
    {
        "key": "contents-tables-and-figures",
        "title": "Table of Contents and Lists of Tables and Figures",
        "unitType": "navigation-front-matter",
        "pages": "i-ii",
        "text": "Table of Contents\nExecutive Summary 1\nPart 1: Foundational Information 4\n1 Framing Risk 4\n1.1 Understanding and Addressing Risks, Impacts, and Harms 4\n1.2 Challenges for AI Risk Management 5\n1.2.1 Risk Measurement 5\n1.2.2 Risk Tolerance 7\n1.2.3 Risk Prioritization 7\n1.2.4 Organizational Integration and Management of Risk 8\n2 Audience 9\n3 AI Risks and Trustworthiness 12\n3.1 Valid and Reliable 13\n3.2 Safe 14\n3.3 Secure and Resilient 15\n3.4 Accountable and Transparent 15\n3.5 Explainable and Interpretable 16\n3.6 Privacy-Enhanced 17\n3.7 Fair – with Harmful Bias Managed 17\n4 Effectiveness of the AI RMF 19\nPart 2: Core and Profiles 20\n5 AI RMF Core 20\n5.1 Govern 21\n5.2 Map 24\n5.3 Measure 28\n5.4 Manage 31\n6 AI RMF Profiles 33\nAppendix A: Descriptions of AI Actor Tasks from Figures 2 and 3 35\nAppendix B: How AI Risks Differ from Traditional Software Risks 38\nAppendix C: AI Risk Management and Human-AI Interaction 40\nAppendix D: Attributes of the AI RMF 42\n\nList of Tables\nTable 1 Categories and subcategories for the GOVERN function. 22\nTable 2 Categories and subcategories for the MAP function. 26\nTable 3 Categories and subcategories for the MEASURE function. 29\nTable 4 Categories and subcategories for the MANAGE function. 32\n\nList of Figures\nFig. 1 Examples of potential harms related to AI systems. Trustworthy AI systems and their responsible use can mitigate negative risks and contribute to benefits for people, organizations, and ecosystems. 5\nFig. 2 Lifecycle and Key Dimensions of an AI System. Modified from OECD (2022) OECD Framework for the Classification of AI systems — OECD Digital Economy Papers. The two inner circles show AI systems’ key dimensions and the outer circle shows AI lifecycle stages. Ideally, risk management efforts start with the Plan and Design function in the application context and are performed throughout the AI system lifecycle. See Figure 3 for representative AI actors. 10\nFig. 3 AI actors across AI lifecycle stages. See Appendix A for detailed descriptions of AI actor tasks, including details about testing, evaluation, verification, and validation tasks. Note that AI actors in the AI Model dimension (Figure 2) are separated as a best practice, with those building and using the models separated from those verifying and validating the models. 11\nFig. 4 Characteristics of trustworthy AI systems. Valid & Reliable is a necessary condition of trustworthiness and is shown as the base for other trustworthiness characteristics. Accountable & Transparent is shown as a vertical box because it relates to all other characteristics. 12\nFig. 5 Functions organize AI risk management activities at their highest level to govern, map, measure, and manage AI risks. Governance is designed to be a cross-cutting function to inform and be infused throughout the other three functions. 20",
    },
]


def validate_source_boundaries(snapshot_root: Path) -> None:
    raw = source_bytes(snapshot_root, "raw").decode("utf-8")
    status = source_bytes(snapshot_root, "status").decode("utf-8")
    rights = source_bytes(snapshot_root, "rights").decode("utf-8")
    playbook = source_bytes(snapshot_root, "playbook").decode("utf-8")
    genai = source_bytes(snapshot_root, "genai_profile").decode("utf-8")
    required_pdf_anchors = [
        "Artificial Intelligence Risk Management\nFramework (AI RMF 1.0)",
        "GOVERN 1.1: Legal and regulatory",
        "MAP 5.2: Practices and personnel",
        "MEASURE 2.13: Effectiveness of the employed TEVV met-",
        "MANAGE 4.3: Incidents and errors are communicated",
        "Appendix D: Attributes of the AI RMF",
    ]
    for anchor in required_pdf_anchors:
        if anchor not in raw:
            raise ValueError(f"Controlling PDF extraction missing anchor: {anchor}")
    if "The AI RMF 1.0 is being revised" not in status:
        raise ValueError("Current NIST status page no longer records revision in progress")
    if "17 U.S.C. §105" not in rights or "NIST Technical Series Publications" not in rights:
        raise ValueError("NIST public-domain rights anchors missing")
    if "Playbook" not in playbook or "Generative Artificial Intelligence Profile" not in genai:
        raise ValueError("Companion-resource boundary sources missing expected titles")


def build(snapshot_root: Path) -> tuple[list[dict], dict]:
    # The official PDF remains the controlling edition, but is deliberately
    # URL-and-hash pinned rather than redistributed as a repository snapshot.
    # The frozen NIST-derived text extraction and AIRC pages are sufficient to
    # reproduce and audit the corpus without a local PDF file.
    for key in SOURCES:
        if key == "pdf":
            continue
        source_bytes(snapshot_root, key)
    validate_source_boundaries(snapshot_root)

    extracted_sections: list[dict] = []
    figures: list[dict] = []
    core_tables: list[dict] = []
    for source_key in ["exec", "risk", "audience", "trust", "effectiveness", "core", "profiles", "app_a", "app_b", "app_c", "app_d"]:
        sections, page_figures, tables = extract_sections(snapshot_root, source_key)
        extracted_sections.extend(sections)
        figures.extend(page_figures)
        core_tables.extend(parse_core_table(table) for table in tables)

    if [table["function"] for table in core_tables] != ["GOVERN", "MAP", "MEASURE", "MANAGE"]:
        raise ValueError("Core function table sequence mismatch")
    if [len(table["categories"]) for table in core_tables] != [6, 5, 4, 4]:
        raise ValueError("Expected 19 AI RMF categories")
    if [len(table["subcategories"]) for table in core_tables] != [19, 18, 22, 13]:
        raise ValueError("Expected 72 AI RMF subcategories")
    if sorted(int(figure["number"]) for figure in figures) != [1, 2, 3, 4, 5]:
        raise ValueError("Expected all five AI RMF figures")

    nodes: list[dict] = []
    order = 0

    def append_node(**kwargs) -> dict:
        nonlocal order
        order += 1
        node = make_node(order=order, **kwargs)
        nodes.append(node)
        return node

    for item in FRONT_MATTER:
        append_node(
            key=item["key"], title=item["title"], unit_type=item["unitType"],
            full_text=item["text"], parent_key=None, source_key="pdf",
            source_pages=item["pages"],
        )

    append_node(
        key="part-1", title="Part 1: Foundational Information", unit_type="part",
        full_text="Part 1: Foundational Information", parent_key=None,
        source_key="pdf", source_pages="4-19", unit_number="Part 1",
    )
    append_node(
        key="part-2", title="Part 2: Core and Profiles", unit_type="part",
        full_text="Part 2: Core and Profiles", parent_key=None,
        source_key="pdf", source_pages="20-35", unit_number="Part 2",
    )

    section_id_by_key: dict[str, str] = {}
    for section in extracted_sections:
        key = section["key"]
        pages, parent = PAGE_META[key]
        unit_type = "appendix-section" if key.startswith("appendix") else ("function" if key in {"5.1", "5.2", "5.3", "5.4"} else "section")
        node = append_node(
            key=f"section-{key}" if re.match(r"^\d", key) else key,
            title=section["title"], unit_type=unit_type,
            full_text="\n\n".join(section["blocks"]),
            parent_key=parent, source_key=section["sourceKey"], source_pages=pages,
            unit_number=key if re.match(r"^\d", key) else None,
            extra={"officialStructureKey": key},
        )
        section_id_by_key[key] = node["id"]

    figure_pages = {"1": "5", "2": "10", "3": "11", "4": "12", "5": "20"}
    for figure in figures:
        parent_key = f"section-{figure['parentKey']}" if re.match(r"^\d", figure["parentKey"] or "") else figure["parentKey"]
        append_node(
            key=f"figure-{figure['number']}", title=f"Figure {figure['number']}", unit_type="figure-caption",
            full_text=PDF_FIGURE_CAPTIONS[figure["number"]], parent_key=parent_key,
            source_key=figure["sourceKey"], source_pages=figure_pages[figure["number"]],
            unit_number=figure["number"], extra={"altText": figure["altText"]},
        )

    for table in core_tables:
        function_key = {"GOVERN": "5.1", "MAP": "5.2", "MEASURE": "5.3", "MANAGE": "5.4"}[table["function"]]
        table_key = f"table-{table['number']}-{table['function'].lower()}"
        append_node(
            key=table_key, title=f"Table {table['number']}: {table['function']} categories and subcategories",
            unit_type="core-table", full_text=table["caption"], parent_key=f"section-{function_key}",
            source_key="core", source_pages=TABLE_PAGES[table["function"]], unit_number=table["number"],
            extra={"function": table["function"], "categoryCount": len(table["categories"]), "subcategoryCount": len(table["subcategories"])},
        )
        category_key_by_identifier: dict[str, str] = {}
        for category in table["categories"]:
            identifier = category["identifier"].upper()
            category_key = f"core-{identifier.lower().replace(' ', '-')}"
            category_key_by_identifier[identifier] = category_key
            append_node(
                key=category_key, title=identifier, unit_type="core-category",
                full_text=category["text"], parent_key=table_key, source_key="core",
                source_pages=TABLE_PAGES[table["function"]], unit_number=identifier,
                extra={"function": table["function"], "officialOutcomeIdentifier": identifier},
            )
        for subcategory in table["subcategories"]:
            identifier = subcategory["identifier"].upper()
            append_node(
                key=f"core-{identifier.lower().replace(' ', '-')}", title=identifier,
                unit_type="core-subcategory", full_text=subcategory["text"],
                parent_key=category_key_by_identifier[subcategory["parent"].upper()],
                source_key="core", source_pages=TABLE_PAGES[table["function"]],
                unit_number=identifier,
                extra={"function": table["function"], "officialOutcomeIdentifier": identifier},
            )

    # Emit a depth-first navigation order that follows the printed framework.
    original_order = {node["id"]: node["navigationOrder"] for node in nodes}
    children: dict[str | None, list[dict]] = {}
    for node in nodes:
        children.setdefault(node["parentId"], []).append(node)

    def child_key(node: dict) -> tuple[int, int]:
        parent = node["parentId"]
        figure_first_parents = {
            f"{INSTRUMENT_ID}-section-3",
            f"{INSTRUMENT_ID}-section-5",
        }
        priority = 0 if parent in figure_first_parents and node["unitType"] == "figure-caption" else 1
        return priority, original_order[node["id"]]

    ordered_nodes: list[dict] = []

    def emit(node: dict) -> None:
        ordered_nodes.append(node)
        for child in sorted(children.get(node["id"], []), key=child_key):
            emit(child)

    for root_node in sorted(children.get(None, []), key=child_key):
        emit(root_node)
    if len(ordered_nodes) != len(nodes):
        raise ValueError("Navigation traversal did not cover every node")
    nodes = ordered_nodes
    for index, node in enumerate(nodes, start=1):
        node["navigationOrder"] = index

    ids = [node["id"] for node in nodes]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate corpus node IDs")
    id_set = set(ids)
    by_id = {node["id"]: node for node in nodes}
    for node in nodes:
        if node["parentId"] and node["parentId"] not in id_set:
            raise ValueError(f"Missing parent {node['parentId']} for {node['id']}")
        ancestor_ids: list[str] = []
        cursor = node["parentId"]
        while cursor:
            if cursor in ancestor_ids:
                raise ValueError(f"Hierarchy cycle at {node['id']}")
            ancestor_ids.insert(0, cursor)
            cursor = by_id[cursor]["parentId"]
        node["hierarchy"] = {
            "parentId": node["parentId"],
            "ancestorIds": ancestor_ids,
            "pathLabels": [by_id[ancestor]["label"] for ancestor in ancestor_ids] + [node["label"]],
            "depth": len(ancestor_ids),
        }

    type_counts = {unit_type: sum(node["unitType"] == unit_type for node in nodes) for unit_type in sorted({node["unitType"] for node in nodes})}
    manifest = {
        "instrumentId": INSTRUMENT_ID,
        "officialTitle": "Artificial Intelligence Risk Management Framework (AI RMF 1.0)",
        "publicationNumber": "NIST AI 100-1",
        "doi": DOI_URL,
        "publishedOn": PUBLISHED_ON,
        "retrievedOn": AS_OF,
        "hashAlgorithm": "SHA-256",
        "currentVersion": {
            "version": "1.0",
            "statusAsOf": AS_OF,
            "status": "current-published-version-revision-in-progress",
            "revisionAuditConclusion": "NIST still identifies AI RMF 1.0 as the published framework and states that a revised version is in progress. No later numbered AI RMF core edition was imported.",
            "controllingEdition": "NIST AI 100-1, January 2023",
        },
        "scopeBoundary": {
            "included": "The complete English text and authentic hierarchy of NIST AI RMF 1.0, including front matter, both parts, sections, five figure captions, four core tables, 19 categories, 72 subcategories, profiles, and Appendices A-D.",
            "playbookIncluded": False,
            "generativeAiProfileIncluded": False,
            "playbookRelationship": "Separate, frequently updated companion implementation resource; audited but not merged.",
            "generativeAiProfileRelationship": "Separate NIST AI 600-1 profile released in 2024; audited but not merged.",
            "aircNumberingCorrection": "Current AIRC HTML labels the four children of section 1.2 as 1.1.1-1.1.4. The corpus uses 1.2.1-1.2.4 exactly as printed in the controlling PDF and table of contents.",
        },
        "corpus": {
            "path": "data/v2/us-nist-ai-rmf-1-0-corpus.json",
            "nodeCount": len(nodes),
            "unitTypeCounts": type_counts,
            "functionCount": 4,
            "coreTableCount": 4,
            "categoryCount": 19,
            "subcategoryCount": 72,
            "figureCount": 5,
            "completeSourceCoverageVerified": True,
            "contentSha256": digest_text("\n\n".join(node["fullText"] for node in nodes)),
            "nodeIdSequenceSha256": digest_text("\n".join(ids)),
        },
        "rights": {
            "profile": RIGHTS_PROFILE,
            "usCopyrightStatus": "Works authored by NIST employees are not subject to copyright protection in the United States under 17 U.S.C. § 105.",
            "foreignRights": "Foreign rights may be reserved, but NIST grants a non-exclusive, perpetual, paid-up, royalty-free, worldwide right to reprint and prepare derivative works for NIST Technical Series publications.",
            "attributionRecommendation": "Use NIST's recommended citation followed by ‘Republished courtesy of the National Institute of Standards and Technology.’",
            "thirdPartyCaveat": "Some NIST-published works or embedded third-party materials may be separately protected; this corpus stores text from the NIST-authored technical series publication and identifies external standards only by the references present in that text.",
            "thirdPartyMaterialBoundary": {
                "projectLicenseBoundary": THIRD_PARTY_LICENSE_BOUNDARY,
                "affectedNodeCount": len(THIRD_PARTY_MATERIAL),
                "affectedNodeIds": [
                    f"{INSTRUMENT_ID}-{slugify(key)}"
                    for key in THIRD_PARTY_MATERIAL
                ],
                "note": "Only the specifically attributed ISO/IEC and OECD material identified on each affected node is excluded; NIST-authored surrounding text remains governed by the NIST Technical Series rights profile.",
            },
            "sourceUrl": SOURCES["rights"][2],
        },
        "sourceSnapshots": [
            (
                {
                    "sourceUrl": url,
                    "retrievedOn": AS_OF,
                    "mediaType": media_type,
                    "role": role,
                    "sha256": expected,
                    "storedLocally": False,
                    "rightsProfile": RIGHTS_PROFILE,
                }
                if key == "pdf"
                else {
                    "path": f"data/v2/source-snapshots/{filename}",
                    "sourceUrl": url,
                    "retrievedOn": AS_OF,
                    "mediaType": media_type,
                    "role": role,
                    "sha256": expected,
                    "storedLocally": True,
                    "rightsProfile": RIGHTS_PROFILE if key != "raw" else "derived-from-nist-technical-series-source",
                }
            )
            for key, (filename, expected, url, media_type, role) in SOURCES.items()
        ],
        "qualityAssurance": {
            "pdfPageCount": 48,
            "pdfVisualInspection": "Rendered and visually inspected representative cover, contents, narrative, all core-table regions, appendix, and closing pages.",
            "pdfTextAuthority": True,
            "aircUsedForStructure": True,
            "coreCountChecks": {"functions": 4, "categories": 19, "subcategories": 72},
            "companionContaminationCheck": True,
        },
    }
    return nodes, manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot-dir", type=Path, default=SNAPSHOT_ROOT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    nodes, manifest = build(args.snapshot_dir)
    args.output.write_text(json.dumps(nodes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest["corpus"]["fileSha256"] = digest_bytes(args.output.read_bytes())
    manifest_basis = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    manifest["manifestContentBasisSha256"] = digest_text(manifest_basis)
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "nodes": len(nodes),
        "functions": manifest["corpus"]["functionCount"],
        "categories": manifest["corpus"]["categoryCount"],
        "subcategories": manifest["corpus"]["subcategoryCount"],
        "corpusSha256": manifest["corpus"]["fileSha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
