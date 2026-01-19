/**
 * Session End Workflow API
 * 
 * When a telehealth session ends:
 * 1. Collect full transcription from buffer
 * 2. Send to LLM to generate clinical notes draft
 * 3. Encrypt draft with practitioner's key
 * 4. Save as draft in clinical_notes table
 * 5. Clean up transcription buffer
 * 
 * The clinician will see the draft when they next view the patient.
 * Draft becomes final only when they review and save it.
 * 
 * Endpoints:
 *   POST /api/session/end           - End session and trigger note generation
 *   POST /api/session/transcription/append - Append chunk to transcription buffer
 *   GET  /api/clinical-notes/drafts - Get pending drafts for clinician
 *   POST /api/clinical-notes/:id/finalize - Mark draft as final
 *   DELETE /api/clinical-notes/:id/draft - Discard draft
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { AzureOpenAI } from 'openai';
import { encryptNoteContent, clearDekFromCache, getPractitionerKeyInfo } from '../services/encryption/server-encryption';

// ============================================================================
// Configuration
// ============================================================================

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

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
// LLM System Prompt for Clinical Notes
// ============================================================================

const CLINICAL_NOTES_SYSTEM_PROMPT = `You are a clinical documentation assistant for psychologists in Australia. Your role is to convert session transcriptions into professional clinical notes.

IMPORTANT GUIDELINES:
- Use professional clinical language appropriate for Australian healthcare
- Be concise but thorough
- Include relevant therapeutic observations
- Note any risk factors or concerns mentioned
- Maintain client confidentiality - use initials only
- Structure the note clearly with sections
- Do NOT add information not present in the transcription
- Do NOT make clinical interpretations beyond what was explicitly discussed
- Flag any urgent concerns (suicidality, self-harm, abuse) prominently at the top

OUTPUT FORMAT (use exactly these headings):
## Session Summary
[2-3 sentence overview of what was discussed]

## Presenting Issues
[What the client discussed/brought to session]

## Mental Status Observations
[Affect, mood, appearance, engagement - only what was observable]

## Interventions & Techniques
[Therapeutic techniques or interventions used]

## Client Response to Interventions
[How client responded, insights gained]

## Risk Assessment
[Any risk factors mentioned. If none, state "No risk indicators identified in this session"]

## Treatment Progress
[Progress toward goals, if discussed]

## Plan & Follow-up
[Next steps, homework, topics for next session]

## Session Duration
[Duration if known]`;

// ============================================================================
// POST /api/session/transcription/append
// Append a transcription chunk to the session buffer
// ============================================================================

async function appendTranscriptionChunk(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Session: Append transcription chunk');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;
      practitionerId: string;
      patientHalaxyId: string;
      telehealthRoomId?: string;
      transcriptionChunk: string;
      audioDurationSeconds?: number;
    };

    if (!body.appointmentId || !body.practitionerId || !body.transcriptionChunk) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId, practitionerId, and transcriptionChunk required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Upsert into transcription buffer
    await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .input('practitionerId', sql.UniqueIdentifier, body.practitionerId)
      .input('patientHalaxyId', sql.NVarChar, body.patientHalaxyId || '')
      .input('telehealthRoomId', sql.UniqueIdentifier, body.telehealthRoomId || null)
      .input('chunk', sql.NVarChar, body.transcriptionChunk)
      .input('audioDuration', sql.Int, body.audioDurationSeconds || 0)
      .query(`
        MERGE session_transcription_buffer AS target
        USING (SELECT @appointmentId AS appointment_halaxy_id) AS source
        ON target.appointment_halaxy_id = source.appointment_halaxy_id AND target.status = 'active'
        WHEN MATCHED THEN
          UPDATE SET 
            transcription_text = transcription_text + ' ' + @chunk,
            chunk_count = chunk_count + 1,
            total_audio_seconds = total_audio_seconds + @audioDuration,
            last_chunk_at = GETUTCDATE()
        WHEN NOT MATCHED THEN
          INSERT (appointment_halaxy_id, telehealth_room_id, practitioner_id, patient_halaxy_id,
                  transcription_text, chunk_count, total_audio_seconds, status, session_started_at, last_chunk_at)
          VALUES (@appointmentId, @telehealthRoomId, @practitionerId, @patientHalaxyId,
                  @chunk, 1, @audioDuration, 'active', GETUTCDATE(), GETUTCDATE());
      `);

    return {
      status: 200,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error('Error appending transcription:', error);
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
// POST /api/session/end
// End session and generate draft clinical notes
// ============================================================================

async function endSessionAndGenerateNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Session: End session and generate notes');

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      appointmentId: string;
      practitionerId: string;
      patientHalaxyId: string;
      patientInitials: string;
      sessionType?: string;
      sessionDate?: string;
    };

    if (!body.appointmentId || !body.practitionerId || !body.patientInitials) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'appointmentId, practitionerId, and patientInitials required' },
      };
    }

    pool = await sql.connect(getDbConfig());

    // Step 1: Get transcription from buffer
    const bufferResult = await pool.request()
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .query(`
        SELECT id, transcription_text, chunk_count, total_audio_seconds, session_started_at
        FROM session_transcription_buffer
        WHERE appointment_halaxy_id = @appointmentId AND status = 'active'
      `);

    if (bufferResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { 
          success: false, 
          error: 'No transcription found for this session',
          code: 'NO_TRANSCRIPTION',
        },
      };
    }

    const buffer = bufferResult.recordset[0];
    const transcription = buffer.transcription_text;
    const bufferId = buffer.id;
    const sessionDurationSeconds = buffer.total_audio_seconds;

    if (!transcription || transcription.trim().length < 50) {
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Transcription too short to generate notes',
          code: 'TRANSCRIPTION_TOO_SHORT',
        },
      };
    }

    // Mark buffer as processing
    await pool.request()
      .input('bufferId', sql.UniqueIdentifier, bufferId)
      .query(`
        UPDATE session_transcription_buffer
        SET status = 'processing', processing_started_at = GETUTCDATE()
        WHERE id = @bufferId
      `);

    // Step 2: Generate draft notes with LLM
    context.log(`Generating notes from ${transcription.length} chars of transcription`);
    
    let draftContent: string;
    
    try {
      if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
        throw new Error('Azure OpenAI not configured');
      }

      const client = new AzureOpenAI({
        endpoint: AZURE_OPENAI_ENDPOINT,
        apiKey: AZURE_OPENAI_KEY,
        apiVersion: '2024-08-01-preview',
      });

      const sessionDurationMinutes = Math.round(sessionDurationSeconds / 60);
      const userPrompt = `Generate clinical notes for this ${body.sessionType || 'therapy'} session with client ${body.patientInitials}.
Session duration: approximately ${sessionDurationMinutes} minutes.

TRANSCRIPTION:
${transcription}`;

      const completion = await client.chat.completions.create({
        model: AZURE_OPENAI_DEPLOYMENT,
        messages: [
          { role: 'system', content: CLINICAL_NOTES_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      });

      draftContent = completion.choices[0]?.message?.content || '';
      
      if (!draftContent) {
        throw new Error('LLM returned empty response');
      }

      context.log('LLM generated draft notes successfully');
    } catch (llmError) {
      context.error('LLM error:', llmError);
      
      // If LLM fails, save a placeholder draft
      draftContent = `## Draft Note - LLM Generation Failed

The automatic note generation encountered an error. Please write your clinical notes manually.

**Session Details:**
- Appointment: ${body.appointmentId}
- Duration: ~${Math.round(sessionDurationSeconds / 60)} minutes
- Date: ${body.sessionDate || new Date().toISOString().split('T')[0]}

**Error:** ${llmError instanceof Error ? llmError.message : 'Unknown error'}

---

*Transcription was captured but could not be processed. Please contact support if this persists.*`;
    }

    // Step 3: Encrypt the draft
    context.log('Encrypting draft notes');
    
    const encryptedContent = await encryptNoteContent(pool, body.practitionerId, draftContent);
    
    // Step 4: Save as draft in clinical_notes
    const noteId = crypto.randomUUID();
    const sessionDate = body.sessionDate ? new Date(body.sessionDate) : new Date();
    
    await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, body.practitionerId)
      .input('patientHalaxyId', sql.NVarChar, body.patientHalaxyId)
      .input('appointmentId', sql.NVarChar, body.appointmentId)
      .input('sessionDate', sql.Date, sessionDate)
      .input('noteType', sql.NVarChar, 'progress')
      .input('encryptedContent', sql.NVarChar, JSON.stringify(encryptedContent))
      .input('keyVersion', sql.NVarChar, encryptedContent.keyVersion)
      .input('patientInitials', sql.NVarChar, body.patientInitials)
      .input('wordCount', sql.Int, draftContent.split(/\s+/).length)
      .input('status', sql.NVarChar, 'draft')
      .input('source', sql.NVarChar, 'llm_transcription')
      .input('llmModel', sql.NVarChar, AZURE_OPENAI_DEPLOYMENT)
      .input('transcriptionDuration', sql.Int, sessionDurationSeconds)
      .query(`
        INSERT INTO clinical_notes (
          id, practitioner_id, patient_halaxy_id, appointment_halaxy_id,
          session_date, note_type, encrypted_content, encryption_key_version,
          patient_initials, word_count, status, source, llm_model, 
          llm_generated_at, transcription_session_id, transcription_duration_seconds
        ) VALUES (
          @noteId, @practitionerId, @patientHalaxyId, @appointmentId,
          @sessionDate, @noteType, @encryptedContent, @keyVersion,
          @patientInitials, @wordCount, @status, @source, @llmModel,
          GETUTCDATE(), @appointmentId, @transcriptionDuration
        )
      `);

    // Step 5: Clean up transcription buffer (delete the actual transcription)
    await pool.request()
      .input('bufferId', sql.UniqueIdentifier, bufferId)
      .input('noteId', sql.UniqueIdentifier, noteId)
      .query(`
        UPDATE session_transcription_buffer
        SET transcription_text = '[PROCESSED AND DELETED]',
            status = 'completed',
            completed_at = GETUTCDATE(),
            generated_note_id = @noteId
        WHERE id = @bufferId
      `);

    // Step 6: Log the draft generation in audit
    await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, body.practitionerId)
      .query(`
        INSERT INTO clinical_notes_audit (note_id, action, performed_by, performed_at, details)
        VALUES (@noteId, 'draft_generated', @practitionerId, GETUTCDATE(), 
                'Auto-generated from session transcription')
      `);

    // Clear DEK from cache
    const keyInfo = await getPractitionerKeyInfo(pool, body.practitionerId);
    if (keyInfo) {
      clearDekFromCache(keyInfo.keyName, keyInfo.keyVersion);
    }

    context.log(`✅ Draft note ${noteId} created for appointment ${body.appointmentId}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: {
          noteId,
          status: 'draft',
          message: 'Draft clinical notes generated. Review and finalize to complete.',
        },
      },
    };
  } catch (error) {
    context.error('Error ending session:', error);
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
// GET /api/clinical-notes/drafts
// Get all draft notes for the clinician
// ============================================================================

async function getDraftNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Clinical Notes: Get drafts');

  const practitionerId = request.headers.get('X-Practitioner-Id');
  
  if (!practitionerId) {
    return {
      status: 401,
      jsonBody: { success: false, error: 'Practitioner authentication required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    const result = await pool.request()
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT 
          cn.id,
          cn.patient_halaxy_id,
          cn.patient_initials,
          cn.appointment_halaxy_id,
          cn.session_date,
          cn.note_type,
          cn.word_count,
          cn.source,
          cn.llm_model,
          cn.llm_generated_at,
          cn.created_at
        FROM clinical_notes cn
        WHERE cn.practitioner_id = @practitionerId
          AND cn.status = 'draft'
          AND cn.is_deleted = 0
        ORDER BY cn.created_at DESC
      `);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          drafts: result.recordset,
          count: result.recordset.length,
        },
      },
    };
  } catch (error) {
    context.error('Error getting drafts:', error);
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
// POST /api/clinical-notes/:id/finalize
// Mark a draft as final (clinician reviewed and approved)
// ============================================================================

async function finalizeDraftNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Finalize draft ${noteId}`);

  const practitionerId = request.headers.get('X-Practitioner-Id');
  
  if (!practitionerId) {
    return {
      status: 401,
      jsonBody: { success: false, error: 'Practitioner authentication required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    const body = await request.json() as {
      updatedContent?: string;  // If they made edits (already encrypted by client)
    };

    pool = await sql.connect(getDbConfig());

    // Verify ownership and draft status
    const noteResult = await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT id, status, practitioner_id
        FROM clinical_notes
        WHERE id = @noteId AND practitioner_id = @practitionerId AND is_deleted = 0
      `);

    if (noteResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Note not found or access denied' },
      };
    }

    const note = noteResult.recordset[0];
    
    if (note.status !== 'draft') {
      return {
        status: 400,
        jsonBody: { success: false, error: 'Note is not a draft' },
      };
    }

    // Update to final
    if (body.updatedContent) {
      // Clinician made edits - save their encrypted content
      await pool.request()
        .input('noteId', sql.UniqueIdentifier, noteId)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .input('encryptedContent', sql.NVarChar, body.updatedContent)
        .query(`
          UPDATE clinical_notes
          SET status = 'final',
              source = 'llm_assisted',
              encrypted_content = @encryptedContent,
              finalized_at = GETUTCDATE(),
              finalized_by = @practitionerId,
              updated_at = GETUTCDATE()
          WHERE id = @noteId
        `);
    } else {
      // No edits - just mark as final
      await pool.request()
        .input('noteId', sql.UniqueIdentifier, noteId)
        .input('practitionerId', sql.UniqueIdentifier, practitionerId)
        .query(`
          UPDATE clinical_notes
          SET status = 'final',
              finalized_at = GETUTCDATE(),
              finalized_by = @practitionerId,
              updated_at = GETUTCDATE()
          WHERE id = @noteId
        `);
    }

    // Audit log
    await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .input('details', sql.NVarChar, body.updatedContent ? 'Finalized with edits' : 'Finalized without edits')
      .query(`
        INSERT INTO clinical_notes_audit (note_id, action, performed_by, performed_at, details)
        VALUES (@noteId, 'draft_finalized', @practitionerId, GETUTCDATE(), @details)
      `);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: { noteId, status: 'final' },
      },
    };
  } catch (error) {
    context.error('Error finalizing draft:', error);
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
// DELETE /api/clinical-notes/:id/draft
// Discard a draft note (clinician doesn't want LLM version)
// ============================================================================

async function discardDraftNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Discard draft ${noteId}`);

  const practitionerId = request.headers.get('X-Practitioner-Id');
  
  if (!practitionerId) {
    return {
      status: 401,
      jsonBody: { success: false, error: 'Practitioner authentication required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    // Verify ownership and draft status
    const noteResult = await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        SELECT id, status
        FROM clinical_notes
        WHERE id = @noteId AND practitioner_id = @practitionerId AND is_deleted = 0
      `);

    if (noteResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Note not found or access denied' },
      };
    }

    if (noteResult.recordset[0].status !== 'draft') {
      return {
        status: 400,
        jsonBody: { success: false, error: 'Can only discard draft notes' },
      };
    }

    // Soft delete the draft
    await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .query(`
        UPDATE clinical_notes
        SET is_deleted = 1,
            deleted_at = GETUTCDATE(),
            deleted_reason = 'Draft discarded by clinician'
        WHERE id = @noteId
      `);

    // Audit log
    await pool.request()
      .input('noteId', sql.UniqueIdentifier, noteId)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId)
      .query(`
        INSERT INTO clinical_notes_audit (note_id, action, performed_by, performed_at, details)
        VALUES (@noteId, 'draft_discarded', @practitionerId, GETUTCDATE(), 'Clinician discarded LLM-generated draft')
      `);

    return {
      status: 200,
      jsonBody: { success: true, message: 'Draft discarded' },
    };
  } catch (error) {
    context.error('Error discarding draft:', error);
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

app.http('session-transcription-append', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/transcription/append',
  handler: appendTranscriptionChunk,
});

app.http('session-end', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/end',
  handler: endSessionAndGenerateNotes,
});

app.http('clinical-notes-drafts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clinical-notes/drafts',
  handler: getDraftNotes,
});

app.http('clinical-notes-finalize', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}/finalize',
  handler: finalizeDraftNote,
});

app.http('clinical-notes-discard-draft', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}/draft',
  handler: discardDraftNote,
});
