const sql = require('mssql');
const config = require('./bloom-sql-config.json');

async function checkColumns() {
  let pool;
  try {
    console.log('🔍 Connecting to:', config.SqlServer, config.SqlDatabase);
    pool = await sql.connect({
      server: config.SqlServer,
      database: config.SqlDatabase,
      user: config.SqlUser,
      password: config.SqlPassword,
      options: { encrypt: true, trustServerCertificate: false }
    });

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'practitioners'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n📋 PRACTITIONERS TABLE COLUMNS:');
    result.recordset.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.COLUMN_NAME.padEnd(30)} (${col.DATA_TYPE})`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) await pool.close();
  }
}

checkColumns();
