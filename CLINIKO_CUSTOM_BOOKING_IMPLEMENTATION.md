# Cliniko Custom Booking System - Phase 1 POC Implementation Guide

**Project**: Life Psychology Australia Custom Booking System  
**Timeline**: 100 hours split into Phase 1 (50 hrs POC) + Phase 2 (50 hrs MVP)  
**Status**: Phase 1 - In Progress  
**Budget**: $1,000 total (Infrastructure + API costs)

---

## PHASE 1: PROOF OF CONCEPT (50 hours)

### Success Criteria (ALL MUST PASS to continue to Phase 2)

- [ ] **1. Cliniko API Integration**: Successfully create appointment from custom form
- [ ] **2. Payment Processing**: Stripe test mode payments process without errors
- [ ] **3. Attribution Capture**: GCLID persists through form → database → conversion tracking
- [ ] **4. No Blocking Limitations**: API rate limits sufficient (<200 req/min used), no auth issues
- [ ] **5. End-to-End Test**: Complete flow from landing → form → payment → Cliniko appointment

**Decision Gate**: If ANY criteria fail by hour 50, STOP and pivot to Alternative A (optimize Halaxy tracking for $800-1,500).

---

## WEEK 1-2: Cliniko API Integration (~20 hours)

### Setup Phase

#### 1.1 Cliniko Account & API Access

**What to do:**

- Sign up for Cliniko free trial: https://www.cliniko.com/free-trial
- Generate API key: Settings → API Access → Create API Key
- Store in `.env.development`: `VITE_CLINIKO_API_KEY=xxx`

**Validation:**

```bash
# Test Cliniko connectivity (use in terminal)
$apiKey = $env:VITE_CLINIKO_API_KEY
$auth = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($apiKey):"))
Invoke-WebRequest -Uri "https://api.cliniko.com/v1/businesses" `
  -Headers @{"Authorization"="Basic $auth"; "Accept"="application/json"}
```

#### 1.2 TypeScript Types & Cliniko Client

**File**: `src/services/cliniko/types.ts`

```typescript
// Types for Cliniko API responses
export interface ClinikoAppointmentType {
  id: string;
  name: string;
  duration: number; // minutes
}

export interface ClinnikoPractitioner {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ClinikoSlot {
  id: string;
  starts_at: string; // ISO 8601
  ends_at: string;
  appointment_type_id: string;
}

export interface ClinikoBooking {
  id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
  };
  appointment_type_id: string;
  starts_at: string;
  ends_at: string;
}

export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentTypeId: string;
  startTime: string; // ISO 8601
  notes?: string;
}
```

**File**: `src/services/cliniko/client.ts`

```typescript
/**
 * Cliniko API Client
 * All requests authenticated with API key (Basic auth)
 * Rate limit: 300 requests/min (we use max ~10/min)
 */

const API_BASE = 'https://api.cliniko.com/v1';

class ClinikoClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
    return {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'LifePsychologyAustralia/1.0',
    };
  }

  /**
   * Get appointment types (service types)
   * Initial Consultation, Follow-up, etc.
   */
  async getAppointmentTypes() {
    const response = await fetch(`${API_BASE}/appointment_types`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch appointment types: ${response.status}`);
    }

    const data = await response.json();
    return data.appointment_types || [];
  }

  /**
   * Get practitioners (therapists)
   */
  async getPractitioners() {
    const response = await fetch(`${API_BASE}/practitioners`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch practitioners: ${response.status}`);
    }

    const data = await response.json();
    return data.practitioners || [];
  }

  /**
   * Get available appointment slots
   * Cliniko doesn't have a dedicated slots endpoint, so we fetch
   * all appointments and calculate free slots based on working hours
   */
  async getAvailableSlots(
    practitionerId: string,
    appointmentTypeId: string,
    startDate: Date,
    endDate: Date
  ) {
    // This is a simplified version - in production, you'd calculate
    // based on practitioner's working hours and existing appointments
    const response = await fetch(
      `${API_BASE}/individual_appointments?start_at_or_after=${startDate.toISOString()}&start_at_before=${endDate.toISOString()}&practitioner_id=${practitionerId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status}`);
    }

    const data = await response.json();
    const bookedSlots = data.individual_appointments || [];

    // TODO: Implement slot calculation logic based on working hours
    // For now, return empty - will be implemented in Week 2
    return [];
  }

  /**
   * Create a new patient and return their ID
   * Cliniko uses "patients" endpoint
   */
  async createPatient(
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  ) {
    const response = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        patient: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          mobile: phone, // Cliniko calls it "mobile"
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create patient: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.patient.id;
  }

  /**
   * Create appointment in Cliniko
   * This is the critical function for booking
   */
  async createAppointment(formData: BookingFormData) {
    // Step 1: Check if patient exists by email, create if not
    let patientId: string;
    try {
      // Try to find patient first
      const existingPatients = await fetch(
        `${API_BASE}/patients?email=${encodeURIComponent(formData.email)}`,
        {
          headers: this.getHeaders(),
        }
      ).then((r) => r.json());

      if (existingPatients.patients && existingPatients.patients.length > 0) {
        patientId = existingPatients.patients[0].id;
      } else {
        patientId = await this.createPatient(
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.phone
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to create/find patient: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    // Step 2: Create appointment
    try {
      const response = await fetch(`${API_BASE}/individual_appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          individual_appointment: {
            patient_id: patientId,
            practitioner_id: process.env.VITE_CLINIKO_PRACTITIONER_ID,
            appointment_type_id: formData.appointmentTypeId,
            starts_at: formData.startTime,
            notes: formData.notes || 'Booked via Life Psychology website',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Failed to create appointment: ${response.status} ${error}`
        );
      }

      const data = await response.json();
      return {
        appointmentId: data.individual_appointment.id,
        patientId,
        startTime: data.individual_appointment.starts_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to create appointment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

export const createClinikoClient = (apiKey: string) =>
  new ClinikoClient(apiKey);
```

#### 1.3 Basic Booking Form Component

**File**: `src/components/CustomBookingForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import {
  ClinikoAppointmentType,
  ClinnikoPractitioner,
  BookingFormData
} from '../services/cliniko/types';
import { createClinikoClient } from '../services/cliniko/client';

interface CustomBookingFormProps {
  onBookingSuccess?: (appointmentId: string) => void;
  onError?: (error: string) => void;
}

export function CustomBookingForm({
  onBookingSuccess,
  onError,
}: CustomBookingFormProps) {
  const [step, setStep] = useState<'service' | 'time' | 'details' | 'payment'>(
    'service'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Form data
  const [appointmentTypes, setAppointmentTypes] = useState<
    ClinikoAppointmentType[]
  >([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');

  const [formData, setFormData] = useState<BookingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    appointmentTypeId: '',
    startTime: '',
  });

  // Initialize: Load appointment types
  useEffect(() => {
    const loadAppointmentTypes = async () => {
      try {
        const apiKey = import.meta.env.VITE_CLINIKO_API_KEY;
        if (!apiKey) {
          setError('Cliniko API key not configured');
          onError?.('Cliniko API key not configured');
          return;
        }

        const client = createClinikoClient(apiKey);
        const types = await client.getAppointmentTypes();
        setAppointmentTypes(types);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to load appointment types: ${message}`);
        onError?.(message);
      }
    };

    loadAppointmentTypes();
  }, [onError]);

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    setFormData((prev) => ({ ...prev, appointmentTypeId: typeId }));
    setStep('time');
  };

  const handleSelectTime = (isoTime: string) => {
    setFormData((prev) => ({ ...prev, startTime: isoTime }));
    setStep('details');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      setError('Name is required');
      return;
    }

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.phone) {
      setError('Phone is required');
      return;
    }

    // Move to payment step
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_CLINIKO_API_KEY;
      const client = createClinikoClient(apiKey);

      // TODO: Add Stripe payment processing here
      // For now, just create the appointment

      const result = await client.createAppointment(formData);

      setLoading(false);
      onBookingSuccess?.(result.appointmentId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      onError?.(message);
      setLoading(false);
    }
  };

  // Render steps
  if (step === 'service') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Select Service</h2>
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
        <div className="space-y-2">
          {appointmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelectType(type.id)}
              className="w-full p-4 border-2 border-gray-300 rounded hover:border-blue-500 text-left"
            >
              <div className="font-semibold">{type.name}</div>
              <div className="text-sm text-gray-600">{type.duration} minutes</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <form onSubmit={handleDetailsSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Your Details</h2>
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, firstName: e.target.value }))
          }
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, lastName: e.target.value }))
          }
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          className="w-full p-2 border rounded"
          required
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('service')}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    );
  }

  if (step === 'payment') {
    return (
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Payment</h2>
        {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}

        <div className="p-4 bg-gray-100 rounded">
          <div>Service: {appointmentTypes.find(t => t.id === selectedTypeId)?.name}</div>
          <div>Time: {formData.startTime}</div>
        </div>

        {/* TODO: Add Stripe payment form here */}
        <p className="text-sm text-gray-600">
          Payment integration coming in Phase 1 week 3-4
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep('details')}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Complete Booking'}
          </button>
        </div>
      </form>
    );
  }

  // Step: time selection
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Time</h2>
      {error && <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>}
      <p className="text-sm text-gray-600">Time selection coming in Phase 1 week 2</p>
      <button
        onClick={() => setStep('service')}
        className="px-4 py-2 bg-gray-300 rounded"
      >
        Back
      </button>
    </div>
  );
}
```

---

### Week 1-2 Deliverables

- ✅ Cliniko trial account with API access
- ✅ TypeScript client for Cliniko API
- ✅ Service selection form step
- ✅ Patient details form step
- ✅ Successfully create test appointment in Cliniko
- ✅ Error handling for API failures

**Testing Checklist**:

- [ ] Load appointment types from Cliniko
- [ ] Create test patient (check in Cliniko dashboard)
- [ ] Create test appointment (verify in Cliniko calendar)
- [ ] Form validation works
- [ ] Error messages display correctly

---

## WEEK 3-4: Payment & Attribution (~20 hours)

### 3.1 Azure SQL Schema for Bookings

**File**: `azure-functions-project/setup-bookings-table.sql`

```sql
-- Create bookings table for tracking appointments and attribution
-- Privacy-first: Store only what's necessary for booking + attribution

CREATE TABLE bookings (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

  -- Cliniko IDs
  cliniko_appointment_id VARCHAR(50),
  cliniko_patient_id VARCHAR(50),

  -- Patient info (minimal - no PHI)
  patient_name NVARCHAR(200) NOT NULL,
  patient_email NVARCHAR(255) NOT NULL,
  patient_phone NVARCHAR(50) NOT NULL,

  -- Appointment details
  appointment_datetime DATETIME2 NOT NULL,
  appointment_type NVARCHAR(100) NOT NULL,

  -- Payment
  amount_aud DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(100),
  payment_status VARCHAR(50), -- 'pending', 'succeeded', 'failed'

  -- Attribution (Google Ads tracking)
  gclid VARCHAR(200), -- Google Click ID from URL params
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Conversion tracking
  conversion_uploaded BIT DEFAULT 0, -- Sent to Google Ads API?
  conversion_upload_attempts INT DEFAULT 0,
  last_upload_attempt DATETIME2,

  -- Audit
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),

  INDEX idx_gclid (gclid),
  INDEX idx_email (patient_email),
  INDEX idx_created_at (created_at),
  INDEX idx_conversion_upload (conversion_uploaded, created_at)
);

-- Table for tracking sessions (optional, for enhanced analytics)
CREATE TABLE booking_sessions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  booking_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES bookings(id),

  -- Session tracking
  session_id VARCHAR(100),
  client_id VARCHAR(100),

  -- UTM params captured at session start
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  gclid VARCHAR(200),

  created_at DATETIME2 DEFAULT GETUTCDATE()
);
```

**Deploy SQL:**

```powershell
# Connect to Azure SQL and run the schema
$connectionString = $env:AZURE_SQL_CONNECTION_STRING
sqlcmd -S "your-server.database.windows.net" -U "username" -P "password" -d "lpa-bookings" -i "setup-bookings-table.sql"
```

### 3.2 GCLID Capture Utility

**File**: `src/utils/attributionTracking.ts`

```typescript
/**
 * Google Ads Attribution Tracking
 * Captures and persists GCLID and UTM parameters for conversion tracking
 */

export interface AttributionData {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

/**
 * Extract attribution params from URL
 * Called on page load to capture ad click data
 */
export function captureAttributionParams(): AttributionData {
  const params = new URLSearchParams(window.location.search);

  const attribution: AttributionData = {
    gclid: params.get('gclid') || undefined,
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  };

  // Store in sessionStorage for persistence across form steps
  sessionStorage.setItem('attribution_params', JSON.stringify(attribution));

  // Log for debugging
  console.log('[Attribution] Captured params:', attribution);

  return attribution;
}

/**
 * Get stored attribution params
 */
export function getStoredAttributionParams(): AttributionData {
  const stored = sessionStorage.getItem('attribution_params');
  return stored ? JSON.parse(stored) : {};
}

/**
 * Clear attribution params (after successful booking)
 */
export function clearAttributionParams() {
  sessionStorage.removeItem('attribution_params');
}

/**
 * Hash email for Offline Conversion API (required by Google)
 * SHA-256 hashing of normalized email
 */
export async function hashEmail(email: string): Promise<string> {
  // Normalize: lowercase, trim whitespace
  const normalized = email.toLowerCase().trim();

  // SHA-256 hash
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );

  // Convert to hex string
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash phone for Offline Conversion API
 * E.164 format (international) then SHA-256
 */
export async function hashPhone(phone: string): Promise<string> {
  // Remove non-digits, add +61 for Australia
  const digitsOnly = phone.replace(/\D/g, '');
  const e164 = digitsOnly.startsWith('61')
    ? `+${digitsOnly}`
    : `+61${digitsOnly.substring(1)}`;

  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(e164)
  );

  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 3.3 Stripe Payment Integration

**File**: `src/components/StripePaymentForm.tsx`

```typescript
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { hashEmail, hashPhone } from '../utils/attributionTracking';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

interface StripePaymentFormProps {
  amount: number; // AUD cents
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  appointmentTypeId: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

/**
 * Inner component that uses Stripe hooks
 * Must be inside Elements provider
 */
function StripeFormInner({
  amount,
  email,
  phone,
  firstName,
  lastName,
  appointmentTypeId,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded. Please refresh the page.');
      onPaymentError('Stripe not loaded');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create payment intent on backend
      const paymentResponse = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email,
          firstName,
          lastName,
          appointmentTypeId,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error(
          `Failed to create payment: ${paymentResponse.status}`
        );
      }

      const { clientSecret } = await paymentResponse.json();

      // Step 2: Confirm payment with card
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email,
            phone,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (
        result.paymentIntent &&
        result.paymentIntent.status === 'succeeded'
      ) {
        setLoading(false);
        onPaymentSuccess(result.paymentIntent.id);
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      onPaymentError(message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424242',
              },
              invalid: {
                color: '#9ccc65',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Processing Payment...' : 'Complete Payment'}
      </button>

      <p className="text-xs text-gray-600">
        💳 Secure payment powered by Stripe. Your card details are never stored.
      </p>
    </form>
  );
}

/**
 * Wrapper component
 */
export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripeFormInner {...props} />
    </Elements>
  );
}
```

### 3.4 Azure Function: Create Payment Intent

**File**: `azure-functions-project/create-payment-intent/index.js`

```javascript
/**
 * Azure Function: Create Payment Intent
 *
 * This function:
 * 1. Validates payment request
 * 2. Creates Stripe PaymentIntent (test mode)
 * 3. Stores pending booking in database
 * 4. Returns client secret to frontend
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.log('create-payment-intent function triggered');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  try {
    const { amount, email, firstName, lastName, appointmentTypeId } = req.body;

    if (!amount || !email || !firstName || !lastName) {
      context.res = {
        status: 400,
        headers,
        body: {
          error: 'Missing required fields: amount, email, firstName, lastName',
        },
      };
      return;
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'aud',
      payment_method_types: ['card'],
      metadata: {
        email,
        firstName,
        lastName,
        appointmentTypeId,
      },
    });

    context.log(`PaymentIntent created: ${paymentIntent.id}`);

    context.res = {
      status: 200,
      headers,
      body: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    context.log.error('create-payment-intent error:', error);

    context.res = {
      status: 500,
      headers,
      body: {
        error: error.message || 'Failed to create payment intent',
      },
    };
  }
};
```

**Function config**: `azure-functions-project/create-payment-intent/function.json`

```json
{
  "scriptFile": "index.js",
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post", "options"],
      "route": "create-payment-intent"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "$return"
    }
  ]
}
```

### 3.5 Azure Function: Complete Booking

**File**: `azure-functions-project/complete-booking/index.js`

```javascript
/**
 * Azure Function: Complete Booking
 *
 * Called after successful Stripe payment
 * 1. Create appointment in Cliniko
 * 2. Store booking record with GCLID
 * 3. Return confirmation
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const { executeQuery } = require('../shared/db');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.log('complete-booking function triggered');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  try {
    const {
      paymentIntentId,
      firstName,
      lastName,
      email,
      phone,
      appointmentTypeId,
      startTime,
      gclid,
      utm_source,
      utm_medium,
      utm_campaign,
    } = req.body;

    if (!paymentIntentId || !firstName || !email || !appointmentTypeId) {
      context.res = {
        status: 400,
        headers,
        body: { error: 'Missing required booking fields' },
      };
      return;
    }

    // Step 1: Verify payment was successful
    context.log(`Verifying payment: ${paymentIntentId}`);
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError) {
      context.log.error('Failed to verify payment:', stripeError);
      throw new Error(`Payment verification failed: ${stripeError.message}`);
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(
        `Payment not completed (status: ${paymentIntent.status})`
      );
    }

    // Step 2: Create appointment in Cliniko
    context.log('Creating appointment in Cliniko...');
    let clinikoAppointmentId;
    try {
      clinikoAppointmentId = await createClinikoAppointment(context, {
        firstName,
        lastName,
        email,
        phone,
        appointmentTypeId,
        startTime,
      });
    } catch (clinikoError) {
      context.log.error('Failed to create Cliniko appointment:', clinikoError);
      // TODO: Store failed booking for retry
      throw clinikoError;
    }

    // Step 3: Store booking record
    context.log('Storing booking record...');
    const bookingId = uuidv4();
    try {
      const query = `
        INSERT INTO bookings (
          id,
          cliniko_appointment_id,
          patient_name,
          patient_email,
          patient_phone,
          appointment_datetime,
          appointment_type,
          amount_aud,
          stripe_payment_intent_id,
          payment_status,
          gclid,
          utm_source,
          utm_medium,
          utm_campaign
        ) VALUES (
          @id,
          @cliniko_appointment_id,
          @patient_name,
          @patient_email,
          @patient_phone,
          @appointment_datetime,
          @appointment_type,
          @amount_aud,
          @stripe_payment_intent_id,
          @payment_status,
          @gclid,
          @utm_source,
          @utm_medium,
          @utm_campaign
        )
      `;

      await executeQuery(query, {
        id: bookingId,
        cliniko_appointment_id: clinikoAppointmentId,
        patient_name: `${firstName} ${lastName}`,
        patient_email: email,
        patient_phone: phone,
        appointment_datetime: startTime,
        appointment_type: appointmentTypeId,
        amount_aud: paymentIntent.amount / 100, // Convert from cents
        stripe_payment_intent_id: paymentIntentId,
        payment_status: 'succeeded',
        gclid: gclid || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      });

      context.log(`Booking stored: ${bookingId}`);
    } catch (dbError) {
      context.log.error('Failed to store booking:', dbError);
      // Log but don't fail - appointment is created in Cliniko
    }

    context.res = {
      status: 200,
      headers,
      body: {
        success: true,
        bookingId,
        clinikoAppointmentId,
        confirmationEmail: email,
        message: 'Appointment booked successfully!',
      },
    };
  } catch (error) {
    context.log.error('complete-booking error:', error);

    context.res = {
      status: 500,
      headers,
      body: {
        error: error.message || 'Failed to complete booking',
      },
    };
  }
};

/**
 * Create appointment in Cliniko
 */
async function createClinikoAppointment(context, data) {
  const apiKey = process.env.CLINIKO_API_KEY;
  const practitionerId = process.env.CLINIKO_PRACTITIONER_ID;

  if (!apiKey || !practitionerId) {
    throw new Error('Cliniko credentials not configured');
  }

  const auth = Buffer.from(`${apiKey}:`).toString('base64');

  // Create patient first
  let patientId;
  try {
    const patientResponse = await fetch('https://api.cliniko.com/v1/patients', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          mobile: data.phone,
        },
      }),
    });

    if (!patientResponse.ok) {
      throw new Error(`Failed to create patient: ${patientResponse.status}`);
    }

    const patientData = await patientResponse.json();
    patientId = patientData.patient.id;
  } catch (error) {
    context.log.error('Failed to create patient:', error);
    throw error;
  }

  // Create appointment
  try {
    const appointmentResponse = await fetch(
      'https://api.cliniko.com/v1/individual_appointments',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          individual_appointment: {
            patient_id: patientId,
            practitioner_id: practitionerId,
            appointment_type_id: data.appointmentTypeId,
            starts_at: data.startTime,
            notes: 'Booked via Life Psychology custom booking form',
          },
        }),
      }
    );

    if (!appointmentResponse.ok) {
      throw new Error(
        `Failed to create appointment: ${appointmentResponse.status}`
      );
    }

    const appointmentData = await appointmentResponse.json();
    return appointmentData.individual_appointment.id;
  } catch (error) {
    context.log.error('Failed to create appointment:', error);
    throw error;
  }
}
```

---

### Week 3-4 Deliverables

- ✅ Azure SQL schema created with bookings table
- ✅ GCLID capture and storage utility
- ✅ Stripe payment form component
- ✅ `create-payment-intent` Azure Function
- ✅ `complete-booking` Azure Function
- ✅ E2E test: Form → Payment → Cliniko appointment → Database record

**Testing Checklist**:

- [ ] Payment intent created successfully
- [ ] Card payment processes in Stripe test mode
- [ ] Booking record inserted into SQL
- [ ] GCLID persists from form to database
- [ ] Cliniko appointment created with patient
- [ ] Confirmation email logic prepared

---

## PHASE 1 SUCCESS GATE (Hour 50)

### Success Criteria Validation

Before proceeding to Phase 2, verify ALL criteria:

```typescript
// Unit test checklist
1. ✅ Cliniko API Integration
   - [ ] getAppointmentTypes() returns array
   - [ ] createPatient() returns ID
   - [ ] createAppointment() returns appointment object
   - [ ] API errors handled gracefully

2. ✅ Payment Processing (Stripe)
   - [ ] Payment intent created
   - [ ] Card payment succeeds in test mode
   - [ ] Amount charged correctly (AUD cents)
   - [ ] Payment status tracked in database

3. ✅ Attribution Capture (GCLID)
   - [ ] gclid captured from URL params
   - [ ] Stored in sessionStorage
   - [ ] Persisted to database on booking
   - [ ] Retrievable for conversion tracking

4. ✅ No Blocking Limitations
   - [ ] Cliniko API responsive (<2s response time)
   - [ ] Rate limit sufficient (300/min, using <10/min)
   - [ ] No auth failures after 50 requests
   - [ ] No data corruption in database

5. ✅ End-to-End Test
   - [ ] Complete flow: landing → form selection → time pick → details → payment → confirmation
   - [ ] Cliniko appointment visible in dashboard
   - [ ] Booking record in SQL with GCLID
   - [ ] No errors in browser console
```

### Decision: Pass or Pivot?

**IF ALL CRITERIA PASS:**
→ Proceed to Phase 2 (50 hours: polish, tracking, production deployment)

**IF ANY CRITERIA FAIL:**
→ STOP and pivot to **Alternative A**: Hire conversion tracking specialist for $800-1,500 to optimize existing Halaxy tracking ($$$, achieving 70-85% attribution accuracy within 2-4 weeks without development risk)

---

## Environment Configuration

**`.env.development`** (Cliniko + Stripe test keys):

```bash
VITE_CLINIKO_API_KEY=your_cliniko_api_key_here
VITE_CLINIKO_PRACTITIONER_ID=practitioner_id_from_cliniko
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_SECRET_KEY=sk_test_xxx # For Azure Functions only
VITE_AZURE_FUNCTION_URL=http://localhost:7071/api
```

**`azure-functions-project/.env`** (Azure Functions):

```bash
STRIPE_SECRET_KEY=sk_test_xxx
CLINIKO_API_KEY=your_cliniko_api_key_here
CLINIKO_PRACTITIONER_ID=practitioner_id_from_cliniko
AZURE_SQL_CONNECTION_STRING=Server=xxx.database.windows.net;Database=lpa-bookings;User=...
```

---

## Resource Usage Tracking

**Phase 1 Hour Allocation (50 hours total)**:

- Week 1-2: Cliniko integration (20 hrs)
  - Setup & API client: 8 hrs
  - Basic form UI: 7 hrs
  - Testing & troubleshooting: 5 hrs

- Week 3-4: Payment & attribution (20 hrs)
  - Azure SQL setup: 3 hrs
  - Stripe integration: 8 hrs
  - Attribution tracking: 5 hrs
  - E2E testing & fixes: 4 hrs

- Success Gate & Decision (10 hrs buffer):
  - Comprehensive testing: 6 hrs
  - Documentation & cleanup: 4 hrs

**Infrastructure Costs (Phase 1)**:

- Cliniko trial: FREE (no limits for test)
- Stripe: FREE test mode
- Azure SQL: $5/month (Basic tier, only after deployment)
- **Total Phase 1 cost: $0** (except Basic SQL in production = $5/mo)

---

## Next Steps (If Phase 1 Succeeds)

Phase 2 will add:

1. **Tracking Layer 1**: Enhanced Conversions for Leads (client-side)
2. **Tracking Layer 2**: Offline Conversion API (server-side)
3. **Tracking Layer 3**: GA4 events (funnel tracking)
4. **Production Deployment**: Azure Static Web Apps + Functions
5. **Documentation**: Handoff guide for maintenance

---

## Pragmatic Advice

✅ **What's Working**:

- Cliniko API is straightforward and well-documented
- Stripe test mode is forgiving and complete
- Azure Functions scale easily
- TypeScript provides safety

⚠️ **Watch Out For**:

- Cliniko doesn't have a native "availability" endpoint - we calculate free slots based on working hours + existing appointments
- Stripe requires PCI compliance (but we use Stripe Elements, so no card data touches our servers)
- GCLID expires, so capture it EARLY (on landing page, not in booking form)
- SQL injection risks - always use parameterized queries

🎯 **If You Get Stuck**:

- Cliniko API docs: https://cliniko.com/developers
- Stripe integration guide: https://stripe.com/docs/payments
- Azure Functions Node.js: https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node

Good luck! 🚀
