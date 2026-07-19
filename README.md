# Global AI · Data Regulation Map

An open, visual crosswalk of global AI governance, privacy, data security, and cybersecurity regulation.

The project makes relationships between provisions inspectable. It connects each mapping to an official source, a typed relationship, a short rationale, and a visible review status. It is designed for learners, researchers, in-house legal teams, privacy and security professionals, and anyone translating regulatory language into governance work.

> **Research preview:** the current dataset is small and illustrative. Mappings are hypotheses for review, not statements of legal equivalence or legal advice.

## What the MVP includes

- A responsive cross-jurisdiction comparison lattice
- Five topics: automated decisions, risk assessment, incident response, cross-border transfers, and security safeguards
- Seed coverage across the European Union, China, California / United States, OECD, and NIST
- Typed relationships such as `partial-overlap`, `complements`, and `aligned-with`
- Evidence panels linking both ends of a mapping to official sources
- Machine-checked provision IDs, relation IDs, references, URLs, and relation types

## Why a crosswalk, not a similarity score

Two provisions can use similar language and still differ in regulated actors, triggers, exceptions, deadlines, territorial scope, legal effect, or enforcement. This project therefore avoids a universal “equivalent” label and does not assign compliance percentages.

Each edge is a reviewable argument:

| Relation | Meaning |
| --- | --- |
| `functional-equivalent` | Close functional alignment, with material legal differences still possible |
| `partial-overlap` | Some duties or outcomes overlap, but scope or mechanics differ |
| `operationalizes` | A rule gives more concrete effect to a higher-level principle |
| `aligned-with` | A framework outcome is relevant to a legal or policy objective |
| `complements` | The provisions address different layers of the same governance problem |
| `depends-on` | One provision must be read with another requirement |

## Current seed coverage

| Region | Instruments |
| --- | --- |
| European Union | GDPR, EU AI Act, NIS2 Directive |
| China | Personal Information Protection Law, amended Cybersecurity Law |
| United States / California | California Civil Code breach-notification law, NIST AI RMF, NIST CSF 2.0 |
| International | OECD AI Principles, OECD Privacy Guidelines |

Last seed review: **2026-07-19**.

Important temporal notes:

- The EU AI Act is in force, but the high-risk-system provisions represented here generally start applying on 2 August 2026, subject to Article 113 and system classification.
- NIS2 is a directive. Practical duties must be checked against the applicable member-state implementing law.
- China’s Cybersecurity Law was amended in 2025, with the amended text effective 1 January 2026. Older materials may use superseded article numbering.
- Chinese official-language texts are authoritative; the English titles and summaries in this project are editorial translations.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Then open the local URL shown in the terminal.

Quality checks:

```bash
pnpm validate:data
pnpm typecheck
pnpm lint
pnpm test
```

## Data model

The seed data lives in [`data/provisions.json`](data/provisions.json) and [`data/relations.json`](data/relations.json). See [`data/README.md`](data/README.md) for field definitions, review rules, and source requirements.

A relation contains two provision IDs, a topic, a relationship type, a rationale, review status, and verification date. The validation script rejects duplicate IDs, dangling references, unsupported types, missing official sources, and malformed dates.

## Contributing

Corrections are as valuable as new coverage. You can:

- report an outdated or broken official source;
- challenge a mapping rationale;
- document a scope difference or exception;
- propose a new provision or crosswalk;
- improve accessibility, mobile behavior, or data validation.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Please do not paste paywalled standards, commercial database text, or unofficial translations without permission.

## Roadmap

- Expand incident-response crosswalks with EU member-state implementation details
- Add rights, retention, children’s data, biometric data, and AI documentation topics
- Separate editorial candidates from expert-reviewed mappings
- Add version history and change alerts for amended provisions
- Publish versioned datasets and a citable research release

## Legal and research disclaimer

This project is provided for research and educational purposes only and does not constitute legal advice. Mappings describe possible functional or thematic relationships and do not establish legal equivalence. The dataset may be incomplete, outdated, or affected by jurisdiction-specific definitions, exceptions, guidance, implementation, and enforcement practice. Always consult authoritative texts and qualified local counsel.

## Licenses

- Source code: [MIT License](LICENSE)
- Original mapping data and editorial metadata: [CC BY 4.0](DATA-LICENSE.md)
- Official laws, standards, translations, and third-party sources remain subject to their own terms and rights.

## Citation

Citation metadata is available in [`CITATION.cff`](CITATION.cff).
