import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  cosineDistance,
  deriveConceptFingerprints,
  deriveInstrumentArchetypes,
  deriveMappingEvidenceAudit,
} from "../app/research-lab-data.ts";

const appRoot = new URL("../app/", import.meta.url);
const dataRoot = new URL("../data/v2/", import.meta.url);

const [
  labSource,
  labDataSource,
  labStyles,
  relations,
  instruments,
  jurisdictions,
  sourceAudits,
  concepts,
  conceptReviews,
] = await Promise.all([
  readFile(new URL("research-lab.tsx", appRoot), "utf8"),
  readFile(new URL("research-lab-data.ts", appRoot), "utf8"),
  readFile(new URL("research-lab.module.css", appRoot), "utf8"),
  readFile(new URL("relations.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("instruments.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("jurisdictions.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("source-audit.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("concepts.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("provision-concepts.json", dataRoot), "utf8").then(
    JSON.parse,
  ),
]);

const corpusFileNames = (await readdir(dataRoot))
  .filter((name) =>
    /(?:articles|provisions|sections|points|corpus)\.json$/.test(name),
  )
  .sort();
const corpusArrays = await Promise.all(
  corpusFileNames.map((name) =>
    readFile(new URL(name, dataRoot), "utf8").then(JSON.parse),
  ),
);
const conceptReviewById = new Map(
  conceptReviews.map((review) => [review.provisionId, review]),
);
const provisionMap = new Map();
for (const corpus of corpusArrays) {
  if (!Array.isArray(corpus)) continue;
  for (const record of corpus) {
    if (!record?.id || !record?.instrumentId) continue;
    provisionMap.set(record.id, record);
  }
}
const productionProvisions = [...provisionMap.values()].map((provision) => {
  const review = conceptReviewById.get(provision.id);
  const instrumentId =
    provision.instrumentId === "vn-decree-356-2025"
      ? "vn-pdpl-implementing-decree-356-2025"
      : provision.instrumentId === "vn-decree-13-2023"
        ? "vn-personal-data-protection-decree-13-2023"
        : provision.instrumentId;
  return {
    ...provision,
    instrumentId,
    locator: provision.locator ?? provision.label ?? provision.id,
    title: provision.title ?? provision.label ?? provision.id,
    conceptIds: Array.from(
      new Set([...(provision.conceptIds ?? []), ...(review?.conceptIds ?? [])]),
    ),
    topicRelevance: review
      ? {
          relevance: review.relevance,
          conceptIds: review.conceptIds,
        }
      : undefined,
  };
});

const phaseThreeViews = [
  ["archetypes", "Instrument Archetypes"],
  ["audit", "Mapping Evidence Audit"],
];

function fixtureInstrument(id, legalForce = "binding") {
  return {
    id,
    shortTitle: id.toUpperCase(),
    title: `Fixture ${id}`,
    jurisdictionId: id,
    category: "fixture",
    legalForce,
    lifecycleStatus: "applicable",
    statusAsOf: "2026-07-20",
  };
}

function fixtureFingerprint(instrumentId, values) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0));
  return {
    instrumentId,
    coverageMode: "complete-fixture-corpus",
    coverageClass: "complete",
    includedInDefaultAnalysis: true,
    denominatorProvisionCount: 10,
    conceptAssignmentCount: 10,
    mappedConceptCount: values.filter(Boolean).length,
    weights: values.map((value, index) => ({
      conceptId: `c${index + 1}`,
      rawCount: value ? 1 : 0,
      documentFrequency: 1,
      idf: 1,
      prevalence: value,
      termFrequency: value,
      tfidf: value,
      normalizedTfidf: magnitude ? value / magnitude : 0,
    })),
  };
}

const fixtureConcepts = ["c1", "c2", "c3"].map((id) => ({
  id,
  label: id,
  family: "fixture",
  theme: "fixture",
  description: id,
  summary: id,
}));
const fixtureInstruments = ["a", "b", "c", "d"].map((id) =>
  fixtureInstrument(id),
);
const fixtureFingerprints = [
  fixtureFingerprint("a", [1, 0, 0]),
  fixtureFingerprint("b", [0.995, 0.1, 0]),
  fixtureFingerprint("c", [0, 1, 0]),
  fixtureFingerprint("d", [0, 0.98, 0.2]),
];

test("Phase 3 is a distinct accessible research phase with two bounded views", () => {
  assert.match(
    labSource,
    /type ResearchLabPhase\s*=\s*["']patterns["']\s*\|\s*["']relations["']\s*\|\s*["']models["']/,
  );
  assert.match(labSource, /Phase 03/);
  assert.match(labSource, /Models \+ evidence audit/);
  assert.match(labSource, /aria-pressed=\{activePhase === ["']models["']\}/);
  for (const [id, label] of phaseThreeViews) {
    assert.match(labSource, new RegExp(`id:\\s*["']${id}["']`));
    assert.match(labSource, new RegExp(label.replaceAll(" ", "\\s+")));
    assert.match(labSource, new RegExp(`activeView === ["']${id}["']`));
  }
  assert.match(labSource, /lastViewByPhase/);
});

test("cosine distance is symmetric, bounded and exact on simple vectors", () => {
  assert.equal(cosineDistance([1, 0], [1, 0]), 0);
  assert.equal(cosineDistance([1, 0], [0, 1]), 1);
  const leftRight = cosineDistance([0.8, 0.6], [0.5, 0.5]);
  const rightLeft = cosineDistance([0.5, 0.5], [0.8, 0.6]);
  assert.ok(leftRight >= 0 && leftRight <= 1);
  assert.ok(Math.abs(leftRight - rightLeft) < 1e-12);
  assert.equal(cosineDistance([0, 0], [1, 0]), 1);
});

test("average-linkage archetypes are deterministic and partition every fit instrument once", () => {
  const forward = deriveInstrumentArchetypes(
    fixtureFingerprints,
    fixtureInstruments,
    fixtureConcepts,
  );
  const reversed = deriveInstrumentArchetypes(
    [...fixtureFingerprints].reverse(),
    [...fixtureInstruments].reverse(),
    [...fixtureConcepts].reverse(),
  );
  assert.equal(forward.merges.length, fixtureInstruments.length - 1);
  assert.deepEqual(forward.merges, reversed.merges);
  assert.deepEqual(forward.leafOrder, reversed.leafOrder);
  assert.deepEqual(
    forward.merges[0].memberInstrumentIds,
    ["a", "b"],
    "the closest fixture pair must merge first",
  );

  for (const partition of forward.partitions) {
    assert.equal(partition.clusters.length, partition.clusterCount);
    const members = partition.clusters.flatMap(
      (cluster) => cluster.memberInstrumentIds,
    );
    assert.equal(new Set(members).size, fixtureInstruments.length);
    assert.deepEqual([...members].sort(), ["a", "b", "c", "d"]);
    for (const cluster of partition.clusters) {
      assert.match(cluster.id, /^A\d+$/);
      assert.ok(cluster.memberInstrumentIds.includes(cluster.medoidInstrumentId));
      assert.ok(cluster.meanWithinDistance >= 0);
      assert.ok(cluster.maximumWithinDistance <= 1);
      assert.equal(cluster.differentiatingConcepts.length, fixtureConcepts.length);
    }
  }
});

test("jurisdiction and legal-force metadata do not enter the archetype fit", () => {
  const baseline = deriveInstrumentArchetypes(
    fixtureFingerprints,
    fixtureInstruments,
    fixtureConcepts,
  );
  const changedMetadata = deriveInstrumentArchetypes(
    fixtureFingerprints,
    fixtureInstruments.map((instrument, index) => ({
      ...instrument,
      jurisdictionId: `changed-${index}`,
      legalForce: index % 2 ? "voluntary" : "proposal",
      lifecycleStatus: index % 2 ? "revoked" : "pending",
    })),
    fixtureConcepts,
  );
  assert.deepEqual(baseline.merges, changedMetadata.merges);
  assert.deepEqual(
    baseline.partitions.map((partition) =>
      partition.clusters.map((cluster) => cluster.memberInstrumentIds),
    ),
    changedMetadata.partitions.map((partition) =>
      partition.clusters.map((cluster) => cluster.memberInstrumentIds),
    ),
  );
  assert.match(labDataSource, /deterministic average-linkage hierarchical clustering/i);
  assert.match(labDataSource, /jurisdiction, legal force, lifecycle status and relation edges are excluded/i);
});

test("production archetype fit is exactly the complete substantive non-zero sample", () => {
  const fingerprints = deriveConceptFingerprints({
    instruments,
    provisions: productionProvisions,
    concepts,
    sourceAudits,
  });
  const model = deriveInstrumentArchetypes(
    fingerprints,
    instruments,
    concepts,
  );
  assert.equal(model.fitInstrumentIds.length, 38);
  assert.equal(model.excludedInstrumentIds.length, 20);
  assert.equal(model.featureConceptIds.length, 23);
  assert.equal(model.merges.length, 37);
  assert.deepEqual(
    model.partitions.map((partition) => partition.clusterCount),
    [2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(model.sensitivity.length, 38);
  for (const fingerprint of fingerprints.filter((item) =>
    model.fitInstrumentIds.includes(item.instrumentId),
  )) {
    const norm = Math.sqrt(
      fingerprint.weights.reduce(
        (sum, weight) => sum + weight.normalizedTfidf ** 2,
        0,
      ),
    );
    assert.ok(Number.isFinite(norm));
    assert.ok(Math.abs(norm - 1) < 0.00001);
  }
});

test("production mapping audit resolves its corpus and preserves separate evidence dimensions", () => {
  const audit = deriveMappingEvidenceAudit({
    relations,
    provisions: productionProvisions,
    instruments,
    jurisdictions,
    sourceAudits,
    concepts,
  });
  assert.equal(audit.relationCount, 74);
  assert.equal(audit.reviewedRelationCount, 28);
  assert.equal(audit.candidateRelationCount, 46);
  assert.equal(audit.analyticalRelationCount, 71);
  assert.equal(audit.lifecycleRelationCount, 3);
  assert.equal(audit.unresolvedEndpointCount, 0);
  assert.ok(audit.records.every((record) => record.sourceSupportCount >= 2));
  assert.ok(audit.records.every((record) => record.hasRationale));
  assert.ok(audit.records.every((record) => record.hasLimits));
  assert.deepEqual(
    audit.concepts
      .filter((concept) => concept.totalRelationCount === 0)
      .map((concept) => concept.conceptId)
      .sort(),
    [
      "fairness-nondiscrimination",
      "privacy-enhancing-tech",
      "retention-deletion-lifecycle",
      "sensitive-data-protection",
    ],
  );
});

test("mapping audit does not collapse review facets into a score", () => {
  assert.match(labSource, /Evidence barcode/);
  assert.match(labSource, /Each column is independent; no composite quality score is calculated/);
  assert.match(labSource, /No relation recorded in this corpus/);
  assert.match(labSource, /does not establish that no legal relationship exists/);
  assert.match(labSource, /relation\.rationale/);
  assert.match(labSource, /relation\.limits/);
  assert.match(labSource, /relation\.sourceSupport\.map/);
  assert.doesNotMatch(labDataSource, /auditScore|qualityScore|equivalenceProbability/);
});

test("undirected relations use a bidirectional cue and confidence is scoped", () => {
  assert.match(labSource, /const directed = relation\.directionality === ["']directed["']/);
  assert.match(labSource, /directed \? ArrowRight : ArrowLeftRight/);
  assert.match(labSource, /editorial[\s\S]{0,30}confidence in research utility/);
  assert.match(labSource, /directed \? ["']Source endpoint["'] : ["']Endpoint A["']/);
});

test("Phase 3 reflows locally and reserves horizontal scrolling for the audit table", () => {
  assert.match(labStyles, /\.phaseSwitch\s*\{[\s\S]*?repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(labStyles, /\.archetypeWorkspace\s*\{[\s\S]*?min-inline-size:\s*0/);
  assert.match(labStyles, /\.auditTableScroll\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(labStyles, /\.auditTable\s*\{[\s\S]*?min-inline-size:\s*1180px/);
  assert.match(
    labStyles,
    /@container \(max-width:\s*760px\)[\s\S]*?\.archetypeWorkspace\s*\{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(labStyles, /@container \(max-width:\s*480px\)[\s\S]*?\.phaseSwitch\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(labStyles, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(labStyles, /position:\s*fixed/);
});
