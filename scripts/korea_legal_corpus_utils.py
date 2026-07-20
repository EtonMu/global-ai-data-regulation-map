#!/usr/bin/env python3
"""Helpers for Korean statutes pinned from the MOLEG effective-date API."""

from __future__ import annotations

import copy
import re
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree as ET

from legal_corpus_utils import content_sha256, snapshot_sha256


STATUTORY_TEXT_TAGS = {"조문내용", "항내용", "호내용", "목내용"}


@dataclass(frozen=True)
class KoreanCorpusConfig:
    instrument_id: str
    law_id: str
    mst: str
    official_title: str
    promulgated_on: str
    promulgation_number: str
    effective_phase_date: str
    as_of: str
    current_source_url: str
    current_page_url: str
    source_label: str
    expected_main_article_count: int
    expected_structural_heading_count: int
    expected_supplement_count: int
    expected_article_sequence_sha256: str
    translation_status: str
    translation_reference: dict


def compact_text(value: str | None) -> str:
    """Collapse source indentation without changing statutory characters."""

    if not value:
        return ""
    return re.sub(r"\s+", " ", value.replace("\u00a0", " ")).strip()


def block_text(value: str | None) -> tuple[list[str], str]:
    """Preserve source paragraph breaks while removing XML indentation."""

    if not value:
        return [], ""
    chunks = [
        compact_text(chunk)
        for chunk in re.split(r"\n\s*\n", value.replace("\r\n", "\n"))
        if compact_text(chunk)
    ]
    return chunks, "\n\n".join(chunks)


def element_sha256(element: ET.Element) -> str:
    return content_sha256(ET.tostring(element, encoding="unicode"))


def article_number(element: ET.Element) -> str:
    number = compact_text(element.findtext("조문번호"))
    branch = compact_text(element.findtext("조문가지번호"))
    if not number:
        raise ValueError("Article node has no 조문번호")
    return f"{number}-{branch}" if branch else number


def original_article_label(number: str) -> str:
    if "-" not in number:
        return f"제{number}조"
    base, branch = number.split("-", 1)
    return f"제{base}조의{branch}"


def article_segments(element: ET.Element) -> list[str]:
    segments = [
        compact_text(node.text)
        for node in element.iter()
        if node.tag in STATUTORY_TEXT_TAGS and compact_text(node.text)
    ]
    if not segments:
        raise ValueError(f"{article_number(element)} has no statutory text segments")
    return segments


def article_notes(element: ET.Element) -> list[str]:
    return [
        compact_text(node.text)
        for node in element.findall("조문참고자료")
        if compact_text(node.text)
    ]


def hierarchy_entry(
    instrument_id: str, kind: str, number: str, title: str, original: str
) -> dict:
    return {
        "id": f"{instrument_id}-{kind}-{number}",
        "label": original,
        "title": title,
        "originalTitle": original,
    }


def update_hierarchy(
    instrument_id: str,
    source_heading: str,
    chapter: dict | None,
    section: dict | None,
) -> tuple[dict | None, dict | None]:
    """Apply one MOLEG structural heading, including combined chapter/section rows."""

    normalized = compact_text(source_heading)
    matches = list(
        re.finditer(
            r"제(?P<number>\d+)(?P<kind>장|절)\s+"
            r"(?P<title>.*?)(?=\s+제\d+(?:장|절)\s+|$)",
            normalized,
        )
    )
    if not matches:
        raise ValueError(f"Unrecognized structural heading: {source_heading!r}")
    for match in matches:
        number = match.group("number")
        kind = "chapter" if match.group("kind") == "장" else "section"
        title = match.group("title").strip()
        original = f"제{number}{match.group('kind')} {title}"
        entry = hierarchy_entry(instrument_id, kind, number, title, original)
        if kind == "chapter":
            chapter = entry
            section = None
        else:
            if chapter is None:
                raise ValueError(f"Section occurs before chapter: {source_heading!r}")
            section = entry
    return chapter, section


def article_source_fragment(config: KoreanCorpusConfig, number: str) -> str:
    base, _, branch = number.partition("-")
    jo = f"{int(base):04d}{int(branch or '0'):02d}"
    return (
        "https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw"
        f"&MST={config.mst}&efYd={config.effective_phase_date.replace('-', '')}"
        f"&JO={jo}&type=HTML"
    )


def primary_rights() -> dict:
    return {
        "reuseStatus": "korean-statutory-text-not-copyright-protected",
        "license": "Republic of Korea Copyright Act Article 7; MOLEG public-data policy",
        "licenseUrl": (
            "https://www.law.go.kr/LSW/lawPetitionForm.do?menuId=13&subMenuId=79"
        ),
        "attribution": (
            "Source: Ministry of Government Legislation, Korean Law Information "
            "Center. The Korean promulgated text controls."
        ),
    }


def base_source_version(
    config: KoreanCorpusConfig,
    current_path: Path,
    effective_index_path: Path,
) -> dict:
    return {
        "lawId": config.law_id,
        "masterSequence": config.mst,
        "promulgatedOn": config.promulgated_on,
        "promulgationNumber": config.promulgation_number,
        "effectivePhaseDate": config.effective_phase_date,
        "asOf": config.as_of,
        "sourceDocumentSha256": snapshot_sha256(current_path),
        "effectiveDateIndexSha256": snapshot_sha256(effective_index_path),
        "textState": "current-effective-consolidation-only",
        "futureEffectiveTextIncluded": False,
        "normalization": (
            "MOLEG XML indentation is removed. 조문내용, 항내용, 호내용 and "
            "목내용 are retained once each, in source order; statutory characters "
            "and inline amendment annotations are preserved."
        ),
    }


def validate_current_source(root: ET.Element, config: KoreanCorpusConfig) -> None:
    basic = root.find("기본정보")
    if basic is None:
        raise ValueError("MOLEG XML has no 기본정보")
    expected = {
        "법령ID": config.law_id,
        "법령명_한글": config.official_title,
        "공포일자": config.promulgated_on.replace("-", ""),
        "공포번호": config.promulgation_number,
        "시행일자": config.effective_phase_date.replace("-", ""),
    }
    for tag, value in expected.items():
        actual = compact_text(basic.findtext(tag))
        if actual != value:
            raise ValueError(f"Expected {tag}={value!r}, got {actual!r}")

    nodes = root.findall("./조문/조문단위")
    articles = [node for node in nodes if node.findtext("조문여부") == "조문"]
    headings = [node for node in nodes if node.findtext("조문여부") == "전문"]
    supplements = root.findall("./부칙/부칙단위")
    if len(articles) != config.expected_main_article_count:
        raise ValueError(
            f"Expected {config.expected_main_article_count} Articles, got {len(articles)}"
        )
    if len(headings) != config.expected_structural_heading_count:
        raise ValueError(
            "Expected "
            f"{config.expected_structural_heading_count} structural headings, "
            f"got {len(headings)}"
        )
    if len(supplements) != config.expected_supplement_count:
        raise ValueError(
            f"Expected {config.expected_supplement_count} addenda, got {len(supplements)}"
        )
    sequence = "\n".join(article_number(node) for node in articles)
    if content_sha256(sequence) != config.expected_article_sequence_sha256:
        raise ValueError("Current Article number sequence does not match pinned audit")


def build_current_corpus(
    current_path: Path,
    effective_index_path: Path,
    config: KoreanCorpusConfig,
) -> tuple[list[dict], dict]:
    root = ET.parse(current_path).getroot()
    validate_current_source(root, config)
    source_version = base_source_version(config, current_path, effective_index_path)
    rights = primary_rights()
    corpus: list[dict] = []
    chapter: dict | None = None
    section: dict | None = None
    structural_heading_count = 0

    for node_index, node in enumerate(root.findall("./조문/조문단위"), start=1):
        node_type = compact_text(node.findtext("조문여부"))
        if node_type == "전문":
            chapter, section = update_hierarchy(
                config.instrument_id,
                compact_text(node.findtext("조문내용")),
                chapter,
                section,
            )
            structural_heading_count += 1
            continue
        if node_type != "조문":
            raise ValueError(f"Unexpected 조문여부 {node_type!r} at node {node_index}")
        if chapter is None:
            raise ValueError(f"Article before first chapter at node {node_index}")

        number = article_number(node)
        segments = article_segments(node)
        full_text = "\n\n".join(segments)
        source_title = compact_text(node.findtext("조문제목"))
        deleted = not source_title and "삭제" in segments[0]
        display_title = source_title or ("삭제" if deleted else original_article_label(number))
        original_title = (
            f"{original_article_label(number)}({source_title})"
            if source_title
            else segments[0]
        )
        notes = article_notes(node)
        corpus.append(
            {
                "id": f"{config.instrument_id}-art-{number}",
                "instrumentId": config.instrument_id,
                "unitType": "article",
                "articleNumber": number,
                "label": f"Article {number}",
                "originalLabel": original_article_label(number),
                "title": display_title,
                "originalTitle": original_title,
                "chapter": copy.deepcopy(chapter),
                "section": copy.deepcopy(section),
                "paragraphs": segments,
                "fullText": full_text,
                "sourceNotes": notes,
                "language": "ko-KR",
                "textAvailability": "full-current-official-korean-consolidation",
                "legalEffectStatus": "in-force-current-effective-consolidation",
                "authorityNote": (
                    "The promulgated Korean text controls. MOLEG states that its "
                    "online legal information is reference material and that legal "
                    "effect rests with the Official Gazette text."
                ),
                "versionAsOf": config.as_of,
                "source": config.current_page_url,
                "sourceFragment": article_source_fragment(config, number),
                "sourceLabel": config.source_label,
                "sourceXmlPath": f"조문/조문단위[{node_index}]",
                "sourceNodeKey": node.get("조문키"),
                "retrievedOn": config.as_of,
                "sourceVersion": copy.deepcopy(source_version),
                "sourceNodeSha256": element_sha256(node),
                "contentSha256": content_sha256(full_text),
                "translationStatus": config.translation_status,
                "translationReference": copy.deepcopy(config.translation_reference),
                "rights": copy.deepcopy(rights),
            }
        )

    for supplement_index, node in enumerate(
        root.findall("./부칙/부칙단위"), start=1
    ):
        paragraphs, full_text = block_text(node.findtext("부칙내용"))
        if not full_text:
            raise ValueError(f"Supplement {supplement_index} has no text")
        promulgation_date = compact_text(node.findtext("부칙공포일자"))
        promulgation_number = compact_text(node.findtext("부칙공포번호"))
        original_label = paragraphs[0]
        title_match = re.match(r"(부칙(?:\([^)]*\))?)", original_label)
        original_title = title_match.group(1) if title_match else "부칙"
        corpus.append(
            {
                "id": f"{config.instrument_id}-supp-{supplement_index}",
                "instrumentId": config.instrument_id,
                "unitType": "supplementary-provision-block",
                "supplementNumber": str(supplement_index),
                "label": f"Supplementary Provisions {supplement_index}",
                "originalLabel": original_label,
                "title": "Supplementary Provisions",
                "originalTitle": original_title,
                "amendingActNumber": promulgation_number or None,
                "promulgatedOn": (
                    f"{promulgation_date[:4]}-{promulgation_date[4:6]}-"
                    f"{promulgation_date[6:8]}"
                    if len(promulgation_date) == 8
                    else None
                ),
                "chapter": None,
                "section": None,
                "paragraphs": paragraphs,
                "fullText": full_text,
                "language": "ko-KR",
                "textAvailability": "full-current-official-korean-consolidation",
                "legalEffectStatus": "current-source-addenda-and-transitional-text",
                "authorityNote": (
                    "The promulgated Korean text controls. MOLEG states that its "
                    "online legal information is reference material and that legal "
                    "effect rests with the Official Gazette text."
                ),
                "versionAsOf": config.as_of,
                "source": config.current_page_url,
                "sourceFragment": config.current_page_url,
                "sourceLabel": config.source_label,
                "sourceXmlPath": f"부칙/부칙단위[{supplement_index}]",
                "sourceNodeKey": node.get("부칙키"),
                "retrievedOn": config.as_of,
                "sourceVersion": copy.deepcopy(source_version),
                "sourceNodeSha256": element_sha256(node),
                "contentSha256": content_sha256(full_text),
                "translationStatus": config.translation_status,
                "translationReference": copy.deepcopy(config.translation_reference),
                "rights": copy.deepcopy(rights),
            }
        )

    counts = {
        "nodeCount": len(corpus),
        "mainArticleCount": sum(unit["unitType"] == "article" for unit in corpus),
        "supplementaryProvisionBlockCount": sum(
            unit["unitType"] == "supplementary-provision-block" for unit in corpus
        ),
        "structuralHeadingCount": structural_heading_count,
        "statutoryArticleTextFieldCount": sum(
            len(article_segments(node))
            for node in root.findall("./조문/조문단위")
            if node.findtext("조문여부") == "조문"
        ),
        "articleSourceNoteCount": sum(
            len(article_notes(node))
            for node in root.findall("./조문/조문단위")
            if node.findtext("조문여부") == "조문"
        ),
        "normalizedFullTextCharacterCount": sum(
            len(unit["fullText"]) for unit in corpus
        ),
        "completeSourceCoverageVerified": True,
        "contentSha256": content_sha256(
            "\n\n".join(unit["fullText"] for unit in corpus)
        ),
    }
    return corpus, counts


def snapshot_entry(
    snapshot_dir: Path,
    filename: str,
    source_url: str,
    media_type: str,
    role: str,
    rights_profile: str,
    retrieved_on: str = "2026-07-20",
) -> dict:
    path = snapshot_dir / filename
    if not path.exists():
        raise FileNotFoundError(path)
    return {
        "path": f"data/v2/source-snapshots/{filename}",
        "sourceUrl": source_url,
        "retrievedOn": retrieved_on,
        "mediaType": media_type,
        "role": role,
        "sha256": snapshot_sha256(path),
        "rightsProfile": rights_profile,
    }


def effective_index_records(path: Path, official_title: str) -> list[dict]:
    root = ET.parse(path).getroot()
    records: list[dict] = []
    for node in root.findall("law"):
        if compact_text(node.findtext("법령명한글")) != official_title:
            continue
        records.append(
            {
                "masterSequence": compact_text(node.findtext("법령일련번호")),
                "lifecycleCode": compact_text(node.findtext("현행연혁코드")),
                "promulgatedOn": compact_text(node.findtext("공포일자")),
                "promulgationNumber": compact_text(node.findtext("공포번호")),
                "amendmentType": compact_text(node.findtext("제개정구분명")),
                "effectiveOn": compact_text(node.findtext("시행일자")),
            }
        )
    if not records:
        raise ValueError(f"No effective-date index records for {official_title}")
    return records


def inspect_phase(path: Path, expected_effective_on: str) -> dict:
    root = ET.parse(path).getroot()
    basic = root.find("기본정보")
    if basic is None:
        raise ValueError(f"{path} has no 기본정보")
    actual = compact_text(basic.findtext("시행일자"))
    expected = expected_effective_on.replace("-", "")
    if actual != expected:
        raise ValueError(f"Expected phase {expected}, got {actual}")
    nodes = root.findall("./조문/조문단위")
    article_numbers = [
        article_number(node) for node in nodes if node.findtext("조문여부") == "조문"
    ]
    return {
        "effectiveOn": expected_effective_on,
        "mainArticleCount": len(article_numbers),
        "structuralHeadingCount": sum(
            node.findtext("조문여부") == "전문" for node in nodes
        ),
        "supplementaryProvisionBlockCount": len(
            root.findall("./부칙/부칙단위")
        ),
        "articleNumberSequenceSha256": content_sha256("\n".join(article_numbers)),
        "sourceDocumentSha256": snapshot_sha256(path),
    }
