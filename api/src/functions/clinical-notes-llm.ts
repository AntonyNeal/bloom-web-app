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

// ============================================================================
// Configuration
// ============================================================================

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const AZURE_OPENAI_API_VERSION = '2024-08-01-preview';

// ============================================================================
// System Prompts
// ============================================================================

const DRAFT_NOTE_SYSTEM_PROMPT = `You are a clinical documentation assistant for psychologists. Your role is to convert session transcriptions into professional clinical notes.

IMPORTANT GUIDELINES:
- Use professional clinical language
- Be concise but thorough
- Include relevant therapeutic observations
- Note any risk factors or concerns mentioned
- Maintain client confidentiality - use initials only
- Structure the note clearly with sections
- Do NOT add information not present in the transcription
- Flag any urgent concerns prominently

OUTPUT FORMAT:
## Session Summary
[2-3 sentence overview]

## Presenting Issues
[What the client discussed]

## Clinical Observations
[Therapist observations, affect, engagement, etc.]

## Interventions Used
[Therapeutic techniques applied]

## Client Response
[How client responded to interventions]

## Risk Assessment
[Any risk factors - if none mentioned, state "No risk factors identified"]

## Plan
[Next steps, homework, follow-up plans]

## Notes for Next Session
[Things to follow up on]`;

const PREP_SUMMARY_SYSTEM_PROMPT = `You are a clinical preparation assistant for psychologists. Your role is to summarize previous session notes to help the clinician prepare for an upcoming session.

IMPORTANT GUIDELINES:
- Highlight key themes and patterns across sessions
- Note any ongoing concerns or risk factors
- Summarize treatment progress
- List unfinished business from previous sessions
- Include any client-specific notes from the booking
- Keep it brief and actionable
- Prioritize recent sessions but note long-term patterns

OUTPUT FORMAT:
## Quick Prep Summary

### Client at a Glance
[1-2 sentences: presenting issues, treatment focus]

### Last Session Highlights
[Key points from most recent session]

### Ongoing Themes
[Patterns across sessions]

### Watch For
[Risk factors, concerns, things to check in on]

### Planned Focus
[What was planned for this session]

### Booking Notes
[Any notes the client added when booking, if provided]

### Suggested Opening
[A natural way to start the session based on context]`;

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
// Generate Draft Note from Transcription
// ============================================================================

async function generateDraftNote(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('LLM: Generate draft note from transcription');

  try {
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
