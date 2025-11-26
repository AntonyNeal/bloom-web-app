import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { CosmosClient } from '@azure/cosmos';

// ============================================================================
// SMOKE TEST API ENDPOINT
// Tests all APIs, database connections, and schema integrity
// ============================================================================

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  details?: unknown;
  subTests?: TestResult[];
}

interface SmokeTestResponse {
  timestamp: string;
  environment: string;
  overallStatus: 'pass' | 'fail' | 'partial';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  results: {
    api: TestResult[];
    sql: TestResult[];
    cosmos: TestResult[];
    schema: TestResult[];
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Get SQL config
const getSqlConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;

  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      requestTimeout: 30000,
    },
  };
};

// Run a single test with timing
async function runTest(
  name: string,
  testFn: () => Promise<{ success: boolean; message?: string; details?: unknown; subTests?: TestResult[] }>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await testFn();
    return {
      name,
      status: result.success ? 'pass' : 'fail',
      duration: Date.now() - startTime,
      message: result.message,
      details: result.details,
      subTests: result.subTests,
    };
  } catch (error) {
    return {
      name,
      status: 'fail',
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// API TESTS
// ============================================================================

async function testApiEndpoints(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test health endpoint
  results.push(
    await runTest('API Health Check', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      return {
        success: response.ok,
        message: response.ok ? 'Health endpoint responding' : `Status: ${response.status}`,
      };
    })
  );

  // Test applications endpoint (GET)
  results.push(
    await runTest('Applications API (GET)', async () => {
      const response = await fetch(`${baseUrl}/api/applications`);
      if (!response.ok) {
        return { success: false, message: `Status: ${response.status}` };
      }
      const data = await response.json();
      return {
        success: true,
        message: `Retrieved ${Array.isArray(data) ? data.length : 0} applications`,
        details: { count: Array.isArray(data) ? data.length : 0 },
      };
    })
  );

  // Test A/B test endpoint
  results.push(
    await runTest('A/B Test API', async () => {
      const response = await fetch(`${baseUrl}/api/ab-test?name=test-smoke`);
      return {
        success: response.ok || response.status === 404,
        message: response.ok ? 'A/B test endpoint responding' : `Status: ${response.status}`,
      };
    })
  );

  // Test DBVC health endpoint (skip if Cosmos DB not configured)
  const cosmosConnectionString = process.env.COSMOS_DB_CONNECTION_STRING || process.env.DBVC_COSMOS_CONNECTION_STRING;
  if (!cosmosConnectionString) {
    results.push({
      name: 'DBVC Health API',
      status: 'skip',
      duration: 0,
      message: 'Skipped - Cosmos DB not configured',
    });
  } else {
    results.push(
      await runTest('DBVC Health API', async () => {
        const response = await fetch(`${baseUrl}/api/dbvc/health`);
        if (response.status === 503) {
          const data = await response.json().catch(() => ({}));
          return {
            success: false,
            message: `Service unavailable (Cosmos DB not configured)`,
            details: data,
          };
        }
        return {
          success: response.ok,
          message: response.ok ? 'DBVC endpoint responding' : `Status: ${response.status}`,
        };
      })
    );
  }

  return results;
}

// ============================================================================
// SQL DATABASE TESTS
// ============================================================================

async function testSqlDatabase(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let pool: sql.ConnectionPool | null = null;

  // Test connection
  results.push(
    await runTest('SQL Connection', async () => {
      const config = getSqlConfig();
      pool = await sql.connect(config);
      return { success: true, message: 'Connected to SQL Database' };
    })
  );

  if (!pool) {
    return results;
  }

  // Test each table
  const tables = [
    { name: 'applications', expectedColumns: ['id', 'first_name', 'last_name', 'email', 'status', 'created_at'] },
    // Note: A/B testing tables will be created when A/B testing feature is fully implemented
    // { name: 'ab_test_events', expectedColumns: ['id', 'test_name', 'variant', 'event_type'] },
    // { name: 'ab_test_conversions', expectedColumns: ['id', 'test_name', 'variant'] },
    // { name: 'session_tracking', expectedColumns: ['id', 'session_id', 'page_path'] },
  ];

  for (const table of tables) {
    results.push(
      await runTest(`SQL Table: ${table.name}`, async () => {
        const subTests: TestResult[] = [];

        // Check table exists and get row count
        const countResult = await pool!.request().query(`
          SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${table.name}'
        `);

        if (countResult.recordset[0].count === 0) {
          return { 
            success: false, 
            message: `Table '${table.name}' does not exist`,
            subTests 
          };
        }

        // Get row count
        const rowCountResult = await pool!.request().query(`SELECT COUNT(*) as count FROM [${table.name}]`);
        const rowCount = rowCountResult.recordset[0].count;

        subTests.push({
          name: 'Table Exists',
          status: 'pass',
          duration: 0,
          message: `${rowCount} rows`,
        });

        // Check columns
        const columnsResult = await pool!.request().query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${table.name}'
        `);

        const existingColumns = columnsResult.recordset.map((r) => r.COLUMN_NAME.toLowerCase());
        
        for (const col of table.expectedColumns) {
          const exists = existingColumns.includes(col.toLowerCase());
          subTests.push({
            name: `Column: ${col}`,
            status: exists ? 'pass' : 'fail',
            duration: 0,
            message: exists ? 'Present' : 'Missing',
          });
        }

        const allColumnsExist = table.expectedColumns.every((col) =>
          existingColumns.includes(col.toLowerCase())
        );

        return {
          success: allColumnsExist,
          message: allColumnsExist
            ? `All ${table.expectedColumns.length} expected columns present (${rowCount} rows)`
            : `Missing columns detected`,
          details: { rowCount, columns: existingColumns },
          subTests,
        };
      })
    );
  }

  // Close connection
  await pool.close();
  return results;
}

// ============================================================================
// COSMOS DB TESTS
// ============================================================================

async function testCosmosDatabase(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING || process.env.DBVC_COSMOS_CONNECTION_STRING;

  if (!connectionString) {
    results.push({
      name: 'Cosmos Connection',
      status: 'skip',
      duration: 0,
      message: 'No Cosmos DB connection string configured',
    });
    return results;
  }

  // Test connection
  results.push(
    await runTest('Cosmos Connection', async () => {
      const client = new CosmosClient(connectionString);
      const { resources: databases } = await client.databases.readAll().fetchAll();
      return {
        success: true,
        message: `Connected. Found ${databases.length} database(s)`,
        details: { databases: databases.map((d) => d.id) },
      };
    })
  );

  // Test specific containers
  const containers = ['ab-tests', 'change-events', 'schema-snapshots'];

  for (const containerName of containers) {
    results.push(
      await runTest(`Cosmos Container: ${containerName}`, async () => {
        try {
          const client = new CosmosClient(connectionString);
          const dbName = process.env.COSMOS_DB_DATABASE || process.env.DBVC_COSMOS_DATABASE || 'version-control';
          const container = client.database(dbName).container(containerName);
          const { resources } = await container.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll();
          return {
            success: true,
            message: `Container accessible (${resources[0] || 0} items)`,
          };
        } catch (error) {
          // Container might not exist
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Container not found',
          };
        }
      })
    );
  }

  return results;
}

// ============================================================================
// SCHEMA INTEGRITY TESTS
// ============================================================================

async function testSchemaIntegrity(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let pool: sql.ConnectionPool | null = null;

  try {
    const config = getSqlConfig();
    pool = await sql.connect(config);

    // Test indexes exist
    results.push(
      await runTest('Database Indexes', async () => {
        const indexResult = await pool!.request().query(`
          SELECT t.name as table_name, i.name as index_name, i.type_desc
          FROM sys.indexes i
          INNER JOIN sys.tables t ON i.object_id = t.object_id
          WHERE i.name IS NOT NULL
          ORDER BY t.name, i.name
        `);

        const indexCount = indexResult.recordset.length;
        const subTests: TestResult[] = indexResult.recordset.slice(0, 10).map((idx) => ({
          name: `${idx.table_name}.${idx.index_name}`,
          status: 'pass' as const,
          duration: 0,
          message: idx.type_desc,
        }));

        return {
          success: indexCount > 0,
          message: `${indexCount} indexes found`,
          subTests,
        };
      })
    );

    // Test foreign keys
    results.push(
      await runTest('Foreign Key Constraints', async () => {
        const fkResult = await pool!.request().query(`
          SELECT 
            fk.name as constraint_name,
            tp.name as parent_table,
            tr.name as referenced_table
          FROM sys.foreign_keys fk
          INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
          INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
        `);

        return {
          success: true,
          message: `${fkResult.recordset.length} foreign key constraints`,
          details: fkResult.recordset,
        };
      })
    );

    // Test stored procedures
    results.push(
      await runTest('Stored Procedures', async () => {
        const spResult = await pool!.request().query(`
          SELECT name, create_date, modify_date
          FROM sys.procedures
          ORDER BY name
        `);

        const subTests: TestResult[] = spResult.recordset.map((sp) => ({
          name: sp.name,
          status: 'pass' as const,
          duration: 0,
          message: `Modified: ${sp.modify_date}`,
        }));

        return {
          success: true,
          message: `${spResult.recordset.length} stored procedures`,
          subTests,
        };
      })
    );

    await pool.close();
  } catch (error) {
    results.push({
      name: 'Schema Integrity',
      status: 'fail',
      duration: 0,
      message: error instanceof Error ? error.message : 'Failed to check schema',
    });
  }

  return results;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

async function smokeTestHandler(
  req: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  const startTime = Date.now();
  const baseUrl = req.url.split('/api/smoke-test')[0];
  
  // Determine environment
  const environment = process.env.AZURE_FUNCTIONS_ENVIRONMENT || 
    (baseUrl.includes('localhost') ? 'local' : 
     baseUrl.includes('-dev') ? 'dev' : 
     baseUrl.includes('-staging') ? 'staging' : 'prod');

  const results: SmokeTestResponse['results'] = {
    api: [],
    sql: [],
    cosmos: [],
    schema: [],
  };

  // Run all test suites
  try {
    // API tests
    results.api = await testApiEndpoints(baseUrl);
  } catch (error) {
    results.api = [{
      name: 'API Tests',
      status: 'fail',
      duration: 0,
      message: error instanceof Error ? error.message : 'API tests failed',
    }];
  }

  try {
    // SQL tests
    results.sql = await testSqlDatabase();
  } catch (error) {
    results.sql = [{
      name: 'SQL Tests',
      status: 'fail',
      duration: 0,
      message: error instanceof Error ? error.message : 'SQL tests failed',
    }];
  }

  try {
    // Cosmos tests
    results.cosmos = await testCosmosDatabase();
  } catch (error) {
    results.cosmos = [{
      name: 'Cosmos Tests',
      status: 'fail',
      duration: 0,
      message: error instanceof Error ? error.message : 'Cosmos tests failed',
    }];
  }

  try {
    // Schema tests
    results.schema = await testSchemaIntegrity();
  } catch (error) {
    results.schema = [{
      name: 'Schema Tests',
      status: 'fail',
      duration: 0,
      message: error instanceof Error ? error.message : 'Schema tests failed',
    }];
  }

  // Calculate totals
  const allResults = [...results.api, ...results.sql, ...results.cosmos, ...results.schema];
  const passedTests = allResults.filter((r) => r.status === 'pass').length;
  const failedTests = allResults.filter((r) => r.status === 'fail').length;
  const skippedTests = allResults.filter((r) => r.status === 'skip').length;

  const response: SmokeTestResponse = {
    timestamp: new Date().toISOString(),
    environment,
    overallStatus: failedTests === 0 ? 'pass' : passedTests === 0 ? 'fail' : 'partial',
    totalTests: allResults.length,
    passedTests,
    failedTests,
    skippedTests,
    totalDuration: Date.now() - startTime,
    results,
  };

  return {
    status: 200,
    headers: corsHeaders,
    jsonBody: response,
  };
}

// Register the function
app.http('smoke-test', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'smoke-test',
  handler: smokeTestHandler,
});

export default smokeTestHandler;
