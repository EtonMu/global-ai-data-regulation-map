#!/usr/bin/env python3
"""Generate all 39 Articles of Vietnam's 2025 Personal Data Protection Law."""

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
    write_json,
)


INSTRUMENT_ID = "vn-personal-data-protection-law-2025"
SOURCE = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/91qh.signed.pdf"
CANONICAL_SOURCE = (
    "https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3"
)
STATUS_SOURCE = "https://vbpl.vn/tw/Pages/vbpq-thuoctinh.aspx?ItemID=179252"
OFFICIAL_PUBLICATION = (
    "https://mps.gov.vn/chinh-sach-phap-luat/co-so-du-lieu-van-ban/"
    "luat-bao-ve-du-lieu-ca-nhan-1753688803"
)
TRANSCRIPTION_SOURCE = (
    "https://thuviennhadat.vn/van-ban-phap-luat-viet-nam/"
    "luat-bao-ve-du-lieu-ca-nhan-2025-so-91-2025-qh15-625628.html"
)
PDF_SHA256 = "c3b87f994cedcedb69d38c590dcca2bb7700aab65e518a2a3a5ffbf22048b9ee"
GAZETTE_SOURCE = (
    "https://congbaocdn.chinhphu.vn/CongBaoCP/CongBao/2025/7/"
    "45574/57723-1-971-972.pdf"
)
GAZETTE_SHA256 = "abf363a09236d032df97e7b629ee2c0368cf2c8972262f2eb10eac5b587b2d2e"


def structure(value: dict, kind: str) -> dict:
    number = str(value["number"])
    slug = number.casefold()
    return {
        "id": f"{INSTRUMENT_ID}-{kind}-{slug}",
        "number": number,
        "label": value["label"],
        "title": value["title"],
    }


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
    articles = validate_clean_articles(clean_payload, INSTRUMENT_ID, 39)
    official_payload = load_json(args.official_snapshot)
    page_ranges = official_article_page_ranges(
        official_payload,
        instrument_id=INSTRUMENT_ID,
        expected_pdf_hash=PDF_SHA256,
        expected_articles=39,
        body_last_page=23,
    )
    gazette_payload = load_json(args.official_gazette_snapshot)
    if (
        gazette_payload.get("instrumentId") != INSTRUMENT_ID
        or gazette_payload.get("sourceRole")
        != "official-gazette-searchable-text-verification"
        or gazette_payload.get("sourceDocumentSha256") != GAZETTE_SHA256
    ):
        raise ValueError("Official Gazette snapshot is not the pinned Law publication")
    gazette_articles = gazette_payload.get("articles", [])
    if [item.get("articleNumber") for item in gazette_articles] != [
        str(number) for number in range(1, 40)
    ]:
        raise ValueError("Official Gazette snapshot is not Articles 1..39")
    for article, gazette_article in zip(articles, gazette_articles):
        if compact_sha256(article["paragraphs"]) != gazette_article.get(
            "compactTextSha256"
        ):
            raise ValueError(
                f"Article {article['articleNumber']} differs from official Gazette text"
            )

    joined = "\n".join(
        paragraph for article in articles for paragraph in article["paragraphs"]
    )
    for anchor in [
        "Điều 4. Quyền và nghĩa vụ của chủ thể dữ liệu cá nhân",
        "Điều 20. Chuyển dữ liệu cá nhân xuyên biên giới",
        "Điều 30. Bảo vệ dữ liệu cá nhân trong xử lý dữ liệu lớn, trí tuệ nhân tạo",
        "Luật này có hiệu lực thi hành từ ngày 01 tháng 01 năm 2026",
    ]:
        if anchor not in joined:
            raise ValueError(f"Law snapshot is missing verification anchor: {anchor}")

    source_version = {
        "officialTitle": "Luật Bảo vệ dữ liệu cá nhân",
        "instrumentNumber": "91/2025/QH15",
        "adoptedOn": "2025-06-26",
        "effectiveFrom": "2026-01-01",
        "status": "Còn hiệu lực",
        "statusAsOf": args.retrieved_on,
        "versionNote": (
            "Current enacted text verified against the signed National Assembly copy, "
            "the Government metadata record and the national legal database."
        ),
    }

    records: list[dict] = []
    for article, gazette_article in zip(articles, gazette_articles):
        number = int(article["articleNumber"])
        section = (
            structure(article["section"], "section")
            if article.get("section")
            else None
        )
        record = build_text_record(
            record_id=f"vn-pdpl-2025-art-{number}",
            instrument_id=INSTRUMENT_ID,
            article_number=str(number),
            label=f"Điều {number}",
            original_title=article["heading"],
            title=article["title"],
            chapter=structure(article["chapter"], "chapter"),
            section=section,
            paragraphs=article["paragraphs"],
            source=SOURCE,
            canonical_source=CANONICAL_SOURCE,
            status_source=STATUS_SOURCE,
            official_html_source=OFFICIAL_PUBLICATION,
            transcription_source=TRANSCRIPTION_SOURCE,
            source_label="National Assembly signed scan and official Gazette — exact Vietnamese text",
            retrieved_on=args.retrieved_on,
            effective_from="2026-01-01",
            legal_effect_status="in-force",
            source_version=source_version,
            summary=f"Điều {number}: {article['title']}. Toàn văn tiếng Việt chính thức được lưu đầy đủ.",
            source_page_range=page_ranges[number],
        )
        record["unitType"] = "article"
        record["officialGazetteSource"] = GAZETTE_SOURCE
        record["sourcePageRangeDocument"] = SOURCE
        record["officialGazetteSourceLineRange"] = {
            "start": gazette_article["lines"][0]["sourceLine"],
            "end": gazette_article["lines"][-1]["sourceLine"],
        }
        record["transcriptionMethod"] = (
            "The signed National Assembly scan controls. Every non-whitespace character "
            "in this Article was also matched to the searchable official Gazette text; "
            "the clean secondary page supplies paragraph boundaries only."
        )
        records.append(record)

    if len(records) != 39:
        raise ValueError(f"Expected 39 Law Articles, got {len(records)}")
    write_json(args.output, records)
    print(f"Generated {len(records)} Vietnamese PDPL Articles at {args.output}")


if __name__ == "__main__":
    main()
