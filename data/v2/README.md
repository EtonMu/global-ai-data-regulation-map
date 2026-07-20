# V2 global regulation graph seed

This directory is the time-aware, multi-jurisdiction seed for the current visualization. It models jurisdictions, instruments, provisions, structure summaries, regulatory concepts, analytical relations, and lifecycle events separately so the interface can answer both of these questions:

1. What does this instrument or provision say and what is its legal status on a given date?
2. What other provisions address a similar regulatory function, and where does that comparison break down?

The dataset snapshot is verified through **2026-07-19**. It is a research aid, not legal advice, a complete legal corpus, or a compliance determination.

## Snapshot scope

The current seed contains **15 jurisdiction or issuing-context records, 23 instruments, 332 merged provision nodes, 42 qualified relations, 54 lifecycle events, 23 controlled core concepts in 7 themes, and 34 curated structure summaries**. The merged provision total combines the generated GDPR and EU AI Act Article corpora with curated provision records by stable ID; it is not the raw length of `provisions.json`.

Complete locally stored Article coverage currently includes the GDPR (99 Articles), EU AI Act (113 Articles), and the current consolidated Chinese text of China's Cybersecurity Law (81 Articles, amended on 28 October 2025 and effective from 1 January 2026). Other instruments generally provide selected provision metadata, original editorial summaries, and official links. The snapshot is broad enough to demonstrate the model but is not a complete inventory of any jurisdiction's AI, privacy, data-security, or cybersecurity law.

## Files

- `jurisdictions.json`: countries, supranational systems, subnational systems, and international institutional contexts.
- `instruments.json`: laws, regulations, executive orders, bills, rules, mandatory internal directives, voluntary frameworks, standards, soft law, declarations, and advisory reports.
- `provisions.json`: the complete current Chinese Cybersecurity Law corpus, representative provision-level nodes for other instruments, and curated metadata for high-value EU provisions.
- `concept-themes.json`: stable, ordered learning themes used to organize the core-concept browser.
- `concepts.json`: a sourced controlled vocabulary used both for concept-led learning and to connect differently worded legal duties.
- `structure-summaries.json`: project-authored, high-level orientation summaries for rendered sections and framework roots, with source basis and editorial review metadata.
- `relations.json`: qualified analytical edges between provision or instrument nodes.
- `status-events.json`: dated lifecycle events such as adoption, entry into force, partial application, amendment, revocation, veto, and scheduled commencement.
- `gdpr-articles.json`: generated complete GDPR Article corpus from EUR-Lex; produced by the EU-law import script.
- `eu-ai-act-articles.json`: generated complete EU AI Act Article corpus from EUR-Lex; produced by the EU-law import script.

The two generated EU Article files are intentionally separate from this hand-curated seed. An application should merge all provision sources by stable `id`, prefer the generated official full-text record for text, and preserve curated relation/status metadata from `provisions.json`.

## Navigation and presentation contract

The primary legal-system display order is fixed as **EU → US → China → UK → Canada → Japan → India**. California is a subnational record and is displayed under the US. **International / Frameworks / Soft law** is a parallel top-level browsing lane, not a fictional jurisdiction and not subordinate to any one national system.

The left navigator has two peer browsing modes: **Legal Sources** and **Core Concepts**. Core Concepts is not a ninth jurisdiction or legal-source lane. It is an independent learning index organized by `concept-themes.json`; selecting a concept may reveal relevant instruments and provisions, but membership signals topical relevance rather than legal equivalence.

That presentation lane is intentionally orthogonal to issuer metadata. NIST AI RMF, for example, retains its US issuing context and voluntary force even when surfaced beside ISO/IEC 42001, IEEE Ethically Aligned Design, OECD AI Principles, the Bletchley Declaration (2023), the Hiroshima AI Process, and the UN Advisory Body's _Governing AI for Humanity_ report. These materials have different issuers, audiences, update processes, and legal effects; co-location supports discovery and does not imply equivalence.

The frontend offers **Dark / Geek** and **Bright / Lawyer** modes. On wide layouts, the selected legal text or clearly labeled editorial summary occupies the center workspace and the animated relationship graph occupies the right workspace. National, regional, and subnational legal-system entries use their corresponding flags; international and standards contexts use issuer or framework icons rather than fictional flags. These cues supplement—not replace—accessible text labels and explicit legal-force/status wording.

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
- `type`: `country`, `subnational`, `supranational`, `international-context`, `intergovernmental-context`, or `international-organization` in this seed. ISO/IEC, IEEE, and OECD use the last type with descriptions that preserve their distinct institutional roles.
- `parentId`: parent node where relevant, such as California → United States.
- `isoCode`: ISO-like code when one is appropriate; otherwise `null`.
- `description`: short editorial scope note.

International organizations and groups are modeled as issuing contexts, not fictional countries.

## `instruments.json`

Core fields:

- `id`, `shortTitle`, `title`
- `originalTitle`: official-language title where the instrument has one and it has been verified.
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
- `originalTitle`: official-language locator or title where one has been verified.
- `chapter` and `section`: optional stable structural metadata used to group complete Article corpora without inferring a hierarchy not present in the source.
- `parentId`: optional parent provision or framework function.
- `summary`: concise editorial summary, never silently presented as quoted law.
- `conceptIds`: connections to the controlled concept vocabulary.
- `actorTags` and `scopeTags`: lightweight facets for filtering and comparison.
- `legalEffectStatus`: provision-level status, which may differ from the parent instrument.
- `appliesFrom`: provision-specific application date when known.
- `textAvailability`: text mode, storage flag, language, and an explicit caveat.
- `paragraphs` and `fullText`: present only when verified source text is stored. `fullText` is the paragraph sequence joined with blank lines. `official-original-text-stored` denotes a complete original-language provision; `official-original-excerpt-stored` denotes an expressly identified extract rather than a complete section.
- `translations`: language-keyed renderings kept separate from the controlling source text. A `reference` translation is explicitly non-official, preserves one-to-one paragraph alignment, and may not be presented as authoritative law.
- `source`: official provision or instrument source.
- `editorial`: review status, review date, and a caveat.

The curated file does **not** fabricate full text. It stores editorial summaries unless verified official text has been transcribed into the record or a separate importer has retrieved it. Original-language text, English editorial summaries, and English reference translations remain separate fields. All 81 Articles of the current consolidated Chinese Cybersecurity Law are stored from the official Chinese publication. The other indexed Chinese laws contain selected verified Articles rather than complete Acts. The Japanese APPI provisions link to current e-Gov Japanese text. The Japanese AI Guidelines record stores a clearly labelled overview extract and links directly to the official Version 1.2 Japanese PDF. UI labels should say “Editorial summary” whenever text is not stored, distinguish a stored extract from a complete provision, and mark every `reference` translation as non-official.

## `concepts.json`

Concept nodes are a neutral middle layer for comparing differently structured instruments and a first-class learning index. Each concept has:

- `id`: stable kebab-case identifier. Existing IDs remain stable because instruments, provisions, summaries, and relations may reference them.
- `label`, `description`, and `summary`: concise, project-authored orientation text.
- `family`: a granular classification retained for analytical compatibility.
- `theme`: reference to an ordered record in `concept-themes.json` for navigation grouping.
- `aliases`: search terms, alternate spellings, and common professional abbreviations.
- `sourceBasis`: public learning or primary-source materials, each with a label, HTTPS URL, and access date.
- `editorial`: review state, review date, and an express warning that the summary is not an authoritative definition or legal conclusion.

Concept membership means “relevant to this regulatory idea,” not “legally equivalent.”

The expanded learning taxonomy is an original editorial synthesis informed by the public IAPP CIPP/E, CIPM, CIPT, and AIGP Bodies of Knowledge and by cited primary sources. It is not affiliated with or endorsed by IAPP, does not reproduce course or examination materials, and does not claim that a topic appears with any particular exam frequency.

## `structure-summaries.json`

Each record provides editorial orientation at a structural level and contains:

- `id`: stable composite ID for the instrument and structural node.
- `instrumentId` and `structureId`: existing instrument and rendered hierarchy identifiers.
- `level`: structural level, currently `section` or `hierarchy-root`.
- `label`, `title`, and `summary`: concise, project-authored navigation text.
- `conceptIds`: optional controlled concepts for orientation.
- `sourceBasis`: official source links and the provision IDs used to ground the summary.
- `editorial`: review state, review date, and an express orientation-only caveat.

The 34-record seed covers 31 indexed GDPR or EU AI Act sections and three framework roots. A structure summary must not be quoted or styled as legal text, must not erase exceptions or definitions in the underlying provisions, and must never be used as a compliance conclusion.

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
- `official-original-full-corpus-stored-by-article`: a complete, version-identified official-language Article corpus is stored locally as individual provision records.
- `official-original-text-stored`: one complete official-language provision is stored locally; this does not claim that the entire parent instrument is stored.
- `official-original-excerpt-stored`: a specifically identified official-language extract is stored locally and must not be presented as a complete provision or instrument.
- `official-full-text-linked`, `official-current-text-linked`, `official-revised-text-linked`, or `official-consolidated-text-linked`: an official publisher provides text, but this seed stores only metadata and summaries.
- `official-publication-linked`, `official-report-linked`, `official-documents-linked`, or `official-gazette-pdf-linked`: official documents are linked but not copied.
- `official-paid-standard-access-linked` or `official-publication-access-linked`: an official standards publisher controls access or reuse; the seed stores original editorial metadata and links the authorized access page without copying the publication.
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
8. **Soft law and standards:** Hiroshima AI Process documents, the Bletchley Declaration, OECD AI Principles, NIST AI RMF, IEEE Ethically Aligned Design, ISO/IEC 42001, Japan's AI Guidelines for Business, and the UN Advisory Body report have different issuers, audiences, revision processes, and legal effects. Similar language does not erase those differences.
9. **Official text and copyright:** This seed links official sources and avoids reproducing unverified or potentially restricted full text. ISO/IEC 42001 and IEEE Ethically Aligned Design are represented only through project-authored summaries, metadata, and official access links—not copied publication text.

## Suggested UI merge order

1. Load `jurisdictions.json`, `concept-themes.json`, `concepts.json`, and `instruments.json`.
2. Load generated `gdpr-articles.json` and `eu-ai-act-articles.json`.
3. Load `provisions.json` and merge records by `id`:
   - preserve imported official text and structural hierarchy;
   - overlay curated summaries, tags, provision status, and editorial notes only where the fields are intentionally curated;
   - never replace official text with a summary.
4. Load `structure-summaries.json`, validate each `instrumentId`, `structureId`, concept, and source-basis provision reference, and attach it to the matching rendered structural node.
5. Resolve all relation endpoints against the combined instrument/provision graph.
6. Apply `status-events.json` to the selected timeline date.
7. Render legal force, lifecycle status, source, rationale, and limits as first-class visual information.

## Contribution checks

Before accepting a new instrument, provision, relation, structure summary, or event:

1. Use an official primary source where one is available.
2. Record the access/review date.
3. Separate enactment, entry into force, application, and enforcement dates.
4. Mark bills, proposals, repealed laws, revoked orders, and future provisions explicitly.
5. Identify actor, trigger, scope, legal force, exceptions, and version before creating a mapping.
6. Write both a mapping rationale and its limits.
7. Do not store purported full text unless its source, version, completeness, language, and reuse basis have been verified.
8. Keep translations separate from source text, label non-official renderings as `reference`, and preserve one-to-one paragraph alignment when a language toggle is offered.
9. Ground each structure summary in official sources and existing provision IDs; label it as editorial orientation and keep it concise.
10. For ISO/IEC 42001 and IEEE Ethically Aligned Design, store only metadata, original summaries, and official access links—not publication text.
11. Validate every ID reference and ISO date before merging.
