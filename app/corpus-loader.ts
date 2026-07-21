export type CorpusShardPayload = {
  schemaVersion: string;
  instrumentId: string;
  articleRecords: unknown[];
  seedProvisions: unknown[];
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

function assertCorpusShard(
  value: unknown,
  expectedInstrumentId: string,
  url: string,
): asserts value is CorpusShardPayload {
  if (
    !value ||
    typeof value !== "object" ||
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
}

export function clearCorpusShardCache(instrumentId?: string) {
  if (instrumentId) shardPromises.delete(instrumentId);
  else shardPromises.clear();
}

export function loadCorpusShard(
  instrumentId: string,
  url: string,
  options: { force?: boolean } = {},
) {
  if (options.force) shardPromises.delete(instrumentId);
  const pending = shardPromises.get(instrumentId);
  if (pending) return pending;

  const resolvedUrl = resolvedCorpusUrl(url);
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
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new CorpusLoadError(
          instrumentId,
          resolvedUrl,
          "The legal-text corpus response was not valid JSON.",
        );
      }
      assertCorpusShard(payload, instrumentId, resolvedUrl);
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
