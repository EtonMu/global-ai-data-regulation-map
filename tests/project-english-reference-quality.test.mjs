import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dataRoot = new URL("../data/v2/", import.meta.url);
const audit = JSON.parse(
  await readFile(new URL("english-corpus-coverage.json", dataRoot), "utf8"),
);

const editorialPlaceholderPattern =
  /this (?:article|section|provision).{0,160}mapped to|complete official .{0,80}wording is available in the original-language view/is;

const knownDraftArtifactPatterns = [
  /\bPersonal(?:\s+Personal){1,}\b/i,
  /\bcredit\s+credit\b/i,
  /\bFish data\b/i,
  /\b(?:Sanryaku|Shoryaku|Ryak)\b/i,
  /\bLaw No\.\s+No\.\b/i,
  /\bare shall\b/i,
  /\bshall must\b/i,
  /\bmust shall\b/i,
  /;\s+And\b/,
  /\bexcept In cases\b/,
  /\bcents individual(?:'s)?\b/i,
  /\bmuscles law enforcement\b/i,
  /\bthe a\b/i,
  /\ba Overseas\b/,
  /\bincomplete and in accordance\b/i,
  /\bcustomers whose products are introduced\b/i,
  /\bgovernment-endowed foundations\b/i,
  /\bmaximum fine imposed\b/i,
  /\bprocessing or processing devices\b/i,
  /\bEvaluate, summarize and summarize\b/i,
  /\bParty['’]s guidelines, guidelines\b/i,
  /\bvehicles and equipment\s+equipment\b/i,
  /\bD&\.ta\b/,
  /\bBABX\b/,
  /\bdossier(?:10|11|13|14)\b/i,
  /\bREQUESTER4\b/,
  /\bCONTENTS\s+\.{2,}1\s+12\b/i,
];

function containsParagraphsInOrder(fullText, paragraphs) {
  let cursor = 0;
  for (const paragraph of paragraphs) {
    const next = fullText.indexOf(paragraph, cursor);
    if (next < cursor) return false;
    cursor = next + paragraph.length;
  }
  return true;
}

function sourceUrl(source) {
  return typeof source === "string" ? source : source?.url;
}

test("project-authored English references pass the publication quality gate", async () => {
  let checked = 0;

  for (const corpusEntry of audit.corpora) {
    const records = JSON.parse(
      await readFile(new URL(corpusEntry.corpusFile, dataRoot), "utf8"),
    ).filter(
      (record) =>
        record.instrumentId ===
        (corpusEntry.sourceInstrumentId ?? corpusEntry.instrumentId),
    );

    for (const record of records) {
      const translation = record.translations?.en;
      if (!translation?.coverageStatus?.includes("project")) continue;
      checked += 1;

      assert.equal(translation.language ?? "en", "en", `${record.id} language`);
      assert.ok(translation.paragraphs?.length, `${record.id} has no English paragraphs`);
      assert.ok(
        containsParagraphsInOrder(translation.fullText, translation.paragraphs),
        `${record.id} English paragraph sequence drifted`,
      );
      assert.match(
        translation.coverageStatus,
        /^complete-/,
        `${record.id} does not declare complete English coverage`,
      );
      assert.equal(
        typeof translation.currentTextEquivalent,
        "boolean",
        `${record.id} lacks an explicit version-alignment decision`,
      );
      assert.match(
        `${translation.note ?? ""} ${translation.authorityNote ?? ""}`,
        /project|nonofficial|not an official|no legal effect/i,
        `${record.id} does not disclose the project/nonofficial boundary`,
      );
      assert.match(sourceUrl(translation.source) ?? "", /^https:\/\//, `${record.id} source`);
      assert.match(
        translation.rights?.licenseUrl ?? "",
        /^https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/?$/,
        `${record.id} project-English licence`,
      );
      assert.equal(
        translation.contentSha256,
        createHash("sha256").update(translation.fullText, "utf8").digest("hex"),
        `${record.id} English content hash`,
      );
      assert.doesNotMatch(
        translation.fullText,
        editorialPlaceholderPattern,
        `${record.id} contains a UI placeholder instead of legal text`,
      );
      for (const pattern of knownDraftArtifactPatterns) {
        assert.doesNotMatch(
          translation.fullText,
          pattern,
          `${record.id} contains a known draft-translation artifact (${pattern})`,
        );
      }
    }
  }

  assert.equal(checked, 430, "project-reference corpus count drifted");
});
