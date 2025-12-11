const sql = require('mssql');

const startDate = new Date('2025-12-10T00:00:00.000Z');
const endDate = new Date('2025-12-31T23:59:59.000Z');
const startUnix = Math.floor(startDate.getTime() / 1000);
const endUnix = Math.floor(endDate.getTime() / 1000);
const durationMinutes = 60;
const practitionerId = undefined;

console.log('Testing query with parameters:');
console.log('Start Unix:', startUnix);
console.log('End Unix:', endUnix);
console.log('Duration:', durationMinutes);
console.log('Practitioner:', practitionerId);

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
      .input('startDateUnix', sql.BigInt, startUnix)
      .input('endDateUnix', sql.BigInt, endUnix)
      .input('duration', sql.Int, durationMinutes)
      .input('practitionerId', sql.UniqueIdentifier, practitionerId || null);

    if (practitionerId) {
      query += ` AND a.practitioner_id = @practitionerId`;
    }

    query += ` ORDER BY a.slot_start_unix`;

    console.log('\nExecuting query...\n');
    return request.query(query);
  })
  .then(result => {
    console.log(`Found ${result.recordset.length} slots`);
    if (result.recordset.length > 0) {
      console.log('\nFirst 3 slots:');
      console.table(result.recordset.slice(0, 3).map(r => ({
        id: r.id,
        start_unix: r.slot_start_unix,
        end_unix: r.slot_end_unix,
        status: r.status,
        practitioner: r.practitioner_id
      })));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  });
