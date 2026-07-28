import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);

async function load(filename) {
  return JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
}

const [articles, annexes, recitals] = await Promise.all([
  load("eu-ai-act-articles.json"),
  load("eu-ai-act-annexes.json"),
  load("eu-ai-act-recitals.json"),
]);

const baseSource = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng";
const amendingSource = "https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng";
const amendmentFragment = `${amendingSource}#art_1`;

const expectedArticleNumbers = [
  ...Array.from({ length: 4 }, (_, index) => String(index + 1)),
  "4a",
  ...Array.from({ length: 56 }, (_, index) => String(index + 5)),
  "60a",
  ...Array.from({ length: 15 }, (_, index) => String(index + 61)),
  "75a",
  "75b",
  "75c",
  "75d",
  ...Array.from({ length: 38 }, (_, index) => String(index + 76)),
];

const amendedArticleNumbers = new Set([
  "1",
  "2",
  "3",
  "4",
  "4a",
  "5",
  "6",
  "10",
  "11",
  "17",
  "25",
  "27",
  "28",
  "29",
  "30",
  "40",
  "42",
  "43",
  "50",
  "56",
  "57",
  "58",
  "60",
  "60a",
  "63",
  "64",
  "69",
  "70",
  "72",
  "75",
  "75a",
  "75b",
  "75c",
  "75d",
  "76",
  "77",
  "95",
  "96",
  "97",
  "99",
  "111",
  "113",
]);

const insertedArticleNumbers = new Set(["4a", "60a", "75a", "75b", "75c", "75d"]);

test("EU AI Act Article corpus follows the 27 July 2026 legal order", () => {
  assert.equal(articles.length, 119);
  assert.deepEqual(
    articles.map((article) => article.articleNumber),
    expectedArticleNumbers,
  );
  assert.equal(new Set(articles.map((article) => article.id)).size, 119);

  for (const article of articles) {
    assert.equal(article.id, `eu-ai-act-art-${article.articleNumber}`);
    assert.equal(article.fullText, article.paragraphs.join("\n\n"));
    assert.equal(article.retrievedOn, "2026-07-28");
    assert.equal(article.language, "en");
    assert.equal(article.textAvailability, "full");
    if (amendedArticleNumbers.has(article.articleNumber)) {
      assert.doesNotMatch(
        article.fullText,
        /is replaced by the following|the following (?:point|paragraph|Article) is (?:added|inserted)|is amended as follows/i,
      );
    }

    if (amendedArticleNumbers.has(article.articleNumber)) {
      assert.equal(article.consolidatedAsOf, "2026-07-27");
      assert.equal(article.amendmentEffectiveFrom, "2026-07-27");
      assert.equal(article.amendingSource, amendmentFragment);
    } else {
      assert.equal(article.amendingSource, undefined);
    }

    if (insertedArticleNumbers.has(article.articleNumber)) {
      assert.equal(article.source, amendingSource);
      assert.equal(article.sourceFragment, amendmentFragment);
      assert.equal(article.introducedBy, "Regulation (EU) 2026/1744, Article 1");
    } else {
      assert.equal(article.source, baseSource);
      assert.equal(article.sourceFragment, `${baseSource}#art_${article.articleNumber}`);
    }
  }
});

test("EU AI Act amendment anchors contain operative 2026 wording", () => {
  const byNumber = new Map(articles.map((article) => [article.articleNumber, article]));
  assert.match(byNumber.get("4a").fullText, /bias detection and correction/);
  assert.match(byNumber.get("5").fullText, /\(ba\).*intimate parts/s);
  assert.doesNotMatch(byNumber.get("10").fullText, /^5\./m);
  assert.match(byNumber.get("60a").fullText, /Section B of Annex I/);
  assert.match(byNumber.get("75a").fullText, /all the powers of a market surveillance authority/);
  assert.match(byNumber.get("75d").fullText, /rights of defence and of access to the file/);
  assert.equal(
    byNumber.get("75").title,
    "Market surveillance and control of AI systems and mutual assistance",
  );
  assert.equal(
    byNumber.get("77").title,
    "Powers of authorities protecting fundamental rights and cooperation with market surveillance authorities",
  );
  assert.match(byNumber.get("113").fullText, /2 December 2027/);
  assert.match(byNumber.get("113").fullText, /2 August 2028/);
  assert.match(
    byNumber.get("113").fullText,
    /Articles 102 to 110 shall apply from 27 July 2026\.$/,
  );
});

test("EU AI Act Articles preserve amended provision-level application layers", () => {
  const counts = Object.groupBy(
    articles,
    (article) => article.legalEffectStatus,
  );
  assert.equal(counts["current-applicable"].length, 43);
  assert.equal(counts["partially-applicable"].length, 2);
  assert.equal(counts["in-force-not-yet-applicable"].length, 74);

  const byNumber = new Map(
    articles.map((article) => [article.articleNumber, article]),
  );
  assert.deepEqual(
    byNumber
      .get("6")
      .applicability.applicationSchedule.map((stage) => stage.appliesFrom),
    ["2026-08-02", "2027-12-02", "2028-08-02"],
  );
  assert.equal(byNumber.get("102").appliesFrom, "2026-07-27");
  assert.equal(
    byNumber.get("75a").legalEffectStatus,
    "in-force-not-yet-applicable",
  );
});

test("all fourteen current Annexes are stored with official snapshot provenance", () => {
  const expectedNumbers = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
  ];
  assert.deepEqual(annexes.map((annex) => annex.annexNumber), expectedNumbers);
  assert.equal(new Set(annexes.map((annex) => annex.id)).size, 14);

  for (const annex of annexes) {
    assert.equal(annex.id, `eu-ai-act-annex-${annex.annexNumber.toLowerCase()}`);
    assert.equal(annex.instrumentId, "eu-ai-act");
    assert.equal(annex.provisionType, "annex");
    assert.equal(annex.fullText, annex.paragraphs.join("\n\n"));
    assert.ok(annex.paragraphs.length > 0);
    assert.equal(annex.retrievedOn, "2026-07-28");
    assert.equal(annex.consolidatedAsOf, "2026-07-27");
    assert.equal(
      annex.sourceSnapshotHashes.baseOfficialXhtmlSha256,
      "8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a",
    );
    assert.equal(
      annex.sourceSnapshotHashes.amendingOfficialXhtmlSha256,
      "9d754652b867722807e4219c85912ce354233e58a1b4eb8c7752b4d1922993db",
    );
  }
});

test("Annex I, VIII and XIV apply only the enacted 2026 operations", () => {
  const byNumber = new Map(annexes.map((annex) => [annex.annexNumber, annex]));
  const annexI = byNumber.get("I");
  const sectionAEnd = annexI.paragraphs.findIndex((block) => block.startsWith("Section B."));
  const sectionA = annexI.paragraphs.slice(0, sectionAEnd);
  assert.equal(sectionA.some((block) => /^1\.\s/.test(block)), false);
  assert.match(annexI.fullText, /^21\. Regulation \(EU\) 2023\/1230/m);

  const annexVIII = byNumber.get("VIII");
  const sectionBStart = annexVIII.paragraphs.findIndex((block) => block.startsWith("Section B"));
  const sectionCEnd = annexVIII.paragraphs.findIndex((block) => block.startsWith("Section C"));
  const sectionB = annexVIII.paragraphs.slice(sectionBStart, sectionCEnd);
  assert.equal(sectionB.some((block) => /^7\.\s/.test(block)), false);
  assert.equal(sectionB.some((block) => /^9\.\s/.test(block)), false);
  assert.equal(sectionB.some((block) => /^8\.\s/.test(block)), true);

  const annexXIV = byNumber.get("XIV");
  for (const code of [
    "AIP 0102",
    "AIP 0112",
    "AIB 0201",
    "AIB 0203",
    "AIH 0101",
    "AIH 0205",
    "AIH 0301",
    "AIH 0401",
  ]) {
    assert.match(annexXIV.fullText, new RegExp(`^${code}\\b`, "m"));
  }
  assert.equal(annexXIV.source, amendingSource);
  assert.equal(annexXIV.sourceFragment, amendmentFragment);
});

test("180 enactment Recitals remain non-operative context nodes", () => {
  assert.equal(recitals.length, 180);
  assert.deepEqual(
    recitals.map((recital) => recital.recitalNumber),
    Array.from({ length: 180 }, (_, index) => String(index + 1)),
  );
  assert.equal(new Set(recitals.map((recital) => recital.id)).size, 180);

  for (const recital of recitals) {
    assert.equal(recital.id, `eu-ai-act-recital-${recital.recitalNumber}`);
    assert.equal(recital.provisionType, "recital");
    assert.equal(recital.fullText, recital.paragraphs.join("\n\n"));
    assert.match(recital.fullText, new RegExp(`^\\(${recital.recitalNumber}\\)\\s`));
    assert.equal(recital.legalEffectStatus, "non-operative-context-only");
    assert.equal(recital.researchTreatment, "explanatory-context-only");
    assert.equal(recital.substantiveConceptMetricEligible, false);
    assert.equal(recital.source, baseSource);
    assert.equal(recital.sourceFragment, `${baseSource}#rct_${recital.recitalNumber}`);
    assert.equal(
      recital.sourceSnapshotSha256,
      "8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a",
    );
    assert.match(recital.documentVersionBoundary, /are not merged into the 180 Recitals/);
  }

  assert.match(recitals[0].fullText, /uniform legal framework/);
  assert.match(recitals.at(-1).fullText, /joint opinion on 18 June 2021/);
});
