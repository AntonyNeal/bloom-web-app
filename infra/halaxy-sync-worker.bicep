// =============================================================================
// Halaxy Sync Worker - Azure Container Apps Infrastructure
// 
// Deploys:
// - Azure Container Registry (ACR)
// - Azure Container Apps Environment
// - Azure Container App (Sync Worker)
// - Azure Key Vault references for secrets
// =============================================================================

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Container image tag')
param imageTag string = 'latest'

// =============================================================================
// Variables
// =============================================================================

var prefix = 'lpa'
var workloadName = 'halaxy-sync'
var uniqueSuffix = uniqueString(resourceGroup().id)

var envSettings = {
  dev: {
    containerCpu: '0.25'
    containerMemory: '0.5Gi'
    minReplicas: 0
    maxReplicas: 1
    sqlServer: 'lpa-sql-dev.database.windows.net'
    keyVaultName: 'lpa-kv-dev'
  }
  staging: {
    containerCpu: '0.25'
    containerMemory: '0.5Gi'
    minReplicas: 0
    maxReplicas: 1
    sqlServer: 'lpa-sql-dev.database.windows.net'
    keyVaultName: 'lpa-kv-dev'
  }
  prod: {
    containerCpu: '0.5'
    containerMemory: '1Gi'
    minReplicas: 1
    maxReplicas: 2
    sqlServer: 'lpa-sql-prod.database.windows.net'
    keyVaultName: 'lpa-kv-prod'
  }
}

var settings = envSettings[environment]

// =============================================================================
// Existing Resources
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: settings.keyVaultName
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' existing = {
  name: '${prefix}-logs-${environment}'
}

// =============================================================================
// Container Registry
// =============================================================================

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: '${prefix}acr${uniqueSuffix}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
  tags: {
    environment: environment
    workload: workloadName
  }
}

// =============================================================================
// Container Apps Environment
// =============================================================================

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-cae-${environment}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: environment == 'prod'
  }
  tags: {
    environment: environment
    workload: workloadName
  }
}

// =============================================================================
// Halaxy Sync Worker Container App
// =============================================================================

resource halaxySyncWorker 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-${workloadName}-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'sql-connection-string'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/SQL-${toUpper(environment)}-CONNECTION-STRING'
          identity: 'System'
        }
        {
          name: 'cosmos-connection-string'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/COSMOS-${toUpper(environment)}-CONNECTION-STRING'
          identity: 'System'
        }
        {
          name: 'halaxy-client-id'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/HALAXY-CLIENT-ID'
          identity: 'System'
        }
        {
          name: 'halaxy-client-secret'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/HALAXY-CLIENT-SECRET'
          identity: 'System'
        }
        {
          name: 'halaxy-refresh-token'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/HALAXY-REFRESH-TOKEN'
          identity: 'System'
        }
        {
          name: 'appinsights-connection-string'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/APPINSIGHTS-CONNECTION-STRING'
          identity: 'System'
        }
      ]
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'halaxy-sync-worker'
          image: '${containerRegistry.properties.loginServer}/${workloadName}:${imageTag}'
          resources: {
            cpu: json(settings.containerCpu)
            memory: settings.containerMemory
          }
          env: [
            {
              name: 'ENVIRONMENT'
              value: environment
            }
            {
              name: 'SQL_CONNECTION_STRING'
              secretRef: 'sql-connection-string'
            }
            {
              name: 'COSMOS_CONNECTION_STRING'
              secretRef: 'cosmos-connection-string'
            }
            {
              name: 'HALAXY_CLIENT_ID'
              secretRef: 'halaxy-client-id'
            }
            {
              name: 'HALAXY_CLIENT_SECRET'
              secretRef: 'halaxy-client-secret'
            }
            {
              name: 'HALAXY_REFRESH_TOKEN'
              secretRef: 'halaxy-refresh-token'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
            {
              name: 'SYNC_SCHEDULE'
              value: '*/15 * * * *'
            }
            {
              name: 'TIMEZONE'
              value: 'Australia/Sydney'
            }
            {
              name: 'RUN_ON_STARTUP'
              value: 'true'
            }
            {
              name: 'HEALTH_PORT'
              value: '8080'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
              }
              initialDelaySeconds: 30
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/ready'
                port: 8080
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: settings.minReplicas
        maxReplicas: settings.maxReplicas
        rules: [
          {
            name: 'cron-scale-rule'
            custom: {
              type: 'cron'
              metadata: {
                timezone: 'Australia/Sydney'
                start: '0 6 * * 1-5'  // Scale up at 6am Mon-Fri
                end: '0 20 * * 1-5'   // Scale down at 8pm Mon-Fri
                desiredReplicas: '1'
              }
            }
          }
        ]
      }
    }
  }
  tags: {
    environment: environment
    workload: workloadName
  }
}

// =============================================================================
// Key Vault Access Policy for Container App
// =============================================================================

resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: halaxySyncWorker.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// =============================================================================
// Outputs
// =============================================================================

output containerAppName string = halaxySyncWorker.name
output containerAppFqdn string = halaxySyncWorker.properties.configuration.ingress.fqdn
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerAppsEnvironmentId string = containerAppsEnv.id
