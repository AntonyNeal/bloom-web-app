// ============================================================================
// Halaxy Real-Time Sync Infrastructure
// 
// This Bicep template deploys the complete infrastructure for real-time
// synchronization between Bloom and Halaxy, designed for national scale.
// 
// Resources deployed:
// - Azure SignalR Service (real-time push)
// - Azure Cache for Redis (hot data caching)
// - Azure Service Bus (ordered message queue)
// - Azure Event Grid (webhook routing)
// - Container Apps Environment (background worker)
// - Container Registry (Docker images)
// ============================================================================

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Tags for all resources')
param tags object = {
  project: 'bloom'
  environment: environment
  component: 'halaxy-sync'
}

// Naming convention
var baseName = 'bloom-${environment}'

// ============================================================================
// Azure SignalR Service - Real-time push to clients
// Scales to millions of connections, auto-scales based on load
// ============================================================================
resource signalR 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: '${baseName}-signalr'
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Standard_S1' : 'Free_F1'
    tier: environment == 'prod' ? 'Standard' : 'Free'
    capacity: environment == 'prod' ? 1 : 1
  }
  kind: 'SignalR'
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Serverless' // Works with Azure Functions
      }
      {
        flag: 'EnableConnectivityLogs'
        value: 'True'
      }
      {
        flag: 'EnableMessagingLogs'
        value: environment == 'prod' ? 'False' : 'True' // Verbose in non-prod
      }
    ]
    cors: {
      allowedOrigins: [
        'https://bloom-frontend-${environment}.azurestaticapps.net'
        'https://delightfulglacier-${environment == 'prod' ? '382ce67e' : environment == 'staging' ? 'f1d2e3c4' : 'a1b2c3d4'}.australiaeast.azurestaticapps.net'
        'http://localhost:5173'
        'http://localhost:3000'
      ]
    }
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    disableAadAuth: false
  }
}

// ============================================================================
// Azure Cache for Redis - Hot data caching
// <1ms reads, geo-replication available for prod
// ============================================================================
resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: '${baseName}-redis'
  location: location
  tags: tags
  properties: {
    sku: {
      name: environment == 'prod' ? 'Standard' : 'Basic'
      family: 'C'
      capacity: environment == 'prod' ? 1 : 0 // C1 for prod, C0 for dev
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru' // Evict least recently used
    }
    publicNetworkAccess: 'Enabled'
  }
}

// ============================================================================
// Azure Service Bus - Ordered message queue for sync operations
// Ensures reliable, ordered processing of sync events
// ============================================================================
resource serviceBus 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: '${baseName}-servicebus'
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

// Queue for Halaxy sync operations
resource syncQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'halaxy-sync'
  properties: {
    maxDeliveryCount: 10 // Retry up to 10 times
    defaultMessageTimeToLive: 'P1D' // 1 day TTL
    lockDuration: 'PT5M' // 5 minute lock
    deadLetteringOnMessageExpiration: true
    requiresSession: false
    enablePartitioning: false
  }
}

// Queue for high-priority real-time updates
resource realtimeQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBus
  name: 'halaxy-realtime'
  properties: {
    maxDeliveryCount: 5
    defaultMessageTimeToLive: 'PT1H' // 1 hour TTL (time-sensitive)
    lockDuration: 'PT1M' // 1 minute lock (fast processing)
    deadLetteringOnMessageExpiration: true
    requiresSession: false
  }
}

// Dead letter queue monitoring
resource deadLetterTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = {
  parent: serviceBus
  name: 'sync-failures'
  properties: {
    defaultMessageTimeToLive: 'P7D' // Keep failures for 7 days
    enablePartitioning: false
  }
}

// ============================================================================
// Azure Event Grid - Webhook routing from Halaxy
// Routes webhooks to appropriate handlers with filtering
// ============================================================================
resource eventGridTopic 'Microsoft.EventGrid/topics@2023-12-15-preview' = {
  name: '${baseName}-events'
  location: location
  tags: tags
  properties: {
    inputSchema: 'CloudEventSchemaV1_0'
    publicNetworkAccess: 'Enabled'
  }
}

// ============================================================================
// Container Apps Environment - For background worker
// ============================================================================
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${baseName}-cae'
  location: location
  tags: tags
  properties: {
    zoneRedundant: environment == 'prod'
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// ============================================================================
// Container Registry - For Docker images
// ============================================================================
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: replace('${baseName}acr', '-', '') // ACR names can't have hyphens
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

// ============================================================================
// Halaxy Sync Worker - Container App
// ============================================================================
resource halaxySyncWorker 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${baseName}-halaxy-worker'
  location: location
  tags: union(tags, { component: 'halaxy-sync-worker' })
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8080
        transport: 'http'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'halaxy-sync-worker'
          image: '${containerRegistry.properties.loginServer}/halaxy-sync-worker:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 10
              periodSeconds: 30
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0 // Scale to 0 when idle
        maxReplicas: 5
        rules: [
          {
            name: 'cpu-scale'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
          {
            name: 'queue-scale'
            custom: {
              type: 'azure-servicebus'
              metadata: {
                queueName: 'halaxy-sync'
                messageCount: '10'
              }
              auth: [
                {
                  secretRef: 'servicebus-connection'
                  triggerParameter: 'connection'
                }
              ]
            }
          }
        ]
      }
    }
  }
}

// ============================================================================
// Outputs - For application configuration
// ============================================================================

@description('SignalR Service endpoint')
output signalREndpoint string = 'https://${signalR.properties.hostName}'

@description('SignalR Service connection string')
output signalRConnectionString string = signalR.listKeys().primaryConnectionString

@description('Redis Cache hostname')
output redisHostname string = redis.properties.hostName

@description('Redis Cache connection string')
output redisConnectionString string = '${redis.properties.hostName}:${redis.properties.sslPort},password=${redis.listKeys().primaryKey},ssl=True,abortConnect=False'

@description('Service Bus namespace')
output serviceBusNamespace string = serviceBus.name

@description('Service Bus connection string')
output serviceBusConnectionString string = listKeys(resourceId('Microsoft.ServiceBus/namespaces/AuthorizationRules', serviceBus.name, 'RootManageSharedAccessKey'), '2022-10-01-preview').primaryConnectionString

@description('Event Grid topic endpoint')
output eventGridEndpoint string = eventGridTopic.properties.endpoint

@description('Event Grid topic key')
output eventGridKey string = listKeys(eventGridTopic.id, '2023-12-15-preview').key1

@description('Container Registry login server')
output acrLoginServer string = containerRegistry.properties.loginServer

@description('Container Apps Environment ID')
output containerAppsEnvId string = containerAppsEnv.id

@description('Halaxy Worker URL')
output halaxySyncWorkerUrl string = halaxySyncWorker.properties.configuration.ingress.fqdn
