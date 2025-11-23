# Custom Booking POC - Quick Start Guide

**Status:** Ready to build | **Time commitment:** 50 hours over 4 weeks (6 hrs/week)  
**Full documentation:** See `CUSTOM_BOOKING_POC_IMPLEMENTATION_GUIDE.md`

---

## WHAT YOU'RE BUILDING

Adding Stripe payment processing to your existing Halaxy booking system while maintaining your current infrastructure:

```
User books appointment on your website (stays on lifepsychology.com.au)
         ↓
User enters payment info (Stripe Elements in modal)
         ↓
Payment processed ($250 AUD test mode)
         ↓
Halaxy appointment created with GCLID metadata
         ↓
Halaxy webhook fires
         ↓
GCLID extracted from appointment metadata
         ↓
Database updated + conversion tracked
         ↓
Google Ads attribution (85-95% accuracy vs current 40-60%)
```

---

## PHASE 1: PROOF OF CONCEPT (50 hours, 4 weeks)

### Week 1-2: Halaxy API (25 hours)

**Starting point:** You have Halaxy credentials already set up

**What to build:**

1. OAuth token manager (15-minute token expiry handling)
2. Patient creation service (FHIR-R4 format)
3. Appointment creation service (with GCLID in metadata)
4. Azure Function endpoint for creating appointments

**Files to create:**

```
azure-functions-project/shared/
  ├── halaxyAuth.ts           (OAuth token management)
  ├── halaxyPatient.ts        (Create/find patients)
  └── halaxyAppointment.ts    (Create appointments with metadata)

azure-functions-project/create-halaxy-appointment/
  └── index.ts               (Azure Function endpoint)
```

**Time breakdown:**

- Halaxy OAuth token manager: 3 hours
- Patient service: 4 hours
- Appointment service: 4 hours
- Azure Function wrapper: 6 hours
- Integration tests: 4 hours
- **Total: 25 hours**

**Testing:** Run `npm test -- halaxy-integration` to verify API connectivity

### Week 3-4: Payment & Attribution (25 hours)

**Starting point:** BookingForm.tsx exists (647 lines), you have Stripe test keys

**What to build:**

1. Stripe payment intent Azure Function
2. PaymentStep component for BookingForm (Stripe Elements)
3. GCLID capture and persistence (URL → sessionStorage → database)
4. Webhook enhancement to extract GCLID from appointment metadata

**Files to create/modify:**

```
azure-functions-project/create-payment-intent/
  └── index.ts               (Stripe payment intent endpoint)

src/components/
  └── BookingForm.tsx        (Add PaymentStep component + flow)

azure-functions-project/halaxy-webhook/
  └── index.js               (Add GCLID extraction from metadata)
```

**Time breakdown:**

- Stripe payment intent endpoint: 3 hours
- PaymentStep component: 8 hours
- GCLID capture flow: 5 hours
- Webhook GCLID extraction: 3 hours
- End-to-end testing: 6 hours
- **Total: 25 hours**

---

## PHASE 1 DECISION GATE (Mandatory Stop at 50 hours)

**All 5 criteria MUST pass to proceed to Phase 2:**

1. ✅ **Halaxy creates appointments**: POST to create-halaxy-appointment endpoint returns appointment ID
2. ✅ **Stripe processes payments**: Test card 4242-4242-4242-4242 charges successfully
3. ✅ **GCLID persists**: Database query shows GCLID value in bookings table
4. ✅ **Webhook confirms creation**: Webhook log shows SUCCESS status, GCLID extracted
5. ✅ **End-to-end works**: Complete flow from landing page → payment → appointment → webhook

**If ANY criterion fails:**

- STOP development immediately
- Pivot to optimization: Hire conversion tracking specialist for $800-1,500
- Achieve 70-85% attribution accuracy in 2-4 weeks (much safer)
- Real-time sync becomes independent future project

**If ALL criteria pass:**

- Schedule review with Antony
- Confirm commitment to Phase 2 (weeks 5-8, 50 more hours)
- Continue to MVP phase

---

## PHASE 2: MVP (ONLY IF PHASE 1 PASSES)

### Week 5-6: Polish & Tracking Layer 1 (25 hours)

- Brand styling (Life Psychology colors)
- Healthcare error messages (trust + clarity)
- Application Insights logging
- Enhanced Conversions (Google Tag Manager)

### Week 7-8: Conversion Tracking & Production (25 hours)

- Offline Google Ads API integration
- GA4 event architecture
- Production deployment
- Handoff documentation

---

## SETUP CHECKLIST

**Before starting, verify:**

- [ ] Halaxy credentials available

  ```bash
  echo $HALAXY_CLIENT_ID
  echo $HALAXY_CLIENT_SECRET
  ```

- [ ] Stripe test keys obtained from https://dashboard.stripe.com

  ```bash
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

- [ ] Azure SQL connection working

  ```bash
  npm test -- shared/db.test.ts
  ```

- [ ] Azure Functions running locally

  ```bash
  cd azure-functions-project && npm install && func start
  ```

- [ ] .env configured
  ```bash
  cp .env.example .env
  # Add: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
  # Add: STRIPE_SECRET_KEY=sk_test_...
  ```

---

## DEVELOPMENT WORKFLOW

### Week 1: Day 1-3 (Halaxy OAuth + Patient)

```bash
# 1. Create halaxyAuth.ts
# → Test: npm test -- halaxyAuth
# ✓ Token obtained successfully

# 2. Create halaxyPatient.ts
# → Test: npm test -- halaxyPatient
# ✓ Patient created in Halaxy
```

### Week 1-2: Day 4-10 (Halaxy Appointment + Function)

```bash
# 3. Create halaxyAppointment.ts
# → Test: npm test -- halaxyAppointment
# ✓ Appointment created with metadata

# 4. Create create-halaxy-appointment/index.ts
# → Test: curl -X POST http://localhost:7071/api/create-halaxy-appointment ...
# ✓ HTTP endpoint works
```

### Week 2-3: Day 11-17 (Payment Intent + Form)

```bash
# 5. Create create-payment-intent/index.ts
# → Test: curl -X POST http://localhost:7071/api/create-payment-intent ...
# ✓ Returns clientSecret

# 6. Update BookingForm.tsx with PaymentStep
# → Test: npm run dev -> click "Book Now" -> see payment form
# ✓ CardElement renders, payment processes
```

### Week 4: Day 18-21 (Webhook + GCLID + Testing)

```bash
# 7. Enhance halaxy-webhook/index.js with GCLID extraction
# → Test: Send test webhook with meta.tag GCLID
# ✓ Database updated with GCLID

# 8. End-to-end manual testing
# → Full flow: Land on site → Book → Pay → Appointment → Webhook → DB
# ✓ All 5 criteria pass
```

---

## CODE STRUCTURE

### Existing (Don't touch - already working)

```
✅ src/components/TimeSlotCalendar.tsx       (Availability fetching)
✅ src/utils/halaxyAvailability.ts           (Slot formatting)
✅ src/components/BookingForm.tsx            (User info collection)
✅ src/utils/conversionTracking.ts           (GA4/Google Ads firing)
✅ azure-functions-project/halaxy-webhook/   (Appointment webhook)
```

### New for Phase 1 POC

```
🆕 azure-functions-project/shared/halaxyAuth.ts
🆕 azure-functions-project/shared/halaxyPatient.ts
🆕 azure-functions-project/shared/halaxyAppointment.ts
🆕 azure-functions-project/create-halaxy-appointment/index.ts
🆕 azure-functions-project/create-payment-intent/index.ts
🆕 azure-functions-project/__tests__/halaxy-integration.test.ts

🔄 src/components/BookingForm.tsx             (Add PaymentStep)
🔄 azure-functions-project/halaxy-webhook/index.js  (Add GCLID extraction)
```

---

## CRITICAL SUCCESS FACTORS

### 1. Token Management

- Halaxy tokens expire every 15 minutes
- Always check expiry before using
- Auto-refresh when needed
- Clear cache on error

### 2. GCLID Persistence

- Capture from URL: `?gclid=abc123...`
- Store in sessionStorage (not localStorage - single flow only)
- Pass to appointment creation
- Retrieve in webhook from `appointment.meta.tag[]`

### 3. Error Handling

- Payment failures: User-friendly message + retry
- Appointment conflicts: Show available alternatives
- Halaxy errors: Log fully, show generic message to user
- Webhook failures: Don't block - retry logic in database

### 4. Testing

- Stripe test card: `4242 4242 4242 4242`
- Stripe valid CVC: `123`
- Halaxy test patient: Create, verify in admin
- Webhook signature validation: Already implemented

---

## DOCUMENTATION REFERENCE

**Complete implementation details:** `CUSTOM_BOOKING_POC_IMPLEMENTATION_GUIDE.md`

**Sections:**

- Architecture overview
- Phase 1 Week 1-2: Halaxy API integration (full code)
- Phase 1 Week 3-4: Payment & attribution (full code)
- Phase 1 POC gate verification (testing checklist)
- Phase 2 overview (if gate passed)
- Environment variables and setup

---

## DECISION TREE

```
START: 50 hours available?
  ├─ NO → Stop, plan for later
  └─ YES ↓

Phase 1 POC (50 hours, 4 weeks)
  ├─ Any criterion fails? → PIVOT to optimization ($800-1.5K)
  └─ All criteria pass? ↓

DECISION GATE: Commit to Phase 2?
  ├─ NO → Stop here, ship with Stripe payment only
  └─ YES ↓

Phase 2 MVP (50 hours, 4 weeks)
  └─ Full production system with conversion tracking

SUCCESS: 85-95% Google Ads attribution accuracy
```

---

## SUPPORT & QUESTIONS

| Question                               | Answer                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| What if Halaxy API rate limits?        | 200 req/min available; we'll use ~5 req/booking = safe    |
| What if Stripe integration is complex? | Pre-built @stripe/react-stripe-js library; simple setup   |
| What if GCLID doesn't pass through?    | Fallback: Store in booking_session table instead          |
| What if webhook doesn't fire?          | Database polling as fallback (less reliable but works)    |
| What if we need to stop at 25 hours?   | Natural checkpoint at end of Week 2; pause before payment |

---

## NEXT STEP

Choose your starting point:

**Option A: Start with Halaxy (recommended)**

- Build token manager first (foundation for everything)
- Build patient + appointment services
- Deploy test endpoint
- Verify Halaxy connectivity before touching Stripe

**Option B: Start with Stripe Payment**

- Faster to see results
- Risk: Might discover Halaxy integration is harder
- Recommend after Option A works

**Option C: Parallel development**

- Halaxy person + Stripe person
- Merge in Week 3
- Higher coordination overhead

I recommend **Option A** - build Halaxy integration first, verify it works, then add Stripe payment with confidence.

Ready? Let me create the first set of files (halaxyAuth.ts and supporting infrastructure).
