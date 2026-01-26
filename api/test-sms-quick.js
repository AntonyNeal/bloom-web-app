/**
 * Quick SMS Test Script
 * Tests Infobip Messaging Connect via Azure Communication Services
 * 
 * Usage: node test-sms-quick.js [phone_number]
 * Default sends to Julian's test number
 */

const { SmsClient } = require('@azure/communication-sms');

// Load environment from local.settings.json
const localSettings = require('./local.settings.json');
const env = localSettings.Values;

const ACS_CONNECTION_STRING = env.ACS_CONNECTION_STRING;
const INFOBIP_API_KEY = env.INFOBIP_API_KEY;
const SMS_FROM_NUMBER = env.SMS_FROM_NUMBER || '+61480800867';

// Test phone - Julian's number from SMS_NOTIFICATION_CONTEXT.md
const TEST_PHONE = process.argv[2] || '+61401527587';

async function testSms() {
  console.log('🔧 SMS Test - Infobip Messaging Connect via ACS');
  console.log('================================================');
  console.log(`From: ${SMS_FROM_NUMBER}`);
  console.log(`To: ${TEST_PHONE}`);
  console.log(`ACS Configured: ${ACS_CONNECTION_STRING ? '✅' : '❌'}`);
  console.log(`Infobip Key: ${INFOBIP_API_KEY ? '✅ ' + INFOBIP_API_KEY.substring(0, 10) + '...' : '❌'}`);
  console.log('');

  if (!ACS_CONNECTION_STRING) {
    console.error('❌ ACS_CONNECTION_STRING not configured');
    process.exit(1);
  }

  if (!INFOBIP_API_KEY) {
    console.error('❌ INFOBIP_API_KEY not configured');
    process.exit(1);
  }

  try {
    const client = new SmsClient(ACS_CONNECTION_STRING);
    
    const message = `🌸 Bloom SMS Test - ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} - If you received this, Infobip Messaging Connect is working!`;
    
    console.log(`📤 Sending: "${message}"`);
    console.log('');

    const sendResults = await client.send(
      {
        from: SMS_FROM_NUMBER,
        to: [TEST_PHONE],
        message: message,
      },
      {
        enableDeliveryReport: true,
        // Messaging Connect - routes through Infobip
        messagingConnect: {
          apiKey: INFOBIP_API_KEY,
          partner: 'infobip',
        },
      }
    );

    const result = sendResults[0];
    
    console.log('📨 Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.successful) {
      console.log('✅ SUCCESS! Message sent via Infobip Messaging Connect');
      console.log(`   Message ID: ${result.messageId}`);
      console.log('');
      console.log('📱 Check your phone for the test message!');
    } else {
      console.log('❌ FAILED to send message');
      console.log(`   Error: ${result.errorMessage}`);
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check if Messaging Connect sync is complete in Azure Portal');
      console.log('   2. Verify the Infobip number +61480800867 appears in ACS Phone Numbers');
      console.log('   3. Ensure Infobip account has SMS credits');
    }

  } catch (error) {
    console.error('❌ Exception:', error.message);
    console.log('');
    console.log('🔍 This error often means:');
    console.log('   - Messaging Connect is not yet synced (wait 24h from Jan 22)');
    console.log('   - The Infobip number is not linked to this ACS resource');
    console.log('   - API key is invalid');
  }
}

testSms();
