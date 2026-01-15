const sql = require('mssql');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: 'BloomPlatform2025!Secure',
  options: { encrypt: true, trustServerCertificate: false }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    
    // Step 1: Check current state
    console.log('\n📋 BEFORE VERIFICATION:');
    let result = await pool.request()
      .input('id', sql.Int, 1)
      .query(`
        SELECT 
          id, 
          status,
          halaxy_practitioner_verified,
          halaxy_verified_at,
          practitioner_id,
          first_name,
          last_name,
          email
        FROM applications 
        WHERE id = @id
      `);
    
    const app = result.recordset[0];
    console.log(`  Name: ${app.first_name} ${app.last_name}`);
    console.log(`  Email: ${app.email}`);
    console.log(`  Status: ${app.status}`);
    console.log(`  Halaxy Verified: ${app.halaxy_practitioner_verified}`);
    console.log(`  Verified At: ${app.halaxy_verified_at || 'null'}`);
    console.log(`  Practitioner ID: ${app.practitioner_id || 'null'}`);
    
    // Step 2: Simulate verify endpoint
    console.log('\n🔍 SIMULATING VERIFY-HALAXY-PRACTITIONER ENDPOINT...');
    await pool.request()
      .input('applicationId', sql.Int, 1)
      .input('verified', sql.Bit, 1)
      .input('verifiedAt', sql.DateTime2, new Date())
      .query(`
        UPDATE applications 
        SET 
          halaxy_practitioner_verified = @verified,
          halaxy_verified_at = @verifiedAt
        WHERE id = @applicationId
      `);
    
    // Step 3: Check state after verify
    console.log('\n✅ AFTER VERIFICATION:');
    result = await pool.request()
      .input('id', sql.Int, 1)
      .query(`
        SELECT 
          halaxy_practitioner_verified,
          halaxy_verified_at
        FROM applications 
        WHERE id = @id
      `);
    
    const verified = result.recordset[0].halaxy_practitioner_verified;
    console.log(`  Halaxy Verified: ${verified}`);
    console.log(`  Type: ${typeof verified}`);
    console.log(`  Truthy: ${!!verified}`);
    console.log(`  Verified At: ${result.recordset[0].halaxy_verified_at}`);
    
    // Step 4: Test accept-application check
    console.log('\n🧪 TESTING ACCEPT-APPLICATION SAFETY GATE:');
    result = await pool.request()
      .input('id', sql.Int, 1)
      .query(`
        SELECT 
          id,
          halaxy_practitioner_verified
        FROM applications
        WHERE id = @id
      `);
    
    const app2 = result.recordset[0];
    console.log(`  Value from DB: ${app2.halaxy_practitioner_verified}`);
    console.log(`  Type: ${typeof app2.halaxy_practitioner_verified}`);
    console.log(`  Truthy check (!value): ${!app2.halaxy_practitioner_verified}`);
    
    if (!app2.halaxy_practitioner_verified) {
      console.log('  ❌ WOULD REJECT - Halaxy verification gate BLOCKED');
    } else {
      console.log('  ✅ WOULD PASS - Halaxy verification gate ALLOWED');
    }
    
    pool.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
