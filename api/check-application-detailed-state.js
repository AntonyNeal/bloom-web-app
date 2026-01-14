#!/usr/bin/env node

/**
 * Application State Checker
 * 
 * Displays the complete state of the latest application and all related records
 * Useful for understanding what stage of the workflow the application is in
 */

const sql = require('mssql');

// Use environment variables or defaults for Azure SQL Server
const config = {
  server: process.env.SQL_SERVER || 'lpa-sql-server.database.windows.net',
  database: process.env.SQL_DATABASE || 'lpa-bloom-db-dev',
  user: process.env.SQL_USER || 'lpaadmin',
  password: process.env.SQL_PASSWORD || 'BloomPlatform2025!Secure',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

async function checkApplicationState() {
  let pool;
  try {
    console.log('🔍 Connecting to database...\n');
    pool = await sql.connect(config);

    // Get the latest application
    const appResult = await pool.request()
      .query(`
        SELECT TOP 1
          id,
          first_name,
          last_name,
          email,
          phone,
          status,
          offer_token,
          offer_sent_at,
          offer_accepted_at,
          accepted_at,
          signed_contract_url,
          practitioner_id,
          halaxy_practitioner_verified,
          halaxy_verified_at,
          halaxy_account_id,
          contract_url,
          created_at
        FROM applications
        ORDER BY created_at DESC
      `);

    if (appResult.recordset.length === 0) {
      console.log('❌ No applications found in database\n');
      return;
    }

    const app = appResult.recordset[0];

    // Format output
    console.log('═'.repeat(70));
    console.log('🌸 APPLICATION STATE REPORT');
    console.log('═'.repeat(70));
    console.log();

    // Basic Info
    console.log('📋 BASIC INFORMATION');
    console.log('─'.repeat(70));
    console.log(`  ID:                ${app.id}`);
    console.log(`  Name:              ${app.first_name} ${app.last_name}`);
    console.log(`  Email:             ${app.email}`);
    console.log(`  Phone:             ${app.phone || '(not provided)'}`);
    console.log(`  Created:           ${new Date(app.created_at).toLocaleString()}`);
    console.log();

    // Workflow Status
    console.log('⚙️ WORKFLOW STATUS');
    console.log('─'.repeat(70));
    console.log(`  Current Status:    ${app.status}`);
    console.log();

    // Offer Information
    console.log('📧 OFFER INFORMATION');
    console.log('─'.repeat(70));
    const hasOfferToken = !!app.offer_token;
    const hasOfferSent = !!app.offer_sent_at;
    const hasOfferAccepted = !!app.offer_accepted_at;

    console.log(`  Offer Token:       ${app.offer_token || '(not generated)'}`);
    console.log(`  Offer Sent:        ${app.offer_sent_at ? new Date(app.offer_sent_at).toLocaleString() : '❌ Not sent'}`);
    console.log(`  Offer Accepted:    ${app.offer_accepted_at ? new Date(app.offer_accepted_at).toLocaleString() : '❌ Not accepted'}`);
    console.log();

    // Contract Information
    console.log('📄 CONTRACT INFORMATION');
    console.log('─'.repeat(70));
    console.log(`  Contract URL:      ${app.contract_url ? '✅ Available' : '❌ Not set'}`);
    console.log(`  Signed Contract:   ${app.signed_contract_url ? '✅ Uploaded' : '❌ Not uploaded'}`);
    if (app.signed_contract_url) {
      console.log(`    URL: ${app.signed_contract_url.substring(0, 80)}...`);
    }
    console.log();

    // Halaxy Information
    console.log('🏥 HALAXY INTEGRATION');
    console.log('─'.repeat(70));
    console.log(`  Verified:          ${app.halaxy_practitioner_verified ? '✅ Yes' : '❌ No'}`);
    console.log(`  Practitioner ID:   ${app.practitioner_id || '(not set)'}`);
    console.log(`  Halaxy Account ID: ${app.halaxy_account_id || '(not set)'}`);
    console.log(`  Verified At:       ${app.halaxy_verified_at ? new Date(app.halaxy_verified_at).toLocaleString() : '(not verified)'}`);
    console.log();

    // Practitioner Information
    console.log('👨‍⚕️ PRACTITIONER RECORD');
    console.log('─'.repeat(70));
    if (app.practitioner_id) {
      const practResult = await pool.request()
        .input('id', sql.UniqueIdentifier, app.practitioner_id)
        .query(`
          SELECT 
            id,
            email,
            onboarding_token,
            onboarding_completed_at,
            created_at
          FROM practitioners
          WHERE id = @id
        `);

      if (practResult.recordset.length > 0) {
        const pract = practResult.recordset[0];
        console.log(`  Practitioner ID:   ${pract.id}`);
        console.log(`  Email:             ${pract.email}`);
        console.log(`  Onboarding Token:  ${pract.onboarding_token || '(not generated)'}`);
        console.log(`  Onboarding Done:   ${pract.onboarding_completed_at ? new Date(pract.onboarding_completed_at).toLocaleString() : '❌ Not completed'}`);
        console.log(`  Created:           ${new Date(pract.created_at).toLocaleString()}`);
      }
    } else {
      console.log(`  Status:            ❌ Not created yet`);
    }
    console.log();

    // Workflow Progress
    console.log('📊 WORKFLOW PROGRESS');
    console.log('─'.repeat(70));
    const stages = [
      { name: 'Application Submitted', done: app.status !== null, icon: '✅' },
      { name: 'Admin Approved', done: app.status === 'accepted' || app.offer_token, icon: app.status === 'accepted' || app.offer_token ? '✅' : '⏳' },
      { name: 'Offer Token Generated', done: hasOfferToken, icon: hasOfferToken ? '✅' : '⏳' },
      { name: 'Halaxy Verified', done: app.halaxy_practitioner_verified, icon: app.halaxy_practitioner_verified ? '✅' : '🔒' },
      { name: 'Signed Contract Uploaded', done: app.signed_contract_url, icon: app.signed_contract_url ? '✅' : '⏳' },
      { name: 'Offer Accepted by Practitioner', done: hasOfferAccepted, icon: hasOfferAccepted ? '✅' : '⏳' },
      { name: 'Practitioner Created', done: !!app.practitioner_id, icon: app.practitioner_id ? '✅' : '⏳' },
      { name: 'Onboarding Started', done: false, icon: '⏳' }, // Would need to check practitioners table
    ];

    stages.forEach((stage, index) => {
      const progress = stages.slice(0, index + 1).filter(s => s.done).length;
      const total = index + 1;
      console.log(`  ${stage.icon} ${stage.name}`);
    });

    const completedStages = stages.filter(s => s.done).length;
    const totalStages = stages.length;
    const percentage = Math.round((completedStages / totalStages) * 100);

    console.log();
    console.log(`  Overall Progress: ${completedStages}/${totalStages} stages (${percentage}%)`);
    console.log();

    // Safety Gates Status
    console.log('🔒 SAFETY GATES');
    console.log('─'.repeat(70));
    const gates = [
      {
        name: 'Halaxy Verification Gate',
        status: app.halaxy_practitioner_verified,
        message: app.halaxy_practitioner_verified ? 'PASSED ✅' : 'BLOCKED 🔒',
        details: 'Prevents email send until clinician in Halaxy',
      },
      {
        name: 'Signed Contract Gate',
        status: !!app.signed_contract_url,
        message: !!app.signed_contract_url ? 'PASSED ✅' : 'BLOCKED 🔒',
        details: 'Prevents acceptance until contract uploaded',
      },
      {
        name: 'Offer Token Gate',
        status: hasOfferToken,
        message: hasOfferToken ? 'PASSED ✅' : 'BLOCKED 🔒',
        details: 'Ensures valid practitioner link',
      },
      {
        name: 'Status Validation Gate',
        status: app.status === 'accepted',
        message: app.status === 'accepted' ? 'PASSED ✅' : 'BLOCKED 🔒',
        details: `Current status: "${app.status}"`,
      },
    ];

    gates.forEach(gate => {
      console.log(`  ${gate.message} ${gate.name}`);
      console.log(`     ${gate.details}`);
    });

    const gatePassed = gates.filter(g => g.status).length;
    console.log();
    console.log(`  Gates Status: ${gatePassed}/${gates.length} passed`);
    console.log();

    // Next Actions
    console.log('🎯 NEXT ACTIONS');
    console.log('─'.repeat(70));
    if (app.status === 'reviewing') {
      console.log('  1. Click "Accept Application" in admin dashboard');
      console.log('  2. This generates an offer token');
      console.log('  3. Admin then verifies practitioner in Halaxy');
    } else if (app.status === 'accepted' && !app.halaxy_practitioner_verified) {
      console.log('  1. Verify this practitioner in Halaxy (admin action)');
      console.log('  2. Click "Verify in Halaxy" button');
      console.log('  3. This enables the "Send Onboarding Invite" button');
    } else if (app.status === 'accepted' && app.halaxy_practitioner_verified && !app.signed_contract_url) {
      console.log('  1. Practitioner needs to open the offer link');
      console.log('  2. Download and sign the contract');
      console.log('  3. Upload the signed contract');
    } else if (app.status === 'accepted' && app.halaxy_practitioner_verified && app.signed_contract_url && !app.offer_accepted_at) {
      console.log('  1. Practitioner needs to click "Accept Offer & Join Bloom"');
      console.log('  2. This triggers the admin to send onboarding email');
    } else if (app.status === 'accepted' && app.halaxy_practitioner_verified && app.signed_contract_url && app.offer_accepted_at && !app.practitioner_id) {
      console.log('  1. Click "Send Onboarding Invite" in admin dashboard');
      console.log('  2. This creates the practitioner record');
      console.log('  3. Email is sent with onboarding link');
    } else if (app.practitioner_id) {
      console.log('  ✅ Onboarding email sent!');
      console.log('  Waiting for practitioner to complete onboarding...');
    }
    console.log();

    console.log('═'.repeat(70));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkApplicationState();
