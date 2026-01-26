/**
 * Clinical Notes LLM Service
 * 
 * Azure OpenAI integration for:
 * 1. Generating draft notes from session transcription
 * 2. Creating prep summaries from previous notes + booking notes
 * 
 * Security:
 * - Uses Azure OpenAI (HIPAA-eligible, no data retention)
 * - Transcription is ephemeral - not stored
 * - Generated content decrypted only in clinician's browser
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureOpenAI } from 'openai';
import { getPractitionerByAzureId } from '../services/practitioner';

// ============================================================================
// Configuration
// ============================================================================

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
// Use o1 when quota approved, fallback to gpt-4.1 for now
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4-1';
const AZURE_OPENAI_API_VERSION = '2024-08-01-preview';

// ============================================================================
// System Prompts
// ============================================================================

const DRAFT_NOTE_SYSTEM_PROMPT = `You are a clinical documentation assistant for registered psychologists in Australia. Your role is to convert session transcriptions into professional clinical progress notes following best practice guidelines.

CLINICAL DOCUMENTATION STANDARDS:
- Follow DAP (Data, Assessment, Plan) or SOAP (Subjective, Objective, Assessment, Plan) structure
- Use ICD-10/DSM-5 terminology where appropriate
- Document in a manner suitable for Medicare/NDIS audits
- Be objective and evidence-based
- Avoid jargon - use clear clinical language
- Document what was observed and reported, not interpretations
- Include functional outcomes where relevant

PRIVACY & ETHICS:
- Use client initials only (e.g., "J.S.")
- Do NOT add information not present in the transcription
- Do NOT diagnose - only reference existing diagnoses if mentioned
- Document verbatim quotes sparingly and only when clinically relevant

RISK DOCUMENTATION:
When risk factors are mentioned, document:
- Nature and severity of risk
- Protective factors identified
- Safety planning discussed
- Actions taken
- Follow-up required
If NO risk factors mentioned, state: "No current risk factors identified or disclosed during session."

OUTPUT FORMAT:

## Session Overview
**Date:** [Session date if mentioned]
**Session Type:** [Individual/Couple/Family therapy]
**Duration:** [If provided]
**Modality:** [Telehealth]

## Presenting Concerns (Subjective/Data)
[What the client reported - their perspective, concerns raised, events since last session]
- Key themes discussed
- Client's stated goals for session
- Relevant life events reported

## Mental State Observations (Objective)
[Observable clinical data - only what can be reasonably inferred from transcription]
- Affect and mood (as expressed verbally)
- Speech patterns (if notable)
- Thought content and process
- Engagement level
- Insight and motivation

## Clinical Formulation (Assessment)
[Professional assessment of the session]
- Progress toward treatment goals
- Therapeutic relationship observations
- Response to interventions
- Barriers to progress identified
- Strengths and resources noted

## Interventions Applied
[Specific therapeutic techniques used - be precise]
- Name the intervention (e.g., "Cognitive restructuring", "Behavioral activation", "Values clarification")
- Brief description of application
- Client's response to intervention

## Risk Assessment
[Structured risk documentation]
- Suicidal ideation: [None disclosed / Details if present]
- Self-harm: [None disclosed / Details if present]
- Harm to others: [None disclosed / Details if present]
- Other risks: [Substance use, vulnerability, etc.]
- Protective factors: [Support network, coping strategies, reasons for living]

## Plan & Recommendations
- Between-session tasks/homework assigned
- Focus for next session
- Referrals or coordination required
- Review period for treatment goals

## Clinician Notes (Internal)
[Anything to remember for next session - hypotheses to explore, transference/countertransference, consultation needs]`;

const PREP_SUMMARY_SYSTEM_PROMPT = `You are a clinical preparation assistant for registered psychologists in Australia. Your role is to synthesize previous session notes into an actionable pre-session brief.

PURPOSE:
Help the clinician walk into the session oriented and prepared, without needing to re-read all previous notes.

GUIDELINES:
- Prioritize clinically relevant information
- Highlight patterns and progress across sessions  
- Flag any outstanding risks or concerns
- Note homework/tasks assigned and whether completed
- Be concise - this is a quick reference, not a full summary
- Use bullet points for scannability
- Include specific quotes or examples that might be useful to reference

OUTPUT FORMAT:

## 📋 Pre-Session Brief: [Client Initials]

### At a Glance
**Sessions to date:** [Number]
**Primary presenting issues:** [1-2 sentences]
**Current treatment focus:** [e.g., "CBT for anxiety - exposure hierarchy"]
**Diagnosis (if documented):** [Or "Not formally documented"]

### 🔴 Priority Items
[Anything urgent - risk factors, crisis follow-up, safeguarding concerns]
- [Item with context]

### 📈 Treatment Progress
**Goals being worked on:**
1. [Goal] - [Progress status: On track / Stalled / Achieved]

**Key wins/breakthroughs:**
- [Recent positive developments]

**Current barriers:**
- [What's getting in the way]

### 📝 Last Session Summary
**Date:** [Date]
**Key themes:** [What was discussed]
**Interventions used:** [What you did]
**Tasks assigned:** [Homework given]
**Planned for this session:** [What was flagged to follow up]

### 📊 Patterns Observed
[Themes that recur across sessions]
- [Pattern 1]
- [Pattern 2]

### 💬 Useful Context
[Specific quotes, metaphors the client uses, or therapeutic frames that resonate with them]

### 🎯 Suggested Session Focus
Based on treatment plan and recent sessions:
1. [Check in on X]
2. [Continue work on Y]
3. [Introduce Z if appropriate]

### 📌 Booking Notes
[What the client wrote when booking, if provided - may indicate current state or agenda]`;

// ============================================================================
// OpenAI Client
// ============================================================================

function getOpenAIClient(): AzureOpenAI {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    throw new Error('Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY.');
  }

  return new AzureOpenAI({
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiKey: AZURE_OPENAI_KEY,
    apiVersion: AZURE_OPENAI_API_VERSION,
  });
}

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
// Generate Draft Note from Transcription
// ============================================================================

async function generateDraftNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('LLM: Generate draft note from transcription');

  try {
    // Validate practitioner authentication
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    context.log(`LLM: Authorized request from practitioner ${auth.practitionerId}`);

    const body = await request.json() as {
      transcription: string;
      patientInitials: string;
      sessionType?: string;
      sessionDuration?: number;
    };

    if (!body.transcription) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'Transcription is required' },
      };
    }

    const client = getOpenAIClient();

    const userPrompt = `Generate clinical notes for this ${body.sessionType || 'therapy'} session with client ${body.patientInitials}.
${body.sessionDuration ? `Session duration: ${body.sessionDuration} minutes.` : ''}

TRANSCRIPTION:
${body.transcription}`;

    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: DRAFT_NOTE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent clinical notes
      max_tokens: 2000,
    });

    const draftNote = completion.choices[0]?.message?.content;

    if (!draftNote) {
      throw new Error('No response from Azure OpenAI');
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          draftNote,
          generatedAt: new Date().toISOString(),
          model: AZURE_OPENAI_DEPLOYMENT,
          // Note: transcription is NOT stored or returned
        },
      },
    };
  } catch (error) {
    context.error('Error generating draft note:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 500,
      jsonBody: { success: false, error: message },
    };
  }
}

// ============================================================================
// Generate Prep Summary from Previous Notes
// ============================================================================

async function generatePrepSummary(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('LLM: Generate prep summary');

  try {
    // Validate practitioner authentication
    const auth = await validatePractitioner(request);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized - practitioner authentication required' },
      };
    }
    context.log(`LLM: Authorized prep summary request from practitioner ${auth.practitionerId}`);

    const body = await request.json() as {
      previousNotes: Array<{
        sessionDate: string;
        content: string;  // Already decrypted by client
        noteType: string;
      }>;
      bookingNotes?: string;
      patientInitials: string;
      upcomingSessionType?: string;
    };

    if (!body.previousNotes || body.previousNotes.length === 0) {
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            prepSummary: `## Quick Prep Summary

### Client at a Glance
First session with ${body.patientInitials}. No previous notes available.

### Booking Notes
${body.bookingNotes || 'No booking notes provided.'}

### Suggested Opening
"Welcome! I'm glad you're here. Before we begin, I'd like to learn a bit about what brings you in today."`,
            generatedAt: new Date().toISOString(),
            isFirstSession: true,
          },
        },
      };
    }

    const client = getOpenAIClient();

    // Sort notes by date (most recent first) and format
    const sortedNotes = body.previousNotes
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(0, 10); // Limit to last 10 sessions for context window

    const notesText = sortedNotes
      .map((note, idx) => `--- Session ${idx + 1} (${note.sessionDate}) ---\n${note.content}`)
      .join('\n\n');

    const userPrompt = `Prepare a summary for an upcoming ${body.upcomingSessionType || 'therapy'} session with client ${body.patientInitials}.

${body.bookingNotes ? `CLIENT'S BOOKING NOTES:\n${body.bookingNotes}\n\n` : ''}PREVIOUS SESSION NOTES (${sortedNotes.length} sessions, most recent first):

${notesText}`;

    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: PREP_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const prepSummary = completion.choices[0]?.message?.content;

    if (!prepSummary) {
      throw new Error('No response from Azure OpenAI');
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          prepSummary,
          generatedAt: new Date().toISOString(),
          model: AZURE_OPENAI_DEPLOYMENT,
          sessionsAnalyzed: sortedNotes.length,
        },
      },
    };
  } catch (error) {
    context.error('Error generating prep summary:', error);
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

app.http('notes-generate-draft', {
  methods: ['POST'],
  authLevel: 'anonymous', // Auth handled by middleware
  route: 'clinical-notes/generate-draft',
  handler: generateDraftNote,
});

app.http('notes-generate-prep', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/generate-prep',
  handler: generatePrepSummary,
});

// ============================================================================
// Prep Notes Chat - AI chat about patient
// ============================================================================

const CHAT_SYSTEM_PROMPT = `You are a clinical assistant helping a psychologist prepare for a therapy session. You have access to the patient's prep notes and context.

GUIDELINES:
- Be concise and clinically relevant
- Focus on therapeutic insights and preparation
- Use client initials only (never full names)
- Reference patterns, themes, and therapeutic considerations
- Be supportive but professional
- If asked about something not in the context, acknowledge the limitation

PRIVACY:
- Never generate or assume personal details not provided
- Maintain clinical objectivity`;

async function handlePrepNotesChat(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('LLM: Prep notes chat');

  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return { status: 401, jsonBody: { success: false, error: 'Unauthorized' } };
    }

    const body = await request.json() as {
      appointmentId: string;
      patientInitials: string;
      patientName?: string;
      message: string;
      context?: string; // Current prep notes
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!body.message) {
      return { status: 400, jsonBody: { success: false, error: 'Message required' } };
    }

    const client = getOpenAIClient();

    // Build conversation
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ];

    // Add context if available
    if (body.context) {
      messages.push({
        role: 'system',
        content: `CURRENT PREP NOTES FOR ${body.patientInitials}:\n${body.context}`,
      });
    }

    // Add conversation history
    if (body.conversationHistory) {
      for (const msg of body.conversationHistory.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: body.message });

    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages,
      temperature: 0.5,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: { response: response || 'I apologize, I could not generate a response.' },
      },
    };
  } catch (error) {
    context.error('Error in prep notes chat:', error);
    return {
      status: 500,
      jsonBody: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

app.http('prep-notes-chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/chat',
  handler: handlePrepNotesChat,
});

// ============================================================================
// Enhance Prep Notes - AI improves the notes
// ============================================================================

const ENHANCE_SYSTEM_PROMPT = `You are a clinical documentation assistant helping improve prep notes for a therapy session.

When enhancing notes:
- Improve clarity and structure
- Add relevant clinical considerations
- Suggest therapeutic angles to explore
- Keep the same general content but make it more useful
- Use bullet points and clear headings
- Keep it concise - these are quick reference notes

Return ONLY the enhanced notes, no explanations.`;

async function handleEnhancePrepNotes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('LLM: Enhance prep notes');

  try {
    const auth = await validatePractitioner(request);
    if (!auth) {
      return { status: 401, jsonBody: { success: false, error: 'Unauthorized' } };
    }

    const body = await request.json() as {
      appointmentId: string;
      patientInitials: string;
      currentNotes: string;
    };

    if (!body.currentNotes) {
      return { status: 400, jsonBody: { success: false, error: 'Current notes required' } };
    }

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
        { role: 'user', content: `Enhance these prep notes for client ${body.patientInitials}:\n\n${body.currentNotes}` },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const enhancedNotes = completion.choices[0]?.message?.content;

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: { enhancedNotes: enhancedNotes || body.currentNotes },
      },
    };
  } catch (error) {
    context.error('Error enhancing prep notes:', error);
    return {
      status: 500,
      jsonBody: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

app.http('prep-notes-enhance', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'clinical-notes/enhance-prep',
  handler: handleEnhancePrepNotes,
});
