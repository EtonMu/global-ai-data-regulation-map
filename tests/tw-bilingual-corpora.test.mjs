import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [aiAct, pdpa] = await Promise.all([
  loadJson("tw-ai-basic-act-2026-articles.json"),
  loadJson("tw-personal-data-protection-act-articles.json"),
]);

const pdpaIdentifiers = [
  "1",
  "1-1",
  "1-2",
  ...Array.from({ length: 19 }, (_, index) => String(index + 2)),
  "20-1",
  "21",
  "21-1",
  "21-2",
  "21-3",
  "21-4",
  "21-5",
  ...Array.from({ length: 30 }, (_, index) => String(index + 22)),
  "51-1",
  "52",
  "53",
  "53-1",
  "54",
  "55",
  "56",
];

const digest = (value) =>
  createHash("sha256").update(value, "utf8").digest("hex");

function assertBilingualArticle(article, instrumentId, idPrefix) {
  assert.equal(article.instrumentId, instrumentId);
  assert.equal(article.id, `${idPrefix}${article.articleNumber}`);
  assert.equal(article.label, `Article ${article.articleNumber}`);
  assert.equal(article.language, "zh-Hant-TW");
  assert.match(article.originalTitle, /^第\s+[0-9]+(?:-[0-9]+)?\s+條$/u);
  assert.ok(article.paragraphs.length > 0);
  assert.equal(article.fullText, article.paragraphs.join("\n\n"));
  assert.match(article.fullText, /[\u3400-\u9fff]/u);
  assert.equal(article.contentSha256, digest(article.fullText));

  const english = article.translations.en;
  assert.equal(english.status, "official-reference-translation");
  assert.equal(english.language, "en");
  assert.ok(english.paragraphs.length > 0);
  assert.equal(english.fullText, english.paragraphs.join("\n\n"));
  assert.match(english.fullText, /[A-Za-z]/u);
  assert.equal(english.contentSha256, digest(english.fullText));
  assert.match(english.authorityNote, /Traditional Chinese text controls/i);

  assert.equal(article.alignment.originalUnitCount, article.paragraphs.length);
  assert.equal(article.alignment.englishUnitCount, english.paragraphs.length);
  if (article.alignment.level === "paragraph") {
    assert.equal(article.paragraphs.length, english.paragraphs.length);
  } else {
    assert.equal(article.alignment.level, "article");
    assert.notEqual(article.paragraphs.length, english.paragraphs.length);
  }
}

test("Taiwan AI Basic Act corpus contains exactly 20 official bilingual Articles", () => {
  assert.equal(aiAct.length, 20);
  assert.deepEqual(
    aiAct.map((article) => article.articleNumber),
    Array.from({ length: 20 }, (_, index) => String(index + 1)),
  );
  for (const article of aiAct) {
    assertBilingualArticle(
      article,
      "tw-ai-basic-act-2026",
      "tw-ai-basic-act-2026-art-",
    );
    assert.equal(article.legalEffectStatus, "in-force");
    assert.equal(article.appliesFrom, "2026-01-14");
    assert.equal(
      article.source,
      "https://law.nstc.gov.tw/LawContent.aspx?id=GL000592&kw=",
    );
    assert.equal(
      article.translations.en.source,
      "https://law.nstc.gov.tw/EngLawContent.aspx?id=10099&lan=E",
    );
  }
  assert.equal(
    aiAct.filter((article) => article.alignment.level === "paragraph").length,
    10,
  );
  assert.equal(
    aiAct.filter((article) => article.alignment.level === "article").length,
    10,
  );
});

test("Taiwan AI Basic Act retains official bilingual verification anchors", () => {
  assert.match(aiAct[3].fullText, /七、問責：/u);
  assert.match(aiAct[3].translations.en.fullText, /7\. Accountability:/u);
  assert.match(aiAct[13].fullText, /個人資料保護納入預設及設計/u);
  assert.match(
    aiAct[13].translations.en.fullText,
    /personal data protection by design and by default/i,
  );
  assert.equal(aiAct[19].fullText, "本法自公布之日起施行。");
  assert.equal(
    aiAct[19].translations.en.fullText,
    "This Act shall take effect on the date of its promulgation.",
  );
});

test("Taiwan PDPA corpus contains all 66 official bilingual Article nodes", () => {
  assert.equal(pdpa.length, 66);
  assert.deepEqual(
    pdpa.map((article) => article.articleNumber),
    pdpaIdentifiers,
  );
  for (const article of pdpa) {
    assertBilingualArticle(
      article,
      "tw-personal-data-protection-act",
      "tw-personal-data-protection-act-art-",
    );
    assert.equal(article.alignment.level, "paragraph");
    assert.equal(
      article.source,
      "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021",
    );
    assert.equal(
      article.translations.en.source,
      "https://law.moj.gov.tw/ENG/LawClass/LawAll.aspx?pcode=I0050021",
    );
    assert.equal(article.sourceVersion.latestAmendedOn, "2025-11-11");
  }
});

test("PDPA applicability metadata separates current law from uncommenced text", () => {
  const byStatus = Map.groupBy(pdpa, (article) => article.legalEffectStatus);
  assert.equal(byStatus.get("in-force").length, 40);
  assert.equal(byStatus.get("promulgated-amendment-not-in-force").length, 15);
  assert.equal(
    byStatus.get("promulgated-amended-provision-not-in-force").length,
    1,
  );
  assert.equal(byStatus.get("promulgated-new-provision-not-in-force").length, 9);
  assert.equal(byStatus.get("promulgated-deletion-not-in-force").length, 1);

  const future = pdpa.filter((article) => article.legalEffectStatus !== "in-force");
  assert.equal(future.length, 26);
  for (const article of future) {
    assert.equal(article.appliesFrom, null);
    assert.equal(article.applicability.promulgatedOn, "2025-11-11");
    assert.match(
      article.applicability.commencementCondition,
      /determined by the Executive Yuan/i,
    );
  }

  const priorVersionStillEffective = future.filter(
    (article) => article.currentEffectiveVersion,
  );
  assert.equal(priorVersionStillEffective.length, 16);
  for (const article of priorVersionStillEffective) {
    const current = article.currentEffectiveVersion;
    assert.equal(current.language, "zh-Hant-TW");
    assert.ok(current.fullText.length > 0);
    assert.equal(current.contentSha256, digest(current.fullText));
    assert.match(current.source, /LawOldVer\.aspx/);
    assert.match(current.englishTranslationAvailability, /No official old-version/i);
  }

  const article1_1 = pdpa.find((article) => article.articleNumber === "1-1");
  assert.equal(article1_1.currentEffectiveVersion, null);
  assert.match(article1_1.applicability.historyNote, /has not entered into force/i);

  const article27 = pdpa.find((article) => article.articleNumber === "27");
  assert.equal(article27.fullText, "（刪除）");
  assert.notEqual(article27.currentEffectiveVersion.fullText, "（刪除）");
  assert.match(article27.currentEffectiveVersion.fullText, /適當之安全措施/u);

  const article28 = pdpa.find((article) => article.articleNumber === "28");
  assert.equal(article28.legalEffectStatus, "in-force");
  assert.equal(article28.applicability.displayedVersion, "current-effective-text");
  assert.equal(article28.currentEffectiveVersion, null);
});

test("PDPA retains official future and current-text verification anchors", () => {
  const byNumber = new Map(pdpa.map((article) => [article.articleNumber, article]));
  assert.match(byNumber.get("12").fullText, /應通報下列機關/u);
  assert.match(byNumber.get("12").currentEffectiveVersion.fullText, /以適當方式通知當事人/u);
  assert.match(byNumber.get("20-1").fullText, /安全維護事項/u);
  assert.equal(
    byNumber.get("20-1").legalEffectStatus,
    "promulgated-new-provision-not-in-force",
  );
  assert.match(byNumber.get("21-5").translations.en.fullText, /intelligence agencies/i);
  assert.match(byNumber.get("56").fullText, /第四十八條，自公布日施行/u);
});
