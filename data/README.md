# Dataset guide

The seed dataset is split into provisions and relations. It contains original editorial summaries and mapping hypotheses, not reproduced statutory text.

## `provisions.json`

Required fields:

- `id`: stable, lowercase identifier
- `instrument`: short instrument name
- `provision`: article, section, principle, or framework locator
- `jurisdiction`: human-readable jurisdiction or issuing context
- `region`: one of `EU`, `US`, `CN`, or `INT`
- `binding`: legal-force description
- `title`: project-authored short title
- `summary`: project-authored obligation summary
- `topics`: one or more explorer topic IDs
- `source`: authoritative HTTPS URL
- `sourceLabel`: issuing or publishing body

Optional `applicationStatus` records future application dates, directive implementation caveats, or amended-text status.

## `relations.json`

Required fields:

- `id`: stable relation ID
- `topic`: explorer topic ID
- `source` and `target`: existing provision IDs
- `type`: supported typed relationship
- `status`: `Candidate mapping` or `Editorial review` in the MVP
- `verifiedOn`: most recent primary-source check in ISO `YYYY-MM-DD` format
- `rationale`: concise explanation of both relationship and limits

Confidence and review status describe the strength of the mapping evidence. They must never be presented as a percentage of legal equivalence or compliance.

## Editorial review questions

Before accepting a relation, ask:

1. Do the provisions regulate the same actor or different layers of a system?
2. Do their triggers and materiality thresholds match?
3. Is one a binding rule and the other a voluntary framework?
4. Are deadlines, exceptions, enforcement, and territorial scope materially different?
5. Is the source current, and is national implementing law also required?
6. Does the rationale make those limits visible to a non-specialist reader?

Run `pnpm validate:data` after any dataset change.
