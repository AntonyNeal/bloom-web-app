/**
 * Client-Side Notes Encryption Service
 * 
 * Handles encryption/decryption of clinical notes in the browser.
 * Uses Azure Key Vault for key unwrapping - requires Azure AD authentication.
 * 
 * Flow:
 * 1. Clinician logs in with Azure AD (Authenticator)
 * 2. Fetch wrapped DEK from our API
 * 3. Call Key Vault to unwrap DEK (requires their Azure AD token)
 * 4. DEK lives in memory for the session
 * 5. All encrypt/decrypt happens locally in browser
 * 6. Logout/close = DEK cleared from memory
 * 
 * Security:
 * - Notes are NEVER sent to server unencrypted
 * - Only ciphertext stored in database
 * - Practice owner cannot decrypt (not in Key Vault RBAC)
 * - If clinician can authenticate with Authenticator, they can decrypt
 */

import { PublicClientApplication } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';

// ============================================================================
// Configuration
// ============================================================================

const KEY_VAULT_NAME = import.meta.env.VITE_KEY_VAULT_NAME || 'kv-bloom-notes';
const KEY_VAULT_URL = `https://${KEY_VAULT_NAME}.vault.azure.net`;
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Key Vault scope for token acquisition
const KEY_VAULT_SCOPE = 'https://vault.azure.net/.default';

// ============================================================================
// Types
// ============================================================================

export interface EncryptedNote {
  ciphertext: string;      // Base64 encoded
  iv: string;              // Base64 encoded
  algorithm: string;       // Always 'AES-256-GCM'
  keyVersion: string;      // Key Vault key version used
}

export interface DecryptedNote {
  content: string;
  decryptedAt: Date;
}

// ============================================================================
// Encryption Service Class
// ============================================================================

class NotesEncryptionService {
  private msalInstance: PublicClientApplication | null = null;
  private account: AccountInfo | null = null;
  
  // Data Encryption Key - lives only in memory
  private dek: CryptoKey | null = null;
  private dekVersion: string | null = null;
  
  // Wrapped DEK from server (for re-unwrapping if needed)
  private wrappedDek: string | null = null;

  /**
   * Initialize with MSAL instance from auth context
   */
  initialize(msalInstance: PublicClientApplication, account: AccountInfo) {
    this.msalInstance = msalInstance;
    this.account = account;
    console.log('[NotesEncryption] Initialized for:', account.username);
  }

  /**
   * Check if encryption is ready (DEK loaded)
   */
  isReady(): boolean {
    return this.dek !== null;
  }

  /**
   * Load the Data Encryption Key for this session
   * Called after successful Azure AD login
   */
  async loadKey(): Promise<void> {
    if (!this.msalInstance || !this.account) {
      throw new Error('Encryption service not initialized. Call initialize() first.');
    }

    console.log('[NotesEncryption] Loading encryption key...');

    // Step 1: Get wrapped DEK from our API
    const wrappedDekResponse = await this.fetchWrappedDek();
    
    if (!wrappedDekResponse) {
      console.log('[NotesEncryption] No encryption key found - notes not enabled for this practitioner');
      return;
    }

    this.wrappedDek = wrappedDekResponse.wrappedKey;
    const keyName = wrappedDekResponse.keyName;
    const keyVersion = wrappedDekResponse.keyVersion;

    // Step 2: Get Key Vault token
    const kvToken = await this.getKeyVaultToken();

    // Step 3: Unwrap DEK using Key Vault
    const dekBytes = await this.unwrapKeyInKeyVault(
      kvToken,
      keyName,
      keyVersion,
      this.wrappedDek
    );

    // Step 4: Import DEK as CryptoKey
    this.dek = await crypto.subtle.importKey(
      'raw',
      dekBytes,
      { name: 'AES-GCM', length: 256 },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
    this.dekVersion = keyVersion;

    console.log('[NotesEncryption] Key loaded successfully');
  }

  /**
   * Encrypt note content (before sending to server)
   */
  async encrypt(plaintext: string): Promise<EncryptedNote> {
    if (!this.dek || !this.dekVersion) {
      throw new Error('Encryption key not loaded. Call loadKey() first.');
    }

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt with AES-GCM
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ciphertextBytes = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.dek,
      plaintextBytes
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertextBytes),
      iv: this.arrayBufferToBase64(iv.buffer),
      algorithm: 'AES-256-GCM',
      keyVersion: this.dekVersion,
    };
  }

  /**
   * Decrypt note content (after receiving from server)
   */
  async decrypt(encrypted: EncryptedNote): Promise<DecryptedNote> {
    if (!this.dek) {
      throw new Error('Encryption key not loaded. Call loadKey() first.');
    }

    const ciphertextBytes = this.base64ToArrayBuffer(encrypted.ciphertext);
    const iv = this.base64ToArrayBuffer(encrypted.iv);

    const plaintextBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.dek,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    return {
      content: decoder.decode(plaintextBytes),
      decryptedAt: new Date(),
    };
  }

  /**
   * Clear encryption key from memory (on logout)
   */
  clear() {
    this.dek = null;
    this.dekVersion = null;
    this.wrappedDek = null;
    this.account = null;
    console.log('[NotesEncryption] Keys cleared from memory');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Fetch wrapped DEK from our API
   */
  private async fetchWrappedDek(): Promise<{
    wrappedKey: string;
    keyName: string;
    keyVersion: string;
  } | null> {
    const response = await fetch(`${API_URL}/clinical-notes/encryption-key`, {
      headers: {
        'Authorization': `Bearer ${await this.getApiToken()}`,
      },
    });

    if (response.status === 404) {
      return null; // Notes not enabled
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch encryption key: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get Azure AD token for Key Vault
   */
  private async getKeyVaultToken(): Promise<string> {
    if (!this.msalInstance || !this.account) {
      throw new Error('MSAL not initialized');
    }

    try {
      // Try silent token acquisition first
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: [KEY_VAULT_SCOPE],
        account: this.account,
      });
      return response.accessToken;
    } catch {
      // Fall back to popup if silent fails
      const response = await this.msalInstance.acquireTokenPopup({
        scopes: [KEY_VAULT_SCOPE],
      });
      return response.accessToken;
    }
  }

  /**
   * Get Azure AD token for our API
   */
  private async getApiToken(): Promise<string> {
    if (!this.msalInstance || !this.account) {
      throw new Error('MSAL not initialized');
    }

    const response = await this.msalInstance.acquireTokenSilent({
      scopes: [`api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`],
      account: this.account,
    });
    return response.accessToken;
  }

  /**
   * Call Key Vault to unwrap the DEK
   */
  private async unwrapKeyInKeyVault(
    token: string,
    keyName: string,
    keyVersion: string,
    wrappedKeyBase64: string
  ): Promise<ArrayBuffer> {
    const url = `${KEY_VAULT_URL}/keys/${keyName}/${keyVersion}/unwrapkey?api-version=7.4`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alg: 'RSA-OAEP-256',
        value: wrappedKeyBase64,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[NotesEncryption] Key Vault unwrap failed:', error);
      throw new Error(`Key Vault unwrap failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Key Vault returns base64url encoded value
    return this.base64UrlToArrayBuffer(data.value);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    return this.base64ToArrayBuffer(base64);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const notesEncryption = new NotesEncryptionService();

export default notesEncryption;
