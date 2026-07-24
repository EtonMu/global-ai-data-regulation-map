"use client";

import {
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import dynamic from "next/dynamic";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Columns2,
  Database,
  ExternalLink,
  FileClock,
  FileText,
  FlaskConical,
  GitFork,
  Globe2,
  Info,
  Landmark,
  Languages,
  Link2,
  Map as MapIcon,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Scale,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import jurisdictionsJson from "@/data/v2/jurisdictions.json";
import instrumentsJson from "@/data/v2/instruments.json";
import clientCorpusIndexJson from "@/data/v2/client-corpus-index.json";
import conceptsJson from "@/data/v2/concepts.json";
import conceptThemesJson from "@/data/v2/concept-themes.json";
import relationsJson from "@/data/v2/relations.json";
import statusEventsJson from "@/data/v2/status-events.json";
import sourceAuditsJson from "@/data/v2/source-audit.json";
import englishCorpusCoverageJson from "@/data/v2/english-corpus-coverage.json";
import provisionConceptReviewsJson from "@/data/v2/provision-concepts.json";
import structureSummariesJson from "@/data/v2/structure-summaries.json";
import { ConceptIcon, ConceptThemeIcon } from "./concept-icon";
import { ConceptConstellation } from "./concept-constellation";
import { JurisdictionMark } from "./jurisdiction-mark";
import { RegulationGlobe } from "./regulation-globe";
import { SearchCombobox } from "./search-combobox";
import {
  createSearchIndex,
  searchIndex,
  type SearchDocument,
  type SearchResult,
} from "./search-engine";
import { loadCorpusShard } from "./corpus-loader";
import type { CorpusShardPayload } from "./corpus-loader";
import type { LazyResearchViewProps } from "./lazy-research-view";
import type { ResearchCorpusInput } from "./research-lab-data";
import type {
  ResearchCoverageScope,
  ResearchLabView,
  ResearchRelevanceScope,
} from "./research-lab";

type Source = {
  url: string;
  label: string;
  accessedOn?: string;
};

type TextAvailability = {
  mode: string;
  stored: boolean;
  language: string;
  note?: string;
};

type EnglishAvailabilityRecord = {
  coverageStatus: string;
  status: string;
  versionAsOf?: string;
  versionLabel?: string;
  authorityNote?: string;
  sourcesChecked?: string[];
  note?: string;
};

type Jurisdiction = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  parentId?: string | null;
  isoCode?: string | null;
  description: string;
};

type Instrument = {
  id: string;
  shortTitle: string;
  title: string;
  originalTitle?: string;
  jurisdictionId: string;
  issuingBodies: string[];
  category: string;
  hierarchyLevel: string;
  legalForce: string;
  lifecycleStatus: string;
  statusAsOf: string;
  dates: {
    adoptedOn?: string | null;
    publishedOn?: string | null;
    effectiveFrom?: string | null;
    generalApplicationFrom?: string | null;
    lastAmendedOn?: string | null;
    latestAmendmentEffectiveFrom?: string | null;
    ceasedOn?: string | null;
  };
  version: string;
  parentInstrumentId?: string | null;
  topicIds: string[];
  summary: string;
  statusNote: string;
  source: Source;
  amendmentSource?: Source;
  originalLanguageSource?: Source;
  referenceTranslationSource?: Source;
  supportingSource?: Source;
  coverage?: {
    unit: string;
    first: number;
    last: number;
    count: number;
    completeness: string;
  };
  textAvailability: TextAvailability;
};

type Editorial = {
  reviewStatus: string;
  reviewedOn: string;
  note?: string;
};

type LegalLanguageText = {
  language: string;
  title?: string;
  paragraphs: string[];
  fullText: string;
  status: "official" | "reference";
  note?: string;
  source?: Source;
};

type SeedProvision = {
  id: string;
  instrumentId: string;
  locator: string;
  title: string;
  originalTitle?: string;
  provisionType: string;
  parentId?: string | null;
  summary: string;
  conceptIds: string[];
  actorTags: string[];
  scopeTags: string[];
  legalEffectStatus: string;
  versionAsOf?: string;
  appliesFrom?: string | null;
  textAvailability: TextAvailability;
  source: Source;
  supportingSources?: Source[];
  editorial: Editorial;
  paragraphs?: string[];
  fullText?: string;
  chapter?: {
    id: string | null;
    label: string;
    title: string;
  };
  section?: {
    id: string;
    label: string;
    title: string;
  } | null;
  articleNumber?: string;
  translations?: {
    en?: {
      title?: string;
      paragraphs: string[];
      fullText: string;
      status: "official" | "reference";
      note?: string;
      source?: Source;
      coverageStatus?: string;
      versionAsOf?: string;
      versionLabel?: string;
      currentTextEquivalent?: boolean;
      alignmentStatus?: string;
    };
  };
  englishAvailability?: EnglishAvailabilityRecord | null;
  alternativeLanguageTexts?: LegalLanguageText[];
  defaultLanguageStatus?: string;
  languageAuthorityNote?: string;
};

type ImportedTranslationRecord = {
  title?: string;
  label?: string;
  paragraphs: string[];
  fullText: string;
  language?: string;
  status:
    | "official"
    | "reference"
    | "official-reference-translation"
    | "official-reference-translation-no-legal-effect"
    | "government-reference-translation-no-legal-effect"
    | "government-reference-translation-historical-no-legal-effect"
    | "government-published-reference"
    | "public-domain-government-reference"
    | "project-authored-reference-translation-no-legal-effect"
    | "official-co-published"
    | "official-co-authentic-equal-status"
    | "official-authoritative-equal-status";
  note?: string;
  authorityNote?: string;
  source?: Source | string;
  sourceLabel?: string;
  coverageStatus?: string;
  versionAsOf?: string;
  versionLabel?: string;
  currentTextEquivalent?: boolean;
  alignmentStatus?: string;
  sourceVersion?:
    | string
    | ({
        versionLabel?: string;
        asOf?: string;
        consolidatedAsOf?: string;
        effectiveRevisionDate?: string;
        lastVersion?: string;
        translatedOn?: string;
        publishedOnDatabase?: string;
      } & Record<string, unknown>);
  sourceRecord?: {
    sourceExpression?: string;
    sourceSubdivision?: string;
  };
};

type ArticleRecord = {
  id: string;
  instrumentId: string;
  unitType?: string;
  provisionType?: string;
  parentId?: string | null;
  articleNumber: string;
  label: string;
  originalTitle?: string;
  title: string;
  summary?: string;
  coreConceptIds?: string[];
  thematicRelevance?: {
    isRelevant: boolean;
    highlightEntireUnit?: boolean;
    themes?: string[];
  };
  chapter: {
    id: string | null;
    label: string;
    title: string;
    originalTitle?: string;
  } | null;
  section?: {
    id: string;
    label: string;
    title: string;
  } | null;
  paragraphs: string[];
  fullText: string;
  language: string;
  textAvailability: string;
  source: string;
  sourceFragment?: string;
  sourceSubdivision?: string;
  canonicalSource?: string;
  retrievedOn: string;
  versionAsOf?: string | null;
  sourceLabel?: string;
  defaultLanguageStatus?: string;
  authenticity?: {
    authorityNote?: string;
    englishStatus?: string;
  };
  appliesFrom?: string | null;
  effectiveFrom?: string | null;
  legalEffectStatus?: string;
  applicability?: {
    displayedVersion: string;
    appliesFrom?: string | null;
    promulgatedOn?: string;
    commencementCondition?: string;
    currentLawStatus: string;
    historyNote?: string;
  };
  currentEffectiveVersion?: {
    paragraphs: string[];
    fullText: string;
    language: string;
    appliesFrom: string;
    source: string;
    sourceLabel: string;
    sourceVersionAmendedOn: string;
    englishTranslationAvailability: string;
    contentSha256: string;
  } | null;
  currentOperativeText?: string;
  currentOperativeSha256?: string;
  hasEnactedFutureAmendment?: boolean;
  futureAmendments?: Array<{
    amendingItem?: string;
    appliesFrom?: string;
    note?: string;
    includedInStoredText?: boolean;
  }>;
  translations?: Record<string, ImportedTranslationRecord> & {
    en?: ImportedTranslationRecord;
  };
  englishAvailability?: EnglishAvailabilityRecord | null;
  sourceVersion?: {
    officialTitle: string;
    englishTitle?: string;
    instrumentNumber?: string;
    promulgationNumber?: string;
    adoptedOn?: string;
    publishedOn?: string;
    promulgatedOn?: string;
    effectiveFrom?: string;
    latestAmendedOn?: string;
    currentEffectiveBaselineAmendedOn?: string;
    versionNote: string;
  };
  contentSha256?: string;
  rights?: {
    reuseStatus: string;
    license: string;
    licenseUrl: string;
    attribution: string;
  };
};

type ImportedArticleRecord = Omit<
  ArticleRecord,
  "articleNumber" | "chapter"
> & {
  articleNumber?: string;
  sectionNumber?: string;
  ruleNumber?: string;
  unitType?: string;
  chapter?: ArticleRecord["chapter"] | string;
  chapterTitle?: string;
  currentOperativeText?: string;
  currentOperativeSha256?: string;
};

type ClientCorpusIndex = {
  schemaVersion: string;
  totals: {
    instrumentCount: number;
    importedArticleCount: number;
    seedProvisionCount: number;
    mergedProvisionCount: number;
  };
  shards: Record<string, string>;
  articleRecords: ImportedArticleRecord[];
  seedProvisions: SeedProvision[];
};

type Provision = SeedProvision & {
  paragraphs?: string[];
  fullText?: string;
  chapter?: ArticleRecord["chapter"];
  section?: ArticleRecord["section"];
  articleNumber?: string;
  applicability?: ArticleRecord["applicability"];
  currentEffectiveVersion?: ArticleRecord["currentEffectiveVersion"];
  sourceOrder?: number;
  topicRelevance: ProvisionConceptReview;
};

type ProvisionConceptReview = {
  provisionId: string;
  relevance: "substantive-topic" | "structural-context";
  conceptIds: string[];
  rationale: string;
  reviewStatus: "editorial-reviewed";
  reviewedOn: string;
};

type StructureSummary = {
  id: string;
  instrumentId: string;
  structureId: string;
  level: string;
  label: string;
  title: string;
  summary: string;
  conceptIds: string[];
  sourceBasis: Array<Source & { provisionIds: string[] }>;
  editorial: Editorial;
};

type Concept = {
  id: string;
  label: string;
  family: string;
  theme: string;
  description: string;
  summary: string;
  aliases: string[];
  sourceBasis: Source[];
  editorial: Editorial;
};

type ConceptTheme = {
  id: string;
  label: string;
  summary: string;
  order: number;
};

type RelationEndpoint = {
  type: string;
  id: string;
};

type Relation = {
  id: string;
  source: RelationEndpoint;
  target: RelationEndpoint;
  type: string;
  relationClass?: "analytical" | "lifecycle";
  directionality: string;
  conceptIds: string[];
  status: string;
  confidence: string;
  evidenceBasis: string;
  rationale: string;
  limits: string;
  verifiedOn: string;
  sourceSupport: Source[];
};

type StatusEvent = {
  id: string;
  instrumentId: string;
  date: string;
  type: string;
  label: string;
  effect: string;
  resultingStatus: string;
  source: Source;
};

type SourceAudit = {
  id: string;
  instrumentId: string;
  reviewedOn: string;
  reviewLevel: string;
  lifecycleFinding: string;
  versionFinding: string;
  englishAvailability: {
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
  localCoverage: {
    mode: string;
    localUnitCount: number;
    statement: string;
  };
  rightsBoundary?: {
    sourceTextStatus: string;
    projectLicenseBoundary: string;
    note: string;
  };
  caveats?: string[];
};

type View =
  | "atlas"
  | "research"
  | "instrument"
  | "connections"
  | "timeline"
  | "compare";
type ReaderTab = "text" | "analysis" | "sources";
type Theme = "dark" | "bright";
type NavigatorTab = "sources" | "concepts";
type TransitionKind = "theme" | "view";
type ViewDirection = "forward" | "backward";

type SameDocumentViewTransition = {
  finished: Promise<void>;
  skipTransition: () => void;
};

type TransitionDocument = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>,
  ) => SameDocumentViewTransition;
};

const themeChangeEvent = "gadrm-theme-change";
const columnLayoutStorageKey = "gadrm-column-layout";
const mobileNavigatorMediaQuery = "(max-width: 760px)";
const defaultColumnLayout = {
  leftWidth: 268,
  rightWidth: 390,
  leftCollapsed: false,
  rightCollapsed: false,
};
const columnBounds = {
  left: { min: 190, max: 420 },
  right: { min: 300, max: 620 },
  centerMin: 420,
};
const columnCollapsedRail = 38;

type ColumnSide = "left" | "right";
type ColumnLayout = typeof defaultColumnLayout;
type ColumnResize = {
  side: ColumnSide;
  pointerId: number;
  startX: number;
  startWidth: number;
} | null;

function clampColumnWidth(side: ColumnSide, width: number) {
  const bounds = columnBounds[side];
  return Math.max(bounds.min, Math.min(bounds.max, Math.round(width)));
}

function normalizeColumnLayout(
  layout: ColumnLayout,
  shellWidth: number,
  hasRightColumn: boolean,
): ColumnLayout {
  let leftWidth = clampColumnWidth("left", layout.leftWidth);
  let rightWidth = clampColumnWidth("right", layout.rightWidth);
  if (shellWidth <= 1080) {
    return { ...layout, leftWidth, rightWidth };
  }
  const reservedRailWidth =
    (layout.leftCollapsed ? columnCollapsedRail : 0) +
    (hasRightColumn && layout.rightCollapsed ? columnCollapsedRail : 0);
  const usableWidth = Math.max(
    0,
    shellWidth - columnBounds.centerMin - reservedRailWidth,
  );

  if (!layout.leftCollapsed && hasRightColumn && !layout.rightCollapsed) {
    rightWidth = Math.max(
      columnBounds.right.min,
      Math.min(rightWidth, usableWidth - columnBounds.left.min),
    );
    leftWidth = Math.max(
      columnBounds.left.min,
      Math.min(leftWidth, usableWidth - rightWidth),
    );
  } else if (!layout.leftCollapsed) {
    leftWidth = Math.max(
      columnBounds.left.min,
      Math.min(leftWidth, usableWidth),
    );
  } else if (hasRightColumn && !layout.rightCollapsed) {
    rightWidth = Math.max(
      columnBounds.right.min,
      Math.min(rightWidth, usableWidth),
    );
  }

  return { ...layout, leftWidth, rightWidth };
}

function themeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "bright" ? "bright" : "dark";
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(themeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

type ExplorerState = {
  view: View;
  navigatorTab: NavigatorTab;
  selectedInstrumentId: string | null;
  selectedProvisionId: string | null;
  selectedRelationId: string | null;
  selectedConceptId: string | null;
  readerTab: ReaderTab;
  compareIds: string[];
  query: string;
};

type ExplorerAction =
  | { type: "OPEN_ATLAS" }
  | { type: "OPEN_INSTRUMENT"; instrumentId: string }
  | {
      type: "OPEN_PROVISION";
      provisionId: string;
      instrumentId: string;
      relationId?: string;
    }
  | { type: "OPEN_VIEW"; view: View }
  | { type: "SET_NAVIGATOR_TAB"; tab: NavigatorTab }
  | { type: "OPEN_CONCEPT"; conceptId: string }
  | { type: "SELECT_RELATION"; relationId: string }
  | { type: "SET_READER_TAB"; tab: ReaderTab }
  | { type: "SET_QUERY"; query: string }
  | { type: "ADD_COMPARE"; provisionId: string }
  | { type: "REMOVE_COMPARE"; provisionId: string }
  | { type: "CLEAR_COMPARE" }
  | { type: "RESTORE_STATE"; state: ExplorerState };

const repositoryUrl =
  "https://github.com/EtonMu/global-ai-data-regulation-map";

const clientCorpusIndex =
  clientCorpusIndexJson as unknown as ClientCorpusIndex;
const jurisdictions = jurisdictionsJson as Jurisdiction[];
const instruments = instrumentsJson as Instrument[];
const seedProvisions = clientCorpusIndex.seedProvisions;
const concepts = conceptsJson as Concept[];
const conceptThemes = [...(conceptThemesJson as ConceptTheme[])].sort(
  (left, right) => left.order - right.order,
);
const relations = relationsJson as Relation[];
const statusEvents = statusEventsJson as StatusEvent[];
const sourceAudits = sourceAuditsJson as SourceAudit[];
const structureSummaries = structureSummariesJson as StructureSummary[];

function normalizeImportedArticle(
  imported: ImportedArticleRecord,
): ArticleRecord {
  const instrumentId =
    imported.instrumentId === "vn-decree-356-2025"
      ? "vn-pdpl-implementing-decree-356-2025"
      : imported.instrumentId === "vn-decree-13-2023"
        ? "vn-personal-data-protection-decree-13-2023"
        : imported.instrumentId;
  const articleNumber =
    imported.articleNumber ??
    imported.sectionNumber ??
    imported.ruleNumber ??
    imported.label;
  const chapter =
    typeof imported.chapter === "string"
      ? {
          id: `${instrumentId}-${imported.chapter
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}`,
          label: imported.chapter,
          title: imported.chapterTitle ?? imported.chapter,
        }
      : imported.chapter ?? null;
  const sourceLocator =
    imported.sourceFragment ??
    imported.sourceSubdivision ??
    imported.canonicalSource ??
    imported.source;
  const sourceFragment = sourceLocator.startsWith("#")
    ? `${imported.source}${sourceLocator}`
    : sourceLocator;
  const fullText = imported.currentOperativeText ?? imported.fullText;
  const paragraphs = imported.currentOperativeText
    ? imported.currentOperativeText.split(/\n\n+/)
    : imported.paragraphs;

  return {
    ...imported,
    instrumentId,
    articleNumber,
    chapter,
    sourceFragment,
    paragraphs,
    fullText,
  } as ArticleRecord;
}

const articleRecords = clientCorpusIndex.articleRecords;
const normalizedArticleRecords = articleRecords.map(normalizeImportedArticle);
const provisionConceptReviews =
  provisionConceptReviewsJson as ProvisionConceptReview[];

const jurisdictionById = new Map(
  jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
);
const instrumentById = new Map(
  instruments.map((instrument) => [instrument.id, instrument]),
);
const conceptById = new Map(
  concepts.map((concept) => [concept.id, concept]),
);
const conceptThemeById = new Map(
  conceptThemes.map((theme) => [theme.id, theme]),
);
const seedProvisionById = new Map(
  seedProvisions.map((provision) => [provision.id, provision]),
);
const structureSummaryByKey = new Map(
  structureSummaries.map((summary) => [
    summary.instrumentId + "::" + summary.structureId,
    summary,
  ]),
);
const sourceAuditByInstrument = new Map(
  sourceAudits.map((audit) => [audit.instrumentId, audit]),
);
const conceptReviewByProvisionId = new Map(
  provisionConceptReviews.map((review) => [review.provisionId, review]),
);

function provisionWithConceptReview<T extends SeedProvision>(
  provision: T,
): T & { topicRelevance: ProvisionConceptReview } {
  const storedReview = conceptReviewByProvisionId.get(provision.id);
  const topicRelevance: ProvisionConceptReview = storedReview ?? {
    provisionId: provision.id,
    relevance: "substantive-topic",
    conceptIds: provision.conceptIds,
    rationale:
      "This provision is a curated topical anchor in the research corpus.",
    reviewStatus: "editorial-reviewed",
    reviewedOn: provision.editorial.reviewedOn,
  };
  return {
    ...provision,
    conceptIds: Array.from(
      new Set([...provision.conceptIds, ...topicRelevance.conceptIds]),
    ),
    topicRelevance,
  };
}

function provisionTypeForRecord(article: ArticleRecord) {
  if (article.provisionType) return article.provisionType;
  if (article.instrumentId === "us-nist-ai-rmf-1-0") {
    return "framework-unit";
  }
  if (article.unitType === "supplementary-provision-block") {
    return "supplementary-provision";
  }
  if (article.unitType === "appended-table") return "schedule";
  if (/^schedule\b/i.test(article.label)) return "schedule";
  if (/^section\b/i.test(article.label)) return "section";
  return "article";
}

function normalizedEnglishTranslation(
  article: ArticleRecord,
): SeedProvision["translations"] {
  const translation = article.translations?.en;
  if (!translation) return undefined;
  const source =
    typeof translation.source === "string"
      ? {
          url: translation.source,
          label: translation.sourceLabel ?? "Official English reference text",
          accessedOn: article.retrievedOn,
        }
      : translation.source;
  const isCoAuthentic = translation.status === "official";
  const sourceVersion = translation.sourceVersion;
  const versionLabel =
    translation.versionLabel ??
    (typeof sourceVersion === "string"
      ? sourceVersion
      : sourceVersion?.versionLabel ??
        sourceVersion?.consolidatedAsOf ??
        sourceVersion?.asOf ??
        sourceVersion?.effectiveRevisionDate ??
        sourceVersion?.lastVersion ??
        sourceVersion?.translatedOn);
  return {
    en: {
      title: translation.title,
      paragraphs: translation.paragraphs,
      fullText: translation.fullText,
      status: isCoAuthentic ? "official" : "reference",
      note:
        translation.note ??
        translation.authorityNote ??
        (isCoAuthentic
          ? "The English and original-language enactments are co-authentic official texts."
          : "Government-published English reference translation; the original-language text controls."),
      source,
      coverageStatus: translation.coverageStatus,
      versionAsOf: translation.versionAsOf,
      versionLabel,
      currentTextEquivalent: translation.currentTextEquivalent,
      alignmentStatus: translation.alignmentStatus,
    },
  };
}

function normalizedAlternativeLanguageTexts(
  article: ArticleRecord,
): SeedProvision["alternativeLanguageTexts"] {
  if (!article.translations || !/^en(?:-|$)/i.test(article.language)) {
    return undefined;
  }
  const texts = Object.entries(article.translations)
    .filter(
      ([language, translation]) =>
        !/^en(?:-|$)/i.test(language) &&
        !/^en(?:-|$)/i.test(translation.language ?? language),
    )
    .map(([languageKey, translation]) => {
      const language = translation.language ?? languageKey;
      const sourceUrl =
        typeof translation.source === "string"
          ? translation.source
          : translation.source?.url ??
            translation.sourceRecord?.sourceSubdivision ??
            translation.sourceRecord?.sourceExpression;
      const source = sourceUrl
        ? typeof translation.source === "object" && translation.source
          ? translation.source
          : {
              url: sourceUrl,
              label:
                translation.sourceLabel ??
                `Official ${nativeLanguageLabel(language)} legal text`,
              accessedOn: article.retrievedOn,
            }
        : undefined;
      const isCoAuthentic =
        translation.status === "official" ||
        translation.status === "official-co-published" ||
        translation.status === "official-co-authentic-equal-status" ||
        translation.status === "official-authoritative-equal-status";
      return {
        language,
        title: translation.title,
        paragraphs: translation.paragraphs,
        fullText: translation.fullText,
        status: isCoAuthentic ? ("official" as const) : ("reference" as const),
        note:
          translation.note ??
          translation.authorityNote ??
          article.authenticity?.authorityNote ??
          (isCoAuthentic
            ? "This language text is an authoritative official enactment."
            : "Reference-language text; consult the source record for its authority status."),
        source,
      };
    });
  return texts.length ? texts : undefined;
}

function legalEffectStatusForRecord(article: ArticleRecord) {
  if (article.legalEffectStatus) return article.legalEffectStatus;
  if (article.instrumentId === "ca-pipeda") {
    return /^\[(?:repealed|modifications)\]$/i.test(article.fullText.trim())
      ? "structural-current-consolidation-placeholder"
      : "in-force-current-text";
  }
  if (article.instrumentId === "br-lgpd-2018") {
    if (/vetoed provision/i.test(article.title)) return "vetoed-placeholder";
    if (/repealed provision/i.test(article.title)) return "repealed-placeholder";
    return "in-force-current-text";
  }
  return article.language === "zh-CN"
    ? "in-force"
    : "instrument-status-only";
}

function articleToProvision(article: ArticleRecord, sourceOrder: number): Provision {
  const seed = seedProvisionById.get(article.id);
  const isOfficialChineseImport = article.language === "zh-CN";
  const isOriginalLanguage = !/^en(?:-|$)/i.test(article.language);
  const translations = normalizedEnglishTranslation(article);
  const hasProjectAuthoredEnglishReference = Boolean(
    translations?.en?.coverageStatus?.includes("project"),
  );
  const alternativeLanguageTexts = normalizedAlternativeLanguageTexts(article);
  const hasOfficialAlternativeText = Boolean(
    alternativeLanguageTexts?.some((text) => text.status === "official"),
  );
  const defaultEnglishIsNonAuthoritative = Boolean(
    /^en(?:-|$)/i.test(article.language) &&
      article.defaultLanguageStatus?.includes("non-authoritative"),
  );
  const importedLegalEffectStatus = legalEffectStatusForRecord(article);
  const importedAppliesFrom =
    article.appliesFrom ?? article.effectiveFrom ?? null;
  const importedVersion =
    article.versionAsOf ??
    article.sourceVersion?.effectiveFrom ??
    article.retrievedOn;
  const base: SeedProvision = {
    id: article.id,
    instrumentId: article.instrumentId,
    locator: article.label,
    originalTitle: article.originalTitle,
    title: article.title,
    provisionType: provisionTypeForRecord(article),
    parentId:
      article.parentId ?? article.section?.id ?? article.chapter?.id ?? null,
    summary:
      article.summary ??
      article.paragraphs[0] ??
      "Official Article text is available from the linked source.",
    conceptIds: article.coreConceptIds ?? [],
    actorTags: [],
    scopeTags: [],
    legalEffectStatus: importedLegalEffectStatus,
    appliesFrom: importedAppliesFrom,
    versionAsOf: importedVersion,
    textAvailability: {
      mode: hasOfficialAlternativeText
          ? "official-multilingual-full-text-stored"
        : translations
          ? translations.en?.status === "official"
            ? "official-co-authentic-full-text-stored"
            : "official-original-and-reference-translation-stored"
          : isOriginalLanguage
            ? "official-original-text-stored"
            : "official-full-text-stored",
      stored: true,
      language: article.language,
      note: article.currentOperativeText
          ? "The reader displays the current operative wording after the identified binding judicial interpretation. The generated source record separately preserves the promulgated text and the court overlay."
        : article.hasEnactedFutureAmendment
          ? "The reader displays only the authorised current compilation. Enacted amendments with a later commencement date are preserved as future metadata and are not inserted into the current text."
        : defaultEnglishIsNonAuthoritative
          ? "Complete authoritative original-language texts and an official non-authoritative English translation are stored with their distinct legal status."
        : hasOfficialAlternativeText
          ? "Complete official multilingual texts are stored from the official legislative publication."
        : translations?.en?.status === "official"
          ? "Complete co-authentic original-language and English texts are stored from the official legislative publication."
          : translations
            ? hasProjectAuthoredEnglishReference
              ? "Complete official original-language text and a separately labelled project-authored English reference translation are stored with source, licence and authority notices."
              : "Complete official original-language text and a government-published English reference translation are stored with authority labels."
          : isOfficialChineseImport
            ? "Complete official Chinese Article text extracted from the issuing government's publication. No English legal text is shown unless a separately sourced translation is attached to this Article."
          : isOriginalLanguage
              ? "Complete official original-language text is stored. Where no sourced English legal text is incorporated, the English view displays a coverage notice and never substitutes concept analysis for the law."
              : "Official provision text extracted from the cited public legal source; version metadata and reuse terms remain attached to the generated corpus.",
    },
    source: {
      url: article.sourceFragment ?? article.source,
      label: article.sourceLabel ?? "Official legal text",
      accessedOn: article.retrievedOn,
    },
    editorial: {
      reviewStatus: "source-verified",
      reviewedOn: article.retrievedOn,
      note: article.currentOperativeText
          ? "The source record preserves the promulgated wording; this reader renders the separately hashed current operative text required by the identified binding court decision."
        : article.hasEnactedFutureAmendment
          ? "This node is current compiled text only. Its source record separately identifies enacted future wording and confirms that the future text is not included in the displayed provision."
        : defaultEnglishIsNonAuthoritative
          ? "Hierarchy, three authoritative enactments, and the official non-authoritative English translation were aligned from Fedlex without changing their legal status."
        : hasOfficialAlternativeText
          ? "Hierarchy and official multilingual texts were imported from the official legislative publication."
        : translations?.en?.status === "official"
          ? "Hierarchy and both co-authentic language texts were imported from the official legislative publication."
          : translations
            ? hasProjectAuthoredEnglishReference
              ? "Hierarchy and original-language text were imported from the official publication; the separately labelled project-authored English reference retains its own source basis and licence metadata."
              : "Hierarchy, original-language text, and the separately labelled government English reference translation were imported without machine translation."
            : isOfficialChineseImport
              ? "Article boundaries, hierarchy, and Chinese text were imported from official government HTML; any English display is separately sourced and authority-labelled."
            : "Hierarchy and text imported from the instrument's official publication.",
    },
    translations,
    englishAvailability: article.englishAvailability,
    alternativeLanguageTexts,
    defaultLanguageStatus: article.defaultLanguageStatus,
    languageAuthorityNote: article.authenticity?.authorityNote,
  };

  return provisionWithConceptReview({
    ...base,
    ...seed,
    locator: seed?.locator ?? base.locator,
    title: seed?.title ?? base.title,
    originalTitle: article.originalTitle ?? seed?.originalTitle,
    provisionType: base.provisionType,
    summary: seed?.summary ?? base.summary,
    legalEffectStatus: importedLegalEffectStatus,
    appliesFrom: importedAppliesFrom,
    versionAsOf: importedVersion,
    textAvailability: base.textAvailability,
    source: base.source,
    translations: translations ?? seed?.translations,
    englishAvailability:
      article.englishAvailability ?? seed?.englishAvailability,
    alternativeLanguageTexts:
      alternativeLanguageTexts ?? seed?.alternativeLanguageTexts,
    defaultLanguageStatus:
      article.defaultLanguageStatus ?? seed?.defaultLanguageStatus,
    languageAuthorityNote:
      article.authenticity?.authorityNote ?? seed?.languageAuthorityNote,
    paragraphs: article.paragraphs,
    fullText: article.fullText,
    chapter: article.chapter ?? undefined,
    section: article.section,
    articleNumber: article.articleNumber,
    applicability: article.applicability,
    currentEffectiveVersion: article.currentEffectiveVersion,
    sourceOrder,
  });
}

const provisionMap = new Map<string, Provision>();
const sourceOrderByInstrument = new Map<string, number>();
normalizedArticleRecords.forEach((article) => {
  const sourceOrder = sourceOrderByInstrument.get(article.instrumentId) ?? 0;
  sourceOrderByInstrument.set(article.instrumentId, sourceOrder + 1);
  provisionMap.set(article.id, articleToProvision(article, sourceOrder));
});
seedProvisions.forEach((provision) => {
  if (!provisionMap.has(provision.id)) {
    provisionMap.set(provision.id, provisionWithConceptReview(provision));
  }
});
const provisions = Array.from(provisionMap.values());

const provisionsByInstrument = new Map<string, Provision[]>();
provisions.forEach((provision) => {
  const list = provisionsByInstrument.get(provision.instrumentId) ?? [];
  list.push(provision);
  provisionsByInstrument.set(provision.instrumentId, list);
});

const sourceTextIdsByInstrument = new Map<string, Set<string>>();
normalizedArticleRecords.forEach((article) => {
  const ids =
    sourceTextIdsByInstrument.get(article.instrumentId) ?? new Set<string>();
  ids.add(article.id);
  sourceTextIdsByInstrument.set(article.instrumentId, ids);
});

const expectedArticleIdsByInstrument = new Map<string, string[]>();
normalizedArticleRecords.forEach((article) => {
  const ids = expectedArticleIdsByInstrument.get(article.instrumentId) ?? [];
  ids.push(article.id);
  expectedArticleIdsByInstrument.set(article.instrumentId, ids);
});

const expectedSeedIdsByInstrument = new Map<string, string[]>();
seedProvisions.forEach((provision) => {
  const ids = expectedSeedIdsByInstrument.get(provision.instrumentId) ?? [];
  ids.push(provision.id);
  expectedSeedIdsByInstrument.set(provision.instrumentId, ids);
});

for (const list of provisionsByInstrument.values()) {
  list.sort((left, right) => {
    if (left.sourceOrder !== undefined || right.sourceOrder !== undefined) {
      return (
        (left.sourceOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.sourceOrder ?? Number.MAX_SAFE_INTEGER)
      );
    }
    const leftNumber = Number(left.articleNumber);
    const rightNumber = Number(right.articleNumber);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
    return left.locator.localeCompare(right.locator, undefined, {
      numeric: true,
    });
  });
}

const hydratedInstrumentIds = new Set<string>();
const instrumentHydrationPromises = new Map<string, Promise<void>>();

async function hydrateInstrumentCorpus(
  instrumentId: string,
  options: { force?: boolean } = {},
) {
  if (hydratedInstrumentIds.has(instrumentId) && !options.force) return;
  if (options.force) hydratedInstrumentIds.delete(instrumentId);
  const activeRequest = instrumentHydrationPromises.get(instrumentId);
  if (activeRequest && !options.force) return activeRequest;

  const shardUrl = clientCorpusIndex.shards[instrumentId];
  if (!shardUrl) {
    throw new Error(`No client corpus shard is registered for ${instrumentId}.`);
  }

  const request = loadCorpusShard(instrumentId, shardUrl, {
    ...options,
    expected: {
      schemaVersion: clientCorpusIndex.schemaVersion,
      articleIds: expectedArticleIdsByInstrument.get(instrumentId) ?? [],
      seedIds: expectedSeedIdsByInstrument.get(instrumentId) ?? [],
    },
  })
    .then((payload: CorpusShardPayload) => {
      const hydratedSeeds = payload.seedProvisions as SeedProvision[];
      hydratedSeeds.forEach((seed) => {
        const indexedSeed = seedProvisionById.get(seed.id);
        if (indexedSeed) Object.assign(indexedSeed, seed);
      });

      (payload.articleRecords as ImportedArticleRecord[]).forEach(
        (rawArticle, shardOrder) => {
          const article = normalizeImportedArticle(rawArticle);
          const existing = provisionMap.get(article.id);
          if (!existing) {
            throw new Error(
              `Corpus shard ${instrumentId} contains unindexed provision ${article.id}.`,
            );
          }
          const hydrated = articleToProvision(
            article,
            existing.sourceOrder ?? shardOrder,
          );
          Object.assign(existing, hydrated);
        },
      );

      hydratedSeeds.forEach((seed) => {
        const existing = provisionMap.get(seed.id);
        if (existing && !payload.articleRecords.some(
          (article) =>
            (article as ImportedArticleRecord).id === seed.id,
        )) {
          Object.assign(existing, provisionWithConceptReview(seed));
        }
      });
      hydratedInstrumentIds.add(instrumentId);
    })
    .finally(() => {
      if (instrumentHydrationPromises.get(instrumentId) === request) {
        instrumentHydrationPromises.delete(instrumentId);
      }
    });

  instrumentHydrationPromises.set(instrumentId, request);
  return request;
}

function corpusErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The legal-text corpus could not be downloaded.";
}

const relationsByProvision = new Map<string, Relation[]>();
const relationsByInstrument = new Map<string, Relation[]>();
relations.forEach((relation) => {
  if (relation.source.type === "provision") {
    const list = relationsByProvision.get(relation.source.id) ?? [];
    list.push(relation);
    relationsByProvision.set(relation.source.id, list);
  }
  if (relation.target.type === "provision") {
    const list = relationsByProvision.get(relation.target.id) ?? [];
    list.push(relation);
    relationsByProvision.set(relation.target.id, list);
  }
  if (relation.source.type === "instrument") {
    const list = relationsByInstrument.get(relation.source.id) ?? [];
    list.push(relation);
    relationsByInstrument.set(relation.source.id, list);
  }
  if (relation.target.type === "instrument") {
    const list = relationsByInstrument.get(relation.target.id) ?? [];
    list.push(relation);
    relationsByInstrument.set(relation.target.id, list);
  }
});

const relationById = new Map(
  relations.map((relation) => [relation.id, relation]),
);

const relationConceptIdsByEntity = new Map<string, Set<string>>();
relations.forEach((relation) => {
  for (const endpoint of [relation.source, relation.target]) {
    if (endpoint.type !== "instrument" && endpoint.type !== "provision") continue;
    const existing = relationConceptIdsByEntity.get(endpoint.id) ?? new Set<string>();
    relation.conceptIds.forEach((conceptId) => existing.add(conceptId));
    relationConceptIdsByEntity.set(endpoint.id, existing);
  }
});

function searchableConceptIds(
  entityId: string,
  directConceptIds: string[],
) {
  return Array.from(
    new Set([
      ...directConceptIds,
      ...(relationConceptIdsByEntity.get(entityId) ?? []),
    ]),
  );
}

function searchableProvisionTranslations(provision: Provision) {
  return [
    ...(provision.translations?.en
      ? [
          provision.translations.en.title ?? "",
          provision.translations.en.fullText ||
            provision.translations.en.paragraphs.join("\n"),
        ]
      : []),
    ...(provision.alternativeLanguageTexts ?? []).flatMap((text) => [
      text.title ?? "",
      text.fullText || text.paragraphs.join("\n"),
    ]),
  ].filter(Boolean);
}

function buildSearchDocuments(): SearchDocument[] {
  const instrumentDocuments: SearchDocument[] = instruments.map((instrument) => {
    const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
    const conceptIds = searchableConceptIds(instrument.id, instrument.topicIds);
    return {
      id: instrument.id,
      type: "instrument",
      label: instrument.shortTitle,
      title: instrument.title,
      shortTitle: instrument.shortTitle,
      originalTitle: instrument.originalTitle,
      jurisdiction: jurisdiction?.name ?? instrument.jurisdictionId,
      aliases: [
        jurisdiction?.shortName ?? "",
        jurisdiction?.isoCode ?? "",
        ...instrument.issuingBodies,
      ].filter(Boolean),
      summary: instrument.summary,
      keywords: [
        instrument.category,
        instrument.hierarchyLevel,
        instrument.legalForce,
        instrument.lifecycleStatus,
        ...conceptIds.map(
          (conceptId) => conceptById.get(conceptId)?.label ?? conceptId,
        ),
      ],
      conceptIds,
    };
  });

  const provisionDocuments: SearchDocument[] = provisions.map((provision) => {
    const instrument = instrumentById.get(provision.instrumentId);
    const jurisdiction = instrument
      ? jurisdictionById.get(instrument.jurisdictionId)
      : undefined;
    const conceptIds = searchableConceptIds(
      provision.id,
      provision.conceptIds,
    );
    return {
      id: provision.id,
      type: "provision",
      label: `${instrument?.shortTitle ?? provision.instrumentId} ${provision.locator}`,
      title: provision.title,
      originalTitle: provision.originalTitle,
      locator: provision.locator,
      instrumentId: provision.instrumentId,
      instrumentShortTitle: instrument?.shortTitle,
      jurisdiction: jurisdiction?.name ?? instrument?.jurisdictionId,
      aliases: [
        instrument?.title ?? "",
        instrument?.originalTitle ?? "",
        provision.articleNumber ?? "",
        provision.chapter?.title ?? "",
        provision.section?.title ?? "",
      ].filter(Boolean),
      summary: provision.summary,
      keywords: [
        ...provision.actorTags,
        ...provision.scopeTags,
        provision.provisionType,
        ...conceptIds.map(
          (conceptId) => conceptById.get(conceptId)?.label ?? conceptId,
        ),
      ],
      conceptIds,
      fullText:
        provision.fullText ?? provision.paragraphs?.join("\n") ?? "",
      translations: searchableProvisionTranslations(provision),
    };
  });

  const conceptDocuments: SearchDocument[] = concepts.map((concept) => ({
    id: concept.id,
    type: "concept",
    label: concept.label,
    title: conceptThemeById.get(concept.theme)?.label,
    aliases: concept.aliases,
    summary: concept.summary,
    description: concept.description,
    keywords: [concept.family, concept.theme],
    conceptIds: [concept.id],
  }));

  return [
    ...instrumentDocuments,
    ...conceptDocuments,
    ...provisionDocuments,
  ];
}

const relationLabels: Record<string, string> = {
  equivalent: "Functional equivalent",
  broader: "Broader duty",
  narrower: "Narrower duty",
  "partial-overlap": "Partial overlap",
  "future-partial-overlap": "Future partial overlap",
  "future-operational-overlap": "Future operational overlap",
  "operational-alignment": "Operational alignment",
  "historical-operational-alignment": "Historical operational alignment",
  "historical-operational-overlap": "Historical operational overlap",
  "historical-policy-overlap": "Historical policy overlap",
  "historical-comparison": "Historical comparison",
  "soft-law-alignment": "Soft-law alignment",
  "shared-legal-origin": "Shared legal origin",
  "policy-transition": "Policy transition",
  "grounded-in": "Grounded in",
  elaborates: "Elaborates",
  operationalizes: "Operationalizes",
  implements: "Implements",
  repeals: "Repeals",
  "repeals-and-reenacts": "Repeals and reenacts",
  "policy-framework-alignment": "Policy/framework alignment",
  "practice-guidance-alignment": "Practice guidance alignment",
  "practice-guidance-overlap": "Practice guidance overlap",
  "supports-operational-evidence": "Supports operational evidence",
  incorporated_by_reference: "Incorporated by reference",
  conflicts_with: "Potential conflict",
  supersedes: "Supersedes",
  revokes: "Revokes",
  revoked_by: "Revoked by",
  inspired_by: "Influenced by",
  complements: "Complementary control",
  aligned_with: "Aligned outcome",
};

const viewLabels: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "atlas", label: "Atlas", icon: MapIcon },
  { id: "research", label: "Research", icon: FlaskConical },
  { id: "instrument", label: "Instrument", icon: BookOpenText },
  { id: "connections", label: "Connections", icon: Network },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "compare", label: "Compare", icon: Columns2 },
];

const researchLabViewIds = [
  "observatory",
  "genome",
  "morphology",
  "grammar",
  "timeline",
  "translation",
  "bridges",
  "pathways",
  "archetypes",
  "audit",
  "horizon",
  "microscope",
  "neighborhoods",
  "granularity",
] as const satisfies readonly ResearchLabView[];

function isResearchLabView(value: string | null): value is ResearchLabView {
  return Boolean(
    value && (researchLabViewIds as readonly string[]).includes(value),
  );
}

type DynamicLoadingProps = {
  error?: Error | null;
  isLoading?: boolean;
  retry?: () => void;
};

function reloadAtlasAfterModuleFailure() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#view=atlas`,
  );
  window.location.reload();
}

function ResearchModuleLoading({ error, retry }: DynamicLoadingProps) {
  if (error) {
    return (
      <section className="empty-state" role="alert">
        <span>RESEARCH_MODULE_UNAVAILABLE</span>
        <h2>The Research Lab interface did not load.</h2>
        <p>{error.message}</p>
        <div>
          <button type="button" className="interface-back-button" onClick={retry}>
            <Database aria-hidden="true" />
            RETRY MODULE
          </button>
          <button
            type="button"
            className="interface-back-button"
            onClick={reloadAtlasAfterModuleFailure}
          >
            <ArrowLeft aria-hidden="true" />
            BACK TO ATLAS
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="empty-state" aria-busy="true" aria-live="polite">
      <span>RESEARCH_MODULE_LOADING</span>
      <h2>Opening the Research Lab.</h2>
      <p>Loading the analytical interface and corpus methods…</p>
    </section>
  );
}

const LazyResearchView = dynamic<LazyResearchViewProps>(
  () => import("./lazy-research-view"),
  {
    ssr: false,
    loading: ResearchModuleLoading,
  },
);

function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case "OPEN_ATLAS":
      return {
        ...state,
        view: "atlas",
        navigatorTab: "sources",
        selectedInstrumentId: null,
        selectedProvisionId: null,
        selectedRelationId: null,
        selectedConceptId: null,
        readerTab: "text",
      };
    case "OPEN_INSTRUMENT":
      return {
        ...state,
        view: "instrument",
        navigatorTab: "sources",
        selectedInstrumentId: action.instrumentId,
        selectedProvisionId: null,
        selectedRelationId: null,
        selectedConceptId: null,
        readerTab: "text",
        query: "",
      };
    case "OPEN_PROVISION":
      return {
        ...state,
        view: "connections",
        navigatorTab: "sources",
        selectedInstrumentId: action.instrumentId,
        selectedProvisionId: action.provisionId,
        selectedRelationId: action.relationId ?? null,
        selectedConceptId: null,
        readerTab: "text",
        query: "",
      };
    case "OPEN_VIEW":
      if (action.view === "atlas") {
        return {
          ...state,
          view: "atlas",
          navigatorTab: "sources",
          selectedInstrumentId: null,
          selectedProvisionId: null,
          selectedRelationId: null,
          selectedConceptId: null,
          readerTab: "text",
        };
      }
      if (action.view === "research") {
        return {
          ...state,
          view: "research",
          navigatorTab: "sources",
          selectedInstrumentId: null,
          selectedProvisionId: null,
          selectedRelationId: null,
          selectedConceptId: null,
          readerTab: "text",
          query: "",
        };
      }
      if (action.view === "instrument" || action.view === "timeline") {
        return {
          ...state,
          view: action.view,
          navigatorTab: "sources",
          selectedProvisionId: null,
          selectedRelationId: null,
          selectedConceptId: null,
          readerTab: "text",
        };
      }
      return {
        ...state,
        view: action.view,
        navigatorTab: "sources",
        selectedConceptId: null,
        selectedRelationId:
          action.view === "connections" ? state.selectedRelationId : null,
      };
    case "SET_NAVIGATOR_TAB":
      return {
        ...state,
        view: "atlas",
        navigatorTab: action.tab,
        selectedInstrumentId: null,
        selectedProvisionId: null,
        selectedRelationId: null,
        selectedConceptId: null,
        readerTab: "text",
        query: "",
      };
    case "OPEN_CONCEPT":
      return {
        ...state,
        view: "atlas",
        navigatorTab: "concepts",
        selectedInstrumentId: null,
        selectedProvisionId: null,
        selectedRelationId: null,
        selectedConceptId: action.conceptId,
        readerTab: "text",
        query: "",
      };
    case "SELECT_RELATION":
      return {
        ...state,
        selectedRelationId: action.relationId,
        readerTab: "analysis",
      };
    case "SET_READER_TAB":
      return { ...state, readerTab: action.tab };
    case "SET_QUERY":
      return { ...state, query: action.query };
    case "ADD_COMPARE":
      if (state.compareIds.includes(action.provisionId)) return state;
      return {
        ...state,
        compareIds: [...state.compareIds, action.provisionId].slice(-2),
      };
    case "REMOVE_COMPARE":
      return {
        ...state,
        compareIds: state.compareIds.filter(
          (provisionId) => provisionId !== action.provisionId,
        ),
      };
    case "CLEAR_COMPARE":
      return { ...state, compareIds: [] };
    case "RESTORE_STATE":
      return {
        ...action.state,
        compareIds: [...action.state.compareIds],
      };
    default:
      return state;
  }
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function nativeLanguageLabel(language: string) {
  if (/^zh-(?:hant|tw|hk)(?:-|$)/i.test(language)) return "繁體中文";
  if (/^zh(?:-|$)/i.test(language)) return "简体中文";
  if (/^ja(?:-|$)/i.test(language)) return "日本語";
  if (/^ko(?:-|$)/i.test(language)) return "한국어";
  if (/^fr(?:-|$)/i.test(language)) return "Français";
  if (/^de(?:-|$)/i.test(language)) return "Deutsch";
  if (/^it(?:-|$)/i.test(language)) return "Italiano";
  if (/^pt(?:-|$)/i.test(language)) return "Português";
  if (/^ar(?:-|$)/i.test(language)) return "العربية";
  if (/^id(?:-|$)/i.test(language)) return "Bahasa Indonesia";
  if (/^vi(?:-|$)/i.test(language)) return "Tiếng Việt";
  return language.toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return parts[0] + "." + parts[1] + "." + parts[2];
}

function otherRelationEndpoint(relation: Relation, provisionId: string) {
  if (
    relation.source.type === "provision" &&
    relation.source.id === provisionId
  ) {
    return relation.target;
  }
  if (
    relation.target.type === "provision" &&
    relation.target.id === provisionId
  ) {
    return relation.source;
  }
  return null;
}

function relationDirectionMarker(relation: Relation, anchorId: string) {
  if (relation.directionality !== "directed") return "↔";
  return relation.source.id === anchorId ? "→" : "←";
}

function otherInstrumentEndpoint(relation: Relation, instrumentId: string) {
  if (
    relation.source.type === "instrument" &&
    relation.source.id === instrumentId &&
    relation.target.type === "instrument"
  ) {
    return relation.target;
  }
  if (
    relation.target.type === "instrument" &&
    relation.target.id === instrumentId &&
    relation.source.type === "instrument"
  ) {
    return relation.source;
  }
  return null;
}

function forceClass(instrument: Instrument) {
  const force = instrument.legalForce.toLowerCase();
  const category = instrument.category.toLowerCase();
  if (
    force.includes("voluntary") ||
    force.includes("non-binding") ||
    force.includes("advisory") ||
    category.includes("framework") ||
    category.includes("report") ||
    category.includes("principle")
  ) {
    return "soft";
  }
  if (
    force.includes("not-enacted") ||
    force.includes("lapsed") ||
    category.includes("consultation") ||
    category.includes("bill") ||
    instrument.lifecycleStatus.includes("veto") ||
    instrument.lifecycleStatus.includes("pending")
  ) {
    return "proposal";
  }
  if (
    category.includes("executive") ||
    category.includes("directive") ||
    category.includes("guidance") ||
    category.includes("policy") ||
    force.includes("mandatory-internal")
  ) {
    return "executive";
  }
  return "binding";
}

function statusClass(instrument: Instrument) {
  const status = instrument.lifecycleStatus.toLowerCase();
  if (
    status.includes("veto") ||
    status.includes("revoked") ||
    status.includes("repealed") ||
    status.includes("historical") ||
    status.includes("ceased") ||
    status.includes("lapsed") ||
    status.includes("superseded") ||
    status.includes("closed-not-proceeding")
  ) {
    return "historical";
  }
  if (
    status.includes("pending") ||
    status.includes("introduced") ||
    status.includes("draft")
  ) {
    return "proposal";
  }
  if (forceClass(instrument) === "soft") {
    return "soft";
  }
  return "active";
}

function rootJurisdiction(jurisdictionId: string) {
  let current = jurisdictionById.get(jurisdictionId);
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    current = jurisdictionById.get(current.parentId) ?? current;
  }
  return current;
}

type AtlasGroup = {
  id: string;
  label: string;
  description: string;
  markId: string;
  instruments: Instrument[];
};

const atlasGroupOrder = [
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
  "frameworks",
];

function buildAtlasGroups(): AtlasGroup[] {
  const groups = new Map<string, AtlasGroup>();
  instruments.forEach((instrument) => {
    const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
    const root =
      jurisdiction?.id === "hk"
        ? jurisdiction
        : (rootJurisdiction(instrument.jurisdictionId) ?? jurisdiction);
    const contextTypes = [jurisdiction?.type ?? "", root?.type ?? ""].join(" ");
    const international =
      contextTypes.includes("international") ||
      contextTypes.includes("intergovernmental") ||
      contextTypes.includes("standards");
    const framework = international;
    const key = framework ? "frameworks" : (root?.id ?? "other");
    const label = framework
      ? "International / Transnational Frameworks"
      : (root?.name ?? "Other");
    const group = groups.get(key) ?? {
      id: key,
      label,
      markId: framework ? "int" : (root?.id ?? instrument.jurisdictionId),
      description:
        framework
          ? "Multilateral principles, international standards, declarations and transnational governance frameworks"
          : (root?.description ?? ""),
      instruments: [],
    };
    group.instruments.push(instrument);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      instruments: group.instruments.sort((left, right) =>
        left.shortTitle.localeCompare(right.shortTitle),
      ),
    }))
    .sort((left, right) => {
      const leftIndex = atlasGroupOrder.indexOf(left.id);
      const rightIndex = atlasGroupOrder.indexOf(right.id);
      return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
    });
}

const atlasGroups = buildAtlasGroups();

const conceptsByTheme = new Map(
  conceptThemes.map((theme) => [
    theme.id,
    concepts
      .filter((concept) => concept.theme === theme.id)
      .sort((left, right) => left.label.localeCompare(right.label)),
  ]),
);

type ConceptEvidence = {
  instrumentIds: Set<string>;
  provisionIds: Set<string>;
  relationIds: Set<string>;
};

const conceptEvidenceById = new Map<string, ConceptEvidence>(
  concepts.map((concept) => [
    concept.id,
    {
      instrumentIds: new Set<string>(),
      provisionIds: new Set<string>(),
      relationIds: new Set<string>(),
    },
  ]),
);

instruments.forEach((instrument) => {
  instrument.topicIds.forEach((conceptId) => {
    conceptEvidenceById.get(conceptId)?.instrumentIds.add(instrument.id);
  });
});

provisions.forEach((provision) => {
  provision.conceptIds.forEach((conceptId) => {
    const evidence = conceptEvidenceById.get(conceptId);
    evidence?.provisionIds.add(provision.id);
    evidence?.instrumentIds.add(provision.instrumentId);
  });
});

relations.forEach((relation) => {
  relation.conceptIds.forEach((conceptId) => {
    const evidence = conceptEvidenceById.get(conceptId);
    if (!evidence) return;
    evidence.relationIds.add(relation.id);
    [relation.source, relation.target].forEach((endpoint) => {
      if (endpoint.type === "instrument") {
        evidence.instrumentIds.add(endpoint.id);
      }
      if (endpoint.type === "provision") {
        const provision = provisionMap.get(endpoint.id);
        if (!provision) return;
        evidence.provisionIds.add(provision.id);
        evidence.instrumentIds.add(provision.instrumentId);
      }
    });
  });
});

const globeJurisdictions = atlasGroups.map((group) => ({
  id: group.id === "frameworks" ? "int" : group.id,
  label:
    group.id === "frameworks"
      ? "International / Frameworks"
      : group.label,
  instrumentIds: group.instruments.map((instrument) => instrument.id),
  primaryInstrumentId:
    group.instruments.find(
      (instrument) =>
        (provisionsByInstrument.get(instrument.id)?.length ?? 0) > 0,
    )?.id ?? group.instruments[0]?.id,
}));

const globeThemeRepresentatives = conceptThemes.flatMap((theme) => {
  const ranked = [...(conceptsByTheme.get(theme.id) ?? [])].sort((left, right) => {
    const evidenceDelta =
      (conceptEvidenceById.get(right.id)?.instrumentIds.size ?? 0) -
      (conceptEvidenceById.get(left.id)?.instrumentIds.size ?? 0);
    return evidenceDelta || left.label.localeCompare(right.label);
  });
  return ranked.slice(0, 1);
});
const globeRepresentativeIds = new Set(
  globeThemeRepresentatives.map((concept) => concept.id),
);
const globeConcepts = [
  ...globeThemeRepresentatives,
  ...concepts
    .filter((concept) => !globeRepresentativeIds.has(concept.id))
    .sort((left, right) => {
      const evidenceDelta =
        (conceptEvidenceById.get(right.id)?.instrumentIds.size ?? 0) -
        (conceptEvidenceById.get(left.id)?.instrumentIds.size ?? 0);
      return evidenceDelta || left.label.localeCompare(right.label);
    }),
].map((concept) => ({
  id: concept.id,
  label: concept.label,
  instrumentIds: Array.from(
    conceptEvidenceById.get(concept.id)?.instrumentIds ?? [],
  ),
}));

const constellationThemes = conceptThemes.map((theme) => ({
  id: theme.id,
  label: theme.label,
  summary: theme.summary,
}));
const constellationConcepts = concepts.map((concept) => ({
  id: concept.id,
  label: concept.label,
  themeId: concept.theme,
  instrumentIds: Array.from(
    conceptEvidenceById.get(concept.id)?.instrumentIds ?? [],
  ),
}));
const constellationInstruments = instruments.map((instrument) => ({
  id: instrument.id,
  label: instrument.title,
  shortLabel: instrument.shortTitle,
  jurisdictionId: instrument.jurisdictionId,
  jurisdictionLabel:
    jurisdictionById.get(instrument.jurisdictionId)?.shortName ??
    instrument.jurisdictionId,
}));

function safeDomId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function groupInstrumentProvisions(instrumentId: string) {
  const list = provisionsByInstrument.get(instrumentId) ?? [];
  const groups = new Map<
    string,
    { id: string; label: string; title: string; provisions: Provision[] }
  >();

  list.forEach((provision) => {
    const chapterId = provision.chapter?.id ?? "seeded";
    const group = groups.get(chapterId) ?? {
      id: chapterId,
      label: provision.chapter?.label ?? "PROVISION SET",
      title: provision.chapter?.title ?? "Mapped and indexed provisions",
      provisions: [],
    };
    group.provisions.push(provision);
    groups.set(chapterId, group);
  });

  return Array.from(groups.values());
}

type ProvisionSectionGroup = {
  id: string;
  label: string;
  title: string;
  provisions: Provision[];
};

function groupProvisionSections(provisionList: Provision[]) {
  const hasOfficialSections = provisionList.some(
    (provision) => provision.section?.id,
  );
  const groups = new Map<string, ProvisionSectionGroup>();

  if (hasOfficialSections) {
    provisionList.forEach((provision) => {
      const key = provision.section?.id ?? "chapter-root";
      const group = groups.get(key) ?? {
        id: key,
        label: provision.section?.label ?? "CHAPTER-LEVEL PROVISIONS",
        title: provision.section?.title ?? "Provisions outside a named section",
        provisions: [],
      };
      group.provisions.push(provision);
      groups.set(key, group);
    });
    return Array.from(groups.values());
  }

  const provisionIds = new Set(provisionList.map((provision) => provision.id));
  const hierarchyRoots = new Set(
    provisionList
      .map((provision) => provision.parentId)
      .filter(
        (parentId): parentId is string =>
          Boolean(parentId) && provisionIds.has(parentId!),
      ),
  );

  provisionList.forEach((provision) => {
    const rootId =
      provision.parentId && hierarchyRoots.has(provision.parentId)
        ? provision.parentId
        : hierarchyRoots.has(provision.id)
          ? provision.id
          : "indexed-provisions";
    const root = provisionMap.get(rootId);
    const group = groups.get(rootId) ?? {
      id: rootId,
      label: root ? root.locator : "INDEXED PROVISIONS",
      title: root ? root.title : "Mapped and indexed provisions",
      provisions: [],
    };
    group.provisions.push(provision);
    groups.set(rootId, group);
  });

  return Array.from(groups.values());
}

function provisionUnitLabel(
  provisionList: Provision[],
  { plural = true }: { plural?: boolean } = {},
) {
  const unitTypes = new Set(
    provisionList.map((provision) => provision.provisionType),
  );
  const unit = unitTypes.size === 1 ? [...unitTypes][0] : "provision";
  const label = unit.charAt(0).toUpperCase() + unit.slice(1);
  return plural && provisionList.length !== 1 ? `${label}s` : label;
}

function sectionOverview(
  instrumentId: string,
  section: ProvisionSectionGroup,
) {
  const curated = structureSummaryByKey.get(instrumentId + "::" + section.id);
  if (curated) {
    return {
      summary: curated.summary,
      label: "EDITORIAL OVERVIEW",
      reviewed: true,
    };
  }

  const hierarchyRoot = provisionMap.get(section.id);
  if (hierarchyRoot?.instrumentId === instrumentId) {
    return {
      summary: hierarchyRoot.summary,
      label: "EDITORIAL OVERVIEW",
      reviewed: true,
    };
  }

  const topics = section.provisions
    .map((provision) => provision.title)
    .filter((title) => title && title !== section.title)
    .slice(0, 3);
  const topicText = topics.length
    ? " Key indexed topics include " + topics.join("; ") + "."
    : "";
  return {
    summary:
      "This index group contains " +
      section.provisions.length +
      " provision" +
      (section.provisions.length === 1 ? "" : "s") +
      "." +
      topicText,
    label: "INDEX OVERVIEW",
    reviewed: false,
  };
}

function fallbackStatusEvents(instrument: Instrument): StatusEvent[] {
  const events: StatusEvent[] = [];
  const candidates = [
    {
      date: instrument.dates.adoptedOn,
      type: "adopted",
      label: "Adopted",
    },
    {
      date: instrument.dates.publishedOn,
      type: "published",
      label: "Published",
    },
    {
      date: instrument.dates.effectiveFrom,
      type: "effective",
      label: "Entered into force",
    },
    {
      date: instrument.dates.generalApplicationFrom,
      type: "application",
      label: "General application",
    },
    {
      date: instrument.dates.ceasedOn,
      type: "ceased",
      label: "Ceased / revoked",
    },
  ];

  candidates.forEach((candidate, index) => {
    if (!candidate.date) return;
    events.push({
      id: instrument.id + "-derived-" + index,
      instrumentId: instrument.id,
      date: candidate.date,
      type: candidate.type,
      label: candidate.label,
      effect: instrument.statusNote,
      resultingStatus: instrument.lifecycleStatus,
      source: instrument.source,
    });
  });
  return events;
}

function instrumentEvents(instrument: Instrument) {
  const explicit = statusEvents.filter(
    (event) => event.instrumentId === instrument.id,
  );
  const events = explicit.length ? explicit : fallbackStatusEvents(instrument);
  return [...events].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function NodeLegend() {
  return (
    <div className="node-legend" aria-label="Instrument node legend">
      <span><Scale aria-hidden="true" />Binding law</span>
      <span><Landmark aria-hidden="true" />Executive / agency</span>
      <span><FileClock aria-hidden="true" />Proposal / bill</span>
      <span><Globe2 aria-hidden="true" />Soft law / framework</span>
      <span><Archive aria-hidden="true" />Historical / revoked</span>
    </div>
  );
}

function InstrumentKindIcon({ instrument }: { instrument: Instrument }) {
  const Icon =
    statusClass(instrument) === "historical"
      ? Archive
      : forceClass(instrument) === "binding"
        ? Scale
        : forceClass(instrument) === "executive"
          ? Landmark
          : forceClass(instrument) === "proposal"
            ? FileClock
            : Globe2;
  return <Icon aria-hidden="true" />;
}

type CorpusLoadPhase = "idle" | "loading" | "ready" | "error";
type CorpusLoadState = {
  phase: CorpusLoadPhase;
  error?: string;
};

function CorpusLoadNotice({
  state,
  title,
  onRetry,
  onBackToAtlas,
}: {
  state: CorpusLoadState;
  title: string;
  onRetry: () => void;
  onBackToAtlas: () => void;
}) {
  const failed = state.phase === "error";
  return (
    <section
      className="empty-state"
      aria-busy={!failed}
      aria-live="polite"
      role={failed ? "alert" : undefined}
    >
      <span>{failed ? "CORPUS_LOAD_INTERRUPTED" : "CORPUS_LOADING"}</span>
      <h2>
        {failed
          ? "The legal text could not be loaded."
          : `Loading the complete text of ${title}.`}
      </h2>
      <p>
        {failed
          ? state.error
          : "The provision index is available now; the complete authoritative and reference-language texts are being retrieved on demand."}
      </p>
      {failed && (
        <div>
          <button
            type="button"
            className="interface-back-button"
            onClick={onRetry}
          >
            <Database aria-hidden="true" />
            RETRY TEXT
          </button>
          <button
            type="button"
            className="interface-back-button"
            onClick={onBackToAtlas}
          >
            <ArrowLeft aria-hidden="true" />
            BACK TO ATLAS
          </button>
        </div>
      )}
    </section>
  );
}

function NavigatorAccordion({
  id,
  expanded,
  onToggle,
  label,
  count,
  children,
  className = "",
}: {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  label: ReactNode;
  count: number;
  children: ReactNode;
  className?: string;
}) {
  const panelId = "navigator-panel-" + safeDomId(id);
  return (
    <section
      className={["navigator-accordion", className].filter(Boolean).join(" ")}
      data-expanded={expanded}
    >
      <button
        type="button"
        className="navigator-accordion-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        {label}
        <small>{count}</small>
        <ChevronRight className="accordion-chevron" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        className="navigator-collapse"
        data-expanded={expanded}
        aria-hidden={!expanded}
      >
        <div className="navigator-collapse-inner">{children}</div>
      </div>
    </section>
  );
}

function CorpusNavigator({
  navigatorTab,
  selectedInstrumentId,
  selectedProvisionId,
  selectedConceptId,
  query,
  searchResults,
  fullTextSearchState,
  onSetNavigatorTab,
  onOpenAtlas,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
  onRetryFullTextSearch,
}: {
  navigatorTab: NavigatorTab;
  selectedInstrumentId: string | null;
  selectedProvisionId: string | null;
  selectedConceptId: string | null;
  query: string;
  searchResults: SearchResult[];
  fullTextSearchState: CorpusLoadState;
  onSetNavigatorTab: (tab: NavigatorTab) => void;
  onOpenAtlas: () => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provision: Provision) => void;
  onOpenConcept: (conceptId: string) => void;
  onRetryFullTextSearch: () => void;
}) {
  const normalizedQuery = query.trim();
  const selectedInstrument = selectedInstrumentId
    ? instrumentById.get(selectedInstrumentId)
    : undefined;
  const selectedGroups = useMemo(
    () =>
      selectedInstrument ? groupInstrumentProvisions(selectedInstrument.id) : [],
    [selectedInstrument],
  );
  const selectedSourceGroupId = selectedInstrumentId
    ? atlasGroups.find((group) =>
        group.instruments.some(
          (instrument) => instrument.id === selectedInstrumentId,
        ),
      )?.id
    : undefined;
  const selectedArticleGroupId = selectedProvisionId
    ? selectedGroups.find((group) =>
        group.provisions.some(
          (provision) => provision.id === selectedProvisionId,
        ),
      )?.id
    : undefined;
  const selectedConceptThemeId = selectedConceptId
    ? conceptById.get(selectedConceptId)?.theme
    : undefined;
  const [sourceGroupOverrides, setSourceGroupOverrides] = useState<
    Record<string, boolean>
  >({});
  const [articleGroupOverrides, setArticleGroupOverrides] = useState<
    Record<string, boolean>
  >({});
  const [conceptThemeOverrides, setConceptThemeOverrides] = useState<
    Record<string, boolean>
  >({});

  function sourceGroupExpanded(groupId: string) {
    return (
      sourceGroupOverrides[groupId] ??
      (selectedSourceGroupId
        ? groupId === selectedSourceGroupId
        : groupId === atlasGroups[0]?.id)
    );
  }

  function articleGroupExpanded(groupId: string) {
    return (
      articleGroupOverrides[groupId] ?? groupId === selectedArticleGroupId
    );
  }

  function conceptThemeExpanded(themeId: string) {
    return (
      conceptThemeOverrides[themeId] ??
      (selectedConceptThemeId
        ? themeId === selectedConceptThemeId
        : themeId === conceptThemes[0]?.id)
    );
  }

  function toggleOverride(
    setter: Dispatch<SetStateAction<Record<string, boolean>>>,
    id: string,
    expanded: boolean,
  ) {
    setter((current) => ({ ...current, [id]: !expanded }));
  }

  const matchingInstruments = normalizedQuery
    ? searchResults
        .filter((result) => result.document.type === "instrument")
        .slice(0, 12)
    : [];
  const matchingProvisions = normalizedQuery
    ? searchResults
        .filter((result) => result.document.type === "provision")
        .slice(0, 18)
    : [];
  const matchingConcepts = normalizedQuery
    ? searchResults
        .filter((result) => result.document.type === "concept")
        .slice(0, 18)
    : [];

  function handleNavigatorTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentTab: NavigatorTab,
  ) {
    const tabs: NavigatorTab[] = ["sources", "concepts"];
    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    const mobileDrawerWillClose = window.matchMedia(
      mobileNavigatorMediaQuery,
    ).matches;
    onSetNavigatorTab(nextTab);
    if (!mobileDrawerWillClose) {
      document.getElementById("navigator-tab-" + nextTab)?.focus();
    }
  }

  const activeCount = navigatorTab === "sources" ? instruments.length : concepts.length;

  return (
    <aside
      id="corpus-navigator-panel"
      className="corpus-navigator"
      aria-label="Global regulation corpus"
      data-navigator-tab={navigatorTab}
    >
      <div className="navigator-header">
        <span className="terminal-label">RESEARCH_NAV</span>
        <span>
          {activeCount} {navigatorTab === "sources" ? "sources" : "concepts"}
        </span>
      </div>

      <div
        className="navigator-tabs"
        role="tablist"
        aria-label="Research index"
        data-active-tab={navigatorTab}
      >
        <span className="navigator-tab-indicator" aria-hidden="true" />
        <button
          type="button"
          role="tab"
          id="navigator-tab-sources"
          aria-controls="navigator-tabpanel-sources"
          aria-selected={navigatorTab === "sources"}
          onClick={() => onSetNavigatorTab("sources")}
          onKeyDown={(event) => handleNavigatorTabKeyDown(event, "sources")}
        >
          <MapIcon aria-hidden="true" />
          GLOBAL ATLAS
        </button>
        <button
          type="button"
          role="tab"
          id="navigator-tab-concepts"
          aria-controls="navigator-tabpanel-concepts"
          aria-selected={navigatorTab === "concepts"}
          onClick={() => onSetNavigatorTab("concepts")}
          onKeyDown={(event) => handleNavigatorTabKeyDown(event, "concepts")}
        >
          <BrainCircuit aria-hidden="true" />
          CORE CONCEPTS
        </button>
      </div>

      <div className="navigator-pane-viewport">
        <div
          key={navigatorTab}
          className="navigator-pane"
          data-direction={navigatorTab === "concepts" ? "forward" : "backward"}
          role="tabpanel"
          id={"navigator-tabpanel-" + navigatorTab}
          aria-labelledby={"navigator-tab-" + navigatorTab}
        >
          {navigatorTab === "sources" ? (
            <>
              <button
                type="button"
                className="atlas-home-button"
                onClick={onOpenAtlas}
              >
                <MapIcon aria-hidden="true" />
                GLOBAL ATLAS
              </button>

              {normalizedQuery ? (
                <div className="search-results" aria-label="Search results">
                  <p className="navigator-section-label">
                    MATCHES / {matchingInstruments.length + matchingProvisions.length}
                  </p>
                  {fullTextSearchState.phase === "loading" && (
                    <p className="navigator-empty" role="status">
                      Loading complete provision text for corpus-wide search…
                    </p>
                  )}
                  {fullTextSearchState.phase === "error" && (
                    <div role="alert">
                      <p className="navigator-empty">
                        Full-text search is temporarily unavailable. Metadata
                        matches remain visible.
                      </p>
                      <button type="button" onClick={onRetryFullTextSearch}>
                        Retry full-text index
                      </button>
                    </div>
                  )}
                  {matchingInstruments.map((result) => {
                    const instrument = instrumentById.get(result.document.id);
                    if (!instrument) return null;
                    return (
                      <button
                        type="button"
                        key={instrument.id}
                        onClick={() => onOpenInstrument(instrument.id)}
                      >
                        <span className="instrument-tree-title">
                          <JurisdictionMark
                            jurisdictionId={instrument.jurisdictionId}
                            small
                          />
                          {instrument.shortTitle}
                        </span>
                        <small>{result.reason}</small>
                      </button>
                    );
                  })}
                  {matchingProvisions.map((result) => {
                    const provision = provisionMap.get(result.document.id);
                    if (!provision) return null;
                    return (
                      <button
                        type="button"
                        key={provision.id}
                        onClick={() => onOpenProvision(provision)}
                      >
                        <span>
                          {instrumentById.get(provision.instrumentId)?.shortTitle}{" "}
                          {provision.locator}
                        </span>
                        <small>
                          {provision.title} · {result.reason}
                        </small>
                      </button>
                    );
                  })}
                  {!matchingInstruments.length &&
                    !matchingProvisions.length &&
                    fullTextSearchState.phase !== "loading" && (
                    <p className="navigator-empty">No indexed legal-source match.</p>
                  )}
                </div>
              ) : (
                <div className="corpus-tree">
                  {atlasGroups.map((group) => (
                    <NavigatorAccordion
                      key={group.id}
                      id={"source-" + group.id}
                      expanded={sourceGroupExpanded(group.id)}
                      onToggle={() =>
                        toggleOverride(
                          setSourceGroupOverrides,
                          group.id,
                          sourceGroupExpanded(group.id),
                        )
                      }
                      count={group.instruments.length}
                      label={
                        <span className="jurisdiction-label">
                          <JurisdictionMark jurisdictionId={group.markId} />
                          <span>{group.label}</span>
                        </span>
                      }
                    >
                      <div className="tree-instrument-list">
                        {group.instruments.map((instrument) => (
                          <button
                            type="button"
                            key={instrument.id}
                            className={
                              instrument.id === selectedInstrumentId ? "is-selected" : ""
                            }
                            aria-pressed={instrument.id === selectedInstrumentId}
                            aria-label={
                              instrument.shortTitle +
                              ", " +
                              (jurisdictionById.get(instrument.jurisdictionId)?.name ??
                                instrument.jurisdictionId) +
                              (forceClass(instrument) === "soft"
                                ? ", soft law"
                                : "")
                            }
                            onClick={() => onOpenInstrument(instrument.id)}
                          >
                            <span className="instrument-tree-title">
                              <JurisdictionMark
                                jurisdictionId={instrument.jurisdictionId}
                                small
                              />
                              {instrument.shortTitle}
                            </span>
                            <small className="instrument-tree-meta">
                              {forceClass(instrument) === "soft" && (
                                <strong>SOFT LAW</strong>
                              )}
                              <span>
                                {jurisdictionById.get(instrument.jurisdictionId)?.shortName ??
                                  instrument.jurisdictionId}
                              </span>
                            </small>
                          </button>
                        ))}
                      </div>
                    </NavigatorAccordion>
                  ))}

                  {selectedInstrument && selectedGroups.length > 0 && (
                    <section className="selected-article-tree">
                      <div className="selected-index-heading">
                        <span>{selectedInstrument.shortTitle} INDEX</span>
                        <small>
                          {provisionsByInstrument.get(selectedInstrument.id)?.length ?? 0}
                        </small>
                      </div>
                      {selectedGroups.map((group) => (
                        <NavigatorAccordion
                          key={group.id}
                          id={"article-" + selectedInstrument.id + "-" + group.id}
                          className="article-accordion"
                          expanded={articleGroupExpanded(group.id)}
                          onToggle={() =>
                            toggleOverride(
                              setArticleGroupOverrides,
                              group.id,
                              articleGroupExpanded(group.id),
                            )
                          }
                          count={group.provisions.length}
                          label={<span>{group.label}</span>}
                        >
                          <div className="tree-provision-list">
                            {group.provisions.map((provision) => (
                              <button
                                type="button"
                                key={provision.id}
                                className={
                                  provision.id === selectedProvisionId ? "is-selected" : ""
                                }
                                aria-pressed={provision.id === selectedProvisionId}
                                onClick={() => onOpenProvision(provision)}
                              >
                                <span>{provision.locator}</span>
                                <small>{provision.title}</small>
                              </button>
                            ))}
                          </div>
                        </NavigatorAccordion>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </>
          ) : normalizedQuery ? (
            <div className="search-results concept-search-results" aria-label="Concept search results">
              <p className="navigator-section-label">
                CONCEPT MATCHES / {matchingConcepts.length}
              </p>
              {matchingConcepts.map((result) => {
                const concept = conceptById.get(result.document.id);
                if (!concept) return null;
                return (
                  <button
                    type="button"
                    key={concept.id}
                    className={
                      concept.id === selectedConceptId ? "is-selected" : ""
                    }
                    aria-pressed={concept.id === selectedConceptId}
                    onClick={() => onOpenConcept(concept.id)}
                  >
                    <span className="concept-tree-title">
                      <ConceptIcon conceptId={concept.id} />
                      {concept.label}
                    </span>
                    <small>
                      {concept.description} · {result.reason}
                    </small>
                  </button>
                );
              })}
              {!matchingConcepts.length && (
                <p className="navigator-empty">No core-concept match.</p>
              )}
            </div>
          ) : (
            <div className="concept-tree">
              <div className="concept-index-note">
                <BrainCircuit aria-hidden="true" />
                <span>EDITORIAL CONCEPT INDEX</span>
                <p>Original synthesis informed by public professional bodies of knowledge.</p>
              </div>
              {conceptThemes.map((theme) => (
                <NavigatorAccordion
                  key={theme.id}
                  id={"concept-theme-" + theme.id}
                  expanded={conceptThemeExpanded(theme.id)}
                  onToggle={() =>
                    toggleOverride(
                      setConceptThemeOverrides,
                      theme.id,
                      conceptThemeExpanded(theme.id),
                    )
                  }
                  count={conceptsByTheme.get(theme.id)?.length ?? 0}
                  label={
                    <span className="concept-theme-label">
                      <ConceptThemeIcon themeId={theme.id} />
                      <span>{theme.label}</span>
                    </span>
                  }
                >
                  <div className="tree-concept-list">
                    {(conceptsByTheme.get(theme.id) ?? []).map((concept) => (
                      <button
                        type="button"
                        key={concept.id}
                        className={concept.id === selectedConceptId ? "is-selected" : ""}
                        aria-pressed={concept.id === selectedConceptId}
                        onClick={() => onOpenConcept(concept.id)}
                      >
                        <span className="concept-tree-title">
                          <ConceptIcon conceptId={concept.id} />
                          {concept.label}
                        </span>
                        <small>{concept.description}</small>
                      </button>
                    ))}
                  </div>
                </NavigatorAccordion>
              ))}
              <p className="concept-attribution">
                Informed by public IAPP CIPP/E, CIPM, CIPT and AIGP Bodies of Knowledge;
                not affiliated with or endorsed by IAPP.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="navigator-foot">
        <span>SNAPSHOT</span>
        <time dateTime="2026-07-20">2026.07.20</time>
      </div>
    </aside>
  );
}

function GlobalAtlas({
  onOpenInstrument,
}: {
  onOpenInstrument: (instrumentId: string) => void;
}) {
  const internationalFrameworkCount =
    atlasGroups.find((group) => group.id === "frameworks")?.instruments.length ?? 0;
  const softLawCount = instruments.filter(
    (instrument) => forceClass(instrument) === "soft",
  ).length;
  const legalSystemCount = atlasGroups.filter(
    (group) => group.id !== "frameworks",
  ).length;
  return (
    <section className="atlas-view" aria-labelledby="atlas-title">
      <div className="view-intro">
        <div>
          <p className="terminal-label">GLOBAL_REGULATORY_ATLAS / RESEARCH CORPUS</p>
          <h1 id="atlas-title">Comparative AI and data regulation corpus.</h1>
          <p>
            Browse primary legal sources, executive action, proposed legislation,
            standards and soft law through a versioned comparative index.
          </p>
        </div>
        <div className="corpus-readout" aria-label="Corpus status">
          <span><strong>{legalSystemCount}</strong> legal systems</span>
          <span><strong>{internationalFrameworkCount}</strong> international frameworks</span>
          <span><strong>{softLawCount}</strong> soft-law instruments</span>
          <span><strong>{instruments.length}</strong> instruments</span>
          <span><strong>{provisions.length}</strong> indexed provisions</span>
          <span><strong>{relations.length}</strong> qualified links</span>
          <span><strong>{concepts.length}</strong> core concepts</span>
        </div>
      </div>
      <NodeLegend />
      <div className="atlas-lanes">
        <div className="force-axis" aria-hidden="true">
          <span>JURISDICTION / AUTHORITY</span>
          <span>INSTRUMENT NODES →</span>
        </div>
        {atlasGroups.map((group, groupIndex) => (
          <section className="atlas-lane" key={group.id} data-atlas-group={group.id}>
            <header>
              <span className="lane-index">
                {String(groupIndex + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>
                  <JurisdictionMark jurisdictionId={group.markId} />
                  {group.label}
                </h2>
                <p>{group.description}</p>
              </div>
            </header>
            <div className="instrument-track">
              {group.instruments.map((instrument) => {
                const count =
                  provisionsByInstrument.get(instrument.id)?.length ?? 0;
                return (
                  <button
                    type="button"
                    key={instrument.id}
                    className={[
                      "instrument-node",
                      "force-" + forceClass(instrument),
                      "status-" + statusClass(instrument),
                    ].join(" ")}
                    onClick={() => onOpenInstrument(instrument.id)}
                    aria-label={
                      instrument.shortTitle +
                      ", " +
                      (jurisdictionById.get(instrument.jurisdictionId)
                        ?.shortName ?? instrument.jurisdictionId) +
                      ", " +
                      humanize(instrument.lifecycleStatus) +
                      (forceClass(instrument) === "soft"
                        ? ", soft law"
                        : "") +
                      ", " +
                      count +
                      " indexed provisions"
                    }
                  >
                    <span className="instrument-node-signal" aria-hidden="true" />
                    <span className="instrument-kind-icon" aria-hidden="true">
                      <InstrumentKindIcon instrument={instrument} />
                    </span>
                    <span className="instrument-node-heading">
                      <JurisdictionMark
                        jurisdictionId={instrument.jurisdictionId}
                        small
                      />
                      <strong>{instrument.shortTitle}</strong>
                    </span>
                    <span className="instrument-node-classification">
                      {forceClass(instrument) === "soft" && (
                        <strong>SOFT LAW</strong>
                      )}
                      {humanize(instrument.category)}
                    </span>
                    <small>
                      {humanize(instrument.lifecycleStatus)} · {count}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function CoreConceptExplorer({
  selectedConcept,
  onOpenConcept,
  onOpenInstrument,
  onOpenProvision,
}: {
  selectedConcept?: Concept;
  onOpenConcept: (conceptId: string) => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provision: Provision) => void;
}) {
  if (!selectedConcept) {
    const mappedConceptCount = concepts.filter((concept) => {
      const evidence = conceptEvidenceById.get(concept.id);
      return Boolean(evidence && evidence.instrumentIds.size > 0);
    }).length;
    return (
      <section className="concept-view" aria-labelledby="concept-index-title">
        <div className="concept-masthead">
          <div>
            <p className="terminal-label">CORE_CONCEPT_INDEX / EDITORIAL SYNTHESIS</p>
            <h1 id="concept-index-title">Core concepts for comparative analysis.</h1>
            <p>
              A controlled vocabulary for studying recurring privacy, data-governance,
              cybersecurity and AI-governance ideas across differently structured sources.
            </p>
          </div>
          <div className="concept-readout" aria-label="Concept index status">
            <span><strong>{conceptThemes.length}</strong> themes</span>
            <span><strong>{concepts.length}</strong> concepts</span>
            <span><strong>{mappedConceptCount}</strong> linked concepts</span>
            <span><strong>4</strong> public IAPP frameworks reviewed</span>
          </div>
        </div>
        <div className="academic-method-note">
          <Info aria-hidden="true" />
          <p>
            These project-authored summaries are analytical aids. A shared concept label
            does not establish legal equivalence, identical scope, or compliance.
          </p>
        </div>
        <div className="concept-theme-atlas">
          {conceptThemes.map((theme, themeIndex) => (
            <section className="concept-theme-lane" key={theme.id}>
              <header>
                <span className="lane-index">
                  {String(themeIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>
                    <ConceptThemeIcon themeId={theme.id} />
                    {theme.label}
                  </h2>
                  <p>{theme.summary}</p>
                </div>
              </header>
              <div className="concept-node-track">
                {(conceptsByTheme.get(theme.id) ?? []).map((concept) => {
                  const evidence = conceptEvidenceById.get(concept.id);
                  return (
                    <button
                      type="button"
                      className="concept-node"
                      key={concept.id}
                      onClick={() => onOpenConcept(concept.id)}
                    >
                      <span className="concept-node-heading">
                        <ConceptIcon conceptId={concept.id} />
                        <strong>{concept.label}</strong>
                      </span>
                      <span>{concept.description}</span>
                      <small>
                        {evidence?.instrumentIds.size ?? 0} sources ·{" "}
                        {evidence?.provisionIds.size ?? 0} provisions
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <p className="concept-corpus-attribution">
          Editorial synthesis informed by the public IAPP CIPP/E, CIPM, CIPT and AIGP
          Bodies of Knowledge; this project is not affiliated with or endorsed by IAPP.
        </p>
      </section>
    );
  }

  const theme = conceptThemeById.get(selectedConcept.theme);
  const evidence = conceptEvidenceById.get(selectedConcept.id) ?? {
    instrumentIds: new Set<string>(),
    provisionIds: new Set<string>(),
    relationIds: new Set<string>(),
  };
  const evidenceProvisions = Array.from(evidence.provisionIds)
    .map((id) => provisionMap.get(id))
    .filter((provision): provision is Provision => Boolean(provision));
  const evidenceInstruments = Array.from(evidence.instrumentIds)
    .map((id) => instrumentById.get(id))
    .filter((instrument): instrument is Instrument => Boolean(instrument))
    .sort((left, right) => {
      const leftGroup = atlasGroups.findIndex((group) =>
        group.instruments.some((instrument) => instrument.id === left.id),
      );
      const rightGroup = atlasGroups.findIndex((group) =>
        group.instruments.some((instrument) => instrument.id === right.id),
      );
      if (leftGroup !== rightGroup) return leftGroup - rightGroup;
      return left.shortTitle.localeCompare(right.shortTitle);
    });

  return (
    <section className="concept-view concept-detail" aria-labelledby="concept-title">
      <div className="concept-masthead">
        <div>
          <p className="terminal-label">
            <ConceptIcon conceptId={selectedConcept.id} />
            CORE_CONCEPT / {theme?.label ?? humanize(selectedConcept.theme)}
          </p>
          <h1 id="concept-title">{selectedConcept.label}</h1>
          <p>{selectedConcept.description}</p>
        </div>
        <div className="concept-readout" aria-label="Concept evidence status">
          <span><strong>{evidenceInstruments.length}</strong> linked sources</span>
          <span><strong>{evidenceProvisions.length}</strong> linked provisions</span>
          <span><strong>{evidence.relationIds.size}</strong> qualified relations</span>
          <span><strong>{selectedConcept.sourceBasis.length}</strong> source bases</span>
        </div>
      </div>

      <div className="concept-analysis-grid">
        <article className="concept-definition">
          <span className="terminal-label">HIGH-LEVEL SUMMARY</span>
          <p>{selectedConcept.summary}</p>
        </article>
        <article className="concept-scope-note">
          <span className="terminal-label">COMPARATIVE CAUTION</span>
          <p>
            The concept is a research bridge across sources. Definitions, regulated actors,
            thresholds, exceptions, remedies and legal effect must be checked in each text.
          </p>
          <div className="concept-aliases" aria-label="Related terminology">
            {selectedConcept.aliases.map((alias) => (
              <span key={alias}>{alias}</span>
            ))}
          </div>
        </article>
      </div>

      <section className="concept-source-section" aria-labelledby="concept-source-title">
        <div className="concept-section-heading">
          <div>
            <p className="terminal-label">LEGAL_SOURCE_EVIDENCE</p>
            <h2 id="concept-source-title">Indexed sources associated with this concept</h2>
          </div>
          <span>{evidenceInstruments.length} instrument records</span>
        </div>
        {evidenceInstruments.length ? (
          <div className="concept-source-map">
            {evidenceInstruments.map((instrument) => {
              const matchingProvisions = evidenceProvisions.filter(
                (provision) => provision.instrumentId === instrument.id,
              );
              const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
              return (
                <article className="concept-source-node" key={instrument.id}>
                  <button
                    type="button"
                    className="concept-instrument-link"
                    onClick={() => onOpenInstrument(instrument.id)}
                  >
                    <span>
                      <JurisdictionMark jurisdictionId={instrument.jurisdictionId} />
                      <strong>{instrument.shortTitle}</strong>
                    </span>
                    <small>
                      {jurisdiction?.name ?? instrument.jurisdictionId} ·{" "}
                      {humanize(instrument.legalForce)}
                    </small>
                  </button>
                  <p>{instrument.summary}</p>
                  {matchingProvisions.length > 0 && (
                    <div className="concept-provision-links">
                      {matchingProvisions.slice(0, 8).map((provision) => (
                        <button
                          type="button"
                          key={provision.id}
                          onClick={() => onOpenProvision(provision)}
                        >
                          <span>{provision.locator}</span>
                          <small>{provision.title}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="concept-no-evidence">
            <Info aria-hidden="true" />
            <p>
              The concept summary is available, but provision-level links have not yet been
              assigned in the current research corpus.
            </p>
          </div>
        )}
      </section>

      <section className="concept-bibliography" aria-labelledby="concept-bibliography-title">
        <div>
          <p className="terminal-label">PUBLIC_SOURCE_BASIS</p>
          <h2 id="concept-bibliography-title">Sources used for the editorial synthesis</h2>
        </div>
        <div className="concept-source-links">
          {selectedConcept.sourceBasis.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <span>{source.label}</span>
              <small>{source.accessedOn ? "Accessed " + source.accessedOn : "Official source"}</small>
              <ExternalLink aria-hidden="true" />
            </a>
          ))}
        </div>
        {selectedConcept.editorial.note && (
          <p className="concept-editorial-note">{selectedConcept.editorial.note}</p>
        )}
      </section>
    </section>
  );
}

function normalizedPreviewText(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function firstProvisionSentence(value: string | undefined, maximumLength = 300) {
  const text = normalizedPreviewText(value);
  if (!text) return "";
  const sentence = text.match(/^.*?(?:[.!?。！？](?=\s|$)|$)/u)?.[0] ?? text;
  if (sentence.length <= maximumLength) return sentence;
  const clipped = sentence.slice(0, maximumLength);
  const breakAt = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf("; "),
    clipped.lastIndexOf("。"),
    clipped.lastIndexOf(", "),
  );
  return (
    (breakAt >= 120 ? clipped.slice(0, breakAt + 1) : clipped)
      .replace(/\s+\S*$/u, "")
      .trimEnd() + "…"
  );
}

function isGenericProvisionHeading(provision: Provision) {
  const title = normalizedPreviewText(provision.title);
  const locator = normalizedPreviewText(provision.locator);
  return (
    title.toLowerCase() === locator.toLowerCase() ||
    /^(?:article|section|rule|regulation|point|item|schedule)\s+[\w.()-]+$/iu.test(
      title,
    )
  );
}

function isTranslationAuthoritySummary(value: string | undefined) {
  const text = normalizedPreviewText(value).toLowerCase();
  return (
    /complete (?:official|authoritative).*(?:text|wording).*(?:stored|available)/u.test(
      text,
    ) ||
    /government-published english reference translation/u.test(text) ||
    /project-authored english reference/u.test(text) ||
    /english text is not co-authentic/u.test(text) ||
    /this article is mapped to/u.test(text) ||
    /orientation is not a translation/u.test(text) ||
    /official .* wording is available/u.test(text) ||
    /toàn văn .*chính thức.*(?:lưu|đầy đủ)/u.test(text)
  );
}

function provisionEditorialPreview(provision: Provision) {
  const summary = normalizedPreviewText(provision.summary);
  const firstSourceParagraph = normalizedPreviewText(provision.paragraphs?.[0]);
  const sourceExcerptUsedAsSummary = Boolean(
    firstSourceParagraph &&
      summary === firstSourceParagraph &&
      !/^en(?:-|$)/iu.test(provision.textAvailability.language),
  );
  const derived =
    isGenericProvisionHeading(provision) ||
    isTranslationAuthoritySummary(summary) ||
    sourceExcerptUsedAsSummary ||
    (!provision.fullText &&
      !/^en(?:-|$)/iu.test(provision.textAvailability.language));
  if (!derived) return { text: summary, derived: false };

  const englishText =
    provision.translations?.en?.paragraphs?.[0] ??
    provision.translations?.en?.fullText ??
    (/^en(?:-|$)/iu.test(provision.textAvailability.language)
      ? provision.paragraphs?.[0] ?? provision.fullText
      : undefined);
  return {
    text: firstProvisionSentence(englishText) || summary,
    derived: true,
  };
}

function InstrumentGenome({
  instrument,
  onOpenProvision,
  onOpenInstrument,
}: {
  instrument: Instrument;
  onOpenProvision: (provision: Provision) => void;
  onOpenInstrument: (instrumentId: string) => void;
}) {
  const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
  const sourceAudit = sourceAuditByInstrument.get(instrument.id);
  const groups = groupInstrumentProvisions(instrument.id);
  const instrumentProvisions = provisionsByInstrument.get(instrument.id) ?? [];
  const sourceTextIds = sourceTextIdsByInstrument.get(instrument.id) ?? new Set();
  const sourceTextUnitCount = sourceTextIds.size;
  const analyticalAnchorCount = instrumentProvisions.filter(
    (provision) => !sourceTextIds.has(provision.id),
  ).length;
  const sourceUnitLabel = sourceAudit?.localCoverage.mode.includes("official")
    ? "official source-text units"
    : "locally stored source-text units";
  const instrumentLinks = (relationsByInstrument.get(instrument.id) ?? [])
    .map((relation) => {
      const endpoint = otherInstrumentEndpoint(relation, instrument.id);
      const related = endpoint ? instrumentById.get(endpoint.id) : undefined;
      return related ? { relation, related } : null;
    })
    .filter(
      (item): item is { relation: Relation; related: Instrument } =>
        Boolean(item),
    );

  return (
    <section className="instrument-view" aria-labelledby="instrument-title">
      <div className="instrument-masthead">
        <div>
          <p className="terminal-label">
            <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
            INSTRUMENT_GENOME / {jurisdiction?.shortName ?? instrument.jurisdictionId}
          </p>
          <h1 id="instrument-title">{instrument.shortTitle}</h1>
          <p className="bilingual-instrument-title">
            <span>{instrument.title}</span>
            {instrument.originalTitle && (
              <span lang={instrument.textAvailability.language}>
                {instrument.originalTitle}
              </span>
            )}
          </p>
        </div>
        <div className="instrument-readout">
          <span className={"status-chip status-" + statusClass(instrument)}>
            {humanize(instrument.lifecycleStatus)}
          </span>
          <span>{humanize(instrument.legalForce)}</span>
          <span>{sourceTextUnitCount} {sourceUnitLabel}</span>
          {analyticalAnchorCount > 0 && (
            <span>{analyticalAnchorCount} analytical anchors</span>
          )}
          <span>Version {instrument.version}</span>
        </div>
      </div>
      <div className="instrument-context">
        <p>{instrument.summary}</p>
        <dl>
          <div>
            <dt>Issued by</dt>
            <dd>{instrument.issuingBodies.join(", ")}</dd>
          </div>
          <div>
            <dt>Effective</dt>
            <dd>{formatDate(instrument.dates.effectiveFrom)}</dd>
          </div>
          <div>
            <dt>General application</dt>
            <dd>{formatDate(instrument.dates.generalApplicationFrom)}</dd>
          </div>
          {instrument.dates.lastAmendedOn && (
            <div>
              <dt>Last amended</dt>
              <dd>{formatDate(instrument.dates.lastAmendedOn)}</dd>
            </div>
          )}
          {instrument.dates.latestAmendmentEffectiveFrom && (
            <div>
              <dt>Current text effective</dt>
              <dd>
                {formatDate(instrument.dates.latestAmendmentEffectiveFrom)}
              </dd>
            </div>
          )}
          <div>
            <dt>Text access</dt>
            <dd>{humanize(instrument.textAvailability.mode)}</dd>
          </div>
          <div>
            <dt>Indexed composition</dt>
            <dd>
              {sourceTextUnitCount} source-text units + {analyticalAnchorCount}{" "}
              analytical anchors
            </dd>
          </div>
        </dl>
      </div>

      {sourceAudit && (
        <div
          className="instrument-corpus-profile"
          aria-label="Local corpus coverage and redistribution status"
        >
          <section className="instrument-corpus-disclosure">
            <span className="terminal-label">LOCAL_CORPUS_COVERAGE</span>
            <strong>{humanize(sourceAudit.localCoverage.mode)}</strong>
            <div className="instrument-corpus-counts" aria-label="Indexed corpus composition">
              <span>
                <b>{sourceTextUnitCount}</b>
                {sourceUnitLabel}
              </span>
              <span>
                <b>{analyticalAnchorCount}</b>
                analytical {analyticalAnchorCount === 1 ? "anchor" : "anchors"}
              </span>
            </div>
            <p>{sourceAudit.localCoverage.statement}</p>
            {instrument.textAvailability.note && (
              <p>{instrument.textAvailability.note}</p>
            )}
          </section>
          {sourceAudit.rightsBoundary && (
            <section className="instrument-corpus-disclosure is-rights-boundary">
              <span className="terminal-label">RIGHTS / REDISTRIBUTION</span>
              <strong>
                {humanize(sourceAudit.rightsBoundary.projectLicenseBoundary)}
              </strong>
              <p>{sourceAudit.rightsBoundary.note}</p>
            </section>
          )}
        </div>
      )}

      {instrumentLinks.length > 0 && (
        <div className="instrument-relations" aria-label="Instrument-level links">
          <span>INSTRUMENT_LINKS</span>
          {instrumentLinks.map(({ relation, related }) => (
            <button
              type="button"
              key={relation.id}
              onClick={() => onOpenInstrument(related.id)}
            >
              <small>
                {relationDirectionMarker(relation, instrument.id)}{" "}
                {relationLabels[relation.type] ?? humanize(relation.type)}
              </small>
              <strong>{related.shortTitle}</strong>
              <span>{humanize(relation.status)}</span>
            </button>
          ))}
        </div>
      )}

      {groups.length ? (
        <div className="genome">
          {groups.map((group, groupIndex) => {
            const sections = groupProvisionSections(group.provisions);
            return (
            <section className="genome-chapter" key={group.id}>
              <header>
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div>
                  <p>{group.label}</p>
                  <h2>{group.title}</h2>
                </div>
                <small>
                  {group.provisions.length}{" "}
                  {provisionUnitLabel(group.provisions).toLowerCase()}
                </small>
              </header>
              <div className="genome-sections">
                {sections.map((section) => {
                  const overview = sectionOverview(instrument.id, section);
                  return (
                  <section className="genome-section" key={section.id}>
                    {(sections.length > 1 ||
                      !["chapter-root", "indexed-provisions"].includes(
                        section.id,
                      )) && (
                      <header>
                        <span>{section.label}</span>
                        <strong>{section.title}</strong>
                      </header>
                    )}
                    <div
                      className={
                        overview.reviewed
                          ? "section-overview"
                          : "section-overview is-generated"
                      }
                    >
                      <span>
                        <Info aria-hidden="true" />
                        {overview.label}
                      </span>
                      <p>{overview.summary}</p>
                    </div>
                    <ol
                      className="provision-list"
                      aria-label={
                        section.title +
                        " " +
                        provisionUnitLabel(section.provisions).toLowerCase()
                      }
                    >
                      {section.provisions.map((provision) => {
                        const mappingCount =
                          relationsByProvision.get(provision.id)?.length ?? 0;
                        const conceptCount = provision.conceptIds.length;
                        const isTopicRelevant =
                          provision.topicRelevance.relevance ===
                          "substantive-topic";
                        const editorialPreview =
                          provisionEditorialPreview(provision);
                        return (
                          <li key={provision.id}>
                          <button
                            type="button"
                            className={[
                              "provision-list-item",
                              mappingCount ? "has-mappings" : "",
                              isTopicRelevant ? "is-topic-relevant" : "",
                            ].filter(Boolean).join(" ")}
                            data-topic-relevance={
                              provision.topicRelevance.relevance
                            }
                            onClick={() => onOpenProvision(provision)}
                            aria-label={
                              provision.locator +
                              ", " +
                              provision.title +
                              ", " +
                              (isTopicRelevant
                                ? "topic relevant, " +
                                  conceptCount +
                                  " core concepts, "
                                : "structural context, ") +
                              mappingCount +
                              " mapped provisions"
                            }
                          >
                            <span className="provision-list-locator">
                              {provision.locator}
                            </span>
                            <span className="provision-list-copy">
                              <strong>{provision.title}</strong>
                              {provision.originalTitle && (
                                <span lang={provision.textAvailability.language}>
                                  {provision.originalTitle}
                                </span>
                              )}
                              <small>
                                {editorialPreview.derived && (
                                  <span>Editorial preview · </span>
                                )}
                                {editorialPreview.text}
                              </small>
                            </span>
                            <span className="provision-list-signals" aria-hidden="true">
                              {conceptCount > 0 && (
                                <span className="provision-list-concepts">
                                  <BrainCircuit aria-hidden="true" />
                                  {conceptCount}
                                </span>
                              )}
                              <span className="provision-list-mappings">
                                <Network aria-hidden="true" />
                                {mappingCount}
                              </span>
                            </span>
                          </button>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                  );
                })}
              </div>
            </section>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span>PROVISION_TEXT_NOT_IN_CORPUS</span>
          <h2>Provision-level text is not included in the current corpus.</h2>
          <p>
            The instrument record includes official status and source metadata,
            but its provision hierarchy has not yet been incorporated.
          </p>
          <a href={instrument.source.url} target="_blank" rel="noreferrer">
            Open official source ↗
          </a>
        </div>
      )}
    </section>
  );
}

type InstrumentConceptCluster = {
  concept: Concept;
  provisions: Provision[];
};

function InstrumentConnectionCanvas({
  instrument,
  onOpenProvision,
  onOpenConcept,
}: {
  instrument: Instrument;
  onOpenProvision: (provision: Provision) => void;
  onOpenConcept: (conceptId: string) => void;
}) {
  const instrumentProvisions = provisionsByInstrument.get(instrument.id) ?? [];
  const clusterMap = new Map<string, InstrumentConceptCluster>();

  instrument.topicIds.forEach((conceptId) => {
    const concept = conceptById.get(conceptId);
    if (concept) clusterMap.set(conceptId, { concept, provisions: [] });
  });
  instrumentProvisions.forEach((provision) => {
    provision.conceptIds.forEach((conceptId) => {
      const concept = conceptById.get(conceptId);
      if (!concept) return;
      const cluster = clusterMap.get(conceptId) ?? { concept, provisions: [] };
      if (!cluster.provisions.some((candidate) => candidate.id === provision.id)) {
        cluster.provisions.push(provision);
      }
      clusterMap.set(conceptId, cluster);
    });
  });

  const clusters = Array.from(clusterMap.values()).sort((left, right) =>
    right.provisions.length - left.provisions.length ||
    left.concept.label.localeCompare(right.concept.label),
  );
  const mappedProvisionCount = new Set(
    clusters.flatMap((cluster) => cluster.provisions.map((provision) => provision.id)),
  ).size;
  const visibleClusters = clusters.slice(0, 8);
  const overflowClusters = clusters.slice(8);

  function renderCluster(cluster: InstrumentConceptCluster, compact = false) {
    const visibleProvisions = cluster.provisions.slice(0, compact ? 5 : 8);
    const overflowProvisions = cluster.provisions.slice(visibleProvisions.length);
    return (
      <article
        className={[
          "instrument-concept-cluster",
          compact ? "is-compact" : "",
        ].filter(Boolean).join(" ")}
        key={cluster.concept.id}
      >
        <button
          type="button"
          className="instrument-concept-node"
          onClick={() => onOpenConcept(cluster.concept.id)}
          aria-label={
            cluster.concept.label +
            ", core concept linked to " +
            cluster.provisions.length +
            " indexed provisions"
          }
        >
          <span>
            <ConceptIcon conceptId={cluster.concept.id} />
            CORE CONCEPT
          </span>
          <strong>{cluster.concept.label}</strong>
          <small>{cluster.provisions.length} linked articles</small>
        </button>
        <div
          className="instrument-article-branch"
          aria-label={cluster.concept.label + " linked provisions"}
        >
          {visibleProvisions.map((provision) => (
            <button
              type="button"
              className="instrument-article-node"
              onClick={() => onOpenProvision(provision)}
              key={provision.id}
              aria-label={
                instrument.shortTitle +
                " " +
                provision.locator +
                ", " +
                provision.title
              }
            >
              <strong>{provision.locator}</strong>
              <span>{provision.title}</span>
            </button>
          ))}
          {overflowProvisions.length > 0 && (
            <details className="instrument-article-overflow">
              <summary>+{overflowProvisions.length} MORE ARTICLES</summary>
              <div>
                {overflowProvisions.map((provision) => (
                  <button
                    type="button"
                    className="instrument-article-node"
                    onClick={() => onOpenProvision(provision)}
                    key={provision.id}
                  >
                    <strong>{provision.locator}</strong>
                    <span>{provision.title}</span>
                  </button>
                ))}
              </div>
            </details>
          )}
          {!cluster.provisions.length && (
            <span className="instrument-cluster-empty">
              Instrument-level concept; no provision node is indexed yet.
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <section
      className="connections-view instrument-connections-view"
      aria-labelledby="instrument-connections-title"
    >
      <div className="connections-header">
        <div>
          <p className="terminal-label">INSTRUMENT_KNOWLEDGE_GRAPH</p>
          <h1 id="instrument-connections-title">
            <span className="connection-title-instrument">
              {instrument.shortTitle}
            </span>
            <span className="connection-title-locator">Concept map</span>
          </h1>
          <p>Law → core concept → indexed Article</p>
        </div>
        <div className="connection-readout">
          <span><BrainCircuit aria-hidden="true" />{clusters.length} concepts</span>
          <span><BookOpenText aria-hidden="true" />{mappedProvisionCount} mapped articles</span>
          <span><Database aria-hidden="true" />{instrumentProvisions.length} indexed provisions</span>
          <span><Scale aria-hidden="true" />{humanize(instrument.legalForce)}</span>
        </div>
      </div>

      {clusters.length ? (
        <div
          className="instrument-knowledge-network"
          role="group"
          aria-label={instrument.shortTitle + " concepts and linked provisions"}
        >
          <div className="instrument-knowledge-anchor">
            <span>
              <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
              INSTRUMENT
            </span>
            <strong>{instrument.shortTitle}</strong>
            {forceClass(instrument) === "soft" && <small>SOFT LAW</small>}
          </div>
          <div className="instrument-concept-clusters">
            {visibleClusters.map((cluster) => renderCluster(cluster))}
          </div>
          {overflowClusters.length > 0 && (
            <details className="instrument-cluster-overflow">
              <summary>
                +{overflowClusters.length} ADDITIONAL CONCEPT CLUSTERS
              </summary>
              <div>
                {overflowClusters.map((cluster) => renderCluster(cluster, true))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="empty-state graph-empty">
          <span>NO_CONCEPT_CLASSIFICATION</span>
          <h2>No concept-to-Article classification is recorded yet.</h2>
          <p>
            The legal source remains available in the center column while the
            research graph is expanded.
          </p>
        </div>
      )}
    </section>
  );
}

function ConnectionCanvas({
  anchor,
  selectedRelationId,
  onOpenProvision,
  onOpenInstrument,
  onOpenConcept,
}: {
  anchor: Provision;
  selectedRelationId: string | null;
  onOpenProvision: (provision: Provision, relationId?: string) => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenConcept: (conceptId: string) => void;
}) {
  const anchorInstrument = instrumentById.get(anchor.instrumentId)!;
  const connections = (relationsByProvision.get(anchor.id) ?? [])
    .map((relation) => {
      const endpoint = otherRelationEndpoint(relation, anchor.id);
      const relatedProvision =
        endpoint?.type === "provision"
          ? provisionMap.get(endpoint.id)
          : undefined;
      const relatedInstrument = relatedProvision
        ? instrumentById.get(relatedProvision.instrumentId)
        : endpoint?.type === "instrument"
          ? instrumentById.get(endpoint.id)
          : undefined;
      return relatedInstrument
        ? { relation, relatedProvision, relatedInstrument }
        : null;
    })
    .filter(
      (
        item,
      ): item is {
        relation: Relation;
        relatedProvision: Provision | undefined;
        relatedInstrument: Instrument;
      } => Boolean(item),
    )
    .sort((left, right) => {
      return [
        left.relatedInstrument.jurisdictionId,
        left.relatedInstrument.shortTitle,
        left.relatedProvision?.locator ?? "",
      ]
        .join("-")
        .localeCompare(
          [
            right.relatedInstrument.jurisdictionId,
            right.relatedInstrument.shortTitle,
            right.relatedProvision?.locator ?? "",
          ].join("-"),
          undefined,
          { numeric: true },
        );
  });
  const visible = connections.slice(0, 6);
  const overflowConnections = connections.slice(visible.length);
  const conceptConnections = anchor.conceptIds
    .map((conceptId) => conceptById.get(conceptId))
    .filter((concept): concept is Concept => Boolean(concept));
  const visibleConcepts = conceptConnections.slice(0, 4);
  const overflowConcepts = conceptConnections.slice(visibleConcepts.length);
  const positions = visible.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / visible.length;
    return {
      x: 50 + Math.cos(angle) * 34,
      y: 50 + Math.sin(angle) * 35,
      svgX: 500 + Math.cos(angle) * 340,
      svgY: 310 + Math.sin(angle) * 214,
    };
  });
  const conceptPositions = visibleConcepts.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / visibleConcepts.length;
    return {
      x: 50 + Math.cos(angle) * 25,
      y: 50 + Math.sin(angle) * 26,
      svgX: 500 + Math.cos(angle) * 250,
      svgY: 310 + Math.sin(angle) * 160,
    };
  });

  return (
    <section className="connections-view" aria-labelledby="connections-title">
      <div className="connections-header">
        <div>
          <p className="terminal-label">ONE_HOP_PROVISION_NEIGHBORHOOD</p>
          <h1 id="connections-title">
            <span className="connection-title-instrument">
              {anchorInstrument.shortTitle}
            </span>
            <span className="connection-title-locator">{anchor.locator}</span>
          </h1>
          <p>{anchor.title}</p>
        </div>
        <div className="connection-readout">
          <span><Link2 aria-hidden="true" />{connections.length} direct links</span>
          <span>
            <Sparkles aria-hidden="true" />
            {connections.filter(({ relation }) => relation.status === "editorial-reviewed").length}{" "}
            reviewed ·{" "}
            {connections.filter(({ relation }) => relation.status === "candidate").length}{" "}
            candidate
          </span>
          <span><Database aria-hidden="true" />{anchor.conceptIds.length} concepts</span>
          <span><Scale aria-hidden="true" />{humanize(anchor.legalEffectStatus)}</span>
        </div>
      </div>

      {visible.length || visibleConcepts.length ? (
        <>
          <div
            className="connection-canvas"
            role="group"
            aria-label={
              anchorInstrument.shortTitle +
              " " +
              anchor.locator +
              " and its directly mapped provisions"
            }
          >
            <svg
              className="connection-lines"
              viewBox="0 0 1000 620"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id="relation-arrowhead"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path className="relation-arrow-marker" d="M 0 0 L 8 4 L 0 8 z" />
                </marker>
              </defs>
              <circle className="graph-origin-ring ring-one" cx="500" cy="310" r="58" />
              <circle className="graph-origin-ring ring-two" cx="500" cy="310" r="92" />
              {visible.map((item, index) => {
                const position = positions[index];
                const midX = 500 + (position.svgX - 500) * 0.52;
                const midY = 310 + (position.svgY - 310) * 0.52;
                const bend = index % 2 === 0 ? 20 : -20;
                const path =
                  "M 500 310 Q " +
                  (midX + bend) +
                  " " +
                  (midY - bend) +
                  " " +
                  position.svgX +
                  " " +
                  position.svgY;
                const selected = item.relation.id === selectedRelationId;
                return (
                  <g key={item.relation.id}>
                    <path
                      d={path}
                      pathLength={100}
                      style={{ animationDelay: String(index * 70) + "ms" }}
                      className={[
                        "relation-line",
                        "relation-" + item.relation.type,
                        "mapping-" + item.relation.status,
                        selected ? "is-selected" : "",
                      ].join(" ")}
                      markerEnd={
                        item.relation.directionality === "directed" &&
                        item.relation.source.id === anchor.id
                          ? "url(#relation-arrowhead)"
                          : undefined
                      }
                      markerStart={
                        item.relation.directionality === "directed" &&
                        item.relation.target.id === anchor.id
                          ? "url(#relation-arrowhead)"
                          : undefined
                      }
                    />
                    {selected && (
                      <path
                        d={path}
                        pathLength={100}
                        className="relation-flow"
                        aria-hidden="true"
                      />
                    )}
                    <circle
                      className="relation-terminal"
                      cx={position.svgX}
                      cy={position.svgY}
                      r="4"
                      style={{ animationDelay: String(480 + index * 70) + "ms" }}
                    />
                  </g>
                );
              })}
              {visibleConcepts.map((concept, index) => {
                const position = conceptPositions[index];
                const path =
                  "M 500 310 L " + position.svgX + " " + position.svgY;
                return (
                  <g key={"concept-edge-" + concept.id}>
                    <path
                      d={path}
                      pathLength={100}
                      className="concept-relation-line"
                      style={{ animationDelay: String(120 + index * 70) + "ms" }}
                    />
                    <circle
                      className="concept-relation-terminal"
                      cx={position.svgX}
                      cy={position.svgY}
                      r="4"
                      style={{ animationDelay: String(520 + index * 70) + "ms" }}
                    />
                  </g>
                );
              })}
            </svg>

            <button
              type="button"
              className={[
                "connection-node",
                "anchor-node",
                "force-" + forceClass(anchorInstrument),
              ].join(" ")}
              style={{ left: "50%", top: "50%" }}
              onClick={() => onOpenProvision(anchor)}
              aria-label={
                "Anchor: " +
                anchorInstrument.shortTitle +
                " " +
                anchor.locator +
                ", " +
                (jurisdictionById.get(anchorInstrument.jurisdictionId)?.name ??
                  anchorInstrument.jurisdictionId)
              }
            >
              <span className="connection-node-kicker">
                <JurisdictionMark
                  jurisdictionId={anchorInstrument.jurisdictionId}
                  small
                />
                <span>ANCHOR</span>
              </span>
              <strong>{anchorInstrument.shortTitle}</strong>
              <small>{anchor.locator}</small>
            </button>

            {visibleConcepts.map((concept, index) => {
              const position = conceptPositions[index];
              return (
                <button
                  type="button"
                  key={"concept-" + concept.id}
                  className="connection-node concept-connection-node"
                  style={{
                    left: String(position.x) + "%",
                    top: String(position.y) + "%",
                    animationDelay: String(340 + index * 65) + "ms",
                  }}
                  onClick={() => onOpenConcept(concept.id)}
                  aria-label={
                    "Core concept linked by topical classification: " +
                    concept.label
                  }
                >
                  <span className="connection-node-kicker">
                    <ConceptIcon conceptId={concept.id} />
                    <span>CORE CONCEPT</span>
                  </span>
                  <strong>{concept.label}</strong>
                  <small>TOPIC_RELATION</small>
                </button>
              );
            })}

            {visible.map((item, index) => {
              const instrument = item.relatedInstrument;
              const position = positions[index];
              const relationLabel =
                relationLabels[item.relation.type] ??
                humanize(item.relation.type);
              const targetLabel =
                item.relatedProvision?.locator ?? "Instrument record";
              return (
                <button
                  type="button"
                  key={item.relation.id}
                  className={[
                    "connection-node",
                    "force-" + forceClass(instrument),
                    "status-" + statusClass(instrument),
                    "mapping-" + item.relation.status,
                    item.relation.id === selectedRelationId
                      ? "is-selected"
                      : "",
                  ].join(" ")}
                  style={{
                    left: String(position.x) + "%",
                    top: String(position.y) + "%",
                    animationDelay: String(280 + index * 65) + "ms",
                  }}
                  onClick={() => {
                    if (item.relatedProvision) {
                      onOpenProvision(item.relatedProvision, item.relation.id);
                    } else {
                      onOpenInstrument(instrument.id);
                    }
                  }}
                  aria-label={
                    instrument.shortTitle +
                    " " +
                    targetLabel +
                    ", " +
                    (jurisdictionById.get(instrument.jurisdictionId)?.name ??
                      instrument.jurisdictionId) +
                    ", " +
                    humanize(instrument.lifecycleStatus) +
                    ", " +
                    relationDirectionMarker(item.relation, anchor.id) +
                    " " +
                    relationLabel
                  }
                >
                  <span className="connection-node-kicker">
                    <JurisdictionMark
                      jurisdictionId={instrument.jurisdictionId}
                      small
                    />
                    <span>
                      {relationDirectionMarker(item.relation, anchor.id)}{" "}
                      {relationLabel}
                    </span>
                  </span>
                  <strong>{instrument.shortTitle}</strong>
                  <small>{targetLabel}</small>
                </button>
              );
            })}
          </div>
          {(overflowConnections.length > 0 || overflowConcepts.length > 0) && (
            <details className="graph-overflow-list">
              <summary>
                OPEN ALL RELATION NODES · {overflowConnections.length} mappings ·{" "}
                {overflowConcepts.length} concepts
              </summary>
              <div>
                {overflowConcepts.map((concept) => (
                  <button
                    type="button"
                    key={"overflow-concept-" + concept.id}
                    onClick={() => onOpenConcept(concept.id)}
                  >
                    <span>
                      <ConceptIcon conceptId={concept.id} />
                      CORE CONCEPT
                    </span>
                    <strong>{concept.label}</strong>
                  </button>
                ))}
                {overflowConnections.map((item) => {
                  const relationLabel =
                    relationLabels[item.relation.type] ??
                    humanize(item.relation.type);
                  const targetLabel =
                    item.relatedProvision?.locator ?? "Instrument record";
                  return (
                    <button
                      type="button"
                      key={"overflow-relation-" + item.relation.id}
                      onClick={() => {
                        if (item.relatedProvision) {
                          onOpenProvision(item.relatedProvision, item.relation.id);
                        } else {
                          onOpenInstrument(item.relatedInstrument.id);
                        }
                      }}
                    >
                      <span>
                        <JurisdictionMark
                          jurisdictionId={item.relatedInstrument.jurisdictionId}
                          small
                        />
                        {relationDirectionMarker(item.relation, anchor.id)}{" "}
                        {relationLabel}
                      </span>
                      <strong>
                        {item.relatedInstrument.shortTitle} {targetLabel}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="empty-state graph-empty">
          <span>NO_RECORDED_RELATION</span>
          <h2>No reviewed relation is recorded for this provision.</h2>
          <p>
            This indicates a gap in the current research corpus; it does not
            establish that no relationship exists.
          </p>
        </div>
      )}
    </section>
  );
}

function LineageTimeline({ instrument }: { instrument: Instrument }) {
  const events = instrumentEvents(instrument);
  const currentEvent = events
    .filter((event) => event.date <= instrument.statusAsOf)
    .at(-1);
  return (
    <section className="timeline-view" aria-labelledby="timeline-title">
      <div className="timeline-header">
        <div>
          <p className="terminal-label">STATUS_LINEAGE / VERSION CONTROL</p>
          <h1 id="timeline-title">{instrument.shortTitle}</h1>
          <p>{instrument.statusNote}</p>
        </div>
        <span className={"status-chip status-" + statusClass(instrument)}>
          {humanize(instrument.lifecycleStatus)}
        </span>
      </div>
      <div className="timeline-axis" aria-label="Instrument status timeline">
        {events.map((event) => {
          const isFuture = event.date > instrument.statusAsOf;
          return (
          <article
            key={event.id}
            className={[
              "timeline-event",
              event.id === currentEvent?.id ? "is-latest" : "",
              isFuture ? "is-future" : "",
            ].join(" ")}
          >
            <time dateTime={event.date}>{formatDate(event.date)}</time>
            <span className="event-marker" aria-hidden="true" />
            <div>
              <small>
                {isFuture ? "SCHEDULED / " : ""}
                {humanize(event.type)}
              </small>
              <h2>{event.label}</h2>
              <p>{event.effect}</p>
              <a href={event.source.url} target="_blank" rel="noreferrer">
                {event.source.label} ↗
              </a>
            </div>
          </article>
          );
        })}
      </div>
      <div className="today-rule">
        <span>OBSERVED_AT</span>
        <time dateTime={instrument.statusAsOf}>
          {formatDate(instrument.statusAsOf)}
        </time>
        <strong>{humanize(instrument.lifecycleStatus)}</strong>
      </div>
    </section>
  );
}

function CompareView({
  compareIds,
  onRemove,
}: {
  compareIds: string[];
  onRemove: (provisionId: string) => void;
}) {
  const compared = compareIds
    .map((id) => provisionMap.get(id))
    .filter((provision): provision is Provision => Boolean(provision));
  const directRelation =
    compared.length === 2
      ? relations.find((relation) => {
          const endpoints = [relation.source.id, relation.target.id];
          return (
            endpoints.includes(compared[0].id) &&
            endpoints.includes(compared[1].id)
          );
        })
      : undefined;

  return (
    <section className="compare-view" aria-labelledby="compare-title">
      <div className="compare-header">
        <div>
          <p className="terminal-label">COMPARE_LAB / PROVISION LEVEL</p>
          <h1 id="compare-title">Cross-regime analysis</h1>
        </div>
        {directRelation && (
          <span className="relation-pill">
            {relationLabels[directRelation.type] ??
              humanize(directRelation.type)}
          </span>
        )}
      </div>
      {compared.length < 2 ? (
        <div className="empty-state">
          <span>COMPARE_SLOT_{compared.length + 1}_EMPTY</span>
          <h2>Add one more provision.</h2>
          <p>
            Use the reader to pin two provisions. The comparison preserves
            differences in force, scope and source status.
          </p>
        </div>
      ) : (
        <>
          {directRelation && (
            <div className="compare-rationale">
              <span>
                {relationDirectionMarker(directRelation, compared[0].id)} MAPPING
                / {humanize(directRelation.status)} / {directRelation.confidence}
              </span>
              <p>{directRelation.rationale}</p>
              <small>LIMITS / {directRelation.limits}</small>
              <small>
                EVIDENCE / {humanize(directRelation.evidenceBasis)} · verified{" "}
                {formatDate(directRelation.verifiedOn)}
              </small>
            </div>
          )}
          <div className="compare-columns">
            {compared.map((provision) => {
              const instrument = instrumentById.get(provision.instrumentId)!;
              const jurisdiction = jurisdictionById.get(
                instrument.jurisdictionId,
              );
              const comparisonParagraphs = provision.translations?.en?.paragraphs ??
                (!/^en(?:-|$)/i.test(provision.textAvailability.language)
                  ? [provision.summary]
                  : provision.paragraphs);
              return (
                <article key={provision.id} className="compare-column">
                  <header>
                    <div>
                      <span>
                        <JurisdictionMark
                          jurisdictionId={instrument.jurisdictionId}
                          small
                        />
                        {jurisdiction?.shortName}
                      </span>
                      <h2>
                        {instrument.shortTitle} {provision.locator}
                      </h2>
                      <p>{provision.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(provision.id)}
                      aria-label={"Remove " + provision.locator + " from compare"}
                    >
                      REMOVE
                    </button>
                  </header>
                  <dl className="compare-dimensions">
                    <div>
                      <dt>Legal force</dt>
                      <dd>{humanize(instrument.legalForce)}</dd>
                    </div>
                    <div>
                      <dt>Instrument status</dt>
                      <dd>{humanize(instrument.lifecycleStatus)}</dd>
                    </div>
                    <div>
                      <dt>Provision effect</dt>
                      <dd>{humanize(provision.legalEffectStatus)}</dd>
                    </div>
                    <div>
                      <dt>Applies from</dt>
                      <dd>{formatDate(provision.appliesFrom)}</dd>
                    </div>
                    <div>
                      <dt>Actors</dt>
                      <dd>{provision.actorTags.join(", ") || "Not tagged"}</dd>
                    </div>
                    <div>
                      <dt>Scope</dt>
                      <dd>{provision.scopeTags.join(", ") || "Not tagged"}</dd>
                    </div>
                    <div>
                      <dt>Concepts</dt>
                      <dd>
                        {provision.conceptIds
                          .map((id) => conceptById.get(id)?.label ?? id)
                          .join(", ") || "Not tagged"}
                      </dd>
                    </div>
                  </dl>
                  <div className="compare-text">
                    {comparisonParagraphs?.length ? (
                      comparisonParagraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))
                    ) : (
                      <p>{provision.summary}</p>
                    )}
                  </div>
                  <a
                    href={provision.source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Verify official source ↗
                  </a>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function ProvisionReader({
  instrument,
  provision,
  selectedRelation,
  relationsForProvision,
  readerTab,
  compareIds,
  onSetTab,
  onSelectRelation,
  onOpenProvision,
  onOpenInstrument,
  onOpenConcept,
  onAddCompare,
  readerLanguagePreference,
  onSetReaderLanguagePreference,
  id,
  className,
}: {
  instrument?: Instrument;
  provision?: Provision;
  selectedRelation?: Relation;
  relationsForProvision: Relation[];
  readerTab: ReaderTab;
  compareIds: string[];
  onSetTab: (tab: ReaderTab) => void;
  onSelectRelation: (relationId: string) => void;
  onOpenProvision: (provision: Provision, relationId?: string) => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenConcept: (conceptId: string) => void;
  onAddCompare: (provisionId: string) => void;
  readerLanguagePreference: string;
  onSetReaderLanguagePreference: (language: string) => void;
  id?: string;
  className?: string;
}) {
  const readerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [instrument?.id, provision?.id]);

  if (!instrument && !provision) {
    return (
      <aside
        id={id}
        ref={readerRef}
        className={["provision-reader", "reader-idle", className]
          .filter(Boolean)
          .join(" ")}
        aria-label="Provision reader"
      >
        <span className="terminal-label">PROVISION_READER / STANDBY</span>
        <div className="idle-reticle" aria-hidden="true">
          <Database />
          <i />
          <i />
        </div>
        <h2>Select an instrument node.</h2>
        <p>
          Open a legal instrument, then choose a provision to inspect official
          text, provenance, status and reviewed mappings.
        </p>
      </aside>
    );
  }

  if (instrument && !provision) {
    const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
    const sourceAudit = sourceAuditByInstrument.get(instrument.id);
    const sourceEntries = [
      { label: "PRIMARY RECORD", source: instrument.source },
      { label: "COMPANION TEXT", source: instrument.supportingSource },
      { label: "AMENDMENT", source: instrument.amendmentSource },
      { label: "ORIGINAL TEXT", source: instrument.originalLanguageSource },
      { label: "ENGLISH VERSION", source: instrument.referenceTranslationSource },
    ].filter(
      (
        entry,
      ): entry is {
        label: string;
        source: Source;
      } => Boolean(entry.source),
    );
    const uniqueSourceEntries = sourceEntries.filter(
      (entry, index) =>
        sourceEntries.findIndex(
          (candidate) => candidate.source.url === entry.source.url,
        ) === index,
    );
    return (
      <aside
        id={id}
        ref={readerRef}
        className={["provision-reader", className].filter(Boolean).join(" ")}
        aria-label="Instrument metadata"
      >
        <span className="terminal-label">INSTRUMENT_RECORD</span>
        <div className="reader-heading">
          <small>
            <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
            {jurisdiction?.name}
          </small>
          <h2>{instrument.shortTitle}</h2>
          <p className="bilingual-instrument-title">
            <span>{instrument.title}</span>
            {instrument.originalTitle && (
              <span lang={instrument.textAvailability.language}>
                {instrument.originalTitle}
              </span>
            )}
          </p>
        </div>
        <div className="reader-status">
          <span className={"status-chip status-" + statusClass(instrument)}>
            {humanize(instrument.lifecycleStatus)}
          </span>
          <span>{humanize(instrument.legalForce)}</span>
        </div>
        <p className="instrument-summary">{instrument.summary}</p>
        <dl className="reader-metadata">
          <div>
            <dt>Authority</dt>
            <dd>{instrument.issuingBodies.join(", ")}</dd>
          </div>
          <div>
            <dt>Hierarchy</dt>
            <dd>{humanize(instrument.hierarchyLevel)}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{instrument.version}</dd>
          </div>
          <div>
            <dt>Status verified</dt>
            <dd>{formatDate(instrument.statusAsOf)}</dd>
          </div>
          {instrument.dates.latestAmendmentEffectiveFrom && (
            <div>
              <dt>Current text</dt>
              <dd>
                Effective {formatDate(instrument.dates.latestAmendmentEffectiveFrom)}
              </dd>
            </div>
          )}
        </dl>
        {sourceAudit && (
          <div className="restricted-text-note">
            <strong>LOCAL COVERAGE / {humanize(sourceAudit.localCoverage.mode)}</strong>
            <p>{sourceAudit.localCoverage.statement}</p>
            {sourceAudit.englishAvailability.coverage && (
              <p>
                English legal text: {sourceAudit.englishAvailability.coverage.translatedUnitCount}
                {" / "}
                {sourceAudit.englishAvailability.coverage.totalUnitCount} units ·{" "}
                {humanize(
                  sourceAudit.englishAvailability.coverage.completeness,
                )}
              </p>
            )}
            {sourceAudit.englishAvailability.coverage &&
              (sourceAudit.englishAvailability.coverage
                .temporallyMismatchedUnitCount ?? 0) > 0 && (
                <p>
                  Current-version aligned: {sourceAudit.englishAvailability.coverage.currentAlignedUnitCount}
                  {" / "}
                  {sourceAudit.englishAvailability.coverage.totalUnitCount} units ·{" "}
                  {sourceAudit.englishAvailability.coverage.temporallyMismatchedUnitCount}{" "}
                  stored English references have an explicit historical or
                  next-phase boundary
                </p>
              )}
            <p>{sourceAudit.englishAvailability.note}</p>
          </div>
        )}
        <div className="reader-actions" aria-label="Official source records">
          {uniqueSourceEntries.map((entry) => (
            <a
              href={entry.source.url}
              target="_blank"
              rel="noreferrer"
              key={entry.source.url}
              aria-label={`${entry.label}: ${entry.source.label}`}
            >
              <ExternalLink aria-hidden="true" />
              {entry.label}
            </a>
          ))}
        </div>
      </aside>
    );
  }

  const activeInstrument = instrumentById.get(provision!.instrumentId)!;
  const jurisdiction = jurisdictionById.get(activeInstrument.jurisdictionId);
  const sourceAudit = sourceAuditByInstrument.get(activeInstrument.id);
  const isCompared = compareIds.includes(provision!.id);
  const activeStructureId = provision!.section?.id ?? provision!.parentId;
  const activeStructureSummary = activeStructureId
    ? structureSummaryByKey.get(activeInstrument.id + "::" + activeStructureId)
    : undefined;
  const originalParagraphs = provision!.paragraphs?.length
    ? provision!.paragraphs
    : provision!.fullText?.trim()
      ? [provision!.fullText.trim()]
      : [];
  const originalLanguage = provision!.textAvailability.language;
  const isOriginalLanguage = !/^en(?:-|$)/i.test(originalLanguage);
  const englishTranslation = provision!.translations?.en;
  const alternativeLanguageTexts = provision!.alternativeLanguageTexts ?? [];
  const hasEnglishTranslation =
    !isOriginalLanguage || Boolean(englishTranslation?.paragraphs.length);
  const englishTranslationVersion =
    englishTranslation?.versionLabel ?? englishTranslation?.versionAsOf;
  const englishTranslationHasTemporalMismatch = Boolean(
    englishTranslation &&
      (englishTranslation.currentTextEquivalent === false ||
        (englishTranslation.currentTextEquivalent !== true &&
          /historical|not-current|next-phase|differs-from-current/i.test(
            `${englishTranslation.coverageStatus ?? ""} ${
              englishTranslation.alignmentStatus ?? ""
            }`,
          ))),
  );
  const englishTranslationIsFuturePhase = Boolean(
    englishTranslation &&
      /next-phase|future/i.test(
        `${englishTranslation.coverageStatus ?? ""} ${
          englishTranslation.alignmentStatus ?? ""
        }`,
      ),
  );
  const englishTranslationIsProjectAuthored = Boolean(
    englishTranslation?.coverageStatus?.includes("project"),
  );
  const languageChoices = isOriginalLanguage
    ? [
        {
          value: "en",
          label: !hasEnglishTranslation
            ? "ENGLISH COVERAGE"
            : englishTranslationHasTemporalMismatch
              ? englishTranslationIsFuturePhase
                ? "ENGLISH · FUTURE REF"
                : "ENGLISH · HISTORICAL REF"
              : "ENGLISH",
        },
        {
          value: "original",
          label: nativeLanguageLabel(originalLanguage),
        },
      ]
    : [
        { value: "en", label: "ENGLISH" },
        ...alternativeLanguageTexts.map((text) => ({
          value: text.language,
          label: nativeLanguageLabel(text.language),
        })),
      ];
  const readerLanguage = languageChoices.some(
    (choice) => choice.value === readerLanguagePreference,
  )
    ? readerLanguagePreference
    : "en";
  const activeLanguageIndex = Math.max(
    0,
    languageChoices.findIndex((choice) => choice.value === readerLanguage),
  );

  function setReaderLanguage(language: string) {
    onSetReaderLanguagePreference(language);
  }

  const showLanguageSwitch = languageChoices.length > 1;
  const showingEnglish = readerLanguage === "en";
  const selectedAlternativeLanguageText = isOriginalLanguage
    ? undefined
    : alternativeLanguageTexts.find(
        (text) => text.language === readerLanguage,
      );
  const englishCoverageFallback =
    showingEnglish && isOriginalLanguage && !hasEnglishTranslation;
  const englishAvailability = provision!.englishAvailability;
  const englishCoverageNotice = englishAvailability
    ? englishAvailability.authorityNote && englishAvailability.note
      ? `${englishAvailability.authorityNote} ${englishAvailability.note}`
      : englishAvailability.authorityNote ??
        englishAvailability.note ??
        `No complete English legal text is stored for ${provision!.locator}.`
    : `No complete English legal text is stored for ${provision!.locator}. The complete official ${nativeLanguageLabel(
        originalLanguage,
      )} wording is available in the original-language view. This panel records an English-coverage gap; it is not a translation or legal summary.`;
  const availableParagraphs = showingEnglish
    ? isOriginalLanguage
      ? hasEnglishTranslation
        ? englishTranslation!.paragraphs
        : [englishCoverageNotice]
      : originalParagraphs
    : isOriginalLanguage
      ? originalParagraphs
      : selectedAlternativeLanguageText?.paragraphs ?? originalParagraphs;
  const renderedParagraphs = availableParagraphs.flatMap((paragraph) => {
    const blocks = paragraph
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
    return blocks.length ? blocks : [paragraph];
  });
  const displayedLanguage = showingEnglish
    ? "en"
    : isOriginalLanguage
      ? originalLanguage
      : selectedAlternativeLanguageText?.language ?? originalLanguage;
  const displayedSource =
    !showingEnglish && selectedAlternativeLanguageText?.source
      ? selectedAlternativeLanguageText.source
      : showingEnglish && isOriginalLanguage && englishTranslation?.source
        ? englishTranslation.source
        : provision!.source;
  const defaultEnglishIsNonAuthoritative = Boolean(
    showingEnglish &&
      !isOriginalLanguage &&
      provision!.defaultLanguageStatus?.includes("non-authoritative"),
  );
  const isStoredExcerpt = provision!.textAvailability.mode.includes("excerpt");
  const applicability = provision!.applicability;
  const currentEffectiveVersion = provision!.currentEffectiveVersion;
  const isDisplayedTextUncommenced = Boolean(
    applicability && applicability.currentLawStatus !== "in-force",
  );
  const readerTabs: ReaderTab[] = ["text", "analysis", "sources"];
  const readerTabIcons: Record<ReaderTab, LucideIcon> = {
    text: BookOpenText,
    analysis: Network,
    sources: ExternalLink,
  };

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % readerTabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + readerTabs.length) % readerTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = readerTabs.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextTab = readerTabs[nextIndex];
    onSetTab(nextTab);
    document.getElementById("reader-tab-" + nextTab)?.focus();
  }

  return (
    <aside
      id={id}
      ref={readerRef}
      className={["provision-reader", className].filter(Boolean).join(" ")}
      aria-label="Provision reader"
    >
      <span className="terminal-label">PROVISION_READER / {readerTab.toUpperCase()}</span>
      <div className="reader-heading">
        <small>
          <JurisdictionMark
            jurisdictionId={activeInstrument.jurisdictionId}
            small
          />
          {jurisdiction?.shortName} / {humanize(activeInstrument.legalForce)}
        </small>
        <h2>
          {activeInstrument.shortTitle} {provision!.locator}
        </h2>
        <p className="bilingual-provision-title">
          <span>{provision!.title}</span>
          {provision!.originalTitle && (
            <span lang={originalLanguage}>{provision!.originalTitle}</span>
          )}
        </p>
      </div>
      <div className="reader-status">
        <span className={"status-chip status-" + statusClass(activeInstrument)}>
          {humanize(activeInstrument.lifecycleStatus)}
        </span>
        <span>PROVISION::{humanize(provision!.legalEffectStatus)}</span>
        {provision!.appliesFrom && (
          <span>APPLIES::{formatDate(provision!.appliesFrom)}</span>
        )}
        {isDisplayedTextUncommenced && <span>TEXT::NOT YET IN FORCE</span>}
        <span>{displayedLanguage.toUpperCase()}</span>
        <span>
          {provision!.textAvailability.stored ? "TEXT STORED" : "LINK ONLY"}
        </span>
      </div>
      <div className="reader-actions">
        <button
          type="button"
          onClick={() => onAddCompare(provision!.id)}
          disabled={isCompared}
        >
          <Link2 aria-hidden="true" />
          {isCompared ? "PINNED" : "ADD TO COMPARE"}
        </button>
        <a href={provision!.source.url} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" />
          OFFICIAL
        </a>
      </div>
      {showLanguageSwitch && (
        <div
          className="reader-language-switch"
          role="group"
          aria-label="Legal text language"
        >
          <span>
            <Languages aria-hidden="true" />
            TEXT LANGUAGE
          </span>
          <div
            className="reader-language-options"
            style={{
              "--language-option-count": languageChoices.length,
              "--language-option-index": activeLanguageIndex,
            } as CSSProperties}
          >
            <span className="reader-language-indicator" aria-hidden="true" />
            {languageChoices.map((choice) => (
              <button
                type="button"
                aria-pressed={readerLanguage === choice.value}
                onClick={() => setReaderLanguage(choice.value)}
                key={choice.value}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="reader-tabs" role="tablist" aria-label="Reader panels">
        {readerTabs.map((tab, index) => {
          const TabIcon = readerTabIcons[tab];
          return (
            <button
              type="button"
              role="tab"
              id={"reader-tab-" + tab}
              aria-controls={"reader-panel-" + tab}
              aria-selected={readerTab === tab}
              tabIndex={readerTab === tab ? 0 : -1}
              key={tab}
              onClick={() => onSetTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <TabIcon aria-hidden="true" />
              {tab.toUpperCase()}
            </button>
          );
        })}
      </div>

      {readerTab === "text" && (
        <div
          id="reader-panel-text"
          className="reader-document"
          role="tabpanel"
          aria-labelledby="reader-tab-text"
          lang={displayedLanguage}
          data-text-language={displayedLanguage}
        >
          {activeStructureSummary && (
            <div className="reader-section-overview">
              <span>
                <Info aria-hidden="true" />
                SECTION OVERVIEW
              </span>
              <strong>{activeStructureSummary.title}</strong>
              <p>{activeStructureSummary.summary}</p>
            </div>
          )}
          {isDisplayedTextUncommenced && applicability && (
            <div className="restricted-text-note">
              <strong>
                COMMENCEMENT STATUS / {humanize(applicability.currentLawStatus)}
              </strong>
              <p>
                This reader is showing the officially promulgated consolidated
                text, which has not yet commenced. {applicability.commencementCondition}
              </p>
              {applicability.historyNote && <p>{applicability.historyNote}</p>}
              {currentEffectiveVersion && (
                <details>
                  <summary>
                    Current effective original-language text · effective{" "}
                    {formatDate(currentEffectiveVersion.appliesFrom)}
                  </summary>
                  <div lang={currentEffectiveVersion.language}>
                    {currentEffectiveVersion.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  <a
                    href={currentEffectiveVersion.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Verify current-effective source ↗
                  </a>
                </details>
              )}
            </div>
          )}
          <div className="document-provenance">
            <span>
              <FileText aria-hidden="true" />
              {renderedParagraphs.length
                ? englishCoverageFallback
                  ? "ENGLISH LEGAL TEXT NOT STORED — COVERAGE NOTICE"
                  : showingEnglish && englishTranslation
                    ? englishTranslation.status === "official"
                      ? "OFFICIAL ENGLISH TEXT"
                      : "ENGLISH REFERENCE TRANSLATION"
                    : defaultEnglishIsNonAuthoritative
                      ? "OFFICIAL ENGLISH TRANSLATION — NON-AUTHORITATIVE"
                    : !showingEnglish && selectedAlternativeLanguageText
                      ? selectedAlternativeLanguageText.status === "official"
                        ? "OFFICIAL LANGUAGE TEXT"
                        : "REFERENCE-LANGUAGE TEXT"
                    : isStoredExcerpt
                  ? isOriginalLanguage
                    ? "OFFICIAL ORIGINAL EXCERPT"
                    : "OFFICIAL EXCERPT"
                  : isOriginalLanguage
                    ? "OFFICIAL ORIGINAL TEXT"
                    : "OFFICIAL TEXT"
                : "EDITORIAL SUMMARY"}
            </span>
            <span>{displayedSource.label}</span>
          </div>
          {showingEnglish &&
            englishTranslation?.note &&
            englishTranslationHasTemporalMismatch && (
              <div className="translation-status-note is-version-warning">
                <strong>
                  {englishTranslationIsFuturePhase
                    ? "Future-phase English reference — not current"
                    : "Historical English reference — not current"}
                  {englishTranslationVersion
                    ? ` · ${englishTranslationVersion}`
                    : ""}
                </strong>
                <p>{englishTranslation.note}</p>
                {englishTranslation.coverageStatus && (
                  <p>
                    Coverage status: {humanize(englishTranslation.coverageStatus)}
                  </p>
                )}
              </div>
            )}
          {renderedParagraphs.length ? (
            renderedParagraphs.map((paragraph, index) => (
              <p key={index} id={provision!.id + "-p-" + (index + 1)}>
                {paragraph}
              </p>
            ))
          ) : (
            <>
              <p>{provision!.summary}</p>
              <div className="restricted-text-note">
                <strong>{humanize(provision!.textAvailability.mode)}</strong>
                <p>{provision!.textAvailability.note}</p>
              </div>
            </>
          )}
          {englishCoverageFallback && (
            <div className="restricted-text-note">
              <strong>English legal text unavailable in this corpus</strong>
              <p>
                Use the original-language view for the complete official wording.
                The Analysis panel separately records concept mappings; those
                mappings are not substituted for legal text.
              </p>
            </div>
          )}
          {showingEnglish &&
            englishTranslation?.note &&
            !englishTranslationHasTemporalMismatch && (
            <div className="translation-status-note">
              <strong>
                {englishTranslation.status === "official"
                  ? "Official translation"
                  : englishTranslationIsProjectAuthored
                    ? "Project-authored reference translation"
                    : "Reference translation"}
                {englishTranslationVersion
                  ? ` · ${englishTranslationVersion}`
                  : ""}
              </strong>
              <p>{englishTranslation.note}</p>
              {englishTranslation.coverageStatus && (
                <p>
                  Coverage status: {humanize(englishTranslation.coverageStatus)}
                </p>
              )}
            </div>
            )}
          {defaultEnglishIsNonAuthoritative && provision!.languageAuthorityNote && (
            <div className="translation-status-note">
              <strong>Official reference translation — no legal force</strong>
              <p>{provision!.languageAuthorityNote}</p>
            </div>
          )}
          {!showingEnglish && selectedAlternativeLanguageText?.note && (
            <div className="translation-status-note">
              <strong>
                {selectedAlternativeLanguageText.status === "official"
                  ? "Authoritative legal text"
                  : "Reference-language text"}
              </strong>
              <p>{selectedAlternativeLanguageText.note}</p>
            </div>
          )}
        </div>
      )}

      {readerTab === "analysis" && (
        <div
          id="reader-panel-analysis"
          className="reader-analysis"
          role="tabpanel"
          aria-labelledby="reader-tab-analysis"
        >
          <div
            className={[
              "topic-relevance-note",
              provision!.topicRelevance.relevance === "substantive-topic"
                ? "is-substantive"
                : "is-structural",
            ].join(" ")}
          >
            <span>
              <BrainCircuit aria-hidden="true" />
              {provision!.topicRelevance.relevance === "substantive-topic"
                ? "TOPIC-RELEVANT PROVISION"
                : "STRUCTURAL CONTEXT"}
            </span>
            <p>{provision!.topicRelevance.rationale}</p>
          </div>
          <div className="concept-list">
            {provision!.conceptIds.map((conceptId) => (
              <button
                type="button"
                key={conceptId}
                onClick={() => onOpenConcept(conceptId)}
              >
                <ConceptIcon conceptId={conceptId} />
                {conceptById.get(conceptId)?.label ?? conceptId}
              </button>
            ))}
          </div>
          {relationsForProvision.length ? (
            <div className="reader-relation-list">
              {relationsForProvision.map((relation) => {
                const endpoint = otherRelationEndpoint(relation, provision!.id);
                const relatedProvision =
                  endpoint?.type === "provision"
                    ? provisionMap.get(endpoint.id)
                    : undefined;
                const relatedInstrument = relatedProvision
                  ? instrumentById.get(relatedProvision.instrumentId)
                  : endpoint?.type === "instrument"
                    ? instrumentById.get(endpoint.id)
                    : undefined;
                if (!relatedInstrument) return null;
                const direction = relationDirectionMarker(
                  relation,
                  provision!.id,
                );
                const relationLabel =
                  relationLabels[relation.type] ?? humanize(relation.type);
                const relatedLabel = relatedProvision
                  ? relatedProvision.locator
                  : "Instrument record";
                const openRelated = () => {
                  if (relatedProvision) {
                    onOpenProvision(relatedProvision, relation.id);
                  } else {
                    onOpenInstrument(relatedInstrument.id);
                  }
                };
                return (
                  <article
                    key={relation.id}
                    className={
                      relation.id === selectedRelation?.id
                        ? "is-selected"
                        : ""
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRelation(relation.id)}
                    >
                      <span>
                        {direction} {relationLabel}
                      </span>
                      <strong>
                        {relatedInstrument.shortTitle} {relatedLabel}
                      </strong>
                      <small className="relation-card-meta">
                        {relation.relationClass === "lifecycle"
                          ? "Legal lineage · "
                          : ""}
                        {humanize(relation.status)} · {relation.confidence} confidence
                      </small>
                    </button>
                    {relation.id === selectedRelation?.id && (
                      <div>
                        <p>{relation.rationale}</p>
                        <small><strong>LIMITS / </strong>{relation.limits}</small>
                        <small>
                          <strong>EVIDENCE / </strong>
                          {humanize(relation.evidenceBasis)} · verified{" "}
                          {formatDate(relation.verifiedOn)}
                        </small>
                        <button
                          type="button"
                          className="reanchor-button"
                          onClick={openRelated}
                        >
                          {relatedProvision
                            ? "SET AS ANCHOR →"
                            : "OPEN INSTRUMENT →"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="reader-empty">
              No qualified mapping has been attached to this provision.
            </p>
          )}
        </div>
      )}

      {readerTab === "sources" && (
        <div
          id="reader-panel-sources"
          className="reader-sources"
          role="tabpanel"
          aria-labelledby="reader-tab-sources"
        >
          <dl className="reader-metadata">
            <div>
              <dt>Publisher</dt>
              <dd>{provision!.source.label}</dd>
            </div>
            <div>
              <dt>Accessed</dt>
              <dd>{formatDate(provision!.source.accessedOn)}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{provision!.textAvailability.language}</dd>
            </div>
            <div>
              <dt>Review status</dt>
              <dd>{humanize(provision!.editorial.reviewStatus)}</dd>
            </div>
            {sourceAudit?.englishAvailability.coverage && (
              <div>
                <dt>English corpus</dt>
                <dd>
                  {sourceAudit.englishAvailability.coverage.translatedUnitCount}
                  {" / "}
                  {sourceAudit.englishAvailability.coverage.totalUnitCount} units
                  {(sourceAudit.englishAvailability.coverage
                    .temporallyMismatchedUnitCount ?? 0) > 0 && (
                    <>
                      {" · "}
                      {sourceAudit.englishAvailability.coverage.currentAlignedUnitCount}{" "}
                      current-aligned
                    </>
                  )}
                </dd>
              </div>
            )}
          </dl>
          <a
            className="source-record"
            href={provision!.source.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>PRIMARY SOURCE</span>
            <strong>{provision!.source.label}</strong>
            <small>{provision!.source.url}</small>
          </a>
          {englishTranslation?.source && (
            <a
              className="source-record"
              href={englishTranslation.source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {englishTranslationIsProjectAuthored
                  ? "TRANSLATION BASIS"
                  : "ENGLISH TEXT SOURCE"}
              </span>
              <strong>{englishTranslation.source.label}</strong>
              <small>{englishTranslation.source.url}</small>
            </a>
          )}
          {sourceAudit && (
            <div className="restricted-text-note">
              <strong>
                ENGLISH COVERAGE / {humanize(sourceAudit.englishAvailability.status)}
              </strong>
              <p>{sourceAudit.englishAvailability.note}</p>
            </div>
          )}
          {englishAvailability?.sourcesChecked?.map((url, index) => (
            <a
              className="source-record"
              href={url}
              target="_blank"
              rel="noreferrer"
              key={url}
            >
              <span>ENGLISH SOURCE CHECK {index + 1}</span>
              <strong>{englishAvailability.status}</strong>
              <small>{url}</small>
            </a>
          ))}
          {selectedRelation?.sourceSupport.map((source) => (
            <a
              className="source-record"
              href={source.url}
              target="_blank"
              rel="noreferrer"
              key={source.url}
            >
              <span>MAPPING SUPPORT</span>
              <strong>{source.label}</strong>
              <small>{source.url}</small>
            </a>
          ))}
          <p className="source-disclaimer">
            Stored text, translations and editorial analysis have separate
            provenance. Verify the operative version in the official source.
          </p>
        </div>
      )}
    </aside>
  );
}

function CompareTray({
  compareIds,
  onOpen,
  onRemove,
  onClear,
}: {
  compareIds: string[];
  onOpen: () => void;
  onRemove: (provisionId: string) => void;
  onClear: () => void;
}) {
  if (!compareIds.length) return null;
  return (
    <div className="compare-tray" aria-label="Provision comparison tray">
      <span className="terminal-label">COMPARE_BUFFER</span>
      <div className="compare-slots">
        {[0, 1].map((index) => {
          const provision = provisionMap.get(compareIds[index]);
          const instrument = provision
            ? instrumentById.get(provision.instrumentId)
            : undefined;
          return provision ? (
            <button
              type="button"
              key={provision.id}
              onClick={() => onRemove(provision.id)}
              aria-label={
                "Remove " +
                instrument?.shortTitle +
                " " +
                provision.locator
              }
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>
                {instrument?.shortTitle} {provision.locator}
              </strong>
              <small>×</small>
            </button>
          ) : (
            <span className="empty-compare-slot" key={index}>
              {String(index + 1).padStart(2, "0")} / EMPTY
            </span>
          );
        })}
      </div>
      <button
        type="button"
        className="compare-open-button"
        onClick={onOpen}
        disabled={compareIds.length < 2}
      >
        COMPARE {compareIds.length}/2 →
      </button>
      <button type="button" className="compare-clear" onClick={onClear}>
        CLEAR
      </button>
    </div>
  );
}

export default function RegulationExplorer() {
  const [state, dispatch] = useReducer(explorerReducer, {
    view: "atlas",
    navigatorTab: "sources",
    selectedInstrumentId: null,
    selectedProvisionId: null,
    selectedRelationId: null,
    selectedConceptId: null,
    readerTab: "text",
    compareIds: [],
    query: "",
  });
  const [historyDepth, setHistoryDepth] = useState(0);
  const [readerLanguagePreference, setReaderLanguagePreference] =
    useState("en");
  const [researchView, setResearchView] =
    useState<ResearchLabView>("observatory");
  const [researchCoverage, setResearchCoverage] =
    useState<ResearchCoverageScope>("complete");
  const [researchRelevance, setResearchRelevance] =
    useState<ResearchRelevanceScope>("substantive");
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false);
  const [corpusRevision, setCorpusRevision] = useState(0);
  const [instrumentLoadStates, setInstrumentLoadStates] = useState<
    Record<string, CorpusLoadState>
  >({});
  const [fullCorpusLoadState, setFullCorpusLoadState] =
    useState<CorpusLoadState>({ phase: "idle" });
  const deferredSearchQuery = useDeferredValue(state.query);
  const hybridSearchIndex = useMemo(() => {
    // Corpus hydration mutates stable provision objects; the revision is the
    // signal to rebuild the local, presentation-neutral search index.
    void corpusRevision;
    return createSearchIndex(buildSearchDocuments(), concepts);
  }, [corpusRevision]);
  const navigatorSearchResults = useMemo(
    () =>
      searchIndex(hybridSearchIndex, deferredSearchQuery, {
        limit: 42,
        typeQuotas: { instrument: 12, provision: 20, concept: 10 },
      }),
    [deferredSearchQuery, hybridSearchIndex],
  );
  const searchSuggestions = useMemo(
    () =>
      searchIndex(hybridSearchIndex, deferredSearchQuery, {
        limit: 10,
        typeQuotas: { instrument: 3, provision: 5, concept: 3 },
      }),
    [deferredSearchQuery, hybridSearchIndex],
  );
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "dark");
  const [columnLayout, setColumnLayout] = useState<ColumnLayout>(
    defaultColumnLayout,
  );
  const [columnLayoutReady, setColumnLayoutReady] = useState(false);
  const [activeColumnResize, setActiveColumnResize] =
    useState<ColumnSide | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileNavigatorToggleRef = useRef<HTMLButtonElement>(null);
  const mobileNavigatorFocusFrameRef = useRef<number | null>(null);
  const appShellRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const columnResizeRef = useRef<ColumnResize>(null);
  const urlSyncReadyRef = useRef(false);
  const transitionRef = useRef<SameDocumentViewTransition | null>(null);
  const transitionTokenRef = useRef(0);
  const navigationHistoryRef = useRef<ExplorerState[]>([]);
  const allCorpusRequestRef = useRef<Promise<void> | null>(null);
  const hasRightColumn =
    state.view === "atlas" ||
    (state.navigatorTab === "sources" &&
      (state.view === "instrument" || state.view === "connections"));

  const ensureInstrumentAvailable = useCallback(
    async (instrumentId: string, force = false) => {
      if (hydratedInstrumentIds.has(instrumentId) && !force) {
        setInstrumentLoadStates((current) => ({
          ...current,
          [instrumentId]: { phase: "ready" },
        }));
        return;
      }
      setInstrumentLoadStates((current) => ({
        ...current,
        [instrumentId]: { phase: "loading" },
      }));
      try {
        await hydrateInstrumentCorpus(instrumentId, { force });
        setInstrumentLoadStates((current) => ({
          ...current,
          [instrumentId]: { phase: "ready" },
        }));
        setCorpusRevision((current) => current + 1);
      } catch (error) {
        setInstrumentLoadStates((current) => ({
          ...current,
          [instrumentId]: {
            phase: "error",
            error: corpusErrorMessage(error),
          },
        }));
      }
    },
    [],
  );

  const ensureCompleteCorpus = useCallback(async (force = false) => {
    if (
      !force &&
      Object.keys(clientCorpusIndex.shards).every((instrumentId) =>
        hydratedInstrumentIds.has(instrumentId),
      )
    ) {
      setFullCorpusLoadState({ phase: "ready" });
      return;
    }
    if (allCorpusRequestRef.current) return allCorpusRequestRef.current;

    setFullCorpusLoadState({ phase: "loading" });
    const instrumentIds = Object.keys(clientCorpusIndex.shards).filter(
      (instrumentId) => force || !hydratedInstrumentIds.has(instrumentId),
    );
    const request = (async () => {
      try {
        for (let offset = 0; offset < instrumentIds.length; offset += 6) {
          const batch = instrumentIds.slice(offset, offset + 6);
          await Promise.all(
            batch.map((instrumentId) =>
              hydrateInstrumentCorpus(instrumentId, { force }),
            ),
          );
        }
        setFullCorpusLoadState({ phase: "ready" });
        setCorpusRevision((current) => current + 1);
      } catch (error) {
        setFullCorpusLoadState({
          phase: "error",
          error: corpusErrorMessage(error),
        });
      } finally {
        allCorpusRequestRef.current = null;
      }
    })();
    allCorpusRequestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(columnLayoutStorageKey) ?? "null",
        ) as Partial<ColumnLayout> | null;
        if (stored) {
          const restoredLayout: ColumnLayout = {
            leftWidth:
              typeof stored.leftWidth === "number"
                ? clampColumnWidth("left", stored.leftWidth)
                : defaultColumnLayout.leftWidth,
            rightWidth:
              typeof stored.rightWidth === "number"
                ? clampColumnWidth("right", stored.rightWidth)
                : defaultColumnLayout.rightWidth,
            leftCollapsed: stored.leftCollapsed === true,
            rightCollapsed: stored.rightCollapsed === true,
          };
          setColumnLayout(
            normalizeColumnLayout(
              restoredLayout,
              appShellRef.current?.getBoundingClientRect().width ??
                window.innerWidth,
              true,
            ),
          );
        }
      } catch {
        // The default column layout remains usable when storage is unavailable.
      }
      setColumnLayoutReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const normalizeForViewport = () => {
      const shellWidth =
        appShellRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      setColumnLayout((current) =>
        normalizeColumnLayout(current, shellWidth, hasRightColumn),
      );
    };
    const frame = window.requestAnimationFrame(normalizeForViewport);
    window.addEventListener("resize", normalizeForViewport);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", normalizeForViewport);
    };
  }, [hasRightColumn]);

  useEffect(() => {
    if (!columnLayoutReady) return;
    try {
      window.localStorage.setItem(
        columnLayoutStorageKey,
        JSON.stringify(columnLayout),
      );
    } catch {
      // Local persistence is optional; resizing still works for this session.
    }
  }, [columnLayout, columnLayoutReady]);

  function columnWidthBounds(side: ColumnSide, layout = columnLayout) {
    const shellWidth =
      appShellRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const bounds = columnBounds[side];
    const otherWidth =
      side === "left"
        ? hasRightColumn && !layout.rightCollapsed
          ? layout.rightWidth
          : hasRightColumn
            ? columnCollapsedRail
            : 0
        : layout.leftCollapsed
          ? columnCollapsedRail
          : layout.leftWidth;
    return {
      min: bounds.min,
      max: Math.max(
        bounds.min,
        Math.min(bounds.max, shellWidth - otherWidth - columnBounds.centerMin),
      ),
    };
  }

  function setColumnWidth(side: ColumnSide, requestedWidth: number) {
    setColumnLayout((current) => {
      const bounds = columnWidthBounds(side, current);
      const width = Math.round(
        Math.max(bounds.min, Math.min(bounds.max, requestedWidth)),
      );
      return side === "left"
        ? { ...current, leftWidth: width }
        : { ...current, rightWidth: width };
    });
  }

  function beginColumnResize(
    side: ColumnSide,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const startWidth =
      side === "left" ? columnLayout.leftWidth : columnLayout.rightWidth;
    columnResizeRef.current = {
      side,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveColumnResize(side);
  }

  function moveColumnResize(event: ReactPointerEvent<HTMLElement>) {
    const resize = columnResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const pointerDelta = event.clientX - resize.startX;
    setColumnWidth(
      resize.side,
      resize.startWidth + (resize.side === "left" ? pointerDelta : -pointerDelta),
    );
  }

  function endColumnResize(event: ReactPointerEvent<HTMLElement>) {
    const resize = columnResizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    columnResizeRef.current = null;
    setActiveColumnResize(null);
  }

  function handleColumnResizeKeyDown(
    side: ColumnSide,
    event: ReactKeyboardEvent<HTMLElement>,
  ) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const bounds = columnWidthBounds(side);
    const currentWidth =
      side === "left" ? columnLayout.leftWidth : columnLayout.rightWidth;
    const step = event.shiftKey ? 32 : 12;
    if (event.key === "Home") {
      setColumnWidth(side, bounds.min);
    } else if (event.key === "End") {
      setColumnWidth(side, bounds.max);
    } else {
      const physicalDirection = event.key === "ArrowRight" ? 1 : -1;
      const widthDirection = side === "left" ? physicalDirection : -physicalDirection;
      setColumnWidth(side, currentWidth + widthDirection * step);
    }
  }

  function toggleColumn(side: ColumnSide) {
    setColumnLayout((current) => {
      const updated = side === "left"
        ? { ...current, leftCollapsed: !current.leftCollapsed }
        : { ...current, rightCollapsed: !current.rightCollapsed };
      const shellWidth =
        appShellRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      return normalizeColumnLayout(updated, shellWidth, hasRightColumn);
    });
  }

  function clearTransitionMetadata(token: number) {
    if (transitionTokenRef.current !== token) return;
    const root = document.documentElement;
    root.removeAttribute("data-ui-transition");
    root.removeAttribute("data-view-direction");
    root.removeAttribute("data-transition-fallback");
    root.style.removeProperty("--theme-x");
    root.style.removeProperty("--theme-y");
    transitionRef.current = null;
  }

  function runVisualTransition(
    kind: TransitionKind,
    update: () => void,
    options?: {
      nextView?: View;
      direction?: ViewDirection;
      origin?: { x: number; y: number };
    },
  ) {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const transitionDocument = document as TransitionDocument;
    if (reducedMotion) {
      update();
      return;
    }

    transitionRef.current?.skipTransition();
    const token = transitionTokenRef.current + 1;
    transitionTokenRef.current = token;
    const root = document.documentElement;
    root.setAttribute("data-ui-transition", kind);

    if (kind === "view" && options?.nextView) {
      const currentIndex = viewLabels.findIndex((view) => view.id === state.view);
      const nextIndex = viewLabels.findIndex(
        (view) => view.id === options.nextView,
      );
      const direction: ViewDirection = options.direction ??
        (nextIndex >= currentIndex ? "forward" : "backward");
      root.setAttribute("data-view-direction", direction);
    }

    if (kind === "theme" && options?.origin) {
      root.style.setProperty("--theme-x", options.origin.x + "px");
      root.style.setProperty("--theme-y", options.origin.y + "px");
    }

    if (!transitionDocument.startViewTransition) {
      root.setAttribute("data-transition-fallback", "true");
      flushSync(() => update());
      window.setTimeout(
        () => clearTransitionMetadata(token),
        kind === "theme" ? 520 : 380,
      );
      return;
    }

    let committed = false;
    try {
      const transition = transitionDocument.startViewTransition(() => {
        flushSync(() => update());
        committed = true;
      });
      transitionRef.current = transition;
      transition.finished.then(
        () => clearTransitionMetadata(token),
        () => clearTransitionMetadata(token),
      );
    } catch {
      if (!committed) update();
      clearTransitionMetadata(token);
    }
  }

  function chooseTheme(
    nextTheme: Theme,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) {
    if (theme === nextTheme) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    runVisualTransition(
      "theme",
      () => {
        document.documentElement.dataset.theme = nextTheme;
        try {
          window.localStorage.setItem("gadrm-theme", nextTheme);
        } catch {
          // The selected theme still applies for this session when storage is blocked.
        }
        window.dispatchEvent(new Event(themeChangeEvent));
      },
      {
        origin: {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        },
      },
    );
  }

  function rememberCurrentInterface() {
    navigationHistoryRef.current.push({
      ...state,
      compareIds: [...state.compareIds],
    });
    if (navigationHistoryRef.current.length > 40) {
      navigationHistoryRef.current.shift();
    }
    setHistoryDepth(navigationHistoryRef.current.length);
  }

  const closeMobileNavigatorAndRestoreFocus = useCallback(() => {
    if (!mobileNavigatorOpen) return;
    setMobileNavigatorOpen(false);
    if (!window.matchMedia(mobileNavigatorMediaQuery).matches) return;
    if (mobileNavigatorFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(mobileNavigatorFocusFrameRef.current);
    }
    mobileNavigatorFocusFrameRef.current = window.requestAnimationFrame(() => {
      mobileNavigatorFocusFrameRef.current = null;
      if (!window.matchMedia(mobileNavigatorMediaQuery).matches) return;
      mobileNavigatorToggleRef.current?.focus({ preventScroll: true });
    });
  }, [mobileNavigatorOpen]);

  function toggleMobileNavigator() {
    if (mobileNavigatorOpen) {
      closeMobileNavigatorAndRestoreFocus();
    } else {
      setMobileNavigatorOpen(true);
    }
  }

  function goBack() {
    closeMobileNavigatorAndRestoreFocus();
    const previous = navigationHistoryRef.current.pop();
    if (!previous) return;
    setHistoryDepth(navigationHistoryRef.current.length);
    const restore = () => dispatch({ type: "RESTORE_STATE", state: previous });
    if (previous.navigatorTab !== state.navigatorTab) {
      restore();
      return;
    }
    runVisualTransition("view", restore, {
      nextView: previous.view,
      direction: "backward",
    });
  }

  function setNavigatorTab(nextTab: NavigatorTab) {
    closeMobileNavigatorAndRestoreFocus();
    if (state.navigatorTab === nextTab) return;
    rememberCurrentInterface();
    dispatch({ type: "SET_NAVIGATOR_TAB", tab: nextTab });
  }

  function openConceptIndex() {
    closeMobileNavigatorAndRestoreFocus();
    if (state.navigatorTab === "concepts" && !state.selectedConceptId) return;
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "SET_NAVIGATOR_TAB", tab: "concepts" }),
      { nextView: "atlas", direction: "backward" },
    );
  }

  function openConcept(conceptId: string) {
    closeMobileNavigatorAndRestoreFocus();
    if (
      state.navigatorTab === "concepts" &&
      state.selectedConceptId === conceptId
    ) {
      return;
    }
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "OPEN_CONCEPT", conceptId }),
      { nextView: "atlas", direction: "forward" },
    );
  }

  function openAtlas() {
    closeMobileNavigatorAndRestoreFocus();
    if (
      state.view === "atlas" &&
      state.navigatorTab === "sources" &&
      !state.selectedInstrumentId
    ) {
      return;
    }
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "OPEN_ATLAS" }),
      { nextView: "atlas", direction: "backward" },
    );
  }

  function openAtlasGroup(groupId: string) {
    openAtlas();
    window.setTimeout(() => {
      const lane = workspaceRef.current?.querySelector<HTMLElement>(
        '[data-atlas-group="' + groupId + '"]',
      );
      lane?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }, 420);
  }

  function openInstrument(instrumentId: string) {
    closeMobileNavigatorAndRestoreFocus();
    if (
      state.view === "instrument" &&
      state.selectedInstrumentId === instrumentId
    ) {
      return;
    }
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "OPEN_INSTRUMENT", instrumentId }),
      { nextView: "instrument" },
    );
  }

  function openView(nextView: View) {
    closeMobileNavigatorAndRestoreFocus();
    if (nextView === "atlas" && state.navigatorTab === "concepts") {
      openAtlas();
      return;
    }
    if (state.view === nextView && state.navigatorTab === "sources") return;
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "OPEN_VIEW", view: nextView }),
      { nextView },
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const instrumentId = params.get("instrument");
    const provisionId = params.get("provision");
    const conceptId = params.get("concept");
    const requestedNavigatorTab = params.get("nav");
    const requestedView = params.get("view") as View | null;
    const requestedResearchView = params.get("researchView");
    const requestedResearchCoverage = params.get("researchCoverage");
    const requestedResearchRelevance = params.get("researchRelevance");
    const restoredConcept = conceptId ? conceptById.get(conceptId) : undefined;
    const restoredProvision = provisionId
      ? provisionMap.get(provisionId)
      : undefined;
    const restoredInstrument = restoredProvision
      ? instrumentById.get(restoredProvision.instrumentId)
      : instrumentId
        ? instrumentById.get(instrumentId)
        : undefined;

    if (isResearchLabView(requestedResearchView)) {
      setResearchView(requestedResearchView);
    }
    if (
      requestedResearchCoverage === "complete" ||
      requestedResearchCoverage === "all"
    ) {
      setResearchCoverage(requestedResearchCoverage);
    }
    if (
      requestedResearchRelevance === "substantive" ||
      requestedResearchRelevance === "all"
    ) {
      setResearchRelevance(requestedResearchRelevance);
    }

    if (restoredConcept) {
      dispatch({ type: "OPEN_CONCEPT", conceptId: restoredConcept.id });
    } else if (requestedNavigatorTab === "concepts") {
      dispatch({ type: "SET_NAVIGATOR_TAB", tab: "concepts" });
    } else if (restoredProvision) {
      dispatch({
        type: "OPEN_PROVISION",
        provisionId: restoredProvision.id,
        instrumentId: restoredProvision.instrumentId,
      });
    } else if (restoredInstrument) {
      dispatch({ type: "OPEN_INSTRUMENT", instrumentId: restoredInstrument.id });
    }

    const restoredCompareIds = (params.get("compare") ?? "")
      .split(",")
      .filter((id) => provisionMap.has(id))
      .slice(0, 2);
    restoredCompareIds.forEach((id) =>
      dispatch({ type: "ADD_COMPARE", provisionId: id }),
    );

    if (
      !restoredConcept &&
      requestedNavigatorTab !== "concepts" &&
      requestedView &&
      viewLabels.some((view) => view.id === requestedView) &&
      (requestedView === "atlas" ||
        requestedView === "research" ||
        (requestedView === "instrument" && restoredInstrument) ||
        (requestedView === "timeline" && restoredInstrument) ||
        (requestedView === "connections" && restoredProvision) ||
        (requestedView === "compare" && restoredCompareIds.length === 2))
    ) {
      dispatch({ type: "OPEN_VIEW", view: requestedView });
    }
    const timer = window.setTimeout(() => {
      urlSyncReadyRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!urlSyncReadyRef.current) return;
    const params = new URLSearchParams();
    params.set("view", state.view);
    if (state.navigatorTab === "concepts") {
      params.set("nav", "concepts");
    }
    if (state.selectedConceptId) {
      params.set("concept", state.selectedConceptId);
    }
    if (state.selectedInstrumentId) {
      params.set("instrument", state.selectedInstrumentId);
    }
    if (state.selectedProvisionId) {
      params.set("provision", state.selectedProvisionId);
    }
    if (state.compareIds.length) {
      params.set("compare", state.compareIds.join(","));
    }
    if (state.view === "research") {
      params.set("researchView", researchView);
      params.set("researchCoverage", researchCoverage);
      params.set("researchRelevance", researchRelevance);
    }
    const nextHash = "#" + params.toString();
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + nextHash,
      );
    }
  }, [
    state.compareIds,
    state.navigatorTab,
    state.selectedConceptId,
    state.selectedInstrumentId,
    state.selectedProvisionId,
    state.view,
    researchCoverage,
    researchRelevance,
    researchView,
  ]);

  useEffect(() => {
    if (
      !state.selectedInstrumentId ||
      !["instrument", "connections", "timeline"].includes(state.view)
    ) {
      return;
    }
    void ensureInstrumentAvailable(state.selectedInstrumentId);
  }, [
    ensureInstrumentAvailable,
    state.selectedInstrumentId,
    state.view,
  ]);

  useEffect(() => {
    if (state.view !== "compare") return;
    const instrumentIds = Array.from(
      new Set(
        state.compareIds
          .map((provisionId) => provisionMap.get(provisionId)?.instrumentId)
          .filter((instrumentId): instrumentId is string => Boolean(instrumentId)),
      ),
    );
    instrumentIds.forEach((instrumentId) => {
      void ensureInstrumentAvailable(instrumentId);
    });
  }, [ensureInstrumentAvailable, state.compareIds, state.view]);

  useEffect(() => {
    if (state.navigatorTab === "sources" && state.view === "research") {
      void ensureCompleteCorpus();
    }
  }, [ensureCompleteCorpus, state.navigatorTab, state.view]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && mobileNavigatorOpen) {
        if (document.activeElement !== searchRef.current) {
          closeMobileNavigatorAndRestoreFocus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [closeMobileNavigatorAndRestoreFocus, mobileNavigatorOpen]);

  useEffect(
    () => () => {
      if (mobileNavigatorFocusFrameRef.current !== null) {
        window.cancelAnimationFrame(mobileNavigatorFocusFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: 0 });
  }, [
    state.navigatorTab,
    state.selectedConceptId,
    state.selectedInstrumentId,
    state.selectedProvisionId,
    state.view,
  ]);

  const selectedInstrument = state.selectedInstrumentId
    ? instrumentById.get(state.selectedInstrumentId)
    : undefined;
  const selectedProvision = state.selectedProvisionId
    ? provisionMap.get(state.selectedProvisionId)
    : undefined;
  const selectedConcept = state.selectedConceptId
    ? conceptById.get(state.selectedConceptId)
    : undefined;
  const selectedInstrumentLoadState: CorpusLoadState = state.selectedInstrumentId
    ? hydratedInstrumentIds.has(state.selectedInstrumentId)
      ? { phase: "ready" }
      : (instrumentLoadStates[state.selectedInstrumentId] ?? { phase: "idle" })
    : { phase: "idle" };
  const researchCorpusInput = useMemo<ResearchCorpusInput>(
    () => {
      // Hydration mutates stable provision objects; the revision is the cache key.
      void corpusRevision;
      return ({
        snapshotDate: "2026-07-20",
        jurisdictions,
        instruments,
        provisions,
        concepts,
        themes: conceptThemes,
        sourceAudits,
        relations,
        statusEvents,
        englishCorpusCoverage: englishCorpusCoverageJson,
      }) as unknown as ResearchCorpusInput;
    },
    [corpusRevision],
  );
  const selectedRelations = selectedProvision
    ? relationsByProvision.get(selectedProvision.id) ?? []
    : [];
  const effectiveRelation =
    (state.selectedRelationId
      ? relationById.get(state.selectedRelationId)
      : undefined) ?? selectedRelations[0];

  const breadcrumb = useMemo<Array<{
    key: string;
    label: string;
    current: boolean;
    destination:
      | { type: "atlas"; groupId?: string }
      | { type: "research" }
      | { type: "concept-index" }
      | { type: "concept"; conceptId: string }
      | { type: "instrument"; instrumentId: string }
      | { type: "provision"; provisionId: string };
  }>>(() => {
    if (selectedConcept) {
      return [
        {
          key: "concept-index",
          label: "CORE CONCEPTS",
          current: false,
          destination: { type: "concept-index" },
        },
        {
          key: selectedConcept.id,
          label: selectedConcept.label,
          current: true,
          destination: { type: "concept", conceptId: selectedConcept.id },
        },
      ];
    }
    if (state.navigatorTab === "concepts") {
      return [
        {
          key: "concept-index",
          label: "CORE CONCEPTS",
          current: true,
          destination: { type: "concept-index" },
        },
      ];
    }
    if (state.view === "research") {
      return [
        {
          key: "global-atlas",
          label: "GLOBAL ATLAS",
          current: false,
          destination: { type: "atlas" },
        },
        {
          key: "research-lab",
          label: "RESEARCH LAB",
          current: true,
          destination: { type: "research" },
        },
      ];
    }
    if (!selectedInstrument) {
      return [
        {
          key: "global-atlas",
          label: "GLOBAL ATLAS",
          current: true,
          destination: { type: "atlas" },
        },
      ];
    }
    const jurisdiction = jurisdictionById.get(
      selectedInstrument.jurisdictionId,
    );
    const atlasGroupId = atlasGroups.find((group) =>
      group.instruments.some((instrument) => instrument.id === selectedInstrument.id),
    )?.id;
    const parts: Array<{
      key: string;
      label: string;
      current: boolean;
      destination:
        | { type: "atlas"; groupId?: string }
        | { type: "research" }
        | { type: "instrument"; instrumentId: string }
        | { type: "provision"; provisionId: string };
    }> = [
      {
        key: "global-atlas",
        label: "GLOBAL ATLAS",
        current: false,
        destination: { type: "atlas" },
      },
      {
        key: "jurisdiction-" + (atlasGroupId ?? selectedInstrument.jurisdictionId),
        label: jurisdiction?.shortName ?? selectedInstrument.jurisdictionId,
        current: false,
        destination: { type: "atlas", groupId: atlasGroupId },
      },
      {
        key: selectedInstrument.id,
        label: selectedInstrument.shortTitle,
        current: !selectedProvision,
        destination: { type: "instrument", instrumentId: selectedInstrument.id },
      },
    ];
    if (selectedProvision) {
      parts.push({
        key: selectedProvision.id,
        label: selectedProvision.locator,
        current: true,
        destination: { type: "provision", provisionId: selectedProvision.id },
      });
    }
    return parts;
  }, [
    selectedConcept,
    selectedInstrument,
    selectedProvision,
    state.navigatorTab,
    state.view,
  ]);

  function followBreadcrumb(
    destination: (typeof breadcrumb)[number]["destination"],
  ) {
    if (destination.type === "concept-index") {
      openConceptIndex();
    } else if (destination.type === "research") {
      openView("research");
    } else if (destination.type === "concept") {
      openConcept(destination.conceptId);
    } else if (destination.type === "instrument") {
      openInstrument(destination.instrumentId);
    } else if (destination.type === "provision") {
      const provision = provisionMap.get(destination.provisionId);
      if (provision) openProvision(provision);
    } else if (destination.groupId) {
      openAtlasGroup(destination.groupId);
    } else {
      openAtlas();
    }
  }

  function openProvision(provision: Provision, relationId?: string) {
    closeMobileNavigatorAndRestoreFocus();
    if (
      state.view === "connections" &&
      state.selectedProvisionId === provision.id &&
      (!relationId || state.selectedRelationId === relationId)
    ) {
      return;
    }
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () =>
        dispatch({
          type: "OPEN_PROVISION",
          provisionId: provision.id,
          instrumentId: provision.instrumentId,
          relationId,
        }),
      { nextView: "connections" },
    );
  }

  function openSearchResult(result: SearchResult) {
    if (result.document.type === "instrument") {
      openInstrument(result.document.id);
      return;
    }
    if (result.document.type === "concept") {
      openConcept(result.document.id);
      return;
    }
    const provision = provisionMap.get(result.document.id);
    if (provision) {
      openProvision(provision);
    } else {
      dispatch({ type: "SET_QUERY", query: "" });
    }
  }

  const canOpenInstrument = Boolean(selectedInstrument);
  const canOpenConnections = Boolean(selectedProvision);
  const canOpenCompare = state.compareIds.length === 2;
  const activeViewIndex = viewLabels.findIndex((view) => view.id === state.view);
  const modeSwitchStyle = {
    "--active-view-index": activeViewIndex,
  } as CSSProperties;
  const appShellStyle = {
    "--left-column-width": `${columnLayout.leftWidth}px`,
    "--right-column-width": `${columnLayout.rightWidth}px`,
  } as CSSProperties;
  const comparedInstrumentIds = Array.from(
    new Set(
      state.compareIds
        .map((provisionId) => provisionMap.get(provisionId)?.instrumentId)
        .filter((instrumentId): instrumentId is string => Boolean(instrumentId)),
    ),
  );
  const compareLoadError = comparedInstrumentIds
    .map((instrumentId) => instrumentLoadStates[instrumentId])
    .find((loadState) => loadState?.phase === "error");
  const compareCorpusReady = comparedInstrumentIds.every((instrumentId) =>
    hydratedInstrumentIds.has(instrumentId),
  );
  const compareCorpusState: CorpusLoadState = compareLoadError ??
    (compareCorpusReady ? { phase: "ready" } : { phase: "loading" });
  const provisionReaderContent =
    state.navigatorTab === "sources" &&
    state.view === "connections" &&
    selectedProvision ? (
      selectedInstrumentLoadState.phase === "ready" ? (
        <ProvisionReader
          instrument={selectedInstrument}
          provision={selectedProvision}
          className="embedded-provision-reader"
          selectedRelation={effectiveRelation}
          relationsForProvision={selectedRelations}
          readerTab={state.readerTab}
          compareIds={state.compareIds}
          onSetTab={(tab) => dispatch({ type: "SET_READER_TAB", tab })}
          onSelectRelation={(relationId) =>
            dispatch({ type: "SELECT_RELATION", relationId })
          }
          onOpenProvision={openProvision}
          onOpenInstrument={openInstrument}
          onOpenConcept={openConcept}
          onAddCompare={(provisionId) =>
            dispatch({ type: "ADD_COMPARE", provisionId })
          }
          readerLanguagePreference={readerLanguagePreference}
          onSetReaderLanguagePreference={setReaderLanguagePreference}
        />
      ) : (
        <CorpusLoadNotice
          state={
            selectedInstrumentLoadState.phase === "idle"
              ? { phase: "loading" }
              : selectedInstrumentLoadState
          }
          title={selectedInstrument?.shortTitle ?? selectedProvision.instrumentId}
          onRetry={() =>
            void ensureInstrumentAvailable(selectedProvision.instrumentId, true)
          }
          onBackToAtlas={openAtlas}
        />
      )
    ) : null;
  const atlasGlobePanel =
    state.navigatorTab === "sources" && state.view === "atlas" ? (
      <RegulationGlobe
        id="right-column-panel"
        className="atlas-globe-panel right-column-panel"
        jurisdictions={globeJurisdictions}
        concepts={globeConcepts}
        maxConceptNodes={7}
        onOpenInstrument={openInstrument}
        onOpenConcept={openConcept}
      />
    ) : null;
  const instrumentVisualizationPanel =
    state.navigatorTab === "sources" &&
    state.view === "instrument" &&
    selectedInstrument ? (
      <aside
        id="right-column-panel"
        className="relationship-panel right-column-panel"
        aria-label={selectedInstrument.shortTitle + " relationship visualization"}
      >
        <InstrumentConnectionCanvas
          instrument={selectedInstrument}
          onOpenProvision={openProvision}
          onOpenConcept={openConcept}
        />
      </aside>
    ) : null;
  const provisionVisualizationPanel =
    state.navigatorTab === "sources" &&
    state.view === "connections" &&
    selectedProvision ? (
      <aside
        id="right-column-panel"
        className="relationship-panel right-column-panel"
        aria-label={
          (selectedInstrument?.shortTitle ?? selectedProvision.instrumentId) +
          " " +
          selectedProvision.locator +
          " relationship visualization"
        }
      >
        <ConnectionCanvas
          anchor={selectedProvision}
          selectedRelationId={effectiveRelation?.id ?? null}
          onOpenProvision={openProvision}
          onOpenInstrument={openInstrument}
          onOpenConcept={openConcept}
        />
      </aside>
    ) : null;
  const conceptVisualizationPanel =
    state.navigatorTab === "concepts" && state.view === "atlas" ? (
      <ConceptConstellation
        id="right-column-panel"
        className="concept-constellation-panel right-column-panel"
        themes={constellationThemes}
        concepts={constellationConcepts}
        instruments={constellationInstruments}
        selectedConceptId={state.selectedConceptId}
        maxSourceNodes={7}
        onOpenConcept={openConcept}
        onOpenInstrument={openInstrument}
      />
    ) : null;
  const rightVisualizationPanel =
    atlasGlobePanel ??
    conceptVisualizationPanel ??
    instrumentVisualizationPanel ??
    provisionVisualizationPanel;

  return (
    <main className="terminal-app">
      <header className="top-bar">
        <button
          type="button"
          className="wordmark"
          onClick={openAtlas}
          aria-label="Open Compliance Compass global AI governance and data regulation atlas"
        >
          <span>COMPLIANCE COMPASS</span>
          <strong>GLOBAL AI GOVERNANCE</strong>
          <small>DATA REGULATION MAP / VISUALIZATION</small>
        </button>
        <SearchCombobox
          query={state.query}
          results={
            state.query === deferredSearchQuery ? searchSuggestions : []
          }
          inputRef={searchRef}
          isPending={state.query !== deferredSearchQuery}
          fullTextState={fullCorpusLoadState}
          onQueryChange={(query) => dispatch({ type: "SET_QUERY", query })}
          onSelect={openSearchResult}
          onLoadFullText={() =>
            void ensureCompleteCorpus(fullCorpusLoadState.phase === "error")
          }
        />
        <nav
          className="mode-switch"
          aria-label="Explorer mode"
          data-active-view={state.view}
          style={modeSwitchStyle}
        >
          <span className="mode-switch-indicator" aria-hidden="true" />
          {viewLabels.map((view) => {
            const ViewIcon = view.icon;
            const disabled =
              (view.id === "instrument" && !canOpenInstrument) ||
              (view.id === "connections" && !canOpenConnections) ||
              (view.id === "timeline" && !canOpenInstrument) ||
              (view.id === "compare" && !canOpenCompare);
            return (
              <button
                type="button"
                key={view.id}
                disabled={disabled}
                aria-pressed={state.view === view.id}
                aria-label={view.label + " view"}
                onClick={() => openView(view.id)}
              >
                <ViewIcon aria-hidden="true" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>
        <div
          className="theme-switch"
          role="group"
          aria-label="Color theme"
          data-active-theme={theme}
        >
          <span className="theme-switch-indicator" aria-hidden="true" />
          <button
            type="button"
            data-theme-option="dark"
            aria-pressed={theme === "dark"}
            onClick={(event) => chooseTheme("dark", event)}
          >
            <Moon aria-hidden="true" />
            Dark
          </button>
          <button
            type="button"
            data-theme-option="bright"
            aria-pressed={theme === "bright"}
            onClick={(event) => chooseTheme("bright", event)}
          >
            <Sun aria-hidden="true" />
            Bright
          </button>
        </div>
        <a
          className="github-link"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
        >
          <GitFork aria-hidden="true" />
          GITHUB
        </a>
      </header>

      <div className="system-strip">
        <span><i className="system-dot" /> DATASET LOADED</span>
        <span>SNAPSHOT 2026.07.20</span>
        <span>ACADEMIC RESEARCH EDITION / NOT LEGAL ADVICE</span>
      </div>

      <div
        ref={appShellRef}
        className={[
          "app-shell",
          "view-" + state.view,
          hasRightColumn ? "has-right-column" : "",
          columnLayout.leftCollapsed ? "is-left-collapsed" : "",
          hasRightColumn && columnLayout.rightCollapsed
            ? "is-right-collapsed"
            : "",
          activeColumnResize ? "is-column-resizing" : "",
          state.navigatorTab === "concepts" ? "navigator-concepts-mode" : "",
          state.navigatorTab === "concepts" && state.view === "atlas"
            ? "concept-visualization-active"
            : "",
          mobileNavigatorOpen ? "is-mobile-navigator-open" : "",
        ].filter(Boolean).join(" ")}
        data-mobile-nav-open={mobileNavigatorOpen ? "true" : "false"}
        style={appShellStyle}
      >
        <button
          ref={mobileNavigatorToggleRef}
          type="button"
          className="mobile-navigator-toggle"
          aria-controls="corpus-navigator-panel"
          aria-expanded={mobileNavigatorOpen}
          onClick={toggleMobileNavigator}
        >
          {mobileNavigatorOpen ? (
            <PanelLeftClose aria-hidden="true" />
          ) : (
            <PanelLeftOpen aria-hidden="true" />
          )}
          <span>{mobileNavigatorOpen ? "Close navigator" : "Open navigator"}</span>
        </button>
        <button
          type="button"
          className="column-toggle column-toggle-left"
          onClick={() => toggleColumn("left")}
          aria-controls="corpus-navigator-panel"
          aria-expanded={!columnLayout.leftCollapsed}
          aria-label={
            columnLayout.leftCollapsed
              ? "Show navigation column"
              : "Hide navigation column"
          }
        >
          {columnLayout.leftCollapsed ? (
            <PanelLeftOpen aria-hidden="true" />
          ) : (
            <PanelLeftClose aria-hidden="true" />
          )}
        </button>
        {!columnLayout.leftCollapsed && (
          <div
            className={[
              "column-resizer",
              "column-resizer-left",
              activeColumnResize === "left" ? "is-active" : "",
            ].filter(Boolean).join(" ")}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize navigation column"
            aria-valuemin={columnBounds.left.min}
            aria-valuemax={columnBounds.left.max}
            aria-valuenow={columnLayout.leftWidth}
            aria-valuetext={`${columnLayout.leftWidth} pixels wide`}
            onPointerDown={(event) => beginColumnResize("left", event)}
            onPointerMove={moveColumnResize}
            onPointerUp={endColumnResize}
            onPointerCancel={endColumnResize}
            onKeyDown={(event) => handleColumnResizeKeyDown("left", event)}
          />
        )}
        {hasRightColumn && (
          <button
            type="button"
            className="column-toggle column-toggle-right"
            onClick={() => toggleColumn("right")}
            aria-controls="right-column-panel"
            aria-expanded={!columnLayout.rightCollapsed}
            aria-label={
              columnLayout.rightCollapsed
                ? "Show right column"
                : "Hide right column"
            }
          >
            {columnLayout.rightCollapsed ? (
              <PanelRightOpen aria-hidden="true" />
            ) : (
              <PanelRightClose aria-hidden="true" />
            )}
          </button>
        )}
        {hasRightColumn && !columnLayout.rightCollapsed && (
          <div
            className={[
              "column-resizer",
              "column-resizer-right",
              activeColumnResize === "right" ? "is-active" : "",
            ].filter(Boolean).join(" ")}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize right column"
            aria-valuemin={columnBounds.right.min}
            aria-valuemax={columnBounds.right.max}
            aria-valuenow={columnLayout.rightWidth}
            aria-valuetext={`${columnLayout.rightWidth} pixels wide`}
            onPointerDown={(event) => beginColumnResize("right", event)}
            onPointerMove={moveColumnResize}
            onPointerUp={endColumnResize}
            onPointerCancel={endColumnResize}
            onKeyDown={(event) => handleColumnResizeKeyDown("right", event)}
          />
        )}
        <CorpusNavigator
          navigatorTab={state.navigatorTab}
          selectedInstrumentId={state.selectedInstrumentId}
          selectedProvisionId={state.selectedProvisionId}
          selectedConceptId={state.selectedConceptId}
          query={state.query}
          searchResults={
            state.query === deferredSearchQuery
              ? navigatorSearchResults
              : []
          }
          fullTextSearchState={fullCorpusLoadState}
          onSetNavigatorTab={setNavigatorTab}
          onOpenAtlas={openAtlas}
          onOpenInstrument={openInstrument}
          onOpenProvision={openProvision}
          onOpenConcept={openConcept}
          onRetryFullTextSearch={() => void ensureCompleteCorpus(true)}
        />

        <section
          id="legal-content-panel"
          ref={workspaceRef}
          className="workspace center-column-panel"
          aria-label="Legal source content"
        >
          <div className="workspace-status">
            <div className="workspace-location">
              <button
                type="button"
                className="interface-back-button"
                onClick={goBack}
                disabled={historyDepth === 0}
                aria-label="Return to previous interface"
              >
                <ArrowLeft aria-hidden="true" />
                BACK
              </button>
              <div className="breadcrumbs" aria-label="Current location">
                {breadcrumb.map((part, index) => (
                  <span key={part.key}>
                    {index > 0 && <i>/</i>}
                    <button
                      type="button"
                      onClick={() => followBreadcrumb(part.destination)}
                      aria-current={part.current ? "page" : undefined}
                    >
                      {part.label}
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <span className="view-code">
              VIEW::{
                state.navigatorTab === "concepts"
                  ? selectedConcept
                    ? "CONCEPT"
                    : "CONCEPT_INDEX"
                  : state.view.toUpperCase()
              }
            </span>
          </div>

          {state.navigatorTab === "sources" && state.view === "atlas" && (
            <GlobalAtlas
              onOpenInstrument={openInstrument}
            />
          )}
          {state.navigatorTab === "sources" && state.view === "research" && (
            <LazyResearchView
              input={researchCorpusInput}
              ready={fullCorpusLoadState.phase === "ready"}
              errorMessage={fullCorpusLoadState.error}
              initialView={researchView}
              initialCoverageScope={researchCoverage}
              initialRelevanceScope={researchRelevance}
              onViewChange={setResearchView}
              onCoverageScopeChange={setResearchCoverage}
              onRelevanceScopeChange={setResearchRelevance}
              onRetry={() => void ensureCompleteCorpus(true)}
              onBackToAtlas={openAtlas}
              onOpenInstrument={openInstrument}
              onOpenProvision={(provisionId) => {
                const provision = provisionMap.get(provisionId);
                if (provision) openProvision(provision);
              }}
              onOpenConcept={openConcept}
            />
          )}
          {state.navigatorTab === "concepts" && state.view === "atlas" && (
            <CoreConceptExplorer
              selectedConcept={selectedConcept}
              onOpenConcept={openConcept}
              onOpenInstrument={openInstrument}
              onOpenProvision={openProvision}
            />
          )}
          {state.navigatorTab === "sources" && state.view === "instrument" && selectedInstrument && (
            selectedInstrumentLoadState.phase === "error" ? (
              <CorpusLoadNotice
                state={selectedInstrumentLoadState}
                title={selectedInstrument.shortTitle}
                onRetry={() =>
                  void ensureInstrumentAvailable(selectedInstrument.id, true)
                }
                onBackToAtlas={openAtlas}
              />
            ) : (
              <>
                {selectedInstrumentLoadState.phase !== "ready" && (
                  <p className="restricted-text-note" role="status">
                    Loading complete provision text in the background. The
                    indexed structure remains available while the corpus shard
                    is retrieved.
                  </p>
                )}
                <InstrumentGenome
                  instrument={selectedInstrument}
                  onOpenProvision={openProvision}
                  onOpenInstrument={openInstrument}
                />
              </>
            )
          )}
          {state.navigatorTab === "sources" && state.view === "connections" && selectedProvision && (
            provisionReaderContent
          )}
          {state.navigatorTab === "sources" && state.view === "timeline" && selectedInstrument && (
            <LineageTimeline instrument={selectedInstrument} />
          )}
          {state.navigatorTab === "sources" && state.view === "compare" && (
            compareCorpusReady ? (
              <CompareView
                compareIds={state.compareIds}
                onRemove={(provisionId) =>
                  dispatch({ type: "REMOVE_COMPARE", provisionId })
                }
              />
            ) : (
              <CorpusLoadNotice
                state={compareCorpusState}
                title="the selected provisions"
                onRetry={() => {
                  comparedInstrumentIds.forEach((instrumentId) => {
                    void ensureInstrumentAvailable(instrumentId, true);
                  });
                }}
                onBackToAtlas={openAtlas}
              />
            )
          )}
        </section>

        {rightVisualizationPanel}
      </div>

      {state.navigatorTab === "sources" && (
        <CompareTray
          compareIds={state.compareIds}
          onOpen={() => openView("compare")}
          onRemove={(provisionId) =>
            dispatch({ type: "REMOVE_COMPARE", provisionId })
          }
          onClear={() => dispatch({ type: "CLEAR_COMPARE" })}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {selectedConcept
          ? "Core concept: " + selectedConcept.label + ". "
          : state.navigatorTab === "concepts"
            ? "Core concept index. "
            : viewLabels.find((view) => view.id === state.view)?.label + " view. "}
        {selectedConcept
          ? (conceptEvidenceById.get(selectedConcept.id)?.instrumentIds.size ?? 0) +
            " linked legal sources."
          : selectedProvision
          ? selectedProvision.locator +
            " selected with " +
            selectedRelations.length +
            " mapped provisions."
          : selectedInstrument
            ? selectedInstrument.shortTitle + " selected."
            : "Global regulatory atlas open."}
      </p>
    </main>
  );
}
