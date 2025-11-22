// Azure Functions v4 entry point
// This file imports all function modules to register them
import './functions/health';
// import './functions/applications'; // Disabled - uses SQL
import './functions/upload';
import './functions/ab-test';
import './functions/track-ab-test';

export * from './functions/health';
// export * from './functions/applications'; // Disabled - uses SQL
export * from './functions/upload';
export * from './functions/ab-test';
export * from './functions/track-ab-test';
