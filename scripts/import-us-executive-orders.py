#!/usr/bin/env python3
"""Build complete provision corpora for Executive Orders 14110 and 14179.

The parser uses the FederalRegister.gov XML rendition for stable structure and
pins the corresponding GovInfo PDF, which is the official electronic Federal
Register edition, for legal-source verification.  EO 14110 remains in the
corpus solely as revoked historical text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "v2"
SNAPSHOT_ROOT = DATA_ROOT / "source-snapshots"
DEFAULT_OUTPUT = DATA_ROOT / "us-executive-orders-provisions.json"
DEFAULT_MANIFEST = DATA_ROOT / "us-executive-orders-corpus-manifest.json"
RETRIEVED_ON = "2026-07-20"


ORDERS = (
    {
        "instrumentId": "us-eo-14110",
        "orderNumber": "14110",
        "date": "2023-10-30",
        "title": "Safe, Secure, and Trustworthy Development and Use of Artificial Intelligence",
        "xml": SNAPSHOT_ROOT / "us-eo-14110-2023-24283.xml",
        "pdf": SNAPSHOT_ROOT / "us-eo-14110-2023-24283-official.pdf",
        "federalRegisterUrl": "https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence",
        "xmlUrl": "https://www.federalregister.gov/documents/full_text/xml/2023/11/01/2023-24283.xml",
        "officialPdfUrl": "https://www.govinfo.gov/content/pkg/FR-2023-11-01/pdf/2023-24283.pdf",
        "legalEffectStatus": "revoked-historical-text",
        "versionNote": "Original Executive Order text, revoked in full by Executive Order 14148 on 20 January 2025.",
    },
    {
        "instrumentId": "us-eo-14179",
        "orderNumber": "14179",
        "date": "2025-01-23",
        "title": "Removing Barriers to American Leadership in Artificial Intelligence",
        "xml": SNAPSHOT_ROOT / "us-eo-14179-2025-02172.xml",
        "pdf": SNAPSHOT_ROOT / "us-eo-14179-2025-02172-official.pdf",
        "federalRegisterUrl": "https://www.federalregister.gov/documents/2025/01/31/2025-02172/removing-barriers-to-american-leadership-in-artificial-intelligence",
        "xmlUrl": "https://www.federalregister.gov/documents/full_text/xml/2025/01/31/2025-02172.xml",
        "officialPdfUrl": "https://www.govinfo.gov/content/pkg/FR-2025-01-31/pdf/2025-02172.pdf",
        "legalEffectStatus": "in-force-executive-order",
        "versionNote": "Original Executive Order text; current lifecycle status verified through 20 July 2026.",
    },
)


SUMMARIES = {
    "us-eo-14110-preamble": "States the constitutional and statutory authority for the former executive-branch AI directives.",
    "us-eo-14110-sec-1": "Frames AI as a source of major benefits and risks and calls for coordinated, society-wide governance.",
    "us-eo-14110-sec-2": "Sets eight policy principles covering safety, innovation, workers, civil rights, consumers, privacy, federal use, and international leadership.",
    "us-eo-14110-sec-3": "Defines the technical, security, privacy, infrastructure, and institutional terms used throughout the Order.",
    "us-eo-14110-sec-4": "Organizes the Order's former AI safety and security program.",
    "us-eo-14110-sec-4-1": "Directed NIST and partner agencies to develop evaluation, red-teaming, secure-development, testbed, and risk-management guidance.",
    "us-eo-14110-sec-4-2": "Directed reporting for specified dual-use foundation models and large computing clusters and set interim compute thresholds.",
    "us-eo-14110-sec-4-3": "Directed critical-infrastructure, cloud, and cybersecurity risk-management measures for AI systems.",
    "us-eo-14110-sec-4-4": "Addressed chemical, biological, radiological, nuclear, and synthetic-biology risks associated with advanced AI.",
    "us-eo-14110-sec-4-5": "Directed provenance, watermarking, authentication, and detection work for synthetic content.",
    "us-eo-14110-sec-4-6": "Sought public input on risks and benefits of dual-use foundation models with widely available weights.",
    "us-eo-14110-sec-4-7": "Directed safeguards against unsafe or privacy-invasive use of federal data in AI training.",
    "us-eo-14110-sec-4-8": "Directed a national-security memorandum on AI governance, security, and use within national-security systems.",
    "us-eo-14110-sec-5": "Organizes the former talent, innovation, research, intellectual-property, and competition measures.",
    "us-eo-14110-sec-5-1": "Directed immigration and talent-attraction measures for AI and other critical technologies.",
    "us-eo-14110-sec-5-2": "Directed research infrastructure, grants, small-business support, patent, copyright, and competition-related AI measures.",
    "us-eo-14110-sec-5-3": "Directed competition analysis and action concerning compute, data, cloud, semiconductors, and AI markets.",
    "us-eo-14110-sec-6": "Directed study and mitigation of AI's effects on workers, job quality, labor standards, and workforce development.",
    "us-eo-14110-sec-7": "Organizes the former civil-rights and equity directives for justice, benefits, hiring, housing, and other consequential domains.",
    "us-eo-14110-sec-7-1": "Directed safeguards, evaluation, and reporting for criminal-justice and law-enforcement uses of AI.",
    "us-eo-14110-sec-7-2": "Directed agency guidance to prevent unlawful discrimination in public-benefit administration involving algorithms.",
    "us-eo-14110-sec-7-3": "Directed civil-rights enforcement and guidance for employment, housing, and other private-sector AI uses.",
    "us-eo-14110-sec-8": "Directed consumer, healthcare, transportation, education, communications, and critical-service AI safeguards.",
    "us-eo-14110-sec-9": "Directed privacy research, privacy-enhancing technologies, data safeguards, and evaluation of commercially available information.",
    "us-eo-14110-sec-10": "Organizes the former federal AI governance, procurement, inventory, workforce, and responsible-use program.",
    "us-eo-14110-sec-10-1": "Directed OMB guidance for agency AI governance, impact management, procurement, inventories, and rights-impacting uses.",
    "us-eo-14110-sec-10-2": "Directed federal recruitment, training, and capacity-building for AI expertise.",
    "us-eo-14110-sec-11": "Directed international engagement on common AI safety, standards, and responsible-development approaches.",
    "us-eo-14110-sec-12": "Assigned interagency implementation, coordination, deadline, and reporting responsibilities.",
    "us-eo-14110-sec-13": "Preserves agency authorities, applicable-law constraints, appropriations limits, and the absence of a private enforceable right.",
    "us-eo-14179-preamble": "States the constitutional and statutory authority for the current executive-branch AI policy order.",
    "us-eo-14179-sec-1": "States the Order's rationale: removing identified policy barriers to US AI leadership.",
    "us-eo-14179-sec-2": "Sets the policy of sustaining and enhancing US global AI dominance for human flourishing, competitiveness, and national security.",
    "us-eo-14179-sec-3": "Incorporates the statutory definition of artificial intelligence in 15 U.S.C. 9401(3).",
    "us-eo-14179-sec-4": "Directed preparation of a presidential AI Action Plan within 180 days.",
    "us-eo-14179-sec-5": "Directed review and possible suspension, revision, or rescission of actions taken under revoked EO 14110 and revision of two OMB memoranda.",
    "us-eo-14179-sec-6": "Preserves agency authorities, applicable-law and appropriations limits, and the absence of a private enforceable right.",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalized_text(element: ET.Element) -> str:
    pieces: list[str] = []
    superscripts = str.maketrans("0123456789+-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻")

    def visit(node: ET.Element) -> None:
        if node.text:
            pieces.append(node.text)
        for child in node:
            tag = child.tag.rsplit("}", 1)[-1]
            if tag in {"PRTPAGE", "GPH"}:
                pass
            elif tag == "SU":
                pieces.append("".join(child.itertext()).translate(superscripts))
            else:
                visit(child)
            if child.tail:
                pieces.append(child.tail)

    visit(element)
    text = " ".join("".join(pieces).split())
    text = re.sub(r"\s+([,.;:])", r"\1", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"(?<=\d)\s+([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻])", r"\1", text)
    return text.strip()


def emphasized_text(element: ET.Element, kind: str) -> list[str]:
    return [
        normalized_text(child)
        for child in element.findall(".//E")
        if child.attrib.get("T") == kind
    ]


def top_section(element: ET.Element) -> str | None:
    for value in emphasized_text(element, "04"):
        match = re.fullmatch(r"(?:Section|Sec\.)\s+(\d+)", value)
        if match:
            return match.group(1)
    return None


def subsection(element: ET.Element) -> str | None:
    if top_section(element):
        return None
    for value in emphasized_text(element, "03"):
        match = re.match(r"(\d+\.\d+)\.\s+", value)
        if match:
            return match.group(1)
    return None


def heading(element: ET.Element, fallback: str) -> str:
    for value in emphasized_text(element, "03"):
        if re.match(r"\d+\.\d+\.\s+", value):
            return re.sub(r"^\d+\.\d+\.\s+", "", value).rstrip(".")
        if value.lower() != "et seq.,":
            return value.rstrip(".")
    return fallback


def id_for(instrument_id: str, locator: str) -> str:
    if locator == "preamble":
        return f"{instrument_id}-preamble"
    return f"{instrument_id}-sec-{locator.replace('.', '-')}"


def build_order(order: dict) -> list[dict]:
    root = ET.parse(order["xml"]).getroot()
    executive_order = root.find(".//EXECORD")
    if executive_order is None:
        raise ValueError(f"No EXECORD element in {order['xml']}")

    segments: list[dict] = []
    current: dict | None = None
    seen_section = False

    for child in list(executive_order):
        if child.tag not in {"FP", "P"}:
            continue
        text = normalized_text(child)
        if not text:
            continue
        section_number = top_section(child)
        subsection_number = subsection(child)

        if not seen_section and section_number is None:
            if current is None:
                current = {
                    "locator": "preamble",
                    "title": "Enacting authority",
                    "unitType": "preamble",
                    "parent": None,
                    "paragraphs": [],
                }
            current["paragraphs"].append(text)
            continue

        if section_number is not None:
            seen_section = True
            if current is not None:
                segments.append(current)
            current = {
                "locator": section_number,
                "title": heading(child, f"Section {section_number}"),
                "unitType": "section",
                "parent": None,
                "paragraphs": [text],
            }
            continue

        if subsection_number is not None:
            if current is None:
                raise ValueError(f"Subsection {subsection_number} appears before a section")
            parent_number = subsection_number.split(".", 1)[0]
            if current["locator"] == parent_number:
                current["unitType"] = "section-heading"
            segments.append(current)
            current = {
                "locator": subsection_number,
                "title": heading(child, f"Section {subsection_number}"),
                "unitType": "subsection",
                "parent": parent_number,
                "paragraphs": [text],
            }
            continue

        if current is not None:
            current["paragraphs"].append(text)

    if current is not None:
        segments.append(current)

    records: list[dict] = []
    for segment in segments:
        locator = segment["locator"]
        record_id = id_for(order["instrumentId"], locator)
        parent = segment["parent"]
        full_text = "\n\n".join(segment["paragraphs"])
        if locator == "preamble":
            label = "Preamble"
            article_number = "Preamble"
        else:
            label = f"Section {locator}"
            article_number = locator
        chapter = None
        if parent:
            parent_segment = next(
                item for item in segments if item["locator"] == parent
            )
            chapter = {
                "id": id_for(order["instrumentId"], parent),
                "label": f"Section {parent}",
                "title": parent_segment["title"],
            }
        records.append(
            {
                "id": record_id,
                "instrumentId": order["instrumentId"],
                "unitType": segment["unitType"],
                "articleNumber": article_number,
                "label": label,
                "title": segment["title"],
                "chapter": chapter,
                "section": None,
                "paragraphs": segment["paragraphs"],
                "fullText": full_text,
                "summary": SUMMARIES[record_id],
                "language": "en-US",
                "textAvailability": "complete-us-government-public-domain-text",
                "legalEffectStatus": order["legalEffectStatus"],
                "appliesFrom": order["date"],
                "versionAsOf": RETRIEVED_ON,
                "source": order["officialPdfUrl"],
                "sourceFragment": order["federalRegisterUrl"],
                "sourceLabel": "GovInfo — official electronic Federal Register PDF",
                "extractionSource": order["xmlUrl"],
                "extractionSourceLabel": "FederalRegister.gov XML rendition",
                "retrievedOn": RETRIEVED_ON,
                "sourceVersion": {
                    "executiveOrderNumber": order["orderNumber"],
                    "signedOn": order["date"],
                    "versionNote": order["versionNote"],
                    "officialPdfSha256": sha256(order["pdf"]),
                    "xmlSnapshotSha256": sha256(order["xml"]),
                    "normalization": "Federal Register paragraph order is preserved; page markers and signature graphics are omitted, presentation whitespace is collapsed, and numeric superscripts are rendered as Unicode superscripts.",
                },
                "contentSha256": sha256_text(full_text),
                "rights": {
                    "reuseStatus": "public-domain-us-government-work",
                    "license": "17 U.S.C. § 105",
                    "licenseUrl": "https://www.govinfo.gov/about/policies#copyright",
                    "attribution": "Source: Office of the Federal Register and U.S. Government Publishing Office. United States Government works are not subject to copyright protection in the United States; attribution and source verification are retained.",
                },
            }
        )
    return records


def build_manifest(records: list[dict]) -> dict:
    snapshots = []
    for order in ORDERS:
        snapshots.extend(
            [
                {
                    "instrumentId": order["instrumentId"],
                    "role": "structured-extraction-source",
                    "path": str(order["xml"].relative_to(ROOT)),
                    "url": order["xmlUrl"],
                    "sha256": sha256(order["xml"]),
                    "legalStatus": "FederalRegister.gov XML rendition; verify against the official GovInfo edition",
                },
                {
                    "instrumentId": order["instrumentId"],
                    "role": "official-electronic-edition",
                    "path": str(order["pdf"].relative_to(ROOT)),
                    "url": order["officialPdfUrl"],
                    "sha256": sha256(order["pdf"]),
                    "legalStatus": "Official electronic Federal Register edition on GovInfo",
                },
            ]
        )
    revocation_xml = SNAPSHOT_ROOT / "us-eo-14148-2025-01901.xml"
    revocation_pdf = SNAPSHOT_ROOT / "us-eo-14148-2025-01901-official.pdf"
    snapshots.extend(
        [
            {
                "instrumentId": "us-eo-14110",
                "role": "revocation-record-structured-source",
                "path": str(revocation_xml.relative_to(ROOT)),
                "url": "https://www.federalregister.gov/documents/full_text/xml/2025/01/28/2025-01901.xml",
                "sha256": sha256(revocation_xml),
                "legalStatus": "FederalRegister.gov XML rendition",
            },
            {
                "instrumentId": "us-eo-14110",
                "role": "revocation-record-official-edition",
                "path": str(revocation_pdf.relative_to(ROOT)),
                "url": "https://www.govinfo.gov/content/pkg/FR-2025-01-28/pdf/2025-01901.pdf",
                "sha256": sha256(revocation_pdf),
                "legalStatus": "Official electronic Federal Register edition on GovInfo",
            },
        ]
    )
    counts = {
        order["instrumentId"]: sum(
            record["instrumentId"] == order["instrumentId"] for record in records
        )
        for order in ORDERS
    }
    corpus_bytes = (json.dumps(records, indent=2, ensure_ascii=False) + "\n").encode(
        "utf-8"
    )
    return {
        "schemaVersion": 1,
        "retrievedOn": RETRIEVED_ON,
        "corpus": {
            "path": str(DEFAULT_OUTPUT.relative_to(ROOT)),
            "nodeCount": len(records),
            "countsByInstrument": counts,
            "sha256": hashlib.sha256(corpus_bytes).hexdigest(),
        },
        "lifecycleBoundary": {
            "us-eo-14110": "Revoked in full by EO 14148 on 20 January 2025; retained solely as historical text.",
            "us-eo-14179": "In force within executive-branch scope as verified on 20 July 2026.",
        },
        "sourceMethod": "FederalRegister.gov XML supplies stable paragraph structure. The corresponding GovInfo PDF is pinned as the official electronic edition. The interface and metadata retain this authority distinction.",
        "snapshots": snapshots,
        "rights": {
            "reuseStatus": "public-domain-us-government-work",
            "basis": "17 U.S.C. § 105",
            "url": "https://www.govinfo.gov/about/policies#copyright",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--manifest-output", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()

    records = [record for order in ORDERS for record in build_order(order)]
    payload = json.dumps(records, indent=2, ensure_ascii=False) + "\n"
    args.output.write_text(payload, encoding="utf-8")
    manifest = build_manifest(records)
    if args.output != DEFAULT_OUTPUT:
        manifest["corpus"]["path"] = str(args.output)
        manifest["corpus"]["sha256"] = hashlib.sha256(
            payload.encode("utf-8")
        ).hexdigest()
    args.manifest_output.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"{args.output.name}: {len(records)} nodes "
        f"({manifest['corpus']['countsByInstrument']['us-eo-14110']} EO 14110, "
        f"{manifest['corpus']['countsByInstrument']['us-eo-14179']} EO 14179)"
    )


if __name__ == "__main__":
    main()
