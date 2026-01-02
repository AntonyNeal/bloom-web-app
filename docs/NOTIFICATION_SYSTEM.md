# Clinician Notification System

## Status: ⚠️ Partially Operational

| Channel | Status | Notes |
|---------|--------|-------|
| **Email** | ✅ Working | Via Azure Communication Services |
| **SMS** | ❌ Blocked | Awaiting phone number provisioning |

---

## Architecture Overview

Queue-based async notification system that does **not block** booking success.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Booking Flow                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Create patient in Halaxy (sync)                             │
│  2. Create appointment in Halaxy (sync)                         │
│  3. Queue notification message (fire-and-forget)                │
│  4. Return success to user immediately                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Queue Trigger (async)                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch practitioner contact from Halaxy                      │
│     - Phone: PractitionerRole.telecom                           │
│     - Email: Practitioner.telecom                               │
│  2. Send SMS notification (if configured)                       │
│  3. Send email notification                                     │
│  4. Log results to Application Insights                         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Non-blocking**: Notification failures do NOT cancel bookings
2. **Queue-based**: Azure Storage Queue for reliability and retry
3. **Halaxy as source of truth**: Contact info fetched at notification time
4. **Both channels attempted**: SMS and email are independent

---

## Implementation Files

| File | Purpose |
|------|---------|
| `api/src/services/notifications/types.ts` | Type definitions |
| `api/src/services/notifications/queue.ts` | Queue service for sending messages |
| `api/src/functions/process-booking-notification.ts` | Queue trigger function |
| `api/src/functions/create-halaxy-booking.ts` | Booking flow (queues notification) |
| `api/src/services/sms.ts` | SMS service (ACS) |
| `api/src/services/email.ts` | Email service (ACS) |

---

## SMS Provisioning Blocker

### Issue
Cannot purchase Australian SMS number through Azure Communication Services / Infobip.

### Error
> "The company listed in the request is not showing up when searching the provided address."

### Root Cause
Azure/Infobip business verification requires the registered business address to match exactly with their database lookup. ASIC registration for "LIFE PSYCHOLOGY AUSTRALIA" does not include a full street address.

### Attempted
- Company: LIFE PSYCHOLOGY AUSTRALIA
- Address: 98 Grandview Road New Lambton Heights

### ASIC Registration Details
- Business name: LIFE PSYCHOLOGY AUSTRALIA
- ABN: 46 995 459 452
- Principal place of business: New Lambton Heights NSW 2305 (no street)
- Service address: PO Box 2124, Wallsend South NSW 2287

### Options to Resolve
1. **Update ASIC registration** - Add full street address to business registration
2. **Contact Azure Support** - Request manual business verification
3. **Use Twilio** - Alternative provider with different verification process
4. **Use alphanumeric sender ID** - Some providers allow sending without a number (receive-only not supported)

---

## Configuration

### Environment Variables

```bash
# Azure Communication Services (Email - Working)
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING=endpoint=https://lpa-communication-service...

# SMS (Not yet configured)
SMS_SENDER_ID=LifePsych  # Alphanumeric sender ID (fallback)

# Queue
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=lpaunified...
```

### Azure Resources

| Resource | Name | Status |
|----------|------|--------|
| Communication Services | lpa-communication-service | ✅ Active |
| Email Domain | life-psychology.com.au | ✅ Verified |
| SMS Number | - | ❌ Not provisioned |
| Storage Queue | booking-notifications | ✅ Created |

---

## Testing

### Trigger a notification manually

```powershell
# Create a test booking via the API
$body = @{
  patient = @{
    firstName = "Test"
    lastName = "Patient"
    email = "test@example.com"
  }
  appointmentDetails = @{
    startTime = "2025-01-02T10:00:00"
    endTime = "2025-01-02T11:00:00"
  }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "https://bloom-functions-dev.azurewebsites.net/api/create-halaxy-booking" `
  -Method POST -Body $body -ContentType "application/json"
```

### Check queue messages

```bash
az storage message peek --queue-name booking-notifications --account-name lpaunified --num-messages 5
```

### View logs

Check Application Insights for `[NotificationQueue]` log entries.

---

## Next Steps

1. Resolve SMS number provisioning (see options above)
2. Once number acquired, update `AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING` or configure Twilio
3. Test end-to-end SMS delivery
4. Deploy to staging and production

---

## Commit History

- `f5bf944` - feat(notifications): implement queue-based notification system
- `aa0f924` - fix(notifications): handle auto-parsed queue messages

---

*Last updated: 2025-12-31*
