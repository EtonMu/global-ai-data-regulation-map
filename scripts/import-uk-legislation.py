#!/usr/bin/env python3
"""Extract current Articles from an official legislation.gov.uk AKN document.

The AKN representation includes editorial commentary references and complete
footnotes inline with the operative text.  Those nodes are useful when rendering
the source website, but they are not part of the consolidated article wording.
The extractor therefore walks the XML tree explicitly instead of using
``Element.itertext()`` so that notes cannot leak into the corpus.
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

AKN = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
NS = {"akn": AKN}

# These AKN nodes are annotations, not consolidated legislative wording.
# In particular, ``authorialNote`` contains the complete text of a footnote, so
# blindly calling ``itertext()`` duplicates the citation in the article body.
NON_BODY_TEXT_ELEMENTS = {"authorialNote", "noteRef"}


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def visible_text_fragments(element: ET.Element) -> list[str]:
    """Return visible text fragments, excluding editorial annotations."""

    parts: list[str] = []
    if element.text:
        parts.append(element.text)
    for child in element:
        if local_name(child) not in NON_BODY_TEXT_ELEMENTS:
            parts.extend(visible_text_fragments(child))
        # A skipped note's tail is still operative text following the note marker.
        if child.tail:
            parts.append(child.tail)
    return parts


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    tokens = [
        fragment.replace("\u00a0", " ").strip()
        for fragment in visible_text_fragments(element)
    ]
    value = " ".join(token for token in tokens if token)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([‘“(])\s+", r"\1", value)
    value = re.sub(r"\s+([’”)])", r"\1", value)

    # The official current CLML/AKN and rendered page contain this isolated
    # transcription artefact in Article 4(1)(2).  It is not an amendment mark:
    # the enacted GDPR wording is "making available".  Keep this correction
    # deliberately narrow so the importer never applies general legal-text edits.
    value = re.sub(r"\bm\.aking\b", "making", value)
    return value


def structure_record(element: ET.Element, fallback: str) -> dict[str, str]:
    number = normalized_text(element.find("akn:num", NS)) or fallback
    heading = normalized_text(element.find("akn:heading", NS)) or number
    stable_id = element.get("eId") or fallback.lower().replace(" ", "-")
    return {"id": stable_id.lower(), "label": number, "title": heading}


def article_paragraphs(article: ET.Element) -> list[str]:
    paragraphs: list[str] = []
    for child in article:
        if local_name(child) in {
            "paragraph",
            "subparagraph",
            "content",
            "intro",
            "level",
            "blockList",
        }:
            value = normalized_text(child)
            if value and value not in paragraphs:
                paragraphs.append(value)
    if not paragraphs:
        fallback = normalized_text(article)
        heading = normalized_text(article.find("akn:heading", NS))
        number = normalized_text(article.find("akn:num", NS))
        for prefix in (number, heading):
            if prefix and fallback.startswith(prefix):
                fallback = fallback[len(prefix) :].strip()
        if fallback:
            paragraphs.append(fallback)
    return paragraphs


def extract_articles(
    root: ET.Element,
    *,
    instrument_id: str,
    id_prefix: str,
    source_url: str,
    retrieved_on: str,
    expected_version_as_of: str | None = None,
) -> list[dict]:
    valid_from_node = root.find(
        ".//akn:FRBRExpression/akn:FRBRdate[@name='validFrom']", NS
    )
    valid_from = valid_from_node.get("date") if valid_from_node is not None else None
    if expected_version_as_of and valid_from != expected_version_as_of:
        raise ValueError(
            "Official AKN version boundary mismatch: "
            f"expected {expected_version_as_of}, found {valid_from or 'none'}"
        )
    articles: list[dict] = []

    def visit(
        element: ET.Element,
        chapter: dict[str, str] | None,
        section: dict[str, str] | None,
    ) -> None:
        name = local_name(element)
        next_chapter = chapter
        next_section = section
        if name == "chapter":
            next_chapter = structure_record(element, "Chapter")
            next_section = None
        elif name == "section":
            next_section = structure_record(element, "Section")
        elif name == "article":
            number_label = normalized_text(element.find("akn:num", NS))
            number_match = re.search(r"Article\s+(.+)$", number_label, re.I)
            if not number_match:
                raise ValueError(f"Unable to identify Article number for {element.get('eId')}")
            article_number = number_match.group(1).strip()
            article_slug = re.sub(r"[^0-9A-Za-z]+", "-", article_number).strip("-").lower()
            title = normalized_text(element.find("akn:heading", NS)) or number_label
            paragraphs = article_paragraphs(element)
            if not paragraphs:
                raise ValueError(f"No text extracted for Article {article_number}")
            fragment = f"{source_url.rstrip('/')}/article/{article_number}"
            record = {
                "id": f"{id_prefix}{article_slug}",
                "instrumentId": instrument_id,
                "articleNumber": article_number,
                "label": number_label,
                "title": title,
                "chapter": next_chapter
                or {"id": f"{instrument_id}-body", "label": "Body", "title": "Articles"},
                "section": next_section,
                "paragraphs": paragraphs,
                "fullText": "\n\n".join(paragraphs),
                "language": "en",
                "textAvailability": "official-current-consolidated-text",
                "source": source_url,
                "sourceFragment": fragment,
                "sourceLabel": "legislation.gov.uk current consolidated text",
                "retrievedOn": retrieved_on,
                "versionAsOf": valid_from,
                "rights": {
                    "reuseStatus": "open",
                    "license": "Open Government Licence v3.0",
                    "licenseUrl": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
                    "attribution": "Contains public sector information licensed under the Open Government Licence v3.0.",
                },
            }
            articles.append(record)
            return

        for child in element:
            visit(child, next_chapter, next_section)

    body = root.find(".//akn:body", NS)
    if body is None:
        raise ValueError("AKN body was not found")
    visit(body, None, None)
    return articles


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--instrument-id", required=True)
    parser.add_argument("--id-prefix", required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--retrieved-on", required=True)
    parser.add_argument(
        "--expected-version-as-of",
        help="Fail if the AKN validFrom date does not match this YYYY-MM-DD value",
    )
    args = parser.parse_args()

    root = ET.parse(args.input).getroot()
    articles = extract_articles(
        root,
        instrument_id=args.instrument_id,
        id_prefix=args.id_prefix,
        source_url=args.source_url,
        retrieved_on=args.retrieved_on,
        expected_version_as_of=args.expected_version_as_of,
    )
    args.output.write_text(
        json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Extracted {len(articles)} current Articles to {args.output}")


if __name__ == "__main__":
    main()
