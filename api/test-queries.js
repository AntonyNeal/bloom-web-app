/**
 * Test query to see what slots are returned with different conditions
 */

const sql = require('mssql');

async function testQueries() {
  const connectionString = 'Server=tcp:lpa-sql-server.database.windows.net,1433;Initial Catalog=lpa-bloom-db-dev;Persist Security Info=False;User ID=lpaadmin;Password=BloomPlatform2025!Secure;Encrypt=True;Connection Timeout=30;';
  
  try {
    const pool = await sql.connect(connectionString);
    
    // Test 1: Query with both start and end within range (current logic)
    const startDate = Math.floor(new Date('2025-12-10T00:00:00Z').getTime() / 1000);
    const endDate = Math.floor(new Date('2026-01-31T23:59:59Z').getTime() / 1000);
    
    console.log(`\n📋 Query parameters:`);
    console.log(`  Start: ${startDate} (${new Date(startDate * 1000).toISOString()})`);
    console.log(`  End: ${endDate} (${new Date(endDate * 1000).toISOString()})`);
    
    // Test 1: Original logic
    console.log(`\n1️⃣ Test 1: WHERE slot_start_unix >= @start AND slot_end_unix <= @end`);
    let result = await pool.request()
      .input('startDate', sql.BigInt, startDate)
      .input('endDate', sql.BigInt, endDate)
      .query(`
        SELECT COUNT(*) as count FROM availability_slots 
        WHERE slot_start_unix >= @startDate 
          AND slot_end_unix <= @endDate 
          AND status = 'free' 
          AND is_bookable = 1
      `);
    console.log(`   Found: ${result.recordset[0].count} slots`);
    
    // Test 2: Start date within range  
    console.log(`\n2️⃣ Test 2: WHERE slot_start_unix >= @start AND slot_start_unix <= @end`);
    result = await pool.request()
      .input('startDate', sql.BigInt, startDate)
      .input('endDate', sql.BigInt, endDate)
      .query(`
        SELECT COUNT(*) as count FROM availability_slots 
        WHERE slot_start_unix >= @startDate 
          AND slot_start_unix <= @endDate
          AND status = 'free' 
          AND is_bookable = 1
      `);
    console.log(`   Found: ${result.recordset[0].count} slots`);
    
    // Test 3: Any overlap
    console.log(`\n3️⃣ Test 3: WHERE slot_start_unix < @end AND slot_end_unix > @start`);
    result = await pool.request()
      .input('startDate', sql.BigInt, startDate)
      .input('endDate', sql.BigInt, endDate)
      .query(`
        SELECT COUNT(*) as count FROM availability_slots 
        WHERE slot_start_unix < @endDate 
          AND slot_end_unix > @startDate
          AND status = 'free' 
          AND is_bookable = 1
      `);
    console.log(`   Found: ${result.recordset[0].count} slots`);
    
    // Test 4: Just check if slots exist at all
    console.log(`\n4️⃣ Test 4: Count all free and bookable slots`);
    result = await pool.request()
      .query(`
        SELECT COUNT(*) as count FROM availability_slots 
        WHERE status = 'free' 
          AND is_bookable = 1
      `);
    console.log(`   Found: ${result.recordset[0].count} slots`);
    
    // Test 5: Show actual slot dates
    console.log(`\n5️⃣ Test 5: Show first 3 slots with dates`);
    result = await pool.request()
      .query(`
        SELECT TOP 3 
          slot_start_unix,
          slot_end_unix,
          CONVERT(VARCHAR, DATEADD(second, slot_start_unix, '1970-01-01'), 121) as start_date,
          CONVERT(VARCHAR, DATEADD(second, slot_end_unix, '1970-01-01'), 121) as end_date
        FROM availability_slots 
        WHERE status = 'free' AND is_bookable = 1
        ORDER BY slot_start_unix
      `);
    result.recordset.forEach(row => {
      console.log(`   ${row.start_date} - ${row.end_date}`);
    });
    
    await pool.close();
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testQueries();
