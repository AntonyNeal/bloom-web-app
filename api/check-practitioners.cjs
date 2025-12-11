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
        practitioner_id,
        COUNT(*) as slot_count,
        MIN(slot_start_unix) as earliest_unix,
        MAX(slot_start_unix) as latest_unix
      FROM availability_slots
      WHERE status = 'free' AND is_bookable = 1
      GROUP BY practitioner_id
    `);
  })
  .then(result => {
    console.log('Practitioners with free bookable slots:');
    console.table(result.recordset);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
