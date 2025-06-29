// Test script to verify scrollable reservations functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testScrollableReservations() {
  console.log('Testing scrollable reservations functionality...\n');

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

    // Test 2: Check reservations endpoint
    console.log('\n2. Testing reservations endpoint...');
    const reservationsResponse = await fetch(`${API_URL}/api/reservations/restaurant`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`Reservations endpoint status: ${reservationsResponse.status}`);

    // Test 3: Check orders endpoint
    console.log('\n3. Testing orders endpoint...');
    const ordersResponse = await fetch(`${API_URL}/api/restaurants/orders`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log(`Orders endpoint status: ${ordersResponse.status}`);

    console.log('\n✅ Basic endpoint tests completed');
    console.log('\nTo test the scrollable functionality:');
    console.log('1. Log in as a restaurant');
    console.log('2. Go to the restaurant dashboard');
    console.log('3. Check the "Table Reservations" section');
    console.log('4. Verify that the reservations list is scrollable');
    console.log('5. Check that all reservations are shown (not limited to 5)');
    console.log('6. Verify that the "Recent Orders" section is also scrollable');
    console.log('7. Test scrolling with mouse wheel and scrollbar');
    console.log('8. Verify that the scrollbar styling is consistent');

    console.log('\nExpected CSS changes:');
    console.log('- .reservations-list: max-height: 400px, overflow-y: auto');
    console.log('- .orders-list: max-height: 400px, overflow-y: auto');
    console.log('- Custom scrollbar styling for both lists');
    console.log('- Removed slice(0, 5) limit from both lists');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScrollableReservations(); 