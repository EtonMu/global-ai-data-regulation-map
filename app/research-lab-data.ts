/**
 * Pure, coverage-aware derivations for the Phase 1 Research Lab.
 *
 * This module deliberately does not import corpus JSON. The explorer already
 * builds the authoritative merged provision array, so callers pass that same
 * runtime data here and avoid shipping a second copy of every legal text.
 */

export const RESEARCH_SNAPSHOT_DATE = "2026-07-20";

export type ResearchCoverageClass = "complete" | "selected" | "unclassified";
export type ResearchRelevance =
  | "substantive-topic"
  | "structural-context"
  | "unreviewed";
export type ResearchTemporalStatus = "past" | "on-snapshot" | "future";

export type ResearchJurisdictionInput = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  parentId?: string | null;
  isoCode?: string | null;
};

export type ResearchInstrumentInput = {
  id: string;
  shortTitle: string;
  title: string;
  jurisdictionId: string;
  category: string;
  legalForce: string;
  lifecycleStatus: string;
  statusAsOf: string;
  dates?: Record<string, string | null | undefined>;
};

export type ResearchStructureInput = {
  id?: string | null;
  label?: string;
  title?: string;
};

export type ResearchProvisionInput = {
  id: string;
  instrumentId: string;
  locator: string;
  title: string;
  provisionType?: string;
  parentId?: string | null;
  legalEffectStatus?: string;
  appliesFrom?: string | null;
  conceptIds: string[];
  sourceOrder?: number;
  chapter?: ResearchStructureInput | null;
  section?: ResearchStructureInput | null;
  topicRelevance?: {
    relevance: ResearchRelevance;
    conceptIds: string[];
  };
};

export type ResearchConceptInput = {
  id: string;
  label: string;
  family: string;
  theme: string;
  description: string;
  summary: string;
};

export type ResearchThemeInput = {
  id: string;
  label: string;
  summary: string;
  order: number;
};

export type ResearchSourceAuditInput = {
  instrumentId: string;
  reviewedOn: string;
  reviewLevel: string;
  localCoverage: {
    mode: string;
    localUnitCount: number;
    statement: string;
  };
  englishAvailability?: {
    status: string;
    note: string;
    coverage?: {
      translatedUnitCount: number;
      currentAlignedUnitCount?: number;
      temporallyMismatchedUnitCount?: number;
      totalUnitCount: number;
      completeness: string;
    };
  };
};

export type ResearchRelationInput = {
  id: string;
  source: { type: string; id: string };
  target: { type: string; id: string };
  status: string;
  confidence: string;
  type: string;
};

export type ResearchSourceRef = {
  url: string;
  label: string;
  accessedOn?: string;
};

export type ResearchStatusEventInput = {
  id: string;
  instrumentId: string;
  date: string;
  type: string;
  label: string;
  effect: string;
  resultingStatus: string;
  source?: ResearchSourceRef;
};

export type ResearchCorpusInput = {
  snapshotDate?: string;
  jurisdictions: readonly ResearchJurisdictionInput[];
  instruments: readonly ResearchInstrumentInput[];
  provisions: readonly ResearchProvisionInput[];
  concepts: readonly ResearchConceptInput[];
  themes: readonly ResearchThemeInput[];
  sourceAudits: readonly ResearchSourceAuditInput[];
  relations: readonly ResearchRelationInput[];
  statusEvents: readonly ResearchStatusEventInput[];
};

export type ResearchAnalysisOptions = {
  coverageClasses?: readonly ResearchCoverageClass[];
  relevance?: readonly ResearchRelevance[];
};

export type ResearchCoverageCaveat = {
  id: string;
  title: string;
  detail: string;
};

export type ResearchCoverageModeCount = {
  mode: string;
  coverageClass: ResearchCoverageClass;
  instrumentCount: number;
};

export type ResearchInstrumentCoverage = {
  instrumentId: string;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  localUnitCount: number;
  statement: string;
  reviewedOn: string;
  reviewLevel: string;
  englishStatus: string | null;
  englishTranslatedUnitCount: number | null;
  englishTotalUnitCount: number | null;
  englishCurrentAlignedUnitCount: number | null;
};

export type ResearchCoverageObservatory = {
  summary: {
    jurisdictionCount: number;
    instrumentCount: number;
    provisionCount: number;
    substantiveProvisionCount: number;
    structuralContextCount: number;
    unreviewedProvisionCount: number;
    conceptCount: number;
    themeCount: number;
    relationCount: number;
    reviewedRelationCount: number;
    candidateRelationCount: number;
    lifecycleEventCount: number;
    sourceAuditCount: number;
    completeInstrumentCount: number;
    selectedInstrumentCount: number;
    unclassifiedInstrumentCount: number;
  };
  modeCounts: ResearchCoverageModeCount[];
  instruments: ResearchInstrumentCoverage[];
  caveats: ResearchCoverageCaveat[];
};

export type ResearchProvisionDatum = {
  id: string;
  instrumentId: string;
  locator: string;
  title: string;
  provisionType: string;
  legalEffectStatus: string | null;
  appliesFrom: string | null;
  sourceOrder: number;
  relevance: ResearchRelevance;
  conceptIds: string[];
  chapterId: string | null;
  chapterLabel: string | null;
  chapterTitle: string | null;
  sectionId: string | null;
  sectionLabel: string | null;
  sectionTitle: string | null;
};

export type ResearchConceptWeight = {
  conceptId: string;
  rawCount: number;
  documentFrequency: number;
  idf: number;
  prevalence: number;
  termFrequency: number;
  tfidf: number;
  normalizedTfidf: number;
};

export type ResearchInstrumentFingerprint = {
  instrumentId: string;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  includedInDefaultAnalysis: boolean;
  denominatorProvisionCount: number;
  conceptAssignmentCount: number;
  mappedConceptCount: number;
  weights: ResearchConceptWeight[];
};

export type ResearchConceptDatum = {
  id: string;
  label: string;
  family: string;
  themeId: string;
  description: string;
  summary: string;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  instrumentCount: number;
  defaultSampleProvisionCount: number;
  defaultSampleInstrumentCount: number;
};

export type ResearchThemeDatum = {
  id: string;
  label: string;
  summary: string;
  order: number;
  conceptIds: string[];
};

export type ResearchCooccurrenceDatum = {
  leftConceptId: string;
  rightConceptId: string;
  sampleProvisionCount: number;
  sampleInstrumentCount: number;
  leftCount: number;
  rightCount: number;
  cooccurrenceCount: number;
  cooccurringInstrumentCount: number;
  cooccurringJurisdictionCount: number;
  expectedCount: number;
  lift: number | null;
  pmi: number | null;
  normalizedPmi: number | null;
  jaccard: number | null;
};

export type ResearchStructuralBand = {
  id: string;
  structureId: string;
  label: string;
  title: string;
  startIndex: number;
  endIndex: number;
  startRatio: number;
  endRatio: number;
  provisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  topConceptIds: string[];
};

export type ResearchStructuralProfile = {
  instrumentId: string;
  includedInDefaultAnalysis: boolean;
  totalProvisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  bands: ResearchStructuralBand[];
};

export type ResearchLifecycleEventDatum = {
  id: string;
  instrumentId: string;
  date: string;
  type: string;
  label: string;
  effect: string;
  resultingStatus: string;
  temporalStatus: ResearchTemporalStatus;
  source?: ResearchSourceRef;
};

export type ResearchLifecycleLane = {
  instrumentId: string;
  instrumentTitle: string;
  jurisdictionId: string;
  jurisdictionName: string;
  legalForce: string;
  currentStatus: string;
  atlasOrder: number;
  firstDate: string;
  lastDate: string;
  recordedThroughSnapshotEventCount: number;
  futureEventCount: number;
  events: ResearchLifecycleEventDatum[];
};

export type ResearchInstrumentDatum = {
  id: string;
  shortTitle: string;
  title: string;
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionIsoCode: string | null;
  category: string;
  legalForce: string;
  lifecycleStatus: string;
  statusAsOf: string;
  atlasOrder: number;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  includedInDefaultAnalysis: boolean;
  localUnitCount: number;
  totalProvisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  conceptAssignmentCount: number;
  mappedConceptCount: number;
  reviewedRelationCount: number;
  candidateRelationCount: number;
  conceptWeights: ResearchConceptWeight[];
};

export type ResearchLabData = {
  snapshotDate: string;
  methodology: {
    defaultCoverageClasses: ResearchCoverageClass[];
    defaultRelevance: ResearchRelevance[];
    analysisUnit: "provision";
    fingerprintDefinition: string;
    idfDefinition: string;
    cooccurrenceDefinition: string;
  };
  coverage: ResearchCoverageObservatory;
  instruments: ResearchInstrumentDatum[];
  provisions: ResearchProvisionDatum[];
  concepts: ResearchConceptDatum[];
  themes: ResearchThemeDatum[];
  fingerprints: ResearchInstrumentFingerprint[];
  cooccurrence: ResearchCooccurrenceDatum[];
  structuralProfiles: ResearchStructuralProfile[];
  lifecycleLanes: ResearchLifecycleLane[];
};

const DEFAULT_COVERAGE_CLASSES: ResearchCoverageClass[] = ["complete"];
const DEFAULT_RELEVANCE: ResearchRelevance[] = ["substantive-topic"];

const atlasRootOrder = [
  "eu",
  "us",
  "cn",
  "gb",
  "ca",
  "jp",
  "in",
  "sg",
  "kr",
  "au",
  "br",
  "ae",
  "sa",
  "tw",
  "hk",
  "id",
  "vn",
  "za",
  "ng",
  "ch",
  "int",
] as const;

export function coverageClassForMode(mode: string): ResearchCoverageClass {
  if (mode.startsWith("complete-")) return "complete";
  if (mode.startsWith("selected-")) return "selected";
  return "unclassified";
}

function relevanceForProvision(
  provision: ResearchProvisionInput,
): ResearchRelevance {
  return provision.topicRelevance?.relevance ?? "unreviewed";
}

function conceptsForProvision(provision: ResearchProvisionInput): string[] {
  return Array.from(
    new Set([
      ...provision.conceptIds,
      ...(provision.topicRelevance?.conceptIds ?? []),
    ]),
  );
}

function round(value: number, precision = 6): number {
  const scale = 10 ** precision;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function rootJurisdictionId(
  jurisdictionId: string,
  jurisdictionById: ReadonlyMap<string, ResearchJurisdictionInput>,
): string {
  // Hong Kong is an explicit atlas lane even though its metadata preserves the
  // PRC parent relationship; subnational US and UAE contexts inherit their lane.
  if (jurisdictionId === "hk") return "hk";
  let current = jurisdictionById.get(jurisdictionId);
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    current = jurisdictionById.get(current.parentId);
  }
  return current?.id ?? jurisdictionId;
}

function atlasOrderFor(
  instrument: ResearchInstrumentInput,
  instrumentIndex: number,
  jurisdictionById: ReadonlyMap<string, ResearchJurisdictionInput>,
): number {
  const rootId = rootJurisdictionId(instrument.jurisdictionId, jurisdictionById);
  const rootIndex = atlasRootOrder.indexOf(
    rootId as (typeof atlasRootOrder)[number],
  );
  const lane = rootIndex === -1 ? atlasRootOrder.length : rootIndex;
  return lane * 10_000 + instrumentIndex;
}

function temporalStatusFor(
  date: string,
  snapshotDate: string,
): ResearchTemporalStatus {
  if (date < snapshotDate) return "past";
  if (date > snapshotDate) return "future";
  return "on-snapshot";
}

function coverageMaps(
  sourceAudits: readonly ResearchSourceAuditInput[],
): {
  auditByInstrument: Map<string, ResearchSourceAuditInput>;
  classByInstrument: Map<string, ResearchCoverageClass>;
} {
  const auditByInstrument = new Map(
    sourceAudits.map((audit) => [audit.instrumentId, audit]),
  );
  return {
    auditByInstrument,
    classByInstrument: new Map(
      sourceAudits.map((audit) => [
        audit.instrumentId,
        coverageClassForMode(audit.localCoverage.mode),
      ]),
    ),
  };
}

function normalizedOptions(options?: ResearchAnalysisOptions): {
  coverageClasses: Set<ResearchCoverageClass>;
  relevance: Set<ResearchRelevance>;
} {
  return {
    coverageClasses: new Set(
      options?.coverageClasses ?? DEFAULT_COVERAGE_CLASSES,
    ),
    relevance: new Set(options?.relevance ?? DEFAULT_RELEVANCE),
  };
}

function provisionIsInSample(
  provision: ResearchProvisionInput,
  classByInstrument: ReadonlyMap<string, ResearchCoverageClass>,
  options?: ResearchAnalysisOptions,
): boolean {
  const normalized = normalizedOptions(options);
  return (
    normalized.coverageClasses.has(
      classByInstrument.get(provision.instrumentId) ?? "unclassified",
    ) && normalized.relevance.has(relevanceForProvision(provision))
  );
}

export function deriveResearchProvisions(
  provisions: readonly ResearchProvisionInput[],
): ResearchProvisionDatum[] {
  const fallbackOrder = new Map<string, number>();
  return provisions.map((provision) => {
    const nextOrder = fallbackOrder.get(provision.instrumentId) ?? 0;
    fallbackOrder.set(provision.instrumentId, nextOrder + 1);
    return {
      id: provision.id,
      instrumentId: provision.instrumentId,
      locator: provision.locator,
      title: provision.title,
      provisionType: provision.provisionType ?? "provision",
      legalEffectStatus: provision.legalEffectStatus ?? null,
      appliesFrom: provision.appliesFrom ?? null,
      sourceOrder: provision.sourceOrder ?? nextOrder,
      relevance: relevanceForProvision(provision),
      conceptIds: conceptsForProvision(provision),
      chapterId: provision.chapter?.id ?? null,
      chapterLabel: provision.chapter?.label ?? null,
      chapterTitle: provision.chapter?.title ?? null,
      sectionId: provision.section?.id ?? null,
      sectionLabel: provision.section?.label ?? null,
      sectionTitle: provision.section?.title ?? null,
    };
  });
}

export function deriveCoverageObservatory(
  input: ResearchCorpusInput,
): ResearchCoverageObservatory {
  const relevanceCounts: Record<ResearchRelevance, number> = {
    "substantive-topic": 0,
    "structural-context": 0,
    unreviewed: 0,
  };
  input.provisions.forEach((provision) => {
    relevanceCounts[relevanceForProvision(provision)] += 1;
  });

  const modeMap = new Map<string, ResearchCoverageModeCount>();
  const coverageInstruments = input.sourceAudits.map((audit) => {
    const coverageClass = coverageClassForMode(audit.localCoverage.mode);
    const existing = modeMap.get(audit.localCoverage.mode);
    if (existing) existing.instrumentCount += 1;
    else {
      modeMap.set(audit.localCoverage.mode, {
        mode: audit.localCoverage.mode,
        coverageClass,
        instrumentCount: 1,
      });
    }
    const englishCoverage = audit.englishAvailability?.coverage;
    return {
      instrumentId: audit.instrumentId,
      coverageMode: audit.localCoverage.mode,
      coverageClass,
      localUnitCount: audit.localCoverage.localUnitCount,
      statement: audit.localCoverage.statement,
      reviewedOn: audit.reviewedOn,
      reviewLevel: audit.reviewLevel,
      englishStatus: audit.englishAvailability?.status ?? null,
      englishTranslatedUnitCount:
        englishCoverage?.translatedUnitCount ?? null,
      englishTotalUnitCount: englishCoverage?.totalUnitCount ?? null,
      englishCurrentAlignedUnitCount:
        englishCoverage?.currentAlignedUnitCount ?? null,
    };
  });
  const classCounts = coverageInstruments.reduce(
    (counts, instrument) => {
      counts[instrument.coverageClass] += 1;
      return counts;
    },
    { complete: 0, selected: 0, unclassified: 0 } as Record<
      ResearchCoverageClass,
      number
    >,
  );

  return {
    summary: {
      jurisdictionCount: input.jurisdictions.length,
      instrumentCount: input.instruments.length,
      provisionCount: input.provisions.length,
      substantiveProvisionCount: relevanceCounts["substantive-topic"],
      structuralContextCount: relevanceCounts["structural-context"],
      unreviewedProvisionCount: relevanceCounts.unreviewed,
      conceptCount: input.concepts.length,
      themeCount: input.themes.length,
      relationCount: input.relations.length,
      reviewedRelationCount: input.relations.filter(
        (relation) => relation.status === "editorial-reviewed",
      ).length,
      candidateRelationCount: input.relations.filter(
        (relation) => relation.status === "candidate",
      ).length,
      lifecycleEventCount: input.statusEvents.length,
      sourceAuditCount: input.sourceAudits.length,
      completeInstrumentCount: classCounts.complete,
      selectedInstrumentCount: classCounts.selected,
      unclassifiedInstrumentCount: classCounts.unclassified,
    },
    modeCounts: Array.from(modeMap.values()).sort(
      (left, right) =>
        right.instrumentCount - left.instrumentCount ||
        left.mode.localeCompare(right.mode),
    ),
    instruments: coverageInstruments,
    caveats: [
      {
        id: "coverage-mask",
        title: "Coverage is not uniform",
        detail:
          "Complete and selected corpora are kept distinct. The default statistical sample uses only complete corpora; selected indexes remain discoverable but are not treated as comparable denominators.",
      },
      {
        id: "absence-is-unknown",
        title: "No local match is not legal absence",
        detail:
          "A missing concept assignment can reflect corpus scope, versioning, translation, or editorial coverage. It does not establish that a jurisdiction lacks the rule.",
      },
      {
        id: "concept-not-equivalence",
        title: "Concept links are topical",
        detail:
          "Shared Core Concepts support research navigation; they do not establish legal equivalence, compliance, or identical scope and remedies.",
      },
      {
        id: "counts-not-strength",
        title: "Frequency is not regulatory strength",
        detail:
          "Raw provision counts are affected by drafting structure and multi-label annotation. Fingerprints therefore expose prevalence, TF-IDF, and coverage status rather than a strictness score.",
      },
      {
        id: "unreviewed-excluded",
        title: "Unreviewed records are not inferred as substantive",
        detail:
          "A provision without a topic-review record is classified as unreviewed and excluded from the default substantive sample rather than silently counted as relevant.",
      },
      {
        id: "relation-review",
        title: "Candidate relations remain hypotheses",
        detail:
          "Candidate cross-source relations are shown separately from editorial-reviewed relations and must not be presented as verified legal mappings.",
      },
      {
        id: "timeline-boundary",
        title: "Lifecycle events are an auditable index",
        detail:
          "The event stream explains recorded status changes but is not represented as a complete legislative history.",
      },
    ],
  };
}

export function deriveConceptFingerprints(
  input: Pick<
    ResearchCorpusInput,
    "instruments" | "provisions" | "concepts" | "sourceAudits"
  >,
  options?: ResearchAnalysisOptions,
): ResearchInstrumentFingerprint[] {
  const { auditByInstrument, classByInstrument } = coverageMaps(
    input.sourceAudits,
  );
  const normalized = normalizedOptions(options);
  const sampleProvisions = input.provisions.filter((provision) =>
    provisionIsInSample(provision, classByInstrument, options),
  );
  const sampleInstrumentIds = new Set(
    input.instruments
      .filter((instrument) =>
        normalized.coverageClasses.has(
          classByInstrument.get(instrument.id) ?? "unclassified",
        ),
      )
      .map((instrument) => instrument.id),
  );
  const sampleByInstrument = new Map<string, ResearchProvisionInput[]>();
  sampleProvisions.forEach((provision) => {
    const list = sampleByInstrument.get(provision.instrumentId) ?? [];
    list.push(provision);
    sampleByInstrument.set(provision.instrumentId, list);
  });

  const documentFrequency = new Map<string, number>();
  for (const instrumentId of sampleInstrumentIds) {
    const present = new Set(
      (sampleByInstrument.get(instrumentId) ?? []).flatMap(conceptsForProvision),
    );
    present.forEach((conceptId) =>
      documentFrequency.set(
        conceptId,
        (documentFrequency.get(conceptId) ?? 0) + 1,
      ),
    );
  }
  const sampleInstrumentCount = Math.max(sampleInstrumentIds.size, 1);

  return input.instruments.map((instrument) => {
    const coverageClass =
      classByInstrument.get(instrument.id) ?? "unclassified";
    const includedInDefaultAnalysis = sampleInstrumentIds.has(instrument.id);
    const denominatorProvisions = input.provisions.filter(
      (provision) =>
        provision.instrumentId === instrument.id &&
        normalized.relevance.has(relevanceForProvision(provision)),
    );
    const counts = new Map<string, number>();
    denominatorProvisions.forEach((provision) =>
      conceptsForProvision(provision).forEach((conceptId) =>
        counts.set(conceptId, (counts.get(conceptId) ?? 0) + 1),
      ),
    );
    const conceptAssignmentCount = Array.from(counts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const rawWeights = input.concepts.map((concept) => {
      const rawCount = counts.get(concept.id) ?? 0;
      const df = documentFrequency.get(concept.id) ?? 0;
      const idf = Math.log((1 + sampleInstrumentCount) / (1 + df)) + 1;
      const prevalence = denominatorProvisions.length
        ? rawCount / denominatorProvisions.length
        : 0;
      const termFrequency = conceptAssignmentCount
        ? rawCount / conceptAssignmentCount
        : 0;
      return {
        conceptId: concept.id,
        rawCount,
        documentFrequency: df,
        idf,
        prevalence,
        termFrequency,
        tfidf: termFrequency * idf,
      };
    });
    const magnitude = Math.sqrt(
      rawWeights.reduce((sum, weight) => sum + weight.tfidf ** 2, 0),
    );
    const weights = rawWeights.map((weight) => ({
      ...weight,
      idf: round(weight.idf),
      prevalence: round(weight.prevalence),
      termFrequency: round(weight.termFrequency),
      tfidf: round(weight.tfidf),
      normalizedTfidf: magnitude ? round(weight.tfidf / magnitude) : 0,
    }));

    return {
      instrumentId: instrument.id,
      coverageMode:
        auditByInstrument.get(instrument.id)?.localCoverage.mode ?? "unclassified",
      coverageClass,
      includedInDefaultAnalysis,
      denominatorProvisionCount: denominatorProvisions.length,
      conceptAssignmentCount,
      mappedConceptCount: counts.size,
      weights,
    };
  });
}

export function deriveConceptCooccurrence(
  input: Pick<
    ResearchCorpusInput,
    "provisions" | "concepts" | "sourceAudits" | "instruments"
  >,
  options?: ResearchAnalysisOptions,
): ResearchCooccurrenceDatum[] {
  const { classByInstrument } = coverageMaps(input.sourceAudits);
  const sample = input.provisions.filter((provision) =>
    provisionIsInSample(provision, classByInstrument, options),
  );
  const sampleProvisionCount = sample.length;
  const sampleInstrumentCount = new Set(
    sample.map((provision) => provision.instrumentId),
  ).size;
  const jurisdictionByInstrument = new Map(
    input.instruments.map((instrument) => [
      instrument.id,
      instrument.jurisdictionId,
    ]),
  );
  const marginal = new Map<string, number>();
  const pairCounts = new Map<string, number>();
  const pairInstrumentIds = new Map<string, Set<string>>();
  const pairJurisdictionIds = new Map<string, Set<string>>();

  sample.forEach((provision) => {
    const conceptIds = conceptsForProvision(provision)
      .filter((conceptId) => input.concepts.some((item) => item.id === conceptId))
      .sort();
    conceptIds.forEach((conceptId) =>
      marginal.set(conceptId, (marginal.get(conceptId) ?? 0) + 1),
    );
    for (let left = 0; left < conceptIds.length; left += 1) {
      for (let right = left + 1; right < conceptIds.length; right += 1) {
        const key = `${conceptIds[left]}::${conceptIds[right]}`;
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
  });

  const output: ResearchCooccurrenceDatum[] = [];
  for (let left = 0; left < input.concepts.length; left += 1) {
    for (let right = left + 1; right < input.concepts.length; right += 1) {
      const leftId = input.concepts[left].id;
      const rightId = input.concepts[right].id;
      const [first, second] = [leftId, rightId].sort();
      const leftCount = marginal.get(leftId) ?? 0;
      const rightCount = marginal.get(rightId) ?? 0;
      const cooccurrenceCount = pairCounts.get(`${first}::${second}`) ?? 0;
      const cooccurringInstrumentCount =
        pairInstrumentIds.get(`${first}::${second}`)?.size ?? 0;
      const cooccurringJurisdictionCount =
        pairJurisdictionIds.get(`${first}::${second}`)?.size ?? 0;
      const expectedCount = sampleProvisionCount
        ? (leftCount * rightCount) / sampleProvisionCount
        : 0;
      const lift = expectedCount ? cooccurrenceCount / expectedCount : null;
      const jointProbability = sampleProvisionCount
        ? cooccurrenceCount / sampleProvisionCount
        : 0;
      const pmi = lift !== null && lift > 0 ? Math.log2(lift) : null;
      const normalizedPmi =
        pmi !== null && jointProbability > 0 && jointProbability < 1
          ? pmi / -Math.log2(jointProbability)
          : null;
      const union = leftCount + rightCount - cooccurrenceCount;
      output.push({
        leftConceptId: leftId,
        rightConceptId: rightId,
        sampleProvisionCount,
        sampleInstrumentCount,
        leftCount,
        rightCount,
        cooccurrenceCount,
        cooccurringInstrumentCount,
        cooccurringJurisdictionCount,
        expectedCount: round(expectedCount),
        lift: lift === null ? null : round(lift),
        pmi: pmi === null ? null : round(pmi),
        normalizedPmi:
          normalizedPmi === null ? null : round(normalizedPmi),
        jaccard: union ? round(cooccurrenceCount / union) : null,
      });
    }
  }
  return output;
}

function provisionStructure(provision: ResearchProvisionDatum): {
  id: string;
  label: string;
  title: string;
} {
  if (provision.chapterId || provision.chapterLabel || provision.chapterTitle) {
    return {
      id: provision.chapterId ?? provision.chapterLabel ?? "chapter",
      label: provision.chapterLabel ?? provision.chapterTitle ?? "Chapter",
      title: provision.chapterTitle ?? provision.chapterLabel ?? "Chapter",
    };
  }
  if (provision.sectionId || provision.sectionLabel || provision.sectionTitle) {
    return {
      id: provision.sectionId ?? provision.sectionLabel ?? "section",
      label: provision.sectionLabel ?? provision.sectionTitle ?? "Section",
      title: provision.sectionTitle ?? provision.sectionLabel ?? "Section",
    };
  }
  return {
    id: "unsegmented",
    label: "Unsegmented",
    title: "Source-order provisions without chapter metadata",
  };
}

export function deriveStructuralProfiles(
  input: Pick<
    ResearchCorpusInput,
    "instruments" | "provisions" | "sourceAudits"
  >,
  options?: ResearchAnalysisOptions,
): ResearchStructuralProfile[] {
  const provisions = deriveResearchProvisions(input.provisions);
  const { classByInstrument } = coverageMaps(input.sourceAudits);
  const normalized = normalizedOptions(options);

  return input.instruments.map((instrument) => {
    const instrumentProvisions = provisions
      .filter((provision) => provision.instrumentId === instrument.id)
      .sort(
        (left, right) =>
          left.sourceOrder - right.sourceOrder ||
          left.locator.localeCompare(right.locator, undefined, { numeric: true }),
      );
    const total = instrumentProvisions.length;
    const draftBands: Array<{
      structure: ReturnType<typeof provisionStructure>;
      startIndex: number;
      provisions: ResearchProvisionDatum[];
    }> = [];
    instrumentProvisions.forEach((provision, index) => {
      const structure = provisionStructure(provision);
      const previous = draftBands[draftBands.length - 1];
      if (!previous || previous.structure.id !== structure.id) {
        draftBands.push({ structure, startIndex: index, provisions: [provision] });
      } else previous.provisions.push(provision);
    });

    const bands = draftBands.map((band, bandIndex) => {
      const conceptCounts = new Map<string, number>();
      const substantive = band.provisions.filter(
        (provision) => provision.relevance === "substantive-topic",
      );
      const structural = band.provisions.filter(
        (provision) => provision.relevance === "structural-context",
      );
      const unreviewed = band.provisions.filter(
        (provision) => provision.relevance === "unreviewed",
      );
      substantive.forEach((provision) =>
        provision.conceptIds.forEach((conceptId) =>
          conceptCounts.set(conceptId, (conceptCounts.get(conceptId) ?? 0) + 1),
        ),
      );
      const endIndex = band.startIndex + band.provisions.length - 1;
      return {
        id: `${instrument.id}::${band.structure.id}::${bandIndex}`,
        structureId: band.structure.id,
        label: band.structure.label,
        title: band.structure.title,
        startIndex: band.startIndex,
        endIndex,
        startRatio: total ? round(band.startIndex / total) : 0,
        endRatio: total ? round((endIndex + 1) / total) : 0,
        provisionCount: band.provisions.length,
        substantiveProvisionCount: substantive.length,
        structuralContextCount: structural.length,
        unreviewedProvisionCount: unreviewed.length,
        topConceptIds: Array.from(conceptCounts.entries())
          .sort(
            (left, right) =>
              right[1] - left[1] || left[0].localeCompare(right[0]),
          )
          .slice(0, 4)
          .map(([conceptId]) => conceptId),
      };
    });
    return {
      instrumentId: instrument.id,
      includedInDefaultAnalysis: normalized.coverageClasses.has(
        classByInstrument.get(instrument.id) ?? "unclassified",
      ),
      totalProvisionCount: total,
      substantiveProvisionCount: instrumentProvisions.filter(
        (provision) => provision.relevance === "substantive-topic",
      ).length,
      structuralContextCount: instrumentProvisions.filter(
        (provision) => provision.relevance === "structural-context",
      ).length,
      unreviewedProvisionCount: instrumentProvisions.filter(
        (provision) => provision.relevance === "unreviewed",
      ).length,
      bands,
    };
  });
}

export function deriveLifecycleLanes(
  input: Pick<
    ResearchCorpusInput,
    "snapshotDate" | "jurisdictions" | "instruments" | "statusEvents"
  >,
): ResearchLifecycleLane[] {
  const snapshotDate = input.snapshotDate ?? RESEARCH_SNAPSHOT_DATE;
  const jurisdictionById = new Map(
    input.jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
  );
  const eventsByInstrument = new Map<string, ResearchLifecycleEventDatum[]>();
  input.statusEvents.forEach((event) => {
    const list = eventsByInstrument.get(event.instrumentId) ?? [];
    list.push({
      ...event,
      temporalStatus: temporalStatusFor(event.date, snapshotDate),
    });
    eventsByInstrument.set(event.instrumentId, list);
  });

  return input.instruments
    .map((instrument, instrumentIndex) => {
      const events = (eventsByInstrument.get(instrument.id) ?? []).sort(
        (left, right) =>
          left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
      );
      const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
      return {
        instrumentId: instrument.id,
        instrumentTitle: instrument.shortTitle,
        jurisdictionId: instrument.jurisdictionId,
        jurisdictionName: jurisdiction?.shortName ?? instrument.jurisdictionId,
        legalForce: instrument.legalForce,
        currentStatus: instrument.lifecycleStatus,
        atlasOrder: atlasOrderFor(
          instrument,
          instrumentIndex,
          jurisdictionById,
        ),
        firstDate: events[0]?.date ?? instrument.statusAsOf,
        lastDate: events[events.length - 1]?.date ?? instrument.statusAsOf,
        recordedThroughSnapshotEventCount: events.filter(
          (event) => event.temporalStatus !== "future",
        ).length,
        futureEventCount: events.filter(
          (event) => event.temporalStatus === "future",
        ).length,
        events,
      };
    })
    .filter((lane) => lane.events.length > 0)
    .sort(
      (left, right) =>
        left.atlasOrder - right.atlasOrder ||
        left.instrumentTitle.localeCompare(right.instrumentTitle),
    );
}

export function deriveResearchConcepts(
  input: Pick<
    ResearchCorpusInput,
    "concepts" | "themes" | "provisions" | "sourceAudits"
  >,
  options?: ResearchAnalysisOptions,
): { concepts: ResearchConceptDatum[]; themes: ResearchThemeDatum[] } {
  const { classByInstrument } = coverageMaps(input.sourceAudits);
  const sample = input.provisions.filter((provision) =>
    provisionIsInSample(provision, classByInstrument, options),
  );
  const concepts = input.concepts.map((concept) => {
    const substantive = input.provisions.filter(
      (provision) =>
        relevanceForProvision(provision) === "substantive-topic" &&
        conceptsForProvision(provision).includes(concept.id),
    );
    const structural = input.provisions.filter(
      (provision) =>
        relevanceForProvision(provision) === "structural-context" &&
        conceptsForProvision(provision).includes(concept.id),
    );
    const defaultSample = sample.filter((provision) =>
      conceptsForProvision(provision).includes(concept.id),
    );
    return {
      id: concept.id,
      label: concept.label,
      family: concept.family,
      themeId: concept.theme,
      description: concept.description,
      summary: concept.summary,
      substantiveProvisionCount: substantive.length,
      structuralContextCount: structural.length,
      instrumentCount: new Set(substantive.map((item) => item.instrumentId)).size,
      defaultSampleProvisionCount: defaultSample.length,
      defaultSampleInstrumentCount: new Set(
        defaultSample.map((item) => item.instrumentId),
      ).size,
    };
  });
  const themes = [...input.themes]
    .sort((left, right) => left.order - right.order)
    .map((theme) => ({
      id: theme.id,
      label: theme.label,
      summary: theme.summary,
      order: theme.order,
      conceptIds: concepts
        .filter((concept) => concept.themeId === theme.id)
        .map((concept) => concept.id),
    }));
  return { concepts, themes };
}

function relationInstrumentIds(
  relation: ResearchRelationInput,
  provisionById: ReadonlyMap<string, ResearchProvisionInput>,
): Set<string> {
  const instrumentIds = new Set<string>();
  [relation.source, relation.target].forEach((endpoint) => {
    if (endpoint.type === "instrument") instrumentIds.add(endpoint.id);
    else if (endpoint.type === "provision") {
      const instrumentId = provisionById.get(endpoint.id)?.instrumentId;
      if (instrumentId) instrumentIds.add(instrumentId);
    }
  });
  return instrumentIds;
}

export function deriveResearchInstruments(
  input: ResearchCorpusInput,
  fingerprints = deriveConceptFingerprints(input),
): ResearchInstrumentDatum[] {
  const jurisdictionById = new Map(
    input.jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
  );
  const provisionById = new Map(
    input.provisions.map((provision) => [provision.id, provision]),
  );
  const { auditByInstrument, classByInstrument } = coverageMaps(
    input.sourceAudits,
  );
  const fingerprintByInstrument = new Map(
    fingerprints.map((fingerprint) => [fingerprint.instrumentId, fingerprint]),
  );
  const relationIdsByInstrument = new Map<
    string,
    { reviewed: Set<string>; candidate: Set<string> }
  >();
  input.relations.forEach((relation) => {
    relationInstrumentIds(relation, provisionById).forEach((instrumentId) => {
      const record = relationIdsByInstrument.get(instrumentId) ?? {
        reviewed: new Set<string>(),
        candidate: new Set<string>(),
      };
      if (relation.status === "editorial-reviewed") {
        record.reviewed.add(relation.id);
      } else if (relation.status === "candidate") {
        record.candidate.add(relation.id);
      }
      relationIdsByInstrument.set(instrumentId, record);
    });
  });

  return input.instruments
    .map((instrument, instrumentIndex) => {
      const audit = auditByInstrument.get(instrument.id);
      const coverageClass =
        classByInstrument.get(instrument.id) ?? "unclassified";
      const instrumentProvisions = input.provisions.filter(
        (provision) => provision.instrumentId === instrument.id,
      );
      const substantive = instrumentProvisions.filter(
        (provision) => relevanceForProvision(provision) === "substantive-topic",
      );
      const structural = instrumentProvisions.filter(
        (provision) => relevanceForProvision(provision) === "structural-context",
      );
      const unreviewed = instrumentProvisions.filter(
        (provision) => relevanceForProvision(provision) === "unreviewed",
      );
      const fingerprint = fingerprintByInstrument.get(instrument.id);
      const relationIds = relationIdsByInstrument.get(instrument.id);
      const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
      return {
        id: instrument.id,
        shortTitle: instrument.shortTitle,
        title: instrument.title,
        jurisdictionId: instrument.jurisdictionId,
        jurisdictionName: jurisdiction?.shortName ?? instrument.jurisdictionId,
        jurisdictionIsoCode: jurisdiction?.isoCode ?? null,
        category: instrument.category,
        legalForce: instrument.legalForce,
        lifecycleStatus: instrument.lifecycleStatus,
        statusAsOf: instrument.statusAsOf,
        atlasOrder: atlasOrderFor(
          instrument,
          instrumentIndex,
          jurisdictionById,
        ),
        coverageMode: audit?.localCoverage.mode ?? "unclassified",
        coverageClass,
        includedInDefaultAnalysis:
          fingerprint?.includedInDefaultAnalysis ?? false,
        localUnitCount: audit?.localCoverage.localUnitCount ?? 0,
        totalProvisionCount: instrumentProvisions.length,
        substantiveProvisionCount: substantive.length,
        structuralContextCount: structural.length,
        unreviewedProvisionCount: unreviewed.length,
        conceptAssignmentCount: fingerprint?.conceptAssignmentCount ?? 0,
        mappedConceptCount: fingerprint?.mappedConceptCount ?? 0,
        reviewedRelationCount: relationIds?.reviewed.size ?? 0,
        candidateRelationCount: relationIds?.candidate.size ?? 0,
        conceptWeights: fingerprint?.weights ?? [],
      };
    })
    .sort(
      (left, right) =>
        left.atlasOrder - right.atlasOrder ||
        left.shortTitle.localeCompare(right.shortTitle),
    );
}

export function buildResearchLabData(
  input: ResearchCorpusInput,
  options?: ResearchAnalysisOptions,
): ResearchLabData {
  const snapshotDate = input.snapshotDate ?? RESEARCH_SNAPSHOT_DATE;
  const normalizedInput = { ...input, snapshotDate };
  const fingerprints = deriveConceptFingerprints(normalizedInput, options);
  const conceptData = deriveResearchConcepts(normalizedInput, options);
  return {
    snapshotDate,
    methodology: {
      defaultCoverageClasses: [
        ...(options?.coverageClasses ?? DEFAULT_COVERAGE_CLASSES),
      ],
      defaultRelevance: [...(options?.relevance ?? DEFAULT_RELEVANCE)],
      analysisUnit: "provision",
      fingerprintDefinition:
        "Per-instrument TF is a concept's provision assignments divided by all concept assignments in the included relevance class; prevalence separately divides by included provisions. TF-IDF vectors are L2-normalized.",
      idfDefinition:
        "IDF = ln((1 + N) / (1 + document frequency)) + 1, where N is the number of instruments in the selected coverage sample.",
      cooccurrenceDefinition:
        "Concept pairs are counted once per included provision. Lift, base-2 PMI, normalized PMI, and Jaccard use complete-corpus substantive provisions by default; provision, distinct-instrument, and distinct-jurisdiction support are retained separately.",
    },
    coverage: deriveCoverageObservatory(normalizedInput),
    instruments: deriveResearchInstruments(normalizedInput, fingerprints),
    provisions: deriveResearchProvisions(normalizedInput.provisions),
    concepts: conceptData.concepts,
    themes: conceptData.themes,
    fingerprints,
    cooccurrence: deriveConceptCooccurrence(normalizedInput, options),
    structuralProfiles: deriveStructuralProfiles(normalizedInput, options),
    lifecycleLanes: deriveLifecycleLanes(normalizedInput),
  };
}
