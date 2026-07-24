import assert from "node:assert/strict";
import test from "node:test";

import {
  createSearchIndex,
  normalizeSearchText,
  searchIndex,
} from "../app/search-engine.ts";

const concepts = [
  {
    id: "data-minimization",
    label: "Data Minimization / Minimum Necessary Collection",
    aliases: [
      "minimum collection",
      "collection limitation",
      "minimum necessary",
      "data minimisation",
    ],
    description: "Collect and retain no more personal data than is necessary.",
  },
  {
    id: "automated-decision-safeguards",
    label: "Automated Decision Safeguards",
    aliases: ["ADM", "profiling safeguards", "contestability"],
    description: "Safeguards for decisions made solely by automated processing.",
  },
  {
    id: "cross-border-transfer",
    label: "Cross-border Data Governance",
    aliases: [
      "international transfer",
      "overseas provision",
      "data export",
      "transborder data flow",
    ],
    description: "Rules governing transfers of personal data between countries.",
  },
  {
    id: "fairness-nondiscrimination",
    label: "Fairness and Non-discrimination",
    aliases: ["algorithmic fairness", "bias mitigation", "non-discrimination"],
    description: "Detect and mitigate discriminatory algorithmic outcomes.",
  },
  {
    id: "continuous-assurance",
    label: "Continuous Monitoring, Audit and Metrics",
    aliases: ["audit", "post-deployment monitoring"],
    description: "Monitor and audit controls throughout operation.",
  },
];

const documents = [
  {
    id: "eu-gdpr",
    type: "instrument",
    label: "GDPR",
    shortTitle: "GDPR",
    title: "General Data Protection Regulation",
    jurisdiction: "European Union",
    conceptIds: [
      "data-minimization",
      "automated-decision-safeguards",
      "cross-border-transfer",
    ],
  },
  {
    id: "jp-appi",
    type: "instrument",
    label: "APPI",
    shortTitle: "APPI",
    title: "Act on the Protection of Personal Information",
    originalTitle: "個人情報の保護に関する法律",
    jurisdiction: "Japan",
  },
  {
    id: "br-lgpd",
    type: "instrument",
    label: "LGPD",
    shortTitle: "LGPD",
    title: "Lei Geral de Proteção de Dados Pessoais",
    jurisdiction: "Brazil",
  },
  {
    id: "eu-gdpr-art-22",
    type: "provision",
    label: "GDPR Article 22",
    title: "Automated individual decision-making, including profiling",
    locator: "Article 22",
    instrumentId: "eu-gdpr",
    instrumentShortTitle: "GDPR",
    conceptIds: ["automated-decision-safeguards"],
    fullText:
      "The data subject shall have the right not to be subject to a decision based solely on automated processing.",
  },
  {
    id: "eu-gdpr-art-5",
    type: "provision",
    label: "GDPR Article 5",
    title: "Principles relating to processing of personal data",
    locator: "Article 5",
    instrumentId: "eu-gdpr",
    instrumentShortTitle: "GDPR",
    conceptIds: ["data-minimization"],
    fullText:
      "Personal data shall be adequate, relevant and limited to what is necessary in relation to the purposes.",
  },
  {
    id: "cn-pipl-art-38",
    type: "provision",
    label: "PIPL Article 38",
    title: "Conditions for providing personal information outside China",
    originalTitle: "个人信息跨境提供的条件",
    locator: "Article 38",
    instrumentId: "cn-pipl",
    instrumentShortTitle: "PIPL",
    conceptIds: ["cross-border-transfer"],
    fullText: "个人信息处理者因业务等需要，确需向中华人民共和国境外提供个人信息的。",
  },
  {
    id: "concept-data-minimization",
    type: "concept",
    label: "Data Minimization / Minimum Necessary Collection",
    aliases: concepts[0].aliases,
    description: concepts[0].description,
    conceptIds: ["data-minimization"],
  },
  {
    id: "automated-decision-safeguards",
    type: "concept",
    label: "Automated Decision Safeguards",
    aliases: concepts[1].aliases,
    description: concepts[1].description,
  },
  {
    id: "cross-border-transfer",
    type: "concept",
    label: "Cross-border Data Governance",
    aliases: concepts[2].aliases,
    description: concepts[2].description,
  },
  {
    id: "fairness-nondiscrimination",
    type: "concept",
    label: "Fairness and Non-discrimination",
    aliases: concepts[3].aliases,
    description: concepts[3].description,
  },
  {
    id: "continuous-assurance",
    type: "concept",
    label: "Continuous Monitoring, Audit and Metrics",
    aliases: concepts[4].aliases,
    description: concepts[4].description,
  },
];

const index = createSearchIndex(documents, concepts);

test("normalization applies NFKC and folds Latin diacritics", () => {
  assert.equal(normalizeSearchText("ＧＤＰＲ"), "gdpr");
  assert.equal(normalizeSearchText("Proteção"), "protecao");
});

test("exact short-title search ranks the instrument first", () => {
  const results = searchIndex(index, "GDPR");
  assert.equal(results[0].document.id, "eu-gdpr");
  assert.equal(results[0].matchKind, "exact");
});

test("structured instrument plus article locators are canonicalized", () => {
  const results = searchIndex(index, "GDPR Art. 22");
  assert.equal(results[0].document.id, "eu-gdpr-art-22");
  assert.equal(results[0].matchKind, "exact");
  assert.match(results[0].reason, /locator/i);
});

test("bounded fuzzy matching finds a misspelled minimum alias", () => {
  const results = searchIndex(index, "minumum");
  assert.equal(results[0].document.id, "concept-data-minimization");
  assert.equal(results[0].matchKind, "fuzzy");
  assert.match(results[0].reason, /minumum.*minimum/i);

  const phraseResults = searchIndex(index, "minumum collection");
  assert.equal(phraseResults[0].document.id, "concept-data-minimization");
  assert.match(phraseResults[0].reason, /minumum.*minimum/i);
});

test("Damerau matching corrects AAPI to APPI", () => {
  const results = searchIndex(index, "AAPI");
  assert.equal(results[0].document.id, "jp-appi");
  assert.equal(results[0].matchKind, "fuzzy");
  assert.match(results[0].reason, /aapi.*appi/i);
});

test("concept aliases remain exact for short abbreviations", () => {
  const results = searchIndex(index, "ADM");
  assert.equal(results[0].document.id, "automated-decision-safeguards");
  assert.equal(results[0].matchKind, "exact");
});

test("natural-language English activates explainable ontology semantics", () => {
  const results = searchIndex(index, "send data abroad");
  assert.ok(results.length > 0);
  assert.equal(results[0].matchKind, "semantic");
  assert.equal(results[0].matchedConceptId, "cross-border-transfer");
  assert.match(results[0].reason, /Cross-border Data Governance/);
  assert.ok(results.some((result) => result.document.id === "cn-pipl-art-38"));
});

test("Chinese intent activates the same cross-border concept", () => {
  const results = searchIndex(index, "数据出境");
  assert.ok(results.length > 0);
  assert.equal(results[0].matchKind, "semantic");
  assert.equal(results[0].matchedConceptId, "cross-border-transfer");
});

test("a natural-language query can activate more than one auditable concept intent", () => {
  const results = searchIndex(index, "algorithm bias audit");
  const matchedConceptIds = new Set(
    results.map((result) => result.matchedConceptId).filter(Boolean),
  );
  assert.ok(matchedConceptIds.has("fairness-nondiscrimination"));
  assert.ok(matchedConceptIds.has("continuous-assurance"));
});

test("accented and unaccented Portuguese produce the same exact result", () => {
  const accented = searchIndex(index, "proteção");
  const unaccented = searchIndex(index, "protecao");
  assert.equal(accented[0].document.id, "br-lgpd");
  assert.equal(unaccented[0].document.id, "br-lgpd");
  assert.equal(accented[0].matchKind, "exact");
  assert.deepEqual(
    accented.map((result) => result.document.id),
    unaccented.map((result) => result.document.id),
  );
});

test("matches found only in statutory wording are labelled full-text", () => {
  const results = searchIndex(index, "adequate relevant and limited");
  assert.equal(results[0].document.id, "eu-gdpr-art-5");
  assert.equal(results[0].matchKind, "full-text");

  const fullTextFields = index.indexedDocuments.flatMap((document) =>
    document.fields.filter((field) => field.fullText),
  );
  assert.ok(fullTextFields.length > 0);
  assert.ok(
    fullTextFields.every(
      (field) => field.words.length === 0 && field.tokens.length === 0,
    ),
    "full legal text must not inflate the fuzzy trigram postings layer",
  );
});

test("results are deterministic, deduplicated, limited and type-quota aware", () => {
  const duplicateIndex = createSearchIndex(
    [...documents, { ...documents[0], label: "Duplicate GDPR" }],
    concepts,
  );
  const options = {
    limit: 3,
    typeQuotas: { instrument: 1, provision: 1, concept: 1 },
  };
  const first = searchIndex(duplicateIndex, "automated decision", options);
  const second = searchIndex(duplicateIndex, "automated decision", options);
  assert.deepEqual(first, second);
  assert.ok(first.length <= 3);
  assert.equal(
    first.filter((result) => result.document.id === "eu-gdpr").length,
    1,
  );
  for (const type of ["instrument", "provision", "concept"]) {
    assert.ok(
      first.filter((result) => result.document.type === type).length <= 1,
    );
  }
});
