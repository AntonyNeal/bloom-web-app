/**
 * Session Transcription API
 * 
 * Handles audio recording upload and transcription via Azure Speech Services.
 * Only works if patient has given consent for the appointment.
 * Audio is processed and immediately deleted - never stored.
 * 
 * Endpoints:
 *   POST /api/session/transcribe - Upload audio and get transcription
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';

// ============================================================================
// Configuration
// ============================================================================

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'australiaeast';
const SPEECH_ENDPOINT = `https://${SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

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
// Helper: Check consent before allowing transcription
// ============================================================================

async function checkConsentForAppointment(
  pool: sql.ConnectionPool,
  appointmentId: string
): Promise<boolean> {
  const result = await pool.request()
    .input('appointmentId', sql.NVarChar, appointmentId)
    .query(`
      SELECT consent_given, withdrawn_at 
      FROM session_recording_consent
      WHERE appointment_halaxy_id = @appointmentId
    `);

  if (result.recordset.length === 0) {
    return false; // No consent record
  }

  const consent = result.recordset[0];
  return consent.consent_given && !consent.withdrawn_at;
}

// ============================================================================
// Helper: Transcribe audio with Azure Speech Services
// ============================================================================

async function transcribeWithAzureSpeech(
  audioData: ArrayBuffer,
  contentType: string
): Promise<{ text: string; duration: number }> {
  if (!SPEECH_KEY) {
    throw new Error('Azure Speech Services not configured');
  }

  // Azure Speech Services REST API for batch/conversation transcription
  // For longer audio, we'd use the batch transcription API
  // For real-time during session, we'd use WebSocket SDK
  
  const response = await fetch(
    `${SPEECH_ENDPOINT}?language=en-AU&format=detailed&profanity=raw`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': SPEECH_KEY,
        'Content-Type': contentType,
        'Accept': 'application/json',
      },
      body: audioData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Handle the response format
  if (result.RecognitionStatus === 'Success') {
    return {
      text: result.DisplayText || result.NBest?.[0]?.Display || '',
      duration: result.Duration ? result.Duration / 10000000 : 0, // Convert from 100ns to seconds
    };
  } else if (result.RecognitionStatus === 'NoMatch') {
    return { text: '', duration: 0 };
  } else {
    throw new Error(`Recognition failed: ${result.RecognitionStatus}`);
  }
}

// ============================================================================
// Helper: Transcribe longer audio using batch API
// ============================================================================

async function transcribeLongAudio(
  audioData: ArrayBuffer,
  contentType: string,
  context: InvocationContext
): Promise<string> {
  if (!SPEECH_KEY) {
    throw new Error('Azure Speech Services not configured');
  }

  // For audio longer than ~60 seconds, we need to use the batch transcription API
  // or chunk the audio. For now, we'll use a simpler approach with multiple
  // recognition calls on chunks.
  
  // Alternative: Use Azure Speech SDK with continuous recognition
  // For MVP, let's do a simplified version that handles typical session lengths
  
  context.log('Using batch transcription approach for longer audio');

  // Upload to blob storage temporarily, run batch transcription
  // For now, return a placeholder - in production, implement full batch API
  
  // The REST API above has a ~60 second limit
  // For full implementation, you'd want:
  // 1. Azure Speech SDK with continuous recognition (for real-time)
  // 2. Batch transcription API (for post-session upload)
  
  throw new Error('Audio too long for simple API. Implement batch transcription or use SDK.');
}

// ============================================================================
// POST /api/session/transcribe - Transcribe session audio
// ============================================================================

async function transcribeSession(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Session Transcription: Processing audio');

  let pool: sql.ConnectionPool | null = null;

  try {
    // Get appointment ID from headers or form data
    const appointmentId = request.headers.get('X-Appointment-Id');
    const practitionerId = request.headers.get('X-Practitioner-Id');

    if (!appointmentId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'X-Appointment-Id header required' },
      };
    }

    // Check consent
    pool = await sql.connect(getDbConfig());
    const hasConsent = await checkConsentForAppointment(pool, appointmentId);

    if (!hasConsent) {
      return {
        status: 403,
        jsonBody: { 
          success: false, 
          error: 'No consent given for recording this session',
          code: 'NO_CONSENT',
        },
      };
    }

    // Get audio data from request
    const contentType = request.headers.get('content-type') || 'audio/wav';
    const audioBuffer = await request.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'No audio data provided' },
      };
    }

    context.log(`Processing ${audioBuffer.byteLength} bytes of audio (${contentType})`);

    // Transcribe with Azure Speech Services
    let transcription: string;
    
    try {
      const result = await transcribeWithAzureSpeech(audioBuffer, contentType);
      transcription = result.text;
      context.log(`Transcription complete: ${result.duration}s, ${transcription.length} chars`);
    } catch (speechError) {
      const message = speechError instanceof Error ? speechError.message : 'Unknown error';
      
      // If audio is too long, try batch approach
      if (message.includes('too long') || audioBuffer.byteLength > 10 * 1024 * 1024) {
        context.log('Audio too long, attempting batch transcription');
        transcription = await transcribeLongAudio(audioBuffer, contentType, context);
      } else {
        throw speechError;
      }
    }

    // Log that transcription happened (but NOT the content)
    await pool.request()
      .input('appointmentId', sql.NVarChar, appointmentId)
      .input('practitionerId', sql.NVarChar, practitionerId || null)
      .input('audioSize', sql.Int, audioBuffer.byteLength)
      .input('transcriptLength', sql.Int, transcription.length)
      .query(`
        INSERT INTO session_transcription_log (
          appointment_halaxy_id, practitioner_id,
          audio_size_bytes, transcript_length_chars,
          transcribed_at
        ) VALUES (
          @appointmentId, @practitionerId,
          @audioSize, @transcriptLength,
          GETUTCDATE()
        )
      `);

    // Audio is NOT stored - only transcription returned
    // Transcription is ephemeral - sent to LLM for notes, then gone

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          transcription,
          appointmentId,
          characterCount: transcription.length,
          // Audio has been deleted (it was never stored)
          audioDeleted: true,
        },
      },
    };
  } catch (error) {
    context.error('Error transcribing session:', error);
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

app.http('session-transcribe', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'session/transcribe',
  handler: transcribeSession,
});
