const sql = require('mssql');
require('dotenv').config();

async function main() {
  // Support SQL_CONNECTION_STRING env var
  const connString = process.env.SQL_CONNECTION_STRING;
  let pool;
  
  if (connString) {
    pool = await sql.connect(connString);
  } else {
    pool = await sql.connect({
      server: process.env.DB_SERVER || 'lpa-sql-server.database.windows.net',
      database: process.env.DB_NAME || 'lpa-bloom-db-dev',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: { encrypt: true, trustServerCertificate: false }
    });
  }
  
  const result = await pool.request().query(`
    SELECT id, first_name, last_name, email, azure_ad_object_id, company_email, 
           onboarding_completed_at, halaxy_practitioner_id
    FROM practitioners 
    ORDER BY id DESC
  `);
  
  console.log('Practitioners:');
  console.log(JSON.stringify(result.recordset, null, 2));
  await pool.close();
}

main().catch(console.error);
