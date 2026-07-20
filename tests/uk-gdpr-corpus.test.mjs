import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [articles, sourceAudits, conceptReviews] = await Promise.all([
  loadJson("uk-gdpr-articles.json"),
  loadJson("source-audit.json"),
  loadJson("provision-concepts.json"),
]);

const expectedNumbers =
  "1,2,3,4,4A,5,6,7,8,8ZA,8A,9,10,11,11A,12,12A.,13,14,15,16,17,18,19,20,21,22,22A,22B,22C,22D,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,44A,45,45A,45B,45C,46,47,47A,48,49,49A,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,84A,84B,84C,84D,85,86,86A,87,88,89,90,91,91A,92,93,94,95,96,97,98,99".split(
    ",",
  );

test("UK GDPR corpus preserves every current consolidated Article node", () => {
  assert.equal(articles.length, 120);
  assert.deepEqual(
    articles.map((article) => article.articleNumber),
    expectedNumbers,
  );
  assert.equal(new Set(articles.map((article) => article.id)).size, 120);

  for (const article of articles) {
    const slug = article.articleNumber
      .replace(/\.$/, "")
      .toLowerCase();
    assert.equal(article.id, `gb-uk-gdpr-art-${slug}`);
    assert.equal(article.instrumentId, "gb-uk-gdpr");
    assert.equal(article.label, `Article ${article.articleNumber}`);
    assert.ok(article.title.length > 0);
    assert.ok(article.paragraphs.length > 0);
    assert.equal(article.fullText, article.paragraphs.join("\n\n"));
    assert.equal(article.language, "en");
    assert.equal(
      article.textAvailability,
      "official-current-consolidated-text",
    );
    assert.equal(
      article.source,
      "https://www.legislation.gov.uk/eur/2016/679",
    );
    assert.equal(
      article.sourceFragment,
      `${article.source}/article/${article.articleNumber}`,
    );
    assert.equal(article.retrievedOn, "2026-07-20");
    assert.equal(article.versionAsOf, "2026-06-19");
    assert.equal(article.rights.reuseStatus, "open");
    assert.equal(article.rights.license, "Open Government Licence v3.0");
  }
});

test("DUAA 2025 insertions remain present in the current UK GDPR snapshot", () => {
  const byNumber = new Map(
    articles.map((article) => [article.articleNumber, article]),
  );
  assert.match(byNumber.get("4A").fullText, /Periods of Time Regulation/);
  assert.match(byNumber.get("8ZA").fullText, /verifying/);
  assert.match(byNumber.get("8A").fullText, /purpose limitation/);
  assert.match(byNumber.get("11A").title, /special categories of personal data/);
  assert.match(byNumber.get("11A").fullText, /prohibition in Article 9\(1\)/);
  assert.match(byNumber.get("12A.").fullText, /applicable time period/);
  assert.match(byNumber.get("22A").fullText, /meaningful human involvement/);
  assert.match(byNumber.get("22B").fullText, /Restrictions on automated decision-making|automated processing/);
  assert.match(byNumber.get("22C").fullText, /safeguards for the data subject/);
  assert.match(byNumber.get("22D").fullText, /meaningful human involvement/);
  assert.match(byNumber.get("44A").fullText, /third country or an international organisation/);
  assert.match(byNumber.get("45B").fullText, /data protection test/);
  assert.match(byNumber.get("84A").fullText, /scientific research or historical research/);
  assert.match(byNumber.get("84C").fullText, /appropriate safeguards/);
  assert.match(byNumber.get("91A").fullText, /UK GDPR regulations/);
});

test("UK GDPR source audit and concept review cover the complete import", () => {
  const audit = sourceAudits.find(
    (item) => item.instrumentId === "gb-uk-gdpr",
  );
  assert.equal(
    audit.reviewLevel,
    "complete-official-current-consolidated-article-corpus-and-anchor-review",
  );
  assert.equal(
    audit.localCoverage.mode,
    "complete-current-consolidated-article-corpus",
  );
  assert.equal(audit.localCoverage.localUnitCount, 120);

  const reviewById = new Map(
    conceptReviews.map((review) => [review.provisionId, review]),
  );
  for (const article of articles) {
    assert.ok(reviewById.has(article.id), article.id);
  }
  assert.ok(
    reviewById
      .get("gb-uk-gdpr-art-22c")
      .conceptIds.includes("human-oversight"),
  );
  for (const id of [
    "gb-uk-gdpr-art-4a",
    "gb-uk-gdpr-art-12a",
    "gb-uk-gdpr-art-91a",
    "gb-uk-gdpr-art-92",
    "gb-uk-gdpr-art-93",
    "gb-uk-gdpr-art-94",
    "gb-uk-gdpr-art-99",
  ]) {
    assert.equal(reviewById.get(id).relevance, "structural-context", id);
  }
});
