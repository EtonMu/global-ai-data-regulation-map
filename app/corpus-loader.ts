export type CorpusShardPayload = {
  schemaVersion: string;
  instrumentId: string;
  articleRecords: unknown[];
  seedProvisions: unknown[];
};

export type CorpusShardExpectation = {
  schemaVersion: string;
  articleIds: readonly string[];
  seedIds: readonly string[];
};

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
  const ids = records.map((record) =>
    record && typeof record === "object" && typeof (record as { id?: unknown }).id === "string"
      ? (record as { id: string }).id
      : null,
  );
  if (ids.some((id) => id === null)) {
    throw new CorpusLoadError(
      instrumentId,
      url,
      `The downloaded corpus shard contains a ${kind} without a stable ID.`,
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
    !Array.isArray((value as CorpusShardPayload).seedProvisions)
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
}

async function corpusRevision(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 verification is unavailable in this browser.");
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .slice(0, 16);
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
      if (!expectedRevision || !/^[a-f0-9]{16}$/u.test(expectedRevision)) {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The registered corpus shard has no valid revision hash.",
        );
      }
      const serializedPayload = await response.text();
      let receivedRevision: string;
      try {
        receivedRevision = await corpusRevision(serializedPayload);
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

  shardPromises.set(instrumentId, request);
  return request;
}
