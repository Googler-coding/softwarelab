import express from "express";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Rider from "../models/Rider.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import auth from "../middleware/auth.js";
import { io } from "../socket.js";

const router = express.Router();

// Public endpoint to get available subscription plans (no authentication required)
router.get("/public/plans", async (req, res) => {
  try {
    const plans = [
      {
        name: "Basic Plan",
        description: "Perfect for individual users",
        price: 299,
        currency: "BDT",
        features: [
          "Free delivery on orders above ৳500",
          "Priority customer support",
          "Access to exclusive deals",
          "Order tracking"
        ],
        planTypes: [
          { type: "weekly", price: 99 },
          { type: "monthly", price: 299 },
          { type: "quarterly", price: 799 },
          { type: "yearly", price: 2999 }
        ]
      },
      {
        name: "Premium Plan",
        description: "Best value for regular users",
        price: 599,
        currency: "BDT",
        features: [
          "Free delivery on all orders",
          "Priority customer support",
          "Access to exclusive deals",
          "Order tracking",
          "Free table reservations",
          "Special member discounts",
          "Early access to new features"
        ],
        planTypes: [
          { type: "weekly", price: 199 },
          { type: "monthly", price: 599 },
          { type: "quarterly", price: 1599 },
          { type: "yearly", price: 5999 }
        ]
      },
      {
        name: "Family Plan",
        description: "Great for families and groups",
        price: 999,
        currency: "BDT",
        features: [
          "Free delivery on all orders",
          "Priority customer support",
          "Access to exclusive deals",
          "Order tracking",
          "Free table reservations",
          "Special member discounts",
          "Early access to new features",
          "Family meal packages",
          "Bulk order discounts",
          "Personal meal planner"
        ],
        planTypes: [
          { type: "weekly", price: 299 },
          { type: "monthly", price: 999 },
          { type: "quarterly", price: 2699 },
          { type: "yearly", price: 9999 }
        ]
      }
    ];
    
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ 
      message: "Failed to fetch plans", 
      error: error.message 
    });
  }
});

// Create a new subscription
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      planType,
      planName,
      price,
      features,
      paymentMethod,
      autoRenew = true
    } = req.body;

    // Validate subscriber type
    if (!['User', 'Restaurant', 'Rider'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Invalid subscriber type" 
      });
    }

    // Get subscriber details
    let subscriberName, subscriberEmail;
    if (req.user.role === 'user') {
      const user = await User.findById(req.user.id);
      subscriberName = user.name;
      subscriberEmail = user.email;
    } else if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findById(req.user.id);
      subscriberName = restaurant.restaurantName;
      subscriberEmail = restaurant.email;
    } else if (req.user.role === 'rider') {
      const rider = await Rider.findById(req.user.id);
      subscriberName = rider.name;
      subscriberEmail = rider.email;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (planType) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(startDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({ message: "Invalid plan type" });
    }

    // Create subscription
    const subscription = new Subscription({
      subscriptionId: Subscription.generateSubscriptionId(),
      name,
      description,
      subscriberId: req.user.id,
      subscriberType: req.user.role === 'user' ? 'User' : 
                     req.user.role === 'restaurant' ? 'Restaurant' : 'Rider',
      subscriberName,
      subscriberEmail,
      planType,
      planName,
      price,
      currency: 'BDT',
      features: features || [],
      startDate,
      endDate,
      nextBillingDate: endDate,
      paymentMethod,
      autoRenew,
      nextPaymentAmount: price,
      status: 'pending',
      paymentStatus: 'pending',
      createdBy: req.user.role === 'admin' ? req.user.id : null,
    });

    await subscription.save();

    // Update user subscription info
    if (req.user.role === 'user') {
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.active': true,
        'subscription.planType': planType,
        'subscription.planName': planName,
        'subscription.startDate': startDate,
        'subscription.endDate': endDate,
        'subscription.autoRenew': autoRenew
      });
    }

    // Create notification
    await Notification.createNotification({
      recipientId: req.user.id,
      recipientType: req.user.role === 'user' ? 'User' : 
                    req.user.role === 'restaurant' ? 'Restaurant' : 'Rider',
      title: 'Subscription Created',
      message: `Your ${planName} subscription has been created successfully`,
      type: 'subscription',
      relatedEntity: {
        type: 'Subscription',
        id: subscription._id,
        name: name
      }
    });

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'user' ? 'User' : 
                req.user.role === 'restaurant' ? 'Restaurant' : 'Rider',
      userName: subscriberName,
      action: 'subscription_created',
      resource: {
        type: 'Subscription',
        id: subscription._id,
        name: name
      },
      details: {
        description: `Created ${planName} subscription for ${planType}`,
        metadata: {
          planType,
          planName,
          price,
          autoRenew
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("subscriptionUpdate", {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      subscriberId: subscription.subscriberId,
    });

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: {
        ...subscription.toObject(),
        price: `৳${price}`,
      },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ 
      message: "Failed to create subscription", 
      error: error.message 
    });
  }
});

// Get all subscriptions (with filters)
router.get("/", auth, async (req, res) => {
  try {
    const {
      status,
      planType,
      planName,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (planType) query.planType = planType;
    if (planName) query.planName = planName;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === 'user') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'restaurant') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'rider') {
      query.subscriberId = req.user.id;
    }
    // Admin can see all subscriptions

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('subscriberId', 'name restaurantName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Subscription.countDocuments(query)
    ]);

    res.json({
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ 
      message: "Failed to fetch subscriptions", 
      error: error.message 
    });
  }
});

// Get subscription by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('subscriberId', 'name restaurantName email phone')
      .populate('createdBy', 'name email');

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && subscription.subscriberId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ 
      message: "Failed to fetch subscription", 
      error: error.message 
    });
  }
});

// Update subscription status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.subscriberId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldStatus = subscription.status;
    subscription.status = status;

    if (notes) {
      subscription.adminNotes = notes;
    }

    // Handle status-specific logic
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;
    } else if (status === 'active') {
      subscription.paymentStatus = 'paid';
      subscription.lastPaymentDate = new Date();
    }

    await subscription.save();

    // Update user subscription status
    if (subscription.subscriberType === 'User') {
      await User.findByIdAndUpdate(subscription.subscriberId, {
        'subscription.active': status === 'active'
      });
    }

    // Create notification
    await Notification.createNotification({
      recipientId: subscription.subscriberId,
      recipientType: subscription.subscriberType,
      title: 'Subscription Status Updated',
      message: `Your subscription "${subscription.name}" status has been updated to ${status}`,
      type: 'subscription',
      relatedEntity: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      }
    });

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'admin' ? 'Admin' : subscription.subscriberType,
      userName: req.user.name || req.user.restaurantName,
      action: 'subscription_status_changed',
      resource: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      },
      details: {
        description: `Subscription status changed from ${oldStatus} to ${status}`,
        oldValue: oldStatus,
        newValue: status,
        metadata: { notes }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("subscriptionUpdate", {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      subscriberId: subscription.subscriberId,
    });

    res.json({ 
      message: "Subscription status updated successfully", 
      subscription 
    });
  } catch (error) {
    console.error("Error updating subscription status:", error);
    res.status(500).json({ 
      message: "Failed to update subscription status", 
      error: error.message 
    });
  }
});

// Cancel subscription
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.subscriberId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: "Subscription is already cancelled" });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason;
    subscription.autoRenew = false;

    await subscription.save();

    // Update user subscription status
    if (subscription.subscriberType === 'User') {
      await User.findByIdAndUpdate(subscription.subscriberId, {
        'subscription.active': false
      });
    }

    // Create notification
    await Notification.createNotification({
      recipientId: subscription.subscriberId,
      recipientType: subscription.subscriberType,
      title: 'Subscription Cancelled',
      message: `Your subscription "${subscription.name}" has been cancelled`,
      type: 'subscription',
      relatedEntity: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      }
    });

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'admin' ? 'Admin' : subscription.subscriberType,
      userName: req.user.name || req.user.restaurantName,
      action: 'subscription_cancelled',
      resource: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      },
      details: {
        description: `Subscription cancelled`,
        metadata: { reason }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("subscriptionUpdate", {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      subscriberId: subscription.subscriberId,
    });

    res.json({ 
      message: "Subscription cancelled successfully", 
      subscription 
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ 
      message: "Failed to cancel subscription", 
      error: error.message 
    });
  }
});

// Renew subscription
router.patch("/:id/renew", auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // Check permissions
    if (req.user.role !== 'admin' && subscription.subscriberId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (subscription.status === 'active') {
      return res.status(400).json({ message: "Subscription is already active" });
    }

    // Calculate new dates
    const startDate = new Date();
    const endDate = new Date();
    
    switch (subscription.planType) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(startDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1);
        break;
    }

    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.nextBillingDate = endDate;
    subscription.paymentStatus = 'paid';
    subscription.lastPaymentDate = new Date();
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;

    await subscription.save();

    // Update user subscription status
    if (subscription.subscriberType === 'User') {
      await User.findByIdAndUpdate(subscription.subscriberId, {
        'subscription.active': true,
        'subscription.startDate': startDate,
        'subscription.endDate': endDate
      });
    }

    // Create notification
    await Notification.createNotification({
      recipientId: subscription.subscriberId,
      recipientType: subscription.subscriberType,
      title: 'Subscription Renewed',
      message: `Your subscription "${subscription.name}" has been renewed successfully`,
      type: 'subscription',
      relatedEntity: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      }
    });

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'admin' ? 'Admin' : subscription.subscriberType,
      userName: req.user.name || req.user.restaurantName,
      action: 'subscription_renewed',
      resource: {
        type: 'Subscription',
        id: subscription._id,
        name: subscription.name
      },
      details: {
        description: `Subscription renewed`,
        metadata: {
          newStartDate: startDate,
          newEndDate: endDate
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("subscriptionUpdate", {
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      subscriberId: subscription.subscriberId,
    });

    res.json({ 
      message: "Subscription renewed successfully", 
      subscription 
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res.status(500).json({ 
      message: "Failed to renew subscription", 
      error: error.message 
    });
  }
});

// Get subscription plans
router.get("/plans/available", async (req, res) => {
  try {
    const plans = [
      {
        name: "Basic",
        description: "Essential features for individual users",
        price: 299,
        currency: "BDT",
        planTypes: [
          { type: "weekly", price: 99 },
          { type: "monthly", price: 299 },
          { type: "quarterly", price: 799 },
          { type: "yearly", price: 2999 }
        ],
        features: [
          "Basic order tracking",
          "Standard delivery",
          "Email notifications",
          "Basic loyalty points"
        ]
      },
      {
        name: "Premium",
        description: "Advanced features for power users",
        price: 599,
        currency: "BDT",
        planTypes: [
          { type: "weekly", price: 199 },
          { type: "monthly", price: 599 },
          { type: "quarterly", price: 1599 },
          { type: "yearly", price: 5999 }
        ],
        features: [
          "All Basic features",
          "Priority delivery",
          "Real-time tracking",
          "SMS notifications",
          "Premium loyalty points",
          "Exclusive discounts",
          "24/7 support"
        ]
      },
      {
        name: "Enterprise",
        description: "Complete solution for businesses",
        price: 1299,
        currency: "BDT",
        planTypes: [
          { type: "weekly", price: 399 },
          { type: "monthly", price: 1299 },
          { type: "quarterly", price: 3499 },
          { type: "yearly", price: 12999 }
        ],
        features: [
          "All Premium features",
          "Custom integrations",
          "Advanced analytics",
          "Dedicated support",
          "API access",
          "White-label options",
          "Bulk operations"
        ]
      }
    ];

    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ 
      message: "Failed to fetch subscription plans", 
      error: error.message 
    });
  }
});

// Get subscription statistics
router.get("/statistics/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiringSoon,
      totalRevenue,
      subscriptionsToday,
      subscriptionsThisMonth,
      subscriptionsByPlan,
      subscriptionsByStatus
    ] = await Promise.all([
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'cancelled' }),
      Subscription.countDocuments({
        status: 'active',
        endDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }
      }),
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      Subscription.countDocuments({ createdAt: { $gte: today } }),
      Subscription.countDocuments({ createdAt: { $gte: thisMonth } }),
      Subscription.aggregate([
        { $group: { _id: '$planName', count: { $sum: 1 } } }
      ]),
      Subscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiringSoon,
      totalRevenue: totalRevenue[0]?.total || 0,
      subscriptionsToday,
      subscriptionsThisMonth,
      subscriptionsByPlan,
      subscriptionsByStatus
    });
  } catch (error) {
    console.error("Error fetching subscription statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch statistics", 
      error: error.message 
    });
  }
});

export default router; 