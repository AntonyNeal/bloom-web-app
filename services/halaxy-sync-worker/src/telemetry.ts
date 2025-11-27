/**
 * Application Insights Telemetry for Halaxy Sync Worker
 */

import * as appInsights from 'applicationinsights';
import { config } from './config';

let client: appInsights.TelemetryClient | null = null;

export function setupTelemetry(): void {
  if (!config.appInsightsConnectionString) {
    console.log('[Telemetry] No Application Insights connection string - telemetry disabled');
    return;
  }

  try {
    appInsights.setup(config.appInsightsConnectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(false) // We're a worker, not a web server
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start();

    client = appInsights.defaultClient;
    
    // Set cloud role for easy identification
    client.context.tags[client.context.keys.cloudRole] = 'halaxy-sync-worker';
    client.context.tags[client.context.keys.cloudRoleInstance] = 
      process.env.CONTAINER_APP_REPLICA_NAME || 'local';

    console.log('[Telemetry] Application Insights initialized');
  } catch (error) {
    console.error('[Telemetry] Failed to initialize Application Insights:', error);
  }
}

export function trackEvent(
  name: string, 
  properties?: Record<string, string | number | boolean>
): void {
  if (!client) return;

  client.trackEvent({
    name,
    properties: properties as Record<string, string>,
  });
}

export function trackMetric(
  name: string, 
  value: number, 
  properties?: Record<string, string>
): void {
  if (!client) return;

  client.trackMetric({
    name,
    value,
    properties,
  });
}

export function trackException(
  error: Error, 
  properties?: Record<string, string>
): void {
  if (!client) return;

  client.trackException({
    exception: error,
    properties,
  });
}

export function trackDependency(
  dependencyTypeName: string,
  name: string,
  data: string,
  duration: number,
  success: boolean
): void {
  if (!client) return;

  client.trackDependency({
    dependencyTypeName,
    name,
    data,
    duration,
    resultCode: success ? 200 : 500,
    success,
  });
}

export async function flush(): Promise<void> {
  if (!client) return;

  return new Promise((resolve) => {
    client!.flush({
      callback: () => {
        console.log('[Telemetry] Flushed telemetry');
        resolve();
      },
    });
  });
}

export default {
  setupTelemetry,
  trackEvent,
  trackMetric,
  trackException,
  trackDependency,
  flush,
};
