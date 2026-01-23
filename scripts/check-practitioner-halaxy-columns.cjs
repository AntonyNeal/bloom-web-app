/**
 * Check if halaxy_clinic_id and halaxy_fee_id columns exist in practitioners table
 * and view the current data
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

async function checkPractitionerColumns() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    
    // Check if columns exist
    console.log('\n1. Checking if halaxy_clinic_id and halaxy_fee_id columns exist...');
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' 
      AND COLUMN_NAME IN ('halaxy_clinic_id', 'halaxy_fee_id')
      ORDER BY COLUMN_NAME
    `);
    
    if (columnsResult.recordset.length === 0) {
      console.log('❌ Columns do NOT exist yet. Migration has not run.');
      console.log('   The GitHub Actions workflow should run the migration automatically.');
      process.exit(1);
    }
    
    console.log('✅ Columns exist:');
    columnsResult.recordset.forEach(row => {
      console.log(`   - ${row.COLUMN_NAME} (${row.DATA_TYPE}, nullable: ${row.IS_NULLABLE})`);
    });
    
    // Check practitioner data
    console.log('\n2. Checking practitioner Halaxy IDs...');
    const practitionersResult = await pool.request().query(`
      SELECT 
        id,
        first_name,
        last_name,
        halaxy_practitioner_id,
        halaxy_clinic_id,
        halaxy_fee_id,
        is_active
      FROM practitioners
      WHERE is_active = 1
      ORDER BY first_name
    `);
    
    console.log('\nActive Practitioners:');
    console.log('─'.repeat(100));
    practitionersResult.recordset.forEach(p => {
      const status = p.halaxy_clinic_id && p.halaxy_fee_id ? '✅' : '❌';
      console.log(`${status} ${p.first_name} ${p.last_name}`);
      console.log(`   Practitioner ID: ${p.halaxy_practitioner_id || 'NOT SET'}`);
      console.log(`   Clinic ID: ${p.halaxy_clinic_id || 'NOT SET'}`);
      console.log(`   Fee ID: ${p.halaxy_fee_id || 'NOT SET'}`);
      console.log('');
    });
    
    // Summary
    const missingConfig = practitionersResult.recordset.filter(
      p => !p.halaxy_clinic_id || !p.halaxy_fee_id
    );
    
    if (missingConfig.length > 0) {
      console.log(`\n⚠️  ${missingConfig.length} practitioner(s) missing clinic/fee IDs`);
      process.exit(1);
    } else {
      console.log('\n✅ All active practitioners have clinic and fee IDs configured');
      process.exit(0);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ELOGIN') {
      console.error('\n💡 Hint: Set SQL_USERNAME and SQL_PASSWORD environment variables');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkPractitionerColumns();
