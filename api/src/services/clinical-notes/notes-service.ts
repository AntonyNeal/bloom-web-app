/**
 * Clinical Notes Service (Client-Side Encryption Model)
 * 
 * CRUD operations for clinical notes.
 * Notes are encrypted IN THE BROWSER before being sent to this service.
 * Server only stores/retrieves ciphertext - never sees plaintext.
 * 
 * This means:
 * - Practice owner cannot read notes (no decryption capability)
 * - Only the clinician with their Key Vault access can decrypt
 * - Server breach = useless ciphertext
 */

import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';
import { getDbConnection as getPool } from '../database';

// ============================================================================
// Types
// ============================================================================

export interface EncryptedContent {
  ciphertext: string;      // Base64 encoded
  iv: string;              // Base64 encoded  
  algorithm: string;       // 'AES-256-GCM'
  keyVersion: string;      // Key Vault key version
}

export interface ClinicalNoteEncrypted {
  id: string;
  practitionerId: string;
  patientHalaxyId: string;
  appointmentHalaxyId?: string;
  sessionDate: Date;
  noteType: 'intake' | 'progress' | 'discharge' | 'correspondence' | 'supervision' | 'other';
  encryptedContent: EncryptedContent;  // Still encrypted - client decrypts
  patientInitials: string;
  wordCount: number;
  isLocked: boolean;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicalNoteMetadata {
  id: string;
  patientHalaxyId: string;
  patientInitials: string;
  sessionDate: Date;
  noteType: string;
  wordCount: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  patientHalaxyId: string;
  patientInitials: string;
  appointmentHalaxyId?: string;
  sessionDate: Date | string;
  noteType: ClinicalNoteEncrypted['noteType'];
  encryptedContent: EncryptedContent;  // Pre-encrypted by client
  wordCount: number;  // Client provides this before encryption
}

export interface UpdateNoteInput {
  encryptedContent?: EncryptedContent;
  noteType?: ClinicalNoteEncrypted['noteType'];
  sessionDate?: Date | string;
  wordCount?: number;
}

export interface NoteExportMetadata {
  id: string;
  sessionDate: Date;
  noteType: string;
  encryptedContent: EncryptedContent;
  createdAt: Date;
}

// ============================================================================
// Service Class
// ============================================================================

export class ClinicalNotesService {
  
  /**
   * Create a new clinical note
   * Content is already encrypted by the client
   */
  async createNote(
    practitionerId: string,
    azureObjectId: string,
    input: CreateNoteInput
  ): Promise<ClinicalNoteEncrypted> {
    const pool = await getPool();
    
    const noteId = uuidv4();
    const sessionDate = typeof input.sessionDate === 'string' 
      ? new Date(input.sessionDate) 
      : input.sessionDate;
    
    // Store encrypted content as JSON
    const encryptedJson = JSON.stringify(input.encryptedContent);
    
    await pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('patientHalaxyId', sql.NVarChar, input.patientHalaxyId)
      .input('patientInitials', sql.NVarChar, input.patientInitials)
      .input('appointmentHalaxyId', sql.NVarChar, input.appointmentHalaxyId || null)
      .input('sessionDate', sql.Date, sessionDate)
      .input('noteType', sql.NVarChar, input.noteType)
      .input('encryptedContent', sql.NVarChar, encryptedJson)
      .input('keyVersion', sql.NVarChar, input.encryptedContent.keyVersion)
      .input('wordCount', sql.Int, input.wordCount)
      .query(`
        INSERT INTO clinical_notes (
          id, practitioner_id, patient_halaxy_id, patient_initials,
          appointment_halaxy_id, session_date, note_type,
          encrypted_content, encryption_key_version, word_count
        ) VALUES (
          @id, @practitionerId, @patientHalaxyId, @patientInitials,
          @appointmentHalaxyId, @sessionDate, @noteType,
          @encryptedContent, @keyVersion, @wordCount
        )
      `);
    
    // Log the creation
    await this.logAccess(noteId, 'created', practitionerId, azureObjectId);
    
    const now = new Date();
    return {
      id: noteId,
      practitionerId,
      patientHalaxyId: input.patientHalaxyId,
      appointmentHalaxyId: input.appointmentHalaxyId,
      sessionDate,
      noteType: input.noteType,
      encryptedContent: input.encryptedContent,
      patientInitials: input.patientInitials,
      wordCount: input.wordCount,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get a single note by ID
   * Returns encrypted content - client must decrypt
   */
  async getNote(
    noteId: string,
    practitionerId: string,
    azureObjectId: string
  ): Promise<ClinicalNoteEncrypted | null> {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT 
          id, practitioner_id, patient_halaxy_id, patient_initials,
          appointment_halaxy_id, session_date, note_type,
          encrypted_content, encryption_key_version, word_count,
          is_locked, locked_at, created_at, updated_at
        FROM clinical_notes
        WHERE id = @id 
          AND practitioner_id = @practitionerId
          AND deleted_at IS NULL
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    const row = result.recordset[0];
    
    // Log the access
    await this.logAccess(noteId, 'viewed', practitionerId, azureObjectId);
    
    return {
      id: row.id,
      practitionerId: row.practitioner_id,
      patientHalaxyId: row.patient_halaxy_id,
      patientInitials: row.patient_initials,
      appointmentHalaxyId: row.appointment_halaxy_id,
      sessionDate: row.session_date,
      noteType: row.note_type,
      encryptedContent: JSON.parse(row.encrypted_content),
      wordCount: row.word_count,
      isLocked: row.is_locked,
      lockedAt: row.locked_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get list of notes (metadata only, no encrypted content)
   */
  async getNotesList(
    practitionerId: string,
    options: {
      patientHalaxyId?: string;
      noteType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notes: ClinicalNoteMetadata[]; total: number }> {
    const pool = await getPool();
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    // Build dynamic query
    let whereClause = 'WHERE practitioner_id = @practitionerId AND deleted_at IS NULL';
    
    if (options.patientHalaxyId) {
      whereClause += ' AND patient_halaxy_id = @patientHalaxyId';
    }
    if (options.noteType) {
      whereClause += ' AND note_type = @noteType';
    }
    if (options.startDate) {
      whereClause += ' AND session_date >= @startDate';
    }
    if (options.endDate) {
      whereClause += ' AND session_date <= @endDate';
    }
    
    // Get total count
    const countRequest = pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId);
    
    if (options.patientHalaxyId) countRequest.input('patientHalaxyId', sql.NVarChar, options.patientHalaxyId);
    if (options.noteType) countRequest.input('noteType', sql.NVarChar, options.noteType);
    if (options.startDate) countRequest.input('startDate', sql.Date, options.startDate);
    if (options.endDate) countRequest.input('endDate', sql.Date, options.endDate);
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM clinical_notes ${whereClause}
    `);
    const total = countResult.recordset[0].total;
    
    // Get notes with pagination
    const notesRequest = pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('limit', sql.Int, limit)
      .input('offset', sql.Int, offset);
    
    if (options.patientHalaxyId) notesRequest.input('patientHalaxyId', sql.NVarChar, options.patientHalaxyId);
    if (options.noteType) notesRequest.input('noteType', sql.NVarChar, options.noteType);
    if (options.startDate) notesRequest.input('startDate', sql.Date, options.startDate);
    if (options.endDate) notesRequest.input('endDate', sql.Date, options.endDate);
    
    const notesResult = await notesRequest.query(`
      SELECT 
        id, patient_halaxy_id, patient_initials, session_date,
        note_type, word_count, is_locked, created_at, updated_at
      FROM clinical_notes
      ${whereClause}
      ORDER BY session_date DESC, created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    
    return {
      notes: notesResult.recordset.map(row => ({
        id: row.id,
        patientHalaxyId: row.patient_halaxy_id,
        patientInitials: row.patient_initials,
        sessionDate: row.session_date,
        noteType: row.note_type,
        wordCount: row.word_count,
        isLocked: row.is_locked,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total,
    };
  }

  /**
   * Update a note
   * Content is pre-encrypted by client
   */
  async updateNote(
    noteId: string,
    practitionerId: string,
    azureObjectId: string,
    input: UpdateNoteInput
  ): Promise<ClinicalNoteEncrypted | null> {
    const pool = await getPool();
    
    // Check if note exists and is not locked
    const existing = await pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT is_locked FROM clinical_notes
        WHERE id = @id AND practitioner_id = @practitionerId AND deleted_at IS NULL
      `);
    
    if (existing.recordset.length === 0) {
      return null;
    }
    
    if (existing.recordset[0].is_locked) {
      throw new Error('Note is locked and cannot be edited');
    }
    
    // Build update query
    const updates: string[] = ['updated_at = GETDATE()'];
    const request = pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId);
    
    if (input.encryptedContent) {
      updates.push('encrypted_content = @encryptedContent');
      updates.push('encryption_key_version = @keyVersion');
      request.input('encryptedContent', sql.NVarChar, JSON.stringify(input.encryptedContent));
      request.input('keyVersion', sql.NVarChar, input.encryptedContent.keyVersion);
    }
    
    if (input.wordCount !== undefined) {
      updates.push('word_count = @wordCount');
      request.input('wordCount', sql.Int, input.wordCount);
    }
    
    if (input.noteType) {
      updates.push('note_type = @noteType');
      request.input('noteType', sql.NVarChar, input.noteType);
    }
    
    if (input.sessionDate) {
      updates.push('session_date = @sessionDate');
      const sessionDate = typeof input.sessionDate === 'string' 
        ? new Date(input.sessionDate) 
        : input.sessionDate;
      request.input('sessionDate', sql.Date, sessionDate);
    }
    
    await request.query(`
      UPDATE clinical_notes
      SET ${updates.join(', ')}
      WHERE id = @id AND practitioner_id = @practitionerId
    `);
    
    // Log the update
    await this.logAccess(noteId, 'updated', practitionerId, azureObjectId);
    
    // Return updated note
    return this.getNote(noteId, practitionerId, azureObjectId);
  }

  /**
   * Lock a note (prevents further edits)
   */
  async lockNote(
    noteId: string,
    practitionerId: string,
    azureObjectId: string,
    reason: string = 'manual'
  ): Promise<void> {
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE clinical_notes
        SET is_locked = 1, locked_at = GETDATE(), locked_reason = @reason
        WHERE id = @id AND practitioner_id = @practitionerId
      `);
    
    await this.logAccess(noteId, 'locked', practitionerId, azureObjectId, reason);
  }

  /**
   * Soft delete a note
   */
  async deleteNote(
    noteId: string,
    practitionerId: string,
    azureObjectId: string,
    reason: string
  ): Promise<void> {
    const pool = await getPool();
    
    await pool.request()
      .input('id', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE clinical_notes
        SET deleted_at = GETDATE(), deleted_reason = @reason
        WHERE id = @id AND practitioner_id = @practitionerId
      `);
    
    await this.logAccess(noteId, 'deleted', practitionerId, azureObjectId, reason);
  }

  /**
   * Get notes for export (for a specific patient)
   * Returns encrypted content - client must decrypt for final export
   */
  async getPatientNotesForExport(
    practitionerId: string,
    patientHalaxyId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<NoteExportMetadata[]> {
    const pool = await getPool();
    
    let whereClause = `
      WHERE practitioner_id = @practitionerId 
      AND patient_halaxy_id = @patientHalaxyId
      AND deleted_at IS NULL
    `;
    
    const request = pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('patientHalaxyId', sql.NVarChar, patientHalaxyId);
    
    if (options.startDate) {
      whereClause += ' AND session_date >= @startDate';
      request.input('startDate', sql.Date, options.startDate);
    }
    
    if (options.endDate) {
      whereClause += ' AND session_date <= @endDate';
      request.input('endDate', sql.Date, options.endDate);
    }
    
    const result = await request.query(`
      SELECT 
        id, session_date, note_type, encrypted_content, created_at
      FROM clinical_notes
      ${whereClause}
      ORDER BY session_date ASC
    `);
    
    return result.recordset.map(row => ({
      id: row.id,
      sessionDate: row.session_date,
      noteType: row.note_type,
      encryptedContent: JSON.parse(row.encrypted_content),
      createdAt: row.created_at,
    }));
  }

  /**
   * Get all notes for export (bulk export for practitioner departure)
   */
  async getAllNotesForExport(
    practitionerId: string
  ): Promise<Map<string, { patientInitials: string; notes: NoteExportMetadata[] }>> {
    const pool = await getPool();
    
    const result = await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT 
          id, patient_halaxy_id, patient_initials, session_date, 
          note_type, encrypted_content, created_at
        FROM clinical_notes
        WHERE practitioner_id = @practitionerId
          AND deleted_at IS NULL
        ORDER BY patient_halaxy_id, session_date ASC
      `);
    
    // Group by patient
    const byPatient = new Map<string, { patientInitials: string; notes: NoteExportMetadata[] }>();
    
    for (const row of result.recordset) {
      const patientId = row.patient_halaxy_id;
      
      if (!byPatient.has(patientId)) {
        byPatient.set(patientId, {
          patientInitials: row.patient_initials,
          notes: [],
        });
      }
      
      byPatient.get(patientId)!.notes.push({
        id: row.id,
        sessionDate: row.session_date,
        noteType: row.note_type,
        encryptedContent: JSON.parse(row.encrypted_content),
        createdAt: row.created_at,
      });
    }
    
    return byPatient;
  }

  /**
   * Log access to notes (audit trail)
   */
  private async logAccess(
    noteId: string,
    action: string,
    practitionerId: string,
    azureObjectId: string,
    details?: string
  ): Promise<void> {
    try {
      const pool = await getPool();
      
      await pool.request()
        .input('noteId', sql.UniqueIdentifier, noteId)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('azureObjectId', sql.NVarChar, azureObjectId)
        .input('action', sql.NVarChar, action)
        .input('details', sql.NVarChar, details || null)
        .query(`
          INSERT INTO clinical_notes_audit (
            note_id, practitioner_id, azure_object_id, action, details, created_at
          ) VALUES (
            @noteId, @practitionerId, @azureObjectId, @action, @details, GETDATE()
          )
        `);
    } catch (error) {
      console.error('[ClinicalNotesService] Failed to log access:', error);
      // Don't fail the main operation if audit logging fails
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let notesServiceInstance: ClinicalNotesService | null = null;

export function getNotesService(): ClinicalNotesService {
  if (!notesServiceInstance) {
    notesServiceInstance = new ClinicalNotesService();
  }
  return notesServiceInstance;
}

export default ClinicalNotesService;
