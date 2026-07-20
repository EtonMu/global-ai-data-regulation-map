"use client";

import {
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
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
  Search,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import jurisdictionsJson from "@/data/v2/jurisdictions.json";
import instrumentsJson from "@/data/v2/instruments.json";
import seedProvisionsJson from "@/data/v2/provisions.json";
import conceptsJson from "@/data/v2/concepts.json";
import conceptThemesJson from "@/data/v2/concept-themes.json";
import relationsJson from "@/data/v2/relations.json";
import statusEventsJson from "@/data/v2/status-events.json";
import sourceAuditsJson from "@/data/v2/source-audit.json";
import gdprArticlesJson from "@/data/v2/gdpr-articles.json";
import euAiActArticlesJson from "@/data/v2/eu-ai-act-articles.json";
import structureSummariesJson from "@/data/v2/structure-summaries.json";
import { ConceptIcon, ConceptThemeIcon } from "./concept-icon";
import { ConceptConstellation } from "./concept-constellation";
import { JurisdictionMark } from "./jurisdiction-mark";
import { RegulationGlobe } from "./regulation-globe";

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
    };
  };
};

type ArticleRecord = {
  id: string;
  instrumentId: string;
  articleNumber: string;
  label: string;
  title: string;
  chapter: {
    id: string | null;
    label: string;
    title: string;
  };
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
  sourceFragment: string;
  retrievedOn: string;
};

type Provision = SeedProvision & {
  paragraphs?: string[];
  fullText?: string;
  chapter?: ArticleRecord["chapter"];
  section?: ArticleRecord["section"];
  articleNumber?: string;
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
  };
  localCoverage: {
    mode: string;
    localUnitCount: number;
    statement: string;
  };
};

type View = "atlas" | "instrument" | "connections" | "timeline" | "compare";
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

const jurisdictions = jurisdictionsJson as Jurisdiction[];
const instruments = instrumentsJson as Instrument[];
const seedProvisions = seedProvisionsJson as SeedProvision[];
const concepts = conceptsJson as Concept[];
const conceptThemes = [...(conceptThemesJson as ConceptTheme[])].sort(
  (left, right) => left.order - right.order,
);
const relations = relationsJson as Relation[];
const statusEvents = statusEventsJson as StatusEvent[];
const sourceAudits = sourceAuditsJson as SourceAudit[];
const structureSummaries = structureSummariesJson as StructureSummary[];
const articleRecords = [
  ...(gdprArticlesJson as ArticleRecord[]),
  ...(euAiActArticlesJson as ArticleRecord[]),
];

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

function articleToProvision(article: ArticleRecord): Provision {
  const seed = seedProvisionById.get(article.id);
  const base: SeedProvision = {
    id: article.id,
    instrumentId: article.instrumentId,
    locator: article.label,
    title: article.title,
    provisionType: "article",
    parentId: article.section?.id ?? article.chapter.id,
    summary:
      article.paragraphs[0] ??
      "Official article text is available from EUR-Lex.",
    conceptIds: [],
    actorTags: [],
    scopeTags: [],
    legalEffectStatus: "instrument-status-only",
    appliesFrom: null,
    textAvailability: {
      mode: "full",
      stored: true,
      language: article.language,
      note: "Official EUR-Lex text extracted from the published instrument.",
    },
    source: {
      url: article.sourceFragment,
      label: "EUR-Lex official text",
      accessedOn: article.retrievedOn,
    },
    editorial: {
      reviewStatus: "source-verified",
      reviewedOn: article.retrievedOn,
      note: "Hierarchy and text imported from official EUR-Lex XHTML.",
    },
  };

  return {
    ...base,
    ...seed,
    locator: seed?.locator ?? base.locator,
    title: seed?.title ?? base.title,
    summary: seed?.summary ?? base.summary,
    textAvailability: base.textAvailability,
    source: base.source,
    paragraphs: article.paragraphs,
    fullText: article.fullText,
    chapter: article.chapter,
    section: article.section,
    articleNumber: article.articleNumber,
  };
}

const provisionMap = new Map<string, Provision>();
articleRecords.forEach((article) => {
  provisionMap.set(article.id, articleToProvision(article));
});
seedProvisions.forEach((provision) => {
  if (!provisionMap.has(provision.id)) {
    provisionMap.set(provision.id, provision);
  }
});
const provisions = Array.from(provisionMap.values());

const provisionsByInstrument = new Map<string, Provision[]>();
provisions.forEach((provision) => {
  const list = provisionsByInstrument.get(provision.instrumentId) ?? [];
  list.push(provision);
  provisionsByInstrument.set(provision.instrumentId, list);
});

for (const list of provisionsByInstrument.values()) {
  list.sort((left, right) => {
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
  { id: "instrument", label: "Instrument", icon: BookOpenText },
  { id: "connections", label: "Connections", icon: Network },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "compare", label: "Compare", icon: Columns2 },
];

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
      return {
        ...state,
        view: action.view,
        navigatorTab: "sources",
        selectedConceptId: null,
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
    const framework = international || forceClass(instrument) === "soft";
    const key = framework ? "frameworks" : (root?.id ?? "other");
    const label = framework
      ? "International / Frameworks / Soft law"
      : (root?.name ?? "Other");
    const group = groups.get(key) ?? {
      id: key,
      label,
      markId: framework ? "int" : (root?.id ?? instrument.jurisdictionId),
      description:
        framework
          ? "Standards, multilateral principles, policy declarations and voluntary governance frameworks"
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
        label: provision.section?.label ?? "CHAPTER-LEVEL ARTICLES",
        title: provision.section?.title ?? "Articles outside a named section",
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
  onSetNavigatorTab,
  onOpenAtlas,
  onOpenInstrument,
  onOpenProvision,
  onOpenConcept,
}: {
  navigatorTab: NavigatorTab;
  selectedInstrumentId: string | null;
  selectedProvisionId: string | null;
  selectedConceptId: string | null;
  query: string;
  onSetNavigatorTab: (tab: NavigatorTab) => void;
  onOpenAtlas: () => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provision: Provision) => void;
  onOpenConcept: (conceptId: string) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
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
    ? instruments
        .filter((instrument) =>
          [
            instrument.shortTitle,
            instrument.title,
            instrument.originalTitle ?? "",
            instrument.summary,
            jurisdictionById.get(instrument.jurisdictionId)?.name ?? "",
            ...instrument.topicIds.map(
              (conceptId) => conceptById.get(conceptId)?.label ?? conceptId,
            ),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
        .slice(0, 12)
    : [];
  const matchingProvisions = normalizedQuery
    ? provisions
        .filter((provision) => {
          const instrument = instrumentById.get(provision.instrumentId);
          return [
            instrument?.shortTitle ?? "",
            provision.locator,
            provision.title,
            provision.originalTitle ?? "",
            provision.summary,
            provision.fullText ?? "",
            ...(provision.translations?.en?.paragraphs ?? []),
            ...provision.conceptIds.map(
              (conceptId) => conceptById.get(conceptId)?.label ?? conceptId,
            ),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        })
        .slice(0, 18)
    : [];
  const matchingConcepts = normalizedQuery
    ? concepts
        .filter((concept) =>
          [concept.label, concept.description, concept.summary, ...concept.aliases]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
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
    onSetNavigatorTab(nextTab);
    document.getElementById("navigator-tab-" + nextTab)?.focus();
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
                  {matchingInstruments.map((instrument) => (
                    <button
                      type="button"
                      key={instrument.id}
                      onClick={() => onOpenInstrument(instrument.id)}
                    >
                      <span className="instrument-tree-title">
                        <JurisdictionMark jurisdictionId={instrument.jurisdictionId} small />
                        {instrument.shortTitle}
                      </span>
                      <small>{humanize(instrument.lifecycleStatus)}</small>
                    </button>
                  ))}
                  {matchingProvisions.map((provision) => (
                    <button
                      type="button"
                      key={provision.id}
                      onClick={() => onOpenProvision(provision)}
                    >
                      <span>
                        {instrumentById.get(provision.instrumentId)?.shortTitle}{" "}
                        {provision.locator}
                      </span>
                      <small>{provision.title}</small>
                    </button>
                  ))}
                  {!matchingInstruments.length && !matchingProvisions.length && (
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
                                instrument.jurisdictionId)
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
                            <small>
                              {jurisdictionById.get(instrument.jurisdictionId)?.shortName ??
                                instrument.jurisdictionId}
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
              {matchingConcepts.map((concept) => (
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
        <time dateTime="2026-07-19">2026.07.19</time>
      </div>
    </aside>
  );
}

function GlobalAtlas({
  onOpenInstrument,
}: {
  onOpenInstrument: (instrumentId: string) => void;
}) {
  const frameworkCount =
    atlasGroups.find((group) => group.id === "frameworks")?.instruments.length ?? 0;
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
          <span><strong>{frameworkCount}</strong> frameworks</span>
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
                    <span>{humanize(instrument.category)}</span>
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
  const groups = groupInstrumentProvisions(instrument.id);
  const total = provisionsByInstrument.get(instrument.id)?.length ?? 0;
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
          <span>{total} indexed provisions</span>
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
        </dl>
      </div>

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
                <small>{group.provisions.length} articles</small>
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
                      aria-label={section.title + " articles"}
                    >
                      {section.provisions.map((provision) => {
                        const mappingCount =
                          relationsByProvision.get(provision.id)?.length ?? 0;
                        return (
                          <li key={provision.id}>
                          <button
                            type="button"
                            className={
                              mappingCount
                                ? "provision-list-item has-mappings"
                                : "provision-list-item"
                            }
                            onClick={() => onOpenProvision(provision)}
                            aria-label={
                              provision.locator +
                              ", " +
                              provision.title +
                              ", " +
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
                              <small>{provision.summary}</small>
                            </span>
                            <span
                              className="provision-list-mappings"
                              aria-hidden="true"
                            >
                              <Network aria-hidden="true" />
                              {mappingCount}
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

function ConnectionCanvas({
  anchor,
  selectedRelationId,
  onOpenProvision,
  onOpenInstrument,
}: {
  anchor: Provision;
  selectedRelationId: string | null;
  onOpenProvision: (provision: Provision, relationId?: string) => void;
  onOpenInstrument: (instrumentId: string) => void;
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
  const visible = connections.slice(0, 8);
  const positions = visible.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / visible.length;
    return {
      x: 50 + Math.cos(angle) * 34,
      y: 50 + Math.sin(angle) * 35,
      svgX: 500 + Math.cos(angle) * 340,
      svgY: 310 + Math.sin(angle) * 214,
    };
  });

  return (
    <section className="connections-view" aria-labelledby="connections-title">
      <div className="connections-header">
        <div>
          <p className="terminal-label">ONE_HOP_PROVISION_NEIGHBORHOOD</p>
          <h1 id="connections-title">
            {anchorInstrument.shortTitle} {anchor.locator}
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

      {visible.length ? (
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
          {connections.length > visible.length && (
            <p className="graph-overflow">
              +{connections.length - visible.length} additional mappings
              collapsed to preserve legibility.
            </p>
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
                    {provision.paragraphs?.length ? (
                      provision.paragraphs.map((paragraph, index) => (
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
  id?: string;
  className?: string;
}) {
  const readerRef = useRef<HTMLElement>(null);
  const [languageSelection, setLanguageSelection] = useState<{
    provisionId: string | null;
    language: "original" | "en";
  }>({ provisionId: null, language: "en" });
  const readerLanguage =
    languageSelection.provisionId === (provision?.id ?? null)
      ? languageSelection.language
      : "en";
  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [instrument?.id, provision?.id]);

  function setReaderLanguage(language: "original" | "en") {
    setLanguageSelection({
      provisionId: provision?.id ?? null,
      language,
    });
  }

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
  const hasEnglishTranslation = Boolean(englishTranslation?.paragraphs.length);
  const showLanguageSwitch = isOriginalLanguage && originalParagraphs.length > 0;
  const showingEnglish = showLanguageSwitch && readerLanguage === "en";
  const englishSummaryFallback = showingEnglish && !hasEnglishTranslation;
  const availableParagraphs = showingEnglish
    ? hasEnglishTranslation
      ? englishTranslation!.paragraphs
      : [provision!.summary]
    : originalParagraphs;
  const displayedLanguage = showingEnglish ? "en" : originalLanguage;
  const isStoredExcerpt = provision!.textAvailability.mode.includes("excerpt");
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
          <button
            type="button"
            aria-pressed={readerLanguage === "en"}
            onClick={() => setReaderLanguage("en")}
          >
            {hasEnglishTranslation ? "ENGLISH" : "ENGLISH SUMMARY"}
          </button>
          <button
            type="button"
            aria-pressed={readerLanguage === "original"}
            onClick={() => setReaderLanguage("original")}
          >
            {nativeLanguageLabel(originalLanguage)}
          </button>
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
          <div className="document-provenance">
            <span>
              <FileText aria-hidden="true" />
              {availableParagraphs.length
                ? englishSummaryFallback
                  ? "EDITORIAL ENGLISH SUMMARY — NOT A TRANSLATION"
                  : showingEnglish && englishTranslation
                    ? englishTranslation.status === "official"
                      ? "OFFICIAL ENGLISH TEXT"
                      : "ENGLISH REFERENCE TRANSLATION"
                    : isStoredExcerpt
                  ? isOriginalLanguage
                    ? "OFFICIAL ORIGINAL EXCERPT"
                    : "OFFICIAL EXCERPT"
                  : isOriginalLanguage
                    ? "OFFICIAL ORIGINAL TEXT"
                    : "OFFICIAL TEXT"
                : "EDITORIAL SUMMARY"}
            </span>
            <span>
              {showingEnglish && englishTranslation?.source
                ? englishTranslation.source.label
                : provision!.source.label}
            </span>
          </div>
          {availableParagraphs.length ? (
            availableParagraphs.map((paragraph, index) => (
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
          {englishSummaryFallback && (
            <div className="restricted-text-note">
              <strong>Translation coverage pending</strong>
              <p>
                This English view is an editorial summary, not a translation of
                the statutory text. Use the original-language view for the
                complete official wording.
              </p>
            </div>
          )}
          {showingEnglish && englishTranslation?.note && (
            <div className="translation-status-note">
              <strong>
                {englishTranslation.status === "official"
                  ? "Official translation"
                  : "Reference translation"}
              </strong>
              <p>{englishTranslation.note}</p>
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
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, () => "dark");
  const [columnLayout, setColumnLayout] = useState<ColumnLayout>(
    defaultColumnLayout,
  );
  const [columnLayoutReady, setColumnLayoutReady] = useState(false);
  const [activeColumnResize, setActiveColumnResize] =
    useState<ColumnSide | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const appShellRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const columnResizeRef = useRef<ColumnResize>(null);
  const urlSyncReadyRef = useRef(false);
  const transitionRef = useRef<SameDocumentViewTransition | null>(null);
  const transitionTokenRef = useRef(0);
  const navigationHistoryRef = useRef<ExplorerState[]>([]);
  const hasRightColumn =
    state.view === "atlas" ||
    (state.navigatorTab === "sources" &&
      (state.view === "instrument" || state.view === "connections"));

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

  function goBack() {
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
    if (state.navigatorTab === nextTab) return;
    rememberCurrentInterface();
    dispatch({ type: "SET_NAVIGATOR_TAB", tab: nextTab });
  }

  function openConceptIndex() {
    if (state.navigatorTab === "concepts" && !state.selectedConceptId) return;
    rememberCurrentInterface();
    runVisualTransition(
      "view",
      () => dispatch({ type: "SET_NAVIGATOR_TAB", tab: "concepts" }),
      { nextView: "atlas", direction: "backward" },
    );
  }

  function openConcept(conceptId: string) {
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
    const restoredConcept = conceptId ? conceptById.get(conceptId) : undefined;
    const restoredProvision = provisionId
      ? provisionMap.get(provisionId)
      : undefined;
    const restoredInstrument = restoredProvision
      ? instrumentById.get(restoredProvision.instrumentId)
      : instrumentId
        ? instrumentById.get(instrumentId)
        : undefined;

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
  ]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        dispatch({ type: "SET_QUERY", query: "" });
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

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
  }, [selectedConcept, selectedInstrument, selectedProvision, state.navigatorTab]);

  function followBreadcrumb(
    destination: (typeof breadcrumb)[number]["destination"],
  ) {
    if (destination.type === "concept-index") {
      openConceptIndex();
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
  const readerPanel =
    state.navigatorTab === "sources" &&
    state.view !== "atlas" &&
    state.view !== "compare" &&
    state.view !== "timeline" ? (
      <ProvisionReader
        instrument={selectedInstrument}
        provision={selectedProvision}
        id={state.view === "connections" ? undefined : "right-column-panel"}
        className={
          state.view === "connections"
            ? "center-column-panel"
            : "right-column-panel"
        }
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
      />
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
        <label className="global-search">
          <span className="sr-only">Search legal sources and core concepts</span>
          <Search aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={state.query}
            onChange={(event) =>
              dispatch({ type: "SET_QUERY", query: event.target.value })
            }
            placeholder="Search legal source or core concept…"
          />
          <kbd>⌘K</kbd>
        </label>
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
        <span>SNAPSHOT 2026.07.19</span>
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
        ].filter(Boolean).join(" ")}
        style={appShellStyle}
      >
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
          onSetNavigatorTab={setNavigatorTab}
          onOpenAtlas={openAtlas}
          onOpenInstrument={openInstrument}
          onOpenProvision={openProvision}
          onOpenConcept={openConcept}
        />

        {state.view === "connections" && readerPanel}

        <section
          id={state.view === "connections" ? "right-column-panel" : undefined}
          ref={workspaceRef}
          className={[
            "workspace",
            state.view === "connections"
              ? "right-column-panel"
              : "center-column-panel",
          ].join(" ")}
          aria-label="Regulation visualization"
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
          {state.navigatorTab === "concepts" && state.view === "atlas" && (
            <CoreConceptExplorer
              selectedConcept={selectedConcept}
              onOpenConcept={openConcept}
              onOpenInstrument={openInstrument}
              onOpenProvision={openProvision}
            />
          )}
          {state.navigatorTab === "sources" && state.view === "instrument" && selectedInstrument && (
            <InstrumentGenome
              instrument={selectedInstrument}
              onOpenProvision={openProvision}
              onOpenInstrument={openInstrument}
            />
          )}
          {state.navigatorTab === "sources" && state.view === "connections" && selectedProvision && (
            <ConnectionCanvas
              anchor={selectedProvision}
              selectedRelationId={effectiveRelation?.id ?? null}
              onOpenProvision={openProvision}
              onOpenInstrument={openInstrument}
            />
          )}
          {state.navigatorTab === "sources" && state.view === "timeline" && selectedInstrument && (
            <LineageTimeline instrument={selectedInstrument} />
          )}
          {state.navigatorTab === "sources" && state.view === "compare" && (
            <CompareView
              compareIds={state.compareIds}
              onRemove={(provisionId) =>
                dispatch({ type: "REMOVE_COMPARE", provisionId })
              }
            />
          )}
        </section>

        {atlasGlobePanel}
        {conceptVisualizationPanel}
        {state.navigatorTab === "sources" &&
          state.view !== "connections" &&
          state.view !== "atlas" &&
          readerPanel}
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
