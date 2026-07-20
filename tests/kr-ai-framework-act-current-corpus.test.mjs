import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("kr-ai-framework-act-2025-current-articles.json");
const manifest = await loadJson("kr-ai-framework-act-2025-corpus-manifest.json");

test("Korea AI Framework Act current corpus has 44 main Articles and three complete addenda blocks", () => {
  const articles = corpus.filter((unit) => unit.unitType === "article");
  const addenda = corpus.filter(
    (unit) => unit.unitType === "supplementary-provision-block",
  );
  assert.equal(corpus.length, 47);
  assert.equal(articles.length, 44);
  assert.equal(addenda.length, 3);
  assert.equal(
    digest(articles.map((unit) => unit.articleNumber).join("\n")),
    "f1767c6fbc093e0e21c585471961c5ae70ecdd3c10fa523cd0797c5a900b91e0",
  );
  assert.ok(articles.some((unit) => unit.id === "kr-ai-framework-act-2025-art-22-2"));
  assert.ok(!articles.some((unit) => unit.id === "kr-ai-framework-act-2025-art-17-2"));
  assert.ok(!articles.some((unit) => unit.id === "kr-ai-framework-act-2025-art-22-3"));
  assert.equal(articles.at(-1).id, "kr-ai-framework-act-2025-art-43");

  for (const unit of corpus) {
    assert.equal(unit.instrumentId, "kr-ai-framework-act-2025");
    assert.equal(unit.language, "ko-KR");
    assert.equal(unit.versionAsOf, "2026-07-20");
    assert.equal(unit.sourceVersion.masterSequence, "282791");
    assert.equal(unit.sourceVersion.promulgationNumber, "21311");
    assert.equal(unit.sourceVersion.effectivePhaseDate, "2026-01-22");
    assert.equal(unit.sourceVersion.futureEffectiveTextIncluded, false);
    assert.equal(
      unit.textAvailability,
      "full-current-official-korean-consolidation",
    );
    assert.match(unit.authorityNote, /promulgated Korean text controls/i);
    assert.match(unit.authorityNote, /Official Gazette/i);
    assert.match(unit.fullText, /[\u3131-\u318e\uac00-\ud7a3]/u);
    assert.equal(unit.contentSha256, digest(unit.fullText));
    assert.match(unit.sourceNodeSha256, /^[a-f0-9]{64}$/);
    assert.equal(
      unit.translationStatus,
      "external-future-phase-reference-not-current-no-toggle",
    );
    assert.equal(unit.translationReference.currentLanguageToggleEligible, false);
    assert.ok(!("translations" in unit));
  }

  const article2 = articles.find((unit) => unit.articleNumber === "2");
  assert.match(article2.fullText, /고영향 인공지능/);
  assert.match(article2.fullText, /생성형 인공지능/);
  const article31 = articles.find((unit) => unit.articleNumber === "31");
  assert.match(article31.fullText, /인공지능 투명성 확보 의무/);
  assert.match(article31.fullText, /사전에 고지하여야 한다/);
  const article34 = articles.find((unit) => unit.articleNumber === "34");
  assert.match(article34.fullText, /위험관리방안/);
  assert.match(article34.fullText, /사람의 관리ㆍ감독/);
  assert.match(addenda[0].fullText, /제20676호,2025.1.21/);
  assert.match(addenda[1].fullText, /제21065호,2025.10.1/);
  assert.match(addenda[2].fullText, /제21311호,2026.1.20/);
});

test("AI Act lifecycle records the formal enactment, intervening amendment, and current Act No. 21311 phase", () => {
  assert.equal(
    manifest.officialTitle,
    "인공지능 발전과 신뢰 기반 조성 등에 관한 기본법",
  );
  assert.equal(manifest.enactment.actNumber, "20676");
  assert.equal(manifest.enactment.promulgatedOn, "2025-01-21");
  assert.equal(manifest.enactment.generalEffectiveFrom, "2026-01-22");
  assert.equal(manifest.interveningAmendment.actNumber, "21065");
  assert.equal(manifest.currentVersion.promulgationNumber, "21311");
  assert.equal(manifest.currentVersion.promulgatedOn, "2026-01-20");
  assert.equal(manifest.currentVersion.effectivePhaseDate, "2026-01-22");
  assert.equal(manifest.currentVersion.futureEffectiveTextIncluded, false);
  assert.equal(manifest.corpus.nodeCount, 47);
  assert.equal(manifest.corpus.mainArticleCount, 44);
  assert.equal(manifest.corpus.structuralHeadingCount, 7);
  assert.equal(manifest.corpus.statutoryArticleTextFieldCount, 402);
  assert.equal(manifest.corpus.articleSourceNoteCount, 3);
  assert.equal(manifest.corpus.normalizedFullTextCharacterCount, 25282);
  assert.equal(manifest.corpus.completeSourceCoverageVerified, true);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((unit) => unit.fullText).join("\n\n")),
  );
});

test("The final Act No. 21311 phase remains isolated until 21 July 2026", async () => {
  assert.equal(manifest.promulgatedFuturePhases.length, 1);
  const future = manifest.promulgatedFuturePhases[0];
  assert.equal(future.amendingActNumber, "21311");
  assert.equal(future.effectiveOn, "2026-07-21");
  assert.equal(future.mainArticleCount, 46);
  assert.equal(future.includedInCurrentCorpus, false);
  assert.equal(
    future.articleNumberSequenceSha256,
    "a029a23aa0ccaecc602ed0d77a2e403231bab60695b6db4b765852a500e6eb6b",
  );

  const current = await readFile(
    new URL("source-snapshots/kr-ai-014820-current-effective-2026-07-20.xml", dataRoot),
    "utf8",
  );
  const futureText = await readFile(
    new URL("source-snapshots/kr-ai-014820-future-2026-07-21.xml", dataRoot),
    "utf8",
  );
  const currentMain = current.match(/<조문>[\s\S]*?<\/조문>/u)?.[0];
  const futureMain = futureText.match(/<조문>[\s\S]*?<\/조문>/u)?.[0];
  assert.ok(currentMain && futureMain);
  assert.match(current, /<시행일자>20260122<\/시행일자>/);
  assert.doesNotMatch(currentMain, /제17조의2\(인공지능제품/);
  assert.doesNotMatch(currentMain, /제22조의3\(인공지능기술 확보/);
  assert.match(futureText, /<시행일자>20260721<\/시행일자>/);
  assert.match(futureMain, /제17조의2\(인공지능제품/);
  assert.match(futureMain, /제22조의3\(인공지능기술 확보/);
  assert.doesNotMatch(
    corpus.find((unit) => unit.articleNumber === "3").fullText,
    /인공지능취약계층/,
  );
  assert.match(futureMain, /인공지능취약계층/);
});

test("AI Act English references are not presented as a current language toggle", () => {
  assert.equal(manifest.translation.currentLanguageToggleEligible, false);
  assert.equal(manifest.translation.bodyStored, false);
  assert.equal(
    manifest.translation.MOLEGEnglishIndexBoundary.promulgationNumber,
    "20676",
  );
  assert.match(
    manifest.translation.MOLEGEnglishIndexBoundary.status,
    /outdated-after-Act-No-21311/,
  );
  assert.equal(
    manifest.translation.KLRIReferenceBoundary.referenceMainArticleCount,
    46,
  );
  assert.equal(
    manifest.translation.KLRIReferenceBoundary.alignment,
    "future-effective-2026-07-21-phase",
  );
  assert.match(manifest.translation.reasonNotAttached, /scheduled phase/i);
  assert.match(manifest.translation.reasonNotAttached, /prohibits unauthorized reproduction/i);
  assert.match(manifest.translation.authorityNote, /Korean prevails/i);
});

test("Every AI Act frozen source snapshot matches its manifest SHA-256", async () => {
  for (const snapshot of manifest.sourceSnapshots) {
    const bytes = await readFile(
      new URL(snapshot.path.replace("data/v2/", ""), dataRoot),
    );
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const current = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "current-effective-text",
  );
  assert.equal(
    current.sha256,
    "a05b63d5021be2ce30076f674213d3e9d04afbd5137966a5ac1e7db50992c27d",
  );
});
