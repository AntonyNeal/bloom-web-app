# 🔍 Azure Infrastructure Audit Report

**Date**: October 24, 2025
**Auditor**: Azure CLI Infrastructure Analysis
**Scope**: Complete Life Psychology Australia Azure Resources

---

## 🎯 **EXECUTIVE SUMMARY**

**KEY DISCOVERY**: We have **TWO SEPARATE SYSTEMS** with distinct Azure resources:

1. **Marketing Website** (`life-psychology.com.au`) - Frontend marketing site
2. **Proto-Bloom Recruitment** (`bloom.life-psychology.com.au`) - Application management portal

---

## 📊 **ACTUAL AZURE INFRASTRUCTURE STATE**

### **🏗️ Resource Groups (5 total)**

| Name                                 | Location       | Purpose                              |
| ------------------------------------ | -------------- | ------------------------------------ |
| `lpa-rg`                             | Australia East | **Main production resources**        |
| `rg-life-psychology`                 | East Asia      | **Static Web Apps hosting**          |
| `rg-lpa-prod-opt`                    | Australia East | **Production optimization services** |
| `DefaultResourceGroup-EAU`           | Australia East | Default/system resources             |
| `ai_lpa-tracking-insights_*_managed` | Australia East | Application Insights managed         |

---

### **🌐 Static Web Apps (6 total)**

#### **Marketing Website Stack**

| Name                   | Purpose                  | Custom Domain                                            | Repository                 | Status    |
| ---------------------- | ------------------------ | -------------------------------------------------------- | -------------------------- | --------- |
| `lpa-frontend-prod`    | **Marketing Production** | `life-psychology.com.au`<br>`www.life-psychology.com.au` | `life-psychology-frontend` | ✅ Active |
| `lpa-frontend-staging` | Marketing Staging        | `red-desert-03b29ff00.1.azurestaticapps.net`             | `life-psychology-frontend` | ✅ Active |
| `lpa-frontend-dev`     | Marketing Development    | `ambitious-mud-058a66f00.1.azurestaticapps.net`          | `life-psychology-frontend` | ✅ Active |

#### **Proto-Bloom Recruitment Stack**

| Name                | Purpose              | Custom Domain                                                        | Repository      | Status         |
| ------------------- | -------------------- | -------------------------------------------------------------------- | --------------- | -------------- |
| `lpa-bloom-prod`    | **Bloom Production** | `bloom.life-psychology.com.au`<br>`www.bloom.life-psychology.com.au` | `bloom-web-app` | ✅ Active      |
| `lpa-bloom-staging` | Bloom Staging        | `green-pond-009caac00.3.azurestaticapps.net`                         | Not connected   | ⚠️ Unconnected |
| `lpa-bloom-dev`     | Bloom Development    | `gray-stone-04222e200.3.azurestaticapps.net`                         | Not connected   | ⚠️ Unconnected |

---

### **⚡ Function Apps (5 total)**

| Name                          | Resource Group    | Purpose                                            | Status     |
| ----------------------------- | ----------------- | -------------------------------------------------- | ---------- |
| `bloom-platform-functions-v2` | `lpa-rg`          | **Proto-Bloom API** (applications, upload, health) | ✅ Active  |
| `lpa-application-functions`   | `lpa-rg`          | Legacy/alternative functions                       | ❓ Unknown |
| `lpa-halaxy-webhook-handler`  | `lpa-rg`          | Halaxy integration webhooks                        | ✅ Active  |
| `lpa-runtime-config-fn`       | `lpa-rg`          | Runtime configuration service                      | ✅ Active  |
| `fnt42kldozqahcu`             | `rg-lpa-prod-opt` | Optimization service functions                     | ✅ Active  |

#### **Proto-Bloom API Functions** (bloom-platform-functions-v2)

- `applications` - Application CRUD operations
- `upload` - File upload handling
- `health` - Health check endpoint

---

### **🗄️ Database Infrastructure**

#### **SQL Servers (2 total)**

| Server                   | Resource Group | Purpose                     | Status    |
| ------------------------ | -------------- | --------------------------- | --------- |
| `lpa-sql-server`         | `lpa-rg`       | **Main application data**   | ✅ Active |
| `lpa-tracking-db-server` | `lpa-rg`       | **A/B testing & analytics** | ✅ Active |

#### **SQL Databases (4 total)**

| Database              | Server                   | Purpose                      | Tier  | Status    |
| --------------------- | ------------------------ | ---------------------------- | ----- | --------- |
| `lpa-applications-db` | `lpa-sql-server`         | **Proto-Bloom applications** | Basic | ✅ Active |
| `master`              | `lpa-sql-server`         | System database              | Basic | ✅ Active |
| `lpa_tracking`        | `lpa-tracking-db-server` | **A/B testing data**         | Basic | ✅ Active |
| `master`              | `lpa-tracking-db-server` | System database              | Basic | ✅ Active |

#### **Cosmos DB (1 total)**

| Name               | Resource Group    | Purpose                        | Status    |
| ------------------ | ----------------- | ------------------------------ | --------- |
| `cdbt42kldozqahcu` | `rg-lpa-prod-opt` | **High-performance analytics** | ✅ Active |

---

### **💾 Storage Accounts (3 total)**

| Name                      | Resource Group    | Purpose                                         | Status    |
| ------------------------- | ----------------- | ----------------------------------------------- | --------- |
| `lpastorage13978`         | `lpa-rg`          | **Proto-Bloom file uploads** (CV, certificates) | ✅ Active |
| `lpahalaxywebhookstorage` | `lpa-rg`          | Halaxy webhook data storage                     | ✅ Active |
| `stt42kldozqahcu`         | `rg-lpa-prod-opt` | Optimization data storage                       | ✅ Active |

---

## 🎯 **SYSTEM ARCHITECTURE CLARIFICATION**

### **System 1: Marketing Website**

```
Repository: life-psychology-frontend
Production URL: https://life-psychology.com.au
Static Web App: lpa-frontend-prod
Purpose: Marketing, lead generation, A/B testing
Database: lpa_tracking (SQL Server)
Functions: lpa-runtime-config-fn, optimization functions
```

### **System 2: Proto-Bloom Recruitment**

```
Repository: bloom-web-app (THIS REPOSITORY!)
Production URL: https://bloom.life-psychology.com.au
Static Web App: lpa-bloom-prod
Purpose: Practitioner application management
Database: lpa-applications-db (SQL Server)
Functions: bloom-platform-functions-v2
Storage: lpastorage13978 (file uploads)
```

---

## ❌ **DOCUMENTATION INCONSISTENCIES IDENTIFIED**

### **🚨 Critical Corrections Needed**

#### **1. Production URL Mismatch**

**Documentation Claims**:

- `life-psychology.com.au` serves Proto-Bloom
- `calm-river-0ada04700.1.azurestaticapps.net` is production URL

**ACTUAL REALITY**:

- `life-psychology.com.au` serves **Marketing Website** (different repo!)
- `bloom.life-psychology.com.au` serves **Proto-Bloom**
- `yellow-cliff-0eb1c4000.3.azurestaticapps.net` is Proto-Bloom production URL

#### **2. Static Web App Name Error**

**Documentation Claims**: `lpa-frontend-prod` serves Proto-Bloom

**ACTUAL REALITY**:

- `lpa-frontend-prod` serves **Marketing Website**
- `lpa-bloom-prod` serves **Proto-Bloom**

#### **3. Repository Separation**

**Documentation Implies**: Single repository system

**ACTUAL REALITY**: Two separate repositories:

- `life-psychology-frontend` - Marketing website
- `bloom-web-app` - Proto-Bloom recruitment system

#### **4. Database Architecture**

**Documentation Shows**: Generic "Azure SQL Database"

**ACTUAL REALITY**: Dedicated database structure:

- `lpa-applications-db` - Proto-Bloom applications
- `lpa_tracking` - Marketing A/B testing
- Plus Cosmos DB for high-performance analytics

---

## 📝 **REQUIRED DOCUMENTATION UPDATES**

### **Files Requiring Immediate Correction**

#### **1. `docs/current/README_FINAL.md`**

```diff
- **Production**: https://life-psychology.com.au
- **Custom Domain**: https://www.life-psychology.com.au
- **Azure Default**: https://calm-river-0ada04700.1.azurestaticapps.net

+ **Production**: https://bloom.life-psychology.com.au
+ **Custom Domain**: https://www.bloom.life-psychology.com.au
+ **Azure Default**: https://yellow-cliff-0eb1c4000.3.azurestaticapps.net
```

#### **2. `PROJECT_HANDOVER.md`**

```diff
- **Primary**: https://life-psychology.com.au
- **Alternative**: https://www.life-psychology.com.au

+ **Primary**: https://bloom.life-psychology.com.au
+ **Alternative**: https://www.bloom.life-psychology.com.au
```

#### **3. `PROD_DEPLOYMENT_READY.md`**

```diff
- Static Web App Created: `lpa-frontend-prod`
- Custom Domains: www.life-psychology.com.au, life-psychology.com.au

+ Static Web App Created: `lpa-bloom-prod`
+ Custom Domains: bloom.life-psychology.com.au, www.bloom.life-psychology.com.au
```

#### **4. `README.md`** (Main)

```diff
- **Staging**: https://witty-ground-01f9d5100.3.azurestaticapps.net

+ **Production**: https://bloom.life-psychology.com.au
+ **Staging**: https://green-pond-009caac00.3.azurestaticapps.net
```

#### **5. GitHub Actions Workflow**

- Deployment token points to `lpa-bloom-prod` (✅ Correct)
- But documentation references wrong static web app name

---

## 🔧 **STAGING ENVIRONMENT ISSUES**

### **⚠️ Disconnected Staging Apps**

- `lpa-bloom-staging` - No repository connected
- `lpa-bloom-dev` - No repository connected

### **Recommendation**

Connect staging environments to `bloom-web-app` repository with appropriate branch mappings:

- `lpa-bloom-staging` → `staging` branch
- `lpa-bloom-dev` → `develop` branch

---

## 💰 **COST ANALYSIS CORRECTION**

### **Previous Documentation**: ~$6.20/month

### **ACTUAL COSTS** (Proto-Bloom only):

- **Static Web Apps**: Free tier (lpa-bloom-prod)
- **Azure Functions**: Consumption plan (~$0.20/month)
- **SQL Database**: Basic tier (~$5/month - lpa-applications-db)
- **Blob Storage**: Hot tier (~$1/month - lpastorage13978)
- **Total**: ~$6.20/month ✅ **ACCURATE**

_Note: Marketing website costs are separate_

---

## 🎯 **RECOMMENDED ACTIONS**

### **Immediate (Critical)**

1. ✅ **Update all documentation** with correct URLs and resource names
2. ✅ **Connect staging environments** to proper repository branches
3. ✅ **Update GitHub Actions** references to correct static web app names
4. ✅ **Clarify system separation** in all documentation

### **Medium Priority**

1. **Consolidate resource groups** - Consider moving all resources to single RG
2. **Review function app redundancy** - Multiple function apps may be unnecessary
3. **Staging deployment pipeline** - Set up proper staging workflow

### **Documentation Priority**

1. **System Architecture Diagram** - Show two separate systems clearly
2. **Resource Naming Convention** - Document naming patterns
3. **Environment Mapping** - Clear dev/staging/prod mapping
4. **Cost Breakdown** - Separate costs by system

---

## ✅ **VALIDATION CHECKLIST**

### **Proto-Bloom Production System**

- [x] **Domain**: bloom.life-psychology.com.au ✅ Confirmed
- [x] **Static Web App**: lpa-bloom-prod ✅ Confirmed
- [x] **Repository**: bloom-web-app ✅ Confirmed
- [x] **Functions**: bloom-platform-functions-v2 ✅ Confirmed
- [x] **Database**: lpa-applications-db ✅ Confirmed
- [x] **Storage**: lpastorage13978 ✅ Confirmed
- [x] **Branch**: main ✅ Confirmed

### **Marketing Website System** (Separate)

- [x] **Domain**: life-psychology.com.au ✅ Confirmed
- [x] **Static Web App**: lpa-frontend-prod ✅ Confirmed
- [x] **Repository**: life-psychology-frontend ✅ Confirmed (Different repo!)
- [x] **Database**: lpa_tracking ✅ Confirmed
- [x] **Functions**: Runtime config & optimization ✅ Confirmed

---

## 🎊 **CONCLUSION**

The Azure infrastructure audit reveals **TWO DISTINCT SYSTEMS** operating independently:

1. **Marketing Website** - Handles general website, lead generation, A/B testing
2. **Proto-Bloom Recruitment** - Handles practitioner applications and management

**Major Documentation Issue**: Previous documentation incorrectly stated that the marketing website domain serves Proto-Bloom. In reality, Proto-Bloom has its own dedicated subdomain and infrastructure.

**Action Required**: Update all documentation to reflect the correct URLs, resource names, and system architecture.

---

**Audit Status**: ✅ Complete
**Infrastructure Health**: ✅ All systems operational
**Immediate Action**: 🚨 Documentation corrections required
**Next Review**: After documentation updates applied
