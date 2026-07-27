import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const [explorerSource, searchSource, styles] = await Promise.all([
  readFile(new URL("app/regulation-explorer.tsx", projectRoot), "utf8"),
  readFile(new URL("app/search-combobox.tsx", projectRoot), "utf8"),
  readFile(new URL("app/globals.css", projectRoot), "utf8"),
]);

function sourceBetween(start, end) {
  const startIndex = explorerSource.indexOf(start);
  const endIndex = explorerSource.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `missing source boundary: ${start}`);
  assert.notEqual(endIndex, -1, `missing source boundary: ${end}`);
  return explorerSource.slice(startIndex, endIndex);
}

test("a first visit opens an independent, low-complexity welcome surface", () => {
  const reducerSource = sourceBetween(
    "function explorerReducer(",
    "function explorerStateFromHash(",
  );
  const hashRestoreSource = sourceBetween(
    "function explorerStateFromHash(",
    "function humanize(",
  );
  const explorerComponent = explorerSource.slice(
    explorerSource.indexOf("export default function RegulationExplorer()"),
  );

  assert.match(
    explorerSource,
    /type View\s*=\s*[\s\S]*?\| "landing"/,
    "landing must be a first-class explorer state",
  );
  assert.match(
    reducerSource,
    /case "OPEN_LANDING":[\s\S]*?view:\s*"landing"/,
    "the reducer must provide one canonical route back to the welcome surface",
  );
  assert.match(
    hashRestoreSource,
    /view:\s*serializedHash \? "atlas" : "landing"[\s\S]*?if \(!serializedHash \|\| requestedView === "landing"\)[\s\S]*?restored\.view = "landing"/,
    "an empty or explicit landing URL must restore the welcome surface",
  );
  assert.match(
    explorerComponent,
    /useReducer\(explorerReducer,\s*{[\s\S]*?view:\s*"landing"/,
    "the client must initialize on the welcome surface",
  );

  const landingReturnIndex = explorerComponent.search(
    /state\.view === "landing"[\s\S]*?return\s*\([\s\S]*?<AtlasLanding/,
  );
  const workspaceReturnIndex = explorerComponent.indexOf(
    '<main className="terminal-app"',
  );
  assert.ok(landingReturnIndex >= 0, "landing must render through AtlasLanding");
  assert.ok(
    landingReturnIndex < workspaceReturnIndex,
    "landing must return before the three-column research workspace mounts",
  );
});

test("the landing page offers three clear routes around a prominent hero globe", () => {
  const landingSource = sourceBetween(
    "function AtlasLanding(",
    "export default function RegulationExplorer()",
  );

  assert.match(
    landingSource,
    /<LandingRegulationGlobe(?=[^>]*presentation="hero")(?=[^>]*autoRotate)(?=[^>]*onMotionChange=)[^>]*\/>/,
    "the welcome surface must opt its prominent globe into hero presentation and motion",
  );
  assert.match(
    landingSource,
    /Browse laws[\s\S]*?Explore Core Concepts[\s\S]*?Visualizer Research/,
    "the three entry labels must remain explicit and consistently ordered",
  );
  assert.match(
    landingSource,
    /handleGlobeMotion[\s\S]*?style\.setProperty\("--path-x"[\s\S]*?style\.setProperty\("--path-y"/,
    "globe motion must drive restrained entry-card parallax through CSS variables",
  );
  assert.match(landingSource, /onMotionChange=\{handleGlobeMotion\}/);
  for (const theme of [
    /global corpus/i,
    /data regulation/i,
    /AI governance/i,
    /Mapping laws/i,
    /interactive visualization/i,
  ]) {
    assert.match(
      landingSource,
      theme,
      "welcome copy must foreground the corpus, mapping and visualization mission",
    );
  }

  assert.match(
    landingSource,
    /className="landing-scene landing-intro-scene"[\s\S]*?className="landing-globe-layer"[\s\S]*?className="landing-scene landing-explore-scene"[\s\S]*?className="landing-pathways"/,
    "the landing story must progress from a text-led first scene into a globe-led action scene",
  );
  assert.match(
    styles,
    /\.landing-story\s*{[\s\S]*?min-height:\s*calc\(200svh\s*-\s*var\(--landing-header-height\)\s*-\s*var\(--landing-header-height\)\);/,
    "the landing story must provide two full-height scenes below the persistent banner",
  );
  assert.match(
    styles,
    /\.landing-story-viewport\s*{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*var\(--landing-header-height\);[\s\S]*?height:\s*calc\(100svh\s*-\s*var\(--landing-header-height\)\);/,
    "both scenes must share one pinned cinematic viewport",
  );
  assert.match(
    styles,
    /\.landing-header\s*{[\s\S]*?position:\s*sticky;[\s\S]*?z-index:\s*50;[\s\S]*?top:\s*0;/,
    "the existing banner must remain above both landing scenes",
  );

  assert.match(
    landingSource,
    /window\.addEventListener\("scroll", queueScrollState, \{ passive: true \}\)/,
    "scroll-linked landing motion must use a passive listener",
  );
  assert.match(
    landingSource,
    /const queueScrollState = \(\) => \{[\s\S]*?window\.requestAnimationFrame\([\s\S]*?renderScrollState/,
    "scroll-linked landing motion must be frame-throttled",
  );
  for (const property of [
    "--landing-globe-scale",
    "--landing-globe-y",
    "--landing-copy-opacity",
    "--landing-copy-y",
    "--landing-veil-opacity",
    "--landing-pathways-opacity",
    "--landing-pathways-y",
  ]) {
    assert.match(
      landingSource,
      new RegExp(`style\\.setProperty\\(\\s*"${property}"`),
      `${property} must be driven by landing scroll progress`,
    );
  }
  assert.match(
    landingSource,
    /const storyRect = story\.getBoundingClientRect\(\)[\s\S]*?const travel = Math\.max\(1, storyRect\.height - availableHeight\)[\s\S]*?const progress = scrolled \/ travel/,
    "motion progress must be measured across the dedicated two-scene story",
  );
  assert.match(
    landingSource,
    /const startScale = shortViewport[\s\S]*?compact[\s\S]*?0\.3[\s\S]*?0\.44[\s\S]*?0\.68[\s\S]*?0\.61[\s\S]*?0\.54[\s\S]*?const endScale = shortViewport[\s\S]*?: 1\.2;[\s\S]*?startY \+ eased \* \(endY - startY\)/,
    "the globe must begin materially smaller and travel upward as it grows",
  );
  assert.match(
    landingSource,
    /--landing-copy-opacity",[\s\S]*?\(1 - eased \* 0\.66\)\.toFixed\(4\)[\s\S]*?--landing-veil-opacity",[\s\S]*?\(eased \* 0\.48\)\.toFixed\(4\)/,
    "the second scene must leave the text partly visible behind a restrained veil",
  );
  assert.match(
    landingSource,
    /updateSceneState\(progress >= 0\.48 \? "explore" : "intro", progress >= 0\.76\)/,
    "the actions must fade with scene two before becoming interactive at a readable opacity",
  );
  assert.match(
    landingSource,
    /aria-hidden=\{!landingActionsActive\}[\s\S]*?inert=\{!landingActionsActive\}/,
    "hidden pathways must remain outside keyboard and assistive-technology navigation",
  );
  assert.match(
    landingSource,
    /!nextActionsActive[\s\S]*?pathways\.contains\(document\.activeElement\)[\s\S]*?globeLayer\.contains\(document\.activeElement\)[\s\S]*?document\.activeElement\.blur\(\)/,
    "returning to scene one must not leave focus stranded inside hidden actions or globe controls",
  );
  assert.match(
    landingSource,
    /className="landing-globe-layer"[\s\S]*?aria-hidden=\{!landingActionsActive\}[\s\S]*?inert=\{!landingActionsActive\}/,
    "the small first-scene globe must remain a visual preview until the exploration scene is ready",
  );
  assert.match(
    landingSource,
    /motionQuery\.matches[\s\S]*?updateSceneState\("static", true\)[\s\S]*?--landing-globe-scale", "1"[\s\S]*?--landing-copy-opacity", "1"[\s\S]*?--landing-pathways-opacity", "1"/,
    "reduced-motion users must receive a stable layout with reachable pathways",
  );
  assert.match(
    landingSource,
    /new ResizeObserver\(queueScrollState\)[\s\S]*?resizeObserver\?\.observe\(header\)[\s\S]*?resizeObserver\?\.disconnect\(\)/,
    "the sticky story must track a wrapping banner without leaking observers",
  );
  assert.match(
    styles,
    /\.atlas-landing\s*{[\s\S]*?overflow-x:\s*clip;[\s\S]*?overflow-y:\s*visible;/,
    "the landing surface must clip horizontal scale without creating a sticky-breaking scroll container",
  );
  assert.match(
    styles,
    /\.landing-copy\s*{[\s\S]*?position:\s*absolute;[\s\S]*?opacity:\s*var\(--landing-copy-opacity\);[\s\S]*?transform:\s*translate3d\(-50%, var\(--landing-copy-y\), 0\);/,
    "the thematic copy must remain behind the moving globe without disappearing",
  );
  assert.match(
    styles,
    /\.landing-globe-layer\s*{[\s\S]*?z-index:\s*4;[\s\S]*?transform:\s*translate3d\(0, var\(--landing-globe-y\), 0\)[\s\S]*?scale\(var\(--landing-globe-scale\)\);/,
    "only the globe layer must rise and scale over the copy",
  );
  assert.match(
    styles,
    /\.landing-globe-layer::before\s*{[\s\S]*?color-mix\(in srgb, var\(--void\) 68%, transparent\)[\s\S]*?opacity:\s*var\(--landing-veil-opacity\);/,
    "the globe must use a translucent, theme-aware veil rather than erase the copy",
  );
  assert.match(
    styles,
    /\.landing-pathways\s*{[\s\S]*?opacity:\s*var\(--landing-pathways-opacity\);[\s\S]*?pointer-events:\s*none;[\s\S]*?visibility:\s*hidden;[\s\S]*?\.atlas-landing\[data-landing-scene="explore"\] \.landing-pathways,[\s\S]*?visibility:\s*visible;[\s\S]*?\.atlas-landing\[data-landing-actions="active"\] \.landing-pathways\s*{[\s\S]*?pointer-events:\s*auto;/,
    "the actions must fade independently before their interaction gate opens",
  );
  assert.match(
    styles,
    /\.landing-globe-stage\s*{[\s\S]*?pointer-events:\s*none;[\s\S]*?\.atlas-landing\[data-landing-actions="active"\] \.landing-globe-stage\s*{[\s\S]*?pointer-events:\s*auto;/,
    "the globe preview must become interactive with the second-scene controls",
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.landing-story\s*{[\s\S]*?min-height:\s*auto;[\s\S]*?\.landing-story-viewport\s*{[\s\S]*?position:\s*relative;[\s\S]*?\.landing-pathways\s*{[\s\S]*?opacity:\s*1 !important;[\s\S]*?visibility:\s*visible;/,
    "reduced motion must reflow the story and keep all three choices available",
  );

  const embeddedGlobeSource = sourceBetween(
    "const atlasGlobePanel =",
    "const instrumentVisualizationPanel =",
  );
  assert.doesNotMatch(
    embeddedGlobeSource,
    /autoRotate/,
    "the globe inside the full research workspace must remain user-controlled",
  );

  const entryNavigationSource = sourceBetween(
    "function enterLawAtlas()",
    "function openAtlasGroup(",
  );
  assert.match(
    entryNavigationSource,
    /function enterLawAtlas\(\)[\s\S]*?setWorkspaceMode\("research"\)[\s\S]*?openAtlas\(\)/,
  );
  assert.match(
    entryNavigationSource,
    /function enterConceptAtlas\(\)[\s\S]*?setWorkspaceMode\("research"\)[\s\S]*?openConceptIndex\(\)/,
  );
  assert.match(
    entryNavigationSource,
    /function enterVisualizerResearch\(\)[\s\S]*?setResearchView\("observatory"\)[\s\S]*?setWorkspaceMode\("research"\)[\s\S]*?openView\("research"\)/,
  );
  assert.match(
    explorerSource,
    /<AtlasLanding(?=[^>]*onBrowseLaws=\{enterLawAtlas\})(?=[^>]*onExploreConcepts=\{enterConceptAtlas\})(?=[^>]*onOpenResearch=\{enterVisualizerResearch\})[^>]*\/>/,
    "each welcome route must be wired to its corresponding full workspace",
  );
});

test("the full Global Atlas opens directly as a browsable legal directory", () => {
  const atlasSource = sourceBetween(
    "function GlobalAtlas(",
    "function CoreConceptExplorer(",
  );

  assert.match(atlasSource, /atlasGroups\.map/);
  assert.match(atlasSource, /onOpenInstrument/);
  assert.doesNotMatch(atlasSource, /guided-atlas-hero|guided-pathways/);
  assert.doesNotMatch(
    atlasSource,
    /<details|Browse all laws and frameworks|revealJurisdictionBrowser/,
    "entering Browse laws should not require another disclosure step",
  );
});

test("global navigation contains user tasks while object views remain contextual", () => {
  assert.match(
    explorerSource,
    /const primaryNavigation = \[[\s\S]*?Explore[\s\S]*?Core concepts[\s\S]*?Research Lab/,
  );
  assert.doesNotMatch(
    explorerSource,
    /className="primary-navigation"[\s\S]*?viewLabels\.map/,
    "instrument, relationship, timeline and compare states must not remain global navigation",
  );
  assert.match(
    explorerSource,
    /className="context-navigation"[\s\S]*?Law overview[\s\S]*?Article text[\s\S]*?Timeline[\s\S]*?Compare/,
  );
  assert.match(
    explorerSource,
    /className="workspace-density-toggle"[\s\S]*?Full workspace[\s\S]*?Guided view/,
  );
});

test("law metadata, chapters and concept graphs reveal detail progressively", () => {
  assert.match(
    explorerSource,
    /className="instrument-research-details"[\s\S]*?Source, version and corpus details/,
  );
  assert.match(
    explorerSource,
    /<details[\s\S]*?className="genome-chapter"[\s\S]*?open=\{groupIndex === 0\}/,
    "only the first law chapter should be expanded initially",
  );
  assert.match(explorerSource, /const visibleClusters = clusters\.slice\(0, 6\)/);
  assert.match(
    explorerSource,
    /const visibleProvisions = cluster\.provisions\.slice\(0, compact \? 3 : 4\)/,
  );
  assert.match(
    explorerSource,
    /Show \{overflowClusters\.length\} more concept clusters/,
  );
});

test("search opens with examples and groups ranked results by user-facing content type", () => {
  assert.match(searchSource, /const starterSearches = \[/);
  assert.match(searchSource, /const popupVisible = open;/);
  assert.match(
    searchSource,
    /\["instrument", "provision", "concept"\][\s\S]*?flatMap/,
  );
  assert.match(searchSource, /START HERE/);
  assert.match(searchSource, /Laws and frameworks/);
  assert.match(searchSource, /Articles and provisions/);
  assert.match(searchSource, /Core concepts/);
  assert.match(searchSource, /INCLUDE FULL ARTICLE TEXT/);
});

test("landing routes and contextual navigation reflow without text collisions", () => {
  assert.match(
    styles,
    /\.landing-pathways\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    "wide screens must give each entry route an independent column",
  );
  assert.match(
    styles,
    /@media \(max-width: 760px\)[\s\S]*?\.landing-pathways\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
    "entry routes must stack on narrow screens",
  );
  assert.match(
    styles,
    /\.landing-pathway[\s\S]*?overflow-wrap:\s*(?:anywhere|break-word)/,
    "long route copy must be allowed to wrap inside its own surface",
  );
  assert.match(
    styles,
    /\.context-navigation\s*\{[\s\S]*?overflow-x:\s*auto/,
  );
});
