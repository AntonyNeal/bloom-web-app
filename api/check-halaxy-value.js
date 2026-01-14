const sql = require('mssql');

async function checkValue() {
  try {
    const pool = await sql.connect({
      server: 'lpa-sql-server.database.windows.net',
      database: 'lpa-bloom-db-dev',
      user: 'lpaadmin',
      password: 'BloomPlatform2025!Secure',
      options: {
        encrypt: true,
        trustServerCertificate: false,
      }
    });
    
    const result = await pool.request()
      .input('id', sql.Int, 1)
      .query(`
        SELECT 
          id,
          halaxy_practitioner_verified,
          halaxy_verified_at,
          status
        FROM applications 
        WHERE id = @id
      `);
    
    const app = result.recordset[0];
    console.log('\n📊 APPLICATION HALAXY DATA:');
    console.log(`  halaxy_practitioner_verified: ${app.halaxy_practitioner_verified}`);
    console.log(`  Type: ${typeof app.halaxy_practitioner_verified}`);
    console.log(`  Value === true: ${app.halaxy_practitioner_verified === true}`);
    console.log(`  Value === 1: ${app.halaxy_practitioner_verified === 1}`);
    console.log(`  Value == true: ${app.halaxy_practitioner_verified == true}`);
    console.log(`  Truthiness (!!value): ${!!app.halaxy_practitioner_verified}`);
    console.log(`  halaxy_verified_at: ${app.halaxy_verified_at}`);
    console.log(`  status: ${app.status}`);
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkValue();
