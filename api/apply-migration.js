/**
 * Quick Migration Script for V7__convert_to_unix_timestamps.sql
 * Run this with: node apply-migration.js
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const connectionString = 'Server=tcp:lpa-sql-server.database.windows.net,1433;Initial Catalog=lpa-bloom-db-dev;Persist Security Info=False;User ID=lpaadmin;Password=BloomPlatform2025!Secure;Encrypt=True;Connection Timeout=30;';
  
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    const pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully!\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/V7__convert_to_unix_timestamps.sql');
    console.log(`📄 Reading migration from: ${migrationPath}`);
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Executing V7 migration: Convert to Unix Timestamps\n');
    
    // Split by GO statements and execute each batch
    const batches = migrationSql.split(/\nGO\n/i);
    
    for (const batch of batches) {
      const trimmed = batch.trim();
      if (trimmed.length > 0 && !trimmed.startsWith('--')) {
        console.log(`  ⏳ Executing batch...`);
        await pool.request().batch(trimmed);
      }
    }
    
    console.log('\n✅ Migration applied successfully!');
    
    // Verify Unix timestamps were populated
    console.log('\n📊 Verifying results...');
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE WHEN slot_start_unix > 0 THEN 1 END) as slots_with_unix,
        MIN(slot_start_unix) as earliest_unix,
        MAX(slot_end_unix) as latest_unix
      FROM availability_slots
    `);
    
    const row = result.recordset[0];
    console.log(`  Total slots: ${row.total_slots}`);
    console.log(`  Slots with Unix timestamps: ${row.slots_with_unix}`);
    if (row.earliest_unix) {
      console.log(`  Earliest: ${row.earliest_unix} (${new Date(row.earliest_unix * 1000).toISOString()})`);
      console.log(`  Latest: ${row.latest_unix} (${new Date(row.latest_unix * 1000).toISOString()})`);
    }
    
    await pool.close();
    console.log('\n✅ Done!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration();
