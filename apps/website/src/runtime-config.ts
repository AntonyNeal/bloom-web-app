import { apiService } from './services/ApiService';
import { log } from './utils/logger';

export interface RuntimeConfig {
  VITE_ASSESSMENT_ENABLED?: boolean;
  VITE_CHAT_ENABLED?: boolean;
  VITE_BUILD_ITERATION?: string;
  [key: string]: unknown;
}

let runtimeConfig: RuntimeConfig | null = null;

/**
 * Load runtime configuration from Azure Function
 * @param url - The runtime config function URL
 * @returns Promise<RuntimeConfig>
 */
export async function loadRuntimeConfig(url?: string): Promise<RuntimeConfig> {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  const configUrl =
    url || import.meta.env.VITE_RUNTIME_CONFIG_URL || '/runtime-config.json';

  try {
    log.info('Loading runtime config', 'RuntimeConfig', { url: configUrl });
    const response = await apiService.get<RuntimeConfig>(configUrl);

    if (!response.success) {
      throw new Error(response.error || 'Failed to load runtime config');
    }

    runtimeConfig = response.data;

    // Set window variables for compatibility with getEnvVar/getEnvBool
    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      win.__ENV_VARS__ = Object.assign({}, win.__ENV_VARS__ || {}, data);

      // Set individual window properties for direct access
      Object.keys(data).forEach((key) => {
        if (key.startsWith('VITE_')) {
          win[key] = data[key];
        }
      });
    }

    console.log('Runtime config loaded:', runtimeConfig);
    return runtimeConfig;
  } catch (error) {
    console.error('Error loading runtime config:', error);
    // Return empty config as fallback
    runtimeConfig = {};
    return runtimeConfig;
  }
}

/**
 * Get a runtime config value
 * @param key - The config key
 * @param defaultValue - Default value if key not found
 * @returns The config value or default
 */
export function getRuntimeConfigValue<T = unknown>(
  key: string,
  defaultValue?: T
): T | undefined {
  if (!runtimeConfig) {
    console.warn(
      'Runtime config not loaded yet. Call loadRuntimeConfig() first.'
    );
    return defaultValue;
  }

  const raw = runtimeConfig[key] as unknown;
  const value = raw as T | undefined;
  return value !== undefined ? value : defaultValue;
}

/**
 * Check if a feature is enabled
 * @param featureKey - The feature key (e.g., 'VITE_ASSESSMENT_ENABLED')
 * @returns boolean
 */
export function isFeatureEnabled(featureKey: string): boolean {
  const value = getRuntimeConfigValue(featureKey, false);
  return Boolean(value);
}
