/**
 * Create practitioner record for Azure AD user
 * Run with: node create-practitioner-record.js
 */

require('dotenv').config({ path: './local.settings.json' });
const sql = require('mssql');

async function createPractitioner() {
  const settings = require('./local.settings.json');
  const env = settings.Values;
  
  const config = {
    server: env.SQL_SERVER,
    database: env.SQL_DATABASE,
    user: env.SQL_USER,
    password: env.SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };

  console.log('Connecting to database:', config.server, config.database);
  
  let pool;
  try {
    pool = await sql.connect(config);
    
    // Check if practitioner already exists
    const checkResult = await pool.request()
      .input('azureAdObjectId', sql.NVarChar, '03f17678-7885-4e63-9b95-86e0498db620')
      .query(`
        SELECT id, email, first_name, last_name, azure_ad_object_id 
        FROM practitioners 
        WHERE azure_ad_object_id = @azureAdObjectId
      `);
    
    if (checkResult.recordset.length > 0) {
      console.log('Practitioner already exists:', checkResult.recordset[0]);
      return;
    }
    
    // Create new practitioner
    const result = await pool.request()
      .input('halaxyPractitionerId', sql.NVarChar, 'manual-001')
      .input('azureAdObjectId', sql.NVarChar, '03f17678-7885-4e63-9b95-86e0498db620')
      .input('firstName', sql.NVarChar, 'Julian')
      .input('lastName', sql.NVarChar, 'User')
      .input('email', sql.NVarChar, 'julian@life-psychology.com.au')
      .input('displayName', sql.NVarChar, 'Julian')
      .query(`
        INSERT INTO practitioners (
          halaxy_practitioner_id,
          azure_ad_object_id,
          first_name,
          last_name,
          email,
          display_name,
          is_active,
          onboarding_completed_at,
          created_at,
          updated_at
        ) OUTPUT INSERTED.id
        VALUES (
          @halaxyPractitionerId,
          @azureAdObjectId,
          @firstName,
          @lastName,
          @email,
          @displayName,
          1,
          GETDATE(),
          GETDATE(),
          GETDATE()
        )
      `);
    
    console.log('✅ Practitioner created successfully!');
    console.log('ID:', result.recordset[0].id);
    console.log('\nYou can now access the dashboard!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

createPractitioner();
