# India and Gulf complete-text corpus handoff

Verified and generated on 2026-07-20 from primary government sources. The importers perform no machine translation. Every unit contains a SHA-256 digest of its normalized text and source-document or source-snapshot digests.

| Corpus | Generated file | Units | Original / controlling source | Government English source |
|---|---|---:|---|---|
| India DPDP Act 2023 | `data/v2/india-dpdp-act-2023-provisions.json` | 44 sections + Schedule | [MeitY / Gazette Act PDF](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf) | Official English enactment |
| India DPDP Rules 2025 | `data/v2/india-dpdp-rules-2025-provisions.json` | 23 rules + 7 schedules | [MeitY / G.S.R. 846(E)](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) | Official English rules |
| UAE Federal PDPL 45/2021 | `data/v2/uae-federal-pdpl-45-2021-articles.json` | 31 articles | [UAE Legislation Platform Arabic](https://www.uaelegislation.gov.ae/ar/legislations/1972) | [Official platform English reference](https://www.uaelegislation.gov.ae/en/legislations/1972) |
| Saudi PDPL, consolidated after M/148 | `data/v2/sa-pdpl-2021-amended-2023-articles.json` | 43 articles | [Saudi Data Governance Platform Arabic](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL) | Official DGP English reference PDF (URL embedded per unit) |
| Saudi PDPL Implementing Regulation | `data/v2/sa-pdpl-implementing-regulation-2023-articles.json` | 38 articles | [Saudi DGP Arabic](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/PDPL2) | Official DGP English reference PDF (URL embedded per unit) |
| Saudi PDPL Transfer Regulation v2.0 | `data/v2/sa-pdpl-transfer-regulation-2023-articles.json` | 9 articles | [Saudi DGP Arabic](https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom) | Official DGP English reference PDF (URL embedded per unit) |

## Currency and legal-effect notes

- India commencement is modeled from [G.S.R. 843(E)](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf), digitally published 14 November 2025. Units distinguish provisions in force on publication, the one-year phase (14 November 2026), and the eighteen-month phase (14 May 2027). Sections 6, 27, and 44 retain sub-provision phase metadata.
- The Rules text is not the uncorrected November PDF text. The importer applies every correction in [G.S.R. 892(E)](https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf), including the Fourth Schedule renumbering.
- The UAE platform identifies the law as active, issued 20 September 2021, Official Gazette No. 712 (Supplement), effective 2 January 2022. Arabic controls; platform English is labeled `official-reference-translation`.
- The Saudi PDPL dataset is the official consolidated M/19 text reflecting the M/148 amendments. The law and Implementing Regulation are marked effective 14 September 2023.
- The Saudi Transfer Regulation corpus is the current official Version 2.0 dated August 2024. Article 9 makes it effective on Official Gazette publication, but the official source PDF does not print that Gazette date; therefore `appliesFrom` is deliberately `null` rather than guessed.

## Reuse and integrity

- India records cite the MeitY Copyright Policy, which permits accurate reproduction with prominent source acknowledgement, subject to third-party exclusions.
- UAE and Saudi records retain the statutory official-document exclusions and attribution notes in `rights` metadata. These are not represented as open-source software licences.
- Unit text hashes are in `contentSha256`; source PDF, HTML snapshot, and API-payload hashes are under `sourceVersion`.

## Integration boundary

This handoff intentionally does not edit the shared aggregate files or UI. The parent integration should add the four existing instrument corpora and create instrument metadata for:

- `sa-pdpl-implementing-regulation-2023`
- `sa-pdpl-transfer-regulation-2023`

Importers: `scripts/import-india-dpdp.py` and `scripts/import-gulf-pdpl.py`. Corpus contract tests: `tests/india-gulf-complete-corpora.test.mjs`.
