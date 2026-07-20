#!/usr/bin/env python3
"""Normalize reviewed BR/ID/TW English resources from isolated drafts.

The resulting resources are project-authored, non-official reference
translations.  This script is deterministic and performs structural,
source-language-residue, numeric-citation, and known-machine-artifact checks.
It does not call a network service.
"""

from __future__ import annotations

from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
TRANSLATIONS = DATA / "reference-translations"


CONFIGS = [
    {
        "instrumentId": "br-pl-2338-2023-ai-bill",
        "source": DATA / "br-ai-bill-2338-2023-articles.json",
        "draft": TRANSLATIONS / "br-pl2338-2023-project-en.draft.json",
        "output": TRANSLATIONS / "br-pl2338-2023-project-en.json",
        "sourceLanguage": "pt-BR",
        "versionLabel": (
            "Senate-approved substitute autograph transmitted to the Chamber of "
            "Deputies; pending bill text as of 20 July 2026"
        ),
    },
    {
        "instrumentId": "id-pdp-law-2022",
        "source": DATA / "id-pdp-law-2022-articles.json",
        "draft": TRANSLATIONS / "id-pdp-law-2022-project-en.draft.json",
        "output": TRANSLATIONS / "id-pdp-law-2022-project-en.json",
        "sourceLanguage": "id-ID",
        "versionLabel": (
            "Law No. 27 of 2022, including the current binding interpretation of "
            "Article 53(1)(b) under Constitutional Court Decision "
            "151/PUU-XXII/2024"
        ),
    },
    {
        "instrumentId": "tw-executive-yuan-generative-ai-guidelines-2023",
        "source": (
            DATA
            / "tw-executive-yuan-generative-ai-guidelines-2023-points.json"
        ),
        "draft": (
            TRANSLATIONS / "tw-genai-guidelines-2023-project-en.draft.json"
        ),
        "output": TRANSLATIONS / "tw-genai-guidelines-2023-project-en.json",
        "sourceLanguage": "zh-Hant-TW",
        "versionLabel": (
            "Final ten-point Executive Yuan guidance issued 3 October 2023"
        ),
    },
]


BRAZIL_OVERRIDES = {
    ("br-pl2338-art-1", 4): (
        "III – used in investigation, research, testing, and development of AI "
        "systems, applications, or models before they are placed on the market or "
        "put into service, provided that the applicable legislation is observed "
        "for those activities, especially Law No. 8,078 of 11 September 1990 "
        "(Consumer Protection Code), Law No. 13,709 of 14 August 2018 (General "
        "Personal Data Protection Law), Law No. 6,938 of 31 August 1981 (National "
        "Environmental Policy), and Law No. 9,610 of 19 February 1998 (Copyright "
        "Law), and provided that testing under real-world conditions complies with "
        "this Law;"
    ),
    ("br-pl2338-art-2", 10): (
        "X – promotion of research and development to foster social development, "
        "reduce inequalities, and encourage innovation in productive sectors and "
        "public administration, as well as public-private partnerships;"
    ),
    ("br-pl2338-art-3", 4): (
        "IV – prohibition of unlawful or abusive discrimination;"
    ),
    ("br-pl2338-art-4", 3): (
        "III – general-purpose artificial intelligence system (SIAPG): an AI "
        "system based on an AI model trained on large-scale datasets, capable of "
        "performing a wide range of distinct tasks and serving different purposes, "
        "including tasks for which it was not specifically developed and trained, "
        "and capable of being integrated into different systems or applications;"
    ),
    ("br-pl2338-art-4", 5): (
        "V – developer: a public- or private-sector natural or legal person that "
        "develops an AI system, directly or on commission, with a view to placing "
        "it on the market or applying it to a service that it provides, under its "
        "own name or brand, for remuneration or free of charge;"
    ),
    ("br-pl2338-art-4", 6): (
        "VI – distributor: a public- or private-sector natural or legal person that "
        "makes an AI system available and distributes it for use by third parties, "
        "for remuneration or free of charge;"
    ),
    ("br-pl2338-art-4", 7): (
        "VII – deployer: a public- or private-sector natural or legal person that "
        "employs or uses an AI system on its own behalf or for its own benefit, "
        "including by configuring or maintaining the system or supporting the "
        "provision of data for its operation and monitoring;"
    ),
    ("br-pl2338-art-4", 10): (
        "X – National System for AI Regulation and Governance (SIA): a regulatory "
        "ecosystem coordinated by the competent authority whose primary purpose is "
        "to promote and ensure cooperation and harmonization among the other "
        "sectoral authorities and regulatory bodies, without a relationship of "
        "hierarchical subordination among them, and with other national systems, "
        "for the full implementation and enforcement of this Law throughout the "
        "national territory, with legal certainty;"
    ),
    ("br-pl2338-art-4", 11): (
        "XI – unlawful or abusive discrimination: any distinction, exclusion, "
        "restriction, or preference, in any area of public or private life, whose "
        "purpose or effect is unlawfully or abusively to nullify or restrict the "
        "recognition, enjoyment, or exercise, on equal terms, of one or more rights "
        "or freedoms provided for in the legal order, on the basis of personal "
        "characteristics;"
    ),
    ("br-pl2338-art-4", 12): (
        "XII – unlawful or abusive indirect discrimination: discrimination that "
        "occurs when an apparently neutral rule, practice, or criterion is capable "
        "of disadvantaging an affected person or group, or placing them at a "
        "disadvantage, where that rule, practice, or criterion is unlawful or "
        "abusive;"
    ),
    ("br-pl2338-art-5", 3): (
        "III – right to freedom from unlawful or abusive discrimination and to the "
        "correction of direct or indirect unlawful or abusive discriminatory bias."
    ),
    ("br-pl2338-art-8", 0): (
        "Article 8. Human oversight of high-risk AI systems shall seek to prevent "
        "or minimize risks to the rights and freedoms of affected persons or groups "
        "that may arise from normal use or reasonably foreseeable misuse, enabling "
        "the persons responsible for human oversight, in accordance with "
        "regulations, to understand, interpret, decide, and intervene in AI systems "
        "and to prioritize the management of risks and irreversible impacts."
    ),
    ("br-pl2338-art-12", 4): (
        "§ 4. After adversarial proceedings and the full right of defense have been "
        "ensured, the competent authority may, in collaboration with the SIA "
        "sectoral authorities and following prior notice, reclassify an AI system "
        "and order, with reasons, that an algorithmic impact assessment be conducted."
    ),
    ("br-pl2338-art-14", 10): (
        "X – investigation by administrative authorities to assess the credibility "
        "of evidence in the course of investigating or prosecuting offenses, or to "
        "predict the occurrence or recurrence of an actual or potential offense on "
        "the basis of profiling natural persons;"
    ),
    ("br-pl2338-art-13", 2): (
        "a) to instigate or induce the behavior of natural persons or groups in a "
        "manner that causes harm to their own or third parties' health, safety, or "
        "other fundamental rights;"
    ),
    ("br-pl2338-art-13", 3): (
        "b) to exploit a vulnerability of natural persons or groups with the "
        "purpose or effect of inducing their behavior in a manner that causes harm "
        "to their own or third parties' health, safety, or other fundamental rights;"
    ),
    ("br-pl2338-art-16", 0): (
        "Article 16. Regulation of the list and classification of new high-risk AI "
        "use cases shall be preceded by a procedure that ensures public "
        "participation and a regulatory impact analysis, with the following "
        "responsibilities:"
    ),
    ("br-pl2338-art-16", 17): (
        "§ 6. The procedure referred to in the chapeau of this Article shall afford "
        "the affected productive and economic sectors an opportunity to make submissions."
    ),
    ("br-pl2338-art-18", 2): (
        "a) documentation, in an appropriate format, covering all relevant stages "
        "of the system's life cycle;"
    ),
    ("br-pl2338-art-18", 3): (
        "b) use of tools or processes to record the results of the system's use, "
        "so as to permit assessment of its accuracy and robustness, detection of "
        "potentially unlawful or abusive discriminatory results, and "
        "implementation of the adopted risk-mitigation measures;"
    ),
    ("br-pl2338-art-30", 0): (
        "Article 30. Before making a general-purpose and generative AI system with "
        "systemic risk available or placing it on the market for commercial "
        "purposes, its developer shall ensure compliance with the following requirements:"
    ),
    ("br-pl2338-art-37", 0): (
        "Article 37. The judge shall reverse the burden of proof when the victim is "
        "at a procedural or evidentiary disadvantage, or when the operating "
        "characteristics of the AI system make it excessively burdensome for the "
        "victim to prove the elements of civil liability."
    ),
    ("br-pl2338-art-40", 2): (
        "§ 2. Developers and deployers of AI systems may implement a governance "
        "program that, in accordance with the state of the art of technological "
        "development:"
    ),
    ("br-pl2338-art-40", 3): (
        "I – demonstrates their commitment to adopting internal processes and "
        "policies that ensure comprehensive compliance with standards and good "
        "practices concerning non-maleficence and proportionality between the "
        "methods used and the defined, legitimate purposes of AI systems;"
    ),
    ("br-pl2338-art-40", 4): (
        "II – is adapted to the structure, scale, and volume of their operations, "
        "as well as their potential for harm and benefit;"
    ),
    ("br-pl2338-art-40", 5): (
        "III – aims to establish a relationship of trust with affected persons and "
        "groups through transparent action that ensures participation mechanisms, "
        "as provided in Section IV of Chapter IV of this Law;"
    ),
    ("br-pl2338-art-41", 5): (
        "IV – criteria for requesting that the competent authority and the other "
        "authorities forming part of the SIA adopt a precautionary measure;"
    ),
    ("br-pl2338-art-42", 2): (
        "§ 2. The sectoral authority shall assess the severity of the incident and "
        "may, where necessary, order the agent to take steps and measures to "
        "reverse or mitigate its effects."
    ),
    ("br-pl2338-art-42", 1): (
        "§ 1. The reporting obligation shall apply once the sectoral authority has "
        "defined the deadline and the criteria for determining the severity of an "
        "incident, taking account of the characteristics of AI systems and the "
        "state of the art of technological development."
    ),
    ("br-pl2338-art-44", 1): (
        "Sole paragraph. Creation of the central database does not preclude the "
        "creation of sectoral high-risk AI databases; the databases shall be "
        "maintained in an interoperable, structured-data format to facilitate "
        "shared use."
    ),
    ("br-pl2338-art-45", 6): (
        "§ 2. An act of the federal Executive Branch shall define the list of "
        "bodies and entities that shall form part of the SIA, in accordance with "
        "items II, III, and IV of § 1 of this Article."
    ),
    ("br-pl2338-art-50", 20): (
        "§ 2. Before or during the administrative proceeding referred to in § 1 of "
        "this Article, the competent authority may adopt preventive measures, "
        "including a coercive fine, subject to the total limit referred to in item "
        "II of the chapeau, where there is evidence or a well-founded concern that "
        "the AI agent:"
    ),
    ("br-pl2338-art-50", 2): (
        "II – a simple fine, capped in the aggregate at R$ 50,000,000.00 (fifty "
        "million reais) per violation and, for a private-law legal entity, at 2% "
        "(two percent) of the gross revenue of that entity or of its group or "
        "conglomerate in Brazil in the preceding financial year, excluding taxes;"
    ),
    ("br-pl2338-art-50", 7): (
        "§ 1. Sanctions shall be imposed following an administrative proceeding "
        "that affords the full right of defense, gradually and separately or "
        "cumulatively, according to the circumstances of the case and considering "
        "the following parameters and criteria:"
    ),
    ("br-pl2338-art-50", 28): (
        "II – publication of methodologies objectively setting out the forms and "
        "calculation of sanctions, with detailed reasons for all their elements and "
        "a demonstration of compliance with the criteria provided in this Law."
    ),
    ("br-pl2338-art-50", 22): (
        "II – renders the final outcome of the proceeding ineffective."
    ),
    ("br-pl2338-art-50", 29): (
        "§ 7. Items I, III, IV, V, and VI of the chapeau of this Article may be "
        "applied to public entities and bodies, without prejudice to Law No. 8,112 "
        "of 11 December 1990 (Federal Public Servants Statute), Law No. 8,429 of 2 "
        "June 1992 (Administrative Improbity Law), and Law No. 12,527 of 18 "
        "November 2011 (Access to Information Law)."
    ),
    ("br-pl2338-art-53", 1): (
        "Sole paragraph. Cria shall:"
    ),
    ("br-pl2338-art-56", 0): (
        "Article 56. The competent authority and the sectoral authorities forming "
        "part of the SIA shall regulate procedures for requesting and authorizing "
        "the operation of regulatory sandboxes; they may limit or terminate their "
        "operation and issue recommendations, taking into account, among other "
        "factors, the preservation of fundamental rights and the rights of "
        "potentially affected consumers, safety, and protection."
    ),
    ("br-pl2338-art-56", 2): (
        "§ 2. The competent authority and sectoral authorities may establish "
        "mechanisms to reduce the regulatory costs of entities qualifying under "
        "§ 1 of this Article."
    ),
    ("br-pl2338-art-63", 7): (
        "§ 4. The chapeau of this Article applies to text and data mining by public "
        "or private entities in the context of AI systems used to combat civil and "
        "criminal violations of copyright and related rights."
    ),
    ("br-pl2338-art-63", 1): (
        "I – access to the content was obtained lawfully;"
    ),
    ("br-pl2338-art-63", 6): (
        "§ 3. This Article does not apply to institutions that are linked to, "
        "affiliated with, or controlled by a for-profit entity that provides AI "
        "systems, or that have an equity relationship with such an entity."
    ),
    ("br-pl2338-art-65", 3): (
        "III – freedom of negotiation in the use of protected content, with a view "
        "to promoting a research and experimentation environment conducive to "
        "innovative practices and without restricting freedom of contract among "
        "the parties involved, in accordance with Articles 156, 157, 421, 422, "
        "478, and 479 of Law No. 10,406 of 10 January 2002 (Civil Code), and "
        "Article 4 of Law No. 9,610 of 19 February 1998 (Copyright Law)."
    ),
    ("br-pl2338-art-65", 6): (
        "II – to persons domiciled in a country that affords reciprocal protection, "
        "on terms equivalent to those of this Article, to the copyright and related "
        "rights of Brazilians, as provided in Article 2, sole paragraph, and "
        "Article 97, § 4, of Law No. 9,610 of 19 February 1998 (Copyright Law); no "
        "charge may be made where reciprocity is not assured."
    ),
    ("br-pl2338-art-69", 0): (
        "Article 69. AI systems used by public authorities shall seek to ensure:"
    ),
    ("br-pl2338-art-68", 1): (
        "I – establishment of transparent, collaborative, democratic, multi-"
        "stakeholder and multi-sector governance mechanisms, with the participation "
        "of government, the business sector, the third sector, and academia, with "
        "particular consideration for vulnerable groups;"
    ),
    ("br-pl2338-art-68", 5): (
        "V – public disclosure and dissemination of data in an open, structured, "
        "and secure manner;"
    ),
    ("br-pl2338-art-70", 1): (
        "I – education, training, capacity-building, and technical and higher-level "
        "qualification and reskilling in AI, aligned with the needs of the market "
        "and the public sector;"
    ),
    ("br-pl2338-art-74", 1): (
        "I – shall provide, within 2 (two) years, the ANPD with the resources "
        "necessary for its work, including its administrative restructuring, in "
        "order to ensure legal certainty and efficiency in supervising and "
        "monitoring compliance with this Law;"
    ),
    ("br-pl2338-art-74", 2): (
        "II – shall define the list of bodies and entities that shall act as the "
        "sectoral authorities forming part of the SIA;"
    ),
    ("br-pl2338-art-78", 0): (
        "Article 78. Implementation of this Law shall respect perfected legal acts, "
        "vested rights, and res judicata."
    ),
    ("br-pl2338-art-79", 0): (
        "Article 79. In view of the impact of technological transformation, every "
        "four years the SIA shall conduct studies and issue an opinion to be "
        "submitted to the National Congress concerning the need to improve the "
        "standards established in this Law."
    ),
}


TAIWAN_OVERRIDES = {
    ("tw-executive-yuan-generative-ai-guidelines-2023-general-explanation", 0): (
        "Generative AI has developed rapidly in recent years and is affecting "
        "government, industry, academia, and research worldwide. ChatGPT, released "
        "at the end of 2022, sparked global interest; its wide-ranging capabilities "
        "are regarded as a major breakthrough in artificial intelligence. Drawing "
        "on the European Union's definition, a generative AI model is a computer "
        "program designed to create new content resembling human-made content. The "
        "large volumes of data that such a model collects, learns from, and "
        "produces may implicate intellectual-property rights, human rights, or "
        "business confidentiality. Because generated results are constrained by "
        "the quality and quantity of the training data, they may be difficult to "
        "distinguish as true or false, or may contain fabricated information. The "
        "information produced and its risks therefore require objective, "
        "professional assessment."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-general-explanation", 1): (
        "Use of generative AI by the Executive Yuan and its subordinate agencies "
        "and institutions (collectively, the agencies) to assist in performing "
        "official functions or providing services can improve administrative "
        "efficiency. To preserve the confidentiality and professionalism of public "
        "service and establish a shared understanding and basic principles for "
        "generative-AI use across agencies, the Reference Guidelines for the Use of "
        "Generative AI by the Executive Yuan and Its Subordinate Agencies and "
        "Institutions (these Guidelines) were prepared with reference to the "
        "cautious approaches adopted by governments in other countries. Each agency "
        "may, according to its operational needs, adopt separate rules or internal "
        "controls by reference to these Guidelines."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-general-explanation", 2): (
        "Given the importance of AI development and its close relationship with "
        "information security and national security, these Guidelines state that "
        "agency personnel using generative AI should act responsibly and "
        "trustworthily, retain autonomy and control, and follow principles of "
        "security, privacy, data governance, and accountability. Personnel must not "
        "arbitrarily disclose non-public official information, share private "
        "personal information, or place complete trust in generated information. "
        "Because AI is developing rapidly, global trends and responses, together "
        "with agencies' implementation of AI applications, will continue to be "
        "monitored, and these Guidelines will be updated on a rolling basis."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-general-explanation", 3): (
        "These Guidelines comprise the following ten points:"
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-1", 0): (
        "1. These Guidelines set out matters to which the Executive Yuan and its "
        "subordinate agencies and institutions (collectively, the agencies) should "
        "pay attention when using generative AI, so that they may improve "
        "administrative efficiency while avoiding potential risks to national "
        "security, information security, human rights, privacy, ethics, and law."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-2", 0): (
        "2. Information produced by generative AI must be subject to the objective "
        "and professional final judgment of the personnel responsible for the "
        "matter, taking account of its risks. Generative AI must not replace those "
        "personnel's independent thought, creativity, or interpersonal interaction."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-3", 0): (
        "3. Personnel responsible for a matter must personally draft confidential "
        "documents; use of generative AI for this purpose is prohibited."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-3", 1): (
        "For purposes of the preceding paragraph, confidential documents mean "
        "national classified documents and ordinary official confidential "
        "documents as defined in the Executive Yuan's Manual for Document "
        "Processing."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-4", 0): (
        "4. Personnel responsible for a matter must not provide generative AI with "
        "official information that must remain confidential, personal information, "
        "or information not authorized by the agency or institution for public "
        "disclosure. They also must not ask generative AI questions that may involve "
        "confidential official business or personal data. However, after the "
        "security of the system environment has been confirmed, a generative-AI "
        "model deployed in a closed, on-premises environment may be used according "
        "to the applicable confidentiality classification of the document or "
        "information."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-5", 0): (
        "5. Agencies must not place complete trust in information produced by "
        "generative AI. Nor may they use unverified output directly to take an "
        "administrative action or as the sole basis for an official decision."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-6", 0): (
        "6. An agency must make appropriate disclosure when it uses generative AI "
        "as an assistive tool in performing official functions or providing "
        "services."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-7", 0): (
        "7. Use of generative AI must comply with requirements concerning "
        "information and communications security, personal-data protection, "
        "copyright, and related uses of information, and must take account of the "
        "potential infringement of intellectual-property and personality rights. "
        "Each agency may establish rules or internal controls for generative-AI use "
        "according to the equipment used and the nature of its operations."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-8", 0): (
        "8. For procurements it conducts, an agency must require a successful "
        "bidder that is a legal person, organization, or individual to take these "
        "Guidelines into account and comply with the rules or internal controls "
        "adopted by the agency under the preceding point."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-9", 0): (
        "9. State-owned enterprises, public schools, administrative corporations, "
        "and government-funded foundations may apply these Guidelines mutatis "
        "mutandis when using generative AI."
    ),
    ("tw-executive-yuan-generative-ai-guidelines-2023-point-10", 0): (
        "10. Government bodies other than the Executive Yuan and its subordinate "
        "agencies and institutions may refer to these Guidelines when establishing "
        "their own rules for the use of generative AI."
    ),
}


INDONESIA_OVERRIDES = {
    ("id-pdp-law-2022-art-1", 1): "In this Law:",
    ("id-pdp-law-2022-art-1", 2): (
        "1. Personal Data means data relating to a natural person who is identified "
        "or identifiable, separately or in combination with other information, "
        "directly or indirectly through an electronic or non-electronic system."
    ),
    ("id-pdp-law-2022-art-1", 3): (
        "2. Personal Data Protection means the entire set of efforts to protect "
        "Personal Data throughout Personal Data processing in order to guarantee "
        "the constitutional rights of Personal Data Subjects."
    ),
    ("id-pdp-law-2022-art-1", 4): (
        "3. Information means statements, ideas, and signs containing values, "
        "meanings, and messages, including data, facts, and explanations that can "
        "be seen, heard, or read and are presented in various packages and formats "
        "in keeping with developments in electronic and non-electronic information "
        "and communication technology."
    ),
    ("id-pdp-law-2022-art-1", 7): (
        "6. Personal Data Subject means the individual to whom Personal Data relate."
    ),
    ("id-pdp-law-2022-art-2", 1): (
        "(1) This Law applies to Any Person, Public Agency, or International "
        "Organization that performs a legal act regulated by this Law:"
    ),
    ("id-pdp-law-2022-art-2", 3): (
        "b. outside the jurisdiction of the Republic of Indonesia, where the act "
        "has legal consequences:"
    ),
    ("id-pdp-law-2022-art-5", 1): (
        "Personal Data Subjects have the right to obtain information about the "
        "identity of the party requesting Personal Data, that party's legal basis "
        "and accountability, and the purpose of the request and use of the Personal "
        "Data."
    ),
    ("id-pdp-law-2022-art-10", 2): (
        "(2) Further provisions concerning objections to automated processing "
        "referred to in paragraph (1) shall be regulated by a Government Regulation."
    ),
    ("id-pdp-law-2022-art-14", 1): (
        "The rights of Personal Data Subjects referred to in Articles 6 through 11 "
        "shall be exercised by submitting a recorded request, electronically or "
        "non-electronically, to the Personal Data Controller."
    ),
    ("id-pdp-law-2022-art-15", 1): (
        "(1) The rights of Personal Data Subjects referred to in Article 8, "
        "Article 9, Article 10 paragraph (1), Article 11, and Article 13 paragraphs "
        "(1) and (2) do not apply for:"
    ),
    ("id-pdp-law-2022-art-16", 5): "d. rectification and updating;",
    ("id-pdp-law-2022-art-16", 6): (
        "e. display, publication, transfer, dissemination, or disclosure; and/or"
    ),
    ("id-pdp-law-2022-art-16", 9): (
        "a. Personal Data shall be collected in a limited, specific, lawful, and "
        "transparent manner;"
    ),
    ("id-pdp-law-2022-art-16", 13): (
        "e. Personal Data shall be processed with safeguards protecting its "
        "security against unauthorized access, unauthorized disclosure, "
        "unauthorized alteration, misuse, damage, and/or loss;"
    ),
    ("id-pdp-law-2022-art-16", 16): (
        "h. Personal Data shall be processed responsibly and in a demonstrably "
        "accountable manner."
    ),
    ("id-pdp-law-2022-art-17", 1): (
        "(1) Visual-data processing devices or equipment may be installed in a "
        "public place and/or public-service facility subject to the following "
        "conditions:"
    ),
    ("id-pdp-law-2022-art-17", 5): (
        "(2) Paragraph (1) letters b and c do not apply to the prevention of "
        "criminal offenses and law-enforcement processes conducted in accordance "
        "with laws and regulations."
    ),
    ("id-pdp-law-2022-art-18", 1): (
        "(1) Personal Data may be processed by 2 (two) or more Personal Data "
        "Controllers."
    ),
    ("id-pdp-law-2022-art-19", 2): "a. Any Person;",
    ("id-pdp-law-2022-art-19", 4): "c. International Organizations.",
    ("id-pdp-law-2022-art-20", 5): (
        "c. compliance with a legal obligation of the Personal Data Controller in "
        "accordance with laws and regulations;"
    ),
    ("id-pdp-law-2022-art-21", 1): (
        "(1) Where Personal Data are processed on the basis of consent as referred "
        "to in Article 20 paragraph (2) letter a, the Personal Data Controller "
        "shall provide information concerning:"
    ),
    ("id-pdp-law-2022-art-22", 2): (
        "(2) The consent referred to in paragraph (1) may be given electronically "
        "or non-electronically."
    ),
    ("id-pdp-law-2022-art-22", 3): (
        "(3) Electronic and non-electronic consent referred to in paragraph (2) "
        "have equal legal force."
    ),
    ("id-pdp-law-2022-art-22", 4): (
        "(4) Where a request for consent referred to in paragraph (1) also relates "
        "to other matters, the request shall:"
    ),
    ("id-pdp-law-2022-art-22", 5): "a. be clearly distinguishable from those other matters;",
    ("id-pdp-law-2022-art-22", 6): "b. use an understandable and easily accessible format; and",
    ("id-pdp-law-2022-art-22", 7): "c. use clear and plain language.",
    ("id-pdp-law-2022-art-22", 8): (
        "(5) Consent that does not satisfy paragraph (1) and paragraph (4) is null "
        "and void by operation of law."
    ),
    ("id-pdp-law-2022-art-24", 1): (
        "When processing Personal Data, the Personal Data Controller shall be able "
        "to demonstrate the consent given by the Personal Data Subject."
    ),
    ("id-pdp-law-2022-art-25", 2): (
        "(2) The processing of children's Personal Data referred to in paragraph "
        "(1) requires the consent of the child's parent and/or guardian in "
        "accordance with laws and regulations."
    ),
    ("id-pdp-law-2022-art-26", 3): (
        "(3) The processing of Personal Data of persons with disabilities referred "
        "to in paragraph (2) requires the consent of the person with a disability "
        "and/or that person's guardian in accordance with laws and regulations."
    ),
    ("id-pdp-law-2022-art-33", 1): (
        "Personal Data Controllers shall refuse to grant a Personal Data Subject "
        "access to amend Personal Data where doing so would:"
    ),
    ("id-pdp-law-2022-art-33", 2): (
        "a. endanger the security or physical or mental health of the Personal Data "
        "Subject and/or another person;"
    ),
    ("id-pdp-law-2022-art-33", 3): (
        "b. result in disclosure of Personal Data belonging to another person; and/or"
    ),
    ("id-pdp-law-2022-art-33", 4): (
        "c. be contrary to national defense and security interests."
    ),
    ("id-pdp-law-2022-art-34", 1): (
        "(1) Personal Data Controllers shall conduct a Personal Data Protection "
        "impact assessment where Personal Data processing is likely to present a "
        "high risk to Personal Data Subjects."
    ),
    ("id-pdp-law-2022-art-34", 2): (
        "(2) Personal Data processing likely to present a high risk as referred to "
        "in paragraph (1) includes:"
    ),
    ("id-pdp-law-2022-art-34", 3): (
        "a. automated decision-making that produces legal consequences or a "
        "significant impact on Personal Data Subjects;"
    ),
    ("id-pdp-law-2022-art-34", 10): (
        "(3) Further provisions concerning Personal Data Protection impact "
        "assessments shall be regulated by a Government Regulation."
    ),
    ("id-pdp-law-2022-art-35", 2): (
        "a. preparing and implementing technical and operational measures to "
        "protect Personal Data against processing that contravenes laws and "
        "regulations; and"
    ),
    ("id-pdp-law-2022-art-35", 3): (
        "b. determining an appropriate level of Personal Data security, taking "
        "account of the nature of the Personal Data and the risks involved in its "
        "processing."
    ),
    ("id-pdp-law-2022-art-41", 2): (
        "(2) The duty to postpone and restrict Personal Data processing referred "
        "to in paragraph (1) does not apply where:"
    ),
    ("id-pdp-law-2022-art-41", 3): (
        "a. laws or regulations prohibit postponement and restriction of Personal "
        "Data processing;"
    ),
    ("id-pdp-law-2022-art-41", 4): "b. doing so could endanger another party's safety; and/or",
    ("id-pdp-law-2022-art-42", 2): "a. the retention period has expired;",
    ("id-pdp-law-2022-art-43", 3): (
        "b. the Personal Data Subject has withdrawn their consent to the processing "
        "of Personal Data;"
    ),
    ("id-pdp-law-2022-art-44", 4): (
        "c. the Personal Data are not connected with the completion of legal "
        "proceedings in a case; and/or"
    ),
    ("id-pdp-law-2022-art-46", 1): (
        "(1) In the event of a failure to protect Personal Data, the Personal Data "
        "Controller shall give written notice within 3 x 24 (three times twenty-four) "
        "hours to:"
    ),
    ("id-pdp-law-2022-art-46", 5): "a. the Personal Data that were disclosed;",
    ("id-pdp-law-2022-art-46", 6): "b. when and how the Personal Data were disclosed; and",
    ("id-pdp-law-2022-art-46", 7): (
        "c. the Personal Data Controller's measures to address and remedy the "
        "disclosure of Personal Data."
    ),
    ("id-pdp-law-2022-art-47", 1): (
        "Personal Data Controllers shall be responsible for Personal Data "
        "processing and shall demonstrate accountability for compliance with the "
        "obligations implementing the Personal Data Protection principles."
    ),
    ("id-pdp-law-2022-art-49", 1): (
        "Personal Data Controllers and/or Personal Data Processors shall comply "
        "with orders issued by the institution in implementing Personal Data "
        "Protection under this Law."
    ),
    ("id-pdp-law-2022-art-50", 1): (
        "(1) The obligations of Personal Data Controllers under Article 30, "
        "Article 32, Article 36, Article 42, Article 43 paragraph (1) letters a "
        "through c, Article 44 paragraph (1) letter b, Article 45, and Article 46 "
        "paragraph (1) letter a do not apply for:"
    ),
    ("id-pdp-law-2022-art-53", 1): (
        "(1) Personal Data Controllers and Personal Data Processors shall appoint "
        "an officer or official to perform the Personal Data Protection function "
        "where:"
    ),
    ("id-pdp-law-2022-art-53", 3): (
        "b. the nature, scope, and/or purposes of the Personal Data Controller's "
        "core activities require regular and systematic monitoring of Personal "
        "Data on a large scale; and/or"
    ),
    ("id-pdp-law-2022-art-53", 4): (
        "c. the Personal Data Controller's core activities consist of large-scale "
        "processing of Personal Data of a specific nature and/or Personal Data "
        "relating to criminal offenses."
    ),
    ("id-pdp-law-2022-art-54", 1): (
        "(1) An officer or official performing the Personal Data Protection "
        "function shall at least:"
    ),
    ("id-pdp-law-2022-art-54", 2): (
        "a. inform and advise the Personal Data Controller or Personal Data "
        "Processor concerning compliance with this Law;"
    ),
    ("id-pdp-law-2022-art-54", 4): (
        "c. advise on Personal Data Protection impact assessments and monitor the "
        "performance of the Personal Data Controller and Personal Data Processor; and"
    ),
    ("id-pdp-law-2022-art-54", 6): (
        "(2) In performing the duties referred to in paragraph (1), an officer or "
        "official performing the Personal Data Protection function shall have "
        "regard to the risks associated with Personal Data processing, taking "
        "account of the nature, scope, context, and purposes of the processing."
    ),
    ("id-pdp-law-2022-art-55", 2): (
        "(2) Both the transferring and receiving Personal Data Controllers shall "
        "protect Personal Data as required by this Law."
    ),
    ("id-pdp-law-2022-art-56", 2): (
        "(2) For a transfer referred to in paragraph (1), the Personal Data "
        "Controller shall ensure that the country in which the recipient Personal "
        "Data Controller and/or Personal Data Processor is located affords a level "
        "of Personal Data Protection equivalent to or higher than that provided by "
        "this Law."
    ),
    ("id-pdp-law-2022-art-56", 3): (
        "(3) If paragraph (2) is not satisfied, the Personal Data Controller shall "
        "ensure that adequate and binding Personal Data Protection is in place."
    ),
    ("id-pdp-law-2022-art-56", 4): (
        "(4) If neither paragraph (2) nor paragraph (3) is satisfied, the Personal "
        "Data Controller shall obtain the consent of the Personal Data Subject."
    ),
    ("id-pdp-law-2022-art-57", 7): (
        "(3) An administrative fine referred to in paragraph (2) letter d may not "
        "exceed 2 (two) percent of annual revenue or annual receipts, depending on "
        "the violation."
    ),
    ("id-pdp-law-2022-art-60", 3): "b. supervise compliance by Personal Data Controllers;",
    ("id-pdp-law-2022-art-60", 5): (
        "d. assist law-enforcement officers in handling suspected criminal offenses "
        "involving Personal Data as referred to in this Law;"
    ),
    ("id-pdp-law-2022-art-60", 13): (
        "l. request statements, data, Information, and documents from Any Person "
        "and/or Public Agency concerning an alleged Personal Data Protection violation;"
    ),
    ("id-pdp-law-2022-art-61", 2): "CHAPTER X",
    ("id-pdp-law-2022-art-61", 1): (
        "Procedures for exercising the institution's powers referred to in "
        "Article 60 shall be regulated by a Government Regulation."
    ),
    ("id-pdp-law-2022-art-64", 6): (
        "(4) Where necessary to protect Personal Data, proceedings shall be held "
        "in closed court."
    ),
    ("id-pdp-law-2022-art-65", 1): (
        "(1) Any Person is prohibited from unlawfully obtaining or collecting "
        "Personal Data that do not belong to them, with the intent to benefit "
        "themselves or another person, where loss to a Personal Data Subject could "
        "result."
    ),
    ("id-pdp-law-2022-art-65", 2): (
        "(2) Any Person is prohibited from unlawfully disclosing Personal Data that "
        "do not belong to them."
    ),
    ("id-pdp-law-2022-art-65", 3): (
        "(3) Any Person is prohibited from unlawfully using Personal Data that do "
        "not belong to them."
    ),
    ("id-pdp-law-2022-art-66", 1): (
        "Any Person is prohibited from creating false Personal Data or falsifying "
        "Personal Data, with the intent to benefit themselves or another person, "
        "where harm to another person could result."
    ),
    ("id-pdp-law-2022-art-67", 1): (
        "(1) Any person who intentionally and unlawfully obtains or collects "
        "Personal Data that do not belong to them, with the intent to benefit "
        "themselves or another person and where loss to a Personal Data Subject may "
        "result, as referred to in Article 65 paragraph (1), shall be punishable by "
        "imprisonment for a maximum term of 5 (five) years and/or a maximum fine of "
        "Rp5,000,000,000.00 (five billion rupiah)."
    ),
    ("id-pdp-law-2022-art-67", 2): (
        "(2) Any person who intentionally and unlawfully discloses Personal Data "
        "that do not belong to them, as referred to in Article 65 paragraph (2), "
        "shall be punishable by imprisonment for a maximum term of 4 (four) years "
        "and/or a maximum fine of Rp4,000,000,000.00 (four billion rupiah)."
    ),
    ("id-pdp-law-2022-art-67", 3): (
        "(3) Any person who intentionally and unlawfully uses Personal Data that do "
        "not belong to them, as referred to in Article 65 paragraph (3), shall be "
        "punishable by imprisonment for a maximum term of 5 (five) years and/or a "
        "maximum fine of Rp5,000,000,000.00 (five billion rupiah)."
    ),
    ("id-pdp-law-2022-art-68", 1): (
        "Any person who intentionally creates false Personal Data or falsifies "
        "Personal Data, with the intent to benefit themselves or another person and "
        "where harm to another person may result, as referred to in Article 66, "
        "shall be punishable by imprisonment for a maximum term of 6 (six) years "
        "and/or a maximum fine of Rp6,000,000,000.00 (six billion rupiah)."
    ),
    ("id-pdp-law-2022-art-69", 1): (
        "In addition to a sentence under Article 67 or Article 68, an additional "
        "penalty may be imposed in the form of confiscation of profits and/or "
        "assets obtained from, or constituting proceeds of, the criminal offense, "
        "and payment of compensation."
    ),
    ("id-pdp-law-2022-art-70", 1): (
        "(1) Where a criminal offense referred to in Article 67 or Article 68 is "
        "committed by a Corporation, a penalty may be imposed on its management, "
        "controlling person, person giving the order, beneficial owner, and/or the "
        "Corporation."
    ),
    ("id-pdp-law-2022-art-70", 3): (
        "(3) A fine imposed on a Corporation may not exceed 10 (ten) times the "
        "maximum fine prescribed for the offense."
    ),
    ("id-pdp-law-2022-art-70", 8): (
        "d. closure of all or part of the Corporation's business premises and/or "
        "activities;"
    ),
    ("id-pdp-law-2022-art-71", 1): (
        "(1) Where a court imposes a fine, the convicted person shall pay it within "
        "1 (one) month after the judgment becomes final and binding."
    ),
    ("id-pdp-law-2022-art-71", 4): (
        "(4) If the seizure and auction of assets or income referred to in "
        "paragraph (3) are insufficient or cannot be carried out, the unpaid fine "
        "shall be replaced by imprisonment up to the maximum term prescribed for "
        "the offense concerned."
    ),
    ("id-pdp-law-2022-art-70", 9): (
        "e. performance of obligations that have been neglected;"
    ),
    ("id-pdp-law-2022-art-71", 5): (
        "(5) The term of imprisonment referred to in paragraph (4) shall be "
        "determined by the judge and stated in the judgment."
    ),
    ("id-pdp-law-2022-art-72", 2): (
        "(2) The period for which part or all of the Corporation's business "
        "activities are suspended under paragraph (1) shall be determined by the "
        "judge and stated in the judgment."
    ),
}


def digest(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def clean_common(value: str) -> str:
    value = value.replace("\u200b", "").replace("\u200c", "")
    value = value.replace("\ufeff", "").replace("\u00ad", "")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r" +([,.;:])", r"\1", value)
    return value.strip()


def normalize_brazil(value: str) -> str:
    value = clean_common(value)
    value = re.sub(r"^Art\.\s*(\d+)\.?\s*", r"Article \1. ", value)
    value = re.sub(r"^§\s*(\d+)º?\.?\s*", r"§ \1. ", value)
    value = re.sub(r"^Single paragraph\.\s*", "Sole paragraph. ", value)
    value = re.sub(r"\barts?\.\s*(\d+)", r"Article \1", value, flags=re.I)
    value = re.sub(r"\bLaw No\.\s+No\.\s+", "Law No. ", value)
    value = re.sub(r"\bapplicators?\b", lambda m: "Deployers" if m.group(0)[0].isupper() else ("deployers" if m.group(0).endswith("s") else "deployer"), value)
    value = value.replace("cyber security", "cybersecurity")
    value = value.replace("cyber defense", "cyberdefense")
    value = value.replace(
        "General Law for the Protection of Personal Data",
        "General Personal Data Protection Law",
    )
    value = value.replace(
        "General Law on the Protection of Personal Data",
        "General Personal Data Protection Law",
    )
    value = value.replace(
        "National Artificial Intelligence Regulation and Governance System",
        "National System for AI Regulation and Governance",
    )
    value = value.replace("general purpose AI", "general-purpose AI")
    value = value.replace("general purpose and generative AI", "general-purpose and generative AI")
    value = value.replace("uniqueizing them", "uniquely identifying them")
    value = re.sub(
        r"\bsection ([IVXLCDM]+) of the caput\b",
        r"item \1 of the chapeau",
        value,
        flags=re.I,
    )
    value = re.sub(
        r"\bsection ([IVXLCDM]+) of this article\b",
        r"item \1 of this Article",
        value,
        flags=re.I,
    )
    value = re.sub(r"\bcaput\b", "chapeau", value, flags=re.I)
    value = re.sub(r"\bArticle (\d+)(?:st|nd|rd|th)\b", r"Article \1", value)
    value = re.sub(r"§ (\d+)(?:st|nd|rd|th)\b", r"§ \1", value)
    value = value.replace("broad defense", "full defense")
    value = re.sub(r"\bwill\b", "shall", value, flags=re.I)
    value = re.sub(r"\bmust\b", "shall", value, flags=re.I)
    duty_replacements = {
        "It shall be up to the sectoral authority to ": "The sectoral authority shall ",
        "It shall be up to the competent authority and the sectoral authorities to ": (
            "The competent authority and the sectoral authorities shall "
        ),
        "It shall be up to the competent authority, in collaboration with other SIA entities, to ": (
            "The competent authority, in collaboration with other SIA entities, shall "
        ),
        "It shall be up to the SIA, every four years, to ": "Every four years, the SIA shall ",
        "It is up to the competent authority, in collaboration with sectoral authorities, to ": (
            "The competent authority, in collaboration with sectoral authorities, shall "
        ),
        "It is up to the sectoral authorities:": "The sectoral authorities shall:"
    }
    for old, new in duty_replacements.items():
        value = value.replace(old, new)
    value = re.sub(
        r"\b[Ii]t shall be up to the sectoral authorities to\b",
        "The sectoral authorities shall",
        value,
    )
    value = re.sub(
        r"\b[Ii]t shall be up to the sectoral authority, (.+?), to\b",
        r"The sectoral authority, \1, shall",
        value,
    )
    value = re.sub(
        r"\b[Ii]t shall be up to the federal Executive Branch to\b",
        "The federal Executive Branch shall",
        value,
    )
    value = re.sub(
        r"\b[Ii]t shall be up to the competent authority, in collaboration with (?:the )?other SIA entities, to\b",
        "The competent authority, in collaboration with the other SIA entities, shall",
        value,
    )
    value = re.sub(
        r"\b[Ii]t shall be up to the SIA, every four years, to\b",
        "Every four years, the SIA shall",
        value,
    )
    value = value.replace("enables him to", "enables that agent to")
    value = value.replace("Once contradictory and full defense are guaranteed", "After adversarial proceedings and the full right of defense have been ensured")
    value = value.replace("the following hypotheses", "the following circumstances")
    value = value.replace("in the hypotheses in which", "in circumstances where")
    value = value.replace("the hypotheses in which", "the circumstances in which")
    value = value.replace("in the hypotheses of", "in the circumstances under")
    value = value.replace("the hypotheses described", "the circumstances described")
    value = value.replace("high-risk application hypotheses", "high-risk use cases")
    value = value.replace("application hypotheses", "use cases")
    value = re.sub(r"\bliability hypotheses\b", "grounds for liability", value, flags=re.I)
    value = re.sub(r"\bhypotheses classified or not classified\b", "cases classified or not classified", value, flags=re.I)
    value = re.sub(r"\bin the hypotheses of\b", "in the circumstances under", value, flags=re.I)
    value = value.replace("does not meet other information and transparency requirements", "does not satisfy other information and transparency requirements")
    value = value.replace("shall be able to", "may")
    value = value.replace("can be considered", "may be considered")
    return value


def normalize_indonesia(value: str) -> str:
    value = clean_common(value)
    value = re.sub(r"^article\s+(\d+)\s*$", r"Article \1", value, flags=re.I)
    value = re.sub(r";\s*And$", "; and", value)
    value = re.sub(r";\s*And\b", "; and", value)
    value = re.sub(r"\bpublic bodies\b", "Public Agencies", value, flags=re.I)
    value = re.sub(r"\bpublic body\b", "Public Agency", value, flags=re.I)
    value = re.sub(
        r"\bPersonal Data subjects\b", "Personal Data Subjects", value
    )
    value = re.sub(r"\b(?:every|any) person\b", "Any Person", value, flags=re.I)
    value = value.replace("statutory provisions", "laws and regulations")
    value = value.replace("statutory regulations", "laws and regulations")
    value = value.replace(
        "are required to own the basis for processing Personal Data",
        "shall have a lawful basis for processing Personal Data",
    )
    value = value.replace("explicit legal consent", "explicit valid consent")
    value = value.replace(
        "obtain the approval of the Personal Data Subject",
        "obtain the consent of the Personal Data Subject",
    )
    value = value.replace("does not belong to him", "does not belong to them")
    value = value.replace("benefiting himself", "benefiting themselves")
    value = re.sub(r"\bare required to\b", "shall", value, flags=re.I)
    value = re.sub(r"\bis required to\b", "shall", value, flags=re.I)
    value = re.sub(r"\bare obliged to\b", "shall", value, flags=re.I)
    value = re.sub(r"\bis obliged to\b", "shall", value, flags=re.I)
    value = re.sub(r"\bare shall\b", "shall", value, flags=re.I)
    value = re.sub(r"\bis shall\b", "shall", value, flags=re.I)
    value = re.sub(r"\brequired to\b", "shall", value, flags=re.I)
    value = re.sub(r"\bmust\b", "shall", value, flags=re.I)
    value = re.sub(r"\bas intended in\b", "as referred to in", value, flags=re.I)
    value = re.sub(r"\bas intended by\b", "as referred to in", value, flags=re.I)
    value = re.sub(
        r"^((?:\(\d+\)\s+)?Further provisions concerning .+?) are regulated in Government Regulations\.$",
        r"\1 shall be regulated by a Government Regulation.",
        value,
    )
    value = re.sub(
        r"^((?:\(\d+\)\s+)?Further provisions regarding .+?) are regulated in Government Regulations\.$",
        lambda match: match.group(1).replace("regarding", "concerning")
        + " shall be regulated by a Government Regulation.",
        value,
    )
    value = value.replace(
        "are regulated by Presidential Regulation.",
        "shall be regulated by a Presidential Regulation.",
    )
    value = value.replace("twenty four", "twenty-four")
    value = value.replace("This law", "This Law")
    value = value.replace(
        "Personal Data Controllers can transfer",
        "Personal Data Controllers may transfer",
    )
    value = value.replace(
        "The public can play a role", "The public may participate"
    )
    value = value.replace(
        "The implementation of the role as referred to in paragraph (1) can be carried out",
        "Participation referred to in paragraph (1) may take place",
    )
    return value


def marker(value: str, instrument_id: str) -> str:
    if instrument_id == "br-pl-2338-2023-ai-bill":
        patterns = [
            (r"^(?:Art\.|Article)\s*(\d+)", "article"),
            (r"^§\s*(\d+)", "section"),
            (r"^(?:Parágrafo único|Sole paragraph)", "sole"),
            (r"^([IVXLCDM]+)\s*[–−-]", "roman"),
            (r"^([a-z])\)", "letter"),
        ]
    elif instrument_id == "id-pdp-law-2022":
        patterns = [
            (r"^(?:Pasal|Article)\s*(\d+)", "article"),
            (r"^\((\d+)\)", "section"),
            (r"^([a-z])\.\s*", "letter"),
            (r"^(\d+)\.\s*", "number"),
        ]
    else:
        patterns = [
            (r"^([一二三四五六七八九十]+)、", "point"),
            (r"^(\d+)\.\s*", "point"),
        ]
    for pattern, kind in patterns:
        match = re.match(pattern, value)
        if match:
            return f"{kind}:{match.group(1) if match.groups() else ''}"
    return "body"


def numeric_tokens(value: str) -> Counter[str]:
    return Counter(str(int(item)) for item in re.findall(r"(?<![A-Za-z])\d+", value))


def validate_resource(config: dict, source: list[dict], units: list[dict]) -> None:
    if len(units) != len(source):
        raise ValueError(f"{config['instrumentId']}: unit count mismatch")
    source_by_id = {unit["id"]: unit for unit in source}
    for translated in units:
        original = source_by_id.get(translated["id"])
        if original is None:
            raise ValueError(f"Unknown translation unit {translated['id']}")
        paragraphs = translated["paragraphs"]
        if len(paragraphs) != len(original["paragraphs"]):
            raise ValueError(f"{translated['id']}: paragraph count mismatch")
        if translated["fullText"] != "\n\n".join(paragraphs):
            raise ValueError(f"{translated['id']}: fullText mismatch")
        if translated["contentSha256"] != digest(translated["fullText"]):
            raise ValueError(f"{translated['id']}: English hash mismatch")
        if translated["sourceContentSha256"] != digest(original["fullText"]):
            raise ValueError(f"{translated['id']}: source hash mismatch")
        for index, (source_paragraph, english_paragraph) in enumerate(
            zip(original["paragraphs"], paragraphs, strict=True)
        ):
            source_marker = marker(source_paragraph, config["instrumentId"])
            english_marker = marker(english_paragraph, config["instrumentId"])
            if source_marker.split(":", 1)[0] != english_marker.split(":", 1)[0]:
                raise ValueError(
                    f"{translated['id']} paragraph {index}: marker mismatch "
                    f"{source_marker!r} != {english_marker!r}"
                )

            if config["instrumentId"] == "br-pl-2338-2023-ai-bill":
                source_numbers = numeric_tokens(source_paragraph)
                english_numbers = numeric_tokens(english_paragraph)
                if source_numbers != english_numbers:
                    raise ValueError(
                        f"{translated['id']} paragraph {index}: numeric citation "
                        f"mismatch {source_numbers - english_numbers} / "
                        f"{english_numbers - source_numbers}"
                    )

        if re.search(
            r"this (?:article|section|provision).{0,160}mapped to|complete "
            r"official .{0,80}wording is available",
            translated["fullText"],
            flags=re.I | re.S,
        ):
            raise ValueError(f"{translated['id']}: placeholder text detected")

    joined = "\n".join(unit["fullText"] for unit in units)
    forbidden = ["Law No. No.", "\u200b", "\u200c", "\ufeff", "\u00ad"]
    for bad in forbidden:
        if bad in joined:
            raise ValueError(f"{config['instrumentId']}: forbidden artifact {bad!r}")
    if config["instrumentId"] == "br-pl-2338-2023-ai-bill":
        residue = re.compile(
            r"\b(?:promoção|desenvolvimento|regulação|governança|inteligência|"
            r"discriminação|investigação|autoridades|direitos|pessoa|dados|"
            r"conformidade|deverá|será|não)\b",
            flags=re.I,
        )
        if residue.search(joined):
            raise ValueError(f"Portuguese residue: {residue.search(joined).group()}")
    if config["instrumentId"] == "id-pdp-law-2022":
        residue = re.compile(
            r"\b(?:undang-undang|pelindungan|pribadi|pengendali|pemrosesan|"
            r"ketentuan|sebagaimana|dimaksud|wajib|dan|yang|untuk)\b",
            flags=re.I,
        )
        if residue.search(joined):
            raise ValueError(f"Indonesian residue: {residue.search(joined).group()}")
    if config["instrumentId"].startswith("tw-") and re.search(
        r"[\u3400-\u9fff]", joined
    ):
        raise ValueError("Traditional-Chinese residue in Taiwan English resource")


def build(config: dict) -> None:
    source = json.loads(config["source"].read_text(encoding="utf-8"))
    draft = json.loads(config["draft"].read_text(encoding="utf-8"))
    if draft["instrumentId"] != config["instrumentId"]:
        raise ValueError("Draft instrument mismatch")
    draft_by_id = {unit["id"]: unit for unit in draft["units"]}
    units: list[dict] = []
    for original in source:
        draft_unit = draft_by_id[original["id"]]
        draft_paragraphs = draft_unit["paragraphs"]
        if (
            config["instrumentId"] == "id-pdp-law-2022"
            and original["id"] == "id-pdp-law-2022-art-61"
            and len(draft_paragraphs) == len(original["paragraphs"]) + 2
        ):
            # The network draft was prepared before the cross-check OCR string
            # ``BABX`` was normalized to ``BAB X`` and correctly recognized as a
            # structural Chapter heading rather than Article 61 body text.
            draft_paragraphs = draft_paragraphs[: len(original["paragraphs"])]
        paragraphs: list[str] = []
        for index, paragraph in enumerate(draft_paragraphs):
            if config["instrumentId"] == "br-pl-2338-2023-ai-bill":
                final = BRAZIL_OVERRIDES.get(
                    (original["id"], index), normalize_brazil(paragraph)
                )
            elif config["instrumentId"] == "id-pdp-law-2022":
                final = INDONESIA_OVERRIDES.get(
                    (original["id"], index), normalize_indonesia(paragraph)
                )
            else:
                final = TAIWAN_OVERRIDES[(original["id"], index)]
            paragraphs.append(clean_common(final))

        if original["id"] == "id-pdp-law-2022-art-53":
            if paragraphs[3].endswith("; and"):
                paragraphs[3] = f"{paragraphs[3][:-5]}; and/or"
            elif not paragraphs[3].endswith("; and/or"):
                raise ValueError("Article 53 translation overlay anchor changed")

        full_text = "\n\n".join(paragraphs)
        unit = {
            "id": original["id"],
            "sourceContentSha256": digest(original["fullText"]),
            "sourceParagraphCount": len(original["paragraphs"]),
            "paragraphs": paragraphs,
            "fullText": full_text,
            "contentSha256": digest(full_text),
        }
        if original["id"] == "id-pdp-law-2022-art-53":
            unit["legalEffectAlignment"] = (
                "current-operative-text-after-Decision-151-PUU-XXII-2024"
            )
            unit["operativeSourceContentSha256"] = original[
                "currentOperativeSha256"
            ]
        units.append(unit)

    validate_resource(config, source, units)
    payload = {
        "schemaVersion": 1,
        "instrumentId": config["instrumentId"],
        "sourceLanguage": config["sourceLanguage"],
        "targetLanguage": "en",
        "status": "reviewed-project-authored-reference-translation",
        "officialStatus": "non-official-no-legal-effect",
        "preparedOn": "2026-07-20",
        "versionLabel": config["versionLabel"],
        "method": (
            "Independently prepared from the pinned controlling source-language "
            "text with automated first-draft assistance, followed by project "
            "terminology normalization, manual correction of identified defects, "
            "and structural, locator, source-language-residue, and numeric-citation "
            "quality checks. It is not a certified or official translation."
        ),
        "rights": {
            "redistributable": True,
            "license": "CC BY 4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "attribution": "Compliance Compass contributors",
            "basis": (
                "The English wording is project-authored editorial material and "
                "is not copied from a proprietary or commercial translation."
            ),
        },
        "qualityAssurance": {
            "unitCount": len(units),
            "paragraphCount": sum(len(unit["paragraphs"]) for unit in units),
            "sourceParagraphOrderPreserved": True,
            "sourceLanguageResidueCheck": True,
            "locatorAndListMarkerCheck": True,
            "numericCitationParityCheck": config["instrumentId"]
            == "br-pl-2338-2023-ai-bill",
            "knownPlaceholderAndMachineArtifactCheck": True,
            "professionalTranslatorCertification": False,
        },
        "units": units,
    }
    payload["manifestContentSha256"] = digest(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    )
    config["output"].write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"wrote {len(units)} units / "
        f"{sum(len(unit['paragraphs']) for unit in units)} paragraphs to "
        f"{config['output'].relative_to(ROOT)}"
    )


def main() -> None:
    for config in CONFIGS:
        build(config)


if __name__ == "__main__":
    main()
