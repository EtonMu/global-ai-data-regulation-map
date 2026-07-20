import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const digest = (value) => createHash("sha256").update(value).digest("hex");

const configs = [
  {
    id: "br-pl-2338-2023-ai-bill",
    path: "data/v2/br-ai-bill-2338-2023-articles.json",
    resource: "data/v2/reference-translations/br-pl2338-2023-project-en.json",
    unitCount: 79,
    paragraphCount: 476,
    residue:
      /\b(?:promoção|desenvolvimento|regulação|governança|inteligência|discriminação|investigação|autoridades|direitos|pessoa|dados|conformidade|deverá|será|não)\b/iu,
  },
  {
    id: "id-pdp-law-2022",
    path: "data/v2/id-pdp-law-2022-articles.json",
    resource: "data/v2/reference-translations/id-pdp-law-2022-project-en.json",
    unitCount: 76,
    paragraphCount: 389,
    residue:
      /\b(?:undang-undang|pelindungan|pribadi|pengendali|pemrosesan|ketentuan|sebagaimana|dimaksud|wajib|dan|yang|untuk)\b/iu,
  },
  {
    id: "tw-executive-yuan-generative-ai-guidelines-2023",
    path:
      "data/v2/tw-executive-yuan-generative-ai-guidelines-2023-points.json",
    resource:
      "data/v2/reference-translations/tw-genai-guidelines-2023-project-en.json",
    unitCount: 11,
    paragraphCount: 15,
    residue: /[\u3400-\u9fff]/u,
  },
];

const markerKind = (value, instrumentId) => {
  const patterns =
    instrumentId === "br-pl-2338-2023-ai-bill"
      ? [
          /^(?:Art\.|Article)\s*\d+/u,
          /^§\s*\d+/u,
          /^(?:Parágrafo único|Sole paragraph)/u,
          /^[IVXLCDM]+\s*[–−-]/u,
          /^[a-z]\)/u,
        ]
      : instrumentId === "id-pdp-law-2022"
        ? [
            /^(?:Pasal|Article)\s*\d+/u,
            /^\(\d+\)/u,
            /^[a-z]\.\s*/u,
            /^\d+\.\s*/u,
          ]
        : [/^[一二三四五六七八九十]+、/u, /^\d+\.\s*/u];
  const labels =
    instrumentId === "br-pl-2338-2023-ai-bill"
      ? ["article", "section", "sole", "roman", "letter"]
      : instrumentId === "id-pdp-law-2022"
        ? ["article", "section", "letter", "number"]
        : ["point", "point"];
  const index = patterns.findIndex((pattern) => pattern.test(value));
  return index < 0 ? "body" : labels[index];
};

test("BR, ID and TW English coverage is complete, aligned and residue-free", async () => {
  for (const config of configs) {
    const [corpus, resource] = await Promise.all([
      readJson(config.path),
      readJson(config.resource),
    ]);
    assert.equal(corpus.length, config.unitCount);
    assert.equal(resource.units.length, config.unitCount);
    assert.equal(
      corpus.reduce((sum, node) => sum + node.paragraphs.length, 0),
      config.paragraphCount,
    );
    assert.equal(resource.qualityAssurance.paragraphCount, config.paragraphCount);
    assert.equal(resource.officialStatus, "non-official-no-legal-effect");
    assert.equal(resource.rights.license, "CC BY 4.0");

    const resourceBytes = await readFile(new URL(config.resource, root));
    const byId = new Map(resource.units.map((unit) => [unit.id, unit]));
    for (const node of corpus) {
      const english = node.translations.en;
      const unit = byId.get(node.id);
      assert.ok(unit, node.id);
      assert.equal(node.currentLanguageToggleEligible, true);
      assert.equal(english.officialStatus, "non-official-no-legal-effect");
      assert.equal(english.fullText, english.paragraphs.join("\n\n"));
      assert.equal(english.contentSha256, digest(english.fullText));
      assert.equal(english.paragraphs.length, node.paragraphs.length);
      assert.deepEqual(english.paragraphs, unit.paragraphs);
      assert.equal(
        english.translationBasis.translationResourceSha256,
        digest(resourceBytes),
      );
      assert.equal(unit.sourceContentSha256, digest(node.fullText));
      for (let index = 0; index < node.paragraphs.length; index += 1) {
        assert.equal(
          markerKind(node.paragraphs[index], config.id),
          markerKind(english.paragraphs[index], config.id),
          `${node.id} paragraph ${index}`,
        );
      }
      assert.doesNotMatch(english.fullText, config.residue);
      assert.doesNotMatch(
        english.fullText,
        /[\u200b\u200c\ufeff\u00ad]|Law No\. No\.|\b(?:is|are) shall\b|BABX/u,
      );
      assert.doesNotMatch(
        english.fullText,
        /this (?:article|section|provision).{0,160}mapped to|complete official .{0,80}wording is available/isu,
      );
    }
  }
});

test("material legal anchors and current-status boundaries are preserved", async () => {
  const [brazil, indonesia, taiwan] = await Promise.all(
    configs.map((config) => readJson(config.path)),
  );
  const br = new Map(brazil.map((node) => [node.articleNumber, node]));
  assert.match(br.get("1").translations.en.fullText, /Law No\. 13,709 of 14 August 2018/u);
  assert.match(br.get("2").translations.en.fullText, /X – promotion of research and development/u);
  assert.match(br.get("4").translations.en.fullText, /directly or on commission/u);
  assert.match(br.get("4").translations.en.fullText, /makes an AI system available and distributes it/u);
  assert.match(br.get("4").translations.en.fullText, /on its own behalf or for its own benefit/u);
  assert.doesNotMatch(br.get("8").translations.en.fullText, /enabling .+ to be able/u);
  assert.match(br.get("18").translations.en.paragraphs[2], /^a\) documentation/u);
  assert.match(br.get("18").translations.en.paragraphs[3], /^b\) use of tools/u);
  assert.match(br.get("45").translations.en.fullText, /An act of the federal Executive Branch/u);
  assert.match(br.get("50").translations.en.fullText, /Law No\. 8,429 of 2 June 1992/u);
  assert.match(br.get("63").translations.en.fullText, /equity relationship/u);
  assert.match(br.get("68").translations.en.fullText, /multi-stakeholder/u);
  assert.match(br.get("68").translations.en.fullText, /public disclosure and dissemination of data/u);
  assert.equal(br.get("80").translations.en.legalEffectStatus, "pending-bill-not-enacted");

  const id = new Map(indonesia.map((node) => [node.articleNumber, node]));
  assert.match(id.get("1").translations.en.fullText, /Personal Data means data relating to a natural person/u);
  assert.match(id.get("20").translations.en.fullText, /lawful basis for processing Personal Data/u);
  assert.match(id.get("34").translations.en.fullText, /Personal Data Protection impact assessment/u);
  assert.match(id.get("16").translations.en.fullText, /misuse, damage, and\/or loss/u);
  assert.match(id.get("46").translations.en.fullText, /3 x 24 \(three times twenty-four\) hours/u);
  assert.match(id.get("53").translations.en.paragraphs[3], /; and\/or$/u);
  assert.equal(
    id.get("53").translations.en.legalEffectAlignment,
    "current-operative-text-after-Decision-151-PUU-XXII-2024",
  );
  assert.match(id.get("56").translations.en.fullText, /equivalent to or higher than/u);
  assert.match(id.get("57").translations.en.fullText, /2 \(two\) percent of annual revenue/u);
  assert.match(id.get("67").translations.en.fullText, /Rp5,000,000,000\.00/u);
  assert.match(id.get("54").translations.en.fullText, /shall have regard to the risks/u);
  assert.match(id.get("70").translations.en.fullText, /10 \(ten\) times the maximum fine prescribed/u);
  assert.match(id.get("70").translations.en.fullText, /Corporation's business premises/u);

  const twEnglish = taiwan.map((node) => node.translations.en.fullText).join("\n");
  assert.match(twEnglish, /objective and professional final judgment/u);
  assert.match(twEnglish, /closed, on-premises environment/u);
  assert.match(twEnglish, /sole basis for an official decision/u);
  assert.match(twEnglish, /information and communications security/u);
  assert.match(twEnglish, /successful bidder that is a legal person/u);
  assert.match(twEnglish, /government-funded foundations/u);
  assert.ok(
    taiwan.every(
      (node) =>
        node.translations.en.legalEffectStatus ===
        "active-non-binding-public-sector-guidance",
    ),
  );
  assert.ok(
    taiwan.every(
      (node) =>
        node.rights.license === "政府資料開放授權條款－第1版" &&
        node.rights.attributionRequired === true,
    ),
  );
});

test("focused manifest pins corpus and translation-resource hashes", async () => {
  const manifestPath = "data/v2/br-id-tw-project-english-corpus-manifest.json";
  const manifest = await readJson(manifestPath);
  assert.equal(manifest.reviewedAsOf, "2026-07-20");
  assert.equal(manifest.corpora.length, 3);
  assert.equal(manifest.rights.license, "Creative Commons Attribution 4.0 International");
  for (const entry of manifest.corpora) {
    assert.equal(entry.completeProjectEnglishCoverage, true);
    assert.equal(entry.sourceParagraphCount, entry.englishParagraphCount);
    assert.equal(
      digest(await readFile(new URL(entry.corpus, root))),
      entry.corpusSha256,
    );
    assert.equal(
      digest(await readFile(new URL(entry.resource, root))),
      entry.translationResourceSha256,
    );
  }
});
