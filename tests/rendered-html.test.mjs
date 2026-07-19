import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);

async function loadJson(filename) {
  return JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
}

const [
  jurisdictions,
  instruments,
  seedProvisions,
  relations,
  statusEvents,
  gdprArticles,
  euAiActArticles,
] = await Promise.all([
  loadJson("jurisdictions.json"),
  loadJson("instruments.json"),
  loadJson("provisions.json"),
  loadJson("relations.json"),
  loadJson("status-events.json"),
  loadJson("gdpr-articles.json"),
  loadJson("eu-ai-act-articles.json"),
]);

const mergedProvisionIds = new Set([
  ...seedProvisions.map((item) => item.id),
  ...gdprArticles.map((item) => item.id),
  ...euAiActArticles.map((item) => item.id),
]);
const corpusCounts = {
  jurisdictions: jurisdictions.length,
  instruments: instruments.length,
  provisions: mergedProvisionIds.size,
  relations: relations.length,
  statusEvents: statusEvents.length,
};
const instrumentById = new Map(instruments.map((item) => [item.id, item]));
const jurisdictionById = new Map(jurisdictions.map((item) => [item.id, item]));
const topLevelGroupOrder = ["eu", "us", "cn", "gb", "ca", "jp", "in", "frameworks"];
const frameworkInstrumentIds = [
  "us-nist-ai-rmf-1-0",
  "jp-ai-guidelines-business-1-2",
  "g7-hiroshima-ai-process",
  "un-ai-advisory-final-report-2024",
  "iso-iec-42001-2023",
  "ieee-ethically-aligned-design-2019",
  "oecd-ai-principles",
  "int-bletchley-declaration-2023",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtmlText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function normalizedText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&#xB7;/gi, "·")
    .replace(/&rarr;/g, "→")
    .replace(/\s+/g, " ")
    .trim();
}

test("corpus fixtures expose unique dynamically counted records", () => {
  assert.equal(
    new Set(jurisdictions.map((item) => item.id)).size,
    corpusCounts.jurisdictions,
    `all ${corpusCounts.jurisdictions} authority and jurisdiction contexts must be unique`,
  );
  assert.equal(
    new Set(instruments.map((item) => item.id)).size,
    corpusCounts.instruments,
    `all ${corpusCounts.instruments} instruments must be unique`,
  );
  assert.equal(
    new Set(relations.map((item) => item.id)).size,
    corpusCounts.relations,
    `all ${corpusCounts.relations} relations must be unique`,
  );
  assert.equal(
    new Set(statusEvents.map((item) => item.id)).size,
    corpusCounts.statusEvents,
    `all ${corpusCounts.statusEvents} lifecycle events must be unique`,
  );
  assert.ok(
    statusEvents.every((event) => instrumentById.has(event.instrumentId)),
    `all ${corpusCounts.statusEvents} lifecycle events must resolve to an instrument`,
  );
  assert.ok(
    frameworkInstrumentIds.every((id) => instrumentById.has(id)),
    "the complete framework lane fixture must resolve to corpus instruments",
  );
});

test("server renders a neutral global regulatory atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const text = normalizedText(html);

  assert.match(text, /GLOBAL AI · DATA REGULATION MAP/i);
  assert.match(text, /GLOBAL_REGULATORY_ATLAS \/ LIVE CORPUS/i);
  assert.match(text, /No single law is the center\./i);
  assert.match(
    text,
    /Navigate binding law, executive action, proposed legislation, standards and soft law as a versioned global system\./i,
  );
  assert.match(text, /7 legal systems/i);
  assert.match(
    text,
    new RegExp(`${frameworkInstrumentIds.length} frameworks`, "i"),
  );
  assert.match(
    text,
    new RegExp(`${corpusCounts.instruments} instruments`, "i"),
  );
  assert.match(
    text,
    new RegExp(`${corpusCounts.provisions} indexed provisions`, "i"),
  );
  assert.match(
    text,
    new RegExp(`${corpusCounts.relations} qualified links`, "i"),
  );
  assert.match(text, /PROVISION_READER \/ STANDBY/i);
  assert.match(text, /Select an instrument node\./i);
  assert.match(text, /VIEW::\s*ATLAS/i);
  assert.match(text, /Global regulatory atlas open\./i);
  assert.match(text, /RESEARCH PREVIEW \/ NOT LEGAL ADVICE/i);

  assert.doesNotMatch(
    text,
    /Trace one regulatory obligation across borders|Regulatory crosswalk lattice/i,
  );
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Starter Project/i,
  );
});

test("server output exposes the semantic atlas controls and idle reader", async () => {
  const response = await render();
  const html = await response.text();
  const text = normalizedText(html);

  assert.match(html, /<main[^>]*class="terminal-app"/i);
  assert.match(
    html,
    /<aside[^>]*class="corpus-navigator"[^>]*aria-label="Global regulation corpus"/i,
  );
  assert.match(html, /<input[^>]*type="search"/i);
  assert.match(html, /Search regulations and provisions/i);
  assert.match(
    html,
    /<nav[^>]*class="mode-switch"[^>]*aria-label="Explorer mode"/i,
  );
  assert.match(
    html,
    /<div[^>]*class="theme-switch"[^>]*role="group"[^>]*aria-label="Color theme"/i,
  );
  assert.match(html, /<section[^>]*class="workspace"[^>]*aria-label="Regulation visualization"/i);
  assert.match(html, /<aside[^>]*aria-label="Provision reader"/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(
    html,
    /<button(?=[^>]*aria-pressed="true")[^>]*>[\s\S]*?Atlas\s*<\/button>/i,
  );
  const themeControls = html.match(
    /<div[^>]*class="theme-switch"[^>]*>[\s\S]*?<\/div>/i,
  )?.[0];
  assert.ok(themeControls, "the semantic color theme control must render");
  assert.match(
    themeControls,
    /<button(?=[^>]*aria-pressed="true")[^>]*>[\s\S]*?lucide-moon[\s\S]*?Dark\s*<\/button>/i,
  );
  assert.match(
    themeControls,
    /<button(?=[^>]*aria-pressed="false")[^>]*>[\s\S]*?lucide-sun[\s\S]*?Bright\s*<\/button>/i,
  );
  assert.match(text, /Atlas Instrument Connections Timeline Compare/i);
  assert.match(text, /Binding law/i);
  assert.match(text, /Soft law \/ framework/i);
  assert.match(text, /Historical \/ revoked/i);
  assert.match(text, /CORPUS_NAV/i);
  assert.match(text, /GLOBAL ATLAS/i);
  assert.match(text, /GITHUB/i);
  assert.match(
    html,
    /<a[^>]*class="github-link"[^>]*href="https:\/\/github\.com\/EtonMu\/global-ai-data-regulation-map"[^>]*target="_blank"/i,
  );

  assert.doesNotMatch(html, /<table[^>]*class="crosswalk-table"/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.doesNotMatch(text, /ONE_HOP_PROVISION_NEIGHBORHOOD|COMPARE_LAB/i);
});

test("server output preserves jurisdiction order, flags, icons, and the framework lane", async () => {
  const response = await render();
  const html = await response.text();

  const renderedGroupOrder = [
    ...html.matchAll(/data-atlas-group="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.deepEqual(renderedGroupOrder, [
    ...topLevelGroupOrder,
    ...topLevelGroupOrder,
  ]);

  const expectedFlags = new Map([
    ["eu", "🇪🇺"],
    ["us", "🇺🇸"],
    ["cn", "🇨🇳"],
    ["gb", "🇬🇧"],
    ["ca", "🇨🇦"],
    ["jp", "🇯🇵"],
    ["in", "🇮🇳"],
  ]);
  for (const [jurisdictionId, flag] of expectedFlags) {
    const jurisdiction = jurisdictionById.get(jurisdictionId);
    assert.ok(jurisdiction, `missing test jurisdiction ${jurisdictionId}`);
    assert.match(
      html,
      new RegExp(
        `<span class="jurisdiction-mark" aria-hidden="true">\\s*${flag}\\s*</span>\\s*${escapeRegExp(escapeHtmlText(jurisdiction.name))}`,
        "i",
      ),
    );
  }

  const kindIconCount = (html.match(/class="instrument-kind-icon"/g) ?? [])
    .length;
  assert.equal(
    kindIconCount,
    corpusCounts.instruments,
    "every atlas instrument node must expose a visual kind icon",
  );
  assert.match(
    html,
    /<span[^>]*class="instrument-kind-icon"[^>]*aria-hidden="true"[^>]*>[\s\S]*?<svg[^>]*class="lucide lucide-(?:scale|landmark|file-clock|globe-2|archive)"/i,
  );

  const frameworkLane = html.match(
    /<section[^>]*class="atlas-lane"[^>]*data-atlas-group="frameworks"[^>]*>([\s\S]*?)<\/section>/i,
  )?.[1];
  assert.ok(frameworkLane, "the framework lane must render alongside legal systems");
  const frameworkText = normalizedText(frameworkLane);
  for (const instrumentId of frameworkInstrumentIds) {
    const instrument = instrumentById.get(instrumentId);
    assert.ok(instrument, `missing test instrument ${instrumentId}`);
    assert.match(
      frameworkText,
      new RegExp(escapeRegExp(instrument.shortTitle), "i"),
    );
  }
});
