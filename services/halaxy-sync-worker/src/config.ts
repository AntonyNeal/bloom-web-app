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
  halaxyFhirUrl: string;
  halaxyClientId: string;
  halaxyClientSecret: string;
  halaxyRefreshToken: string;
  halaxyHealthcareServiceId: string;
  
  // Sync Settings
  syncSchedule: string; // Cron expression
  timezone: string;
  runOnStartup: boolean;
  
  // Health Check
  healthPort: number;
  
  // Telemetry
  appInsightsConnectionString: string;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config: WorkerConfig = {
  // Environment
  environment: (process.env.ENVIRONMENT || 'development') as WorkerConfig['environment'],
  
  // Database - these are validated later
  sqlConnectionString: process.env.SQL_CONNECTION_STRING || '',
  cosmosConnectionString: process.env.COSMOS_CONNECTION_STRING || '',
  
  // Halaxy API
  halaxyApiUrl: getEnvOrDefault('HALAXY_API_URL', 'https://au-api.halaxy.com/api'),
  halaxyFhirUrl: getEnvOrDefault('HALAXY_FHIR_URL', 'https://au-api.halaxy.com/fhir'),
  halaxyClientId: process.env.HALAXY_CLIENT_ID || '',
  halaxyClientSecret: process.env.HALAXY_CLIENT_SECRET || '',
  halaxyRefreshToken: process.env.HALAXY_REFRESH_TOKEN || '',
  halaxyHealthcareServiceId: process.env.HALAXY_HEALTHCARE_SERVICE_ID || '',
  
  // Sync Settings
  syncSchedule: getEnvOrDefault('SYNC_SCHEDULE', '*/15 * * * *'), // Every 15 minutes
  timezone: getEnvOrDefault('TIMEZONE', 'Australia/Sydney'),
  runOnStartup: getEnvOrDefault('RUN_ON_STARTUP', 'true') === 'true',
  
  // Health Check
  healthPort: parseInt(getEnvOrDefault('HEALTH_PORT', '8080'), 10),
  
  // Telemetry
  appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
};

export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.sqlConnectionString) {
    errors.push('SQL_CONNECTION_STRING is required');
  }
  
  if (!config.halaxyClientId) {
    errors.push('HALAXY_CLIENT_ID is required');
  }
  
  if (!config.halaxyClientSecret) {
    errors.push('HALAXY_CLIENT_SECRET is required');
  }
  
  if (!config.halaxyRefreshToken) {
    errors.push('HALAXY_REFRESH_TOKEN is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

export default config;
