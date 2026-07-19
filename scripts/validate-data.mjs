import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dataRoot = new URL("data/v2/", root);

async function loadJson(filename) {
  const value = JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
  assert(Array.isArray(value), `${filename} must contain a top-level array`);
  return value;
}

const [
  jurisdictions,
  instruments,
  provisions,
  concepts,
  relations,
  statusEvents,
  gdprArticles,
  euAiActArticles,
  structureSummaries,
] = await Promise.all([
  loadJson("jurisdictions.json"),
  loadJson("instruments.json"),
  loadJson("provisions.json"),
  loadJson("concepts.json"),
  loadJson("relations.json"),
  loadJson("status-events.json"),
  loadJson("gdpr-articles.json"),
  loadJson("eu-ai-act-articles.json"),
  loadJson("structure-summaries.json"),
]);

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const jurisdictionTypes = new Set([
  "country",
  "subnational",
  "supranational",
  "international-context",
  "intergovernmental-context",
  "international-organization",
]);
const endpointTypes = new Set(["instrument", "provision"]);
const directionalityValues = new Set(["directed", "undirected"]);
const relationStatuses = new Set(["candidate", "editorial-reviewed"]);
const confidenceValues = new Set(["low", "medium", "high"]);
const structureSummaryLevels = new Set(["section", "hierarchy-root"]);
const instrumentDateFields = [
  "adoptedOn",
  "publishedOn",
  "effectiveFrom",
  "generalApplicationFrom",
  "ceasedOn",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertObject(value, label) {
  assert(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be an object`,
  );
}

function assertString(value, label, minimumLength = 1) {
  assert(
    typeof value === "string" && value.trim().length >= minimumLength,
    `${label} must be a non-empty string`,
  );
}

function assertId(value, label) {
  assertString(value, label);
  assert(idPattern.test(value), `${label} must be a lowercase kebab-case id`);
}

function assertIsoDate(value, label, { nullable = false } = {}) {
  if (value === null && nullable) return;
  assert(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
    `${label} must be an ISO YYYY-MM-DD date${nullable ? " or null" : ""}`,
  );
  const parsed = new Date(`${value}T00:00:00.000Z`);
  assert(
    !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value,
    `${label} is not a real calendar date`,
  );
}

function assertHttpsUrl(value, label) {
  assertString(value, label);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  assert(parsed.protocol === "https:", `${label} must use HTTPS`);
  assert(parsed.hostname.length > 0, `${label} must include a hostname`);
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    assertObject(item, label);
    assertId(item.id, `${label} id`);
    assert(!seen.has(item.id), `Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

function assertStringArray(
  value,
  label,
  { allowEmpty = false, allowDuplicates = false } = {},
) {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(allowEmpty || value.length > 0, `${label} must not be empty`);
  const seen = new Set();
  value.forEach((item, index) => {
    assertString(item, `${label}[${index}]`);
    assert(
      allowDuplicates || !seen.has(item),
      `${label} contains duplicate value: ${item}`,
    );
    seen.add(item);
  });
}

function assertReferenceArray(value, knownIds, label) {
  assertStringArray(value, label);
  for (const id of value) {
    assert(knownIds.has(id), `${label} references missing id: ${id}`);
  }
}

function assertSource(source, label, { requireAccessedOn = false } = {}) {
  assertObject(source, label);
  assertHttpsUrl(source.url, `${label}.url`);
  assertString(source.label, `${label}.label`);
  if (requireAccessedOn) {
    assertIsoDate(source.accessedOn, `${label}.accessedOn`);
  } else if (source.accessedOn !== undefined) {
    assertIsoDate(source.accessedOn, `${label}.accessedOn`);
  }
}

function assertTextAvailability(value, label) {
  assertObject(value, label);
  assertString(value.mode, `${label}.mode`);
  assert(
    typeof value.stored === "boolean",
    `${label}.stored must be a boolean`,
  );
  assert(
    typeof value.language === "string" &&
      languagePattern.test(value.language),
    `${label}.language must be a BCP 47-style language tag`,
  );
  if (value.note !== undefined) {
    assertString(value.note, `${label}.note`, 20);
  }
}

const jurisdictionIds = assertUnique(jurisdictions, "jurisdiction");
const instrumentIds = assertUnique(instruments, "instrument");
const provisionIds = assertUnique(provisions, "provision");
const conceptIds = assertUnique(concepts, "concept");
assertUnique(relations, "relation");
assertUnique(statusEvents, "status event");
const gdprArticleIds = assertUnique(gdprArticles, "GDPR article");
const euAiActArticleIds = assertUnique(euAiActArticles, "EU AI Act article");

for (const jurisdiction of jurisdictions) {
  assertString(jurisdiction.name, `${jurisdiction.id}.name`);
  assertString(jurisdiction.shortName, `${jurisdiction.id}.shortName`);
  assert(
    jurisdictionTypes.has(jurisdiction.type),
    `${jurisdiction.id}.type is not a supported jurisdiction type`,
  );
  assertString(jurisdiction.description, `${jurisdiction.id}.description`, 20);
  if (jurisdiction.parentId !== null) {
    assertId(jurisdiction.parentId, `${jurisdiction.id}.parentId`);
    assert(
      jurisdictionIds.has(jurisdiction.parentId),
      `${jurisdiction.id} references missing parent jurisdiction ${jurisdiction.parentId}`,
    );
    assert(
      jurisdiction.parentId !== jurisdiction.id,
      `${jurisdiction.id} cannot be its own parent`,
    );
  }
  if (jurisdiction.isoCode !== null) {
    assert(
      typeof jurisdiction.isoCode === "string" &&
        /^[A-Z]{2}(?:-[A-Z0-9]{2,3})?$/.test(jurisdiction.isoCode),
      `${jurisdiction.id}.isoCode must be an uppercase ISO-like code or null`,
    );
  }
}

for (const jurisdiction of jurisdictions) {
  const visited = new Set([jurisdiction.id]);
  let parentId = jurisdiction.parentId;
  while (parentId !== null) {
    assert(
      !visited.has(parentId),
      `Jurisdiction parent cycle detected at ${jurisdiction.id}`,
    );
    visited.add(parentId);
    parentId = jurisdictions.find((item) => item.id === parentId)?.parentId ?? null;
  }
}

for (const concept of concepts) {
  assertString(concept.label, `${concept.id}.label`);
  assertString(concept.family, `${concept.id}.family`);
  assertString(concept.description, `${concept.id}.description`, 30);
  assertStringArray(concept.aliases, `${concept.id}.aliases`, {
    allowEmpty: true,
  });
}

for (const instrument of instruments) {
  assertString(instrument.shortTitle, `${instrument.id}.shortTitle`);
  assertString(instrument.title, `${instrument.id}.title`);
  assert(
    jurisdictionIds.has(instrument.jurisdictionId),
    `${instrument.id} references missing jurisdiction ${instrument.jurisdictionId}`,
  );
  assertStringArray(instrument.issuingBodies, `${instrument.id}.issuingBodies`);
  for (const field of [
    "category",
    "hierarchyLevel",
    "legalForce",
    "lifecycleStatus",
    "version",
  ]) {
    assertString(instrument[field], `${instrument.id}.${field}`);
  }
  assertIsoDate(instrument.statusAsOf, `${instrument.id}.statusAsOf`);
  assertObject(instrument.dates, `${instrument.id}.dates`);
  for (const field of instrumentDateFields) {
    assert(
      Object.hasOwn(instrument.dates, field),
      `${instrument.id}.dates is missing ${field}`,
    );
    assertIsoDate(instrument.dates[field], `${instrument.id}.dates.${field}`, {
      nullable: true,
    });
  }
  if (instrument.dates.adoptedOn && instrument.dates.publishedOn) {
    assert(
      instrument.dates.adoptedOn <= instrument.dates.publishedOn,
      `${instrument.id} is published before its adoption date`,
    );
  }
  if (instrument.dates.effectiveFrom && instrument.dates.generalApplicationFrom) {
    assert(
      instrument.dates.effectiveFrom <= instrument.dates.generalApplicationFrom,
      `${instrument.id} generally applies before entering into force`,
    );
  }
  if (instrument.dates.effectiveFrom && instrument.dates.ceasedOn) {
    assert(
      instrument.dates.effectiveFrom <= instrument.dates.ceasedOn,
      `${instrument.id} ceases before entering into force`,
    );
  }
  if (instrument.parentInstrumentId !== null) {
    assert(
      instrumentIds.has(instrument.parentInstrumentId),
      `${instrument.id} references missing parent instrument ${instrument.parentInstrumentId}`,
    );
    assert(
      instrument.parentInstrumentId !== instrument.id,
      `${instrument.id} cannot be its own parent`,
    );
  }
  assertReferenceArray(
    instrument.topicIds,
    conceptIds,
    `${instrument.id}.topicIds`,
  );
  assertString(instrument.summary, `${instrument.id}.summary`, 40);
  assertString(instrument.statusNote, `${instrument.id}.statusNote`, 40);
  assertSource(instrument.source, `${instrument.id}.source`, {
    requireAccessedOn: true,
  });
  assertTextAvailability(
    instrument.textAvailability,
    `${instrument.id}.textAvailability`,
  );
}

for (const provision of provisions) {
  assert(
    instrumentIds.has(provision.instrumentId),
    `${provision.id} references missing instrument ${provision.instrumentId}`,
  );
  for (const field of ["locator", "title", "provisionType", "legalEffectStatus"]) {
    assertString(provision[field], `${provision.id}.${field}`);
  }
  if (provision.parentId !== null) {
    assert(
      provisionIds.has(provision.parentId),
      `${provision.id} references missing parent provision ${provision.parentId}`,
    );
    assert(
      provision.parentId !== provision.id,
      `${provision.id} cannot be its own parent`,
    );
  }
  assertString(provision.summary, `${provision.id}.summary`, 40);
  assertReferenceArray(
    provision.conceptIds,
    conceptIds,
    `${provision.id}.conceptIds`,
  );
  assertStringArray(provision.actorTags, `${provision.id}.actorTags`);
  assertStringArray(provision.scopeTags, `${provision.id}.scopeTags`);
  assertIsoDate(provision.appliesFrom, `${provision.id}.appliesFrom`, {
    nullable: true,
  });
  assertTextAvailability(
    provision.textAvailability,
    `${provision.id}.textAvailability`,
  );
  assertSource(provision.source, `${provision.id}.source`, {
    requireAccessedOn: true,
  });
  assertObject(provision.editorial, `${provision.id}.editorial`);
  assertString(
    provision.editorial.reviewStatus,
    `${provision.id}.editorial.reviewStatus`,
  );
  assertIsoDate(
    provision.editorial.reviewedOn,
    `${provision.id}.editorial.reviewedOn`,
  );
  if (provision.editorial.note !== undefined) {
    assertString(
      provision.editorial.note,
      `${provision.id}.editorial.note`,
      20,
    );
  }
}

function validateOfficialArticles({
  articles,
  articleIds,
  expectedCount,
  instrumentId,
  idPrefix,
  source,
  label,
}) {
  assert(
    articles.length === expectedCount,
    `${label} corpus must contain exactly ${expectedCount} Articles; found ${articles.length}`,
  );
  const chapterDefinitions = new Map();
  const sectionDefinitions = new Map();

  articles.forEach((article, index) => {
    const expectedNumber = String(index + 1);
    const expectedId = `${idPrefix}${expectedNumber}`;
    assert(
      article.articleNumber === expectedNumber,
      `${label} corpus is missing or misorders Article ${expectedNumber}`,
    );
    assert(article.id === expectedId, `${label} Article ${expectedNumber} has id ${article.id}`);
    assert(articleIds.has(expectedId), `${label} is missing ${expectedId}`);
    assert(
      article.instrumentId === instrumentId,
      `${article.id} references the wrong instrument`,
    );
    assert(article.label === `Article ${expectedNumber}`, `${article.id} has an invalid label`);
    assertString(article.title, `${article.id}.title`);
    assertObject(article.chapter, `${article.id}.chapter`);
    assertString(article.chapter.id, `${article.id}.chapter.id`);
    assertString(article.chapter.label, `${article.id}.chapter.label`);
    assertString(article.chapter.title, `${article.id}.chapter.title`);

    const chapterDefinition = JSON.stringify({
      label: article.chapter.label,
      title: article.chapter.title,
    });
    const previousDefinition = chapterDefinitions.get(article.chapter.id);
    assert(
      previousDefinition === undefined || previousDefinition === chapterDefinition,
      `${article.id} reuses chapter ${article.chapter.id} with different labels`,
    );
    chapterDefinitions.set(article.chapter.id, chapterDefinition);

    if (article.section !== null) {
      assertObject(article.section, `${article.id}.section`);
      assertString(article.section.id, `${article.id}.section.id`);
      assertString(article.section.label, `${article.id}.section.label`);
      assertString(article.section.title, `${article.id}.section.title`);

      const sectionDefinition = JSON.stringify({
        label: article.section.label,
        title: article.section.title,
      });
      const previousSectionDefinition = sectionDefinitions.get(article.section.id);
      assert(
        previousSectionDefinition === undefined ||
          previousSectionDefinition === sectionDefinition,
        `${article.id} reuses section ${article.section.id} with different labels`,
      );
      sectionDefinitions.set(article.section.id, sectionDefinition);
    }
    assertStringArray(article.paragraphs, `${article.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assertString(article.fullText, `${article.id}.fullText`, 20);
    assert(
      article.fullText === article.paragraphs.join("\n\n"),
      `${article.id}.fullText does not match its paragraph sequence`,
    );
    assert(article.language === "en", `${article.id}.language must be en`);
    assert(
      article.textAvailability === "full",
      `${article.id}.textAvailability must be full`,
    );
    assert(article.source === source, `${article.id}.source is not the canonical ELI source`);
    assert(
      article.sourceFragment === `${source}#art_${expectedNumber}`,
      `${article.id}.sourceFragment does not target its Article anchor`,
    );
    assertIsoDate(article.retrievedOn, `${article.id}.retrievedOn`);
  });

  const instrument = instruments.find((item) => item.id === instrumentId);
  assert(instrument, `${label} instrument metadata is missing`);
  assert(
    instrument.textAvailability.mode === "separate-official-import",
    `${instrumentId} must declare its separate official import`,
  );
  assert(
    articles.every((article) => article.retrievedOn === instrument.statusAsOf),
    `${label} retrieval dates must match the instrument snapshot date`,
  );
}

validateOfficialArticles({
  articles: gdprArticles,
  articleIds: gdprArticleIds,
  expectedCount: 99,
  instrumentId: "eu-gdpr",
  idPrefix: "eu-gdpr-art-",
  source: "https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng",
  label: "GDPR",
});

validateOfficialArticles({
  articles: euAiActArticles,
  articleIds: euAiActArticleIds,
  expectedCount: 113,
  instrumentId: "eu-ai-act",
  idPrefix: "eu-ai-act-art-",
  source: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
  label: "EU AI Act",
});

for (const articleId of gdprArticleIds) {
  assert(!euAiActArticleIds.has(articleId), `Official Article id collision: ${articleId}`);
}

const combinedProvisionIds = new Set([
  ...provisionIds,
  ...gdprArticleIds,
  ...euAiActArticleIds,
]);
const provisionInstrumentById = new Map();
for (const provision of provisions) {
  provisionInstrumentById.set(provision.id, provision.instrumentId);
}
for (const article of [...gdprArticles, ...euAiActArticles]) {
  const existingInstrumentId = provisionInstrumentById.get(article.id);
  assert(
    existingInstrumentId === undefined ||
      existingInstrumentId === article.instrumentId,
    `${article.id} is assigned to conflicting instruments`,
  );
  provisionInstrumentById.set(article.id, article.instrumentId);
}
for (const provision of provisions) {
  if (gdprArticleIds.has(provision.id) || euAiActArticleIds.has(provision.id)) {
    const article = [...gdprArticles, ...euAiActArticles].find(
      (item) => item.id === provision.id,
    );
    assert(
      article.instrumentId === provision.instrumentId,
      `${provision.id} curated metadata conflicts with its official import`,
    );
  }
}

const structureSummaryKeys = new Set();
for (const summary of structureSummaries) {
  assertObject(summary, "structure summary");
  assertString(summary.id, "structure summary id");
  assert(
    instrumentIds.has(summary.instrumentId),
    `${summary.id} references missing instrument ${summary.instrumentId}`,
  );
  assertString(summary.structureId, `${summary.id}.structureId`);
  assert(
    structureSummaryLevels.has(summary.level),
    `${summary.id}.level must be section or hierarchy-root`,
  );

  const compositeKey = `${summary.instrumentId}::${summary.structureId}`;
  assert(
    summary.id === compositeKey,
    `${summary.id} must equal its instrumentId::structureId composite key`,
  );
  assert(
    !structureSummaryKeys.has(compositeKey),
    `Duplicate structure summary composite key: ${compositeKey}`,
  );
  structureSummaryKeys.add(compositeKey);

  assertString(summary.label, `${summary.id}.label`);
  assertString(summary.title, `${summary.id}.title`);
  assertString(summary.summary, `${summary.id}.summary`, 60);
  assertReferenceArray(
    summary.conceptIds,
    conceptIds,
    `${summary.id}.conceptIds`,
  );
  assert(
    Array.isArray(summary.sourceBasis) && summary.sourceBasis.length > 0,
    `${summary.id}.sourceBasis must contain at least one source`,
  );

  const citedProvisionIds = new Set();
  summary.sourceBasis.forEach((source, index) => {
    const sourceLabel = `${summary.id}.sourceBasis[${index}]`;
    assertSource(source, sourceLabel);
    assertReferenceArray(
      source.provisionIds,
      combinedProvisionIds,
      `${sourceLabel}.provisionIds`,
    );
    for (const provisionId of source.provisionIds) {
      assert(
        provisionInstrumentById.get(provisionId) === summary.instrumentId,
        `${sourceLabel} cites ${provisionId} from a different instrument`,
      );
      citedProvisionIds.add(provisionId);
    }
  });

  assertObject(summary.editorial, `${summary.id}.editorial`);
  assert(
    summary.editorial.reviewStatus === "editorial-high-level-summary",
    `${summary.id}.editorial.reviewStatus must identify a high-level summary`,
  );
  assertIsoDate(
    summary.editorial.reviewedOn,
    `${summary.id}.editorial.reviewedOn`,
  );
  assertString(summary.editorial.note, `${summary.id}.editorial.note`, 40);

  if (summary.level === "hierarchy-root") {
    assert(
      provisionIds.has(summary.structureId),
      `${summary.id} hierarchy-root must reference a seeded provision`,
    );
    assert(
      provisionInstrumentById.get(summary.structureId) === summary.instrumentId,
      `${summary.id} hierarchy-root belongs to a different instrument`,
    );
    assert(
      citedProvisionIds.has(summary.structureId),
      `${summary.id}.sourceBasis must cite its seeded hierarchy root`,
    );
  }
}

function collectOfficialSections(articles, label) {
  const sections = new Map();
  for (const article of articles) {
    if (article.section === null) continue;
    const key = `${article.instrumentId}::${article.section.id}`;
    const existing = sections.get(key) ?? {
      instrumentId: article.instrumentId,
      section: article.section,
      articleIds: [],
    };
    assert(
      existing.section.label === article.section.label &&
        existing.section.title === article.section.title,
      `${label} section ${article.section.id} has inconsistent metadata`,
    );
    existing.articleIds.push(article.id);
    sections.set(key, existing);
  }
  return sections;
}

const officialSections = new Map([
  ...collectOfficialSections(gdprArticles, "GDPR"),
  ...collectOfficialSections(euAiActArticles, "EU AI Act"),
]);
for (const [key, officialSection] of officialSections) {
  const summary = structureSummaries.find((item) => item.id === key);
  assert(summary, `Official section is missing a high-level summary: ${key}`);
  assert(summary.level === "section", `${key} summary must use level section`);
  assert(summary.label === officialSection.section.label, `${key}.label does not match the official section`);
  assert(summary.title === officialSection.section.title, `${key}.title does not match the official section`);
  const citedIds = new Set(
    summary.sourceBasis.flatMap((source) => source.provisionIds),
  );
  for (const articleId of officialSection.articleIds) {
    assert(
      citedIds.has(articleId),
      `${key}.sourceBasis does not cite official provision ${articleId}`,
    );
  }
}

for (const instrumentId of ["eu-gdpr", "eu-ai-act"]) {
  const officialCount = [...officialSections.values()].filter(
    (section) => section.instrumentId === instrumentId,
  ).length;
  const summaryCount = structureSummaries.filter(
    (summary) =>
      summary.instrumentId === instrumentId && summary.level === "section",
  ).length;
  assert(
    summaryCount === officialCount,
    `${instrumentId} must have exactly one summary for each of its ${officialCount} official sections; found ${summaryCount}`,
  );
}

const relationSignatures = new Set();
for (const relation of relations) {
  assertObject(relation.source, `${relation.id}.source`);
  assertObject(relation.target, `${relation.id}.target`);
  for (const [side, endpoint] of [
    ["source", relation.source],
    ["target", relation.target],
  ]) {
    assert(
      endpointTypes.has(endpoint.type),
      `${relation.id}.${side}.type must be instrument or provision`,
    );
    assertId(endpoint.id, `${relation.id}.${side}.id`);
    const knownIds =
      endpoint.type === "instrument" ? instrumentIds : combinedProvisionIds;
    assert(
      knownIds.has(endpoint.id),
      `${relation.id}.${side} references missing ${endpoint.type} ${endpoint.id}`,
    );
  }
  assert(
    relation.source.type !== relation.target.type ||
      relation.source.id !== relation.target.id,
    `${relation.id} cannot connect a node to itself`,
  );
  assertString(relation.type, `${relation.id}.type`);
  assert(
    idPattern.test(relation.type),
    `${relation.id}.type must be lowercase kebab-case`,
  );
  assert(
    directionalityValues.has(relation.directionality),
    `${relation.id}.directionality must be directed or undirected`,
  );
  assertReferenceArray(
    relation.conceptIds,
    conceptIds,
    `${relation.id}.conceptIds`,
  );
  assert(
    relationStatuses.has(relation.status),
    `${relation.id}.status must be candidate or editorial-reviewed`,
  );
  assert(
    confidenceValues.has(relation.confidence),
    `${relation.id}.confidence must be low, medium, or high`,
  );
  assertString(relation.evidenceBasis, `${relation.id}.evidenceBasis`);
  assertString(relation.rationale, `${relation.id}.rationale`, 40);
  assertString(relation.limits, `${relation.id}.limits`, 60);
  assertIsoDate(relation.verifiedOn, `${relation.id}.verifiedOn`);
  assert(
    Array.isArray(relation.sourceSupport) && relation.sourceSupport.length >= 2,
    `${relation.id}.sourceSupport must cite at least two primary sources`,
  );
  relation.sourceSupport.forEach((sourceItem, index) =>
    assertSource(sourceItem, `${relation.id}.sourceSupport[${index}]`),
  );

  const left = `${relation.source.type}:${relation.source.id}`;
  const right = `${relation.target.type}:${relation.target.id}`;
  const endpoints =
    relation.directionality === "undirected"
      ? [left, right].sort().join("|")
      : `${left}|${right}`;
  const signature = `${relation.type}|${relation.directionality}|${endpoints}`;
  assert(
    !relationSignatures.has(signature),
    `${relation.id} duplicates an existing relation assertion`,
  );
  relationSignatures.add(signature);
}

const eventCountByInstrument = new Map();
for (const event of statusEvents) {
  assert(
    instrumentIds.has(event.instrumentId),
    `${event.id} references missing instrument ${event.instrumentId}`,
  );
  assertIsoDate(event.date, `${event.id}.date`);
  for (const field of ["type", "label", "effect", "resultingStatus"]) {
    assertString(event[field], `${event.id}.${field}`);
  }
  assertSource(event.source, `${event.id}.source`);
  eventCountByInstrument.set(
    event.instrumentId,
    (eventCountByInstrument.get(event.instrumentId) ?? 0) + 1,
  );
}
for (const instrumentId of instrumentIds) {
  assert(
    eventCountByInstrument.has(instrumentId),
    `${instrumentId} has no auditable lifecycle event`,
  );
}

const requiredJurisdictionIds = [
  "eu",
  "us",
  "us-ca",
  "cn",
  "gb",
  "jp",
  "ca",
  "in",
  "g7",
  "un",
];
for (const id of requiredJurisdictionIds) {
  assert(jurisdictionIds.has(id), `Required jurisdiction is missing: ${id}`);
}

const requiredInstrumentIds = [
  "eu-gdpr",
  "eu-ai-act",
  "us-eo-14110",
  "us-eo-14179",
  "us-ca-sb-1047-2024",
  "us-nist-ai-rmf-1-0",
  "cn-pipl",
  "cn-cybersecurity-law",
  "cn-network-data-regulations",
  "cn-generative-ai-measures",
  "gb-uk-gdpr",
  "jp-appi",
  "jp-ai-guidelines-business-1-2",
  "ca-pipeda",
  "ca-directive-automated-decision-making",
  "in-dpdp-act-2023",
  "in-dpdp-rules-2025",
  "g7-hiroshima-ai-process",
  "un-ai-advisory-final-report-2024",
  "iso-iec-42001-2023",
  "ieee-ethically-aligned-design-2019",
  "oecd-ai-principles",
  "int-bletchley-declaration-2023",
];
for (const id of requiredInstrumentIds) {
  assert(instrumentIds.has(id), `Required instrument is missing: ${id}`);
}

const statusAnchors = new Map([
  ["eu-gdpr", ["applicable", null]],
  ["eu-ai-act", ["partially-applicable", null]],
  ["us-eo-14110", ["revoked", "2025-01-20"]],
  ["us-ca-sb-1047-2024", ["vetoed", "2024-09-29"]],
]);
for (const [instrumentId, [expectedStatus, expectedCeasedOn]] of statusAnchors) {
  const instrument = instruments.find((item) => item.id === instrumentId);
  assert(
    instrument.lifecycleStatus === expectedStatus,
    `${instrumentId} must be represented as ${expectedStatus} in this snapshot`,
  );
  assert(
    instrument.dates.ceasedOn === expectedCeasedOn,
    `${instrumentId}.dates.ceasedOn must be ${expectedCeasedOn ?? "null"}`,
  );
}

console.log(
  [
    `Validated V2 corpus: ${jurisdictions.length} jurisdictions,`,
    `${instruments.length} instruments,`,
    `${combinedProvisionIds.size} merged provisions`,
    `(${gdprArticles.length} GDPR + ${euAiActArticles.length} EU AI Act official Articles),`,
    `${relations.length} relations, and ${statusEvents.length} lifecycle events.`,
    `${structureSummaries.length} reviewed structure summaries cover ${officialSections.size} official EU sections.`,
  ].join(" "),
);
