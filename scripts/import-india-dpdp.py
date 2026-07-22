#!/usr/bin/env python3
"""Build complete, source-verifiable India DPDP Act and Rules corpora.

Primary sources are the Gazette PDFs published by MeitY.  The final Rules text
also applies G.S.R. 892(E), the official corrigendum of 10 December 2025.

Requirements: Python 3 and Poppler's ``pdftotext`` executable.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import urllib.request
from pathlib import Path


RETRIEVED_ON = "2026-07-20"
ROOT = Path(__file__).resolve().parents[1]

SOURCES = {
    "act": {
        "filename": "india-dpdp-act.pdf",
        "url": "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf",
        "label": "Gazette of India, Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)",
    },
    "commencement": {
        "filename": "india-dpdp-commencement.pdf",
        "url": "https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf",
        "label": "Gazette of India, G.S.R. 843(E), phased commencement notification",
    },
    "rules": {
        "filename": "india-dpdp-rules.pdf",
        "url": "https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf",
        "label": "Gazette of India, G.S.R. 846(E), Digital Personal Data Protection Rules, 2025",
    },
    "corrigendum": {
        "filename": "india-dpdp-corrigendum.pdf",
        "url": "https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf",
        "label": "Gazette of India, G.S.R. 892(E), corrigendum to G.S.R. 846(E)",
    },
}

COPYRIGHT_POLICY = "https://ecms.meity.gov.in/copyright"

ACT_TITLES = {
    1: "Short title and commencement",
    2: "Definitions",
    3: "Application of Act",
    4: "Grounds for processing personal data",
    5: "Notice",
    6: "Consent",
    7: "Certain legitimate uses",
    8: "General obligations of Data Fiduciary",
    9: "Processing of personal data of children",
    10: "Additional obligations of Significant Data Fiduciary",
    11: "Right to access information about personal data",
    12: "Right to correction and erasure of personal data",
    13: "Right of grievance redressal",
    14: "Right to nominate",
    15: "Duties of Data Principal",
    16: "Processing of personal data outside India",
    17: "Exemptions",
    18: "Establishment of Data Protection Board of India",
    19: "Composition and term of Chairperson and Members",
    20: "Terms and conditions of appointment of Chairperson and other Members",
    21: "Disqualifications for appointment and continuation as Chairperson and Member",
    22: "Resignation by Members and filling of vacancy",
    23: "Proceedings of Board",
    24: "Officers and employees of Board",
    25: "Members and officers to be public servants",
    26: "Powers of Chairperson",
    27: "Powers and functions of Board",
    28: "Procedure to be followed by Board",
    29: "Appeal to Appellate Tribunal",
    30: "Orders passed by Appellate Tribunal to be executable as decree",
    31: "Alternate dispute resolution",
    32: "Voluntary undertaking",
    33: "Penalties",
    34: "Crediting sums realised by way of penalties to Consolidated Fund of India",
    35: "Protection of action taken in good faith",
    36: "Power to call for information",
    37: "Power of Central Government to issue directions",
    38: "Consistency with other laws",
    39: "Bar of jurisdiction",
    40: "Power to make rules",
    41: "Laying of rules and certain notifications",
    42: "Power to amend Schedule",
    43: "Power to remove difficulties",
    44: "Amendments to certain Acts",
}

RULE_TITLES = {
    1: "Short title and commencement",
    2: "Definitions",
    3: "Notice given by Data Fiduciary to Data Principal",
    4: "Registration and obligations of Consent Manager",
    5: "Processing of personal data for provision or issue of subsidy, benefit, service, certificate, licence or permit by State and its instrumentalities",
    6: "Reasonable security safeguards",
    7: "Intimation of personal data breach",
    8: "Time period for specified purpose to be deemed as no longer being served",
    9: "Contact information of person to answer questions about processing",
    10: "Verifiable consent for processing of personal data of child",
    11: "Verifiable consent for processing of personal data of person with disability who has lawful guardian",
    12: "Exemptions from certain obligations applicable to processing of personal data of child",
    13: "Additional obligations of Significant Data Fiduciary",
    14: "Rights of Data Principals",
    15: "Transfer of personal data outside the territory of India",
    16: "Exemption from Act for research, archiving or statistical purposes",
    17: "Appointment of Chairperson and other Members",
    18: "Salary, allowances and other terms and conditions of service of Chairperson and other Members",
    19: "Procedure for meetings of Board and authentication of its orders, directions and instruments",
    20: "Functioning of Board as digital office",
    21: "Terms and conditions of appointment and service of officers and employees of Board",
    22: "Appeal to Appellate Tribunal",
    23: "Calling for information from Data Fiduciary or intermediary",
}

CHAPTERS = {
    range(1, 4): ("Chapter I", "Preliminary"),
    range(4, 11): ("Chapter II", "Obligations of Data Fiduciary"),
    range(11, 16): ("Chapter III", "Rights and duties of Data Principal"),
    range(16, 18): ("Chapter IV", "Special provisions"),
    range(18, 26): ("Chapter V", "Data Protection Board of India"),
    range(26, 29): ("Chapter VI", "Powers, functions and procedure to be followed by Board"),
    range(29, 33): ("Chapter VII", "Appeal and alternate dispute resolution"),
    range(33, 35): ("Chapter VIII", "Penalties and adjudication"),
    range(35, 45): ("Chapter IX", "Miscellaneous"),
}

CHAPTER_TEXT = [
    "CHAPTER I PRELIMINARY",
    "CHAPTER II OBLIGATIONS OF DATA FIDUCIARY",
    "CHAPTER III RIGHTS AND DUTIES OF DATA PRINCIPAL",
    "CHAPTER IV SPECIAL PROVISIONS",
    "CHAPTER V DATA PROTECTION BOARD OF INDIA",
    "CHAPTER VI POWERS, FUNCTIONS AND PROCEDURE TO BE FOLLOWED BY BOARD",
    "CHAPTER VII APPEAL AND ALTERNATE DISPUTE RESOLUTION",
    "CHAPTER VIII PENALTIES AND ADJUDICATION",
    "CHAPTER IX MISCELLANEOUS",
]


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def ensure_source(source_dir: Path, key: str) -> Path:
    info = SOURCES[key]
    path = source_dir / info["filename"]
    if path.exists():
        return path
    source_dir.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(info["url"], headers={"User-Agent": "Mozilla/5.0 corpus-import/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        path.write_bytes(response.read())
    return path


def pdftotext(path: Path, layout: bool = False, raw: bool = False) -> str:
    command = ["pdftotext"]
    if layout:
        command.append("-layout")
    if raw:
        command.append("-raw")
    command.extend([str(path), "-"])
    return subprocess.run(command, check=True, stdout=subprocess.PIPE).stdout.decode("utf-8")


def chapter_for(section_number: int) -> tuple[str, str]:
    for section_range, chapter in CHAPTERS.items():
        if section_number in section_range:
            return chapter
    raise ValueError(section_number)


def remove_gazette_debris(text: str) -> str:
    kept: list[str] = []
    for line in text.replace("\f", "\n").splitlines():
        stripped = line.strip()
        if not stripped:
            kept.append("")
            continue
        if re.fullmatch(r"\d{1,3}", stripped):
            continue
        if "THE GAZETTE OF INDIA" in stripped or "भारत का" in stripped:
            continue
        if re.fullmatch(r"\[(?:PART II—(?:SEC\. 3\(i\))?|PART II—|भाग II—.*)\]", stripped):
            continue
        if stripped.startswith("SEC. 1]") or stripped.startswith("[PART II—") or stripped.startswith("[भाग II—"):
            continue
        if re.fullmatch(r"\d+ of \d{4}\.", stripped):
            continue
        if stripped.startswith("Uploaded by ") or stripped.startswith("UPLOADED BY "):
            continue
        if stripped.startswith("and Published by ") or stripped.startswith("AND PUBLISHED BY "):
            continue
        if stripped.startswith("Digitally signed by ") or stripped.startswith("Date: 20"):
            continue
        kept.append(stripped)
    value = "\n".join(kept)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def normalize_act_text(text: str) -> str:
    replacements = {
        "thisAct": "this Act",
        "theAct": "the Act",
        "theAppellate": "the Appellate",
        "ProtectionAct": "Protection Act",
        "TechnologyAct": "Technology Act",
        "ManagementAct": "Management Act",
        "ImpactAssessment": "Impact Assessment",
        "IndiaAct": "India Act",
        "InformationAct": "Information Act",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = remove_gazette_debris(text)
    text = re.sub(r"\s+", " ", text).strip()
    for heading in CHAPTER_TEXT:
        number, title = heading.split(" ", 1)
        # ``pdftotext -raw`` sometimes joins the Roman numeral to CHAPTER.
        roman, title = title.split(" ", 1)
        text = re.sub(r"CHAPTER\s*" + re.escape(roman) + r"\s+" + re.escape(title), " ", text)
    for title in ACT_TITLES.values():
        text = re.sub(r"(?<![A-Za-z])" + re.escape(title) + r"\.(?=\s|$)", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def act_commencement(section_number: int) -> dict:
    immediate = {1, 2, *range(18, 27), 35, *range(38, 44)}
    if section_number in {6, 27, 44}:
        parts = {
            6: [
                {"part": "subsection (9)", "status": "scheduled-commencement", "appliesFrom": "2026-11-14"},
                {"part": "subsections (1)-(8) and (10)", "status": "scheduled-commencement", "appliesFrom": "2027-05-14"},
            ],
            27: [
                {"part": "subsection (1)(d)", "status": "scheduled-commencement", "appliesFrom": "2026-11-14"},
                {"part": "remainder of section", "status": "scheduled-commencement", "appliesFrom": "2027-05-14"},
            ],
            44: [
                {"part": "subsections (1) and (3)", "status": "in-force", "appliesFrom": "2025-11-14"},
                {"part": "subsection (2)", "status": "scheduled-commencement", "appliesFrom": "2027-05-14"},
            ],
        }
        return {
            "legalEffectStatus": "partially-in-force-phased" if section_number == 44 else "phased-commencement",
            "appliesFrom": None,
            "applicability": {"provisionParts": parts[section_number]},
        }
    if section_number in immediate:
        return {"legalEffectStatus": "in-force", "appliesFrom": "2025-11-14"}
    return {"legalEffectStatus": "scheduled-commencement", "appliesFrom": "2027-05-14"}


def rules_commencement(rule_number: int) -> dict:
    if rule_number in {1, 2, *range(17, 22)}:
        return {"legalEffectStatus": "in-force", "appliesFrom": "2025-11-14"}
    if rule_number == 4:
        return {"legalEffectStatus": "scheduled-commencement", "appliesFrom": "2026-11-14"}
    return {"legalEffectStatus": "scheduled-commencement", "appliesFrom": "2027-05-14"}


def common_rights() -> dict:
    return {
        "reuseStatus": "permitted-with-attribution",
        "basis": "MeitY Copyright Policy",
        "basisUrl": COPYRIGHT_POLICY,
        "note": "MeitY permits accurate reproduction of site material free of charge with prominent source acknowledgement, except identified third-party material.",
        "attributionRequired": True,
    }


def common_source_version(path: Path, **extra: str) -> dict:
    return {"sourceDocumentSha256": sha256_bytes(path.read_bytes()), **extra}


def build_act(act_path: Path, commencement_path: Path) -> list[dict]:
    raw = pdftotext(act_path, raw=True)
    start = raw.index("1. (1) This Act may be called")
    # Poppler emits the Schedule's table body before its heading in ``-raw``
    # reading order.  Cutting at ``THE SCHEDULE`` therefore leaks the entire
    # penalty table into section 44.  The final substituted RTI clause is the
    # actual terminal wording of section 44 in the pinned Gazette source, so
    # use it as the authoritative end of the operative sections instead.
    final_section_match = re.search(
        r"“\(j\)\s+information\s+which\s+relates\s+to\s+personal\s+information;”\.",
        raw[start:],
    )
    if final_section_match is None:
        raise RuntimeError("Act parser could not locate the terminal wording of section 44")
    end = start + final_section_match.end()
    body = raw[start:end]
    matches = list(re.finditer(r"(?m)^(\d{1,2})\.\s", body))
    section_matches = []
    expected = 1
    for match in matches:
        number = int(match.group(1))
        if number == expected:
            section_matches.append(match)
            expected += 1
            if expected == 45:
                break
    if [int(match.group(1)) for match in section_matches] != list(range(1, 45)):
        raise RuntimeError("Act parser did not find sections 1 through 44 in order")

    source_version = common_source_version(
        act_path,
        enactedOn="2023-08-11",
        gazetteIssueDate="2023-08-11",
        digitalPublicationDate="2023-08-12",
        actNumber="22 of 2023",
        commencementNotificationSha256=sha256_bytes(commencement_path.read_bytes()),
        commencementNotification=SOURCES["commencement"]["url"],
        commencementGazetteId="CG-DL-E-14112025-267647",
    )
    records: list[dict] = []
    for index, match in enumerate(section_matches):
        number = int(match.group(1))
        block_end = section_matches[index + 1].start() if index + 1 < len(section_matches) else len(body)
        full_text = normalize_act_text(body[match.start():block_end])
        if number == 1:
            # The first-page Gazette masthead is emitted after section 1 by
            # Poppler's raw reading order; it is not part of the section.
            full_text = full_text[: full_text.index("that provision.") + len("that provision.")]
        chapter, chapter_title = chapter_for(number)
        commencement = act_commencement(number)
        record = {
            "id": f"in-dpdp-act-2023-s{number}",
            "instrumentId": "in-dpdp-act-2023",
            "unitType": "section",
            "sectionNumber": str(number),
            "label": f"Section {number}",
            "title": ACT_TITLES[number],
            "chapter": chapter,
            "chapterTitle": chapter_title,
            "language": "en-IN",
            "paragraphs": [full_text],
            "fullText": full_text,
            "textAvailability": "complete-official-text",
            "source": SOURCES["act"]["url"],
            "sourceFragment": f"#section-{number}",
            "sourceLabel": SOURCES["act"]["label"],
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": source_version,
            "rights": common_rights(),
            "contentSha256": sha256_text(full_text),
            **commencement,
        }
        records.append(record)

    layout = pdftotext(act_path, layout=True)
    schedule_start = layout.index("THE SCHEDULE")
    schedule_end_candidates = [
        value for value in (layout.find("DR. REETA", schedule_start), layout.find("UPLOADED BY", schedule_start)) if value != -1
    ]
    schedule_end = min(schedule_end_candidates) if schedule_end_candidates else len(layout)
    schedule_text = remove_gazette_debris(layout[schedule_start:schedule_end])
    schedule_text = re.sub(r"[ \t]+$", "", schedule_text, flags=re.MULTILINE).strip()
    schedule_record = {
        "id": "in-dpdp-act-2023-schedule",
        "instrumentId": "in-dpdp-act-2023",
        "unitType": "schedule",
        "scheduleNumber": "Schedule",
        "label": "The Schedule",
        "title": "Penalties for breaches of the Act or rules",
        "chapter": "Schedule",
        "language": "en-IN",
        "paragraphs": [schedule_text],
        "fullText": schedule_text,
        "textAvailability": "complete-official-text",
        "source": SOURCES["act"]["url"],
        "sourceFragment": "#the-schedule",
        "sourceLabel": SOURCES["act"]["label"],
        "retrievedOn": RETRIEVED_ON,
        "sourceVersion": source_version,
        "rights": common_rights(),
        "contentSha256": sha256_text(schedule_text),
        "legalEffectStatus": "scheduled-commencement",
        "appliesFrom": "2027-05-14",
        "applicability": {"note": "The Schedule operates with section 33, whose commencement is scheduled for 18 months after Gazette publication."},
    }
    records.append(schedule_record)
    return records


def apply_rules_corrigendum(text: str) -> str:
    text = re.sub(r"date of publication\s+of this Gazette", "date of publication in the Official Gazette", text)
    text = text.replace("Ministries or Department of the Central Government", "Ministries or Departments of the Central Government")
    text = text.replace("may be given in such.", "may be given in such order.")
    text = text.replace("everybody corporate", "every body corporate")
    text = text.replace("(18 or 2013)", "(18 of 2013)")
    old_definitions = """(a) “advertisement” shall have the same meaning as is assigned to it in the Consumer Protection Act,
2019 (35 of 2019).
(a) “allied healthcare professional” shall have the same meaning as is assigned to it in the clause (d) of
section 2 of the National Commission for Allied and Healthcare Professions Act, 2021 (14 of 2021);
(b) “clinical establishment” shall have the same meaning as assigned to it in the clause (c) of section 2
of the Clinical Establishments (Registration and Regulation) Act, 2010 (23 of 2010);
(c) “educational institution” shall mean and include an institution of learning that imparts education,
including vocational education;
(d) “healthcare professional” shall have the same meaning as is assigned to it in clause (j) of section 2
of the National Commission for Allied and Healthcare Professions Act, 2021 (14 of 2021);
(e) “health services” shall mean the services required to be provided by a healthcare professional as
referred to in clause (j) of section 2 of the National Commission for Allied and Healthcare Professions
Act, 2021 (14 of 2021); and
(f) “mental health establishment” shall have the same meaning as is assigned to it in clause (p) of subsection (1) of section 2 of the Mental Healthcare Act, 2017 (10 of 2017)."""
    new_definitions = old_definitions.replace("2019 (35 of 2019).", "2019 (35 of 2019);")
    for old, new in [("\n(a) “allied", "\n(b) “allied"), ("\n(b) “clinical", "\n(c) “clinical"), ("\n(c) “educational", "\n(d) “educational"), ("\n(d) “healthcare", "\n(e) “healthcare"), ("\n(e) “health services", "\n(f) “health services"), ("\n(f) “mental", "\n(g) “mental")]:
        new_definitions = new_definitions.replace(old, new)
    if old_definitions not in text:
        raise RuntimeError("Could not locate the Fourth Schedule definition list corrected by G.S.R. 892(E)")
    return text.replace(old_definitions, new_definitions)


def clean_rules_block(text: str) -> str:
    text = remove_gazette_debris(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def schedule_status(schedule_number: int) -> tuple[str, str]:
    status_by_schedule = {
        1: ("scheduled-commencement", "2026-11-14"),
        2: ("scheduled-commencement", "2027-05-14"),
        3: ("scheduled-commencement", "2027-05-14"),
        4: ("scheduled-commencement", "2027-05-14"),
        5: ("in-force", "2025-11-14"),
        6: ("in-force", "2025-11-14"),
        7: ("scheduled-commencement", "2027-05-14"),
    }
    return status_by_schedule[schedule_number]


def build_rules(rules_path: Path, corrigendum_path: Path) -> list[dict]:
    text = pdftotext(rules_path)
    english_start = text.index("MINISTRY OF ELECTRONICS AND INFORMATION TECHNOLOGY")
    text = apply_rules_corrigendum(text[english_start:])
    first_schedule = text.index("FIRST SCHEDULE")
    rules_body = text[:first_schedule]
    matches = list(re.finditer(r"(?m)^(\d{1,2})\.\s*", rules_body))
    rule_matches = []
    expected = 1
    for match in matches:
        number = int(match.group(1))
        if number == expected:
            rule_matches.append(match)
            expected += 1
            if expected == 24:
                break
    if [int(match.group(1)) for match in rule_matches] != list(range(1, 24)):
        raise RuntimeError("Rules parser did not find rules 1 through 23 in order")

    source_version = common_source_version(
        rules_path,
        notifiedOn="2025-11-13",
        gazetteIssueDate="2025-11-13",
        digitalPublicationDate="2025-11-14",
        gazetteId="CG-DL-E-14112025-267650",
        corrigendumSha256=sha256_bytes(corrigendum_path.read_bytes()),
        corrigendum=SOURCES["corrigendum"]["url"],
        corrigendumGazetteId="CG-DL-E-12122025-268455",
        textState="G.S.R. 846(E) as corrected by G.S.R. 892(E)",
    )
    records: list[dict] = []
    for index, match in enumerate(rule_matches):
        number = int(match.group(1))
        block_end = rule_matches[index + 1].start() if index + 1 < len(rule_matches) else len(rules_body)
        full_text = clean_rules_block(rules_body[match.start():block_end])
        record = {
            "id": f"in-dpdp-rules-2025-r{number}",
            "instrumentId": "in-dpdp-rules-2025",
            "unitType": "rule",
            "ruleNumber": str(number),
            "label": f"Rule {number}",
            "title": RULE_TITLES[number],
            "language": "en-IN",
            "paragraphs": [full_text],
            "fullText": full_text,
            "textAvailability": "complete-official-text-as-corrected",
            "source": SOURCES["rules"]["url"],
            "sourceFragment": f"#rule-{number}",
            "sourceLabel": SOURCES["rules"]["label"],
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": source_version,
            "rights": common_rights(),
            "contentSha256": sha256_text(full_text),
            **rules_commencement(number),
        }
        records.append(record)

    schedule_markers = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH"]
    schedule_titles = [
        "Conditions for registration and obligations of Consent Manager",
        "Standards for processing by the State and its instrumentalities",
        "Retention periods for specified classes of Data Fiduciaries",
        "Exemptions concerning processing of children's personal data",
        "Terms and conditions of service of Chairperson and other Members",
        "Terms and conditions of appointment and service of officers and employees of Board",
        "Purposes and authorised persons for calling for information",
    ]
    schedule_positions = [text.index(f"{marker} SCHEDULE") for marker in schedule_markers]
    source_end_candidates = [value for value in (text.find("[F. No.", schedule_positions[-1]), text.find("Uploaded by", schedule_positions[-1])) if value != -1]
    source_end = min(source_end_candidates) if source_end_candidates else len(text)
    for index, start in enumerate(schedule_positions):
        number = index + 1
        end = schedule_positions[index + 1] if index + 1 < len(schedule_positions) else source_end
        full_text = remove_gazette_debris(text[start:end])
        full_text = re.sub(r"[ \t]+$", "", full_text, flags=re.MULTILINE).strip()
        status, applies_from = schedule_status(number)
        records.append({
            "id": f"in-dpdp-rules-2025-schedule-{number}",
            "instrumentId": "in-dpdp-rules-2025",
            "unitType": "schedule",
            "scheduleNumber": str(number),
            "label": f"{schedule_markers[index].title()} Schedule",
            "title": schedule_titles[index],
            "language": "en-IN",
            "paragraphs": [full_text],
            "fullText": full_text,
            "textAvailability": "complete-official-text-as-corrected",
            "source": SOURCES["rules"]["url"],
            "sourceFragment": f"#schedule-{number}",
            "sourceLabel": SOURCES["rules"]["label"],
            "retrievedOn": RETRIEVED_ON,
            "sourceVersion": source_version,
            "rights": common_rights(),
            "contentSha256": sha256_text(full_text),
            "legalEffectStatus": status,
            "appliesFrom": applies_from,
        })
    return records


def write_json(path: Path, value: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=Path("/private/tmp"))
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data" / "v2")
    args = parser.parse_args()

    paths = {key: ensure_source(args.source_dir, key) for key in SOURCES}
    act = build_act(paths["act"], paths["commencement"])
    rules = build_rules(paths["rules"], paths["corrigendum"])
    write_json(args.output_dir / "india-dpdp-act-2023-provisions.json", act)
    write_json(args.output_dir / "india-dpdp-rules-2025-provisions.json", rules)
    print(f"Wrote {len(act)} Act units and {len(rules)} Rules units")


if __name__ == "__main__":
    main()
