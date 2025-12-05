# Complete Booking System - Component Specification

## Overview

A comprehensive React-based booking system featuring a multi-step modal form with an integrated weekly time slot calendar. The system handles the complete booking flow from patient details collection to appointment confirmation with Halaxy API integration.

## System Components

1. **BookingModal** - Modal wrapper with overlay
2. **BookingForm** - Multi-step form orchestrator (3 steps + success/error states)
3. **TimeSlotCalendar** - Weekly calendar for time selection
4. **HalaxyClient** - API client for Halaxy integration

---

# Part 1: Booking Modal & Form System

---

# Part 1: Booking Modal & Form System

## 1.1 BookingModal Component

### Purpose

Provides a modal overlay wrapper for the booking form, managing open/close state and backdrop clicks.

### Component Props

```typescript
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### Features

- **Fixed overlay**: Full-screen dark backdrop (50% opacity)
- **Centered modal**: Responsive sizing (max-width: 768px on desktop)
- **Close button**: Top-right X button
- **Click-outside**: Clicking backdrop closes modal
- **Scroll handling**: Full-height scrollable content
- **Z-index layering**: z-50 for overlay, z-10 for content

### Visual Structure

```
┌──────────────────────────────────────────────────┐
│ [Dark Overlay - 50% opacity]                     │
│   ┌──────────────────────────────────────┐ [X]   │
│   │                                      │       │
│   │     [BookingForm Component]          │       │
│   │                                      │       │
│   │                                      │       │
│   └──────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

### Styling

```css
/* Overlay */
position: fixed
inset: 0
background: rgba(107, 114, 128, 0.75) /* gray-500 */
z-index: 50

/* Modal Container */
position: fixed
inset: 0
overflow-y: auto
z-index: 10

/* Modal Panel */
max-width: 768px /* 3xl */
background: white
border-radius: 0.5rem
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### Implementation Example

```tsx
import { BookingModal } from './components/BookingModal';

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsBookingOpen(true)}>Book Appointment</button>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}
```

---

## 1.2 BookingForm Component

### Purpose

Multi-step wizard form that collects patient information, appointment details, and time selection, then submits to Halaxy API.

### Workflow Steps

1. **details** - Patient information (name, email, phone, DOB, gender)
2. **datetime** - Appointment type, calendar time selection, notes
3. **confirm** - Review all details before submission
4. **success** - Confirmation with appointment ID
5. **error** - Error handling with retry option

### Component Props

```typescript
interface BookingFormProps {
  onSuccess?: (appointmentId: string) => void;
  onCancel?: () => void;
}
```

### State Management

```typescript
// Step progression
const [step, setStep] = useState<
  'details' | 'datetime' | 'confirm' | 'success' | 'error'
>('details');

// Loading/Error
const [loading, setLoading] = useState<boolean>(false);
const [errorMessage, setErrorMessage] = useState<string>('');

// Form data
const [firstName, setFirstName] = useState<string>('');
const [lastName, setLastName] = useState<string>('');
const [email, setEmail] = useState<string>('');
const [phone, setPhone] = useState<string>('');
const [dateOfBirth, setDateOfBirth] = useState<string>('');
const [gender, setGender] = useState<'male' | 'female' | 'other' | 'unknown'>(
  'unknown'
);
const [appointmentType, setAppointmentType] = useState<string>('');
const [appointmentDate, setAppointmentDate] = useState<string>(''); // YYYY-MM-DD
const [appointmentTime, setAppointmentTime] = useState<string>(''); // HH:MM:SS
const [notes, setNotes] = useState<string>('');
const [appointmentId, setAppointmentId] = useState<string>('');

// Validation
const [errors, setErrors] = useState<Record<string, string>>({});
```

---

### Step 1: Patient Details

#### Fields

| Field         | Type   | Required | Validation                   | Placeholder              |
| ------------- | ------ | -------- | ---------------------------- | ------------------------ |
| First Name    | text   | Yes      | Non-empty                    | "John"                   |
| Last Name     | text   | Yes      | Non-empty                    | "Smith"                  |
| Email         | email  | Yes      | Email format                 | "john.smith@example.com" |
| Phone         | tel    | No       | Australian phone format      | "0400 000 000"           |
| Date of Birth | date   | No       | -                            | -                        |
| Gender        | select | No       | male\|female\|other\|unknown | "Prefer not to say"      |

#### Validation Rules

```typescript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Australian phone validation
const phoneRegex = /^(\+61|0)[2-478](\s?\d){8}$/;
```

#### Layout

- **Grid**: 2 columns for First/Last name
- **Full width**: Email, Phone, DOB, Gender
- **Button bar**: Cancel (left) | Next (right, green when valid)

#### Visual States

- **Valid field**: Gray border
- **Invalid field**: Red border with error message below
- **Next button**:
  - Disabled (gray): Missing required fields
  - Enabled (green with shadow): All validations pass

---

### Step 2: Date & Time

#### Fields

| Field            | Type     | Required | Description                    |
| ---------------- | -------- | -------- | ------------------------------ |
| Appointment Type | select   | Yes      | Service selection with pricing |
| Time Slot        | calendar | Yes      | Interactive weekly calendar    |
| Notes            | textarea | No       | Additional patient notes       |

#### Appointment Types

```typescript
const appointmentTypes = [
  {
    value: 'psychologist-session',
    label: 'Psychologist Session - Online (60 mins) - $250.00',
  },
  {
    value: 'medicare-psychologist-session',
    label: 'Medicare Psychologist Session - Online (60 mins) - $250.00',
  },
  {
    value: 'couples-session',
    label: 'Couples Session - Online (60 mins) - $300.00',
  },
  {
    value: 'ndis-psychology-session',
    label: 'NDIS Psychology Session - Online (60 mins) - $232.99',
  },
];
```

#### TimeSlotCalendar Integration

```tsx
<TimeSlotCalendar
  onSelectSlot={(date, time) => {
    setAppointmentDate(date);
    setAppointmentTime(time);
  }}
  selectedDate={appointmentDate}
  selectedTime={appointmentTime}
  duration={60}
/>
```

#### Validation Rules

- Appointment type must be selected
- Date must be selected from calendar
- Time must be selected from calendar
- Date cannot be in the past

---

### Step 3: Confirmation

#### Display Format

Shows read-only summary in blue-tinted box:

```
┌─────────────────────────────────────────────┐
│ Please confirm your booking details:        │
│                                             │
│ Patient: John Smith                         │
│ Email: john.smith@example.com               │
│ Phone: 0400 000 000                         │
│ Appointment Type: Psychologist Session      │
│ Date & Time: Monday, 11 November 2025,      │
│              02:00 PM                       │
│ Notes: First visit                          │
└─────────────────────────────────────────────┘
```

#### Action Buttons

- **Back**: Returns to datetime step
- **Confirm Booking**: Submits to API (shows spinner when loading)

---

### Step 4: Success State

#### Display Elements

- **Green checkmark icon** (w-16 h-16)
- **Heading**: "Booking Confirmed!"
- **Subtext**: "Your appointment has been successfully booked."
- **Details box** (blue background):
  - Appointment ID
  - Date & Time (formatted)
  - Email confirmation notice
- **Close button**: Blue, triggers `onCancel`

#### Success Callback

```typescript
onSuccess?.(appointmentId);
```

---

### Step 5: Error State

#### Display Elements

- **Red warning icon** (w-16 h-16)
- **Heading**: "Booking Failed"
- **Error message**: `{errorMessage}`
- **Action buttons**:
  - Try Again: Returns to confirm step
  - Cancel: Closes modal

#### Error Handling

```typescript
catch (error) {
  setErrorMessage('An unexpected error occurred. Please try again.');
  setStep('error');
}
```

---

### Progress Indicator

Visual progress bar shown on steps 1-3:

```
┌────────────────────────────────────────────┐
│ 1. Your Details | 2. Date & Time | 3. Confirm │
│ [██████████░░░░░░░░░░░░░░░░░░░░░░]        │
└────────────────────────────────────────────┘
```

#### Width Calculations

- **Step 1 (details)**: 33%
- **Step 2 (datetime)**: 66%
- **Step 3 (confirm)**: 100%

---

## 1.3 HalaxyClient Utility

### Purpose

Singleton service class that handles all API communication with Azure Functions for Halaxy booking operations, including patient creation, appointment booking, and conversion tracking.

### Interfaces

```typescript
interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

interface AppointmentDetails {
  startTime: string; // ISO 8601: "2025-11-05T14:00:00+10:00"
  endTime: string; // ISO 8601: "2025-11-05T15:00:00+10:00"
  minutesDuration: number;
  notes?: string;
}

interface SessionData {
  client_id?: string; // GA4 client ID from _ga cookie
  session_id?: string; // GA4 session ID
  utm_source?: string; // Marketing source
  utm_medium?: string; // Marketing medium
  utm_campaign?: string; // Marketing campaign
  gclid?: string; // Google Click ID
}

interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  patientId?: string;
  bookingSessionId?: string;
  message?: string;
  error?: string;
}
```

### Core Methods

#### 1. Create Booking

```typescript
async createBooking(
  patient: PatientData,
  appointmentDetails: AppointmentDetails
): Promise<BookingResponse>
```

**Flow:**

1. Extract session data (GA4 tracking, UTM parameters)
2. POST to Azure Function endpoint
3. Parse response
4. Fire conversion tracking on success
5. Return result

**API Endpoint:**

```
POST /api/create-halaxy-booking

Body: {
  patient: PatientData,
  appointmentDetails: AppointmentDetails,
  sessionData: SessionData
}
```

#### 2. Session Data Collection

**Extract GA4 Client ID from Cookie:**

```typescript
private extractClientId(): string | null {
  const gaCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_ga='));

  const cookieValue = gaCookie.split('=')[1];
  const parts = cookieValue.split('.');

  // Format: GA1.1.{clientId}
  return parts.slice(2).join('.');
}
```

**Get GA4 Session ID:**

```typescript
private async getSessionId(): Promise<string | null> {
  return new Promise((resolve) => {
    gtag('get', 'G-XGGBRLPBKK', 'session_id', (sessionId) => {
      resolve(sessionId || null);
    });
  });
}
```

**Extract UTM Parameters:**

```typescript
private extractUtmParams(): Partial<SessionData> {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    gclid: urlParams.get('gclid')
  };
}
```

#### 3. Conversion Tracking

**Fire GA4 Conversion Event:**

```typescript
private fireBookingConversion(appointmentId: string): void {
  // GTM dataLayer push
  window.dataLayer.push({
    event: 'booking_completed',
    transaction_id: appointmentId,
    value: 250,
    currency: 'AUD'
  });

  // Google Ads conversion
  gtag('event', 'conversion', {
    send_to: 'AW-11563740075/BOOKING_CONVERSION_LABEL',
    transaction_id: appointmentId,
    value: 250,
    currency: 'AUD'
  });
}
```

#### 4. Validation Utilities

**Email Validation:**

```typescript
static validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Phone Validation (Australian):**

```typescript
static validatePhone(phone: string): boolean {
  // Format: +61 or 0, followed by 2-4 or 7-8, then 8 more digits
  return /^(\+61|0)[2-478](\s?\d){8}$/.test(phone.replace(/\s/g, ''));
}
```

**DateTime Formatting:**

```typescript
static formatDateTime(date: Date, timezone = '+10:00'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
}
```

### Environment Configuration

```env
VITE_HALAXY_BOOKING_FUNCTION_URL=https://your-function-app.azurewebsites.net/api/create-halaxy-booking
```

### Usage Example

```typescript
import { halaxyClient } from '../utils/halaxyClient';

const patientData = {
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  phone: '0400 000 000',
  gender: 'male' as const,
};

const startDateTime = new Date('2025-11-10T14:00:00');
const endDateTime = new Date('2025-11-10T15:00:00');

const appointmentData = {
  startTime: HalaxyClient.formatDateTime(startDateTime),
  endTime: HalaxyClient.formatDateTime(endDateTime),
  minutesDuration: 60,
  notes: 'First appointment',
};

const result = await halaxyClient.createBooking(patientData, appointmentData);

if (result.success) {
  console.log('Booking created:', result.appointmentId);
} else {
  console.error('Booking failed:', result.error);
}
```

---

# Part 2: Time Slot Calendar Component

## Component Name

`TimeSlotCalendar`

### Core Functionality

1. **Weekly Grid Display**: Shows 7 days (Monday-Sunday) in a column-based grid
2. **Aligned Time Slots**: All days display the same time slots in vertical alignment
3. **Week Navigation**: Previous/Next week buttons to browse availability
4. **Slot Selection**: Click to select available time slots
5. **Visual States**:
   - Available slots (blue, clickable)
   - Unavailable slots (white/empty, disabled)
   - Selected slot (gradient blue, highlighted)
   - Today's date (gradient header)
6. **Loading States**: Spinner during data fetch
7. **Error Handling**: Display error messages if API fails

---

## Component Props (TypeScript Interface)

```typescript
interface TimeSlotCalendarProps {
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string; // Format: "YYYY-MM-DD"
  selectedTime?: string; // Format: "HH:MM:SS"
  duration?: number; // Appointment duration in minutes (default: 60)
  practitionerId?: string; // Optional: filter by practitioner
}
```

### Prop Details

| Prop             | Type     | Required | Default   | Description                                                                    |
| ---------------- | -------- | -------- | --------- | ------------------------------------------------------------------------------ |
| `onSelectSlot`   | Function | Yes      | -         | Callback when user selects a time slot. Returns `(date: string, time: string)` |
| `selectedDate`   | string   | No       | undefined | Currently selected date in ISO format (YYYY-MM-DD)                             |
| `selectedTime`   | string   | No       | undefined | Currently selected time in 24h format (HH:MM:SS)                               |
| `duration`       | number   | No       | 60        | Appointment duration in minutes                                                |
| `practitionerId` | string   | No       | undefined | Filter slots by specific practitioner ID                                       |

---

## Data Structures

### TimeSlot Interface

```typescript
interface TimeSlot {
  time: string; // Display format: "8:00 am", "9:30 pm"
  available: boolean; // Whether this slot is bookable
  isoDateTime: string; // ISO 8601 datetime for the slot
}
```

### DaySchedule Interface

```typescript
interface DaySchedule {
  date: Date; // JavaScript Date object
  dayName: string; // Short name: "Mon", "Tue", etc.
  dayNumber: number; // Day of month: 1-31
  month: string; // Short month: "Jan", "Feb", etc.
  slots: TimeSlot[]; // Array of time slots for this day
}
```

### AvailableSlot Interface (from API)

```typescript
interface AvailableSlot {
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  duration: number; // Duration in minutes
}
```

---

## State Management

### Component State

```typescript
const [currentWeekStart, setCurrentWeekStart] = useState<Date>();
const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
```

### State Descriptions

| State              | Type            | Purpose                                               |
| ------------------ | --------------- | ----------------------------------------------------- |
| `currentWeekStart` | Date            | Monday of the currently displayed week                |
| `availableSlots`   | AvailableSlot[] | All available slots fetched from API for current week |
| `loading`          | boolean         | Loading indicator for async operations                |
| `error`            | string \| null  | Error message to display to user                      |

---

## Key Algorithms

### 1. Week Start Calculation (Monday-based)

```typescript
const today = new Date();
const dayOfWeek = today.getDay();
const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
const monday = new Date(today);
monday.setDate(today.getDate() + diff);
monday.setHours(0, 0, 0, 0);
```

### 2. Unified Time Grid Generation

The component creates an aligned grid by:

1. Collecting all unique time slots across the entire week
2. Sorting them chronologically
3. Creating a slot entry for each time on each day
4. Marking slots as available/unavailable based on API data

**Algorithm:**

```typescript
// Collect all unique times across the week
const allTimesSet = new Set<string>();
slotsByDate.forEach((slots) => {
  slots.forEach((slot) => {
    allTimesSet.add(formatTimeSlot(slot.start));
  });
});

// Sort chronologically
const allTimesSorted = Array.from(allTimesSet).sort((a, b) => {
  const timeA = parseTimeToMinutes(a);
  const timeB = parseTimeToMinutes(b);
  return timeA - timeB;
});

// Create aligned slots for each day
for (each day) {
  const availableTimesMap = new Map<string, AvailableSlot>();
  // Map available times for this specific day

  const slots = allTimesSorted.map((time) => {
    const availableSlot = availableTimesMap.get(time);
    return {
      time,
      available: !!availableSlot,
      isoDateTime: availableSlot?.start || '',
    };
  });
}
```

### 3. Time Parsing for Sorting

```typescript
function parseTimeToMinutes(timeStr: string): number {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour = hours;

  if (period.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12;
  } else if (period.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}
```

### 4. Time Formatting

```typescript
// Convert ISO datetime to display format
function formatTimeSlot(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'pm' : 'am';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const minuteStr = minutes === 0 ? '00' : minutes.toString().padStart(2, '0');

  return `${hours}:${minuteStr} ${period}`;
}
```

---

## API Integration

### Required API Function

```typescript
async function fetchAvailableSlots(params: {
  startDate: Date;
  endDate: Date;
  duration: number;
  practitionerId?: string;
}): Promise<AvailableSlot[]>;
```

### API Request Format

```
GET /api/get-halaxy-availability?start={ISO_DATE}&end={ISO_DATE}&duration={MINUTES}
```

### Expected Response Format (FHIR Bundle)

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Appointment",
        "start": "2025-11-05T21:00:00+00:00",
        "end": "2025-11-05T22:00:00+00:00",
        "minutesDuration": 60
      }
    }
  ]
}
```

### Response Parsing

```typescript
if (data.resourceType === 'Bundle' && data.entry) {
  return data.entry.map((entry) => ({
    start: entry.resource.start,
    end: entry.resource.end,
    duration: params.duration,
  }));
}
```

---

## Visual Design Specifications

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                  [<]  November 2025  [>]                    │
├─────┬─────┬─────┬─────┬─────┬─────┬─────────────────────────┤
│ MON │ TUE │ WED │ THU │ FRI │ SAT │ SUN                     │
│  10 │  11 │  12 │  13 │  14 │  15 │  16                     │
│ Nov │ Nov │ Nov │ Nov │ Nov │ Nov │ Nov                     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│     │11:00│     │     │     │11:00│                         │
│     │ am  │     │     │     │ am  │                         │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│     │12:00│     │     │     │12:00│                         │
│     │ pm  │     │     │     │ pm  │                         │
├─────┼─────┼─────┼─────┼─────┼─────┼─────────────────────────┤
│ (Available slots shown, unavailable slots empty)            │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme (Tailwind CSS)

| Element          | State   | Styling                                                   |
| ---------------- | ------- | --------------------------------------------------------- |
| Available slot   | Default | `bg-blue-50 text-blue-700`                                |
| Available slot   | Hover   | `bg-blue-100`                                             |
| Unavailable slot | -       | `bg-white` (empty)                                        |
| Selected slot    | -       | `bg-gradient-to-r from-blue-600 to-indigo-600 text-white` |
| Today header     | -       | `bg-gradient-to-r from-blue-600 to-indigo-600 text-white` |
| Regular header   | -       | `bg-gray-50 text-gray-700`                                |

### Typography

- **Headers**: Uppercase, xs font-size, medium weight
- **Day numbers**: Large, bold
- **Time slots**: xs to small font-size, medium weight
- **Whole hours**: Semibold
- **Partial hours** (15/30/45 min): Smaller, with decorative notch

### Spacing & Borders

- Grid: 7 columns, no gaps
- Border between columns: `border-r border-gray-200`
- Border between rows: `border-b border-gray-100`
- Scrollable area: `max-h-[600px]`
- Sticky header: `sticky top-0 z-10`

---

## Interaction Patterns

### 1. Slot Selection

```typescript
const handleSlotClick = (day: DaySchedule, slot: TimeSlot) => {
  if (!slot.available) return; // Ignore unavailable slots

  const dateStr = formatDateForValue(day.date); // "2025-11-05"
  const timeStr = formatTimeForValue(slot.time); // "08:00:00"

  onSelectSlot(dateStr, timeStr);
};
```

### 2. Week Navigation

```typescript
// Previous week
const previousWeek = () => {
  const newStart = new Date(currentWeekStart);
  newStart.setDate(currentWeekStart.getDate() - 7);
  setCurrentWeekStart(newStart);
};

// Next week
const nextWeek = () => {
  const newStart = new Date(currentWeekStart);
  newStart.setDate(currentWeekStart.getDate() + 7);
  setCurrentWeekStart(newStart);
};
```

### 3. Data Fetching Trigger

```typescript
useEffect(() => {
  fetchSlots();
}, [currentWeekStart, duration, practitionerId]);
```

---

## Accessibility Features

### ARIA Labels

```html
<button aria-label="Previous week">...</button>
<button aria-label="Next week">...</button>
```

### Keyboard Navigation

- Tab through navigation buttons
- Tab through available time slots
- Enter/Space to select slot

### Disabled State

```html
<button disabled="{!slot.available" || loading}></button>
```

---

## Responsive Considerations

### Grid Layout

- Uses CSS Grid with 7 equal columns
- Scrollable content area with fixed header
- Mobile: Consider switching to single-day view or horizontal scroll

### Breakpoints (Suggested)

```css
/* Desktop: 7-day grid */
@media (min-width: 768px) {
  grid-template-columns: repeat(7, 1fr);
}

/* Tablet: 5-day grid */
@media (min-width: 640px) and (max-width: 767px) {
  grid-template-columns: repeat(5, 1fr);
}

/* Mobile: 3-day grid */
@media (max-width: 639px) {
  grid-template-columns: repeat(3, 1fr);
}
```

---

## Error Handling

### Loading State

```tsx
{
  loading && (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

### Error State

```tsx
{
  error && (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
      {error}
    </div>
  );
}
```

### Empty State

```tsx
{
  day.slots.length === 0 && (
    <div className="p-4 text-center text-xs text-gray-400">No availability</div>
  );
}
```

---

## Dependencies

### Required Packages

```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Styling

- **Tailwind CSS** for utility classes
- **Custom CSS** for animations (optional)

### Utility Functions Required

1. `fetchAvailableSlots()` - API call function
2. `formatTimeSlot()` - Time formatting
3. `groupSlotsByDate()` - Group slots by date
4. `parseTimeToMinutes()` - Time parsing for sorting

---

## Environment Variables

```env
VITE_AVAILABILITY_FUNCTION_URL=https://your-api.azurewebsites.net/api/get-halaxy-availability
```

---

## Usage Example

```tsx
import { TimeSlotCalendar } from './components/TimeSlotCalendar';

function BookingPage() {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const handleSlotSelection = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    console.log(`Selected: ${date} at ${time}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1>Book Your Appointment</h1>

      <TimeSlotCalendar
        onSelectSlot={handleSlotSelection}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        duration={60}
        practitionerId="1304541"
      />

      {selectedDate && selectedTime && (
        <div className="mt-4">
          <p>
            You selected: {selectedDate} at {selectedTime}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Complete System Implementation Checklist

### Phase 1: Setup & Dependencies

- [ ] Install React 18+, TypeScript 5+
- [ ] Install and configure Tailwind CSS
- [ ] Set up environment variables
  - [ ] `VITE_HALAXY_BOOKING_FUNCTION_URL`
  - [ ] `VITE_AVAILABILITY_FUNCTION_URL`
- [ ] Configure Google Analytics 4 (gtag.js)
- [ ] Configure Google Tag Manager (optional)

### Phase 2: Utility Layer

- [ ] Create `halaxyClient.ts`
  - [ ] Implement singleton pattern
  - [ ] Add session data extraction methods
  - [ ] Add validation utilities
  - [ ] Add conversion tracking
- [ ] Create `halaxyAvailability.ts`
  - [ ] Implement `fetchAvailableSlots()`
  - [ ] Implement `groupSlotsByDate()`
  - [ ] Implement `formatTimeSlot()`

### Phase 3: Calendar Component

- [ ] Create `TimeSlotCalendar.tsx`
  - [ ] Implement week calculation logic
  - [ ] Build unified time grid algorithm
  - [ ] Add week navigation
  - [ ] Style with aligned grid layout
  - [ ] Add loading/error states

### Phase 4: Form Components

- [ ] Create `BookingForm.tsx`
  - [ ] Implement multi-step state machine
  - [ ] Build patient details form (Step 1)
  - [ ] Build date/time selection (Step 2)
  - [ ] Build confirmation view (Step 3)
  - [ ] Add success/error states
  - [ ] Integrate with HalaxyClient
  - [ ] Add form validation
- [ ] Create `BookingModal.tsx`
  - [ ] Implement modal overlay
  - [ ] Add close handlers
  - [ ] Integrate BookingForm

### Phase 5: Backend Integration

- [ ] Set up Azure Functions project
  - [ ] Create `create-halaxy-booking` function
  - [ ] Create `get-halaxy-availability` function
  - [ ] Configure Halaxy API credentials
  - [ ] Implement CORS policy
  - [ ] Add error handling and logging

### Phase 6: Testing

- [ ] Unit test utilities
  - [ ] Email validation
  - [ ] Phone validation
  - [ ] DateTime formatting
  - [ ] Week calculation
- [ ] Integration test booking flow
  - [ ] Form validation
  - [ ] API communication
  - [ ] Success/error handling
- [ ] E2E test complete booking
  - [ ] Modal open/close
  - [ ] Multi-step navigation
  - [ ] Calendar interaction
  - [ ] Submission flow

### Phase 7: Analytics & Tracking

- [ ] Verify GA4 client_id extraction
- [ ] Test session_id retrieval
- [ ] Validate UTM parameter capture
- [ ] Test conversion event firing
- [ ] Verify Google Ads conversion tracking

### Phase 8: Deployment

- [ ] Deploy Azure Functions
- [ ] Configure production environment variables
- [ ] Test production endpoints
- [ ] Verify CORS configuration
- [ ] Monitor error logs

---

## Complete Usage Example

```tsx
import React, { useState } from 'react';
import { BookingModal } from './components/BookingModal';
import { BookingButton } from './components/BookingButton';

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBookingSuccess = (appointmentId: string) => {
    console.log('Booking confirmed:', appointmentId);
    // Optional: Navigate to success page, show toast, etc.
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Life Psychology Australia
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-6">Book Your Appointment</h2>
          <p className="text-lg text-gray-600 mb-8">
            Schedule a telehealth session with our registered psychologist
          </p>

          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200"
          >
            📅 Book Now
          </button>
        </div>
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
}

export default App;
```

---

## Performance Optimizations

### 1. Memoization

```typescript
import { useMemo } from 'react';

// In TimeSlotCalendar component
const weekSchedule = useMemo(
  () => generateWeekSchedule(),
  [availableSlots, currentWeekStart]
);
```

### 2. Debounced API Calls

```typescript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedFetchSlots = useCallback(
  debounce((weekStart) => {
    fetchAvailableSlotsForWeek(weekStart);
  }, 300),
  []
);
```

### 3. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const BookingModal = lazy(() => import('./components/BookingModal'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingModal {...props} />
    </Suspense>
  );
}
```

---

## Accessibility Enhancements

### Keyboard Navigation

```tsx
// Modal close on Escape key
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### Screen Reader Support

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="booking-title"
  aria-describedby="booking-description"
>
  <h2 id="booking-title">Book Your Appointment</h2>
  <p id="booking-description">Complete the form to schedule your session</p>
</div>
```

### Focus Management

```tsx
useEffect(() => {
  if (isOpen) {
    // Focus first input when modal opens
    const firstInput = modalRef.current?.querySelector('input');
    firstInput?.focus();
  }
}, [isOpen]);
```

---

## Error Handling Strategy

### API Errors

```typescript
try {
  const result = await halaxyClient.createBooking(patient, appointment);
  if (!result.success) {
    setErrorMessage(result.error || 'Booking failed');
    setStep('error');
  }
} catch (error) {
  if (error instanceof NetworkError) {
    setErrorMessage('Network error. Please check your connection.');
  } else if (error instanceof ValidationError) {
    setErrorMessage('Invalid data. Please review your information.');
  } else {
    setErrorMessage('An unexpected error occurred.');
  }
  setStep('error');
}
```

### User-Friendly Messages

```typescript
const ERROR_MESSAGES = {
  NETWORK: 'Unable to connect. Please check your internet connection.',
  VALIDATION: 'Please check your information and try again.',
  CONFLICT: 'This time slot is no longer available. Please select another.',
  SERVER: 'Server error. Please try again in a few moments.',
  UNKNOWN: 'Something went wrong. Please contact support if this persists.',
};
```

---

## Security Considerations

### 1. Input Sanitization

```typescript
function sanitizeInput(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}
```

### 2. HTTPS Only

All API calls must use HTTPS endpoints.

### 3. Rate Limiting

Implement client-side debouncing to prevent API abuse:

```typescript
const [lastSubmit, setLastSubmit] = useState<number>(0);

const handleSubmit = () => {
  const now = Date.now();
  if (now - lastSubmit < 5000) {
    alert('Please wait before submitting again.');
    return;
  }
  setLastSubmit(now);
  // Proceed with submission
};
```

### 4. Data Validation

Always validate on both client and server:

- Client: Immediate feedback
- Server: Security enforcement

---

## Browser Compatibility

### Minimum Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Required

```json
{
  "browserslist": ["> 1%", "last 2 versions", "not dead"]
}
```

---

## Monitoring & Logging

### Client-Side Logging

```typescript
// Log booking flow progression
console.log('[BookingForm] Step changed:', step);
console.log('[HalaxyClient] Creating booking:', { patientEmail: '***' });
console.log('[TimeSlotCalendar] Fetching slots for:', weekStart);
```

### Error Tracking Integration

```typescript
// Example with Sentry
import * as Sentry from '@sentry/react';

try {
  await halaxyClient.createBooking(patient, appointment);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'BookingForm' },
    extra: { step: 'submission', patientId: patient.id },
  });
}
```

---

- [ ] Set up React component with TypeScript
- [ ] Install Tailwind CSS
- [ ] Create API integration function
- [ ] Implement state management
- [ ] Build week calculation logic
- [ ] Create unified time grid algorithm
- [ ] Implement time parsing and formatting utilities
- [ ] Add slot selection handler
- [ ] Style with Tailwind classes
- [ ] Add loading and error states
- [ ] Implement week navigation
- [ ] Add accessibility attributes
- [ ] Test responsiveness
- [ ] Handle edge cases (no availability, API errors)

---

## Performance Considerations

1. **Memoization**: Consider `useMemo` for expensive calculations
2. **Virtual Scrolling**: For large numbers of time slots
3. **Debouncing**: For rapid week navigation
4. **Caching**: Store fetched data to avoid redundant API calls

```typescript
// Example memoization
const weekSchedule = useMemo(
  () => generateWeekSchedule(),
  [availableSlots, currentWeekStart]
);
```

---

## Testing Recommendations

### Unit Tests

- Week start calculation
- Time parsing and formatting
- Slot availability logic
- Date/time formatting

### Integration Tests

- API data fetching
- Week navigation
- Slot selection callback
- Error handling

### E2E Tests

- Full booking flow
- Multi-week navigation
- Selection persistence
- Responsive behavior

---

## Known Limitations

1. **Timezone Handling**: Currently assumes single timezone (UTC)
2. **Localization**: Date/time formatting uses 'en-AU' locale
3. **Performance**: May slow with hundreds of slots per week
4. **Accessibility**: Could be enhanced with screen reader announcements

---

## Future Enhancements

1. **Multi-practitioner support**: Show multiple practitioners in separate sections
2. **Duration selection**: Allow users to select appointment duration
3. **Recurring slots**: Support for repeating availability patterns
4. **Timezone selector**: Allow users to select their timezone
5. **Calendar integration**: Export to Google Calendar, iCal
6. **Waitlist functionality**: Join waitlist for unavailable times
7. **Mobile optimization**: Swipe gestures for week navigation

---

## Version History

| Version | Date     | Changes                                         |
| ------- | -------- | ----------------------------------------------- |
| 1.0     | Nov 2025 | Initial implementation with aligned grid layout |

---

## Support & Documentation

For implementation questions or issues, refer to:

- Component source code
- API documentation
- Tailwind CSS documentation
- React documentation

---

**Document Created**: November 5, 2025  
**Component Version**: 1.0  
**Framework**: React 18+ with TypeScript  
**Styling**: Tailwind CSS  
**License**: As per project license
