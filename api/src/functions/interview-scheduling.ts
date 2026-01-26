/**
 * Interview Scheduling API
 * 
 * Handles interview scheduling for applicants:
 *   GET  /api/schedule-interview/:token - Get available interview slots
 *   POST /api/schedule-interview/:token - Book an interview slot
 *   GET  /api/interview/:token - Get interview details (for video room)
 *   POST /api/interview/:token/join - Join interview video room
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as sql from 'mssql';
import { randomBytes, randomUUID } from 'crypto';
import { getDbConnection } from '../services/database';
import { sendInterviewScheduledConfirmation } from '../services/email';

// ============================================================================
// Configuration
// ============================================================================

// Interview practitioners (Julian and Zoe)
const INTERVIEWER_PRACTITIONER_IDS = {
  JULIAN: '1473161',
  ZOE: '1304541',
};

// Use Zoe's practitioner for interview availability (Julian not enabled for public booking)
// The booking will still show both Julian and Zoe as interviewers
const INTERVIEW_PRACTITIONER_ID = INTERVIEWER_PRACTITIONER_IDS.ZOE;
const _INTERVIEW_PRACTITIONER_ROLE_ID = process.env.INTERVIEW_PRACTITIONER_ROLE_ID || 'PR-2442591';
const _INTERVIEW_HEALTHCARE_SERVICE_ID = process.env.INTERVIEW_HEALTHCARE_SERVICE_ID || '567387';
const INTERVIEW_DURATION_MINS = 60;

// Business hours for interview scheduling (8am to 6pm AEST)
const INTERVIEW_BUSINESS_HOURS = { start: 8, end: 18 };

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================================
// Get Available Interview Slots
// ============================================================================

async function getInterviewSlots(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Token is required' },
    };
  }

  try {
    const pool = await getDbConnection();

    // Verify token and get application info
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          it.id,
          it.application_id,
          it.applicant_first_name,
          it.applicant_last_name,
          it.applicant_email,
          it.interview_scheduled_at,
          it.expires_at,
          a.status as application_status
        FROM interview_tokens it
        JOIN applications a ON a.id = it.application_id
        WHERE it.token = @token
      `);

    if (tokenResult.recordset.length === 0) {
      return {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Invalid or expired scheduling link' },
      };
    }

    const tokenData = tokenResult.recordset[0];

    // Check if token expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'This scheduling link has expired' },
      };
    }

    // Check if already scheduled
    if (tokenData.interview_scheduled_at) {
      return {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: true,
          alreadyScheduled: true,
          scheduledAt: tokenData.interview_scheduled_at,
          applicant: {
            firstName: tokenData.applicant_first_name,
            lastName: tokenData.applicant_last_name,
          },
        },
      };
    }

    // Fetch available slots from Halaxy for next 14 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    // Build query for Halaxy public booking API
    // Note: Halaxy uses 'clinic', 'dateFrom', 'dateTo', 'practitioner', 'fee' parameter names
    const queryParams = new URLSearchParams({
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      duration: String(INTERVIEW_DURATION_MINS),
      clinic: '1023041', // Life Psychology clinic
      fee: '9381231',    // Standard fee
      practitioner: INTERVIEW_PRACTITIONER_ID,
    });

    const halaxyUrl = `https://www.halaxy.com/api/v2/open/booking/timeslot/availability?${queryParams.toString()}`;
    
    context.log(`Fetching interview slots from Halaxy: ${halaxyUrl}`);

    const halaxyResponse = await fetch(halaxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
      },
    });

    if (!halaxyResponse.ok) {
      const errorText = await halaxyResponse.text();
      context.error(`Halaxy API error: ${halaxyResponse.status} - ${errorText}`);
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Unable to fetch available times' },
      };
    }

    const slotsData = await halaxyResponse.json();
    
    // Transform Halaxy v2 slots for frontend
    // Halaxy returns { dates: { "2026-01-26": [{dateTimeKey, day, startDateUserTime, timeLabel, ...}, ...], ... } }
    interface HalaxySlot {
      dateTimeKey: string;
      day: string;
      startDateUserTime: string;
      timeLabel: string;
      timeSection: string;
      userTimezone: string;
      status?: string;
    }
    
    const slots: Array<{ id: string; start: string; end: string; day: string; timeLabel: string }> = [];
    const timeslotsData = slotsData?.data?.timeslots || {};
    
    for (const [_dateKey, daySlots] of Object.entries(timeslotsData)) {
      const slotsArray = daySlots as HalaxySlot[];
      for (const slot of slotsArray) {
        // Skip "not-available" slots or slots without required fields
        if (slot.status === 'not-available' || !slot.dateTimeKey || !slot.startDateUserTime) continue;
        
        // Calculate end time by adding interview duration to start time
        const startTime = new Date(slot.startDateUserTime);
        const endTime = new Date(startTime.getTime() + INTERVIEW_DURATION_MINS * 60 * 1000);
        
        // Filter to business hours only (8am-6pm AEST)
        const slotHour = startTime.getHours();
        if (slotHour < INTERVIEW_BUSINESS_HOURS.start || slotHour >= INTERVIEW_BUSINESS_HOURS.end) {
          continue; // Skip slots outside business hours
        }
        
        slots.push({
          id: slot.dateTimeKey,
          start: slot.startDateUserTime,
          end: endTime.toISOString(),
          day: slot.day,
          timeLabel: slot.timeLabel || '',
        });
      }
    }
    
    // Sort by start time
    slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        applicant: {
          firstName: tokenData.applicant_first_name,
          lastName: tokenData.applicant_last_name,
        },
        slots,
        durationMinutes: INTERVIEW_DURATION_MINS,
      },
    };
  } catch (error) {
    context.error('Error fetching interview slots:', error);
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Failed to fetch available times' },
    };
  }
}

// ============================================================================
// Book Interview Slot
// ============================================================================

async function bookInterviewSlot(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Token is required' },
    };
  }

  let body: { slotId: string; startTime: string; endTime: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Invalid request body' },
    };
  }

  if (!body.startTime) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Start time is required' },
    };
  }

  try {
    const pool = await getDbConnection();

    // Verify token
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          it.id,
          it.application_id,
          it.applicant_first_name,
          it.applicant_last_name,
          it.applicant_email,
          it.interview_scheduled_at,
          it.expires_at
        FROM interview_tokens it
        WHERE it.token = @token
      `);

    if (tokenResult.recordset.length === 0) {
      return {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Invalid scheduling link' },
      };
    }

    const tokenData = tokenResult.recordset[0];

    // Check if expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'This scheduling link has expired' },
      };
    }

    // Check if already scheduled
    if (tokenData.interview_scheduled_at) {
      return {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { 
          success: false, 
          error: 'Interview already scheduled',
          scheduledAt: tokenData.interview_scheduled_at,
        },
      };
    }

    const interviewTime = new Date(body.startTime);
    const endTime = body.endTime 
      ? new Date(body.endTime) 
      : new Date(interviewTime.getTime() + INTERVIEW_DURATION_MINS * 60 * 1000);

    // Create Halaxy appointment for the interview
    // First, we need to create/find the applicant as a patient in Halaxy
    const { HalaxyClient: _HalaxyClient, getHalaxyClient } = await import('../services/halaxy/client');
    const halaxyClient = getHalaxyClient();

    // Create patient record for the applicant
    const patient = await halaxyClient.createOrFindPatient({
      firstName: tokenData.applicant_first_name,
      lastName: tokenData.applicant_last_name,
      email: tokenData.applicant_email,
    });

    context.log(`Created/found patient for applicant: ${patient.id}`);

    // Create the appointment in Halaxy
    const appointment = await halaxyClient.createAppointment({
      patientId: patient.id,
      practitionerId: INTERVIEW_PRACTITIONER_ID,
      start: interviewTime.toISOString(),
      end: endTime.toISOString(),
      description: `Interview - ${tokenData.applicant_first_name} ${tokenData.applicant_last_name}`,
      locationType: 'telehealth',
    });

    context.log(`Created Halaxy appointment: ${appointment.id}`);

    // Create ACS room for the interview
    const { createAcsRoom } = await import('./telehealth-room');
    const validFrom = new Date(interviewTime.getTime() - 15 * 60 * 1000);  // 15 min before
    const validUntil = new Date(interviewTime.getTime() + 2 * 60 * 60 * 1000);  // 2 hours after
    
    const acsRoom = await createAcsRoom(validFrom, validUntil);
    context.log(`Created ACS room: ${acsRoom.id}`);

    // Create interview room record
    const roomId = randomUUID();
    await pool.request()
      .input('id', sql.UniqueIdentifier, roomId)
      .input('tokenId', sql.UniqueIdentifier, tokenData.id)
      .input('acsRoomId', sql.NVarChar, acsRoom.id)
      .input('validFrom', sql.DateTime2, validFrom)
      .input('validUntil', sql.DateTime2, validUntil)
      .query(`
        INSERT INTO interview_rooms (id, interview_token_id, acs_room_id, valid_from, valid_until)
        VALUES (@id, @tokenId, @acsRoomId, @validFrom, @validUntil)
      `);

    // Update interview token with scheduled time and room
    await pool.request()
      .input('token', sql.NVarChar, token)
      .input('scheduledAt', sql.DateTime2, interviewTime)
      .input('halaxyAppointmentId', sql.NVarChar, appointment.id)
      .input('roomId', sql.UniqueIdentifier, roomId)
      .query(`
        UPDATE interview_tokens
        SET 
          interview_scheduled_at = @scheduledAt,
          halaxy_appointment_id = @halaxyAppointmentId,
          room_id = @roomId,
          scheduled_at = GETUTCDATE()
        WHERE token = @token
      `);

    // Update application status to interview_set (applicant has booked a time)
    await pool.request()
      .input('applicationId', sql.Int, tokenData.application_id)
      .input('scheduledAt', sql.DateTime2, interviewTime)
      .query(`
        UPDATE applications
        SET 
          status = 'interview_set',
          interview_scheduled_at = @scheduledAt,
          updated_at = GETUTCDATE()
        WHERE id = @applicationId
      `);

    // Generate interview join link
    const baseUrl = process.env.BLOOM_APP_URL || 'https://staging.bloom.life-psychology.com.au';
    const interviewLink = `${baseUrl}/interview/${token}`;

    // Send confirmation email to applicant
    try {
      await sendInterviewScheduledConfirmation({
        firstName: tokenData.applicant_first_name,
        email: tokenData.applicant_email,
        interviewDate: interviewTime,
        interviewLink,
        interviewers: ['Zoe', 'Julian'],
      });
      context.log('Sent interview confirmation email to applicant');
    } catch (emailError) {
      context.warn('Failed to send confirmation email:', emailError);
    }

    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        scheduledAt: interviewTime.toISOString(),
        interviewLink,
        appointmentId: appointment.id,
      },
    };
  } catch (error) {
    context.error('Error booking interview:', error);
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Failed to book interview' },
    };
  }
}

// ============================================================================
// Get Interview Details (for video room)
// ============================================================================

async function getInterviewDetails(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.params.token;

  if (!token) {
    return {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Token is required' },
    };
  }

  try {
    const pool = await getDbConnection();

    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`
        SELECT 
          it.id,
          it.application_id,
          it.applicant_first_name,
          it.applicant_last_name,
          it.applicant_email,
          it.interview_scheduled_at,
          it.interview_duration_mins,
          it.expires_at,
          it.completed_at,
          ir.acs_room_id,
          ir.room_status,
          ir.valid_from,
          ir.valid_until
        FROM interview_tokens it
        LEFT JOIN interview_rooms ir ON ir.interview_token_id = it.id
        WHERE it.token = @token
      `);

    if (result.recordset.length === 0) {
      return {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Invalid interview link' },
      };
    }

    const data = result.recordset[0];

    // Check if interview is scheduled
    if (!data.interview_scheduled_at) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { 
          success: false, 
          error: 'Interview has not been scheduled yet',
          scheduleLink: `/schedule-interview/${token}`,
        },
      };
    }

    // Check if interview is completed
    if (data.completed_at) {
      return {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'This interview has already been completed' },
      };
    }

    const now = new Date();
    const interviewTime = new Date(data.interview_scheduled_at);
    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);

    // Check if too early
    if (now < validFrom) {
      const minutesUntilOpen = Math.ceil((validFrom.getTime() - now.getTime()) / 60000);
      return {
        status: 425, // Too Early
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { 
          success: false, 
          error: 'Interview room is not open yet',
          opensAt: validFrom.toISOString(),
          minutesUntilOpen,
          interviewTime: interviewTime.toISOString(),
        },
      };
    }

    // Check if too late
    if (now > validUntil) {
      return {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: 'Interview room has closed' },
      };
    }

    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        interview: {
          applicantFirstName: data.applicant_first_name,
          applicantLastName: data.applicant_last_name,
          scheduledAt: data.interview_scheduled_at,
          durationMinutes: data.interview_duration_mins,
          acsRoomId: data.acs_room_id,
          roomStatus: data.room_status,
          interviewers: ['Zoe', 'Julian'],
        },
      },
    };
  } catch (error) {
    context.error('Error getting interview details:', error);
    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: { success: false, error: 'Failed to get interview details' },
    };
  }
}

// ============================================================================
// Create Interview Token (called when application is submitted)
// ============================================================================

export async function createInterviewToken(
  applicationId: number,
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
  },
  context?: InvocationContext
): Promise<{ token: string; schedulingLink: string }> {
  const pool = await getDbConnection();

  // Generate secure token
  const token = randomBytes(32).toString('base64url');
  const tokenId = randomUUID();
  
  // Token expires in 14 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await pool.request()
    .input('id', sql.UniqueIdentifier, tokenId)
    .input('token', sql.NVarChar, token)
    .input('applicationId', sql.Int, applicationId)
    .input('firstName', sql.NVarChar, applicant.firstName)
    .input('lastName', sql.NVarChar, applicant.lastName)
    .input('email', sql.NVarChar, applicant.email)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query(`
      INSERT INTO interview_tokens (
        id, token, application_id, 
        applicant_first_name, applicant_last_name, applicant_email,
        expires_at
      ) VALUES (
        @id, @token, @applicationId,
        @firstName, @lastName, @email,
        @expiresAt
      )
    `);

  const baseUrl = process.env.BLOOM_APP_URL || 'https://staging.bloom.life-psychology.com.au';
  const schedulingLink = `${baseUrl}/schedule-interview/${token}`;

  if (context) {
    context.log(`Created interview token for application ${applicationId}: ${schedulingLink}`);
  }

  return { token, schedulingLink };
}

// ============================================================================
// Route Handler
// ============================================================================

async function scheduleInterviewHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  if (request.method === 'GET') {
    return getInterviewSlots(request, context);
  } else if (request.method === 'POST') {
    return bookInterviewSlot(request, context);
  }

  return {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    jsonBody: { error: 'Method not allowed' },
  };
}

async function interviewHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  if (request.method === 'GET') {
    return getInterviewDetails(request, context);
  }

  return {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    jsonBody: { error: 'Method not allowed' },
  };
}

// Register functions
app.http('schedule-interview', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'schedule-interview/{token}',
  handler: scheduleInterviewHandler,
});

app.http('interview', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'interview/{token}',
  handler: interviewHandler,
});
