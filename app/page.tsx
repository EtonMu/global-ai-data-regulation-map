"use client";

import { useMemo, useState } from "react";
import provisionsJson from "@/data/provisions.json";
import relationsJson from "@/data/relations.json";

type Region = "EU" | "US" | "CN" | "INT";

type Provision = {
  id: string;
  instrument: string;
  provision: string;
  jurisdiction: string;
  region: Region;
  binding: string;
  title: string;
  summary: string;
  topics: string[];
  source: string;
  sourceLabel: string;
  applicationStatus?: string;
};

type Relation = {
  id: string;
  topic: string;
  source: string;
  target: string;
  type: RelationType;
  status: string;
  verifiedOn: string;
  rationale: string;
};

type RelationType =
  | "functional-equivalent"
  | "partial-overlap"
  | "operationalizes"
  | "aligned-with"
  | "complements"
  | "depends-on";

type TopicDefinition = {
  label: string;
  kicker: string;
  description: string;
  rows: Array<{
    id: string;
    label: string;
    provisionIds: string[];
  }>;
};

const provisions = provisionsJson as Provision[];
const relations = relationsJson as Relation[];
const repositoryUrl = "https://github.com/EtonMu/global-ai-data-regulation-map";

const regions: Array<{ id: Region; label: string }> = [
  { id: "EU", label: "European Union" },
  { id: "US", label: "United States / California" },
  { id: "CN", label: "China" },
  { id: "INT", label: "International frameworks" },
];

const topics: Record<string, TopicDefinition> = {
  "incident-response": {
    label: "Incident notification & response",
    kicker: "Breach and incident duties",
    description:
      "Compare how privacy, cybersecurity and operational frameworks structure incident response and notification.",
    rows: [
      {
        id: "privacy-incident",
        label: "Personal-data incident duties",
        provisionIds: [
          "eu-gdpr-33",
          "ca-civ-1798-82",
          "cn-pipl-57",
          "cn-csl-44",
        ],
      },
      {
        id: "cyber-incident",
        label: "Cyber incident reporting & response",
        provisionIds: ["eu-nis2-23", "nist-csf-rs"],
      },
    ],
  },
  "automated-decisions": {
    label: "Automated decision-making",
    kicker: "People, systems and explanations",
    description:
      "Trace individual safeguards and system-transparency expectations across binding law and voluntary AI frameworks.",
    rows: [
      {
        id: "individual-safeguards",
        label: "Individual safeguards",
        provisionIds: ["eu-gdpr-22", "cn-pipl-24"],
      },
      {
        id: "system-transparency",
        label: "System transparency & documentation",
        provisionIds: [
          "eu-ai-act-13",
          "nist-ai-rmf-map-2-2",
          "oecd-ai-1-3",
        ],
      },
    ],
  },
  "risk-assessment": {
    label: "Risk & impact assessment",
    kicker: "From impact assessment to lifecycle controls",
    description:
      "See where privacy assessments, AI risk management and cybersecurity risk duties overlap—and where their scope diverges.",
    rows: [
      {
        id: "impact-assessment",
        label: "Rights-focused impact assessment",
        provisionIds: ["eu-gdpr-35", "cn-pipl-55"],
      },
      {
        id: "lifecycle-risk",
        label: "AI lifecycle risk management",
        provisionIds: [
          "eu-ai-act-9",
          "nist-ai-rmf-manage",
          "oecd-ai-1-4",
        ],
      },
      {
        id: "cyber-risk",
        label: "Cybersecurity risk management",
        provisionIds: ["eu-nis2-21"],
      },
    ],
  },
  "cross-border": {
    label: "Cross-border data transfers",
    kicker: "Transfer mechanisms and safeguards",
    description:
      "Compare how legal regimes and international principles condition personal-data movement across borders.",
    rows: [
      {
        id: "transfer-conditions",
        label: "Transfer conditions & mechanisms",
        provisionIds: ["eu-gdpr-44", "cn-pipl-38", "oecd-privacy-17"],
      },
      {
        id: "transfer-transparency",
        label: "Notice & consent safeguards",
        provisionIds: ["cn-pipl-39"],
      },
    ],
  },
  "security-by-design": {
    label: "Security safeguards",
    kicker: "Technical and organisational controls",
    description:
      "Explore risk-proportionate safeguards for personal data, networks and high-risk AI systems.",
    rows: [
      {
        id: "data-security",
        label: "Personal-data safeguards",
        provisionIds: ["eu-gdpr-32", "cn-pipl-51", "nist-csf-pr"],
      },
      {
        id: "system-security",
        label: "AI & network security controls",
        provisionIds: [
          "eu-ai-act-15",
          "eu-nis2-21",
          "cn-csl-23",
          "oecd-ai-1-4",
        ],
      },
    ],
  },
};

const relationLabels: Record<RelationType, string> = {
  "functional-equivalent": "Close functional alignment",
  "partial-overlap": "Partial overlap",
  operationalizes: "Operationalizes principle",
  "aligned-with": "Aligned outcome",
  complements: "Complementary duty",
  "depends-on": "Depends on",
};

const provisionById = new Map(provisions.map((item) => [item.id, item]));

function getTopicProvisionIds(topicId: string) {
  return topics[topicId].rows.flatMap((row) => row.provisionIds);
}

function findConnectedRelations(topicId: string, provisionId: string) {
  return relations.filter(
    (relation) =>
      relation.topic === topicId &&
      (relation.source === provisionId || relation.target === provisionId),
  );
}

function getOtherProvisionId(relation: Relation, provisionId: string) {
  return relation.source === provisionId ? relation.target : relation.source;
}

export default function Home() {
  const [selectedTopic, setSelectedTopic] = useState("incident-response");
  const [selectedProvisionId, setSelectedProvisionId] =
    useState("eu-gdpr-33");
  const [selectedRelationId, setSelectedRelationId] = useState("rel-012");

  const topic = topics[selectedTopic];
  const topicProvisionIds = useMemo(
    () => new Set(getTopicProvisionIds(selectedTopic)),
    [selectedTopic],
  );
  const selectedProvision = provisionById.get(selectedProvisionId)!;
  const connectedRelations = useMemo(
    () => findConnectedRelations(selectedTopic, selectedProvisionId),
    [selectedTopic, selectedProvisionId],
  );

  const effectiveRelationId = connectedRelations.some(
    (relation) => relation.id === selectedRelationId,
  )
    ? selectedRelationId
    : (connectedRelations[0]?.id ?? "");
  const activeRelation = relations.find(
    (relation) => relation.id === effectiveRelationId,
  );
  const relatedProvision = activeRelation
    ? provisionById.get(
        getOtherProvisionId(activeRelation, selectedProvisionId),
      )
    : undefined;

  const relationByConnectedId = useMemo(() => {
    const result = new Map<string, Relation>();
    connectedRelations.forEach((relation) => {
      result.set(
        getOtherProvisionId(relation, selectedProvisionId),
        relation,
      );
    });
    return result;
  }, [connectedRelations, selectedProvisionId]);

  function changeTopic(topicId: string) {
    const firstProvisionId = getTopicProvisionIds(topicId)[0];
    setSelectedTopic(topicId);
    setSelectedProvisionId(firstProvisionId);
    setSelectedRelationId("");
  }

  function selectProvision(provisionId: string) {
    const directRelation = relationByConnectedId.get(provisionId);
    setSelectedProvisionId(provisionId);
    if (directRelation) {
      setSelectedRelationId(directRelation.id);
    }
  }

  const uniqueInstruments = new Set(provisions.map((item) => item.instrument));

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Global AI Data Regulation Map home">
          <span>GLOBAL AI · DATA</span>
          <span>REGULATION MAP</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#explorer">Explore</a>
          <a href="#methodology">Methodology</a>
          <a href="#contribute">Contribute</a>
          <a href={repositoryUrl} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </nav>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">Open regulatory crosswalk · Research preview</p>
        <h1>Trace one regulatory obligation across borders.</h1>
        <p className="intro-copy">
          An evidence-linked map of AI governance, privacy, data security and
          cybersecurity rules—built to show relationships without pretending
          they are legally equivalent.
        </p>
        <div className="coverage-line" aria-label="Seed dataset coverage">
          <span>{uniqueInstruments.size} instruments</span>
          <span>{provisions.length} provisions</span>
          <span>{relations.length} mapping hypotheses</span>
          <span>4 regulatory regions</span>
        </div>
      </section>

      <section className="explorer" id="explorer" aria-labelledby="explorer-title">
        <div className="explorer-heading">
          <div>
            <p className="eyebrow">Regulatory crosswalk lattice</p>
            <h2 id="explorer-title">{topic.kicker}</h2>
            <p>{topic.description}</p>
          </div>
          <label className="topic-control">
            <span>Explore topic</span>
            <select
              value={selectedTopic}
              onChange={(event) => changeTopic(event.target.value)}
            >
              {Object.entries(topics).map(([id, definition]) => (
                <option key={id} value={id}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relation-legend" aria-label="Mapping relation legend">
          {(Object.entries(relationLabels) as Array<[RelationType, string]>).map(
            ([type, label]) => (
              <span key={type} className={`legend-item relation-${type}`}>
                <span className="legend-mark" aria-hidden="true" />
                {label}
              </span>
            ),
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {topicProvisionIds.size} provisions shown for {topic.label}.
        </p>

        <div className="crosswalk-wrap">
          <table className="crosswalk-table">
            <caption className="sr-only">
              Cross-jurisdiction comparison for {topic.label}. Select a
              provision to inspect its mapped relationships.
            </caption>
            <thead>
              <tr>
                <th scope="col">Normalized obligation</th>
                {regions.map((region) => (
                  <th scope="col" key={region.id}>
                    <span className="region-code">{region.id}</span>
                    {region.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topic.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {regions.map((region) => {
                    const cellProvisions = row.provisionIds
                      .map((id) => provisionById.get(id))
                      .filter(
                        (item): item is Provision => item?.region === region.id,
                      );

                    return (
                      <td key={region.id} data-region={region.label}>
                        {cellProvisions.length ? (
                          <div className="provision-stack">
                            {cellProvisions.map((provision) => {
                              const isSelected =
                                provision.id === selectedProvisionId;
                              const connection = relationByConnectedId.get(
                                provision.id,
                              );
                              const isDimmed =
                                provision.id !== selectedProvisionId &&
                                !connection;

                              return (
                                <button
                                  key={provision.id}
                                  type="button"
                                  className={`provision-node region-${
                                    provision.region.toLowerCase()
                                  }${isSelected ? " is-selected" : ""}${
                                    connection ? " is-connected" : ""
                                  }${isDimmed ? " is-dimmed" : ""}`}
                                  aria-pressed={isSelected}
                                  aria-label={`${provision.instrument} ${provision.provision}: ${provision.title}`}
                                  onClick={() => selectProvision(provision.id)}
                                >
                                  <span className="node-instrument">
                                    {provision.instrument}
                                  </span>
                                  <span className="node-provision">
                                    {provision.provision}
                                  </span>
                                  {isSelected && (
                                    <span className="node-relation">Anchor</span>
                                  )}
                                  {!isSelected && connection && (
                                    <span
                                      className={`node-relation relation-${connection.type}`}
                                    >
                                      {relationLabels[connection.type]}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="empty-cell" aria-label="No seed mapping">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="evidence" aria-labelledby="evidence-title">
          <div className="evidence-anchor">
            <p className="eyebrow">Selected provision</p>
            <h3 id="evidence-title">
              {selectedProvision.instrument} {selectedProvision.provision}
            </h3>
            <p className="provision-title">{selectedProvision.title}</p>
            <p>{selectedProvision.summary}</p>
            <div className="source-row">
              <span>{selectedProvision.jurisdiction}</span>
              <span>{selectedProvision.binding}</span>
              {selectedProvision.applicationStatus && (
                <span>{selectedProvision.applicationStatus}</span>
              )}
              <a
                href={selectedProvision.source}
                target="_blank"
                rel="noreferrer"
              >
                Official source at {selectedProvision.sourceLabel} ↗
              </a>
            </div>
          </div>

          <div className="evidence-mapping">
            <p className="eyebrow">Mapped connection</p>
            {connectedRelations.length > 0 ? (
              <>
                <div className="connection-list" aria-label="Mapped connections">
                  {connectedRelations.map((relation) => {
                    const target = provisionById.get(
                      getOtherProvisionId(relation, selectedProvisionId),
                    )!;
                    return (
                      <button
                        key={relation.id}
                        type="button"
                        className={
                          relation.id === effectiveRelationId ? "is-active" : ""
                        }
                        aria-pressed={relation.id === effectiveRelationId}
                        onClick={() => setSelectedRelationId(relation.id)}
                      >
                        {target.instrument} {target.provision}
                      </button>
                    );
                  })}
                </div>
                {activeRelation && relatedProvision && (
                  <div className="mapping-explanation">
                    <div className="mapping-label-row">
                      <span className={`mapping-type relation-${activeRelation.type}`}>
                        {relationLabels[activeRelation.type]}
                      </span>
                      <span>{activeRelation.status}</span>
                      <span>Checked {activeRelation.verifiedOn}</span>
                    </div>
                    <h3>
                      {relatedProvision.instrument} {relatedProvision.provision}
                    </h3>
                    <p>{activeRelation.rationale}</p>
                    <a
                      href={relatedProvision.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Verify related provision at {relatedProvision.sourceLabel} ↗
                    </a>
                  </div>
                )}
              </>
            ) : (
              <p>No direct mapping is included in the seed dataset yet.</p>
            )}
          </div>
        </section>
      </section>

      <section className="methodology" id="methodology" aria-labelledby="method-title">
        <div className="section-heading">
          <p className="eyebrow">Methodology</p>
          <h2 id="method-title">Every line is an argument, not a conclusion.</h2>
        </div>
        <div className="method-steps">
          <article>
            <span>01</span>
            <h3>Normalize the obligation</h3>
            <p>
              Break each source into a scoped duty, trigger, subject and
              exception—without reproducing restricted texts.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Describe the relationship</h3>
            <p>
              Use typed mappings such as partial overlap, complementary duty or
              functional alignment instead of a generic “equivalent.”
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Keep the evidence visible</h3>
            <p>
              Link to authoritative sources, state the mapping rationale and
              expose review status so contributors can challenge it.
            </p>
          </article>
        </div>
      </section>

      <section className="contribute" id="contribute" aria-labelledby="contribute-title">
        <div>
          <p className="eyebrow">Open research infrastructure</p>
          <h2 id="contribute-title">Improve the map, one reviewable link at a time.</h2>
        </div>
        <div>
          <p>
            The seed dataset is intentionally small. Contributions can add an
            official source, propose a mapping, document a limitation or flag a
            changed rule through a{" "}
            <a href={repositoryUrl} target="_blank" rel="noreferrer">
              GitHub issue or pull request ↗
            </a>
            .
          </p>
          <p className="disclaimer">
            Research and educational use only. This project does not provide
            legal advice, and a mapped relationship does not establish legal
            equivalence or compliance.
          </p>
        </div>
      </section>

      <footer>
        <a href={repositoryUrl} target="_blank" rel="noreferrer">
          global-ai-data-regulation-map ↗
        </a>
        <span>Seed review · July 2026</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
