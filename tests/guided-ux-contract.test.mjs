import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const [explorerSource, searchSource, styles] = await Promise.all([
  readFile(new URL("app/regulation-explorer.tsx", projectRoot), "utf8"),
  readFile(new URL("app/search-combobox.tsx", projectRoot), "utf8"),
  readFile(new URL("app/globals.css", projectRoot), "utf8"),
]);

test("the first visit is a guided task-oriented entry rather than a full research dashboard", () => {
  assert.match(
    explorerSource,
    /type WorkspaceDensity = "guided" \| "research"/,
  );
  assert.match(
    explorerSource,
    /const defaultColumnLayout = \{[\s\S]*?leftCollapsed: true/,
    "the global index should not compete with the main task on first visit",
  );
  assert.match(
    explorerSource,
    /className="guided-atlas-hero"[\s\S]*?Start with a law, article or governance question\./,
  );
  assert.match(
    explorerSource,
    /className="guided-pathways"[\s\S]*?Browse laws[\s\S]*?Explore core concepts[\s\S]*?Compare regulatory patterns/,
  );
  assert.match(
    explorerSource,
    /className="atlas-browser"[\s\S]*?Browse all laws and frameworks/,
    "the complete atlas must remain available through progressive disclosure",
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

test("guided entry and contextual navigation reflow without horizontal text collisions", () => {
  const mobileStart = styles.indexOf("@media (max-width: 760px)");
  const mobileEnd = styles.indexOf("@media (max-width: 520px)", mobileStart);
  const mobileStyles = styles.slice(mobileStart, mobileEnd);

  assert.match(
    mobileStyles,
    /\.guided-atlas-hero\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(
    mobileStyles,
    /\.guided-pathways\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(
    styles,
    /\.context-navigation\s*\{[\s\S]*?overflow-x:\s*auto/,
  );
});
