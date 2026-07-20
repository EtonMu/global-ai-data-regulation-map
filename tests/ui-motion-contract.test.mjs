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
    ["provision-reader", "atlas-reader"],
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

test("reduced-motion CSS explicitly disables native transition snapshots", () => {
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
