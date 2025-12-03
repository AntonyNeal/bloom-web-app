/**
 * Simple Migration Runner for CI/CD
 * 
 * Runs SQL migration files from db/migrations directory directly against Azure SQL.
 * Uses a simple schema_versions table to track applied migrations.
 * 
 * @author LPA Development Team
 * @date 2025-12-04
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connectionString = process.env.SQL_CONNECTION_STRING;
  const dryRun = process.env.DRY_RUN === 'true';
  
  if (!connectionString) {
    console.error('❌ SQL_CONNECTION_STRING environment variable not set');
    process.exit(1);
  }
  
  console.log('🔄 Connecting to Azure SQL Database...');
  console.log(`   Dry Run: ${dryRun}`);
  
  let pool;
  try {
    pool = await sql.connect(connectionString);
    console.log('✅ Connected successfully!\n');
    
    // Ensure schema_versions table exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='schema_versions' AND xtype='U')
      CREATE TABLE schema_versions (
        id INT PRIMARY KEY IDENTITY(1,1),
        version NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(500),
        applied_at DATETIME2 DEFAULT GETUTCDATE(),
        applied_by NVARCHAR(255) DEFAULT SYSTEM_USER
      )
    `);
    
    // Get already applied migrations
    const appliedResult = await pool.request().query('SELECT version FROM schema_versions');
    const appliedVersions = new Set(appliedResult.recordset.map(r => r.version));
    console.log(`📋 Already applied: ${appliedVersions.size} migrations\n`);
    
    // Find migration files (V*.sql pattern)
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No db/migrations directory found. Skipping migrations.');
      await pool.close();
      process.exit(0);
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => /^V\d+__.*\.sql$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^V(\d+)/)[1]);
        const numB = parseInt(b.match(/^V(\d+)/)[1]);
        return numA - numB;
      });
    
    console.log(`📁 Found ${migrationFiles.length} migration files\n`);
    
    let applied = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const file of migrationFiles) {
      // Extract version (e.g., "V5" from "V5__availability_slots.sql")
      const version = file.match(/^(V\d+)/)[1];
      
      if (appliedVersions.has(version)) {
        console.log(`⏭️  ${file} - already applied`);
        skipped++;
        continue;
      }
      
      console.log(`🔄 Applying: ${file}...`);
      
      if (dryRun) {
        console.log(`   ✅ Would apply (dry run)`);
        applied++;
        continue;
      }
      
      try {
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Split by GO statements and execute each batch
        const batches = migrationSQL
          .split(/\nGO\s*\n/i)
          .filter(batch => batch.trim().length > 0);
        
        for (const batch of batches) {
          await pool.request().query(batch);
        }
        
        // Record the migration
        const description = file.replace(/^V\d+__/, '').replace(/\.sql$/, '').replace(/_/g, ' ');
        await pool.request()
          .input('version', sql.NVarChar, version)
          .input('description', sql.NVarChar, description)
          .input('applied_by', sql.NVarChar, process.env.GITHUB_ACTOR || 'ci-cd')
          .query(`
            INSERT INTO schema_versions (version, description, applied_by)
            VALUES (@version, @description, @applied_by)
          `);
        
        console.log(`   ✅ Applied successfully`);
        applied++;
      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        failed++;
        
        // Stop on first failure
        console.error('\n❌ Migration failed. Stopping to prevent further issues.');
        await pool.close();
        process.exit(1);
      }
    }
    
    await pool.close();
    
    console.log('\n━'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Applied: ${applied}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed:  ${failed}`);
    console.log('━'.repeat(50));
    
    if (failed > 0) {
      process.exit(1);
    }
    
    console.log('\n🎉 Migrations completed successfully!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    if (pool) await pool.close();
    process.exit(1);
  }
}

runMigrations();
