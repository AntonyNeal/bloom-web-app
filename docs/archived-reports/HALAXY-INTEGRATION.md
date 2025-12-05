# Halaxy Direct Booking Integration

Complete integration for direct appointment booking through your website using Halaxy API.

## Overview

This integration allows users to book appointments directly on your website without being redirected to Halaxy's booking widget. The system:

1. **Collects patient details** via a multi-step form
2. **Creates appointments** via Halaxy API (secure server-side)
3. **Tracks conversions** with GA4 and Google Ads
4. **Receives webhooks** for booking confirmations

## Architecture

```
Frontend (React)
  ├── BookingModal.tsx - Modal wrapper
  ├── BookingForm.tsx - 3-step booking form
  └── halaxyClient.ts - API wrapper

Azure Function (create-halaxy-booking)
  ├── Authenticates with Halaxy OAuth
  ├── Creates/finds patient
  ├── Books appointment
  └── Stores session for webhook tracking

Halaxy Webhook (halaxy-webhook)
  └── Receives confirmation and fires GA4 purchase event
```

## Setup Instructions

### 1. Get Halaxy API Credentials

1. Go to [Halaxy Developer Portal](https://developers.halaxy.com)
2. Purchase API subscription in Add-ons
3. Create API Key and copy:
   - Client ID
   - Client Secret

### 2. Get Halaxy Resource IDs

You need these specific IDs from your Halaxy account:

#### Get Practitioner Role ID:

```bash
curl --location 'https://au-api.halaxy.com/main/PractitionerRole' \
  --header 'Accept: application/fhir+json' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Look for your practitioner role ID (format: `PR-1234567`)

#### Get Healthcare Service ID:

```bash
curl --location 'https://au-api.halaxy.com/main/HealthcareService' \
  --header 'Accept: application/fhir+json' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

Look for your service ID (typically a number like `33`)

#### Get Charge Item Definition ID (optional):

```bash
curl --location 'https://au-api.halaxy.com/main/ChargeItemDefinition' \
  --header 'Accept: application/fhir+json' \
  --header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 3. Configure Azure Function

Add these environment variables to your Azure Function App settings:

```bash
HALAXY_CLIENT_ID=<your_client_id>
HALAXY_CLIENT_SECRET=<your_client_secret>
HALAXY_BASE_URL=https://au-api.halaxy.com/main
HALAXY_PRACTITIONER_ROLE_ID=PR-1234567
HALAXY_HEALTHCARE_SERVICE_ID=33
HALAXY_CHARGE_ITEM_DEFINITION_ID=123456  # Optional
HALAXY_APP_VENDOR=LifePsychologyAustralia (info@lifepsychology.com.au)
```

#### Using Azure Portal:

1. Go to Azure Portal → Function App
2. Settings → Configuration
3. Add each variable under "Application settings"
4. Click "Save"

#### Using Azure CLI:

```bash
az functionapp config appsettings set \
  --name lpa-halaxy-webhook-handler \
  --resource-group your-resource-group \
  --settings \
    HALAXY_CLIENT_ID="your_client_id" \
    HALAXY_CLIENT_SECRET="your_client_secret" \
    HALAXY_PRACTITIONER_ROLE_ID="PR-1234567" \
    HALAXY_HEALTHCARE_SERVICE_ID="33"
```

### 4. Configure Frontend

Add to your `.env` file:

```bash
VITE_HALAXY_BOOKING_FUNCTION_URL=https://lpa-halaxy-webhook-handler.azurewebsites.net/api/create-halaxy-booking?code=YOUR_FUNCTION_KEY
```

To get the function key:

1. Azure Portal → Function App → Functions → create-halaxy-booking
2. Function Keys → Show values
3. Copy the default key

### 5. Deploy Azure Function

```bash
cd azure-functions-project

# Install dependencies
npm install

# Deploy to Azure
func azure functionapp publish lpa-halaxy-webhook-handler
```

### 6. Test the Integration

#### Local Development:

```bash
# Terminal 1: Start Azure Functions locally
cd azure-functions-project
npm install
func start

# Terminal 2: Start React dev server
npm run dev
```

Then:

1. Open http://localhost:5173
2. Click "Book Now"
3. Fill out the booking form
4. Submit and check console logs

#### Production Testing:

1. Deploy to staging
2. Test booking flow end-to-end
3. Check Halaxy calendar for appointment
4. Verify webhook fired (check Azure Function logs)
5. Verify GA4 conversion event

## Usage

### Opening the Booking Modal

The booking modal is automatically integrated into `UnifiedHeader` and will open when users click "Book Now".

To add it to other components:

```tsx
import { useState } from 'react';
import { BookingModal } from '../components/BookingModal';

function MyComponent() {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <>
      <button onClick={() => setShowBooking(true)}>Book Appointment</button>

      <BookingModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
      />
    </>
  );
}
```

## API Reference

### Create Booking Endpoint

**URL:** `POST /api/create-halaxy-booking`

**Request Body:**

```json
{
  "patient": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "0400000000",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "appointmentDetails": {
    "startTime": "2025-10-15T15:00:00+10:00",
    "endTime": "2025-10-15T16:00:00+10:00",
    "minutesDuration": 60,
    "notes": "First session"
  },
  "sessionData": {
    "client_id": "GA.1.xxxxx",
    "session_id": "xxxxx",
    "utm_source": "google",
    "gclid": "xxxxx"
  }
}
```

**Response (Success):**

```json
{
  "success": true,
  "appointmentId": "12345",
  "patientId": "67890",
  "bookingSessionId": "uuid-here",
  "message": "Appointment booked successfully"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Troubleshooting

### "Failed to authenticate with Halaxy API"

- Verify `HALAXY_CLIENT_ID` and `HALAXY_CLIENT_SECRET` are correct
- Check they're properly set in Azure Function App settings
- Ensure you have an active Halaxy API subscription

### "Failed to create appointment in Halaxy"

- Verify `HALAXY_PRACTITIONER_ROLE_ID` matches your account
- Check `HALAXY_HEALTHCARE_SERVICE_ID` exists
- Ensure the appointment time is in the future
- Check Azure Function logs for detailed error

### Booking modal doesn't open

- Check browser console for errors
- Verify `VITE_HALAXY_BOOKING_FUNCTION_URL` is set
- Ensure BookingModal is imported and rendered

### Appointments not appearing in Halaxy

- Check Azure Function logs in Azure Portal
- Verify API credentials are correct
- Test authentication with curl command
- Check Halaxy calendar filters

## Monitoring

### Azure Function Logs

View in Azure Portal:

1. Function App → Functions → create-halaxy-booking
2. Monitor → Logs

Or using Azure CLI:

```bash
func azure functionapp logstream lpa-halaxy-webhook-handler
```

### GA4 Events

Check in GA4:

- Event: `booking_completed`
- Parameters: `transaction_id`, `value`, `currency`

### Google Ads Conversions

Check in Google Ads:

- Conversion: "Booking Conversion"
- Label: Update in `halaxyClient.ts` line 175

## Real-Time Availability Integration

### Overview

The booking calendar now fetches **real available appointment slots** from Halaxy using the `Appointment/$find` operation.

### Components

#### 1. TimeSlotCalendar Component (`src/components/TimeSlotCalendar.tsx`)

Visual week-view calendar showing available slots:

**Props**:

- `duration?: number` - Appointment duration in minutes (default: 60)
- `practitionerId?: string` - Filter by specific practitioner
- `onSelectSlot: (date, time) => void` - Callback when slot selected

**Features**:

- Fetches real availability from Halaxy
- Week navigation (previous/next)
- Visual states: Available (blue), Selected (gradient), Booked (gray)
- Loading and error states
- Responsive grid layout

#### 2. Availability Service (`src/utils/halaxyAvailability.ts`)

Client-side utility for fetching availability:

```typescript
import { fetchAvailableSlots } from '../utils/halaxyAvailability';

const slots = await fetchAvailableSlots({
  startDate: new Date('2025-11-04'),
  endDate: new Date('2025-11-11'),
  duration: 60,
  practitionerId: 'optional-practitioner-id',
});
```

**Fallback**: Uses mock data if API unavailable (70% random availability, weekdays only).

#### 3. Azure Function (`azure-functions-project/get-halaxy-availability`)

Server-side handler for Halaxy API:

**Endpoint**: `GET /api/halaxy/availability`

**Query Parameters**:

- `start` (required): ISO 8601 datetime (e.g., "2025-11-04T00:00:00Z")
- `end` (required): ISO 8601 datetime
- `duration` (required): Duration in minutes (e.g., "60")
- `practitioner` (optional): Practitioner ID
- `organization` (optional): Organization ID
- `show` (optional): "first-available"
- `apply-buffer-time` (optional): Apply buffer time settings

**Response**: FHIR Bundle with Slot resources

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 42,
  "entry": [
    {
      "resource": {
        "resourceType": "Slot",
        "start": "2025-11-04T09:00:00Z",
        "end": "2025-11-04T10:00:00Z",
        "status": "free"
      }
    }
  ]
}
```

### Configuration

Add to `.env.local`:

```bash
# Frontend - URL to Azure Function
VITE_AVAILABILITY_FUNCTION_URL=http://localhost:7071/api/halaxy/availability
```

Add to `azure-functions-project/local.settings.json`:

```json
{
  "Values": {
    "HALAXY_CLIENT_ID": "your_client_id",
    "HALAXY_CLIENT_SECRET": "your_client_secret",
    "HALAXY_PRACTITIONER_ID": "your_practitioner_id",
    "HALAXY_ORGANIZATION_ID": "your_organization_id"
  }
}
```

### Halaxy Online Booking Preferences

The availability respects your Halaxy Online Booking Preferences:

- **Buffer Time**: Minimum time between appointments
- **Lead Time**: Minimum notice required before booking
- **Advance Booking Limit**: How far ahead bookings are allowed

To configure in Halaxy:

1. Settings → Online Booking Preferences
2. Set per practitioner/location
3. Changes automatically apply to calendar

### Testing Availability

1. **Start Azure Functions**:

   ```bash
   cd azure-functions-project
   npm start
   ```

2. **Test endpoint directly**:

   ```bash
   curl "http://localhost:7071/api/halaxy/availability?start=2025-11-04T00:00:00Z&end=2025-11-11T00:00:00Z&duration=60"
   ```

3. **Open booking modal**:
   - Navigate to http://localhost:5173
   - Click "Book Now"
   - Go to Step 2 (Date/Time)
   - Calendar loads real Halaxy availability

### Troubleshooting

**Calendar shows "Unavailable"**:

- Check `VITE_AVAILABILITY_FUNCTION_URL` is set
- Verify Azure Function is running
- Check browser console for errors

**"Failed to fetch availability"**:

- Check Azure Function logs
- Verify Halaxy credentials
- Test OAuth token retrieval
- Check Halaxy API status

**No slots showing**:

- Verify practitioner has available times in Halaxy
- Check Online Booking Preferences aren't too restrictive
- Ensure lead time settings allow current date range

## Security Notes

- **Never commit API credentials** to git
- **Use Azure Key Vault** for production secrets (recommended)
- **HTTPS only** - function enforces HTTPS in production
- **CORS configured** - update allowed origins in production
- **Function keys** - rotate regularly for security

## Support

For issues or questions:

1. Check Azure Function logs
2. Review Halaxy API documentation
3. Test with curl commands
4. Contact Halaxy support if API issues persist

---

**Last Updated:** 2025-11-04
**Author:** Life Psychology Australia Development Team
