import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const readJson = async (name) =>
  JSON.parse(await readFile(new URL(name, dataRoot), "utf8"));

const [
  jurisdictions,
  instruments,
  provisions,
  relations,
  statusEvents,
  sourceAudits,
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
  readJson("jurisdictions.json"),
  readJson("instruments.json"),
  readJson("provisions.json"),
  readJson("relations.json"),
  readJson("status-events.json"),
  readJson("source-audit.json"),
  readJson("gdpr-articles.json"),
  readJson("eu-ai-act-articles.json"),
  readJson("uk-gdpr-articles.json"),
  readJson("cn-pipl-articles.json"),
  readJson("cn-network-data-regulations-articles.json"),
  readJson("cn-generative-ai-measures-articles.json"),
  readJson("canada-pipeda-provisions.json"),
  readJson("brazil-lgpd-articles.json"),
  readJson("tw-ai-basic-act-2026-articles.json"),
  readJson("tw-personal-data-protection-act-articles.json"),
  readJson("sg-pdpa-provisions.json"),
  readJson("za-popia-sections.json"),
  readJson("ng-ndpa-2023-sections.json"),
  readJson("id-pdp-law-2022-articles.json"),
  readJson("india-dpdp-act-2023-provisions.json"),
  readJson("india-dpdp-rules-2025-provisions.json"),
  readJson("uae-federal-pdpl-45-2021-articles.json"),
  readJson("sa-pdpl-2021-amended-2023-articles.json"),
  readJson("sa-pdpl-implementing-regulation-2023-articles.json"),
  readJson("sa-pdpl-transfer-regulation-2023-articles.json"),
  readJson("au-privacy-act-1988-provisions.json"),
  readJson("jp-appi-current-articles.json"),
  readJson("jp-ai-promotion-act-2025-articles.json"),
  readJson("hk-pdpo-486-provisions.json"),
  readJson("ch-fadp-2020-provisions.json"),
  readJson("vn-personal-data-protection-law-2025-articles.json"),
  readJson("vn-decree-356-2025-provisions.json"),
  readJson("vn-decree-13-2023-historical-provisions.json"),
  readJson("kr-pipa-2011-current-articles.json"),
  readJson("kr-ai-framework-act-2025-current-articles.json"),
  readJson("us-executive-orders-provisions.json"),
  readJson("tw-executive-yuan-generative-ai-guidelines-2023-points.json"),
  readJson("br-ai-bill-2338-2023-articles.json"),
  readJson("us-ca-sb1047-2024-provisions.json"),
  readJson("us-co-ai-act-current-provisions.json"),
  readJson("us-nist-ai-rmf-1-0-corpus.json"),
]);

const instrumentById = new Map(
  instruments.map((instrument) => [instrument.id, instrument]),
);
const provisionById = new Map(
  provisions.map((provision) => [provision.id, provision]),
);
const completeCorpora = [
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
];
const mergedProvisionById = new Map(
  [...provisions, ...completeCorpora.flat()].map((provision) => [
    provision.id,
    provision,
  ]),
);

test("expanded corpus exposes its audited release snapshot", () => {
  const mergedProvisionIds = new Set([
    ...provisions.map((item) => item.id),
    ...completeCorpora.flatMap((corpus) => corpus.map((item) => item.id)),
  ]);
  assert.equal(jurisdictions.length, 30);
  assert.equal(instruments.length, 58);
  assert.equal(provisions.length, 218);
  assert.equal(mergedProvisionIds.size, 2873);
  assert.equal(relations.length, 74);
  assert.equal(statusEvents.length, 116);
  assert.equal(sourceAudits.length, instruments.length);
});

test("high-risk lifecycle corrections remain explicit", () => {
  assert.equal(
    instrumentById.get("ca-bill-c-27-aida-2022-lapsed").lifecycleStatus,
    "lapsed",
  );
  assert.equal(instrumentById.get("tw-ai-basic-act-2026").lifecycleStatus, "in-force");
  assert.equal(
    instrumentById.get("kr-ai-framework-act-2025").lifecycleStatus,
    "in-force-with-scheduled-amendment",
  );
  assert.equal(
    instrumentById.get("vn-personal-data-protection-decree-13-2023")
      .dates.ceasedOn,
    "2026-01-01",
  );
  assert.equal(
    instrumentById.get("au-mandatory-ai-guardrails-proposal-2024")
      .lifecycleStatus,
    "closed-not-proceeding",
  );
  assert.equal(
    instrumentById.get("us-co-sb26-189-admt-2026").lifecycleStatus,
    "partially-in-force-with-principal-duties-scheduled",
  );
  assert.match(instrumentById.get("jp-appi").version, /17 July 2026/);
  assert.match(instrumentById.get("gb-uk-gdpr").version, /5 February 2026/);
});

test("version dates are not substituted for provision commencement dates", () => {
  assert.equal(
    mergedProvisionById.get("sg-pdpa-sec-26a").appliesFrom,
    "2021-02-01",
  );
  assert.equal(
    mergedProvisionById.get("sg-pdpa-sec-48j").appliesFrom,
    "2022-10-01",
  );
  assert.equal(
    mergedProvisionById.get("au-privacy-act-1988-app-1").appliesFrom,
    "2014-03-12",
  );
  assert.equal(
    mergedProvisionById.get("au-privacy-act-1988-sec-26wa").appliesFrom,
    "2018-02-22",
  );
  assert.equal(
    provisionById.get("au-privacy-act-1988-app-1-7-1-9").appliesFrom,
    "2026-12-10",
  );
  assert.equal(provisionById.get("kr-pipa-2011-art-37-2").appliesFrom, null);
});

test("overlapping grouped anchors are split into source-accurate nodes", () => {
  for (const staleId of [
    "au-privacy-act-1988-part-iiic-apps-12-13",
    "ae-federal-pdpl-45-2021-arts-7-12",
    "tw-executive-yuan-generative-ai-guidelines-2023-points-6-7",
    "tw-executive-yuan-generative-ai-guidelines-2023-points-7-8",
    "id-pdp-law-2022-arts-46-53",
    "ca-bill-c-27-aida-2022-lapsed-proposed-ss-5-12",
    "ch-fadp-2020-arts-19-21",
  ]) {
    assert.equal(provisionById.has(staleId), false, `${staleId} must stay removed`);
  }
  assert.equal(
    provisionById.get("id-pdp-law-2022-art-53").supportingSources[0].url,
    "https://s.mkri.id/public/content/persidangan/putusan/putusan_mkri_12970_1753859809.pdf",
  );
  assert.equal(
    mergedProvisionById.get("us-co-ai-act-current-6-1-1705").label,
    "C.R.S. § 6-1-1705",
  );
  assert.deepEqual(
    provisionById.get("cn-network-data-reg-art-9").conceptIds,
    ["security-controls", "incident-response", "accountability-governance"],
  );
  assert.equal(
    provisionById.get("cn-network-data-reg-art-37").translations.en.status,
    "reference",
  );
});

test("source audits state honest local coverage for every instrument", () => {
  const counts = sourceAudits.reduce((map, audit) => {
    map.set(audit.localCoverage.mode, (map.get(audit.localCoverage.mode) ?? 0) + 1);
    return map;
  }, new Map());
  const completeCount = [...counts]
    .filter(([mode]) => mode.startsWith("complete-"))
    .reduce((sum, [, count]) => sum + count, 0);
  assert.equal(completeCount, 38);
  assert.equal(counts.get("selected-source-text-and-index"), 1);
  assert.equal(counts.get("selected-provision-index"), 19);

  for (const provision of provisions.filter(
    (item) =>
      item.textAvailability.mode === "official-source-linked-editorial-summary",
  )) {
    assert.equal(provision.textAvailability.stored, false);
    assert.equal(provision.versionAsOf, "2026-07-19");
    assert.equal(provision.fullText, undefined);
  }
});

test("reviewed expansion relations use precise endpoints and qualified types", () => {
  const expandedRelations = relations.filter((relation) => {
    const number = Number(relation.id.replace("v2-rel-", ""));
    return number >= 43;
  });
  assert.equal(expandedRelations.length, 32);
  assert.equal(
    expandedRelations.some(
      (relation) => relation.type === "superseded-for-current-guidance-by",
    ),
    false,
  );
  assert.equal(
    expandedRelations.find((relation) => relation.id === "v2-rel-047").type,
    "historical-operational-overlap",
  );
  assert.equal(
    expandedRelations.find((relation) => relation.id === "v2-rel-065").type,
    "future-partial-overlap",
  );
  assert.equal(
    expandedRelations.find((relation) => relation.id === "v2-rel-066").type,
    "future-partial-overlap",
  );
  for (const relationId of [
    "v2-rel-044",
    "v2-rel-070",
    "v2-rel-071",
    "v2-rel-053",
    "v2-rel-072",
    "v2-rel-073",
    "v2-rel-074",
    "v2-rel-057",
  ]) {
    assert.equal(
      expandedRelations.find((relation) => relation.id === relationId).verifiedOn,
      "2026-07-20",
    );
  }
  assert.deepEqual(
    expandedRelations.slice(-2).map((relation) => [relation.id, relation.verifiedOn]),
    [["v2-rel-068", "2026-07-20"], ["v2-rel-069", "2026-07-20"]],
  );
});

test("legal-lineage edges stay separate from substantive concept mappings", () => {
  const lifecycleTypes = new Set([
    "policy-transition",
    "repeals",
    "repeals-and-reenacts",
  ]);
  const lifecycleRelations = relations.filter((relation) =>
    lifecycleTypes.has(relation.type),
  );
  assert.deepEqual(
    lifecycleRelations.map((relation) => relation.id),
    ["v2-rel-016", "v2-rel-054", "v2-rel-064"],
  );
  for (const relation of lifecycleRelations) {
    assert.equal(relation.relationClass, "lifecycle");
    assert.deepEqual(relation.conceptIds, []);
  }
});

test("legacy mappings retain qualified time and concept semantics", () => {
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));
  assert.equal(relationById.get("v2-rel-009").type, "future-operational-overlap");
  assert.equal(relationById.get("v2-rel-010").type, "future-partial-overlap");
  assert.equal(relationById.get("v2-rel-012").type, "future-partial-overlap");
  assert.deepEqual(relationById.get("v2-rel-013").conceptIds, [
    "ai-risk-management",
    "impact-assessment",
  ]);
  assert.equal(
    relationById.get("v2-rel-017").type,
    "historical-operational-overlap",
  );
  assert.equal(relationById.get("v2-rel-035").type, "partial-overlap");
  assert.deepEqual(relationById.get("v2-rel-041").conceptIds, [
    "ai-risk-management",
    "incident-response",
  ]);
});
