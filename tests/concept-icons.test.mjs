import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [concepts, conceptThemes, iconSource, iconStyles] = await Promise.all([
  readFile(new URL("../data/v2/concepts.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/v2/concept-themes.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/concept-icon.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/concept-icon.module.css", import.meta.url), "utf8"),
]);

function extractEntries(source, start, end) {
  const block = source.slice(source.indexOf(start), source.indexOf(end));
  return [...block.matchAll(/"([^"]+)":\s*\{\s*icon:\s*(\w+)/g)].map(
    ([, id, icon]) => ({ id, icon }),
  );
}

test("every core concept has one explicit, unique outline glyph", () => {
  const entries = extractEntries(
    iconSource,
    "export const conceptIconMap",
    "export const conceptThemeIconMap",
  );

  assert.deepEqual(
    new Set(entries.map(({ id }) => id)),
    new Set(concepts.map(({ id }) => id)),
  );
  assert.equal(entries.length, concepts.length);
  assert.equal(
    new Set(entries.map(({ icon }) => icon)).size,
    entries.length,
    "concept-level Lucide glyphs must remain unique",
  );
  assert.match(iconSource, /data-icon-treatment="outline"/);
});

test("every major theme uses the solid badge treatment", () => {
  const entries = extractEntries(
    iconSource,
    "export const conceptThemeIconMap",
    "export function isConceptId",
  );

  assert.deepEqual(
    new Set(entries.map(({ id }) => id)),
    new Set(conceptThemes.map(({ id }) => id)),
  );
  assert.match(iconSource, /data-icon-treatment="solid"/);
  assert.match(iconStyles, /\.themeBadge\s*{[\s\S]*?background:/);
  assert.match(iconStyles, /\.themeGlyph\s*{/);
});

test("icon accessibility can switch between decorative and named modes", () => {
  assert.match(iconSource, /decorative\s*=\s*true/);
  assert.match(iconSource, /\{\s*"aria-hidden":\s*true\s*\}/);
  assert.match(iconSource, /role:\s*"img"/);
  assert.match(iconSource, /"aria-label":\s*label\s*\?\?/);
});
