// =============================================================================
// Halaxy Sync Worker - Azure Container Apps Infrastructure
// 
// Deploys:
// - Log Analytics Workspace
// - Azure Key Vault
// - Azure Container Registry (ACR)
// - Azure Container Apps Environment
// - Azure Container App (Sync Worker)
// =============================================================================

@description('Environment name (development, staging, production)')
@allowed(['development', 'staging', 'production'])
param environment string = 'development'

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

// Map full environment names to short names for resource naming
var envShortName = environment == 'production' ? 'prod' : environment == 'staging' ? 'staging' : 'dev'

// Short environment name for Key Vault (must be <= 24 chars total)
// Format: lpa-kv-{env}-{6-char-suffix} = max 17 chars for env+suffix
var kvEnvShort = environment == 'production' ? 'prd' : environment == 'staging' ? 'stg' : 'dev'
var kvUniqueSuffix = substring(uniqueSuffix, 0, 6)

// Database environment: dev and staging both use dev DB, production uses prod DB
var dbEnv = environment == 'production' ? 'prod' : 'dev'

var envSettings = {
  development: {
    containerCpu: '0.25'
    containerMemory: '0.5Gi'
    minReplicas: 0
    maxReplicas: 1
    sqlDatabase: 'lpa-bloom-db-dev'
  }
  staging: {
    containerCpu: '0.25'
    containerMemory: '0.5Gi'
    minReplicas: 0
    maxReplicas: 1
    sqlDatabase: 'lpa-bloom-db-dev'
  }
  production: {
    containerCpu: '0.5'
    containerMemory: '1Gi'
    minReplicas: 1
    maxReplicas: 2
    sqlDatabase: 'lpa-bloom-db-prod'
  }
}

var settings = envSettings[environment]

// =============================================================================
// Log Analytics Workspace
// =============================================================================

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs-${envShortName}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: {
    environment: environment
    workload: workloadName
  }
}

// =============================================================================
// Key Vault
// Key Vault names must be 3-24 characters, alphanumeric and hyphens only
// Format: lpa-kv-{env}-{suffix} where env is 3 chars and suffix is 6 chars = 16 chars max
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${prefix}-kv-${kvEnvShort}-${kvUniqueSuffix}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    accessPolicies: []
  }
  tags: {
    environment: environment
    workload: workloadName
  }
}

// =============================================================================
// Key Vault Secrets (placeholder values - to be updated manually or via CI/CD)
// =============================================================================

resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SQL-${toUpper(dbEnv)}-CONNECTION-STRING'
  properties: {
    value: 'Server=lpa-sql-server${az.environment().suffixes.sqlServerHostname};Database=${settings.sqlDatabase};'
  }
}

resource cosmosConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'COSMOS-${toUpper(dbEnv)}-CONNECTION-STRING'
  properties: {
    value: 'placeholder-update-after-deployment'
  }
}

resource halaxyClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'HALAXY-CLIENT-ID'
  properties: {
    value: 'placeholder-update-after-deployment'
  }
}

resource halaxyClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'HALAXY-CLIENT-SECRET'
  properties: {
    value: 'placeholder-update-after-deployment'
  }
}

resource halaxyRefreshTokenSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'HALAXY-REFRESH-TOKEN'
  properties: {
    value: 'placeholder-update-after-deployment'
  }
}

resource appInsightsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'APPINSIGHTS-CONNECTION-STRING'
  properties: {
    value: 'placeholder-update-after-deployment'
  }
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
  name: '${prefix}-cae-${envShortName}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: environment == 'production'
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
  name: '${prefix}-${workloadName}-${envShortName}'
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
          name: 'acr-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
        {
          name: 'sql-connection-string'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/SQL-${toUpper(dbEnv)}-CONNECTION-STRING'
          identity: 'System'
        }
        {
          name: 'cosmos-connection-string'
          keyVaultUrl: '${keyVault.properties.vaultUri}secrets/COSMOS-${toUpper(dbEnv)}-CONNECTION-STRING'
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
