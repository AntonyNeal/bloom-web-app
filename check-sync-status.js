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

async function checkSyncStatus() {
  try {
    console.log('🔌 Connecting to database...');
    await sql.connect(config);
    
    // Check if availability_slots table exists
    const tableCheck = await sql.query`
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'availability_slots'
    `;
    
    if (tableCheck.recordset[0].table_exists === 0) {
      console.log('❌ availability_slots table does not exist!');
      console.log('   Database schema may not have been deployed');
      await sql.close();
      return;
    }
    
    console.log('✅ availability_slots table exists');
    
    // Check total slots
    const totalResult = await sql.query`
      SELECT COUNT(*) as total FROM availability_slots
    `;
    console.log(`📊 Total slots: ${totalResult.recordset[0].total}`);
    
    // Check practitioners table
    const practResult = await sql.query`
      SELECT COUNT(*) as total FROM practitioners
    `;
    console.log(`👥 Total practitioners: ${practResult.recordset[0].total}`);
    
    // Check if there are any sync logs or errors we can query
    const tablesResult = await sql.query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;
    
    console.log('\n📋 Database tables:');
    tablesResult.recordset.forEach(t => {
      console.log(`   - ${t.TABLE_NAME}`);
    });
    
    console.log('\n💡 Next steps to debug:');
    console.log('   1. Check Azure Container Apps logs:');
    console.log('      az containerapp logs show --name halaxy-sync-worker-staging --resource-group <rg-name> --follow');
    console.log('   2. Or view logs in Azure Portal:');
    console.log('      Container Apps → halaxy-sync-worker-staging → Monitoring → Log stream');
    console.log('   3. Look for messages like:');
    console.log('      - "[Worker] Fetching practitioners from Halaxy (given name: Zoe)..."');
    console.log('      - "[Worker] Found X practitioners named Zoe in Halaxy"');
    console.log('      - "[Worker] Syncing practitioner: ..."');
    console.log('   4. Check for errors:');
    console.log('      - Authentication failures (401/403)');
    console.log('      - API errors from Halaxy');
    console.log('      - Database connection issues');
    
    await sql.close();
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkSyncStatus();
