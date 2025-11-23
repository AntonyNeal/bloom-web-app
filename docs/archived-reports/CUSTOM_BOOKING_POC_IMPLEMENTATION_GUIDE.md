# Custom Booking System POC - Implementation Guide

**Status:** Ready to implement | **Phase:** 1 POC (50 hours)  
**Timeline:** 4 weeks (6 hrs/week) | **Decision Gate:** Week 4  
**Budget:** $1,000 | **Risk Level:** Controlled with mandatory stop gate

---

## EXECUTIVE SUMMARY

This implementation guide provides step-by-step code for building a **Proof of Concept** that adds Stripe payment processing to your existing Halaxy booking system, while maintaining your current webhook infrastructure and conversion tracking.

**What makes this pragmatic:**

- ✅ Leverages 40-58 hours of existing infrastructure (webhook handler, GCLID capture, conversion tracking)
- ✅ Uses Halaxy FHIR-R4 API (standard healthcare format, lower learning curve than proprietary APIs)
- ✅ Adds Stripe payment processing BEFORE appointment creation (money first, safe to implement)
- ✅ Maintains single-domain UX (modal overlay, no redirects)
- ✅ Passes GCLID through appointment metadata → webhook → database → conversion upload
- ✅ Explicit decision gate at 50 hours (all-or-nothing commitment to Phase 2)

**What's NOT in this scope:**

- ❌ Replacing Halaxy with custom booking backend (Phase 2+)
- ❌ Full admin dashboard or CRM features (Phase 2+)
- ❌ Comprehensive legal review or compliance audit (deferred technical debt)
- ❌ Multi-practitioner support (Phase 2+)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIFE PSYCHOLOGY WEBSITE                       │
│                  (React 18 + Azure Static Web Apps)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User lands on site → GCLID captured from URL                │
│     → Stored in sessionStorage (not URL-persisted, single flow) │
│                                                                   │
│  2. User clicks "Book Appointment"                              │
│     → Modal overlay opens (stays on domain)                      │
│     → BookingForm component handles 5 steps                      │
│                                                                   │
│  3. User selects time from TimeSlotCalendar (existing)          │
│     → Fetches availability from Halaxy (existing logic)         │
│                                                                   │
│  4. User enters payment info                                     │
│     → Stripe Elements embedded in modal (no redirect)           │
│     → Azure Function creates payment intent                      │
│     → Frontend confirms payment with Stripe                      │
│                                                                   │
│  5. Payment successful → Create Halaxy appointment              │
│     → Pass GCLID in appointment.meta.tag[0]                     │
│     → Azure Function calls Halaxy FHIR-R4 API                   │
│                                                                   │
│  6. Halaxy sends webhook                                         │
│     → Existing webhook handler processes                        │
│     → Extracts GCLID from appointment metadata                   │
│     → Updates database (halaxy_webhook_received = 1)            │
│     → Triggers GA4/Google Ads conversion tracking               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────┐
        │      HALAXY API (FHIR-R4)       │
        │  - Authentication: OAuth 2.0    │
        │  - Cost: $33 AUD/month          │
        │  - Webhook: Already configured  │
        └─────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────┐
        │     AZURE FUNCTIONS             │
        │  - create-payment-intent        │
        │  - create-halaxy-appointment    │
        │  - halaxy-webhook (enhanced)    │
        └─────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────┐
        │     AZURE SQL DATABASE          │
        │  - bookings table (existing)    │
        │  - gclid, stripe_*, conversions │
        └─────────────────────────────────┘
```

---

## PREREQUISITES & SETUP

### 1. Halaxy Credentials (Already have these)

```bash
HALAXY_CLIENT_ID=your_client_id
HALAXY_CLIENT_SECRET=your_client_secret
HALAXY_WEBHOOK_SECRET=your_webhook_secret  # Already configured
HALAXY_ORGANIZATION_ID=your_org_id         # Get from settings
```

### 2. Stripe Setup

```bash
# Get from Stripe Dashboard (https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_xxx              # Test mode for POC
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx            # For webhook validation
```

### 3. Azure SQL Schema Enhancement

Run this migration to add payment tracking columns:

```sql
-- Add to existing bookings table (if columns don't exist)
ALTER TABLE bookings
ADD COLUMN stripe_payment_intent_id VARCHAR(100) NULL,
    stripe_charge_id VARCHAR(100) NULL,
    payment_status VARCHAR(20) NULL, -- 'pending', 'completed', 'failed'
    gclid VARCHAR(200) NULL,
    halaxy_webhook_received BIT DEFAULT 0,
    webhook_received_at DATETIME2 NULL;

-- Add indexes for better query performance
CREATE INDEX idx_gclid ON bookings(gclid);
CREATE INDEX idx_stripe_payment_intent ON bookings(stripe_payment_intent_id);
CREATE INDEX idx_conversion_tracking ON bookings(gclid, webhook_received_at);
```

### 4. Environment Variables

Add to `.env` or Azure Static Web Apps configuration:

```bash
# Frontend (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Azure Functions (local.settings.json & Azure config)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
HALAXY_CLIENT_ID=xxx
HALAXY_CLIENT_SECRET=xxx
HALAXY_ORGANIZATION_ID=xxx
AZURE_SQL_CONNECTION_STRING=Server=xxx.database.windows.net;...
```

---

## PHASE 1 POC: IMPLEMENTATION (50 HOURS)

### Week 1-2: Halaxy API Integration (25 hours)

#### Step 1.1: Create Halaxy Token Manager (Shared utility)

**File:** `azure-functions-project/shared/halaxyAuth.ts`

```typescript
/**
 * Halaxy OAuth 2.0 Token Manager
 * Handles token acquisition and refresh (tokens expire every 15 minutes)
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

class HalaxyTokenManager {
  private static token: string | null = null;
  private static tokenExpiry: number | null = null;

  /**
   * Get valid access token (refresh if expired)
   */
  static async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token (valid for > 60 seconds)
    if (
      this.token &&
      this.tokenExpiry &&
      this.tokenExpiry > Date.now() + 60000
    ) {
      console.log('[HalaxyAuth] Using cached token');
      return this.token;
    }

    console.log('[HalaxyAuth] Requesting new token...');

    const tokenUrl = 'https://au-api.halaxy.com/main/oauth/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Life-Psychology-AUS/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.HALAXY_CLIENT_ID || '',
        client_secret: process.env.HALAXY_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Halaxy token request failed: ${response.status} ${error}`
      );
    }

    const data = (await response.json()) as TokenResponse;

    // Store token and set expiry (expires_in is in seconds)
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 60s buffer

    console.log(
      '[HalaxyAuth] Token acquired, expires in',
      data.expires_in,
      'seconds'
    );
    return this.token;
  }

  /**
   * Clear cached token (for testing/debugging)
   */
  static clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    console.log('[HalaxyAuth] Token cleared');
  }
}

export default HalaxyTokenManager;
```

#### Step 1.2: Create Halaxy Patient Service

**File:** `azure-functions-project/shared/halaxyPatient.ts`

```typescript
/**
 * Halaxy Patient Management (FHIR-R4)
 * Create or find existing patients
 */

import HalaxyTokenManager from './halaxyAuth';

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

interface PatientResource {
  resourceType: 'Patient';
  id: string;
  name: Array<{
    use: 'official' | 'usual' | 'temp';
    family: string;
    given: string[];
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'home' | 'work' | 'mobile';
  }>;
  birthDate?: string; // YYYY-MM-DD
}

/**
 * Create a patient in Halaxy
 * Returns patient ID for use in appointment creation
 */
export async function createHalaxyPatient(
  patientData: PatientData
): Promise<string> {
  try {
    const accessToken = await HalaxyTokenManager.getAccessToken();

    const patient: PatientResource = {
      resourceType: 'Patient',
      id: '', // Will be generated by Halaxy
      name: [
        {
          use: 'official',
          family: patientData.lastName,
          given: [patientData.firstName],
        },
      ],
      telecom: [],
    };

    // Add email
    if (patientData.email) {
      patient.telecom!.push({
        system: 'email',
        value: patientData.email,
        use: 'home',
      });
    }

    // Add phone
    if (patientData.phone) {
      patient.telecom!.push({
        system: 'phone',
        value: patientData.phone,
        use: 'mobile',
      });
    }

    // Add date of birth if provided (format: YYYY-MM-DD)
    if (patientData.dateOfBirth) {
      patient.birthDate = patientData.dateOfBirth;
    }

    console.log(
      '[HalaxyPatient] Creating patient:',
      patientData.firstName,
      patientData.lastName
    );

    const response = await fetch('https://au-api.halaxy.com/fhir/Patient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
        'User-Agent': 'Life-Psychology-AUS/1.0',
      },
      body: JSON.stringify(patient),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[HalaxyPatient] Create failed:', response.status, error);
      throw new Error(`Patient creation failed: ${response.status}`);
    }

    const created = (await response.json()) as PatientResource;

    console.log('[HalaxyPatient] Patient created:', created.id);
    return created.id;
  } catch (error) {
    console.error('[HalaxyPatient] Error creating patient:', error);
    throw error;
  }
}

/**
 * Search for existing patient by email
 * Halaxy may not support direct search, so this is a helper for future implementation
 */
export async function findPatientByEmail(
  email: string
): Promise<string | null> {
  try {
    const accessToken = await HalaxyTokenManager.getAccessToken();

    // Note: Halaxy search might be limited, this is a placeholder
    const response = await fetch(
      `https://au-api.halaxy.com/fhir/Patient?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
          'User-Agent': 'Life-Psychology-AUS/1.0',
        },
      }
    );

    if (response.ok) {
      const bundle = await response.json();
      if (bundle.entry && bundle.entry.length > 0) {
        return bundle.entry[0].resource.id;
      }
    }

    return null;
  } catch (error) {
    console.error('[HalaxyPatient] Error finding patient:', error);
    return null;
  }
}
```

#### Step 1.3: Create Halaxy Appointment Service

**File:** `azure-functions-project/shared/halaxyAppointment.ts`

```typescript
/**
 * Halaxy Appointment Management (FHIR-R4)
 * Create appointments in Halaxy with GCLID metadata
 */

import HalaxyTokenManager from './halaxyAuth';

interface AppointmentInput {
  patientId: string;
  patientName: string;
  practitionerId: string; // e.g., "Zoe" from Halaxy
  startDateTime: Date;
  endDateTime: Date;
  appointmentType: string; // e.g., "Initial Consultation"
  gclid?: string; // Google Click ID for attribution
  paymentIntentId?: string;
  notes?: string;
}

interface AppointmentResource {
  resourceType: 'Appointment';
  status:
    | 'proposed'
    | 'pending'
    | 'booked'
    | 'arrived'
    | 'fulfilled'
    | 'cancelled'
    | 'noshow'
    | 'entered-in-error'
    | 'checked-in'
    | 'waitlist';
  appointmentType: {
    coding: Array<{
      system: string;
      code: string;
    }>;
  };
  description: string;
  start: string; // ISO 8601
  end: string;
  participant: Array<{
    actor: {
      reference: string;
      display: string;
    };
    required: 'required' | 'optional';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  meta?: {
    tag?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
}

/**
 * Create appointment in Halaxy with metadata for GCLID tracking
 */
export async function createHalaxyAppointment(
  input: AppointmentInput
): Promise<string> {
  try {
    const accessToken = await HalaxyTokenManager.getAccessToken();

    const appointment: AppointmentResource = {
      resourceType: 'Appointment',
      status: 'booked',
      appointmentType: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0276',
            code: 'ROUTINE',
          },
        ],
      },
      description: input.appointmentType,
      start: input.startDateTime.toISOString(),
      end: input.endDateTime.toISOString(),
      participant: [
        // Practitioner
        {
          actor: {
            reference: `Practitioner/${input.practitionerId}`,
            display: input.practitionerId, // Use practitioner name/ID from Halaxy
          },
          required: 'required',
          status: 'accepted',
        },
        // Patient
        {
          actor: {
            reference: `Patient/${input.patientId}`,
            display: input.patientName,
          },
          required: 'required',
          status: 'accepted',
        },
      ],
    };

    // Add metadata for attribution tracking
    if (input.gclid || input.paymentIntentId) {
      appointment.meta = {
        tag: [],
      };

      if (input.gclid) {
        appointment.meta.tag!.push({
          system: 'https://life-psychology.com.au/attribution',
          code: 'gclid',
          display: input.gclid,
        });
      }

      if (input.paymentIntentId) {
        appointment.meta.tag!.push({
          system: 'https://life-psychology.com.au/payments',
          code: 'stripe_payment_intent',
          display: input.paymentIntentId,
        });
      }
    }

    console.log('[HalaxyAppointment] Creating appointment:', {
      patient: input.patientName,
      practitioner: input.practitionerId,
      start: input.startDateTime.toISOString(),
      gclid: input.gclid ? '***' : 'none',
    });

    const response = await fetch('https://au-api.halaxy.com/fhir/Appointment', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
        'User-Agent': 'Life-Psychology-AUS/1.0',
      },
      body: JSON.stringify(appointment),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        '[HalaxyAppointment] Create failed:',
        response.status,
        error
      );
      throw new Error(`Appointment creation failed: ${response.status}`);
    }

    const created = (await response.json()) as AppointmentResource;

    console.log(
      '[HalaxyAppointment] Appointment created:',
      created.id || created.resourceType
    );
    return created.id || created.resourceType;
  } catch (error) {
    console.error('[HalaxyAppointment] Error creating appointment:', error);
    throw error;
  }
}

/**
 * Fetch practitioner list (for UI dropdown in future)
 */
export async function fetchPractitioners(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    const accessToken = await HalaxyTokenManager.getAccessToken();

    const response = await fetch(
      'https://au-api.halaxy.com/fhir/Practitioner',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
          'User-Agent': 'Life-Psychology-AUS/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Practitioners fetch failed: ${response.status}`);
    }

    const bundle = await response.json();

    if (bundle.entry) {
      return bundle.entry.map((entry: any) => ({
        id: entry.resource.id,
        name: entry.resource.name?.[0]?.text || 'Unknown',
      }));
    }

    return [];
  } catch (error) {
    console.error('[HalaxyAppointment] Error fetching practitioners:', error);
    return [];
  }
}
```

#### Step 1.4: Create Halaxy Appointment Azure Function

**File:** `azure-functions-project/create-halaxy-appointment/index.ts`

```typescript
/**
 * Azure Function: Create Halaxy Appointment
 * Called after payment confirmation
 *
 * Input: { patientData, appointmentDetails, paymentIntentId, gclid }
 * Output: { success: boolean, appointmentId?: string, error?: string }
 */

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import {
  createHalaxyPatient,
  findPatientByEmail,
} from '../shared/halaxyPatient';
import { createHalaxyAppointment } from '../shared/halaxyAppointment';
import { executeQuery } from '../shared/db';

interface RequestBody {
  patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
  };
  appointmentDetails: {
    startTime: string; // ISO 8601
    endTime: string;
    appointmentType: string;
  };
  paymentIntentId: string;
  gclid?: string;
}

interface ResponseBody {
  success: boolean;
  appointmentId?: string;
  patientId?: string;
  error?: string;
  message?: string;
}

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  context.log('create-halaxy-appointment function triggered');

  const response: ResponseBody = { success: false };

  try {
    // Validate request
    if (req.method !== 'POST') {
      context.res = { status: 405, body: { error: 'Method not allowed' } };
      return;
    }

    const body = req.body as RequestBody;

    if (
      !body.patientData ||
      !body.appointmentDetails ||
      !body.paymentIntentId
    ) {
      context.res = {
        status: 400,
        body: {
          error:
            'Missing required fields: patientData, appointmentDetails, paymentIntentId',
        },
      };
      return;
    }

    console.log('[CreateAppointment] Request received:', {
      patient: `${body.patientData.firstName} ${body.patientData.lastName}`,
      email: body.patientData.email,
      paymentIntent: body.paymentIntentId,
      gclid: body.gclid ? '***' : 'none',
    });

    // Step 1: Check if patient already exists in Halaxy
    let patientId: string | null = null;

    try {
      patientId = await findPatientByEmail(body.patientData.email);
      if (patientId) {
        console.log('[CreateAppointment] Found existing patient:', patientId);
      }
    } catch (error) {
      console.log(
        '[CreateAppointment] Patient search not available, creating new'
      );
    }

    // Step 2: Create new patient if not found
    if (!patientId) {
      patientId = await createHalaxyPatient(body.patientData);
      console.log('[CreateAppointment] Created new patient:', patientId);
    }

    // Step 3: Create appointment in Halaxy
    const appointmentId = await createHalaxyAppointment({
      patientId,
      patientName: `${body.patientData.firstName} ${body.patientData.lastName}`,
      practitionerId: 'Zoe', // TODO: Make this configurable/dynamic
      startDateTime: new Date(body.appointmentDetails.startTime),
      endDateTime: new Date(body.appointmentDetails.endTime),
      appointmentType: body.appointmentDetails.appointmentType,
      gclid: body.gclid,
      paymentIntentId: body.paymentIntentId,
    });

    // Step 4: Store booking in database
    const bookingId = await storeBookingRecord({
      patientName: `${body.patientData.firstName} ${body.patientData.lastName}`,
      patientEmail: body.patientData.email,
      patientPhone: body.patientData.phone || '',
      appointmentDateTime: body.appointmentDetails.startTime,
      appointmentType: body.appointmentDetails.appointmentType,
      stripePaymentIntentId: body.paymentIntentId,
      gclid: body.gclid || '',
      halaxyAppointmentId: appointmentId,
    });

    console.log('[CreateAppointment] Booking stored:', bookingId);

    response.success = true;
    response.appointmentId = appointmentId;
    response.patientId = patientId;
    response.message = 'Appointment created successfully';

    context.res = {
      status: 200,
      body: response,
    };
  } catch (error) {
    console.error('[CreateAppointment] Error:', error);

    response.error = error instanceof Error ? error.message : 'Unknown error';
    context.res = {
      status: 500,
      body: response,
    };
  }
};

/**
 * Store booking record in Azure SQL
 */
async function storeBookingRecord(data: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDateTime: string;
  appointmentType: string;
  stripePaymentIntentId: string;
  gclid: string;
  halaxyAppointmentId: string;
}): Promise<string> {
  const query = `
    INSERT INTO bookings (
      patient_name,
      patient_email,
      patient_phone,
      appointment_datetime,
      appointment_type,
      stripe_payment_intent_id,
      gclid,
      halaxy_appointment_id,
      payment_status,
      created_at
    ) VALUES (
      @patient_name,
      @patient_email,
      @patient_phone,
      @appointment_datetime,
      @appointment_type,
      @stripe_payment_intent_id,
      @gclid,
      @halaxy_appointment_id,
      'completed',
      GETDATE()
    )
  `;

  const result = await executeQuery(query, {
    patient_name: data.patientName,
    patient_email: data.patientEmail,
    patient_phone: data.patientPhone,
    appointment_datetime: data.appointmentDateTime,
    appointment_type: data.appointmentType,
    stripe_payment_intent_id: data.stripePaymentIntentId,
    gclid: data.gclid,
    halaxy_appointment_id: data.halaxyAppointmentId,
  });

  // Assuming result has some ID property or use the appointment ID
  return data.halaxyAppointmentId;
}

export default httpTrigger;
```

#### Step 1.5: Test Halaxy Integration

**File:** `azure-functions-project/__tests__/halaxy-integration.test.ts`

```typescript
/**
 * Test Halaxy API integration in POC
 * Run: npm test -- halaxy-integration
 */

import HalaxyTokenManager from '../shared/halaxyAuth';
import { createHalaxyPatient } from '../shared/halaxyPatient';
import { createHalaxyAppointment } from '../shared/halaxyAppointment';

describe('Halaxy Integration (POC)', () => {
  // Set timeout for API calls
  jest.setTimeout(30000);

  test('Should obtain OAuth token', async () => {
    try {
      const token = await HalaxyTokenManager.getAccessToken();
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      console.log('✅ Token obtained:', token.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Token request failed:', error);
      throw error;
    }
  });

  test('Should create patient in Halaxy', async () => {
    try {
      const patientId = await createHalaxyPatient({
        firstName: 'Test',
        lastName: 'Patient',
        email: 'test@example.com',
        phone: '0412345678',
      });
      expect(patientId).toBeDefined();
      console.log('✅ Patient created:', patientId);
    } catch (error) {
      console.error('❌ Patient creation failed:', error);
      throw error;
    }
  });

  test('Should create appointment in Halaxy', async () => {
    try {
      const patientId = await createHalaxyPatient({
        firstName: 'Test',
        lastName: 'Appointment',
        email: 'appt@example.com',
      });

      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 2);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const appointmentId = await createHalaxyAppointment({
        patientId,
        patientName: 'Test Appointment',
        practitionerId: 'Zoe',
        startDateTime: startTime,
        endDateTime: endTime,
        appointmentType: 'Initial Consultation',
        gclid: 'test-gclid-12345',
        paymentIntentId: 'pi_test_12345',
      });

      expect(appointmentId).toBeDefined();
      console.log('✅ Appointment created:', appointmentId);
    } catch (error) {
      console.error('❌ Appointment creation failed:', error);
      throw error;
    }
  });
});
```

---

### Week 3-4: Payment & Attribution (25 hours)

#### Step 2.1: Create Payment Intent Azure Function

**File:** `azure-functions-project/create-payment-intent/index.ts`

```typescript
/**
 * Azure Function: Create Stripe Payment Intent
 * Called by frontend before appointment is created
 *
 * Input: { amount: number, appointmentType: string, gclid?: string }
 * Output: { clientSecret: string, paymentIntentId: string }
 */

import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import Stripe from 'stripe';

interface RequestBody {
  amount: number; // In AUD, e.g., 250
  appointmentType: string; // "Initial Consultation", "Follow-up", etc.
  gclid?: string; // Google Click ID
}

interface ResponseBody {
  clientSecret: string;
  paymentIntentId: string;
  error?: string;
}

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  context.log('create-payment-intent function triggered');

  try {
    if (req.method !== 'POST') {
      context.res = { status: 405, body: { error: 'Method not allowed' } };
      return;
    }

    const body = req.body as RequestBody;

    if (!body.amount || body.amount < 1) {
      context.res = {
        status: 400,
        body: { error: 'Invalid amount' },
      };
      return;
    }

    // Initialize Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-10-28.acacia', // Latest stable API version
    });

    console.log('[PaymentIntent] Creating payment intent:', {
      amount: body.amount,
      appointmentType: body.appointmentType,
      gclid: body.gclid ? '***' : 'none',
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(body.amount * 100), // Convert to cents
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        appointmentType: body.appointmentType,
        gclid: body.gclid || 'none',
        service: 'psychology_consultation',
      },
      description: `Psychology Consultation - ${body.appointmentType}`,
    });

    console.log('[PaymentIntent] Intent created:', paymentIntent.id);

    const response: ResponseBody = {
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
    };

    context.res = {
      status: 200,
      body: response,
    };
  } catch (error) {
    console.error('[PaymentIntent] Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    context.res = {
      status: 500,
      body: {
        clientSecret: '',
        paymentIntentId: '',
        error: errorMessage,
      },
    };
  }
};

export default httpTrigger;
```

#### Step 2.2: Enhance BookingForm with Payment

**File:** `src/components/BookingForm.tsx` - Updated (add to existing form)

```tsx
// Add this import at top
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Add this near top of component
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

// Add new component for payment step
interface PaymentStepProps {
  amount: number;
  appointmentType: string;
  onConfirm: (paymentIntentId: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  amount,
  appointmentType,
  onConfirm,
  onBack,
  loading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Fetch payment intent on mount
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_CREATE_PAYMENT_INTENT_URL ||
            '/api/create-payment-intent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              appointmentType,
              gclid: sessionStorage.getItem('lpa_gclid') || undefined,
            }),
          }
        );

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError('Failed to initialize payment');
        }
      } catch (err) {
        setError('Payment initialization failed');
      }
    };

    fetchPaymentIntent();
  }, [amount, appointmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Get CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card information not provided');
        setProcessing(false);
        return;
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {}, // User details collected earlier
          },
        }
      );

      if (error) {
        setError(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful - proceed to appointment creation
        await onConfirm(paymentIntent.id);
      } else if (paymentIntent?.status === 'processing') {
        setError('Payment processing. Please wait...');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">Secure Payment</h3>
        <p className="text-blue-800 mt-2">
          Powered by Stripe • PCI Compliant • Your information is secure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Card Information
          </label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Appointment Cost:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${amount.toFixed(2)} AUD
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Your payment is secure and encrypted
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={processing || loading}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={processing || loading || !stripe}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing || loading ? (
              <>
                <span className="animate-spin">⏳</span> Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// In main BookingForm component, update form flow:
// Add 'payment' step to the state
const [step, setStep] = useState<
  'details' | 'datetime' | 'payment' | 'confirm' | 'success' | 'error'
>('details');

// Update flow to include payment
const handleDateTimeNext = () => {
  if (validateDateTimeStep()) {
    // Capture GCLID before moving to payment
    const gclid = new URLSearchParams(window.location.search).get('gclid');
    if (gclid) {
      sessionStorage.setItem('lpa_gclid', gclid);
    }
    setStep('payment');
  }
};

// Add payment confirmation handler
const handlePaymentConfirm = async (paymentIntentId: string) => {
  setStep('confirm');
  // Store for later use
  sessionStorage.setItem('stripe_payment_intent_id', paymentIntentId);
};

// Render payment step
{
  step === 'payment' && (
    <Elements stripe={stripePromise}>
      <PaymentStep
        amount={250} // TODO: Make dynamic based on appointment type
        appointmentType={appointmentType}
        onConfirm={handlePaymentConfirm}
        onBack={() => setStep('datetime')}
        loading={loading}
      />
    </Elements>
  );
}
```

#### Step 2.3: Update Webhook Handler for GCLID Extraction

**File:** `azure-functions-project/halaxy-webhook/index.js` - Enhanced

```javascript
// Add this function after sendGA4Event function

/**
 * Extract GCLID from appointment metadata
 */
function extractGCLIDFromAppointment(appointment) {
  try {
    if (!appointment.meta || !appointment.meta.tag) {
      return null;
    }

    // FHIR-R4 format: meta.tag is array of coding objects
    const gclidTag = appointment.meta.tag.find(
      (tag) =>
        tag.system === 'https://life-psychology.com.au/attribution' &&
        tag.code === 'gclid'
    );

    if (gclidTag && gclidTag.display) {
      console.log(
        '[HalaxyWebhook] GCLID extracted from appointment:',
        gclidTag.display
      );
      return gclidTag.display;
    }

    return null;
  } catch (error) {
    console.error('[HalaxyWebhook] Error extracting GCLID:', error);
    return null;
  }
}

// Update webhook handler to extract and store GCLID:
// In the main handler function, after appointment ID extraction, add:

if (!appointmentId) {
  context.log.warn('No appointment ID found in payload');
  await logWebhookError(
    bookingSessionId,
    'NO_APPOINTMENT_ID',
    'appointment_id not found in payload',
    payload
  );
  return;
}

// NEW: Extract GCLID from appointment metadata
const gclid = extractGCLIDFromAppointment(payload);

// ... existing code ...

// When updating booking_sessions, also update bookings table with GCLID:
if (gclid) {
  const updateBookingsQuery = `
    UPDATE bookings
    SET gclid = @gclid,
        halaxy_webhook_received = 1,
        webhook_received_at = GETDATE()
    WHERE stripe_payment_intent_id IN (
      SELECT payment_intent_id FROM booking_sessions WHERE booking_session_id = @booking_session_id
    )
  `;

  try {
    await executeQuery(updateBookingsQuery, {
      gclid: gclid,
      booking_session_id: bookingSessionId,
    });
    context.log(`✅ GCLID stored: ${gclid}`);
  } catch (error) {
    context.log.warn('Failed to update booking with GCLID:', error);
  }
}
```

---

## PHASE 1 POC GATE VERIFICATION (4 hours)

### Success Criteria Checklist

All 5 criteria MUST pass. If any fails, STOP and pivot to optimization.

#### Criterion 1: Halaxy Creates Appointments ✅

```bash
# Test endpoint:
POST /api/create-halaxy-appointment
{
  "patientData": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "0412345678"
  },
  "appointmentDetails": {
    "startTime": "2025-11-13T14:00:00Z",
    "endTime": "2025-11-13T15:00:00Z",
    "appointmentType": "Initial Consultation"
  },
  "paymentIntentId": "pi_test_12345",
  "gclid": "CjwKCAiAw-D_BxBEEiwA9Oj4IWJKdGC3rXy...test"
}

# Expected: 200 OK with appointmentId
# Verify: Check Halaxy admin that appointment was created
```

#### Criterion 2: Stripe Processes Payments ✅

```bash
# Test payment intent creation:
POST /api/create-payment-intent
{
  "amount": 250,
  "appointmentType": "Initial Consultation",
  "gclid": "test-gclid"
}

# Expected: 200 OK with clientSecret
# Verify: Process test card 4242 4242 4242 4242, exp 12/25, CVC 123
#         Confirm status "succeeded" in Stripe Dashboard
```

#### Criterion 3: GCLID Persists ✅

```sql
-- After end-to-end booking:
SELECT gclid, stripe_payment_intent_id, halaxy_webhook_received
FROM bookings
WHERE created_at > DATEADD(hour, -1, GETDATE())
ORDER BY created_at DESC;

-- Expected: GCLID value populated, halaxy_webhook_received = 1
```

#### Criterion 4: Webhook Confirms Creation ✅

```sql
-- Check webhook logs:
SELECT status, booking_session_id, error_message
FROM webhook_logs
WHERE status IN ('SUCCESS', 'ALREADY_PROCESSED')
ORDER BY created_at DESC;

-- Expected: Latest webhook has status = SUCCESS
```

#### Criterion 5: End-to-End Flow ✅

```
1. User lands on site → GCLID captured ✅
2. Clicks "Book Now" → Modal opens ✅
3. Fills form → Selects time ✅
4. Enters payment info → Payment processes ✅
5. Halaxy appointment created ✅
6. Webhook fires → GCLID extracted ✅
7. Database updated → Conversion tracked ✅
```

### Manual Test Script

```bash
#!/bin/bash
# POC_TEST.sh - Manual testing for Phase 1 gate

echo "🧪 PHASE 1 POC VERIFICATION"
echo "=============================="

# Test 1: Create payment intent
echo "Test 1: Stripe Payment Intent..."
curl -X POST \
  http://localhost:7071/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250,
    "appointmentType": "Initial Consultation"
  }'

echo -e "\n\nTest 2: Create Halaxy Appointment..."
curl -X POST \
  http://localhost:7071/api/create-halaxy-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "patientData": {
      "firstName": "POC",
      "lastName": "Test",
      "email": "poc@test.com"
    },
    "appointmentDetails": {
      "startTime": "2025-11-13T14:00:00Z",
      "endTime": "2025-11-13T15:00:00Z",
      "appointmentType": "Initial Consultation"
    },
    "paymentIntentId": "pi_poc_test_12345",
    "gclid": "poc-test-gclid-xyz"
  }'

echo -e "\n\n✅ All endpoints tested. Check responses above."
```

---

## DECISION GATE: MANDATORY STOP AT 50 HOURS

If ANY of the 5 success criteria failed:

- **STOP custom development**
- **Switch to Alternative:** Hire conversion tracking specialist for $800-1,500 to optimize existing Halaxy tracking
- **Timeline:** 2-4 weeks to achieve 70-85% attribution accuracy with minimal development risk
- **Real-time sync becomes future project** (not dependent on custom booking system)

If ALL criteria passed:

- **PROCEED to Phase 2** (MVP, weeks 5-8)
- **Meeting scheduled:** Review with Antony, confirm budget/timeline commitment for Phase 2
- **Next sprint:** Brand styling, error handling, production deployment

---

## NEXT: PHASE 2 (IF GATE PASSED)

### Week 5-6: Polish & Tracking Layer 1

- Brand styling (Life Psychology colors/fonts)
- Healthcare-specific error messages
- Application Insights logging
- Enhanced Conversions (GTM setup)

### Week 7-8: Conversion Tracking Layers 2-3

- Offline Google Ads API integration
- GA4 event architecture (begin_checkout → purchase)
- Production deployment
- Handoff documentation

---

## FILES TO CREATE/MODIFY

### Phase 1 Implementation Files

```
NEW FILES:
✓ azure-functions-project/shared/halaxyAuth.ts
✓ azure-functions-project/shared/halaxyPatient.ts
✓ azure-functions-project/shared/halaxyAppointment.ts
✓ azure-functions-project/create-halaxy-appointment/index.ts
✓ azure-functions-project/create-payment-intent/index.ts
✓ azure-functions-project/__tests__/halaxy-integration.test.ts

MODIFY:
✓ src/components/BookingForm.tsx (add PaymentStep component)
✓ src/components/BookingForm.tsx (update form flow to include payment)
✓ azure-functions-project/halaxy-webhook/index.js (add GCLID extraction)
✓ package.json (add @stripe/stripe-js if not present)
✓ .env (add Stripe keys)

NO CHANGES NEEDED:
✓ TimeSlotCalendar.tsx
✓ halaxyAvailability.ts
✓ halaxyClient.ts
✓ conversionTracking.ts
✓ Webhook infrastructure (enhance only)
```

### Environment Variables

```bash
# .env / Azure config
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_CREATE_PAYMENT_INTENT_URL=/api/create-payment-intent

# Azure Functions
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
HALAXY_CLIENT_ID=xxx
HALAXY_CLIENT_SECRET=xxx
HALAXY_ORGANIZATION_ID=xxx
AZURE_SQL_CONNECTION_STRING=xxx
```

---

## COMMITMENT SUMMARY

**Phase 1 (50 hours):**

- ✅ Pragmatic, leverages existing infrastructure
- ✅ Explicit decision gate (all-or-nothing)
- ✅ Clear stopping point before major investment
- ✅ Uses test Stripe keys (no financial risk)

**Success Criteria:**

- Halaxy creates appointments via FHIR-R4 API
- Stripe processes test payments
- GCLID persists through entire flow
- Webhook extracts GCLID from metadata
- End-to-end booking completes

**If Phase 1 Fails:**

- Pivot to tracking optimization ($800-1,500, 2-4 weeks)
- Real-time sync planned for future
- Minimal sunk costs

**If Phase 1 Succeeds:**

- Continue to Phase 2 (weeks 5-8, 50 hours)
- Polish + production deployment
- Full conversion tracking architecture

---

## QUICK REFERENCE

| Component                      | File                                   | Hours   | Status    |
| ------------------------------ | -------------------------------------- | ------- | --------- |
| Halaxy Token Manager           | `shared/halaxyAuth.ts`                 | 3       | Ready     |
| Halaxy Patient Service         | `shared/halaxyPatient.ts`              | 4       | Ready     |
| Halaxy Appointment Service     | `shared/halaxyAppointment.ts`          | 4       | Ready     |
| Create Appointment Function    | `create-halaxy-appointment/index.ts`   | 6       | Ready     |
| Create Payment Intent Function | `create-payment-intent/index.ts`       | 3       | Ready     |
| Booking Form Enhancement       | `BookingForm.tsx` (payment step)       | 8       | Ready     |
| Webhook Enhancement            | `halaxy-webhook/index.js` (GCLID)      | 3       | Ready     |
| Integration Tests              | `__tests__/halaxy-integration.test.ts` | 4       | Ready     |
| Manual Testing & Verification  | N/A                                    | 6       | Ready     |
| **TOTAL**                      |                                        | **~50** | **Ready** |

---

This implementation provides a clear, pragmatic path forward with explicit stopping points and risk management built in.

Ready to begin Phase 1? Let me know which component to start with.
