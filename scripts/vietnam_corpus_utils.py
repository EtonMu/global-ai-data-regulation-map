#!/usr/bin/env python3
"""Vietnam-only helpers for the three personal-data legal corpora."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from legal_corpus_utils import content_sha256, write_json


RIGHTS = {
    "reuseStatus": "government-edict",
    "license": (
        "Vietnamese legislative texts and their official translations are outside "
        "copyright protection under Article 15(2) of the consolidated Law on "
        "Intellectual Property, No. 155/VBHN-VPQH (2025)"
    ),
    "licenseUrl": "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/9/155-vbhn-vpqh.pdf",
    "attribution": (
        "Controlling text: the signed Government or National Assembly publication. "
        "Any secondary transcription is identified and used only for scan correction."
    ),
}


def load_json(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")
    return payload


def assert_nfc(value: str, label: str) -> None:
    if value != unicodedata.normalize("NFC", value):
        raise ValueError(f"{label} is not Unicode NFC")


def validate_clean_articles(payload: dict, instrument_id: str, expected: int) -> list[dict]:
    if payload.get("instrumentId") != instrument_id:
        raise ValueError(f"Unexpected clean snapshot instrument: {payload.get('instrumentId')}")
    articles = payload.get("articles")
    if not isinstance(articles, list):
        raise ValueError("Clean snapshot has no Articles array")
    numbers = [article.get("articleNumber") for article in articles]
    target = [str(number) for number in range(1, expected + 1)]
    if numbers != target:
        raise ValueError(f"Expected Articles 1..{expected}, got {numbers}")
    for article in articles:
        number = article["articleNumber"]
        paragraphs = article.get("paragraphs")
        if not isinstance(paragraphs, list) or len(paragraphs) < 2:
            raise ValueError(f"Article {number} has no complete paragraph list")
        if not paragraphs[0].startswith(f"Điều {number}."):
            raise ValueError(f"Article {number} lost its official heading")
        for paragraph in paragraphs:
            assert_nfc(paragraph, f"Article {number}")
    return articles


def validate_clean_forms(payload: dict, expected_forms: list[str]) -> list[dict]:
    forms = payload.get("forms")
    if not isinstance(forms, list):
        raise ValueError("Clean snapshot has no forms array")
    numbers = [form.get("formNumber") for form in forms]
    if numbers != expected_forms:
        raise ValueError(f"Expected forms {expected_forms}, got {numbers}")
    for form in forms:
        paragraphs = form.get("paragraphs")
        number = form["formNumber"]
        if not isinstance(paragraphs, list) or len(paragraphs) < 3:
            raise ValueError(f"Form {number} has no substantive text")
        if paragraphs[0] != f"Mẫu số {number}":
            raise ValueError(f"Form {number} lost its canonical Appendix label")
        for paragraph in paragraphs:
            assert_nfc(paragraph, f"Form {number}")
    return forms


def official_article_page_ranges(
    payload: dict,
    *,
    instrument_id: str,
    expected_pdf_hash: str,
    expected_articles: int,
    body_last_page: int,
) -> dict[int, dict[str, int]]:
    if payload.get("instrumentId") != instrument_id:
        raise ValueError(f"Unexpected OCR snapshot instrument: {payload.get('instrumentId')}")
    if payload.get("sourceRole") != "official-signed-scan-ocr-verification":
        raise ValueError("OCR snapshot is not identified as an official-scan verification")
    if payload.get("sourceDocumentSha256") != expected_pdf_hash:
        raise ValueError("OCR snapshot is not tied to the pinned signed PDF")
    lines = payload.get("lines")
    if not isinstance(lines, list) or not lines:
        raise ValueError("Official OCR snapshot has no lines")

    starts: dict[int, int] = {}
    for item in lines:
        page = int(item["page"])
        if page > body_last_page:
            continue
        text = str(item["text"])
        for number in range(1, expected_articles + 1):
            if number in starts:
                continue
            if re.search(rf"Điều\s+{number}\.", text):
                starts[number] = page
                break
    if sorted(starts) != list(range(1, expected_articles + 1)):
        raise ValueError(
            f"Official scan did not verify every Article heading: {sorted(starts)}"
        )

    ranges: dict[int, dict[str, int]] = {}
    for number in range(1, expected_articles + 1):
        # A following Article can begin midway down the same page on which the
        # current Article ends.  Page-level provenance therefore deliberately
        # overlaps at that boundary instead of pretending to provide line-level
        # precision that the image scan cannot support.
        next_start = starts.get(number + 1, body_last_page)
        ranges[number] = {
            "start": starts[number],
            "end": max(starts[number], min(body_last_page, next_start)),
        }
    return ranges


def ascii_key(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    without_marks = "".join(
        character for character in decomposed if not unicodedata.combining(character)
    )
    return re.sub(r"[^0-9a-z]+", "", without_marks.casefold())


def validate_form_pages(payload: dict, expected_pages: dict[str, int]) -> None:
    by_page: dict[int, str] = {}
    for line in payload["lines"]:
        page = int(line["page"])
        by_page[page] = by_page.get(page, "") + " " + str(line["text"])
    for form_number, page in expected_pages.items():
        page_key = ascii_key(by_page.get(page, ""))
        if f"mauso{form_number}" not in page_key and f"mau{form_number}" not in page_key:
            raise ValueError(
                f"Official scan page {page} did not verify Appendix form {form_number}"
            )


def build_text_record(
    *,
    record_id: str,
    instrument_id: str,
    article_number: str,
    label: str,
    original_title: str,
    title: str,
    chapter: dict,
    section: dict | None,
    paragraphs: list[str],
    source: str,
    canonical_source: str,
    status_source: str,
    official_html_source: str | None,
    transcription_source: str | None,
    source_label: str,
    retrieved_on: str,
    effective_from: str,
    legal_effect_status: str,
    source_version: dict,
    summary: str,
    source_page_range: dict[str, int],
) -> dict:
    full_text = "\n\n".join(paragraphs)
    assert_nfc(full_text, record_id)
    if re.search(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f]", full_text):
        raise ValueError(f"{record_id} contains control characters")
    record = {
        "id": record_id,
        "instrumentId": instrument_id,
        "articleNumber": article_number,
        "label": label,
        "originalTitle": original_title,
        "title": title,
        "chapter": chapter,
        "section": section,
        "paragraphs": paragraphs,
        "fullText": full_text,
        "language": "vi-VN",
        "textAvailability": "official-original-text-verified-transcription",
        "source": source,
        "sourceFragment": source,
        "canonicalSource": canonical_source,
        "statusSource": status_source,
        "sourceLabel": source_label,
        "sourcePageRange": source_page_range,
        "retrievedOn": retrieved_on,
        "versionAsOf": retrieved_on,
        "statusAsOf": retrieved_on,
        "effectiveFrom": effective_from,
        "legalEffectStatus": legal_effect_status,
        "sourceVersion": source_version,
        "summary": summary,
        "englishAvailability": {
            "coverageStatus": "no-source-text",
            "status": "not-available-in-government-primary-sources",
            "versionAsOf": retrieved_on,
            "versionLabel": source_version.get(
                "instrumentNumber",
                source_version.get("officialTitle", "official Vietnamese source version"),
            ),
            "authorityNote": (
                "Vietnamese is the controlling legal text. No complete English "
                "translation published by the issuing authority or an open official "
                "Government source was verified."
            ),
            "sourcesChecked": [
                source,
                canonical_source,
                *([official_html_source] if official_html_source else []),
            ],
            "note": (
                "No complete official Government English version was verified; "
                "no machine, commercial-database or unofficial translation is "
                "substituted. English versions visible on subscription legal "
                "databases are outside this open corpus's republication boundary."
            ),
        },
        "rights": RIGHTS,
        "contentSha256": content_sha256(full_text),
    }
    if official_html_source:
        record["officialHtmlSource"] = official_html_source
    if transcription_source:
        record["transcriptionSource"] = transcription_source
        record["transcriptionMethod"] = (
            "The signed official scan controls. A clean Vietnamese transcription was "
            "used only to restore searchable text, list markers and diacritics after "
            "comparison with the official source."
        )
    return record


__all__ = [
    "RIGHTS",
    "build_text_record",
    "content_sha256",
    "load_json",
    "official_article_page_ranges",
    "validate_clean_articles",
    "validate_clean_forms",
    "validate_form_pages",
    "write_json",
]
