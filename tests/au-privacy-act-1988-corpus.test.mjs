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
const corpusPath = join(root, "data/v2/au-privacy-act-1988-provisions.json");
const snapshotPath = join(
  root,
  "data/v2/source-snapshots/au-privacy-act-1988-C2026C00227.xhtml",
);
const importerPath = join(root, "scripts/import-australia-privacy-act.py");

const corpusBytes = await readFile(corpusPath);
const records = JSON.parse(corpusBytes);
const snapshotBytes = await readFile(snapshotPath);
const snapshotSha256 = createHash("sha256").update(snapshotBytes).digest("hex");
const byId = new Map(records.map((record) => [record.id, record]));

test("Privacy Act C104 corpus has every operative Section, APP and Schedule 2 clause", () => {
  assert.equal(records.length, 352);
  assert.equal(new Set(records.map((record) => record.id)).size, 352);
  assert.equal(
    records.filter((record) => record.provisionType === "section").length,
    313,
  );
  assert.equal(
    records.filter(
      (record) => record.provisionType === "australian-privacy-principle",
    ).length,
    13,
  );
  assert.equal(
    records.filter((record) => record.provisionType === "schedule-clause")
      .length,
    26,
  );

  assert.deepEqual(
    records
      .filter(
        (record) =>
          record.provisionType === "australian-privacy-principle",
      )
      .map((record) => record.provisionNumber),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
  );
});

test("every node is traceable to the frozen authorised Compilation 104 source", () => {
  assert.equal(
    snapshotSha256,
    "6d0a43e5da103d1eeb5317ae9ac213c5b51acab2357dc01b981a91e1052c5c3b",
  );
  const snapshotText = snapshotBytes.toString("utf8");
  const snapshotPlainText = snapshotText
    .replace(/<[^>]+>/g, " ")
    .replace(/&#xa0;/g, " ")
    .replace(/\s+/g, " ");
  assert.match(snapshotPlainText, /Compilation No\. 104/);
  assert.match(snapshotPlainText, /Compilation date: 4 June 2026/);
  assert.match(snapshotPlainText, /Includes amendments: Act No\. 75, 2025/);

  let previousAnchorNumber = 0;
  for (const record of records) {
    assert.equal(record.instrumentId, "au-privacy-act-1988");
    assert.equal(record.language, "en-AU");
    assert.equal(record.versionAsOf, "2026-06-04");
    assert.equal(record.retrievedOn, "2026-07-20");
    assert.equal(record.legalEffectStatus, "in-force");
    assert.equal(
      record.compilationStatus,
      "included-in-current-in-force-compilation",
    );
    assert.equal(record.currentTextOnly, true);
    assert.equal(record.uncommencedAmendmentsIncluded, false);
    assert.equal(record.sourceVersion.compilationId, "C2026C00227");
    assert.equal(record.sourceVersion.compilationNumber, 104);
    assert.equal(record.sourceVersion.registeredOn, "2026-06-17");
    assert.equal(record.sourceSnapshotSha256, snapshotSha256);
    assert.equal(
      record.rights.licenseUrl,
      "https://creativecommons.org/licenses/by/4.0/",
    );
    assert.match(record.rights.termsUrl, /legislation\.gov\.au\/terms-of-use$/);
    assert.match(record.rights.attribution, /Federal Register of Legislation/);
    assert.match(record.rights.extractionBoundary, /Coat of Arms image is not extracted/);
    assert.equal(record.fullText, record.paragraphs.join("\n\n"));
    assert.ok(record.paragraphs.length > 0, `${record.id} has no paragraphs`);
    assert.ok(
      record.paragraphs.every((paragraph) => paragraph && paragraph === paragraph.trim()),
      `${record.id} has an empty or untrimmed paragraph`,
    );
    assert.equal(
      record.contentSha256,
      createHash("sha256").update(record.fullText, "utf8").digest("hex"),
    );
    assert.equal(
      record.sourceFragment,
      `${record.source}#${record.sourceAnchor}`,
    );
    assert.match(snapshotText, new RegExp(`id=["']${record.sourceAnchor}["']`));

    const anchorNumber = Number(record.sourceAnchor.replace("navPoint_", ""));
    assert.ok(anchorNumber > previousAnchorNumber, "source order must be stable");
    previousAnchorNumber = anchorNumber;
  }
});

test("official hierarchy and table content survive extraction", () => {
  const sectionOne = byId.get("au-privacy-act-1988-sec-1");
  assert.equal(sectionOne.structure.part.label, "Part I");
  assert.equal(sectionOne.structure.schedule, null);

  const breach = byId.get("au-privacy-act-1988-sec-26we");
  assert.equal(breach.structure.part.label, "Part IIIC");
  assert.equal(breach.structure.division.label, "Division 2");

  const appEight = byId.get("au-privacy-act-1988-app-8");
  assert.equal(appEight.structure.schedule.label, "Schedule 1");
  assert.equal(appEight.structure.part.label, "Part 3");

  const scheduleTort = byId.get("au-privacy-act-1988-sch-2-cl-7");
  assert.equal(scheduleTort.structure.schedule.label, "Schedule 2");
  assert.equal(scheduleTort.structure.part.label, "Part 2");

  const permittedSituations = byId.get("au-privacy-act-1988-sec-16a");
  assert.ok(
    permittedSituations.paragraphs.includes(
      "Item | Column 1 Kind of entity | Column 2 Item applies to | Column 3 Condition(s)",
    ),
  );
  assert.match(permittedSituations.fullText, /7 \| Defence Force \| Personal information/);
});

test("high-value privacy, security, breach and cross-border provisions are complete", () => {
  assert.match(
    byId.get("au-privacy-act-1988-sec-2a").fullText,
    /promote the protection of the privacy of individuals with respect to their personal information/,
  );
  assert.match(
    byId.get("au-privacy-act-1988-sec-13g").fullText,
    /the interference with privacy is serious/,
  );
  assert.match(
    byId.get("au-privacy-act-1988-sec-26we").fullText,
    /unauthorised access to, or unauthorised disclosure of, the information/,
  );
  assert.match(
    byId.get("au-privacy-act-1988-app-8").fullText,
    /cross|overseas recipient/i,
  );
  assert.match(
    byId.get("au-privacy-act-1988-app-11").fullText,
    /technical and organisational measures/,
  );
  assert.match(
    byId.get("au-privacy-act-1988-sch-2-cl-7").fullText,
    /cause of action in tort/,
  );
  assert.match(
    byId.get("au-privacy-act-1988-sch-2-cl-11").fullText,
    /exemplary or punitive damages in exceptional circumstances/,
  );
});

test("APPs and the original NDB scheme retain provision-level commencement dates", () => {
  const apps = records.filter(
    (record) => record.provisionType === "australian-privacy-principle",
  );
  assert.equal(apps.length, 13);
  for (const record of apps) {
    assert.equal(record.appliesFrom, "2014-03-12");
    assert.equal(record.commencement.date, "2014-03-12");
    assert.equal(record.commencement.amendingActId, "C2012A00197");
    assert.equal(
      record.commencement.commencementAuthority,
      "section 2(1), commencement table item 2",
    );
    assert.match(record.commencement.source, /^https:\/\/www\.legislation\.gov\.au\//);
  }

  const originalNdbIds = [
    "26wa", "26wb", "26wc", "26wd", "26we", "26wf", "26wg", "26wh",
    "26wj", "26wk", "26wl", "26wm", "26wn", "26wp", "26wq", "26wr",
    "26ws", "26wt",
  ].map((locator) => `au-privacy-act-1988-sec-${locator}`);
  for (const id of originalNdbIds) {
    const record = byId.get(id);
    assert.equal(record.appliesFrom, "2018-02-22");
    assert.equal(record.commencement.date, "2018-02-22");
    assert.equal(record.commencement.amendingActId, "C2017A00012");
    assert.equal(
      record.commencement.commencementAuthority,
      "section 2(1), commencement table item 2",
    );
  }

  assert.deepEqual(
    records.filter((record) => record.appliesFrom === "2018-02-22").map((record) => record.id),
    originalNdbIds,
  );
  assert.equal(byId.get("au-privacy-act-1988-sec-2a").appliesFrom, undefined);
  assert.equal(byId.get("au-privacy-act-1988-sec-2a").commencement, undefined);
  assert.equal(
    byId.get("au-privacy-act-1988-sec-26wu").appliesFrom,
    undefined,
    "section 26WU was added by a later 2022 Act, not the original NDB Act",
  );
  for (const locator of ["26x", "26xa", "26xb", "26xc", "26xd", "26xe", "26xf", "26xg", "26xh"]) {
    assert.equal(byId.get(`au-privacy-act-1988-sec-${locator}`).appliesFrom, undefined);
  }
});

test("APP 1.7-1.9 remain future amendments and never appear as current duties", () => {
  const appOne = byId.get("au-privacy-act-1988-app-1");
  assert.match(appOne.fullText, /1\.6 If a person or body requests a copy/);
  assert.doesNotMatch(appOne.fullText, /(?:^|\n\n)1\.[789]\b/);
  assert.equal(appOne.futureAmendments.length, 1);
  assert.deepEqual(appOne.futureAmendments[0].locators, [
    "APP 1.7",
    "APP 1.8",
    "APP 1.9",
  ]);
  assert.equal(appOne.futureAmendments[0].status, "enacted-not-yet-in-force");
  assert.equal(appOne.futureAmendments[0].effectiveFrom, "2026-12-10");
  assert.equal(appOne.futureAmendments[0].includedInStoredText, false);
  assert.deepEqual(appOne.futureAmendments[0].amendingItems, ["88"]);
  assert.equal(appOne.futureAmendments[0].applicationItem, "89");

  const section13K = byId.get("au-privacy-act-1988-sec-13k");
  assert.deepEqual(section13K.futureAmendments[0].amendingItems, ["87"]);
  assert.deepEqual(section13K.futureAmendments[0].locators, [
    "subparagraph 13K(1)(b)(iia)",
  ]);

  assert.deepEqual(
    records.filter((record) => record.hasEnactedFutureAmendment).map((record) => record.id),
    ["au-privacy-act-1988-sec-13k", "au-privacy-act-1988-app-1"],
  );
  assert.doesNotMatch(
    records.map((record) => record.fullText).join("\n"),
    /Without limiting subclause 1\.3, the APP privacy policy.*computer program/,
  );
});

test("operative corpus excludes compilation furniture and endnotes", () => {
  const allText = records.map((record) => record.fullText).join("\n");
  assert.doesNotMatch(allText, /Authorised Version/);
  assert.doesNotMatch(allText, /Endnote 1—About the endnotes/);
  assert.doesNotMatch(allText, /Commonwealth Coat of Arms/);
  assert.doesNotMatch(allText, /Compilation No\. 104/);
});

test("version-locked importer reproduces the committed corpus byte for byte", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "au-privacy-act-c104-"));
  const generatedPath = join(temporaryDirectory, "generated.json");
  try {
    await execFileAsync("python3", [
      importerPath,
      "--source",
      snapshotPath,
      "--output",
      generatedPath,
    ]);
    assert.deepEqual(await readFile(generatedPath), corpusBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
