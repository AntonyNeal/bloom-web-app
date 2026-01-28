/**
 * Import Halaxy Patients to Bloom Clients Table
 * 
 * Imports ONLY non-sensitive demographic data:
 * - Name, email, phone
 * - Date of birth, gender
 * - Contact details
 * 
 * Does NOT import:
 * - Clinical notes
 * - Medical history
 * - Diagnoses
 * - Treatment information
 * 
 * Usage:
 *   node import-halaxy-patients.js [--practitioner-id=UUID]
 */

require('dotenv').config({ path: './local.settings.json' });
const sql = require('mssql');

// Database configuration
const dbConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 60000,
  },
};

// Halaxy API configuration
const HALAXY_CLIENT_ID = process.env.HALAXY_CLIENT_ID;
const HALAXY_CLIENT_SECRET = process.env.HALAXY_CLIENT_SECRET;
const HALAXY_API_BASE = 'https://au-api.halaxy.com/main';

/**
 * Get OAuth access token from Halaxy
 */
async function getHalaxyAccessToken() {
  const authString = Buffer.from(`${HALAXY_CLIENT_ID}:${HALAXY_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://au-api.halaxy.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=*',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Halaxy token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch all patients from Halaxy (demographics only)
 */
async function fetchHalaxyPatients(accessToken) {
  console.log('\n📥 Fetching patients from Halaxy API...');
  
  const response = await fetch(`${HALAXY_API_BASE}/Patient?_count=1000`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/fhir+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch patients: ${response.status}`);
  }

  const bundle = await response.json();
  const patients = bundle.entry?.map(e => e.resource) || [];
  
  console.log(`✅ Found ${patients.length} patients in Halaxy\n`);
  return patients;
}

/**
 * Extract safe demographic data from FHIR patient
 */
function extractDemographics(fhirPatient) {
  const name = fhirPatient.name?.[0];
  const telecom = fhirPatient.telecom || [];
  
  const email = telecom.find(t => t.system === 'email')?.value || null;
  const phone = telecom.find(t => t.system === 'phone')?.value || null;
  
  // Extract gender (FHIR uses: male, female, other, unknown)
  let gender = fhirPatient.gender || null;
  if (gender === 'unknown') gender = 'prefer-not-to-say';
  
  return {
    halaxy_patient_id: fhirPatient.id,
    first_name: name?.given?.[0] || 'Unknown',
    last_name: name?.family || 'Unknown',
    email: email,
    phone: phone,
    date_of_birth: fhirPatient.birthDate || null,
    gender: gender,
  };
}

/**
 * Get practitioner ID from database
 */
async function getPractitionerId(pool, halaxyPractitionerId) {
  if (!halaxyPractitionerId) {
    // Get first active practitioner
    const result = await pool.request().query(`
      SELECT TOP 1 id 
      FROM practitioners 
      WHERE is_active = 1 
      ORDER BY created_at ASC
    `);
    
    if (result.recordset.length === 0) {
      throw new Error('No active practitioners found in database');
    }
    
    return result.recordset[0].id;
  }
  
  const result = await pool.request()
    .input('halaxyId', sql.NVarChar, halaxyPractitionerId)
    .query(`
      SELECT id 
      FROM practitioners 
      WHERE halaxy_practitioner_role_id = @halaxyId
    `);
  
  if (result.recordset.length === 0) {
    throw new Error(`Practitioner with Halaxy ID ${halaxyPractitionerId} not found`);
  }
  
  return result.recordset[0].id;
}

/**
 * Import patient into clients table
 */
async function importClient(pool, practitionerId, demographics) {
  const { 
    halaxy_patient_id, 
    first_name, 
    last_name, 
    email, 
    phone, 
    date_of_birth, 
    gender 
  } = demographics;
  
  // Check if already imported
  const existing = await pool.request()
    .input('practitionerId', sql.UniqueIdentifier, practitionerId)
    .input('halaxyPatientId', sql.NVarChar, halaxy_patient_id)
    .query(`
      SELECT id 
      FROM clients 
      WHERE practitioner_id = @practitionerId 
        AND halaxy_patient_id = @halaxyPatientId
    `);
  
  if (existing.recordset.length > 0) {
    return { skipped: true, reason: 'already imported' };
  }
  
  // Insert new client
  await pool.request()
    .input('practitionerId', sql.UniqueIdentifier, practitionerId)
    .input('halaxyPatientId', sql.NVarChar, halaxy_patient_id)
    .input('firstName', sql.NVarChar, first_name)
    .input('lastName', sql.NVarChar, last_name)
    .input('email', sql.NVarChar, email)
    .input('phone', sql.NVarChar, phone)
    .input('dateOfBirth', sql.Date, date_of_birth)
    .input('gender', sql.NVarChar, gender)
    .query(`
      INSERT INTO clients (
        practitioner_id,
        halaxy_patient_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        imported_from_halaxy,
        imported_at
      ) VALUES (
        @practitionerId,
        @halaxyPatientId,
        @firstName,
        @lastName,
        @email,
        @phone,
        @dateOfBirth,
        @gender,
        1,
        GETUTCDATE()
      )
    `);
  
  return { imported: true };
}

/**
 * Main import function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Bloom - Import Halaxy Patients (Demographics Only)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const practitionerIdArg = args.find(arg => arg.startsWith('--practitioner-id='));
  const halaxyPractitionerId = practitionerIdArg?.split('=')[1] || null;
  
  let pool;
  
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Database connected\n');
    
    // Get practitioner ID
    const practitionerId = await getPractitionerId(pool, halaxyPractitionerId);
    console.log(`👤 Practitioner ID: ${practitionerId}\n`);
    
    // Get Halaxy access token
    console.log('🔑 Getting Halaxy access token...');
    const accessToken = await getHalaxyAccessToken();
    console.log('✅ Token obtained\n');
    
    // Fetch patients
    const patients = await fetchHalaxyPatients(accessToken);
    
    if (patients.length === 0) {
      console.log('⚠️  No patients found in Halaxy');
      return;
    }
    
    // Import patients
    console.log('💾 Importing patients...\n');
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const patient of patients) {
      try {
        const demographics = extractDemographics(patient);
        const patientName = `${demographics.first_name} ${demographics.last_name}`;
        
        const result = await importClient(pool, practitionerId, demographics);
        
        if (result.imported) {
          console.log(`✅ Imported: ${patientName}`);
          imported++;
        } else if (result.skipped) {
          console.log(`⏭️  Skipped: ${patientName} (${result.reason})`);
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Error importing patient: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Import Complete                                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped:  ${skipped}`);
    console.log(`❌ Errors:   ${errors}`);
    console.log(`📊 Total:    ${patients.length}\n`);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

main();
