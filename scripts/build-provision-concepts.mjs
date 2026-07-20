import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataRoot = resolve(root, "data/v2");
const reviewedOn = "2026-07-20";

async function load(filename) {
  return JSON.parse(await readFile(resolve(dataRoot, filename), "utf8"));
}

const [
  seedProvisions,
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
  vietnamDecree13HistoricalProvisions,
  koreaPipaArticles,
  koreaAiFrameworkArticles,
  usExecutiveOrderProvisions,
  taiwanExecutiveYuanGenAiGuidelines,
  brazilAiBillArticles,
  californiaSb1047Provisions,
  coloradoAiActProvisions,
  nistAiRmfCorpus,
] = await Promise.all([
  load("provisions.json"),
  load("gdpr-articles.json"),
  load("eu-ai-act-articles.json"),
  load("uk-gdpr-articles.json"),
  load("cn-pipl-articles.json"),
  load("cn-network-data-regulations-articles.json"),
  load("cn-generative-ai-measures-articles.json"),
  load("canada-pipeda-provisions.json"),
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
]);

const unique = (values) => [...new Set(values)];
const inRange = (number, first, last) => number >= first && number <= last;

function gdprConcepts(number) {
  if (number === 1) return ["accountability-governance", "data-subject-rights"];
  if (number === 2) return ["accountability-governance"];
  if (number === 3) return ["cross-border-transfer", "accountability-governance"];
  if (number === 4) return ["accountability-governance", "data-subject-rights"];
  if (number === 5) {
    return [
      "lawfulness-consent-choice",
      "purpose-limitation",
      "data-minimization",
      "training-data-governance",
      "retention-deletion-lifecycle",
      "security-controls",
      "accountability-governance",
      "transparency-explainability",
    ];
  }
  if (number === 6 || number === 7) return ["lawfulness-consent-choice"];
  if (number === 8) return ["lawfulness-consent-choice", "sensitive-data-protection"];
  if (number === 9 || number === 10) return ["sensitive-data-protection", "lawfulness-consent-choice"];
  if (number === 11) return ["data-minimization", "data-subject-rights"];
  if (inRange(number, 12, 14)) return ["transparency-explainability", "data-subject-rights"];
  if (inRange(number, 15, 21)) {
    const concepts = ["data-subject-rights", "transparency-explainability"];
    if (number === 17 || number === 18 || number === 19) concepts.push("retention-deletion-lifecycle");
    return concepts;
  }
  if (number === 22) {
    return [
      "automated-decision-safeguards",
      "human-oversight",
      "fairness-nondiscrimination",
      "transparency-explainability",
    ];
  }
  if (number === 23) return ["data-subject-rights", "accountability-governance"];
  if (number === 24) return ["accountability-governance", "privacy-by-design-default"];
  if (number === 25) return ["privacy-by-design-default", "data-minimization", "security-controls"];
  if (inRange(number, 26, 31)) {
    const concepts = ["accountability-governance", "third-party-supply-chain"];
    if (number === 27) concepts.push("cross-border-transfer");
    return concepts;
  }
  if (number === 32) return ["security-controls", "continuous-assurance"];
  if (number === 33 || number === 34) return ["incident-response", "accountability-governance"];
  if (number === 35 || number === 36) return ["impact-assessment", "ai-risk-management", "privacy-by-design-default"];
  if (inRange(number, 37, 39)) return ["accountability-governance", "continuous-assurance"];
  if (inRange(number, 40, 43)) return ["continuous-assurance", "accountability-governance", "third-party-supply-chain"];
  if (inRange(number, 44, 49)) {
    const concepts = ["cross-border-transfer", "accountability-governance"];
    if (number === 46) concepts.push("security-controls");
    return concepts;
  }
  if (number === 50) return ["cross-border-transfer", "global-coordination"];
  if (inRange(number, 51, 59)) return ["accountability-governance", "continuous-assurance"];
  if (inRange(number, 60, 76)) return ["global-coordination", "accountability-governance", "continuous-assurance"];
  if (inRange(number, 77, 84)) return ["data-subject-rights", "incident-response", "accountability-governance"];
  if (number === 85 || number === 86) return ["data-subject-rights", "purpose-limitation"];
  if (number === 87 || number === 88) return ["sensitive-data-protection", "accountability-governance"];
  if (number === 89) return ["purpose-limitation", "privacy-enhancing-tech", "data-subject-rights"];
  if (number === 90 || number === 91) return ["accountability-governance", "sensitive-data-protection"];
  if (number === 95) return ["purpose-limitation", "accountability-governance"];
  if (number === 96) return ["cross-border-transfer", "global-coordination"];
  if (number === 97) return ["continuous-assurance", "accountability-governance"];
  if (number === 98) return ["global-coordination", "accountability-governance"];
  return ["accountability-governance"];
}

function gdprRelevance(number) {
  return inRange(number, 92, 94) || number === 99
    ? "structural-context"
    : "substantive-topic";
}

function ukGdprConcepts(article) {
  const number = Number.parseInt(article.articleNumber, 10);
  const concepts = gdprConcepts(number);
  const title = article.title.toLowerCase();

  if (/automated|profiling|significant decision/.test(title)) {
    concepts.push(
      "automated-decision-safeguards",
      "human-oversight",
      "transparency-explainability",
      "fairness-nondiscrimination",
    );
  }
  if (/transfer|third countr|international/.test(title)) {
    concepts.push("cross-border-transfer", "global-coordination");
  }
  if (/child|age verification/.test(title)) {
    concepts.push("sensitive-data-protection", "lawfulness-consent-choice");
  }
  if (/special categor|criminal conviction/.test(title)) {
    concepts.push("sensitive-data-protection");
  }
  if (/research|archive|statistic/.test(title)) {
    concepts.push(
      "purpose-limitation",
      "privacy-enhancing-tech",
      "retention-deletion-lifecycle",
    );
  }
  if (/security/.test(title)) concepts.push("security-controls");
  if (/breach|incident/.test(title)) concepts.push("incident-response");
  if (/impact assessment/.test(title)) concepts.push("impact-assessment");
  if (/by design|by default/.test(title)) concepts.push("privacy-by-design-default");

  return unique(concepts);
}

function ukGdprRelevance(article) {
  const normalized = article.articleNumber.replace(/\.$/, "").toUpperCase();
  const baseNumber = Number.parseInt(normalized, 10);
  return normalized === "4A" ||
    normalized === "12A" ||
    normalized === "91A" ||
    inRange(baseNumber, 92, 94) ||
    baseNumber === 99
    ? "structural-context"
    : "substantive-topic";
}

function piplConcepts(number) {
  if (number === 1 || number === 2) {
    return ["data-subject-rights", "accountability-governance"];
  }
  if (number === 3) return ["cross-border-transfer", "accountability-governance"];
  if (number === 4) return ["accountability-governance", "data-subject-rights"];
  if (number === 5) return ["lawfulness-consent-choice", "fairness-nondiscrimination"];
  if (number === 6) return ["purpose-limitation", "data-minimization"];
  if (number === 7) return ["transparency-explainability"];
  if (number === 8) return ["continuous-assurance", "accountability-governance"];
  if (number === 9) return ["security-controls", "accountability-governance"];
  if (inRange(number, 10, 12)) return ["accountability-governance", "global-coordination"];
  if (inRange(number, 13, 16)) return ["lawfulness-consent-choice", "data-subject-rights"];
  if (number === 17 || number === 18) return ["transparency-explainability", "data-subject-rights"];
  if (number === 19) return ["retention-deletion-lifecycle", "data-minimization"];
  if (inRange(number, 20, 23)) return ["third-party-supply-chain", "lawfulness-consent-choice", "accountability-governance"];
  if (number === 24) {
    return [
      "automated-decision-safeguards",
      "human-oversight",
      "fairness-nondiscrimination",
      "transparency-explainability",
    ];
  }
  if (inRange(number, 25, 27)) return ["data-subject-rights", "purpose-limitation"];
  if (inRange(number, 28, 32)) return ["sensitive-data-protection", "lawfulness-consent-choice"];
  if (inRange(number, 33, 37)) {
    const concepts = ["accountability-governance", "security-controls"];
    if (number === 36) concepts.push("cross-border-transfer");
    return concepts;
  }
  if (inRange(number, 38, 43)) return ["cross-border-transfer", "accountability-governance"];
  if (inRange(number, 44, 50)) return ["data-subject-rights", "transparency-explainability"];
  if (number === 51) {
    return [
      "privacy-by-design-default",
      "security-controls",
      "data-minimization",
      "retention-deletion-lifecycle",
      "accountability-governance",
    ];
  }
  if (number === 52) return ["accountability-governance", "continuous-assurance"];
  if (number === 53) return ["cross-border-transfer", "accountability-governance"];
  if (number === 54) return ["continuous-assurance", "accountability-governance"];
  if (number === 55 || number === 56) return ["impact-assessment", "ai-risk-management", "accountability-governance"];
  if (number === 57) return ["incident-response", "security-controls", "data-subject-rights"];
  if (number === 58) return ["third-party-supply-chain", "fairness-nondiscrimination", "transparency-explainability", "accountability-governance"];
  if (number === 59) return ["third-party-supply-chain", "security-controls", "accountability-governance"];
  if (inRange(number, 60, 65)) return ["continuous-assurance", "accountability-governance", "global-coordination"];
  return ["accountability-governance"];
}

function chineseTextConcepts(article, baseConcepts) {
  const text = article.fullText;
  const concepts = [...baseConcepts];
  const addWhen = (pattern, ...ids) => {
    if (pattern.test(text)) concepts.push(...ids);
  };

  addWhen(/跨境|境外提供|数据出境|境内存储/u, "cross-border-transfer");
  addWhen(/同意|合法|正当/u, "lawfulness-consent-choice");
  addWhen(/最小必要|最少够用|非必要|必要范围/u, "data-minimization");
  addWhen(/处理目的|使用目的|目的明确|改变.*目的/u, "purpose-limitation");
  addWhen(/敏感个人信息|未成年人|生物识别|特定身份|医疗健康|金融账户|行踪轨迹/u, "sensitive-data-protection");
  addWhen(/自动化决策/u, "automated-decision-safeguards", "human-oversight", "fairness-nondiscrimination");
  addWhen(/告知|公开.*规则|透明|说明|解释|显著标识/u, "transparency-explainability");
  addWhen(/查阅|复制|更正|补充|删除|转移个人信息|拒绝/u, "data-subject-rights");
  addWhen(/保存期限|存储期限|删除/u, "retention-deletion-lifecycle");
  addWhen(/加密|去标识化|匿名化/u, "privacy-enhancing-tech", "security-controls");
  addWhen(/安全事件|泄露|篡改|丢失|应急预案|应急处置/u, "incident-response", "security-controls");
  addWhen(/影响评估|风险评估|安全评估/u, "impact-assessment", "ai-risk-management");
  addWhen(/委托处理|受托人|第三方|服务提供者/u, "third-party-supply-chain");
  addWhen(/审计|认证|监督检查|合规管理/u, "continuous-assurance", "accountability-governance");
  addWhen(/训练数据|训练语料/u, "training-data-governance");
  addWhen(/生成式人工智能|算法|模型/u, "ai-risk-management");
  addWhen(/歧视/u, "fairness-nondiscrimination");
  addWhen(/国际合作|国际规则|其他国家和地区/u, "global-coordination");

  return unique(concepts);
}

function networkDataConcepts(article) {
  const number = Number(article.articleNumber);
  let base;
  if (inRange(number, 8, 20)) base = ["security-controls", "accountability-governance"];
  else if (inRange(number, 21, 28)) base = ["data-subject-rights", "accountability-governance"];
  else if (inRange(number, 29, 33)) base = ["ai-risk-management", "security-controls", "impact-assessment"];
  else if (inRange(number, 34, 39)) base = ["cross-border-transfer", "accountability-governance"];
  else if (inRange(number, 40, 46)) base = ["third-party-supply-chain", "accountability-governance", "continuous-assurance"];
  else if (inRange(number, 47, 61)) base = ["continuous-assurance", "accountability-governance"];
  else base = ["accountability-governance"];
  return chineseTextConcepts(article, base);
}

function generativeAiConcepts(article) {
  const number = Number(article.articleNumber);
  let base;
  if (inRange(number, 1, 4)) base = ["ai-risk-management", "accountability-governance"];
  else if (inRange(number, 5, 8)) base = ["training-data-governance", "ai-risk-management", "fairness-nondiscrimination"];
  else if (inRange(number, 9, 15)) base = ["transparency-explainability", "human-oversight", "accountability-governance"];
  else if (inRange(number, 16, 21)) base = ["continuous-assurance", "security-controls", "accountability-governance"];
  else base = ["ai-risk-management", "accountability-governance"];
  return chineseTextConcepts(article, base);
}

function pipedaConcepts(provision) {
  if (provision.id === "ca-pipeda-sch-1") {
    return [
      "accountability-governance",
      "purpose-limitation",
      "lawfulness-consent-choice",
      "data-minimization",
      "retention-deletion-lifecycle",
      "data-subject-rights",
      "security-controls",
      "transparency-explainability",
      "continuous-assurance",
    ];
  }

  const number = Number.parseFloat(provision.articleNumber);
  const title = provision.title.toLowerCase();
  const text = `${title} ${provision.translations?.en?.fullText ?? ""}`.toLowerCase();
  const concepts = [];

  if (number === 2) concepts.push("security-controls", "sensitive-data-protection");
  if (number === 3) concepts.push("data-subject-rights", "accountability-governance");
  if (number >= 4 && number < 5) concepts.push("accountability-governance", "purpose-limitation");
  if (number >= 5 && number < 7) concepts.push("accountability-governance", "lawfulness-consent-choice");
  if (number >= 7 && number < 8) concepts.push("lawfulness-consent-choice", "purpose-limitation");
  if (number >= 8 && number <= 10) concepts.push("data-subject-rights", "transparency-explainability");
  if (number >= 10.1 && number <= 10.3) {
    concepts.push("incident-response", "security-controls", "continuous-assurance");
  }
  if (number >= 11 && number <= 17.2) {
    concepts.push("data-subject-rights", "accountability-governance", "continuous-assurance");
  }
  if (number >= 18 && number <= 19) concepts.push("continuous-assurance", "accountability-governance");
  if (number >= 20 && number <= 22) concepts.push("accountability-governance", "security-controls");
  if (number >= 23 && number < 24) concepts.push("global-coordination", "cross-border-transfer", "accountability-governance");
  if (number === 24) concepts.push("transparency-explainability", "accountability-governance");
  if (number >= 25 && number <= 30) concepts.push("continuous-assurance", "accountability-governance");
  if (number >= 31) concepts.push("accountability-governance");

  if (/consent|knowledge/.test(text)) concepts.push("lawfulness-consent-choice");
  if (/access|correct|complaint|remed/.test(text)) concepts.push("data-subject-rights");
  if (/breach|security safeguard|significant harm/.test(text)) {
    concepts.push("incident-response", "security-controls");
  }
  if (/retain|retention|destroy/.test(text)) concepts.push("retention-deletion-lifecycle");
  if (/third part|organization/.test(text)) concepts.push("third-party-supply-chain");
  if (/foreign state|province/.test(text)) concepts.push("global-coordination");

  return unique(concepts.length ? concepts : ["accountability-governance"]);
}

function pipedaRelevance(provision) {
  if (/^ca-pipeda-sch-[2-4]$/.test(provision.id)) return "structural-context";
  if (provision.id === "ca-pipeda-sch-1") return "substantive-topic";
  const number = Number.parseFloat(provision.articleNumber);
  return number === 1 || number === 25 || number === 26 || number === 29 || number >= 31
    ? "structural-context"
    : "substantive-topic";
}

function lgpdConcepts(article) {
  const locator = article.articleNumber.toUpperCase();
  const number = Number.parseInt(locator, 10);
  if (number === 1) return ["accountability-governance", "data-subject-rights"];
  if (number === 2) return ["data-subject-rights", "fairness-nondiscrimination", "accountability-governance"];
  if (number === 3 || number === 4) return ["accountability-governance", "cross-border-transfer"];
  if (number === 5) return ["accountability-governance", "sensitive-data-protection", "security-controls"];
  if (number === 6) return [
    "lawfulness-consent-choice",
    "purpose-limitation",
    "data-minimization",
    "transparency-explainability",
    "security-controls",
    "fairness-nondiscrimination",
    "accountability-governance",
  ];
  if (inRange(number, 7, 10)) return ["lawfulness-consent-choice", "purpose-limitation", "transparency-explainability"];
  if (number === 11) return ["sensitive-data-protection", "lawfulness-consent-choice"];
  if (number === 12) return ["privacy-enhancing-tech", "data-minimization"];
  if (number === 13) return ["sensitive-data-protection", "purpose-limitation", "privacy-enhancing-tech"];
  if (number === 14) return ["sensitive-data-protection", "lawfulness-consent-choice", "fairness-nondiscrimination"];
  if (number === 15 || number === 16) return ["retention-deletion-lifecycle", "purpose-limitation"];
  if (inRange(number, 17, 19)) return ["data-subject-rights", "transparency-explainability", "retention-deletion-lifecycle"];
  if (number === 20) return ["automated-decision-safeguards", "human-oversight", "transparency-explainability", "fairness-nondiscrimination"];
  if (number === 21 || number === 22) return ["data-subject-rights", "fairness-nondiscrimination", "accountability-governance"];
  if (inRange(number, 23, 24)) return ["purpose-limitation", "transparency-explainability", "accountability-governance"];
  if (number === 25) return ["privacy-enhancing-tech", "data-subject-rights", "accountability-governance"];
  if (number === 26 || number === 27) return ["third-party-supply-chain", "purpose-limitation", "accountability-governance"];
  if (inRange(number, 29, 31)) return ["continuous-assurance", "accountability-governance"];
  if (number === 32) return ["impact-assessment", "transparency-explainability", "accountability-governance"];
  if (inRange(number, 33, 36)) return ["cross-border-transfer", "security-controls", "accountability-governance"];
  if (number === 37) return ["accountability-governance", "continuous-assurance"];
  if (number === 38) return ["impact-assessment", "ai-risk-management", "accountability-governance"];
  if (number === 39) return ["third-party-supply-chain", "accountability-governance"];
  if (number === 40) return ["data-subject-rights", "global-coordination", "accountability-governance"];
  if (number === 41) return ["accountability-governance", "transparency-explainability"];
  if (inRange(number, 42, 45)) return ["data-subject-rights", "incident-response", "accountability-governance"];
  if (number === 46 || number === 47) return ["security-controls", "privacy-by-design-default", "continuous-assurance"];
  if (number === 48) return ["incident-response", "security-controls", "transparency-explainability"];
  if (number === 49) return ["privacy-by-design-default", "security-controls", "data-minimization"];
  if (number === 50) return ["accountability-governance", "continuous-assurance", "privacy-by-design-default"];
  if (number === 51) return ["continuous-assurance", "security-controls", "global-coordination"];
  if (inRange(number, 52, 54)) return ["continuous-assurance", "accountability-governance"];
  if (locator === "55-A") return ["accountability-governance", "continuous-assurance"];
  if (locator === "55-J") return ["accountability-governance", "continuous-assurance", "data-subject-rights", "global-coordination"];
  if (locator === "55-K") return ["continuous-assurance", "accountability-governance"];
  if (locator === "58-B") return ["accountability-governance", "global-coordination"];
  if (number === 61) return ["cross-border-transfer", "accountability-governance"];
  if (number === 62) return ["sensitive-data-protection", "data-subject-rights", "accountability-governance"];
  if (number === 63) return ["retention-deletion-lifecycle", "accountability-governance"];
  if (number === 64) return ["data-subject-rights", "purpose-limitation", "accountability-governance"];
  return ["accountability-governance"];
}

function lgpdRelevance(article) {
  const locator = article.articleNumber.toUpperCase();
  const structural = new Set([
    "28", "55", "55-B", "55-C", "55-D", "55-E", "55-F", "55-G",
    "55-H", "55-I", "55-L", "55-M", "56", "57", "58", "58-A", "59",
    "60", "65",
  ]);
  return structural.has(locator) ? "structural-context" : "substantive-topic";
}

function taiwanAiActConcepts(article) {
  const mappings = {
    1: ["ai-risk-management", "fairness-nondiscrimination", "human-oversight", "accountability-governance"],
    2: ["accountability-governance"],
    3: ["ai-risk-management", "accountability-governance"],
    4: ["human-oversight", "privacy-by-design-default", "security-controls", "transparency-explainability", "fairness-nondiscrimination", "accountability-governance"],
    5: ["ai-risk-management", "human-oversight", "fairness-nondiscrimination", "security-controls", "data-subject-rights"],
    6: ["accountability-governance", "global-coordination"],
    7: ["transparency-explainability", "human-oversight", "accountability-governance"],
    8: ["accountability-governance", "global-coordination"],
    9: ["accountability-governance"],
    10: ["ai-risk-management", "continuous-assurance", "accountability-governance"],
    11: ["training-data-governance", "impact-assessment", "continuous-assurance", "privacy-enhancing-tech"],
    12: ["global-coordination", "accountability-governance"],
    13: ["training-data-governance", "purpose-limitation", "third-party-supply-chain", "accountability-governance"],
    14: ["privacy-by-design-default", "data-minimization", "security-controls", "accountability-governance"],
    15: ["fairness-nondiscrimination", "human-oversight"],
    16: ["ai-risk-management", "impact-assessment", "continuous-assurance", "global-coordination"],
    17: ["ai-risk-management", "data-subject-rights", "accountability-governance"],
    18: ["continuous-assurance", "accountability-governance"],
    19: ["ai-risk-management", "impact-assessment", "security-controls", "human-oversight"],
    20: ["accountability-governance"],
  };
  return mappings[Number(article.articleNumber)];
}

function taiwanPdpaConcepts(article) {
  const locator = article.articleNumber;
  const number = Number.parseInt(locator, 10);
  const concepts = [];
  if (number === 1) concepts.push("purpose-limitation", "data-subject-rights", "accountability-governance");
  if (number === 2) concepts.push("sensitive-data-protection", "security-controls", "accountability-governance");
  if (number === 3) concepts.push("data-subject-rights");
  if (number === 4) concepts.push("third-party-supply-chain", "accountability-governance");
  if (number === 5) concepts.push("fairness-nondiscrimination", "purpose-limitation", "data-minimization");
  if (number === 6) concepts.push("sensitive-data-protection", "lawfulness-consent-choice");
  if (number === 7) concepts.push("lawfulness-consent-choice", "transparency-explainability");
  if (number === 8 || number === 9) concepts.push("transparency-explainability", "lawfulness-consent-choice", "data-subject-rights");
  if (number === 10) concepts.push("data-subject-rights", "transparency-explainability");
  if (number === 11) concepts.push("data-subject-rights", "retention-deletion-lifecycle", "accountability-governance");
  if (number === 12) concepts.push("incident-response", "security-controls", "transparency-explainability");
  if (number === 13 || number === 14) concepts.push("data-subject-rights", "accountability-governance");
  if (number === 15 || number === 16) concepts.push("lawfulness-consent-choice", "purpose-limitation", "data-minimization");
  if (number === 17) concepts.push("transparency-explainability", "accountability-governance");
  if (number === 18) concepts.push("security-controls", "accountability-governance");
  if (number === 19 || locator === "20") concepts.push("lawfulness-consent-choice", "purpose-limitation", "data-subject-rights");
  if (locator === "20-1") concepts.push("security-controls", "retention-deletion-lifecycle", "accountability-governance");
  if (locator === "21") concepts.push("cross-border-transfer", "accountability-governance");
  if (/^21-[1-5]$/.test(locator)) concepts.push("continuous-assurance", "accountability-governance");
  if (number === 22) concepts.push("continuous-assurance", "security-controls", "accountability-governance");
  if (number === 23 || number === 24) concepts.push("continuous-assurance", "accountability-governance");
  if (number === 25) concepts.push("retention-deletion-lifecycle", "continuous-assurance", "accountability-governance");
  if (number === 26) concepts.push("transparency-explainability", "continuous-assurance");
  if (number === 27) concepts.push("security-controls", "retention-deletion-lifecycle", "accountability-governance");
  if (inRange(number, 28, 31)) concepts.push("data-subject-rights", "incident-response", "accountability-governance");
  if (inRange(number, 32, 40)) concepts.push("data-subject-rights", "accountability-governance");
  if (inRange(number, 41, 50)) concepts.push("continuous-assurance", "accountability-governance");
  if (number === 41 || number === 47) concepts.push("cross-border-transfer");
  if (number === 51) concepts.push("accountability-governance", "purpose-limitation");
  if (locator === "51-1") concepts.push("continuous-assurance", "accountability-governance");
  if (number === 52) concepts.push("third-party-supply-chain", "accountability-governance");
  if (number === 53) concepts.push("purpose-limitation", "accountability-governance");
  if (number === 54) concepts.push("transparency-explainability", "data-subject-rights");
  if (number >= 55) concepts.push("accountability-governance");
  return unique(concepts.length ? concepts : ["accountability-governance"]);
}

function taiwanPdpaRelevance(article) {
  const structural = new Set([
    "23", "24", "32", "33", "34", "35", "36", "37", "38", "39", "40",
    "43", "44", "45", "46", "53-1", "55", "56",
  ]);
  return structural.has(article.articleNumber)
    ? "structural-context"
    : "substantive-topic";
}

function singaporePdpaConcepts(provision) {
  if (provision.provisionType === "schedule") {
    const number = Number(provision.articleNumber.replace("schedule-", ""));
    const mappings = {
      1: ["lawfulness-consent-choice", "purpose-limitation", "sensitive-data-protection"],
      2: ["lawfulness-consent-choice", "purpose-limitation", "accountability-governance"],
      3: [],
      4: [],
      5: ["data-subject-rights", "sensitive-data-protection"],
      6: ["data-subject-rights", "accountability-governance"],
      7: ["data-subject-rights", "continuous-assurance"],
      8: ["lawfulness-consent-choice", "purpose-limitation"],
      9: ["continuous-assurance", "security-controls", "accountability-governance"],
      10: ["purpose-limitation", "lawfulness-consent-choice"],
      11: ["privacy-enhancing-tech", "security-controls", "continuous-assurance"],
    };
    return mappings[number] ?? ["accountability-governance"];
  }

  const locator = provision.articleNumber.toUpperCase();
  const number = Number.parseInt(locator, 10);
  if (number === 1) return [];
  if (number === 2) return ["accountability-governance", "sensitive-data-protection", "incident-response", "privacy-enhancing-tech"];
  if (number === 3) return ["purpose-limitation", "data-subject-rights", "accountability-governance"];
  if (number === 4) return ["accountability-governance", "third-party-supply-chain"];
  if (inRange(number, 5, 10)) return ["accountability-governance"];
  if (number === 11) return ["accountability-governance"];
  if (number === 12) return ["accountability-governance", "privacy-by-design-default", "transparency-explainability"];
  if (inRange(number, 13, 17)) return ["lawfulness-consent-choice", "transparency-explainability"];
  if (number === 18) return ["purpose-limitation", "data-minimization"];
  if (number === 19) return ["purpose-limitation", "retention-deletion-lifecycle"];
  if (number === 20) return ["transparency-explainability", "lawfulness-consent-choice"];
  if (number === 21 || number === 22) return ["data-subject-rights", "transparency-explainability"];
  if (locator === "22A") return ["data-subject-rights", "retention-deletion-lifecycle"];
  if (number === 23) return ["accountability-governance", "data-subject-rights"];
  if (number === 24) return ["security-controls", "accountability-governance", "privacy-by-design-default"];
  if (number === 25) return ["retention-deletion-lifecycle", "data-minimization"];
  if (locator === "26") return ["cross-border-transfer", "accountability-governance"];
  if (/^26[A-E]$/.test(locator)) return ["incident-response", "security-controls", "accountability-governance", "transparency-explainability"];
  if (inRange(number, 27, 35)) return [];
  if (number === 36 || number === 37) return ["lawfulness-consent-choice", "purpose-limitation", "transparency-explainability"];
  if (inRange(number, 38, 42)) return ["accountability-governance"];
  if (number >= 43 && number <= 47) return ["lawfulness-consent-choice", "purpose-limitation", "transparency-explainability"];
  if (number === 48 && locator === "48") return ["accountability-governance"];
  if (locator === "48A" || locator === "48B") return ["security-controls", "incident-response"];
  if (/^48[C-F]$/.test(locator)) return ["security-controls", "privacy-enhancing-tech", "accountability-governance", "data-subject-rights"];
  if (/^48[G-O]$/.test(locator)) return ["continuous-assurance", "data-subject-rights", "accountability-governance"];
  if (/^48[P-R]$/.test(locator)) return ["data-subject-rights", "continuous-assurance"];
  if (number === 49 || number === 50) return ["continuous-assurance", "accountability-governance"];
  if (number >= 51 && number <= 53) return ["accountability-governance", "continuous-assurance"];
  return ["accountability-governance"];
}

function singaporePdpaRelevance(provision) {
  if (provision.provisionType === "schedule") {
    return [3, 4, 7].includes(
      Number(provision.articleNumber.replace("schedule-", "")),
    )
      ? "structural-context"
      : "substantive-topic";
  }
  const locator = provision.articleNumber.toUpperCase();
  const number = Number.parseInt(locator, 10);
  if (
    number === 1 ||
    inRange(number, 5, 10) ||
    inRange(number, 27, 35) ||
    inRange(number, 38, 42) ||
    /^48[P-R]$/.test(locator) ||
    (number >= 54 && number <= 68)
  ) {
    return "structural-context";
  }
  return "substantive-topic";
}

function addEnglishTextConcepts(provision, baseConcepts = []) {
  const text = [
    provision.title,
    provision.fullText,
    provision.translations?.en?.title,
    provision.translations?.en?.fullText,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const concepts = [...baseConcepts];
  const addWhen = (pattern, ...ids) => {
    if (pattern.test(text)) concepts.push(...ids);
  };

  addWhen(/consent|lawful basis|lawfulness|justification/, "lawfulness-consent-choice");
  addWhen(/specific purpose|purpose of collection|purpose limitation|compatible purpose/, "purpose-limitation");
  addWhen(/minimality|minimum necessary|data minimisation|data minimization/, "data-minimization");
  addWhen(/access to personal|correction|portability|right to object|rights? of (?:a )?data subject|withdrawal of consent/, "data-subject-rights");
  addWhen(/special personal|sensitive personal|biometric|health|child|children|criminal behaviour|religious|race or ethnic|political persuasion|trade union/, "sensitive-data-protection");
  addWhen(/retention|restriction of records|erase|erasure|delete|destruction/, "retention-deletion-lifecycle");
  addWhen(/de-identif|anonym|pseudonym|encryption/, "privacy-enhancing-tech");
  addWhen(/security|integrity and confidentiality|account number/, "security-controls");
  addWhen(/breach|security compromise|incident/, "incident-response");
  addWhen(/impact assessment|prior authorisation|prior authorization|assessment/, "impact-assessment", "ai-risk-management");
  addWhen(/automated decision|profiling/, "automated-decision-safeguards", "human-oversight", "transparency-explainability");
  addWhen(/information to the data subject|notification to data subject|transparen|explain/, "transparency-explainability");
  addWhen(/operator|processor|third part|joint and vicarious/, "third-party-supply-chain");
  addWhen(/outside (?:the )?republic|outside nigeria|cross-border|transborder|transfer of personal/, "cross-border-transfer");
  addWhen(/code of conduct|compliance service|audit|registration|enforcement notice|compliance order/, "continuous-assurance", "accountability-governance");
  addWhen(/information officer|data protection officer|responsible party|data controller|data processor|accountab|governance/, "accountability-governance");
  addWhen(/discriminat|fairness|unfair/, "fairness-nondiscrimination");

  return unique(concepts);
}

function popiaConcepts(provision) {
  if (provision.articleNumber === "Schedule") return [];
  const number = Number(provision.articleNumber);
  let base = [];
  if (number <= 3) base = ["accountability-governance", "data-subject-rights"];
  else if (inRange(number, 4, 18)) base = ["lawfulness-consent-choice", "purpose-limitation", "data-subject-rights", "accountability-governance"];
  else if (inRange(number, 19, 22)) base = ["security-controls", "incident-response", "third-party-supply-chain", "accountability-governance"];
  else if (inRange(number, 23, 25)) base = ["data-subject-rights", "transparency-explainability"];
  else if (inRange(number, 26, 35)) base = ["sensitive-data-protection", "lawfulness-consent-choice"];
  else if (inRange(number, 36, 38)) base = ["accountability-governance", "purpose-limitation"];
  else if (number === 40 || number === 44) base = ["accountability-governance", "continuous-assurance"];
  else if (number === 54) base = ["security-controls", "accountability-governance"];
  else if (inRange(number, 55, 59)) base = ["accountability-governance", "impact-assessment", "continuous-assurance"];
  else if (inRange(number, 60, 68)) base = ["continuous-assurance", "accountability-governance"];
  else if (number === 69 || number === 70) base = ["lawfulness-consent-choice", "transparency-explainability", "data-subject-rights"];
  else if (number === 71) base = ["automated-decision-safeguards", "human-oversight", "transparency-explainability"];
  else if (number === 72) base = ["cross-border-transfer", "accountability-governance"];
  else if (inRange(number, 73, 80) || number === 99) base = ["data-subject-rights", "accountability-governance"];
  else if (number === 89 || number === 95 || number === 103 || number === 109) base = ["continuous-assurance", "accountability-governance"];
  else if ([101, 105, 106].includes(number)) base = ["security-controls", "accountability-governance"];
  return addEnglishTextConcepts(provision, base);
}

function popiaRelevance(provision) {
  if (provision.articleNumber === "Schedule") return "structural-context";
  const number = Number(provision.articleNumber);
  const structural =
    number === 39 ||
    inRange(number, 41, 53) ||
    inRange(number, 56, 56) ||
    inRange(number, 81, 88) ||
    inRange(number, 90, 94) ||
    inRange(number, 96, 98) ||
    [100, 102, 104, 107, 108].includes(number) ||
    inRange(number, 110, 115);
  return structural ? "structural-context" : "substantive-topic";
}

function nigeriaNdpaConcepts(provision) {
  if (provision.articleNumber === "Schedule") return [];
  const number = Number(provision.articleNumber);
  let base = [];
  if (inRange(number, 1, 3)) base = ["accountability-governance", "data-subject-rights"];
  else if (inRange(number, 24, 27)) base = ["lawfulness-consent-choice", "purpose-limitation", "data-minimization", "transparency-explainability"];
  else if (number === 28) base = ["impact-assessment", "ai-risk-management", "privacy-by-design-default"];
  else if (number === 29) base = ["accountability-governance", "privacy-by-design-default", "third-party-supply-chain"];
  else if (inRange(number, 30, 31)) base = ["sensitive-data-protection", "lawfulness-consent-choice"];
  else if (inRange(number, 32, 33)) base = ["accountability-governance", "continuous-assurance"];
  else if (inRange(number, 34, 38)) base = ["data-subject-rights", "transparency-explainability"];
  else if (number === 39) base = ["security-controls", "accountability-governance", "third-party-supply-chain"];
  else if (number === 40) base = ["incident-response", "security-controls", "transparency-explainability"];
  else if (inRange(number, 41, 43)) base = ["cross-border-transfer", "accountability-governance"];
  else if (number === 44) base = ["continuous-assurance", "accountability-governance"];
  else if (inRange(number, 46, 48)) base = ["data-subject-rights", "continuous-assurance", "accountability-governance"];
  else if (inRange(number, 49, 53)) base = ["accountability-governance", "data-subject-rights"];
  else if (number === 62) base = ["continuous-assurance", "accountability-governance"];
  return addEnglishTextConcepts(provision, base);
}

function nigeriaNdpaRelevance(provision) {
  if (provision.articleNumber === "Schedule") return "structural-context";
  const number = Number(provision.articleNumber);
  return inRange(number, 1, 3) ||
    inRange(number, 24, 44) ||
    inRange(number, 46, 53) ||
    number === 62
    ? "substantive-topic"
    : "structural-context";
}

function indonesiaPdpConcepts(provision) {
  const number = Number(provision.articleNumber);
  const text = provision.fullText.toLowerCase();
  let base = [];
  if (inRange(number, 1, 3)) base = ["accountability-governance", "data-subject-rights"];
  else if (number === 4) base = ["sensitive-data-protection"];
  else if (inRange(number, 5, 15)) base = ["data-subject-rights", "transparency-explainability"];
  else if (inRange(number, 16, 18)) base = ["lawfulness-consent-choice", "purpose-limitation", "accountability-governance"];
  else if (inRange(number, 19, 22)) base = ["lawfulness-consent-choice", "transparency-explainability"];
  else if (inRange(number, 23, 27)) base = ["purpose-limitation", "data-minimization", "accountability-governance"];
  else if (inRange(number, 28, 33)) base = ["data-subject-rights", "retention-deletion-lifecycle", "accountability-governance"];
  else if (inRange(number, 34, 39)) base = ["accountability-governance", "third-party-supply-chain"];
  else if (inRange(number, 40, 47)) base = ["security-controls", "incident-response", "accountability-governance"];
  else if (inRange(number, 48, 54)) base = ["impact-assessment", "accountability-governance", "continuous-assurance"];
  else if (inRange(number, 55, 56)) base = ["cross-border-transfer", "accountability-governance"];
  else if (number === 57) base = ["continuous-assurance", "accountability-governance"];
  else if (number === 63 || number === 64) base = ["data-subject-rights", "accountability-governance"];
  else if (inRange(number, 65, 73)) base = ["security-controls", "accountability-governance"];

  const concepts = [...base];
  const addWhen = (pattern, ...ids) => {
    if (pattern.test(text)) concepts.push(...ids);
  };
  addWhen(/persetujuan|dasar pemrosesan|sah secara hukum/u, "lawfulness-consent-choice");
  addWhen(/tujuan pemrosesan|tujuan.*pengumpulan|secara spesifik/u, "purpose-limitation");
  addWhen(/terbatas dan spesifik|sesuai dengan tujuan|relevan/u, "data-minimization");
  addWhen(/hak subjek data pribadi|mengakses|memperbaiki|menarik kembali|keberatan|portabilitas/u, "data-subject-rights");
  addWhen(/data pribadi yang bersifat spesifik|anak|penyandang disabilitas|biometrik|genetika|kesehatan|keuangan/u, "sensitive-data-protection");
  addWhen(/menghapus|memusnahkan|jangka waktu penyimpanan|retensi/u, "retention-deletion-lifecycle");
  addWhen(/terenkripsi|pseudonimisasi|anonimisasi/u, "privacy-enhancing-tech", "security-controls");
  addWhen(/keamanan data pribadi|melindungi data pribadi|sistem elektronik/u, "security-controls");
  addWhen(/kegagalan pelindungan data pribadi|pemberitahuan.*kegagalan/u, "incident-response", "transparency-explainability");
  addWhen(/penilaian dampak pelindungan data pribadi/u, "impact-assessment", "ai-risk-management", "privacy-by-design-default");
  addWhen(/otomatis|pemrosesan.*otomatis/u, "automated-decision-safeguards", "human-oversight", "transparency-explainability");
  addWhen(/prosesor data pribadi|pihak lain|penggabungan|pengambilalihan/u, "third-party-supply-chain");
  addWhen(/transfer data pribadi.*luar wilayah|di luar wilayah hukum|antarnegara/u, "cross-border-transfer");
  addWhen(/petugas.*pelindungan data pribadi|rekam jejak audit|pengawasan|kepatuhan/u, "continuous-assurance", "accountability-governance");
  addWhen(/diskriminatif|diskriminasi/u, "fairness-nondiscrimination");
  return unique(concepts);
}

function indonesiaPdpRelevance(provision) {
  const number = Number(provision.articleNumber);
  return inRange(number, 1, 57) || inRange(number, 63, 73)
    ? "substantive-topic"
    : "structural-context";
}

function importedUnitNumber(provision) {
  return Number(
    provision.articleNumber ??
      provision.sectionNumber ??
      provision.ruleNumber ??
      Number.NaN,
  );
}

function indiaDpdpActConcepts(provision) {
  if (provision.unitType === "schedule") {
    return ["accountability-governance", "continuous-assurance"];
  }
  const number = importedUnitNumber(provision);
  let base = [];
  if (number === 2 || number === 3) base = ["accountability-governance", "data-subject-rights"];
  else if (number === 4) base = ["lawfulness-consent-choice", "purpose-limitation"];
  else if (number === 5) base = ["transparency-explainability", "data-subject-rights"];
  else if (number === 6 || number === 7) base = ["lawfulness-consent-choice", "data-subject-rights"];
  else if (number === 8) base = ["accountability-governance", "security-controls", "incident-response", "retention-deletion-lifecycle"];
  else if (number === 9) base = ["sensitive-data-protection", "lawfulness-consent-choice"];
  else if (number === 10) base = ["accountability-governance", "impact-assessment", "continuous-assurance"];
  else if (inRange(number, 11, 15)) base = ["data-subject-rights", "transparency-explainability"];
  else if (number === 16) base = ["cross-border-transfer", "accountability-governance"];
  else if (number === 17) base = ["purpose-limitation", "accountability-governance"];
  else if (number === 27) base = ["continuous-assurance", "accountability-governance", "incident-response"];
  else if (inRange(number, 28, 33)) base = ["data-subject-rights", "continuous-assurance", "accountability-governance"];
  else if (number === 36 || number === 37) base = ["continuous-assurance", "accountability-governance"];
  return addEnglishTextConcepts(provision, base);
}

function indiaDpdpActRelevance(provision) {
  if (provision.unitType === "schedule") return "structural-context";
  const number = importedUnitNumber(provision);
  return inRange(number, 2, 17) ||
    inRange(number, 27, 33) ||
    number === 36 ||
    number === 37
    ? "substantive-topic"
    : "structural-context";
}

function indiaDpdpRulesConcepts(provision) {
  if (provision.unitType === "schedule") {
    const label = provision.label.toLowerCase();
    if (/first/.test(label)) return ["lawfulness-consent-choice", "accountability-governance", "continuous-assurance"];
    if (/second/.test(label)) return ["purpose-limitation", "security-controls", "accountability-governance"];
    if (/third/.test(label)) return ["retention-deletion-lifecycle", "data-minimization"];
    if (/fourth/.test(label)) return ["sensitive-data-protection", "lawfulness-consent-choice"];
    if (/seventh/.test(label)) return ["continuous-assurance", "accountability-governance"];
    return [];
  }
  const number = importedUnitNumber(provision);
  let base = [];
  if (number === 3) base = ["transparency-explainability", "data-subject-rights"];
  else if (number === 4) base = ["lawfulness-consent-choice", "accountability-governance", "continuous-assurance"];
  else if (number === 5) base = ["purpose-limitation", "accountability-governance"];
  else if (number === 6) base = ["security-controls", "accountability-governance"];
  else if (number === 7) base = ["incident-response", "security-controls", "transparency-explainability"];
  else if (number === 8) base = ["retention-deletion-lifecycle", "data-minimization"];
  else if (number === 9) base = ["transparency-explainability", "accountability-governance"];
  else if (inRange(number, 10, 12)) base = ["sensitive-data-protection", "lawfulness-consent-choice"];
  else if (number === 13) base = ["impact-assessment", "ai-risk-management", "continuous-assurance", "accountability-governance"];
  else if (number === 14) base = ["data-subject-rights", "transparency-explainability"];
  else if (number === 15) base = ["cross-border-transfer", "accountability-governance"];
  else if (number === 16) base = ["purpose-limitation", "privacy-enhancing-tech"];
  else if (number === 22) base = ["data-subject-rights", "accountability-governance"];
  else if (number === 23) base = ["continuous-assurance", "accountability-governance"];
  return addEnglishTextConcepts(provision, base);
}

function indiaDpdpRulesRelevance(provision) {
  if (provision.unitType === "schedule") {
    return /First|Second|Third|Fourth|Seventh/.test(provision.label)
      ? "substantive-topic"
      : "structural-context";
  }
  const number = importedUnitNumber(provision);
  return inRange(number, 3, 16) || number === 22 || number === 23
    ? "substantive-topic"
    : "structural-context";
}

function uaePdplConcepts(provision) {
  const number = importedUnitNumber(provision);
  let base = [];
  if (inRange(number, 1, 3)) base = ["accountability-governance", "data-subject-rights"];
  else if (inRange(number, 4, 6)) base = ["lawfulness-consent-choice", "purpose-limitation"];
  else if (number === 7 || number === 8) base = ["accountability-governance", "third-party-supply-chain"];
  else if (number === 9) base = ["incident-response", "security-controls"];
  else if (inRange(number, 10, 12)) base = ["accountability-governance", "continuous-assurance"];
  else if (inRange(number, 13, 19)) base = ["data-subject-rights", "transparency-explainability"];
  else if (number === 20) base = ["security-controls", "accountability-governance"];
  else if (number === 21) base = ["impact-assessment", "ai-risk-management", "privacy-by-design-default"];
  else if (number === 22 || number === 23) base = ["cross-border-transfer", "accountability-governance"];
  else if (inRange(number, 24, 27)) base = ["data-subject-rights", "continuous-assurance", "accountability-governance"];
  return addEnglishTextConcepts(provision, base);
}

function uaePdplRelevance(provision) {
  return importedUnitNumber(provision) <= 27
    ? "substantive-topic"
    : "structural-context";
}

function saudiPdplConcepts(provision) {
  const number = importedUnitNumber(provision);
  let base = [];
  if (inRange(number, 1, 3)) base = ["accountability-governance", "data-subject-rights"];
  else if (inRange(number, 4, 9)) base = ["data-subject-rights", "lawfulness-consent-choice", "transparency-explainability"];
  else if (inRange(number, 10, 18)) base = ["purpose-limitation", "data-minimization", "retention-deletion-lifecycle", "accountability-governance"];
  else if (number === 19) base = ["security-controls", "accountability-governance"];
  else if (number === 20) base = ["incident-response", "security-controls", "transparency-explainability"];
  else if (number === 21) base = ["data-subject-rights", "accountability-governance"];
  else if (number === 22) base = ["impact-assessment", "ai-risk-management", "privacy-by-design-default"];
  else if (number === 23 || number === 24) base = ["sensitive-data-protection", "security-controls"];
  else if (inRange(number, 25, 28)) base = ["lawfulness-consent-choice", "purpose-limitation", "privacy-enhancing-tech"];
  else if (number === 29) base = ["cross-border-transfer", "accountability-governance"];
  else if (inRange(number, 30, 41)) base = ["continuous-assurance", "accountability-governance", "data-subject-rights"];
  return addEnglishTextConcepts(provision, base);
}

function saudiPdplRelevance(provision) {
  const number = importedUnitNumber(provision);
  return number <= 41 && number !== 32
    ? "substantive-topic"
    : "structural-context";
}

function saudiImplementingConcepts(provision) {
  const number = importedUnitNumber(provision);
  let base = [];
  if (inRange(number, 1, 2)) base = ["accountability-governance"];
  else if (inRange(number, 3, 10)) base = ["data-subject-rights", "transparency-explainability"];
  else if (inRange(number, 11, 16)) base = ["lawfulness-consent-choice", "purpose-limitation"];
  else if (number === 17) base = ["third-party-supply-chain", "accountability-governance"];
  else if (number === 18 || number === 19) base = ["purpose-limitation", "data-minimization"];
  else if (inRange(number, 20, 22)) base = ["data-subject-rights", "accountability-governance"];
  else if (number === 23) base = ["security-controls", "accountability-governance"];
  else if (number === 24) base = ["incident-response", "security-controls", "transparency-explainability"];
  else if (number === 25) base = ["impact-assessment", "ai-risk-management", "privacy-by-design-default"];
  else if (number === 26 || number === 27) base = ["sensitive-data-protection", "security-controls"];
  else if (inRange(number, 28, 31)) base = ["lawfulness-consent-choice", "purpose-limitation"];
  else if (inRange(number, 32, 36)) base = ["accountability-governance", "continuous-assurance"];
  else if (number === 37) base = ["data-subject-rights", "continuous-assurance"];
  return addEnglishTextConcepts(provision, base);
}

function saudiTransferConcepts(provision) {
  const number = importedUnitNumber(provision);
  if (number === 9) return [];
  const base = ["cross-border-transfer", "accountability-governance"];
  if (number === 5) base.push("third-party-supply-chain");
  if (number === 7) base.push("impact-assessment", "ai-risk-management");
  if (number === 3 || number === 8) base.push("continuous-assurance");
  return addEnglishTextConcepts(provision, base);
}

function australiaPrivacyConcepts(provision) {
  const number = Number(provision.provisionNumber);
  if (provision.provisionType === "australian-privacy-principle") {
    const mappings = {
      1: ["accountability-governance", "transparency-explainability", "privacy-by-design-default"],
      2: ["privacy-enhancing-tech", "data-minimization"],
      3: ["lawfulness-consent-choice", "purpose-limitation", "data-minimization", "sensitive-data-protection"],
      4: ["lawfulness-consent-choice", "purpose-limitation", "retention-deletion-lifecycle"],
      5: ["transparency-explainability", "data-subject-rights"],
      6: ["purpose-limitation", "lawfulness-consent-choice", "data-subject-rights"],
      7: ["lawfulness-consent-choice", "data-subject-rights", "transparency-explainability"],
      8: ["cross-border-transfer", "accountability-governance", "third-party-supply-chain"],
      9: ["sensitive-data-protection", "purpose-limitation"],
      10: ["accountability-governance", "data-subject-rights"],
      11: ["security-controls", "retention-deletion-lifecycle", "accountability-governance"],
      12: ["data-subject-rights", "transparency-explainability"],
      13: ["data-subject-rights", "accountability-governance"],
    };
    return mappings[number] ?? ["accountability-governance"];
  }
  if (provision.provisionType === "schedule-clause") {
    return number <= 16
      ? addEnglishTextConcepts(provision, [
          "lawfulness-consent-choice",
          "data-subject-rights",
          "accountability-governance",
        ])
      : ["accountability-governance"];
  }

  const title = provision.title.toLowerCase();
  const base = [];
  if (/objects? of this act|application|privacy/.test(title)) {
    base.push("accountability-governance", "data-subject-rights");
  }
  if (/credit reporting|credit provider|credit information|tax file number/.test(title)) {
    base.push("sensitive-data-protection", "data-subject-rights", "accountability-governance");
  }
  if (/notifiable data breach|data breach/.test(title)) {
    base.push("incident-response", "security-controls", "transparency-explainability");
  }
  if (/security|confidential/.test(title)) base.push("security-controls");
  if (/access|correction|complaint|civil remedy|compensation/.test(title)) {
    base.push("data-subject-rights", "accountability-governance");
  }
  if (/investigat|enforcement|determination|assessment|audit|code/.test(title)) {
    base.push("continuous-assurance", "accountability-governance");
  }
  if (/overseas|outside australia|cross.border/.test(title)) {
    base.push("cross-border-transfer", "accountability-governance");
  }
  if (/record|retain|destroy|delet/.test(title)) {
    base.push("retention-deletion-lifecycle", "accountability-governance");
  }
  if (/automated|computer program/.test(title)) {
    base.push("automated-decision-safeguards", "human-oversight", "transparency-explainability");
  }
  if (/biometric|health information|genetic/.test(title)) {
    base.push("sensitive-data-protection", "security-controls");
  }
  return addEnglishTextConcepts(provision, base);
}

function australiaPrivacyRelevance(provision) {
  if (provision.provisionType === "australian-privacy-principle") {
    return "substantive-topic";
  }
  if (provision.provisionType === "schedule-clause") {
    return Number(provision.provisionNumber) <= 16
      ? "substantive-topic"
      : "structural-context";
  }
  const title = provision.title.toLowerCase();
  const structuralTitle = /short title|commencement|simplified outline|appointment|remuneration|leave of absence|resignation|termination of appointment|acting appointment|staff|consultant|annual report|delegation|jurisdiction|rules of court|limitation period|application of the criminal code|regulations|schedule of amendments/.test(
    title,
  );
  if (structuralTitle) return "structural-context";
  return australiaPrivacyConcepts(provision).length > 0
    ? "substantive-topic"
    : "structural-context";
}

function addJapaneseTextConcepts(provision, baseConcepts = []) {
  const text = [
    provision.title,
    provision.originalTitle,
    provision.fullText,
    provision.translations?.en?.title,
    provision.translations?.en?.fullText,
  ]
    .filter(Boolean)
    .join("\n");
  const concepts = [...baseConcepts];
  const addWhen = (pattern, ...ids) => {
    if (pattern.test(text)) concepts.push(...ids);
  };

  addWhen(/同意|適法|適正な取得|lawful|consent/iu, "lawfulness-consent-choice");
  addWhen(/利用目的|目的外|purpose/iu, "purpose-limitation");
  addWhen(/必要な範囲|最小|データ内容の正確性|accuracy|minimum necessary/iu, "data-minimization");
  addWhen(/開示|訂正|利用停止|請求権|苦情|access|correction|objection|rights?/iu, "data-subject-rights");
  addWhen(/要配慮|個人識別符号|生体|医療|未成年|sensitive|biometric|child/iu, "sensitive-data-protection");
  addWhen(/保存|消去|削除|廃棄|retention|erase|delete/iu, "retention-deletion-lifecycle");
  addWhen(/仮名加工|匿名加工|識別行為|暗号|pseudonym|anonym|encrypt/iu, "privacy-enhancing-tech");
  addWhen(/安全管理|秘密保持|security|confidential/iu, "security-controls");
  addWhen(/漏えい|breach|incident/iu, "incident-response", "transparency-explainability");
  addWhen(/影響評価|リスク|評価|assessment|risk/iu, "impact-assessment", "ai-risk-management");
  addWhen(/自動|人工知能|algorithm|automated|artificial intelligence/iu, "ai-risk-management");
  addWhen(/説明|通知|公表|透明|explain|notification|transparen/iu, "transparency-explainability");
  addWhen(/委託|第三者|従業者|提供先|processor|third party|supplier/iu, "third-party-supply-chain");
  addWhen(/外国|国際|越境|outside japan|international|cross.border/iu, "cross-border-transfer", "global-coordination");
  addWhen(/監督|監査|検査|勧告|命令|認定|報告|委員会|compliance|audit|inspection|recommendation/iu, "continuous-assurance", "accountability-governance");
  addWhen(/差別|公平|公正|fair|discriminat/iu, "fairness-nondiscrimination");
  addWhen(/人間|人材|human/iu, "human-oversight");
  addWhen(/研究開発|基盤|施設|設備|sharing|development/iu, "training-data-governance", "third-party-supply-chain");

  return unique(concepts);
}

function japanAppiConcepts(provision) {
  if (provision.unitType !== "article") return [];
  const number = Number(provision.articleNumber);
  let base = ["accountability-governance"];
  if (inRange(number, 1, 16)) {
    base = ["accountability-governance", "data-subject-rights"];
  } else if (inRange(number, 17, 22)) {
    base = ["lawfulness-consent-choice", "purpose-limitation", "data-minimization"];
  } else if (number === 23) {
    base = ["security-controls", "accountability-governance"];
  } else if (number === 24 || number === 25) {
    base = ["security-controls", "third-party-supply-chain", "accountability-governance"];
  } else if (number === 26) {
    base = ["incident-response", "security-controls", "transparency-explainability"];
  } else if (inRange(number, 27, 31)) {
    base = ["lawfulness-consent-choice", "third-party-supply-chain", "accountability-governance"];
    if (number === 28) base.push("cross-border-transfer");
  } else if (inRange(number, 32, 40)) {
    base = ["data-subject-rights", "transparency-explainability", "accountability-governance"];
  } else if (inRange(number, 41, 46)) {
    base = ["privacy-enhancing-tech", "security-controls", "accountability-governance"];
  } else if (inRange(number, 47, 59)) {
    base = ["continuous-assurance", "accountability-governance"];
  } else if (inRange(number, 60, 75)) {
    base = ["purpose-limitation", "security-controls", "accountability-governance"];
    if (number === 68) base.push("incident-response");
    if (number === 71) base.push("cross-border-transfer");
  } else if (inRange(number, 76, 108)) {
    base = ["data-subject-rights", "transparency-explainability", "accountability-governance"];
  } else if (inRange(number, 109, 125)) {
    base = ["privacy-enhancing-tech", "accountability-governance", "continuous-assurance"];
  } else if (inRange(number, 126, 129)) {
    base = ["data-subject-rights", "accountability-governance"];
  } else if (inRange(number, 130, 170)) {
    base = ["continuous-assurance", "accountability-governance"];
  } else if (inRange(number, 171, 174)) {
    base = ["cross-border-transfer", "global-coordination", "accountability-governance"];
  } else if (inRange(number, 175, 185)) {
    base = ["continuous-assurance", "accountability-governance"];
  }
  return addJapaneseTextConcepts(provision, base);
}

function japanAppiRelevance(provision) {
  if (provision.unitType !== "article") return "structural-context";
  const number = Number(provision.articleNumber);
  const structural =
    [7, 15, 38, 48, 50, 51, 56, 85, 89, 96, 104, 106, 107, 108, 113, 119, 126, 129, 134, 135, 136, 137, 138, 139, 140, 141, 142, 144, 150, 152, 161, 162, 163, 164, 167, 170, 175].includes(number);
  return structural ? "structural-context" : "substantive-topic";
}

function japanAiPromotionConcepts(provision) {
  if (provision.unitType !== "article") return [];
  const number = Number(provision.articleNumber);
  const mapping = {
    1: ["ai-risk-management", "accountability-governance", "global-coordination"],
    2: ["ai-risk-management", "accountability-governance"],
    3: ["fairness-nondiscrimination", "human-oversight", "transparency-explainability", "frontier-model-safety", "global-coordination"],
    4: ["accountability-governance", "ai-risk-management"],
    5: ["accountability-governance", "global-coordination"],
    6: ["ai-risk-management", "continuous-assurance", "accountability-governance"],
    7: ["ai-risk-management", "accountability-governance", "continuous-assurance"],
    8: ["human-oversight", "transparency-explainability"],
    9: ["global-coordination", "accountability-governance"],
    10: ["accountability-governance"],
    11: ["ai-risk-management", "frontier-model-safety"],
    12: ["training-data-governance", "third-party-supply-chain", "privacy-enhancing-tech"],
    13: ["ai-risk-management", "frontier-model-safety", "security-controls", "continuous-assurance"],
    14: ["human-oversight", "accountability-governance"],
    15: ["human-oversight", "transparency-explainability"],
    16: ["continuous-assurance", "ai-risk-management"],
    17: ["global-coordination", "frontier-model-safety"],
    18: ["ai-risk-management", "accountability-governance", "continuous-assurance"],
    19: ["accountability-governance", "global-coordination"],
    20: ["accountability-governance", "continuous-assurance"],
  };
  return addJapaneseTextConcepts(
    provision,
    mapping[number] ?? ["accountability-governance"],
  );
}

function japanAiPromotionRelevance(provision) {
  if (provision.unitType !== "article") return "structural-context";
  return Number(provision.articleNumber) <= 20
    ? "substantive-topic"
    : "structural-context";
}

function hongKongPdpoConcepts(provision) {
  const isSchedule = provision.provisionType === "schedule";
  const locator = String(provision.articleNumber).toUpperCase();
  const number = Number.parseInt(locator, 10);
  let base = [];
  if (isSchedule) {
    base = number === 1
      ? ["lawfulness-consent-choice", "purpose-limitation", "data-minimization", "security-controls", "data-subject-rights", "retention-deletion-lifecycle"]
      : ["accountability-governance"];
  } else if (inRange(number, 2, 4)) {
    base = ["accountability-governance", "data-subject-rights", "purpose-limitation"];
  } else if (number === 8 || inRange(number, 12, 16)) {
    base = ["continuous-assurance", "accountability-governance", "transparency-explainability"];
  } else if (inRange(number, 18, 29)) {
    base = ["data-subject-rights", "transparency-explainability", "retention-deletion-lifecycle"];
  } else if (inRange(number, 30, 32)) {
    base = ["automated-decision-safeguards", "human-oversight", "lawfulness-consent-choice", "transparency-explainability"];
  } else if (number === 33) {
    base = ["cross-border-transfer", "accountability-governance"];
  } else if (locator.startsWith("35")) {
    base = ["lawfulness-consent-choice", "data-subject-rights", "transparency-explainability", "purpose-limitation"];
  } else if (inRange(number, 36, 50)) {
    base = ["continuous-assurance", "accountability-governance", "data-subject-rights"];
  } else if (inRange(number, 52, 63)) {
    base = ["purpose-limitation", "sensitive-data-protection", "accountability-governance"];
  } else if (number === 64 || locator === "64A") {
    base = ["security-controls", "lawfulness-consent-choice", "data-subject-rights"];
  } else if (number === 65 || number === 66) {
    base = ["third-party-supply-chain", "data-subject-rights", "accountability-governance"];
  } else if (locator.startsWith("66")) {
    base = ["security-controls", "incident-response", "continuous-assurance", "accountability-governance"];
  }
  return addEnglishTextConcepts(
    provision,
    base.length ? base : ["accountability-governance"],
  );
}

function hongKongPdpoRelevance(provision) {
  if (provision.provisionType === "schedule") {
    return [1, 3, 4, 5].includes(Number(provision.articleNumber))
      ? "substantive-topic"
      : "structural-context";
  }
  const locator = String(provision.articleNumber).toUpperCase();
  const number = Number.parseInt(locator, 10);
  if ([1, 5, 6, 7, 9, 10, 11, 17, 34, 51, 67, 68, 69, 70, 71, 72, 73, 74, 75].includes(number)) {
    return "structural-context";
  }
  if (locator === "11A" || locator === "17A" || locator === "51A" || locator === "64B" || locator === "64C") {
    return "structural-context";
  }
  return "substantive-topic";
}

function multilingualTextConcepts(provision, baseConcepts = []) {
  const translationText = Object.values(provision.translations ?? {})
    .flatMap((translation) => [translation.title, translation.fullText])
    .filter(Boolean)
    .join("\n");
  const text = [
    provision.title,
    provision.originalTitle,
    provision.fullText,
    translationText,
  ]
    .filter(Boolean)
    .join("\n");
  const concepts = [...baseConcepts];
  const addWhen = (pattern, ...ids) => {
    if (pattern.test(text)) concepts.push(...ids);
  };

  addWhen(/consent|lawful|legal basis|동의|적법|合[法規]|đồng ý|hợp pháp|consentimento|consenso|consentement|einwilligung/iu, "lawfulness-consent-choice");
  addWhen(/purpose limitation|specified purpose|이용 목적|목적 외|mục đích|limitação da finalidade|finalidade|finalité|zweck|scopo/iu, "purpose-limitation");
  addWhen(/data minim|minimisation|minimum necessary|최소한|최소 수집|tối thiểu|minimização|necessidade|notwendigen.*minimum/iu, "data-minimization");
  addWhen(/automated decision|automatisierte.*entscheidung|자동화.*결정|quyết định tự động|decis[aã]o automatizada/iu, "automated-decision-safeguards", "human-oversight", "transparency-explainability");
  addWhen(/data subject|right to access|right to erasure|정보주체|열람|정정|삭제|quyền của chủ thể|truy cập|chỉnh sửa|xóa dữ liệu|titular dos dados|direitos? (?:da|das) pessoa/iu, "data-subject-rights");
  addWhen(/transparen|explain|notice|disclos|투명|설명|통지|공개|minh bạch|giải thích|thông báo|transpar[eê]ncia|explicaç[aã]o|divulgaç[aã]o/iu, "transparency-explainability");
  addWhen(/discriminat|fairness|차별|공정|phân biệt đối xử|discriminaç[aã]o|equidade|équitable/iu, "fairness-nondiscrimination");
  addWhen(/sensitive|biometric|genetic|child|민감|생체|아동|nhạy cảm|sinh trắc|trẻ em|sensíveis|biom[eé]tric|crianç/iu, "sensitive-data-protection");
  addWhen(/training data|data quality|학습데이터|데이터 품질|dữ liệu huấn luyện|chất lượng dữ liệu|dados de treinamento|qualidade dos dados/iu, "training-data-governance");
  addWhen(/retention|erase|delet|destroy|보유|파기|삭제|lưu trữ|xóa|hủy dữ liệu|retenç[aã]o|eliminaç[aã]o|exclus[aã]o/iu, "retention-deletion-lifecycle");
  addWhen(/cross.border|outside (?:switzerland|korea|vietnam)|foreign countr|국외 이전|국외이전|nước ngoài|xuyên biên giới|transfer[eê]ncia internacional/iu, "cross-border-transfer", "global-coordination");
  addWhen(/risk management|위험관리|위험 관리|quản lý rủi ro|gest[aã]o de riscos?|alto risco/iu, "ai-risk-management");
  addWhen(/impact assessment|risk assessment|영향평가|위험평가|đánh giá tác động|avaliaç[aã]o (?:de )?impacto|évaluation d.*impact|folgenabschätzung/iu, "impact-assessment", "ai-risk-management");
  addWhen(/controller|processor|representative|governance|책임|보호책임자|관리체계|trách nhiệm|bên kiểm soát|bên xử lý|governan[cç]a|agente de intelig[eê]ncia artificial/iu, "accountability-governance");
  addWhen(/third part|processor|vendor|delegate|제3자|처리위탁|수탁|bên thứ ba|bên xử lý|terceir|fornecedor/iu, "third-party-supply-chain");
  addWhen(/audit|monitor|inspect|supervis|certif|查核|確認|驗證|監督|감사|감독|조사|인증|kiểm tra|thanh tra|giám sát|auditoria|monitoramento|supervis[aã]o|certificaç[aã]o/iu, "continuous-assurance", "accountability-governance");
  addWhen(/security|cyber|confidential|encrypt|안전성|보안|암호|an ninh|bảo mật|mã hóa|seguranç|ciberseguranç|confidencial/iu, "security-controls");
  addWhen(/pseudonym|anonym|de.identif|가명|익명|ẩn danh|khử định danh|anonimizaç[aã]o|desidentificaç[aã]o/iu, "privacy-enhancing-tech");
  addWhen(/breach|incident|leak|유출|침해사고|vi phạm|sự cố|rò rỉ|incidente|vazamento/iu, "incident-response", "security-controls");
  addWhen(/human oversight|human intervention|사람의 개입|인간의 감독|con người kiểm soát|supervis[aã]o humana|intervenç[aã]o humana/iu, "human-oversight");
  addWhen(/frontier|foundation model|high-impact ai|general-purpose ai|고영향|생성형 인공지능|mô hình nền tảng|prop[oó]sito geral|uso geral/iu, "frontier-model-safety", "ai-risk-management");
  addWhen(/international|global|국제|quốc tế|internacional/iu, "global-coordination");

  return unique(concepts);
}

function swissFadpConcepts(provision) {
  return multilingualTextConcepts(
    provision,
    provision.conceptIds?.length
      ? provision.conceptIds
      : provision.highlightForThemes
        ? ["accountability-governance"]
        : [],
  );
}

function swissFadpRelevance(provision) {
  return provision.highlightForThemes
    ? "substantive-topic"
    : "structural-context";
}

function vietnamConcepts(provision) {
  const base = ["accountability-governance"];
  if (provision.unitType === "appendix-form") {
    base.push("continuous-assurance");
  }
  return multilingualTextConcepts(provision, base);
}

function vietnamRelevance(provision) {
  const number = Number(provision.articleNumber);
  if (provision.instrumentId === "vn-personal-data-protection-law-2025") {
    return number === 38 ? "structural-context" : "substantive-topic";
  }
  if (provision.instrumentId === "vn-decree-356-2025") {
    return number === 42 ? "structural-context" : "substantive-topic";
  }
  if (provision.instrumentId === "vn-decree-13-2023") {
    return number === 43 || number === 44
      ? "structural-context"
      : "substantive-topic";
  }
  return "substantive-topic";
}

function koreaPipaConcepts(provision) {
  if (provision.unitType !== "article") return [];
  const locator = String(provision.articleNumber);
  const base = ["accountability-governance"];
  if (/^(?:28-[2-5])$/.test(locator)) {
    base.push("privacy-enhancing-tech", "security-controls");
  }
  if (/^(?:28-(?:8|9|10|11))$/.test(locator)) {
    base.push("cross-border-transfer", "global-coordination");
  }
  if (locator === "29") base.push("security-controls");
  if (locator === "33") base.push("impact-assessment");
  if (locator === "34") base.push("incident-response", "security-controls");
  if (locator === "37-2") {
    base.push(
      "automated-decision-safeguards",
      "human-oversight",
      "transparency-explainability",
    );
  }
  return multilingualTextConcepts(provision, base);
}

function koreaAiFrameworkConcepts(provision) {
  if (provision.unitType !== "article") return [];
  const number = Number(provision.articleNumber);
  const base = ["ai-risk-management", "accountability-governance"];
  const mapping = {
    31: ["transparency-explainability"],
    32: ["frontier-model-safety", "security-controls", "continuous-assurance"],
    33: ["impact-assessment", "continuous-assurance"],
    34: ["human-oversight", "impact-assessment", "security-controls"],
    35: ["impact-assessment", "fairness-nondiscrimination"],
  };
  base.push(...(mapping[number] ?? []));
  return multilingualTextConcepts(provision, base);
}

function koreaCurrentRelevance(provision) {
  return provision.unitType === "article"
    ? "substantive-topic"
    : "structural-context";
}

function usExecutiveOrderConcepts(provision) {
  if (provision.unitType === "preamble") return [];
  const base = ["ai-risk-management", "accountability-governance"];
  return multilingualTextConcepts(provision, base);
}

function usExecutiveOrderRelevance(provision) {
  if (provision.unitType === "preamble") return "structural-context";
  if (/-(?:sec-13|sec-6)$/.test(provision.id)) return "structural-context";
  return "substantive-topic";
}

function importedReviewedConcepts(provision, baseConcepts = []) {
  return multilingualTextConcepts(provision, [
    ...baseConcepts,
    ...(provision.conceptIds ?? []),
    ...(provision.coreConceptIds ?? []),
    ...(provision.topicRelevance?.coreConceptIds ?? []),
  ]);
}

function brazilAiBillConcepts(provision) {
  const number = Number(provision.articleNumber);
  const base = ["ai-risk-management", "accountability-governance"];
  if (inRange(number, 5, 11)) {
    base.push(
      "data-subject-rights",
      "transparency-explainability",
      "human-oversight",
      "fairness-nondiscrimination",
    );
  }
  if (inRange(number, 12, 16)) {
    base.push("impact-assessment", "fairness-nondiscrimination");
  }
  if (inRange(number, 17, 24)) {
    base.push("transparency-explainability", "continuous-assurance");
  }
  if (inRange(number, 25, 30)) {
    base.push("impact-assessment", "continuous-assurance");
  }
  if (inRange(number, 32, 34)) {
    base.push("third-party-supply-chain", "continuous-assurance");
  }
  if (inRange(number, 35, 41)) {
    base.push("continuous-assurance");
  }
  if (number === 42) base.push("incident-response", "security-controls");
  if (number === 43) base.push("security-controls", "incident-response");
  if (number === 44) base.push("transparency-explainability");
  if (inRange(number, 45, 57)) base.push("continuous-assurance");
  if (number === 58) base.push("fairness-nondiscrimination", "human-oversight");
  if (inRange(number, 62, 66)) {
    base.push(
      "training-data-governance",
      "transparency-explainability",
      "data-subject-rights",
    );
  }
  if (inRange(number, 67, 79)) base.push("global-coordination");
  return importedReviewedConcepts(provision, base);
}

function brazilAiBillRelevance(provision) {
  return Number(provision.articleNumber) === 80
    ? "structural-context"
    : "substantive-topic";
}

function usStateAiConcepts(provision) {
  const concepts = ["ai-risk-management"];
  if (provision.id === "us-co-ai-act-current-6-1-1702") {
    concepts.push("human-oversight");
  }
  return importedReviewedConcepts(provision, concepts);
}

function usStateAiRelevance(provision) {
  return provision.topicRelevance?.highlighted
    ? "substantive-topic"
    : "structural-context";
}

function nistAiRmfConcepts(provision) {
  const concepts = ["ai-risk-management"];
  if (provision.id === "us-nist-ai-rmf-1-0-core-map-2-2") {
    concepts.push("human-oversight");
  }
  return importedReviewedConcepts(provision, concepts);
}

function nistAiRmfRelevance(provision) {
  if (
    ["front-matter", "navigation-front-matter", "figure-caption", "part"].includes(
      provision.unitType,
    )
  ) {
    return "structural-context";
  }
  return provision.thematicRelevance?.isRelevant
    ? "substantive-topic"
    : "structural-context";
}

function aiActConcepts(number) {
  if (number === 4) return ["transparency-explainability", "human-oversight", "accountability-governance"];
  if (number === 5) return ["fairness-nondiscrimination", "human-oversight", "sensitive-data-protection"];
  if (inRange(number, 6, 9)) return ["ai-risk-management", "impact-assessment", "accountability-governance"];
  if (number === 10) return ["training-data-governance", "fairness-nondiscrimination", "sensitive-data-protection"];
  if (number === 11 || number === 12) return ["accountability-governance", "continuous-assurance"];
  if (number === 13) return ["transparency-explainability"];
  if (number === 14) return ["human-oversight"];
  if (number === 15) return ["security-controls", "continuous-assurance", "incident-response"];
  if (inRange(number, 16, 19)) return ["accountability-governance", "continuous-assurance"];
  if (number === 20) return ["incident-response", "accountability-governance"];
  if (inRange(number, 21, 24)) return ["third-party-supply-chain", "accountability-governance"];
  if (number === 25) return ["third-party-supply-chain", "accountability-governance"];
  if (number === 26) return ["human-oversight", "accountability-governance", "impact-assessment"];
  if (number === 27) return ["impact-assessment", "fairness-nondiscrimination", "data-subject-rights"];
  if (inRange(number, 28, 39)) return ["continuous-assurance", "third-party-supply-chain", "accountability-governance"];
  if (inRange(number, 40, 49)) return ["continuous-assurance", "third-party-supply-chain"];
  if (number === 50) return ["transparency-explainability", "data-subject-rights"];
  if (inRange(number, 51, 55)) return ["frontier-model-safety", "ai-risk-management", "security-controls", "accountability-governance"];
  if (number === 56) return ["frontier-model-safety", "continuous-assurance", "global-coordination"];
  if (inRange(number, 57, 63)) {
    const concepts = ["ai-risk-management", "continuous-assurance", "accountability-governance"];
    if (number === 59) concepts.push("purpose-limitation", "sensitive-data-protection");
    if (number === 61) concepts.push("lawfulness-consent-choice", "data-subject-rights");
    return concepts;
  }
  if (inRange(number, 64, 71)) return ["accountability-governance", "global-coordination"];
  if (number === 72) return ["continuous-assurance", "ai-risk-management"];
  if (number === 73) return ["incident-response", "continuous-assurance"];
  if (inRange(number, 74, 84)) return ["continuous-assurance", "security-controls", "accountability-governance"];
  if (number === 85) return ["data-subject-rights", "incident-response"];
  if (number === 86) return ["transparency-explainability", "automated-decision-safeguards", "data-subject-rights"];
  if (number === 87) return ["incident-response", "accountability-governance"];
  if (inRange(number, 88, 94)) return ["frontier-model-safety", "continuous-assurance", "accountability-governance"];
  if (number === 95 || number === 96) return ["accountability-governance", "continuous-assurance"];
  if (inRange(number, 99, 101)) return ["accountability-governance", "incident-response"];
  if (number === 111) return ["accountability-governance", "third-party-supply-chain"];
  if (number === 112) return ["continuous-assurance", "global-coordination"];
  return ["ai-risk-management", "accountability-governance"];
}

function aiActRelevance(number) {
  return number === 97 || number === 98 || inRange(number, 102, 110) || number === 113
    ? "structural-context"
    : "substantive-topic";
}

function reviewForArticle(article, concepts, relevance) {
  const conceptIds = unique(concepts);
  const commencementNote = article.legalEffectStatus &&
    article.legalEffectStatus !== "in-force"
    ? ` The stored node is labelled ${article.legalEffectStatus}; its node-level commencement metadata must be checked before treating the displayed wording as an operative duty.`
    : "";
  const rationale = relevance === "substantive-topic"
    ? `${article.label} (${article.title}) directly regulates or operationalizes a subject within this project's AI-governance, privacy, data-security, or assurance taxonomy. Concept links are functional classifications, not claims of legal equivalence.${commencementNote}`
    : `${article.label} (${article.title}) supplies legislative procedure, amendment, repeal, or application context. It remains searchable but is not highlighted as a direct substantive compliance duty.${commencementNote}`;
  return {
    provisionId: article.id,
    relevance,
    conceptIds,
    rationale,
    reviewStatus: "editorial-reviewed",
    reviewedOn,
  };
}

const reviewById = new Map();

for (const article of gdprArticles) {
  const number = Number(article.articleNumber);
  reviewById.set(
    article.id,
    reviewForArticle(article, gdprConcepts(number), gdprRelevance(number)),
  );
}

for (const article of euAiActArticles) {
  const number = Number(article.articleNumber);
  reviewById.set(
    article.id,
    reviewForArticle(article, aiActConcepts(number), aiActRelevance(number)),
  );
}

for (const article of ukGdprArticles) {
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      ukGdprConcepts(article),
      ukGdprRelevance(article),
    ),
  );
}

for (const article of piplArticles) {
  const number = Number(article.articleNumber);
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      piplConcepts(number),
      number === 74 ? "structural-context" : "substantive-topic",
    ),
  );
}

for (const article of networkDataArticles) {
  const number = Number(article.articleNumber);
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      networkDataConcepts(article),
      number === 64 ? "structural-context" : "substantive-topic",
    ),
  );
}

for (const article of generativeAiArticles) {
  const number = Number(article.articleNumber);
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      generativeAiConcepts(article),
      number === 24 ? "structural-context" : "substantive-topic",
    ),
  );
}

for (const provision of pipedaProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      pipedaConcepts(provision),
      pipedaRelevance(provision),
    ),
  );
}

for (const article of lgpdArticles) {
  reviewById.set(
    article.id,
    reviewForArticle(article, lgpdConcepts(article), lgpdRelevance(article)),
  );
}

for (const article of taiwanAiActArticles) {
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      taiwanAiActConcepts(article),
      Number(article.articleNumber) === 20
        ? "structural-context"
        : "substantive-topic",
    ),
  );
}

for (const article of taiwanPdpaArticles) {
  reviewById.set(
    article.id,
    reviewForArticle(
      article,
      taiwanPdpaConcepts(article),
      taiwanPdpaRelevance(article),
    ),
  );
}

for (const provision of singaporePdpaProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      singaporePdpaConcepts(provision),
      singaporePdpaRelevance(provision),
    ),
  );
}

for (const provision of southAfricaPopiaSections) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      popiaConcepts(provision),
      popiaRelevance(provision),
    ),
  );
}

for (const provision of nigeriaNdpaSections) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      nigeriaNdpaConcepts(provision),
      nigeriaNdpaRelevance(provision),
    ),
  );
}

for (const provision of indonesiaPdpArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      indonesiaPdpConcepts(provision),
      indonesiaPdpRelevance(provision),
    ),
  );
}

for (const provision of indiaDpdpActProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      indiaDpdpActConcepts(provision),
      indiaDpdpActRelevance(provision),
    ),
  );
}

for (const provision of indiaDpdpRulesProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      indiaDpdpRulesConcepts(provision),
      indiaDpdpRulesRelevance(provision),
    ),
  );
}

for (const provision of uaePdplArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      uaePdplConcepts(provision),
      uaePdplRelevance(provision),
    ),
  );
}

for (const provision of saudiPdplArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      saudiPdplConcepts(provision),
      saudiPdplRelevance(provision),
    ),
  );
}

for (const provision of saudiPdplImplementingArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      saudiImplementingConcepts(provision),
      importedUnitNumber(provision) === 38
        ? "structural-context"
        : "substantive-topic",
    ),
  );
}

for (const provision of saudiPdplTransferArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      saudiTransferConcepts(provision),
      importedUnitNumber(provision) === 9
        ? "structural-context"
        : "substantive-topic",
    ),
  );
}

for (const provision of australiaPrivacyActProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      australiaPrivacyConcepts(provision),
      australiaPrivacyRelevance(provision),
    ),
  );
}

for (const provision of japanAppiArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      japanAppiConcepts(provision),
      japanAppiRelevance(provision),
    ),
  );
}

for (const provision of japanAiPromotionActArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      japanAiPromotionConcepts(provision),
      japanAiPromotionRelevance(provision),
    ),
  );
}

for (const provision of hongKongPdpoProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      hongKongPdpoConcepts(provision),
      hongKongPdpoRelevance(provision),
    ),
  );
}

for (const provision of swissFadpProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      swissFadpConcepts(provision),
      swissFadpRelevance(provision),
    ),
  );
}

for (const provision of [
  ...vietnamPdplArticles,
  ...vietnamDecree356Provisions,
  ...vietnamDecree13HistoricalProvisions,
]) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      vietnamConcepts(provision),
      vietnamRelevance(provision),
    ),
  );
}

for (const provision of koreaPipaArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      koreaPipaConcepts(provision),
      koreaCurrentRelevance(provision),
    ),
  );
}

for (const provision of koreaAiFrameworkArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      koreaAiFrameworkConcepts(provision),
      koreaCurrentRelevance(provision),
    ),
  );
}

for (const provision of usExecutiveOrderProvisions) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      usExecutiveOrderConcepts(provision),
      usExecutiveOrderRelevance(provision),
    ),
  );
}

for (const provision of taiwanExecutiveYuanGenAiGuidelines) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      multilingualTextConcepts(provision, provision.coreConceptIds),
      provision.thematicRelevance?.isRelevant
        ? "substantive-topic"
        : "structural-context",
    ),
  );
}

for (const provision of brazilAiBillArticles) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      brazilAiBillConcepts(provision),
      brazilAiBillRelevance(provision),
    ),
  );
}

for (const provision of [
  ...californiaSb1047Provisions,
  ...coloradoAiActProvisions,
]) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      usStateAiConcepts(provision),
      usStateAiRelevance(provision),
    ),
  );
}

for (const provision of nistAiRmfCorpus) {
  reviewById.set(
    provision.id,
    reviewForArticle(
      provision,
      nistAiRmfConcepts(provision),
      nistAiRmfRelevance(provision),
    ),
  );
}

for (const provision of seedProvisions) {
  const existing = reviewById.get(provision.id);
  reviewById.set(provision.id, {
    provisionId: provision.id,
    relevance: existing?.relevance ?? "substantive-topic",
    conceptIds: unique([...(existing?.conceptIds ?? []), ...provision.conceptIds]),
    rationale: existing?.rationale ??
      `${provision.locator} (${provision.title}) is a source-linked, curated provision anchor selected for direct relevance to this project's AI-governance, privacy, data-security, or cybersecurity scope.`,
    reviewStatus: "editorial-reviewed",
    reviewedOn,
  });
}

const reviews = [...reviewById.values()].sort((left, right) =>
  left.provisionId.localeCompare(right.provisionId, undefined, { numeric: true }),
);

await writeFile(
  resolve(dataRoot, "provision-concepts.json"),
  `${JSON.stringify(reviews, null, 2)}\n`,
);

const substantive = reviews.filter(
  (review) => review.relevance === "substantive-topic",
).length;
console.log(
  `provision-concepts.json: ${reviews.length} reviewed nodes (${substantive} substantive, ${reviews.length - substantive} structural)`,
);
