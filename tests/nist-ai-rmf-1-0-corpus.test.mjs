import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const dataRoot = new URL("../data/v2/", import.meta.url);
const repoRoot = new URL("../", import.meta.url);
const loadJson = async (filename) =>
  JSON.parse(await readFile(new URL(filename, dataRoot), "utf8"));
const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

const corpus = await loadJson("us-nist-ai-rmf-1-0-corpus.json");
const manifest = await loadJson("us-nist-ai-rmf-1-0-corpus-manifest.json");
const byId = new Map(corpus.map((node) => [node.id, node]));
const byNumber = new Map(
  corpus.filter((node) => node.unitNumber).map((node) => [node.unitNumber, node]),
);
const thirdPartyNodeIds = [
  "us-nist-ai-rmf-1-0-contents-tables-and-figures",
  "us-nist-ai-rmf-1-0-executive-summary",
  "us-nist-ai-rmf-1-0-section-1-1",
  "us-nist-ai-rmf-1-0-section-1-2-2",
  "us-nist-ai-rmf-1-0-section-1-2-3",
  "us-nist-ai-rmf-1-0-section-2",
  "us-nist-ai-rmf-1-0-figure-2",
  "us-nist-ai-rmf-1-0-section-3-1",
  "us-nist-ai-rmf-1-0-section-3-2",
  "us-nist-ai-rmf-1-0-section-3-3",
];

test("NIST AI RMF 1.0 corpus has complete authentic structure and interoperable node fields", () => {
  assert.equal(manifest.instrumentId, "us-nist-ai-rmf-1-0");
  assert.equal(manifest.publicationNumber, "NIST AI 100-1");
  assert.equal(manifest.currentVersion.version, "1.0");
  assert.equal(manifest.publishedOn, "2023-01-26");
  assert.equal(corpus.length, 135);
  assert.equal(manifest.corpus.nodeCount, 135);
  assert.deepEqual(manifest.corpus.unitTypeCounts, {
    "appendix-section": 5,
    "core-category": 19,
    "core-subcategory": 72,
    "core-table": 4,
    "figure-caption": 5,
    "front-matter": 3,
    function: 4,
    "navigation-front-matter": 1,
    part: 2,
    section: 20,
  });

  const ids = new Set(corpus.map((node) => node.id));
  assert.equal(ids.size, corpus.length);
  for (const [index, node] of corpus.entries()) {
    assert.equal(node.instrumentId, "us-nist-ai-rmf-1-0");
    assert.equal(node.language, "en");
    assert.equal(node.version, "1.0");
    assert.equal(node.versionAsOf, "2026-07-20");
    assert.equal(node.publishedOn, "2023-01-26");
    assert.equal(node.retrievedOn, "2026-07-20");
    assert.equal(node.source, node.sourceUrl);
    assert.match(node.source, /^https:\/\/nvlpubs\.nist\.gov\//);
    assert.ok(node.label.length > 0);
    assert.ok(node.articleNumber.length > 0);
    assert.ok(node.title.length > 0);
    assert.ok(node.summary.length > 0);
    assert.ok(node.fullText.length > 0);
    assert.equal(node.fullText, node.paragraphs.join("\n\n"));
    assert.equal(node.contentSha256, digest(node.fullText));
    assert.equal(node.navigationOrder, index + 1);
    assert.equal(node.rightsProfile, "nist-technical-series-17-usc-105");
    assert.ok(node.coreConceptIds.includes("ai-risk-management"));
    assert.equal(node.thematicRelevance.isRelevant, true);
    assert.equal(node.thematicRelevance.highlightEntireUnit, true);
    assert.equal(node.hierarchy.parentId, node.parentId);
    assert.equal(node.hierarchy.depth, node.hierarchy.ancestorIds.length);
    assert.equal(node.hierarchy.pathLabels.at(-1), node.label);
    if (node.parentId) {
      assert.ok(ids.has(node.parentId), `${node.id} has a valid parent`);
      assert.equal(node.hierarchy.ancestorIds.at(-1), node.parentId);
    }
  }
});

test("four functions, 19 categories, and all 72 official subcategories are preserved", () => {
  const functions = corpus.filter((node) => node.unitType === "function");
  assert.deepEqual(functions.map((node) => node.unitNumber), ["5.1", "5.2", "5.3", "5.4"]);
  assert.deepEqual(functions.map((node) => node.title), ["Govern", "Map", "Measure", "Manage"]);

  const categories = corpus.filter((node) => node.unitType === "core-category");
  const subcategories = corpus.filter((node) => node.unitType === "core-subcategory");
  assert.equal(categories.length, 19);
  assert.equal(subcategories.length, 72);
  const expected = {
    GOVERN: { categories: 6, subcategories: 19, last: "GOVERN 6.2" },
    MAP: { categories: 5, subcategories: 18, last: "MAP 5.2" },
    MEASURE: { categories: 4, subcategories: 22, last: "MEASURE 4.3" },
    MANAGE: { categories: 4, subcategories: 13, last: "MANAGE 4.3" },
  };
  for (const [name, counts] of Object.entries(expected)) {
    assert.equal(categories.filter((node) => node.function === name).length, counts.categories);
    assert.equal(subcategories.filter((node) => node.function === name).length, counts.subcategories);
    assert.ok(byNumber.has(counts.last));
  }

  assert.match(byNumber.get("GOVERN 1.1").fullText, /Legal and regulatory requirements involving AI/);
  assert.match(byNumber.get("GOVERN 3.2").fullText, /human-AI configurations and oversight/);
  assert.match(byNumber.get("MAP 1.1").fullText, /context-specific laws, norms and expectations/);
  assert.match(byNumber.get("MEASURE 2.10").fullText, /Privacy risk/);
  assert.match(byNumber.get("MEASURE 3.3").fullText, /appeal system outcomes/);
  assert.match(byNumber.get("MANAGE 4.3").fullText, /Incidents and errors are communicated/);
});

test("foundational sections, profiles, figures, and appendices retain controlling-edition anchors", () => {
  const sectionNumbers = corpus
    .filter((node) => ["section", "function"].includes(node.unitType))
    .map((node) => node.unitNumber)
    .filter(Boolean);
  assert.deepEqual(sectionNumbers, [
    "1", "1.1", "1.2", "1.2.1", "1.2.2", "1.2.3", "1.2.4", "2",
    "3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "4",
    "5", "5.1", "5.2", "5.3", "5.4", "6",
  ]);
  assert.equal(byNumber.has("1.1.1"), false, "AIRC display-number defect is not imported");
  assert.match(byNumber.get("1.2.1").fullText, /AI risks or failures that are not well-defined or adequately understood are difficult to measure/);
  assert.match(byNumber.get("3.6").fullText, /Privacy values such as anonymity, confidentiality, and control/);
  assert.match(byNumber.get("6").fullText, /AI RMF use-case profiles are implementations/);

  const figures = corpus.filter((node) => node.unitType === "figure-caption");
  assert.equal(figures.length, 5);
  assert.match(byId.get("us-nist-ai-rmf-1-0-figure-5").fullText, /Governance is designed to be a cross-cutting function/);
  for (const appendix of ["appendix-a", "appendix-b", "appendix-c", "appendix-d"]) {
    assert.ok(byId.has(`us-nist-ai-rmf-1-0-${appendix}`));
  }
  assert.match(byId.get("us-nist-ai-rmf-1-0-appendix-b").fullText, /AI systems may require more frequent maintenance/);
  assert.match(byId.get("us-nist-ai-rmf-1-0-appendix-d").fullText, /risk-based/i);
});

test("manifest records 17 USC 105 rights and keeps Playbook and GenAI Profile outside RMF 1.0", () => {
  assert.equal(manifest.rights.profile, "nist-technical-series-17-usc-105");
  assert.match(manifest.rights.usCopyrightStatus, /17 U\.S\.C\. § 105/);
  assert.match(manifest.rights.foreignRights, /royalty-free, worldwide/);
  assert.match(manifest.rights.thirdPartyCaveat, /third-party materials may be separately protected/i);
  assert.equal(manifest.scopeBoundary.playbookIncluded, false);
  assert.equal(manifest.scopeBoundary.generativeAiProfileIncluded, false);
  assert.match(manifest.scopeBoundary.playbookRelationship, /Separate/);
  assert.match(manifest.scopeBoundary.generativeAiProfileRelationship, /NIST AI 600-1/);
  assert.match(manifest.scopeBoundary.aircNumberingCorrection, /1\.2\.1-1\.2\.4/);
  assert.equal(manifest.qualityAssurance.companionContaminationCheck, true);
});

test("exactly ten ISO/IEC or OECD-affected nodes are excluded from the project license", () => {
  const affectedNodes = corpus.filter(
    (node) => node.projectLicenseBoundary === "third-party-excluded-from-project-license",
  );
  assert.deepEqual(affectedNodes.map((node) => node.id), thirdPartyNodeIds);
  assert.equal(affectedNodes.length, 10);
  for (const node of affectedNodes) {
    assert.ok(Array.isArray(node.thirdPartyMaterial.items));
    assert.ok(node.thirdPartyMaterial.items.length > 0);
    assert.equal(
      node.thirdPartyMaterial.status,
      "excluded-from-project-license-and-any-public-domain-claim",
    );
    assert.match(node.thirdPartyMaterial.note, /ISO\/IEC or OECD/);
  }

  const boundary = manifest.rights.thirdPartyMaterialBoundary;
  assert.equal(boundary.projectLicenseBoundary, "third-party-excluded-from-project-license");
  assert.equal(boundary.affectedNodeCount, 10);
  assert.deepEqual(boundary.affectedNodeIds, thirdPartyNodeIds);
});

test("18 local frozen sources match pinned hashes and the official PDF is external-only", async () => {
  assert.equal(manifest.sourceSnapshots.length, 19);
  const localSnapshots = manifest.sourceSnapshots.filter((snapshot) => snapshot.storedLocally);
  const externalSnapshots = manifest.sourceSnapshots.filter((snapshot) => !snapshot.storedLocally);
  assert.equal(localSnapshots.length, 18);
  assert.equal(externalSnapshots.length, 1);
  for (const snapshot of localSnapshots) {
    assert.ok(snapshot.path.startsWith("data/v2/source-snapshots/"));
    const bytes = await readFile(new URL(snapshot.path.replace("data/v2/", ""), dataRoot));
    assert.equal(digest(bytes), snapshot.sha256, snapshot.path);
  }
  const [pdf] = externalSnapshots;
  assert.equal(pdf.role, "controlling-complete-official-edition");
  assert.equal(pdf.storedLocally, false);
  assert.equal(Object.hasOwn(pdf, "path"), false);
  assert.equal(pdf.sourceUrl, "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf");
  assert.equal(pdf.sha256, "7576edb531d9848825814ee88e28b1795d3a84b435b4b797d3670eafdc4a89f1");
  assert.equal(manifest.qualityAssurance.pdfPageCount, 48);
  assert.equal(manifest.corpus.contentSha256, digest(corpus.map((node) => node.fullText).join("\n\n")));
  assert.equal(manifest.corpus.fileSha256, digest(await readFile(new URL("us-nist-ai-rmf-1-0-corpus.json", dataRoot))));
});

test("importer reproduces corpus and manifest byte for byte", async () => {
  const temp = await mkdtemp(join(tmpdir(), "nist-ai-rmf-corpus-"));
  const snapshotDir = join(temp, "snapshots-without-pdf");
  const output = join(temp, "corpus.json");
  const manifestOutput = join(temp, "manifest.json");
  try {
    await mkdir(snapshotDir);
    for (const snapshot of manifest.sourceSnapshots.filter((item) => item.storedLocally)) {
      const source = new URL(snapshot.path.replace("data/v2/", ""), dataRoot);
      await copyFile(source, join(snapshotDir, basename(snapshot.path)));
    }
    await execFileAsync("python3", [
      fileURLToPath(new URL("scripts/import-nist-ai-rmf-1-0.py", repoRoot)),
      "--snapshot-dir", snapshotDir,
      "--output", output,
      "--manifest", manifestOutput,
    ]);
    assert.deepEqual(await readFile(output), await readFile(new URL("us-nist-ai-rmf-1-0-corpus.json", dataRoot)));
    assert.deepEqual(await readFile(manifestOutput), await readFile(new URL("us-nist-ai-rmf-1-0-corpus-manifest.json", dataRoot)));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
