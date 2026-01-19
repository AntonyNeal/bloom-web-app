/**
 * Clinical Notes API
 * 
 * CRUD endpoints for encrypted clinical notes.
 * Notes are encrypted IN THE BROWSER - server only stores ciphertext.
 * Practice owner cannot access note content - only metadata.
 * 
 * Endpoints:
 *   GET    /api/clinical-notes              - List notes (metadata only)
 *   GET    /api/clinical-notes/:id          - Get single note (encrypted)
 *   POST   /api/clinical-notes              - Create note (pre-encrypted)
 *   PUT    /api/clinical-notes/:id          - Update note (pre-encrypted)
 *   DELETE /api/clinical-notes/:id          - Soft delete note
 *   POST   /api/clinical-notes/:id/lock     - Lock note
 *   GET    /api/clinical-notes/patient/:patientId - Get patient's notes (encrypted)
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getPractitionerByAzureId } from '../services/practitioner';
import { getNotesService, CreateNoteInput, UpdateNoteInput } from '../services/clinical-notes';

// ============================================================================
// Helper: Validate Practitioner Authentication
// ============================================================================

async function validatePractitioner(request: HttpRequest): Promise<{
  practitionerId: string;
  azureObjectId: string;
} | null> {
  const azureUserId = request.headers.get('X-Azure-User-Id');
  
  if (!azureUserId) {
    return null;
  }
  
  const practitioner = await getPractitionerByAzureId(azureUserId);
  
  if (!practitioner) {
    return null;
  }
  
  return {
    practitionerId: practitioner.id,
    azureObjectId: azureUserId,
  };
}

// ============================================================================
// GET /api/clinical-notes - List Notes (Metadata Only)
// ============================================================================

async function listNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Clinical Notes: List notes');
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    const url = new URL(request.url);
    const patientHalaxyId = url.searchParams.get('patientId') || undefined;
    const noteType = url.searchParams.get('type') || undefined;
    const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined;
    const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    
    const notesService = getNotesService();
    const result = await notesService.getNotesList(auth.practitionerId, {
      patientHalaxyId,
      noteType,
      startDate,
      endDate,
      limit,
      offset,
    });
    
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          notes: result.notes,
          total: result.total,
          limit,
          offset,
        },
      },
    };
  } catch (error) {
    context.error('Error listing notes:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// GET /api/clinical-notes/:id - Get Single Note (Encrypted)
// ============================================================================

async function getNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Get note ${noteId}`);
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    const notesService = getNotesService();
    const note = await notesService.getNote(noteId, auth.practitionerId, auth.azureObjectId);
    
    if (!note) {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Note not found' },
      };
    }
    
    // Note: encryptedContent is returned - client must decrypt
    return {
      status: 200,
      jsonBody: { success: true, data: note },
    };
  } catch (error) {
    context.error('Error getting note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// POST /api/clinical-notes - Create Note
// ============================================================================

async function createNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Clinical Notes: Create note');
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    const body = await request.json() as CreateNoteInput;
    
    // Validate required fields
    if (!body.patientHalaxyId || !body.patientInitials || !body.sessionDate || !body.noteType) {
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Missing required fields: patientHalaxyId, patientInitials, sessionDate, noteType' 
        },
      };
    }
    
    // Validate encrypted content
    if (!body.encryptedContent || !body.encryptedContent.ciphertext || !body.encryptedContent.iv) {
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Missing encryptedContent with ciphertext and iv' 
        },
      };
    }
    
    const notesService = getNotesService();
    const note = await notesService.createNote(auth.practitionerId, auth.azureObjectId, body);
    
    return {
      status: 201,
      jsonBody: { success: true, data: note },
    };
  } catch (error) {
    context.error('Error creating note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// PUT /api/clinical-notes/:id - Update Note
// ============================================================================

async function updateNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Update note ${noteId}`);
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    const body = await request.json() as UpdateNoteInput;
    
    const notesService = getNotesService();
    
    try {
      const note = await notesService.updateNote(noteId, auth.practitionerId, auth.azureObjectId, body);
      
      if (!note) {
        return {
          status: 404,
          jsonBody: { success: false, error: 'Note not found' },
        };
      }
      
      return {
        status: 200,
        jsonBody: { success: true, data: note },
      };
    } catch (err) {
      const error = err as Error;
      if (error.message === 'Note is locked and cannot be edited') {
        return {
          status: 403,
          jsonBody: { success: false, error: error.message },
        };
      }
      throw error;
    }
  } catch (error) {
    context.error('Error updating note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// DELETE /api/clinical-notes/:id - Soft Delete Note
// ============================================================================

async function deleteNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Delete note ${noteId}`);
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    let reason = 'Deleted by practitioner';
    try {
      const body = await request.json() as { reason?: string };
      if (body.reason) reason = body.reason;
    } catch {
      // No body provided, use default reason
    }
    
    const notesService = getNotesService();
    await notesService.deleteNote(noteId, auth.practitionerId, auth.azureObjectId, reason);
    
    return {
      status: 200,
      jsonBody: { success: true, message: 'Note deleted' },
    };
  } catch (error) {
    context.error('Error deleting note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// POST /api/clinical-notes/:id/lock - Lock Note
// ============================================================================

async function lockNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const noteId = request.params.id;
  context.log(`Clinical Notes: Lock note ${noteId}`);
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    let reason = 'manual';
    try {
      const body = await request.json() as { reason?: string };
      if (body.reason) reason = body.reason;
    } catch {
      // No body provided, use default reason
    }
    
    const notesService = getNotesService();
    await notesService.lockNote(noteId, auth.practitionerId, auth.azureObjectId, reason);
    
    return {
      status: 200,
      jsonBody: { success: true, message: 'Note locked' },
    };
  } catch (error) {
    context.error('Error locking note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// GET /api/clinical-notes/patient/:patientId - Get Patient's Notes (Encrypted)
// ============================================================================

async function getPatientNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const patientId = request.params.patientId;
  context.log(`Clinical Notes: Get notes for patient ${patientId}`);
  
  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined;
    const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined;
    
    const notesService = getNotesService();
    const notes = await notesService.getPatientNotesForExport(
      auth.practitionerId,
      patientId,
      { startDate, endDate }
    );
    
    // Return encrypted notes - client must decrypt
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          patientId,
          notes,
          count: notes.length,
        },
      },
    };
  } catch (error) {
    context.error('Error getting patient notes:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// Register Functions
// ============================================================================

app.http('clinical-notes-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clinical-notes',
  handler: listNotes,
});

app.http('clinical-notes-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}',
  handler: getNote,
});

app.http('clinical-notes-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes',
  handler: createNote,
});

app.http('clinical-notes-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}',
  handler: updateNote,
});

app.http('clinical-notes-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}',
  handler: deleteNote,
});

app.http('clinical-notes-lock', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/{id}/lock',
  handler: lockNote,
});

app.http('clinical-notes-patient', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clinical-notes/patient/{patientId}',
  handler: getPatientNotes,
});
