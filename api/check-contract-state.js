const sql = require('mssql');

async function checkState() {
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
          status,
          halaxy_practitioner_verified,
          contract_url,
          signed_contract_url,
          offer_token,
          offer_sent_at,
          offer_accepted_at
        FROM applications 
        WHERE id = @id
      `);
    
    const app = result.recordset[0];
    console.log('\n📋 APPLICATION CONTRACT STATUS:');
    console.log(`  ID: ${app.id}`);
    console.log(`  Status: ${app.status}`);
    console.log(`  Halaxy Verified: ${app.halaxy_practitioner_verified}`);
    console.log(`\n📄 CONTRACT FIELDS:`);
    console.log(`  contract_url: ${app.contract_url || '(null)'}`);
    console.log(`  signed_contract_url: ${app.signed_contract_url ? '✅ UPLOADED' : '❌ NOT UPLOADED'}`);
    if (app.signed_contract_url) {
      console.log(`    URL: ${app.signed_contract_url.substring(0, 80)}...`);
    }
    console.log(`\n📧 OFFER STATUS:`);
    console.log(`  offer_token: ${app.offer_token || '(null)'}`);
    console.log(`  offer_sent_at: ${app.offer_sent_at || '(null)'}`);
    console.log(`  offer_accepted_at: ${app.offer_accepted_at || '(null)'}`);
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkState();
