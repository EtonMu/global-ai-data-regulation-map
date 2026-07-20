#!/usr/bin/env python3
"""Prepare pinned machine-assisted drafts for project-authored legal translations.

This utility is intentionally separate from the corpus annotators.  ``--refresh``
calls a public machine-translation endpoint only to prepare a draft; the checked-in
catalogues are the reproducible inputs used by the annotators.  The resulting text
is never represented as an official or government translation.

The script translates each stored source paragraph independently so paragraph and
list order cannot drift.  Source hashes in the catalogue prevent a draft from being
silently applied to a later legal version.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
SNAPSHOTS = DATA / "source-snapshots"
ENDPOINT = "https://translate.googleapis.com/translate_a/single"
GENERATOR_VERSION = "1.0.0"
REVIEWED_AS_OF = "2026-07-20"

TARGETS = {
    "jp-appi-supplements": {
        "source": DATA / "jp-appi-current-articles.json",
        "output": SNAPSHOTS / "jp-appi-supplements-project-en-draft-2026-07-20.json",
        "sourceLanguage": "ja",
        "sourceLocale": "ja-JP",
        "select": lambda unit: unit.get("unitType") == "supplementary-provision-block",
    },
    "vn-decree-13": {
        "source": DATA / "vn-decree-13-2023-historical-provisions.json",
        "output": SNAPSHOTS / "vn-decree-13-2023-project-en-draft-2026-07-20.json",
        "sourceLanguage": "vi",
        "sourceLocale": "vi-VN",
        "select": lambda _unit: True,
    },
    "vn-pdpl-2025": {
        "source": DATA / "vn-personal-data-protection-law-2025-articles.json",
        "output": SNAPSHOTS / "vn-pdpl-2025-project-en-draft-2026-07-20.json",
        "sourceLanguage": "vi",
        "sourceLocale": "vi-VN",
        "select": lambda _unit: True,
    },
    "vn-decree-356": {
        "source": DATA / "vn-decree-356-2025-provisions.json",
        "output": SNAPSHOTS / "vn-decree-356-2025-project-en-draft-2026-07-20.json",
        "sourceLanguage": "vi",
        "sourceLocale": "vi-VN",
        "select": lambda _unit: True,
    },
}


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def translate_segment(text: str, source_language: str) -> str:
    if not re.search(r"[^\W\d_]", text, flags=re.UNICODE):
        return text
    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": source_language,
            "tl": "en",
            "dt": "t",
            "q": text,
        }
    )
    request = urllib.request.Request(
        f"{ENDPOINT}?{query}",
        headers={"User-Agent": "Compliance-Compass-corpus-preparer/1.0"},
    )
    last_error: Exception | None = None
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.load(response)
            translated = "".join(
                segment[0]
                for segment in payload[0]
                if segment and isinstance(segment[0], str)
            ).strip()
            if not translated:
                raise ValueError("translation endpoint returned an empty result")
            return translated
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(min(8, 0.75 * (2**attempt)))
    raise RuntimeError(f"translation failed after retries: {last_error}")


def translate_paragraph(paragraph: str, source_language: str) -> str:
    # Japanese supplementary blocks store captions and provisions inside a single
    # display paragraph.  Translating the sub-blocks separately preserves that
    # intentional layout boundary.
    return "\n\n".join(
        translate_segment(segment, source_language)
        for segment in paragraph.split("\n\n")
    )


def prepare(target_name: str, workers: int) -> None:
    target = TARGETS[target_name]
    units = [
        unit
        for unit in json.loads(target["source"].read_text(encoding="utf-8"))
        if target["select"](unit)
    ]

    tasks: dict[tuple[str, int], tuple[str, str]] = {}
    for unit in units:
        for index, paragraph in enumerate(unit["paragraphs"]):
            tasks[(unit["id"], index)] = (paragraph, target["sourceLanguage"])

    translated: dict[tuple[str, int], str] = {}
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(translate_paragraph, paragraph, language): key
            for key, (paragraph, language) in tasks.items()
        }
        for completed, future in enumerate(as_completed(futures), start=1):
            key = futures[future]
            translated[key] = future.result()
            if completed % 50 == 0 or completed == len(futures):
                print(f"{target_name}: translated {completed}/{len(futures)} paragraphs")

    catalogue_units = []
    for unit in units:
        paragraphs = [
            translated[(unit["id"], index)]
            for index in range(len(unit["paragraphs"]))
        ]
        catalogue_units.append(
            {
                "id": unit["id"],
                "sourceContentSha256": unit["contentSha256"],
                "sourceParagraphCount": len(unit["paragraphs"]),
                "sourceParagraphSequenceSha256": sha256("\n\n".join(unit["paragraphs"])),
                "draftParagraphs": paragraphs,
                "draftParagraphSequenceSha256": sha256("\n\n".join(paragraphs)),
            }
        )

    payload = {
        "schemaVersion": 1,
        "catalogueId": f"{target_name}-project-en-draft-2026-07-20",
        "generatedOn": REVIEWED_AS_OF,
        "generator": {
            "script": "scripts/prepare-project-english-translation-drafts.py",
            "version": GENERATOR_VERSION,
            "draftEngine": "Google Translate public web endpoint",
            "role": "machine-assisted first draft only",
            "disclaimer": "The draft is not an official translation and is not itself legal advice. Corpus annotators add the project translation metadata and pin the source/version boundary.",
        },
        "source": {
            "path": str(target["source"].relative_to(ROOT)),
            "language": target["sourceLocale"],
            "unitCount": len(units),
            "paragraphCount": sum(len(unit["paragraphs"]) for unit in units),
        },
        "units": catalogue_units,
    }
    target["output"].write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {target['output'].relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("target", choices=sorted(TARGETS))
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()
    if not args.refresh:
        raise SystemExit("Refusing network generation without --refresh; annotators use the pinned catalogues offline.")
    prepare(args.target, max(1, min(args.workers, 8)))


if __name__ == "__main__":
    main()
