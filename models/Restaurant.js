import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lat: { type: Number, required: true, default: 23.8103 }, // Dhaka coordinates
  lon: { type: Number, required: true, default: 90.4125 }, // Dhaka coordinates
});

export default mongoose.model("Restaurant", restaurantSchema);
