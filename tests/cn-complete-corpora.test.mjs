import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [instruments, provisions, manifest, pipl, networkData, genAi] =
  await Promise.all([
    loadJson("instruments.json"),
    loadJson("provisions.json"),
    loadJson("cn-english-corpus-manifest.json"),
    loadJson("cn-pipl-articles.json"),
    loadJson("cn-network-data-regulations-articles.json"),
    loadJson("cn-generative-ai-measures-articles.json"),
  ]);

const corpusDefinitions = [
  {
    instrumentId: "cn-pipl",
    articles: pipl,
    count: 74,
    idPrefix: "cn-pipl-art-",
    source: "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    firstText: "为了保护个人信息权益",
    lastText: "本法自2021年11月1日起施行。",
    translatedArticles: [24, 38, 51, 55, 57],
    englishStatus: "government-published-reference",
    englishCoverageStatus: "complete-current",
    englishVersionAsOf: "2021-11-01",
    englishSourceHostname: "en.npc.gov.cn",
  },
  {
    instrumentId: "cn-network-data-regulations",
    articles: networkData,
    count: 64,
    idPrefix: "cn-network-data-reg-art-",
    source: "https://app.www.gov.cn/govdata/gov/202409/30/520076/article.html",
    firstText: "为了规范网络数据处理活动",
    lastText: "本条例自2025年1月1日起施行。",
    translatedArticles: [9, 35, 36, 37, 38, 44],
    englishStatus: "government-published-reference",
    englishCoverageStatus: "complete-current",
    englishVersionAsOf: "2025-01-01",
    englishSourceHostname: "en.moj.gov.cn",
  },
  {
    instrumentId: "cn-generative-ai-measures",
    articles: genAi,
    count: 24,
    idPrefix: "cn-genai-art-",
    source: "https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm",
    firstText: "为了促进生成式人工智能健康发展",
    lastText: "本办法自2023年8月15日起施行。",
    translatedArticles: [4, 7, 17],
    englishStatus: "public-domain-government-reference",
    englishCoverageStatus: "complete-versioned-reference",
    englishVersionAsOf: "2023-08-15",
    englishSourceHostname: "www.airuniversity.af.edu",
  },
];

test("complete Chinese corpora retain sequential official Articles and provenance", () => {
  for (const definition of corpusDefinitions) {
    assert.equal(definition.articles.length, definition.count);
    definition.articles.forEach((article, index) => {
      const number = index + 1;
      assert.equal(article.id, `${definition.idPrefix}${number}`);
      assert.equal(article.instrumentId, definition.instrumentId);
      assert.equal(article.articleNumber, String(number));
      assert.equal(article.label, `Article ${number}`);
      assert.match(article.originalTitle, /^第.+条$/u);
      assert.equal(article.language, "zh-CN");
      assert.equal(article.textAvailability, "full");
      assert.equal(article.source, definition.source);
      assert.equal(article.sourceFragment, definition.source);
      assert.equal(article.retrievedOn, "2026-07-20");
      assert.ok(article.paragraphs.length > 0);
      assert.equal(article.fullText, article.paragraphs.join("\n\n"));
      assert.match(article.fullText, /[\u3400-\u9fff]/u);
      assert.equal(
        article.contentSha256,
        createHash("sha256").update(article.fullText, "utf8").digest("hex"),
      );
      assert.doesNotMatch(article.summary, /No English translation|coverage notice/i);
      assert.ok(article.chapter.id.startsWith(`${definition.instrumentId}-chapter-`));
      assert.equal(article.sourceVersion.effectiveFrom, article.appliesFrom);
    });
    assert.ok(definition.articles[0].fullText.startsWith(definition.firstText));
    assert.equal(definition.articles.at(-1).fullText, definition.lastText);
  }
});

test("official source wording is retained at sensitive verification anchors", () => {
  assert.match(pipl[23].fullText, /有权要求个人信息处理者予以说明/u);
  assert.match(pipl[54].fullText, /事前进行个人信息保护影响评估/u);
  assert.match(networkData[18].fullText, /生成式人工智能服务/u);
  assert.match(
    networkData[34].fullText,
    /（七）紧急情况下为保护自然人的生命健康和财产安全，确需向境外提供个人信息;/u,
  );
  assert.match(networkData[43].fullText, /个人信息保护社会责任报告/u);
  assert.match(genAi[1].fullText, /未向境内公众提供生成式人工智能服务的，不适用本办法/u);
  assert.match(genAi[10].fullText, /不得收集非必要个人信息/u);
  assert.match(genAi[16].fullText, /安全评估/u);
});

test("all Chinese corpus Articles have complete, versioned English reference text", () => {
  for (const definition of corpusDefinitions) {
    for (const article of definition.articles) {
      const translation = article.translations?.en;
      assert.ok(translation, `${article.id} must have English reference text`);
      assert.equal(translation.language, "en");
      assert.equal(translation.status, definition.englishStatus);
      assert.equal(translation.coverageStatus, definition.englishCoverageStatus);
      assert.equal(translation.versionAsOf, definition.englishVersionAsOf);
      assert.ok(translation.versionLabel.length > 20);
      assert.match(translation.authorityNote, /Chinese text controls/i);
      assert.ok(translation.paragraphs.length > 0);
      assert.ok(translation.paragraphs.every((paragraph) => paragraph.trim().length > 0));
      assert.equal(translation.fullText, translation.paragraphs.join("\n\n"));
      assert.match(translation.fullText, /[A-Za-z]/u);
      assert.doesNotMatch(
        translation.fullText,
        /This article is mapped to|complete official .* wording is available|orientation is not a translation/i,
      );
      assert.equal(
        translation.contentSha256,
        createHash("sha256").update(translation.fullText, "utf8").digest("hex"),
      );
      assert.equal(new URL(translation.source.url).hostname, definition.englishSourceHostname);
      assert.equal(translation.source.accessedOn, "2026-07-20");
      assert.equal(translation.rights.redistributable, true);
      assert.ok(translation.rights.basis.length > 40);
      assert.ok(translation.rights.attribution.length > 3);
    }
  }
});

test("pagination and structural headings do not leak into English Article bodies", () => {
  const structuralOnlyLines = /^(?:Chapter\s+[IVX]+|Section\s+\d+|General Provisions|General Rules|Personal Information by State Organs|Legal Liability|Supplementary Provisions)$/i;
  for (const definition of corpusDefinitions) {
    for (const article of definition.articles) {
      for (const paragraph of article.translations.en.paragraphs) {
        assert.doesNotMatch(paragraph, structuralOnlyLines, article.id);
      }
      assert.doesNotMatch(
        article.translations.en.fullText,
        /SNAPSHOT PAGE BOUNDARY|enpcontent|displaypagenum|\f/u,
        article.id,
      );
    }
  }
  assert.equal(pipl[31].translations.en.paragraphs.length, 1);
  assert.doesNotMatch(
    pipl[31].translations.en.fullText,
    /Special Provisions on the Processing of|Personal Information by State Organs/i,
  );
});

test("Ministry of Justice PDF paragraph and list structure is preserved", () => {
  assert.equal(
    networkData.reduce(
      (count, article) => count + article.translations.en.paragraphs.length,
      0,
    ),
    150,
  );
  assert.equal(
    networkData.filter(
      (article) => article.translations.en.paragraphs.length > 1,
    ).length,
    22,
  );
  assert.equal(networkData[1].translations.en.paragraphs.length, 3);
  assert.equal(networkData[7].translations.en.paragraphs.length, 2);
  assert.equal(networkData[11].translations.en.paragraphs.length, 3);
  assert.equal(networkData[32].translations.en.paragraphs.length, 11);
  assert.equal(networkData[61].translations.en.paragraphs.length, 9);
  assert.match(networkData[32].translations.en.fullText, /\n\n\(1\) basic information/);
  assert.match(networkData[61].translations.en.fullText, /\n\n\(8\) “large online platform”/);
  assert.doesNotMatch(
    networkData[61].translations.en.paragraphs[8],
    /\n/u,
    "visual PDF line wraps must be normalized within a statutory list item",
  );
});

test("selected curated concept overlays remain aligned with complete corpora", () => {
  const seedById = new Map(provisions.map((provision) => [provision.id, provision]));
  for (const definition of corpusDefinitions) {
    for (const number of definition.translatedArticles) {
      const generated = definition.articles[number - 1];
      const seed = seedById.get(generated.id);
      assert.ok(seed, `${generated.id} must retain its curated overlay`);
      assert.equal(seed.fullText, generated.fullText);
      assert.ok(seed.conceptIds.length > 0);
      assert.equal(seed.translations.en.status, "reference");
      assert.match(seed.translations.en.note, /reference|not an official|non-official/i);
      assert.equal(
        seed.translations.en.fullText,
        seed.translations.en.paragraphs.join("\n\n"),
      );
    }
  }
});

test("instrument and English-corpus manifest coverage declarations match generated corpora", () => {
  const instrumentById = new Map(instruments.map((item) => [item.id, item]));
  const manifestById = new Map(
    manifest.instruments.map((item) => [item.instrumentId, item]),
  );
  for (const definition of corpusDefinitions) {
    const instrument = instrumentById.get(definition.instrumentId);
    assert.equal(instrument.coverage.unit, "article");
    assert.equal(instrument.coverage.first, 1);
    assert.equal(instrument.coverage.last, definition.count);
    assert.equal(instrument.coverage.count, definition.count);
    assert.match(
      instrument.textAvailability.mode,
      /separate-complete-official-original-and-(?:government|public-domain)-English-reference-import/,
    );

    const entry = manifestById.get(definition.instrumentId);
    assert.ok(entry, `${definition.instrumentId} must appear in the manifest`);
    assert.equal(entry.currentVersion.currentVersionAligned, true);
    assert.equal(entry.corpus.unitCount, definition.count);
    assert.equal(entry.corpus.originalLanguageUnitCount, definition.count);
    assert.equal(entry.corpus.englishUnitCount, definition.count);
    assert.equal(entry.corpus.coverageStatus, definition.englishCoverageStatus);
    assert.equal(entry.translation.status, definition.englishStatus);
    assert.equal(entry.translation.coAuthentic, false);
    assert.match(entry.translation.recommendedUiLabel, /CHINESE CONTROLS/);
    assert.equal(entry.rights.redistributable, true);
  }
});

test("Chinese English-source snapshots match the manifest's SHA-256 records", async () => {
  const repositoryRoot = new URL("../../", dataRoot);
  for (const entry of manifest.instruments) {
    for (const snapshot of entry.sourceSnapshots ?? []) {
      const bytes = await readFile(new URL(snapshot.path, repositoryRoot));
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        snapshot.sha256,
        snapshot.path,
      );
    }
  }
});

test("generated Chinese corpus files match the manifest's SHA-256 records", async () => {
  const repositoryRoot = new URL("../../", dataRoot);
  for (const entry of manifest.instruments.filter((item) => item.corpus.fileSha256)) {
    const bytes = await readFile(new URL(entry.corpus.path, repositoryRoot));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      entry.corpus.fileSha256,
      entry.corpus.path,
    );
  }
});

test("current 2026 Cybersecurity Law English coverage is explicitly editorial", () => {
  const csl = manifest.instruments.find(
    (entry) => entry.instrumentId === "cn-cybersecurity-law",
  );
  assert.ok(csl);
  assert.equal(csl.currentVersion.versionAsOf, "2026-01-01");
  assert.equal(csl.corpus.unitCount, 81);
  assert.equal(csl.corpus.englishUnitCount, 81);
  assert.equal(
    csl.corpus.coverageStatus,
    "complete-current-project-reference",
  );
  const cslOriginalText = provisions
    .filter((provision) => provision.instrumentId === "cn-cybersecurity-law")
    .map((provision) => provision.fullText)
    .join("\n\n");
  assert.equal(
    createHash("sha256").update(cslOriginalText, "utf8").digest("hex"),
    csl.corpus.selectedOriginalFullTextSha256,
  );
  assert.equal(csl.translation.status, "project-authored-editorial-reference");
  assert.equal(csl.translation.governmentPublishedCurrentEnglishLocated, false);
  assert.match(csl.translation.versionBoundary, /pre-amendment/i);
  assert.match(csl.translation.recommendedUiLabel, /NOT OFFICIAL/);
});
