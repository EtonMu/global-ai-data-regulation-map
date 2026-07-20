#!/usr/bin/env python3
"""Attach complete, nonofficial English references to APPI supplementary blocks.

The current e-Gov Japanese consolidation is authoritative.  The Japanese Law
Translation Database reference through Act No. 37 of 2021 does not contain the
21 supplementary-provision blocks in that consolidation, so this annotator uses
the pinned project draft catalogue and labels every result as machine-assisted,
project-authored, and nonofficial.  It never changes the Japanese source text.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
CORPUS_PATH = DATA / "jp-appi-current-articles.json"
CORPUS_MANIFEST_PATH = DATA / "jp-appi-current-corpus-manifest.json"
CATALOGUE_PATH = DATA / "source-snapshots" / "jp-appi-supplements-project-en-draft-2026-07-20.json"
MANIFEST_PATH = DATA / "jp-appi-supplement-project-english-manifest.json"
AS_OF = "2026-07-20"
SCRIPT_VERSION = "1.2.0"
SOURCE_URL = "https://laws.e-gov.go.jp/law/415AC0000000057?occasion_date=20260720"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"


SUPPLEMENT_TITLES = {
    "jp-appi-suppl-1": "Original Supplementary Provisions",
    "jp-appi-suppl-2": "Supplementary Provisions (Act No. 61 of May 30, 2003)",
    "jp-appi-suppl-3": "Supplementary Provisions (Act No. 119 of July 16, 2003)",
    "jp-appi-suppl-4": "Supplementary Provisions (Act No. 49 of June 5, 2009)",
    "jp-appi-suppl-5": "Supplementary Provisions (Act No. 65 of September 9, 2015)",
    "jp-appi-suppl-6": "Supplementary Provisions (Act No. 51 of May 27, 2016)",
    "jp-appi-suppl-7": "Supplementary Provisions (Act No. 36 of May 24, 2017)",
    "jp-appi-suppl-8": "Supplementary Provisions (Act No. 80 of July 27, 2018)",
    "jp-appi-suppl-9": "Supplementary Provisions (Act No. 16 of May 31, 2019)",
    "jp-appi-suppl-10": "Supplementary Provisions (Act No. 44 of June 12, 2020)",
    "jp-appi-suppl-11": "Supplementary Provisions (Act No. 37 of May 19, 2021)",
    "jp-appi-suppl-12": "Supplementary Provisions (Act No. 48 of May 25, 2022)",
    "jp-appi-suppl-13": "Supplementary Provisions (Act No. 54 of May 27, 2022)",
    "jp-appi-suppl-14": "Supplementary Provisions (Act No. 68 of June 17, 2022)",
    "jp-appi-suppl-15": "Supplementary Provisions (Act No. 32 of May 19, 2023)",
    "jp-appi-suppl-16": "Supplementary Provisions (Act No. 47 of June 7, 2023)",
    "jp-appi-suppl-17": "Supplementary Provisions (Act No. 79 of November 29, 2023)",
    "jp-appi-suppl-18": "Supplementary Provisions (Act No. 46 of June 7, 2024)",
    "jp-appi-suppl-19": "Supplementary Provisions (Act No. 46 of June 24, 2026)",
    "jp-appi-suppl-20": "Supplementary Provisions (Act No. 56 of July 17, 2026)",
    "jp-appi-suppl-21": "Supplementary Provisions (Act No. 62 of July 17, 2026)",
}


def sha256(value: str | bytes) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


ITEM_MARKERS = {
    "一": "(i)",
    "二": "(ii)",
    "三": "(iii)",
    "四": "(iv)",
    "五": "(v)",
    "六": "(vi)",
    "七": "(vii)",
    "八": "(viii)",
    "九": "(ix)",
    "十": "(x)",
}


def normalized_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    value = value.replace("``", '"').replace("''", '"')
    value = re.sub(r"\bthis law\b", "this Act", value, flags=re.IGNORECASE)
    value = re.sub(r"\bgovernment ordinance\b", "Cabinet Order", value, flags=re.IGNORECASE)
    value = re.sub(
        r"\bPersonal Information Protection Law\b",
        "Act on the Protection of Personal Information",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\bPersonal Information Protection Committee\b",
        "Personal Information Protection Commission",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(
        r"\bcertified personal information protection organization\b",
        "Certified Personal Information Protection Organization",
        value,
        flags=re.IGNORECASE,
    )
    value = re.sub(r"\b(?:Sanryaku|Shoryaku|Ryak)\b", "[Omitted]", value, flags=re.IGNORECASE)
    value = value.replace("approvals, approvals", "authorizations, approvals")
    value = value.replace("such notifications and notifications", "those notices and notifications")
    value = value.replace("notifications and notifications pursuant", "notices and notifications pursuant")
    value = value.replace("Act No. 2020", "Act No. [number blank in source] of 2026")
    value = value.replace("(Consider)", "(Review)")
    value = re.sub(r"\bthe same Article\b", "that Article", value)
    value = re.sub(r"[ \t]+\n", "\n", value)
    return value


def normalize_sub_block_marker(source: str, translated: str) -> str:
    source = source.strip()
    if re.fullmatch(r"[一二三四五六七八九十]?略", source):
        if source == "略":
            return "[Omitted]"
        return f"{ITEM_MARKERS[source[0]]} [Omitted]"
    if source and source[0] in ITEM_MARKERS and not source.startswith(("第一", "第二", "第三")):
        marker = ITEM_MARKERS[source[0]]
        translated = re.sub(r"^\(?[ivxlcdm]+\)?(?:[.)]\s*|\s+)", "", translated, flags=re.IGNORECASE)
        translated = re.sub(r"^\(?\d+\)?[.)]?\s+", "", translated)
        return f"{marker} {translated}"
    fullwidth = re.match(r"^([０-９]+)", source)
    if fullwidth:
        number = "".join(str(ord(char) - ord("０")) for char in fullwidth.group(1))
        translated = re.sub(r"^\d+[.)]?\s*", "", translated)
        return f"{number} {translated}"
    return translated


def post_edit(unit: dict, paragraphs: list[str]) -> list[str]:
    edited: list[str] = []
    for source_paragraph, draft_paragraph in zip(unit["paragraphs"], paragraphs, strict=True):
        source_blocks = source_paragraph.split("\n\n")
        draft_blocks = draft_paragraph.split("\n\n")
        if len(source_blocks) != len(draft_blocks):
            raise ValueError(f"translation sub-block count mismatch for {unit['id']}")
        edited.append(
            "\n\n".join(
                normalize_sub_block_marker(source, normalized_text(draft))
                for source, draft in zip(source_blocks, draft_blocks, strict=True)
            )
        )
    if unit["id"] == "jp-appi-suppl-1":
        edited[-1] = (
            "(Transitional Measures for Anonymously Processed Information for Administrative Organs, etc.)\n\n"
            "Article 7 For the time being, when Articles 110 and 111 are applied to organs of local public entities "
            "other than prefectures and designated cities under Article 252-19, paragraph (1) of the Local Autonomy "
            "Act, and to local incorporated administrative agencies, the phrase \"the head of an administrative organ, "
            "etc.\" in Article 110 is deemed to be replaced with \"the head of an administrative organ, etc., when "
            "intending to make an invitation under the following Article,\" and the phrase \"must\" in Article 111 is "
            "deemed to be replaced with \"may.\""
        )
    elif unit["id"] == "jp-appi-suppl-3":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date on which the Local Incorporated Administrative Agency Act (Act No. 118 of 2003) comes into effect; provided, however, that the provision listed in the following item comes into effect on the date specified in that item.

(i) the provision of Article 6: the later of the date on which the Act on the Protection of Personal Information comes into effect and the date on which this Act comes into effect."""
    elif unit["id"] == "jp-appi-suppl-4":
        edited[0] = (
            "(Effective Date)\n\n"
            "Article 1 This Act comes into effect on the date on which the Act Establishing the Consumer Affairs "
            "Agency and the Consumer Commission (Act No. 48 of 2009) comes into effect; provided, however, that "
            "the provision listed in the following item comes into effect on the date specified in that item.\n\n"
            "(i) Article 9 of the Supplementary Provisions: the date of promulgation of this Act."
        )
        edited[1] = (
            "(Transitional Measures for Dispositions, etc.)\n\n"
            "Article 4 Unless otherwise provided by law, licences, permits, authorizations, approvals, designations "
            "and other dispositions, and notices and other acts, rendered or made before this Act comes into effect "
            "under the respective laws before amendment by this Act (including orders under those laws; referred to "
            "below as the \"former laws and regulations\"), are deemed after this Act comes into effect to have been "
            "rendered or made under the corresponding provisions of the respective laws after amendment by this Act "
            "(including orders under those laws; referred to below as the \"new laws and regulations\").\n\n"
            "2 Unless otherwise provided by law, applications for licences and other acts, and notices and other acts, "
            "that are pending under the former laws and regulations when this Act comes into effect are deemed after "
            "that date to have been made under the corresponding provisions of the new laws and regulations.\n\n"
            "3 Unless otherwise provided by law, where a report, notice, submission or other procedure required under "
            "the former laws and regulations was not completed before the enforcement date, the new laws and "
            "regulations apply after that date by treating the corresponding procedure under them as not having been completed."
        )
    elif unit["id"] == "jp-appi-suppl-5":
        edited[0] = (
            "(Effective Date)\n\n"
            "Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not "
            "exceeding two years from the date of promulgation; provided, however, that the provisions listed in "
            "the following items come into effect on the dates specified in those items.\n\n"
            "(i) Article 7, paragraph (2), and Articles 10 and 12 of the Supplementary Provisions: the date of promulgation.\n\n"
            "(ii) Articles 1 and 4 of this Act; and Articles 5 and 6, Article 7, paragraphs (1) and (3), Articles 8, 9 and 13, "
            "Article 22, Articles 25 through 27, Articles 30, 32 and 34, and Article 37 of the Supplementary Provisions: "
            "January 1, 2016.\n\n"
            "(iii) [Omitted]\n\n"
            "(iv) the following Article: the date specified by Cabinet Order within a period not exceeding one year "
            "and six months from the date of promulgation.\n\n"
            "(v) Articles 3 and 6 of this Act (excluding the provision in Article 6 amending Article 19, item (i), and Appended Table 1 of the "
            "Act on the Use of Numbers to Identify a Specific Individual in Administrative Procedures); and Articles "
            "19-3, 24, 29-3 and 36 of the Supplementary Provisions: the enforcement date of the provisions listed in "
            "Article 1, item (v), of the Supplementary Provisions of that Act."
        )
        edited[1] = (
            "(Transitional Measures for Notices, etc.)\n\n"
            "Article 2 A person intending to provide personal data to a third party under Article 23, paragraph (2) of "
            "the Act on the Protection of Personal Information as amended by Article 2 of this Act (referred to below "
            "as the \"new Act on the Protection of Personal Information\") may, even before the enforcement date of "
            "this Act, in accordance with rules of the Personal Information Protection Commission, notify the data "
            "subject of matters corresponding to item (v) of that paragraph and submit to the Commission matters "
            "corresponding to the items of that paragraph. Those notices and submissions are deemed, on and after the "
            "enforcement date, to have been made under that paragraph."
        )
        edited[2] = """(Transitional Measures Concerning the Identifiable Person's Consent to Provision to a Third Party in a Foreign Country)

Article 3 If, before the enforcement date, an identifiable person has given consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting personal data to be provided to a third party in a foreign country pursuant to Article 24 of the new Act on the Protection of Personal Information, the consent referred to in that Article is deemed to have been given."""
        edited[3] = """(Transitional Measures Concerning Dispositions Made by the Competent Minister)

Article 4 A recommendation, order, or other disposition, or a notice or other act, made before the enforcement date by the competent minister prescribed in Article 36 or 49 of the Act on the Protection of Personal Information before its amendment by Article 2 of this Act (referred to below as the "former Act on the Protection of Personal Information" and, in this Article, the "competent minister") pursuant to the former Act on the Protection of Personal Information or an order based on that Act is deemed, on and after the enforcement date, to be a recommendation, order, or other disposition, or a notice or other act, made by the Personal Information Protection Commission pursuant to the corresponding provision of the new Act on the Protection of Personal Information or an order based on that Act.

2 An application, notification, or other act that, at the time this Act comes into effect, has been made to the competent minister pursuant to the former Act on the Protection of Personal Information or an order based on that Act is deemed, on and after the enforcement date, to have been made to the Personal Information Protection Commission pursuant to the corresponding provision of the new Act on the Protection of Personal Information or an order based on that Act.

3 If a matter was required, before the enforcement date, to be notified or otherwise processed with the competent minister pursuant to the former Act on the Protection of Personal Information or an order based on that Act, but that procedure had not been completed before the enforcement date, the corresponding provision of the new Act on the Protection of Personal Information or an order based on that Act applies on and after the enforcement date by deeming the corresponding procedure required before the Personal Information Protection Commission not to have been completed."""
        edited[4] = """(Transitional Measures Concerning the Appointment of the Chairperson and Members of the Commission)

Article 7 A person who, when the provisions listed in Article 1, item (ii), of the Supplementary Provisions come into effect, is the chairperson or a member of the former Specific Personal Information Protection Commission is deemed, respectively, to have been appointed on the item (ii) enforcement date as the chairperson or a member of the Personal Information Protection Commission pursuant to Article 54, paragraph (3), of the Act on the Protection of Personal Information as amended by Article 1 of this Act (referred to in this Article as the "item (ii) new Act on the Protection of Personal Information"). In this case, notwithstanding Article 55, paragraph (1), of the item (ii) new Act on the Protection of Personal Information, the term of office of a person deemed to have been appointed is the period remaining, on the item (ii) enforcement date, in that person's term as chairperson or member of the former Specific Personal Information Protection Commission.

2 With respect to members of the Personal Information Protection Commission who are to be newly appointed in connection with the coming into effect of the provisions listed in Article 1, item (ii), of the Supplementary Provisions, acts necessary for appointment under Article 54, paragraph (3), of the item (ii) new Act on the Protection of Personal Information may be performed before the item (ii) enforcement date.

3 A person who, when the provisions listed in Article 1, item (ii), of the Supplementary Provisions come into effect, is an employee of the secretariat of the former Specific Personal Information Protection Commission becomes, on the item (ii) enforcement date and under the same working conditions, the corresponding employee of the secretariat of the Personal Information Protection Commission, unless a separate appointment is issued."""
        edited[5] = """(Transitional Measures Concerning Penal Provisions)

Article 9 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect (or, for the provisions listed in Article 1, item (ii), of the Supplementary Provisions, before those provisions come into effect) and to an act committed on or after the item (ii) enforcement date in a case in which prior laws continue to govern pursuant to the preceding Article."""
        edited[6] = """(Delegation to Cabinet Order)

Article 10 Beyond what is provided for in these Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect."""
        edited[7] = """(Considerations When Formulating Guidelines for the Appropriate and Effective Implementation of Measures to Be Taken by Businesses)

Article 11 When formulating guidelines under Article 8 of the new Act on the Protection of Personal Information for the appropriate and effective implementation of measures to be taken by businesses, the Personal Information Protection Commission is to give particular consideration to ensuring that the business activities of small-scale businesses proceed smoothly, in view of the fact that, upon this Act's entry into effect, the persons listed in Article 2, paragraph (3), item (v), of the former Act on the Protection of Personal Information will newly become businesses handling personal information."""
        edited[8] = """(Review)

Article 12 By the enforcement date, in light of the purpose of the new Act on the Protection of Personal Information, the government is to review how the handling of personal information held by administrative organs as defined in Article 2, paragraph (1), of the Act on the Protection of Personal Information Held by Administrative Organs and prescribed in paragraph (2) of that Article, and personal information held by incorporated administrative agencies or equivalent entities as defined in Article 2, paragraph (1), of the Act on the Protection of Personal Information Held by Incorporated Administrative Agencies (Act No. 59 of 2003) and prescribed in paragraph (2) of that Article (collectively referred to in this Article as "personal information held by administrative organs or equivalent entities"), should be regulated. From the perspective of facilitating the smooth and prompt use of anonymized personal information (meaning anonymized personal information as defined in Article 2, paragraph (9), of the new Act on the Protection of Personal Information, and including anonymized personal information for administrative organs or equivalent entities, which means anonymized personal information obtained by processing personal information held by administrative organs or equivalent entities; the same applies in this paragraph), the review is to include whether the Personal Information Protection Commission should provide unified and cross-cutting guidance, advice, and other assistance regarding the handling of anonymized personal information for administrative organs or equivalent entities. The government is to take the necessary measures based on the results of the review.

2 Approximately three years after this Act comes into effect, the government is to review improvements concerning the formulation and promotion of the basic policy on the protection of personal information and the other affairs under the jurisdiction of the Personal Information Protection Commission, taking into account the state of staffing, the securing of financial resources, and other measures necessary to perform those affairs effectively; and, if it finds this necessary, is to take the necessary measures based on the results of the review.

3 Beyond the matters provided for in the preceding paragraph, approximately three years after this Act comes into effect, the government is to review the state of enforcement of the new Act on the Protection of Personal Information, taking into account international developments concerning the protection of personal information, advances in information and communications technology, and the resulting creation and development of new industries that use personal information; and, if it finds this necessary, is to take the necessary measures based on the results of the review.

4 Approximately three years after the provisions listed in Article 1, item (vi), of the Supplementary Provisions come into effect, the government is to review measures by which a financial institution prescribed in Article 2, paragraph (1), of the Deposit Insurance Act (Act No. 34 of 1971) may appropriately receive an individual number from a depositor or equivalent person prescribed in paragraph (3) of that Article, or an agricultural or fishery cooperative prescribed in Article 2, paragraph (1), of the Agricultural and Fishery Cooperation Savings Insurance Act (Act No. 53 of 1973) may appropriately receive an individual number from a depositor or equivalent person prescribed in paragraph (3) of that Article, as well as the state of enforcement of the Act on the Use of Numbers to Identify a Specific Individual in Administrative Procedures as amended by Article 7 of this Act; and, if it finds this necessary, is to take the necessary measures based on the results of the review while obtaining public understanding.

5 In view of the importance of properly formulating and implementing cybersecurity measures (meaning cybersecurity as defined in Article 2 of the Basic Act on Cybersecurity (Act No. 104 of 2014)) to ensure the security of personal information held by national administrative organs or equivalent entities, the government is to review the development of systems and other arrangements within those organs and entities for formulating and implementing measures based on the standards prescribed in Article 13 of that Act, and is to take the necessary measures based on the results of the review.

6 Taking into account the state of enforcement of the new Act on the Protection of Personal Information, the implementation of the measures referred to in paragraph (1), and other circumstances, the government is to review the form that legislation on the protection of personal information should take, including whether the provisions protecting personal information as defined in Article 2, paragraph (1), of the new Act on the Protection of Personal Information and personal information held by administrative organs or equivalent entities should be consolidated and provided for in an integrated manner."""
    elif unit["id"] == "jp-appi-suppl-8":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding three years from the date of promulgation; provided, however, that the provisions listed in the following items come into effect on the dates specified in those items.

(i) and (ii) [Omitted]

(iii) Chapter XI; Article 235; Article 239, paragraph (1) (limited to the part concerning item (xliv)); Article 243, paragraphs (1) (limited to the part concerning item (iv), itself limited to the part concerning Article 239, paragraph (1), item (xliv)) and (3); Article 251; and Articles 5, 7 through 10, 12, 14 (limited to the provision amending Article 19, paragraph (2), of the Act on Promotion of Development of Specified Integrated Resort Districts), 15, and 16 of the Supplementary Provisions: the date specified by Cabinet Order within a period not exceeding one year and six months from the date of promulgation."""
    elif unit["id"] == "jp-appi-suppl-10":
        edited[0] = (
            "(Effective Date)\n\n"
            "Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not "
            "exceeding two years from the date of promulgation; provided, however, that the provisions listed in "
            "the following items come into effect on the dates specified in those items.\n\n"
            "(i) Articles 9 through 11 of the Supplementary Provisions: the date of promulgation.\n\n"
            "(ii) in Article 1, the provisions deleting Article 84 of the Act on the Protection of Personal "
            "Information, renumbering Article 83 as Article 84, adding one Article after Article 82, and amending "
            "Articles 85, 86 and 87; in Article 2, the provision amending Article 57 of the Act on the Use of Numbers "
            "to Identify a Specific Individual in Administrative Procedures; in Article 3, the provisions amending "
            "Article 46 of the Act on Anonymously Processed Medical Information to Contribute to Research and "
            "Development in the Medical Field, adding one Article after Article 46, and amending Articles 48 and 49; "
            "and Article 8 of the Supplementary Provisions: the date six months after the date of promulgation.\n\n"
            "(iii) the following Article and Article 7 of the Supplementary Provisions: the date specified by Cabinet "
            "Order within a period not exceeding one year and six months from the date of promulgation."
        )
        edited[1] = (
            "(Transitional Measures for Notices, etc.)\n\n"
            "Article 2 A person intending to provide personal data to a third party under Article 23, paragraph (2) of "
            "the Act on the Protection of Personal Information as amended by Article 1 of this Act (referred to below "
            "as the \"new Act on the Protection of Personal Information\") may, even before the enforcement date of "
            "this Act, in accordance with rules of the Personal Information Protection Commission, notify the data "
            "subject and submit to the Commission matters corresponding to items (i), (iv) and (viii) of that "
            "paragraph. Those notices and submissions are deemed, on and after the enforcement date, to have been made "
            "under that paragraph."
        )
        edited[2] = """Article 3 If, before the enforcement date, an identifiable person was notified of matters corresponding to the address of the person responsible for managing personal data referred to in Article 23, paragraph (5), item (iii), of the new Act on the Protection of Personal Information and, if that responsible person is a corporation, the name of its representative, that notice is deemed to have been given pursuant to that item."""
        edited[3] = """(Transitional Measures Concerning the Provision of Information in Connection with Provision to a Third Party in a Foreign Country)

Article 4 Article 24, paragraph (2), of the new Act on the Protection of Personal Information applies if a business handling personal information obtains the identifiable person's consent under paragraph (1) of that Article on or after the enforcement date.

2 Article 24, paragraph (3), of the new Act on the Protection of Personal Information applies if a business handling personal information provides personal data on or after the enforcement date to a third party in a foreign country as referred to in that paragraph."""
        edited[4] = """(Transitional Measures Concerning the Identifiable Person's Consent and Related Matters for the Provision of Information Related to Personal Information to a Third Party)

Article 5 If, before the enforcement date, an identifiable person has given consent concerning the handling of information related to that person's personal information, and that consent is equivalent to consent permitting information related to personal information to be provided to a third party under Article 26-2, paragraph (1), of the new Act on the Protection of Personal Information, the consent referred to in item (i) of that paragraph is deemed to have been given.

2 Article 24, paragraph (3), of the new Act on the Protection of Personal Information, as applied mutatis mutandis following the deemed replacement of terms pursuant to Article 26-2, paragraph (2), of that Act, applies if a business handling information related to personal information provides that information on or after the enforcement date to a third party in a foreign country as referred to in that paragraph."""
        edited[5] = """(Transitional Measures Concerning Businesses Covered by Certified Personal Information Protection Organizations)

Article 6 A business handling personal information or equivalent entity that is a member of a Certified Personal Information Protection Organization when this Act comes into effect is deemed, on the enforcement date, to have given the consent referred to in Article 51, paragraph (1), of the new Act on the Protection of Personal Information, and that paragraph applies accordingly."""
        edited[6] = """(Transitional Measures Concerning Penal Provisions)

Article 8 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect (or, for the provisions listed in Article 1, item (ii), of the Supplementary Provisions, before those provisions come into effect)."""
        edited[7] = """(Delegation to Cabinet Order)

Article 9 Beyond what is provided for in these Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect."""
        edited[8] = """(Review)

Article 10 Approximately three years after this Act comes into effect, the government is to review the state of enforcement of the new Act on the Protection of Personal Information, taking into account international developments concerning the protection of personal information, advances in information and communications technology, and the resulting creation and development of new industries that use personal information; and, if it finds this necessary, is to take the necessary measures based on the results of the review."""
    elif unit["id"] == "jp-appi-suppl-11":
        blocks = edited[0].split("\n\n")
        blocks[2] = (
            "(i) Article 27 (limited to the provisions amending Appended Tables 1 through 5 of the Basic Resident "
            "Register Act), Articles 45 and 47, Article 55 (limited to the provisions amending Appended Tables 1 and "
            "2 of the Act on the Use of Numbers to Identify a Specific Individual in Administrative Procedures, "
            "excluding the amendment to item 27 of the latter table), and Article 8, paragraph (1), Articles 59 "
            "through 63, Article 67, and Articles 71 through 73 of the Supplementary Provisions: the date of promulgation."
        )
        blocks[4] = (
            "(iii) Article 7, paragraph (3), of the Supplementary Provisions: the date specified by Cabinet Order "
            "within a period not exceeding nine months from the date of promulgation."
        )
        blocks[6] = (
            "(v) [Omitted]"
        )
        blocks[7] = (
            "(vi) Article 8, paragraph (2), and Article 9, paragraph (3), of the Supplementary Provisions: the date "
            "specified by Cabinet Order within a period not exceeding one year and six months from the date of promulgation."
        )
        blocks[5] = (
            "(iv) Articles 17, 35, 44, 50 and 58; the following Article; and Articles 3, 5 and 6, Article 7 "
            "(excluding paragraph (3)), Articles 13 and 14, Article 18 (limited to the provision amending Article 129 "
            "of the Family Register Act, except the part adding \"original and\" after \"family register\"), Articles "
            "19 through 21, Articles 23 and 24, Article 27, Article 29 (excluding the provision amending Article 30-15, "
            "paragraph (3), of the Basic Resident Register Act), Articles 30 and 31, Articles 33 through 35, Articles "
            "40 and 42, Articles 44 through 46, Article 48, Articles 50 through 52, Article 53 (excluding specified "
            "amendments to Articles 45-2 and 52-3 of the Act on the Use of Numbers to Identify a Specific Individual "
            "in Administrative Procedures), Article 55 (excluding the specified amendment to Article 35 of the Act "
            "on Promotion of Cancer Registration, etc.), and Articles 56, 58, 64, 65, 68 and 69 of the Supplementary "
            "Provisions: for each provision, the date specified by Cabinet Order within a period not exceeding one "
            "year from the date of promulgation."
        )
        blocks[8] = (
            "(vii) Article 27 (limited to the specified amendments to Articles 24-2 and 30-15 of the Basic Resident "
            "Register Act), Article 48 (excluding the specified amendments to Article 71 of the Act on Certification "
            "Operations of the Japan Agency for Local Authority Information Systems Relating to Electronic Signatures, "
            "etc.), Articles 49 and 51; and Article 9 (excluding paragraph (3)), Articles 10 and 15, Article 18 (limited "
            "to the specified amendment to Article 129 of the Family Register Act), Articles 22, 25, 26 and 28, Article "
            "29 (limited to the specified amendment to Article 30-15 of the Basic Resident Register Act), Articles 39, "
            "43, 47, 49 and 54, Article 55 (limited to the specified amendment to Article 35 of the Act on Promotion of "
            "Cancer Registration, etc.), and Articles 57, 66 and 70 of the Supplementary Provisions: for each provision, "
            "the date specified by Cabinet Order within a period not exceeding two years from the date of promulgation."
        )
        edited[0] = "\n\n".join(blocks)
        edited[1] = """(Transitional Measures Accompanying the Entry into Effect of Article 50)

Article 7 In this Article, "Appended Table 2 entities, etc." means: a corporation listed in Appended Table 2 of the Act on the Protection of Personal Information as amended by Article 50 of this Act (referred to in this Article as the "Article 50-amended APPI"); the Japan Organization of Occupational Health and Safety, which is deemed under Article 58, paragraph (2), of the Article 50-amended APPI to be a business handling personal information as defined in Article 16, paragraph (2), a business handling pseudonymized personal information as defined in paragraph (5) of that Article, or a business handling information related to personal information as defined in paragraph (7) of that Article; or a business handling personal information as defined in paragraph (2) of that Article that is an academic research institution or equivalent entity as defined in paragraph (8) of that Article. If, before Article 50 comes into effect (referred to in this Article as the "Article 50 enforcement date"), an identifiable person gave an Appended Table 2 entity, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting the handling of personal information for a purpose other than the purpose of use specified pursuant to Article 17, paragraph (1), of the Article 50-amended APPI, the consent referred to in Article 18, paragraph (1) or (2), of that Act is deemed to have been given on the Article 50 enforcement date.

2 If, before the Article 50 enforcement date, an identifiable person gave an Appended Table 2 entity, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting personal data to be provided to a third party under Article 27, paragraph (1), of the Article 50-amended APPI, the consent referred to in that paragraph is deemed to have been given on the Article 50 enforcement date.

3 An Appended Table 2 entity, etc. intending to provide personal data to a third party under Article 27, paragraph (2), of the Article 50-amended APPI may, even before the Article 50 enforcement date and pursuant to rules of the Personal Information Protection Commission, notify the identifiable person of matters corresponding to those listed in the items of that paragraph and notify the Commission of those matters. On and after the Article 50 enforcement date, those notices are deemed to have been given under that paragraph.

4 If, before the Article 50 enforcement date, an Appended Table 2 entity, etc. notified an identifiable person of matters corresponding to matters that must be notified to the identifiable person or placed in a state in which the identifiable person can easily know them under Article 27, paragraph (5), item (iii), of the Article 50-amended APPI, that notice is deemed, on and after the Article 50 enforcement date, to have been given under that item.

5 If, before the Article 50 enforcement date, an identifiable person gave an Appended Table 2 entity, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting personal data to be provided to a third party in a foreign country under Article 28, paragraph (1), of the Article 50-amended APPI, the consent referred to in that paragraph is deemed to have been given on the Article 50 enforcement date.

6 Article 28, paragraph (2), of the Article 50-amended APPI applies if an Appended Table 2 entity, etc. obtains the identifiable person's consent under paragraph (1) of that Article on or after the Article 50 enforcement date.

7 Article 28, paragraph (3), of the Article 50-amended APPI applies if an Appended Table 2 entity, etc. provides personal data on or after the Article 50 enforcement date to a third party in a foreign country as referred to in that paragraph.

8 If, before the Article 50 enforcement date, an identifiable person gave an Appended Table 2 entity, etc. consent concerning the handling of information related to that person's personal information, and that consent is equivalent to consent permitting information related to personal information to be provided to a third party under Article 31, paragraph (1), item (i), of the Article 50-amended APPI, the consent referred to in that item is deemed to have been given on the Article 50 enforcement date.

9 Article 28, paragraph (3), of the Article 50-amended APPI, as applied mutatis mutandis following the deemed replacement of terms pursuant to Article 31, paragraph (2), of that Act, applies if an Appended Table 2 entity, etc. provides information related to personal information on or after the Article 50 enforcement date to a third party in a foreign country as referred to in that paragraph.

10 In this Article, "administrative organs or equivalent entities" means administrative organs or equivalent entities as defined in Article 2, paragraph (11), of the Article 50-amended APPI, excluding the Japan Organization of Occupational Health and Safety, which is deemed under Article 58, paragraph (2), of that Act to be a business handling personal information as defined in Article 16, paragraph (2), of that Act. If, before the Article 50 enforcement date, an identifiable person gave an administrative organ or equivalent entity consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting retained personal information to be used by that organ or entity itself, or provided, for a purpose other than the purpose of use specified pursuant to Article 61, paragraph (1), of the Article 50-amended APPI, the consent referred to in Article 69, paragraph (2), item (i), of that Act is deemed to have been given on the Article 50 enforcement date.

11 If, before the Article 50 enforcement date, an identifiable person gave an administrative organ or equivalent entity consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting retained personal information to be provided to a third party in a foreign country under Article 71, paragraph (1), of the Article 50-amended APPI, the consent referred to in that paragraph is deemed to have been given on the Article 50 enforcement date.

12 Article 71, paragraph (2), of the Article 50-amended APPI applies if an administrative organ or equivalent entity obtains the identifiable person's consent under paragraph (1) of that Article on or after the Article 50 enforcement date.

13 Article 71, paragraph (3), of the Article 50-amended APPI applies if an administrative organ or equivalent entity provides retained personal information on or after the Article 50 enforcement date to a third party in a foreign country as referred to in that paragraph.

14 In applying Article 74, paragraph (1), of the Article 50-amended APPI to a personal information file prescribed in Article 60, paragraph (2), of that Act that, on the Article 50 enforcement date, is already held by an administrative organ as defined in Article 2, paragraph (8), of that Act, the phrase "intends to hold" in Article 74, paragraph (1), is deemed to be replaced with "holds," and the phrase "in advance" is deemed to be replaced with "without delay after Article 50 of the Act on the Development of Related Laws for Forming a Digital Society (Act No. 37 of 2021) comes into effect."""
        edited[2] = """(Preparatory Acts Accompanying the Entry into Effect of Article 51)

Article 8 To ensure the proper handling of personal information held by organs of local governments and local incorporated administrative agencies under the Act on the Protection of Personal Information as amended by Article 51 of this Act (referred to in this Article, the following Article, and Article 10, paragraph (1), of the Supplementary Provisions as the "Article 51-amended APPI"), the national government is to ascertain the status of implementation by those organs and agencies of the preparatory acts necessary for enforcing the Article 51-amended APPI, including by requesting local governments to submit necessary materials; and, if the national government finds this necessary, it is to provide technical advice or recommendations concerning those preparatory acts.

2 A notification under Article 167, paragraph (1), of the Article 51-amended APPI may be made before Article 51 comes into effect (referred to in the following Article as the "Article 51 enforcement date")."""
        edited[3] = """(Transitional Measures Accompanying the Entry into Effect of Article 51)

Article 9 In this Article, "specified local incorporated administrative agencies, etc." means the persons listed in Article 58, paragraph (1), item (ii), of the Article 51-amended APPI and the persons listed in paragraph (2), item (i), of that Article that are deemed under paragraph (2) of that Article to be a business handling personal information as defined in Article 16, paragraph (2), a business handling pseudonymized personal information as defined in paragraph (5) of that Article, or a business handling information related to personal information as defined in paragraph (7) of that Article. If, before the Article 51 enforcement date, an identifiable person gave a specified local incorporated administrative agency, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting the handling of personal information for a purpose other than the purpose of use specified pursuant to Article 17, paragraph (1), of the Article 51-amended APPI, the consent referred to in Article 18, paragraph (1) or (2), of that Act is deemed to have been given on the Article 51 enforcement date.

2 If, before the Article 51 enforcement date, an identifiable person gave a specified local incorporated administrative agency, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting personal data to be provided to a third party under Article 27, paragraph (1), of the Article 51-amended APPI, the consent referred to in that paragraph is deemed to have been given on the Article 51 enforcement date.

3 A specified local incorporated administrative agency, etc. intending to provide personal data to a third party under Article 27, paragraph (2), of the Article 51-amended APPI may, even before the Article 51 enforcement date and pursuant to rules of the Personal Information Protection Commission, notify the identifiable person of matters corresponding to those listed in the items of that paragraph and notify the Commission of those matters. On and after the Article 51 enforcement date, those notices are deemed to have been given under that paragraph.

4 If, before the Article 51 enforcement date, a specified local incorporated administrative agency, etc. notified an identifiable person of matters corresponding to matters that must be notified to the identifiable person or placed in a state in which the identifiable person can easily know them under Article 27, paragraph (5), item (iii), of the Article 51-amended APPI, that notice is deemed, on and after the Article 51 enforcement date, to have been given under that item.

5 If, before the Article 51 enforcement date, an identifiable person gave a specified local incorporated administrative agency, etc. consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting personal data to be provided to a third party in a foreign country under Article 28, paragraph (1), of the Article 51-amended APPI, the consent referred to in that paragraph is deemed to have been given on the Article 51 enforcement date.

6 Article 28, paragraph (2), of the Article 51-amended APPI applies if a specified local incorporated administrative agency, etc. obtains the identifiable person's consent under paragraph (1) of that Article on or after the Article 51 enforcement date.

7 Article 28, paragraph (3), of the Article 51-amended APPI applies if a specified local incorporated administrative agency, etc. provides personal data on or after the Article 51 enforcement date to a third party in a foreign country as referred to in that paragraph.

8 If, before the Article 51 enforcement date, an identifiable person gave a specified local incorporated administrative agency, etc. consent concerning the handling of information related to that person's personal information, and that consent is equivalent to consent permitting information related to personal information to be provided to a third party under Article 31, paragraph (1), item (i), of the Article 51-amended APPI, the consent referred to in that item is deemed to have been given on the Article 51 enforcement date.

9 Article 28, paragraph (3), of the Article 51-amended APPI, as applied mutatis mutandis following the deemed replacement of terms pursuant to Article 31, paragraph (2), of that Act, applies if a specified local incorporated administrative agency, etc. provides information related to personal information on or after the Article 51 enforcement date to a third party in a foreign country as referred to in that paragraph.

10 In this Article, "persons listed in Article 2, paragraph (11), item (ii) or (iv)" excludes a person listed in Article 58, paragraph (2), item (i), of the Article 51-amended APPI that is deemed under paragraph (2) of that Article to be a business handling personal information as defined in Article 16, paragraph (2), of that Act. If, before the Article 51 enforcement date, an identifiable person gave a person listed in Article 2, paragraph (11), item (ii) or (iv), consent concerning the handling of the identifiable person's personal information, and that consent is equivalent to consent permitting retained personal information to be used by that person itself, or provided, for a purpose other than the purpose of use specified pursuant to Article 61, paragraph (1), of the Article 51-amended APPI, the consent referred to in Article 69, paragraph (2), item (i), of that Act is deemed to have been given on the Article 51 enforcement date.

11 If, before the Article 51 enforcement date, an identifiable person gave a person listed in Article 2, paragraph (11), item (ii) or (iv), of the Article 51-amended APPI consent concerning the handling of the person's personal information, and that consent is equivalent to consent permitting retained personal information to be provided to a third party in a foreign country under Article 71, paragraph (1), of that Act, the consent referred to in that paragraph is deemed to have been given on the Article 51 enforcement date.

12 Article 71, paragraph (2), of the Article 51-amended APPI applies if a person listed in Article 2, paragraph (11), item (ii) or (iv), of that Act obtains the identifiable person's consent under Article 71, paragraph (1), on or after the Article 51 enforcement date.

13 Article 71, paragraph (3), of the Article 51-amended APPI applies if a person listed in Article 2, paragraph (11), item (ii) or (iv), of that Act provides retained personal information on or after the Article 51 enforcement date to a third party in a foreign country as referred to in Article 71, paragraph (3)."""
        edited[4] = """(Relationship Between Article 51 and Local Government Ordinances)

Article 10 A provision of a local government ordinance that prescribes punishment for conduct regulated by the Article 51-amended APPI ceases to have effect, with respect to that conduct, when Article 51 comes into effect.

2 If a provision of an ordinance ceases to have effect pursuant to the preceding paragraph, and the local government does not provide otherwise by ordinance, prior laws continue to govern punishment for a violation committed before that provision ceased to have effect."""
        edited[5] = """(Transitional Measures Concerning Penal Provisions)

Article 71 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect (or, for a provision listed in an item of Article 1 of the Supplementary Provisions, before that provision comes into effect; the same applies in this Article) and to an act committed after this Act comes into effect in a case in which prior laws continue to govern pursuant to these Supplementary Provisions."""
        edited[6] = """(Delegation to Cabinet Order)

Article 72 Beyond what is provided for in these Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect, including transitional measures concerning penal provisions."""
        edited[7] = """(Review)

Article 73 To enable individuals to be identified in applications, notifications, notices of dispositions, and other procedures involving administrative organs or equivalent entities through the use of their names written in hiragana or katakana, the government is to review specific measures, including making an individual's name written in hiragana or katakana an item entered in the family register, aiming to do so within one year after this Act is promulgated; and is to take the necessary measures based on the results of the review."""
    elif unit["id"] == "jp-appi-suppl-12":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding four years from the date of promulgation; provided, however, that the provision listed in the following item comes into effect on the date specified in that item.

(i) Article 3; the provision in Article 60 of the Supplementary Provisions amending Article 52, paragraph (2), of the Commercial Registration Act (Act No. 125 of 1963); and Article 125 of the Supplementary Provisions: the date of promulgation."""
        edited[1] = """(Transitional Measures Concerning Penal Provisions)

Article 124 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect and to an act committed after this Act comes into effect in a case in which prior laws continue to govern pursuant to these Supplementary Provisions."""
        edited[2] = """(Delegation to Cabinet Order)

Article 125 Beyond what is provided for in these Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect."""
    elif unit["id"] == "jp-appi-suppl-14":
        edited[0] = "(Effective Date) 1 This Act comes into effect on the effective date of the Act Partially Amending the Penal Code and Related Acts; provided, however, that the provision listed in the following item comes into effect on the date specified in that item. (i) Article 509: the date of promulgation."
    elif unit["id"] == "jp-appi-suppl-15":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding three months from the date of promulgation; provided, however, that the provisions listed in the following items come into effect on the dates specified in those items.

(i) [Omitted]

(ii) Articles 13 and 18; Chapters V and VII; and Articles 4 through 9, 12 through 15, and 17 of the Supplementary Provisions: the date specified by Cabinet Order within a period not exceeding nine months from the date of promulgation."""
    elif unit["id"] == "jp-appi-suppl-16":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date on which the National Institute for Health Risk Management Act (Act No. 46 of 2023) comes into effect (referred to below as the "enforcement date"); provided, however, that Article 5 of the Supplementary Provisions comes into effect on the date of promulgation."""
        edited[1] = """(Transitional Measures Concerning Penal Provisions)

Article 4 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect and to an act committed after this Act comes into effect in a case in which prior laws continue to govern pursuant to the preceding Article."""
        edited[2] = """(Delegation to Cabinet Order)

Article 5 Beyond what is provided for in the preceding three Articles, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect."""
    elif unit["id"] == "jp-appi-suppl-17":
        edited[0] = (
            "(Effective Date)\n\n"
            "Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding "
            "one year from the date of promulgation; provided, however, that the provisions listed in the following "
            "items come into effect on the dates specified in those items.\n\n"
            "(i) Article 68 of the Supplementary Provisions: the date of promulgation.\n\n"
            "(ii) the specified amendments in Article 1 to Articles 15, 29-4, 33-5, 50-2, 59-4, 60-3, 64, 64-2, "
            "64-7, 66-19, 80, 82, 106-12, 155-3, 156-4, 156-20-4, 156-20-18 and 156-25 of the Financial Instruments "
            "and Exchange Act and to Articles 3-2 and 3-3 of its Supplementary Provisions; Article 2; the specified "
            "amendments in Article 5 to Articles 11-66, 92-3 and 92-5-9 of the Agricultural Cooperatives Act; in "
            "Article 6 to Articles 87-2, 107 and 117 of the Fisheries Cooperatives Act; in Article 7 to Articles 4-4, "
            "6-4 and 6-5-10 of the Act on Financial Businesses by Cooperative Associations; in Article 8 to Articles "
            "98, 100 and 136 of the Act on Investment Trusts and Investment Corporations; in Article 9 to Articles "
            "54-23, 85-2-2 and 89 of the Shinkin Bank Act; in Article 10 to Articles 13-2 and 16-7 of the Long-Term "
            "Credit Bank Act; in Article 11 to Articles 58-5, 89-4 and 94 of the Labor Bank Act; in Article 12 to "
            "Articles 16-2, 52-52, 52-60-2 and 52-61-5 of the Banking Act; in Article 14 to Articles 106, 272-4, "
            "272-33, 279, 280, 289 and 290 of the Insurance Business Act; in Article 15 to Article 70 of the Act on "
            "Securitization of Assets; in Article 17 to Articles 54, 72, 95-3 and 95-5-10 of the Norinchukin Bank Act; "
            "and in Article 19 to Articles 21, 39 and 60-6 of the Shoko Chukin Bank Limited Act; together with Articles "
            "14 through 17, 23, 34, 37 through 39, 41 through 48, 52, 54, 55, 58 through 63 and 65 of the Supplementary "
            "Provisions and the specified amendment in Article 44 of those Provisions to Appended Table 1 of the "
            "Registration and License Tax Act: the date specified by Cabinet Order within a period not exceeding three "
            "months from the date of promulgation.\n\n"
            "(iii) the specified amendments in Article 1 to Articles 5, 21-2, 21-3, 24, 24-5, 25, 27, 27-30-2, "
            "27-30-6, 27-30-10, 27-32, 27-34, 57-2, 166, 172-3, 172-4, 172-12, 178, 185-7, 197-2, 200 and 209 of "
            "the Financial Instruments and Exchange Act, including deletion of Articles 24-4-7 and 24-4-8, and the "
            "following Article through Article 4 and Article 67 of the Supplementary Provisions: April 1, 2024."
        )
        edited[1] = """(Transitional Measures Concerning Penal Provisions)

Article 67 Prior laws continue to govern the application of penal provisions to an act committed before this Act comes into effect (or, for the provisions listed in Article 1, items (iii) and (iv), of the Supplementary Provisions, before those provisions come into effect; the same applies in this Article and the following Article) and to an act committed after this Act comes into effect in a case in which prior laws continue to govern pursuant to these Supplementary Provisions."""
        edited[2] = """(Delegation to Cabinet Order)

Article 68 Beyond what is provided for in these Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect, including transitional measures concerning penal provisions."""
    elif unit["id"] == "jp-appi-suppl-18":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding one year and three months from the date of promulgation; provided, however, that the provisions listed in the following items come into effect on the dates specified in those items.

(i) [Omitted]

(ii) Article 3 (excluding the provisions amending the table of contents and Article 2, paragraph (7), of the Act on the Use of Numbers to Identify a Specific Individual in Administrative Procedures; the provision adding one Article to Chapter I of that Act; and the provision adding a proviso and items to Article 16 of that Act, limited, within that provision, to the part concerning the proviso to Article 16; the same applies in the following item); Articles 8 through 11 of the Supplementary Provisions; the provision in Article 13 of the Supplementary Provisions amending Article 4, paragraph (2), item (iv), of the Act on Establishment of the Digital Agency; and Article 15 of the Supplementary Provisions: the date specified by Cabinet Order within a period not exceeding one year from the date of promulgation."""
    elif unit["id"] == "jp-appi-suppl-19":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date on which the Act Partially Amending the Civil Code and Related Acts (Act No. 45 of 2026; referred to below as the "Civil Code and Related Acts Amendment Act") comes into effect; provided, however, that the provision listed in the following item comes into effect on the date specified in that item.

(i) Article 5 of the Supplementary Provisions: the date of promulgation."""
        edited[1] = """(Delegation to Cabinet Order)

Article 5 Beyond what is provided for in the preceding three Articles, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect."""
    elif unit["id"] == "jp-appi-suppl-20":
        edited[0] = (
            "(Effective Date)\n\n"
            "Article 1 This Act comes into effect on the date specified by Cabinet Order within a period not exceeding "
            "two years from the date of promulgation; provided, however, that the provisions listed in the following "
            "items come into effect on the dates specified in those items.\n\n"
            "(i) Articles 13 and 16 of the Supplementary Provisions: the date of promulgation.\n\n"
            "(ii) Article 17 of the Supplementary Provisions: the later of the date of promulgation of the Act for "
            "Coordination of Related Acts Accompanying Enforcement of the Act Partially Amending the Civil Code, etc. "
            "(Act No. [number blank in source] of 2026) and the date of promulgation of this Act.\n\n"
            "(iii) in Article 1, the specified amendments to the table of contents and Articles 125, 163, 176, 178, "
            "179, 180, 181 through 185 of the Act on the Protection of Personal Information, including the deletion, "
            "renumbering and insertion of Articles described there; in Article 2, the amendments to Articles 49 and "
            "51, paragraph (1), of the Act on the Use of Numbers to Identify a Specific Individual in Administrative "
            "Procedures; in Article 3, the amendments to Articles 68 and 69 of the Act on Anonymously Processed Medical "
            "Information and Pseudonymized Medical Information to Contribute to Research and Development in the Medical "
            "Field; and the following Article and Article 3 of the Supplementary Provisions: the date six months after "
            "the date of promulgation."
        )
    elif unit["id"] == "jp-appi-suppl-21":
        edited[0] = """(Effective Date)

Article 1 This Act comes into effect on the date on which the Act on Establishment of the Disaster Management Agency (Act No. [number blank in source] of 2026) comes into effect; provided, however, that the provision listed in the following item comes into effect on the date specified in that item.

(i) Article 8 of the Supplementary Provisions: the date of promulgation."""
        edited[1] = """(Delegation to Cabinet Order)

Article 8 Beyond what is provided for in Article 2 through the preceding Article of the Supplementary Provisions, Cabinet Order prescribes necessary transitional measures connected with this Act's entry into effect, including transitional measures concerning penal provisions."""
    return edited


def applicability_metadata(unit: dict) -> dict:
    future_or_newly_phased = unit["id"] in {
        "jp-appi-suppl-19",
        "jp-appi-suppl-20",
        "jp-appi-suppl-21",
    }
    has_clause_specific_commencement = any(
        marker in unit["fullText"] for marker in ("政令で定める日", "ただし、次の各号", "施行の日")
    )
    if future_or_newly_phased:
        status = "promulgated-2026-future-conditional-or-phased-commencement"
        note = (
            "This 2026 supplementary block contains future, conditional, or phased commencement clauses. "
            "Its inclusion in the e-Gov snapshot does not mean that every underlying amendment was operative "
            "on 20 July 2026; each provision applies only from the date or triggering event stated in the "
            "controlling Japanese text."
        )
    elif has_clause_specific_commencement:
        status = "clause-specific-or-phased-commencement"
        note = (
            "This supplementary block contains provision-specific, conditional, or phased commencement language. "
            "Apply each clause only from the date, Cabinet Order, or triggering event stated in the controlling "
            "Japanese text; inclusion in the current consolidation does not establish uniform commencement."
        )
    else:
        status = "historical-transitional-provision-retained-in-current-consolidation"
        note = (
            "This historical supplementary or transitional provision is retained in the current e-Gov "
            "consolidation. Its continuing applicability depends on the dates and transition stated in the "
            "controlling Japanese text."
        )
    return {
        "status": status,
        "sourceSnapshotAsOf": AS_OF,
        "note": note,
    }


def annotate(check_only: bool = False) -> tuple[list[dict], dict, dict]:
    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    catalogue = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    catalogue_by_id = {unit["id"]: unit for unit in catalogue["units"]}
    target_units = [unit for unit in corpus if unit.get("unitType") == "supplementary-provision-block"]
    main_and_table_units = [
        unit for unit in corpus if unit.get("unitType") != "supplementary-provision-block"
    ]
    if len(target_units) != 21 or len(catalogue_by_id) != 21:
        raise ValueError("expected exactly 21 APPI supplementary-provision blocks")
    if len(main_and_table_units) != 187:
        raise ValueError("expected exactly 187 main-Article/table English-reference units")
    verified_government_units = []
    project_alignment_units = []
    for unit in main_and_table_units:
        english = unit.get("translations", {}).get("en", {})
        comparison = english.get("japaneseTextComparison", {})
        if english.get("currentTextEquivalent") is not True:
            raise ValueError(f"main/table English reference is not current-aligned: {unit['id']}")
        if english.get("status") == (
            "government-reference-translation-current-text-equivalent-verified-no-legal-effect"
        ):
            if comparison.get("normalizedTextEquivalent") is not True:
                raise ValueError(f"government equivalence audit drift: {unit['id']}")
            verified_government_units.append(unit)
        elif english.get("status") == "project-authored-reference-translation-no-legal-effect":
            if comparison.get("normalizedTextEquivalent") is not False:
                raise ValueError(f"project current-alignment audit drift: {unit['id']}")
            project_alignment_units.append(unit)
        else:
            raise ValueError(f"unexpected main/table English status: {unit['id']}")
    if len(verified_government_units) != 172 or len(project_alignment_units) != 15:
        raise ValueError(
            "expected 172 verified government-current-equivalent units and "
            "15 project current-alignment units"
        )

    for unit in target_units:
        draft = catalogue_by_id.get(unit["id"])
        if not draft:
            raise ValueError(f"missing catalogue unit {unit['id']}")
        if draft["sourceContentSha256"] != unit["contentSha256"]:
            raise ValueError(f"source hash mismatch for {unit['id']}")
        if draft["sourceParagraphCount"] != len(unit["paragraphs"]):
            raise ValueError(f"source paragraph count mismatch for {unit['id']}")
        if draft["sourceParagraphSequenceSha256"] != sha256("\n\n".join(unit["paragraphs"])):
            raise ValueError(f"source paragraph sequence mismatch for {unit['id']}")
        if draft["draftParagraphSequenceSha256"] != sha256("\n\n".join(draft["draftParagraphs"])):
            raise ValueError(f"draft hash mismatch for {unit['id']}")

        paragraphs = post_edit(unit, draft["draftParagraphs"])
        if len(paragraphs) != len(unit["paragraphs"]):
            raise ValueError(f"translation paragraph count mismatch for {unit['id']}")
        for source_paragraph, translated_paragraph in zip(unit["paragraphs"], paragraphs, strict=True):
            if len(source_paragraph.split("\n\n")) != len(translated_paragraph.split("\n\n")):
                raise ValueError(f"translation sub-block count mismatch for {unit['id']}")
        if any(re.search(r"[\u3040-\u30ff\u3400-\u9fff]", paragraph) for paragraph in paragraphs):
            raise ValueError(f"untranslated Japanese script remains in {unit['id']}")
        if any(re.search(r"Sanryaku|Shoryaku|Ryak|省略|略", paragraph, flags=re.IGNORECASE) for paragraph in paragraphs):
            raise ValueError(f"omission marker was not normalized in {unit['id']}")
        duplicate = re.compile(r"\b([A-Za-z]{3,})\b(?:\s+|,\s+)\1\b", flags=re.IGNORECASE)
        for paragraph in paragraphs:
            match = duplicate.search(paragraph)
            if match and match.group(1).lower() not in {"article", "information"}:
                raise ValueError(f"duplicated English word '{match.group(0)}' in {unit['id']}")

        title = SUPPLEMENT_TITLES[unit["id"]]
        full_text = f"{title}\n\n" + "\n\n".join(paragraphs)
        project_rights = {
            "reuseStatus": "cc-by-4.0-project-authored-translation",
            "license": "Creative Commons Attribution 4.0 International",
            "licenseUrl": LICENSE_URL,
            "attribution": "Compliance Compass contributors — nonofficial APPI supplementary-provision English reference",
            "originalTextBoundary": "CC BY 4.0 applies only to the project-authored English reference. The authoritative Japanese legal text and e-Gov source metadata retain their own legal status and reuse terms.",
        }
        translation_basis = {
            "method": "project-authored-machine-assisted-reference-translation",
            "sourceLanguage": "ja-JP",
            "sourceContentSha256": unit["contentSha256"],
            "sourceParagraphCount": len(unit["paragraphs"]),
            "draftCatalogue": str(CATALOGUE_PATH.relative_to(ROOT)),
            "draftCatalogueUnitSha256": draft["draftParagraphSequenceSha256"],
            "annotator": "scripts/annotate-japan-appi-supplement-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "qualityBoundary": "Paragraph order, sub-block boundaries, source hashes, captions, dates, Act numbers and recurring statutory terminology are mechanically verified or normalized. This is not a certified legal translation.",
        }
        old_reference = unit.get("translationReference")
        if old_reference and old_reference.get("availability") == "not-present-in-government-reference":
            unit["governmentReferenceAudit"] = old_reference
        unit["translations"] = unit.get("translations", {})
        unit["translations"]["en"] = {
            "title": title,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "en",
            "coverageStatus": "complete-current-project-reference",
            "versionAsOf": AS_OF,
            "versionLabel": "Current e-Gov Japanese consolidation as of 20 July 2026 — project-authored English reference",
            "currentTextEquivalent": True,
            "referenceViewEligible": True,
            "legalEffectStatus": "project-reference-translation-no-legal-effect",
            "status": "project-authored-reference-translation-no-legal-effect",
            "note": "Complete project-authored English reference for this current Japanese supplementary-provision block. It is machine-assisted, nonofficial and not legal advice; the Japanese text controls.",
            "authorityNote": "No government English text for this block was found in the Act No. 37 of 2021 Japanese Law Translation Database XML. This project reference was prepared directly from the current e-Gov Japanese text and is not issued or endorsed by the Government of Japan.",
            "source": SOURCE_URL,
            "sourceLabel": "e-Gov Law Search — controlling Japanese source for nonofficial project reference",
            "translationBasis": translation_basis,
            "applicability": applicability_metadata(unit),
            "contentSha256": sha256(full_text),
            "rights": project_rights,
        }
        unit["translationStatus"] = "project-authored-reference-translation-no-legal-effect"
        unit["englishAvailability"] = {
            "coverageStatus": "complete-current-project-reference",
            "status": "project-authored-reference-translation-no-legal-effect",
            "versionAsOf": AS_OF,
            "versionLabel": "Current e-Gov Japanese consolidation as of 20 July 2026",
            "currentTextEquivalent": True,
            "authorityNote": "The English text is a complete nonofficial project reference prepared from the current e-Gov Japanese text; Japanese controls.",
            "note": "The government JLT reference contains no supplementary provisions. A separately labelled project-authored English reference is stored for this block.",
        }
        unit["translationReference"] = {
            "language": "en",
            "availability": "complete-project-authored-current-reference",
            "sourceVersion": {
                "sourceLanguage": "ja-JP",
                "versionAsOf": AS_OF,
                "revisionId": unit["sourceVersion"]["revisionId"],
                "effectiveRevisionDate": unit["sourceVersion"]["effectiveRevisionDate"],
                "versionAlignment": "translation-of-the-current-stored-japanese-supplementary-block",
            },
            "translationBasis": translation_basis,
            "note": "Nonofficial machine-assisted project reference; Japanese controls.",
        }

    manifest = {
        "schemaVersion": 1,
        "manifestId": "jp-appi-supplement-project-english-2026-07-20",
        "reviewedAsOf": AS_OF,
        "instrumentId": "jp-appi",
        "scope": {
            "unitType": "supplementary-provision-block",
            "expectedUnitCount": 21,
            "translatedUnitCount": len(target_units),
            "sourceParagraphCount": sum(len(unit["paragraphs"]) for unit in target_units),
            "translationParagraphCount": sum(len(unit["translations"]["en"]["paragraphs"]) for unit in target_units),
            "translationLegalEffectStatusCount": sum(
                unit["translations"]["en"].get("legalEffectStatus")
                == "project-reference-translation-no-legal-effect"
                for unit in target_units
            ),
            "applicabilityNoteCount": sum(
                bool(unit["translations"]["en"].get("applicability", {}).get("note"))
                for unit in target_units
            ),
            "coverageStatus": "complete-current-project-reference",
        },
        "versionBoundary": {
            "controllingLanguage": "ja-JP",
            "controllingSource": SOURCE_URL,
            "sourceAsOf": AS_OF,
            "currentRevisionId": target_units[0]["sourceVersion"]["revisionId"],
            "governmentEnglishReferenceBoundary": "The JLT Act No. 37 of 2021 XML contains 185 main Articles and two appended tables but no supplementary provisions. These 21 English blocks are project references, not JLT text.",
        },
        "method": {
            "draftGenerator": "scripts/prepare-project-english-translation-drafts.py",
            "annotator": "scripts/annotate-japan-appi-supplement-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "cataloguePath": str(CATALOGUE_PATH.relative_to(ROOT)),
            "catalogueSha256": sha256(CATALOGUE_PATH.read_bytes()),
            "sourceHashLock": True,
            "paragraphOrderLock": True,
            "subBlockOrderLock": True,
            "qualityBoundary": "Machine-assisted project reference with deterministic terminology normalization and structural verification; not a certified legal translation.",
        },
        "rights": {
            "projectEnglishLicense": "CC BY 4.0",
            "projectEnglishLicenseUrl": LICENSE_URL,
            "originalJapaneseBoundary": "The licence applies only to the project-authored English reference. The e-Gov Japanese source remains authoritative and retains its own reuse terms.",
        },
        "hashes": {
            "sourceUnitSequenceSha256": sha256("\n\n".join(unit["fullText"] for unit in target_units)),
            "translationUnitSequenceSha256": sha256("\n\n".join(unit["translations"]["en"]["fullText"] for unit in target_units)),
        },
    }

    corpus_manifest = json.loads(CORPUS_MANIFEST_PATH.read_text(encoding="utf-8"))
    # The current-law importer owns the mixed 172-government / 15-project
    # main-and-table alignment manifest.  Validate that boundary here, but
    # preserve the complete translation object (including alignmentAudit)
    # verbatim if this supplement-only annotator is run in write mode.
    corpus_translation = corpus_manifest.get("translation", {})
    if corpus_translation.get("status") != "mixed-verified-government-and-project-current-references":
        raise ValueError("APPI corpus manifest current-alignment status drift")
    if corpus_translation.get("currentAlignedUnitCount") != 208:
        raise ValueError("APPI corpus manifest must keep all 208 nodes current-aligned")
    alignment_audit = corpus_translation.get("alignmentAudit", {})
    if alignment_audit.get("normalizedEquivalentUnitCount") != 172:
        raise ValueError("APPI corpus manifest must keep 172 verified government units")
    if alignment_audit.get("normalizedChangedUnitCount") != 15:
        raise ValueError("APPI corpus manifest must keep 15 project-aligned changed units")
    project_alignment_ids = {unit["id"] for unit in project_alignment_units}
    if set(alignment_audit.get("projectCurrentAlignmentUnitIds", [])) != project_alignment_ids:
        raise ValueError("APPI corpus manifest project-alignment unit IDs drifted")
    supplement_reference = corpus_translation.get("projectSupplementReference", {})
    if supplement_reference.get("supplementaryProvisionCount") != 21:
        raise ValueError("APPI corpus manifest supplementary-reference count drifted")
    if supplement_reference.get("manifest") != str(MANIFEST_PATH.relative_to(ROOT)):
        raise ValueError("APPI corpus manifest supplementary-reference path drifted")

    if not check_only:
        CORPUS_PATH.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        CORPUS_MANIFEST_PATH.write_text(json.dumps(corpus_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return corpus, manifest, corpus_manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate inputs and computed annotations without writing")
    args = parser.parse_args()
    corpus, manifest, _corpus_manifest = annotate(check_only=args.check)
    translated = sum(
        1
        for unit in corpus
        if unit.get("unitType") == "supplementary-provision-block" and unit.get("translations", {}).get("en")
    )
    print(
        f"APPI supplementary English: {translated}/21 blocks, "
        f"{manifest['scope']['translationParagraphCount']} paragraphs; check={args.check}"
    )


if __name__ == "__main__":
    main()
