"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import jurisdictionsJson from "@/data/v2/jurisdictions.json";
import instrumentsJson from "@/data/v2/instruments.json";
import seedProvisionsJson from "@/data/v2/provisions.json";
import conceptsJson from "@/data/v2/concepts.json";
import relationsJson from "@/data/v2/relations.json";
import statusEventsJson from "@/data/v2/status-events.json";
import gdprArticlesJson from "@/data/v2/gdpr-articles.json";
import euAiActArticlesJson from "@/data/v2/eu-ai-act-articles.json";

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
    ceasedOn?: string | null;
  };
  version: string;
  parentInstrumentId?: string | null;
  topicIds: string[];
  summary: string;
  statusNote: string;
  source: Source;
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
  provisionType: string;
  parentId?: string | null;
  summary: string;
  conceptIds: string[];
  actorTags: string[];
  scopeTags: string[];
  legalEffectStatus: string;
  appliesFrom?: string | null;
  textAvailability: TextAvailability;
  source: Source;
  editorial: Editorial;
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

type Concept = {
  id: string;
  label: string;
  family: string;
  description: string;
  aliases: string[];
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

type View = "atlas" | "instrument" | "connections" | "timeline" | "compare";
type ReaderTab = "text" | "analysis" | "sources";

type ExplorerState = {
  view: View;
  selectedInstrumentId: string | null;
  selectedProvisionId: string | null;
  selectedRelationId: string | null;
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
  | { type: "SELECT_RELATION"; relationId: string }
  | { type: "SET_READER_TAB"; tab: ReaderTab }
  | { type: "SET_QUERY"; query: string }
  | { type: "ADD_COMPARE"; provisionId: string }
  | { type: "REMOVE_COMPARE"; provisionId: string }
  | { type: "CLEAR_COMPARE" };

const repositoryUrl =
  "https://github.com/EtonMu/global-ai-data-regulation-map";

const jurisdictions = jurisdictionsJson as Jurisdiction[];
const instruments = instrumentsJson as Instrument[];
const seedProvisions = seedProvisionsJson as SeedProvision[];
const concepts = conceptsJson as Concept[];
const relations = relationsJson as Relation[];
const statusEvents = statusEventsJson as StatusEvent[];
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
const seedProvisionById = new Map(
  seedProvisions.map((provision) => [provision.id, provision]),
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
  "historical-policy-overlap": "Historical policy overlap",
  "soft-law-alignment": "Soft-law alignment",
  "shared-legal-origin": "Shared legal origin",
  "policy-transition": "Policy transition",
  "grounded-in": "Grounded in",
  elaborates: "Elaborates",
  operationalizes: "Operationalizes",
  implements: "Implements",
  incorporated_by_reference: "Incorporated by reference",
  conflicts_with: "Potential conflict",
  supersedes: "Supersedes",
  revokes: "Revokes",
  revoked_by: "Revoked by",
  inspired_by: "Influenced by",
  complements: "Complementary control",
  aligned_with: "Aligned outcome",
};

const viewLabels: Array<{ id: View; label: string }> = [
  { id: "atlas", label: "Atlas" },
  { id: "instrument", label: "Instrument" },
  { id: "connections", label: "Connections" },
  { id: "timeline", label: "Timeline" },
  { id: "compare", label: "Compare" },
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
        selectedInstrumentId: null,
        selectedProvisionId: null,
        selectedRelationId: null,
        readerTab: "text",
      };
    case "OPEN_INSTRUMENT":
      return {
        ...state,
        view: "instrument",
        selectedInstrumentId: action.instrumentId,
        selectedProvisionId: null,
        selectedRelationId: null,
        readerTab: "text",
        query: "",
      };
    case "OPEN_PROVISION":
      return {
        ...state,
        view: "connections",
        selectedInstrumentId: action.instrumentId,
        selectedProvisionId: action.provisionId,
        selectedRelationId: action.relationId ?? null,
        readerTab: "text",
        query: "",
      };
    case "OPEN_VIEW":
      return { ...state, view: action.view };
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
    default:
      return state;
  }
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
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
    status.includes("ceased")
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
  instruments: Instrument[];
};

function buildAtlasGroups(): AtlasGroup[] {
  const groups = new Map<string, AtlasGroup>();
  instruments.forEach((instrument) => {
    const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
    const root = rootJurisdiction(instrument.jurisdictionId) ?? jurisdiction;
    const contextTypes = [jurisdiction?.type ?? "", root?.type ?? ""].join(" ");
    const international =
      contextTypes.includes("international") ||
      contextTypes.includes("intergovernmental") ||
      contextTypes.includes("standards");
    const key = international ? "international" : (root?.id ?? "other");
    const label = international
      ? "International & standards"
      : (root?.name ?? "Other");
    const group = groups.get(key) ?? {
      id: key,
      label,
      description:
        international
          ? "Multilateral principles, advisory reports and voluntary frameworks"
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
    .sort((left, right) => left.label.localeCompare(right.label));
}

const atlasGroups = buildAtlasGroups();

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

function groupProvisionSections(provisionList: Provision[]) {
  const hasOfficialSections = provisionList.some(
    (provision) => provision.section?.id,
  );
  const groups = new Map<
    string,
    { id: string; label: string; title: string; provisions: Provision[] }
  >();

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
      <span><i className="legend-shape binding" />Binding law</span>
      <span><i className="legend-shape executive" />Executive / agency</span>
      <span><i className="legend-shape proposal" />Proposal / bill</span>
      <span><i className="legend-shape soft" />Soft law / framework</span>
      <span><i className="legend-shape historical" />Historical / revoked</span>
    </div>
  );
}

function CorpusNavigator({
  selectedInstrumentId,
  selectedProvisionId,
  query,
  onOpenAtlas,
  onOpenInstrument,
  onOpenProvision,
}: {
  selectedInstrumentId: string | null;
  selectedProvisionId: string | null;
  query: string;
  onOpenAtlas: () => void;
  onOpenInstrument: (instrumentId: string) => void;
  onOpenProvision: (provision: Provision) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchingInstruments = normalizedQuery
    ? instruments
        .filter((instrument) =>
          [
            instrument.shortTitle,
            instrument.title,
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
            provision.summary,
            provision.fullText ?? "",
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
  const selectedInstrument = selectedInstrumentId
    ? instrumentById.get(selectedInstrumentId)
    : undefined;
  const selectedGroups = selectedInstrument
    ? groupInstrumentProvisions(selectedInstrument.id)
    : [];

  return (
    <aside className="corpus-navigator" aria-label="Global regulation corpus">
      <div className="navigator-header">
        <span className="terminal-label">CORPUS_NAV</span>
        <span>{instruments.length} instruments</span>
      </div>
      <button
        type="button"
        className="atlas-home-button"
        onClick={onOpenAtlas}
      >
        <span>◫</span>
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
              <span>{instrument.shortTitle}</span>
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
            <p className="navigator-empty">No indexed match.</p>
          )}
        </div>
      ) : (
        <div className="corpus-tree">
          {atlasGroups.map((group) => (
            <details
              key={group.id}
              open={
                group.instruments.some(
                  (instrument) => instrument.id === selectedInstrumentId,
                ) || group.id === atlasGroups[0]?.id
              }
            >
              <summary>
                <span>{group.label}</span>
                <small>{group.instruments.length}</small>
              </summary>
              <div className="tree-instrument-list">
                {group.instruments.map((instrument) => (
                  <button
                    type="button"
                    key={instrument.id}
                    className={
                      instrument.id === selectedInstrumentId
                        ? "is-selected"
                        : ""
                    }
                    aria-pressed={instrument.id === selectedInstrumentId}
                    onClick={() => onOpenInstrument(instrument.id)}
                  >
                    <span>{instrument.shortTitle}</span>
                    <small>
                      {jurisdictionById.get(instrument.jurisdictionId)
                        ?.shortName ?? instrument.jurisdictionId}
                    </small>
                  </button>
                ))}
              </div>
            </details>
          ))}

          {selectedInstrument && selectedGroups.length > 0 && (
            <details className="selected-article-tree" open>
              <summary>
                <span>{selectedInstrument.shortTitle} INDEX</span>
                <small>
                  {provisionsByInstrument.get(selectedInstrument.id)?.length ?? 0}
                </small>
              </summary>
              {selectedGroups.map((group) => (
                <details key={group.id}>
                  <summary>
                    <span>{group.label}</span>
                    <small>{group.provisions.length}</small>
                  </summary>
                  <div className="tree-provision-list">
                    {group.provisions.map((provision) => (
                      <button
                        type="button"
                        key={provision.id}
                        className={
                          provision.id === selectedProvisionId
                            ? "is-selected"
                            : ""
                        }
                        aria-pressed={provision.id === selectedProvisionId}
                        onClick={() => onOpenProvision(provision)}
                      >
                        <span>{provision.locator}</span>
                        <small>{provision.title}</small>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </details>
          )}
        </div>
      )}

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
  return (
    <section className="atlas-view" aria-labelledby="atlas-title">
      <div className="view-intro">
        <div>
          <p className="terminal-label">GLOBAL_REGULATORY_ATLAS / LIVE CORPUS</p>
          <h1 id="atlas-title">No single law is the center.</h1>
          <p>
            Navigate binding law, executive action, proposed legislation,
            standards and soft law as a versioned global system.
          </p>
        </div>
        <div className="corpus-readout" aria-label="Corpus status">
          <span><strong>{jurisdictions.length}</strong> jurisdictions</span>
          <span><strong>{instruments.length}</strong> instruments</span>
          <span><strong>{provisions.length}</strong> indexed provisions</span>
          <span><strong>{relations.length}</strong> qualified links</span>
        </div>
      </div>
      <NodeLegend />
      <div className="atlas-lanes">
        <div className="force-axis" aria-hidden="true">
          <span>JURISDICTION / AUTHORITY</span>
          <span>INSTRUMENT NODES →</span>
        </div>
        {atlasGroups.map((group, groupIndex) => (
          <section className="atlas-lane" key={group.id}>
            <header>
              <span className="lane-index">
                {String(groupIndex + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{group.label}</h2>
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
                      humanize(instrument.lifecycleStatus) +
                      ", " +
                      count +
                      " indexed provisions"
                    }
                  >
                    <span className="instrument-node-signal" aria-hidden="true" />
                    <strong>{instrument.shortTitle}</strong>
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
            INSTRUMENT_GENOME / {jurisdiction?.shortName ?? instrument.jurisdictionId}
          </p>
          <h1 id="instrument-title">{instrument.shortTitle}</h1>
          <p>{instrument.title}</p>
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
          {groups.map((group, groupIndex) => (
            <section className="genome-chapter" key={group.id}>
              <header>
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div>
                  <p>{group.label}</p>
                  <h2>{group.title}</h2>
                </div>
                <small>{group.provisions.length} nodes</small>
              </header>
              <div className="genome-sections">
                {groupProvisionSections(group.provisions).map((section) => (
                  <section className="genome-section" key={section.id}>
                    {(groupProvisionSections(group.provisions).length > 1 ||
                      !["chapter-root", "indexed-provisions"].includes(
                        section.id,
                      )) && (
                      <header>
                        <span>{section.label}</span>
                        <strong>{section.title}</strong>
                      </header>
                    )}
                    <div className="provision-grid">
                      {section.provisions.map((provision) => {
                        const mappingCount =
                          relationsByProvision.get(provision.id)?.length ?? 0;
                        return (
                          <button
                            type="button"
                            key={provision.id}
                            className={
                              mappingCount
                                ? "provision-cell has-mappings"
                                : "provision-cell"
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
                            <span>
                              {provision.locator.replace("Article ", "A")}
                            </span>
                            {mappingCount > 0 && (
                              <small aria-hidden="true">{mappingCount}</small>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>NO_LOCAL_TEXT_NODES</span>
          <h2>Corpus structure queued for ingestion.</h2>
          <p>
            The instrument is indexed with official status and source metadata,
            but its provision hierarchy has not yet been stored.
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
  const visible = connections.slice(0, 10);
  const positions = visible.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / visible.length;
    return {
      x: 50 + Math.cos(angle) * 38,
      y: 50 + Math.sin(angle) * 36,
      svgX: 500 + Math.cos(angle) * 380,
      svgY: 310 + Math.sin(angle) * 220,
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
          <span>{connections.length} direct links</span>
          <span>
            {connections.filter(({ relation }) => relation.status === "editorial-reviewed").length}{" "}
            reviewed ·{" "}
            {connections.filter(({ relation }) => relation.status === "candidate").length}{" "}
            candidate
          </span>
          <span>{anchor.conceptIds.length} concepts</span>
          <span>{humanize(anchor.legalEffectStatus)}</span>
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
                return (
                  <path
                    key={item.relation.id}
                    d={path}
                    className={[
                      "relation-line",
                      "relation-" + item.relation.type,
                      "mapping-" + item.relation.status,
                      item.relation.id === selectedRelationId
                        ? "is-selected"
                        : "",
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
            >
              <span>ANCHOR</span>
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
                    humanize(instrument.lifecycleStatus) +
                    ", " +
                    relationDirectionMarker(item.relation, anchor.id) +
                    " " +
                    relationLabel
                  }
                >
                  <span>
                    {relationDirectionMarker(item.relation, anchor.id)}{" "}
                    {relationLabel}
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
          <span>NO_REVIEWED_EDGE</span>
          <h2>This provision is indexed, but not isolated.</h2>
          <p>
            The absence of a visible link means no reviewed seed mapping has
            been published yet—not that no relationship exists.
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
                      <span>{jurisdiction?.shortName}</span>
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
  onAddCompare,
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
  onAddCompare: (provisionId: string) => void;
}) {
  const readerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [instrument?.id, provision?.id]);

  if (!instrument && !provision) {
    return (
      <aside
        ref={readerRef}
        className="provision-reader reader-idle"
        aria-label="Provision reader"
      >
        <span className="terminal-label">PROVISION_READER / STANDBY</span>
        <div className="idle-reticle" aria-hidden="true">
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
    return (
      <aside
        ref={readerRef}
        className="provision-reader"
        aria-label="Instrument metadata"
      >
        <span className="terminal-label">INSTRUMENT_RECORD</span>
        <div className="reader-heading">
          <small>{jurisdiction?.name}</small>
          <h2>{instrument.shortTitle}</h2>
          <p>{instrument.title}</p>
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
        </dl>
        <a
          className="official-source-button"
          href={instrument.source.url}
          target="_blank"
          rel="noreferrer"
        >
          OPEN OFFICIAL RECORD ↗
        </a>
      </aside>
    );
  }

  const activeInstrument = instrumentById.get(provision!.instrumentId)!;
  const jurisdiction = jurisdictionById.get(activeInstrument.jurisdictionId);
  const isCompared = compareIds.includes(provision!.id);
  const readerTabs: ReaderTab[] = ["text", "analysis", "sources"];

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + readerTabs.length) % readerTabs.length;
    const nextTab = readerTabs[nextIndex];
    onSetTab(nextTab);
    document.getElementById("reader-tab-" + nextTab)?.focus();
  }

  return (
    <aside ref={readerRef} className="provision-reader" aria-label="Provision reader">
      <span className="terminal-label">PROVISION_READER / {readerTab.toUpperCase()}</span>
      <div className="reader-heading">
        <small>
          {jurisdiction?.shortName} / {humanize(activeInstrument.legalForce)}
        </small>
        <h2>
          {activeInstrument.shortTitle} {provision!.locator}
        </h2>
        <p>{provision!.title}</p>
      </div>
      <div className="reader-status">
        <span className={"status-chip status-" + statusClass(activeInstrument)}>
          {humanize(activeInstrument.lifecycleStatus)}
        </span>
        <span>PROVISION::{humanize(provision!.legalEffectStatus)}</span>
        {provision!.appliesFrom && (
          <span>APPLIES::{formatDate(provision!.appliesFrom)}</span>
        )}
        <span>{provision!.textAvailability.language.toUpperCase()}</span>
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
          {isCompared ? "PINNED" : "ADD TO COMPARE"}
        </button>
        <a href={provision!.source.url} target="_blank" rel="noreferrer">
          OFFICIAL ↗
        </a>
      </div>
      <div className="reader-tabs" role="tablist" aria-label="Reader panels">
        {readerTabs.map((tab, index) => (
          <button
            type="button"
            role="tab"
            id={"reader-tab-" + tab}
            aria-controls={"reader-panel-" + tab}
            aria-selected={readerTab === tab}
            key={tab}
            onClick={() => onSetTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {readerTab === "text" && (
        <div
          id="reader-panel-text"
          className="reader-document"
          role="tabpanel"
          aria-labelledby="reader-tab-text"
        >
          <div className="document-provenance">
            <span>
              {provision!.paragraphs?.length
                ? "OFFICIAL TEXT"
                : "EDITORIAL SUMMARY"}
            </span>
            <span>{provision!.source.label}</span>
          </div>
          {provision!.paragraphs?.length ? (
            provision!.paragraphs!.map((paragraph, index) => (
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
              <span key={conceptId}>
                {conceptById.get(conceptId)?.label ?? conceptId}
              </span>
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
    selectedInstrumentId: null,
    selectedProvisionId: null,
    selectedRelationId: null,
    readerTab: "text",
    compareIds: [],
    query: "",
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const urlSyncReadyRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const instrumentId = params.get("instrument");
    const provisionId = params.get("provision");
    const requestedView = params.get("view") as View | null;
    const restoredProvision = provisionId
      ? provisionMap.get(provisionId)
      : undefined;
    const restoredInstrument = restoredProvision
      ? instrumentById.get(restoredProvision.instrumentId)
      : instrumentId
        ? instrumentById.get(instrumentId)
        : undefined;

    if (restoredProvision) {
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
  }, [state.selectedInstrumentId, state.selectedProvisionId, state.view]);

  const selectedInstrument = state.selectedInstrumentId
    ? instrumentById.get(state.selectedInstrumentId)
    : undefined;
  const selectedProvision = state.selectedProvisionId
    ? provisionMap.get(state.selectedProvisionId)
    : undefined;
  const selectedRelations = selectedProvision
    ? relationsByProvision.get(selectedProvision.id) ?? []
    : [];
  const effectiveRelation =
    (state.selectedRelationId
      ? relationById.get(state.selectedRelationId)
      : undefined) ?? selectedRelations[0];

  const breadcrumb = useMemo(() => {
    if (!selectedInstrument) return ["GLOBAL ATLAS"];
    const jurisdiction = jurisdictionById.get(
      selectedInstrument.jurisdictionId,
    );
    const parts = [
      jurisdiction?.shortName ?? selectedInstrument.jurisdictionId,
      selectedInstrument.shortTitle,
    ];
    if (selectedProvision) parts.push(selectedProvision.locator);
    return parts;
  }, [selectedInstrument, selectedProvision]);

  function openProvision(provision: Provision, relationId?: string) {
    dispatch({
      type: "OPEN_PROVISION",
      provisionId: provision.id,
      instrumentId: provision.instrumentId,
      relationId,
    });
  }

  const canOpenInstrument = Boolean(selectedInstrument);
  const canOpenConnections = Boolean(selectedProvision);
  const canOpenCompare = state.compareIds.length === 2;

  return (
    <main className="terminal-app">
      <header className="top-bar">
        <button
          type="button"
          className="wordmark"
          onClick={() => dispatch({ type: "OPEN_ATLAS" })}
          aria-label="Open Global AI Data Regulation Map atlas"
        >
          <span>GLOBAL AI · DATA</span>
          <strong>REGULATION MAP</strong>
        </button>
        <label className="global-search">
          <span className="sr-only">Search regulations and provisions</span>
          <i aria-hidden="true">⌕</i>
          <input
            ref={searchRef}
            type="search"
            value={state.query}
            onChange={(event) =>
              dispatch({ type: "SET_QUERY", query: event.target.value })
            }
            placeholder="Search instrument, article, concept…"
          />
          <kbd>⌘K</kbd>
        </label>
        <nav className="mode-switch" aria-label="Explorer mode">
          {viewLabels.map((view) => {
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
                onClick={() =>
                  dispatch({ type: "OPEN_VIEW", view: view.id })
                }
              >
                {view.label}
              </button>
            );
          })}
        </nav>
        <a
          className="github-link"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
        >
          GITHUB ↗
        </a>
      </header>

      <div className="system-strip">
        <span><i className="system-dot" /> CORPUS ONLINE</span>
        <span>SNAPSHOT 2026.07.19</span>
        <span>RESEARCH PREVIEW / NOT LEGAL ADVICE</span>
      </div>

      <div className={"app-shell view-" + state.view}>
        <CorpusNavigator
          selectedInstrumentId={state.selectedInstrumentId}
          selectedProvisionId={state.selectedProvisionId}
          query={state.query}
          onOpenAtlas={() => dispatch({ type: "OPEN_ATLAS" })}
          onOpenInstrument={(instrumentId) =>
            dispatch({ type: "OPEN_INSTRUMENT", instrumentId })
          }
          onOpenProvision={openProvision}
        />

        <section
          ref={workspaceRef}
          className="workspace"
          aria-label="Regulation visualization"
        >
          <div className="workspace-status">
            <div className="breadcrumbs" aria-label="Current location">
              {breadcrumb.map((part, index) => (
                <span key={part + index}>
                  {index > 0 && <i>/</i>}
                  {part}
                </span>
              ))}
            </div>
            <span className="view-code">
              VIEW::{state.view.toUpperCase()}
            </span>
          </div>

          {state.view === "atlas" && (
            <GlobalAtlas
              onOpenInstrument={(instrumentId) =>
                dispatch({ type: "OPEN_INSTRUMENT", instrumentId })
              }
            />
          )}
          {state.view === "instrument" && selectedInstrument && (
            <InstrumentGenome
              instrument={selectedInstrument}
              onOpenProvision={openProvision}
              onOpenInstrument={(instrumentId) =>
                dispatch({ type: "OPEN_INSTRUMENT", instrumentId })
              }
            />
          )}
          {state.view === "connections" && selectedProvision && (
            <ConnectionCanvas
              anchor={selectedProvision}
              selectedRelationId={effectiveRelation?.id ?? null}
              onOpenProvision={openProvision}
              onOpenInstrument={(instrumentId) =>
                dispatch({ type: "OPEN_INSTRUMENT", instrumentId })
              }
            />
          )}
          {state.view === "timeline" && selectedInstrument && (
            <LineageTimeline instrument={selectedInstrument} />
          )}
          {state.view === "compare" && (
            <CompareView
              compareIds={state.compareIds}
              onRemove={(provisionId) =>
                dispatch({ type: "REMOVE_COMPARE", provisionId })
              }
            />
          )}
        </section>

        {state.view !== "compare" && state.view !== "timeline" && (
          <ProvisionReader
            instrument={selectedInstrument}
            provision={selectedProvision}
            selectedRelation={effectiveRelation}
            relationsForProvision={selectedRelations}
            readerTab={state.readerTab}
            compareIds={state.compareIds}
            onSetTab={(tab) => dispatch({ type: "SET_READER_TAB", tab })}
            onSelectRelation={(relationId) =>
              dispatch({ type: "SELECT_RELATION", relationId })
            }
            onOpenProvision={openProvision}
            onOpenInstrument={(instrumentId) =>
              dispatch({ type: "OPEN_INSTRUMENT", instrumentId })
            }
            onAddCompare={(provisionId) =>
              dispatch({ type: "ADD_COMPARE", provisionId })
            }
          />
        )}
      </div>

      <CompareTray
        compareIds={state.compareIds}
        onOpen={() => dispatch({ type: "OPEN_VIEW", view: "compare" })}
        onRemove={(provisionId) =>
          dispatch({ type: "REMOVE_COMPARE", provisionId })
        }
        onClear={() => dispatch({ type: "CLEAR_COMPARE" })}
      />

      <p className="sr-only" aria-live="polite">
        {selectedProvision
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
