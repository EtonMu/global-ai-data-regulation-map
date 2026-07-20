# APAC legal-source audit for Compliance Compass

**Cut-off date:** 19 July 2026  
**Scope:** Singapore, South Korea, Australia, Taiwan, Hong Kong SAR, Indonesia, and Vietnam.  
**Source standard:** legislation databases, gazettes, parliaments, ministries, and regulators only. Commercial summaries are not treated as authority. Where an official English text could not be verified, the report says so explicitly.

This report is a content and lifecycle audit, not legal advice. Dates and lifecycle states should be stored as data, not flattened into descriptive prose, because several instruments below have future amendments, historical versions, or non-binding status.

## 1. Corrections that should be reflected in the product

| User-facing proposition | Verified position at the cut-off date |
|---|---|
| South Korea's AI Basic/Framework Act is a draft | **Incorrect.** The Framework Act was promulgated on 21 January 2025 and entered into force on 22 January 2026. An amending Act has provisions with a further commencement on 21 July 2026. |
| Taiwan's AI Basic Act is a draft | **Incorrect.** The Artificial Intelligence Basic Act was promulgated and entered into force on 14 January 2026. |
| Taiwan already has an operating independent Personal Data Protection Commission | **Not yet.** The Preparatory Office exists, but Article 1-1 (commission) and the 2025 supervisory overhaul remain uncommenced pending an Executive Yuan commencement order. |
| Australia's proposed mandatory AI guardrails are current mandatory requirements | **Incorrect.** The 2024 proposals-paper consultation is closed and the government says it will not proceed with that proposal “at this time.” The current successor is voluntary 2025 Guidance for AI Adoption. |
| Australia's automated-decision privacy-policy rules are already operative | **Incorrect as of the cut-off.** The rules were enacted in 2024 but commence on 10 December 2026. They require a future-effective lifecycle state. |
| Vietnam's Decree 13/2023 is the current comprehensive privacy regime | **Out of date.** It was repealed from 1 January 2026. The controlling instruments are Law No. 91/2025/QH15 and Decree No. 356/2025/ND-CP. |
| Vietnam imposes a blanket personal-data localisation rule | **Overbroad.** The current personal-data regime principally uses processing and cross-border-transfer impact assessments. Separate cybersecurity/data or sectoral rules may impose storage requirements in particular circumstances. |
| Indonesia's PDP Law is still in its transition period | **Incorrect.** The Law took effect on 17 October 2022 and the two-year adjustment period ended on 17 October 2024. |
| Hong Kong PDPO section 33 is an operative cross-border-transfer prohibition | **Incorrect.** Section 33 has not commenced. It should not be rendered as a current prohibition. |

## 2. Recommended lifecycle and relationship vocabulary

Use a controlled lifecycle enum so visual appearance carries legal meaning:

- `in_force`
- `in_force_with_future_amendments`
- `adopted_not_in_force`
- `active_voluntary`
- `tool`
- `proposal_closed_not_proceeding`
- `historical_repealed`

Use conservative edge types:

- `implements`: a subordinate measure gives effect to a superior instrument.
- `operationalizes`: a framework or tool turns a principle into organisational practice or testing.
- `partially_corresponds_to`: provisions address substantially overlapping concepts but are not legally interchangeable.
- `supports`: one source helps satisfy or evidence a concept in another without guaranteeing compliance.
- `contrasts_with`: materially different legal mechanism or scope.
- `amends`, `future_amendment_to`, `repeals`, and `supersedes`: lifecycle edges.
- `equivalent_to`: reserve for an express legal equivalence or adequacy finding; do not infer it from similarity.

Every substantive edge should include a short rationale and the exact source anchor on both ends.

## 3. Singapore

### 3.1 `sg-pdpa-2012`

| Field | Audited value |
|---|---|
| Jurisdiction | Singapore |
| Exact English title | **Personal Data Protection Act 2012** |
| Original-language title | Same; Singapore Statutes Online publishes the controlling text in English |
| Issuer / administrator | Parliament and President; Personal Data Protection Commission (PDPC) administers the general regime |
| Type / lifecycle | Act; `in_force` |
| Key dates | Passed 15 Oct 2012; assented 20 Nov 2012; phased commencement from 2 Jan 2013 through 2 Jul 2014. Major 2020 amendments began commencing 1 Feb 2021. The official timeline records a further amendment on 5 Dec 2025; current official version is stated as at 30 May 2026. |
| Current source | [Singapore Statutes Online — current Act](https://sso.agc.gov.sg/Act/PDPA2012/) |
| As-made / chronology | [Act 26 of 2012](https://sso.agc.gov.sg/Acts-Supp/26-2012/Published/20121203?DocDate=20121203); [PDPC commencement note for 2020 amendments](https://www.pdpc.gov.sg/news-and-events/announcements/2021/01/amendments-to-the-personal-data-protection-act-take-effect-from-1-february-2021) |
| Official English completeness | Complete, current official English text available |
| High-level summary | Omnibus private-sector personal-data law covering accountable processing, consent and exceptions, notification and purpose limits, individual access/correction, security, retention, overseas transfers, breach notification, Do Not Call rules, and enforcement. It is not an AI-specific act. |

Recommended provision anchors:

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| ss 11–12 | Organisational accountability | governance; DPO; policies | `partially_corresponds_to` accountability provisions elsewhere because these sections allocate organisational responsibility and require compliance arrangements. |
| ss 13–20 | Consent, purpose and notice | lawful basis; consent; purpose limitation; transparency | Map at provision level; Singapore's deemed-consent and statutory-exception architecture is not identical to GDPR lawful bases. |
| ss 21–26 | Rights and lifecycle controls | access; correction; accuracy; security; retention; transfer | `partially_corresponds_to`, with separate edges for each duty rather than one broad “privacy” edge. |
| ss 26A–26E | Data-breach assessment and notification | incident response; regulator/data-subject notice | Map to breach-notification nodes using timing and threshold in the rationale, not as generic equivalence. |
| s 48J | Financial penalties | enforcement; administrative sanctions | Map to enforcement concepts only; penalty-calculation mechanisms differ across jurisdictions. |

**Text coverage recommendation:** ingest the full current official text and article headings. Preserve amendment and effective-date metadata. No language toggle is needed unless a verified official non-English edition is later added.

### 3.2 `sg-model-ai-governance-framework-2020`

| Field | Audited value |
|---|---|
| Exact title | **Model Artificial Intelligence Governance Framework, Second Edition** |
| Issuer | PDPC and Infocomm Media Development Authority (IMDA) |
| Type / lifecycle | Voluntary organisational framework; `active_voluntary` |
| Key dates | First edition 23 Jan 2019; second edition 21 Jan 2020 |
| Official sources | [PDPC framework page](https://www.pdpc.gov.sg/help-and-resources/2020/01/model-ai-governance-framework); [official second-edition PDF](https://www.pdpc.gov.sg/-/media/files/pdpc/pdf-files/resource-for-organisation/ai/sgmodelaigovframework2.pdf) |
| Official English completeness | Complete official English PDF |
| High-level summary | Practical, technology- and sector-agnostic guidance built around two principles: AI decisions should be explainable, transparent and fair, and AI systems should be human-centric. It organises implementation across governance, human involvement, operations, and stakeholder communication. |

| Section anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Internal governance structures and measures | Assign ownership and oversight | accountability; roles; controls | `operationalizes` high-level accountability principles through roles, escalation and monitoring. |
| Determining the level of human involvement | Calibrate human control to risk | human-in-the-loop; human-over-the-loop; human-out-of-the-loop | `partially_corresponds_to` human-oversight duties; retain the framework's risk-calibration nuance. |
| Operations management | Govern data and model lifecycles | data quality; robustness; monitoring | `supports` statutory governance/security duties but does not itself establish legal compliance. |
| Stakeholder interaction and communication | Explain and provide feedback paths | transparency; explanation; contestability | `operationalizes` transparency and individual-engagement concepts. |

**Text coverage recommendation:** link the full PDF, ingest headings and carefully delimited excerpts/summaries. Render as voluntary guidance, never as binding legislation.

### 3.3 `sg-ai-verify-testing-framework`

| Field | Audited value |
|---|---|
| Exact title | **AI Verify** |
| Issuer | IMDA; ecosystem supported by the AI Verify Foundation |
| Type / lifecycle | Open-source governance testing framework and toolkit; `tool` |
| Key dates | International MVP pilot announced May 2022; open-sourced and Foundation launched 7 Jun 2023 |
| Official sources | [IMDA — AI Verify](https://www.imda.gov.sg/how-we-can-help/ai-verify); [IMDA launch announcement](https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2023/singapore-launches-ai-verify-foundation) |
| Official English completeness | Official English framework/tool documentation is available; it has no statutory “articles” |
| High-level summary | Testing and process-check toolkit for generating evidence about an AI system against governance principles. It does not certify legal compliance and should not be represented as law. |

| Module/theme anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Governance process checks | Evidence organisational controls | accountability; documentation | `operationalizes` governance requirements by producing process evidence. |
| Fairness testing | Measure outcome disparities | fairness; non-discrimination | `supports` fairness review; test results do not establish legal non-discrimination by themselves. |
| Explainability and transparency testing | Inspect reasons and disclosures | explainability; transparency | `supports` explanation obligations, with model- and use-case-specific limitations. |
| Robustness, safety, security and reproducibility tests | Test technical dependability | robustness; safety; security; repeatability | `operationalizes` technical-risk concepts and can link to risk-management controls. |

The current principle set spans transparency, explainability, repeatability/reproducibility, safety, security, robustness, fairness, data governance, accountability, human agency/oversight, and inclusive/societal/environmental well-being.

**Text coverage recommendation:** model principles, test modules, and outputs as tool nodes. Link to code/documentation. Do not invent legislative article nodes or use `equivalent_to` edges.

## 4. South Korea

### 4.1 `kr-pipa-2011`

| Field | Audited value |
|---|---|
| Exact English title | **Personal Information Protection Act** |
| Exact Korean title | **개인정보 보호법** |
| Issuer / regulator | National Assembly and President; Personal Information Protection Commission (PIPC) |
| Type / lifecycle | Act; `in_force_with_future_amendments` |
| Key dates | Original Act No. 10465 promulgated 29 Mar 2011 and effective 30 Sep 2011. Current version at the cut-off: Act No. 20897, promulgated 1 Apr 2025 and effective 2 Oct 2025. Act No. 21445, promulgated 10 Mar 2026, has future phases from 11 Sep 2026 and 1 Jul 2027 and is not yet the current text. |
| Current Korean source | [Korean Law Information Center — PIPA](https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=011357) |
| Version/search source | [Official version and translation listing](https://www.law.go.kr/unSc.do?menuId=10&query=%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EB%B3%B4%ED%98%B8%EB%B2%95); [original enactment record](https://www.law.go.kr/LSW/lsSideInfoP.do?ancNo=10465&ancYd=20110329&chrClsCd=010202&lsNm=%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4+%EB%B3%B4%ED%98%B8%EB%B2%95&urlMode=lsRvsDocInfoR); [future Act No. 21445](https://law.go.kr/LSW/lsInfoP.do?lsiSeq=283839&viewCls=lsRvsDocInfoR) |
| Official English completeness | The official database lists English translations. A directly verified English snapshot is available for an older consolidated version; verify the Act No. 20897 English snapshot before ingestion and attach its version date. [Official English snapshot](https://law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=248613&urlMode=engLsInfoR&viewCls=engLsInfoR) |
| High-level summary | Comprehensive personal-information law with processing grounds, data-subject rights, special safeguards, cross-border-transfer rules, breach duties, security obligations, PIPC supervision, and rights concerning certain fully automated decisions. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Art 3 | Core processing principles | purpose limitation; minimisation; accuracy; security; transparency; accountability | `partially_corresponds_to` global fair-processing principles while preserving Korea's statutory wording. |
| Arts 15 and 17 | Collection, use and third-party provision | lawful grounds; consent; disclosure | Use separate edges for collection/use and third-party provision; do not collapse them into GDPR consent. |
| Art 28-8 | Overseas transfer safeguards | cross-border transfer | `partially_corresponds_to` transfer-control regimes; rationale must record the applicable Korean grounds and safeguards. |
| Art 34 | Personal-data breach response | incident notification | Link to regulator/data-subject notification concepts using Korean thresholds and timing. |
| Art 37-2 | Rights concerning fully automated decisions | objection/refusal; explanation; human reprocessing | Map to automated-decision rights. The right and exceptions are not identical to GDPR Article 22. [Official article link](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029334889) |

The current Enforcement Decree contains detailed automated-decision provisions (Arts 44-2–44-4): [official decree link](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=186009). Related administrative notice: [PIPC Notice 2024-9](https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000247380).

**Text coverage recommendation:** ingest the complete current Korean version. Ingest English only after pinning it to the same amendment/version; otherwise label the available English as version-lagged. Create future-effective nodes for Act No. 21445 rather than showing its duties as current.

### 4.2 `kr-ai-framework-act-2025`

| Field | Audited value |
|---|---|
| Exact official English title | **FRAMEWORK ACT ON THE DEVELOPMENT OF ARTIFICIAL INTELLIGENCE AND THE CREATION OF A FOUNDATION FOR TRUST** |
| Exact Korean title | **인공지능 발전과 신뢰 기반 조성 등에 관한 기본법** |
| Issuer / competent ministry | National Assembly and President; Ministry of Science and ICT (MSIT) |
| Type / lifecycle | Framework Act; `in_force_with_future_amendments` |
| Key dates | Act No. 20676 promulgated 21 Jan 2025; effective 22 Jan 2026. Amending Act No. 21311 promulgated 20 Jan 2026; part is reflected from 22 Jan 2026 and remaining provisions commence 21 Jul 2026. |
| Official sources | [Official English text of Act No. 20676](https://www.law.go.kr/LSW/lsInfoP.do?chrClsCd=010203&lsiSeq=268543&urlMode=engLsInfoR&viewCls=engLsInfoR); [current Korean amended text](https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&chrClsCd=010202&efYd=20260122&lsiSeq=282791&urlMode=lsInfoP); [MSIT note on July 2026 provisions](https://english.msit.go.kr/eng/bbs/view.do?bbsSeqNo=42&mId=4&mPid=2&nttSeqNo=1264&sCode=eng) |
| Official English completeness | Complete official English exists for original Act No. 20676. The current amended Korean text controls; the version-alignment of an English Act No. 21311 consolidation was not confirmed. |
| High-level summary | National framework combining AI promotion and trust/safety requirements. It includes Korean-market effects, high-impact-AI classification, transparency and synthetic-output notices, safety/risk management, high-impact governance, human oversight, and domestic-agent requirements. It is enacted law, not a bill. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Arts 2–4 | Scope, definitions and governing principles | high-impact AI; rights; extraterritorial effect | Create separate nodes for definition and scope; map “high-impact” only as `partially_corresponds_to` other risk taxonomies. |
| Art 31 | AI and synthetic-output transparency | AI notice; generative-AI label; synthetic media | Map to transparency/provenance concepts; record whether the duty is advance notice, output marking, or virtual-content disclosure. |
| Art 32 | Safety duties for qualifying systems | lifecycle risk; incident monitoring; response reporting | `partially_corresponds_to` systemic/model safety duties; include the statutory compute-threshold condition. |
| Arts 33–34 | High-impact classification and operator safeguards | status review; risk management; explanation; user protection; human oversight; documentation | Map each safeguard individually. A shared “high risk” label is not legal equivalence with the EU AI Act. |
| Art 35 | Fundamental-rights impact assessment | impact assessment; public procurement | The Act uses an endeavour-based formulation; do not display this as an unconditional universal DPIA mandate. |

Optional certification/verification provisions, including Article 30, may link to assurance tools such as AI Verify through `supports`, never `implements` or `equivalent_to`.

**Text coverage recommendation:** current Korean full text is controlling. Default to the official English Act No. 20676 only with a conspicuous version label and reconcile all amended provisions against Korean before publishing them as current.

## 5. Australia

### 5.1 `au-privacy-act-1988`

| Field | Audited value |
|---|---|
| Exact title | **Privacy Act 1988** |
| Original-language title | Same (English) |
| Issuer / regulator | Commonwealth Parliament; Office of the Australian Information Commissioner (OAIC) |
| Type / lifecycle | Act; `in_force_with_future_amendments` |
| Key dates | Assented 14 Dec 1988. Latest official compilation at the cut-off: Compilation No. 104, 4 Jun 2026. The 2022 penalty amendments commenced 13 Dec 2022. The 2024 reforms were assented 10 Dec 2024 with staggered commencement; automated-decision privacy-policy provisions commence 10 Dec 2026. |
| Current source | [Federal Register of Legislation — current Act](https://www.legislation.gov.au/C2004A03712/latest) |
| Reform sources | [Privacy Legislation Amendment (Enforcement and Other Measures) Act 2022](https://www.legislation.gov.au/C2022A00083/latest); [Privacy and Other Legislation Amendment Act 2024](https://www.legislation.gov.au/C2024A00128/); [OAIC consultation confirming future ADM commencement](https://www.oaic.gov.au/engage-with-us/consultations/consultation-on-guidance-for-transparency-in-automated-decision-making) |
| Official English completeness | Complete official text and historical compilations |
| High-level summary | Federal privacy regime built around the Australian Privacy Principles (APPs), access/correction rights, overseas disclosure, security, eligible-data-breach notification and OAIC enforcement. Coverage and exemptions differ materially from GDPR-style universal regimes. |

The 2022 Act increased the corporate maximum for serious or repeated privacy interference to the greater of AUD 50 million, three times the benefit, or 30% of adjusted turnover for the relevant period, subject to the statutory calculation.

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| s 2A and APP 1 | Objects and open privacy management | accountability; policy; governance | `partially_corresponds_to` accountability frameworks while preserving Australian coverage/exemption limits. |
| APPs 3 and 5 | Collection and collection notice | necessity; notice; transparency | Map separately to collection controls and notice requirements. |
| APP 6 | Use and disclosure | purpose limitation; secondary use | `partially_corresponds_to` purpose-limitation regimes, with Australian exceptions in the rationale. |
| APPs 8 and 11 | Overseas disclosure and security | cross-border accountability; security | Do not imply adequacy-style equivalence; APP 8 uses an accountability-based mechanism. |
| Part IIIC and APPs 12–13 | Breach response and individual rights | breach notification; access; correction | Separate the breach scheme from access/correction nodes. |

**Future-effective item:** APP 1.7–1.9 automated-decision transparency requirements were enacted but are not operative until 10 Dec 2026. Render them with a future badge and commencement countdown, not inside current obligations.

**Text coverage recommendation:** ingest the complete current compilation plus separately versioned future provisions. Default English only; no language toggle required.

### 5.2 `au-mandatory-ai-guardrails-proposal-2024`

| Field | Audited value |
|---|---|
| Exact title | **Introducing Mandatory Guardrails for AI in High-Risk Settings: Proposals Paper** |
| Issuer | Australian Government, Department of Industry, Science and Resources |
| Type / lifecycle | Consultation proposal; `proposal_closed_not_proceeding` |
| Key dates | Consultation 5 Sep–4 Oct 2024; official page now says the government will not proceed with this proposal at this time |
| Official source | [Mandatory guardrails consultation page](https://consult.industry.gov.au/ai-mandatory-guardrails) |
| Official English completeness | Complete proposal materials available |
| High-level summary | Historical proposal for a high-risk definition, ten guardrails and possible regulatory models. It never became a binding “Mandatory AI Guardrails” instrument. |

If retained for legislative-history research, use section nodes for (1) high-risk criteria, (2) the ten proposed guardrails, (3) conformity/assurance, and (4) regulatory options. Every edge must carry `proposal_only: true`.

**Text coverage recommendation:** archive node only, visually distinct from current law and current guidance.

### 5.3 `au-guidance-for-ai-adoption-2025`

| Field | Audited value |
|---|---|
| Exact title | **Guidance for AI Adoption** (Foundations; Implementation Practices) |
| Issuer | Australian Government, Department of Industry, Science and Resources |
| Type / lifecycle | Voluntary guidance; `active_voluntary` |
| Key dates | Released 21 Oct 2025; current at the cut-off |
| Official sources | [Foundations PDF](https://www.industry.gov.au/sites/default/files/2025-10/guidance-for-ai-adoption-foundations.pdf); [Implementation Practices PDF](https://www.industry.gov.au/sites/default/files/2025-10/guidance-for-ai-adoption-implementation-practices.pdf); [National AI Plan](https://www.industry.gov.au/publications/national-ai-plan); [National AI Plan — safety](https://www.industry.gov.au/publications/national-ai-plan/keep-australians-safe) |
| Official English completeness | Complete official English guidance |
| High-level summary | Current voluntary successor for responsible organisational AI adoption. It supersedes the practical role of the older Voluntary AI Safety Standard and does not create statutory offences or mandatory high-risk guardrails. |

| Practice anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Decide who is accountable | Assign AI ownership | accountability; governance | `operationalizes` organisational accountability. |
| Understand impacts and plan; measure and manage risks | Assess and treat AI risk | impact assessment; risk management | `supports` risk-based compliance and assurance. |
| Share essential information | Communicate AI use and limitations | transparency; documentation | `operationalizes` transparency practices. |
| Test and monitor | Validate throughout operation | testing; monitoring; incident learning | `supports` technical assurance; does not certify compliance. |
| Maintain human control | Preserve meaningful intervention | human oversight; escalation | `partially_corresponds_to` statutory human-oversight concepts. |

**Text coverage recommendation:** ingest both official guidance documents at section level; mark every node voluntary.

## 6. Taiwan

### 6.1 `tw-personal-data-protection-act`

| Field | Audited value |
|---|---|
| Exact English title | **Personal Data Protection Act** |
| Exact Traditional Chinese title | **個人資料保護法** |
| Issuer / current administration | Legislative Yuan and President; current sectoral competent authorities. The Personal Data Protection Commission Preparatory Office exists, but the independent commission provisions are not yet in force. |
| Type / lifecycle | Act; `in_force_with_future_amendments` |
| Key dates | Predecessor enacted in 1995; comprehensively amended/renamed in 2010 and generally effective from 1 Oct 2012. Article 1-1 added in 2023 and the supervisory/enforcement package promulgated 11 Nov 2025 have commencement dates still to be set by the Executive Yuan. |
| Official Chinese | [Laws & Regulations Database — Chinese](https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021) |
| Official English | [Laws & Regulations Database — English](https://law.moj.gov.tw/ENG/LawClass/LawAll.aspx?pcode=I0050021) |
| Institutional-status source | [Personal Data Protection Commission Preparatory Office](https://www.pdpc.gov.tw/News_Content/100/1017/) |
| Official English completeness | Complete official English consolidation exists, but it includes promulgated provisions that are not yet commenced; an effective-date-aware snapshot is essential. |
| High-level summary | General personal-data law governing public and private-sector collection, processing and use, subject rights, notice, security, cross-border restrictions in specified circumstances, remedies and enforcement. The current and future supervisory architectures must not be merged. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Art 3 | Non-waivable data-subject rights | access; copy; correction; cessation; erasure | Map each right individually and preserve statutory limits/exceptions. |
| Art 5 | Fair, necessary and proportionate processing | good faith; purpose relation; necessity; proportionality | `partially_corresponds_to` fairness, purpose-limitation and minimisation principles. |
| Arts 8–9 | Notice and source transparency | collection notice; indirect collection | Map to notice/transparency concepts, distinguishing direct and indirect collection. |
| Arts 19–20 | Private-sector collection and use | lawful grounds; purpose; secondary use | Do not reduce the multi-ground structure to consent alone. |
| Arts 21 and 27 | Cross-border restrictions and security | transfer controls; safeguards | Article 21 empowers restrictions in specified circumstances; it is not a blanket transfer ban. Article 27 remains a current security anchor while the future 2025 restructuring is uncommenced. |

**Version warning:** the Ministry database prominently notes that Article 1-1 and the 2025 amendments—including new and amended supervisory, breach, security and penalty provisions—commence on dates to be determined. Do not display the promulgated consolidated wording as though every provision is currently operative.

**Text coverage recommendation:** store two snapshots: `current_in_force` and `promulgated_future`. Both official Chinese and English can be shown, but the English toggle must preserve the same lifecycle/version as the Chinese text.

### 6.2 `tw-ai-basic-act-2026`

| Field | Audited value |
|---|---|
| Exact English title | **Artificial Intelligence Basic Act** |
| Exact Traditional Chinese title | **人工智慧基本法** |
| Issuer / competent authority | Legislative Yuan and President; National Science and Technology Council (NSTC) is central competent authority |
| Type / lifecycle | Basic/framework Act; `in_force` |
| Key dates | Passed 23 Dec 2025; promulgated and effective 14 Jan 2026 |
| Official Chinese | [NSTC law database — Chinese](https://law.nstc.gov.tw/LawContent.aspx?id=GL000592&kw=) |
| Official English | [NSTC law database — English](https://law.nstc.gov.tw/EngLawContent.aspx?id=10099&lan=E) |
| Promulgation | [Office of the President — promulgation record](https://www.president.gov.tw/Page/294/50131) |
| Official English completeness | Complete, official and version-aligned English text |
| High-level summary | Twenty-article framework/basic law setting government policy, foundational AI principles, high-risk and child safeguards, privacy/security and transparency directions, risk categorisation, liability/redress policy and public-sector controls. Much implementation is entrusted to competent authorities and future sectoral rules; it is not a direct copy of the EU AI Act. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Art 4 | Seven AI governance principles | well-being; human autonomy/oversight; privacy/minimisation; security/robustness; transparency/explainability; fairness; accountability | Create one child concept per principle; avoid a single undifferentiated “ethical AI” node. |
| Art 5 | Special safeguards for children and high-risk AI | vulnerable persons; warnings; assessment tools | `partially_corresponds_to` high-risk and vulnerable-user safeguards. |
| Art 14 | Privacy by design and by default | privacy engineering; unnecessary-data avoidance | `supports` the core concept “Privacy by Design”; do not overstate detailed controller obligations beyond the text. |
| Arts 16–17 | Risk taxonomy, sector rules and remedies | risk classification; competent-authority rules; liability; compensation; insurance | Map the framework obligation to later sectoral implementation through `implements` only when such measures exist. |
| Art 19 | Government AI controls | public-sector impact assessment; internal control | Map to public-sector algorithmic governance and assessment nodes. |

**Text coverage recommendation:** ingest all twenty articles in both official languages. Default display should be English; switch to Traditional Chinese only on user action.

### 6.3 `tw-executive-yuan-generative-ai-guidelines-2023`

| Field | Audited value |
|---|---|
| Recommended English title | **Reference Guidelines for the Use of Generative AI by the Executive Yuan and Its Subordinate Agencies (Institutions)** — editorial translation, not verified as an official full English title |
| Exact Traditional Chinese title | **行政院及所屬機關（構）使用生成式AI參考指引** |
| Issuer | Executive Yuan |
| Type / lifecycle | Public-sector reference guidance; `active_voluntary` / internal administrative guidance |
| Key dates | Draft publicly reported 31 Aug 2023; formally issued 3 Oct 2023 |
| Official sources | [Executive Yuan announcement](https://www.ey.gov.tw/Page/448DE008087A1971/40c1a925-121d-4b6b-8f40-7e9e1a5401f2); [NSTC GenAI policy hub](https://www.nstc.gov.tw/folksonomy/list/c79bf57b-dc94-4aff-8d14-3262b5559cfc?l=ch); [official full text/PDF mirror](https://www.sme.gov.tw/article-tw-2391-11626); [official issuance-date reference](https://elearn.hrd.gov.tw/info/10043389) |
| Official English completeness | No complete official English version was located. Use an editorial English summary with a clear label; original Traditional Chinese controls. |
| High-level summary | Practical ten-point guidance for government use of generative AI: human responsibility, restrictions on classified/confidential/personal/non-public inputs, verification, disclosure of AI assistance, legal/ethical compliance, internal controls and procurement safeguards. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Point 2 | Humans retain final judgment | human autonomy; responsibility | `operationalizes` meaningful human control in public administration. |
| Points 3–4 | Protect classified and non-public information | confidentiality; personal data; secure deployment | Link to data security and minimisation; note the secure-local-model qualification. |
| Point 5 | Verify output before official reliance | accuracy; human review; contestability | The guidance bars unverified output as an administrative act or sole decision basis. |
| Points 6–7 | Disclose use and respect legal rights | transparency; privacy; copyright; personality rights | Map each legal interest separately. |
| Points 7–8 | Build internal and supplier controls | governance; procurement; vendor risk | `operationalizes` organisational and third-party AI governance. |

**Text coverage recommendation:** ingest the complete Chinese original and point-level summaries. The default English view must be labelled `editorial_translation`, not “official English.”

## 7. Hong Kong SAR

### 7.1 `hk-personal-data-privacy-ordinance`

| Field | Audited value |
|---|---|
| Exact English title | **Personal Data (Privacy) Ordinance (Cap. 486)** |
| Exact Traditional Chinese title | **《個人資料（私隱）條例》（第486章）** |
| Issuer / regulator | Legislative Council; Privacy Commissioner for Personal Data (PCPD) |
| Type / lifecycle | Ordinance; `in_force` |
| Key dates | Enacted 3 Aug 1995; principal operative regime from 20 Dec 1996. Anti-doxxing amendments passed 29 Sep 2021 and effective 8 Oct 2021. |
| Official legislation | [Hong Kong e-Legislation — Cap. 486](https://www.elegislation.gov.hk/hk/cap486) |
| Regulator sources | [PCPD consolidated English PDF](https://www.pcpd.org.hk/english/files/pdpo.pdf); [legislative history](https://www.pcpd.org.hk/english/about_pcpd/our_organisation/facts/key_facts_n_history.html); [2021 amendments](https://www.pcpd.org.hk/english/data_privacy_law/amendments_2021/amendment_2021.html) |
| Official English completeness | Complete bilingual official legislation; English and Chinese are authoritative texts |
| High-level summary | Technology-neutral data-protection ordinance organised around six Data Protection Principles, access/correction rights, direct-marketing controls, offences and PCPD enforcement. It is not a dedicated AI law. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Schedule 1, DPP 1 | Fair and necessary collection | collection; minimisation; notice | `partially_corresponds_to` lawful/fair collection and transparency principles. |
| DPP 2 | Accuracy and retention | data quality; storage limitation | Map separately to accuracy and retention concepts. |
| DPP 3 | Use limited to the prescribed purpose | purpose limitation; prescribed consent | Preserve the PDPO's “prescribed consent” structure in the rationale. |
| DPP 4 | Security, including processor controls | security; vendor management | `partially_corresponds_to` security and processor-governance duties. |
| DPPs 5–6 | Openness, access and correction | transparency; subject rights | Create separate child nodes for openness, access and correction. |

Official DPP summary: [PCPD — Six Data Protection Principles](https://www.pcpd.org.hk/english/data_privacy_law/6_data_protection_principles/principles.html).

**Critical cross-border warning:** PDPO section 33 has never commenced. The PCPD's official model-clauses guidance states this expressly: [Guidance on Recommended Model Contractual Clauses](https://www.pcpd.org.hk/english/resources_centre/publications/files/guidance_model_contractual_clauses.pdf). Model section 33 as `adopted_not_in_force`, not a current transfer prohibition.

**Text coverage recommendation:** ingest full bilingual legislation from e-Legislation, version-pinned. Default English; switch to Traditional Chinese only on user action.

### 7.2 `hk-ai-model-pd-protection-framework-2024`

| Field | Audited value |
|---|---|
| Exact English title | **Artificial Intelligence: Model Personal Data Protection Framework** |
| Exact Traditional Chinese title | **《人工智能（AI）：個人資料保障模範框架》** |
| Issuer | PCPD |
| Type / lifecycle | Voluntary AI/privacy governance framework; `active_voluntary` |
| Key date | Issued 11 Jun 2024 |
| Official sources | [PCPD announcement](https://www.pcpd.org.hk/english/news_events/media_statements/press_20240611.html); [official English PDF](https://www.pcpd.org.hk/english/resources_centre/publications/files/ai_protection_framework.pdf) |
| Official English completeness | Complete official English and Chinese editions are available through PCPD |
| High-level summary | Operational framework for procuring, implementing and using AI where personal data is involved. It applies privacy, risk, governance, human-oversight and communication practices to the AI lifecycle. |

| Section anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| AI strategy and governance | Establish ownership and policy | governance; accountability | `operationalizes` PDPO accountability and governance practice. |
| Risk assessment and human oversight | Calibrate controls to risk | assessment; human oversight | `supports` risk-based AI deployment; not itself a statutory impact-assessment duty. |
| Model customisation, implementation and management | Test, secure and monitor AI | validation; security; lifecycle monitoring | `operationalizes` technical and data-protection controls. |
| Communication and engagement | Notify, explain and receive feedback | transparency; explanation; contestability | `supports` meaningful notice and stakeholder engagement. |

**Text coverage recommendation:** section-level bilingual framework nodes; label voluntary and link back to PDPO provisions via `supports`/`operationalizes`.

### 7.3 `hk-ethical-ai-guidance-2021`

| Field | Audited value |
|---|---|
| Exact English title | **Guidance on the Ethical Development and Use of Artificial Intelligence** |
| Exact Traditional Chinese title | **《開發及使用人工智能道德標準指引》** |
| Issuer | PCPD |
| Type / lifecycle | Voluntary guidance; `active_voluntary` |
| Key date | Issued Aug 2021 |
| Official source | [PCPD official English PDF](https://www.pcpd.org.hk/english/resources_centre/publications/files/guidance_ethical_e.pdf) |
| Official English completeness | Complete official English; corresponding Chinese edition available from PCPD |
| High-level summary | Ethical-AI guidance organised around accountability, human oversight, transparency/interpretability, data privacy, fairness, beneficial AI, and reliability/robustness/security. |

Recommended nodes: (1) accountability and governance, (2) human oversight, (3) transparency and interpretability, (4) privacy and fairness, and (5) beneficial, reliable, robust and secure AI. Use `supports` edges to law and `partially_corresponds_to` edges to other ethical frameworks.

### 7.4 `hk-genai-employee-guidelines-checklist-2025`

| Field | Audited value |
|---|---|
| Exact English title | **Checklist on Guidelines for the Use of Generative AI by Employees** |
| Exact Traditional Chinese title | **《僱員使用生成式AI的指引清單》** |
| Issuer | PCPD |
| Type / lifecycle | Voluntary workplace checklist; `active_voluntary` |
| Key date | Issued 31 Mar 2025 |
| Official source | [PCPD announcement and checklist links](https://www.pcpd.org.hk/english/news_events/media_statements/press_20250331.html) |
| Official English completeness | Official English and Chinese materials available |
| High-level summary | Concrete employer checklist on permitted GenAI tools and uses, handling personal/confidential information, verifying outputs, IP and bias, security incidents, employee training and consequences. |

**Text coverage recommendation:** a related practice/checklist node, not a core statute. Suggested anchors: scope/permitted tools; sensitive inputs; output verification/IP/bias; security/incident reporting; training/enforcement.

## 8. Indonesia

### 8.1 `id-pdp-law-2022`

| Field | Audited value |
|---|---|
| Recommended English title | **Law No. 27 of 2022 on Personal Data Protection** — editorial translation |
| Exact Indonesian title | **Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi** |
| Issuer | House of Representatives and President of Indonesia |
| Type / lifecycle | Act; `in_force` |
| Key dates | Enacted, promulgated and effective 17 Oct 2022; Article 74's two-year adjustment period ended 17 Oct 2024. Constitutional Court Decision No. 151/PUU-XXII/2024 was decided 30 Jul 2025. |
| Official sources | [Government legislation portal](https://www.peraturan.go.id/id/uu-no-27-tahun-2022); [BPK legislation database and constitutional annotation](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022.12UUD); [official Indonesian PDF](https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf); [Constitutional Court announcement](https://www.mkri.id/berita/mk-data-pribadi-warga-wajib-dilindungi-negara-secara-maksimal-23553) |
| Official English completeness | No complete, current official English translation was located. English UI text must be labelled editorial/unofficial. |
| High-level summary | Indonesia's comprehensive personal-data law establishes data-subject rights, controller/processor obligations, lawful bases, high-risk impact assessment, security and breach duties, DPO requirements, cross-border-transfer safeguards, sanctions and offences. It is fully beyond its transition period. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Arts 6–13, especially Art 10 | Individual rights and automated decisions | access/correction/deletion; objection to solely automated decisions | Map Article 10 to automated-decision rights where the decision has legal or similarly significant effects; do not claim it is identical to GDPR Article 22. |
| Art 20 | Lawful bases for processing | consent; contract; legal duty; vital interests; public task; legitimate interests | Create one child node per basis. This is much more accurate than describing the law as consent-only. |
| Art 34 | High-risk processing impact assessment | DPIA; automated decisions; sensitive/large-scale data; scoring; monitoring; new technology | `partially_corresponds_to` DPIA regimes, with Indonesia's enumerated triggers in the rationale. |
| Arts 46 and 53 | Breach notification and DPO | 3×24-hour notice; governance personnel | Map to incident response and accountability separately. Following Constitutional Court Decision 151/PUU-XXII/2024, Article 53(1)(b)'s conjunction is read as “and/or,” so the DPO triggers operate independently as corrected. |
| Art 56 | Cross-border-transfer safeguards | transfer ladder; safeguards; consent | Map the sequence: equivalent/higher protection; adequate and binding safeguards; otherwise data-subject consent. It is not a blanket localisation rule. |

Article 57's administrative-fine architecture and the Act's offences should be separate enforcement nodes. Do not infer that a controller's compliance with one transfer step establishes foreign-law adequacy for other regimes.

**Text coverage recommendation:** ingest the full official Indonesian text. Provide default-English article headings and summaries only as `editorial_translation`; the user-initiated original-language view should show exact Indonesian. Include the Constitutional Court interpretation in current Article 53 metadata rather than leaving the original conjunction unqualified.

## 9. Vietnam

### 9.1 `vn-personal-data-protection-law-2025`

| Field | Audited value |
|---|---|
| Recommended English title | **Law on Personal Data Protection (Law No. 91/2025/QH15)** |
| Exact Vietnamese title | **Luật Bảo vệ dữ liệu cá nhân** |
| Issuer | National Assembly of Vietnam |
| Type / lifecycle | Law; `in_force` |
| Key dates | Adopted 26 Jun 2025; effective 1 Jan 2026 |
| Official sources | [Government legal-document record and signed PDF](https://vanban.chinhphu.vn/?docid=214590&pageid=27160); [Official Gazette record](https://congbao.chinhphu.vn/van-ban/luat-so-91-2025-qh15-45578/57730.htm); [searchable official Gazette PDF](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2025/6/45578/57730-1-2025971-97291-2025-qh15.pdf) |
| Official English completeness | An English Official Gazette listing appears to exist, but a complete version-aligned official English text was not conclusively retrieved and verified in this audit. Treat Vietnamese as controlling; do not label a machine/editorial translation official. |
| High-level summary | Current comprehensive personal-data law covering processing principles and rights, consent, exceptions, processing and cross-border-transfer impact assessments, breach notification, sector/use-case controls, AI and digital-platform processing, DPO/personnel, exemptions and substantial administrative penalties. |

Article 8 sets maximum organisational penalties of ten times unlawful proceeds for data trading (subject to the statutory floor rule), 5% of the prior year's revenue for cross-border-transfer violations (again subject to the statutory floor rule), and VND 3 billion for other personal-data violations; individuals face half the organisational maximum.

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Arts 3–4 | Principles and data-subject rights | purpose/scope; accuracy; retention; security; consent withdrawal; access; correction; deletion; restriction; objection; redress | Split broad principles and individual rights into child nodes for usable crosswalks. |
| Arts 9–10 | Consent and withdrawal/restriction | informed/specific/verifiable consent; no bundled purposes; silence not consent | Map to consent-quality concepts while preserving Vietnam's express formal requirements. |
| Arts 20–22 | Transfer and processing impact assessments | cross-border assessment; processing assessment; 60-day filing; updates | `partially_corresponds_to` DPIA/transfer-assessment systems. This is an assessment-and-filing model, not a blanket localisation ban. |
| Art 23 | Notify harmful personal-data violations | incident response; 72-hour authority notice | Map using the statutory harm trigger and the 72-hour period. |
| Arts 29–30 | Platforms, tracking and AI processing | privacy choices; no tracking without consent; purpose/necessity; security; AI risk classification | Map to online choice, privacy engineering, AI risk and security nodes; Article 30 does not by itself create a complete AI Act. |

**Text coverage recommendation:** ingest the full Vietnamese official text. Add English only if the exact official Gazette translation is obtained and matched article-by-article; until then, use labelled editorial headings/summaries.

### 9.2 `vn-pdpl-implementing-decree-356-2025`

| Field | Audited value |
|---|---|
| Recommended English title | **Decree No. 356/2025/ND-CP Detailing a Number of Articles of and Measures for Implementing the Law on Personal Data Protection** |
| Exact Vietnamese title | **Nghị định số 356/2025/NĐ-CP quy định chi tiết một số điều và biện pháp thi hành Luật Bảo vệ dữ liệu cá nhân** |
| Issuer | Government of Vietnam |
| Type / lifecycle | Implementing decree; `in_force` |
| Key dates | Issued 31 Dec 2025; effective 1 Jan 2026 |
| Official sources | [Government legal-document record](https://vanban.chinhphu.vn/?classid=1&docid=216387&pageid=27160&typegroupid=4); [Official Gazette record](https://congbao.chinhphu.vn/van-ban/nghi-dinh-so-356-2025-nd-cp-468371.htm); [official Gazette PDF](https://congbaocdn.chinhphu.vn/180507251028987904/2026/1/17/356signed-1768638052103952849513.pdf) |
| Official English completeness | No complete version-aligned official English text was located |
| High-level summary | Detailed implementation rules for data categories, exercise of rights, AI and digital environments, privacy personnel/services, processing and transfer assessments, incident response, forms and exemptions. Article 42(2) repeals Decree 13/2023 from the same effective date. |

| Anchor | Display heading | Mapping concept | Suggested relation rationale |
|---|---|---|---|
| Arts 3–5 | Data categories and rights procedures | basic/sensitive data; request handling | `implements` the Law's definitions and data-subject-rights mechanics. |
| Art 10 | AI and metaverse safeguards | inferred identifiers; automated-processing notice; explanation; opt-out; security; annual review | `implements` Article 30 and provides more concrete AI-processing controls. |
| Arts 13–16 | Personal-data protection personnel and services | DPO/personnel; qualifications; outsourcing | `implements` organisational-accountability requirements. |
| Arts 17–20 | Cross-border and processing assessments | transfer scenarios; exemptions; dossier content; updates | `implements` Law Articles 20–22. Keep exemption conditions attached to each node. |
| Arts 28–29 and Art 42(2) | Breach detail and transition | incident content; 72-hour subject notice for specified incidents; repeal | Use `implements` for breach detail and `repeals` from Article 42(2) to Decree 13. |

**Text coverage recommendation:** full original Vietnamese with provision-level English editorial summaries. Link every implementing node upward to the exact Law article.

### 9.3 `vn-personal-data-protection-decree-13-2023`

| Field | Audited value |
|---|---|
| Recommended English title | **Decree No. 13/2023/ND-CP on Personal Data Protection** |
| Exact Vietnamese title | **Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân** |
| Issuer | Government of Vietnam |
| Type / lifecycle | Historical decree; `historical_repealed` |
| Key dates | Issued 17 Apr 2023; effective 1 Jul 2023; repealed 1 Jan 2026 by Decree No. 356/2025/ND-CP Article 42(2) |
| Official sources | [Government record](https://vanban.chinhphu.vn/?classid=1&docid=207759&orggroupid=2&pageid=27160); [official Gazette PDF](https://congbao.chinhphu.vn/tai-ve-van-ban-so-13-2023-nd-cp-39228-44543?format=pdf) |
| Official English completeness | No complete current official English needed for operative law; retain verified historical translation metadata only if archived |
| High-level summary | Vietnam's former comprehensive personal-data decree. It remains important for historical compliance timelines but is no longer the source of current duties. |

Historical anchors may include Articles 9–11 (rights/consent), Article 23 (breach notice), and Articles 24–25 (processing and overseas-transfer impact assessments). All nodes require a repealed banner and a `repealed_by` edge to Decree 356.

**Text coverage recommendation:** retain as an archived historical version, never as the default Vietnam source.

## 10. Crosswalk design for these sources

### 10.1 Shared concept nodes

The following concepts recur often enough to justify stable core nodes:

1. lawful processing grounds and consent;
2. purpose limitation and data minimisation;
3. data-subject access, correction, deletion, restriction and objection;
4. automated-decision objection, explanation and human review;
5. accountability, DPO/personnel and organisational governance;
6. processing, transfer, fundamental-rights and AI impact assessment;
7. transparency, explanation, output labelling and provenance;
8. human oversight and meaningful intervention;
9. security, robustness, testing and monitoring;
10. breach/incident detection and notification;
11. cross-border transfer and overseas disclosure;
12. assurance, certification, conformity assessment and testing tools.

Do not connect entire instruments merely because both mention a concept. The graph should normally be:

`source provision → concept → source provision`

with optional direct provision-to-provision edges only where the rationale is specific enough for legal users to audit.

### 10.2 High-value, defensible example edges

| From | Relation | To | Rationale |
|---|---|---|---|
| Singapore Model AI Governance Framework — operations management | `operationalizes` | security, robustness and lifecycle monitoring | Converts high-level trust principles into data/model lifecycle practices. |
| AI Verify — fairness tests | `supports` | fairness/non-discrimination controls | Produces technical evidence; does not resolve the legal discrimination test. |
| Korea PIPA Art 37-2 | `partially_corresponds_to` | Indonesia PDP Law Art 10 | Both address significant solely/fully automated decisions, but triggers, remedies and exceptions differ. |
| Korea AI Framework Act Art 31 | `partially_corresponds_to` | transparency/output provenance | Requires forms of advance notice and marking for AI/generative/synthetic output. |
| Taiwan AI Basic Act Art 14 | `supports` | Privacy by Design / Default | Expressly places privacy protections in system design/default settings and discourages unnecessary personal data. |
| Hong Kong AI Model Framework — model implementation | `operationalizes` | PDPO DPP 4 security | Supplies AI-lifecycle implementation practices supporting the technology-neutral security principle. |
| Vietnam Decree 356 Arts 17–20 | `implements` | Vietnam Law 91 Arts 20–22 | The Decree supplies transfer/processing assessment scenarios, dossier details and update mechanics. |
| Australia Guidance — maintain human control | `partially_corresponds_to` | Taiwan AI Basic Act Art 4 human autonomy/oversight | Shared principle, but one is voluntary practice guidance and the other a framework-law principle. |
| Vietnam Decree 356 Art 42(2) | `repeals` | Vietnam Decree 13/2023 | Express lifecycle relationship effective 1 Jan 2026. |
| Australia 2024 mandatory-guardrails proposal | `superseded_for_current_guidance_by` | Australia Guidance for AI Adoption 2025 | The proposal did not proceed; the later guidance is the active voluntary practice source, not a legal successor Act. |

## 11. Language, text and version-ingestion rules

The requested UX—English by default, original language only after user selection—is compatible with legal accuracy if the data distinguishes text authority:

```text
official_original_text
official_english_text
editorial_english_translation
editorial_summary
```

Required per-text metadata:

- `language`, `script`, and `authority_status`;
- source URL and retrieval date;
- instrument/amending-Act number;
- consolidation date;
- `effective_from` and optional `effective_to`;
- whether future, current, repealed, or version-lagged;
- provision identifier and heading in both displayed languages;
- content hash for change detection.

Specific rules:

- **Official original controls.** Never silently substitute machine translation for official legal text.
- **Default English may be editorial.** If so, display “Unofficial editorial translation” beside the language control and keep the original one click away.
- **Version alignment beats convenience.** A current Korean/Taiwanese original should not be paired with an older English consolidation without a warning.
- **Future amendments stay separate.** Taiwan's 2025 PDPA package, Korea's 2026 future phases, and Australia's Dec 2026 ADM provisions require future-effective nodes.
- **Repealed/proposal material is visually distinct.** Vietnam Decree 13 and Australia's 2024 guardrails proposal must not look current.
- **Frameworks and tools do not contain pseudo-statutes.** AI Verify should expose principles, tests and evidence types, not fictional articles.

## 12. Publication and recurring QA checklist

Before a source is released:

1. retrieve from the official source and record the retrieval date and hash;
2. confirm title, issuer, instrument number, adoption/promulgation/effective dates and lifecycle;
3. compare the English and original provision numbering for version alignment;
4. identify prospective, transitional, repealed and uncommenced provisions;
5. verify each graph edge against both anchored provisions and write a one-sentence rationale;
6. have a second reviewer check full-text transcription and legal-status labels;
7. run link, completeness and duplicate-ID checks;
8. schedule periodic gazette checks and event-driven checks before future commencement dates;
9. retain a changelog showing which provision and mapping changed and why;
10. add a research disclaimer without obscuring whether a source is binding.

## 13. Suggested ingestion priority

**Tier 1 — current binding sources:** Singapore PDPA; Korea PIPA; Korea AI Framework Act; Australia Privacy Act; Taiwan PDPA; Taiwan AI Basic Act; Hong Kong PDPO; Indonesia PDP Law; Vietnam Law No. 91/2025; Vietnam Decree No. 356/2025.

**Tier 2 — active implementation frameworks/tools:** Singapore Model AI Governance Framework; AI Verify; Australia Guidance for AI Adoption; Taiwan Executive Yuan GenAI Guidelines; Hong Kong AI Model Personal Data Protection Framework; Hong Kong Ethical AI Guidance; Hong Kong GenAI Employee Checklist.

**Archive/history only:** Australia's 2024 mandatory-guardrails proposals paper; Vietnam Decree 13/2023.
