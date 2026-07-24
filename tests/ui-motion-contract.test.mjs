import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [explorerSource, globalStyles] = await Promise.all([
  readFile(
    new URL("../app/regulation-explorer.tsx", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("visual transitions use the native API with a safe motion-aware fallback", () => {
  assert.match(
    explorerSource,
    /function runVisualTransition\s*\(\s*kind:\s*TransitionKind/,
    "theme and explorer views must share one transition coordinator",
  );
  assert.match(
    explorerSource,
    /window\.matchMedia\(\s*["']\(prefers-reduced-motion:\s*reduce\)["']\s*,?\s*\)\.matches/,
    "the transition coordinator must check the user's reduced-motion preference",
  );
  assert.match(
    explorerSource,
    /if\s*\(reducedMotion\)\s*{\s*update\(\);\s*return;/,
    "reduced-motion users must receive the state update without an animated snapshot",
  );
  assert.match(
    explorerSource,
    /if\s*\(!transitionDocument\.startViewTransition\)\s*{/,
    "unsupported browsers must use an explicit View Transitions feature check",
  );
  assert.match(
    explorerSource,
    /transitionDocument\.startViewTransition\(\(\)\s*=>\s*{/,
    "supported browsers must commit state through the native View Transitions API",
  );
  assert.match(
    explorerSource,
    /transitionRef\.current\?\.skipTransition\(\)/,
    "rapid tab changes must replace an in-flight visual transition",
  );
  assert.match(
    explorerSource,
    /root\.setAttribute\(\s*["']data-ui-transition["']\s*,\s*kind\s*\)/,
    "the root must expose the active transition kind to CSS",
  );
  assert.match(
    explorerSource,
    /root\.setAttribute\(\s*["']data-transition-fallback["']\s*,\s*["']true["']\s*\)[\s\S]*?flushSync\(\(\)\s*=>\s*update\(\)\)[\s\S]*?setTimeout\([\s\S]*?clearTransitionMetadata\(token\)/,
    "the non-native path must animate its fallback and then remove transition metadata",
  );
  assert.match(
    explorerSource,
    /transition\.finished\.then\(\s*\(\)\s*=>\s*clearTransitionMetadata\(token\),\s*\(\)\s*=>\s*clearTransitionMetadata\(token\),?\s*\)/,
    "completed and rejected native transitions must both clean up metadata",
  );
  assert.match(explorerSource, /runVisualTransition\(\s*["']theme["']/);
  assert.match(explorerSource, /runVisualTransition\(\s*["']view["']/);
});

test("transition metadata cleanup removes every temporary root marker", () => {
  assert.match(
    explorerSource,
    /function clearTransitionMetadata\s*\([^)]*\)\s*{[\s\S]*?root\.removeAttribute\(["']data-ui-transition["']\);[\s\S]*?root\.removeAttribute\(["']data-view-direction["']\);[\s\S]*?root\.removeAttribute\(["']data-transition-fallback["']\);/,
  );
  assert.match(
    explorerSource,
    /root\.style\.removeProperty\(["']--theme-x["']\);[\s\S]*?root\.style\.removeProperty\(["']--theme-y["']\);/,
  );
  assert.match(
    explorerSource,
    /root\.setAttribute\(\s*["']data-view-direction["']\s*,\s*direction\s*\)/,
    "view transitions must communicate forward/backward direction",
  );
  assert.match(
    explorerSource,
    /root\.style\.setProperty\(["']--theme-x["'][\s\S]*?root\.style\.setProperty\(["']--theme-y["']/,
    "the theme reveal must originate from the selected theme control",
  );
});

test("CSS defines root theme reveal and named explorer surface transitions", () => {
  assert.match(
    globalStyles,
    /html\[data-ui-transition="theme"\]::view-transition-old\(root\)\s*{[\s\S]*?animation:\s*none;/,
  );
  assert.match(
    globalStyles,
    /html\[data-ui-transition="theme"\]::view-transition-new\(root\)\s*{[\s\S]*?animation:\s*theme-surface-reveal\s+520ms/,
  );
  assert.match(
    globalStyles,
    /@keyframes\s+theme-surface-reveal\s*{[\s\S]*?clip-path:\s*circle\(0\s+at\s+var\(--theme-x[\s\S]*?clip-path:\s*circle\(150vmax\s+at\s+var\(--theme-x/,
    "the new theme surface must reveal from the user's click origin",
  );

  for (const [surface, transitionName] of [
    ["corpus-navigator", "atlas-navigator"],
    ["workspace", "atlas-workspace"],
  ]) {
    assert.match(
      globalStyles,
      new RegExp(
        `html\\[data-ui-transition="view"\\] \\.${surface}\\s*\\{\\s*view-transition-name:\\s*${transitionName};`,
      ),
      `${surface} must have a stable named View Transition surface`,
    );
    assert.match(
      globalStyles,
      new RegExp(`::view-transition-(?:old|new)\\(${transitionName}\\)`),
      `${transitionName} must participate in old/new snapshot animation`,
    );
  }

  assert.match(
    globalStyles,
    /html\[data-ui-transition="view"\] \.atlas-globe-panel,[\s\S]*?html\[data-ui-transition="view"\] \.concept-constellation-panel,[\s\S]*?html\[data-ui-transition="view"\] \.relationship-panel\s*{\s*view-transition-name:\s*atlas-reader;/,
    "every right-column visualization must retain the same transition identity",
  );
  assert.match(globalStyles, /::view-transition-(?:old|new)\(atlas-reader\)/);

  assert.match(
    globalStyles,
    /html\[data-transition-fallback="true"\]\[data-ui-transition="view"\][\s\S]*?animation:\s*view-fallback-enter\s+360ms/,
    "view changes need a CSS fallback when the native API is unavailable",
  );
  assert.match(globalStyles, /@keyframes\s+view-fallback-enter\s*{/);
  assert.match(
    globalStyles,
    /\.mode-switch-indicator\s*{[\s\S]*?transition:[\s\S]*?transform\s+340ms/,
  );
  assert.match(
    globalStyles,
    /\.theme-switch-indicator\s*{[\s\S]*?transition:[\s\S]*?transform\s+360ms/,
  );
  assert.match(
    globalStyles,
    /\.theme-switch\[data-active-theme="bright"\]\s+\.theme-switch-indicator\s*{\s*transform:\s*translateX\(100%\);/,
  );
});

test("sidebar tabs and expandable indexes expose semantic state with local motion", () => {
  assert.match(
    explorerSource,
    /className="navigator-tabs"[\s\S]*?role="tablist"[\s\S]*?aria-label="Research index"[\s\S]*?data-active-tab=\{navigatorTab\}/,
    "the source/concept switch must be a named tablist with observable state",
  );
  for (const [tab, label] of [
    ["sources", "GLOBAL ATLAS"],
    ["concepts", "CORE CONCEPTS"],
  ]) {
    assert.match(
      explorerSource,
      new RegExp(
        `role="tab"[\\s\\S]*?id="navigator-tab-${tab}"[\\s\\S]*?aria-selected=\\{navigatorTab === "${tab}"\\}[\\s\\S]*?${label}`,
      ),
      `${label} must expose its selected state`,
    );
  }
  assert.match(
    explorerSource,
    /key=\{navigatorTab\}[\s\S]*?className="navigator-pane"[\s\S]*?data-direction=\{navigatorTab === "concepts" \? "forward" : "backward"\}/,
    "tab panels must enter in the direction of travel",
  );
  assert.match(
    explorerSource,
    /className="navigator-accordion-trigger"[\s\S]*?aria-expanded=\{expanded\}[\s\S]*?aria-controls=\{panelId\}/,
    "expandable source and concept groups must expose their state and controlled panel",
  );
  assert.match(
    explorerSource,
    /className="navigator-collapse"[\s\S]*?data-expanded=\{expanded\}[\s\S]*?aria-hidden=\{!expanded\}/,
    "accordion content must remain mounted so close animations can complete",
  );

  assert.match(
    globalStyles,
    /\.navigator-tab-indicator\s*{[\s\S]*?transition:[\s\S]*?transform\s+340ms/,
  );
  assert.match(
    globalStyles,
    /\.navigator-tabs\[data-active-tab="concepts"\]\s+\.navigator-tab-indicator\s*{\s*transform:\s*translateX\(100%\);/,
  );
  assert.match(
    globalStyles,
    /\.navigator-pane\[data-direction="forward"\]\s*{\s*animation:\s*navigator-pane-enter-forward\s+280ms/,
  );
  assert.match(
    globalStyles,
    /\.navigator-pane\[data-direction="backward"\]\s*{\s*animation:\s*navigator-pane-enter-backward\s+280ms/,
  );
  assert.match(globalStyles, /@keyframes\s+navigator-pane-enter-forward\s*{/);
  assert.match(globalStyles, /@keyframes\s+navigator-pane-enter-backward\s*{/);
  assert.match(
    globalStyles,
    /\.navigator-collapse\s*{[\s\S]*?grid-template-rows:\s*0fr;[\s\S]*?transition:[\s\S]*?grid-template-rows\s+300ms/,
  );
  assert.match(
    globalStyles,
    /\.navigator-collapse\[data-expanded="true"\]\s*{[\s\S]*?grid-template-rows:\s*1fr;/,
  );
  assert.match(
    globalStyles,
    /\.navigator-accordion\[data-expanded="true"\][^{]*\.accordion-chevron\s*{[\s\S]*?transform:\s*rotate\(90deg\);/,
  );
});

test("the workspace Back control restores complete in-app navigation state", () => {
  assert.match(explorerSource, /\| \{ type: "RESTORE_STATE"; state: ExplorerState \}/);
  assert.match(
    explorerSource,
    /case "RESTORE_STATE":[\s\S]*?\.\.\.action\.state[\s\S]*?compareIds:\s*\[\.\.\.action\.state\.compareIds\]/,
    "restoration must clone the complete prior interface state",
  );
  assert.match(
    explorerSource,
    /const navigationHistoryRef = useRef<ExplorerState\[\]>\(\[\]\)/,
  );
  assert.match(
    explorerSource,
    /function rememberCurrentInterface\(\)\s*{[\s\S]*?navigationHistoryRef\.current\.push\([\s\S]*?compareIds:\s*\[\.\.\.state\.compareIds\][\s\S]*?setHistoryDepth\(navigationHistoryRef\.current\.length\)/,
  );
  assert.match(
    explorerSource,
    /function goBack\(\)\s*{[\s\S]*?navigationHistoryRef\.current\.pop\(\)[\s\S]*?dispatch\(\{ type: "RESTORE_STATE", state: previous \}\)[\s\S]*?direction:\s*"backward"/,
    "Back must pop and restore history with backward motion when appropriate",
  );
  assert.match(
    explorerSource,
    /className="interface-back-button"[\s\S]*?onClick=\{goBack\}[\s\S]*?disabled=\{historyDepth === 0\}[\s\S]*?aria-label="Return to previous interface"/,
  );
});

test("core concepts render as an academic research index and evidence workspace", () => {
  assert.match(explorerSource, /function CoreConceptExplorer\s*\(/);
  assert.match(
    explorerSource,
    /CORE CONCEPTS[\s\S]*?Start with the fundamentals\./,
    "the concept index must begin with a guided learning entry point",
  );
  assert.match(
    explorerSource,
    /fundamentalConceptIds[\s\S]*?className="concept-fundamentals"/,
    "the concept index must surface a compact set of foundational concepts",
  );
  assert.match(
    explorerSource,
    /A shared concept label[\s\S]*?does not establish legal equivalence, identical scope, or compliance\./,
    "the concept index must communicate its comparative-law limitation",
  );
  assert.match(
    explorerSource,
    /conceptThemes\.map\([\s\S]*?className="concept-theme-lane"[\s\S]*?conceptsByTheme\.get\(theme\.id\)/,
    "the concept index must expose its full theme taxonomy",
  );
  assert.match(
    explorerSource,
    /className="concept-source-map"[\s\S]*?evidenceInstruments\.map[\s\S]*?<JurisdictionMark jurisdictionId=\{instrument\.jurisdictionId\}/,
    "concept evidence nodes must preserve their jurisdiction marks",
  );
  assert.match(
    explorerSource,
    /PUBLIC_SOURCE_BASIS[\s\S]*?Sources used for the editorial synthesis[\s\S]*?selectedConcept\.sourceBasis\.map/,
  );
  assert.match(
    explorerSource,
    /public IAPP CIPP\/E, CIPM, CIPT and AIGP[\s\S]*?not affiliated with or endorsed by IAPP/i,
  );
  assert.match(
    explorerSource,
    /state\.navigatorTab === "concepts" && state\.view === "atlas"[\s\S]*?<CoreConceptExplorer/,
    "selecting the concepts tab must replace the legal atlas with the concept workspace",
  );
});

test("connection visualization nodes carry readable jurisdiction marks", () => {
  const markedConnectionKickers = explorerSource.match(
    /className="connection-node-kicker"[\s\S]{0,260}?<JurisdictionMark/g,
  ) ?? [];
  assert.ok(
    markedConnectionKickers.length >= 2,
    "the anchor and mapped connection nodes must both render a jurisdiction mark",
  );
  assert.match(
    explorerSource,
    /Anchor:[\s\S]*?jurisdictionById\.get\(anchorInstrument\.jurisdictionId\)\?\.name/,
    "the anchor's accessible label must name its jurisdiction",
  );
  assert.match(
    explorerSource,
    /jurisdictionById\.get\(instrument\.jurisdictionId\)\?\.name[\s\S]*?relationDirectionMarker/,
    "mapped nodes must name their jurisdiction before relationship semantics",
  );
});

test("reduced-motion CSS disables native snapshots and local sidebar motion", () => {
  const reducedMotionStart = globalStyles.indexOf(
    "@media (prefers-reduced-motion: reduce)",
  );
  assert.notEqual(
    reducedMotionStart,
    -1,
    "the stylesheet must define a reduced-motion media query",
  );
  const nextMediaQuery = globalStyles.indexOf(
    "@media ",
    reducedMotionStart + 1,
  );
  const reducedMotionStyles = globalStyles.slice(
    reducedMotionStart,
    nextMediaQuery === -1 ? undefined : nextMediaQuery,
  );

  assert.match(
    reducedMotionStyles,
    /animation-duration:\s*0\.01ms\s*!important;/,
  );
  assert.match(
    reducedMotionStyles,
    /transition-duration:\s*0\.01ms\s*!important;/,
  );
  assert.match(
    reducedMotionStyles,
    /\*[\s\S]*?\*::before[\s\S]*?\*::after[\s\S]*?animation-duration:\s*0\.01ms\s*!important;[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/,
    "the reduced-motion override must cover tab indicators, pane entry, accordions and chevrons",
  );
  for (const pseudo of ["group", "old", "new"]) {
    assert.match(
      reducedMotionStyles,
      new RegExp(`::view-transition-${pseudo}\\(\\*\\)`),
      `reduced motion must explicitly cover ::view-transition-${pseudo}(*)`,
    );
  }
  assert.match(
    reducedMotionStyles,
    /::view-transition-group\(\*\)[\s\S]*?::view-transition-old\(\*\)[\s\S]*?::view-transition-new\(\*\)[\s\S]*?animation:\s*none\s*!important;/,
  );
});
