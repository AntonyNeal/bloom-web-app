# Proto-Bloom System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROTO-BLOOM MVP                               │
│              Application Management System                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
│                     (Azure Static Web App)                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐          ┌─────────────────────┐              │
│  │   /join-us          │          │   /admin            │              │
│  │  (JoinUs.tsx)       │          │  (ApplicationMgmt)  │              │
│  ├─────────────────────┤          ├─────────────────────┤              │
│  │ • Name, Email       │          │ • Application List  │              │
│  │ • AHPRA #           │          │ • Status Dashboard  │              │
│  │ • Experience        │          │ • Detail View       │              │
│  │ • Cover Letter      │          │ • Status Updates    │              │
│  │ • File Uploads      │          │ • Document Links    │              │
│  └──────────┬──────────┘          └──────────┬──────────┘              │
│             │                                 │                          │
│             └────────────┬────────────────────┘                          │
│                          │                                               │
│                          ▼                                               │
│                  ┌───────────────┐                                       │
│                  │  API Config   │                                       │
│                  │  (api.ts)     │                                       │
│                  └───────┬───────┘                                       │
│                          │                                               │
└──────────────────────────┼───────────────────────────────────────────────┘
                           │
                           │ HTTPS (REST API)
                           │
┌──────────────────────────▼───────────────────────────────────────────────┐
│                         BACKEND API                                       │
│                    (Azure Functions v4)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐        ┌──────────────────────┐               │
│  │  /api/applications   │        │  /api/upload         │               │
│  ├──────────────────────┤        ├──────────────────────┤               │
│  │ GET    - List all    │        │ POST - Upload file   │               │
│  │ GET id - Get single  │        │        to Blob       │               │
│  │ POST   - Create new  │        │        Storage       │               │
│  │ PUT id - Update      │        └──────────┬───────────┘               │
│  └──────────┬───────────┘                   │                            │
│             │                               │                            │
└─────────────┼───────────────────────────────┼────────────────────────────┘
              │                               │
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│   AZURE SQL DATABASE    │    │   AZURE BLOB STORAGE         │
├─────────────────────────┤    ├──────────────────────────────┤
│                         │    │                              │
│  applications table     │    │  Container: applications     │
│  ┌──────────────────┐  │    │  ┌────────────────────────┐  │
│  │ id               │  │    │  │ Folders:               │  │
│  │ first_name       │  │    │  │  - cv/                 │  │
│  │ last_name        │  │    │  │  - certificate/        │  │
│  │ email (UNIQUE)   │  │    │  │  - photo/              │  │
│  │ phone            │  │    │  │                        │  │
│  │ ahpra_reg        │  │    │  │ Files:                 │  │
│  │ experience_years │  │    │  │  {timestamp}-{name}    │  │
│  │ cv_url           │◄─┼────┼──│  .pdf, .doc, .jpg      │  │
│  │ certificate_url  │◄─┼────┼──│                        │  │
│  │ photo_url        │◄─┼────┼──│                        │  │
│  │ cover_letter     │  │    │  │                        │  │
│  │ status           │  │    │  └────────────────────────┘  │
│  │ created_at       │  │    │                              │
│  │ updated_at       │  │    │  Access: Private             │
│  │ reviewed_by      │  │    │  URLs: Pre-signed            │
│  │ reviewed_at      │  │    │                              │
│  └──────────────────┘  │    └──────────────────────────────┘
│                         │
│  Indexes:               │
│   - status              │
│   - created_at DESC     │
│   - email               │
└─────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            USER FLOWS
═══════════════════════════════════════════════════════════════════════════

FLOW 1: Application Submission
───────────────────────────────

  1. Psychologist visits life-psychology.com.au/#/join-us
  2. Fills in form (name, email, AHPRA, experience, cover letter)
  3. Uploads files (CV, AHPRA certificate, optional photo)
     ↓
  4. Frontend: Uploads files one by one to /api/upload
     ↓
  5. Backend: Saves files to Blob Storage → returns URLs
     ↓
  6. Frontend: Submits complete application to /api/applications (POST)
     ↓
  7. Backend: Saves to SQL Database with status="submitted"
     ↓
  8. Frontend: Shows success message
     ↓
  9. Psychologist sees confirmation screen


FLOW 2: Admin Review
─────────────────────

  1. Admin visits life-psychology.com.au/#/admin
     ↓
  2. Frontend: Fetches applications from /api/applications (GET)
     ↓
  3. Backend: Queries SQL Database → returns all applications
     ↓
  4. Frontend: Displays list with status badges + count summary
     ↓
  5. Admin clicks an application
     ↓
  6. Frontend: Shows full details (right panel)
     ↓
  7. Admin clicks document link
     ↓
  8. Browser opens Blob Storage URL (pre-signed)
     ↓
  9. Admin reviews and clicks "Approve"
     ↓
  10. Frontend: Calls /api/applications/{id} (PUT) with status="approved"
     ↓
  11. Backend: Updates SQL Database, sets reviewed_by and reviewed_at
     ↓
  12. Frontend: Updates UI with new status badge


═══════════════════════════════════════════════════════════════════════════
                          DATA FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════════

Application Submission:
─────────────────────────

  Browser                API                  Blob Storage        SQL DB
    │                     │                         │               │
    ├─ Upload CV ────────►│                         │               │
    │                     ├─ Save file ────────────►│               │
    │◄─ cv_url ───────────┤◄─ Confirm ──────────────┤               │
    │                     │                         │               │
    ├─ Upload Cert ──────►│                         │               │
    │                     ├─ Save file ────────────►│               │
    │◄─ cert_url ─────────┤◄─ Confirm ──────────────┤               │
    │                     │                         │               │
    ├─ Submit App ───────►│                         │               │
    │   (with URLs)       ├─ INSERT ───────────────────────────────►│
    │◄─ Success ──────────┤◄─ Confirm ──────────────────────────────┤
    │                     │                         │               │


Admin Status Update:
────────────────────

  Browser                API                  SQL DB
    │                     │                      │
    ├─ Update Status ────►│                      │
    │   PUT /apps/123     ├─ UPDATE ────────────►│
    │   {status:approved} │   SET status=approved│
    │                     │   WHERE id=123       │
    │◄─ Updated App ──────┤◄─ Return row ────────┤
    │   (new status)      │                      │


═══════════════════════════════════════════════════════════════════════════
                        SECURITY & ACCESS
═══════════════════════════════════════════════════════════════════════════

Current (MVP):
─────────────
✅ HTTPS for all communication
✅ Private blob storage (no public access)
✅ SQL injection protection (parameterized queries)
✅ File type validation
✅ CORS configured
✅ Input validation

⚠️  No authentication (manual admin access only)
⚠️  No rate limiting
⚠️  No email verification

Future (Phase 2):
────────────────
🔒 Azure AD B2C authentication for admin portal
🔒 Email verification for applicants
🔒 Rate limiting on API endpoints
🔒 IP allowlist for admin access
🔒 Audit logging for all status changes


═══════════════════════════════════════════════════════════════════════════
                        DEPLOYMENT TOPOLOGY
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                         AZURE CLOUD                                      │
│                      (Australia East)                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Resource Group: lpa-resources                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐          │    │
│  │  │ Static Web App       │    │ Function App         │          │    │
│  │  │ lpa-bloom-web        │    │ lpa-bloom-functions  │          │    │
│  │  ├──────────────────────┤    ├──────────────────────┤          │    │
│  │  │ • React app (dist/)  │    │ • Node.js 18         │          │    │
│  │  │ • Custom domain:     │    │ • Consumption plan   │          │    │
│  │  │   life-psychology    │    │ • 2 functions        │          │    │
│  │  │   .com.au            │    │ • CORS enabled       │          │    │
│  │  └──────────────────────┘    └──────────────────────┘          │    │
│  │                                                                  │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐          │    │
│  │  │ SQL Server           │    │ Storage Account      │          │    │
│  │  │ lpa-sql-server       │    │ lpaapplicationstorage│          │    │
│  │  ├──────────────────────┤    ├──────────────────────┤          │    │
│  │  │ • Basic tier (5 DTU) │    │ • Hot tier, LRS      │          │    │
│  │  │ • Database:          │    │ • Container:         │          │    │
│  │  │   lpa-bloom-db       │    │   applications       │          │    │
│  │  │ • Firewall rules     │    │ • Private access     │          │    │
│  │  └──────────────────────┘    └──────────────────────┘          │    │
│  │                                                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  All resources connected via Azure backbone network                     │
│  Managed identity for secure auth between services (future)             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

                              ▲
                              │ GitHub Actions
                              │ (CI/CD Pipeline)
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                      GITHUB                                │
│  Repository: AntonyNeal/bloom-web-app                     │
│  Branch: staging                                          │
│                                                            │
│  On push:                                                 │
│   1. Build frontend (npm run build)                       │
│   2. Deploy to Static Web App                             │
│                                                            │
│  Manual:                                                  │
│   1. Deploy Functions (func azure functionapp publish)    │
│                                                            │
└────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         COST OPTIMIZATION
═══════════════════════════════════════════════════════════════════════════

Resource                 Tier              Monthly Cost    Scaling Strategy
─────────────────────────────────────────────────────────────────────────────
Static Web App          Free              $0              Upgrade to Standard
                                                          when >100GB bandwidth

Function App            Consumption       ~$0.20          Auto-scales
                                                          Pay per execution

SQL Database            Basic (5 DTU)     ~$5             Upgrade to S0 when
                                                          >100 applications

Blob Storage            Hot, LRS          ~$1             Monitor size, consider
                                                          archiving old files

Application Insights    Included          $0              Set retention to 90 days
─────────────────────────────────────────────────────────────────────────────
TOTAL                                     ~$6.20/month

Expected at 100 applications/month: ~$12/month
Expected at 500 applications/month: ~$35/month


═══════════════════════════════════════════════════════════════════════════
                            MONITORING
═══════════════════════════════════════════════════════════════════════════

Metrics to Track:
─────────────────
• Application submission rate (per day/week)
• File upload success rate
• API response times
• Database query performance
• Storage usage
• Failed uploads (error rate)
• Status transition counts

Alerts to Configure:
───────────────────
🔔 API error rate > 5%
🔔 Database DTU usage > 80%
🔔 Storage approaching quota
🔔 Function execution failures
🔔 Unusual traffic spikes

Dashboards:
──────────
📊 Application funnel (submitted → reviewing → approved)
📊 Time-to-review metric
📊 Daily/weekly submission trends
📊 Geographic distribution (if tracking)


═══════════════════════════════════════════════════════════════════════════

                    🎉 PROTO-BLOOM MVP COMPLETE 🎉

═══════════════════════════════════════════════════════════════════════════
