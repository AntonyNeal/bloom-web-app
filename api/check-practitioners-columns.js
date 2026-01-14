const sql = require('mssql');

const config = {
  server: process.env.SQL_SERVER || 'lpa-sql-server.database.windows.net',
  database: process.env.SQL_DATABASE || 'lpa-bloom-db-dev',
  user: process.env.SQL_USER || 'lpaadmin',
  password: process.env.SQL_PASSWORD || 'BloomPlatform2025!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function checkColumns() {
  let pool;
  try {
    console.log('🔍 Connecting to database...\n');
    pool = await sql.connect(config);

    // Check practitioners table columns
    const result = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'practitioners'
        ORDER BY ORDINAL_POSITION
      `);

    console.log('📋 PRACTITIONERS TABLE COLUMNS:');
    console.log('═'.repeat(50));
    result.recordset.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.COLUMN_NAME.padEnd(30)} (${col.DATA_TYPE})`);
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkColumns();
