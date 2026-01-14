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
  const pool = await sql.connect(config);
  const result = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'applications' 
    AND COLUMN_NAME IN ('offer_token', 'signed_contract_url', 'offer_sent_at', 'offer_accepted_at')
    ORDER BY COLUMN_NAME
  `);
  console.log('\n✅ Offer-related columns:');
  if (result.recordset.length === 0) {
    console.log('  ❌ No offer columns found!');
  } else {
    result.recordset.forEach(r => console.log(`  - ${r.COLUMN_NAME} (${r.DATA_TYPE})`));
  }
  await pool.close();
  console.log('');
})();
