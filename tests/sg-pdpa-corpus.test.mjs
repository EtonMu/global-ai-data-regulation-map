import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const corpusUrl = new URL("../data/v2/sg-pdpa-provisions.json", import.meta.url);
const corpusBytes = await readFile(corpusUrl);
const records = JSON.parse(corpusBytes);
const byId = new Map(records.map((record) => [record.id, record]));

test("Singapore PDPA stores all current section slots and schedules", () => {
  assert.equal(records.length, 106);
  assert.equal(
    records.filter((record) => record.provisionType === "section").length,
    95,
  );
  assert.equal(
    records.filter((record) => record.provisionType === "schedule").length,
    11,
  );
  for (const number of ["27", "28", "29", "30", "31", "32", "33", "34", "35"]) {
    const record = records.find((item) => item.id === `sg-pdpa-sec-${number}`);
    assert.equal(record?.legalEffectStatus, "repealed");
  }
});

test("Singapore PDPA records preserve government-source and reuse caveats", () => {
  for (const record of records) {
    assert.match(record.sourceFragment, /^https:\/\/sso\.agc\.gov\.sg\/Act\/PDPA2012#/);
    assert.equal(record.versionAsOf, "2026-07-20");
    assert.match(record.sourceVersion.versionNote, /unofficial and not authoritative/i);
    assert.match(record.rights.attribution, /permission of the Attorney-General's Chambers/i);
    assert.equal(
      record.contentSha256,
      createHash("sha256").update(record.fullText, "utf8").digest("hex"),
    );
  }
});

test("Singapore PDPA includes high-value privacy and security sections", () => {
  assert.match(byId.get("sg-pdpa-sec-24").fullText, /reasonable security arrangements/i);
  assert.match(byId.get("sg-pdpa-sec-26d").fullText, /notify the Commission/i);
  assert.match(byId.get("sg-pdpa-sec-48f").fullText, /re.identif/i);
  assert.match(byId.get("sg-pdpa-schedule-11").fullText, /anonymisation/i);
});

test("Singapore breach duties and current section 48J mechanism preserve phased commencement", () => {
  for (const number of ["26a", "26b", "26c", "26d", "26e"]) {
    const record = byId.get(`sg-pdpa-sec-${number}`);
    assert.equal(record.appliesFrom, "2021-02-01");
    assert.equal(record.commencement.date, "2021-02-01");
    assert.equal(record.commencement.amendingProvision, "section 13");
    assert.equal(record.commencement.commencementInstrumentNumber, "S 60/2021");
    assert.equal(
      record.commencement.source,
      "https://sso.agc.gov.sg/Acts-Supp/40-2020/",
    );
  }

  const financialPenalty = byId.get("sg-pdpa-sec-48j");
  assert.equal(financialPenalty.appliesFrom, "2022-10-01");
  assert.equal(financialPenalty.commencement.date, "2022-10-01");
  assert.equal(financialPenalty.commencement.amendingProvision, "section 24");
  assert.equal(financialPenalty.commencement.commencementInstrumentNumber, "S 767/2022");
  assert.match(financialPenalty.commencement.historyNote, /inserted.*1 February 2021/i);

  assert.deepEqual(
    records.filter((record) => record.appliesFrom).map((record) => record.id),
    [
      "sg-pdpa-sec-26a",
      "sg-pdpa-sec-26b",
      "sg-pdpa-sec-26c",
      "sg-pdpa-sec-26d",
      "sg-pdpa-sec-26e",
      "sg-pdpa-sec-48j",
    ],
  );
});

test("Singapore importer deterministically preserves commencement metadata", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "sg-pdpa-corpus-"));
  const inputPath = join(temporaryDirectory, "browser-extracted.json");
  const outputPath = join(temporaryDirectory, "generated.json");
  const raw = {
    sections: records
      .filter((record) => record.provisionType === "section")
      .map((record) => ({
        number: record.articleNumber,
        title: record.title,
        chapter: record.chapter,
        paragraphs: record.paragraphs,
      })),
    schedules: records
      .filter((record) => record.provisionType === "schedule")
      .map((record) => ({
        number: record.articleNumber.replace("schedule-", ""),
        title: record.title,
        paragraphs: record.paragraphs,
      })),
  };
  try {
    await writeFile(inputPath, JSON.stringify(raw));
    await execFileAsync(process.execPath, [
      fileURLToPath(new URL("../scripts/import-singapore-pdpa.mjs", import.meta.url)),
      inputPath,
      "--output",
      outputPath,
    ]);
    assert.deepEqual(await readFile(outputPath), corpusBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
