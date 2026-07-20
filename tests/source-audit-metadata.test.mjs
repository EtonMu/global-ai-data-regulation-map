import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const readJson = async (name) =>
  JSON.parse(await readFile(new URL(name, dataRoot), "utf8"));

const [instruments, sourceAudits] = await Promise.all([
  readJson("instruments.json"),
  readJson("source-audit.json"),
]);

const instrumentById = new Map(
  instruments.map((instrument) => [instrument.id, instrument]),
);
const auditByInstrumentId = new Map(
  sourceAudits.map((audit) => [audit.instrumentId, audit]),
);

test("Chinese English availability distinguishes selected and complete reference translations", () => {
  const expected = new Map([
    ["cn-pipl", ["selected-non-official-reference-translations-stored", 5, 74]],
    ["cn-cybersecurity-law", ["complete-non-official-reference-translation-stored", 81, 81]],
    ["cn-network-data-regulations", ["selected-non-official-reference-translations-stored", 6, 64]],
    ["cn-generative-ai-measures", ["selected-non-official-reference-translations-stored", 3, 24]],
  ]);

  for (const [instrumentId, [status, translated, total]] of expected) {
    const english = auditByInstrumentId.get(instrumentId).englishAvailability;
    assert.equal(english.status, status);
    assert.equal(english.coverage.translatedUnitCount, translated);
    assert.equal(english.coverage.totalUnitCount, total);
  }

  assert.match(
    auditByInstrumentId.get("cn-network-data-regulations").localCoverage.statement,
    /Articles 9, 35, 36, 37, 38 and 44/,
  );
});

test("publication-language notes remain instrument-specific", () => {
  const gdpr = auditByInstrumentId.get("eu-gdpr");
  assert.deepEqual(gdpr.authoritativeLanguage.languages, ["EU official languages"]);
  assert.match(gdpr.localCoverage.statement, /173 Recitals/);
  assert.doesNotMatch(gdpr.localCoverage.statement, /annex/i);

  const euAiAct = auditByInstrumentId.get("eu-ai-act");
  assert.match(euAiAct.caveats.join(" "), /no replacement consolidated corpus/i);

  const ukGdpr = auditByInstrumentId.get("gb-uk-gdpr");
  assert.equal(ukGdpr.localCoverage.localUnitCount, 120);
  assert.equal(
    ukGdpr.localCoverage.mode,
    "complete-current-consolidated-article-corpus",
  );
  assert.match(ukGdpr.localCoverage.statement, /not be treated as identical/);

  const brazilBill = auditByInstrumentId.get("br-pl-2338-2023-ai-bill");
  assert.match(brazilBill.authoritativeLanguage.note, /bill text/i);
  assert.doesNotMatch(brazilBill.authoritativeLanguage.note, /LGPD PDF/);

  assert.deepEqual(
    auditByInstrumentId.get("ae-generative-ai-guide-2023")
      .authoritativeLanguage.languages,
    ["ar", "en"],
  );
  assert.deepEqual(
    auditByInstrumentId.get("sa-sdaia-ai-ethics-principles-1-0-2023")
      .authoritativeLanguage.languages,
    ["en"],
  );

  for (const instrumentId of [
    "hk-ai-model-pd-protection-framework-2024",
    "hk-ethical-ai-guidance-2021",
    "hk-genai-employee-guidelines-checklist-2025",
  ]) {
    assert.deepEqual(
      auditByInstrumentId.get(instrumentId).authoritativeLanguage.languages,
      ["en"],
    );
  }

  const unReport = auditByInstrumentId.get("un-ai-advisory-final-report-2024");
  assert.deepEqual(unReport.authoritativeLanguage.languages, [
    "ar",
    "zh",
    "en",
    "fr",
    "ru",
    "es",
  ]);
  assert.equal(unReport.localIndexLanguage.language, "en");

  const pipeda = auditByInstrumentId.get("ca-pipeda");
  assert.deepEqual(pipeda.authoritativeLanguage.languages, ["en-CA", "fr-CA"]);
  assert.equal(pipeda.localCoverage.localUnitCount, 75);
  assert.match(pipeda.localCoverage.mode, /co-authentic-bilingual/);

  const taiwanPdpa = auditByInstrumentId.get("tw-personal-data-protection-act");
  assert.equal(taiwanPdpa.localCoverage.localUnitCount, 66);
  assert.match(taiwanPdpa.localCoverage.mode, /commencement-status/);

  const singaporePdpa = auditByInstrumentId.get("sg-pdpa-2012");
  assert.equal(singaporePdpa.localCoverage.localUnitCount, 106);
  assert.match(singaporePdpa.caveats.join(" "), /unofficial and not authoritative/i);

  const australiaPrivacy = auditByInstrumentId.get("au-privacy-act-1988");
  assert.equal(australiaPrivacy.localCoverage.localUnitCount, 352);
  assert.match(australiaPrivacy.localCoverage.statement, /APP 1\.7–1\.9/);

  const japanAppi = auditByInstrumentId.get("jp-appi");
  assert.equal(japanAppi.localCoverage.localUnitCount, 208);
  assert.match(japanAppi.localCoverage.mode, /authoritative-japanese/);
  assert.equal(
    japanAppi.englishAvailability.coverage.translatedUnitCount,
    0,
  );
  assert.match(japanAppi.caveats.join(" "), /not offered as a current/i);

  const japanAiAct = auditByInstrumentId.get("jp-ai-promotion-act-2025");
  assert.equal(japanAiAct.localCoverage.localUnitCount, 29);
  assert.equal(
    japanAiAct.englishAvailability.coverage.translatedUnitCount,
    29,
  );
  assert.match(japanAiAct.authoritativeLanguage.note, /no legal effect/i);

  const hongKongPdpo = auditByInstrumentId.get(
    "hk-personal-data-privacy-ordinance",
  );
  assert.equal(hongKongPdpo.localCoverage.localUnitCount, 130);
  assert.deepEqual(hongKongPdpo.authoritativeLanguage.languages, [
    "en-HK",
    "zh-Hant-HK",
  ]);
  assert.match(hongKongPdpo.localCoverage.statement, /not in operation/i);
});

test("future-effective amendments and implementation sources stay explicit", () => {
  assert.equal(
    instrumentById.get("jp-appi").lifecycleStatus,
    "in-force-with-promulgated-future-amendment",
  );
  assert.equal(
    instrumentById.get("au-privacy-act-1988").lifecycleStatus,
    "in-force-with-scheduled-amendment",
  );
  assert.match(
    instrumentById.get("au-privacy-act-1988").statusNote,
    /not current duties/,
  );
  assert.equal(
    instrumentById.get("sa-pdpl-2021-amended-2023").supportingSource.url,
    "https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2",
  );
});

test("new public corpora preserve completeness, lifecycle, language, and rights boundaries", () => {
  const brazil = auditByInstrumentId.get("br-pl-2338-2023-ai-bill");
  assert.equal(brazil.localCoverage.localUnitCount, 79);
  assert.match(brazil.localCoverage.mode, /pending-Portuguese-bill/);
  assert.equal(brazil.englishAvailability.coverage.translatedUnitCount, 0);
  assert.match(brazil.caveats.join(" "), /not enacted|not an enacted/i);
  assert.match(brazil.caveats.join(" "), /Article 31/);
  assert.match(brazil.rightsBoundary.projectLicenseBoundary, /excluded-from-project-CC-BY/);

  const california = auditByInstrumentId.get("us-ca-sb-1047-2024");
  assert.equal(california.localCoverage.localUnitCount, 18);
  assert.match(california.localCoverage.mode, /vetoed-enrolled-bill/);
  assert.match(california.caveats.join(" "), /never became law|never enacted/i);
  assert.match(california.rightsBoundary.sourceTextStatus, /public-domain/);

  const colorado = auditByInstrumentId.get("us-co-sb26-189-admt-2026");
  assert.equal(colorado.localCoverage.localUnitCount, 18);
  assert.match(colorado.localCoverage.mode, /unit-level-effective-dates/);
  assert.match(colorado.caveats.join(" "), /14 May 2026/);
  assert.match(colorado.caveats.join(" "), /1 January 2027/);
  assert.match(colorado.rightsBoundary.projectLicenseBoundary, /excluded-from-project-CC-BY/);

  const nist = auditByInstrumentId.get("us-nist-ai-rmf-1-0");
  assert.equal(nist.localCoverage.localUnitCount, 135);
  assert.match(nist.localCoverage.statement, /four functions, 19 categories, and all 72 subcategories/);
  assert.match(nist.caveats.join(" "), /voluntary, non-binding/);
  assert.match(nist.rightsBoundary.note, /ISO\/OECD/);

  const aida = auditByInstrumentId.get("ca-bill-c-27-aida-2022-lapsed");
  assert.equal(aida.localCoverage.mode, "selected-provision-index");
  assert.equal(aida.localCoverage.localUnitCount, 4);
  assert.match(aida.rightsBoundary.projectLicenseBoundary, /source-linked-only/);
  assert.match(aida.caveats.join(" "), /not redistributed/);
});
