# Halaxy Real-Time Sync Architecture

## 🎯 Goal: Make Halaxy Invisible

Users should **never suspect** that Halaxy is behind Bloom. Every interaction must feel instant - edits appear immediately, sync happens invisibly in the background, and any wait time is masked by beautiful, purposeful animations.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER EXPERIENCE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Optimistic │    │   Artistic   │    │   Real-time  │                  │
│  │    Updates   │───▶│   Modals     │───▶│   Push via   │                  │
│  │  (Instant)   │    │  (Masking)   │    │   SignalR    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AZURE INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      REAL-TIME LAYER                                │   │
│   │  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐      │   │
│   │  │  Azure SignalR │   │  Azure Redis   │   │ Azure Service  │      │   │
│   │  │    Service     │   │     Cache      │   │      Bus       │      │   │
│   │  │                │   │                │   │                │      │   │
│   │  │  • Push updates│   │  • Hot cache   │   │  • Queue       │      │   │
│   │  │  • 1M+ conns   │   │  • <1ms reads  │   │  • Ordering    │      │   │
│   │  │  • Auto-scale  │   │  • Geo-replica │   │  • Retry       │      │   │
│   │  └────────────────┘   └────────────────┘   └────────────────┘      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EVENT-DRIVEN LAYER                             │   │
│   │  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐      │   │
│   │  │ Azure Event    │   │ Azure Functions│   │ Container Apps │      │   │
│   │  │    Grid        │   │  (Webhooks)    │   │   (Worker)     │      │   │
│   │  │                │   │                │   │                │      │   │
│   │  │  • Pub/Sub     │   │  • Event-driven│   │  • Background  │      │   │
│   │  │  • <100ms      │   │  • Scale to 0  │   │  • Reconcile   │      │   │
│   │  │  • Filtering   │   │  • Serverless  │   │  • No timeout  │      │   │
│   │  └────────────────┘   └────────────────┘   └────────────────┘      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        DATA LAYER                                   │   │
│   │  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐      │   │
│   │  │  Azure SQL     │   │ Azure Cosmos   │   │ App Insights   │      │   │
│   │  │   Database     │   │      DB        │   │  (Telemetry)   │      │   │
│   │  │                │   │                │   │                │      │   │
│   │  │  • ACID        │   │  • Sync logs   │   │  • Metrics     │      │   │
│   │  │  • Relational  │   │  • Audit trail │   │  • Traces      │      │   │
│   │  │  • Geo-replica │   │  • TTL cleanup │   │  • Dashboards  │      │   │
│   │  └────────────────┘   └────────────────┘   └────────────────┘      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HALAXY API                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│   Webhooks (Real-time) ───▶ appointment.*, patient.*, practitioner.*        │
│   FHIR-R4 API (Polling) ───▶ Full reconciliation every 15 minutes           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Optimal Azure Resources

### Tier 1: Real-Time Layer (User-Facing)

| Resource | SKU | Purpose | Monthly Cost |
|----------|-----|---------|--------------|
| **Azure SignalR Service** | Standard (1 unit) | Push real-time updates to all connected clients | ~$50 |
| **Azure Cache for Redis** | Basic C1 (1GB) | Hot cache for dashboard data, <1ms reads | ~$40 |
| **Azure Service Bus** | Standard | Ordered message queue for sync operations | ~$10 |

### Tier 2: Event-Driven Layer (Processing)

| Resource | SKU | Purpose | Monthly Cost |
|----------|-----|---------|--------------|
| **Azure Event Grid** | Standard | Route Halaxy webhooks to handlers | ~$5 |
| **Azure Functions** | Consumption | Handle webhooks, event-driven tasks | ~$10 |
| **Container Apps** | Consumption (scale-to-0) | Background sync worker | ~$20 |

### Tier 3: Data Layer (Storage)

| Resource | SKU | Purpose | Monthly Cost |
|----------|-----|---------|--------------|
| **Azure SQL** | Basic (5 DTU) | Primary relational data | ~$5 |
| **Azure Cosmos DB** | Serverless | Sync logs, audit trail | ~$5 |
| **Application Insights** | Pay-as-you-go | Telemetry, monitoring | ~$5 |

### **Total Estimated Monthly Cost: ~$150/month**

---

## ⚡ Sync Strategy: Three-Tier Approach

### 1️⃣ Optimistic Updates (Instant - 0ms)

**What:** Update the UI immediately before the API call completes.

```typescript
// User saves a session note
const saveNote = async (sessionId: string, note: string) => {
  // 1. Immediately update local state (optimistic)
  setSession(prev => ({ ...prev, notes: note }));
  
  // 2. Show artistic "saving" animation
  showSaveAnimation();
  
  // 3. Sync to backend in background
  try {
    await api.updateSession(sessionId, { notes: note });
    // 4. Push update to all connected clients via SignalR
    await signalR.broadcast('session.updated', { sessionId, notes: note });
  } catch (error) {
    // 5. Rollback on failure with gentle notification
    setSession(prev => ({ ...prev, notes: originalNote }));
    showGentleError('Changes could not be saved. Please try again.');
  }
};
```

### 2️⃣ Real-Time Push (Sub-second - <500ms)

**What:** Halaxy sends webhooks → Event Grid routes → Function processes → SignalR pushes to clients.

```
Halaxy Webhook ──▶ Event Grid ──▶ Azure Function ──▶ Redis Cache
                                       │                  │
                                       ▼                  │
                                  SignalR Hub ◀───────────┘
                                       │
                                       ▼
                                 All Clients
```

### 3️⃣ Background Reconciliation (Every 15 min)

**What:** Container Apps worker does full sync to catch any missed webhooks.

```
Container Apps ──▶ Halaxy FHIR API ──▶ Compare ──▶ Upsert Changes ──▶ SignalR Push
```

---

## 🎨 Artistic Loading States

Instead of spinners, use purposeful micro-animations that mask sync delays:

### Save Animation (~1-2 seconds)
```
┌─────────────────────────────────────────┐
│                                         │
│      ✨ Bloom petals float upward ✨     │
│                                         │
│         🌸 → 🌸 → 🌸 → 🌸              │
│                                         │
│        "Your changes are blooming"      │
│                                         │
└─────────────────────────────────────────┘
```

### Session Complete Animation (~2-3 seconds)
```
┌─────────────────────────────────────────┐
│                                         │
│      🌺 Garden grows animation 🌺        │
│                                         │
│     Seeds → Sprout → Flower → Garden    │
│                                         │
│   "Session recorded. Your client is     │
│    one step closer to wellness."        │
│                                         │
└─────────────────────────────────────────┘
```

### Dashboard Refresh (~1 second)
```
┌─────────────────────────────────────────┐
│                                         │
│      🌿 Gentle wave animation 🌿         │
│                                         │
│     Cards ripple with soft glow         │
│                                         │
│        "Syncing your garden..."         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📐 Implementation Plan

### Phase 1: Infrastructure (Week 1)

1. **Deploy Azure SignalR Service** - Real-time push to clients
2. **Deploy Azure Redis Cache** - Hot data caching  
3. **Configure Event Grid** - Webhook routing
4. **Update Functions** - Add SignalR output bindings

### Phase 2: Backend Integration (Week 2)

1. **Redis Caching Layer** - Cache dashboard data, invalidate on changes
2. **SignalR Hub** - Broadcast updates to connected clients
3. **Webhook Handlers** - Process Halaxy events, update cache, push via SignalR
4. **Service Bus Queue** - Ordered processing for sync operations

### Phase 3: Frontend Magic (Week 3)

1. **Optimistic Update Hooks** - `useOptimisticMutation()` for all write operations
2. **SignalR Client** - Subscribe to real-time updates
3. **Artistic Modals** - Beautiful animations for save/load states
4. **Offline Support** - Queue changes when offline, sync when back

### Phase 4: Polish & Monitor (Week 4)

1. **Latency Dashboards** - Monitor P50/P95/P99 sync times
2. **Error Handling** - Graceful degradation, retry logic
3. **Load Testing** - Simulate national scale
4. **Documentation** - Runbooks, architecture diagrams

---

## 🏗️ Bicep Infrastructure

```bicep
// infra/realtime-sync.bicep

@description('Environment name')
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

// ============================================================================
// Azure SignalR Service - Real-time push to clients
// ============================================================================
resource signalR 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: 'bloom-signalr-${environment}'
  location: location
  sku: {
    name: 'Standard_S1'
    tier: 'Standard'
    capacity: 1
  }
  properties: {
    features: [
      { flag: 'ServiceMode', value: 'Serverless' }
      { flag: 'EnableConnectivityLogs', value: 'True' }
    ]
    cors: {
      allowedOrigins: [
        'https://bloom-${environment}.azurestaticapps.net'
        'http://localhost:5173'
      ]
    }
  }
}

// ============================================================================
// Azure Cache for Redis - Hot data caching
// ============================================================================
resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: 'bloom-redis-${environment}'
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 1
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

// ============================================================================
// Azure Service Bus - Ordered message queue
// ============================================================================
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'bloom-servicebus-${environment}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource syncQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'halaxy-sync'
  properties: {
    maxDeliveryCount: 10
    defaultMessageTimeToLive: 'P1D'
    lockDuration: 'PT5M'
    requiresSession: false
  }
}

// ============================================================================
// Azure Event Grid - Webhook routing
// ============================================================================
resource eventGridTopic 'Microsoft.EventGrid/topics@2023-12-15-preview' = {
  name: 'bloom-events-${environment}'
  location: location
  properties: {
    inputSchema: 'CloudEventSchemaV1_0'
    publicNetworkAccess: 'Enabled'
  }
}

// ============================================================================
// Outputs for application configuration
// ============================================================================
output signalRConnectionString string = signalR.listKeys().primaryConnectionString
output signalREndpoint string = 'https://${signalR.properties.hostName}'
output redisConnectionString string = '${redis.properties.hostName}:${redis.properties.sslPort},password=${redis.listKeys().primaryKey},ssl=True,abortConnect=False'
output serviceBusConnectionString string = listKeys(resourceId('Microsoft.ServiceBus/namespaces/AuthorizationRules', serviceBus.name, 'RootManageSharedAccessKey'), '2022-10-01-preview').primaryConnectionString
output eventGridEndpoint string = eventGridTopic.properties.endpoint
output eventGridKey string = listKeys(eventGridTopic.id, '2023-12-15-preview').key1
```

---

## 📈 Scaling Nationally

### Current State → National Scale

| Metric | Current | National (Target) |
|--------|---------|-------------------|
| Concurrent Users | ~100 | 10,000+ |
| Practitioners | ~50 | 5,000+ |
| Sync Latency (P95) | ~5s | <500ms |
| Webhook Processing | ~2s | <100ms |
| Dashboard Load | ~3s | <1s |

### Auto-Scaling Configuration

```yaml
# SignalR: Auto-scale based on connections
signalr:
  minUnits: 1
  maxUnits: 10
  scaleRule: connections > 800 per unit

# Redis: Scale up based on memory
redis:
  tier: Basic → Standard → Premium
  trigger: memory > 80%

# Functions: Consumption auto-scales automatically
functions:
  maxInstances: 200
  scaleRule: queue length > 10

# Container Apps: Scale based on CPU
containerApps:
  minReplicas: 0
  maxReplicas: 10
  scaleRule: cpu > 70%
```

---

## 🔄 Data Flow: Edit Session Example

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ USER: Edits session notes in Bloom                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (0ms)
┌──────────────────────────────────────────────────────────────────────────────┐
│ OPTIMISTIC UPDATE                                                            │
│ • UI updates immediately with new notes                                      │
│ • "Saving..." animation starts (🌸 petals floating)                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (50-100ms)
┌──────────────────────────────────────────────────────────────────────────────┐
│ BLOOM API (Azure Functions)                                                  │
│ • Validate & save to Azure SQL                                               │
│ • Invalidate Redis cache for this session                                    │
│ • Queue sync to Halaxy via Service Bus                                       │
│ • Broadcast update via SignalR                                               │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│ REDIS CACHE          │  │ SERVICE BUS      │  │ SIGNALR              │
│ • Cache invalidated  │  │ • Message queued │  │ • Push to all        │
│ • Next read = fresh  │  │ • Ordered process│  │   connected clients  │
└──────────────────────┘  └──────────────────┘  └──────────────────────┘
                                      │
                                      ▼ (100-200ms background)
┌──────────────────────────────────────────────────────────────────────────────┐
│ HALAXY SYNC (via Service Bus consumer)                                       │
│ • Update appointment in Halaxy FHIR API                                      │
│ • Log sync result to Cosmos DB                                               │
│ • If failed: retry with exponential backoff                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (animation complete)
┌──────────────────────────────────────────────────────────────────────────────┐
│ UI FEEDBACK                                                                  │
│ • Animation completes with success                                           │
│ • Brief "Saved ✓" indicator fades in                                         │
│ • User continues work seamlessly                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Monitoring Dashboard

Track these key metrics in Application Insights:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Webhook Processing Time (P95) | <100ms | >500ms |
| Redis Cache Hit Rate | >95% | <80% |
| SignalR Message Delivery | <200ms | >1s |
| Optimistic Update Success Rate | >99% | <95% |
| Halaxy Sync Latency (P95) | <2s | >5s |
| Error Rate | <0.1% | >1% |

---

## 🎯 Summary

This architecture ensures users **never notice Halaxy** through:

1. **Optimistic Updates** - UI changes instantly (0ms perceived latency)
2. **Artistic Animations** - Beautiful feedback masks any sync time
3. **Redis Caching** - <1ms reads for dashboard data
4. **SignalR Push** - Real-time updates without polling
5. **Event Grid + Functions** - Sub-second webhook processing
6. **Service Bus** - Reliable, ordered sync operations
7. **Container Apps** - Background reconciliation catches edge cases

**Result:** A seamless, native-feeling experience where Bloom IS the source of truth in the user's mind, with Halaxy silently syncing in the background.
