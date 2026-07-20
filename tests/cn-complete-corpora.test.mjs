import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [instruments, provisions, sourceAudits, pipl, networkData, genAi] =
  await Promise.all([
    loadJson("instruments.json"),
    loadJson("provisions.json"),
    loadJson("source-audit.json"),
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
      assert.match(article.summary, /No English translation|not a translation/i);
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

test("selected curated metadata and English reference translations remain aligned", () => {
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
  assert.equal(pipl[0].translations, undefined);
  assert.equal(networkData[0].translations, undefined);
  assert.equal(genAi[0].translations, undefined);
});

test("instrument and source-audit coverage declarations match generated corpora", () => {
  const instrumentById = new Map(instruments.map((item) => [item.id, item]));
  const auditById = new Map(sourceAudits.map((item) => [item.instrumentId, item]));
  for (const definition of corpusDefinitions) {
    const instrument = instrumentById.get(definition.instrumentId);
    assert.equal(instrument.coverage.unit, "article");
    assert.equal(instrument.coverage.first, 1);
    assert.equal(instrument.coverage.last, definition.count);
    assert.equal(instrument.coverage.count, definition.count);
    assert.equal(instrument.textAvailability.mode, "separate-official-original-import");

    const audit = auditById.get(definition.instrumentId);
    assert.equal(audit.localCoverage.mode, "complete-official-original-article-corpus");
    assert.equal(audit.localCoverage.localUnitCount, definition.count);
    assert.equal(
      audit.englishAvailability.coverage.totalUnitCount,
      definition.count,
    );
    assert.equal(
      audit.englishAvailability.coverage.translatedUnitCount,
      definition.translatedArticles.length,
    );
  }
});
