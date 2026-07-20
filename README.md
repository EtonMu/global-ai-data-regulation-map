# Compliance Compass: Global AI Governance and Data Regulation Map & Visualization

An open-source, provision-level knowledge graph for exploring how AI governance, privacy, data security, and cybersecurity rules connect across jurisdictions.

The project combines a visual regulatory atlas, complete article navigation for selected instruments, qualified crosswalks, legal-status timelines, and side-by-side comparison. It is built for learning and research—not for reducing different legal systems to a single similarity score.

> **Research preview:** mappings are reviewable analytical hypotheses, not findings of legal equivalence, compliance determinations, or legal advice. Always check the current authoritative text and obtain qualified local advice for a real matter.

## What you can explore

- **Global Atlas** — browse legal systems and international frameworks in a fixed, documented comparative order, or rotate a border-free point-cloud globe whose land pattern is derived from Natural Earth physical geography.
- **Instrument Genome** — browse an instrument chapter by chapter in a titled article list, use curated high-level section summaries for orientation, and open an individual article or provision.
- **Provision Reader** — read the selected legal text or clearly labeled editorial summary in the center workspace; stored Chinese and Japanese originals can switch to separately labeled English translations.
- **Core Concept Constellation** — move from filled theme nodes to outline concept nodes and the legal sources that provide evidence for each concept.
- **Animated Connections** — use the graph at right to inspect a provision's immediate relationships, including rationale, limits, evidence basis, confidence, and review state.
- **Timeline** — follow adoption, entry into force, phased application, amendment, revocation, veto, and scheduled commencement events.
- **Compare** — pin two provisions and examine their scope, actors, concepts, legal effect, status, sources, and text availability side by side.
- **Corpus search** — find instruments and provisions by title, locator, jurisdiction, or regulatory concept.
- **Two visual modes** — switch between a near-black **Dark / Geek** workspace and a restrained, paper-like **Bright / Lawyer** workspace without changing the underlying data.

The legal-source navigation uses a fixed order—**EU, US, China, UK, Canada, Japan, India**—with California nested under the US. **International / Frameworks / Soft law** is a parallel top-level lane, not a country and not a child of any one national system. A peer **Core Concepts** sidebar index organizes sourced learning summaries by theme without presenting concepts as jurisdictions or legal instruments. Each national, regional, or subnational legal-system entry is paired with its flag; international and standards contexts use issuer or framework icons rather than fictional flags. Instrument-type icons, status symbols, and relation cues provide further orientation without replacing text labels. The bounded, animated graph presents one-hop relationships while preserving readable labels and qualified mapping metadata.

## V2 corpus snapshot

The current dataset was reviewed through **2026-07-19** and contains:

- 15 jurisdiction, subnational, or institutional-context nodes;
- 23 instruments across the EU, United States and California, China, the United Kingdom, Canada, Japan, India, and international or standards contexts;
- 332 unified provision nodes after merging generated and curated records;
- 42 qualified relations, 54 lifecycle events, 23 controlled core concepts in 7 themes, and 34 curated high-level structure summaries;
- all **99 GDPR articles** and all **113 EU AI Act articles**, with English article text and hierarchy imported from the official EUR-Lex publications;
- all **81 articles of China's Cybersecurity Law as amended in 2025 and effective from 1 January 2026**, with the current official Chinese text, official chapter/section structure, and clearly identified non-official English reference translations.

The 23-instrument seed includes binding law, phased legislation, executive policy, an unenacted bill, government-internal policy, voluntary frameworks, standards, soft law, declarations, and an advisory report. Its framework and soft-law coverage includes **NIST AI RMF 1.0, ISO/IEC 42001, IEEE Ethically Aligned Design, OECD AI Principles, the Bletchley Declaration (2023), the Hiroshima AI Process,** and the **UN Advisory Body's _Governing AI for Humanity_** report. Legal force and lifecycle status are first-class data—not styling trivia.

Complete stored article corpora are currently limited to the GDPR, EU AI Act, and the current 81-article Chinese Cybersecurity Law. Selected Chinese and Japanese provisions from other instruments also include verified original-language text and labeled English reference translations. For most remaining instruments, the repository provides structured metadata, editorial summaries, and official links rather than copying source text. The EU imports include enacted article text and structural hierarchy; recitals, signatures, and footnotes remain at EUR-Lex.

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

Examples in this snapshot include a partially applicable EU AI Act, a revoked EO 14110, a vetoed California SB 1047, phased Indian DPDP legislation, and voluntary or advisory frameworks. UK GDPR and EU GDPR share an origin but have separate amendment and interpretation histories. Translations and consolidated texts may also lag the legally authoritative version.

Status fields are editorial conclusions as of a recorded date. The event stream explains those conclusions but is not a complete legislative history. See the [V2 dataset guide](data/v2/README.md) for instrument-specific caveats.

## Architecture

The application is intentionally simple to inspect and fork:

```text
app/
  regulation-explorer.tsx    interactive atlas, reader, graph, timeline, compare
  regulation-globe.tsx       border-free physical-land point globe and compass
  concept-constellation.tsx  theme, concept, and source-evidence visualization
data/geo/
  natural-earth-land-110m.json  public-domain physical-land geometry
data/v2/
  jurisdictions.json         jurisdiction and institutional contexts
  instruments.json           legal force, lifecycle, dates, and official sources
  provisions.json            curated provision metadata and summaries
  gdpr-articles.json          generated official GDPR article corpus
  eu-ai-act-articles.json     generated official EU AI Act article corpus
  concept-themes.json        ordered learning themes for core concepts
  concepts.json              sourced core-concept vocabulary and summaries
  structure-summaries.json   curated section/framework orientation summaries
  relations.json             qualified provision/instrument edges
  status-events.json         auditable lifecycle events
scripts/
  import-eu-law.py           EUR-Lex XHTML article importer
  validate-data.mjs          dataset integrity checks
```

At runtime the two generated EU corpora are merged with curated provision metadata by stable ID. Official imported text wins for text fields; curated summaries, tags, status, and analytical metadata remain available alongside it. Structure summaries orient readers at section or framework-root level but never replace the underlying provisions. Relations can connect provision or instrument nodes, and all endpoints resolve against the unified graph.

The frontend is built with React, TypeScript, D3 geographic primitives, and a Next-compatible application structure. The corpus is versioned JSON, so a contributor can review data changes in a normal pull request without operating a database.

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

- Split and lazy-load complete instrument text as the corpus grows, while keeping the graph index fast.
- Expand complete, versioned instrument coverage without weakening source and reuse controls.
- Add date-selectable graph states and amendment lineage at provision level.
- Separate candidate, editorially reviewed, and independently expert-reviewed mappings.
- Add jurisdiction, actor, legal-force, lifecycle, and concept filters.
- Publish citable dataset releases and machine-readable provenance.
- Improve multilingual navigation while keeping the authoritative-language/version boundary visible.

## Legal and research disclaimer

This project is provided for research and educational purposes only and does not constitute legal advice. It may be incomplete, outdated, mistranslated, or affected by jurisdiction-specific definitions, exceptions, guidance, implementation, enforcement, and later amendments. A graph edge describes a possible functional, historical, structural, or thematic relationship; it does not establish equivalence, interoperability, or compliance.

Citation metadata is available in [`CITATION.cff`](CITATION.cff).
