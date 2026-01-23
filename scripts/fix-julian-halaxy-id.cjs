/**
 * Fix Julian's Halaxy Practitioner ID
 * 
 * Julian's halaxy_practitioner_id is currently set to "PR-1955619" (database ID)
 * but should be "1473161" (actual Halaxy practitioner ID)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071/api';

async function fixJulianHalaxyId() {
  console.log('Fetching current practitioners...');
  
  // First, get Julian's database ID
  const response = await fetch(`${API_URL}/public/practitioners`);
  const data = await response.json();
  
  console.log('Practitioners:', JSON.stringify(data.practitioners, null, 2));
  
  const julian = data.practitioners.find((p: any) => 
    p.firstName.toLowerCase().includes('julian') || 
    p.displayName?.toLowerCase().includes('julian')
  );
  
  if (!julian) {
    console.error('Julian not found!');
    return;
  }
  
  console.log('\nJulian found:');
  console.log('  Database ID:', julian.id);
  console.log('  Current halaxyPractitionerId:', julian.halaxyPractitionerId);
  console.log('  Should be: 1473161');
  
  // Update to correct Halaxy ID
  console.log('\nUpdating Halaxy practitioner ID...');
  const updateResponse = await fetch(`${API_URL}/admin/update-practitioner-halaxy-id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      practitionerId: julian.id,
      halaxyPractitionerId: '1473161', // Julian's actual Halaxy ID
    }),
  });
  
  const updateResult = await updateResponse.json();
  console.log('Update result:', updateResult);
  
  // Verify the change
  console.log('\nVerifying update...');
  const verifyResponse = await fetch(`${API_URL}/public/practitioners`);
  const verifyData = await verifyResponse.json();
  const updatedJulian = verifyData.practitioners.find((p: any) => p.id === julian.id);
  
  console.log('Updated Julian:');
  console.log('  halaxyPractitionerId:', updatedJulian.halaxyPractitionerId);
  console.log('  ✓ Should be 1473161:', updatedJulian.halaxyPractitionerId === '1473161');
}

fixJulianHalaxyId().catch(console.error);
