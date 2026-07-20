#!/usr/bin/env python3
"""Attach complete nonofficial English references to Vietnam's current PDP regime.

The official Vietnamese text and its pinned hashes remain unchanged and
controlling.  The English view is a machine-assisted, project-authored research
reference.  It is generated from paragraph-aligned draft catalogues, then
deterministically post-edited for defined terms, legal titles and list markers.
It is not an issuing-authority translation and has no legal effect.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "v2"
AS_OF = "2026-07-20"
SCRIPT_VERSION = "1.2.0"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
MANIFEST_PATH = DATA / "vn-current-personal-data-regime-project-english-manifest.json"
FOREIGN_AUDIT_PATH = DATA / "foreign-english-corpus-audit.json"
HANDOFF_PATH = DATA / "legal-corpus-handoff-vietnam.json"


LAW_TITLES = {
    1: "Scope and Subjects of Application",
    2: "Interpretation",
    3: "Principles of Personal Data Protection",
    4: "Rights and Obligations of Personal Data Subjects",
    5: "Application of Laws on Personal Data Protection",
    6: "International Cooperation on Personal Data Protection",
    7: "Prohibited Acts",
    8: "Handling Violations of Personal Data Protection Law",
    9: "Consent of Personal Data Subjects",
    10: "Requests to Withdraw Consent and Restrict Personal Data Processing",
    11: "Collection, Analysis and Aggregation of Personal Data",
    12: "Encryption and Decryption of Personal Data",
    13: "Rectification of Personal Data",
    14: "Erasure, Destruction and De-identification of Personal Data",
    15: "Provision of Personal Data",
    16: "Disclosure of Personal Data",
    17: "Transfer of Personal Data",
    18: "Other Personal Data Processing Activities",
    19: "Processing Personal Data Without the Personal Data Subject's Consent",
    20: "Cross-Border Transfer of Personal Data",
    21: "Personal Data Processing Impact Assessment",
    22: "Updating Personal Data Processing and Cross-Border Transfer Impact Assessment Dossiers",
    23: "Notification of Violations of Personal Data Protection Regulations",
    24: "Protection of the Personal Data of Children and Persons with Impaired Civil-Act Capacity or Cognition and Behavior Control",
    25: "Personal Data Protection in Recruitment and Workforce Management and Use",
    26: "Personal Data Protection for Health Information and Insurance Business Activities",
    27: "Personal Data Protection in Finance, Banking and Credit Information Activities",
    28: "Personal Data Protection in Advertising-Service Business",
    29: "Personal Data Protection on Social-Media Platforms and Online Communication Services",
    30: "Personal Data Protection in Big Data, Artificial Intelligence, Blockchain, Metaverse and Cloud Computing",
    31: "Personal Data Protection for Location and Biometric Data",
    32: "Personal Data Obtained from Audio and Video Recording in Public Places and at Public Activities",
    33: "Personal Data Protection Forces",
    34: "Technical Standards and Regulations on Personal Data Protection",
    35: "Inspection of Personal Data Protection Activities",
    36: "State-Management Responsibilities for Personal Data Protection",
    37: "Responsibilities of Personal Data Controllers, Processors, and Controllers and Processors",
    38: "Entry into Force",
    39: "Transitional Provisions",
}


DECREE_TITLES = {
    1: "Scope",
    2: "Subjects of Application",
    3: "Categories of Basic Personal Data",
    4: "Categories of Sensitive Personal Data",
    5: "Exercise of the Rights of Personal Data Subjects",
    6: "Methods for Expressing the Consent of Personal Data Subjects",
    7: "Transfer of Personal Data",
    8: "Personal Data Protection in Finance, Banking and Credit Information Activities",
    9: "Personal Data Protection in Big Data Processing",
    10: "Personal Data Protection in Artificial Intelligence Systems and the Metaverse",
    11: "Personal Data Protection in Blockchain Technology",
    12: "Personal Data Protection in Cloud Computing",
    13: "Requirements for Personal Data Protection Personnel and Units in Agencies and Organizations",
    14: "Duties of Personal Data Protection Personnel and Units in Agencies and Organizations",
    15: "Individuals Providing Personal Data Protection Services",
    16: "Organizations Providing Personal Data Protection Services",
    17: "Cross-Border Transfer of Personal Data",
    18: "Requirements, Sequence, Procedures and Contents of Cross-Border Transfer Impact Assessment Dossiers",
    19: "Requirements, Sequence, Procedures and Contents of Personal Data Processing Impact Assessment Dossiers",
    20: "Updating Personal Data Processing and Cross-Border Transfer Impact Assessment Dossiers",
    21: "Personal Data Processing Services",
    22: "Requirements for Providers of Personal Data Processing Services",
    23: "Responsibilities of Providers of Personal Data Processing Services",
    24: "Authority to Issue, Reissue, Replace and Revoke Certificates of Eligibility to Provide Personal Data Processing Services",
    25: "Dossiers, Sequence and Procedures for Issuing Certificates of Eligibility to Provide Personal Data Processing Services",
    26: "Dossiers, Sequence and Procedures for Reissuing or Replacing Certificates of Eligibility to Provide Personal Data Processing Services",
    27: "Revocation of Certificates of Eligibility to Provide Personal Data Processing Services",
    28: "Contents of a Notice of a Violation of Personal Data Protection Regulations",
    29: "Notice of a Violation Involving Location or Biometric Data",
    30: "Responsibilities for International Cooperation on Personal Data Protection",
    31: "Inspection of Personal Data Protection Activities",
    32: "Research and Development of Personal Data Protection Solutions",
    33: "Contents of State Management of Personal Data Protection",
    34: "Responsibilities of the Ministry of Public Security",
    35: "Responsibilities of the Ministry of National Defence",
    36: "Responsibilities of the Ministry of Science and Technology",
    37: "Responsibilities of Ministries, Ministerial-Level Agencies and Government-Attached Agencies",
    38: "Responsibilities of Provincial and Centrally Governed Municipal People's Committees",
    39: "Specialized Personal Data Protection Agency and National Portal for Personal Data Protection",
    40: "Funding for Personal Data Protection Activities",
    41: "Application of Clauses 2 and 3 of Article 38 of the Law on Personal Data Protection",
    42: "Entry into Force and Implementation Responsibilities",
}


FORM_TITLES = {
    "01a": "Notice of Submission of a Cross-Border Personal Data Transfer Impact Assessment Dossier by an Organization",
    "01b": "Notice of Submission of a Cross-Border Personal Data Transfer Impact Assessment Dossier by an Individual",
    "02a": "Notice of Submission of a Personal Data Processing Impact Assessment Dossier by an Organization",
    "02b": "Notice of Submission of a Personal Data Processing Impact Assessment Dossier by an Individual",
    "03a": "Notice of an Update to an Impact Assessment Dossier by an Organization",
    "03b": "Notice of an Update to an Impact Assessment Dossier by an Individual",
    "04": "Application for a Certificate of Eligibility to Provide Personal Data Processing Services",
    "05": "Decision Issuing a Certificate of Eligibility to Provide Personal Data Processing Services",
    "06": "Application to Reissue or Replace a Certificate of Eligibility to Provide Personal Data Processing Services",
    "07": "Decision Revoking a Certificate of Eligibility to Provide Personal Data Processing Services",
    "08": "Notice of a Violation of Personal Data Protection Regulations",
    "09": "Cross-Border Personal Data Transfer Impact Assessment Report",
    "10": "Personal Data Processing Impact Assessment Report",
}


TARGETED_PARAGRAPH_REPAIRS = {
    # Law No. 91/2025/QH15: source-checked legal-semantic repairs.  Paragraph
    # indexes remain locked to the signed Vietnamese text.
    ("vn-pdpl-2025-art-2", 6): "5. A Personal Data Subject is the person to whom the personal data relates.",
    ("vn-pdpl-2025-art-14", 9): "3. In the cases specified in Clause 1 of this Article, the Personal Data Controller or Personal Data Controller and Processor shall erase or destroy personal data, or shall require the Personal Data Processor or Third Party to erase or destroy the Personal Data Subject's personal data. Erasure and destruction must be carried out using secure measures that prevent unauthorized access to, and restoration of, erased or destroyed personal data.",
    ("vn-pdpl-2025-art-15", 3): "a) Provide personal data to the Personal Data Subject, at that subject's request, in accordance with law and any agreement with the Personal Data Subject, unless doing so could harm national defence, national security, or social order and safety, or infringe another person's life, health or property;",
    ("vn-pdpl-2025-art-24", 1): "1. The personal data of children, persons who lack or have limited civil act capacity, and persons who have difficulty in cognition or controlling their behavior shall be protected in accordance with this Law.",
    ("vn-pdpl-2025-art-24", 3): "3. Processing of the personal data of children, persons who lack or have limited civil act capacity, and persons who have difficulty in cognition or controlling their behavior shall cease in the following cases:",
    ("vn-pdpl-2025-art-25", 2): "a) A recruiting agency, organization or individual may request only information serving its recruitment purposes and consistent with law. Information provided may be used only for recruitment and for any other purpose agreed in accordance with law;",
    ("vn-pdpl-2025-art-26", 6): "4. Where an enterprise engaged in reinsurance or ceding reinsurance transfers personal data to a partner, that transfer must be clearly stated in its contract with the customer.",
    ("vn-pdpl-2025-art-27", 6): "2. Organizations and individuals conducting credit-information activities shall comply with this Law; apply measures to prevent unauthorized access to, use, disclosure or alteration of customers' personal data; maintain solutions for restoring customers' personal data if they are lost; and protect confidentiality while collecting, providing and processing customers' personal data for credit-information assessment.",
    ("vn-pdpl-2025-art-29", 6): "5. Do not listen in on, intercept or record calls, or read text messages, without the Personal Data Subject's consent, unless otherwise provided by law;",
    ("vn-pdpl-2025-art-31", 5): "b) Providers of mobile-application platforms shall notify users of their use of personal location data; take measures to prevent unrelated organizations and individuals from collecting personal location data; and provide users with personal-location tracking options.",
    # Final punctuation-and-coordination pass.  These overrides remove
    # machine-draft sentence fragments that began with an unexplained capital
    # after a semicolon while preserving the Vietnamese source's modality.
    ("vn-pdpl-2025-art-8", 1): "1. Organizations and individuals that violate this Law or other law relating to personal data protection may, depending on the nature, severity and consequences of the violation, be administratively penalized or prosecuted for criminal liability; if they cause damage, they must pay compensation in accordance with law.",
    ("vn-pdpl-2025-art-8", 3): "3. The maximum administrative fine for buying or selling personal data is ten times the revenue derived from the violation; if no revenue was derived from the violation, or if the revenue-based fine is lower than the maximum fine specified in Clause 5 of this Article, the fine specified in Clause 5 applies.",
    ("vn-pdpl-2025-art-8", 4): "4. The maximum administrative fine for an organization's violation of the rules on cross-border personal data transfer is 5% of that organization's revenue for the immediately preceding year; if it had no revenue in the immediately preceding year, or if the revenue-based fine is lower than the maximum fine specified in Clause 5 of this Article, the fine specified in Clause 5 applies.",
    ("vn-pdpl-2025-art-8", 6): "6. The maximum fines specified in Clauses 3, 4 and 5 of this Article apply to organizations; for an individual committing the same violation, the maximum fine is one-half of the fine applicable to an organization.",
    ("vn-pdpl-2025-art-12", 1): "1. Encryption of personal data is the conversion of personal data into a form that is unintelligible unless decrypted; encrypted personal data remain personal data.",
    ("vn-pdpl-2025-art-28", 3): "3. Processing customers' personal data to provide advertising services requires the customers' consent, given with clear knowledge of the content, method, form and frequency of product promotion; the advertising-service provider must provide customers with a means of refusing advertising information.",
    ("vn-pdpl-2025-art-28", 10): "b) A means must be established that allows Personal Data Subjects to refuse data sharing; a retention period must be determined; and the data must be erased or destroyed when no longer necessary.",
    ("vn-pdpl-2025-art-29", 2): "1. Clearly notify Personal Data Subjects of the personal data collected when they install and use a social network or online communication service; do not collect personal data unlawfully or beyond the scope agreed with the customer;",
    ("vn-pdpl-2025-art-29", 7): "6. Publish a privacy policy that clearly explains how personal data are collected, used and shared; provide users with mechanisms for accessing, rectifying and erasing data, setting privacy preferences for personal data, and reporting security and privacy violations; protect Vietnamese citizens' personal data in cross-border transfers; and establish a rapid and effective procedure for handling personal data protection violations.",
    ("vn-pdpl-2025-art-30", 3): "3. Systems and services using big data, artificial intelligence, blockchain, the metaverse or cloud computing must incorporate appropriate personal data security measures and must use appropriate authentication, identification and access-control methods when processing personal data.",
    ("vn-pdpl-2025-art-14", 8): "2. A request by a Personal Data Subject to erase or destroy personal data shall not be carried out in the cases specified in Article 19 of this Law or where the erasure or destruction would violate Clause 3 of Article 4 of this Law.",
    ("vn-pdpl-2025-art-19", 2): "a) Where urgently necessary to protect the life, health, honor, dignity, or lawful rights and interests of the Personal Data Subject or another person; or where necessary to protect the lawful rights or interests of the processing party or another person, or the interests of the State or an agency or organization, against infringement. The Personal Data Controller, Personal Data Processor, Personal Data Controller and Processor, or Third Party bears the burden of proving that this case applies;",
    ("vn-pdpl-2025-art-39", 1): "1. Personal data processing already under way before this Law takes effect, for which the Personal Data Subject gave consent or the parties reached an agreement in accordance with Government Decree No. 13/2023/ND-CP of 17 April 2023, may continue without obtaining consent or reaching agreement again.",
    ("vn-pdpl-2025-art-39", 2): "2. A Personal Data Processing Impact Assessment Dossier or Overseas Personal Data Transfer Impact Assessment Dossier prepared under Government Decree No. 13/2023/ND-CP of 17 April 2023 and received by the Specialized Personal Data Protection Agency before this Law takes effect may continue to be used; a new Personal Data Processing Impact Assessment Dossier or Cross-Border Personal Data Transfer Impact Assessment Dossier need not be prepared under this Law. Any update to such a dossier after this Law takes effect must comply with this Law.",
    ("vn-decree-356-2025-art-41", 1): "1. For five years from the date on which the Law on Personal Data Protection takes effect, small enterprises and startups may choose whether to comply with Articles 21 and 22 and Clause 2 of Article 33 of that Law. This option does not apply to a small enterprise or startup that provides personal data processing services, directly processes sensitive personal data, or processes personal data at a scale of 100,000 or more Personal Data Subjects, calculated cumulatively by the total volume of personal data processed.",
    ("vn-decree-356-2025-art-41", 2): "2. Business households and microenterprises are not required to comply with Articles 21 and 22 and Clause 2 of Article 33 of the Law on Personal Data Protection. This exemption does not apply to a business household or microenterprise that provides personal data processing services, directly processes sensitive personal data, or processes personal data at a scale of 100,000 or more Personal Data Subjects, calculated cumulatively by the total volume of personal data processed.",
    ("vn-decree-356-2025-art-5", 1): "1. A Personal Data Controller and a Personal Data Controller and Processor shall establish clear processes, procedures and forms for exercising the rights of Personal Data Subjects that are appropriate to the personal data processing activities and the responsibilities of the relevant units; they shall ensure that Personal Data Subjects are informed of the procedures for exercising the rights specified in Clause 1 of Article 4 of the Law on Personal Data Protection.",
    ("vn-decree-356-2025-art-5", 2): "2. Upon receiving, in accordance with the applicable procedure, a Personal Data Subject's request to withdraw consent, restrict personal data processing or object to personal data processing, the Personal Data Controller or Personal Data Controller and Processor shall respond within 02 working days, provide the Personal Data Subject with complete information on the procedure for ceasing processing, and cease processing within 15 days, except where processing does not require consent under Article 19 of the Law on Personal Data Protection. Where the Personal Data Processor or a Third Party must be required to cease processing the Personal Data Subject's personal data, that cessation shall be completed within 20 days.",
    ("vn-decree-356-2025-art-5", 3): "Depending on the nature and complexity of the request, the processing period may be extended once for no more than 15 days. The Personal Data Controller or Personal Data Controller and Processor shall notify the Personal Data Subject of the reason and bears the burden of proving that the extension is necessary and reasonable.",
    ("vn-decree-356-2025-art-5", 4): "3. Upon receiving, in accordance with the applicable procedure, a Personal Data Subject's request to view or rectify, request rectification of, or obtain personal data, the Personal Data Controller or Personal Data Controller and Processor shall respond within 02 working days, provide the Personal Data Subject with complete information on the procedure, and implement the request within 10 days. Where the Personal Data Processor or a Third Party must be required to rectify the Personal Data Subject's personal data, the rectification shall be completed within 15 days.",
    ("vn-decree-356-2025-art-5", 5): "Depending on the nature and complexity of the request, the processing period may be extended once for no more than 10 days. The Personal Data Controller or Personal Data Controller and Processor shall notify the Personal Data Subject of the reason and bears the burden of proving that the extension is necessary and reasonable.",
    ("vn-decree-356-2025-art-5", 6): "4. Upon receiving, in accordance with the applicable procedure, a Personal Data Subject's request to erase personal data, the Personal Data Controller or Personal Data Controller and Processor shall respond within 02 working days, provide the Personal Data Subject with complete information on the procedure, and implement the request within 20 days. Where the Personal Data Processor or a Third Party must be required to provide or erase data, or restrict the processing of data, concerning the Personal Data Subject, that action shall be completed within 30 days.",
    ("vn-decree-356-2025-art-5", 7): "Depending on the nature and complexity of the request, the processing period may be extended once for no more than 20 days. The Personal Data Controller or Personal Data Controller and Processor shall notify the Personal Data Subject of the reason and bears the burden of proving that the extension is necessary and reasonable.",
    ("vn-decree-356-2025-art-5", 8): "5. Upon receiving, in accordance with the applicable procedure, a Personal Data Subject's request for measures or solutions to protect their personal data, the competent authority or the agency, organization or individual involved in the processing shall respond within 02 working days, provide the Personal Data Subject with complete information on the procedure, and implement the request within 15 days.",
    ("vn-decree-356-2025-art-5", 9): "Depending on the nature and complexity of the request, the processing period may be extended once for no more than 15 days. The Personal Data Controller or Personal Data Controller and Processor shall notify the Personal Data Subject of the reason and bears the burden of proving that the extension is necessary and reasonable.",
    ("vn-decree-356-2025-art-8", 2): "2. When obtaining consent from a Personal Data Subject, an organization or individual operating in finance, banking or credit information activities as a Personal Data Controller or Personal Data Controller and Processor must clearly state:",
    ("vn-decree-356-2025-art-1", 1): "This Decree provides detailed rules for Clauses 2 and 3 of Article 2; Clause 5 of Article 4; Clause 3 of Article 6; Clause 5 of Article 9; Clause 3 of Article 17; Clause 7 of Article 20; Clause 7 of Article 21; Clause 4 of Article 22; Clause 5 of Article 23; Clause 3 of Article 27; Clause 6 of Article 30; Point b of Clause 4 of Article 31; Clause 3 of Article 33; Article 35; and Clause 4 of Article 38 of the Law on Personal Data Protection. It also provides measures for implementing that Law in relation to research and development of personal data protection solutions, the Specialized Personal Data Protection Agency, the National Portal for Personal Data Protection, responsibilities of ministries, sectors and local authorities for personal data protection, and funding for personal data protection activities.",
    ("vn-decree-356-2025-art-4", 11): "k) Bank-account usernames and access passwords; bank-card information and bank-account transaction-history data; and customers' financial and credit information and information about their financial, securities and insurance activities and transaction histories at credit institutions, foreign bank branches, payment-intermediary service providers, securities and insurance organizations, and other authorized organizations;",
    ("vn-decree-356-2025-art-7", 17): "4. Where personal data are shared between units within the same agency or organization for processing consistent with the established purpose, the agency or organization must establish a process for controlling the sharing and use of personal data in accordance with law and must take measures to prevent its internal personnel from unlawfully sharing personal data with Third Parties.",
    ("vn-decree-356-2025-art-8", 1): "1. Organizations and individuals operating in finance, banking or credit information activities are responsible for applying standards and technical regulations on personal data protection; technical regulations on de-identification and anonymization of personal data shall be promulgated and applied in Vietnam; those organizations and individuals shall assess compliance with personal data protection rules once each year and keep logs of all personal data processing activities.",
    ("vn-decree-356-2025-art-9", 11): "b) Use strong authentication appropriate to the sensitivity of the personal data, requiring, at a minimum, multifactor authentication (a password, a PIN combined with a one-time password, a digital-signature device or a biometric factor); and assign access permissions so that only authorized persons can access personal data;",
    ("vn-decree-356-2025-art-10", 7): "b) Establish a mechanism for monitoring the operation of the artificial intelligence system in two respects: supervision by competent state authorities; and accountability of the Personal Data Controller or Personal Data Controller and Processor to Personal Data Subjects.",
    ("vn-decree-356-2025-art-12", 3): "a) State clearly in the contract that Vietnamese personal data protection law must be complied with; provide information on the personal data protection unit and personnel; and comply with legal requirements for administrative procedures relating to personal data protection;",
    ("vn-decree-356-2025-art-15", 6): "3. Agencies and organizations wishing to hire individuals to provide personal data protection services shall assess whether they meet the capability requirements in Clause 2 of this Article, enter into a contract for personal data protection personnel, and disclose information about those personnel to Personal Data Subjects and relevant parties.",
    ("vn-decree-356-2025-art-16", 5): "2. Organizations providing personal data protection services must prepare capability profiles demonstrating their ability to protect personal data and provide them to agencies and organizations wishing to use the services. Each profile must state the profession and business sector; the scale, scope and experience of service provision; the service-provision policy; applicable standards, qualifications and personnel capabilities; and relevant supporting documents.",
    ("vn-decree-356-2025-art-18", 8): "b) Contact details for the personal data protection unit or personnel, and for any organization or individual providing personal data protection services, of the cross-border personal data transferor and recipient;",
    ("vn-decree-356-2025-art-18", 15): "i) An assessment of the level of personal data protection afforded by the recipient; the impact and risks of cross-border transfer and processing; possible unintended consequences and damage; and measures to mitigate or eliminate those threats and risks.",
    ("vn-decree-356-2025-art-19", 13): "g) An assessment of the impact and risks of personal data processing; possible unintended consequences and damage; and measures to mitigate or eliminate those threats and risks.",
    ("vn-decree-356-2025-art-21", 6): "6. Personal data analysis and mining services, including the use of analytical tools to identify information, trends and patterns in personal data and the application of data-mining methods to derive value from personal data, predict user behavior or optimize services.",
    ("vn-decree-356-2025-art-26", 3): "b) Within 05 working days after receiving a compliant application, the Specialized Personal Data Protection Agency shall consider it and reissue the Certificate of Eligibility to Provide Personal Data Processing Services; if the Agency refuses to reissue the Certificate, it must give written notice clearly stating the reason.",
    ("vn-decree-356-2025-art-26", 5): "a) The dossier consists of an application using Form No. 06 in the Appendix to this Decree and documents proving that information in the issued Certificate is incorrect or that its contents have changed.",
    ("vn-decree-356-2025-art-29", 11): "e) Contact details of the personal data protection unit or personnel, or of the organization or individual providing personal data protection services, and of the unit within the organization that receives and handles personal data incidents.",
    ("vn-decree-356-2025-art-33", 1): "1. Promulgate legal instruments on personal data protection within its authority, or submit them to competent state authorities for promulgation; and organize the implementation of personal data protection law.",
    ("vn-decree-356-2025-art-33", 8): "8. Conduct preliminary and final reviews and scientific research on personal data protection; and research and apply scientific and technological advances in personal data protection.",
    ("vn-decree-356-2025-art-34", 4): "4. Take the lead and coordinate with the Ministry of Science and Technology in developing standards and technical regulations on personal data protection; technical regulations on de-identification and anonymization of personal data shall be promulgated and applied in Vietnam.",
    ("vn-decree-356-2025-art-34", 8): "8. Promote scientific research on personal data protection; and research and apply scientific and technological advances in personal data protection to innovate in the field.",
    ("vn-decree-356-2025-art-35", 2): "2. Within the assigned functions and duties, take the lead and coordinate with the Ministry of Public Security in evaluating personal data protection results for agencies, organizations and individuals under its management; promote the application of personal data protection measures; research and apply advanced security technologies in processing and protecting personal data for national-defence activities; and conduct international cooperation on personal data protection within its area of management in accordance with law.",
    ("vn-decree-356-2025-art-36", 1): "1. Coordinate with the Ministry of Public Security in developing standards and technical regulations on personal data protection; technical regulations on de-identification and anonymization of personal data shall be promulgated and applied in Vietnam.",
    ("vn-decree-356-2025-art-37", 4): "4. Arrange personal data protection personnel and units within the units under its management, and ensure that their capabilities match the relevant job positions and professional personal data protection requirements in accordance with law.",
    ("vn-decree-356-2025-art-38", 3): "3. Arrange personal data protection personnel and units within the units under its management, and ensure that capability requirements are satisfied and are appropriate to the relevant job positions and professional personal data protection requirements in accordance with law.",
    ("vn-decree-356-2025-art-38", 6): "6. Organize training to strengthen the capacity of personnel engaged in personal data protection at each administrative level; and integrate personal data protection content into administrative-reform and digital-transformation programs.",
    ("vn-decree-356-2025-art-40", 1): "1. Funding for personal data protection activities comprises State budget funds; support from domestic and foreign agencies, organizations and individuals; revenue from providing personal data protection services; international aid; and other lawful revenue.",
    # Decree No. 356/2025/ND-CP: source-checked Articles 9-42.
    ("vn-decree-356-2025-art-9", 12): "c) Encrypt and anonymize personal data (by separating data that identify a specific person for separate storage and security, so that the personal data used for processing after that process cannot identify a specific person) when transferring or providing personal data, unless specialized law provides otherwise or the processing requires plaintext data for crime prevention and control, anti-money laundering, national security, or the handling of customer complaints and disputes. In those cases, the agency or organization must apply additional security measures to ensure that personal data are not accessed or used unlawfully;",
    ("vn-decree-356-2025-art-18", 19): "6. If the dossier is incomplete or noncompliant, the Specialized Personal Data Protection Agency shall assess it and require the cross-border personal data transferor to complete the Cross-Border Personal Data Transfer Impact Assessment Dossier within 30 days. If the transferor fails to complete the dossier in accordance with law, the Specialized Personal Data Protection Agency shall consider applying the rules on administrative penalties in the field of personal data protection.",
    ("vn-decree-356-2025-art-18", 20): "7. The cross-border personal data transferor shall update and supplement its Cross-Border Personal Data Transfer Impact Assessment Dossier in accordance with Article 20 of this Decree.",
    ("vn-decree-356-2025-art-19", 2): "2. A Personal Data Processing Impact Assessment Dossier of a Personal Data Controller, Personal Data Controller and Processor, or Personal Data Processor consists of:",
    ("vn-decree-356-2025-art-19", 14): "4. A Personal Data Processing Impact Assessment Dossier must remain available for inspection and assessment by the Specialized Personal Data Protection Agency. Within 60 days after personal data processing begins, one original must be submitted online, in person or by post to that Agency together with Form No. 02a/02b in the Appendix to this Decree.",
    ("vn-decree-356-2025-art-21", 1): "1. Services that provide and operate automated systems or software to process personal data on behalf of a Personal Data Controller or Personal Data Controller and Processor.",
    ("vn-decree-356-2025-art-22", 1): "1. A provider must be an organization or enterprise established and operating under Vietnamese law and must satisfy the conditions specified in this Article.",
    ("vn-decree-356-2025-art-23", 1): "1. Comply fully with the law on personal data protection and with the responsibilities and obligations applicable to a Personal Data Controller and Processor or Personal Data Processor.",
    ("vn-decree-356-2025-art-23", 6): "6. Ensure that personal data are processed for the proper purposes; appropriately limit collection, transfer and storage in accordance with law; and prevent unauthorized access, collection, use or disclosure and similar risks in personal data processing.",
    ("vn-decree-356-2025-art-24", 1): "1. The Ministry of Public Security shall issue, reissue, replace and revoke Certificates of Eligibility to Provide Personal Data Processing Services.",
    ("vn-decree-356-2025-art-24", 2): "2. The Minister of Public Security shall assign the Specialized Personal Data Protection Agency to issue, reissue, replace and revoke Certificates of Eligibility to Provide Personal Data Processing Services in accordance with law.",
    ("vn-decree-356-2025-art-25", 21): "4. Within 30 days after receiving a complete and valid dossier, the Specialized Personal Data Protection Agency shall appraise it, consider it and decide whether to issue a Certificate of Eligibility to Provide Personal Data Processing Services using Form No. 05 in the Appendix to this Decree. The Certificate may be issued in paper or electronic form. A paper copy shall be issued where the dossier was submitted in person or by post, or upon request where it was submitted online through the public-service portal. If the Certificate is not issued, the Agency shall notify the organization in writing and clearly state the reason.",
    ("vn-decree-356-2025-art-26", 4): "2. Replacement applies where information in a Certificate of Eligibility to Provide Personal Data Processing Services is incorrect or its contents change.",
    ("vn-decree-356-2025-art-26", 6): "b) The organization shall submit one dossier online, in person or by post to the Specialized Personal Data Protection Agency. Within 05 working days after receiving a complete dossier specified at Point a of this Clause, the Agency shall consider it and decide whether to replace the Certificate of Eligibility to Provide Personal Data Processing Services. If the Certificate is not replaced, the Agency must give written notice clearly stating the reason.",
    ("vn-decree-356-2025-art-28", 6): "2. The Personal Data Controller, Personal Data Controller and Processor, Personal Data Processor, or Third Party shall submit notice of a violation of personal data protection regulations to the Specialized Personal Data Protection Agency, or through the National Portal for Personal Data Protection, using Form No. 08 in the Appendix to this Decree.",
    ("vn-decree-356-2025-art-31", 1): "1. Inspections of personal data protection activities shall be conducted on a routine or ad hoc basis in the following cases:",
    ("vn-decree-356-2025-art-31", 4): "c) As part of state management in accordance with law.",
    ("vn-decree-356-2025-art-31", 5): "2. Entities subject to inspection of personal data protection activities include:",
    ("vn-decree-356-2025-art-31", 8): "c) Agencies, organizations and individuals required to conduct a Personal Data Processing Impact Assessment and a Cross-Border Personal Data Transfer Impact Assessment;",
    ("vn-decree-356-2025-art-34", 7): "7. Evaluate, conduct preliminary reviews of, and conduct final reviews of the results of personal data protection work by relevant agencies, organizations and individuals.",
    ("vn-decree-356-2025-art-39", 2): "2. The National Portal for Personal Data Protection provides information publicizing the Party's positions, guidelines and policies and State law on personal data protection; provides guidance and helps agencies, organizations and individuals raise their awareness and skills concerning personal data protection; receives and processes feedback and petitions from relevant agencies, organizations and individuals; and performs other activities in accordance with personal data protection law.",
    ("vn-decree-356-2025-art-42", 2): "2. Government Decree No. 13/2023/ND-CP of 17 April 2023 on personal data protection ceases to have effect on the date this Decree takes effect.",
    ("vn-decree-356-2025-art-42", 5): "Where core data or important data that are personal data are transferred or processed across borders, the owner of the core data or important data shall prepare a Personal Data Processing Impact Assessment Dossier and a Cross-Border Personal Data Transfer Impact Assessment Dossier in accordance with personal data protection law; the owner is not required to conduct the risk assessment or the impact assessment of cross-border data transfer and processing prescribed by this Decree.\u201d",
    ("vn-pdpl-2025-art-4", 19): "The Government shall provide detailed regulations for this Clause.",
    ("vn-pdpl-2025-art-22", 7): "4. The Government shall provide detailed regulations for this Article.",

    # Forms 01a-03b: repair semantics split across Gazette table lines.
    ("vn-decree-356-2025-form-01a", 9): "SUBMISSION OF A CROSS-BORDER PERSONAL DATA TRANSFER",
    ("vn-decree-356-2025-form-01a", 10): "IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-01a", 13): "To comply with personal data protection regulations, ………………1",
    ("vn-decree-356-2025-form-01a", 14): "hereby submits to the",
    ("vn-decree-356-2025-form-01a", 15): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Cross-Border Personal Data Transfer Impact Assessment",
    ("vn-decree-356-2025-form-01a", 16): "Dossier, as follows:",
    ("vn-decree-356-2025-form-01a", 22): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-01a", 23): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-01a", 24): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-01a", 27): "- Personal data protection unit or personnel, or organization or individual providing",
    ("vn-decree-356-2025-form-01a", 28): "personal data protection services to the transferring party:…………………..",
    ("vn-decree-356-2025-form-01a", 35): "2. Cross-Border Personal Data Transfer Impact Assessment Dossier (including",
    ("vn-decree-356-2025-form-01a", 36): "forms, documents, written materials and accompanying images)",
    ("vn-decree-356-2025-form-01a", 41): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-01a", 42): "of the Cross-Border Personal Data Transfer Impact Assessment Dossier and",
    ("vn-decree-356-2025-form-01a", 43): "the attached materials, and undertakes to comply fully with law.",
    ("vn-decree-356-2025-form-01a", 47): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-01a", 48): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-01a", 33): "Footnote 1:",
    ("vn-decree-356-2025-form-01a", 49): "Footnote 2:",
    ("vn-decree-356-2025-form-01b", 6): "SUBMISSION OF A CROSS-BORDER PERSONAL DATA TRANSFER",
    ("vn-decree-356-2025-form-01b", 7): "IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-01b", 10): "To comply with personal data protection regulations, I hereby submit to the",
    ("vn-decree-356-2025-form-01b", 11): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Cross-Border Personal Data Transfer Impact Assessment",
    ("vn-decree-356-2025-form-01b", 12): "Dossier, as follows:",
    ("vn-decree-356-2025-form-01b", 14): "- Full name: ………………………….………………………………..…..",
    ("vn-decree-356-2025-form-01b", 21): "2. Cross-Border Personal Data Transfer Impact Assessment Dossier (including",
    ("vn-decree-356-2025-form-01b", 22): "forms, documents, written materials and accompanying images)",
    ("vn-decree-356-2025-form-01b", 26): "I undertake responsibility for the accuracy and lawfulness of the changed",
    ("vn-decree-356-2025-form-01b", 27): "contents and attached materials, and undertake to comply fully with",
    ("vn-decree-356-2025-form-01b", 28): "law.",
    ("vn-decree-356-2025-form-01b", 30): "(Signature and full name)",
    ("vn-decree-356-2025-form-02a", 9): "SUBMISSION OF A PERSONAL DATA PROCESSING IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-02a", 12): "To comply with personal data protection regulations, ………………2",
    ("vn-decree-356-2025-form-02a", 13): "hereby submits to the",
    ("vn-decree-356-2025-form-02a", 14): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Personal Data Processing Impact Assessment",
    ("vn-decree-356-2025-form-02a", 15): "Dossier, as follows:",
    ("vn-decree-356-2025-form-02a", 21): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-02a", 22): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-02a", 23): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-02a", 27): "- Personal data protection unit or personnel, or organization or individual providing",
    ("vn-decree-356-2025-form-02a", 28): "personal data protection services:……………………….............................................",
    ("vn-decree-356-2025-form-02a", 35): "2. Personal Data Processing Impact Assessment Dossier (including",
    ("vn-decree-356-2025-form-02a", 36): "forms, documents, written materials and accompanying images)",
    ("vn-decree-356-2025-form-02a", 41): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-02a", 42): "of the Personal Data Processing Impact Assessment Dossier and attached materials,",
    ("vn-decree-356-2025-form-02a", 43): "and undertakes to comply fully with law.",
    ("vn-decree-356-2025-form-02a", 47): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-02a", 48): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-02a", 33): "Footnote 2:",
    ("vn-decree-356-2025-form-02a", 49): "Footnote 2:",
    ("vn-decree-356-2025-form-02b", 6): "SUBMISSION OF A PERSONAL DATA PROCESSING IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-02b", 9): "To comply with personal data protection regulations, I hereby submit to the",
    ("vn-decree-356-2025-form-02b", 10): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Personal Data Processing Impact Assessment Dossier,",
    ("vn-decree-356-2025-form-02b", 13): "- Full name: ………………………………………..…..",
    ("vn-decree-356-2025-form-02b", 20): "2. Personal Data Processing Impact Assessment Dossier (including",
    ("vn-decree-356-2025-form-02b", 21): "forms, documents, written materials and accompanying images)",
    ("vn-decree-356-2025-form-02b", 25): "I undertake responsibility for the accuracy and lawfulness of the changed",
    ("vn-decree-356-2025-form-02b", 26): "contents and attached materials, and undertake to comply fully with",
    ("vn-decree-356-2025-form-02b", 27): "law.",
    ("vn-decree-356-2025-form-02b", 29): "(Signature and full name)",
    ("vn-decree-356-2025-form-03a", 9): "NOTICE OF CHANGE TO DOSSIER CONTENTS ……3",
    ("vn-decree-356-2025-form-03a", 12): "To comply with personal data protection regulations, ………………4",
    ("vn-decree-356-2025-form-03a", 13): "hereby submits to the",
    ("vn-decree-356-2025-form-03a", 14): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Personal Data Processing Impact Assessment",
    ("vn-decree-356-2025-form-03a", 15): "Dossier, as follows:",
    ("vn-decree-356-2025-form-03a", 20): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-03a", 21): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-03a", 22): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-03a", 30): "2. Brief description of changes to dossier contents",
    ("vn-decree-356-2025-form-03a", 34): "Dossier title: Personal Data Processing Impact Assessment Dossier or Overseas Personal Data Transfer Impact Assessment",
    ("vn-decree-356-2025-form-03a", 35): "Dossier.",
    ("vn-decree-356-2025-form-03a", 43): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-03a", 44): "of the changed contents and attached materials, and undertakes to comply fully with",
    ("vn-decree-356-2025-form-03a", 45): "law.",
    ("vn-decree-356-2025-form-03a", 49): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-03a", 50): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-03a", 33): "Footnote 3:",
    ("vn-decree-356-2025-form-03a", 36): "Footnote 4:",
    ("vn-decree-356-2025-form-03a", 51): "Footnote 3:",
    ("vn-decree-356-2025-form-03b", 5): "NOTICE OF CHANGE TO DOSSIER CONTENTS ……5",
    ("vn-decree-356-2025-form-03b", 8): "To comply with personal data protection regulations, I hereby submit to the",
    ("vn-decree-356-2025-form-03b", 9): "Specialized Personal Data Protection Agency of the Ministry of Public Security a Personal Data Processing Impact Assessment Dossier,",
    ("vn-decree-356-2025-form-03b", 12): "- Full name: ………………………….………………………………..…..",
    ("vn-decree-356-2025-form-03b", 19): "2. Brief description of changes to dossier contents",
    ("vn-decree-356-2025-form-03b", 26): "I undertake responsibility for the accuracy and lawfulness of the changed",
    ("vn-decree-356-2025-form-03b", 27): "contents and attached materials, and undertake to comply fully with",
    ("vn-decree-356-2025-form-03b", 28): "law.",
    ("vn-decree-356-2025-form-03b", 30): "(Signature and full name)",
    ("vn-decree-356-2025-form-03b", 31): "Footnote 5:",
    ("vn-decree-356-2025-form-03b", 32): "Dossier title: Personal Data Processing Impact Assessment Dossier or Cross-Border Personal Data Transfer Impact Assessment",
    ("vn-decree-356-2025-form-03b", 33): "Dossier.",

    # Forms 04-08: legal headings, certificate terms and line-wrapped clauses.
    ("vn-decree-356-2025-form-04", 7): "APPLICATION FOR A CERTIFICATE OF ELIGIBILITY",
    ("vn-decree-356-2025-form-04", 8): "TO PROVIDE PERSONAL DATA PROCESSING SERVICES",
    ("vn-decree-356-2025-form-04", 11): "Pursuant to Government Decree No. 356/2025/ND-CP of 31 December 2025",
    ("vn-decree-356-2025-form-04", 12): "detailing a number of articles and measures for implementation of the Law on Personal Data",
    ("vn-decree-356-2025-form-04", 13): "Protection; ………………6",
    ("vn-decree-356-2025-form-04", 14): "hereby submits to the Ministry of Public Security an application for a Certificate of Eligibility",
    ("vn-decree-356-2025-form-04", 15): "to Provide Personal Data Processing Services, as follows:",
    ("vn-decree-356-2025-form-04", 21): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-04", 22): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-04", 23): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-04", 44): "2. List of personal data processing services for which certification is requested",
    ("vn-decree-356-2025-form-04", 45): "No. Service name Scope and field of provision",
    ("vn-decree-356-2025-form-04", 48): "3. Application dossier for issuance of the Certificate",
    ("vn-decree-356-2025-form-04", 56): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-04", 57): "of the application and attached materials, and undertakes to comply fully with",
    ("vn-decree-356-2025-form-04", 58): "law.",
    ("vn-decree-356-2025-form-04", 59): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-04", 60): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-04", 34): "Footnote 6:",
    ("vn-decree-356-2025-form-04", 61): "Footnote 2:",
    ("vn-decree-356-2025-form-05", 7): "CERTIFICATE OF ELIGIBILITY",
    ("vn-decree-356-2025-form-05", 8): "TO PROVIDE PERSONAL DATA PROCESSING SERVICES",
    ("vn-decree-356-2025-form-05", 10): "Pursuant to Government Decree No. 356/2025/ND-CP of 31 December 2025",
    ("vn-decree-356-2025-form-05", 11): "detailing a number of articles and measures for implementation of the Law on Personal Data",
    ("vn-decree-356-2025-form-05", 12): "Protection;",
    ("vn-decree-356-2025-form-05", 13): "Pursuant to Government Decree No. 02/2025/ND-CP of 18 February 2025",
    ("vn-decree-356-2025-form-05", 14): "on the functions, duties, powers and organizational structure of the Ministry of Public Security;",
    ("vn-decree-356-2025-form-05", 15): "Having considered the application dossier for a Certificate of Eligibility to Provide Personal Data Processing Services",
    ("vn-decree-356-2025-form-05", 16): "dated ... [day] ... [month] ... [year] ... submitted by ............. (1);",
    ("vn-decree-356-2025-form-05", 17): "At the proposal of",
    ("vn-decree-356-2025-form-05", 18): "....................................................................................................,",
    ("vn-decree-356-2025-form-05", 19): "HEREBY CERTIFIES:",
    ("vn-decree-356-2025-form-05", 20): "Article 1. ....................... (1)",
    ("vn-decree-356-2025-form-05", 21): "is eligible to provide personal data processing services and",
    ("vn-decree-356-2025-form-05", 22): "has the following information:",
    ("vn-decree-356-2025-form-05", 32): "Article 2. .......................... (1)",
    ("vn-decree-356-2025-form-05", 33): "shall comply with Government Decree",
    ("vn-decree-356-2025-form-05", 34): "No. 356/2025/ND-CP of 31 December 2025 detailing",
    ("vn-decree-356-2025-form-05", 35): "a number of articles and measures for implementation of the Law on Personal Data Protection and with",
    ("vn-decree-356-2025-form-05", 36): "other relevant provisions of law.",
    ("vn-decree-356-2025-form-05", 37): "Article 3. This Certificate of Eligibility to Provide Personal Data Processing Services",
    ("vn-decree-356-2025-form-05", 38): "takes effect on the date of signature.",
    ("vn-decree-356-2025-form-05", 42): "Name of applicant organization.",
    ("vn-decree-356-2025-form-06", 8): "APPLICATION TO REISSUE/REPLACE A CERTIFICATE OF ELIGIBILITY",
    ("vn-decree-356-2025-form-06", 9): "TO PROVIDE PERSONAL DATA PROCESSING SERVICES",
    ("vn-decree-356-2025-form-06", 11): "Pursuant to Government Decree No. 356/2025/ND-CP of 31 December 2025",
    ("vn-decree-356-2025-form-06", 12): "detailing a number of articles and measures for implementation of the Law on Personal Data",
    ("vn-decree-356-2025-form-06", 13): "Protection;",
    ("vn-decree-356-2025-form-06", 14): "Pursuant to Certificate of Eligibility to Provide Personal Data Processing Services",
    ("vn-decree-356-2025-form-06", 15): "No. ............ dated …/…./….. issued by the Department of Cybersecurity and High-Tech Crime",
    ("vn-decree-356-2025-form-06", 16): "Prevention, Ministry of Public Security;",
    ("vn-decree-356-2025-form-06", 18): "hereby submits to the Ministry of Public Security an application to reissue/replace the Certificate",
    ("vn-decree-356-2025-form-06", 19): "of Eligibility to Provide Personal Data Processing Services, as follows:",
    ("vn-decree-356-2025-form-06", 25): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-06", 26): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-06", 27): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-06", 48): "2. Reissuance/replacement requested",
    ("vn-decree-356-2025-form-06", 49): "- Reason for reissuance/replacement of the Certificate:",
    ("vn-decree-356-2025-form-06", 51): "- Contents to be changed in the Certificate:",
    ("vn-decree-356-2025-form-06", 58): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-06", 59): "of the application and attached materials, and undertakes to comply fully with",
    ("vn-decree-356-2025-form-06", 60): "law.",
    ("vn-decree-356-2025-form-06", 61): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-06", 62): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-06", 35): "Footnote 7:",
    ("vn-decree-356-2025-form-06", 63): "Footnote 2:",
    ("vn-decree-356-2025-form-07", 8): "On revocation of a Certificate of Eligibility to Provide",
    ("vn-decree-356-2025-form-07", 9): "Personal Data Processing Services",
    ("vn-decree-356-2025-form-07", 12): "Pursuant to Government Decree No. 356/2025/ND-CP of 31 December 2025",
    ("vn-decree-356-2025-form-07", 13): "detailing a number of articles and measures for implementation of the Law on Personal Data Protection;",
    ("vn-decree-356-2025-form-07", 14): "Pursuant to Government Decree No. 02/2025/ND-CP of 18 February 2025",
    ("vn-decree-356-2025-form-07", 15): "on the functions, duties, powers and organizational structure of the Ministry of Public Security;",
    ("vn-decree-356-2025-form-07", 18): "Article 1. The Certificate of Eligibility to Provide Personal Data Processing Services",
    ("vn-decree-356-2025-form-07", 19): "with the following information is revoked:",
    ("vn-decree-356-2025-form-07", 26): "Article 3. The Department of Cybersecurity and High-Tech Crime",
    ("vn-decree-356-2025-form-07", 27): "Prevention and the organization named in Article 1 are responsible for implementing this Decision.",
    ("vn-decree-356-2025-form-07", 29): "- As provided in Article 3;",
    ("vn-decree-356-2025-form-07", 30): "- Filed by: VT, A05.",
    ("vn-decree-356-2025-form-08", 13): "hereby submits to the",
    ("vn-decree-356-2025-form-08", 14): "Specialized Personal Data Protection Agency of the Ministry of Public Security notice of a violation of personal data protection",
    ("vn-decree-356-2025-form-08", 15): "regulations, as follows:",
    ("vn-decree-356-2025-form-08", 20): "- Establishment Decision/Enterprise Registration Certificate/Business",
    ("vn-decree-356-2025-form-08", 21): "Registration Certificate/Investment Registration Certificate No. ….. issued by …. on …",
    ("vn-decree-356-2025-form-08", 22): "[day] … [month] … [year] … at …",
    ("vn-decree-356-2025-form-08", 33): "- Violation:………………………………………………………………….",
    ("vn-decree-356-2025-form-08", 44): "- Measures applied:………………………………………………………",
    ("vn-decree-356-2025-form-08", 50): "hereby undertakes responsibility for the accuracy and lawfulness",
    ("vn-decree-356-2025-form-08", 51): "of the notice and attached materials, and undertakes to comply fully with",
    ("vn-decree-356-2025-form-08", 52): "law.",
    ("vn-decree-356-2025-form-08", 56): "ON BEHALF OF THE ORGANIZATION OR ENTERPRISE",
    ("vn-decree-356-2025-form-08", 57): "(Signature, full name and seal)",
    ("vn-decree-356-2025-form-08", 35): "Footnote 8:",
    ("vn-decree-356-2025-form-08", 58): "Footnote 2:",
}


# Forms 09 and 10 are wide Gazette tables.  Their PDF reading order deliberately
# stores a table cell across several paragraphs.  These repairs translate each
# fragment in context so the concatenated cells remain meaningful while the
# source paragraph sequence stays exactly aligned.
TARGETED_PARAGRAPH_REPAIRS.update({
    ("vn-decree-356-2025-form-09", 1): "CROSS-BORDER PERSONAL DATA TRANSFER",
    ("vn-decree-356-2025-form-09", 2): "IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-09", 3): "PART A. CROSS-BORDER PERSONAL DATA TRANSFER IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-09", 4): "OF THE TRANSFERRING PARTY",
    ("vn-decree-356-2025-form-09", 5): "I. BASIC INFORMATION ON THE TRANSFERRING PARTY",
    ("vn-decree-356-2025-form-09", 15): "8 Personal data protection unit/personnel of the organization or individual",
    ("vn-decree-356-2025-form-09", 16): "8.1 Organization providing personal data protection services (if any; attach the service-use",
    ("vn-decree-356-2025-form-09", 17): "contract):",
    ("vn-decree-356-2025-form-09", 22): "8.2 Individual providing personal data protection services (if any; attach the service-use",
    ("vn-decree-356-2025-form-09", 23): "contract):",
    ("vn-decree-356-2025-form-09", 24): "No. Full name Employing entity Phone number Email",
    ("vn-decree-356-2025-form-09", 25): "8.3 Internal personal data protection unit/personnel (attach a copy of the",
    ("vn-decree-356-2025-form-09", 26): "decision or document recording the designation or assignment and documents proving satisfaction",
    ("vn-decree-356-2025-form-09", 27): "of the requirements in Government Decree No. 356/2025/ND-CP of 31 December 2025",
    ("vn-decree-356-2025-form-09", 28): "detailing a number of articles and measures for implementation of the Law on Personal Data Protection)",
    ("vn-decree-356-2025-form-09", 29): "Unit name:",
    ("vn-decree-356-2025-form-09", 30): "Unit telephone: Unit email:",
    ("vn-decree-356-2025-form-09", 31): "Name of unit head/personnel: Position:",
    ("vn-decree-356-2025-form-09", 33): "II. CROSS-BORDER PERSONAL DATA TRANSFER ACTIVITIES",
    ("vn-decree-356-2025-form-09", 34): "1 1.1. Transfer of personal data collected and stored in Vietnam to a server",
    ("vn-decree-356-2025-form-09", 35): "system located outside the territory of the Socialist Republic of Vietnam ☐",
    ("vn-decree-356-2025-form-09", 36): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-09", 37): "(Specify each category or group of Personal Data Subjects, such as customers, employees or",
    ("vn-decree-356-2025-form-09", 38): "applicants, and the number in each category as of the filing date)",
    ("vn-decree-356-2025-form-09", 39): "1.2. Store and process personal data using the cloud-computing service of a service",
    ("vn-decree-356-2025-form-09", 40): "provider located abroad ☐",
    ("vn-decree-356-2025-form-09", 41): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-09", 43): "1.3. Collect personal data from individuals using services in Vietnam and",
    ("vn-decree-356-2025-form-09", 44): "transfer it to a platform outside the territory of the Socialist Republic of Vietnam",
    ("vn-decree-356-2025-form-09", 46): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-09", 50): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-09", 53): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-09", 55): "2 Cross-border personal data transfer flows (specify the Personal Data Subjects and purpose",
    ("vn-decree-356-2025-form-09", 56): "of each transfer, whether sensitive personal data are transferred, and the corresponding processing",
    ("vn-decree-356-2025-form-09", 57): "after transfer; diagram the processes and systems for cross-border personal data",
    ("vn-decree-356-2025-form-09", 58): "transfer)",
    ("vn-decree-356-2025-form-09", 62): "3.1. Basic personal data (under Article 3 of Government Decree No. 356/2025/ND-CP of 31",
    ("vn-decree-356-2025-form-09", 63): "December 2025 detailing a number of articles and measures for implementation of the Law on",
    ("vn-decree-356-2025-form-09", 64): "Personal Data Protection; mark √ for each applicable category)",
    ("vn-decree-356-2025-form-09", 77): "Other information associated with",
    ("vn-decree-356-2025-form-09", 78): "or helping to identify",
    ("vn-decree-356-2025-form-09", 79): "a specific person and not included in",
    ("vn-decree-356-2025-form-09", 80): "the categories above",
    ("vn-decree-356-2025-form-09", 81): "3.2. Sensitive personal data (under Clause 1 of Article 4 of Government Decree No. 356/2025/ND-CP",
    ("vn-decree-356-2025-form-09", 82): "of 31 December 2025 detailing a number of articles and measures for",
    ("vn-decree-356-2025-form-09", 83): "implementation of the Law on Personal Data Protection; mark √ for each applicable category)",
    ("vn-decree-356-2025-form-09", 84): "Data revealing racial or",
    ("vn-decree-356-2025-form-09", 85): "ethnic origin",
    ("vn-decree-356-2025-form-09", 88): "Political opinions Username and password for",
    ("vn-decree-356-2025-form-09", 89): "the individual's electronic identification",
    ("vn-decree-356-2025-form-09", 90): "account",
    ("vn-decree-356-2025-form-09", 91): "Religious or belief-related opinions Image of an identity card, citizen",
    ("vn-decree-356-2025-form-09", 92): "identity card or people's identity card",
    ("vn-decree-356-2025-form-09", 93): "Information concerning private life, personal secrets,",
    ("vn-decree-356-2025-form-09", 94): "or family secrets",
    ("vn-decree-356-2025-form-09", 97): "Health status Bank-card information and",
    ("vn-decree-356-2025-form-09", 98): "bank-account transaction-history",
    ("vn-decree-356-2025-form-09", 99): "data",
    ("vn-decree-356-2025-form-09", 100): "Biometric and genetic",
    ("vn-decree-356-2025-form-09", 101): "data",
    ("vn-decree-356-2025-form-09", 102): "Financial and credit information and other",
    ("vn-decree-356-2025-form-09", 103): "information concerning customers' financial, securities",
    ("vn-decree-356-2025-form-09", 104): "and insurance activities and transaction histories",
    ("vn-decree-356-2025-form-09", 105): "at credit institutions,",
    ("vn-decree-356-2025-form-09", 106): "foreign bank branches,",
    ("vn-decree-356-2025-form-09", 107): "payment-intermediary service providers, securities",
    ("vn-decree-356-2025-form-09", 108): "and insurance organizations, and",
    ("vn-decree-356-2025-form-09", 109): "other authorized organizations",
    ("vn-decree-356-2025-form-09", 110): "Data revealing an individual's sex life or",
    ("vn-decree-356-2025-form-09", 111): "sexual orientation",
    ("vn-decree-356-2025-form-09", 112): "Data tracking behavior or activities in the use of",
    ("vn-decree-356-2025-form-09", 113): "telecommunications services, social networks,",
    ("vn-decree-356-2025-form-09", 114): "online communication services and",
    ("vn-decree-356-2025-form-09", 115): "other cyberspace services",
    ("vn-decree-356-2025-form-09", 116): "Data concerning crimes or violations",
    ("vn-decree-356-2025-form-09", 117): "of law collected and stored by",
    ("vn-decree-356-2025-form-09", 118): "law-enforcement agencies",
    ("vn-decree-356-2025-form-09", 119): "Other personal data that law requires",
    ("vn-decree-356-2025-form-09", 120): "to be kept confidential or protected by",
    ("vn-decree-356-2025-form-09", 121): "strict security measures",
    ("vn-decree-356-2025-form-09", 122): "4 Personal data retention provisions (attach the document stating the relevant",
    ("vn-decree-356-2025-form-09", 123): "personal data retention policies and rules)",
    ("vn-decree-356-2025-form-09", 124): "5 Personal data erasure and destruction provisions (attach the document stating the relevant",
    ("vn-decree-356-2025-form-09", 125): "personal data erasure and destruction policies and rules)",
    ("vn-decree-356-2025-form-09", 130): "7 Participation in transactions on a data exchange:",
    ("vn-decree-356-2025-form-09", 132): "8 Provision of personal data processing services:",
    ("vn-decree-356-2025-form-09", 135): "Services that provide and operate",
    ("vn-decree-356-2025-form-09", 136): "automated systems and software to process",
    ("vn-decree-356-2025-form-09", 137): "personal data on behalf of a Personal Data Controller or",
    ("vn-decree-356-2025-form-09", 138): "Personal Data Controller and Processor",
    ("vn-decree-356-2025-form-09", 139): "Personal data analytics and mining services,",
    ("vn-decree-356-2025-form-09", 140): "including the use of analytical tools",
    ("vn-decree-356-2025-form-09", 141): "to identify information, trends",
    ("vn-decree-356-2025-form-09", 142): "and patterns in personal data, and the",
    ("vn-decree-356-2025-form-09", 143): "application of data-mining methods",
    ("vn-decree-356-2025-form-09", 144): "to extract value from personal data,",
    ("vn-decree-356-2025-form-09", 145): "predict user behavior,",
    ("vn-decree-356-2025-form-09", 147): "Services for scoring, ranking and",
    ("vn-decree-356-2025-form-09", 148): "assessing the creditworthiness of",
    ("vn-decree-356-2025-form-09", 149): "Personal Data Subjects",
    ("vn-decree-356-2025-form-09", 150): "Services for encrypting personal data during",
    ("vn-decree-356-2025-form-09", 152): "Services for online collection and processing of",
    ("vn-decree-356-2025-form-09", 153): "personal data from websites, applications,",
    ("vn-decree-356-2025-form-09", 154): "software and social networks",
    ("vn-decree-356-2025-form-09", 155): "Automated personal data processing services",
    ("vn-decree-356-2025-form-09", 156): "based on big data, artificial intelligence,",
    ("vn-decree-356-2025-form-09", 157): "blockchain or metaverse technology",
    ("vn-decree-356-2025-form-09", 158): "Services for collecting and processing",
    ("vn-decree-356-2025-form-09", 159): "personal data through websites, applications or",
    ("vn-decree-356-2025-form-09", 160): "healthcare and health-monitoring",
    ("vn-decree-356-2025-form-09", 161): "software and medical services",
    ("vn-decree-356-2025-form-09", 162): "Application-platform services providing",
    ("vn-decree-356-2025-form-09", 164): "Services for collecting and processing",
    ("vn-decree-356-2025-form-09", 165): "personal data through educational applications",
    ("vn-decree-356-2025-form-09", 166): "or software with monitoring features, such as attendance tracking,",
    ("vn-decree-356-2025-form-09", 167): "video recording, behavior scoring or",
    ("vn-decree-356-2025-form-09", 168): "emotion recognition",
    ("vn-decree-356-2025-form-09", 175): "9.3 Inspect and assess cybersecurity, information-system security, and means and",
    ("vn-decree-356-2025-form-09", 176): "equipment used to protect personal data (specify the content, subject, frequency and purpose)",
    ("vn-decree-356-2025-form-09", 177): "9.4 Personal data security plan of the cross-border Personal Data",
    ("vn-decree-356-2025-form-09", 178): "Recipient",
    ("vn-decree-356-2025-form-09", 181): "III. CROSS-BORDER PERSONAL DATA TRANSFER IMPACT ASSESSMENT",
    ("vn-decree-356-2025-form-09", 182): "1 Overall assessment of the situation and business activities related to cross-border",
    ("vn-decree-356-2025-form-09", 183): "personal data transfer (state why cross-border personal data transfer is necessary",
    ("vn-decree-356-2025-form-09", 184): "in the organization's field of operation and the actual status of its personal data",
    ("vn-decree-356-2025-form-09", 185): "processing, including advantages, difficulties and risks associated with cross-border",
    ("vn-decree-356-2025-form-09", 186): "personal data transfer)",
    ("vn-decree-356-2025-form-09", 189): "anticipated situations, causes and solutions; assess the impacts of the",
    ("vn-decree-356-2025-form-09", 190): "proposed solutions, positive and negative, and make recommendations by comparing",
    ("vn-decree-356-2025-form-09", 191): "their positive and negative impacts. Assess impacts using quantitative and",
    ("vn-decree-356-2025-form-09", 192): "qualitative methods, stating the possible unintended consequences or harm",
    ("vn-decree-356-2025-form-09", 193): "and the measures for reducing or eliminating those risks or harms.)",
    ("vn-decree-356-2025-form-09", 194): "2.1. Impact on Personal Data Subjects: assess by analyzing the potential",
    ("vn-decree-356-2025-form-09", 195): "direct impact of personal data processing on their rights and interests",
    ("vn-decree-356-2025-form-09", 199): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-09", 200): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-09", 202): "2.2 Impact on organizational information-system security and safety: assess on the basis",
    ("vn-decree-356-2025-form-09", 203): "of the direct effect of personal data processing on the confidentiality,",
    ("vn-decree-356-2025-form-09", 204): "integrity and availability of information systems. Focus the assessment",
    ("vn-decree-356-2025-form-09", 205): "on risks of leakage, unauthorized access or unauthorized alteration of",
    ("vn-decree-356-2025-form-09", 206): "data, interruption of system operations, the adequacy of existing technical",
    ("vn-decree-356-2025-form-09", 207): "measures and potential security vulnerabilities during data processing.",
    ("vn-decree-356-2025-form-09", 211): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-09", 212): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-09", 214): "2.3 Impact on national security and social order and safety: assess where",
    ("vn-decree-356-2025-form-09", 215): "basic personal data of more than 100,000 Personal Data Subjects are transferred and processed, or",
    ("vn-decree-356-2025-form-09", 216): "sensitive personal data of more than 10,000 Personal Data Subjects are processed. Focus on",
    ("vn-decree-356-2025-form-09", 217): "factors concerning a large volume of cross-border personal data transfer that",
    ("vn-decree-356-2025-form-09", 218): "may affect national security or social order and safety, and the corresponding personal data",
    ("vn-decree-356-2025-form-09", 219): "protection measures.",
    ("vn-decree-356-2025-form-09", 223): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-09", 224): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-09", 226): "3 Assess the level of personal data protection afforded by the Personal Data Recipient",
    ("vn-decree-356-2025-form-09", 227): "3.1 The Personal Data Recipient's methods of processing and storing data (specify for each",
    ("vn-decree-356-2025-form-09", 228): "data-processing flow)",
    ("vn-decree-356-2025-form-09", 229): "3.2 Personal Data Recipient's personal data security plan (specify",
    ("vn-decree-356-2025-form-09", 230): "the measures being implemented to secure personal data)",
    ("vn-decree-356-2025-form-09", 231): "3.3 Personal data protection measures of the Personal Data Recipient (specify the",
    ("vn-decree-356-2025-form-09", 232): "technical, managerial and training measures implemented and any standards",
    ("vn-decree-356-2025-form-09", 233): "applied in relation to personal data protection)",
    ("vn-decree-356-2025-form-09", 234): "3.4 Evaluate the Personal Data Recipient's processing and storage methods, security plan and",
    ("vn-decree-356-2025-form-09", 235): "personal data protection measures (assess the adequacy, appropriateness",
    ("vn-decree-356-2025-form-09", 236): "and effectiveness of the processing methods, personal data security plan and",
    ("vn-decree-356-2025-form-09", 237): "implemented personal data protection measures; compliance with personal data protection",
    ("vn-decree-356-2025-form-09", 238): "requirements under Vietnamese law; capacity to prevent, detect and respond to",
    ("vn-decree-356-2025-form-09", 239): "risks and personal data breach incidents; remaining risks; and proposed",
    ("vn-decree-356-2025-form-09", 240): "additional or remedial measures, if any)",
    ("vn-decree-356-2025-form-09", 241): "IV. APPENDIX (List the documents, policies, procedures, regulations and",
    ("vn-decree-356-2025-form-09", 242): "forms attached to this declaration)",
    ("vn-decree-356-2025-form-09", 243): "PART B. INFORMATION ON PARTIES INVOLVED IN CROSS-BORDER",
    ("vn-decree-356-2025-form-09", 244): "PERSONAL DATA TRANSFER ACTIVITIES",
    ("vn-decree-356-2025-form-09", 245): "I. INFORMATION ON THE PARTY CONDUCTING THE TRANSFER ON BEHALF OF THE TRANSFERRING",
    ("vn-decree-356-2025-form-09", 246): "PARTY (Complete where another party is authorized by agreement to conduct",
    ("vn-decree-356-2025-form-09", 247): "the cross-border personal data transfer directly)",

    ("vn-decree-356-2025-form-10", 1): "PERSONAL DATA PROCESSING",
    ("vn-decree-356-2025-form-10", 2): "IMPACT ASSESSMENT DOSSIER",
    ("vn-decree-356-2025-form-10", 3): "PART A. PERSONAL DATA PROCESSING IMPACT ASSESSMENT DOSSIER OF THE",
    ("vn-decree-356-2025-form-10", 4): "FILING PARTY",
    ("vn-decree-356-2025-form-10", 5): "I. BASIC INFORMATION ON THE FILING PARTY",
    ("vn-decree-356-2025-form-10", 15): "8 Personal data protection unit/personnel of the organization or individual",
    ("vn-decree-356-2025-form-10", 16): "8.1 Organization providing personal data protection services (if any; attach the service-use",
    ("vn-decree-356-2025-form-10", 17): "contract):",
    ("vn-decree-356-2025-form-10", 22): "8.2 Individual providing personal data protection services (if any; attach the service-use",
    ("vn-decree-356-2025-form-10", 23): "contract):",
    ("vn-decree-356-2025-form-10", 24): "No. Full name Employing entity Phone number Email",
    ("vn-decree-356-2025-form-10", 25): "8.3 Internal personal data protection unit/personnel (attach a copy of the",
    ("vn-decree-356-2025-form-10", 26): "decision or document recording the designation or assignment)",
    ("vn-decree-356-2025-form-10", 27): "Unit name:",
    ("vn-decree-356-2025-form-10", 28): "Unit telephone: Unit email:",
    ("vn-decree-356-2025-form-10", 29): "Name of unit head/personnel: Position:",
    ("vn-decree-356-2025-form-10", 33): "1.1. Personal Data Controller or Personal Data Controller and Processor ☐",
    ("vn-decree-356-2025-form-10", 34): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 35): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 36): "(Specify each category of Personal Data Subjects, such as customers, employees or applicants, and",
    ("vn-decree-356-2025-form-10", 37): "the number in each category as of the filing date)",
    ("vn-decree-356-2025-form-10", 38): "1.2. Personal Data Processor ☐",
    ("vn-decree-356-2025-form-10", 39): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 40): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 42): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 43): "- Category of Personal Data Subjects: Number:",
    ("vn-decree-356-2025-form-10", 47): "1.1. Personal Data Controller or Personal Data Controller and Processor",
    ("vn-decree-356-2025-form-10", 48): "1.2. Personal Data Processor",
    ("vn-decree-356-2025-form-10", 53): "3.1. Basic personal data (under Article 3 of Government Decree No. 356/2025/ND-CP of 31",
    ("vn-decree-356-2025-form-10", 54): "December 2025 detailing a number of articles and measures for implementation of the Law on",
    ("vn-decree-356-2025-form-10", 55): "Personal Data Protection; mark √ for each applicable category)",
    ("vn-decree-356-2025-form-10", 65): "Current residence Information about family relationships (parents,",
    ("vn-decree-356-2025-form-10", 66): "children and spouses)",
    ("vn-decree-356-2025-form-10", 68): "Other information associated with",
    ("vn-decree-356-2025-form-10", 69): "or helping to identify",
    ("vn-decree-356-2025-form-10", 70): "a specific person and not included in",
    ("vn-decree-356-2025-form-10", 71): "the categories above",
    ("vn-decree-356-2025-form-10", 72): "3.2. Sensitive personal data (under Clause 1 of Article 4 of Government Decree No. 356/2025/ND-CP",
    ("vn-decree-356-2025-form-10", 73): "of 31 December 2025 detailing a number of articles and measures for",
    ("vn-decree-356-2025-form-10", 74): "implementation of the Law on Personal Data Protection; mark √ for each applicable category)",
    ("vn-decree-356-2025-form-10", 75): "Data revealing racial or",
    ("vn-decree-356-2025-form-10", 76): "ethnic origin",
    ("vn-decree-356-2025-form-10", 79): "Political opinions Username and password for",
    ("vn-decree-356-2025-form-10", 80): "the individual's electronic identification",
    ("vn-decree-356-2025-form-10", 81): "account",
    ("vn-decree-356-2025-form-10", 82): "Religious or belief-related opinions Image of an identity card, citizen",
    ("vn-decree-356-2025-form-10", 83): "identity card or people's identity card",
    ("vn-decree-356-2025-form-10", 84): "Information concerning private life, personal secrets,",
    ("vn-decree-356-2025-form-10", 85): "or family secrets",
    ("vn-decree-356-2025-form-10", 88): "Health status Bank-card information and bank-account transaction-history",
    ("vn-decree-356-2025-form-10", 89): "data",
    ("vn-decree-356-2025-form-10", 90): "Biometric and genetic",
    ("vn-decree-356-2025-form-10", 91): "data",
    ("vn-decree-356-2025-form-10", 92): "Financial and credit information and other",
    ("vn-decree-356-2025-form-10", 93): "information concerning customers' financial, securities",
    ("vn-decree-356-2025-form-10", 94): "and insurance activities and transaction histories",
    ("vn-decree-356-2025-form-10", 95): "at credit institutions,",
    ("vn-decree-356-2025-form-10", 96): "foreign bank branches and",
    ("vn-decree-356-2025-form-10", 97): "payment-intermediary service providers,",
    ("vn-decree-356-2025-form-10", 98): "securities and insurance organizations, and",
    ("vn-decree-356-2025-form-10", 99): "other authorized organizations",
    ("vn-decree-356-2025-form-10", 100): "Data revealing an individual's sex life or",
    ("vn-decree-356-2025-form-10", 101): "sexual orientation",
    ("vn-decree-356-2025-form-10", 102): "Data tracking behavior or activities in the use of",
    ("vn-decree-356-2025-form-10", 103): "telecommunications services, social networks,",
    ("vn-decree-356-2025-form-10", 104): "online communication services and",
    ("vn-decree-356-2025-form-10", 105): "other cyberspace services",
    ("vn-decree-356-2025-form-10", 106): "Data concerning crimes or violations",
    ("vn-decree-356-2025-form-10", 107): "of law collected and stored by",
    ("vn-decree-356-2025-form-10", 108): "law-enforcement agencies",
    ("vn-decree-356-2025-form-10", 109): "An individual's location determined through",
    ("vn-decree-356-2025-form-10", 110): "a location service",
    ("vn-decree-356-2025-form-10", 111): "Data revealing racial or",
    ("vn-decree-356-2025-form-10", 112): "ethnic origin",
    ("vn-decree-356-2025-form-10", 113): "Other personal data that law requires",
    ("vn-decree-356-2025-form-10", 114): "to be kept confidential or protected by",
    ("vn-decree-356-2025-form-10", 115): "strict security measures",
    ("vn-decree-356-2025-form-10", 116): "4 Consent of the Personal Data Subject (describe the contents, form and process",
    ("vn-decree-356-2025-form-10", 117): "for obtaining consent from each category of Personal Data Subjects, and attach the relevant form)",
    ("vn-decree-356-2025-form-10", 118): "5 Personal data retention provisions (attach the document stating the relevant",
    ("vn-decree-356-2025-form-10", 119): "personal data retention policies and rules)",
    ("vn-decree-356-2025-form-10", 120): "6 Personal data erasure and destruction provisions (attach the document stating the relevant",
    ("vn-decree-356-2025-form-10", 121): "personal data erasure and destruction policies and rules)",
    ("vn-decree-356-2025-form-10", 126): "8 Participation in transactions on a data exchange:",
    ("vn-decree-356-2025-form-10", 128): "9 Provision of personal data processing services:",
    ("vn-decree-356-2025-form-10", 131): "Services that provide and operate",
    ("vn-decree-356-2025-form-10", 132): "automated systems and software to process",
    ("vn-decree-356-2025-form-10", 133): "personal data on behalf of a Personal Data Controller or",
    ("vn-decree-356-2025-form-10", 134): "Personal Data Controller and Processor",
    ("vn-decree-356-2025-form-10", 135): "Personal data analytics and mining services,",
    ("vn-decree-356-2025-form-10", 136): "including the use of analytical tools",
    ("vn-decree-356-2025-form-10", 137): "to identify information, trends",
    ("vn-decree-356-2025-form-10", 138): "and patterns in personal data, and the",
    ("vn-decree-356-2025-form-10", 139): "application of data-mining methods",
    ("vn-decree-356-2025-form-10", 140): "to extract value from personal data,",
    ("vn-decree-356-2025-form-10", 141): "predict user behavior,",
    ("vn-decree-356-2025-form-10", 143): "Services for scoring, ranking and",
    ("vn-decree-356-2025-form-10", 144): "assessing the creditworthiness of",
    ("vn-decree-356-2025-form-10", 145): "Personal Data Subjects",
    ("vn-decree-356-2025-form-10", 146): "Services for encrypting personal data during",
    ("vn-decree-356-2025-form-10", 148): "Services for online collection and processing of",
    ("vn-decree-356-2025-form-10", 149): "personal data from websites, applications,",
    ("vn-decree-356-2025-form-10", 150): "software and social networks",
    ("vn-decree-356-2025-form-10", 151): "Automated personal data processing services",
    ("vn-decree-356-2025-form-10", 152): "based on big data, artificial intelligence,",
    ("vn-decree-356-2025-form-10", 153): "blockchain or metaverse technology",
    ("vn-decree-356-2025-form-10", 154): "Services for collecting and processing",
    ("vn-decree-356-2025-form-10", 155): "personal data through websites, applications or",
    ("vn-decree-356-2025-form-10", 156): "healthcare and health-monitoring",
    ("vn-decree-356-2025-form-10", 157): "software and medical services",
    ("vn-decree-356-2025-form-10", 158): "Application-platform services providing",
    ("vn-decree-356-2025-form-10", 160): "Services for collecting and processing",
    ("vn-decree-356-2025-form-10", 161): "personal data through educational applications",
    ("vn-decree-356-2025-form-10", 162): "or software with monitoring features, such as attendance tracking,",
    ("vn-decree-356-2025-form-10", 163): "video recording, behavior scoring or",
    ("vn-decree-356-2025-form-10", 164): "emotion recognition",
    ("vn-decree-356-2025-form-10", 178): "1 Overall assessment of the situation and business activities related to the collection",
    ("vn-decree-356-2025-form-10", 179): "and processing of personal data (state why personal data processing is necessary",
    ("vn-decree-356-2025-form-10", 180): "in the organization's field of operation and the actual status of its personal data",
    ("vn-decree-356-2025-form-10", 181): "processing, including advantages, difficulties and risks)",
    ("vn-decree-356-2025-form-10", 182): "2 Assess the impact of personal data processing (assess each specific matter and",
    ("vn-decree-356-2025-form-10", 183): "analyze each issue, including the current situation, applicable requirements and anticipated",
    ("vn-decree-356-2025-form-10", 184): "situations, causes and solutions; assess the impacts of the proposed solutions, positive",
    ("vn-decree-356-2025-form-10", 185): "and negative, and make recommendations by comparing those impacts.",
    ("vn-decree-356-2025-form-10", 186): "Assess impacts using quantitative and qualitative methods, and state",
    ("vn-decree-356-2025-form-10", 187): "the possible unintended consequences or harm and the measures for reducing",
    ("vn-decree-356-2025-form-10", 188): "or eliminating those risks or harms.)",
    ("vn-decree-356-2025-form-10", 189): "2.1. Impact on Personal Data Subjects: assess by analyzing the potential",
    ("vn-decree-356-2025-form-10", 190): "direct impact of personal data processing on the rights and interests of Personal Data",
    ("vn-decree-356-2025-form-10", 191): "Subjects",
    ("vn-decree-356-2025-form-10", 195): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-10", 196): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-10", 198): "2.2 Impact on organizational information-system security and safety: assess on the basis",
    ("vn-decree-356-2025-form-10", 199): "of the direct effect of personal data processing on the confidentiality,",
    ("vn-decree-356-2025-form-10", 200): "integrity and availability of information systems. Focus the assessment",
    ("vn-decree-356-2025-form-10", 201): "on risks of leakage, unauthorized access or unauthorized alteration of",
    ("vn-decree-356-2025-form-10", 202): "data, interruption of system operations, the adequacy of existing technical",
    ("vn-decree-356-2025-form-10", 203): "measures and potential security vulnerabilities during data processing.",
    ("vn-decree-356-2025-form-10", 207): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-10", 208): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-10", 210): "2.3 Impact on national security and social order and safety: assess where an organization",
    ("vn-decree-356-2025-form-10", 211): "processes basic personal data of more than 100,000 Personal Data Subjects or sensitive personal data",
    ("vn-decree-356-2025-form-10", 212): "of more than 10,000 Personal Data Subjects. The assessment focuses on",
    ("vn-decree-356-2025-form-10", 213): "factors related to large-scale personal data processing that may affect",
    ("vn-decree-356-2025-form-10", 214): "national security or social order and safety, and on the corresponding personal data protection",
    ("vn-decree-356-2025-form-10", 215): "measures.",
    ("vn-decree-356-2025-form-10", 219): "4. Assess the effectiveness and impact of measures on persons directly affected",
    ("vn-decree-356-2025-form-10", 220): "by those measures and on other relevant persons",
    ("vn-decree-356-2025-form-10", 222): "IV. APPENDIX (List the documents, policies, procedures, regulations and",
    ("vn-decree-356-2025-form-10", 223): "forms attached to this declaration)",
    ("vn-decree-356-2025-form-10", 224): "PART B. INFORMATION ON PARTIES INVOLVED IN PERSONAL DATA PROCESSING",
    ("vn-decree-356-2025-form-10", 225): "ACTIVITIES",
    ("vn-decree-356-2025-form-10", 226): "I. INFORMATION ON THE PERSONAL DATA CONTROLLER (Complete consistently with the",
    ("vn-decree-356-2025-form-10", 227): "relationship in the personal data processing activities)",
    ("vn-decree-356-2025-form-10", 248): "II. INFORMATION ON THE PERSONAL DATA PROCESSOR (Complete consistently with the",
    ("vn-decree-356-2025-form-10", 249): "relationship in the personal data processing activities)",
    ("vn-decree-356-2025-form-10", 270): "III. INFORMATION ON THE THIRD PARTY (Complete consistently with the relationship in the",
    ("vn-decree-356-2025-form-10", 271): "personal data processing activities)",
})


def add_repeated_table_repairs() -> None:
    form09 = "vn-decree-356-2025-form-09"
    for start in (248, 271):
        values = [
            "No. Name of", "organization/", "individual", "Tax", "identification", "number",
            "Information on the", "personal data protection unit/", "personnel", "of the organization/individual",
            "Contract/Agreement", "for the transfer of", "personal data across", "borders",
            "(Number and date)", "Cooperation", "service", "Notes", "(Reason and", "explanatory", "content)",
        ]
        for offset, value in enumerate(values):
            TARGETED_PARAGRAPH_REPAIRS[(form09, start + offset)] = value
    values = [
        "No. Name of", "organization/", "individual", "Tax", "identification", "number",
        "Information on the", "personal data protection unit/", "personnel", "of the organization/individual",
        "Relevant contract/", "agreement", "(Number and date)", "Cooperation", "service", "Notes",
        "(Reason and", "explanatory", "content)",
    ]
    for offset, value in enumerate(values):
        TARGETED_PARAGRAPH_REPAIRS[(form09, 294 + offset)] = value

    form10 = "vn-decree-356-2025-form-10"
    for start in (228, 250, 272):
        values = [
            "No. Name of", "organization/", "individual", "Tax", "identification", "number",
            "Information on the", "personal data protection unit/", "personnel", "of the organization/individual",
            "Personal data processing", "contract/agreement", "", "(Number and date)",
            "Cooperation", "service", "Notes", "(Reason and", "explanatory", "content)",
        ]
        # The source cell at offset 12 is the second half of “personal data”; a
        # visible continuation marker retains one-to-one paragraph alignment.
        values[12] = "(continued)"
        for offset, value in enumerate(values):
            TARGETED_PARAGRAPH_REPAIRS[(form10, start + offset)] = value


add_repeated_table_repairs()


CONFIGS = [
    {
        "instrumentId": "vn-personal-data-protection-law-2025",
        "instrumentNumber": "91/2025/QH15",
        "corpusPath": DATA / "vn-personal-data-protection-law-2025-articles.json",
        "cataloguePath": DATA / "source-snapshots" / "vn-pdpl-2025-project-en-draft-2026-07-20.json",
        "sourceUrl": "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/91qh.signed.pdf",
        "sourceLabel": "Signed National Assembly Vietnamese text — controlling source for project reference",
        "versionLabel": "Law No. 91/2025/QH15, enacted 26 June 2025 and effective 1 January 2026",
        "expectedUnits": 39,
        "expectedArticles": 39,
        "expectedForms": 0,
        "titles": LAW_TITLES,
    },
    {
        "instrumentId": "vn-decree-356-2025",
        "instrumentNumber": "356/2025/NĐ-CP",
        "corpusPath": DATA / "vn-decree-356-2025-provisions.json",
        "cataloguePath": DATA / "source-snapshots" / "vn-decree-356-2025-project-en-draft-2026-07-20.json",
        "sourceUrl": "https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/356-nd.signed.pdf",
        "sourceLabel": "Signed Government Vietnamese text — controlling source for project reference",
        "versionLabel": "Decree No. 356/2025/NĐ-CP, issued 31 December 2025 and effective 1 January 2026",
        "expectedUnits": 55,
        "expectedArticles": 42,
        "expectedForms": 13,
        "titles": DECREE_TITLES,
    },
]


REJECTED_TRANSLATION_PATTERNS = re.compile(
    r"Fish data|Personal Personal|31\s*/\s*12|cents individual|cents\s*$|"
    r"muscles law enforcement|mobile characteristics transmit|official/fish|"
    r"favorable to evil|whether personal piercing|Reason, grandmother|credit credit assessment|"
    r"(?-i:except In cases)|maximum of 01 extension|must ensure to clearly state|\bour systems\b|"
    r"The Government regulates this clause in detail|procedures of the Personal Data Subject|"
    r"security assurance\.\s*country|\bthe a\b|on behalf of the controller, controller and processor|"
    r"Evaluate, summarize and summarize|Party's guidelines, guidelines|expires from the effective date|"
    r"carry out a dossier|Do not have to conduct|vehicles and equipment\s+equipment|"
    r"person to whom the personal data reflects|Only be required to provide information|"
    r"reinsurance or reinsurance business|eavesdrop, eavesdrop|^;$",
    flags=re.IGNORECASE | re.MULTILINE,
)

# Semicolon-separated statutory clauses should not look like a new imperative
# sentence created by machine capitalization.  Clause/Point/Article are
# excluded because they legitimately begin citation-list entries in Article 1
# of Decree No. 356/2025/ND-CP.
CAPITALIZED_SEMICOLON_FRAGMENT = re.compile(
    r";\s+(?!Clause\b|Point\b|Article\b)[A-Z][a-z]+\b"
)


def sha256(value: str | bytes) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value).strip()
    value = value.translate({0x200B: None, 0x200C: None, 0x200D: None, 0xFEFF: None})
    replacements = [
        (r"\bParty that controls and processes personal data\b", "Personal Data Controller and Processor"),
        (r"\bparty that controls and processes personal data\b", "Personal Data Controller and Processor"),
        (r"\bParty that controls personal data\b", "Personal Data Controller"),
        (r"\bparty that controls personal data\b", "Personal Data Controller"),
        (r"\bController and processor of personal data\b", "Personal Data Controller and Processor"),
        (r"\bcontroller and processor of personal data\b", "Personal Data Controller and Processor"),
        (r"\bControllers and processors of personal data\b", "Personal Data Controllers and Processors"),
        (r"\bcontrollers and processors of personal data\b", "Personal Data Controllers and Processors"),
        (r"\bPersonal data controller and processing party\b", "Personal Data Controller and Processor"),
        (r"\bPersonal data processing party\b", "Personal Data Processor"),
        (r"\bthird party\b", "Third Party"),
        (r"\bsubject of personal data\b", "Personal Data Subject"),
        (r"\bpersonal data subject\b", "Personal Data Subject"),
        (r"\bNational Information Portal on personal data protection\b", "National Portal for Personal Data Protection"),
        (r"\bNational information portal on personal data protection\b", "National Portal for Personal Data Protection"),
        (r"\bagency in charge of personal data protection\b", "Specialized Personal Data Protection Agency"),
        (r"\bagency responsible for personal data protection\b", "Specialized Personal Data Protection Agency"),
        (r"\bagency in charge of protecting personal data\b", "Specialized Personal Data Protection Agency"),
        (r"\bagency responsible for protecting personal data\b", "Specialized Personal Data Protection Agency"),
        (r"\bspecialized agency for personal data protection\b", "Specialized Personal Data Protection Agency"),
        (r"\bAgency in charge of protecting personal data\b", "Specialized Personal Data Protection Agency"),
        (r"\bImpact Assessment Profile\b", "Impact Assessment Dossier"),
        (r"\bimpact assessment profile\b", "impact assessment dossier"),
        (r"\bimpact assessment records\b", "impact assessment dossiers"),
        (r"\bimpact assessment record\b", "impact assessment dossier"),
        (r"\bdocuments assessing the impact\b", "impact assessment dossiers"),
        (r"\bDocument assessing the impact\b", "Impact Assessment Dossier"),
        (r"\bRecord assessing the impact\b", "Impact Assessment Dossier"),
        (r"\bdossier assessing the impact\b", "impact assessment dossier"),
        (r"\bdossiers assessing the impact\b", "impact assessment dossiers"),
        (r"\bvirtual universe\b", "metaverse"),
        (r"\bvirtual universes\b", "metaverses"),
        (r"\bMinistry of Police\b", "Ministry of Public Security"),
        (r"\bscope of adjustment\b", "scope"),
        (r"\bExplanation of terms\b", "Interpretation"),
        (r"\bCertificate of eligibility for (?:the )?business of personal data processing services\b", "Certificate of Eligibility to Provide Personal Data Processing Services"),
        (r"\bCertificate of eligibility for personal data processing service business\b", "Certificate of Eligibility to Provide Personal Data Processing Services"),
        (r"\bCertificate of eligibility to provide personal data processing services\b", "Certificate of Eligibility to Provide Personal Data Processing Services"),
        (r"\bcertificate of eligibility for personal data processing service business\b", "Certificate of Eligibility to Provide Personal Data Processing Services"),
        (r"\bpersonal data processing service business\b", "provision of personal data processing services"),
        (r"\bhis/her\b", "their"),
        (r"\bhis or her\b", "their"),
        (r"\bhim/her\b", "them"),
        (r"\bhimself/herself\b", "themselves"),
        (r"\byour personal data\b", "their personal data"),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)

    # Deterministic repairs for recurring machine-draft defects.  They do not
    # alter the source coverage or paragraph order.
    value = value.replace("This law ", "This Law ")
    value = value.replace("this law ", "this Law ")
    value = value.replace("personal data of the personal data subject", "personal data of the Personal Data Subject")
    value = value.replace("Personal Data Subject's data", "personal data of the Personal Data Subject")
    value = value.replace("must notify on the National Portal", "must publish notice on the National Portal")
    value = value.replace("from the time they reach scale. from 100 thousand Personal Data Subjects or more", "at a scale of 100,000 or more Personal Data Subjects")
    value = value.replace("from the time of reaching scale. from 100 thousand Personal Data Subjects or more", "at a scale of 100,000 or more Personal Data Subjects")
    value = value.replace("artificial, blockchain, metaverse", "artificial intelligence, blockchain, metaverse")
    value = value.replace("credit credit assessment", "creditworthiness assessment")
    value = value.replace("our systems", "their systems")
    value = re.sub(r"\b(?:personal\s+){2,}data\s+controller\s+and\s+processor\b", "Personal Data Controller and Processor", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:personal\s+){2,}data\s+controller\b", "Personal Data Controller", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:personal\s+){2,}data\s+processor\b", "Personal Data Processor", value, flags=re.IGNORECASE)
    value = re.sub(r"\bpersonal\s+data\s+controller\s+and\s+processor\b", "Personal Data Controller and Processor", value, flags=re.IGNORECASE)
    value = re.sub(r"\bpersonal\s+data\s+controller\b", "Personal Data Controller", value, flags=re.IGNORECASE)
    value = re.sub(r"\bpersonal\s+data\s+processor\b", "Personal Data Processor", value, flags=re.IGNORECASE)
    value = re.sub(r"\bparty that controls and processes (?:the )?personal data\b", "Personal Data Controller and Processor", value, flags=re.IGNORECASE)
    value = re.sub(r"(?<!Personal )\bdata subject(s?)\b", r"Personal Data Subject\1", value, flags=re.IGNORECASE)
    value = re.sub(r"\bpersonal data subject(s?)\b", r"Personal Data Subject\1", value, flags=re.IGNORECASE)
    value = re.sub(r"\brecords assessing the impact of (?:processing personal data|personal data processing)\b", "Personal Data Processing Impact Assessment Dossiers", value, flags=re.IGNORECASE)
    value = re.sub(r"\brecords assessing the impact of (?:cross-border transfers? of personal data|transferring personal data across borders)\b", "Cross-Border Personal Data Transfer Impact Assessment Dossiers", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:an? )?impact assessment dossier of (?:processing of (?:their )?personal data|processing personal data|personal data processing)\b", "a Personal Data Processing Impact Assessment Dossier", value, flags=re.IGNORECASE)
    value = re.sub(r"\b(?:an? )?impact assessment dossier of (?:cross-border personal data transfer|transferring personal data across borders)\b", "a Cross-Border Personal Data Transfer Impact Assessment Dossier", value, flags=re.IGNORECASE)
    value = re.sub(r"\bpersonal data processing impact assessment file\b", "Personal Data Processing Impact Assessment Dossier", value, flags=re.IGNORECASE)
    value = re.sub(r"\bthe file sent to\b", "the dossier sent to", value, flags=re.IGNORECASE)
    value = value.replace("the a Personal Data Processing Impact Assessment Dossier", "the Personal Data Processing Impact Assessment Dossier")
    value = value.replace("a a Personal Data Processing Impact Assessment Dossier", "a Personal Data Processing Impact Assessment Dossier")
    value = re.sub(r"\bin case the dossier is not complete and in accordance with regulations\b", "if the dossier is incomplete or noncompliant", value, flags=re.IGNORECASE)
    value = re.sub(r"\bin case the dossier is not complete and in accordance with the regulations\b", "if the dossier is incomplete or noncompliant", value, flags=re.IGNORECASE)
    value = value.replace("Protect your own personal data", "Protect their own personal data")
    value = re.sub(r"\s+([,.;:])", r"\1", value)
    value = re.sub(r" {2,}", " ", value)
    return value.strip()


def expected_marker(source: str) -> str | None:
    match = re.match(r"^(\d+(?:\.\d+)*\.|[a-zđ]\)|[IVXLCDM]+\.|□|-)\s*", source, flags=re.IGNORECASE)
    if not match:
        return None
    marker = match.group(1)
    return "dd)" if marker.lower() == "đ)" else marker


def apply_marker(source: str, translation: str) -> str:
    marker = expected_marker(source)
    if not marker:
        return translation
    if marker in {"□", "-"}:
        return translation if translation.startswith(marker) else f"{marker} {translation.lstrip()}"
    current = re.match(r"^(\d+(?:\.\d+)*\.|[a-z]+\)|[IVXLCDM]+\.)\s*", translation, flags=re.IGNORECASE)
    if current:
        return marker + " " + translation[current.end():].lstrip()
    return marker + " " + translation


def title_for(unit: dict, config: dict) -> str:
    if unit["unitType"] == "appendix-form":
        return FORM_TITLES[unit["formNumber"]]
    return config["titles"][int(unit["articleNumber"])]


def post_edit(unit: dict, config: dict, draft_paragraphs: list[str]) -> tuple[str, list[str]]:
    title = title_for(unit, config)
    paragraphs = [
        apply_marker(source, normalize_text(draft))
        for source, draft in zip(unit["paragraphs"], draft_paragraphs, strict=True)
    ]
    if unit["unitType"] == "article":
        paragraphs[0] = f"Article {unit['articleNumber']}. {title}"
    else:
        paragraphs[0] = f"Form No. {unit['formNumber']}"
    for index in range(len(paragraphs)):
        repair = TARGETED_PARAGRAPH_REPAIRS.get((unit["id"], index))
        if repair is not None:
            paragraphs[index] = repair
    return title, paragraphs


def annotate_corpus(config: dict) -> tuple[list[dict], dict]:
    corpus = json.loads(config["corpusPath"].read_text(encoding="utf-8"))
    catalogue = json.loads(config["cataloguePath"].read_text(encoding="utf-8"))
    catalogue_by_id = {unit["id"]: unit for unit in catalogue["units"]}
    if len(corpus) != config["expectedUnits"] or len(catalogue_by_id) != config["expectedUnits"]:
        raise ValueError(f"{config['instrumentId']}: expected {config['expectedUnits']} nodes")

    for unit in corpus:
        draft = catalogue_by_id.get(unit["id"])
        if not draft:
            raise ValueError(f"missing catalogue unit {unit['id']}")
        if draft["sourceContentSha256"] != unit["contentSha256"]:
            raise ValueError(f"source hash mismatch for {unit['id']}")
        if draft["sourceParagraphCount"] != len(unit["paragraphs"]):
            raise ValueError(f"source paragraph count mismatch for {unit['id']}")
        if draft["sourceParagraphSequenceSha256"] != sha256("\n\n".join(unit["paragraphs"])):
            raise ValueError(f"source paragraph sequence mismatch for {unit['id']}")
        if draft["draftParagraphSequenceSha256"] != sha256("\n\n".join(draft["draftParagraphs"])):
            raise ValueError(f"draft hash mismatch for {unit['id']}")

        title, paragraphs = post_edit(unit, config, draft["draftParagraphs"])
        if len(paragraphs) != len(unit["paragraphs"]):
            raise ValueError(f"translation paragraph count mismatch for {unit['id']}")
        if any(not paragraph.strip() for paragraph in paragraphs):
            raise ValueError(f"empty English paragraph for {unit['id']}")
        for source, paragraph in zip(unit["paragraphs"], paragraphs, strict=True):
            marker = expected_marker(source)
            if marker and not paragraph.startswith(marker):
                raise ValueError(f"list marker drift in {unit['id']}: expected {marker}")
        if any(re.search(r"[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]", p) for p in paragraphs):
            raise ValueError(f"untranslated Vietnamese script remains in {unit['id']}")
        rejected = REJECTED_TRANSLATION_PATTERNS.search("\n".join(paragraphs))
        if rejected:
            raise ValueError(f"rejected translation pattern in {unit['id']}: {rejected.group(0)!r}")
        if unit["unitType"] == "article":
            for paragraph in paragraphs:
                fragment = CAPITALIZED_SEMICOLON_FRAGMENT.search(paragraph)
                if fragment:
                    raise ValueError(
                        f"capitalized semicolon fragment in {unit['id']}: {fragment.group(0)!r}"
                    )

        full_text = "\n\n".join(paragraphs)
        project_rights = {
            "reuseStatus": "cc-by-4.0-project-authored-translation",
            "license": "Creative Commons Attribution 4.0 International",
            "licenseUrl": LICENSE_URL,
            "attribution": f"Compliance Compass contributors — nonofficial English reference to {config['instrumentNumber']}",
            "originalTextBoundary": "CC BY 4.0 applies only to the project-authored English reference. The official Vietnamese legislative text is a government edict and remains the controlling source.",
        }
        translation_basis = {
            "method": "project-authored-machine-assisted-reference-translation",
            "sourceLanguage": "vi-VN",
            "sourceContentSha256": unit["contentSha256"],
            "sourceParagraphCount": len(unit["paragraphs"]),
            "draftCatalogue": str(config["cataloguePath"].relative_to(ROOT)),
            "draftCatalogueUnitSha256": draft["draftParagraphSequenceSha256"],
            "annotator": "scripts/annotate-vietnam-current-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "qualityBoundary": "Source and translation paragraph counts, order, source hashes, Article/Form identifiers, list markers and a controlled privacy-law terminology set are mechanically verified or normalized. This is not a certified legal translation.",
        }
        if unit["id"] == "vn-decree-356-2025-art-28":
            translation_basis["sourceTextNote"] = (
                "In Clause 2, the signed Vietnamese text reads 'bên xử lý bên thứ ba' "
                "without a comma or a repeated 'dữ liệu cá nhân'. The English reference "
                "renders the apparent list of the defined roles Personal Data Processor "
                "and Third Party; the signed Vietnamese wording remains controlling."
            )
        unit.setdefault("translations", {})["en"] = {
            "title": title,
            "paragraphs": paragraphs,
            "fullText": full_text,
            "language": "en",
            "coverageStatus": "complete-current-project-reference",
            "versionAsOf": AS_OF,
            "versionLabel": config["versionLabel"],
            "currentTextEquivalent": True,
            "alignmentStatus": "aligned-to-pinned-current-official-vietnamese",
            "referenceViewEligible": True,
            "legalEffectStatus": "in-force",
            "status": "project-authored-reference-translation-no-legal-effect",
            "note": "Complete English reference for the stored current Vietnamese node. This project translation is machine-assisted, nonofficial, has no legal effect and is not legal advice. The Vietnamese text controls.",
            "authorityNote": "No complete English translation published by the issuing authority or an openly reusable official Government source was verified. Commercial and subscription translations were not copied.",
            "source": config["sourceUrl"],
            "sourceLabel": config["sourceLabel"],
            "translationBasis": translation_basis,
            "contentSha256": sha256(full_text),
            "rights": project_rights,
        }
        checked_sources = unit.get("englishAvailability", {}).get("sourcesChecked", [])
        unit["translationStatus"] = "complete-current-project-reference-nonofficial"
        unit["englishAvailability"] = {
            "coverageStatus": "complete-current-project-reference",
            "status": "project-authored-reference-translation-no-legal-effect",
            "versionAsOf": AS_OF,
            "versionLabel": config["versionLabel"],
            "currentTextEquivalent": True,
            "alignmentStatus": "aligned-to-pinned-current-official-vietnamese",
            "legalEffectStatus": "in-force",
            "authorityNote": "A complete nonofficial project English reference is stored. It is not a Government translation and has no legal effect; the Vietnamese text controls.",
            "sourcesChecked": checked_sources,
            "note": "Every stored Vietnamese paragraph has a corresponding current-version project English reference paragraph. Commercial and subscription translations were not copied.",
        }
        unit["translationReference"] = {
            "language": "en",
            "availability": "complete-project-authored-current-reference",
            "sourceVersion": {
                "instrumentNumber": config["instrumentNumber"],
                "effectiveFrom": "2026-01-01",
                "statusAsOf": AS_OF,
                "versionAlignment": "translation-of-the-pinned-official-vietnamese-current-node",
            },
            "translationBasis": translation_basis,
            "note": "Nonofficial machine-assisted project reference; Vietnamese controls and the English text has no legal effect.",
        }

    corpus_json = json.dumps(corpus, ensure_ascii=False, indent=2) + "\n"
    summary = {
        "instrumentId": config["instrumentId"],
        "instrumentNumber": config["instrumentNumber"],
        "corpusPath": str(config["corpusPath"].relative_to(ROOT)),
        "sourceUrl": config["sourceUrl"],
        "unitCount": len(corpus),
        "articleCount": sum(unit["unitType"] == "article" for unit in corpus),
        "appendixFormCount": sum(unit["unitType"] == "appendix-form" for unit in corpus),
        "sourceParagraphCount": sum(len(unit["paragraphs"]) for unit in corpus),
        "translationParagraphCount": sum(len(unit["translations"]["en"]["paragraphs"]) for unit in corpus),
        "coverageStatus": "complete-current-project-reference",
        "versionLabel": config["versionLabel"],
        "cataloguePath": str(config["cataloguePath"].relative_to(ROOT)),
        "catalogueSha256": sha256(config["cataloguePath"].read_bytes()),
        "outputSha256": sha256(corpus_json),
        "sourceUnitSequenceSha256": sha256("\n\n".join(unit["fullText"] for unit in corpus)),
        "translationUnitSequenceSha256": sha256("\n\n".join(unit["translations"]["en"]["fullText"] for unit in corpus)),
    }
    return corpus, summary


def build_manifest(summaries: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "manifestId": "vn-current-personal-data-regime-project-english-2026-07-20",
        "reviewedAsOf": AS_OF,
        "scope": {
            "instrumentCount": 2,
            "expectedUnitCount": 94,
            "translatedUnitCount": sum(item["unitCount"] for item in summaries),
            "articleCount": sum(item["articleCount"] for item in summaries),
            "appendixFormCount": sum(item["appendixFormCount"] for item in summaries),
            "sourceParagraphCount": sum(item["sourceParagraphCount"] for item in summaries),
            "translationParagraphCount": sum(item["translationParagraphCount"] for item in summaries),
            "coverageStatus": "complete-current-project-reference",
        },
        "versionBoundary": {
            "controllingLanguage": "vi-VN",
            "effectiveFrom": "2026-01-01",
            "sourceAsOf": AS_OF,
            "officialEnglishAvailability": "No complete issuing-authority or openly reusable official Government English text was verified for either current instrument.",
            "commercialTranslationBoundary": "Commercial, subscription-database and law-firm translations were not copied into this corpus.",
        },
        "method": {
            "draftGenerator": "scripts/prepare-project-english-translation-drafts.py",
            "annotator": "scripts/annotate-vietnam-current-english.py",
            "annotatorVersion": SCRIPT_VERSION,
            "sourceHashLock": True,
            "paragraphOrderLock": True,
            "listMarkerLock": True,
            "controlledTerminology": True,
            "qualityBoundary": "Machine-assisted project reference with deterministic legal-title and privacy-terminology normalization plus structural and hash verification; not a certified legal translation.",
        },
        "rights": {
            "projectEnglishLicense": "CC BY 4.0",
            "projectEnglishLicenseUrl": LICENSE_URL,
            "officialVietnameseBoundary": "The licence applies only to the project-authored English references. The official Vietnamese texts are government edicts and remain controlling.",
        },
        "corpora": summaries,
    }


def update_foreign_audit(audit: dict) -> dict:
    for config in CONFIGS:
        entry = next(item for item in audit["instruments"] if item["instrumentId"] == config["instrumentId"])
        entry["englishCoverage"] = "complete-current-project-reference"
        entry["coverageBreakdown"] = {
            "officialReferenceCurrentWording": 0,
            "projectAuthoredCurrentReference": config["expectedUnits"],
            "missing": 0,
        }
        entry["versionBoundary"] = config["versionLabel"] + "; each English node is aligned to the pinned current Vietnamese node."
        entry["englishSource"] = str(config["cataloguePath"].relative_to(ROOT))
        entry["controllingSource"] = config["sourceUrl"]
        entry["rightsBoundary"] = "The project-authored, machine-assisted English reference is CC BY 4.0, nonofficial and without legal effect. Official Vietnamese controls. Commercial translations were not copied."
    return audit


def update_handoff(handoff: dict, summaries: list[dict]) -> dict:
    handoff["scope"]["englishTranslationPolicy"] = (
        "No complete issuing-authority or openly reusable official Government English version was verified. "
        "All three stored instruments now have complete, source-hash-locked, machine-assisted project English "
        "references that are explicitly nonofficial, without legal effect and CC BY 4.0; commercial translations "
        "were not copied. Decree 13/2023 remains historical and repealed."
    )
    by_instrument = {item["instrumentId"]: item for item in summaries}
    for config in CONFIGS:
        summary = by_instrument[config["instrumentId"]]
        entry = next(item for item in handoff["corpora"] if item["instrumentId"] == config["instrumentId"])
        entry["coverage"]["englishTranslation"] = (
            f"complete nonofficial current-version project reference for all {summary['unitCount']} stored nodes; "
            "machine-assisted, source-hash locked, paragraph aligned and CC BY 4.0"
        )
        entry["output"]["sha256"] = summary["outputSha256"]
        catalogue_path = summary["cataloguePath"]
        snapshots = entry.setdefault("sourceSnapshots", [])
        snapshots[:] = [item for item in snapshots if item.get("path") != catalogue_path]
        snapshots.append(
            {
                "path": catalogue_path,
                "sha256": summary["catalogueSha256"],
                "role": "machine-assisted English draft catalogue locked to every official-source unit hash; nonofficial project-reference input",
            }
        )
        entry["englishTranslation"] = {
            "manifest": str(MANIFEST_PATH.relative_to(ROOT)),
            "annotator": "scripts/annotate-vietnam-current-english.py",
            "catalogue": catalogue_path,
            "translatedUnitCount": summary["unitCount"],
            "translationParagraphCount": summary["translationParagraphCount"],
            "status": "project-authored-reference-translation-no-legal-effect",
            "coverageStatus": "complete-current-project-reference",
            "currentTextEquivalent": True,
            "alignmentStatus": "aligned-to-pinned-current-official-vietnamese",
            "license": "CC BY 4.0",
            "legalEffectStatus": "in-force",
            "authorityWarning": "This is not an issuing-authority translation and has no legal effect; official Vietnamese controls.",
        }
    cautions = handoff.get("integration", {}).get("cautions", [])
    cautions = [item for item in cautions if not re.search(r"No English toggle text", item, flags=re.IGNORECASE)]
    english_caution = (
        "English views for all three Vietnamese corpora are nonofficial machine-assisted project references; "
        "the official Vietnamese text controls and the English must not be labeled official."
    )
    if english_caution not in cautions:
        cautions.append(english_caution)
    handoff.setdefault("integration", {})["cautions"] = cautions
    return handoff


def annotate(check_only: bool = False) -> tuple[list[tuple[list[dict], dict]], dict, dict]:
    results = [annotate_corpus(config) for config in CONFIGS]
    summaries = [summary for _corpus, summary in results]
    manifest = build_manifest(summaries)
    audit = update_foreign_audit(json.loads(FOREIGN_AUDIT_PATH.read_text(encoding="utf-8")))
    handoff = update_handoff(json.loads(HANDOFF_PATH.read_text(encoding="utf-8")), summaries)
    if not check_only:
        for config, (corpus, _summary) in zip(CONFIGS, results, strict=True):
            config["corpusPath"].write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        FOREIGN_AUDIT_PATH.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        HANDOFF_PATH.write_text(json.dumps(handoff, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return results, manifest, audit


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate inputs and computed annotations without writing")
    args = parser.parse_args()
    results, manifest, _audit = annotate(check_only=args.check)
    counts = ", ".join(f"{summary['instrumentNumber']}: {len(corpus)} nodes" for corpus, summary in results)
    print(f"Vietnam current-regime English: {counts}; {manifest['scope']['translationParagraphCount']} paragraphs; check={args.check}")


if __name__ == "__main__":
    main()
