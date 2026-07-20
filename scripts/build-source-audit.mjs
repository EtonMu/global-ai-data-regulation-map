import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataRoot = resolve(root, "data/v2");
const reviewedOn = "2026-07-20";

const instruments = JSON.parse(
  await readFile(resolve(dataRoot, "instruments.json"), "utf8"),
);
const provisions = JSON.parse(
  await readFile(resolve(dataRoot, "provisions.json"), "utf8"),
);
const englishCorpusCoverage = JSON.parse(
  await readFile(resolve(dataRoot, "english-corpus-coverage.json"), "utf8"),
);
const englishCoverageByInstrument = new Map(
  englishCorpusCoverage.corpora.map((record) => [record.instrumentId, record]),
);
for (const [corpusInstrumentId, registryInstrumentId] of [
  ["vn-decree-356-2025", "vn-pdpl-implementing-decree-356-2025"],
  ["vn-decree-13-2023", "vn-personal-data-protection-decree-13-2023"],
]) {
  const coverage = englishCoverageByInstrument.get(corpusInstrumentId);
  if (coverage) englishCoverageByInstrument.set(registryInstrumentId, coverage);
}
const [
  piplArticles,
  networkDataArticles,
  generativeAiArticles,
  ukGdprArticles,
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
] =
  await Promise.all([
    "cn-pipl-articles.json",
    "cn-network-data-regulations-articles.json",
    "cn-generative-ai-measures-articles.json",
    "uk-gdpr-articles.json",
    "canada-pipeda-provisions.json",
    "brazil-lgpd-articles.json",
    "tw-ai-basic-act-2026-articles.json",
    "tw-personal-data-protection-act-articles.json",
    "sg-pdpa-provisions.json",
    "za-popia-sections.json",
    "ng-ndpa-2023-sections.json",
    "id-pdp-law-2022-articles.json",
    "india-dpdp-act-2023-provisions.json",
    "india-dpdp-rules-2025-provisions.json",
    "uae-federal-pdpl-45-2021-articles.json",
    "sa-pdpl-2021-amended-2023-articles.json",
    "sa-pdpl-implementing-regulation-2023-articles.json",
    "sa-pdpl-transfer-regulation-2023-articles.json",
    "au-privacy-act-1988-provisions.json",
    "jp-appi-current-articles.json",
    "jp-ai-promotion-act-2025-articles.json",
    "hk-pdpo-486-provisions.json",
    "ch-fadp-2020-provisions.json",
    "vn-personal-data-protection-law-2025-articles.json",
    "vn-decree-356-2025-provisions.json",
    "vn-decree-13-2023-historical-provisions.json",
    "kr-pipa-2011-current-articles.json",
    "kr-ai-framework-act-2025-current-articles.json",
    "us-executive-orders-provisions.json",
    "tw-executive-yuan-generative-ai-guidelines-2023-points.json",
    "br-ai-bill-2338-2023-articles.json",
    "us-ca-sb1047-2024-provisions.json",
    "us-co-ai-act-current-provisions.json",
    "us-nist-ai-rmf-1-0-corpus.json",
  ].map(async (filename) =>
    JSON.parse(await readFile(resolve(dataRoot, filename), "utf8")),
  ));

const languageProfiles = {
  eu: {
    languages: ["EU official languages"],
    note: "The Official Journal versions in the EU's official languages are equally authentic; the local complete Article import uses English.",
  },
  cn: {
    languages: ["zh-CN"],
    note: "The official Chinese publication controls. Government-published, U.S.-government, and project-authored English renderings are each labelled by source and are never represented as co-authentic enactments.",
  },
  jp: {
    languages: ["ja"],
    note: "Japanese official sources control. Government English translations can lag later amendments and are reference material for version-sensitive research.",
  },
  kr: {
    languages: ["ko"],
    note: "The Korean statutory text and amendment timeline control. Stored MOLEG English references retain provision-level version alignment and no-official-effect labels.",
  },
  br: {
    languages: ["pt-BR"],
    note: "The current official Portuguese text controls. ANPD English wording is retained only where verified against the current provision; separately identified project references cover later changes and remain non-authoritative.",
  },
  ae: {
    languages: ["ar"],
    note: "Arabic federal legislation controls. Official English portal text is treated as a translation unless the source itself is an English-language guidance document.",
  },
  "ae-dubai": {
    languages: ["en"],
    note: "The indexed Dubai guidance publication is available from the issuing authority in English.",
  },
  sa: {
    languages: ["ar"],
    note: "Official Arabic legal materials control. English publications are used as government translations or framework publications, not as substitutes for Arabic law.",
  },
  tw: {
    languages: ["zh-TW"],
    note: "The official Traditional Chinese text controls. Government English pages are identified as translations for navigation and research.",
  },
  hk: {
    languages: ["en", "zh-Hant"],
    note: "Hong Kong legislation may have authentic English and Chinese texts. Guidance-language availability is recorded at instrument level and must not be generalized from the Ordinance.",
  },
  id: {
    languages: ["id"],
    note: "The official Indonesian text controls; the corpus does not claim an official English consolidation.",
  },
  vn: {
    languages: ["vi"],
    note: "The official Vietnamese text controls. Complete project-authored English references are separately labelled as nonofficial, machine-assisted research aids with no legal effect.",
  },
  ch: {
    languages: ["de", "fr", "it"],
    note: "German, French and Italian Fedlex texts are authoritative. The official English translation is expressly non-authoritative.",
  },
  ca: {
    languages: ["en", "fr"],
    note: "Canada's federal legislative publications are bilingual. The project currently indexes the linked English presentation unless another language is identified.",
  },
};

const authoritativeLanguageOverrides = {
  "au-privacy-act-1988": {
    languages: ["en-AU"],
    note: "The Federal Register authorised English compilation supplies the current statutory wording. Enacted but uncommenced APP 1 amendments are tracked separately and are not mixed into current text.",
  },
  "jp-appi": {
    languages: ["ja-JP"],
    note: "The e-Gov Japanese consolidation is authoritative. A normalized source-text comparison verifies that 172 Act No. 37 of 2021 government-reference units remain text-equivalent to the current Japanese. The 13 changed main Articles, two changed appended tables and all 21 supplementary blocks have separately labelled current project English references.",
  },
  "jp-ai-promotion-act-2025": {
    languages: ["ja-JP"],
    note: "The e-Gov Japanese text alone has legal effect. The Japanese Law Translation Database publication is a current government reference translation with no legal effect.",
  },
  "hk-personal-data-privacy-ordinance": {
    languages: ["en-HK", "zh-Hant-HK"],
    note: "The English and Chinese texts of the Ordinance are co-authentic and have equal status under Cap. 1 section 10B. Neither is represented as a subordinate translation of the other.",
  },
  "ch-fadp-2020": {
    languages: ["de-CH", "fr-CH", "it-CH"],
    note: "German, French and Italian Fedlex enactments are equally authoritative and legally binding. The complete aligned English publication is official but expressly has no legal force.",
  },
  "vn-personal-data-protection-law-2025": {
    languages: ["vi-VN"],
    note: "The signed Vietnamese National Assembly text and Official Gazette control. All 39 Articles have a separately labelled complete, nonofficial project English reference; no issuing-authority English version was verified.",
  },
  "vn-pdpl-implementing-decree-356-2025": {
    languages: ["vi-VN"],
    note: "The signed Vietnamese Government text and Official Gazette control. All 42 Articles and 13 forms have separately labelled complete, nonofficial project English references; no issuing-authority English version was verified.",
  },
  "vn-personal-data-protection-decree-13-2023": {
    languages: ["vi-VN"],
    note: "The historical Vietnamese Government text controls. The Decree was repealed in full from 1 January 2026; all 44 Articles and six forms have complete project English references aligned to that stored historical version.",
  },
  "kr-pipa-2011": {
    languages: ["ko-KR"],
    note: "The current Korean promulgated text controls. All 126 main Articles and 12 addenda have an aligned MOLEG government English reference with no official effect; the separately audited KLRI text remains external.",
  },
  "kr-ai-framework-act-2025": {
    languages: ["ko-KR"],
    note: "The Korean promulgated text effective on 20 July 2026 controls. The MOLEG English reference is stored for all 47 current nodes: 42 are text-aligned, while Articles 2, 3, 6, 18 and 35 are explicitly marked as differing next-phase references effective 21 July 2026.",
  },
  "us-eo-14110": {
    languages: ["en-US"],
    note: "The GovInfo official electronic Federal Register edition is the pinned legal-source record. The Order is retained solely as a revoked historical text.",
  },
  "us-eo-14179": {
    languages: ["en-US"],
    note: "The GovInfo official electronic Federal Register edition supplies the complete English text of the current executive order.",
  },
  "in-dpdp-act-2023": {
    languages: ["en-IN"],
    note: "The Gazette enactment is an official English-language legal text. Legal effect must be read with the official phased commencement notification attached at unit level.",
  },
  "in-dpdp-rules-2025": {
    languages: ["en-IN"],
    note: "The Gazette rules and official corrigendum are English-language legal publications. The corrected local text and unit-level phased commencement record control the reader presentation.",
  },
  "ae-federal-pdpl-45-2021": {
    languages: ["ar-AE"],
    note: "The UAE Legislation Platform identifies Arabic as the original and controlling legal text. Its aligned English publication is stored as an official reference translation, with Arabic prevailing in conflict.",
  },
  "sa-pdpl-2021-amended-2023": {
    languages: ["ar-SA"],
    note: "The consolidated Arabic text on the Saudi Data Governance Platform controls. The aligned English PDF is a government reference translation and is not substituted for Arabic.",
  },
  "sa-pdpl-implementing-regulation-2023": {
    languages: ["ar-SA"],
    note: "The Arabic Implementing Regulation controls. The aligned English PDF on the Saudi Data Governance Platform is stored as a government reference translation.",
  },
  "sa-pdpl-transfer-regulation-2023": {
    languages: ["ar-SA"],
    note: "The Arabic Version 2.0 transfer regulation controls. The aligned English PDF is stored as a government reference translation; neither language record is used to invent a missing Gazette date.",
  },
  "id-pdp-law-2022": {
    languages: ["id-ID"],
    note: "The official Indonesian Gazette text controls. All 76 Articles have complete, nonofficial project English references; Article 53 applies and discloses the separately identified binding judicial interpretation layer.",
  },
  "za-popia-4-2013": {
    languages: ["en-ZA"],
    note: "The Department of Justice current English consolidation and official Gazette text supply the statutory wording; publisher page furniture and editorial annotations are excluded.",
  },
  "ng-data-protection-act-2023": {
    languages: ["en-NG"],
    note: "The official Gazette Act is an English-language enactment. Pending amendment bills are not treated as amendments to the stored law.",
  },
  "ca-pipeda": {
    languages: ["en-CA", "fr-CA"],
    note: "The official English and French enactments published by the Justice Laws Website are co-authentic. The interface defaults to English while preserving the full aligned French text.",
  },
  "tw-ai-basic-act-2026": {
    languages: ["zh-Hant-TW"],
    note: "The official Traditional-Chinese text controls. The National Science and Technology Council's complete English publication is stored as a government reference translation.",
  },
  "tw-personal-data-protection-act": {
    languages: ["zh-Hant-TW"],
    note: "The official Traditional-Chinese text and node-level commencement record control. The Ministry of Justice's complete English publication is stored as a government reference translation.",
  },
  "tw-executive-yuan-generative-ai-guidelines-2023": {
    languages: ["zh-Hant-TW"],
    note: "The complete official Traditional-Chinese ODT controls the local guidance corpus. The final four-paragraph explanation and ten points have complete, nonofficial project English references; the earlier English news page is not presented as a translation of the final guidance.",
  },
  "br-pl-2338-2023-ai-bill": {
    languages: ["pt-BR"],
    note: "The Chamber dossier and the Senate-approved bill text are published in Portuguese. All 79 stored Articles have complete, nonofficial project English references; the proposal remains a pending bill and is not law.",
  },
  "us-ca-sb-1047-2024": {
    languages: ["en-US"],
    note: "The California Legislative Information enrolled text is the official English bill record. It is preserved only as a vetoed historical proposal and has no current legal effect.",
  },
  "us-co-sb26-189-admt-2026": {
    languages: ["en-US"],
    note: "The Colorado Session Laws publication is the official English enactment. Unit-level commencement metadata distinguishes provisions effective on passage from principal duties applying on 1 January 2027.",
  },
  "us-nist-ai-rmf-1-0": {
    languages: ["en-US"],
    note: "NIST AI 100-1 is an original English federal technical publication. It is a voluntary risk-management framework, not legislation or an independently sufficient statement of legal compliance.",
  },
  "ae-generative-ai-guide-2023": {
    languages: ["ar", "en"],
    note: "The issuing authority separately publishes official Arabic and English editions of this educational guide. This is a bilingual guidance publication, not federal legislation with one language treated here as controlling the other.",
  },
  "sa-sdaia-ai-ethics-principles-1-0-2023": {
    languages: ["en"],
    note: "The verified Version 1.0 framework publication is in English. The retained Arabic title is metadata and is not evidence of a matching complete Arabic edition, which is not claimed without document verification.",
  },
  "hk-ai-model-pd-protection-framework-2024": {
    languages: ["en"],
    note: "Only the official English framework publication and release have been verified for this record. The Ordinance's bilingual status is not generalized to this guidance document.",
  },
  "hk-ethical-ai-guidance-2021": {
    languages: ["en"],
    note: "Only the official English guidance PDF has been verified for this record. A Chinese edition is not claimed without a separately evidenced official publication.",
  },
  "hk-genai-employee-guidelines-checklist-2025": {
    languages: ["en"],
    note: "Only the official English release and checklist have been verified for this record. A Chinese edition is not claimed without a separately evidenced official publication.",
  },
  "un-ai-advisory-final-report-2024": {
    languages: ["ar", "zh", "en", "fr", "ru", "es"],
    note: "The UN Digital Library record supplies Arabic, Chinese, English, French, Russian and Spanish publication editions. Because this is a non-binding advisory report, this records official publication availability rather than a controlling-language hierarchy.",
  },
};

const localIndexLanguageOverrides = {
  "un-ai-advisory-final-report-2024": {
    language: "en",
    note: "The locally indexed navigation and editorial summaries use English. That local presentation choice is separate from the report's availability in all six official UN languages.",
  },
};

const englishOverrides = {
  "us-eo-14110": {
    status: "complete-official-original-English-historical-text-stored",
    note: "All 30 corpus nodes preserve the complete revoked Order from the GovInfo official electronic Federal Register edition; none is presented as a current duty.",
    coverage: { translatedUnitCount: 30, totalUnitCount: 30, completeness: "complete-official-original-English-historical-text" },
  },
  "us-eo-14179": {
    status: "complete-official-original-English-text-stored",
    note: "All seven corpus nodes preserve the complete current Order from the GovInfo official electronic Federal Register edition.",
    coverage: { translatedUnitCount: 7, totalUnitCount: 7, completeness: "complete-official-original-English-text" },
  },
  "ch-fadp-2020": {
    status: "complete-official-non-authoritative-English-translation-stored",
    note: "All 77 Articles and two Annexes include aligned German, French and Italian authoritative texts and a complete official English translation that has no legal force.",
    coverage: { translatedUnitCount: 79, totalUnitCount: 79, completeness: "complete-four-language-alignment" },
  },
  "vn-personal-data-protection-law-2025": {
    status: "complete-current-project-English-reference-stored-no-official-translation-verified",
    note: "All 39 Articles are stored in verified official Vietnamese with complete, current-aligned project English references. The English is machine-assisted, nonofficial and has no legal effect; Vietnamese controls.",
  },
  "vn-pdpl-implementing-decree-356-2025": {
    status: "complete-current-project-English-reference-stored-no-official-translation-verified",
    note: "All 42 Articles and 13 Appendix forms are stored in verified official Vietnamese with complete, current-aligned project English references. The English is machine-assisted, nonofficial and has no legal effect; Vietnamese controls.",
  },
  "vn-personal-data-protection-decree-13-2023": {
    status: "complete-historical-project-English-reference-stored-no-official-translation-verified",
    note: "All 44 Articles and six Appendix forms are stored in historical official Vietnamese with complete project English references aligned to that repealed version. The English is machine-assisted, nonofficial and has no legal effect.",
  },
  "kr-pipa-2011": {
    status: "complete-current-government-English-reference-stored",
    note: "All 126 main Articles and 12 addenda have an Act No. 20897-aligned MOLEG government English reference. The Korean text controls and the English publication has no official effect; KLRI remains external.",
  },
  "kr-ai-framework-act-2025": {
    status: "complete-versioned-government-English-reference-stored",
    note: "All 47 current Korean nodes have a MOLEG English reference. Thirty-nine main Articles and three addenda are text-aligned across the 20/21 July boundary; Articles 2, 3, 6, 18 and 35 carry an upfront warning that the English text is the differing 21 July 2026 phase.",
  },
  "au-privacy-act-1988": {
    status: "complete-authorised-current-original-English-text-stored",
    note: "All 313 current main Sections, 13 current APPs and 26 Schedule 2 clauses are stored from authorised Compilation No. 104; future APP 1.7–1.9 wording is excluded from current text.",
    coverage: { translatedUnitCount: 352, totalUnitCount: 352, completeness: "complete-authorised-current-original-English-text" },
  },
  "in-dpdp-act-2023": {
    status: "complete-official-original-English-text-stored",
    note: "All 44 Sections and the Schedule are stored from the official English Gazette enactment, with unit-level phased commencement metadata.",
    coverage: { translatedUnitCount: 45, totalUnitCount: 45, completeness: "complete-official-original-English-text" },
  },
  "in-dpdp-rules-2025": {
    status: "complete-official-original-English-corrected-text-stored",
    note: "All 23 Rules and seven Schedules are stored from the official English Gazette text with the official corrigendum applied and phased commencement retained.",
    coverage: { translatedUnitCount: 30, totalUnitCount: 30, completeness: "complete-official-original-English-corrected-text" },
  },
  "ae-federal-pdpl-45-2021": {
    status: "complete-official-English-reference-translation-stored",
    note: "All 31 controlling Arabic Articles retain the UAE Legislation Platform's aligned official English reference publication; Arabic prevails in interpretation or conflict.",
    coverage: { translatedUnitCount: 31, totalUnitCount: 31, completeness: "complete-official-reference-translation" },
  },
  "sa-pdpl-2021-amended-2023": {
    status: "complete-government-English-reference-translation-stored",
    note: "All 43 consolidated Arabic Articles retain the Saudi Data Governance Platform's aligned English reference publication; Arabic controls.",
    coverage: { translatedUnitCount: 43, totalUnitCount: 43, completeness: "complete-government-reference-translation" },
  },
  "sa-pdpl-implementing-regulation-2023": {
    status: "complete-government-English-reference-translation-stored",
    note: "All 38 controlling Arabic Articles retain the Saudi Data Governance Platform's aligned English reference publication; Arabic controls.",
    coverage: { translatedUnitCount: 38, totalUnitCount: 38, completeness: "complete-government-reference-translation" },
  },
  "sa-pdpl-transfer-regulation-2023": {
    status: "complete-government-English-reference-translation-stored",
    note: "All nine Version 2.0 Arabic Articles retain the Saudi Data Governance Platform's aligned English reference publication; Arabic controls.",
    coverage: { translatedUnitCount: 9, totalUnitCount: 9, completeness: "complete-government-reference-translation" },
  },
  "id-pdp-law-2022": {
    status: "complete-current-project-English-reference-stored-no-official-translation-verified",
    note: "All 76 Articles are stored in controlling Indonesian with complete, current-operative project English references. The nonofficial English has no legal effect; Article 53 incorporates and discloses the binding Constitutional Court interpretation.",
  },
  "za-popia-4-2013": {
    status: "complete-official-original-English-text-stored",
    note: "All 115 Sections and the Schedule are stored in the Act's official English wording from the current Department of Justice consolidation.",
    coverage: { translatedUnitCount: 116, totalUnitCount: 116, completeness: "complete-official-original-English-text" },
  },
  "ng-data-protection-act-2023": {
    status: "complete-official-original-English-text-stored",
    note: "All 66 Sections and the complete Schedule are stored from the official English Gazette Act.",
    coverage: { translatedUnitCount: 67, totalUnitCount: 67, completeness: "complete-official-original-English-text" },
  },
  "ca-pipeda": {
    status: "complete-official-co-authentic-English-text-stored",
    note: "All 75 current top-level Section/range and Schedule units are stored in official co-authentic English and French. English is the interface default and is not characterized as a translation of the French enactment.",
    coverage: {
      translatedUnitCount: 75,
      totalUnitCount: 75,
      completeness: "complete-official-co-authentic-bilingual-text",
    },
  },
  "tw-executive-yuan-generative-ai-guidelines-2023": {
    status: "complete-current-project-English-reference-stored-no-final-official-translation-verified",
    note: "All 11 nodes are stored in official Traditional Chinese with complete project English references. The English is nonofficial and has no legal effect; the 31 August 2023 English news page is background on a draft, not a translation of the final guidance.",
  },
  "tw-ai-basic-act-2026": {
    status: "complete-government-English-reference-translation-stored",
    note: "All 20 Articles retain the National Science and Technology Council's English publication as a government reference translation; the official Traditional-Chinese text controls.",
    coverage: {
      translatedUnitCount: 20,
      totalUnitCount: 20,
      completeness: "complete-government-reference-translation",
    },
  },
  "tw-personal-data-protection-act": {
    status: "complete-government-English-reference-translation-stored",
    note: "All 66 Article nodes retain the Ministry of Justice's English publication as a government reference translation, with commencement-sensitive status preserved separately; the official Traditional-Chinese text controls.",
    coverage: {
      translatedUnitCount: 66,
      totalUnitCount: 66,
      completeness: "complete-government-reference-translation-with-commencement-layer",
    },
  },
  "sg-pdpa-2012": {
    status: "government-consolidated-english-reference-text-stored",
    note: "All 95 current section slots and 11 Schedules are stored in English from Singapore Statutes Online. SSO identifies its consolidation as unofficial and non-authoritative; the reproduction permission, attribution and latest-version conditions remain attached to every unit.",
  },
  "cn-pipl": {
    status: "complete-government-published-English-reference-stored",
    note: "All 74 official Chinese Articles have the complete National People's Congress English reference text attached. The NPC labels the publication as a translation for reference only; Chinese controls.",
  },
  "cn-cybersecurity-law": {
    status: "complete-non-official-reference-translation-stored",
    note: "All 81 official Chinese Articles have aligned, separately labelled non-official English reference translations. The Chinese text controls.",
    coverage: {
      translatedUnitCount: 81,
      totalUnitCount: 81,
      completeness: "complete-non-official-reference-translation",
    },
  },
  "cn-network-data-regulations": {
    status: "complete-government-published-English-reference-stored",
    note: "All 64 official Chinese Articles have the complete Ministry of Justice English publication attached as a government reference text. The Chinese State Council text controls.",
  },
  "cn-generative-ai-measures": {
    status: "complete-public-domain-government-reference-translation-stored",
    note: "All 24 official Chinese Articles have a complete CASI/Air University English reference translation attached. It is a U.S.-government publication, not an official Chinese translation; Chinese controls.",
  },
  "jp-appi": {
    status: "complete-current-aligned-mixed-government-and-project-English-reference-stored",
    note: "Current-aligned English text is stored for all 208 nodes. A Japanese source-text comparison verified 172 government-reference units as unchanged; 13 changed main Articles, two changed appended tables and all 21 supplementary blocks have separately labelled project English references.",
  },
  "jp-ai-promotion-act-2025": {
    status: "complete-current-government-English-reference-translation-stored",
    note: "All 28 main Articles and current Supplementary Articles 1–2 have an aligned government English reference text. The translation has no legal effect and the original Japanese controls.",
    coverage: {
      translatedUnitCount: 29,
      totalUnitCount: 29,
      completeness: "complete-current-government-reference-translation",
    },
  },
  "jp-ai-guidelines-business-1-2": {
    status: "editorial-summary-only",
    note: "The current Version 1.2 source is Japanese; the local English view is an editorial summary, not a complete translation.",
  },
  "br-lgpd-2018": {
    status: "complete-current-English-reference-layer-stored",
    note: "All 80 current Article nodes have an English reference. Seventy-seven preserve the ANPD 2024 official reference where current wording is unchanged; Articles 5, 55-A and 55-C use clearly marked project-authored references aligned to Law No. 15,352/2026, with the Portuguese consolidation controlling.",
  },
  "br-pl-2338-2023-ai-bill": {
    status: "complete-current-pending-bill-project-English-reference-stored",
    note: "All 79 Article nodes preserve the Senate-approved Portuguese autograph transmitted to the Chamber and a complete, nonofficial project English reference. The English has no legal effect and the proposal is not law.",
    coverage: {
      translatedUnitCount: 79,
      totalUnitCount: 79,
      completeness: "complete-pending-Portuguese-bill-with-project-English-reference",
    },
  },
  "us-ca-sb-1047-2024": {
    status: "complete-official-original-English-historical-bill-text-stored",
    note: "All 18 navigable nodes preserve the complete enrolled English bill body. The corpus is explicitly vetoed, never commenced, and historical only.",
    coverage: {
      translatedUnitCount: 18,
      totalUnitCount: 18,
      completeness: "complete-official-original-English-vetoed-bill-text",
    },
  },
  "us-co-sb26-189-admt-2026": {
    status: "complete-official-original-English-current-session-law-stored",
    note: "All 18 navigable nodes preserve Colorado Session Laws 2026, chapter 131, with immediate and 1 January 2027 applicability recorded per unit.",
    coverage: {
      translatedUnitCount: 18,
      totalUnitCount: 18,
      completeness: "complete-official-original-English-current-session-law",
    },
  },
  "us-nist-ai-rmf-1-0": {
    status: "complete-official-original-English-framework-text-stored",
    note: "All 135 hierarchical nodes preserve the NIST AI RMF 1.0 publication, including four functions, 19 categories, and 72 subcategories. Its voluntary status and third-party-material boundary remain explicit.",
    coverage: {
      translatedUnitCount: 135,
      totalUnitCount: 135,
      completeness: "complete-official-original-English-voluntary-framework",
    },
  },
  "ae-generative-ai-guide-2023": {
    status: "official-original-english-publication",
    note: "The issuing authority publishes an English guide and a separate Arabic guide; the English document is the default linked reading version.",
  },
  "sa-sdaia-ai-ethics-principles-1-0-2023": {
    status: "official-original-english-publication",
    note: "The verified framework PDF is an official English publication. A complete Arabic counterpart is not claimed until its document is verified.",
  },
  "hk-personal-data-privacy-ordinance": {
    status: "complete-official-co-authentic-English-text-stored",
    note: "All 124 Sections and six Schedules are stored in English and aligned Traditional Chinese. The two language texts are co-authentic and equal in status; English is only the interface default.",
    coverage: {
      translatedUnitCount: 130,
      totalUnitCount: 130,
      completeness: "complete-official-co-authentic-bilingual-text",
    },
  },
  "ch-fadp-2020": {
    status: "complete-official-non-authoritative-English-translation-stored",
    note: "All 77 Articles and two Annexes include aligned German, French and Italian authoritative texts and a complete official English translation that has no legal force.",
    coverage: {
      translatedUnitCount: 79,
      totalUnitCount: 79,
      completeness: "complete-four-language-alignment",
    },
  },
};

const coverageOverrides = {
  "eu-gdpr": {
    mode: "complete-article-corpus",
    localUnitCount: 99,
    statement: "All 99 operative Articles are stored from the official English EUR-Lex publication. The 173 Recitals remain available at the linked official source and are not copied into the local Article corpus.",
  },
  "eu-ai-act": {
    mode: "complete-enacted-article-corpus",
    localUnitCount: 113,
    statement: "All 113 Articles of Regulation (EU) 2024/1689 are stored from the enacted official English publication. A later amending act must be separately versioned after Official Journal publication and entry into force.",
  },
  "cn-cybersecurity-law": {
    mode: "complete-current-article-corpus",
    localUnitCount: 81,
    statement: "All 81 Articles of the Chinese consolidation effective 1 January 2026 are stored in Chinese with aligned, expressly non-official English reference translations.",
  },
  "cn-pipl": {
    mode: "complete-official-Chinese-and-government-English-reference-article-corpus",
    localUnitCount: piplArticles.length,
    statement: "All 74 Articles are stored from the official Chinese publication with the complete National People's Congress English reference publication attached Article by Article; the NPC marks it as a translation for reference only.",
  },
  "cn-network-data-regulations": {
    mode: "complete-official-Chinese-and-government-English-reference-article-corpus",
    localUnitCount: networkDataArticles.length,
    statement: "All 64 Articles of State Council Order No. 790 are stored from the official Chinese publication with the Ministry of Justice's complete English publication attached Article by Article; Chinese controls.",
  },
  "cn-generative-ai-measures": {
    mode: "complete-official-Chinese-and-public-domain-English-reference-article-corpus",
    localUnitCount: generativeAiArticles.length,
    statement: "All 24 Articles of Order No. 15 are stored from the official Chinese publication with the complete CASI/Air University U.S.-government English reference translation attached; it is not an official Chinese translation.",
  },
  "gb-uk-gdpr": {
    mode: "complete-current-consolidated-article-corpus",
    localUnitCount: ukGdprArticles.length,
    statement: "All 120 distinct Article nodes in the current revised UK GDPR are stored from the official legislation.gov.uk XML presentation as at 19 June 2026, including inserted alphanumeric Articles. This is a UK consolidated corpus and must not be treated as identical to the EU GDPR text.",
  },
  "ca-pipeda": {
    mode: "complete-official-co-authentic-bilingual-current-corpus",
    localUnitCount: pipedaProvisions.length,
    statement: "All 75 current top-level Section/range and Schedule units are stored from the official Justice Laws English and French XML publications. The two enactments are co-authentic, and the local corpus is current to 31 March 2026.",
  },
  "br-lgpd-2018": {
    mode: "complete-current-Portuguese-and-English-reference-article-corpus",
    localUnitCount: lgpdArticles.length,
    statement: "All 80 current Article identifiers are stored from the official Portuguese consolidation including Law No. 15,352/2026. Seventy-seven use the unchanged ANPD official English reference; Articles 5, 55-A and 55-C use separately labelled project references aligned to the current Portuguese wording.",
  },
  "tw-ai-basic-act-2026": {
    mode: "complete-official-bilingual-article-corpus",
    localUnitCount: taiwanAiActArticles.length,
    statement: "All 20 Articles are stored from the official Traditional-Chinese publication with the National Science and Technology Council's complete English reference translation.",
  },
  "tw-personal-data-protection-act": {
    mode: "complete-official-bilingual-latest-consolidation-with-node-level-commencement-status",
    localUnitCount: taiwanPdpaArticles.length,
    statement: "All 66 Article nodes are stored from the official latest Traditional-Chinese consolidation with the Ministry of Justice English reference publication. Each node identifies whether its latest wording is in force, uncommenced, or accompanied by a still-operative prior version.",
  },
  "tw-executive-yuan-generative-ai-guidelines-2023": {
    mode: "complete-current-official-traditional-chinese-and-project-English-guidance-corpus",
    localUnitCount: taiwanExecutiveYuanGenAiGuidelines.length,
    statement: "The complete four-paragraph general explanation and all ten numbered points are stored from the official NSTC Traditional-Chinese ODT under the Government Open Data License v1, with complete separately licensed project English references. No complete official translation of the final guidance is claimed.",
  },
  "sg-pdpa-2012": {
    mode: "complete-current-government-consolidation",
    localUnitCount: singaporePdpaProvisions.length,
    statement: "All 95 current section slots (including nine repealed placeholders) and 11 Schedules are stored from the Singapore Statutes Online consolidation as at 20 July 2026. The stored text is a government consolidation, but SSO states that it is unofficial and not authoritative.",
  },
  "za-popia-4-2013": {
    mode: "complete-current-official-section-and-schedule-corpus",
    localUnitCount: southAfricaPopiaSections.length,
    statement: "All 115 Sections and the complete Schedule are stored from the Department of Justice current consolidation, with provision-level phased commencement metadata and statutory reuse basis.",
  },
  "ng-data-protection-act-2023": {
    mode: "complete-official-enacted-section-and-schedule-corpus",
    localUnitCount: nigeriaNdpaSections.length,
    statement: "All 66 Sections and the complete Schedule (paragraphs 1–18) are stored from the official Gazette copy hosted by the Nigeria Data Protection Commission. Reviewed pending bills are not represented as enacted amendments.",
  },
  "id-pdp-law-2022": {
    mode: "complete-official-original-and-project-English-article-corpus-with-judicial-overlay",
    localUnitCount: indonesiaPdpArticles.length,
    statement: "All 76 Articles are stored in controlling Indonesian with complete project English references and disclosed OCR/list-marker verification. Article 53 preserves promulgated text and separately hashed current-operative Indonesian and English layers applying the binding judicial interpretation.",
  },
  "in-dpdp-act-2023": {
    mode: "complete-official-enacted-section-and-schedule-corpus-with-phase-status",
    localUnitCount: indiaDpdpActProvisions.length,
    statement: "All 44 Sections and the Schedule are stored from the official Gazette enactment. Each unit records whether it is in force, scheduled for 14 November 2026 or 14 May 2027, or internally phase-split.",
  },
  "in-dpdp-rules-2025": {
    mode: "complete-official-corrected-rule-and-schedule-corpus-with-phase-status",
    localUnitCount: indiaDpdpRulesProvisions.length,
    statement: "All 23 Rules and seven Schedules are stored with the official G.S.R. 892(E) corrections applied and current, one-year, and eighteen-month phases recorded per unit.",
  },
  "ae-federal-pdpl-45-2021": {
    mode: "complete-controlling-arabic-and-official-english-reference-article-corpus",
    localUnitCount: uaePdplArticles.length,
    statement: "All 31 Articles are stored in controlling Arabic with aligned official English reference text from the UAE Legislation Platform.",
  },
  "sa-pdpl-2021-amended-2023": {
    mode: "complete-consolidated-arabic-and-official-english-reference-article-corpus",
    localUnitCount: saudiPdplArticles.length,
    statement: "All 43 Articles of the consolidated M/19 text reflecting M/148 amendments are stored in controlling Arabic with aligned government English reference text.",
  },
  "sa-pdpl-implementing-regulation-2023": {
    mode: "complete-controlling-arabic-and-official-english-reference-article-corpus",
    localUnitCount: saudiPdplImplementingArticles.length,
    statement: "All 38 Articles are stored in controlling Arabic with aligned government English reference text and an explicit implementation relationship to the PDPL.",
  },
  "sa-pdpl-transfer-regulation-2023": {
    mode: "complete-version-2-controlling-arabic-and-official-english-reference-article-corpus",
    localUnitCount: saudiPdplTransferArticles.length,
    statement: "All nine Articles of Version 2.0 are stored in controlling Arabic with aligned government English reference text. The missing verified Gazette publication date is not guessed.",
  },
  "au-privacy-act-1988": {
    mode: "complete-authorised-current-sections-apps-and-schedule-2-clauses",
    localUnitCount: australiaPrivacyActProvisions.length,
    statement: "All 313 current main Sections, 13 current Australian Privacy Principles and 26 Schedule 2 clauses are stored from authorised Compilation No. 104. Future APP 1.7–1.9 wording and the related Section 13K amendment remain metadata only until 10 December 2026.",
  },
  "jp-appi": {
    mode: "complete-current-Japanese-with-complete-current-aligned-mixed-English-reference-corpus",
    localUnitCount: japanAppiArticles.length,
    statement: "All 185 main Articles, 21 current supplementary-provision blocks and two appended tables are stored from the authoritative e-Gov consolidation effective on 20 July 2026. English is current-aligned for all 208 nodes: 172 government-reference units are verified text-equivalent, while 15 changed main-Article/table units and all 21 supplementary blocks have project references.",
  },
  "jp-ai-promotion-act-2025": {
    mode: "complete-current-japanese-and-government-english-reference-corpus",
    localUnitCount: japanAiPromotionActArticles.length,
    statement: "All 28 main Articles and the complete current supplementary-provision block are stored from e-Gov in Japanese, with a provision-aligned current government English reference that is expressly labelled as having no legal effect.",
  },
  "hk-personal-data-privacy-ordinance": {
    mode: "complete-official-co-authentic-bilingual-current-corpus-with-commencement-status",
    localUnitCount: hongKongPdpoProvisions.length,
    statement: "All 124 Sections and six Schedules are stored in complete co-authentic English and Traditional Chinese. Section 33 is retained as enacted but not in operation; repealed and spent placeholders remain explicit, and source-version dates are not presented as commencement dates.",
  },
  "ch-fadp-2020": {
    mode: "complete-current-four-language-aligned-article-and-annex-corpus",
    localUnitCount: swissFadpProvisions.length,
    statement: "All 77 Articles and two Annexes of the current 7 July 2025 Fedlex consolidation are stored in aligned English, German, French and Italian. German, French and Italian are equally authoritative; English is official but non-authoritative.",
  },
  "vn-personal-data-protection-law-2025": {
    mode: "complete-current-official-vietnamese-and-project-English-article-corpus",
    localUnitCount: vietnamPdplArticles.length,
    statement: "All 39 Articles of Law No. 91/2025/QH15 are stored in exact Vietnamese verified against the signed National Assembly text and searchable Official Gazette, with complete current-aligned project English references.",
  },
  "vn-pdpl-implementing-decree-356-2025": {
    mode: "complete-current-official-vietnamese-and-project-English-article-and-appendix-form-corpus",
    localUnitCount: vietnamDecree356Provisions.length,
    statement: "All 42 Articles and 13 Appendix forms of Decree No. 356/2025/NĐ-CP are stored in exact Vietnamese verified against the signed Government publication and Official Gazette, with complete current-aligned project English references.",
  },
  "vn-personal-data-protection-decree-13-2023": {
    mode: "complete-repealed-historical-official-vietnamese-and-project-English-article-and-appendix-form-corpus",
    localUnitCount: vietnamDecree13HistoricalProvisions.length,
    statement: "All 44 Articles and six Appendix forms are stored as historical Vietnamese text with complete project English references. Decree No. 13/2023/NĐ-CP was repealed in full from 1 January 2026 and is never presented as current law.",
  },
  "kr-pipa-2011": {
    mode: "complete-current-Korean-and-government-English-reference-corpus",
    localUnitCount: koreaPipaArticles.length,
    statement: "All 126 main Articles and 12 addenda are stored from the Korean consolidation effective 2 October 2025 with a complete, current-aligned MOLEG government English reference. Later promulgated phases remain isolated in the manifest.",
  },
  "kr-ai-framework-act-2025": {
    mode: "complete-current-Korean-with-versioned-government-English-reference-corpus",
    localUnitCount: koreaAiFrameworkArticles.length,
    statement: "All 44 main Articles and three addenda effective on 20 July 2026 are stored in Korean with MOLEG English references. Forty-two nodes are text-aligned; Articles 2, 3, 6, 18 and 35 display the differing 21 July 2026 English phase with an upfront not-current warning.",
  },
  "us-eo-14110": {
    mode: "complete-revoked-historical-official-executive-order-corpus",
    localUnitCount: usExecutiveOrderProvisions.filter((item) => item.instrumentId === "us-eo-14110").length,
    statement: "The complete Executive Order is stored from the GovInfo official electronic Federal Register edition in 30 navigable section nodes and labelled revoked in full from 20 January 2025.",
  },
  "us-eo-14179": {
    mode: "complete-current-official-executive-order-corpus",
    localUnitCount: usExecutiveOrderProvisions.filter((item) => item.instrumentId === "us-eo-14179").length,
    statement: "The complete current Executive Order is stored from the GovInfo official electronic Federal Register edition in seven navigable section nodes.",
  },
  "br-pl-2338-2023-ai-bill": {
    mode: "complete-official-pending-Portuguese-and-project-English-bill-article-corpus",
    localUnitCount: brazilAiBillArticles.length,
    statement: "All 79 Articles of the Senate-approved Portuguese autograph transmitted to the Chamber are stored with complete project English references, including the controlling numbering gap from Article 30 to Article 32. The corpus is pending proposal text, not enacted Brazilian law.",
  },
  "us-ca-sb-1047-2024": {
    mode: "complete-official-vetoed-enrolled-bill-corpus",
    localUnitCount: californiaSb1047Provisions.length,
    statement: "The complete enrolled bill body is stored in 18 navigable nodes: the enacting formula, eight bill Sections, and nine proposed code Sections. Every node is labelled vetoed, never enacted, never commenced, and historical only.",
  },
  "us-co-sb26-189-admt-2026": {
    mode: "complete-current-official-session-law-corpus-with-unit-level-effective-dates",
    localUnitCount: coloradoAiActProvisions.length,
    statement: "All 18 navigable units of Colorado Session Laws 2026, chapter 131 are stored. Unit-level fields distinguish provisions effective on passage on 14 May 2026, principal duties applying on 1 January 2027, and internally split provisions.",
  },
  "us-nist-ai-rmf-1-0": {
    mode: "complete-official-voluntary-framework-hierarchy-corpus",
    localUnitCount: nistAiRmfCorpus.length,
    statement: "The complete NIST AI RMF 1.0 publication is stored in 135 hierarchical nodes, including four functions, 19 categories, and all 72 subcategories. The corpus remains voluntary and preserves a separate third-party-material license boundary.",
  },
};

const reviewLevelOverrides = {
  "cn-pipl": "complete-official-original-language-article-corpus-and-anchor-review",
  "cn-network-data-regulations": "complete-official-original-language-article-corpus-and-anchor-review",
  "cn-generative-ai-measures": "complete-official-original-language-article-corpus-and-anchor-review",
  "gb-uk-gdpr": "complete-official-current-consolidated-article-corpus-and-anchor-review",
  "ca-pipeda": "complete-official-co-authentic-bilingual-current-corpus-and-anchor-review",
  "br-lgpd-2018": "complete-official-current-original-language-article-corpus-and-anchor-review",
  "tw-ai-basic-act-2026": "complete-official-bilingual-article-corpus-and-anchor-review",
  "tw-personal-data-protection-act": "complete-official-bilingual-article-corpus-with-commencement-review",
  "tw-executive-yuan-generative-ai-guidelines-2023": "complete-official-guidance-corpus-version-and-language-boundary-review",
  "sg-pdpa-2012": "complete-government-current-consolidation-and-anchor-review",
  "za-popia-4-2013": "complete-official-current-section-and-schedule-corpus-and-anchor-review",
  "ng-data-protection-act-2023": "complete-official-enacted-section-and-schedule-corpus-and-anchor-review",
  "id-pdp-law-2022": "complete-official-original-article-corpus-with-judicial-overlay-and-anchor-review",
  "in-dpdp-act-2023": "complete-official-enacted-corpus-with-unit-level-phase-review",
  "in-dpdp-rules-2025": "complete-official-corrected-corpus-with-unit-level-phase-review",
  "ae-federal-pdpl-45-2021": "complete-controlling-original-and-official-reference-translation-corpus-review",
  "sa-pdpl-2021-amended-2023": "complete-controlling-original-and-official-reference-translation-corpus-review",
  "sa-pdpl-implementing-regulation-2023": "complete-controlling-original-and-official-reference-translation-corpus-review",
  "sa-pdpl-transfer-regulation-2023": "complete-versioned-original-and-official-reference-translation-corpus-review",
  "au-privacy-act-1988": "complete-authorised-current-compilation-and-future-amendment-boundary-review",
  "jp-appi": "complete-authoritative-current-corpus-and-future-revision-boundary-review",
  "jp-ai-promotion-act-2025": "complete-current-original-and-government-reference-translation-corpus-review",
  "hk-personal-data-privacy-ordinance": "complete-official-co-authentic-bilingual-corpus-and-commencement-review",
  "ch-fadp-2020": "complete-current-multilingual-corpus-authority-and-version-review",
  "vn-personal-data-protection-law-2025": "complete-official-vietnamese-corpus-and-effective-date-review",
  "vn-pdpl-implementing-decree-356-2025": "complete-official-vietnamese-corpus-and-implementation-review",
  "vn-personal-data-protection-decree-13-2023": "complete-historical-vietnamese-corpus-and-repeal-review",
  "kr-pipa-2011": "complete-current-korean-corpus-and-future-phase-boundary-review",
  "kr-ai-framework-act-2025": "complete-current-korean-corpus-and-next-day-phase-boundary-review",
  "us-eo-14110": "complete-official-historical-corpus-and-revocation-review",
  "us-eo-14179": "complete-official-current-executive-order-corpus-review",
  "br-pl-2338-2023-ai-bill": "complete-official-pending-bill-corpus-lifecycle-and-rights-review",
  "us-ca-sb-1047-2024": "complete-official-vetoed-enrolled-bill-corpus-lifecycle-and-rights-review",
  "us-co-sb26-189-admt-2026": "complete-current-session-law-corpus-unit-effective-date-and-rights-review",
  "us-nist-ai-rmf-1-0": "complete-official-voluntary-framework-corpus-structure-and-rights-review",
};

const reviewedOnOverrides = {
  "ca-pipeda": "2026-07-20",
  "br-lgpd-2018": "2026-07-20",
  "tw-ai-basic-act-2026": "2026-07-20",
  "tw-personal-data-protection-act": "2026-07-20",
  "tw-executive-yuan-generative-ai-guidelines-2023": "2026-07-20",
  "sg-pdpa-2012": "2026-07-20",
  "za-popia-4-2013": "2026-07-20",
  "ng-data-protection-act-2023": "2026-07-20",
  "id-pdp-law-2022": "2026-07-20",
  "in-dpdp-act-2023": "2026-07-20",
  "in-dpdp-rules-2025": "2026-07-20",
  "ae-federal-pdpl-45-2021": "2026-07-20",
  "sa-pdpl-2021-amended-2023": "2026-07-20",
  "sa-pdpl-implementing-regulation-2023": "2026-07-20",
  "sa-pdpl-transfer-regulation-2023": "2026-07-20",
  "au-privacy-act-1988": "2026-07-20",
  "jp-appi": "2026-07-20",
  "jp-ai-promotion-act-2025": "2026-07-20",
  "hk-personal-data-privacy-ordinance": "2026-07-20",
  "ch-fadp-2020": "2026-07-20",
  "vn-personal-data-protection-law-2025": "2026-07-20",
  "vn-pdpl-implementing-decree-356-2025": "2026-07-20",
  "vn-personal-data-protection-decree-13-2023": "2026-07-20",
  "kr-pipa-2011": "2026-07-20",
  "kr-ai-framework-act-2025": "2026-07-20",
  "us-eo-14110": "2026-07-20",
  "us-eo-14179": "2026-07-20",
  "br-pl-2338-2023-ai-bill": "2026-07-20",
  "us-ca-sb-1047-2024": "2026-07-20",
  "us-co-sb26-189-admt-2026": "2026-07-20",
  "us-nist-ai-rmf-1-0": "2026-07-20",
};

const instrumentCaveats = {
  "eu-ai-act": [
    "The complete local Article file is the 2024 enacted text. The Digital Omnibus on AI received final Council approval on 29 June 2026 and had a final legislative text dated 8 July 2026, but no replacement consolidated corpus is claimed without an Official Journal legal-act record.",
  ],
  "ca-bill-c-27-aida-2022-lapsed": [
    "Bill C-27 lapsed on prorogation on 6 January 2025 and AIDA never became law; these nodes are retained only for legislative history and comparison.",
    "The complete unenacted AIDA bill body is not redistributed in the public corpus because reuse permission has not been established. The project retains only source-linked historical proposal anchors and editorial summaries.",
  ],
  "au-mandatory-ai-guardrails-proposal-2024": [
    "The proposal is a closed consultation record, not an enacted mandatory-guardrails regime. Current federal guidance is indexed separately.",
  ],
  "vn-personal-data-protection-decree-13-2023": [
    "Decree 13/2023 ceased to be the current principal instrument on 1 January 2026 and is retained as a historical predecessor to Law 91/2025 and Decree 356/2025.",
  ],
  "us-co-sb24-205-2024": [
    "The 2024 framework was repealed and reenacted before its principal duties operated; current research must begin with SB 26-189 and its 2027 duty date.",
  ],
  "sa-sdaia-ai-ethics-principles-1-0-2023": [
    "The framework uses mandatory language in places and also describes optional registration or reporting. Its practical binding effect is classified as mixed or unclear rather than categorically voluntary.",
  ],
  "hk-personal-data-privacy-ordinance": [
    "Section 33's cross-border transfer restriction has not commenced and must not be represented as an operative transfer prohibition.",
    "The HKeL XML is official current open data, but the corpus does not describe it as a verification-marked PDF under Cap. 614 section 5.",
  ],
  "jp-appi": [
    "The government English reference ends at Act No. 37 of 2021. It is used as current-equivalent text only for the 172 units whose normalized Japanese source wording was verified as unchanged; changed units use separately labelled project references.",
    "Seven promulgated future e-Gov revisions are preserved in the manifest but excluded from the current displayed corpus.",
  ],
  "jp-ai-promotion-act-2025": [
    "The government English text is a reference translation with no legal effect; the current Japanese e-Gov text controls.",
  ],
  "in-dpdp-act-2023": [
    "The Act is only partially in force. Highlighted future-duty provisions remain searchable but their node-level status must be checked before treating them as current obligations.",
  ],
  "in-dpdp-rules-2025": [
    "The Rules are phase-split and include an official corrigendum. The local text applies that corrigendum, but most substantive duties are not yet operative on the review date.",
  ],
  "sa-pdpl-transfer-regulation-2023": [
    "Article 9 ties effect to Official Gazette publication, but the verified Version 2.0 publication does not print that date. No exact applies-from date is claimed without a primary source.",
  ],
  "ch-fadp-2020": [
    "The English Fedlex expression is complete and official but has no legal force; German, French and Italian remain equally authoritative.",
    "The 7 July 2025 version date is a consolidation boundary, not the Act's 1 September 2023 commencement date.",
  ],
  "vn-pdpl-implementing-decree-356-2025": [
    "The 13 Appendix forms are part of the complete stored corpus. No complete official English text was verified.",
  ],
  "kr-pipa-2011": [
    "Promulgated phases effective 11 September 2026 and 1 July 2027 are isolated in the manifest and not inserted into the current text.",
    "The complete MOLEG English reference is stored under the government's open-data terms and has no official effect; KLRI text is still not reproduced without permission.",
  ],
  "kr-ai-framework-act-2025": [
    "The 46-Article Korean phase takes effect on 21 July 2026, one day after the review date, and is not inserted into the current Korean corpus. Five differing English reference Articles are retained only with explicit future-phase warnings.",
  ],
  "us-eo-14110": [
    "Every node is historical: Executive Order 14148 revoked EO 14110 in full on 20 January 2025.",
  ],
  "tw-executive-yuan-generative-ai-guidelines-2023": [
    "The guidance is non-binding and has no penalty. Its 3 October 2023 dispatch date is not replaced by the ODT upload metadata.",
    "A later public-sector AI application playbook is complementary guidance, not a verified amendment or replacement of these ten points.",
  ],
  "br-pl-2338-2023-ai-bill": [
    "The 79-node corpus is the Senate-approved autograph now pending in the Chamber, not an enacted or operative Brazilian statute; proposed Article 80 commencement periods have no present legal effect.",
    "The official numbering intentionally omits Article 31. The corpus must not synthesize a missing provision or renumber Articles 32–80.",
  ],
  "us-ca-sb-1047-2024": [
    "The enrolled text was vetoed on 29 September 2024. It never became law, never commenced, and supplies historical proposal comparisons only.",
  ],
  "us-co-sb26-189-admt-2026": [
    "SB 26-189 repealed and reenacted the earlier Part 17 lineage. The 2024 SB 24-205 text is not the current forward-looking compliance version.",
    "Most principal duties apply to consequential decisions made on or after 1 January 2027, while identified provisions or subdivisions took effect on passage on 14 May 2026; the reader must use the unit-level applicability record.",
  ],
  "us-nist-ai-rmf-1-0": [
    "AI RMF 1.0 is voluntary, non-binding, and law- and regulation-agnostic; a mapped outcome does not itself establish compliance with any legal regime.",
    "NIST is revising the framework, but the revision process, Playbook, and Generative AI Profile do not silently replace the published 1.0 core corpus.",
    "Identified ISO- and OECD-derived material incorporated by NIST is excluded from the project's license and from any blanket public-domain claim.",
  ],
};

const rightsBoundaryOverrides = {
  "br-pl-2338-2023-ai-bill": {
    sourceTextStatus: "official-act-excluded-from-copyright-protection-under-Brazilian-law",
    projectLicenseBoundary: "official-Portuguese-bill-text-excluded-from-project-CC-BY-license-project-English-reference-licensed-CC-BY-4.0",
    note: "The Portuguese legislative text is reproduced as an official act under Lei nº 9.610/1998 Article 8(IV). The separately labelled project English reference, titles, summaries, classifications and mappings are licensed under CC BY 4.0 and have no legal effect.",
  },
  "id-pdp-law-2022": {
    sourceTextStatus: "official-Indonesian-government-edict-controlling-text",
    projectLicenseBoundary: "project-English-reference-only-licensed-CC-BY-4.0",
    note: "CC BY 4.0 applies to the separately labelled project-authored English reference, not to the controlling Indonesian Gazette text or Constitutional Court decision.",
  },
  "tw-executive-yuan-generative-ai-guidelines-2023": {
    sourceTextStatus: "official-Traditional-Chinese-guidance-under-recorded-government-open-data-terms",
    projectLicenseBoundary: "project-English-reference-only-licensed-CC-BY-4.0",
    note: "The source-language guidance retains the Government Open Data License boundary recorded on each node. The separately labelled project English reference is licensed under CC BY 4.0 and has no legal effect.",
  },
  "jp-appi": {
    sourceTextStatus: "authoritative-e-Gov-Japanese-law-and-versioned-JLT-government-reference",
    projectLicenseBoundary: "APPI-changed-unit-and-supplement-project-English-references-only-licensed-CC-BY-4.0",
    note: "CC BY 4.0 applies only to the 36 project-authored APPI English references: 13 changed main Articles, two changed appended tables and 21 supplementary-provision blocks. The authoritative Japanese text and 172 verified-equivalent JLT government references retain their recorded source terms.",
  },
  "vn-personal-data-protection-law-2025": {
    sourceTextStatus: "official-Vietnamese-government-edict-controlling-text",
    projectLicenseBoundary: "project-English-reference-only-licensed-CC-BY-4.0",
    note: "CC BY 4.0 applies only to the nonofficial project English reference; the signed Vietnamese text remains controlling.",
  },
  "vn-pdpl-implementing-decree-356-2025": {
    sourceTextStatus: "official-Vietnamese-government-edict-controlling-text",
    projectLicenseBoundary: "project-English-reference-only-licensed-CC-BY-4.0",
    note: "CC BY 4.0 applies only to the nonofficial project English references for the 42 Articles and 13 forms; the signed Vietnamese text remains controlling.",
  },
  "vn-personal-data-protection-decree-13-2023": {
    sourceTextStatus: "official-repealed-Vietnamese-government-edict-historical-text",
    projectLicenseBoundary: "project-English-reference-only-licensed-CC-BY-4.0",
    note: "CC BY 4.0 applies only to the nonofficial project English reference aligned to the stored historical version; the Vietnamese text controls for its former effective period.",
  },
  "us-ca-sb-1047-2024": {
    sourceTextStatus: "California-legislative-information-public-domain-record",
    projectLicenseBoundary: "official-enrolled-bill-text-not-relicensed-as-project-editorial-content",
    note: "The enrolled bill text and status record are attributed to California Legislative Information under its public-domain statement. Project-authored summaries and mappings remain separately licensed editorial material.",
  },
  "us-co-sb26-189-admt-2026": {
    sourceTextStatus: "official-state-session-law-government-edict",
    projectLicenseBoundary: "official-Colorado-session-law-text-excluded-from-project-CC-BY-license",
    note: "The current session-law text is reproduced as an official enactment with source attribution and is not relicensed under the project's editorial-data license. Project-authored summaries and mappings remain separate.",
  },
  "us-nist-ai-rmf-1-0": {
    sourceTextStatus: "US-government-authored-NIST-technical-series-with-third-party-exclusions",
    projectLicenseBoundary: "identified-third-party-material-excluded-from-project-license-and-public-domain-claim",
    note: "U.S. Government-authored NIST material is subject to 17 U.S.C. § 105 and NIST's worldwide reuse terms. Cited or adapted ISO/OECD and other third-party material remains separately protected and excluded from the project license.",
  },
  "ca-bill-c-27-aida-2022-lapsed": {
    sourceTextStatus: "unenacted-Parliamentary-bill-permission-not-established",
    projectLicenseBoundary: "source-linked-only-complete-bill-text-not-redistributed",
    note: "Because the proposal never became an enactment and permission for public redistribution has not been established, the public aggregate contains no complete AIDA bill corpus.",
  },
};

function englishProfile(instrument) {
  let profile;
  if (englishOverrides[instrument.id]) {
    profile = englishOverrides[instrument.id];
  } else if (/^en(?:-|$)/i.test(instrument.textAvailability.language)) {
    profile = {
      status: "official-or-original-english-source",
      note: "The indexed source is available in English; legal effect and completeness still follow the instrument's source and version notes.",
    };
  } else if (instrument.referenceTranslationSource) {
    profile = {
      status: "official-or-government-reference-translation-linked",
      note: "A separately identified English translation is linked. The authoritative original-language text and amendment record control version-sensitive research.",
    };
  } else {
    profile = {
      status: "no-stored-English-legal-text",
      note: "No complete current English legal text is stored. The English reader shows an explicit coverage notice, never a concept mapping or editorial summary in place of the law; the original official source remains linked.",
    };
  }
  const computed = englishCoverageByInstrument.get(instrument.id);
  return computed
    ? {
        ...profile,
        coverage: {
          translatedUnitCount: computed.storedEnglishUnitCount,
          currentAlignedUnitCount: computed.currentAlignedEnglishUnitCount,
          temporallyMismatchedUnitCount:
            computed.temporallyMismatchedEnglishUnitCount,
          totalUnitCount: computed.totalUnitCount,
          completeness: computed.coverageStatus,
        },
      }
    : profile;
}

function sourceRecords(instrument) {
  const candidates = [
    ["primary-current-record", instrument.source],
    ["companion-or-implementation-record", instrument.supportingSource],
    ["amendment-or-lifecycle-record", instrument.amendmentSource],
    ["official-original-language-record", instrument.originalLanguageSource],
    ["english-translation-or-reference", instrument.referenceTranslationSource],
  ];
  const seen = new Set();
  return candidates.flatMap(([role, record]) => {
    if (!record || seen.has(record.url)) return [];
    seen.add(record.url);
    return [{ role, ...record }];
  });
}

const audits = instruments.map((instrument) => {
  const localProvisions = provisions.filter(
    (provision) => provision.instrumentId === instrument.id,
  );
  const storedCount = localProvisions.filter(
    (provision) => provision.textAvailability.stored,
  ).length;
  const coverage = coverageOverrides[instrument.id] ?? {
    mode: storedCount
      ? "selected-source-text-and-index"
      : localProvisions.length
        ? "selected-provision-index"
        : "metadata-only",
    localUnitCount: localProvisions.length,
    statement: storedCount
      ? `${storedCount} selected source-text record(s) and ${localProvisions.length} indexed provision node(s) are stored; this is not a complete local corpus of the instrument.`
      : localProvisions.length
        ? `${localProvisions.length} selected provision or framework node(s) are stored as source-linked editorial summaries; the complete official text is not copied locally.`
        : "Only instrument-level metadata and official source links are stored; no local provision corpus is claimed.",
  };
  const jurisdictionLanguage =
    authoritativeLanguageOverrides[instrument.id] ??
    languageProfiles[instrument.jurisdictionId] ?? {
      languages: [instrument.textAvailability.language],
      note: "The language and authority boundary follows the cited issuing source and the instrument-specific text-availability note.",
    };

  return {
    id: `audit-${instrument.id}`,
    instrumentId: instrument.id,
    reviewedOn: reviewedOnOverrides[instrument.id] ?? reviewedOn,
    reviewLevel:
      reviewLevelOverrides[instrument.id] ??
      "primary-source-metadata-and-anchor-review",
    lifecycleFinding: instrument.statusNote,
    versionFinding: instrument.version,
    authoritativeLanguage: jurisdictionLanguage,
    ...(localIndexLanguageOverrides[instrument.id]
      ? { localIndexLanguage: localIndexLanguageOverrides[instrument.id] }
      : {}),
    englishAvailability: englishProfile(instrument),
    localCoverage: coverage,
    ...(rightsBoundaryOverrides[instrument.id]
      ? { rightsBoundary: rightsBoundaryOverrides[instrument.id] }
      : {}),
    sources: sourceRecords(instrument),
    caveats: [
      instrument.textAvailability.note,
      ...(instrumentCaveats[instrument.id] ?? []),
    ],
  };
});

await writeFile(
  resolve(dataRoot, "source-audit.json"),
  `${JSON.stringify(audits, null, 2)}\n`,
);

console.log(`source-audit.json: ${audits.length} instrument audits`);
