/**
 * Create demo appointments in Halaxy
 * 
 * Run with: node create-demo-appointments.js
 * 
 * Requires environment variables:
 * - HALAXY_CLIENT_ID
 * - HALAXY_CLIENT_SECRET
 * - HALAXY_REFRESH_TOKEN
 * - HALAXY_PRACTITIONER_ROLE_ID (the PractitionerRole ID to create appointments for)
 * - HALAXY_HEALTHCARE_SERVICE_ID
 */

require('dotenv').config();

const HALAXY_API_BASE = 'https://au-api.halaxy.com/main';

// Demo patients to create
const DEMO_PATIENTS = [
  { firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell.demo@example.com', phone: '+61412345001' },
  { firstName: 'James', lastName: 'Chen', email: 'james.chen.demo@example.com', phone: '+61412345002' },
  { firstName: 'Emma', lastName: 'Williams', email: 'emma.williams.demo@example.com', phone: '+61412345003' },
  { firstName: 'Michael', lastName: 'Thompson', email: 'michael.thompson.demo@example.com', phone: '+61412345004' },
  { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown.demo@example.com', phone: '+61412345005' },
];

// Demo appointment reasons
const APPOINTMENT_TYPES = [
  { description: 'Initial Assessment', duration: 60 },
  { description: 'Follow-up Session', duration: 50 },
  { description: 'CBT Session', duration: 50 },
  { description: 'EMDR Session', duration: 90 },
  { description: 'Progress Review', duration: 50 },
];

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;

  const clientId = process.env.HALAXY_CLIENT_ID;
  const clientSecret = process.env.HALAXY_CLIENT_SECRET;
  const refreshToken = process.env.HALAXY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Halaxy credentials. Set HALAXY_CLIENT_ID, HALAXY_CLIENT_SECRET, HALAXY_REFRESH_TOKEN');
  }

  console.log('🔑 Getting access token...');
  
  const response = await fetch('https://au-api.halaxy.com/auth/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${text}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ Got access token');
  return accessToken;
}

async function halaxyRequest(endpoint, options = {}) {
  const token = await getAccessToken();
  
  const url = endpoint.startsWith('http') ? endpoint : `${HALAXY_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Halaxy API error: ${response.status} ${text}`);
  }

  return response.json();
}

async function createOrFindPatient(patient) {
  console.log(`\n👤 Looking for patient: ${patient.firstName} ${patient.lastName}`);
  
  // Try to find existing
  try {
    const search = await halaxyRequest(`/Patient?email=${encodeURIComponent(patient.email)}&_count=1`);
    const existing = search.entry?.filter(e => 
      e.resource?.id && 
      e.resource.id !== 'warning' && 
      e.resource.id.length > 3
    );
    
    if (existing && existing.length > 0) {
      console.log(`  Found existing patient: ${existing[0].resource.id}`);
      return existing[0].resource;
    }
  } catch (e) {
    // Not found, create new
  }

  // Create new patient
  console.log(`  Creating new patient...`);
  const fhirPatient = {
    resourceType: 'Patient',
    active: true,
    name: [{
      use: 'official',
      family: patient.lastName,
      given: [patient.firstName],
    }],
    telecom: [
      { system: 'email', value: patient.email, use: 'home' },
      { system: 'sms', value: patient.phone, use: 'mobile' },
    ],
  };

  const newPatient = await halaxyRequest('/Patient', {
    method: 'POST',
    body: JSON.stringify(fhirPatient),
  });

  console.log(`  ✅ Created patient: ${newPatient.id}`);
  return newPatient;
}

async function findAvailableSlot(practitionerRoleId, date, durationMinutes) {
  const startOfDay = new Date(date);
  startOfDay.setHours(9, 0, 0, 0); // 9 AM
  
  const endOfDay = new Date(date);
  endOfDay.setHours(17, 0, 0, 0); // 5 PM
  
  const url = `/Appointment/$find?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}&duration=${durationMinutes}&practitioner-role=${practitionerRoleId}`;
  
  try {
    const response = await halaxyRequest(url);
    const slots = response.entry?.map(e => e.resource) || [];
    
    if (slots.length > 0) {
      // Return a random slot from available ones
      return slots[Math.floor(Math.random() * Math.min(slots.length, 5))];
    }
  } catch (e) {
    console.log(`  No slots found for ${date.toDateString()}: ${e.message}`);
  }
  
  return null;
}

async function bookAppointment(patientId, practitionerRoleId, slot, description, healthcareServiceId) {
  console.log(`  📅 Booking appointment at ${slot.start}...`);
  
  // Use Halaxy's $book operation
  const bookUrl = `/Appointment/$book?slot-id=${slot.id}&patient-id=${patientId}&healthcare-service-id=${healthcareServiceId}&location-type=telehealth&status=booked`;
  
  try {
    const appointment = await halaxyRequest(bookUrl, { method: 'POST' });
    console.log(`  ✅ Booked appointment: ${appointment.id}`);
    return appointment;
  } catch (e) {
    // Try alternative method - direct appointment creation
    console.log(`  ⚠️ $book failed, trying direct creation...`);
    
    const fhirAppointment = {
      resourceType: 'Appointment',
      status: 'booked',
      start: slot.start,
      end: slot.end,
      description: description,
      participant: [
        {
          actor: { reference: `Patient/${patientId}` },
          status: 'accepted',
        },
        {
          actor: { reference: `PractitionerRole/${practitionerRoleId}` },
          status: 'accepted',
        },
      ],
      serviceType: [{
        coding: [{
          display: description,
        }],
      }],
    };

    const appointment = await halaxyRequest('/Appointment', {
      method: 'POST',
      body: JSON.stringify(fhirAppointment),
    });
    
    console.log(`  ✅ Created appointment: ${appointment.id}`);
    return appointment;
  }
}

async function main() {
  console.log('🌸 Bloom Demo Data Creator');
  console.log('==========================\n');
  
  const practitionerRoleId = process.env.HALAXY_PRACTITIONER_ROLE_ID;
  const healthcareServiceId = process.env.HALAXY_HEALTHCARE_SERVICE_ID;
  
  if (!practitionerRoleId) {
    throw new Error('Missing HALAXY_PRACTITIONER_ROLE_ID environment variable');
  }
  
  if (!healthcareServiceId) {
    throw new Error('Missing HALAXY_HEALTHCARE_SERVICE_ID environment variable');
  }
  
  console.log(`Practitioner Role ID: ${practitionerRoleId}`);
  console.log(`Healthcare Service ID: ${healthcareServiceId}`);
  
  // Create patients first
  const patients = [];
  for (const patientData of DEMO_PATIENTS) {
    const patient = await createOrFindPatient(patientData);
    patients.push(patient);
  }
  
  console.log(`\n✅ Created/found ${patients.length} demo patients`);
  
  // Create appointments for the next 7 days
  const today = new Date();
  const appointments = [];
  
  console.log('\n📅 Creating demo appointments for next 7 days...\n');
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      console.log(`⏭️ Skipping ${date.toDateString()} (weekend)`);
      continue;
    }
    
    console.log(`\n📆 ${date.toDateString()}`);
    
    // Create 2-3 appointments per day
    const appointmentsPerDay = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < appointmentsPerDay; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const appointmentType = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];
      
      console.log(`\n  Scheduling ${appointmentType.description} for ${patient.name[0].given[0]} ${patient.name[0].family}`);
      
      const slot = await findAvailableSlot(practitionerRoleId, date, appointmentType.duration);
      
      if (slot) {
        try {
          const appointment = await bookAppointment(
            patient.id,
            practitionerRoleId,
            slot,
            appointmentType.description,
            healthcareServiceId
          );
          appointments.push(appointment);
        } catch (e) {
          console.log(`  ❌ Failed to book: ${e.message}`);
        }
      } else {
        console.log(`  ⚠️ No available slots found`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log('\n\n========================================');
  console.log(`✅ Created ${appointments.length} demo appointments!`);
  console.log('========================================\n');
  
  console.log('Summary:');
  appointments.forEach((apt, i) => {
    const start = new Date(apt.start);
    console.log(`  ${i + 1}. ${start.toLocaleString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
  });
}

main().catch(console.error);
