# Minimum Compliance for Australian Telehealth Psychology Data Sync

> **Research Date**: November 2025  
> **Applicable To**: Life Psychology Australia - Bloom Platform  
> **Scope**: Halaxy → Azure Australia East data synchronization

---

## Executive Summary

**Internal data synchronization between Halaxy and a practice-controlled Azure database is classified as "use" under Australian privacy law—not "disclosure"—meaning no additional client consent is required.** For Life Psychology Australia's 1-2 clinician MVP, the compliance burden is substantially lighter than enterprise health data infrastructure. Most mandatory requirements are already covered by Halaxy's existing compliance and Azure's default security settings. The primary work falls into privacy policy updates, basic Azure configuration, and professional record-keeping standards rather than complex legal frameworks.

This research confirms that a small NSW-based telehealth psychology practice syncing data to Azure Australia East can achieve compliance with straightforward administrative steps, not enterprise-level privacy engineering.

---

## Table of Contents

1. [Privacy Act Classification](#privacy-act-classification-internal-sync-is-use-not-disclosure)
2. [NSW-Specific Requirements](#nsw-adds-transfer-requirements-but-doesnt-change-the-core-picture)
3. [Halaxy Coverage vs Practice Responsibility](#what-halaxys-compliance-covers-versus-what-falls-on-the-practice)
4. [Psychology Board Requirements](#psychology-board-requirements-for-secondary-storage-systems)
5. [Azure Australia East Compliance](#azure-australia-east-provides-compliant-by-default-hosting)
6. [Practical Compliance Checklist](#practical-minimum-compliance-checklist)
7. [Cost and Timeline Estimates](#estimated-azure-costs-and-implementation-timeline)
8. [When to Seek Legal Advice](#where-formal-legal-advice-may-genuinely-add-value)

---

## Privacy Act Classification: Internal Sync is "Use," Not "Disclosure"

The critical legal distinction that simplifies your compliance obligations comes from OAIC's APP Guidelines Chapter 6. The Privacy Act distinguishes between **"use"** (handling information within an entity's effective control) and **"disclosure"** (releasing information to parties outside the entity's control).

**Your scenario clearly qualifies as "use"** because Life Psychology Australia controls both systems—Halaxy as the primary system and Azure as the secondary database. OAIC explicitly states that "passing personal information from one part of the entity to another" constitutes use, not disclosure. The practice retains the right to access, amend, and delete information in both systems, and no external party gains access.

This classification has significant practical implications. Under APP 6, you can use health information for the **same primary purpose** it was collected for (providing healthcare services, practice management, business analytics) without triggering additional consent requirements. Syncing data to your own database for analytics or operational purposes falls squarely within "normal internal business practices" that OAIC lists as reasonable expected secondary uses.

### Mandatory Requirement

> Ensure the Azure database remains under the practice's operational control—meaning you retain full access rights, can amend or delete data, and no third party has independent access rights to the health information.

---

## NSW Adds Transfer Requirements But Doesn't Change the Core Picture

While federal Privacy Act governs most obligations, the **Health Records and Information Privacy Act 2002 (NSW)** adds a layer specifically relevant to your practice. Unlike federal law, which exempts small businesses under $3M turnover, NSW's HRIP Act captures all health service providers regardless of revenue—and psychology is explicitly listed in Section 4's definition of "health service."

### HPP 14 (Transfer of Health Information Outside NSW)

This is the key NSW-specific requirement. If your Azure data ever routes through servers outside NSW (including interstate or overseas), you must satisfy one of several conditions:

- The recipient is subject to substantially similar privacy protections, OR
- The individual consents to the transfer, OR  
- You've taken reasonable steps to ensure information won't be handled inconsistently with HPPs

**Using Azure Australia East (Sydney) largely neutralizes this concern.** Data stored in Australia East stays within Australian geography by default. Microsoft confirms customer data remains within the specified geography unless explicitly authorized otherwise. Standard Azure services like SQL Database and Blob Storage with Locally Redundant Storage (LRS) keep data in Sydney's data center.

### Record Retention Requirements

| Client Type | Retention Period | Legal Basis |
|-------------|------------------|-------------|
| Adults | **7 years** from last service date | HRIP Act Section 25 |
| Minors | Until client reaches **age 25** | HRIP Act Section 25 |

These requirements apply to all copies of records, including your Azure database. When eventually disposing of records, you must document:
- Patient's name
- Period covered
- Disposal date

---

## What Halaxy's Compliance Covers Versus What Falls on the Practice

Halaxy provides a solid compliance foundation for its platform, but transferable coverage for your own Azure infrastructure is limited.

### Halaxy Covers

| Capability | Details |
|------------|---------|
| Australian data residency | Melbourne-based, data centers in Australia |
| Encryption | 256-bit encryption for data within Halaxy |
| Payment security | PCI DSS Level 1 compliance |
| API authentication | OAuth 2.0 for API access |
| Healthcare interoperability | FHIR-standard API |
| Access controls | Role-based access controls within platform |

### Gaps in Halaxy's Public Documentation

- Formal ISO 27001/SOC 2 certifications (not found in public documentation)
- Explicit data processor agreement templates
- API rate limits
- Webhook signature verification documentation

> **Action**: Request Halaxy's full terms of service and any Data Processing Agreement directly before implementation.

### Practice Responsibilities (Your Azure Infrastructure)

- Security of data once extracted to Azure
- Access controls and authentication for the Azure database
- Audit logging and monitoring of the secondary system
- Compliance with professional record-keeping standards for synced data
- Privacy policy updates reflecting dual-system storage
- Data breach response for any breach affecting the Azure database

### API Implementation Notes

| Parameter | Value |
|-----------|-------|
| Authentication | OAuth 2.0 client credentials flow |
| Token validity | 15-60 minutes |
| Available data | Patients, appointments, clinical notes, invoices, practitioners |
| Monthly cost | ~$22.50-$33/month |
| Credential storage | **Azure Key Vault** (not in application code) |

---

## Psychology Board Requirements for Secondary Storage Systems

The Psychology Board of Australia's Code of Conduct (effective December 2025) and APS ethical guidelines create professional obligations that apply regardless of which system stores the data.

### Mandatory Professional Requirements for Electronic Records

Records must be:
- ✅ **Accurate, up-to-date, factual, objective, legible, and accessible**
- ✅ **Held securely with no unauthorized access**
- ✅ **Protected for privacy and integrity** (electronic records specifically mentioned)
- ✅ **Sufficient for another psychologist** to understand and continue care
- ✅ **Made contemporaneously** (at time of events or as soon as possible after)

### Audit Trail Requirements

Audit trails are **strongly recommended but not strictly mandatory** for small practices. However:

> **Psychology Council of NSW explicitly warns**: Tribunals and coroners will assume "if it's not written down, it did not happen."

This makes comprehensive audit trails a practical necessity even if not technically mandatory—you'll want evidence of who accessed what and when if records are ever scrutinized.

### Minimum Record Content Requirements

Synced data should preserve:
- Client identifying information
- Documented informed consent
- Confidentiality arrangements
- Presenting complaint and diagnosis
- Assessment information
- Treatment plans
- Contemporaneous session notes including:
  - Date
  - Duration
  - Intervention details
  - Future plans

---

## Azure Australia East Provides Compliant-by-Default Hosting

Azure's Australian infrastructure satisfies data residency requirements with substantial built-in security that requires minimal additional configuration.

### Data Residency Guarantee

Microsoft explicitly confirms: **"Customer data stays within Australia"** for Azure Australia East and Australia Southeast.

- Geo-redundant storage replicates only between Australian regions
- Locally Redundant Storage (LRS) keeps all data in Sydney's data center
- No configuration required for data residency compliance

### Relevant Azure Compliance Certifications

| Certification | Status | Relevance |
|--------------|--------|-----------|
| **IRAP** (Protected level) | ✅ 113+ services assessed | Australian government/health data standard |
| **ISO 27001** | ✅ Certified | Information security management |
| **ISO 27018** | ✅ Certified | Personal data protection in cloud |
| **SOC 2** | ✅ Attested | Security, availability, confidentiality |
| **HITRUST CSF** | ✅ Certified | Healthcare-specific security |

### Default Security (No Configuration Required)

| Security Feature | Default State |
|------------------|---------------|
| Encryption at rest | ✅ AES-256 (Azure Storage, SQL Database) |
| Encryption in transit | ✅ TLS 1.2 mandatory |
| SQL Transparent Data Encryption | ✅ Enabled by default since 2017 |
| Storage Server-Side Encryption | ✅ Automatic |

### Services to AVOID for Health Data

| Service | Reason |
|---------|--------|
| Azure Databricks | Stores identity data in US |
| Azure CDN | Global edge locations |
| Azure OpenAI "Global" deployments | May process anywhere |
| Preview/Beta services | Typically US-based |

### Recommended Services

- Azure SQL Database
- Azure Blob Storage
- Azure App Service
- Azure Key Vault
- Azure Functions (Australia East)

---

## Practical Minimum Compliance Checklist

### ✅ Mandatory Requirements

| Requirement | Details | Legal Basis |
|-------------|---------|-------------|
| ☐ **Privacy policy update** | Reference electronic clinical systems and cloud storage. Need not name specific systems, but must describe that data is stored in secure electronic systems and cloud databases | APP 1.4 |
| ☐ **Azure region selection** | Deploy exclusively in **Australia East** | HPP 14 |
| ☐ **Access controls** | Configure RBAC on Azure database; only authorized clinicians access synced data | APP 11 |
| ☐ **Multi-factor authentication** | Enable for all Azure admin accounts | APP 11 "reasonable steps" |
| ☐ **Encryption verification** | Confirm encryption at rest and transit are enabled (should be default) | APP 11 |
| ☐ **Retention compliance** | Implement 7-year retention for adults, age-25 retention for minors in database deletion logic | HRIP Act Section 25 |
| ☐ **Data breach response plan** | Document procedures for Notifiable Data Breach scheme compliance | Privacy Act Part IIIC |
| ☐ **Professional indemnity insurance** | Confirm coverage includes electronic record storage; notify insurer of Azure hosting arrangement | Professional requirement |

### 📋 Recommended Best Practices

| Practice | Benefit |
|----------|---------|
| ☐ **Audit logging** | Enable Azure Activity Logs, Storage Analytics, and SQL Auditing—provides essential defensibility |
| ☐ **Client information disclosure** | Add statement to intake forms noting records are maintained in secure electronic systems |
| ☐ **Azure Key Vault** | Store Halaxy API credentials securely rather than in application configuration |
| ☐ **Network restrictions** | Configure storage account firewall to restrict access to known IP addresses or VNet |
| ☐ **Quarterly access reviews** | Document periodic review of who has access to Azure resources |
| ☐ **Download Azure compliance artifacts** | Obtain IRAP assessment report from Microsoft Service Trust Portal for records |

### ❌ Not Required for This Scale

| Item | Why Not Required |
|------|------------------|
| **Formal Privacy Impact Assessment** | Not legally mandated for internal data sync. OAIC recommends PIAs for high-risk processing, but internal sync at small practice scale doesn't trigger this threshold |
| **Explicit additional consent for sync** | Since this is "use" not "disclosure," existing Halaxy consent and privacy policy coverage extends to the secondary database |
| **Data Processing Agreement with Microsoft** | Azure's standard Online Services Terms and Data Processing Addendum cover this |
| **ISO 27001 certification for the practice** | Disproportionate for 1-2 clinician scale; reasonable security measures satisfy APP 11 |

---

## Estimated Azure Costs and Implementation Timeline

### Minimum Monthly Azure Cost: $15-50/month

| Component | Tier | Approximate Cost |
|-----------|------|------------------|
| Azure SQL Database | Basic (5 DTUs, 2GB) | ~$7/month |
| Azure Blob Storage (LRS) | Hot tier, minimal data | ~$2-5/month |
| Azure Key Vault | Standard tier | ~$0.03/secret/month |
| Azure Monitor (basic logging) | Included | Free tier |

### Implementation Timeline

| Phase | Duration |
|-------|----------|
| Technical integration | 2-3 weeks |
| Compliance documentation | 1 week |
| **Total** | **3-4 weeks** |

---

## Where Formal Legal Advice May Genuinely Add Value

For a 1-2 clinician MVP, most compliance requirements are clear and straightforward from regulatory guidance. However, **consider brief legal review** for:

### Worth the Investment (~$500-1,000)

| Scenario | Value |
|----------|-------|
| **Privacy policy language** | Ensure specific wording satisfies APP 1.4 and HRIP Act notification requirements (1-2 hour review) |
| **Expanding beyond NSW** | Inter-state transfers trigger multiple state health records acts with varying requirements |
| **Adding AI/analytics features** | Processing health data through AI systems may change the "use" characterization |
| **Data breach scenario** | Have a lawyer on retainer for the hopefully-never-needed breach notification process |

### Overkill for This Scale

- Full legal opinion on the Halaxy-Azure sync structure
- Formal PIA document
- Engagement of a privacy consultant for initial implementation

> The regulatory framework is sufficiently clear that implementation can proceed with documented compliance rationale.

---

## Conclusion

Life Psychology Australia's proposed Halaxy-to-Azure sync sits in a compliance sweet spot:

1. ✅ Qualifies as internal **"use"** rather than "disclosure"
2. ✅ Uses **compliant-by-default** Azure Australia infrastructure
3. ✅ Operates at a scale where regulatory expectations are **proportionate**

### Essential Actions (Administrative, Not Technical)

1. Update your privacy policy
2. Configure Azure access controls and MFA
3. Enable audit logging
4. Document your compliance rationale

### Coverage Summary

| System | Compliance Coverage |
|--------|---------------------|
| **Halaxy** (source) | Existing certifications cover the source system |
| **Azure** (destination) | IRAP-assessed, encrypted-by-default infrastructure |

### Investment Required

- **Time**: Days of work, not weeks
- **Cost**: Hundreds of dollars in documentation, not thousands in consulting
- **Legal**: The regulatory framework supports sensible, proportionate implementation

---

## References

- [OAIC APP Guidelines Chapter 6 - Use and Disclosure](https://www.oaic.gov.au/privacy/australian-privacy-principles-guidelines/chapter-6-app-6-use-or-disclosure-of-personal-information)
- [Health Records and Information Privacy Act 2002 (NSW)](https://legislation.nsw.gov.au/view/html/inforce/current/act-2002-071)
- [Psychology Board of Australia Code of Conduct](https://www.psychologyboard.gov.au/Standards-and-Guidelines/Code-of-conduct.aspx)
- [APS Position Statement on Record Keeping (2020)](https://psychology.org.au/for-members/resource-finder/resources/ethics/record-keeping)
- [Microsoft Azure Australia Data Residency](https://azure.microsoft.com/en-au/explore/global-infrastructure/data-residency/)
- [Microsoft Service Trust Portal - Compliance Reports](https://servicetrust.microsoft.com/)
- [Halaxy Security & Compliance](https://www.halaxy.com/au/security)

---

*Document Version: 1.0*  
*Last Updated: November 2025*  
*Next Review: Before Halaxy Sync implementation begins*
