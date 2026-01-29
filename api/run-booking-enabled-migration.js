/**
 * Run Booking Enabled Migration and Add Xena
 * 
 * Adds:
 * 1. booking_enabled column to practitioners table
 * 2. Test practitioner "Xena" for development (is_active=0, booking_enabled=1)
 * 
 * Logic:
 * - is_active = appears on public website (team page, marketing)
 * - booking_enabled = can be booked online
 * 
 * Xena has is_active=0 (hidden from public) but booking_enabled=1 (can test booking)
 */

const sql = require('mssql');

async function runMigrations() {
  const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };

  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('Connected!\n');

    // Run V039 - Add booking_enabled flag
    console.log('=== Running V039: Add booking_enabled flag ===');
    
    // Check if column exists
    const colCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'booking_enabled'
    `);
    
    if (colCheck.recordset[0].cnt === 0) {
      await pool.request().query(`
        ALTER TABLE practitioners ADD booking_enabled BIT DEFAULT 0
      `);
      console.log('✓ Added booking_enabled column');
    } else {
      console.log('- booking_enabled column already exists');
    }

    // Set Zoe to booking_enabled = 1 (she has Halaxy booking configured)
    const zoeResult = await pool.request().query(`
      UPDATE practitioners 
      SET booking_enabled = 1
      WHERE halaxy_practitioner_id = '1304541'
    `);
    console.log(`✓ Set Zoe (1304541) to booking_enabled = 1 (${zoeResult.rowsAffected[0]} rows)`);

    // Set Julian to booking_enabled = 0 (not configured in Halaxy)
    const julianResult = await pool.request().query(`
      UPDATE practitioners 
      SET booking_enabled = 0
      WHERE halaxy_practitioner_id = '1473161'
    `);
    console.log(`✓ Set Julian (1473161) to booking_enabled = 0 (${julianResult.rowsAffected[0]} rows)`);

    // Run V040 - Add Xena test practitioner
    console.log('\n=== Running V040: Add/Update test practitioner Xena ===');
    
    const xenaCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM practitioners 
      WHERE email = 'xena@test.life-psychology.com.au'
    `);
    
    if (xenaCheck.recordset[0].cnt === 0) {
      // Check if halaxy_practitioner_id allows NULL
      const nullCheck = await pool.request().query(`
        SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'practitioners' AND COLUMN_NAME = 'halaxy_practitioner_id'
      `);
      
      // Use a fake Halaxy ID if column doesn't allow NULL
      const xenaHalaxyId = nullCheck.recordset[0]?.IS_NULLABLE === 'NO' ? 'XENA-TEST-001' : null;
      
      await pool.request()
        .input('halaxyId', sql.NVarChar, xenaHalaxyId)
        .query(`
        INSERT INTO practitioners (
          id,
          email,
          first_name,
          last_name,
          display_name,
          phone,
          halaxy_practitioner_id,
          halaxy_clinic_id,
          halaxy_fee_id,
          booking_enabled,
          is_active,
          bio,
          specializations,
          languages,
          session_types,
          experience_years,
          medicare_provider,
          ndis_registered,
          onboarding_completed_at,
          created_at,
          updated_at
        )
        VALUES (
          NEWID(),
          'xena@test.life-psychology.com.au',
          'Xena',
          'Warrior',
          'Xena Warrior',
          '0400000000',
          @halaxyId,
          NULL,
          NULL,
          1,
          0,
          'Test practitioner for development and testing.',
          '["Anxiety", "Depression", "Trauma Recovery"]',
          '["English"]',
          '["Telehealth", "In-Person"]',
          10,
          1,
          0,
          GETUTCDATE(),
          GETUTCDATE(),
          GETUTCDATE()
        )
      `);
      console.log('✓ Added Xena (is_active=0, booking_enabled=1)');
    } else {
      // Update existing Xena: is_active=0 (hidden from public), booking_enabled=1 (can test)
      await pool.request().query(`
        UPDATE practitioners 
        SET is_active = 0, booking_enabled = 1
        WHERE email = 'xena@test.life-psychology.com.au'
      `);
      console.log('✓ Updated Xena (is_active=0, booking_enabled=1)');
    }

    // Show all practitioners with booking status
    console.log('\n=== Current Practitioners ===');
    const practitioners = await pool.request().query(`
      SELECT 
        display_name,
        email,
        halaxy_practitioner_id,
        is_active,
        booking_enabled
      FROM practitioners
      ORDER BY display_name
    `);
    
    console.table(practitioners.recordset);

    console.log('\n✅ Migrations complete!');
    console.log('\nSummary:');
    console.log('- is_active = appears on public website');
    console.log('- booking_enabled = can be booked online');
    console.log('- Xena: hidden from public (is_active=0) but bookable (booking_enabled=1)');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runMigrations();
