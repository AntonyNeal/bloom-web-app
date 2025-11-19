import { app } from '@azure/functions';

// Import and register all functions
import './applications/submit/index';
import './applications/get-sas-token/index';

// Import A/B testing functions from functions.ts
import './src/functions';

export { app };