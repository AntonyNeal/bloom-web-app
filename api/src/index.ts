// Azure Functions v4 entry point
// This file imports all function modules to register them
import './functions/health';
import './functions/applications';
import './functions/upload';
import './functions/ab-test';
import './functions/track-ab-test';
import './functions/dbvc';
import './functions/smoke-test';
import './functions/practitioner-dashboard';
import './functions/seed-database';

export * from './functions/health';
export * from './functions/applications';
export * from './functions/upload';
export * from './functions/ab-test';
export * from './functions/track-ab-test';
export * from './functions/smoke-test';
export * from './functions/practitioner-dashboard';
export * from './functions/seed-database';
