import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const explorerSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

function sourceBetween(start, end) {
  const startIndex = explorerSource.indexOf(start);
  const endIndex = explorerSource.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `missing source boundary: ${start}`);
  assert.notEqual(endIndex, -1, `missing source boundary: ${end}`);
  return explorerSource.slice(startIndex, endIndex);
}

function sourceFrom(start) {
  const startIndex = explorerSource.indexOf(start);
  assert.notEqual(startIndex, -1, `missing source boundary: ${start}`);
  return explorerSource.slice(startIndex);
}

test("the legal-source navigator is presented as Global Atlas", () => {
  const navigatorSource = sourceBetween(
    "function CorpusNavigator(",
    "function GlobalAtlas(",
  );

  assert.match(
    navigatorSource,
    /<button(?=[^>]*role="tab")(?=[^>]*id="navigator-tab-sources")(?=[^>]*aria-selected=\{navigatorTab === "sources"\})[^>]*>[\s\S]*?<MapIcon[^>]*>[\s\S]*?GLOBAL ATLAS[\s\S]*?<\/button>/,
    "the sources tab must expose the Global Atlas name and selected state",
  );
  assert.match(
    navigatorSource,
    /className="atlas-home-button"[\s\S]*?onClick=\{onOpenAtlas\}[\s\S]*?GLOBAL ATLAS/,
    "the source index must provide a direct Global Atlas home action",
  );
  assert.doesNotMatch(
    navigatorSource,
    /LEGAL SOURCES/i,
    "the retired Legal Sources label must not remain in the navigator",
  );
});

test("workspace breadcrumbs are a native-button navigation hierarchy", () => {
  const breadcrumbModel = sourceBetween(
    "const breadcrumb = useMemo",
    "function followBreadcrumb(",
  );
  const breadcrumbMarkup = sourceBetween(
    '<div className="breadcrumbs" aria-label="Current location">',
    '{state.navigatorTab === "sources" &&',
  );

  assert.match(breadcrumbModel, /destination:/);
  assert.match(breadcrumbModel, /type: "atlas"/);
  assert.match(breadcrumbModel, /type: "concept-index"/);
  assert.match(breadcrumbModel, /type: "concept"/);
  assert.match(breadcrumbModel, /type: "instrument"/);
  assert.match(breadcrumbModel, /type: "provision"/);
  assert.match(
    breadcrumbMarkup,
    /breadcrumb\.map\(\(part, index\) =>/,
    "all levels must come from the same ordered breadcrumb model",
  );
  assert.match(
    breadcrumbMarkup,
    /<button[\s\S]*?type="button"/,
    "each breadcrumb level must use a native button",
  );
  assert.match(
    breadcrumbMarkup,
    /onClick=\{\(\) =>[\s\S]*?followBreadcrumb\(part\.destination\)/,
    "breadcrumb buttons must invoke hierarchy navigation",
  );
  assert.match(
    breadcrumbMarkup,
    /aria-current=\{part\.current \? "page" : undefined\}/,
    "the current breadcrumb leaf must expose aria-current on its button",
  );
  assert.doesNotMatch(
    breadcrumbMarkup,
    /disabled=/,
    "the current breadcrumb and every ancestor must remain clickable",
  );
  assert.doesNotMatch(
    breadcrumbMarkup,
    /<b>\{part\.label\}<\/b>/,
    "the current breadcrumb leaf must not fall back to non-interactive text",
  );
});

test("ProvisionReader exposes source-language text and labels official originals", () => {
  const readerSource = sourceBetween(
    "function ProvisionReader(",
    "function CompareTray(",
  );

  assert.match(
    readerSource,
    /const originalLanguage = provision!\.textAvailability\.language;[\s\S]*?const isOriginalLanguage\s*=\s*!\s*\/\^en[\s\S]*?\.test\(originalLanguage\)/,
    "original-language status must be derived from the provision language metadata",
  );
  assert.match(
    readerSource,
    /<div(?=[^>]*className="reader-document")(?=[^>]*role="tabpanel")(?=[^>]*lang=\{displayedLanguage\})(?=[^>]*data-text-language=\{displayedLanguage\})[^>]*>/,
    "the reader document must expose both the native lang attribute and an inspectable text-language marker",
  );
  assert.match(
    readerSource,
    /"ENGLISH LEGAL TEXT NOT STORED — COVERAGE NOTICE"[\s\S]*?"OFFICIAL ENGLISH TEXT"[\s\S]*?"ENGLISH REFERENCE TRANSLATION"[\s\S]*?"OFFICIAL ORIGINAL EXCERPT"[\s\S]*?"OFFICIAL EXCERPT"[\s\S]*?"OFFICIAL ORIGINAL TEXT"[\s\S]*?"OFFICIAL TEXT"[\s\S]*?"EDITORIAL SUMMARY"/,
    "stored originals, translations, excerpts, and editorial summaries must have distinct labels",
  );
  assert.match(
    readerSource,
    /renderedParagraphs\.map\(\(paragraph, index\) =>\s*\([\s\S]*?<p key=\{index\}/,
    "stored paragraphs must render as the legal text rather than only as a summary",
  );
});

test("concept and theme icon treatments are integrated at their semantic levels", () => {
  const navigatorSource = sourceBetween(
    "function CorpusNavigator(",
    "function GlobalAtlas(",
  );
  const conceptWorkspaceSource = sourceBetween(
    "function CoreConceptExplorer(",
    "function InstrumentGenome(",
  );

  assert.match(
    navigatorSource,
    /matchingConcepts\.map\(\(result\) => \{[\s\S]*?conceptById\.get\(result\.document\.id\)[\s\S]*?<ConceptIcon conceptId=\{concept\.id\}/,
    "concept search results must use each concept's own outline icon",
  );
  assert.match(
    navigatorSource,
    /className="concept-theme-label"[\s\S]*?<ConceptThemeIcon themeId=\{theme\.id\}/,
    "major theme rows must retain the theme-level solid icon treatment",
  );
  assert.match(
    navigatorSource,
    /className="tree-concept-list"[\s\S]*?<ConceptIcon conceptId=\{concept\.id\}/,
    "individual concept rows must use concept-level icons",
  );
  assert.match(
    conceptWorkspaceSource,
    /className="concept-theme-lane"[\s\S]*?<ConceptThemeIcon themeId=\{theme\.id\}[\s\S]*?className="concept-node"[\s\S]*?<ConceptIcon conceptId=\{concept\.id\}/,
    "concept cards must pair solid major-theme icons with outline concept icons",
  );
});

test("legal-text concept tags navigate into the Core Concepts workspace", () => {
  const reducerSource = sourceBetween(
    "function explorerReducer(",
    "function humanize(",
  );
  const readerSource = sourceBetween(
    "function ProvisionReader(",
    "function CompareTray(",
  );
  const openConceptSource = sourceBetween(
    "function openConcept(conceptId: string)",
    "function openAtlas()",
  );

  assert.match(
    readerSource,
    /className="concept-list"[\s\S]*?provision!\.conceptIds\.map\(\(conceptId\) =>[\s\S]*?<button[\s\S]*?type="button"/,
    "reader concept tags must use native buttons",
  );
  assert.match(
    readerSource,
    /className="concept-list"[\s\S]*?onClick=\{\(\) => onOpenConcept\(conceptId\)\}/,
    "reader concept tags must invoke the shared concept navigation callback",
  );
  assert.match(
    readerSource,
    /className="concept-list"[\s\S]*?<ConceptIcon conceptId=\{conceptId\}/,
    "reader concept tags must retain their individual concept icons",
  );
  assert.match(
    openConceptSource,
    /dispatch\(\{ type: "OPEN_CONCEPT", conceptId \}\)/,
    "concept-tag navigation must use the canonical OPEN_CONCEPT action",
  );
  assert.match(
    reducerSource,
    /case "OPEN_CONCEPT":[\s\S]*?navigatorTab:\s*"concepts"[\s\S]*?selectedConceptId:\s*action\.conceptId/,
    "OPEN_CONCEPT must move the user from a legal source into Core Concepts",
  );
});

test("Global Atlas mounts the interactive globe as a legal-to-concept bridge", () => {
  const explorerComponent = sourceFrom(
    "export default function RegulationExplorer()",
  );

  assert.match(
    explorerSource,
    /import \{ RegulationGlobe \} from "\.\/regulation-globe";/,
    "the atlas must use the dedicated interactive globe component",
  );
  assert.match(
    explorerSource,
    /const globeJurisdictions = atlasGroups\.map\([\s\S]*?instrumentIds:[\s\S]*?primaryInstrumentId:/,
    "globe jurisdiction nodes must resolve back to legal instruments",
  );
  assert.match(
    explorerSource,
    /const globeConcepts = \[[\s\S]*?conceptEvidenceById\.get\(concept\.id\)\?\.instrumentIds/,
    "globe concept nodes must be derived from the same evidence index as Core Concepts",
  );
  assert.match(
    explorerComponent,
    /const atlasGlobePanel\s*=\s*workspaceDensity === "research" &&[\s\S]*?state\.navigatorTab === "sources" &&[\s\S]*?state\.view === "atlas"[\s\S]*?<RegulationGlobe(?=[^>]*className="atlas-globe-panel right-column-panel")(?=[^>]*jurisdictions=\{globeJurisdictions\})(?=[^>]*concepts=\{globeConcepts\})(?=[^>]*onOpenInstrument=\{openInstrument\})(?=[^>]*onOpenConcept=\{openConcept\})[^>]*\/>/,
    "the full research workspace must show a right-panel globe wired to both legal sources and concepts",
  );
  assert.match(
    explorerComponent,
    /const rightVisualizationPanel\s*=\s*atlasGlobePanel[\s\S]*?<\/section>\s*\{rightVisualizationPanel\}/,
    "the globe must flow through the stable right visualization slot after legal content",
  );
});

test("instrument and Article states preserve fixed semantic columns", () => {
  const explorerComponent = sourceFrom(
    "export default function RegulationExplorer()",
  );

  assert.match(
    explorerComponent,
    /<section(?=[^>]*id="legal-content-panel")(?=[^>]*className="workspace center-column-panel")(?=[^>]*aria-label="Legal source content")[^>]*>/,
    "the center column must always be the legal-content workspace",
  );
  assert.match(
    explorerComponent,
    /state\.view === "connections"[\s\S]*?<ProvisionReader(?=[^>]*className="embedded-provision-reader")[\s\S]*?<section(?=[^>]*id="legal-content-panel")[\s\S]*?provisionReaderContent/,
    "Article text must remain embedded in the center legal-content column",
  );
  assert.match(
    explorerComponent,
    /const instrumentVisualizationPanel[\s\S]*?<aside(?=[^>]*id="right-column-panel")(?=[^>]*className="relationship-panel right-column-panel")[\s\S]*?<InstrumentConnectionCanvas/,
    "an open instrument must render its relationship graph in the right column",
  );
  assert.match(
    explorerComponent,
    /const provisionVisualizationPanel[\s\S]*?<aside(?=[^>]*id="right-column-panel")(?=[^>]*className="relationship-panel right-column-panel")[\s\S]*?<ConnectionCanvas/,
    "an open Article must render its relationship graph in the right column",
  );
  assert.doesNotMatch(
    globalStyles,
    /\.view-connections\s*>\s*\.workspace/,
    "responsive CSS must not swap the center workspace into the former graph position",
  );
  assert.match(globalStyles, /\.workspace\s*>\s*\.embedded-provision-reader\s*\{/);
});

test("instrument visualization links the law to concepts and every indexed Article", () => {
  const graphSource = sourceBetween(
    "function InstrumentConnectionCanvas(",
    "function ConnectionCanvas(",
  );

  assert.match(graphSource, /instrumentProvisions\.forEach\(\(provision\) =>/);
  assert.match(graphSource, /provision\.conceptIds\.forEach\(\(conceptId\) =>/);
  assert.match(
    graphSource,
    /className="instrument-concept-node"[\s\S]*?onClick=\{\(\) => onOpenConcept\(cluster\.concept\.id\)\}/,
    "concept nodes must navigate into Core Concepts",
  );
  assert.match(
    graphSource,
    /className="instrument-article-node"[\s\S]*?onClick=\{\(\) => onOpenProvision\(provision\)\}/,
    "Article nodes must open Article text in the center column",
  );
  assert.match(graphSource, /<details className="instrument-article-overflow">/);
  assert.match(graphSource, /<details className="instrument-cluster-overflow">/);
  assert.match(globalStyles, /\.instrument-knowledge-network\s*\{/);
  assert.match(
    globalStyles,
    /@container connections-workspace \(max-width: 430px\)[\s\S]*?\.instrument-concept-cluster\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    "the instrument graph must stack before labels can overlap",
  );
});

test("desktop columns can be collapsed, dragged, resized by keyboard, and restored", () => {
  const explorerComponent = sourceFrom(
    "export default function RegulationExplorer()",
  );

  assert.match(explorerComponent, /columnLayoutStorageKey/);
  assert.match(explorerComponent, /beginColumnResize/);
  assert.match(explorerComponent, /setPointerCapture/);
  assert.match(explorerComponent, /handleColumnResizeKeyDown/);
  assert.match(explorerComponent, /role="separator"/);
  assert.match(explorerComponent, /aria-orientation="vertical"/);
  assert.match(explorerComponent, /aria-controls="corpus-navigator-panel"/);
  assert.match(explorerComponent, /aria-controls="right-column-panel"/);
  assert.match(explorerComponent, /is-left-collapsed/);
  assert.match(explorerComponent, /is-right-collapsed/);
  assert.match(globalStyles, /--left-column-width/);
  assert.match(globalStyles, /--right-column-width/);
  assert.match(globalStyles, /\.column-resizer/);
  assert.match(
    globalStyles,
    /@media \(max-width: 1080px\)[\s\S]*?\.column-toggle,[\s\S]*?\.column-resizer\s*\{\s*display:\s*none/,
    "desktop panel controls must not disturb the responsive stacked layout",
  );
});

test("the connections view reflows against its resized column instead of fragmenting titles", () => {
  assert.match(
    globalStyles,
    /\.connections-view\s*\{[\s\S]*?container-name:\s*connections-workspace;[\s\S]*?container-type:\s*inline-size;/,
    "the visualization must establish a local size container",
  );
  assert.match(
    globalStyles,
    /\.connections-header h1\s*\{[\s\S]*?display:\s*grid;[\s\S]*?hyphens:\s*none;/,
    "the legal-source heading must reserve its own semantic rows",
  );
  assert.match(
    explorerSource,
    /className="connection-title-instrument"[\s\S]*?anchorInstrument\.shortTitle[\s\S]*?className="connection-title-locator"/,
    "the instrument name and provision locator must reflow independently",
  );
  assert.match(
    globalStyles,
    /\.connection-title-instrument,[\s\S]*?\.connection-title-locator\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-wrap:\s*break-word;[\s\S]*?word-break:\s*normal;/,
    "long titles may wrap at word boundaries without collapsing into a one-character column",
  );
  assert.match(
    globalStyles,
    /@container connections-workspace \(max-width: 640px\)[\s\S]*?\.connections-header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/,
    "a narrowed resizable column must stack the heading and readout",
  );
  assert.match(
    globalStyles,
    /@container connections-workspace \(max-width: 560px\)[\s\S]*?\.connection-canvas\s*\{[\s\S]*?display:\s*grid;[\s\S]*?\.connection-node\s*\{[\s\S]*?position:\s*relative;/,
    "the graph must become a legible node grid when its own column is narrow",
  );
});

test("a narrow source navigator stacks issuer metadata before titles fragment", () => {
  assert.match(
    globalStyles,
    /\.corpus-navigator\s*\{[\s\S]*?container-name:\s*corpus-navigation;[\s\S]*?container-type:\s*inline-size;/,
    "the resizable source navigator must expose its own container width",
  );
  assert.match(
    globalStyles,
    /@container corpus-navigation \(max-width: 230px\)[\s\S]*?\.tree-instrument-list button\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/,
    "instrument titles and issuer labels must stack when the navigator is narrow",
  );
  assert.match(
    globalStyles,
    /@container corpus-navigation \(max-width: 230px\)[\s\S]*?\.instrument-tree-title\s*\{[\s\S]*?overflow-wrap:\s*break-word;/,
    "narrow instrument titles must wrap at word boundaries",
  );
});

test("topic-relevant provisions and core-concept graph links are visible and navigable", () => {
  const genomeSource = sourceBetween(
    "function InstrumentGenome(",
    "function ConnectionCanvas(",
  );
  const connectionSource = sourceBetween(
    "function ConnectionCanvas(",
    "function LineageTimeline(",
  );

  assert.match(genomeSource, /isTopicRelevant \? "is-topic-relevant"/);
  assert.match(genomeSource, /className="provision-list-concepts"/);
  assert.match(globalStyles, /\.provision-list-item\.is-topic-relevant::before/);
  assert.match(
    connectionSource,
    /const conceptConnections = anchor\.conceptIds[\s\S]*?<ConceptIcon conceptId=\{concept\.id\}/,
    "the same provision-to-concept classification must appear in the graph",
  );
  assert.match(
    connectionSource,
    /className="connection-node concept-connection-node"[\s\S]*?onClick=\{\(\) => onOpenConcept\(concept\.id\)\}/,
    "concept graph nodes must open the corresponding concept",
  );
  assert.match(
    connectionSource,
    /<details className="graph-overflow-list">[\s\S]*?onClick=\{\(\) => onOpenConcept\(concept\.id\)\}[\s\S]*?overflowConnections\.map[\s\S]*?onOpenProvision\(item\.relatedProvision, item\.relation\.id\)/,
    "overflow concept and provision mappings must remain clickable",
  );
  assert.match(globalStyles, /\.concept-relation-line/);
});
