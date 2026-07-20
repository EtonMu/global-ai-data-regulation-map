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
const physicalLandGeoJson = JSON.parse(
  await readFile(
    new URL("../data/geo/natural-earth-land-110m.json", import.meta.url),
    "utf8",
  ),
);
const geographicDataNotes = await readFile(
  new URL("../data/geo/README.md", import.meta.url),
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

test("regulation globe forms continents from published physical-land geometry only", () => {
  assert.equal(physicalLandGeoJson.type, "FeatureCollection");
  assert.equal(physicalLandGeoJson.name, "ne_110m_land");
  assert.ok(physicalLandGeoJson.features.length > 100);
  assert.ok(
    physicalLandGeoJson.features.every(
      (feature) => feature.properties.featurecla === "Land",
    ),
  );
  assert.match(globeSource, /natural-earth-land-110m\.json/);
  assert.match(globeSource, /geoContains\(landGeometry/);
  assert.match(globeSource, /const LAND_POINTS = createLandPointCloud/);
  assert.doesNotMatch(globeSource, /ringContainsPoint|isLandPoint/);
  assert.match(geographicDataNotes, /physical land/i);
  assert.match(geographicDataNotes, /does not load or draw national/i);
  assert.match(geographicDataNotes, /public domain/i);
});

test("jurisdiction labels and an orientation-reset compass overlay the globe", () => {
  assert.match(globeSource, /const REGION_ANCHORS/);
  assert.match(globeSource, /const LABEL_OFFSETS/);
  assert.match(globeSource, /--map-offset-x/);
  assert.match(globeSource, /--map-offset-y/);
  assert.match(globeSource, /className=\{styles\.mapLabels\}/);
  assert.match(globeSource, /MAP_LABELS\[jurisdiction\.id\]/);
  assert.match(globeSource, /<JurisdictionMark jurisdictionId=\{jurisdiction\.id\} small/);
  assert.match(globeSource, /ref=\{compassRef\}/);
  assert.match(globeSource, /onClick=\{resetOrientation\}/);
  assert.match(globeSource, /aria-label="Reset globe to its north-up canonical orientation"/);
  assert.match(globeSource, /--compass-yaw/);
  assert.match(globeSource, /--compass-pitch/);
  assert.match(globeSource, /RESET_DURATION/);
  assert.match(globeSource, /requestAnimationFrame\(step\)/);
  assert.match(globeStyles, /\.compassButton/);
  assert.match(globeStyles, /\.compassRose/);
  assert.match(globeStyles, /rotate\(var\(--compass-yaw\)\)/);
  assert.match(globeStyles, /translate\(-50%, var\(--compass-pitch\)\)/);
  assert.match(globeStyles, /\.mapLabel/);
});

test("regulation globe reflows without a fixed panel width", () => {
  assert.doesNotMatch(globeStyles, /position:\s*fixed/);
  assert.match(globeStyles, /container-type:\s*inline-size/);
  assert.match(globeStyles, /@container \(max-width: 340px\)/);
  assert.match(globeStyles, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(globeStyles, /overflow-wrap:\s*anywhere/);
});
