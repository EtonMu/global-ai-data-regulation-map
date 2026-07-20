#!/usr/bin/env python3
"""Build the complete multilingual Swiss FADP corpus from Fedlex XML.

The importer is deliberately version-locked to the Fedlex consolidation that
has applied since 7 July 2025 (SR 235.1).  German, French and Italian are equal
authoritative texts.  The Federal Chancellery's English text is the interface
default for this project, but is always labelled an official non-authoritative
translation and never treated as controlling law.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT_DIRECTORY = ROOT / "data/v2/source-snapshots"
DEFAULT_OUTPUT = ROOT / "data/v2/ch-fadp-2020-provisions.json"
DEFAULT_MANIFEST_OUTPUT = SNAPSHOT_DIRECTORY / "ch-fadp-20250707-source-manifest.json"

INSTRUMENT_ID = "ch-fadp-2020"
VERSION_DATE = "2025-07-07"
ACT_COMMENCEMENT_DATE = "2023-09-01"
RETRIEVED_ON = "2026-07-20"
AKN_NAMESPACE = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0"

LANGUAGE_ORDER = ("en-CH", "de-CH", "fr-CH", "it-CH")
AUTHORITATIVE_LANGUAGES = ("de-CH", "fr-CH", "it-CH")

LANGUAGE_SOURCES: dict[str, dict[str, Any]] = {
    "de-CH": {
        "code": "de",
        "name": "German",
        "authoritative": True,
        "status": "official-authoritative-equal-status",
        "path": SNAPSHOT_DIRECTORY / "ch-fadp-20250707-de.xml",
        "sha256": "a99bce3dc59a5c3f25e69ed5e483380c0f1a9b57ec452fedb62e0e68b7baabef",
        "uploadDate": "2025-07-08",
        "url": "https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/de/xml/fedlex-data-admin-ch-eli-cc-2022-491-20250707-de-xml-1.xml",
    },
    "fr-CH": {
        "code": "fr",
        "name": "French",
        "authoritative": True,
        "status": "official-authoritative-equal-status",
        "path": SNAPSHOT_DIRECTORY / "ch-fadp-20250707-fr.xml",
        "sha256": "50b609dddcdb8b2b248f498de8e3a5eabfbb9e6d06674daf8fc508ab7393aeb3",
        "uploadDate": "2025-07-08",
        "url": "https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/fr/xml/fedlex-data-admin-ch-eli-cc-2022-491-20250707-fr-xml-1.xml",
    },
    "it-CH": {
        "code": "it",
        "name": "Italian",
        "authoritative": True,
        "status": "official-authoritative-equal-status",
        "path": SNAPSHOT_DIRECTORY / "ch-fadp-20250707-it.xml",
        "sha256": "40d05593c64b46813c4ae1289ccd51717b737fc68b173edafbd2bc824d5fa91f",
        "uploadDate": "2025-07-08",
        "url": "https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/it/xml/fedlex-data-admin-ch-eli-cc-2022-491-20250707-it-xml-1.xml",
    },
    "en-CH": {
        "code": "en",
        "name": "English",
        "authoritative": False,
        "status": "official-non-authoritative-translation",
        "path": SNAPSHOT_DIRECTORY / "ch-fadp-20250707-en.xml",
        "sha256": "47d871be5cfc9a7668ae13fd513ca19851c29df76d0ed6fdd861e09f32d8fe82",
        "uploadDate": "2025-08-14",
        "url": "https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/en/xml/fedlex-data-admin-ch-eli-cc-2022-491-20250707-en-xml.xml",
    },
}

VERSION_HISTORY = [
    {
        "dateApplicability": "2023-09-01",
        "dateEndApplicability": "2025-03-31",
        "eli": "https://fedlex.data.admin.ch/eli/cc/2022/491/20230901",
    },
    {
        "dateApplicability": "2025-04-01",
        "dateEndApplicability": "2025-07-06",
        "eli": "https://fedlex.data.admin.ch/eli/cc/2022/491/20250401",
        "changeNote": (
            "Article 24 paragraph 5bis, concerning forwarding a breach "
            "notification to the National Cyber Security Centre, entered "
            "into force on 1 April 2025."
        ),
    },
    {
        "dateApplicability": VERSION_DATE,
        "dateEndApplicability": None,
        "eli": "https://fedlex.data.admin.ch/eli/cc/2022/491/20250707",
        "changeNote": (
            "The Federal Assembly Drafting Committee correction published "
            "on 7 July 2025 concerns the Italian text of Article 57 only."
        ),
    },
]

AUTHENTICITY = {
    "status": "three-co-authoritative-texts-plus-official-non-authoritative-english",
    "authoritativeLanguages": list(AUTHORITATIVE_LANGUAGES),
    "authoritativeLanguageStatus": "equal-and-legally-binding",
    "translationLanguages": ["en-CH"],
    "englishStatus": "official-non-authoritative-translation-no-legal-force",
    "authorityUrl": "https://www.bk.admin.ch/en/languages",
    "englishStatusUrl": "https://www.bk.admin.ch/en/english",
    "authorityNote": (
        "The Federal Chancellery states that German, French and Italian "
        "versions of federal laws are equal and legally binding. It also "
        "states that English legislative versions have no legal force."
    ),
    "xmlMetadataCaveat": (
        "The shared FRBRWork element in each Akoma Ntoso file contains "
        "FRBRauthoritative=true. That work-level flag is not used to promote "
        "the English expression to an authoritative language text."
    ),
}

RIGHTS = {
    "reuseStatus": "official-linked-open-data-reuse-authorised",
    "rightsHolder": "Swiss Federal Chancellery",
    "rightsHolderEli": "https://fedlex.data.admin.ch/vocabulary/legal-institution/2",
    "reuseInformationUrl": "https://www.fedlex.admin.ch/de/broadcasters",
    "openDataInformationUrl": "https://fedlex.data.admin.ch/",
    "attribution": (
        "Source: Fedlex, Swiss Federal Chancellery, SR 235.1, consolidation "
        "applicable from 7 July 2025, retrieved 20 July 2026. The importer "
        "normalises whitespace, separates official editorial notes from "
        "operative text, and aligns language texts by official Akoma Ntoso "
        "eId. No endorsement by the Swiss Confederation is implied."
    ),
    "conditionsNote": (
        "Fedlex describes its legal texts and metadata as reusable for "
        "commercial and other purposes under its technical and legal "
        "information for third-party users."
    ),
}

FORMAT_STATUS = {
    "snapshotFormat": "official-Fedlex-Akoma-Ntoso-XML",
    "sourceCollection": "Classified Compilation (consolidated federal law)",
    "systematicReference": "SR 235.1",
    "normalisation": {
        "whitespace": "collapsed without changing words or punctuation",
        "blockStructure": "paragraph and list-item boundaries rendered as JSON blocks",
        "editorialNotes": "preserved separately in sourceNotes, not mixed into operative fullText",
        "tables": "none present in the frozen current FADP snapshots",
        "languageGeneration": "none",
    },
}

SOURCE_VERSION = {
    "eli": "https://fedlex.data.admin.ch/eli/cc/2022/491/20250707",
    "fedlexPage": "https://www.fedlex.admin.ch/eli/cc/2022/491/en",
    "systematicReference": "235.1",
    "adoptedOn": "2020-09-25",
    "actCommencementDate": ACT_COMMENCEMENT_DATE,
    "currentConsolidationDate": VERSION_DATE,
    "currentConsolidationOpenEndedAsOf": RETRIEVED_ON,
    "versionDateIsCommencementDate": False,
    "versionBoundaryNote": (
        "Fedlex dateApplicability 2025-07-07 identifies the current "
        "consolidation version. It is not the Act's commencement date and "
        "must not be copied into provision appliesFrom fields."
    ),
    "consolidationHistory": deepcopy(VERSION_HISTORY),
}

CONCEPT_IDS: dict[str, list[str]] = {
    "art_1": ["data-subject-rights"],
    "art_2": ["accountability-governance"],
    "art_3": ["accountability-governance"],
    "art_4": ["accountability-governance"],
    "art_5": ["incident-response"],
    "art_6": [
        "lawfulness-consent-choice",
        "purpose-limitation",
        "data-minimization",
        "retention-deletion-lifecycle",
    ],
    "art_7": ["privacy-by-design-default", "data-minimization"],
    "art_8": ["security-controls"],
    "art_9": ["accountability-governance", "security-controls"],
    "art_10": ["accountability-governance"],
    "art_11": ["accountability-governance"],
    "art_12": ["accountability-governance"],
    "art_13": ["accountability-governance"],
    "art_14": ["accountability-governance"],
    "art_15": ["accountability-governance", "transparency-explainability"],
    "art_16": ["cross-border-transfer", "accountability-governance"],
    "art_17": ["cross-border-transfer", "lawfulness-consent-choice"],
    "art_18": ["cross-border-transfer"],
    "art_19": ["transparency-explainability", "data-subject-rights"],
    "art_20": ["transparency-explainability", "data-subject-rights"],
    "art_21": [
        "automated-decision-safeguards",
        "human-oversight",
        "transparency-explainability",
        "data-subject-rights",
    ],
    "art_22": ["impact-assessment", "accountability-governance"],
    "art_23": ["impact-assessment", "accountability-governance"],
    "art_24": ["incident-response", "security-controls"],
    "art_25": ["data-subject-rights", "transparency-explainability"],
    "art_26": ["data-subject-rights", "transparency-explainability"],
    "art_27": ["data-subject-rights"],
    "art_28": ["data-subject-rights"],
    "art_29": ["data-subject-rights"],
    "art_30": ["lawfulness-consent-choice"],
    "art_31": ["lawfulness-consent-choice"],
    "art_32": ["data-subject-rights", "retention-deletion-lifecycle"],
    "art_33": ["accountability-governance"],
    "art_34": ["lawfulness-consent-choice", "accountability-governance"],
    "art_35": ["accountability-governance"],
    "art_36": [
        "lawfulness-consent-choice",
        "data-subject-rights",
        "retention-deletion-lifecycle",
    ],
    "art_37": ["data-subject-rights"],
    "art_39": [
        "data-minimization",
        "purpose-limitation",
        "retention-deletion-lifecycle",
    ],
    "art_41": ["data-subject-rights", "retention-deletion-lifecycle"],
    "art_42": ["data-subject-rights", "transparency-explainability"],
    "art_49": ["accountability-governance"],
    "art_50": ["accountability-governance"],
    "art_51": [
        "accountability-governance",
        "cross-border-transfer",
        "privacy-by-design-default",
        "security-controls",
        "impact-assessment",
        "incident-response",
        "data-subject-rights",
    ],
    "art_53": ["accountability-governance"],
    "art_54": ["accountability-governance"],
    "art_55": ["cross-border-transfer", "accountability-governance"],
    "art_56": ["accountability-governance"],
    "art_57": ["transparency-explainability", "accountability-governance"],
    "art_58": ["accountability-governance", "data-subject-rights"],
    "art_59": ["accountability-governance", "cross-border-transfer", "impact-assessment"],
    "art_60": [
        "accountability-governance",
        "transparency-explainability",
        "automated-decision-safeguards",
        "data-subject-rights",
    ],
    "art_61": ["accountability-governance", "security-controls", "cross-border-transfer"],
    "art_62": ["accountability-governance"],
    "art_63": ["accountability-governance"],
    "art_64": ["accountability-governance"],
    "art_67": ["cross-border-transfer", "accountability-governance"],
    "art_69": ["privacy-by-design-default", "impact-assessment"],
}

KEY_SUMMARIES = {
    "art_7": (
        "Requires controllers to embed appropriate technical and organisational "
        "data-protection measures from the planning stage and to use defaults "
        "that limit processing to the minimum needed for the intended purpose."
    ),
    "art_8": (
        "Requires controllers and processors to use risk-appropriate technical "
        "and organisational measures to secure personal data and prevent breaches."
    ),
    "art_16": (
        "Permits disclosure abroad on the basis of an adequacy decision or, in "
        "its absence, specified safeguards such as treaties, clauses, standard "
        "clauses or binding corporate rules."
    ),
    "art_17": (
        "Sets defined exceptions for disclosure abroad when Article 16's normal "
        "adequacy or safeguards route is unavailable."
    ),
    "art_21": (
        "Requires notice of qualifying solely automated individual decisions and "
        "normally provides an opportunity to state a position and obtain review "
        "by a natural person."
    ),
    "art_22": (
        "Requires a prior data protection impact assessment where planned "
        "processing is likely to create a high risk, including specified uses of "
        "new technologies and large-scale sensitive-data processing."
    ),
    "art_23": (
        "Requires prior consultation with the FDPIC when high residual risk "
        "remains after the measures identified through the impact assessment, "
        "subject to the statutory data-protection-officer route."
    ),
    "art_24": (
        "Requires rapid notification of qualifying high-risk data security "
        "breaches, processor-to-controller notice and, where required, notice to "
        "affected individuals; paragraph 5bis has applied since 1 April 2025."
    ),
}

REVISION_METADATA: dict[str, dict[str, Any]] = {
    "art_24": {
        "revisionStatus": "current-consolidated-text-with-later-inserted-paragraph",
        "amendmentHistory": [
            {
                "locator": "paragraph 5bis",
                "changeType": "inserted",
                "effectiveFrom": "2025-04-01",
                "sourceAct": (
                    "Federal Act of 29 September 2023 introducing a reporting "
                    "obligation for cyberattacks on critical infrastructure"
                ),
                "officialReferences": ["AS 2024 257", "AS 2025 168", "AS 2025 173"],
            }
        ],
    },
    "art_43": {
        "revisionStatus": "current-consolidated-amended-text",
        "amendmentHistory": [
            {
                "locators": ["paragraph 3, sentences 2–4", "paragraph 3bis"],
                "changeType": "inserted",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_44": {
        "revisionStatus": "current-consolidated-amended-text",
        "amendmentHistory": [
            {
                "locator": "paragraph 2",
                "changeType": "replaced",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_44_a": {
        "revisionStatus": "current-consolidated-inserted-article",
        "amendmentHistory": [
            {
                "locator": "Article 44a",
                "changeType": "inserted",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_47": {
        "revisionStatus": "current-consolidated-amended-text",
        "amendmentHistory": [
            {
                "locator": "paragraph 2",
                "changeType": "replaced",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_47_a": {
        "revisionStatus": "current-consolidated-inserted-article",
        "amendmentHistory": [
            {
                "locator": "Article 47a",
                "changeType": "inserted",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_57": {
        "revisionStatus": "current-consolidation-with-italian-text-correction",
        "amendmentHistory": [
            {
                "locator": "Italian text of Article 57",
                "changeType": "language-text-correction-not-new-commencement",
                "publishedOn": "2025-07-07",
                "effectiveFrom": None,
                "officialReference": "AS 2025 444",
            }
        ],
    },
    "art_72": {
        "revisionStatus": "current-consolidated-amended-transitional-text",
        "amendmentHistory": [
            {
                "locator": "paragraph 2",
                "changeType": "inserted",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
    "art_72_a": {
        "revisionStatus": "current-consolidated-inserted-transitional-article",
        "amendmentHistory": [
            {
                "locator": "Article 72a",
                "changeType": "inserted",
                "effectiveFrom": "2023-09-01",
                "officialReference": "AS 2023 231",
            }
        ],
    },
}

TRANSITION_METADATA: dict[str, dict[str, Any]] = {
    "art_7": {
        "sourceArticle": "69",
        "status": "subject-to-legacy-processing-transition",
        "note": (
            "Article 69 makes Article 7 inapplicable to processing begun before "
            "commencement when the purpose remains unchanged and no new data are obtained."
        ),
    },
    "art_22": {
        "sourceArticle": "69",
        "status": "subject-to-legacy-processing-transition",
        "note": (
            "Article 69 makes Article 22 inapplicable to processing begun before "
            "commencement when the purpose remains unchanged and no new data are obtained."
        ),
    },
    "art_23": {
        "sourceArticle": "69",
        "status": "subject-to-legacy-processing-transition",
        "note": (
            "Article 69 makes Article 23 inapplicable to processing begun before "
            "commencement when the purpose remains unchanged and no new data are obtained."
        ),
    },
    "art_69": {
        "status": "in-force-transitional-rule",
        "note": "Legacy-processing transition for Articles 7, 22 and 23.",
    },
    "art_70": {
        "status": "in-force-transitional-rule",
        "note": "Transition for investigations and appeals pending at commencement.",
    },
    "art_71": {
        "status": "in-force-time-limited-transitional-rule-as-of-2026-07-20",
        "periodStartsOn": ACT_COMMENCEMENT_DATE,
        "calculatedLastDay": "2028-08-31",
        "calculationNote": (
            "The date is an editorial calculation of the Article's express "
            "five-year period, not a Fedlex consolidation or commencement date."
        ),
    },
    "art_72": {
        "status": "transitional-rule-retained-in-current-consolidation",
        "note": "Its first paragraph is expressly bounded by the legislative period of commencement.",
    },
    "art_72_a": {
        "status": "transitional-rule-retained-in-current-consolidation",
        "note": "Applies to the Commissioner's employment relationship established under former law.",
    },
}

KNOWN_LANGUAGE_DIVERGENCES: dict[str, dict[str, Any]] = {
    "annex_2": {
        "type": "official-English-cross-reference-differs-from-authoritative-texts",
        "englishSourceText": "(Art. 68)",
        "authoritativeSourceTexts": {
            "de-CH": "(Art. 73)",
            "fr-CH": "(art. 73)",
            "it-CH": "(art. 73)",
        },
        "controllingReference": "Article 73",
        "sourceTextAltered": False,
        "note": (
            "The frozen official English translation says '(Art. 68)'. The "
            "three equal authoritative texts say Article 73, and Article 73 "
            "of the Act identifies Annex 2. The corpus preserves the English "
            "source verbatim and exposes this warning instead of silently "
            "editing a non-authoritative official translation."
        ),
    }
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u00a0", " ").replace("\u200b", " ")).strip()


def text_without_notes(element: ET.Element | None) -> str:
    if element is None:
        return ""
    pieces: list[str] = []

    def visit(node: ET.Element) -> None:
        if node.text:
            pieces.append(node.text)
        for child in node:
            child_name = local_name(child)
            if child_name == "authorialNote":
                pass
            elif child_name == "br":
                pieces.append(" ")
            else:
                visit(child)
            if child.tail:
                pieces.append(child.tail)

    visit(element)
    return normalize_text("".join(pieces))


def full_element_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return normalize_text("".join(element.itertext()))


def direct_child(element: ET.Element, name: str) -> ET.Element | None:
    return next((child for child in element if local_name(child) == name), None)


def direct_text(element: ET.Element, name: str) -> str:
    return text_without_notes(direct_child(element, name))


def first_descendant(element: ET.Element, name: str) -> ET.Element | None:
    return next((node for node in element.iter() if local_name(node) == name), None)


def canonical_text(value: str) -> str:
    return re.sub(r"\s+", "", value)


def extract_source_notes(element: ET.Element) -> list[str]:
    notes: list[str] = []
    for node in element.iter():
        if local_name(node) != "authorialNote":
            continue
        value = full_element_text(node)
        if value and value not in notes:
            notes.append(value)
    return notes


def render_block_list(block_list: ET.Element) -> list[str]:
    blocks: list[str] = []
    for child in block_list:
        name = local_name(child)
        if name == "authorialNote":
            continue
        if name == "listIntroduction":
            value = text_without_notes(child)
            if value:
                blocks.append(value)
            continue
        if name != "item":
            value = text_without_notes(child)
            if value:
                blocks.append(value)
            continue

        item_number = direct_text(child, "num")
        item_blocks: list[str] = []
        for item_child in child:
            item_name = local_name(item_child)
            if item_name in {"num", "authorialNote"}:
                continue
            if item_name == "blockList":
                item_blocks.extend(render_block_list(item_child))
            elif item_name == "content":
                item_blocks.extend(render_content(item_child))
            else:
                value = text_without_notes(item_child)
                if value:
                    item_blocks.append(value)
        if not item_blocks and item_number:
            item_blocks = [item_number]
        elif item_number:
            item_blocks[0] = normalize_text(f"{item_number} {item_blocks[0]}")
        blocks.extend(item_blocks)
    return blocks


def render_content(content: ET.Element) -> list[str]:
    blocks: list[str] = []
    for child in content:
        name = local_name(child)
        if name == "authorialNote":
            continue
        if name == "blockList":
            blocks.extend(render_block_list(child))
        elif name == "content":
            blocks.extend(render_content(child))
        else:
            value = text_without_notes(child)
            if value:
                blocks.append(value)
    if not blocks:
        value = text_without_notes(content)
        if value:
            blocks.append(value)
    return blocks


def render_paragraph(paragraph: ET.Element) -> list[str]:
    paragraph_number = direct_text(paragraph, "num")
    content = direct_child(paragraph, "content")
    blocks = render_content(content) if content is not None else []
    if not blocks:
        value = text_without_notes(paragraph)
        if value:
            blocks = [value]
    if paragraph_number and blocks:
        blocks[0] = normalize_text(f"{paragraph_number} {blocks[0]}")
    return blocks


def hierarchy_node(element: ET.Element, language: str) -> dict[str, Any]:
    source_eid = element.get("eId", "")
    return {
        "id": f"{INSTRUMENT_ID}-{source_eid.replace('/', '-').replace('_', '-').lower()}",
        "sourceEid": source_eid,
        "label": direct_text(element, "num"),
        "title": direct_text(element, "heading"),
        "language": language,
    }


def number_from_eid(source_eid: str) -> str:
    match = re.fullmatch(r"art_(\d+)(?:_([a-z]+))?", source_eid)
    if not match:
        raise ValueError(f"Unexpected article eId: {source_eid}")
    return match.group(1) + (match.group(2) or "")


def parse_article(
    article: ET.Element,
    language: str,
    chapter: dict[str, Any] | None,
    section: dict[str, Any] | None,
) -> dict[str, Any]:
    source_eid = article.get("eId", "")
    number = number_from_eid(source_eid)
    label = direct_text(article, "num") or f"Art. {number}"
    source_heading = direct_text(article, "heading")
    title = source_heading or f"Article {number}"
    blocks: list[str] = []
    for child in article:
        if local_name(child) == "paragraph":
            blocks.extend(render_paragraph(child))
    if not blocks:
        raise ValueError(f"Article {source_eid} has no operative blocks in {language}")
    full_text = "\n\n".join(blocks)

    source_operational = text_without_notes(article)
    reconstructed = " ".join([label, source_heading, *blocks])
    if canonical_text(source_operational) != canonical_text(reconstructed):
        raise ValueError(f"Operative-text coverage mismatch for {source_eid} in {language}")

    spec = LANGUAGE_SOURCES[language]
    expression = f"https://fedlex.data.admin.ch/eli/cc/2022/491/{VERSION_DATE.replace('-', '')}/{spec['code']}"
    return {
        "sourceEid": source_eid,
        "articleNumber": number,
        "label": label,
        "title": title,
        "sourceHeading": source_heading or None,
        "displayTitleGeneratedForUntitledArticle": not bool(source_heading),
        "paragraphs": blocks,
        "fullText": full_text,
        "contentSha256": sha256_text(full_text),
        "sourceNotes": extract_source_notes(article),
        "structure": {
            "chapter": deepcopy(chapter),
            "section": deepcopy(section),
            "annex": None,
        },
        "language": language,
        "status": spec["status"],
        "authoritative": spec["authoritative"],
        "sourceExpression": expression,
        "sourceSubdivision": f"https://fedlex.data.admin.ch/eli/cc/2022/491/{source_eid}/{spec['code']}",
    }


def parse_articles(root: ET.Element, language: str) -> list[dict[str, Any]]:
    body = next((node for node in root.iter() if local_name(node) == "body"), None)
    if body is None:
        raise ValueError(f"No Act body in {language} source")
    records: list[dict[str, Any]] = []

    def walk(
        container: ET.Element,
        chapter: dict[str, Any] | None = None,
        section: dict[str, Any] | None = None,
    ) -> None:
        for child in container:
            name = local_name(child)
            if name == "chapter":
                walk(child, hierarchy_node(child, language), None)
            elif name == "section":
                walk(child, chapter, hierarchy_node(child, language))
            elif name == "article":
                records.append(parse_article(child, language, chapter, section))

    walk(body)
    return records


def render_annex_content(element: ET.Element) -> list[str]:
    blocks: list[str] = []
    for child in element:
        name = local_name(child)
        if name in {"heading", "authorialNote"}:
            continue
        if name == "blockList":
            blocks.extend(render_block_list(child))
        elif name == "content":
            blocks.extend(render_content(child))
        elif name == "level":
            blocks.extend(render_annex_content(child))
        else:
            value = text_without_notes(child)
            if value:
                blocks.append(value)
    return blocks


def parse_annexes(root: ET.Element, language: str) -> list[dict[str, Any]]:
    documents = [
        node
        for node in root.iter()
        if local_name(node) == "doc" and node.get("name") == "annex"
    ]
    annexes: list[dict[str, Any]] = []
    spec = LANGUAGE_SOURCES[language]
    for index, document in enumerate(documents, start=1):
        preface = direct_child(document, "preface")
        main_body = direct_child(document, "mainBody")
        if preface is None or main_body is None:
            raise ValueError(f"Malformed Annex {index} in {language}")
        label = text_without_notes(preface)
        level = next((node for node in main_body if local_name(node) == "level"), None)
        if level is None:
            raise ValueError(f"Annex {index} has no level in {language}")
        source_eid = level.get("eId", "")
        title = direct_text(level, "heading") or f"Annex {index}"

        leading_blocks = [
            text_without_notes(node)
            for node in main_body
            if local_name(node) == "p" and text_without_notes(node)
        ]
        content_blocks = render_annex_content(level)
        blocks = [*leading_blocks, *content_blocks]
        if not blocks:
            blocks = [title]
        full_text = "\n\n".join(blocks)

        reconstructed = " ".join([label, *leading_blocks, title, *content_blocks])
        source_operational = " ".join(
            [text_without_notes(preface), text_without_notes(main_body)]
        )
        if canonical_text(source_operational) != canonical_text(reconstructed):
            raise ValueError(f"Operative-text coverage mismatch for Annex {index} in {language}")

        expression = f"https://fedlex.data.admin.ch/eli/cc/2022/491/{VERSION_DATE.replace('-', '')}/{spec['code']}"
        annexes.append(
            {
                "sourceEid": f"annex_{index}",
                "sourceLevelEid": source_eid,
                "articleNumber": str(index),
                "label": label,
                "title": title,
                "sourceHeading": title,
                "displayTitleGeneratedForUntitledArticle": False,
                "paragraphs": blocks,
                "fullText": full_text,
                "contentSha256": sha256_text(full_text),
                "sourceNotes": extract_source_notes(document),
                "structure": {
                    "chapter": None,
                    "section": None,
                    "annex": {
                        "id": f"{INSTRUMENT_ID}-annex-{index}",
                        "sourceEid": f"annex_{index}",
                        "label": label,
                        "title": title,
                        "language": language,
                    },
                },
                "language": language,
                "status": spec["status"],
                "authoritative": spec["authoritative"],
                "sourceExpression": expression,
                "sourceSubdivision": f"https://fedlex.data.admin.ch/eli/cc/2022/491/annex/{index}",
            }
        )
    return annexes


def parse_source(path: Path, language: str) -> dict[str, Any]:
    spec = LANGUAGE_SOURCES[language]
    source_bytes = path.read_bytes()
    actual_hash = sha256_bytes(source_bytes)
    if actual_hash != spec["sha256"]:
        raise ValueError(
            f"{language} snapshot hash mismatch: expected {spec['sha256']}, got {actual_hash}"
        )
    root = ET.fromstring(source_bytes)
    if local_name(root) != "akomaNtoso" or not root.tag.startswith(f"{{{AKN_NAMESPACE}}}"):
        raise ValueError(f"Unexpected XML vocabulary for {language}")

    act = first_descendant(root, "act")
    if act is None:
        raise ValueError(f"No Act in {language} snapshot")
    identification = first_descendant(act, "identification")
    work = direct_child(identification, "FRBRWork") if identification is not None else None
    expression = direct_child(identification, "FRBRExpression") if identification is not None else None
    if work is None or expression is None:
        raise ValueError(f"Missing Fedlex FRBR metadata in {language}")

    work_dates = {
        node.get("name"): node.get("date")
        for node in work
        if local_name(node) == "FRBRdate"
    }
    if work_dates.get("jolux:dateApplicability") != VERSION_DATE:
        raise ValueError(f"Wrong consolidation version in {language}")
    if work_dates.get("jolux:dateEntryInForce") != ACT_COMMENCEMENT_DATE:
        raise ValueError(f"Wrong Act commencement metadata in {language}")
    expression_language = first_descendant(expression, "FRBRlanguage")
    if expression_language is None or expression_language.get("language") != spec["code"]:
        raise ValueError(f"Wrong expression language in {language}")

    articles = parse_articles(root, language)
    annexes = parse_annexes(root, language)
    expected_set = {f"art_{number}" for number in range(1, 75)} | {
        "art_44_a",
        "art_47_a",
        "art_72_a",
    }
    actual_set = {record["sourceEid"] for record in articles}
    if actual_set != expected_set or len(articles) != 77:
        raise ValueError(
            f"Unexpected Article coverage in {language}: {len(articles)} nodes"
        )
    if len(annexes) != 2:
        raise ValueError(f"Unexpected Annex coverage in {language}: {len(annexes)}")

    return {
        "language": language,
        "articles": articles,
        "annexes": annexes,
        "snapshotSha256": actual_hash,
        "snapshotBytes": len(source_bytes),
    }


def translation_payload(version: dict[str, Any]) -> dict[str, Any]:
    return {
        "language": version["language"],
        "status": version["status"],
        "authoritative": version["authoritative"],
        "label": version["label"],
        "title": version["title"],
        "sourceHeading": version["sourceHeading"],
        "paragraphs": deepcopy(version["paragraphs"]),
        "fullText": version["fullText"],
        "contentSha256": version["contentSha256"],
        "sourceNotes": deepcopy(version["sourceNotes"]),
        "structure": deepcopy(version["structure"]),
        "sourceRecord": {
            "sourceEid": version["sourceEid"],
            "sourceLevelEid": version.get("sourceLevelEid"),
            "sourceExpression": version["sourceExpression"],
            "sourceSubdivision": version["sourceSubdivision"],
            "dateApplicability": VERSION_DATE,
            "dateEntryInForce": ACT_COMMENCEMENT_DATE,
        },
    }


def applicability_for(source_eid: str) -> dict[str, Any]:
    if source_eid == "art_24":
        return {
            "commencementStatus": "in-force-mixed-commencement",
            "commencementDate": None,
            "generalActCommencementDate": ACT_COMMENCEMENT_DATE,
            "laterInsertedProvision": {
                "locator": "paragraph 5bis",
                "effectiveFrom": "2025-04-01",
            },
            "sourceConsolidationDate": VERSION_DATE,
            "sourceConsolidationDateIsCommencement": False,
        }
    return {
        "commencementStatus": "in-force",
        "commencementDate": ACT_COMMENCEMENT_DATE,
        "generalActCommencementDate": ACT_COMMENCEMENT_DATE,
        "sourceConsolidationDate": VERSION_DATE,
        "sourceConsolidationDateIsCommencement": False,
    }


def record_id(source_eid: str) -> str:
    if source_eid.startswith("art_"):
        return f"{INSTRUMENT_ID}-art-{number_from_eid(source_eid).lower()}"
    match = re.fullmatch(r"annex_(\d+)", source_eid)
    if not match:
        raise ValueError(f"Unexpected source node id: {source_eid}")
    return f"{INSTRUMENT_ID}-annex-{match.group(1)}"


def assemble_records(parsed: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    language_maps: dict[str, dict[str, dict[str, Any]]] = {}
    language_order: dict[str, list[str]] = {}
    for language in LANGUAGE_ORDER:
        versions = [*parsed[language]["articles"], *parsed[language]["annexes"]]
        language_maps[language] = {version["sourceEid"]: version for version in versions}
        language_order[language] = [version["sourceEid"] for version in versions]
    baseline = language_order["en-CH"]
    for language in LANGUAGE_ORDER:
        if language_order[language] != baseline:
            raise ValueError(f"Language node order/alignment differs for {language}")

    snapshot_records = [
        {
            "language": language,
            "path": f"data/v2/source-snapshots/{LANGUAGE_SOURCES[language]['path'].name}",
            "sha256": LANGUAGE_SOURCES[language]["sha256"],
            "source": LANGUAGE_SOURCES[language]["url"],
            "status": LANGUAGE_SOURCES[language]["status"],
        }
        for language in LANGUAGE_ORDER
    ]

    records: list[dict[str, Any]] = []
    for source_eid in baseline:
        versions = {language: language_maps[language][source_eid] for language in LANGUAGE_ORDER}
        english = versions["en-CH"]
        provision_type = "article" if source_eid.startswith("art_") else "annex"
        concepts = deepcopy(CONCEPT_IDS.get(source_eid, []))
        applicability = applicability_for(source_eid)
        applies_from = (
            None if applicability["commencementStatus"] == "in-force-mixed-commencement"
            else applicability["commencementDate"]
        )
        revision = deepcopy(
            REVISION_METADATA.get(
                source_eid,
                {
                    "revisionStatus": "current-consolidated-base-text",
                    "amendmentHistory": [],
                },
            )
        )
        translations = {
            language: translation_payload(versions[language])
            for language in AUTHORITATIVE_LANGUAGES
        }
        multilingual_hash_input = "\0".join(
            versions[language]["fullText"] for language in LANGUAGE_ORDER
        )
        known_divergence = deepcopy(KNOWN_LANGUAGE_DIVERGENCES.get(source_eid))
        article_number = english["articleNumber"]
        record = {
            "id": record_id(source_eid),
            "instrumentId": INSTRUMENT_ID,
            "provisionType": provision_type,
            "articleNumber": article_number,
            "label": english["label"],
            "title": english["title"],
            "sourceHeading": english["sourceHeading"],
            "displayTitleGeneratedForUntitledArticle": english[
                "displayTitleGeneratedForUntitledArticle"
            ],
            "authoritativeTitles": {
                language: versions[language]["title"]
                for language in AUTHORITATIVE_LANGUAGES
            },
            "summary": KEY_SUMMARIES.get(
                source_eid,
                (
                    f"Official current consolidated text of {english['label']}: "
                    f"{english['title']}."
                ),
            ),
            "chapter": deepcopy(english["structure"]["chapter"]),
            "section": deepcopy(english["structure"]["section"]),
            "structure": deepcopy(english["structure"]),
            "language": "en-CH",
            "defaultLanguage": "en-CH",
            "defaultLanguageStatus": "official-non-authoritative-translation",
            "availableLanguages": list(LANGUAGE_ORDER),
            "authoritativeLanguages": list(AUTHORITATIVE_LANGUAGES),
            "paragraphs": deepcopy(english["paragraphs"]),
            "fullText": english["fullText"],
            "contentSha256": english["contentSha256"],
            "sourceNotes": deepcopy(english["sourceNotes"]),
            "translations": translations,
            "multilingualContentSha256": sha256_text(multilingual_hash_input),
            "alignment": {
                "status": (
                    "official-Akoma-Ntoso-eId-aligned-with-disclosed-textual-divergence"
                    if known_divergence
                    else "official-Akoma-Ntoso-eId-aligned"
                ),
                "sourceEid": source_eid,
                "coverage": "complete-four-language-node-alignment",
                "manualTranslation": False,
                "knownLanguageDivergence": known_divergence,
            },
            "translationAudit": {
                "englishVersionAlignedToCurrentConsolidation": True,
                "englishAuthoritative": False,
                "knownTextualDivergence": known_divergence,
            },
            "authenticity": deepcopy(AUTHENTICITY),
            "legalEffectStatus": (
                "in-force-transitional"
                if source_eid in {"art_69", "art_70", "art_71", "art_72", "art_72_a"}
                else "in-force"
            ),
            "commencementStatus": applicability["commencementStatus"],
            "appliesFrom": applies_from,
            "versionAsOf": VERSION_DATE,
            "applicability": applicability,
            "transition": deepcopy(TRANSITION_METADATA.get(source_eid)),
            "revisionStatus": revision["revisionStatus"],
            "amendmentHistory": revision["amendmentHistory"],
            "conceptIds": concepts,
            "highlightForThemes": bool(concepts),
            "relevanceStatus": (
                "direct-ai-data-security-privacy-relevance"
                if concepts
                else "contextual-data-protection-statute-provision"
            ),
            "textAvailability": "official-current-consolidated-multilingual-full-text",
            "source": english["sourceExpression"],
            "sourceSubdivision": english["sourceSubdivision"],
            "sourceRecord": {
                "sourceEid": source_eid,
                "sourceLevelEid": english.get("sourceLevelEid"),
                "sourceExpression": english["sourceExpression"],
                "sourceSubdivision": english["sourceSubdivision"],
                "dateApplicability": VERSION_DATE,
                "dateEntryInForce": ACT_COMMENCEMENT_DATE,
                "languageStatus": "official-non-authoritative-translation",
            },
            "sourceSnapshots": deepcopy(snapshot_records),
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": deepcopy(SOURCE_VERSION),
            "rights": deepcopy(RIGHTS),
            "formatStatus": deepcopy(FORMAT_STATUS),
        }
        records.append(record)
    return records


def build_manifest(
    parsed: dict[str, dict[str, Any]],
    corpus_bytes: bytes,
) -> dict[str, Any]:
    snapshots = []
    for language in LANGUAGE_ORDER:
        spec = LANGUAGE_SOURCES[language]
        snapshots.append(
            {
                "language": language,
                "languageName": spec["name"],
                "authorityStatus": spec["status"],
                "authoritative": spec["authoritative"],
                "path": f"data/v2/source-snapshots/{spec['path'].name}",
                "sourceUrl": spec["url"],
                "snapshotSha256": parsed[language]["snapshotSha256"],
                "snapshotBytes": parsed[language]["snapshotBytes"],
                "fedlexUploadDate": spec["uploadDate"],
                "dateApplicability": VERSION_DATE,
                "dateEntryInForce": ACT_COMMENCEMENT_DATE,
            }
        )
    return {
        "schemaVersion": "1.0.0",
        "instrumentId": INSTRUMENT_ID,
        "generatedBy": "scripts/import-swiss-fadp.py",
        "generatedOn": RETRIEVED_ON,
        "retrievedOn": RETRIEVED_ON,
        "currentVersionDate": VERSION_DATE,
        "actCommencementDate": ACT_COMMENCEMENT_DATE,
        "versionDateIsCommencementDate": False,
        "versionDiscovery": {
            "checkedAsOf": RETRIEVED_ON,
            "officialSparqlEndpoint": "https://fedlex.data.admin.ch/sparqlendpoint",
            "queryPurpose": (
                "List every jolux:Consolidation that isMemberOf the FADP "
                "ConsolidationAbstract, with dateApplicability and optional "
                "dateEndApplicability."
            ),
            "result": deepcopy(VERSION_HISTORY),
            "currentVersionMetadata": (
                "https://fedlex.data.admin.ch/eli/cc/2022/491/20250707"
            ),
        },
        "authenticity": deepcopy(AUTHENTICITY),
        "englishSynchronisation": {
            "sameConsolidationVersion": True,
            "dateApplicability": VERSION_DATE,
            "articleCoverageAligned": 77,
            "annexCoverageAligned": 2,
            "englishFedlexUploadDate": LANGUAGE_SOURCES["en-CH"]["uploadDate"],
            "authoritativeTextsFedlexUploadDate": "2025-07-08",
            "status": (
                "official-current-version-and-structure-aligned-"
                "non-authoritative-translation-with-disclosed-cross-reference-defect"
            ),
            "knownTextualDivergences": deepcopy(KNOWN_LANGUAGE_DIVERGENCES),
            "note": (
                "English was uploaded after the three authoritative texts but "
                "embodies the same 2025-07-07 consolidation and includes all "
                "77 Articles, both Annexes, Article 24 paragraph 5bis and the "
                "Article 57 Italian-correction note. Version and structural "
                "alignment do not make English authoritative and do not cure "
                "the disclosed Annex 2 cross-reference defect."
            ),
        },
        "snapshots": snapshots,
        "corpus": {
            "path": "data/v2/ch-fadp-2020-provisions.json",
            "sha256": sha256_bytes(corpus_bytes),
            "bytes": len(corpus_bytes),
            "nodeCount": 79,
            "articleCount": 77,
            "annexCount": 2,
            "languageCount": 4,
        },
        "rights": deepcopy(RIGHTS),
        "formatStatus": deepcopy(FORMAT_STATUS),
        "integrationBoundary": {
            "englishDefault": True,
            "englishMustDisplayNonAuthoritativeWarning": True,
            "authoritativeTexts": list(AUTHORITATIVE_LANGUAGES),
            "preserveFields": [
                "translations",
                "authenticity",
                "sourceNotes",
                "applicability",
                "revisionStatus",
                "amendmentHistory",
                "transition",
            ],
            "dateRule": (
                "Never use currentVersionDate/dateApplicability as a "
                "commencement date. Article 24 is a mixed-commencement node."
            ),
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    for language in LANGUAGE_ORDER:
        parser.add_argument(
            f"--{language.split('-')[0]}-source",
            type=Path,
            default=LANGUAGE_SOURCES[language]["path"],
            help=f"Frozen official {LANGUAGE_SOURCES[language]['name']} Fedlex XML",
        )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest-output", type=Path, default=DEFAULT_MANIFEST_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_arguments = {
        "en-CH": args.en_source,
        "de-CH": args.de_source,
        "fr-CH": args.fr_source,
        "it-CH": args.it_source,
    }
    parsed = {
        language: parse_source(path.resolve(), language)
        for language, path in source_arguments.items()
    }
    records = assemble_records(parsed)
    corpus_bytes = (json.dumps(records, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    manifest = build_manifest(parsed, corpus_bytes)
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.manifest_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(corpus_bytes)
    args.manifest_output.write_bytes(manifest_bytes)
    print(
        f"{args.output.name}: {len(records)} nodes "
        "(77 Articles, 2 Annexes; 3 authoritative languages + "
        "1 official non-authoritative English translation)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
