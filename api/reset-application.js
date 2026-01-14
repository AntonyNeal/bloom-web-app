const sql = require('mssql');
const fs = require('fs');

const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
const config = {
  server: settings.Values.SQL_SERVER,
  database: settings.Values.SQL_DATABASE,
  user: settings.Values.SQL_USER,
  password: settings.Values.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false }
};

(async () => {
  console.log('\n🔄 Resetting Julian Della Bosca application...\n');
  
  const pool = await sql.connect(config);
  
  // Reset ALL offer and onboarding related fields
  await pool.request().query(`
    UPDATE applications
    SET 
      status = 'reviewing',
      offer_token = NULL,
      offer_sent_at = NULL,
      offer_accepted_at = NULL,
      accepted_at = NULL,
      signed_contract_url = NULL,
      practitioner_id = NULL,
      halaxy_practitioner_verified = 0,
      halaxy_verified_at = NULL,
      halaxy_account_id = NULL
    WHERE email = 'julian.dellabosca@gmail.com'
  `);
  
  console.log('✅ Application reset to "reviewing" status');
  console.log('   Cleared: offer_token, offer_sent_at, offer_accepted_at');
  console.log('   Cleared: accepted_at, signed_contract_url, practitioner_id');
  console.log('   Cleared: halaxy fields\n');
  
  // Verify the reset
  const result = await pool.request().query(`
    SELECT 
      id,
      first_name,
      last_name,
      status,
      offer_token,
      offer_sent_at,
      offer_accepted_at,
      signed_contract_url,
      practitioner_id,
      halaxy_practitioner_verified
    FROM applications
    WHERE email = 'julian.dellabosca@gmail.com'
  `);
  
  const app = result.recordset[0];
  console.log('New Application State:');
  console.log('  Status:', app.status);
  console.log('  Offer Token:', app.offer_token);
  console.log('  Offer Sent:', app.offer_sent_at);
  console.log('  Offer Accepted:', app.offer_accepted_at);
  console.log('  Signed Contract URL:', app.signed_contract_url);
  console.log('  Practitioner ID:', app.practitioner_id);
  console.log('  Halaxy Verified:', app.halaxy_practitioner_verified);
  
  console.log('\n✅ Ready to test again!');
  
  await pool.close();
})();
