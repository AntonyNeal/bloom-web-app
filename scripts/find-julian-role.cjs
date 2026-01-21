/**
 * Find Julian's PractitionerRole ID from Halaxy
 * Uses direct FHIR API calls to avoid loading full HalaxyClient
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load settings from local.settings.json
const settingsPath = path.join(__dirname, '../api/local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')).Values;

const HALAXY_CLIENT_ID = settings.HALAXY_CLIENT_ID;
const HALAXY_CLIENT_SECRET = settings.HALAXY_CLIENT_SECRET;

// Julian's Halaxy Practitioner ID (we know this is correct)
const JULIAN_PRACTITIONER_ID = '30431881';

async function getAccessToken() {
    return new Promise((resolve, reject) => {
        // Halaxy uses JSON body, not form-urlencoded
        const body = JSON.stringify({
            grant_type: 'client_credentials',
            client_id: HALAXY_CLIENT_ID,
            client_secret: HALAXY_CLIENT_SECRET,
        });

        const req = https.request({
            hostname: 'au-api.halaxy.com',
            path: '/main/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/fhir+json',
                'User-Agent': 'Life-Psychology-Australia (support@life-psychology.com.au)',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(data);
                    resolve(json.access_token);
                } else {
                    reject(new Error(`Token request failed: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function fhirRequest(token, path) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'au-api.halaxy.com',
            path: `/main/fhir/v1/${path}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/fhir+json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`FHIR request failed: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('🔍 Finding Julian\'s PractitionerRole in Halaxy...\n');
    console.log(`Looking up Practitioner ID: ${JULIAN_PRACTITIONER_ID}\n`);

    try {
        console.log('1. Getting access token...');
        const token = await getAccessToken();
        console.log('   ✅ Token obtained\n');

        // First, verify the Practitioner exists
        console.log('2. Verifying Practitioner exists...');
        try {
            const practitioner = await fhirRequest(token, `Practitioner/${JULIAN_PRACTITIONER_ID}`);
            console.log(`   ✅ Found: ${practitioner.name?.[0]?.text || practitioner.name?.[0]?.given?.join(' ') + ' ' + practitioner.name?.[0]?.family}\n`);
        } catch (err) {
            console.log(`   ❌ Practitioner ${JULIAN_PRACTITIONER_ID} not found in Halaxy`);
            console.log('   This might not be Julian\'s correct Practitioner ID\n');
        }

        // Now search for PractitionerRoles for this Practitioner
        console.log('3. Searching for PractitionerRoles...');
        const rolesResponse = await fhirRequest(token, `PractitionerRole?practitioner=Practitioner/${JULIAN_PRACTITIONER_ID}`);
        
        if (!rolesResponse.entry || rolesResponse.entry.length === 0) {
            console.log('   ❌ No PractitionerRoles found for this Practitioner\n');
            
            // Let's try to find Julian by name
            console.log('4. Searching by name "Julian"...');
            const searchResult = await fhirRequest(token, 'Practitioner?name=Julian');
            
            if (searchResult.entry && searchResult.entry.length > 0) {
                console.log(`   Found ${searchResult.entry.length} practitioner(s) named Julian:\n`);
                for (const entry of searchResult.entry) {
                    const p = entry.resource;
                    const name = p.name?.[0]?.text || 
                                 (p.name?.[0]?.given?.join(' ') + ' ' + p.name?.[0]?.family);
                    console.log(`   - ID: ${p.id}, Name: ${name}`);
                    
                    // Get roles for each Julian
                    const roles = await fhirRequest(token, `PractitionerRole?practitioner=Practitioner/${p.id}`);
                    if (roles.entry && roles.entry.length > 0) {
                        for (const roleEntry of roles.entry) {
                            const role = roleEntry.resource;
                            console.log(`     └─ PractitionerRole ID: ${role.id}`);
                            console.log(`        Active: ${role.active}`);
                            if (role.location) {
                                console.log(`        Location: ${JSON.stringify(role.location)}`);
                            }
                        }
                    } else {
                        console.log('     └─ No PractitionerRoles');
                    }
                    console.log('');
                }
            } else {
                console.log('   ❌ No practitioners named Julian found in Halaxy\n');
            }
        } else {
            console.log(`   ✅ Found ${rolesResponse.entry.length} PractitionerRole(s):\n`);
            
            for (const entry of rolesResponse.entry) {
                const role = entry.resource;
                console.log(`   PractitionerRole ID: ${role.id}`);
                console.log(`   Active: ${role.active}`);
                console.log(`   Full URL: ${entry.fullUrl}`);
                if (role.location) {
                    console.log(`   Location: ${JSON.stringify(role.location)}`);
                }
                console.log('');
            }

            // Output SQL to fix
            const roleId = rolesResponse.entry[0].resource.id;
            console.log('\n' + '='.repeat(60));
            console.log('SQL to update Julian\'s record:');
            console.log('='.repeat(60));
            console.log(`
UPDATE practitioners
SET halaxy_practitioner_role_id = '${roleId}'
WHERE halaxy_practitioner_id = '${JULIAN_PRACTITIONER_ID}';
`);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
