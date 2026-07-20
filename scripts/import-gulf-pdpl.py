#!/usr/bin/env python3
"""Build complete UAE and Saudi Arabic/official-English PDPL corpora.

No machine translation is performed. Arabic is the controlling/original text.
English fields contain only the English reference text published by the relevant
government platform.

Requirements: Python 3 and Poppler's ``pdftotext`` executable.
"""

from __future__ import annotations

import argparse
import hashlib
import http.cookiejar
import json
import re
import subprocess
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


RETRIEVED_ON = "2026-07-20"
ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"

UAE_PAGE_AR = "https://www.uaelegislation.gov.ae/ar/legislations/1972"
UAE_PAGE_EN = "https://www.uaelegislation.gov.ae/en/legislations/1972"
UAE_API_AR = UAE_PAGE_AR + "/materials-ajax?page=1&keyword=" + urllib.parse.quote("المادة")
UAE_API_EN = UAE_PAGE_EN + "/materials-ajax?page=1&keyword=Article"
UAE_DOWNLOAD_AR = UAE_PAGE_AR + "/download"
UAE_DOWNLOAD_EN = UAE_PAGE_EN + "/download"

SA_PAGE_AR = "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL"
SA_IR_PAGE_AR = "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2"
SA_TRANSFER_PAGE_AR = "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom"

SA_PDF_EN = "https://dgp.sdaia.gov.sa/wps/wcm/connect/ce84f976-2fdf-4a76-a8c4-638b7ca9e3ba/Personal%2BData%2BEnglish.pdf?CACHEID=ROOTWORKSPACE-ce84f976-2fdf-4a76-a8c4-638b7ca9e3ba-oMcvYOB&CONVERT_TO=url&MOD=AJPERES"
SA_IR_PDF_EN = "https://dgp.sdaia.gov.sa/wps/wcm/connect/2a9a4744-a2ae-444f-bad2-6dacde843637/The%2Bimpelementing%2Bregulation%2Bof%2Bthe%2Bpersonal%2Bdata%2Bprotection%2Blaw.pdf?CACHEID=ROOTWORKSPACE-2a9a4744-a2ae-444f-bad2-6dacde843637-pcruNj.&CONVERT_TO=url&MOD=AJPERES"
SA_TRANSFER_PDF_EN = "https://dgp.sdaia.gov.sa/wps/wcm/connect/e5bbede0-1119-4f70-b4ef-f043ce58d780/Regulation%2Bon%2BPersonal%2BData%2BTransfer%2BOutside%2Bthe%2BKingdom..pdf?CACHEID=ROOTWORKSPACE-e5bbede0-1119-4f70-b4ef-f043ce58d780-p6OMj1M&CONVERT_TO=url&MOD=AJPERES"

UAE_RIGHTS = {
    "reuseStatus": "official-legal-text-statutory-exclusion",
    "basis": "UAE Federal Decree-Law No. 38 of 2021 on Copyright and Neighbouring Rights, Article 3",
    "basisUrl": "https://uaelegislation.gov.ae/en/legislations/1534/download",
    "note": "Official documents, including laws and regulations, and official translations are excluded from copyright protection under Article 3; source attribution is retained.",
    "attributionRequired": True,
}

SA_RIGHTS = {
    "reuseStatus": "official-legal-text-statutory-exclusion",
    "basis": "Saudi Copyright Law, Article 4",
    "basisUrl": "https://www.uqn.gov.sa/details?p=28845",
    "note": "Laws, regulations, judicial and administrative decisions, international agreements, and official translations are excluded from copyright protection, subject to rules governing circulation; source attribution is retained.",
    "attributionRequired": True,
}

ARABIC_ORDINALS = [
    "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة",
    "الحادية عشرة", "الثانية عشرة", "الثالثة عشرة", "الرابعة عشرة", "الخامسة عشرة", "السادسة عشرة", "السابعة عشرة", "الثامنة عشرة", "التاسعة عشرة", "العشرون",
    "الحادية والعشرون", "الثانية والعشرون", "الثالثة والعشرون", "الرابعة والعشرون", "الخامسة والعشرون", "السادسة والعشرون", "السابعة والعشرون", "الثامنة والعشرون", "التاسعة والعشرون", "الثلاثون",
    "الحادية والثلاثون", "الثانية والثلاثون", "الثالثة والثلاثون", "الرابعة والثلاثون", "الخامسة والثلاثون", "السادسة والثلاثون", "السابعة والثلاثون", "الثامنة والثلاثون", "التاسعة والثلاثون", "الأربعون",
    "الحادية والأربعون", "الثانية والأربعون", "الثالثة والأربعون",
]


class BlockTextParser(HTMLParser):
    """Extract text while retaining only semantic block breaks."""

    BLOCKS = {"p", "li", "h1", "h2", "h3", "h4", "div", "br"}

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_data(self, data: str) -> None:
        if self.ignored_depth:
            return
        self.parts.append(re.sub(r"\s+", " ", data))

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self.ignored_depth += 1
            return
        if self.ignored_depth:
            return
        if tag in self.BLOCKS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"}:
            self.ignored_depth = max(0, self.ignored_depth - 1)
            return
        if self.ignored_depth:
            return
        if tag in self.BLOCKS - {"br"}:
            self.parts.append("\n")

    def text(self) -> str:
        value = "".join(self.parts).replace("\xa0", " ").replace("\u200c", "")
        lines = [re.sub(r"\s+", " ", line).strip() for line in value.splitlines()]
        return re.sub(r"\n+", "\n", "\n".join(line for line in lines if line)).strip()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def download(url: str, path: Path, referer: str | None = None) -> Path:
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*"}
    if referer:
        headers["Referer"] = referer
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        path.write_bytes(response.read())
    return path


def fetch_uae_payload(page_url: str, api_url: str, path: Path) -> Path:
    if path.exists() and path.stat().st_size > 10_000:
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    page_request = urllib.request.Request(page_url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
    with opener.open(page_request, timeout=120) as response:
        response.read()
    api_request = urllib.request.Request(
        api_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": page_url,
        },
    )
    with opener.open(api_request, timeout=120) as response:
        payload = response.read()
    parsed = json.loads(payload)
    if not parsed.get("status") or not parsed.get("html_data"):
        raise RuntimeError(f"UAE article endpoint did not return article content: {api_url}")
    path.write_bytes(payload)
    return path


def pdftotext(path: Path) -> str:
    return subprocess.run(["pdftotext", str(path), "-"], check=True, stdout=subprocess.PIPE).stdout.decode("utf-8")


def html_to_text(html: str) -> str:
    parser = BlockTextParser()
    parser.feed(html)
    return parser.text()


def normalize_lines(text: str) -> str:
    text = text.replace("\f", "\n")
    lines: list[str] = []
    for line in text.splitlines():
        stripped = re.sub(r"\s+", " ", line).strip()
        if not stripped:
            continue
        if re.fullmatch(r"\d{1,3}", stripped):
            continue
        if stripped in {"Personal Data Protection Law", "Document Classification: Public"}:
            continue
        if stripped.startswith("Document Classification: Public"):
            continue
        lines.append(stripped)
    return "\n".join(lines)


def split_uae_payload(path: Path, language: str) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    text = html_to_text(payload["html_data"])
    if language == "ar":
        pattern = re.compile(r"(?m)^المادة\s*\(\s*(\d+)\s*\)\s+(.+)$")
    else:
        pattern = re.compile(r"(?m)^Article\s*\(\s*(\d+)\s*\)\s+(.+)$")
    matches = list(pattern.finditer(text))
    numbers = [int(match.group(1)) for match in matches]
    if numbers != list(range(1, 32)):
        raise RuntimeError(f"UAE {language} parser found article numbers {numbers}")
    units: list[dict] = []
    for index, match in enumerate(matches):
        number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        title = match.group(2).strip()
        if language == "ar" and number == 23:
            # The dynamic page's heading omits "عدم"; the controlling Arabic PDF
            # and the article's operative text both identify the no-adequacy case.
            title = "نقل ومشاركة البيانات الشخصية عبر الحدود لأغراض المعالجة في حال عدم وجود مستوى حماية ملائم"
        body = text[match.end():end].strip()
        heading = f"المادة ({number}) {title}" if language == "ar" else f"Article ({number}) {title}"
        units.append({"number": number, "title": title, "fullText": f"{heading}\n{body}".strip()})
    return units


def build_uae(ar_path: Path, en_path: Path) -> list[dict]:
    arabic = split_uae_payload(ar_path, "ar")
    english = split_uae_payload(en_path, "en")
    records: list[dict] = []
    source_version = {
        "issuedOn": "2021-09-20",
        "officialGazetteDate": "2021-09-26",
        "officialGazetteNumber": "712 (Supplement)",
        "effectiveFrom": "2022-01-02",
        "status": "active",
        "lastLegislationUpdate": "2021-09-20",
        "arabicPayloadSha256": sha256_bytes(ar_path.read_bytes()),
        "englishPayloadSha256": sha256_bytes(en_path.read_bytes()),
        "arabicDownload": UAE_DOWNLOAD_AR,
        "englishDownload": UAE_DOWNLOAD_EN,
    }
    authority_note = "Arabic is the original and controlling text. The UAE Legislation Platform states that interpretation and application must refer to the original Arabic and Arabic prevails in a conflict."
    for ar, en in zip(arabic, english, strict=True):
        if ar["number"] != en["number"]:
            raise RuntimeError("UAE article alignment mismatch")
        number = ar["number"]
        records.append({
            "id": f"ae-federal-pdpl-45-2021-a{number}",
            "instrumentId": "ae-federal-pdpl-45-2021",
            "unitType": "article",
            "articleNumber": str(number),
            "label": f"Article {number}",
            "originalTitle": ar["title"],
            "title": en["title"],
            "language": "ar-AE",
            "paragraphs": [ar["fullText"]],
            "fullText": ar["fullText"],
            "translations": {
                "en": {
                    "title": en["title"],
                    "language": "en",
                    "coverageStatus": "complete-current-official-reference-translation",
                    "versionAsOf": "2021-09-20",
                    "versionLabel": (
                        "Federal Decree-Law No. 45 of 2021 — official bilingual "
                        "UAE Legislation Platform text"
                    ),
                    "status": "official-reference-translation",
                    "note": (
                        "Complete Article-level official English reference wording is "
                        "stored without editorial supplementation."
                    ),
                    "authorityNote": authority_note,
                    "paragraphs": [en["fullText"]],
                    "fullText": en["fullText"],
                    "source": UAE_PAGE_EN,
                    "sourceApi": UAE_API_EN,
                    "sourceLabel": "UAE Legislation Platform official English reference text",
                    "contentSha256": sha256_text(en["fullText"]),
                    "rights": UAE_RIGHTS,
                }
            },
            "alignment": {
                "level": "article",
                "status": "official-reference-aligned",
                "originalUnitCount": 31,
                "englishUnitCount": 31,
                "note": authority_note,
            },
            "legalEffectStatus": "in-force",
            "appliesFrom": "2022-01-02",
            "textAvailability": "complete-original-and-official-reference-translation",
            "source": UAE_PAGE_AR,
            "sourceApi": UAE_API_AR,
            "sourceFragment": f"#article-{number}",
            "sourceLabel": "UAE Legislation Platform (General Secretariat of the UAE Cabinet), controlling Arabic text",
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": source_version,
            "rights": UAE_RIGHTS,
            "contentSha256": sha256_text(ar["fullText"]),
        })
    return records


def extract_sa_arabic(path: Path, count: int, titled: bool) -> list[dict]:
    text = html_to_text(path.read_text(encoding="utf-8"))
    # The government portal renders navigation/footer copy after the legal-text
    # component. It is not part of the instrument.
    text = text.split("\nchevron_left", 1)[0]
    matches: list[tuple[int, re.Match[str]]] = []
    for number, ordinal in enumerate(ARABIC_ORDINALS[:count], start=1):
        pattern = re.compile(r"المادة\s+" + re.escape(ordinal) + r"\s*:")
        found = list(pattern.finditer(text))
        if len(found) != 1:
            raise RuntimeError(f"Saudi Arabic parser found {len(found)} headings for article {number} in {path.name}")
        matches.append((number, found[0]))
    if [match.start() for _, match in matches] != sorted(match.start() for _, match in matches):
        raise RuntimeError(f"Saudi Arabic article headings are out of order in {path.name}")

    units: list[dict] = []
    for index, (number, match) in enumerate(matches):
        end = matches[index + 1][1].start() if index + 1 < len(matches) else len(text)
        raw = text[match.end():end].strip()
        title = f"المادة {ARABIC_ORDINALS[number - 1]}"
        if titled:
            first_line, separator, remainder = raw.partition("\n")
            title = first_line.strip() if first_line.strip() else title
            body = remainder.strip() if separator else ""
        else:
            body = raw
        heading = f"المادة {ARABIC_ORDINALS[number - 1]}:"
        if titled:
            heading += f" {title}"
        units.append({"number": number, "title": title, "fullText": f"{heading}\n{body}".strip()})
    return units


IR_TITLE_CONTINUATIONS = {14: 1, 18: 1, 21: 1, 28: 1, 30: 1, 31: 1}
TRANSFER_TITLE_CONTINUATIONS = {2: 1, 3: 1, 4: 2, 7: 1}


def extract_sa_english(path: Path, count: int, titled: bool, continuations: dict[int, int] | None = None) -> list[dict]:
    text = normalize_lines(pdftotext(path))
    if titled:
        pattern = re.compile(r"(?m)^Article (\d+):\s*(.+)$")
    else:
        pattern = re.compile(r"(?m)^Article (\d+)\s*$")
    matches = list(pattern.finditer(text))
    matches = [match for match in matches if 1 <= int(match.group(1)) <= count]
    if [int(match.group(1)) for match in matches] != list(range(1, count + 1)):
        raise RuntimeError(f"Saudi English parser did not find articles 1-{count} in {path.name}")
    units: list[dict] = []
    for index, match in enumerate(matches):
        number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        raw_body = text[match.end():end].strip()
        if titled:
            title_parts = [match.group(2).strip()]
            body_lines = raw_body.splitlines()
            extra_count = (continuations or {}).get(number, 0)
            while extra_count and body_lines:
                candidate = body_lines.pop(0).strip()
                if candidate:
                    title_parts.append(candidate)
                    extra_count -= 1
            title = " ".join(title_parts)
            body = "\n".join(body_lines).strip()
            heading = f"Article {number}: {title}"
        else:
            title = f"Article {number}"
            body = raw_body
            heading = title
        full_text = re.sub(r"[ \t]+", " ", f"{heading}\n{body}").strip()
        units.append({"number": number, "title": title, "fullText": full_text})
    return units


def build_saudi_records(
    *,
    instrument_id: str,
    record_prefix: str,
    arabic_path: Path,
    english_path: Path,
    arabic_source: str,
    english_source: str,
    count: int,
    titled: bool,
    continuations: dict[int, int] | None,
    source_version: dict,
    applies_from: str | None,
    translation_version_as_of: str,
    translation_version_label: str,
) -> list[dict]:
    arabic = extract_sa_arabic(arabic_path, count, titled)
    english = extract_sa_english(english_path, count, titled, continuations)
    authority_note = "Arabic is the original legal text. English is the reference translation published by Saudi Arabia's official Data Governance Platform; no machine translation is included."
    records: list[dict] = []
    merged_source_version = {
        **source_version,
        "arabicSourceSnapshotSha256": sha256_bytes(arabic_path.read_bytes()),
        "englishSourceDocumentSha256": sha256_bytes(english_path.read_bytes()),
    }
    for ar, en in zip(arabic, english, strict=True):
        if ar["number"] != en["number"]:
            raise RuntimeError(f"Saudi article alignment mismatch for {instrument_id}")
        number = ar["number"]
        records.append({
            "id": f"{record_prefix}-a{number}",
            "instrumentId": instrument_id,
            "unitType": "article",
            "articleNumber": str(number),
            "label": f"Article {number}",
            "originalTitle": ar["title"],
            "title": en["title"],
            "language": "ar-SA",
            "paragraphs": [ar["fullText"]],
            "fullText": ar["fullText"],
            "translations": {
                "en": {
                    "title": en["title"],
                    "language": "en",
                    "coverageStatus": "complete-current-official-reference-translation",
                    "versionAsOf": translation_version_as_of,
                    "versionLabel": translation_version_label,
                    "status": "official-reference-translation",
                    "note": (
                        "Complete Article-level official English reference wording is "
                        "stored without editorial supplementation."
                    ),
                    "authorityNote": authority_note,
                    "paragraphs": [en["fullText"]],
                    "fullText": en["fullText"],
                    "source": english_source,
                    "sourceLabel": "Saudi Data Governance Platform official English reference PDF",
                    "contentSha256": sha256_text(en["fullText"]),
                    "rights": SA_RIGHTS,
                }
            },
            "alignment": {
                "level": "article",
                "status": "official-reference-aligned",
                "originalUnitCount": count,
                "englishUnitCount": count,
                "note": authority_note,
            },
            "legalEffectStatus": "in-force",
            "appliesFrom": applies_from,
            "textAvailability": "complete-original-and-official-reference-translation",
            "source": arabic_source,
            "sourceFragment": f"#article-{number}",
            "sourceLabel": "Saudi Data Governance Platform controlling Arabic text",
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": merged_source_version,
            "rights": SA_RIGHTS,
            "contentSha256": sha256_text(ar["fullText"]),
        })
    return records


def write_json(path: Path, value: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=Path("/private/tmp"))
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data" / "v2")
    args = parser.parse_args()

    uae_ar = fetch_uae_payload(UAE_PAGE_AR, UAE_API_AR, args.source_dir / "uae-materials-ar-1.json")
    uae_en = fetch_uae_payload(UAE_PAGE_EN, UAE_API_EN, args.source_dir / "uae-materials-en-1.json")

    sa_ar = download(SA_PAGE_AR, args.source_dir / "sa-pdpl-ar.html")
    sa_ir_ar = download(SA_IR_PAGE_AR, args.source_dir / "sa-pdpl-reg-ar.html")
    sa_transfer_ar = download(SA_TRANSFER_PAGE_AR, args.source_dir / "sa-pdpl-transfer-ar.html")
    sa_en = download(SA_PDF_EN, args.source_dir / "sa-pdpl-en-2.pdf")
    sa_ir_en = download(SA_IR_PDF_EN, args.source_dir / "sa-pdpl-reg-en-2.pdf")
    sa_transfer_en = download(SA_TRANSFER_PDF_EN, args.source_dir / "sa-pdpl-transfer-en.pdf")

    uae = build_uae(uae_ar, uae_en)
    sa_law = build_saudi_records(
        instrument_id="sa-pdpl-2021-amended-2023",
        record_prefix="sa-pdpl-2021-amended-2023",
        arabic_path=sa_ar,
        english_path=sa_en,
        arabic_source=SA_PAGE_AR,
        english_source=SA_PDF_EN,
        count=43,
        titled=False,
        continuations=None,
        source_version={
            "issuedBy": "Royal Decree No. M/19 dated 9/2/1443 AH",
            "amendedBy": "Royal Decree No. M/148 dated 5/9/1444 AH",
            "textState": "consolidated text reflecting the M/148 amendments",
            "effectiveFrom": "2023-09-14",
        },
        applies_from="2023-09-14",
        translation_version_as_of="2023-09-14",
        translation_version_label=(
            "Royal Decree M/19 consolidated with Royal Decree M/148 amendments"
        ),
    )
    sa_ir = build_saudi_records(
        instrument_id="sa-pdpl-implementing-regulation-2023",
        record_prefix="sa-pdpl-implementing-regulation-2023",
        arabic_path=sa_ir_ar,
        english_path=sa_ir_en,
        arabic_source=SA_IR_PAGE_AR,
        english_source=SA_IR_PDF_EN,
        count=38,
        titled=True,
        continuations=IR_TITLE_CONTINUATIONS,
        source_version={
            "textState": "Implementing Regulation of the Personal Data Protection Law",
            "effectiveFrom": "2023-09-14",
            "enforcementBasis": "Article 38: effective from the date of the Law's enforcement",
        },
        applies_from="2023-09-14",
        translation_version_as_of="2023-09-14",
        translation_version_label=(
            "Implementing Regulation of the amended Personal Data Protection Law"
        ),
    )
    sa_transfer = build_saudi_records(
        instrument_id="sa-pdpl-transfer-regulation-2023",
        record_prefix="sa-pdpl-transfer-regulation-2023",
        arabic_path=sa_transfer_ar,
        english_path=sa_transfer_en,
        arabic_source=SA_TRANSFER_PAGE_AR,
        english_source=SA_TRANSFER_PDF_EN,
        count=9,
        titled=True,
        continuations=TRANSFER_TITLE_CONTINUATIONS,
        source_version={
            "documentVersion": "2.0",
            "documentDate": "2024-08",
            "textState": "Version 2.0 of the Regulation on Personal Data Transfer Outside the Kingdom",
            "enforcementBasis": "Article 9: effective on publication in the Official Gazette",
        },
        applies_from=None,
        translation_version_as_of="2024-08-01",
        translation_version_label=(
            "Regulation on Personal Data Transfer Outside the Kingdom, Version 2.0 "
            "(August 2024)"
        ),
    )

    write_json(args.output_dir / "uae-federal-pdpl-45-2021-articles.json", uae)
    write_json(args.output_dir / "sa-pdpl-2021-amended-2023-articles.json", sa_law)
    write_json(args.output_dir / "sa-pdpl-implementing-regulation-2023-articles.json", sa_ir)
    write_json(args.output_dir / "sa-pdpl-transfer-regulation-2023-articles.json", sa_transfer)
    print(f"Wrote UAE {len(uae)}, Saudi Law {len(sa_law)}, IR {len(sa_ir)}, Transfer {len(sa_transfer)} articles")


if __name__ == "__main__":
    main()
