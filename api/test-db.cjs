const sql = require('mssql');

const config = {
  server: 'lpa-sql-server.database.windows.net',
  database: 'lpa-bloom-db-dev',
  user: 'lpaadmin',
  password: 'BloomPlatform2025!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function test() {
  try {
    console.log('Connecting...');
    const pool = await sql.connect(config);
    
    console.log('Querying...');
    const startDateUnix = Math.floor(new Date('2025-12-10T00:00:00Z').getTime() / 1000);
    const endDateUnix = Math.floor(new Date('2025-12-31T23:59:59Z').getTime() / 1000);
    
    const result = await pool
      .request()
      .input('startDateUnix', sql.BigInt, startDateUnix)
      .input('endDateUnix', sql.BigInt, endDateUnix)
      .query(`
        SELECT COUNT(*) as cnt FROM availability_slots 
        WHERE slot_start_unix >= @startDateUnix
          AND slot_end_unix <= @endDateUnix
          AND status = 'free'
          AND is_bookable = 1
      `);
    
    console.log('Result:', result.recordset[0].cnt);
    pool.close();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();
