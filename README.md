# Compliance Compass: Global AI Governance and Data Regulation Map & Visualization

An open-source, provision-level knowledge graph and comparative research lab for exploring how AI governance, privacy, data security, and cybersecurity rules connect across jurisdictions.

The project combines a visual regulatory atlas, complete article navigation for selected instruments, qualified crosswalks, legal-status timelines, and side-by-side comparison. It is built for learning and research—not for reducing different legal systems to a single similarity score.

> **Research preview:** mappings are reviewable analytical hypotheses, not findings of legal equivalence, compliance determinations, or legal advice. Always check the current authoritative text and obtain qualified local advice for a real matter.

## What you can explore

- **Global Atlas** — browse legal systems and international frameworks in a fixed, documented comparative order, or rotate a stationary, user-controlled, border-free point-cloud globe whose land pattern is derived from Natural Earth physical geography. Jurisdiction tags support hover, focus, and direct navigation; the compass restores the canonical orientation.
- **Instrument Genome** — browse an instrument chapter by chapter in a titled article list, use curated high-level section summaries for orientation, and open an individual article or provision.
- **Provision Reader** — read stored legal text, an explicit English-coverage notice, or a clearly labelled editorial summary where no source text is stored. Where verified original-language text is stored, the reader defaults to English and exposes the original language after the user selects it. Official English text, government but non-authoritative translations, project-authored references, historical or future-phase references, coverage notices, and editorial summaries remain distinct.
- **Core Concept Constellation** — move from filled theme nodes to outline concept nodes and the legal sources that provide evidence for each concept.
- **Research Lab** — investigate the corpus through four linked phases: five coverage-aware corpus-pattern views; translation-provenance, qualified-relation robustness, and directed operationalization views; exploratory instrument archetypes and a mapping-evidence audit; then prospective applicability, article-level concept structure, neighbourhood robustness, and corpus-granularity diagnostics. Active views can be deep-linked and exported as self-describing JSON, and every analytical mark can be traced back to an instrument, provision, relation, source, or core concept.
- **Animated Connections** — use the graph at right to inspect a provision's immediate relationships, including rationale, limits, evidence basis, confidence, and review state.
- **Timeline** — follow adoption, entry into force, phased application, amendment, revocation, veto, and scheduled commencement events.
- **Compare** — pin two provisions and examine their scope, actors, concepts, legal effect, status, sources, and text availability side by side.
- **Corpus search** — find instruments and provisions by title, locator, jurisdiction, regulatory concept, or—after the on-demand text corpus is loaded—complete stored text.
- **Workspace controls** — use clickable breadcrumbs to return to any point in the current research path; on desktop, collapse or resize the left and right columns by pointer or keyboard; on small screens, open the corpus navigator only when it is needed.
- **Two visual modes** — switch between a near-black **Dark / Geek** workspace and a restrained, paper-like **Bright / Lawyer** workspace without changing the underlying data.

The Global Atlas uses the documented display order **EU → US → China → UK → Canada → Japan → India → Singapore → South Korea → Australia → Brazil → UAE → Saudi Arabia → Taiwan → Hong Kong SAR → Indonesia → Vietnam → South Africa → Nigeria → Switzerland → International / Frameworks / Soft law**. California and Colorado remain nested under the United States, and Dubai remains nested under the UAE. The final lane is parallel to national and regional legal systems. It contains internationally issued materials as well as national voluntary frameworks, guidance, and testing tools whose issuer metadata remains attached to each instrument. Placement supports discovery and does not imply common legal force, institutional origin, or equivalence.

## V2 corpus snapshot

The legal-source and lifecycle snapshot is verified through **2026-07-20**. Relation records carry their own `verifiedOn` dates; analytical work does not silently advance the underlying legal-status cut-off.

The runtime dataset contains:

- **30 jurisdiction and issuing-context records**;
- **58 instruments** spanning the EU, United States and its indexed state systems, China, the United Kingdom, Canada, Japan, India, Singapore, South Korea, Australia, Brazil, the UAE, Saudi Arabia, Taiwan, Hong Kong SAR, Indonesia, Vietnam, South Africa, Nigeria, Switzerland, and international or standards contexts;
- **218 curated source-linked anchors** plus version-locked complete corpora, producing **2,873 unique merged provision and framework nodes** after stable-ID de-duplication;
- **74 qualified relations**—46 candidate and 28 editorial-reviewed—plus **116 lifecycle events**;
- **58 instrument-level source-audit records**, 23 controlled core concepts in 7 themes, 34 curated structure summaries, and **2,873 clause-level topic reviews** (2,333 substantive and 540 structural).

The repository now contains **38 version-locked complete corpora**. They cover the principal indexed binding laws and current/historical public-law texts across the EU, US, China, UK, Canada, Japan, India, Singapore, South Korea, Australia, Brazil, the Gulf states, Taiwan, Hong Kong SAR, Indonesia, Vietnam, South Africa, Nigeria and Switzerland. They also include the complete NIST AI RMF 1.0 hierarchy. Examples include GDPR (99), EU AI Act (113), China CSL (81), UK GDPR (120), Japan APPI (208), Australia Privacy Act (352), Singapore PDPA (106), Hong Kong PDPO (130 bilingual nodes), Swiss FADP (79 four-language nodes), and the current Colorado AI Act session-law corpus.

The machine-generated English-corpus audit covers 22 complete non-English or bilingual corpora: **all 1,337 of 1,337 nodes contain stored English legal/reference text**. **1,332 are aligned to the displayed source version**; the remaining **five** are explicitly marked as next-phase Korean AI Act references effective 21 July 2026. APPI is now 208/208 current-aligned: 172 units use a government reference whose Japanese source text was verified as unchanged, and the 15 changed main-Article/table units plus 21 supplementary blocks use separately labelled project references. Government, public-sector and project-authored references remain distinct; concept mappings and summaries are never substituted as English legal text.

“Complete corpus” means complete within the documented version, language, lifecycle and redistribution boundary. It does not imply that an instrument is currently in force or that every official source may be mirrored. Recitals, annexes, schedules, signatures, amendment instruments or appendices are included only where the relevant manifest expressly says so. Twenty framework, guidance, proposal or historical records remain selected-source indexes because of reuse restrictions, scope boundaries, or the absence of a verified redistributable edition. `source-audit.json` records the boundary separately for every instrument.

Where a documented reuse basis permits redistribution, normalized source text is stored separately from project-authored metadata. Complete project-authored English references are individually marked nonofficial and no-legal-effect, carry source/version/hash records, and are licensed separately under CC BY 4.0; commercial translations are not copied. Where source-text permission has not been established, the interface provides project-authored summaries and authoritative links. In particular, the proposed Canadian AIDA text is not redistributed; Brazil PL 2338 remains a pending bill even though its stored Portuguese proposal now has a complete project English reference; NIST AI RMF is voluntary; and Colorado provisions retain version-specific commencement metadata.

## Why qualified mappings matter

Two provisions can address the same governance problem while differing in regulated actors, triggers, definitions, exceptions, territorial reach, deadlines, enforcement, or legal force. A visual connection therefore does **not** mean that one rule satisfies another.

Each relation records:

| Field | Purpose |
| --- | --- |
| `type` | Describes the relationship, such as partial overlap, implementation, shared origin, or soft-law alignment |
| `rationale` | Explains the useful connection |
| `limits` | States what the reader must not infer |
| `status` | Separates candidate mappings from editorially reviewed mappings |
| `confidence` | Qualitative confidence in the usefulness of the asserted relation—not a compliance percentage |
| `sourceSupport` | Links the official materials used to assess the edge |
| `verifiedOn` | Records when the comparison was last checked |

## Phase 1 research methods

The Research Lab defaults to the **38 version-locked complete corpora** and to provisions reviewed as **substantive** for the project's subject matter. Controls can reveal selected-source instruments and structural provisions, but incomplete coverage is never silently mixed into the default comparative sample.

- **Corpus Observatory** reports the stored coverage, language, legal-force, lifecycle, and topic-review boundary behind each instrument. It is an audit view, not a completeness score for the world's law.
- **Regulatory Genome** applies smoothed inverse-document frequency to provision-level core-concept frequencies, then L2-normalizes each complete-corpus instrument vector. Complete-corpus zeroes, positive lower-bound counts observed in selected/partial corpora, and unknown cells remain visibly distinct; partial denominators never receive prevalence or TF-IDF values. The resulting profile compares emphasis within this corpus; it is not a measure of regulatory quality, strictness, or compliance.
- **Comparative Morphology** preserves provision order and renders every provision as an inspectable band, allowing structural similarities and gaps to be checked against the underlying text.
- **Regulatory Grammar** measures concept co-occurrence within the selected provision sample using count, lift, base-2 PMI, normalized PMI, and Jaccard views. Normalized PMI is the default, with a display floor of three shared provisions across at least two instruments. The matrix separates positive association, negative association, independence, and unavailable or unsupported cells. Because legal sources use unequal provision granularity and long instruments contribute more observations, the floor is not a significance test; association does not establish legal equivalence, causation, or interoperability.
- **Global Time Machine** indexes recorded adoption, commencement, application, amendment, cessation, and scheduled events relative to the **2026-07-20** snapshot. The slider advances through recorded event dates rather than reconstructing the law at every date, and local-text completeness is not presented as complete lifecycle history.

The interface exposes the active sample, denominator, support count, coverage caveats, and drill-down evidence next to the relevant visual. Analytical values are derived locally from versioned repository data; they do not silently change the legal-source snapshot.

## Phase 2 research methods

Phase 2 studies the reliability of the multilingual and relational layers without using an opaque legal-similarity score.

- **Translation Coverage & Authority** audits the 22 complete non-English or bilingual corpora recorded in `english-corpus-coverage.json`. Stored English coverage, publication authority, and temporal alignment are separate variables. An official, government-reference, public-sector, or project-authored rendering retains its own label; 100% stored coverage is never described as translation accuracy or semantic equivalence.
- **Qualified Bridge Atlas** projects qualified analytical relations to an instrument-level, unweighted graph while preserving every provision-level relation as drill-down evidence. Degree, cross-jurisdiction degree, and normalized unweighted betweenness are calculated once for editorial-reviewed relations and again after candidate relations are added. Rank movement therefore measures sensitivity to the project's hypotheses and editorial attention—not global legal influence, regulatory importance, or compliance value.
- **Norm Lineage & Operationalization Paths** includes only explicitly directed `implements`, `operationalizes`, `grounded-in`, `elaborates`, `supports-operational-evidence`, `policy-transition`, `repeals`, and `repeals-and-reenacts` edges. Paths stop at three hops and retain relation type, review state, rationale, limits, sources, instrument dates, legal force, and lifecycle status. Arrow direction preserves the recorded semantic claim; it does not prove chronology, causation, legal diffusion, or one-to-one succession.

All Phase 2 relation details display the rationale and limits together. Candidate mappings remain hypotheses, lifecycle edges remain distinct from substantive mappings, and every source endpoint opens back into the legal text or instrument record.

## Phase 3 research methods

Phase 3 turns the existing fingerprints and qualified mappings into inspectable research models without treating model output as a legal conclusion.

- **Instrument Archetypes** applies deterministic average-linkage hierarchical clustering to the 23-dimensional L2-normalized TF-IDF profiles from the complete-corpus substantive sample. Cosine distance is the only fit feature; jurisdiction, legal force, lifecycle status, and relation edges are excluded and appear only as post-hoc descriptive context. Users may inspect cuts from two to eight neutral groups (`A1`, `A2`, and so on), the real-instrument medoid, within-cluster distance, centroid-minus-corpus concept differences, and silhouette for non-singleton members. A second nearest-neighbour view replaces TF-IDF with normalized concept prevalence to expose method sensitivity. No cut is presented as the correct legal taxonomy.
- **Mapping Evidence Audit** keeps editorial review state, relation class and direction, source count, evidence basis, rationale, limits, verification date, endpoint corpus coverage, legal force, lifecycle status, and jurisdiction span as separate audit dimensions. The concept-by-review view exposes four concepts for which no mapping is currently recorded, and the evidence barcode opens the same rationale, limits, endpoints, core concepts, and primary-source ledger used elsewhere. Empty cells mean `not recorded in this corpus`, never legal absence.

Phase 3 does not produce legal families, equivalence classes, strictness rankings, compliance probabilities, or a composite mapping-quality score. `editorial-reviewed` records remain project review states rather than independent expert or peer review. The clustering and audit are versioned to the repository snapshot and inherit its concept taxonomy, provision granularity, corpus boundaries, and annotation choices.

## Phase 4 research methods

Phase 4 turns time, document structure, metric sensitivity, and annotation coverage into inspectable research diagnostics.

- **Applicability Horizon** starts at the fixed **2026-07-20** snapshot and uses only explicit provision-level `appliesFrom` dates and source-backed lifecycle events. Repeated provision dates are grouped without losing the underlying provision IDs or concepts. Instrument events, provision commencement, and unrecorded dates remain separate; the view is not a reconstruction of every rule applicable on a selected date.
- **Article Concept Microscope** preserves source order and renders every stored provision as an interactive mark. Structure, topic-review state, and mapped core concepts remain separately identifiable, and every mark opens the underlying provision. Concentrated colour means recorded concept assignments in this corpus—not legal importance or regulatory intensity.
- **Neighborhood Stability** compares two separately reported profile geometries: cosine distance over L2-normalized TF-IDF and Hellinger distance over concept-prevalence probability distributions. Leave-one-theme-out runs expose nearest-neighbor rank ranges and show how often the same neighbor remains first; concept-level distance contributions remain inspectable. The view does not convert distance into a similarity percentage or a finding of legal equivalence.
- **Granularity & Corpus Bias** compares provision counts, concept assignments per included provision, structural/substantive composition, and the recorded coverage of actor, scope, and commencement annotations. Complete and selected corpora remain visibly separate, missing fields mean `not recorded`, and script- or translation-dependent text length is not used as a legal-drafting quality measure.

Phase 4 is diagnostic rather than predictive. A future event is not current law at the snapshot, an unrecorded annotation is not proof of legal absence, and a stable computational neighbour is not a substitute for provision-level legal analysis.

## Intended uses

- Learn the structure of a major instrument and follow a concept across borders.
- Scope cross-jurisdiction research before conducting instrument-specific legal analysis.
- Discover potentially relevant obligations, standards, policies, and soft-law materials.
- Compare how differently structured regimes address risk assessment, transparency, security, incident response, data rights, cross-border data, and related concepts.
- Identify stale, future, revoked, vetoed, or non-binding materials before relying on them.
- Build teaching demonstrations, research datasets, or specialist visualizations on top of an inspectable open schema.

The tool is not a substitute for applicability analysis, regulatory monitoring, an authoritative legal database, or professional advice.

## Time and status are part of the graph

The same title can have a different legal effect at different dates. V2 separates adoption, publication, entry into force, general application, cessation, and provision-specific application dates. It also preserves historically useful nodes.

Examples include a partially applicable EU AI Act, revoked EO 14110, vetoed California SB 1047, lapsed Canadian AIDA proposal, superseded Colorado SB 24-205, future-effective Colorado SB 26-189 duties, phased Indian DPDP legislation, enacted Taiwan and Korean AI framework laws, a repealed Vietnamese decree, and voluntary or advisory frameworks. UK GDPR and EU GDPR share an origin but have separate amendment and interpretation histories. Translations and consolidated texts may also lag the legally authoritative version.

Status fields are editorial conclusions as of a recorded date. The event stream explains those conclusions but is not a complete legislative history. See the [V2 dataset guide](data/v2/README.md) for instrument-specific caveats.

## Architecture

The application is intentionally simple to inspect and fork:

```text
app/
  regulation-explorer.tsx    interactive atlas, reader, graph, timeline, compare
  corpus-loader.ts           cached, validated on-demand instrument text loader
  lazy-research-view.tsx     deferred corpus-wide analysis boundary
  regulation-globe.tsx       border-free physical-land point globe and compass
  concept-constellation.tsx  theme, concept, and source-evidence visualization
  research-lab.tsx           fourteen linked corpus, relation, model, and diagnostic views
  research-lab-data.ts       auditable corpus metrics and analytical derivations
data/geo/
  natural-earth-land-110m.json  public-domain physical-land geometry
data/v2/
  client-corpus-index.json   generated lightweight provision and shard index
  jurisdictions.json         jurisdiction and institutional contexts
  instruments.json           legal force, lifecycle, dates, and official sources
  provisions.json            curated source-linked anchors and metadata
  *-articles.json             version-locked complete Article corpora
  *-provisions.json           complete Section/Rule/framework corpora
  provision-concepts.json     clause-level relevance and concept review layer
  concept-themes.json        ordered learning themes for core concepts
  concepts.json              sourced core-concept vocabulary and summaries
  structure-summaries.json   curated section/framework orientation summaries
  relations.json             qualified provision/instrument edges
  status-events.json         auditable lifecycle events
  source-audit.json          one source and coverage audit per instrument
scripts/
  build-client-corpus.mjs    builds the lightweight index and runtime text shards
  expand-global-corpus.mjs   disabled historical bootstrap (not normal maintenance)
  build-source-audit.mjs     rebuilds structured instrument audit companions
  build-provision-concepts.mjs rebuilds clause-level highlight mappings
  import-eu-law.py           EUR-Lex XHTML article importer
  validate-data.mjs          dataset integrity checks
research/
  existing-corpus-audit.md   official-source review of the original corpus
  apac-legal-source-audit.md APAC source, version, language, and lifecycle research
  ame-legal-source-audit.md  Americas, Middle East, Africa, and Swiss research
  proposed-new-relations.json reviewed input for the expanded relation set
```

At build time, the version-locked corpora are split into one runtime shard per instrument plus a lightweight provision index. The Atlas, concept graph and article lists can therefore open without embedding every legal text in the initial JavaScript bundle. Opening an instrument hydrates only its shard; corpus-wide search and the Research Lab load the complete set with visible progress and retry states. Hydrated text is merged with curated provision metadata by stable ID. Official imported text wins for text fields; curated summaries, lifecycle metadata, tags and analytical reviews remain available alongside it. Structure summaries orient readers at section or framework-root level but never replace the underlying provisions. Relations can connect provision or instrument nodes, and all endpoints resolve against the unified graph.

The frontend is built with React, TypeScript, D3 geographic primitives, and a Next-compatible application structure. The corpus is versioned JSON, so a contributor can review data changes in a normal pull request without operating a database.

## Reproducible corpus maintenance

After changing corpus or reviewed metadata, rebuild the derived files in this order:

```bash
node scripts/build-provision-concepts.mjs
node scripts/build-source-audit.mjs
pnpm build:client-corpus
pnpm validate:data
```

The historical expansion writer is deliberately disabled in normal maintenance because it would recreate superseded grouped anchors. The audit and concept builders synchronize already reviewed metadata; they do not browse the web or independently determine current law. Validation checks structure, references, declared coverage, lifecycle-event presence, graph coverage, source rights boundaries and audit completeness, but cannot prove legal accuracy or currentness.

## Run locally

Requirements: Node.js **22.13 or newer** and pnpm **11**.

```bash
pnpm install
pnpm dev
```

Open the local URL shown in the terminal. Run the complete checks before opening a pull request:

```bash
pnpm validate:data
pnpm typecheck
pnpm lint
pnpm test
```

## Data provenance and reuse

Every instrument and relation should point to an official primary source where one is available and record an access or review date. Stored text must state its language, version, completeness, and availability mode. Editorial summaries are labeled as summaries; a link is never presented as locally stored full text.

- Source code is licensed under the [MIT License](LICENSE).
- Original classifications, summaries, mappings, rationales, and editorial metadata are licensed under [CC BY 4.0](DATA-LICENSE.md).
- Official legislation, government publications, translations, standards, reports, names, and third-party material remain subject to their own laws, licenses, and terms.
- The compact national flag components come from the MIT-licensed [`country-flag-icons`](https://github.com/catamphetamine/country-flag-icons) project; international bodies use neutral issuer marks rather than third-party institutional flags or emblems.

The project does not claim that the data license grants rights in incorporated official text. Do not copy commercial standards, paywalled database content, or restricted publications into the repository. In particular, **ISO/IEC 42001 and IEEE Ethically Aligned Design are represented only by metadata, project-authored summaries, and official access links**—not copied publication text. Prefer metadata, structure, original summaries, short lawful excerpts where appropriate, and an official access or purchase link.

## Contributing

Corrections are as valuable as new coverage. Useful contributions include a current official source, a lifecycle correction, a better scope caveat, a challenged relation, a new provision-level mapping, an accessibility improvement, or a new visualization.

For a data contribution:

1. Start with the jurisdiction and instrument record; record legal force, version, lifecycle status, and distinct legal dates.
2. Add provision metadata using a stable ID and identify actors, scope, concepts, source, text availability, and provision-level effect.
3. Add a relation only after comparing actors, triggers, duties, exceptions, timing, territorial scope, and legal force.
4. Write both a concise `rationale` and explicit `limits`; use `candidate` unless the mapping has completed the project's review process.
5. Add status events needed to explain the instrument's current state, including scheduled future events.
6. Add or update a concise, source-grounded structure summary when introducing a rendered section or framework root.
7. Run all quality checks and keep the pull request focused.

Do not edit generated EU corpus files by hand. Fix or update the source import and regenerate them reproducibly. Read [CONTRIBUTING.md](CONTRIBUTING.md), the [dataset overview](data/README.md), and the detailed [V2 schema and review guide](data/v2/README.md) before submitting a change.

## Roadmap

- Add offline shard caching and integrity manifests for large-corpus field research.
- Expand complete, versioned instrument coverage without weakening source and reuse controls.
- Extend the Global Time Machine to date-selectable provision states and amendment lineage.
- Separate candidate, editorially reviewed, and independently expert-reviewed mappings.
- Add jurisdiction, actor, legal-force, lifecycle, and concept filters.
- Publish citable dataset releases and machine-readable provenance.
- Improve multilingual navigation while keeping the authoritative-language/version boundary visible.

## Legal and research disclaimer

This project is provided for research and educational purposes only and does not constitute legal advice. It may be incomplete, outdated, mistranslated, or affected by jurisdiction-specific definitions, exceptions, guidance, implementation, enforcement, and later amendments. A graph edge describes a possible functional, historical, structural, or thematic relationship; it does not establish equivalence, interoperability, or compliance.

Citation metadata is available in [`CITATION.cff`](CITATION.cff).
