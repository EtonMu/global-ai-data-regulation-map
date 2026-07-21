import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  RESEARCH_SNAPSHOT_DATE,
  deriveApplicabilityHorizon,
  deriveArticleMicroscope,
  deriveProvisionGranularityAudit,
  deriveRegulatoryNeighborhoodStability,
  hellingerDistance,
} from "../app/research-lab-data.ts";

const labDataSource = await readFile(
  new URL("../app/research-lab-data.ts", import.meta.url),
  "utf8",
);

function instrument(id) {
  return {
    id,
    shortTitle: id.toUpperCase(),
    title: `Fixture ${id}`,
    jurisdictionId: id,
    category: "fixture",
    legalForce: "binding",
    lifecycleStatus: "recorded",
    statusAsOf: RESEARCH_SNAPSHOT_DATE,
  };
}

function audit(instrumentId, mode) {
  return {
    instrumentId,
    reviewedOn: RESEARCH_SNAPSHOT_DATE,
    reviewLevel: "fixture",
    localCoverage: {
      mode,
      localUnitCount: 1,
      statement: "Fixture coverage statement.",
    },
  };
}

function provision(
  id,
  instrumentId,
  sourceOrder,
  relevance,
  conceptIds,
  extra = {},
) {
  return {
    id,
    instrumentId,
    locator: `Art. ${sourceOrder + 1}`,
    title: id,
    sourceOrder,
    conceptIds,
    topicRelevance: { relevance, conceptIds },
    ...extra,
  };
}

const instruments = [instrument("a"), instrument("b")];
const sourceAudits = [
  audit("a", "complete-fixture-corpus"),
  audit("b", "selected-fixture-index"),
];
const provisions = [
  provision("a-1", "a", 0, "substantive-topic", ["c1", "c2"], {
    appliesFrom: "2026-07-20",
    actorTags: ["controller"],
    fullText: "  A   B😀  ",
    chapter: { id: "ch-1", label: "I", title: "One" },
  }),
  provision("a-2", "a", 1, "structural-context", ["c2"], {
    appliesFrom: "2026-08-01",
    scopeTags: ["system"],
    chapter: { id: "ch-1", label: "I", title: "One" },
  }),
  provision("a-3", "a", 2, "unreviewed", ["c3"], {
    appliesFrom: "after publication",
    fullText: "e\u0301",
    chapter: { id: "ch-2", label: "II", title: "Two" },
  }),
  provision("a-4", "a", 3, "substantive-topic", [], {
    appliesFrom: null,
    chapter: { id: "ch-2", label: "II", title: "Two" },
  }),
  provision("a-5", "a", 4, "substantive-topic", ["c1"], {
    appliesFrom: "2026-07-20",
    chapter: { id: "ch-2", label: "II", title: "Two" },
  }),
  provision("b-1", "b", 0, "substantive-topic", ["c1"], {
    appliesFrom: "2020-01-01",
    fullText: "Selected text",
  }),
];
const statusEvents = [
  {
    id: "e-past",
    instrumentId: "a",
    date: "2019-01-01",
    type: "publication",
    label: "Past",
    effect: "Recorded past event",
    resultingStatus: "published",
  },
  {
    id: "e-snapshot",
    instrumentId: "a",
    date: "2026-07-20",
    type: "snapshot",
    label: "Snapshot",
    effect: "Recorded on snapshot",
    resultingStatus: "recorded",
  },
  {
    id: "e-future",
    instrumentId: "a",
    date: "2027-01-01",
    type: "commencement",
    label: "Future",
    effect: "Recorded future event",
    resultingStatus: "future",
  },
  {
    id: "e-unresolved",
    instrumentId: "a",
    date: "when proclaimed",
    type: "commencement",
    label: "Unresolved",
    effect: "No calendar date recorded",
    resultingStatus: "pending",
  },
];

test("applicability horizon groups explicit provision dates and preserves uncertainty", () => {
  const horizon = deriveApplicabilityHorizon({
    snapshotDate: RESEARCH_SNAPSHOT_DATE,
    instruments,
    provisions,
    sourceAudits,
    statusEvents,
  });
  assert.equal(horizon.snapshotDate, "2026-07-20");
  assert.equal(horizon.resolvedProvisionDateCount, 4);
  assert.equal(horizon.missingProvisionDateCount, 1);
  assert.equal(horizon.unresolvedProvisionDateCount, 1);
  assert.equal(horizon.beforeSnapshotProvisionCount, 1);
  assert.equal(horizon.onSnapshotProvisionCount, 2);
  assert.equal(horizon.futureProvisionCount, 1);
  assert.equal(horizon.resolvedStatusEventCount, 3);
  assert.equal(horizon.unresolvedStatusEventCount, 1);
  assert.equal(horizon.earliestResolvedDate, "2019-01-01");
  assert.equal(horizon.latestResolvedDate, "2027-01-01");
  assert.deepEqual(horizon.missingProvisionIds, ["a-4"]);
  assert.deepEqual(horizon.unresolvedProvisionDates, [
    {
      provisionId: "a-3",
      instrumentId: "a",
      rawDate: "after publication",
      coverageClass: "complete",
    },
  ]);
  assert.equal(horizon.unresolvedStatusEvents[0].rawDate, "when proclaimed");
  assert.equal("date" in horizon.unresolvedStatusEvents[0], false);

  const snapshotGroup = horizon.provisionDateGroups.find(
    (group) => group.id === "a::2026-07-20",
  );
  assert.ok(snapshotGroup);
  assert.equal(snapshotGroup.provisionCount, 2);
  assert.equal(snapshotGroup.temporalStatus, "on-snapshot");
  assert.deepEqual(snapshotGroup.provisionIds, ["a-1", "a-5"]);
  assert.deepEqual(snapshotGroup.conceptCounts, [
    { conceptId: "c1", provisionCount: 2 },
    { conceptId: "c2", provisionCount: 1 },
  ]);
});

test("Hellinger distance is normalized, symmetric and bounded", () => {
  assert.equal(hellingerDistance([1, 0], [1, 0]), 0);
  assert.equal(hellingerDistance([1, 0], [0, 1]), 1);
  assert.equal(hellingerDistance([2, 0], [1, 0]), 0);
  const forward = hellingerDistance([3, 1], [1, 3]);
  const reverse = hellingerDistance([1, 3], [3, 1]);
  assert.ok(forward > 0 && forward < 1);
  assert.ok(Math.abs(forward - reverse) < 1e-12);
  assert.equal(hellingerDistance([0, 0], [1, 0]), 1);
});

function fingerprint(instrumentId, tfidf, prevalence) {
  return {
    instrumentId,
    coverageMode: "complete-fixture-corpus",
    coverageClass: "complete",
    includedInDefaultAnalysis: true,
    denominatorProvisionCount: 10,
    conceptAssignmentCount: 10,
    mappedConceptCount: tfidf.filter(Boolean).length,
    weights: tfidf.map((value, index) => ({
      conceptId: `c${index + 1}`,
      rawCount: prevalence[index] * 10,
      documentFrequency: 3,
      idf: 1,
      prevalence: prevalence[index],
      termFrequency: value,
      tfidf: value,
      normalizedTfidf: value,
    })),
  };
}

const neighborhoodFingerprints = [
  fingerprint("a", [1, 0, 0], [0.8, 0.2, 0]),
  fingerprint("b", [0.98, 0.2, 0], [0.7, 0.3, 0]),
  fingerprint("c", [0, 1, 0.1], [0.1, 0.7, 0.2]),
  fingerprint("d", [0, 0.9, 0.4], [0.05, 0.65, 0.3]),
];
const neighborhoodConcepts = [
  { id: "c1", label: "C1", family: "f", theme: "t1", description: "", summary: "" },
  { id: "c2", label: "C2", family: "f", theme: "t2", description: "", summary: "" },
  { id: "c3", label: "C3", family: "f", theme: "t2", description: "", summary: "" },
];
const neighborhoodThemes = [
  { id: "t1", label: "T1", summary: "", order: 1 },
  { id: "t2", label: "T2", summary: "", order: 2 },
];

test("neighborhood stability is deterministic and exposes metric and theme sensitivity", () => {
  const forward = deriveRegulatoryNeighborhoodStability(
    neighborhoodFingerprints,
    neighborhoodConcepts,
    neighborhoodThemes,
  );
  const reversed = deriveRegulatoryNeighborhoodStability(
    [...neighborhoodFingerprints].reverse(),
    [...neighborhoodConcepts].reverse(),
    [...neighborhoodThemes].reverse(),
  );
  assert.deepEqual(forward, reversed);
  assert.deepEqual(forward.fitInstrumentIds, ["a", "b", "c", "d"]);
  assert.equal(forward.themeOmissionCount, 2);
  assert.equal(forward.records.length, 4);
  assert.equal(forward.records[0].candidates.length, 3);
  assert.equal(forward.records[0].cosineNearestNeighborId, "b");

  for (const record of forward.records) {
    assert.ok(record.cosineNearestStabilityCount <= 2);
    assert.ok(record.hellingerNearestStabilityCount <= 2);
    for (const candidate of record.candidates) {
      for (const metric of [candidate.cosine, candidate.hellinger]) {
        assert.ok(metric.distance >= 0 && metric.distance <= 1);
        assert.ok(metric.leaveOneThemeOutMinimumRank >= 1);
        assert.ok(
          metric.leaveOneThemeOutMaximumRank <= record.candidates.length,
        );
        assert.ok(
          metric.leaveOneThemeOutMinimumRank <=
            metric.leaveOneThemeOutMaximumRank,
        );
      }
      for (const contributor of [
        ...candidate.cosineContributors,
        ...candidate.hellingerContributors,
      ]) {
        assert.ok(contributor.contribution > 0);
        assert.ok(
          contributor.shareOfSquaredDistance > 0 &&
            contributor.shareOfSquaredDistance <= 1,
        );
      }
    }
  }
});

test("granularity audit separates corpus coverage and never turns missing text into zero length", () => {
  const auditData = deriveProvisionGranularityAudit({
    instruments,
    provisions,
    sourceAudits,
  });
  const complete = auditData.instruments.find(
    (item) => item.instrumentId === "a",
  );
  const selected = auditData.instruments.find(
    (item) => item.instrumentId === "b",
  );
  assert.ok(complete && selected);
  assert.equal(complete.coverageClass, "complete");
  assert.equal(selected.coverageClass, "selected");
  assert.equal(complete.totalProvisionCount, 5);
  assert.equal(complete.substantiveProvisionCount, 3);
  assert.equal(complete.structuralContextCount, 1);
  assert.equal(complete.unreviewedProvisionCount, 1);
  assert.equal(complete.conceptAssignmentCount, 5);
  assert.equal(complete.conceptAssignmentsPerProvision, 1);
  assert.equal(complete.mappedProvisionCount, 4);
  assert.equal(complete.unmappedProvisionCount, 1);
  assert.equal(complete.multiConceptProvisionCount, 1);
  assert.equal(
    complete.annotationCoverage.actorTags.recordedProvisionCount,
    1,
  );
  assert.equal(
    complete.annotationCoverage.scopeTags.recordedProvisionCount,
    1,
  );
  assert.equal(
    complete.annotationCoverage.appliesFrom.resolvedProvisionCount,
    3,
  );
  assert.equal(
    complete.annotationCoverage.appliesFrom.unresolvedProvisionCount,
    1,
  );
  assert.equal(complete.textCoverage.storedTextProvisionCount, 2);
  assert.equal(complete.textCoverage.missingTextProvisionCount, 3);
  assert.equal(complete.textCoverage.storedUnicodeCharacterCount, 5);
  assert.equal(
    complete.textCoverage.meanUnicodeCharactersPerStoredProvision,
    2.5,
  );
  assert.equal(
    complete.textCoverage.medianUnicodeCharactersPerStoredProvision,
    2.5,
  );
  assert.deepEqual(
    auditData.coverageClasses.map((cohort) => cohort.coverageClass),
    ["complete", "selected", "unclassified"],
  );
});

test("article microscope preserves source order, full coverage and concept tracks", () => {
  const microscope = deriveArticleMicroscope({
    instruments,
    provisions: [...provisions].reverse(),
    sourceAudits,
  });
  const complete = microscope.instruments.find(
    (item) => item.instrumentId === "a",
  );
  assert.ok(complete);
  assert.deepEqual(
    complete.bands.map((band) => band.provisionId),
    ["a-1", "a-2", "a-3", "a-4", "a-5"],
  );
  assert.equal(complete.bands[0].startRatio, 0);
  assert.equal(complete.bands.at(-1).endRatio, 1);
  assert.equal(complete.bands[2].appliesFromState, "unresolved");
  assert.equal(complete.bands[3].appliesFromState, "missing");
  assert.equal(complete.maximumConceptAssignmentCount, 2);
  const c1 = complete.conceptTracks.find((track) => track.conceptId === "c1");
  assert.deepEqual(c1, {
    conceptId: "c1",
    provisionCount: 2,
    firstIndex: 0,
    lastIndex: 4,
    meanPosition: 0.5,
  });
});

test("Phase 4 methodology rejects equivalence and cross-language length claims", () => {
  assert.match(
    labDataSource,
    /missing and non-ISO or impossible dates remain visible rather than being inferred/i,
  );
  assert.match(labDataSource, /Hellinger distance/i);
  assert.match(labDataSource, /no distance is a legal-equivalence or compliance score/i);
  assert.match(labDataSource, /cross-language lengths are not treated as directly comparable/i);
  assert.match(labDataSource, /do not infer absent rules|does not infer absent rules/i);
});
