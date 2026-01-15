const sql = require('mssql');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: process.env.SQL_PASSWORD || 'BloomPlatform2025!Secure',
  options: { encrypt: true }
};

sql.connect(config).then(async pool => {
  const result = await pool.request().query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'practitioners' 
    ORDER BY ORDINAL_POSITION
  `);
  console.log('Practitioners columns:');
  result.recordset.forEach(c => console.log('  ' + c.COLUMN_NAME));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
