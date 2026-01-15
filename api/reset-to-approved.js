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
    
    // Reset to "approved" status (the correct state for sending an offer)
    await pool.request()
      .input('id', sql.Int, 1)
      .query(`
        UPDATE applications SET
          status = 'approved',
          offer_token = NULL,
          offer_sent_at = NULL,
          offer_accepted_at = NULL,
          accepted_at = NULL,
          contract_url = NULL,
          signed_contract_url = NULL,
          halaxy_practitioner_verified = 0,
          halaxy_verified_at = NULL,
          practitioner_id = NULL,
          onboarding_email_sent_at = NULL
        WHERE id = @id
      `);
    
    const result = await pool.request()
      .input('id', sql.Int, 1)
      .query('SELECT id, status, contract_url, offer_sent_at, halaxy_practitioner_verified FROM applications WHERE id = @id');
    
    console.log('✅ Application reset to correct starting state');
    console.log('Status: ' + result.recordset[0].status);
    console.log('Contract URL: ' + (result.recordset[0].contract_url || 'null'));
    console.log('Offer Sent: ' + (result.recordset[0].offer_sent_at || 'null'));
    console.log('Halaxy Verified: ' + (result.recordset[0].halaxy_practitioner_verified || 'false'));
    console.log('\n📋 Ready for clean workflow test starting with "Send Offer" button');
    
    pool.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
