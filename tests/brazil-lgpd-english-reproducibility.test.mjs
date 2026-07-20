import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const corpusPath = join(root, "data/v2/brazil-lgpd-articles.json");
const snapshotPath = join(
  root,
  "data/v2/source-snapshots/br-lgpd-anpd-en-2024-pdftotext-normalized.txt",
);
const manifestPath = join(
  root,
  "data/v2/source-snapshots/br-lgpd-anpd-en-2024-source-manifest.json",
);
const importerPath = join(root, "scripts/import-brazil-lgpd-english.py");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const corpusBytes = await readFile(corpusPath);
const corpus = JSON.parse(corpusBytes);
const snapshotBytes = await readFile(snapshotPath);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

test("ANPD English snapshot has a complete, hash-pinned provenance chain", () => {
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.instrumentId, "br-lgpd-2018");
  assert.equal(
    manifest.normalizedSnapshot.path,
    "data/v2/source-snapshots/br-lgpd-anpd-en-2024-pdftotext-normalized.txt",
  );
  assert.equal(snapshotBytes.byteLength, manifest.normalizedSnapshot.byteLength);
  assert.equal(sha256(snapshotBytes), manifest.normalizedSnapshot.sha256);
  assert.equal(
    manifest.normalizedSnapshot.derivedFromPdfSha256,
    manifest.primarySource.sha256,
  );
  assert.equal(manifest.primarySource.byteLength, 1261558);
  assert.equal(
    manifest.primarySource.sha256,
    "268d284b279f9f2ec9e0e494ccf2841ead40155599c77a095cf8d0ae867ebd61",
  );
  assert.match(manifest.rights.license, /Attribution-NoDerivs 3\.0/);
  assert.match(manifest.rights.licenseEvidenceUrl, /^https:\/\/www\.gov\.br\/anpd\//);
  assert.equal(manifest.reproducibility.expectedArticleIdentifierCount, 80);
});

test("all 80 LGPD English references resolve to the pinned source snapshot", () => {
  assert.equal(corpus.length, 80);
  for (const unit of corpus) {
    const translation = unit.translations.en;
    const sourceReference =
      translation.historicalOfficialReference ?? translation;
    assert.equal(
      sourceReference.sourceDocumentSha256,
      manifest.primarySource.sha256,
    );
    assert.equal(
      sourceReference.sourceTextSnapshot,
      manifest.normalizedSnapshot.path,
    );
    assert.equal(
      sourceReference.sourceTextSnapshotSha256,
      manifest.normalizedSnapshot.sha256,
    );
    assert.equal(sourceReference.sourceManifest, manifest.manifestPath);
    assert.equal(sourceReference.fullText, sourceReference.paragraphs.join("\n\n"));
  }
});

test("offline importer rebuilds the committed LGPD corpus byte for byte", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "br-lgpd-english-"));
  const input = join(temporaryDirectory, "portuguese-base.json");
  const output = join(temporaryDirectory, "rebuilt.json");
  const portugueseBase = corpus.map((unit) => {
    const record = structuredClone(unit);
    delete record.translations;
    delete record.englishAvailability;
    return record;
  });

  try {
    await writeFile(input, `${JSON.stringify(portugueseBase, null, 2)}\n`, "utf8");
    const result = await execFileAsync(
      process.env.PYTHON || "python3",
      [
        importerPath,
        input,
        snapshotPath,
        output,
        "--source-manifest",
        manifestPath,
      ],
      { cwd: root },
    );
    assert.match(result.stdout, /Attached complete English text to 80 LGPD/);
    assert.deepEqual(await readFile(output), corpusBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
