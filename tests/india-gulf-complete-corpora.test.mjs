import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const [indiaAct, indiaRules, uae, saLaw, saIr, saTransfer] =
  await Promise.all([
    loadJson("india-dpdp-act-2023-provisions.json"),
    loadJson("india-dpdp-rules-2025-provisions.json"),
    loadJson("uae-federal-pdpl-45-2021-articles.json"),
    loadJson("sa-pdpl-2021-amended-2023-articles.json"),
    loadJson("sa-pdpl-implementing-regulation-2023-articles.json"),
    loadJson("sa-pdpl-transfer-regulation-2023-articles.json"),
  ]);

function assertIntegrity(unit) {
  assert.ok(unit.fullText.length > 0);
  assert.deepEqual(unit.paragraphs, [unit.fullText]);
  assert.equal(unit.contentSha256, digest(unit.fullText));
  assert.equal(unit.retrievedOn, "2026-07-20");
  assert.match(unit.source, /^https:\/\//);
  assert.ok(unit.sourceVersion.sourceDocumentSha256 || unit.sourceVersion.arabicSourceSnapshotSha256 || unit.sourceVersion.arabicPayloadSha256);
  assert.match(unit.rights.reuseStatus, /permitted|statutory-exclusion/);
  assert.doesNotMatch(
    unit.fullText,
    /chevron_left|Complementary Content|\$\{title\}|PUBLISHED BY AUTHORITY|CHAPTER(?:III|IV|V|VI|VII|VIII|IX)/,
  );
}

function assertOfficialArabicEnglishCorpus(
  units,
  { count, instrumentId, idPrefix, source, englishSource },
) {
  assert.equal(units.length, count);
  assert.deepEqual(
    units.map((unit) => unit.articleNumber),
    Array.from({ length: count }, (_, index) => String(index + 1)),
  );
  for (const [index, unit] of units.entries()) {
    const number = index + 1;
    assertIntegrity(unit);
    assert.equal(unit.id, `${idPrefix}${number}`);
    assert.equal(unit.instrumentId, instrumentId);
    assert.equal(unit.label, `Article ${number}`);
    assert.match(unit.language, /^ar-/);
    assert.match(unit.fullText, /[\u0600-\u06ff]/u);
    assert.equal(unit.source, source);
    assert.equal(unit.alignment.level, "article");
    assert.equal(unit.alignment.originalUnitCount, count);
    assert.equal(unit.alignment.englishUnitCount, count);

    const english = unit.translations.en;
    assert.equal(english.status, "official-reference-translation");
    assert.equal(english.language, "en");
    assert.equal(english.source, englishSource);
    assert.deepEqual(english.paragraphs, [english.fullText]);
    assert.match(english.fullText, /[A-Za-z]/);
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.match(english.authorityNote, /Arabic is the original/i);
  }
}

test("India DPDP Act corpus contains all 44 sections and the complete Schedule", () => {
  assert.equal(indiaAct.length, 45);
  const sections = indiaAct.slice(0, 44);
  assert.deepEqual(
    sections.map((unit) => unit.sectionNumber),
    Array.from({ length: 44 }, (_, index) => String(index + 1)),
  );
  for (const [index, section] of sections.entries()) {
    const number = index + 1;
    assertIntegrity(section);
    assert.equal(section.id, `in-dpdp-act-2023-s${number}`);
    assert.equal(section.instrumentId, "in-dpdp-act-2023");
    assert.equal(section.unitType, "section");
    assert.equal(section.language, "en-IN");
    assert.ok(section.fullText.startsWith(`${number}.`));
  }
  const schedule = indiaAct.at(-1);
  assertIntegrity(schedule);
  assert.equal(schedule.id, "in-dpdp-act-2023-schedule");
  assert.equal(schedule.unitType, "schedule");
  assert.match(schedule.fullText, /May extend to two[\s\S]*hundred and fifty[\s\S]*crore rupees/);

  assert.match(sections[7].fullText, /reasonable security safeguards to prevent personal data breach/i);
  assert.match(sections[9].fullText, /Data Protection Impact Assessment/i);
  assert.match(sections[15].fullText, /restrict the transfer of personal data/i);
  assert.match(sections[32].fullText, /monetary penalty specified in the Schedule/i);
  assert.equal(sections[43].legalEffectStatus, "partially-in-force-phased");
  assert.deepEqual(
    sections[43].applicability.provisionParts.map((part) => part.appliesFrom),
    ["2025-11-14", "2027-05-14"],
  );
});

test("India DPDP commencement metadata preserves all three phases", () => {
  const sections = indiaAct.slice(0, 44);
  assert.equal(sections.filter((unit) => unit.legalEffectStatus === "in-force").length, 18);
  assert.equal(sections.filter((unit) => unit.legalEffectStatus === "phased-commencement").length, 2);
  assert.equal(sections.filter((unit) => unit.legalEffectStatus === "partially-in-force-phased").length, 1);
  assert.equal(sections.filter((unit) => unit.legalEffectStatus === "scheduled-commencement").length, 23);
  assert.equal(sections[5].applicability.provisionParts[0].appliesFrom, "2026-11-14");
  assert.equal(sections[26].applicability.provisionParts[1].appliesFrom, "2027-05-14");
  assert.equal(indiaAct.at(-1).appliesFrom, "2027-05-14");
});

test("India DPDP Rules corpus contains 23 rules and seven Schedules with the official corrigendum applied", () => {
  assert.equal(indiaRules.length, 30);
  const rules = indiaRules.slice(0, 23);
  const schedules = indiaRules.slice(23);
  assert.deepEqual(
    rules.map((unit) => unit.ruleNumber),
    Array.from({ length: 23 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(
    schedules.map((unit) => unit.scheduleNumber),
    Array.from({ length: 7 }, (_, index) => String(index + 1)),
  );
  for (const unit of indiaRules) {
    assertIntegrity(unit);
    assert.equal(unit.instrumentId, "in-dpdp-rules-2025");
    assert.equal(unit.sourceVersion.textState, "G.S.R. 846(E) as corrected by G.S.R. 892(E)");
  }

  const complete = indiaRules.map((unit) => unit.fullText).join("\n");
  for (const corrected of [
    "publication in the Official Gazette",
    "Ministries or Departments of the Central Government",
    "given in such order.",
    "every body corporate",
    "(18 of 2013)",
    "(g) “mental health establishment”",
  ]) {
    assert.ok(complete.includes(corrected), `missing corrigendum wording: ${corrected}`);
  }
  for (const superseded of [
    "publication of this Gazette",
    "Ministries or Department of the Central Government",
    "given in such.",
    "everybody corporate",
    "(18 or 2013)",
    "(f) “mental health establishment”",
  ]) {
    assert.ok(!complete.includes(superseded), `superseded wording remains: ${superseded}`);
  }
  assert.match(rules[12].fullText, /algorithmic software/i);
  assert.match(rules[5].fullText, /encryption, obfuscation, masking or the use of virtual tokens/i);
  assert.match(rules[6].fullText, /within seventy-two hours/i);
});

test("India DPDP Rules status metadata distinguishes current, one-year, and eighteen-month phases", () => {
  assert.equal(indiaRules.filter((unit) => unit.legalEffectStatus === "in-force").length, 9);
  assert.equal(indiaRules.filter((unit) => unit.appliesFrom === "2026-11-14").length, 2);
  assert.equal(indiaRules.filter((unit) => unit.appliesFrom === "2027-05-14").length, 19);
});

test("UAE PDPL has all 31 controlling Arabic Articles aligned to the official English reference", () => {
  assertOfficialArabicEnglishCorpus(uae, {
    count: 31,
    instrumentId: "ae-federal-pdpl-45-2021",
    idPrefix: "ae-federal-pdpl-45-2021-a",
    source: "https://www.uaelegislation.gov.ae/ar/legislations/1972",
    englishSource: "https://www.uaelegislation.gov.ae/en/legislations/1972",
  });
  assert.equal(uae[0].sourceVersion.officialGazetteNumber, "712 (Supplement)");
  assert.equal(uae[0].appliesFrom, "2022-01-02");
  assert.match(uae[17].fullText, /المعالجة المؤتمتة/u);
  assert.match(uae[17].translations.en.fullText, /automated processing/i);
  assert.match(uae[20].translations.en.fullText, /high risk to the privacy and confidentiality/i);
  assert.match(uae[22].originalTitle, /عدم وجود مستوى حماية ملائم/u);
});

test("Saudi PDPL has all 43 consolidated Arabic Articles and official English references", () => {
  assertOfficialArabicEnglishCorpus(saLaw, {
    count: 43,
    instrumentId: "sa-pdpl-2021-amended-2023",
    idPrefix: "sa-pdpl-2021-amended-2023-a",
    source: "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL",
    englishSource: saLaw[0].translations.en.source,
  });
  assert.equal(saLaw[0].sourceVersion.amendedBy, "Royal Decree No. M/148 dated 5/9/1444 AH");
  assert.equal(saLaw[0].appliesFrom, "2023-09-14");
  assert.match(saLaw[3].fullText, /الحق في العلم/u);
  assert.match(saLaw[28].translations.en.fullText, /Transfer\s+Personal Data outside the Kingdom/i);
  assert.match(saLaw[30].fullText, /سجلات/u);
  assert.match(saLaw[42].fullText, /سبعمائة وعشرين/u);
});

test("Saudi Implementing Regulation has all 38 bilingual Article nodes", () => {
  assertOfficialArabicEnglishCorpus(saIr, {
    count: 38,
    instrumentId: "sa-pdpl-implementing-regulation-2023",
    idPrefix: "sa-pdpl-implementing-regulation-2023-a",
    source: "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2",
    englishSource: saIr[0].translations.en.source,
  });
  assert.equal(saIr[0].appliesFrom, "2023-09-14");
  assert.equal(saIr[17].title, "Processing data for a purpose other than the one for which it was collected");
  assert.match(saIr[18].fullText, /الحد الأدنى/u);
  assert.match(saIr[23].translations.en.fullText, /Personal Data Breach/i);
  assert.match(saIr[24].translations.en.fullText, /Impact Assessment/i);
  assert.match(saIr[28].translations.en.fullText, /Direct Marketing/i);
});

test("Saudi Transfer Regulation Version 2.0 has all nine bilingual Article nodes", () => {
  assertOfficialArabicEnglishCorpus(saTransfer, {
    count: 9,
    instrumentId: "sa-pdpl-transfer-regulation-2023",
    idPrefix: "sa-pdpl-transfer-regulation-2023-a",
    source: "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom",
    englishSource: saTransfer[0].translations.en.source,
  });
  assert.equal(saTransfer[0].sourceVersion.documentVersion, "2.0");
  assert.equal(saTransfer[0].sourceVersion.documentDate, "2024-08");
  assert.equal(saTransfer[0].appliesFrom, null);
  assert.match(saTransfer[3].fullText, /الضمانات المناسبة/u);
  assert.match(saTransfer[6].translations.en.fullText, /risk assessment/i);
  assert.match(saTransfer[8].fullText, /تاريخ نشرها في الجريدة الرسمية/u);
});
