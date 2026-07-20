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
const corpusPath = join(root, "data/v2/ch-fadp-2020-provisions.json");
const manifestPath = join(
  root,
  "data/v2/source-snapshots/ch-fadp-20250707-source-manifest.json",
);
const importerPath = join(root, "scripts/import-swiss-fadp.py");

const snapshotPaths = Object.fromEntries(
  ["de", "fr", "it", "en"].map((language) => [
    language,
    join(root, `data/v2/source-snapshots/ch-fadp-20250707-${language}.xml`),
  ]),
);

const corpusBytes = await readFile(corpusPath);
const manifestBytes = await readFile(manifestPath);
const concepts = JSON.parse(await readFile(join(root, "data/v2/concepts.json")));
const records = JSON.parse(corpusBytes);
const manifest = JSON.parse(manifestBytes);
const snapshots = Object.fromEntries(
  await Promise.all(
    Object.entries(snapshotPaths).map(async ([language, path]) => [
      language,
      await readFile(path),
    ]),
  ),
);
const snapshotText = Object.fromEntries(
  Object.entries(snapshots).map(([language, bytes]) => [
    language,
    bytes.toString("utf8"),
  ]),
);
const byId = new Map(records.map((record) => [record.id, record]));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("current FADP corpus contains every Article and both Annexes", () => {
  assert.equal(records.length, 79);
  assert.equal(new Set(records.map((record) => record.id)).size, 79);
  const articles = records.filter((record) => record.provisionType === "article");
  const annexes = records.filter((record) => record.provisionType === "annex");
  assert.equal(articles.length, 77);
  assert.equal(annexes.length, 2);

  const expectedNumbers = new Set([
    ...Array.from({ length: 74 }, (_, index) => String(index + 1)),
    "44a",
    "47a",
    "72a",
  ]);
  assert.deepEqual(new Set(articles.map((record) => record.articleNumber)), expectedNumbers);
  assert.deepEqual(
    annexes.map((record) => record.articleNumber),
    ["1", "2"],
  );
});

test("four frozen Fedlex manifestations and generated corpus match the hash manifest", () => {
  const expectedHashes = {
    de: "a99bce3dc59a5c3f25e69ed5e483380c0f1a9b57ec452fedb62e0e68b7baabef",
    fr: "50b609dddcdb8b2b248f498de8e3a5eabfbb9e6d06674daf8fc508ab7393aeb3",
    it: "40d05593c64b46813c4ae1289ccd51717b737fc68b173edafbd2bc824d5fa91f",
    en: "47d871be5cfc9a7668ae13fd513ca19851c29df76d0ed6fdd861e09f32d8fe82",
  };
  for (const [language, expected] of Object.entries(expectedHashes)) {
    assert.equal(sha256(snapshots[language]), expected);
    assert.match(
      snapshotText[language],
      /<FRBRdate date="2025-07-07" name="jolux:dateApplicability"\/>/,
    );
    assert.match(
      snapshotText[language],
      /<FRBRdate date="2023-09-01" name="jolux:dateEntryInForce"\/>/,
    );
  }
  assert.equal(manifest.corpus.sha256, sha256(corpusBytes));
  assert.equal(manifest.corpus.nodeCount, 79);
  assert.equal(manifest.corpus.articleCount, 77);
  assert.equal(manifest.corpus.annexCount, 2);
  assert.deepEqual(
    Object.fromEntries(
      manifest.snapshots.map((snapshot) => [
        snapshot.language.slice(0, 2),
        snapshot.snapshotSha256,
      ]),
    ),
    { en: expectedHashes.en, de: expectedHashes.de, fr: expectedHashes.fr, it: expectedHashes.it },
  );
});

test("German, French and Italian remain equal authoritative texts; English never is", () => {
  for (const record of records) {
    assert.equal(record.language, "en-CH");
    assert.equal(record.defaultLanguage, "en-CH");
    assert.equal(record.defaultLanguageStatus, "official-non-authoritative-translation");
    assert.deepEqual(record.availableLanguages, ["en-CH", "de-CH", "fr-CH", "it-CH"]);
    assert.deepEqual(record.authoritativeLanguages, ["de-CH", "fr-CH", "it-CH"]);
    assert.equal(record.fullText, record.paragraphs.join("\n\n"));
    assert.equal(record.contentSha256, sha256(record.fullText));
    assert.ok(record.fullText.length > 0, `${record.id} lacks English text`);

    for (const language of ["de-CH", "fr-CH", "it-CH"]) {
      const version = record.translations[language];
      assert.equal(version.status, "official-authoritative-equal-status");
      assert.equal(version.authoritative, true);
      assert.ok(version.fullText.length > 0, `${record.id} lacks ${language}`);
      assert.equal(version.fullText, version.paragraphs.join("\n\n"));
      assert.equal(version.contentSha256, sha256(version.fullText));
      assert.equal(version.sourceRecord.sourceEid, record.sourceRecord.sourceEid);
    }

    assert.equal(record.translationAudit.englishAuthoritative, false);
    assert.equal(
      record.authenticity.englishStatus,
      "official-non-authoritative-translation-no-legal-force",
    );
    assert.match(record.authenticity.authorityNote, /German, French and Italian.*equal/i);
    assert.match(record.authenticity.authorityNote, /English.*no legal force/i);
    assert.equal(record.formatStatus.normalisation.languageGeneration, "none");
  }
});

test("official structural eIds align exactly across all four language snapshots", () => {
  const structuralEids = (value) =>
    [...value.matchAll(/<(article|paragraph|item|blockList|chapter|section)\b[^>]*\beId="([^"]+)"/g)]
      .map((match) => `${match[1]}:${match[2]}`);
  const german = structuralEids(snapshotText.de);
  assert.ok(german.length > 500);
  assert.deepEqual(structuralEids(snapshotText.fr), german);
  assert.deepEqual(structuralEids(snapshotText.it), german);
  assert.deepEqual(structuralEids(snapshotText.en), german);
  assert.equal(manifest.englishSynchronisation.articleCoverageAligned, 77);
  assert.equal(manifest.englishSynchronisation.annexCoverageAligned, 2);
  assert.equal(manifest.englishSynchronisation.sameConsolidationVersion, true);
  assert.equal(manifest.englishSynchronisation.englishFedlexUploadDate, "2025-08-14");
});

test("consolidation history is current and never substituted for commencement", () => {
  assert.equal(manifest.currentVersionDate, "2025-07-07");
  assert.equal(manifest.actCommencementDate, "2023-09-01");
  assert.equal(manifest.versionDateIsCommencementDate, false);
  assert.deepEqual(
    manifest.versionDiscovery.result.map((version) => [
      version.dateApplicability,
      version.dateEndApplicability,
    ]),
    [
      ["2023-09-01", "2025-03-31"],
      ["2025-04-01", "2025-07-06"],
      ["2025-07-07", null],
    ],
  );
  for (const record of records) {
    assert.equal(record.versionAsOf, "2025-07-07");
    assert.equal(record.sourceVersion.versionDateIsCommencementDate, false);
    assert.equal(record.applicability.sourceConsolidationDateIsCommencement, false);
    assert.notEqual(record.appliesFrom, "2025-07-07");
  }
});

test("privacy by design, automation, DPIA, security and transfer provisions are complete", () => {
  const article7 = byId.get("ch-fadp-2020-art-7");
  assert.match(article7.fullText, /from the planning stage/i);
  assert.match(article7.fullText, /suitable default settings/i);
  assert.match(article7.fullText, /limited to the minimum required/i);
  assert.match(article7.translations["de-CH"].title, /Datenschutz durch Technik/);
  assert.deepEqual(article7.conceptIds, ["privacy-by-design-default", "data-minimization"]);
  assert.equal(article7.transition.sourceArticle, "69");

  const article21 = byId.get("ch-fadp-2020-art-21");
  assert.match(article21.fullText, /based exclusively on automated processing/i);
  assert.match(article21.fullText, /express their point of view/i);
  assert.match(article21.fullText, /reviewed by a natural person/i);
  assert.ok(article21.conceptIds.includes("human-oversight"));

  const article22 = byId.get("ch-fadp-2020-art-22");
  assert.match(article22.fullText, /carry out a data protection impact assessment beforehand/i);
  assert.match(article22.fullText, /in particular when using new technologies/i);
  assert.match(article22.fullText, /large-scale processing of sensitive personal data/i);
  assert.equal(article22.transition.sourceArticle, "69");
  assert.match(byId.get("ch-fadp-2020-art-23").fullText, /seek the FDPIC's opinion beforehand/i);

  assert.match(
    byId.get("ch-fadp-2020-art-8").fullText,
    /level of data security appropriate to the risk/i,
  );
  assert.match(
    byId.get("ch-fadp-2020-art-16").fullText,
    /standard data protection clauses.*binding corporate rules/is,
  );
  assert.match(
    byId.get("ch-fadp-2020-art-17").fullText,
    /In derogation from Article 16/i,
  );
});

test("all local highlight relationships resolve to existing core concepts", () => {
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const highlighted = records.filter((record) => record.highlightForThemes);
  assert.ok(highlighted.length >= 40);
  for (const record of records) {
    assert.equal(record.highlightForThemes, record.conceptIds.length > 0);
    for (const conceptId of record.conceptIds) {
      assert.ok(conceptIds.has(conceptId), `${record.id} references unknown ${conceptId}`);
    }
  }
});

test("Article 24 preserves its mixed commencement and current paragraph 5bis", () => {
  const article24 = byId.get("ch-fadp-2020-art-24");
  assert.equal(article24.legalEffectStatus, "in-force");
  assert.equal(article24.commencementStatus, "in-force-mixed-commencement");
  assert.equal(article24.appliesFrom, null);
  assert.equal(article24.applicability.commencementDate, null);
  assert.equal(article24.applicability.generalActCommencementDate, "2023-09-01");
  assert.deepEqual(article24.applicability.laterInsertedProvision, {
    locator: "paragraph 5bis",
    effectiveFrom: "2025-04-01",
  });
  assert.match(article24.fullText, /5bis With the controller’s consent/);
  assert.match(article24.fullText, /National Cyber Security Centre/);
  assert.doesNotMatch(article24.fullText, /Inserted by No II 2/);
  assert.match(article24.sourceNotes.join(" "), /in force since 1 April 2025/);
  assert.equal(article24.amendmentHistory[0].effectiveFrom, "2025-04-01");
});

test("Italian Article 57 correction is recorded without inventing commencement", () => {
  const article57 = byId.get("ch-fadp-2020-art-57");
  assert.equal(
    article57.revisionStatus,
    "current-consolidation-with-italian-text-correction",
  );
  assert.equal(article57.appliesFrom, "2023-09-01");
  assert.equal(article57.amendmentHistory[0].effectiveFrom, null);
  assert.equal(article57.amendmentHistory[0].publishedOn, "2025-07-07");
  assert.match(article57.sourceNotes.join(" "), /concerns the Italian text only/);
  assert.match(
    article57.translations["it-CH"].sourceNotes.join(" "),
    /Correzione.*7 lug\. 2025/u,
  );
});

test("official English Annex 2 defect is preserved and explicitly warned", () => {
  const annex2 = byId.get("ch-fadp-2020-annex-2");
  assert.match(annex2.fullText, /^\(Art\. 68\)$/);
  assert.match(annex2.translations["de-CH"].fullText, /^\(Art\. 73\)$/);
  assert.match(annex2.translations["fr-CH"].fullText, /^\(art\. 73\)$/i);
  assert.match(annex2.translations["it-CH"].fullText, /^\(art\. 73\)$/i);
  assert.equal(
    annex2.alignment.knownLanguageDivergence.controllingReference,
    "Article 73",
  );
  assert.equal(annex2.alignment.knownLanguageDivergence.sourceTextAltered, false);
  assert.match(
    annex2.alignment.knownLanguageDivergence.note,
    /preserves the English source verbatim/i,
  );
  assert.match(byId.get("ch-fadp-2020-art-73").fullText, /Annex 2/);
  assert.equal(
    manifest.englishSynchronisation.knownTextualDivergences.annex_2.englishSourceText,
    "(Art. 68)",
  );
});

test("amended and transitional nodes retain their precise source status", () => {
  for (const number of ["44a", "47a", "72a"]) {
    const record = byId.get(`ch-fadp-2020-art-${number}`);
    assert.match(record.revisionStatus, /inserted/);
    assert.equal(record.amendmentHistory[0].effectiveFrom, "2023-09-01");
    assert.match(record.sourceNotes.join(" "), /in force since 1 Sept\. 2023/i);
  }
  assert.equal(
    byId.get("ch-fadp-2020-art-71").transition.status,
    "in-force-time-limited-transitional-rule-as-of-2026-07-20",
  );
  assert.equal(byId.get("ch-fadp-2020-art-71").transition.calculatedLastDay, "2028-08-31");
  assert.match(
    byId.get("ch-fadp-2020-art-72").transition.status,
    /retained-in-current-consolidation/,
  );
});

test("Annexes and official editorial notes are retained without mixing notes into operative text", () => {
  const annex1 = byId.get("ch-fadp-2020-annex-1");
  assert.match(annex1.fullText, /Federal Act of 19 June 1992 on Data Protection/);
  assert.match(annex1.fullText, /Schengen-Data Protection Act of 28 September 2018/);
  assert.match(annex1.fullText, /The following enactments are amended as follows/);
  assert.match(annex1.fullText, /…$/);
  assert.doesNotMatch(annex1.fullText, /amendments may be consulted/i);
  assert.match(annex1.sourceNotes.join(" "), /amendments may be consulted/i);
  assert.ok(byId.get("ch-fadp-2020-annex-2").sourceNotes.length > 0);
  assert.match(manifest.rights.reuseInformationUrl, /fedlex\.admin\.ch\/de\/broadcasters/);
  assert.equal(manifest.formatStatus.snapshotFormat, "official-Fedlex-Akoma-Ntoso-XML");
});

test("version-locked importer reproduces corpus and manifest byte for byte", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "ch-fadp-corpus-"));
  const output = join(temporaryDirectory, "corpus.json");
  const manifestOutput = join(temporaryDirectory, "manifest.json");
  try {
    const result = await execFileAsync(
      process.env.PYTHON || "python3",
      [
        importerPath,
        "--output",
        output,
        "--manifest-output",
        manifestOutput,
      ],
      { cwd: root },
    );
    assert.match(result.stdout, /79 nodes \(77 Articles, 2 Annexes/);
    assert.deepEqual(await readFile(output), corpusBytes);
    assert.deepEqual(await readFile(manifestOutput), manifestBytes);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
