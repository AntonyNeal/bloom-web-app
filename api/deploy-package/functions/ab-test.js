"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const cosmos_1 = require("@azure/cosmos");
// Get Cosmos DB client
function getCosmosClient() {
    const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error('COSMOS_DB_CONNECTION_STRING not configured');
    }
    return new cosmos_1.CosmosClient(connectionString);
}
// Calculate z-score and p-value for statistical significance
function calculateStatisticalSignificance(control, variant) {
    const p1 = control.conversions / control.allocations;
    const p2 = variant.conversions / variant.allocations;
    const p = (control.conversions + variant.conversions) / (control.allocations + variant.allocations);
    const se = Math.sqrt(p * (1 - p) * (1 / control.allocations + 1 / variant.allocations));
    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const isSignificant = pValue < 0.05;
    const confidenceLevel = isSignificant
        ? `${Math.round((1 - pValue) * 100)}%`
        : `${Math.round((1 - pValue) * 100)}%`;
    return { zScore, pValue, isSignificant, confidenceLevel };
}
// Normal distribution CDF approximation
function normalCDF(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    const y = 1.0 - (a5 * t5 + a4 * t4 + a3 * t3 + a2 * t2 + a1 * t) * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
}
async function abTestHandler(req, context) {
    const method = req.method;
    const testName = req.params.testName;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    };
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return { status: 204, headers };
    }
    try {
        const cosmosClient = getCosmosClient();
        const database = cosmosClient.database('bloom-ab-testing');
        const container = database.container('test-events');
        if (method === 'GET' && testName) {
            context.log(`Fetching A/B test results for ${testName}`);
            // Query Cosmos DB for test events
            const query = {
                query: 'SELECT c.variant, c.converted FROM c WHERE c.testName = @testName',
                parameters: [{ name: '@testName', value: testName }],
            };
            const { resources } = await container.items.query(query).fetchAll();
            if (!resources || resources.length === 0) {
                return {
                    status: 404,
                    headers,
                    jsonBody: { error: `No test data found for '${testName}'` },
                };
            }
            // Aggregate results by variant
            const variantStats = {};
            for (const event of resources) {
                const variant = event.variant;
                if (!variantStats[variant]) {
                    variantStats[variant] = { allocations: 0, conversions: 0 };
                }
                variantStats[variant].allocations++;
                if (event.converted) {
                    variantStats[variant].conversions++;
                }
            }
            // Build response with test data and calculate statistics
            const variants = {};
            for (const [variantName, stats] of Object.entries(variantStats)) {
                variants[variantName] = {
                    allocations: stats.allocations,
                    conversions: stats.conversions,
                    conversionRate: stats.conversions / stats.allocations,
                };
            }
            // Calculate improvement (comparing first variant as control to others)
            const variantNames = Object.keys(variants);
            const controlVariant = variants[variantNames[0]];
            let winner = variantNames[0];
            let maxConversionRate = controlVariant.conversionRate;
            for (const vName of variantNames.slice(1)) {
                if (variants[vName].conversionRate > maxConversionRate) {
                    maxConversionRate = variants[vName].conversionRate;
                    winner = vName;
                }
            }
            const improvement = {
                percentage: ((maxConversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) *
                    100,
                winner,
            };
            // Calculate statistical significance
            const statSig = calculateStatisticalSignificance(controlVariant, variants[winner]);
            const testResult = {
                testName,
                variants,
                statisticalSignificance: statSig,
                improvement,
            };
            return {
                status: 200,
                headers,
                jsonBody: testResult,
            };
        }
        if (method === 'GET') {
            // Return all test summaries
            context.log('Fetching all A/B test summaries');
            const query = {
                query: 'SELECT DISTINCT c.testName FROM c',
            };
            const { resources } = await container.items.query(query).fetchAll();
            const summaries = resources.map((row) => ({
                testName: row.testName,
                lastUpdated: new Date().toISOString(),
            }));
            return {
                status: 200,
                headers,
                jsonBody: summaries,
            };
        }
        return {
            status: 405,
            headers,
            jsonBody: { error: 'Method not allowed' },
        };
    }
    catch (error) {
        context.error('Error in A/B test handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return {
            status: 500,
            headers,
            jsonBody: { error: errorMessage },
        };
    }
}
functions_1.app.http('ab-test', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'ab-test/results/{testName?}',
    handler: abTestHandler,
});
//# sourceMappingURL=ab-test.js.map