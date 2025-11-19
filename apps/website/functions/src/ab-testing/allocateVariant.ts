/**
 * Azure Function for A/B Testing Variant Allocation
 * Allocates users to test variants based on evidence-based research
 * - Single CTA vs Multiple CTAs (371% more clicks expected)
 * - Mobile touch target optimization (48x48px minimum)
 * - Form field reduction (4 fields vs current)
 * - Trust badge optimization (3 vs 4 badges)
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { CosmosClient } from '@azure/cosmos';

// Test configuration interface
interface TestConfig {
  name: string;
  description: string;
  variants: string[];
  weights: number[];
  hypothesis: string;
}

// Evidence-based A/B test configurations
const TEST_CONFIGURATIONS: Record<string, TestConfig> = {
  'homepage-header-test': {
    name: 'Homepage Header Optimization',
    description: 'Healthcare-optimized vs Minimal header design',
    variants: ['healthcare-optimized', 'minimal'],
    weights: [50, 50], // Fair 50/50 split for header test
    hypothesis:
      'Healthcare-optimized version will increase conversions by 15-25%',
  },
  'hero-cta-test': {
    name: 'Hero CTA Optimization',
    description:
      'Single CTA vs Multiple CTAs - Research shows 371% more clicks',
    variants: ['single-cta', 'multi-cta'],
    weights: [70, 30], // Bias toward single CTA based on research
    hypothesis: 'Single CTA will increase conversions by 25-35%',
  },
  'mobile-touch-test': {
    name: 'Mobile Touch Target Optimization',
    description: '48x48px buttons vs 32px - WCAG 2.2 compliance for healthcare',
    variants: ['48px-buttons', '32px-buttons'],
    weights: [80, 20], // Strong bias toward accessibility standards
    hypothesis: '48px touch targets improve mobile conversion by 10-15%',
  },
  'form-fields-test': {
    name: 'Form Field Reduction',
    description: '4 fields vs current - 120% improvement documented',
    variants: ['4-fields', 'current-fields'],
    weights: [75, 25], // Strong bias based on form abandonment research
    hypothesis: '4 fields reduce abandonment by 30-50%',
  },
  'trust-badges-test': {
    name: 'Trust Badge Optimization',
    description: '3 badges vs 4 - Prevent cognitive overload for anxious users',
    variants: ['3-badges', '4-badges'],
    weights: [60, 40], // Moderate bias toward simplification
    hypothesis: '3 badges improve trust signals without overwhelm',
  },
};

// Cosmos DB client initialization
let cosmosClient: CosmosClient | undefined;
if (process.env.COSMOS_DB_CONNECTION_STRING) {
  cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
}

/**
 * Generate consistent user ID from IP and user agent
 */
function generateUserId(request: HttpRequest): string {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = Date.now();

  // Create a hash-like ID (simplified for demo)
  const combined = `${ip}-${userAgent}-${Math.floor(timestamp / (24 * 60 * 60 * 1000))}`;
  return Buffer.from(combined).toString('base64').substring(0, 16);
}

/**
 * Allocate user to variant based on weighted distribution
 */
function allocateUserToVariant(userId: string, testConfig: TestConfig): string {
  // Use user ID to create consistent allocation
  const hash = userId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const normalizedHash = Math.abs(hash) % 100;
  const weights = testConfig.weights;

  let cumulativeWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (normalizedHash < cumulativeWeight) {
      return testConfig.variants[i];
    }
  }

  // Fallback to first variant
  return testConfig.variants[0];
}

/**
 * Track variant allocation in Cosmos DB
 */
async function trackVariantAllocation(
  userId: string,
  testName: string,
  variant: string,
  deviceType: string,
  location: string,
  context: InvocationContext
): Promise<void> {
  if (!cosmosClient) {
    context.log('Cosmos DB client not initialized - skipping tracking');
    return;
  }

  try {
    const database = cosmosClient.database('conversion-analytics');
    const container = database.container('user-sessions');

    const allocationRecord = {
      id: `${userId}-${testName}-${Date.now()}`,
      userId: userId,
      testName: testName,
      variant: variant,
      timestamp: new Date().toISOString(),
      deviceType: deviceType,
      location: location,
      type: 'variant-allocation',
      ttl: 2592000, // 30 days
    };

    await container.items.create(allocationRecord);
    context.log(
      `Tracked variant allocation: ${userId} -> ${variant} for ${testName}`
    );
  } catch (error) {
    context.error('Error tracking variant allocation:', error);
  }
}

/**
 * Main Azure Function for variant allocation
 */
async function allocateVariantHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('A/B Testing variant allocation request received');

  try {
    // Extract parameters
    const url = new URL(request.url);
    const testName = url.searchParams.get('test') || 'homepage-header-test';
    const userId = url.searchParams.get('userId') || generateUserId(request);
    const deviceType = request.headers.get('user-agent')?.includes('Mobile')
      ? 'mobile'
      : 'desktop';
    const location = request.headers.get('cf-ipcountry') || 'AU'; // Default to Australia

    // Get test configuration
    const testConfig =
      TEST_CONFIGURATIONS[testName as keyof typeof TEST_CONFIGURATIONS];
    if (!testConfig) {
      return {
        status: 400,
        jsonBody: {
          error: 'Unknown test name',
          availableTests: Object.keys(TEST_CONFIGURATIONS),
        },
      };
    }

    // Allocate variant
    const variant = allocateUserToVariant(userId, testConfig);

    // Track allocation
    await trackVariantAllocation(
      userId,
      testName,
      variant,
      deviceType,
      location,
      context
    );

    // Return allocation result
    const response = {
      userId: userId,
      testName: testName,
      variant: variant,
      testConfig: {
        name: testConfig.name,
        description: testConfig.description,
        hypothesis: testConfig.hypothesis,
      },
      deviceType: deviceType,
      timestamp: new Date().toISOString(),
    };

    context.log(
      `Allocated user ${userId} to variant ${variant} for test ${testName}`
    );

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      jsonBody: response,
    };
  } catch (error) {
    context.error('Error in variant allocation:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Register the function
app.http('allocateVariant', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'ab-test/allocate',
  handler: allocateVariantHandler,
});
