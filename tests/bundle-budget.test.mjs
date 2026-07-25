import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const assetsUrl = new URL("../dist/client/assets/", import.meta.url);

test("the main explorer remains within its JavaScript transfer budget", async () => {
  const files = await readdir(assetsUrl);
  const explorerAssets = files.filter((file) =>
    /^regulation-explorer-(?!client-).*\.js$/.test(file),
  );

  assert.equal(explorerAssets.length, 1);
  const source = await readFile(new URL(explorerAssets[0], assetsUrl));
  const gzipBytes = gzipSync(source).byteLength;

  assert.ok(
    gzipBytes <= 360_000,
    `main explorer gzip size ${gzipBytes} exceeds the 360000-byte budget`,
  );
});

test("heavy visualizations remain isolated in lazy-loaded chunks", async () => {
  const files = await readdir(assetsUrl);
  assert.ok(files.some((file) => /^regulation-globe-.*\.js$/.test(file)));
  assert.ok(files.some((file) => /^concept-constellation-.*\.js$/.test(file)));
});
