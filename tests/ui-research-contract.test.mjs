import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const explorerSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
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
    '<span className="view-code">',
  );

  assert.match(breadcrumbModel, /destination:/);
  assert.match(breadcrumbModel, /type: "atlas"/);
  assert.match(breadcrumbModel, /type: "concept-index"/);
  assert.match(breadcrumbModel, /type: "instrument"/);
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
    /aria-current=\{part\.destination \? undefined : "page"\}/,
    "the current breadcrumb leaf must expose aria-current on its button",
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
    /"EDITORIAL ENGLISH SUMMARY — NOT A TRANSLATION"[\s\S]*?"OFFICIAL ENGLISH TEXT"[\s\S]*?"ENGLISH REFERENCE TRANSLATION"[\s\S]*?"OFFICIAL ORIGINAL EXCERPT"[\s\S]*?"OFFICIAL EXCERPT"[\s\S]*?"OFFICIAL ORIGINAL TEXT"[\s\S]*?"OFFICIAL TEXT"[\s\S]*?"EDITORIAL SUMMARY"/,
    "stored originals, translations, excerpts, and editorial summaries must have distinct labels",
  );
  assert.match(
    readerSource,
    /availableParagraphs\.map\(\(paragraph, index\) =>\s*\([\s\S]*?<p key=\{index\}/,
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
    /matchingConcepts\.map\(\(concept\) =>[\s\S]*?<ConceptIcon conceptId=\{concept\.id\}/,
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
    /const atlasGlobePanel\s*=\s*state\.navigatorTab === "sources" && state\.view === "atlas"[\s\S]*?<RegulationGlobe(?=[^>]*className="atlas-globe-panel")(?=[^>]*jurisdictions=\{globeJurisdictions\})(?=[^>]*concepts=\{globeConcepts\})(?=[^>]*onOpenInstrument=\{openInstrument\})(?=[^>]*onOpenConcept=\{openConcept\})[^>]*\/>/,
    "the Global Atlas state must show a right-panel globe wired to both legal sources and concepts",
  );
  assert.match(
    explorerComponent,
    /<\/section>\s*\{atlasGlobePanel\}/,
    "the globe panel must be mounted alongside and after the central workspace",
  );
});
