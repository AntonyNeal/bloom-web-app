/**
 * Configuration for Halaxy Sync Worker
 */

export interface WorkerConfig {
  // Environment
  environment: 'development' | 'staging' | 'production';
  
  // Database
  sqlConnectionString: string;
  cosmosConnectionString: string;
  
  // Halaxy API
  halaxyApiUrl: string;
  halaxyTokenUrl: string;
  halaxyClientId: string;
  halaxyClientSecret: string;
  halaxyHealthcareServiceId: string;
  
  // Sync Settings
  syncSchedule: string; // Cron expression
  timezone: string;
  runOnStartup: boolean;
  
  // Health Check
  healthPort: number;
  
  // Telemetry
  appInsightsConnectionString: string;
  
  // Redis Cache
  redisConnectionString: string;
  redisCacheTtlSeconds: number;
  
  // SignalR
  signalRConnectionString: string;
  signalRHubName: string;
  
  // Service Bus
  serviceBusConnectionString: string;
  serviceBusSyncQueueName: string;
  serviceBusRealtimeQueueName: string;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function isPlaceholder(value: string | undefined | null): boolean {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return true;
  }

  const lower = trimmed.toLowerCase();
  return (
    lower.includes('placeholder') ||
    lower.includes('your-client-id') ||
    lower.includes('your-client-secret')
  );
}

export const config: WorkerConfig = {
  // Environment
  environment: (process.env.ENVIRONMENT || 'development') as WorkerConfig['environment'],
  
  // Database - these are validated later
  sqlConnectionString: process.env.SQL_CONNECTION_STRING || '',
  cosmosConnectionString: process.env.COSMOS_CONNECTION_STRING || '',
  
  // Halaxy API (per docs: https://developers.halaxy.com/docs/authentication)
  halaxyApiUrl: getEnvOrDefault('HALAXY_API_URL', 'https://au-api.halaxy.com/main'),
  halaxyTokenUrl: getEnvOrDefault('HALAXY_TOKEN_URL', 'https://au-api.halaxy.com/main/oauth/token'),
  halaxyClientId: process.env.HALAXY_CLIENT_ID || '',
  halaxyClientSecret: process.env.HALAXY_CLIENT_SECRET || '',
  halaxyHealthcareServiceId: process.env.HALAXY_HEALTHCARE_SERVICE_ID || '',
  
  // Sync Settings
  syncSchedule: getEnvOrDefault('SYNC_SCHEDULE', '*/15 * * * *'), // Every 15 minutes
  timezone: getEnvOrDefault('TIMEZONE', 'Australia/Sydney'),
  runOnStartup: getEnvOrDefault('RUN_ON_STARTUP', 'true') === 'true',
  
  // Health Check
  healthPort: parseInt(getEnvOrDefault('HEALTH_PORT', '8080'), 10),
  
  // Telemetry
  appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
  
  // Redis Cache
  redisConnectionString: process.env.REDIS_CONNECTION_STRING || '',
  redisCacheTtlSeconds: parseInt(getEnvOrDefault('REDIS_CACHE_TTL_SECONDS', '300'), 10), // 5 minutes
  
  // SignalR
  signalRConnectionString: process.env.SIGNALR_CONNECTION_STRING || '',
  signalRHubName: getEnvOrDefault('SIGNALR_HUB_NAME', 'bloom'),
  
  // Service Bus
  serviceBusConnectionString: process.env.SERVICEBUS_CONNECTION_STRING || '',
  serviceBusSyncQueueName: getEnvOrDefault('SERVICEBUS_SYNC_QUEUE', 'halaxy-sync'),
  serviceBusRealtimeQueueName: getEnvOrDefault('SERVICEBUS_REALTIME_QUEUE', 'halaxy-realtime'),
};

export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.sqlConnectionString) {
    errors.push('SQL_CONNECTION_STRING is required');
  }
  
  const missingHalaxySecrets: string[] = [];

  if (isPlaceholder(config.halaxyClientId)) {
    missingHalaxySecrets.push('HALAXY_CLIENT_ID');
  }

  if (isPlaceholder(config.halaxyClientSecret)) {
    missingHalaxySecrets.push('HALAXY_CLIENT_SECRET');
  }

  if (missingHalaxySecrets.length > 0) {
    errors.push(
      `Halaxy credentials missing or placeholder: ${missingHalaxySecrets.join(', ')}. ` +
        'Update the corresponding Key Vault secrets (HALAXY-CLIENT-ID, HALAXY-CLIENT-SECRET).'
    );
  }
  
  // Real-time services (warn if missing but don't fail - graceful degradation)
  const warnings: string[] = [];
  
  if (!config.redisConnectionString) {
    warnings.push('REDIS_CONNECTION_STRING not set - caching disabled');
  }
  
  if (!config.signalRConnectionString) {
    warnings.push('SIGNALR_CONNECTION_STRING not set - real-time push disabled');
  }
  
  if (!config.serviceBusConnectionString) {
    warnings.push('SERVICEBUS_CONNECTION_STRING not set - queue-based sync disabled');
  }
  
  if (warnings.length > 0) {
    console.warn(`Configuration warnings:\n  - ${warnings.join('\n  - ')}`);
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

export default config;
