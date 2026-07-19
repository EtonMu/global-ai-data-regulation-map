# Contributing

Thank you for helping make global regulation easier to inspect and compare. Contributions are welcome from legal researchers, engineers, students, privacy and security practitioners, translators, and subject-matter experts.

## Before proposing a mapping

1. Link to the authoritative publisher whenever possible.
2. Identify the exact instrument and provision locator.
3. Compare actors, trigger, scope, duties, timing, exceptions, and legal effect.
4. Choose the narrowest defensible relation type.
5. Explain decisive similarities **and** differences in plain language.
6. Mark the relationship as an editorial candidate unless an established expert-review process has been completed.
7. Confirm that AI-assisted research has been checked by a human against the cited source.

Theme similarity alone is not enough. Do not describe provisions as equivalent merely because both mention concepts such as transparency, risk, consent, or security.

## Source and copyright rules

- Prefer current official-language sources from legislatures, regulators, governments, OECD, NIST, or other issuing bodies.
- Record amendments and future application dates when they affect interpretation.
- Clearly identify project-authored translations.
- Do not copy commercial standards or paywalled database text into the repository.
- Represent ISO/IEC 42001 and IEEE Ethically Aligned Design with metadata, original project summaries, and official access links only; do not reproduce their publication text.
- Keep summaries short and original; link to the source for the authoritative text.

## Interface and structure-summary contract

- Keep the primary legal-system order **EU, US, China, UK, Canada, Japan, India**; group California under the US.
- Keep **International / Frameworks / Soft law** as a parallel top-level lane. Presentation grouping must not rewrite issuer, jurisdiction, or legal-force metadata.
- Preserve both **Dark / Geek** and **Bright / Lawyer** modes, readable labels alongside flags and semantic icons, legal text in the center workspace, and the animated relationship graph at right on wide screens.
- Every rendered section or framework root should have a concise high-level summary in `data/v2/structure-summaries.json`. A summary is editorial orientation, not legal text, and must identify its source basis and review metadata.
- Flags and icons lower navigation cost but never stand in for accessible text labels, legal-force wording, or lifecycle status.

## Development workflow

```bash
pnpm install
pnpm validate:data
pnpm typecheck
pnpm lint
pnpm test
```

Pull requests should remain focused. A data contribution should not bundle unrelated interface changes.

## Pull-request checklist

- [ ] Provision and relation IDs are unique.
- [ ] New records use the active `data/v2/` schema and stable ID conventions.
- [ ] Every relation endpoint resolves to a provision or instrument in the unified V2 graph.
- [ ] Every new rendered section or framework root has a unique, source-grounded structure summary.
- [ ] Official URLs use HTTPS and were checked recently.
- [ ] Legal force, lifecycle status, version, and distinct effective/application dates are explicit.
- [ ] The rationale states at least one meaningful scope difference.
- [ ] Candidate mappings are not mislabeled as editorially reviewed.
- [ ] No restricted source text was copied without permission.
- [ ] Theme, flag, and icon changes retain readable text labels and keyboard-visible semantics in both visual modes.
- [ ] AI-generated suggestions were independently verified.
- [ ] Validation, type checking, linting, and tests pass.

Do not edit `data/v2/gdpr-articles.json` or
`data/v2/eu-ai-act-articles.json` by hand. Update the reproducible import and
regenerate the corpus instead. See the [V2 dataset guide](data/v2/README.md)
for field definitions, temporal caveats, and the merge contract.

By contributing code, you agree that it is licensed under MIT. By contributing original mapping data or editorial metadata, you agree that it is licensed under CC BY 4.0.
