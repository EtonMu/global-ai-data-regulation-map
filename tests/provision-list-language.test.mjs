import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const explorerSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const stylesheet = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("instrument articles use titled list rows instead of square cells", () => {
  assert.match(explorerSource, /className="provision-list"/);
  assert.match(explorerSource, /className="provision-list-locator"/);
  assert.match(
    explorerSource,
    /className="provision-list-copy"[\s\S]*?<strong>\{provision\.title\}<\/strong>[\s\S]*?<small>\{provision\.summary\}<\/small>/,
  );
  assert.doesNotMatch(explorerSource, /className="provision-grid"/);
  assert.doesNotMatch(explorerSource, /className="provision-cell/);
  assert.match(stylesheet, /\.provision-list-item\s*\{/);
});

test("original-language records expose a native bilingual text switch", () => {
  assert.match(
    explorerSource,
    /\{ provisionId: null, language: "en" \}/,
    "foreign-language provisions must open in English by default",
  );
  assert.match(
    explorerSource,
    /languageSelection\.language\s*:\s*"en";/,
    "a newly selected foreign-language provision must reset to English",
  );
  assert.match(explorerSource, /className="reader-language-switch"/);
  assert.match(explorerSource, /aria-label="Legal text language"/);
  assert.match(
    explorerSource,
    /languageChoices\.map[\s\S]*?onClick=\{\(\) => setReaderLanguage\(choice\.value\)\}/,
  );
  assert.match(explorerSource, /data-text-language=\{displayedLanguage\}/);
  assert.match(explorerSource, /ENGLISH REFERENCE TRANSLATION/);
  assert.match(explorerSource, /"ENGLISH COVERAGE"/);
  assert.match(explorerSource, /"ENGLISH · FUTURE REF"/);
  assert.match(explorerSource, /"ENGLISH · HISTORICAL REF"/);
  assert.match(explorerSource, /ENGLISH LEGAL TEXT NOT STORED — COVERAGE NOTICE/);
  assert.doesNotMatch(explorerSource, /This article is mapped to/);
  assert.match(explorerSource, /currentTextEquivalent/);
  assert.match(explorerSource, /Future-phase English reference — not current/);
  assert.match(explorerSource, /Historical English reference — not current/);
  assert.match(
    explorerSource,
    /is-version-warning[\s\S]*?renderedParagraphs\.map/,
    "a temporal mismatch warning must precede the English legal text",
  );
  assert.match(stylesheet, /\.reader-document > p[\s\S]*?white-space: pre-line;/);
  assert.match(explorerSource, /alternativeLanguageTexts\.map/);
  assert.match(explorerSource, /Official reference translation — no legal force/);
  assert.match(explorerSource, /tabIndex=\{readerTab === tab \? 0 : -1\}/);
});

test("instrument and provision subtitles can display official original titles", () => {
  assert.match(explorerSource, /instrument\.originalTitle/);
  assert.match(explorerSource, /provision!\.originalTitle/);
  assert.match(stylesheet, /\.bilingual-instrument-title/);
});
