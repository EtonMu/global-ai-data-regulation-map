import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const provisions = JSON.parse(
  await readFile(new URL("data/provisions.json", root), "utf8"),
);
const relations = JSON.parse(
  await readFile(new URL("data/relations.json", root), "utf8"),
);

const allowedRegions = new Set(["EU", "US", "CN", "INT"]);
const allowedRelationTypes = new Set([
  "functional-equivalent",
  "partial-overlap",
  "operationalizes",
  "aligned-with",
  "complements",
  "depends-on",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    assert(typeof item.id === "string" && item.id.length > 0, `${label} is missing an id`);
    assert(!seen.has(item.id), `Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

const provisionIds = assertUnique(provisions, "provision");
assertUnique(relations, "relation");

for (const provision of provisions) {
  for (const field of [
    "instrument",
    "provision",
    "jurisdiction",
    "binding",
    "title",
    "summary",
    "source",
    "sourceLabel",
  ]) {
    assert(
      typeof provision[field] === "string" && provision[field].trim().length > 0,
      `${provision.id} is missing ${field}`,
    );
  }
  assert(allowedRegions.has(provision.region), `${provision.id} has invalid region`);
  assert(Array.isArray(provision.topics) && provision.topics.length > 0, `${provision.id} has no topics`);
  assert(/^https:\/\//.test(provision.source), `${provision.id} must use an HTTPS source`);
}

for (const relation of relations) {
  assert(provisionIds.has(relation.source), `${relation.id} has missing source provision`);
  assert(provisionIds.has(relation.target), `${relation.id} has missing target provision`);
  assert(relation.source !== relation.target, `${relation.id} cannot map a provision to itself`);
  assert(allowedRelationTypes.has(relation.type), `${relation.id} has invalid relation type`);
  assert(typeof relation.rationale === "string" && relation.rationale.length >= 40, `${relation.id} needs a substantive rationale`);
  assert(typeof relation.status === "string" && relation.status.length > 0, `${relation.id} is missing review status`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(relation.verifiedOn), `${relation.id} needs an ISO verifiedOn date`);
}

console.log(
  `Validated ${provisions.length} provisions and ${relations.length} relations.`,
);
