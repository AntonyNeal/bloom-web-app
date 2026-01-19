const sql = require('mssql');
const config = { 
  server: 'lpa-sql-server.database.windows.net', 
  database: 'lpa-bloom-db-dev', 
  user: 'lpaadmin', 
  password: 'BloomPlatform2025!Secure', 
  options: { encrypt: true, trustServerCertificate: false } 
};

async function addMissingColumns() {
  const pool = await sql.connect(config);
  
  console.log('Adding missing columns to practitioners table...');
  
  // Add azure_ad_object_id
  try {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('practitioners') 
        AND name = 'azure_ad_object_id'
      )
      BEGIN
        ALTER TABLE practitioners ADD azure_ad_object_id NVARCHAR(100) NULL;
        PRINT 'Added azure_ad_object_id column';
      END
    `);
    console.log('✓ azure_ad_object_id column checked/added');
  } catch (e) {
    console.error('Error adding azure_ad_object_id:', e.message);
  }

  // Add company_email
  try {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('practitioners') 
        AND name = 'company_email'
      )
      BEGIN
        ALTER TABLE practitioners ADD company_email NVARCHAR(255) NULL;
        PRINT 'Added company_email column';
      END
    `);
    console.log('✓ company_email column checked/added');
  } catch (e) {
    console.error('Error adding company_email:', e.message);
  }

  // Create indexes
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_practitioners_azure_ad_object_id')
      BEGIN
        CREATE NONCLUSTERED INDEX IX_practitioners_azure_ad_object_id 
        ON practitioners (azure_ad_object_id) 
        WHERE azure_ad_object_id IS NOT NULL;
      END
    `);
    console.log('✓ IX_practitioners_azure_ad_object_id index checked/created');
  } catch (e) {
    console.error('Error creating index:', e.message);
  }

  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_practitioners_company_email')
      BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX IX_practitioners_company_email 
        ON practitioners (company_email) 
        WHERE company_email IS NOT NULL;
      END
    `);
    console.log('✓ IX_practitioners_company_email index checked/created');
  } catch (e) {
    console.error('Error creating index:', e.message);
  }

  // Verify
  const result = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'practitioners'");
  console.log('\nFinal practitioners columns:', result.recordset.map(c => c.COLUMN_NAME));
  
  await pool.close();
  process.exit(0);
}

addMissingColumns().catch(e => { console.error(e); process.exit(1); });
