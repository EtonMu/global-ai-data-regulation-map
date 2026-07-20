# Existing V2 corpus audit — 23 pre-existing instruments

**Status cut-off:** 19 July 2026  
**Method:** instrument-level review of `data/v2/instruments.json[0:23]`. Only official legislature, government, intergovernmental-organization, or standards-body sources were used. This audit does not treat a proposal, adopted-but-unpublished act, reference translation, or editorial summary as current law.

**Production disposition:** The corrections below have been integrated into the production V2 data as of this audit pass. The findings remain here as an auditable record of why the status, version, source, and language fields were changed.

## Corrections integrated into the production dataset

### 1. `eu-ai-act` — add the adopted-but-not-yet-promulgated 2026 amendment

- The record is correct that Regulation (EU) 2024/1689 is in force and only partly applicable. Its Article 113 dates remain the legally operative dates **as of the cut-off**.
- On 29 June 2026 the Council gave final approval to the Digital Omnibus on AI. The Council expressly said that it would enter into force only on the third day after publication in the Official Journal. At the cut-off, EUR-Lex still exposed the signed text as `PE_30_2026_REV_1`, not as an OJ/ELI regulation, and the 2024/1689 ELI page did not yet show it as an amendment in force.
- **Exact correction:** retain `generalApplicationFrom: 2026-08-02` as the date in the still-current 2024 Act, but add a pending-change note/event: “Digital Omnibus on AI received final Council approval on 29 June 2026; signed text PE 30 2026 REV 1 awaited OJ publication and was not yet in force on 19 July 2026.” Do not rewrite stored Articles or substitute the proposed delayed dates until an OJ/ELI identifier exists.
- The signed amendment would move principal high-risk dates to 2 December 2027 for stand-alone high-risk systems and 2 August 2028 for product-embedded systems, but those dates were not yet operative at the cut-off.
- Official sources: [current AI Act ELI](https://eur-lex.europa.eu/eli/reg/2024/1689/oj); [Council final-approval notice, 29 June 2026](https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/); [signed text PE 30 2026 REV 1](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CONSIL%3APE_30_2026_REV_1).

### 2. `gb-uk-gdpr` — the status note is now too vague

- The Data (Use and Access) Act 2025 did not replace the UK GDPR. Its main Part 5 privacy amendments were brought into force on 5 February 2026; section 103 (controller complaint procedures) followed on 19 June 2026.
- **Exact correction:** change the version/status note to identify those operative dates, rather than merely saying there is “phased commencement.” Suggested wording: “UK GDPR as amended, including the majority of DUAA 2025 Part 5 changes effective 5 February 2026 and section 103 effective 19 June 2026; use the legislation.gov.uk timeline for point-in-time research.”
- `issuingBodies: ["Parliament of the United Kingdom"]` is incomplete provenance: Parliament did not originally issue Regulation (EU) 2016/679. Represent the original European Parliament/Council provenance separately from its assimilation and later UK amendments.
- Official sources: [revised UK text and timeline](https://www.legislation.gov.uk/eur/2016/679/contents); [DUAA commencement plan](https://www.gov.uk/guidance/data-use-and-access-act-2025-plans-for-commencement); [Commencement No. 6 Regulations 2026](https://www.legislation.gov.uk/uksi/2026/82/contents/made).

### 3. `jp-appi` — newly promulgated 2026 amendment is missing

- The authoritative current text is Japanese on e-Gov. The government English reference translation is expressly a lagging version: its page identifies “Last Version: Act No. 37 of 2021.”
- On 17 July 2026 Japan promulgated the 2026 APPI amendment after passage on 10 July. Supplementary Provision Article 1 sets the principal commencement on a Cabinet Order date no later than two years after promulgation. Only Supplementary Provisions 13 and 16 commenced on promulgation; Supplementary Provision 17 commences on the later of the promulgation of Act No. 46 of 2026 or this amendment; and the expressly listed procedural, enforcement and penalty provisions commence six months after promulgation. The substantive APPI package was therefore **promulgated but predominantly not yet effective** at the cut-off.
- **Exact correction:** keep the current in-force Japanese consolidation as the displayed law, add a `pending-amendment` event dated 17 July 2026, and model the immediate, six-month, and principal Cabinet-Order commencement tranches separately. Do not merge a provision into current Article text before its own commencement. Replace the vague version with: “Current Japanese e-Gov consolidation; 2026 amendment promulgated 17 July 2026, with limited immediate and six-month provisions and principal commencement by Cabinet Order within two years.”
- Official sources: [current e-Gov Act](https://laws.e-gov.go.jp/law/415AC0000000057); [PPC promulgation notice, 17 July 2026](https://www.ppc.go.jp/news/press/2026/260717/); [promulgated amendment, Supplementary Provision Article 1](https://www.ppc.go.jp/files/pdf/260717_houritsu.pdf); [government English reference translation showing its 2021 last version](https://www.japaneselawtranslation.go.jp/en/laws/view/4241/en).

### 4. `jp-ai-guidelines-business-1-2` — issuing bodies are wrong

- Version 1.2 and the 31 March 2026 date are correct, and the document is non-binding soft law.
- The Japanese PDF itself is issued by **the Ministry of Internal Affairs and Communications (MIC) and the Ministry of Economy, Trade and Industry (METI)**. IPA/AISI participates in the committee secretariat but is not one of the two issuers printed on the document.
- **Exact correction:** replace `issuingBodies` with `Ministry of Internal Affairs and Communications` and `Ministry of Economy, Trade and Industry`. Keep the English files labelled “tentative translation,” not official/authoritative English text.
- Official sources: [METI version 1.2 publication page](https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/20260331_report.html); [Japanese version 1.2 PDF](https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_1.pdf).

### 5. `in-dpdp-rules-2025` — corrigendum has already issued

- G.S.R. 846(E) and the phased dates are correct: Rules 1, 2 and 17–21 began on publication; Rule 4 one year later; Rules 3, 5–16, 22 and 23 eighteen months later.
- A corrigendum was published on 16 December 2025. “Subject to official corrigendum” sounds unresolved.
- **Exact correction:** use `version: "G.S.R. 846(E), read with the official corrigendum published 16 December 2025"` and add the corrigendum as a separate source. Keep 14 November 2025, 14 November 2026, and 14 May 2027 as the three implementation points used by the official enforcement timeline.
- Official sources: [MeitY DPDP Rules document page, including the corrigendum](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa); [Gazette text of G.S.R. 846(E)](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf).

### 6. `g7-hiroshima-ai-process` — source points to the wrong stage of the process

- The current `source` page is dated 30 October 2023 and covers the earlier G7 Leaders' Statement, International Guiding Principles, and Code of Conduct. It is not the December Comprehensive Policy Framework that the record names.
- The Comprehensive Policy Framework was agreed by G7 Digital and Technology Ministers on 1 December 2023 and endorsed by G7 Leaders on 6 December 2023. Thus 6 December is defensible as an endorsement date, but the record should preserve the 1 December agreement date as well.
- **Exact correction:** replace the principal source with the 6 December G7 Leaders' Statement (or the current MOFA AI Diplomacy hub), and describe the October documents as constituent/predecessor sources. Add that the voluntary OECD-hosted HAIP Reporting Framework launched in February 2025 and moved to version 2.0 in 2026; that implementation mechanism is not a change in legal force.
- Official sources: [6 December G7 Leaders' Statement](https://www.mofa.go.jp/mofaj/files/100591757.pdf); [MOFA account of agreement and endorsement](https://www.mofa.go.jp/policy/other/bluebook/2024/en_html/feature/f0101.html); [current MOFA AI Diplomacy page](https://www.mofa.go.jp/ecm/eds/pagewe_000001_00361.html); [OECD HAIP Reporting Framework](https://oecd.ai/en/transparency/overview).

### 7. `us-nist-ai-rmf-1-0` — current, but revision-in-progress must be visible

- AI RMF 1.0 remains the current published core framework and remains voluntary. NIST now states that AI RMF 1.0 is being revised.
- **Exact correction:** retain `version: "1.0"` and `active-voluntary`, but add: “NIST identifies 1.0 as the current published framework while a revision is in progress; profiles and the Playbook are separate resources and do not silently replace the core.”
- Official sources: [NIST AI RMF hub](https://www.nist.gov/itl/ai-risk-management-framework); [NIST AI RMF 1.0 publication record](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10).

### 8. `us-eo-14179` — accurate node, but not the whole current federal policy picture

- EO 14179 remains in force and its legal-force label is appropriately limited to the executive branch. It is not a private-sector AI statute.
- **Exact correction:** keep the node, but change the status note so it cannot be read as the sole current federal AI framework. Link later, separate instruments: EO 14365 (11 December 2025, national-policy framework and state-law challenge directions), the March 2026 legislative recommendations (not enacted legislation), EO 14409 (2 June 2026, AI innovation/security), and NSPM-11 (5 June 2026, national-security enterprise). These deserve separate nodes, not silent incorporation into EO 14179.
- Official sources: [EO 14179](https://www.federalregister.gov/documents/2025/01/31/2025-02172/removing-barriers-to-american-leadership-in-artificial-intelligence); [EO 14365](https://www.whitehouse.gov/presidential-actions/2025/12/eliminating-state-law-obstruction-of-national-artificial-intelligence-policy/); [March 2026 legislative recommendations](https://www.whitehouse.gov/wp-content/uploads/2026/03/03.20.26-National-Policy-Framework-for-Artificial-Intelligence-Legislative-Recommendations.pdf); [EO 14409](https://www.whitehouse.gov/presidential-actions/2026/06/promoting-advanced-artificial-intelligence-innovation-and-security/); [NSPM-11](https://www.whitehouse.gov/presidential-actions/2026/06/national-security-presidential-memorandum-nspm-11/).

### 9. `in-dpdp-act-2023` — remove the automated-decision-right implication

- Act No. 22 of 2023 and the G.S.R. 843(E) phase schedule are current. On the cut-off, the institutional/rulemaking provisions were in force; the one-year group begins 14 November 2026 and most substantive duties and rights begin 14 May 2027.
- The Act regulates processing of digital personal data, but it does not create a GDPR Article 22-style right to refuse, contest, or obtain an explanation of automated decisions.
- **Exact correction:** remove `automated-decision-safeguards` from the instrument's topic tags unless it is attached only through an expressly qualified editorial relation. Use the stable official Gazette text rather than an unexplained dated upload path, and link G.S.R. 843(E) separately.
- Official sources: [Act No. 22 of 2023 Gazette PDF](https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf); [G.S.R. 843(E) commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf).

## Verified records; precision improvements only

### 10. `eu-gdpr`

- In force and generally applicable since 25 May 2018. The ELI page identifies the current displayed version and supplies every EU official-language rendition.
- **Precision improvement:** do not describe English as “the original language.” EU official-language versions are authentic. Represent the corpus as 24-language official text with English as the UI default; note that local Article records must be checked against the current ELI rendition/corrigenda.
- Official source: [GDPR ELI](https://eur-lex.europa.eu/eli/reg/2016/679/oj).

### 11. `us-eo-14110`

- Correctly retained as a historical node. EO 14148 expressly revoked EO 14110 on 20 January 2025. Its former directives must not appear as current duties.
- **Precision improvement:** link the revoking order directly in an `amendmentSource`/status event.
- Official sources: [historical EO 14110](https://www.federalregister.gov/documents/2023/11/01/2023-24283/safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence); [EO 14148 revocation](https://www.federalregister.gov/documents/2025/01/28/2025-01901/initial-rescissions-of-harmful-executive-orders-and-actions).

### 12. `us-ca-sb-1047-2024`

- Correctly labelled a vetoed bill and not California law. The Governor vetoed it on 29 September 2024.
- **Precision improvement:** use “enrolled bill text, vetoed” only for historical/proposal comparison and keep all proposed obligations visually segregated from enacted California sources.
- Official source: [California Legislative Information bill status, text, history, and veto message](https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202320240SB1047).

### 13. `cn-pipl`

- The 2021 law remains marked effective in the National Laws and Regulations Database; no enacted amendment was identified by the cut-off. The Chinese text controls; no official English translation is supplied by the legislature.
- **Precision improvement:** make the NPC/National Laws and Regulations Database the canonical enactment source; retain the CAC reproduction as a secondary official mirror. English must stay labelled project/reference translation.
- Official sources: [NPC text](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html); [National Laws and Regulations Database record](https://flk.npc.gov.cn/detail?fileId=&id=ff8081817b6472a3017b656cc2040044&title=%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E4%B8%AA%E4%BA%BA%E4%BF%A1%E6%81%AF%E4%BF%9D%E6%8A%A4%E6%B3%95&type=).

### 14. `cn-cybersecurity-law`

- The record's substantive version finding is correct: the first amendment was adopted 28 October 2025, effective 1 January 2026, and the current re-promulgated text has 81 Articles. Added Articles include 3, 20 and 73; renumbering affects pre-2026 crosswalks.
- **Precision improvement:** store both the consolidated 81-Article source and the amendment decision; every pre-amendment locator should be version-scoped or migrated.
- Official sources: [current consolidated text](https://www.cac.gov.cn/2025-12/29/c_1768735112911946.htm); [NPC amendment decision](https://www.npc.gov.cn/npc/c1773/c1848/c21114/wlaqfxz/wlaqfxz002/202511/t20251103_449242.html); [Presidential Order No. 61](https://www.npc.gov.cn/npc/c2/c30834/202510/t20251028_449031.html).

### 15. `cn-network-data-regulations`

- State Council Order No. 790 was adopted at the 30 August 2024 executive meeting, promulgated 24 September, and effective 1 January 2025. Current status and hierarchy are correct.
- **Precision improvement:** distinguish promulgation date (24 September) from web publication (30 September), and prefer the State Council/Gazette text as the canonical source.
- Official sources: [State Council full text](https://app.www.gov.cn/govdata/gov/202409/30/520076/article.html); [State Council Gazette, Issue 29/2024](https://www.gov.cn/gongbao/2024/issue_11646/).

### 16. `cn-generative-ai-measures`

- Order No. 15 remains in force. Scope wording is accurate: Article 2 reaches generative-AI services offered to the public within China and excludes research/development/application not offered to the domestic public.
- **Precision improvement:** preserve Chinese as controlling; no official full English text was identified. Keep later filing/assessment notices as implementation materials, not amendments to Order No. 15.
- Official source: [CAC Order No. 15 and full Chinese text](https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm).

### 17. `ca-pipeda`

- Version metadata is exact: the Justice Laws site says the Act is current to 26 May 2026 and last amended 4 March 2025. Scope caveat for substantially similar provincial laws is necessary.
- **Precision improvement:** Canada has English and French official texts. Do not label English as the sole/original text; expose both official language versions.
- Official source: [Justice Laws consolidated PIPEDA](https://laws-lois.justice.gc.ca/eng/acts/P-8.6/).

### 18. `ca-directive-automated-decision-making`

- The current page is modified 24 June 2025. The updated requirements' transition for older systems and Agents of Parliament ended 24 June 2026. The directive is mandatory only within its federal-policy scope, not general Canadian private-sector law.
- **Precision improvement:** say the transition **has ended** at the cut-off. Expose both official English and French pages.
- Official source: [current Treasury Board Directive](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32592); [official scope guide](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/responsible-use-ai/guide-scope-directive-automated-decision-making.html).

### 19. `un-ai-advisory-final-report-2024`

- Correctly labelled an advisory report, not a treaty, General Assembly resolution, or binding instrument. The 19 September 2024 launch date is supportable.
- **Precision improvement:** the UN supplies Arabic, Chinese, English, French, Russian, and Spanish editions. Use the UN Digital Library record as a stable bibliographic/full-text source and do not call later UN governance institutions amendments to this report.
- Official sources: [UN Advisory Body page](https://www.un.org/en/ai-advisory-body); [UN Digital Library record](https://digitallibrary.un.org/record/4062495); [English report PDF](https://www.un.org/sites/un2.un.org/files/governing_ai_for_humanity_final_report_en.pdf).

### 20. `iso-iec-42001-2023`

- Correct: Edition 1, published 18 December 2023, stage 60.60, and still “Published.” It is a requirements standard, but not automatically law.
- **Precision improvement:** ISO offers English and French editions. Keep copyrighted clauses out of the repository; summaries and mappings must remain project-authored. Certification, contractual adoption, procurement, or legal incorporation should be separate relation/effect layers.
- Official source: [ISO/IEC 42001:2023 catalogue and lifecycle](https://www.iso.org/standard/42001).

### 21. `ieee-ethically-aligned-design-2019`

- Correct: IEEE labels it a “Published White Paper,” published 31 March 2019. It is not an IEEE technical standard and has no binding legal force.
- **Precision improvement:** lifecycle should remain `published-guidance`, not “active standard,” and later IEEE standards/certification programs should be separate nodes.
- Official source: [IEEE Standards Association publication record](https://standards.ieee.org/ieee/White_Paper/10594/).

### 22. `oecd-ai-principles`

- Correct current instrument: OECD/LEGAL/0449, adopted 22 May 2019 and most recently substantively revised 3 May 2024. The instrument was also revised on 8 November 2023 to update the AI-system definition; the 2024 version supersedes it.
- **Precision improvement:** expose both official English and French renditions and record the 2023 definition revision in lifecycle history. “Non-binding recommendation” is the correct legal-force label.
- Official sources: [current legal-instrument page](https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0449); [official printable current English text](https://legalinstruments.oecd.org/api/print?ids=648&lang=en); [OECD 3 May 2024 revision announcement](https://www.oecd.org/en/about/news/press-releases/2024/05/oecd-updates-ai-principles-to-stay-abreast-of-rapid-technological-developments.html).

### 23. `int-bletchley-declaration-2023`

- Correct: non-binding political declaration issued 1 November 2023. The official page was updated 13 February 2025 to record that New Zealand joined the commitment on 23 October 2024.
- **Precision improvement:** change the version wording so a webpage update is not mistaken for an amendment to the declaration: “Declaration issued 1 November 2023; official participant list updated 13 February 2025 to record New Zealand's 23 October 2024 accession.” Prefer lifecycle `issued-nonbinding-declaration` over a label implying an enforceable or time-limited obligation.
- Official source: [GOV.UK declaration and participant history](https://www.gov.uk/government/publications/ai-safety-summit-2023-the-bletchley-declaration/the-bletchley-declaration-by-countries-attending-the-ai-safety-summit-1-2-november-2023).

## Cross-cutting data rules from this audit

1. **Separate legal state from pipeline state.** Use distinct fields/events for `in-force`, `partially-applicable`, `adopted-awaiting-publication`, `promulgated-awaiting-commencement`, `vetoed`, `revoked`, and `non-binding-issued`.
2. **Do not use one `language` field as both UI default and authority statement.** EU law has 24 authentic official-language versions; Canadian legislation is English/French; Indian Gazette texts are bilingual; Japanese and Chinese English versions in this corpus are reference/editorial translations; the UN report has six official-language editions.
3. **Never infer equivalence from shared concepts.** In particular, India DPDP should not be presented as containing a GDPR Article 22 analogue, and standards/guidelines must not be shown as statutory compliance safe harbours without an explicit adoption/incorporation source.
4. **Version every locator.** This is essential for China's renumbered 2026 Cybersecurity Law, UK GDPR point-in-time amendments, the pending EU AI Act amendment, and Japan's promulgated-but-mostly-uncommenced 2026 APPI amendment.
5. **Keep official full text separate from editorial summaries.** Every English rendering of Chinese law and any Japanese provision beyond the government reference-translation version must be labelled non-authoritative; paid ISO and copyrighted IEEE text should not be reproduced.
