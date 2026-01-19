/**
 * Server-Side Notes Encryption Service
 * 
 * For LLM-generated draft notes, the server needs to encrypt before storing.
 * Uses the same Key Vault keys as client-side encryption.
 * 
 * Flow:
 * 1. LLM generates draft note from transcription
 * 2. Server fetches practitioner's wrapped DEK from DB
 * 3. Server unwraps DEK using Key Vault (server has Key Vault access)
 * 4. Server encrypts note with DEK
 * 5. Encrypted note stored in DB
 * 6. When clinician opens, they decrypt with their DEK (same key)
 * 
 * Security:
 * - Same encryption as client-side (AES-256-GCM)
 * - Same keys (practitioner's DEK from Key Vault)
 * - Server has DEK in memory briefly during encryption only
 * - DEK not stored or logged
 */

import * as sql from 'mssql';
import * as crypto from 'crypto';
import { DefaultAzureCredential } from '@azure/identity';
import { CryptographyClient } from '@azure/keyvault-keys';

// ============================================================================
// Configuration
// ============================================================================

const KEY_VAULT_NAME = process.env.KEY_VAULT_NAME || 'kv-bloom-notes';
const KEY_VAULT_URL = `https://${KEY_VAULT_NAME}.vault.azure.net`;

// ============================================================================
// Types
// ============================================================================

export interface EncryptedNote {
  ciphertext: string;      // Base64 encoded
  iv: string;              // Base64 encoded
  algorithm: string;       // Always 'AES-256-GCM'
  keyVersion: string;      // Key Vault key version used
}

export interface PractitionerKeyInfo {
  wrappedDek: string;
  keyName: string;
  keyVersion: string;
}

// ============================================================================
// Key Cache (short-lived, for batch operations)
// ============================================================================

// Cache unwrapped DEKs for 5 minutes max to avoid repeated Key Vault calls
// during a single session workflow (transcription → LLM → encrypt → store)
const dekCache = new Map<string, { dek: Buffer; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of dekCache.entries()) {
    if (value.expiresAt < now) {
      dekCache.delete(key);
    }
  }
}

// ============================================================================
// Get Practitioner's Key Info from Database
// ============================================================================

export async function getPractitionerKeyInfo(
  pool: sql.ConnectionPool,
  practitionerId: string
): Promise<PractitionerKeyInfo | null> {
  const result = await pool.request()
    .input('practitioner_id', sql.UniqueIdentifier, practitionerId)
    .query(`
      SELECT 
        wrapped_dek,
        key_name,
        key_version
      FROM practitioner_encryption_keys
      WHERE practitioner_id = @practitioner_id
        AND is_active = 1
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  return {
    wrappedDek: result.recordset[0].wrapped_dek,
    keyName: result.recordset[0].key_name,
    keyVersion: result.recordset[0].key_version,
  };
}

// ============================================================================
// Unwrap DEK using Key Vault
// ============================================================================

async function unwrapDek(keyInfo: PractitionerKeyInfo): Promise<Buffer> {
  const cacheKey = `${keyInfo.keyName}-${keyInfo.keyVersion}`;
  
  // Check cache first
  clearExpiredCache();
  const cached = dekCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.dek;
  }

  // Unwrap using Key Vault
  const credential = new DefaultAzureCredential();
  const keyId = `${KEY_VAULT_URL}/keys/${keyInfo.keyName}/${keyInfo.keyVersion}`;
  const cryptoClient = new CryptographyClient(keyId, credential);

  const wrappedDekBytes = Buffer.from(keyInfo.wrappedDek, 'base64');
  const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP-256', wrappedDekBytes);
  
  const dek = Buffer.from(unwrapResult.result);

  // Cache for subsequent operations in same workflow
  dekCache.set(cacheKey, {
    dek,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return dek;
}

// ============================================================================
// Encrypt Note Content (Server-Side)
// ============================================================================

export async function encryptNoteContent(
  pool: sql.ConnectionPool,
  practitionerId: string,
  plaintext: string
): Promise<EncryptedNote> {
  // Get practitioner's key info
  const keyInfo = await getPractitionerKeyInfo(pool, practitionerId);
  
  if (!keyInfo) {
    throw new Error('Encryption not enabled for this practitioner');
  }

  // Unwrap DEK
  const dek = await unwrapDek(keyInfo);

  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.randomBytes(12);

  // Encrypt with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  
  const ciphertextParts: Buffer[] = [];
  ciphertextParts.push(cipher.update(plaintext, 'utf8'));
  ciphertextParts.push(cipher.final());
  
  // Get auth tag and append to ciphertext
  const authTag = cipher.getAuthTag();
  const ciphertext = Buffer.concat([...ciphertextParts, authTag]);

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    algorithm: 'AES-256-GCM',
    keyVersion: keyInfo.keyVersion,
  };
}

// ============================================================================
// Decrypt Note Content (Server-Side) - For specific use cases only
// ============================================================================

export async function decryptNoteContent(
  pool: sql.ConnectionPool,
  practitionerId: string,
  encryptedNote: EncryptedNote
): Promise<string> {
  // Get practitioner's key info
  const keyInfo = await getPractitionerKeyInfo(pool, practitionerId);
  
  if (!keyInfo) {
    throw new Error('Encryption not enabled for this practitioner');
  }

  // Verify key version matches
  if (keyInfo.keyVersion !== encryptedNote.keyVersion) {
    throw new Error('Key version mismatch - note may need key rotation handling');
  }

  // Unwrap DEK
  const dek = await unwrapDek(keyInfo);

  // Decode from base64
  const ciphertextWithTag = Buffer.from(encryptedNote.ciphertext, 'base64');
  const iv = Buffer.from(encryptedNote.iv, 'base64');

  // Split ciphertext and auth tag (auth tag is last 16 bytes)
  const authTag = ciphertextWithTag.slice(-16);
  const ciphertext = ciphertextWithTag.slice(0, -16);

  // Decrypt with AES-256-GCM
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(authTag);

  const plaintextParts: Buffer[] = [];
  plaintextParts.push(decipher.update(ciphertext));
  plaintextParts.push(decipher.final());

  return Buffer.concat(plaintextParts).toString('utf8');
}

// ============================================================================
// Clear DEK from cache (call after workflow complete)
// ============================================================================

export function clearDekFromCache(keyName: string, keyVersion: string): void {
  const cacheKey = `${keyName}-${keyVersion}`;
  dekCache.delete(cacheKey);
}

export function clearAllDekCache(): void {
  dekCache.clear();
}
