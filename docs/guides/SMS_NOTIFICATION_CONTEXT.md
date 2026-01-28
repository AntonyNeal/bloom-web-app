# SMS Notifications via Azure Communication Services with Infobip Messaging Connect

## Project Overview
This is the **bloom-web-app** project for Life Psychology Australia - a psychology practice booking and management platform. The workspace is at `c:\Repos\bloom-web-app`.

## Current Task
We're implementing SMS notifications for appointment bookings and reminders using **Azure Communication Services (ACS)** with **Infobip Messaging Connect**. This routes SMS through ACS to Infobip for delivery.

## Notification Schedule
- **On booking**: Admin, Clinician, Patient all get email + SMS
- **24 hours before**: Patient only gets email + SMS reminder
- **1 hour before**: Clinician only gets email + SMS reminder

## Key Files
- `api/src/services/sms.ts` - SMS service using ACS SDK with Messaging Connect
- `api/src/services/email.ts` - Email notifications via ACS Email
- `api/src/functions/send-appointment-reminders.ts` - Timer function (hourly) for reminders
- `api/src/functions/process-booking-notification.ts` - Queue-triggered notification processor
- `api/local.settings.json` - Local environment variables

## Configuration
- **ACS Connection String**: `ACS_CONNECTION_STRING` env var
- **Infobip API Key**: `INFOBIP_API_KEY` = `d7ed961b8f77e8564ee7e7aa6fd202c5-eba739a4-7954-429e-8558-3e717edc9313`
- **From Number**: `SMS_FROM_NUMBER` = `+61480800867` (Infobip number)
- **ACS Resource**: `lpa-communication-service`
- **SDK**: `@azure/communication-sms@1.2.0-beta.4`

## Current Status ✅
**Messaging Connect integration initiated on 2026-01-22**

The Infobip phone number is being linked to Azure Communication Services via Messaging Connect:
- Connection requested in Infobip portal
- Number: `+61 480 800 867` linked to ACS resource `lpa-communication-service`
- Azure immutable resource ID: `ac038cf5-54bf-4fef-82a3-d0bc810f9c1`
- **Allow up to 24 hours** for the connection to complete

Once complete, the number will appear in Azure Portal → Phone numbers with Infobip as the operator.

## Previous Issue (Resolved)
Direct Infobip API calls were returning `REJECTED_NETWORK` with error `EC_ACCOUNT_NOT_PROVISIONED_FOR_SMS` because the Infobip account wasn't connected to ACS via Messaging Connect.

## Code Status
The current `sms.ts` implementation is correct and ready:
```javascript
client.send({
  from: '+61480800867',
  to: ['+61401527587'],
  message: 'Test message'
}, {
  enableDeliveryReport: true,
  messagingConnect: {
    apiKey: infobipApiKey,
    partner: 'infobip'
  }
});
```

## What Was Recently Changed
1. Updated `sms.ts` to use ACS SDK with `messagingConnect` option instead of direct Infobip API
2. Added `getAppointmentTypeDisplay()` helper to properly show all appointment types (Standard, Medicare, Couples, NDIS)
3. Updated reminder schedule - removed clinician 24h reminders, removed admin 1h reminders
4. **Connected Infobip account to ACS via Messaging Connect in Azure Portal**

## Next Steps
1. Wait for Messaging Connect sync to complete (up to 24 hours)
2. Verify number appears in Azure Portal → Phone numbers
3. Test SMS sending via the Azure Function

## Admin Phone for Testing
Julian's phone: `0401527587` (or `+61401527587`)

## Appointment Types
The booking form sends these values:
- `psychologist-session` → displays as "Standard" (clinician) / "Psychology session" (patient)
- `medicare-psychologist-session` → displays as "Medicare" / "Medicare Psychology session"
- `couples-session` → displays as "Couples" / "Couples session"
- `ndis-psychology-session` → displays as "NDIS" / "NDIS session"

## Deployment
- Azure Function App: `bloom-functions-dev`
- Deployment: GitHub Actions workflow on push to `develop` branch
- GitHub repo: `AntonyNeal/bloom-web-app`
