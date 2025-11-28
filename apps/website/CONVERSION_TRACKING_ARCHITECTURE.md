# LPA Conversion Tracking Architecture

## Overview

This document defines the normalized conversion tracking architecture for Life Psychology Australia (LPA) web application. The system is designed to provide comprehensive marketing analytics through Google Tag Manager (GTM) and Google Ads integration.

## Architecture Principles

1. **Single Source of Truth**: All tracking flows through a unified `ConversionManager`
2. **Funnel-Based Design**: Events organized by user journey stage
3. **GTM-First Approach**: Push to dataLayer, let GTM handle tag firing
4. **Consistent Taxonomy**: Standardized event names and parameters
5. **Privacy-Compliant**: GCLID handling and consent awareness

## User Funnel Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LPA CONVERSION FUNNEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AWARENESS          INTEREST           DECISION         ACTION    RETENTION │
│  ─────────          ────────           ────────         ──────    ───────── │
│                                                                             │
│  page_view    →   service_view   →   booking_intent → booking_  → session_ │
│  landing_view     psychologist_      booking_start    complete    feedback  │
│                   view                                             rebooking │
│                   faq_view                                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        BOOKING WORKFLOW                              │  │
│  │                                                                      │  │
│  │  booking_start → details_complete → datetime_selected → payment_    │  │
│  │                                                          initiated  │  │
│  │                                                              ↓       │  │
│  │                                                        booking_      │  │
│  │                                                        confirmed     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Taxonomy

### Naming Convention
- Format: `{action}_{object}` (e.g., `view_service`, `start_booking`)
- All lowercase with underscores
- Verbs first, then nouns

### Standard Parameters
All events include these base parameters:

```typescript
interface BaseEventParams {
  event_timestamp: number;      // Unix timestamp
  page_path: string;            // Current page path
  page_title: string;           // Current page title
  user_intent_score?: number;   // 0-100 intent score
  session_id?: string;          // GA4 session ID
  client_id?: string;           // GA4 client ID
}
```

### Event Definitions

#### 1. Awareness Stage Events

| Event | Description | Key Parameters |
|-------|-------------|----------------|
| `page_view` | Standard page view | `page_path`, `page_title`, `referrer` |
| `landing_view` | Landing page view | `landing_variant`, `utm_source`, `utm_medium`, `utm_campaign` |

#### 2. Interest Stage Events

| Event | Description | Key Parameters |
|-------|-------------|----------------|
| `view_service` | Service page viewed | `service_type`, `service_slug` |
| `view_psychologist` | Psychologist profile viewed | `psychologist_id`, `psychologist_name` |
| `view_faq` | FAQ item expanded | `faq_question`, `faq_category` |
| `scroll_depth` | Page scroll milestone | `scroll_percentage` (25, 50, 75, 90) |
| `time_on_page` | Time threshold reached | `time_seconds` (30, 60, 120, 300) |

#### 3. Decision Stage Events

| Event | Description | Key Parameters |
|-------|-------------|----------------|
| `booking_intent` | Strong booking signal | `intent_source`, `intent_score` |
| `click_book_now` | Book Now button clicked | `button_location`, `service_type` |
| `click_phone` | Phone number clicked | `phone_number`, `click_location` |
| `submit_contact_form` | Contact form submitted | `form_type`, `has_phone`, `has_email` |

#### 4. Action Stage Events (Booking Workflow)

| Event | Description | Key Parameters |
|-------|-------------|----------------|
| `start_booking` | Booking form opened | `entry_point`, `service_preselected` |
| `complete_details` | User details submitted | `has_returning_user`, `appointment_type` |
| `select_datetime` | Date/time selected | `days_in_advance`, `time_slot_type` |
| `initiate_payment` | Payment step reached | `payment_method`, `booking_value` |
| `confirm_booking` | Booking confirmed | `booking_id`, `booking_value`, `psychologist_id` |
| `complete_booking` | Success page reached | `transaction_id`, `booking_value`, `is_first_booking` |

#### 5. Retention Stage Events

| Event | Description | Key Parameters |
|-------|-------------|----------------|
| `submit_feedback` | Session feedback given | `rating`, `feedback_type` |
| `start_rebooking` | Rebooking initiated | `previous_booking_id`, `days_since_last` |

## Google Ads Conversion Mapping

### Primary Conversions (Offline Import)
| Conversion Name | Trigger | Value | Attribution |
|-----------------|---------|-------|-------------|
| `Booking Completed` | `complete_booking` | $250 | Last Click |
| `Contact Form Lead` | `submit_contact_form` | $50 | Last Click |
| `Phone Call Lead` | `click_phone` | $75 | Last Click |

### Micro-Conversions (Online)
| Conversion Name | Trigger | Value |
|-----------------|---------|-------|
| `Booking Intent` | `booking_intent` | $10 |
| `Book Now Click` | `click_book_now` | $25 |
| `Service Page View` | `view_service` | $5 |

## DataLayer Schema

All events push to `window.dataLayer` with this structure:

```typescript
interface DataLayerEvent {
  event: string;                    // Event name
  event_category: string;           // Funnel stage
  event_action: string;             // Specific action
  event_label?: string;             // Optional label
  event_value?: number;             // Monetary value (cents)
  
  // Custom dimensions
  lpa_service_type?: string;
  lpa_psychologist_id?: string;
  lpa_booking_step?: string;
  lpa_intent_score?: number;
  
  // Ecommerce (for booking events)
  ecommerce?: {
    currency: 'AUD';
    value: number;
    items?: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      price: number;
      quantity: number;
    }>;
  };
  
  // User data (for enhanced conversions)
  user_data?: {
    email_address?: string;  // SHA256 hashed
    phone_number?: string;   // E.164 format, hashed
  };
}
```

## GTM Container Configuration

### Tags Required
1. **GA4 Configuration Tag** - Base configuration
2. **GA4 Event Tags** - One per event category
3. **Google Ads Conversion Tag** - For primary conversions
4. **Google Ads Remarketing Tag** - For audience building

### Triggers
- Custom Event triggers matching dataLayer events
- Scroll Depth trigger (built-in)
- Timer trigger for time-on-page

### Variables
- DataLayer Variables for all custom parameters
- First-Party Cookie Variable for client_id
- URL Variables for UTM parameters

## File Structure

```
apps/website/src/
├── tracking/
│   ├── index.ts                    # Public exports
│   ├── ConversionManager.ts        # Main orchestrator
│   ├── events/
│   │   ├── awareness.ts            # Awareness stage events
│   │   ├── interest.ts             # Interest stage events
│   │   ├── decision.ts             # Decision stage events
│   │   ├── booking.ts              # Booking workflow events
│   │   └── retention.ts            # Retention stage events
│   ├── core/
│   │   ├── dataLayer.ts            # DataLayer utilities
│   │   ├── session.ts              # Session management
│   │   └── consent.ts              # Consent handling
│   └── types.ts                    # TypeScript definitions
```

## Implementation Priority

### Phase 1: Foundation (This PR)
- [x] Architecture documentation
- [ ] ConversionManager class
- [ ] Booking workflow integration
- [ ] DataLayer normalization

### Phase 2: Enhancement
- [ ] Intent scoring refinement
- [ ] Enhanced conversions setup
- [ ] Offline conversion import

### Phase 3: Optimization
- [ ] A/B test integration
- [ ] Custom audiences
- [ ] Attribution modeling

## Testing Checklist

- [ ] All events fire in development console
- [ ] GTM Preview shows correct dataLayer pushes
- [ ] GA4 DebugView receives events
- [ ] Google Ads Tag Assistant validates conversions
- [ ] Cross-domain tracking works with Halaxy

## Related Documentation

- [Google Ads Conversion Tracking](https://support.google.com/google-ads/answer/6095821)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [GTM DataLayer Guide](https://developers.google.com/tag-platform/tag-manager/datalayer)
