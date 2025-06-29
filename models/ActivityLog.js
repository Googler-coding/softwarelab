import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['User', 'Restaurant', 'Rider', 'Admin', 'Charity']
  },
  userName: {
    type: String,
    required: true,
  },
  
  // Activity Details
  action: {
    type: String,
    required: true,
    enum: [
      // User Actions
      'user_login', 'user_logout', 'user_register', 'user_profile_update',
      'user_password_change', 'user_preferences_update',
      
      // Order Actions
      'order_created', 'order_updated', 'order_cancelled', 'order_delivered',
      'order_status_changed', 'order_payment_completed',
      
      // Restaurant Actions
      'restaurant_login', 'restaurant_menu_updated', 'restaurant_order_accepted',
      'restaurant_order_rejected', 'restaurant_status_changed',
      
      // Rider Actions
      'rider_login', 'rider_order_accepted', 'rider_order_delivered',
      'rider_location_updated', 'rider_status_changed',
      
      // Donation Actions
      'donation_created', 'donation_approved', 'donation_rejected',
      'donation_picked_up', 'donation_delivered',
      
      // Subscription Actions
      'subscription_created', 'subscription_cancelled', 'subscription_renewed',
      'subscription_payment_failed', 'subscription_expired',
      
      // Admin Actions
      'admin_login', 'admin_user_management', 'admin_order_management',
      'admin_donation_approval', 'admin_system_settings',
      
      // System Actions
      'system_notification_sent', 'system_backup', 'system_maintenance',
      'system_error', 'system_warning',
      
      // Chat Actions
      'chat_message_sent', 'chat_room_created', 'chat_support_requested',
      
      // Payment Actions
      'payment_initiated', 'payment_completed', 'payment_failed',
      'payment_refunded', 'payment_cancelled',
      
      // Loyalty Actions
      'loyalty_points_earned', 'loyalty_points_used', 'loyalty_tier_upgraded',
      
      // Reservation Actions
      'reservation_created', 'reservation_confirmed', 'reservation_cancelled',
      'reservation_completed'
    ]
  },
  
  // Resource Information
  resource: {
    type: {
      type: String,
      enum: ['Order', 'Donation', 'Subscription', 'User', 'Restaurant', 'Rider', 'Charity', 'Reservation', 'Chat', 'Payment', 'System'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: String,
  },
  
  // Activity Details
  details: {
    description: {
      type: String,
      required: true,
    },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  
  // IP and Location
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'cancelled'],
    default: 'success',
  },
  
  // Error Information (if failed)
  error: {
    code: String,
    message: String,
    stack: String,
  },
  
  // Performance Metrics
  performance: {
    duration: Number, // in milliseconds
    memoryUsage: Number,
    cpuUsage: Number,
  },
  
  // Security Information
  security: {
    sessionId: String,
    tokenId: String,
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });

// Static method to create activity log
activityLogSchema.statics.createLog = function (data) {
  const log = new this({
    userId: data.userId,
    userType: data.userType,
    userName: data.userName,
    action: data.action,
    resource: data.resource,
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    location: data.location,
    status: data.status || 'success',
    error: data.error,
    performance: data.performance,
    security: data.security,
  });
  
  return log.save();
};

// Static method to get user activity
activityLogSchema.statics.getUserActivity = function (userId, limit = 50, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get activity by action
activityLogSchema.statics.getActivityByAction = function (action, limit = 50, skip = 0) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get activity by resource
activityLogSchema.statics.getActivityByResource = function (resourceType, resourceId, limit = 50) {
  return this.find({
    'resource.type': resourceType,
    'resource.id': resourceId,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get suspicious activities
activityLogSchema.statics.getSuspiciousActivities = function (limit = 50) {
  return this.find({
    $or: [
      { 'security.isSuspicious': true },
      { 'security.riskLevel': { $in: ['high', 'critical'] } },
      { status: 'failed' },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get activity statistics
activityLogSchema.statics.getActivityStatistics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status',
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$performance.duration' },
      },
    },
    {
      $group: {
        _id: '$_id.action',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
            avgDuration: '$avgDuration',
          },
        },
        totalCount: { $sum: '$count' },
      },
    },
  ]);
};

// Static method to clean old logs
activityLogSchema.statics.cleanOldLogs = function (days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'security.riskLevel': { $ne: 'critical' }, // Keep critical logs
  });
};

// Method to mark as suspicious
activityLogSchema.methods.markAsSuspicious = function (reason) {
  this.security.isSuspicious = true;
  this.security.riskLevel = 'high';
  this.details.metadata = {
    ...this.details.metadata,
    suspiciousReason: reason,
    markedAt: new Date(),
  };
  return this.save();
};

export default mongoose.model("ActivityLog", activityLogSchema); 