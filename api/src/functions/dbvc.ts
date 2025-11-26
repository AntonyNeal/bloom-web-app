/**
 * Database Version Control - Azure Functions HTTP Endpoints
 * 
 * Provides HTTP triggers for the migration service, enabling:
 * - REST API access to migration operations
 * - CLI tool integration
 * - CI/CD pipeline integration
 * 
 * @author LPA Development Team
 * @date 2025-11-27
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { migrationService } from '../db-version-control/migration-service';
import {
  CreateMigrationInput,
  RunMigrationsInput,
  RollbackMigrationInput,
  GetMigrationStatusInput,
  CaptureSchemaSnapshotInput,
  VerifyIntegrityInput,
  ApiResponse,
  Environment,
} from '../db-version-control/types';

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Executor',
  'Access-Control-Max-Age': '86400',
};

// ============================================================================
// Helper Functions
// ============================================================================

function createResponse<T>(data: T, status = 200): HttpResponseInit {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    timestamp: new Date().toISOString(),
  };
  return {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    jsonBody: response,
  };
}

function createErrorResponse(code: string, message: string, status = 500, details?: unknown): HttpResponseInit {
  const response: ApiResponse<null> = {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
  return {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    jsonBody: response,
  };
}

function getExecutor(req: HttpRequest): string {
  return req.headers.get('X-Executor') || req.headers.get('x-ms-client-principal-name') || 'anonymous';
}

// ============================================================================
// Create Migration
// ============================================================================

async function createMigrationHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as Partial<CreateMigrationInput>;

    if (!body.name || !body.databaseId) {
      return createErrorResponse('VALIDATION_ERROR', 'name and databaseId are required', 400);
    }

    const input: CreateMigrationInput = {
      name: body.name,
      databaseId: body.databaseId,
      author: body.author || getExecutor(req),
      description: body.description,
      upScript: body.upScript,
      downScript: body.downScript,
      tags: body.tags,
      dependsOn: body.dependsOn,
    };

    context.log(`Creating migration: ${input.name} for database ${input.databaseId}`);

    const result = await migrationService.createMigration(input);
    return createResponse(result, 201);
  } catch (error) {
    const err = error as Error;
    context.error(`Create migration failed: ${err.message}`);
    return createErrorResponse('CREATE_MIGRATION_ERROR', err.message, 500);
  }
}

app.http('dbvc-create-migration', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/migrations',
  handler: createMigrationHandler,
});

// ============================================================================
// Run Migrations
// ============================================================================

async function runMigrationsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as Partial<RunMigrationsInput>;

    if (!body.databaseId || !body.environment) {
      return createErrorResponse('VALIDATION_ERROR', 'databaseId and environment are required', 400);
    }

    if (!['dev', 'staging', 'prod'].includes(body.environment)) {
      return createErrorResponse('VALIDATION_ERROR', 'environment must be dev, staging, or prod', 400);
    }

    const input: RunMigrationsInput = {
      databaseId: body.databaseId,
      environment: body.environment as Environment,
      targetMigrationId: body.targetMigrationId,
      dryRun: body.dryRun || false,
      executor: body.executor || getExecutor(req),
      executionContext: body.executionContext,
    };

    context.log(`Running migrations for ${input.databaseId} in ${input.environment}${input.dryRun ? ' (DRY RUN)' : ''}`);

    const result = await migrationService.runMigrations(input);
    return createResponse(result, result.success ? 200 : 500);
  } catch (error) {
    const err = error as Error;
    context.error(`Run migrations failed: ${err.message}`);
    return createErrorResponse('RUN_MIGRATIONS_ERROR', err.message, 500);
  }
}

app.http('dbvc-run-migrations', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/migrations/run',
  handler: runMigrationsHandler,
});

// ============================================================================
// Rollback Migration
// ============================================================================

async function rollbackMigrationHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as Partial<RollbackMigrationInput>;

    if (!body.migrationId || !body.databaseId || !body.environment) {
      return createErrorResponse('VALIDATION_ERROR', 'migrationId, databaseId, and environment are required', 400);
    }

    if (!['dev', 'staging', 'prod'].includes(body.environment)) {
      return createErrorResponse('VALIDATION_ERROR', 'environment must be dev, staging, or prod', 400);
    }

    const input: RollbackMigrationInput = {
      migrationId: body.migrationId,
      databaseId: body.databaseId,
      environment: body.environment as Environment,
      executor: body.executor || getExecutor(req),
      executionContext: body.executionContext,
    };

    context.log(`Rolling back migration ${input.migrationId} for ${input.databaseId} in ${input.environment}`);

    const result = await migrationService.rollbackMigration(input);
    return createResponse(result, result.success ? 200 : 500);
  } catch (error) {
    const err = error as Error;
    context.error(`Rollback migration failed: ${err.message}`);
    return createErrorResponse('ROLLBACK_MIGRATION_ERROR', err.message, 500);
  }
}

app.http('dbvc-rollback-migration', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/migrations/rollback',
  handler: rollbackMigrationHandler,
});

// ============================================================================
// Get Migration Status
// ============================================================================

async function getMigrationStatusHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const databaseId = req.query.get('databaseId') || undefined;
    const environment = req.query.get('environment') as Environment | undefined;

    if (environment && !['dev', 'staging', 'prod'].includes(environment)) {
      return createErrorResponse('VALIDATION_ERROR', 'environment must be dev, staging, or prod', 400);
    }

    const input: GetMigrationStatusInput = {
      databaseId,
      environment,
    };

    context.log(`Getting migration status${databaseId ? ` for ${databaseId}` : ''}${environment ? ` in ${environment}` : ''}`);

    const result = await migrationService.getMigrationStatus(input);
    return createResponse(result);
  } catch (error) {
    const err = error as Error;
    context.error(`Get migration status failed: ${err.message}`);
    return createErrorResponse('GET_STATUS_ERROR', err.message, 500);
  }
}

app.http('dbvc-get-status', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/migrations/status',
  handler: getMigrationStatusHandler,
});

// ============================================================================
// Capture Schema Snapshot
// ============================================================================

async function captureSchemaSnapshotHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as Partial<CaptureSchemaSnapshotInput>;

    if (!body.databaseId || !body.environment) {
      return createErrorResponse('VALIDATION_ERROR', 'databaseId and environment are required', 400);
    }

    if (!['dev', 'staging', 'prod'].includes(body.environment)) {
      return createErrorResponse('VALIDATION_ERROR', 'environment must be dev, staging, or prod', 400);
    }

    const input: CaptureSchemaSnapshotInput = {
      databaseId: body.databaseId,
      environment: body.environment as Environment,
      captureType: body.captureType || 'manual',
      triggeringMigrationId: body.triggeringMigrationId,
      capturedBy: body.capturedBy || getExecutor(req),
    };

    context.log(`Capturing schema snapshot for ${input.databaseId} in ${input.environment}`);

    const result = await migrationService.captureSchemaSnapshot(input);
    return createResponse(result, 201);
  } catch (error) {
    const err = error as Error;
    context.error(`Capture schema snapshot failed: ${err.message}`);
    return createErrorResponse('CAPTURE_SNAPSHOT_ERROR', err.message, 500);
  }
}

app.http('dbvc-capture-snapshot', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/snapshots',
  handler: captureSchemaSnapshotHandler,
});

// ============================================================================
// Verify Integrity
// ============================================================================

async function verifyIntegrityHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    const body = await req.json() as Partial<VerifyIntegrityInput>;

    if (!body.databaseId || !body.environment) {
      return createErrorResponse('VALIDATION_ERROR', 'databaseId and environment are required', 400);
    }

    if (!['dev', 'staging', 'prod'].includes(body.environment)) {
      return createErrorResponse('VALIDATION_ERROR', 'environment must be dev, staging, or prod', 400);
    }

    const input: VerifyIntegrityInput = {
      databaseId: body.databaseId,
      environment: body.environment as Environment,
      fixDrift: body.fixDrift || false,
    };

    context.log(`Verifying integrity for ${input.databaseId} in ${input.environment}${input.fixDrift ? ' (with fix)' : ''}`);

    const result = await migrationService.verifyIntegrity(input);
    return createResponse(result, result.isValid ? 200 : 422);
  } catch (error) {
    const err = error as Error;
    context.error(`Verify integrity failed: ${err.message}`);
    return createErrorResponse('VERIFY_INTEGRITY_ERROR', err.message, 500);
  }
}

app.http('dbvc-verify-integrity', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  route: 'dbvc/integrity/verify',
  handler: verifyIntegrityHandler,
});

// ============================================================================
// Health Check for DBVC
// ============================================================================

async function dbvcHealthHandler(
  req: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    await migrationService.connect();
    
    return createResponse({
      status: 'healthy',
      service: 'Database Version Control',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    return createErrorResponse('HEALTH_CHECK_ERROR', `Service unhealthy: ${err.message}`, 503);
  }
}

app.http('dbvc-health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'dbvc/health',
  handler: dbvcHealthHandler,
});
