import { createHash } from "node:crypto";
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
  ukGdprArticles,
  piplArticles,
  networkDataArticles,
  generativeAiArticles,
  pipedaProvisions,
  lgpdArticles,
  taiwanAiActArticles,
  taiwanPdpaArticles,
  singaporePdpaProvisions,
  southAfricaPopiaSections,
  nigeriaNdpaSections,
  indonesiaPdpArticles,
  indiaDpdpActProvisions,
  indiaDpdpRulesProvisions,
  uaePdplArticles,
  saudiPdplArticles,
  saudiPdplImplementingArticles,
  saudiPdplTransferArticles,
  australiaPrivacyActProvisions,
  japanAppiArticles,
  japanAiPromotionActArticles,
  hongKongPdpoProvisions,
  swissFadpProvisions,
  vietnamPdplArticles,
  vietnamDecree356Provisions,
  vietnamDecree13HistoricalProvisions,
  koreaPipaArticles,
  koreaAiFrameworkArticles,
  usExecutiveOrderProvisions,
  taiwanExecutiveYuanGenAiGuidelines,
  brazilAiBillArticles,
  californiaSb1047Provisions,
  coloradoAiActProvisions,
  nistAiRmfCorpus,
  structureSummaries,
  provisionConceptReviews,
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
  loadJson("uk-gdpr-articles.json"),
  loadJson("cn-pipl-articles.json"),
  loadJson("cn-network-data-regulations-articles.json"),
  loadJson("cn-generative-ai-measures-articles.json"),
  loadJson("canada-pipeda-provisions.json"),
  loadJson("brazil-lgpd-articles.json"),
  loadJson("tw-ai-basic-act-2026-articles.json"),
  loadJson("tw-personal-data-protection-act-articles.json"),
  loadJson("sg-pdpa-provisions.json"),
  loadJson("za-popia-sections.json"),
  loadJson("ng-ndpa-2023-sections.json"),
  loadJson("id-pdp-law-2022-articles.json"),
  loadJson("india-dpdp-act-2023-provisions.json"),
  loadJson("india-dpdp-rules-2025-provisions.json"),
  loadJson("uae-federal-pdpl-45-2021-articles.json"),
  loadJson("sa-pdpl-2021-amended-2023-articles.json"),
  loadJson("sa-pdpl-implementing-regulation-2023-articles.json"),
  loadJson("sa-pdpl-transfer-regulation-2023-articles.json"),
  loadJson("au-privacy-act-1988-provisions.json"),
  loadJson("jp-appi-current-articles.json"),
  loadJson("jp-ai-promotion-act-2025-articles.json"),
  loadJson("hk-pdpo-486-provisions.json"),
  loadJson("ch-fadp-2020-provisions.json"),
  loadJson("vn-personal-data-protection-law-2025-articles.json"),
  loadJson("vn-decree-356-2025-provisions.json"),
  loadJson("vn-decree-13-2023-historical-provisions.json"),
  loadJson("kr-pipa-2011-current-articles.json"),
  loadJson("kr-ai-framework-act-2025-current-articles.json"),
  loadJson("us-executive-orders-provisions.json"),
  loadJson("tw-executive-yuan-generative-ai-guidelines-2023-points.json"),
  loadJson("br-ai-bill-2338-2023-articles.json"),
  loadJson("us-ca-sb1047-2024-provisions.json"),
  loadJson("us-co-ai-act-current-provisions.json"),
  loadJson("us-nist-ai-rmf-1-0-corpus.json"),
  loadJson("structure-summaries.json"),
  loadJson("provision-concepts.json"),
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
const provisionRelevanceValues = new Set([
  "substantive-topic",
  "structural-context",
]);
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

function assertImportedEnglishTranslation(article, label) {
  assertObject(article.translations, `${label}.translations`);
  const translation = article.translations.en;
  assertObject(translation, `${label}.translations.en`);
  assertString(translation.title, `${label}.translations.en.title`);
  assertStringArray(
    translation.paragraphs,
    `${label}.translations.en.paragraphs`,
    { allowDuplicates: true },
  );
  assertString(translation.fullText, `${label}.translations.en.fullText`);
  assert(translation.language === "en", `${label}.translations.en.language must be en`);
  assertString(translation.status, `${label}.translations.en.status`);
  assertString(translation.coverageStatus, `${label}.translations.en.coverageStatus`);
  assertIsoDate(translation.versionAsOf, `${label}.translations.en.versionAsOf`);
  assertString(translation.versionLabel, `${label}.translations.en.versionLabel`, 12);
  assertString(
    translation.note ?? translation.authorityNote,
    `${label}.translations.en.note`,
    30,
  );

  let cursor = 0;
  for (const [index, paragraph] of translation.paragraphs.entries()) {
    const next = translation.fullText.indexOf(paragraph, cursor);
    assert(
      next >= cursor,
      `${label}.translations.en.paragraphs[${index}] is missing or out of order in fullText`,
    );
    cursor = next + paragraph.length;
  }

  const sourceUrl =
    typeof translation.source === "string"
      ? translation.source
      : translation.source?.url;
  assertString(sourceUrl, `${label}.translations.en.source`);
  let parsedSource;
  try {
    parsedSource = new URL(sourceUrl);
  } catch {
    throw new Error(`${label}.translations.en.source is not a valid URL`);
  }
  assert(
    parsedSource.protocol === "https:" || parsedSource.protocol === "http:",
    `${label}.translations.en.source must use HTTP or HTTPS`,
  );
  assert(parsedSource.hostname.length > 0, `${label}.translations.en.source must include a hostname`);

  const searchableText = [
    translation.title,
    ...translation.paragraphs,
    translation.fullText,
  ].join("\n");
  assert(
    !/this (?:article|section|provision)[\s\S]{0,180}mapped to|complete official [\s\S]{0,100}wording is available in the original-language view/i.test(
      searchableText,
    ),
    `${label}.translations.en contains an orientation placeholder rather than legal text`,
  );

  if (translation.contentSha256 !== undefined) {
    assert(
      translation.contentSha256 ===
        createHash("sha256").update(translation.fullText, "utf8").digest("hex"),
      `${label}.translations.en.contentSha256 does not match its stored text`,
    );
  }

  if (translation.coverageStatus.includes("project")) {
    assert(
      typeof translation.currentTextEquivalent === "boolean",
      `${label}.translations.en must explicitly state whether the project reference matches the displayed source version`,
    );
    assertString(
      translation.contentSha256,
      `${label}.translations.en.contentSha256`,
      64,
    );
    assertObject(translation.rights, `${label}.translations.en.rights`);
    assert(
      translation.rights.licenseUrl ===
        "https://creativecommons.org/licenses/by/4.0/",
      `${label}.translations.en must identify the CC BY 4.0 licence for project-authored wording`,
    );
    assert(
      /project|nonofficial|not an official|no legal effect/i.test(
        `${translation.note ?? ""} ${translation.authorityNote ?? ""}`,
      ),
      `${label}.translations.en must disclose its nonofficial project status`,
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
const ukGdprArticleIds = assertUnique(ukGdprArticles, "UK GDPR article");
const piplArticleIds = assertUnique(piplArticles, "PIPL article");
const networkDataArticleIds = assertUnique(
  networkDataArticles,
  "Network Data Security Regulation article",
);
const generativeAiArticleIds = assertUnique(
  generativeAiArticles,
  "Generative AI Measures article",
);
const pipedaProvisionIds = assertUnique(pipedaProvisions, "PIPEDA provision");
const lgpdArticleIds = assertUnique(lgpdArticles, "LGPD article");
const taiwanAiActArticleIds = assertUnique(
  taiwanAiActArticles,
  "Taiwan AI Basic Act article",
);
const taiwanPdpaArticleIds = assertUnique(
  taiwanPdpaArticles,
  "Taiwan PDPA article",
);
const singaporePdpaProvisionIds = assertUnique(
  singaporePdpaProvisions,
  "Singapore PDPA provision",
);
const southAfricaPopiaSectionIds = assertUnique(
  southAfricaPopiaSections,
  "South Africa POPIA section",
);
const nigeriaNdpaSectionIds = assertUnique(
  nigeriaNdpaSections,
  "Nigeria NDPA section",
);
const indonesiaPdpArticleIds = assertUnique(
  indonesiaPdpArticles,
  "Indonesia PDP article",
);
const indiaDpdpActProvisionIds = assertUnique(
  indiaDpdpActProvisions,
  "India DPDP Act provision",
);
const indiaDpdpRulesProvisionIds = assertUnique(
  indiaDpdpRulesProvisions,
  "India DPDP Rules provision",
);
const uaePdplArticleIds = assertUnique(uaePdplArticles, "UAE PDPL article");
const saudiPdplArticleIds = assertUnique(
  saudiPdplArticles,
  "Saudi PDPL article",
);
const saudiPdplImplementingArticleIds = assertUnique(
  saudiPdplImplementingArticles,
  "Saudi PDPL Implementing Regulation article",
);
const saudiPdplTransferArticleIds = assertUnique(
  saudiPdplTransferArticles,
  "Saudi PDPL Transfer Regulation article",
);
const australiaPrivacyActProvisionIds = assertUnique(
  australiaPrivacyActProvisions,
  "Australia Privacy Act provision",
);
const japanAppiArticleIds = assertUnique(
  japanAppiArticles,
  "Japan APPI provision",
);
const japanAiPromotionActArticleIds = assertUnique(
  japanAiPromotionActArticles,
  "Japan AI Promotion Act provision",
);
const hongKongPdpoProvisionIds = assertUnique(
  hongKongPdpoProvisions,
  "Hong Kong PDPO provision",
);
const swissFadpProvisionIds = assertUnique(
  swissFadpProvisions,
  "Swiss FADP provision",
);
const vietnamPdplArticleIds = assertUnique(
  vietnamPdplArticles,
  "Vietnam PDP Law article",
);
const vietnamDecree356ProvisionIds = assertUnique(
  vietnamDecree356Provisions,
  "Vietnam Decree 356 provision",
);
const vietnamDecree13HistoricalProvisionIds = assertUnique(
  vietnamDecree13HistoricalProvisions,
  "Vietnam Decree 13 historical provision",
);
const koreaPipaArticleIds = assertUnique(
  koreaPipaArticles,
  "Korea PIPA provision",
);
const koreaAiFrameworkArticleIds = assertUnique(
  koreaAiFrameworkArticles,
  "Korea AI Framework Act provision",
);
const usExecutiveOrderProvisionIds = assertUnique(
  usExecutiveOrderProvisions,
  "US Executive Order provision",
);
const taiwanExecutiveYuanGenAiGuidelineIds = assertUnique(
  taiwanExecutiveYuanGenAiGuidelines,
  "Taiwan Executive Yuan GenAI guidance point",
);
const brazilAiBillArticleIds = assertUnique(
  brazilAiBillArticles,
  "Brazil AI Bill article",
);
const californiaSb1047ProvisionIds = assertUnique(
  californiaSb1047Provisions,
  "California SB 1047 provision",
);
const coloradoAiActProvisionIds = assertUnique(
  coloradoAiActProvisions,
  "Colorado current AI Act provision",
);
const nistAiRmfCorpusIds = assertUnique(
  nistAiRmfCorpus,
  "NIST AI RMF 1.0 node",
);
const knownProvisionParentIds = new Set(
  [
    provisions,
    gdprArticles,
    euAiActArticles,
    ukGdprArticles,
    piplArticles,
    networkDataArticles,
    generativeAiArticles,
    pipedaProvisions,
    lgpdArticles,
    taiwanAiActArticles,
    taiwanPdpaArticles,
    singaporePdpaProvisions,
    southAfricaPopiaSections,
    nigeriaNdpaSections,
    indonesiaPdpArticles,
    indiaDpdpActProvisions,
    indiaDpdpRulesProvisions,
    uaePdplArticles,
    saudiPdplArticles,
    saudiPdplImplementingArticles,
    saudiPdplTransferArticles,
    australiaPrivacyActProvisions,
    japanAppiArticles,
    japanAiPromotionActArticles,
    hongKongPdpoProvisions,
    swissFadpProvisions,
    vietnamPdplArticles,
    vietnamDecree356Provisions,
    vietnamDecree13HistoricalProvisions,
    koreaPipaArticles,
    koreaAiFrameworkArticles,
    usExecutiveOrderProvisions,
    taiwanExecutiveYuanGenAiGuidelines,
    brazilAiBillArticles,
    californiaSb1047Provisions,
    coloradoAiActProvisions,
    nistAiRmfCorpus,
  ].flatMap((items) => items.map((item) => item.id)),
);

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
      knownProvisionParentIds.has(provision.parentId),
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

const expectedUkGdprArticleNumbers =
  "1,2,3,4,4A,5,6,7,8,8ZA,8A,9,10,11,11A,12,12A.,13,14,15,16,17,18,19,20,21,22,22A,22B,22C,22D,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,44A,45,45A,45B,45C,46,47,47A,48,49,49A,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,84A,84B,84C,84D,85,86,86A,87,88,89,90,91,91A,92,93,94,95,96,97,98,99".split(
    ",",
  );

function validateUkGdprArticles() {
  const source = "https://www.legislation.gov.uk/eur/2016/679";
  assert(
    ukGdprArticles.length === expectedUkGdprArticleNumbers.length,
    `UK GDPR corpus must contain exactly ${expectedUkGdprArticleNumbers.length} current Article nodes; found ${ukGdprArticles.length}`,
  );

  ukGdprArticles.forEach((article, index) => {
    const expectedNumber = expectedUkGdprArticleNumbers[index];
    const expectedId = `gb-uk-gdpr-art-${expectedNumber
      .replace(/\.$/, "")
      .toLowerCase()}`;
    assert(
      article.articleNumber === expectedNumber,
      `UK GDPR corpus is missing or misorders Article ${expectedNumber}`,
    );
    assert(article.id === expectedId, `UK GDPR Article ${expectedNumber} has id ${article.id}`);
    assert(ukGdprArticleIds.has(expectedId), `UK GDPR is missing ${expectedId}`);
    assert(article.instrumentId === "gb-uk-gdpr", `${article.id} references the wrong instrument`);
    assert(article.label === `Article ${expectedNumber}`, `${article.id} has an invalid label`);
    assertString(article.title, `${article.id}.title`);
    assertObject(article.chapter, `${article.id}.chapter`);
    assertString(article.chapter.id, `${article.id}.chapter.id`);
    assertString(article.chapter.label, `${article.id}.chapter.label`);
    assertString(article.chapter.title, `${article.id}.chapter.title`);
    if (article.section !== null) {
      assertObject(article.section, `${article.id}.section`);
      assertString(article.section.id, `${article.id}.section.id`);
      assertString(article.section.label, `${article.id}.section.label`);
      assertString(article.section.title, `${article.id}.section.title`);
    }
    assertStringArray(article.paragraphs, `${article.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assertString(article.fullText, `${article.id}.fullText`);
    assert(
      article.fullText === article.paragraphs.join("\n\n"),
      `${article.id}.fullText does not match its paragraph sequence`,
    );
    assert(article.language === "en", `${article.id}.language must be en`);
    assert(
      article.textAvailability === "official-current-consolidated-text",
      `${article.id}.textAvailability must identify the current consolidated text`,
    );
    assert(article.source === source, `${article.id}.source is not legislation.gov.uk`);
    assert(
      article.sourceFragment === `${source}/article/${expectedNumber}`,
      `${article.id}.sourceFragment does not target its legislation.gov.uk Article page`,
    );
    assert(
      article.sourceLabel === "legislation.gov.uk current consolidated text",
      `${article.id}.sourceLabel is incorrect`,
    );
    assert(article.retrievedOn === "2026-07-20", `${article.id}.retrievedOn is stale`);
    assert(article.versionAsOf === "2026-06-19", `${article.id}.versionAsOf is stale`);
    assertObject(article.rights, `${article.id}.rights`);
    assert(article.rights.reuseStatus === "open", `${article.id}.rights must record open reuse`);
    assert(
      article.rights.license === "Open Government Licence v3.0",
      `${article.id}.rights.license is incorrect`,
    );
    assertHttpsUrl(article.rights.licenseUrl, `${article.id}.rights.licenseUrl`);
    assertString(article.rights.attribution, `${article.id}.rights.attribution`, 40);
  });

  const instrument = instruments.find((item) => item.id === "gb-uk-gdpr");
  assert(instrument, "UK GDPR instrument metadata is missing");
  assert(
    instrument.source.url === `${source}/contents`,
    "UK GDPR instrument must cite the official revised-text contents page",
  );
}

function validateOfficialChineseArticles({
  articles,
  articleIds,
  expectedCount,
  instrumentId,
  idPrefix,
  source,
  canonicalSource = source,
  effectiveFrom,
  officialTitle,
  translatedArticleNumbers,
  label,
}) {
  assert(
    articles.length === expectedCount,
    `${label} corpus must contain exactly ${expectedCount} Articles; found ${articles.length}`,
  );
  const translatedIds = new Set(
    translatedArticleNumbers.map((number) => `${idPrefix}${number}`),
  );

  articles.forEach((article, index) => {
    const expectedNumber = String(index + 1);
    const expectedId = `${idPrefix}${expectedNumber}`;
    assert(
      article.articleNumber === expectedNumber,
      `${label} corpus is missing or misorders Article ${expectedNumber}`,
    );
    assert(article.id === expectedId, `${label} Article ${expectedNumber} has id ${article.id}`);
    assert(articleIds.has(expectedId), `${label} is missing ${expectedId}`);
    assert(article.instrumentId === instrumentId, `${article.id} references the wrong instrument`);
    assert(article.label === `Article ${expectedNumber}`, `${article.id} has an invalid label`);
    assert(article.title === `Article ${expectedNumber}`, `${article.id}.title must remain a neutral English locator`);
    assertString(article.originalTitle, `${article.id}.originalTitle`);
    assert(/^第[零〇一二两三四五六七八九十百]+条$/u.test(article.originalTitle), `${article.id}.originalTitle is not an official Chinese Article locator`);
    assertString(article.summary, `${article.id}.summary`, 80);
    assert(
      !/No English translation|not a translation|wording is available in the original-language view/i.test(
        article.summary,
      ),
      `${article.id}.summary must describe the stored English legal/reference text rather than a fallback`,
    );
    assertObject(article.chapter, `${article.id}.chapter`);
    assertString(article.chapter.id, `${article.id}.chapter.id`);
    assertString(article.chapter.label, `${article.id}.chapter.label`);
    assertString(article.chapter.title, `${article.id}.chapter.title`);
    if (article.section !== null) {
      assertObject(article.section, `${article.id}.section`);
      assertString(article.section.id, `${article.id}.section.id`);
      assertString(article.section.label, `${article.id}.section.label`);
      assertString(article.section.title, `${article.id}.section.title`);
    }
    assertStringArray(article.paragraphs, `${article.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assertString(article.fullText, `${article.id}.fullText`);
    assert(
      article.fullText === article.paragraphs.join("\n\n"),
      `${article.id}.fullText does not match its paragraph sequence`,
    );
    assert(/[\u3400-\u9fff]/u.test(article.fullText), `${article.id} contains no Chinese source text`);
    assert(article.language === "zh-CN", `${article.id}.language must be zh-CN`);
    assert(article.textAvailability === "full", `${article.id}.textAvailability must be full`);
    assert(article.source === source, `${article.id}.source is not the configured official publication`);
    assert(article.sourceFragment === source, `${article.id}.sourceFragment must preserve the official publication URL`);
    assert(article.canonicalSource === canonicalSource, `${article.id}.canonicalSource is incorrect`);
    assertString(article.sourceLabel, `${article.id}.sourceLabel`, 20);
    assert(article.retrievedOn === "2026-07-20", `${article.id}.retrievedOn is stale`);
    assert(article.appliesFrom === effectiveFrom, `${article.id}.appliesFrom is incorrect`);
    assertObject(article.sourceVersion, `${article.id}.sourceVersion`);
    assert(article.sourceVersion.officialTitle === officialTitle, `${article.id}.sourceVersion.officialTitle is incorrect`);
    assert(article.sourceVersion.effectiveFrom === effectiveFrom, `${article.id}.sourceVersion.effectiveFrom is incorrect`);
    assertString(article.sourceVersion.versionNote, `${article.id}.sourceVersion.versionNote`, 60);
    assert(
      article.contentSha256 ===
        createHash("sha256").update(article.fullText, "utf8").digest("hex"),
      `${article.id}.contentSha256 does not match its stored official text`,
    );
    assertImportedEnglishTranslation(article, article.id);

    const curated = provisions.find((provision) => provision.id === expectedId);
    if (translatedIds.has(expectedId)) {
      assert(curated, `${expectedId} must retain its curated metadata overlay`);
      assert(curated.instrumentId === instrumentId, `${expectedId} curated overlay targets the wrong instrument`);
      assert(curated.fullText === article.fullText, `${expectedId} curated Chinese text diverges from the official import`);
      assertObject(curated.translations, `${expectedId}.translations`);
      assertObject(curated.translations.en, `${expectedId}.translations.en`);
      assert(
        curated.translations.en.status === "reference",
        `${expectedId} English text must remain labelled as a reference translation`,
      );
    } else {
      assert(!curated, `${expectedId} unexpectedly exposes an unreviewed curated English overlay`);
    }
  });

  const instrument = instruments.find((item) => item.id === instrumentId);
  assert(instrument, `${label} instrument metadata is missing`);
  assert(
    /^separate-complete-official-original-and-(?:government|public-domain)-English-reference-import$/.test(
      instrument.textAvailability.mode,
    ),
    `${instrumentId} must declare its complete original and English reference imports`,
  );
  assert(instrument.textAvailability.language === "zh-CN", `${instrumentId} source language must be zh-CN`);
  assertObject(instrument.coverage, `${instrumentId}.coverage`);
  assert(
    instrument.coverage.unit === "article" &&
      instrument.coverage.first === 1 &&
      instrument.coverage.last === expectedCount &&
      instrument.coverage.count === expectedCount &&
      instrument.coverage.completeness === "complete-official-original-text",
    `${instrumentId}.coverage does not match its complete official corpus`,
  );
}

validateUkGdprArticles();

validateOfficialChineseArticles({
  articles: piplArticles,
  articleIds: piplArticleIds,
  expectedCount: 74,
  instrumentId: "cn-pipl",
  idPrefix: "cn-pipl-art-",
  source: "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
  canonicalSource: "https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html",
  effectiveFrom: "2021-11-01",
  officialTitle: "中华人民共和国个人信息保护法",
  translatedArticleNumbers: [24, 38, 51, 55, 57],
  label: "PIPL",
});

validateOfficialChineseArticles({
  articles: networkDataArticles,
  articleIds: networkDataArticleIds,
  expectedCount: 64,
  instrumentId: "cn-network-data-regulations",
  idPrefix: "cn-network-data-reg-art-",
  source: "https://app.www.gov.cn/govdata/gov/202409/30/520076/article.html",
  effectiveFrom: "2025-01-01",
  officialTitle: "网络数据安全管理条例",
  translatedArticleNumbers: [9, 35, 36, 37, 38, 44],
  label: "Network Data Security Regulation",
});

validateOfficialChineseArticles({
  articles: generativeAiArticles,
  articleIds: generativeAiArticleIds,
  expectedCount: 24,
  instrumentId: "cn-generative-ai-measures",
  idPrefix: "cn-genai-art-",
  source: "https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm",
  effectiveFrom: "2023-08-15",
  officialTitle: "生成式人工智能服务管理暂行办法",
  translatedArticleNumbers: [4, 7, 17],
  label: "Interim Measures for Generative AI Services",
});

function assertImportedTextRecord(article, label) {
  assertString(article.articleNumber, `${label}.articleNumber`);
  assertString(article.label, `${label}.label`);
  assertString(article.title, `${label}.title`);
  if (article.originalTitle !== undefined) {
    assertString(article.originalTitle, `${label}.originalTitle`);
  }
  if (article.chapter !== null) {
    assertObject(article.chapter, `${label}.chapter`);
    if (article.chapter.id !== null) {
      assertString(article.chapter.id, `${label}.chapter.id`);
    }
    assertString(article.chapter.label, `${label}.chapter.label`);
    assertString(article.chapter.title, `${label}.chapter.title`);
  }
  if (article.section !== null) {
    assertObject(article.section, `${label}.section`);
    assertString(article.section.id, `${label}.section.id`);
    assertString(article.section.label, `${label}.section.label`);
    assertString(article.section.title, `${label}.section.title`);
  }
  assertStringArray(article.paragraphs, `${label}.paragraphs`, {
    allowDuplicates: true,
  });
  assertString(article.fullText, `${label}.fullText`);
  assert(
    article.fullText === article.paragraphs.join("\n\n"),
    `${label}.fullText does not match its paragraph sequence`,
  );
  assert(languagePattern.test(article.language), `${label}.language is invalid`);
  assertString(article.textAvailability, `${label}.textAvailability`);
  assertHttpsUrl(article.source, `${label}.source`);
  assertHttpsUrl(article.sourceFragment, `${label}.sourceFragment`);
  assertString(article.sourceLabel, `${label}.sourceLabel`);
  assertIsoDate(article.retrievedOn, `${label}.retrievedOn`);
}

function assertGovernmentEnglishReference(article, label) {
  assertObject(article.translations, `${label}.translations`);
  const translation = article.translations.en;
  assertObject(translation, `${label}.translations.en`);
  assertString(translation.title, `${label}.translations.en.title`);
  assertStringArray(
    translation.paragraphs,
    `${label}.translations.en.paragraphs`,
    { allowDuplicates: true },
  );
  assertString(translation.fullText, `${label}.translations.en.fullText`);
  assert(
    translation.fullText === translation.paragraphs.join("\n\n"),
    `${label}.translations.en.fullText does not match its paragraph sequence`,
  );
  assert(
    translation.status === "official-reference-translation",
    `${label}.translations.en must be labelled as a government reference translation`,
  );
  assertString(translation.authorityNote, `${label}.translations.en.authorityNote`, 40);
  assertHttpsUrl(translation.source, `${label}.translations.en.source`);
  assertString(translation.sourceLabel, `${label}.translations.en.sourceLabel`);
}

function assertCompleteCoverageMetadata(
  instrumentId,
  { count, language, completeness },
) {
  const instrument = instruments.find((item) => item.id === instrumentId);
  assert(instrument, `${instrumentId} instrument metadata is missing`);
  assertObject(instrument.coverage, `${instrumentId}.coverage`);
  assert(
    instrument.coverage.count === count &&
      instrument.coverage.completeness === completeness,
    `${instrumentId}.coverage does not describe its complete imported corpus`,
  );
  assert(instrument.textAvailability.stored, `${instrumentId} must declare locally stored text`);
  assert(
    instrument.textAvailability.language === language,
    `${instrumentId}.textAvailability.language is incorrect`,
  );
}

function validatePipedaCorpus() {
  assert(pipedaProvisions.length === 75, `PIPEDA corpus must contain 75 top-level units; found ${pipedaProvisions.length}`);
  assert(
    pipedaProvisions.filter((item) => item.label.startsWith("Schedule ")).length === 4,
    "PIPEDA corpus must include all four current Schedules",
  );
  for (const provision of pipedaProvisions) {
    assertImportedTextRecord(provision, provision.id);
    assert(provision.instrumentId === "ca-pipeda", `${provision.id} references the wrong instrument`);
    assert(/^Section |^Schedule /.test(provision.label), `${provision.id}.label must identify a Section or Schedule`);
    assert(provision.language === "fr", `${provision.id}.language must be fr`);
    assert(
      provision.textAvailability === "official-co-authentic-current-text",
      `${provision.id} must identify the co-authentic current text`,
    );
    assert(provision.versionAsOf === "2026-03-31", `${provision.id}.versionAsOf is incorrect`);
    assert(provision.lastAmendedOn === "2025-03-04", `${provision.id}.lastAmendedOn is incorrect`);
    assertObject(provision.translations, `${provision.id}.translations`);
    const english = provision.translations.en;
    assertObject(english, `${provision.id}.translations.en`);
    assert(english.status === "official", `${provision.id} English text must be co-authentic official text`);
    assertStringArray(english.paragraphs, `${provision.id}.translations.en.paragraphs`, { allowDuplicates: true });
    assert(english.fullText === english.paragraphs.join("\n\n"), `${provision.id} English fullText is not normalized`);
    assertSource(english.source, `${provision.id}.translations.en.source`, { requireAccessedOn: true });
    assertObject(provision.rights, `${provision.id}.rights`);
    assert(provision.rights.reuseStatus === "open-government-edict", `${provision.id}.rights is incorrect`);
    assertHttpsUrl(provision.rights.licenseUrl, `${provision.id}.rights.licenseUrl`);
  }
  assert(
    pipedaProvisions.find((item) => item.id === "ca-pipeda-sch-1")?.fullText.includes("Responsabilité"),
    "PIPEDA Schedule 1 principles are missing",
  );
  assertCompleteCoverageMetadata("ca-pipeda", {
    count: 75,
    language: "fr",
    completeness: "complete-official-co-authentic-current-text",
  });
}

function validateLgpdCorpus() {
  assert(lgpdArticles.length === 80, `LGPD corpus must contain 80 current Article identifiers; found ${lgpdArticles.length}`);
  for (const article of lgpdArticles) {
    assertImportedTextRecord(article, article.id);
    const expectedSlug = article.articleNumber.toLowerCase();
    assert(article.id === `br-lgpd-art-${expectedSlug}`, `${article.id} does not match its Article locator`);
    assert(article.instrumentId === "br-lgpd-2018", `${article.id} references the wrong instrument`);
    assert(article.language === "pt-BR", `${article.id}.language must be pt-BR`);
    assert(article.textAvailability === "official-current-consolidated-text", `${article.id} is not labelled as current official text`);
    assert(article.versionAsOf === "2026-07-20", `${article.id}.versionAsOf is incorrect`);
    assertImportedEnglishTranslation(article, article.id);
    const isProjectCurrentTranslation = ["5", "55-A", "55-C"].includes(
      article.articleNumber,
    );
    assert(
      article.translations.en.status ===
        (isProjectCurrentTranslation
          ? "project-authored-reference-translation-no-legal-effect"
          : "official-reference-translation-no-legal-effect"),
      `${article.id}.translations.en.status is incorrect`,
    );
    assert(
      article.translations.en.coverageStatus ===
        (isProjectCurrentTranslation
          ? "complete-current-project-reference-translation"
          : "complete-current-wording-official-reference-translation"),
      `${article.id}.translations.en.coverageStatus is incorrect`,
    );
    assertObject(article.translations.en.rights, `${article.id}.translations.en.rights`);
    assertHttpsUrl(
      article.translations.en.rights.licenseUrl,
      `${article.id}.translations.en.rights.licenseUrl`,
    );
    if (isProjectCurrentTranslation) {
      assertObject(
        article.translations.en.historicalOfficialReference,
        `${article.id}.translations.en.historicalOfficialReference`,
      );
      assert(
        article.translations.en.rights.license ===
          "Creative Commons Attribution 4.0 International",
        `${article.id} project-authored English text must retain CC BY 4.0 metadata`,
      );
    } else {
      assert(
        article.translations.en.rights.license ===
          "Creative Commons Attribution-NoDerivs 3.0 Unported",
        `${article.id} ANPD English text must retain CC BY-ND 3.0 metadata`,
      );
    }
    assertObject(article.rights, `${article.id}.rights`);
    assert(article.rights.reuseStatus === "government-edict", `${article.id}.rights is incorrect`);
    assertHttpsUrl(article.rights.licenseUrl, `${article.id}.rights.licenseUrl`);
  }
  assert(
    lgpdArticles.filter(
      (item) =>
        item.translations.en.status ===
        "official-reference-translation-no-legal-effect",
    ).length === 77,
    "LGPD must store 77 current-wording ANPD English references",
  );
  assert(
    lgpdArticles.filter(
      (item) =>
        item.translations.en.status ===
        "project-authored-reference-translation-no-legal-effect",
    ).length === 3,
    "LGPD must store three explicitly labelled current project translations",
  );
  assert(lgpdArticles.find((item) => item.articleNumber === "20")?.fullText.includes("decisões"), "LGPD Article 20 automated-decision text is missing");
  assert(lgpdArticles.find((item) => item.articleNumber === "48")?.fullText.includes("incidente de segurança"), "LGPD Article 48 incident text is missing");
  assertCompleteCoverageMetadata("br-lgpd-2018", {
    count: 80,
    language: "pt-BR",
    completeness: "complete-official-current-portuguese-text",
  });
}

function validateTaiwanAiActCorpus() {
  assert(taiwanAiActArticles.length === 20, `Taiwan AI Basic Act corpus must contain 20 Articles; found ${taiwanAiActArticles.length}`);
  taiwanAiActArticles.forEach((article, index) => {
    const number = String(index + 1);
    assertImportedTextRecord(article, article.id);
    assert(article.id === `tw-ai-basic-act-2026-art-${number}`, `${article.id} does not match Article ${number}`);
    assert(article.instrumentId === "tw-ai-basic-act-2026", `${article.id} references the wrong instrument`);
    assert(article.articleNumber === number, `${article.id}.articleNumber is incorrect`);
    assert(article.language === "zh-Hant-TW", `${article.id}.language must be zh-Hant-TW`);
    assert(article.legalEffectStatus === "in-force", `${article.id} must be in force`);
    assert(article.appliesFrom === "2026-01-14", `${article.id}.appliesFrom is incorrect`);
    assertGovernmentEnglishReference(article, article.id);
    assert(
      article.contentSha256 === createHash("sha256").update(article.fullText, "utf8").digest("hex"),
      `${article.id}.contentSha256 is incorrect`,
    );
  });
  assertCompleteCoverageMetadata("tw-ai-basic-act-2026", {
    count: 20,
    language: "zh-Hant-TW",
    completeness: "complete-official-bilingual-article-corpus",
  });
}

function validateTaiwanPdpaCorpus() {
  assert(taiwanPdpaArticles.length === 66, `Taiwan PDPA corpus must contain 66 Article nodes; found ${taiwanPdpaArticles.length}`);
  const allowedStatuses = new Set([
    "in-force",
    "promulgated-amended-provision-not-in-force",
    "promulgated-amendment-not-in-force",
    "promulgated-deletion-not-in-force",
    "promulgated-new-provision-not-in-force",
  ]);
  for (const article of taiwanPdpaArticles) {
    assertImportedTextRecord(article, article.id);
    assert(article.id === `tw-personal-data-protection-act-art-${article.articleNumber}`, `${article.id} does not match its locator`);
    assert(article.instrumentId === "tw-personal-data-protection-act", `${article.id} references the wrong instrument`);
    assert(article.language === "zh-Hant-TW", `${article.id}.language must be zh-Hant-TW`);
    assert(allowedStatuses.has(article.legalEffectStatus), `${article.id}.legalEffectStatus is unsupported`);
    assertGovernmentEnglishReference(article, article.id);
    assertObject(article.applicability, `${article.id}.applicability`);
    assertString(article.applicability.currentLawStatus, `${article.id}.applicability.currentLawStatus`);
    assert(
      article.contentSha256 === createHash("sha256").update(article.fullText, "utf8").digest("hex"),
      `${article.id}.contentSha256 is incorrect`,
    );
    if (article.legalEffectStatus === "in-force") {
      assertIsoDate(article.appliesFrom, `${article.id}.appliesFrom`);
      assert(article.applicability.currentLawStatus === "in-force", `${article.id} has inconsistent current status`);
      assert(article.currentEffectiveVersion === null, `${article.id} must not duplicate a prior current version`);
    } else {
      assert(article.appliesFrom === null, `${article.id}.appliesFrom must remain null before commencement`);
      assertString(article.applicability.commencementCondition, `${article.id}.applicability.commencementCondition`, 30);
      const priorVersionRemains = /remains-in-force-until-commencement/.test(
        article.applicability.currentLawStatus,
      );
      if (priorVersionRemains) {
        assertObject(article.currentEffectiveVersion, `${article.id}.currentEffectiveVersion`);
        assert(
          article.currentEffectiveVersion.contentSha256 ===
            createHash("sha256").update(article.currentEffectiveVersion.fullText, "utf8").digest("hex"),
          `${article.id}.currentEffectiveVersion.contentSha256 is incorrect`,
        );
      } else {
        assert(article.currentEffectiveVersion === null, `${article.id} has no current-effective counterpart`);
      }
    }
  }
  assert(
    taiwanPdpaArticles.find((item) => item.id === "tw-personal-data-protection-act-art-27")
      ?.currentEffectiveVersion?.fullText.includes("安全措施"),
    "Taiwan PDPA Article 27 must preserve the still-operative security duty while its deletion is uncommenced",
  );
  assertCompleteCoverageMetadata("tw-personal-data-protection-act", {
    count: 66,
    language: "zh-Hant-TW",
    completeness: "complete-official-bilingual-latest-consolidation-with-node-level-commencement-status",
  });
}

function validateSingaporePdpaCorpus() {
  assert(
    singaporePdpaProvisions.length === 106,
    `Singapore PDPA corpus must contain 95 section slots and 11 Schedules; found ${singaporePdpaProvisions.length}`,
  );
  assert(
    singaporePdpaProvisions.filter((item) => item.provisionType === "section")
      .length === 95,
    "Singapore PDPA corpus must retain all 95 current section slots",
  );
  assert(
    singaporePdpaProvisions.filter((item) => item.provisionType === "schedule")
      .length === 11,
    "Singapore PDPA corpus must include all 11 Schedules",
  );
  for (const provision of singaporePdpaProvisions) {
    assertImportedTextRecord(provision, provision.id);
    assert(
      provision.instrumentId === "sg-pdpa-2012",
      `${provision.id} references the wrong instrument`,
    );
    assert(
      /^(?:Section .+|.+ Schedule)$/.test(provision.label),
      `${provision.id}.label must identify a Section or Schedule`,
    );
    assert(provision.language === "en-SG", `${provision.id}.language must be en-SG`);
    assert(
      provision.textAvailability === "government-consolidated-reference-text",
      `${provision.id} must preserve the SSO authority caveat`,
    );
    assert(provision.versionAsOf === "2026-07-20", `${provision.id}.versionAsOf is stale`);
    assert(
      provision.contentSha256 ===
        createHash("sha256").update(provision.fullText, "utf8").digest("hex"),
      `${provision.id}.contentSha256 does not match its stored text`,
    );
    assertObject(provision.rights, `${provision.id}.rights`);
    assert(
      provision.rights.reuseStatus === "permission-with-attribution-conditions",
      `${provision.id}.rights must preserve the AGC reproduction conditions`,
    );
    assertHttpsUrl(provision.rights.licenseUrl, `${provision.id}.rights.licenseUrl`);
    assertString(provision.rights.attribution, `${provision.id}.rights.attribution`, 120);
  }
  for (const number of [27, 28, 29, 30, 31, 32, 33, 34, 35]) {
    assert(
      singaporePdpaProvisions.find((item) => item.id === `sg-pdpa-sec-${number}`)
        ?.legalEffectStatus === "repealed",
      `Singapore PDPA Section ${number} must remain a repealed placeholder`,
    );
  }
  assert(
    singaporePdpaProvisions.find((item) => item.id === "sg-pdpa-sec-24")
      ?.fullText.includes("reasonable security arrangements"),
    "Singapore PDPA Section 24 security duty is missing",
  );
  assertCompleteCoverageMetadata("sg-pdpa-2012", {
    count: 106,
    language: "en-SG",
    completeness:
      "complete-current-government-consolidation-with-repealed-placeholders",
  });
}

function validateGovernmentEdictCorpus({
  records,
  instrumentId,
  expectedCount,
  language,
  completeness,
  expectedTextAvailability,
  expectedLegalStatuses,
}) {
  assert(
    records.length === expectedCount,
    `${instrumentId} corpus must contain ${expectedCount} units; found ${records.length}`,
  );
  for (const record of records) {
    assertImportedTextRecord(record, record.id);
    assert(
      record.instrumentId === instrumentId,
      `${record.id} references the wrong instrument`,
    );
    assert(record.language === language, `${record.id}.language must be ${language}`);
    assert(
      record.textAvailability === expectedTextAvailability,
      `${record.id}.textAvailability is incorrect`,
    );
    assert(record.versionAsOf === "2026-07-20", `${record.id}.versionAsOf is stale`);
    assert(
      expectedLegalStatuses.has(record.legalEffectStatus),
      `${record.id}.legalEffectStatus is unsupported`,
    );
    assert(
      record.contentSha256 ===
        createHash("sha256").update(record.fullText, "utf8").digest("hex"),
      `${record.id}.contentSha256 does not match its stored text`,
    );
    assertObject(record.rights, `${record.id}.rights`);
    assert(
      record.rights.reuseStatus === "government-edict",
      `${record.id}.rights must identify government-edict reuse`,
    );
    assertHttpsUrl(record.rights.licenseUrl, `${record.id}.rights.licenseUrl`);
    assertString(record.rights.attribution, `${record.id}.rights.attribution`, 40);
  }
  assertCompleteCoverageMetadata(instrumentId, {
    count: expectedCount,
    language,
    completeness,
  });
}

function validateAfricaIndonesiaCorpora() {
  validateGovernmentEdictCorpus({
    records: southAfricaPopiaSections,
    instrumentId: "za-popia-4-2013",
    expectedCount: 116,
    language: "en-ZA",
    completeness: "complete-current-official-section-and-schedule-corpus",
    expectedTextAvailability: "official-current-consolidated-statutory-text",
    expectedLegalStatuses: new Set(["in-force"]),
  });
  assert(
    southAfricaPopiaSections.filter((item) => item.articleNumber === "Schedule")
      .length === 1,
    "South Africa POPIA corpus must include its complete Schedule",
  );
  assert(
    southAfricaPopiaSections.find((item) => item.id === "za-popia-s-22")
      ?.fullText.includes("security compromise"),
    "South Africa POPIA section 22 breach-notification text is missing",
  );

  validateGovernmentEdictCorpus({
    records: nigeriaNdpaSections,
    instrumentId: "ng-data-protection-act-2023",
    expectedCount: 67,
    language: "en-NG",
    completeness: "complete-official-enacted-section-and-schedule-corpus",
    expectedTextAvailability: "official-enacted-text",
    expectedLegalStatuses: new Set(["in-force-unamended"]),
  });
  assert(
    nigeriaNdpaSections.find((item) => item.id === "ng-ndpa-2023-s-37")
      ?.fullText.includes("automated processing"),
    "Nigeria NDPA section 37 automated-decision text is missing",
  );

  validateGovernmentEdictCorpus({
    records: indonesiaPdpArticles,
    instrumentId: "id-pdp-law-2022",
    expectedCount: 76,
    language: "id-ID",
    completeness: "complete-official-original-article-corpus-with-judicial-overlay",
    expectedTextAvailability: "official-original-text-verified-transcription",
    expectedLegalStatuses: new Set([
      "in-force",
      "in-force-as-conditionally-interpreted",
    ]),
  });
  for (const article of indonesiaPdpArticles) {
    assertImportedEnglishTranslation(article, article.id);
    assert(
      article.translationStatus === "complete-current-project-reference" &&
        article.currentLanguageToggleEligible === true &&
        article.translations.en.coverageStatus ===
          "complete-current-project-reference" &&
        article.translations.en.currentTextEquivalent === true &&
        article.translations.en.legalEffectStatus === article.legalEffectStatus,
      `${article.id} must expose a complete project reference aligned to the current operative Indonesian text`,
    );
  }
  const article53 = indonesiaPdpArticles.find(
    (item) => item.id === "id-pdp-law-2022-art-53",
  );
  assertObject(article53?.legalEffect, "Indonesia PDP Article 53 legalEffect");
  assertString(article53.currentOperativeText, "Indonesia PDP Article 53 currentOperativeText");
  assert(
    article53.currentOperativeSha256 ===
      createHash("sha256")
        .update(article53.currentOperativeText, "utf8")
        .digest("hex"),
    "Indonesia PDP Article 53 current operative hash is incorrect",
  );
  assert(
    article53.currentOperativeText.includes("dan/atau"),
    "Indonesia PDP Article 53 must retain the binding judicial interpretation",
  );
  assert(
    article53.translations.en.fullText.includes("; and/or") &&
      article53.translations.en.legalEffectAlignment ===
        "current-operative-text-after-Decision-151-PUU-XXII-2024",
    "Indonesia PDP Article 53 English must apply and disclose the binding and/or interpretation",
  );
}

function assertCorpusUnitBasics(record, label) {
  assertString(record.label, `${label}.label`);
  assertString(record.title, `${label}.title`);
  assertStringArray(record.paragraphs, `${label}.paragraphs`, {
    allowDuplicates: true,
  });
  assertString(record.fullText, `${label}.fullText`);
  assert(
    record.fullText === record.paragraphs.join("\n\n"),
    `${label}.fullText does not match its paragraph sequence`,
  );
  assert(languagePattern.test(record.language), `${label}.language is invalid`);
  assertString(record.textAvailability, `${label}.textAvailability`);
  assertHttpsUrl(record.source, `${label}.source`);
  assertString(record.sourceFragment, `${label}.sourceFragment`);
  assert(
    record.sourceFragment.startsWith("#") ||
      (() => {
        try {
          return new URL(record.sourceFragment).protocol === "https:";
        } catch {
          return false;
        }
      })(),
    `${label}.sourceFragment must be an HTTPS URL or a document fragment`,
  );
  assertString(record.sourceLabel, `${label}.sourceLabel`);
  assertIsoDate(record.retrievedOn, `${label}.retrievedOn`);
  assert(
    record.contentSha256 ===
      createHash("sha256").update(record.fullText, "utf8").digest("hex"),
    `${label}.contentSha256 does not match its stored text`,
  );
  assertObject(record.rights, `${label}.rights`);
  assertString(record.rights.reuseStatus, `${label}.rights.reuseStatus`);
  assertHttpsUrl(record.rights.basisUrl, `${label}.rights.basisUrl`);
  assertString(record.rights.note, `${label}.rights.note`, 40);
}

function assertOfficialReferenceTranslation(record, label) {
  assertObject(record.translations, `${label}.translations`);
  const english = record.translations.en;
  assertObject(english, `${label}.translations.en`);
  assert(
    english.status === "official-reference-translation",
    `${label}.translations.en must be an official reference translation`,
  );
  assertString(english.authorityNote, `${label}.translations.en.authorityNote`, 40);
  assertStringArray(english.paragraphs, `${label}.translations.en.paragraphs`, {
    allowDuplicates: true,
  });
  assert(
    english.fullText === english.paragraphs.join("\n\n"),
    `${label}.translations.en.fullText is not normalized`,
  );
  assertHttpsUrl(english.source, `${label}.translations.en.source`);
  assert(
    english.contentSha256 ===
      createHash("sha256").update(english.fullText, "utf8").digest("hex"),
    `${label}.translations.en.contentSha256 is incorrect`,
  );
}

function validateIndiaGulfCorpora() {
  assert(
    indiaDpdpActProvisions.length === 45 &&
      indiaDpdpActProvisions.filter((item) => item.unitType === "section")
        .length === 44 &&
      indiaDpdpActProvisions.filter((item) => item.unitType === "schedule")
        .length === 1,
    "India DPDP Act corpus must contain 44 Sections and the Schedule",
  );
  for (const provision of indiaDpdpActProvisions) {
    assertCorpusUnitBasics(provision, provision.id);
    assert(
      provision.instrumentId === "in-dpdp-act-2023",
      `${provision.id} references the wrong instrument`,
    );
    assert(provision.language === "en-IN", `${provision.id}.language must be en-IN`);
    assert(
      provision.textAvailability === "complete-official-text",
      `${provision.id}.textAvailability is incorrect`,
    );
    assert(
      new Set([
        "in-force",
        "scheduled-commencement",
        "phased-commencement",
        "partially-in-force-phased",
      ]).has(provision.legalEffectStatus),
      `${provision.id}.legalEffectStatus is unsupported`,
    );
  }
  assertCompleteCoverageMetadata("in-dpdp-act-2023", {
    count: 45,
    language: "en-IN",
    completeness:
      "complete-official-enacted-section-and-schedule-corpus-with-phase-status",
  });

  assert(
    indiaDpdpRulesProvisions.length === 30 &&
      indiaDpdpRulesProvisions.filter((item) => item.unitType === "rule")
        .length === 23 &&
      indiaDpdpRulesProvisions.filter((item) => item.unitType === "schedule")
        .length === 7,
    "India DPDP Rules corpus must contain 23 Rules and seven Schedules",
  );
  for (const provision of indiaDpdpRulesProvisions) {
    assertCorpusUnitBasics(provision, provision.id);
    assert(
      provision.instrumentId === "in-dpdp-rules-2025",
      `${provision.id} references the wrong instrument`,
    );
    assert(provision.language === "en-IN", `${provision.id}.language must be en-IN`);
    assert(
      provision.textAvailability === "complete-official-text-as-corrected",
      `${provision.id}.textAvailability is incorrect`,
    );
    assert(
      new Set(["in-force", "scheduled-commencement"]).has(
        provision.legalEffectStatus,
      ),
      `${provision.id}.legalEffectStatus is unsupported`,
    );
  }
  assertCompleteCoverageMetadata("in-dpdp-rules-2025", {
    count: 30,
    language: "en-IN",
    completeness:
      "complete-official-corrected-rule-and-schedule-corpus-with-phase-status",
  });

  const gulfCorpora = [
    {
      records: uaePdplArticles,
      instrumentId: "ae-federal-pdpl-45-2021",
      count: 31,
      language: "ar-AE",
      completeness:
        "complete-controlling-arabic-and-official-english-reference-article-corpus",
    },
    {
      records: saudiPdplArticles,
      instrumentId: "sa-pdpl-2021-amended-2023",
      count: 43,
      language: "ar-SA",
      completeness:
        "complete-consolidated-arabic-and-official-english-reference-article-corpus",
    },
    {
      records: saudiPdplImplementingArticles,
      instrumentId: "sa-pdpl-implementing-regulation-2023",
      count: 38,
      language: "ar-SA",
      completeness:
        "complete-controlling-arabic-and-official-english-reference-article-corpus",
    },
    {
      records: saudiPdplTransferArticles,
      instrumentId: "sa-pdpl-transfer-regulation-2023",
      count: 9,
      language: "ar-SA",
      completeness:
        "complete-version-2-controlling-arabic-and-official-english-reference-article-corpus",
    },
  ];
  for (const corpus of gulfCorpora) {
    assert(
      corpus.records.length === corpus.count,
      `${corpus.instrumentId} corpus must contain ${corpus.count} Articles`,
    );
    corpus.records.forEach((article, index) => {
      assertCorpusUnitBasics(article, article.id);
      assertOfficialReferenceTranslation(article, article.id);
      assert(
        article.instrumentId === corpus.instrumentId,
        `${article.id} references the wrong instrument`,
      );
      assert(
        article.articleNumber === String(index + 1),
        `${article.id}.articleNumber is not sequential`,
      );
      assert(article.language === corpus.language, `${article.id}.language is incorrect`);
      assert(article.legalEffectStatus === "in-force", `${article.id} must be in force`);
    });
    assertCompleteCoverageMetadata(corpus.instrumentId, {
      count: corpus.count,
      language: corpus.language,
      completeness: corpus.completeness,
    });
  }
  assert(
    saudiPdplTransferArticles.every((article) => article.appliesFrom === null),
    "Saudi Transfer Regulation must not invent an unverified Gazette publication date",
  );
}

function validateAustraliaPrivacyActCorpus() {
  assert(
    australiaPrivacyActProvisions.length === 352,
    `Australia Privacy Act corpus must contain 352 current nodes; found ${australiaPrivacyActProvisions.length}`,
  );
  const typeCounts = australiaPrivacyActProvisions.reduce((counts, provision) => {
    counts.set(
      provision.provisionType,
      (counts.get(provision.provisionType) ?? 0) + 1,
    );
    return counts;
  }, new Map());
  assert(typeCounts.get("section") === 313, "Australia corpus must contain 313 Sections");
  assert(
    typeCounts.get("australian-privacy-principle") === 13,
    "Australia corpus must contain all 13 current APPs",
  );
  assert(
    typeCounts.get("schedule-clause") === 26,
    "Australia corpus must contain 26 Schedule 2 clauses",
  );

  for (const provision of australiaPrivacyActProvisions) {
    assertImportedTextRecord(provision, provision.id);
    assert(
      provision.instrumentId === "au-privacy-act-1988",
      `${provision.id} references the wrong instrument`,
    );
    assert(provision.language === "en-AU", `${provision.id}.language must be en-AU`);
    assert(
      provision.textAvailability ===
        "official-authorised-current-consolidated-text",
      `${provision.id}.textAvailability is incorrect`,
    );
    assert(provision.versionAsOf === "2026-06-04", `${provision.id}.versionAsOf is incorrect`);
    assert(provision.legalEffectStatus === "in-force", `${provision.id} must be in force`);
    assert(provision.currentTextOnly === true, `${provision.id} must be current text only`);
    assert(
      provision.uncommencedAmendmentsIncluded === false,
      `${provision.id} must not mix future amendments into current text`,
    );
    assert(
      provision.sourceSnapshotSha256 ===
        "6d0a43e5da103d1eeb5317ae9ac213c5b51acab2357dc01b981a91e1052c5c3b",
      `${provision.id}.sourceSnapshotSha256 is incorrect`,
    );
    assert(
      provision.contentSha256 ===
        createHash("sha256").update(provision.fullText, "utf8").digest("hex"),
      `${provision.id}.contentSha256 does not match its stored text`,
    );
    assertObject(provision.rights, `${provision.id}.rights`);
    assert(
      provision.rights.reuseStatus === "open-with-exclusions",
      `${provision.id}.rights must preserve the Federal Register exclusions`,
    );
    assertHttpsUrl(provision.rights.licenseUrl, `${provision.id}.rights.licenseUrl`);
    assertHttpsUrl(provision.rights.termsUrl, `${provision.id}.rights.termsUrl`);
  }

  const app1 = australiaPrivacyActProvisions.find(
    (item) => item.id === "au-privacy-act-1988-app-1",
  );
  assert(app1?.hasEnactedFutureAmendment === true, "APP 1 future amendment metadata is missing");
  assert(
    !app1.fullText.includes("1.7"),
    "Future APP 1.7-1.9 wording must not appear in the current text",
  );
  assert(
    app1.futureAmendments.every(
      (amendment) => amendment.includedInStoredText === false,
    ),
    "APP 1 future amendments must remain excluded from stored current text",
  );
  assertCompleteCoverageMetadata("au-privacy-act-1988", {
    count: 352,
    language: "en-AU",
    completeness:
      "complete-authorised-current-sections-apps-and-schedule-2-clauses",
  });
}

function validateJapanHongKongCorpora() {
  assert(
    japanAppiArticles.length === 208,
    `Japan APPI corpus must contain 208 current nodes; found ${japanAppiArticles.length}`,
  );
  assert(
    japanAppiArticles.filter((item) => item.unitType === "article").length === 185,
    "Japan APPI corpus must contain 185 main Articles",
  );
  assert(
    japanAppiArticles.filter(
      (item) => item.unitType === "supplementary-provision-block",
    ).length === 21,
    "Japan APPI corpus must contain 21 current supplementary-provision blocks",
  );
  assert(
    japanAppiArticles.filter((item) => item.unitType === "appended-table").length === 2,
    "Japan APPI corpus must contain both appended tables",
  );
  for (const provision of japanAppiArticles) {
    assertString(provision.label, `${provision.id}.label`);
    assertString(provision.title, `${provision.id}.title`);
    assertStringArray(provision.paragraphs, `${provision.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assertString(provision.fullText, `${provision.id}.fullText`);
    assert(
      provision.fullText.endsWith(provision.paragraphs.join("\n\n")),
      `${provision.id}.fullText does not preserve its source paragraph sequence`,
    );
    assertHttpsUrl(provision.source, `${provision.id}.source`);
    assertHttpsUrl(provision.sourceFragment, `${provision.id}.sourceFragment`);
    assertIsoDate(provision.retrievedOn, `${provision.id}.retrievedOn`);
    assert(provision.instrumentId === "jp-appi", `${provision.id} references the wrong instrument`);
    assert(provision.language === "ja-JP", `${provision.id}.language must be ja-JP`);
    assert(provision.versionAsOf === "2026-07-20", `${provision.id}.versionAsOf is incorrect`);
    if (
      provision.translationStatus ===
      "project-authored-reference-translation-no-legal-effect"
    ) {
      assert(
        provision.translations?.en?.status ===
          "project-authored-reference-translation-no-legal-effect",
        `${provision.id} must identify the nonofficial project English reference`,
      );
      assertImportedEnglishTranslation(provision, provision.id);
      assert(
        provision.translations.en.coverageStatus ===
            "complete-current-project-reference" &&
          provision.translations.en.currentTextEquivalent === true &&
          provision.translations.en.versionAsOf === "2026-07-20",
        `${provision.id} must align its project English reference to the current e-Gov unit`,
      );
      if (provision.unitType === "supplementary-provision-block") {
        assertObject(provision.englishAvailability, `${provision.id}.englishAvailability`);
        assert(
          provision.englishAvailability.coverageStatus ===
            "complete-current-project-reference",
          `${provision.id}.englishAvailability must identify complete project coverage`,
        );
        assertString(
          provision.englishAvailability.authorityNote ??
            provision.englishAvailability.note,
          `${provision.id}.englishAvailability authority note`,
          30,
        );
      } else {
        assert(
          /^project-reference-aligned-to-current-japanese-after-(?:article|table)-level-difference-review$/.test(
            provision.translations.en.sourceVersion?.versionAlignment ?? "",
          ),
          `${provision.id} changed-unit project reference lacks its current-Japanese comparison decision`,
        );
        assertString(
          provision.translations.en.sourceVersion?.alignmentComparisonRecordSha256,
          `${provision.id}.translations.en.sourceVersion.alignmentComparisonRecordSha256`,
          64,
        );
      }
    } else {
      assert(
        provision.translationStatus ===
          "government-reference-translation-current-text-equivalent-verified",
        `${provision.id} must identify the verified current-equivalent government reference`,
      );
      assertImportedEnglishTranslation(provision, provision.id);
      assert(
        provision.translations.en.coverageStatus ===
            "complete-current-equivalent-government-reference" &&
          provision.translations.en.currentTextEquivalent === true &&
          provision.translations.en.versionAsOf === "2021-05-19",
        `${provision.id} must preserve the JLT version while recording current text equivalence`,
      );
      assert(
        provision.translations.en.sourceVersion?.versionAlignment ===
          "article-level-normalized-japanese-current-equivalence-verified",
        `${provision.id} lacks its normalized Japanese comparison decision`,
      );
    }
  }
  assert(
    japanAppiArticles.filter(
      (item) =>
        item.translationStatus ===
        "government-reference-translation-current-text-equivalent-verified",
    ).length === 172,
    "Japan APPI must retain exactly 172 verified current-equivalent government references",
  );
  assert(
    japanAppiArticles.filter(
      (item) =>
        item.translationStatus ===
        "project-authored-reference-translation-no-legal-effect",
    ).length === 36,
    "Japan APPI must contain exactly 36 current-aligned project English references",
  );
  assert(
    japanAppiArticles.filter((item) => item.translations?.en?.fullText).length === 208,
    "Japan APPI must store English text for all 185 main Articles, 21 supplementary blocks and two tables",
  );
  assertCompleteCoverageMetadata("jp-appi", {
    count: 208,
    language: "ja-JP",
    completeness:
      "complete-current-authoritative-japanese-article-supplement-and-table-corpus",
  });

  assert(
    japanAiPromotionActArticles.length === 29,
    `Japan AI Promotion Act corpus must contain 29 current nodes; found ${japanAiPromotionActArticles.length}`,
  );
  assert(
    japanAiPromotionActArticles.filter((item) => item.unitType === "article").length === 28,
    "Japan AI Promotion Act must contain all 28 main Articles",
  );
  assert(
    japanAiPromotionActArticles.filter(
      (item) => item.unitType === "supplementary-provision-block",
    ).length === 1,
    "Japan AI Promotion Act must contain one complete current supplementary-provision block",
  );
  for (const provision of japanAiPromotionActArticles) {
    assertString(provision.label, `${provision.id}.label`);
    assertString(provision.title, `${provision.id}.title`);
    assertStringArray(provision.paragraphs, `${provision.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assertString(provision.fullText, `${provision.id}.fullText`);
    assert(
      provision.fullText.endsWith(provision.paragraphs.join("\n\n")),
      `${provision.id}.fullText does not preserve its source paragraph sequence`,
    );
    assertHttpsUrl(provision.source, `${provision.id}.source`);
    assertHttpsUrl(provision.sourceFragment, `${provision.id}.sourceFragment`);
    assertIsoDate(provision.retrievedOn, `${provision.id}.retrievedOn`);
    assert(
      provision.instrumentId === "jp-ai-promotion-act-2025",
      `${provision.id} references the wrong instrument`,
    );
    assert(provision.language === "ja-JP", `${provision.id}.language must be ja-JP`);
    const english = provision.translations?.en;
    assertObject(english, `${provision.id}.translations.en`);
    assert(
      english.status === "government-reference-translation-no-legal-effect",
      `${provision.id} English must be labelled as a no-legal-effect government reference`,
    );
    assertStringArray(
      english.paragraphs,
      `${provision.id}.translations.en.paragraphs`,
      { allowDuplicates: true },
    );
    assert(
      english.fullText.endsWith(english.paragraphs.join("\n\n")),
      `${provision.id} English fullText does not preserve its paragraph sequence`,
    );
    assertHttpsUrl(english.source, `${provision.id}.translations.en.source`);
  }
  assertCompleteCoverageMetadata("jp-ai-promotion-act-2025", {
    count: 29,
    language: "ja-JP",
    completeness:
      "complete-current-japanese-and-government-english-reference-corpus",
  });

  assert(
    hongKongPdpoProvisions.length === 130,
    `Hong Kong PDPO corpus must contain 130 nodes; found ${hongKongPdpoProvisions.length}`,
  );
  assert(
    hongKongPdpoProvisions.filter((item) => item.provisionType === "section").length === 124,
    "Hong Kong PDPO corpus must contain 124 Sections",
  );
  assert(
    hongKongPdpoProvisions.filter((item) => item.provisionType === "schedule").length === 6,
    "Hong Kong PDPO corpus must contain six Schedules",
  );
  for (const provision of hongKongPdpoProvisions) {
    assertImportedTextRecord(provision, provision.id);
    assert(
      provision.instrumentId === "hk-personal-data-privacy-ordinance",
      `${provision.id} references the wrong instrument`,
    );
    assert(provision.language === "en-HK", `${provision.id}.language must be en-HK`);
    const chinese = provision.translations?.["zh-Hant-HK"];
    assertObject(chinese, `${provision.id}.translations.zh-Hant-HK`);
    assert(
      chinese.status === "official-co-authentic-equal-status",
      `${provision.id} Chinese text must be labelled co-authentic and equal-status`,
    );
    assert(
      chinese.fullText === chinese.paragraphs.join("\n\n"),
      `${provision.id} Chinese fullText is not normalized`,
    );
    assertHttpsUrl(chinese.source, `${provision.id}.translations.zh-Hant-HK.source`);
  }
  const hkSection33 = hongKongPdpoProvisions.find(
    (item) => item.articleNumber === "33" && item.provisionType === "section",
  );
  assert(
    hkSection33?.legalEffectStatus === "enacted-not-yet-in-operation",
    "Hong Kong PDPO section 33 must remain enacted but not in operation",
  );
  assertCompleteCoverageMetadata("hk-personal-data-privacy-ordinance", {
    count: 130,
    language: "en-HK",
    completeness:
      "complete-official-co-authentic-bilingual-current-corpus-with-commencement-status",
  });
}

function validateSwissVietnamKoreaAndUsCorpora() {
  const validateExactTextNodes = (records, { instrumentId, language }) => {
    for (const record of records) {
      assertString(record.id, `${instrumentId} provision id`);
      assert(record.instrumentId === instrumentId, `${record.id} references the wrong corpus instrument`);
      assertString(record.label, `${record.id}.label`);
      assertString(record.title, `${record.id}.title`);
      assertStringArray(record.paragraphs, `${record.id}.paragraphs`, {
        allowDuplicates: true,
      });
      assert(
        record.fullText === record.paragraphs.join("\n\n"),
        `${record.id}.fullText does not match its paragraph sequence`,
      );
      assert(record.language === language, `${record.id}.language must be ${language}`);
      assertHttpsUrl(record.source, `${record.id}.source`);
      assertIsoDate(record.retrievedOn, `${record.id}.retrievedOn`);
      assert(
        record.contentSha256 ===
          createHash("sha256").update(record.fullText, "utf8").digest("hex"),
        `${record.id}.contentSha256 does not match its stored text`,
      );
      assertObject(record.rights, `${record.id}.rights`);
    }
  };

  assert(swissFadpProvisions.length === 79, "Swiss FADP must contain 77 Articles and two Annexes");
  validateExactTextNodes(swissFadpProvisions, {
    instrumentId: "ch-fadp-2020",
    language: "en-CH",
  });
  for (const provision of swissFadpProvisions) {
    assert(
      provision.defaultLanguageStatus === "official-non-authoritative-translation",
      `${provision.id} must retain the non-authoritative English status`,
    );
    for (const language of ["de-CH", "fr-CH", "it-CH"]) {
      const translation = provision.translations?.[language];
      assertObject(translation, `${provision.id}.translations.${language}`);
      assert(
        translation.status === "official-authoritative-equal-status",
        `${provision.id}.${language} must be authoritative and equal-status`,
      );
      assert(
        translation.fullText === translation.paragraphs.join("\n\n"),
        `${provision.id}.${language} fullText is not normalized`,
      );
    }
  }
  assertCompleteCoverageMetadata("ch-fadp-2020", {
    count: 79,
    language: "en-CH",
    completeness: "complete-current-four-language-aligned-article-and-annex-corpus",
  });

  assert(vietnamPdplArticles.length === 39, "Vietnam PDP Law must contain all 39 Articles");
  assert(vietnamDecree356Provisions.length === 55, "Vietnam Decree 356 must contain 42 Articles and 13 forms");
  assert(vietnamDecree13HistoricalProvisions.length === 50, "Vietnam Decree 13 must contain 44 Articles and six forms");
  validateExactTextNodes(vietnamPdplArticles, {
    instrumentId: "vn-personal-data-protection-law-2025",
    language: "vi-VN",
  });
  validateExactTextNodes(vietnamDecree356Provisions, {
    instrumentId: "vn-decree-356-2025",
    language: "vi-VN",
  });
  validateExactTextNodes(vietnamDecree13HistoricalProvisions, {
    instrumentId: "vn-decree-13-2023",
    language: "vi-VN",
  });
  assert(vietnamPdplArticles.every((item) => item.legalEffectStatus === "in-force"), "Vietnam PDP Law nodes must be current");
  assert(vietnamDecree356Provisions.every((item) => item.legalEffectStatus === "in-force"), "Vietnam Decree 356 nodes must be current");
  assert(vietnamDecree13HistoricalProvisions.every((item) => item.legalEffectStatus === "repealed"), "Vietnam Decree 13 nodes must remain historical and repealed");
  assertCompleteCoverageMetadata("vn-personal-data-protection-law-2025", {
    count: 39,
    language: "vi-VN",
    completeness: "complete-current-official-vietnamese-article-corpus",
  });
  assertCompleteCoverageMetadata("vn-pdpl-implementing-decree-356-2025", {
    count: 55,
    language: "vi-VN",
    completeness: "complete-current-official-vietnamese-article-and-appendix-form-corpus",
  });
  assertCompleteCoverageMetadata("vn-personal-data-protection-decree-13-2023", {
    count: 50,
    language: "vi-VN",
    completeness: "complete-repealed-historical-official-vietnamese-corpus",
  });

  for (const provision of [
    ...vietnamPdplArticles,
    ...vietnamDecree356Provisions,
  ]) {
    assertImportedEnglishTranslation(provision, provision.id);
    assert(
      provision.translationStatus ===
          "complete-current-project-reference-nonofficial" &&
        provision.translations.en.coverageStatus ===
          "complete-current-project-reference" &&
        provision.translations.en.currentTextEquivalent === true,
      `${provision.id} must expose a complete current, nonofficial project English reference`,
    );
  }
  for (const provision of vietnamDecree13HistoricalProvisions) {
    assertImportedEnglishTranslation(provision, provision.id);
    assert(
      provision.translationStatus ===
          "project-authored-reference-translation-no-legal-effect" &&
        provision.translations.en.coverageStatus ===
          "complete-historical-project-reference" &&
        provision.translations.en.currentTextEquivalent === true &&
        provision.translations.en.legalEffectStatus === "repealed",
      `${provision.id} must expose a complete project English reference for the stored repealed version`,
    );
  }

  assert(koreaPipaArticles.length === 138, "Korea PIPA must contain 126 Articles and 12 supplements");
  assert(koreaAiFrameworkArticles.length === 47, "Korea AI Framework Act must contain 44 Articles and three supplements on 20 July 2026");
  validateExactTextNodes(koreaPipaArticles, {
    instrumentId: "kr-pipa-2011",
    language: "ko-KR",
  });
  validateExactTextNodes(koreaAiFrameworkArticles, {
    instrumentId: "kr-ai-framework-act-2025",
    language: "ko-KR",
  });
  for (const provision of koreaPipaArticles) {
    assertImportedEnglishTranslation(provision, provision.id);
    assert(
      provision.translationStatus === "government-current-reference-stored-no-legal-effect" &&
        provision.translations.en.coverageStatus === "complete-current-reference" &&
        provision.translations.en.currentTextEquivalent === true &&
        provision.translations.en.versionAsOf === "2025-10-02",
      `${provision.id} must identify the current MOLEG English reference`,
    );
  }
  const nextPhaseAiArticleNumbers = new Set(["2", "3", "6", "18", "35"]);
  for (const provision of koreaAiFrameworkArticles) {
    assertImportedEnglishTranslation(provision, provision.id);
    const differsFromCurrent = nextPhaseAiArticleNumbers.has(provision.articleNumber);
    assert(
      provision.translations.en.currentTextEquivalent === !differsFromCurrent,
      `${provision.id}.translations.en.currentTextEquivalent is incorrect`,
    );
    assert(
      provision.translations.en.coverageStatus ===
        (differsFromCurrent
          ? "complete-next-phase-reference-not-current"
          : provision.unitType === "supplementary-provision-block"
            ? "complete-promulgated-addenda-reference"
            : "complete-current-aligned-reference"),
      `${provision.id}.translations.en.coverageStatus is incorrect`,
    );
    assert(
      provision.translationStatus ===
        "government-next-phase-reference-stored-provision-warning",
      `${provision.id}.translationStatus is incorrect`,
    );
  }
  assert(
    koreaAiFrameworkArticles.filter(
      (item) => item.translations.en.currentTextEquivalent === false,
    ).length === 5,
    "Korea AI Act must flag exactly five Articles whose available English wording belongs to the 21 July 2026 phase",
  );
  assertCompleteCoverageMetadata("kr-pipa-2011", {
    count: 138,
    language: "ko-KR",
    completeness: "complete-current-authoritative-korean-article-and-supplement-corpus",
  });
  assertCompleteCoverageMetadata("kr-ai-framework-act-2025", {
    count: 47,
    language: "ko-KR",
    completeness: "complete-current-authoritative-korean-article-and-supplement-corpus",
  });

  assert(usExecutiveOrderProvisions.length === 37, "US Executive Order corpus must contain 37 nodes");
  const eo14110 = usExecutiveOrderProvisions.filter((item) => item.instrumentId === "us-eo-14110");
  const eo14179 = usExecutiveOrderProvisions.filter((item) => item.instrumentId === "us-eo-14179");
  assert(eo14110.length === 30 && eo14179.length === 7, "US Executive Order corpus counts are incorrect");
  validateExactTextNodes(eo14110, { instrumentId: "us-eo-14110", language: "en-US" });
  validateExactTextNodes(eo14179, { instrumentId: "us-eo-14179", language: "en-US" });
  assert(eo14110.every((item) => item.legalEffectStatus === "revoked-historical-text"), "EO 14110 must remain revoked historical text");
  assert(eo14179.every((item) => item.legalEffectStatus === "in-force-executive-order"), "EO 14179 must remain the current order");
  assertCompleteCoverageMetadata("us-eo-14110", {
    count: 30,
    language: "en-US",
    completeness: "complete-revoked-historical-official-executive-order-corpus",
  });
  assertCompleteCoverageMetadata("us-eo-14179", {
    count: 7,
    language: "en-US",
    completeness: "complete-current-official-executive-order-corpus",
  });

  assert(
    taiwanExecutiveYuanGenAiGuidelines.length === 11,
    "Taiwan Executive Yuan GenAI guidance must contain the general explanation and all ten points",
  );
  for (const point of taiwanExecutiveYuanGenAiGuidelines) {
    assert(
      point.instrumentId === "tw-executive-yuan-generative-ai-guidelines-2023",
      `${point.id} references the wrong instrument`,
    );
    assert(point.language === "zh-Hant-TW", `${point.id}.language must be zh-Hant-TW`);
    assertString(point.label, `${point.id}.label`);
    assertString(point.title, `${point.id}.title`);
    assertString(point.summary, `${point.id}.summary`, 20);
    assertStringArray(point.paragraphs, `${point.id}.paragraphs`, {
      allowDuplicates: true,
    });
    assert(
      point.fullText === point.paragraphs.join("\n\n"),
      `${point.id}.fullText does not match its paragraph sequence`,
    );
    assert(
      point.contentSha256 ===
        createHash("sha256").update(point.fullText, "utf8").digest("hex"),
      `${point.id}.contentSha256 does not match its official text`,
    );
    assertHttpsUrl(point.source, `${point.id}.source`);
    assertImportedEnglishTranslation(point, point.id);
    assert(
      point.currentLanguageToggleEligible === true &&
        point.translationStatus ===
          "complete-current-guidance-project-reference" &&
        point.translations.en.coverageStatus ===
          "complete-current-guidance-project-reference" &&
        point.translations.en.currentTextEquivalent === true &&
        point.translations.en.legalEffectStatus ===
          "active-non-binding-public-sector-guidance",
      `${point.id} must expose a complete nonofficial English reference while preserving the guidance's non-binding status`,
    );
    assertReferenceArray(
      point.coreConceptIds,
      conceptIds,
      `${point.id}.coreConceptIds`,
    );
    assert(point.thematicRelevance?.highlightEntireUnit === true, `${point.id} must be highlighted as theme-relevant`);
  }
  assertCompleteCoverageMetadata("tw-executive-yuan-generative-ai-guidelines-2023", {
    count: 11,
    language: "zh-Hant-TW",
    completeness: "complete-current-official-traditional-chinese-guidance-corpus",
  });
}

function validateBrazilAiBillCorpus() {
  const expectedNumbers = [
    ...Array.from({ length: 30 }, (_, index) => String(index + 1)),
    ...Array.from({ length: 49 }, (_, index) => String(index + 32)),
  ];
  assert(
    brazilAiBillArticles.length === 79,
    `Brazil AI Bill corpus must contain 79 Articles; found ${brazilAiBillArticles.length}`,
  );
  assert(
    !brazilAiBillArticles.some((article) => article.articleNumber === "31"),
    "Brazil AI Bill must preserve the official numbering gap at Article 31",
  );
  brazilAiBillArticles.forEach((article, index) => {
    const number = expectedNumbers[index];
    assert(article.id === `br-pl2338-art-${number}`, `${article.id} does not match Article ${number}`);
    assert(article.instrumentId === "br-pl-2338-2023-ai-bill", `${article.id} references the wrong instrument`);
    assert(article.articleNumber === number, `${article.id}.articleNumber is incorrect`);
    assert(article.language === "pt-BR", `${article.id}.language must be pt-BR`);
    assert(article.textAvailability === "official-complete-senate-approved-bill-text", `${article.id} has an incorrect text-availability boundary`);
    assert(article.legalEffectStatus === "pending-bill-not-enacted", `${article.id} must remain pending proposal text`);
    assert(article.effectiveFrom === null, `${article.id} must not claim an effective date`);
    assert(article.legislativeStatus?.notLaw === true, `${article.id} must be marked not law`);
    assert(article.legislativeStatus?.notInForce === true, `${article.id} must be marked not in force`);
    assertImportedEnglishTranslation(article, article.id);
    assert(
      article.translationStatus ===
          "complete-current-pending-bill-project-reference" &&
        article.currentLanguageToggleEligible === true &&
        article.translations.en.coverageStatus ===
          "complete-current-pending-bill-project-reference" &&
        article.translations.en.currentTextEquivalent === true &&
        article.translations.en.legalEffectStatus ===
          "pending-bill-not-enacted",
      `${article.id} must expose complete project English without implying that the pending bill is law`,
    );
    assertStringArray(article.paragraphs, `${article.id}.paragraphs`, { allowDuplicates: true });
    assert(article.fullText === article.paragraphs.join("\n\n"), `${article.id}.fullText is not normalized`);
    assert(
      article.contentSha256 === createHash("sha256").update(article.fullText, "utf8").digest("hex"),
      `${article.id}.contentSha256 is incorrect`,
    );
    assertHttpsUrl(article.source, `${article.id}.source`);
    assertObject(article.rights, `${article.id}.rights`);
    assert(article.rights.reuseStatus === "government-edict", `${article.id}.rights must preserve the official-act boundary`);
    assertHttpsUrl(article.rights.licenseUrl, `${article.id}.rights.licenseUrl`);
  });
  assertCompleteCoverageMetadata("br-pl-2338-2023-ai-bill", {
    count: 79,
    language: "pt-BR",
    completeness: "complete-official-pending-Portuguese-bill-article-corpus",
  });
  const instrument = instruments.find((item) => item.id === "br-pl-2338-2023-ai-bill");
  assert(instrument.lifecycleStatus === "pending-bill", "Brazil PL 2338 must remain pending");
  assert(instrument.dates.effectiveFrom === null, "Brazil PL 2338 must have no effective date");
  assert(instrument.coverage.numberingGap?.[0] === "31", "Brazil PL 2338 coverage must disclose the missing Article 31");
}

function validateUsStateAiLawCorpora() {
  assert(
    californiaSb1047Provisions.length === 18,
    `California SB 1047 corpus must contain 18 nodes; found ${californiaSb1047Provisions.length}`,
  );
  for (const provision of californiaSb1047Provisions) {
    assert(provision.instrumentId === "us-ca-sb-1047-2024", `${provision.id} references the wrong instrument`);
    assert(provision.language === "en-US", `${provision.id}.language must be en-US`);
    assert(provision.lifecycleStatus === "failed-vetoed", `${provision.id} must remain vetoed`);
    assert(provision.legalEffectStatus === "not-enacted-vetoed-historical-bill", `${provision.id} must remain historical proposal text`);
    assert(provision.commencementStatus === "never-commenced", `${provision.id} must never claim commencement`);
    assert(provision.historicalOnly === true, `${provision.id} must be historical only`);
    assert(provision.appliesFrom === null, `${provision.id} must not claim an applicability date`);
    assertStringArray(provision.paragraphs, `${provision.id}.paragraphs`, { allowDuplicates: true });
    assert(provision.fullText === provision.paragraphs.join("\n\n"), `${provision.id}.fullText is not normalized`);
    assert(
      provision.contentSha256 === createHash("sha256").update(provision.fullText, "utf8").digest("hex"),
      `${provision.id}.contentSha256 is incorrect`,
    );
    assertHttpsUrl(provision.source, `${provision.id}.source`);
    assertObject(provision.rights, `${provision.id}.rights`);
    assert(
      provision.rights.reuseStatus === "public-domain-california-legislative-information",
      `${provision.id}.rights must preserve the California public-domain record`,
    );
    assertHttpsUrl(provision.rights.basisUrl, `${provision.id}.rights.basisUrl`);
    assertReferenceArray(provision.conceptIds, conceptIds, `${provision.id}.conceptIds`, { allowEmpty: true });
  }
  assertCompleteCoverageMetadata("us-ca-sb-1047-2024", {
    count: 18,
    language: "en-US",
    completeness: "complete-official-vetoed-enrolled-bill-corpus",
  });

  assert(
    coloradoAiActProvisions.length === 18,
    `Colorado current AI Act corpus must contain 18 nodes; found ${coloradoAiActProvisions.length}`,
  );
  const allowedDates = new Set(["2026-05-14", "2027-01-01"]);
  for (const provision of coloradoAiActProvisions) {
    assert(provision.instrumentId === "us-co-sb26-189-admt-2026", `${provision.id} references the wrong instrument`);
    assert(provision.language === "en-US", `${provision.id}.language must be en-US`);
    assert(provision.lifecycleStatus === "enacted", `${provision.id} must identify the enacted reenactment`);
    assert(allowedDates.has(provision.appliesFrom), `${provision.id}.appliesFrom must preserve an enacted phase date`);
    assertStringArray(provision.paragraphs, `${provision.id}.paragraphs`, { allowDuplicates: true });
    assert(provision.fullText === provision.paragraphs.join("\n\n"), `${provision.id}.fullText is not normalized`);
    assert(
      provision.contentSha256 === createHash("sha256").update(provision.fullText, "utf8").digest("hex"),
      `${provision.id}.contentSha256 is incorrect`,
    );
    assertHttpsUrl(provision.source, `${provision.id}.source`);
    assertObject(provision.rights, `${provision.id}.rights`);
    assert(
      provision.rights.reuseStatus === "official-public-legislative-record-license-not-asserted",
      `${provision.id}.rights must preserve the Colorado official-record boundary`,
    );
    assertReferenceArray(provision.conceptIds, conceptIds, `${provision.id}.conceptIds`, { allowEmpty: true });
  }
  const coloradoById = new Map(coloradoAiActProvisions.map((item) => [item.id, item]));
  assert(
    coloradoById.get("us-co-ai-act-current-6-1-1701")?.appliesFrom === "2027-01-01",
    "Colorado definitions must retain the 1 January 2027 applicability date",
  );
  assert(
    coloradoById.get("us-co-ai-act-2026-sec-6")?.appliesFrom === "2026-05-14",
    "Colorado safety clause must retain its immediate effective date",
  );
  assert(
    coloradoById.get("us-co-ai-act-current-6-1-1704")?.immediateEffectSubdivisions?.includes("6-1-1704(4)"),
    "Colorado mixed-phase section 6-1-1704 must disclose its immediate subdivision",
  );
  assertCompleteCoverageMetadata("us-co-sb26-189-admt-2026", {
    count: 18,
    language: "en-US",
    completeness: "complete-current-official-session-law-corpus-with-unit-level-effective-dates",
  });
}

function validateNistAiRmfCorpus() {
  assert(
    nistAiRmfCorpus.length === 135,
    `NIST AI RMF 1.0 corpus must contain 135 nodes; found ${nistAiRmfCorpus.length}`,
  );
  const typeCounts = new Map();
  for (const node of nistAiRmfCorpus) {
    typeCounts.set(node.unitType, (typeCounts.get(node.unitType) ?? 0) + 1);
    assert(node.instrumentId === "us-nist-ai-rmf-1-0", `${node.id} references the wrong instrument`);
    assert(node.language === "en", `${node.id}.language must be en`);
    assert(node.version === "1.0", `${node.id}.version must remain 1.0`);
    assert(node.legalEffectStatus === "voluntary-non-binding-risk-management-framework", `${node.id} must remain voluntary`);
    assertStringArray(node.paragraphs, `${node.id}.paragraphs`, { allowDuplicates: true });
    assert(node.fullText === node.paragraphs.join("\n\n"), `${node.id}.fullText is not normalized`);
    assert(
      node.contentSha256 === createHash("sha256").update(node.fullText, "utf8").digest("hex"),
      `${node.id}.contentSha256 is incorrect`,
    );
    assertHttpsUrl(node.source, `${node.id}.source`);
    assert(node.rightsProfile === "nist-technical-series-17-usc-105", `${node.id}.rightsProfile is incorrect`);
    assertReferenceArray(node.coreConceptIds, conceptIds, `${node.id}.coreConceptIds`);
    assert(node.thematicRelevance?.isRelevant === true, `${node.id} must remain topic-relevant`);
    assertObject(node.hierarchy, `${node.id}.hierarchy`);
    if (node.parentId !== null) {
      assert(nistAiRmfCorpusIds.has(node.parentId), `${node.id} references a missing parent`);
    }
  }
  assert(typeCounts.get("function") === 4, "NIST AI RMF must contain four functions");
  assert(typeCounts.get("core-category") === 19, "NIST AI RMF must contain 19 categories");
  assert(typeCounts.get("core-subcategory") === 72, "NIST AI RMF must contain 72 subcategories");
  const thirdPartyNodes = nistAiRmfCorpus.filter(
    (node) => node.projectLicenseBoundary === "third-party-excluded-from-project-license",
  );
  assert(thirdPartyNodes.length === 10, `NIST AI RMF must disclose exactly 10 third-party-material nodes; found ${thirdPartyNodes.length}`);
  for (const node of thirdPartyNodes) {
    assertObject(node.thirdPartyMaterial, `${node.id}.thirdPartyMaterial`);
    assert(
      node.thirdPartyMaterial.status === "excluded-from-project-license-and-any-public-domain-claim",
      `${node.id}.thirdPartyMaterial.status is incorrect`,
    );
    assertStringArray(node.thirdPartyMaterial.items, `${node.id}.thirdPartyMaterial.items`);
  }
  assertCompleteCoverageMetadata("us-nist-ai-rmf-1-0", {
    count: 135,
    language: "en",
    completeness: "complete-official-voluntary-framework-hierarchy-corpus",
  });
  const instrument = instruments.find((item) => item.id === "us-nist-ai-rmf-1-0");
  assert(instrument.legalForce === "voluntary", "NIST AI RMF must not be represented as binding law");
  assert(instrument.lifecycleStatus === "active-voluntary", "NIST AI RMF lifecycle status is incorrect");
}

function validateAidaPublicCorpusBoundary() {
  const publicAnchors = provisions.filter(
    (item) => item.instrumentId === "ca-bill-c-27-aida-2022-lapsed",
  );
  assert(
    publicAnchors.length === 4,
    `AIDA public aggregate must retain exactly four source-linked editorial anchors; found ${publicAnchors.length}`,
  );
  assert(
    publicAnchors.every(
      (item) =>
        (item.fullText === undefined || item.fullText === null) &&
        item.textAvailability?.stored === false,
    ),
    "AIDA public anchors must not redistribute the complete unenacted bill text",
  );
  assert(
    ![...knownProvisionParentIds].some((id) => /^ca-aida-c27-sec-\d+$/.test(id)),
    "The complete AIDA bill corpus must remain outside the public aggregate",
  );
  const instrument = instruments.find(
    (item) => item.id === "ca-bill-c-27-aida-2022-lapsed",
  );
  assert(instrument.textAvailability.stored === false, "AIDA instrument metadata must remain source-linked only");
  assert(instrument.lifecycleStatus === "lapsed", "AIDA must remain a lapsed, never-enacted proposal");
}

validatePipedaCorpus();
validateLgpdCorpus();
validateTaiwanAiActCorpus();
validateTaiwanPdpaCorpus();
validateSingaporePdpaCorpus();
validateAfricaIndonesiaCorpora();
validateIndiaGulfCorpora();
validateAustraliaPrivacyActCorpus();
validateJapanHongKongCorpora();
validateSwissVietnamKoreaAndUsCorpora();
validateBrazilAiBillCorpus();
validateUsStateAiLawCorpora();
validateNistAiRmfCorpus();
validateAidaPublicCorpusBoundary();

for (const articleId of gdprArticleIds) {
  assert(!euAiActArticleIds.has(articleId), `Official Article id collision: ${articleId}`);
}

const officialArticleIdSets = [
  gdprArticleIds,
  euAiActArticleIds,
  ukGdprArticleIds,
  piplArticleIds,
  networkDataArticleIds,
  generativeAiArticleIds,
  pipedaProvisionIds,
  lgpdArticleIds,
  taiwanAiActArticleIds,
  taiwanPdpaArticleIds,
  singaporePdpaProvisionIds,
  southAfricaPopiaSectionIds,
  nigeriaNdpaSectionIds,
  indonesiaPdpArticleIds,
  indiaDpdpActProvisionIds,
  indiaDpdpRulesProvisionIds,
  uaePdplArticleIds,
  saudiPdplArticleIds,
  saudiPdplImplementingArticleIds,
  saudiPdplTransferArticleIds,
  australiaPrivacyActProvisionIds,
  japanAppiArticleIds,
  japanAiPromotionActArticleIds,
  hongKongPdpoProvisionIds,
  swissFadpProvisionIds,
  vietnamPdplArticleIds,
  vietnamDecree356ProvisionIds,
  vietnamDecree13HistoricalProvisionIds,
  koreaPipaArticleIds,
  koreaAiFrameworkArticleIds,
  usExecutiveOrderProvisionIds,
  taiwanExecutiveYuanGenAiGuidelineIds,
  brazilAiBillArticleIds,
  californiaSb1047ProvisionIds,
  coloradoAiActProvisionIds,
  nistAiRmfCorpusIds,
];
for (let leftIndex = 0; leftIndex < officialArticleIdSets.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < officialArticleIdSets.length; rightIndex += 1) {
    for (const articleId of officialArticleIdSets[leftIndex]) {
      assert(
        !officialArticleIdSets[rightIndex].has(articleId),
        `Official Article id collision: ${articleId}`,
      );
    }
  }
}

const combinedProvisionIds = new Set([
  ...provisionIds,
  ...gdprArticleIds,
  ...euAiActArticleIds,
  ...ukGdprArticleIds,
  ...piplArticleIds,
  ...networkDataArticleIds,
  ...generativeAiArticleIds,
  ...pipedaProvisionIds,
  ...lgpdArticleIds,
  ...taiwanAiActArticleIds,
  ...taiwanPdpaArticleIds,
  ...singaporePdpaProvisionIds,
  ...southAfricaPopiaSectionIds,
  ...nigeriaNdpaSectionIds,
  ...indonesiaPdpArticleIds,
  ...indiaDpdpActProvisionIds,
  ...indiaDpdpRulesProvisionIds,
  ...uaePdplArticleIds,
  ...saudiPdplArticleIds,
  ...saudiPdplImplementingArticleIds,
  ...saudiPdplTransferArticleIds,
  ...australiaPrivacyActProvisionIds,
  ...japanAppiArticleIds,
  ...japanAiPromotionActArticleIds,
  ...hongKongPdpoProvisionIds,
  ...swissFadpProvisionIds,
  ...vietnamPdplArticleIds,
  ...vietnamDecree356ProvisionIds,
  ...vietnamDecree13HistoricalProvisionIds,
  ...koreaPipaArticleIds,
  ...koreaAiFrameworkArticleIds,
  ...usExecutiveOrderProvisionIds,
  ...taiwanExecutiveYuanGenAiGuidelineIds,
  ...brazilAiBillArticleIds,
  ...californiaSb1047ProvisionIds,
  ...coloradoAiActProvisionIds,
  ...nistAiRmfCorpusIds,
]);
const allOfficialArticles = [
  ...gdprArticles,
  ...euAiActArticles,
  ...ukGdprArticles,
  ...piplArticles,
  ...networkDataArticles,
  ...generativeAiArticles,
  ...pipedaProvisions,
  ...lgpdArticles,
  ...taiwanAiActArticles,
  ...taiwanPdpaArticles,
  ...singaporePdpaProvisions,
  ...southAfricaPopiaSections,
  ...nigeriaNdpaSections,
  ...indonesiaPdpArticles,
  ...indiaDpdpActProvisions,
  ...indiaDpdpRulesProvisions,
  ...uaePdplArticles,
  ...saudiPdplArticles,
  ...saudiPdplImplementingArticles,
  ...saudiPdplTransferArticles,
  ...australiaPrivacyActProvisions,
  ...japanAppiArticles,
  ...japanAiPromotionActArticles,
  ...hongKongPdpoProvisions,
  ...swissFadpProvisions,
  ...vietnamPdplArticles,
  ...vietnamDecree356Provisions.map((item) => ({
    ...item,
    instrumentId: "vn-pdpl-implementing-decree-356-2025",
  })),
  ...vietnamDecree13HistoricalProvisions.map((item) => ({
    ...item,
    instrumentId: "vn-personal-data-protection-decree-13-2023",
  })),
  ...koreaPipaArticles,
  ...koreaAiFrameworkArticles,
  ...usExecutiveOrderProvisions,
  ...taiwanExecutiveYuanGenAiGuidelines,
  ...brazilAiBillArticles,
  ...californiaSb1047Provisions,
  ...coloradoAiActProvisions,
  ...nistAiRmfCorpus,
];
const reviewedProvisionIds = new Set();
for (const review of provisionConceptReviews) {
  assertObject(review, "provision concept review");
  assertId(review.provisionId, "provision concept review.provisionId");
  assert(
    combinedProvisionIds.has(review.provisionId),
    `Provision concept review references missing provision: ${review.provisionId}`,
  );
  assert(
    !reviewedProvisionIds.has(review.provisionId),
    `Duplicate provision concept review: ${review.provisionId}`,
  );
  reviewedProvisionIds.add(review.provisionId);
  assert(
    provisionRelevanceValues.has(review.relevance),
    `${review.provisionId}.relevance is not supported`,
  );
  assertReferenceArray(
    review.conceptIds,
    conceptIds,
    `${review.provisionId}.conceptIds`,
    { allowEmpty: review.relevance === "structural-context" },
  );
  if (review.relevance === "substantive-topic") {
    assert(
      review.conceptIds.length > 0,
      `${review.provisionId} is topic-relevant but has no core-concept link`,
    );
  }
  assertString(review.rationale, `${review.provisionId}.rationale`, 80);
  assert(
    review.reviewStatus === "editorial-reviewed",
    `${review.provisionId}.reviewStatus must be editorial-reviewed`,
  );
  assertIsoDate(review.reviewedOn, `${review.provisionId}.reviewedOn`);
}
assert(
  reviewedProvisionIds.size === combinedProvisionIds.size,
  `Provision concept reviews cover ${reviewedProvisionIds.size} of ${combinedProvisionIds.size} merged provisions`,
);
for (const provisionId of combinedProvisionIds) {
  assert(
    reviewedProvisionIds.has(provisionId),
    `Missing provision concept review: ${provisionId}`,
  );
}
const indexedProvisionConceptIds = new Map(
  provisionConceptReviews.map((review) => [
    review.provisionId,
    new Set(review.conceptIds),
  ]),
);
const provisionInstrumentById = new Map();
for (const provision of provisions) {
  provisionInstrumentById.set(provision.id, provision.instrumentId);
}
for (const article of allOfficialArticles) {
  const existingInstrumentId = provisionInstrumentById.get(article.id);
  assert(
    existingInstrumentId === undefined ||
      existingInstrumentId === article.instrumentId,
    `${article.id} is assigned to conflicting instruments`,
  );
  provisionInstrumentById.set(article.id, article.instrumentId);
}
for (const provision of provisions) {
  if (allOfficialArticles.some((article) => article.id === provision.id)) {
    const article = allOfficialArticles.find(
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
      combinedProvisionIds.has(summary.structureId),
      `${summary.id} hierarchy-root must reference a merged provision`,
    );
    assert(
      provisionInstrumentById.get(summary.structureId) === summary.instrumentId,
      `${summary.id} hierarchy-root belongs to a different instrument`,
    );
    assert(
      citedProvisionIds.has(summary.structureId),
      `${summary.id}.sourceBasis must cite its merged hierarchy root`,
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
  if (audit.localIndexLanguage !== undefined) {
    assertObject(audit.localIndexLanguage, `${audit.id}.localIndexLanguage`);
    assert(
      languagePattern.test(audit.localIndexLanguage.language),
      `${audit.id}.localIndexLanguage.language must be a BCP 47-style language tag`,
    );
    assertString(
      audit.localIndexLanguage.note,
      `${audit.id}.localIndexLanguage.note`,
      40,
    );
  }
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
  if (audit.englishAvailability.coverage !== undefined) {
    const translationCoverage = audit.englishAvailability.coverage;
    assertObject(
      translationCoverage,
      `${audit.id}.englishAvailability.coverage`,
    );
    assert(
      Number.isInteger(translationCoverage.translatedUnitCount) &&
        translationCoverage.translatedUnitCount >= 0,
      `${audit.id}.englishAvailability.coverage.translatedUnitCount must be a non-negative integer`,
    );
    assert(
      Number.isInteger(translationCoverage.totalUnitCount) &&
        translationCoverage.totalUnitCount >=
          translationCoverage.translatedUnitCount,
      `${audit.id}.englishAvailability.coverage.totalUnitCount must cover every translated unit`,
    );
    assertString(
      translationCoverage.completeness,
      `${audit.id}.englishAvailability.coverage.completeness`,
    );
    if (translationCoverage.currentAlignedUnitCount !== undefined) {
      assert(
        Number.isInteger(translationCoverage.currentAlignedUnitCount) &&
          translationCoverage.currentAlignedUnitCount >= 0 &&
          translationCoverage.currentAlignedUnitCount <=
            translationCoverage.translatedUnitCount,
        `${audit.id}.englishAvailability.coverage.currentAlignedUnitCount is invalid`,
      );
      assert(
        Number.isInteger(translationCoverage.temporallyMismatchedUnitCount) &&
          translationCoverage.temporallyMismatchedUnitCount >= 0 &&
          translationCoverage.currentAlignedUnitCount +
            translationCoverage.temporallyMismatchedUnitCount ===
            translationCoverage.translatedUnitCount,
        `${audit.id}.englishAvailability.coverage temporal counts must reconcile`,
      );
    }
  }
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
  if (audit.rightsBoundary !== undefined) {
    assertObject(audit.rightsBoundary, `${audit.id}.rightsBoundary`);
    assertString(
      audit.rightsBoundary.sourceTextStatus,
      `${audit.id}.rightsBoundary.sourceTextStatus`,
    );
    assertString(
      audit.rightsBoundary.projectLicenseBoundary,
      `${audit.id}.rightsBoundary.projectLicenseBoundary`,
    );
    assertString(
      audit.rightsBoundary.note,
      `${audit.id}.rightsBoundary.note`,
      80,
    );
  }
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
for (const instrumentId of [
  "br-pl-2338-2023-ai-bill",
  "us-ca-sb-1047-2024",
  "us-co-sb26-189-admt-2026",
  "us-nist-ai-rmf-1-0",
  "ca-bill-c-27-aida-2022-lapsed",
]) {
  const audit = sourceAudits.find((item) => item.instrumentId === instrumentId);
  assertObject(audit?.rightsBoundary, `${instrumentId} source-audit rightsBoundary`);
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
  "jp-ai-promotion-act-2025",
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
  "sa-pdpl-implementing-regulation-2023",
  "sa-pdpl-transfer-regulation-2023",
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
  ["jp-appi", ["in-force-with-promulgated-future-amendment", null]],
  ["jp-ai-promotion-act-2025", ["in-force", null]],
  ["hk-personal-data-privacy-ordinance", ["in-force-amended", null]],
  ["au-privacy-act-1988", ["in-force-with-scheduled-amendment", null]],
  ["us-eo-14110", ["revoked", "2025-01-20"]],
  ["us-ca-sb-1047-2024", ["vetoed", "2024-09-29"]],
  ["kr-ai-framework-act-2025", ["in-force-with-scheduled-amendment", null]],
  ["tw-ai-basic-act-2026", ["in-force", null]],
  ["vn-personal-data-protection-decree-13-2023", ["repealed", "2026-01-01"]],
  ["ca-bill-c-27-aida-2022-lapsed", ["lapsed", "2025-01-06"]],
  ["us-co-sb24-205-2024", ["superseded-before-substantive-effect", "2026-05-14"]],
  ["us-co-sb26-189-admt-2026", ["partially-in-force-with-principal-duties-scheduled", null]],
  ["br-pl-2338-2023-ai-bill", ["pending-bill", null]],
  ["us-nist-ai-rmf-1-0", ["active-voluntary", null]],
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
    `(${gdprArticles.length} EU GDPR + ${euAiActArticles.length} EU AI Act +`,
    `${ukGdprArticles.length} UK GDPR + ${piplArticles.length + networkDataArticles.length + generativeAiArticles.length} Chinese official Article imports),`,
    `${pipedaProvisions.length} PIPEDA + ${lgpdArticles.length} LGPD +`,
    `${taiwanAiActArticles.length + taiwanPdpaArticles.length} Taiwan bilingual provision imports +`,
    `${singaporePdpaProvisions.length} Singapore PDPA section/Schedule imports,`,
    `${southAfricaPopiaSections.length + nigeriaNdpaSections.length + indonesiaPdpArticles.length} Africa/Indonesia complete provision imports,`,
    `${indiaDpdpActProvisions.length + indiaDpdpRulesProvisions.length + uaePdplArticles.length + saudiPdplArticles.length + saudiPdplImplementingArticles.length + saudiPdplTransferArticles.length} India/Gulf complete provision imports,`,
    `${australiaPrivacyActProvisions.length} Australia Privacy Act current provision imports,`,
    `${japanAppiArticles.length + japanAiPromotionActArticles.length} Japan complete provision imports +`,
    `${hongKongPdpoProvisions.length} Hong Kong co-authentic bilingual provision imports,`,
    `${brazilAiBillArticles.length} Brazil pending AI Bill Article imports +`,
    `${californiaSb1047Provisions.length} California vetoed SB 1047 historical nodes +`,
    `${coloradoAiActProvisions.length} Colorado current reenacted AI law nodes +`,
    `${nistAiRmfCorpus.length} NIST AI RMF 1.0 voluntary framework nodes,`,
    `${relations.length} relations, and ${statusEvents.length} lifecycle events.`,
    `${sourceAudits.length} source-audit records cover every instrument.`,
    `${concepts.length} core concepts are organized into ${conceptThemes.length} themes.`,
    `${structureSummaries.length} reviewed structure summaries cover ${officialSections.size} official EU sections.`,
  ].join(" "),
);
