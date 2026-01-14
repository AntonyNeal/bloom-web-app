const sql = require('mssql');

async function checkTable() {
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
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'practitioners'
        ORDER BY ORDINAL_POSITION
      `);
    
    console.log('\n📊 PRACTITIONERS TABLE COLUMNS:\n');
    result.recordset.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? '✓ nullable' : '✗ NOT NULL';
      console.log(`  ${col.COLUMN_NAME.padEnd(35)} ${col.DATA_TYPE.padEnd(20)} ${nullable}`);
    });
    
    console.log('\n✅ Total columns:', result.recordset.length);
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTable();
