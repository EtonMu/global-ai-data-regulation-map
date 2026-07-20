import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson(
  "tw-executive-yuan-generative-ai-guidelines-2023-points.json",
);
const manifest = await loadJson(
  "tw-executive-yuan-generative-ai-guidelines-2023-corpus-manifest.json",
);

test("Taiwan Executive Yuan GenAI guidance preserves the explanation and all ten numbered points", () => {
  assert.equal(corpus.length, 11);
  assert.equal(
    corpus.filter((node) => node.unitType === "general-explanation").length,
    1,
  );
  const points = corpus.filter((node) => node.unitType === "numbered-point");
  assert.equal(points.length, 10);
  assert.deepEqual(
    points.map((node) => node.unitNumber),
    Array.from({ length: 10 }, (_, index) => String(index + 1)),
  );

  for (const node of corpus) {
    assert.equal(
      node.instrumentId,
      "tw-executive-yuan-generative-ai-guidelines-2023",
    );
    assert.equal(node.language, "zh-Hant-TW");
    assert.equal(node.versionAsOf, "2026-07-20");
    assert.equal(node.issuedOn, "2023-10-03");
    assert.equal(node.status, "current-active-guidance");
    assert.equal(
      node.legalEffectStatus,
      "active-non-binding-public-sector-guidance",
    );
    assert.equal(node.textAvailability, "full-official-traditional-chinese");
    assert.ok(node.title.length > 0);
    assert.equal(node.titleStatus, "editorial-navigation-heading");
    assert.ok(node.summary.length > 0);
    assert.equal(node.summaryStatus, "editorial-high-level-summary");
    assert.ok(node.paragraphs.length > 0);
    assert.equal(node.fullText, node.paragraphs.join("\n\n"));
    assert.match(node.fullText, /[\u3400-\u9fff]/u);
    assert.equal(node.contentSha256, digest(node.fullText));
    assert.ok(node.coreConceptIds.length > 0);
    assert.equal(node.thematicRelevance.isRelevant, true);
    assert.equal(node.thematicRelevance.highlightEntireUnit, true);
    assert.equal(
      node.translationStatus,
      "complete-current-guidance-project-reference",
    );
    assert.equal(node.currentLanguageToggleEligible, true);
    const english = node.translations.en;
    assert.equal(english.language, "en");
    assert.equal(
      english.coverageStatus,
      "complete-current-guidance-project-reference",
    );
    assert.equal(english.officialStatus, "non-official-no-legal-effect");
    assert.equal(english.fullText, english.paragraphs.join("\n\n"));
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.equal(english.paragraphs.length, node.paragraphs.length);
    assert.equal(node.rights.license, "政府資料開放授權條款－第1版");
    assert.equal(node.rights.attributionRequired, true);
  }
});

test("Official risk, confidentiality, human-control, disclosure, compliance, and procurement anchors are intact", () => {
  const byNumber = new Map(
    corpus
      .filter((node) => node.unitType === "numbered-point")
      .map((node) => [node.unitNumber, node]),
  );
  const explanation = corpus[0];
  assert.match(explanation.fullText, /負責任及可信賴之態度/u);
  assert.match(explanation.fullText, /安全性、隱私性與資料治理、問責等原則/u);
  assert.match(explanation.fullText, /本參考指引共計十點如下/u);
  assert.match(byNumber.get("1").fullText, /國家安全、資訊安全、人權、隱私、倫理及法律等風險/u);
  assert.match(byNumber.get("2").fullText, /客觀且專業之最終判斷/u);
  assert.match(byNumber.get("2").fullText, /不得取代業務承辦人之自主思維/u);
  assert.equal(byNumber.get("3").paragraphs.length, 2);
  assert.match(byNumber.get("3").fullText, /製作機密文書.*禁止使用生成式AI/u);
  assert.match(byNumber.get("4").fullText, /個人及未經機關（構）同意公開之資訊/u);
  assert.match(byNumber.get("4").fullText, /封閉式地端部署/u);
  assert.match(byNumber.get("5").fullText, /不得以未經確認之產出內容直接作成行政行為/u);
  assert.match(byNumber.get("5").fullText, /公務決策之唯一依據/u);
  assert.match(byNumber.get("6").fullText, /應適當揭露/u);
  assert.match(byNumber.get("7").fullText, /資通安全、個人資料保護、著作權/u);
  assert.match(byNumber.get("8").fullText, /要求得標之法人、團體或個人注意本參考指引/u);
});

test("Manifest records the current 3 October 2023 dispatch and complete source coverage", () => {
  assert.equal(
    manifest.officialTitle,
    "行政院及所屬機關（構）使用生成式AI參考指引",
  );
  assert.equal(manifest.currentVersion.asOf, "2026-07-20");
  assert.equal(manifest.currentVersion.status, "active-current-official-guidance");
  assert.equal(manifest.currentVersion.issuedOn, "2023-10-03");
  assert.equal(
    manifest.currentVersion.dispatchNumber,
    "院授科會前字第1120059686號",
  );
  assert.equal(manifest.currentVersion.latestRevisionOn, null);
  assert.equal(manifest.currentVersion.futureRevisionTextIncluded, false);
  assert.match(manifest.currentVersion.revisionAuditConclusion, /single matching PDF\/ODT attachment pair/i);

  assert.equal(manifest.corpus.nodeCount, 11);
  assert.equal(manifest.corpus.generalExplanationNodeCount, 1);
  assert.equal(manifest.corpus.generalExplanationParagraphCount, 4);
  assert.equal(manifest.corpus.numberedPointCount, 10);
  assert.equal(manifest.corpus.numberedPointParagraphCount, 11);
  assert.equal(manifest.corpus.sourceBodyParagraphCount, 15);
  assert.equal(manifest.corpus.normalizedFullTextCharacterCount, 1305);
  assert.equal(manifest.corpus.completeSourceCoverageVerified, true);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((node) => node.fullText).join("\n\n")),
  );
  assert.equal(manifest.corpus.sourceBodySha256, manifest.corpus.contentSha256);
  assert.equal(
    manifest.sourceDocumentMetadata.sourceParagraphCountIncludingTitle,
    16,
  );
  assert.equal(
    manifest.sourceDocumentMetadata.odtCreationDate,
    "2023-10-30T06:32:00Z",
  );
  assert.equal(
    manifest.relatedLaterGuidance.title,
    "公部門人工智慧應用參考手冊",
  );
  assert.equal(manifest.relatedLaterGuidance.createdOn, "2025-12-17");
  assert.equal(
    manifest.relatedLaterGuidance.officialPageUpdatedOn,
    "2026-02-03",
  );
  assert.equal(
    manifest.relatedLaterGuidance.relationship,
    "separate-complementary-public-sector-AI-implementation-playbook",
  );
  assert.match(
    manifest.relatedLaterGuidance.supersessionStatus,
    /do not state.*amends, replaces, repeals, or supersedes/i,
  );
  assert.equal(manifest.relatedLaterGuidance.includedInCorpus, false);
});

test("Contextual press release is not misrepresented; project English is labeled nonofficial", async () => {
  assert.equal(
    manifest.translation.status,
    "complete-current-guidance-project-reference",
  );
  assert.equal(manifest.translation.officialStatus, "non-official-no-legal-effect");
  assert.equal(manifest.translation.bodyStored, true);
  assert.equal(manifest.translation.currentLanguageToggleEligible, true);
  assert.match(manifest.translation.officialContextSourceStatus, /draft/i);
  assert.match(manifest.translation.officialContextSourceStatus, /not a point-by-point or complete translation/i);

  const englishContext = await readFile(
    new URL(
      "source-snapshots/tw-genai-guidelines-ey-draft-english-context-2026-07-20.html",
      dataRoot,
    ),
    "utf8",
  );
  assert.match(englishContext, /Cabinet approves draft guidelines/i);
  assert.match(englishContext, /At Thursday's weekly Cabinet meeting/i);
  assert.ok(
    corpus.every(
      (node) =>
        node.translations.en.officialStatus === "non-official-no-legal-effect",
    ),
  );
});

test("NSTC open-data rights and attribution limits are recorded from the frozen official declaration", async () => {
  const rights = manifest.rights.primaryTraditionalChineseText;
  assert.match(rights.reuseStatus, /government-open-data-license-v1/);
  assert.equal(rights.license, "政府資料開放授權條款－第1版");
  assert.equal(rights.attributionRequired, true);
  assert.match(rights.scopeNote, /agency marks/i);
  assert.match(rights.scopeNote, /moral rights/i);

  const declaration = await readFile(
    new URL(
      "source-snapshots/tw-genai-guidelines-nstc-open-data-declaration-2026-07-20.html",
      dataRoot,
    ),
    "utf8",
  );
  assert.match(declaration, /政府資料開放授權條款-第1版/u);
  assert.match(declaration, /以無償、非專屬、得由使用者再授權之方式提供公眾使用/u);
  assert.match(declaration, /使用時應註明出處/u);
  assert.match(declaration, /不得惡意變更其相關資訊/u);
});

test("Every frozen official source and audit boundary matches its manifest SHA-256", async () => {
  assert.equal(manifest.sourceSnapshots.length, 8);
  for (const snapshot of manifest.sourceSnapshots) {
    const bytes = await readFile(
      new URL(snapshot.path.replace("data/v2/", ""), dataRoot),
    );
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const odt = manifest.sourceSnapshots.find(
    (snapshot) =>
      snapshot.role === "complete-current-official-Traditional-Chinese-source",
  );
  assert.equal(
    odt.sha256,
    "35261ef2c939eff5334dfeb5c258a5e8cbd1981accdae72b3ca3c2b65933e453",
  );
  const pdf = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "official-layout-equivalent-source",
  );
  assert.equal(
    pdf.sha256,
    "d61384ee42bf1f29a1479b45ed9ea26b9f76f9d65ada23930564ca9af9a15e55",
  );
  const laterPlaybook = manifest.sourceSnapshots.find(
    (snapshot) =>
      snapshot.role === "later-separate-guidance-supersession-boundary",
  );
  assert.equal(
    laterPlaybook.sha256,
    "857ce09b694229895f9a739b1046d5fcf2cac28a245f15541913a97c0c104735",
  );
});
