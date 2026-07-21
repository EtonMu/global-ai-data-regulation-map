import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appRoot = new URL("../app/", import.meta.url);
const pageSource = await readFile(new URL("page.tsx", appRoot), "utf8");
const layoutSource = await readFile(new URL("layout.tsx", appRoot), "utf8");
const nextConfigSource = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);

const eagerExplorerImport =
  /^\s*import\s+[^\n]*\s+from\s+["']\.\/regulation-explorer["'];?\s*$/m;

async function findClientExplorerWrapper() {
  const localDefaultImports = [
    ...pageSource.matchAll(
      /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["'](\.\/[^"']+)["'];?\s*$/gm,
    ),
  ];

  for (const [, componentName, specifier] of localDefaultImports) {
    if (specifier === "./regulation-explorer") continue;

    const candidateUrls = specifier.match(/\.[cm]?[jt]sx?$/)
      ? [new URL(specifier, appRoot)]
      : [
          new URL(`${specifier}.tsx`, appRoot),
          new URL(`${specifier}.ts`, appRoot),
          new URL(`${specifier}/index.tsx`, appRoot),
        ];

    for (const candidateUrl of candidateUrls) {
      try {
        const source = await readFile(candidateUrl, "utf8");
        if (/import\s*\(\s*["']\.\/regulation-explorer["']\s*\)/.test(source)) {
          return { componentName, source };
        }
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }

  return null;
}

test("the route does not eagerly import the regulation explorer into the Worker bundle", () => {
  assert.doesNotMatch(
    pageSource,
    eagerExplorerImport,
    "app/page.tsx must delegate to a small client wrapper instead of statically importing the heavy explorer",
  );
});

test("a client-only wrapper keeps the heavy explorer out of SSR and renders a lightweight shell", async () => {
  const wrapper = await findClientExplorerWrapper();

  assert.ok(
    wrapper,
    "app/page.tsx must import a local client wrapper that dynamically imports ./regulation-explorer",
  );
  assert.match(
    pageSource,
    new RegExp(`<${wrapper.componentName}(?:\\s|\\/|>)`),
    "the route must render the discovered client wrapper",
  );
  assert.match(
    wrapper.source,
    /^\s*["']use client["'];/,
    "the explorer loader must be an explicit client component",
  );
  assert.doesNotMatch(
    wrapper.source,
    eagerExplorerImport,
    "the client wrapper must not turn the explorer back into an eager module dependency",
  );
  assert.match(
    wrapper.source,
    /import\s+dynamic\s+from\s+["']next\/dynamic["']/,
    "the wrapper must use the framework's client-only dynamic component boundary",
  );
  assert.match(
    wrapper.source,
    /dynamic\s*\(\s*\(\)\s*=>\s*import\s*\(\s*["']\.\/regulation-explorer["']\s*\)\s*,\s*\{[\s\S]*?\bssr\s*:\s*false\b/,
    "the heavy explorer must be dynamically imported with SSR explicitly disabled",
  );
  assert.match(
    wrapper.source,
    /aria-busy\s*=\s*["']true["']/,
    "the server-rendered loading shell must expose its busy state",
  );
  assert.match(
    wrapper.source,
    /role\s*=\s*["']status["']/,
    "the server-rendered loading shell must announce progress without mounting the explorer",
  );
  assert.doesNotMatch(
    wrapper.source,
    /(?:from|import\s*\()\s*["'][^"']*(?:data\/v2|regulation-globe)[^"']*["']/,
    "the lightweight wrapper must not eagerly pull corpus or globe modules into the Worker render path",
  );
});

test("the root layout uses static Metadata without reading request headers", () => {
  assert.match(
    layoutSource,
    /export\s+const\s+metadata\s*(?::\s*Metadata)?\s*=/,
    "app/layout.tsx must export a static metadata object",
  );
  assert.doesNotMatch(
    layoutSource,
    /(?:from\s+["']next\/headers["']|\bheaders\s*\()/,
    "static metadata must not make the root layout request-bound",
  );
  assert.doesNotMatch(
    layoutSource,
    /\bgenerateMetadata\b/,
    "the root layout must not use dynamic metadata generation",
  );
});

test("the production route is exported as static HTML", () => {
  assert.match(
    nextConfigSource,
    /\boutput\s*:\s*["']export["']/,
    "next.config.ts must keep the atlas shell on the static asset path",
  );
});
