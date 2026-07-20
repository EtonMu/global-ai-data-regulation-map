#!/usr/bin/env python3
"""Prepare source-aligned English translation drafts for editorial review.

This networked helper is deliberately separate from the offline corpus
annotator.  Its output is a draft: it must be reviewed before it is passed to
``annotate-br-id-tw-english.py``.  The checked-in translation resources, not
the external service, are the reproducibility boundary for the published
corpora.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
import json
from pathlib import Path
import random
import re
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ENDPOINT = "https://translate.googleapis.com/translate_a/single"


def digest(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def translate(value: str, source_language: str, attempts: int = 6) -> str:
    query = urlencode(
        {
            "client": "gtx",
            "sl": source_language,
            "tl": "en",
            "dt": "t",
            "q": value,
        }
    )
    request = Request(
        f"{ENDPOINT}?{query}",
        headers={"User-Agent": "Compliance-Compass-corpus-audit/1.0"},
    )
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=45) as response:  # noqa: S310
                payload = json.loads(response.read().decode("utf-8"))
            translated = "".join(item[0] for item in payload[0] if item and item[0])
            translated = re.sub(r"[ \t]+", " ", translated).strip()
            if not translated:
                raise ValueError("translation service returned an empty string")
            return translated
        except Exception as error:  # pragma: no cover - network retry boundary
            last_error = error
            time.sleep((2**attempt) + random.random())
    raise RuntimeError(f"translation failed after {attempts} attempts") from last_error


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--source-language", required=True)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    corpus = json.loads(args.source.read_text(encoding="utf-8"))
    jobs: list[tuple[int, int, str]] = []
    for unit_index, unit in enumerate(corpus):
        for paragraph_index, paragraph in enumerate(unit["paragraphs"]):
            jobs.append((unit_index, paragraph_index, paragraph))

    translated_by_position: dict[tuple[int, int], str] = {}
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(translate, paragraph, args.source_language): (
                unit_index,
                paragraph_index,
            )
            for unit_index, paragraph_index, paragraph in jobs
        }
        for completed, future in enumerate(as_completed(futures), start=1):
            position = futures[future]
            translated_by_position[position] = future.result()
            if completed % 50 == 0 or completed == len(futures):
                print(f"translated {completed}/{len(futures)} paragraphs")

    units: list[dict] = []
    for unit_index, unit in enumerate(corpus):
        source_paragraphs = unit["paragraphs"]
        english_paragraphs = [
            translated_by_position[(unit_index, paragraph_index)]
            for paragraph_index in range(len(source_paragraphs))
        ]
        units.append(
            {
                "id": unit["id"],
                "sourceContentSha256": digest(unit["fullText"]),
                "sourceParagraphCount": len(source_paragraphs),
                "paragraphs": english_paragraphs,
                "fullText": "\n\n".join(english_paragraphs),
                "contentSha256": digest("\n\n".join(english_paragraphs)),
            }
        )

    output = {
        "schemaVersion": 1,
        "instrumentId": corpus[0]["instrumentId"],
        "sourceLanguage": args.source_language,
        "targetLanguage": "en",
        "status": "machine-assisted-draft-requires-editorial-review",
        "sourceCorpus": str(args.source),
        "unitCount": len(units),
        "units": units,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(units)} draft units to {args.output}")


if __name__ == "__main__":
    main()
