/**
 * Manually run the V032 migration to add halaxy_clinic_id and halaxy_fee_id columns
 * Use this if GitHub Actions hasn't run the Flyway migration yet
 */
const sql = require('mssql');

const config = {
  server: process.env.SQL_SERVER || 'lpa-sql-server.database.windows.net',
  database: process.env.SQL_DATABASE || 'lpa-bloom-db-dev',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.SQL_USERNAME,
      password: process.env.SQL_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function runMigration() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    
    // Check if columns already exist
    console.log('\nChecking if migration already ran...');
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' 
      AND COLUMN_NAME = 'halaxy_clinic_id'
    `);
    
    if (checkResult.recordset[0].count > 0) {
      console.log('✅ Migration already ran - columns exist');
      console.log('   Run check-practitioner-halaxy-columns.cjs to view data');
      process.exit(0);
    }
    
    console.log('📋 Running V032 migration...\n');
    
    // Step 1: Add columns
    console.log('1. Adding halaxy_clinic_id and halaxy_fee_id columns...');
    await pool.request().query(`
      ALTER TABLE practitioners
      ADD halaxy_clinic_id NVARCHAR(50) NULL,
          halaxy_fee_id NVARCHAR(50) NULL
    `);
    console.log('   ✅ Columns added');
    
    // Step 2: Update Zoe's values
    console.log('\n2. Setting Zoe\'s clinic and fee IDs...');
    const zoeResult = await pool.request().query(`
      UPDATE practitioners
      SET halaxy_clinic_id = '1023041',
          halaxy_fee_id = '9381231'
      WHERE first_name = 'Zoe'
        AND halaxy_practitioner_id = '1304541'
    `);
    console.log(`   ✅ Updated ${zoeResult.rowsAffected[0]} row(s)`);
    
    // Step 3: Update Julian's values
    console.log('\n3. Setting Julian\'s clinic and fee IDs...');
    const julianResult = await pool.request().query(`
      UPDATE practitioners
      SET halaxy_clinic_id = '1023041',
          halaxy_fee_id = '9381231'
      WHERE first_name = 'Julian'
        AND halaxy_practitioner_id = '1473161'
    `);
    console.log(`   ✅ Updated ${julianResult.rowsAffected[0]} row(s)`);
    
    // Step 4: Set defaults for other active practitioners
    console.log('\n4. Setting default clinic and fee IDs for other active practitioners...');
    const defaultResult = await pool.request().query(`
      UPDATE practitioners
      SET halaxy_clinic_id = '1023041',
          halaxy_fee_id = '9381231'
      WHERE is_active = 1
        AND halaxy_clinic_id IS NULL
    `);
    console.log(`   ✅ Updated ${defaultResult.rowsAffected[0]} row(s)`);
    
    // Verify
    console.log('\n5. Verifying migration...');
    const verifyResult = await pool.request().query(`
      SELECT 
        first_name,
        halaxy_practitioner_id,
        halaxy_clinic_id,
        halaxy_fee_id
      FROM practitioners
      WHERE is_active = 1
      ORDER BY first_name
    `);
    
    console.log('\nActive Practitioners after migration:');
    console.log('─'.repeat(80));
    verifyResult.recordset.forEach(p => {
      console.log(`${p.first_name}`);
      console.log(`  Practitioner: ${p.halaxy_practitioner_id}`);
      console.log(`  Clinic: ${p.halaxy_clinic_id}`);
      console.log(`  Fee: ${p.halaxy_fee_id}\n`);
    });
    
    console.log('✅ Migration V032 completed successfully!');
    console.log('\n💡 Now the public/practitioners API will return clinic and fee IDs');
    console.log('💡 The booking form will pass these to the availability API');
    
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.code === 'ELOGIN') {
      console.error('\n💡 Hint: Set these environment variables:');
      console.error('   SQL_SERVER=lpa-sql-server.database.windows.net');
      console.error('   SQL_DATABASE=lpa-bloom-db-dev');
      console.error('   SQL_USERNAME=<your-username>');
      console.error('   SQL_PASSWORD=<your-password>');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigration();
