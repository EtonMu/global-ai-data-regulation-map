# Global AI · Data Regulation Map

An open-source, provision-level knowledge graph for exploring how AI governance, privacy, data security, and cybersecurity rules connect across jurisdictions.

The project combines a visual regulatory atlas, complete article navigation for selected instruments, qualified crosswalks, legal-status timelines, and side-by-side comparison. It is built for learning and research—not for reducing different legal systems to a single similarity score.

> **Research preview:** mappings are reviewable analytical hypotheses, not findings of legal equivalence, compliance determinations, or legal advice. Always check the current authoritative text and obtain qualified local advice for a real matter.

## What you can explore

- **Global Atlas** — enter through a jurisdiction-neutral map instead of treating any one law as the center of the world.
- **Instrument Genome** — browse an instrument chapter by chapter and open an individual article or provision.
- **Provision Reader** — distinguish stored official text from an editorial summary or an official-source link.
- **Connections** — inspect a provision's immediate relationships, including the rationale, limits, evidence basis, confidence, and review state for each edge.
- **Timeline** — follow adoption, entry into force, phased application, amendment, revocation, veto, and scheduled commencement events.
- **Compare** — pin two provisions and examine their scope, actors, concepts, legal effect, status, sources, and text availability side by side.
- **Corpus search** — find instruments and provisions by title, locator, jurisdiction, or regulatory concept.

The interface uses a dark regulatory-intelligence / terminal aesthetic while keeping the graph deliberately bounded: it shows useful one-hop context rather than an unreadable network hairball.

## V2 corpus snapshot

The current dataset was reviewed through **2026-07-19** and contains:

- 11 jurisdiction or institutional-context nodes;
- 19 instruments across the EU, United States and California, China, the United Kingdom, Japan, Canada, India, the G7, and the UN;
- 249 unified provision nodes after merging generated and curated records;
- 38 qualified relations, 48 lifecycle events, and 12 controlled regulatory concepts;
- all **99 GDPR articles** and all **113 EU AI Act articles**, with English article text and hierarchy imported from the official EUR-Lex publications.

The 19-instrument seed includes binding law, phased legislation, executive policy, an unenacted bill, government-internal policy, voluntary frameworks, soft law, and an advisory report. Legal force and lifecycle status are first-class data—not styling trivia.

Complete stored article corpora are currently limited to the GDPR and EU AI Act. For most other instruments, the repository provides structured metadata, editorial summaries, and official links rather than copying source text. The EU imports include enacted article text and structural hierarchy; recitals, signatures, and footnotes remain at EUR-Lex.

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
data/v2/
  jurisdictions.json         jurisdiction and institutional contexts
  instruments.json           legal force, lifecycle, dates, and official sources
  provisions.json            curated provision metadata and summaries
  gdpr-articles.json          generated official GDPR article corpus
  eu-ai-act-articles.json     generated official EU AI Act article corpus
  concepts.json              neutral regulatory vocabulary
  relations.json             qualified provision/instrument edges
  status-events.json         auditable lifecycle events
scripts/
  import-eu-law.py           EUR-Lex XHTML article importer
  validate-data.mjs          dataset integrity checks
```

At runtime the two generated EU corpora are merged with curated provision metadata by stable ID. Official imported text wins for text fields; curated summaries, tags, status, and analytical metadata remain available alongside it. Relations can connect provision or instrument nodes, and all endpoints resolve against the unified graph.

The frontend is built with React, TypeScript, and a Next-compatible application structure. The corpus is versioned JSON, so a contributor can review data changes in a normal pull request without operating a database.

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

The project does not claim that the data license grants rights in incorporated official text. Do not copy commercial standards, paywalled database content, or restricted publications into the repository. Prefer metadata, structure, original summaries, short lawful excerpts where appropriate, and an official access or purchase link.

## Contributing

Corrections are as valuable as new coverage. Useful contributions include a current official source, a lifecycle correction, a better scope caveat, a challenged relation, a new provision-level mapping, an accessibility improvement, or a new visualization.

For a data contribution:

1. Start with the jurisdiction and instrument record; record legal force, version, lifecycle status, and distinct legal dates.
2. Add provision metadata using a stable ID and identify actors, scope, concepts, source, text availability, and provision-level effect.
3. Add a relation only after comparing actors, triggers, duties, exceptions, timing, territorial scope, and legal force.
4. Write both a concise `rationale` and explicit `limits`; use `candidate` unless the mapping has completed the project's review process.
5. Add status events needed to explain the instrument's current state, including scheduled future events.
6. Run all quality checks and keep the pull request focused.

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
