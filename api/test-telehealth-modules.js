/**
 * Telehealth Module Testing Script
 * 
 * Tests each module of the telehealth flow independently.
 * Run with: node test-telehealth-modules.js [module]
 * 
 * Modules:
 *   1. token-generate - Test token generation API
 *   2. token-validate - Test token validation API
 *   3. room-create    - Test ACS room creation
 *   4. room-join      - Test room join API
 *   5. full-flow      - Test complete patient flow
 */

const API_BASE = process.env.API_BASE || 'http://localhost:7071/api';

// Test data - replace with real values for production testing
const TEST_DATA = {
  appointmentId: 'test-appt-' + Date.now(),
  patientId: 'test-patient-123',
  patientFirstName: 'Test',
  patientEmail: 'test@example.com',
  practitionerId: '00000000-0000-0000-0000-000000000001', // Replace with real practitioner UUID
  practitionerName: 'Dr. Test',
  appointmentTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
  appointmentDuration: 50,
};

// Store generated token for subsequent tests
let generatedToken = null;
let roomId = null;

// ============================================================================
// Utility Functions
// ============================================================================

async function fetchJson(url, options = {}) {
  console.log(`\n📡 ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log('   Body:', JSON.stringify(JSON.parse(options.body), null, 2).split('\n').slice(0, 5).join('\n') + '...');
  }
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    return { status: res.status, data };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

function printResult(name, success, details) {
  const icon = success ? '✅' : '❌';
  console.log(`\n${icon} ${name}: ${success ? 'PASSED' : 'FAILED'}`);
  if (details) {
    console.log('   Details:', typeof details === 'string' ? details : JSON.stringify(details, null, 2).split('\n').slice(0, 8).join('\n'));
  }
}

// ============================================================================
// Module 1: Token Generation
// ============================================================================

async function testTokenGenerate() {
  console.log('\n' + '='.repeat(60));
  console.log('MODULE 1: Token Generation');
  console.log('='.repeat(60));
  
  const result = await fetchJson(`${API_BASE}/session/token/generate`, {
    method: 'POST',
    body: JSON.stringify({
      appointmentId: TEST_DATA.appointmentId,
      patientId: TEST_DATA.patientId,
      patientFirstName: TEST_DATA.patientFirstName,
      patientEmail: TEST_DATA.patientEmail,
      practitionerId: TEST_DATA.practitionerId,
      practitionerName: TEST_DATA.practitionerName,
      appointmentTime: TEST_DATA.appointmentTime,
      appointmentDuration: TEST_DATA.appointmentDuration,
    }),
  });
  
  const success = result.status === 201 || result.status === 200;
  if (success && result.data?.data?.token) {
    generatedToken = result.data.data.token;
    printResult('Token Generation', true, {
      token: generatedToken.substring(0, 20) + '...',
      sessionUrl: result.data.data.sessionUrl,
      expiresAt: result.data.data.expiresAt,
    });
  } else {
    printResult('Token Generation', false, result.data?.error || result.error || 'No token returned');
  }
  
  return success;
}

// ============================================================================
// Module 2: Token Validation
// ============================================================================

async function testTokenValidate(token = generatedToken) {
  console.log('\n' + '='.repeat(60));
  console.log('MODULE 2: Token Validation');
  console.log('='.repeat(60));
  
  if (!token) {
    printResult('Token Validation', false, 'No token available - run token-generate first');
    return false;
  }
  
  const result = await fetchJson(`${API_BASE}/session/token/validate/${token}`);
  
  const success = result.status === 200 && result.data?.success;
  if (success) {
    printResult('Token Validation', true, {
      appointmentId: result.data.data.appointmentId,
      patientFirstName: result.data.data.patientFirstName,
      practitionerName: result.data.data.practitionerName,
      status: result.data.data.status,
      canJoin: result.data.data.canJoin,
    });
  } else {
    printResult('Token Validation', false, result.data?.error || 'Validation failed');
  }
  
  return success;
}

// ============================================================================
// Module 3: Room Creation
// ============================================================================

async function testRoomCreate() {
  console.log('\n' + '='.repeat(60));
  console.log('MODULE 3: Room Creation');
  console.log('='.repeat(60));
  
  // Note: This typically requires authentication
  const result = await fetchJson(`${API_BASE}/telehealth/room/create`, {
    method: 'POST',
    body: JSON.stringify({
      appointmentId: TEST_DATA.appointmentId,
      practitionerId: TEST_DATA.practitionerId,
      appointmentTime: TEST_DATA.appointmentTime,
      durationMinutes: TEST_DATA.appointmentDuration,
    }),
  });
  
  const success = result.status === 200 || result.status === 201;
  if (success && result.data?.data?.roomId) {
    roomId = result.data.data.roomId;
    printResult('Room Creation', true, {
      roomId: result.data.data.roomId,
      acsRoomId: result.data.data.acsRoomId,
    });
  } else {
    printResult('Room Creation', false, result.data?.error || result.error || 'No room created');
  }
  
  return success;
}

// ============================================================================
// Module 4: Room Join
// ============================================================================

async function testRoomJoin(participantType = 'patient') {
  console.log('\n' + '='.repeat(60));
  console.log(`MODULE 4: Room Join (${participantType})`);
  console.log('='.repeat(60));
  
  const participantId = participantType === 'patient' 
    ? TEST_DATA.patientId 
    : TEST_DATA.practitionerId;
  const participantName = participantType === 'patient'
    ? TEST_DATA.patientFirstName
    : TEST_DATA.practitionerName;
  
  const result = await fetchJson(`${API_BASE}/telehealth/room/join`, {
    method: 'POST',
    body: JSON.stringify({
      appointmentId: TEST_DATA.appointmentId,
      participantType,
      participantId,
      participantName,
    }),
  });
  
  const success = result.status === 200 && result.data?.data?.token;
  if (success) {
    printResult(`Room Join (${participantType})`, true, {
      hasToken: !!result.data.data.token,
      userId: result.data.data.userId,
      roomId: result.data.data.roomId,
    });
  } else {
    printResult(`Room Join (${participantType})`, false, result.data?.error || 'Join failed');
  }
  
  return success;
}

// ============================================================================
// Module 5: Full Flow Test
// ============================================================================

async function testFullFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('MODULE 5: Full Flow Test');
  console.log('='.repeat(60));
  
  const results = {
    tokenGenerate: await testTokenGenerate(),
    tokenValidate: await testTokenValidate(),
    roomCreate: await testRoomCreate(),
    roomJoinClinician: await testRoomJoin('clinician'),
    roomJoinPatient: await testRoomJoin('patient'),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    console.log(`  ${passed ? '✅' : '❌'} ${test}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'));
  
  return allPassed;
}

// ============================================================================
// Health Check
// ============================================================================

async function testHealth() {
  console.log('\n' + '='.repeat(60));
  console.log('HEALTH CHECK: API Connectivity');
  console.log('='.repeat(60));
  
  const result = await fetchJson(`${API_BASE}/health`);
  const success = result.status === 200;
  
  printResult('API Health', success, success ? 'API is running' : 'API not reachable');
  
  if (!success) {
    console.log('\n⚠️  Make sure the API is running:');
    console.log('   cd api && func host start');
  }
  
  return success;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const module = process.argv[2] || 'health';
  
  console.log('🧪 Telehealth Module Testing');
  console.log(`   API Base: ${API_BASE}`);
  console.log(`   Module: ${module}`);
  
  switch (module) {
    case 'health':
      await testHealth();
      break;
    case 'token-generate':
    case '1':
      await testTokenGenerate();
      break;
    case 'token-validate':
    case '2':
      // Use a hardcoded token if testing validation standalone
      const token = process.argv[3] || generatedToken;
      if (!token && !generatedToken) {
        await testTokenGenerate(); // Generate first
      }
      await testTokenValidate(token || generatedToken);
      break;
    case 'room-create':
    case '3':
      await testRoomCreate();
      break;
    case 'room-join':
    case '4':
      const pType = process.argv[3] || 'patient';
      await testRoomJoin(pType);
      break;
    case 'full-flow':
    case 'full':
    case '5':
      await testFullFlow();
      break;
    default:
      console.log('\nUsage: node test-telehealth-modules.js [module]');
      console.log('\nModules:');
      console.log('  health         - Check API connectivity');
      console.log('  token-generate - Test token generation (1)');
      console.log('  token-validate - Test token validation (2)');
      console.log('  room-create    - Test room creation (3)');
      console.log('  room-join      - Test room join (4)');
      console.log('  full-flow      - Run all tests (5)');
  }
}

main().catch(console.error);
