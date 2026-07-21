"use client";

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  Clock3,
  Database,
  Dna,
  Download,
  GitFork,
  Grid3X3,
  Info,
  Languages,
  Link2,
  ListChecks,
  Network,
  Pause,
  Play,
  ScanSearch,
  Rows3,
  RotateCcw,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import { ConceptIcon } from "./concept-icon";
import {
  buildResearchLabExportPayload,
  buildResearchLabShareHash,
} from "./research-lab-data";
import type {
  ResearchConceptDatum as ResearchLabConcept,
  ResearchInstrumentDatum as ResearchLabInstrument,
  ResearchLabData,
  ResearchProvisionDatum as ResearchLabProvision,
  ResearchThemeDatum as ResearchLabTheme,
} from "./research-lab-data";
import { JurisdictionMark } from "./jurisdiction-mark";
import styles from "./research-lab.module.css";

export type { ResearchLabData } from "./research-lab-data";

export type ResearchLabView =
  | "observatory"
  | "genome"
  | "morphology"
  | "grammar"
  | "timeline"
  | "translation"
  | "bridges"
  | "pathways"
  | "archetypes"
  | "audit"
  | "horizon"
  | "microscope"
  | "neighborhoods"
  | "granularity";

export type ResearchCoverageScope = "all" | "complete";
export type ResearchRelevanceScope = "substantive" | "all";

type ResearchLabPhase = "patterns" | "relations" | "models" | "dynamics";

const researchPhaseOrder: ResearchLabPhase[] = [
  "patterns",
  "relations",
  "models",
  "dynamics",
];

export type ResearchLabProps = {
  data: ResearchLabData;
  initialView?: ResearchLabView;
  initialCoverageScope?: ResearchCoverageScope;
  initialRelevanceScope?: ResearchRelevanceScope;
  defaultInstrumentIds?: string[];
  onViewChange?: (view: ResearchLabView) => void;
  onCoverageScopeChange?: (scope: ResearchCoverageScope) => void;
  onRelevanceScopeChange?: (scope: ResearchRelevanceScope) => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provisionId: string) => void;
  onOpenConcept: (conceptId: string) => void;
};

type CoverageScope = ResearchCoverageScope;
type RelevanceScope = ResearchRelevanceScope;
type GenomeMetric = "tfidf" | "prevalence" | "count";
type GrammarMetric =
  | "normalizedPmi"
  | "pmi"
  | "lift"
  | "jaccard"
  | "count";
type VisualStyle = CSSProperties & Record<`--${string}`, string | number>;

type FingerprintCell = {
  count: number;
  prevalence: number;
  tfidf: number;
};

type GrammarPair = {
  leftConceptId: string;
  rightConceptId: string;
  provisionCount: number;
  instrumentCount: number;
  jurisdictionCount: number;
  expectedCount: number;
  lift: number | null;
  pmi: number | null;
  normalizedPmi: number | null;
  jaccard: number | null;
};

type LifecycleEventCategory =
  | "formation"
  | "commencement"
  | "amendment"
  | "cessation"
  | "milestone";

type ActiveLifecycleEvent = {
  instrumentId: string;
  event: ResearchLabData["lifecycleLanes"][number]["events"][number];
};

const formatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const themeColors = [
  "var(--cyan)",
  "var(--violet)",
  "var(--amber)",
  "var(--green)",
  "var(--red)",
  "color-mix(in srgb, var(--cyan) 48%, var(--green))",
  "color-mix(in srgb, var(--violet) 55%, var(--red))",
] as const;

const lifecycleEventCategories: Record<string, LifecycleEventCategory> = {
  adopted: "formation",
  "advisory-body-convened": "milestone",
  amended: "amendment",
  "amending-act-enacted": "amendment",
  "amending-regulation-final-adoption-pending-publication": "amendment",
  "amendment-effective": "amendment",
  "amendment-promulgated-not-commenced": "amendment",
  "amendment-promulgated-partly-effective": "amendment",
  "amendment-wave-effective": "amendment",
  "approved-by-chamber": "formation",
  "assented-and-effective": "commencement",
  "compilation-current": "milestone",
  "constitutional-court-interpretation": "milestone",
  "consultation-opened": "formation",
  "corrigendum-published": "amendment",
  "current-version-verified": "milestone",
  "declaration-agreed": "formation",
  domesticated: "formation",
  effective: "commencement",
  enacted: "formation",
  enrolled: "formation",
  "entered-into-force": "commencement",
  "framework-endorsed": "formation",
  "fully-effective": "commencement",
  "general-application": "commencement",
  "grace-period-ended": "commencement",
  introduced: "formation",
  issued: "formation",
  lapsed: "cessation",
  "last-amended-in-consolidation": "amendment",
  launched: "formation",
  "open-sourced": "milestone",
  "partial-application": "commencement",
  "partial-commencement": "commencement",
  "participant-joined": "milestone",
  "pilot-launched": "milestone",
  "presidential-assent": "formation",
  "principles-endorsed": "formation",
  promulgated: "formation",
  "promulgated-and-effective": "commencement",
  "promulgated-partly-effective": "commencement",
  "proposal-closed": "cessation",
  "provision-application": "commencement",
  published: "formation",
  "published-partial-commencement": "commencement",
  "recommendation-adopted": "formation",
  "recommendation-amended": "amendment",
  "regulation-effective": "commencement",
  released: "formation",
  "renamed-framework-effective": "amendment",
  repealed: "cessation",
  "report-published": "formation",
  revoked: "cessation",
  "royal-assent": "formation",
  "scheduled-amendment-effective": "amendment",
  "scheduled-general-application": "commencement",
  "scheduled-general-commencement": "commencement",
  "scheduled-partial-application": "commencement",
  "scheduled-partial-commencement": "commencement",
  signed: "formation",
  "standard-published": "formation",
  "statutory-latest-commencement-deadline": "commencement",
  superseded: "cessation",
  "transition-ended": "commencement",
  "version-effective": "commencement",
  "version-released": "formation",
  vetoed: "cessation",
  "white-paper-published": "formation",
};

const viewDefinitions: Array<{
  id: ResearchLabView;
  label: string;
  icon: LucideIcon;
  phase: ResearchLabPhase;
}> = [
  {
    id: "observatory",
    label: "Corpus Observatory",
    icon: Database,
    phase: "patterns",
  },
  { id: "genome", label: "Regulatory Genome", icon: Dna, phase: "patterns" },
  {
    id: "morphology",
    label: "Comparative Morphology",
    icon: Rows3,
    phase: "patterns",
  },
  {
    id: "grammar",
    label: "Regulatory Grammar",
    icon: Grid3X3,
    phase: "patterns",
  },
  {
    id: "timeline",
    label: "Global Time Machine",
    icon: Clock3,
    phase: "patterns",
  },
  {
    id: "translation",
    label: "Translation Coverage & Authority",
    icon: Languages,
    phase: "relations",
  },
  {
    id: "bridges",
    label: "Qualified Bridge Atlas",
    icon: Network,
    phase: "relations",
  },
  {
    id: "pathways",
    label: "Operationalization Paths",
    icon: GitFork,
    phase: "relations",
  },
  {
    id: "archetypes",
    label: "Instrument Archetypes",
    icon: Waypoints,
    phase: "models",
  },
  {
    id: "audit",
    label: "Mapping Evidence Audit",
    icon: ListChecks,
    phase: "models",
  },
  {
    id: "horizon",
    label: "Applicability Horizon",
    icon: CalendarRange,
    phase: "dynamics",
  },
  {
    id: "microscope",
    label: "Article Concept Microscope",
    icon: ScanSearch,
    phase: "dynamics",
  },
  {
    id: "neighborhoods",
    label: "Neighborhood Stability",
    icon: Waypoints,
    phase: "dynamics",
  },
  {
    id: "granularity",
    label: "Granularity + Corpus Bias",
    icon: ChartNoAxesColumnIncreasing,
    phase: "dynamics",
  },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(value.getTime()) ? date : dateFormatter.format(value);
}

function humanizeResearchCode(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function isCompleteInstrument(instrument: ResearchLabInstrument) {
  return instrument.coverageClass.toLowerCase().includes("complete");
}

function conceptColor(
  concept: ResearchLabConcept,
  themes: ResearchLabTheme[],
) {
  const themeId = concept.themeId;
  const themeIndex = Math.max(
    0,
    [...themes]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .findIndex((theme) => theme.id === themeId),
  );
  return themeColors[themeIndex % themeColors.length];
}

function conceptStyle(
  concept: ResearchLabConcept,
  themes: ResearchLabTheme[],
): VisualStyle {
  return { "--concept-color": conceptColor(concept, themes) };
}

function instrumentMatchesCoverage(
  instrument: ResearchLabInstrument,
  coverageScope: CoverageScope,
) {
  return coverageScope === "all" || isCompleteInstrument(instrument);
}

function provisionMatchesScope(
  provision: ResearchLabProvision,
  relevanceScope: RelevanceScope,
) {
  return (
    relevanceScope === "all" || provision.relevance === "substantive-topic"
  );
}

function pairKey(leftConceptId: string, rightConceptId: string) {
  return [leftConceptId, rightConceptId].sort().join("::");
}

function buildGrammarPairs(
  provisions: ResearchLabProvision[],
  concepts: ResearchLabConcept[],
  instruments: ResearchLabInstrument[],
  relevanceScope: RelevanceScope,
): GrammarPair[] {
  const relevant = provisions.filter((provision) =>
    provisionMatchesScope(provision, relevanceScope),
  );
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const frequencies = new Map<string, number>();
  const pairCounts = new Map<string, number>();
  const pairInstrumentIds = new Map<string, Set<string>>();
  const pairJurisdictionIds = new Map<string, Set<string>>();
  const jurisdictionByInstrument = new Map(
    instruments.map((instrument) => [instrument.id, instrument.jurisdictionId]),
  );

  for (const provision of relevant) {
    const ids = [...new Set(provision.conceptIds.filter((id) => conceptIds.has(id)))];
    for (const id of ids) frequencies.set(id, (frequencies.get(id) ?? 0) + 1);
    for (let leftIndex = 0; leftIndex < ids.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < ids.length; rightIndex += 1) {
        const key = pairKey(ids[leftIndex], ids[rightIndex]);
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
        const instrumentIds = pairInstrumentIds.get(key) ?? new Set<string>();
        instrumentIds.add(provision.instrumentId);
        pairInstrumentIds.set(key, instrumentIds);
        const jurisdictionId = jurisdictionByInstrument.get(
          provision.instrumentId,
        );
        if (jurisdictionId) {
          const jurisdictionIds =
            pairJurisdictionIds.get(key) ?? new Set<string>();
          jurisdictionIds.add(jurisdictionId);
          pairJurisdictionIds.set(key, jurisdictionIds);
        }
      }
    }
  }

  const documentCount = Math.max(1, relevant.length);
  const pairs: GrammarPair[] = [];
  for (let leftIndex = 0; leftIndex < concepts.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < concepts.length;
      rightIndex += 1
    ) {
      const leftConceptId = concepts[leftIndex].id;
      const rightConceptId = concepts[rightIndex].id;
      const leftCount = frequencies.get(leftConceptId) ?? 0;
      const rightCount = frequencies.get(rightConceptId) ?? 0;
      const provisionCount =
        pairCounts.get(pairKey(leftConceptId, rightConceptId)) ?? 0;
      const instrumentCount =
        pairInstrumentIds.get(pairKey(leftConceptId, rightConceptId))?.size ?? 0;
      const jurisdictionCount =
        pairJurisdictionIds.get(pairKey(leftConceptId, rightConceptId))?.size ??
        0;
      const expectedCount = (leftCount * rightCount) / documentCount;
      const lift =
        leftCount && rightCount
          ? (provisionCount * documentCount) / (leftCount * rightCount)
          : null;
      const pmi = lift && lift > 0 ? Math.log2(lift) : null;
      const jointProbability = provisionCount / documentCount;
      const normalizedPmi =
        pmi !== null && jointProbability > 0 && jointProbability < 1
          ? pmi / -Math.log2(jointProbability)
          : null;
      const unionCount = leftCount + rightCount - provisionCount;

      pairs.push({
        leftConceptId,
        rightConceptId,
        provisionCount,
        instrumentCount,
        jurisdictionCount,
        expectedCount,
        lift,
        pmi,
        normalizedPmi,
        jaccard: unionCount ? provisionCount / unionCount : null,
      });
    }
  }
  return pairs;
}

function metricValue(pair: GrammarPair, metric: GrammarMetric): number | null {
  if (metric === "count") return pair.provisionCount;
  return pair[metric];
}

function formatMetric(
  value: number | null,
  metric: GenomeMetric | GrammarMetric,
) {
  if (value === null || !Number.isFinite(value)) return "N/A";
  if (metric === "count") return formatter.format(value);
  return value.toFixed(2);
}

function metricBaseline(metric: GrammarMetric) {
  return metric === "lift" ? 1 : 0;
}

function metricDirection(value: number | null, metric: GrammarMetric) {
  if (value === null) return "none";
  const delta = value - metricBaseline(metric);
  if (Math.abs(delta) < 1e-9) return "neutral";
  return delta > 0 ? "positive" : "negative";
}

function metricVisualScore(pair: GrammarPair, metric: GrammarMetric) {
  const value = metricValue(pair, metric);
  if (value === null) return null;
  if (metric === "lift") return value > 0 ? Math.log2(value) : null;
  return value;
}

function lifecycleEventCategory(type: string): LifecycleEventCategory {
  return lifecycleEventCategories[type] ?? "milestone";
}

function lifecycleEventColor(category: LifecycleEventCategory) {
  if (category === "formation") return "var(--violet)";
  if (category === "commencement") return "var(--green)";
  if (category === "amendment") return "var(--amber)";
  if (category === "cessation") return "var(--red)";
  return "var(--cyan)";
}

function MetricRow({
  label,
  value,
  total,
  color = "var(--cyan)",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const percentage = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricName}>{label}</span>
      <span
        className={styles.metricTrack}
        role="img"
        aria-label={`${label}: ${formatter.format(value)} of ${formatter.format(total)}`}
      >
        <span
          className={styles.metricFill}
          style={
            {
              "--metric-width": `${percentage}%`,
              "--metric-color": color,
            } as VisualStyle
          }
        />
      </span>
      <span className={styles.metricValue}>{formatter.format(value)}</span>
    </div>
  );
}

function CoverageControl({
  value,
  onChange,
}: {
  value: CoverageScope;
  onChange: (value: CoverageScope) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>Corpus coverage</span>
      <select
        aria-label="Corpus coverage"
        value={value}
        onChange={(event) => onChange(event.target.value as CoverageScope)}
      >
        <option value="complete">Complete corpus only</option>
        <option value="all">All indexed instruments</option>
      </select>
    </label>
  );
}

function RelevanceControl({
  value,
  onChange,
}: {
  value: RelevanceScope;
  onChange: (value: RelevanceScope) => void;
}) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.fieldLabel}>Relevance scope</legend>
      <span className={styles.radioGroup}>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name="research-relevance"
            checked={value === "substantive"}
            onChange={() => onChange("substantive")}
          />
          <span>Substantive provisions</span>
        </label>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name="research-relevance"
            checked={value === "all"}
            onChange={() => onChange("all")}
          />
          <span>All records · structural + unreviewed</span>
        </label>
      </span>
    </fieldset>
  );
}

function MethodNote({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.methodNote} aria-label="Methodology note">
      <Info aria-hidden="true" />
      <div>
        <span className={styles.methodLabel}>Methodology constraint</span>
        <div>{children}</div>
      </div>
    </aside>
  );
}

function relationEndpointLabel(
  endpoint: ResearchLabData["relations"][number]["source"],
  data: ResearchLabData,
) {
  if (endpoint.type === "provision") {
    const provision = data.provisions.find((item) => item.id === endpoint.id);
    const instrument = data.instruments.find(
      (item) => item.id === provision?.instrumentId,
    );
    if (provision) {
      return `${instrument?.shortTitle ?? provision.instrumentId} · ${provision.locator} · ${provision.title}`;
    }
  }
  const instrument = data.instruments.find((item) => item.id === endpoint.id);
  return instrument?.title ?? endpoint.id;
}

function RelationEvidenceDossier({
  relation,
  data,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  relation: ResearchLabData["relations"][number] | null;
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  function openEndpoint(
    endpoint: ResearchLabData["relations"][number]["source"],
  ) {
    if (endpoint.type === "provision") onOpenProvision(endpoint.id);
    else if (endpoint.instrumentId) onOpenInstrument(endpoint.instrumentId);
  }

  if (!relation) {
    return (
      <section className={styles.evidenceDossier} aria-label="Relation evidence">
        <div className={styles.emptyState}>
          Select a recorded relation to inspect its rationale, limits and source
          support.
        </div>
      </section>
    );
  }

  const directed = relation.directionality === "directed";
  const DirectionIcon = directed ? ArrowRight : ArrowLeftRight;

  return (
    <section className={styles.evidenceDossier} aria-label="Relation evidence">
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionCode}>Evidence dossier</span>
          <h3>{humanizeResearchCode(relation.type)}</h3>
        </div>
        <p>
          {humanizeResearchCode(relation.status)} · {relation.confidence} editorial
          confidence in research utility · verified {relation.verifiedOn}
        </p>
      </header>

      <div className={styles.endpointPair}>
        <button
          type="button"
          className={styles.endpointButton}
          onClick={() => openEndpoint(relation.source)}
        >
          <span className={styles.fieldLabel}>
            {directed ? "Source endpoint" : "Endpoint A"}
          </span>
          <strong>{relationEndpointLabel(relation.source, data)}</strong>
        </button>
        <DirectionIcon aria-hidden="true" />
        <button
          type="button"
          className={styles.endpointButton}
          onClick={() => openEndpoint(relation.target)}
        >
          <span className={styles.fieldLabel}>
            {directed ? "Target endpoint" : "Endpoint B"}
          </span>
          <strong>{relationEndpointLabel(relation.target, data)}</strong>
        </button>
      </div>

      <div className={styles.rationaleGrid}>
        <section>
          <span className={styles.fieldLabel}>Why the link is recorded</span>
          <p>{relation.rationale}</p>
        </section>
        <section>
          <span className={styles.fieldLabel}>Limits on inference</span>
          <p>{relation.limits}</p>
        </section>
      </div>

      {relation.conceptIds.length > 0 && (
        <div className={styles.conceptLinkRow} aria-label="Relation concepts">
          {relation.conceptIds.map((conceptId) => {
            const concept = data.concepts.find((item) => item.id === conceptId);
            if (!concept) return null;
            return (
              <button
                type="button"
                key={concept.id}
                className={styles.conceptLink}
                style={conceptStyle(concept, data.themes)}
                onClick={() => onOpenConcept(concept.id)}
              >
                <ConceptIcon conceptId={concept.id} />
                <span>{concept.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.sourceLedger}>
        <span className={styles.fieldLabel}>
          {relation.sourceSupport.length} source records · {humanizeResearchCode(relation.evidenceBasis)}
        </span>
        {relation.sourceSupport.map((source) => (
          <a
            key={`${relation.id}-${source.url}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            {source.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function CorpusObservatory({
  data,
  onOpenInstrument,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
}) {
  const coverage = data.coverage.summary;
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const caveats = [
    "Raw concept counts describe this corpus; they do not measure regulatory strength or enforcement intensity.",
    "A missing match in a selected or partial corpus means unknown coverage, not absence of law.",
    ...data.coverage.caveats.map(
      (caveat) => `${caveat.title}: ${caveat.detail}`,
    ),
  ].filter((value, index, values) => values.indexOf(value) === index);

  const qualityRows = [
    {
      label: "Complete local corpora",
      count: coverage.completeInstrumentCount,
      total: coverage.instrumentCount,
      note: "Suitable for within-document distribution analysis",
      color: "var(--green)",
    },
    {
      label: "Selected / partial corpora",
      count: coverage.selectedInstrumentCount,
      total: coverage.instrumentCount,
      note: "Coverage mask required for cross-instrument comparison",
      color: "var(--amber)",
    },
    {
      label: "Reviewed relations",
      count: coverage.reviewedRelationCount,
      total: coverage.relationCount,
      note: "Human-reviewed cross-source mappings",
      color: "var(--cyan)",
    },
    {
      label: "Candidate relations",
      count: coverage.candidateRelationCount,
      total: coverage.relationCount,
      note: "Analytical leads, not verified equivalence",
      color: "var(--violet)",
    },
  ];

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>01 / Corpus integrity</span>
          <h2>Corpus Observatory</h2>
          <p>
            Inspect scope, completeness and review status before interpreting any
            comparative result.
          </p>
        </div>
      </header>

      <div className={styles.statsGrid} aria-label="Corpus summary">
        <article className={styles.stat}>
          <span className={styles.statLabel}>Jurisdictions</span>
          <strong className={styles.statValue}>
            {formatter.format(coverage.jurisdictionCount)}
          </strong>
          <span className={styles.statMeta}>authority contexts represented</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Instruments</span>
          <strong className={styles.statValue}>
            {formatter.format(coverage.instrumentCount)}
          </strong>
          <span className={styles.statMeta}>binding, proposed and soft-law sources</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Provision records</span>
          <strong className={styles.statValue}>
            {formatter.format(coverage.provisionCount)}
          </strong>
          <span className={styles.statMeta}>
            {formatter.format(coverage.substantiveProvisionCount)} substantive
          </span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Core concepts</span>
          <strong className={styles.statValue}>
            {formatter.format(coverage.conceptCount)}
          </strong>
          <span className={styles.statMeta}>
            across {formatter.format(coverage.themeCount)} research themes
          </span>
        </article>
      </div>

      <div className={styles.observatoryGrid}>
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Coverage architecture</span>
              <h3>What can be compared safely?</h3>
            </div>
          </header>
          <div className={styles.metricList}>
            <MetricRow
              label="Complete instruments"
              value={coverage.completeInstrumentCount}
              total={coverage.instrumentCount}
              color="var(--green)"
            />
            <MetricRow
              label="Selected instruments"
              value={coverage.selectedInstrumentCount}
              total={coverage.instrumentCount}
              color="var(--amber)"
            />
            <MetricRow
              label="Substantive provisions"
              value={coverage.substantiveProvisionCount}
              total={coverage.provisionCount}
            />
            <MetricRow
              label="Structural context"
              value={coverage.structuralContextCount}
              total={coverage.provisionCount}
              color="var(--violet)"
            />
            {coverage.unreviewedProvisionCount > 0 && (
              <MetricRow
                label="Unreviewed provisions"
                value={coverage.unreviewedProvisionCount}
                total={coverage.provisionCount}
                color="var(--red)"
              />
            )}
            <MetricRow
              label="Reviewed relations"
              value={coverage.reviewedRelationCount}
              total={coverage.relationCount}
              color="var(--green)"
            />
          </div>
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Interpretation rules</span>
              <h3>Epistemic guardrails</h3>
            </div>
          </header>
          <ul className={styles.caveatList}>
            {caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Audit ledger</span>
            <h3>Coverage and relation status</h3>
          </div>
          <p>{formatter.format(coverage.sourceAuditCount)} source-audit records</p>
        </header>
        <div className={styles.qualityTableWrap}>
          <table className={styles.qualityTable}>
            <thead>
              <tr>
                <th>Research layer</th>
                <th>Interpretation</th>
                <th>Records</th>
              </tr>
            </thead>
            <tbody>
              {qualityRows.map((row) => (
                <tr key={row.label}>
                  <td>
                    <span
                      className={styles.statusMark}
                      style={{ "--status-color": row.color } as VisualStyle}
                    >
                      {row.label}
                    </span>
                  </td>
                  <td>{row.note}</td>
                  <td>
                    {formatter.format(row.count)} / {formatter.format(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Instrument audit</span>
            <h3>Corpus coverage ledger</h3>
          </div>
          <p>{data.coverage.instruments.length} source-level records</p>
        </header>
        <div className={styles.qualityTableWrap}>
          <table className={styles.qualityTable}>
            <thead>
              <tr>
                <th>Legal source</th>
                <th>Corpus mode</th>
                <th>Review</th>
                <th>English text</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.instruments.map((audit) => {
                const instrument = instrumentById.get(audit.instrumentId);
                if (!instrument) return null;
                return (
                  <tr key={audit.instrumentId}>
                    <td>
                      <button
                        type="button"
                        className={styles.auditInstrumentButton}
                        onClick={() => onOpenInstrument(instrument.id)}
                      >
                        <JurisdictionMark
                          jurisdictionId={instrument.jurisdictionId}
                          small
                        />
                        <span>
                          <strong>{instrument.shortTitle}</strong>
                          <small>{instrument.jurisdictionName}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {humanizeResearchCode(audit.coverageMode)}
                    </td>
                    <td>
                      {humanizeResearchCode(audit.reviewLevel)}
                    </td>
                    <td>
                      {audit.englishStatus
                        ? humanizeResearchCode(audit.englishStatus)
                        : "Not recorded"}
                    </td>
                    <td>{formatter.format(audit.localUnitCount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function RegulatoryGenome({
  data,
  coverageScope,
  relevanceScope,
  onCoverageChange,
  onRelevanceChange,
  onOpenInstrument,
  onOpenConcept,
}: {
  data: ResearchLabData;
  coverageScope: CoverageScope;
  relevanceScope: RelevanceScope;
  onCoverageChange: (value: CoverageScope) => void;
  onRelevanceChange: (value: RelevanceScope) => void;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const [metric, setMetric] = useState<GenomeMetric>("tfidf");
  const [activeCell, setActiveCell] = useState<{
    instrumentId: string;
    conceptId: string;
  } | null>(null);
  const genomeGridRef = useRef<HTMLDivElement>(null);

  const instruments = useMemo(
    () =>
      data.instruments
        .filter((instrument) =>
          instrumentMatchesCoverage(instrument, coverageScope),
        )
        .sort((left, right) => left.atlasOrder - right.atlasOrder),
    [coverageScope, data.instruments],
  );
  const comparableInstruments = useMemo(
    () =>
      instruments.filter(
        (instrument) =>
          instrument.conceptMeasurementState === "observed-complete",
      ),
    [instruments],
  );

  const matrix = useMemo(() => {
    const instrumentIds = new Set(
      instruments.map((instrument) => instrument.id),
    );
    const relevant = data.provisions.filter(
      (provision) =>
        instrumentIds.has(provision.instrumentId) &&
        provisionMatchesScope(provision, relevanceScope),
    );
    const counts = new Map<string, Map<string, number>>();
    const assignmentTotals = new Map<string, number>();
    const provisionTotals = new Map<string, number>();

    for (const provision of relevant) {
      provisionTotals.set(
        provision.instrumentId,
        (provisionTotals.get(provision.instrumentId) ?? 0) + 1,
      );
      const conceptCounts = counts.get(provision.instrumentId) ?? new Map();
      for (const conceptId of new Set(provision.conceptIds)) {
        conceptCounts.set(conceptId, (conceptCounts.get(conceptId) ?? 0) + 1);
        assignmentTotals.set(
          provision.instrumentId,
          (assignmentTotals.get(provision.instrumentId) ?? 0) + 1,
        );
      }
      counts.set(provision.instrumentId, conceptCounts);
    }

    const documentFrequency = new Map<string, number>();
    for (const concept of data.concepts) {
      documentFrequency.set(
        concept.id,
        comparableInstruments.filter(
          (instrument) => (counts.get(instrument.id)?.get(concept.id) ?? 0) > 0,
        ).length,
      );
    }

    const rows = new Map<string, Map<string, FingerprintCell>>();
    for (const instrument of instruments) {
      const cells = new Map<string, FingerprintCell>();
      for (const concept of data.concepts) {
        const count = counts.get(instrument.id)?.get(concept.id) ?? 0;
        const prevalence = count / Math.max(1, provisionTotals.get(instrument.id) ?? 0);
        const termFrequency =
          count / Math.max(1, assignmentTotals.get(instrument.id) ?? 0);
        const idf =
          Math.log(
            (comparableInstruments.length + 1) /
              ((documentFrequency.get(concept.id) ?? 0) + 1),
          ) + 1;
        cells.set(concept.id, {
          count,
          prevalence,
          tfidf: termFrequency * idf,
        });
      }
      const l2Norm = Math.sqrt(
        [...cells.values()].reduce(
          (sum, cell) => sum + cell.tfidf * cell.tfidf,
          0,
        ),
      );
      if (l2Norm > 0) {
        for (const [conceptId, cell] of cells) {
          cells.set(conceptId, { ...cell, tfidf: cell.tfidf / l2Norm });
        }
      }
      rows.set(instrument.id, cells);
    }
    return rows;
  }, [
    comparableInstruments,
    data.concepts,
    data.provisions,
    instruments,
    relevanceScope,
  ]);

  const maxValue = useMemo(
    () =>
      Math.max(
        0,
        ...(metric === "count" ? instruments : comparableInstruments).flatMap((instrument) =>
          data.concepts.map(
            (concept) => matrix.get(instrument.id)?.get(concept.id)?.[metric] ?? 0,
          ),
        ),
      ),
    [comparableInstruments, data.concepts, instruments, matrix, metric],
  );

  const metricLabel =
    metric === "tfidf"
      ? "L2-normalized TF-IDF"
      : metric === "prevalence"
        ? "Share of relevant provisions"
        : "Raw provision count";

  const activeInstrument = activeCell
    ? instruments.find(
        (instrument) => instrument.id === activeCell.instrumentId,
      )
    : undefined;
  const activeConcept = activeCell
    ? data.concepts.find((concept) => concept.id === activeCell.conceptId)
    : undefined;
  const activeMatrixCell =
    activeCell && activeConcept
      ? matrix.get(activeCell.instrumentId)?.get(activeCell.conceptId)
      : undefined;
  const activeMeasurementComplete =
    activeInstrument?.conceptMeasurementState === "observed-complete";
  const activeRecordedPartial =
    activeInstrument?.conceptMeasurementState === "unknown-partial" &&
    metric === "count" &&
    (activeMatrixCell?.count ?? 0) > 0;
  const activeValue = activeMeasurementComplete
    ? (activeMatrixCell?.[metric] ?? null)
    : activeRecordedPartial
      ? (activeMatrixCell?.count ?? null)
      : null;
  const activeGenomeRowIndex = activeCell
    ? instruments.findIndex(
        (instrument) => instrument.id === activeCell.instrumentId,
      )
    : -1;
  const activeGenomeColumnIndex = activeCell
    ? data.concepts.findIndex((concept) => concept.id === activeCell.conceptId)
    : -1;
  const rovingGenomeRowIndex = activeGenomeRowIndex >= 0 ? activeGenomeRowIndex : 0;
  const rovingGenomeColumnIndex =
    activeGenomeColumnIndex >= 0 ? activeGenomeColumnIndex : 0;

  function focusGenomeCell(rowIndex: number, columnIndex: number) {
    if (!instruments.length || !data.concepts.length) return;
    const nextRowIndex = Math.max(
      0,
      Math.min(instruments.length - 1, rowIndex),
    );
    const nextColumnIndex = Math.max(
      0,
      Math.min(data.concepts.length - 1, columnIndex),
    );
    setActiveCell({
      instrumentId: instruments[nextRowIndex].id,
      conceptId: data.concepts[nextColumnIndex].id,
    });
    window.requestAnimationFrame(() => {
      genomeGridRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-genome-row="${nextRowIndex}"][data-genome-column="${nextColumnIndex}"]`,
        )
        ?.focus();
    });
  }

  function handleGenomeCellKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    columnIndex: number,
  ) {
    let nextRowIndex = rowIndex;
    let nextColumnIndex = columnIndex;
    if (event.key === "ArrowRight") nextColumnIndex += 1;
    else if (event.key === "ArrowLeft") nextColumnIndex -= 1;
    else if (event.key === "ArrowDown") nextRowIndex += 1;
    else if (event.key === "ArrowUp") nextRowIndex -= 1;
    else if (event.key === "Home") {
      if (event.ctrlKey || event.metaKey) nextRowIndex = 0;
      nextColumnIndex = 0;
    } else if (event.key === "End") {
      if (event.ctrlKey || event.metaKey) nextRowIndex = instruments.length - 1;
      nextColumnIndex = data.concepts.length - 1;
    } else return;

    event.preventDefault();
    focusGenomeCell(nextRowIndex, nextColumnIndex);
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>02 / Concept fingerprints</span>
          <h2>Regulatory Genome</h2>
          <p>
            Compare each instrument&apos;s normalized concept profile without treating
            document length as regulatory intensity.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <CoverageControl value={coverageScope} onChange={onCoverageChange} />
        <RelevanceControl value={relevanceScope} onChange={onRelevanceChange} />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Genome normalization</span>
          <select
            aria-label="Genome normalization"
            value={metric}
            onChange={(event) => setMetric(event.target.value as GenomeMetric)}
          >
            <option value="tfidf">TF-IDF</option>
            <option value="prevalence">Share of provisions</option>
            <option value="count">Raw count</option>
          </select>
        </label>
        {instruments.length - comparableInstruments.length > 0 && (
          <span className={styles.controlSummary}>
            {metric === "count"
              ? `${instruments.length - comparableInstruments.length} selected or partial instruments: recorded positive counts are lower bounds; unrecorded cells remain unknown.`
              : `${instruments.length - comparableInstruments.length} selected or partial instruments are N/A and excluded from normalization.`}
          </span>
        )}
      </div>

      <div
        className={classNames(styles.scrollRegion, styles.genomeScroll)}
        role="region"
        aria-label="Scrollable regulatory genome matrix"
        aria-describedby="genome-keyboard-instructions"
      >
        <p id="genome-keyboard-instructions" className={styles.srOnly}>
          The concept cells use one keyboard stop. Use the arrow keys to move by
          row or column, Home and End to move within a row, and Control or Command
          plus Home or End to move to the first or last cell.
        </p>
        <div
          ref={genomeGridRef}
          className={styles.genomeFigure}
          role="group"
          aria-label={`${metricLabel} heat map for ${comparableInstruments.length} complete corpora; ${instruments.length - comparableInstruments.length} selected or partial corpora use recorded lower-bound counts only in Raw count mode and otherwise remain unknown or not comparable; ${data.concepts.length} concepts`}
        >
          <div className={classNames(styles.genomeRow, styles.genomeHeader)}>
            <div className={styles.genomeCorner}>
              <span>Instrument</span>
              <span>{metricLabel}</span>
            </div>
            {data.concepts.map((concept) => (
              <button
                type="button"
                key={concept.id}
                className={styles.conceptHeader}
                style={conceptStyle(concept, data.themes)}
                aria-label={`Open core concept ${concept.label}`}
                onClick={() => onOpenConcept(concept.id)}
              >
                <span className={styles.conceptHeaderInner}>
                  <ConceptIcon conceptId={concept.id} />
                  <span>{concept.label}</span>
                </span>
              </button>
            ))}
          </div>

          {instruments.map((instrument, instrumentIndex) => (
            <div className={styles.genomeRow} key={instrument.id}>
                  <button
                    type="button"
                    className={styles.instrumentButton}
                    aria-label={`Open ${instrument.shortTitle}; ${instrument.jurisdictionName}; ${humanizeResearchCode(instrument.legalForce)}; ${humanizeResearchCode(instrument.lifecycleStatus)}; ${instrument.coverageClass} corpus`}
                    onClick={() => onOpenInstrument(instrument.id)}
                  >
                <span className={styles.instrumentIdentity}>
                  <JurisdictionMark
                    jurisdictionId={instrument.jurisdictionId}
                    small
                  />
                  <span>
                    <span className={styles.instrumentTitle}>
                      {instrument.shortTitle}
                    </span>
                    <span className={styles.instrumentMeta}>
                      {instrument.jurisdictionName} ·{" "}
                      {humanizeResearchCode(instrument.legalForce)} ·{" "}
                      {humanizeResearchCode(instrument.lifecycleStatus)} ·{" "}
                      {instrument.coverageClass}
                    </span>
                  </span>
                </span>
              </button>
              {data.concepts.map((concept, conceptIndex) => {
                const isComparable =
                  instrument.conceptMeasurementState === "observed-complete";
                const matrixCell = matrix.get(instrument.id)?.get(concept.id);
                const isRecordedPartial =
                  !isComparable &&
                  metric === "count" &&
                  (matrixCell?.count ?? 0) > 0;
                const value = isComparable
                  ? (matrixCell?.[metric] ?? 0)
                  : isRecordedPartial
                    ? (matrixCell?.count ?? null)
                    : null;
                const availability = isComparable
                  ? "observed-complete"
                  : isRecordedPartial
                    ? "observed-partial"
                    : "unknown";
                const heatLevel = value !== null && maxValue
                  ? Math.min(5, Math.ceil((value / maxValue) * 5))
                  : 0;
                return (
                  <button
                    type="button"
                    key={concept.id}
                    className={styles.heatCell}
                    data-grade={value !== null ? heatLevel : undefined}
                    data-availability={availability}
                    data-genome-row={instrumentIndex}
                    data-genome-column={conceptIndex}
                    tabIndex={
                      instrumentIndex === rovingGenomeRowIndex &&
                      conceptIndex === rovingGenomeColumnIndex
                        ? 0
                        : -1
                    }
                    style={
                      conceptStyle(concept, data.themes)
                    }
                    aria-label={
                      isComparable && value !== null
                        ? `${instrument.shortTitle}, ${concept.label}: ${formatMetric(value, metric)} ${metricLabel}; exact observation in a complete corpus`
                        : isRecordedPartial && value !== null
                          ? `${instrument.shortTitle}, ${concept.label}: ${formatMetric(value, "count")} recorded mapped provisions; observed lower bound in a selected or partial corpus, with additional unobserved assignments possible`
                          : metric === "count"
                            ? `${instrument.shortTitle}, ${concept.label}: no assignment recorded in the selected or partial corpus; absence is unknown, not zero`
                            : `${instrument.shortTitle}, ${concept.label}: ${metricLabel} is not comparable for a selected or partial corpus; recorded and unobserved content cannot be normalized together`
                    }
                    onPointerEnter={() =>
                      setActiveCell({
                        instrumentId: instrument.id,
                        conceptId: concept.id,
                      })
                    }
                    onFocus={() =>
                      setActiveCell({
                        instrumentId: instrument.id,
                        conceptId: concept.id,
                      })
                    }
                    onKeyDown={(event) =>
                      handleGenomeCellKeyDown(
                        event,
                        instrumentIndex,
                        conceptIndex,
                      )
                    }
                    onClick={() => onOpenConcept(concept.id)}
                  >
                    {isComparable ? (
                      <span className={styles.heatMark} aria-hidden="true" />
                    ) : isRecordedPartial && value !== null ? (
                      <span className={styles.heatPartial} aria-hidden="true">
                        {formatMetric(value, "count")}
                      </span>
                    ) : (
                      <span className={styles.heatUnknown} aria-hidden="true">
                        N/A
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.readout} aria-live="polite">
        {activeInstrument && activeConcept && activeRecordedPartial && activeValue !== null ? (
          <>
            <strong>{activeInstrument.shortTitle}</strong>
            <span>×</span>
            <strong>{activeConcept.label}</strong>
            <code>{formatMetric(activeValue, "count")}</code>
            <span>
              recorded mapped provisions · observed lower bound in a selected or
              partial corpus
            </span>
          </>
        ) : activeInstrument && activeConcept && !activeMeasurementComplete ? (
          <>
            <strong>{activeInstrument.shortTitle}</strong>
            <span>×</span>
            <strong>{activeConcept.label}</strong>
            <code>N/A</code>
            <span>
              {metric === "count"
                ? "No assignment recorded in this selected or partial corpus · absence is unknown, not zero"
                : `${metricLabel} is not comparable for selected or partial corpora`}
            </span>
          </>
        ) : activeInstrument && activeConcept && activeValue !== null ? (
          <>
            <strong>{activeInstrument.shortTitle}</strong>
            <span>×</span>
            <strong>{activeConcept.label}</strong>
            <code>{formatMetric(activeValue, metric)}</code>
            <span>{metricLabel}</span>
          </>
        ) : (
          <span>Focus or point to a cell to inspect its normalized value.</span>
        )}
      </div>

      <div
        className={styles.genomeAvailabilityLegend}
        aria-label="Genome observation-state legend"
      >
        <span data-availability="observed-complete">
          <i /> Exact = complete corpus; 0 is an observed zero
        </span>
        <span data-availability="observed-partial">
          <i /> Count = recorded lower bound in a selected or partial corpus
        </span>
        <span data-availability="unknown">
          <i /> N/A = unrecorded absence or normalization unavailable
        </span>
      </div>

      <div className={styles.legendGrid} aria-label="Core concept legend">
        {data.concepts.map((concept, conceptIndex) => (
          <button
            type="button"
            key={concept.id}
            className={styles.conceptLegendButton}
            style={conceptStyle(concept, data.themes)}
            onClick={() => onOpenConcept(concept.id)}
          >
            <ConceptIcon conceptId={concept.id} />
            <span className={styles.conceptIndex}>
              {String(conceptIndex + 1).padStart(2, "0")}
            </span>
            <span>{concept.label}</span>
          </button>
        ))}
      </div>

      <MethodNote>
        <strong>Raw counts ≠ regulatory strength.</strong> TF-IDF reduces the
        dominance of long instruments and ubiquitous concepts; the complete-only
        estimand removes selected-text corpora from distributional comparison.
        Choosing all indexed instruments preserves recorded positive raw counts
        from partial corpora as lower bounds, while unrecorded cells remain unknown.
        Prevalence and TF-IDF stay N/A for those rows, so the complete-corpus
        normalization never absorbs a partial denominator.
      </MethodNote>
    </>
  );
}

function ComparativeMorphology({
  data,
  relevanceScope,
  onRelevanceChange,
  defaultInstrumentIds,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  relevanceScope: RelevanceScope;
  onRelevanceChange: (value: RelevanceScope) => void;
  defaultInstrumentIds?: string[];
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const initialIds = (
    defaultInstrumentIds?.length
      ? defaultInstrumentIds
      : data.instruments.slice(0, 4).map((instrument) => instrument.id)
  ).filter((id, index, ids) => ids.indexOf(id) === index).slice(0, 6);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [bandScale, setBandScale] = useState<"overview" | "inspect">(
    "overview",
  );
  const [activeProvision, setActiveProvision] =
    useState<ResearchLabProvision | null>(null);
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    [data.concepts],
  );
  const selectable = data.instruments.filter(
    (instrument) => !selectedIds.includes(instrument.id),
  );

  function addInstrument(instrumentId: string) {
    if (!instrumentId || selectedIds.includes(instrumentId)) return;
    setSelectedIds((current) => [...current.slice(-5), instrumentId]);
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>03 / Sequential structure</span>
          <h2>Comparative Morphology</h2>
          <p>
            Read laws as ordered concept bands to see whether duties are
            concentrated in chapters or distributed across the instrument.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <RelevanceControl value={relevanceScope} onChange={onRelevanceChange} />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Provision band scale</span>
          <select
            aria-label="Provision band scale"
            value={bandScale}
            onChange={(event) =>
              setBandScale(event.target.value as "overview" | "inspect")
            }
          >
            <option value="overview">Overview · proportional</option>
            <option value="inspect">Inspect · 24 px targets</option>
          </select>
        </label>
      </div>

      <div className={styles.morphologyPicker}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Add instrument</span>
          <select
            aria-label="Add instrument to morphology comparison"
            value=""
            disabled={!selectable.length}
            onChange={(event) => addInstrument(event.target.value)}
          >
            <option value="">Choose a legal source…</option>
            {selectable.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.shortTitle} — {instrument.jurisdictionName}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.selectedChips} aria-label="Compared instruments">
          {selectedIds.map((instrumentId) => {
            const instrument = instrumentById.get(instrumentId);
            if (!instrument) return null;
            return (
              <button
                type="button"
                key={instrumentId}
                className={styles.chip}
                aria-label={`Remove ${instrument.shortTitle} from comparison`}
                onClick={() =>
                  setSelectedIds((current) =>
                    current.filter((id) => id !== instrumentId),
                  )
                }
              >
                <span>{instrument.shortTitle}</span>
                <X aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {selectedIds.length ? (
        <div
          className={styles.scrollRegion}
          role="region"
          aria-label="Scrollable provision morphology comparison"
        >
          <div
            className={styles.geneFigure}
            role="group"
            aria-label="Ordered regulatory concept bands"
          >
            {selectedIds.map((instrumentId) => {
              const instrument = instrumentById.get(instrumentId);
              if (!instrument) return null;
              const instrumentProvisions = data.provisions.filter(
                (provision) =>
                  provision.instrumentId === instrumentId &&
                  provisionMatchesScope(provision, relevanceScope),
              ).sort((left, right) => left.sourceOrder - right.sourceOrder);
              const total = Math.max(1, instrumentProvisions.length);
              return (
                <div className={styles.geneRow} key={instrumentId}>
                  <div className={styles.geneMeta}>
                    <button
                      type="button"
                      onClick={() => onOpenInstrument(instrumentId)}
                    >
                      <span className={styles.instrumentIdentity}>
                        <JurisdictionMark
                          jurisdictionId={instrument.jurisdictionId}
                          small
                        />
                        <span>{instrument.shortTitle}</span>
                      </span>
                    </button>
                    <small>
                      {instrument.jurisdictionName} · {instrumentProvisions.length} units
                    </small>
                  </div>
                  <div
                    className={styles.geneTrack}
                    data-band-scale={bandScale}
                    style={
                      {
                        "--provision-count": Math.max(
                          1,
                          instrumentProvisions.length,
                        ),
                      } as VisualStyle
                    }
                  >
                    {instrumentProvisions.length ? (
                      instrumentProvisions.map((provision, index) => {
                        const primaryConceptId = provision.conceptIds[0] ?? null;
                        const concept = primaryConceptId
                          ? conceptById.get(primaryConceptId)
                          : undefined;
                        const width = 100 / total;
                        return (
                          <button
                            type="button"
                            key={`${provision.id}-${index}`}
                            className={styles.geneBand}
                            data-structural={
                              provision.relevance === "structural-context"
                            }
                            style={
                              {
                                "--concept-color": concept
                                  ? conceptColor(concept, data.themes)
                                  : "var(--muted)",
                              } as VisualStyle
                            }
                            aria-label={`${instrument.shortTitle} ${provision.locator}: ${provision.title}; ${concept?.label ?? "Unmapped context"}`}
                            onPointerEnter={() => setActiveProvision(provision)}
                            onFocus={() => setActiveProvision(provision)}
                            onClick={() => onOpenProvision(provision.id)}
                          >
                            {bandScale === "inspect" || width >= 8
                              ? provision.locator
                              : ""}
                          </button>
                        );
                      })
                    ) : (
                      <span className={styles.emptyTrack}>No provisions in scope</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>Add up to six instruments to compare.</div>
      )}

      <div className={styles.readout} aria-live="polite">
        {activeProvision ? (
          <>
            <span>{activeProvision.locator}</span>
            <span>{activeProvision.title}</span>
            {activeProvision.conceptIds.length ? (
              activeProvision.conceptIds.map((conceptId) => {
                const concept = conceptById.get(conceptId);
                if (!concept) return null;
                return (
                  <button
                    type="button"
                    key={conceptId}
                    className={styles.evidenceButton}
                    onClick={() => onOpenConcept(conceptId)}
                  >
                    {concept.label}
                  </button>
                );
              })
            ) : (
              <strong>Unmapped context</strong>
            )}
          </>
        ) : (
          <span>Focus or point to a band to inspect its indexed concepts.</span>
        )}
      </div>

      <MethodNote>
        Band width represents the share of indexed provisions, not substantive
        importance. Selected-text corpora can reveal local ordering but are not
        equivalent to complete document structure. Color uses the first indexed
        concept only as a visual key; it does not identify a dominant concept.
      </MethodNote>
    </>
  );
}

function RegulatoryGrammar({
  data,
  coverageScope,
  relevanceScope,
  onCoverageChange,
  onRelevanceChange,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  coverageScope: CoverageScope;
  relevanceScope: RelevanceScope;
  onCoverageChange: (value: CoverageScope) => void;
  onRelevanceChange: (value: RelevanceScope) => void;
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const [metric, setMetric] =
    useState<GrammarMetric>("normalizedPmi");
  const [minimumSupport, setMinimumSupport] = useState(3);
  const [minimumInstruments, setMinimumInstruments] = useState(2);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeGrammarKey, setActiveGrammarKey] = useState<string | null>(null);
  const grammarGridRef = useRef<HTMLDivElement>(null);
  const displayedInstruments = useMemo(
    () =>
      data.instruments.filter((instrument) =>
        instrumentMatchesCoverage(instrument, coverageScope),
      ),
    [coverageScope, data.instruments],
  );
  const includedInstrumentIds = useMemo(
    () =>
      new Set(
        displayedInstruments
          .filter((instrument) =>
            instrument.conceptMeasurementState === "observed-complete",
          )
          .map((instrument) => instrument.id),
      ),
    [displayedInstruments],
  );
  const excludedPartialInstrumentCount = displayedInstruments.length - includedInstrumentIds.size;
  const includedProvisions = useMemo(
    () =>
      data.provisions.filter((provision) =>
        includedInstrumentIds.has(provision.instrumentId),
      ),
    [data.provisions, includedInstrumentIds],
  );
  const pairs = useMemo(
    () =>
      buildGrammarPairs(
        includedProvisions,
        data.concepts,
        data.instruments,
        relevanceScope,
      ),
    [data.concepts, data.instruments, includedProvisions, relevanceScope],
  );
  const pairByKey = useMemo(
    () =>
      new Map(
        pairs.map((pair) => [
          pairKey(pair.leftConceptId, pair.rightConceptId),
          pair,
        ]),
      ),
    [pairs],
  );
  const maximumVisualDistance = Math.max(
    0,
    ...pairs.map((pair) =>
      pair.provisionCount >= minimumSupport &&
      pair.instrumentCount >= minimumInstruments
        ? Math.abs(metricVisualScore(pair, metric) ?? 0)
        : 0,
    ),
  );
  const selectedPair = selectedKey ? pairByKey.get(selectedKey) : undefined;
  const allSelectedEvidence = selectedPair
    ? includedProvisions
        .filter(
          (provision) =>
            provisionMatchesScope(provision, relevanceScope) &&
            provision.conceptIds.includes(selectedPair.leftConceptId) &&
            provision.conceptIds.includes(selectedPair.rightConceptId),
        )
    : [];
  const selectedEvidence = allSelectedEvidence.slice(0, 8);
  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    [data.concepts],
  );

  const metricName =
    metric === "normalizedPmi"
      ? "Normalized pointwise mutual information (unitless)"
      : metric === "pmi"
      ? "Pointwise mutual information (bits)"
      : metric === "lift"
        ? "Lift over expected co-occurrence"
        : metric === "jaccard"
          ? "Jaccard overlap"
          : "Shared provision count";
  const directionalMetric =
    metric === "normalizedPmi" || metric === "pmi" || metric === "lift";
  const firstGrammarKey =
    data.concepts.length > 1
      ? pairKey(data.concepts[0].id, data.concepts[1].id)
      : null;
  const rovingGrammarKey = activeGrammarKey ?? firstGrammarKey;

  function focusGrammarCell(rowIndex: number, columnIndex: number) {
    if (data.concepts.length < 2) return;
    const nextRowIndex = Math.max(
      0,
      Math.min(data.concepts.length - 2, rowIndex),
    );
    const nextColumnIndex = Math.max(
      nextRowIndex + 1,
      Math.min(data.concepts.length - 1, columnIndex),
    );
    const nextKey = pairKey(
      data.concepts[nextRowIndex].id,
      data.concepts[nextColumnIndex].id,
    );
    setActiveGrammarKey(nextKey);
    window.requestAnimationFrame(() => {
      grammarGridRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-grammar-row="${nextRowIndex}"][data-grammar-column="${nextColumnIndex}"]`,
        )
        ?.focus();
    });
  }

  function handleGrammarCellKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    rowIndex: number,
    columnIndex: number,
  ) {
    let nextRowIndex = rowIndex;
    let nextColumnIndex = columnIndex;
    if (event.key === "ArrowRight") nextColumnIndex += 1;
    else if (event.key === "ArrowLeft") nextColumnIndex -= 1;
    else if (event.key === "ArrowDown") {
      nextRowIndex += 1;
      nextColumnIndex = Math.max(nextColumnIndex, nextRowIndex + 1);
    } else if (event.key === "ArrowUp") nextRowIndex -= 1;
    else if (event.key === "Home") {
      if (event.ctrlKey || event.metaKey) {
        nextRowIndex = 0;
        nextColumnIndex = 1;
      } else nextColumnIndex = rowIndex + 1;
    } else if (event.key === "End") {
      if (event.ctrlKey || event.metaKey) nextRowIndex = data.concepts.length - 2;
      nextColumnIndex = data.concepts.length - 1;
    } else return;

    event.preventDefault();
    focusGrammarCell(nextRowIndex, nextColumnIndex);
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>04 / Concept associations</span>
          <h2>Regulatory Grammar</h2>
          <p>
            Identify recurring concept bundles while separating genuine
            association from the dominance of frequently tagged concepts.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <CoverageControl value={coverageScope} onChange={onCoverageChange} />
        <RelevanceControl value={relevanceScope} onChange={onRelevanceChange} />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Association metric</span>
          <select
            aria-label="Association metric"
            value={metric}
            onChange={(event) => setMetric(event.target.value as GrammarMetric)}
          >
            <option value="normalizedPmi">Normalized PMI</option>
            <option value="pmi">PMI</option>
            <option value="lift">Lift</option>
            <option value="jaccard">Jaccard</option>
            <option value="count">Shared count</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Minimum shared provisions</span>
          <select
            aria-label="Minimum shared provisions"
            value={minimumSupport}
            onChange={(event) => setMinimumSupport(Number(event.target.value))}
          >
            <option value={1}>1 provision</option>
            <option value={3}>3 provisions</option>
            <option value={5}>5 provisions</option>
            <option value={10}>10 provisions</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Minimum distinct instruments</span>
          <select
            aria-label="Minimum distinct instruments"
            value={minimumInstruments}
            onChange={(event) =>
              setMinimumInstruments(Number(event.target.value))
            }
          >
            <option value={1}>1 instrument</option>
            <option value={2}>2 instruments</option>
            <option value={3}>3 instruments</option>
            <option value={5}>5 instruments</option>
          </select>
        </label>
        {excludedPartialInstrumentCount > 0 && (
          <span className={styles.controlSummary}>
            {excludedPartialInstrumentCount} selected or partial instruments are
            excluded from the association estimand because unobserved content is
            unknown.
          </span>
        )}
      </div>

      <div className={styles.grammarLegend} aria-label="Association direction legend">
        {directionalMetric && (
          <span data-sign="negative"><i aria-hidden="true">−</i> below independence</span>
        )}
        {directionalMetric && (
          <span data-sign="neutral"><i aria-hidden="true">·</i> independence</span>
        )}
        <span data-sign="positive">
          <i aria-hidden="true">+</i>{" "}
          {directionalMetric ? "above independence" : "larger observed overlap"}
        </span>
        <span data-sign="none"><i aria-hidden="true">×</i> unsupported / N/A</span>
      </div>

      <div
        className={styles.matrixScroll}
        role="region"
        aria-label="Scrollable concept association matrix"
        aria-describedby="grammar-keyboard-instructions"
      >
        <p id="grammar-keyboard-instructions" className={styles.srOnly}>
          The unique association cells use one keyboard stop. Use the arrow keys
          to move through the upper-triangle matrix, Home and End to move within
          a row, and Control or Command plus Home or End for the first or last
          cell.
        </p>
        <div
          ref={grammarGridRef}
          className={styles.matrixFigure}
          role="group"
          aria-label={`${metricName} matrix for ${data.concepts.length} core concepts`}
        >
          <div className={styles.matrixCorner}>ROW × COLUMN</div>
          {data.concepts.map((concept, index) => (
            <button
              type="button"
              key={concept.id}
              className={styles.matrixColumnLabel}
              style={conceptStyle(concept, data.themes)}
              aria-label={`Open ${concept.label}`}
              onClick={() => onOpenConcept(concept.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}

          {data.concepts.map((rowConcept, rowIndex) => (
            <div key={rowConcept.id} style={{ display: "contents" }}>
              <button
                type="button"
                className={styles.matrixLabelButton}
                style={conceptStyle(rowConcept, data.themes)}
                onClick={() => onOpenConcept(rowConcept.id)}
              >
                <ConceptIcon conceptId={rowConcept.id} />
                <span className={styles.conceptIndex}>
                  {String(rowIndex + 1).padStart(2, "0")}
                </span>
                <span>{rowConcept.label}</span>
              </button>
              {data.concepts.map((columnConcept, columnIndex) => {
                if (rowConcept.id === columnConcept.id) {
                  return (
                    <div
                      key={columnConcept.id}
                      className={styles.matrixCell}
                      data-diagonal="true"
                      aria-label={`${rowConcept.label}, diagonal`}
                    />
                  );
                }
                const key = pairKey(rowConcept.id, columnConcept.id);
                const pair = pairByKey.get(key);
                const value = pair ? metricValue(pair, metric) : null;
                const meetsSupport =
                  (pair?.provisionCount ?? 0) >= minimumSupport &&
                  (pair?.instrumentCount ?? 0) >= minimumInstruments;
                const visualScore =
                  meetsSupport && pair ? metricVisualScore(pair, metric) : null;
                const grade = maximumVisualDistance && visualScore !== null
                  ? Math.min(
                      5,
                      Math.ceil(
                        (Math.abs(visualScore) / maximumVisualDistance) * 5,
                      ),
                    )
                  : 0;
                const direction = meetsSupport
                  ? metricDirection(value, metric)
                  : "none";
                if (rowIndex > columnIndex) {
                  return (
                    <div
                      key={columnConcept.id}
                      className={styles.matrixCell}
                      data-grade={grade}
                      data-sign={direction}
                      aria-hidden="true"
                    />
                  );
                }
                const supportDescription = pair
                  ? `${pair.provisionCount} shared provisions across ${pair.instrumentCount} instruments and ${pair.jurisdictionCount} jurisdictions`
                  : "no observed co-occurrence";
                return (
                  <button
                    type="button"
                    key={columnConcept.id}
                    className={styles.matrixCell}
                    data-grade={grade}
                    data-sign={direction}
                    data-grammar-row={rowIndex}
                    data-grammar-column={columnIndex}
                    tabIndex={key === rovingGrammarKey ? 0 : -1}
                    aria-pressed={selectedKey === key}
                    aria-label={`${rowConcept.label} with ${columnConcept.label}: ${formatMetric(value, metric)} ${metricName}; ${supportDescription}${meetsSupport ? "" : ", below the display threshold"}`}
                    onFocus={() => setActiveGrammarKey(key)}
                    onKeyDown={(event) =>
                      handleGrammarCellKeyDown(event, rowIndex, columnIndex)
                    }
                    onClick={() => setSelectedKey(key)}
                  >
                    <span className={styles.matrixCellValue} aria-hidden="true">
                      {direction === "positive"
                        ? "+"
                        : direction === "negative"
                          ? "−"
                          : direction === "neutral"
                            ? "·"
                            : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.readout} aria-live="polite">
        {selectedPair ? (
          <>
            <strong>
              {conceptById.get(selectedPair.leftConceptId)?.label}
            </strong>
            <span>×</span>
            <strong>
              {conceptById.get(selectedPair.rightConceptId)?.label}
            </strong>
            <code>{formatMetric(metricValue(selectedPair, metric), metric)}</code>
            <span>{metricName}</span>
            <span>{selectedPair.provisionCount} shared provisions</span>
            <span>{selectedPair.instrumentCount} distinct instruments</span>
            <span>{selectedPair.jurisdictionCount} jurisdictions</span>
          </>
        ) : (
          <span>Select a matrix cell to inspect supporting provisions.</span>
        )}
      </div>

      {selectedEvidence.length > 0 && (
        <div>
          <span className={styles.fieldLabel}>
            Showing {selectedEvidence.length} of {allSelectedEvidence.length} supporting
            provisions
          </span>
          <div className={styles.evidenceList} aria-label="Supporting provisions">
            {selectedEvidence.map((provision) => (
              <button
                type="button"
                key={provision.id}
                className={styles.evidenceButton}
                onClick={() => onOpenProvision(provision.id)}
              >
                {provision.locator} · {provision.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <MethodNote>
        Normalized PMI, PMI and lift adjust for common concepts; shared counts do
        not. The display defaults to at least three shared provisions across two
        instruments; this is a visibility rule, not a significance test. Pooled
        provisions have unequal legal granularity, and long instruments contribute
        more observations. Association indicates co-tagging, not doctrinal
        equivalence or causal influence. Selected and partial corpora never enter
        this comparative matrix, even when they are revealed elsewhere for discovery.
      </MethodNote>
    </>
  );
}

function GlobalTimeMachine({
  data,
  onOpenInstrument,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
}) {
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const lanes = useMemo(
    () =>
      data.lifecycleLanes.slice().sort(
          (left, right) =>
            (instrumentById.get(left.instrumentId)?.atlasOrder ?? 999) -
            (instrumentById.get(right.instrumentId)?.atlasOrder ?? 999),
        ),
    [data.lifecycleLanes, instrumentById],
  );
  const eventDates = useMemo(
    () =>
      [
        ...new Set([
          data.snapshotDate,
          ...lanes.flatMap((lane) => lane.events.map((event) => event.date)),
        ]),
      ].sort(),
    [data.snapshotDate, lanes],
  );
  const snapshotIndex = Math.max(
    0,
    eventDates.findLastIndex((date) => date <= data.snapshotDate),
  );
  const [dateIndex, setDateIndex] = useState(snapshotIndex);
  const [playing, setPlaying] = useState(false);
  const [activeEvent, setActiveEvent] =
    useState<ActiveLifecycleEvent | null>(null);
  const boundedDateIndex = Math.min(
    dateIndex,
    Math.max(0, eventDates.length - 1),
  );
  const selectedDate = eventDates[boundedDateIndex] ?? data.snapshotDate;
  const minDate = eventDates[0] ?? data.snapshotDate;
  const maxDate = eventDates.at(-1) ?? data.snapshotDate;
  const minTime = Date.parse(`${minDate}T00:00:00Z`);
  const maxTime = Date.parse(`${maxDate}T00:00:00Z`);
  const selectedTime = Date.parse(`${selectedDate}T00:00:00Z`);
  const span = Math.max(1, maxTime - minTime);
  const playhead = `${Math.max(0, Math.min(100, ((selectedTime - minTime) / span) * 100))}%`;
  const activeEventInstrument = activeEvent
    ? instrumentById.get(activeEvent.instrumentId)
    : undefined;

  useEffect(() => {
    if (!playing || eventDates.length < 2) return;
    const timer = window.setTimeout(() => {
      if (boundedDateIndex >= eventDates.length - 1) {
        setPlaying(false);
        return;
      }
      setDateIndex(boundedDateIndex + 1);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [boundedDateIndex, eventDates.length, playing]);

  function eventPosition(date: string) {
    const time = Date.parse(`${date}T00:00:00Z`);
    return `${Math.max(0, Math.min(100, ((time - minTime) / span) * 100))}%`;
  }

  function togglePlayback() {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDateIndex((current) =>
        Math.min(current + 1, Math.max(0, eventDates.length - 1)),
      );
      return;
    }
    if (boundedDateIndex >= eventDates.length - 1) setDateIndex(0);
    setPlaying((current) => !current);
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>05 / Lifecycle observation</span>
          <h2>Global Time Machine</h2>
          <p>
            Move through adoption, publication, commencement, general application
            and cessation events on one shared legal timeline.
          </p>
        </div>
      </header>

      <div className={styles.timelineControls}>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={playing ? "Pause legal timeline" : "Play legal timeline"}
          aria-pressed={playing}
          onClick={togglePlayback}
          disabled={eventDates.length < 2}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? "Pause" : "Play"}
        </button>
        <label className={styles.rangeField}>
          <span className={styles.rangeValue}>
            <span>Recorded event stop</span>
            <strong>{formatDate(selectedDate)}</strong>
          </span>
          <input
            type="range"
            aria-label="Research date (recorded event stops)"
            aria-valuetext={formatDate(selectedDate)}
            min={0}
            max={Math.max(0, eventDates.length - 1)}
            value={boundedDateIndex}
            onChange={(event) => {
              setPlaying(false);
              setDateIndex(Number(event.target.value));
            }}
          />
        </label>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => {
            setPlaying(false);
            setDateIndex(snapshotIndex);
          }}
        >
          <RotateCcw aria-hidden="true" />
          Snapshot
        </button>
      </div>

      <div className={styles.timelineLegend} aria-label="Lifecycle event legend">
        <span>
          <i
            className={styles.legendMark}
            data-event-category="formation"
            style={{ "--event-color": "var(--violet)" } as VisualStyle}
          />
          formation / publication
        </span>
        <span>
          <i
            className={styles.legendMark}
            data-event-category="commencement"
            style={{ "--event-color": "var(--green)" } as VisualStyle}
          />
          commencement / application
        </span>
        <span>
          <i
            className={styles.legendMark}
            data-event-category="amendment"
            style={{ "--event-color": "var(--amber)" } as VisualStyle}
          />
          amendment / correction
        </span>
        <span>
          <i
            className={styles.legendMark}
            data-event-category="cessation"
            style={{ "--event-color": "var(--red)" } as VisualStyle}
          />
          cessation / failure
        </span>
        <span>
          <i
            className={styles.legendMark}
            data-event-category="milestone"
            style={{ "--event-color": "var(--cyan)" } as VisualStyle}
          />
          recorded milestone
        </span>
      </div>

      {lanes.length ? (
        <div
          className={styles.timelineScroll}
          role="region"
          aria-label="Scrollable legal lifecycle event lanes"
        >
          <div
            className={styles.timelineFigure}
            role="group"
            aria-label={`Legal lifecycle lanes from ${formatDate(minDate)} to ${formatDate(maxDate)}`}
          >
            <div className={styles.timelineAxis}>
              <div className={styles.axisCorner}>
                <span className={styles.axisLabel}>{lanes.length} instruments</span>
              </div>
              <div
                className={styles.axisTrack}
                style={{ "--playhead": playhead } as VisualStyle}
              >
                <span className={styles.axisStart}>{minDate.slice(0, 4)}</span>
                <span className={styles.axisCurrent}>{selectedDate}</span>
                <span className={styles.axisEnd}>{maxDate.slice(0, 4)}</span>
              </div>
            </div>

            {lanes.map((lane) => {
              const instrument = instrumentById.get(lane.instrumentId);
              if (!instrument) return null;
              return (
                <div className={styles.timelineLane} key={lane.instrumentId}>
                  <button
                    type="button"
                    className={styles.laneLabel}
                    onClick={() => onOpenInstrument(lane.instrumentId)}
                  >
                    <span className={styles.instrumentIdentity}>
                      <JurisdictionMark
                        jurisdictionId={instrument.jurisdictionId}
                        small
                      />
                      <span>
                        <span className={styles.instrumentTitle}>
                          {instrument.shortTitle}
                        </span>
                        <span className={styles.instrumentMeta}>
                          {instrument.jurisdictionName}
                        </span>
                      </span>
                    </span>
                  </button>
                  <div
                    className={styles.timelineTrack}
                    style={{ "--playhead": playhead } as VisualStyle}
                  >
                    {lane.events.map((event, eventIndex) => {
                      const future = event.date > selectedDate;
                      const current = event.date === selectedDate;
                      const eventCategory = lifecycleEventCategory(event.type);
                      return (
                        <button
                          type="button"
                          key={event.id}
                          className={styles.eventMarker}
                          data-future={future}
                          data-current={current}
                          data-event-category={eventCategory}
                          style={
                            {
                              "--event-position": eventPosition(event.date),
                              "--event-stack":
                                eventIndex % 3 === 0
                                  ? "-7px"
                                  : eventIndex % 3 === 1
                                    ? "0px"
                                    : "7px",
                              "--event-color":
                                lifecycleEventColor(eventCategory),
                            } as VisualStyle
                          }
                          aria-label={`${instrument.shortTitle}: ${event.label}, ${formatDate(event.date)}, ${humanizeResearchCode(event.type)}, resulting status ${humanizeResearchCode(event.resultingStatus)}; ${event.effect}${future ? ", after selected event stop" : ""}`}
                          onPointerEnter={() =>
                            setActiveEvent({
                              instrumentId: lane.instrumentId,
                              event,
                            })
                          }
                          onFocus={() =>
                            setActiveEvent({
                              instrumentId: lane.instrumentId,
                              event,
                            })
                          }
                          onClick={() => onOpenInstrument(lane.instrumentId)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>No lifecycle events in this scope.</div>
      )}

      <div className={styles.readout} aria-live="polite">
        {activeEvent && activeEventInstrument ? (
          <>
            <strong>{activeEventInstrument.shortTitle}</strong>
            <code>{formatDate(activeEvent.event.date)}</code>
            <span>{activeEvent.event.label}</span>
            <span>
              {humanizeResearchCode(activeEvent.event.type)} →{" "}
              {humanizeResearchCode(activeEvent.event.resultingStatus)}
            </span>
            <span>{activeEvent.event.effect}</span>
            {activeEvent.event.source && (
              <a
                className={styles.evidenceButton}
                href={activeEvent.event.source.url}
                target="_blank"
                rel="noreferrer"
              >
                {activeEvent.event.source.label}
              </a>
            )}
            <button
              type="button"
              className={styles.evidenceButton}
              onClick={() => onOpenInstrument(activeEvent.instrumentId)}
            >
              Open instrument
            </button>
          </>
        ) : (
          <span>Focus or point to an event to inspect its recorded legal effect.</span>
        )}
      </div>

      <MethodNote>
        This is an index of recorded lifecycle events, not a reconstruction of the
        law&apos;s status or wording at an arbitrary date. Slider stops are event dates
        plus the repository snapshot; later markers are only dimmed for orientation.
        Local-text completeness does not imply complete lifecycle history, and future
        dates denote enacted or scheduled events rather than current applicability.
      </MethodNote>
    </>
  );
}

const translationAuthorityLabels: Record<
  ResearchLabData["translationIntegrity"]["corpora"][number]["authorityClasses"][number],
  string
> = {
  "official-text": "Official / co-authentic English",
  "official-reference": "Official reference translation",
  "government-reference": "Government / public-sector reference",
  "project-reference": "Project-authored reference",
  "other-reference": "Other reference text",
};

type TranslationAuthorityFilter =
  | "all"
  | ResearchLabData["translationIntegrity"]["corpora"][number]["authorityClasses"][number];
type TranslationAlignmentFilter = "all" | "attention";

function TranslationIntegrityObservatory({
  data,
  onOpenInstrument,
  onOpenProvision,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
}) {
  const integrity = data.translationIntegrity;
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const [authorityFilter, setAuthorityFilter] =
    useState<TranslationAuthorityFilter>("all");
  const [alignmentFilter, setAlignmentFilter] =
    useState<TranslationAlignmentFilter>("all");
  const filteredCorpora = integrity.corpora.filter(
    (corpus) =>
      (authorityFilter === "all" ||
        corpus.authorityClasses.includes(authorityFilter)) &&
      (alignmentFilter === "all" ||
        corpus.temporallyMismatchedEnglishUnitCount > 0 ||
        corpus.missingEnglishUnitCount > 0),
  );
  const defaultCorpusId =
    integrity.corpora.find(
      (corpus) => corpus.temporallyMismatchedEnglishUnitCount > 0,
    )?.instrumentId ?? integrity.corpora[0]?.instrumentId ?? null;
  const [activeCorpusId, setActiveCorpusId] = useState<string | null>(
    defaultCorpusId,
  );

  const activeCorpus =
    filteredCorpora.find((corpus) => corpus.instrumentId === activeCorpusId) ??
    filteredCorpora[0] ??
    null;
  const activeInstrument = activeCorpus
    ? instrumentById.get(activeCorpus.instrumentId)
    : null;

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>06 / Translation provenance</span>
          <h2>Translation Coverage &amp; Authority</h2>
          <p>
            Separate English-text storage, publication authority and temporal
            alignment across complete non-English corpora.
          </p>
        </div>
      </header>

      <div className={styles.statsGrid} aria-label="Translation coverage summary">
        <article className={styles.stat}>
          <span className={styles.statLabel}>Audited corpora</span>
          <strong className={styles.statValue}>
            {formatter.format(integrity.totals.corpusCount)}
          </strong>
          <span className={styles.statMeta}>complete non-English corpora</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Stored English</span>
          <strong className={styles.statValue}>
            {formatter.format(integrity.totals.storedEnglishUnitCount)}
          </strong>
          <span className={styles.statMeta}>
            of {formatter.format(integrity.totals.totalUnitCount)} units
          </span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Current-aligned</span>
          <strong className={styles.statValue}>
            {integrity.totals.currentAlignedPercent.toFixed(1)}%
          </strong>
          <span className={styles.statMeta}>
            {formatter.format(integrity.totals.currentAlignedEnglishUnitCount)} units
          </span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Temporal mismatch</span>
          <strong className={styles.statValue}>
            {formatter.format(
              integrity.totals.temporallyMismatchedEnglishUnitCount,
            )}
          </strong>
          <span className={styles.statMeta}>version-alignment review targets</span>
        </article>
      </div>

      <div className={styles.controlBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>English authority class</span>
          <select
            aria-label="English authority class"
            value={authorityFilter}
            onChange={(event) =>
              setAuthorityFilter(
                event.target.value as TranslationAuthorityFilter,
              )
            }
          >
            <option value="all">All authority classes</option>
            {Object.entries(translationAuthorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Alignment view</span>
          <select
            aria-label="Translation alignment view"
            value={alignmentFilter}
            onChange={(event) =>
              setAlignmentFilter(
                event.target.value as TranslationAlignmentFilter,
              )
            }
          >
            <option value="all">All audited corpora</option>
            <option value="attention">Temporal or missing-text attention</option>
          </select>
        </label>
        <span className={styles.controlSummary}>
          {filteredCorpora.length} corpora visible · reviewed {integrity.reviewedOn}
        </span>
      </div>

      <div className={styles.translationLedger} role="list" aria-label="Translation provenance by corpus">
        <div className={styles.translationLedgerHeader} aria-hidden="true">
          <span>Legal source</span>
          <span>Original language</span>
          <span>English authority</span>
          <span>Storage / current alignment</span>
        </div>
        {filteredCorpora.map((corpus) => {
          const instrument = instrumentById.get(corpus.instrumentId);
          if (!instrument) return null;
          const storedRatio = corpus.totalUnitCount
            ? (corpus.storedEnglishUnitCount / corpus.totalUnitCount) * 100
            : 0;
          const alignedRatio = corpus.totalUnitCount
            ? (corpus.currentAlignedEnglishUnitCount / corpus.totalUnitCount) * 100
            : 0;
          return (
            <article
              key={corpus.instrumentId}
              className={styles.translationRow}
              data-selected={activeCorpus?.instrumentId === corpus.instrumentId}
              role="listitem"
            >
              <button
                type="button"
                className={styles.translationInstrument}
                onClick={() => setActiveCorpusId(corpus.instrumentId)}
                aria-pressed={activeCorpus?.instrumentId === corpus.instrumentId}
              >
                <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
                <span>
                  <strong>{instrument.shortTitle}</strong>
                  <small>
                    {humanizeResearchCode(instrument.legalForce)} · {humanizeResearchCode(instrument.lifecycleStatus)}
                  </small>
                </span>
              </button>
              <div className={styles.translationLanguage}>
                <span className={styles.mobileFieldLabel}>Original language</span>
                {corpus.originalLanguages.join(" · ")}
              </div>
              <div className={styles.authorityTokens}>
                <span className={styles.mobileFieldLabel}>English authority</span>
                {corpus.authorityClasses.map((authorityClass) => (
                  <span key={authorityClass} data-authority={authorityClass}>
                    {translationAuthorityLabels[authorityClass]}
                  </span>
                ))}
              </div>
              <div className={styles.translationMeasures}>
                <span className={styles.mobileFieldLabel}>Storage / alignment</span>
                <div className={styles.translationMeasure}>
                  <span>
                    Stored {corpus.storedEnglishUnitCount}/{corpus.totalUnitCount}
                  </span>
                  <span className={styles.translationTrack} aria-hidden="true">
                    <span
                      data-measure="stored"
                      style={{ "--translation-width": `${storedRatio}%` } as VisualStyle}
                    />
                  </span>
                </div>
                <div className={styles.translationMeasure}>
                  <span>
                    Current-aligned {corpus.currentAlignedEnglishUnitCount}/{corpus.totalUnitCount}
                  </span>
                  <span className={styles.translationTrack} aria-hidden="true">
                    <span
                      data-measure="aligned"
                      style={{ "--translation-width": `${alignedRatio}%` } as VisualStyle}
                    />
                  </span>
                </div>
                {corpus.temporallyMismatchedEnglishUnitCount > 0 && (
                  <strong className={styles.attentionText}>
                    {corpus.temporallyMismatchedEnglishUnitCount} temporally mismatched
                  </strong>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {activeCorpus && activeInstrument && (
        <section className={styles.translationDetail} aria-live="polite">
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Selected provenance record</span>
              <h3>{activeInstrument.title}</h3>
            </div>
            <button
              type="button"
              className={styles.evidenceButton}
              onClick={() => onOpenInstrument(activeInstrument.id)}
            >
              Open instrument
            </button>
          </header>
          <div className={styles.translationDetailGrid}>
            <section>
              <span className={styles.fieldLabel}>Version basis</span>
              {activeCorpus.versionLabels.map((label) => (
                <p key={label}>{label}</p>
              ))}
            </section>
            <section>
              <span className={styles.fieldLabel}>English status records</span>
              <p>{activeCorpus.translationStatuses.map(humanizeResearchCode).join(" · ")}</p>
            </section>
          </div>
          {activeCorpus.anomalyProvisionIds.length > 0 && (
            <div className={styles.anomalyList}>
              <span className={styles.fieldLabel}>Article-level temporal review targets</span>
              {activeCorpus.anomalyProvisionIds.map((provisionId) => {
                const provision = data.provisions.find(
                  (item) => item.id === provisionId,
                );
                return (
                  <button
                    type="button"
                    key={provisionId}
                    className={styles.evidenceButton}
                    onClick={() => onOpenProvision(provisionId)}
                  >
                    {provision ? `${provision.locator} · ${provision.title}` : provisionId}
                  </button>
                );
              })}
            </div>
          )}
          <div className={styles.sourceLedger}>
            <span className={styles.fieldLabel}>English source records</span>
            {activeCorpus.englishSourceRecords.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ))}
          </div>
        </section>
      )}

      <MethodNote>
        Stored English text is not a translation-quality finding. Official,
        government-reference and project-authored texts remain separate authority
        classes; temporal alignment checks whether the English rendering matches the
        displayed source version, not whether every sentence is substantively accurate.
      </MethodNote>
    </>
  );
}

type BridgeLayer = "reviewed" | "all";

function QualifiedBridgeAtlas({
  data,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const atlas = data.bridgeAtlas;
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const [layer, setLayer] = useState<BridgeLayer>("reviewed");
  const defaultNode =
    atlas.nodes.find((node) => node.reviewedDegree > 0) ?? atlas.nodes[0] ?? null;
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(
    defaultNode?.instrumentId ?? null,
  );
  const activeNodes = atlas.nodes.filter((node) =>
    layer === "reviewed" ? node.reviewedDegree > 0 : node.allDegree > 0,
  );

  const selectedNode =
    activeNodes.find((node) => node.instrumentId === selectedInstrumentId) ??
    activeNodes[0] ??
    null;
  const selectedInstrument = selectedNode
    ? instrumentById.get(selectedNode.instrumentId)
    : null;
  const visibleRelations = data.relations
    .filter(
      (relation) =>
        relation.relationClass === "analytical" &&
        (layer === "all" || relation.status === "editorial-reviewed") &&
        (relation.source.instrumentId === selectedNode?.instrumentId ||
          relation.target.instrumentId === selectedNode?.instrumentId),
    )
    .sort(
      (left, right) =>
        Number(right.status === "editorial-reviewed") -
          Number(left.status === "editorial-reviewed") ||
        left.type.localeCompare(right.type) ||
        left.id.localeCompare(right.id),
    );
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(
    null,
  );

  const selectedRelation =
    visibleRelations.find((relation) => relation.id === selectedRelationId) ??
    visibleRelations[0] ??
    null;
  const maxDegree = Math.max(
    1,
    ...activeNodes.map((node) =>
      layer === "reviewed" ? node.reviewedDegree : node.allDegree,
    ),
  );
  const maxBetweenness = Math.max(
    0.000001,
    ...activeNodes.map((node) =>
      layer === "reviewed" ? node.reviewedBetweenness : node.allBetweenness,
    ),
  );
  const selectedConceptIds = Array.from(
    new Set(visibleRelations.flatMap((relation) => relation.conceptIds)),
  );
  const allRankShiftNodes = [...atlas.nodes]
    .filter((node) => node.reviewedDegree > 0 || node.allDegree > 0)
    .sort(
      (left, right) =>
        Math.abs(right.rankDelta) - Math.abs(left.rankDelta) ||
        left.allRank - right.allRank,
    );
  const rankShiftNodes = allRankShiftNodes.slice(0, 12);
  const rankCount = Math.max(2, atlas.nodes.length);

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>07 / Relation robustness</span>
          <h2>Qualified Bridge Atlas</h2>
          <p>
            Test which instruments bridge the project&apos;s reviewed relation graph and
            how that picture changes when candidate mappings are added.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Evidence layer</span>
          <select
            aria-label="Bridge evidence layer"
            value={layer}
            onChange={(event) => setLayer(event.target.value as BridgeLayer)}
          >
            <option value="reviewed">Editorial-reviewed only</option>
            <option value="all">Reviewed + candidate hypotheses</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Focus instrument</span>
          <select
            aria-label="Bridge focus instrument"
            value={selectedNode?.instrumentId ?? ""}
            onChange={(event) => setSelectedInstrumentId(event.target.value)}
          >
            {activeNodes.map((node) => {
              const instrument = instrumentById.get(node.instrumentId);
              return (
                <option key={node.instrumentId} value={node.instrumentId}>
                  {instrument?.shortTitle ?? node.instrumentId}
                </option>
              );
            })}
          </select>
        </label>
        <span className={styles.controlSummary}>
          {layer === "reviewed"
            ? `${atlas.reviewedRelationCount} reviewed analytical relations`
            : `${atlas.analyticalRelationCount} reviewed and candidate analytical relations`}
        </span>
      </div>

      <section className={styles.bridgeWorkspace}>
        <div
          className={styles.bridgePlot}
          role="group"
          aria-label={`Instrument bridge plot: horizontal position is distinct mapped neighbors and vertical position is normalized betweenness in this project's ${layer === "reviewed" ? "reviewed subgraph" : "recorded reviewed plus candidate relation graph"}`}
        >
          <span className={styles.bridgeAxisY}>
            {layer === "reviewed"
              ? "Reviewed-subgraph betweenness"
              : "Recorded-relation graph betweenness"}
          </span>
          <span className={styles.bridgeAxisX}>Distinct mapped neighbors</span>
          {activeNodes.map((node) => {
            const instrument = instrumentById.get(node.instrumentId);
            if (!instrument) return null;
            const degree =
              layer === "reviewed" ? node.reviewedDegree : node.allDegree;
            const betweenness =
              layer === "reviewed"
                ? node.reviewedBetweenness
                : node.allBetweenness;
            const x = 8 + (degree / maxDegree) * 84;
            const y = 92 - (betweenness / maxBetweenness) * 84;
            const selected = node.instrumentId === selectedNode?.instrumentId;
            return (
              <button
                type="button"
                key={node.instrumentId}
                className={styles.bridgePoint}
                style={{ "--plot-x": `${x}%`, "--plot-y": `${y}%` } as VisualStyle}
                data-selected={selected}
                aria-pressed={selected}
                aria-label={`${instrument.shortTitle}: ${degree} mapped neighbors; ${layer === "reviewed" ? "reviewed-subgraph" : "recorded-relation graph"} normalized betweenness ${betweenness.toFixed(3)}`}
                onClick={() => setSelectedInstrumentId(node.instrumentId)}
              >
                <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
              </button>
            );
          })}
        </div>

        <aside className={styles.bridgeReadout} aria-live="polite">
          {selectedNode && selectedInstrument ? (
            <>
              <div className={styles.bridgeIdentity}>
                <JurisdictionMark
                  jurisdictionId={selectedInstrument.jurisdictionId}
                />
                <div>
                  <span className={styles.sectionCode}>Selected graph node</span>
                  <h3>{selectedInstrument.shortTitle}</h3>
                  <p>
                    {selectedInstrument.jurisdictionName} · {humanizeResearchCode(selectedInstrument.legalForce)} · {humanizeResearchCode(selectedInstrument.lifecycleStatus)}
                  </p>
                </div>
              </div>
              <dl className={styles.bridgeMetrics}>
                <div>
                  <dt>Distinct neighbors</dt>
                  <dd>{layer === "reviewed" ? selectedNode.reviewedDegree : selectedNode.allDegree}</dd>
                </div>
                <div>
                  <dt>Cross-jurisdiction neighbors</dt>
                  <dd>
                    {layer === "reviewed"
                      ? selectedNode.reviewedCrossJurisdictionDegree
                      : selectedNode.allCrossJurisdictionDegree}
                  </dd>
                </div>
                <div>
                  <dt>
                    {layer === "reviewed"
                      ? "Reviewed-subgraph betweenness"
                      : "Recorded-graph betweenness"}
                  </dt>
                  <dd>
                    {(layer === "reviewed"
                      ? selectedNode.reviewedBetweenness
                      : selectedNode.allBetweenness
                    ).toFixed(3)}
                  </dd>
                </div>
                <div>
                  <dt>Graph rank sensitivity</dt>
                  <dd>
                    {selectedNode.reviewedRank} → {selectedNode.allRank}
                  </dd>
                </div>
                <div>
                  <dt>Relations in layer</dt>
                  <dd>{layer === "reviewed" ? selectedNode.reviewedRelationCount : selectedNode.allRelationCount}</dd>
                </div>
                <div>
                  <dt>Curated facet anchors</dt>
                  <dd>{selectedNode.curatedFacetProvisionCount}</dd>
                </div>
              </dl>
              <button
                type="button"
                className={styles.evidenceButton}
                onClick={() => onOpenInstrument(selectedInstrument.id)}
              >
                Open instrument
              </button>
              <span className={styles.fieldLabel}>
                Showing {Math.min(8, selectedConceptIds.length)} of {selectedConceptIds.length} mapped concepts
              </span>
              <div className={styles.conceptLinkRow}>
                {selectedConceptIds.slice(0, 8).map((conceptId) => {
                  const concept = data.concepts.find((item) => item.id === conceptId);
                  if (!concept) return null;
                  return (
                    <button
                      type="button"
                      key={concept.id}
                      className={styles.conceptLink}
                      style={conceptStyle(concept, data.themes)}
                      onClick={() => onOpenConcept(concept.id)}
                    >
                      <ConceptIcon conceptId={concept.id} />
                      <span>{concept.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <span>No graph node is available in this evidence layer.</span>
          )}
        </aside>
      </section>

      <section className={styles.rankShiftSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Candidate-edge sensitivity</span>
            <h3>Rank movement when hypotheses enter the graph</h3>
          </div>
          <p>
            Reviewed rank → reviewed + candidate rank · showing {rankShiftNodes.length} of {allRankShiftNodes.length} nodes
          </p>
        </header>
        <div className={styles.rankShiftList}>
          {rankShiftNodes.map((node) => {
            const instrument = instrumentById.get(node.instrumentId);
            if (!instrument) return null;
            const reviewedPosition =
              ((node.reviewedRank - 1) / (rankCount - 1)) * 100;
            const allPosition = ((node.allRank - 1) / (rankCount - 1)) * 100;
            const lineStart = Math.min(reviewedPosition, allPosition);
            const lineWidth = Math.abs(reviewedPosition - allPosition);
            return (
              <button
                type="button"
                key={node.instrumentId}
                className={styles.rankShiftRow}
                onClick={() => setSelectedInstrumentId(node.instrumentId)}
                aria-label={`${instrument.shortTitle}: reviewed rank ${node.reviewedRank}, reviewed plus candidate rank ${node.allRank}`}
              >
                <span className={styles.rankShiftName}>{instrument.shortTitle}</span>
                <span
                  className={styles.rankShiftTrack}
                  style={
                    {
                      "--rank-start": `${lineStart}%`,
                      "--rank-width": `${lineWidth}%`,
                      "--rank-reviewed": `${reviewedPosition}%`,
                      "--rank-all": `${allPosition}%`,
                    } as VisualStyle
                  }
                  aria-hidden="true"
                >
                  <span className={styles.rankShiftLine} />
                  <span className={styles.rankReviewedDot} />
                  <span className={styles.rankAllDot} />
                </span>
                <span className={styles.rankShiftValue}>
                  {node.reviewedRank} → {node.allRank}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.relationWorkbench}>
        <div className={styles.relationQueue}>
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Recorded evidence</span>
              <h3>{visibleRelations.length} relations at this node</h3>
            </div>
          </header>
          <div className={styles.relationQueueList}>
            {visibleRelations.map((relation) => {
              const peer =
                relation.source.instrumentId === selectedNode?.instrumentId
                  ? relation.target
                  : relation.source;
              return (
                <button
                  type="button"
                  key={relation.id}
                  className={styles.relationQueueButton}
                  data-selected={selectedRelation?.id === relation.id}
                  onClick={() => setSelectedRelationId(relation.id)}
                >
                  <span>
                    {humanizeResearchCode(relation.type)} · {humanizeResearchCode(relation.status)}
                  </span>
                  <strong>{relationEndpointLabel(peer, data)}</strong>
                  <small>{relation.confidence} confidence · {relation.verifiedOn}</small>
                </button>
              );
            })}
          </div>
        </div>
        <RelationEvidenceDossier
          relation={selectedRelation}
          data={data}
          onOpenInstrument={onOpenInstrument}
          onOpenProvision={onOpenProvision}
          onOpenConcept={onOpenConcept}
        />
      </section>

      <MethodNote>
        Betweenness and degree describe this project&apos;s qualified-relation graph,
        not global legal influence, regulatory quality or doctrinal importance.
        Reviewed-only and reviewed-plus-candidate layers remain separate, and the
        graph is an unweighted undirected projection used only to inspect bridge
        sensitivity and editorial attention.
      </MethodNote>
    </>
  );
}

type PathEvidenceLayer = "reviewed" | "all";

function OperationalizationPathways({
  data,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const operational = data.operationalizationPaths;
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const relationById = new Map(
    data.relations.map((relation) => [relation.id, relation]),
  );
  const edgeById = new Map(
    operational.edges.map((edge) => [edge.relationId, edge]),
  );
  const [layer, setLayer] = useState<PathEvidenceLayer>("reviewed");
  const visibleEdges = operational.edges.filter(
    (edge) => layer === "all" || edge.status === "editorial-reviewed",
  );
  const rootIds = Array.from(
    new Set(visibleEdges.map((edge) => edge.sourceInstrumentId)),
  ).sort((left, right) => {
    const leftCount = visibleEdges.filter(
      (edge) => edge.sourceInstrumentId === left,
    ).length;
    const rightCount = visibleEdges.filter(
      (edge) => edge.sourceInstrumentId === right,
    ).length;
    return (
      rightCount - leftCount ||
      (instrumentById.get(left)?.atlasOrder ?? Number.MAX_SAFE_INTEGER) -
        (instrumentById.get(right)?.atlasOrder ?? Number.MAX_SAFE_INTEGER) ||
      left.localeCompare(right)
    );
  });
  const [rootInstrumentId, setRootInstrumentId] = useState<string | null>(
    rootIds[0] ?? null,
  );
  const activeRootInstrumentId = rootIds.includes(rootInstrumentId ?? "")
    ? rootInstrumentId
    : rootIds[0] ?? null;

  const pathsForRoot = operational.paths.filter(
    (path) =>
      path.rootInstrumentId === activeRootInstrumentId &&
      (layer === "all" || path.status === "editorial-reviewed"),
  );
  const allTerminalPaths = pathsForRoot
    .filter(
      (path) =>
        !pathsForRoot.some(
          (other) =>
            other.relationIds.length > path.relationIds.length &&
            path.relationIds.every(
              (relationId, index) => other.relationIds[index] === relationId,
            ),
        ),
    );
  const terminalPaths = allTerminalPaths.slice(0, 12);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(
    null,
  );
  const visibleRelationIds = new Set(
    terminalPaths.flatMap((path) => path.relationIds),
  );
  const activeRelationId =
    selectedRelationId && visibleRelationIds.has(selectedRelationId)
      ? selectedRelationId
      : terminalPaths[0]?.relationIds[0] ?? null;
  const selectedRelation = activeRelationId
    ? relationById.get(activeRelationId) ?? null
    : null;

  function dateForPathNode(path: ResearchLabData["operationalizationPaths"]["paths"][number], index: number) {
    if (index === 0) {
      return edgeById.get(path.relationIds[0])?.sourceDate ?? data.snapshotDate;
    }
    return edgeById.get(path.relationIds[index - 1])?.targetDate ?? data.snapshotDate;
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>08 / Directed legal relations</span>
          <h2>Norm Lineage &amp; Operationalization Paths</h2>
          <p>
            Follow recorded implementation, legal-basis, operational-evidence and
            lifecycle edges without converting them into claims of causal diffusion.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Directed evidence layer</span>
          <select
            aria-label="Operational path evidence layer"
            value={layer}
            onChange={(event) =>
              setLayer(event.target.value as PathEvidenceLayer)
            }
          >
            <option value="reviewed">Editorial-reviewed only</option>
            <option value="all">Reviewed + candidate hypotheses</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Path origin</span>
          <select
            aria-label="Operational path origin"
            value={activeRootInstrumentId ?? ""}
            onChange={(event) => setRootInstrumentId(event.target.value)}
          >
            {rootIds.map((instrumentId) => (
              <option key={instrumentId} value={instrumentId}>
                {instrumentById.get(instrumentId)?.shortTitle ?? instrumentId}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.controlSummary}>
          {layer === "reviewed"
            ? `${operational.reviewedDirectedRelationCount} reviewed directed relations`
            : `${operational.directedRelationCount} directed relations in both review layers`}
        </span>
      </div>

      <section className={styles.pathSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Semantic path lanes</span>
            <h3>
              Showing {terminalPaths.length} of {allTerminalPaths.length} recorded
              paths from the selected origin
            </h3>
          </div>
          <p>Maximum three hops · dates label instrument records, not arrow causation</p>
        </header>
        {terminalPaths.length > 0 ? (
          <div className={styles.pathLaneList} role="list" aria-label="Directed operational relation paths">
            {terminalPaths.map((path) => (
              <div
                key={path.id}
                className={styles.pathLaneScroll}
                role="listitem"
                aria-label={`${path.hopCount}-hop ${path.status} path`}
              >
                <div className={styles.pathLane}>
                  {path.instrumentIds.map((instrumentId, index) => {
                    const instrument = instrumentById.get(instrumentId);
                    const relationId = path.relationIds[index];
                    const edge = relationId ? edgeById.get(relationId) : null;
                    return (
                      <div className={styles.pathSegment} key={`${path.id}-${instrumentId}-${index}`}>
                        <button
                          type="button"
                          className={styles.pathNode}
                          data-category={instrument?.category ?? "instrument"}
                          onClick={() => onOpenInstrument(instrumentId)}
                        >
                          {instrument && (
                            <JurisdictionMark
                              jurisdictionId={instrument.jurisdictionId}
                              small
                            />
                          )}
                          <span>
                            <strong>{instrument?.shortTitle ?? instrumentId}</strong>
                            <small>
                              {dateForPathNode(path, index)} · {instrument ? humanizeResearchCode(instrument.legalForce) : "instrument"} · {instrument ? humanizeResearchCode(instrument.lifecycleStatus) : "status unknown"}
                            </small>
                          </span>
                        </button>
                        {edge && (
                          <button
                            type="button"
                            className={styles.pathEdge}
                            data-selected={activeRelationId === edge.relationId}
                            onClick={() => setSelectedRelationId(edge.relationId)}
                            aria-label={`Inspect ${humanizeResearchCode(edge.type)} relation, ${humanizeResearchCode(edge.status)}`}
                          >
                            <ArrowRight aria-hidden="true" />
                            <span>
                              <strong>{humanizeResearchCode(edge.type)}</strong>
                              <small>{humanizeResearchCode(edge.status)}</small>
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            No directed path is recorded for this origin in the selected evidence
            layer.
          </div>
        )}
      </section>

      <RelationEvidenceDossier
        relation={selectedRelation}
        data={data}
        onOpenInstrument={onOpenInstrument}
        onOpenProvision={onOpenProvision}
        onOpenConcept={onOpenConcept}
      />

      <MethodNote>
        Only explicitly directed relation types are included, and paths stop at three
        hops. An arrow preserves the corpus&apos;s recorded relation semantics; it does not
        prove temporal influence, policy migration, legal hierarchy, equivalent duties
        or causal diffusion. Undirected partial-overlap and soft-law-alignment edges are
        intentionally excluded.
      </MethodNote>
    </>
  );
}

const archetypeColors = [
  "var(--cyan)",
  "var(--violet)",
  "var(--amber)",
  "var(--green)",
  "var(--red)",
  "color-mix(in srgb, var(--cyan) 50%, var(--green))",
  "color-mix(in srgb, var(--violet) 52%, var(--red))",
  "color-mix(in srgb, var(--amber) 52%, var(--cyan))",
] as const;

function archetypeStyle(index: number): VisualStyle {
  return {
    "--cluster-color": archetypeColors[index % archetypeColors.length],
  };
}

function InstrumentArchetypes({
  data,
  onOpenInstrument,
  onOpenConcept,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const model = data.instrumentArchetypes;
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const conceptById = new Map(
    data.concepts.map((concept) => [concept.id, concept]),
  );
  const orderedThemes = [...data.themes].sort(
    (left, right) => left.order - right.order,
  );
  const defaultPartition =
    model.partitions.find((partition) => partition.clusterCount === 5) ??
    model.partitions[0] ??
    null;
  const [clusterCount, setClusterCount] = useState(
    defaultPartition?.clusterCount ?? 2,
  );
  const partition =
    model.partitions.find((item) => item.clusterCount === clusterCount) ??
    defaultPartition;
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    defaultPartition?.clusters[0]?.id ?? null,
  );
  const selectedCluster =
    partition?.clusters.find((cluster) => cluster.id === selectedClusterId) ??
    partition?.clusters[0] ??
    null;
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<
    string | null
  >(selectedCluster?.medoidInstrumentId ?? null);
  const activeInstrumentId =
    selectedCluster?.memberInstrumentIds.includes(selectedInstrumentId ?? "")
      ? selectedInstrumentId
      : selectedCluster?.medoidInstrumentId ?? null;
  const activeInstrument = activeInstrumentId
    ? instrumentById.get(activeInstrumentId)
    : null;
  const sensitivity = model.sensitivity.find(
    (item) => item.instrumentId === activeInstrumentId,
  );
  const maximumDifference = Math.max(
    0.000001,
    ...(selectedCluster?.differentiatingConcepts.map((item) =>
      Math.abs(item.difference),
    ) ?? [0]),
  );
  const selectedClusterIndex = Math.max(
    0,
    partition?.clusters.findIndex((cluster) => cluster.id === selectedCluster?.id) ??
      0,
  );

  function themeProfile(
    cluster: NonNullable<typeof selectedCluster>,
  ): Array<{ theme: ResearchLabTheme; weight: number }> {
    const weightByConcept = new Map(
      cluster.centroidWeights.map((item) => [item.conceptId, item.weight]),
    );
    return orderedThemes.map((theme) => ({
      theme,
      weight: theme.conceptIds.reduce(
        (sum, conceptId) => sum + (weightByConcept.get(conceptId) ?? 0),
        0,
      ),
    }));
  }

  function selectCluster(clusterId: string, medoidInstrumentId: string) {
    setSelectedClusterId(clusterId);
    setSelectedInstrumentId(medoidInstrumentId);
  }

  if (!partition || !selectedCluster) {
    return (
      <div className={styles.emptyState}>
        No non-zero complete-corpus concept profiles are available for exploratory
        grouping.
      </div>
    );
  }
  const partitionThemeMaximum = Math.max(
    0.000001,
    ...partition.clusters.flatMap((cluster) =>
      themeProfile(cluster).map((item) => item.weight),
    ),
  );

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>09 / Exploratory profile model</span>
          <h2>Instrument Archetypes</h2>
          <p>
            Explore deterministic clusters in the complete-corpus concept profiles,
            then test whether each instrument&apos;s nearest neighbour changes under a
            prevalence-only feature model.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <label className={classNames(styles.field, styles.clusterRangeField)}>
          <span className={styles.fieldLabel}>
            Exploratory dendrogram cut · {partition.clusterCount} clusters
          </span>
          <input
            type="range"
            min={model.partitions[0]?.clusterCount ?? 2}
            max={model.partitions.at(-1)?.clusterCount ?? 8}
            step={1}
            value={partition.clusterCount}
            aria-label="Exploratory archetype cluster count"
            aria-valuetext={`${partition.clusterCount} clusters`}
            onChange={(event) => setClusterCount(Number(event.target.value))}
          />
        </label>
        <span className={styles.controlSummary}>
          {model.fitInstrumentIds.length} complete instruments · {model.featureConceptIds.length}{" "}
          concept dimensions · {model.excludedInstrumentIds.length} selected or
          unsupported records excluded from fit
        </span>
      </div>

      <div className={styles.themeProfileLegend} aria-label="Theme profile legend">
        {orderedThemes.map((theme, index) => (
          <span key={theme.id}>
            <i
              style={{ "--theme-color": themeColors[index % themeColors.length] } as VisualStyle}
              aria-hidden="true"
            />
            {theme.label}
          </span>
        ))}
      </div>

      <section className={styles.archetypeWorkspace}>
        <div className={styles.archetypeLaneList}>
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Average-linkage solution</span>
              <h3>{partition.clusterCount} neutral archetype groups</h3>
            </div>
            <p>
              Cut distance {partition.cutHeight.toFixed(3)} · mean silhouette{" "}
              {partition.meanSilhouette === null
                ? "N/A"
                : partition.meanSilhouette.toFixed(3)}{" "}
              across {partition.silhouetteInstrumentCount} non-singleton members
            </p>
          </header>

          {partition.clusters.map((cluster, clusterIndex) => {
            const profile = themeProfile(cluster);
            const medoid = instrumentById.get(cluster.medoidInstrumentId);
            return (
              <article
                key={cluster.id}
                className={styles.archetypeLane}
                style={archetypeStyle(clusterIndex)}
                data-selected={cluster.id === selectedCluster.id}
              >
                <button
                  type="button"
                  className={styles.archetypeLaneHeader}
                  aria-pressed={cluster.id === selectedCluster.id}
                  onClick={() =>
                    selectCluster(cluster.id, cluster.medoidInstrumentId)
                  }
                >
                  <span className={styles.archetypeId}>{cluster.id}</span>
                  <span>
                    <strong>{cluster.memberInstrumentIds.length} instruments</strong>
                    <small>
                      Medoid {medoid?.shortTitle ?? cluster.medoidInstrumentId}
                    </small>
                  </span>
                </button>
                <div
                  className={styles.themeProfile}
                  role="img"
                  aria-label={`${cluster.id} theme centroid profile`}
                >
                  {profile.map((item, themeIndex) => (
                    <span
                      key={item.theme.id}
                      style={
                        {
                          "--theme-color":
                            themeColors[themeIndex % themeColors.length],
                          "--theme-height": `${Math.max(
                            8,
                            (item.weight / partitionThemeMaximum) * 100,
                          )}%`,
                        } as VisualStyle
                      }
                      aria-label={`${item.theme.label}: centroid weight ${item.weight.toFixed(3)}`}
                    />
                  ))}
                </div>
                <div className={styles.archetypeMembers}>
                  {cluster.memberInstrumentIds.map((instrumentId) => {
                    const instrument = instrumentById.get(instrumentId);
                    return (
                      <button
                        type="button"
                        key={instrumentId}
                        aria-pressed={activeInstrumentId === instrumentId}
                        onClick={() => {
                          setSelectedClusterId(cluster.id);
                          setSelectedInstrumentId(instrumentId);
                        }}
                      >
                        {instrument?.shortTitle ?? instrumentId}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <aside
          className={styles.archetypeDossier}
          style={archetypeStyle(selectedClusterIndex)}
          aria-live="polite"
        >
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Selected computation group</span>
              <h3>{selectedCluster.id}</h3>
            </div>
            <p>Neutral identifier · not a legal-family label</p>
          </header>

          <dl className={styles.bridgeMetrics}>
            <div>
              <dt>Members</dt>
              <dd>{selectedCluster.memberInstrumentIds.length}</dd>
            </div>
            <div>
              <dt>Jurisdiction records</dt>
              <dd>{selectedCluster.jurisdictionCount}</dd>
            </div>
            <div>
              <dt>Mean within-cluster distance</dt>
              <dd>{selectedCluster.meanWithinDistance.toFixed(3)}</dd>
            </div>
            <div>
              <dt>Maximum pair distance</dt>
              <dd>{selectedCluster.maximumWithinDistance.toFixed(3)}</dd>
            </div>
          </dl>

          <section className={styles.archetypeDifferenceSection}>
            <span className={styles.fieldLabel}>
              Largest {Math.min(7, selectedCluster.differentiatingConcepts.length)} of {selectedCluster.differentiatingConcepts.length} centroid differences from the complete-corpus mean
            </span>
            <div className={styles.archetypeDifferenceList}>
              {selectedCluster.differentiatingConcepts
                .slice(0, 7)
                .map((difference) => {
                  const concept = conceptById.get(difference.conceptId);
                  const direction = difference.difference >= 0 ? "higher" : "lower";
                  return (
                    <div
                      key={difference.conceptId}
                      className={styles.archetypeDifferenceRow}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenConcept(difference.conceptId)}
                      >
                        {concept?.label ?? difference.conceptId}
                      </button>
                      <span
                        className={styles.archetypeDifferenceTrack}
                        aria-label={`${concept?.label ?? difference.conceptId}: ${direction} than corpus mean by ${Math.abs(difference.difference).toFixed(3)}`}
                      >
                        <span
                          data-direction={direction}
                          style={
                            {
                              "--difference-width": `${
                                (Math.abs(difference.difference) /
                                  maximumDifference) *
                                50
                              }%`,
                            } as VisualStyle
                          }
                        />
                      </span>
                      <code>
                        {difference.difference >= 0 ? "+" : ""}
                        {difference.difference.toFixed(3)}
                      </code>
                    </div>
                  );
                })}
            </div>
          </section>

          <section className={styles.archetypeContext}>
            <div>
              <span className={styles.fieldLabel}>Legal force · descriptive only</span>
              <p>
                {selectedCluster.legalForceComposition
                  .map(
                    (item) => `${humanizeResearchCode(item.value)} ${item.count}`,
                  )
                  .join(" · ")}
              </p>
            </div>
            <div>
              <span className={styles.fieldLabel}>Lifecycle · descriptive only</span>
              <p>
                {selectedCluster.lifecycleComposition
                  .map(
                    (item) => `${humanizeResearchCode(item.value)} ${item.count}`,
                  )
                  .join(" · ")}
              </p>
            </div>
          </section>

          {activeInstrument && (
            <section className={styles.archetypeInstrumentReadout}>
              <div className={styles.bridgeIdentity}>
                <JurisdictionMark
                  jurisdictionId={activeInstrument.jurisdictionId}
                />
                <div>
                  <span className={styles.sectionCode}>Selected member</span>
                  <h3>{activeInstrument.shortTitle}</h3>
                  <p>{activeInstrument.title}</p>
                </div>
              </div>
              {sensitivity && (
                <dl className={styles.sensitivityGrid}>
                  <div>
                    <dt>L2 TF-IDF nearest neighbour</dt>
                    <dd>
                      {instrumentById.get(sensitivity.tfidfNeighborId)?.shortTitle ??
                        sensitivity.tfidfNeighborId}
                      <small>
                        cosine distance {sensitivity.tfidfNeighborDistance.toFixed(3)}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Prevalence nearest neighbour</dt>
                    <dd>
                      {instrumentById.get(sensitivity.prevalenceNeighborId)
                        ?.shortTitle ?? sensitivity.prevalenceNeighborId}
                      <small>
                        cosine distance{" "}
                        {sensitivity.prevalenceNeighborDistance.toFixed(3)}
                      </small>
                    </dd>
                  </div>
                </dl>
              )}
              <p className={styles.sensitivityFinding}>
                {sensitivity?.sameNearestNeighbor
                  ? "Nearest-neighbour identity is unchanged under the two recorded feature models."
                  : "Nearest-neighbour identity changes when TF-IDF is replaced by concept prevalence."}
              </p>
              <button
                type="button"
                className={styles.evidenceButton}
                onClick={() => onOpenInstrument(activeInstrument.id)}
              >
                Open instrument and supporting provisions
              </button>
            </section>
          )}
        </aside>
      </section>

      <MethodNote>
        Archetypes are exploratory groups in this project&apos;s 23-concept taxonomy,
        not legal families, equivalence classes, regulatory rankings or compliance
        findings. Only complete corpora with non-zero substantive profiles fit the
        model. Jurisdiction, legal force, lifecycle and relation edges do not enter the
        distance calculation. The adjustable cut has no preferred or legally correct
        value; silhouette describes geometric separation, not legal validity.
      </MethodNote>
    </>
  );
}

type MappingAuditStatus = "all" | "editorial-reviewed" | "candidate";
type MappingAuditClass = "all" | "analytical" | "lifecycle";

function MappingEvidenceAudit({
  data,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const audit = data.mappingEvidenceAudit;
  const relationById = new Map(
    data.relations.map((relation) => [relation.id, relation]),
  );
  const instrumentById = new Map(
    data.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const conceptById = new Map(
    data.concepts.map((concept) => [concept.id, concept]),
  );
  const [statusFilter, setStatusFilter] =
    useState<MappingAuditStatus>("all");
  const [classFilter, setClassFilter] = useState<MappingAuditClass>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conceptFilter, setConceptFilter] = useState("all");
  const filteredRecords = audit.records.filter(
    (record) =>
      (statusFilter === "all" || record.status === statusFilter) &&
      (classFilter === "all" || record.relationClass === classFilter) &&
      (typeFilter === "all" || record.type === typeFilter) &&
      (conceptFilter === "all" || record.conceptIds.includes(conceptFilter)),
  );
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(
    audit.records[0]?.relationId ?? null,
  );
  const selectedRecord =
    filteredRecords.find(
      (record) => record.relationId === selectedRelationId,
    ) ??
    filteredRecords[0] ??
    null;
  const selectedRelation = selectedRecord
    ? relationById.get(selectedRecord.relationId) ?? null
    : null;
  const maximumConceptRelationCount = Math.max(
    1,
    ...audit.concepts.map((item) => item.totalRelationCount),
  );

  function endpointContext(
    instrumentId: string | null,
    legalForce: string | null,
    lifecycleStatus: string | null,
    coverageClass: string | null,
  ) {
    const instrument = instrumentId ? instrumentById.get(instrumentId) : null;
    return [
      instrument?.shortTitle ?? instrumentId ?? "unresolved endpoint",
      legalForce ? humanizeResearchCode(legalForce) : "legal force unknown",
      lifecycleStatus
        ? humanizeResearchCode(lifecycleStatus)
        : "lifecycle unknown",
      coverageClass ? `${coverageClass} corpus` : "coverage unknown",
    ].join(" · ");
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>10 / Editorial evidence audit</span>
          <h2>Mapping Evidence Audit</h2>
          <p>
            Inspect every recorded mapping as a bundle of separate evidence dimensions,
            with candidate hypotheses kept distinct from editorial-reviewed relations.
          </p>
        </div>
      </header>

      <div className={styles.controlBar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Review state</span>
          <select
            aria-label="Mapping audit review state"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as MappingAuditStatus)
            }
          >
            <option value="all">Reviewed + candidate</option>
            <option value="editorial-reviewed">Editorial-reviewed</option>
            <option value="candidate">Candidate hypotheses</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Relation class</span>
          <select
            aria-label="Mapping audit relation class"
            value={classFilter}
            onChange={(event) =>
              setClassFilter(event.target.value as MappingAuditClass)
            }
          >
            <option value="all">Analytical + lifecycle</option>
            <option value="analytical">Analytical</option>
            <option value="lifecycle">Lifecycle</option>
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Relation type</span>
          <select
            aria-label="Mapping audit relation type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">All recorded types</option>
            {audit.relationTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {humanizeResearchCode(item.value)} ({item.count})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Core concept</span>
          <select
            aria-label="Mapping audit core concept"
            value={conceptFilter}
            onChange={(event) => setConceptFilter(event.target.value)}
          >
            <option value="all">All concepts</option>
            {data.concepts.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.label}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.controlSummary} aria-live="polite">
          {filteredRecords.length} of {audit.relationCount} recorded relations
        </span>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Editorial-reviewed</span>
          <strong className={styles.statValue}>
            {formatter.format(audit.reviewedRelationCount)}
          </strong>
          <span className={styles.statMeta}>Research review state, not legal approval</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Candidate hypotheses</span>
          <strong className={styles.statValue}>
            {formatter.format(audit.candidateRelationCount)}
          </strong>
          <span className={styles.statMeta}>Awaiting editorial resolution</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Cross-jurisdiction records</span>
          <strong className={styles.statValue}>
            {formatter.format(audit.crossJurisdictionRelationCount)}
          </strong>
          <span className={styles.statMeta}>Based on resolved instrument endpoints</span>
        </article>
        <article className={styles.stat}>
          <span className={styles.statLabel}>Unresolved endpoints</span>
          <strong className={styles.statValue}>
            {formatter.format(audit.unresolvedEndpointCount)}
          </strong>
          <span className={styles.statMeta}>Resolution failure, not legal absence</span>
        </article>
      </div>

      <section className={styles.auditConceptSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Concept × review-state coverage</span>
            <h3>Where the mapping layer has recorded evidence</h3>
          </div>
          <p>Solid = editorial-reviewed · outline = candidate · blank = not recorded</p>
        </header>
        <div className={styles.auditConceptGrid}>
          {audit.concepts.map((item) => {
            const concept = conceptById.get(item.conceptId);
            const selected = conceptFilter === item.conceptId;
            return (
              <button
                type="button"
                key={item.conceptId}
                className={styles.auditConceptRow}
                aria-pressed={selected}
                data-empty={item.totalRelationCount === 0}
                onClick={() =>
                  setConceptFilter(selected ? "all" : item.conceptId)
                }
              >
                <span className={styles.auditConceptIdentity}>
                  {concept && <ConceptIcon conceptId={concept.id} />}
                  <strong>{concept?.label ?? item.conceptId}</strong>
                </span>
                <span
                  className={styles.auditConceptTrack}
                  aria-label={`${item.reviewedRelationCount} editorial-reviewed and ${item.candidateRelationCount} candidate relations`}
                >
                  {item.totalRelationCount > 0 ? (
                    <span
                      className={styles.auditConceptBar}
                      style={
                        {
                          "--audit-total-width": `${
                            (item.totalRelationCount /
                              maximumConceptRelationCount) *
                            100
                          }%`,
                          "--audit-reviewed-share": `${
                            (item.reviewedRelationCount /
                              item.totalRelationCount) *
                            100
                          }%`,
                        } as VisualStyle
                      }
                    >
                      <i data-review="reviewed" />
                      <i data-review="candidate" />
                    </span>
                  ) : (
                    <span className={styles.auditConceptEmpty}>
                      No relation recorded in this corpus
                    </span>
                  )}
                </span>
                <code>
                  {item.reviewedRelationCount} / {item.candidateRelationCount}
                </code>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.auditTableSection}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionCode}>Evidence barcode</span>
            <h3>{filteredRecords.length} relations in the current audit view</h3>
          </div>
          <p>Each column is independent; no composite quality score is calculated</p>
        </header>
        <div
          className={styles.auditTableScroll}
          role="region"
          aria-label="Scrollable mapping evidence audit table"
        >
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th scope="col">Relation</th>
                <th scope="col">Review</th>
                <th scope="col">Class · direction</th>
                <th scope="col">Sources</th>
                <th scope="col">Basis · rationale · limits</th>
                <th scope="col">Endpoint corpus</th>
                <th scope="col">Jurisdiction span</th>
                <th scope="col">Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const relation = relationById.get(record.relationId);
                const selected = selectedRecord?.relationId === record.relationId;
                return (
                  <tr key={record.relationId} data-selected={selected}>
                    <th scope="row">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedRelationId(record.relationId)}
                      >
                        <strong>{humanizeResearchCode(record.type)}</strong>
                        <span>
                          {relation
                            ? `${relationEndpointLabel(relation.source, data)} ${record.directionality === "directed" ? "→" : "↔"} ${relationEndpointLabel(relation.target, data)}`
                            : record.relationId}
                        </span>
                      </button>
                    </th>
                    <td>
                      <span
                        className={styles.auditState}
                        data-review={record.status}
                      >
                        <i aria-hidden="true" />
                        {humanizeResearchCode(record.status)}
                      </span>
                    </td>
                    <td>
                      {humanizeResearchCode(record.relationClass)} ·{" "}
                      {humanizeResearchCode(record.directionality)}
                    </td>
                    <td className={styles.auditSourceCount}>
                      {record.sourceSupportCount}
                    </td>
                    <td>
                      <span
                        className={styles.auditFacetStrip}
                        aria-label={`Evidence basis ${record.hasEvidenceBasis ? "recorded" : "not recorded"}; rationale ${record.hasRationale ? "recorded" : "not recorded"}; limits ${record.hasLimits ? "recorded" : "not recorded"}`}
                      >
                        <i data-recorded={record.hasEvidenceBasis}>B</i>
                        <i data-recorded={record.hasRationale}>R</i>
                        <i data-recorded={record.hasLimits}>L</i>
                      </span>
                    </td>
                    <td>{humanizeResearchCode(record.endpointCoverage)}</td>
                    <td>
                      {record.crossJurisdiction === null
                        ? "unknown"
                        : record.crossJurisdiction
                          ? "cross-jurisdiction"
                          : "same jurisdiction lane"}
                    </td>
                    <td>{record.hasVerifiedOn ? record.verifiedOn : "not recorded"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div className={styles.emptyState}>
              No mapping is recorded for this filter combination in the current
              corpus. This does not establish that no legal relationship exists.
            </div>
          )}
        </div>
      </section>

      {selectedRecord && (
        <section className={styles.auditSelectedContext} aria-live="polite">
          <header className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionCode}>Selected audit dimensions</span>
              <h3>{humanizeResearchCode(selectedRecord.type)}</h3>
            </div>
            <p>{selectedRecord.relationId}</p>
          </header>
          <dl className={styles.auditFacetGrid}>
            <div>
              <dt>Review state</dt>
              <dd>{humanizeResearchCode(selectedRecord.status)}</dd>
            </div>
            <div>
              <dt>Editorial confidence</dt>
              <dd>{selectedRecord.confidence} · research utility</dd>
            </div>
            <div>
              <dt>Direction</dt>
              <dd>{humanizeResearchCode(selectedRecord.directionality)}</dd>
            </div>
            <div>
              <dt>Source support</dt>
              <dd>{selectedRecord.sourceSupportCount} records</dd>
            </div>
            <div>
              <dt>Endpoint corpus</dt>
              <dd>{humanizeResearchCode(selectedRecord.endpointCoverage)}</dd>
            </div>
            <div>
              <dt>Jurisdiction span</dt>
              <dd>
                {selectedRecord.crossJurisdiction === null
                  ? "unknown"
                  : selectedRecord.crossJurisdiction
                    ? "cross-jurisdiction"
                    : "same jurisdiction lane"}
              </dd>
            </div>
            <div>
              <dt>Endpoint A context</dt>
              <dd>
                {endpointContext(
                  selectedRecord.sourceInstrumentId,
                  selectedRecord.sourceLegalForce,
                  selectedRecord.sourceLifecycleStatus,
                  selectedRecord.sourceCoverageClass,
                )}
              </dd>
            </div>
            <div>
              <dt>Endpoint B context</dt>
              <dd>
                {endpointContext(
                  selectedRecord.targetInstrumentId,
                  selectedRecord.targetLegalForce,
                  selectedRecord.targetLifecycleStatus,
                  selectedRecord.targetCoverageClass,
                )}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <RelationEvidenceDossier
        relation={selectedRelation}
        data={data}
        onOpenInstrument={onOpenInstrument}
        onOpenProvision={onOpenProvision}
        onOpenConcept={onOpenConcept}
      />

      <MethodNote>
        The audit reports review state, relation semantics, source support, endpoint
        coverage and lifecycle context as separate observations. Editorial-reviewed
        does not mean independently peer-reviewed, legally correct or mutually
        compliant; confidence describes research usefulness, not an equivalence
        probability. A blank concept row means no relation is recorded in this corpus,
        not that no relationship exists in law.
      </MethodNote>
    </>
  );
}

function ApplicabilityHorizon({
  data,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const horizon = data.applicabilityHorizon;
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    [data.concepts],
  );
  const provisionGroupById = useMemo(
    () =>
      new Map(
        horizon.provisionDateGroups.map((group) => [group.id, group]),
      ),
    [horizon.provisionDateGroups],
  );
  const statusEventById = useMemo(
    () => new Map(horizon.statusEvents.map((event) => [event.id, event])),
    [horizon.statusEvents],
  );
  const futureGroups = horizon.provisionDateGroups.filter(
    (group) => group.temporalStatus === "future",
  );
  const futureEvents = horizon.statusEvents.filter(
    (event) => event.temporalStatus === "future",
  );
  const horizonDates = useMemo(
    () =>
      Array.from(
        new Set([
          horizon.snapshotDate,
          ...futureGroups.map((group) => group.date),
          ...futureEvents.map((event) => event.date),
        ]),
      ).sort(),
    [futureEvents, futureGroups, horizon.snapshotDate],
  );
  const [horizonIndex, setHorizonIndex] = useState(0);

  const selectedHorizonIndex = Math.min(
    horizonIndex,
    Math.max(0, horizonDates.length - 1),
  );
  const selectedDate =
    horizonDates[selectedHorizonIndex] ??
    horizon.snapshotDate;
  const startTime = Date.parse(`${horizon.snapshotDate}T00:00:00Z`);
  const endDate = horizonDates.at(-1) ?? horizon.snapshotDate;
  const endTime = Date.parse(`${endDate}T00:00:00Z`);
  const timeSpan = Math.max(1, endTime - startTime);
  const datePosition = (date: string) => {
    const value = Date.parse(`${date}T00:00:00Z`);
    return Math.max(0, Math.min(100, ((value - startTime) / timeSpan) * 100));
  };
  const activeGroups = futureGroups.filter((group) => group.date <= selectedDate);
  const activeEvents = futureEvents.filter((event) => event.date <= selectedDate);
  const activeProvisionCount = activeGroups.reduce(
    (sum, group) => sum + group.provisionCount,
    0,
  );
  const activeConceptCounts = new Map<string, number>();
  activeGroups.forEach((group) => {
    group.conceptCounts.forEach(({ conceptId, provisionCount }) => {
      activeConceptCounts.set(
        conceptId,
        (activeConceptCounts.get(conceptId) ?? 0) + provisionCount,
      );
    });
  });
  const allLeadingConcepts = [...activeConceptCounts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  const leadingConcepts = allLeadingConcepts.slice(0, 6);
  const lanes = horizon.instruments
    .filter(
      (instrument) =>
        instrument.futureProvisionCount > 0 ||
        instrument.statusEventIds.some(
          (eventId) => statusEventById.get(eventId)?.temporalStatus === "future",
        ),
    )
    .sort((left, right) => {
      const leftInstrument = instrumentById.get(left.instrumentId);
      const rightInstrument = instrumentById.get(right.instrumentId);
      return (
        (leftInstrument?.atlasOrder ?? 999) -
          (rightInstrument?.atlasOrder ?? 999) ||
        (leftInstrument?.shortTitle ?? left.instrumentId).localeCompare(
          rightInstrument?.shortTitle ?? right.instrumentId,
        )
      );
    });
  const cursorPosition = datePosition(selectedDate);

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>11 / Explicit future dates</span>
          <h2>Applicability Horizon</h2>
          <p>
            Move through recorded future commencement dates without converting
            them into a prediction of complete legal applicability.
          </p>
        </div>
      </header>

      <div className={styles.applicabilityWorkspace}>
        <div className={styles.applicabilityControls}>
          <label className={classNames(styles.field, styles.rangeField)}>
            <span className={styles.fieldLabel}>Selected horizon</span>
            <span className={styles.rangeValue}>
              <strong>{formatDate(selectedDate)}</strong>
              <span>
                {selectedHorizonIndex} of {Math.max(0, horizonDates.length - 1)} recorded
                future date steps
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, horizonDates.length - 1)}
              step={1}
              value={selectedHorizonIndex}
              aria-label="Selected applicability horizon"
              aria-valuetext={`${formatDate(selectedDate)}; step ${selectedHorizonIndex} of ${Math.max(0, horizonDates.length - 1)} recorded future date steps`}
              onChange={(event) => setHorizonIndex(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className={styles.actionButton}
            disabled={selectedHorizonIndex === 0}
            onClick={() => setHorizonIndex(0)}
          >
            <RotateCcw aria-hidden="true" />
            Snapshot date
          </button>
        </div>

        <section
          className={styles.applicabilitySummary}
          aria-label={`Recorded change through ${formatDate(selectedDate)}`}
        >
          <div>
            <span className={styles.fieldLabel}>Recorded through horizon</span>
            <strong>
              {formatter.format(activeProvisionCount)} provisions · {formatter.format(activeEvents.length)} instrument events
            </strong>
          </div>
          <div className={styles.applicabilityConcepts}>
            {leadingConcepts.length ? (
              <>
              <span className={styles.fieldLabel}>
                Showing {leadingConcepts.length} of {allLeadingConcepts.length} recorded
                concepts
              </span>
              {leadingConcepts.map(([conceptId, count]) => {
                const concept = conceptById.get(conceptId);
                if (!concept) return null;
                return (
                  <button
                    type="button"
                    key={conceptId}
                    className={styles.conceptLink}
                    style={conceptStyle(concept, data.themes)}
                    onClick={() => onOpenConcept(conceptId)}
                  >
                    <ConceptIcon conceptId={conceptId} />
                    <span>{concept.label}</span>
                    <code>{count}</code>
                  </button>
                );
              })}
              </>
            ) : (
              <span className={styles.statMeta}>
                No provision-level commencement falls within this horizon.
              </span>
            )}
          </div>
        </section>

        {lanes.length ? (
          <>
          <p id="applicability-scroll-hint" className={styles.scrollHint}>
            This timeline is wider than the panel. Focus it, then scroll horizontally
            to inspect later dates; instrument names remain pinned.
          </p>
          <div
            className={styles.applicabilityScroll}
            role="region"
            tabIndex={0}
            aria-label="Scrollable applicability horizon"
            aria-describedby="applicability-scroll-hint"
          >
            <div
              className={styles.applicabilityFigure}
              role="group"
              aria-label={`Explicit future provision and instrument dates from ${formatDate(horizon.snapshotDate)} through ${formatDate(endDate)}`}
            >
              <div className={styles.applicabilityAxis} aria-hidden="true">
                <span className={styles.applicabilityAxisCorner}>Instrument</span>
                <span className={styles.applicabilityAxisTrack}>
                  <span className={styles.applicabilityAxisStart}>
                    {formatDate(horizon.snapshotDate)}
                  </span>
                  <i
                    className={styles.applicabilityCursor}
                    style={
                      { "--horizon-cursor": `${cursorPosition}%` } as VisualStyle
                    }
                  />
                  <span className={styles.applicabilityAxisEnd}>
                    {formatDate(endDate)}
                  </span>
                </span>
              </div>
              <div className={styles.applicabilityLaneList}>
                {lanes.map((lane) => {
                  const instrument = instrumentById.get(lane.instrumentId);
                  if (!instrument) return null;
                  const groups = lane.provisionDateGroupIds
                    .map((groupId) => provisionGroupById.get(groupId))
                    .filter(
                      (group): group is NonNullable<typeof group> =>
                        Boolean(group && group.temporalStatus === "future"),
                    );
                  const events = lane.statusEventIds
                    .map((eventId) => statusEventById.get(eventId))
                    .filter(
                      (event): event is NonNullable<typeof event> =>
                        Boolean(event && event.temporalStatus === "future"),
                    );
                  return (
                    <div
                      key={lane.instrumentId}
                      className={styles.applicabilityLane}
                      data-coverage={lane.coverageClass}
                    >
                      <button
                        type="button"
                        className={styles.applicabilityLaneLabel}
                        onClick={() => onOpenInstrument(lane.instrumentId)}
                      >
                        <JurisdictionMark
                          jurisdictionId={instrument.jurisdictionId}
                        />
                        <span>
                          <strong>{instrument.shortTitle}</strong>
                          <small>
                            {humanizeResearchCode(lane.coverageClass)} corpus
                          </small>
                        </span>
                      </button>
                      <div className={styles.applicabilityTrack}>
                        <i
                          className={styles.applicabilityCursor}
                          aria-hidden="true"
                          style={
                            {
                              "--horizon-cursor": `${cursorPosition}%`,
                            } as VisualStyle
                          }
                        />
                        {groups.map((group) => (
                          <button
                            type="button"
                            key={group.id}
                            className={styles.applicabilityMarker}
                            data-kind="provision"
                            data-beyond={group.date > selectedDate}
                            style={
                              {
                                "--horizon-position": `${datePosition(group.date)}%`,
                              } as VisualStyle
                            }
                            aria-label={`${instrument.shortTitle}: ${group.provisionCount} provisions with recorded applicability date ${formatDate(group.date)}`}
                            onClick={() =>
                              group.provisionIds.length === 1
                                ? onOpenProvision(group.provisionIds[0])
                                : onOpenInstrument(group.instrumentId)
                            }
                          >
                            <span>{group.provisionCount}</span>
                          </button>
                        ))}
                        {events.map((event) => (
                          <button
                            type="button"
                            key={event.id}
                            className={styles.applicabilityMarker}
                            data-kind="status"
                            data-beyond={event.date > selectedDate}
                            style={
                              {
                                "--horizon-position": `${datePosition(event.date)}%`,
                              } as VisualStyle
                            }
                            aria-label={`${instrument.shortTitle}: ${event.label}, ${formatDate(event.date)}`}
                            onClick={() => onOpenInstrument(event.instrumentId)}
                          >
                            <span className={styles.srOnly}>{event.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            No explicit future dates are recorded after this corpus snapshot.
          </div>
        )}

        <div className={styles.applicabilityLegend} aria-label="Timeline legend">
          <span data-kind="provision"><i /> Provision-level date group</span>
          <span data-kind="status"><i /> Instrument lifecycle event</span>
          <span data-beyond="true"><i /> Beyond selected horizon</span>
        </div>

        <section className={styles.applicabilityUnresolved}>
          <span className={styles.fieldLabel}>Dates not placed on the timeline</span>
          <p>
            {formatter.format(horizon.missingProvisionDateCount)} provisions have
            no recorded applicability date; {formatter.format(horizon.unresolvedProvisionDateCount)} provision dates and {formatter.format(horizon.unresolvedStatusEvents.length)} lifecycle dates could not be resolved.
          </p>
        </section>
      </div>

      <MethodNote>
        The horizon plots only explicit, machine-resolvable dates recorded in the
        corpus. A marker can describe a provision date or an instrument-level event;
        neither establishes that every obligation in the instrument is active on
        the selected date. Missing and unresolved dates remain visible as corpus
        limits.
      </MethodNote>
    </>
  );
}

function ArticleConceptMicroscope({
  data,
  defaultInstrumentIds,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  data: ResearchLabData;
  defaultInstrumentIds?: string[];
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenProvision: ResearchLabProps["onOpenProvision"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const microscope = data.articleMicroscope;
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    [data.concepts],
  );
  const initialInstrumentId =
    defaultInstrumentIds?.find((id) =>
      microscope.instruments.some((instrument) => instrument.instrumentId === id),
    ) ??
    microscope.instruments.find((instrument) => instrument.instrumentId === "eu-gdpr")
      ?.instrumentId ??
    microscope.instruments.find((instrument) => instrument.coverageClass === "complete")
      ?.instrumentId ??
    microscope.instruments[0]?.instrumentId ??
    "";
  const [instrumentId, setInstrumentId] = useState(initialInstrumentId);
  const profile =
    microscope.instruments.find((instrument) => instrument.instrumentId === instrumentId) ??
    microscope.instruments[0];
  const [selectedProvisionId, setSelectedProvisionId] = useState(
    profile?.bands.find((band) => band.relevance === "substantive-topic")
      ?.provisionId ??
      profile?.bands[0]?.provisionId ??
      "",
  );
  const microscopeListboxId = useId();
  const microscopeListboxRef = useRef<HTMLDivElement>(null);

  const effectiveSelectedProvisionId = profile?.bands.some(
    (band) => band.provisionId === selectedProvisionId,
  )
    ? selectedProvisionId
    : profile?.bands.find((band) => band.relevance === "substantive-topic")
        ?.provisionId ??
      profile?.bands[0]?.provisionId ??
      "";
  const selectedBand =
    profile?.bands.find(
      (band) => band.provisionId === effectiveSelectedProvisionId,
    ) ??
    profile?.bands[0];
  const selectedBandIndex = Math.max(
    0,
    profile?.bands.findIndex(
      (band) => band.provisionId === effectiveSelectedProvisionId,
    ) ?? 0,
  );
  const instrument = profile ? instrumentById.get(profile.instrumentId) : null;
  const completeProfiles = microscope.instruments.filter(
    (item) => item.coverageClass === "complete",
  );
  const selectedProfiles = microscope.instruments.filter(
    (item) => item.coverageClass !== "complete",
  );

  function selectMicroscopeBand(index: number) {
    if (!profile?.bands.length) return;
    const nextIndex = Math.max(0, Math.min(profile.bands.length - 1, index));
    setSelectedProvisionId(profile.bands[nextIndex].provisionId);
    window.requestAnimationFrame(() => {
      microscopeListboxRef.current
        ?.querySelectorAll<HTMLElement>('[role="option"]')
        [nextIndex]?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleMicroscopeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!profile?.bands.length) return;
    let nextIndex = selectedBandIndex;
    if (event.key === "ArrowDown") nextIndex += 1;
    else if (event.key === "ArrowUp") nextIndex -= 1;
    else if (event.key === "PageDown") nextIndex += 10;
    else if (event.key === "PageUp") nextIndex -= 10;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = profile.bands.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selectedBand) onOpenProvision(selectedBand.provisionId);
      return;
    } else return;

    event.preventDefault();
    selectMicroscopeBand(nextIndex);
  }

  if (!profile || !instrument) {
    return <div className={styles.emptyState}>No provision profiles are available.</div>;
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>12 / Provision structure</span>
          <h2>Article Concept Microscope</h2>
          <p>
            Read an instrument as a source-ordered sequence of provisions and inspect
            where recorded governance concepts occur.
          </p>
        </div>
      </header>

      <div className={styles.microscopeWorkspace}>
        <div className={styles.microscopePicker}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Instrument</span>
            <select
              value={profile.instrumentId}
              aria-label="Microscope instrument"
              onChange={(event) => {
                const nextInstrumentId = event.target.value;
                const nextProfile = microscope.instruments.find(
                  (item) => item.instrumentId === nextInstrumentId,
                );
                setInstrumentId(nextInstrumentId);
                setSelectedProvisionId(
                  nextProfile?.bands.find(
                    (band) => band.relevance === "substantive-topic",
                  )?.provisionId ??
                    nextProfile?.bands[0]?.provisionId ??
                    "",
                );
              }}
            >
              <optgroup label="Complete corpus">
                {completeProfiles.map((item) => {
                  const optionInstrument = instrumentById.get(item.instrumentId);
                  return (
                    <option key={item.instrumentId} value={item.instrumentId}>
                      {optionInstrument?.shortTitle ?? item.instrumentId}
                    </option>
                  );
                })}
              </optgroup>
              {selectedProfiles.length > 0 && (
                <optgroup label="Selected / partial corpus">
                  {selectedProfiles.map((item) => {
                    const optionInstrument = instrumentById.get(item.instrumentId);
                    return (
                      <option key={item.instrumentId} value={item.instrumentId}>
                        {optionInstrument?.shortTitle ?? item.instrumentId}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </label>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onOpenInstrument(profile.instrumentId)}
          >
            Open instrument <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className={styles.microscopeFigure}>
          <section className={styles.microscopeStripFrame}>
            <div className={styles.microscopeIdentity}>
              <JurisdictionMark
                jurisdictionId={instrument.jurisdictionId}
              />
              <span>
                <strong>{instrument.shortTitle}</strong>
                <small>
                  {formatter.format(profile.totalProvisionCount)} provisions · {humanizeResearchCode(profile.coverageClass)} corpus
                </small>
              </span>
            </div>
            <p
              id={`${microscopeListboxId}-instructions`}
              className={styles.microscopeKeyboardHint}
            >
              Use ↑/↓, Page Up/Page Down, Home or End to select one provision.
              Press Enter to open it.
            </p>
            <div
              id={microscopeListboxId}
              ref={microscopeListboxRef}
              className={styles.microscopeStrip}
              role="listbox"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label={`${instrument.shortTitle} provision sequence`}
              aria-describedby={`${microscopeListboxId}-instructions`}
              aria-activedescendant={`${microscopeListboxId}-option-${selectedBandIndex}`}
              onKeyDown={handleMicroscopeKeyDown}
            >
              {profile.bands.map((band, index) => {
                const leadConcept = conceptById.get(band.conceptIds[0]);
                const priorBand = profile.bands[index - 1];
                const density = profile.maximumConceptAssignmentCount
                  ? band.conceptAssignmentCount /
                    profile.maximumConceptAssignmentCount
                  : 0;
                return (
                  <div
                    id={`${microscopeListboxId}-option-${index}`}
                    key={band.provisionId}
                    className={styles.microscopeProvision}
                    role="option"
                    aria-selected={
                      band.provisionId === effectiveSelectedProvisionId
                    }
                    data-relevance={band.relevance}
                    data-selected={
                      band.provisionId === effectiveSelectedProvisionId
                    }
                    data-structure-start={
                      index === 0 || priorBand?.structureId !== band.structureId
                    }
                    data-annotation={band.hasActorTags || band.hasScopeTags}
                    style={
                      {
                        "--concept-color": leadConcept
                          ? conceptColor(leadConcept, data.themes)
                          : "var(--muted)",
                        "--concept-density": density,
                      } as VisualStyle
                    }
                    aria-label={`${band.locator}: ${band.title}; ${band.conceptAssignmentCount} recorded concepts; ${humanizeResearchCode(band.relevance)}`}
                    onMouseEnter={() => setSelectedProvisionId(band.provisionId)}
                    onClick={() => setSelectedProvisionId(band.provisionId)}
                  >
                    <span className={styles.srOnly}>{band.locator}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.microscopeLegend}>
              <span data-relevance="substantive-topic"><i /> Substantive</span>
              <span data-relevance="structural-context"><i /> Structural</span>
              <span data-relevance="unreviewed"><i /> Unreviewed</span>
            </div>
          </section>

          <section className={styles.microscopeReadout} aria-live="polite">
            {selectedBand && (
              <>
                <header className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionCode}>Selected provision</span>
                    <h3>{selectedBand.locator}</h3>
                  </div>
                  <p>{selectedBand.title}</p>
                </header>
                <div className={styles.microscopeSelectionAction}>
                  <span>
                    Current provision · {selectedBandIndex + 1} of {profile.bands.length}
                  </span>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => onOpenProvision(selectedBand.provisionId)}
                  >
                    Open {selectedBand.locator} <ArrowRight aria-hidden="true" />
                  </button>
                </div>
                <div className={styles.microscopeConcepts}>
                  {selectedBand.conceptIds.length ? (
                    selectedBand.conceptIds.map((conceptId) => {
                      const concept = conceptById.get(conceptId);
                      if (!concept) return null;
                      return (
                        <button
                          type="button"
                          key={conceptId}
                          className={styles.conceptLink}
                          style={conceptStyle(concept, data.themes)}
                          onClick={() => onOpenConcept(conceptId)}
                        >
                          <ConceptIcon conceptId={conceptId} />
                          <span>{concept.label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <span className={styles.statMeta}>
                      No concept assignment is recorded for this provision.
                    </span>
                  )}
                </div>
              </>
            )}

            <div className={styles.microscopeConceptTracks}>
              <span className={styles.fieldLabel}>Concept spans in source order</span>
              {profile.conceptTracks.map((track) => {
                const concept = conceptById.get(track.conceptId);
                if (!concept) return null;
                const denominator = Math.max(1, profile.totalProvisionCount - 1);
                const start = (track.firstIndex / denominator) * 100;
                const end = (track.lastIndex / denominator) * 100;
                return (
                  <button
                    type="button"
                    key={track.conceptId}
                    className={styles.microscopeConceptTrack}
                    style={conceptStyle(concept, data.themes)}
                    onClick={() => onOpenConcept(track.conceptId)}
                  >
                    <span>{concept.label}</span>
                    <i className={styles.microscopeConceptRail}>
                      <i
                        className={styles.microscopeConceptSpan}
                        style={
                          {
                            "--concept-start": `${start}%`,
                            "--concept-end": `${end}%`,
                          } as VisualStyle
                        }
                      />
                    </i>
                    <code>{track.provisionCount}</code>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <MethodNote>
        Color and intensity encode recorded concept assignments, not legal
        importance. A blank or unreviewed provision means the annotation is absent
        or pending in this corpus; it does not establish that the provision lacks
        relevance. Selected and partial corpora remain explicitly labelled.
      </MethodNote>
    </>
  );
}

function NeighborhoodStability({
  data,
  defaultInstrumentIds,
  onOpenInstrument,
  onOpenConcept,
}: {
  data: ResearchLabData;
  defaultInstrumentIds?: string[];
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
  onOpenConcept: ResearchLabProps["onOpenConcept"];
}) {
  const neighborhoods = data.neighborhoodStability;
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    [data.concepts],
  );
  const initialInstrumentId =
    defaultInstrumentIds?.find((id) => neighborhoods.fitInstrumentIds.includes(id)) ??
    (neighborhoods.fitInstrumentIds.includes("eu-gdpr") ? "eu-gdpr" : null) ??
    neighborhoods.fitInstrumentIds[0] ??
    "";
  const [instrumentId, setInstrumentId] = useState(initialInstrumentId);
  const record =
    neighborhoods.records.find((item) => item.instrumentId === instrumentId) ??
    neighborhoods.records[0];
  const rankedCandidates = useMemo(
    () =>
      record
        ? [...record.candidates].sort(
            (left, right) =>
              Math.min(left.cosine.baseRank, left.hellinger.baseRank) -
                Math.min(right.cosine.baseRank, right.hellinger.baseRank) ||
              left.neighborInstrumentId.localeCompare(right.neighborInstrumentId),
          )
        : [],
    [record],
  );
  const [selectedNeighborId, setSelectedNeighborId] = useState(
    rankedCandidates[0]?.neighborInstrumentId ?? "",
  );

  if (!record) {
    return <div className={styles.emptyState}>No complete-corpus neighborhoods are available.</div>;
  }

  const focalInstrument = instrumentById.get(record.instrumentId);
  const effectiveSelectedNeighborId = rankedCandidates.some(
    (candidate) => candidate.neighborInstrumentId === selectedNeighborId,
  )
    ? selectedNeighborId
    : rankedCandidates[0]?.neighborInstrumentId ?? "";
  const selectedCandidate =
    rankedCandidates.find(
      (candidate) =>
        candidate.neighborInstrumentId === effectiveSelectedNeighborId,
    ) ?? rankedCandidates[0];
  const maximumRank = Math.max(1, neighborhoods.fitInstrumentIds.length - 1);
  const rankPosition = (rank: number) =>
    maximumRank <= 1 ? 0 : ((rank - 1) / (maximumRank - 1)) * 100;
  const displayedCandidates = rankedCandidates.slice(0, 12);

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>13 / Robust neighborhoods</span>
          <h2>Neighborhood Stability</h2>
          <p>
            Compare nearest regulatory profiles under two distance measures and
            {" "}{neighborhoods.themeOmissionCount} leave-one-theme-out perturbations.
          </p>
        </div>
      </header>

      <div className={styles.neighborhoodWorkspace}>
        <label className={classNames(styles.field, styles.neighborhoodPicker)}>
          <span className={styles.fieldLabel}>Focal complete corpus</span>
          <select
            value={record.instrumentId}
            aria-label="Focal complete-corpus instrument"
            onChange={(event) => {
              const nextInstrumentId = event.target.value;
              const nextRecord = neighborhoods.records.find(
                (item) => item.instrumentId === nextInstrumentId,
              );
              const nextCandidate = nextRecord
                ? [...nextRecord.candidates].sort(
                    (left, right) =>
                      Math.min(left.cosine.baseRank, left.hellinger.baseRank) -
                      Math.min(right.cosine.baseRank, right.hellinger.baseRank),
                  )[0]
                : null;
              setInstrumentId(nextInstrumentId);
              setSelectedNeighborId(nextCandidate?.neighborInstrumentId ?? "");
            }}
          >
            {neighborhoods.fitInstrumentIds.map((id) => (
              <option key={id} value={id}>
                {instrumentById.get(id)?.shortTitle ?? id}
              </option>
            ))}
          </select>
        </label>

        <section className={styles.neighborhoodSummary}>
          <div>
            <span className={styles.fieldLabel}>Nearest-neighbor agreement</span>
            <strong>
              {record.sameNearestNeighbor
                ? `Both measures select ${instrumentById.get(record.cosineNearestNeighborId)?.shortTitle ?? record.cosineNearestNeighborId}`
                : `Cosine: ${instrumentById.get(record.cosineNearestNeighborId)?.shortTitle ?? record.cosineNearestNeighborId} · Hellinger: ${instrumentById.get(record.hellingerNearestNeighborId)?.shortTitle ?? record.hellingerNearestNeighborId}`}
            </strong>
          </div>
          <div>
            <span className={styles.fieldLabel}>Theme-omission retention</span>
            <strong>
              Cosine {record.cosineNearestStabilityCount}/{neighborhoods.themeOmissionCount} · Hellinger {record.hellingerNearestStabilityCount}/{neighborhoods.themeOmissionCount}
            </strong>
          </div>
        </section>

        <div className={styles.neighborhoodLegend} aria-label="Neighborhood plot legend">
          <span data-metric="cosine"><i /> Cosine rank</span>
          <span data-metric="hellinger"><i /> Hellinger rank</span>
          <span data-metric="range"><i /> Leave-one-theme-out rank range · metric-specific</span>
        </div>

        <span className={styles.fieldLabel}>
          Showing {displayedCandidates.length} of {rankedCandidates.length} ranked
          neighbors
        </span>

        <section
          className={styles.neighborhoodPlot}
          aria-label={`Neighbor ranks for ${focalInstrument?.shortTitle ?? record.instrumentId}`}
        >
          {displayedCandidates.map((candidate) => {
            const neighbor = instrumentById.get(candidate.neighborInstrumentId);
            const cosineRangeStart = rankPosition(
              candidate.cosine.leaveOneThemeOutMinimumRank,
            );
            const cosineRangeEnd = rankPosition(
              candidate.cosine.leaveOneThemeOutMaximumRank,
            );
            const hellingerRangeStart = rankPosition(
              candidate.hellinger.leaveOneThemeOutMinimumRank,
            );
            const hellingerRangeEnd = rankPosition(
              candidate.hellinger.leaveOneThemeOutMaximumRank,
            );
            return (
              <div
                key={candidate.neighborInstrumentId}
                className={styles.neighborhoodRow}
                data-selected={
                  candidate.neighborInstrumentId === effectiveSelectedNeighborId
                }
              >
                <button
                  type="button"
                  className={styles.neighborhoodIdentity}
                  aria-pressed={
                    candidate.neighborInstrumentId === effectiveSelectedNeighborId
                  }
                  onClick={() => setSelectedNeighborId(candidate.neighborInstrumentId)}
                >
                  {neighbor && (
                    <JurisdictionMark
                      jurisdictionId={neighbor.jurisdictionId}
                    />
                  )}
                  <span>
                    <strong>{neighbor?.shortTitle ?? candidate.neighborInstrumentId}</strong>
                    <small>
                      C {candidate.cosine.baseRank} · H {candidate.hellinger.baseRank}
                    </small>
                  </span>
                </button>
                <div
                  className={styles.neighborhoodTrack}
                  role="img"
                  aria-label={`${neighbor?.shortTitle ?? candidate.neighborInstrumentId}: cosine rank ${candidate.cosine.baseRank} with leave-one-theme-out range ${candidate.cosine.leaveOneThemeOutMinimumRank} to ${candidate.cosine.leaveOneThemeOutMaximumRank}; Hellinger rank ${candidate.hellinger.baseRank} with range ${candidate.hellinger.leaveOneThemeOutMinimumRank} to ${candidate.hellinger.leaveOneThemeOutMaximumRank}`}
                >
                  <i
                    className={styles.neighborhoodRange}
                    data-metric="cosine"
                    style={
                      {
                        "--neighbor-range-start": `${cosineRangeStart}%`,
                        "--neighbor-range-width": `${Math.max(0, cosineRangeEnd - cosineRangeStart)}%`,
                      } as VisualStyle
                    }
                  />
                  <i
                    className={styles.neighborhoodRange}
                    data-metric="hellinger"
                    style={
                      {
                        "--neighbor-range-start": `${hellingerRangeStart}%`,
                        "--neighbor-range-width": `${Math.max(0, hellingerRangeEnd - hellingerRangeStart)}%`,
                      } as VisualStyle
                    }
                  />
                  <i
                    className={styles.neighborhoodMarker}
                    data-metric="cosine"
                    style={
                      {
                        "--neighbor-cosine-position": `${rankPosition(candidate.cosine.baseRank)}%`,
                      } as VisualStyle
                    }
                  />
                  <i
                    className={styles.neighborhoodMarker}
                    data-metric="hellinger"
                    style={
                      {
                        "--neighbor-hellinger-position": `${rankPosition(candidate.hellinger.baseRank)}%`,
                      } as VisualStyle
                    }
                  />
                </div>
                <span className={styles.neighborhoodRank}>
                  C {candidate.cosine.leaveOneThemeOutMinimumRank}–{candidate.cosine.leaveOneThemeOutMaximumRank} · H {candidate.hellinger.leaveOneThemeOutMinimumRank}–{candidate.hellinger.leaveOneThemeOutMaximumRank}
                </span>
              </div>
            );
          })}
        </section>

        {selectedCandidate && (
          <section className={styles.neighborhoodReadout} aria-live="polite">
            <header className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionCode}>Selected neighbor</span>
                <h3>
                  {instrumentById.get(selectedCandidate.neighborInstrumentId)?.shortTitle ??
                    selectedCandidate.neighborInstrumentId}
                </h3>
              </div>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onOpenInstrument(selectedCandidate.neighborInstrumentId)}
              >
                Open instrument <ArrowRight aria-hidden="true" />
              </button>
            </header>
            <div className={styles.neighborhoodContributors}>
              {(
                [
                  ["Cosine distance contributors", selectedCandidate.cosineContributors],
                  ["Hellinger distance contributors", selectedCandidate.hellingerContributors],
                ] as const
              ).map(([label, contributors]) => (
                <section key={label}>
                  <span className={styles.fieldLabel}>{label}</span>
                  <div className={styles.neighborhoodContributorList}>
                    {contributors.map((contributor) => {
                      const concept = conceptById.get(contributor.conceptId);
                      if (!concept) return null;
                      return (
                        <button
                          type="button"
                          key={`${label}-${contributor.conceptId}`}
                          className={styles.conceptLink}
                          style={conceptStyle(concept, data.themes)}
                          onClick={() => onOpenConcept(contributor.conceptId)}
                        >
                          <ConceptIcon conceptId={contributor.conceptId} />
                          <span>{concept.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        )}
      </div>

      <MethodNote>
        Rank 1 means nearest within the {formatter.format(neighborhoods.fitInstrumentIds.length)} complete-corpus profiles. The two bands preserve the separate cosine and Hellinger rank ranges after omitting each theme once. Distances are not legal-equivalence or compliance scores; selected and partial corpora are excluded from fitting rather than treated as zeros. The plot shows the 12 candidates with the best baseline rank under either metric; every candidate remains present in the derivation.
      </MethodNote>
    </>
  );
}

function GranularityCorpusBias({
  data,
  onOpenInstrument,
}: {
  data: ResearchLabData;
  onOpenInstrument: ResearchLabProps["onOpenInstrument"];
}) {
  const audit = data.granularityAudit;
  const instrumentById = useMemo(
    () => new Map(data.instruments.map((instrument) => [instrument.id, instrument])),
    [data.instruments],
  );
  const maximumProvisionCount = Math.max(
    1,
    ...audit.instruments.map((instrument) => instrument.totalProvisionCount),
  );
  const maximumConceptDensity = Math.max(
    1,
    ...audit.instruments.map(
      (instrument) =>
        instrument.conceptAssignmentsPerSubstantiveProvision ?? 0,
    ),
  );
  const coverageOrder = ["complete", "selected", "unclassified"] as const;
  const coverageLabels = {
    complete: "Complete corpora",
    selected: "Selected / partial corpora",
    unclassified: "Unclassified coverage",
  } as const;

  function measure(
    id: string,
    value: number | null,
    maximum: number,
    display: string,
    ariaLabel: string,
  ) {
    const width = value === null ? 0 : Math.max(0, Math.min(100, (value / maximum) * 100));
    return (
      <div
        className={styles.granularityMeasure}
        data-measure={id}
        role="cell"
        aria-label={ariaLabel}
      >
        <span className={styles.granularityTrack} aria-hidden="true">
          <i
            className={styles.granularityFill}
            style={{ "--granularity-value": `${width}%` } as VisualStyle}
          />
        </span>
        <span className={styles.granularityValue}>{display}</span>
      </div>
    );
  }

  return (
    <>
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.sectionCode}>14 / Measurement limits</span>
          <h2>Granularity + Corpus Bias</h2>
          <p>
            Compare drafting granularity and annotation coverage on shared scales
            before interpreting counts, clusters or mappings.
          </p>
        </div>
      </header>

      <div className={styles.granularityWorkspace}>
        <div className={styles.granularityLegend}>
          <span><i data-scale="count" /> Shared maximum within each count or density column</span>
          <span><i data-scale="coverage" /> Shared 0–100% annotation coverage scale</span>
        </div>
        <p id="granularity-scroll-hint" className={styles.scrollHint}>
          This comparison table is wider than the panel. Focus it, then scroll
          horizontally; the header and instrument column remain pinned.
        </p>
        <div
          className={styles.granularityScroll}
          role="region"
          tabIndex={0}
          aria-label="Scrollable granularity and corpus-bias table"
          aria-describedby="granularity-scroll-hint"
        >
          <div className={styles.granularityPlot} role="table" aria-label="Instrument granularity and corpus annotation coverage">
            <div className={styles.granularityHeader} role="row">
              <span role="columnheader">Instrument</span>
              <span role="columnheader">Provision records</span>
              <span role="columnheader">Concept assignments / substantive provision</span>
              <span role="columnheader">Structural-context share</span>
              <span role="columnheader">Stored text</span>
              <span role="columnheader">Actor tags recorded</span>
              <span role="columnheader">Scope tags recorded</span>
              <span role="columnheader">Applicability date recorded</span>
            </div>
            {coverageOrder.map((coverageClass) => {
              const summary = audit.coverageClasses.find(
                (item) => item.coverageClass === coverageClass,
              );
              const instruments = audit.instruments
                .filter((item) => item.coverageClass === coverageClass)
                .sort((left, right) => {
                  const leftInstrument = instrumentById.get(left.instrumentId);
                  const rightInstrument = instrumentById.get(right.instrumentId);
                  return (
                    (leftInstrument?.atlasOrder ?? 999) -
                      (rightInstrument?.atlasOrder ?? 999) ||
                    (leftInstrument?.shortTitle ?? left.instrumentId).localeCompare(
                      rightInstrument?.shortTitle ?? right.instrumentId,
                    )
                  );
                });
              if (!instruments.length) return null;
              return (
                <section
                  key={coverageClass}
                  className={styles.granularityGroup}
                  data-coverage={coverageClass}
                  role="rowgroup"
                  aria-label={coverageLabels[coverageClass]}
                >
                  <div className={styles.granularityGroupHeader} role="row">
                    <strong role="rowheader">{coverageLabels[coverageClass]}</strong>
                    <span role="cell">
                      {formatter.format(summary?.instrumentCount ?? instruments.length)} instruments · {formatter.format(summary?.provisionCount ?? 0)} provision records
                    </span>
                  </div>
                  {instruments.map((item) => {
                    const instrument = instrumentById.get(item.instrumentId);
                    const conceptDensity =
                      item.conceptAssignmentsPerSubstantiveProvision;
                    return (
                      <div
                        key={item.instrumentId}
                        className={styles.granularityRow}
                        data-coverage={coverageClass}
                        role="row"
                      >
                        <div className={styles.granularityInstrumentCell} role="rowheader">
                          <button
                            type="button"
                            className={styles.granularityInstrument}
                            onClick={() => onOpenInstrument(item.instrumentId)}
                          >
                            {instrument && (
                              <JurisdictionMark
                                jurisdictionId={instrument.jurisdictionId}
                              />
                            )}
                            <span>
                              <strong>{instrument?.shortTitle ?? item.instrumentId}</strong>
                              <small>
                                {formatter.format(item.substantiveProvisionCount)} substantive · {formatter.format(item.structuralContextCount)} structural
                              </small>
                            </span>
                          </button>
                        </div>
                        {measure(
                          "provisions",
                          item.totalProvisionCount,
                          maximumProvisionCount,
                          formatter.format(item.totalProvisionCount),
                          `${instrument?.shortTitle ?? item.instrumentId}: ${formatter.format(item.totalProvisionCount)} provision records`,
                        )}
                        {measure(
                          "concept-density",
                          conceptDensity,
                          maximumConceptDensity,
                          conceptDensity === null ? "N/A" : conceptDensity.toFixed(2),
                          `${instrument?.shortTitle ?? item.instrumentId}: ${conceptDensity === null ? "not available" : conceptDensity.toFixed(2)} concept assignments per substantive provision`,
                        )}
                        {measure(
                          "structural-share",
                          item.structuralContextShare,
                          1,
                          `${(item.structuralContextShare * 100).toFixed(1)}%`,
                          `${instrument?.shortTitle ?? item.instrumentId}: structural-context records are ${(item.structuralContextShare * 100).toFixed(1)} percent of provision records`,
                        )}
                        {measure(
                          "stored-text",
                          item.textCoverage.storedTextCoveragePercent,
                          100,
                          `${item.textCoverage.storedTextCoveragePercent.toFixed(1)}%`,
                          `${instrument?.shortTitle ?? item.instrumentId}: stored text recorded for ${item.textCoverage.storedTextCoveragePercent.toFixed(1)} percent of provision records`,
                        )}
                        {measure(
                          "actor-tags",
                          item.annotationCoverage.actorTags.coveragePercent,
                          100,
                          `${item.annotationCoverage.actorTags.coveragePercent.toFixed(1)}%`,
                          `${instrument?.shortTitle ?? item.instrumentId}: actor tags recorded on ${item.annotationCoverage.actorTags.recordedProvisionCount} of ${item.totalProvisionCount} provisions`,
                        )}
                        {measure(
                          "scope-tags",
                          item.annotationCoverage.scopeTags.coveragePercent,
                          100,
                          `${item.annotationCoverage.scopeTags.coveragePercent.toFixed(1)}%`,
                          `${instrument?.shortTitle ?? item.instrumentId}: scope tags recorded on ${item.annotationCoverage.scopeTags.recordedProvisionCount} of ${item.totalProvisionCount} provisions`,
                        )}
                        {measure(
                          "applicability",
                          item.annotationCoverage.appliesFrom.coveragePercent,
                          100,
                          `${item.annotationCoverage.appliesFrom.coveragePercent.toFixed(1)}%`,
                          `${instrument?.shortTitle ?? item.instrumentId}: applicability date recorded on ${item.annotationCoverage.appliesFrom.recordedProvisionCount} of ${item.totalProvisionCount} provisions, including ${item.annotationCoverage.appliesFrom.unresolvedProvisionCount} unresolved values`,
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <MethodNote>
        Each column has one shared scale across all displayed instruments; unlike
        units are never combined into a score. Complete and selected corpora are
        separated. Text coverage reports storage completeness but does not compare
        document length across languages. Low actor, scope or applicability coverage
        means the annotation is not recorded here—it is not evidence that the law
        contains no relevant actor, scope condition or commencement rule.
      </MethodNote>
    </>
  );
}

export function ResearchLab({
  data,
  initialView = "observatory",
  initialCoverageScope = "complete",
  initialRelevanceScope = "substantive",
  defaultInstrumentIds,
  onViewChange,
  onCoverageScopeChange,
  onRelevanceScopeChange,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: ResearchLabProps) {
  const [activeView, setActiveView] = useState<ResearchLabView>(initialView);
  const [activePhase, setActivePhase] = useState<ResearchLabPhase>(
    viewDefinitions.find((definition) => definition.id === initialView)?.phase ??
      "patterns",
  );
  const [coverageScope, setCoverageScope] =
    useState<CoverageScope>(initialCoverageScope);
  const [relevanceScope, setRelevanceScope] =
    useState<RelevanceScope>(initialRelevanceScope);
  const [shareStatus, setShareStatus] = useState("");
  const [lastViewByPhase, setLastViewByPhase] = useState<
    Record<ResearchLabPhase, ResearchLabView>
  >({
    patterns:
      viewDefinitions.find((definition) => definition.id === initialView)?.phase ===
      "patterns"
        ? initialView
        : "observatory",
    relations:
      viewDefinitions.find((definition) => definition.id === initialView)?.phase ===
      "relations"
        ? initialView
        : "translation",
    models:
      viewDefinitions.find((definition) => definition.id === initialView)?.phase ===
      "models"
        ? initialView
        : "archetypes",
    dynamics:
      viewDefinitions.find((definition) => definition.id === initialView)?.phase ===
      "dynamics"
        ? initialView
        : "horizon",
  });
  const phaseViewDefinitions = viewDefinitions.filter(
    (definition) => definition.phase === activePhase,
  );
  const phaseMetadata: Record<
    ResearchLabPhase,
    { code: string; title: string; description: string }
  > = {
    patterns: {
      code: "PHASE 01",
      title: "Corpus patterns",
      description:
        "Explore corpus quality, regulatory fingerprints, document structure, concept associations and legal change through evidence-linked views.",
    },
    relations: {
      code: "PHASE 02",
      title: "Provenance + relations",
      description:
        "Audit multilingual provenance, relation-graph robustness and directed legal operationalization through source-linked views.",
    },
    models: {
      code: "PHASE 03",
      title: "Models + evidence audit",
      description:
        "Interrogate exploratory instrument groupings and audit every mapping across separate, inspectable evidence dimensions.",
    },
    dynamics: {
      code: "PHASE 04",
      title: "Dynamics + measurement",
      description:
        "Examine explicit future applicability, provision-level concept structure, neighborhood robustness and corpus measurement limits.",
    },
  };
  const activePhaseMetadata = phaseMetadata[activePhase];

  function activatePhase(phase: ResearchLabPhase) {
    if (phase === activePhase) return;
    const nextView = lastViewByPhase[phase];
    setLastViewByPhase((current) => ({
      ...current,
      [activePhase]: activeView,
    }));
    setActivePhase(phase);
    setActiveView(nextView);
    onViewChange?.(nextView);
  }

  function activateView(view: ResearchLabView) {
    setActiveView(view);
    setLastViewByPhase((current) => ({
      ...current,
      [activePhase]: view,
    }));
    onViewChange?.(view);
  }

  function changeCoverageScope(scope: CoverageScope) {
    setCoverageScope(scope);
    onCoverageScopeChange?.(scope);
  }

  function changeRelevanceScope(scope: RelevanceScope) {
    setRelevanceScope(scope);
    onRelevanceScopeChange?.(scope);
  }

  function handlePhaseKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentPhase: ResearchLabPhase,
  ) {
    const currentIndex = researchPhaseOrder.indexOf(currentPhase);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % researchPhaseOrder.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (currentIndex - 1 + researchPhaseOrder.length) % researchPhaseOrder.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = researchPhaseOrder.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextPhase = researchPhaseOrder[nextIndex];
    activatePhase(nextPhase);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>("button")
      [nextIndex]?.focus();
  }

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentView: ResearchLabView,
  ) {
    const currentIndex = phaseViewDefinitions.findIndex(
      (definition) => definition.id === currentView,
    );
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % phaseViewDefinitions.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + phaseViewDefinitions.length) %
        phaseViewDefinitions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = phaseViewDefinitions.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const next = phaseViewDefinitions[nextIndex];
    activateView(next.id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  }

  async function copyResearchLink() {
    try {
      const url = new URL(window.location.href);
      url.hash = buildResearchLabShareHash(url.hash, {
        view: activeView,
        coverageScope,
        relevanceScope,
      });
      url.searchParams.delete("researchView");
      url.searchParams.delete("researchPhase");
      url.searchParams.delete("researchCoverage");
      url.searchParams.delete("researchRelevance");
      await navigator.clipboard.writeText(url.toString());
      setShareStatus("Research view link copied.");
    } catch {
      setShareStatus("Link copying is unavailable in this browser.");
    }
  }

  function exportResearchData() {
    const payload = buildResearchLabExportPayload(data, {
      phase: activePhase,
      view: activeView,
      coverageScope,
      relevanceScope,
    });
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
      type: "application/json;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${data.snapshotDate}-${activeView}-research-lab.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    setShareStatus("Research view dataset exported.");
  }

  return (
    <article
      className={classNames(styles.lab, "research-lab-view")}
      data-testid="research-lab"
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>
            COMPUTATIONAL LEGAL RESEARCH / {activePhaseMetadata.code}
          </span>
          <h1>Research Lab</h1>
          <p>{activePhaseMetadata.description}</p>
        </div>
        <div className={styles.headerTools}>
          <div className={styles.snapshot}>
            <span>DATA SNAPSHOT</span>
            <strong>{data.snapshotDate}</strong>
            <span>
              {formatter.format(data.coverage.summary.provisionCount)} records
            </span>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerAction}
              onClick={copyResearchLink}
            >
              <Link2 aria-hidden="true" /> Copy link
            </button>
            <button
              type="button"
              className={styles.headerAction}
              onClick={exportResearchData}
            >
              <Download aria-hidden="true" /> Export view dataset
            </button>
          </div>
          <span className={styles.headerStatus} aria-live="polite">
            {shareStatus}
          </span>
        </div>
      </header>

      <div
        className={styles.phaseSwitch}
        role="group"
        aria-label="Research phase"
      >
        <button
          type="button"
          aria-pressed={activePhase === "patterns"}
          tabIndex={activePhase === "patterns" ? 0 : -1}
          onClick={() => activatePhase("patterns")}
          onKeyDown={(event) => handlePhaseKeyDown(event, "patterns")}
        >
          <span>Phase 01</span>
          <strong>Corpus patterns</strong>
        </button>
        <button
          type="button"
          aria-pressed={activePhase === "relations"}
          tabIndex={activePhase === "relations" ? 0 : -1}
          onClick={() => activatePhase("relations")}
          onKeyDown={(event) => handlePhaseKeyDown(event, "relations")}
        >
          <span>Phase 02</span>
          <strong>Provenance + relations</strong>
        </button>
        <button
          type="button"
          aria-pressed={activePhase === "models"}
          tabIndex={activePhase === "models" ? 0 : -1}
          onClick={() => activatePhase("models")}
          onKeyDown={(event) => handlePhaseKeyDown(event, "models")}
        >
          <span>Phase 03</span>
          <strong>Models + evidence audit</strong>
        </button>
        <button
          type="button"
          aria-pressed={activePhase === "dynamics"}
          tabIndex={activePhase === "dynamics" ? 0 : -1}
          onClick={() => activatePhase("dynamics")}
          onKeyDown={(event) => handlePhaseKeyDown(event, "dynamics")}
        >
          <span>Phase 04</span>
          <strong>Dynamics + measurement</strong>
        </button>
      </div>

      <nav
        className={styles.tabList}
        style={{ "--tab-count": phaseViewDefinitions.length } as VisualStyle}
        role="tablist"
        aria-label="Research Lab views"
        data-research-phase={activePhase}
      >
        {phaseViewDefinitions.map((view) => {
          const Icon = view.icon;
          return (
            <button
              type="button"
              role="tab"
              key={view.id}
              id={`research-tab-${view.id}`}
              data-testid={`research-tab-${view.id}`}
              className={styles.tab}
              aria-selected={activeView === view.id}
              tabIndex={activeView === view.id ? 0 : -1}
              aria-controls={`research-panel-${view.id}`}
              onClick={() => activateView(view.id)}
              onKeyDown={(event) => handleTabKeyDown(event, view.id)}
            >
              <Icon aria-hidden="true" />
              <span>{view.label}</span>
            </button>
          );
        })}
      </nav>

      <section
        key={activeView}
        id={`research-panel-${activeView}`}
        data-testid={`research-panel-${activeView}`}
        className={styles.panel}
        role="tabpanel"
        aria-labelledby={`research-tab-${activeView}`}
      >
        {activeView === "observatory" && (
          <CorpusObservatory
            data={data}
            onOpenInstrument={onOpenInstrument}
          />
        )}
        {activeView === "genome" && (
          <RegulatoryGenome
            data={data}
            coverageScope={coverageScope}
            relevanceScope={relevanceScope}
            onCoverageChange={changeCoverageScope}
            onRelevanceChange={changeRelevanceScope}
            onOpenInstrument={onOpenInstrument}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "morphology" && (
          <ComparativeMorphology
            data={data}
            relevanceScope={relevanceScope}
            onRelevanceChange={changeRelevanceScope}
            defaultInstrumentIds={defaultInstrumentIds}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "grammar" && (
          <RegulatoryGrammar
            data={data}
            coverageScope={coverageScope}
            relevanceScope={relevanceScope}
            onCoverageChange={changeCoverageScope}
            onRelevanceChange={changeRelevanceScope}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "timeline" && (
          <GlobalTimeMachine
            data={data}
            onOpenInstrument={onOpenInstrument}
          />
        )}
        {activeView === "translation" && (
          <TranslationIntegrityObservatory
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
          />
        )}
        {activeView === "bridges" && (
          <QualifiedBridgeAtlas
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "pathways" && (
          <OperationalizationPathways
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "archetypes" && (
          <InstrumentArchetypes
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "audit" && (
          <MappingEvidenceAudit
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "horizon" && (
          <ApplicabilityHorizon
            data={data}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "microscope" && (
          <ArticleConceptMicroscope
            data={data}
            defaultInstrumentIds={defaultInstrumentIds}
            onOpenInstrument={onOpenInstrument}
            onOpenProvision={onOpenProvision}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "neighborhoods" && (
          <NeighborhoodStability
            data={data}
            defaultInstrumentIds={defaultInstrumentIds}
            onOpenInstrument={onOpenInstrument}
            onOpenConcept={onOpenConcept}
          />
        )}
        {activeView === "granularity" && (
          <GranularityCorpusBias
            data={data}
            onOpenInstrument={onOpenInstrument}
          />
        )}
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {viewDefinitions.find((view) => view.id === activeView)?.label} selected.
      </p>
    </article>
  );
}

export default ResearchLab;
