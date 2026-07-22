import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const [
  index,
  instruments,
  explorerSource,
  clientSource,
  loaderSource,
  lazyResearchSource,
] = await Promise.all([
  readFile(new URL("data/v2/client-corpus-index.json", projectRoot), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("data/v2/instruments.json", projectRoot), "utf8").then(
    JSON.parse,
  ),
  readFile(new URL("app/regulation-explorer.tsx", projectRoot), "utf8"),
  readFile(new URL("app/regulation-explorer-client.tsx", projectRoot), "utf8"),
  readFile(new URL("app/corpus-loader.ts", projectRoot), "utf8"),
  readFile(new URL("app/lazy-research-view.tsx", projectRoot), "utf8"),
]);
const sourceAudits = await readFile(
  new URL("data/v2/source-audit.json", projectRoot),
  "utf8",
).then(JSON.parse);

test("the first explorer chunk contains a lightweight 58-instrument index", () => {
  assert.equal(index.totals.instrumentCount, 58);
  assert.equal(index.totals.mergedProvisionCount, 2932);
  assert.equal(Object.keys(index.shards).length, instruments.length);
  for (const instrument of instruments) {
    assert.match(
      index.shards[instrument.id],
      new RegExp(`^data/corpus/${instrument.id}\\.json\\?v=[a-f0-9]{16}$`),
    );
  }

  for (const article of index.articleRecords) {
    assert.equal(article.fullText, "", `${article.id} leaks full text into index`);
    assert.deepEqual(
      article.paragraphs,
      [],
      `${article.id} leaks paragraphs into index`,
    );
    assert.equal(article.translations, undefined);
    assert.equal(article.currentOperativeText, undefined);
  }
  for (const provision of index.seedProvisions) {
    assert.equal(provision.fullText, undefined);
    assert.equal(provision.paragraphs, undefined);
    assert.equal(provision.translations, undefined);
    assert.equal(provision.alternativeLanguageTexts, undefined);
  }
});

test("complete corpora are fetched and hydrated by instrument instead of imported", () => {
  for (const filename of [
    "gdpr-articles.json",
    "eu-ai-act-articles.json",
    "cn-pipl-articles.json",
    "jp-appi-current-articles.json",
    "au-privacy-act-1988-provisions.json",
  ]) {
    assert.doesNotMatch(
      explorerSource,
      new RegExp(`from ["'][^"']*${filename.replaceAll(".", "\\.")}["']`),
    );
  }
  assert.match(explorerSource, /client-corpus-index\.json/);
  assert.match(explorerSource, /hydrateInstrumentCorpus/);
  assert.match(explorerSource, /Object\.assign\(existing, hydrated\)/);
  assert.match(loaderSource, /const shardPromises = new Map/);
  assert.match(loaderSource, /fetch\(resolvedUrl/);
  assert.match(loaderSource, /cache: options\.force \? "no-cache" : "force-cache"/);
  assert.match(loaderSource, /shardPromises\.delete\(instrumentId\)/);
  assert.match(loaderSource, /corpusRevision\(serializedPayload\)/);
  assert.match(loaderSource, /assertExactIds/);
  assert.match(loaderSource, /expectation\.articleIds/);
  assert.match(loaderSource, /expectation\.seedIds/);
  assert.match(
    explorerSource,
    /hydratedInstrumentIds\.has\(instrumentId\) && !options\.force/,
  );
  assert.match(
    explorerSource,
    /hydratedInstrumentIds\.has\(instrumentId\) && !force/,
  );
});

test("instrument overviews disclose corpus composition and redistribution boundaries", () => {
  assert.match(explorerSource, /LOCAL_CORPUS_COVERAGE/);
  assert.match(explorerSource, /RIGHTS \/ REDISTRIBUTION/);
  assert.match(explorerSource, /sourceTextUnitCount/);
  assert.match(explorerSource, /analyticalAnchorCount/);
  assert.match(explorerSource, /sourceAudit\.localCoverage\.statement/);
  assert.match(explorerSource, /sourceAudit\.rightsBoundary\.note/);
  assert.match(explorerSource, /translation\.status === "official-co-published"/);

  const articleIds = new Set(index.articleRecords.map((record) => record.id));
  const runtimeIdsFor = (instrumentId) =>
    new Set(
      [...index.articleRecords, ...index.seedProvisions]
        .filter((record) => record.instrumentId === instrumentId)
        .map((record) => record.id),
    );
  assert.equal(
    index.articleRecords.filter((record) => record.instrumentId === "ca-pipeda")
      .length,
    84,
  );
  assert.equal(runtimeIdsFor("ca-pipeda").size, 85);
  assert.equal(
    [...runtimeIdsFor("ca-pipeda")].filter((id) => !articleIds.has(id)).length,
    1,
  );
  assert.equal(
    index.articleRecords.filter(
      (record) =>
        record.instrumentId === "ca-directive-automated-decision-making",
    ).length,
    13,
  );
  assert.equal(runtimeIdsFor("ca-directive-automated-decision-making").size, 16);
  assert.equal(
    index.articleRecords.filter(
      (record) => record.instrumentId === "ca-bill-c-27-aida-2022-lapsed",
    ).length,
    0,
  );
  assert.equal(runtimeIdsFor("ca-bill-c-27-aida-2022-lapsed").size, 41);
  assert.match(
    sourceAudits.find(
      (audit) => audit.instrumentId === "ca-bill-c-27-aida-2022-lapsed",
    ).rightsBoundary.note,
    /permission for public redistribution has not been established/i,
  );
});

test("full-text search and Research load the complete corpus only on demand", () => {
  assert.match(
    explorerSource,
    /state\.query\.trim\(\)[\s\S]*?ensureCompleteCorpus\(\)/,
  );
  assert.match(
    explorerSource,
    /state\.view === "research"[\s\S]*?ensureCompleteCorpus\(\)/,
  );
  assert.doesNotMatch(explorerSource, /from "\.\/research-lab-data";\s*\nimport \{ ResearchLab/);
  assert.match(
    explorerSource,
    /dynamic<LazyResearchViewProps>[\s\S]*?import\("\.\/lazy-research-view"\)/,
  );
  assert.match(lazyResearchSource, /ready \? buildResearchLabData\(input\) : null/);
  assert.match(lazyResearchSource, /<ResearchLab/);
});

test("Research subviews, mobile navigation and load failures are recoverable", () => {
  assert.match(explorerSource, /params\.get\("researchView"\)/);
  assert.match(explorerSource, /params\.set\("researchView", researchView\)/);
  assert.match(explorerSource, /params\.get\("researchCoverage"\)/);
  assert.match(
    explorerSource,
    /params\.set\("researchCoverage", researchCoverage\)/,
  );
  assert.match(explorerSource, /params\.get\("researchRelevance"\)/);
  assert.match(
    explorerSource,
    /params\.set\("researchRelevance", researchRelevance\)/,
  );
  assert.match(explorerSource, /initialView=\{researchView\}/);
  assert.match(explorerSource, /onViewChange=\{setResearchView\}/);
  assert.match(explorerSource, /initialCoverageScope=\{researchCoverage\}/);
  assert.match(explorerSource, /initialRelevanceScope=\{researchRelevance\}/);
  assert.match(explorerSource, /onCoverageScopeChange=\{setResearchCoverage\}/);
  assert.match(explorerSource, /onRelevanceScopeChange=\{setResearchRelevance\}/);

  assert.match(explorerSource, /className="mobile-navigator-toggle"/);
  assert.match(explorerSource, /aria-controls="corpus-navigator-panel"/);
  assert.match(explorerSource, /aria-expanded=\{mobileNavigatorOpen\}/);
  assert.match(
    explorerSource,
    /data-mobile-nav-open=\{mobileNavigatorOpen \? "true" : "false"\}/,
  );
  assert.match(explorerSource, /setMobileNavigatorOpen\(false\)/);

  assert.match(clientSource, /EXPLORER_LOAD_INTERRUPTED/);
  assert.match(clientSource, /onClick=\{retry\}/);
  assert.match(clientSource, /window\.location\.reload\(\)/);
  assert.match(explorerSource, /CORPUS_LOAD_INTERRUPTED/);
  assert.match(explorerSource, /RETRY TEXT/);
  assert.match(explorerSource, /onRetryFullTextSearch/);
});

test("generic foreign-law rows expose substantive English editorial previews", () => {
  const pipl = index.articleRecords.find(
    (article) => article.id === "cn-pipl-art-1",
  );
  const appi = index.articleRecords.find(
    (article) => article.id === "jp-appi-art-1",
  );
  assert.ok(pipl);
  assert.ok(appi);
  assert.match(pipl.summary, /protecting the rights and interests/i);
  assert.doesNotMatch(pipl.summary, /government-published english reference/i);
  assert.match(appi.summary, /personal information|digital society/i);
  assert.match(explorerSource, /function provisionEditorialPreview/);
  assert.match(explorerSource, /Editorial preview ·/);
  assert.match(explorerSource, /provision\.translations\?\.en\?\.paragraphs/);
});
