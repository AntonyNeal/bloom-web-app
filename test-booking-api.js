async function test() {
  const endpoint = 'https://bloom-functions-staging-new.azurewebsites.net/api/create-halaxy-booking';
  
  const payload = {
    patient: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      gender: 'male'
    },
    appointmentDetails: {
      startTime: '2026-01-22T09:00:00+10:00',
      endTime: '2026-01-22T10:00:00+10:00',
      minutesDuration: 60
    }
  };

  console.log('Testing booking API...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Response:', body);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
