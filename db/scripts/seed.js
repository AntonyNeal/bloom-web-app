/**
 * Database Seed Runner
 * Runs SQL seed scripts against the Azure SQL database
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
      requestTimeout: 120000, // Seeds can take longer
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

// Run a seed file
async function runSeed(seedFile) {
  const config = getDbConfig();
  let pool;

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running seed: ${path.basename(seedFile)}`);
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`${'='.repeat(60)}\n`);

    // Read seed file
    const seedContent = fs.readFileSync(seedFile, 'utf8');
    console.log(`Seed file loaded (${seedContent.length} characters)`);

    // Connect to database
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected successfully!\n');

    // Split script by GO statements (SQL Server batch separator)
    const batches = seedContent
      .split(/^\s*GO\s*$/gim)
      .filter(batch => batch.trim().length > 0);

    console.log(`Found ${batches.length} batch(es) to execute\n`);

    // Execute each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (!batch) continue;

      try {
        console.log(`Executing batch ${i + 1}/${batches.length}...`);
        const result = await pool.request().query(batch);
        
        // Log any recordsets returned
        if (result.recordsets && result.recordsets.length > 0) {
          result.recordsets.forEach((recordset, idx) => {
            if (recordset.length > 0) {
              console.log(`\nResult set ${idx + 1}:`);
              console.table(recordset);
            }
          });
        }

        if (result.rowsAffected && result.rowsAffected[0] > 0) {
          console.log(`  Rows affected: ${result.rowsAffected[0]}`);
        }
      } catch (batchError) {
        console.error(`\nError in batch ${i + 1}:`);
        console.error(`SQL Error: ${batchError.message}`);
        
        // Show first 500 chars of the failing batch for debugging
        const preview = batch.substring(0, 500);
        console.error(`\nBatch preview:\n${preview}${batch.length > 500 ? '...' : ''}`);
        
        throw batchError;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Seed completed successfully!');
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('\nSeed failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('Database connection closed.');
    }
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default to Dr Sarah Chen seed
    const defaultSeed = path.join(__dirname, '..', 'seeds', 'seed_dr_sarah_chen.sql');
    if (fs.existsSync(defaultSeed)) {
      await runSeed(defaultSeed);
    } else {
      console.error('No seed file specified and default seed not found.');
      console.error('Usage: node seed.js [seed_file.sql]');
      console.error('       node seed.js                    (runs default Dr Sarah Chen seed)');
      process.exit(1);
    }
  } else {
    const seedFile = args[0];
    const fullPath = path.isAbsolute(seedFile) 
      ? seedFile 
      : path.join(__dirname, '..', 'seeds', seedFile);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`Seed file not found: ${fullPath}`);
      process.exit(1);
    }
    
    await runSeed(fullPath);
  }
}

main().catch(console.error);
