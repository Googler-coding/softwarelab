// Test script to verify reservations functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testReservations() {
  console.log('Testing reservations functionality...\n');

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

    // Test 2: Check reservations routes
    console.log('\n2. Testing reservations routes...');
    const routesResponse = await fetch(`${API_URL}/api/reservations`);
    console.log(`Reservations endpoint status: ${routesResponse.status}`);

    // Test 3: Check if restaurant reservations endpoint exists
    console.log('\n3. Testing restaurant reservations endpoint...');
    const restaurantReservationsResponse = await fetch(`${API_URL}/api/reservations/restaurant`);
    console.log(`Restaurant reservations endpoint status: ${restaurantReservationsResponse.status}`);

    console.log('\n✅ Basic connectivity tests completed');
    console.log('\nTo test the full functionality:');
    console.log('1. Create a user account');
    console.log('2. Create a restaurant account');
    console.log('3. Make a reservation as a user');
    console.log('4. Check if the reservation appears in the restaurant dashboard');
    console.log('5. Test cancellation request functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReservations(); 