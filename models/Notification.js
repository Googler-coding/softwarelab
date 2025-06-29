import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['User', 'Restaurant', 'Rider', 'Admin', 'Charity']
  },
  
  // Notification Details
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['info', 'success', 'warning', 'error', 'order', 'donation', 'subscription', 'system'],
  },
  
  // Related Entity
  relatedEntity: {
    type: {
      type: String,
      enum: ['Order', 'Donation', 'Subscription', 'Reservation', 'Chat'],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  
  // Action Details
  action: {
    type: {
      type: String,
      enum: ['view', 'approve', 'reject', 'complete', 'cancel', 'none'],
      default: 'none',
    },
    url: String,
    data: mongoose.Schema.Types.Mixed,
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  
  // Delivery Channels
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    sms: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    push: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    inApp: {
      sent: {
        type: Boolean,
        default: true,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  
  // Read Status
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  
  // Scheduled Delivery
  scheduledFor: Date,
  delivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: Date,
  
  // Template Information
  template: {
    name: String,
    variables: mongoose.Schema.Types.Mixed,
  },
  
  // Metadata
  metadata: {
    source: String,
    category: String,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed,
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
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ scheduledFor: 1, delivered: 1 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

// Pre-save middleware to update timestamps
notificationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create notification
notificationSchema.statics.createNotification = function (data) {
  const notification = new this({
    recipientId: data.recipientId,
    recipientType: data.recipientType,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    priority: data.priority || 'medium',
    relatedEntity: data.relatedEntity,
    action: data.action,
    channels: data.channels,
    scheduledFor: data.scheduledFor,
    template: data.template,
    metadata: data.metadata,
  });
  
  return notification.save();
};

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function (channel = 'inApp') {
  this.delivered = true;
  this.deliveredAt = new Date();
  this.channels[channel].sent = true;
  this.channels[channel].sentAt = new Date();
  return this.save();
};

// Method to mark channel as failed
notificationSchema.methods.markChannelFailed = function (channel, error) {
  this.channels[channel].sent = false;
  this.channels[channel].error = error;
  return this.save();
};

// Static method to get unread notifications
notificationSchema.statics.getUnreadNotifications = function (recipientId, limit = 50) {
  return this.find({
    recipientId,
    read: false,
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get notifications by type
notificationSchema.statics.getNotificationsByType = function (recipientId, type, limit = 50) {
  return this.find({
    recipientId,
    type,
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (recipientId) {
  return this.updateMany(
    { recipientId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true,
  });
};

export default mongoose.model("Notification", notificationSchema); 