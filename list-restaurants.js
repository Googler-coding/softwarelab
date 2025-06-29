import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.js';

await mongoose.connect('mongodb://localhost:27017/fooddelivery');
const restaurants = await Restaurant.find({});
restaurants.forEach(r => {
  console.log(`${r._id.toString()} | ${r.name || r.restaurantName}`);
});
await mongoose.disconnect(); 