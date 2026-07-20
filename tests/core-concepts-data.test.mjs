import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);

async function loadJson(filename) {
  return JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
}

const [conceptThemes, concepts, provisions, gdprArticles, euAiActArticles] = await Promise.all([
  loadJson("concept-themes.json"),
  loadJson("concepts.json"),
  loadJson("provisions.json"),
  loadJson("gdpr-articles.json"),
  loadJson("eu-ai-act-articles.json"),
]);

const requiredFoundationIds = [
  "privacy-by-design-default",
  "data-minimization",
  "purpose-limitation",
  "lawfulness-consent-choice",
  "data-subject-rights",
  "fairness-nondiscrimination",
  "sensitive-data-protection",
  "retention-deletion-lifecycle",
  "privacy-enhancing-tech",
  "third-party-supply-chain",
  "continuous-assurance",
];

test("core concepts form an independent, ordered learning taxonomy", () => {
  const themes = new Set(conceptThemes.map((theme) => theme.id));
  const conceptIds = new Set(concepts.map((concept) => concept.id));

  assert.deepEqual(
    conceptThemes.map((theme) => theme.order),
    conceptThemes.map((_, index) => index + 1),
    "theme order must be stable and contiguous for sidebar grouping",
  );
  assert.equal(themes.size, conceptThemes.length);
  assert.equal(conceptIds.size, concepts.length);
  assert.ok(
    requiredFoundationIds.every((id) => conceptIds.has(id)),
    "the learning index must retain its foundational privacy and governance concepts",
  );
  assert.ok(
    concepts.every((concept) => themes.has(concept.theme)),
    "every core concept must resolve to a learning theme",
  );
  assert.ok(
    conceptThemes.every((theme) =>
      concepts.some((concept) => concept.theme === theme.id),
    ),
    "empty learning themes must not be exposed in the sidebar",
  );
});

test("core concept summaries remain sourced editorial orientation", () => {
  assert.ok(
    concepts.every(
      (concept) =>
        concept.summary.length >= 80 &&
        concept.sourceBasis.length > 0 &&
        concept.sourceBasis.every(
          (source) =>
            source.url.startsWith("https://") &&
            /^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn),
        ) &&
        concept.editorial.reviewStatus === "editorial-concept-summary" &&
        concept.editorial.note.includes("not an IAPP definition") &&
        concept.editorial.note.includes("legal conclusion"),
    ),
    "each concept must expose an original summary, dated sources, and an attribution caveat",
  );
});

test("each foundational concept has conservative provision-level evidence", () => {
  const conceptsWithProvisionEvidence = new Set(
    provisions.flatMap((provision) => provision.conceptIds),
  );

  for (const conceptId of requiredFoundationIds) {
    assert.ok(
      conceptsWithProvisionEvidence.has(conceptId),
      `${conceptId} must be supported by at least one reviewed provision record`,
    );
  }
});

test("curated EU Article overlays retain a matching official full-text record", () => {
  const officialArticlesById = new Map(
    [...gdprArticles, ...euAiActArticles].map((article) => [article.id, article]),
  );
  const curatedEuArticleOverlays = provisions.filter(
    (provision) =>
      provision.textAvailability.mode === "separate-official-import",
  );

  assert.ok(curatedEuArticleOverlays.length > 0);
  for (const overlay of curatedEuArticleOverlays) {
    const officialArticle = officialArticlesById.get(overlay.id);
    assert.ok(
      officialArticle,
      `${overlay.id} must resolve to the generated official Article corpus`,
    );
    assert.equal(officialArticle.textAvailability, "full");
    assert.ok(officialArticle.fullText.length >= 20);
    assert.ok(officialArticle.sourceFragment.startsWith("https://eur-lex.europa.eu/"));
  }
});

test("the public IAPP learning frameworks are represented without exam-frequency claims", () => {
  const sourceLabels = concepts.flatMap((concept) =>
    concept.sourceBasis.map((source) => source.label),
  );
  for (const framework of ["CIPP/E", "CIPM", "CIPT", "AIGP"]) {
    assert.ok(
      sourceLabels.some((label) => label.includes(`IAPP ${framework}`)),
      `${framework} must be represented in the public learning source basis`,
    );
  }
  assert.ok(
    concepts.every(
      (concept) => !/exam (?:weight|frequency|question)/i.test(concept.summary),
    ),
    "editorial summaries must not imply exam frequency or weighting",
  );
});
