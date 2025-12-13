import sql from 'mssql';

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

async function triggerSync() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    // Check all practitioners
    const allPractResult = await sql.query`
      SELECT id, halaxy_practitioner_id, first_name, last_name, email
      FROM practitioners
    `;
    
    console.log(`\n📊 Found ${allPractResult.recordset.length} practitioner(s) in database:`);
    allPractResult.recordset.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.first_name} ${p.last_name} (${p.email})`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Halaxy ID: ${p.halaxy_practitioner_id || 'NOT SET'}`);
    });
    
    // Check if practitioner exists with Halaxy ID
    const practResult = await sql.query`
      SELECT id, halaxy_practitioner_id, first_name, last_name 
      FROM practitioners 
      WHERE halaxy_practitioner_id IS NOT NULL
    `;
    
    if (practResult.recordset.length === 0) {
      console.log('\n❌ No practitioners have halaxy_practitioner_id configured');
      console.log('   The sync worker needs a practitioner with a Halaxy ID to sync availability');
      console.log('\n💡 To fix this, you need to:');
      console.log('   1. Get the Halaxy Practitioner ID from Halaxy system');
      console.log('   2. Update the practitioner record with:');
      console.log('      UPDATE practitioners SET halaxy_practitioner_id = \'<halaxy-id>\' WHERE email = \'<email>\'');
      await sql.close();
      return;
    }
    
    console.log(`\n👨‍⚕️  Found ${practResult.recordset.length} practitioner(s) with Halaxy integration:`);
    practResult.recordset.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.first_name} ${p.last_name} (Halaxy ID: ${p.halaxy_practitioner_id})`);
    });
    
    const practitionerId = practResult.recordset[0].halaxy_practitioner_id;
    console.log(`\n🔄 The Halaxy sync worker should be syncing availability for: ${practitionerId}`);
    console.log('   Sync runs every 15 minutes automatically');
    
    // Check Azure Container Apps logs
    console.log('\n📋 To check if sync is running, view Container Apps logs:');
    console.log('   1. Go to Azure Portal');
    console.log('   2. Find Container App: halaxy-sync-worker-staging');
    console.log('   3. Go to "Monitoring" > "Log stream"');
    console.log('   4. Look for "[Worker] Starting scheduled full sync" messages');
    
    // Check last sync attempt by looking at most recent slot
    const lastSlot = await sql.query`
      SELECT TOP 1 created_at, slot_start_unix
      FROM availability_slots
      ORDER BY created_at DESC
    `;
    
    if (lastSlot.recordset.length > 0) {
      console.log(`\n✅ Last slot synced: ${lastSlot.recordset[0].created_at}`);
    } else {
      console.log('\n⚠️  No slots have been synced yet');
      console.log('   This could mean:');
      console.log('   - Sync worker hasn\'t run since database rebuild');
      console.log('   - Sync worker is failing (check Container Apps logs)');
      console.log('   - No availability in Halaxy for this practitioner');
    }
    
    await sql.close();
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

triggerSync();
