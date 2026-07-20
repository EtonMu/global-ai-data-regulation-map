#!/usr/bin/env python3
"""Generate Decree 356/2025 Articles 1-42 and all 13 Appendix forms."""

from __future__ import annotations

import argparse
import hashlib
import re
import unicodedata
from pathlib import Path

from vietnam_corpus_utils import (
    build_text_record,
    load_json,
    official_article_page_ranges,
    validate_clean_articles,
    validate_clean_forms,
    validate_form_pages,
    write_json,
)


INSTRUMENT_ID = "vn-decree-356-2025"
SOURCE = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf"
CANONICAL_SOURCE = "https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160"
OFFICIAL_HTML = "https://vbpl.vn/bocongan/Pages/vbpq-toanvan.aspx?ItemID=187276"
STATUS_SOURCE = "https://vbpl.vn/bocongan/Pages/vbpq-thuoctinh.aspx?ItemID=187276"
TRANSCRIPTION_SOURCE = (
    "https://hethongphapluat.com/nghi-dinh-356-2025-nd-cp-"
    "huong-dan-luat-bao-ve-du-lieu-ca-nhan.html"
)
PDF_SHA256 = "5b36a060c22db1df6c32b8c66da63b0c36571a1f7fa01765e719baac215b6c12"
GAZETTE_SOURCE = (
    "https://congbaocdn.chinhphu.vn/180507251028987904/2026/1/17/"
    "356signed-1768638052103952849513.pdf"
)
GAZETTE_SHA256 = "f24747bf3c374b04901e66704423ea1e1a60460376c4d052d649ecc8a2a2f1eb"
FORM_NUMBERS = ["01a", "01b", "02a", "02b", "03a", "03b", "04", "05", "06", "07", "08", "09", "10"]
FORM_START_PAGES = {
    "01a": 39,
    "01b": 41,
    "02a": 42,
    "02b": 44,
    "03a": 45,
    "03b": 47,
    "04": 48,
    "05": 50,
    "06": 51,
    "07": 53,
    "08": 54,
    "09": 56,
    "10": 64,
}


def chapter(value: dict) -> dict:
    roman = str(value["number"])
    return {
        "id": f"{INSTRUMENT_ID}-chapter-{roman.casefold()}",
        "number": roman,
        "label": value["label"],
        "title": value["title"],
    }


def form_page_ranges() -> dict[str, dict[str, int]]:
    ranges: dict[str, dict[str, int]] = {}
    for index, number in enumerate(FORM_NUMBERS):
        next_page = (
            FORM_START_PAGES[FORM_NUMBERS[index + 1]]
            if index + 1 < len(FORM_NUMBERS)
            else 72
        )
        ranges[number] = {
            "start": FORM_START_PAGES[number],
            "end": next_page - 1,
        }
    return ranges


def compact_sha256(paragraphs: list[str]) -> str:
    value = unicodedata.normalize("NFC", "\n".join(paragraphs))
    value = re.sub(r"\s+", "", value)
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Clean Vietnamese cross-check snapshot")
    parser.add_argument("output", type=Path)
    parser.add_argument("--official-snapshot", type=Path, required=True)
    parser.add_argument("--official-gazette-snapshot", type=Path, required=True)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    clean_payload = load_json(args.input)
    clean_articles = validate_clean_articles(clean_payload, INSTRUMENT_ID, 42)
    clean_forms = validate_clean_forms(clean_payload, FORM_NUMBERS)
    official_payload = load_json(args.official_snapshot)
    article_pages = official_article_page_ranges(
        official_payload,
        instrument_id=INSTRUMENT_ID,
        expected_pdf_hash=PDF_SHA256,
        expected_articles=42,
        body_last_page=37,
    )
    validate_form_pages(official_payload, FORM_START_PAGES)

    gazette_payload = load_json(args.official_gazette_snapshot)
    if (
        gazette_payload.get("instrumentId") != INSTRUMENT_ID
        or gazette_payload.get("sourceRole")
        != "official-gazette-searchable-text-verification"
        or gazette_payload.get("sourceDocumentSha256") != GAZETTE_SHA256
    ):
        raise ValueError("Official Gazette snapshot is not the pinned Decree 356 publication")
    articles = gazette_payload.get("articles", [])
    forms = gazette_payload.get("forms", [])
    if [item.get("articleNumber") for item in articles] != [
        str(number) for number in range(1, 43)
    ]:
        raise ValueError("Official Gazette snapshot is not Articles 1..42")
    if [item.get("formNumber") for item in forms] != FORM_NUMBERS:
        raise ValueError("Official Gazette snapshot does not contain all 13 forms")
    for clean_article, article in zip(clean_articles, articles):
        paragraphs = article.get("paragraphs")
        if not isinstance(paragraphs, list) or len(paragraphs) < 2:
            raise ValueError(
                f"Official Gazette Article {article.get('articleNumber')} has no full text"
            )
        if compact_sha256(paragraphs) != article.get("compactTextSha256"):
            raise ValueError(
                f"Official Gazette Article {article['articleNumber']} failed its text hash"
            )
        if article.get("title") != clean_article.get("title"):
            raise ValueError(
                f"Article {article['articleNumber']} title differs across sources"
            )
    for clean_form, form in zip(clean_forms, forms):
        paragraphs = form.get("paragraphs")
        if not isinstance(paragraphs, list) or len(paragraphs) < 3:
            raise ValueError(f"Official Gazette form {form.get('formNumber')} has no full text")
        if compact_sha256(paragraphs) != form.get("compactTextSha256"):
            raise ValueError(
                f"Official Gazette form {form['formNumber']} failed its text hash"
            )
        if form.get("title") != clean_form.get("title"):
            raise ValueError(f"Form {form['formNumber']} title differs across sources")

    joined = "\n".join(
        paragraph for article in articles for paragraph in article["paragraphs"]
    )
    for anchor in [
        "Điều 10. Bảo vệ dữ liệu cá nhân trong hệ thống trí tuệ nhân tạo, vũ trụ ảo",
        "Điều 17. Chuyển dữ liệu cá nhân xuyên biên giới",
        "Điều 29. Thông báo vi phạm đối với dữ liệu vị trí cá nhân và dữ liệu sinh trắc học",
        "Nghị định số 13/2023/NĐ-CP ngày 17 tháng 4 năm 2023 của Chính phủ về bảo vệ dữ liệu cá nhân hết hiệu lực",
    ]:
        if anchor not in joined:
            raise ValueError(f"Decree 356 snapshot is missing verification anchor: {anchor}")

    source_version = {
        "officialTitle": (
            "Nghị định quy định chi tiết một số điều và biện pháp thi hành "
            "Luật Bảo vệ dữ liệu cá nhân"
        ),
        "instrumentNumber": "356/2025/NĐ-CP",
        "issuedOn": "2025-12-31",
        "effectiveFrom": "2026-01-01",
        "status": "Còn hiệu lực",
        "statusAsOf": args.retrieved_on,
        "versionNote": (
            "Current implementing Decree verified against the signed Government "
            "publication and searchable official Gazette. Article 42(2) expressly "
            "ended the effect of Decree 13/2023/NĐ-CP when this Decree entered into force."
        ),
    }

    records: list[dict] = []
    for clean_article, article in zip(clean_articles, articles):
        number = int(article["articleNumber"])
        record = build_text_record(
            record_id=f"vn-decree-356-2025-art-{number}",
            instrument_id=INSTRUMENT_ID,
            article_number=str(number),
            label=f"Điều {number}",
            original_title=article["heading"],
            title=article["title"],
            chapter=chapter(clean_article["chapter"]),
            section=None,
            paragraphs=article["paragraphs"],
            source=SOURCE,
            canonical_source=CANONICAL_SOURCE,
            status_source=STATUS_SOURCE,
            official_html_source=OFFICIAL_HTML,
            transcription_source=TRANSCRIPTION_SOURCE,
            source_label="Government signed scan and official Gazette — exact Vietnamese text",
            retrieved_on=args.retrieved_on,
            effective_from="2026-01-01",
            legal_effect_status="in-force",
            source_version=source_version,
            summary=f"Điều {number}: {article['title']}. Toàn văn tiếng Việt chính thức được lưu đầy đủ.",
            source_page_range=article_pages[number],
        )
        record["unitType"] = "article"
        record["signedSource"] = SOURCE
        record["officialGazetteSource"] = GAZETTE_SOURCE
        record["sourcePageRangeDocument"] = SOURCE
        record["officialGazetteSourceLineRange"] = article["sourceLineRange"]
        record["transcriptionMethod"] = (
            "Every non-whitespace character is matched to the searchable official "
            "Gazette. The clean secondary page supplies paragraph boundaries only; "
            "all identified differences were replaced with the official Gazette wording."
        )
        if number == 42:
            record["legalEffect"] = {
                "affectedInstrument": "vn-decree-13-2023",
                "effect": "repeals-in-full",
                "effectiveFrom": "2026-01-01",
                "affectedText": "Nghị định số 13/2023/NĐ-CP",
                "source": GAZETTE_SOURCE,
            }
        records.append(record)

    appendix = {
        "id": f"{INSTRUMENT_ID}-appendix",
        "number": "Appendix",
        "label": "Phụ lục",
        "title": "DANH MỤC HỒ SƠ VÀ BIỂU MẪU",
    }
    form_ranges = form_page_ranges()
    for form in forms:
        number = form["formNumber"]
        record = build_text_record(
            record_id=f"vn-decree-356-2025-form-{number}",
            instrument_id=INSTRUMENT_ID,
            article_number=f"Form {number}",
            label=f"Mẫu số {number}",
            original_title=f"{form['heading']}: {form['title']}",
            title=form["title"],
            chapter=appendix,
            section=None,
            paragraphs=form["paragraphs"],
            source=SOURCE,
            canonical_source=CANONICAL_SOURCE,
            status_source=STATUS_SOURCE,
            official_html_source=OFFICIAL_HTML,
            transcription_source=TRANSCRIPTION_SOURCE,
            source_label="Government signed Appendix and official Gazette — exact Vietnamese text",
            retrieved_on=args.retrieved_on,
            effective_from="2026-01-01",
            legal_effect_status="in-force",
            source_version=source_version,
            summary=f"Mẫu số {number}: {form['title']}. Nội dung biểu mẫu được lưu đầy đủ.",
            source_page_range=form_ranges[number],
        )
        record["unitType"] = "appendix-form"
        record["formNumber"] = number
        record["signedSource"] = SOURCE
        record["officialGazetteSource"] = GAZETTE_SOURCE
        record["sourcePageRangeDocument"] = SOURCE
        record["officialGazetteSourceLineRange"] = form["sourceLineRange"]
        record["transcriptionMethod"] = (
            "Text is taken directly from the searchable official Gazette in PDF "
            "reading order. Table geometry is linearized without changing or adding text."
        )
        records.append(record)

    if len(records) != 55:
        raise ValueError(f"Expected 42 Articles plus 13 forms, got {len(records)} units")
    write_json(args.output, records)
    print(f"Generated {len(records)} Decree 356 units at {args.output}")


if __name__ == "__main__":
    main()
