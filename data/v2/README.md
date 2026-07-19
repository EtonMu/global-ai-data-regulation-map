# V2 global regulation graph seed

This directory is a time-aware, multi-jurisdiction seed for the next visualization. It models jurisdictions, instruments, provisions, regulatory concepts, analytical relations, and lifecycle events separately so the interface can answer both of these questions:

1. What does this instrument or provision say and what is its legal status on a given date?
2. What other provisions address a similar regulatory function, and where does that comparison break down?

The dataset snapshot is verified through **2026-07-19**. It is a research aid, not legal advice, a complete legal corpus, or a compliance determination.

## Files

- `jurisdictions.json`: countries, supranational systems, subnational systems, and international institutional contexts.
- `instruments.json`: laws, regulations, executive orders, bills, rules, mandatory internal directives, voluntary frameworks, soft law, and advisory reports.
- `provisions.json`: representative provision-level nodes outside the complete EU imports, plus curated metadata for high-value EU provisions.
- `concepts.json`: a small controlled vocabulary used to connect differently worded legal duties.
- `relations.json`: qualified analytical edges between provision or instrument nodes.
- `status-events.json`: dated lifecycle events such as adoption, entry into force, partial application, amendment, revocation, veto, and scheduled commencement.
- `gdpr-articles.json`: generated complete GDPR Article corpus from EUR-Lex; produced by the EU-law import script.
- `eu-ai-act-articles.json`: generated complete EU AI Act Article corpus from EUR-Lex; produced by the EU-law import script.

The two generated EU Article files are intentionally separate from this hand-curated seed. An application should merge all provision sources by stable `id`, prefer the generated official full-text record for text, and preserve curated relation/status metadata from `provisions.json`.

## Stable IDs

IDs are lowercase and scoped by jurisdiction and instrument. Complete EU Article IDs use:

```text
eu-gdpr-art-<number>
eu-ai-act-art-<number>
```

Do not change an ID merely because a title or summary is edited. If an amendment renumbers a provision, add the new provision/version and connect the lineage instead of silently reusing an ID with a different legal referent.

## `jurisdictions.json`

Each object contains:

- `id`: stable jurisdiction or institutional-context ID.
- `name` and `shortName`: display labels.
- `type`: `country`, `subnational`, `supranational`, `international-context`, `intergovernmental-context`, or `international-organization` in this seed.
- `parentId`: parent node where relevant, such as California → United States.
- `isoCode`: ISO-like code when one is appropriate; otherwise `null`.
- `description`: short editorial scope note.

International organizations and groups are modeled as issuing contexts, not fictional countries.

## `instruments.json`

Core fields:

- `id`, `shortTitle`, `title`
- `jurisdictionId`: an existing jurisdiction ID.
- `issuingBodies`: authoritative issuer names.
- `category`: form of instrument, such as `law`, `regulation`, `executive-order`, `bill`, `risk-management-framework`, or `advisory-report`.
- `hierarchyLevel`: relative legal/policy level inside its own system. Values are descriptive; they are not intended to rank one jurisdiction above another.
- `legalForce`: binding, phased, mandatory only inside government, voluntary, non-binding, advisory, or not enacted.
- `lifecycleStatus`: current status as of `statusAsOf`.
- `statusAsOf`: ISO date on which the status was checked.
- `dates`: adoption, publication, effect, general application, and cessation dates. Unknown or inapplicable dates are `null`.
- `version`: version or consolidation note.
- `parentInstrumentId`: parent rulemaking instrument where appropriate.
- `topicIds`: concept IDs for browsing.
- `summary` and `statusNote`: project-authored descriptions.
- `source`: official URL, publisher label, and access date.
- `textAvailability`: where text exists and whether this repository stores it.

`lifecycleStatus` is deliberately more expressive than a single `active` flag. For example:

- The EU AI Act is `partially-applicable` on the snapshot date because general application is scheduled for 2 August 2026 and a later Article 6(1) exception remains.
- EO 14110 is `revoked` and retained only as a historical node.
- California SB 1047 is `vetoed` and never became law.
- India's DPDP Act and Rules are `partially-in-force` under their 2025 phased commencement notifications.
- NIST AI RMF and the Hiroshima AI Process remain voluntary or non-binding even when they align with binding duties.

## `provisions.json`

Each provision contains:

- `id`, `instrumentId`, `locator`, `title`, and `provisionType`
- `parentId`: optional parent provision or framework function.
- `summary`: concise editorial summary, never silently presented as quoted law.
- `conceptIds`: connections to the controlled concept vocabulary.
- `actorTags` and `scopeTags`: lightweight facets for filtering and comparison.
- `legalEffectStatus`: provision-level status, which may differ from the parent instrument.
- `appliesFrom`: provision-specific application date when known.
- `textAvailability`: text mode, storage flag, language, and an explicit caveat.
- `source`: official provision or instrument source.
- `editorial`: review status, review date, and a caveat.

The curated file does **not** fabricate full text. It stores editorial summaries unless a separate importer has retrieved verified official text. UI labels should say “Editorial summary” whenever the full text is not stored.

## `concepts.json`

Concept nodes are a neutral middle layer for comparing differently structured instruments. Each concept has:

- `id`
- `label`
- `family`
- `description`
- `aliases`

Concept membership means “relevant to this regulatory idea,” not “legally equivalent.”

## `relations.json`

Relations may connect either provisions or instruments:

```json
{
  "source": { "type": "provision", "id": "eu-gdpr-art-35" },
  "target": { "type": "provision", "id": "cn-pipl-art-55" }
}
```

Each relation also records:

- `type`: a descriptive edge such as `partial-overlap`, `soft-law-alignment`, `shared-legal-origin`, `implements`, or `policy-transition`.
- `directionality`: `directed` or `undirected`.
- `conceptIds`: concepts explaining why the nodes are connected.
- `status`: `candidate` or `editorial-reviewed` in this seed.
- `confidence`: qualitative `low`, `medium`, or `high`. This is confidence in the usefulness of the asserted relation, **not a percentage of legal equivalence**.
- `evidenceBasis`: how the edge was derived.
- `rationale`: what aligns.
- `limits`: what does not align and what a reader must not infer.
- `verifiedOn`: last review date.
- `sourceSupport`: official primary sources used for the comparison.

A relation must never be rendered as “compliant with,” “equivalent to,” or “satisfies” unless a much stronger, independently reviewed claim and its legal basis are added. The default visualization should expose `limits` alongside `rationale`.

## `status-events.json`

Each event contains:

- `id` and `instrumentId`
- `date`
- `type`
- `label`
- `effect`
- `resultingStatus`
- `source`

Events include completed and scheduled future dates. A UI should visually distinguish a future event from an event that has already occurred relative to the viewer's selected date.

The instrument's current status is a cached editorial conclusion. The event stream is the auditable explanation for that conclusion; it is not a complete legislative history.

## Text-availability modes

The seed currently uses these modes:

- `separate-official-import`: complete official EU Article text lives in a generated corpus file.
- `official-full-text-linked`, `official-current-text-linked`, `official-revised-text-linked`, or `official-consolidated-text-linked`: an official publisher provides text, but this seed stores only metadata and summaries.
- `official-publication-linked`, `official-report-linked`, `official-documents-linked`, or `official-gazette-pdf-linked`: official documents are linked but not copied.
- `government-reference-translation-linked`: a government-hosted translation is useful but is not the authoritative legal text.
- `official-bill-text-linked`: official legislative text that did not necessarily become law.

`stored: false` means the interface must not claim that the repository contains the full text. It may fetch or open the official source, subject to product architecture, source terms, and version controls.

## Important caveats in this snapshot

1. **EU phased application:** On 19 July 2026, the EU AI Act is in force but not yet generally applicable. Article-level status must follow Article 113 and transitional provisions.
2. **US history:** EO 14110 was revoked on 20 January 2025. California SB 1047 was vetoed on 29 September 2024. Both are valuable historical nodes and neither is current law.
3. **China numbering:** The amended Cybersecurity Law took effect on 1 January 2026. Current Article 23 corresponds to former Article 21, and current Article 44 corresponds to former Article 42. Never mix old and new locators without version metadata.
4. **UK divergence:** UK GDPR shares an origin with EU GDPR but has a separate amendment and interpretation history. The Data (Use and Access) Act 2025 has phased commencement; compare revised texts at a specified date.
5. **Japan translation:** The linked APPI English text is a government reference translation whose displayed last version is Act No. 37 of 2021. Authoritative and later version-sensitive work requires Japanese sources and current Personal Information Protection Commission materials.
6. **Canada scope:** PIPEDA interacts with provincial privacy laws. The Directive on Automated Decision-Making is mandatory policy for covered federal institutions and systems, not a generally applicable private-sector AI statute.
7. **India commencement:** As of the snapshot date, many core DPDP duties and operational Rules are enacted/made but scheduled for 14 May 2027. The interface must distinguish “future commencement” from “in force.”
8. **Soft law:** Hiroshima AI Process documents, NIST AI RMF, Japan's AI Guidelines for Business, and the UN Advisory Body report have different institutional roles and legal effects. Similar language does not erase those differences.
9. **Official text and copyright:** This seed links official sources and avoids reproducing unverified or potentially restricted full text. Standards and other copyrighted frameworks added later should normally store metadata, structure, short lawful excerpts where appropriate, and official purchase/access links—not copied standards.

## Suggested UI merge order

1. Load `jurisdictions.json`, `concepts.json`, and `instruments.json`.
2. Load generated `gdpr-articles.json` and `eu-ai-act-articles.json`.
3. Load `provisions.json` and merge records by `id`:
   - preserve imported official text and structural hierarchy;
   - overlay curated summaries, tags, provision status, and editorial notes only where the fields are intentionally curated;
   - never replace official text with a summary.
4. Resolve all relation endpoints against the combined instrument/provision graph.
5. Apply `status-events.json` to the selected timeline date.
6. Render legal force, lifecycle status, source, rationale, and limits as first-class visual information.

## Contribution checks

Before accepting a new instrument, provision, relation, or event:

1. Use an official primary source where one is available.
2. Record the access/review date.
3. Separate enactment, entry into force, application, and enforcement dates.
4. Mark bills, proposals, repealed laws, revoked orders, and future provisions explicitly.
5. Identify actor, trigger, scope, legal force, exceptions, and version before creating a mapping.
6. Write both a mapping rationale and its limits.
7. Do not store purported full text unless its source, version, completeness, language, and reuse basis have been verified.
8. Validate every ID reference and ISO date before merging.
