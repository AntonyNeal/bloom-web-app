// Force rebuild - 2025-12-04 - Add Halaxy availability function
import { app } from '@azure/functions';

// Import and register all functions
import '../applications/submit/index';
import '../applications/get-sas-token/index';

// Import A/B testing functions (TypeScript)
import './ab-testing/allocateVariant';
import './ab-testing/trackConversion';

// Import payment functions
import './functions/create-payment-intent';

// Import Halaxy availability function
import './functions/get-halaxy-availability';

// Import debug function
import './functions/debug-slots';

export { app };
