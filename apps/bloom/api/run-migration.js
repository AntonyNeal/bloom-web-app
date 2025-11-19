/**
 * Migration Script - Add A/B Test Metadata Table
 * 
 * Run this with: node api/run-migration.js
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

async function runMigration() {
  console.log('🔄 Connecting to Azure SQL Database...');
  console.log(`   Server: ${config.server}`);
  console.log(`   Database: ${config.database}`);
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '002_create_test_metadata.sql'),
      'utf8'
    );

    console.log('🔄 Running migration: 002_create_test_metadata.sql');
    console.log('   Creating ab_test_metadata table with display labels...\n');

    // Execute the migration
    const result = await pool.request().query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log(`   Messages: ${result.output}\n`);

    // Verify the data was inserted
    console.log('🔍 Verifying test metadata...');
    const verifyResult = await pool.request().query('SELECT * FROM ab_test_metadata');
    
    console.log(`\n✅ Found ${verifyResult.recordset.length} test metadata records:\n`);
    verifyResult.recordset.forEach(record => {
      console.log(`   • ${record.test_name}`);
      console.log(`     Label: "${record.display_label}"`);
      console.log(`     Description: ${record.description}\n`);
    });

    await pool.close();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

runMigration();
