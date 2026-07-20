import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const loadJson = async (path) =>
  JSON.parse(await readFile(new URL(path, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("jp-appi-current-articles.json");
const manifest = await loadJson("jp-appi-current-corpus-manifest.json");
const supplementEnglishManifest = await loadJson(
  "jp-appi-supplement-project-english-manifest.json",
);
const supplementEnglishCatalogue = await loadJson(
  "source-snapshots/jp-appi-supplements-project-en-draft-2026-07-20.json",
);

const changedComparisonUnitIds = [
  "jp-appi-art-48",
  "jp-appi-art-113",
  "jp-appi-art-132",
  "jp-appi-art-136",
  "jp-appi-art-150",
  "jp-appi-art-162",
  "jp-appi-art-164",
  "jp-appi-art-176",
  "jp-appi-art-177",
  "jp-appi-art-178",
  "jp-appi-art-179",
  "jp-appi-art-180",
  "jp-appi-art-181",
  "jp-appi-appended-table-1",
  "jp-appi-appended-table-2",
];

const comparisonRecordDigest = (record) => {
  const canonical = Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => key !== "comparisonRecordSha256")
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  return digest(JSON.stringify(canonical));
};

test("Japan APPI current corpus contains all 185 main Articles and complete current attachments", () => {
  assert.equal(corpus.length, 208);
  const articles = corpus.filter((unit) => unit.unitType === "article");
  const supplements = corpus.filter(
    (unit) => unit.unitType === "supplementary-provision-block",
  );
  const tables = corpus.filter((unit) => unit.unitType === "appended-table");
  assert.equal(articles.length, 185);
  assert.equal(supplements.length, 21);
  assert.equal(tables.length, 2);
  assert.deepEqual(
    articles.map((unit) => unit.articleNumber),
    Array.from({ length: 185 }, (_, index) => String(index + 1)),
  );
  assert.deepEqual(
    articles.map((unit) => unit.id),
    Array.from({ length: 185 }, (_, index) => `jp-appi-art-${index + 1}`),
  );

  for (const unit of corpus) {
    assert.equal(unit.instrumentId, "jp-appi");
    assert.equal(unit.language, "ja-JP");
    assert.equal(unit.versionAsOf, "2026-07-20");
    assert.equal(
      unit.sourceVersion.revisionId,
      "415AC0000000057_20260717_508AC0000000062",
    );
    assert.equal(unit.sourceVersion.textState, "current-effective-consolidation-only");
    assert.match(unit.fullText, /[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.equal(unit.contentSha256, digest(unit.fullText));
    assert.match(unit.sourceNodeSha256, /^[a-f0-9]{64}$/);
    assert.equal(unit.rights.reuseStatus, "e-gov-secondary-use-unrestricted");
  }

  const comparedUnits = [...articles, ...tables];
  assert.equal(comparedUnits.length, 187);
  const verifiedGovernmentUnits = comparedUnits.filter(
    (unit) =>
      unit.translationStatus ===
      "government-reference-translation-current-text-equivalent-verified",
  );
  const projectCurrentUnits = comparedUnits.filter(
    (unit) =>
      unit.translationStatus ===
      "project-authored-reference-translation-no-legal-effect",
  );
  assert.equal(verifiedGovernmentUnits.length, 172);
  assert.deepEqual(
    projectCurrentUnits.map((unit) => unit.id),
    changedComparisonUnitIds,
  );
  assert.equal(comparedUnits.filter((unit) => !unit.translations.en.currentTextEquivalent).length, 0);

  for (const unit of verifiedGovernmentUnits) {
    const english = unit.translations.en;
    assert.equal(english.language, "en");
    assert.equal(
      english.status,
      "government-reference-translation-current-text-equivalent-verified-no-legal-effect",
    );
    assert.equal(
      english.coverageStatus,
      "complete-current-equivalent-government-reference",
    );
    assert.equal(english.versionAsOf, "2021-05-19");
    assert.equal(
      english.versionLabel,
      "Act No. 37 of 2021 consolidated government reference (published 2023-03-01)",
    );
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(english.currentAlignmentVerifiedAsOf, "2026-07-20");
    assert.equal(english.referenceViewEligible, true);
    assert.match(english.fullText, /[A-Za-z]/);
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.match(english.sourceNodeSha256, /^[a-f0-9]{64}$/);
    assert.equal(english.sourceVersion.lastVersion, "Act No. 37 of 2021");
    assert.equal(english.sourceVersion.comparedCurrentJapaneseAsOf, "2026-07-20");
    assert.equal(
      english.sourceVersion.versionAlignment,
      "article-level-normalized-japanese-current-equivalence-verified",
    );
    assert.equal(english.japaneseTextComparison.normalizedTextEquivalent, true);
    assert.equal(
      english.japaneseTextComparison.comparisonRecordSha256,
      comparisonRecordDigest(english.japaneseTextComparison),
    );
    assert.match(english.note, /identical after Unicode NFC normalization and whitespace removal/i);
    assert.match(english.note, /Only the Japanese text has legal effect/i);
    assert.equal(english.rights.reuseStatus, "public-data-license-1.0");
  }
  for (const unit of projectCurrentUnits) {
    const english = unit.translations.en;
    assert.equal(english.language, "en");
    assert.equal(
      english.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(english.coverageStatus, "complete-current-project-reference");
    assert.equal(english.versionAsOf, "2026-07-20");
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(english.referenceViewEligible, true);
    assert.equal(
      english.legalEffectStatus,
      "project-reference-translation-no-legal-effect",
    );
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.equal(english.japaneseTextComparison.normalizedTextEquivalent, false);
    assert.equal(
      english.japaneseTextComparison.comparisonRecordSha256,
      comparisonRecordDigest(english.japaneseTextComparison),
    );
    assert.equal(
      english.translationBasis.comparisonRecordSha256,
      english.japaneseTextComparison.comparisonRecordSha256,
    );
    assert.equal(
      english.translationBasis.sourceContentSha256,
      unit.contentSha256,
    );
    assert.match(english.translationBasis.method, /human-reviewed/u);
    assert.match(english.note, /nonofficial/u);
    assert.match(english.note, /no legal effect/u);
    assert.equal(
      english.rights.licenseUrl,
      "https://creativecommons.org/licenses/by/4.0/",
    );
    assert.equal(
      english.rights.sourceTranslationLicenseUrl,
      "https://www.japaneselawtranslation.go.jp/en/index/terms",
    );
  }
  for (const unit of supplements) {
    assert.equal(
      unit.translationStatus,
      "project-authored-reference-translation-no-legal-effect",
    );
    const english = unit.translations.en;
    assert.equal(
      english.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(english.coverageStatus, "complete-current-project-reference");
    assert.equal(english.versionAsOf, "2026-07-20");
    assert.equal(english.currentTextEquivalent, true);
    assert.equal(english.referenceViewEligible, true);
    assert.equal(
      english.legalEffectStatus,
      "project-reference-translation-no-legal-effect",
    );
    assert.equal(english.applicability.sourceSnapshotAsOf, "2026-07-20");
    assert.match(english.applicability.note, /controlling Japanese text/u);
    assert.equal(english.paragraphs.length, unit.paragraphs.length);
    assert.equal(english.contentSha256, digest(english.fullText));
    assert.match(english.fullText, /[A-Za-z]/u);
    assert.doesNotMatch(english.fullText, /[぀-ヿ㐀-鿿]/u);
    assert.doesNotMatch(english.fullText, /Sanryaku|Shoryaku|Ryak|省略|略/iu);
    assert.equal(english.translationBasis.sourceContentSha256, unit.contentSha256);
    assert.equal(english.translationBasis.sourceParagraphCount, unit.paragraphs.length);
    assert.match(english.translationBasis.method, /machine-assisted/u);
    assert.equal(english.rights.reuseStatus, "cc-by-4.0-project-authored-translation");
    assert.equal(
      english.rights.licenseUrl,
      "https://creativecommons.org/licenses/by/4.0/",
    );
    for (const [index, paragraph] of english.paragraphs.entries()) {
      assert.equal(
        paragraph.split("\n\n").length,
        unit.paragraphs[index].split("\n\n").length,
      );
      const duplicated = paragraph.match(/\b([A-Za-z]{3,})\b(?:\s+|,\s+)\1\b/iu);
      assert.ok(
        !duplicated || ["article", "information"].includes(duplicated[1].toLowerCase()),
        `${unit.id} duplicated word: ${duplicated?.[0]}`,
      );
    }
    assert.equal(
      unit.englishAvailability.coverageStatus,
      "complete-current-project-reference",
    );
    assert.equal(
      unit.englishAvailability.status,
      "project-authored-reference-translation-no-legal-effect",
    );
    assert.equal(unit.englishAvailability.versionAsOf, "2026-07-20");
    assert.equal(
      unit.translationReference.availability,
      "complete-project-authored-current-reference",
    );
    assert.equal(
      unit.governmentReferenceAudit.availability,
      "not-present-in-government-reference",
    );
    assert.match(unit.governmentReferenceAudit.note, /contains no supplementary provisions/i);
  }

  assert.match(articles[0].fullText, /個人の権利利益を保護することを目的とする/);
  assert.match(articles[1].fullText, /要配慮個人情報/);
  assert.match(articles[22].fullText, /漏えい、滅失又は毀損の防止/);
  assert.match(articles[25].fullText, /個人データの漏えい、滅失、毀損/);
  assert.match(articles[27].fullText, /外国にある第三者への提供の制限/);
  assert.match(articles[183].fullText, /法人でない団体について/);
  assert.equal(articles[184].paragraphs.length, 4);
  assert.match(tables[0].fullText, /名称｜根拠法/);
  assert.match(tables[1].fullText, /国立研究開発法人｜独立行政法人通則法/);
  assert.match(articles[0].translations.en.fullText, /The purpose of this Act is to protect/);
  assert.match(articles[22].translations.en.fullText, /necessary and appropriate measures for managing the security/i);
  assert.match(articles[27].translations.en.fullText, /foreign country/i);
  assert.match(articles[131].translations.en.fullText, /Article 2, paragraph \(9\)/u);
  assert.doesNotMatch(articles[131].translations.en.fullText, /Article 2, paragraph \(8\)/u);
  assert.match(articles[149].translations.en.fullText, /Article 102-2/u);
  assert.match(articles[161].translations.en.fullText, /Article 100, paragraph \(1\)/u);
  assert.doesNotMatch(articles[175].translations.en.fullText, /imprisonment with work/u);
  assert.match(tables[0].translations.en.fullText, /Japan Financial Literacy and Education Corporation/u);
  assert.match(tables[0].translations.en.fullText, /Japan Institute for Health Security/u);
  assert.match(tables[0].translations.en.fullText, /GX Acceleration Agency/u);
  assert.match(tables[0].translations.en.fullText, /Fukushima Institute for Research, Education and Innovation/u);
  assert.equal(tables[0].translations.en.paragraphs.length, 22);
  assert.match(tables[1].translations.en.fullText, /National Research and Development Agency/u);
  assert.match(tables[1].translations.en.fullText, /Japan Institute for Health Security/u);
  assert.equal(tables[1].translations.en.paragraphs.length, 10);
  assert.match(
    supplements.find((unit) => unit.id === "jp-appi-suppl-3").translations.en.fullText,
    /\(i\) the provision of Article 6: the later of the date on which the Act on the Protection of Personal Information comes into effect and the date on which this Act comes into effect\./u,
  );
  const supplement5 = supplements.find((unit) => unit.id === "jp-appi-suppl-5")
    .translations.en.fullText;
  assert.match(supplement5, /\(ii\) Articles 1 and 4 of this Act; and Articles 5 and 6/u);
  assert.match(supplement5, /\(v\) Articles 3 and 6 of this Act \(excluding the provision in Article 6/u);
  for (const id of ["jp-appi-suppl-19", "jp-appi-suppl-20", "jp-appi-suppl-21"]) {
    const english = supplements.find((unit) => unit.id === id).translations.en;
    assert.equal(
      english.applicability.status,
      "promulgated-2026-future-conditional-or-phased-commencement",
    );
    assert.match(english.applicability.note, /does not mean that every underlying amendment was operative/u);
  }
});

test("APPI manifest separates the 20 July 2026 current version from seven future revisions", () => {
  assert.equal(manifest.currentVersion.asOf, "2026-07-20");
  assert.equal(
    manifest.currentVersion.revisionId,
    "415AC0000000057_20260717_508AC0000000062",
  );
  assert.equal(manifest.currentVersion.futureRevisionTextIncluded, false);
  assert.equal(manifest.corpus.nodeCount, 208);
  assert.equal(manifest.corpus.mainArticleCount, 185);
  assert.equal(manifest.corpus.supplementaryProvisionBlockCount, 21);
  assert.equal(manifest.corpus.appendedTableCount, 2);
  assert.equal(
    manifest.corpus.contentSha256,
    digest(corpus.map((unit) => unit.fullText).join("\n\n")),
  );

  const future = manifest.promulgatedFutureRevisions;
  assert.equal(future.length, 7);
  assert.deepEqual(
    future.map((entry) => entry.eGovEnforcementDate),
    [
      "2026-10-01",
      "2026-12-31",
      "2027-01-17",
      "2027-04-01",
      "2027-04-16",
      "2028-07-16",
      "2028-12-23",
    ],
  );
  assert.ok(future.every((entry) => entry.includedInCurrentCorpus === false));
  assert.equal(
    future.find((entry) => entry.eGovEnforcementDate === "2028-07-16")
      .dateCertainty,
    "statutory-deadline-not-fixed-by-cabinet-order",
  );
  assert.equal(
    future.find((entry) => entry.eGovEnforcementDate === "2028-12-23")
      .dateCertainty,
    "linked-to-another-act",
  );
});

test("APPI English references are current-aligned with auditable government and project boundaries", () => {
  assert.equal(
    manifest.translation.status,
    "mixed-verified-government-and-project-current-references",
  );
  assert.equal(manifest.translation.totalNodeCount, 208);
  assert.equal(manifest.translation.currentAlignedUnitCount, 208);
  assert.equal(manifest.translation.temporallyMismatchedUnitCount, 0);
  assert.equal(manifest.translation.unitCountWithoutEnglishReference, 0);
  assert.equal(
    manifest.translation.coverageStatus,
    "complete-current-aligned-english-reference-for-all-208-nodes",
  );
  assert.equal(manifest.translation.governmentReference.lastVersion, "Act No. 37 of 2021");
  assert.equal(
    manifest.translation.governmentReference.normalizedCurrentEquivalentUnitCount,
    172,
  );
  assert.equal(manifest.translation.governmentReference.normalizedChangedUnitCount, 15);
  assert.equal(manifest.translation.projectCurrentAlignmentReference.unitCount, 15);
  assert.equal(manifest.translation.projectCurrentAlignmentReference.mainArticleCount, 13);
  assert.equal(manifest.translation.projectCurrentAlignmentReference.appendedTableCount, 2);
  assert.deepEqual(
    manifest.translation.projectCurrentAlignmentReference.unitIds,
    changedComparisonUnitIds,
  );
  assert.equal(
    manifest.translation.projectCurrentAlignmentReference.currentTextEquivalent,
    true,
  );
  assert.equal(manifest.translation.projectCurrentAlignmentReference.license, "CC BY 4.0");
  assert.equal(manifest.translation.projectSupplementReference.versionAsOf, "2026-07-20");
  assert.equal(manifest.translation.projectSupplementReference.currentTextEquivalent, true);
  assert.equal(manifest.translation.projectSupplementReference.license, "CC BY 4.0");
  const audit = manifest.translation.alignmentAudit;
  assert.equal(audit.comparedUnitCount, 187);
  assert.equal(audit.normalizedEquivalentUnitCount, 172);
  assert.equal(audit.normalizedChangedUnitCount, 15);
  assert.deepEqual(audit.changedUnitIds, changedComparisonUnitIds);
  assert.deepEqual(audit.projectCurrentAlignmentUnitIds, changedComparisonUnitIds);
  assert.deepEqual(audit.remainingHistoricalMismatchUnitIds, []);
  assert.equal(
    audit.currentJapaneseSourceDocumentSha256,
    "4b0bcfca1781fbaf8756d39976c8e8d55b7cb99065aa3008d3b659d0f9e40c4f",
  );
  assert.equal(
    audit.historicalJapaneseSourceDocumentSha256,
    "a0fc4c953d912de7eafae08f287ecf4c5dc6fb25cf4bb704529d3c064655dca3",
  );
  const compared = corpus.filter((unit) => unit.translations.en.japaneseTextComparison);
  assert.equal(compared.length, 187);
  assert.equal(
    audit.comparisonRecordSequenceSha256,
    digest(
      compared
        .map((unit) => unit.translations.en.japaneseTextComparison.comparisonRecordSha256)
        .join("\n"),
    ),
  );
  assert.match(manifest.translation.legalEffect, /Only the original Japanese text has legal effect/i);
});

test("APPI supplementary project-English manifest pins all 21 blocks and the draft catalogue", async () => {
  assert.equal(supplementEnglishManifest.scope.expectedUnitCount, 21);
  assert.equal(supplementEnglishManifest.scope.translatedUnitCount, 21);
  assert.equal(supplementEnglishManifest.scope.sourceParagraphCount, 65);
  assert.equal(supplementEnglishManifest.scope.translationParagraphCount, 65);
  assert.equal(supplementEnglishManifest.scope.translationLegalEffectStatusCount, 21);
  assert.equal(supplementEnglishManifest.scope.applicabilityNoteCount, 21);
  assert.equal(
    supplementEnglishManifest.scope.coverageStatus,
    "complete-current-project-reference",
  );
  assert.equal(supplementEnglishManifest.versionBoundary.sourceAsOf, "2026-07-20");
  assert.match(
    supplementEnglishManifest.versionBoundary.governmentEnglishReferenceBoundary,
    /no supplementary provisions/i,
  );
  assert.equal(supplementEnglishManifest.method.sourceHashLock, true);
  assert.equal(supplementEnglishManifest.method.paragraphOrderLock, true);
  assert.equal(supplementEnglishManifest.method.subBlockOrderLock, true);
  assert.equal(supplementEnglishManifest.rights.projectEnglishLicense, "CC BY 4.0");
  const catalogueBytes = await readFile(
    new URL(supplementEnglishManifest.method.cataloguePath.replace("data/v2/", ""), dataRoot),
  );
  assert.equal(digest(catalogueBytes), supplementEnglishManifest.method.catalogueSha256);
  assert.equal(supplementEnglishCatalogue.units.length, 21);
  assert.equal(supplementEnglishCatalogue.source.paragraphCount, 65);
  assert.deepEqual(
    supplementEnglishCatalogue.units.map((unit) => unit.id),
    corpus
      .filter((unit) => unit.unitType === "supplementary-provision-block")
      .map((unit) => unit.id),
  );
});

test("Every APPI source snapshot matches its manifest SHA-256", async () => {
  for (const snapshot of manifest.sourceSnapshots) {
    const bytes = await readFile(new URL(snapshot.path.replace("data/v2/", ""), dataRoot));
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const current = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "current-effective-text",
  );
  assert.equal(
    current.sha256,
    "4b0bcfca1781fbaf8756d39976c8e8d55b7cb99065aa3008d3b659d0f9e40c4f",
  );
  const currentXml = await readFile(
    new URL(current.path.replace("data/v2/", ""), dataRoot),
    "utf8",
  );
  assert.match(currentXml, /個人情報の保護に関する法律/);
  assert.match(currentXml, /<Article Num="185">/);
  const historicalJapanese = manifest.sourceSnapshots.find(
    (snapshot) => snapshot.role === "historical-japanese-comparison-source",
  );
  assert.equal(
    historicalJapanese.sha256,
    "a0fc4c953d912de7eafae08f287ecf4c5dc6fb25cf4bb704529d3c064655dca3",
  );
  assert.equal(
    historicalJapanese.sourceUrl,
    "https://www.japaneselawtranslation.go.jp/ja/laws/download/4241/01/h15Aa000570305ja14.0_r3A37.xml",
  );
  const historicalJapaneseXml = await readFile(
    new URL(historicalJapanese.path.replace("data/v2/", ""), dataRoot),
    "utf8",
  );
  assert.match(historicalJapaneseXml, /Lang="ja"/u);
  assert.match(historicalJapaneseXml, /<Article Num="185"/u);
});
