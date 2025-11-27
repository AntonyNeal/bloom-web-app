# Halaxy Sync Service - Compliance Research Proposal

**Project:** Bloom Platform - Halaxy Data Synchronisation Service  
**Date:** November 27, 2025  
**Version:** 1.0  
**Status:** Research Required Before Implementation  

---

## Executive Summary

Before implementing the Halaxy Sync Service that synchronises clinical practice data from Halaxy (source of truth) to the Bloom database, we must conduct comprehensive compliance research to ensure the system meets all applicable federal and state regulations, and adheres to professional peak body guidelines.

This proposal outlines the regulatory landscape that must be researched and documented before development proceeds.

---

## 1. Research Objectives

### Primary Objectives
1. Identify all applicable privacy, health, and data protection regulations
2. Document compliance requirements for handling psychological/mental health data
3. Establish data governance framework aligned with peak body guidelines
4. Define technical and procedural controls required for compliance
5. Create compliance checklist for implementation sign-off

### Deliverables
- [ ] Compliance Requirements Matrix
- [ ] Data Classification and Handling Policy
- [ ] Technical Controls Specification
- [ ] Privacy Impact Assessment (PIA) template
- [ ] Third-Party Data Sharing Agreement requirements
- [ ] Incident Response Plan requirements

---

## 2. Federal Regulatory Framework

### 2.1 Privacy Act 1988 (Cth) - Australian Privacy Principles (APPs)

**Research Required:**
| APP | Description | Research Questions |
|-----|-------------|-------------------|
| APP 1 | Open and transparent management | What privacy policy updates are needed? |
| APP 3 | Collection of solicited personal information | Is the collection necessary for Bloom's functions? |
| APP 5 | Notification of collection | How do we notify clients their data is synced? |
| APP 6 | Use or disclosure | Can we use Halaxy data for Bloom dashboard purposes? |
| APP 8 | Cross-border disclosure | Where are Azure servers located? Is data kept in Australia? |
| APP 11 | Security of personal information | What security controls are mandated? |
| APP 12 | Access to personal information | How do clients access/correct synced data? |
| APP 13 | Correction of personal information | How do corrections flow between systems? |

**Key Questions:**
- Does syncing data from Halaxy to Bloom constitute a "disclosure" under APP 6?
- Is Bloom considered a "related body corporate" or requires separate consent?
- What constitutes "reasonable steps" for data security (APP 11)?

### 2.2 Health Records and Information Privacy Act 2002 (NSW)

**Research Required:**
- Health Privacy Principles (HPPs) applicable to health service providers
- Definition of "health information" and whether Bloom data qualifies
- Requirements for electronic health record systems
- Consent requirements specific to NSW health data

**Key Questions:**
- Is Life Psychology Australia bound by HRIP Act as a private health service?
- What HPPs specifically govern electronic data transfer between systems?
- Are there additional notification requirements for NSW residents?

### 2.3 My Health Records Act 2012 (Cth)

**Research Required:**
- Relationship between practice management systems and My Health Record
- Whether Bloom integration triggers any MHR obligations
- Data segregation requirements

**Key Questions:**
- Does Bloom need to be registered as a conformant clinical software?
- Are there restrictions on what data can be extracted from MHR-connected systems?

### 2.4 Notifiable Data Breaches (NDB) Scheme

**Research Required:**
- Threshold for "eligible data breach" involving health information
- Notification timeline requirements (72 hours)
- Remediation obligations
- Record-keeping requirements

**Deliverable:** Data Breach Response Plan specific to synced health data

---

## 3. State-Specific Regulations

### 3.1 New South Wales
- Health Records and Information Privacy Act 2002 (NSW)
- Health Practitioner Regulation National Law (NSW)
- NSW Health Privacy Manual requirements

### 3.2 Victoria
- Health Records Act 2001 (Vic)
- Health Privacy Principles (Victoria)

### 3.3 Queensland  
- Information Privacy Act 2009 (Qld)
- Hospital and Health Boards Act 2011 (Qld) - if applicable

### 3.4 Other States/Territories
- Research requirements for SA, WA, TAS, NT, ACT
- Identify clients' geographic distribution to prioritise research

**Key Questions:**
- Which state laws apply when practitioner is in one state, client in another?
- Does Azure Australia East (Sydney) hosting satisfy all state requirements?

---

## 4. Peak Body Guidelines

### 4.1 Australian Psychological Society (APS)

**Documents to Review:**
- APS Code of Ethics (2007, amended 2017)
- APS Ethical Guidelines on Confidentiality
- APS Guidelines on Record Keeping
- APS Digital Mental Health Guidelines

**Key Research Areas:**
| Guideline Area | Research Questions |
|----------------|-------------------|
| Confidentiality | What constitutes adequate protection for electronic records? |
| Informed Consent | Must clients consent to data being synced to a secondary system? |
| Record Keeping | How long must synced records be retained? Who owns them? |
| Third-Party Access | Does Bloom staff/system access require client notification? |
| Data Minimisation | Should we sync only essential data or full records? |

### 4.2 Psychology Board of Australia (PsyBA)

**Documents to Review:**
- Guidelines on Record Keeping
- Registration Standards
- Code of Conduct for Registered Health Practitioners

**Key Questions:**
- Does the sync service need to maintain audit trails for professional records?
- What are the mandatory record retention periods?
- How do professional indemnity requirements apply to electronic systems?

### 4.3 Australian Health Practitioner Regulation Agency (AHPRA)

**Research Required:**
- National Law requirements for health records
- Mandatory notifications if breach affects clinical records
- Cross-border practice considerations

### 4.4 Medicare/Department of Health

**Research Required:**
- Requirements for systems handling Medicare/MBS billing data
- PRODA authentication requirements (if applicable)
- Better Access Initiative documentation requirements

---

## 5. Technical Compliance Requirements

### 5.1 Data Security Standards

**Research Required:**
| Standard | Applicability | Research Questions |
|----------|--------------|-------------------|
| ISO 27001 | Information Security | Should Bloom achieve certification? |
| ISO 27701 | Privacy Management | Extension of 27001 for health data? |
| NIST Cybersecurity Framework | Security Controls | Which controls are mandatory for health? |
| Australian Government ISM | Security Manual | Required for government-funded clients? |

### 5.2 Azure Compliance

**Research Required:**
- Azure IRAP certification status (Australian government)
- Azure compliance with Australian Privacy Principles
- Data residency guarantees for Australia East region
- Azure SQL Database encryption and compliance certifications

**Key Questions:**
- Does Azure's compliance cover our specific use case?
- What shared responsibility model obligations fall on us?
- Are there specific Azure configurations required for health data?

### 5.3 Halaxy Platform Compliance

**Research Required:**
- Halaxy's published compliance certifications
- Halaxy API terms of service regarding data use
- Data Processing Agreement (DPA) requirements
- Halaxy's data residency and security documentation

**Key Questions:**
- What does Halaxy's DPA permit regarding data extraction?
- Are there API rate limits that affect sync frequency?
- What audit logs does Halaxy provide for compliance?

---

## 6. Consent and Notification Requirements

### 6.1 Client Consent Model

**Research Required:**
- Is explicit consent required for syncing, or is implicit consent sufficient?
- Can consent be obtained via practice intake forms?
- How do we handle clients who opt-out of sync?
- Are there different requirements for existing vs new clients?

**Proposed Consent Types to Evaluate:**
1. **Opt-in explicit consent** - Clients actively agree to sync
2. **Opt-out model** - Sync is default, clients can decline
3. **Bundled consent** - Part of general practice management consent
4. **No additional consent** - Covered by existing Halaxy consent

### 6.2 Practitioner Notification

**Research Required:**
- Do practitioners need to be informed their data is synced?
- Employment contract implications
- Professional indemnity notification requirements

### 6.3 Privacy Policy Updates

**Deliverable:** Draft privacy policy clauses for review covering:
- What data is collected/synced
- Purpose of the sync
- Who has access
- How long data is retained
- Rights to access and correction
- Complaint handling process

---

## 7. Data Governance Framework

### 7.1 Data Classification

**Research Required:**
| Data Element | Sensitivity | Classification Needed |
|--------------|-------------|----------------------|
| Client name/initials | High | Personal Information |
| Session dates/times | Medium | Appointment Information |
| Presenting issues | Very High | Sensitive Health Information |
| MHCP session counts | High | Health Service Information |
| Billing amounts | Medium | Financial Information |
| Practitioner details | Low-Medium | Professional Information |

### 7.2 Data Minimisation Principle

**Research Questions:**
- What is the minimum data required for Bloom dashboard functionality?
- Should we sync full presenting issues or use coded categories?
- Can we anonymise or pseudonymise synced data?
- Should client names ever be synced, or only initials?

### 7.3 Data Retention and Deletion

**Research Required:**
- Minimum retention periods under various regulations
- Maximum retention periods (data minimisation)
- Right to erasure (deletion) obligations
- Synchronisation of deletions from Halaxy to Bloom
- Backup retention implications

**Key Question:** When a client's record is deleted in Halaxy, what are our obligations?

---

## 8. Risk Assessment

### 8.1 Privacy Impact Assessment (PIA)

**Action Required:** Conduct formal PIA covering:
1. Description of the project and data flows
2. Mapping of personal information handled
3. Privacy risk identification
4. Risk mitigation strategies
5. Compliance verification
6. Ongoing review mechanisms

### 8.2 Identified Risk Categories

| Risk Category | Examples | Research Priority |
|---------------|----------|------------------|
| Data Breach | Unauthorised access to synced health data | Critical |
| Consent Failure | Syncing without valid consent | Critical |
| Regulatory Non-Compliance | Breaching APP or state health laws | Critical |
| Professional Misconduct | Breaching APS/PsyBA guidelines | High |
| Cross-Border Issues | Data accessed from outside Australia | High |
| Vendor Lock-In | Halaxy API changes breaking compliance | Medium |
| Audit Failure | Unable to demonstrate compliance | Medium |

---

## 9. Implementation Prerequisites

### Before Development Can Proceed:

- [ ] Complete all regulatory research sections above
- [ ] Obtain legal review of compliance findings
- [ ] Complete Privacy Impact Assessment
- [ ] Establish Data Processing Agreement with any third parties
- [ ] Update client-facing privacy policy
- [ ] Develop consent collection mechanism (if required)
- [ ] Document security controls and audit requirements
- [ ] Create compliance sign-off checklist
- [ ] Establish ongoing compliance monitoring plan

---

## 10. Research Methodology

### 10.1 Primary Sources
- Federal and state legislation (AustLII, legislation.gov.au)
- OAIC guidance materials and determinations
- APS publications and ethics resources
- AHPRA/PsyBA guidelines and codes
- Azure Trust Center documentation
- Halaxy compliance documentation

### 10.2 Consultation
- Privacy/health law legal advisor
- APS Ethics Committee (if clarification needed)
- OAIC enquiries line (general guidance)
- Azure Australia compliance team
- Halaxy enterprise support

### 10.3 Peer Review
- Review similar systems (other practice management integrations)
- Consult with other psychology practices using similar setups
- Industry body resources (Private Mental Health Consumer Carer Network)

---

## 11. Timeline

| Phase | Activities | Duration | 
|-------|-----------|----------|
| Phase 1 | Federal regulatory research (Privacy Act, NDB, MHR) | 2 weeks |
| Phase 2 | State regulatory research (NSW priority, then others) | 2 weeks |
| Phase 3 | Peak body guidelines research (APS, PsyBA, AHPRA) | 1 week |
| Phase 4 | Technical compliance research (Azure, Halaxy, security) | 1 week |
| Phase 5 | Privacy Impact Assessment | 2 weeks |
| Phase 6 | Legal review and recommendations | 2 weeks |
| Phase 7 | Policy and documentation drafting | 2 weeks |
| Phase 8 | Final compliance sign-off | 1 week |

**Total Estimated Duration:** 13 weeks (before implementation begins)

---

## 12. Budget Considerations

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Legal consultation (privacy/health law) | $5,000 - $15,000 | Dependent on complexity |
| Privacy Impact Assessment | $3,000 - $8,000 | External PIA consultant |
| APS consultation/resources | $500 - $1,000 | Membership resources |
| Azure compliance verification | $0 - $2,000 | May require architect review |
| Documentation and policy drafting | Internal | Staff time allocation |

**Total Estimated Budget:** $8,500 - $26,000

---

## 13. Approval and Sign-Off

### Research Proposal Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| Clinical Director | | | |
| Privacy Officer | | | |
| Technical Lead | | | |

### Compliance Research Completion Sign-Off

| Milestone | Completed By | Verified By | Date |
|-----------|--------------|-------------|------|
| Federal Regulatory Research | | | |
| State Regulatory Research | | | |
| Peak Body Guidelines Research | | | |
| Technical Compliance Research | | | |
| Privacy Impact Assessment | | | |
| Legal Review | | | |
| Final Compliance Approval | | | |

---

## Appendices

### Appendix A: Key Legislation Links
- [Privacy Act 1988](https://www.legislation.gov.au/Details/C2021C00139)
- [Health Records and Information Privacy Act 2002 (NSW)](https://legislation.nsw.gov.au/view/html/inforce/current/act-2002-071)
- [My Health Records Act 2012](https://www.legislation.gov.au/Details/C2021C00475)
- [OAIC Australian Privacy Principles Guidelines](https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines)

### Appendix B: Peak Body Resources
- [APS Code of Ethics](https://psychology.org.au/for-members/resource-finder/resources/ethics/code-of-ethics)
- [Psychology Board of Australia Guidelines](https://www.psychologyboard.gov.au/Standards-and-Guidelines/Codes-Guidelines-Policies.aspx)
- [AHPRA Registration Standards](https://www.ahpra.gov.au/Registration/Registration-Standards.aspx)

### Appendix C: Technical Standards
- [Australian Government Information Security Manual (ISM)](https://www.cyber.gov.au/acsc/view-all-content/ism)
- [Azure Australia Compliance](https://docs.microsoft.com/en-us/azure/compliance/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Appendix D: Glossary
- **APP** - Australian Privacy Principles
- **AHPRA** - Australian Health Practitioner Regulation Agency
- **APS** - Australian Psychological Society
- **HPP** - Health Privacy Principles (NSW)
- **HRIP Act** - Health Records and Information Privacy Act 2002 (NSW)
- **MBS** - Medicare Benefits Schedule
- **MHCP** - Mental Health Care Plan (Better Access Initiative)
- **NDB** - Notifiable Data Breaches scheme
- **OAIC** - Office of the Australian Information Commissioner
- **PIA** - Privacy Impact Assessment
- **PsyBA** - Psychology Board of Australia

---

*This research proposal was prepared as a prerequisite to the Halaxy Sync Service implementation. No development should proceed until the compliance research is completed and approved.*
