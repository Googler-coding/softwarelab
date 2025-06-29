import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  // Subscription Details
  subscriptionId: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Subscriber Information
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'subscriberType'
  },
  subscriberType: {
    type: String,
    required: true,
    enum: ['User', 'Restaurant', 'Rider']
  },
  subscriberName: {
    type: String,
    required: true,
  },
  subscriberEmail: {
    type: String,
    required: true,
  },
  
  // Plan Details
  planType: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
  },
  planName: {
    type: String,
    required: true,
    enum: ['Basic', 'Premium', 'Enterprise'],
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'BDT',
  },
  
  // Features included
  features: [{
    name: {
      type: String,
      required: true,
    },
    description: String,
    included: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Subscription Period
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  nextBillingDate: {
    type: Date,
    required: true,
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended', 'pending'],
    default: 'pending',
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'mobile_banking', 'cash'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  lastPaymentDate: Date,
  nextPaymentAmount: {
    type: Number,
    required: true,
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true,
  },
  
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  
  // Usage Tracking
  usage: {
    mealsOrdered: {
      type: Number,
      default: 0,
    },
    deliveriesCompleted: {
      type: Number,
      default: 0,
    },
    donationsMade: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
  },
  
  // Loyalty Points
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
  },
  
  // Notifications
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
  
  // Admin Management
  adminNotes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
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
subscriptionSchema.index({ subscriberId: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ paymentStatus: 1 });

// Pre-save middleware to update timestamps
subscriptionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to generate subscription ID
subscriptionSchema.statics.generateSubscriptionId = function () {
  return "SUB" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Method to calculate next billing date
subscriptionSchema.methods.calculateNextBillingDate = function () {
  const currentDate = new Date();
  let nextDate = new Date(currentDate);
  
  switch (this.planType) {
    case 'weekly':
      nextDate.setDate(currentDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(currentDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(currentDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(currentDate.getFullYear() + 1);
      break;
  }
  
  this.nextBillingDate = nextDate;
  return this.nextBillingDate;
};

// Method to add loyalty points
subscriptionSchema.methods.addLoyaltyPoints = function (points) {
  this.loyaltyPoints.earned += points;
  this.loyaltyPoints.available += points;
  return this.save();
};

// Method to use loyalty points
subscriptionSchema.methods.useLoyaltyPoints = function (points) {
  if (this.loyaltyPoints.available >= points) {
    this.loyaltyPoints.used += points;
    this.loyaltyPoints.available -= points;
    return this.save();
  }
  throw new Error('Insufficient loyalty points');
};

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'active' && this.endDate > now;
};

// Method to check if subscription is expiring soon
subscriptionSchema.methods.isExpiringSoon = function (days = 7) {
  const now = new Date();
  const expiryDate = new Date(this.endDate);
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays > 0;
};

export default mongoose.model("Subscription", subscriptionSchema); 