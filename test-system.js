// Comprehensive System Test Script
// This script tests all major components of the food delivery system

const API_URL = "http://localhost:5000";

// Test data
const testData = {
  user: {
    name: "Test User",
    email: "testuser@example.com",
    phone: "1234567890",
    password: "testpass123"
  },
  rider: {
    name: "Test Rider",
    email: "testrider@example.com",
    nid: "1234567890123456",
    password: "testpass123"
  },
  restaurant: {
    restaurantName: "Test Restaurant",
    ownerName: "Test Owner",
    email: "testrestaurant@example.com",
    password: "testpass123"
  },
  admin: {
    email: "admin@fooddelivery.com",
    password: "admin123"
  }
};

let tokens = {};
let orderId = null;
let restaurantId = null;

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { response: null, data: { error: error.message } };
  }
};

// Test functions
const testServerHealth = async () => {
  log("Testing server health...");
  const { response, data } = await makeRequest('/api/health');
  
  if (response?.ok) {
    log("✅ Server is healthy", data);
    return true;
  } else {
    log("❌ Server health check failed", data);
    return false;
  }
};

const testUserSignup = async () => {
  log("Testing user signup...");
  const { response, data } = await makeRequest('/api/auth/signup/user', {
    method: 'POST',
    body: JSON.stringify(testData.user)
  });
  
  if (response?.ok) {
    log("✅ User signup successful", data);
    return true;
  } else {
    log("❌ User signup failed", data);
    return false;
  }
};

const testUserSignin = async () => {
  log("Testing user signin...");
  const { response, data } = await makeRequest('/api/auth/signin/user', {
    method: 'POST',
    body: JSON.stringify({
      email: testData.user.email,
      password: testData.user.password
    })
  });
  
  if (response?.ok && data.token) {
    tokens.user = data.token;
    log("✅ User signin successful", { token: data.token.substring(0, 20) + "..." });
    return true;
  } else {
    log("❌ User signin failed", data);
    return false;
  }
};

const testRestaurantSignup = async () => {
  log("Testing restaurant signup...");
  const { response, data } = await makeRequest('/api/auth/signup/restaurant', {
    method: 'POST',
    body: JSON.stringify(testData.restaurant)
  });
  
  if (response?.ok) {
    log("✅ Restaurant signup successful", data);
    return true;
  } else {
    log("❌ Restaurant signup failed", data);
    return false;
  }
};

const testRestaurantSignin = async () => {
  log("Testing restaurant signin...");
  const { response, data } = await makeRequest('/api/auth/signin/restaurant', {
    method: 'POST',
    body: JSON.stringify({
      email: testData.restaurant.email,
      password: testData.restaurant.password
    })
  });
  
  if (response?.ok && data.token) {
    tokens.restaurant = data.token;
    restaurantId = data.id;
    log("✅ Restaurant signin successful", { token: data.token.substring(0, 20) + "...", id: data.id });
    return true;
  } else {
    log("❌ Restaurant signin failed", data);
    return false;
  }
};

const testRiderSignup = async () => {
  log("Testing rider signup...");
  const { response, data } = await makeRequest('/api/auth/signup/rider', {
    method: 'POST',
    body: JSON.stringify(testData.rider)
  });
  
  if (response?.ok) {
    log("✅ Rider signup successful", data);
    return true;
  } else {
    log("❌ Rider signup failed", data);
    return false;
  }
};

const testRiderSignin = async () => {
  log("Testing rider signin...");
  const { response, data } = await makeRequest('/api/auth/signin/rider', {
    method: 'POST',
    body: JSON.stringify({
      email: testData.rider.email,
      password: testData.rider.password
    })
  });
  
  if (response?.ok && data.token) {
    tokens.rider = data.token;
    log("✅ Rider signin successful", { token: data.token.substring(0, 20) + "..." });
    return true;
  } else {
    log("❌ Rider signin failed", data);
    return false;
  }
};

const testAdminSignin = async () => {
  log("Testing admin signin...");
  const { response, data } = await makeRequest('/api/auth/signin/admin', {
    method: 'POST',
    body: JSON.stringify(testData.admin)
  });
  
  if (response?.ok && data.token) {
    tokens.admin = data.token;
    log("✅ Admin signin successful", { token: data.token.substring(0, 20) + "..." });
    return true;
  } else {
    log("❌ Admin signin failed", data);
    return false;
  }
};

const testRestaurantMenu = async () => {
  log("Testing restaurant menu operations...");
  
  // Add menu item
  const addItem = await makeRequest('/api/menu', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.restaurant}` },
    body: JSON.stringify({
      name: "Test Burger",
      price: 12.99,
      userId: restaurantId
    })
  });
  
  if (addItem.response?.ok) {
    log("✅ Menu item added successfully", addItem.data);
    
    // Get menu items
    const getItems = await makeRequest(`/api/menu/${restaurantId}`, {
      headers: { Authorization: `Bearer ${tokens.restaurant}` }
    });
    
    if (getItems.response?.ok) {
      log("✅ Menu items retrieved successfully", getItems.data);
      return true;
    }
  }
  
  log("❌ Restaurant menu operations failed");
  return false;
};

const testOrderCreation = async () => {
  log("Testing order creation...");
  
  const orderData = {
    restaurantId: restaurantId,
    customerName: testData.user.name,
    customerEmail: testData.user.email,
    customerPhone: testData.user.phone,
    items: [
      { name: "Test Burger", price: 12.99, quantity: 2 }
    ],
    total: 25.98,
    status: "pending"
  };
  
  const { response, data } = await makeRequest('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.user}` },
    body: JSON.stringify(orderData)
  });
  
  if (response?.ok && data.order) {
    orderId = data.order._id;
    log("✅ Order created successfully", { orderId: data.order._id });
    return true;
  } else {
    log("❌ Order creation failed", data);
    return false;
  }
};

const testOrderStatusUpdate = async () => {
  log("Testing order status update...");
  
  const { response, data } = await makeRequest(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens.restaurant}` },
    body: JSON.stringify({ status: "ready" })
  });
  
  if (response?.ok) {
    log("✅ Order status updated to ready", data);
    return true;
  } else {
    log("❌ Order status update failed", data);
    return false;
  }
};

const testRiderOrderAcceptance = async () => {
  log("Testing rider order acceptance...");
  
  // First, go online
  await makeRequest('/api/rider/status', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens.rider}` },
    body: JSON.stringify({ isOnline: true, status: "available" })
  });
  
  // Get available orders
  const availableOrders = await makeRequest('/api/rider/available-orders', {
    headers: { Authorization: `Bearer ${tokens.rider}` }
  });
  
  if (availableOrders.response?.ok && availableOrders.data.length > 0) {
    log("✅ Available orders found", availableOrders.data);
    
    // Accept the first order
    const acceptOrder = await makeRequest(`/api/rider/accept-order/${orderId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.rider}` }
    });
    
    if (acceptOrder.response?.ok) {
      log("✅ Order accepted by rider", acceptOrder.data);
      return true;
    }
  }
  
  log("❌ Rider order acceptance failed");
  return false;
};

const testChatSystem = async () => {
  log("Testing chat system...");
  
  // Get or create chat
  const getChat = await makeRequest(`/api/chat/order/${orderId}`, {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  
  if (getChat.response?.ok) {
    log("✅ Chat retrieved/created successfully", getChat.data);
    
    // Send message from user
    const sendMessage = await makeRequest('/api/chat/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.user}` },
      body: JSON.stringify({
        orderId: orderId,
        content: "Hello rider! How's my order?"
      })
    });
    
    if (sendMessage.response?.ok) {
      log("✅ Message sent successfully", sendMessage.data);
      return true;
    }
  }
  
  log("❌ Chat system test failed");
  return false;
};

const testUserOrderTracking = async () => {
  log("Testing user order tracking...");
  
  const { response, data } = await makeRequest('/api/user/orders', {
    headers: { Authorization: `Bearer ${tokens.user}` }
  });
  
  if (response?.ok) {
    log("✅ User orders retrieved successfully", data);
    return true;
  } else {
    log("❌ User order tracking failed", data);
    return false;
  }
};

const testAdminAnalytics = async () => {
  log("Testing admin analytics...");
  
  const { response, data } = await makeRequest('/api/admin/analytics', {
    headers: { Authorization: `Bearer ${tokens.admin}` }
  });
  
  if (response?.ok) {
    log("✅ Admin analytics retrieved successfully", data);
    return true;
  } else {
    log("❌ Admin analytics failed", data);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  log("🚀 Starting comprehensive system test...");
  
  const tests = [
    { name: "Server Health", fn: testServerHealth },
    { name: "User Signup", fn: testUserSignup },
    { name: "User Signin", fn: testUserSignin },
    { name: "Restaurant Signup", fn: testRestaurantSignup },
    { name: "Restaurant Signin", fn: testRestaurantSignin },
    { name: "Rider Signup", fn: testRiderSignup },
    { name: "Rider Signin", fn: testRiderSignin },
    { name: "Admin Signin", fn: testAdminSignin },
    { name: "Restaurant Menu", fn: testRestaurantMenu },
    { name: "Order Creation", fn: testOrderCreation },
    { name: "Order Status Update", fn: testOrderStatusUpdate },
    { name: "Rider Order Acceptance", fn: testRiderOrderAcceptance },
    { name: "Chat System", fn: testChatSystem },
    { name: "User Order Tracking", fn: testUserOrderTracking },
    { name: "Admin Analytics", fn: testAdminAnalytics }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      log(`\n🧪 Running test: ${test.name}`);
      const result = await test.fn();
      if (result) {
        passed++;
        log(`✅ ${test.name} PASSED`);
      } else {
        failed++;
        log(`❌ ${test.name} FAILED`);
      }
    } catch (error) {
      failed++;
      log(`❌ ${test.name} FAILED with error:`, error.message);
    }
  }
  
  log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    log("🎉 All tests passed! System is working correctly.");
  } else {
    log("⚠️  Some tests failed. Please check the system configuration.");
  }
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

export { runAllTests }; 