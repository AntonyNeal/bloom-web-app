/**
 * Interview Analysis API
 * 
 * Handles real-time transcription during interviews and AI-powered
 * candidate analysis at the end of the interview.
 * 
 * Privacy: Transcripts are processed in-memory and discarded.
 * Only the AI-generated analysis is persisted.
 * 
 * Endpoints:
 *   POST /api/interview/:token/transcribe - Add transcription chunk (in-memory)
 *   POST /api/interview/:token/analyze - Generate and save analysis
 *   GET /api/interview/:token/analysis - Get saved analysis
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { AzureOpenAI } from 'openai';

// ============================================================================
// Configuration
// ============================================================================

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'australiaeast';
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4-1';

// In-memory transcript storage (per interview token)
// In production, use Redis or similar for multi-instance support
const interviewTranscripts = new Map<string, string[]>();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
// Candidate Analysis Prompt
// ============================================================================

const CANDIDATE_ANALYSIS_PROMPT = `You are an expert HR analyst helping evaluate candidates for a psychology practice. 
Analyze this interview transcript and provide a structured assessment.

CONTEXT:
- This is for Bloom, a telehealth psychology practice in Australia
- We're looking for registered psychologists who can work independently via telehealth
- Key qualities: clinical competence, communication skills, empathy, tech-savviness, business acumen

EVALUATION CRITERIA:
1. **Clinical Knowledge & Experience** - Understanding of therapeutic approaches, case conceptualization
2. **Communication Skills** - Clarity, active listening, rapport building
3. **Telehealth Readiness** - Comfort with technology, understanding of telehealth-specific considerations
4. **Professional Fit** - Alignment with values, collaborative mindset, growth orientation
5. **Business Awareness** - Understanding of private practice, client acquisition, admin responsibilities
6. **Red Flags** - Any concerns about boundaries, ethics, or professionalism

OUTPUT FORMAT:

## Candidate Summary
[2-3 sentence overview of the candidate and overall impression]

## Strengths
- [Specific strength with evidence from interview]
- [Another strength]
- [Another strength]

## Areas of Concern
- [Concern or area needing development]
- [Another concern if applicable]

## Clinical Competence
**Rating:** [Strong / Adequate / Needs Development / Insufficient]
[Brief explanation with specific examples from interview]

## Communication & Rapport
**Rating:** [Excellent / Good / Adequate / Needs Work]
[How did they engage? Were they warm, clear, professional?]

## Telehealth Suitability
**Rating:** [Highly Suitable / Suitable / May Need Support / Not Suitable]
[Tech comfort, understanding of virtual therapy dynamics]

## Cultural Fit
**Rating:** [Excellent Fit / Good Fit / Possible Fit / Not a Fit]
[Alignment with practice values, collaborative potential]

## Key Quotes
[2-3 notable quotes that capture their approach or thinking]

## Interview Dynamics
[How did the conversation flow? Were they engaged? Any notable moments?]

## Recommendation
**Verdict:** [Strong Yes / Yes / Maybe / No / Strong No]

**Rationale:** [2-3 sentences explaining the recommendation]

**If Hired - Onboarding Notes:**
[Any specific things to address or support needed if we proceed]`;

// ============================================================================
// Helper: Get OpenAI Client
// ============================================================================

function getOpenAIClient(): AzureOpenAI {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    throw new Error('Azure OpenAI not configured');
  }
  return new AzureOpenAI({
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiKey: AZURE_OPENAI_KEY,
    apiVersion: '2024-08-01-preview',
  });
}

// ============================================================================
// Helper: Validate Interview Token
// ============================================================================

async function validateInterviewToken(
  pool: sql.ConnectionPool,
  token: string
): Promise<{
  tokenId: string;
  applicationId: number;
  applicantName: string;
  scheduledAt: Date | null;
} | null> {
  const result = await pool.request()
    .input('token', sql.NVarChar, token)
    .query(`
      SELECT 
        id, application_id, 
        applicant_first_name, applicant_last_name,
        interview_scheduled_at
      FROM interview_tokens
      WHERE token = @token
        AND expires_at > GETUTCDATE()
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const row = result.recordset[0];
  return {
    tokenId: row.id,
    applicationId: row.application_id,
    applicantName: `${row.applicant_first_name} ${row.applicant_last_name}`,
    scheduledAt: row.interview_scheduled_at,
  };
}

// ============================================================================
// POST /api/interview/:token/transcribe
// Add a transcription chunk to the in-memory buffer
// ============================================================================

async function addTranscriptionChunk(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Token required' },
    };
  }

  try {
    const body = await request.json() as { text: string; speaker?: string; timestamp?: number };
    const { text, speaker, timestamp: _timestamp } = body;

    if (!text || text.trim().length === 0) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { success: false, error: 'Text required' },
      };
    }

    // Add to in-memory transcript
    if (!interviewTranscripts.has(token)) {
      interviewTranscripts.set(token, []);
    }

    const formattedLine = speaker 
      ? `[${speaker}]: ${text.trim()}`
      : text.trim();

    interviewTranscripts.get(token)!.push(formattedLine);

    context.log(`Added transcript chunk for interview ${token}: ${text.substring(0, 50)}...`);

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: { 
        success: true, 
        chunkCount: interviewTranscripts.get(token)!.length,
      },
    };
  } catch (error) {
    context.error('Error adding transcript chunk:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Failed to add transcript' },
    };
  }
}

// ============================================================================
// POST /api/interview/:token/analyze
// Generate AI analysis from transcript and save to application
// ============================================================================

async function analyzeInterview(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Token required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    // Validate token
    const tokenData = await validateInterviewToken(pool, token);
    if (!tokenData) {
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { success: false, error: 'Invalid or expired interview token' },
      };
    }

    // Get transcript from memory
    const transcriptChunks = interviewTranscripts.get(token);
    
    // Also accept transcript in request body (for cases where client has it)
    const body = await request.json().catch(() => ({})) as { 
      transcript?: string; 
      notes?: string;
      recommendation?: string;
    };

    const transcript = body.transcript || (transcriptChunks?.join('\n') ?? '');

    if (!transcript || transcript.trim().length < 100) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { 
          success: false, 
          error: 'Insufficient transcript data for analysis (minimum 100 characters)',
        },
      };
    }

    context.log(`Analyzing interview for ${tokenData.applicantName} (${transcript.length} chars)`);

    // Generate analysis with OpenAI
    const openai = getOpenAIClient();
    
    const completion = await openai.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: CANDIDATE_ANALYSIS_PROMPT },
        { 
          role: 'user', 
          content: `Please analyze this interview transcript for candidate: ${tokenData.applicantName}\n\n---\n\n${transcript}` 
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0]?.message?.content || 'Analysis generation failed';

    // Extract recommendation from analysis (look for the verdict)
    let recommendation = body.recommendation || null;
    if (!recommendation) {
      const verdictMatch = analysis.match(/\*\*Verdict:\*\*\s*(Strong Yes|Yes|Maybe|No|Strong No)/i);
      if (verdictMatch) {
        recommendation = verdictMatch[1].toLowerCase().replace(' ', '_');
      }
    }

    // Save analysis to application (NOT the transcript)
    await pool.request()
      .input('applicationId', sql.Int, tokenData.applicationId)
      .input('analysis', sql.NVarChar, analysis)
      .input('notes', sql.NVarChar, body.notes || null)
      .input('recommendation', sql.NVarChar, recommendation)
      .query(`
        UPDATE applications
        SET 
          interview_analysis = @analysis,
          interview_notes = COALESCE(@notes, interview_notes),
          interview_recommendation = @recommendation,
          interview_analyzed_at = GETUTCDATE(),
          status = 'interview_complete',
          updated_at = GETUTCDATE()
        WHERE id = @applicationId
      `);

    // Mark interview token as completed
    await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        UPDATE interview_tokens
        SET completed_at = GETUTCDATE()
        WHERE token = @token
      `);

    // Clear transcript from memory (privacy)
    interviewTranscripts.delete(token);

    context.log(`Interview analysis saved for application ${tokenData.applicationId}`);

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: {
        success: true,
        analysis,
        recommendation,
        applicationId: tokenData.applicationId,
      },
    };
  } catch (error) {
    context.error('Error analyzing interview:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Failed to analyze interview' },
    };
  }
}

// ============================================================================
// GET /api/interview/:token/analysis
// Get the saved analysis for an interview
// ============================================================================

async function getInterviewAnalysis(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Token required' },
    };
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(getDbConfig());

    // Get analysis from application via token
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          a.interview_analysis,
          a.interview_notes,
          a.interview_recommendation,
          a.interview_analyzed_at,
          it.applicant_first_name,
          it.applicant_last_name,
          it.completed_at
        FROM interview_tokens it
        JOIN applications a ON a.id = it.application_id
        WHERE it.token = @token
      `);

    if (result.recordset.length === 0) {
      return {
        status: 404,
        headers: corsHeaders,
        jsonBody: { success: false, error: 'Interview not found' },
      };
    }

    const row = result.recordset[0];

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: {
        success: true,
        applicantName: `${row.applicant_first_name} ${row.applicant_last_name}`,
        analysis: row.interview_analysis,
        notes: row.interview_notes,
        recommendation: row.interview_recommendation,
        analyzedAt: row.interview_analyzed_at,
        completedAt: row.completed_at,
      },
    };
  } catch (error) {
    context.error('Error getting interview analysis:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Failed to get analysis' },
    };
  }
}

// ============================================================================
// POST /api/interview/:token/transcribe-audio
// Transcribe audio chunk using Azure Speech Services
// ============================================================================

async function transcribeAudio(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Token required' },
    };
  }

  if (!SPEECH_KEY) {
    return {
      status: 503,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Speech services not configured' },
    };
  }

  try {
    const contentType = request.headers.get('content-type') || 'audio/wav';
    const audioBuffer = await request.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { success: false, error: 'No audio data provided' },
      };
    }

    // Transcribe with Azure Speech Services
    const speechEndpoint = `https://${SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    
    const response = await fetch(
      `${speechEndpoint}?language=en-AU&format=detailed`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': SPEECH_KEY,
          'Content-Type': contentType,
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      throw new Error(`Speech API error: ${response.status}`);
    }

    const result = await response.json();
    
    let text = '';
    if (result.RecognitionStatus === 'Success') {
      text = result.DisplayText || result.NBest?.[0]?.Display || '';
    }

    // Add to in-memory transcript if we got text
    if (text.trim()) {
      if (!interviewTranscripts.has(token)) {
        interviewTranscripts.set(token, []);
      }
      interviewTranscripts.get(token)!.push(text.trim());
    }

    return {
      status: 200,
      headers: corsHeaders,
      jsonBody: {
        success: true,
        text,
        status: result.RecognitionStatus,
      },
    };
  } catch (error) {
    context.error('Error transcribing audio:', error);
    return {
      status: 500,
      headers: corsHeaders,
      jsonBody: { success: false, error: 'Transcription failed' },
    };
  }
}

// ============================================================================
// Route Handler
// ============================================================================

async function interviewAnalysisHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  const path = request.params.action;

  if (request.method === 'POST' && path === 'transcribe') {
    return addTranscriptionChunk(request, context);
  }
  
  if (request.method === 'POST' && path === 'transcribe-audio') {
    return transcribeAudio(request, context);
  }
  
  if (request.method === 'POST' && path === 'analyze') {
    return analyzeInterview(request, context);
  }
  
  if (request.method === 'GET' && path === 'analysis') {
    return getInterviewAnalysis(request, context);
  }

  return {
    status: 404,
    headers: corsHeaders,
    jsonBody: { error: 'Not found' },
  };
}

// ============================================================================
// Register Function
// ============================================================================

app.http('interview-analysis', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'interview/{token}/{action}',
  handler: interviewAnalysisHandler,
});

export { interviewAnalysisHandler };
