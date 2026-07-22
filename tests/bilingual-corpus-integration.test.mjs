import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const appSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const corpusBuildSource = await readFile(
  new URL("../scripts/build-client-corpus.mjs", import.meta.url),
  "utf8",
);
const load = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [instruments, audits, clientIndex, pipeda, canadaAdm, lgpd, taiwanAiAct, taiwanPdpa] =
  await Promise.all([
    load("instruments.json"),
    load("source-audit.json"),
    load("client-corpus-index.json"),
    load("canada-pipeda-provisions.json"),
    load("canada-adm-directive-provisions.json"),
    load("brazil-lgpd-articles.json"),
    load("tw-ai-basic-act-2026-articles.json"),
    load("tw-personal-data-protection-act-articles.json"),
  ]);

const instrumentById = new Map(instruments.map((item) => [item.id, item]));
const auditByInstrumentId = new Map(
  audits.map((item) => [item.instrumentId, item]),
);

test("the five complete bilingual corpora are registered as on-demand production shards", () => {
  for (const filename of [
    "canada-pipeda-provisions.json",
    "canada-adm-directive-provisions.json",
    "brazil-lgpd-articles.json",
    "tw-ai-basic-act-2026-articles.json",
    "tw-personal-data-protection-act-articles.json",
  ]) {
    assert.match(
      corpusBuildSource,
      new RegExp(filename.replaceAll(".", "\\.")),
    );
    assert.doesNotMatch(
      appSource,
      new RegExp(`from ["'][^"']*${filename.replaceAll(".", "\\.")}["']`),
    );
  }
  for (const instrumentId of [
    "ca-pipeda",
    "ca-directive-automated-decision-making",
    "br-lgpd-2018",
    "tw-ai-basic-act-2026",
    "tw-personal-data-protection-act",
  ]) {
    assert.match(
      clientIndex.shards[instrumentId],
      new RegExp(`^data/corpus/${instrumentId}\\.json\\?v=[a-f0-9]{16}$`),
    );
  }
  assert.match(appSource, /hydrateInstrumentCorpus/);
  assert.match(
    appSource,
    /\[readerLanguagePreference,\s*setReaderLanguagePreference\][\s\S]*?useState\("en"\)/,
    "the shared article-reader preference must default to English",
  );
  assert.match(appSource, /normalizedEnglishTranslation/);
  assert.match(appSource, /currentEffectiveVersion/);
  assert.match(appSource, /TEXT::NOT YET IN FORCE/);
  assert.match(appSource, /provisionUnitLabel/);
});

test("PIPEDA separates complete current and prospective co-authentic units", () => {
  assert.equal(pipeda.length, 84);
  assert.ok(pipeda.every((item) => item.language === "fr"));
  assert.ok(pipeda.every((item) => item.translations.en.status === "official"));
  assert.equal(
    pipeda.filter((item) => item.unitType === "amending-section-not-in-force").length,
    9,
  );
  assert.equal(
    instrumentById.get("ca-pipeda").coverage.completeness,
    "complete-official-co-authentic-current-in-force-text-with-enacted-amendments-not-in-force",
  );
  assert.equal(auditByInstrumentId.get("ca-pipeda").localCoverage.localUnitCount, 84);
  assert.equal(
    auditByInstrumentId.get("ca-pipeda").englishAvailability.coverage
      .temporallyMismatchedUnitCount,
    0,
  );
});

test("Canada ADM Directive stores every current English and French top-level unit", () => {
  assert.equal(canadaAdm.length, 13);
  assert.deepEqual(
    canadaAdm.map((item) => item.articleNumber),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C"],
  );
  assert.ok(canadaAdm.every((item) => item.language === "en-CA"));
  assert.ok(
    canadaAdm.every(
      (item) =>
        item.translations.fr.status === "official-co-published" &&
        item.translations.fr.fullText.length > 0,
    ),
  );
  assert.equal(
    auditByInstrumentId.get("ca-directive-automated-decision-making")
      .localCoverage.localUnitCount,
    13,
  );
});

test("LGPD stores complete current Portuguese and explicitly sourced English references", () => {
  assert.equal(lgpd.length, 80);
  assert.ok(lgpd.every((item) => item.language === "pt-BR"));
  assert.ok(lgpd.every((item) => item.translations?.en));
  assert.equal(
    lgpd.filter(
      (item) =>
        item.translations.en.status ===
        "official-reference-translation-no-legal-effect",
    ).length,
    77,
  );
  assert.equal(
    lgpd.filter(
      (item) =>
        item.translations.en.status ===
        "project-authored-reference-translation-no-legal-effect",
    ).length,
    3,
  );
  assert.equal(
    auditByInstrumentId.get("br-lgpd-2018").englishAvailability.coverage
      .translatedUnitCount,
    80,
  );
  assert.match(
    instrumentById.get("br-lgpd-2018").textAvailability.note,
    /80 current Portuguese Article identifiers/i,
  );
});

test("Taiwan corpora preserve government English references and node-level commencement", () => {
  assert.equal(taiwanAiAct.length, 20);
  assert.equal(taiwanPdpa.length, 66);
  assert.ok(
    [...taiwanAiAct, ...taiwanPdpa].every(
      (item) => item.translations.en.status === "official-reference-translation",
    ),
  );
  const article12 = taiwanPdpa.find((item) => item.articleNumber === "12");
  const article27 = taiwanPdpa.find((item) => item.articleNumber === "27");
  assert.equal(article12.appliesFrom, null);
  assert.equal(
    article12.applicability.currentLawStatus,
    "prior-version-remains-in-force-until-commencement",
  );
  assert.match(article12.currentEffectiveVersion.fullText, /通知當事人/u);
  assert.equal(article27.legalEffectStatus, "promulgated-deletion-not-in-force");
  assert.match(article27.currentEffectiveVersion.fullText, /安全措施/u);
  assert.equal(
    instrumentById.get("tw-personal-data-protection-act").coverage.count,
    66,
  );
});
