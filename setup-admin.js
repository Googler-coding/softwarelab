import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/foodDeliveryApp');
console.log('Connected to MongoDB');

try {
  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email: 'admin@fooddelivery.com' });
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    console.log('Email: admin@fooddelivery.com');
    console.log('Password: admin123');
  } else {
    // Create admin user
    const admin = new Admin({
      name: 'System Administrator',
      email: 'admin@fooddelivery.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      permissions: ['all']
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@fooddelivery.com');
    console.log('Password: admin123');
  }

} catch (error) {
  console.error('❌ Error creating admin:', error.message);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
} 