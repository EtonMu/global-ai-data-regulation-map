# Primary-source legal audit: selected Americas, Europe, Middle East and Africa instruments

**Research cut-off:** 19 July 2026  
**Source rule:** official legislature, gazette, government or regulator sources only  
**Purpose:** data-ingestion and knowledge-graph guidance for *Compliance Compass: Global AI Governance and Data Regulation Map & Visualization*  
**Not legal advice:** this is a source and metadata audit, not an opinion on applicability to a particular organisation.

## 1. Executive result

The requested list contains multiple legal states that must not be displayed as though they were equivalent:

| Display state | Instruments in this audit |
|---|---|
| In force | Brazil LGPD; UAE Federal PDPL; Saudi PDPL; South Africa POPIA; Nigeria Data Protection Act; Switzerland FADP |
| In force, principal regulated duties not yet operative | Colorado SB26-189; Act effective 14 May 2026, principal duties start 1 January 2027 |
| Pending proposal | Brazil PL 2338/2023 |
| Lapsed / superseded history | Canada Bill C-27/AIDA; Colorado SB24-205 and SB25B-004 |
| Non-binding soft law / guidance | Digital Dubai AI Ethics toolkit; UAE Generative AI Guide |
| Government ethics framework with mixed/unclear binding effect | SDAIA AI Ethics Principles |

### Corrections that should be reflected in the interface

1. **Canada AIDA is not current Canadian law.** It was Part 3 of Bill C-27. Bill C-27 never received Royal Assent and ceased to exist when the first session of the 44th Parliament was prorogued on 6 January 2025. It belongs in a historical/draft layer, not the “in force” layer.
2. **Brazil PL 2338/2023 is still a bill.** The Senate approved a substitute on 10 December 2024, but the Chamber dossier still showed it awaiting the special-committee rapporteur’s opinion on the research cut-off. Its proposed civil-liability chapter does **not** simply impose a new strict-liability regime: proposed Articles 35–36 preserve the Consumer Protection Code, Civil Code and sector-specific rules.
3. **Colorado SB24-205 did not simply become operative in 2026.** SB25B-004 first delayed it; SB26-189 then repealed and reenacted the relevant provisions as a materially different automated-decision-making regime. The current node should be SB26-189, enacted 14 May 2026, with principal duties starting 1 January 2027.
4. **The UAE does not have one instrument properly titled “UAE AI Ethics Principles & Guidelines” jointly issued by Dubai and Abu Dhabi.** The well-known ethics toolkit is a Dubai-government soft-law instrument. The UAE AI Office’s Generative AI Guide is a separate federal educational guide. Neither should be represented as a binding national AI act.
5. **The revised Swiss FADP is technology-neutral.** It is relevant to AI, Web3 and crypto when personal data are processed, but it was not enacted as a sector-specific AI, blockchain or crypto law.
6. **“Brazilian GDPR” is an analogy, not a legal identity.** LGPD is Brazil’s own statute with its own scope, lawful bases, enforcement design and institutional history.
7. **Translation recency matters.** ANPD’s official English LGPD publication is a useful November 2024 snapshot, but it predates the 2025–2026 changes that transformed the ANPD into a regulatory agency. The current Portuguese consolidated text remains the version anchor.
8. **SDAIA’s AI Ethics Principles should not be reduced to purely voluntary guidance.** The document says the framework “shall apply,” uses mandatory controls and gives SDAIA compliance-measurement, investigation and audit roles; however, its registration, reports and motivational-badge pathway are described as optional. Until a more specific legal basis is tied to an actor/use case, label its binding effect `mixed_or_unclear`, not simply “voluntary” or “statutory law.”

## 2. Recommended data conventions

### 2.1 Status vocabulary

Use a machine-readable `legalStatus` value and a separate plain-language label:

- `in_force`
- `in_force_future_duties`
- `pending_bill`
- `lapsed_bill`
- `superseded`
- `soft_law_active`
- `guidance_active`
- `government_framework_active`

Never infer “in force” from the existence of an official PDF. Bills, enacted-but-not-operative statutes and superseded laws should have visibly different styling.

Store legal status separately from `bindingEffect`, for which useful values are `binding`, `non_binding`, and `mixed_or_unclear`. This prevents an active government framework from being mislabelled either as an enacted statute or as purely voluntary.

### 2.2 Text authority vocabulary

Store language status per text, not per instrument:

- `authoritative_original`
- `coauthoritative_original`
- `official_translation_non_authoritative`
- `official_translation_authority_unspecified`
- `editorial_translation`

The language selector should default to English, as requested, but should always show a compact badge such as “Official translation — Arabic controls” when that is the legal position.

### 2.3 Version rule

Each source should carry:

- `versionAsOf`
- `retrievedAt`
- `sourcePublisher`
- `sourceUrl`
- `sourceLanguage`
- `textAuthority`
- `statusVerifiedAt`
- an immutable `versionId` or checksum

For bills, never overwrite an older text. Store each introduced, committee, chamber-approved and enacted version as a separate version event.

## 3. Instrument-by-instrument audit

---

## Brazil

### 3.1 LGPD

**Recommended stable ID:** `br-lgpd-2018`

| Field | Audited value |
|---|---|
| English title | **Brazilian Data Protection Law (LGPD), Law No. 13,709 of 14 August 2018** (title used by ANPD’s official English publication); literal rendering: **General Personal Data Protection Law** |
| Original title | **Lei Geral de Proteção de Dados Pessoais (LGPD), Lei nº 13.709, de 14 de agosto de 2018** |
| Jurisdiction | Brazil (`br`) |
| Issuer | National Congress; sanctioned by the President of the Republic |
| Type | Federal statute |
| Status | `in_force`; amended |
| Key dates | Enacted 14 August 2018; main substantive provisions effective 18 September 2020; administrative-sanction provisions in Articles 52–54 effective 1 August 2021; ANPD institutional amendment enacted 25 February 2026 |
| Regulator | Agência Nacional de Proteção de Dados (ANPD) |

**Official sources**

- Current Portuguese consolidated text: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Law No. 15,352 of 25 February 2026: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15352.htm
- Chamber official metadata for Law No. 15,352/2026: https://www2.camara.leg.br/legin/fed/lei/2026/lei-15352-25-fevereiro-2026-798731-norma-pl.html
- ANPD institutional legal basis: https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/base-juridica
- ANPD official English publication, November 2024 snapshot: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/outros-documentos-e-publicacoes-institucionais/lgpd-en-lei-no-13-709-capa.pdf

**Language and authority**

- Portuguese consolidated text: `authoritative_original`.
- ANPD English publication: `official_translation_authority_unspecified`, but versioned to 2024. It should not be silently presented as the current consolidated 2026 text.
- Recommended UI subtitle: `General Personal Data Protection Law (LGPD) — Lei Geral de Proteção de Dados Pessoais`.

**High-level summary**

LGPD is Brazil’s general framework for processing personal data by public and private actors. It establishes processing principles and lawful bases, special rules for sensitive and children’s data, data-subject rights, governance and security duties, cross-border-transfer mechanisms, automated-decision safeguards and ANPD enforcement powers.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Article 6 | Processing principles | `purpose-limitation`, `data-minimization`, `transparency-explainability`, `security-controls`, `accountability-governance` | Article 6 supplies the statute’s purpose, adequacy, necessity, free access, data quality, transparency, security, prevention, non-discrimination and accountability principles. |
| Articles 7 and 11 | Lawful bases and sensitive data | `lawfulness-consent-choice`, `sensitive-data-protection` | These provisions enumerate legal grounds for ordinary and sensitive-personal-data processing; consent is one ground, not the only ground. |
| Article 18 | Data-subject rights | `data-subject-rights`, `retention-deletion-lifecycle` | It provides confirmation, access, correction, anonymisation/blocking/deletion, portability and related rights. |
| Article 20 | Automated decisions | `automated-decision-safeguards`, `transparency-explainability` | It provides review and information safeguards for decisions made solely on automated processing. Do not encode it as an unconditional right to human review without noting the exact current wording. |
| Articles 33, 46, 48 and 50 | Transfers, security, incidents and governance | `cross-border-transfer`, `security-controls`, `incident-response`, `privacy-by-design-default`, `accountability-governance` | These provisions address international transfers, technical/administrative safeguards, breach communication and governance programmes. |

**Recommended stored-text coverage**

Store the complete current Portuguese consolidated text, article-by-article, including amendment annotations where the official consolidation exposes them. Store the 2024 official English publication as a separately dated translation snapshot. If an updated English text is produced editorially, label it `editorial_translation`, disclose the base version and do not call it an official ANPD translation.

**Knowledge-graph caution**

Relations to GDPR should be expressed at the provision/concept level—for example LGPD Article 6 necessity ↔ GDPR Article 5(1)(c) data minimisation—not with an undifferentiated “LGPD equals GDPR” edge.

### 3.2 Brazil AI bill, PL 2338/2023

**Recommended stable ID:** `br-pl-2338-2023-ai-bill`

| Field | Audited value |
|---|---|
| English title | **Bill No. 2,338 of 2023 — On the development, promotion, and ethical and responsible use of artificial intelligence based on human centrality** (editorial translation of the official ementa) |
| Original title / ementa | **Projeto de Lei nº 2.338, de 2023 — Dispõe sobre o desenvolvimento, o fomento e o uso ético e responsável da inteligência artificial com base na centralidade da pessoa humana** |
| Jurisdiction | Brazil (`br`) |
| Sponsor / issuer | Senator Rodrigo Pacheco; Federal Senate; pending before National Congress |
| Type | Federal bill |
| Status | `pending_bill`; no legal force and no effective date |
| Key dates | Introduced in the Senate 3 May 2023; Senate substitute approved 10 December 2024; presented in the Chamber 17 March 2025; as of 19 July 2026 awaiting the rapporteur’s opinion in the special committee |

**Official sources**

- Current Chamber dossier and live status: https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262
- Senate-approved text received by the Chamber: https://www.camara.leg.br/proposicoesWeb/prop_mostrarintegra?codteor=2868197&filename=Tramitacao-PL+2338%2F2023
- Senate dossier: https://www25.senado.leg.br/web/atividade/materias/-/materia/157233

**Language and authority**

- Portuguese bill text: official legislative text, but not enacted law.
- No official English legislative text was located. Any English content should be `editorial_translation` with a conspicuous “Draft / not law” badge.

**High-level summary**

The Senate-approved proposal is a broad risk-based AI governance bill. It contains foundations and principles, rights for affected persons, prohibited and high-risk uses, governance and algorithmic-impact-assessment duties, special provisions for general-purpose and generative AI, conformity assessment, civil-liability rules that defer to existing legal regimes, regulatory governance, sanctions and innovation measures. Its substance may still change in the Chamber.

**Provision-to-concept anchors for the Senate-approved version**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Articles 5–9 | Affected-person rights and high-risk safeguards | `transparency-explainability`, `fairness-nondiscrimination`, `automated-decision-safeguards`, `human-oversight`, `data-subject-rights` | The text proposes interaction notice, explanation, challenge, review and context-dependent human-supervision rights for high-risk AI. |
| Articles 12–16 | Preliminary assessment, prohibited and high-risk uses | `ai-risk-management`, `fairness-nondiscrimination`, `human-oversight` | The proposal defines preliminary classification, excessive-risk prohibitions and high-risk categories. |
| Article 23 | Public-sector high-risk AI | `transparency-explainability`, `human-oversight`, `impact-assessment`, `fairness-nondiscrimination`, `accountability-governance` | It proposes access/use logging, explanation and human review for consequential public decisions, publication of preliminary assessments and an impact assessment before public-sector biometric identification. |
| Articles 25–28 | Algorithmic impact assessment | `impact-assessment`, `ai-risk-management`, `continuous-assurance`, `incident-response` | The assessment is proposed for high-risk systems, before market/use and continuously through the lifecycle; unexpected material risks trigger communication duties. |
| Articles 35–39 | Civil liability | `accountability-governance` | Articles 35–36 preserve existing consumer, civil and special-law regimes. Article 37 provides burden-of-proof reversal in specified circumstances. The text does not itself establish a uniform strict-liability rule. |
| Article 40 | Good-practice and governance programmes | `accountability-governance`, `security-controls`, `continuous-assurance`, `incident-response` | It proposes internal policies, supervision, response plans and continuous monitoring proportionate to risk. |

**Recommended stored-text coverage**

Store the complete 17 March 2025 Chamber-filed Senate text as an immutable legislative snapshot. Preserve the Senate dossier, Chamber action history and every later substitute as separate version events. Do not display this corpus under “Current law”; use a dedicated `Draft / legislative proposal` layer.

---

## United Arab Emirates

### 3.3 Federal Decree-Law No. 45 of 2021

**Recommended stable ID:** `ae-federal-pdpl-45-2021`

| Field | Audited value |
|---|---|
| English title | **Federal Decree by Law No. (45) of 2021 Concerning the Protection of Personal Data** |
| Arabic title | **مرسوم بقانون اتحادي رقم (45) لسنة 2021 بشأن حماية البيانات الشخصية** |
| Jurisdiction | United Arab Emirates (`ae`) |
| Issuer | President of the United Arab Emirates; federal government |
| Type | Federal decree-law |
| Status | `in_force`; official portal marks it active |
| Key dates | Issued 20 September 2021; published 26 September 2021 in Official Gazette No. 712 supplement; effective 2 January 2022 |
| Regulator | UAE Data Office/Bureau under the terminology used in the legislation and translation |

**Official sources**

- English legislation portal: https://uaelegislation.gov.ae/en/legislations/1972
- Arabic legislation portal: https://uaelegislation.gov.ae/ar/legislations/1972
- Official English PDF: https://uaelegislation.gov.ae/en/legislations/1972/download

**Language and authority**

- Arabic: `authoritative_original`.
- English portal/PDF: `official_translation_non_authoritative`; the official portal warns that the Arabic original prevails.
- Recommended UI subtitle: `Federal Personal Data Protection Decree-Law — مرسوم بقانون اتحادي بشأن حماية البيانات الشخصية`.

**High-level summary**

The decree-law creates a federal personal-data framework with extraterritorial reach, processing principles, consent and non-consent bases, controller and processor duties, DPO requirements, breach reporting, data-subject rights, automated-processing information, security, impact assessment and cross-border-transfer rules. Its scope has important carve-outs, including government data and entities, security and judicial authorities, certain health and banking data, and free-zone entities governed by their own data-protection laws.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Article 2 | Territorial scope and exclusions | `accountability-governance` | It defines in-state and extraterritorial application and material exclusions; this is essential to applicability analysis. |
| Articles 4–6 | Processing bases, principles and consent | `lawfulness-consent-choice`, `purpose-limitation`, `data-minimization`, `retention-deletion-lifecycle`, `security-controls` | Article 4 lists non-consent cases; Article 5 requires fair, transparent, lawful, purpose-limited and necessary processing; Article 6 governs consent and withdrawal. |
| Articles 7–12 | Controller, processor and DPO governance | `privacy-by-design-default`, `accountability-governance`, `third-party-supply-chain`, `security-controls` | These provisions require appropriate technical/organisational measures, default limitation, records, processor controls and DPO arrangements. |
| Article 9 | Breach reporting | `incident-response` | It requires controller notice to the Bureau and, where privacy/confidentiality is prejudiced, notice to the data subject under implementing timelines. |
| Articles 13–18 | Data-subject rights | `data-subject-rights`, `transparency-explainability`, `automated-decision-safeguards` | Rights include information about automated decisions and profiling, portability, correction/erasure, restriction and objection to certain automated processing. |
| Articles 20–23 | Security, impact assessment and transfers | `security-controls`, `impact-assessment`, `cross-border-transfer` | These provisions address security measures, high-risk impact assessment and transfer rules with or without an adequate protection level. |

**Recommended stored-text coverage**

Store all 31 articles in Arabic and the complete official English translation side-by-side. Preserve the official English disclaimer and set Arabic as controlling. Keep executive regulations and free-zone laws as separate instruments linked by `implements` or `scope_exception`, not merged into the federal decree-law.

### 3.4 Digital Dubai AI Ethics Principles & Guidelines

**Recommended stable ID:** `ae-dubai-ai-ethics-toolkit-2019`

| Field | Audited value |
|---|---|
| English title | **Smart Dubai AI Ethics Principles & Guidelines**; PDF title **Dubai AI Ethics Guidelines** |
| Arabic page title | **مبادئ وأخلاقيات الذكاء الاصطناعي** |
| Jurisdiction | Dubai, United Arab Emirates (`ae-dubai`) |
| Issuer | Smart Dubai Office, now surfaced through Digital Dubai |
| Type | Voluntary ethics principles, guidelines and self-assessment toolkit |
| Status | `soft_law_active`; non-binding |
| Key dates | Public launch 8 January 2019; publication page dated 1 February 2019 |

**Official sources**

- Publication page: https://www.digitaldubai.ae/knowledge-hub/publications/ai-ethics-principles-guidelines
- Official Arabic initiative page: https://www.digitaldubai.ae/ar/initiatives/ai-principles-ethics
- Official English PDF: https://www.digitaldubai.ae/docs/default-source/ai-principles-resources/ai-ethics.pdf
- Official self-assessment tool: https://www.digitaldubai.ae/self-assessment

**Language and authority**

The official English PDF is the verified source corpus. An Arabic official landing page exists; ingest an Arabic PDF only after its exact official file and version are verified. The instrument has no “legally authoritative” language in the statutory sense because it is voluntary guidance.

**High-level summary**

The toolkit offers public- and private-sector guidance centred on fairness, accountability, transparency and explainability, with supporting principles of humanity, inclusiveness and security. Its own scope statement is narrower than a full AI-management standard and says that the ethics definition used in the detailed guidance does not encompass privacy, employment and other governance topics beyond the specified ethical concepts.

**Component-to-concept anchors**

| Component | Concept IDs | Relation rationale |
|---|---|---|
| “We will make AI systems fair” | `fairness-nondiscrimination`, `training-data-governance`, `impact-assessment` | It addresses representative data, bias, equal treatment and discrimination-impact assessment. |
| “We will make AI systems accountable” | `accountability-governance`, `ai-risk-management`, `human-oversight`, `automated-decision-safeguards` | It assigns accountability to human organisations, calls for risk mitigation and supports challenge/opt-out mechanisms for significant automated decisions. |
| “We will make AI systems transparent” | `transparency-explainability`, `continuous-assurance` | It covers traceability and notice that AI is involved in significant decisions. |
| “We will make AI systems as explainable as technically possible” | `transparency-explainability`, `data-subject-rights` | It encourages accessible system-level and decision-specific explanations. |

**Recommended stored-text coverage**

Store the full 35-page official English PDF segmented by named guideline and numbered sub-guideline, plus a link to the self-assessment. Preserve changelog/version metadata. Do not create an edge asserting that it is federal law or an Abu Dhabi instrument.

### 3.5 UAE Generative Artificial Intelligence Guide

**Recommended stable ID:** `ae-generative-ai-guide-2023`

| Field | Audited value |
|---|---|
| Exact English document title | **100 Practical Applications and Use Cases of Generative AI** |
| Exact Arabic document title | **100 تطبيق واستخدام عملي للذكاء الاصطناعي التوليدي** |
| Official portal label | **Generative AI Guide** / **دليل استخدام تطبيقات الذكاء الاصطناعي التوليدي** |
| Jurisdiction | United Arab Emirates (`ae`) |
| Issuer | UAE Artificial Intelligence Office / Minister of State for Artificial Intelligence, Digital Economy and Remote Work Applications |
| Type | Educational and adoption guidance |
| Status | `guidance_active`; non-binding |
| Date | 2023 |

**Official sources**

- Official English PDF: https://ai.gov.ae/wp-content/uploads/2023/04/406.-Generative-AI-Guide_ver1-EN.pdf
- Official Arabic PDF: https://ai.gov.ae/wp-content/uploads/2023/04/406.-Generative-AI-Guide_ver1-AR.pdf
- UAE Government official resource page: https://u.ae/en/about-the-uae/digital-uae/digital-technology/artificial-intelligence/ai-resources

**Language and authority**

The UAE AI Office publishes official English and Arabic PDFs. They are parallel government publications of non-binding guidance; neither is an authoritative statutory text. The requested UI can default to English and switch to the Arabic original-language publication on demand.

**High-level summary**

The guide explains generative-AI concepts and showcases 100 practical uses for government, industry and individuals. It is useful as an “implementation guidance” node, but it is not a legal compliance code, conformity-assessment scheme or binding federal AI rule. The official portal shortens its label to “Generative AI Guide.” The separate September 2023 publication **100 Practical Applications and Use Cases of Generative AI in Media** is a different instrument and must not be conflated with this April 2023 general guide.

**Recommended concept anchors**

- `transparency-explainability`: education about how generative AI is used and what it produces.
- `security-controls` and `lawfulness-consent-choice`: only where the source expressly gives data/privacy cautions; these should be low-confidence `addresses` edges, not equivalence edges.
- `global-coordination`: UAE capacity-building context, not a normative international obligation.

**Recommended stored-text coverage**

Store section-level summaries and the official source link. Ingest full text only after confirming reuse terms. Keep it visibly in a “Guidance / practical tools” branch, not beside binding federal statutes without a type distinction.

---

## Saudi Arabia

### 3.6 Personal Data Protection Law

**Recommended stable ID:** `sa-pdpl-2021-amended-2023`

| Field | Audited value |
|---|---|
| English title | **Personal Data Protection Law** |
| Arabic title | **نظام حماية البيانات الشخصية** |
| Jurisdiction | Saudi Arabia (`sa`) |
| Issuer | Royal Decree No. M/19; amended by Royal Decree No. M/148 |
| Type | National statute/system |
| Status | `in_force`; amended |
| Key dates | Original published 24 September 2021; amendment published 7 April 2023; entered into force 14 September 2023; one-year compliance grace period ended 14 September 2024 |
| Competent authority | Saudi Data & AI Authority (SDAIA), within the current statutory/regulatory arrangement |

**Official sources**

- Original Arabic official-gazette publication: https://uqn.gov.sa/?p=7759
- Amendment, Royal Decree No. M/148: https://uqn.gov.sa/details?p=21671
- Official English law PDF: https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf
- Official English implementing regulations: https://sdaia.gov.sa/en/SDAIA/about/Documents/ImplementingRegulation.pdf

**Language and authority**

- Arabic gazette text: `authoritative_original`.
- SDAIA English publication: official government translation/reference. Because the Arabic gazette is the enacted source, UI should state “Official English translation — Arabic controls” unless the official publication expressly states otherwise.

**High-level summary**

The PDPL governs collection and processing of personal data, lawful grounds and consent, data-subject rights, controller duties, security and breach notification, impact assessment, health and credit data, marketing, recordkeeping and international transfers. The implementing regulations materially elaborate the statute and should be modelled separately.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Articles 4–6 | Data-subject rights and consent | `data-subject-rights`, `lawfulness-consent-choice` | These provisions establish core rights and consent requirements/withdrawal mechanics. |
| Article 11 | Purpose, proportionality and destruction | `purpose-limitation`, `data-minimization`, `retention-deletion-lifecycle` | Collection must relate to the controller’s purposes and be limited to what is necessary; the provision also addresses cessation/destruction. |
| Articles 19–20 | Security and breach response | `security-controls`, `incident-response` | Controllers must implement safeguards and notify the competent authority/data subjects in specified breach circumstances. |
| Article 22 | Impact assessment | `impact-assessment`, `ai-risk-management` | It requires an impact assessment for products/services involving processing according to the regulatory conditions. |
| Article 29 | Transfers outside the Kingdom | `cross-border-transfer`, `accountability-governance` | It establishes the statutory basis for external transfers, further detailed by regulation. |

**Recommended stored-text coverage**

Store the full current Arabic text and official English text by article. Store the implementing regulations as `sa-pdpl-implementing-regulations-2023`, linked with `implements`; do not concatenate them into the statutory article text. Include an amendment timeline so the obsolete pre-amendment 2021 text is not shown as current.

### 3.7 SDAIA AI Ethics Principles

**Recommended stable ID:** `sa-sdaia-ai-ethics-principles-1-0-2023`

| Field | Audited value |
|---|---|
| English title | **AI Ethics Principles** |
| Arabic title | **مبادئ أخلاقيات الذكاء الاصطناعي** |
| Jurisdiction | Saudi Arabia (`sa`) |
| Issuer | Saudi Data & AI Authority (SDAIA) |
| Type | National government AI ethics framework and compliance/self-assessment framework |
| Status | `government_framework_active`; Version 1.0 |
| Binding effect | `mixed_or_unclear`; not an enacted statute, but not safely characterised as purely voluntary |
| Date | September 2023 |

**Official sources**

- Current official English PDF endpoint: https://dgp.sdaia.gov.sa/wps/wcm/connect/4c56ed1c-1b82-447d-ac29-638f5f99c12e/ai-principles-EN.pdf?MOD=AJPERES
- SDAIA English publication mirror: https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-principles.pdf
- Official AI Ethics Assessment service: https://dgp.sdaia.gov.sa/wps/portal/pdp/services/AIEthicsAssessment
- Official Arabic assessment page: https://dgp.sdaia.gov.sa/wps/portal/pdp/services/servicesdetails/AIEthicsAssessment

**Language and authority**

The official English Version 1.0 PDF is verified. SDAIA publishes the Arabic title and Arabic assessment interface, but an exact Arabic Version 1.0 PDF could not be inspected during this audit; do not mark Arabic full-text coverage complete merely because an `/ar/` URL pattern exists. The framework is not a statute. Its own wording nevertheless mixes mandatory controls and national compliance monitoring with optional registration/reporting, so the UI should disclose that mixed posture instead of applying a simple “non-binding” badge.

**High-level summary**

Version 1.0 organises responsible-AI expectations into seven principles and lifecycle-oriented controls. It says the framework applies to AI stakeholders in Saudi Arabia, classifies limited-, high- and unacceptable-risk systems, assigns SDAIA compliance-measurement and audit roles, and provides an optional registration/reporting and motivational-badge route. It should neither be presented as a statute nor dismissed as merely aspirational voluntary guidance.

**Principle-to-concept anchors**

| Principle | Concept IDs | Relation rationale |
|---|---|---|
| Fairness | `fairness-nondiscrimination`, `training-data-governance` | Addresses bias, equal treatment and representativeness. |
| Privacy and security | `privacy-by-design-default`, `sensitive-data-protection`, `security-controls`, `privacy-enhancing-tech` | Connects personal-data protection and technical safeguards to the AI lifecycle. |
| Humanity | `human-oversight`, `automated-decision-safeguards` | Centres human values, agency and oversight. |
| Social and environmental benefits | `accountability-governance` | Connects deployment goals and broader effects to responsible organisational choices. |
| Reliability and safety | `ai-risk-management`, `continuous-assurance`, `security-controls` | Addresses robustness, risk treatment, monitoring and safety. |
| Transparency and explainability | `transparency-explainability` | Covers disclosure and understandable system/decision information. |
| Accountability and responsibility | `accountability-governance`, `third-party-supply-chain` | Assigns roles and responsibility across relevant actors. |

**Recommended stored-text coverage**

Store the full verified English PDF, versioned as `1.0-2023-09`, segmented by principle, control, risk tier, role and assessment question. Add the self-assessment as a related tool node. Add Arabic full text only after the exact official PDF is inspected. Avoid a blanket “complies with Saudi AI law” edge; use actor- and risk-tier-specific `requires`, `monitors_compliance_with` or `addresses` edges, each with a legal-basis note.

---

## South Africa

### 3.8 POPIA

**Recommended stable ID:** `za-popia-4-2013`

| Field | Audited value |
|---|---|
| Title | **Protection of Personal Information Act 4 of 2013 (POPIA)** |
| Jurisdiction | South Africa (`za`) |
| Issuer | Parliament; assented to by the President |
| Type | National statute |
| Status | `in_force` |
| Key dates | Published 26 November 2013; provisions commenced in tranches on 11 April 2014, 1 July 2020 and 30 June 2021; the general one-year compliance transition ended 30 June 2021; section 58(2)’s applicability to section 57 processing was originally designated for 1 July 2021 and then deferred to 1 February 2022 |
| Regulator | Information Regulator |

**Official sources**

- Act, official PDF and commencement table: https://www.gov.za/documents/protection-personal-information-act
- 22 June 2020 commencement proclamation: https://www.gov.za/sites/default/files/gcis_document/202006/43461rg11136pr21.pdf
- Official 2021 notices, including the section 58(2) deferral: https://www.justice.gov.za/legislation/notices/notice2021.html

**Language and authority**

English is an official enacted text and is the default display language. An “original language” toggle adds no value unless another officially published text is ingested and its status is verified.

**High-level summary**

POPIA establishes conditions for lawful processing by public and private bodies, data-subject rights, special-personal-information and children’s-data rules, security safeguards and breach notification, direct-marketing rules, automated-decision protections, cross-border-transfer rules and enforcement by the Information Regulator.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Sections 8–18 | Eight conditions for lawful processing | `accountability-governance`, `lawfulness-consent-choice`, `purpose-limitation`, `data-minimization`, `transparency-explainability` | These chapters organise accountability, processing limitation, purpose specification, further-processing limits, information quality, openness, security and participation. |
| Section 19 | Security safeguards | `security-controls`, `third-party-supply-chain` | It requires appropriate, reasonable technical and organisational safeguards and interacts with operator arrangements. |
| Section 22 | Security compromises | `incident-response`, `transparency-explainability` | It governs notification to the Regulator and data subject after a security compromise. |
| Section 71 | Automated decision making | `automated-decision-safeguards`, `human-oversight`, `transparency-explainability` | It restricts certain solely automated decisions with legal or substantial effects and provides exceptions with safeguards. |
| Section 72 | Transfers outside the Republic | `cross-border-transfer` | It defines permitted bases for international transfers. |

**Recommended stored-text coverage**

Store the complete Act, all sections and schedule, plus commencement/applicability metadata at provision level. For section 58(2), preserve both the initial 1 July 2021 designation and the amendment to 1 February 2022. Store regulations, codes of conduct and later regulatory amendments as separate subordinate instruments. Do not imply that a regulations amendment changes the Act’s text unless the Act itself was amended.

**Characterisation caution**

“One of Africa’s most comprehensive data-protection statutes” is defensible as descriptive context; “Africa’s strictest” is evaluative and should not appear as an asserted legal fact.

---

## Nigeria

### 3.9 Nigeria Data Protection Act 2023

**Recommended stable ID:** `ng-data-protection-act-2023`

| Field | Audited value |
|---|---|
| Title | **Nigeria Data Protection Act, 2023** |
| Citation | Act No. 37 of 2023 |
| Jurisdiction | Nigeria (`ng`) |
| Issuer | National Assembly; assented to by the President |
| Type | Federal statute |
| Status | `in_force` |
| Key date | Assented to and commenced 12 June 2023; Official Gazette publication dated 1 July 2023 |
| Regulator | Nigeria Data Protection Commission (NDPC), established by the Act |

**Official sources**

- NDPC download page: https://ndpc.gov.ng/download/nigeria-data-protection-act-2023
- Official-gazette PDF hosted by NDPC: https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf
- NDPC resources and official local-language translations: https://ndpc.gov.ng/resources/

**Language and authority**

- English: `authoritative_original` and default display.
- NDPC has published Hausa, Yoruba and Igbo versions through its resources portal. These should be stored as official regulator translations unless their own publication notices confer a different status; they do not displace the enacted English gazette text.

**High-level summary**

The 66-section Act creates the NDPC and a comprehensive processing framework: principles and lawful bases, information duties, impact assessment, controller/processor obligations, sensitive and children’s data, DPOs, data-subject rights, automated decision making, security and breach notification, international transfers, registration of major controllers/processors, enforcement and remedies.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Sections 24–27 | Principles, lawful basis, consent and notice | `lawfulness-consent-choice`, `purpose-limitation`, `data-minimization`, `transparency-explainability`, `accountability-governance` | These are the core processing standards and information rules. |
| Section 28 | Data privacy impact assessment | `impact-assessment`, `ai-risk-management` | It requires assessment where processing may result in high risk to rights and freedoms. |
| Sections 34–38 | Data-subject rights and automated decisions | `data-subject-rights`, `automated-decision-safeguards`, `human-oversight`, `transparency-explainability` | They cover access and related rights, objection, portability and safeguards around solely automated decisions. |
| Sections 39–40 | Security and breaches | `security-controls`, `incident-response`, `third-party-supply-chain` | They require appropriate safeguards and establish controller/processor breach duties. |
| Sections 41–43 | Cross-border transfers | `cross-border-transfer`, `accountability-governance` | They create adequacy and other transfer bases. |

**Recommended stored-text coverage**

Store the full English gazette text, all 66 sections and schedule. Add NDPC-published local-language versions as parallel translations, clearly labelled. Store the General Application and Implementation Directive and any amendment bill as separate nodes. An amendment bill is not an amendment until enacted.

---

## Canada

### 3.10 Bill C-27 / proposed AIDA

**Recommended stable ID:** `ca-bill-c-27-aida-2022-lapsed`

| Field | Audited value |
|---|---|
| Bill short title | **Digital Charter Implementation Act, 2022** |
| Full English bill title | **An Act to enact the Consumer Privacy Protection Act, the Personal Information and Data Protection Tribunal Act and the Artificial Intelligence and Data Act and to make consequential and related amendments to other Acts** |
| Proposed Part 3 title | **Artificial Intelligence and Data Act (AIDA)** |
| French proposed title | **Loi sur l’intelligence artificielle et les données (LIAD)** |
| Jurisdiction | Canada (`ca`) |
| Issuer / sponsor | Government bill; Minister of Innovation, Science and Industry |
| Type | Lapsed federal government bill |
| Status | `lapsed_bill`; never received Royal Assent, never entered into force |
| Key dates | Introduced 16 June 2022; second reading and committee referral 24 April 2023; committee consideration not completed; ceased on prorogation 6 January 2025 |

**Official sources**

- Parliament LEGISinfo dossier: https://www.parl.ca/legisinfo/en/bill/44-1/c-27
- Official bilingual bill text: https://www.parl.ca/DocumentViewer/en/44-1/bill/c-27/first-reading
- House of Commons prorogation notice explaining that unassented government bills cease to exist: https://www.ourcommons.ca/Content/Newsroom/Articles/NewsRelease-OfficeSpeaker-Prorogation-E.pdf

**Language and authority**

The English and French bill texts were both official legislative versions. They are historical proposed text, not law.

**High-level summary**

AIDA was a proposed framework for international and interprovincial trade in AI systems. It would have required persons responsible for certain systems to identify, assess and mitigate risks of harm and biased output, maintain records, publish information and report serious incidents, with ministerial administration and offence provisions. Because Bill C-27 lapsed, none of these proposed duties became operative.

**Historical provision-to-concept anchors**

| Proposed provision group | Concept IDs | Relation rationale |
|---|---|---|
| Proposed AIDA sections 5–12 | `ai-risk-management`, `fairness-nondiscrimination`, `accountability-governance`, `transparency-explainability` | These provisions contained definitions and proposed mitigation, monitoring, record and publication duties for regulated systems. |
| Proposed serious-incident notification duty | `incident-response`, `continuous-assurance` | The proposal contemplated notification when use resulted or was likely to result in material harm. |
| Proposed administration and enforcement provisions | `accountability-governance` | They would have created ministerial information, audit/order and offence mechanisms. |

**Recommended stored-text coverage**

Store the complete bilingual first-reading text as a historical proposal, with AIDA’s proposed statute segmented separately from Parts 1 and 2. Prominently show `Lapsed 6 Jan 2025 — never law`. Do not use it as the current-law answer to a Canada query. As of the cut-off, no reintroduced AIDA was located in the current Parliament; future Canadian bills must receive new IDs rather than reviving this status automatically.

---

## United States — Colorado

### 3.11 Current law: SB26-189, Automated Decision-Making Technology

**Recommended stable ID:** `us-co-sb26-189-admt-2026`

| Field | Audited value |
|---|---|
| Title | **Automated Decision-Making Technology** |
| Bill / session-law citation | Colorado SB26-189; Session Laws of Colorado 2026, Chapter 131 |
| Jurisdiction | Colorado, United States (`us-co`) |
| Issuer | Colorado General Assembly; signed by the Governor |
| Type | State statute |
| Status | `in_force_future_duties`; effective 14 May 2026; principal regulated duties begin 1 January 2027 |
| Key dates | Introduced 1 May 2026; signed and effective 14 May 2026; principal requirements start 1 January 2027 |

**Official sources**

- Bill dossier, signed-act link, official enacted summary and history: https://leg.colorado.gov/bills/sb26-189
- Colorado Attorney General AI page: https://coag.gov/ai/

**High-level summary**

SB26-189 repeals and reenacts the earlier SB24-205 provisions with a new regime focused on automated decision-making technology that materially influences consequential decisions in areas such as education, employment, housing, finance, insurance, health care and essential government services. It requires developer documentation, records, deployer notices and post-adverse-outcome explanations; gives consumers access/correction and meaningful-human-review rights; and assigns enforcement to the Attorney General. It creates no new private right of action.

**Provision/component-to-concept anchors**

| Enacted component | Concept IDs | Relation rationale |
|---|---|---|
| Developer technical documentation | `transparency-explainability`, `training-data-governance`, `human-oversight`, `third-party-supply-chain` | Documentation must address intended uses, training-data categories, known limitations, appropriate use and human review, supporting deployer governance. |
| Developer/deployer record retention | `accountability-governance`, `continuous-assurance` | Regulated actors must retain compliance records for at least three years. |
| Interaction and adverse-outcome notices | `transparency-explainability`, `automated-decision-safeguards` | Deployers must give conspicuous notice and a plain-language explanation of the covered ADMT’s role after specified adverse outcomes. |
| Access, correction and meaningful human review | `data-subject-rights`, `automated-decision-safeguards`, `human-oversight` | Consumers may request personal data/correction and meaningful human review and reconsideration after an adverse consequential decision. |
| Attorney General enforcement | `accountability-governance` | Violations are enforced as deceptive trade practices; there is no new private right of action, and cure rules apply for a transitional period. |

**Recommended stored-text coverage**

Store the complete signed act linked from the legislature, plus the official enacted summary. At instrument level set `effectiveFrom: 2026-05-14`; for the regulated duties set `principalDutiesFrom: 2027-01-01` or provision-level applicability dates. The UI should say “In force; principal duties begin 1 Jan 2027,” not “not yet law” or simply “effective 1 Jan 2027.”

### 3.12 Colorado lifecycle nodes

These should remain accessible for history, but not serve as the current substantive corpus:

| ID | Instrument | Status | Official source |
|---|---|---|---|
| `us-co-sb24-205-2024` | SB24-205, Consumer Protections for Artificial Intelligence | `superseded`; signed 17 May 2024; original duty date 1 February 2026 | https://leg.colorado.gov/bills/sb24-205 |
| `us-co-sb25b-004-2025` | SB25B-004, Artificial Intelligence Systems | `superseded`; signed 28 August 2025; delayed duties to 30 June 2026 before SB26-189 replaced the regime | https://leg.colorado.gov/bills/sb25b-004 |

Recommended relations:

- `us-co-sb25b-004-2025 --amends/delays--> us-co-sb24-205-2024`
- `us-co-sb26-189-admt-2026 --repeals_and_reenacts--> us-co-sb24-205-2024`
- Do **not** model SB26-189 as a mere date change; its scope and duties materially differ.

---

## Switzerland

### 3.13 Revised FADP

**Recommended stable ID:** `ch-fadp-2020`

| Field | Audited value |
|---|---|
| English title | **Federal Act of 25 September 2020 on Data Protection (Data Protection Act, FADP)** |
| German title | **Bundesgesetz über den Datenschutz (Datenschutzgesetz, DSG)** |
| French title | **Loi fédérale sur la protection des données (Loi sur la protection des données, LPD)** |
| Italian title | **Legge federale sulla protezione dei dati (Legge sulla protezione dei dati, LPD)** |
| Jurisdiction | Switzerland (`ch`) |
| Issuer | Federal Assembly of the Swiss Confederation |
| Type | Federal statute |
| Status | `in_force` |
| Key dates | Adopted 25 September 2020; entered into force 1 September 2023 |
| Regulator | Federal Data Protection and Information Commissioner (FDPIC / EDÖB / PFPDT) |

**Official sources**

- Fedlex consolidated text and language selector: https://www.fedlex.admin.ch/eli/cc/2022/491/en
- Federal Office of Justice reform history and status: https://www.bj.admin.ch/en/new-data-protection-legislation
- FDPIC legal-basis page: https://www.edoeb.admin.ch/en/legal-basis-data-protection

**Language and authority**

- German, French and Italian Fedlex texts: `coauthoritative_original` federal legal-language versions.
- Fedlex English: `official_translation_non_authoritative`; it is an official government translation but not an authoritative Swiss legal-language text.
- The Federal Office of Justice English page contains a visible typo in one link label (“25 September 2022”). The adopted date confirmed in the same official history and the Act is 25 September **2020**.

**High-level summary**

The revised FADP is Switzerland’s technology-neutral federal personal-data statute. It contains processing principles, privacy by design and default, security, cross-border disclosure, controller information duties, automated-individual-decision safeguards, impact assessment, breach reporting, data-subject rights, FDPIC supervision and criminal provisions. Its modernisation also supports alignment with European and Council of Europe standards, but it is distinct from the GDPR.

**Provision-to-concept anchors**

| Provision | High-level title | Concept IDs | Relation rationale |
|---|---|---|---|
| Article 6 | Processing principles | `lawfulness-consent-choice`, `purpose-limitation`, `data-minimization`, `retention-deletion-lifecycle` | It establishes lawful, good-faith, proportionate and purpose-related processing and related accuracy/storage principles. |
| Article 7 | Data protection by design and by default | `privacy-by-design-default`, `data-minimization` | It expressly requires technical and organisational measures from the planning stage and privacy-protective default settings. |
| Article 8 | Data security | `security-controls` | It requires appropriate technical and organisational measures proportionate to risk. |
| Articles 16–17 | Disclosure abroad | `cross-border-transfer`, `accountability-governance` | They govern adequate protection, safeguards and exceptions for foreign disclosure. |
| Articles 19–21 | Information and automated individual decisions | `transparency-explainability`, `automated-decision-safeguards`, `human-oversight`, `data-subject-rights` | They establish information duties and safeguards around qualifying automated decisions, including a right to express a position and request human review in covered cases. |
| Articles 22–24 | DPIA and data-security breaches | `impact-assessment`, `ai-risk-management`, `incident-response` | They require impact assessment for likely high risk and reporting of qualifying breaches to the FDPIC. |

**Recommended stored-text coverage**

Use the canonical Fedlex ELI record and store complete current German, French and Italian texts plus the official English translation aligned by article. Fetching from the consolidated ELI endpoint is preferable to treating one dated PDF as permanently current. Preserve a translation-authority badge in the English default view.

## 4. Recommended cross-instrument knowledge-graph relations

These are defensible concept-level relations. They are not claims that provisions are legally equivalent.

| Source anchor | Target anchor | Relation | Confidence and reason |
|---|---|---|---|
| LGPD Article 6 necessity | FADP Article 6 proportionality; UAE Article 5(3); Nigeria section 24 | `conceptually_overlaps` via `data-minimization` | High: each expressly limits processing/data to what is proportionate or necessary, though formulations and legal tests differ. |
| LGPD Article 20 | POPIA section 71; FADP Articles 19–21; Nigeria section 37; Colorado SB26-189 review rights | `conceptually_overlaps` via `automated-decision-safeguards` | High at concept level; medium at remedy level because trigger conditions and rights differ materially. |
| UAE Articles 20–21 | Nigeria sections 28, 39–40; FADP Articles 22–24; Saudi Articles 19–22 | `conceptually_overlaps` via security, DPIA and incident response | High for broad control families; never label the notification thresholds or deadlines “equivalent” without a narrower test. |
| Brazil PL 2338 Articles 25–28 | Nigeria section 28; FADP Article 22; LGPD impact-report provisions | `extends/analogous_assessment` via `impact-assessment` | Medium: Brazil’s proposal is an algorithmic/fundamental-rights assessment; privacy statutes typically address personal-data risk. |
| Digital Dubai accountability guidelines | SDAIA Accountability and Responsibility | `policy_framework_alignment` | Medium-high: both assign organisational/human responsibility, but structures, scope and practical effect differ; the SDAIA framework contains mandatory controls and should not be flattened into a purely voluntary soft-law category. |
| Digital Dubai fairness guidance | Brazil PL 2338 Articles 2–3 and 5–9; SDAIA Fairness | `policy_framework_alignment` via `fairness-nondiscrimination` | High at principle level; the three instruments have different legal statuses and no legal-equivalence claim is intended. |
| Colorado SB26-189 developer documentation | Brazil PL 2338 governance provisions; SDAIA lifecycle assessment | `operational_overlap` via `training-data-governance`, `third-party-supply-chain`, `human-oversight` | Medium: all address information across the AI value chain, but only Colorado is enacted and its trigger is narrower. |
| AIDA proposed duties | Brazil PL 2338 risk/governance duties | `historical_comparison` | Medium: both are/were proposals and should be compared only using version-specific texts. |

### Relation evidence fields

Every edge should include:

- exact source and target provision IDs;
- a one-sentence rationale;
- `relationType` such as `conceptually_overlaps`, `operationalizes`, `requires`, `implements`, `amends`, `repeals_and_reenacts`, or `historical_comparison`;
- confidence (`high`, `medium`, `low`);
- reviewer and review date;
- source-version IDs;
- an explicit `notEquivalent: true` flag for thematic mappings unless equivalence has been legally reviewed.

## 5. Ingestion and UI priority

### Priority 0 — status fixes before adding more text

1. Move Canada AIDA to `Historical / lapsed proposals`.
2. Replace Colorado SB24-205 as the current node with SB26-189; keep SB24-205 and SB25B-004 in the timeline.
3. Mark Brazil PL 2338 as `Pending bill — no legal force`.
4. Split UAE federal law, Dubai soft law and UAE federal educational guidance into distinct nodes.

### Priority 1 — complete authoritative corpora

1. Brazil LGPD current Portuguese consolidation.
2. UAE PDPL Arabic + official English.
3. Saudi PDPL current Arabic + official English, with implementing regulations separate.
4. POPIA full Act with provision-level commencement metadata.
5. Nigeria Act full English + NDPC local-language translations.
6. Swiss FADP DE/FR/IT + official English.
7. Colorado signed SB26-189.

### Priority 2 — versioned draft and policy-framework corpora

1. Brazil PL 2338 Senate-approved text and Chamber status feed.
2. Digital Dubai full toolkit and self-assessment.
3. SDAIA AI Ethics Principles Version 1.0 and assessment questions.
4. UAE Generative AI Guide as guidance, subject to reuse-term review.
5. Canada AIDA bilingual historical text.

## 6. Maintenance watchlist

| Instrument | What to monitor | Authoritative status endpoint |
|---|---|---|
| Brazil LGPD | Further amendments and a post-2026 English translation | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm |
| Brazil PL 2338 | Rapporteur report, Chamber substitute, plenary votes, return to Senate, sanction/veto | https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262 |
| UAE PDPL | Executive regulations and official portal consolidation | https://uaelegislation.gov.ae/en/legislations/1972 |
| Saudi PDPL | SDAIA regulations, transfer rules and official consolidated Arabic publication | https://dgp.sdaia.gov.sa/ |
| South Africa POPIA | Act amendments, regulations and Information Regulator instruments | https://www.gov.za/documents/protection-personal-information-act |
| Nigeria NDPA | Enacted amendments and NDPC directives; do not promote amendment bills prematurely | https://ndpc.gov.ng/resources/ |
| Canada AI law | Any new bill in the current Parliament; do not infer revival of C-27 | https://www.parl.ca/legisinfo/ |
| Colorado SB26-189 | Attorney General rules before 1 January 2027 and later statutory amendments | https://coag.gov/ai/ |
| Swiss FADP | Fedlex consolidated-version changes and ordinance changes | https://www.fedlex.admin.ch/eli/cc/2022/491/en |

## 7. Final quality gates before publication

- A source cannot appear as “current law” without an official status source and verified operative date.
- A translation cannot appear as “original” merely because it is published by a regulator.
- Every bill must display its legislative stage and snapshot date next to the title.
- Every provision title should be a short editorial heading separate from verbatim legal text.
- Editorial summaries and mappings must never be visually indistinguishable from enacted wording.
- Original-language and English texts must share the same version baseline; if they do not, show the mismatch.
- An amendment or regulation should be its own node/event unless an official consolidated source has incorporated it.
- Concept mappings should be tested provision-by-provision and reviewed again whenever either source version changes.
