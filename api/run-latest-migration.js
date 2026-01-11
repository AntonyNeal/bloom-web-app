#!/usr/bin/env node

/**
 * Run Database Migrations
 * 
 * Usage: node run-migration.js [migration-number]
 * Example: node run-migration.js 004
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load environment variables from local.settings.json
const settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'local.settings.json'), 'utf8')
);

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

async function runMigration(migrationNumber) {
  console.log('🔄 Connecting to Azure SQL Database...');
  console.log(`   Server: ${config.server}`);
  console.log(`   Database: ${config.database}`);
  
  try {
    const pool = await sql.connect(config);
    console.log('✅ Connected successfully!\n');

    // Find migration file
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir);
    
    let migrationFile = null;
    if (migrationNumber) {
      // Find specific migration
      migrationFile = files.find(f => f.startsWith(migrationNumber));
    } else {
      // Find the latest migration
      migrationFile = files.sort().reverse()[0];
    }

    if (!migrationFile) {
      throw new Error(
        `Migration file not found. Available files: ${files.join(', ')}`
      );
    }

    const migrationPath = path.join(migrationsDir, migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`🔄 Running migration: ${migrationFile}`);
    console.log(`   Path: ${migrationPath}\n`);

    // Execute the migration
    const result = await pool.request().query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    if (result.output) {
      console.log(`   Output: ${result.output}\n`);
    }

    await pool.close();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

// Get migration number from command line or use latest
const migrationNumber = process.argv[2];
runMigration(migrationNumber);
