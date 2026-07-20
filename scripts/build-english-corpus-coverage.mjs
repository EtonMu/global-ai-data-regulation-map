import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const dataRoot = resolve(projectRoot, "data/v2");
const reviewedOn = "2026-07-20";

// Complete, locally imported corpora whose controlling/default stored text is
// not English. English-first and metadata-only instruments are audited in the
// broader source-audit manifest instead.
const corpusFiles = [
  "brazil-lgpd-articles.json",
  "br-ai-bill-2338-2023-articles.json",
  "canada-pipeda-provisions.json",
  "cn-pipl-articles.json",
  "cn-network-data-regulations-articles.json",
  "cn-generative-ai-measures-articles.json",
  "id-pdp-law-2022-articles.json",
  "jp-appi-current-articles.json",
  "jp-ai-promotion-act-2025-articles.json",
  "kr-pipa-2011-current-articles.json",
  "kr-ai-framework-act-2025-current-articles.json",
  "sa-pdpl-2021-amended-2023-articles.json",
  "sa-pdpl-implementing-regulation-2023-articles.json",
  "sa-pdpl-transfer-regulation-2023-articles.json",
  "tw-ai-basic-act-2026-articles.json",
  "tw-personal-data-protection-act-articles.json",
  "tw-executive-yuan-generative-ai-guidelines-2023-points.json",
  "uae-federal-pdpl-45-2021-articles.json",
  "vn-personal-data-protection-law-2025-articles.json",
  "vn-decree-356-2025-provisions.json",
  "vn-decree-13-2023-historical-provisions.json",
  "provisions.json",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isEnglish(language) {
  return /^en(?:-|$)/i.test(language ?? "");
}

function sourceUrl(source) {
  return typeof source === "string" ? source : source?.url;
}

function sourceLabel(source) {
  return typeof source === "string" ? source : source?.label;
}

function sourceVersionLabel(record, translation) {
  const translationSourceVersion = translation?.sourceVersion;
  const recordSourceVersion = record.sourceVersion;
  return (
    translation?.versionLabel ??
    translation?.versionAsOf ??
    (typeof translationSourceVersion === "string"
      ? translationSourceVersion
      : translationSourceVersion?.versionLabel ??
        translationSourceVersion?.lastVersion ??
        translationSourceVersion?.consolidatedAsOf ??
        translationSourceVersion?.effectiveRevisionDate ??
        translationSourceVersion?.asOf) ??
    record.versionAsOf ??
    (typeof recordSourceVersion === "string"
      ? recordSourceVersion
      : recordSourceVersion?.versionLabel ??
        recordSourceVersion?.label ??
        recordSourceVersion?.versionNote ??
        recordSourceVersion?.effectiveFrom) ??
    record.retrievedOn
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function containsParagraphsInOrder(fullText, paragraphs) {
  let cursor = 0;
  for (const paragraph of paragraphs) {
    const next = fullText.indexOf(paragraph, cursor);
    if (next === -1) return false;
    cursor = next + paragraph.length;
  }
  return true;
}

function isTemporallyMismatched(translation) {
  if (translation.currentTextEquivalent === true) return false;
  if (translation.currentTextEquivalent === false) return true;
  return /historical|next-phase|not-current|superseded|outdated/i.test(
    `${translation.coverageStatus ?? ""} ${translation.status ?? ""}`,
  );
}

function classifyCoverage(total, translated, temporallyMismatched) {
  if (translated === 0) return "no-stored-english-legal-text";
  const hasVersionBoundary = temporallyMismatched > 0;
  if (translated === total) {
    return hasVersionBoundary
      ? "complete-stored-english-with-version-boundaries"
      : "complete-stored-english";
  }
  return hasVersionBoundary
    ? "partial-stored-english-with-version-boundaries"
    : "partial-stored-english";
}

const groups = [];

for (const corpusFile of corpusFiles) {
  const rawRecords = JSON.parse(
    await readFile(resolve(dataRoot, corpusFile), "utf8"),
  );
  const records = (
    corpusFile === "provisions.json"
      ? rawRecords.filter(
          (record) => record.instrumentId === "cn-cybersecurity-law",
        )
      : rawRecords
  ).map((record) =>
    record.language
      ? record
      : {
          ...record,
          language: record.textAvailability?.language,
          retrievedOn: record.source?.accessedOn,
        },
  );
  assert(Array.isArray(records) && records.length, `${corpusFile} is empty`);

  const byInstrument = Map.groupBy(records, (record) => record.instrumentId);
  for (const [instrumentId, units] of byInstrument) {
    assert(instrumentId, `${corpusFile} has a unit without instrumentId`);
    assert(
      units.every((unit) => !isEnglish(unit.language)),
      `${corpusFile} must contain only non-English source-language units`,
    );

    const translatedUnits = [];
    const missingUnits = [];

    for (const unit of units) {
      assert(
        Array.isArray(unit.paragraphs) && unit.paragraphs.length,
        `${unit.id} has no source-language paragraphs`,
      );
      assert(
        typeof unit.fullText === "string" &&
          containsParagraphsInOrder(unit.fullText, unit.paragraphs),
        `${unit.id} source fullText does not contain its paragraphs in order`,
      );

      const translation = unit.translations?.en;
      if (translation) {
        assert(
          Array.isArray(translation.paragraphs) &&
            translation.paragraphs.length,
          `${unit.id}.translations.en has no paragraphs`,
        );
        assert(
          typeof translation.fullText === "string" &&
            containsParagraphsInOrder(
              translation.fullText,
              translation.paragraphs,
            ),
          `${unit.id}.translations.en fullText does not contain its paragraphs in order`,
        );
        assert(
          typeof translation.status === "string" && translation.status.length,
          `${unit.id}.translations.en has no authority status`,
        );
        assert(
          /^https?:\/\//.test(
            sourceUrl(translation.source ?? unit.source) ?? "",
          ),
          `${unit.id}.translations.en has no web source`,
        );
        assert(
          typeof (translation.note ?? translation.authorityNote) === "string",
          `${unit.id}.translations.en has no authority note`,
        );
        assert(
          sourceVersionLabel(unit, translation),
          `${unit.id}.translations.en has no version boundary`,
        );
        assert(
          !/this (?:article|section|provision).{0,160}mapped to|complete official .{0,80}wording is available in the original-language view/is.test(
            translation.fullText,
          ),
          `${unit.id}.translations.en contains an editorial placeholder`,
        );
        translatedUnits.push(unit);
      } else {
        const availability = unit.englishAvailability;
        assert(
          availability && typeof availability === "object",
          `${unit.id} needs an explicit englishAvailability gap record`,
        );
        assert(
          availability.coverageStatus && availability.status,
          `${unit.id}.englishAvailability needs coverage and status labels`,
        );
        assert(
          availability.authorityNote ?? availability.note,
          `${unit.id}.englishAvailability needs an authority or coverage note`,
        );
        missingUnits.push(unit);
      }
    }

    const translations = translatedUnits.map((unit) => unit.translations.en);
    const temporallyMismatchedUnits = translatedUnits.filter((unit) =>
      isTemporallyMismatched(unit.translations.en),
    );
    const currentAlignedUnits = translatedUnits.filter(
      (unit) => !isTemporallyMismatched(unit.translations.en),
    );
    const coverageStatuses = unique(
      translations.map(
        (translation) =>
          translation.coverageStatus ?? "stored-source-aligned",
      ),
    );
    const sourceRecords = unique(
      translatedUnits.map((unit) =>
        sourceUrl(unit.translations.en.source ?? unit.source),
      ),
    ).map((url) => {
      const unit = translatedUnits.find(
        (candidate) =>
          sourceUrl(candidate.translations.en.source ?? candidate.source) ===
          url,
      );
      return {
        url,
        label:
          unit.translations.en.sourceLabel ??
          sourceLabel(unit.translations.en.source ?? unit.source) ??
          "English text source",
      };
    });

    groups.push({
      instrumentId,
      corpusFile,
      originalLanguages: unique(units.map((unit) => unit.language)),
      totalUnitCount: units.length,
      storedEnglishUnitCount: translatedUnits.length,
      currentAlignedEnglishUnitCount: currentAlignedUnits.length,
      temporallyMismatchedEnglishUnitCount: temporallyMismatchedUnits.length,
      missingEnglishUnitCount: missingUnits.length,
      completionPercent: Number(
        ((translatedUnits.length / units.length) * 100).toFixed(1),
      ),
      coverageStatus: classifyCoverage(
        units.length,
        translatedUnits.length,
        temporallyMismatchedUnits.length,
      ),
      translationStatuses: unique(
        translations.map((translation) => translation.status),
      ),
      unitCoverageStatuses: coverageStatuses,
      versionLabels: unique(
        translatedUnits.map((unit) =>
          sourceVersionLabel(unit, unit.translations.en),
        ),
      ),
      englishSourceRecords: sourceRecords,
      missingUnitIds: missingUnits.map((unit) => unit.id),
      missingCoverageStatuses: unique(
        missingUnits.map(
          (unit) => unit.englishAvailability?.coverageStatus,
        ),
      ),
    });
  }
}

groups.sort((left, right) =>
  left.instrumentId.localeCompare(right.instrumentId),
);

const totalUnitCount = groups.reduce(
  (sum, group) => sum + group.totalUnitCount,
  0,
);
const storedEnglishUnitCount = groups.reduce(
  (sum, group) => sum + group.storedEnglishUnitCount,
  0,
);
const currentAlignedEnglishUnitCount = groups.reduce(
  (sum, group) => sum + group.currentAlignedEnglishUnitCount,
  0,
);
const temporallyMismatchedEnglishUnitCount = groups.reduce(
  (sum, group) => sum + group.temporallyMismatchedEnglishUnitCount,
  0,
);

const audit = {
  schemaVersion: "2.0",
  reviewedOn,
  scope:
    "Complete locally imported corpora whose controlling/default stored text is not English. The audit distinguishes stored English legal text from explicit coverage gaps; it does not treat concept mappings or summaries as translations.",
  totals: {
    corpusCount: groups.length,
    totalUnitCount,
    storedEnglishUnitCount,
    currentAlignedEnglishUnitCount,
    temporallyMismatchedEnglishUnitCount,
    missingEnglishUnitCount: totalUnitCount - storedEnglishUnitCount,
    completionPercent: Number(
      ((storedEnglishUnitCount / totalUnitCount) * 100).toFixed(1),
    ),
    currentAlignedPercent: Number(
      ((currentAlignedEnglishUnitCount / totalUnitCount) * 100).toFixed(1),
    ),
  },
  corpora: groups,
};

await writeFile(
  resolve(dataRoot, "english-corpus-coverage.json"),
  `${JSON.stringify(audit, null, 2)}\n`,
);

console.log(
  `Wrote English corpus audit for ${groups.length} corpora: ${storedEnglishUnitCount}/${totalUnitCount} units with stored English legal text; ${currentAlignedEnglishUnitCount} current-aligned and ${temporallyMismatchedEnglishUnitCount} version-mismatched.`,
);
