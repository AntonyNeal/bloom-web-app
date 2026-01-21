const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load settings from local.settings.json
const settingsPath = path.join(__dirname, '../api/local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const env = settings.Values;

const config = {
  server: env.SQL_SERVER,
  database: env.SQL_DATABASE,
  user: env.SQL_USER,
  password: env.SQL_PASSWORD,
  options: { encrypt: true, trustServerCertificate: false }
};

async function run() {
  console.log('Connecting to:', config.server, config.database);
  const pool = await sql.connect(config);
  
  // Check applications table columns
  const appCols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications'
  `);
  console.log('Applications columns:', appCols.recordset.map(x => x.COLUMN_NAME).join(', '));
  
  // Check practitioners table columns
  const practCols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'practitioners'
  `);
  console.log('Practitioners columns:', practCols.recordset.map(x => x.COLUMN_NAME).join(', '));
  
  await pool.close();
}

run().catch(console.error);
