import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const audit = await loadJson("foreign-english-corpus-audit.json");
const auditByInstrument = new Map(
  audit.instruments.map((entry) => [entry.instrumentId, entry]),
);

const corpusCache = new Map();
async function corpus(filename) {
  if (!corpusCache.has(filename)) corpusCache.set(filename, await loadJson(filename));
  return corpusCache.get(filename);
}

function assertCompleteEnglishTranslation(translation) {
  assert.ok(translation);
  assert.equal(translation.language, "en");
  assert.ok(translation.fullText.length > 0);
  assert.equal(translation.fullText, translation.paragraphs.join("\n\n"));
  assert.match(translation.coverageStatus, /^complete-/);
  assert.match(translation.versionAsOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(translation.versionLabel.length > 10);
  assert.ok(translation.note.length > 20);
  assert.ok(translation.authorityNote.length > 20);
  assert.match(translation.source, /^https:\/\//);
  assert.ok(translation.rights);
  assert.match(translation.rights.reuseStatus, /government|official|project-authored/);
}

test("foreign-English audit manifest has exact corpus counts", async () => {
  assert.equal(audit.schemaVersion, "1.0");
  assert.equal(audit.reviewedOn, "2026-07-20");
  assert.equal(audit.instruments.length, 15);
  for (const entry of audit.instruments) {
    const units = await corpus(entry.corpus);
    assert.equal(
      units.length,
      entry.unitCount,
      `${entry.instrumentId} manifest count drifted`,
    );
  }
});

test("LGPD has complete current English with a disclosed 2026 amendment boundary", async () => {
  const units = await corpus("brazil-lgpd-articles.json");
  assert.equal(units.length, 80);
  const official = units.filter(
    (unit) =>
      unit.translations.en.coverageStatus ===
      "complete-current-wording-official-reference-translation",
  );
  const project = units.filter(
    (unit) =>
      unit.translations.en.coverageStatus ===
      "complete-current-project-reference-translation",
  );
  assert.equal(official.length, 77);
  assert.deepEqual(
    project.map((unit) => unit.articleNumber),
    ["5", "55-A", "55-C"],
  );
  for (const unit of units) assertCompleteEnglishTranslation(unit.translations.en);

  for (const unit of project) {
    const historical = unit.translations.en.historicalOfficialReference;
    assert.equal(
      historical.coverageStatus,
      "complete-superseded-official-reference-translation",
    );
    assert.equal(historical.fullText, historical.paragraphs.join("\n\n"));
    assert.notEqual(historical.fullText, unit.translations.en.fullText);
    assert.match(unit.translations.en.authorityNote, /Portuguese consolidation controls/i);
  }
  assert.match(
    project.find((unit) => unit.articleNumber === "55-A").translations.en.fullText,
    /National Data Protection Agency[\s\S]*functional, technical, decision-making, administrative and financial autonomy/i,
  );
  assert.match(
    units.find((unit) => unit.articleNumber === "20").translations.en.fullText,
    /decisions made solely based on automated processing/i,
  );
});

test("official Taiwan and Gulf English translations expose version, authority and rights metadata", async () => {
  const corpora = [
    ["tw-ai-basic-act-2026-articles.json", 20],
    ["tw-personal-data-protection-act-articles.json", 66],
    ["uae-federal-pdpl-45-2021-articles.json", 31],
    ["sa-pdpl-2021-amended-2023-articles.json", 43],
    ["sa-pdpl-implementing-regulation-2023-articles.json", 38],
    ["sa-pdpl-transfer-regulation-2023-articles.json", 9],
  ];
  for (const [filename, count] of corpora) {
    const units = await corpus(filename);
    assert.equal(units.length, count);
    for (const unit of units) assertCompleteEnglishTranslation(unit.translations.en);
  }
});

test("co-authentic Hong Kong and official Swiss English corpora are complete", async () => {
  const hongKong = await corpus("hk-pdpo-486-provisions.json");
  assert.equal(hongKong.length, 130);
  for (const unit of hongKong) {
    assert.equal(unit.language, "en-HK");
    assert.equal(unit.fullText, unit.paragraphs.join("\n\n"));
    assert.match(unit.rights.reuseStatus, /open-government-data/);
    assert.ok(unit.translations["zh-Hant-HK"]);
  }

  const swiss = await corpus("ch-fadp-2020-provisions.json");
  assert.equal(swiss.length, 79);
  for (const unit of swiss) {
    assert.equal(unit.language, "en-CH");
    assert.equal(unit.fullText, unit.paragraphs.join("\n\n"));
    assert.match(unit.rights.reuseStatus, /open-data-reuse-authorised/);
    for (const language of ["de-CH", "fr-CH", "it-CH"]) {
      assert.equal(unit.translations[language].fullText, unit.translations[language].paragraphs.join("\n\n"));
    }
  }
});

test("project English corpora are complete, versioned and explicitly nonofficial", async () => {
  const projectCorpora = [
    ["br-pl-2338-2023-ai-bill", 79, "complete-current-pending-bill-project-reference"],
    ["tw-executive-yuan-generative-ai-guidelines-2023", 11, "complete-current-guidance-project-reference"],
    ["id-pdp-law-2022", 76, "complete-current-project-reference"],
    ["vn-personal-data-protection-law-2025", 39, "complete-current-project-reference"],
    ["vn-decree-356-2025", 55, "complete-current-project-reference"],
    ["vn-decree-13-2023", 50, "complete-historical-project-reference"],
  ];
  for (const [instrumentId, expectedCount, expectedCoverage] of projectCorpora) {
    const entry = auditByInstrument.get(instrumentId);
    assert.equal(entry.englishCoverage, expectedCoverage);
    assert.equal(entry.coverageBreakdown.missing, 0);
    const units = await corpus(entry.corpus);
    assert.equal(units.length, expectedCount);
    for (const unit of units) {
      const translation = unit.translations?.en;
      assertCompleteEnglishTranslation(translation);
      assert.equal(
        translation.status,
        "project-authored-reference-translation-no-legal-effect",
      );
      assert.equal(translation.coverageStatus, expectedCoverage);
      assert.equal(translation.currentTextEquivalent, true);
      assert.match(
        `${translation.note} ${translation.authorityNote}`,
        /nonofficial|no legal effect|not issued|not endorsed/i,
      );
      assert.equal(
        translation.rights.licenseUrl,
        "https://creativecommons.org/licenses/by/4.0/",
      );
    }
  }

  const indonesia = await corpus("id-pdp-law-2022-articles.json");
  const article53 = indonesia.find((unit) => unit.articleNumber === "53");
  assert.match(article53.translations.en.fullText, /; and\/or/);
  assert.equal(
    article53.translations.en.legalEffectAlignment,
    "current-operative-text-after-Decision-151-PUU-XXII-2024",
  );
});
