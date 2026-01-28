# 🌸 Medicare Billing Setup Guide for Zoe

**Hi Zoe!** Thanks for helping set up automated Medicare billing for Life Psychology Australia. This guide walks you through everything we need from your side.

**Time Required:** ~2-3 hours  
**What You Need:** Access to Halaxy Admin, PRODA login, practitioner Medicare details

---

## 📋 Overview: What We're Setting Up

Automated Medicare billing means:
1. ✅ After a session, Bloom creates the invoice automatically
2. ✅ Medicare claim is submitted electronically (no manual entry)
3. ✅ Rebate goes directly to client or practice (depending on setup)
4. ✅ Gap payment collected via Stripe

**Current State:** Halaxy integration is connected (Client ID: `6596938477cda9626813ca7454526177`)  
**What's Missing:** Medicare claiming credentials and practitioner billing details

---

## 🔑 Part 1: PRODA Setup (Practice Level)

PRODA (Provider Digital Access) is Services Australia's system for submitting Medicare claims.

### Step 1.1: Log into PRODA
1. Go to: **https://proda.humanservices.gov.au**
2. Sign in with Life Psychology Australia's PRODA account
3. If you don't have one, you'll need to register the practice first

### Step 1.2: Link Practice to Medicare Online
1. In PRODA, go to **Organisation Management**
2. Find "Life Psychology Australia" 
3. Ensure **Medicare Online** is linked as a service
4. Note down the **Location ID** (we'll need this)

### Step 1.3: Get API Credentials for Claiming
1. Go to **B2B Claiming** or **Software Provider Access**
2. Generate credentials for "Halaxy" as your software provider
3. You'll get:
   - **Software ID** 
   - **Device/Software Token**
   - **Location ID**
   
📝 **Send these to Julian:** (securely - don't put in email)
```
Software ID: _______________
Device Token: _______________
Location ID: _______________
```

---

## 👩‍⚕️ Part 2: Practitioner Medicare Details

We need the following for **each practitioner** who will be billing Medicare:

### Step 2.1: Gather Practitioner Details

For each clinician, we need:

| Field | Example | Your Details |
|-------|---------|--------------|
| **Full Legal Name** | Zoe Smith | ___________ |
| **Medicare Provider Number** | 1234567A | ___________ |
| **AHPRA Registration** | PSY0001234567 | ___________ |
| **Practice Location ID** | (from PRODA) | ___________ |
| **Prescriber Number** (if applicable) | 1234567 | ___________ |

### Step 2.2: Enter in Halaxy

1. Log into Halaxy Admin: **https://app.halaxy.com/admin**
2. Go to **Settings → Practitioners**
3. For each practitioner:
   - Click **Edit**
   - Go to **Billing** tab
   - Enter **Medicare Provider Number**
   - Set **Default Item Numbers** (see below)
   - Enable **Online Claiming**
4. Save changes

### Step 2.3: Common Medicare Item Numbers

| Item Code | Description | Standard Fee | Medicare Rebate |
|-----------|-------------|--------------|-----------------|
| **80010** | Initial consultation (30-50min) | ~$180-220 | $90.35 |
| **80110** | Initial consultation (50+ min) | ~$250-300 | $131.45 |
| **80000** | Subsequent consultation (30-50min) | ~$180-220 | $90.35 |
| **80100** | Subsequent consultation (50+ min) | ~$250-300 | $131.45 |
| **91167** | Telehealth clinical psych | ~$250-300 | $131.65 |

For **Clinical Psychologists** (like you), item numbers start with **8XXXX**  
For **Registered Psychologists**, item numbers are different (usually lower rebate)

---

## 💳 Part 3: Halaxy Billing Configuration

### Step 3.1: Practice-Wide Settings

In Halaxy Admin:

1. Go to **Settings → Billing**
2. Under **Medicare Settings**:
   - ✅ Enable "Online Medicare Claiming"
   - Enter **Minor ID** (from PRODA setup)
   - Enter **Location ID**
   - Set **Claiming Software Provider** to your software details
   
3. Under **Default Invoice Settings**:
   - Set **GST**: No (Medicare services are GST-free)
   - Set **Payment Terms**: Due immediately / 7 days
   - Enable **Auto-generate invoices after appointments**

### Step 3.2: Service Types Setup

For each appointment type, configure billing:

1. Go to **Settings → Appointment Types**
2. For each type (e.g., "Medicare Psychology Session"):
   - Set default **Item Number**
   - Set default **Fee**
   - Enable **Auto-create invoice**
   - Link to correct **Payment method** (Medicare + Stripe for gap)

---

## 🔗 Part 4: Connect Halaxy to Bloom

### Step 4.1: Verify API Connection

The Halaxy API is already connected. Let's verify it's working:

1. In Halaxy, go to **Settings → Integrations → API Access**
2. Confirm you see an active connection for:
   - Client ID: `6596938477cda9626813ca7454526177`
   - Permissions: Appointments, Patients, Billing, Practitioners

### Step 4.2: Enable Webhooks

For real-time sync, enable webhooks:

1. In Halaxy Admin, go to **Settings → Integrations → Webhooks**
2. Add a new webhook:
   - **URL**: `https://bloom-functions-dev.azurewebsites.net/api/halaxy-webhook`
   - **Events**: 
     - ✅ appointment.created
     - ✅ appointment.updated
     - ✅ appointment.cancelled
     - ✅ patient.created
     - ✅ invoice.created
     - ✅ payment.received
3. Copy the **Webhook Secret** and send to Julian

### Step 4.3: Map Practitioners

Each practitioner needs their Halaxy ID linked in Bloom. Current mapping:

| Practitioner | Bloom ID | Halaxy Practitioner ID | Halaxy Role ID |
|--------------|----------|------------------------|----------------|
| Zoe | (primary) | 1304541 | PR-2442591 |
| ___________ | ________ | ________ | ________ |
| ___________ | ________ | ________ | ________ |

To find Halaxy IDs:
1. In Halaxy Admin → Settings → Practitioners
2. Click on each practitioner
3. Look at the URL - it contains the ID (e.g., `/practitioner/1304541`)

---

## 📝 Part 5: Testing Checklist

Before going live, test with a fake/test appointment:

### Test 1: Appointment Sync
- [ ] Create appointment in Halaxy
- [ ] Verify it appears in Bloom dashboard
- [ ] Verify client details sync correctly

### Test 2: Invoice Generation
- [ ] Complete an appointment in Halaxy
- [ ] Verify invoice auto-generates
- [ ] Check item number is correct
- [ ] Check fee amount is correct

### Test 3: Medicare Claim (use test mode)
- [ ] Submit a test claim
- [ ] Verify claim status updates
- [ ] Confirm rebate amount is correct

### Test 4: Gap Payment
- [ ] Trigger gap payment in Stripe
- [ ] Verify receipt is sent to client
- [ ] Confirm payment recorded in Halaxy

---

## 📞 What Julian Needs From You

Please collect and securely send:

### Practice Level (One-time):
- [ ] PRODA Location ID
- [ ] Medicare Minor ID  
- [ ] Software/Device Token for claiming
- [ ] Webhook secret from Halaxy

### Per Practitioner:
- [ ] Full legal name
- [ ] Medicare Provider Number
- [ ] Halaxy Practitioner ID
- [ ] Halaxy PractitionerRole ID
- [ ] Default item numbers they use
- [ ] Standard fee per session type

### Halaxy Access (if needed):
- [ ] Can Julian have read-only admin access to verify settings?

---

## ❓ Common Questions

**Q: What if a client doesn't have a Mental Health Treatment Plan?**  
A: Medicare claims will be rejected. The system should flag this before claiming.

**Q: What about DVA clients?**  
A: Different item numbers and claiming process. Let's set up Medicare first, then DVA.

**Q: What about NDIS?**  
A: NDIS uses a different invoicing flow through the NDIS portal. That's Phase 2.

**Q: What about private (non-Medicare) clients?**  
A: They just pay full fee via Stripe. No claiming involved.

---

## 🎯 Next Steps

1. **Today**: Complete Parts 1-3 (PRODA and practitioner setup)
2. **Send to Julian**: Credentials and IDs listed above
3. **Schedule**: 30-min call to test the integration together
4. **Go Live**: After successful testing

---

**Questions?** Call Julian or message in the team chat.

*Document created: January 29, 2026*
