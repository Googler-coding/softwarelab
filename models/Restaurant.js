import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true, minlength: 2 },
  ownerName: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;