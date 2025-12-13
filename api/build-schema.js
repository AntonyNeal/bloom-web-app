/**
 * Database Schema Builder
 * Drops and rebuilds the entire database schema from db/schema.sql
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function buildSchema() {
  const isDryRun = process.env.DRY_RUN === 'true';
  const connectionString = process.env.SQL_CONNECTION_STRING ||
    `Server=tcp:${process.env.SQL_SERVER},1433;Initial Catalog=${process.env.SQL_DATABASE};User ID=${process.env.SQL_USER};Password=${process.env.SQL_PASSWORD};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`;

  if (!connectionString && !process.env.SQL_SERVER) {
    console.error('❌ SQL connection not configured');
    console.error('   Set SQL_CONNECTION_STRING or SQL_SERVER/SQL_DATABASE/SQL_USER/SQL_PASSWORD');
    process.exit(1);
  }

  console.log('🔄 Building database schema...');
  console.log(`   Dry Run: ${isDryRun}`);

  let pool;
  try {
    pool = await sql.connect(connectionString);
    console.log('✅ Connected to database\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split by GO statements and execute each batch
    const batches = schemaSql
      .split(/^\s*GO\s*$/gim)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`📝 Executing ${batches.length} SQL batches...\n`);

    for (let i = 0; i < batches.length; i++) {
      if (isDryRun) {
        console.log(`[DRY RUN] Batch ${i + 1}/${batches.length}`);
        continue;
      }

      try {
        await pool.request().query(batches[i]);
        console.log(`✓ Batch ${i + 1}/${batches.length}`);
      } catch (err) {
        console.error(`✗ Batch ${i + 1}/${batches.length} failed:`);
        console.error(`  ${err.message}`);
        throw err;
      }
    }

    console.log('\n✅ Database schema built successfully!');

  } catch (error) {
    console.error('\n❌ Schema build failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

buildSchema();
