import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  CorpusLoadError,
  clearCorpusShardCache,
  loadCorpusShard,
} from "../app/corpus-loader.ts";

const originalDocument = globalThis.document;
const originalFetch = globalThis.fetch;

function revision(serializedPayload) {
  return createHash("sha256").update(serializedPayload).digest("hex").slice(0, 16);
}

function shardUrl(instrumentId, serializedPayload, overrideRevision) {
  return `data/corpus/${instrumentId}.json?v=${
    overrideRevision ?? revision(serializedPayload)
  }`;
}

function installBrowserMocks(fetchImplementation) {
  globalThis.document = { baseURI: "https://example.test/research/" };
  globalThis.fetch = fetchImplementation;
}

test.afterEach(() => {
  clearCorpusShardCache();
  globalThis.document = originalDocument;
  globalThis.fetch = originalFetch;
});

test("loads only a revision-matched shard with the exact indexed ID sets", async () => {
  const instrumentId = "test-law";
  const payload = {
    schemaVersion: "1.0.0",
    instrumentId,
    articleRecords: [{ id: "test-law-art-1" }],
    seedProvisions: [{ id: "test-law-anchor-1" }],
  };
  const serializedPayload = JSON.stringify(payload);
  let fetchCount = 0;
  installBrowserMocks(async () => {
    fetchCount += 1;
    return new Response(serializedPayload, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const options = {
    expected: {
      schemaVersion: "1.0.0",
      articleIds: ["test-law-art-1"],
      seedIds: ["test-law-anchor-1"],
    },
  };
  const url = shardUrl(instrumentId, serializedPayload);
  assert.deepEqual(await loadCorpusShard(instrumentId, url, options), payload);
  assert.deepEqual(await loadCorpusShard(instrumentId, url, options), payload);
  assert.equal(fetchCount, 1, "a verified shard should remain cached");

  assert.deepEqual(
    await loadCorpusShard(instrumentId, url, { ...options, force: true }),
    payload,
  );
  assert.equal(fetchCount, 2, "force retry must replace the verified cache entry");
});

test("rejects a valid JSON shard when an indexed article is missing", async () => {
  const instrumentId = "truncated-law";
  const truncatedPayload = {
    schemaVersion: "1.0.0",
    instrumentId,
    articleRecords: [{ id: "truncated-law-art-1" }],
    seedProvisions: [],
  };
  const serializedPayload = JSON.stringify(truncatedPayload);
  installBrowserMocks(async () =>
    new Response(serializedPayload, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

  await assert.rejects(
    loadCorpusShard(
      instrumentId,
      shardUrl(instrumentId, serializedPayload),
      {
        expected: {
          schemaVersion: "1.0.0",
          articleIds: ["truncated-law-art-1", "truncated-law-art-2"],
          seedIds: [],
        },
      },
    ),
    (error) =>
      error instanceof CorpusLoadError &&
      /wrong article-record ID set.*1\/2.*missing truncated-law-art-2/u.test(
        error.message,
      ),
  );
});

test("rejects a shard whose bytes do not match the registered revision", async () => {
  const instrumentId = "stale-law";
  const payload = {
    schemaVersion: "1.0.0",
    instrumentId,
    articleRecords: [],
    seedProvisions: [],
  };
  const serializedPayload = JSON.stringify(payload);
  installBrowserMocks(async () =>
    new Response(serializedPayload, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

  await assert.rejects(
    loadCorpusShard(
      instrumentId,
      shardUrl(instrumentId, serializedPayload, "0000000000000000"),
      {
        expected: {
          schemaVersion: "1.0.0",
          articleIds: [],
          seedIds: [],
        },
      },
    ),
    (error) =>
      error instanceof CorpusLoadError &&
      /failed its revision check/u.test(error.message),
  );
});

test("rejects a revision-matched shard for another instrument or schema", async () => {
  const requestedInstrumentId = "requested-law";
  const payload = {
    schemaVersion: "0.9.0",
    instrumentId: "different-law",
    articleRecords: [],
    seedProvisions: [],
  };
  const serializedPayload = JSON.stringify(payload);
  installBrowserMocks(async () =>
    new Response(serializedPayload, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

  await assert.rejects(
    loadCorpusShard(
      requestedInstrumentId,
      shardUrl(requestedInstrumentId, serializedPayload),
      {
        expected: {
          schemaVersion: "1.0.0",
          articleIds: [],
          seedIds: [],
        },
      },
    ),
    (error) =>
      error instanceof CorpusLoadError &&
      /incomplete or belongs to another instrument/u.test(error.message),
  );
});
