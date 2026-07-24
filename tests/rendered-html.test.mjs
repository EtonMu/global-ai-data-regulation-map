import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const appRoot = new URL("../app/", import.meta.url);

const [
  explorerSource,
  searchComboboxSource,
  globeSource,
  jurisdictionMarkSource,
] = await Promise.all([
  readFile(new URL("regulation-explorer.tsx", appRoot), "utf8"),
  readFile(new URL("search-combobox.tsx", appRoot), "utf8"),
  readFile(new URL("regulation-globe.tsx", appRoot), "utf8"),
  readFile(new URL("jurisdiction-mark.tsx", appRoot), "utf8"),
]);

async function loadJson(filename) {
  return JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
}

const [
  jurisdictions,
  instruments,
  seedProvisions,
  relations,
  statusEvents,
  concepts,
  conceptThemes,
  gdprArticles,
  euAiActArticles,
  ukGdprArticles,
  piplArticles,
  networkDataArticles,
  generativeAiArticles,
  pipedaProvisions,
  lgpdArticles,
  taiwanAiActArticles,
  taiwanPdpaArticles,
  singaporePdpaProvisions,
  southAfricaPopiaSections,
  nigeriaNdpaSections,
  indonesiaPdpArticles,
  indiaDpdpActProvisions,
  indiaDpdpRulesProvisions,
  uaePdplArticles,
  saudiPdplArticles,
  saudiPdplImplementingArticles,
  saudiPdplTransferArticles,
  australiaPrivacyActProvisions,
  japanAppiArticles,
  japanAiPromotionActArticles,
  hongKongPdpoProvisions,
  swissFadpProvisions,
  vietnamPdplArticles,
  vietnamDecree356Provisions,
  vietnamDecree13Provisions,
  koreaPipaArticles,
  koreaAiFrameworkArticles,
  usExecutiveOrderProvisions,
  taiwanExecutiveYuanGenAiGuidelines,
  brazilAiBillArticles,
  californiaSb1047Provisions,
  coloradoAiActProvisions,
  nistAiRmfCorpus,
] = await Promise.all([
  loadJson("jurisdictions.json"),
  loadJson("instruments.json"),
  loadJson("provisions.json"),
  loadJson("relations.json"),
  loadJson("status-events.json"),
  loadJson("concepts.json"),
  loadJson("concept-themes.json"),
  loadJson("gdpr-articles.json"),
  loadJson("eu-ai-act-articles.json"),
  loadJson("uk-gdpr-articles.json"),
  loadJson("cn-pipl-articles.json"),
  loadJson("cn-network-data-regulations-articles.json"),
  loadJson("cn-generative-ai-measures-articles.json"),
  loadJson("canada-pipeda-provisions.json"),
  loadJson("brazil-lgpd-articles.json"),
  loadJson("tw-ai-basic-act-2026-articles.json"),
  loadJson("tw-personal-data-protection-act-articles.json"),
  loadJson("sg-pdpa-provisions.json"),
  loadJson("za-popia-sections.json"),
  loadJson("ng-ndpa-2023-sections.json"),
  loadJson("id-pdp-law-2022-articles.json"),
  loadJson("india-dpdp-act-2023-provisions.json"),
  loadJson("india-dpdp-rules-2025-provisions.json"),
  loadJson("uae-federal-pdpl-45-2021-articles.json"),
  loadJson("sa-pdpl-2021-amended-2023-articles.json"),
  loadJson("sa-pdpl-implementing-regulation-2023-articles.json"),
  loadJson("sa-pdpl-transfer-regulation-2023-articles.json"),
  loadJson("au-privacy-act-1988-provisions.json"),
  loadJson("jp-appi-current-articles.json"),
  loadJson("jp-ai-promotion-act-2025-articles.json"),
  loadJson("hk-pdpo-486-provisions.json"),
  loadJson("ch-fadp-2020-provisions.json"),
  loadJson("vn-personal-data-protection-law-2025-articles.json"),
  loadJson("vn-decree-356-2025-provisions.json"),
  loadJson("vn-decree-13-2023-historical-provisions.json"),
  loadJson("kr-pipa-2011-current-articles.json"),
  loadJson("kr-ai-framework-act-2025-current-articles.json"),
  loadJson("us-executive-orders-provisions.json"),
  loadJson("tw-executive-yuan-generative-ai-guidelines-2023-points.json"),
  loadJson("br-ai-bill-2338-2023-articles.json"),
  loadJson("us-ca-sb1047-2024-provisions.json"),
  loadJson("us-co-ai-act-current-provisions.json"),
  loadJson("us-nist-ai-rmf-1-0-corpus.json"),
]);

const mergedProvisionIds = new Set([
  ...seedProvisions.map((item) => item.id),
  ...gdprArticles.map((item) => item.id),
  ...euAiActArticles.map((item) => item.id),
  ...ukGdprArticles.map((item) => item.id),
  ...piplArticles.map((item) => item.id),
  ...networkDataArticles.map((item) => item.id),
  ...generativeAiArticles.map((item) => item.id),
  ...pipedaProvisions.map((item) => item.id),
  ...lgpdArticles.map((item) => item.id),
  ...taiwanAiActArticles.map((item) => item.id),
  ...taiwanPdpaArticles.map((item) => item.id),
  ...singaporePdpaProvisions.map((item) => item.id),
  ...southAfricaPopiaSections.map((item) => item.id),
  ...nigeriaNdpaSections.map((item) => item.id),
  ...indonesiaPdpArticles.map((item) => item.id),
  ...indiaDpdpActProvisions.map((item) => item.id),
  ...indiaDpdpRulesProvisions.map((item) => item.id),
  ...uaePdplArticles.map((item) => item.id),
  ...saudiPdplArticles.map((item) => item.id),
  ...saudiPdplImplementingArticles.map((item) => item.id),
  ...saudiPdplTransferArticles.map((item) => item.id),
  ...australiaPrivacyActProvisions.map((item) => item.id),
  ...japanAppiArticles.map((item) => item.id),
  ...japanAiPromotionActArticles.map((item) => item.id),
  ...hongKongPdpoProvisions.map((item) => item.id),
  ...swissFadpProvisions.map((item) => item.id),
  ...vietnamPdplArticles.map((item) => item.id),
  ...vietnamDecree356Provisions.map((item) => item.id),
  ...vietnamDecree13Provisions.map((item) => item.id),
  ...koreaPipaArticles.map((item) => item.id),
  ...koreaAiFrameworkArticles.map((item) => item.id),
  ...usExecutiveOrderProvisions.map((item) => item.id),
  ...taiwanExecutiveYuanGenAiGuidelines.map((item) => item.id),
  ...brazilAiBillArticles.map((item) => item.id),
  ...californiaSb1047Provisions.map((item) => item.id),
  ...coloradoAiActProvisions.map((item) => item.id),
  ...nistAiRmfCorpus.map((item) => item.id),
]);
const corpusCounts = {
  jurisdictions: jurisdictions.length,
  instruments: instruments.length,
  provisions: mergedProvisionIds.size,
  relations: relations.length,
  statusEvents: statusEvents.length,
};
const instrumentById = new Map(instruments.map((item) => [item.id, item]));
const jurisdictionById = new Map(jurisdictions.map((item) => [item.id, item]));
const topLevelGroupOrder = [
  "eu", "us", "cn", "gb", "ca", "jp", "in", "sg", "kr", "au", "br",
  "ae", "sa", "tw", "hk", "id", "vn", "za", "ng", "ch", "frameworks",
];
const frameworkInstrumentIds = [
  "us-nist-ai-rmf-1-0",
  "jp-ai-guidelines-business-1-2",
  "g7-hiroshima-ai-process",
  "un-ai-advisory-final-report-2024",
  "iso-iec-42001-2023",
  "ieee-ethically-aligned-design-2019",
  "oecd-ai-principles",
  "int-bletchley-declaration-2023",
  "sg-model-ai-governance-framework-2020",
  "sg-ai-verify-testing-framework",
  "au-guidance-for-ai-adoption-2025",
  "ae-dubai-ai-ethics-toolkit-2019",
  "ae-generative-ai-guide-2023",
  "sa-sdaia-ai-ethics-principles-1-0-2023",
  "tw-executive-yuan-generative-ai-guidelines-2023",
  "hk-ai-model-pd-protection-framework-2024",
  "hk-ethical-ai-guidance-2021",
  "hk-genai-employee-guidelines-checklist-2025",
];
const expectedFlagCodes = new Map([
  ["eu", "EU"],
  ["us", "US"],
  ["cn", "CN"],
  ["gb", "GB"],
  ["ca", "CA"],
  ["jp", "JP"],
  ["in", "IN"],
  ["sg", "SG"],
  ["kr", "KR"],
  ["au", "AU"],
  ["br", "BR"],
  ["ae", "AE"],
  ["sa", "SA"],
  ["tw", "TW"],
  ["hk", "HK"],
  ["id", "ID"],
  ["vn", "VN"],
  ["za", "ZA"],
  ["ng", "NG"],
  ["ch", "CH"],
]);
const expectedIssuerMarks = new Map([
  ["int", ["International frameworks and soft law", "INT"]],
  ["g7", ["Group of Seven", "G7"]],
  ["un", ["United Nations", "UN"]],
  ["iso-iec", ["ISO and IEC", "ISO"]],
  [
    "ieee",
    ["Institute of Electrical and Electronics Engineers", "IEEE"],
  ],
  [
    "oecd",
    ["Organisation for Economic Co-operation and Development", "OECD"],
  ],
  ["ai-safety-summit", ["AI Safety Summit", "AISS"]],
]);

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

function normalizedText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&#xB7;/gi, "·")
    .replace(/&rarr;/g, "→")
    .replace(/\s+/g, " ")
    .trim();
}

test("corpus fixtures expose unique dynamically counted records", () => {
  assert.equal(
    new Set(jurisdictions.map((item) => item.id)).size,
    corpusCounts.jurisdictions,
    `all ${corpusCounts.jurisdictions} authority and jurisdiction contexts must be unique`,
  );
  assert.equal(
    new Set(instruments.map((item) => item.id)).size,
    corpusCounts.instruments,
    `all ${corpusCounts.instruments} instruments must be unique`,
  );
  assert.equal(
    new Set(relations.map((item) => item.id)).size,
    corpusCounts.relations,
    `all ${corpusCounts.relations} relations must be unique`,
  );
  assert.equal(
    new Set(statusEvents.map((item) => item.id)).size,
    corpusCounts.statusEvents,
    `all ${corpusCounts.statusEvents} lifecycle events must be unique`,
  );
  assert.ok(
    statusEvents.every((event) => instrumentById.has(event.instrumentId)),
    `all ${corpusCounts.statusEvents} lifecycle events must resolve to an instrument`,
  );
  assert.ok(
    frameworkInstrumentIds.every((id) => instrumentById.has(id)),
    "the complete framework lane fixture must resolve to corpus instruments",
  );
  assert.equal(
    new Set(conceptThemes.map((theme) => theme.id)).size,
    conceptThemes.length,
    "core-concept themes must be unique",
  );
  assert.ok(
    concepts.every((concept) =>
      conceptThemes.some((theme) => theme.id === concept.theme),
    ),
    "every core concept must resolve to a visible theme",
  );
});

test("server returns a neutral static atlas shell without loading the corpus", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-vinext-cache"), "STATIC");

  const html = await response.text();
  const text = normalizedText(html);

  assert.match(
    html,
    /<title>Compliance Compass: Global AI Governance and Data Regulation Map &amp; Visualization<\/title>/i,
  );
  assert.match(
    html,
    /<main(?=[^>]*class="explorer-loading-shell")(?=[^>]*aria-busy="true")(?=[^>]*aria-live="polite")[^>]*>/i,
  );
  assert.match(text, /COMPLIANCE_COMPASS/i);
  assert.match(text, /Loading the global regulatory atlas/i);
  assert.match(text, /Preparing legal corpora and knowledge relationships/i);
  assert.match(
    html,
    /<link[^>]*rel="modulepreload"[^>]*regulation-explorer-client-[^"/]+\.js/i,
    "the static shell must preload only the small client boundary",
  );
  assert.doesNotMatch(
    html,
    /class="terminal-app"|data-atlas-group=|Comparative AI and data regulation corpus/i,
    "the Worker response must not render or parse the heavy atlas corpus",
  );

  assert.doesNotMatch(
    text,
    /No single law is the center|Trace one regulatory obligation across borders|Regulatory crosswalk lattice/i,
  );
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Starter Project/i,
  );
});

test("the browser atlas retains semantic controls and the relation globe contract", () => {
  assert.match(
    explorerSource,
    /<main className="terminal-app" data-workspace-density=\{workspaceDensity\}>/,
  );
  assert.match(
    explorerSource,
    /className="corpus-navigator"[\s\S]*?aria-label="Global regulation corpus"/,
  );
  assert.match(explorerSource, /<SearchCombobox/);
  assert.match(searchComboboxSource, /<input[\s\S]*?type="search"/);
  assert.match(
    searchComboboxSource,
    /Search legal sources, provisions, and core concepts/,
  );
  assert.match(
    explorerSource,
    /className="navigator-tabs"[\s\S]*?role="tablist"[\s\S]*?aria-label="Research index"/,
  );
  assert.match(explorerSource, /id="navigator-tab-sources"[\s\S]*?GLOBAL ATLAS/);
  assert.match(
    explorerSource,
    /id="navigator-tab-concepts"[\s\S]*?CORE CONCEPTS/,
  );
  assert.match(
    explorerSource,
    /className="primary-navigation"[\s\S]*?aria-label="Primary navigation"[\s\S]*?primaryNavigation\.map/,
  );
  assert.match(
    explorerSource,
    /className="workspace-density-toggle"[\s\S]*?Full workspace[\s\S]*?Guided view/,
  );
  assert.match(
    explorerSource,
    /className="theme-switch"[\s\S]*?role="group"[\s\S]*?aria-label="Color theme"/,
  );
  assert.match(
    explorerSource,
    /className="workspace center-column-panel"[\s\S]*?aria-label="Legal source content"/,
  );
  assert.match(
    explorerSource,
    /const atlasGlobePanel =[\s\S]*?workspaceDensity === "research"[\s\S]*?<RegulationGlobe[\s\S]*?const rightVisualizationPanel =/,
    "the full research workspace must mount the relation globe in the right visualization column",
  );
  assert.match(
    globeSource,
    /<canvas[\s\S]*?role="img"[\s\S]*?aria-label=\{`\$\{jurisdictions\.length\} jurisdiction nodes connected to \$\{displayedConceptCount\} core concept nodes/,
    "the point-cloud globe must expose an accessible canvas description",
  );
  assert.match(globeSource, /aria-label="Jurisdictions plotted on the regulation globe"/);
  assert.match(globeSource, /aria-label="Core concepts connected on the regulation globe"/);
  assert.match(explorerSource, /className="interface-back-button"[\s\S]*?disabled=\{historyDepth === 0\}[\s\S]*?Return to previous interface/);
  assert.match(explorerSource, /className="breadcrumbs" aria-label="Current location"/);
  assert.match(explorerSource, /aria-current=\{part\.current \? "page" : undefined\}/);
  assert.match(explorerSource, /className="github-link"[\s\S]*?href=\{repositoryUrl\}[\s\S]*?target="_blank"/);
});

test("client grouping preserves jurisdiction order, SVG marks, and the framework lane", () => {
  const orderBlock = explorerSource.match(
    /const atlasGroupOrder = \[([\s\S]*?)\];/,
  )?.[1];
  assert.ok(orderBlock, "the client must declare one deterministic Atlas order");
  const declaredOrder = [...orderBlock.matchAll(/"([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(declaredOrder, topLevelGroupOrder);

  const groupForInstrument = (instrument) => {
    let jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
    const seen = new Set();
    if (jurisdiction?.id !== "hk") {
      while (jurisdiction?.parentId && !seen.has(jurisdiction.id)) {
        seen.add(jurisdiction.id);
        jurisdiction = jurisdictionById.get(jurisdiction.parentId) ?? jurisdiction;
      }
    }
    const type = jurisdiction?.type ?? "";
    return type.includes("international") ||
      type.includes("intergovernmental") ||
      type.includes("standards")
      ? "frameworks"
      : jurisdiction?.id;
  };
  const actualGroups = [...new Set(instruments.map(groupForInstrument))]
    .filter(Boolean)
    .sort(
      (left, right) =>
        topLevelGroupOrder.indexOf(left) - topLevelGroupOrder.indexOf(right),
    );
  assert.deepEqual(actualGroups, topLevelGroupOrder);

  assert.match(
    explorerSource,
    /className="atlas-lane"[\s\S]*?data-atlas-group=\{group\.id\}/,
  );
  assert.match(explorerSource, /className="instrument-kind-icon" aria-hidden="true"/);
  assert.match(jurisdictionMarkSource, /data-flag-code=\{flag\.code\}[\s\S]*?aria-hidden="true"/);
  assert.match(jurisdictionMarkSource, /data-issuer-id=[\s\S]*?aria-label=\{issuer\.label\}[\s\S]*?role="img"/);
  assert.doesNotMatch(
    jurisdictionMarkSource,
    /[\u{1f1e6}-\u{1f1ff}]/u,
    "navigation marks must use SVG flags, not regional-indicator emoji",
  );

  for (const [jurisdictionId, flagCode] of expectedFlagCodes) {
    assert.ok(jurisdictionById.has(jurisdictionId));
    assert.match(
      jurisdictionMarkSource,
      new RegExp(`\\b${jurisdictionId}: \\{ code: "${flagCode}"`),
      `${jurisdictionId} must retain its SVG flag mapping`,
    );
  }
  for (const [issuerId, [label, abbreviation]] of expectedIssuerMarks) {
    assert.match(jurisdictionMarkSource, new RegExp(`"?${issuerId}"?: \\{`));
    assert.ok(jurisdictionMarkSource.includes(`abbreviation: "${abbreviation}"`));
    assert.ok(jurisdictionMarkSource.includes(`label: "${label}"`));
  }
});
