#!/usr/bin/env python3
"""Build a complete co-authentic Cap. 486 corpus from official HKeL XML.

The importer is version-locked to the current 1 October 2022 English and
Traditional Chinese HKLM files distributed by the Hong Kong Department of
Justice through DATA.GOV.HK.  English is the interface default, but neither
language is classified as a translation of the other.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterable
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_DIRECTORY = ROOT / "data/v2/source-snapshots"
DEFAULT_ENGLISH_SOURCE = SNAPSHOT_DIRECTORY / "hk-pdpo-cap486-20221001-en.xml"
DEFAULT_CHINESE_SOURCE = (
    SNAPSHOT_DIRECTORY / "hk-pdpo-cap486-20221001-zh-Hant-HK.xml"
)
DEFAULT_OUTPUT = ROOT / "data/v2/hk-pdpo-486-provisions.json"
DEFAULT_MANIFEST_OUTPUT = (
    SNAPSHOT_DIRECTORY / "hk-pdpo-cap486-source-manifest.json"
)

HKLM_NAMESPACE = "http://www.xml.gov.hk/schemas/hklm/1.0"
HKLM = f"{{{HKLM_NAMESPACE}}}"
XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"

INSTRUMENT_ID = "hk-personal-data-privacy-ordinance"
VERSION_DATE = "2022-10-01"
RETRIEVED_ON = "2026-07-20"

ENGLISH_SOURCE_SHA256 = (
    "57189e97b8cbcc32855d9b524a5bf825c670858c9017da281cd84648fd86825f"
)
CHINESE_SOURCE_SHA256 = (
    "42aaccf483c282fd23c8b91081cff763ad1e9936d4c402a4d7a12235efa5f68d"
)

ENGLISH_ARCHIVE_URL = (
    "https://resource.data.one.gov.hk/doj/data/"
    "hkel_c_leg_cap_301_cap_600_en.zip"
)
CHINESE_ARCHIVE_URL = (
    "https://resource.data.one.gov.hk/doj/data/"
    "hkel_c_leg_cap_301_cap_600_zh-Hant.zip"
)
DATASET_URL = (
    "https://data.gov.hk/en-data/dataset/hk-doj-hkel-legislation-current"
)
HKEL_ENGLISH_URL = "https://www.elegislation.gov.hk/hk/cap486!en"
HKEL_CHINESE_URL = "https://www.elegislation.gov.hk/hk/cap486!zh-Hant-HK"

RIGHTS = {
    "reuseStatus": "open-government-data-with-conditions",
    "license": "DATA.GOV.HK Terms and Conditions of Use, version 1.2",
    "licenseUrl": "https://data.gov.hk/en/terms-and-conditions",
    "copyrightOwner": (
        "Government of the Hong Kong Special Administrative Region"
    ),
    "dataProvider": "Department of Justice, Hong Kong SAR Government",
    "attribution": (
        "Source: Hong Kong e-Legislation, Department of Justice, Government "
        "of the Hong Kong Special Administrative Region, supplied through "
        "DATA.GOV.HK and retrieved on 20 July 2026. The Government and the "
        "Department of Justice are acknowledged as owners/providers of the "
        "source data. This project normalises whitespace and table layout, "
        "pairs provisions by official temporal identifiers, and does not "
        "imply Government endorsement."
    ),
    "conditionsNote": (
        "Reuse is subject to the DATA.GOV.HK Terms and Conditions, including "
        "source and intellectual-property attribution and the stated "
        "indemnity, disclaimer and limitation-of-liability conditions."
    ),
}

AUTHENTICITY = {
    "status": "co-authentic-equal-status",
    "languages": ["en-HK", "zh-Hant-HK"],
    "authority": (
        "Interpretation and General Clauses Ordinance (Cap. 1), section 10B(1)"
    ),
    "authorityUrl": "https://www.elegislation.gov.hk/hk/cap1!en/s10B",
    "authorityNote": (
        "The English and Chinese texts of a Hong Kong Ordinance are equally "
        "authentic. Neither text is a translation subordinate to the other."
    ),
    "departmentExplanationUrl": (
        "https://www.doj.gov.hk/en/about/orgchart_ldd_drafting_chi_eng.html"
    ),
}

FORMAT_STATUS = {
    "snapshotFormat": "official-current-open-data-HKLM-XML",
    "snapshotLegalStatus": "official-reference-format-not-verified-PDF",
    "note": (
        "The XML is official current open data. HKeL states that only a PDF "
        "bearing the official verification mark is a verified copy with the "
        "statutory presumption under section 5 of the Legislation Publication "
        "Ordinance (Cap. 614). This format distinction does not alter the "
        "equal authenticity of the enacted English and Chinese language texts."
    ),
    "importantNoticesUrl": "https://www.elegislation.gov.hk/importantnotices",
}

SOURCE_VERSION = {
    "officialEnglishTitle": "Personal Data (Privacy) Ordinance",
    "officialChineseTitle": "《個人資料(私隱)條例》",
    "chapter": "486",
    "currentVersionDate": VERSION_DATE,
    "sourceStatus": "In effect",
    "englishIdentifier": "/hk/cap486!en",
    "chineseIdentifier": "/hk/cap486!zh-Hant-HK",
    "commencementNote": {
        "en": "[1 August 1996] L.N. 343 of 1996",
        "zh-Hant-HK": "[1996年8月1日] 1996年第343號法律公告",
    },
    "versionNote": (
        "The weekly current-version HKeL dataset retrieved on 20 July 2026 "
        "continues to identify the whole-chapter version date as 1 October "
        "2022. Section 33 is included in the current chapter but marked not "
        "yet in operation."
    ),
}

STRUCTURAL_CONTAINERS = {
    "part",
    "division",
    "section",
    "subsection",
    "paragraph",
    "subparagraph",
    "def",
    "proviso",
    "statutoryNote",
}
HEADING_CONTAINERS = {"part", "division", "section"}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def element_text(element: ET.Element) -> str:
    pieces: list[str] = []

    def visit(node: ET.Element) -> None:
        if node.text:
            pieces.append(node.text)
        for child in node:
            if local_name(child) == "br":
                pieces.append(" ")
            else:
                visit(child)
            if child.tail:
                pieces.append(child.tail)

    visit(element)
    return "".join(pieces)


def normalize_text(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        value.replace("\u00a0", " ").replace("\u200b", " "),
    ).strip()


def normalized_element_text(element: ET.Element | None) -> str:
    return normalize_text(element_text(element)) if element is not None else ""


def direct_child(element: ET.Element, name: str) -> ET.Element | None:
    return next((child for child in element if local_name(child) == name), None)


def direct_text(element: ET.Element, name: str) -> str:
    return normalized_element_text(direct_child(element, name))


def table_rows(table: ET.Element) -> list[str]:
    rows: list[str] = []
    for row in table.iter():
        if local_name(row) != "tr":
            continue
        cells = [
            normalized_element_text(cell)
            for cell in row
            if local_name(cell) in {"td", "th"}
        ]
        cells = [cell for cell in cells if cell]
        if cells:
            rows.append(" | ".join(cells))
    return rows


def contains_table(element: ET.Element) -> bool:
    return any(local_name(descendant) == "table" for descendant in element.iter())


def flush_text(buffer: list[str], blocks: list[str]) -> None:
    value = normalize_text("".join(buffer))
    if value:
        blocks.append(value)
    buffer.clear()


def render_container(
    element: ET.Element,
    *,
    root_provision: bool = False,
) -> list[str]:
    """Render source-order blocks without duplicating nested structural text."""

    blocks: list[str] = []
    buffer: list[str] = [element.text or ""]
    name = local_name(element)

    if not root_provision and name in HEADING_CONTAINERS:
        header = normalize_text(
            " ".join(
                value
                for value in (direct_text(element, "num"), direct_text(element, "heading"))
                if value
            )
        )
        if header:
            blocks.append(header)

    for child in element:
        child_name = local_name(child)
        child_tail = child.tail or ""

        if child_name in {"num", "heading"}:
            if root_provision or name in HEADING_CONTAINERS:
                buffer.append(child_tail)
                continue
            buffer.append(element_text(child))
            buffer.append(" ")
            buffer.append(child_tail)
            continue

        if child_name in STRUCTURAL_CONTAINERS:
            flush_text(buffer, blocks)
            blocks.extend(render_container(child))
            buffer.append(child_tail)
            continue

        if child_name == "table":
            flush_text(buffer, blocks)
            blocks.extend(table_rows(child))
            buffer.append(child_tail)
            continue

        if contains_table(child):
            flush_text(buffer, blocks)
            blocks.extend(render_container(child))
            buffer.append(child_tail)
            continue

        buffer.append(element_text(child))
        buffer.append(child_tail)

    flush_text(buffer, blocks)
    return blocks


def root_body_text(element: ET.Element) -> str:
    pieces = [element.text or ""]
    for child in element:
        if local_name(child) not in {"num", "heading"}:
            pieces.append(element_text(child))
        if child.tail:
            pieces.append(child.tail)
    return normalize_text("".join(pieces))


def compact_for_coverage(value: str) -> str:
    return re.sub(r"[\s|]", "", value)


def validate_rendered_coverage(
    element: ET.Element,
    paragraphs: list[str],
    language: str,
) -> None:
    source_body = compact_for_coverage(root_body_text(element))
    rendered_body = compact_for_coverage("".join(paragraphs))
    if source_body != rendered_body:
        temporal_id = element.get("temporalId", element.get("name", "unknown"))
        raise ValueError(
            f"Rendered {language} text is not source-complete for {temporal_id}"
        )


def meta_value(root: ET.Element, name: str) -> str:
    meta = direct_child(root, "meta")
    if meta is None:
        raise ValueError("HKLM metadata is missing")
    value = direct_text(meta, name)
    if not value:
        raise ValueError(f"HKLM metadata field is missing: {name}")
    return value


def parse_source(
    path: Path,
    *,
    expected_hash: str,
    expected_language: str,
    expected_identifier: str,
) -> tuple[ET.Element, bytes]:
    source_bytes = path.read_bytes()
    source_hash = sha256_bytes(source_bytes)
    if source_hash != expected_hash:
        raise ValueError(
            f"Unexpected hash for {path.name}: expected {expected_hash}, got {source_hash}"
        )
    root = ET.fromstring(source_bytes)
    language = root.get(f"{{{XML_NAMESPACE}}}lang")
    checks = {
        "language": (language, expected_language),
        "docNumber": (meta_value(root, "docNumber"), "486"),
        "docStatus": (meta_value(root, "docStatus"), "In effect"),
        "identifier": (meta_value(root, "identifier"), expected_identifier),
        "date": (meta_value(root, "date"), VERSION_DATE),
        "publisher": (meta_value(root, "publisher"), "DoJ"),
        "rights": (
            meta_value(root, "rights"),
            "the Government of the Hong Kong Special Administrative Region",
        ),
    }
    failures = [f"{name}: {actual!r}" for name, (actual, expected) in checks.items() if actual != expected]
    if failures:
        raise ValueError(f"Unexpected HKLM metadata in {path.name}: {failures}")
    return root, source_bytes


def parent_map(root: ET.Element) -> dict[ET.Element, ET.Element]:
    return {child: parent for parent in root.iter() for child in parent}


def has_schedule_ancestor(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
) -> bool:
    current = element
    while current in parents:
        current = parents[current]
        if local_name(current) == "schedule":
            return True
    return False


def main_sections(root: ET.Element) -> list[ET.Element]:
    parents = parent_map(root)
    return [
        element
        for element in root.iter()
        if local_name(element) == "section"
        and not has_schedule_ancestor(element, parents)
    ]


def schedules(root: ET.Element) -> list[ET.Element]:
    return [element for element in root.iter() if local_name(element) == "schedule"]


def temporal_index(elements: Iterable[ET.Element]) -> dict[str, ET.Element]:
    index: dict[str, ET.Element] = {}
    for element in elements:
        temporal_id = element.get("temporalId")
        if not temporal_id:
            raise ValueError(f"Element lacks temporalId: {ET.tostring(element)[:200]!r}")
        if temporal_id in index:
            raise ValueError(f"Duplicate temporalId: {temporal_id}")
        index[temporal_id] = element
    return index


def ancestor(
    element: ET.Element,
    parents: dict[ET.Element, ET.Element],
    name: str,
) -> ET.Element | None:
    current = element
    while current in parents:
        current = parents[current]
        if local_name(current) == name:
            return current
    return None


def paired_structure_node(
    english: ET.Element | None,
    chinese_by_temporal_id: dict[str, ET.Element],
) -> dict[str, Any] | None:
    if english is None:
        return None
    temporal_id = english.get("temporalId")
    if not temporal_id or temporal_id not in chinese_by_temporal_id:
        raise ValueError(f"Missing Chinese structure pair for {temporal_id}")
    chinese = chinese_by_temporal_id[temporal_id]
    return {
        "id": f"{INSTRUMENT_ID}-{temporal_id.lower()}",
        "sourceTemporalId": temporal_id,
        "label": direct_text(english, "num"),
        "title": direct_text(english, "heading"),
        "coAuthenticLabel": direct_text(chinese, "num"),
        "coAuthenticTitle": direct_text(chinese, "heading"),
        "sourceVersionStartDate": {
            "en-HK": english.get("startPeriod"),
            "zh-Hant-HK": chinese.get("startPeriod"),
        },
    }


def display_titles(
    english: ET.Element,
    chinese: ET.Element,
) -> tuple[str, str, bool]:
    english_title = direct_text(english, "heading")
    chinese_title = direct_text(chinese, "heading")
    if english_title and chinese_title:
        return english_title, chinese_title, False
    reason = english.get("reason")
    fallbacks = {
        "repealed": ("(Repealed)", "(已廢除)"),
        "omittedAsSpent": ("(Omitted as spent)", "(已失時效而略去)"),
    }
    if reason not in fallbacks:
        raise ValueError(
            f"Missing bilingual heading without a known placeholder reason: {english.get('temporalId')}"
        )
    fallback = fallbacks[reason]
    return fallback[0], fallback[1], True


def status_metadata(
    english: ET.Element,
    chinese: ET.Element,
) -> tuple[str, str, dict[str, Any], str]:
    source_status = english.get("status")
    source_reason = english.get("reason")
    if source_status != chinese.get("status") or source_reason != chinese.get("reason"):
        raise ValueError(
            f"Bilingual status mismatch for {english.get('temporalId')}"
        )

    mappings = {
        ("operational", "inEffect"): (
            "in-force",
            "in-operation",
            "current-in-force",
            "official-co-authentic-current-text",
        ),
        ("pending", "notYetInOperation"): (
            "enacted-not-yet-in-operation",
            "not-yet-in-operation",
            "not-currently-operative",
            "official-co-authentic-enacted-pending-text",
        ),
        ("repealed", "repealed"): (
            "repealed-placeholder",
            "no-longer-in-operation",
            "repealed-placeholder-retained",
            "official-co-authentic-repealed-placeholder",
        ),
        ("omitted", "omittedAsSpent"): (
            "omitted-as-spent-placeholder",
            "no-longer-operative-omitted-as-spent",
            "omitted-as-spent-placeholder-retained",
            "official-co-authentic-omitted-placeholder",
        ),
    }
    key = (source_status, source_reason)
    if key not in mappings:
        raise ValueError(f"Unknown source status pair {key}")
    legal_effect, commencement, current_law, availability = mappings[key]
    applicability = {
        "sourceStatus": source_status,
        "sourceReason": source_reason,
        "commencementStatus": commencement,
        "commencementDate": None,
        "currentLawStatus": current_law,
        "sourceVersionStartDate": {
            "en-HK": english.get("startPeriod"),
            "zh-Hant-HK": chinese.get("startPeriod"),
        },
        "dateBoundaryNote": (
            "HKLM startPeriod values identify the start of the displayed source "
            "version for that language. They are preserved separately and are "
            "not asserted to be the provision's original commencement date."
        ),
    }
    if key == ("pending", "notYetInOperation"):
        applicability["statusNote"] = (
            "The provision is enacted and printed in the current chapter, but "
            "the official source marks it not yet in operation. It must not be "
            "presented as a current compliance duty."
        )
    return legal_effect, commencement, applicability, availability


def source_fragment(base_url: str, provision_type: str, number: str) -> str:
    locator = f"s{number}" if provision_type == "section" else f"sch{number}"
    return f"{base_url}/{locator}"


def source_record(
    element: ET.Element,
    language: str,
    snapshot_file: str,
    snapshot_hash: str,
) -> dict[str, Any]:
    return {
        "xmlId": element.get("id"),
        "temporalId": element.get("temporalId"),
        "sourceStatus": element.get("status"),
        "sourceReason": element.get("reason"),
        "sourceVersionStartDate": element.get("startPeriod"),
        "snapshotFile": snapshot_file,
        "snapshotSha256": snapshot_hash,
        "language": language,
    }


def provision_record(
    english: ET.Element,
    chinese: ET.Element,
    *,
    provision_type: str,
    english_parents: dict[ET.Element, ET.Element],
    chinese_structures: dict[str, ET.Element],
) -> dict[str, Any]:
    if english.get("temporalId") != chinese.get("temporalId"):
        raise ValueError("Provision temporal IDs do not align")

    number = direct_child(english, "num").get("value")  # type: ignore[union-attr]
    chinese_number = direct_child(chinese, "num").get("value")  # type: ignore[union-attr]
    if number != chinese_number:
        raise ValueError(
            f"Bilingual provision number mismatch: {number} != {chinese_number}"
        )

    english_paragraphs = render_container(english, root_provision=True)
    chinese_paragraphs = render_container(chinese, root_provision=True)
    validate_rendered_coverage(english, english_paragraphs, "English")
    validate_rendered_coverage(chinese, chinese_paragraphs, "Traditional Chinese")
    english_full_text = "\n\n".join(english_paragraphs)
    chinese_full_text = "\n\n".join(chinese_paragraphs)

    title, chinese_title, generated_title = display_titles(english, chinese)
    legal_effect, commencement, applicability, availability = status_metadata(
        english,
        chinese,
    )

    if provision_type == "section":
        record_id = f"{INSTRUMENT_ID}-sec-{number.lower()}"
        label = f"Section {number}"
        chinese_label = f"第{number}條"
        english_part = ancestor(english, english_parents, "part")
        english_division = ancestor(english, english_parents, "division")
        chapter = paired_structure_node(english_part, chinese_structures)
        section = paired_structure_node(english_division, chinese_structures)
        structure = {
            "part": deepcopy(chapter),
            "division": deepcopy(section),
            "schedule": None,
        }
    else:
        record_id = f"{INSTRUMENT_ID}-schedule-{number.lower()}"
        label = direct_text(english, "num")
        chinese_label = direct_text(chinese, "num")
        chapter = {
            "id": f"{INSTRUMENT_ID}-schedules",
            "label": "Schedules",
            "title": "Schedules",
            "coAuthenticLabel": "附表",
            "coAuthenticTitle": "附表",
        }
        section = None
        structure = {
            "part": None,
            "division": None,
            "schedule": {
                "id": record_id,
                "label": label,
                "title": title,
                "coAuthenticLabel": chinese_label,
                "coAuthenticTitle": chinese_title,
            },
        }

    english_fragment = source_fragment(
        HKEL_ENGLISH_URL,
        provision_type,
        number,
    )
    chinese_fragment = source_fragment(
        HKEL_CHINESE_URL,
        provision_type,
        number,
    )
    english_source_record = source_record(
        english,
        "en-HK",
        "data/v2/source-snapshots/hk-pdpo-cap486-20221001-en.xml",
        ENGLISH_SOURCE_SHA256,
    )
    chinese_source_record = source_record(
        chinese,
        "zh-Hant-HK",
        "data/v2/source-snapshots/hk-pdpo-cap486-20221001-zh-Hant-HK.xml",
        CHINESE_SOURCE_SHA256,
    )

    status_summary = {
        "in-force": "Official co-authentic current provision text.",
        "enacted-not-yet-in-operation": (
            "Enacted provision retained in the current chapter but not yet in operation."
        ),
        "repealed-placeholder": "Official repealed placeholder retained in source order.",
        "omitted-as-spent-placeholder": (
            "Official omitted-as-spent placeholder retained in source order."
        ),
    }[legal_effect]

    return {
        "id": record_id,
        "instrumentId": INSTRUMENT_ID,
        "provisionType": provision_type,
        "articleNumber": number,
        "label": label,
        "coAuthenticLabel": chinese_label,
        "title": title,
        "originalTitle": chinese_title,
        "coAuthenticTitle": chinese_title,
        "sourceHeading": direct_text(english, "heading") or None,
        "coAuthenticSourceHeading": direct_text(chinese, "heading") or None,
        "displayTitleGeneratedForPlaceholder": generated_title,
        "summary": status_summary,
        "chapter": chapter,
        "section": section,
        "structure": structure,
        "paragraphs": english_paragraphs,
        "fullText": english_full_text,
        "language": "en-HK",
        "defaultLanguage": "en-HK",
        "availableLanguages": ["en-HK", "zh-Hant-HK"],
        "translations": {
            "zh-Hant-HK": {
                "title": chinese_title,
                "label": chinese_label,
                "paragraphs": chinese_paragraphs,
                "fullText": chinese_full_text,
                "language": "zh-Hant-HK",
                "status": "official-co-authentic-equal-status",
                "authorityNote": AUTHENTICITY["authorityNote"],
                "source": chinese_fragment,
                "sourceLabel": (
                    "Hong Kong e-Legislation — official Traditional Chinese text"
                ),
                "contentSha256": sha256_text(chinese_full_text),
                "sourceRecord": chinese_source_record,
            }
        },
        "alignment": {
            "level": "provision",
            "status": "official-temporal-id-aligned-co-authentic-texts",
            "sourceTemporalId": english.get("temporalId"),
            "englishBlockCount": len(english_paragraphs),
            "chineseBlockCount": len(chinese_paragraphs),
            "note": (
                "The official language texts are paired by the common HKLM "
                "temporalId. Different block counts reflect bilingual drafting "
                "structure and do not imply missing text."
            ),
        },
        "authenticity": deepcopy(AUTHENTICITY),
        "textAvailability": availability,
        "legalEffectStatus": legal_effect,
        "commencementStatus": commencement,
        "appliesFrom": None,
        "applicability": applicability,
        "currentEffectiveVersion": None,
        "source": HKEL_ENGLISH_URL,
        "sourceFragment": english_fragment,
        "sourceLabel": "Hong Kong e-Legislation — official English text",
        "sourceDataset": DATASET_URL,
        "sourceFormatStatus": deepcopy(FORMAT_STATUS),
        "sourceRecord": english_source_record,
        "sourceManifest": (
            "data/v2/source-snapshots/hk-pdpo-cap486-source-manifest.json"
        ),
        "retrievedOn": RETRIEVED_ON,
        "versionAsOf": VERSION_DATE,
        "sourceVersion": deepcopy(SOURCE_VERSION),
        "contentSha256": sha256_text(english_full_text),
        "bilingualContentSha256": sha256_text(
            f"{english_full_text}\0{chinese_full_text}"
        ),
        "rights": deepcopy(RIGHTS),
        "textNormalization": {
            "format": "normalised-source-order-block-text",
            "whitespace": "collapsed without changing words or punctuation",
            "tables": "one source row per block; cells separated by ' | '",
            "sourceNotes": "retained",
            "languageGeneration": "none",
        },
    }


def build_records(
    english_path: Path,
    chinese_path: Path,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    english_root, english_bytes = parse_source(
        english_path,
        expected_hash=ENGLISH_SOURCE_SHA256,
        expected_language="en",
        expected_identifier="/hk/cap486!en",
    )
    chinese_root, chinese_bytes = parse_source(
        chinese_path,
        expected_hash=CHINESE_SOURCE_SHA256,
        expected_language="zh-Hant-HK",
        expected_identifier="/hk/cap486!zh-Hant-HK",
    )

    english_sections = main_sections(english_root)
    chinese_sections = temporal_index(main_sections(chinese_root))
    english_schedules = schedules(english_root)
    chinese_schedules = temporal_index(schedules(chinese_root))
    if len(english_sections) != 124 or len(chinese_sections) != 124:
        raise ValueError(
            f"Expected 124 bilingual main sections, got {len(english_sections)} and {len(chinese_sections)}"
        )
    if len(english_schedules) != 6 or len(chinese_schedules) != 6:
        raise ValueError(
            f"Expected 6 bilingual schedules, got {len(english_schedules)} and {len(chinese_schedules)}"
        )

    english_temporal_ids = [element.get("temporalId") for element in english_sections]
    if english_temporal_ids != list(chinese_sections):
        raise ValueError("English and Chinese section source order differs")
    english_schedule_ids = [element.get("temporalId") for element in english_schedules]
    if english_schedule_ids != list(chinese_schedules):
        raise ValueError("English and Chinese schedule source order differs")

    english_parents = parent_map(english_root)
    chinese_structures = temporal_index(
        element
        for element in chinese_root.iter()
        if local_name(element) in {"part", "division"}
    )

    records = [
        provision_record(
            english,
            chinese_sections[english.get("temporalId")],  # type: ignore[index]
            provision_type="section",
            english_parents=english_parents,
            chinese_structures=chinese_structures,
        )
        for english in english_sections
    ]
    records.extend(
        provision_record(
            english,
            chinese_schedules[english.get("temporalId")],  # type: ignore[index]
            provision_type="schedule",
            english_parents=english_parents,
            chinese_structures=chinese_structures,
        )
        for english in english_schedules
    )

    if len(records) != 130 or len({record["id"] for record in records}) != 130:
        raise ValueError("Expected 130 unique provision records")
    status_counts: dict[str, int] = {}
    for record in records:
        status_counts[record["legalEffectStatus"]] = (
            status_counts.get(record["legalEffectStatus"], 0) + 1
        )
    expected_status_counts = {
        "in-force": 126,
        "enacted-not-yet-in-operation": 1,
        "repealed-placeholder": 1,
        "omitted-as-spent-placeholder": 2,
    }
    if status_counts != expected_status_counts:
        raise ValueError(f"Unexpected legal-effect counts: {status_counts}")

    section_33 = next(record for record in records if record["id"].endswith("-sec-33"))
    if section_33["commencementStatus"] != "not-yet-in-operation":
        raise ValueError("Section 33 must remain marked not yet in operation")

    source_summary = {
        "englishBytes": len(english_bytes),
        "chineseBytes": len(chinese_bytes),
        "statusCounts": status_counts,
    }
    return records, source_summary


def corpus_bytes(records: list[dict[str, Any]]) -> bytes:
    return (json.dumps(records, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def build_manifest(
    corpus: bytes,
    source_summary: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "instrumentId": INSTRUMENT_ID,
        "title": "Personal Data (Privacy) Ordinance (Cap. 486)",
        "coAuthenticTitle": "《個人資料(私隱)條例》(第486章)",
        "retrievedOn": RETRIEVED_ON,
        "currentVersionDate": VERSION_DATE,
        "dataset": {
            "name": "Hong Kong e-Legislation — Hong Kong Legislation (Current Version)",
            "provider": "Department of Justice, Hong Kong SAR Government",
            "catalogUrl": DATASET_URL,
            "updateFrequency": "weekly",
            "archiveObservedLastModified": "2026-07-20T13:00:04Z",
        },
        "snapshots": [
            {
                "language": "en-HK",
                "archiveUrl": ENGLISH_ARCHIVE_URL,
                "archiveContentLength": 560465799,
                "archiveEtag": '"21680787-6570a7c1f9d00"',
                "archiveSha256": (
                    "3ad4809050859508fbb58600e26c116317f81bc7cc070dc0a5a055a9755a22d2"
                ),
                "archiveMember": (
                    "cap_486_en_c\\cap_486_20221001000000_en_c.xml"
                ),
                "snapshotFile": (
                    "data/v2/source-snapshots/hk-pdpo-cap486-20221001-en.xml"
                ),
                "snapshotBytes": source_summary["englishBytes"],
                "snapshotSha256": ENGLISH_SOURCE_SHA256,
                "xmlLanguage": "en",
                "xmlIdentifier": "/hk/cap486!en",
            },
            {
                "language": "zh-Hant-HK",
                "archiveUrl": CHINESE_ARCHIVE_URL,
                "archiveContentLength": 551762694,
                "archiveEtag": '"20e33b06-6570a7c1f9d00"',
                "archiveSha256": (
                    "88a510e7ac6c574a5e92ba5d1ea4e6f6c534429c90f46fde5c0a193718eb802e"
                ),
                "archiveMember": (
                    "cap_486_zh-Hant_c\\cap_486_20221001000000_zh-Hant_c.xml"
                ),
                "snapshotFile": (
                    "data/v2/source-snapshots/"
                    "hk-pdpo-cap486-20221001-zh-Hant-HK.xml"
                ),
                "snapshotBytes": source_summary["chineseBytes"],
                "snapshotSha256": CHINESE_SOURCE_SHA256,
                "xmlLanguage": "zh-Hant-HK",
                "xmlIdentifier": "/hk/cap486!zh-Hant-HK",
            },
        ],
        "corpus": {
            "file": "data/v2/hk-pdpo-486-provisions.json",
            "sha256": sha256_bytes(corpus),
            "nodeCount": 130,
            "sectionCount": 124,
            "scheduleCount": 6,
            "legalEffectCounts": source_summary["statusCounts"],
            "defaultLanguage": "en-HK",
            "availableLanguages": ["en-HK", "zh-Hant-HK"],
        },
        "authenticity": deepcopy(AUTHENTICITY),
        "sourceFormatStatus": deepcopy(FORMAT_STATUS),
        "rights": deepcopy(RIGHTS),
        "normalization": {
            "changes": [
                "collapse presentation whitespace",
                "render source-order structural units as text blocks",
                "render table rows with pipe-delimited cells",
                "pair co-authentic provisions using official HKLM temporalId values",
            ],
            "sourceNotesRetained": True,
            "generatedTranslation": False,
            "imagesCopied": False,
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--english-source",
        type=Path,
        default=DEFAULT_ENGLISH_SOURCE,
    )
    parser.add_argument(
        "--chinese-source",
        type=Path,
        default=DEFAULT_CHINESE_SOURCE,
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--manifest-output",
        type=Path,
        default=DEFAULT_MANIFEST_OUTPUT,
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    records, source_summary = build_records(
        args.english_source.resolve(),
        args.chinese_source.resolve(),
    )
    rendered_corpus = corpus_bytes(records)
    manifest = build_manifest(rendered_corpus, source_summary)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.manifest_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(rendered_corpus)
    args.manifest_output.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"{args.output.name}: 130 nodes "
        "(124 sections, 6 schedules; 126 in force, 1 pending, "
        "1 repealed placeholder, 2 omitted-as-spent placeholders)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
