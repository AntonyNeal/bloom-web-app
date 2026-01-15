const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: 'BloomPlatform2025!Secure',
  options: { encrypt: true }
};

async function runMigration() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    
    // Run the migration - split by GO statements
    const statements = [
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'ahpra_number')
       BEGIN
         ALTER TABLE practitioners ADD ahpra_number NVARCHAR(50);
         PRINT 'Added ahpra_number column';
       END`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'specializations')
       BEGIN
         ALTER TABLE practitioners ADD specializations NVARCHAR(MAX);
         PRINT 'Added specializations column';
       END`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'experience_years')
       BEGIN
         ALTER TABLE practitioners ADD experience_years INT;
         PRINT 'Added experience_years column';
       END`,
      `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('practitioners') AND name = 'profile_photo_url')
       BEGIN
         ALTER TABLE practitioners ADD profile_photo_url NVARCHAR(500);
         PRINT 'Added profile_photo_url column';
       END`
    ];
    
    for (const stmt of statements) {
      console.log('Running statement...');
      await pool.request().query(stmt);
    }
    
    console.log('✅ Migration complete!');
    
    // Verify columns
    const result = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' 
      ORDER BY ORDINAL_POSITION
    `);
    console.log('\nPractitioners columns:');
    result.recordset.forEach(c => console.log('  ' + c.COLUMN_NAME));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (pool) await pool.close();
  }
}

runMigration();
