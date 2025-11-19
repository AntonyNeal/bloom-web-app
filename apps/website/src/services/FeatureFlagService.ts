/**
 * Feature Flag Service
 *
 * Centralized feature flag management with runtime configuration support
 */

import { FEATURE_FLAGS } from '../config/constants';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export interface FeatureFlagConfig {
  [key: string]: boolean;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlagConfig;
  private overrides: FeatureFlagConfig = {};

  private constructor() {
    this.flags = { ...FEATURE_FLAGS };
    this.loadOverrides();
    this.loadFromEnvironment();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(feature: FeatureFlagKey): boolean {
    // Check overrides first (for testing/debugging)
    if (feature in this.overrides) {
      return this.overrides[feature];
    }

    return this.flags[feature] ?? false;
  }

  /**
   * Enable feature
   */
  enable(feature: FeatureFlagKey): void {
    this.flags[feature] = true;
    this.saveOverrides();
    logger.info(`Feature enabled: ${feature}`, 'FeatureFlags');
  }

  /**
   * Disable feature
   */
  disable(feature: FeatureFlagKey): void {
    this.flags[feature] = false;
    this.saveOverrides();
    logger.info(`Feature disabled: ${feature}`, 'FeatureFlags');
  }

  /**
   * Set temporary override (for testing)
   */
  setOverride(feature: FeatureFlagKey, enabled: boolean): void {
    this.overrides[feature] = enabled;
    this.saveOverrides();
    logger.debug(
      `Feature override set: ${feature} = ${enabled}`,
      'FeatureFlags'
    );
  }

  /**
   * Clear override
   */
  clearOverride(feature: FeatureFlagKey): void {
    delete this.overrides[feature];
    this.saveOverrides();
    logger.debug(`Feature override cleared: ${feature}`, 'FeatureFlags');
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides = {};
    storage.remove('feature_flag_overrides');
    logger.debug('All feature overrides cleared', 'FeatureFlags');
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags, ...this.overrides };
  }

  /**
   * Load overrides from localStorage
   */
  private loadOverrides(): void {
    const stored = storage.get<FeatureFlagConfig>('feature_flag_overrides');
    if (stored) {
      this.overrides = stored;
      logger.debug('Feature flag overrides loaded', 'FeatureFlags', stored);
    }
  }

  /**
   * Save overrides to localStorage
   */
  private saveOverrides(): void {
    storage.set('feature_flag_overrides', this.overrides);
  }

  /**
   * Load flags from environment variables
   */
  private loadFromEnvironment(): void {
    // Check for environment variable overrides
    const envFlags: Partial<Record<FeatureFlagKey, boolean>> = {
      ENABLE_AB_TESTING: import.meta.env['VITE_ENABLE_AB_TESTING'] === 'true',
      ENABLE_CHAT: import.meta.env['VITE_CHAT_ENABLED'] === 'true',
      ENABLE_ASSESSMENT: import.meta.env['VITE_ASSESSMENT_ENABLED'] === 'true',
      ENABLE_ANALYTICS: import.meta.env['VITE_ENABLE_ANALYTICS'] !== 'false', // Default true
      ENABLE_DEBUG_PANEL: import.meta.env['VITE_DEBUG_PANEL'] === 'true',
    };

    // Apply environment overrides
    Object.entries(envFlags).forEach(([key, value]) => {
      if (value !== undefined) {
        this.flags[key as FeatureFlagKey] = value;
      }
    });

    logger.debug(
      'Feature flags loaded from environment',
      'FeatureFlags',
      envFlags
    );
  }

  /**
   * Update from runtime config
   */
  updateFromRuntimeConfig(config: Record<string, string>): void {
    const updates: Partial<Record<FeatureFlagKey, boolean>> = {
      ENABLE_AB_TESTING: config['VITE_ENABLE_AB_TESTING'] === 'true',
      ENABLE_CHAT: config['VITE_CHAT_ENABLED'] === 'true',
      ENABLE_ASSESSMENT: config['VITE_ASSESSMENT_ENABLED'] === 'true',
      ENABLE_ANALYTICS: config['VITE_ENABLE_ANALYTICS'] !== 'false',
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        this.flags[key as FeatureFlagKey] = value;
      }
    });

    logger.info(
      'Feature flags updated from runtime config',
      'FeatureFlags',
      updates
    );
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance();

// Convenience function
export function isFeatureEnabled(feature: FeatureFlagKey): boolean {
  return featureFlags.isEnabled(feature);
}
