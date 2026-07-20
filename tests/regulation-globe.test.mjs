import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const globeSource = await readFile(
  new URL("../app/regulation-globe.tsx", import.meta.url),
  "utf8",
);
const globeStyles = await readFile(
  new URL("../app/regulation-globe.module.css", import.meta.url),
  "utf8",
);

test("regulation globe exposes an evidence-linked, accessible interaction contract", () => {
  assert.match(globeSource, /createFibonacciSphere/);
  assert.match(globeSource, /ResizeObserver/);
  assert.match(globeSource, /prefers-reduced-motion: reduce/);
  assert.match(globeSource, /onPointerDown=\{handlePointerDown\}/);
  assert.match(globeSource, /ArrowLeft/);
  assert.match(globeSource, /role="img"/);
  assert.match(globeSource, /JurisdictionMark/);
  assert.match(globeSource, /ConceptIcon/);
  assert.match(globeSource, /sharedInstrumentCount/);
  assert.match(globeSource, /onOpenInstrument/);
  assert.match(globeSource, /onOpenConcept/);
});

test("regulation globe reflows without a fixed panel width", () => {
  assert.doesNotMatch(globeStyles, /position:\s*fixed/);
  assert.match(globeStyles, /container-type:\s*inline-size/);
  assert.match(globeStyles, /@container \(max-width: 340px\)/);
  assert.match(globeStyles, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(globeStyles, /overflow-wrap:\s*anywhere/);
});
