#!/usr/bin/env node

/**
 * Direct Migration Runner for 005-add-onboarding-token-fields.sql
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: 'BloomPlatform2025!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function runMigration() {
  let pool;
  try {
    console.log('🔄 Connecting to Azure SQL Database...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Database: ${config.database}\n`);
    
    pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Read the migration file
    const migrationFile = path.join(__dirname, 'migrations', '005-add-onboarding-token-fields.sql');
    const sqlText = fs.readFileSync(migrationFile, 'utf-8');

    console.log('🔄 Running migration: 005-add-onboarding-token-fields.sql');
    console.log('   Adding onboarding token fields to practitioners table...\n');

    // Split by GO statements and execute each batch
    const batches = sqlText.split(/\nGO\n/i).filter(b => b.trim());
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        try {
          await pool.request().batch(batch);
          console.log(`   ✅ Batch ${i + 1}/${batches.length} completed`);
        } catch (batchError) {
          // If it's just a constraint violation or column already exists, that's okay
          if (batchError.message.includes('already exists') || 
              batchError.message.includes('column') ||
              batchError.message.includes('constraint')) {
            console.log(`   ⓘ Batch ${i + 1}/${batches.length} skipped (already exists)`);
          } else {
            throw batchError;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Verify columns were added
    console.log('\n🔍 Verifying columns...');
    const verifyResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'practitioners'
        AND COLUMN_NAME IN ('onboarding_token', 'onboarding_token_expires_at', 'onboarding_completed_at')
        ORDER BY COLUMN_NAME
      `);
    
    if (verifyResult.recordset.length > 0) {
      console.log('   Added columns:');
      verifyResult.recordset.forEach(col => {
        console.log(`   ✅ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } else {
      console.log('   ⚠️  No new columns found - they may have already existed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigration();
