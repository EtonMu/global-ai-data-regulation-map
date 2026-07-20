#!/usr/bin/env python3
"""Build the complete bilingual proposed AIDA corpus from official Bill C-27 XML.

Only the first-reading text published by Parliament is used.  Proposed
committee amendments were never reported back to the House and are not folded
into this corpus.  Every node is marked as a failed bill with no legal effect.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path


EN_URL = "https://www.parl.ca/Content/Bills/441/Government/C-27/C-27_1/C-27_E.xml"
FR_URL = "https://www.parl.ca/Content/Bills/441/Government/C-27/C-27_1/C-27_F.xml"
CANONICAL_URL = "https://www.parl.ca/DocumentViewer/en/44-1/bill/c-27/first-reading"
LEGISINFO_URL = "https://www.parl.ca/legisinfo/en/bill/44-1/c-27"
PROCEDURE_URL = (
    "https://www.ourcommons.ca/procedure/procedure-and-practice-4/ch08-7-e.html"
)
DISSOLUTION_URL = (
    "https://www.ourcommons.ca/Content/Newsroom/Articles/"
    "NewsRelease-Dissolution-2025-03-23-e.pdf"
)
RIGHTS_URL = "https://www.parl.ca/ImportantNotices-e.html"

EXPECTED_HASHES = {
    "english": "b86d6925c66e068681cf38c147349c610e9a9c1460e539697537d4bda960bc81",
    "french": "e006990ec8ad05315e01ce82ec7b58566aa65b3af8777465ec0ff89feb2de8c3",
    "legisinfo": "abeef6e5653b6d0cc96921f67145bf34193f2d58f56ef83487b5f15a45869278",
    "procedure": "6cd7136017803fbaa3870e5650305bc92514c1187b377466f91fbc37066ffb15",
    "dissolution": "ab79fd2741eb72a5663d52510866200d2371c4dfe87fb421fda536ba74b15f04",
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def compact_sha256(paragraphs: list[str]) -> str:
    value = unicodedata.normalize("NFC", "".join(paragraphs))
    value = re.sub(r"\s+", "", value)
    return sha256_text(value)


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    tokens = [
        unicodedata.normalize("NFC", value.replace("\u00a0", " ")).strip()
        for value in element.itertext()
    ]
    value = " ".join(token for token in tokens if token)
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([‘“«(])\s+", r"\1", value)
    value = re.sub(r"\s+([’”»)])", r"\1", value)
    return value


def normalized_operative_text(element: ET.Element) -> str:
    """Normalize text while excluding nested marginal/administrative annotations."""

    ignored = {"MarginalNote", "HistoricalNote", "Footnote"}
    fragments: list[str] = []

    def visit(node: ET.Element) -> None:
        if node.text:
            fragments.append(node.text)
        for child in node:
            if child.tag not in ignored:
                visit(child)
            if child.tail:
                fragments.append(child.tail)

    visit(element)
    value = " ".join(fragment.strip() for fragment in fragments if fragment.strip())
    value = unicodedata.normalize("NFC", value.replace("\u00a0", " "))
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"([‘“«(])\s+", r"\1", value)
    value = re.sub(r"\s+([’”»)])", r"\1", value)
    return value


def slug(value: str) -> str:
    return re.sub(r"[^0-9a-z]+", "-", value.casefold()).strip("-")


def substantive_blocks(section: ET.Element) -> list[str]:
    blocks = []
    for child in section:
        if child.tag in {"MarginalNote", "Label", "HistoricalNote", "Footnote"}:
            continue
        value = normalized_operative_text(child)
        if value:
            blocks.append(value)
    if not blocks:
        raise ValueError(
            f"No substantive text in proposed AIDA section {normalized_text(section.find('Label'))}"
        )
    return blocks


def proposed_aida(root: ET.Element) -> ET.Element:
    candidates = []
    for internal in root.iter("BillInternal"):
        sections = internal.findall("./Body/Section")
        labels = [normalized_text(section.find("Label")) for section in sections]
        if labels == [str(number) for number in range(1, 42)]:
            candidates.append(internal)
    if len(candidates) != 1:
        raise ValueError(f"Expected exactly one 41-section proposed AIDA, got {len(candidates)}")
    return candidates[0]


def units(root: ET.Element) -> list[dict]:
    body = proposed_aida(root).find("Body")
    if body is None:
        raise ValueError("Proposed AIDA Body is missing")
    current_chapter = {"id": "aida", "label": "AIDA", "title": "AIDA"}
    current_section = None
    records = []
    for child in body:
        if child.tag == "Heading":
            label = normalized_text(child.find("Label"))
            title = normalized_text(child.find("TitleText")) or label
            value = {
                "id": f"aida-{slug(' '.join(part for part in (label, title) if part))}",
                "label": label or title,
                "title": title,
            }
            if child.get("level") == "2":
                current_section = value
            else:
                current_chapter = value
                current_section = None
            continue
        if child.tag != "Section":
            continue
        number = normalized_text(child.find("Label"))
        records.append(
            {
                "articleNumber": number,
                "label": f"Section {number}",
                "title": normalized_text(child.find("MarginalNote"))
                or f"Section {number}",
                "chapter": current_chapter,
                "section": current_section,
                "paragraphs": substantive_blocks(child),
            }
        )
    return records


def assert_hash(path: Path, expected: str, role: str) -> str:
    actual = sha256_bytes(path.read_bytes())
    if actual != expected:
        raise ValueError(f"{role} SHA-256 mismatch: {actual} != {expected}")
    return actual


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("english_xml", type=Path)
    parser.add_argument("french_xml", type=Path)
    parser.add_argument("legisinfo_json", type=Path)
    parser.add_argument("procedure_html", type=Path)
    parser.add_argument("dissolution_pdf", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--retrieved-on", required=True)
    args = parser.parse_args()

    hashes = {
        "english": assert_hash(args.english_xml, EXPECTED_HASHES["english"], "English XML"),
        "french": assert_hash(args.french_xml, EXPECTED_HASHES["french"], "French XML"),
        "legisinfo": assert_hash(
            args.legisinfo_json, EXPECTED_HASHES["legisinfo"], "LEGISinfo JSON"
        ),
        "procedure": assert_hash(
            args.procedure_html, EXPECTED_HASHES["procedure"], "House procedure HTML"
        ),
        "dissolution": assert_hash(
            args.dissolution_pdf, EXPECTED_HASHES["dissolution"], "dissolution notice"
        ),
    }

    procedure = args.procedure_html.read_text(encoding="utf-8")
    required_procedure_text = [
        "Government bills which have not received royal assent before prorogation die",
        "Dissolution terminates a Parliament, ending all business",
    ]
    for phrase in required_procedure_text:
        if phrase not in procedure:
            raise ValueError(f"House procedure snapshot is missing: {phrase}")

    legisinfo_payload = json.loads(args.legisinfo_json.read_text(encoding="utf-8"))
    if len(legisinfo_payload) != 1:
        raise ValueError("Unexpected LEGISinfo export cardinality")
    bill = legisinfo_payload[0]
    if bill["NumberCode"] != "C-27" or bill["ParliamentNumber"] != 44:
        raise ValueError("Unexpected LEGISinfo bill record")
    if bill["ReceivedRoyalAssent"] or bill["ReceivedRoyalAssentDateTime"] is not None:
        raise ValueError("Bill C-27 unexpectedly received royal assent")
    if bill["PassedHouseThirdReadingDateTime"] is not None:
        raise ValueError("Bill C-27 unexpectedly reached House third reading")
    if bill["PassedSenateFirstReadingDateTime"] is not None:
        raise ValueError("Bill C-27 unexpectedly reached the Senate")
    if bill["IsSessionOngoing"]:
        raise ValueError("The 44th Parliament session is unexpectedly still ongoing")
    publications = [item["PublicationTypeNameEn"] for item in bill["Publications"]]
    if publications != ["First Reading"]:
        raise ValueError(f"Unexpected formal Bill C-27 text publications: {publications}")

    english = units(ET.parse(args.english_xml).getroot())
    french = units(ET.parse(args.french_xml).getroot())
    if len(english) != 41 or len(french) != 41:
        raise ValueError(f"Expected 41 EN/FR sections, got {len(english)}/{len(french)}")

    records = []
    for en, fr in zip(english, french, strict=True):
        if en["articleNumber"] != fr["articleNumber"]:
            raise ValueError(
                f"Bilingual locator mismatch: {en['articleNumber']} != {fr['articleNumber']}"
            )
        number = en["articleNumber"]
        en_full_text = "\n\n".join(en["paragraphs"])
        fr_full_text = "\n\n".join(fr["paragraphs"])
        records.append(
            {
                "id": f"ca-aida-c27-sec-{number}",
                "instrumentId": "ca-bill-c-27-aida-2022-lapsed",
                "unitType": "section",
                "articleNumber": number,
                "label": en["label"],
                "title": en["title"],
                "originalTitle": fr["title"],
                "chapter": en["chapter"],
                "section": en["section"],
                "paragraphs": en["paragraphs"],
                "fullText": en_full_text,
                "contentSha256": sha256_text(en_full_text),
                "language": "en-CA",
                "originalLanguages": ["en-CA", "fr-CA"],
                "displayDefaultLanguage": "en-CA",
                "textAvailability": "official-complete-bilingual-first-reading-bill-text",
                "source": EN_URL,
                "sourceFragment": CANONICAL_URL,
                "sourceLabel": "Parliament of Canada — official English first-reading XML",
                "canonicalSource": CANONICAL_URL,
                "statusSource": LEGISINFO_URL,
                "retrievedOn": args.retrieved_on,
                "versionAsOf": "2022-06-16",
                "statusAsOf": args.retrieved_on,
                "sourceLocator": f"Bill C-27, clause 39, proposed AIDA, section {number}",
                "sourceDocumentSha256": hashes["english"],
                "sourceSnapshot": {
                    "path": "data/v2/source-snapshots/ca-c27-aida-first-reading-en.xml",
                    "sha256": hashes["english"],
                    "compactTextSha256": compact_sha256(en["paragraphs"]),
                },
                "translations": {
                    "fr": {
                        "title": fr["title"],
                        "chapter": fr["chapter"],
                        "section": fr["section"],
                        "paragraphs": fr["paragraphs"],
                        "fullText": fr_full_text,
                        "contentSha256": sha256_text(fr_full_text),
                        "status": "official-co-published",
                        "note": (
                            "Official French Bill C-27 text published by Parliament; "
                            "it is not a project translation."
                        ),
                        "source": {
                            "url": FR_URL,
                            "label": "Parlement du Canada — XML officiel de première lecture",
                            "accessedOn": args.retrieved_on,
                            "sha256": hashes["french"],
                            "compactTextSha256": compact_sha256(fr["paragraphs"]),
                        },
                    }
                },
                "legalEffectStatus": "failed-bill-never-enacted",
                "effectiveFrom": None,
                "legislativeStatus": {
                    "instrumentType": "failed-government-bill",
                    "outcome": "lapsed-at-prorogation",
                    "introducedOn": "2022-06-16",
                    "secondReadingAndReferralOn": "2023-04-24",
                    "stageBeforeTermination": "consideration in committee",
                    "lastCommitteeMeetingOn": "2024-09-26",
                    "sessionProroguedOn": "2025-01-06",
                    "effectOfProrogation": "all incomplete government business terminated",
                    "reinstated": False,
                    "parliamentDissolvedOn": "2025-03-23",
                    "receivedRoyalAssent": False,
                    "enacted": False,
                    "inForce": False,
                    "statusAsOf": args.retrieved_on,
                    "legisinfoSnapshotSha256": hashes["legisinfo"],
                    "procedureSnapshotSha256": hashes["procedure"],
                    "dissolutionNoticeSha256": hashes["dissolution"],
                    "procedureSource": PROCEDURE_URL,
                    "dissolutionSource": DISSOLUTION_URL,
                },
                "sourceVersion": {
                    "label": "first-reading text as introduced",
                    "publishedOn": "2022-06-16",
                    "parentBill": "Bill C-27 (44-1)",
                    "parentClause": "39",
                    "formalTextPublications": ["First Reading"],
                    "committeeAmendmentBoundary": (
                        "No committee report or amended bill was adopted; proposed "
                        "committee amendments are excluded."
                    ),
                    "statusAsOf": args.retrieved_on,
                },
                "summary": (
                    f"Official section heading: {en['title']}. This is proposed text "
                    "from a bill that lapsed and never became law."
                ),
                "rights": {
                    "reuseStatus": "permission-not-established-for-unenacted-bill",
                    "license": "No open reproduction licence is asserted for this bill text",
                    "licenseUrl": RIGHTS_URL,
                    "note": (
                        "Parliament's Important Notices state that website content is "
                        "covered by the Copyright Act and permission may be sought. "
                        "The Reproduction of Federal Law Order licenses enactments, but "
                        "the proposed AIDA never became an enactment; this corpus does "
                        "not claim that Order as its licence."
                    ),
                    "attribution": (
                        "Source: Parliament of Canada, Bill C-27 first-reading text. "
                        "This reproduction is not represented as an official version."
                    ),
                },
            }
        )

    args.output.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Built {len(records)} bilingual proposed AIDA sections at {args.output}")


if __name__ == "__main__":
    main()
