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
const pathAt = (relativePath) => join(root, relativePath);
const readJson = async (relativePath) =>
  JSON.parse(await readFile(pathAt(relativePath), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const compactSha256 = (paragraphs) =>
  sha256(paragraphs.join("").normalize("NFC").replace(/\s+/gu, ""));

const brazilPath = "data/v2/br-ai-bill-2338-2023-articles.json";
const manifestPath = "data/v2/legal-corpus-handoff-canada-brazil-ai-bills.json";
const brazilBytes = await readFile(pathAt(brazilPath));
const [
  brazil,
  manifest,
  instruments,
  provisions,
  brazilStatus,
  brazilProceedings,
  brazilSnapshot,
] = await Promise.all([
  readJson(brazilPath),
  readJson(manifestPath),
  readJson("data/v2/instruments.json"),
  readJson("data/v2/provisions.json"),
  readJson("data/v2/source-snapshots/br-pl2338-2023-chamber-status-2026-07-20.json"),
  readJson("data/v2/source-snapshots/br-pl2338-2023-chamber-proceedings-2026-07-20.json"),
  readJson("data/v2/source-snapshots/br-pl2338-2023-official-articles.json"),
]);

const assertCommonIntegrity = (unit) => {
  assert.ok(unit.title.length > 0, `${unit.id} needs an orientation title`);
  assert.ok(unit.summary.length > 0, `${unit.id} needs a summary`);
  assert.ok(unit.fullText.length > 0, `${unit.id} needs complete text`);
  assert.equal(unit.fullText, unit.paragraphs.join("\n\n"));
  assert.equal(unit.fullText.normalize("NFC"), unit.fullText);
  assert.equal(unit.contentSha256, sha256(unit.fullText));
  assert.doesNotMatch(unit.fullText, /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u);
  assert.ok(unit.source.startsWith("https://"));
  assert.ok(unit.canonicalSource.startsWith("https://"));
  assert.equal(unit.retrievedOn, "2026-07-20");
  assert.equal(unit.statusAsOf, "2026-07-20");
  assert.ok(unit.rights.licenseUrl.startsWith("https://"));
};

test("Brazil PL 2338 corpus exactly follows the 79-Article controlling autograph", () => {
  const expectedNumbers = [
    ...Array.from({ length: 30 }, (_, index) => String(index + 1)),
    ...Array.from({ length: 49 }, (_, index) => String(index + 32)),
  ];
  assert.equal(brazil.length, 79);
  assert.deepEqual(brazil.map((unit) => unit.articleNumber), expectedNumbers);
  assert.equal(brazil.some((unit) => unit.articleNumber === "31"), false);
  assert.deepEqual(brazilSnapshot.coverage.articleNumbers, expectedNumbers);
  assert.equal(brazilSnapshot.coverage.actualUnitCount, 79);
  assert.equal(brazilSnapshot.coverage.complete, true);
  assert.match(brazilSnapshot.coverage.numberingNotice, /there is no Article 31/u);

  const sourceByNumber = new Map(
    brazilSnapshot.articles.map((article) => [article.articleNumber, article]),
  );
  for (const unit of brazil) {
    assertCommonIntegrity(unit);
    assert.equal(unit.id, `br-pl2338-art-${unit.articleNumber}`);
    assert.equal(unit.instrumentId, "br-pl-2338-2023-ai-bill");
    assert.equal(unit.unitType, "article");
    assert.equal(unit.label, `Art. ${unit.articleNumber}`);
    assert.equal(unit.language, "pt-BR");
    const english = unit.translations.en;
    assert.equal(english.language, "en");
    assert.equal(
      english.coverageStatus,
      "complete-current-pending-bill-project-reference",
    );
    assert.equal(english.officialStatus, "non-official-no-legal-effect");
    assert.equal(english.legalEffectStatus, "pending-bill-not-enacted");
    assert.equal(english.fullText, english.paragraphs.join("\n\n"));
    assert.equal(english.contentSha256, sha256(english.fullText));
    assert.equal(english.paragraphs.length, unit.paragraphs.length);
    assert.equal(unit.currentLanguageToggleEligible, true);
    assert.equal(
      unit.englishAvailability.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(
      unit.englishAvailability.coverageStatus,
      "complete-current-pending-bill-project-reference",
    );
    assert.match(unit.titleProvenance, /project-authored English orientation title/u);
    assert.equal(unit.textAvailability, "official-complete-senate-approved-bill-text");
    assert.equal(unit.legalEffectStatus, "pending-bill-not-enacted");
    assert.equal(unit.effectiveFrom, null);
    assert.equal(unit.legislativeStatus.notLaw, true);
    assert.equal(unit.legislativeStatus.notInForce, true);
    assert.equal(unit.rights.reuseStatus, "government-edict");
    assert.match(unit.rights.license, /Article 8\(IV\)/u);

    const source = sourceByNumber.get(unit.articleNumber);
    assert.ok(source, `Missing source snapshot for ${unit.id}`);
    assert.equal(unit.fullText, source.fullText);
    assert.deepEqual(unit.paragraphs, source.paragraphs);
    assert.equal(unit.sourceSnapshot.compactTextSha256, source.compactTextSha256);
    assert.equal(source.compactTextSha256, compactSha256(source.paragraphs));
  }
});

test("Brazil anchors retain risk, security, copyright and conditional commencement text", () => {
  const byNumber = new Map(brazil.map((unit) => [unit.articleNumber, unit]));
  assert.match(byNumber.get("13").fullText, /São vedados o desenvolvimento, a implementação e o uso/u);
  assert.match(byNumber.get("14").fullText, /Considera-se de alto risco o sistema de IA/u);
  assert.match(byNumber.get("25").fullText, /avaliação de impacto algorítmico/u);
  assert.match(byNumber.get("29").fullText, /sistemas de IA de propósito geral e generativa/u);
  assert.match(byNumber.get("42").fullText, /grave incidente de segurança/u);
  assert.match(byNumber.get("62").fullText, /conteúdo protegido por direitos de autor e conexos/u);
  assert.match(byNumber.get("80").fullText, /730 \(setecentos e trinta\) dias/u);
  assert.equal(
    byNumber.get("80").proposedCommencement["legalEffectAsOf2026-07-20"],
    "none — bill not enacted",
  );
});

test("official Brazilian status records show a pending bill with no final-law URN", async () => {
  assert.equal(brazilStatus.dados.id, 2487262);
  assert.equal(brazilStatus.dados.urnFinal, null);
  assert.equal(brazilStatus.dados.statusProposicao.descricaoSituacao, "Aguardando Parecer");
  assert.ok(brazilProceedings.dados.length > 300);
  const record = await readFile(
    pathAt("data/v2/source-snapshots/br-pl2338-2023-chamber-record-2026-07-20.html"),
    "utf8",
  );
  assert.match(record, /Aguardando Parecer do\(a\) Relator\(a\) na Comissão Especial/u);
});

test("AIDA remains metadata-only because republication permission is not established", () => {
  const aidaManifest = manifest.corpora.find(
    (corpus) => corpus.instrumentId === "ca-bill-c-27-aida-2022-lapsed",
  );
  assert.equal(aidaManifest.statusReview.status, "failed-bill-never-enacted");
  assert.equal(aidaManifest.statusReview.receivedRoyalAssent, false);
  assert.equal(aidaManifest.statusReview.effectiveFrom, null);
  assert.equal(
    aidaManifest.reuse.status,
    "permission-not-established-for-unenacted-bill",
  );

  const instrument = instruments.find(
    (item) => item.id === "ca-bill-c-27-aida-2022-lapsed",
  );
  assert.equal(instrument.textAvailability.stored, false);
  const anchors = provisions.filter(
    (item) => item.instrumentId === "ca-bill-c-27-aida-2022-lapsed",
  );
  assert.equal(anchors.length, 4);
  assert.ok(anchors.every((item) => item.textAvailability.stored === false));
  assert.ok(anchors.every((item) => item.fullText === undefined));
});

test("handoff pins the redistributable Brazilian corpus and source hashes", async () => {
  assert.equal(manifest.reviewedAsOf, "2026-07-20");
  const brazilManifest = manifest.corpora.find(
    (corpus) => corpus.instrumentId === "br-pl-2338-2023-ai-bill",
  );
  assert.equal(brazilManifest.coverage.complete, true);
  assert.equal(
    brazilManifest.coverage.expectedUnitCount,
    brazilManifest.coverage.actualUnitCount,
  );
  assert.equal(sha256(await readFile(pathAt(brazilManifest.output.path))), brazilManifest.output.sha256);
  for (const snapshot of brazilManifest.sourceSnapshots) {
    if (snapshot.storedLocally === false) {
      assert.equal(snapshot.path, undefined);
      assert.ok(snapshot.url.startsWith("https://"));
      continue;
    }
    assert.equal(sha256(await readFile(pathAt(snapshot.path))), snapshot.sha256);
  }
  assert.equal(brazilManifest.statusReview.status, "pending-bill-not-enacted");
  assert.equal(brazilManifest.statusReview.finalLawUrn, null);
  assert.match(brazilManifest.coverage.numberingNotice, /there is no Article 31/u);
});

test("the version-locked Brazil importer reproduces the corpus byte for byte", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "br-ai-bill-corpus-"));
  const brazilOutput = join(temporaryDirectory, "brazil.json");
  const python = process.env.PYTHON || "python3";
  try {
    await execFileAsync(
      python,
      [
        pathAt("scripts/import-brazil-ai-bill-2338.py"),
        pathAt("data/v2/source-snapshots/br-pl2338-2023-official-articles.json"),
        pathAt("data/v2/source-snapshots/br-pl2338-2023-chamber-status-2026-07-20.json"),
        pathAt("data/v2/source-snapshots/br-pl2338-2023-chamber-proceedings-2026-07-20.json"),
        pathAt("data/v2/source-snapshots/br-pl2338-2023-chamber-record-2026-07-20.html"),
        brazilOutput,
        "--retrieved-on",
        "2026-07-20",
      ],
      { cwd: root },
    );
    assert.deepEqual(await readFile(brazilOutput), brazilBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
