#!/usr/bin/env python3
"""Generate the complete historical Decree 13/2023 corpus, marked repealed."""

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


INSTRUMENT_ID = "vn-decree-13-2023"
SIGNED_SOURCE = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/4/13nd.signed.pdf"
OFFICIAL_HTML = (
    "https://xaydungchinhsach.chinhphu.vn/"
    "toan-van-nghi-dinh-13-2023-nd-cp-bao-ve-du-lieu-ca-nhan-"
    "119230516104357809.htm"
)
CANONICAL_SOURCE = (
    "https://vanban.chinhphu.vn/?classid=1&docid=207759&pageid=27160&typegroupid=4"
)
LAGGING_REGISTRY_SOURCE = (
    "https://vbpl.vn/TW/Pages/ivbpq-lichsu.aspx?ItemID=161106&do=word"
)
REPEAL_SOURCE = (
    "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf"
)
TRANSCRIPTION_SOURCE = (
    "https://hethongphapluat.com/nghi-dinh-13-2023-nd-cp-"
    "ve-bao-ve-du-lieu-ca-nhan.html"
)
PDF_SHA256 = "d5d2e1648e5f8a9840e654c29b23f7654db3dac5c2b7efc75d924d2f870b2f01"
GAZETTE_SOURCE = (
    "https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2023/4/39228/"
    "44543-1-2023685-68613-2023-nd-cp.pdf"
)
GAZETTE_SHA256 = "5b026143b56779199603a164260cc76533a816b9c851a4c769e16a55ef7d6e6f"
FORM_NUMBERS = ["01", "02", "03", "04", "05", "06"]
FORM_START_PAGES = {"01": 30, "02": 31, "03": 32, "04": 34, "05": 36, "06": 38}


def structure(value: dict, kind: str) -> dict:
    number = str(value["number"])
    return {
        "id": f"{INSTRUMENT_ID}-{kind}-{number.casefold()}",
        "number": number,
        "label": value["label"],
        "title": value["title"],
    }


def form_page_ranges() -> dict[str, dict[str, int]]:
    ranges: dict[str, dict[str, int]] = {}
    for index, number in enumerate(FORM_NUMBERS):
        next_page = (
            FORM_START_PAGES[FORM_NUMBERS[index + 1]]
            if index + 1 < len(FORM_NUMBERS)
            else 40
        )
        ranges[number] = {"start": FORM_START_PAGES[number], "end": next_page - 1}
    return ranges


def compact_sha256(paragraphs: list[str]) -> str:
    value = unicodedata.normalize("NFC", "\n".join(paragraphs))
    value = re.sub(r"\s+", "", value)
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def mark_historical(record: dict) -> None:
    record["repealedFrom"] = "2026-01-01"
    record["historicalEffectivePeriod"] = {
        "from": "2023-07-01",
        "through": "2025-12-31",
    }
    record["controllingRepeal"] = {
        "instrument": "Nghị định số 356/2025/NĐ-CP",
        "provision": "Điều 42 khoản 2",
        "effectiveFrom": "2026-01-01",
        "source": REPEAL_SOURCE,
    }
    record["registryStatusSource"] = LAGGING_REGISTRY_SOURCE
    record["statusDiscrepancy"] = (
        "The older VBPL history page still displayed 'Còn hiệu lực' when reviewed. "
        "The later, controlling Article 42(2) of Decree 356/2025 expressly ends this "
        "Decree's effect from 1 January 2026."
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Official Government HTML Article snapshot")
    parser.add_argument("output", type=Path)
    parser.add_argument("--crosscheck-snapshot", type=Path, required=True)
    parser.add_argument("--official-ocr-snapshot", type=Path, required=True)
    parser.add_argument("--official-gazette-snapshot", type=Path, required=True)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    official_html_payload = load_json(args.input)
    official_html_articles = validate_clean_articles(
        official_html_payload, INSTRUMENT_ID, 44
    )
    if official_html_payload.get("sourceRole") != "official-government-html-article-text":
        raise ValueError("Article input is not the official Government HTML snapshot")

    crosscheck_payload = load_json(args.crosscheck_snapshot)
    crosscheck_articles = validate_clean_articles(crosscheck_payload, INSTRUMENT_ID, 44)
    clean_forms = validate_clean_forms(crosscheck_payload, FORM_NUMBERS)
    for official, secondary in zip(official_html_articles, crosscheck_articles):
        if official["heading"] != secondary["heading"]:
            raise ValueError(
                f"Article {official['articleNumber']} heading differs across sources"
            )

    gazette_payload = load_json(args.official_gazette_snapshot)
    if (
        gazette_payload.get("instrumentId") != INSTRUMENT_ID
        or gazette_payload.get("sourceRole")
        != "official-gazette-searchable-text-verification"
        or gazette_payload.get("sourceDocumentSha256") != GAZETTE_SHA256
    ):
        raise ValueError("Official Gazette snapshot is not the pinned Decree 13 publication")
    articles = gazette_payload.get("articles", [])
    forms = gazette_payload.get("forms", [])
    if [item.get("articleNumber") for item in articles] != [
        str(number) for number in range(1, 45)
    ]:
        raise ValueError("Official Gazette snapshot is not Articles 1..44")
    if [item.get("formNumber") for item in forms] != FORM_NUMBERS:
        raise ValueError("Official Gazette snapshot does not contain all six forms")
    for article in articles:
        paragraphs = article.get("paragraphs")
        if not isinstance(paragraphs, list) or len(paragraphs) < 2:
            raise ValueError(
                f"Official Gazette Article {article.get('articleNumber')} has no full text"
            )
        if compact_sha256(paragraphs) != article.get("compactTextSha256"):
            raise ValueError(
                f"Official Gazette Article {article['articleNumber']} failed its text hash"
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

    official_ocr_payload = load_json(args.official_ocr_snapshot)
    article_pages = official_article_page_ranges(
        official_ocr_payload,
        instrument_id=INSTRUMENT_ID,
        expected_pdf_hash=PDF_SHA256,
        expected_articles=44,
        body_last_page=28,
    )
    validate_form_pages(official_ocr_payload, FORM_START_PAGES)

    joined = "\n".join(
        paragraph for article in articles for paragraph in article["paragraphs"]
    )
    for anchor in [
        "Điều 9. Quyền của chủ thể dữ liệu",
        "Điều 17. Xử lý dữ liệu cá nhân trong trường hợp không cần sự đồng ý",
        "chậm nhất 72 giờ sau khi xảy ra hành vi vi phạm",
        "Nghị định này có hiệu lực thi hành từ ngày 01 tháng 7 năm 2023",
    ]:
        if anchor not in joined:
            raise ValueError(f"Decree 13 snapshot is missing verification anchor: {anchor}")

    source_version = {
        "officialTitle": "Nghị định về bảo vệ dữ liệu cá nhân",
        "instrumentNumber": "13/2023/NĐ-CP",
        "issuedOn": "2023-04-17",
        "effectiveFrom": "2023-07-01",
        "repealedFrom": "2026-01-01",
        "status": "Hết hiệu lực toàn bộ",
        "statusAsOf": args.retrieved_on,
        "versionNote": (
            "Historical text verified against the signed Government publication, "
            "official Government HTML and searchable official Gazette. Article 42(2) "
            "of Decree 356/2025/NĐ-CP expressly terminated this Decree from 1 January 2026."
        ),
    }

    records: list[dict] = []
    for article, crosscheck in zip(articles, crosscheck_articles):
        number = int(article["articleNumber"])
        section = (
            structure(crosscheck["section"], "section")
            if crosscheck.get("section")
            else None
        )
        record = build_text_record(
            record_id=f"vn-decree-13-2023-art-{number}",
            instrument_id=INSTRUMENT_ID,
            article_number=str(number),
            label=f"Điều {number}",
            original_title=article["heading"],
            title=article["title"],
            chapter=structure(crosscheck["chapter"], "chapter"),
            section=section,
            paragraphs=article["paragraphs"],
            source=SIGNED_SOURCE,
            canonical_source=CANONICAL_SOURCE,
            status_source=REPEAL_SOURCE,
            official_html_source=OFFICIAL_HTML,
            transcription_source=None,
            source_label="Government signed scan and official Gazette — exact historical Vietnamese text",
            retrieved_on=args.retrieved_on,
            effective_from="2023-07-01",
            legal_effect_status="repealed",
            source_version=source_version,
            summary=f"Điều {number}: {article['title']}. Văn bản lịch sử; đã hết hiệu lực từ 01-01-2026.",
            source_page_range=article_pages[number],
        )
        record["unitType"] = "article"
        record["signedSource"] = SIGNED_SOURCE
        record["officialGazetteSource"] = GAZETTE_SOURCE
        record["sourcePageRangeDocument"] = SIGNED_SOURCE
        record["officialGazetteSourceLineRange"] = article["sourceLineRange"]
        record["transcriptionMethod"] = (
            "Every non-whitespace character is matched to the searchable official "
            "Gazette. The official Government HTML supplies paragraph boundaries; "
            "all identified differences are resolved to Gazette wording."
        )
        mark_historical(record)
        records.append(record)

    appendix = {
        "id": f"{INSTRUMENT_ID}-appendix",
        "number": "Appendix",
        "label": "Phụ lục",
        "title": "BIỂU MẪU KÈM THEO NGHỊ ĐỊNH SỐ 13/2023/NĐ-CP",
    }
    form_ranges = form_page_ranges()
    for form in forms:
        number = form["formNumber"]
        record = build_text_record(
            record_id=f"vn-decree-13-2023-form-{number}",
            instrument_id=INSTRUMENT_ID,
            article_number=f"Form {number}",
            label=f"Mẫu số {number}",
            original_title=f"{form['heading']}: {form['title']}",
            title=form["title"],
            chapter=appendix,
            section=None,
            paragraphs=form["paragraphs"],
            source=SIGNED_SOURCE,
            canonical_source=CANONICAL_SOURCE,
            status_source=REPEAL_SOURCE,
            official_html_source=None,
            transcription_source=None,
            source_label="Government signed Appendix and official Gazette — exact historical Vietnamese text",
            retrieved_on=args.retrieved_on,
            effective_from="2023-07-01",
            legal_effect_status="repealed",
            source_version=source_version,
            summary=f"Mẫu số {number}: {form['title']}. Biểu mẫu lịch sử; đã hết hiệu lực từ 01-01-2026.",
            source_page_range=form_ranges[number],
        )
        record["unitType"] = "appendix-form"
        record["formNumber"] = number
        record["signedSource"] = SIGNED_SOURCE
        record["officialGazetteSource"] = GAZETTE_SOURCE
        record["sourcePageRangeDocument"] = SIGNED_SOURCE
        record["officialGazetteSourceLineRange"] = form["sourceLineRange"]
        record["transcriptionSource"] = TRANSCRIPTION_SOURCE
        record["transcriptionMethod"] = (
            "Text is taken directly from the searchable official Gazette in PDF "
            "reading order. Table geometry is linearized without changing or adding text."
        )
        mark_historical(record)
        records.append(record)

    if len(records) != 50:
        raise ValueError(f"Expected 44 Articles plus 6 forms, got {len(records)} units")
    write_json(args.output, records)
    print(f"Generated {len(records)} historical Decree 13 units at {args.output}")


if __name__ == "__main__":
    main()
