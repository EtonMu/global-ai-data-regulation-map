import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const provisions = JSON.parse(
  await readFile(new URL("../data/v2/provisions.json", import.meta.url), "utf8"),
);

const provisionsById = new Map(
  provisions.map((provision) => [provision.id, provision]),
);

const chineseProvisionIds = [
  ...Array.from({ length: 81 }, (_, index) => `cn-csl-art-${index + 1}`),
  "cn-pipl-art-24",
  "cn-pipl-art-38",
  "cn-pipl-art-51",
  "cn-pipl-art-55",
  "cn-pipl-art-57",
  "cn-network-data-reg-art-44",
  "cn-genai-art-4",
  "cn-genai-art-7",
  "cn-genai-art-17",
];

const japaneseFullProvisionIds = ["jp-appi-art-23", "jp-appi-art-28"];

test("indexed Chinese provisions store official Chinese text", () => {
  for (const id of chineseProvisionIds) {
    const provision = provisionsById.get(id);
    assert.ok(provision, `${id} must remain indexed`);
    assert.equal(provision.textAvailability.mode, "official-original-text-stored");
    assert.equal(provision.textAvailability.stored, true);
    assert.equal(provision.textAvailability.language, "zh-CN");
    assert.match(provision.fullText, /[\u3400-\u9fff]/u);
    assert.equal(provision.fullText, provision.paragraphs.join("\n\n"));
    assert.ok(
      ["www.cac.gov.cn", "app.www.gov.cn"].includes(
        new URL(provision.source.url).hostname,
      ),
      `${id} must link to an official Chinese government publication`,
    );
    assert.match(
      provision.summary,
      /^[\x20-\x7E\u2018\u2019\u201c\u201d]+$/u,
      `${id} must retain a separate English editorial summary`,
    );
  }
});

test("indexed APPI provisions store current Japanese e-Gov text", () => {
  for (const id of japaneseFullProvisionIds) {
    const provision = provisionsById.get(id);
    assert.ok(provision, `${id} must remain indexed`);
    assert.equal(provision.textAvailability.mode, "official-original-text-stored");
    assert.equal(provision.textAvailability.stored, true);
    assert.equal(provision.textAvailability.language, "ja");
    assert.match(provision.fullText, /[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.equal(provision.fullText, provision.paragraphs.join("\n\n"));
    assert.equal(new URL(provision.source.url).hostname, "laws.e-gov.go.jp");
  }
});

test("the Japanese AI Guidelines record labels its stored material as an extract", () => {
  const provision = provisionsById.get(
    "jp-ai-guidelines-1-2-common-principles",
  );
  assert.ok(provision);
  assert.equal(
    provision.textAvailability.mode,
    "official-original-excerpt-stored",
  );
  assert.equal(provision.textAvailability.stored, true);
  assert.equal(provision.textAvailability.language, "ja");
  assert.match(provision.textAvailability.note, /extract/i);
  assert.match(provision.fullText, /1\) 人間中心/u);
  assert.match(provision.fullText, /10\) イノベーション/u);
  assert.equal(provision.fullText, provision.paragraphs.join("\n\n"));
  assert.equal(new URL(provision.source.url).hostname, "www.meti.go.jp");
  assert.ok(provision.source.url.endsWith("/20260331_1.pdf"));
});

test("stored Chinese and Japanese records expose aligned non-official English reference translations", () => {
  const sourceLanguageRecords = provisions.filter(
    (provision) =>
      provision.textAvailability?.stored === true &&
      ["zh-CN", "ja"].includes(provision.textAvailability.language),
  );

  assert.equal(sourceLanguageRecords.length, 93);
  for (const provision of sourceLanguageRecords) {
    const translation = provision.translations?.en;
    assert.ok(translation, `${provision.id} must include an English rendering`);
    assert.equal(translation.status, "reference");
    assert.match(
      translation.note,
      /reference|not an official|non-official/i,
      `${provision.id} must identify its English rendering as non-official`,
    );
    assert.equal(
      translation.paragraphs.length,
      provision.paragraphs.length,
      `${provision.id} must preserve one-to-one paragraph alignment`,
    );
    assert.equal(translation.fullText, translation.paragraphs.join("\n\n"));
  }
});
