import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const corpusPath = join(root, "data/v2/hk-pdpo-486-provisions.json");
const manifestPath = join(
  root,
  "data/v2/source-snapshots/hk-pdpo-cap486-source-manifest.json",
);
const englishSnapshotPath = join(
  root,
  "data/v2/source-snapshots/hk-pdpo-cap486-20221001-en.xml",
);
const chineseSnapshotPath = join(
  root,
  "data/v2/source-snapshots/hk-pdpo-cap486-20221001-zh-Hant-HK.xml",
);
const importerPath = join(root, "scripts/import-hong-kong-pdpo.py");

const corpusBytes = await readFile(corpusPath);
const manifestBytes = await readFile(manifestPath);
const records = JSON.parse(corpusBytes);
const manifest = JSON.parse(manifestBytes);
const englishSnapshot = await readFile(englishSnapshotPath);
const chineseSnapshot = await readFile(chineseSnapshotPath);
const byId = new Map(records.map((record) => [record.id, record]));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("Cap. 486 corpus includes all 124 Ordinance sections and all 6 schedules", () => {
  assert.equal(records.length, 130);
  assert.equal(new Set(records.map((record) => record.id)).size, 130);
  assert.equal(
    records.filter((record) => record.provisionType === "section").length,
    124,
  );
  assert.equal(
    records.filter((record) => record.provisionType === "schedule").length,
    6,
  );
  assert.deepEqual(
    records
      .filter((record) => record.provisionType === "schedule")
      .map((record) => record.articleNumber),
    ["1", "2", "3", "4", "5", "6"],
  );
});

test("source snapshots and generated corpus match the rights and hash manifest", () => {
  assert.equal(
    sha256(englishSnapshot),
    "57189e97b8cbcc32855d9b524a5bf825c670858c9017da281cd84648fd86825f",
  );
  assert.equal(
    sha256(chineseSnapshot),
    "42aaccf483c282fd23c8b91081cff763ad1e9936d4c402a4d7a12235efa5f68d",
  );
  assert.equal(manifest.snapshots[0].snapshotSha256, sha256(englishSnapshot));
  assert.equal(manifest.snapshots[1].snapshotSha256, sha256(chineseSnapshot));
  assert.equal(manifest.corpus.sha256, sha256(corpusBytes));
  assert.equal(manifest.corpus.nodeCount, 130);
  assert.equal(manifest.currentVersionDate, "2022-10-01");
  assert.equal(
    manifest.dataset.archiveObservedLastModified,
    "2026-07-20T13:00:04Z",
  );
  assert.match(manifest.snapshots[0].archiveUrl, /hkel_c_leg_cap_301_cap_600_en\.zip$/);
  assert.match(
    manifest.snapshots[1].archiveUrl,
    /hkel_c_leg_cap_301_cap_600_zh-Hant\.zip$/,
  );
  assert.match(
    englishSnapshot.toString("utf8"),
    /<(?:dc:)?date>2022-10-01<\/(?:dc:)?date>/,
  );
  assert.match(chineseSnapshot.toString("utf8"), /xml:lang="zh-Hant-HK"/);
});

test("English defaults and complete Traditional Chinese texts remain co-authentic", () => {
  for (const record of records) {
    const chinese = record.translations["zh-Hant-HK"];
    assert.equal(record.language, "en-HK");
    assert.equal(record.defaultLanguage, "en-HK");
    assert.deepEqual(record.availableLanguages, ["en-HK", "zh-Hant-HK"]);
    assert.ok(record.paragraphs.length > 0, `${record.id} lacks English text`);
    assert.ok(chinese.paragraphs.length > 0, `${record.id} lacks Chinese text`);
    assert.equal(record.fullText, record.paragraphs.join("\n\n"));
    assert.equal(chinese.fullText, chinese.paragraphs.join("\n\n"));
    assert.equal(record.contentSha256, sha256(record.fullText));
    assert.equal(chinese.contentSha256, sha256(chinese.fullText));
    assert.equal(
      record.bilingualContentSha256,
      sha256(`${record.fullText}\0${chinese.fullText}`),
    );
    assert.equal(chinese.status, "official-co-authentic-equal-status");
    assert.equal(record.authenticity.status, "co-authentic-equal-status");
    assert.match(record.authenticity.authority, /Cap\. 1.*section 10B\(1\)/);
    assert.match(record.authenticity.authorityNote, /Neither text is a translation/);
    assert.equal(
      record.sourceRecord.temporalId,
      chinese.sourceRecord.temporalId,
    );
    assert.equal(
      record.alignment.status,
      "official-temporal-id-aligned-co-authentic-texts",
    );
    assert.equal(record.textNormalization.languageGeneration, "none");
  }
});

test("Section 33 is enacted but not in operation and is never labelled current duty", () => {
  const section33 = byId.get("hk-personal-data-privacy-ordinance-sec-33");
  const chinese = section33.translations["zh-Hant-HK"];
  assert.equal(section33.legalEffectStatus, "enacted-not-yet-in-operation");
  assert.equal(section33.commencementStatus, "not-yet-in-operation");
  assert.equal(section33.applicability.sourceStatus, "pending");
  assert.equal(section33.applicability.sourceReason, "notYetInOperation");
  assert.equal(section33.applicability.commencementDate, null);
  assert.equal(section33.appliesFrom, null);
  assert.equal(section33.sourceRecord.sourceVersionStartDate, null);
  assert.equal(chinese.sourceRecord.sourceVersionStartDate, null);
  assert.match(section33.fullText, /^\(Not yet in operation\)/);
  assert.match(section33.fullText, /shall not transfer personal data to a place outside Hong Kong/);
  assert.match(chinese.fullText, /^\(尚未實施\)/);
  assert.match(chinese.fullText, /不得將個人資料移轉至香港以外的地方/u);

  assert.deepEqual(
    records
      .filter((record) => record.legalEffectStatus === "enacted-not-yet-in-operation")
      .map((record) => record.id),
    ["hk-personal-data-privacy-ordinance-sec-33"],
  );
});

test("repealed and omitted placeholders remain in their official source positions", () => {
  const section34 = byId.get("hk-personal-data-privacy-ordinance-sec-34");
  assert.equal(section34.legalEffectStatus, "repealed-placeholder");
  assert.equal(section34.displayTitleGeneratedForPlaceholder, true);
  assert.equal(section34.sourceHeading, null);
  assert.equal(section34.title, "(Repealed)");
  assert.equal(section34.originalTitle, "(已廢除)");
  assert.equal(section34.fullText, "(Repealed 18 of 2012 s. 20)");

  for (const number of ["72", "73"]) {
    const record = byId.get(`hk-personal-data-privacy-ordinance-sec-${number}`);
    assert.equal(record.legalEffectStatus, "omitted-as-spent-placeholder");
    assert.equal(record.title, "(Omitted as spent)");
    assert.match(record.fullText, /Omitted as spent—E\.R\. 1 of 2013/);
    assert.match(record.translations["zh-Hant-HK"].fullText, /已失時效而略去/u);
  }

  assert.deepEqual(
    records
      .filter((record) => record.legalEffectStatus !== "in-force")
      .map((record) => record.id),
    [
      "hk-personal-data-privacy-ordinance-sec-33",
      "hk-personal-data-privacy-ordinance-sec-34",
      "hk-personal-data-privacy-ordinance-sec-72",
      "hk-personal-data-privacy-ordinance-sec-73",
    ],
  );
});

test("HKLM startPeriod dates are preserved without being mislabelled commencement dates", () => {
  for (const record of records) {
    assert.equal(record.appliesFrom, null);
    assert.equal(record.applicability.commencementDate, null);
    assert.match(record.applicability.dateBoundaryNote, /not asserted.*commencement date/i);
  }
  assert.deepEqual(
    byId.get("hk-personal-data-privacy-ordinance-sec-12").applicability.sourceVersionStartDate,
    { "en-HK": "2018-04-20", "zh-Hant-HK": "2013-04-25" },
  );
  assert.deepEqual(
    byId.get("hk-personal-data-privacy-ordinance-sec-35k").applicability.sourceVersionStartDate,
    { "en-HK": "2013-04-01", "zh-Hant-HK": "2014-12-05" },
  );
  assert.deepEqual(
    byId.get("hk-personal-data-privacy-ordinance-schedule-1").applicability.sourceVersionStartDate,
    { "en-HK": "2018-04-20", "zh-Hant-HK": "2013-04-25" },
  );
});

test("privacy definitions, DPPs, direct marketing, doxxing and warrants are complete", () => {
  assert.match(
    byId.get("hk-personal-data-privacy-ordinance-sec-2").fullText,
    /personal data[\s\S]*relating directly or indirectly to a living individual/i,
  );
  assert.match(
    byId.get("hk-personal-data-privacy-ordinance-sec-26").fullText,
    /erase personal data held by the data user/i,
  );
  assert.match(
    byId.get("hk-personal-data-privacy-ordinance-sec-35c").fullText,
    /intends to use a data subject’s personal data in direct marketing/i,
  );
  assert.match(
    byId.get("hk-personal-data-privacy-ordinance-sec-35j").fullText,
    /intends to provide a data subject’s personal data to another person/i,
  );
  assert.match(
    byId.get("hk-personal-data-privacy-ordinance-sec-64").fullText,
    /specified harm to the data subject or any family member/i,
  );

  const scheduleOne = byId.get("hk-personal-data-privacy-ordinance-schedule-1");
  assert.match(scheduleOne.fullText, /Principle 1—purpose and manner of collection/);
  assert.match(scheduleOne.fullText, /Principle 2—accuracy and duration of retention/);
  assert.match(scheduleOne.fullText, /Principle 3—use of personal data/);
  assert.match(scheduleOne.fullText, /Principle 4—security of personal data/);
  assert.match(scheduleOne.fullText, /Principle 6—access to personal data/);
  assert.match(
    scheduleOne.translations["zh-Hant-HK"].fullText,
    /第4原則——個人資料的保安/u,
  );

  const scheduleSix = byId.get("hk-personal-data-privacy-ordinance-schedule-6");
  assert.match(scheduleSix.fullText, /Warrant Authorizing/);
  assert.match(scheduleSix.fullText, /Privacy Commissioner for Personal Data/);
  assert.match(scheduleSix.translations["zh-Hant-HK"].fullText, /個人資料私隱專員/u);
});

test("hierarchy, official links, format caveat and reuse attribution are explicit", () => {
  const section18 = byId.get("hk-personal-data-privacy-ordinance-sec-18");
  assert.equal(section18.structure.part.label, "Part 5");
  assert.equal(section18.structure.division.label, "Division 1");
  assert.equal(section18.structure.part.coAuthenticLabel, "第5部");
  assert.match(section18.sourceFragment, /cap486!en\/s18$/);
  assert.match(
    section18.translations["zh-Hant-HK"].source,
    /cap486!zh-Hant-HK\/s18$/,
  );

  for (const record of records) {
    assert.equal(record.versionAsOf, "2022-10-01");
    assert.equal(record.retrievedOn, "2026-07-20");
    assert.match(record.sourceFormatStatus.snapshotLegalStatus, /not-verified-PDF/);
    assert.match(record.sourceFormatStatus.note, /only a PDF.*official verification mark/i);
    assert.match(record.rights.licenseUrl, /data\.gov\.hk\/en\/terms-and-conditions$/);
    assert.match(record.rights.attribution, /Hong Kong e-Legislation/);
    assert.match(record.rights.conditionsNote, /indemnity/i);
  }
});

test("version-locked importer reproduces corpus and manifest byte for byte", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "hk-personal-data-privacy-ordinance-"));
  const generatedCorpus = join(temporaryDirectory, "corpus.json");
  const generatedManifest = join(temporaryDirectory, "manifest.json");
  try {
    await execFileAsync("python3", [
      importerPath,
      "--english-source",
      englishSnapshotPath,
      "--chinese-source",
      chineseSnapshotPath,
      "--output",
      generatedCorpus,
      "--manifest-output",
      generatedManifest,
    ]);
    assert.deepEqual(await readFile(generatedCorpus), corpusBytes);
    assert.deepEqual(await readFile(generatedManifest), manifestBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
