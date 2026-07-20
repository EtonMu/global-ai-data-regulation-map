#!/usr/bin/env python3
"""Extract the Senate-approved PL 2338/2023 autograph from its official PDF.

The source is a born-digital, electronically authenticated Chamber copy of the
Senate autograph.  This script removes only page furniture, joins visual line
wraps, and preserves every substantive character in Article order.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import re
import unicodedata
from pathlib import Path

from pypdf import PdfReader


SOURCE_URL = (
    "https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra"
    "?codteor=2868197&filename=PL+2338%2F2023"
)
SOURCE_SHA256 = "82e264056ab6622a58ce7cbb66e02d0c79c5d85ff76639841421ca415892c8ca"
EXPECTED_ARTICLE_NUMBERS = [*range(1, 31), *range(32, 81)]


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def compact_sha256(paragraphs: list[str]) -> str:
    value = "".join(paragraphs)
    value = re.sub(r"\s+", "", unicodedata.normalize("NFC", value))
    return sha256_text(value)


def normalize_line(value: str) -> str:
    value = unicodedata.normalize("NFC", value)
    value = value.replace("\u00a0", " ").replace("\u0002", "-")
    return re.sub(r"\s+", " ", value).strip()


def article_number(value: str) -> int | None:
    match = re.match(r"^Art\.\s*(\d+)(?:º|\.)\s", value)
    return int(match.group(1)) if match else None


def is_paragraph_start(value: str) -> bool:
    return bool(
        re.match(
            r"^(?:"
            r"Art\.\s*\d+(?:º|\.)\s|"
            r"§\s*\d+º\s|"
            r"Parágrafo único\.\s|"
            r"[IVXLCDM]+\s*[−–—-]\s|"
            r"[a-z]\)\s|"
            r"[0-9]+\)\s|"
            r"[“\"]Art\.\s*\d+(?:º|\.)|"
            r"\.{5,}"
            r")",
            value,
        )
    )


def merge_article_lines(lines: list[tuple[int, str]]) -> list[str]:
    paragraphs: list[str] = []
    for _page, line in lines:
        if not paragraphs or is_paragraph_start(line):
            paragraphs.append(line)
            continue
        separator = "" if paragraphs[-1].endswith("-") else " "
        paragraphs[-1] = f"{paragraphs[-1]}{separator}{line}"
    return paragraphs


def heading(identifier: str, label: str, title: str) -> dict[str, str]:
    return {"id": identifier, "label": label, "title": title}


def extract(pdf_path: Path, retrieved_on: str) -> dict:
    raw_pdf = pdf_path.read_bytes()
    actual_sha256 = sha256_bytes(raw_pdf)
    if actual_sha256 != SOURCE_SHA256:
        raise ValueError(
            f"Official PDF SHA-256 mismatch: {actual_sha256} != {SOURCE_SHA256}"
        )

    logging.getLogger("pypdf").setLevel(logging.ERROR)
    reader = PdfReader(pdf_path)
    physical_lines: list[tuple[int, str]] = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text(extraction_mode="layout") or ""
        for raw_line in text.splitlines():
            line = normalize_line(raw_line)
            if not line:
                continue
            if line == str(page_number):
                continue
            if line in {
                "*CD252287612600*",
                "Autenticado Eletronicamente, após conferência com o original.",
            }:
                continue
            physical_lines.append((page_number, line))

    current_chapter = heading(
        "br-pl2338-chapter-1",
        "CAPÍTULO I",
        "DISPOSIÇÕES PRELIMINARES",
    )
    current_section: dict[str, str] | None = None
    pending_heading: dict | None = None
    current_article: dict | None = None
    articles: list[dict] = []

    def finish_pending_heading() -> None:
        nonlocal pending_heading, current_chapter, current_section
        if pending_heading is None:
            return
        title = " ".join(pending_heading["titleParts"]).strip()
        value = heading(
            pending_heading["id"], pending_heading["label"], title
        )
        if pending_heading["kind"] == "chapter":
            current_chapter = value
            current_section = None
        else:
            current_section = value
        pending_heading = None

    def finish_article() -> None:
        nonlocal current_article
        if current_article is None:
            return
        paragraphs = merge_article_lines(current_article.pop("lines"))
        full_text = "\n\n".join(paragraphs)
        current_article.update(
            {
                "paragraphs": paragraphs,
                "fullText": full_text,
                "contentSha256": sha256_text(full_text),
                "compactTextSha256": compact_sha256(paragraphs),
            }
        )
        articles.append(current_article)
        current_article = None

    for page_number, line in physical_lines:
        if line == "Senado Federal, em 31 de janeiro de 2025.":
            finish_article()
            break

        chapter_match = re.fullmatch(r"CAPÍTULO\s+([IVXLCDM]+)", line)
        if chapter_match:
            finish_article()
            finish_pending_heading()
            numeral = chapter_match.group(1)
            pending_heading = {
                "kind": "chapter",
                "id": f"br-pl2338-chapter-{numeral.lower()}",
                "label": line,
                "titleParts": [],
            }
            continue

        section_match = re.fullmatch(r"Seção\s+([IVXLCDM]+)", line)
        if section_match:
            finish_article()
            finish_pending_heading()
            numeral = section_match.group(1)
            pending_heading = {
                "kind": "section",
                "id": f"{current_chapter['id']}-section-{numeral.lower()}",
                "label": line,
                "titleParts": [],
            }
            continue

        number = article_number(line)
        if number is not None:
            finish_article()
            finish_pending_heading()
            current_article = {
                "articleNumber": str(number),
                "sourcePageRange": {"start": page_number, "end": page_number},
                "chapter": current_chapter,
                "section": current_section,
                "lines": [(page_number, line)],
            }
            continue

        if pending_heading is not None:
            pending_heading["titleParts"].append(line)
            continue

        if current_article is not None:
            current_article["sourcePageRange"]["end"] = page_number
            current_article["lines"].append((page_number, line))

    actual_numbers = [int(article["articleNumber"]) for article in articles]
    if actual_numbers != EXPECTED_ARTICLE_NUMBERS:
        raise ValueError(
            "Unexpected autograph numbering: "
            f"{actual_numbers}; expected {EXPECTED_ARTICLE_NUMBERS}"
        )
    if len(reader.pages) != 36:
        raise ValueError(f"Expected 36 PDF pages, got {len(reader.pages)}")

    return {
        "instrumentId": "br-pl-2338-2023-ai-bill",
        "sourceRole": "official-senate-approved-autograph-searchable-text",
        "retrievedOn": retrieved_on,
        "sourceDocument": {
            "url": SOURCE_URL,
            "sha256": actual_sha256,
            "pageCount": len(reader.pages),
            "authentication": (
                "Câmara dos Deputados electronically authenticated copy of the "
                "Senate autograph received on 17 March 2025"
            ),
            "senateAutographDate": "2025-01-31",
        },
        "extraction": {
            "method": "pypdf layout text; visual line wraps merged mechanically",
            "pageFurnitureRemoved": [
                "printed page numbers",
                "electronic-authentication footer",
                "rotated filing metadata",
            ],
            "normalization": "Unicode NFC; whitespace normalized; no substantive editing",
        },
        "coverage": {
            "unit": "article",
            "actualUnitCount": len(articles),
            "articleNumbers": [article["articleNumber"] for article in articles],
            "numberingNotice": (
                "The official Senate autograph intentionally jumps from Article 30 "
                "to Article 32; there is no Article 31 in the controlling text."
            ),
            "complete": True,
        },
        "articles": articles,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_pdf", type=Path)
    parser.add_argument("output_json", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()
    payload = extract(args.input_pdf, args.retrieved_on)
    args.output_json.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Extracted {len(payload['articles'])} official Article nodes to "
        f"{args.output_json}"
    )


if __name__ == "__main__":
    main()
