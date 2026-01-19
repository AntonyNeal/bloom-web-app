/**
 * Create demo appointments in Halaxy
 * 
 * This script creates demo patients and appointments for testing the dashboard.
 * Run with: npx ts-node create-demo-appointments.ts
 */

import { HalaxyClient } from './src/services/halaxy/client';
import { FHIRPatient, FHIRAppointment, FHIRSlot } from './src/services/halaxy/types';

// Demo patients to create
const DEMO_PATIENTS = [
  { firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell.demo@example.com', phone: '+61412345001' },
  { firstName: 'James', lastName: 'Chen', email: 'james.chen.demo@example.com', phone: '+61412345002' },
  { firstName: 'Emma', lastName: 'Williams', email: 'emma.williams.demo@example.com', phone: '+61412345003' },
  { firstName: 'Michael', lastName: 'Thompson', email: 'michael.thompson.demo@example.com', phone: '+61412345004' },
  { firstName: 'Olivia', lastName: 'Brown', email: 'olivia.brown.demo@example.com', phone: '+61412345005' },
];

// Demo appointment types
const APPOINTMENT_TYPES = [
  { description: 'Initial Assessment', duration: 60 },
  { description: 'Follow-up Session', duration: 50 },
  { description: 'CBT Session', duration: 50 },
  { description: 'EMDR Session', duration: 90 },
  { description: 'Progress Review', duration: 50 },
];

async function main() {
  console.log('🌸 Bloom Demo Data Creator');
  console.log('==========================\n');

  const practitionerRoleId = process.env.HALAXY_PRACTITIONER_ROLE_ID;
  const healthcareServiceId = process.env.HALAXY_HEALTHCARE_SERVICE_ID;
  const practitionerId = process.env.HALAXY_PRACTITIONER_ID;

  if (!practitionerRoleId || !healthcareServiceId) {
    throw new Error('Missing HALAXY_PRACTITIONER_ROLE_ID or HALAXY_HEALTHCARE_SERVICE_ID');
  }

  console.log(`Practitioner Role ID: ${practitionerRoleId}`);
  console.log(`Healthcare Service ID: ${healthcareServiceId}`);
  console.log(`Practitioner ID: ${practitionerId}`);

  const client = new HalaxyClient();
  console.log(`\nAPI Base URL: ${client.getApiBaseUrl()}\n`);

  // Step 1: Create or find demo patients
  const patients: FHIRPatient[] = [];
  
  for (const patientData of DEMO_PATIENTS) {
    console.log(`\n👤 Creating/finding patient: ${patientData.firstName} ${patientData.lastName}`);
    try {
      const patient = await client.createOrFindPatient(patientData);
      patients.push(patient);
      console.log(`   ✅ Patient ID: ${patient.id}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`\n✅ Found/created ${patients.length} demo patients`);

  if (patients.length === 0) {
    console.log('\n❌ No patients created. Cannot proceed with appointments.');
    return;
  }

  // Step 2: Find available slots for the next 7 days and book appointments
  const today = new Date();
  const appointments: FHIRAppointment[] = [];

  console.log('\n📅 Looking for available slots and booking appointments...\n');

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      console.log(`⏭️  Skipping ${date.toDateString()} (weekend)`);
      continue;
    }

    console.log(`\n📆 ${date.toDateString()}`);

    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0);

    // Find available slots for this day
    let slots: FHIRSlot[] = [];
    try {
      // Use findAvailableAppointments which respects Halaxy's booking rules
      const appointmentType = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];
      slots = await client.findAvailableAppointments(
        startOfDay,
        endOfDay,
        appointmentType.duration,
        practitionerId,
        practitionerRoleId,
      );
      console.log(`   Found ${slots.length} available slots`);
    } catch (error) {
      console.log(`   ⚠️ Could not find slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }

    if (slots.length === 0) {
      console.log(`   No available slots for this day`);
      continue;
    }

    // Book 2-3 appointments per day
    const appointmentsToBook = Math.min(2 + Math.floor(Math.random() * 2), slots.length);

    for (let i = 0; i < appointmentsToBook; i++) {
      const slot = slots[i];
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const appointmentType = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];

      console.log(`\n   📋 Booking ${appointmentType.description} for ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family}`);
      console.log(`      Slot: ${slot.start} - ${slot.end}`);

      try {
        const appointment = await client.createAppointment({
          patientId: patient.id!,
          practitionerId: practitionerRoleId,
          start: slot.start,
          end: slot.end,
          description: appointmentType.description,
          healthcareServiceId: healthcareServiceId,
          locationType: 'telehealth',
        });
        
        appointments.push(appointment);
        console.log(`      ✅ Appointment booked: ${appointment.id}`);
      } catch (error) {
        console.log(`      ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n\n========================================');
  console.log(`✅ Created ${appointments.length} demo appointments!`);
  console.log('========================================\n');

  if (appointments.length > 0) {
    console.log('Summary:');
    appointments.forEach((apt, i) => {
      const start = new Date(apt.start!);
      console.log(`  ${i + 1}. ${start.toLocaleString('en-AU', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${apt.description || 'Session'}`);
    });
  }
}

main().catch(console.error);
