/**
 * Simulate exactly what the Azure Function does
 */

const sql = require('mssql');

async function testFunctionLogic() {
  const connectionString = 'Server=tcp:lpa-sql-server.database.windows.net,1433;Initial Catalog=lpa-bloom-db-dev;Persist Security Info=False;User ID=lpaadmin;Password=BloomPlatform2025!Secure;Encrypt=True;Connection Timeout=30;';
  
  try {
    const pool = await sql.connect(connectionString);
    
    // Simulate what the function receives
    const startDate = new Date('2025-12-01T00:00:00Z');
    const endDate = new Date('2026-01-31T23:59:59Z');
    const durationMinutes = 60;
    const practitionerId = undefined;
    
    console.log('Testing function query logic...\n');
    console.log(`Start Date: ${startDate.toISOString()}`);
    console.log(`End Date: ${endDate.toISOString()}`);
    console.log(`Duration: ${durationMinutes} minutes\n`);
    
    // Build query exactly as the function does
    let query = `
      SELECT 
        a.id,
        a.halaxy_slot_id,
        a.slot_start_unix,
        a.slot_end_unix,
        a.status,
        a.practitioner_id,
        a.duration_minutes,
        a.location_type
      FROM availability_slots a
      WHERE a.slot_start_unix >= @startDateUnix
        AND a.slot_end_unix <= @endDateUnix
        AND a.status = 'free'
        AND a.is_bookable = 1
    `;
    
    const request = pool
      .request()
      .input('startDateUnix', sql.BigInt, Math.floor(startDate.getTime() / 1000))
      .input('endDateUnix', sql.BigInt, Math.floor(endDate.getTime() / 1000))
      .input('duration', sql.Int, durationMinutes)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId || null);
    
    if (practitionerId) {
      query += ` AND a.practitioner_id = @practitionerId`;
    }
    
    query += ` ORDER BY a.slot_start_unix`;
    
    console.log(`📝 Query inputs:`);
    console.log(`  startDateUnix: ${Math.floor(startDate.getTime() / 1000)}`);
    console.log(`  endDateUnix: ${Math.floor(endDate.getTime() / 1000)}`);
    console.log(`  duration: ${durationMinutes}`);
    console.log(`  practitionerId: ${practitionerId}\n`);
    
    const result = await request.query(query);
    
    console.log(`✅ Found ${result.recordset.length} slots`);
    
    if (result.recordset.length > 0) {
      console.log(`\n🎯 First 3 slots:`);
      result.recordset.slice(0, 3).forEach(slot => {
        const start = new Date(slot.slot_start_unix * 1000).toISOString();
        const end = new Date(slot.slot_end_unix * 1000).toISOString();
        console.log(`  ${slot.id}: ${start} - ${end}`);
      });
    }
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
}

testFunctionLogic();
