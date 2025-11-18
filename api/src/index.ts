// Azure Functions v4 entry point
// This file imports all function modules to register them
import './functions/health';
import './functions/applications';
import './functions/upload';

export * from './functions/health';
export * from './functions/applications';
export * from './functions/upload';
