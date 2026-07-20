#!/usr/bin/env python3
"""Generate all 76 Indonesian PDP Law Articles with current judicial overlays."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from legal_corpus_utils import (
    assert_sequential,
    content_sha256,
    load_snapshot,
    write_json,
)
from project_english_corpus import attach_project_english


INSTRUMENT_ID = "id-pdp-law-2022"
OFFICIAL_SOURCE = "https://www.jdihn.go.id/files/2098/2022uu027.pdf"
OFFICIAL_HTML = (
    "https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/"
    "undangundang%2Bnomor%2B27%2Btahun%2B2022"
)
REGISTRY_SOURCE = "https://www.peraturan.go.id/id/uu-no-27-tahun-2022"
STATUS_SOURCE = "https://peraturan.bpk.go.id/details/229798/uu-no-27-"
DECISION_151 = (
    "https://s.mkri.id/public/content/persidangan/putusan/"
    "putusan_mkri_12970_1753859809.pdf"
)
RIGHTS = {
    "reuseStatus": "government-edict",
    "license": (
        "No copyright subsists in legislation or court judgments under Article "
        "42(b) and (d) of Law No. 28 of 2014 on Copyright"
    ),
    "licenseUrl": "https://peraturan.go.id/files/uu28-2014bt.pdf",
    "attribution": (
        "Controlling text: Republic of Indonesia official Gazette/JDIHN. A clean "
        "secondary transcription is used only to correct official-source OCR and "
        "restore list markers, with the method disclosed in each record."
    ),
}

JUDICIAL_REVIEW = {
    20: [
        {
            "decision": "284/PUU-XXIII/2025",
            "decidedOn": "2026-03-02",
            "outcome": "rejected",
            "source": "https://s.mkri.id/public/content/persidangan/putusan/putusan_mkri_13917_1772423514.pdf",
            "note": "The challenge to Article 20(2)(a) was rejected; the enacted text was not altered.",
        }
    ],
    53: [
        {
            "decision": "151/PUU-XXII/2024",
            "decidedOn": "2025-07-30",
            "outcome": "granted-conditionally",
            "source": DECISION_151,
            "note": (
                "The word 'dan' at the end of Article 53(1)(b) is conditionally "
                "non-binding unless understood as 'dan/atau'."
            ),
        }
    ],
    56: [
        {
            "decision": "137/PUU-XXIII/2025",
            "decidedOn": "2026-01-19",
            "outcome": "rejected",
            "source": "https://www.mkri.id/public/content/persidangan/putusan/putusan_mkri_13644_1768797987.pdf",
            "note": "The challenge was rejected; Article 56 was not altered.",
        }
    ],
    58: [
        {
            "case": "236/PUU-XXIV/2026",
            "statusAsOf": "2026-07-20",
            "outcome": "pending",
            "source": "https://www.mkri.id/berita/advokat-perbaiki-uji-pembentukan-lembaga-perlindungan-data-pribadi-25412",
            "note": "Pending review of Article 58(5) does not alter the text while undecided.",
        }
    ],
    61: [
        {
            "case": "236/PUU-XXIV/2026",
            "statusAsOf": "2026-07-20",
            "outcome": "pending",
            "source": "https://www.mkri.id/berita/advokat-perbaiki-uji-pembentukan-lembaga-perlindungan-data-pribadi-25412",
            "note": "Pending review of Article 61 does not alter the text while undecided.",
        }
    ],
    62: [
        {
            "decision": "133/PUU-XXIV/2026",
            "decidedOn": "2026-05-25",
            "outcome": "rejected",
            "source": "https://www.mkri.id/berita/kewajiban-negara-kontrol-transfer-data-pribadi-secara-holistik-25115",
            "note": "The challenge to Article 62(2) was rejected; the enacted text was not altered.",
        }
    ],
    65: [
        {
            "decision": "135/PUU-XXIII/2025",
            "decidedOn": "2026-01-19",
            "outcome": "rejected",
            "source": "https://www.mkri.id/berita/selain-uu-pdp%2C-pemrosesan-data-pribadi-kegiatan-jurnalistik-tunduk-pada-uu-pers-24396",
            "note": "The journalism-related challenge was rejected; Article 65 was not altered.",
        }
    ],
}


def clean(value: str) -> str:
    # The clean cross-check contains a few PDF soft-hyphen artefacts followed by
    # spaces (for example, ``Undang\xad Undang``).  They represent visible
    # hyphens in the official text, not discretionary line-break characters.
    value = value.replace("\u00ad ", "-").replace("\u00ad", "")
    # The clean cross-check retains three visible OCR/transcription defects.  The
    # official Gazette layout confirms the ordinary forms below.  Normalizing
    # ``BABX`` also prevents a Chapter heading from being swallowed into Article
    # 61's body.
    value = value.replace("D&.ta", "Data").replace("BABX", "BAB X")
    value = value.replace("( 1)", "(1)")
    return re.sub(r"\s+", " ", value.replace("\u00a0", " ")).strip()


def next_nonempty(lines: list[dict], start: int) -> tuple[int, str]:
    for index in range(start, len(lines)):
        value = clean(str(lines[index]["text"]))
        if value:
            return index, value
    raise ValueError("Expected another non-empty source line")


def merge_marker_lines(values: list[str]) -> list[str]:
    marker = re.compile(r"^(?:\(\d+\)\.?|[a-z]\.\s*|\d+\.\s*)$")
    paragraphs: list[str] = []
    pending: str | None = None
    for value in values:
        line = clean(value)
        if not line:
            continue
        if marker.fullmatch(line):
            if pending is not None:
                raise ValueError(f"Consecutive unattached markers: {pending!r}, {line!r}")
            # Two source lines carry the OCR form ``(1).`` / ``(3).``.  The
            # official Gazette prints the ordinary paragraph markers ``(1)`` /
            # ``(3)``; normalize only this punctuation artefact.
            pending = re.sub(r"^(\(\d+\))\.$", r"\1", line)
            continue
        if pending is not None:
            line = f"{pending} {line}"
            pending = None
        paragraphs.append(line)
    if pending is not None:
        raise ValueError(f"Unattached final marker: {pending!r}")
    return paragraphs


def validate_official_snapshot(path: Path) -> None:
    _, lines = load_snapshot(path)
    values = [clean(str(item["text"])) for item in lines]
    headings = [
        int(match.group(1))
        for value in values
        if (match := re.fullmatch(r"Pasal (\d+)", value))
    ]
    if headings != list(range(1, 77)):
        raise ValueError(f"Official JDIH HTML snapshot is not a 76-Article body: {headings}")
    joined = "\n".join(values)
    for anchor in [
        "Pengendali Data Pribadi wajib melakukan penilaian dampak",
        "Pengendali Data Pribadi dan Prosesor Data Pribadi wajib menunjuk",
        "Undang-Undang ini mulai berlaku pada tanggal diundangkan",
    ]:
        if anchor not in joined:
            raise ValueError(f"Official snapshot is missing verification anchor: {anchor}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Clean transcription cross-check snapshot")
    parser.add_argument("output", type=Path)
    parser.add_argument("--official-snapshot", type=Path, required=True)
    parser.add_argument("--retrieved-on", required=True)
    parser.add_argument(
        "--skip-project-english",
        action="store_true",
        help="Emit the source corpus only (bootstrap/review use).",
    )
    args = parser.parse_args()

    validate_official_snapshot(args.official_snapshot)
    _, snapshot_lines = load_snapshot(args.input)
    lines = [
        {"sourceLine": int(item["sourceLine"]), "text": str(item["text"])}
        for item in snapshot_lines
    ]

    structural_indexes: set[int] = set()
    contexts: dict[int, tuple[dict, dict | None]] = {}
    chapter: dict | None = None
    subdivision: dict | None = None

    for index, item in enumerate(lines):
        value = clean(item["text"])
        if re.fullmatch(r"BAB [IVXLCDM]+", value):
            title_index, title = next_nonempty(lines, index + 1)
            roman = value.split()[-1]
            chapter = {
                "id": f"{INSTRUMENT_ID}-chapter-{roman.lower()}",
                "label": value,
                "title": title,
            }
            subdivision = None
            structural_indexes.update({index, title_index})
            continue
        if value.startswith("Bagian "):
            title_index, title = next_nonempty(lines, index + 1)
            slug = re.sub(r"[^0-9a-z]+", "-", value.casefold()).strip("-")
            subdivision = {
                "id": f"{INSTRUMENT_ID}-{slug}",
                "label": value,
                "title": title,
            }
            structural_indexes.update({index, title_index})
            continue
        match = re.fullmatch(r"## Pasal (\d+)", value)
        if match:
            if chapter is None:
                raise ValueError(f"Article {match.group(1)} has no Chapter context")
            contexts[int(match.group(1))] = (dict(chapter), dict(subdivision) if subdivision else None)

    starts = [
        (index, int(match.group(1)))
        for index, item in enumerate(lines)
        if (match := re.fullmatch(r"## Pasal (\d+)", clean(item["text"])))
    ]
    if [number for _, number in starts] != list(range(1, 77)):
        raise ValueError(f"Expected exactly Articles 1..76, got {starts}")

    records: list[dict] = []
    for offset, (start, number) in enumerate(starts):
        end = starts[offset + 1][0] if offset + 1 < len(starts) else len(lines)
        raw_values: list[str] = []
        for index in range(start + 1, end):
            if index in structural_indexes:
                continue
            value = clean(lines[index]["text"])
            if not value or value.startswith("## "):
                continue
            if number == 76 and value.startswith("Agar setiap orang mengetahuinya"):
                break
            raw_values.append(value)
        paragraphs = [f"Pasal {number}", *merge_marker_lines(raw_values)]
        if len(paragraphs) < 2:
            raise ValueError(f"Article {number} has no body")
        full_text = "\n\n".join(paragraphs)
        source_end = lines[end - 1]["sourceLine"] if end > start + 1 else lines[start]["sourceLine"]
        chapter_value, subdivision_value = contexts[number]
        record: dict = {
            "id": f"id-pdp-law-2022-art-{number}",
            "instrumentId": INSTRUMENT_ID,
            "articleNumber": str(number),
            "label": f"Article {number}",
            "originalTitle": f"Pasal {number}",
            "title": f"Pasal {number}",
            "chapter": chapter_value,
            "section": subdivision_value,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "id-ID",
            "textAvailability": "official-original-text-verified-transcription",
            "source": OFFICIAL_SOURCE,
            "sourceFragment": OFFICIAL_SOURCE,
            "canonicalSource": REGISTRY_SOURCE,
            "statusSource": STATUS_SOURCE,
            "officialHtmlSource": OFFICIAL_HTML,
            "transcriptionSource": snapshot_lines and (
                "https://perpajakan.ddtc.co.id/id/sumber-hukum/peraturan-pusat/"
                "undang-undang-27-tahun-2022"
            ),
            "transcriptionMethod": (
                "The controlling official Gazette PDF and official JDIH HTML were "
                "cross-checked against a clean secondary transcription to restore "
                "list markers and correct obvious OCR defects."
            ),
            "sourceLabel": "JDIHN official Gazette PDF — verified Indonesian transcription",
            "sourceLineRange": {
                "transcriptionStart": lines[start]["sourceLine"],
                "transcriptionEnd": source_end,
            },
            "retrievedOn": args.retrieved_on,
            "versionAsOf": args.retrieved_on,
            "effectiveFrom": "2022-10-17",
            "legalEffectStatus": "in-force",
            "sourceVersion": {
                "officialTitle": "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
                "enactedOn": "2022-10-17",
                "promulgatedOn": "2022-10-17",
                "status": "Berlaku",
                "gazette": "LN.2022/No.196; TLN No.6820",
                "versionNote": (
                    "The enacted text remains in force. Decision 151/PUU-XXII/2024 "
                    "changes the binding interpretation of one conjunction in Article "
                    "53(1)(b); other reviewed decisions listed here did not alter text."
                ),
            },
            "summary": (
                "Complete official-language Article text. No English translation is supplied; "
                "the Indonesian text controls."
            ),
            "englishAvailability": {
                "coverageStatus": "no-source-text",
                "status": "not-available-in-government-primary-sources",
                "versionAsOf": args.retrieved_on,
                "versionLabel": (
                    "Law No. 27 of 2022 with Article 53 judicial overlay through "
                    "20 July 2026"
                ),
                "authorityNote": (
                    "Indonesian is the controlling legal text. No complete English "
                    "translation published by the legislature, JDIHN, Komdigi JDIH "
                    "or the national regulations portal was verified."
                ),
                "sourcesChecked": [
                    OFFICIAL_SOURCE,
                    OFFICIAL_HTML,
                    REGISTRY_SOURCE,
                    STATUS_SOURCE,
                ],
                "note": (
                    "No machine, commercial-database or unofficial full translation "
                    "is substituted in this open corpus."
                ),
            },
            "rights": RIGHTS,
            "contentSha256": content_sha256(full_text),
        }
        if number in JUDICIAL_REVIEW:
            record["judicialReview"] = JUDICIAL_REVIEW[number]
        if number == 53:
            current_text, replacements = re.subn(
                r"(skala besar;) dan(?=\n\nc\.)",
                r"\1 dan/atau",
                full_text,
                count=1,
            )
            if replacements != 1:
                raise ValueError("Could not apply the exact Decision 151 overlay to Article 53")
            record["legalEffectStatus"] = "in-force-as-conditionally-interpreted"
            record["currentOperativeText"] = current_text
            record["currentOperativeSha256"] = content_sha256(current_text)
            record["legalEffect"] = {
                "decision": "151/PUU-XXII/2024",
                "effectiveFrom": "2025-07-30",
                "affectedProvision": "Article 53(1)(b), final conjunction",
                "enactedWording": "dan",
                "bindingInterpretation": "dan/atau",
                "operativeOrderOriginal": (
                    "Kata ‘dan’ dalam Pasal 53 ayat (1) huruf b ... tidak mempunyai "
                    "kekuatan hukum mengikat secara bersyarat sepanjang tidak dimaknai ‘dan/atau’."
                ),
                "source": DECISION_151,
                "note": (
                    "fullText preserves the promulgated 2022 wording; currentOperativeText "
                    "applies the Court's binding interpretation without silently rewriting history."
                ),
            }
        records.append(record)

    assert_sequential([record["articleNumber"] for record in records], 76, "Indonesia PDP")
    if not args.skip_project_english:
        attach_project_english(records, INSTRUMENT_ID)
        for record in records:
            record["summary"] = (
                "Complete official Indonesian Article text with a complete "
                "project-authored English reference; Indonesian and applicable "
                "Constitutional Court decisions control."
            )
    write_json(args.output, records)
    print(f"Generated {len(records)} Indonesian PDP Articles at {args.output}")


if __name__ == "__main__":
    main()
