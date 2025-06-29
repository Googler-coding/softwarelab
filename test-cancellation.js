// Test script to verify cancellation functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testCancellation() {
  console.log('Testing cancellation functionality...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch(`${API_URL}/api/auth/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server is not responding');
      return;
    }

    // Test 2: Check cancellation request endpoint
    console.log('\n2. Testing cancellation request endpoint...');
    const cancelRequestResponse = await fetch(`${API_URL}/api/reservations/test/cancel-request`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        status: 'cancel_requested',
        cancellationReason: 'Test cancellation'
      })
    });
    console.log(`Cancellation request endpoint status: ${cancelRequestResponse.status}`);

    // Test 3: Check status update endpoint
    console.log('\n3. Testing status update endpoint...');
    const statusUpdateResponse = await fetch(`${API_URL}/api/reservations/test/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });
    console.log(`Status update endpoint status: ${statusUpdateResponse.status}`);

    console.log('\n✅ Basic endpoint tests completed');
    console.log('\nTo test the full cancellation flow:');
    console.log('1. Log in as a user');
    console.log('2. Go to your reservations dashboard');
    console.log('3. Find a confirmed reservation');
    console.log('4. Click "Request Cancellation"');
    console.log('5. Log in as the restaurant');
    console.log('6. Check the restaurant dashboard for the cancellation request');
    console.log('7. Approve or deny the cancellation request');
    console.log('8. Check that the user sees the updated status');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCancellation(); 