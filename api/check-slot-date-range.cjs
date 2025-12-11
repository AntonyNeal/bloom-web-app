const sql = require('mssql');

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
    return pool.request().query(`
      SELECT 
        MIN(slot_start_unix) as earliest_unix,
        MAX(slot_end_unix) as latest_unix,
        COUNT(*) as total_slots
      FROM availability_slots
      WHERE status = 'free' AND is_bookable = 1 AND slot_start_unix IS NOT NULL
    `);
  })
  .then(result => {
    const data = result.recordset[0];
    const earliest = new Date(data.earliest_unix * 1000);
    const latest = new Date(data.latest_unix * 1000);
    
    console.log('\n=== Available Slots Date Range ===');
    console.log(`Total free/bookable slots: ${data.total_slots}`);
    console.log(`\nEarliest slot: ${earliest.toISOString()}`);
    console.log(`Latest slot: ${latest.toISOString()}`);
    console.log(`\nUnix range: ${data.earliest_unix} to ${data.latest_unix}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
