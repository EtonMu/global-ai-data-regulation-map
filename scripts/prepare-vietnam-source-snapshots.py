#!/usr/bin/env python3
"""Build auditable Vietnamese legal-source snapshots from pinned source files.

The signed Government PDFs are image scans.  Their OCR snapshots are retained as
verification evidence, while clean transcriptions are stored separately and are
never represented as official publications.  Decree 13/2023 also has a complete
Government HTML publication, so its Article snapshot is captured independently.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from lxml import etree, html


LAW_ID = "vn-personal-data-protection-law-2025"
DECREE_356_ID = "vn-decree-356-2025"
DECREE_13_ID = "vn-decree-13-2023"

LAW_PDF = "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/91qh.signed.pdf"
LAW_GAZETTE_PDF = (
    "https://congbaocdn.chinhphu.vn/CongBaoCP/CongBao/2025/7/"
    "45574/57723-1-971-972.pdf"
)
DECREE_356_PDF = (
    "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf"
)
DECREE_356_GAZETTE_PDF = (
    "https://congbaocdn.chinhphu.vn/180507251028987904/2026/1/17/"
    "356signed-1768638052103952849513.pdf"
)
DECREE_13_PDF = (
    "https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/4/13nd.signed.pdf"
)
DECREE_13_GAZETTE_PDF = (
    "https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2023/4/39228/"
    "44543-1-2023685-68613-2023-nd-cp.pdf"
)

EXPECTED_PDF_HASHES = {
    LAW_ID: "c3b87f994cedcedb69d38c590dcca2bb7700aab65e518a2a3a5ffbf22048b9ee",
    DECREE_356_ID: "5b36a060c22db1df6c32b8c66da63b0c36571a1f7fa01765e719baac215b6c12",
    DECREE_13_ID: "d5d2e1648e5f8a9840e654c29b23f7654db3dac5c2b7efc75d924d2f870b2f01",
}

LAW_CHAPTER_TITLES = {
    "I": "NHỮNG QUY ĐỊNH CHUNG",
    "II": "BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "III": "LỰC LƯỢNG, ĐIỀU KIỆN BẢO ĐẢM BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "IV": "TRÁCH NHIỆM CỦA CƠ QUAN, TỔ CHỨC, CÁ NHÂN VỀ BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "V": "ĐIỀU KHOẢN THI HÀNH",
}

DECREE_356_CHAPTER_TITLES = {
    "I": "QUY ĐỊNH CHUNG",
    "II": "YÊU CẦU, ĐIỀU KIỆN BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "III": "HỒ SƠ, TRÌNH TỰ, THỦ TỤC VỀ DỮ LIỆU CÁ NHÂN",
    "IV": "THỰC THI CÔNG TÁC BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "V": "TỔ CHỨC THỰC HIỆN",
}

DECREE_13_CHAPTER_TITLES = {
    "I": "NHỮNG QUY ĐỊNH CHUNG",
    "II": "HOẠT ĐỘNG BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "III": "TRÁCH NHIỆM CỦA CƠ QUAN, TỔ CHỨC, CÁ NHÂN",
    "IV": "ĐIỀU KHOẢN THI HÀNH",
}

DECREE_13_SECTION_TITLES = {
    "1": "QUYỀN VÀ NGHĨA VỤ CỦA CHỦ THỂ DỮ LIỆU",
    "2": "BẢO VỆ DỮ LIỆU CÁ NHÂN TRONG QUÁ TRÌNH XỬ LÝ DỮ LIỆU CÁ NHÂN",
    "3": "ĐÁNH GIÁ TÁC ĐỘNG VÀ CHUYỂN DỮ LIỆU CÁ NHÂN RA NƯỚC NGOÀI",
    "4": "BIỆN PHÁP, ĐIỀU KIỆN BẢO ĐẢM BẢO VỆ DỮ LIỆU CÁ NHÂN",
}

FORMS_356 = ["01a", "01b", "02a", "02b", "03a", "03b", "04", "05", "06", "07", "08", "09", "10"]
FORMS_13 = ["01", "02", "03", "04", "05", "06"]

LAW_GAZETTE_SHA256 = (
    "abf363a09236d032df97e7b629ee2c0368cf2c8972262f2eb10eac5b587b2d2e"
)
DECREE_356_GAZETTE_SHA256 = (
    "f24747bf3c374b04901e66704423ea1e1a60460376c4d052d649ecc8a2a2f1eb"
)
DECREE_13_GAZETTE_SHA256 = (
    "5b026143b56779199603a164260cc76533a816b9c851a4c769e16a55ef7d6e6f"
)

LAW_GAZETTE_STRUCTURE_LINES = {
    "Chương II",
    "BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Mục 1",
    "BẢO VỆ DỮ LIỆU CÁ NHÂN TRONG QUÁ TRÌNH XỬ LÝ DỮ LIỆU CÁ NHÂN",
    "TRONG QUÁ TRÌNH XỬ LÝ DỮ LIỆU CÁ NHÂN",
    "Mục 2",
    "BẢO VỆ DỮ LIỆU CÁ NHÂN TRONG MỘT SỐ HOẠT ĐỘNG",
    "Chương III",
    "LỰC LƯỢNG, ĐIỀU KIỆN BẢO ĐẢM BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Chương IV",
    "TRÁCH NHIỆM CỦA CƠ QUAN, TỔ CHỨC, CÁ NHÂN",
    "VỀ BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Chương V",
    "ĐIỀU KHOẢN THI HÀNH",
}

DECREE_356_GAZETTE_STRUCTURE_LINES = {
    "Chương II",
    "YÊU CẦU, ĐIỀU KIỆN BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Chương III",
    "HỒ SƠ, TRÌNH TỰ, THỦ TỤC VỀ DỮ LIỆU CÁ NHÂN",
    "Chương IV",
    "THỰC THI CÔNG TÁC BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Chương V",
    "TỔ CHỨC THỰC HIỆN",
}

# The secondary clean page is useful for paragraph boundaries, but these exact
# differences were found by character-for-character comparison with the
# searchable official Gazette.  The official wording (including its spelling,
# capitalization and diacritic choices) controls and is retained verbatim.
DECREE_356_GAZETTE_CORRECTIONS = {
    6: [
        ("định dạng kiểm chứng được", "định dạng kiếm chứng được"),
    ],
    12: [
        ("phải được mã hóa ở trạng thái nghỉ", "phải được mã hoá ở trạng thái nghỉ"),
    ],
    17: [
        (
            "bên xử lý dữ liệu cá nhân và bên thứ ba thực hiện",
            "Bên Xử lý dữ liệu cá nhân và Bên thứ ba thực hiện",
        ),
    ],
    18: [
        (
            "đối với hồ sơ đánh giá tác động chuyển dữ liệu cá nhân xuyên biên giới đạt",
            "đối với Hồ sơ đánh giá tác động chuyển dữ liệu cá nhân xuyên biên giới đạt",
        ),
        (
            "hoàn thiện hồ sơ đánh giá tác động chuyển dữ liệu cá nhân xuyên biên giới trong",
            "hoàn thiện Hồ sơ đánh giá tác động chuyển dữ liệu cá nhân xuyên biên giới trong",
        ),
        (
            "cập nhật, bổ sung hồ sơ đánh giá tác động chuyển dữ liệu cá nhân",
            "cập nhật, bổ sung Hồ sơ đánh giá tác động chuyển dữ liệu cá nhân",
        ),
    ],
    19: [
        (
            "lập và lưu giữ hồ sơ đánh giá tác động xử lý dữ liệu cá nhân",
            "lập và lưu giữ Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân",
        ),
        (
            "đánh giá của cơ quan chuyên trách bảo vệ dữ liệu cá nhân và nộp",
            "đánh giá của Cơ quan chuyên trách bảo vệ dữ liệu cá nhân và nộp",
        ),
        (
            "đối với hồ sơ đánh giá tác động xử lý dữ liệu cá nhân đạt",
            "đối với Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân đạt",
        ),
        (
            "hoàn thiện hồ sơ đánh giá tác động xử lý dữ liệu cá nhân trong",
            "hoàn thiện Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân trong",
        ),
        (
            "cập nhật, bổ sung hồ sơ đánh giá tác động xử lý dữ liệu cá nhân",
            "cập nhật, bổ sung Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân",
        ),
    ],
    34: [
        ("vận hành cổng thông tin quốc gia", "vận hành Cổng thông tin quốc gia"),
    ],
    42: [
        (
            "đánh giá tác động chuyên, xử lý dữ liệu xuyên biên giới",
            "đánh giá tác động chuyển, xử lý dữ liệu xuyên biên giới",
        ),
    ],
}

DECREE_13_GAZETTE_STRUCTURE_LINES = {
    "Chương II",
    "HOẠT ĐỘNG BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Mục 1",
    "QUYỀN VÀ NGHĨA VỤ CỦA CHỦ THỂ DỮ LIỆU",
    "Mục 2",
    "BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "TRONG QUÁ TRÌNH XỬ LÝ DỮ LIỆU CÁ NHÂN",
    "Mục 3",
    "ĐÁNH GIÁ TÁC ĐỘNG",
    "VÀ CHUYỂN DỮ LIỆU CÁ NHÂN RA NƯỚC NGOÀI",
    "Mục 4",
    "BIỆN PHÁP, ĐIỀU KIỆN BẢO ĐẢM BẢO VỆ DỮ LIỆU CÁ NHÂN",
    "Chương III",
    "TRÁCH NHIỆM CỦA CƠ QUAN, TỔ CHỨC, CÁ NHÂN",
    "Chương IV",
    "ĐIỀU KHOẢN THI HÀNH",
}

DECREE_13_GAZETTE_CORRECTIONS = {
    24: [
        {
            "secondary": "thời gian dự kiến để xoá, hủy dữ liệu cá nhân",
            "official": "thời gian dự kiến để xóa, hủy dữ liệu cá nhân",
            "occurrences": 2,
        },
    ],
    27: [
        {
            "secondary": (
                "trước khi xử lý, xoá không thể khôi phục được hoặc huỷ các thiết bị"
            ),
            "official": (
                "trước khi xử lý, xóa không thể khôi phục được hoặc hủy các thiết bị"
            ),
            "occurrences": 1,
        },
    ],
    37: [
        {
            "secondary": "trực thuộc trung ương",
            "official": "trực thuộc Trung ương",
            "occurrences": 1,
        },
    ],
    44: [
        {
            "secondary": "trực thuộc trung ương",
            "official": "trực thuộc Trung ương",
            "occurrences": 1,
        },
    ],
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFC", value.replace("\u00a0", " "))
    return re.sub(r"\s+", " ", value).strip()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def parse_document(path: Path):
    return html.fromstring(path.read_bytes())


def named_anchors(element) -> list[str]:
    return [
        str(anchor.get("name"))
        for anchor in element.xpath(".//a[@name]")
        if anchor.get("name")
    ]


def build_ocr_snapshot(
    *,
    instrument_id: str,
    source_url: str,
    pdf_path: Path,
    ocr_dir: Path,
    expected_pages: int,
    official_metadata_url: str,
    official_status_url: str,
    retrieved_on: str,
) -> dict:
    document_hash = sha256_file(pdf_path)
    expected_hash = EXPECTED_PDF_HASHES[instrument_id]
    if document_hash != expected_hash:
        raise ValueError(
            f"{instrument_id}: signed PDF hash changed: {document_hash} != {expected_hash}"
        )

    page_files = sorted(
        ocr_dir.glob("page-*.txt"),
        key=lambda item: int(re.search(r"(\d+)$", item.stem).group(1)),
    )
    if len(page_files) != expected_pages:
        raise ValueError(
            f"{instrument_id}: expected {expected_pages} OCR pages, got {len(page_files)}"
        )

    lines: list[dict] = []
    source_line = 1
    for page_number, page_path in enumerate(page_files, 1):
        for page_line, raw in enumerate(
            page_path.read_text(encoding="utf-8").splitlines(), 1
        ):
            text = normalize(raw)
            if not text:
                continue
            lines.append(
                {
                    "sourceLine": source_line,
                    "page": page_number,
                    "pageLine": page_line,
                    "text": text,
                }
            )
            source_line += 1

    return {
        "instrumentId": instrument_id,
        "source": source_url,
        "sourceRole": "official-signed-scan-ocr-verification",
        "officialMetadataUrl": official_metadata_url,
        "officialStatusUrl": official_status_url,
        "retrievedOn": retrieved_on,
        "sourceDocumentSha256": document_hash,
        "sourceDocumentPageCount": expected_pages,
        "ocr": {
            "engine": "Tesseract OCR",
            "languages": "vie+eng",
            "pageSegmentationMode": 6,
            "purpose": "Verification against the signed Government scan, not controlling transcription",
            "qualityDisclosure": (
                "The signed source is image-only. OCR retains page and line provenance "
                "and may contain recognition errors; the signed scan controls."
            ),
        },
        "lines": lines,
    }


def parse_law_crosscheck(path: Path, retrieved_on: str) -> dict:
    document = parse_document(path)
    anchors = document.xpath("//a[@name='dieu_1']")
    if len(anchors) < 1:
        raise ValueError("Law cross-check does not contain Article 1")
    # The first occurrence is the Vietnamese main-body transcription.  Later
    # occurrences are a non-official English rendering and a mobile duplicate.
    root = anchors[0].xpath("ancestor::div[1]")[0]
    paragraphs = root.xpath("./p")

    chapter: dict | None = None
    section: dict | None = None
    contexts: dict[int, tuple[dict, dict | None]] = {}
    starts: list[tuple[int, int]] = []
    structural_indexes: set[int] = set()

    for index, paragraph in enumerate(paragraphs):
        names = named_anchors(paragraph)
        chapter_name = next(
            (name for name in names if re.fullmatch(r"chuong_\d+", name)), None
        )
        if chapter_name:
            number = chapter_name.rsplit("_", 1)[1]
            label = normalize(paragraph.text_content())
            roman_match = re.fullmatch(r"Chương ([IVXLCDM]+)", label)
            if not roman_match:
                raise ValueError(f"Unexpected Law Chapter label: {label}")
            roman = roman_match.group(1)
            title = LAW_CHAPTER_TITLES[roman]
            chapter = {"number": number, "label": label, "title": title}
            section = None
            structural_indexes.add(index)
            continue

        if any(re.fullmatch(r"chuong_\d+_name", name) for name in names):
            structural_indexes.add(index)
            continue

        section_name = next(
            (name for name in names if re.fullmatch(r"muc_\d+_\d+", name)), None
        )
        if section_name:
            text = normalize(paragraph.text_content())
            match = re.fullmatch(r"Mục (\d+)\.\s*(.+)", text)
            if not match:
                raise ValueError(f"Unexpected Law section label: {text}")
            section = {
                "number": match.group(1),
                "label": f"Mục {match.group(1)}",
                "title": match.group(2),
            }
            structural_indexes.add(index)
            continue

        article_name = next(
            (name for name in names if re.fullmatch(r"dieu_\d+", name)), None
        )
        if article_name:
            number = int(article_name.rsplit("_", 1)[1])
            if chapter is None:
                raise ValueError(f"Law Article {number} has no Chapter")
            starts.append((index, number))
            contexts[number] = (dict(chapter), dict(section) if section else None)

    if [number for _, number in starts] != list(range(1, 40)):
        raise ValueError(f"Law cross-check is not Articles 1..39: {starts}")

    articles: list[dict] = []
    for offset, (start, number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else len(paragraphs)
        values: list[str] = []
        source_indexes: list[int] = []
        for index in range(start, end):
            if index in structural_indexes:
                continue
            value = normalize(paragraphs[index].text_content())
            if not value:
                continue
            if number == 39 and value.startswith("Luật này được Quốc hội"):
                break
            values.append(value)
            source_indexes.append(index + 1)
        heading_match = re.fullmatch(rf"Điều {number}\.\s*(.+)", values[0])
        if not heading_match or len(values) < 2:
            raise ValueError(f"Law Article {number} is malformed: {values[:2]}")
        chapter_value, section_value = contexts[number]
        articles.append(
            {
                "articleNumber": str(number),
                "heading": values[0],
                "title": heading_match.group(1),
                "chapter": chapter_value,
                "section": section_value,
                "paragraphs": values,
                "sourceParagraphRange": {
                    "start": min(source_indexes),
                    "end": max(source_indexes),
                },
            }
        )

    return {
        "instrumentId": LAW_ID,
        "source": (
            "https://thuviennhadat.vn/van-ban-phap-luat-viet-nam/"
            "luat-bao-ve-du-lieu-ca-nhan-2025-so-91-2025-qh15-625628.html"
        ),
        "sourceRole": "secondary-clean-transcription-cross-check",
        "controllingOfficialSources": [
            LAW_PDF,
            "https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3",
            "https://mps.gov.vn/chinh-sach-phap-luat/co-so-du-lieu-van-ban/luat-bao-ve-du-lieu-ca-nhan-1753688803",
            "https://vbpl.vn/tw/Pages/vbpq-thuoctinh.aspx?ItemID=179252",
        ],
        "retrievedOn": retrieved_on,
        "extractionScope": (
            "First Vietnamese main-body occurrence only, Articles 1-39. The page's "
            "English rendering and duplicate mobile copy are deliberately excluded."
        ),
        "authorityDisclosure": (
            "The signed National Assembly PDF controls. This transcription is used "
            "only to restore clean list markers and diacritics after scan verification."
        ),
        "articles": articles,
    }


def compact_text(value: str) -> str:
    return re.sub(r"\s+", "", normalize(value))


def parse_law_gazette(
    pdf_path: Path, raw_text_path: Path, clean_articles: list[dict], retrieved_on: str
) -> dict:
    document_hash = sha256_file(pdf_path)
    if document_hash != LAW_GAZETTE_SHA256:
        raise ValueError(
            f"Official Gazette PDF hash changed: {document_hash} != {LAW_GAZETTE_SHA256}"
        )
    lines = raw_text_path.read_text(encoding="utf-8").splitlines()
    starts: list[tuple[int, int]] = []
    for index, raw in enumerate(lines):
        if index <= 350:
            continue
        match = re.match(r"Điều (\d+)\.", raw)
        if not match:
            continue
        number = int(match.group(1))
        if not starts and number == 1:
            starts.append((index, number))
        elif starts and number == starts[-1][1] + 1 and number <= 39:
            starts.append((index, number))
        elif starts and starts[-1][1] == 39:
            break
    if [number for _, number in starts] != list(range(1, 40)):
        raise ValueError(f"Official Gazette did not yield Articles 1..39: {starts}")

    articles: list[dict] = []
    for offset, (start, number) in enumerate(starts):
        if offset + 1 < len(starts):
            end = starts[offset + 1][0]
        else:
            end = next(
                index
                for index in range(start + 1, len(lines))
                if lines[index].startswith("Luật này được Quốc hội")
            )
        article_lines: list[dict] = []
        for source_index in range(start, end):
            value = normalize(lines[source_index])
            if not value:
                continue
            if "CÔNG BÁO/Số 971 + 972/Ngày 24-7-2025" in value:
                continue
            if value in LAW_GAZETTE_STRUCTURE_LINES:
                continue
            if value.startswith(("Người ký:", "Email:", "Cơ quan:", "Thời gian ký:")):
                continue
            if number == 39 and value.endswith("./."):
                # ``/.`` is the conventional instrument-closing mark following
                # the final sentence, not part of Article 39's substantive text.
                value = value[:-2]
            article_lines.append({"sourceLine": source_index + 1, "text": value})
        official_compact = compact_text(
            "\n".join(item["text"] for item in article_lines)
        )
        clean_compact = compact_text("\n".join(clean_articles[number - 1]["paragraphs"]))
        if official_compact != clean_compact:
            raise ValueError(
                f"Article {number} clean transcription differs from official Gazette text"
            )
        articles.append(
            {
                "articleNumber": str(number),
                "lines": article_lines,
                "compactTextSha256": hashlib.sha256(
                    official_compact.encode("utf-8")
                ).hexdigest(),
            }
        )

    return {
        "instrumentId": LAW_ID,
        "source": LAW_GAZETTE_PDF,
        "sourceRole": "official-gazette-searchable-text-verification",
        "retrievedOn": retrieved_on,
        "sourceDocumentSha256": document_hash,
        "sourceDocumentPageCount": 96,
        "gazetteIssue": "Công Báo Nos. 971-972, 24 July 2025",
        "coverage": "Exact searchable Gazette wording for Articles 1-39",
        "extractionDisclosure": (
            "Gazette running headers, embedded digital-signature metadata, Chapter/Section "
            "headings between Articles, and the final instrument-closing mark are excluded "
            "from Article comparison. Every remaining non-whitespace character exactly "
            "matches the clean Article transcription."
        ),
        "articles": articles,
    }


def parse_decree_356_gazette(
    pdf_path: Path,
    raw_text_path: Path,
    clean_payload: dict,
    retrieved_on: str,
) -> dict:
    document_hash = sha256_file(pdf_path)
    if document_hash != DECREE_356_GAZETTE_SHA256:
        raise ValueError(
            "Decree 356 official Gazette PDF hash changed: "
            f"{document_hash} != {DECREE_356_GAZETTE_SHA256}"
        )

    clean_articles = clean_payload["articles"]
    clean_forms = clean_payload["forms"]
    lines = raw_text_path.read_text(encoding="utf-8").splitlines()

    def is_running_matter(value: str) -> bool:
        return value.startswith(
            (
                "CÔNG BÁO/Số 18/Ngày 18-01-2026",
                "Ký bởi:",
                "Cơ quan:",
                "Ngày ký:",
            )
        )

    starts: list[tuple[int, int]] = []
    for index, raw in enumerate(lines):
        match = re.match(r"Điều (\d+)\.", raw)
        if not match:
            continue
        number = int(match.group(1))
        if not starts and number == 1:
            starts.append((index, number))
        elif starts and number == starts[-1][1] + 1 and number <= 42:
            starts.append((index, number))
        elif starts and starts[-1][1] == 42:
            break
    if [number for _, number in starts] != list(range(1, 43)):
        raise ValueError(
            f"Decree 356 Gazette did not yield Articles 1..42: {starts}"
        )

    article_end = next(
        index
        for index in range(starts[-1][0] + 1, len(lines))
        if normalize(lines[index]).startswith("TM. CHÍNH PHỦ")
    )
    articles: list[dict] = []
    for offset, (start, number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else article_end
        official_lines: list[dict] = []
        for source_index in range(start, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            if value in DECREE_356_GAZETTE_STRUCTURE_LINES:
                continue
            official_lines.append({"sourceLine": source_index + 1, "text": value})

        paragraphs = list(clean_articles[number - 1]["paragraphs"])
        applied_corrections: list[dict] = []
        for secondary_text, official_text in DECREE_356_GAZETTE_CORRECTIONS.get(
            number, []
        ):
            occurrences = sum(
                paragraph.count(secondary_text) for paragraph in paragraphs
            )
            if occurrences != 1:
                raise ValueError(
                    f"Article {number}: expected one occurrence of secondary text "
                    f"{secondary_text!r}, found {occurrences}"
                )
            paragraphs = [
                paragraph.replace(secondary_text, official_text)
                for paragraph in paragraphs
            ]
            applied_corrections.append(
                {
                    "secondaryTranscription": secondary_text,
                    "officialGazetteText": official_text,
                }
            )

        official_compact = compact_text(
            "\n".join(item["text"] for item in official_lines)
        )
        paragraph_compact = compact_text("\n".join(paragraphs))
        if official_compact != paragraph_compact:
            raise ValueError(
                f"Decree 356 Article {number} paragraph transcription differs "
                "from official Gazette text"
            )
        articles.append(
            {
                "articleNumber": str(number),
                "heading": paragraphs[0],
                "title": clean_articles[number - 1]["title"],
                "paragraphs": paragraphs,
                "lines": official_lines,
                "sourceLineRange": {
                    "start": official_lines[0]["sourceLine"],
                    "end": official_lines[-1]["sourceLine"],
                },
                "compactTextSha256": hashlib.sha256(
                    official_compact.encode("utf-8")
                ).hexdigest(),
                "secondaryTranscriptionCorrections": applied_corrections,
            }
        )

    actual_form_starts: list[tuple[int, str]] = []
    for index in range(article_end, len(lines)):
        match = re.fullmatch(
            r"Mẫu(?: số)?\s+([0-9]+[a-z]?)", normalize(lines[index])
        )
        if match and match.group(1) in FORMS_356:
            actual_form_starts.append((index, match.group(1)))
    if [number for _, number in actual_form_starts] != FORMS_356:
        raise ValueError(
            f"Unexpected Decree 356 Gazette form sequence: {actual_form_starts}"
        )

    first_actual_form = actual_form_starts[0][0]
    index_starts: list[tuple[int, str, str]] = []
    for index in range(article_end, first_actual_form):
        match = re.match(
            r"Mẫu số\s+([0-9]+[a-z]?)\s+(.+)", normalize(lines[index])
        )
        if match and match.group(1) in FORMS_356:
            index_starts.append((index, match.group(1), match.group(2)))
    if [number for _, number, _ in index_starts] != FORMS_356:
        raise ValueError(
            f"Unexpected Decree 356 Gazette Appendix index: {index_starts}"
        )

    official_titles: dict[str, str] = {}
    clean_titles = {form["formNumber"]: form["title"] for form in clean_forms}
    for offset, (start, number, first_line) in enumerate(index_starts):
        end = (
            index_starts[offset + 1][0]
            if offset + 1 < len(index_starts)
            else first_actual_form
        )
        title_lines = [first_line]
        for source_index in range(start + 1, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            title_lines.append(value)
        title = normalize(" ".join(title_lines))
        if title != clean_titles[number]:
            raise ValueError(
                f"Decree 356 form {number} title differs from official Gazette index: "
                f"{clean_titles[number]!r} != {title!r}"
            )
        official_titles[number] = title

    forms: list[dict] = []
    for offset, (start, number) in enumerate(actual_form_starts):
        end = (
            actual_form_starts[offset + 1][0]
            if offset + 1 < len(actual_form_starts)
            else len(lines)
        )
        official_lines: list[dict] = []
        for source_index in range(start, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            official_lines.append({"sourceLine": source_index + 1, "text": value})
        if len(official_lines) < 3:
            raise ValueError(f"Decree 356 Gazette form {number} has no full text")
        paragraphs = [item["text"] for item in official_lines]
        compact = compact_text("\n".join(paragraphs))
        forms.append(
            {
                "formNumber": number,
                "heading": paragraphs[0],
                "title": official_titles[number],
                "paragraphs": paragraphs,
                "lines": official_lines,
                "sourceLineRange": {
                    "start": official_lines[0]["sourceLine"],
                    "end": official_lines[-1]["sourceLine"],
                },
                "compactTextSha256": hashlib.sha256(
                    compact.encode("utf-8")
                ).hexdigest(),
            }
        )

    return {
        "instrumentId": DECREE_356_ID,
        "source": DECREE_356_GAZETTE_PDF,
        "officialGazetteLandingUrl": (
            "https://congbao.chinhphu.vn/van-ban/"
            "nghi-dinh-so-356-2025-nd-cp-468371.htm"
        ),
        "sourceRole": "official-gazette-searchable-text-verification",
        "retrievedOn": retrieved_on,
        "sourceDocumentSha256": document_hash,
        "sourceDocumentPageCount": 70,
        "gazetteIssue": "Công Báo No. 18, 18 January 2026",
        "coverage": "Exact searchable Gazette wording for Articles 1-42 and all 13 Appendix forms",
        "extractionDisclosure": (
            "Gazette running headers, embedded digital-signature metadata and "
            "Chapter headings between Articles are excluded. Article paragraph "
            "boundaries come from the clean cross-check, but every remaining "
            "non-whitespace character is matched to the official Gazette and all "
            "identified secondary transcription differences are corrected. Appendix "
            "forms are taken directly from the Gazette in PDF reading order; table "
            "geometry is linearized without changing or adding text."
        ),
        "articles": articles,
        "forms": forms,
    }


def parse_decree_13_gazette(
    pdf_path: Path,
    raw_text_path: Path,
    official_html_payload: dict,
    clean_payload: dict,
    retrieved_on: str,
) -> dict:
    document_hash = sha256_file(pdf_path)
    if document_hash != DECREE_13_GAZETTE_SHA256:
        raise ValueError(
            "Decree 13 official Gazette PDF hash changed: "
            f"{document_hash} != {DECREE_13_GAZETTE_SHA256}"
        )

    official_html_articles = official_html_payload["articles"]
    clean_forms = clean_payload["forms"]
    lines = raw_text_path.read_text(encoding="utf-8").splitlines()

    def is_running_matter(value: str) -> bool:
        return "CÔNG BÁO/Số 685 + 686/Ngày 30-4-2023" in value or value.startswith(
            ("Người ký:", "Email:", "Cơ quan:", "Thời gian ký:")
        )

    starts: list[tuple[int, int]] = []
    for index, raw in enumerate(lines):
        match = re.match(r"Điều (\d+)\.", normalize(raw))
        if not match:
            continue
        number = int(match.group(1))
        if not starts and number == 1:
            starts.append((index, number))
        elif starts and number == starts[-1][1] + 1 and number <= 44:
            starts.append((index, number))
        elif starts and starts[-1][1] == 44:
            break
    if [number for _, number in starts] != list(range(1, 45)):
        raise ValueError(f"Decree 13 Gazette did not yield Articles 1..44: {starts}")

    article_end = next(
        index
        for index in range(starts[-1][0] + 1, len(lines))
        if normalize(lines[index]).startswith("TM. CHÍNH PHỦ")
    )
    articles: list[dict] = []
    for offset, (start, number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else article_end
        official_lines: list[dict] = []
        for source_index in range(start, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            if value in DECREE_13_GAZETTE_STRUCTURE_LINES:
                continue
            if number == 44 and value.endswith("/."):
                value = value[:-2].rstrip()
            official_lines.append({"sourceLine": source_index + 1, "text": value})

        paragraphs = list(official_html_articles[number - 1]["paragraphs"])
        applied_corrections: list[dict] = []
        for correction in DECREE_13_GAZETTE_CORRECTIONS.get(number, []):
            secondary_text = correction["secondary"]
            official_text = correction["official"]
            expected_occurrences = correction["occurrences"]
            occurrences = sum(
                paragraph.count(secondary_text) for paragraph in paragraphs
            )
            if occurrences != expected_occurrences:
                raise ValueError(
                    f"Decree 13 Article {number}: expected {expected_occurrences} "
                    f"occurrence(s) of {secondary_text!r}, found {occurrences}"
                )
            paragraphs = [
                paragraph.replace(secondary_text, official_text)
                for paragraph in paragraphs
            ]
            applied_corrections.append(
                {
                    "officialGovernmentHtml": secondary_text,
                    "officialGazetteText": official_text,
                    "occurrences": occurrences,
                }
            )

        official_compact = compact_text(
            "\n".join(item["text"] for item in official_lines)
        )
        paragraph_compact = compact_text("\n".join(paragraphs))
        if official_compact != paragraph_compact:
            raise ValueError(
                f"Decree 13 Article {number} paragraph transcription differs "
                "from official Gazette text"
            )
        articles.append(
            {
                "articleNumber": str(number),
                "heading": paragraphs[0],
                "title": re.fullmatch(
                    rf"Điều {number}\.\s*(.+)", paragraphs[0]
                ).group(1),
                "paragraphs": paragraphs,
                "lines": official_lines,
                "sourceLineRange": {
                    "start": official_lines[0]["sourceLine"],
                    "end": official_lines[-1]["sourceLine"],
                },
                "compactTextSha256": hashlib.sha256(
                    official_compact.encode("utf-8")
                ).hexdigest(),
                "officialHtmlToGazetteCorrections": applied_corrections,
            }
        )

    actual_form_starts: list[tuple[int, str]] = []
    for index in range(article_end, len(lines)):
        match = re.fullmatch(r"Mẫu số\s+(\d+)", normalize(lines[index]))
        if match and match.group(1) in FORMS_13:
            actual_form_starts.append((index, match.group(1)))
    if [number for _, number in actual_form_starts] != FORMS_13:
        raise ValueError(
            f"Unexpected Decree 13 Gazette form sequence: {actual_form_starts}"
        )

    first_actual_form = actual_form_starts[0][0]
    index_starts: list[tuple[int, str, str]] = []
    for index in range(article_end, first_actual_form):
        match = re.match(r"Mẫu số\s+(\d+)\s+(.+)", normalize(lines[index]))
        if match and match.group(1) in FORMS_13:
            index_starts.append((index, match.group(1), match.group(2)))
    if [number for _, number, _ in index_starts] != FORMS_13:
        raise ValueError(
            f"Unexpected Decree 13 Gazette Appendix index: {index_starts}"
        )

    official_titles: dict[str, str] = {}
    clean_titles = {form["formNumber"]: form["title"] for form in clean_forms}
    for offset, (start, number, first_line) in enumerate(index_starts):
        end = (
            index_starts[offset + 1][0]
            if offset + 1 < len(index_starts)
            else first_actual_form
        )
        title_lines = [first_line]
        for source_index in range(start + 1, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            title_lines.append(value)
        title = normalize(" ".join(title_lines))
        if title != clean_titles[number]:
            raise ValueError(
                f"Decree 13 form {number} title differs from official Gazette index: "
                f"{clean_titles[number]!r} != {title!r}"
            )
        official_titles[number] = title

    forms: list[dict] = []
    for offset, (start, number) in enumerate(actual_form_starts):
        end = (
            actual_form_starts[offset + 1][0]
            if offset + 1 < len(actual_form_starts)
            else len(lines)
        )
        official_lines: list[dict] = []
        for source_index in range(start, end):
            value = normalize(lines[source_index])
            if not value or is_running_matter(value):
                continue
            official_lines.append({"sourceLine": source_index + 1, "text": value})
        if len(official_lines) < 3:
            raise ValueError(f"Decree 13 Gazette form {number} has no full text")
        paragraphs = [item["text"] for item in official_lines]
        compact = compact_text("\n".join(paragraphs))
        forms.append(
            {
                "formNumber": number,
                "heading": paragraphs[0],
                "title": official_titles[number],
                "paragraphs": paragraphs,
                "lines": official_lines,
                "sourceLineRange": {
                    "start": official_lines[0]["sourceLine"],
                    "end": official_lines[-1]["sourceLine"],
                },
                "compactTextSha256": hashlib.sha256(
                    compact.encode("utf-8")
                ).hexdigest(),
            }
        )

    return {
        "instrumentId": DECREE_13_ID,
        "source": DECREE_13_GAZETTE_PDF,
        "officialGazetteLandingUrl": (
            "https://congbao.chinhphu.vn/van-ban/"
            "nghi-dinh-so-13-2023-nd-cp-39228/44543.htm"
        ),
        "sourceRole": "official-gazette-searchable-text-verification",
        "retrievedOn": retrieved_on,
        "sourceDocumentSha256": document_hash,
        "sourceDocumentPageCount": 37,
        "gazetteIssue": "Công Báo Nos. 685-686, 30 April 2023",
        "coverage": "Exact searchable Gazette wording for Articles 1-44 and all six Appendix forms",
        "extractionDisclosure": (
            "Gazette running headers, structural Chapter/Section headings between "
            "Articles and the final instrument-closing mark are excluded. Article "
            "paragraph boundaries come from the official Government HTML publication, "
            "but every remaining non-whitespace character is matched to the official "
            "Gazette and all identified differences are corrected to Gazette wording. "
            "Appendix forms are taken directly from the Gazette in PDF reading order; "
            "table geometry is linearized without changing or adding text."
        ),
        "articles": articles,
        "forms": forms,
    }


def chapter_context(element, title_map: dict[str, str]) -> dict:
    chapters = element.xpath("ancestor::chuong[1]")
    if not chapters:
        raise ValueError("Provision has no Chapter ancestor")
    chapter = chapters[0]
    label = normalize(chapter.xpath("string(./p[1])"))
    match = re.fullmatch(r"Chương ([IVXLCDM]+)", label)
    if not match:
        raise ValueError(f"Unexpected Chapter label: {label}")
    roman = match.group(1)
    return {"number": roman, "label": label, "title": title_map[roman]}


def section_context(element) -> dict | None:
    sections = element.xpath("ancestor::muc[1]")
    if not sections:
        return None
    label_text = normalize(sections[0].xpath("string(./p[1])"))
    match = re.match(r"Mục\s+(\d+)", label_text)
    if not match:
        raise ValueError(f"Unexpected section label: {label_text}")
    number = match.group(1)
    return {
        "number": number,
        "label": f"Mục {number}",
        "title": DECREE_13_SECTION_TITLES[number],
    }


def form_table_rows(table) -> list[str]:
    values: list[str] = []
    for row in table.xpath(".//tr"):
        nearest_tables = row.xpath("ancestor::table[1]")
        if not nearest_tables or nearest_tables[0] is not table:
            continue
        cells = [
            normalize(cell.text_content())
            for cell in row.xpath("./th|./td")
        ]
        populated = [cell for cell in cells if cell]
        if populated:
            values.append(" | ".join(populated))
    if not values:
        fallback = normalize(table.text_content())
        if fallback:
            values.append(fallback)
    return values


def inner_statutory_container(document):
    tabs = document.xpath("//*[@id='tab_noi_dung_vb']")
    if len(tabs) != 1:
        raise ValueError("Expected exactly one statutory-content tab")
    candidates = [
        child
        for child in tabs[0]
        if isinstance(child.tag, str) and child.tag == "div"
    ]
    if not candidates:
        raise ValueError("Statutory-content tab has no inner container")
    return max(candidates, key=lambda item: len(normalize(item.text_content())))


def appendix_titles(container, expected_forms: list[str]) -> dict[str, str]:
    expected = set(expected_forms)
    for table in container.xpath("./table"):
        mapping: dict[str, str] = {}
        for row in table.xpath(".//tr"):
            cells = [normalize(cell.text_content()) for cell in row.xpath("./th|./td")]
            if len(cells) < 2:
                continue
            match = re.fullmatch(r"Mẫu số\s+([0-9]+[a-z]?)", cells[0])
            if match and match.group(1) in expected:
                mapping[match.group(1)] = cells[1]
        if set(mapping) == expected:
            return mapping
    raise ValueError(f"Could not recover Appendix index for forms {expected_forms}")


def parse_forms(container, expected_forms: list[str]) -> list[dict]:
    titles = appendix_titles(container, expected_forms)
    children = list(container)
    starts: list[tuple[int, str]] = []
    for index, child in enumerate(children):
        if not isinstance(child.tag, str) or child.tag != "p":
            continue
        value = normalize(child.text_content())
        match = re.fullmatch(r"Mẫu(?: số)?\s+([0-9]+[a-z]?)", value)
        if match and match.group(1) in expected_forms:
            starts.append((index, match.group(1)))
    if [form for _, form in starts] != expected_forms:
        raise ValueError(f"Unexpected actual Appendix form sequence: {starts}")

    forms: list[dict] = []
    for offset, (start, form_number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else len(children)
        paragraphs: list[str] = [f"Mẫu số {form_number}"]
        for child in children[start + 1 : end]:
            if not isinstance(child.tag, str):
                continue
            if child.tag == "table":
                paragraphs.extend(form_table_rows(child))
                continue
            value = normalize(child.text_content())
            if value:
                paragraphs.append(value)
        if len(paragraphs) < 3:
            raise ValueError(f"Appendix form {form_number} has no substantive content")
        forms.append(
            {
                "formNumber": form_number,
                "heading": f"Mẫu số {form_number}",
                "title": titles[form_number],
                "paragraphs": paragraphs,
                "sourceElementRange": {"start": start + 1, "end": end},
            }
        )
    return forms


def parse_decree_crosscheck(
    *,
    path: Path,
    instrument_id: str,
    source_url: str,
    official_sources: list[str],
    title_map: dict[str, str],
    expected_articles: int,
    expected_forms: list[str],
    retrieved_on: str,
) -> dict:
    document = parse_document(path)
    provisions = document.xpath("//dieu")
    if len(provisions) != expected_articles:
        raise ValueError(
            f"{instrument_id}: expected {expected_articles} Article elements, got {len(provisions)}"
        )

    articles: list[dict] = []
    for expected_number, provision in enumerate(provisions, 1):
        paragraphs = [
            normalize(item.text_content())
            for item in provision.xpath(".//p")
            if normalize(item.text_content())
        ]
        heading_match = re.fullmatch(
            rf"Điều {expected_number}\.\s*(.+)", paragraphs[0]
        )
        if not heading_match or len(paragraphs) < 2:
            raise ValueError(
                f"{instrument_id} Article {expected_number} is malformed: {paragraphs[:2]}"
            )
        articles.append(
            {
                "articleNumber": str(expected_number),
                "heading": paragraphs[0],
                "title": heading_match.group(1),
                "chapter": chapter_context(provision, title_map),
                "section": section_context(provision)
                if instrument_id == DECREE_13_ID
                else None,
                "paragraphs": paragraphs,
                "sourceElementPath": document.getroottree().getpath(provision),
            }
        )

    container = inner_statutory_container(document)
    forms = parse_forms(container, expected_forms)
    return {
        "instrumentId": instrument_id,
        "source": source_url,
        "sourceRole": "secondary-clean-transcription-cross-check",
        "controllingOfficialSources": official_sources,
        "retrievedOn": retrieved_on,
        "extractionScope": (
            f"Complete Vietnamese Articles 1-{expected_articles} and all "
            f"{len(expected_forms)} Appendix forms. Navigation, advertising, hidden "
            "site instructions and unrelated page content are excluded."
        ),
        "authorityDisclosure": (
            "The signed Government PDF and official Government/legal-database "
            "publications control. This clean page is a transcription cross-check only."
        ),
        "articles": articles,
        "forms": forms,
    }


def parse_decree_13_official_html(path: Path, retrieved_on: str) -> dict:
    # Decode explicitly because this Government page omits a reliable HTML
    # encoding declaration for lxml's byte-input detection.
    document = html.fromstring(path.read_text(encoding="utf-8"))
    headings = [
        element
        for element in document.xpath("//h4")
        if re.fullmatch(r"Điều\s+\d+\.\s*.+", normalize(element.text_content()))
    ]
    numbers = [
        int(re.match(r"Điều\s+(\d+)\.", normalize(element.text_content())).group(1))
        for element in headings
    ]
    if numbers != list(range(1, 45)):
        raise ValueError(f"Official Government HTML is not Articles 1..44: {numbers}")

    articles: list[dict] = []
    for expected_number, heading in enumerate(headings, 1):
        heading_text = normalize(heading.text_content())
        title = re.fullmatch(
            rf"Điều {expected_number}\.\s*(.+)", heading_text
        ).group(1)
        paragraphs = [heading_text]
        sibling = heading.getnext()
        while sibling is not None:
            if sibling.tag == "h4" and re.match(
                r"Điều\s+\d+\.", normalize(sibling.text_content())
            ):
                break
            if sibling.tag == "p":
                value = normalize(sibling.text_content())
                if value:
                    paragraphs.append(value)
            sibling = sibling.getnext()
        if len(paragraphs) < 2:
            raise ValueError(f"Official Government Article {expected_number} has no body")
        articles.append(
            {
                "articleNumber": str(expected_number),
                "heading": heading_text,
                "title": title,
                "paragraphs": paragraphs,
                "sourceElementPath": document.getroottree().getpath(heading),
            }
        )

    return {
        "instrumentId": DECREE_13_ID,
        "source": (
            "https://xaydungchinhsach.chinhphu.vn/"
            "toan-van-nghi-dinh-13-2023-nd-cp-bao-ve-du-lieu-ca-nhan-"
            "119230516104357809.htm"
        ),
        "sourceRole": "official-government-html-article-text",
        "retrievedOn": retrieved_on,
        "coverage": (
            "Complete Articles 1-44; wording is independently verified against the "
            "searchable official Gazette and signed scan. Appendix forms are verified "
            "separately from the official Gazette and signed scan."
        ),
        "articles": articles,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--law-pdf", type=Path, required=True)
    parser.add_argument("--law-ocr-dir", type=Path, required=True)
    parser.add_argument("--law-crosscheck-html", type=Path, required=True)
    parser.add_argument("--law-gazette-pdf", type=Path, required=True)
    parser.add_argument("--law-gazette-text", type=Path, required=True)
    parser.add_argument("--decree-356-pdf", type=Path, required=True)
    parser.add_argument("--decree-356-ocr-dir", type=Path, required=True)
    parser.add_argument("--decree-356-crosscheck-html", type=Path, required=True)
    parser.add_argument("--decree-356-gazette-pdf", type=Path, required=True)
    parser.add_argument("--decree-356-gazette-text", type=Path, required=True)
    parser.add_argument("--decree-13-pdf", type=Path, required=True)
    parser.add_argument("--decree-13-ocr-dir", type=Path, required=True)
    parser.add_argument("--decree-13-official-html", type=Path, required=True)
    parser.add_argument("--decree-13-crosscheck-html", type=Path, required=True)
    parser.add_argument("--decree-13-gazette-pdf", type=Path, required=True)
    parser.add_argument("--decree-13-gazette-text", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    law_clean = parse_law_crosscheck(args.law_crosscheck_html, args.retrieved_on)
    decree_356_clean = parse_decree_crosscheck(
        path=args.decree_356_crosscheck_html,
        instrument_id=DECREE_356_ID,
        source_url=(
            "https://hethongphapluat.com/nghi-dinh-356-2025-nd-cp-"
            "huong-dan-luat-bao-ve-du-lieu-ca-nhan.html"
        ),
        official_sources=[
            DECREE_356_PDF,
            DECREE_356_GAZETTE_PDF,
            "https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160",
            "https://vbpl.vn/bocongan/Pages/vbpq-toanvan.aspx?ItemID=187276",
        ],
        title_map=DECREE_356_CHAPTER_TITLES,
        expected_articles=42,
        expected_forms=FORMS_356,
        retrieved_on=args.retrieved_on,
    )
    decree_13_official_html = parse_decree_13_official_html(
        args.decree_13_official_html, args.retrieved_on
    )
    decree_13_clean = parse_decree_crosscheck(
        path=args.decree_13_crosscheck_html,
        instrument_id=DECREE_13_ID,
        source_url=(
            "https://hethongphapluat.com/nghi-dinh-13-2023-nd-cp-"
            "ve-bao-ve-du-lieu-ca-nhan.html"
        ),
        official_sources=[
            DECREE_13_PDF,
            DECREE_13_GAZETTE_PDF,
            "https://vanban.chinhphu.vn/?classid=1&docid=207759&pageid=27160&typegroupid=4",
            "https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-dinh-13-2023-nd-cp-bao-ve-du-lieu-ca-nhan-119230516104357809.htm",
            "https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160",
        ],
        title_map=DECREE_13_CHAPTER_TITLES,
        expected_articles=44,
        expected_forms=FORMS_13,
        retrieved_on=args.retrieved_on,
    )
    snapshots = {
        "vn-pdpl-2025-official-ocr-lines.json": build_ocr_snapshot(
            instrument_id=LAW_ID,
            source_url=LAW_PDF,
            pdf_path=args.law_pdf,
            ocr_dir=args.law_ocr_dir,
            expected_pages=23,
            official_metadata_url="https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3",
            official_status_url="https://vbpl.vn/tw/Pages/vbpq-thuoctinh.aspx?ItemID=179252",
            retrieved_on=args.retrieved_on,
        ),
        "vn-pdpl-2025-official-gazette-articles.json": parse_law_gazette(
            args.law_gazette_pdf,
            args.law_gazette_text,
            law_clean["articles"],
            args.retrieved_on,
        ),
        "vn-pdpl-2025-clean-crosscheck.json": law_clean,
        "vn-decree-356-2025-official-ocr-lines.json": build_ocr_snapshot(
            instrument_id=DECREE_356_ID,
            source_url=DECREE_356_PDF,
            pdf_path=args.decree_356_pdf,
            ocr_dir=args.decree_356_ocr_dir,
            expected_pages=71,
            official_metadata_url="https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160",
            official_status_url="https://vbpl.vn/bocongan/Pages/vbpq-thuoctinh.aspx?ItemID=187276",
            retrieved_on=args.retrieved_on,
        ),
        "vn-decree-356-2025-official-gazette-provisions.json": parse_decree_356_gazette(
            args.decree_356_gazette_pdf,
            args.decree_356_gazette_text,
            decree_356_clean,
            args.retrieved_on,
        ),
        "vn-decree-356-2025-clean-crosscheck.json": decree_356_clean,
        "vn-decree-13-2023-official-ocr-lines.json": build_ocr_snapshot(
            instrument_id=DECREE_13_ID,
            source_url=DECREE_13_PDF,
            pdf_path=args.decree_13_pdf,
            ocr_dir=args.decree_13_ocr_dir,
            expected_pages=39,
            official_metadata_url="https://vanban.chinhphu.vn/?classid=1&docid=207759&pageid=27160&typegroupid=4",
            official_status_url="https://vbpl.vn/TW/Pages/ivbpq-lichsu.aspx?ItemID=161106&do=word",
            retrieved_on=args.retrieved_on,
        ),
        "vn-decree-13-2023-official-html-articles.json": decree_13_official_html,
        "vn-decree-13-2023-official-gazette-provisions.json": parse_decree_13_gazette(
            args.decree_13_gazette_pdf,
            args.decree_13_gazette_text,
            decree_13_official_html,
            decree_13_clean,
            args.retrieved_on,
        ),
        "vn-decree-13-2023-clean-crosscheck.json": decree_13_clean,
    }

    for filename, payload in snapshots.items():
        write_json(args.output_dir / filename, payload)
        print(f"Wrote {filename}")


if __name__ == "__main__":
    main()
