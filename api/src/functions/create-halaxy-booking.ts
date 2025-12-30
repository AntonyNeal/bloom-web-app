/**
 * Create Halaxy Booking Function
 *
 * Azure Function to create appointments in Halaxy from the website.
 * Creates or finds the patient, then creates the appointment.
 * Stores booking session data for analytics tracking.
 * Sends email and SMS notification to clinician when booking is created.
 */
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { getHalaxyClient } from '../services/halaxy/client';
import { getDbConnection } from '../services/database';
import { sendClinicianBookingNotification } from '../services/email';
import { sendClinicianBookingSms } from '../services/sms';
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

interface PractitionerContact {
  email: string;
  firstName: string;
  phone?: string;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
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
 * Get practitioner contact info directly from Halaxy API
 * First fetches PractitionerRole to get the Practitioner reference, then fetches Practitioner details
 */
async function getPractitionerContact(
  practitionerId: string,
  halaxyClient: ReturnType<typeof getHalaxyClient>,
  context: InvocationContext
): Promise<PractitionerContact | null> {
  try {
    // First, try to get the PractitionerRole ID from env (more reliable)
    const practitionerRoleId = process.env.HALAXY_PRACTITIONER_ROLE_ID;
    
    let actualPractitionerId: string | undefined;
    
    if (practitionerRoleId) {
      // Fetch PractitionerRole to get the actual Practitioner reference
      context.log(`Fetching PractitionerRole ${practitionerRoleId} from Halaxy API...`);
      try {
        const practitionerRole = await halaxyClient.getPractitionerRole(practitionerRoleId);
        // Extract practitioner ID from reference
        // Can be: "Practitioner/PR-123456" or full URL like "https://au-api.halaxy.com/main/PR-123456"
        const practitionerRef = practitionerRole.practitioner?.reference;
        if (practitionerRef) {
          // Extract PR-XXXXX from the reference (handles both formats)
          const prMatch = practitionerRef.match(/PR-\d+/);
          if (prMatch) {
            actualPractitionerId = prMatch[0];
            context.log(`Got practitioner reference from role: ${actualPractitionerId}`);
          } else {
            context.warn(`Could not parse practitioner reference: ${practitionerRef}`);
          }
        }
      } catch (roleError) {
        context.warn('Failed to fetch PractitionerRole, falling back to direct practitioner fetch');
      }
    }
    
    // If we couldn't get practitioner ID from role, try the provided ID with PR- prefix
    if (!actualPractitionerId) {
      actualPractitionerId = practitionerId.startsWith('PR-') 
        ? practitionerId 
        : `PR-${practitionerId}`;
    }
    
    context.log(`Fetching practitioner ${actualPractitionerId} from Halaxy API...`);
    const practitioner = await halaxyClient.getPractitioner(actualPractitionerId);
    
    if (!practitioner) {
      context.warn(`Practitioner not found in Halaxy: ${actualPractitionerId}`);
      return null;
    }

    // Extract name
    const name = practitioner.name?.[0];
    const firstName = name?.given?.[0] || 'Practitioner';

    // Extract email and phone from telecom
    let email: string | undefined;
    let phone: string | undefined;

    for (const contact of practitioner.telecom || []) {
      if (contact.system === 'email' && !email) {
        email = contact.value;
      }
      if (contact.system === 'phone' && !phone) {
        // Prefer mobile, then work, then any
        if (contact.use === 'mobile' || !phone) {
          phone = contact.value;
        }
      }
    }

    if (!email) {
      context.warn(`No email found for practitioner ${actualPractitionerId}`);
      return null;
    }

    context.log(`Found practitioner: ${firstName}, email: ${email ? '***' : 'none'}, phone: ${phone ? '***' : 'none'}`);

    return {
      email,
      firstName,
      phone,
      // Default to enabled - can be overridden by database preferences if needed
      smsNotificationsEnabled: true,
      emailNotificationsEnabled: true,
    };
  } catch (error) {
    context.error('Failed to get practitioner from Halaxy:', error);
    return null;
  }
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

    // Step 3: Send SMS notification to clinician (MANDATORY - booking fails if SMS fails)
    let smsSent = false;
    let smsError: string | undefined;
    
    try {
      const practitionerContact = await getPractitionerContact(practitionerId, halaxyClient, context);
      
      if (!practitionerContact) {
        smsError = 'Could not retrieve practitioner contact information';
        context.error(smsError);
      } else if (!practitionerContact.phone) {
        smsError = 'Practitioner has no phone number configured';
        context.error(smsError);
      } else {
        context.log(`Sending SMS notification to practitioner...`);
        const smsResult = await sendClinicianBookingSms({
          clinicianPhone: practitionerContact.phone,
          clinicianFirstName: practitionerContact.firstName,
          patientFirstName: body.patient.firstName,
          patientLastName: body.patient.lastName,
          appointmentDateTime: new Date(body.appointmentDetails.startTime),
          appointmentType: body.appointmentDetails.appointmentType,
        });

        if (smsResult.success) {
          context.log('Clinician SMS notification sent successfully');
          smsSent = true;
        } else {
          smsError = smsResult.error || 'SMS send failed';
          context.error('SMS notification failed:', smsError);
        }
      }
    } catch (notifyError) {
      smsError = notifyError instanceof Error ? notifyError.message : 'Unknown notification error';
      context.error('Error sending SMS notification:', notifyError);
    }

    // If SMS failed, cancel the appointment and return error
    if (!smsSent) {
      context.error(`SMS notification failed - cancelling appointment ${appointment.id}`);
      
      try {
        await halaxyClient.cancelAppointment(appointment.id, 'SMS notification to clinician failed');
        context.log(`Appointment ${appointment.id} cancelled successfully`);
      } catch (cancelError) {
        context.error('Failed to cancel appointment after SMS failure:', cancelError);
      }

      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Unable to complete booking - please try again or contact us directly',
        } as BookingResponse,
      };
    }

    // Step 4: Send email notification to clinician (MANDATORY)
    let emailSent = false;
    let emailError: string | undefined;

    try {
      const practitionerContact = await getPractitionerContact(practitionerId, halaxyClient, context);
      
      if (!practitionerContact) {
        emailError = 'Could not retrieve practitioner contact information';
        context.error(emailError);
      } else if (!practitionerContact.email) {
        emailError = 'Practitioner has no email configured';
        context.error(emailError);
      } else {
        context.log(`Sending email notification to: ${practitionerContact.email}`);
        const emailResult = await sendClinicianBookingNotification({
          practitionerEmail: practitionerContact.email,
          practitionerFirstName: practitionerContact.firstName,
          patientFirstName: body.patient.firstName,
          patientLastName: body.patient.lastName,
          patientEmail: body.patient.email,
          patientPhone: body.patient.phone,
          appointmentDateTime: new Date(body.appointmentDetails.startTime),
          appointmentType: body.appointmentDetails.appointmentType,
        });

        if (emailResult.success) {
          context.log('Clinician email notification sent successfully');
          emailSent = true;
        } else {
          emailError = emailResult.error || 'Email send failed';
          context.error('Email notification failed:', emailError);
        }
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : 'Unknown email error';
      context.error('Error sending email notification:', emailErr);
    }

    // If email failed, cancel the appointment and return error
    if (!emailSent) {
      context.error(`Email notification failed - cancelling appointment ${appointment.id}`);
      
      try {
        await halaxyClient.cancelAppointment(appointment.id, 'Email notification to clinician failed');
        context.log(`Appointment ${appointment.id} cancelled successfully`);
      } catch (cancelError) {
        context.error('Failed to cancel appointment after email failure:', cancelError);
      }

      return {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        jsonBody: {
          success: false,
          error: 'Unable to complete booking - please try again or contact us directly',
        } as BookingResponse,
      };
    }

    context.log(`[PERF] Total booking time: ${Date.now() - bookingStartTime}ms`);

    // Step 5: Store booking session for analytics (fire and forget - don't await)
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
