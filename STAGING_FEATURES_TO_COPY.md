# Staging Branch Features to Copy

## Overview

The staging branch at https://github.com/AntonyNeal/life-psychology-frontend/tree/staging contains a complete customer booking workflow with Stripe payment integration that we need to copy to the current bloom-web-app repository.

## Current Status

✅ **Already in place:**
- `apps/website/src/components/BookingForm.tsx` - Already has payment step (matches staging)
- `apps/website/src/components/StripePayment.tsx` - Already exists (matches staging)  
- `apps/website/src/components/TimeSlotCalendar.tsx` - Calendar selection component
- `apps/website/src/components/BookingModal.tsx` - Modal wrapper

## Files to Copy from Staging

### 1. Azure Function: Create Payment Intent

**Source:** `c:\Repos\life-psychology-staging-temp\azure-functions-project\create-payment-intent\`

**Destination:** `c:\Repos\bloom-web-app\apps\website\functions\src\functions\create-payment-intent\`

**Files:**
- `index.js` - Main Azure Function handler for creating Stripe payment intents
- `function.json` - Azure Function configuration

**Purpose:**
- Creates Stripe PaymentIntent before appointment booking
- Handles CORS for cross-origin requests
- Returns `clientSecret` for frontend payment confirmation
- Stores metadata (customer info, service type)

### 2. Azure Function Enhancements (if needed)

Check if staging has enhanced versions of:
- `halaxy-webhook` - May have additional payment tracking
- `shared/` directory - Shared utilities for payment processing

### 3. Environment Variables

**Add to `.env` files:**
```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Azure Functions URL (if different)
VITE_FUNCTIONS_URL=https://your-function-app.azurewebsites.net/api
```

### 4. Package Dependencies

**Check `package.json` in both locations:**
- Staging: `c:\Repos\life-psychology-staging-temp\apps\website\package.json`
- Staging Functions: `c:\Repos\life-psychology-staging-temp\azure-functions-project\package.json`
- Current: `c:\Repos\bloom-web-app\apps\website\package.json`
- Current Functions: `c:\Repos\bloom-web-app\apps\website\functions\package.json`

**Required NPM packages:**
```json
{
  "@stripe/stripe-js": "^4.8.0",
  "@stripe/react-stripe-js": "^2.8.0",
  "stripe": "^latest" // For Azure Functions
}
```

## Implementation Steps

### Step 1: Copy Azure Function

```powershell
# Create directory structure
New-Item -ItemType Directory -Force -Path "c:\Repos\bloom-web-app\apps\website\functions\src\functions\create-payment-intent"

# Copy files
Copy-Item "c:\Repos\life-psychology-staging-temp\azure-functions-project\create-payment-intent\*" `
  -Destination "c:\Repos\bloom-web-app\apps\website\functions\src\functions\create-payment-intent\" `
  -Recurse
```

### Step 2: Install Stripe in Functions

```powershell
cd c:\Repos\bloom-web-app\apps\website\functions
npm install stripe --save
```

### Step 3: Configure Environment Variables

1. **Development:** Update `c:\Repos\bloom-web-app\apps\website\.env.development`
2. **Production:** Update GitHub Secrets in repository settings:
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`

### Step 4: Test Locally

```powershell
# Terminal 1 - Start Functions
cd c:\Repos\bloom-web-app\apps\website\functions
npm start

# Terminal 2 - Start Frontend
cd c:\Repos\bloom-web-app\apps\website
npm run dev

# Test booking flow:
# 1. Navigate to localhost:5173
# 2. Click "Book Appointment"
# 3. Fill in details
# 4. Select date/time
# 5. PAYMENT STEP should appear
# 6. Use test card: 4242 4242 4242 4242
# 7. Verify payment succeeds
```

### Step 5: Verify Integration

**Check Stripe Dashboard:**
- Go to https://dashboard.stripe.com/test/payments
- Verify test payment appears
- Check metadata contains customer info

**Check Application:**
- Payment step renders correctly
- Error handling works (try invalid card)
- Success flow proceeds to confirmation

### Step 6: Deploy

Once tested locally:
```powershell
git add apps/website/functions/src/functions/create-payment-intent/
git add apps/website/functions/package.json
git add apps/website/functions/package-lock.json
git commit -m "Add Stripe payment intent Azure Function from staging"
git push origin develop
```

## Booking Flow

```
1. User Details (name, email, phone)
   ↓
2. Date & Time Selection (appointment type, calendar)
   ↓
3. PAYMENT (Stripe payment form) ⭐ NEW
   ↓
4. Confirmation (review and submit to Halaxy)
   ↓
5. Success (appointment ID)
```

## Testing Checklist

- [ ] `create-payment-intent` function copied
- [ ] Stripe packages installed in functions
- [ ] Environment variables configured
- [ ] Local function app starts without errors
- [ ] Payment form renders in booking flow
- [ ] Test card (4242 4242 4242 4242) processes successfully
- [ ] Payment success triggers confirmation step
- [ ] Invalid card shows error message
- [ ] Stripe Dashboard shows test payment
- [ ] Metadata in Stripe includes customer details
- [ ] Full booking flow completes end-to-end

## Current vs Staging Comparison

| Feature | Current (bloom-web-app) | Staging | Status |
|---------|------------------------|---------|---------|
| BookingForm.tsx | ✅ Has payment step | ✅ Has payment step | ✅ Match |
| StripePayment.tsx | ✅ Exists | ✅ Exists | ✅ Match |
| create-payment-intent Function | ❌ Missing | ✅ Exists | ⚠️ Need to copy |
| Stripe packages | ✅ Installed (@stripe/stripe-js@^4.8.0, @stripe/react-stripe-js@^2.8.0) | ✅ Installed | ✅ Match |
| Payment in workflow | ✅ Integrated | ✅ Integrated | ✅ Match |

## Next Steps

1. Copy `create-payment-intent` Azure Function from staging
2. Test locally with Stripe test keys
3. Deploy and verify in development environment
4. Update production environment variables
5. Test end-to-end in production with real appointment

## Documentation References

From staging branch:
- `STRIPE-PAYMENT-SETUP.md` - Complete setup guide
- `CUSTOM_BOOKING_POC_IMPLEMENTATION_GUIDE.md` - Implementation details
- `BOOKING-CALENDAR-SPECIFICATION.md` - Booking flow specification
