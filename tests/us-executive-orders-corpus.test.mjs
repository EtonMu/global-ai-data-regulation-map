import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const corpusPath = join(root, "data/v2/us-executive-orders-provisions.json");
const manifestPath = join(
  root,
  "data/v2/us-executive-orders-corpus-manifest.json",
);
const importerPath = join(root, "scripts/import-us-executive-orders.py");
const python =
  "/Users/etonmu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const corpusBytes = await readFile(corpusPath);
const records = JSON.parse(corpusBytes);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const byId = new Map(records.map((record) => [record.id, record]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("US Executive Order corpus contains every top-level and expressly headed nested section", () => {
  assert.equal(records.length, 37);
  assert.equal(new Set(records.map((record) => record.id)).size, 37);
  assert.equal(
    records.filter((record) => record.instrumentId === "us-eo-14110").length,
    30,
  );
  assert.equal(
    records.filter((record) => record.instrumentId === "us-eo-14179").length,
    7,
  );

  for (const number of Array.from({ length: 13 }, (_, index) => index + 1)) {
    assert.ok(byId.has(`us-eo-14110-sec-${number}`));
  }
  for (const number of Array.from({ length: 6 }, (_, index) => index + 1)) {
    assert.ok(byId.has(`us-eo-14179-sec-${number}`));
  }
  for (const locator of [
    "4-1",
    "4-2",
    "4-3",
    "4-4",
    "4-5",
    "4-6",
    "4-7",
    "4-8",
    "5-1",
    "5-2",
    "5-3",
    "7-1",
    "7-2",
    "7-3",
    "10-1",
    "10-2",
  ]) {
    assert.ok(byId.has(`us-eo-14110-sec-${locator}`));
  }
});

test("every Executive Order node has complete public-domain text and source integrity metadata", () => {
  for (const record of records) {
    assert.ok(record.paragraphs.length > 0, `${record.id} has no paragraphs`);
    assert.equal(record.fullText, record.paragraphs.join("\n\n"));
    assert.equal(record.contentSha256, sha256(record.fullText));
    assert.ok(record.summary.length > 20, `${record.id} lacks a useful summary`);
    assert.equal(record.language, "en-US");
    assert.equal(
      record.textAvailability,
      "complete-us-government-public-domain-text",
    );
    assert.match(record.source, /^https:\/\/www\.govinfo\.gov\//);
    assert.match(record.extractionSource, /^https:\/\/www\.federalregister\.gov\//);
    assert.match(record.sourceVersion.officialPdfSha256, /^[a-f0-9]{64}$/);
    assert.match(record.sourceVersion.xmlSnapshotSha256, /^[a-f0-9]{64}$/);
    assert.equal(record.rights.reuseStatus, "public-domain-us-government-work");
    assert.match(record.rights.license, /17 U\.S\.C\. § 105/);
  }
});

test("EO 14110 is historical after full revocation and EO 14179 is the current order", () => {
  const historical = records.filter(
    (record) => record.instrumentId === "us-eo-14110",
  );
  const current = records.filter((record) => record.instrumentId === "us-eo-14179");
  assert.ok(historical.every((record) => record.legalEffectStatus === "revoked-historical-text"));
  assert.ok(current.every((record) => record.legalEffectStatus === "in-force-executive-order"));
  assert.match(manifest.lifecycleBoundary["us-eo-14110"], /Revoked in full.*20 January 2025/i);
  assert.match(manifest.lifecycleBoundary["us-eo-14179"], /In force/i);
  assert.match(byId.get("us-eo-14179-sec-5").fullText, /revoked Executive Order 14110/i);
});

test("high-value AI, privacy, cybersecurity and governance text survives normalization", () => {
  assert.match(
    byId.get("us-eo-14110-sec-4-2").fullText,
    /10²⁶ integer or floating-point operations/,
  );
  assert.match(
    byId.get("us-eo-14110-sec-4-3").fullText,
    /critical infrastructure/i,
  );
  assert.match(
    byId.get("us-eo-14110-sec-9").fullText,
    /PETs to safeguard Americans' privacy/i,
  );
  assert.match(
    byId.get("us-eo-14110-sec-10-1").fullText,
    /Chief AI Officers/i,
  );
  assert.match(
    byId.get("us-eo-14179-sec-4").fullText,
    /action plan/i,
  );
});

test("manifest pins every structured, official and revocation source snapshot", async () => {
  assert.equal(manifest.corpus.nodeCount, 37);
  assert.deepEqual(manifest.corpus.countsByInstrument, {
    "us-eo-14110": 30,
    "us-eo-14179": 7,
  });
  assert.equal(manifest.corpus.sha256, sha256(corpusBytes));
  assert.equal(manifest.snapshots.length, 6);
  assert.equal(
    manifest.snapshots.filter((snapshot) => snapshot.role.includes("official")).length,
    3,
  );
  for (const snapshot of manifest.snapshots) {
    const bytes = await readFile(join(root, snapshot.path));
    assert.equal(sha256(bytes), snapshot.sha256, snapshot.path);
  }
});

test("Executive Order importer is byte-for-byte reproducible", async () => {
  const directory = await mkdtemp(join(tmpdir(), "us-eo-corpus-"));
  const output = join(directory, "corpus.json");
  const manifestOutput = join(directory, "manifest.json");
  try {
    await execFileAsync(python, [
      importerPath,
      "--output",
      output,
      "--manifest-output",
      manifestOutput,
    ]);
    assert.deepEqual(await readFile(output), corpusBytes);
    const generatedManifest = JSON.parse(await readFile(manifestOutput, "utf8"));
    assert.equal(generatedManifest.corpus.sha256, sha256(corpusBytes));
    assert.deepEqual(generatedManifest.snapshots, manifest.snapshots);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
