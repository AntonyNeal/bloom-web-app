# 🌸 Medicare Billing Setup Guide for Zoe

**Hi Zoe!** Thanks for helping set up automated Medicare billing for Life Psychology Australia. This guide walks you through everything we need from your side.

**Time Required:** ~1-2 hours  
**What You Need:** PRODA login, practitioner Medicare details

---

## 📋 Overview: What We're Building

We're building **Bloom** as a complete replacement for Halaxy. Automated Medicare billing will work like this:

1. ✅ Practitioner completes session in Bloom
2. ✅ Bloom generates invoice automatically  
3. ✅ Medicare claim submitted electronically (via Tyro/Medicare Online)
4. ✅ Rebate goes directly to client (bulk bill) or practice (private bill)
5. ✅ Gap payment collected via Stripe

**No more Halaxy!** Everything happens in Bloom.

---

## 🔑 Part 1: PRODA Setup (Practice Level)

PRODA (Provider Digital Access) is Services Australia's system for submitting Medicare claims electronically.

### Step 1.1: Log into PRODA
1. Go to: **https://proda.humanservices.gov.au**
2. Sign in with Life Psychology Australia's PRODA account
3. If you don't have one yet, register the practice first

### Step 1.2: Link Practice to Medicare Online
1. In PRODA, go to **Organisation Management**
2. Find "Life Psychology Australia" 
3. Ensure **Medicare Online** is linked as a service
4. Note down:
   - **Minor ID** (practice identifier)
   - **Location ID** (physical location)

### Step 1.3: Get API Credentials for Claiming

We have two options for electronic claiming:

**Option A: Direct Medicare Online (B2B)**
1. Go to **B2B Claiming** or **Software Provider Access**
2. Register Bloom as your claiming software
3. Generate credentials:
   - **Software ID** 
   - **Device/Software Token**

**Option B: Tyro Health (Recommended - Simpler)**
1. Sign up at **https://www.tyrohealth.com**
2. Link your PRODA account
3. Tyro handles the Medicare submission for us
4. We just send claims to Tyro's API

📝 **Send to Julian (securely):**
```
Minor ID: _______________
Location ID: _______________
Claiming method: [ ] Direct B2B  [ ] Tyro Health
If Tyro: Tyro Merchant ID: _______________
If B2B: Software ID: _______________
If B2B: Device Token: _______________
```

---

## 👩‍⚕️ Part 2: Practitioner Medicare Details

We need this for **every practitioner** who will bill Medicare through Bloom.

### Step 2.1: Information Needed Per Practitioner

| Field | Example | Notes |
|-------|---------|-------|
| **Full Legal Name** | Dr Zoe Smith | Must match Medicare exactly |
| **Medicare Provider Number** | 1234567A | 7 digits + letter |
| **AHPRA Registration** | PSY0001234567 | For verification |
| **Qualification Type** | Clinical Psychologist / Registered Psychologist | Determines item numbers |
| **ABN** (if contractor) | 12 345 678 901 | For invoicing |
| **Bank Details** | BSB + Account | For practitioner payments |

### Step 2.2: Current Practitioners to Set Up

Please fill out for each clinician:

**Practitioner 1: Zoe**
- Full Name: _______________
- Medicare Provider #: _______________
- AHPRA: _______________
- Type: [ ] Clinical Psych [ ] Registered Psych [ ] Other
- Standard Session Fee: $_______________

**Practitioner 2: _______________**
- Full Name: _______________
- Medicare Provider #: _______________
- AHPRA: _______________
- Type: [ ] Clinical Psych [ ] Registered Psych [ ] Other
- Standard Session Fee: $_______________

(Copy for additional practitioners)

---

## 💰 Part 3: Fee Schedule & Item Numbers

### Medicare Item Numbers for Psychology

**Clinical Psychologists (AHPRA registered):**
| Item Code | Description | Duration | Medicare Rebate |
|-----------|-------------|----------|-----------------|
| **80010** | Initial consultation | 30-50 min | $90.35 |
| **80110** | Initial consultation | 50+ min | $131.45 |
| **80000** | Subsequent session | 30-50 min | $90.35 |
| **80100** | Subsequent session | 50+ min | $131.45 |

**Telehealth (Clinical Psych):**
| Item Code | Description | Duration | Medicare Rebate |
|-----------|-------------|----------|-----------------|
| **91167** | Video consultation | 50+ min | $131.65 |
| **91168** | Video consultation | 30-50 min | $90.45 |

**Registered Psychologists:**
| Item Code | Description | Duration | Medicare Rebate |
|-----------|-------------|----------|-----------------|
| **80010** | Session | 30-50 min | $70.60 |
| **80110** | Session | 50+ min | $102.55 |

### Your Fee Structure

What are your standard fees? This helps us set up the default pricing:

| Service Type | Your Fee | Medicare Rebate | Gap (Client Pays) |
|--------------|----------|-----------------|-------------------|
| Initial Assessment (50min) | $_______ | $131.45 | $_______ |
| Standard Session (50min) | $_______ | $131.45 | $_______ |
| Telehealth Session (50min) | $_______ | $131.65 | $_______ |
| Couples Session (50min) | $_______ | N/A | $_______ |

---

## 🏦 Part 4: Payment Processing Setup

### Stripe (Already Connected)
Bloom uses Stripe for card payments. Confirm:
- [ ] Stripe account is set up for Life Psychology Australia
- [ ] Bank account linked for payouts
- [ ] Business verified

### Bulk Billing vs Private Billing

**Bulk Billing** (Medicare pays practice, client pays nothing):
- [ ] Do you offer bulk billing? For which clients?
- [ ] Bulk bill item numbers are different - same number with "BB" suffix

**Private Billing** (Client pays, claims rebate):
- [ ] Client pays full fee upfront (via Stripe)
- [ ] We submit Medicare claim on their behalf
- [ ] Rebate goes to client's bank account

**Which model do you use?**
- [ ] Private billing only (most common)
- [ ] Bulk billing for some (concession card holders)
- [ ] Mix depending on client

---

## 📝 Part 5: What Julian Needs From You

### Practice Level (One-time):
- [ ] PRODA Minor ID
- [ ] PRODA Location ID
- [ ] Tyro Health credentials OR B2B claiming credentials
- [ ] Stripe account confirmation
- [ ] Bulk billing policy decision

### Per Practitioner:
- [ ] Full legal name (as registered with Medicare)
- [ ] Medicare Provider Number
- [ ] AHPRA Registration Number  
- [ ] Qualification type (Clinical/Registered/Other)
- [ ] Standard session fees
- [ ] Bank details for practitioner payments (if contractor)

### Fee Schedule:
- [ ] Your fee for each session type
- [ ] Which item numbers you commonly use
- [ ] Any special pricing (sliding scale, student rates, etc.)

---

## 🎯 What Bloom Will Do

Once we have the above, Bloom will:

1. **Auto-generate invoices** after each completed session
2. **Submit Medicare claims** electronically (within 2 business days)
3. **Collect gap payments** via Stripe (card on file or invoice)
4. **Track claim status** and alert if rejected
5. **Generate reports** for BAS/tax time
6. **Pay practitioners** their share (if split arrangement)

### Bloom Practice Management Features:
- ✅ Client management (already built)
- ✅ Appointment scheduling (already built)
- ✅ Telehealth sessions (already built)
- 🔜 Invoicing & Medicare claiming (building now)
- 🔜 Financial reporting
- 🔜 Practitioner payouts

---

## ❓ Questions to Discuss

1. **Claiming timing:** Submit claims same-day or batch weekly?
2. **Client notifications:** Email receipt immediately or next day?
3. **Failed claims:** Who handles rejections - admin or practitioner?
4. **Cancellation fees:** Do you charge for late cancellations? Medicare or private only?
5. **Practitioner payments:** How do you split revenue with contractors?

---

## 📞 Next Steps

1. **Today**: Gather PRODA credentials and practitioner details
2. **Send to Julian**: Use secure method (not email) for credentials
3. **This week**: Julian builds Medicare claiming integration
4. **Next week**: Test with real (small) claims
5. **Go live**: Full automated billing!

---

**Questions?** Call Julian or message in the team chat.

*Document created: January 29, 2026*  
*Bloom Practice Management - Replacing Halaxy*
