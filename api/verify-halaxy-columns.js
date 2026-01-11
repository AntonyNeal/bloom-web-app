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
    AND COLUMN_NAME LIKE '%halaxy%'
  `);
  console.log('\n✅ Halaxy columns in database:');
  result.recordset.forEach(r => console.log(`   - ${r.COLUMN_NAME} (${r.DATA_TYPE})`));
  await pool.close();
  console.log('\n🎉 Columns verified!\n');
})();
