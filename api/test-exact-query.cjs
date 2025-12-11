const sql = require('mssql');

const startDate = new Date('2025-12-10T00:00:00.000Z');
const endDate = new Date('2025-12-31T23:59:59.000Z');
const startUnix = Math.floor(startDate.getTime() / 1000);
const endUnix = Math.floor(endDate.getTime() / 1000);

console.log('Start Unix:', startUnix);
console.log('End Unix:', endUnix);

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

sql.connect(config)
  .then(pool => {
    return pool.request()
      .input('startUnix', sql.BigInt, startUnix)
      .input('endUnix', sql.BigInt, endUnix)
      .query(`
        SELECT COUNT(*) as count 
        FROM availability_slots 
        WHERE slot_start_unix >= @startUnix 
        AND slot_end_unix <= @endUnix 
        AND status = 'free' 
        AND is_bookable = 1
      `);
  })
  .then(result => {
    console.log('Count:', result.recordset[0].count);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
