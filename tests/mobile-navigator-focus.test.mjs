import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const [explorerSource, styles] = await Promise.all([
  readFile(new URL("app/regulation-explorer.tsx", projectRoot), "utf8"),
  readFile(new URL("app/globals.css", projectRoot), "utf8"),
]);

test("closing the mobile navigator restores focus only in the mobile layout", () => {
  assert.match(explorerSource, /mobileNavigatorMediaQuery = "\(max-width: 760px\)"/);
  assert.match(explorerSource, /ref=\{mobileNavigatorToggleRef\}/);
  assert.match(
    explorerSource,
    /const closeMobileNavigatorAndRestoreFocus = useCallback\(\(\) => \{[\s\S]*?if \(!mobileNavigatorOpen\) return;[\s\S]*?window\.matchMedia\(mobileNavigatorMediaQuery\)\.matches[\s\S]*?requestAnimationFrame[\s\S]*?mobileNavigatorToggleRef\.current\?\.focus\(\{ preventScroll: true \}\)/,
  );
  assert.match(
    explorerSource,
    /event\.key === "Escape" && mobileNavigatorOpen\)[\s\S]*?closeMobileNavigatorAndRestoreFocus\(\)/,
  );
});

test("mobile tab arrow navigation never focuses a tab hidden by drawer closure", () => {
  assert.match(
    explorerSource,
    /const mobileDrawerWillClose = window\.matchMedia\([\s\S]*?mobileNavigatorMediaQuery,[\s\S]*?\)\.matches;[\s\S]*?onSetNavigatorTab\(nextTab\);[\s\S]*?if \(!mobileDrawerWillClose\) \{[\s\S]*?navigator-tab-/,
  );
});

test("the restored mobile toggle has an unambiguous focus treatment", () => {
  assert.match(
    styles,
    /\.mobile-navigator-toggle:focus,[\s\S]*?\.mobile-navigator-toggle:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--cyan\);[\s\S]*?box-shadow:/,
  );
});
