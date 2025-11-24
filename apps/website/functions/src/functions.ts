// Force rebuild - 2025-11-24 - Deploy payment integration
import { app } from '@azure/functions';

// Import and register all functions
import '../applications/submit/index';
import '../applications/get-sas-token/index';

// Import A/B testing functions (TypeScript)
import './ab-testing/allocateVariant';
import './ab-testing/trackConversion';

// Import payment functions
import './functions/create-payment-intent';

export { app };
