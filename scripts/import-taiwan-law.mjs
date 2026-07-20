#!/usr/bin/env node

/**
 * Import complete, Article-level bilingual corpora for selected Taiwan laws.
 *
 * Sources are limited to the official National Science and Technology Council
 * and Ministry of Justice legal databases. Traditional Chinese is the
 * controlling text. English is retained exactly as the government's reference
 * translation and is never filled in with an editorial translation.
 *
 * The MOJ's current PDPA consolidation includes amendments promulgated on
 * 11 November 2025 whose commencement date has not been set. For every affected
 * Article, the generated record identifies the displayed text as future text.
 * Where an existing Article remains effective, its current Traditional-Chinese
 * text is also captured from the official old-version page linked by the MOJ.
 */

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataRoot = resolve(root, "data/v2");

const USER_AGENT =
  "global-ai-data-regulation-map/0.1 (+https://github.com/EtonMu/global-ai-data-regulation-map)";

const AI_ACT = {
  instrumentId: "tw-ai-basic-act-2026",
  output: "tw-ai-basic-act-2026-articles.json",
  idPrefix: "tw-ai-basic-act-2026-art-",
  expectedIdentifiers: Array.from({ length: 20 }, (_, index) => String(index + 1)),
  originalSource: "https://law.nstc.gov.tw/LawContent.aspx?id=GL000592&kw=",
  translationSource: "https://law.nstc.gov.tw/EngLawContent.aspx?id=10099&lan=E",
  originalSourceLabel:
    "National Science and Technology Council — official Traditional Chinese text",
  translationSourceLabel:
    "National Science and Technology Council — official English reference translation",
  sourceVersion: {
    officialTitle: "人工智慧基本法",
    englishTitle: "Artificial Intelligence Basic Act",
    promulgationNumber: "華總一義字第11500001671號",
    promulgatedOn: "2026-01-14",
    effectiveFrom: "2026-01-14",
    versionNote:
      "Promulgated on 14 January 2026 and effective on the date of promulgation. The official Traditional Chinese text controls; the NSTC English text is an official reference translation.",
  },
};

const PDPA_IDENTIFIERS = [
  "1",
  "1-1",
  "1-2",
  ...Array.from({ length: 19 }, (_, index) => String(index + 2)),
  "20-1",
  "21",
  "21-1",
  "21-2",
  "21-3",
  "21-4",
  "21-5",
  ...Array.from({ length: 30 }, (_, index) => String(index + 22)),
  "51-1",
  "52",
  "53",
  "53-1",
  "54",
  "55",
  "56",
];

const PDPA = {
  instrumentId: "tw-personal-data-protection-act",
  output: "tw-personal-data-protection-act-articles.json",
  idPrefix: "tw-personal-data-protection-act-art-",
  expectedIdentifiers: PDPA_IDENTIFIERS,
  originalSource: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021",
  translationSource:
    "https://law.moj.gov.tw/ENG/LawClass/LawAll.aspx?pcode=I0050021",
  currentOriginalSource:
    "https://law.moj.gov.tw/LawClass/LawOldVer.aspx?pcode=I0050021",
  originalSourceLabel:
    "Ministry of Justice Laws and Regulations Database — official Traditional Chinese consolidation",
  translationSourceLabel:
    "Ministry of Justice Laws and Regulations Database — official English reference translation",
  currentOriginalSourceLabel:
    "Ministry of Justice Laws and Regulations Database — official current-effective old-version text (amended 31 May 2023)",
  sourceVersion: {
    officialTitle: "個人資料保護法",
    englishTitle: "Personal Data Protection Act",
    latestAmendedOn: "2025-11-11",
    currentEffectiveBaselineAmendedOn: "2023-05-31",
    versionNote:
      "The official latest consolidation displays the amendments promulgated on 11 November 2025. Their effective date remains to be determined by the Executive Yuan. The MOJ-linked old-version page dated 31 May 2023 supplies the current-effective baseline for existing provisions affected by the uncommenced package.",
  },
};

const PDPA_2025_AMENDED = new Set([
  "1-1",
  "12",
  "18",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "41",
  "47",
  "48",
  "49",
  "52",
  "53",
  "55",
]);

const PDPA_2025_ADDED = new Set([
  "1-2",
  "20-1",
  "21-1",
  "21-2",
  "21-3",
  "21-4",
  "21-5",
  "51-1",
  "53-1",
]);

const PDPA_2025_DELETED = new Set(["27"]);
const PDPA_2016_VERSION = new Set([
  "6",
  "7",
  "8",
  "11",
  "15",
  "16",
  "19",
  "20",
  "41",
  "45",
  "53",
  "54",
]);

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/gi, (_, entity) => {
      const replacements = {
        nbsp: " ",
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
      };
      return replacements[entity.toLowerCase()];
    });
}

function normalizedText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ""))
    .replace(/[\u00a0\u3000]/g, " ")
    .replace(/[\t\r\n ]+/g, " ")
    .trim();
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function assertIdentifiers(label, articles, expectedIdentifiers) {
  const actual = articles.map((article) => article.articleNumber);
  if (JSON.stringify(actual) !== JSON.stringify(expectedIdentifiers)) {
    throw new Error(
      `${label}: expected ${expectedIdentifiers.length} Article identifiers ` +
        `${expectedIdentifiers.join(", ")}; found ${actual.join(", ")}`,
    );
  }
}

function extractFirst(html, pattern, label) {
  const match = html.match(pattern);
  if (!match) throw new Error(`Could not locate ${label} in official source`);
  return match[1];
}

function parseNstcChinese(html) {
  const body = extractFirst(
    html,
    /<div\s+id=["']ctl00_cp_content_divLawContent08["'][^>]*>([\s\S]*?)<\/div>/i,
    "NSTC Traditional-Chinese legal text",
  );
  const lines = decodeEntities(body.replace(/<br\s*\/?\s*>/gi, "\n"))
    .replace(/<[^>]+>/g, "")
    .split(/\n/u)
    .map((line) =>
      line
        .replace(/[\u00a0\u3000]/g, " ")
        .replace(/[\t\r ]+/g, " ")
        .trim(),
    );

  const articles = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(/^第\s*(\d+)\s*條$/u);
    if (heading) {
      current = {
        articleNumber: heading[1],
        originalTitle: `第 ${heading[1]} 條`,
        paragraphs: [],
      };
      articles.push(current);
      continue;
    }
    if (current && line) current.paragraphs.push(line);
  }
  return articles;
}

function parseNstcEnglish(html) {
  const body = extractFirst(
    html,
    /<tr\s+id=["']ctl00_cp_content_trAnnEContent["'][^>]*>[\s\S]*?<td\s+class=["']ClearCss["'][^>]*>([\s\S]*?)<\/td>\s*<\/tr>/i,
    "NSTC English legal text",
  );
  const lines = decodeEntities(
    body
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split(/\n/u)
    .map((line) =>
      line
        .replace(/[\u00a0\u3000]/g, " ")
        .replace(/[\t\r ]+/g, " ")
        .trim(),
    );

  const articles = [];
  let current = null;
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    const heading = text.match(/^Article\s+(\d+)\s*$/u);
    if (heading) {
      current = { articleNumber: heading[1], paragraphs: [] };
      articles.push(current);
      continue;
    }
    if (current) current.paragraphs.push(text);
  }
  return articles;
}

function extractHeadings(html, language) {
  const headings = [];
  const pattern = /<div\s+class=["']h3\s+char-(2|3)["'][^>]*>([\s\S]*?)<\/div>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = normalizedText(match[2]);
    const isSection = match[1] === "3";
    headings.push({ index: match.index, title, isSection, language });
  }
  return headings;
}

function closestHeadings(headings, index) {
  let chapter = null;
  let section = null;
  for (const heading of headings) {
    if (heading.index > index) break;
    if (heading.isSection) section = heading;
    else {
      chapter = heading;
      section = null;
    }
  }
  return { chapter, section };
}

function parseMojChinese(html) {
  const headings = extractHeadings(html, "zh-Hant-TW");
  const articles = [];
  const startPattern =
    /<div\s+class=["']row["']><div\s+class=["']col-no["']>[\s\S]*?<a\s+href=["'][^"']*flno=([^&"']+)[^"']*["']\s+name=["']([^"']+)["'][^>]*>\s*第\s*([^<]+?)\s*條\s*<\/a><\/div><div\s+class=["']col-data["']><div\s+class=["']law-article["']>/gi;
  const starts = [...html.matchAll(startPattern)];
  for (const [index, match] of starts.entries()) {
    const articleNumber = decodeEntities(match[2]).trim();
    const contentStart = match.index + match[0].length;
    const contentEnd = starts[index + 1]?.index ?? html.length;
    const articleHtml = html.slice(contentStart, contentEnd);
    const paragraphs = [...articleHtml.matchAll(/<div\s+class=["'][^"']*line-[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)]
      .map((paragraph) => normalizedText(paragraph[1]))
      .filter(Boolean);
    const context = closestHeadings(headings, match.index);
    articles.push({
      articleNumber,
      originalTitle: `第 ${decodeEntities(match[3]).trim()} 條`,
      paragraphs,
      chapterTitle: context.chapter?.title ?? null,
      sectionTitle: context.section?.title ?? null,
    });
  }
  return articles;
}

function parseMojEnglish(html) {
  const headings = extractHeadings(html, "en");
  const articles = [];
  const pattern =
    /<div\s+class=["']row["']><div\s+class=["']col-no["']>\s*Article\s+([0-9]+(?:-[0-9]+)?)\s*<\/div><div\s+class=["']col-data["']>([\s\S]*?)<\/div>\s*<\/div>/gi;
  for (const match of html.matchAll(pattern)) {
    const paragraphs = match[2]
      .split(/<br\s*\/?\s*>/gi)
      .map((paragraph) => normalizedText(paragraph))
      .filter(Boolean);
    const context = closestHeadings(headings, match.index);
    articles.push({
      articleNumber: match[1],
      paragraphs,
      chapterTitle: context.chapter?.title ?? null,
      sectionTitle: context.section?.title ?? null,
    });
  }
  return articles;
}

function parseMojOldChinese(html) {
  const articles = [];
  const pattern =
    /<div\s+class=["']row["']><div\s+class=["']col-no["']>\s*第\s*([0-9]+(?:-[0-9]+)?)\s*條\s*<\/div><div\s+class=["'][^"']*col-data[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  for (const match of html.matchAll(pattern)) {
    const fullText = decodeEntities(match[2].replace(/<br\s*\/?\s*>/gi, "\n"))
      .replace(/<[^>]+>/g, "")
      .split(/\r?\n/u)
      .map((line) => line.replace(/[\u00a0\u3000\t\r ]+/g, "").trim())
      .filter(Boolean)
      .join("");
    articles.push({
      articleNumber: match[1],
      originalTitle: `第 ${match[1]} 條`,
      paragraphs: fullText ? [fullText] : [],
    });
  }
  return articles;
}

function alignment(originalParagraphs, englishParagraphs, sourceLayoutNote) {
  const isParagraphAligned = originalParagraphs.length === englishParagraphs.length;
  return {
    level: isParagraphAligned ? "paragraph" : "article",
    status: isParagraphAligned
      ? "official-source-units-count-aligned"
      : "article-aligned-source-layout-differs",
    originalUnitCount: originalParagraphs.length,
    englishUnitCount: englishParagraphs.length,
    note: isParagraphAligned
      ? "The official source exposes the same number of textual units in both languages. Units are retained in source order; no translation was generated."
      : sourceLayoutNote,
  };
}

function chapterId(instrumentId, title) {
  if (!title) return null;
  const match = title.match(/(?:第\s*)?([一二三四五六七八九十]+|[IVX]+|\d+)(?:\s*章|\b)/iu);
  const token = match?.[1] ?? title;
  return `${instrumentId}-chapter-${token
    .toLowerCase()
    .replace(/[^0-9a-z\u3400-\u9fff]+/gu, "-")}`;
}

function sectionId(instrumentId, chapterTitle, sectionTitle) {
  if (!sectionTitle) return null;
  const match = sectionTitle.match(/(?:第\s*)?([一二三四五六七八九十]+|[IVX]+|\d+)(?:\s*節|\b)/iu);
  const token = match?.[1] ?? sectionTitle;
  return `${chapterId(instrumentId, chapterTitle)}-section-${token
    .toLowerCase()
    .replace(/[^0-9a-z\u3400-\u9fff]+/gu, "-")}`;
}

function pdpaCurrentAppliesFrom(articleNumber) {
  if (articleNumber === "48" || articleNumber === "56") return "2023-05-31";
  if (PDPA_2016_VERSION.has(articleNumber)) return "2016-03-15";
  return "2012-10-01";
}

function pdpaApplicability(articleNumber, currentByNumber) {
  const commonFuture = {
    displayedVersion: "promulgated-2025-text",
    promulgatedOn: "2025-11-11",
    appliesFrom: null,
    commencementCondition: "Effective date to be determined by the Executive Yuan",
  };

  if (PDPA_2025_ADDED.has(articleNumber)) {
    return {
      legalEffectStatus: "promulgated-new-provision-not-in-force",
      applicability: {
        ...commonFuture,
        currentLawStatus: "no-current-effective-counterpart",
      },
      currentEffectiveVersion: null,
    };
  }

  if (articleNumber === "1-1") {
    return {
      legalEffectStatus: "promulgated-amended-provision-not-in-force",
      applicability: {
        ...commonFuture,
        currentLawStatus: "no-current-effective-counterpart",
        historyNote:
          "Article 1-1 was first promulgated on 31 May 2023 without a commencement date and was amended again on 11 November 2025; it has not entered into force.",
      },
      currentEffectiveVersion: null,
    };
  }

  if (PDPA_2025_DELETED.has(articleNumber)) {
    const current = currentByNumber.get(articleNumber);
    if (!current || current.fullText === "（刪除）") {
      throw new Error(`PDPA Article ${articleNumber}: missing current-effective text`);
    }
    return {
      legalEffectStatus: "promulgated-deletion-not-in-force",
      applicability: {
        ...commonFuture,
        currentLawStatus: "existing-provision-remains-in-force-until-commencement",
      },
      currentEffectiveVersion: current,
    };
  }

  if (PDPA_2025_AMENDED.has(articleNumber)) {
    const current = currentByNumber.get(articleNumber);
    if (!current) {
      throw new Error(`PDPA Article ${articleNumber}: missing current-effective text`);
    }
    return {
      legalEffectStatus: "promulgated-amendment-not-in-force",
      applicability: {
        ...commonFuture,
        currentLawStatus: "prior-version-remains-in-force-until-commencement",
      },
      currentEffectiveVersion: current,
    };
  }

  return {
    legalEffectStatus: "in-force",
    applicability: {
      displayedVersion: "current-effective-text",
      appliesFrom: pdpaCurrentAppliesFrom(articleNumber),
      currentLawStatus: "in-force",
    },
    currentEffectiveVersion: null,
  };
}

function buildAiAct(originalHtml, translationHtml, retrievedOn) {
  const original = parseNstcChinese(originalHtml);
  const english = parseNstcEnglish(translationHtml);
  assertIdentifiers("Taiwan AI Basic Act Chinese", original, AI_ACT.expectedIdentifiers);
  assertIdentifiers("Taiwan AI Basic Act English", english, AI_ACT.expectedIdentifiers);
  const englishByNumber = new Map(english.map((article) => [article.articleNumber, article]));

  return original.map((article) => {
    const translation = englishByNumber.get(article.articleNumber);
    const fullText = article.paragraphs.join("\n\n");
    const englishFullText = translation.paragraphs.join("\n\n");
    if (!fullText || !englishFullText) {
      throw new Error(`Taiwan AI Basic Act Article ${article.articleNumber} is empty`);
    }
    return {
      id: `${AI_ACT.idPrefix}${article.articleNumber}`,
      instrumentId: AI_ACT.instrumentId,
      articleNumber: article.articleNumber,
      label: `Article ${article.articleNumber}`,
      originalTitle: article.originalTitle,
      title: `Article ${article.articleNumber}`,
      summary:
        "Complete official Traditional-Chinese Article text and the aligned official English reference translation are stored.",
      chapter: null,
      section: null,
      paragraphs: article.paragraphs,
      fullText,
      language: "zh-Hant-TW",
      translations: {
        en: {
          title: `Article ${article.articleNumber}`,
          paragraphs: translation.paragraphs,
          fullText: englishFullText,
          language: "en",
          status: "official-reference-translation",
          authorityNote:
            "Published by the National Science and Technology Council as an English translation. The official Traditional Chinese text controls.",
          source: AI_ACT.translationSource,
          sourceLabel: AI_ACT.translationSourceLabel,
          contentSha256: sha256(englishFullText),
        },
      },
      alignment: alignment(
        article.paragraphs,
        translation.paragraphs,
        "The NSTC Chinese page combines some statutory paragraphs into one HTML line while the official English page separates them into paragraph elements. The texts are aligned at Article level; source units are not split editorially.",
      ),
      legalEffectStatus: "in-force",
      appliesFrom: "2026-01-14",
      textAvailability: "full-bilingual",
      source: AI_ACT.originalSource,
      sourceFragment: AI_ACT.originalSource,
      sourceLabel: AI_ACT.originalSourceLabel,
      retrievedOn,
      sourceVersion: AI_ACT.sourceVersion,
      contentSha256: sha256(fullText),
    };
  });
}

function buildPdpa(originalHtml, translationHtml, currentHtml, retrievedOn) {
  const original = parseMojChinese(originalHtml);
  const english = parseMojEnglish(translationHtml);
  const current = parseMojOldChinese(currentHtml);
  assertIdentifiers("Taiwan PDPA Chinese consolidation", original, PDPA.expectedIdentifiers);
  assertIdentifiers("Taiwan PDPA English consolidation", english, PDPA.expectedIdentifiers);

  const englishByNumber = new Map(english.map((article) => [article.articleNumber, article]));
  const currentByNumber = new Map(
    current.map((article) => {
      const fullText = article.paragraphs.join("\n\n");
      return [
        article.articleNumber,
        {
          paragraphs: article.paragraphs,
          fullText,
          language: "zh-Hant-TW",
          appliesFrom: pdpaCurrentAppliesFrom(article.articleNumber),
          source: PDPA.currentOriginalSource,
          sourceLabel: PDPA.currentOriginalSourceLabel,
          sourceVersionAmendedOn: "2023-05-31",
          englishTranslationAvailability:
            "No official old-version English full-text endpoint is provided by the MOJ database; no translation is supplied here.",
          contentSha256: sha256(fullText),
        },
      ];
    }),
  );

  return original.map((article) => {
    const translation = englishByNumber.get(article.articleNumber);
    const fullText = article.paragraphs.join("\n\n");
    const englishFullText = translation.paragraphs.join("\n\n");
    if (!fullText || !englishFullText) {
      throw new Error(`Taiwan PDPA Article ${article.articleNumber} is empty`);
    }
    const effect = pdpaApplicability(article.articleNumber, currentByNumber);
    const chineseChapter = article.chapterTitle;
    const englishChapter = translation.chapterTitle;
    const chineseSection = article.sectionTitle;
    const englishSection = translation.sectionTitle;
    return {
      id: `${PDPA.idPrefix}${article.articleNumber}`,
      instrumentId: PDPA.instrumentId,
      articleNumber: article.articleNumber,
      label: `Article ${article.articleNumber}`,
      originalTitle: article.originalTitle,
      title: `Article ${article.articleNumber}`,
      summary:
        "Complete official Traditional-Chinese consolidation text and the aligned official English reference translation are stored; applicability metadata identifies uncommenced amendments.",
      chapter: chineseChapter
        ? {
            id: chapterId(PDPA.instrumentId, chineseChapter),
            label: englishChapter ?? chineseChapter,
            title: englishChapter ?? chineseChapter,
            originalTitle: chineseChapter,
          }
        : null,
      section: chineseSection
        ? {
            id: sectionId(PDPA.instrumentId, chineseChapter, chineseSection),
            label: englishSection ?? chineseSection,
            title: englishSection ?? chineseSection,
            originalTitle: chineseSection,
          }
        : null,
      paragraphs: article.paragraphs,
      fullText,
      language: "zh-Hant-TW",
      translations: {
        en: {
          title: `Article ${article.articleNumber}`,
          paragraphs: translation.paragraphs,
          fullText: englishFullText,
          language: "en",
          status: "official-reference-translation",
          authorityNote:
            "Published by the Ministry of Justice Laws and Regulations Database as an English translation. The official Traditional Chinese text controls.",
          source: PDPA.translationSource,
          sourceLabel: PDPA.translationSourceLabel,
          contentSha256: sha256(englishFullText),
        },
      },
      alignment: alignment(
        article.paragraphs,
        translation.paragraphs,
        "The official Chinese and English pages expose different HTML unit boundaries for this Article. The texts are aligned at Article level and retain their respective source order without editorial resegmentation.",
      ),
      legalEffectStatus: effect.legalEffectStatus,
      appliesFrom: effect.applicability.appliesFrom,
      applicability: effect.applicability,
      currentEffectiveVersion: effect.currentEffectiveVersion,
      textAvailability: "full-bilingual-latest-consolidation",
      source: PDPA.originalSource,
      sourceFragment: `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=I0050021&flno=${article.articleNumber}`,
      sourceLabel: PDPA.originalSourceLabel,
      retrievedOn,
      sourceVersion: PDPA.sourceVersion,
      contentSha256: sha256(fullText),
    };
  });
}

function parseArgs(argv) {
  const values = { instrument: "all", retrievedOn: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--instrument") values.instrument = argv[++index];
    else if (argv[index] === "--retrieved-on") values.retrievedOn = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.retrievedOn ?? "")) {
    throw new Error("--retrieved-on must be an explicit ISO date (YYYY-MM-DD)");
  }
  if (!["all", AI_ACT.instrumentId, PDPA.instrumentId].includes(values.instrument)) {
    throw new Error(`Unknown instrument: ${values.instrument}`);
  }
  return values;
}

async function fetchOfficial(url, label) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${label}: official source returned HTTP ${response.status}`);
  return response.text();
}

async function writeCorpus(config, articles) {
  await writeFile(
    resolve(dataRoot, config.output),
    `${JSON.stringify(articles, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `${config.instrumentId}: wrote ${articles.length} official bilingual Articles to data/v2/${config.output}`,
  );
}

async function main() {
  const { instrument, retrievedOn } = parseArgs(process.argv.slice(2));

  if (instrument === "all" || instrument === AI_ACT.instrumentId) {
    const [originalHtml, translationHtml] = await Promise.all([
      fetchOfficial(AI_ACT.originalSource, "Taiwan AI Basic Act Chinese"),
      fetchOfficial(AI_ACT.translationSource, "Taiwan AI Basic Act English"),
    ]);
    await writeCorpus(
      AI_ACT,
      buildAiAct(originalHtml, translationHtml, retrievedOn),
    );
  }

  if (instrument === "all" || instrument === PDPA.instrumentId) {
    const [originalHtml, translationHtml, currentHtml] = await Promise.all([
      fetchOfficial(PDPA.originalSource, "Taiwan PDPA Chinese"),
      fetchOfficial(PDPA.translationSource, "Taiwan PDPA English"),
      fetchOfficial(PDPA.currentOriginalSource, "Taiwan PDPA current-effective Chinese"),
    ]);
    await writeCorpus(
      PDPA,
      buildPdpa(originalHtml, translationHtml, currentHtml, retrievedOn),
    );
  }
}

await main();
