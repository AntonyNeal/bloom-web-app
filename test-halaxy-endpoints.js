/**
 * Test Halaxy API Endpoints
 * 
 * This script tests various Halaxy API endpoints to see which ones
 * return phone numbers (telecom data).
 * 
 * Usage:
 *   $env:HALAXY_CLIENT_ID="your-client-id"
 *   $env:HALAXY_CLIENT_SECRET="your-client-secret"
 *   node test-halaxy-endpoints.js
 * 
 * Optional: Pass a specific practitioner ID
 *   node test-halaxy-endpoints.js PR-1304541
 */

const HALAXY_CLIENT_ID = process.env.HALAXY_CLIENT_ID;
const HALAXY_CLIENT_SECRET = process.env.HALAXY_CLIENT_SECRET;
const HALAXY_TOKEN_URL = 'https://au-api.halaxy.com/main/oauth/token';
const HALAXY_API_BASE = 'https://au-api.halaxy.com/main';

// Get practitioner ID from command line or use default
const PRACTITIONER_ID = process.argv[2] || 'PR-1304541';

let accessToken = null;

async function getAccessToken() {
  console.log('🔑 Getting access token...');
  
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
    throw new Error(`Token fetch failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ Access token obtained\n');
}

async function callApi(endpoint, description) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📡 ${description}`);
  console.log(`   GET ${HALAXY_API_BASE}${endpoint}`);
  console.log('═'.repeat(70));

  try {
    const response = await fetch(`${HALAXY_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Error: ${response.status}`);
      console.log(`   ${error.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    
    // Check for telecom (phone/email)
    if (data.telecom && data.telecom.length > 0) {
      console.log('\n📞 TELECOM DATA FOUND:');
      data.telecom.forEach((t, i) => {
        console.log(`   [${i}] system: ${t.system}, use: ${t.use || 'N/A'}, value: ${t.value}`);
      });
    } else {
      console.log('\n⚠️  No telecom data on this resource');
    }

    // For bundles (search results), check entries
    if (data.resourceType === 'Bundle' && data.entry) {
      console.log(`\n📦 Bundle with ${data.entry.length} entries:`);
      data.entry.forEach((entry, i) => {
        const resource = entry.resource;
        console.log(`\n   Entry ${i + 1}: ${resource.resourceType}/${resource.id}`);
        if (resource.telecom && resource.telecom.length > 0) {
          console.log('   📞 TELECOM:');
          resource.telecom.forEach((t) => {
            console.log(`      - system: ${t.system}, use: ${t.use || 'N/A'}, value: ${t.value}`);
          });
        }
        // Show references for PractitionerRole
        if (resource.resourceType === 'PractitionerRole') {
          if (resource.practitioner) console.log(`      Practitioner: ${resource.practitioner.reference}`);
          if (resource.organization) console.log(`      Organization: ${resource.organization.reference}`);
          if (resource.location) console.log(`      Location: ${resource.location.map(l => l.reference).join(', ')}`);
        }
      });
    }

    // Show key fields based on resource type
    if (data.resourceType === 'Practitioner') {
      console.log('\n👤 Practitioner Details:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Name: ${data.name?.[0]?.given?.join(' ')} ${data.name?.[0]?.family}`);
      console.log(`   Active: ${data.active}`);
    }

    if (data.resourceType === 'Location') {
      console.log('\n📍 Location Details:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Status: ${data.status}`);
      if (data.address) {
        console.log(`   Address: ${data.address.line?.join(', ')}, ${data.address.city} ${data.address.state} ${data.address.postalCode}`);
      }
    }

    if (data.resourceType === 'Organization') {
      console.log('\n🏢 Organization Details:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Active: ${data.active}`);
    }

    return data;

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           HALAXY API ENDPOINT PHONE NUMBER DIAGNOSTIC              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`\nTesting with Practitioner ID: ${PRACTITIONER_ID}\n`);

  // Check credentials
  if (!HALAXY_CLIENT_ID || !HALAXY_CLIENT_SECRET) {
    console.error('❌ Please set HALAXY_CLIENT_ID and HALAXY_CLIENT_SECRET environment variables\n');
    console.error('Usage (PowerShell):');
    console.error('  $env:HALAXY_CLIENT_ID="your-client-id"');
    console.error('  $env:HALAXY_CLIENT_SECRET="your-client-secret"');
    console.error('  node test-halaxy-endpoints.js [PR-XXXXXX]');
    process.exit(1);
  }

  try {
    await getAccessToken();

    // 1. Test Practitioner endpoint
    const practitioner = await callApi(
      `/Practitioner/${PRACTITIONER_ID}`,
      `Practitioner (${PRACTITIONER_ID})`
    );

    // 2. Test PractitionerRole search (to find role ID)
    const roles = await callApi(
      `/PractitionerRole?practitioner=Practitioner/${PRACTITIONER_ID}`,
      `PractitionerRole (for ${PRACTITIONER_ID})`
    );

    // If we found roles, get details on the first one
    let locationId = null;
    let organizationId = null;

    if (roles?.entry?.[0]?.resource) {
      const role = roles.entry[0].resource;
      
      // Extract location ID
      if (role.location?.[0]?.reference) {
        const locMatch = role.location[0].reference.match(/Location\/(\d+)/i) || 
                         role.location[0].reference.match(/\/(\d+)$/);
        if (locMatch) locationId = locMatch[1];
      }

      // Extract organization ID
      if (role.organization?.reference) {
        const orgMatch = role.organization.reference.match(/Organization\/(\d+)/i) ||
                         role.organization.reference.match(/\/(\d+)$/);
        if (orgMatch) organizationId = orgMatch[1];
      }
    }

    // 3. Test Location endpoint (if found)
    if (locationId) {
      await callApi(`/Location/${locationId}`, `Location (${locationId})`);
    } else {
      console.log('\n⚠️  No Location reference found in PractitionerRole');
    }

    // 4. Test Organization endpoint (if found)
    if (organizationId) {
      await callApi(`/Organization/${organizationId}`, `Organization (${organizationId})`);
    } else {
      console.log('\n⚠️  No Organization reference found in PractitionerRole');
    }

    // 5. Also try listing all organizations (in case the main one has phone)
    await callApi('/Organization', 'All Organizations');

    // 6. Try listing all locations
    await callApi('/Location', 'All Locations');

    // Summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                           SUMMARY                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log(`
Look above for any "📞 TELECOM DATA FOUND" sections.

If a phone number appears on any endpoint, that's where Halaxy stores it.
The corresponding Halaxy UI location would be:

  • Practitioner.telecom  → Staff Profile (but UI doesn't show phone field)
  • PractitionerRole.telecom → Staff Role settings
  • Location.telecom → Settings → Locations → [Location Name] → Edit
  • Organization.telecom → Settings → Practice Settings → Organization
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
