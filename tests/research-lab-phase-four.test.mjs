import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deriveApplicabilityHorizon,
  deriveArticleMicroscope,
  deriveProvisionGranularityAudit,
  deriveRegulatoryNeighborhoodStability,
  hellingerDistance,
} from "../app/research-lab-data.ts";

const appRoot = new URL("../app/", import.meta.url);
const [labSource, labDataSource, labStyles] = await Promise.all([
  readFile(new URL("research-lab.tsx", appRoot), "utf8"),
  readFile(new URL("research-lab-data.ts", appRoot), "utf8"),
  readFile(new URL("research-lab.module.css", appRoot), "utf8"),
]);

const phaseFourViews = [
  ["horizon", "Applicability Horizon"],
  ["microscope", "Article Concept Microscope"],
  ["neighborhoods", "Neighborhood Stability"],
  ["granularity", "Granularity + Corpus Bias"],
];

function literalPattern(value) {
  return value
    .split(" ")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

function fixtureInstrument(id) {
  return {
    id,
    shortTitle: id.toUpperCase(),
    title: `Fixture ${id}`,
    jurisdictionId: id,
    category: "fixture",
    legalForce: "binding",
    lifecycleStatus: "applicable",
    statusAsOf: "2026-07-20",
    dates: { effectiveFrom: "2020-01-01" },
  };
}

function fixtureAudit(instrumentId, mode = "complete-official-corpus") {
  return {
    instrumentId,
    reviewedOn: "2026-07-20",
    reviewLevel: "fixture",
    localCoverage: {
      mode,
      localUnitCount: 3,
      statement: "Fixture coverage statement.",
    },
  };
}

function fixtureProvision(id, instrumentId, overrides = {}) {
  return {
    id,
    instrumentId,
    locator: id,
    title: `Fixture ${id}`,
    provisionType: "article",
    conceptIds: [],
    sourceOrder: 0,
    topicRelevance: {
      relevance: "substantive-topic",
      conceptIds: [],
    },
    ...overrides,
  };
}

function fixtureFingerprint(instrumentId, values, included = true) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0));
  return {
    instrumentId,
    coverageMode: included
      ? "complete-official-corpus"
      : "selected-research-index",
    coverageClass: included ? "complete" : "selected",
    includedInDefaultAnalysis: included,
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

test("Phase 4 is a distinct accessible research phase with four views", () => {
  assert.match(
    labSource,
    /type ResearchLabPhase\s*=\s*["']patterns["']\s*\|\s*["']relations["']\s*\|\s*["']models["']\s*\|\s*["']dynamics["']/,
  );
  assert.match(labSource, /Phase 04/);
  assert.match(labSource, /Dynamics \+ measurement/);
  assert.match(labSource, /aria-pressed=\{activePhase === ["']dynamics["']\}/);
  assert.match(labSource, /dynamics:\s*[\s\S]{0,180}["']horizon["']/);
  for (const [id, label] of phaseFourViews) {
    assert.match(labSource, new RegExp(`id:\\s*["']${id}["']`));
    assert.match(labSource, new RegExp(literalPattern(label)));
    assert.match(labSource, new RegExp(`activeView === ["']${id}["']`));
  }
});

test("applicability horizon uses only explicit valid dates and preserves missingness", () => {
  const instruments = [fixtureInstrument("a"), fixtureInstrument("b")];
  const provisions = [
    fixtureProvision("a-past", "a", { appliesFrom: "2026-01-01" }),
    fixtureProvision("a-snapshot", "a", { appliesFrom: "2026-07-20" }),
    fixtureProvision("a-future-1", "a", {
      appliesFrom: "2026-08-01",
      conceptIds: ["c1"],
    }),
    fixtureProvision("a-future-2", "a", {
      appliesFrom: "2026-08-01",
      conceptIds: ["c1", "c2"],
    }),
    fixtureProvision("b-invalid", "b", { appliesFrom: "2026-02-30" }),
    fixtureProvision("b-missing", "b"),
  ];
  const horizon = deriveApplicabilityHorizon({
    snapshotDate: "2026-07-20",
    instruments,
    provisions,
    sourceAudits: [
      fixtureAudit("a"),
      fixtureAudit("b", "selected-research-index"),
    ],
    statusEvents: [
      {
        id: "future-event",
        instrumentId: "a",
        date: "2026-09-01",
        type: "scheduled-general-application",
        label: "Future event",
        effect: "Fixture effect",
        resultingStatus: "applicable",
      },
      {
        id: "invalid-event",
        instrumentId: "b",
        date: "not-a-date",
        type: "fixture",
        label: "Unresolved event",
        effect: "Fixture effect",
        resultingStatus: "unknown",
      },
    ],
  });

  assert.equal(horizon.snapshotDate, "2026-07-20");
  assert.equal(horizon.beforeSnapshotProvisionCount, 1);
  assert.equal(horizon.onSnapshotProvisionCount, 1);
  assert.equal(horizon.futureProvisionCount, 2);
  assert.equal(horizon.missingProvisionDateCount, 1);
  assert.equal(horizon.unresolvedProvisionDateCount, 1);
  assert.equal(horizon.resolvedStatusEventCount, 1);
  assert.equal(horizon.unresolvedStatusEventCount, 1);
  assert.equal(
    horizon.provisionDateGroups.find((group) => group.date === "2026-08-01")
      ?.provisionCount,
    2,
  );
  assert.equal(horizon.statusEvents[0].temporalStatus, "future");
  assert.equal(
    horizon.instruments.find((instrument) => instrument.instrumentId === "b")
      ?.coverageClass,
    "selected",
  );
  assert.ok(
    horizon.missingProvisionIds.includes("b-missing"),
    "instrument metadata must not be substituted for a missing provision date",
  );
});

test("article microscope preserves deterministic source order and complete ratios", () => {
  const microscope = deriveArticleMicroscope({
    instruments: [fixtureInstrument("a")],
    sourceAudits: [fixtureAudit("a")],
    provisions: [
      fixtureProvision("a-10", "a", {
        locator: "Article 10",
        sourceOrder: 2,
        conceptIds: ["c2"],
      }),
      fixtureProvision("a-2", "a", {
        locator: "Article 2",
        sourceOrder: 1,
        conceptIds: ["c1", "c2"],
      }),
      fixtureProvision("a-1", "a", {
        locator: "Article 1",
        sourceOrder: 1,
        conceptIds: ["c1"],
      }),
    ],
  });
  const profile = microscope.instruments[0];
  assert.deepEqual(
    profile.bands.map((band) => band.locator),
    ["Article 1", "Article 2", "Article 10"],
  );
  assert.equal(profile.bands[0].startRatio, 0);
  assert.equal(profile.bands.at(-1).endRatio, 1);
  assert.ok(
    profile.bands.every(
      (band, index) =>
        index === 0 || profile.bands[index - 1].endRatio === band.startRatio,
    ),
  );
  assert.deepEqual(
    profile.conceptTracks.find((track) => track.conceptId === "c1"),
    {
      conceptId: "c1",
      provisionCount: 2,
      firstIndex: 0,
      lastIndex: 1,
      meanPosition: 0.25,
    },
  );
});

test("Hellinger distance and neighborhood rankings are bounded and deterministic", () => {
  assert.equal(hellingerDistance([1, 0], [1, 0]), 0);
  assert.equal(hellingerDistance([1, 0], [0, 1]), 1);
  assert.equal(hellingerDistance([1, 1], [2, 2]), 0);
  assert.equal(hellingerDistance([0, 0], [0, 0]), 0);
  const symmetricLeft = hellingerDistance([3, 1, 2], [1, 4, 1]);
  const symmetricRight = hellingerDistance([1, 4, 1], [3, 1, 2]);
  assert.ok(symmetricLeft >= 0 && symmetricLeft <= 1);
  assert.ok(Math.abs(symmetricLeft - symmetricRight) < 1e-12);

  const concepts = [
    { id: "c1", label: "C1", family: "fixture", theme: "t1", description: "", summary: "" },
    { id: "c2", label: "C2", family: "fixture", theme: "t1", description: "", summary: "" },
    { id: "c3", label: "C3", family: "fixture", theme: "t2", description: "", summary: "" },
  ];
  const themes = [
    { id: "t1", label: "T1", summary: "", order: 1 },
    { id: "t2", label: "T2", summary: "", order: 2 },
  ];
  const fingerprints = [
    fixtureFingerprint("a", [1, 0, 0]),
    fixtureFingerprint("b", [0.95, 0.05, 0]),
    fixtureFingerprint("c", [0, 0.9, 0.1]),
    fixtureFingerprint("selected", [1, 0, 0], false),
  ];
  const forward = deriveRegulatoryNeighborhoodStability(
    fingerprints,
    concepts,
    themes,
  );
  const reversed = deriveRegulatoryNeighborhoodStability(
    [...fingerprints].reverse(),
    [...concepts].reverse(),
    [...themes].reverse(),
  );
  assert.deepEqual(forward, reversed);
  assert.deepEqual(forward.fitInstrumentIds, ["a", "b", "c"]);
  assert.deepEqual(forward.excludedInstrumentIds, ["selected"]);
  assert.equal(forward.themeOmissionCount, 2);
  assert.equal(forward.records.length, 3);
  for (const record of forward.records) {
    assert.equal(record.candidates.length, 2);
    for (const candidate of record.candidates) {
      assert.ok(candidate.cosine.distance >= 0 && candidate.cosine.distance <= 1);
      assert.ok(candidate.hellinger.distance >= 0 && candidate.hellinger.distance <= 1);
      assert.ok(
        candidate.cosine.leaveOneThemeOutMinimumRank <=
          candidate.cosine.leaveOneThemeOutMaximumRank,
      );
      assert.ok(
        candidate.hellinger.leaveOneThemeOutMinimumRank <=
          candidate.hellinger.leaveOneThemeOutMaximumRank,
      );
    }
  }
});

test("granularity audit keeps absent text and sparse annotations explicit", () => {
  const audit = deriveProvisionGranularityAudit({
    instruments: [fixtureInstrument("a"), fixtureInstrument("b")],
    sourceAudits: [
      fixtureAudit("a"),
      fixtureAudit("b", "selected-research-index"),
    ],
    provisions: [
      fixtureProvision("a-1", "a", {
        fullText: "  A   B  ",
        conceptIds: ["c1", "c2"],
        actorTags: ["controller"],
        appliesFrom: "2026-08-01",
      }),
      fixtureProvision("a-2", "a", {
        fullText: "",
        scopeTags: ["high-risk"],
        appliesFrom: "unknown",
      }),
      fixtureProvision("a-3", "a", {
        topicRelevance: {
          relevance: "structural-context",
          conceptIds: [],
        },
      }),
      fixtureProvision("b-1", "b"),
    ],
  });
  const complete = audit.instruments.find((instrument) => instrument.instrumentId === "a");
  assert.ok(complete);
  assert.equal(complete.textCoverage.storedTextProvisionCount, 1);
  assert.equal(complete.textCoverage.missingTextProvisionCount, 2);
  assert.equal(complete.textCoverage.storedUnicodeCharacterCount, 3);
  assert.equal(complete.textCoverage.meanUnicodeCharactersPerStoredProvision, 3);
  assert.equal(complete.textCoverage.medianUnicodeCharactersPerStoredProvision, 3);
  assert.equal(complete.annotationCoverage.actorTags.recordedProvisionCount, 1);
  assert.equal(complete.annotationCoverage.scopeTags.recordedProvisionCount, 1);
  assert.equal(complete.annotationCoverage.appliesFrom.resolvedProvisionCount, 1);
  assert.equal(complete.annotationCoverage.appliesFrom.unresolvedProvisionCount, 1);
  assert.equal(complete.conceptAssignmentsPerSubstantiveProvision, 1);
  assert.equal(
    audit.coverageClasses.find((cohort) => cohort.coverageClass === "complete")
      ?.instrumentCount,
    1,
  );
  assert.equal(
    audit.coverageClasses.find((cohort) => cohort.coverageClass === "selected")
      ?.instrumentCount,
    1,
  );
});

test("Phase 4 UI states its evidentiary limits and preserves drill-down", () => {
  assert.match(labSource, /only explicit, machine-resolvable dates recorded in the\s+corpus/i);
  assert.match(labSource, /neither establishes that every obligation[\s\S]{0,80}active/i);
  assert.match(labSource, /Missing and unresolved dates remain visible/i);
  assert.match(labSource, /onOpenProvision\(group\.provisionIds\[0\]\)/);
  assert.match(labSource, /onOpenConcept\(conceptId\)/);
  assert.match(labSource, /aria-valuetext=\{`\$\{formatDate\(selectedDate\)\}/);

  assert.match(labSource, /Color and intensity encode recorded concept assignments, not legal\s+importance/i);
  assert.match(labSource, /Selected \/ partial corpus/);
  assert.match(labSource, /role=["']listbox["']/);
  assert.match(labSource, /role=["']option["']/);
  assert.match(labSource, /aria-activedescendant=/);
  assert.match(labSource, /function handleMicroscopeKeyDown\(/);
  assert.match(labSource, /onOpenProvision\(selectedBand\.provisionId\)/);
  assert.match(labSource, /Current provision · \{selectedBandIndex \+ 1\} of \{profile\.bands\.length\}/);

  assert.match(labSource, /Cosine rank/);
  assert.match(labSource, /Hellinger rank/);
  assert.match(labSource, /Leave-one-theme-out rank range/);
  assert.match(labSource, /not legal-equivalence or compliance scores/i);

  assert.match(labSource, /Complete and selected corpora are\s+separated/i);
  assert.match(labSource, /annotation\s+is not recorded here/i);
  assert.match(labSource, /role=["']table["'][\s\S]{0,120}Instrument granularity and corpus annotation coverage/);
  assert.doesNotMatch(
    labDataSource,
    /\b(?:complianceScore|readinessScore|strictnessScore|similarityScore|qualityScore)\b/,
  );
});

test("Phase 4 layouts contain true wide views and reflow without text overlap", () => {
  assert.match(
    labStyles,
    /\.phaseSwitch\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  );
  assert.match(
    labStyles,
    /\.applicabilityWorkspace,[\s\S]{0,180}\.granularityWorkspace\s*\{[\s\S]*?min-inline-size:\s*0/,
  );
  assert.match(
    labStyles,
    /\.applicabilityScroll,[\s\S]{0,80}\.granularityScroll\s*\{[\s\S]*?overflow-x:\s*auto/,
  );
  assert.match(
    labSource,
    /className=\{styles\.applicabilityScroll\}[\s\S]{0,180}role=["']region["'][\s\S]{0,100}tabIndex=\{0\}/,
  );
  assert.match(
    labSource,
    /className=\{styles\.granularityScroll\}[\s\S]{0,180}role=["']region["'][\s\S]{0,100}tabIndex=\{0\}/,
  );
  assert.match(labStyles, /\.applicabilityAxisCorner\s*\{[\s\S]*?position:\s*sticky[\s\S]*?inset-inline-start:\s*0/);
  assert.match(labStyles, /\.granularityHeader\s*>\s*:first-child\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(labStyles, /\.granularityInstrumentCell\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(labStyles, /\.applicabilityFigure\s*\{[\s\S]*?min-inline-size:\s*980px/);
  assert.match(labStyles, /\.granularityPlot\s*\{[\s\S]*?min-inline-size:\s*1180px/);
  assert.match(labStyles, /\.microscopeStrip\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(
    labStyles,
    /@container \(max-width:\s*760px\)[\s\S]*?\.microscopeWorkspace,[\s\S]{0,80}\.neighborhoodWorkspace\s*\{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(
    labStyles,
    /@container \(max-width:\s*480px\)[\s\S]*?\.phaseSwitch\s*\{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(
    labStyles,
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.applicabilityMarker,[\s\S]*?\.microscopeProvision,[\s\S]*?\.neighborhoodMarker,[\s\S]*?\.granularityFill/,
  );
  const phaseFourStyles = labStyles.match(
    /\/\* Phase 04 · Dynamics \+ measurement \*\/([\s\S]*?)\n\.legendMark/,
  )?.[1];
  assert.ok(phaseFourStyles, "Phase 4 styles must remain inspectable as one theme-aware block");
  assert.doesNotMatch(phaseFourStyles, /#[\da-f]{3,8}\b/i);
  assert.match(phaseFourStyles, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(labStyles, /position:\s*fixed/);
});

test("truncated research lists disclose displayed and total counts", () => {
  assert.match(labSource, /Showing \{selectedEvidence\.length\} of \{allSelectedEvidence\.length\} supporting/);
  assert.match(labSource, /showing \{rankShiftNodes\.length\} of \{allRankShiftNodes\.length\} nodes/i);
  assert.match(labSource, /Showing \{terminalPaths\.length\} of \{allTerminalPaths\.length\} recorded/);
  assert.match(labSource, /Showing \{displayedCandidates\.length\} of \{rankedCandidates\.length\} ranked/);
});
