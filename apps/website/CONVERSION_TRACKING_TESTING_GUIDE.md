# Conversion Tracking Testing Guide

## Overview

This guide helps validate that the unified conversion tracking system is working correctly in development mode.

## Quick Validation Steps

### 1. Open Browser Developer Tools

1. Navigate to the site in development mode
2. Open DevTools (F12)
3. Go to Console tab
4. Filter by "tracking" or look for `[Tracking]` prefixed logs

### 2. Validate DataLayer Events

In the console, run:
```javascript
// Check if dataLayer exists
console.log(window.dataLayer);

// View all events pushed
window.dataLayer.forEach((event, i) => console.log(i, event));
```

### 3. Test Booking Funnel Tracking

#### Step 1: Booking Start
- Click any "Book Now" button
- **Expected**: `booking_started` event in dataLayer
- **Console log**: `[Tracking] Booking started`

#### Step 2: Details Completion
- Fill in personal details form
- Click Next
- **Expected**: `details_completed` event in dataLayer
- **Parameters**: firstName, lastName, email, appointmentType

#### Step 3: DateTime Selection  
- Select an appointment date and time
- Click Next
- **Expected**: `datetime_selected` and `payment_initiated` events
- **Parameters**: selectedDate, selectedTime, booking_value

#### Step 4: Payment
- Complete Stripe payment (test mode)
- **Expected**: `booking_confirmed` event
- **Parameters**: booking_value, appointment_type

#### Step 5: Booking Completion
- Booking is finalized
- **Expected**: `booking_completed` event (PRIMARY CONVERSION)
- **Parameters**: bookingId, transaction_id, booking_value

### 4. Validate Google Ads Conversion

Check that `gtag('event', 'conversion', {...})` is called:
```javascript
// In console, monitor gtag calls
const originalGtag = window.gtag;
window.gtag = function() {
  console.log('[gtag]', arguments);
  originalGtag.apply(this, arguments);
};
```

### 5. Session & Attribution Tracking

Verify GCLID capture (if arriving from Google Ads):
```javascript
// Check stored GCLID
localStorage.getItem('lpa_gclid');

// Check UTM parameters
localStorage.getItem('lpa_utm_source');
localStorage.getItem('lpa_utm_medium');
localStorage.getItem('lpa_utm_campaign');
```

## DataLayer Event Schema

### booking_started
```json
{
  "event": "booking_started",
  "funnel_stage": "start",
  "entry_point": "booking_modal",
  "timestamp": "2025-11-28T10:30:00Z"
}
```

### details_completed
```json
{
  "event": "details_completed", 
  "funnel_stage": "details",
  "firstName": "John",
  "email": "john@example.com",
  "appointmentType": "individual-therapy"
}
```

### datetime_selected
```json
{
  "event": "datetime_selected",
  "funnel_stage": "datetime",
  "selectedDate": "2025-12-01",
  "selectedTime": "10:00"
}
```

### payment_initiated
```json
{
  "event": "payment_initiated",
  "funnel_stage": "payment",
  "payment_method": "card",
  "booking_value": 250
}
```

### booking_confirmed
```json
{
  "event": "booking_confirmed",
  "funnel_stage": "confirm",
  "booking_value": 250,
  "appointment_type": "individual-therapy"
}
```

### booking_completed (PRIMARY CONVERSION)
```json
{
  "event": "booking_completed",
  "funnel_stage": "complete",
  "bookingId": "apt_12345",
  "transaction_id": "lpa_apt_12345_1701168600000",
  "booking_value": 250,
  "is_first_booking": true
}
```

## Google Tag Manager Setup

Ensure GTM is configured with these triggers:

| Trigger Name | Event Name | Conversion Type |
|-------------|------------|-----------------|
| Booking Started | booking_started | Micro-conversion |
| Details Completed | details_completed | Micro-conversion |
| DateTime Selected | datetime_selected | Micro-conversion |
| Payment Initiated | payment_initiated | Micro-conversion |
| Booking Confirmed | booking_confirmed | Secondary conversion |
| Booking Completed | booking_completed | **Primary conversion** |
| Booking Abandoned | booking_abandoned | Engagement signal |

## Google Ads Conversion Configuration

- **Conversion ID**: AW-11563740075
- **Conversion Label**: FqhOCKymqUbEKvXgoor (for booking_completed)
- **Conversion Value**: Dynamic (booking_value parameter)
- **Currency**: AUD

## Troubleshooting

### Events not appearing in dataLayer
1. Check that `conversionManager.initialize()` is called in App.tsx
2. Verify the tracking module is imported correctly
3. Check for JavaScript errors in console

### GCLID not captured
1. Ensure URL contains `gclid=` parameter
2. Check `initializeSession()` runs on page load
3. Verify localStorage is available

### Abandonment not tracking
1. Check component unmount effect in BookingForm
2. Verify step state is not 'success' before unmount

## Files Reference

- **Architecture**: `apps/website/CONVERSION_TRACKING_ARCHITECTURE.md`
- **Types**: `apps/website/src/tracking/types.ts`
- **Core Manager**: `apps/website/src/tracking/ConversionManager.ts`
- **Booking Events**: `apps/website/src/tracking/events/booking.ts`
- **DataLayer Utils**: `apps/website/src/tracking/core/dataLayer.ts`
- **Session Utils**: `apps/website/src/tracking/core/session.ts`
