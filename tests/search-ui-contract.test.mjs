import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const [searchSource, styles] = await Promise.all([
  readFile(new URL("app/search-combobox.tsx", projectRoot), "utf8"),
  readFile(new URL("app/globals.css", projectRoot), "utf8"),
]);

function blockFrom(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing source boundary: ${start}`);
  assert.notEqual(endIndex, -1, `missing source boundary: ${end}`);
  return source.slice(startIndex, endIndex);
}

function popupRule(source) {
  const selector =
    /\.(?:search-suggestions|search-suggestion-popup|search-combobox-popup)\s*\{/;
  const match = selector.exec(source);
  assert.ok(
    match,
    "search suggestions need a dedicated popup CSS rule",
  );
  const endIndex = source.indexOf("}", match.index);
  assert.notEqual(endIndex, -1, "search suggestion popup CSS rule must close");
  return source.slice(match.index, endIndex + 1);
}

test("SearchCombobox exposes the editable list-autocomplete contract", () => {
  assert.match(
    searchSource,
    /(?:function|const)\s+SearchCombobox\b/,
    "search UI must remain an independently testable SearchCombobox component",
  );
  assert.match(searchSource, /<input\b[\s\S]*?role=["']combobox["']/);
  assert.match(searchSource, /aria-autocomplete=["']list["']/);
  assert.match(searchSource, /aria-expanded=/);
  assert.match(searchSource, /aria-controls=/);
  assert.match(searchSource, /aria-activedescendant=/);

  assert.match(searchSource, /role=["']listbox["']/);
  assert.match(searchSource, /role=["']option["']/);
  assert.match(searchSource, /aria-selected=/);
  assert.match(
    searchSource,
    /role=["']status["']/,
    "result count, loading and fallback feedback need a status separate from the input",
  );
});

test("SearchCombobox supports complete keyboard navigation without breaking IME input", () => {
  assert.match(searchSource, /onKeyDown=/);
  for (const key of [
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "Enter",
    "Escape",
  ]) {
    assert.match(
      searchSource,
      new RegExp(`["']${key}["']`),
      `SearchCombobox must handle ${key}`,
    );
  }
  assert.match(
    searchSource,
    /event\.nativeEvent\.isComposing/,
    "composition events must not trigger suggestion navigation or activation",
  );
});

test("suggestions explain why they matched and offer an explicit full-text load action", () => {
  assert.match(searchSource, /search-suggestion-reason/);
  assert.match(
    searchSource,
    /<button\b[\s\S]*?onClick=\{[^}]*onLoadFullText[^}]*\}[\s\S]*?<\/button>/,
    "users must be able to explicitly request the complete full-text corpus",
  );
});

test("the suggestions popup is anchored, viewport-bounded and independently scrollable", () => {
  const popup = popupRule(styles);
  assert.match(popup, /position:\s*absolute/);
  assert.match(
    popup,
    /max-height:\s*[^;]*dvh[^;]*;/,
    "popup height must account for the dynamic viewport",
  );
  assert.match(popup, /overflow-y:\s*auto/);
});

test("mobile search remains touch-friendly and avoids iOS input zoom", () => {
  const mobileStyles = blockFrom(
    styles,
    "@media (max-width: 760px)",
    "@media (max-width: 520px)",
  );
  assert.match(
    mobileStyles,
    /\.global-search\s*\{[\s\S]*?(?:height|min-height):\s*(?:4[4-9]|[5-9]\d)px/,
    "the mobile search control needs a minimum 44px hit area",
  );
  assert.match(
    mobileStyles,
    /\.global-search\s+input\s*\{[\s\S]*?font-size:\s*(?:1rem|16px)/,
    "mobile search text needs to be at least 16px",
  );
  assert.match(
    mobileStyles,
    /\.global-search\s+kbd\s*\{[\s\S]*?display:\s*none/,
    "the keyboard shortcut hint must not consume narrow-screen input space",
  );
});

test("reduced-motion mode disables suggestion popup animation", () => {
  const reducedMotion = styles.slice(
    styles.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  assert.match(
    reducedMotion,
    /\.(?:search-suggestions|search-suggestion-popup|search-combobox-popup)[^{]*\{[\s\S]*?animation:\s*none\s*!important/,
  );
});
