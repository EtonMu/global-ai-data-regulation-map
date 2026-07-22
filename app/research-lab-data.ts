/**
 * Pure, coverage-aware derivations for the Research Lab.
 *
 * This module deliberately does not import corpus JSON. The explorer already
 * builds the authoritative merged provision array, so callers pass that same
 * runtime data here and avoid shipping a second copy of every legal text.
 */

export const RESEARCH_SNAPSHOT_DATE = "2026-07-20";

export type ResearchCoverageClass = "complete" | "selected" | "unclassified";
export type ResearchConceptMeasurementState =
  | "observed-complete"
  | "unknown-partial";
export type ResearchRelevance =
  | "substantive-topic"
  | "structural-context"
  | "unreviewed";
export type ResearchAnalysisRole =
  | "metric-unit"
  | "navigation-analytical-excerpt";
export type ResearchTemporalStatus = "past" | "on-snapshot" | "future";

export type ResearchTreatment = {
  role: ResearchAnalysisRole;
  metricEligible: boolean;
  canonicalProvisionId?: string | null;
  note?: string;
};

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
  versionAsOf?: string | null;
  summary?: string;
  /** Stored source-language text, when the merged runtime corpus supplies it. */
  fullText?: string;
  paragraphs?: string[];
  conceptIds: string[];
  actorTags?: string[];
  scopeTags?: string[];
  textAvailability?: {
    language: string;
    mode?: string;
    stored?: boolean;
  };
  translations?: {
    en?: {
      status: string;
      coverageStatus?: string;
      versionAsOf?: string;
      versionLabel?: string;
      currentTextEquivalent?: boolean;
      alignmentStatus?: string;
      source?: ResearchSourceRef | string;
    };
  };
  sourceOrder?: number;
  chapter?: ResearchStructureInput | null;
  section?: ResearchStructureInput | null;
  researchTreatment?: ResearchTreatment;
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
  relationClass?: string;
  directionality?: string;
  conceptIds?: string[];
  evidenceBasis?: string;
  rationale?: string;
  limits?: string;
  verifiedOn?: string;
  sourceSupport?: ResearchSourceRef[];
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

export type ResearchEnglishCorpusInput = {
  instrumentId: string;
  /** Legacy ID retained by a frozen source corpus, when different. */
  sourceInstrumentId?: string;
  corpusFile: string;
  originalLanguages: string[];
  totalUnitCount: number;
  storedEnglishUnitCount: number;
  currentAlignedEnglishUnitCount: number;
  temporallyMismatchedEnglishUnitCount: number;
  missingEnglishUnitCount: number;
  completionPercent: number;
  coverageStatus: string;
  translationStatuses: string[];
  unitCoverageStatuses: string[];
  versionLabels: string[];
  englishSourceRecords: ResearchSourceRef[];
  missingUnitIds: string[];
  missingCoverageStatuses: string[];
};

export type ResearchEnglishCorpusCoverageInput = {
  schemaVersion: string;
  reviewedOn: string;
  scope: string;
  totals: {
    corpusCount: number;
    totalUnitCount: number;
    storedEnglishUnitCount: number;
    currentAlignedEnglishUnitCount: number;
    temporallyMismatchedEnglishUnitCount: number;
    missingEnglishUnitCount: number;
    completionPercent: number;
    currentAlignedPercent: number;
  };
  corpora: ResearchEnglishCorpusInput[];
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
  englishCorpusCoverage?: ResearchEnglishCorpusCoverageInput;
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
    corpusRecordCount: number;
    navigationExcerptCount: number;
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
  versionAsOf: string | null;
  summary: string;
  actorTags: string[];
  scopeTags: string[];
  originalLanguage: string | null;
  englishTranslationStatus: string | null;
  englishCoverageStatus: string | null;
  englishAlignmentStatus: string | null;
  sourceOrder: number;
  analysisRole: ResearchAnalysisRole;
  metricEligible: boolean;
  canonicalProvisionId: string | null;
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
  measurementState: ResearchConceptMeasurementState;
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
  corpusRecordCount: number;
  excludedNavigationExcerptCount: number;
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
  jurisdictionRootId: string;
  jurisdictionName: string;
  jurisdictionIsoCode: string | null;
  category: string;
  legalForce: string;
  lifecycleStatus: string;
  statusAsOf: string;
  atlasOrder: number;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  conceptMeasurementState: ResearchConceptMeasurementState;
  includedInDefaultAnalysis: boolean;
  localUnitCount: number;
  corpusRecordCount: number;
  navigationExcerptCount: number;
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

export type ResearchTranslationAuthorityClass =
  | "official-text"
  | "official-reference"
  | "government-reference"
  | "project-reference"
  | "other-reference";

export type ResearchTranslationCorpusDatum = {
  instrumentId: string;
  sourceInstrumentId?: string;
  corpusFile: string;
  originalLanguages: string[];
  totalUnitCount: number;
  storedEnglishUnitCount: number;
  currentAlignedEnglishUnitCount: number;
  temporallyMismatchedEnglishUnitCount: number;
  missingEnglishUnitCount: number;
  completionPercent: number;
  currentAlignedPercent: number;
  coverageStatus: string;
  authorityClasses: ResearchTranslationAuthorityClass[];
  translationStatuses: string[];
  unitCoverageStatuses: string[];
  versionLabels: string[];
  englishSourceRecords: ResearchSourceRef[];
  missingUnitIds: string[];
  anomalyProvisionIds: string[];
};

export type ResearchTranslationIntegrity = {
  reviewedOn: string;
  scope: string;
  totals: ResearchEnglishCorpusCoverageInput["totals"];
  authorityCorpusCounts: Record<ResearchTranslationAuthorityClass, number>;
  corpora: ResearchTranslationCorpusDatum[];
};

export type ResearchRelationDatum = {
  id: string;
  source: { type: string; id: string; instrumentId: string | null };
  target: { type: string; id: string; instrumentId: string | null };
  type: string;
  relationClass: string;
  directionality: string;
  conceptIds: string[];
  status: string;
  confidence: string;
  evidenceBasis: string;
  rationale: string;
  limits: string;
  verifiedOn: string;
  sourceSupport: ResearchSourceRef[];
};

export type ResearchBridgeEdge = {
  id: string;
  leftInstrumentId: string;
  rightInstrumentId: string;
  reviewedRelationIds: string[];
  candidateRelationIds: string[];
  conceptIds: string[];
};

export type ResearchBridgeNode = {
  instrumentId: string;
  reviewedDegree: number;
  allDegree: number;
  reviewedCrossJurisdictionDegree: number;
  allCrossJurisdictionDegree: number;
  reviewedBetweenness: number;
  allBetweenness: number;
  reviewedRelationCount: number;
  allRelationCount: number;
  reviewedConceptCount: number;
  allConceptCount: number;
  reviewedRank: number;
  allRank: number;
  rankDelta: number;
  curatedFacetProvisionCount: number;
};

export type ResearchBridgeAtlas = {
  analyticalRelationCount: number;
  reviewedRelationCount: number;
  candidateRelationCount: number;
  nodes: ResearchBridgeNode[];
  edges: ResearchBridgeEdge[];
};

export type ResearchOperationalEdge = {
  relationId: string;
  sourceEndpoint: { type: string; id: string };
  targetEndpoint: { type: string; id: string };
  sourceInstrumentId: string;
  targetInstrumentId: string;
  sourceDate: string;
  targetDate: string;
  type: string;
  relationClass: string;
  status: string;
  confidence: string;
  conceptIds: string[];
  rationale: string;
  limits: string;
};

export type ResearchOperationalPath = {
  id: string;
  rootInstrumentId: string;
  terminalInstrumentId: string;
  instrumentIds: string[];
  relationIds: string[];
  hopCount: number;
  status: "editorial-reviewed" | "includes-candidate";
};

export type ResearchOperationalizationPaths = {
  directedRelationCount: number;
  reviewedDirectedRelationCount: number;
  candidateDirectedRelationCount: number;
  edges: ResearchOperationalEdge[];
  paths: ResearchOperationalPath[];
};

export type ResearchArchetypeMerge = {
  id: string;
  leftId: string;
  rightId: string;
  height: number;
  memberInstrumentIds: string[];
};

export type ResearchArchetypeConceptDifference = {
  conceptId: string;
  clusterMean: number;
  corpusMean: number;
  difference: number;
};

export type ResearchArchetypeCluster = {
  id: string;
  memberInstrumentIds: string[];
  medoidInstrumentId: string;
  boundaryInstrumentIds: string[];
  jurisdictionCount: number;
  meanWithinDistance: number;
  maximumWithinDistance: number;
  centroidWeights: Array<{ conceptId: string; weight: number }>;
  differentiatingConcepts: ResearchArchetypeConceptDifference[];
  legalForceComposition: Array<{ value: string; count: number }>;
  lifecycleComposition: Array<{ value: string; count: number }>;
};

export type ResearchArchetypePartition = {
  clusterCount: number;
  cutHeight: number;
  meanSilhouette: number | null;
  silhouetteInstrumentCount: number;
  clusters: ResearchArchetypeCluster[];
};

export type ResearchArchetypeSensitivity = {
  instrumentId: string;
  tfidfNeighborId: string;
  tfidfNeighborDistance: number;
  prevalenceNeighborId: string;
  prevalenceNeighborDistance: number;
  sameNearestNeighbor: boolean;
};

export type ResearchInstrumentArchetypes = {
  featureConceptIds: string[];
  fitInstrumentIds: string[];
  excludedInstrumentIds: string[];
  rootId: string | null;
  leafOrder: string[];
  maximumMergeHeight: number;
  merges: ResearchArchetypeMerge[];
  partitions: ResearchArchetypePartition[];
  sensitivity: ResearchArchetypeSensitivity[];
  sameNeighborCount: number;
};

export type ResearchMappingEndpointCoverage =
  | "complete-complete"
  | "complete-selected"
  | "selected-selected"
  | "includes-unclassified"
  | "unresolved";

export type ResearchMappingAuditRecord = {
  relationId: string;
  status: string;
  relationClass: string;
  type: string;
  directionality: string;
  confidence: string;
  conceptIds: string[];
  sourceInstrumentId: string | null;
  targetInstrumentId: string | null;
  sourceCoverageClass: ResearchCoverageClass | null;
  targetCoverageClass: ResearchCoverageClass | null;
  endpointCoverage: ResearchMappingEndpointCoverage;
  sourceLegalForce: string | null;
  targetLegalForce: string | null;
  sourceLifecycleStatus: string | null;
  targetLifecycleStatus: string | null;
  crossJurisdiction: boolean | null;
  sourceSupportCount: number;
  hasEvidenceBasis: boolean;
  hasRationale: boolean;
  hasLimits: boolean;
  hasVerifiedOn: boolean;
  verifiedOn: string;
};

export type ResearchMappingAuditConcept = {
  conceptId: string;
  reviewedRelationCount: number;
  candidateRelationCount: number;
  totalRelationCount: number;
};

export type ResearchMappingEvidenceAudit = {
  relationCount: number;
  reviewedRelationCount: number;
  candidateRelationCount: number;
  analyticalRelationCount: number;
  lifecycleRelationCount: number;
  crossJurisdictionRelationCount: number;
  unresolvedEndpointCount: number;
  records: ResearchMappingAuditRecord[];
  concepts: ResearchMappingAuditConcept[];
  relationTypes: Array<{ value: string; count: number }>;
  endpointCoverage: Array<{
    value: ResearchMappingEndpointCoverage;
    count: number;
  }>;
};

export type ResearchApplicabilityDateState =
  | "resolved"
  | "unresolved"
  | "missing";

export type ResearchApplicabilityConceptCount = {
  conceptId: string;
  provisionCount: number;
};

export type ResearchApplicabilityProvisionDateGroup = {
  id: string;
  instrumentId: string;
  date: string;
  temporalStatus: ResearchTemporalStatus;
  coverageClass: ResearchCoverageClass;
  provisionIds: string[];
  provisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  conceptCounts: ResearchApplicabilityConceptCount[];
};

export type ResearchApplicabilityStatusEvent = ResearchStatusEventInput & {
  temporalStatus: ResearchTemporalStatus;
};

export type ResearchUnresolvedProvisionDate = {
  provisionId: string;
  instrumentId: string;
  rawDate: string;
  coverageClass: ResearchCoverageClass;
};

export type ResearchUnresolvedStatusEvent = Omit<
  ResearchStatusEventInput,
  "date"
> & {
  rawDate: string;
};

export type ResearchApplicabilityInstrument = {
  instrumentId: string;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  totalProvisionCount: number;
  resolvedProvisionDateCount: number;
  missingProvisionDateCount: number;
  unresolvedProvisionDateCount: number;
  beforeSnapshotProvisionCount: number;
  onSnapshotProvisionCount: number;
  futureProvisionCount: number;
  provisionDateGroupIds: string[];
  statusEventIds: string[];
  unresolvedStatusEventIds: string[];
};

export type ResearchApplicabilityHorizon = {
  snapshotDate: string;
  earliestResolvedDate: string | null;
  latestResolvedDate: string | null;
  resolvedProvisionDateCount: number;
  missingProvisionDateCount: number;
  unresolvedProvisionDateCount: number;
  beforeSnapshotProvisionCount: number;
  onSnapshotProvisionCount: number;
  futureProvisionCount: number;
  resolvedStatusEventCount: number;
  unresolvedStatusEventCount: number;
  provisionDateGroups: ResearchApplicabilityProvisionDateGroup[];
  statusEvents: ResearchApplicabilityStatusEvent[];
  missingProvisionIds: string[];
  unresolvedProvisionDates: ResearchUnresolvedProvisionDate[];
  unresolvedStatusEvents: ResearchUnresolvedStatusEvent[];
  instruments: ResearchApplicabilityInstrument[];
};

export type ResearchNeighborhoodRankStability = {
  distance: number;
  baseRank: number;
  leaveOneThemeOutMinimumRank: number;
  leaveOneThemeOutMaximumRank: number;
  firstPlaceCount: number;
  unchangedRankCount: number;
};

export type ResearchNeighborhoodConceptContributor = {
  conceptId: string;
  contribution: number;
  shareOfSquaredDistance: number;
};

export type ResearchNeighborhoodCandidate = {
  neighborInstrumentId: string;
  cosine: ResearchNeighborhoodRankStability;
  hellinger: ResearchNeighborhoodRankStability;
  cosineContributors: ResearchNeighborhoodConceptContributor[];
  hellingerContributors: ResearchNeighborhoodConceptContributor[];
};

export type ResearchNeighborhoodInstrument = {
  instrumentId: string;
  cosineNearestNeighborId: string;
  cosineNearestDistance: number;
  hellingerNearestNeighborId: string;
  hellingerNearestDistance: number;
  sameNearestNeighbor: boolean;
  cosineNearestStabilityCount: number;
  hellingerNearestStabilityCount: number;
  candidates: ResearchNeighborhoodCandidate[];
};

export type ResearchNeighborhoodStability = {
  featureConceptIds: string[];
  themeIds: string[];
  fitInstrumentIds: string[];
  excludedInstrumentIds: string[];
  themeOmissionCount: number;
  records: ResearchNeighborhoodInstrument[];
};

export type ResearchAnnotationCoverage = {
  recordedProvisionCount: number;
  missingProvisionCount: number;
  coveragePercent: number;
};

export type ResearchApplicabilityAnnotationCoverage =
  ResearchAnnotationCoverage & {
    resolvedProvisionCount: number;
    unresolvedProvisionCount: number;
  };

export type ResearchGranularityTextCoverage = {
  storedTextProvisionCount: number;
  missingTextProvisionCount: number;
  storedTextCoveragePercent: number;
  storedUnicodeCharacterCount: number;
  meanUnicodeCharactersPerStoredProvision: number | null;
  medianUnicodeCharactersPerStoredProvision: number | null;
};

export type ResearchGranularityInstrument = {
  instrumentId: string;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  includedInDefaultAnalysis: boolean;
  corpusRecordCount: number;
  excludedNavigationExcerptCount: number;
  totalProvisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  substantiveShare: number;
  structuralContextShare: number;
  unreviewedShare: number;
  conceptAssignmentCount: number;
  substantiveConceptAssignmentCount: number;
  conceptAssignmentsPerProvision: number | null;
  conceptAssignmentsPerSubstantiveProvision: number | null;
  mappedProvisionCount: number;
  unmappedProvisionCount: number;
  mappedSubstantiveProvisionCount: number;
  multiConceptProvisionCount: number;
  maximumConceptAssignmentsOnProvision: number;
  annotationCoverage: {
    actorTags: ResearchAnnotationCoverage;
    scopeTags: ResearchAnnotationCoverage;
    appliesFrom: ResearchApplicabilityAnnotationCoverage;
  };
  textCoverage: ResearchGranularityTextCoverage;
};

export type ResearchGranularityCoverageClassSummary = {
  coverageClass: ResearchCoverageClass;
  instrumentCount: number;
  corpusRecordCount: number;
  excludedNavigationExcerptCount: number;
  provisionCount: number;
  substantiveProvisionCount: number;
  structuralContextCount: number;
  unreviewedProvisionCount: number;
  conceptAssignmentCount: number;
  conceptAssignmentsPerProvision: number | null;
  actorTagRecordedProvisionCount: number;
  scopeTagRecordedProvisionCount: number;
  appliesFromRecordedProvisionCount: number;
  storedTextProvisionCount: number;
  missingTextProvisionCount: number;
};

export type ResearchGranularityAudit = {
  instruments: ResearchGranularityInstrument[];
  coverageClasses: ResearchGranularityCoverageClassSummary[];
};

export type ResearchArticleMicroscopeBand = {
  provisionId: string;
  index: number;
  startRatio: number;
  endRatio: number;
  locator: string;
  title: string;
  relevance: ResearchRelevance;
  analysisRole: ResearchAnalysisRole;
  metricEligible: boolean;
  canonicalProvisionId: string | null;
  conceptIds: string[];
  conceptAssignmentCount: number;
  structureId: string;
  hasActorTags: boolean;
  hasScopeTags: boolean;
  appliesFromState: ResearchApplicabilityDateState;
};

export type ResearchArticleMicroscopeConceptTrack = {
  conceptId: string;
  provisionCount: number;
  firstIndex: number;
  lastIndex: number;
  meanPosition: number;
};

export type ResearchArticleMicroscopeInstrument = {
  instrumentId: string;
  coverageMode: string;
  coverageClass: ResearchCoverageClass;
  includedInDefaultAnalysis: boolean;
  metricEligibleProvisionCount: number;
  navigationExcerptCount: number;
  totalProvisionCount: number;
  maximumConceptAssignmentCount: number;
  bands: ResearchArticleMicroscopeBand[];
  conceptTracks: ResearchArticleMicroscopeConceptTrack[];
};

export type ResearchArticleMicroscope = {
  instruments: ResearchArticleMicroscopeInstrument[];
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
    translationIntegrityDefinition: string;
    bridgeDefinition: string;
    operationalPathDefinition: string;
    archetypeDefinition: string;
    relationAuditDefinition: string;
    applicabilityHorizonDefinition: string;
    neighborhoodStabilityDefinition: string;
    granularityAuditDefinition: string;
    articleMicroscopeDefinition: string;
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
  translationIntegrity: ResearchTranslationIntegrity;
  relations: ResearchRelationDatum[];
  bridgeAtlas: ResearchBridgeAtlas;
  operationalizationPaths: ResearchOperationalizationPaths;
  instrumentArchetypes: ResearchInstrumentArchetypes;
  mappingEvidenceAudit: ResearchMappingEvidenceAudit;
  applicabilityHorizon: ResearchApplicabilityHorizon;
  neighborhoodStability: ResearchNeighborhoodStability;
  granularityAudit: ResearchGranularityAudit;
  articleMicroscope: ResearchArticleMicroscope;
};

export type ResearchLabExportPhase =
  | "patterns"
  | "relations"
  | "models"
  | "dynamics";

export type ResearchLabExportView =
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

export type ResearchLabExportOptions = {
  phase: ResearchLabExportPhase;
  view: ResearchLabExportView;
  coverageScope: "complete" | "all";
  relevanceScope: "substantive" | "all";
};

export type ResearchLabShareState = Pick<
  ResearchLabExportOptions,
  "view" | "coverageScope" | "relevanceScope"
>;

export const RESEARCH_LAB_EXPORT_LIMITATIONS = {
  sharedStateFields: ["view", "coverageScope", "relevanceScope"],
  viewLocalControlsIncluded: false,
  omittedViewLocalControlKinds: [
    "metric",
    "threshold",
    "instrument-selection",
    "provision-selection",
    "date-position",
    "playback-state",
    "display-scale",
  ],
  note:
    "This export records the shared Research Lab view, coverage scope and relevance scope. Each viewData object declares the exact backing scope it exports. View-local thresholds, metrics, selections and display positions are not included.",
} as const;

export type ResearchLabExportPayload = {
  schemaVersion: "research-lab-view-export.v2";
  snapshotDate: string;
  selection: ResearchLabExportOptions;
  exportLimitations: typeof RESEARCH_LAB_EXPORT_LIMITATIONS;
  methodology: ResearchLabData["methodology"];
  sample: {
    displayedInstrumentIds: string[];
    analyticalInstrumentIds: string[];
    visibleProvisionIds: string[];
    displayedInstrumentCount: number;
    analyticalInstrumentCount: number;
    visibleProvisionCount: number;
    partialCorpusMeaning: string;
    viewScope: ResearchLabExportViewScope;
  };
  viewData: {
    scope: ResearchLabExportViewScope;
    data: unknown;
  };
};

export type ResearchLabExportViewScope = {
  basis:
    | "shared-display-selection"
    | "shared-analytical-selection"
    | "all-recorded-instruments"
    | "derived-complete-corpus-fit";
  instrumentIds: string[];
  analyticalInstrumentIds: string[];
  provisionIds: string[] | null;
  relationIds: string[] | null;
  coverageScopeApplied: boolean;
  relevanceScopeApplied: boolean;
  note: string;
};

/**
 * Preserve the explorer's existing hash state while replacing the Research Lab
 * portion with one canonical, restorable schema. The enclosing explorer owns
 * validation when it reads these values back.
 */
export function buildResearchLabShareHash(
  currentHash: string,
  state: ResearchLabShareState,
): string {
  const params = new URLSearchParams(currentHash.replace(/^#/, ""));
  params.delete("researchPhase");
  params.set("view", "research");
  params.set("researchView", state.view);
  params.set("researchCoverage", state.coverageScope);
  params.set("researchRelevance", state.relevanceScope);
  return `#${params.toString()}`;
}

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

export function conceptMeasurementStateForCoverage(
  coverageClass: ResearchCoverageClass,
): ResearchConceptMeasurementState {
  return coverageClass === "complete"
    ? "observed-complete"
    : "unknown-partial";
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

function researchTreatmentForProvision(
  provision: ResearchProvisionInput,
): Required<Pick<ResearchTreatment, "role" | "metricEligible">> &
  Pick<ResearchTreatment, "canonicalProvisionId" | "note"> {
  const treatment = provision.researchTreatment;
  const isNavigationExcerpt =
    treatment?.role === "navigation-analytical-excerpt";
  return {
    role: treatment?.role ?? "metric-unit",
    metricEligible:
      treatment?.metricEligible !== false && !isNavigationExcerpt,
    canonicalProvisionId: treatment?.canonicalProvisionId ?? null,
    note: treatment?.note,
  };
}

function provisionIsMetricEligible(
  provision: ResearchProvisionInput,
): boolean {
  return researchTreatmentForProvision(provision).metricEligible;
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
    provisionIsMetricEligible(provision) &&
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
    const english = provision.translations?.en;
    const researchTreatment = researchTreatmentForProvision(provision);
    return {
      id: provision.id,
      instrumentId: provision.instrumentId,
      locator: provision.locator,
      title: provision.title,
      provisionType: provision.provisionType ?? "provision",
      legalEffectStatus: provision.legalEffectStatus ?? null,
      appliesFrom: provision.appliesFrom ?? null,
      versionAsOf: provision.versionAsOf ?? null,
      summary: provision.summary ?? "",
      actorTags: [...(provision.actorTags ?? [])],
      scopeTags: [...(provision.scopeTags ?? [])],
      originalLanguage: provision.textAvailability?.language ?? null,
      englishTranslationStatus: english?.status ?? null,
      englishCoverageStatus: english?.coverageStatus ?? null,
      englishAlignmentStatus: english?.alignmentStatus ?? null,
      sourceOrder: provision.sourceOrder ?? nextOrder,
      analysisRole: researchTreatment.role,
      metricEligible: researchTreatment.metricEligible,
      canonicalProvisionId:
        researchTreatment.canonicalProvisionId ?? null,
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
  const metricProvisions = input.provisions.filter(provisionIsMetricEligible);
  const relevanceCounts: Record<ResearchRelevance, number> = {
    "substantive-topic": 0,
    "structural-context": 0,
    unreviewed: 0,
  };
  metricProvisions.forEach((provision) => {
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
      corpusRecordCount: input.provisions.length,
      navigationExcerptCount:
        input.provisions.length - metricProvisions.length,
      provisionCount: metricProvisions.length,
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
        id: "navigation-excerpts-non-metric",
        title: "Navigation excerpts are not analysis units",
        detail:
          "Editorial child anchors remain available for source and concept navigation, but are excluded from provision counts, fingerprints, prevalence, co-occurrence, structural profiles, and granularity statistics when their complete parent unit is already stored.",
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
        provisionIsMetricEligible(provision) &&
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
      measurementState: conceptMeasurementStateForCoverage(coverageClass),
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
    const instrumentRecords = provisions
      .filter((provision) => provision.instrumentId === instrument.id)
      .sort(
        (left, right) =>
          left.sourceOrder - right.sourceOrder ||
          left.locator.localeCompare(right.locator, undefined, { numeric: true }),
      );
    const instrumentProvisions = instrumentRecords.filter(
      (provision) => provision.metricEligible,
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
      corpusRecordCount: instrumentRecords.length,
      excludedNavigationExcerptCount:
        instrumentRecords.length - instrumentProvisions.length,
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
        provisionIsMetricEligible(provision) &&
        relevanceForProvision(provision) === "substantive-topic" &&
        conceptsForProvision(provision).includes(concept.id),
    );
    const structural = input.provisions.filter(
      (provision) =>
        provisionIsMetricEligible(provision) &&
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
      const instrumentRecords = input.provisions.filter(
        (provision) => provision.instrumentId === instrument.id,
      );
      const instrumentProvisions = instrumentRecords.filter(
        provisionIsMetricEligible,
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
        jurisdictionRootId: rootJurisdictionId(
          instrument.jurisdictionId,
          jurisdictionById,
        ),
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
        conceptMeasurementState:
          fingerprint?.measurementState ??
          conceptMeasurementStateForCoverage(coverageClass),
        includedInDefaultAnalysis:
          fingerprint?.includedInDefaultAnalysis ?? false,
        localUnitCount: audit?.localCoverage.localUnitCount ?? 0,
        corpusRecordCount: instrumentRecords.length,
        navigationExcerptCount:
          instrumentRecords.length - instrumentProvisions.length,
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

const translationAuthorityOrder: ResearchTranslationAuthorityClass[] = [
  "official-text",
  "official-reference",
  "government-reference",
  "project-reference",
  "other-reference",
];

function canonicalResearchInstrumentId(instrumentId: string): string {
  if (instrumentId === "vn-decree-356-2025") {
    return "vn-pdpl-implementing-decree-356-2025";
  }
  if (instrumentId === "vn-decree-13-2023") {
    return "vn-personal-data-protection-decree-13-2023";
  }
  return instrumentId;
}

function translationAuthorityClass(
  status: string,
  unitCoverageStatuses: readonly string[],
): ResearchTranslationAuthorityClass {
  const normalized = status.toLowerCase();
  if (normalized.includes("project")) return "project-reference";
  if (
    normalized === "official" ||
    normalized.includes("co-authentic") ||
    normalized.includes("authoritative-equal-status")
  ) {
    return "official-text";
  }
  if (normalized.includes("official-reference")) {
    return "official-reference";
  }
  if (
    normalized.includes("government") ||
    normalized.includes("public-sector") ||
    normalized.includes("public-domain-government")
  ) {
    return "government-reference";
  }
  const unitSummary = unitCoverageStatuses.join(" ").toLowerCase();
  if (unitSummary.includes("project")) return "project-reference";
  if (unitSummary.includes("official-reference")) {
    return "official-reference";
  }
  if (unitSummary.includes("government")) return "government-reference";
  return "other-reference";
}

export function deriveTranslationIntegrity(
  input: Pick<
    ResearchCorpusInput,
    "englishCorpusCoverage" | "provisions"
  >,
): ResearchTranslationIntegrity {
  const report = input.englishCorpusCoverage;
  const authorityCorpusCounts: Record<ResearchTranslationAuthorityClass, number> = {
    "official-text": 0,
    "official-reference": 0,
    "government-reference": 0,
    "project-reference": 0,
    "other-reference": 0,
  };
  if (!report) {
    return {
      reviewedOn: RESEARCH_SNAPSHOT_DATE,
      scope: "No non-English corpus coverage report was supplied.",
      totals: {
        corpusCount: 0,
        totalUnitCount: 0,
        storedEnglishUnitCount: 0,
        currentAlignedEnglishUnitCount: 0,
        temporallyMismatchedEnglishUnitCount: 0,
        missingEnglishUnitCount: 0,
        completionPercent: 0,
        currentAlignedPercent: 0,
      },
      authorityCorpusCounts,
      corpora: [],
    };
  }

  const provisionsByInstrument = new Map<string, ResearchProvisionInput[]>();
  input.provisions.forEach((provision) => {
    const instrumentId = canonicalResearchInstrumentId(provision.instrumentId);
    const list = provisionsByInstrument.get(instrumentId) ?? [];
    list.push(provision);
    provisionsByInstrument.set(instrumentId, list);
  });
  const anomalyPattern =
    /next-phase|not-current|mismatch|temporally|future-phase|superseded-translation/i;

  const corpora = report.corpora.map((corpus) => {
    const instrumentId = canonicalResearchInstrumentId(corpus.instrumentId);
    const authorityClasses = Array.from(
      new Set(
        corpus.translationStatuses.map((status) =>
          translationAuthorityClass(status, corpus.unitCoverageStatuses),
        ),
      ),
    ).sort(
      (left, right) =>
        translationAuthorityOrder.indexOf(left) -
        translationAuthorityOrder.indexOf(right),
    );
    authorityClasses.forEach((authorityClass) => {
      authorityCorpusCounts[authorityClass] += 1;
    });
    const anomalyProvisionIds = (
      provisionsByInstrument.get(instrumentId) ?? []
    )
      .filter((provision) => {
        const translation = provision.translations?.en;
        return Boolean(
          translation &&
            anomalyPattern.test(
              [
                translation.coverageStatus,
                translation.alignmentStatus,
                translation.versionLabel,
              ]
                .filter(Boolean)
                .join(" "),
            ),
        );
      })
      .map((provision) => provision.id)
      .sort();
    return {
      instrumentId,
      ...(corpus.sourceInstrumentId
        ? { sourceInstrumentId: corpus.sourceInstrumentId }
        : {}),
      corpusFile: corpus.corpusFile,
      originalLanguages: [...corpus.originalLanguages],
      totalUnitCount: corpus.totalUnitCount,
      storedEnglishUnitCount: corpus.storedEnglishUnitCount,
      currentAlignedEnglishUnitCount: corpus.currentAlignedEnglishUnitCount,
      temporallyMismatchedEnglishUnitCount:
        corpus.temporallyMismatchedEnglishUnitCount,
      missingEnglishUnitCount: corpus.missingEnglishUnitCount,
      completionPercent: corpus.completionPercent,
      currentAlignedPercent: corpus.totalUnitCount
        ? round((corpus.currentAlignedEnglishUnitCount / corpus.totalUnitCount) * 100, 1)
        : 0,
      coverageStatus: corpus.coverageStatus,
      authorityClasses,
      translationStatuses: [...corpus.translationStatuses],
      unitCoverageStatuses: [...corpus.unitCoverageStatuses],
      versionLabels: [...corpus.versionLabels],
      englishSourceRecords: corpus.englishSourceRecords.map((source) => ({
        ...source,
      })),
      missingUnitIds: [...corpus.missingUnitIds],
      anomalyProvisionIds,
    };
  });

  return {
    reviewedOn: report.reviewedOn,
    scope: report.scope,
    totals: { ...report.totals },
    authorityCorpusCounts,
    corpora,
  };
}

function endpointInstrumentId(
  endpoint: { type: string; id: string },
  provisionById: ReadonlyMap<string, ResearchProvisionInput>,
  instrumentIds: ReadonlySet<string>,
): string | null {
  if (endpoint.type === "instrument") {
    return instrumentIds.has(endpoint.id) ? endpoint.id : null;
  }
  if (endpoint.type === "provision") {
    return provisionById.get(endpoint.id)?.instrumentId ?? null;
  }
  return null;
}

export function deriveResearchRelations(
  input: Pick<ResearchCorpusInput, "relations" | "provisions" | "instruments">,
): ResearchRelationDatum[] {
  const provisionById = new Map(
    input.provisions.map((provision) => [provision.id, provision]),
  );
  const instrumentIds = new Set(
    input.instruments.map((instrument) => instrument.id),
  );
  return input.relations.map((relation) => ({
    id: relation.id,
    source: {
      ...relation.source,
      instrumentId: endpointInstrumentId(
        relation.source,
        provisionById,
        instrumentIds,
      ),
    },
    target: {
      ...relation.target,
      instrumentId: endpointInstrumentId(
        relation.target,
        provisionById,
        instrumentIds,
      ),
    },
    type: relation.type,
    relationClass: relation.relationClass ?? "analytical",
    directionality: relation.directionality ?? "undirected",
    conceptIds: [...(relation.conceptIds ?? [])],
    status: relation.status,
    confidence: relation.confidence,
    evidenceBasis: relation.evidenceBasis ?? "not-recorded",
    rationale: relation.rationale ?? "No rationale is recorded.",
    limits: relation.limits ?? "No limits statement is recorded.",
    verifiedOn: relation.verifiedOn ?? "not-recorded",
    sourceSupport: (relation.sourceSupport ?? []).map((source) => ({ ...source })),
  }));
}

function bridgePairKey(leftInstrumentId: string, rightInstrumentId: string) {
  return [leftInstrumentId, rightInstrumentId].sort().join("::");
}

function normalizedBetweenness(
  nodeIds: readonly string[],
  edges: readonly { leftInstrumentId: string; rightInstrumentId: string }[],
): Map<string, number> {
  const adjacency = new Map(
    nodeIds.map((nodeId) => [nodeId, new Set<string>()]),
  );
  edges.forEach((edge) => {
    adjacency.get(edge.leftInstrumentId)?.add(edge.rightInstrumentId);
    adjacency.get(edge.rightInstrumentId)?.add(edge.leftInstrumentId);
  });
  const centrality = new Map(nodeIds.map((nodeId) => [nodeId, 0]));

  nodeIds.forEach((sourceId) => {
    const stack: string[] = [];
    const predecessors = new Map(
      nodeIds.map((nodeId) => [nodeId, [] as string[]]),
    );
    const pathCount = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    const distance = new Map(nodeIds.map((nodeId) => [nodeId, -1]));
    pathCount.set(sourceId, 1);
    distance.set(sourceId, 0);
    const queue = [sourceId];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const vertex = queue[cursor];
      stack.push(vertex);
      const nextDistance = (distance.get(vertex) ?? -1) + 1;
      [...(adjacency.get(vertex) ?? [])]
        .sort()
        .forEach((neighbor) => {
          if ((distance.get(neighbor) ?? -1) < 0) {
            distance.set(neighbor, nextDistance);
            queue.push(neighbor);
          }
          if (distance.get(neighbor) === nextDistance) {
            pathCount.set(
              neighbor,
              (pathCount.get(neighbor) ?? 0) + (pathCount.get(vertex) ?? 0),
            );
            predecessors.get(neighbor)?.push(vertex);
          }
        });
    }
    const dependency = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
    while (stack.length) {
      const vertex = stack.pop()!;
      predecessors.get(vertex)?.forEach((predecessor) => {
        const denominator = pathCount.get(vertex) ?? 0;
        if (!denominator) return;
        const contribution =
          ((pathCount.get(predecessor) ?? 0) / denominator) *
          (1 + (dependency.get(vertex) ?? 0));
        dependency.set(
          predecessor,
          (dependency.get(predecessor) ?? 0) + contribution,
        );
      });
      if (vertex !== sourceId) {
        centrality.set(
          vertex,
          (centrality.get(vertex) ?? 0) + (dependency.get(vertex) ?? 0),
        );
      }
    }
  });

  const scale =
    nodeIds.length > 2 ? 1 / ((nodeIds.length - 1) * (nodeIds.length - 2)) : 0;
  centrality.forEach((value, nodeId) => {
    centrality.set(nodeId, round(value * scale));
  });
  return centrality;
}

export function deriveQualifiedBridgeAtlas(
  input: Pick<
    ResearchCorpusInput,
    "relations" | "provisions" | "instruments" | "jurisdictions"
  >,
): ResearchBridgeAtlas {
  const relations = deriveResearchRelations(input).filter(
    (relation) =>
      relation.relationClass === "analytical" &&
      relation.source.instrumentId &&
      relation.target.instrumentId &&
      relation.source.instrumentId !== relation.target.instrumentId,
  );
  const edgeMap = new Map<
    string,
    {
      id: string;
      leftInstrumentId: string;
      rightInstrumentId: string;
      reviewedRelationIds: Set<string>;
      candidateRelationIds: Set<string>;
      conceptIds: Set<string>;
    }
  >();
  relations.forEach((relation) => {
    const [leftInstrumentId, rightInstrumentId] = [
      relation.source.instrumentId!,
      relation.target.instrumentId!,
    ].sort();
    const key = bridgePairKey(leftInstrumentId, rightInstrumentId);
    const edge = edgeMap.get(key) ?? {
      id: key,
      leftInstrumentId,
      rightInstrumentId,
      reviewedRelationIds: new Set<string>(),
      candidateRelationIds: new Set<string>(),
      conceptIds: new Set<string>(),
    };
    if (relation.status === "editorial-reviewed") {
      edge.reviewedRelationIds.add(relation.id);
    } else if (relation.status === "candidate") {
      edge.candidateRelationIds.add(relation.id);
    }
    relation.conceptIds.forEach((conceptId) => edge.conceptIds.add(conceptId));
    edgeMap.set(key, edge);
  });
  const edges: ResearchBridgeEdge[] = Array.from(edgeMap.values())
    .map((edge) => ({
      id: edge.id,
      leftInstrumentId: edge.leftInstrumentId,
      rightInstrumentId: edge.rightInstrumentId,
      reviewedRelationIds: [...edge.reviewedRelationIds].sort(),
      candidateRelationIds: [...edge.candidateRelationIds].sort(),
      conceptIds: [...edge.conceptIds].sort(),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const nodeIds = Array.from(
    new Set(
      edges.flatMap((edge) => [edge.leftInstrumentId, edge.rightInstrumentId]),
    ),
  ).sort();
  const reviewedEdges = edges.filter(
    (edge) => edge.reviewedRelationIds.length > 0,
  );
  const reviewedBetweenness = normalizedBetweenness(nodeIds, reviewedEdges);
  const allBetweenness = normalizedBetweenness(nodeIds, edges);
  const jurisdictionById = new Map(
    input.jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
  );
  const rootByInstrument = new Map(
    input.instruments.map((instrument) => [
      instrument.id,
      rootJurisdictionId(instrument.jurisdictionId, jurisdictionById),
    ]),
  );
  const provisionsByInstrument = new Map<string, ResearchProvisionInput[]>();
  input.provisions.forEach((provision) => {
    const list = provisionsByInstrument.get(provision.instrumentId) ?? [];
    list.push(provision);
    provisionsByInstrument.set(provision.instrumentId, list);
  });

  function metricsFor(instrumentId: string, reviewedOnly: boolean) {
    const related = relations.filter(
      (relation) =>
        (!reviewedOnly || relation.status === "editorial-reviewed") &&
        (relation.source.instrumentId === instrumentId ||
          relation.target.instrumentId === instrumentId),
    );
    const neighbors = new Set<string>();
    const crossJurisdictionNeighbors = new Set<string>();
    const conceptIds = new Set<string>();
    related.forEach((relation) => {
      const neighbor =
        relation.source.instrumentId === instrumentId
          ? relation.target.instrumentId
          : relation.source.instrumentId;
      if (!neighbor) return;
      neighbors.add(neighbor);
      if (rootByInstrument.get(neighbor) !== rootByInstrument.get(instrumentId)) {
        crossJurisdictionNeighbors.add(neighbor);
      }
      relation.conceptIds.forEach((conceptId) => conceptIds.add(conceptId));
    });
    return {
      degree: neighbors.size,
      crossJurisdictionDegree: crossJurisdictionNeighbors.size,
      relationCount: related.length,
      conceptCount: conceptIds.size,
    };
  }

  const draftNodes = nodeIds.map((instrumentId) => {
    const reviewed = metricsFor(instrumentId, true);
    const all = metricsFor(instrumentId, false);
    return {
      instrumentId,
      reviewedDegree: reviewed.degree,
      allDegree: all.degree,
      reviewedCrossJurisdictionDegree: reviewed.crossJurisdictionDegree,
      allCrossJurisdictionDegree: all.crossJurisdictionDegree,
      reviewedBetweenness: reviewedBetweenness.get(instrumentId) ?? 0,
      allBetweenness: allBetweenness.get(instrumentId) ?? 0,
      reviewedRelationCount: reviewed.relationCount,
      allRelationCount: all.relationCount,
      reviewedConceptCount: reviewed.conceptCount,
      allConceptCount: all.conceptCount,
      reviewedRank: 0,
      allRank: 0,
      rankDelta: 0,
      curatedFacetProvisionCount: (
        provisionsByInstrument.get(instrumentId) ?? []
      ).filter(
        (provision) =>
          (provision.actorTags?.length ?? 0) > 0 ||
          (provision.scopeTags?.length ?? 0) > 0,
      ).length,
    };
  });
  const atlasOrder = new Map(
    input.instruments.map((instrument, index) => [instrument.id, index]),
  );
  function ranked(
    metric: "reviewed" | "all",
  ): string[] {
    return [...draftNodes]
      .sort((left, right) => {
        const leftBetweenness =
          metric === "reviewed"
            ? left.reviewedBetweenness
            : left.allBetweenness;
        const rightBetweenness =
          metric === "reviewed"
            ? right.reviewedBetweenness
            : right.allBetweenness;
        const leftDegree =
          metric === "reviewed" ? left.reviewedDegree : left.allDegree;
        const rightDegree =
          metric === "reviewed" ? right.reviewedDegree : right.allDegree;
        const leftRelations =
          metric === "reviewed"
            ? left.reviewedRelationCount
            : left.allRelationCount;
        const rightRelations =
          metric === "reviewed"
            ? right.reviewedRelationCount
            : right.allRelationCount;
        return (
          rightBetweenness - leftBetweenness ||
          rightDegree - leftDegree ||
          rightRelations - leftRelations ||
          (atlasOrder.get(left.instrumentId) ?? Number.MAX_SAFE_INTEGER) -
            (atlasOrder.get(right.instrumentId) ?? Number.MAX_SAFE_INTEGER) ||
          left.instrumentId.localeCompare(right.instrumentId)
        );
      })
      .map((node) => node.instrumentId);
  }
  const reviewedRank = new Map(
    ranked("reviewed").map((instrumentId, index) => [instrumentId, index + 1]),
  );
  const allRank = new Map(
    ranked("all").map((instrumentId, index) => [instrumentId, index + 1]),
  );
  const nodes: ResearchBridgeNode[] = draftNodes
    .map((node) => ({
      ...node,
      reviewedRank: reviewedRank.get(node.instrumentId) ?? 0,
      allRank: allRank.get(node.instrumentId) ?? 0,
      rankDelta:
        (reviewedRank.get(node.instrumentId) ?? 0) -
        (allRank.get(node.instrumentId) ?? 0),
    }))
    .sort(
      (left, right) =>
        left.reviewedRank - right.reviewedRank ||
        left.instrumentId.localeCompare(right.instrumentId),
    );

  return {
    analyticalRelationCount: relations.length,
    reviewedRelationCount: relations.filter(
      (relation) => relation.status === "editorial-reviewed",
    ).length,
    candidateRelationCount: relations.filter(
      (relation) => relation.status === "candidate",
    ).length,
    nodes,
    edges,
  };
}

const operationalRelationTypes = new Set([
  "implements",
  "operationalizes",
  "grounded-in",
  "elaborates",
  "supports-operational-evidence",
  "policy-transition",
  "repeals",
  "repeals-and-reenacts",
]);

function representativeInstrumentDate(instrument: ResearchInstrumentInput) {
  return (
    instrument.dates?.adoptedOn ??
    instrument.dates?.publishedOn ??
    instrument.dates?.effectiveFrom ??
    instrument.statusAsOf
  );
}

export function deriveOperationalizationPaths(
  input: Pick<ResearchCorpusInput, "relations" | "provisions" | "instruments">,
): ResearchOperationalizationPaths {
  const relations = deriveResearchRelations(input);
  const instrumentById = new Map(
    input.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const edges: ResearchOperationalEdge[] = relations
    .filter(
      (relation) =>
        relation.directionality === "directed" &&
        operationalRelationTypes.has(relation.type) &&
        relation.source.instrumentId &&
        relation.target.instrumentId &&
        relation.source.instrumentId !== relation.target.instrumentId,
    )
    .map((relation) => {
      const sourceInstrument = instrumentById.get(relation.source.instrumentId!);
      const targetInstrument = instrumentById.get(relation.target.instrumentId!);
      return {
        relationId: relation.id,
        sourceEndpoint: {
          type: relation.source.type,
          id: relation.source.id,
        },
        targetEndpoint: {
          type: relation.target.type,
          id: relation.target.id,
        },
        sourceInstrumentId: relation.source.instrumentId!,
        targetInstrumentId: relation.target.instrumentId!,
        sourceDate: sourceInstrument
          ? representativeInstrumentDate(sourceInstrument)
          : RESEARCH_SNAPSHOT_DATE,
        targetDate: targetInstrument
          ? representativeInstrumentDate(targetInstrument)
          : RESEARCH_SNAPSHOT_DATE,
        type: relation.type,
        relationClass: relation.relationClass,
        status: relation.status,
        confidence: relation.confidence,
        conceptIds: [...relation.conceptIds],
        rationale: relation.rationale,
        limits: relation.limits,
      };
    })
    .sort(
      (left, right) =>
        left.sourceDate.localeCompare(right.sourceDate) ||
        left.relationId.localeCompare(right.relationId),
    );
  const outgoing = new Map<string, ResearchOperationalEdge[]>();
  edges.forEach((edge) => {
    const list = outgoing.get(edge.sourceInstrumentId) ?? [];
    list.push(edge);
    outgoing.set(edge.sourceInstrumentId, list);
  });
  outgoing.forEach((list) => list.sort((left, right) => left.relationId.localeCompare(right.relationId)));
  const paths: ResearchOperationalPath[] = [];
  const pathIds = new Set<string>();

  function visit(
    rootInstrumentId: string,
    currentInstrumentId: string,
    instrumentIds: string[],
    relationIds: string[],
  ) {
    if (relationIds.length > 0) {
      const id = relationIds.join("::");
      if (!pathIds.has(id)) {
        pathIds.add(id);
        paths.push({
          id,
          rootInstrumentId,
          terminalInstrumentId: currentInstrumentId,
          instrumentIds: [...instrumentIds],
          relationIds: [...relationIds],
          hopCount: relationIds.length,
          status: relationIds.some(
            (relationId) =>
              edges.find((edge) => edge.relationId === relationId)?.status ===
              "candidate",
          )
            ? "includes-candidate"
            : "editorial-reviewed",
        });
      }
    }
    if (relationIds.length >= 3) return;
    (outgoing.get(currentInstrumentId) ?? []).forEach((edge) => {
      if (
        relationIds.includes(edge.relationId) ||
        instrumentIds.includes(edge.targetInstrumentId)
      ) {
        return;
      }
      visit(
        rootInstrumentId,
        edge.targetInstrumentId,
        [...instrumentIds, edge.targetInstrumentId],
        [...relationIds, edge.relationId],
      );
    });
  }

  [...outgoing.keys()].sort().forEach((rootInstrumentId) => {
    visit(rootInstrumentId, rootInstrumentId, [rootInstrumentId], []);
  });

  return {
    directedRelationCount: edges.length,
    reviewedDirectedRelationCount: edges.filter(
      (edge) => edge.status === "editorial-reviewed",
    ).length,
    candidateDirectedRelationCount: edges.filter(
      (edge) => edge.status === "candidate",
    ).length,
    edges,
    paths: paths.sort(
      (left, right) =>
        left.rootInstrumentId.localeCompare(right.rootInstrumentId) ||
        left.hopCount - right.hopCount ||
        left.id.localeCompare(right.id),
    ),
  };
}

type ArchetypeVector = {
  instrumentId: string;
  tfidf: number[];
  prevalence: number[];
};

type ArchetypeWorkingCluster = {
  id: string;
  memberInstrumentIds: string[];
};

function normalizeVector(values: readonly number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0),
  );
  return magnitude ? values.map((value) => value / magnitude) : values.map(() => 0);
}

export function cosineDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length || left.length === 0) return 1;
  const leftMagnitude = Math.sqrt(
    left.reduce((sum, value) => sum + value * value, 0),
  );
  const rightMagnitude = Math.sqrt(
    right.reduce((sum, value) => sum + value * value, 0),
  );
  if (!leftMagnitude || !rightMagnitude) return 1;
  const dot = left.reduce(
    (sum, value, index) => sum + value * (right[index] ?? 0),
    0,
  );
  return Math.max(0, Math.min(1, 1 - dot / (leftMagnitude * rightMagnitude)));
}

function archetypePairKey(left: string, right: string): string {
  return [left, right].sort().join("::");
}

function countComposition(
  values: readonly string[],
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (left, right) =>
      right.count - left.count || left.value.localeCompare(right.value),
  );
}

export function deriveInstrumentArchetypes(
  fingerprints: readonly ResearchInstrumentFingerprint[],
  instruments: readonly ResearchInstrumentInput[],
  concepts: readonly ResearchConceptInput[],
): ResearchInstrumentArchetypes {
  const featureConceptIds = concepts.map((concept) => concept.id).sort();
  const fingerprintById = new Map(
    fingerprints.map((fingerprint) => [fingerprint.instrumentId, fingerprint]),
  );
  const instrumentById = new Map(
    instruments.map((instrument) => [instrument.id, instrument]),
  );
  const vectors: ArchetypeVector[] = instruments
    .map((instrument) => {
      const fingerprint = fingerprintById.get(instrument.id);
      if (!fingerprint?.includedInDefaultAnalysis) return null;
      const weightByConcept = new Map(
        fingerprint.weights.map((weight) => [weight.conceptId, weight]),
      );
      const tfidf = normalizeVector(
        featureConceptIds.map(
          (conceptId) => weightByConcept.get(conceptId)?.normalizedTfidf ?? 0,
        ),
      );
      const prevalence = normalizeVector(
        featureConceptIds.map(
          (conceptId) => weightByConcept.get(conceptId)?.prevalence ?? 0,
        ),
      );
      if (!tfidf.some((value) => value > 0)) return null;
      return { instrumentId: instrument.id, tfidf, prevalence };
    })
    .filter((vector): vector is ArchetypeVector => Boolean(vector))
    .sort((left, right) => left.instrumentId.localeCompare(right.instrumentId));
  const vectorById = new Map(
    vectors.map((vector) => [vector.instrumentId, vector]),
  );
  const fitInstrumentIds = vectors.map((vector) => vector.instrumentId);
  const fitInstrumentIdSet = new Set(fitInstrumentIds);
  const excludedInstrumentIds = instruments
    .map((instrument) => instrument.id)
    .filter((instrumentId) => !fitInstrumentIdSet.has(instrumentId))
    .sort();
  const pairDistances = new Map<string, number>();
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      pairDistances.set(
        archetypePairKey(vectors[left].instrumentId, vectors[right].instrumentId),
        cosineDistance(vectors[left].tfidf, vectors[right].tfidf),
      );
    }
  }

  function distanceBetweenInstruments(leftId: string, rightId: string): number {
    if (leftId === rightId) return 0;
    return pairDistances.get(archetypePairKey(leftId, rightId)) ?? 1;
  }

  function averageLinkageDistance(
    left: ArchetypeWorkingCluster,
    right: ArchetypeWorkingCluster,
  ): number {
    let sum = 0;
    let pairCount = 0;
    left.memberInstrumentIds.forEach((leftId) => {
      right.memberInstrumentIds.forEach((rightId) => {
        sum += distanceBetweenInstruments(leftId, rightId);
        pairCount += 1;
      });
    });
    return pairCount ? sum / pairCount : 1;
  }

  let activeClusters: ArchetypeWorkingCluster[] = fitInstrumentIds.map(
    (instrumentId) => ({
      id: `instrument:${instrumentId}`,
      memberInstrumentIds: [instrumentId],
    }),
  );
  const merges: ResearchArchetypeMerge[] = [];
  while (activeClusters.length > 1) {
    let selected:
      | {
          leftIndex: number;
          rightIndex: number;
          distance: number;
          tieKey: string;
        }
      | undefined;
    for (let leftIndex = 0; leftIndex < activeClusters.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < activeClusters.length;
        rightIndex += 1
      ) {
        const left = activeClusters[leftIndex];
        const right = activeClusters[rightIndex];
        const distance = averageLinkageDistance(left, right);
        const tieKey = archetypePairKey(
          left.memberInstrumentIds.join("|"),
          right.memberInstrumentIds.join("|"),
        );
        if (
          !selected ||
          distance < selected.distance - 1e-12 ||
          (Math.abs(distance - selected.distance) <= 1e-12 &&
            tieKey.localeCompare(selected.tieKey) < 0)
        ) {
          selected = { leftIndex, rightIndex, distance, tieKey };
        }
      }
    }
    if (!selected) break;
    const candidates = [
      activeClusters[selected.leftIndex],
      activeClusters[selected.rightIndex],
    ].sort((left, right) =>
      left.memberInstrumentIds.join("|").localeCompare(
        right.memberInstrumentIds.join("|"),
      ),
    );
    const id = `archetype-merge-${String(merges.length + 1).padStart(2, "0")}`;
    const memberInstrumentIds = Array.from(
      new Set(candidates.flatMap((cluster) => cluster.memberInstrumentIds)),
    ).sort();
    merges.push({
      id,
      leftId: candidates[0].id,
      rightId: candidates[1].id,
      height: round(selected.distance),
      memberInstrumentIds,
    });
    activeClusters = activeClusters.filter(
      (_, index) =>
        index !== selected.leftIndex && index !== selected.rightIndex,
    );
    activeClusters.push({ id, memberInstrumentIds });
    activeClusters.sort((left, right) =>
      left.memberInstrumentIds.join("|").localeCompare(
        right.memberInstrumentIds.join("|"),
      ),
    );
  }
  const rootId = activeClusters[0]?.id ?? null;
  const mergeById = new Map(merges.map((merge) => [merge.id, merge]));
  const leafOrder: string[] = [];
  function visitDendrogram(nodeId: string) {
    if (nodeId.startsWith("instrument:")) {
      leafOrder.push(nodeId.slice("instrument:".length));
      return;
    }
    const merge = mergeById.get(nodeId);
    if (!merge) return;
    visitDendrogram(merge.leftId);
    visitDendrogram(merge.rightId);
  }
  if (rootId) visitDendrogram(rootId);

  const corpusMean = featureConceptIds.map((_, conceptIndex) =>
    vectors.length
      ? vectors.reduce((sum, vector) => sum + vector.tfidf[conceptIndex], 0) /
        vectors.length
      : 0,
  );

  function meanPairDistance(memberInstrumentIds: readonly string[]): number {
    let sum = 0;
    let count = 0;
    for (let left = 0; left < memberInstrumentIds.length; left += 1) {
      for (let right = left + 1; right < memberInstrumentIds.length; right += 1) {
        sum += distanceBetweenInstruments(
          memberInstrumentIds[left],
          memberInstrumentIds[right],
        );
        count += 1;
      }
    }
    return count ? sum / count : 0;
  }

  function clusterRecord(
    id: string,
    memberInstrumentIds: string[],
  ): ResearchArchetypeCluster {
    const centroid = featureConceptIds.map((_, conceptIndex) =>
      memberInstrumentIds.length
        ? memberInstrumentIds.reduce(
            (sum, instrumentId) =>
              sum + (vectorById.get(instrumentId)?.tfidf[conceptIndex] ?? 0),
            0,
          ) / memberInstrumentIds.length
        : 0,
    );
    const memberMeanDistances = memberInstrumentIds
      .map((instrumentId) => ({
        instrumentId,
        meanDistance:
          memberInstrumentIds.length > 1
            ? memberInstrumentIds
                .filter((otherId) => otherId !== instrumentId)
                .reduce(
                  (sum, otherId) =>
                    sum + distanceBetweenInstruments(instrumentId, otherId),
                  0,
                ) /
              (memberInstrumentIds.length - 1)
            : 0,
      }))
      .sort(
        (left, right) =>
          left.meanDistance - right.meanDistance ||
          left.instrumentId.localeCompare(right.instrumentId),
      );
    let maximumWithinDistance = 0;
    for (let left = 0; left < memberInstrumentIds.length; left += 1) {
      for (let right = left + 1; right < memberInstrumentIds.length; right += 1) {
        maximumWithinDistance = Math.max(
          maximumWithinDistance,
          distanceBetweenInstruments(
            memberInstrumentIds[left],
            memberInstrumentIds[right],
          ),
        );
      }
    }
    const memberInstruments = memberInstrumentIds
      .map((instrumentId) => instrumentById.get(instrumentId))
      .filter((instrument): instrument is ResearchInstrumentInput =>
        Boolean(instrument),
      );
    const differentiatingConcepts = featureConceptIds
      .map((conceptId, conceptIndex) => ({
        conceptId,
        clusterMean: round(centroid[conceptIndex]),
        corpusMean: round(corpusMean[conceptIndex]),
        difference: round(centroid[conceptIndex] - corpusMean[conceptIndex]),
      }))
      .sort(
        (left, right) =>
          Math.abs(right.difference) - Math.abs(left.difference) ||
          left.conceptId.localeCompare(right.conceptId),
      );
    return {
      id,
      memberInstrumentIds: [...memberInstrumentIds],
      medoidInstrumentId: memberMeanDistances[0]?.instrumentId ?? "",
      boundaryInstrumentIds: memberMeanDistances
        .slice()
        .reverse()
        .slice(0, Math.min(2, memberInstrumentIds.length))
        .map((item) => item.instrumentId),
      jurisdictionCount: new Set(
        memberInstruments.map((instrument) => instrument.jurisdictionId),
      ).size,
      meanWithinDistance: round(meanPairDistance(memberInstrumentIds)),
      maximumWithinDistance: round(maximumWithinDistance),
      centroidWeights: featureConceptIds.map((conceptId, conceptIndex) => ({
        conceptId,
        weight: round(centroid[conceptIndex]),
      })),
      differentiatingConcepts,
      legalForceComposition: countComposition(
        memberInstruments.map((instrument) => instrument.legalForce),
      ),
      lifecycleComposition: countComposition(
        memberInstruments.map((instrument) => instrument.lifecycleStatus),
      ),
    };
  }

  function silhouetteFor(
    clusters: readonly ResearchArchetypeCluster[],
  ): { mean: number | null; count: number } {
    const values: number[] = [];
    clusters.forEach((cluster) => {
      if (cluster.memberInstrumentIds.length < 2) return;
      cluster.memberInstrumentIds.forEach((instrumentId) => {
        const within =
          cluster.memberInstrumentIds
            .filter((otherId) => otherId !== instrumentId)
            .reduce(
              (sum, otherId) =>
                sum + distanceBetweenInstruments(instrumentId, otherId),
              0,
            ) /
          (cluster.memberInstrumentIds.length - 1);
        const nearestOther = Math.min(
          ...clusters
            .filter((other) => other.id !== cluster.id)
            .map(
              (other) =>
                other.memberInstrumentIds.reduce(
                  (sum, otherId) =>
                    sum + distanceBetweenInstruments(instrumentId, otherId),
                  0,
                ) / other.memberInstrumentIds.length,
            ),
        );
        const denominator = Math.max(within, nearestOther);
        if (Number.isFinite(nearestOther) && denominator > 0) {
          values.push((nearestOther - within) / denominator);
        }
      });
    });
    return {
      mean: values.length
        ? round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : null,
      count: values.length,
    };
  }

  const minimumClusterCount = vectors.length > 1 ? 2 : vectors.length;
  const maximumClusterCount = Math.min(8, vectors.length);
  const partitions: ResearchArchetypePartition[] = [];
  for (
    let clusterCount = minimumClusterCount;
    clusterCount <= maximumClusterCount;
    clusterCount += 1
  ) {
    const active = new Map<string, string[]>(
      fitInstrumentIds.map((instrumentId) => [
        `instrument:${instrumentId}`,
        [instrumentId],
      ]),
    );
    const appliedMergeCount = Math.max(0, vectors.length - clusterCount);
    merges.slice(0, appliedMergeCount).forEach((merge) => {
      active.delete(merge.leftId);
      active.delete(merge.rightId);
      active.set(merge.id, [...merge.memberInstrumentIds]);
    });
    const clusterMembers = Array.from(active.values()).sort((left, right) =>
      left.join("|").localeCompare(right.join("|")),
    );
    const clusters = clusterMembers.map((memberInstrumentIds, index) =>
      clusterRecord(`A${index + 1}`, memberInstrumentIds),
    );
    const includedHeight =
      appliedMergeCount > 0 ? merges[appliedMergeCount - 1]?.height ?? 0 : 0;
    const excludedHeight =
      merges[appliedMergeCount]?.height ??
      merges.at(-1)?.height ??
      includedHeight;
    const silhouette = silhouetteFor(clusters);
    partitions.push({
      clusterCount,
      cutHeight: round((includedHeight + excludedHeight) / 2),
      meanSilhouette: silhouette.mean,
      silhouetteInstrumentCount: silhouette.count,
      clusters,
    });
  }

  function nearestNeighbor(
    instrumentId: string,
    feature: "tfidf" | "prevalence",
  ): { instrumentId: string; distance: number } | null {
    const source = vectorById.get(instrumentId);
    if (!source) return null;
    return vectors
      .filter((candidate) => candidate.instrumentId !== instrumentId)
      .map((candidate) => ({
        instrumentId: candidate.instrumentId,
        distance: cosineDistance(source[feature], candidate[feature]),
      }))
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          left.instrumentId.localeCompare(right.instrumentId),
      )[0] ?? null;
  }
  const sensitivity = fitInstrumentIds.flatMap((instrumentId) => {
    const tfidf = nearestNeighbor(instrumentId, "tfidf");
    const prevalence = nearestNeighbor(instrumentId, "prevalence");
    if (!tfidf || !prevalence) return [];
    return [
      {
        instrumentId,
        tfidfNeighborId: tfidf.instrumentId,
        tfidfNeighborDistance: round(tfidf.distance),
        prevalenceNeighborId: prevalence.instrumentId,
        prevalenceNeighborDistance: round(prevalence.distance),
        sameNearestNeighbor: tfidf.instrumentId === prevalence.instrumentId,
      },
    ];
  });

  return {
    featureConceptIds,
    fitInstrumentIds,
    excludedInstrumentIds,
    rootId,
    leafOrder,
    maximumMergeHeight: round(merges.at(-1)?.height ?? 0),
    merges,
    partitions,
    sensitivity,
    sameNeighborCount: sensitivity.filter((item) => item.sameNearestNeighbor)
      .length,
  };
}

function mappingEndpointCoverage(
  source: ResearchCoverageClass | null,
  target: ResearchCoverageClass | null,
): ResearchMappingEndpointCoverage {
  if (!source || !target) return "unresolved";
  if (source === "unclassified" || target === "unclassified") {
    return "includes-unclassified";
  }
  if (source === "complete" && target === "complete") {
    return "complete-complete";
  }
  if (source === "selected" && target === "selected") {
    return "selected-selected";
  }
  return "complete-selected";
}

export function deriveMappingEvidenceAudit(
  input: Pick<
    ResearchCorpusInput,
    | "relations"
    | "provisions"
    | "instruments"
    | "jurisdictions"
    | "sourceAudits"
    | "concepts"
  >,
): ResearchMappingEvidenceAudit {
  const relations = deriveResearchRelations(input);
  const originalById = new Map(
    input.relations.map((relation) => [relation.id, relation]),
  );
  const instrumentById = new Map(
    input.instruments.map((instrument) => [instrument.id, instrument]),
  );
  const jurisdictionById = new Map(
    input.jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
  );
  const coverageByInstrument = new Map(
    input.sourceAudits.map((audit) => [
      audit.instrumentId,
      coverageClassForMode(audit.localCoverage.mode),
    ]),
  );
  const records: ResearchMappingAuditRecord[] = relations
    .map((relation) => {
      const original = originalById.get(relation.id);
      const sourceInstrument = relation.source.instrumentId
        ? instrumentById.get(relation.source.instrumentId)
        : undefined;
      const targetInstrument = relation.target.instrumentId
        ? instrumentById.get(relation.target.instrumentId)
        : undefined;
      const sourceCoverageClass = sourceInstrument
        ? coverageByInstrument.get(sourceInstrument.id) ?? "unclassified"
        : null;
      const targetCoverageClass = targetInstrument
        ? coverageByInstrument.get(targetInstrument.id) ?? "unclassified"
        : null;
      const sourceRoot = sourceInstrument
        ? rootJurisdictionId(sourceInstrument.jurisdictionId, jurisdictionById)
        : null;
      const targetRoot = targetInstrument
        ? rootJurisdictionId(targetInstrument.jurisdictionId, jurisdictionById)
        : null;
      return {
        relationId: relation.id,
        status: relation.status,
        relationClass: relation.relationClass,
        type: relation.type,
        directionality: relation.directionality,
        confidence: relation.confidence,
        conceptIds: [...relation.conceptIds],
        sourceInstrumentId: relation.source.instrumentId,
        targetInstrumentId: relation.target.instrumentId,
        sourceCoverageClass,
        targetCoverageClass,
        endpointCoverage: mappingEndpointCoverage(
          sourceCoverageClass,
          targetCoverageClass,
        ),
        sourceLegalForce: sourceInstrument?.legalForce ?? null,
        targetLegalForce: targetInstrument?.legalForce ?? null,
        sourceLifecycleStatus: sourceInstrument?.lifecycleStatus ?? null,
        targetLifecycleStatus: targetInstrument?.lifecycleStatus ?? null,
        crossJurisdiction:
          sourceRoot && targetRoot ? sourceRoot !== targetRoot : null,
        sourceSupportCount: relation.sourceSupport.length,
        hasEvidenceBasis: Boolean(
          original?.evidenceBasis?.trim() &&
            original.evidenceBasis !== "not-recorded",
        ),
        hasRationale: Boolean(original?.rationale?.trim()),
        hasLimits: Boolean(original?.limits?.trim()),
        hasVerifiedOn: Boolean(original?.verifiedOn?.trim()),
        verifiedOn: relation.verifiedOn,
      };
    })
    .sort(
      (left, right) =>
        Number(right.status === "editorial-reviewed") -
          Number(left.status === "editorial-reviewed") ||
        left.relationClass.localeCompare(right.relationClass) ||
        left.type.localeCompare(right.type) ||
        left.relationId.localeCompare(right.relationId),
    );
  const conceptAudit = input.concepts
    .map((concept) => {
      const related = records.filter((record) =>
        record.conceptIds.includes(concept.id),
      );
      return {
        conceptId: concept.id,
        reviewedRelationCount: related.filter(
          (record) => record.status === "editorial-reviewed",
        ).length,
        candidateRelationCount: related.filter(
          (record) => record.status === "candidate",
        ).length,
        totalRelationCount: related.length,
      };
    })
    .sort(
      (left, right) =>
        right.totalRelationCount - left.totalRelationCount ||
        left.conceptId.localeCompare(right.conceptId),
    );
  const relationTypes = countComposition(records.map((record) => record.type));
  const coverageOrder: ResearchMappingEndpointCoverage[] = [
    "complete-complete",
    "complete-selected",
    "selected-selected",
    "includes-unclassified",
    "unresolved",
  ];
  const endpointCoverage = coverageOrder.map((value) => ({
    value,
    count: records.filter((record) => record.endpointCoverage === value).length,
  }));

  return {
    relationCount: records.length,
    reviewedRelationCount: records.filter(
      (record) => record.status === "editorial-reviewed",
    ).length,
    candidateRelationCount: records.filter(
      (record) => record.status === "candidate",
    ).length,
    analyticalRelationCount: records.filter(
      (record) => record.relationClass === "analytical",
    ).length,
    lifecycleRelationCount: records.filter(
      (record) => record.relationClass === "lifecycle",
    ).length,
    crossJurisdictionRelationCount: records.filter(
      (record) => record.crossJurisdiction,
    ).length,
    unresolvedEndpointCount: records.filter(
      (record) => record.endpointCoverage === "unresolved",
    ).length,
    records,
    concepts: conceptAudit,
    relationTypes,
    endpointCoverage,
  };
}

function resolvedIsoDate(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const resolved = new Date(timestamp);
  if (
    resolved.getUTCFullYear() !== year ||
    resolved.getUTCMonth() !== month - 1 ||
    resolved.getUTCDate() !== day
  ) {
    return null;
  }
  return normalized;
}

function applicabilityDateState(
  value: string | null | undefined,
): ResearchApplicabilityDateState {
  if (typeof value !== "string" || value.trim() === "") return "missing";
  return resolvedIsoDate(value) ? "resolved" : "unresolved";
}

export function deriveApplicabilityHorizon(
  input: Pick<
    ResearchCorpusInput,
    | "snapshotDate"
    | "instruments"
    | "provisions"
    | "sourceAudits"
    | "statusEvents"
  >,
): ResearchApplicabilityHorizon {
  const snapshotDate = input.snapshotDate ?? RESEARCH_SNAPSHOT_DATE;
  const { auditByInstrument, classByInstrument } = coverageMaps(
    input.sourceAudits,
  );
  const provisionGroups = new Map<
    string,
    { instrumentId: string; date: string; provisions: ResearchProvisionInput[] }
  >();
  const missingProvisionIds: string[] = [];
  const unresolvedProvisionDates: ResearchUnresolvedProvisionDate[] = [];

  input.provisions.forEach((provision) => {
    const state = applicabilityDateState(provision.appliesFrom);
    if (state === "missing") {
      missingProvisionIds.push(provision.id);
      return;
    }
    const date = resolvedIsoDate(provision.appliesFrom);
    if (!date) {
      unresolvedProvisionDates.push({
        provisionId: provision.id,
        instrumentId: provision.instrumentId,
        rawDate: provision.appliesFrom!.trim(),
        coverageClass:
          classByInstrument.get(provision.instrumentId) ?? "unclassified",
      });
      return;
    }
    const key = `${provision.instrumentId}::${date}`;
    const group = provisionGroups.get(key) ?? {
      instrumentId: provision.instrumentId,
      date,
      provisions: [],
    };
    group.provisions.push(provision);
    provisionGroups.set(key, group);
  });

  const provisionDateGroups: ResearchApplicabilityProvisionDateGroup[] =
    Array.from(provisionGroups.values())
      .map((group) => {
        const conceptCounts = new Map<string, number>();
        group.provisions.forEach((provision) => {
          conceptsForProvision(provision)
            .sort()
            .forEach((conceptId) =>
              conceptCounts.set(
                conceptId,
                (conceptCounts.get(conceptId) ?? 0) + 1,
              ),
            );
        });
        return {
          id: `${group.instrumentId}::${group.date}`,
          instrumentId: group.instrumentId,
          date: group.date,
          temporalStatus: temporalStatusFor(group.date, snapshotDate),
          coverageClass:
            classByInstrument.get(group.instrumentId) ?? "unclassified",
          provisionIds: group.provisions
            .map((provision) => provision.id)
            .sort(),
          provisionCount: group.provisions.length,
          substantiveProvisionCount: group.provisions.filter(
            (provision) =>
              relevanceForProvision(provision) === "substantive-topic",
          ).length,
          structuralContextCount: group.provisions.filter(
            (provision) =>
              relevanceForProvision(provision) === "structural-context",
          ).length,
          unreviewedProvisionCount: group.provisions.filter(
            (provision) => relevanceForProvision(provision) === "unreviewed",
          ).length,
          conceptCounts: Array.from(
            conceptCounts,
            ([conceptId, provisionCount]) => ({ conceptId, provisionCount }),
          ).sort(
            (left, right) =>
              right.provisionCount - left.provisionCount ||
              left.conceptId.localeCompare(right.conceptId),
          ),
        };
      })
      .sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          left.instrumentId.localeCompare(right.instrumentId),
      );

  const statusEvents: ResearchApplicabilityStatusEvent[] = [];
  const unresolvedStatusEvents: ResearchUnresolvedStatusEvent[] = [];
  input.statusEvents.forEach((event) => {
    const date = resolvedIsoDate(event.date);
    if (!date) {
      const { date: rawDate, ...eventWithoutDate } = event;
      unresolvedStatusEvents.push({
        ...eventWithoutDate,
        rawDate: typeof rawDate === "string" ? rawDate.trim() : "",
      });
      return;
    }
    statusEvents.push({
      ...event,
      date,
      temporalStatus: temporalStatusFor(date, snapshotDate),
    });
  });
  statusEvents.sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
  );
  unresolvedStatusEvents.sort((left, right) => left.id.localeCompare(right.id));
  missingProvisionIds.sort();
  unresolvedProvisionDates.sort(
    (left, right) =>
      left.instrumentId.localeCompare(right.instrumentId) ||
      left.provisionId.localeCompare(right.provisionId),
  );

  const groupsByInstrument = new Map<
    string,
    ResearchApplicabilityProvisionDateGroup[]
  >();
  provisionDateGroups.forEach((group) => {
    const list = groupsByInstrument.get(group.instrumentId) ?? [];
    list.push(group);
    groupsByInstrument.set(group.instrumentId, list);
  });
  const statusEventsByInstrument = new Map<
    string,
    ResearchApplicabilityStatusEvent[]
  >();
  statusEvents.forEach((event) => {
    const list = statusEventsByInstrument.get(event.instrumentId) ?? [];
    list.push(event);
    statusEventsByInstrument.set(event.instrumentId, list);
  });
  const unresolvedEventsByInstrument = new Map<
    string,
    ResearchUnresolvedStatusEvent[]
  >();
  unresolvedStatusEvents.forEach((event) => {
    const list = unresolvedEventsByInstrument.get(event.instrumentId) ?? [];
    list.push(event);
    unresolvedEventsByInstrument.set(event.instrumentId, list);
  });

  const instruments: ResearchApplicabilityInstrument[] = input.instruments
    .map((instrument) => {
      const provisions = input.provisions.filter(
        (provision) => provision.instrumentId === instrument.id,
      );
      const resolvedDates = provisions
        .map((provision) => resolvedIsoDate(provision.appliesFrom))
        .filter((date): date is string => Boolean(date));
      return {
        instrumentId: instrument.id,
        coverageMode:
          auditByInstrument.get(instrument.id)?.localCoverage.mode ??
          "unclassified",
        coverageClass:
          classByInstrument.get(instrument.id) ?? "unclassified",
        totalProvisionCount: provisions.length,
        resolvedProvisionDateCount: resolvedDates.length,
        missingProvisionDateCount: provisions.filter(
          (provision) =>
            applicabilityDateState(provision.appliesFrom) === "missing",
        ).length,
        unresolvedProvisionDateCount: provisions.filter(
          (provision) =>
            applicabilityDateState(provision.appliesFrom) === "unresolved",
        ).length,
        beforeSnapshotProvisionCount: resolvedDates.filter(
          (date) => temporalStatusFor(date, snapshotDate) === "past",
        ).length,
        onSnapshotProvisionCount: resolvedDates.filter(
          (date) => temporalStatusFor(date, snapshotDate) === "on-snapshot",
        ).length,
        futureProvisionCount: resolvedDates.filter(
          (date) => temporalStatusFor(date, snapshotDate) === "future",
        ).length,
        provisionDateGroupIds: (groupsByInstrument.get(instrument.id) ?? []).map(
          (group) => group.id,
        ),
        statusEventIds: (statusEventsByInstrument.get(instrument.id) ?? []).map(
          (event) => event.id,
        ),
        unresolvedStatusEventIds: (
          unresolvedEventsByInstrument.get(instrument.id) ?? []
        ).map((event) => event.id),
      };
    })
    .sort((left, right) =>
      left.instrumentId.localeCompare(right.instrumentId),
    );
  const resolvedDates = [
    ...provisionDateGroups.map((group) => group.date),
    ...statusEvents.map((event) => event.date),
  ].sort();

  return {
    snapshotDate,
    earliestResolvedDate: resolvedDates[0] ?? null,
    latestResolvedDate: resolvedDates.at(-1) ?? null,
    resolvedProvisionDateCount: provisionDateGroups.reduce(
      (sum, group) => sum + group.provisionCount,
      0,
    ),
    missingProvisionDateCount: missingProvisionIds.length,
    unresolvedProvisionDateCount: unresolvedProvisionDates.length,
    beforeSnapshotProvisionCount: provisionDateGroups
      .filter((group) => group.temporalStatus === "past")
      .reduce((sum, group) => sum + group.provisionCount, 0),
    onSnapshotProvisionCount: provisionDateGroups
      .filter((group) => group.temporalStatus === "on-snapshot")
      .reduce((sum, group) => sum + group.provisionCount, 0),
    futureProvisionCount: provisionDateGroups
      .filter((group) => group.temporalStatus === "future")
      .reduce((sum, group) => sum + group.provisionCount, 0),
    resolvedStatusEventCount: statusEvents.length,
    unresolvedStatusEventCount: unresolvedStatusEvents.length,
    provisionDateGroups,
    statusEvents,
    missingProvisionIds,
    unresolvedProvisionDates,
    unresolvedStatusEvents,
    instruments,
  };
}

export function hellingerDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  if (left.length !== right.length || left.length === 0) return 1;
  const leftTotal = left.reduce((sum, value) => sum + Math.max(0, value), 0);
  const rightTotal = right.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (!leftTotal && !rightTotal) return 0;
  if (!leftTotal || !rightTotal) return 1;
  const squared = left.reduce((sum, value, index) => {
    const leftProbability = Math.max(0, value) / leftTotal;
    const rightProbability = Math.max(0, right[index] ?? 0) / rightTotal;
    return (
      sum +
      (Math.sqrt(leftProbability) - Math.sqrt(rightProbability)) ** 2
    );
  }, 0);
  return Math.max(0, Math.min(1, Math.sqrt(squared / 2)));
}

type ResearchNeighborhoodVector = {
  instrumentId: string;
  tfidf: number[];
  prevalenceProbability: number[];
};

function probabilityVector(values: readonly number[]): number[] {
  const nonnegative = values.map((value) => Math.max(0, value));
  const total = nonnegative.reduce((sum, value) => sum + value, 0);
  return total
    ? nonnegative.map((value) => value / total)
    : nonnegative.map(() => 0);
}

function neighborhoodRanking(
  source: ResearchNeighborhoodVector,
  candidates: readonly ResearchNeighborhoodVector[],
  metric: "cosine" | "hellinger",
  activeIndices: readonly number[],
): Map<string, { rank: number; distance: number }> {
  const sourceValues =
    metric === "cosine" ? source.tfidf : source.prevalenceProbability;
  return new Map(
    candidates
      .filter((candidate) => candidate.instrumentId !== source.instrumentId)
      .map((candidate) => {
        const candidateValues =
          metric === "cosine"
            ? candidate.tfidf
            : candidate.prevalenceProbability;
        const left = activeIndices.map((index) => sourceValues[index] ?? 0);
        const right = activeIndices.map((index) => candidateValues[index] ?? 0);
        return {
          instrumentId: candidate.instrumentId,
          distance:
            metric === "cosine"
              ? cosineDistance(left, right)
              : hellingerDistance(left, right),
        };
      })
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          left.instrumentId.localeCompare(right.instrumentId),
      )
      .map((candidate, index) => [
        candidate.instrumentId,
        { rank: index + 1, distance: candidate.distance },
      ]),
  );
}

function neighborhoodContributors(
  conceptIds: readonly string[],
  left: readonly number[],
  right: readonly number[],
  metric: "cosine" | "hellinger",
): ResearchNeighborhoodConceptContributor[] {
  const contributions = conceptIds.map((conceptId, index) => {
    const contribution =
      metric === "cosine"
        ? 0.5 * ((left[index] ?? 0) - (right[index] ?? 0)) ** 2
        : 0.5 *
          (Math.sqrt(left[index] ?? 0) - Math.sqrt(right[index] ?? 0)) ** 2;
    return { conceptId, contribution };
  });
  const total = contributions.reduce(
    (sum, contribution) => sum + contribution.contribution,
    0,
  );
  return contributions
    .filter((contribution) => contribution.contribution > 0)
    .sort(
      (leftContribution, rightContribution) =>
        rightContribution.contribution - leftContribution.contribution ||
        leftContribution.conceptId.localeCompare(rightContribution.conceptId),
    )
    .slice(0, 5)
    .map((contribution) => ({
      conceptId: contribution.conceptId,
      contribution: round(contribution.contribution),
      shareOfSquaredDistance: total
        ? round(contribution.contribution / total)
        : 0,
    }));
}

export function deriveRegulatoryNeighborhoodStability(
  fingerprints: readonly ResearchInstrumentFingerprint[],
  concepts: readonly ResearchConceptInput[],
  themes: readonly ResearchThemeInput[],
): ResearchNeighborhoodStability {
  const featureConceptIds = concepts
    .map((concept) => concept.id)
    .filter((conceptId, index, all) => all.indexOf(conceptId) === index)
    .sort();
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const themeIds = themes
    .filter((theme) =>
      featureConceptIds.some(
        (conceptId) => conceptById.get(conceptId)?.theme === theme.id,
      ),
    )
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((theme) => theme.id);
  const vectors: ResearchNeighborhoodVector[] = fingerprints
    .filter((fingerprint) => fingerprint.includedInDefaultAnalysis)
    .map((fingerprint) => {
      const weightByConcept = new Map(
        fingerprint.weights.map((weight) => [weight.conceptId, weight]),
      );
      const tfidf = normalizeVector(
        featureConceptIds.map(
          (conceptId) => weightByConcept.get(conceptId)?.normalizedTfidf ?? 0,
        ),
      );
      const prevalenceProbability = probabilityVector(
        featureConceptIds.map(
          (conceptId) => weightByConcept.get(conceptId)?.prevalence ?? 0,
        ),
      );
      return {
        instrumentId: fingerprint.instrumentId,
        tfidf,
        prevalenceProbability,
      };
    })
    .filter(
      (vector) =>
        vector.tfidf.some((value) => value > 0) &&
        vector.prevalenceProbability.some((value) => value > 0),
    )
    .sort((left, right) => left.instrumentId.localeCompare(right.instrumentId));
  const fitInstrumentIds = vectors.map((vector) => vector.instrumentId);
  const fitIdSet = new Set(fitInstrumentIds);
  const excludedInstrumentIds = fingerprints
    .map((fingerprint) => fingerprint.instrumentId)
    .filter((instrumentId) => !fitIdSet.has(instrumentId))
    .sort();
  const allIndices = featureConceptIds.map((_, index) => index);
  const omissionIndices = themeIds.map((themeId) =>
    allIndices.filter(
      (index) => conceptById.get(featureConceptIds[index])?.theme !== themeId,
    ),
  );

  const records: ResearchNeighborhoodInstrument[] = vectors.flatMap((source) => {
    if (vectors.length < 2) return [];
    const cosineBase = neighborhoodRanking(
      source,
      vectors,
      "cosine",
      allIndices,
    );
    const hellingerBase = neighborhoodRanking(
      source,
      vectors,
      "hellinger",
      allIndices,
    );
    const cosineOmissions = omissionIndices.map((indices) =>
      neighborhoodRanking(source, vectors, "cosine", indices),
    );
    const hellingerOmissions = omissionIndices.map((indices) =>
      neighborhoodRanking(source, vectors, "hellinger", indices),
    );

    const candidates: ResearchNeighborhoodCandidate[] = vectors
      .filter((candidate) => candidate.instrumentId !== source.instrumentId)
      .map((candidate) => {
        const cosine = cosineBase.get(candidate.instrumentId)!;
        const hellinger = hellingerBase.get(candidate.instrumentId)!;
        const cosineRanks = cosineOmissions.map(
          (ranking) => ranking.get(candidate.instrumentId)?.rank ?? cosine.rank,
        );
        const hellingerRanks = hellingerOmissions.map(
          (ranking) =>
            ranking.get(candidate.instrumentId)?.rank ?? hellinger.rank,
        );
        return {
          neighborInstrumentId: candidate.instrumentId,
          cosine: {
            distance: round(cosine.distance),
            baseRank: cosine.rank,
            leaveOneThemeOutMinimumRank: cosineRanks.length
              ? Math.min(...cosineRanks)
              : cosine.rank,
            leaveOneThemeOutMaximumRank: cosineRanks.length
              ? Math.max(...cosineRanks)
              : cosine.rank,
            firstPlaceCount: cosineRanks.filter((rank) => rank === 1).length,
            unchangedRankCount: cosineRanks.filter(
              (rank) => rank === cosine.rank,
            ).length,
          },
          hellinger: {
            distance: round(hellinger.distance),
            baseRank: hellinger.rank,
            leaveOneThemeOutMinimumRank: hellingerRanks.length
              ? Math.min(...hellingerRanks)
              : hellinger.rank,
            leaveOneThemeOutMaximumRank: hellingerRanks.length
              ? Math.max(...hellingerRanks)
              : hellinger.rank,
            firstPlaceCount: hellingerRanks.filter((rank) => rank === 1).length,
            unchangedRankCount: hellingerRanks.filter(
              (rank) => rank === hellinger.rank,
            ).length,
          },
          cosineContributors: neighborhoodContributors(
            featureConceptIds,
            source.tfidf,
            candidate.tfidf,
            "cosine",
          ),
          hellingerContributors: neighborhoodContributors(
            featureConceptIds,
            source.prevalenceProbability,
            candidate.prevalenceProbability,
            "hellinger",
          ),
        };
      })
      .sort(
        (left, right) =>
          left.cosine.baseRank - right.cosine.baseRank ||
          left.neighborInstrumentId.localeCompare(right.neighborInstrumentId),
      );
    const cosineNearest = candidates.find(
      (candidate) => candidate.cosine.baseRank === 1,
    )!;
    const hellingerNearest = candidates.find(
      (candidate) => candidate.hellinger.baseRank === 1,
    )!;
    return [
      {
        instrumentId: source.instrumentId,
        cosineNearestNeighborId: cosineNearest.neighborInstrumentId,
        cosineNearestDistance: cosineNearest.cosine.distance,
        hellingerNearestNeighborId: hellingerNearest.neighborInstrumentId,
        hellingerNearestDistance: hellingerNearest.hellinger.distance,
        sameNearestNeighbor:
          cosineNearest.neighborInstrumentId ===
          hellingerNearest.neighborInstrumentId,
        cosineNearestStabilityCount: cosineNearest.cosine.firstPlaceCount,
        hellingerNearestStabilityCount:
          hellingerNearest.hellinger.firstPlaceCount,
        candidates,
      },
    ];
  });

  return {
    featureConceptIds,
    themeIds,
    fitInstrumentIds,
    excludedInstrumentIds,
    themeOmissionCount: themeIds.length,
    records,
  };
}

function coveragePercent(count: number, total: number): number {
  return total ? round((count / total) * 100, 1) : 0;
}

function annotationCoverage(
  recordedProvisionCount: number,
  totalProvisionCount: number,
): ResearchAnnotationCoverage {
  return {
    recordedProvisionCount,
    missingProvisionCount: Math.max(
      0,
      totalProvisionCount - recordedProvisionCount,
    ),
    coveragePercent: coveragePercent(
      recordedProvisionCount,
      totalProvisionCount,
    ),
  };
}

function normalizedStoredText(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFC").replace(/\s+/gu, " ").trim();
  return normalized || null;
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function deriveProvisionGranularityAudit(
  input: Pick<
    ResearchCorpusInput,
    "instruments" | "provisions" | "sourceAudits"
  >,
): ResearchGranularityAudit {
  const { auditByInstrument, classByInstrument } = coverageMaps(
    input.sourceAudits,
  );
  const instruments: ResearchGranularityInstrument[] = input.instruments
    .map((instrument) => {
      const corpusRecords = input.provisions.filter(
        (provision) => provision.instrumentId === instrument.id,
      );
      const provisions = corpusRecords.filter(provisionIsMetricEligible);
      const totalProvisionCount = provisions.length;
      const substantive = provisions.filter(
        (provision) =>
          relevanceForProvision(provision) === "substantive-topic",
      );
      const structural = provisions.filter(
        (provision) =>
          relevanceForProvision(provision) === "structural-context",
      );
      const unreviewed = provisions.filter(
        (provision) => relevanceForProvision(provision) === "unreviewed",
      );
      const assignmentCounts = provisions.map(
        (provision) => conceptsForProvision(provision).length,
      );
      const substantiveAssignmentCounts = substantive.map(
        (provision) => conceptsForProvision(provision).length,
      );
      const conceptAssignmentCount = assignmentCounts.reduce(
        (sum, count) => sum + count,
        0,
      );
      const substantiveConceptAssignmentCount =
        substantiveAssignmentCounts.reduce((sum, count) => sum + count, 0);
      const actorTagRecordedProvisionCount = provisions.filter(
        (provision) => (provision.actorTags?.length ?? 0) > 0,
      ).length;
      const scopeTagRecordedProvisionCount = provisions.filter(
        (provision) => (provision.scopeTags?.length ?? 0) > 0,
      ).length;
      const resolvedAppliesFromCount = provisions.filter(
        (provision) =>
          applicabilityDateState(provision.appliesFrom) === "resolved",
      ).length;
      const unresolvedAppliesFromCount = provisions.filter(
        (provision) =>
          applicabilityDateState(provision.appliesFrom) === "unresolved",
      ).length;
      const recordedAppliesFromCount =
        resolvedAppliesFromCount + unresolvedAppliesFromCount;
      const storedTextLengths = provisions.flatMap((provision) => {
        const text = normalizedStoredText(provision.fullText);
        return text ? [Array.from(text).length] : [];
      });
      const storedUnicodeCharacterCount = storedTextLengths.reduce(
        (sum, length) => sum + length,
        0,
      );
      const coverageClass =
        classByInstrument.get(instrument.id) ?? "unclassified";
      return {
        instrumentId: instrument.id,
        coverageMode:
          auditByInstrument.get(instrument.id)?.localCoverage.mode ??
          "unclassified",
        coverageClass,
        includedInDefaultAnalysis: coverageClass === "complete",
        corpusRecordCount: corpusRecords.length,
        excludedNavigationExcerptCount:
          corpusRecords.length - provisions.length,
        totalProvisionCount,
        substantiveProvisionCount: substantive.length,
        structuralContextCount: structural.length,
        unreviewedProvisionCount: unreviewed.length,
        substantiveShare: totalProvisionCount
          ? round(substantive.length / totalProvisionCount)
          : 0,
        structuralContextShare: totalProvisionCount
          ? round(structural.length / totalProvisionCount)
          : 0,
        unreviewedShare: totalProvisionCount
          ? round(unreviewed.length / totalProvisionCount)
          : 0,
        conceptAssignmentCount,
        substantiveConceptAssignmentCount,
        conceptAssignmentsPerProvision: totalProvisionCount
          ? round(conceptAssignmentCount / totalProvisionCount)
          : null,
        conceptAssignmentsPerSubstantiveProvision: substantive.length
          ? round(substantiveConceptAssignmentCount / substantive.length)
          : null,
        mappedProvisionCount: assignmentCounts.filter((count) => count > 0)
          .length,
        unmappedProvisionCount: assignmentCounts.filter((count) => count === 0)
          .length,
        mappedSubstantiveProvisionCount: substantiveAssignmentCounts.filter(
          (count) => count > 0,
        ).length,
        multiConceptProvisionCount: assignmentCounts.filter((count) => count > 1)
          .length,
        maximumConceptAssignmentsOnProvision: Math.max(0, ...assignmentCounts),
        annotationCoverage: {
          actorTags: annotationCoverage(
            actorTagRecordedProvisionCount,
            totalProvisionCount,
          ),
          scopeTags: annotationCoverage(
            scopeTagRecordedProvisionCount,
            totalProvisionCount,
          ),
          appliesFrom: {
            ...annotationCoverage(
              recordedAppliesFromCount,
              totalProvisionCount,
            ),
            resolvedProvisionCount: resolvedAppliesFromCount,
            unresolvedProvisionCount: unresolvedAppliesFromCount,
          },
        },
        textCoverage: {
          storedTextProvisionCount: storedTextLengths.length,
          missingTextProvisionCount:
            totalProvisionCount - storedTextLengths.length,
          storedTextCoveragePercent: coveragePercent(
            storedTextLengths.length,
            totalProvisionCount,
          ),
          storedUnicodeCharacterCount,
          meanUnicodeCharactersPerStoredProvision: storedTextLengths.length
            ? round(storedUnicodeCharacterCount / storedTextLengths.length, 1)
            : null,
          medianUnicodeCharactersPerStoredProvision: median(storedTextLengths),
        },
      };
    })
    .sort((left, right) =>
      left.instrumentId.localeCompare(right.instrumentId),
    );

  const coverageClassOrder: ResearchCoverageClass[] = [
    "complete",
    "selected",
    "unclassified",
  ];
  const coverageClasses = coverageClassOrder.map((coverageClass) => {
    const cohort = instruments.filter(
      (instrument) => instrument.coverageClass === coverageClass,
    );
    const provisionCount = cohort.reduce(
      (sum, instrument) => sum + instrument.totalProvisionCount,
      0,
    );
    const corpusRecordCount = cohort.reduce(
      (sum, instrument) => sum + instrument.corpusRecordCount,
      0,
    );
    const conceptAssignmentCount = cohort.reduce(
      (sum, instrument) => sum + instrument.conceptAssignmentCount,
      0,
    );
    return {
      coverageClass,
      instrumentCount: cohort.length,
      corpusRecordCount,
      excludedNavigationExcerptCount: cohort.reduce(
        (sum, instrument) =>
          sum + instrument.excludedNavigationExcerptCount,
        0,
      ),
      provisionCount,
      substantiveProvisionCount: cohort.reduce(
        (sum, instrument) => sum + instrument.substantiveProvisionCount,
        0,
      ),
      structuralContextCount: cohort.reduce(
        (sum, instrument) => sum + instrument.structuralContextCount,
        0,
      ),
      unreviewedProvisionCount: cohort.reduce(
        (sum, instrument) => sum + instrument.unreviewedProvisionCount,
        0,
      ),
      conceptAssignmentCount,
      conceptAssignmentsPerProvision: provisionCount
        ? round(conceptAssignmentCount / provisionCount)
        : null,
      actorTagRecordedProvisionCount: cohort.reduce(
        (sum, instrument) =>
          sum +
          instrument.annotationCoverage.actorTags.recordedProvisionCount,
        0,
      ),
      scopeTagRecordedProvisionCount: cohort.reduce(
        (sum, instrument) =>
          sum +
          instrument.annotationCoverage.scopeTags.recordedProvisionCount,
        0,
      ),
      appliesFromRecordedProvisionCount: cohort.reduce(
        (sum, instrument) =>
          sum +
          instrument.annotationCoverage.appliesFrom.recordedProvisionCount,
        0,
      ),
      storedTextProvisionCount: cohort.reduce(
        (sum, instrument) =>
          sum + instrument.textCoverage.storedTextProvisionCount,
        0,
      ),
      missingTextProvisionCount: cohort.reduce(
        (sum, instrument) =>
          sum + instrument.textCoverage.missingTextProvisionCount,
        0,
      ),
    };
  });

  return { instruments, coverageClasses };
}

export function deriveArticleMicroscope(
  input: Pick<
    ResearchCorpusInput,
    "instruments" | "provisions" | "sourceAudits"
  >,
): ResearchArticleMicroscope {
  const { auditByInstrument, classByInstrument } = coverageMaps(
    input.sourceAudits,
  );
  const researchProvisions = deriveResearchProvisions(input.provisions);
  const instruments = input.instruments
    .map((instrument) => {
      const provisions = researchProvisions
        .filter((provision) => provision.instrumentId === instrument.id)
        .sort(
          (left, right) =>
            left.sourceOrder - right.sourceOrder ||
            left.locator.localeCompare(right.locator, undefined, {
              numeric: true,
            }) ||
            left.id.localeCompare(right.id),
        );
      const totalProvisionCount = provisions.length;
      const bands: ResearchArticleMicroscopeBand[] = provisions.map(
        (provision, index) => ({
          provisionId: provision.id,
          index,
          startRatio: totalProvisionCount
            ? round(index / totalProvisionCount)
            : 0,
          endRatio: totalProvisionCount
            ? round((index + 1) / totalProvisionCount)
            : 0,
          locator: provision.locator,
          title: provision.title,
          relevance: provision.relevance,
          analysisRole: provision.analysisRole,
          metricEligible: provision.metricEligible,
          canonicalProvisionId: provision.canonicalProvisionId,
          conceptIds: [...provision.conceptIds].sort(),
          conceptAssignmentCount: provision.conceptIds.length,
          structureId: provisionStructure(provision).id,
          hasActorTags: provision.actorTags.length > 0,
          hasScopeTags: provision.scopeTags.length > 0,
          appliesFromState: applicabilityDateState(provision.appliesFrom),
        }),
      );
      const positionsByConcept = new Map<string, number[]>();
      bands.filter((band) => band.metricEligible).forEach((band) => {
        band.conceptIds.forEach((conceptId) => {
          const list = positionsByConcept.get(conceptId) ?? [];
          list.push(band.index);
          positionsByConcept.set(conceptId, list);
        });
      });
      const conceptTracks = Array.from(
        positionsByConcept,
        ([conceptId, positions]) => ({
          conceptId,
          provisionCount: positions.length,
          firstIndex: Math.min(...positions),
          lastIndex: Math.max(...positions),
          meanPosition: round(
            positions.reduce((sum, position) => sum + position, 0) /
              positions.length /
              Math.max(totalProvisionCount - 1, 1),
          ),
        }),
      ).sort(
        (left, right) =>
          right.provisionCount - left.provisionCount ||
          left.conceptId.localeCompare(right.conceptId),
      );
      const coverageClass =
        classByInstrument.get(instrument.id) ?? "unclassified";
      return {
        instrumentId: instrument.id,
        coverageMode:
          auditByInstrument.get(instrument.id)?.localCoverage.mode ??
          "unclassified",
        coverageClass,
        includedInDefaultAnalysis: coverageClass === "complete",
        metricEligibleProvisionCount: bands.filter(
          (band) => band.metricEligible,
        ).length,
        navigationExcerptCount: bands.filter(
          (band) => !band.metricEligible,
        ).length,
        totalProvisionCount,
        maximumConceptAssignmentCount: Math.max(
          0,
          ...bands
            .filter((band) => band.metricEligible)
            .map((band) => band.conceptAssignmentCount),
        ),
        bands,
        conceptTracks,
      };
    })
    .sort((left, right) =>
      left.instrumentId.localeCompare(right.instrumentId),
    );
  return { instruments };
}

export function buildResearchLabData(
  input: ResearchCorpusInput,
  options?: ResearchAnalysisOptions,
): ResearchLabData {
  const snapshotDate = input.snapshotDate ?? RESEARCH_SNAPSHOT_DATE;
  const normalizedInput = { ...input, snapshotDate };
  const fingerprints = deriveConceptFingerprints(normalizedInput, options);
  const conceptData = deriveResearchConcepts(normalizedInput, options);
  const researchRelations = deriveResearchRelations(normalizedInput);
  return {
    snapshotDate,
    methodology: {
      defaultCoverageClasses: [
        ...(options?.coverageClasses ?? DEFAULT_COVERAGE_CLASSES),
      ],
      defaultRelevance: [...(options?.relevance ?? DEFAULT_RELEVANCE)],
      analysisUnit: "provision",
      fingerprintDefinition:
        "Per-instrument TF is a concept's provision assignments divided by all concept assignments in the included relevance class; prevalence separately divides by included metric-eligible provisions. Navigation and analytical excerpts whose complete parent unit is already stored remain linked but are excluded. TF-IDF vectors are L2-normalized.",
      idfDefinition:
        "IDF = ln((1 + N) / (1 + document frequency)) + 1, where N is the number of instruments in the selected coverage sample.",
      cooccurrenceDefinition:
        "Concept pairs are counted once per included metric-eligible provision. Lift, base-2 PMI, normalized PMI, and Jaccard use complete-corpus substantive provisions by default; provision, distinct-instrument, and distinct-jurisdiction support are retained separately. Navigation excerpts are excluded to avoid counting both a complete parent and its editorial child anchor.",
      translationIntegrityDefinition:
        "English storage, authority class, and temporal alignment are reported as separate dimensions. Coverage is not a translation-accuracy or semantic-drift score.",
      bridgeDefinition:
        "Bridge metrics use the unweighted, undirected projection of qualified analytical relations between instruments. Editorial-reviewed edges and the reviewed-plus-candidate graph are calculated separately; centrality describes only this project's reviewed subgraph or recorded-relation graph, not global legal influence.",
      operationalPathDefinition:
        "Operational paths preserve only recorded directed relation semantics and are limited to three hops. Arrow direction is not converted into chronology, causation, diffusion, or legal hierarchy.",
      archetypeDefinition:
        "Exploratory archetypes use deterministic average-linkage hierarchical clustering over the 23-dimensional L2-normalized TF-IDF concept profiles in the complete-corpus substantive sample. Cosine distance is the only fit feature; jurisdiction, legal force, lifecycle status and relation edges are excluded and shown only as descriptive context.",
      relationAuditDefinition:
        "Mapping evidence is audited across separate dimensions: editorial review state, relation class and direction, source support, rationale and limits, verification date, endpoint coverage, legal force, lifecycle status and jurisdiction span. These dimensions are never collapsed into a quality or equivalence score.",
      applicabilityHorizonDefinition:
        "The applicability horizon groups only explicit, valid provision appliesFrom dates by instrument and date, and keeps recorded instrument-level status events in a separate stream. Dates are classified against the fixed corpus snapshot; missing and non-ISO or impossible dates remain visible rather than being inferred from instrument metadata.",
      neighborhoodStabilityDefinition:
        "Regulatory neighborhoods compare cosine distance over L2-normalized TF-IDF profiles with Hellinger distance over concept-prevalence distributions normalized to probability. Leave-one-theme-out rank ranges and nearest-neighbor stability counts are reported for every recorded theme; no distance is a legal-equivalence or compliance score.",
      granularityAuditDefinition:
        "Granularity and annotation coverage are reported separately for complete, selected and unclassified corpora. Primary measures use metric-eligible provision relevance, concept assignments and recorded annotation fields; excluded navigation excerpts and total corpus-record counts are disclosed separately. Text length is secondary: it counts NFC-normalized, whitespace-collapsed Unicode code points only where stored fullText exists, with missing text retained explicitly; cross-language lengths are not treated as directly comparable drafting strength.",
      articleMicroscopeDefinition:
        "Article microscope bands preserve source order and encode recorded relevance, concept assignments, structure, metric eligibility and annotation presence at provision level. Navigation excerpts remain drillable, while aggregate concept tracks exclude them so a complete parent and its editorial child anchor are not counted twice; the view does not infer absent rules from unassigned concepts.",
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
    translationIntegrity: deriveTranslationIntegrity(normalizedInput),
    relations: researchRelations,
    bridgeAtlas: deriveQualifiedBridgeAtlas(normalizedInput),
    operationalizationPaths: deriveOperationalizationPaths(normalizedInput),
    instrumentArchetypes: deriveInstrumentArchetypes(
      fingerprints,
      normalizedInput.instruments,
      normalizedInput.concepts,
    ),
    mappingEvidenceAudit: deriveMappingEvidenceAudit(normalizedInput),
    applicabilityHorizon: deriveApplicabilityHorizon(normalizedInput),
    neighborhoodStability: deriveRegulatoryNeighborhoodStability(
      fingerprints,
      normalizedInput.concepts,
      normalizedInput.themes,
    ),
    granularityAudit: deriveProvisionGranularityAudit(normalizedInput),
    articleMicroscope: deriveArticleMicroscope(normalizedInput),
  };
}

/**
 * Build a self-describing snapshot of the records behind the active Research Lab
 * view. Presentation-only controls that live inside an individual view are not
 * inferred here; the export preserves the shared corpus and relevance scopes and
 * names the analytical complete-corpus subset explicitly.
 */
export function buildResearchLabExportPayload(
  data: ResearchLabData,
  options: ResearchLabExportOptions,
): ResearchLabExportPayload {
  const displayedInstruments = data.instruments.filter(
    (instrument) =>
      options.coverageScope === "all" || instrument.coverageClass === "complete",
  );
  const displayedInstrumentIds = displayedInstruments.map(
    (instrument) => instrument.id,
  );
  const displayedInstrumentIdSet = new Set(displayedInstrumentIds);
  const analyticalInstrumentIds = displayedInstruments
    .filter(
      (instrument) =>
        instrument.conceptMeasurementState === "observed-complete",
    )
    .map((instrument) => instrument.id);
  const analyticalInstrumentIdSet = new Set(analyticalInstrumentIds);
  const visibleProvisions = data.provisions.filter(
    (provision) =>
      provision.metricEligible !== false &&
      displayedInstrumentIdSet.has(provision.instrumentId) &&
      (options.relevanceScope === "all" ||
        provision.relevance === "substantive-topic"),
  );

  const uniqueSorted = (ids: Iterable<string>) =>
    Array.from(new Set(ids)).sort((left, right) => left.localeCompare(right));
  const makeScope = (
    basis: ResearchLabExportViewScope["basis"],
    instrumentIds: Iterable<string>,
    analyticalIds: Iterable<string>,
    note: string,
    scopeOptions?: {
      provisionIds?: Iterable<string> | null;
      relationIds?: Iterable<string> | null;
      coverageScopeApplied?: boolean;
      relevanceScopeApplied?: boolean;
    },
  ): ResearchLabExportViewScope => ({
    basis,
    instrumentIds: uniqueSorted(instrumentIds),
    analyticalInstrumentIds: uniqueSorted(analyticalIds),
    provisionIds:
      scopeOptions?.provisionIds === undefined ||
      scopeOptions.provisionIds === null
        ? null
        : uniqueSorted(scopeOptions.provisionIds),
    relationIds:
      scopeOptions?.relationIds === undefined ||
      scopeOptions.relationIds === null
        ? null
        : uniqueSorted(scopeOptions.relationIds),
    coverageScopeApplied: scopeOptions?.coverageScopeApplied ?? false,
    relevanceScopeApplied: scopeOptions?.relevanceScopeApplied ?? false,
    note,
  });

  const viewData = (() => {
    switch (options.view) {
      case "observatory":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.coverage.instruments.map((instrument) => instrument.instrumentId),
            analyticalInstrumentIds,
            "The observatory is a whole-corpus inventory. Shared coverage and relevance controls do not filter this view.",
          ),
          data: data.coverage,
        };
      case "genome": {
        const counts = new Map<string, Map<string, number>>();
        const assignmentTotals = new Map<string, number>();
        const provisionTotals = new Map<string, number>();
        for (const provision of visibleProvisions) {
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
        const documentFrequency = new Map(
          data.concepts.map((concept) => [
            concept.id,
            analyticalInstrumentIds.filter(
              (instrumentId) =>
                (counts.get(instrumentId)?.get(concept.id) ?? 0) > 0,
            ).length,
          ]),
        );
        const fingerprints = data.fingerprints
          .filter((fingerprint) =>
            displayedInstrumentIdSet.has(fingerprint.instrumentId),
          )
          .map((fingerprint) => {
            const rawWeights = data.concepts.map((concept) => {
              const rawCount =
                counts.get(fingerprint.instrumentId)?.get(concept.id) ?? 0;
              const documentCount = documentFrequency.get(concept.id) ?? 0;
              const idf =
                Math.log(
                  (analyticalInstrumentIds.length + 1) / (documentCount + 1),
                ) + 1;
              const prevalence =
                rawCount /
                Math.max(1, provisionTotals.get(fingerprint.instrumentId) ?? 0);
              const termFrequency =
                rawCount /
                Math.max(1, assignmentTotals.get(fingerprint.instrumentId) ?? 0);
              return {
                conceptId: concept.id,
                rawCount,
                documentFrequency: documentCount,
                idf,
                prevalence,
                termFrequency,
                tfidf: termFrequency * idf,
              };
            });
            const magnitude = Math.sqrt(
              rawWeights.reduce(
                (sum, weight) => sum + weight.tfidf * weight.tfidf,
                0,
              ),
            );
            return {
              ...fingerprint,
              denominatorProvisionCount:
                provisionTotals.get(fingerprint.instrumentId) ?? 0,
              conceptAssignmentCount:
                assignmentTotals.get(fingerprint.instrumentId) ?? 0,
              mappedConceptCount: rawWeights.filter(
                (weight) => weight.rawCount > 0,
              ).length,
              weights: rawWeights.map((weight) =>
                fingerprint.measurementState === "observed-complete"
                  ? {
                      ...weight,
                      idf: round(weight.idf),
                      prevalence: round(weight.prevalence),
                      termFrequency: round(weight.termFrequency),
                      tfidf: round(weight.tfidf),
                      normalizedTfidf: magnitude
                        ? round(weight.tfidf / magnitude)
                        : 0,
                      rawCountState: "observed-complete-exact" as const,
                    }
                  : {
                      conceptId: weight.conceptId,
                      rawCount: weight.rawCount > 0 ? weight.rawCount : null,
                      rawCountState:
                        weight.rawCount > 0
                          ? ("observed-partial-lower-bound" as const)
                          : ("unknown-unobserved" as const),
                      documentFrequency: null,
                      idf: null,
                      prevalence: null,
                      termFrequency: null,
                      tfidf: null,
                      normalizedTfidf: null,
                    },
              ),
            };
          });
        return {
          scope: makeScope(
            "shared-display-selection",
            displayedInstrumentIds,
            analyticalInstrumentIds,
            "Coverage and relevance controls filter this matrix. Complete-corpus cells are exact; positive raw counts from partial corpora are lower bounds, while their unrecorded cells and all normalized values remain unknown.",
            {
              provisionIds: visibleProvisions.map((provision) => provision.id),
              coverageScopeApplied: true,
              relevanceScopeApplied: true,
            },
          ),
          data: {
            instruments: displayedInstruments,
            concepts: data.concepts,
            themes: data.themes,
            fingerprints,
          },
        };
      }
      case "morphology":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.structuralProfiles.map((profile) => profile.instrumentId),
            analyticalInstrumentIds,
            "The export contains the full backing profile collection because the view's local instrument picker is intentionally not serialized.",
          ),
          data: data.structuralProfiles,
        };
      case "grammar":
        return (() => {
          const analyticalSourceProvisions = visibleProvisions.filter(
            (provision) =>
              analyticalInstrumentIdSet.has(provision.instrumentId),
          );
          return {
            scope: makeScope(
              "shared-analytical-selection",
              analyticalInstrumentIds,
              analyticalInstrumentIds,
              "Only complete corpora enter the grammar estimand; the shared relevance control filters its source provisions.",
              {
                provisionIds: analyticalSourceProvisions.map(
                  (provision) => provision.id,
                ),
                coverageScopeApplied: true,
                relevanceScopeApplied: true,
              },
            ),
            data: {
              concepts: data.concepts,
              analyticalSourceProvisions,
              defaultDerivedPairs:
                options.relevanceScope === "substantive"
                  ? data.cooccurrence
                  : null,
            },
          };
        })();
      case "timeline":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.lifecycleLanes.map((lane) => lane.instrumentId),
            [],
            "The timeline exports every instrument with a recorded lifecycle event; shared corpus controls do not filter this view.",
          ),
          data: data.lifecycleLanes,
        };
      case "translation":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.translationIntegrity.corpora.map(
              (corpus) => corpus.instrumentId,
            ),
            [],
            "Translation coverage is an authority and storage inventory for every audited foreign-language corpus; shared corpus controls do not filter this view.",
          ),
          data: data.translationIntegrity,
        };
      case "bridges":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.bridgeAtlas.nodes.map((node) => node.instrumentId),
            [],
            "Bridge metrics retain the complete recorded-relation graph on which centrality was calculated; slicing by a shared corpus control would invalidate those metrics.",
            { relationIds: data.relations.map((relation) => relation.id) },
          ),
          data: { atlas: data.bridgeAtlas, relations: data.relations },
        };
      case "pathways": {
        const pathwayInstrumentIds = data.operationalizationPaths.edges.flatMap(
          (edge) => [edge.sourceInstrumentId, edge.targetInstrumentId],
        );
        return {
          scope: makeScope(
            "all-recorded-instruments",
            pathwayInstrumentIds,
            [],
            "The pathway export contains every recorded directed analytical relation and its retained paths; shared corpus controls do not filter this view.",
            {
              relationIds: data.operationalizationPaths.edges.map(
                (edge) => edge.relationId,
              ),
            },
          ),
          data: data.operationalizationPaths,
        };
      }
      case "archetypes":
        return {
          scope: makeScope(
            "derived-complete-corpus-fit",
            [
              ...data.instrumentArchetypes.fitInstrumentIds,
              ...data.instrumentArchetypes.excludedInstrumentIds,
            ],
            data.instrumentArchetypes.fitInstrumentIds,
            "Fit records are the complete-corpus analytical sample. Excluded instrument IDs are included only to disclose the derivation boundary.",
          ),
          data: data.instrumentArchetypes,
        };
      case "audit": {
        const auditInstrumentIds = data.mappingEvidenceAudit.records.flatMap(
          (record) =>
            [record.sourceInstrumentId, record.targetInstrumentId].filter(
              (instrumentId): instrumentId is string => instrumentId !== null,
            ),
        );
        return {
          scope: makeScope(
            "all-recorded-instruments",
            auditInstrumentIds,
            [],
            "The evidence audit exports every recorded relation so its completeness counts remain internally consistent.",
            {
              relationIds: data.mappingEvidenceAudit.records.map(
                (record) => record.relationId,
              ),
            },
          ),
          data: data.mappingEvidenceAudit,
        };
      }
      case "horizon": {
        const horizonProvisionIds = [
          ...data.applicabilityHorizon.provisionDateGroups.flatMap(
            (group) => group.provisionIds,
          ),
          ...data.applicabilityHorizon.missingProvisionIds,
          ...data.applicabilityHorizon.unresolvedProvisionDates.map(
            (record) => record.provisionId,
          ),
        ];
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.applicabilityHorizon.instruments.map(
              (instrument) => instrument.instrumentId,
            ),
            [],
            "The horizon exports every provision-date annotation and status event used by its global counts; shared corpus controls do not filter this view.",
            { provisionIds: horizonProvisionIds },
          ),
          data: data.applicabilityHorizon,
        };
      }
      case "microscope":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.articleMicroscope.instruments.map(
              (profile) => profile.instrumentId,
            ),
            analyticalInstrumentIds,
            "The export contains every article profile because the view's local instrument selection is intentionally not serialized.",
            {
              provisionIds: data.articleMicroscope.instruments.flatMap(
                (profile) => profile.bands.map((band) => band.provisionId),
              ),
            },
          ),
          data: data.articleMicroscope,
        };
      case "neighborhoods":
        return {
          scope: makeScope(
            "derived-complete-corpus-fit",
            [
              ...data.neighborhoodStability.fitInstrumentIds,
              ...data.neighborhoodStability.excludedInstrumentIds,
            ],
            data.neighborhoodStability.fitInstrumentIds,
            "Distances are fitted only on the recorded complete-corpus sample. Excluded instrument IDs disclose the derivation boundary and are not distance observations.",
          ),
          data: data.neighborhoodStability,
        };
      case "granularity":
        return {
          scope: makeScope(
            "all-recorded-instruments",
            data.granularityAudit.instruments.map(
              (instrument) => instrument.instrumentId,
            ),
            analyticalInstrumentIds,
            "Coverage-class summaries and instrument records both span the complete granularity audit; shared corpus controls do not filter this view.",
          ),
          data: data.granularityAudit,
        };
    }
  })();

  return {
    schemaVersion: "research-lab-view-export.v2",
    snapshotDate: data.snapshotDate,
    selection: { ...options },
    exportLimitations: RESEARCH_LAB_EXPORT_LIMITATIONS,
    methodology: data.methodology,
    sample: {
      displayedInstrumentIds,
      analyticalInstrumentIds,
      visibleProvisionIds: visibleProvisions.map((provision) => provision.id),
      displayedInstrumentCount: displayedInstrumentIds.length,
      analyticalInstrumentCount: analyticalInstrumentIds.length,
      visibleProvisionCount: visibleProvisions.length,
      partialCorpusMeaning:
        "Selected, partial and unclassified corpora preserve positive recorded concept counts as lower bounds. Unrecorded cells remain unknown, not zero, and prevalence or TF-IDF is never calculated from a partial denominator.",
      viewScope: viewData.scope,
    },
    viewData,
  };
}
