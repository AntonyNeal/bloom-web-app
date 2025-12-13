import sql from 'mssql';

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: 'BloomPlatform2025!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function checkSlots() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    // Check total slots
    const totalResult = await sql.query`
      SELECT COUNT(*) as total FROM availability_slots
    `;
    console.log(`📊 Total slots in database: ${totalResult.recordset[0].total}`);
    
    // Check slots with Unix timestamps
    const unixResult = await sql.query`
      SELECT 
        COUNT(*) as with_unix,
        COUNT(CASE WHEN slot_start_unix IS NOT NULL AND slot_start_unix > 0 THEN 1 END) as valid_unix
      FROM availability_slots
    `;
    console.log(`⏱️  Slots with Unix timestamps: ${unixResult.recordset[0].valid_unix}`);
    
    // Check date range
    const rangeResult = await sql.query`
      SELECT 
        MIN(slot_start_unix) as min_unix,
        MAX(slot_start_unix) as max_unix,
        DATEADD(s, MIN(slot_start_unix), '1970-01-01') as earliest,
        DATEADD(s, MAX(slot_start_unix), '1970-01-01') as latest
      FROM availability_slots
      WHERE slot_start_unix IS NOT NULL AND slot_start_unix > 0
    `;
    if (rangeResult.recordset[0].min_unix) {
      console.log(`📅 Date range: ${rangeResult.recordset[0].earliest} to ${rangeResult.recordset[0].latest}`);
    }
    
    // Check slots in the requested range (2025-12-13 to 2025-12-20)
    const startDate = new Date('2025-12-13T00:00:00Z');
    const endDate = new Date('2025-12-20T23:59:59Z');
    const startUnix = Math.floor(startDate.getTime() / 1000);
    const endUnix = Math.floor(endDate.getTime() / 1000);
    
    console.log(`\n🔍 Checking range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`   Unix range: ${startUnix} to ${endUnix}`);
    
    const rangeCheck = await sql.query`
      SELECT COUNT(*) as slots_in_range
      FROM availability_slots
      WHERE slot_start_unix < ${endUnix}
        AND slot_end_unix > ${startUnix}
    `;
    console.log(`✅ Slots in requested range: ${rangeCheck.recordset[0].slots_in_range}`);
    
    // Show first 10 slots
    const sampleResult = await sql.query`
      SELECT TOP 10
        id,
        slot_start_unix,
        slot_end_unix,
        DATEADD(s, slot_start_unix, '1970-01-01') as slot_start_utc,
        DATEADD(s, slot_end_unix, '1970-01-01') as slot_end_utc
      FROM availability_slots
      WHERE slot_start_unix IS NOT NULL AND slot_start_unix > 0
      ORDER BY slot_start_unix DESC
    `;
    
    if (sampleResult.recordset.length > 0) {
      console.log('\n📋 Sample slots (latest 10):');
      sampleResult.recordset.forEach((slot, i) => {
        console.log(`   ${i+1}. ${slot.slot_start_utc} to ${slot.slot_end_utc}`);
        console.log(`      Unix: ${slot.slot_start_unix} to ${slot.slot_end_unix}`);
      });
    }
    
    await sql.close();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkSlots();
