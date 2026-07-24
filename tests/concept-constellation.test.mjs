import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../app/concept-constellation.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../app/concept-constellation.module.css", import.meta.url),
  "utf8",
);
const explorerSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("concept constellation exposes theme, concept, and evidence-source nodes", () => {
  assert.match(source, /ConceptThemeIcon/);
  assert.match(source, /ConceptIcon/);
  assert.match(source, /JurisdictionMark/);
  assert.match(source, /styles\.themeEdge/);
  assert.match(source, /className=\{styles\.sourceEdge\}/);
  assert.match(source, /onOpenConcept\(concept\.id\)/);
  assert.match(source, /onOpenInstrument\(instrument\.id\)/);
});

test("concept constellation is keyboard accessible and describes its graph", () => {
  assert.match(source, /type="button"/);
  assert.match(source, /aria-label={`Open core concept/);
  assert.match(source, /aria-label={`Open legal source/);
  assert.match(source, /role="group"/);
  assert.match(source, /aria-live="polite"/);
  assert.doesNotMatch(source, /tabIndex=/);
});

test("concept constellation reflows and honors reduced motion", () => {
  assert.match(source, /const SOURCE_RADIUS = 13/);
  assert.match(styles, /container-type:\s*inline-size/);
  assert.match(styles, /@container \(max-width: 380px\)/);
  assert.match(styles, /@container \(max-width: 320px\)/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /overflow-x:\s*hidden/);
  assert.match(styles, /overflow-y:\s*auto/);
  assert.doesNotMatch(styles, /position:\s*fixed/);
});

test("Core Concepts progressively mounts the constellation in the stable right panel", () => {
  assert.match(explorerSource, /import \{ ConceptConstellation \}/);
  assert.match(
    explorerSource,
    /state\.navigatorTab === "concepts"[\s\S]*?state\.view === "atlas"[\s\S]*?\(workspaceDensity === "research" \|\| Boolean\(state\.selectedConceptId\)\)[\s\S]*?<ConceptConstellation/,
  );
  assert.match(explorerSource, /selectedConceptId=\{state\.selectedConceptId\}/);
  assert.match(
    explorerSource,
    /const rightVisualizationPanel\s*=\s*atlasGlobePanel\s*\?\?\s*conceptVisualizationPanel[\s\S]*?\{rightVisualizationPanel\}/,
    "the concept constellation must occupy the stable right visualization column",
  );
  assert.match(
    globalStyles,
    /\.app-shell\.navigator-concepts-mode\.concept-visualization-active\s*\{[\s\S]*?grid-template-columns:\s*var\(--left-grid-width\)[\s\S]*?minmax\(0, 1fr\)[\s\S]*?var\(--right-grid-width\)/,
  );
});
