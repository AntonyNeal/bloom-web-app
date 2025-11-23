# Custom Booking POC - Development Checklist

Use this checklist to track progress through Phase 1 (50 hours).

---

## WEEK 1-2: HALAXY API INTEGRATION (25 hours)

### Day 1-3: Halaxy OAuth Token Manager (3 hours)

- [ ] Create `azure-functions-project/shared/halaxyAuth.ts`
  - [ ] `HalaxyTokenManager.getAccessToken()` method
  - [ ] Token caching with 60-second buffer
  - [ ] Error handling for 401/rate limits
  - [ ] Console logging for debugging

- [ ] Test token manager locally

  ```bash
  npm test -- shared/halaxyAuth.test.ts
  # Expected: ✓ Should obtain OAuth token
  #           ✓ Token should be valid for 15 minutes
  ```

- [ ] Verify token in Halaxy dashboard
  - [ ] Log into https://app.halaxy.com
  - [ ] Navigate to Settings → API → Usage
  - [ ] Confirm token requests showing in logs

**Time invested:** 3 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 4-6: Halaxy Patient Service (4 hours)

- [ ] Create `azure-functions-project/shared/halaxyPatient.ts`
  - [ ] `createHalaxyPatient()` function
  - [ ] FHIR-R4 Patient resource formatting
  - [ ] Telecom array for email + phone
  - [ ] Error handling for 400/403

- [ ] Create `azure-functions-project/shared/halaxyPatient.test.ts`

  ```bash
  npm test -- shared/halaxyPatient.test.ts
  # Expected: ✓ Should create patient in Halaxy
  ```

- [ ] Manual verification
  - [ ] Create test patient via function
  - [ ] Check Halaxy admin for patient record
  - [ ] Verify name, email, phone populated correctly

- [ ] Test edge cases
  - [ ] Missing phone (should still create)
  - [ ] Special characters in name
  - [ ] Very long email addresses

**Time invested:** 4 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 7-9: Halaxy Appointment Service (4 hours)

- [ ] Create `azure-functions-project/shared/halaxyAppointment.ts`
  - [ ] `createHalaxyAppointment()` function
  - [ ] FHIR-R4 Appointment resource formatting
  - [ ] Participant array (practitioner + patient)
  - [ ] Metadata tags (GCLID, stripe payment intent)
  - [ ] ISO 8601 datetime formatting with timezone

- [ ] Create `azure-functions-project/shared/halaxyAppointment.test.ts`

  ```bash
  npm test -- shared/halaxyAppointment.test.ts
  # Expected: ✓ Should create appointment in Halaxy
  ```

- [ ] Verify appointment structure
  - [ ] Check Halaxy webhook payload matches expected format
  - [ ] Verify meta.tag array contains GCLID
  - [ ] Confirm start/end times are correct

- [ ] Test practitioner references
  - [ ] Fetch practitioners list (for UI dropdown later)
  - [ ] Test appointment with different practitioner IDs

**Time invested:** 4 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 10-14: Halaxy Appointment Azure Function (6 hours)

- [ ] Create `azure-functions-project/create-halaxy-appointment/function.json`

  ```json
  {
    "bindings": [
      {
        "authLevel": "function",
        "type": "httpTrigger",
        "direction": "in",
        "name": "req",
        "methods": ["post"]
      },
      {
        "type": "http",
        "direction": "out",
        "name": "$return"
      }
    ]
  }
  ```

- [ ] Create `azure-functions-project/create-halaxy-appointment/index.ts`
  - [ ] Request validation
  - [ ] Patient lookup/creation logic
  - [ ] Appointment creation with metadata
  - [ ] Database storage (bookings table)
  - [ ] Error handling and logging

- [ ] Deploy to local Azure Functions

  ```bash
  cd azure-functions-project && func start
  # Expected: Available at http://localhost:7071/api/create-halaxy-appointment
  ```

- [ ] Test endpoint with curl

  ```bash
  curl -X POST http://localhost:7071/api/create-halaxy-appointment \
    -H "Content-Type: application/json" \
    -d '{...}'
  # Expected: 200 OK with appointmentId
  ```

- [ ] Test database storage
  ```sql
  SELECT TOP 1 * FROM bookings ORDER BY created_at DESC;
  # Expected: Row with halaxy_appointment_id, patient name, email
  ```

**Time invested:** 6 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 15: Integration Tests (4 hours)

- [ ] Create `azure-functions-project/__tests__/halaxy-integration.test.ts`

  ```bash
  npm test -- halaxy-integration.test.ts
  ```

  Expected tests to pass:
  - [ ] ✓ Should obtain OAuth token
  - [ ] ✓ Should create patient in Halaxy
  - [ ] ✓ Should create appointment in Halaxy

- [ ] Full end-to-end flow test
  - [ ] Create patient → Get patientId
  - [ ] Create appointment with patientId
  - [ ] Verify Halaxy webhook fired (check logs)
  - [ ] Verify database updated

- [ ] Error scenario tests
  - [ ] Invalid credentials → 401 error
  - [ ] Missing patient data → 400 error
  - [ ] Appointment overlap → Halaxy rejection (expected)

- [ ] Performance check
  - [ ] Token request time: < 500ms
  - [ ] Patient creation: < 1s
  - [ ] Appointment creation: < 1s
  - [ ] Total flow: < 3s

**Time invested:** 4 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Week 1-2 Checkpoint

- [ ] All Halaxy services working locally
- [ ] Test endpoint responding correctly
- [ ] Database populated with test appointments
- [ ] Halaxy webhooks firing for created appointments
- [ ] Estimated time spent: ~25 hours ✓

**Decision:** Ready for Week 3-4 (Payment integration)?  
☐ YES - proceed  
☐ NO - debug and fix issues

---

## WEEK 3-4: PAYMENT & ATTRIBUTION (25 hours)

### Day 16-18: Stripe Payment Intent Function (3 hours)

- [ ] Create `azure-functions-project/create-payment-intent/function.json`

  ```json
  {
    "bindings": [
      {
        "authLevel": "function",
        "type": "httpTrigger",
        "direction": "in",
        "name": "req",
        "methods": ["post"]
      },
      {
        "type": "http",
        "direction": "out",
        "name": "$return"
      }
    ]
  }
  ```

- [ ] Create `azure-functions-project/create-payment-intent/index.ts`
  - [ ] Stripe client initialization
  - [ ] Payment intent creation (test mode)
  - [ ] Metadata storage (appointmentType, gclid)
  - [ ] Return clientSecret + paymentIntentId
  - [ ] Error handling

- [ ] Test endpoint locally

  ```bash
  curl -X POST http://localhost:7071/api/create-payment-intent \
    -H "Content-Type: application/json" \
    -d '{"amount": 250, "appointmentType": "Initial Consultation"}'
  # Expected: 200 OK with clientSecret
  ```

- [ ] Verify in Stripe Dashboard
  - [ ] Log into https://dashboard.stripe.com (test mode)
  - [ ] Navigate to Payments
  - [ ] Confirm payment intents created with correct amounts

**Time invested:** 3 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 19-23: BookingForm Payment Integration (8 hours)

- [ ] Update `src/components/BookingForm.tsx`
  - [ ] Install @stripe/react-stripe-js: `npm install @stripe/react-stripe-js`
  - [ ] Add `'payment'` step to state machine
  - [ ] Create `PaymentStep` component
  - [ ] Implement CardElement
  - [ ] Handle payment confirmation

- [ ] Create PaymentStep component
  - [ ] Fetch payment intent on mount
  - [ ] Render CardElement
  - [ ] Implement form submission
  - [ ] Handle errors (show user-friendly messages)
  - [ ] Show loading state during processing

- [ ] Update form flow
  - [ ] Step 1: Patient details
  - [ ] Step 2: DateTime selection
  - [ ] **NEW Step 3: Payment** ← Add here
  - [ ] Step 4: Confirmation
  - [ ] Step 5: Success

- [ ] Test locally

  ```bash
  npm run dev
  # Click "Book Now" → Fill form → See payment step
  # Test card: 4242 4242 4242 4242
  # Expected: Payment succeeds, shows confirmation
  ```

- [ ] Test payment scenarios
  - [ ] Valid card → Success
  - [ ] Declined card (4000 0000 0000 0002) → Error message
  - [ ] Incomplete card → Validation error
  - [ ] Network error → Graceful fallback

**Time invested:** 8 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 24-26: GCLID Capture & Persistence (5 hours)

- [ ] GCLID capture from URL
  - [ ] Extract from URL: `?gclid=...`
  - [ ] Store in sessionStorage on page load
  - [ ] Retrieve before form submission
  - [ ] Pass to payment intent creation
  - [ ] Pass to appointment creation

- [ ] Update BookingForm to capture GCLID

  ```typescript
  // Before payment step
  const gclid = new URLSearchParams(window.location.search).get('gclid');
  if (gclid) {
    sessionStorage.setItem('lpa_gclid', gclid);
  }
  ```

- [ ] Update payment endpoint to receive GCLID

  ```typescript
  // In PaymentStep
  const response = await fetch('/api/create-payment-intent', {
    body: JSON.stringify({
      amount: 250,
      gclid: sessionStorage.getItem('lpa_gclid'),
    }),
  });
  ```

- [ ] Update appointment endpoint to use GCLID

  ```typescript
  // After payment succeeds
  const response = await fetch('/api/create-halaxy-appointment', {
    body: JSON.stringify({
      patientData: {...},
      appointmentDetails: {...},
      paymentIntentId: paymentIntent.id,
      gclid: sessionStorage.getItem('lpa_gclid')
    })
  });
  ```

- [ ] Test GCLID flow
  - [ ] Land with ?gclid=test123
  - [ ] Complete booking
  - [ ] Verify database: `SELECT gclid FROM bookings WHERE ...;`
  - [ ] Expected: gclid = 'test123'

**Time invested:** 5 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 27-28: Webhook Enhancement (3 hours)

- [ ] Update `azure-functions-project/halaxy-webhook/index.js`
  - [ ] Add `extractGCLIDFromAppointment()` function
  - [ ] Extract from `appointment.meta.tag[]` array
  - [ ] Filter for `system === 'https://life-psychology.com.au/attribution'`

- [ ] Update webhook handler

  ```javascript
  const gclid = extractGCLIDFromAppointment(payload);
  if (gclid) {
    // Update bookings table with GCLID
    await executeQuery(`UPDATE bookings SET gclid = @gclid WHERE ...`, {
      gclid,
    });
  }
  ```

- [ ] Test webhook GCLID extraction
  - [ ] Send test webhook with meta.tag containing GCLID
  - [ ] Verify database updated with GCLID
  - [ ] Check webhook logs: `SELECT * FROM webhook_logs ORDER BY created_at DESC;`

**Time invested:** 3 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Day 29-30: End-to-End Testing (6 hours)

- [ ] Manual flow test

  ```
  1. Land on site with ?gclid=ABC123
  2. Click "Book Appointment"
  3. Fill patient details (First, Last, Email, Phone)
  4. Select appointment time
  5. Enter payment info (4242...)
  6. Click "Confirm Payment"
  7. See success page
  8. Check database for booking
  9. Verify webhook fired
  10. Verify GCLID persisted
  ```

- [ ] Database verification

  ```sql
  SELECT * FROM bookings WHERE email = 'your-test@example.com';
  -- Verify columns:
  -- - gclid = 'ABC123'
  -- - stripe_payment_intent_id = 'pi_...'
  -- - halaxy_appointment_id = 'appointment-...'
  ```

- [ ] Webhook verification

  ```sql
  SELECT * FROM webhook_logs
  WHERE booking_session_id IN (
    SELECT booking_session_id FROM booking_sessions
    WHERE payment_intent_id = 'pi_...'
  );
  -- Verify status = 'SUCCESS'
  ```

- [ ] Test scenarios
  - [ ] Valid booking → Complete success
  - [ ] Payment failure → Show error, don't create appointment
  - [ ] Halaxy error → Log error, show user message
  - [ ] Network timeout → Graceful error handling

- [ ] Performance metrics
  - [ ] Form submission to payment: < 2s
  - [ ] Payment processing: < 5s
  - [ ] Appointment creation: < 2s
  - [ ] Webhook processing: < 1s
  - [ ] Total: < 10s

- [ ] Browser console check
  - [ ] No JavaScript errors
  - [ ] No network 5xx errors
  - [ ] All logs appear correct
  - [ ] Payment confirmation visible

**Time invested:** 6 hours  
**Status:** ⏳ Pending | ✅ Complete

---

### Week 3-4 Checkpoint

- [ ] Stripe payment intent endpoint working
- [ ] BookingForm accepts payment information
- [ ] GCLID captured and persisted through entire flow
- [ ] Webhook extracts GCLID from appointment metadata
- [ ] Database populated with payment + GCLID data
- [ ] Estimated time spent: ~25 hours ✓

**Decision:** Ready for Phase 1 Gate?  
☐ YES - verify success criteria  
☐ NO - debug and fix issues

---

## PHASE 1 POC GATE VERIFICATION (4 hours)

### Gate Criterion 1: Halaxy Creates Appointments ✅

- [ ] Test create-halaxy-appointment endpoint

  ```bash
  curl -X POST http://localhost:7071/api/create-halaxy-appointment \
    -H "Content-Type: application/json" \
    -d '{
      "patientData": {...},
      "appointmentDetails": {...},
      "paymentIntentId": "pi_test_123"
    }'
  # Expected: 200 OK with appointmentId
  ```

- [ ] Verify in Halaxy admin
  - [ ] Log into https://app.halaxy.com
  - [ ] Navigate to Appointments
  - [ ] Find test appointment created
  - [ ] Verify date/time/patient correct

- [ ] Verify in database
  ```sql
  SELECT * FROM bookings WHERE halaxy_appointment_id IS NOT NULL
  ORDER BY created_at DESC LIMIT 1;
  -- Expected: halaxy_appointment_id has value
  ```

**Status:** ✅ PASS | ❌ FAIL

---

### Gate Criterion 2: Stripe Processes Payments ✅

- [ ] Test Stripe payment in test mode

  ```
  1. Fill payment form with 4242 4242 4242 4242
  2. Expiry: 12/25
  3. CVC: 123
  4. Click confirm → Should show "Payment successful"
  ```

- [ ] Verify in Stripe Dashboard
  - [ ] Log into https://dashboard.stripe.com (TEST MODE)
  - [ ] Navigate to Payments
  - [ ] Find latest payment with $250.00 AUD
  - [ ] Status should be "Succeeded"

- [ ] Verify in database
  ```sql
  SELECT stripe_payment_intent_id, payment_status FROM bookings
  ORDER BY created_at DESC LIMIT 1;
  -- Expected: stripe_payment_intent_id = 'pi_...'
  --            payment_status = 'completed'
  ```

**Status:** ✅ PASS | ❌ FAIL

---

### Gate Criterion 3: GCLID Persists ✅

- [ ] Test GCLID capture and storage

  ```
  1. Land on site with ?gclid=GATE_TEST_ABC123
  2. Complete booking flow
  3. Check database for GCLID
  ```

- [ ] Database verification

  ```sql
  SELECT gclid FROM bookings
  WHERE email = 'your-test@example.com'
  ORDER BY created_at DESC LIMIT 1;
  -- Expected: gclid = 'GATE_TEST_ABC123'
  ```

- [ ] Verify sessionStorage
  - [ ] Open browser DevTools → Application → Session Storage
  - [ ] Find key: lpa_gclid
  - [ ] Value should be the GCLID from URL

**Status:** ✅ PASS | ❌ FAIL

---

### Gate Criterion 4: Webhook Confirms Creation ✅

- [ ] Verify webhook received appointment

  ```sql
  SELECT status, booking_session_id, error_message FROM webhook_logs
  WHERE booking_session_id IN (
    SELECT booking_session_id FROM booking_sessions
    WHERE payment_intent_id = 'pi_...'
  )
  ORDER BY created_at DESC LIMIT 1;
  -- Expected: status = 'SUCCESS' or 'ALREADY_PROCESSED'
  ```

- [ ] Verify GCLID extracted in webhook

  ```sql
  SELECT * FROM bookings WHERE gclid IS NOT NULL AND gclid != ''
  ORDER BY webhook_received_at DESC LIMIT 1;
  -- Expected: gclid populated after webhook_received_at
  ```

- [ ] Check webhook logs for errors
  ```sql
  SELECT * FROM webhook_logs WHERE status LIKE 'ERROR%'
  ORDER BY created_at DESC LIMIT 5;
  -- Expected: No recent errors
  ```

**Status:** ✅ PASS | ❌ FAIL

---

### Gate Criterion 5: End-to-End Flow ✅

Complete the entire flow once more:

- [ ] **Step 1 - Landing**
  - [ ] Land on site with ?gclid=END2END_TEST
  - [ ] GCLID captured to sessionStorage
- [ ] **Step 2 - Form**
  - [ ] Click "Book Appointment"
  - [ ] Modal appears on same domain
  - [ ] Fill patient details
  - [ ] Verify no errors
- [ ] **Step 3 - Selection**
  - [ ] Select time slot from calendar
  - [ ] Select appointment type
  - [ ] Verify calendar loads correctly
- [ ] **Step 4 - Payment**
  - [ ] Payment form appears
  - [ ] Enter test card: 4242...
  - [ ] Click "Confirm Payment"
  - [ ] See success message (wait for webhook)
- [ ] **Step 5 - Verification**
  - [ ] Database has booking with GCLID
  - [ ] Stripe shows payment succeeded
  - [ ] Halaxy shows appointment created
  - [ ] Webhook logs show SUCCESS
  - [ ] All data matches

**Status:** ✅ PASS | ❌ FAIL

---

## GATE DECISION

- [ ] **All 5 criteria PASS → PROCEED TO PHASE 2**
  - Schedule review with Antony
  - Confirm commitment to weeks 5-8
  - Start Phase 2: Styling + Tracking

- [ ] **Any criterion FAILS → STOP & PIVOT**
  - Document which criterion failed
  - Identify root cause
  - Either fix (if < 5 hours) or abandon custom build
  - Pivot to optimization path: $800-1,500 for tracking specialist

---

## PHASE 1 COMPLETION SUMMARY

**Total Hours Invested:** ~50 hours ✓  
**Lines of Code Added:** ~500 lines  
**Files Created:** 7 new files  
**Files Modified:** 2 existing files

**What's Working:**

- ✅ Halaxy OAuth token management
- ✅ Patient creation in FHIR-R4 format
- ✅ Appointment creation with metadata
- ✅ Stripe payment processing
- ✅ GCLID capture and persistence
- ✅ Webhook GCLID extraction
- ✅ Database integration

**What's NOT Included (Phase 2):**

- ❌ Brand styling
- ❌ Enhanced error messages
- ❌ Application Insights logging
- ❌ Google Ads API integration
- ❌ Production deployment

**Ready for Phase 2?**  
If all gates passed, estimated 50 more hours to complete MVP with full conversion tracking.

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Status:** Ready for development
