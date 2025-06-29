// Test script to verify order cancellation functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testOrderCancellation() {
  console.log('Testing order cancellation functionality...\n');

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

    // Test 2: Check order cancellation endpoint
    console.log('\n2. Testing order cancellation endpoint...');
    const cancelOrderResponse = await fetch(`${API_URL}/api/orders/test-order-id/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        reason: 'Test cancellation'
      })
    });
    console.log(`Order cancellation endpoint status: ${cancelOrderResponse.status}`);

    // Test 3: Check order status update endpoint
    console.log('\n3. Testing order status update endpoint...');
    const statusUpdateResponse = await fetch(`${API_URL}/api/orders/test-order-id/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });
    console.log(`Order status update endpoint status: ${statusUpdateResponse.status}`);

    console.log('\n✅ Basic endpoint tests completed');
    console.log('\nTo test the full order cancellation flow:');
    console.log('1. Log in as a user');
    console.log('2. Go to your orders dashboard');
    console.log('3. Find a pending or confirmed order');
    console.log('4. Click "Cancel Order"');
    console.log('5. Confirm the cancellation');
    console.log('6. Check that the order status changes to "cancelled"');
    console.log('7. Verify that the restaurant dashboard shows the cancelled order');
    console.log('8. Check that real-time updates work via socket.io');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrderCancellation(); 