/**
 * Run migration 009: Users and Roles
 * Run with: node run-migration-009.js
 */

const sql = require('mssql');
const config = require('./bloom-sql-config.json');

async function runMigration() {
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

    // Check if users table exists
    const tableCheck = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users'
    `);
    
    if (tableCheck.recordset.length > 0) {
      console.log('✅ Users table already exists, skipping creation');
    } else {
      console.log('📋 Creating users table...');
      await pool.request().query(`
        CREATE TABLE users (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          azure_ad_object_id NVARCHAR(100) UNIQUE NOT NULL,
          email NVARCHAR(255) NOT NULL,
          first_name NVARCHAR(100),
          last_name NVARCHAR(100),
          display_name NVARCHAR(255),
          role NVARCHAR(50) NOT NULL DEFAULT 'practitioner',
          is_active BIT DEFAULT 1,
          last_login_at DATETIME2,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        )
      `);
      console.log('✅ Users table created');
      
      await pool.request().query(`CREATE INDEX idx_users_azure_ad ON users(azure_ad_object_id)`);
      await pool.request().query(`CREATE INDEX idx_users_email ON users(email)`);
      await pool.request().query(`CREATE INDEX idx_users_role ON users(role)`);
      console.log('✅ Users indexes created');
    }

    // Check if user_permissions table exists
    const permTableCheck = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_permissions'
    `);
    
    if (permTableCheck.recordset.length > 0) {
      console.log('✅ User_permissions table already exists, skipping creation');
    } else {
      console.log('📋 Creating user_permissions table...');
      await pool.request().query(`
        CREATE TABLE user_permissions (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          permission NVARCHAR(100) NOT NULL,
          granted_at DATETIME2 DEFAULT GETDATE(),
          granted_by UNIQUEIDENTIFIER REFERENCES users(id),
          CONSTRAINT uq_user_permission UNIQUE (user_id, permission)
        )
      `);
      console.log('✅ User_permissions table created');
      
      await pool.request().query(`CREATE INDEX idx_user_permissions_user ON user_permissions(user_id)`);
    }

    // Check if practitioners.user_id column exists
    const colCheck = await pool.request().query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'user_id'
    `);
    
    if (colCheck.recordset.length > 0) {
      console.log('✅ practitioners.user_id column already exists');
    } else {
      console.log('📋 Adding user_id column to practitioners...');
      await pool.request().query(`ALTER TABLE practitioners ADD user_id UNIQUEIDENTIFIER`);
      // Note: Foreign key constraint may fail if users table was just created, so we skip it
      console.log('✅ user_id column added');
    }

    // Check if Julian's user exists
    const julianCheck = await pool.request()
      .input('azureId', sql.NVarChar, '03f17678-7885-4e63-9b95-86e0498db620')
      .query(`SELECT id FROM users WHERE azure_ad_object_id = @azureId`);
    
    let julianUserId;
    if (julianCheck.recordset.length > 0) {
      console.log('✅ Julian user already exists');
      julianUserId = julianCheck.recordset[0].id;
    } else {
      console.log('📋 Creating Julian user record...');
      const result = await pool.request()
        .input('azureId', sql.NVarChar, '03f17678-7885-4e63-9b95-86e0498db620')
        .input('email', sql.NVarChar, 'julian@life-psychology.com.au')
        .input('firstName', sql.NVarChar, 'Julian')
        .input('lastName', sql.NVarChar, 'Della Bosca')
        .input('displayName', sql.NVarChar, 'Julian Della Bosca')
        .query(`
          INSERT INTO users (id, azure_ad_object_id, email, first_name, last_name, display_name, role)
          OUTPUT INSERTED.id
          VALUES (NEWID(), @azureId, @email, @firstName, @lastName, @displayName, 'admin')
        `);
      julianUserId = result.recordset[0].id;
      console.log('✅ Julian user created with ID:', julianUserId);
    }

    // Add permissions for Julian
    const permissions = ['view_bi', 'manage_users', 'manage_practitioners', 'view_all_clients', 'view_all_billing', 'impersonate'];
    
    for (const perm of permissions) {
      const permCheck = await pool.request()
        .input('userId', sql.UniqueIdentifier, julianUserId)
        .input('permission', sql.NVarChar, perm)
        .query(`SELECT 1 FROM user_permissions WHERE user_id = @userId AND permission = @permission`);
      
      if (permCheck.recordset.length === 0) {
        await pool.request()
          .input('userId', sql.UniqueIdentifier, julianUserId)
          .input('permission', sql.NVarChar, perm)
          .query(`INSERT INTO user_permissions (id, user_id, permission) VALUES (NEWID(), @userId, @permission)`);
        console.log(`  ✅ Added permission: ${perm}`);
      }
    }

    console.log('\n🎉 Migration 009 complete!');
    console.log('   You now have admin access to the dashboard.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) await pool.close();
  }
}

runMigration();
