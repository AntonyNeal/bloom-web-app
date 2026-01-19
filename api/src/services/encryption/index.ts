/**
 * Server-Side Encryption Services
 * 
 * Exports encryption utilities for server-side note encryption.
 * Used for LLM-generated draft notes.
 */

export {
  encryptNoteContent,
  decryptNoteContent,
  getPractitionerKeyInfo,
  clearDekFromCache,
  clearAllDekCache,
  type EncryptedNote,
  type PractitionerKeyInfo,
} from './server-encryption';
