#!/usr/bin/env node

/**
 * Apply the authority, version, provenance, and reuse metadata for the
 * project-authored English reference translation of the current 81-Article
 * Cybersecurity Law corpus.
 *
 * The English wording already lives on the stable cn-csl-art-* records in
 * provisions.json. This annotator never translates or rewrites that wording;
 * it verifies the complete sequence and adds deterministic metadata that keeps
 * the English editorial record distinct from its official Chinese basis.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const provisionsPath = resolve(root, "data/v2/provisions.json");

const instrumentId = "cn-cybersecurity-law";
const expectedArticleCount = 81;
const versionAsOf = "2026-01-01";
const versionLabel =
  "Project-authored English reference aligned to the 81-Article Chinese consolidation amended 28 October 2025 and effective 1 January 2026";
const projectRecordUrl =
  "https://github.com/EtonMu/global-ai-data-regulation-map/blob/main/data/v2/provisions.json";
const chineseBasisUrl =
  "https://www.cac.gov.cn/2025-12/29/c_1768735112911946.htm";
const authorityNote =
  "Complete project-authored English reference translation aligned Article-by-Article to the current 81-Article Chinese consolidation effective 1 January 2026. It is an editorial navigation and study aid, not an official translation; the official Chinese text controls.";

const source = {
  url: projectRecordUrl,
  label: "Compliance Compass project-authored English reference translation record",
  accessedOn: "2026-07-20",
};

const translationBasis = {
  url: chineseBasisUrl,
  label: "Cyberspace Administration of China reproduction of the current NPC consolidated Chinese text",
  accessedOn: "2026-07-19",
  language: "zh-CN",
  versionAsOf,
};

const rights = {
  redistributable: true,
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  attribution: "Compliance Compass contributors",
  basis:
    "The English wording is original project-authored editorial material and is licensed under CC BY 4.0. It is not copied or adapted from a third-party English translation.",
};

function annotatedTranslation(provision) {
  const translation = provision.translations?.en;
  if (!translation) {
    throw new Error(`${provision.id} has no English reference translation`);
  }
  if (
    !Array.isArray(translation.paragraphs) ||
    translation.paragraphs.length === 0 ||
    translation.paragraphs.some((paragraph) => !paragraph.trim())
  ) {
    throw new Error(`${provision.id} has an empty English paragraph`);
  }
  if (translation.fullText !== translation.paragraphs.join("\n\n")) {
    throw new Error(`${provision.id} English fullText diverges from its paragraphs`);
  }

  return {
    ...translation,
    status: "reference",
    coverageStatus: "complete-current-project-reference",
    versionAsOf,
    versionLabel,
    currentTextEquivalent: true,
    source: {
      ...source,
      recordId: provision.id,
    },
    translationBasis,
    authorityNote,
    note: authorityNote,
    rights,
    contentSha256: createHash("sha256")
      .update(translation.fullText, "utf8")
      .digest("hex"),
  };
}

function annotate(provisions) {
  const cslArticles = provisions.filter(
    (provision) => provision.instrumentId === instrumentId,
  );
  if (cslArticles.length !== expectedArticleCount) {
    throw new Error(
      `Expected ${expectedArticleCount} CSL Articles; found ${cslArticles.length}`,
    );
  }
  cslArticles.forEach((provision, index) => {
    const expectedId = `cn-csl-art-${index + 1}`;
    if (provision.id !== expectedId) {
      throw new Error(`Expected ${expectedId}; found ${provision.id}`);
    }
    if (provision.appliesFrom !== versionAsOf) {
      throw new Error(`${provision.id} is not aligned to the 2026-effective text`);
    }
  });

  return provisions.map((provision) =>
    provision.instrumentId === instrumentId
      ? {
          ...provision,
          translations: {
            ...provision.translations,
            en: annotatedTranslation(provision),
          },
        }
      : provision,
  );
}

async function main() {
  const checkOnly = process.argv.slice(2).includes("--check");
  const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--check");
  if (unknownArgs.length) {
    throw new Error(`Unknown argument(s): ${unknownArgs.join(", ")}`);
  }

  const currentText = await readFile(provisionsPath, "utf8");
  const provisions = JSON.parse(currentText);
  const annotated = annotate(provisions);
  const nextText = `${JSON.stringify(annotated, null, 2)}\n`;

  if (checkOnly) {
    if (nextText !== currentText) {
      throw new Error(
        "CSL English metadata is stale; run scripts/annotate-cn-csl-english.mjs",
      );
    }
    console.log("cn-cybersecurity-law: 81 English records are current");
    return;
  }

  await writeFile(provisionsPath, nextText, "utf8");
  console.log("cn-cybersecurity-law: annotated 81 project English records");
}

await main();
