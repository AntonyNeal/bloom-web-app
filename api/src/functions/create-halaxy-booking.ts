/**
 * Create Halaxy Booking Function
 *
 * Azure Function to create appointments in Halaxy from the website.
 * Creates or finds the patient, then creates the appointment.
 * Stores booking session data for analytics tracking.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { getDbConnection } from '../services/database';
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
    return envPractitionerId;
  }

  // Fall back to first active practitioner in database
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query<{ halaxy_practitioner_id: string }>(`
      SELECT TOP 1 halaxy_practitioner_id 
      FROM practitioners 
      WHERE is_active = 1
      ORDER BY created_at
    `);

    if (result.recordset.length > 0) {
      return result.recordset[0].halaxy_practitioner_id;
    }
  } catch (error) {
    context.warn('Failed to get practitioner from database:', error);
  }

  throw new Error('No practitioner configured for bookings');
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

    // Step 2: Create appointment
    context.log('Creating appointment in Halaxy...');
    const appointment = await halaxyClient.createAppointment({
      patientId: patient.id,
      practitionerId: practitionerId,
      start: body.appointmentDetails.startTime,
      end: body.appointmentDetails.endTime,
      description: body.appointmentDetails.notes,
    });

    context.log(`Appointment created: ${appointment.id}`);

    // Step 3: Store booking session for analytics
    const bookingSessionId = await storeBookingSession(
      appointment.id,
      patient.id,
      body.sessionData,
      context
    );

    // Success response
    return {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        appointmentId: appointment.id,
        patientId: patient.id,
        bookingSessionId: bookingSessionId || undefined,
        message: 'Booking created successfully',
      } as BookingResponse,
    };

  } catch (error) {
    context.error('Error creating booking:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
