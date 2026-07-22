import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const load = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));

const [
  seed,
  gdpr,
  aiAct,
  ukGdpr,
  pipl,
  networkData,
  generativeAi,
  pipeda,
  canadaAdm,
  lgpd,
  taiwanAiAct,
  taiwanPdpa,
  singaporePdpa,
  southAfricaPopia,
  nigeriaNdpa,
  indonesiaPdp,
  indiaDpdpAct,
  indiaDpdpRules,
  uaePdpl,
  saudiPdpl,
  saudiImplementing,
  saudiTransfer,
  australiaPrivacy,
  japanAppi,
  japanAiPromotionAct,
  hongKongPdpo,
  swissFadp,
  vietnamPdpl,
  vietnamDecree356,
  vietnamDecree13,
  koreaPipa,
  koreaAiFramework,
  usExecutiveOrders,
  taiwanExecutiveYuanGenAiGuidelines,
  brazilAiBill,
  californiaSb1047,
  coloradoAiAct,
  nistAiRmf,
  concepts,
  reviews,
] = await Promise.all([
  load("provisions.json"),
  load("gdpr-articles.json"),
  load("eu-ai-act-articles.json"),
  load("uk-gdpr-articles.json"),
  load("cn-pipl-articles.json"),
  load("cn-network-data-regulations-articles.json"),
  load("cn-generative-ai-measures-articles.json"),
  load("canada-pipeda-provisions.json"),
  load("canada-adm-directive-provisions.json"),
  load("brazil-lgpd-articles.json"),
  load("tw-ai-basic-act-2026-articles.json"),
  load("tw-personal-data-protection-act-articles.json"),
  load("sg-pdpa-provisions.json"),
  load("za-popia-sections.json"),
  load("ng-ndpa-2023-sections.json"),
  load("id-pdp-law-2022-articles.json"),
  load("india-dpdp-act-2023-provisions.json"),
  load("india-dpdp-rules-2025-provisions.json"),
  load("uae-federal-pdpl-45-2021-articles.json"),
  load("sa-pdpl-2021-amended-2023-articles.json"),
  load("sa-pdpl-implementing-regulation-2023-articles.json"),
  load("sa-pdpl-transfer-regulation-2023-articles.json"),
  load("au-privacy-act-1988-provisions.json"),
  load("jp-appi-current-articles.json"),
  load("jp-ai-promotion-act-2025-articles.json"),
  load("hk-pdpo-486-provisions.json"),
  load("ch-fadp-2020-provisions.json"),
  load("vn-personal-data-protection-law-2025-articles.json"),
  load("vn-decree-356-2025-provisions.json"),
  load("vn-decree-13-2023-historical-provisions.json"),
  load("kr-pipa-2011-current-articles.json"),
  load("kr-ai-framework-act-2025-current-articles.json"),
  load("us-executive-orders-provisions.json"),
  load("tw-executive-yuan-generative-ai-guidelines-2023-points.json"),
  load("br-ai-bill-2338-2023-articles.json"),
  load("us-ca-sb1047-2024-provisions.json"),
  load("us-co-ai-act-current-provisions.json"),
  load("us-nist-ai-rmf-1-0-corpus.json"),
  load("concepts.json"),
  load("provision-concepts.json"),
]);

const mergedIds = new Set([
  ...seed.map((item) => item.id),
  ...gdpr.map((item) => item.id),
  ...aiAct.map((item) => item.id),
  ...ukGdpr.map((item) => item.id),
  ...pipl.map((item) => item.id),
  ...networkData.map((item) => item.id),
  ...generativeAi.map((item) => item.id),
  ...pipeda.map((item) => item.id),
  ...canadaAdm.map((item) => item.id),
  ...lgpd.map((item) => item.id),
  ...taiwanAiAct.map((item) => item.id),
  ...taiwanPdpa.map((item) => item.id),
  ...singaporePdpa.map((item) => item.id),
  ...southAfricaPopia.map((item) => item.id),
  ...nigeriaNdpa.map((item) => item.id),
  ...indonesiaPdp.map((item) => item.id),
  ...indiaDpdpAct.map((item) => item.id),
  ...indiaDpdpRules.map((item) => item.id),
  ...uaePdpl.map((item) => item.id),
  ...saudiPdpl.map((item) => item.id),
  ...saudiImplementing.map((item) => item.id),
  ...saudiTransfer.map((item) => item.id),
  ...australiaPrivacy.map((item) => item.id),
  ...japanAppi.map((item) => item.id),
  ...japanAiPromotionAct.map((item) => item.id),
  ...hongKongPdpo.map((item) => item.id),
  ...swissFadp.map((item) => item.id),
  ...vietnamPdpl.map((item) => item.id),
  ...vietnamDecree356.map((item) => item.id),
  ...vietnamDecree13.map((item) => item.id),
  ...koreaPipa.map((item) => item.id),
  ...koreaAiFramework.map((item) => item.id),
  ...usExecutiveOrders.map((item) => item.id),
  ...taiwanExecutiveYuanGenAiGuidelines.map((item) => item.id),
  ...brazilAiBill.map((item) => item.id),
  ...californiaSb1047.map((item) => item.id),
  ...coloradoAiAct.map((item) => item.id),
  ...nistAiRmf.map((item) => item.id),
]);
const conceptIds = new Set(concepts.map((item) => item.id));

test("every merged provision has one audited topic-relevance record", () => {
  assert.equal(reviews.length, mergedIds.size);
  assert.equal(new Set(reviews.map((review) => review.provisionId)).size, reviews.length);
  for (const review of reviews) {
    assert.ok(mergedIds.has(review.provisionId), review.provisionId);
    assert.match(review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(review.reviewStatus, "editorial-reviewed");
  }
});

test("every substantive provision resolves to at least one core concept", () => {
  const substantive = reviews.filter(
    (review) => review.relevance === "substantive-topic",
  );
  assert.ok(substantive.length > 700);
  for (const review of substantive) {
    assert.ok(review.conceptIds.length > 0, review.provisionId);
    for (const conceptId of review.conceptIds) {
      assert.ok(conceptIds.has(conceptId), `${review.provisionId}: ${conceptId}`);
    }
  }
});

test("known high-value provisions retain precise concept mappings", () => {
  const byId = new Map(reviews.map((review) => [review.provisionId, review]));
  assert.ok(byId.get("eu-gdpr-art-25").conceptIds.includes("privacy-by-design-default"));
  assert.ok(byId.get("eu-gdpr-art-32").conceptIds.includes("security-controls"));
  assert.ok(byId.get("eu-ai-act-art-14").conceptIds.includes("human-oversight"));
  assert.ok(byId.get("eu-ai-act-art-55").conceptIds.includes("frontier-model-safety"));
  assert.ok(byId.get("gb-uk-gdpr-art-22c").conceptIds.includes("human-oversight"));
  assert.ok(byId.get("ch-fadp-2020-art-24").conceptIds.includes("incident-response"));
  assert.ok(byId.get("kr-pipa-2011-art-37-2").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("kr-ai-framework-act-2025-art-34").conceptIds.includes("human-oversight"));
  assert.ok(byId.get("vn-decree-356-2025-form-10").conceptIds.includes("impact-assessment"));
  assert.ok(byId.get("us-eo-14110-sec-4-2").conceptIds.includes("frontier-model-safety"));
  assert.ok(byId.get("cn-pipl-art-24").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("cn-network-data-reg-art-35").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("cn-genai-art-7").conceptIds.includes("training-data-governance"));
  assert.ok(byId.get("ca-pipeda-sec-10-1").conceptIds.includes("incident-response"));
  assert.ok(
    byId
      .get("ca-pipeda-nif-2026-c3-s389")
      .conceptIds.includes("data-subject-rights"),
  );
  assert.ok(
    byId
      .get("ca-adm-directive-sec-6")
      .conceptIds.includes("automated-decision-safeguards"),
  );
  assert.ok(
    byId
      .get("ca-adm-directive-appendix-c")
      .conceptIds.includes("human-oversight"),
  );
  assert.equal(byId.get("in-dpdp-act-2023-s44").relevance, "structural-context");
  assert.deepEqual(byId.get("in-dpdp-act-2023-s44").conceptIds, []);
  assert.ok(byId.get("ca-pipeda-sch-1").conceptIds.includes("security-controls"));
  assert.ok(byId.get("br-lgpd-art-20").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("br-lgpd-art-48").conceptIds.includes("incident-response"));
  assert.ok(byId.get("tw-ai-basic-act-2026-art-14").conceptIds.includes("privacy-by-design-default"));
  assert.ok(byId.get("tw-personal-data-protection-act-art-21").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("tw-personal-data-protection-act-art-27").conceptIds.includes("security-controls"));
  assert.ok(byId.get("sg-pdpa-sec-24").conceptIds.includes("security-controls"));
  assert.ok(byId.get("sg-pdpa-sec-26").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("sg-pdpa-sec-26d").conceptIds.includes("incident-response"));
  assert.ok(byId.get("za-popia-s-19").conceptIds.includes("security-controls"));
  assert.ok(byId.get("za-popia-s-71").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("ng-ndpa-2023-s-37").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("id-pdp-law-2022-art-53").conceptIds.includes("accountability-governance"));
  assert.ok(byId.get("in-dpdp-act-2023-s8").conceptIds.includes("incident-response"));
  assert.ok(byId.get("in-dpdp-rules-2025-r6").conceptIds.includes("security-controls"));
  assert.ok(byId.get("ae-federal-pdpl-45-2021-a18").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("sa-pdpl-2021-amended-2023-a29").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("sa-pdpl-implementing-regulation-2023-a25").conceptIds.includes("impact-assessment"));
  assert.ok(byId.get("sa-pdpl-transfer-regulation-2023-a7").conceptIds.includes("impact-assessment"));
  assert.ok(byId.get("au-privacy-act-1988-app-1").conceptIds.includes("privacy-by-design-default"));
  assert.ok(byId.get("au-privacy-act-1988-app-8").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("au-privacy-act-1988-app-11").conceptIds.includes("security-controls"));
  assert.ok(byId.get("jp-appi-art-23").conceptIds.includes("security-controls"));
  assert.ok(byId.get("jp-appi-art-26").conceptIds.includes("incident-response"));
  assert.ok(byId.get("jp-appi-art-28").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("jp-ai-promotion-act-2025-art-3").conceptIds.includes("fairness-nondiscrimination"));
  assert.ok(byId.get("jp-ai-promotion-act-2025-art-13").conceptIds.includes("frontier-model-safety"));
  assert.ok(byId.get("hk-personal-data-privacy-ordinance-sec-30").conceptIds.includes("automated-decision-safeguards"));
  assert.ok(byId.get("hk-personal-data-privacy-ordinance-sec-33").conceptIds.includes("cross-border-transfer"));
  assert.ok(byId.get("hk-personal-data-privacy-ordinance-schedule-1").conceptIds.includes("data-minimization"));
  assert.ok(byId.get("br-pl2338-art-25").conceptIds.includes("impact-assessment"));
  assert.ok(byId.get("us-ca-sb1047-2024-proposed-bpc-22603").conceptIds.includes("ai-risk-management"));
  assert.ok(byId.get("us-co-ai-act-current-6-1-1705").conceptIds.includes("data-subject-rights"));
  assert.ok(byId.get("us-nist-ai-rmf-1-0-core-map-2-2").conceptIds.includes("ai-risk-management"));
  assert.equal(byId.get("eu-ai-act-art-105").relevance, "structural-context");
  assert.equal(byId.get("gb-uk-gdpr-art-91a").relevance, "structural-context");
  assert.equal(byId.get("cn-pipl-art-74").relevance, "structural-context");
  assert.equal(byId.get("ca-pipeda-sch-2").relevance, "structural-context");
  assert.equal(byId.get("br-lgpd-art-28").relevance, "structural-context");
  assert.equal(byId.get("tw-ai-basic-act-2026-art-20").relevance, "structural-context");
  assert.equal(byId.get("tw-personal-data-protection-act-art-56").relevance, "structural-context");
  assert.equal(byId.get("sg-pdpa-sec-27").relevance, "structural-context");
  assert.equal(byId.get("za-popia-s-115").relevance, "structural-context");
  assert.equal(byId.get("ng-ndpa-2023-schedule").relevance, "structural-context");
  assert.equal(byId.get("id-pdp-law-2022-art-76").relevance, "structural-context");
  assert.equal(byId.get("in-dpdp-act-2023-s1").relevance, "structural-context");
  assert.equal(byId.get("sa-pdpl-transfer-regulation-2023-a9").relevance, "structural-context");
  assert.equal(byId.get("au-privacy-act-1988-sec-1").relevance, "structural-context");
  assert.match(
    byId.get("tw-personal-data-protection-act-art-12").rationale,
    /not-in-force|not yet|commencement/i,
  );
});
