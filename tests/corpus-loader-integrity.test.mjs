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
  return createHash("sha256").update(serializedPayload).digest("hex");
}

function review(provisionId) {
  return {
    provisionId,
    relevance: "substantive-topic",
    conceptIds: ["test-concept"],
    rationale: "A complete editorial rationale for the test provision.",
    reviewStatus: "editorial-reviewed",
    reviewedOn: "2026-07-25",
  };
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
    articleRecords: [{ id: "test-law-art-1", instrumentId }],
    seedProvisions: [{ id: "test-law-anchor-1", instrumentId }],
    provisionConceptReviews: [
      review("test-law-art-1"),
      review("test-law-anchor-1"),
    ],
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
      reviewIds: ["test-law-art-1", "test-law-anchor-1"],
    },
  };
  const url = shardUrl(instrumentId, serializedPayload);
  const [first, second] = await Promise.all([
    loadCorpusShard(instrumentId, url, options),
    loadCorpusShard(instrumentId, url, options),
  ]);
  assert.deepEqual(first, payload);
  assert.deepEqual(second, payload);
  assert.equal(fetchCount, 1, "concurrent requests should share one fetch");

  assert.deepEqual(await loadCorpusShard(instrumentId, url, options), payload);
  assert.equal(fetchCount, 2, "settled payloads should not remain duplicated in memory");

  assert.deepEqual(
    await loadCorpusShard(instrumentId, url, { ...options, force: true }),
    payload,
  );
  assert.equal(fetchCount, 3, "force retry must start a fresh verified request");
});

test("rejects a valid JSON shard when an indexed article is missing", async () => {
  const instrumentId = "truncated-law";
  const truncatedPayload = {
    schemaVersion: "1.0.0",
    instrumentId,
    articleRecords: [{ id: "truncated-law-art-1", instrumentId }],
    seedProvisions: [],
    provisionConceptReviews: [review("truncated-law-art-1")],
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
          reviewIds: ["truncated-law-art-1"],
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
    provisionConceptReviews: [],
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
      shardUrl(instrumentId, serializedPayload, "0".repeat(64)),
      {
        expected: {
          schemaVersion: "1.0.0",
          articleIds: [],
          seedIds: [],
          reviewIds: [],
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
    provisionConceptReviews: [],
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
          reviewIds: [],
        },
      },
    ),
    (error) =>
      error instanceof CorpusLoadError &&
      /incomplete or belongs to another instrument/u.test(error.message),
  );
});
