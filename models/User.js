import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: true,
    trim: true,
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
  },
  phone: { 
    type: String, 
    required: true,
  },
  password: { 
    type: String, 
    required: true,
  },
  
  // Profile Information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Bangladesh',
      },
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  
  // Preferences
  preferences: {
    dietaryRestrictions: [{
      type: String,
      enum: ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'None'],
    }],
    cuisinePreferences: [String],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra_hot'],
      default: 'medium',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
  },
  
  // Loyalty System
  loyaltyPoints: {
    earned: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
    available: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
  },
  
  // Subscription Information
  subscription: {
    active: {
      type: Boolean,
      default: false,
    },
    planType: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    },
    planName: {
      type: String,
      enum: ['Basic', 'Premium', 'Enterprise'],
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  
  // Statistics
  statistics: {
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
    totalDonationValue: {
      type: Number,
      default: 0,
    },
    favoriteRestaurants: [{
      restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
      orderCount: {
        type: Number,
        default: 1,
      },
    }],
    lastOrderDate: Date,
    lastDonationDate: Date,
  },
  
  // Payment Methods
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'mobile_banking', 'bank_transfer'],
      required: true,
    },
    name: String,
    lastFour: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Status and Verification
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: Date,
  
  // Security
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'profile.coordinates': '2dsphere' });
userSchema.index({ 'loyaltyPoints.tier': 1 });

// Pre-save middleware to update timestamps
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to add loyalty points
userSchema.methods.addLoyaltyPoints = function (points) {
  this.loyaltyPoints.earned += points;
  this.loyaltyPoints.available += points;
  this.updateLoyaltyTier();
  return this.save();
};

// Method to use loyalty points
userSchema.methods.useLoyaltyPoints = function (points) {
  if (this.loyaltyPoints.available >= points) {
    this.loyaltyPoints.used += points;
    this.loyaltyPoints.available -= points;
    return this.save();
  }
  throw new Error('Insufficient loyalty points');
};

// Method to update loyalty tier
userSchema.methods.updateLoyaltyTier = function () {
  const totalEarned = this.loyaltyPoints.earned;
  
  if (totalEarned >= 10000) {
    this.loyaltyPoints.tier = 'Platinum';
  } else if (totalEarned >= 5000) {
    this.loyaltyPoints.tier = 'Gold';
  } else if (totalEarned >= 1000) {
    this.loyaltyPoints.tier = 'Silver';
  } else {
    this.loyaltyPoints.tier = 'Bronze';
  }
};

// Method to add favorite restaurant
userSchema.methods.addFavoriteRestaurant = function (restaurantId) {
  const existingIndex = this.statistics.favoriteRestaurants.findIndex(
    fav => fav.restaurantId.toString() === restaurantId.toString()
  );
  
  if (existingIndex >= 0) {
    this.statistics.favoriteRestaurants[existingIndex].orderCount += 1;
  } else {
    this.statistics.favoriteRestaurants.push({
      restaurantId,
      orderCount: 1,
    });
  }
  
  return this.save();
};

// Method to update order statistics
userSchema.methods.updateOrderStatistics = function (orderTotal) {
  this.statistics.totalOrders += 1;
  this.statistics.totalSpent += orderTotal;
  this.statistics.lastOrderDate = new Date();
  return this.save();
};

// Method to update donation statistics
userSchema.methods.updateDonationStatistics = function (donationValue) {
  this.statistics.totalDonations += 1;
  this.statistics.totalDonationValue += donationValue;
  this.statistics.lastDonationDate = new Date();
  return this.save();
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

export default mongoose.model("User", userSchema);
