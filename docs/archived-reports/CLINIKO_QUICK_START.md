# Cliniko Custom Booking System - Quick Start Guide

**Get started in 5 minutes**. For complete details, see `CLINIKO_CUSTOM_BOOKING_IMPLEMENTATION.md`.

---

## Step 1: Get API Keys (5 min)

### Cliniko API Key

```bash
# 1. Go to https://www.cliniko.com/free-trial
# 2. Sign up (or login if existing account)
# 3. Settings → API Access → Create New API Key
# 4. Copy the key (keep it private!)
```

### Stripe Keys (Test Mode)

```bash
# 1. Go to https://dashboard.stripe.com
# 2. If no account, sign up
# 3. API Keys section (left sidebar)
# 4. Copy:
#    - Publishable Key (pk_test_...)    → VITE_STRIPE_PUBLISHABLE_KEY
#    - Secret Key (sk_test_...)          → STRIPE_SECRET_KEY (Azure Functions only)
```

### Google Ads (GCLID)

```bash
# This comes automatically from Google Ads
# When users click your ads, they get redirected to:
# https://life-psychology.com.au/book?gclid=AY0KCXjw...
# We capture this automatically - no setup needed yet!
```

---

## Step 2: Configure Environment (.env)

### Frontend (.env.development)

```bash
# Cliniko
VITE_CLINIKO_API_KEY=your_cliniko_api_key_here
VITE_CLINIKO_PRACTITIONER_ID=get_this_from_cliniko_dashboard

# Stripe (PUBLIC - safe to commit)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Azure
VITE_AZURE_FUNCTION_URL=http://localhost:7071/api  # Local dev
```

### Azure Functions (local.settings.json)

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "CLINIKO_API_KEY": "your_cliniko_api_key_here",
    "CLINIKO_PRACTITIONER_ID": "get_this_from_cliniko",
    "STRIPE_SECRET_KEY": "sk_test_xxx",
    "AZURE_SQL_CONNECTION_STRING": "Server=localhost;Database=lpa;User=sa;Password=..."
  }
}
```

---

## Step 3: Create Database Schema

### Option A: Azure Portal (Easy)

```
1. Azure Portal → SQL Databases → Your Database
2. Query Editor → Paste SQL from "setup-bookings-table.sql"
3. Run
```

### Option B: Local SQL Server

```powershell
$connectionString = "Server=localhost;Database=lpa-bookings;User=sa;Password=YourPassword"
sqlcmd -S "localhost" -U "sa" -P "YourPassword" -d "lpa-bookings" -i "setup-bookings-table.sql"
```

---

## Step 4: Get Cliniko Practitioner ID

```bash
# Run this in browser console to find your practitioner ID:
$apiKey = 'your_cliniko_api_key'
$auth = btoa($apiKey + ':')
fetch('https://api.cliniko.com/v1/practitioners', {
  headers: {
    'Authorization': 'Basic ' + $auth,
    'Accept': 'application/json'
  }
}).then(r => r.json()).then(d => {
  d.practitioners.forEach(p => {
    console.log(p.first_name, p.last_name, '→ ID:', p.id)
  })
})

# Copy the ID and set: VITE_CLINIKO_PRACTITIONER_ID=xxx
```

---

## Step 5: Test Components

### Run Unit Tests

```bash
# From project root
npm run test:unit

# Watch mode
npm run test:unit:ui
```

### Start Dev Server

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Azure Functions (optional, for payment testing)
cd azure-functions-project
npm install
npm start
```

### Manual Test Flow

1. Visit http://localhost:5173
2. Click "Book Now"
3. Select service type → should load from Cliniko
4. Select time
5. Enter details
6. Click "Continue to Payment"
7. Use Stripe test card: `4242 4242 4242 4242`
8. Check browser console for success/errors

---

## Step 6: Verify Success

### Cliniko Dashboard

```
1. Log into Cliniko
2. Calendar → Should see new appointment for today/tomorrow
3. Patient name matches form input
```

### SQL Database

```sql
-- Check if booking was stored
SELECT TOP 10 * FROM bookings ORDER BY created_at DESC;

-- Verify GCLID was captured
SELECT cliniko_appointment_id, patient_email, gclid, created_at FROM bookings;
```

### Browser DevTools

```javascript
// Check GCLID in sessionStorage
sessionStorage.getItem('attribution_params');

// Should show: {"gclid":"ABC123","utm_source":"google",...}
```

---

## Phase 1 Success Criteria

✅ **Must Have** (by hour 50):

- [ ] Cliniko creates appointments
- [ ] Stripe test payments work
- [ ] GCLID persists to database
- [ ] No blocking API limitations
- [ ] End-to-end flow complete

✅ **Each Should Take**:

- Setup & API client: 8 hours (Week 1)
- Form UI: 7 hours (Week 1-2)
- Stripe integration: 8 hours (Week 3)
- Attribution: 5 hours (Week 3-4)
- Testing: 10 hours (Throughout)
- Buffer: 6 hours (For problems)

⏱️ **Total**: ~50 hours over 4 weeks (6 hrs/week)

---

## If You Get Stuck

### Common Issues

**"401 Unauthorized" from Cliniko**
→ Check API key in .env, regenerate if needed

**"Cannot find Stripe element"**
→ Make sure you're using `<StripePaymentForm>` inside `<Elements>` provider

**"Database connection failed"**
→ Verify connection string, check if SQL server is running

**"GCLID is null in database"**
→ Check URL has `?gclid=XXX`, verify capture function runs on page load

### Debug Mode

```javascript
// In browser console
// 1. Check config
console.log('Config:', {
  cliniko: import.meta.env.VITE_CLINIKO_API_KEY ? '✓' : '✗',
  stripe: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✓' : '✗',
});

// 2. Check GCLID
const gclid = new URLSearchParams(location.search).get('gclid');
console.log('GCLID from URL:', gclid);

// 3. Check Cliniko connectivity
const apiKey = import.meta.env.VITE_CLINIKO_API_KEY;
const auth = btoa(apiKey + ':');
fetch('https://api.cliniko.com/v1/businesses', {
  headers: { Authorization: 'Basic ' + auth, Accept: 'application/json' },
})
  .then((r) => r.json())
  .then(console.log);
```

---

## Files to Create/Modify

**New Files** (copy templates from `CLINIKO_CUSTOM_BOOKING_IMPLEMENTATION.md`):

- `src/services/cliniko/types.ts` - TypeScript interfaces
- `src/services/cliniko/client.ts` - Cliniko API client
- `src/components/CustomBookingForm.tsx` - 5-step booking form
- `src/utils/attributionTracking.ts` - GCLID capture & hashing
- `src/components/StripePaymentForm.tsx` - Payment form with Stripe
- `azure-functions-project/create-payment-intent/index.js` - Azure Function
- `azure-functions-project/complete-booking/index.js` - Booking completion function
- `setup-bookings-table.sql` - Database schema

**Modify**:

- `.env` - Add API keys
- `package.json` - May need additional dependencies (see below)

---

## Dependencies Check

Run this to verify you have required packages:

```bash
npm list stripe @stripe/react-stripe-js @stripe/stripe-js

# If missing, install:
npm install stripe @stripe/react-stripe-js @stripe/stripe-js
```

For Azure Functions:

```bash
cd azure-functions-project
npm install stripe @azure/functions
```

---

## Next Steps

1. **Today**: Set up API keys + environment
2. **Week 1**: Create Cliniko client, basic form
3. **Week 2**: Get appointment types, time selection
4. **Week 3**: Add Stripe payment
5. **Week 4**: Attribution tracking + testing
6. **Day 51**: Make Go/No-Go decision for Phase 2

**At Hour 50**: Verify all 5 success criteria pass, or pivot to Halaxy optimization.

---

## Resources

- **Cliniko API**: https://cliniko.com/developers
- **Stripe Integration**: https://stripe.com/docs/payments/accept-a-payment
- **Azure Functions**: https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node
- **Attribution Tracking**: https://support.google.com/google-ads/answer/6386790

---

**Questions?** → See full implementation guide: `CLINIKO_CUSTOM_BOOKING_IMPLEMENTATION.md`
