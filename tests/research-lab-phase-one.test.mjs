import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildResearchLabExportPayload,
  buildResearchLabShareHash,
  RESEARCH_LAB_EXPORT_LIMITATIONS,
} from "../app/research-lab-data.ts";

const appRoot = new URL("../app/", import.meta.url);
const dataRoot = new URL("../data/v2/", import.meta.url);

const [
  explorerSource,
  lazyResearchSource,
  labSource,
  labDataSource,
  labStyles,
  sourceAudits,
  conceptReviews,
  statusEvents,
] = await Promise.all([
  readFile(new URL("regulation-explorer.tsx", appRoot), "utf8"),
  readFile(new URL("lazy-research-view.tsx", appRoot), "utf8"),
  readFile(new URL("research-lab.tsx", appRoot), "utf8"),
  readFile(new URL("research-lab-data.ts", appRoot), "utf8"),
  readFile(new URL("research-lab.module.css", appRoot), "utf8"),
  readFile(new URL("source-audit.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("provision-concepts.json", dataRoot), "utf8").then(JSON.parse),
  readFile(new URL("status-events.json", dataRoot), "utf8").then(JSON.parse),
]);

const phaseOneViews = [
  ["observatory", "Corpus Observatory"],
  ["genome", "Regulatory Genome"],
  ["morphology", "Comparative Morphology"],
  ["grammar", "Regulatory Grammar"],
  ["timeline", "Global Time Machine"],
];

test("Research Lab is a first-class explorer surface", () => {
  assert.match(
    explorerSource,
    /import\(["']\.\/lazy-research-view["']\)/,
    "the explorer must defer the dedicated research surface",
  );
  assert.match(
    explorerSource,
    /type View\s*=\s*[^;]*["']research["']/,
    "Research Lab must participate in the top-level workspace state",
  );
  assert.match(
    explorerSource,
    /const viewLabels:[^=]*=\s*\[[\s\S]*?\{\s*id:\s*["']research["'],\s*label:\s*["']Research["']/,
    "the surface must be reachable through the existing top-level mode switch",
  );
  assert.match(
    explorerSource,
    /state\.view\s*===\s*["']research["'][\s\S]*?<LazyResearchView[\s\S]*?input=\{researchCorpusInput\}/,
    "the research state must mount the model with legal-source drill-down",
  );
  assert.match(explorerSource, /onOpenInstrument=\{openInstrument\}/);
  assert.match(lazyResearchSource, /<ResearchLab/);
  assert.match(
    explorerSource,
    /type NavigatorTab\s*=\s*["']sources["']\s*\|\s*["']concepts["']/,
    "the left sidebar must remain the Global Atlas/Core Concepts switch",
  );
  assert.doesNotMatch(explorerSource, /type NavigatorTab\s*=\s*[^;]*["']research["']/);
  assert.match(labSource, /data-testid=["']research-lab["']/);
});

test("all five Phase 1 views use an accessible tab-and-panel contract", () => {
  assert.match(labSource, /role=["']tablist["']/);
  assert.match(labSource, /aria-label=["']Research Lab views["']/);
  assert.match(labSource, /role=["']tab["']/);
  assert.match(labSource, /aria-selected=/);
  assert.match(labSource, /aria-controls=/);
  assert.match(labSource, /role=["']tabpanel["']/);
  assert.match(labSource, /aria-labelledby=/);

  for (const [id, label] of phaseOneViews) {
    assert.match(labSource, new RegExp(label.replaceAll(" ", "\\s+")));
    assert.match(
      labSource,
      new RegExp(`research-tab-(?:\\$\\{[^}]+\\}|${id})`),
      `${label} must expose a stable tab hook`,
    );
    assert.match(
      labSource,
      new RegExp(`research-panel-(?:\\$\\{[^}]+\\}|${id})`),
      `${label} must expose a stable panel hook`,
    );
  }

  for (const derivation of [
    "deriveCoverageObservatory",
    "deriveConceptFingerprints",
    "deriveStructuralProfiles",
    "deriveConceptCooccurrence",
    "deriveLifecycleLanes",
  ]) {
    assert.match(
      labDataSource,
      new RegExp(`export function ${derivation}\\(`),
      `${derivation} must remain an independently testable pure derivation`,
    );
  }
});

test("coverage is observable and its limits are stated alongside the analysis", () => {
  assert.ok(
    sourceAudits.some((audit) => audit.localCoverage.mode.startsWith("complete-")),
    "the observatory needs complete-corpus records",
  );
  assert.ok(
    sourceAudits.some((audit) => audit.localCoverage.mode.startsWith("selected-")),
    "the observatory needs selected-corpus records",
  );

  for (const field of [
    "provisionCount",
    "substantiveProvisionCount",
    "structuralContextCount",
    "completeInstrumentCount",
    "selectedInstrumentCount",
    "reviewedRelationCount",
    "candidateRelationCount",
  ]) {
    assert.match(
      labDataSource,
      new RegExp(`\\b${field}\\b`),
      `the observatory must publish ${field}`,
    );
  }

  assert.match(
    labSource,
    /aria-label=["']Corpus coverage["']|<label[^>]*>[\s\S]*?Corpus coverage/i,
    "users must be able to see or choose the corpus-completeness scope",
  );
  assert.match(
    labSource,
    /initialCoverageScope\s*=\s*["']complete["'][\s\S]*?useState<CoverageScope>\(initialCoverageScope\)/,
    "complete corpora must be the default comparative sample",
  );
  assert.match(
    labDataSource,
    /selected corpora[\s\S]{0,300}(?:not (?:treated as )?comparable|mask)/i,
    "selected indexes must not silently be compared with complete corpora",
  );
  assert.match(
    labDataSource,
    /id:\s*["']absence-is-unknown["'][\s\S]{0,100}No local match is not legal absence/i,
    "missing local evidence must not be presented as absence from the law",
  );
  assert.match(
    labDataSource,
    /candidate[\s\S]{0,80}relations?[\s\S]{0,200}(?:editorial-reviewed|verified legal mappings)/i,
    "candidate graph edges must remain distinct from reviewed evidence",
  );
});

test("genome and grammar measurements are normalized rather than strength scores", () => {
  assert.match(
    labDataSource,
    /Math\.log\(\s*\(\s*1\s*\+\s*[^)]+\)\s*\/\s*\(\s*1\s*\+\s*[^)]+\)\s*\)\s*\+\s*1/,
    "concept fingerprints must implement smoothed inverse-document frequency",
  );
  assert.match(labDataSource, /(?:l2|L2)[\s\S]{0,240}(?:normaliz|norm)/);
  assert.match(
    labDataSource,
    /conceptAssignmentCount\s*\?\s*rawCount\s*\/\s*conceptAssignmentCount/,
    "term frequency must be divided by an instrument-level concept total",
  );
  assert.match(labDataSource, /\bPMI\b|pointwise mutual information/i);
  assert.match(labDataSource, /\blift\b/i);
  assert.match(
    labSource,
    /const l2Norm\s*=\s*Math\.sqrt\([\s\S]{0,220}cell\.tfidf\s*\*\s*cell\.tfidf/,
    "the visible genome must calculate a row-wise vector norm",
  );
  assert.match(
    labSource,
    /tfidf:\s*cell\.tfidf\s*\/\s*l2Norm/,
    "the default visible fingerprint must apply and disclose L2 normalization",
  );
  assert.match(labSource, /L2-normalized TF-IDF/);
  assert.match(
    labSource,
    /aria-label=["']Genome normalization["']|<label[^>]*>[\s\S]*?Genome normalization/i,
  );
  assert.match(
    labSource + labDataSource,
    /raw counts?[\s\S]{0,160}(?:not|do not|≠)[\s\S]{0,100}(?:strength|strictness)/i,
    "the interface must not imply that editorial frequency measures regulatory strength",
  );
});

test("research marks and charts retain accessible evidence drill-down hooks", () => {
  assert.match(labSource, /onOpenInstrument:\s*\(instrumentId:\s*string\)\s*=>\s*void/);
  assert.match(labSource, /onOpenProvision:\s*\(provisionId:\s*string/);
  assert.match(labSource, /onOpenConcept:\s*\(conceptId:\s*string\)\s*=>\s*void/);
  assert.match(
    labSource,
    /<button[\s\S]{0,500}onClick=\{[^}]*onOpenInstrument/,
    "instrument marks must use native-button navigation",
  );
  assert.match(
    labSource,
    /<button[\s\S]{0,500}onClick=\{[^}]*onOpenProvision/,
    "provision marks must use native-button navigation",
  );
  assert.match(
    labSource,
    /<button[\s\S]{0,500}onClick=\{[^}]*onOpenConcept/,
    "concept marks must use native-button navigation",
  );
  assert.match(labSource, /aria-label=["']Association metric["']/);
  assert.match(
    labSource,
    /aria-label=["']Research date \(recorded event stops\)["']/,
  );
  assert.match(labSource, /aria-valuetext=\{formatDate\(selectedDate\)\}/);
});

test("the time machine preserves event status and distinguishes time relative to the snapshot", () => {
  assert.ok(statusEvents.some((event) => event.type === "revoked"));
  assert.ok(
    statusEvents.some((event) => event.type.includes("scheduled")),
    "future phased application must exist in the source event stream",
  );
  assert.ok(
    statusEvents.some((event) => event.resultingStatus === "partially-applicable"),
    "phased application must remain distinct from full application",
  );

  assert.match(labDataSource, /temporalStatus/);
  for (const status of ["past", "on-snapshot", "future"]) {
    assert.match(
      labDataSource,
      new RegExp(`["']${status}["']`),
      `timeline derivation must preserve ${status} events`,
    );
  }
  assert.match(labDataSource, /resultingStatus/);
  assert.match(
    labDataSource,
    /type ResearchStatusEventInput[\s\S]*?type:\s*string[\s\S]*?resultingStatus:\s*string/,
  );
  assert.match(labDataSource, /list\.push\(\{[\s\S]*?\.\.\.event,[\s\S]*?temporalStatus:/);
  assert.match(
    labSource + labDataSource,
    /(?:incomplete legislative history|not[\s\S]{0,80}(?:a )?complete legislative history)/i,
    "the event stream must not be represented as complete legislative history",
  );
});

test("substantive analysis is the default while structural context remains inspectable", () => {
  assert.ok(
    conceptReviews.some((review) => review.relevance === "substantive-topic"),
  );
  assert.ok(
    conceptReviews.some((review) => review.relevance === "structural-context"),
  );
  assert.match(
    labDataSource,
    /const DEFAULT_RELEVANCE:[^=]*=\s*\[["']substantive-topic["']\]/,
  );
  assert.match(
    labDataSource,
    /relevance\s*===\s*["']substantive-topic["']|["']substantive-topic["']\s*===\s*[^\n]*relevance/,
    "research derivations must apply the reviewed relevance field",
  );
  assert.match(labSource, /Substantive provisions/i);
  assert.match(labSource, /All records · structural \+ unreviewed/i);
  assert.match(
    labSource,
    /function RegulatoryGrammar\(\{[\s\S]*?coverageScope,[\s\S]*?const displayedInstruments[\s\S]*?instrumentMatchesCoverage\(instrument, coverageScope\)[\s\S]*?const includedInstrumentIds[\s\S]*?conceptMeasurementState === ["']observed-complete["'][\s\S]*?const includedProvisions[\s\S]*?buildGrammarPairs\(\s*includedProvisions/,
    "grammar associations must expose requested instruments while keeping partial corpora outside the estimand",
  );
  assert.match(
    labSource,
    /const allSelectedEvidence\s*=[\s\S]*?includedProvisions[\s\S]*?provisionMatchesScope\(provision, relevanceScope\)/,
    "grammar drill-down evidence must honor both coverage and relevance filters",
  );
});

test("Phase 1 charts reflow and scroll instead of overlapping at narrow widths", () => {
  assert.match(labStyles, /\.lab\s*\{[\s\S]*?min-inline-size:\s*0/);
  assert.match(labStyles, /\.tabList\s*\{[\s\S]*?(?:overflow-x:\s*auto|flex-wrap:\s*wrap)/);
  assert.match(labStyles, /\.controlBar\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(labStyles, /\.statsGrid\s*\{[\s\S]*?grid-template-columns:[^;]*minmax\(0,\s*1fr\)/);
  assert.match(
    labStyles,
    /\.qualityTableWrap,[\s\S]*?\.scrollRegion,[\s\S]*?\.matrixScroll,[\s\S]*?\.timelineScroll\s*\{[\s\S]*?min-inline-size:\s*0;[\s\S]*?overflow-x:\s*auto/,
  );
  assert.match(labStyles, /\.geneFigure\s*\{[\s\S]*?min-inline-size:/);
  assert.match(labStyles, /\.matrixFigure\s*\{[\s\S]*?min-inline-size:/);
  assert.match(labStyles, /\.timelineFigure\s*\{[\s\S]*?min-inline-size:/);
  assert.match(labStyles, /@container|@media\s*\(max-width:/);
  assert.match(labStyles, /overflow-wrap:\s*(?:anywhere|break-word)/);
  assert.match(labStyles, /\.axisCurrent\s*\{[\s\S]*?clamp\(/);
  assert.match(labStyles, /\.eventMarker\s*\{[\s\S]*?clamp\(/);
  assert.match(
    labStyles,
    /\.geneTrack\[data-band-scale=["']inspect["']\][\s\S]*?minmax\(24px,\s*1fr\)/,
  );
  assert.match(labStyles, /\.instrumentButton\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(labStyles, /\.matrixLabelButton\s*\{[\s\S]*?position:\s*sticky/);
  assert.doesNotMatch(labStyles, /position:\s*fixed/);
});

test("grammar preserves direction, missingness and cross-instrument support", () => {
  assert.match(labSource, /instrumentCount:\s*number/);
  assert.match(labSource, /jurisdictionCount:\s*number/);
  assert.match(labSource, /pairInstrumentIds/);
  assert.match(labSource, /useState\(2\)/);
  assert.match(labSource, /pair\.instrumentCount\s*>=\s*minimumInstruments/);
  assert.match(labSource, /metric === ["']lift["'] \? 1 : 0/);
  assert.match(labSource, /Math\.log2\(value\)/);
  for (const direction of ["negative", "neutral", "positive", "none"]) {
    assert.match(labSource, new RegExp(`data-sign=["']${direction}["']`));
  }
  assert.match(labSource, /return ["']N\/A["']/);
  assert.match(labDataSource, /cooccurringInstrumentCount/);
  assert.match(labDataSource, /cooccurringJurisdictionCount/);
  assert.match(labDataSource, /Math\.log2\(lift\)/);
});

test("time view is an event index rather than an invented historical state", () => {
  assert.doesNotMatch(labSource, /Timeline state is reconstructed/i);
  assert.match(labSource, /index of recorded lifecycle events/i);
  assert.match(labSource, /not a reconstruction of the[\s\S]{0,40}status or wording/i);
  assert.match(labSource, /["']entered-into-force["']:\s*["']commencement["']/);
  assert.match(labSource, /vetoed:\s*["']cessation["']/);
  assert.doesNotMatch(
    labSource,
    /function GlobalTimeMachine\(\{[\s\S]{0,100}coverageScope/,
    "local text completeness must not masquerade as event-history completeness",
  );
});

test("interactive readouts derive current values and tabs use roving focus", () => {
  assert.match(
    labSource,
    /const activeMatrixCell =[\s\S]*?matrix\.get\(activeCell\.instrumentId\)[\s\S]*?const activeValue =[\s\S]*?activeMatrixCell\?\.\[metric\]/,
  );
  assert.doesNotMatch(
    labSource,
    /const \[activeCell[\s\S]{0,180}value:\s*number/,
  );
  assert.match(labSource, /tabIndex=\{activeView === view\.id \? 0 : -1\}/);
  assert.match(labSource, /tabIndex=\{activePhase === ["']patterns["'] \? 0 : -1\}/);
  assert.match(labSource, /function handlePhaseKeyDown\(/);
  assert.match(labSource, /onViewChange\?: \(view: ResearchLabView\) => void/);
  assert.match(labSource, /onViewChange\?\.\(nextView\)/);
  assert.match(labSource, /onViewChange\?\.\(view\)/);
  assert.match(labSource, /function handleGenomeCellKeyDown\(/);
  assert.match(labSource, /data-genome-row=\{instrumentIndex\}/);
  assert.match(labSource, /data-genome-column=\{conceptIndex\}/);
  assert.match(
    labSource,
    /instrumentIndex === rovingGenomeRowIndex[\s\S]{0,120}conceptIndex === rovingGenomeColumnIndex[\s\S]{0,80}\? 0[\s\S]{0,40}: -1/,
  );
  assert.match(labSource, /function handleGrammarCellKeyDown\(/);
  assert.match(labSource, /data-grammar-row=\{rowIndex\}/);
  assert.match(labSource, /data-grammar-column=\{columnIndex\}/);
  assert.match(labSource, /tabIndex=\{key === rovingGrammarKey \? 0 : -1\}/);
});

test("Research Lab share state uses the explorer hash and exposes filter callbacks", () => {
  const hash = buildResearchLabShareHash(
    "#view=instrument&instrument=eu-gdpr&researchPhase=patterns",
    {
      view: "genome",
      coverageScope: "all",
      relevanceScope: "all",
    },
  );
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  assert.equal(params.get("view"), "research");
  assert.equal(params.get("instrument"), "eu-gdpr");
  assert.equal(params.get("researchView"), "genome");
  assert.equal(params.get("researchCoverage"), "all");
  assert.equal(params.get("researchRelevance"), "all");
  assert.equal(params.has("researchPhase"), false);

  assert.match(labSource, /initialCoverageScope\?: ResearchCoverageScope/);
  assert.match(labSource, /initialRelevanceScope\?: ResearchRelevanceScope/);
  assert.match(labSource, /onCoverageScopeChange\?: \(scope: ResearchCoverageScope\) => void/);
  assert.match(labSource, /onRelevanceScopeChange\?: \(scope: ResearchRelevanceScope\) => void/);
  assert.match(labSource, /useState<CoverageScope>\(initialCoverageScope\)/);
  assert.match(labSource, /useState<RelevanceScope>\(initialRelevanceScope\)/);
  assert.match(labSource, /url\.hash = buildResearchLabShareHash\(url\.hash/);
  assert.doesNotMatch(labSource, /url\.searchParams\.set\(["']research/);
});

test("view dataset exports disclose that view-local controls are omitted", () => {
  assert.deepEqual(RESEARCH_LAB_EXPORT_LIMITATIONS.sharedStateFields, [
    "view",
    "coverageScope",
    "relevanceScope",
  ]);
  assert.equal(RESEARCH_LAB_EXPORT_LIMITATIONS.viewLocalControlsIncluded, false);
  assert.ok(
    RESEARCH_LAB_EXPORT_LIMITATIONS.omittedViewLocalControlKinds.includes(
      "threshold",
    ),
  );
  assert.ok(
    RESEARCH_LAB_EXPORT_LIMITATIONS.omittedViewLocalControlKinds.includes(
      "instrument-selection",
    ),
  );
  assert.match(
    RESEARCH_LAB_EXPORT_LIMITATIONS.note,
    /View-local thresholds, metrics, selections and display positions are not included/,
  );
  assert.match(
    labDataSource,
    /exportLimitations:\s*RESEARCH_LAB_EXPORT_LIMITATIONS/,
  );
  assert.match(labSource, /Export view dataset/);
  assert.match(labSource, /Research view dataset exported\./);
  assert.doesNotMatch(labSource, /Current Research Lab data exported\./);
});

test("partial-corpus genome observations remain unknown rather than false zeroes", () => {
  assert.match(labDataSource, /ResearchConceptMeasurementState/);
  assert.match(labDataSource, /["']observed-complete["']/);
  assert.match(labDataSource, /["']unknown-partial["']/);
  assert.match(labSource, /["']observed-partial["']/);
  assert.match(labSource, /recorded positive counts are lower bounds/);
  assert.match(labSource, /Count = recorded lower bound in a selected or partial corpus/);
  assert.match(labSource, /N\/A = unrecorded absence or normalization unavailable/);
  assert.match(labSource, /unknown(?: rather than|, not) zero/);
  assert.match(labStyles, /\.heatCell\[data-availability=["']unknown["']\]/);
  assert.match(
    labStyles,
    /\.heatCell\[data-availability=["']observed-partial["']\]/,
  );
  assert.match(labDataSource, /buildResearchLabExportPayload/);
  assert.match(labSource, /Copy link/);
  assert.match(labSource, /Export view dataset/);
});

test("Genome exports partial positive mappings as raw-count lower bounds only", () => {
  const completeInstrument = {
    id: "complete",
    coverageClass: "complete",
    conceptMeasurementState: "observed-complete",
  };
  const partialInstrument = {
    id: "partial",
    coverageClass: "selected",
    conceptMeasurementState: "unknown-partial",
  };
  const fingerprint = (instrumentId, measurementState) => ({
    instrumentId,
    measurementState,
    coverageClass: measurementState === "observed-complete" ? "complete" : "selected",
    coverageMode: "fixture",
    includedInDefaultAnalysis: measurementState === "observed-complete",
    denominatorProvisionCount: 0,
    conceptAssignmentCount: 0,
    mappedConceptCount: 0,
    weights: [],
  });
  const data = {
    snapshotDate: "2026-07-20",
    methodology: {},
    instruments: [completeInstrument, partialInstrument],
    provisions: [
      {
        id: "complete-1",
        instrumentId: "complete",
        relevance: "substantive-topic",
        conceptIds: ["c1"],
      },
      {
        id: "partial-1",
        instrumentId: "partial",
        relevance: "substantive-topic",
        conceptIds: ["c1"],
      },
    ],
    concepts: [
      { id: "c1", label: "Recorded" },
      { id: "c2", label: "Unrecorded" },
    ],
    themes: [],
    fingerprints: [
      fingerprint("complete", "observed-complete"),
      fingerprint("partial", "unknown-partial"),
    ],
  };

  const payload = buildResearchLabExportPayload(data, {
    phase: "patterns",
    view: "genome",
    coverageScope: "all",
    relevanceScope: "substantive",
  });
  const partial = payload.viewData.data.fingerprints.find(
    (item) => item.instrumentId === "partial",
  );
  const recorded = partial.weights.find((weight) => weight.conceptId === "c1");
  const unrecorded = partial.weights.find((weight) => weight.conceptId === "c2");

  assert.equal(payload.schemaVersion, "research-lab-view-export.v2");
  assert.equal(recorded.rawCount, 1);
  assert.equal(recorded.rawCountState, "observed-partial-lower-bound");
  assert.equal(recorded.prevalence, null);
  assert.equal(recorded.tfidf, null);
  assert.equal(recorded.normalizedTfidf, null);
  assert.equal(unrecorded.rawCount, null);
  assert.equal(unrecorded.rawCountState, "unknown-unobserved");
  assert.deepEqual(payload.sample.viewScope, payload.viewData.scope);
});

test("every exported view declares its actual per-view scope", () => {
  const data = {
    snapshotDate: "2026-07-20",
    methodology: {},
    instruments: [
      {
        id: "complete",
        coverageClass: "complete",
        conceptMeasurementState: "observed-complete",
      },
      {
        id: "partial",
        coverageClass: "selected",
        conceptMeasurementState: "unknown-partial",
      },
    ],
    provisions: [],
    lifecycleLanes: [
      { instrumentId: "complete" },
      { instrumentId: "partial" },
    ],
  };
  const payload = buildResearchLabExportPayload(data, {
    phase: "patterns",
    view: "timeline",
    coverageScope: "complete",
    relevanceScope: "substantive",
  });

  assert.deepEqual(payload.sample.displayedInstrumentIds, ["complete"]);
  assert.deepEqual(payload.viewData.scope.instrumentIds, ["complete", "partial"]);
  assert.equal(payload.viewData.scope.basis, "all-recorded-instruments");
  assert.equal(payload.viewData.scope.coverageScopeApplied, false);
  assert.deepEqual(payload.sample.viewScope, payload.viewData.scope);
  assert.equal(payload.viewData.data.length, 2);
});
