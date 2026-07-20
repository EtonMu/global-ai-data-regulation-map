import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);
const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

const [popia, ndpa, indonesia, handoff] = await Promise.all([
  loadJson("za-popia-sections.json"),
  loadJson("ng-ndpa-2023-sections.json"),
  loadJson("id-pdp-law-2022-articles.json"),
  loadJson("legal-corpus-handoff-africa-indonesia.json"),
]);

const assertUnitIntegrity = (unit) => {
  assert.ok(unit.fullText.length > 0, `${unit.id} must contain text`);
  assert.deepEqual(unit.fullText, unit.paragraphs.join("\n\n"));
  assert.equal(unit.contentSha256, sha256(unit.fullText));
  assert.doesNotMatch(unit.fullText, /\u00ad/u);
  assert.doesNotMatch(unit.fullText, /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u);
  assert.ok(unit.source.startsWith("https://"));
  assert.equal(unit.retrievedOn, "2026-07-20");
  assert.equal(unit.versionAsOf, "2026-07-20");
  assert.ok(unit.rights.licenseUrl.startsWith("https://"));
};

test("POPIA corpus contains all 115 sections and the complete Schedule", () => {
  assert.equal(popia.length, 116);
  assert.deepEqual(
    popia.slice(0, 115).map((unit) => unit.articleNumber),
    Array.from({ length: 115 }, (_, index) => String(index + 1)),
  );
  assert.equal(popia.at(-1).articleNumber, "Schedule");

  for (const [index, unit] of popia.entries()) {
    assertUnitIntegrity(unit);
    assert.equal(unit.instrumentId, "za-popia-4-2013");
    if (index < 115) {
      assert.equal(unit.id, `za-popia-s-${index + 1}`);
      assert.equal(unit.label, `Section ${index + 1}`);
    }
    assert.doesNotMatch(
      unit.fullText,
      /(?:CHAPTER \d+|(?:APPLICATION PROVISIONS|SUPERVISION|ENFORCEMENT) \(s{1,2} \d)/u,
    );
  }

  const byNumber = new Map(popia.map((unit) => [unit.articleNumber, unit]));
  assert.match(byNumber.get("1").fullText, /'personal information' means information relating to an identifiable/u);
  assert.match(byNumber.get("12").fullText, /provided for in subsection \(2\)\./u);
  assert.doesNotMatch(byNumber.get("12").fullText, /\n\n\(2\)\.\n\n/u);
  assert.match(byNumber.get("22").fullText, /reasonable grounds to believe that the personal information/u);
  assert.equal(byNumber.get("58").operationalApplication.applicableFrom, "2022-02-01");
  assert.match(byNumber.get("58").operationalApplication.source, /gg44761gon560/u);
  assert.deepEqual(
    byNumber.get("114").commencementSegments.map((item) => item.effectiveFrom),
    ["2020-07-01", "2021-06-30"],
  );
  assert.match(byNumber.get("Schedule").fullText, /Act 23 of 1994 Public Protector Act, 1994/u);
  assert.match(byNumber.get("Schedule").fullText, /Act 2 of 2000 Promotion of Access to Information Act, 2000/u);
  assert.match(byNumber.get("Schedule").fullText, /Act 25 of 2002 Electronic Communications and Transactions Act, 2002/u);
  assert.match(byNumber.get("Schedule").fullText, /Act 34 of 2005 National Credit Act, 2005/u);
});

test("Nigeria NDPA corpus contains all 66 sections and Schedule paragraphs 1-18", () => {
  assert.equal(ndpa.length, 67);
  assert.deepEqual(
    ndpa.slice(0, 66).map((unit) => unit.articleNumber),
    Array.from({ length: 66 }, (_, index) => String(index + 1)),
  );
  assert.equal(ndpa.at(-1).articleNumber, "Schedule");

  for (const [index, unit] of ndpa.entries()) {
    assertUnitIntegrity(unit);
    assert.equal(unit.instrumentId, "ng-data-protection-act-2023");
    assert.equal(unit.legalEffectStatus, "in-force-unamended");
    if (index < 66) {
      assert.equal(unit.id, `ng-ndpa-2023-s-${index + 1}`);
      assert.equal(unit.label, `Section ${index + 1}`);
    }
    assert.doesNotMatch(unit.fullText, /Nigeria Data Protection Act, 2023 2022 No\. 37/u);
  }

  const byNumber = new Map(ndpa.map((unit) => [unit.articleNumber, unit]));
  assert.match(byNumber.get("24").fullText, /limited to the minimum necessary/u);
  assert.match(byNumber.get("37").fullText, /obtain human intervention/u);
  assert.match(byNumber.get("40").fullText, /within 72 hours of becoming aware/u);
  assert.match(byNumber.get("41").fullText, /shall not transfer or permit personal data to be transferred/u);
  assert.equal(
    byNumber.get("66").fullText,
    "66. This Act may be cited as the Nigeria Data Protection Act, 2023.",
  );
  assert.doesNotMatch(byNumber.get("34").fullText, /Act No\. 26, 2003/u);
  assert.doesNotMatch(byNumber.get("54").fullText, /Cap\. P41|Act No\. 16, 2022/u);
  assert.match(byNumber.get("65").fullText, /Child’s Right Act, No\. 26, 2003/u);

  const scheduleNumbers = byNumber
    .get("Schedule")
    .paragraphs.map((paragraph) => /^(\d+)\. /.exec(paragraph)?.[1])
    .filter(Boolean);
  assert.deepEqual(
    scheduleNumbers,
    Array.from({ length: 18 }, (_, index) => String(index + 1)),
  );
});

test("Indonesia PDP corpus contains Articles 1-76 with aligned nonofficial English", () => {
  assert.equal(indonesia.length, 76);
  for (const [index, article] of indonesia.entries()) {
    const number = index + 1;
    assertUnitIntegrity(article);
    assert.equal(article.id, `id-pdp-law-2022-art-${number}`);
    assert.equal(article.instrumentId, "id-pdp-law-2022");
    assert.equal(article.articleNumber, String(number));
    assert.equal(article.originalTitle, `Pasal ${number}`);
    assert.equal(article.language, "id-ID");
    const english = article.translations.en;
    assert.equal(english.language, "en");
    assert.equal(english.coverageStatus, "complete-current-project-reference");
    assert.equal(english.officialStatus, "non-official-no-legal-effect");
    assert.equal(english.fullText, english.paragraphs.join("\n\n"));
    assert.equal(english.contentSha256, sha256(english.fullText));
    assert.equal(english.paragraphs.length, article.paragraphs.length);
    assert.equal(article.currentLanguageToggleEligible, true);
    assert.equal(
      article.englishAvailability.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(
      article.englishAvailability.coverageStatus,
      "complete-current-project-reference",
    );
    assert.match(article.chapter.label, /^BAB [IVXLCDM]+$/u);
    assert.doesNotMatch(
      article.fullText,
      /(?:^|\n\n)(?:\(\d+\)\.|[a-z]\.)(?:\n\n|$)/u,
    );
  }

  assert.match(indonesia[0].fullText, /Undang-Undang Dasar Negara Republik Indonesia Tahun 1945/u);
  assert.match(indonesia[25].fullText, /\(1\) Pemrosesan Data Pribadi penyandang disabilitas/u);
  assert.match(indonesia[15].fullText, /dapat dipertanggungjawabkan/u);
  assert.match(indonesia[33].fullText, /wajib melakukan penilaian dampak Pelindungan Data Pribadi/u);
  assert.equal(
    indonesia[75].fullText,
    "Pasal 76\n\nUndang-Undang ini mulai berlaku pada tanggal diundangkan.",
  );

  const article53 = indonesia[52];
  assert.match(article53.fullText, /skala besar; dan\n\nc\./u);
  assert.match(article53.currentOperativeText, /skala besar; dan\/atau\n\nc\./u);
  assert.equal(
    article53.currentOperativeSha256,
    sha256(article53.currentOperativeText),
  );
  assert.equal(article53.legalEffect.decision, "151/PUU-XXII/2024");
  assert.equal(article53.legalEffect.effectiveFrom, "2025-07-30");
  assert.match(article53.fullText, /\(3\) Pejabat atau petugas/u);
});

test("handoff manifest pins file hashes, sources, rights and non-integration boundary", async () => {
  assert.equal(handoff.reviewedAsOf, "2026-07-20");
  assert.equal(handoff.corpora.length, 3);
  for (const corpus of handoff.corpora) {
    assert.equal(corpus.coverage.complete, true);
    assert.equal(corpus.coverage.expectedUnitCount, corpus.coverage.actualUnitCount);
    const outputBytes = await readFile(new URL(corpus.output.path, repositoryRoot));
    assert.equal(sha256(outputBytes), corpus.output.sha256);
    for (const snapshot of corpus.sourceSnapshots) {
      const snapshotBytes = await readFile(new URL(snapshot.path, repositoryRoot));
      assert.equal(sha256(snapshotBytes), snapshot.sha256);
    }
    assert.ok(corpus.officialSources.every((source) => source.url.startsWith("https://")));
    assert.ok(corpus.reuse.source.startsWith("https://"));
  }
  assert.equal(handoff.integration.status, "not-performed-by-design");
  assert.ok(handoff.integration.filesNotEdited.includes("data/v2/provisions.json"));
  assert.match(
    handoff.corpora.find((item) => item.instrumentId === "id-pdp-law-2022")
      .statusReview.englishVersionConclusion,
    /No complete official English translation/u,
  );
});
