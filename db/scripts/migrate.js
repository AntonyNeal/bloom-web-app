import Flywaydb from 'node-flywaydb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Get environment from command line or environment variable
const dbEnv = process.env.DB_ENV || 'development';
const command = process.argv[2] || 'migrate';

console.log(`🔧 Running Flyway command: ${command}`);
console.log(`🌍 Environment: ${dbEnv}`);

// Build connection string based on environment
const getConnectionString = () => {
  const envPrefix = dbEnv === 'development' ? 'DEV' : dbEnv === 'staging' ? 'STAGING' : 'PROD';
  
  const server = process.env[`DB_${envPrefix}_SERVER`];
  const database = process.env[`DB_${envPrefix}_DATABASE`];
  const user = process.env[`DB_${envPrefix}_USER`];
  const password = process.env[`DB_${envPrefix}_PASSWORD`];

  if (!server || !database || !user || !password) {
    console.error(`❌ Missing database configuration for ${dbEnv} environment`);
    console.error(`   Required: DB_${envPrefix}_SERVER, DB_${envPrefix}_DATABASE, DB_${envPrefix}_USER, DB_${envPrefix}_PASSWORD`);
    process.exit(1);
  }

  return `Server=tcp:${server},1433;Initial Catalog=${database};User ID=${user};Password=${password};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;`;
};

// Flyway configuration
const flywayConfig = {
  flywayArgs: {
    url: `jdbc:sqlserver://${process.env[`DB_${dbEnv === 'development' ? 'DEV' : dbEnv === 'staging' ? 'STAGING' : 'PROD'}_SERVER`]}:1433;database=${process.env[`DB_${dbEnv === 'development' ? 'DEV' : dbEnv === 'staging' ? 'STAGING' : 'PROD'}_DATABASE`]};encrypt=true;trustServerCertificate=false;`,
    user: process.env[`DB_${dbEnv === 'development' ? 'DEV' : dbEnv === 'staging' ? 'STAGING' : 'PROD'}_USER`],
    password: process.env[`DB_${dbEnv === 'development' ? 'DEV' : dbEnv === 'staging' ? 'STAGING' : 'PROD'}_PASSWORD`],
    locations: `filesystem:${join(__dirname, '..', 'migrations')}`,
    sqlMigrationPrefix: 'V',
    repeatableSqlMigrationPrefix: 'R',
    sqlMigrationSeparator: '__',
    sqlMigrationSuffixes: '.sql',
    table: 'flyway_schema_history',
    baselineVersion: '0',
    baselineDescription: 'Initial baseline',
    validateOnMigrate: true,
    outOfOrder: false,
    cleanDisabled: dbEnv === 'production', // Prevent accidental clean in production
  },
  downloads: {
    storageDirectory: join(__dirname, '..', 'flyway-cli'),
  },
};

// Execute Flyway command
async function runMigration() {
  try {
    const flyway = new Flywaydb(flywayConfig);

    console.log(`\n📊 Migration Status (before ${command}):`);
    
    switch (command) {
      case 'migrate':
        console.log('🚀 Running migrations...');
        await flyway.migrate();
        console.log('✅ Migrations completed successfully');
        break;
      
      case 'info':
        console.log('📋 Getting migration info...');
        await flyway.info();
        break;
      
      case 'validate':
        console.log('🔍 Validating migrations...');
        await flyway.validate();
        console.log('✅ Migrations validated successfully');
        break;
      
      case 'baseline':
        console.log('🎯 Setting baseline...');
        await flyway.baseline();
        console.log('✅ Baseline set successfully');
        break;
      
      case 'repair':
        console.log('🔧 Repairing schema history...');
        await flyway.repair();
        console.log('✅ Schema history repaired successfully');
        break;
      
      case 'clean':
        if (dbEnv === 'production') {
          console.error('❌ Clean is disabled in production for safety');
          process.exit(1);
        }
        console.log('🧹 Cleaning database...');
        console.log('⚠️  WARNING: This will drop all objects in the database!');
        await flyway.clean();
        console.log('✅ Database cleaned successfully');
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nAvailable commands:');
        console.log('  migrate   - Run pending migrations');
        console.log('  info      - Show migration status');
        console.log('  validate  - Validate applied migrations');
        console.log('  baseline  - Baseline existing database');
        console.log('  repair    - Repair schema history');
        console.log('  clean     - Drop all database objects (dev/staging only)');
        process.exit(1);
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
