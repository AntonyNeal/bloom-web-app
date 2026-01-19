/**
 * Reset Application Script
 * Usage: node scripts/reset-application.js <applicationId>
 */

const sql = require('mssql');
require('dotenv').config({ path: './api/.env' });

const applicationId = parseInt(process.argv[2], 10);

if (!applicationId) {
  console.error('Usage: node scripts/reset-application.js <applicationId>');
  process.exit(1);
}

async function reset() {
  const config = {
    server: process.env.SQL_SERVER || 'bloom-sql-server.database.windows.net',
    database: process.env.SQL_DATABASE || 'bloom-dev',
    user: process.env.SQL_USER || 'bloomadmin',
    password: process.env.SQL_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false }
  };
  
  console.log(`Connecting to ${config.database}...`);
  const pool = await sql.connect(config);
  
  // Get application info first
  const result = await pool.request()
    .input('id', sql.Int, applicationId)
    .query('SELECT id, first_name, last_name, email, status FROM applications WHERE id = @id');
  
  if (result.recordset.length === 0) {
    console.error(`Application ${applicationId} not found`);
    process.exit(1);
  }
  
  const app = result.recordset[0];
  console.log(`Found: ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status}`);
  
  // Reset the application
  await pool.request()
    .input('id', sql.Int, applicationId)
    .query(`
      UPDATE applications SET 
        status = 'submitted',
        reviewed_by = NULL,
        reviewed_at = NULL,
        waitlisted_at = NULL,
        accepted_at = NULL,
        offer_sent_at = NULL,
        offer_accepted_at = NULL,
        offer_token = NULL,
        signed_contract_url = NULL,
        halaxy_practitioner_verified = 0,
        halaxy_verified_at = NULL,
        halaxy_account_id = NULL,
        practitioner_id = NULL,
        onboarding_email_sent_at = NULL,
        contract_url = NULL
      WHERE id = @id
    `);
  
  console.log(`✅ Application ${applicationId} (${app.first_name} ${app.last_name}) has been reset to 'submitted' status`);
  await pool.close();
}

reset().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
