#!/usr/bin/env node

/**
 * Import complete Article-level Chinese text from official government pages.
 *
 * The importer deliberately does not translate statutory text. Existing curated
 * English reference translations remain in provisions.json and are overlaid by
 * stable Article id in the UI. Every run verifies the expected sequential
 * Article count before replacing a generated corpus file.
 */

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dataRoot = resolve(root, "data/v2");

const configs = {
  "cn-pipl": {
    output: "cn-pipl-articles.json",
    source: "https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm",
    sourceLabel:
      "Cyberspace Administration of China — official republication of the NPC text",
    canonicalSource:
      "https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html",
    bodyKind: "cac-body-label",
    expectedArticleCount: 74,
    idPrefix: "cn-pipl-art-",
    appliesFrom: "2021-11-01",
    sourceVersion: {
      officialTitle: "中华人民共和国个人信息保护法",
      adoptedOn: "2021-08-20",
      publishedOn: "2021-08-20",
      effectiveFrom: "2021-11-01",
      versionNote:
        "Text adopted by the 30th Session of the Standing Committee of the 13th National People's Congress on 20 August 2021; effective 1 November 2021.",
    },
    chapters: [
      [1, 12, 1, "General Provisions"],
      [13, 37, 2, "Rules for Processing Personal Information"],
      [38, 43, 3, "Rules on the Cross-border Provision of Personal Information"],
      [44, 50, 4, "Rights of Individuals in Personal Information Processing Activities"],
      [51, 59, 5, "Obligations of Personal Information Handlers"],
      [60, 65, 6, "Departments Performing Personal Information Protection Duties"],
      [66, 71, 7, "Legal Liability"],
      [72, 74, 8, "Supplementary Provisions"],
    ],
    sections: [
      [13, 27, 2, 1, "General Provisions"],
      [28, 32, 2, 2, "Rules for Processing Sensitive Personal Information"],
      [33, 37, 2, 3, "Special Provisions on Processing by State Organs"],
    ],
  },
  "cn-network-data-regulations": {
    output: "cn-network-data-regulations-articles.json",
    source: "https://app.www.gov.cn/govdata/gov/202409/30/520076/article.html",
    sourceLabel: "State Council of the People's Republic of China",
    bodyKind: "govcn-article",
    expectedArticleCount: 64,
    idPrefix: "cn-network-data-reg-art-",
    appliesFrom: "2025-01-01",
    sourceVersion: {
      officialTitle: "网络数据安全管理条例",
      instrumentNumber: "中华人民共和国国务院令第790号",
      adoptedOn: "2024-08-30",
      publishedOn: "2024-09-24",
      effectiveFrom: "2025-01-01",
      versionNote:
        "State Council Order No. 790, adopted 30 August 2024, promulgated 24 September 2024, effective 1 January 2025.",
    },
    chapters: [
      [1, 7, 1, "General Provisions"],
      [8, 20, 2, "General Requirements"],
      [21, 28, 3, "Personal Information Protection"],
      [29, 33, 4, "Important Data Security"],
      [34, 39, 5, "Cross-border Network Data Security Management"],
      [40, 46, 6, "Obligations of Network Platform Service Providers"],
      [47, 54, 7, "Supervision and Administration"],
      [55, 61, 8, "Legal Liability"],
      [62, 64, 9, "Supplementary Provisions"],
    ],
    sections: [],
  },
  "cn-generative-ai-measures": {
    output: "cn-generative-ai-measures-articles.json",
    source: "https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm",
    sourceLabel:
      "Cyberspace Administration of China — official Order No. 15 publication",
    bodyKind: "cac-body-label",
    expectedArticleCount: 24,
    idPrefix: "cn-genai-art-",
    appliesFrom: "2023-08-15",
    sourceVersion: {
      officialTitle: "生成式人工智能服务管理暂行办法",
      instrumentNumber: "国家互联网信息办公室等七部门令第15号",
      adoptedOn: "2023-05-23",
      publishedOn: "2023-07-13",
      effectiveFrom: "2023-08-15",
      versionNote:
        "Order No. 15, approved by the Cyberspace Administration of China on 23 May 2023, promulgated by seven departments on 10 July 2023, published 13 July 2023, effective 15 August 2023.",
    },
    chapters: [
      [1, 4, 1, "General Provisions"],
      [5, 8, 2, "Technology Development and Governance"],
      [9, 15, 3, "Service Specifications"],
      [16, 21, 4, "Supervision, Inspection, and Legal Liability"],
      [22, 24, 5, "Supplementary Provisions"],
    ],
    sections: [],
  },
};

const chineseDigits = new Map([
  ["零", 0],
  ["〇", 0],
  ["一", 1],
  ["二", 2],
  ["两", 2],
  ["三", 3],
  ["四", 4],
  ["五", 5],
  ["六", 6],
  ["七", 7],
  ["八", 8],
  ["九", 9],
]);

function chineseNumber(value) {
  if (value.includes("百")) {
    const [hundreds, remainder = ""] = value.split("百");
    return (chineseDigits.get(hundreds) ?? 1) * 100 + chineseNumber(remainder);
  }
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (tens ? chineseDigits.get(tens) : 1) * 10 + (ones ? chineseDigits.get(ones) : 0);
  }
  if (!value) return 0;
  return [...value].reduce((number, digit) => number * 10 + chineseDigits.get(digit), 0);
}

function roman(number) {
  const values = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = number;
  let result = "";
  for (const [value, token] of values) {
    while (remaining >= value) {
      result += token;
      remaining -= value;
    }
  }
  return result;
}

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
  return decodeEntities(
    html
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/[\u00a0\u3000\s]+/g, " ")
      .trim(),
  );
}

function extractBody(html, kind) {
  const pattern =
    kind === "cac-body-label"
      ? /<div\s+id\s*=\s*["']?BodyLabel["']?[^>]*>([\s\S]*?)<div\s+id=["']网站群管理["']/i
      : /<article\s+class=["']artcielcont["']\s+id=["']articleins["'][^>]*>([\s\S]*?)<\/article>/i;
  const match = html.match(pattern);
  if (!match) throw new Error(`Could not locate official legal-text body (${kind})`);
  return match[1];
}

function extractParagraphs(html, kind) {
  const body = extractBody(html, kind);
  return [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normalizedText(match[1]))
    .filter(Boolean);
}

function rangeRecord(ranges, articleNumber) {
  return ranges.find(([first, last]) => articleNumber >= first && articleNumber <= last);
}

function parseArticles(instrumentId, config, html, retrievedOn) {
  const sourceParagraphs = extractParagraphs(html, config.bodyKind);
  const articles = [];
  let currentArticle = null;
  let parsedChapterNumber = null;
  let parsedSectionNumber = null;

  for (const paragraph of sourceParagraphs) {
    const chapterMatch = paragraph.match(/^第([零〇一二两三四五六七八九十百]+)章\s*(.+)$/u);
    if (chapterMatch) {
      parsedChapterNumber = chineseNumber(chapterMatch[1]);
      parsedSectionNumber = null;
      continue;
    }
    const sectionMatch = paragraph.match(/^第([零〇一二两三四五六七八九十百]+)节\s*(.+)$/u);
    if (sectionMatch) {
      parsedSectionNumber = chineseNumber(sectionMatch[1]);
      continue;
    }
    const articleMatch = paragraph.match(/^第([零〇一二两三四五六七八九十百]+)条\s*(.*)$/u);
    if (articleMatch) {
      const articleNumber = chineseNumber(articleMatch[1]);
      currentArticle = {
        articleNumber,
        originalTitle: `第${articleMatch[1]}条`,
        parsedChapterNumber,
        parsedSectionNumber,
        paragraphs: articleMatch[2] ? [articleMatch[2]] : [],
      };
      articles.push(currentArticle);
      continue;
    }
    if (currentArticle) currentArticle.paragraphs.push(paragraph);
  }

  const expectedNumbers = Array.from(
    { length: config.expectedArticleCount },
    (_, index) => index + 1,
  );
  const actualNumbers = articles.map((article) => article.articleNumber);
  if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
    throw new Error(
      `${config.source}: expected sequential Articles 1–${config.expectedArticleCount}; found ${actualNumbers.join(", ")}`,
    );
  }

  return articles.map((article) => {
    const chapter = rangeRecord(config.chapters, article.articleNumber);
    if (!chapter) throw new Error(`No chapter configured for Article ${article.articleNumber}`);
    const [, , chapterNumber, chapterTitle] = chapter;
    if (article.parsedChapterNumber !== chapterNumber) {
      throw new Error(
        `Article ${article.articleNumber}: parsed Chapter ${article.parsedChapterNumber}, expected Chapter ${chapterNumber}`,
      );
    }
    const section = rangeRecord(config.sections, article.articleNumber);
    if (section && article.parsedSectionNumber !== section[3]) {
      throw new Error(
        `Article ${article.articleNumber}: parsed Section ${article.parsedSectionNumber}, expected Section ${section[3]}`,
      );
    }
    const fullText = article.paragraphs.join("\n\n");
    if (!fullText || !/[\u3400-\u9fff]/u.test(fullText)) {
      throw new Error(`Article ${article.articleNumber} has no Chinese source text`);
    }
    return {
      id: `${config.idPrefix}${article.articleNumber}`,
      instrumentId,
      articleNumber: String(article.articleNumber),
      label: `Article ${article.articleNumber}`,
      originalTitle: article.originalTitle,
      title: `Article ${article.articleNumber}`,
      summary:
        "The complete official Chinese Article text is stored. No English translation is supplied for this Article; the default English view is an editorial coverage notice, not a translation.",
      chapter: {
        id: `${instrumentId}-chapter-${chapterNumber}`,
        label: `Chapter ${roman(chapterNumber)}`,
        title: chapterTitle,
      },
      section: section
        ? {
            id: `${instrumentId}-chapter-${section[2]}-section-${section[3]}`,
            label: `Section ${section[3]}`,
            title: section[4],
          }
        : null,
      paragraphs: article.paragraphs,
      fullText,
      language: "zh-CN",
      textAvailability: "full",
      source: config.source,
      sourceFragment: config.source,
      canonicalSource: config.canonicalSource ?? config.source,
      sourceLabel: config.sourceLabel,
      retrievedOn,
      appliesFrom: config.appliesFrom,
      sourceVersion: config.sourceVersion,
      contentSha256: createHash("sha256").update(fullText, "utf8").digest("hex"),
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
  if (values.instrument !== "all" && !configs[values.instrument]) {
    throw new Error(`Unknown instrument: ${values.instrument}`);
  }
  return values;
}

async function main() {
  const { instrument, retrievedOn } = parseArgs(process.argv.slice(2));
  const selected =
    instrument === "all"
      ? Object.entries(configs)
      : [[instrument, configs[instrument]]];

  for (const [instrumentId, config] of selected) {
    const response = await fetch(config.source, {
      headers: {
        "user-agent":
          "global-ai-data-regulation-map/0.1 (+https://github.com/EtonMu/global-ai-data-regulation-map)",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`${instrumentId}: official source returned HTTP ${response.status}`);
    }
    const html = await response.text();
    const articles = parseArticles(instrumentId, config, html, retrievedOn);
    await writeFile(
      resolve(dataRoot, config.output),
      `${JSON.stringify(articles, null, 2)}\n`,
      "utf8",
    );
    console.log(
      `${instrumentId}: wrote ${articles.length} official Chinese Articles to data/v2/${config.output}`,
    );
  }
}

await main();
