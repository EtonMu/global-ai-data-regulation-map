import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const [instruments, provisions] = await Promise.all([
  readFile(new URL("instruments.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("provisions.json", dataRoot), "utf8").then(JSON.parse),
]);

const instrument = instruments.find(
  (candidate) => candidate.id === "cn-cybersecurity-law",
);
const articles = provisions.filter(
  (provision) => provision.instrumentId === "cn-cybersecurity-law",
);

const chapterRanges = [
  [1, 15, "cn-csl-chapter-1", "Chapter I", "General Provisions"],
  [16, 22, "cn-csl-chapter-2", "Chapter II", "Cybersecurity Support and Promotion"],
  [23, 41, "cn-csl-chapter-3", "Chapter III", "Network Operations Security"],
  [42, 52, "cn-csl-chapter-4", "Chapter IV", "Network Information Security"],
  [53, 60, "cn-csl-chapter-5", "Chapter V", "Monitoring, Early Warning, and Emergency Response"],
  [61, 77, "cn-csl-chapter-6", "Chapter VI", "Legal Liability"],
  [78, 81, "cn-csl-chapter-7", "Chapter VII", "Supplementary Provisions"],
];

test("China Cybersecurity Law metadata identifies the current 2026-effective consolidation", () => {
  assert.ok(instrument);
  assert.equal(instrument.originalTitle, "中华人民共和国网络安全法");
  assert.equal(instrument.lifecycleStatus, "in-force-amended");
  assert.equal(instrument.dates.lastAmendedOn, "2025-10-28");
  assert.equal(instrument.dates.latestAmendmentEffectiveFrom, "2026-01-01");
  assert.deepEqual(instrument.coverage, {
    unit: "article",
    first: 1,
    last: 81,
    count: 81,
    completeness: "complete-current-consolidated-text",
  });
  assert.equal(
    instrument.textAvailability.mode,
    "official-original-full-corpus-stored-by-article",
  );
  assert.equal(instrument.textAvailability.stored, true);
  assert.equal(instrument.textAvailability.language, "zh-CN");
  assert.equal(new URL(instrument.source.url).hostname, "www.cac.gov.cn");
  assert.equal(
    new URL(instrument.amendmentSource.url).hostname,
    "www.npc.gov.cn",
  );
});

test("the stored CSL corpus is complete, structured, and translation-aligned", () => {
  assert.equal(articles.length, 81);
  assert.equal(
    articles.reduce((count, article) => count + article.paragraphs.length, 0),
    141,
  );
  assert.equal(new Set(articles.map((article) => article.title)).size, 81);

  articles.forEach((article, index) => {
    const articleNumber = index + 1;
    const chapter = chapterRanges.find(
      ([first, last]) => articleNumber >= first && articleNumber <= last,
    );

    assert.equal(article.id, `cn-csl-art-${articleNumber}`);
    assert.equal(article.locator, `Article ${articleNumber}`);
    assert.match(article.originalTitle, /^第.+条$/u);
    assert.notEqual(article.title, article.locator);
    assert.ok(article.title.length >= 5, `${article.id} needs a concise list title`);
    assert.equal(article.appliesFrom, "2026-01-01");
    assert.deepEqual(
      [article.chapter.id, article.chapter.label, article.chapter.title],
      chapter.slice(2),
    );
    assert.equal(article.fullText, article.paragraphs.join("\n\n"));
    assert.equal(article.translations.en.status, "reference");
    assert.match(article.translations.en.note, /not an official|non-official/i);
    assert.equal(
      article.translations.en.paragraphs.length,
      article.paragraphs.length,
    );
    assert.equal(
      article.translations.en.fullText,
      article.translations.en.paragraphs.join("\n\n"),
    );

    if (articleNumber >= 23 && articleNumber <= 32) {
      assert.equal(article.section.id, "cn-csl-chapter-3-section-1");
      assert.equal(article.section.title, "General Provisions");
    } else if (articleNumber >= 33 && articleNumber <= 41) {
      assert.equal(article.section.id, "cn-csl-chapter-3-section-2");
      assert.equal(
        article.section.title,
        "Operational Security of Critical Information Infrastructure",
      );
    } else {
      assert.equal(article.section, undefined);
    }
  });

  assert.match(articles[19].fullText, /人工智能基础理论研究/u);
  assert.match(articles[60].fullText, /二百万元以上一千万元以下罚款/u);
  assert.equal(articles[80].fullText, "本法自2017年6月1日起施行。");

  const corpusDigest = createHash("sha256")
    .update(
      articles.map((article) => article.fullText).join(
        "\n\n---ARTICLE---\n\n",
      ),
    )
    .digest("hex");
  assert.equal(
    corpusDigest,
    "446e6fba0dadd123ab924a95277c557b0f54517f6883973609f888df8762e454",
    "CSL source text changed; re-check the official consolidated publication before updating this digest",
  );
});
