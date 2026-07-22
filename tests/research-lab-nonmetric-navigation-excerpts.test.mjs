import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildResearchLabData,
  buildResearchLabExportPayload,
} from "../app/research-lab-data.ts";

const dataRoot = new URL("../data/v2/", import.meta.url);
const appRoot = new URL("../app/", import.meta.url);

const navigationExcerptParents = new Map([
  ["ca-pipeda-schedule1-4-7", "ca-pipeda-sch-1"],
  ["au-privacy-act-1988-app-1-7-1-9", "au-privacy-act-1988-app-1"],
  [
    "hk-personal-data-privacy-ordinance-dpp-1",
    "hk-personal-data-privacy-ordinance-schedule-1",
  ],
  [
    "hk-personal-data-privacy-ordinance-dpp-2",
    "hk-personal-data-privacy-ordinance-schedule-1",
  ],
  [
    "hk-personal-data-privacy-ordinance-dpp-3",
    "hk-personal-data-privacy-ordinance-schedule-1",
  ],
  [
    "hk-personal-data-privacy-ordinance-dpp-4",
    "hk-personal-data-privacy-ordinance-schedule-1",
  ],
  [
    "hk-personal-data-privacy-ordinance-dpps-5-6",
    "hk-personal-data-privacy-ordinance-schedule-1",
  ],
]);

const [
  seedProvisions,
  pipedaCorpus,
  australiaCorpus,
  hongKongCorpus,
  buildClientSource,
  researchLabSource,
] = await Promise.all([
  readFile(new URL("provisions.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("canada-pipeda-provisions.json", dataRoot), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("au-privacy-act-1988-provisions.json", dataRoot), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("hk-pdpo-486-provisions.json", dataRoot), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("../scripts/build-client-corpus.mjs", import.meta.url), "utf8"),
  readFile(new URL("research-lab.tsx", appRoot), "utf8"),
]);

test("the seven parent-overlapping seed anchors are explicit non-metric navigation excerpts", () => {
  const byId = new Map(seedProvisions.map((provision) => [provision.id, provision]));
  const marked = seedProvisions.filter(
    (provision) =>
      provision.researchTreatment?.role ===
      "navigation-analytical-excerpt",
  );
  assert.deepEqual(
    marked.map((provision) => provision.id).sort(),
    [...navigationExcerptParents.keys()].sort(),
  );

  const canonicalById = new Map(
    [...pipedaCorpus, ...australiaCorpus, ...hongKongCorpus].map((provision) => [
      provision.id,
      provision,
    ]),
  );
  for (const [excerptId, canonicalProvisionId] of navigationExcerptParents) {
    const excerpt = byId.get(excerptId);
    const canonical = canonicalById.get(canonicalProvisionId);
    assert.ok(excerpt, excerptId);
    assert.ok(canonical, canonicalProvisionId);
    assert.equal(excerpt.parentId, canonicalProvisionId, excerptId);
    assert.deepEqual(
      excerpt.researchTreatment,
      {
        role: "navigation-analytical-excerpt",
        metricEligible: false,
        canonicalProvisionId,
        note: excerpt.researchTreatment.note,
      },
      excerptId,
    );
    assert.match(excerpt.researchTreatment.note, /excluded.*double counting/i);
    assert.ok(excerpt.conceptIds.length > 0, `${excerptId} keeps concept links`);
    assert.ok(
      typeof canonical.fullText === "string" && canonical.fullText.length > 100,
      `${canonicalProvisionId} is the stored complete parent unit`,
    );
  }

  assert.match(
    buildClientSource,
    /record\.researchTreatment[\s\S]{0,100}researchTreatment:\s*record\.researchTreatment/,
    "the lightweight index must retain the treatment before shard hydration",
  );
});

const concepts = ["c1", "c2", "c3"].map((id) => ({
  id,
  label: id.toUpperCase(),
  family: "fixture",
  theme: "fixture-theme",
  description: id,
  summary: id,
}));

const fixtureInput = {
  snapshotDate: "2026-07-20",
  jurisdictions: [
    {
      id: "fixture-jurisdiction",
      name: "Fixture Jurisdiction",
      shortName: "Fixture",
      type: "country",
    },
  ],
  instruments: [
    {
      id: "fixture-law",
      shortTitle: "Fixture Law",
      title: "Fixture Law",
      jurisdictionId: "fixture-jurisdiction",
      category: "law",
      legalForce: "binding",
      lifecycleStatus: "in-force",
      statusAsOf: "2026-07-20",
    },
  ],
  provisions: [
    {
      id: "fixture-parent",
      instrumentId: "fixture-law",
      locator: "Schedule 1",
      title: "Complete parent",
      provisionType: "schedule",
      sourceOrder: 0,
      fullText: "Complete parent source text.",
      conceptIds: ["c1", "c2"],
      topicRelevance: {
        relevance: "substantive-topic",
        conceptIds: ["c1", "c2"],
      },
    },
    {
      id: "fixture-other",
      instrumentId: "fixture-law",
      locator: "Section 2",
      title: "Independent provision",
      provisionType: "section",
      sourceOrder: 1,
      fullText: "Independent source text.",
      conceptIds: ["c1"],
      topicRelevance: {
        relevance: "substantive-topic",
        conceptIds: ["c1"],
      },
    },
    {
      id: "fixture-navigation-excerpt",
      instrumentId: "fixture-law",
      locator: "Schedule 1, clause 1.1",
      title: "Editorial child anchor",
      provisionType: "schedule-clause",
      parentId: "fixture-parent",
      sourceOrder: 2,
      conceptIds: ["c2", "c3"],
      topicRelevance: {
        relevance: "substantive-topic",
        conceptIds: ["c2", "c3"],
      },
      researchTreatment: {
        role: "navigation-analytical-excerpt",
        metricEligible: false,
        canonicalProvisionId: "fixture-parent",
        note: "Fixture non-metric anchor.",
      },
    },
  ],
  concepts,
  themes: [
    {
      id: "fixture-theme",
      label: "Fixture theme",
      summary: "Fixture theme",
      order: 1,
    },
  ],
  sourceAudits: [
    {
      instrumentId: "fixture-law",
      reviewedOn: "2026-07-20",
      reviewLevel: "fixture",
      localCoverage: {
        mode: "complete-fixture-corpus",
        localUnitCount: 2,
        statement: "Two canonical source units.",
      },
    },
  ],
  relations: [],
  statusEvents: [],
};

test("all provision-level research statistics exclude navigation excerpts without deleting them", () => {
  const data = buildResearchLabData(fixtureInput);
  assert.equal(data.coverage.summary.corpusRecordCount, 3);
  assert.equal(data.coverage.summary.navigationExcerptCount, 1);
  assert.equal(data.coverage.summary.provisionCount, 2);
  assert.equal(data.coverage.summary.substantiveProvisionCount, 2);

  const excerpt = data.provisions.find(
    (provision) => provision.id === "fixture-navigation-excerpt",
  );
  assert.ok(excerpt);
  assert.equal(excerpt.analysisRole, "navigation-analytical-excerpt");
  assert.equal(excerpt.metricEligible, false);
  assert.equal(excerpt.canonicalProvisionId, "fixture-parent");
  assert.deepEqual(excerpt.conceptIds, ["c2", "c3"]);

  const fingerprint = data.fingerprints[0];
  const weightByConcept = new Map(
    fingerprint.weights.map((weight) => [weight.conceptId, weight]),
  );
  assert.equal(fingerprint.denominatorProvisionCount, 2);
  assert.equal(fingerprint.conceptAssignmentCount, 3);
  assert.equal(weightByConcept.get("c1").rawCount, 2);
  assert.equal(weightByConcept.get("c2").rawCount, 1);
  assert.equal(weightByConcept.get("c3").rawCount, 0);

  const pair = (left, right) =>
    data.cooccurrence.find(
      (record) =>
        record.leftConceptId === left && record.rightConceptId === right,
    );
  assert.equal(pair("c1", "c2").sampleProvisionCount, 2);
  assert.equal(pair("c1", "c2").cooccurrenceCount, 1);
  assert.equal(pair("c2", "c3").cooccurrenceCount, 0);

  const structural = data.structuralProfiles[0];
  assert.equal(structural.corpusRecordCount, 3);
  assert.equal(structural.excludedNavigationExcerptCount, 1);
  assert.equal(structural.totalProvisionCount, 2);
  assert.ok(structural.bands.every((band) => !band.topConceptIds.includes("c3")));

  const granularity = data.granularityAudit.instruments[0];
  assert.equal(granularity.corpusRecordCount, 3);
  assert.equal(granularity.excludedNavigationExcerptCount, 1);
  assert.equal(granularity.totalProvisionCount, 2);
  assert.equal(granularity.conceptAssignmentCount, 3);
  assert.equal(granularity.textCoverage.storedTextProvisionCount, 2);

  const instrument = data.instruments[0];
  assert.equal(instrument.corpusRecordCount, 3);
  assert.equal(instrument.navigationExcerptCount, 1);
  assert.equal(instrument.totalProvisionCount, 2);
  assert.equal(
    data.concepts.find((concept) => concept.id === "c3")
      .substantiveProvisionCount,
    0,
  );

  const microscope = data.articleMicroscope.instruments[0];
  assert.equal(microscope.totalProvisionCount, 3);
  assert.equal(microscope.metricEligibleProvisionCount, 2);
  assert.equal(microscope.navigationExcerptCount, 1);
  const microscopeExcerpt = microscope.bands.find(
    (band) => band.provisionId === "fixture-navigation-excerpt",
  );
  assert.ok(microscopeExcerpt);
  assert.equal(microscopeExcerpt.metricEligible, false);
  assert.equal(microscopeExcerpt.canonicalProvisionId, "fixture-parent");
  assert.deepEqual(microscopeExcerpt.conceptIds, ["c2", "c3"]);
  assert.equal(
    microscope.conceptTracks.some((track) => track.conceptId === "c3"),
    false,
  );
});

test("Research Lab exports exclude excerpts from estimands but retain microscope navigation", () => {
  const data = buildResearchLabData(fixtureInput);
  const base = {
    phase: "patterns",
    coverageScope: "complete",
    relevanceScope: "substantive",
  };

  const genome = buildResearchLabExportPayload(data, {
    ...base,
    view: "genome",
  });
  assert.deepEqual(genome.sample.visibleProvisionIds, [
    "fixture-parent",
    "fixture-other",
  ]);
  assert.deepEqual(genome.viewData.scope.provisionIds, [
    "fixture-other",
    "fixture-parent",
  ]);
  const genomeFingerprint = genome.viewData.data.fingerprints[0];
  assert.equal(genomeFingerprint.denominatorProvisionCount, 2);
  assert.equal(
    genomeFingerprint.weights.find((weight) => weight.conceptId === "c3")
      .rawCount,
    0,
  );

  const grammar = buildResearchLabExportPayload(data, {
    ...base,
    view: "grammar",
  });
  assert.deepEqual(
    grammar.viewData.data.analyticalSourceProvisions.map(
      (provision) => provision.id,
    ),
    ["fixture-parent", "fixture-other"],
  );

  const granularity = buildResearchLabExportPayload(data, {
    ...base,
    phase: "dynamics",
    view: "granularity",
  });
  assert.equal(granularity.viewData.data.instruments[0].totalProvisionCount, 2);
  assert.equal(
    granularity.viewData.data.instruments[0].excludedNavigationExcerptCount,
    1,
  );

  const microscope = buildResearchLabExportPayload(data, {
    ...base,
    phase: "dynamics",
    view: "microscope",
  });
  assert.ok(
    microscope.viewData.scope.provisionIds.includes(
      "fixture-navigation-excerpt",
    ),
  );
  assert.equal(
    microscope.viewData.data.instruments[0].bands.find(
      (band) => band.provisionId === "fixture-navigation-excerpt",
    ).metricEligible,
    false,
  );
});

test("the Article Microscope visibly explains the non-metric role and keeps parent drill-down", () => {
  assert.match(researchLabSource, /data-analysis-role=\{band\.analysisRole\}/);
  assert.match(researchLabSource, /navigation excerpt excluded from aggregate metrics/i);
  assert.match(researchLabSource, /Navigation \+ analytical excerpt/);
  assert.match(researchLabSource, /onOpenProvision\(selectedBand\.canonicalProvisionId!/);
  assert.match(
    researchLabSource,
    /function provisionMatchesScope[\s\S]{0,180}provision\.metricEligible/,
  );
});
