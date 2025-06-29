import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  restaurantName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number, required: true, default: 23.8103 }, // Dhaka coordinates
  lon: { type: Number, required: true, default: 90.4125 }, // Dhaka coordinates
  cuisine: { type: String, required: true },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  // Operating hours
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
  },
  // Table management
  tableConfiguration: {
    totalTables: { type: Number, default: 20 },
    tableSizes: [
      {
        tableNumber: Number,
        capacity: Number, // number of seats
        isAvailable: { type: Boolean, default: true },
        location: { type: String, default: "indoor" },
      },
    ],
    reservationTimeSlots: [
      {
        time: String, // "12:00", "12:30", "13:00", etc.
        duration: Number, // in minutes, default 90
      },
    ],
  },
  // Kitchen and preparation settings
  kitchenSettings: {
    estimatedPreparationTime: { type: Number, default: 30 },
    maxPreparationTime: { type: Number, default: 60 },
    autoAcceptOrders: { type: Boolean, default: false },
    kitchenStatus: { type: String, enum: ["open", "busy", "closed"], default: "open" },
  },
  // Delivery settings
  deliverySettings: {
    isDeliveryAvailable: { type: Boolean, default: true },
    isTakeawayAvailable: { type: Boolean, default: true },
    isDineInAvailable: { type: Boolean, default: true },
    maxDeliveryDistance: { type: Number, default: 10 },
    deliveryFee: { type: Number, default: 50 },
    minimumOrderAmount: { type: Number, default: 200 },
  },
  // Menu and items
  menu: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String, default: "" },
      category: { type: String, default: "main" },
      preparationTime: { type: Number, default: 15 },
      isAvailable: { type: Boolean, default: true },
      image: { type: String, default: "" },
      allergens: [{ type: String }],
      nutritionalInfo: { calories: Number, protein: Number, carbs: Number, fat: Number },
    },
  ],
  // Restaurant status and settings
  status: { type: String, enum: ["open", "closed", "temporarily-closed"], default: "open" },
  isVerified: { type: Boolean, default: false },
  // Statistics
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    averagePreparationTime: { type: Number, default: 30 },
  },
  // Additional info
  description: { type: String, default: "" },
  images: [{ type: String }],
  documents: {
    businessLicense: { type: String, default: "" },
    foodLicense: { type: String, default: "" },
    taxCertificate: { type: String, default: "" },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for better query performance
restaurantSchema.index({ lat: 1, lon: 1 });
restaurantSchema.index({ status: 1, "kitchenSettings.kitchenStatus": 1 });
restaurantSchema.index({ "deliverySettings.isDeliveryAvailable": 1 });

// Pre-save middleware to update timestamps
restaurantSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to update kitchen status
restaurantSchema.methods.updateKitchenStatus = function (status) {
  this.kitchenSettings.kitchenStatus = status;
  return this.save();
};

// Method to calculate average preparation time
restaurantSchema.methods.calculateAveragePreparationTime = function () {
  if (this.menu.length === 0) return this.kitchenSettings.estimatedPreparationTime;
  
  const totalTime = this.menu.reduce((sum, item) => sum + item.preparationTime, 0);
  this.stats.averagePreparationTime = Math.round(totalTime / this.menu.length);
  return this.save();
};

// Method to check if restaurant is open
restaurantSchema.methods.isOpen = function () {
  const now = new Date();
  const dayOfWeek = now.toLocaleLowerCase().slice(0, 3);
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[dayOfWeek];
  if (!todayHours || !todayHours.isOpen) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to get available tables
restaurantSchema.methods.getAvailableTables = function () {
  return this.tableConfiguration.tableSizes.filter(table => table.isAvailable);
};

// Method to update table availability
restaurantSchema.methods.updateTableAvailability = function (tableNumber, isAvailable) {
  const table = this.tableConfiguration.tableSizes.find(t => t.tableNumber === tableNumber);
  if (table) {
    table.isAvailable = isAvailable;
    return this.save();
  }
  return Promise.reject(new Error("Table not found"));
};

// Static method to find restaurants by location
restaurantSchema.statics.findByLocation = async function (lat, lng, maxDistance = 10) {
  const restaurants = await this.find({
    status: "open",
    "deliverySettings.isDeliveryAvailable": true,
  });
  
  // Filter by distance (simple calculation - in production, use proper geospatial queries)
  const nearbyRestaurants = restaurants.filter(restaurant => {
    const distance = calculateDistance(lat, lng, restaurant.lat, restaurant.lon);
    return distance <= maxDistance;
  });
  
  return nearbyRestaurants.sort((a, b) => {
    const distanceA = calculateDistance(lat, lng, a.lat, a.lon);
    const distanceB = calculateDistance(lat, lng, b.lat, b.lon);
    return distanceA - distanceB;
  });
};

// Helper function to calculate distance
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

export default mongoose.model("Restaurant", restaurantSchema);
