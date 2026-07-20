import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataRoot = resolve(root, "data/v2");
const reviewedOn = "2026-07-19";

const instruments = JSON.parse(
  await readFile(resolve(dataRoot, "instruments.json"), "utf8"),
);
const provisions = JSON.parse(
  await readFile(resolve(dataRoot, "provisions.json"), "utf8"),
);

const languageProfiles = {
  eu: {
    languages: ["EU official languages"],
    note: "The Official Journal versions in the EU's official languages are equally authentic; the local complete Article import uses English.",
  },
  cn: {
    languages: ["zh-CN"],
    note: "The official Chinese publication controls. Any locally stored English rendering is expressly a non-official reference translation.",
  },
  jp: {
    languages: ["ja"],
    note: "Japanese official sources control. Government English translations can lag later amendments and are reference material for version-sensitive research.",
  },
  kr: {
    languages: ["ko"],
    note: "The Korean statutory text and amendment timeline control. The government English database is useful but may represent an earlier consolidation.",
  },
  br: {
    languages: ["pt-BR"],
    note: "The current official Portuguese consolidation controls. The government English LGPD PDF is a dated translation snapshot.",
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
    note: "The official Vietnamese text controls; English navigation content is an editorial summary unless a separately identified official translation is linked.",
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

const englishOverrides = {
  "jp-appi": {
    status: "government-reference-translation-lagging",
    note: "A government English translation exists but its displayed version predates the current Japanese consolidation.",
  },
  "jp-ai-guidelines-business-1-2": {
    status: "editorial-summary-only",
    note: "The current Version 1.2 source is Japanese; the local English view is an editorial summary, not a complete translation.",
  },
  "br-lgpd-2018": {
    status: "official-translation-snapshot-lagging",
    note: "The ANPD English PDF is useful but does not include the February 2026 Portuguese consolidation change.",
  },
  "br-pl-2338-2023-ai-bill": {
    status: "editorial-summary-only",
    note: "The live legislative record and current bill text are Portuguese; no complete current official English version is claimed.",
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
    status: "authentic-bilingual-legislation",
    note: "The Hong Kong e-Legislation portal supplies the bilingual Ordinance; the interface defaults to English navigation.",
  },
  "ch-fadp-2020": {
    status: "official-non-authoritative-translation",
    note: "Fedlex supplies English for convenience, but the German, French and Italian texts are authoritative.",
  },
};

const coverageOverrides = {
  "eu-gdpr": {
    mode: "complete-article-corpus",
    localUnitCount: 99,
    statement: "All 99 operative Articles are stored from the official English EUR-Lex publication; recitals, annex material and signatures remain linked at source.",
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
};

const instrumentCaveats = {
  "eu-ai-act": [
    "The complete local Article file is the 2024 enacted text. The Digital Omnibus on AI received final Council approval on 29 June 2026 and had a final legislative text dated 8 July 2026, but no replacement consolidated corpus is claimed without an Official Journal legal-act record.",
  ],
  "ca-bill-c-27-aida-2022-lapsed": [
    "Bill C-27 lapsed on prorogation on 6 January 2025 and AIDA never became law; these nodes are retained only for legislative history and comparison.",
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
  ],
};

function englishProfile(instrument) {
  if (englishOverrides[instrument.id]) return englishOverrides[instrument.id];
  if (/^en(?:-|$)/i.test(instrument.textAvailability.language)) {
    return {
      status: "official-or-original-english-source",
      note: "The indexed source is available in English; legal effect and completeness still follow the instrument's source and version notes.",
    };
  }
  if (instrument.referenceTranslationSource) {
    return {
      status: "official-or-government-reference-translation-linked",
      note: "A separately identified English translation is linked. The authoritative original-language text and amendment record control version-sensitive research.",
    };
  }
  return {
    status: "editorial-summary-only",
    note: "No complete current official English text is claimed. The default English interface content is an editorial summary and the original official source remains linked.",
  };
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
  const jurisdictionLanguage = languageProfiles[instrument.jurisdictionId] ?? {
    languages: [instrument.textAvailability.language],
    note: "The language and authority boundary follows the cited issuing source and the instrument-specific text-availability note.",
  };

  return {
    id: `audit-${instrument.id}`,
    instrumentId: instrument.id,
    reviewedOn,
    reviewLevel: "primary-source-metadata-and-anchor-review",
    lifecycleFinding: instrument.statusNote,
    versionFinding: instrument.version,
    authoritativeLanguage: jurisdictionLanguage,
    englishAvailability: englishProfile(instrument),
    localCoverage: coverage,
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
