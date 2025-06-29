import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // New fields for rider dashboard
  lat: { type: Number, default: 23.8103 }, // Current latitude
  lon: { type: Number, default: 90.4125 }, // Current longitude
  status: { 
    type: String, 
    enum: ['available', 'busy', 'offline', 'on-delivery'], 
    default: 'offline' 
  },
  isOnline: { type: Boolean, default: false },
  currentOrder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    default: null 
  },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  rating: { 
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  vehicleType: { type: String, default: 'Motorcycle' },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    lastUpdated: { type: Date, default: null },
  },
  vehicleInfo: {
    type: { type: String, enum: ["bike", "scooter", "car", "bicycle"], default: "bike" },
    model: { type: String, default: "" },
    plateNumber: { type: String, default: "" },
  },
  earnings: {
    total: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
  },
  deliveryStats: {
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 },
  },
  workingHours: {
    startTime: { type: String, default: "09:00" },
    endTime: { type: String, default: "18:00" },
    isWorking: { type: Boolean, default: false },
  },
  activeOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    default: null 
  },
  locationHistory: [
    {
      lat: Number,
      lng: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  documents: {
    idProof: { type: String, default: "" },
    vehicleRegistration: { type: String, default: "" },
    insurance: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
  },
  preferences: {
    maxDeliveryDistance: { type: Number, default: 10 },
    preferredAreas: [{ type: String }],
    autoAcceptOrders: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Indexes for better query performance
riderSchema.index({ status: 1, "currentLocation.lat": 1, "currentLocation.lng": 1 });
riderSchema.index({ "currentLocation.lastUpdated": -1 });

// Pre-save middleware to update timestamps
riderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to update location
riderSchema.methods.updateLocation = function (lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    lastUpdated: new Date(),
  };
  
  // Keep only last 100 location updates
  this.locationHistory.push({
    lat,
    lng,
    timestamp: new Date(),
  });
  
  if (this.locationHistory.length > 100) {
    this.locationHistory = this.locationHistory.slice(-100);
  }
  
  return this.save();
};

// Method to update status
riderSchema.methods.updateStatus = function (status) {
  this.status = status;
  if (status === "offline") {
    this.activeOrderId = null;
  }
  return this.save();
};

// Method to assign order
riderSchema.methods.assignOrder = function (orderId) {
  this.activeOrderId = orderId;
  this.status = "on-delivery";
  return this.save();
};

// Method to complete delivery
riderSchema.methods.completeDelivery = function (deliveryTime) {
  this.activeOrderId = null;
  this.status = "available";
  this.deliveryStats.completedDeliveries += 1;
  this.deliveryStats.totalDeliveries += 1;
  
  // Update average delivery time
  const currentAvg = this.deliveryStats.averageDeliveryTime;
  const totalDeliveries = this.deliveryStats.completedDeliveries;
  this.deliveryStats.averageDeliveryTime = 
    ((currentAvg * (totalDeliveries - 1)) + deliveryTime) / totalDeliveries;
  
  return this.save();
};

// Static method to find available riders near location
riderSchema.statics.findAvailableRiders = async function (lat, lng, maxDistance = 10) {
  const riders = await this.find({
    status: "available",
    "workingHours.isWorking": true,
    "documents.isVerified": true,
  });
  
  // Filter riders by distance (simple calculation - in production, use proper geospatial queries)
  const availableRiders = riders.filter(rider => {
    if (!rider.currentLocation.lat || !rider.currentLocation.lng) return false;
    
    const distance = calculateDistance(
      lat, lng,
      rider.currentLocation.lat, rider.currentLocation.lng
    );
    
    return distance <= maxDistance;
  });
  
  return availableRiders.sort((a, b) => {
    const distanceA = calculateDistance(lat, lng, a.currentLocation.lat, a.currentLocation.lng);
    const distanceB = calculateDistance(lat, lng, b.currentLocation.lat, b.currentLocation.lng);
    return distanceA - distanceB;
  });
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default mongoose.model("Rider", riderSchema);
