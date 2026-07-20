#!/usr/bin/env python3
"""Build source-locked California and Colorado AI legislative corpora.

California SB 1047 is deliberately represented only as the enrolled 2024 bill
that Governor Newsom vetoed on 29 September 2024.  Nothing emitted by this
importer describes that proposal as current law or as imposing a current duty.

The Colorado corpus represents the law as rewritten by SB 26-189, chapter 131
of the 2026 Session Laws.  SB 24-205 and SB 25B-004 are retained only in the
version lineage: SB 26-189 repealed and reenacted Part 17.  The importer also
keeps the Act's immediate-effect subdivisions separate from its 1 January 2027
general effective and applicability date.

Colorado publishes the session law as a PDF.  Its embedded text layer has the
correct character stream but occasionally omits visual word spaces.  This
importer therefore projects *only whitespace boundaries* from a separately
frozen Tesseract reading onto the PDF text-layer character stream.  OCR
characters are never substituted for official-PDF text-layer characters.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from copy import deepcopy
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "v2"
SNAPSHOT_ROOT = DATA_ROOT / "source-snapshots"
DEFAULT_CA_OUTPUT = DATA_ROOT / "us-ca-sb1047-2024-provisions.json"
DEFAULT_CO_OUTPUT = DATA_ROOT / "us-co-ai-act-current-provisions.json"
DEFAULT_MANIFEST_OUTPUT = DATA_ROOT / "us-state-ai-laws-corpus-manifest.json"
RETRIEVED_ON = "2026-07-20"

CA_ENROLLED = SNAPSHOT_ROOT / "us-ca-sb1047-2024-enrolled.html"
CA_STATUS = SNAPSHOT_ROOT / "us-ca-sb1047-2024-official-status.html"
CO_2024_SIGNED = SNAPSHOT_ROOT / "us-co-sb24-205-signed-act.pdf"
CO_2024_SESSION = SNAPSHOT_ROOT / "us-co-sb24-205-ch198-session-law.pdf"
CO_2024_PAGE = SNAPSHOT_ROOT / "us-co-sb24-205-official-bill-page.html"
CO_2025_SESSION = SNAPSHOT_ROOT / "us-co-sb25b-004-ch3-session-law.pdf"
CO_2025_PAGE = SNAPSHOT_ROOT / "us-co-sb25b-004-official-bill-page.html"
CO_2026_SESSION = SNAPSHOT_ROOT / "us-co-sb26-189-ch131-session-law.pdf"
CO_2026_PAGE = SNAPSHOT_ROOT / "us-co-sb26-189-official-bill-page.html"
CO_2026_RAW = SNAPSHOT_ROOT / "us-co-sb26-189-ch131-pdftotext-raw.txt"
CO_2026_OCR = SNAPSHOT_ROOT / "us-co-sb26-189-ch131-tesseract-ocr.txt"


EXPECTED_SNAPSHOT_HASHES = {
    CA_ENROLLED: "d227db35f91a123dd0461b91fed474527250ea4ec7c064b38750fe497751c80a",
    CA_STATUS: "7ef92362a9a960dd92c03de3b4810784878f853865161ffa876a1aa9d57b6146",
    CO_2024_SIGNED: "78e005452a2a05176618c4b84f2b772d14b47eb1b8e556414a40fe49fae98d77",
    CO_2024_SESSION: "2814096f203618c2f7e9aaff9e121af67df8efcd6edfa56c5cba22835c074138",
    CO_2024_PAGE: "b05762879e252c16a88dc2f34d45ec5e6743ac7fc248d6b4b83dff6dc5e35c39",
    CO_2025_SESSION: "6f4342c93258b78f67e69e63516489eb6f4b97aa5766ab0235d7fdb1a4138733",
    CO_2025_PAGE: "17ef476efc54e2e470be0d022b8deb8664b381e030a25492b415d1c572af6511",
    CO_2026_SESSION: "cba54050dcbe4b4da65868b218ff1bdb264d08e5856e6919b6713562a730a973",
    CO_2026_PAGE: "a93fa1874d2af42b1ba2e2fed01d21cdfde50c16a21c35780b076bde435300ea",
    CO_2026_RAW: "83a049df84c96939952760d098b43bc78e986c1eb9741d34062428f37740a78c",
    CO_2026_OCR: "58b5fc9b85803bb58e3f6092faf623dd94c286abf143fc43ad8f5713efde26d5",
}


CA_SOURCE_URL = (
    "https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?"
    "bill_id=202320240SB1047&version=20230SB104788ENR"
)
CA_STATUS_URL = (
    "https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?"
    "bill_id=202320240SB1047"
)
CO_2024_SIGNED_URL = "https://leg.colorado.gov/bill_files/47770/download"
CO_2024_SESSION_URL = "https://leg.colorado.gov/laws/session-laws/SB24-205/198/download"
CO_2024_PAGE_URL = "https://leg.colorado.gov/bills/sb24-205"
CO_2025_SESSION_URL = "https://leg.colorado.gov/laws/session-laws/SB25B-004/3/download"
CO_2025_PAGE_URL = "https://leg.colorado.gov/bills/sb25b-004"
CO_2026_SESSION_URL = "https://leg.colorado.gov/laws/session-laws/SB26-189/131/download"
CO_2026_PAGE_URL = "https://leg.colorado.gov/bills/SB26-189"


CA_RIGHTS = {
    "reuseStatus": "public-domain-california-legislative-information",
    "basis": "California Government Code § 10248.5",
    "basisUrl": "https://leginfo.legislature.ca.gov/",
    "attribution": (
        "Source: California Legislative Information, enrolled SB 1047 "
        "(2023-2024), version 20230SB104788ENR, and official bill-status "
        "record, retrieved 20 July 2026."
    ),
    "scopeNote": (
        "The California Legislative Information site states that the "
        "information described in Government Code § 10248(a), including "
        "bill text, history, status, and veto messages, is in the public domain."
    ),
}

CO_RIGHTS = {
    "reuseStatus": "official-public-legislative-record-license-not-asserted",
    "rightsHolder": "State of Colorado",
    "license": None,
    "attribution": (
        "Source: Colorado General Assembly, Session Laws of Colorado 2026, "
        "chapter 131 (SB 26-189), with official legislative-history records "
        "for SB 24-205 and SB 25B-004, retrieved 20 July 2026."
    ),
    "conditionsNote": (
        "This research corpus reproduces official public legislative records "
        "with source attribution. It makes no independent public-domain or "
        "open-license conclusion for Colorado state works."
    ),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical(value: str) -> str:
    return " ".join(value.split())


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def assert_snapshot_hashes() -> None:
    for path, expected in EXPECTED_SNAPSHOT_HASHES.items():
        actual = sha256(path)
        if actual != expected:
            raise ValueError(
                f"Frozen source hash mismatch for {path.relative_to(ROOT)}: "
                f"expected {expected}, received {actual}"
            )


class CaliforniaBillBodyParser(HTMLParser):
    """Extract block text only from the official ``div#bill`` element."""

    BLOCK_TAGS = {"div", "p", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.bill_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "div" and attributes.get("id") == "bill":
            self.bill_depth = 1
        elif self.bill_depth and tag == "div":
            self.bill_depth += 1
        if self.bill_depth and tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if self.bill_depth and tag in self.BLOCK_TAGS:
            self.parts.append("\n")
        if self.bill_depth and tag == "div":
            self.bill_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.bill_depth:
            self.parts.append(data)


CA_MARKERS = (
    "SECTION 1.",
    "SEC. 2.",
    "SEC. 3.",
    "22602.",
    "22603.",
    "22604.",
    "22606.",
    "22607.",
    "22608.",
    "22609.",
    "SEC. 4.",
    "11547.6.",
    "SEC. 5.",
    "11547.6.1.",
    "SEC. 6.",
    "SEC. 7.",
    "SEC. 8.",
)


CA_UNIT_META: dict[str, dict[str, Any]] = {
    "__preamble__": {
        "id": "us-ca-sb1047-2024-enacting-formula",
        "label": "Enacting formula",
        "title": "Enacting formula",
        "unitType": "enacting-formula",
        "articleNumber": "Preamble",
        "billSection": None,
        "summary": "Records the enrolled bill's formal enacting formula.",
    },
    "SECTION 1.": {
        "id": "us-ca-sb1047-2024-sec-1",
        "label": "SECTION 1",
        "title": "Short title",
        "unitType": "bill-section",
        "articleNumber": "1",
        "billSection": "1",
        "summary": "Would have supplied the proposal's short title.",
    },
    "SEC. 2.": {
        "id": "us-ca-sb1047-2024-sec-2",
        "label": "SEC. 2",
        "title": "Legislative findings",
        "unitType": "bill-section",
        "articleNumber": "2",
        "billSection": "2",
        "summary": "Sets out the Legislature's findings on AI benefits, catastrophic risks, human controls, and access to compute.",
    },
    "SEC. 3.": {
        "id": "us-ca-sb1047-2024-sec-3-enacting",
        "label": "SEC. 3",
        "title": "Proposed addition of Business and Professions Code Chapter 22.6",
        "unitType": "bill-section-enacting-clause",
        "articleNumber": "3",
        "billSection": "3",
        "summary": "Would have added the frontier-model chapter to the Business and Professions Code.",
    },
    "22602.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22602",
        "label": "Proposed BPC § 22602",
        "title": "Definitions",
        "unitType": "proposed-code-section",
        "articleNumber": "22602",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have defined covered models, critical harm, safety incidents, compute thresholds, and related terms.",
    },
    "22603.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22603",
        "label": "Proposed BPC § 22603",
        "title": "Developer safety, security, audit, and incident duties",
        "unitType": "proposed-code-section",
        "articleNumber": "22603",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have required cybersecurity controls, shutdown capability, safety protocols, annual audits, and safety-incident reporting.",
    },
    "22604.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22604",
        "label": "Proposed BPC § 22604",
        "title": "Computing-cluster customer controls",
        "unitType": "proposed-code-section",
        "articleNumber": "22604",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have imposed customer identification, assessment, recordkeeping, and shutdown capability duties on computing-cluster operators.",
    },
    "22606.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22606",
        "label": "Proposed BPC § 22606",
        "title": "Attorney General enforcement",
        "unitType": "proposed-code-section",
        "articleNumber": "22606",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have authorized civil penalties, damages, injunctions, and other Attorney General remedies.",
    },
    "22607.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22607",
        "label": "Proposed BPC § 22607",
        "title": "Employee disclosures and anti-retaliation safeguards",
        "unitType": "proposed-code-section",
        "articleNumber": "22607",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have protected specified employee safety disclosures and required internal reporting channels.",
    },
    "22608.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22608",
        "label": "Proposed BPC § 22608",
        "title": "Cumulative duties and remedies",
        "unitType": "proposed-code-section",
        "articleNumber": "22608",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have preserved duties, rights, and remedies available under other law.",
    },
    "22609.": {
        "id": "us-ca-sb1047-2024-proposed-bpc-22609",
        "label": "Proposed BPC § 22609",
        "title": "Federal preemption",
        "unitType": "proposed-code-section",
        "articleNumber": "22609",
        "billSection": "3",
        "code": "California Business and Professions Code",
        "summary": "Would have limited the proposed chapter to the extent not preempted by federal law.",
    },
    "SEC. 4.": {
        "id": "us-ca-sb1047-2024-sec-4-enacting",
        "label": "SEC. 4",
        "title": "Proposed addition of Government Code § 11547.6",
        "unitType": "bill-section-enacting-clause",
        "articleNumber": "4",
        "billSection": "4",
        "summary": "Would have added the proposed Board of Frontier Models provision to the Government Code.",
    },
    "11547.6.": {
        "id": "us-ca-sb1047-2024-proposed-gov-11547-6",
        "label": "Proposed Government Code § 11547.6",
        "title": "Board of Frontier Models",
        "unitType": "proposed-code-section",
        "articleNumber": "11547.6",
        "billSection": "4",
        "code": "California Government Code",
        "summary": "Would have established the Board of Frontier Models and assigned oversight, audit, guidance, and regulatory functions.",
    },
    "SEC. 5.": {
        "id": "us-ca-sb1047-2024-sec-5-enacting",
        "label": "SEC. 5",
        "title": "Proposed addition of Government Code § 11547.6.1",
        "unitType": "bill-section-enacting-clause",
        "articleNumber": "5",
        "billSection": "5",
        "summary": "Would have added the proposed CalCompute consortium provision to the Government Code.",
    },
    "11547.6.1.": {
        "id": "us-ca-sb1047-2024-proposed-gov-11547-6-1",
        "label": "Proposed Government Code § 11547.6.1",
        "title": "CalCompute consortium and framework",
        "unitType": "proposed-code-section",
        "articleNumber": "11547.6.1",
        "billSection": "5",
        "code": "California Government Code",
        "summary": "Would have created a consortium to develop a framework for a public cloud computing cluster called CalCompute.",
    },
    "SEC. 6.": {
        "id": "us-ca-sb1047-2024-sec-6",
        "label": "SEC. 6",
        "title": "Severability",
        "unitType": "bill-section",
        "articleNumber": "6",
        "billSection": "6",
        "summary": "Would have made the proposal's provisions severable.",
    },
    "SEC. 7.": {
        "id": "us-ca-sb1047-2024-sec-7",
        "label": "SEC. 7",
        "title": "Liberal construction",
        "unitType": "bill-section",
        "articleNumber": "7",
        "billSection": "7",
        "summary": "Would have directed liberal construction to effectuate the proposal's purposes.",
    },
    "SEC. 8.": {
        "id": "us-ca-sb1047-2024-sec-8",
        "label": "SEC. 8",
        "title": "Public-access limitation findings",
        "unitType": "bill-section",
        "articleNumber": "8",
        "billSection": "8",
        "summary": "Explains the proposed limits on public access to unredacted safety protocols and audit reports.",
    },
}


CA_CONCEPTS = {
    "us-ca-sb1047-2024-sec-2": [
        "frontier-model-safety",
        "human-oversight",
        "security-controls",
        "accountability-governance",
    ],
    "us-ca-sb1047-2024-sec-3-enacting": ["frontier-model-safety"],
    "us-ca-sb1047-2024-proposed-bpc-22602": [
        "frontier-model-safety",
        "security-controls",
        "incident-response",
    ],
    "us-ca-sb1047-2024-proposed-bpc-22603": [
        "frontier-model-safety",
        "security-controls",
        "ai-risk-management",
        "incident-response",
        "continuous-assurance",
        "third-party-supply-chain",
        "accountability-governance",
    ],
    "us-ca-sb1047-2024-proposed-bpc-22604": [
        "security-controls",
        "accountability-governance",
        "retention-deletion-lifecycle",
    ],
    "us-ca-sb1047-2024-proposed-bpc-22606": [
        "accountability-governance",
        "continuous-assurance",
    ],
    "us-ca-sb1047-2024-proposed-bpc-22607": [
        "incident-response",
        "accountability-governance",
    ],
    "us-ca-sb1047-2024-proposed-bpc-22608": ["accountability-governance"],
    "us-ca-sb1047-2024-proposed-bpc-22609": ["global-coordination"],
    "us-ca-sb1047-2024-sec-4-enacting": ["frontier-model-safety"],
    "us-ca-sb1047-2024-proposed-gov-11547-6": [
        "frontier-model-safety",
        "accountability-governance",
        "continuous-assurance",
        "security-controls",
    ],
    "us-ca-sb1047-2024-proposed-gov-11547-6-1": [
        "accountability-governance",
        "frontier-model-safety",
    ],
    "us-ca-sb1047-2024-sec-8": [
        "transparency-explainability",
        "security-controls",
    ],
}


def extract_california_segments() -> tuple[list[dict[str, Any]], str]:
    parser = CaliforniaBillBodyParser()
    parser.feed(CA_ENROLLED.read_text(encoding="utf-8"))
    lines = [
        canonical(line.replace("\xa0", " "))
        for line in "".join(parser.parts).splitlines()
    ]
    lines = [line for line in lines if line]
    if not lines or not lines[0].startswith("The people of the State of California"):
        raise ValueError("California enrolled bill body was not found")

    # The official HTML occasionally uses nested display blocks to wrap a
    # printed line in the middle of a sentence.  Rejoin only those visual wraps;
    # legal subdivision markers and sentences ending in operative punctuation
    # remain separate paragraphs.
    merged_lines: list[str] = []
    for line in lines:
        starts_legal_unit = bool(
            line in CA_MARKERS
            or re.match(r"^\((?:\d+|[a-zA-Z]|[IVXLCDM]+)\)\s", line)
        )
        if (
            merged_lines
            and not starts_legal_unit
            and merged_lines[-1] not in CA_MARKERS
            and not re.search(r"[.!?;:]$", merged_lines[-1])
        ):
            merged_lines[-1] += " " + line
        else:
            merged_lines.append(line)
    lines = merged_lines

    segments: list[dict[str, Any]] = []
    marker = "__preamble__"
    body: list[str] = []
    bill_section: str | None = None

    def flush() -> None:
        if body:
            segments.append(
                {
                    "marker": marker,
                    "billSection": bill_section,
                    "paragraphs": list(body),
                }
            )

    for line in lines:
        if line in CA_MARKERS:
            flush()
            marker = line
            body = []
            section_match = re.fullmatch(r"(?:SECTION|SEC\.) (\d+)\.", line)
            if section_match:
                bill_section = section_match.group(1)
            continue
        body.append(line)
    flush()

    expected = ["__preamble__", *CA_MARKERS]
    actual = [segment["marker"] for segment in segments]
    if actual != expected:
        raise ValueError(f"Unexpected California source-unit order: {actual}")
    if any(not segment["paragraphs"] for segment in segments):
        raise ValueError("California source unit with no text")

    reconstructed = "\n".join(
        (
            ("" if segment["marker"] == "__preamble__" else segment["marker"] + "\n")
            + "\n".join(segment["paragraphs"])
        )
        for segment in segments
    )
    return segments, reconstructed


def build_california() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    status_html = CA_STATUS.read_text(encoding="utf-8")
    required_status_fragments = (
        "09/29/24",
        "Vetoed by the Governor.",
        "I am returning Senate Bill 1047 without my signature.",
        "For these reasons, I cannot sign this bill.",
    )
    for fragment in required_status_fragments:
        if fragment not in status_html:
            raise ValueError(f"Missing California lifecycle evidence: {fragment}")

    segments, reconstructed = extract_california_segments()
    records: list[dict[str, Any]] = []
    source_version = {
        "legislativeSession": "2023-2024",
        "billNumber": "SB 1047",
        "versionCode": "20230SB104788ENR",
        "versionLabel": "Enrolled",
        "versionPublishedOn": "2024-09-03",
        "presentedToGovernorOn": "2024-09-09",
        "vetoedOn": "2024-09-29",
        "terminalStatus": "vetoed-never-enacted",
        "enrolledHtmlSha256": sha256(CA_ENROLLED),
        "officialStatusHtmlSha256": sha256(CA_STATUS),
    }
    banner = (
        "Historical enrolled bill — vetoed by the Governor on 29 September "
        "2024; never enacted, never commenced, and imposes no current duties."
    )

    for segment in segments:
        meta = deepcopy(CA_UNIT_META[segment["marker"]])
        full_text = "\n\n".join(segment["paragraphs"])
        concept_ids = CA_CONCEPTS.get(meta["id"], [])
        proposed_dates = sorted(
            set(
                re.findall(
                    r"(?:January|February|March|April|May|June|July|August|"
                    r"September|October|November|December) \d{1,2}, \d{4}",
                    full_text,
                )
            )
        )
        record = {
            "id": meta.pop("id"),
            "instrumentId": "us-ca-sb-1047-2024",
            **meta,
            "sourceUnitMarker": (
                None if segment["marker"] == "__preamble__" else segment["marker"]
            ),
            "sourceBillSection": segment["billSection"],
            "paragraphs": segment["paragraphs"],
            "fullText": full_text,
            "contentSha256": sha256_text(full_text),
            "language": "en-US",
            "availableLanguages": ["en-US"],
            "textAvailability": "complete-official-enrolled-bill-body-text",
            "lifecycleStatus": "failed-vetoed",
            "legalEffectStatus": "not-enacted-vetoed-historical-bill",
            "commencementStatus": "never-commenced",
            "historicalOnly": True,
            "appliesFrom": None,
            "versionAsOf": "2024-09-29",
            "statusVerifiedThrough": RETRIEVED_ON,
            "statusBanner": banner,
            "neverTookEffectDueToVeto": True,
            "proposedDates": proposed_dates,
            "source": CA_SOURCE_URL,
            "sourceLabel": "California Legislative Information — enrolled bill text",
            "statusSource": CA_STATUS_URL,
            "statusSourceLabel": "California Legislative Information — official bill status and veto message",
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": deepcopy(source_version),
            "conceptIds": list(concept_ids),
            "topicRelevance": {
                "highlighted": bool(concept_ids),
                "coreConceptIds": list(concept_ids),
                "reviewStatus": "manually-reviewed-proposed-provision-to-core-concept",
                "legalEffectCaveat": "Concept links describe a vetoed proposal, not current legal obligations.",
            },
            "rights": deepcopy(CA_RIGHTS),
        }
        records.append(record)

    meta = {
        "sourceBodyCanonicalSha256": sha256_text(canonical(reconstructed)),
        "orderedSourceUnitIds": [record["id"] for record in records],
        "billSectionCount": 8,
        "proposedCodeSectionCount": 9,
        "nodeCount": len(records),
    }
    return records, meta


def clean_colorado_extraction(value: str) -> str:
    lines: list[str] = []
    skip_legend_tail = 0
    for source_line in value.replace("\f", "\n").splitlines():
        line = canonical(source_line)
        if not line:
            continue
        if re.fullmatch(
            r"(?:Ch\. 131 Consumer and Commercial Transactions \d+|"
            r"\d+ Consumer and Commercial Transactions Ch\. 131)",
            line,
        ):
            continue
        if line == ")))))":
            skip_legend_tail = 2
            continue
        if skip_legend_tail:
            skip_legend_tail -= 1
            continue
        if line.startswith(
            "Capital letters or bold & italic numbers indicate new material added"
        ):
            skip_legend_tail = 1
            continue
        lines.append(line)
    return "\n".join(lines)


def character_stream_and_boundaries(value: str) -> tuple[str, set[int]]:
    characters: list[str] = []
    boundaries: set[int] = set()
    pending_space = False
    for character in value:
        if character.isspace():
            pending_space = bool(characters)
            continue
        if pending_space and characters:
            boundaries.add(len(characters) - 1)
        characters.append(character)
        pending_space = False
    return "".join(characters), boundaries


def project_ocr_spaces(raw_value: str, ocr_value: str) -> tuple[str, float]:
    """Return raw characters with OCR word boundaries; never copy OCR chars."""

    raw_chars, _raw_boundaries = character_stream_and_boundaries(raw_value)
    ocr_chars, ocr_boundaries = character_stream_and_boundaries(ocr_value)
    matcher = SequenceMatcher(None, raw_chars, ocr_chars, autojunk=False)
    ocr_to_raw: dict[int, int] = {}
    for tag, raw_start, raw_end, ocr_start, ocr_end in matcher.get_opcodes():
        if tag != "equal":
            continue
        for offset in range(raw_end - raw_start):
            ocr_to_raw[ocr_start + offset] = raw_start + offset
    # OCR boundaries, rather than PDF text-layer boundaries, control spacing.
    # The PDF's character stream sometimes inserts visual tracking spaces in a
    # single printed word (for example the emphasized phrase in § 6-1-1707(7)).
    boundaries: set[int] = set()
    for ocr_index in ocr_boundaries:
        raw_left = ocr_to_raw.get(ocr_index)
        raw_right = ocr_to_raw.get(ocr_index + 1)
        if raw_left is not None and raw_right == raw_left + 1:
            boundaries.add(raw_left)

    rendered: list[str] = []
    for index, character in enumerate(raw_chars):
        rendered.append(character)
        if index in boundaries and index + 1 < len(raw_chars):
            rendered.append(" ")
    text = canonical("".join(rendered))
    text = re.sub(r"\s+([,.;:?!])", r"\1", text)
    text = re.sub(r"([([])\s+", r"\1", text)
    text = re.sub(r"\s+([])])", r"\1", text)

    # These are visually unambiguous word boundaries missed (or, for LA WS,
    # falsely inserted) by both automated readings.  Every repair is
    # whitespace-only and is checked against the controlling PDF character
    # stream below; no letter, number, or punctuation is changed.
    spacing_repairs = (
        ("ADECISION", "A DECISION"),
        ("ACOVERED", "A COVERED"),
        ("ADEVELOPER", "A DEVELOPER"),
        ("ADEPLOYER", "A DEPLOYER"),
        ("AINDIVIDUAL", "A INDIVIDUAL"),
        ("ADMTOUTPUT", "ADMT OUTPUT"),
        ("ADMT'SOUTPUTS", "ADMT'S OUTPUTS"),
        ("ISUSED", "IS USED"),
        ("ISBEING", "IS BEING"),
        ("PRIVACYACTOF", "PRIVACY ACT OF"),
        ("STATEOR", "STATE OR"),
        ("DURINGITS", "DURING ITS"),
        ("EXISTINGLAW", "EXISTING LAW"),
        ("SECTIONS6-", "SECTIONS 6-"),
        ("U.S.C.SEC.", "U.S.C. SEC."),
        ("U.S.C.SECS.", "U.S.C. SECS."),
        (" TO1320d", " TO 1320d"),
        ("6-1-1704OR", "6-1-1704 OR"),
        ("section1of", "section 1 of"),
        ("LA WS", "LAWS"),
    )
    before_repair_stream = re.sub(r"\s+", "", text)
    for before, after in spacing_repairs:
        text = text.replace(before, after)
    if re.sub(r"\s+", "", text) != before_repair_stream:
        raise ValueError("Colorado spacing repair changed a non-whitespace character")
    return text, matcher.ratio()


CO_SEGMENT_META: tuple[dict[str, Any], ...] = (
    {
        "key": "preamble",
        "marker": "Be it enacted by the General Assembly of the State of Colorado:",
        "id": "us-co-ai-act-2026-enacting-formula",
        "label": "Enacting formula",
        "title": "Enacting formula",
        "unitType": "enacting-formula",
        "articleNumber": "Preamble",
        "stripPrefix": None,
        "summary": "Records the 2026 session law's formal enacting formula.",
        "commencement": "immediate-no-independent-duty",
    },
    {
        "key": "sec-1-wrapper",
        "marker": "SECTION 1.",
        "id": "us-co-ai-act-2026-sec-1-enacting",
        "label": "SECTION 1",
        "title": "Repeal and reenactment of Part 17",
        "unitType": "session-law-enacting-clause",
        "articleNumber": "1",
        "stripPrefix": "SECTION 1.",
        "summary": "Repeals and reenacts Part 17 of article 1 of title 6 as automated decision-making technology law.",
        "commencement": "mixed",
    },
    {
        "key": "6-1-1701",
        "marker": "6-1-1701.",
        "id": "us-co-ai-act-current-6-1-1701",
        "label": "C.R.S. § 6-1-1701",
        "title": "Definitions",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1701",
        "stripPrefix": "6-1-1701. Definitions.",
        "summary": "Defines ADMT, consequential decisions, covered domains, deployers, developers, meaningful human review, and related terms.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-1702",
        "marker": "6-1-1702.",
        "id": "us-co-ai-act-current-6-1-1702",
        "label": "C.R.S. § 6-1-1702",
        "title": "Developer responsibilities — documentation",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1702",
        "stripPrefix": "6-1-1702. Developer responsibilities - documentation.",
        "summary": "Requires developer documentation, update notices, use instructions, training-data categories, limitations, and three-year records.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-1703",
        "marker": "6-1-1703.",
        "id": "us-co-ai-act-current-6-1-1703",
        "label": "C.R.S. § 6-1-1703",
        "title": "Deployer record keeping",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1703",
        "stripPrefix": "6-1-1703. Deployer record keeping.",
        "summary": "Requires deployers to retain compliance records for at least three years after a consequential decision.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-1704",
        "marker": "6-1-1704.",
        "id": "us-co-ai-act-current-6-1-1704",
        "label": "C.R.S. § 6-1-1704",
        "title": "Deployer disclosures and post-adverse-outcome notice",
        "sourceHeading": "Deployer disclosures - point-of-interaction notice - public posting option - post-adverse outcome disclosures - legislative declaration - trade secrets - compliance with other law - accessibility - rules",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1704",
        "stripPrefix": "6-1-1704. Deployer disclosures - point-of-interaction notice - public posting option - post-adverse outcome disclosures - legislative declaration - trade secrets - compliance with other law - accessibility - rules.",
        "summary": "Requires point-of-interaction notice and post-adverse-outcome explanations and directs rulemaking on disclosure content.",
        "commencement": "mixed",
        "immediateSubdivisions": ["6-1-1704(4)"],
    },
    {
        "key": "6-1-1705",
        "marker": "6-1-1705.",
        "id": "us-co-ai-act-current-6-1-1705",
        "label": "C.R.S. § 6-1-1705",
        "title": "Consumer rights — correction, human review, and reconsideration",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1705",
        "stripPrefix": "6-1-1705. Consumer rights - correction - human review and reconsideration - rules.",
        "summary": "Gives consumers data-access, correction, meaningful-human-review, and reconsideration pathways after specified adverse outcomes.",
        "commencement": "mixed",
        "immediateSubdivisions": ["6-1-1705(3)"],
    },
    {
        "key": "6-1-1706",
        "marker": "6-1-1706.",
        "id": "us-co-ai-act-current-6-1-1706",
        "label": "C.R.S. § 6-1-1706",
        "title": "Attorney General enforcement, cure, joinder, reporting, and repeal",
        "sourceHeading": "Enforcement by the attorney general - deceptive trade practice - right to cure - no private right of action - joinder rules - reporting - repeal",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1706",
        "stripPrefix": "6-1-1706. Enforcement by the attorney general - deceptive trade practice - right to cure - no private right of action - joinder rules - reporting - repeal.",
        "summary": "Establishes Attorney General enforcement, a temporary cure process, reporting, stakeholder rulemaking, and procedural safeguards.",
        "commencement": "mixed",
        "immediateSubdivisions": ["6-1-1706(6)"],
    },
    {
        "key": "6-1-1707",
        "marker": "6-1-1707.",
        "id": "us-co-ai-act-current-6-1-1707",
        "label": "C.R.S. § 6-1-1707",
        "title": "Liability, fault allocation, and indemnification",
        "sourceHeading": "Liability - fault - allocation - no joint and several liability - indemnification prohibited - effect on existing law",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1707",
        "stripPrefix": "6-1-1707. Liability - fault - allocation - no joint and several liability - indemnification prohibited - effect on existing law.",
        "summary": "Allocates developer and deployer fault in existing discrimination actions and limits indemnification for each party's own conduct.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-1708",
        "marker": "6-1-1708.",
        "id": "us-co-ai-act-current-6-1-1708",
        "label": "C.R.S. § 6-1-1708",
        "title": "Compliance with other legal obligations and sector rules",
        "sourceHeading": "Compliance with other legal obligations - insurers - covered entities - disclosures",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1708",
        "stripPrefix": "6-1-1708. Compliance with other legal obligations - insurers - covered entities - disclosures.",
        "summary": "Coordinates Part 17 with insurance, HIPAA, FDA, health-privacy, and Gramm-Leach-Bliley obligations and disclosures.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-1709",
        "marker": "6-1-1709.",
        "id": "us-co-ai-act-current-6-1-1709",
        "label": "C.R.S. § 6-1-1709",
        "title": "No new private right of action; other law preserved",
        "unitType": "statutory-section",
        "articleNumber": "6-1-1709",
        "stripPrefix": "6-1-1709. No new private right of action - application of other law.",
        "summary": "Creates no new private right of action and preserves compliance obligations under other applicable law.",
        "commencement": "general-2027",
    },
    {
        "key": "sec-2-wrapper",
        "marker": "SECTION 2.",
        "id": "us-co-ai-act-2026-sec-2-enacting",
        "label": "SECTION 2",
        "title": "Deceptive-trade-practice cross-reference",
        "unitType": "session-law-enacting-clause",
        "articleNumber": "2",
        "stripPrefix": "SECTION 2.",
        "summary": "Adds a Colorado Consumer Protection Act cross-reference for violations of Part 17.",
        "commencement": "general-2027",
    },
    {
        "key": "6-1-105",
        "marker": "6-1-105.",
        "id": "us-co-ai-act-current-6-1-105-1-uuuu",
        "label": "C.R.S. § 6-1-105(1)(uuuu)",
        "title": "Part 17 violation as deceptive trade practice",
        "sourceHeading": "Unfair or deceptive trade practices",
        "unitType": "statutory-subdivision",
        "articleNumber": "6-1-105(1)(uuuu)",
        "stripPrefix": "6-1-105. Unfair or deceptive trade practices.",
        "summary": "Classifies a violation of Part 17 as a deceptive trade practice.",
        "commencement": "general-2027",
    },
    {
        "key": "sec-3-wrapper",
        "marker": "SECTION 3.",
        "id": "us-co-ai-act-2026-sec-3-enacting",
        "label": "SECTION 3",
        "title": "Insurance-rule cross-reference",
        "unitType": "session-law-enacting-clause",
        "articleNumber": "3",
        "stripPrefix": "SECTION 3.",
        "summary": "Adds authority for updated insurer notice and disclosure rules.",
        "commencement": "immediate",
    },
    {
        "key": "10-3-1104.9",
        "marker": "10-3-1104.9.",
        "id": "us-co-ai-act-current-10-3-1104-9-3-e",
        "label": "C.R.S. § 10-3-1104.9(3)(e)",
        "title": "Insurer notice and disclosure rules",
        "sourceHeading": "Insurers' use of external consumer data and information sources, algorithms, and predictive models - unfair discrimination prohibited - rules - stakeholder process required - investigations - definitions",
        "unitType": "statutory-subdivision",
        "articleNumber": "10-3-1104.9(3)(e)",
        "stripPrefix": "10-3-1104.9. Insurers' use of external consumer data and information sources, algorithms, and predictive models - unfair discrimination prohibited - rules - stakeholder process required - investigations - definitions.",
        "summary": "Authorizes the insurance commissioner to adopt or update insurer notice and disclosure rules.",
        "commencement": "immediate",
    },
    {
        "key": "sec-4",
        "marker": "SECTION 4.",
        "id": "us-co-ai-act-2026-sec-4",
        "label": "SECTION 4",
        "title": "Appropriation",
        "unitType": "session-law-section",
        "articleNumber": "4",
        "stripPrefix": "SECTION 4. Appropriation.",
        "summary": "Appropriates funds and staffing to the Department of Law for implementation.",
        "commencement": "immediate",
    },
    {
        "key": "sec-5",
        "marker": "SECTION 5.",
        "id": "us-co-ai-act-2026-sec-5",
        "label": "SECTION 5",
        "title": "Effective date and applicability",
        "unitType": "session-law-section",
        "articleNumber": "5",
        "stripPrefix": "SECTION 5. Effective date - applicability.",
        "summary": "Separates immediate-effect provisions from the 1 January 2027 general effective and applicability date.",
        "commencement": "immediate",
    },
    {
        "key": "sec-6",
        "marker": "SECTION 6.",
        "id": "us-co-ai-act-2026-sec-6",
        "label": "SECTION 6",
        "title": "Safety clause",
        "unitType": "session-law-section",
        "articleNumber": "6",
        "stripPrefix": "SECTION 6. Safety clause.",
        "summary": "States the General Assembly's immediate-preservation and appropriation finding.",
        "commencement": "immediate",
    },
    {"key": "approved", "marker": "Approved:", "sentinel": True},
)


CO_CONCEPTS = {
    "us-co-ai-act-2026-sec-1-enacting": ["accountability-governance"],
    "us-co-ai-act-current-6-1-1701": [
        "automated-decision-safeguards",
        "fairness-nondiscrimination",
        "human-oversight",
        "transparency-explainability",
    ],
    "us-co-ai-act-current-6-1-1702": [
        "accountability-governance",
        "third-party-supply-chain",
        "training-data-governance",
        "transparency-explainability",
        "continuous-assurance",
    ],
    "us-co-ai-act-current-6-1-1703": [
        "accountability-governance",
        "retention-deletion-lifecycle",
        "continuous-assurance",
    ],
    "us-co-ai-act-current-6-1-1704": [
        "transparency-explainability",
        "data-subject-rights",
        "automated-decision-safeguards",
        "accountability-governance",
    ],
    "us-co-ai-act-current-6-1-1705": [
        "data-subject-rights",
        "human-oversight",
        "automated-decision-safeguards",
        "transparency-explainability",
    ],
    "us-co-ai-act-current-6-1-1706": [
        "accountability-governance",
        "fairness-nondiscrimination",
        "continuous-assurance",
    ],
    "us-co-ai-act-current-6-1-1707": [
        "fairness-nondiscrimination",
        "accountability-governance",
        "third-party-supply-chain",
    ],
    "us-co-ai-act-current-6-1-1708": [
        "sensitive-data-protection",
        "data-subject-rights",
        "transparency-explainability",
        "accountability-governance",
    ],
    "us-co-ai-act-current-6-1-1709": ["accountability-governance"],
    "us-co-ai-act-2026-sec-2-enacting": ["accountability-governance"],
    "us-co-ai-act-current-6-1-105-1-uuuu": ["accountability-governance"],
    "us-co-ai-act-2026-sec-3-enacting": [
        "fairness-nondiscrimination",
        "transparency-explainability",
    ],
    "us-co-ai-act-current-10-3-1104-9-3-e": [
        "fairness-nondiscrimination",
        "transparency-explainability",
    ],
    "us-co-ai-act-2026-sec-5": ["accountability-governance"],
}


def extract_colorado_segments(value: str) -> dict[str, str]:
    positions: list[tuple[int, dict[str, Any]]] = []
    cursor = 0
    for meta in CO_SEGMENT_META:
        match = re.search(rf"(?m)^{re.escape(meta['marker'])}", value[cursor:])
        if not match:
            raise ValueError(f"Colorado marker missing: {meta['marker']}")
        absolute = cursor + match.start()
        positions.append((absolute, meta))
        cursor = absolute + len(meta["marker"])
    result: dict[str, str] = {}
    for index, (start, meta) in enumerate(positions[:-1]):
        end = positions[index + 1][0]
        result[meta["key"]] = value[start:end].strip()
    return result


def paragraphize(value: str) -> list[str]:
    parts = re.split(
        r"(?<=[.;:]) (?=\((?:\d+|[a-z]|[IVXLCDM]+|[A-Z])\) )",
        value,
    )
    return [part.strip() for part in parts if part.strip()]


def commencement_metadata(kind: str, immediate: list[str] | None = None) -> dict[str, Any]:
    base = {
        "enactedOn": "2026-05-14",
        "generalEffectiveDate": "2027-01-01",
        "consequentialDecisionApplicabilityDate": "2027-01-01",
        "statusAsOf": RETRIEVED_ON,
    }
    if kind == "general-2027":
        return {
            **base,
            "legalEffectStatus": "enacted-future-general-effective-date",
            "commencementStatus": "enacted-not-yet-generally-effective",
            "appliesFrom": "2027-01-01",
            "operativeNote": (
                "Enacted on 14 May 2026; this provision's general effective "
                "date is 1 January 2027, and the Act applies to consequential "
                "decisions made on or after that date."
            ),
        }
    if kind == "mixed":
        subdivisions = immediate or []
        return {
            **base,
            "legalEffectStatus": "enacted-mixed-effective-dates",
            "commencementStatus": "specified-subdivisions-effective-general-text-future",
            "appliesFrom": "2026-05-14",
            "immediateEffectSubdivisions": subdivisions,
            "operativeNote": (
                "Only the expressly listed subdivision(s) took effect upon "
                "passage on 14 May 2026; the remaining text generally takes "
                "effect on 1 January 2027."
            ),
        }
    if kind == "immediate-no-independent-duty":
        return {
            **base,
            "legalEffectStatus": "enacted-in-force-enacting-formula",
            "commencementStatus": "effective-on-passage-no-independent-duty",
            "appliesFrom": "2026-05-14",
            "operativeNote": "Effective upon passage as formal session-law text; creates no standalone regulated-actor duty.",
        }
    if kind == "immediate":
        return {
            **base,
            "legalEffectStatus": "enacted-in-force",
            "commencementStatus": "effective-on-passage",
            "appliesFrom": "2026-05-14",
            "operativeNote": "Took effect upon passage on 14 May 2026 under section 5(2).",
        }
    raise ValueError(f"Unknown commencement kind: {kind}")


CO_VERSION_LINEAGE = [
    {
        "measure": "SB 24-205",
        "chapter": "2024 Session Laws, chapter 198",
        "approvedOn": "2024-05-17",
        "actEffectiveOn": "2024-05-17",
        "originalPrincipalDutyDate": "2026-02-01",
        "versionRole": "original-enactment-historical-version",
    },
    {
        "measure": "SB 25B-004",
        "chapter": "2025 First Extraordinary Session Laws, chapter 3",
        "approvedOn": "2025-08-28",
        "actEffectiveOn": "2025-11-25",
        "changedPrincipalDutyDateTo": "2026-06-30",
        "versionRole": "delay-amendment-superseded-by-2026-reenactment",
    },
    {
        "measure": "SB 26-189",
        "chapter": "2026 Session Laws, chapter 131",
        "approvedOn": "2026-05-14",
        "actEffectiveDates": ["2026-05-14", "2027-01-01"],
        "principalApplicabilityDate": "2027-01-01",
        "versionRole": "current-repeal-and-reenactment-through-2026-07-20",
    },
]


def build_colorado() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    page_2024 = CO_2024_PAGE.read_text(encoding="utf-8")
    page_2025 = CO_2025_PAGE.read_text(encoding="utf-8")
    page_2026 = CO_2026_PAGE.read_text(encoding="utf-8")
    if "APPROVED</b> by Governor May 17, 2024" not in page_2024:
        raise ValueError("SB 24-205 approval evidence missing")
    if "EFFECTIVE</b> November 25, 2025" not in page_2025:
        raise ValueError("SB 25B-004 effective-date evidence missing")
    for fragment in (
        "repeals and reenacts those provisions",
        "starting January 1, 2027",
        "05/14/2026",
        "Governor Signed",
    ):
        if fragment not in page_2026:
            raise ValueError(f"SB 26-189 lifecycle evidence missing: {fragment}")

    raw = clean_colorado_extraction(CO_2026_RAW.read_text(encoding="utf-8"))
    ocr = clean_colorado_extraction(CO_2026_OCR.read_text(encoding="utf-8"))
    raw_segments = extract_colorado_segments(raw)
    ocr_segments = extract_colorado_segments(ocr)

    records: list[dict[str, Any]] = []
    reconstructed_units: list[str] = []
    alignment_ratios: dict[str, float] = {}
    source_version = {
        "currentMeasure": "SB 26-189",
        "sessionLawChapter": 131,
        "approvedOn": "2026-05-14",
        "generalEffectiveDate": "2027-01-01",
        "consequentialDecisionApplicabilityDate": "2027-01-01",
        "versionBoundary": (
            "SB 26-189 repealed and reenacted Part 17 created by SB 24-205; "
            "the SB 26-189 text is the current enacted version through 20 July 2026."
        ),
        "versionLineage": deepcopy(CO_VERSION_LINEAGE),
        "sessionLawPdfSha256": sha256(CO_2026_SESSION),
        "pdfTextLayerSnapshotSha256": sha256(CO_2026_RAW),
        "ocrSpacingAuditSnapshotSha256": sha256(CO_2026_OCR),
    }

    for meta_template in CO_SEGMENT_META:
        if meta_template.get("sentinel"):
            continue
        meta = deepcopy(meta_template)
        key = meta.pop("key")
        marker = meta.pop("marker")
        strip_prefix = meta.pop("stripPrefix")
        commencement = meta.pop("commencement")
        immediate = meta.pop("immediateSubdivisions", None)
        reconciled, ratio = project_ocr_spaces(
            raw_segments[key], ocr_segments[key]
        )
        alignment_ratios[key] = ratio
        if ratio < 0.985:
            raise ValueError(f"Low Colorado dual-extraction alignment for {key}: {ratio}")
        if strip_prefix:
            if not reconciled.startswith(strip_prefix):
                raise ValueError(
                    f"Colorado heading mismatch for {key}: {reconciled[:240]!r}"
                )
            body = reconciled[len(strip_prefix) :].strip()
        else:
            body = reconciled
        if not body:
            raise ValueError(f"Empty Colorado provision body: {key}")

        paragraphs = paragraphize(body)
        full_text = "\n\n".join(paragraphs)
        if canonical(full_text) != canonical(body):
            raise ValueError(f"Colorado paragraphization changed text for {key}")
        concept_ids = CO_CONCEPTS.get(meta["id"], [])
        record = {
            "id": meta.pop("id"),
            "instrumentId": "us-co-sb26-189-admt-2026",
            **meta,
            "sourceUnitMarker": marker,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "contentSha256": sha256_text(full_text),
            "language": "en-US",
            "availableLanguages": ["en-US"],
            "textAvailability": "complete-official-session-law-text-dual-extraction-verified",
            "lifecycleStatus": "enacted",
            **commencement_metadata(commencement, immediate),
            "versionAsOf": RETRIEVED_ON,
            "source": CO_2026_SESSION_URL,
            "sourceLabel": "Colorado Session Laws 2026, chapter 131 — official PDF",
            "sourcePage": CO_2026_PAGE_URL,
            "sourcePageLabel": "Colorado General Assembly — SB 26-189 bill and lifecycle page",
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": deepcopy(source_version),
            "textReconstruction": {
                "method": "official-PDF-character-stream-with-OCR-whitespace-projection",
                "ocrCharactersUsed": False,
                "pdfCharactersUsed": True,
                "alignmentRatio": round(ratio, 9),
                "normalization": (
                    "Page headers, page footers, and the session-law amendment "
                    "legend are omitted; whitespace and paragraph boundaries are "
                    "normalized without substituting OCR characters."
                ),
            },
            "conceptIds": list(concept_ids),
            "topicRelevance": {
                "highlighted": bool(concept_ids),
                "coreConceptIds": list(concept_ids),
                "reviewStatus": "manually-reviewed-current-provision-to-core-concept",
            },
            "rights": deepcopy(CO_RIGHTS),
        }
        records.append(record)
        reconstructed_units.append(marker + " " + body)

    forbidden_spacing_artifacts = (
        "ADECISION",
        "CONSUMERS.IF",
        "ADMTDEVELOPED",
        "CONSUMER'SACCESS",
        "REQUIRINGDISCLOSURE",
        "OFMATERIAL",
        "JANUARY1,",
        "T O IMPLEMENT",
        "ADMTOUTPUT",
        "AINDIVIDUAL",
        "ISUSED",
        "ISBEING",
        "PRIVACYACTOF",
        "ADEPLOYER",
        "STATEOR",
        "DURINGITS",
        "EXISTINGLAW",
        "SECTIONS6-",
        "U.S.C.SEC.",
        "U.S.C.SECS.",
        "TO1320d",
        "6-1-1704OR",
        "section1of",
        "LA WS",
    )
    corpus_text = "\n".join(record["fullText"] for record in records)
    for artifact in forbidden_spacing_artifacts:
        if artifact in corpus_text:
            raise ValueError(f"Unrepaired PDF spacing artifact: {artifact}")

    meta = {
        "sourceBodyCanonicalSha256": sha256_text(
            canonical("\n".join(reconstructed_units))
        ),
        "orderedSourceUnitIds": [record["id"] for record in records],
        "part17SectionCount": 9,
        "additionalStatutoryProvisionCount": 2,
        "sessionLawAdministrativeSectionCount": 3,
        "enactingOrWrapperNodeCount": 4,
        "nodeCount": len(records),
        "minimumDualExtractionAlignmentRatio": round(
            min(alignment_ratios.values()), 9
        ),
    }
    return records, meta


def snapshot_entry(
    path: Path,
    url: str,
    role: str,
    legal_status: str,
    instrument_id: str,
) -> dict[str, Any]:
    return {
        "instrumentId": instrument_id,
        "role": role,
        "path": path.relative_to(ROOT).as_posix(),
        "url": url,
        "sha256": sha256(path),
        "legalStatus": legal_status,
    }


def build_manifest(
    ca_records: list[dict[str, Any]],
    ca_meta: dict[str, Any],
    co_records: list[dict[str, Any]],
    co_meta: dict[str, Any],
    ca_output: Path,
    co_output: Path,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "retrievedOn": RETRIEVED_ON,
        "generatedBy": "scripts/import-us-state-ai-laws.py",
        "corpora": {
            "us-ca-sb-1047-2024": {
                "path": DEFAULT_CA_OUTPUT.relative_to(ROOT).as_posix(),
                "nodeCount": len(ca_records),
                "sha256": sha256(ca_output),
                **ca_meta,
                "completeness": (
                    "All eight sections of the enrolled bill body, all nine "
                    "proposed code sections, and the enacting formula are "
                    "preserved once and in source order. The Legislative "
                    "Counsel's digest remains frozen in the official source "
                    "snapshot but is not misclassified as operative bill text."
                ),
            },
            "us-co-sb26-189-admt-2026": {
                "path": DEFAULT_CO_OUTPUT.relative_to(ROOT).as_posix(),
                "nodeCount": len(co_records),
                "sha256": sha256(co_output),
                **co_meta,
                "completeness": (
                    "The complete enacted body of SB 26-189 is represented from "
                    "the enacting formula through the safety clause: all nine "
                    "reenacted Part 17 sections, both additional statutory "
                    "provisions, all administrative/effective-date sections, "
                    "and the necessary enacting wrappers."
                ),
            },
        },
        "lifecycleBoundary": {
            "us-ca-sb-1047-2024": (
                "Enrolled 3 September 2024, presented to the Governor 9 "
                "September 2024, vetoed 29 September 2024, and never enacted. "
                "Every node is historical-only and has appliesFrom=null."
            ),
            "us-co-sb26-189-admt-2026": (
                "SB 24-205 was approved 17 May 2024; SB 25B-004 delayed its "
                "requirements; SB 26-189 was approved 14 May 2026 and repealed "
                "and reenacted Part 17. Specified subdivisions took effect on "
                "passage, while the Act generally takes effect and applies to "
                "consequential decisions on 1 January 2027."
            ),
        },
        "versionLineage": {
            "us-co-sb26-189-admt-2026": deepcopy(CO_VERSION_LINEAGE)
        },
        "sourceMethod": {
            "california": (
                "Official California Legislative Information HTML provides "
                "the enrolled bill's block structure and complete bill body; "
                "the separately frozen official status page proves veto and "
                "retains the Governor's veto message."
            ),
            "colorado": (
                "The official chapter 131 session-law PDF controls. Its embedded "
                "text-layer characters are retained, while independently frozen "
                "OCR supplies whitespace boundaries only. Historical signed and "
                "session-law PDFs document the version lineage."
            ),
        },
        "snapshots": [
            snapshot_entry(CA_ENROLLED, CA_SOURCE_URL, "official-enrolled-bill-structured-source", "Official enrolled bill text", "us-ca-sb-1047-2024"),
            snapshot_entry(CA_STATUS, CA_STATUS_URL, "official-terminal-status-and-veto-message", "Official veto record", "us-ca-sb-1047-2024"),
            snapshot_entry(CO_2024_SIGNED, CO_2024_SIGNED_URL, "official-original-signed-act-history", "Historical signed act; superseded version", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2024_SESSION, CO_2024_SESSION_URL, "official-original-session-law-history", "2024 Session Laws chapter 198; historical version", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2024_PAGE, CO_2024_PAGE_URL, "official-original-lifecycle-page", "Approval and original effective-date record", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2025_SESSION, CO_2025_SESSION_URL, "official-delay-session-law-history", "2025 extraordinary-session delay; superseded by 2026 reenactment", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2025_PAGE, CO_2025_PAGE_URL, "official-delay-lifecycle-page", "Approval and effective-date record", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2026_SESSION, CO_2026_SESSION_URL, "official-current-session-law", "Controlling enacted source through 20 July 2026", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2026_PAGE, CO_2026_PAGE_URL, "official-current-lifecycle-page", "Signed measure and current lifecycle record", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2026_RAW, CO_2026_SESSION_URL, "derived-pdf-text-layer-snapshot", "Derived from controlling PDF with pdftotext -raw; character source", "us-co-sb26-189-admt-2026"),
            snapshot_entry(CO_2026_OCR, CO_2026_SESSION_URL, "derived-independent-ocr-spacing-audit", "Tesseract 5.5.1, 400 dpi, psm 3; whitespace evidence only", "us-co-sb26-189-admt-2026"),
        ],
        "rights": {
            "us-ca-sb-1047-2024": deepcopy(CA_RIGHTS),
            "us-co-sb26-189-admt-2026": deepcopy(CO_RIGHTS),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--california-output", type=Path, default=DEFAULT_CA_OUTPUT)
    parser.add_argument("--colorado-output", type=Path, default=DEFAULT_CO_OUTPUT)
    parser.add_argument("--manifest-output", type=Path, default=DEFAULT_MANIFEST_OUTPUT)
    args = parser.parse_args()

    assert_snapshot_hashes()
    ca_records, ca_meta = build_california()
    co_records, co_meta = build_colorado()
    write_json(args.california_output, ca_records)
    write_json(args.colorado_output, co_records)
    manifest = build_manifest(
        ca_records,
        ca_meta,
        co_records,
        co_meta,
        args.california_output,
        args.colorado_output,
    )
    write_json(args.manifest_output, manifest)


if __name__ == "__main__":
    main()
