/**
 * Delete Julian's test data for fresh reapply
 * 
 * Usage: node delete-julian-test-data.js
 * 
 * This script:
 * 1. Finds Julian's application by email
 * 2. Deletes any linked practitioner record
 * 3. Deletes the application record
 */

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

const JULIAN_EMAIL = 'julian.dellabosca@life-psychology.com.au';
const JULIAN_GMAIL = 'julian.dellabosca@gmail.com';

(async () => {
  console.log('\n🗑️  Deleting Julian test data for fresh reapply...\n');
  
  const pool = await sql.connect(config);
  
  // Check for applications with either email
  const apps = await pool.request()
    .input('email1', sql.NVarChar, JULIAN_EMAIL)
    .input('email2', sql.NVarChar, JULIAN_GMAIL)
    .query(`
      SELECT id, email, first_name, last_name, status, practitioner_id
      FROM applications
      WHERE email IN (@email1, @email2)
    `);
  
  console.log(`Found ${apps.recordset.length} application(s):`);
  apps.recordset.forEach(app => {
    console.log(`  - ID ${app.id}: ${app.first_name} ${app.last_name} (${app.email}) - Status: ${app.status}`);
  });
  
  // Check for practitioners
  const practs = await pool.request()
    .input('email1', sql.NVarChar, JULIAN_EMAIL)
    .input('email2', sql.NVarChar, JULIAN_GMAIL)
    .query(`
      SELECT id, email, first_name, last_name, halaxy_practitioner_id
      FROM practitioners
      WHERE email IN (@email1, @email2)
    `);
  
  console.log(`Found ${practs.recordset.length} practitioner(s):`);
  practs.recordset.forEach(p => {
    console.log(`  - ID ${p.id}: ${p.first_name} ${p.last_name}`);
    console.log(`    Email: ${p.email}`);
    console.log(`    Halaxy ID: ${p.halaxy_practitioner_id || 'not set'}`);
  });
  
  // Delete practitioners first (due to foreign key constraints potentially)
  if (practs.recordset.length > 0) {
    const practIds = practs.recordset.map(p => `'${p.id}'`).join(',');
    await pool.request().query(`DELETE FROM practitioners WHERE id IN (${practIds})`);
    console.log(`\n✅ Deleted ${practs.recordset.length} practitioner record(s)`);
  }
  
  // Delete applications
  if (apps.recordset.length > 0) {
    const appIds = apps.recordset.map(a => a.id).join(',');
    await pool.request().query(`DELETE FROM applications WHERE id IN (${appIds})`);
    console.log(`✅ Deleted ${apps.recordset.length} application record(s)`);
  }
  
  if (apps.recordset.length === 0 && practs.recordset.length === 0) {
    console.log('\n📭 No records found - Julian can apply fresh!');
  } else {
    console.log('\n🎉 Done! Julian can now reapply at https://life-psychology.com.au/careers');
  }
  
  await pool.close();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
