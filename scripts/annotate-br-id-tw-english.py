#!/usr/bin/env python3
"""Attach reviewed English references to the BR, ID, and TW corpora offline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from legal_corpus_utils import write_json
from project_english_corpus import attach_project_english


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
DEFAULTS = {
    "br-pl-2338-2023-ai-bill": DATA / "br-ai-bill-2338-2023-articles.json",
    "id-pdp-law-2022": DATA / "id-pdp-law-2022-articles.json",
    "tw-executive-yuan-generative-ai-guidelines-2023": (
        DATA / "tw-executive-yuan-generative-ai-guidelines-2023-points.json"
    ),
}


def annotate(path: Path, instrument_id: str) -> None:
    corpus = json.loads(path.read_text(encoding="utf-8"))
    attach_project_english(corpus, instrument_id)
    if instrument_id == "id-pdp-law-2022":
        for record in corpus:
            record["summary"] = (
                "Complete official Indonesian Article text with a complete "
                "project-authored English reference; Indonesian and applicable "
                "Constitutional Court decisions control."
            )
    write_json(path, corpus)
    print(f"Annotated {len(corpus)} nodes at {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--instrument",
        action="append",
        choices=sorted(DEFAULTS),
        help="Annotate only this instrument (repeatable); default: all three",
    )
    args = parser.parse_args()
    for instrument_id in args.instrument or list(DEFAULTS):
        annotate(DEFAULTS[instrument_id], instrument_id)


if __name__ == "__main__":
    main()
