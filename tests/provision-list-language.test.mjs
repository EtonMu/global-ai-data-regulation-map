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
const regulationExplorerSource = explorerSource.slice(
  explorerSource.indexOf("export default function RegulationExplorer"),
);
const languagePreferenceState = regulationExplorerSource.match(
  /const\s*\[\s*([A-Za-z_$][\w$]*Language[\w$]*)\s*,\s*(set[A-Za-z_$][\w$]*Language[\w$]*)\s*\]\s*=\s*useState(?:<[^;]+?>)?\(\s*["']en["']\s*\)/i,
);

test("instrument articles use titled list rows instead of square cells", () => {
  assert.match(explorerSource, /className="provision-list"/);
  assert.match(explorerSource, /className="provision-list-locator"/);
  assert.match(
    explorerSource,
    /className="provision-list-copy"[\s\S]*?<strong>\{provision\.title\}<\/strong>[\s\S]*?editorialPreview\.text/,
  );
  assert.match(explorerSource, /function provisionEditorialPreview/);
  assert.doesNotMatch(explorerSource, /className="provision-grid"/);
  assert.doesNotMatch(explorerSource, /className="provision-cell/);
  assert.match(stylesheet, /\.provision-list-item\s*\{/);
});

test("article readers default to English and expose a bilingual text switch", () => {
  assert.ok(
    languagePreferenceState,
    "the article-reader language preference must initialize to English",
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

test("one reader-language preference persists across provision navigation", () => {
  assert.ok(languagePreferenceState);
  const [, preferenceName, preferenceSetterName] = languagePreferenceState;
  const provisionReaderStart = regulationExplorerSource.indexOf(
    "<ProvisionReader",
  );
  const provisionReaderInvocation = regulationExplorerSource.slice(
    provisionReaderStart,
    regulationExplorerSource.indexOf("/>", provisionReaderStart) + 2,
  );

  assert.match(
    provisionReaderInvocation,
    new RegExp(`=\\{${preferenceName}\\}`),
    "the root-owned language preference must be passed into the article reader",
  );
  assert.match(
    provisionReaderInvocation,
    new RegExp(preferenceSetterName),
    "the article reader must update that same root-owned preference",
  );
  assert.doesNotMatch(
    explorerSource,
    /useState<\s*\{\s*provisionId:\s*string\s*\|\s*null;\s*language:\s*string;?\s*\}>/,
    "the preference must not be stored in provision-keyed state",
  );
  assert.doesNotMatch(
    explorerSource,
    /languageSelection\.provisionId\s*===\s*\(provision\?\.id\s*\?\?\s*null\)/,
    "opening another article must not silently replace the selected language with English",
  );
  assert.doesNotMatch(
    explorerSource,
    /setLanguageSelection\(\s*\{\s*provisionId:\s*provision\?\.id\s*\?\?\s*null,\s*language,/,
    "the selector must update one shared language preference rather than bind it to an article id",
  );
  assert.match(
    explorerSource,
    /languageChoices\.some\([\s\S]*?\.value\s*===\s*[A-Za-z_$][\w$]*Language[\w$]*[\s\S]*?\?\s*[A-Za-z_$][\w$]*Language[\w$]*\s*:\s*["']en["']/i,
    "an unavailable preference must render English without erasing the saved preference",
  );
});

test("the language selector animates its visual state and honors reduced motion", () => {
  assert.match(
    explorerSource,
    /className="reader-language-indicator"[\s\S]*?aria-hidden="true"/,
    "the segmented language selector must expose a non-semantic moving frame",
  );
  assert.match(
    stylesheet,
    /\.reader-language-indicator\s*\{[\s\S]*?transform:\s*translateX\(calc\(var\(--language-option-index\)\s*\*\s*100%\)\)[\s\S]*?transition:[\s\S]*?transform\s+\d+ms[^}]*?\}/,
    "the selected-language frame must slide to its next option",
  );
  assert.match(
    stylesheet,
    /\.reader-language-switch button\s*\{[\s\S]*?transition:[\s\S]*?color\s+\d+ms[^}]*?\}/,
    "the button label must transition with the moving frame",
  );
  assert.match(
    stylesheet,
    /\.reader-language-switch button\[aria-pressed="true"\]\s*\{[\s\S]*?color:/,
    "the selected language must expose a distinct visual state",
  );

  const reducedMotionStart = stylesheet.indexOf(
    "@media (prefers-reduced-motion: reduce)",
  );
  assert.notEqual(reducedMotionStart, -1);
  const reducedMotionStyles = stylesheet.slice(reducedMotionStart);
  assert.match(
    reducedMotionStyles,
    /transition-duration:\s*0\.01ms\s*!important;|\.reader-language-switch[\s\S]*?transition:\s*none\s*!important;/,
    "language-button motion must collapse when reduced motion is requested",
  );
});

test("instrument and provision subtitles can display official original titles", () => {
  assert.match(explorerSource, /instrument\.originalTitle/);
  assert.match(explorerSource, /provision!\.originalTitle/);
  assert.match(stylesheet, /\.bilingual-instrument-title/);
});
