export type CorpusShardPayload = {
  schemaVersion: string;
  instrumentId: string;
  articleRecords: unknown[];
  seedProvisions: unknown[];
  provisionConceptReviews: unknown[];
};

export type CorpusShardExpectation = {
  schemaVersion: string;
  articleIds: readonly string[];
  seedIds: readonly string[];
  reviewIds: readonly string[];
};

const MAX_CORPUS_SHARD_BYTES = 8 * 1024 * 1024;

export class CorpusLoadError extends Error {
  instrumentId: string;
  url: string;
  status?: number;

  constructor(
    instrumentId: string,
    url: string,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "CorpusLoadError";
    this.instrumentId = instrumentId;
    this.url = url;
    this.status = status;
  }
}

const shardPromises = new Map<string, Promise<CorpusShardPayload>>();

function resolvedCorpusUrl(url: string) {
  return new URL(url, document.baseURI).toString();
}

function shardRecordIds(
  records: unknown[],
  kind: string,
  instrumentId: string,
  url: string,
) {
  const ids = records.map((record) => {
    if (!record || typeof record !== "object") return null;
    const candidate = record as {
      id?: unknown;
      instrumentId?: unknown;
      paragraphs?: unknown;
      fullText?: unknown;
      conceptIds?: unknown;
    };
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.instrumentId !== "string" ||
      (candidate.paragraphs !== undefined &&
        (!Array.isArray(candidate.paragraphs) ||
          candidate.paragraphs.some((paragraph) => typeof paragraph !== "string"))) ||
      (candidate.fullText !== undefined && typeof candidate.fullText !== "string") ||
      (candidate.conceptIds !== undefined &&
        (!Array.isArray(candidate.conceptIds) ||
          candidate.conceptIds.some((conceptId) => typeof conceptId !== "string")))
    ) {
      return null;
    }
    return candidate.id;
  });
  if (ids.some((id) => id === null)) {
    throw new CorpusLoadError(
      instrumentId,
      url,
      `The downloaded corpus shard contains a ${kind} without a stable ID.`,
    );
  }
  return ids as string[];
}

function shardReviewIds(
  records: unknown[],
  instrumentId: string,
  url: string,
) {
  const ids = records.map((record) => {
    if (!record || typeof record !== "object") return null;
    const candidate = record as {
      provisionId?: unknown;
      relevance?: unknown;
      conceptIds?: unknown;
      candidateConceptIds?: unknown;
      contextualConceptIds?: unknown;
      candidateContextualConceptIds?: unknown;
      rationale?: unknown;
      reviewStatus?: unknown;
      mappingBasis?: unknown;
      confidence?: unknown;
      reviewedOn?: unknown;
    };
    if (
      typeof candidate.provisionId !== "string" ||
      !["substantive-topic", "structural-context"].includes(
        String(candidate.relevance),
      ) ||
      !Array.isArray(candidate.conceptIds) ||
      candidate.conceptIds.some((conceptId) => typeof conceptId !== "string") ||
      (candidate.candidateConceptIds !== undefined &&
        (!Array.isArray(candidate.candidateConceptIds) ||
          candidate.candidateConceptIds.some(
            (conceptId) => typeof conceptId !== "string",
          ))) ||
      (candidate.contextualConceptIds !== undefined &&
        (!Array.isArray(candidate.contextualConceptIds) ||
          candidate.contextualConceptIds.some(
            (conceptId) => typeof conceptId !== "string",
          ))) ||
      (candidate.candidateContextualConceptIds !== undefined &&
        (!Array.isArray(candidate.candidateContextualConceptIds) ||
          candidate.candidateContextualConceptIds.some(
            (conceptId) => typeof conceptId !== "string",
          ))) ||
      typeof candidate.rationale !== "string" ||
      !["editorial-reviewed", "machine-candidate"].includes(
        String(candidate.reviewStatus),
      ) ||
      !["curated-anchor", "rule-generated"].includes(
        String(candidate.mappingBasis),
      ) ||
      !["low", "medium", "high"].includes(String(candidate.confidence)) ||
      typeof candidate.reviewedOn !== "string"
    ) {
      return null;
    }
    return candidate.provisionId;
  });
  if (ids.some((id) => id === null)) {
    throw new CorpusLoadError(
      instrumentId,
      url,
      "The downloaded corpus shard contains an invalid concept review.",
    );
  }
  return ids as string[];
}

function assertExactIds(
  actualIds: string[],
  expectedIds: readonly string[],
  kind: string,
  instrumentId: string,
  url: string,
) {
  const actual = new Set(actualIds);
  const expected = new Set(expectedIds);
  const hasDuplicates = actual.size !== actualIds.length;
  const missing = expectedIds.filter((id) => !actual.has(id));
  const unexpected = actualIds.filter((id) => !expected.has(id));
  if (
    hasDuplicates ||
    actualIds.length !== expectedIds.length ||
    missing.length ||
    unexpected.length
  ) {
    const detail = [
      missing.length ? `missing ${missing.slice(0, 3).join(", ")}` : "",
      unexpected.length
        ? `unexpected ${unexpected.slice(0, 3).join(", ")}`
        : "",
      hasDuplicates ? "duplicate IDs" : "",
    ]
      .filter(Boolean)
      .join("; ");
    throw new CorpusLoadError(
      instrumentId,
      url,
      `The downloaded corpus shard has the wrong ${kind} set (${actualIds.length}/${expectedIds.length}${
        detail ? `; ${detail}` : ""
      }).`,
    );
  }
}

function assertCorpusShard(
  value: unknown,
  expectedInstrumentId: string,
  expectation: CorpusShardExpectation,
  url: string,
): asserts value is CorpusShardPayload {
  if (
    !value ||
    typeof value !== "object" ||
    (value as CorpusShardPayload).schemaVersion !== expectation.schemaVersion ||
    (value as CorpusShardPayload).instrumentId !== expectedInstrumentId ||
    !Array.isArray((value as CorpusShardPayload).articleRecords) ||
    !Array.isArray((value as CorpusShardPayload).seedProvisions) ||
    !Array.isArray((value as CorpusShardPayload).provisionConceptReviews)
  ) {
    throw new CorpusLoadError(
      expectedInstrumentId,
      url,
      "The downloaded corpus shard is incomplete or belongs to another instrument.",
    );
  }

  assertExactIds(
    shardRecordIds(
      (value as CorpusShardPayload).articleRecords,
      "article record",
      expectedInstrumentId,
      url,
    ),
    expectation.articleIds,
    "article-record ID",
    expectedInstrumentId,
    url,
  );
  assertExactIds(
    shardRecordIds(
      (value as CorpusShardPayload).seedProvisions,
      "seed provision",
      expectedInstrumentId,
      url,
    ),
    expectation.seedIds,
    "seed-provision ID",
    expectedInstrumentId,
    url,
  );
  assertExactIds(
    shardReviewIds(
      (value as CorpusShardPayload).provisionConceptReviews,
      expectedInstrumentId,
      url,
    ),
    expectation.reviewIds,
    "concept-review ID",
    expectedInstrumentId,
    url,
  );
}

async function corpusRevision(value: Uint8Array) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 verification is unavailable in this browser.");
  }
  const digestInput = value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", digestInput);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("");
}

export function clearCorpusShardCache(instrumentId?: string) {
  if (instrumentId) shardPromises.delete(instrumentId);
  else shardPromises.clear();
}

export function loadCorpusShard(
  instrumentId: string,
  url: string,
  options: {
    force?: boolean;
    expected: CorpusShardExpectation;
  },
) {
  if (options.force) shardPromises.delete(instrumentId);
  const pending = shardPromises.get(instrumentId);
  if (pending) return pending;

  const resolvedUrl = resolvedCorpusUrl(url);
  const expectedRevision = new URL(resolvedUrl).searchParams.get("v");
  const request = fetch(resolvedUrl, {
    cache: options.force ? "no-cache" : "force-cache",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          `The legal-text corpus could not be downloaded (HTTP ${response.status}).`,
          response.status,
        );
      }
      if (!expectedRevision || !/^[a-f0-9]{64}$/u.test(expectedRevision)) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The registered corpus shard has no valid revision hash.",
        );
      }
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > MAX_CORPUS_SHARD_BYTES) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The legal-text corpus shard exceeds the allowed download size.",
        );
      }
      const serializedPayload = await response.text();
      const serializedBytes = new TextEncoder().encode(serializedPayload);
      if (serializedBytes.byteLength > MAX_CORPUS_SHARD_BYTES) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The legal-text corpus shard exceeds the allowed download size.",
        );
      }
      let receivedRevision: string;
      try {
        receivedRevision = await corpusRevision(serializedBytes);
      } catch (error) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          error instanceof Error
            ? error.message
            : "The corpus shard could not be integrity-checked.",
        );
      }
      if (receivedRevision !== expectedRevision) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          `The legal-text corpus failed its revision check (${receivedRevision}/${expectedRevision}).`,
        );
      }
      let payload: unknown;
      try {
        payload = JSON.parse(serializedPayload);
      } catch {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The legal-text corpus response was not valid JSON.",
        );
      }
      assertCorpusShard(payload, instrumentId, options.expected, resolvedUrl);
      return payload;
    })
    .catch((error: unknown) => {
      shardPromises.delete(instrumentId);
      if (error instanceof CorpusLoadError) throw error;
      throw new CorpusLoadError(
        instrumentId,
        resolvedUrl,
        error instanceof Error
          ? error.message
          : "The legal-text corpus could not be downloaded.",
      );
    });

  const trackedRequest = request.finally(() => {
    if (shardPromises.get(instrumentId) === trackedRequest) {
      shardPromises.delete(instrumentId);
    }
  });
  shardPromises.set(instrumentId, trackedRequest);
  return trackedRequest;
}
