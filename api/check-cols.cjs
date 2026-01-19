const sql = require('mssql');
const config = { 
  server: 'lpa-sql-server.database.windows.net', 
  database: 'lpa-bloom-db-dev', 
  user: 'lpaadmin', 
  password: 'BloomPlatform2025!Secure', 
  options: { encrypt: true, trustServerCertificate: false } 
};
sql.connect(config).then(async pool => { 
  const r = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'practitioners'"); 
  console.log('Practitioners columns:', r.recordset.map(c => c.COLUMN_NAME)); 
  process.exit(0); 
}).catch(e => { console.error(e.message); process.exit(1); });
