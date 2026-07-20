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
  conceptThemes,
  relations,
  statusEvents,
  sourceAudits,
  gdprArticles,
  euAiActArticles,
  structureSummaries,
] = await Promise.all([
  loadJson("jurisdictions.json"),
  loadJson("instruments.json"),
  loadJson("provisions.json"),
  loadJson("concepts.json"),
  loadJson("concept-themes.json"),
  loadJson("relations.json"),
  loadJson("status-events.json"),
  loadJson("source-audit.json"),
  loadJson("gdpr-articles.json"),
  loadJson("eu-ai-act-articles.json"),
  loadJson("structure-summaries.json"),
]);

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const jurisdictionTypes = new Set([
  "country",
  "legal-jurisdiction",
  "special-administrative-region",
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
const relationTypes = new Set([
  "complements",
  "elaborates",
  "future-operational-overlap",
  "future-partial-overlap",
  "grounded-in",
  "historical-comparison",
  "historical-operational-alignment",
  "historical-operational-overlap",
  "historical-policy-overlap",
  "implements",
  "operational-alignment",
  "operationalizes",
  "partial-overlap",
  "policy-framework-alignment",
  "policy-transition",
  "practice-guidance-alignment",
  "practice-guidance-overlap",
  "repeals",
  "repeals-and-reenacts",
  "shared-legal-origin",
  "soft-law-alignment",
  "supports-operational-evidence",
]);
const lifecycleRelationTypes = new Set([
  "policy-transition",
  "repeals",
  "repeals-and-reenacts",
]);
const translationStatuses = new Set(["official", "reference"]);
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

function assertReferenceArray(value, knownIds, label, options = {}) {
  assertStringArray(value, label, options);
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

function assertTranslation(value, label, sourceParagraphs) {
  assertObject(value, label);
  if (value.title !== undefined) {
    assertString(value.title, `${label}.title`);
  }
  assertStringArray(value.paragraphs, `${label}.paragraphs`);
  assertString(value.fullText, `${label}.fullText`);
  assert(
    value.fullText === value.paragraphs.join("\n\n"),
    `${label}.fullText does not match its paragraph sequence`,
  );
  assert(
    translationStatuses.has(value.status),
    `${label}.status must be official or reference`,
  );
  if (value.status === "reference") {
    assertString(value.note, `${label}.note`, 20);
    assert(
      /reference|not an official|non-official/i.test(value.note),
      `${label}.note must clearly identify a non-official reference translation`,
    );
  } else if (value.note !== undefined) {
    assertString(value.note, `${label}.note`, 20);
  }
  if (value.source !== undefined) {
    assertSource(value.source, `${label}.source`);
  }
  if (sourceParagraphs !== undefined) {
    assert(
      value.paragraphs.length === sourceParagraphs.length,
      `${label} must preserve one-to-one paragraph alignment with the source text`,
    );
  }
}

const jurisdictionIds = assertUnique(jurisdictions, "jurisdiction");
const instrumentIds = assertUnique(instruments, "instrument");
const provisionIds = assertUnique(provisions, "provision");
const conceptIds = assertUnique(concepts, "concept");
const conceptThemeIds = assertUnique(conceptThemes, "concept theme");
assertUnique(relations, "relation");
assertUnique(statusEvents, "status event");
assertUnique(sourceAudits, "source audit");
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

const conceptThemeOrders = new Set();
for (const theme of conceptThemes) {
  assertString(theme.label, `${theme.id}.label`);
  assertString(theme.summary, `${theme.id}.summary`, 80);
  assert(
    Number.isInteger(theme.order) && theme.order > 0,
    `${theme.id}.order must be a positive integer`,
  );
  assert(
    !conceptThemeOrders.has(theme.order),
    `Duplicate concept theme order: ${theme.order}`,
  );
  conceptThemeOrders.add(theme.order);
}
assert(
  [...conceptThemeOrders].sort((left, right) => left - right)
    .every((order, index) => order === index + 1),
  "Concept theme order values must form a contiguous sequence beginning at 1",
);

const conceptsByTheme = new Map(
  conceptThemes.map((theme) => [theme.id, 0]),
);
for (const concept of concepts) {
  assertString(concept.label, `${concept.id}.label`);
  assertString(concept.family, `${concept.id}.family`);
  assertId(concept.theme, `${concept.id}.theme`);
  assert(
    conceptThemeIds.has(concept.theme),
    `${concept.id} references missing concept theme ${concept.theme}`,
  );
  assertString(concept.description, `${concept.id}.description`, 30);
  assertString(concept.summary, `${concept.id}.summary`, 80);
  assertStringArray(concept.aliases, `${concept.id}.aliases`, {
    allowEmpty: true,
  });
  assert(
    Array.isArray(concept.sourceBasis) && concept.sourceBasis.length > 0,
    `${concept.id}.sourceBasis must contain at least one public source`,
  );
  const conceptSourceUrls = new Set();
  concept.sourceBasis.forEach((source, index) => {
    assertSource(source, `${concept.id}.sourceBasis[${index}]`, {
      requireAccessedOn: true,
    });
    assert(
      !conceptSourceUrls.has(source.url),
      `${concept.id}.sourceBasis contains duplicate URL: ${source.url}`,
    );
    conceptSourceUrls.add(source.url);
  });
  assertObject(concept.editorial, `${concept.id}.editorial`);
  assert(
    concept.editorial.reviewStatus === "editorial-concept-summary",
    `${concept.id}.editorial.reviewStatus must identify a concept summary`,
  );
  assertIsoDate(
    concept.editorial.reviewedOn,
    `${concept.id}.editorial.reviewedOn`,
  );
  assertString(concept.editorial.note, `${concept.id}.editorial.note`, 60);
  conceptsByTheme.set(
    concept.theme,
    (conceptsByTheme.get(concept.theme) ?? 0) + 1,
  );
}
for (const [theme, conceptCount] of conceptsByTheme) {
  assert(
    conceptCount > 0,
    `${theme} must contain at least one core concept`,
  );
}

for (const instrument of instruments) {
  if (instrument.originalTitle !== undefined) {
    assertString(instrument.originalTitle, `${instrument.id}.originalTitle`);
  }
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
  for (const field of [
    "introducedOn",
    "lastAmendedOn",
    "latestAmendmentEffectiveFrom",
  ]) {
    if (instrument.dates[field] !== undefined) {
      assertIsoDate(instrument.dates[field], `${instrument.id}.dates.${field}`);
    }
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
  for (const field of [
    "amendmentSource",
    "originalLanguageSource",
    "referenceTranslationSource",
    "supportingSource",
  ]) {
    if (instrument[field] !== undefined) {
      assertSource(instrument[field], `${instrument.id}.${field}`, {
        requireAccessedOn: true,
      });
    }
  }
  assertTextAvailability(
    instrument.textAvailability,
    `${instrument.id}.textAvailability`,
  );
  if (instrument.textAvailability.mode.includes("full-corpus-stored")) {
    assert(
      instrument.textAvailability.stored,
      `${instrument.id} full stored corpus must set textAvailability.stored to true`,
    );
    assertObject(instrument.coverage, `${instrument.id}.coverage`);
    assert(
      instrument.coverage.unit === "article",
      `${instrument.id}.coverage.unit must be article`,
    );
    for (const field of ["first", "last", "count"]) {
      assert(
        Number.isInteger(instrument.coverage[field]) &&
          instrument.coverage[field] > 0,
        `${instrument.id}.coverage.${field} must be a positive integer`,
      );
    }
    assertString(
      instrument.coverage.completeness,
      `${instrument.id}.coverage.completeness`,
    );
    const storedChildren = provisions.filter(
      (provision) => provision.instrumentId === instrument.id,
    );
    assert(
      storedChildren.length === instrument.coverage.count,
      `${instrument.id} claims ${instrument.coverage.count} stored Articles but has ${storedChildren.length}`,
    );
    assert(
      instrument.coverage.last - instrument.coverage.first + 1 ===
        instrument.coverage.count,
      `${instrument.id}.coverage range is not contiguous`,
    );
    assert(
      storedChildren.every(
        (provision) =>
          provision.provisionType === "article" &&
          provision.textAvailability?.stored === true &&
          provision.textAvailability?.language ===
            instrument.textAvailability.language &&
          !provision.textAvailability?.mode.includes("excerpt"),
      ),
      `${instrument.id} full stored corpus contains a missing, non-Article, or excerpt record`,
    );
  }
}

for (const provision of provisions) {
  assert(
    instrumentIds.has(provision.instrumentId),
    `${provision.id} references missing instrument ${provision.instrumentId}`,
  );
  for (const field of ["locator", "title", "provisionType", "legalEffectStatus"]) {
    assertString(provision[field], `${provision.id}.${field}`);
  }
  if (provision.originalTitle !== undefined) {
    assertString(provision.originalTitle, `${provision.id}.originalTitle`);
  }
  for (const field of ["chapter", "section"]) {
    if (provision[field] !== undefined) {
      assertObject(provision[field], `${provision.id}.${field}`);
      assertId(provision[field].id, `${provision.id}.${field}.id`);
      assertString(provision[field].label, `${provision.id}.${field}.label`);
      assertString(provision[field].title, `${provision.id}.${field}.title`);
    }
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
  if (provision.versionAsOf !== undefined) {
    assertIsoDate(provision.versionAsOf, `${provision.id}.versionAsOf`);
  }
  if (provision.supportingSources !== undefined) {
    assert(
      Array.isArray(provision.supportingSources) &&
        provision.supportingSources.length > 0,
      `${provision.id}.supportingSources must be a non-empty array`,
    );
    provision.supportingSources.forEach((sourceItem, index) =>
      assertSource(
        sourceItem,
        `${provision.id}.supportingSources[${index}]`,
        { requireAccessedOn: true },
      ),
    );
  }
  assertTextAvailability(
    provision.textAvailability,
    `${provision.id}.textAvailability`,
  );
  if (
    provision.textAvailability.mode ===
    "official-source-linked-editorial-summary"
  ) {
    assertIsoDate(
      provision.versionAsOf,
      `${provision.id}.versionAsOf`,
    );
  }
  if (provision.textAvailability.stored) {
    assertStringArray(provision.paragraphs, `${provision.id}.paragraphs`);
    assertString(provision.fullText, `${provision.id}.fullText`);
    assert(
      provision.fullText === provision.paragraphs.join("\n\n"),
      `${provision.id}.fullText does not match its paragraph sequence`,
    );
    assert(
      provision.textAvailability.mode.includes("stored"),
      `${provision.id}.textAvailability.mode must identify stored text`,
    );
    if (!/^en(?:-|$)/i.test(provision.textAvailability.language)) {
      assertObject(
        provision.translations,
        `${provision.id}.translations`,
      );
      assertObject(
        provision.translations.en,
        `${provision.id}.translations.en`,
      );
    }
  } else {
    assert(
      provision.paragraphs === undefined && provision.fullText === undefined,
      `${provision.id} cannot expose text while textAvailability.stored is false`,
    );
  }
  if (provision.translations !== undefined) {
    assertObject(provision.translations, `${provision.id}.translations`);
    for (const [language, translation] of Object.entries(
      provision.translations,
    )) {
      assert(
        languagePattern.test(language),
        `${provision.id}.translations language key ${language} is invalid`,
      );
      assertTranslation(
        translation,
        `${provision.id}.translations.${language}`,
        provision.paragraphs,
      );
    }
  }
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

const cslInstrument = instruments.find(
  (instrument) => instrument.id === "cn-cybersecurity-law",
);
assert(cslInstrument, "China Cybersecurity Law instrument is missing");
assert(
  cslInstrument.originalTitle === "中华人民共和国网络安全法",
  "China Cybersecurity Law must retain its official Chinese title",
);
assert(
  cslInstrument.dates.lastAmendedOn === "2025-10-28" &&
    cslInstrument.dates.latestAmendmentEffectiveFrom === "2026-01-01",
  "China Cybersecurity Law amendment dates are not the current 2025/2026 version",
);

const cslArticles = provisions.filter(
  (provision) => provision.instrumentId === "cn-cybersecurity-law",
);
assert(
  cslArticles.length === 81,
  `Current China Cybersecurity Law corpus must contain 81 Articles; found ${cslArticles.length}`,
);
assert(
  cslArticles.reduce((count, article) => count + article.paragraphs.length, 0) ===
    141,
  "Current China Cybersecurity Law corpus must contain exactly 141 aligned source paragraphs",
);
const cslChapterRanges = [
  [1, 15, "cn-csl-chapter-1", "Chapter I", "General Provisions"],
  [16, 22, "cn-csl-chapter-2", "Chapter II", "Cybersecurity Support and Promotion"],
  [23, 41, "cn-csl-chapter-3", "Chapter III", "Network Operations Security"],
  [42, 52, "cn-csl-chapter-4", "Chapter IV", "Network Information Security"],
  [53, 60, "cn-csl-chapter-5", "Chapter V", "Monitoring, Early Warning, and Emergency Response"],
  [61, 77, "cn-csl-chapter-6", "Chapter VI", "Legal Liability"],
  [78, 81, "cn-csl-chapter-7", "Chapter VII", "Supplementary Provisions"],
];

cslArticles.forEach((article, index) => {
  const number = index + 1;
  assert(article.id === `cn-csl-art-${number}`, `CSL Article ${number} id is invalid`);
  assert(article.locator === `Article ${number}`, `CSL Article ${number} locator is invalid`);
  assertString(article.originalTitle, `${article.id}.originalTitle`);
  assert(article.appliesFrom === "2026-01-01", `${article.id} has a stale amendment date`);
  assert(
    article.source.url ===
      "https://www.cac.gov.cn/2025-12/29/c_1768735112911946.htm",
    `${article.id} must cite the current official consolidated Chinese text`,
  );
  const chapterRange = cslChapterRanges.find(
    ([first, last]) => number >= first && number <= last,
  );
  const [, , chapterId, chapterLabel, chapterTitle] = chapterRange;
  assert(
    article.chapter.id === chapterId &&
      article.chapter.label === chapterLabel &&
      article.chapter.title === chapterTitle,
    `${article.id} has incorrect Chapter metadata`,
  );
  if (number >= 23 && number <= 32) {
    assert(
      article.section?.id === "cn-csl-chapter-3-section-1" &&
        article.section?.label === "Section 1" &&
        article.section?.title === "General Provisions",
      `${article.id} has incorrect Chapter III, Section 1 metadata`,
    );
  } else if (number >= 33 && number <= 41) {
    assert(
      article.section?.id === "cn-csl-chapter-3-section-2" &&
        article.section?.label === "Section 2" &&
        article.section?.title ===
          "Operational Security of Critical Information Infrastructure",
      `${article.id} has incorrect Chapter III, Section 2 metadata`,
    );
  } else {
    assert(article.section === undefined, `${article.id} must not invent a Section`);
  }
});

const cslById = new Map(cslArticles.map((article) => [article.id, article]));
assert(
  cslById.get("cn-csl-art-1").fullText.startsWith("为了保障网络安全"),
  "CSL Article 1 official text anchor is missing",
);
assert(
  cslById.get("cn-csl-art-20").fullText.includes("人工智能基础理论研究") &&
    cslById.get("cn-csl-art-20").paragraphs.length === 2,
  "CSL Article 20 does not contain the complete 2025 AI amendment text",
);
assert(
  cslById.get("cn-csl-art-61").fullText.includes("二百万元以上一千万元以下罚款"),
  "CSL Article 61 does not contain the current amended maximum penalty text",
);
assert(
  cslById.get("cn-csl-art-81").fullText === "本法自2017年6月1日起施行。",
  "CSL Article 81 official text is missing or contaminated by page furniture",
);

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
const indexedProvisionConceptIds = new Map(
  provisions.map((provision) => [
    provision.id,
    new Set(provision.conceptIds),
  ]),
);
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
    relationTypes.has(relation.type),
    `${relation.id}.type is not in the reviewed relation-type vocabulary`,
  );
  assert(
    directionalityValues.has(relation.directionality),
    `${relation.id}.directionality must be directed or undirected`,
  );
  const isLifecycleRelation = lifecycleRelationTypes.has(relation.type);
  if (isLifecycleRelation) {
    assert(
      relation.relationClass === "lifecycle",
      `${relation.id}.relationClass must be lifecycle for a legal-lineage edge`,
    );
    assertReferenceArray(
      relation.conceptIds,
      conceptIds,
      `${relation.id}.conceptIds`,
      { allowEmpty: true },
    );
    assert(
      relation.conceptIds.length === 0,
      `${relation.id}.conceptIds must be empty because lifecycle edges do not assert a substantive concept mapping`,
    );
  } else {
    assert(
      relation.relationClass === undefined || relation.relationClass === "analytical",
      `${relation.id}.relationClass must be analytical when present`,
    );
    assertReferenceArray(
      relation.conceptIds,
      conceptIds,
      `${relation.id}.conceptIds`,
    );
    if (
      relation.source.type === "provision" &&
      relation.target.type === "provision"
    ) {
      const sourceConcepts = indexedProvisionConceptIds.get(relation.source.id);
      const targetConcepts = indexedProvisionConceptIds.get(relation.target.id);
      for (const conceptId of relation.conceptIds) {
        assert(
          sourceConcepts?.has(conceptId),
          `${relation.id} needs a curated ${conceptId} anchor on source provision ${relation.source.id}`,
        );
        assert(
          targetConcepts?.has(conceptId),
          `${relation.id} needs a curated ${conceptId} anchor on target provision ${relation.target.id}`,
        );
      }
    }
  }
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

const sourceAuditInstrumentIds = new Set();
for (const audit of sourceAudits) {
  assert(
    instrumentIds.has(audit.instrumentId),
    `${audit.id} references missing instrument ${audit.instrumentId}`,
  );
  assert(
    audit.id === `audit-${audit.instrumentId}`,
    `${audit.id} must use the audit-<instrumentId> identifier`,
  );
  assert(
    !sourceAuditInstrumentIds.has(audit.instrumentId),
    `${audit.instrumentId} has more than one source audit`,
  );
  sourceAuditInstrumentIds.add(audit.instrumentId);
  assertIsoDate(audit.reviewedOn, `${audit.id}.reviewedOn`);
  assertString(audit.reviewLevel, `${audit.id}.reviewLevel`);
  assertString(audit.lifecycleFinding, `${audit.id}.lifecycleFinding`, 40);
  assertString(audit.versionFinding, `${audit.id}.versionFinding`);
  assertObject(audit.authoritativeLanguage, `${audit.id}.authoritativeLanguage`);
  assertStringArray(
    audit.authoritativeLanguage.languages,
    `${audit.id}.authoritativeLanguage.languages`,
  );
  assertString(
    audit.authoritativeLanguage.note,
    `${audit.id}.authoritativeLanguage.note`,
    40,
  );
  assertObject(audit.englishAvailability, `${audit.id}.englishAvailability`);
  assertString(
    audit.englishAvailability.status,
    `${audit.id}.englishAvailability.status`,
  );
  assertString(
    audit.englishAvailability.note,
    `${audit.id}.englishAvailability.note`,
    40,
  );
  assertObject(audit.localCoverage, `${audit.id}.localCoverage`);
  assertString(audit.localCoverage.mode, `${audit.id}.localCoverage.mode`);
  assert(
    Number.isInteger(audit.localCoverage.localUnitCount) &&
      audit.localCoverage.localUnitCount >= 0,
    `${audit.id}.localCoverage.localUnitCount must be a non-negative integer`,
  );
  assertString(
    audit.localCoverage.statement,
    `${audit.id}.localCoverage.statement`,
    60,
  );
  assert(
    Array.isArray(audit.sources) && audit.sources.length > 0,
    `${audit.id}.sources must contain at least one official source`,
  );
  audit.sources.forEach((sourceItem, index) => {
    assertString(sourceItem.role, `${audit.id}.sources[${index}].role`);
    assertSource(sourceItem, `${audit.id}.sources[${index}]`, {
      requireAccessedOn: true,
    });
  });
  assertStringArray(audit.caveats, `${audit.id}.caveats`);
  audit.caveats.forEach((caveat, index) =>
    assertString(caveat, `${audit.id}.caveats[${index}]`, 40),
  );
}
for (const instrumentId of instrumentIds) {
  assert(
    sourceAuditInstrumentIds.has(instrumentId),
    `${instrumentId} is missing its source audit`,
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
  "sg",
  "kr",
  "au",
  "br",
  "ae",
  "ae-dubai",
  "sa",
  "tw",
  "hk",
  "id",
  "vn",
  "za",
  "ng",
  "ch",
  "us-co",
];
for (const id of requiredJurisdictionIds) {
  assert(jurisdictionIds.has(id), `Required jurisdiction is missing: ${id}`);
}

const requiredCoreConceptIds = [
  "privacy-by-design-default",
  "data-minimization",
  "purpose-limitation",
  "lawfulness-consent-choice",
  "data-subject-rights",
  "fairness-nondiscrimination",
  "sensitive-data-protection",
  "retention-deletion-lifecycle",
  "privacy-enhancing-tech",
  "third-party-supply-chain",
  "continuous-assurance",
  "automated-decision-safeguards",
  "ai-risk-management",
  "impact-assessment",
  "accountability-governance",
  "security-controls",
  "incident-response",
  "human-oversight",
  "training-data-governance",
  "frontier-model-safety",
  "cross-border-transfer",
  "global-coordination",
];
for (const id of requiredCoreConceptIds) {
  assert(conceptIds.has(id), `Required core concept is missing: ${id}`);
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
  "sg-pdpa-2012",
  "sg-model-ai-governance-framework-2020",
  "sg-ai-verify-testing-framework",
  "kr-pipa-2011",
  "kr-ai-framework-act-2025",
  "au-privacy-act-1988",
  "au-mandatory-ai-guardrails-proposal-2024",
  "au-guidance-for-ai-adoption-2025",
  "br-lgpd-2018",
  "br-pl-2338-2023-ai-bill",
  "ae-federal-pdpl-45-2021",
  "ae-dubai-ai-ethics-toolkit-2019",
  "ae-generative-ai-guide-2023",
  "sa-pdpl-2021-amended-2023",
  "sa-sdaia-ai-ethics-principles-1-0-2023",
  "tw-personal-data-protection-act",
  "tw-ai-basic-act-2026",
  "tw-executive-yuan-generative-ai-guidelines-2023",
  "hk-personal-data-privacy-ordinance",
  "hk-ai-model-pd-protection-framework-2024",
  "hk-ethical-ai-guidance-2021",
  "hk-genai-employee-guidelines-checklist-2025",
  "id-pdp-law-2022",
  "vn-personal-data-protection-law-2025",
  "vn-pdpl-implementing-decree-356-2025",
  "vn-personal-data-protection-decree-13-2023",
  "za-popia-4-2013",
  "ng-data-protection-act-2023",
  "ca-bill-c-27-aida-2022-lapsed",
  "us-co-sb24-205-2024",
  "us-co-sb26-189-admt-2026",
  "ch-fadp-2020",
];
for (const id of requiredInstrumentIds) {
  assert(instrumentIds.has(id), `Required instrument is missing: ${id}`);
}

const expansionStartIndex = requiredInstrumentIds.indexOf("sg-pdpa-2012");
assert(expansionStartIndex >= 0, "Expanded-corpus anchor is missing");
const expandedInstrumentIds = requiredInstrumentIds.slice(expansionStartIndex);
const graphCoveredInstrumentIds = new Set();
for (const relation of relations) {
  for (const endpoint of [relation.source, relation.target]) {
    const instrumentId =
      endpoint.type === "instrument"
        ? endpoint.id
        : provisionInstrumentById.get(endpoint.id);
    if (instrumentId) graphCoveredInstrumentIds.add(instrumentId);
  }
}
for (const instrumentId of expandedInstrumentIds) {
  assert(
    graphCoveredInstrumentIds.has(instrumentId),
    `${instrumentId} has no reviewed production graph edge`,
  );
}

const statusAnchors = new Map([
  ["eu-gdpr", ["applicable", null]],
  ["eu-ai-act", ["partially-applicable", null]],
  ["us-eo-14110", ["revoked", "2025-01-20"]],
  ["us-ca-sb-1047-2024", ["vetoed", "2024-09-29"]],
  ["kr-ai-framework-act-2025", ["in-force-with-scheduled-amendment", null]],
  ["tw-ai-basic-act-2026", ["in-force", null]],
  ["vn-personal-data-protection-decree-13-2023", ["repealed", "2026-01-01"]],
  ["ca-bill-c-27-aida-2022-lapsed", ["lapsed", "2025-01-06"]],
  ["us-co-sb24-205-2024", ["superseded-before-substantive-effect", "2026-05-14"]],
  ["us-co-sb26-189-admt-2026", ["partially-in-force-with-principal-duties-scheduled", null]],
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
    `${sourceAudits.length} source-audit records cover every instrument.`,
    `${concepts.length} core concepts are organized into ${conceptThemes.length} themes.`,
    `${structureSummaries.length} reviewed structure summaries cover ${officialSections.size} official EU sections.`,
  ].join(" "),
);
