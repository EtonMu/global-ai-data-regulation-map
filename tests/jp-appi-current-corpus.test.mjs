import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("jp-appi-current-articles.json");
const manifest = await loadJson("jp-appi-current-corpus-manifest.json");

test("Japan APPI current corpus contains all 185 main Articles and complete current attachments", () => {
  assert.equal(corpus.length, 208);
  const articles = corpus.filter((unit) => unit.unitType === "article");
  const supplements = corpus.filter(
    (unit) => unit.unitType === "supplementary-provision-block",
  );
  const tables = corpus.filter((unit) => unit.unitType === "appended-table");
  assert.equal(articles.length, 185);
  assert.equal(supplements.length, 21);
  assert.equal(tables.length, 2);
  assert.deepEqual(
    articles.map((unit) => unit.articleNumber),
    Array.from({ length: 185 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(
    articles.map((unit) => unit.id),
    Array.from({ length: 185 }, (_, index) => `jp-appi-art-${index + 1}`),
  );

  for (const unit of corpus) {
    assert.equal(unit.instrumentId, "jp-appi");
    assert.equal(unit.language, "ja-JP");
    assert.equal(unit.versionAsOf, "2026-07-20");
    assert.equal(
      unit.sourceVersion.revisionId,
      "415AC0000000057_20260717_508AC0000000062",
    );
    assert.equal(unit.sourceVersion.textState, "current-effective-consolidation-only");
    assert.match(unit.fullText, /[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.equal(unit.contentSha256, digest(unit.fullText));
    assert.match(unit.sourceNodeSha256, /^[a-f0-9]{64}$/);
    assert.equal(
      unit.translationStatus,
      "government-reference-translation-outdated-see-manifest",
    );
    assert.ok(!("translations" in unit), "outdated English must not be attached as current text");
    assert.equal(unit.rights.reuseStatus, "e-gov-secondary-use-unrestricted");
  }

  assert.match(articles[0].fullText, /個人の権利利益を保護することを目的とする/);
  assert.match(articles[1].fullText, /要配慮個人情報/);
  assert.match(articles[22].fullText, /漏えい、滅失又は毀損の防止/);
  assert.match(articles[25].fullText, /個人データの漏えい、滅失、毀損/);
  assert.match(articles[27].fullText, /外国にある第三者への提供の制限/);
  assert.match(articles[183].fullText, /法人でない団体について/);
  assert.equal(articles[184].paragraphs.length, 4);
  assert.match(tables[0].fullText, /名称｜根拠法/);
  assert.match(tables[1].fullText, /国立研究開発法人｜独立行政法人通則法/);
});

test("APPI manifest separates the 20 July 2026 current version from seven future revisions", () => {
  assert.equal(manifest.currentVersion.asOf, "2026-07-20");
  assert.equal(
    manifest.currentVersion.revisionId,
    "415AC0000000057_20260717_508AC0000000062",
  );
  assert.equal(manifest.currentVersion.futureRevisionTextIncluded, false);
  assert.equal(manifest.corpus.nodeCount, 208);
  assert.equal(manifest.corpus.mainArticleCount, 185);
  assert.equal(manifest.corpus.supplementaryProvisionBlockCount, 21);
  assert.equal(manifest.corpus.appendedTableCount, 2);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((unit) => unit.fullText).join("\n\n")),
  );

  const future = manifest.promulgatedFutureRevisions;
  assert.equal(future.length, 7);
  assert.deepEqual(
    future.map((entry) => entry.eGovEnforcementDate),
    [
      "2026-10-01",
      "2026-12-31",
      "2027-01-17",
      "2027-04-01",
      "2027-04-16",
      "2028-07-16",
      "2028-12-23",
    ],
  );
  assert.ok(future.every((entry) => entry.includedInCurrentCorpus === false));
  assert.equal(
    future.find((entry) => entry.eGovEnforcementDate === "2028-07-16")
      .dateCertainty,
    "statutory-deadline-not-fixed-by-cabinet-order",
  );
  assert.equal(
    future.find((entry) => entry.eGovEnforcementDate === "2028-12-23")
      .dateCertainty,
    "linked-to-another-act",
  );
});

test("APPI government English is preserved only as an explicitly outdated reference snapshot", () => {
  assert.equal(
    manifest.translation.status,
    "government-reference-only-outdated-not-attached-to-current-units",
  );
  assert.equal(manifest.translation.lastVersion, "Act No. 37 of 2021");
  assert.equal(manifest.translation.translatedOn, "2021-11-05");
  assert.equal(manifest.translation.referenceMainArticleCount, 185);
  assert.match(manifest.translation.versionDifference, /does not represent the current 2026/i);
  assert.match(manifest.translation.legalEffect, /reference materials only/i);
});

test("Every APPI source snapshot matches its manifest SHA-256", async () => {
  for (const snapshot of manifest.sourceSnapshots) {
    const bytes = await readFile(new URL(snapshot.path.replace("data/v2/", ""), dataRoot));
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const current = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "current-effective-text",
  );
  assert.equal(
    current.sha256,
    "4b0bcfca1781fbaf8756d39976c8e8d55b7cb99065aa3008d3b659d0f9e40c4f",
  );
  const currentXml = await readFile(
    new URL(current.path.replace("data/v2/", ""), dataRoot),
    "utf8",
  );
  assert.match(currentXml, /個人情報の保護に関する法律/);
  assert.match(currentXml, /<Article Num="185">/);
});
