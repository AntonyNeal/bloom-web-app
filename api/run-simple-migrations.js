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
    
    // Check if we need to seed existing migrations
    // If schema_versions is empty but key tables exist, seed the already-applied versions
    const countResult = await pool.request().query('SELECT COUNT(*) as count FROM schema_versions');
    const versionCount = countResult.recordset[0].count;
    
    if (versionCount === 0) {
      console.log('📋 Checking for existing database objects to seed version history...\n');
      
      // Check which tables already exist and seed accordingly
      const tablesResult = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      const existingTables = new Set(tablesResult.recordset.map(r => r.TABLE_NAME.toLowerCase()));
      
      console.log(`   Found tables: ${Array.from(existingTables).join(', ')}\n`);
      
      const seedVersions = [];
      
      // V1 creates applications table
      if (existingTables.has('applications')) {
        seedVersions.push({ version: 'V1', description: 'initial schema' });
      }
      
      // V2 creates ab_test_metadata, ab_test_variants, ab_test_events tables
      if (existingTables.has('ab_test_metadata') || existingTables.has('ab_test_events')) {
        seedVersions.push({ version: 'V2', description: 'add ab testing' });
      }
      
      // V3 adds session tracking columns/tables
      // If V2 tables exist, assume V3 was also applied (they're sequential)
      if (existingTables.has('ab_test_events')) {
        seedVersions.push({ version: 'V3', description: 'add session tracking' });
      }
      
      // V4/V4b creates practitioners table
      if (existingTables.has('practitioners')) {
        seedVersions.push({ version: 'V4', description: 'practitioner dashboard schema' });
        seedVersions.push({ version: 'V4b', description: 'practitioner dashboard schema fixed' });
      }
      
      // Don't seed V100 - that's the version control schema which isn't needed
      
      if (seedVersions.length > 0) {
        console.log(`📝 Seeding ${seedVersions.length} already-applied migrations:\n`);
        for (const { version, description } of seedVersions) {
          await pool.request()
            .input('version', sql.NVarChar, version)
            .input('description', sql.NVarChar, description)
            .input('applied_by', sql.NVarChar, 'seed-existing')
            .query(`
              INSERT INTO schema_versions (version, description, applied_by)
              VALUES (@version, @description, @applied_by)
            `);
          console.log(`   ✅ Seeded ${version}: ${description}`);
        }
        console.log('');
      }
    }
    
    // Get already applied migrations
    const appliedResult = await pool.request().query('SELECT version FROM schema_versions');
    const appliedVersions = new Set(appliedResult.recordset.map(r => r.version));
    console.log(`📋 Already applied: ${appliedVersions.size} migrations`);
    console.log(`   Versions: ${Array.from(appliedVersions).join(', ')}\n`);
    
    // One-time fix: If V2 is missing but later migrations are applied, add V2 (fixes seeding bug)
    const hasLaterMigration = appliedVersions.has('V3') || appliedVersions.has('V4') || appliedVersions.has('V4b');
    if (!appliedVersions.has('V2') && hasLaterMigration) {
      console.log('🔧 Fixing missing V2 migration record (one-time fix)...');
      try {
        await pool.request()
          .input('version', sql.NVarChar, 'V2')
          .input('description', sql.NVarChar, 'add ab testing')
          .input('applied_by', sql.NVarChar, 'seed-fix')
          .query(`
            INSERT INTO schema_versions (version, description, applied_by)
            VALUES (@version, @description, @applied_by)
          `);
        appliedVersions.add('V2');
        console.log('   ✅ Added V2 to applied migrations\n');
      } catch (err) {
        // Ignore if already exists
        if (!err.message.includes('duplicate')) {
          console.log(`   ⚠️ Could not add V2: ${err.message}\n`);
        }
      }
    }
    
    // One-time fix: If V3 is missing but V4 is applied, add V3
    if (!appliedVersions.has('V3') && (appliedVersions.has('V4') || appliedVersions.has('V4b'))) {
      console.log('🔧 Fixing missing V3 migration record (one-time fix)...');
      try {
        await pool.request()
          .input('version', sql.NVarChar, 'V3')
          .input('description', sql.NVarChar, 'add session tracking')
          .input('applied_by', sql.NVarChar, 'seed-fix')
          .query(`
            INSERT INTO schema_versions (version, description, applied_by)
            VALUES (@version, @description, @applied_by)
          `);
        appliedVersions.add('V3');
        console.log('   ✅ Added V3 to applied migrations\n');
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.log(`   ⚠️ Could not add V3: ${err.message}\n`);
        }
      }
    }
    
    // One-time fix: If V4b is missing but V4 is applied, add V4b
    if (!appliedVersions.has('V4b') && appliedVersions.has('V4')) {
      console.log('🔧 Fixing missing V4b migration record (one-time fix)...');
      try {
        await pool.request()
          .input('version', sql.NVarChar, 'V4b')
          .input('description', sql.NVarChar, 'practitioner dashboard schema fixed')
          .input('applied_by', sql.NVarChar, 'seed-fix')
          .query(`
            INSERT INTO schema_versions (version, description, applied_by)
            VALUES (@version, @description, @applied_by)
          `);
        appliedVersions.add('V4b');
        console.log('   ✅ Added V4b to applied migrations\n');
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.log(`   ⚠️ Could not add V4b: ${err.message}\n`);
        }
      }
    }
    
    // Find migration files (V*.sql pattern)
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No db/migrations directory found. Skipping migrations.');
      await pool.close();
      process.exit(0);
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => /^V\d+[a-z]?__.*\.sql$/.test(f))  // Support V4b format
      .filter(f => !f.includes('version_control'))    // Skip V100 version control schema
      .sort((a, b) => {
        // Extract version number and optional letter (e.g., "4b" from "V4b__...")
        const matchA = a.match(/^V(\d+)([a-z])?/);
        const matchB = b.match(/^V(\d+)([a-z])?/);
        const numA = parseInt(matchA[1]);
        const numB = parseInt(matchB[1]);
        if (numA !== numB) return numA - numB;
        // Same number, sort by letter (a before b, etc.)
        const letterA = matchA[2] || '';
        const letterB = matchB[2] || '';
        return letterA.localeCompare(letterB);
      });
    
    console.log(`📁 Found ${migrationFiles.length} migration files\n`);
    
    let applied = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const file of migrationFiles) {
      // Extract version (e.g., "V5" from "V5__availability_slots.sql" or "V4b" from "V4b__...")
      const versionMatch = file.match(/^(V\d+[a-z]?)/);
      const version = versionMatch[1];
      
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
        const description = file.replace(/^V\d+[a-z]?__/, '').replace(/\.sql$/, '').replace(/_/g, ' ');
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
