import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // New fields for rider dashboard
  lat: { type: Number, default: 23.8103 }, // Current latitude
  lon: { type: Number, default: 90.4125 }, // Current longitude
  status: { 
    type: String, 
    enum: ['available', 'busy', 'offline'], 
    default: 'available' 
  },
  isOnline: { type: Boolean, default: false },
  currentOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    default: null 
  },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  vehicleType: { type: String, default: 'Motorcycle' },
  phone: { type: String },
}, {
  timestamps: true
});

export default mongoose.model("Rider", riderSchema);
