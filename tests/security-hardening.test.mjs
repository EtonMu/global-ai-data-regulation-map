import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerSource = await readFile(
  new URL("../worker/index.ts", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const staticHeaders = await readFile(
  new URL("../public/_headers", import.meta.url),
  "utf8",
);
const piplCorpus = JSON.parse(
  await readFile(
    new URL("../data/v2/cn-pipl-articles.json", import.meta.url),
    "utf8",
  ),
);

test("all application and image responses receive the baseline security headers", () => {
  for (const header of [
    "Content-Security-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
    "Permissions-Policy",
    "Referrer-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-Permitted-Cross-Domain-Policies",
  ]) {
    assert.match(workerSource, new RegExp(`"${header}"`));
    assert.match(staticHeaders, new RegExp(`${header}:`));
  }

  assert.match(workerSource, /return withSecurityHeaders\(response\)/);
  assert.match(
    workerSource,
    /return withSecurityHeaders\(await handler\.fetch\(request, env, ctx\)\)/,
  );
  assert.match(workerSource, /headers\.delete\("X-Powered-By"\)/);
  assert.match(staticHeaders, /^\/\*/m);
  assert.match(staticHeaders, /^\/assets\/\*/m);
  assert.match(staticHeaders, /max-age=31536000, immutable/);
});

test("the interface has no third-party font request", () => {
  assert.doesNotMatch(globalStyles, /fonts\.(?:googleapis|gstatic)\.com/i);
  assert.doesNotMatch(globalStyles, /@import\s+url\(/i);
});

test("current PIPL translation links use the official HTTPS source", () => {
  const urls = piplCorpus.flatMap((article) =>
    Object.values(article.translations ?? {})
      .map((translation) => translation.source?.url)
      .filter(Boolean),
  );

  assert.ok(urls.length > 0);
  for (const source of urls) {
    const url = new URL(source);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "www.npc.gov.cn");
  }
});
