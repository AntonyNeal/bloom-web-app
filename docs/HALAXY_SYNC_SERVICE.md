# Halaxy Sync Service - Architecture Specification

## Overview

The Halaxy Sync Service keeps Bloom's database synchronized with Halaxy (the practice management system). This enables the Bloom practitioner dashboard to render real appointment/client data while Halaxy remains the **source of truth**.

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│     Halaxy      │◄────►│   Halaxy Sync Svc    │◄────►│    Bloom DB     │
│  (Source Truth) │      │   (Azure Function)   │      │   (SQL Server)  │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
        │                         │
        │ Webhooks                │ Scheduled Sync
        ▼                         ▼
┌─────────────────┐      ┌──────────────────────┐
│  Real-time      │      │   Full Reconcile     │
│  Updates        │      │   (Every 15 mins)    │
└─────────────────┘      └──────────────────────┘
```

## Why Sync Instead of Direct API Calls?

| Approach | Pros | Cons |
|----------|------|------|
| **Direct Halaxy API calls** | Always fresh | Slow (500ms+ per call), rate limits, single point of failure |
| **Sync to local DB** ✓ | Fast reads (<50ms), offline resilience, complex queries | Eventual consistency, sync complexity |

For a dashboard that loads multiple data points on every page view, the sync approach is essential.

---

## Architecture

### Components

1. **HalaxySyncService** - Core sync logic (Azure Function)
2. **Halaxy Webhook Handler** - Real-time event processing
3. **Scheduled Sync Job** - Full reconciliation every 15 minutes
4. **Sync Status Monitor** - Track sync health and errors

### Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                         HALAXY (FHIR-R4 API)                          │
│  /fhir/Practitioner  /fhir/Patient  /fhir/Appointment  /fhir/Invoice  │
└────────────────┬───────────────┬────────────────────────┬─────────────┘
                 │               │                        │
                 │  Webhooks     │  OAuth2 Token          │  Polling
                 ▼               ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     HALAXY SYNC SERVICE                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Webhook      │  │ Token        │  │ Scheduled    │                 │
│  │ Handler      │  │ Manager      │  │ Sync Job     │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│         ▼                 ▼                 ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Entity Transformers                          │  │
│  │  HalaxyToClient()  HalaxyToSession()  HalaxyToPractitioner()    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         BLOOM SQL DATABASE                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
│  │Practitioners│  │  Clients   │  │  Sessions  │  │ SyncStatus │      │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Database Schema
Create tables to store synced Halaxy data:

```sql
-- See: db/migrations/V4__practitioner_dashboard_schema.sql

CREATE TABLE practitioners (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_practitioner_id NVARCHAR(50) NOT NULL UNIQUE,
  halaxy_practitioner_role_id NVARCHAR(50),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  display_name NVARCHAR(200),
  email NVARCHAR(255) NOT NULL,
  -- ... more fields
  last_synced_at DATETIME2 NOT NULL
);

CREATE TABLE clients (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_patient_id NVARCHAR(50) NOT NULL UNIQUE,
  practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id),
  first_name NVARCHAR(100) NOT NULL,
  last_name NVARCHAR(100) NOT NULL,
  initials NVARCHAR(10) NOT NULL,
  -- MHCP tracking
  mhcp_total_sessions INT DEFAULT 10,
  mhcp_used_sessions INT DEFAULT 0,
  mhcp_plan_start_date DATE,
  mhcp_plan_expiry_date DATE,
  -- ... more fields
  last_synced_at DATETIME2 NOT NULL
);

CREATE TABLE sessions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  halaxy_appointment_id NVARCHAR(50) NOT NULL UNIQUE,
  practitioner_id UNIQUEIDENTIFIER NOT NULL REFERENCES practitioners(id),
  client_id UNIQUEIDENTIFIER NOT NULL REFERENCES clients(id),
  scheduled_start_time DATETIME2 NOT NULL,
  scheduled_end_time DATETIME2 NOT NULL,
  session_number INT NOT NULL,
  status NVARCHAR(20) NOT NULL,
  -- ... more fields
  last_synced_at DATETIME2 NOT NULL
);

CREATE TABLE sync_log (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  sync_type NVARCHAR(20) NOT NULL, -- 'full', 'webhook', 'manual'
  entity_type NVARCHAR(20) NOT NULL,
  entity_id NVARCHAR(50),
  operation NVARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  status NVARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
  error_message NVARCHAR(MAX),
  started_at DATETIME2 NOT NULL,
  completed_at DATETIME2,
  records_processed INT DEFAULT 0
);
```

#### 1.2 Halaxy Token Manager
Reuse existing OAuth2 token management (15-minute expiry):

```typescript
// api/src/services/halaxy/token-manager.ts
class HalaxyTokenManager {
  private static token: string | null = null;
  private static tokenExpiry: Date | null = null;

  static async getAccessToken(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }
    // Fetch new token from Halaxy OAuth endpoint
    // Cache with 14-minute expiry (1 min buffer)
  }
}
```

### Phase 2: Sync Logic (Week 2)

#### 2.1 Entity Transformers
Convert Halaxy FHIR resources to Bloom schema:

```typescript
// api/src/services/halaxy/transformers.ts

export function transformHalaxyPatient(fhirPatient: FHIRPatient): Client {
  return {
    halaxyPatientId: fhirPatient.id,
    firstName: fhirPatient.name[0]?.given[0] || '',
    lastName: fhirPatient.name[0]?.family || '',
    initials: getInitials(fhirPatient.name[0]),
    email: getTelecom(fhirPatient, 'email'),
    phone: getTelecom(fhirPatient, 'phone'),
    // ... transform other fields
  };
}

export function transformHalaxyAppointment(
  fhirAppointment: FHIRAppointment,
  clientMap: Map<string, Client>
): Session {
  const patientRef = fhirAppointment.participant
    .find(p => p.actor.reference.startsWith('Patient/'));
  
  return {
    halaxyAppointmentId: fhirAppointment.id,
    clientId: clientMap.get(extractId(patientRef?.actor.reference))?.id,
    scheduledStartTime: fhirAppointment.start,
    scheduledEndTime: fhirAppointment.end,
    status: mapFhirStatus(fhirAppointment.status),
    // ... transform other fields
  };
}
```

#### 2.2 Full Sync Job (Scheduled)

```typescript
// api/src/services/halaxy/sync-service.ts

export class HalaxySyncService {
  /**
   * Full sync - runs every 15 minutes
   * Reconciles all data for a practitioner
   */
  async fullSync(practitionerId: string): Promise<SyncResult> {
    const syncLog = await this.startSyncLog('full', 'all');
    
    try {
      // 1. Sync practitioner profile
      await this.syncPractitioner(practitionerId);
      
      // 2. Sync all patients (clients)
      const patients = await this.halaxyClient.getPatients(practitionerId);
      await this.syncClients(patients);
      
      // 3. Sync appointments (sessions) - last 30 days + next 90 days
      const appointments = await this.halaxyClient.getAppointments(
        practitionerId,
        subDays(new Date(), 30),
        addDays(new Date(), 90)
      );
      await this.syncSessions(appointments);
      
      // 4. Update sync status
      await this.completeSyncLog(syncLog.id, 'success');
      
      return { success: true, recordsSynced: appointments.length };
    } catch (error) {
      await this.completeSyncLog(syncLog.id, 'error', error.message);
      throw error;
    }
  }

  /**
   * Incremental sync - triggered by webhooks
   */
  async incrementalSync(
    event: HalaxyWebhookEvent,
    resource: FHIRResource
  ): Promise<SyncResult> {
    switch (event) {
      case 'appointment.created':
      case 'appointment.updated':
        return this.syncSingleSession(resource as FHIRAppointment);
      
      case 'appointment.cancelled':
        return this.cancelSession(resource.id);
      
      case 'patient.created':
      case 'patient.updated':
        return this.syncSingleClient(resource as FHIRPatient);
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
        return { success: true, recordsSynced: 0 };
    }
  }
}
```

### Phase 3: Azure Functions (Week 2-3)

#### 3.1 Webhook Handler

```typescript
// api/src/functions/halaxy-webhook.ts

app.http('halaxyWebhook', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (req, context) => {
    const signature = req.headers.get('X-Halaxy-Signature');
    
    // Verify webhook signature
    if (!verifyHalaxySignature(signature, req.body)) {
      return { status: 401, body: 'Invalid signature' };
    }
    
    const payload: HalaxyWebhookPayload = await req.json();
    
    const syncService = new HalaxySyncService();
    await syncService.incrementalSync(payload.event, payload.data);
    
    return { status: 200, body: 'OK' };
  }
});
```

#### 3.2 Scheduled Sync Timer

```typescript
// api/src/functions/halaxy-sync-timer.ts

app.timer('halaxySyncTimer', {
  schedule: '0 */15 * * * *', // Every 15 minutes
  handler: async (timer, context) => {
    context.log('Starting scheduled Halaxy sync');
    
    const syncService = new HalaxySyncService();
    
    // Get all active practitioners
    const practitioners = await getPractitioners();
    
    for (const practitioner of practitioners) {
      try {
        await syncService.fullSync(practitioner.id);
        context.log(`Synced practitioner ${practitioner.id}`);
      } catch (error) {
        context.error(`Failed to sync ${practitioner.id}:`, error);
      }
    }
  }
});
```

#### 3.3 Dashboard API Endpoint

```typescript
// api/src/functions/practitioner-dashboard.ts

app.http('practitionerDashboard', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'practitioners/{practitionerId}/dashboard',
  handler: async (req, context) => {
    const practitionerId = req.params.practitionerId;
    const date = req.query.get('date') || new Date().toISOString().split('T')[0];
    
    // Fetch from Bloom DB (synced data)
    const dashboard = await getDashboardData(practitionerId, date);
    
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: dashboard
      }
    };
  }
});

async function getDashboardData(
  practitionerId: string,
  date: string
): Promise<PractitionerDashboard> {
  const pool = await getDbConnection();
  
  // Get practitioner
  const practitioner = await pool.request()
    .input('id', practitionerId)
    .query('SELECT * FROM practitioners WHERE id = @id');
  
  // Get today's sessions with client info
  const sessions = await pool.request()
    .input('practitionerId', practitionerId)
    .input('date', date)
    .query(`
      SELECT s.*, c.initials, c.presenting_issues, 
             c.mhcp_used_sessions, c.mhcp_total_sessions,
             DATEDIFF(MONTH, c.first_session_date, GETDATE()) as relationship_months
      FROM sessions s
      JOIN clients c ON s.client_id = c.id
      WHERE s.practitioner_id = @practitionerId
        AND CAST(s.scheduled_start_time AS DATE) = @date
      ORDER BY s.scheduled_start_time
    `);
  
  // Calculate stats
  const weeklyStats = await calculateWeeklyStats(practitionerId);
  const monthlyStats = await calculateMonthlyStats(practitionerId);
  const upcomingStats = await calculateUpcomingStats(practitionerId);
  
  // Get sync status
  const syncStatus = await getSyncStatus(practitionerId);
  
  return {
    practitioner: practitioner.recordset[0],
    todaysSessions: sessions.recordset.map(transformSessionToFeedItem),
    weeklyStats,
    monthlyStats,
    upcomingStats,
    lastUpdated: new Date().toISOString(),
    syncStatus
  };
}
```

### Phase 4: Frontend Integration (Week 3)

#### 4.1 API Hooks

```typescript
// src/hooks/useDashboard.ts

export function useDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<PractitionerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user?.practitionerId) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `/api/practitioners/${user.practitionerId}/dashboard`
        );
        
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        
        const data: GetDashboardResponse = await response.json();
        setDashboard(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboard();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.practitionerId]);

  return { dashboard, loading, error, refetch };
}
```

#### 4.2 Updated BloomHomepage

```tsx
// src/pages/BloomHomepage.tsx

export const BloomHomepage: React.FC = () => {
  const { dashboard, loading, error } = useDashboard();
  
  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} />;
  if (!dashboard) return <NoDashboardData />;
  
  return (
    <div className="bloom-homepage">
      {/* Tree with real monthly revenue data */}
      <BlossomTreeSophisticated 
        monthlyRevenue={dashboard.monthlyStats.currentRevenue}
        monthlyTarget={dashboard.monthlyStats.targetRevenue}
      />
      
      {/* Session feed with real data */}
      <SessionFeed sessions={dashboard.todaysSessions} />
      
      {/* Stats from real data */}
      <WeeklyStatsCard stats={dashboard.weeklyStats} />
      
      {/* Sync status indicator */}
      <SyncStatusBadge status={dashboard.syncStatus} />
    </div>
  );
};
```

---

## Configuration

### Environment Variables

```bash
# Halaxy API
HALAXY_CLIENT_ID=<client_id>
HALAXY_CLIENT_SECRET=<client_secret>
HALAXY_BASE_URL=https://au-api.halaxy.com
HALAXY_WEBHOOK_SECRET=<webhook_signing_secret>

# Sync Configuration
HALAXY_SYNC_INTERVAL_MINUTES=15
HALAXY_SYNC_HISTORY_DAYS=30
HALAXY_SYNC_FUTURE_DAYS=90

# Database
SQL_CONNECTION_STRING=<connection_string>
```

### Halaxy Webhook Configuration

Register webhooks in Halaxy Developer Portal:

| Event | URL | Description |
|-------|-----|-------------|
| `appointment.created` | `/api/halaxy-webhook` | New appointment booked |
| `appointment.updated` | `/api/halaxy-webhook` | Appointment modified |
| `appointment.cancelled` | `/api/halaxy-webhook` | Appointment cancelled |
| `patient.created` | `/api/halaxy-webhook` | New patient registered |
| `patient.updated` | `/api/halaxy-webhook` | Patient info updated |
| `invoice.paid` | `/api/halaxy-webhook` | Payment received |

---

## Error Handling & Resilience

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds
  exponentialBackoff: true
};
```

### Circuit Breaker

If Halaxy API fails repeatedly:
1. After 5 consecutive failures → Open circuit (stop calling API)
2. After 30 seconds → Half-open (try one request)
3. If success → Close circuit (resume normal operation)

### Sync Conflict Resolution

| Conflict Type | Resolution |
|--------------|------------|
| Same record modified in both systems | Halaxy wins (source of truth) |
| Record deleted in Halaxy | Mark as deleted in Bloom (soft delete) |
| Webhook arrives before scheduled sync | Webhook takes precedence |

---

## Monitoring & Observability

### Metrics to Track

- Sync latency (time to complete full sync)
- Webhook processing time
- Records synced per cycle
- Sync error rate
- Data freshness (time since last successful sync)

### Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Sync Failure | 3+ consecutive failed syncs | Page on-call |
| High Latency | Sync > 5 minutes | Investigate |
| Webhook Backlog | > 100 pending webhooks | Scale up |
| Token Refresh Failure | OAuth fails | Check credentials |

---

## Testing Strategy

### Unit Tests
- Entity transformers
- MHCP calculation logic
- Status mapping

### Integration Tests
- Full sync flow (with Halaxy sandbox)
- Webhook processing
- Database operations

### E2E Tests
- Dashboard loads with synced data
- Real-time updates via webhooks

---

## Rollout Plan

| Phase | Scope | Duration |
|-------|-------|----------|
| 1 | Database schema + types | 1 week |
| 2 | Sync service core + scheduled job | 1 week |
| 3 | Webhooks + real-time updates | 1 week |
| 4 | Dashboard API + frontend integration | 1 week |
| 5 | Monitoring + production rollout | 1 week |

**Total: 5 weeks**

---

## Open Questions

1. **Historical data** - How far back should we sync? (Proposed: 30 days)
2. **Multi-practitioner** - Support for practices with multiple psychologists?
3. **Offline mode** - Should dashboard work if Halaxy is unreachable?
4. **Write-back** - Should Bloom ever write data back to Halaxy?
