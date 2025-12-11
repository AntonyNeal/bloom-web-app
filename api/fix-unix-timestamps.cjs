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

async function fixUnixTimestamps() {
  console.log('Connecting to database...');
  const pool = await sql.connect(config);

  console.log('Updating Unix timestamps for all slots...');
  const result = await pool.request().query(`
    UPDATE availability_slots
    SET 
      slot_start_unix = DATEDIFF(SECOND, '1970-01-01', slot_start),
      slot_end_unix = DATEDIFF(SECOND, '1970-01-01', slot_end)
    WHERE slot_start_unix IS NULL OR slot_end_unix IS NULL
  `);

  console.log(`✅ Updated ${result.rowsAffected[0]} slots with Unix timestamps`);

  // Verify
  const check = await pool.request().query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN slot_start_unix IS NOT NULL AND slot_end_unix IS NOT NULL THEN 1 END) as with_unix,
      COUNT(CASE WHEN status='free' AND is_bookable=1 THEN 1 END) as free_bookable
    FROM availability_slots
  `);

  console.log('\nVerification:');
  console.log(check.recordset[0]);

  await pool.close();
}

fixUnixTimestamps()
  .then(() => {
    console.log('\n✅ Done! All Unix timestamps populated.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
