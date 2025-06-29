import mongoose from "mongoose";

const charitySchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  
  // Organization Details
  organizationType: {
    type: String,
    required: true,
    enum: ['NGO', 'Foundation', 'Community Center', 'Shelter', 'Other'],
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: 'Bangladesh',
    },
  },
  
  // Location Coordinates
  coordinates: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  
  // Contact Person
  contactPerson: {
    name: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  
  // Mission and Description
  mission: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Operating Hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  
  // Capacity and Requirements
  capacity: {
    dailyMeals: {
      type: Number,
      required: true,
      min: 1,
    },
    storageCapacity: {
      type: String,
      required: true,
    },
  },
  
  // Food Preferences
  foodPreferences: {
    acceptsVegetarian: {
      type: Boolean,
      default: true,
    },
    acceptsNonVegetarian: {
      type: Boolean,
      default: true,
    },
    dietaryRestrictions: [{
      type: String,
      enum: ['Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'None'],
    }],
    specialRequirements: {
      type: String,
      default: "",
    },
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['pending', 'verified', 'active', 'suspended'],
    default: 'pending',
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  
  // Statistics
  statistics: {
    totalDonationsReceived: {
      type: Number,
      default: 0,
    },
    totalValueReceived: {
      type: Number,
      default: 0,
    },
    mealsServed: {
      type: Number,
      default: 0,
    },
    lastDonationDate: Date,
  },
  
  // Documents
  documents: {
    registrationCertificate: String,
    taxExemptionCertificate: String,
    bankStatement: String,
    otherDocuments: [String],
  },
  
  // Settings
  settings: {
    autoAcceptDonations: {
      type: Boolean,
      default: false,
    },
    notificationPreferences: {
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
charitySchema.index({ email: 1 });
charitySchema.index({ status: 1 });
charitySchema.index({ coordinates: '2dsphere' });
charitySchema.index({ verified: 1 });

// Pre-save middleware to update timestamps
charitySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to update statistics
charitySchema.methods.updateStatistics = function (donationValue) {
  this.statistics.totalDonationsReceived += 1;
  this.statistics.totalValueReceived += donationValue;
  this.statistics.lastDonationDate = new Date();
  return this.save();
};

// Method to check if charity is open
charitySchema.methods.isOpen = function () {
  const now = new Date();
  const dayOfWeek = now.toLocaleLowerCase().slice(0, 3);
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[dayOfWeek];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false;
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

export default mongoose.model("Charity", charitySchema); 