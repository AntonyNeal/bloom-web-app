const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new sql.ConnectionPool({
    server: 'lpa-sql-server.database.windows.net',
    database: 'lpa-bloom-db-dev',
    user: 'lpaadmin',
    password: 'BloomPlatform2025!Secure',
    options: {
      encrypt: true,
      trustServerCertificate: false,
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await pool.connect();
    console.log('✅ Connected!\n');

    const migrationFile = path.join(__dirname, 'migrations/006-add-onboarding-email-sent-at.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    console.log('📝 Running migration: 006-add-onboarding-email-sent-at.sql');
    const request = pool.request();
    
    // Split by GO statements and execute each batch
    const batches = migrationSql.split(/\r?\nGO\r?\n/);
    for (const batch of batches) {
      if (batch.trim()) {
        await request.batch(batch);
      }
    }

    console.log('✅ Migration 006 completed successfully!\n');

    // Verify column exists
    const result = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'onboarding_email_sent_at'
      `);

    if (result.recordset.length > 0) {
      console.log('✅ Column verified:');
      console.log(`   onboarding_email_sent_at (${result.recordset[0].DATA_TYPE})`);
    } else {
      console.log('⚠️  Column not found after migration');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

runMigration();
