/**
 * Setup Dev Database - Create initial schema
 * 
 * Run this with: node api/setup-dev-db.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load environment variables from local.settings.json
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'local.settings.json'), 'utf8'));

const config = {
  server: settings.Values.SQL_SERVER,
  database: settings.Values.SQL_DATABASE,
  user: settings.Values.SQL_USER,
  password: settings.Values.SQL_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const schemaSQL = `
-- Applications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'applications')
BEGIN
  CREATE TABLE applications (
    id INT PRIMARY KEY IDENTITY(1,1),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(20),
    ahpra_registration NVARCHAR(50) NOT NULL,
    specializations NVARCHAR(MAX),
    experience_years INT,
    cv_url NVARCHAR(500),
    certificate_url NVARCHAR(500),
    photo_url NVARCHAR(500),
    cover_letter NVARCHAR(MAX),
    qualification_type NVARCHAR(50),
    qualification_check NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'submitted',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    reviewed_by NVARCHAR(100),
    reviewed_at DATETIME2
  );
  PRINT 'Created applications table';
END
ELSE
BEGIN
  PRINT 'applications table already exists';
END
`;

const indexSQL = `
-- Create indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_status' AND object_id = OBJECT_ID('applications'))
BEGIN
  CREATE INDEX idx_status ON applications(status);
  PRINT 'Created idx_status index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_created_at' AND object_id = OBJECT_ID('applications'))
BEGIN
  CREATE INDEX idx_created_at ON applications(created_at DESC);
  PRINT 'Created idx_created_at index';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_email' AND object_id = OBJECT_ID('applications'))
BEGIN
  CREATE INDEX idx_email ON applications(email);
  PRINT 'Created idx_email index';
END
`;

async function setupDevDb() {
  console.log('🔄 Connecting to Azure SQL Database...');
  console.log(`   Server: ${config.server}`);
  console.log(`   Database: ${config.database}`);
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Create the applications table
    console.log('🔄 Creating applications table...');
    await pool.request().query(schemaSQL);
    console.log('✅ Schema applied!\n');

    // Create indexes
    console.log('🔄 Creating indexes...');
    await pool.request().query(indexSQL);
    console.log('✅ Indexes created!\n');

    // Verify
    console.log('🔍 Verifying tables...');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    console.log('   Tables:', tables.recordset.map(t => t.TABLE_NAME).join(', '));

    await pool.close();
    console.log('\n✅ Dev database setup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupDevDb();
