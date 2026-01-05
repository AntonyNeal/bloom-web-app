// Cleanup script to reset invalid practitioner data
const sql = require('mssql');
require('dotenv').config();

async function cleanup() {
  const pool = await sql.connect(process.env.SQL_CONNECTION_STRING);
  
  const practitionerId = '547B0DC5-BC97-4D6D-8820-BB3F9D4D1A8C';
  
  // Delete the practitioner
  console.log('Deleting invalid practitioner...');
  await pool.request()
    .input('id', sql.UniqueIdentifier, practitionerId)
    .query('DELETE FROM practitioners WHERE id = @id');
  console.log('✓ Practitioner deleted');
  
  // Reset application 1 - clear practitioner_id and set status back for offer workflow
  console.log('Resetting application 1...');
  await pool.request()
    .query(`UPDATE applications SET 
      practitioner_id = NULL, 
      status = 'interview_scheduled',
      accepted_at = NULL,
      offer_sent_at = NULL,
      offer_accepted_at = NULL,
      offer_token = NULL
    WHERE id = 1`);
  console.log('✓ Application reset to interview_scheduled status');
  
  // Verify
  console.log('\n=== Updated Application 1 ===');
  const app = await pool.request().query('SELECT id, first_name, email, status, practitioner_id FROM applications WHERE id = 1');
  console.log(app.recordset[0]);
  
  await pool.close();
  console.log('\n✅ Done! You can now:');
  console.log('1. Upload a contract to the application');
  console.log('2. Send an offer');
  console.log('3. Accept the offer (as candidate)');
  console.log('4. Start onboarding');
}

cleanup().catch(console.error);
