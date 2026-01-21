/**
 * Find a practitioner's real PractitionerRole ID from Halaxy
 */
const fs = require('fs');
const path = require('path');

// Load settings
const settingsPath = path.join(__dirname, '../api/local.settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
Object.assign(process.env, settings.Values);

const { HalaxyClient } = require('../api/dist/services/halaxy/client');

async function findPractitionerRole(firstName, lastName) {
  const client = new HalaxyClient();
  
  console.log(`\n🔍 Searching for: ${firstName} ${lastName}\n`);
  
  // Find practitioner by name
  const practitioner = await client.findPractitionerByName(firstName, lastName);
  
  if (!practitioner) {
    console.error(`❌ Practitioner "${firstName} ${lastName}" not found in Halaxy`);
    return;
  }
  
  console.log(`✅ Found Practitioner:`);
  console.log(`   ID: ${practitioner.id}`);
  console.log(`   Name: ${practitioner.name?.[0]?.given?.join(' ')} ${practitioner.name?.[0]?.family}`);
  
  // Get their PractitionerRoles
  console.log(`\n🔍 Finding PractitionerRoles...`);
  const roles = await client.getPractitionerRolesByPractitioner(practitioner.id);
  
  if (!roles || roles.length === 0) {
    console.error(`❌ No PractitionerRoles found for ${practitioner.id}`);
    return;
  }
  
  console.log(`\n✅ Found ${roles.length} PractitionerRole(s):\n`);
  
  for (const role of roles) {
    console.log(`   Role ID: ${role.id}`);
    console.log(`   Active: ${role.active}`);
    console.log(`   Period: ${role.period?.start} - ${role.period?.end || 'present'}`);
    if (role.location) {
      console.log(`   Location: ${role.location.map(l => l.display || l.reference).join(', ')}`);
    }
    console.log('');
  }
  
  // Output the SQL update command
  const roleId = roles[0].id;
  console.log(`\n📝 SQL to update database:\n`);
  console.log(`UPDATE practitioners`);
  console.log(`SET halaxy_practitioner_role_id = '${roleId}'`);
  console.log(`WHERE halaxy_practitioner_id = '${practitioner.id}';`);
}

// Run for Julian
findPractitionerRole('Julian', 'Della Bosca').catch(console.error);
