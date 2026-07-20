import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inputPath = process.argv[2];
const outputFlagIndex = process.argv.indexOf("--output");
const outputPath = outputFlagIndex === -1
  ? resolve(root, "data/v2/sg-pdpa-provisions.json")
  : resolve(process.argv[outputFlagIndex + 1]);

if (!inputPath || (outputFlagIndex !== -1 && !process.argv[outputFlagIndex + 1])) {
  throw new Error(
    "Usage: node scripts/import-singapore-pdpa.mjs <browser-extracted-json> [--output <path>]",
  );
}

const raw = JSON.parse(await readFile(resolve(inputPath), "utf8"));
if (raw.sections?.length !== 95 || raw.schedules?.length !== 11) {
  throw new Error(
    `Expected 95 current section slots and 11 schedules; received ${raw.sections?.length ?? 0} and ${raw.schedules?.length ?? 0}`,
  );
}

const source = "https://sso.agc.gov.sg/Act/PDPA2012";
const amendmentActSource = "https://sso.agc.gov.sg/Acts-Supp/40-2020/";
const retrievedOn = "2026-07-20";
const rights = {
  reuseStatus: "permission-with-attribution-conditions",
  license: "Singapore Statutes Online reproduction permission",
  licenseUrl: "https://sso.agc.gov.sg/Help/FAQ",
  attribution:
    "Singapore legislation is subject to copyright of the Singapore Government and is reproduced with the permission of the Attorney-General's Chambers of Singapore. Users should check Singapore Statutes Online for the latest version. This project is responsible for the accuracy of its reproduction and does not present it as authoritative text.",
};

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeParagraphs(paragraphs) {
  return paragraphs
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function sectionCommencement(number) {
  if (["26A", "26B", "26C", "26D", "26E"].includes(number)) {
    return {
      appliesFrom: "2021-02-01",
      commencement: {
        status: "in-force",
        date: "2021-02-01",
        basis: "Part VIA was inserted by section 13 of the Personal Data Protection (Amendment) Act 2020, which the official Act page records as commencing on 1 February 2021.",
        amendingAct: "Personal Data Protection (Amendment) Act 2020",
        amendingActNumber: "Act 40 of 2020",
        amendingProvision: "section 13",
        commencementInstrument: "Personal Data Protection (Amendment) Act 2020 (Commencement) Notification 2021",
        commencementInstrumentNumber: "S 60/2021",
        source: amendmentActSource,
      },
    };
  }
  if (number === "48J") {
    return {
      appliesFrom: "2022-10-01",
      commencement: {
        status: "in-force-current-amended-mechanism",
        date: "2022-10-01",
        basis: "Section 24 of the Personal Data Protection (Amendment) Act 2020 introduced the turnover-based financial-penalty amendments now reflected in section 48J; the official Act page records section 24 as commencing on 1 October 2022.",
        amendingAct: "Personal Data Protection (Amendment) Act 2020",
        amendingActNumber: "Act 40 of 2020",
        amendingProvision: "section 24",
        commencementInstrument: "Personal Data Protection (Amendment) Act 2020 (Commencement) Notification 2022",
        commencementInstrumentNumber: "S 767/2022",
        source: amendmentActSource,
        historyNote: "Section 48J was inserted through section 23 of Act 40 of 2020 from 1 February 2021; this date records the commencement of its current turnover-based amendment, not the first existence of section 48J.",
      },
    };
  }
  return {};
}

const sectionRecords = raw.sections.map((section) => {
  const paragraphs = normalizeParagraphs(section.paragraphs);
  const fullText = paragraphs.join("\n\n");
  const repealed = section.title === "(Repealed)";
  return {
    id: `sg-pdpa-sec-${slug(section.number)}`,
    instrumentId: "sg-pdpa-2012",
    articleNumber: section.number,
    label: `Section ${section.number}`,
    title: section.title,
    summary: repealed
      ? `Section ${section.number} is retained as a repealed placeholder in the current consolidation.`
      : `Current consolidated section addressing ${section.title.toLowerCase()}.`,
    provisionType: "section",
    chapter: section.chapter,
    section: null,
    paragraphs,
    fullText,
    language: "en-SG",
    textAvailability: "government-consolidated-reference-text",
    legalEffectStatus: repealed ? "repealed" : "in-force",
    ...sectionCommencement(section.number),
    source,
    sourceFragment: `${source}#pr${section.number}-`,
    sourceLabel:
      "Singapore Statutes Online — current government consolidation (unofficial)",
    retrievedOn,
    versionAsOf: retrievedOn,
    sourceVersion: {
      officialTitle: "Personal Data Protection Act 2012",
      instrumentNumber: "Act 26 of 2012",
      adoptedOn: "2012-10-15",
      publishedOn: "2012-10-20",
      effectiveFrom: "2013-01-02",
      versionNote:
        "Current Singapore Statutes Online consolidation as at 20 July 2026. SSO states that its consolidated reproduction is unofficial and not authoritative.",
    },
    contentSha256: hash(fullText),
    rights,
  };
});

const scheduleNames = new Map([
  ["1", "First"],
  ["2", "Second"],
  ["3", "Third"],
  ["4", "Fourth"],
  ["5", "Fifth"],
  ["6", "Sixth"],
  ["7", "Seventh"],
  ["8", "Eighth"],
  ["9", "Ninth"],
  ["10", "Tenth"],
  ["11", "Eleventh"],
]);

const scheduleRecords = raw.schedules
  .sort((left, right) => Number(left.number) - Number(right.number))
  .map((schedule) => {
    const paragraphs = normalizeParagraphs(schedule.paragraphs);
    const fullText = paragraphs.join("\n\n");
    const repealed = /repealed/i.test(schedule.title + " " + fullText);
    const ordinal = scheduleNames.get(schedule.number) ?? schedule.number;
    return {
      id: `sg-pdpa-schedule-${schedule.number}`,
      instrumentId: "sg-pdpa-2012",
      articleNumber: `schedule-${schedule.number}`,
      label: `${ordinal} Schedule`,
      title: schedule.title,
      summary: repealed
        ? `The ${ordinal.toLowerCase()} Schedule is retained as a repealed placeholder.`
        : `The ${ordinal.toLowerCase()} Schedule supplies operative detail for ${schedule.title.toLowerCase()}.`,
      provisionType: "schedule",
      chapter: {
        id: "schedules",
        label: "Schedules",
        title: "Schedules",
      },
      section: null,
      paragraphs,
      fullText,
      language: "en-SG",
      textAvailability: "government-consolidated-reference-text",
      legalEffectStatus: repealed ? "repealed" : "in-force",
      source,
      sourceFragment: `${source}#Sc${schedule.number}-`,
      sourceLabel:
        "Singapore Statutes Online — current government consolidation (unofficial)",
      retrievedOn,
      versionAsOf: retrievedOn,
      sourceVersion: {
        officialTitle: "Personal Data Protection Act 2012",
        instrumentNumber: "Act 26 of 2012",
        adoptedOn: "2012-10-15",
        publishedOn: "2012-10-20",
        effectiveFrom: "2013-01-02",
        versionNote:
          "Current Singapore Statutes Online consolidation as at 20 July 2026. SSO states that its consolidated reproduction is unofficial and not authoritative.",
      },
      contentSha256: hash(fullText),
      rights,
    };
  });

const records = [...sectionRecords, ...scheduleRecords];
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`);
console.log(
  `sg-pdpa-provisions.json: ${sectionRecords.length} section slots + ${scheduleRecords.length} schedules`,
);
