import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("jp-ai-promotion-act-2025-articles.json");
const manifest = await loadJson("jp-ai-promotion-act-2025-corpus-manifest.json");

test("Japan AI Promotion Act has exactly 28 current main Articles and one current supplementary block", () => {
  assert.equal(corpus.length, 29);
  const articles = corpus.slice(0, 28);
  const supplementary = corpus.at(-1);
  assert.deepEqual(
    articles.map((unit) => unit.articleNumber),
    Array.from({ length: 28 }, (_, index) => String(index + 1)),
  );
  assert.equal(supplementary.unitType, "supplementary-provision-block");
  assert.match(supplementary.fullText, /第一条[\s\S]*第二条/);
  assert.doesNotMatch(supplementary.fullText, /内閣府設置法の一部改正/);

  for (const [index, unit] of articles.entries()) {
    const number = index + 1;
    assert.equal(unit.id, `jp-ai-promotion-act-2025-art-${number}`);
    assert.equal(unit.instrumentId, "jp-ai-promotion-act-2025");
    assert.equal(unit.language, "ja-JP");
    assert.equal(unit.versionAsOf, "2026-07-20");
    assert.equal(
      unit.sourceVersion.revisionId,
      "507AC0000000053_20250901_000000000000000",
    );
    assert.match(unit.fullText, /[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.equal(unit.contentSha256, digest(unit.fullText));
    assert.match(unit.sourceNodeSha256, /^[a-f0-9]{64}$/);

    const english = unit.translations.en;
    assert.equal(
      english.status,
      "government-reference-translation-no-legal-effect",
    );
    assert.equal(english.language, "en");
    assert.match(english.fullText, /[A-Za-z]/);
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.match(english.authorityNote, /not official texts and have no legal effect/i);
    assert.equal(unit.alignment.originalUnitCount, 28);
    assert.equal(unit.alignment.englishUnitCount, 28);
  }

  assert.equal(articles.filter((unit) => unit.appliesFrom === "2025-06-04").length, 17);
  assert.equal(articles.filter((unit) => unit.appliesFrom === "2025-09-01").length, 11);
  assert.match(articles[2].fullText, /個人情報の漏えい、著作権の侵害/);
  assert.match(articles[2].fullText, /透明性の確保/);
  assert.match(articles[6].fullText, /活用事業者/);
  assert.match(articles[12].fullText, /国際的な規範の趣旨に即した指針/);
  assert.match(articles[15].fullText, /権利利益の侵害が生じた事案/);
  assert.match(articles[2].translations.en.fullText, /transparency/i);
  assert.match(articles[12].translations.en.fullText, /international norms/i);
});

test("AI Promotion Act manifest records full commencement and no future amendment", () => {
  assert.equal(manifest.currentVersion.status, "current-fully-in-force");
  assert.equal(manifest.currentVersion.promulgatedOn, "2025-06-04");
  assert.equal(manifest.currentVersion.fullyEffectiveFrom, "2025-09-01");
  assert.equal(
    manifest.currentVersion.revisionId,
    "507AC0000000053_20250901_000000000000000",
  );
  assert.equal(manifest.currentVersion.promulgatedFutureRevisionCount, 0);
  assert.deepEqual(manifest.promulgatedFutureRevisions, []);
  assert.equal(manifest.corpus.nodeCount, 29);
  assert.equal(manifest.corpus.mainArticleCount, 28);
  assert.equal(manifest.corpus.currentSupplementaryArticleCount, 2);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((unit) => unit.fullText).join("\n\n")),
  );
});

test("AI Promotion Act government English reference is current but expressly non-authoritative", () => {
  assert.equal(
    manifest.translation.status,
    "government-published-reference-current-no-legal-effect",
  );
  assert.equal(manifest.translation.translatedOn, "2025-08-22");
  assert.equal(manifest.translation.publishedOnDatabase, "2026-01-30");
  assert.equal(manifest.translation.dictionaryVersion, "18.0");
  assert.equal(manifest.translation.mainArticleCount, 28);
  assert.equal(manifest.translation.currentSupplementaryArticleCountAligned, 2);
  assert.equal(manifest.translation.sourceOriginalSupplementaryArticleNodeCount, 5);
  assert.match(manifest.translation.versionDifference, /spent supplementary amendment provisions/i);
  assert.match(manifest.translation.legalEffect, /no legal effect/i);

  const supplementary = corpus.at(-1);
  assert.equal(supplementary.alignment.originalUnitCount, 2);
  assert.equal(supplementary.alignment.englishAlignedUnitCount, 2);
  assert.equal(supplementary.alignment.englishSourceOriginalUnitCount, 5);
  assert.doesNotMatch(
    supplementary.translations.en.fullText,
    /Partial Amendment of the Act for Establishment of the Cabinet Office/i,
  );
});

test("Every AI Promotion Act source snapshot matches its manifest SHA-256", async () => {
  for (const snapshot of manifest.sourceSnapshots) {
    const bytes = await readFile(new URL(snapshot.path.replace("data/v2/", ""), dataRoot));
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const current = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "current-effective-text",
  );
  assert.equal(
    current.sha256,
    "d91cfc90de242947edab59bf44ae42541f7f5d03740acbc4f188d56839fb77cc",
  );
  const xml = await readFile(
    new URL(current.path.replace("data/v2/", ""), dataRoot),
    "utf8",
  );
  assert.match(xml, /人工知能関連技術の研究開発及び活用の推進に関する法律/);
  assert.match(xml, /<Article Num="28">/);
});
