import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const dataRoot = new URL("data/v2/", root);
const load = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

const [pipeda, canadaAdm] = await Promise.all([
  load("canada-pipeda-provisions.json"),
  load("canada-adm-directive-provisions.json"),
]);

async function assertPinnedSnapshots(records) {
  const snapshots = new Map();
  for (const record of records) {
    for (const snapshot of Object.values(record.sourceSnapshots ?? {})) {
      snapshots.set(snapshot.path, snapshot.sha256);
    }
  }
  assert.ok(snapshots.size >= 2, "the corpus must pin both language sources");
  for (const [path, expectedDigest] of snapshots) {
    const bytes = await readFile(new URL(path, root));
    assert.equal(sha256(bytes), expectedDigest, `${path} snapshot digest changed`);
  }
}

function assertNoEditorialPlaceholders(records, translationKey) {
  const placeholder =
    /this (?:article|section|provision).{0,160}mapped to|complete official .{0,80}wording is available in the original-language view/is;
  for (const record of records) {
    const text = translationKey
      ? record.translations?.[translationKey]?.fullText
      : record.fullText;
    assert.ok(text?.trim(), `${record.id} is missing complete displayed text`);
    assert.doesNotMatch(text, placeholder, `${record.id} still contains a placeholder`);
  }
}

test("PIPEDA pins co-authentic source snapshots and keeps legal-effect layers distinct", async () => {
  await assertPinnedSnapshots(pipeda);
  assertNoEditorialPlaceholders(pipeda);
  assertNoEditorialPlaceholders(pipeda, "en");
  assert.equal(
    pipeda.filter(
      (record) =>
        record.textAvailability ===
        "official-co-authentic-current-in-force-text",
    ).length,
    75,
  );
  assert.equal(
    pipeda.filter(
      (record) =>
        record.textAvailability ===
        "official-co-authentic-enacted-amendment-not-in-force",
    ).length,
    9,
  );
  for (const record of pipeda) {
    assert.equal(sha256(record.fullText), record.contentSha256);
    assert.equal(
      sha256(record.translations.en.fullText),
      record.translations.en.contentSha256,
    );
  }
});

test("Canada ADM Directive pins both official policy publications without corpus gaps", async () => {
  await assertPinnedSnapshots(canadaAdm);
  assertNoEditorialPlaceholders(canadaAdm);
  assertNoEditorialPlaceholders(canadaAdm, "fr");
  assert.deepEqual(
    canadaAdm.map((record) => record.articleNumber),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C"],
  );
  for (const record of canadaAdm) {
    assert.equal(sha256(record.fullText), record.contentSha256);
    assert.equal(
      sha256(record.translations.fr.fullText),
      record.translations.fr.contentSha256,
    );
  }
});
