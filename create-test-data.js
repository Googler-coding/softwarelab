import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.js';
import Order from './models/Order.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/fooddelivery');
console.log('Connected to MongoDB');

try {
  // Create a test restaurant
  const restaurant = new Restaurant({
    restaurantName: "Test Restaurant",
    email: "test@restaurant.com",
    password: await bcrypt.hash("password123", 10),
    phone: "1234567890",
    address: "123 Test Street, Dhaka",
    lat: 23.8103,
    lon: 90.4125,
    role: "restaurant",
    cuisine: "Bangladeshi",
    rating: 4.5,
    deliverySettings: {
      maxDeliveryDistance: 10,
      deliveryFee: 50,
      minimumOrder: 200
    },
    kitchenSettings: {
      estimatedPreparationTime: 30,
      maxOrdersPerHour: 20
    }
  });

  await restaurant.save();
  console.log('Created test restaurant:', restaurant.restaurantName, 'ID:', restaurant._id);

  // Create a test user
  const user = new User({
    name: "Test Customer",
    email: "customer@test.com",
    password: await bcrypt.hash("password123", 10),
    phone: "0987654321",
    address: "456 Customer Street, Dhaka",
    role: "user"
  });

  await user.save();
  console.log('Created test user:', user.name, 'ID:', user._id);

  // Create a test order
  const order = new Order({
    orderId: Order.generateOrderId(),
    restaurantId: restaurant._id,
    restaurantName: restaurant.restaurantName,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    customerAddress: user.address,
    items: [
      {
        name: "Chicken Biryani",
        price: 350,
        quantity: 1,
        specialInstructions: "Extra spicy"
      }
    ],
    total: 350,
    orderType: "delivery",
    estimatedPreparationTime: 30,
    estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    userId: user._id,
    userRole: "user",
    paymentMethod: "cash",
    specialInstructions: "Please deliver quickly",
    status: "pending",
    kitchenStatus: "pending",
    trackingUpdates: [
      {
        status: "pending",
        message: "Order placed successfully",
        timestamp: new Date()
      }
    ]
  });

  await order.save();
  console.log('Created test order:', order.orderId, 'Status:', order.status);

  console.log('All test data created successfully!');
  console.log('Restaurant ID:', restaurant._id);
  console.log('User ID:', user._id);
  console.log('Order ID:', order._id);

} catch (error) {
  console.error('Error creating test data:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
} 