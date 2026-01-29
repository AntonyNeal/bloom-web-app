/**
 * Fix dashboard: Add azure_ad_object_id column and create practitioner record
 * Run with: node fix-dashboard.js
 */

const sql = require('mssql');
const config = require('./bloom-sql-config.json');

async function fixDashboard() {
  let pool;
  try {
    console.log('🔌 Connecting to:', config.SqlServer, config.SqlDatabase);
    pool = await sql.connect({
      server: config.SqlServer,
      database: config.SqlDatabase,
      user: config.SqlUser,
      password: config.SqlPassword,
      options: { encrypt: true, trustServerCertificate: false }
    });

    // Step 1: Add azure_ad_object_id column if it doesn't exist
    console.log('\n📋 Checking for azure_ad_object_id column...');
    const columnCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'azure_ad_object_id'
    `);

    if (columnCheck.recordset.length === 0) {
      console.log('➕ Adding azure_ad_object_id column...');
      await pool.request().query(`
        ALTER TABLE practitioners ADD azure_ad_object_id NVARCHAR(100)
      `);
      console.log('✅ Column added');
    } else {
      console.log('✅ Column already exists');
    }

    // Step 2: Check if practitioner exists for this Azure AD user
    const azureAdId = '03f17678-7885-4e63-9b95-86e0498db620';
    console.log('\n👤 Checking for existing practitioner...');
    
    const existingCheck = await pool.request()
      .input('azureAdId', sql.NVarChar, azureAdId)
      .query(`
        SELECT id, email, first_name, last_name, azure_ad_object_id 
        FROM practitioners 
        WHERE azure_ad_object_id = @azureAdId
      `);

    if (existingCheck.recordset.length > 0) {
      console.log('✅ Practitioner already exists:', existingCheck.recordset[0]);
      return;
    }

    // Step 3: Create practitioner record
    console.log('➕ Creating practitioner record...');
    const result = await pool.request()
      .input('halaxyId', sql.NVarChar, 'manual-julian-001')
      .input('azureAdId', sql.NVarChar, azureAdId)
      .input('firstName', sql.NVarChar, 'Julian')
      .input('lastName', sql.NVarChar, 'Della Bosca')
      .input('email', sql.NVarChar, 'julian@life-psychology.com.au')
      .input('displayName', sql.NVarChar, 'Julian Della Bosca')
      .query(`
        INSERT INTO practitioners (
          id,
          halaxy_practitioner_id,
          azure_ad_object_id,
          first_name,
          last_name,
          email,
          display_name,
          status,
          is_active,
          created_at,
          updated_at
        ) 
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.display_name
        VALUES (
          NEWID(),
          @halaxyId,
          @azureAdId,
          @firstName,
          @lastName,
          @email,
          @displayName,
          'active',
          1,
          GETDATE(),
          GETDATE()
        )
      `);

    console.log('\n✅ Practitioner created successfully!');
    console.log('   ID:', result.recordset[0].id);
    console.log('   Name:', result.recordset[0].display_name);
    console.log('   Email:', result.recordset[0].email);
    console.log('\n🎉 Dashboard should now work! Refresh your browser.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) await pool.close();
  }
}

fixDashboard();
