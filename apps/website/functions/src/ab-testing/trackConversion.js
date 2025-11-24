/**
 * Azure Function for Conversion Tracking
 * Tracks conversion events for A/B testing analysis
 * Supports healthcare-specific metrics and statistical significance calculations
 */

const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const appInsights = require('applicationinsights');

// Initialize Cosmos DB client
let cosmosClient;
if (process.env.COSMOS_DB_CONNECTION_STRING) {
    cosmosClient = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
}

/**
 * Track conversion event in Cosmos DB and Application Insights
 */
async function trackConversionEvent(userId, testName, variant, eventType, eventData, deviceType) {
    if (!cosmosClient) return;
    
    try {
        const database = cosmosClient.database('conversion-analytics');
        const container = database.container('user-sessions');
        
        const conversionRecord = {
            id: `${userId}-${eventType}-${Date.now()}`,
            userId: userId,
            testName: testName,
            variant: variant,
            eventType: eventType,
            eventData: eventData,
            deviceType: deviceType,
            timestamp: new Date().toISOString(),
            type: 'conversion-event',
            ttl: 2592000 // 30 days
        };
        
        await container.items.create(conversionRecord);
        
        // Track in Application Insights with custom metrics
        if (appInsights.defaultClient) {
            appInsights.defaultClient.trackEvent({
                name: `Conversion_${eventType}`,
                properties: {
                    testName: testName,
                    variant: variant,
                    deviceType: deviceType,
                    ...eventData
                }
            });
            
            // Track conversion as custom metric for dashboard
            appInsights.defaultClient.trackMetric({
                name: 'ConversionEvent',
                value: 1,
                properties: {
                    testName: testName,
                    variant: variant,
                    eventType: eventType,
                    deviceType: deviceType
                }
            });
        }
        
        console.log(`Tracked ${eventType} conversion for user ${userId} in test ${testName}, variant ${variant}`);
        
    } catch (error) {
        console.error('Error tracking conversion event:', error);
        throw error;
    }
}

/**
 * Calculate statistical significance for A/B test results
 */
async function calculateStatisticalSignificance(testName) {
    if (!cosmosClient) return null;
    
    try {
        const database = cosmosClient.database('conversion-analytics');
        const container = database.container('user-sessions');
        
        // Query for allocations and conversions
        const query = `
            SELECT 
                c.variant,
                c.type,
                COUNT(1) as count
            FROM c 
            WHERE c.testName = @testName 
            AND c.type IN ('variant-allocation', 'conversion-event')
            GROUP BY c.variant, c.type
        `;
        
        const { resources } = await container.items.query({
            query: query,
            parameters: [{ name: '@testName', value: testName }]
        }).fetchAll();
        
        // Organize results by variant
        const variantStats = {};
        resources.forEach(result => {
            if (!variantStats[result.variant]) {
                variantStats[result.variant] = { allocations: 0, conversions: 0 };
            }
            
            if (result.type === 'variant-allocation') {
                variantStats[result.variant].allocations = result.count;
            } else if (result.type === 'conversion-event') {
                variantStats[result.variant].conversions = result.count;
            }
        });
        
        // Calculate conversion rates and statistical significance
        const variants = Object.keys(variantStats);
        if (variants.length !== 2) {
            return { error: 'Need exactly 2 variants for statistical significance calculation' };
        }
        
        const [variantA, variantB] = variants;
        const statsA = variantStats[variantA];
        const statsB = variantStats[variantB];
        
        const conversionRateA = statsA.conversions / statsA.allocations;
        const conversionRateB = statsB.conversions / statsB.allocations;
        
        // Simple z-test for proportions (simplified implementation)
        const pooledRate = (statsA.conversions + statsB.conversions) / (statsA.allocations + statsB.allocations);
        const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/statsA.allocations + 1/statsB.allocations));
        const zScore = Math.abs(conversionRateA - conversionRateB) / standardError;
        
        // P-value approximation (simplified)
        const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
        const isSignificant = pValue < 0.05;
        
        const improvement = ((conversionRateB - conversionRateA) / conversionRateA) * 100;
        
        return {
            testName: testName,
            variants: {
                [variantA]: {
                    allocations: statsA.allocations,
                    conversions: statsA.conversions,
                    conversionRate: conversionRateA
                },
                [variantB]: {
                    allocations: statsB.allocations,
                    conversions: statsB.conversions,
                    conversionRate: conversionRateB
                }
            },
            statisticalSignificance: {
                zScore: zScore,
                pValue: pValue,
                isSignificant: isSignificant,
                confidenceLevel: isSignificant ? '95%' : 'Not significant'
            },
            improvement: {
                percentage: improvement,
                winner: conversionRateB > conversionRateA ? variantB : variantA
            }
        };
        
    } catch (error) {
        console.error('Error calculating statistical significance:', error);
        return { error: error.message };
    }
}

/**
 * Normal CDF approximation for p-value calculation
 */
function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
}

/**
 * Main Azure Function for conversion tracking
 */
app.http('trackConversion', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ab-test/track',
    handler: async (request, context) => {
        context.log('Conversion tracking request received');
        
        try {
            const body = await request.json();
            const {
                userId,
                testName,
                variant,
                eventType,
                eventData = {},
                deviceType
            } = body;
            
            // Validate required fields
            if (!userId || !testName || !variant || !eventType) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        error: 'Missing required fields: userId, testName, variant, eventType'
                    })
                };
            }
            
            // Track the conversion event
            await trackConversionEvent(userId, testName, variant, eventType, eventData, deviceType);
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Conversion event tracked successfully',
                    timestamp: new Date().toISOString()
                })
            };
            
        } catch (error) {
            context.log.error('Error tracking conversion:', error);
            
            return {
                status: 500,
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: error.message
                })
            };
        }
    }
});

/**
 * Azure Function for getting A/B test results and statistical significance
 */
app.http('getTestResults', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'ab-test/results/{testName}',
    handler: async (request, context) => {
        context.log('Test results request received');
        
        try {
            const testName = request.params.testName;
            
            if (!testName) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        error: 'Test name is required'
                    })
                };
            }
            
            // Calculate statistical significance
            const results = await calculateStatisticalSignificance(testName);
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(results)
            };
            
        } catch (error) {
            context.log.error('Error getting test results:', error);
            
            return {
                status: 500,
                body: JSON.stringify({
                    error: 'Internal server error',
                    message: error.message
                })
            };
        }
    }
});