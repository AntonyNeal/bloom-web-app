// Force rebuild - 2025-11-24
import { app } from '@azure/functions';

// Import and register all functions
import '../applications/submit/index';
import '../applications/get-sas-token/index';

// Import A/B testing functions (TypeScript)
import './ab-testing/allocateVariant';
import './ab-testing/trackConversion';

export { app };
