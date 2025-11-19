"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const sql = __importStar(require("mssql"));
// Support both connection string and individual credentials
const getConfig = () => {
    const connectionString = process.env.SQL_CONNECTION_STRING;
    if (connectionString) {
        return connectionString;
    }
    return {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false,
        },
    };
};
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
        const config = getConfig();
        const pool = await sql.connect(config);
        if (method === 'GET' && testName) {
            context.log(`Fetching A/B test results for ${testName}`);
            // Query test events from database
            const result = await pool.request().input('testName', sql.NVarChar, testName).query(`
          SELECT
            variant,
            COUNT(*) as allocations,
            SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
          FROM ab_test_events
          WHERE test_name = @testName
          GROUP BY variant
        `);
            if (!result.recordset || result.recordset.length === 0) {
                return {
                    status: 404,
                    headers,
                    jsonBody: { error: `No test data found for '${testName}'` },
                };
            }
            // Build response with test data and calculate statistics
            const variants = {};
            for (const row of result.recordset) {
                variants[row.variant] = {
                    allocations: row.allocations,
                    conversions: row.conversions,
                    conversionRate: row.conversions / row.allocations,
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
            const result = await pool.request().query(`
        SELECT DISTINCT test_name
        FROM ab_test_events
        ORDER BY test_name
      `);
            const summaries = result.recordset.map((row) => ({
                testName: row.test_name,
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
//# sourceMappingURL=ab-test-old.js.map