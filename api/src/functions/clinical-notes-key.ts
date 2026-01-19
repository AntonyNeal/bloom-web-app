/**
 * Clinical Notes Encryption Key API
 * 
 * Endpoints for managing practitioner encryption keys.
 * Keys are created during onboarding and wrapped DEKs are stored in DB.
 * 
 * GET /api/clinical-notes/encryption-key - Get wrapped DEK for current practitioner
 * POST /api/clinical-notes/encryption-key/create - Create key (admin/onboarding only)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { DefaultAzureCredential } from '@azure/identity';
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';
import { getPractitionerByAzureId } from '../services/practitioner';

// ============================================================================
// Configuration
// ============================================================================

const KEY_VAULT_NAME = process.env.KEY_VAULT_NAME || 'kv-bloom-notes';
const KEY_VAULT_URL = `https://${KEY_VAULT_NAME}.vault.azure.net`;
const KEY_PREFIX = 'notes-key-';

const getDbConfig = (): string | sql.config => {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  if (connectionString) return connectionString;
  return {
    server: process.env.SQL_SERVER!,
    database: process.env.SQL_DATABASE!,
    user: process.env.SQL_USER!,
    password: process.env.SQL_PASSWORD!,
    options: { encrypt: true, trustServerCertificate: false },
  };
};

// ============================================================================
// GET /api/clinical-notes/encryption-key
// ============================================================================

async function getEncryptionKey(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Clinical Notes: Get encryption key');

  const azureUserId = request.headers.get('X-Azure-User-Id');
  if (!azureUserId) {
    return {
      status: 401,
      jsonBody: { success: false, error: 'Authentication required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const practitioner = await getPractitionerByAzureId(azureUserId);
    if (!practitioner) {
      return {
        status: 403,
        jsonBody: { success: false, error: 'Not a registered practitioner' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Get wrapped DEK from database
    const result = await pool.request()
      .input('practitioner_id', sql.NVarChar, practitioner.id)
      .query(`
        SELECT 
          wrapped_dek,
          key_name,
          key_version,
          created_at
        FROM practitioner_encryption_keys
        WHERE practitioner_id = @practitioner_id
          AND is_active = 1
      `);

    if (result.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { 
          success: false, 
          error: 'Notes not enabled for this practitioner',
          code: 'NOTES_NOT_ENABLED',
        },
      };
    }

    const keyData = result.recordset[0];

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          wrappedKey: keyData.wrapped_dek,
          keyName: keyData.key_name,
          keyVersion: keyData.key_version,
          createdAt: keyData.created_at,
        },
      },
    };
  } catch (error) {
    context.error('Error getting encryption key:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// POST /api/clinical-notes/encryption-key/create
// Called during onboarding to create practitioner's encryption key
// ============================================================================

async function createEncryptionKey(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Clinical Notes: Create encryption key');

  // This endpoint should only be called during onboarding
  // In production, add additional authorization checks
  
  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      practitionerId: string;
      azureObjectId: string;
      email: string;
    };

    if (!body.practitionerId || !body.azureObjectId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'practitionerId and azureObjectId required' },
      };
    }

    const keyName = `${KEY_PREFIX}${body.azureObjectId}`;
    context.log(`Creating encryption key: ${keyName}`);

    // Step 1: Create RSA key in Key Vault for this practitioner
    const credential = new DefaultAzureCredential();
    const keyClient = new KeyClient(KEY_VAULT_URL, credential);

    let rsaKey;
    try {
      rsaKey = await keyClient.createRsaKey(keyName, {
        keySize: 4096,
        keyOps: ['wrapKey', 'unwrapKey'],
        tags: {
          purpose: 'clinical-notes-dek-wrapping',
          practitioner: body.azureObjectId,
          email: body.email,
          created: new Date().toISOString(),
        },
      });
      context.log(`Created RSA key: ${rsaKey.id}`);
    } catch (error: unknown) {
      const err = error as { code?: string; statusCode?: number };
      if (err.code === 'KeyAlreadyExists' || err.statusCode === 409) {
        context.log(`Key already exists: ${keyName}`);
        rsaKey = await keyClient.getKey(keyName);
      } else {
        throw error;
      }
    }

    // Step 2: Generate random AES-256 DEK
    const dekBytes = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(dekBytes);
    context.log('Generated random DEK');

    // Step 3: Wrap DEK with RSA key in Key Vault
    const cryptoClient = new CryptographyClient(rsaKey.id!, credential);
    const wrapResult = await cryptoClient.wrapKey('RSA-OAEP-256', dekBytes);
    const wrappedDekBase64 = Buffer.from(wrapResult.result).toString('base64');
    context.log('Wrapped DEK with Key Vault');

    // Step 4: Store wrapped DEK in database
    pool = await sql.connect(getDbConfig());

    await pool.request()
      .input('practitioner_id', sql.NVarChar, body.practitionerId)
      .input('azure_object_id', sql.NVarChar, body.azureObjectId)
      .input('key_name', sql.NVarChar, rsaKey.name)
      .input('key_version', sql.NVarChar, rsaKey.properties.version)
      .input('wrapped_dek', sql.NVarChar, wrappedDekBase64)
      .query(`
        -- Deactivate any existing keys
        UPDATE practitioner_encryption_keys
        SET is_active = 0, deactivated_at = GETDATE()
        WHERE practitioner_id = @practitioner_id AND is_active = 1;

        -- Insert new key
        INSERT INTO practitioner_encryption_keys (
          practitioner_id, azure_object_id, key_name, key_version, 
          wrapped_dek, is_active, created_at
        ) VALUES (
          @practitioner_id, @azure_object_id, @key_name, @key_version,
          @wrapped_dek, 1, GETDATE()
        );

        -- Update practitioner record
        UPDATE practitioners
        SET notes_enabled = 1, notes_key_created_at = GETDATE()
        WHERE id = @practitioner_id;
      `);

    context.log(`✅ Encryption key created for practitioner ${body.practitionerId}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: {
          keyName: rsaKey.name,
          keyVersion: rsaKey.properties.version,
          createdAt: rsaKey.properties.createdOn,
        },
      },
    };
  } catch (error) {
    context.error('Error creating encryption key:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  } finally {
    if (pool) await pool.close();
  }
}

// ============================================================================
// Register Functions
// ============================================================================

app.http('clinical-notes-get-key', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clinical-notes/encryption-key',
  handler: getEncryptionKey,
});

app.http('clinical-notes-create-key', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/encryption-key/create',
  handler: createEncryptionKey,
});
