/**
 * Environment variable utilities for handling both build-time and runtime variables
 * This is needed because Azure Static Web Apps provides runtime environment variables
 * but Vite needs some variables at build time
 */

// Type definitions for Vite environment variables
interface ViteEnv {
  [key: string]: string | boolean | undefined;
}

// Type definitions for global environment variables

interface WindowWithEnv extends Window {
  __ENV_VARS__?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Get environment variable with fallback to runtime value
 * For Azure Static Web Apps compatibility
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  console.log(
    `[ENV] getEnvVar('${key}') called with default: '${defaultValue}'`
  );

  // If running in the browser, prefer runtime-injected variables (e.g. from
  // /runtime-config.json or Azure SWA) so deployments can override build-time
  // values without rebuilding the app. Check __ENV_VARS__ first.
  if (typeof window !== 'undefined') {
    const win = window as unknown as WindowWithEnv;
    const envVarsObj = win.__ENV_VARS__;
    console.log(`[ENV] Window __ENV_VARS__ object:`, envVarsObj);

    if (
      envVarsObj &&
      envVarsObj[key] !== undefined &&
      envVarsObj[key] !== null &&
      envVarsObj[key] !== ''
    ) {
      const envValue = envVarsObj[key];
      if (
        typeof envValue === 'string' &&
        envValue.startsWith('__RUNTIME_') &&
        envValue.endsWith('__')
      ) {
        console.log(
          `[ENV] Found Azure SWA placeholder in __ENV_VARS__ for '${key}': '${envValue}', ignoring`
        );
        // fall through to build-time checks
      } else {
        console.log(`[ENV] Using __ENV_VARS__ value: '${envValue}'`);
        return envValue || defaultValue;
      }
    }
  }

  // First try build-time variable (Vite)
  const viteEnv = import.meta.env as ViteEnv;
  const buildTimeValue = viteEnv[key];
  console.log(`[ENV] Build-time value for '${key}':`, buildTimeValue);

  if (buildTimeValue !== undefined && buildTimeValue !== null) {
    // If the build-time value looks like a placeholder token (e.g. "%VITE_...%"),
    // ignore it so that runtime-injected globals (window.VITE_*) can be used.
    if (typeof buildTimeValue === 'string') {
      const trimmed = buildTimeValue.trim();
      if (
        trimmed.startsWith('%') &&
        trimmed.includes('VITE_') &&
        trimmed.endsWith('%')
      ) {
        console.log(
          `[ENV] Build-time value looks like placeholder, ignoring: '${trimmed}'`
        );
        // fall through to runtime checks
      } else if (trimmed === '') {
        // empty string - treat as not present
        console.log(`[ENV] Build-time value is empty string, ignoring`);
      } else {
        console.log(`[ENV] Using build-time value: '${buildTimeValue}'`);
        return String(buildTimeValue);
      }
    } else {
      console.log(`[ENV] Using non-string build-time value:`, buildTimeValue);
      return String(buildTimeValue);
    }
  }

  // Try global variables injected by build process
  if (typeof window !== 'undefined') {
    const win = window as unknown as WindowWithEnv;

    // Check for individual global variables
    const globalValue = win[key];
    console.log(`[ENV] Window global value for '${key}':`, globalValue);

    // Check if it's an Azure Static Web Apps placeholder
    if (
      globalValue !== undefined &&
      globalValue !== null &&
      globalValue !== '' &&
      typeof globalValue === 'string' &&
      globalValue.startsWith('__RUNTIME_') &&
      globalValue.endsWith('__')
    ) {
      console.log(
        `[ENV] Found Azure SWA placeholder for '${key}': '${globalValue}', ignoring and checking runtime config`
      );
      // Don't use the placeholder, fall through to runtime config check
    } else if (
      globalValue !== undefined &&
      globalValue !== null &&
      globalValue !== ''
    ) {
      console.log(`[ENV] Using window global value: '${globalValue}'`);
      return String(globalValue);
    }

    // Check for variables in __ENV_VARS__ object
    const envVarsObj = win.__ENV_VARS__;
    console.log(`[ENV] Window __ENV_VARS__ object:`, envVarsObj);

    if (
      envVarsObj &&
      envVarsObj[key] !== undefined &&
      envVarsObj[key] !== null &&
      envVarsObj[key] !== ''
    ) {
      const envValue = envVarsObj[key];
      // Check if it's an Azure Static Web Apps placeholder
      if (
        typeof envValue === 'string' &&
        envValue.startsWith('__RUNTIME_') &&
        envValue.endsWith('__')
      ) {
        console.log(
          `[ENV] Found Azure SWA placeholder in __ENV_VARS__ for '${key}': '${envValue}', ignoring`
        );
        // Don't use the placeholder, fall through to runtime config check
      } else {
        console.log(`[ENV] Using __ENV_VARS__ value: '${envValue}'`);
        return envValue || defaultValue;
      }
    }

    // Fallback to runtime variable (Azure Static Web Apps)
    // Azure Static Web Apps injects environment variables as global variables
    // or we can fetch them from a config endpoint
    const runtimeValue = win[`__${key}__`];
    console.log(`[ENV] Runtime value for '__${key}__':`, runtimeValue);

    if (runtimeValue !== undefined && runtimeValue !== null) {
      console.log(`[ENV] Using runtime value: '${runtimeValue}'`);
      return String(runtimeValue);
    }
  }

  console.log(`[ENV] No value found, using default: '${defaultValue}'`);
  return defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getEnvBool(
  key: string,
  defaultValue: boolean = false
): boolean {
  const value = getEnvVar(key, defaultValue.toString());
  const result = value === 'true' || value === '1';
  console.log(
    `[ENV] getEnvBool('${key}') = ${result} (raw value: '${value}', default: ${defaultValue})`
  );
  return result;
}

/**
 * Get all environment variables for debugging
 */
export function getAllEnvVars(): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Add build-time variables
  const viteEnv = import.meta.env as ViteEnv;
  Object.keys(viteEnv).forEach((key) => {
    if (
      key.startsWith('VITE_') ||
      key === 'MODE' ||
      key === 'DEV' ||
      key === 'PROD'
    ) {
      const value = viteEnv[key];
      envVars[key] = value !== undefined ? String(value) : '';
    }
  });

  // Add runtime variables if available
  if (typeof window !== 'undefined') {
    const win = window as unknown as WindowWithEnv;
    // Check for global variables injected by build process
    const envVarsObj = win.__ENV_VARS__;
    if (envVarsObj) {
      Object.keys(envVarsObj).forEach((key) => {
        if (
          envVarsObj[key] !== undefined &&
          envVarsObj[key] !== null &&
          envVarsObj[key] !== ''
        ) {
          envVars[`${key} (global)`] = envVarsObj[key];
        }
      });
    }

    // Check for individual global variables
    const globalVars = [
      'VITE_GA_MEASUREMENT_ID',
      'VITE_GOOGLE_ADS_ID',
      'VITE_GOOGLE_ADS_CONVERSION_LABEL',
      'VITE_OPENAI_API_KEY',
      'VITE_CHAT_ENABLED',
      'VITE_ASSESSMENT_ENABLED',
      'VITE_DEBUG_PANEL',
      'VITE_BUILD_ITERATION',
      'VITE_BUILD_TIME',
    ];

    globalVars.forEach((key) => {
      const win = window as unknown as WindowWithEnv;
      const globalValue = win[key];
      if (
        globalValue !== undefined &&
        globalValue !== null &&
        globalValue !== '' &&
        !envVars[`${key} (global)`]
      ) {
        // Don't duplicate if already in __ENV_VARS__
        envVars[`${key} (global)`] = String(globalValue);
      }
    });

    // Check for Azure Static Web Apps runtime variables
    const runtimeVars = [
      'VITE_GA_MEASUREMENT_ID',
      'VITE_GOOGLE_ADS_ID',
      'VITE_GOOGLE_ADS_CONVERSION_LABEL',
      'VITE_OPENAI_API_KEY',
      'VITE_CHAT_ENABLED',
      'VITE_ASSESSMENT_ENABLED',
      'VITE_DEBUG_PANEL',
    ];

    runtimeVars.forEach((key) => {
      const win = window as unknown as WindowWithEnv;
      const runtimeValue = win[key] || win[`__${key}__`];
      if (
        runtimeValue !== undefined &&
        runtimeValue !== null &&
        !envVars[`${key} (global)`] &&
        !envVars[`${key} (runtime)`]
      ) {
        // Don't duplicate
        envVars[`${key} (runtime)`] = String(runtimeValue);
      }
    });
  }

  return envVars;
}

/**
 * Check if we're running in Azure Static Web Apps
 */
export function isAzureStaticWebApps(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('azurestaticapps.net') ||
      window.location.hostname.includes('azurewebsites.net'))
  );
}

/**
 * Get the current environment name
 */
export function getEnvironment(): string {
  // Return environment based on Vite's MODE only
  if (import.meta.env.MODE === 'development') return 'development';
  if (import.meta.env.MODE === 'production') return 'production';
  return 'unknown';
}
