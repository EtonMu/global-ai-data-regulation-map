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
const caPath = join(root, "data/v2/us-ca-sb1047-2024-provisions.json");
const coPath = join(root, "data/v2/us-co-ai-act-current-provisions.json");
const manifestPath = join(
  root,
  "data/v2/us-state-ai-laws-corpus-manifest.json",
);
const importerPath = join(root, "scripts/import-us-state-ai-laws.py");
const python = process.env.PYTHON ?? "python3";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const caInstrumentId = "us-ca-sb-1047-2024";
const coInstrumentId = "us-co-sb26-189-admt-2026";

const caBytes = await readFile(caPath);
const coBytes = await readFile(coPath);
const ca = JSON.parse(caBytes);
const co = JSON.parse(coBytes);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const caById = new Map(ca.map((record) => [record.id, record]));
const coById = new Map(co.map((record) => [record.id, record]));

test("California SB 1047 is complete enrolled-bill history and never presented as law", () => {
  assert.equal(ca.length, 18);
  assert.equal(new Set(ca.map((record) => record.id)).size, 18);
  assert.equal(manifest.corpora[caInstrumentId].billSectionCount, 8);
  assert.equal(
    manifest.corpora[caInstrumentId].proposedCodeSectionCount,
    9,
  );
  assert.equal(
    manifest.corpora[caInstrumentId].sourceBodyCanonicalSha256,
    "527079a7df2fd4af95c0ccf9dd00fe726fb3292290a57f399a1a7b835acc8a78",
  );

  for (const record of ca) {
    assert.equal(record.instrumentId, caInstrumentId);
    assert.equal(record.lifecycleStatus, "failed-vetoed");
    assert.equal(
      record.legalEffectStatus,
      "not-enacted-vetoed-historical-bill",
    );
    assert.equal(record.commencementStatus, "never-commenced");
    assert.equal(record.appliesFrom, null);
    assert.equal(record.historicalOnly, true);
    assert.equal(record.neverTookEffectDueToVeto, true);
    assert.match(record.statusBanner, /vetoed.*never enacted.*no current duties/i);
  }

  for (const section of [
    "22602",
    "22603",
    "22604",
    "22606",
    "22607",
    "22608",
    "22609",
  ]) {
    assert.ok(caById.has(`us-ca-sb1047-2024-proposed-bpc-${section}`));
  }
  assert.ok(caById.has("us-ca-sb1047-2024-proposed-gov-11547-6"));
  assert.ok(caById.has("us-ca-sb1047-2024-proposed-gov-11547-6-1"));
});

test("SB 1047 high-value proposed controls survive the official HTML extraction", () => {
  assert.match(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22602").fullText,
    /“Artificial intelligence safety incident” means an incident/,
  );
  assert.match(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22603").fullText,
    /Implement the capability to promptly enact a full shutdown/,
  );
  assert.match(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22603").fullText,
    /report each artificial intelligence safety incident.*within 72 hours/is,
  );
  assert.match(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22604").fullText,
    /Maintain for seven years.*appropriate records/is,
  );
  assert.match(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22607").fullText,
    /Retaliate against an employee for disclosing information/,
  );
  assert.doesNotMatch(
    caById.get("us-ca-sb1047-2024-proposed-bpc-22603").fullText,
    /enacting a\s*\n\s*full shutdown/,
  );
});

test("Colorado corpus uses the SB 26-189 repeal-and-reenactment as the current version", () => {
  assert.equal(co.length, 18);
  assert.equal(new Set(co.map((record) => record.id)).size, 18);
  assert.equal(manifest.corpora[coInstrumentId].part17SectionCount, 9);
  assert.equal(
    manifest.corpora[coInstrumentId].additionalStatutoryProvisionCount,
    2,
  );
  assert.equal(
    manifest.corpora[coInstrumentId].sourceBodyCanonicalSha256,
    "bdcfeadddb393c8ebbb77268039ff243fb5a17fccb0d2a65f356edd85406bc3c",
  );
  for (let section = 1701; section <= 1709; section += 1) {
    assert.ok(coById.has(`us-co-ai-act-current-6-1-${section}`));
  }
  assert.ok(co.every((record) => record.instrumentId === coInstrumentId));
  assert.ok(co.every((record) => record.lifecycleStatus === "enacted"));
  assert.match(
    manifest.lifecycleBoundary[coInstrumentId],
    /repealed and reenacted Part 17/i,
  );
  assert.deepEqual(
    manifest.versionLineage[coInstrumentId].map((entry) => entry.measure),
    ["SB 24-205", "SB 25B-004", "SB 26-189"],
  );
  assert.equal(
    manifest.versionLineage[coInstrumentId][2].versionRole,
    "current-repeal-and-reenactment-through-2026-07-20",
  );
});

test("Colorado effective dates distinguish immediate provisions from 2027 duties", () => {
  const definitions = coById.get("us-co-ai-act-current-6-1-1701");
  const disclosure = coById.get("us-co-ai-act-current-6-1-1704");
  const rights = coById.get("us-co-ai-act-current-6-1-1705");
  const enforcement = coById.get("us-co-ai-act-current-6-1-1706");
  const insurance = coById.get("us-co-ai-act-current-10-3-1104-9-3-e");
  const effective = coById.get("us-co-ai-act-2026-sec-5");

  assert.equal(definitions.appliesFrom, "2027-01-01");
  assert.equal(
    definitions.commencementStatus,
    "enacted-not-yet-generally-effective",
  );
  assert.deepEqual(disclosure.immediateEffectSubdivisions, ["6-1-1704(4)"]);
  assert.deepEqual(rights.immediateEffectSubdivisions, ["6-1-1705(3)"]);
  assert.deepEqual(enforcement.immediateEffectSubdivisions, ["6-1-1706(6)"]);
  assert.equal(insurance.appliesFrom, "2026-05-14");
  assert.equal(insurance.commencementStatus, "effective-on-passage");
  assert.match(effective.fullText, /takes effect January 1, 2027/);
  assert.match(effective.fullText, /take effect upon passage/);
  assert.match(
    effective.fullText,
    /applies to consequential decisions made on or after January 1, 2027/,
  );
});

test("Colorado current provisions retain documentation, notice, rights, and enforcement text", () => {
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1702").fullText,
    /ON AND AFTER JANUARY 1, 2027/,
  );
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1702").fullText,
    /CATEGORIES OF DATA, INCLUDING PERSONAL DATA, USED TO TRAIN/,
  );
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1704").fullText,
    /CLEAR AND CONSPICUOUS NOTICE TO A CONSUMER/,
  );
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1705").fullText,
    /MEANINGFUL HUMAN REVIEW AND RECONSIDERATION/,
  );
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1706").fullText,
    /REPEALED, EFFECTIVE JANUARY 1, 2030/,
  );
  assert.match(
    coById.get("us-co-ai-act-current-6-1-1708").fullText,
    /HEALTH INSURANCE PORTABILITY AND ACCOUNTABILITY ACT OF 1996/,
  );
});

test("every node has text, content integrity, rights, and reviewed concept-link metadata", () => {
  for (const record of [...ca, ...co]) {
    assert.ok(record.paragraphs.length > 0, record.id);
    assert.equal(record.fullText, record.paragraphs.join("\n\n"), record.id);
    assert.equal(record.contentSha256, sha256(record.fullText), record.id);
    assert.ok(record.summary.length > 20, record.id);
    assert.equal(record.language, "en-US");
    assert.equal(
      record.topicRelevance.highlighted,
      record.conceptIds.length > 0,
      record.id,
    );
    assert.deepEqual(record.topicRelevance.coreConceptIds, record.conceptIds);
    assert.equal(new Set(record.conceptIds).size, record.conceptIds.length);
    assert.ok(record.rights.reuseStatus, record.id);
  }
  assert.equal(
    ca[0].rights.reuseStatus,
    "public-domain-california-legislative-information",
  );
  assert.equal(
    co[0].rights.reuseStatus,
    "official-public-legislative-record-license-not-asserted",
  );
  assert.equal(co[0].rights.license, null);

  const substantiveColorado = co.filter(
    (record) =>
      record.unitType === "statutory-section" ||
      record.unitType === "statutory-subdivision",
  );
  assert.ok(
    substantiveColorado.every((record) => record.topicRelevance.highlighted),
  );
});

test("Colorado spacing reconstruction retains official characters without known PDF artifacts", () => {
  const text = co.map((record) => record.fullText).join("\n");
  for (const artifact of [
    "ADECISION",
    "ACOVERED",
    "ADEVELOPER",
    "ADEPLOYER",
    "AINDIVIDUAL",
    "ADMTOUTPUT",
    "ISUSED",
    "ISBEING",
    "PRIVACYACTOF",
    "STATEOR",
    "DURINGITS",
    "EXISTINGLAW",
    "SECTIONS6-",
    "U.S.C.SEC.",
    "U.S.C.SECS.",
    "TO1320d",
    "LA WS",
    "CO N ",
    "section1of",
    "6-1-1704OR",
  ]) {
    assert.ok(!text.includes(artifact), artifact);
  }
  assert.ok(
    co.every(
      (record) => record.textReconstruction.ocrCharactersUsed === false,
    ),
  );
  assert.ok(
    co.every((record) => record.textReconstruction.alignmentRatio >= 0.985),
  );
});

test("manifest locks all official and derived source snapshots", async () => {
  assert.equal(manifest.snapshots.length, 11);
  assert.equal(
    manifest.corpora[caInstrumentId].sha256,
    sha256(caBytes),
  );
  assert.equal(manifest.corpora[coInstrumentId].sha256, sha256(coBytes));
  for (const snapshot of manifest.snapshots) {
    const bytes = await readFile(join(root, snapshot.path));
    assert.equal(sha256(bytes), snapshot.sha256, snapshot.path);
  }
});

test("US state AI law importer is byte-for-byte reproducible", async () => {
  const directory = await mkdtemp(join(tmpdir(), "us-state-ai-laws-"));
  const caOutput = join(directory, "ca.json");
  const coOutput = join(directory, "co.json");
  const manifestOutput = join(directory, "manifest.json");
  try {
    await execFileAsync(python, [
      importerPath,
      "--california-output",
      caOutput,
      "--colorado-output",
      coOutput,
      "--manifest-output",
      manifestOutput,
    ]);
    assert.deepEqual(await readFile(caOutput), caBytes);
    assert.deepEqual(await readFile(coOutput), coBytes);
    assert.deepEqual(
      JSON.parse(await readFile(manifestOutput, "utf8")),
      manifest,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
