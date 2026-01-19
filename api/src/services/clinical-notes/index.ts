/**
 * Clinical Notes Index
 * Re-exports all clinical notes services
 */

export {
  ClinicalNotesService,
  getNotesService,
  type ClinicalNoteEncrypted,
  type ClinicalNoteMetadata,
  type CreateNoteInput,
  type UpdateNoteInput,
  type EncryptedContent,
  type NoteExportMetadata,
} from './notes-service';
