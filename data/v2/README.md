# V2 global regulation graph seed

This directory is the time-aware, multi-jurisdiction seed for the current visualization. It models jurisdictions, instruments, provisions, structure summaries, regulatory concepts, analytical relations, and lifecycle events separately so the interface can answer both of these questions:

1. What does this instrument or provision say and what is its legal status on a given date?
2. What other provisions address a similar regulatory function, and where does that comparison break down?

The dataset snapshot is verified through **2026-07-20**. It is a research aid, not legal advice or a compliance determination.

## Snapshot scope

The current seed contains **30 jurisdiction or issuing-context records, 58 instruments, 255 curated source-linked anchors, 2,932 merged provision/framework nodes, 74 qualified relations, 116 lifecycle events, 58 source-audit records, 23 controlled core concepts in 7 themes, and 34 curated structure summaries**. The merged count overlays 38 version-locked imported corpus files with `provisions.json` and de-duplicates stable IDs; it is not the raw length of any one file.

Thirty-eight instruments have a complete, version-locked local corpus within their documented language, lifecycle and redistribution boundary. Coverage includes the principal indexed statutes and regulations, selected historical enactments and bills, and NIST AI RMF 1.0. The remaining twenty records are framework, guidance, proposal or historical indexes with selected source text or source-linked editorial anchors. “Complete” is version-specific: it does not turn a vetoed bill into law, a voluntary framework into a duty, or a non-authoritative translation into controlling text.

## Files

- `jurisdictions.json`: countries, supranational systems, subnational systems, and international institutional contexts.
- `instruments.json`: laws, regulations, executive orders, bills, rules, mandatory internal directives, voluntary frameworks, standards, soft law, declarations, and advisory reports.
- `provisions.json`: curated source-linked anchors and analytical metadata that are not supplied by a complete imported node with the same stable ID.
- `provision-concepts.json`: one relevance review per merged node, including highlight state, Core Concept IDs, rationale and review date.
- `*-articles.json` and `*-provisions.json`: version-locked complete corpora with source, language, lifecycle and reuse metadata.
- `concept-themes.json`: stable, ordered learning themes used to organize the core-concept browser.
- `concepts.json`: a sourced controlled vocabulary used both for concept-led learning and to connect differently worded legal duties.
- `structure-summaries.json`: project-authored, high-level orientation summaries for rendered sections and framework roots, with source basis and editorial review metadata.
- `relations.json`: qualified analytical edges between provision or instrument nodes.
- `status-events.json`: dated lifecycle events such as adoption, entry into force, partial application, amendment, revocation, veto, and scheduled commencement.
- `source-audit.json`: one structured source, lifecycle, language-authority, English-availability, local-coverage, and caveat record for every instrument.
- `english-corpus-coverage.json`: generated node-level English coverage and temporal-alignment totals for every complete non-English corpus in scope.
- `foreign-english-corpus-audit.json` and `cn-english-corpus-manifest.json`: source, authority, version, reuse, and unresolved-gap manifests for foreign-law English corpora.
- `gdpr-articles.json`: generated complete GDPR Article corpus from EUR-Lex; produced by the EU-law import script.
- `eu-ai-act-articles.json`: generated complete EU AI Act Article corpus from EUR-Lex; produced by the EU-law import script.

The two generated EU Article files are intentionally separate from this hand-curated seed. An application should merge all provision sources by stable `id`, prefer the generated official full-text record for text, and preserve curated relation/status metadata from `provisions.json`.

## Navigation and presentation contract

The primary display order is fixed as **EU → US → China → UK → Canada → Japan → India → Singapore → South Korea → Australia → Brazil → UAE → Saudi Arabia → Taiwan → Hong Kong SAR → Indonesia → Vietnam → South Africa → Nigeria → Switzerland → International / Frameworks / Soft law**. California and Colorado are displayed under the US; Dubai is displayed under the UAE. **International / Frameworks / Soft law** is a parallel browsing lane, not a fictional jurisdiction and not subordinate to any one national system.

The left navigator has two peer browsing modes: **Global Atlas** and **Core Concepts**. Core Concepts is an independent learning index organized by `concept-themes.json`; selecting a concept may reveal relevant instruments and provisions, but membership signals topical relevance rather than legal equivalence.

That presentation lane is intentionally orthogonal to issuer metadata. NIST AI RMF, for example, retains its US issuing context and voluntary force even when surfaced beside ISO/IEC 42001, IEEE Ethically Aligned Design, OECD AI Principles, the Bletchley Declaration (2023), the Hiroshima AI Process, and the UN Advisory Body's _Governing AI for Humanity_ report. These materials have different issuers, audiences, update processes, and legal effects; co-location supports discovery and does not imply equivalence.

The frontend offers **Dark / Geek** and **Bright / Lawyer** modes. On wide layouts, the selected legal text, an explicit English-coverage notice, or a clearly labeled editorial summary occupies the center workspace and the animated relationship graph occupies the right workspace. Users can collapse or resize the side columns and use clickable breadcrumbs to return to any point in the current research path. National, regional, and subnational legal-system entries use their corresponding flags; international and standards contexts use issuer or framework icons rather than fictional flags. These cues supplement—not replace—accessible text labels and explicit legal-force/status wording.

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
- `source`: primary official URL, publisher label, and access date. Optional `supportingSource`, `amendmentSource`, `originalLanguageSource`, and `referenceTranslationSource` records keep companion, lifecycle, authoritative-language, and English-reference materials distinct.
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
- `versionAsOf`: date on which a source-linked editorial anchor was verified against the identified instrument version. It is not a substitute for `appliesFrom`.
- `textAvailability`: text mode, storage flag, language, and an explicit caveat.
- `paragraphs` and `fullText`: present only when verified source text is stored. `fullText` is the paragraph sequence joined with blank lines. `official-original-text-stored` denotes a complete original-language provision; `official-original-excerpt-stored` denotes an expressly identified extract rather than a complete section.
- `translations`: language-keyed renderings kept separate from the controlling source text. A `reference` translation is explicitly non-authoritative and may not be presented as controlling law. Article-level alignment, source order, authority, provenance, version and coverage are preserved; paragraph segmentation may differ between official publications and is therefore not assumed to be one-to-one.
- `source`: official provision or instrument source.
- `supportingSources`: optional provision-specific evidence, such as a court decision or companion implementation document.
- `editorial`: review status, review date, and a caveat.

The curated file does **not** fabricate full text. It stores editorial summaries unless verified legal text has been transcribed into the record or a separate importer has retrieved it. Original-language text, English coverage notices, English editorial summaries, and English reference translations remain separate fields. Complete official Chinese Article corpora are stored for the current Cybersecurity Law (81 Articles), PIPL (74 Articles), Network Data Security Management Regulations (64 Articles), and Interim Generative AI Measures (24 Articles). Their English coverage is respectively 81 project-authored current references, 74 NPC government references, 64 PRC Ministry of Justice references, and 24 CASI/Air University public-sector references. Japan APPI stores current Japanese and current-aligned English for all 208 nodes: 172 government-reference units were verified against normalized Japanese source text, while 15 changed main-Article/table units and 21 supplementary blocks carry complete project references. Korea PIPA stores 138 current-aligned MOLEG English references. The Korea AI Framework Act stores English for all 47 current nodes, with 42 current-aligned and five Articles expressly marked as next-phase wording effective 21 July 2026. LGPD stores English for all 80 Articles: 77 ANPD current-wording references and three separately licensed project-authored references for the 2026 amendments. Brazil PL 2338 (79 pending-bill Articles), Indonesia's PDP Law (76 Articles), Taiwan's final Executive Yuan generative-AI guidance (11 nodes), Vietnam Law 91/2025 (39 Articles), Decree 356/2025 (42 Articles and 13 forms), and historical Decree 13/2023 (44 Articles and six forms) now have complete, separately labelled project English references. A separate 120-node UK GDPR corpus stores the current revised legislation.gov.uk Articles as at 19 June 2026 and is not treated as identical to EU GDPR. UI labels must distinguish source text, historical or future-phase reference text, project-authored reference text, coverage notices, extracts, and editorial summaries.

`english-corpus-coverage.json` audits 22 complete non-English or bilingual corpora: all 1,346 nodes have stored English legal/reference text, 1,341 are aligned to the displayed source version, and five Korean AI Act nodes are explicitly marked as next-phase references for 21 July 2026. APPI is 208/208 current-aligned: 172 government-reference units were verified against normalized Japanese source text, while 15 changed main-Article/table units and 21 supplementary blocks have separately labelled project references. These figures measure stored text and temporal alignment, not legal authority, legal effect, certification, or translation quality.

## `source-audit.json`

Every instrument has exactly one audit companion containing:

- `reviewedOn` and `reviewLevel`;
- `lifecycleFinding` and `versionFinding`;
- `authoritativeLanguage` and `englishAvailability`, with translation-coverage metadata where selected and complete reference translations must be distinguished;
- optional `localIndexLanguage` when a local presentation language must be kept separate from a multilingual publication record;
- `localCoverage`;
- official `sources` and instrument-specific `caveats`.

The current coverage distribution is 38 complete corpora, one selected-source-text-and-index record, and 19 selected-provision indexes based on editorial summaries and official links. Coverage modes distinguish complete verified imports from metadata and selected-anchor review; none represents expert legal advice or silently upgrades an English summary into a translation. A complete corpus may still be historical, vetoed, pending, voluntary, non-authoritative in translation, or subject to phased commencement.

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
- `relationClass`: omitted or `analytical` for substantive mappings; `lifecycle` for legal-lineage edges such as repeal, reenactment, or policy transition.
- `conceptIds`: concepts explaining why analytically mapped nodes are connected. Lifecycle edges deliberately use an empty array because legal lineage does not itself assert substantive concept equivalence.
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
- `official-source-linked-editorial-summary`: the controlling or reference source is linked, while the local provision node contains a dated English editorial summary rather than quoted legal text.

`stored: false` means the interface must not claim that the repository contains the full text. Where verified original-language text is stored, the UI defaults to a sourced English text when one is available; otherwise it shows an explicit English-coverage notice and reveals the full original after user selection. An editorial summary or concept mapping must never occupy the English legal-text view as though it were a translation; the official source remains the path to complete wording where local English text is unavailable.

## Important caveats in this snapshot

1. **EU AI Act amendment boundary:** Regulation (EU) 2024/1689 remained the operative stored text on 19 July 2026. The Digital Omnibus on AI had received final Council approval and a signed final text, but the snapshot had not identified an Official Journal legal-act record bringing that amendment into force. Do not rewrite the stored 2024 Articles before publication and entry into force are verified.
2. **Historical and phased US nodes:** EO 14110 was revoked on 20 January 2025; California SB 1047 was vetoed on 29 September 2024; Colorado SB 24-205 was superseded before its principal duties operated. Specified SB 26-189 provisions took effect on 14 May 2026, while principal regulated-actor duties begin on 1 January 2027.
3. **China versioning:** The amended Cybersecurity Law took effect on 1 January 2026 and contains 81 Articles. Pre-2026 locators must not be mixed with current numbering without version metadata. Chinese official text controls; local English renderings are non-official reference translations.
4. **UK divergence:** UK GDPR has a separate amendment and interpretation history from EU GDPR. The majority of DUAA 2025 Part 5 privacy changes took effect on 5 February 2026 and section 103 followed on 19 June 2026.
5. **Canada:** PIPEDA's 75 current bilingual units are separated from nine enacted 2026 amending sections that still await an order bringing them into force. The federal Directive on Automated Decision-Making is stored in all ten sections and Appendices A–C in co-published English and French, but remains mandatory only within its government-policy scope. Bill C-27 and proposed AIDA lapsed on prorogation on 6 January 2025 and never became law; its 41 section-level entries are source-linked editorial anchors rather than redistributed bill wording.
6. **Japan:** Japanese APPI text controls and the government English reference translation remains versioned to Act No. 37 of 2021. A 2026 amendment was promulgated on 17 July 2026 but is predominantly subject to future staged commencement.
7. **India:** The DPDP Act and Rules use phased commencement; many substantive duties and operational Rules are scheduled for 14 May 2027. The Act does not create a GDPR Article 22-style general automated-decision right.
8. **South Korea:** The AI Framework Act has been in force since 22 January 2026 and is not a draft. A final indexed amendment phase was scheduled for 21 July 2026, after the legal-status cut-off. PIPA also has future 2026 and 2027 amendment phases.
9. **Australia:** The 2024 mandatory-guardrails consultation did not become a cross-sector mandatory AI regime. The 2025 Guidance for AI Adoption is voluntary. Privacy Act automated-decision transparency changes remain future-effective until 10 December 2026.
10. **Brazil:** LGPD is current binding law, while PL 2338/2023 remains pending. The current Portuguese consolidation controls; the official English LGPD publication is a dated translation snapshot.
11. **Taiwan:** The AI Basic Act was promulgated and effective on 14 January 2026 and is not a draft. PDPA provisions promulgated in 2023 and 2025 include amendments that remain uncommenced.
12. **Hong Kong SAR:** PDPO section 33 has never commenced and must not be represented as an operative transfer or localization prohibition.
13. **Indonesia:** The PDP Law has been in force since 17 October 2022 and its adjustment period has ended. Article 53 must be read with Constitutional Court Decision 151/PUU-XXII/2024, which conditionally construed `dan` as `dan/atau`.
14. **Vietnam:** Law No. 91/2025/QH15 and Decree No. 356/2025/ND-CP form the current regime from 1 January 2026. Decree 13/2023 was repealed on that date; the regime is not accurately summarized as blanket data localization.
15. **Middle East frameworks:** UAE and Dubai AI materials in this corpus are guidance rather than federal legislation. SDAIA AI Ethics Principles mix mandatory and recommendatory language; practical effect must be assessed by actor, risk tier, and implementing requirements.
16. **Africa:** POPIA is in force; section 58(2)'s applicability to section 57 processing was deferred to 1 February 2022. Nigeria's NDPA commenced on assent on 12 June 2023, while its Gazette publication is dated 1 July 2023.
17. **Switzerland:** The revised FADP has applied since 1 September 2023. German, French, and Italian Fedlex texts are authoritative; the official English translation is non-authoritative.
18. **Soft law, standards, and reuse:** Frameworks, standards, declarations, testing tools, reports, and guidance have different issuers, audiences, update processes, legal effects, and reuse terms. A graph edge never establishes equivalence or compliance. ISO/IEC 42001 and IEEE Ethically Aligned Design are represented through project-authored summaries, metadata, and official links—not copied publication text.

## Suggested UI merge order

1. Load `jurisdictions.json`, `concept-themes.json`, `concepts.json`, and `instruments.json`.
2. Load the version-locked complete corpus files declared by the application.
3. Load `provisions.json` and merge records by `id`:
   - preserve imported official text and structural hierarchy;
   - overlay curated summaries, tags, provision status, and editorial notes only where the fields are intentionally curated;
   - never replace official text with a summary.
4. Load `structure-summaries.json`, validate each `instrumentId`, `structureId`, concept, and source-basis provision reference, and attach it to the matching rendered structural node.
5. Resolve all relation endpoints against the combined instrument/provision graph.
6. Load `provision-concepts.json`; use it to highlight substantive nodes and connect them to Core Concepts without treating classifications as legal equivalence.
7. Load `source-audit.json` and attach each audit to its instrument without treating the audit record as source text.
8. Apply `status-events.json` to the selected timeline date.
9. Render legal force, lifecycle status, language authority, local coverage, source, rationale, and limits as first-class visual information.

## Reproducible maintenance

After changing corpus or reviewed metadata, rebuild derived records in order:

```bash
node scripts/build-provision-concepts.mjs
node scripts/build-english-corpus-coverage.mjs
node scripts/build-source-audit.mjs
pnpm validate:data
```

`expand-global-corpus.mjs` is a disabled historical bootstrap and must not be used for ordinary maintenance because it would recreate superseded grouped anchors. The active builders reproduce reviewed data; they do not browse, independently determine current law, prove translation accuracy, or replace expert legal review. Structural validation checks IDs, references, dates, coverage declarations, lifecycle events, relation vocabulary, graph coverage, rights boundaries and audit companions.

## Contribution checks

Before accepting a new instrument, provision, relation, structure summary, or event:

1. Use an official primary source where one is available.
2. Record the access/review date.
3. Separate enactment, entry into force, application, and enforcement dates.
4. Mark bills, proposals, repealed laws, revoked orders, and future provisions explicitly.
5. Identify actor, trigger, scope, legal force, exceptions, and version before creating a mapping.
6. Write both a mapping rationale and its limits.
7. Do not store purported full text unless its source, version, completeness, language, and reuse basis have been verified.
8. Keep translations separate from source text, label non-authoritative renderings as `reference`, preserve Article-level alignment and source order, and record any paragraph-model or version boundary shown by a language toggle.
9. Ground each structure summary in official sources and existing provision IDs; label it as editorial orientation and keep it concise.
10. For ISO/IEC 42001 and IEEE Ethically Aligned Design, store only metadata, original summaries, and official access links—not publication text.
11. Validate every ID reference and ISO date before merging.
