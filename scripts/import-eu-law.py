#!/usr/bin/env python3
"""Extract chapter, section, article, and paragraph text from EUR-Lex XHTML.

The Publications Office CELLAR API can return official XHTML for a CELEX work.
This importer deliberately stores only the enacted article text and hierarchy;
recitals, signatures, and footnotes remain available at the official source.
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


XHTML = "{http://www.w3.org/1999/xhtml}"


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return re.sub(r"\s+", " ", "".join(element.itertext())).strip()


def normalized_title(element: ET.Element | None) -> str:
    """Normalize an EUR-Lex heading and drop stray footnote glyphs."""
    return normalized_text(element).rstrip("`").strip()


def has_class(element: ET.Element, class_name: str) -> bool:
    return class_name in element.attrib.get("class", "").split()


def first_descendant_with_class(
    element: ET.Element, tag: str, class_name: str
) -> ET.Element | None:
    return next(
        (
            child
            for child in element.iter(f"{XHTML}{tag}")
            if has_class(child, class_name)
        ),
        None,
    )


def direct_child_with_class(
    element: ET.Element, tag: str, class_name: str
) -> ET.Element | None:
    return next(
        (
            child
            for child in list(element)
            if child.tag == f"{XHTML}{tag}" and has_class(child, class_name)
        ),
        None,
    )


def title_from_container(element: ET.Element) -> str:
    title_container = next(
        (
            child
            for child in list(element)
            if child.tag == f"{XHTML}div"
            and has_class(child, "eli-title")
        ),
        None,
    )
    if title_container is None:
        return ""
    title = first_descendant_with_class(title_container, "p", "oj-sti-art")
    if title is None:
        title = first_descendant_with_class(title_container, "p", "oj-ti-section-2")
    return normalized_title(title)


def structural_label(element: ET.Element) -> str:
    label = direct_child_with_class(element, "p", "oj-ti-section-1")
    return normalized_text(label)


def combine_list_markers(paragraphs: list[str]) -> list[str]:
    combined: list[str] = []
    index = 0
    marker = re.compile(r"^\([0-9a-zivxlcdm]+\)$", re.IGNORECASE)
    while index < len(paragraphs):
        current = paragraphs[index]
        if marker.match(current) and index + 1 < len(paragraphs):
            combined.append(f"{current} {paragraphs[index + 1]}")
            index += 2
            continue
        combined.append(current)
        index += 1
    return combined


def parse_articles(
    input_path: Path,
    instrument_id: str,
    source_url: str,
    retrieved_on: str,
) -> list[dict[str, object]]:
    root = ET.parse(input_path).getroot()
    parent = {child: node for node in root.iter() for child in node}
    articles: list[dict[str, object]] = []

    for article in root.iter(f"{XHTML}div"):
        article_dom_id = article.attrib.get("id", "")
        match = re.fullmatch(r"art_(\d+[a-z]?)", article_dom_id)
        if not match:
            continue

        number = match.group(1)
        article_label = normalized_text(
            direct_child_with_class(article, "p", "oj-ti-art")
        ) or f"Article {number}"
        article_title = title_from_container(article)

        ancestors: list[ET.Element] = []
        cursor = parent.get(article)
        while cursor is not None:
            ancestors.append(cursor)
            cursor = parent.get(cursor)

        chapter = next(
            (
                node
                for node in ancestors
                if node.tag == f"{XHTML}div"
                and re.fullmatch(r"cpt_[^.]+", node.attrib.get("id", ""))
            ),
            None,
        )
        section = next(
            (
                node
                for node in ancestors
                if node.tag == f"{XHTML}div"
                and ".sct_" in node.attrib.get("id", "")
                and ".tit_" not in node.attrib.get("id", "")
            ),
            None,
        )

        raw_paragraphs = [
            normalized_text(node)
            for node in article.iter(f"{XHTML}p")
            if has_class(node, "oj-normal") and normalized_text(node)
        ]
        paragraphs = combine_list_markers(raw_paragraphs)

        articles.append(
            {
                "id": f"{instrument_id}-art-{number.lower()}",
                "instrumentId": instrument_id,
                "articleNumber": number,
                "label": article_label,
                "title": article_title,
                "chapter": {
                    "id": chapter.attrib.get("id") if chapter is not None else None,
                    "label": structural_label(chapter) if chapter is not None else "",
                    "title": title_from_container(chapter) if chapter is not None else "",
                },
                "section": (
                    {
                        "id": section.attrib.get("id"),
                        "label": structural_label(section),
                        "title": title_from_container(section),
                    }
                    if section is not None
                    else None
                ),
                "paragraphs": paragraphs,
                "fullText": "\n\n".join(paragraphs),
                "language": "en",
                "textAvailability": "full",
                "source": source_url,
                "sourceFragment": f"{source_url}#art_{number}",
                "retrievedOn": retrieved_on,
            }
        )

    def article_sort_key(item: dict[str, object]) -> tuple[int, str]:
        value = str(item["articleNumber"])
        match = re.fullmatch(r"(\d+)([a-z]?)", value, re.IGNORECASE)
        if not match:
            return (10_000, value)
        return (int(match.group(1)), match.group(2).lower())

    return sorted(articles, key=article_sort_key)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--instrument-id", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    articles = parse_articles(
        args.input,
        args.instrument_id,
        args.source,
        args.retrieved_on,
    )
    if not articles:
        raise SystemExit("No articles were found in the supplied EUR-Lex XHTML")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(articles, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Extracted {len(articles)} articles to {args.output}")


if __name__ == "__main__":
    main()
