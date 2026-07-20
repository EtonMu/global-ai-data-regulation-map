import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const appSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const load = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [instruments, audits, pipeda, lgpd, taiwanAiAct, taiwanPdpa] =
  await Promise.all([
    load("instruments.json"),
    load("source-audit.json"),
    load("canada-pipeda-provisions.json"),
    load("brazil-lgpd-articles.json"),
    load("tw-ai-basic-act-2026-articles.json"),
    load("tw-personal-data-protection-act-articles.json"),
  ]);

const instrumentById = new Map(instruments.map((item) => [item.id, item]));
const auditByInstrumentId = new Map(
  audits.map((item) => [item.instrumentId, item]),
);

test("the four complete corpora are imported into the production explorer", () => {
  for (const filename of [
    "canada-pipeda-provisions.json",
    "brazil-lgpd-articles.json",
    "tw-ai-basic-act-2026-articles.json",
    "tw-personal-data-protection-act-articles.json",
  ]) {
    assert.match(appSource, new RegExp(filename.replaceAll(".", "\\.")));
  }
  assert.match(appSource, /languageSelection[\s\S]*language:\s*"en"/);
  assert.match(appSource, /normalizedEnglishTranslation/);
  assert.match(appSource, /currentEffectiveVersion/);
  assert.match(appSource, /TEXT::NOT YET IN FORCE/);
  assert.match(appSource, /provisionUnitLabel/);
});

test("PIPEDA exposes complete co-authentic English and French units", () => {
  assert.equal(pipeda.length, 75);
  assert.ok(pipeda.every((item) => item.language === "fr"));
  assert.ok(pipeda.every((item) => item.translations.en.status === "official"));
  assert.equal(
    instrumentById.get("ca-pipeda").coverage.completeness,
    "complete-official-co-authentic-current-text",
  );
  assert.equal(auditByInstrumentId.get("ca-pipeda").localCoverage.localUnitCount, 75);
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
