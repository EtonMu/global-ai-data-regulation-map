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

test("renders the regulation crosswalk application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Global AI · Data Regulation Map/i);
  assert.match(html, /Trace one regulatory obligation across borders/i);
  assert.match(html, /Regulatory crosswalk lattice/i);
  assert.match(html, /Incident notification &amp; response/i);
  assert.match(html, /Research and educational use only/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("server output contains semantic explorer controls", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /<table[^>]*class="crosswalk-table"/i);
  assert.match(html, /<select/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(html, /Official source at/i);
  assert.match(html, /EUR-Lex/i);
});
