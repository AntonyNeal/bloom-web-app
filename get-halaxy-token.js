// Get Halaxy Bearer Token
// This script fetches a bearer token from Halaxy API using client credentials

const HALAXY_CLIENT_ID = process.env.HALAXY_CLIENT_ID || 'your-client-id';
const HALAXY_CLIENT_SECRET = process.env.HALAXY_CLIENT_SECRET || 'your-client-secret';
const HALAXY_TOKEN_URL = 'https://au-api.halaxy.com/oauth2/token';

async function getBearerToken() {
  try {
    console.log('🔑 Requesting bearer token from Halaxy...');
    console.log(`   Client ID: ${HALAXY_CLIENT_ID.substring(0, 10)}...`);
    
    const response = await fetch(HALAXY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/fhir+json',
        'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: HALAXY_CLIENT_ID,
        client_secret: HALAXY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Token fetch failed: ${response.status} - ${error}`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('\n✅ Bearer Token obtained:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(data.access_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📋 Token Type: ${data.token_type}`);
    console.log(`⏱️  Expires In: ${data.expires_in} seconds (~${Math.floor(data.expires_in / 60)} minutes)`);
    console.log(`\n🔧 Usage: Add this header to your API requests:`);
    console.log(`   Authorization: Bearer ${data.access_token.substring(0, 20)}...`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Check if credentials are provided
if (HALAXY_CLIENT_ID === 'your-client-id' || HALAXY_CLIENT_SECRET === 'your-client-secret') {
  console.error('❌ Please set HALAXY_CLIENT_ID and HALAXY_CLIENT_SECRET environment variables');
  console.error('\nUsage:');
  console.error('  $env:HALAXY_CLIENT_ID="your-client-id"');
  console.error('  $env:HALAXY_CLIENT_SECRET="your-client-secret"');
  console.error('  node get-halaxy-token.js');
  process.exit(1);
}

getBearerToken();
