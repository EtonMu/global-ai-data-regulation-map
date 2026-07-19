# Dataset overview

`data/v2/` is the active corpus for the Global AI · Data Regulation Map. It is a versioned, time-aware knowledge graph rather than a flat list of look-alike provisions.

Read the complete [V2 schema, merge, status, source, and review guide](v2/README.md) before changing the dataset.

> **Research data:** records and mappings support education and investigation. They are not authoritative legal texts, legal-equivalence findings, compliance determinations, or legal advice.

## Snapshot

The V2 seed was reviewed through **2026-07-19** and contains:

| Layer | File | Current scope |
| --- | --- | --- |
| Jurisdictions | `v2/jurisdictions.json` | 11 country, subnational, supranational, and institutional-context nodes |
| Instruments | `v2/instruments.json` | 19 laws, regulations, orders, bills, policies, frameworks, soft-law instruments, and reports |
| Curated provisions | `v2/provisions.json` | 47 representative non-EU nodes and high-value EU metadata records |
| Generated EU articles | `v2/gdpr-articles.json` | Complete 99-article GDPR corpus imported from official EUR-Lex XHTML |
| Generated EU AI Act articles | `v2/eu-ai-act-articles.json` | Complete 113-article EU AI Act corpus imported from official EUR-Lex XHTML |
| Concepts | `v2/concepts.json` | 12 neutral regulatory concepts |
| Relations | `v2/relations.json` | 38 qualified analytical edges |
| Status history | `v2/status-events.json` | 48 completed or scheduled lifecycle events |

After merging generated and curated records by stable ID, the application exposes 249 unique provision nodes.

The root-level `provisions.json` and `relations.json` are the earlier MVP dataset. They remain for transition and historical reproducibility; new corpus work belongs in `data/v2/`.

## Design principles

The model keeps six things separate:

1. **Jurisdiction or issuing context** — a country, supranational system, subnational system, international organization, or intergovernmental context.
2. **Instrument** — its form, issuer, legal force, lifecycle, version, dates, and official source.
3. **Provision** — its locator, hierarchy, actors, scope, concepts, text availability, and provision-specific effect.
4. **Concept** — a neutral browsing layer that connects differently worded approaches without declaring them equivalent.
5. **Relation** — a qualified analytical argument with rationale, limits, evidence, confidence, review status, and source support.
6. **Status event** — a dated explanation of adoption, commencement, application, amendment, revocation, veto, or another lifecycle change.

Do not collapse these layers. In particular, a concept match is not a legal mapping, a mapping is not legal equivalence, an instrument's status may not describe every provision, and adoption is not the same event as entry into force or application.

## Text and provenance rules

The two generated EU files contain English article text and hierarchy imported from the official EUR-Lex publications. They intentionally exclude recitals, signatures, and footnotes. Curated metadata with the same stable provision ID is merged into those records without replacing official imported text.

For most other instruments, the repository stores original summaries, metadata, and official links—not full text. `textAvailability.mode`, `stored`, `language`, and the accompanying note must accurately describe what is present. The interface must label editorial summaries as summaries and must not describe an external link as stored full text.

Every new or revised record should:

- prefer an official primary source;
- identify the source version or consolidation where relevant;
- record an access or review date;
- distinguish authoritative text from a reference translation;
- distinguish current, future, revoked, vetoed, superseded, non-binding, voluntary, and advisory material;
- avoid copied commercial standards, paywalled database text, and restricted publications.

Official laws, publications, translations, standards, and reports remain subject to their own rights and terms. The repository's [CC BY 4.0 data license](../DATA-LICENSE.md) covers original project classifications, summaries, mappings, rationales, and editorial metadata; it does not claim or grant additional rights in third-party source material.

## Merge contract

Consumers should load and merge V2 data in this order:

1. Load jurisdictions, concepts, and instruments.
2. Load the generated GDPR and EU AI Act article corpora.
3. Merge curated provisions by stable `id`, preserving imported official text and hierarchy while adding intentional editorial metadata.
4. Resolve every provision or instrument endpoint in `relations.json` against the unified graph.
5. Apply `status-events.json` relative to the selected or current date.
6. Render source, language, legal force, lifecycle status, rationale, and limits as visible data.

Complete EU Article IDs follow `eu-gdpr-art-<number>` and `eu-ai-act-art-<number>`. IDs are durable references: do not change one merely because a title or summary changes. Model a renumbered or replaced provision as a new version/node and add lineage instead of silently changing its legal referent.

## Contribution workflow

Before proposing a new record or mapping:

1. Verify the current official source and instrument version.
2. Record adoption, publication, entry-into-force, application, and cessation dates separately; use `null` when a date is genuinely unavailable or inapplicable.
3. Mark proposals, bills, revoked orders, repealed rules, phased provisions, and scheduled future events explicitly.
4. For a provision, identify actors, triggers, scope, legal effect, language, and text availability.
5. For a relation, compare definitions, actors, triggers, duties, exceptions, timing, territorial scope, enforcement, and legal force.
6. Write both `rationale` and `limits`. Qualitative confidence concerns the usefulness of the relation, never a percentage of equivalence or compliance.
7. Default a new relation to `candidate` unless it has completed the documented editorial review process.
8. Validate IDs, cross-references, HTTPS sources, and ISO dates before merging.

Do not manually edit the generated GDPR or EU AI Act JSON. Update the reproducible EUR-Lex import input/process and regenerate the corpus.

Run the project checks after any data change:

```bash
pnpm validate:data
pnpm typecheck
pnpm lint
pnpm test
```

The detailed field definitions, text-availability modes, temporal caveats, merge behavior, and review questions live in [`data/v2/README.md`](v2/README.md).
