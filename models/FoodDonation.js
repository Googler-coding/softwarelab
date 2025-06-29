import mongoose from "mongoose";

const foodDonationSchema = new mongoose.Schema({
  // Donation Details
  donationId: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Donor Information
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'donorType'
  },
  donorType: {
    type: String,
    required: true,
    enum: ['User', 'Restaurant']
  },
  donorName: {
    type: String,
    required: true,
  },
  donorEmail: {
    type: String,
    required: true,
  },
  donorPhone: {
    type: String,
    required: true,
  },
  
  // Charity Information
  charityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    required: true,
  },
  charityName: {
    type: String,
    required: true,
  },
  
  // Food Items (similar to order items)
  items: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      description: {
        type: String,
        default: "",
      },
    },
  ],
  
  // Financial Information
  totalValue: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Donation Details
  donationDate: {
    type: Date,
    required: true,
  },
  pickupDate: {
    type: Date,
    required: true,
  },
  pickupTime: {
    type: String,
    required: true,
  },
  
  // Location
  pickupAddress: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'approved', 'delivery', 'picked_up', 'completed', 'cancelled'],
    default: 'pending',
  },
  
  // Admin Management
  adminApproval: {
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: Date,
    notes: String,
  },
  
  // Rider Assignment
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
  },
  riderName: String,
  riderPhone: String,
  
  // Tracking
  trackingUpdates: [
    {
      status: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      location: {
        lat: Number,
        lng: Number,
      },
    },
  ],
  
  // Special Instructions
  specialInstructions: {
    type: String,
    default: "",
  },
  
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
foodDonationSchema.index({ donorId: 1, status: 1 });
foodDonationSchema.index({ charityId: 1, status: 1 });
foodDonationSchema.index({ donationDate: 1 });
foodDonationSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to update timestamps
foodDonationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to generate donation ID
foodDonationSchema.statics.generateDonationId = function () {
  return "DON" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Method to add tracking update
foodDonationSchema.methods.addTrackingUpdate = function (status, message, location = null) {
  this.trackingUpdates.push({
    status,
    message,
    timestamp: new Date(),
    location,
  });
  return this.save();
};

// Method to calculate total value
foodDonationSchema.methods.calculateTotalValue = function () {
  this.totalValue = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return this.totalValue;
};

export default mongoose.model("FoodDonation", foodDonationSchema); 