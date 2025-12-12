/**
 * Azure SQL Native Migration Script
 * Uses mssql package directly instead of Flyway
 * Manages migrations through a schema_migrations tracking table
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Database configuration from environment variables
function getDbConfig() {
  const server = process.env.DB_SERVER || 'lpa-sql-server.database.windows.net';
  const database = process.env.DB_NAME || process.env.DATABASE_NAME || 'lpa-bloom-db-dev';
  const user = process.env.DB_USER || process.env.DATABASE_USER;
  const password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD;

  if (!user || !password) {
    throw new Error('Database credentials not found. Set DB_USER and DB_PASSWORD environment variables.');
  }

  return {
    server,
    database,
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 30000,
      requestTimeout: 60000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

// Compute checksum for migration file
function computeChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Parse migration filename: V001__description.sql
function parseMigrationFilename(filename) {
  const match = filename.match(/^V(\d+)__(.+)\.sql$/i);
  if (!match) return null;
  return {
    version: parseInt(match[1], 10),
    description: match[2].replace(/_/g, ' '),
    filename,
  };
}

// Get all migration files from migrations directory
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found at:', migrationsDir);
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^V\d+__.*\.sql$/i))
    .map(filename => {
      const parsed = parseMigrationFilename(filename);
      if (!parsed) return null;
      
      const filePath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      return {
        ...parsed,
        filePath,
        content,
        checksum: computeChecksum(content),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.version - b.version);

  return files;
}

// Ensure schema_migrations table exists
async function ensureMigrationsTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'schema_migrations')
    BEGIN
      CREATE TABLE schema_migrations (
        version INT NOT NULL PRIMARY KEY,
        description NVARCHAR(255) NOT NULL,
        checksum NVARCHAR(64) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        execution_time_ms INT NULL,
        success BIT NOT NULL DEFAULT 1
      );
      PRINT 'Created schema_migrations table';
    END
  `);
}

// Get applied migrations from database
async function getAppliedMigrations(pool) {
  const result = await pool.request().query(`
    SELECT version, description, checksum, applied_at, success
    FROM schema_migrations
    ORDER BY version
  `);
  return result.recordset;
}

// Apply a single migration
async function applyMigration(pool, migration) {
  const startTime = Date.now();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    const request = transaction.request();
    
    // Capture PRINT statements from SQL
    request.on('info', (info) => {
      console.log(`   ${info.message}`);
    });
    
    // Execute migration SQL (split by GO statements for batch execution)
    const batches = migration.content
      .split(/^\s*GO\s*$/mi)
      .map(b => b.trim())
      .filter(b => b.length > 0);
    
    for (const batch of batches) {
      await request.query(batch);
    }
    
    // Record migration
    const executionTime = Date.now() - startTime;
    await request.query(`
      INSERT INTO schema_migrations (version, description, checksum, execution_time_ms, success)
      VALUES (${migration.version}, '${migration.description.replace(/'/g, "''")}', '${migration.checksum}', ${executionTime}, 1)
    `);
    
    await transaction.commit();
    return { success: true, executionTime };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Migrate command - run pending migrations
async function migrate() {
  console.log('=== Azure SQL Migration ===\n');
  
  const config = getDbConfig();
  console.log(`Connecting to: ${config.server}/${config.database}`);
  
  const pool = await sql.connect(config);
  
  try {
    await ensureMigrationsTable(pool);
    
    const migrations = getMigrationFiles();
    const applied = await getAppliedMigrations(pool);
    const appliedVersions = new Set(applied.map(a => a.version));
    
    // Check for checksum mismatches
    for (const migration of migrations) {
      const appliedMigration = applied.find(a => a.version === migration.version);
      if (appliedMigration && appliedMigration.checksum !== migration.checksum) {
        throw new Error(
          `Checksum mismatch for migration V${migration.version}! ` +
          `Expected: ${appliedMigration.checksum}, Got: ${migration.checksum}. ` +
          `Migration files should not be modified after being applied.`
        );
      }
    }
    
    // Find pending migrations
    const pending = migrations.filter(m => !appliedVersions.has(m.version));
    
    if (pending.length === 0) {
      console.log('\n✓ Database is up to date. No migrations to apply.');
      return;
    }
    
    console.log(`\nFound ${pending.length} pending migration(s):\n`);
    
    for (const migration of pending) {
      console.log(`Applying: V${String(migration.version).padStart(3, '0')}__${migration.description}`);
      
      try {
        const result = await applyMigration(pool, migration);
        console.log(`  ✓ Applied successfully (${result.executionTime}ms)`);
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        throw error;
      }
    }
    
    console.log('\n✓ All migrations applied successfully!');
  } finally {
    await pool.close();
  }
}

// Info command - show migration status
async function info() {
  console.log('=== Migration Status ===\n');
  
  const config = getDbConfig();
  console.log(`Database: ${config.server}/${config.database}\n`);
  
  const pool = await sql.connect(config);
  
  try {
    await ensureMigrationsTable(pool);
    
    const migrations = getMigrationFiles();
    const applied = await getAppliedMigrations(pool);
    const appliedMap = new Map(applied.map(a => [a.version, a]));
    
    console.log('Version  | Status   | Description');
    console.log('---------|----------|---------------------------');
    
    for (const migration of migrations) {
      const appliedMigration = appliedMap.get(migration.version);
      const status = appliedMigration ? 'Applied' : 'Pending';
      const version = `V${String(migration.version).padStart(3, '0')}`;
      console.log(`${version}   | ${status.padEnd(8)} | ${migration.description}`);
    }
    
    // Check for applied migrations not in files (shouldn't happen normally)
    for (const [version, appliedMigration] of appliedMap) {
      if (!migrations.find(m => m.version === version)) {
        console.log(`V${String(version).padStart(3, '0')}   | Missing  | ${appliedMigration.description} (in DB but file missing)`);
      }
    }
    
    const pendingCount = migrations.filter(m => !appliedMap.has(m.version)).length;
    console.log(`\nTotal: ${migrations.length} migration(s), ${pendingCount} pending`);
  } finally {
    await pool.close();
  }
}

// Validate command - check migration integrity
async function validate() {
  console.log('=== Validating Migrations ===\n');
  
  const config = getDbConfig();
  const pool = await sql.connect(config);
  let errors = [];
  
  try {
    await ensureMigrationsTable(pool);
    
    const migrations = getMigrationFiles();
    const applied = await getAppliedMigrations(pool);
    const appliedMap = new Map(applied.map(a => [a.version, a]));
    
    // Check for checksum mismatches
    for (const migration of migrations) {
      const appliedMigration = appliedMap.get(migration.version);
      if (appliedMigration && appliedMigration.checksum !== migration.checksum) {
        errors.push(
          `Checksum mismatch for V${migration.version}__${migration.description}: ` +
          `DB has ${appliedMigration.checksum}, file has ${migration.checksum}`
        );
      }
    }
    
    // Check for missing migration files
    for (const [version, appliedMigration] of appliedMap) {
      if (!migrations.find(m => m.version === version)) {
        errors.push(
          `Missing migration file for V${version}__${appliedMigration.description} (applied to DB)`
        );
      }
    }
    
    // Check for version gaps
    const versions = migrations.map(m => m.version).sort((a, b) => a - b);
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] !== versions[i - 1] + 1) {
        errors.push(
          `Version gap detected: V${versions[i - 1]} -> V${versions[i]}`
        );
      }
    }
    
    if (errors.length === 0) {
      console.log('✓ All migrations are valid!');
      return true;
    } else {
      console.log('✗ Validation errors found:\n');
      errors.forEach(e => console.log(`  - ${e}`));
      return false;
    }
  } finally {
    await pool.close();
  }
}

// Main entry point
async function main() {
  const command = process.argv[2] || 'migrate';
  
  try {
    switch (command) {
      case 'migrate':
        await migrate();
        break;
      case 'info':
        await info();
        break;
      case 'validate':
        const valid = await validate();
        process.exit(valid ? 0 : 1);
        break;
      default:
        console.log('Usage: node migrate.js [migrate|info|validate]');
        console.log('  migrate  - Apply pending migrations (default)');
        console.log('  info     - Show migration status');
        console.log('  validate - Validate migration integrity');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
