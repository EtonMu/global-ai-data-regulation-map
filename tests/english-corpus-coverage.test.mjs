import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const audit = JSON.parse(
  await readFile(new URL("english-corpus-coverage.json", dataRoot), "utf8"),
);
const instruments = JSON.parse(
  await readFile(new URL("instruments.json", dataRoot), "utf8"),
);

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

test("foreign-language English coverage audit matches every stored corpus unit", async () => {
  let totalUnitCount = 0;
  let storedEnglishUnitCount = 0;
  let currentAlignedEnglishUnitCount = 0;
  let temporallyMismatchedEnglishUnitCount = 0;

  for (const corpus of audit.corpora) {
    const records = JSON.parse(
      await readFile(new URL(corpus.corpusFile, dataRoot), "utf8"),
    ).filter(
      (record) =>
        record.instrumentId ===
        (corpus.sourceInstrumentId ?? corpus.instrumentId),
    );
    const translated = records.filter((record) => record.translations?.en);
    const missing = records.filter((record) => !record.translations?.en);

    assert.equal(records.length, corpus.totalUnitCount, corpus.instrumentId);
    assert.equal(
      translated.length,
      corpus.storedEnglishUnitCount,
      corpus.instrumentId,
    );
    const temporallyMismatched = translated.filter((record) =>
      isTemporallyMismatched(record.translations.en),
    );
    assert.equal(
      temporallyMismatched.length,
      corpus.temporallyMismatchedEnglishUnitCount,
      corpus.instrumentId,
    );
    assert.equal(
      translated.length - temporallyMismatched.length,
      corpus.currentAlignedEnglishUnitCount,
      corpus.instrumentId,
    );
    assert.deepEqual(
      missing.map((record) => record.id),
      corpus.missingUnitIds,
      corpus.instrumentId,
    );

    for (const record of records) {
      const translation = record.translations?.en;
      if (!translation) {
        assert.ok(record.englishAvailability, `${record.id} has no gap record`);
        assert.ok(
          record.englishAvailability.authorityNote ??
            record.englishAvailability.note,
          `${record.id} has no English authority or coverage note`,
        );
        continue;
      }

      assert.ok(
        containsParagraphsInOrder(
          translation.fullText,
          translation.paragraphs,
        ),
        `${record.id} English fullText does not contain its paragraphs in order`,
      );
      assert.ok(translation.status, `${record.id} has no translation status`);
      assert.ok(
        translation.source ?? record.source,
        `${record.id} has no translation or controlling source`,
      );
      assert.doesNotMatch(
        translation.fullText,
        /this (?:article|section|provision).{0,160}mapped to|complete official .{0,80}wording is available in the original-language view/is,
        `${record.id} contains an English editorial placeholder`,
      );
    }

    totalUnitCount += records.length;
    storedEnglishUnitCount += translated.length;
    currentAlignedEnglishUnitCount +=
      translated.length - temporallyMismatched.length;
    temporallyMismatchedEnglishUnitCount += temporallyMismatched.length;
  }

  assert.equal(totalUnitCount, audit.totals.totalUnitCount);
  assert.equal(
    storedEnglishUnitCount,
    audit.totals.storedEnglishUnitCount,
  );
  assert.equal(
    totalUnitCount - storedEnglishUnitCount,
    audit.totals.missingEnglishUnitCount,
  );
  assert.equal(
    currentAlignedEnglishUnitCount,
    audit.totals.currentAlignedEnglishUnitCount,
  );
  assert.equal(
    temporallyMismatchedEnglishUnitCount,
    audit.totals.temporallyMismatchedEnglishUnitCount,
  );
});

test("the named China and Japan examples expose real English legal text", () => {
  const byInstrument = new Map(
    audit.corpora.map((corpus) => [corpus.instrumentId, corpus]),
  );

  assert.equal(
    byInstrument.get("cn-network-data-regulations")?.storedEnglishUnitCount,
    64,
  );
  assert.equal(byInstrument.get("cn-pipl")?.storedEnglishUnitCount, 74);
  assert.equal(
    byInstrument.get("cn-cybersecurity-law")?.storedEnglishUnitCount,
    81,
  );
  assert.equal(byInstrument.get("jp-appi")?.storedEnglishUnitCount, 208);
  assert.equal(byInstrument.get("jp-appi")?.currentAlignedEnglishUnitCount, 208);
  assert.equal(
    byInstrument.get("jp-appi")?.temporallyMismatchedEnglishUnitCount,
    0,
  );
  assert.equal(byInstrument.get("kr-pipa-2011")?.storedEnglishUnitCount, 138);
  assert.equal(
    byInstrument.get("kr-ai-framework-act-2025")?.storedEnglishUnitCount,
    47,
  );
  assert.equal(
    byInstrument.get("kr-ai-framework-act-2025")
      ?.currentAlignedEnglishUnitCount,
    42,
  );
  assert.equal(
    byInstrument.get("kr-ai-framework-act-2025")
      ?.temporallyMismatchedEnglishUnitCount,
    5,
  );
  assert.equal(
    byInstrument.get("cn-generative-ai-measures")?.coverageStatus,
    "complete-stored-english",
  );
  for (const [instrumentId, expectedCount] of [
    ["br-pl-2338-2023-ai-bill", 79],
    ["id-pdp-law-2022", 76],
    ["tw-executive-yuan-generative-ai-guidelines-2023", 11],
    ["vn-personal-data-protection-law-2025", 39],
    ["vn-pdpl-implementing-decree-356-2025", 55],
    ["vn-personal-data-protection-decree-13-2023", 50],
  ]) {
    assert.equal(
      byInstrument.get(instrumentId)?.storedEnglishUnitCount,
      expectedCount,
      instrumentId,
    );
  }
});

test("coverage records use registry instrument IDs while preserving source IDs", () => {
  const registryIds = new Set(instruments.map((instrument) => instrument.id));
  for (const corpus of audit.corpora) {
    assert.ok(
      registryIds.has(corpus.instrumentId),
      `${corpus.instrumentId} must resolve in instruments.json`,
    );
  }

  const byInstrument = new Map(
    audit.corpora.map((corpus) => [corpus.instrumentId, corpus]),
  );
  assert.equal(
    byInstrument.get("vn-pdpl-implementing-decree-356-2025")
      ?.sourceInstrumentId,
    "vn-decree-356-2025",
  );
  assert.equal(
    byInstrument.get("vn-personal-data-protection-decree-13-2023")
      ?.sourceInstrumentId,
    "vn-decree-13-2023",
  );
});
