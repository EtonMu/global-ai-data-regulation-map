import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

function blockFrom(start, end) {
  const startIndex = styles.indexOf(start);
  const endIndex = styles.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing CSS boundary: ${start}`);
  assert.notEqual(endIndex, -1, `missing CSS boundary: ${end}`);
  return styles.slice(startIndex, endIndex);
}

test("the resizable legal workspace responds to its own inline size", () => {
  assert.match(
    styles,
    /\.workspace\s*\{[\s\S]*?container-name:\s*legal-workspace;[\s\S]*?container-type:\s*inline-size;/,
  );

  const contextQuery = blockFrom(
    "@container legal-workspace (max-width: 600px)",
    "@container legal-workspace (max-width: 560px)",
  );
  assert.match(
    contextQuery,
    /\.instrument-context\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
  assert.match(
    contextQuery,
    /\.instrument-corpus-profile\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );

  const mastheadQuery = blockFrom(
    "@container legal-workspace (max-width: 560px)",
    "@container legal-workspace (max-width: 520px)",
  );
  assert.match(mastheadQuery, /\.instrument-masthead,[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mastheadQuery, /font-size:\s*clamp\([^;]*cqi[^;]*\)/);
  assert.match(mastheadQuery, /overflow-wrap:\s*break-word/);
  assert.match(mastheadQuery, /word-break:\s*normal/);
  assert.doesNotMatch(mastheadQuery, /overflow-wrap:\s*anywhere/);
});

test("small legal workspaces expose usable navigation hit areas", () => {
  const statusQuery = blockFrom(
    "@container legal-workspace (max-width: 520px)",
    "@container legal-workspace (max-width: 440px)",
  );
  assert.match(statusQuery, /\.workspace-status\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(
    statusQuery,
    /\.interface-back-button,[\s\S]*?\.breadcrumbs button\s*\{[\s\S]*?min-height:\s*44px/,
  );
  assert.match(styles, /\.column-resizer\s*\{[\s\S]*?width:\s*24px/);
});

test("the mobile corpus navigator has closed, open and reduced-motion states", () => {
  const mobileStyles = blockFrom(
    "@media (max-width: 760px)",
    "@media (max-width: 520px)",
  );
  assert.match(
    mobileStyles,
    /\.mobile-navigator-toggle\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px/,
  );
  assert.match(
    mobileStyles,
    /\.app-shell\s*>\s*\.corpus-navigator,[\s\S]*?max-height:\s*0;[\s\S]*?visibility:\s*hidden/,
  );
  assert.match(
    mobileStyles,
    /\.app-shell\[data-mobile-nav-open="true"\]\s*>\s*\.corpus-navigator\s*\{[\s\S]*?max-height:\s*min\(70dvh,\s*560px\);[\s\S]*?visibility:\s*visible/,
  );

  const reducedMotion = styles.slice(
    styles.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  assert.match(
    reducedMotion,
    /\.mobile-navigator-toggle,[\s\S]*?\.app-shell\s*>\s*\.corpus-navigator\s*\{[\s\S]*?transition:\s*none\s*!important/,
  );
});

test("theme tokens keep secondary text and strong boundaries legible", () => {
  assert.match(styles, /--muted-dark:\s*#6a8094/);
  assert.match(styles, /--line-strong:\s*#4a6780/);
  assert.match(styles, /--muted-dark:\s*#5d6772/);
  assert.match(styles, /--line-strong:\s*#878075/);
});
