import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const explorerSource = await readFile(
  new URL("../app/regulation-explorer.tsx", import.meta.url),
  "utf8",
);
const instruments = JSON.parse(
  await readFile(new URL("../data/v2/instruments.json", import.meta.url), "utf8"),
);
const jurisdictions = JSON.parse(
  await readFile(new URL("../data/v2/jurisdictions.json", import.meta.url), "utf8"),
);

function sourceBetween(start, end) {
  const startIndex = explorerSource.indexOf(start);
  const endIndex = explorerSource.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `missing source boundary: ${start}`);
  assert.notEqual(endIndex, -1, `missing source boundary: ${end}`);
  return explorerSource.slice(startIndex, endIndex);
}

function forceClass(instrument) {
  const force = instrument.legalForce.toLowerCase();
  const category = instrument.category.toLowerCase();
  if (
    force.includes("voluntary") ||
    force.includes("non-binding") ||
    force.includes("advisory") ||
    category.includes("framework") ||
    category.includes("report") ||
    category.includes("principle")
  ) {
    return "soft";
  }
  if (
    force.includes("not-enacted") ||
    force.includes("lapsed") ||
    category.includes("consultation") ||
    category.includes("bill") ||
    instrument.lifecycleStatus.includes("veto") ||
    instrument.lifecycleStatus.includes("pending")
  ) {
    return "proposal";
  }
  if (
    category.includes("executive") ||
    category.includes("directive") ||
    category.includes("guidance") ||
    category.includes("policy") ||
    force.includes("mandatory-internal")
  ) {
    return "executive";
  }
  return "binding";
}

const jurisdictionById = new Map(
  jurisdictions.map((jurisdiction) => [jurisdiction.id, jurisdiction]),
);

function rootJurisdiction(jurisdictionId) {
  let jurisdiction = jurisdictionById.get(jurisdictionId);
  while (jurisdiction?.parentId) {
    jurisdiction = jurisdictionById.get(jurisdiction.parentId);
  }
  return jurisdiction;
}

function expectedAtlasGroup(instrument) {
  const jurisdiction = jurisdictionById.get(instrument.jurisdictionId);
  const root =
    jurisdiction?.id === "hk"
      ? jurisdiction
      : (rootJurisdiction(instrument.jurisdictionId) ?? jurisdiction);
  const contextTypes = [jurisdiction?.type ?? "", root?.type ?? ""].join(" ");
  const international =
    contextTypes.includes("international") ||
    contextTypes.includes("intergovernmental") ||
    contextTypes.includes("standards");
  return international ? "frameworks" : (root?.id ?? "other");
}

test("Atlas grouping reserves frameworks for international jurisdictions", () => {
  const groupingSource = sourceBetween(
    "function buildAtlasGroups()",
    "const atlasGroups = buildAtlasGroups();",
  );

  assert.match(
    groupingSource,
    /const international\s*=\s*[\s\S]*?contextTypes\.includes\("international"\)[\s\S]*?contextTypes\.includes\("intergovernmental"\)[\s\S]*?contextTypes\.includes\("standards"\);/,
    "international grouping must be determined from jurisdiction context",
  );
  assert.match(
    groupingSource,
    /const framework = international;/,
    "only an international jurisdiction context may enter the frameworks group",
  );
  assert.doesNotMatch(
    groupingSource,
    /framework\s*=\s*international\s*\|\|[\s\S]*?forceClass/,
    "soft-law force alone must never move a national source into frameworks",
  );
  assert.match(
    groupingSource,
    /\? "International \/ Transnational Frameworks"/,
    "the international group must use its precise transnational label",
  );
});

test("national and regional soft law remains under its legal jurisdiction", () => {
  const expectedNationalSoftLawGroups = new Map([
    ["us-nist-ai-rmf-1-0", "us"],
    ["jp-ai-guidelines-business-1-2", "jp"],
    ["sg-model-ai-governance-framework-2020", "sg"],
    ["sg-ai-verify-testing-framework", "sg"],
    ["au-guidance-for-ai-adoption-2025", "au"],
    ["ae-dubai-ai-ethics-toolkit-2019", "ae"],
    ["ae-generative-ai-guide-2023", "ae"],
    ["sa-sdaia-ai-ethics-principles-1-0-2023", "sa"],
    ["tw-executive-yuan-generative-ai-guidelines-2023", "tw"],
    ["hk-ai-model-pd-protection-framework-2024", "hk"],
    ["hk-ethical-ai-guidance-2021", "hk"],
    ["hk-genai-employee-guidelines-checklist-2025", "hk"],
  ]);

  for (const [instrumentId, expectedGroup] of expectedNationalSoftLawGroups) {
    const instrument = instruments.find((candidate) => candidate.id === instrumentId);
    assert.ok(instrument, `missing national soft-law fixture: ${instrumentId}`);
    assert.equal(forceClass(instrument), "soft", `${instrumentId} must remain marked soft law`);
    assert.equal(
      expectedAtlasGroup(instrument),
      expectedGroup,
      `${instrumentId} must be grouped under ${expectedGroup}`,
    );
  }

  const actualNationalSoftLawIds = instruments
    .filter(
      (instrument) =>
        forceClass(instrument) === "soft" &&
        expectedAtlasGroup(instrument) !== "frameworks",
    )
    .map((instrument) => instrument.id)
    .sort();
  assert.deepEqual(
    actualNationalSoftLawIds,
    [...expectedNationalSoftLawGroups.keys()].sort(),
    "every nationally attributed soft-law instrument must be covered by the jurisdiction regression set",
  );
});

test("only genuinely international soft law remains in frameworks", () => {
  const expectedInternationalFrameworks = [
    "g7-hiroshima-ai-process",
    "un-ai-advisory-final-report-2024",
    "iso-iec-42001-2023",
    "ieee-ethically-aligned-design-2019",
    "oecd-ai-principles",
    "int-bletchley-declaration-2023",
  ].sort();
  const actualInternationalFrameworks = instruments
    .filter(
      (instrument) =>
        forceClass(instrument) === "soft" &&
        expectedAtlasGroup(instrument) === "frameworks",
    )
    .map((instrument) => instrument.id)
    .sort();

  assert.deepEqual(actualInternationalFrameworks, expectedInternationalFrameworks);
});

test("navigator and Atlas nodes expose an explicit SOFT LAW classification", () => {
  const navigatorSource = sourceBetween(
    "function CorpusNavigator(",
    "function GlobalAtlas(",
  );
  const atlasSource = sourceBetween(
    "function GlobalAtlas(",
    "function CoreConceptExplorer(",
  );

  assert.match(
    navigatorSource,
    /className="instrument-tree-meta"[\s\S]*?forceClass\(instrument\) === "soft"[\s\S]*?<strong>SOFT LAW<\/strong>/,
    "navigator rows must visibly label soft-law instruments",
  );
  assert.match(
    navigatorSource,
    /aria-label=\{[\s\S]*?forceClass\(instrument\) === "soft"[\s\S]*?soft law/,
    "navigator rows must announce the soft-law classification to assistive technology",
  );
  assert.match(
    atlasSource,
    /className="instrument-node-classification"[\s\S]*?forceClass\(instrument\) === "soft"[\s\S]*?<strong>SOFT LAW<\/strong>/,
    "Atlas nodes must visibly label soft-law instruments",
  );
  assert.match(
    atlasSource,
    /aria-label=\{[\s\S]*?forceClass\(instrument\) === "soft"[\s\S]*?soft law/,
    "Atlas node accessible names must include the soft-law classification",
  );
});
