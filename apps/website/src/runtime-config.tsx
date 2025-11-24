// Shim to re-export TypeScript runtime config helpers.
// Some bundlers/CI runners resolve extensions differently; providing a .tsx file
// ensures imports like `./runtime-config` resolve cleanly on Linux runners.
export {
  loadRuntimeConfig,
  getRuntimeConfigValue,
  isFeatureEnabled,
} from './runtime-config';

import * as rc from './runtime-config';
// default export an object with helpers
export default {
  loadRuntimeConfig: rc.loadRuntimeConfig,
  getRuntimeConfigValue: rc.getRuntimeConfigValue,
  isFeatureEnabled: rc.isFeatureEnabled,
};
