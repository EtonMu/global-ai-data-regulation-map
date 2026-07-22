import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { deriveTranslationIntegrity } from "../app/research-lab-data.ts";

const appRoot = new URL("../app/", import.meta.url);
const dataRoot = new URL("../data/v2/", import.meta.url);

const [labSource, labDataSource, labStyles, coverage, relations] =
  await Promise.all([
    readFile(new URL("research-lab.tsx", appRoot), "utf8"),
    readFile(new URL("research-lab-data.ts", appRoot), "utf8"),
    readFile(new URL("research-lab.module.css", appRoot), "utf8"),
    readFile(new URL("english-corpus-coverage.json", dataRoot), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("relations.json", dataRoot), "utf8").then(JSON.parse),
  ]);

const phaseTwoViews = [
  ["translation", "Translation Coverage & Authority"],
  ["bridges", "Qualified Bridge Atlas"],
  ["pathways", "Operationalization Paths"],
];

test("Phase 2 is a distinct, accessible research phase", () => {
  assert.match(labSource, /type ResearchLabPhase\s*=\s*["']patterns["']\s*\|\s*["']relations["']/);
  assert.match(labSource, /Phase 02/);
  assert.match(labSource, /Provenance \+ relations/);
  assert.match(labSource, /aria-label=["']Research phase["']/);
  assert.match(labSource, /aria-pressed=\{activePhase === ["']relations["']\}/);
  for (const [id, label] of phaseTwoViews) {
    assert.match(labSource, new RegExp(`id:\\s*["']${id}["']`));
    assert.match(labSource, new RegExp(label.replaceAll(" ", "\\s+")));
    assert.match(labSource, new RegExp(`activeView === ["']${id}["']`));
  }
});

test("translation integrity keeps coverage, authority, and temporal alignment separate", () => {
  assert.equal(coverage.totals.corpusCount, 22);
  assert.equal(coverage.totals.totalUnitCount, 1346);
  assert.equal(coverage.totals.storedEnglishUnitCount, 1346);
  assert.equal(coverage.totals.currentAlignedEnglishUnitCount, 1341);
  assert.equal(coverage.totals.temporallyMismatchedEnglishUnitCount, 5);
  assert.equal(coverage.totals.missingEnglishUnitCount, 0);

  for (const authorityClass of [
    "official-text",
    "official-reference",
    "government-reference",
    "project-reference",
    "other-reference",
  ]) {
    assert.match(labDataSource, new RegExp(`["']${authorityClass}["']`));
  }
  assert.match(labDataSource, /export function deriveTranslationIntegrity\(/);
  assert.match(labSource, /Translation Coverage &amp; Authority/);
  assert.match(labSource, /Stored English text is not a translation-quality finding/);
  assert.doesNotMatch(labSource, /translation quality score|semantic drift score/i);
  assert.match(labSource, /onOpenProvision\(provisionId\)/);
});

test("translation integrity resolves legacy Vietnam corpus IDs to registry IDs", () => {
  const legacyInstrumentId = "vn-decree-356-2025";
  const registryInstrumentId = "vn-pdpl-implementing-decree-356-2025";
  const integrity = deriveTranslationIntegrity({
    englishCorpusCoverage: {
      schemaVersion: "fixture",
      reviewedOn: "2026-07-20",
      scope: "Fixture coverage.",
      totals: {
        corpusCount: 1,
        totalUnitCount: 1,
        storedEnglishUnitCount: 1,
        currentAlignedEnglishUnitCount: 0,
        temporallyMismatchedEnglishUnitCount: 1,
        missingEnglishUnitCount: 0,
        completionPercent: 100,
        currentAlignedPercent: 0,
      },
      corpora: [
        {
          instrumentId: legacyInstrumentId,
          sourceInstrumentId: legacyInstrumentId,
          corpusFile: "fixture.json",
          originalLanguages: ["vi"],
          totalUnitCount: 1,
          storedEnglishUnitCount: 1,
          currentAlignedEnglishUnitCount: 0,
          temporallyMismatchedEnglishUnitCount: 1,
          missingEnglishUnitCount: 0,
          completionPercent: 100,
          coverageStatus: "complete-stored-english-with-version-boundaries",
          translationStatuses: ["project-authored-reference"],
          unitCoverageStatuses: ["future-phase"],
          versionLabels: ["fixture"],
          englishSourceRecords: [],
          missingUnitIds: [],
          missingCoverageStatuses: [],
        },
      ],
    },
    provisions: [
      {
        id: "vn-fixture-art-1",
        instrumentId: registryInstrumentId,
        locator: "Article 1",
        title: "Fixture",
        conceptIds: [],
        translations: {
          en: {
            status: "project-authored-reference",
            coverageStatus: "future-phase",
          },
        },
      },
    ],
  });

  assert.equal(integrity.corpora[0].instrumentId, registryInstrumentId);
  assert.equal(integrity.corpora[0].sourceInstrumentId, legacyInstrumentId);
  assert.deepEqual(integrity.corpora[0].anomalyProvisionIds, [
    "vn-fixture-art-1",
  ]);
});

test("bridge metrics separate reviewed evidence from candidate sensitivity", () => {
  const analytical = relations.filter(
    (relation) => (relation.relationClass ?? "analytical") === "analytical",
  );
  assert.equal(analytical.length, 71);
  assert.equal(
    analytical.filter((relation) => relation.status === "editorial-reviewed")
      .length,
    25,
  );
  assert.equal(
    analytical.filter((relation) => relation.status === "candidate").length,
    46,
  );
  assert.match(labDataSource, /export function deriveQualifiedBridgeAtlas\(/);
  assert.match(labDataSource, /function normalizedBetweenness\(/);
  assert.match(labDataSource, /reviewedBetweenness/);
  assert.match(labDataSource, /allBetweenness/);
  assert.match(labDataSource, /reviewedRank/);
  assert.match(labDataSource, /allRank/);
  assert.match(labSource, /Candidate-edge sensitivity/);
  assert.match(labSource, /Reviewed-subgraph betweenness/);
  assert.match(labSource, /Recorded-relation graph betweenness/);
  assert.match(labDataSource, /reviewed subgraph or recorded-relation graph/);
  assert.match(labSource, /not global legal influence/i);
  assert.doesNotMatch(labSource, /global influence score|regulatory importance score/i);
});

test("operational paths preserve only recorded directed relation semantics", () => {
  const directed = relations.filter(
    (relation) => relation.directionality === "directed",
  );
  assert.equal(directed.length, 16);
  assert.equal(
    directed.filter((relation) => relation.status === "editorial-reviewed").length,
    13,
  );
  assert.equal(
    directed.filter((relation) => relation.status === "candidate").length,
    3,
  );
  for (const type of [
    "implements",
    "operationalizes",
    "grounded-in",
    "elaborates",
    "supports-operational-evidence",
    "policy-transition",
    "repeals",
    "repeals-and-reenacts",
  ]) {
    assert.match(labDataSource, new RegExp(`["']${type}["']`));
  }
  assert.match(labDataSource, /relation\.directionality === ["']directed["']/);
  assert.match(labDataSource, /relationIds\.length >= 3/);
  assert.match(labSource, /does not[\s\S]{0,100}prove temporal influence/i);
  assert.match(labSource, /Undirected partial-overlap[\s\S]{0,120}intentionally excluded/i);
});

test("relation dossiers expose rationale, limits, endpoints, concepts, and sources together", () => {
  assert.match(labSource, /function RelationEvidenceDossier\(/);
  assert.match(labSource, /Why the link is recorded/);
  assert.match(labSource, /Limits on inference/);
  assert.match(labSource, /relation\.rationale/);
  assert.match(labSource, /relation\.limits/);
  assert.match(labSource, /relation\.sourceSupport\.map/);
  assert.match(labSource, /onOpenProvision\(endpoint\.id\)/);
  assert.match(labSource, /onOpenInstrument\(endpoint\.instrumentId\)/);
  assert.match(labSource, /onOpenConcept\(concept\.id\)/);
});

test("Regulatory Genome names concept columns and uses a local horizontal scroller", () => {
  const genomeHeader = labSource.match(
    /className=\{classNames\(styles\.genomeRow, styles\.genomeHeader\)\}([\s\S]*?)\n\s*<\/div>\n\n\s*\{instruments\.map/,
  )?.[1];
  assert.ok(genomeHeader, "the genome header block must be inspectable");
  assert.match(genomeHeader, /concept\.label/);
  assert.doesNotMatch(genomeHeader, /padStart\(2, ["']0["']\)/);
  assert.match(labSource, /styles\.genomeScroll/);
  assert.match(labSource, /aria-label=["']Scrollable regulatory genome matrix["']/);
  assert.match(labStyles, /\.genomeFigure\s*\{[\s\S]*?min-inline-size:\s*2780px/);
  assert.match(labStyles, /\.genomeScroll\s*\{[\s\S]*?scrollbar-width:\s*auto/);
  assert.match(
    labStyles,
    /grid-template-columns:[\s\S]{0,180}repeat\(23,\s*minmax\(104px,\s*1fr\)\)/,
  );
});

test("Phase 2 layouts reflow without page-level clipping", () => {
  assert.match(labStyles, /@container \(max-width:\s*760px\)/);
  assert.match(
    labStyles,
    /\.bridgeWorkspace,[\s\S]{0,100}\.relationWorkbench\s*\{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(labStyles, /\.translationRow\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(labStyles, /\.pathLaneScroll\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(labStyles, /\.endpointPair\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(labStyles, /@media \(prefers-reduced-motion:\s*reduce\)/);
});
