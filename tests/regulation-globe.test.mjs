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
const landPoints = JSON.parse(
  await readFile(
    new URL("../data/geo/natural-earth-land-points.json", import.meta.url),
    "utf8",
  ),
);
const globeBuildSource = await readFile(
  new URL("../scripts/build-globe-points.mjs", import.meta.url),
  "utf8",
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
  assert.ok(landPoints.length > 4_000);
  assert.ok(
    landPoints.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 3 &&
        point.every((coordinate) => Number.isFinite(coordinate)),
    ),
  );
  assert.match(globeBuildSource, /natural-earth-land-110m\.json/);
  assert.match(globeBuildSource, /geoContains\(collection/);
  assert.match(globeSource, /natural-earth-land-points\.json/);
  assert.match(globeSource, /const LAND_POINTS: Vector3\[\]/);
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

test("automatic rotation is opt-in, frame-capped, and interruption aware", () => {
  assert.match(globeSource, /autoRotate\?: boolean/);
  assert.match(
    globeSource,
    /autoRotate = false/,
    "embedded research globes must remain still unless a caller opts in",
  );
  assert.match(globeSource, /AUTO_ROTATION_FRAME_INTERVAL\s*=\s*1000\s*\/\s*30/);
  assert.match(globeSource, /if \(!autoRotate \|\| reducedMotion\) return/);
  assert.match(globeSource, /new IntersectionObserver/);
  assert.match(globeSource, /document\.hidden/);
  assert.match(globeSource, /visibilitychange/);
  assert.match(globeSource, /pointerInsideRef\.current/);
  assert.match(globeSource, /focusInsideRef\.current/);
  assert.match(globeSource, /Boolean\(dragRef\.current\)/);
  assert.match(globeSource, /Boolean\(resetAnimationRef\.current\)/);
  assert.match(globeSource, /window\.requestAnimationFrame\(animate\)/);
});

test("globe motion is exposed for landing parallax and map tags remain navigable", () => {
  assert.match(globeSource, /export type RegulationGlobeMotion/);
  assert.match(globeSource, /onMotionChange\?: \(motion: RegulationGlobeMotion\) => void/);
  assert.match(globeSource, /onMotionChangeRef\.current\?\.\(/);
  assert.match(globeSource, /horizontal:\s*Math\.sin\(yawRef\.current\)/);
  assert.match(globeSource, /vertical:\s*Math\.sin\(pitchRef\.current\)/);
  assert.match(globeSource, /isDragging:\s*dragging/);
  assert.match(
    globeSource,
    /pitchRef\.current - deltaY \* 0\.006/,
    "vertical dragging must move the globe content with the pointer",
  );
  assert.match(
    globeSource,
    /className=\{classNames\([\s\S]*?styles\.mapLabel[\s\S]*?styles\.isActiveMapLabel/,
  );
  assert.match(
    globeSource,
    /onClick=\{\(\) => \{[\s\S]*?onOpenInstrument\(primaryInstrumentId\)/,
  );
  assert.match(globeSource, /onPointerEnter=\{\(\) => setActiveNode\(key\)\}/);
  assert.match(globeSource, /aria-label=\{`Open \$\{jurisdiction\.label\} jurisdiction/);
  assert.match(globeStyles, /\.mapLabel:hover,[\s\S]*?\.isActiveMapLabel/);
  assert.match(globeStyles, /\.mapLabel\s*\{[\s\S]*?pointer-events:\s*auto/);
});

test("hero presentation keeps the landing globe visually dominant", () => {
  assert.match(globeSource, /presentation\?: "atlas" \| "hero"/);
  assert.match(globeSource, /presentation = "atlas"/);
  assert.match(
    globeSource,
    /classNames\([\s\S]*?presentation === "hero" && styles\.heroPanel/,
  );
  assert.match(
    globeSource,
    /presentation === "atlas" \? \([\s\S]*?className=\{styles\.header\}/,
    "hero presentation must omit the embedded research-panel header",
  );
  assert.match(
    globeSource,
    /presentation === "atlas" \? <div className=\{styles\.nodeDirectory\}>/,
    "hero presentation must omit the research node directory",
  );
  assert.match(globeStyles, /\.heroPanel\s*\{/);
  assert.match(globeStyles, /\.heroStage\s*\{/);
});

test("regulation globe reflows without a fixed panel width", () => {
  assert.doesNotMatch(globeStyles, /position:\s*fixed/);
  assert.match(globeStyles, /container-type:\s*inline-size/);
  assert.match(globeStyles, /@container \(max-width: 340px\)/);
  assert.match(globeStyles, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(globeStyles, /overflow-wrap:\s*anywhere/);
});
