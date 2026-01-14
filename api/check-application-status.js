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
  console.log('\n📋 Checking Julian Della Bosca application status...\n');
  
  const pool = await sql.connect(config);
  
  // Get current state
  const result = await pool.request().query(`
    SELECT 
      id,
      first_name,
      last_name,
      email,
      status,
      offer_sent_at,
      offer_accepted_at,
      accepted_at,
      practitioner_id,
      halaxy_practitioner_verified,
      halaxy_verified_at
    FROM applications
    WHERE email = 'julian.dellabosca@gmail.com'
  `);
  
  if (result.recordset.length === 0) {
    console.log('❌ Application not found');
    await pool.close();
    return;
  }
  
  const app = result.recordset[0];
  console.log('Current Application State:');
  console.log('  ID:', app.id);
  console.log('  Name:', app.first_name, app.last_name);
  console.log('  Email:', app.email);
  console.log('  Status:', app.status);
  console.log('  Offer Sent:', app.offer_sent_at);
  console.log('  Offer Accepted:', app.offer_accepted_at);
  console.log('  Accepted At:', app.accepted_at);
  console.log('  Practitioner ID:', app.practitioner_id);
  console.log('  Halaxy Verified:', app.halaxy_practitioner_verified);
  console.log('  Halaxy Verified At:', app.halaxy_verified_at);
  
  await pool.close();
})();
