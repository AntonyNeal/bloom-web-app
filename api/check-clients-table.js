const sql = require('mssql');

async function checkClientsTable() {
  const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };

  const pool = await sql.connect(config);
  
  try {
    // Check if clients table exists
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'clients'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.log('Clients table does NOT exist');
    } else {
      console.log('Clients table EXISTS');
      
      const cols = await pool.request().query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'clients' ORDER BY ORDINAL_POSITION
      `);
      console.log('Columns:', cols.recordset.map(c => c.COLUMN_NAME).join(', '));
    }
    
    // Check migration history
    const migrations = await pool.request().query(`
      SELECT version, description, success FROM schema_migrations 
      WHERE version LIKE 'V035%' OR version LIKE 'V036%' OR version LIKE 'V037%' OR version LIKE 'V038%' OR version LIKE 'V039%' OR version LIKE 'V040%'
      ORDER BY installed_on
    `);
    console.log('\nMigration history for V035-V040:');
    console.table(migrations.recordset);
    
  } finally {
    await pool.close();
  }
}

checkClientsTable().catch(console.error);
