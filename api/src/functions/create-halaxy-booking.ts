/**
 * Create Halaxy Booking Function
 *
 * Azure Function to create appointments in Halaxy from the website.
 * Creates or finds the patient, then creates the appointment.
 * Stores booking session data for analytics tracking.
 * Queues clinician notification (SMS/email) for async processing.
 * 
 * Architecture:
 * - Booking creation is synchronous (returns immediately)
 * - Notifications are queued and processed async (fire-and-forget)
 * - Notification failures do NOT affect booking success
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { getDbConnection } from '../services/database';
import { queueBookingNotification } from '../services/notifications/queue';
import * as sql from 'mssql';

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

interface AppointmentDetails {
  startTime: string;
  endTime: string;
  minutesDuration: number;
  practitionerId?: string;
  notes?: string;
  appointmentType?: string; // e.g., 'ndis-psychology-session', 'standard-psychology-session'
}

interface SessionData {
  client_id?: string;
  session_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
}

interface BookingRequest {
  patient: PatientData;
  appointmentDetails: AppointmentDetails;
  sessionData?: SessionData;
}

interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  patientId?: string;
  bookingSessionId?: string;
  message?: string;
  error?: string;
}

/**
 * Get the default practitioner ID from environment or database
 */
async function getDefaultPractitionerId(context: InvocationContext): Promise<string> {
  // First check environment variable
  const envPractitionerId = process.env.HALAXY_PRACTITIONER_ID;
  if (envPractitionerId) {
    context.log(`Using HALAXY_PRACTITIONER_ID from env: ${envPractitionerId}`);
    return envPractitionerId;
  }

  context.log('HALAXY_PRACTITIONER_ID not set, querying database...');

  // Fall back to first active practitioner in database
  try {
    const pool = await getDbConnection();
    context.log('Database connection established');
    
    const result = await pool.request().query<{ halaxy_practitioner_id: string }>(`
      SELECT TOP 1 halaxy_practitioner_id 
      FROM practitioners 
      WHERE is_active = 1 
        AND halaxy_practitioner_id IS NOT NULL
        AND halaxy_practitioner_id NOT LIKE 'HAL-%'
      ORDER BY created_at
    `);

    context.log(`Database query returned ${result.recordset.length} practitioners`);

    if (result.recordset.length > 0) {
      const practitionerId = result.recordset[0].halaxy_practitioner_id;
      context.log(`Found practitioner ID: ${practitionerId}`);
      return practitionerId;
    }
    
    context.warn('No active practitioners found in database with valid Halaxy IDs');
  } catch (error) {
    context.error('Failed to get practitioner from database:', error);
  }

  throw new Error('No practitioner configured for bookings. Please set HALAXY_PRACTITIONER_ID environment variable.');
}

/**
 * Store booking session for analytics tracking
 */
async function storeBookingSession(
  appointmentId: string,
  patientId: string,
  sessionData: SessionData | undefined,
  context: InvocationContext
): Promise<string | null> {
  if (!sessionData) return null;

  try {
    const pool = await getDbConnection();
    const bookingSessionId = crypto.randomUUID();

    await pool.request()
      .input('id', sql.UniqueIdentifier, bookingSessionId)
      .input('halaxyAppointmentId', sql.NVarChar, appointmentId)
      .input('halaxyPatientId', sql.NVarChar, patientId)
      .input('gaClientId', sql.NVarChar, sessionData.client_id || null)
      .input('gaSessionId', sql.NVarChar, sessionData.session_id || null)
      .input('utmSource', sql.NVarChar, sessionData.utm_source || null)
      .input('utmMedium', sql.NVarChar, sessionData.utm_medium || null)
      .input('utmCampaign', sql.NVarChar, sessionData.utm_campaign || null)
      .input('gclid', sql.NVarChar, sessionData.gclid || null)
      .query(`
        INSERT INTO booking_sessions (
          id, halaxy_appointment_id, halaxy_patient_id,
          ga_client_id, ga_session_id,
          utm_source, utm_medium, utm_campaign, gclid,
          created_at
        ) VALUES (
          @id, @halaxyAppointmentId, @halaxyPatientId,
          @gaClientId, @gaSessionId,
          @utmSource, @utmMedium, @utmCampaign, @gclid,
          GETUTCDATE()
        )
      `);

    return bookingSessionId;
  } catch (error) {
    // Non-critical - log and continue
    context.warn('Failed to store booking session:', error);
    return null;
  }
}

/**
 * Validate booking request
 */
function validateRequest(body: BookingRequest): string | null {
  if (!body.patient) {
    return 'Patient data is required';
  }

  if (!body.patient.firstName || !body.patient.lastName) {
    return 'Patient first name and last name are required';
  }

  if (!body.patient.email) {
    return 'Patient email is required';
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.patient.email)) {
    return 'Invalid email format';
  }

  if (!body.appointmentDetails) {
    return 'Appointment details are required';
  }

  if (!body.appointmentDetails.startTime || !body.appointmentDetails.endTime) {
    return 'Appointment start and end times are required';
  }

  // Validate dates
  const startTime = new Date(body.appointmentDetails.startTime);
  const endTime = new Date(body.appointmentDetails.endTime);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return 'Invalid date format for appointment times';
  }

  if (startTime >= endTime) {
    return 'Appointment end time must be after start time';
  }

  if (startTime < new Date()) {
    return 'Cannot book appointments in the past';
  }

  return null;
}

async function createHalaxyBooking(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const bookingStartTime = Date.now();
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders };
  }

  try {
    // Parse request body
    const body = await req.json() as BookingRequest;

    context.log('Creating Halaxy booking', {
      patientEmail: body.patient?.email ? '***' : undefined,
      startTime: body.appointmentDetails?.startTime,
    });
    context.log(`[PERF] Request parsed at +${Date.now() - bookingStartTime}ms`);

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: validationError } as BookingResponse,
      };
    }

    // Check Halaxy credentials
    if (!process.env.HALAXY_CLIENT_ID || !process.env.HALAXY_CLIENT_SECRET) {
      context.error('Halaxy credentials not configured');
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Booking service temporarily unavailable',
        } as BookingResponse,
      };
    }

    const halaxyClient = getHalaxyClient();

    // Get practitioner ID
    const practitionerId = body.appointmentDetails.practitionerId ||
      await getDefaultPractitionerId(context);

    context.log(`Using practitioner: ${practitionerId}`);
    context.log(`[PERF] Practitioner resolved at +${Date.now() - bookingStartTime}ms`);

    // Step 1: Create or find patient
    context.log('Creating/finding patient in Halaxy...');
    const patient = await halaxyClient.createOrFindPatient({
      firstName: body.patient.firstName,
      lastName: body.patient.lastName,
      email: body.patient.email,
      phone: body.patient.phone,
      dateOfBirth: body.patient.dateOfBirth,
      gender: body.patient.gender,
    });

    context.log(`Patient ID: ${patient.id}`);
    context.log(`[PERF] Patient created/found at +${Date.now() - bookingStartTime}ms`);

    // Step 2: Create appointment
    context.log('Creating appointment in Halaxy...');
    
    const appointment = await halaxyClient.createAppointment({
      patientId: patient.id,
      practitionerId: practitionerId,
      start: body.appointmentDetails.startTime,
      end: body.appointmentDetails.endTime,
      description: body.appointmentDetails.notes,
    });

    context.log(`Appointment created - ID: ${appointment.id}, Status: ${appointment.status}`);
    context.log(`[PERF] Appointment created at +${Date.now() - bookingStartTime}ms`);

    // Step 3: Queue notification for async processing (fire-and-forget)
    // Notification failures do NOT block the booking - it's already confirmed in Halaxy
    try {
      const notificationId = await queueBookingNotification(
        practitionerId,
        {
          appointmentId: appointment.id,
          patientFirstName: body.patient.firstName,
          patientLastName: body.patient.lastName,
          patientEmail: body.patient.email,
          patientPhone: body.patient.phone,
          appointmentDateTime: new Date(body.appointmentDetails.startTime),
          appointmentType: body.appointmentDetails.appointmentType,
        }
      );

      if (notificationId) {
        context.log(`Notification queued successfully: ${notificationId}`);
      } else {
        context.warn('Failed to queue notification - clinician will not be notified');
      }
    } catch (queueError) {
      // Log but don't fail the booking
      context.warn('Error queuing notification:', queueError);
    }

    context.log(`[PERF] Total booking time: ${Date.now() - bookingStartTime}ms`);

    // Step 4: Store booking session for analytics (fire and forget - don't await)
    storeBookingSession(
      appointment.id,
      patient.id,
      body.sessionData,
      context
    ).catch(err => context.warn('Failed to store booking session:', err));

    // Success response
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        appointmentId: appointment.id,
        patientId: patient.id,
        message: 'Booking created successfully',
      } as BookingResponse,
    };

  } catch (error) {
    context.error('Error creating booking:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    // Log detailed error info including Halaxy API response body if available
    const halaxyResponseBody = (error as { responseBody?: string })?.responseBody;
    const halaxyStatusCode = (error as { statusCode?: number })?.statusCode;
    
    context.error('Error details:', { 
      message: errorMessage, 
      stack: errorStack,
      halaxyStatusCode,
      halaxyResponseBody 
    });

    // Check for specific error types
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Booking service temporarily unavailable. Please try again later.',
        } as BookingResponse,
      };
    }

    // Check for practitioner configuration error
    if (errorMessage.includes('No practitioner configured')) {
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Booking service is not yet configured. Please contact support.',
        } as BookingResponse,
      };
    }

    // Check for database connection errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEOUT') || errorMessage.includes('SQL')) {
      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Service temporarily unavailable. Please try again later.',
        } as BookingResponse,
      };
    }

    return {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: false,
        error: 'Failed to create booking. Please try again or contact support.',
      } as BookingResponse,
    };
  }
}

// Register the function
app.http('createHalaxyBooking', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'create-halaxy-booking',
  handler: createHalaxyBooking,
});
