import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("kr-pipa-2011-current-articles.json");
const manifest = await loadJson("kr-pipa-2011-corpus-manifest.json");

test("Korea PIPA corpus contains all 126 current Articles and all 12 addenda blocks", () => {
  const articles = corpus.filter((unit) => unit.unitType === "article");
  const addenda = corpus.filter(
    (unit) => unit.unitType === "supplementary-provision-block",
  );
  assert.equal(corpus.length, 138);
  assert.equal(articles.length, 126);
  assert.equal(addenda.length, 12);
  assert.equal(
    digest(articles.map((unit) => unit.articleNumber).join("\n")),
    "fe8bf7df85b48c94bb60a54ea662942bcc319c666d81f56d3fe68cfc996f9855",
  );
  assert.equal(articles[0].id, "kr-pipa-2011-art-1");
  assert.equal(articles.at(-1).id, "kr-pipa-2011-art-76");
  assert.ok(articles.some((unit) => unit.id === "kr-pipa-2011-art-7-14"));
  assert.ok(articles.some((unit) => unit.id === "kr-pipa-2011-art-28-11"));
  assert.ok(articles.some((unit) => unit.id === "kr-pipa-2011-art-74-2"));
  assert.ok(!articles.some((unit) => unit.id === "kr-pipa-2011-art-30-3"));

  for (const unit of corpus) {
    assert.equal(unit.instrumentId, "kr-pipa-2011");
    assert.equal(unit.language, "ko-KR");
    assert.equal(unit.versionAsOf, "2026-07-20");
    assert.equal(unit.sourceVersion.masterSequence, "270351");
    assert.equal(unit.sourceVersion.effectivePhaseDate, "2025-10-02");
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
      "government-current-reference-stored-no-legal-effect",
    );
    assert.equal(unit.translationReference.currentLanguageToggleEligible, true);
    assert.equal(
      unit.translationReference.coverageStatus,
      "complete-current-reference",
    );
    const english = unit.translations.en;
    assert.equal(english.language, "en");
    assert.equal(
      english.status,
      "government-reference-translation-no-legal-effect",
    );
    assert.equal(english.coverageStatus, "complete-current-reference");
    assert.equal(english.versionAsOf, "2025-10-02");
    assert.equal(english.versionLabel, "Act No. 20897 (effective 2025-10-02)");
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(english.referenceViewEligible, true);
    assert.match(english.fullText, /[A-Za-z]/);
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.match(english.sourceNodeSha256, /^[a-f0-9]{64}$/);
    assert.match(english.note, /promulgated Korean text controls/i);
    assert.equal(english.rights.reuseStatus, "moleg-law-open-data-free-use");
    assert.equal(
      unit.rights.reuseStatus,
      "korean-statutory-text-not-copyright-protected",
    );
  }

  const article15 = articles.find((unit) => unit.articleNumber === "15");
  assert.equal(article15.chapter.originalTitle, "제3장 개인정보의 처리");
  assert.equal(
    article15.section.originalTitle,
    "제1절 개인정보의 수집, 이용, 제공 등",
  );
  assert.match(article15.fullText, /정보주체의 동의를 받은 경우/);

  const article28_8 = articles.find((unit) => unit.articleNumber === "28-8");
  assert.equal(
    article28_8.section.originalTitle,
    "제4절 개인정보의 국외 이전 <신설 2023.3.14>",
  );
  assert.match(article28_8.fullText, /개인정보를 국외로 이전할 수 있다/);
  assert.match(articles.find((unit) => unit.articleNumber === "34").fullText, /유출/);
  assert.match(addenda[0].fullText, /제10465호,2011.3.29/);
  assert.match(addenda.at(-1).fullText, /제20897호,2025.4.1/);
  assert.match(article15.translations.en.fullText, /consent is obtained from the data subject/i);
  assert.match(article28_8.translations.en.fullText, /cross-border transfer of personal information/i);
  assert.match(addenda[0].translations.en.fullText, /ADDENDA <Act No. 10465/i);
  assert.match(addenda.at(-1).translations.en.fullText, /ADDENDA <Act No. 20897/i);
});

test("PIPA automated-decision refusal, explanation, human-intervention, and transparency rights are current", () => {
  const article4 = corpus.find((unit) => unit.id === "kr-pipa-2011-art-4");
  const article37_2 = corpus.find(
    (unit) => unit.id === "kr-pipa-2011-art-37-2",
  );
  assert.match(article4.fullText, /자동화된 개인정보 처리에 따른 결정을 거부/);
  assert.match(article37_2.fullText, /거부할 수 있는 권리/);
  assert.match(article37_2.fullText, /설명 등을 요구할 수 있다/);
  assert.match(article37_2.fullText, /인적 개입에 의한 재처리/);
  assert.match(article37_2.fullText, /쉽게 확인할 수 있도록 공개/);
  assert.match(article37_2.translations.en.fullText, /automated decision/i);
  assert.match(article37_2.translations.en.fullText, /request explanation, etc/i);
  assert.equal(
    manifest.automatedDecisionRightsAudit.article37_2ContentSha256,
    article37_2.contentSha256,
  );
  assert.equal(manifest.automatedDecisionRightsAudit.status, "verified-current-effective");
});

test("PIPA manifest isolates both Act No. 21445 future-effective phases", async () => {
  assert.equal(manifest.currentVersion.masterSequence, "270351");
  assert.equal(manifest.currentVersion.promulgationNumber, "20897");
  assert.equal(manifest.currentVersion.effectivePhaseDate, "2025-10-02");
  assert.equal(manifest.currentVersion.futureEffectiveTextIncluded, false);
  assert.deepEqual(
    manifest.promulgatedFuturePhases.map((phase) => phase.effectiveOn),
    ["2026-09-11", "2027-07-01"],
  );
  assert.ok(
    manifest.promulgatedFuturePhases.every(
      (phase) => phase.amendingActNumber === "21445" && !phase.includedInCurrentCorpus,
    ),
  );
  assert.equal(manifest.promulgatedFuturePhases[0].mainArticleCount, 127);
  assert.equal(manifest.promulgatedFuturePhases[1].mainArticleCount, 127);
  assert.equal(manifest.corpus.nodeCount, 138);
  assert.equal(manifest.corpus.statutoryArticleTextFieldCount, 971);
  assert.equal(manifest.corpus.articleSourceNoteCount, 58);
  assert.equal(manifest.corpus.normalizedFullTextCharacterCount, 82647);
  assert.equal(manifest.corpus.completeSourceCoverageVerified, true);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((unit) => unit.fullText).join("\n\n")),
  );

  const current = await readFile(
    new URL("source-snapshots/kr-pipa-011357-current-effective-2026-07-20.xml", dataRoot),
    "utf8",
  );
  const firstFuture = await readFile(
    new URL("source-snapshots/kr-pipa-011357-future-2026-09-11.xml", dataRoot),
    "utf8",
  );
  const secondFuture = await readFile(
    new URL("source-snapshots/kr-pipa-011357-future-2027-07-01.xml", dataRoot),
    "utf8",
  );
  const currentMain = current.match(/<조문>[\s\S]*?<\/조문>/u)?.[0];
  const firstFutureMain = firstFuture.match(/<조문>[\s\S]*?<\/조문>/u)?.[0];
  const secondFutureMain = secondFuture.match(/<조문>[\s\S]*?<\/조문>/u)?.[0];
  assert.ok(currentMain && firstFutureMain && secondFutureMain);
  assert.match(current, /<시행일자>20251002<\/시행일자>/);
  assert.doesNotMatch(currentMain, /제30조의3\(사업주 또는 대표자의 책임\)/);
  assert.match(firstFutureMain, /제30조의3\(사업주 또는 대표자의 책임\)/);
  assert.doesNotMatch(firstFutureMain, /다만, 매출액, 개인정보의 처리 규모[^<]+인증을 받아야 한다/);
  assert.match(secondFutureMain, /다만, 매출액, 개인정보의 처리 규모[^<]+인증을 받아야 한다/);
});

test("PIPA English reference is complete, current-aligned, and stored from MOLEG Open Data", () => {
  assert.equal(manifest.translation.sourceVersion, "Act No. 20897, Apr. 1, 2025");
  assert.equal(manifest.translation.referenceMainArticleCount, 126);
  assert.equal(manifest.translation.referenceSupplementaryProvisionBlockCount, 12);
  assert.equal(manifest.translation.attachedReferenceUnitCount, 138);
  assert.equal(manifest.translation.futureAct21445Included, false);
  assert.equal(manifest.translation.currentLanguageToggleEligible, true);
  assert.equal(manifest.translation.coverageStatus, "complete-current-reference");
  assert.equal(manifest.translation.versionAsOf, "2025-10-02");
  assert.equal(manifest.translation.bodyStored, true);
  assert.match(manifest.translation.legalEffect, /no-legal-or-official-authority/);
  assert.match(manifest.translation.authorityNote, /Korean prevails/i);
  assert.equal(
    manifest.rights.referenceTranslation.reuseStatus,
    "moleg-law-open-data-free-use",
  );
  assert.match(manifest.rights.referenceTranslation.basis, /including commercially/i);
  assert.equal(
    manifest.rights.alternativeKLRIReference.reuseStatus,
    "external-link-only-no-redistribution",
  );
});

test("Every PIPA frozen source snapshot matches its manifest SHA-256", async () => {
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
    "ec140965df7274d13dab65d3a20e3450c5309062e049b50bc6e1016c9f4d4347",
  );
});
