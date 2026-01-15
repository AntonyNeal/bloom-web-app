const sql = require('mssql');

async function checkColumns() {
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
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'applications'
        ORDER BY ORDINAL_POSITION
      `);
    
    console.log('\n📊 APPLICATIONS TABLE COLUMNS:\n');
    result.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(40)} ${col.DATA_TYPE}`);
    });
    
    console.log('\n✅ Total columns:', result.recordset.length);
    
    // Check for contract-related columns
    console.log('\n🔍 CONTRACT-RELATED COLUMNS:');
    const contractCols = result.recordset.filter(c => c.COLUMN_NAME.toLowerCase().includes('contract'));
    contractCols.forEach(col => {
      console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();
