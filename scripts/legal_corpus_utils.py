#!/usr/bin/env python3
"""Shared helpers for source-verifiable provision corpora."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Iterable


def load_snapshot(path: Path) -> tuple[dict, list[dict]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    lines = payload.get("lines")
    if not isinstance(lines, list) or not lines:
        raise ValueError(f"{path} does not contain a non-empty lines array")
    return payload, lines


def write_json(path: Path, value: object) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def content_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def snapshot_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normal_key(value: str) -> str:
    return re.sub(r"[^0-9a-z]+", "", value.casefold())


def merge_wrapped_lines(lines: Iterable[str]) -> list[str]:
    """Merge PDF line wraps while retaining statutory clause boundaries."""

    paragraphs: list[str] = []
    clause = re.compile(
        r"^(?:\([0-9]+[A-Za-z]?\)|\([a-z]+\s*\)|\([ivxlcdm]+\s*\)|"
        r"['\u2018\u201c][A-Za-z]|[A-Z][A-Z ]{3,}:?$)"
    )
    for raw in lines:
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue
        numeric_reference_continuation = bool(
            paragraphs
            and re.match(r"^\([0-9]+[A-Za-z]?\)(?:\.|\s+(?:and|or|to)\b)", line)
            and (
                paragraphs[-1].rstrip().endswith(",")
                or re.search(r"\bsubsections?$", paragraphs[-1].rstrip(), re.IGNORECASE)
            )
        )
        if not paragraphs or (clause.match(line) and not numeric_reference_continuation):
            paragraphs.append(line)
            continue
        separator = "" if paragraphs[-1].endswith("-") else " "
        paragraphs[-1] += separator + line
    return paragraphs


def assert_sequential(values: list[str], expected: int, label: str) -> None:
    target = [str(index) for index in range(1, expected + 1)]
    if values != target:
        raise ValueError(f"{label}: expected identifiers 1..{expected}, got {values}")
