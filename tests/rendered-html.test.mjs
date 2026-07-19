import assert from "node:assert/strict";
import test from "node:test";

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
  assert.match(text, /11 jurisdictions/i);
  assert.match(text, /19 instruments/i);
  assert.match(text, /249 indexed provisions/i);
  assert.match(text, /38 qualified links/i);
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
  assert.match(html, /<section[^>]*class="workspace"[^>]*aria-label="Regulation visualization"/i);
  assert.match(html, /<aside[^>]*aria-label="Provision reader"/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(
    html,
    /<button(?=[^>]*aria-pressed="true")[^>]*>\s*Atlas\s*<\/button>/i,
  );
  assert.match(text, /Atlas Instrument Connections Timeline Compare/i);
  assert.match(text, /Binding law/i);
  assert.match(text, /Soft law \/ framework/i);
  assert.match(text, /Historical \/ revoked/i);
  assert.match(text, /CORPUS_NAV/i);
  assert.match(text, /GLOBAL ATLAS/i);
  assert.match(text, /GITHUB ↗/i);

  assert.doesNotMatch(html, /<table[^>]*class="crosswalk-table"/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.doesNotMatch(text, /ONE_HOP_PROVISION_NEIGHBORHOOD|COMPARE_LAB/i);
});
