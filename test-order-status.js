import mongoose from 'mongoose';
import Order from './models/Order.js';
import Restaurant from './models/Restaurant.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/fooddelivery');
console.log('Connected to MongoDB');

try {
  // Find a restaurant
  const restaurant = await Restaurant.findOne();
  if (!restaurant) {
    console.log('No restaurants found in database');
    process.exit(1);
  }
  console.log('Found restaurant:', restaurant.restaurantName, 'ID:', restaurant._id);

  // Find orders for this restaurant
  const orders = await Order.find({ restaurantId: restaurant._id });
  console.log('Found', orders.length, 'orders for restaurant');

  if (orders.length === 0) {
    console.log('No orders found for restaurant');
    process.exit(1);
  }

  // Test the first order
  const testOrder = orders[0];
  console.log('Testing order:', testOrder._id, 'Current status:', testOrder.status);

  // Test updating order status
  testOrder.status = 'confirmed';
  testOrder.updatedAt = new Date();
  await testOrder.save();
  console.log('Order status updated successfully to:', testOrder.status);

  // Test the addTrackingUpdate method
  await testOrder.addTrackingUpdate('confirmed', 'Order confirmed by restaurant');
  console.log('Tracking update added successfully');

  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
} 