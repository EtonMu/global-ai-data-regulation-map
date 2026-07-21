import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dataDirectory = path.join(projectRoot, "data", "v2");
const publicCorpusDirectory = path.join(
  projectRoot,
  "public",
  "data",
  "corpus",
);

// Keep this list aligned with the authoritative corpora merged by the explorer.
// Some instruments only have curated seed provisions; those receive a shard too.
const corpusFiles = [
  "gdpr-articles.json",
  "eu-ai-act-articles.json",
  "uk-gdpr-articles.json",
  "cn-pipl-articles.json",
  "cn-network-data-regulations-articles.json",
  "cn-generative-ai-measures-articles.json",
  "canada-pipeda-provisions.json",
  "brazil-lgpd-articles.json",
  "tw-ai-basic-act-2026-articles.json",
  "tw-personal-data-protection-act-articles.json",
  "sg-pdpa-provisions.json",
  "za-popia-sections.json",
  "ng-ndpa-2023-sections.json",
  "id-pdp-law-2022-articles.json",
  "india-dpdp-act-2023-provisions.json",
  "india-dpdp-rules-2025-provisions.json",
  "uae-federal-pdpl-45-2021-articles.json",
  "sa-pdpl-2021-amended-2023-articles.json",
  "sa-pdpl-implementing-regulation-2023-articles.json",
  "sa-pdpl-transfer-regulation-2023-articles.json",
  "au-privacy-act-1988-provisions.json",
  "jp-appi-current-articles.json",
  "jp-ai-promotion-act-2025-articles.json",
  "hk-pdpo-486-provisions.json",
  "ch-fadp-2020-provisions.json",
  "vn-personal-data-protection-law-2025-articles.json",
  "vn-decree-356-2025-provisions.json",
  "vn-decree-13-2023-historical-provisions.json",
  "kr-pipa-2011-current-articles.json",
  "kr-ai-framework-act-2025-current-articles.json",
  "us-executive-orders-provisions.json",
  "tw-executive-yuan-generative-ai-guidelines-2023-points.json",
  "br-ai-bill-2338-2023-articles.json",
  "us-ca-sb1047-2024-provisions.json",
  "us-co-ai-act-current-provisions.json",
  "us-nist-ai-rmf-1-0-corpus.json",
];

function normalizedInstrumentId(instrumentId) {
  if (instrumentId === "vn-decree-356-2025") {
    return "vn-pdpl-implementing-decree-356-2025";
  }
  if (instrumentId === "vn-decree-13-2023") {
    return "vn-personal-data-protection-decree-13-2023";
  }
  return instrumentId;
}

function compactWhitespace(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function firstEditorialSentence(value, maximumLength = 280) {
  const text = compactWhitespace(value);
  if (!text) return "";
  const sentence = text.match(/^.*?(?:[.!?。！？](?=\s|$)|$)/u)?.[0] ?? text;
  if (sentence.length <= maximumLength) return sentence;
  const clipped = sentence.slice(0, maximumLength);
  const breakAt = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf("; "),
    clipped.lastIndexOf("。"),
    clipped.lastIndexOf("，"),
    clipped.lastIndexOf(", "),
  );
  const shortened = breakAt >= 120 ? clipped.slice(0, breakAt + 1) : clipped;
  return shortened.replace(/\s+\S*$/u, "").trimEnd() + "…";
}

function isAuthorityBoilerplate(value) {
  const text = compactWhitespace(value).toLowerCase();
  return (
    /complete (?:official|authoritative).*(?:text|wording).*(?:stored|available)/u.test(
      text,
    ) ||
    /government-published english reference translation/u.test(text) ||
    /project-authored english reference/u.test(text) ||
    /english text is not co-authentic/u.test(text) ||
    /orientation is not a translation/u.test(text) ||
    /official .* wording is available/u.test(text) ||
    /toàn văn .*chính thức.*(?:lưu|đầy đủ)/u.test(text)
  );
}

function editorialSummary(record) {
  const supplied = compactWhitespace(record.summary);
  if (supplied && !isAuthorityBoilerplate(supplied)) return supplied;
  const english =
    record.translations?.en?.paragraphs?.[0] ??
    record.translations?.en?.fullText ??
    (/^en(?:-|$)/iu.test(record.language ?? "")
      ? record.paragraphs?.[0] ?? record.currentOperativeText ?? record.fullText
      : "");
  const sourceText =
    english ??
    record.paragraphs?.[0] ??
    record.currentOperativeText ??
    record.fullText;
  return (
    firstEditorialSentence(sourceText) ||
    supplied ||
    "Official provision text is available on demand."
  );
}

function slimStructure(structure) {
  if (!structure || typeof structure === "string") return structure ?? null;
  return {
    id: structure.id ?? null,
    label: structure.label ?? "",
    title: structure.title ?? structure.label ?? "",
    ...(structure.originalTitle
      ? { originalTitle: structure.originalTitle }
      : {}),
  };
}

function inferredLegalEffectStatus(record) {
  if (record.legalEffectStatus) return record.legalEffectStatus;
  if (record.instrumentId === "ca-pipeda") {
    return /^\[(?:repealed|modifications)\]$/iu.test(
      compactWhitespace(record.fullText),
    )
      ? "structural-current-consolidation-placeholder"
      : "in-force-current-text";
  }
  if (record.instrumentId === "br-lgpd-2018") {
    if (/vetoed provision/iu.test(record.title ?? "")) {
      return "vetoed-placeholder";
    }
    if (/repealed provision/iu.test(record.title ?? "")) {
      return "repealed-placeholder";
    }
    return "in-force-current-text";
  }
  return record.language === "zh-CN" ? "in-force" : "instrument-status-only";
}

function lightweightArticle(record) {
  return {
    id: record.id,
    instrumentId: record.instrumentId,
    ...(record.articleNumber !== undefined
      ? { articleNumber: record.articleNumber }
      : {}),
    ...(record.sectionNumber !== undefined
      ? { sectionNumber: record.sectionNumber }
      : {}),
    ...(record.ruleNumber !== undefined ? { ruleNumber: record.ruleNumber } : {}),
    ...(record.unitType ? { unitType: record.unitType } : {}),
    label: record.label,
    ...(record.originalLabel ? { originalLabel: record.originalLabel } : {}),
    title: record.title,
    ...(record.originalTitle ? { originalTitle: record.originalTitle } : {}),
    summary: editorialSummary(record),
    chapter: slimStructure(record.chapter),
    ...(record.chapterTitle ? { chapterTitle: record.chapterTitle } : {}),
    section: slimStructure(record.section),
    ...(record.parentId !== undefined ? { parentId: record.parentId } : {}),
    ...(record.provisionType ? { provisionType: record.provisionType } : {}),
    paragraphs: [],
    fullText: "",
    language: record.language,
    textAvailability: record.textAvailability,
    source: record.source,
    ...(record.sourceFragment ? { sourceFragment: record.sourceFragment } : {}),
    ...(record.sourceSubdivision
      ? { sourceSubdivision: record.sourceSubdivision }
      : {}),
    ...(record.canonicalSource ? { canonicalSource: record.canonicalSource } : {}),
    ...(record.sourceLabel ? { sourceLabel: record.sourceLabel } : {}),
    retrievedOn: record.retrievedOn,
    ...(record.appliesFrom !== undefined
      ? { appliesFrom: record.appliesFrom }
      : {}),
    ...(record.effectiveFrom !== undefined
      ? { effectiveFrom: record.effectiveFrom }
      : {}),
    legalEffectStatus: inferredLegalEffectStatus(record),
    ...(record.versionAsOf ? { versionAsOf: record.versionAsOf } : {}),
    ...(record.defaultLanguageStatus
      ? { defaultLanguageStatus: record.defaultLanguageStatus }
      : {}),
    ...(record.sourceVersion?.effectiveFrom
      ? { sourceVersion: { effectiveFrom: record.sourceVersion.effectiveFrom } }
      : {}),
  };
}

function lightweightSeed(record) {
  return {
    id: record.id,
    instrumentId: record.instrumentId,
    locator: record.locator,
    title: record.title,
    ...(record.originalTitle ? { originalTitle: record.originalTitle } : {}),
    provisionType: record.provisionType,
    parentId: record.parentId ?? null,
    summary: editorialSummary(record),
    conceptIds: record.conceptIds ?? [],
    actorTags: record.actorTags ?? [],
    scopeTags: record.scopeTags ?? [],
    legalEffectStatus: record.legalEffectStatus,
    ...(record.versionAsOf ? { versionAsOf: record.versionAsOf } : {}),
    ...(record.appliesFrom !== undefined
      ? { appliesFrom: record.appliesFrom }
      : {}),
    textAvailability: record.textAvailability,
    source: record.source,
    ...(record.supportingSources
      ? { supportingSources: record.supportingSources }
      : {}),
    editorial: record.editorial,
    ...(record.chapter ? { chapter: slimStructure(record.chapter) } : {}),
    ...(record.section ? { section: slimStructure(record.section) } : {}),
    ...(record.articleNumber !== undefined
      ? { articleNumber: record.articleNumber }
      : {}),
    ...(record.defaultLanguageStatus
      ? { defaultLanguageStatus: record.defaultLanguageStatus }
      : {}),
    ...(record.languageAuthorityNote
      ? { languageAuthorityNote: record.languageAuthorityNote }
      : {}),
  };
}

async function readJson(filename) {
  return JSON.parse(await readFile(path.join(dataDirectory, filename), "utf8"));
}

const instruments = await readJson("instruments.json");
const seedProvisions = await readJson("provisions.json");
const sourceCorpora = await Promise.all(
  corpusFiles.map(async (filename) => ({ filename, records: await readJson(filename) })),
);

const articleRecords = sourceCorpora.flatMap(({ filename, records }) => {
  if (!Array.isArray(records)) {
    throw new TypeError(`${filename} must contain a JSON array.`);
  }
  return records;
});
const instrumentIds = new Set(instruments.map((instrument) => instrument.id));
const articlesByInstrument = new Map(
  instruments.map((instrument) => [instrument.id, []]),
);
const seedsByInstrument = new Map(
  instruments.map((instrument) => [instrument.id, []]),
);

for (const article of articleRecords) {
  const instrumentId = normalizedInstrumentId(article.instrumentId);
  if (!instrumentIds.has(instrumentId)) {
    throw new Error(`Corpus article ${article.id} references unknown ${instrumentId}.`);
  }
  articlesByInstrument.get(instrumentId).push(article);
}
for (const provision of seedProvisions) {
  if (!instrumentIds.has(provision.instrumentId)) {
    throw new Error(
      `Seed provision ${provision.id} references unknown ${provision.instrumentId}.`,
    );
  }
  seedsByInstrument.get(provision.instrumentId).push(provision);
}

await mkdir(publicCorpusDirectory, { recursive: true });

const shards = {};
for (const instrument of instruments) {
  const instrumentId = instrument.id;
  const filename = `${instrumentId}.json`;
  const payload = {
    schemaVersion: "1.0.0",
    instrumentId,
    articleRecords: articlesByInstrument.get(instrumentId),
    seedProvisions: seedsByInstrument.get(instrumentId),
  };
  const serializedPayload = JSON.stringify(payload);
  const revision = createHash("sha256")
    .update(serializedPayload)
    .digest("hex")
    .slice(0, 16);
  shards[instrumentId] = `data/corpus/${filename}?v=${revision}`;
  await writeFile(
    path.join(publicCorpusDirectory, filename),
    serializedPayload,
  );
}

const mergedProvisionIds = new Set(articleRecords.map((article) => article.id));
for (const provision of seedProvisions) mergedProvisionIds.add(provision.id);

const clientIndex = {
  schemaVersion: "1.0.0",
  generatedFrom: "authoritative data/v2 corpora",
  totals: {
    instrumentCount: instruments.length,
    importedArticleCount: articleRecords.length,
    seedProvisionCount: seedProvisions.length,
    mergedProvisionCount: mergedProvisionIds.size,
  },
  shards,
  articleRecords: articleRecords.map(lightweightArticle),
  seedProvisions: seedProvisions.map(lightweightSeed),
};

await writeFile(
  path.join(dataDirectory, "client-corpus-index.json"),
  JSON.stringify(clientIndex),
);

process.stdout.write(
  `Generated ${instruments.length} corpus shards and ${mergedProvisionIds.size} lightweight provision records.\n`,
);
