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
- Keep summaries short and original; link to the source for the authoritative text.

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
- [ ] Every endpoint exists in `data/provisions.json`.
- [ ] Official URLs use HTTPS and were checked recently.
- [ ] The rationale states at least one meaningful scope difference.
- [ ] No restricted source text was copied without permission.
- [ ] AI-generated suggestions were independently verified.
- [ ] Validation, type checking, linting, and tests pass.

By contributing code, you agree that it is licensed under MIT. By contributing original mapping data or editorial metadata, you agree that it is licensed under CC BY 4.0.
