const sql = require('mssql');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-prod',
  user: 'lpasqladmin',
  password: 'BloomPlatform2025!Secure',
  options: { encrypt: true, trustServerCertificate: false }
};

(async () => {
  try {
    await sql.connect(config);
    
    const azureUserId = '03f17678-7885-4e63-9b95-86e0498db620';
    
    const result = await sql.query`
      SELECT id, azure_ad_user_id, email, first_name, last_name, status
      FROM practitioners 
      WHERE azure_ad_user_id = ${azureUserId}
    `;
    
    if (result.recordset.length === 0) {
      console.log('❌ No practitioner record found for Azure user:', azureUserId);
      console.log('\nYou need to create a practitioner record or use the new /practice route.');
    } else {
      console.log('✅ Practitioner record found:');
      console.log(JSON.stringify(result.recordset[0], null, 2));
    }
    
    await sql.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
