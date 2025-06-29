import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import { io } from "../socket.js";

const router = express.Router();

// Get user notifications
router.get("/", auth, async (req, res) => {
  try {
    const {
      type,
      read,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      recipientId: req.user.id,
      recipientType: req.user.role === 'user' ? 'User' : 
                    req.user.role === 'restaurant' ? 'Restaurant' : 
                    req.user.role === 'rider' ? 'Rider' : 
                    req.user.role === 'admin' ? 'Admin' : 'Charity'
    };

    // Apply filters
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('relatedEntity.id')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications", 
      error: error.message 
    });
  }
});

// Get unread notifications count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.id,
      recipientType: req.user.role === 'user' ? 'User' : 
                    req.user.role === 'restaurant' ? 'Restaurant' : 
                    req.user.role === 'rider' ? 'Rider' : 
                    req.user.role === 'admin' ? 'Admin' : 'Charity',
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      message: "Failed to fetch unread count", 
      error: error.message 
    });
  }
});

// Mark notification as read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await notification.markAsRead();

    // Emit real-time update
    io.emit("notificationRead", {
      notificationId: notification._id,
      recipientId: notification.recipientId,
    });

    res.json({ 
      message: "Notification marked as read", 
      notification 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      message: "Failed to mark notification as read", 
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    // Emit real-time update
    io.emit("allNotificationsRead", {
      recipientId: req.user.id,
    });

    res.json({ 
      message: "All notifications marked as read" 
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ 
      message: "Failed to mark all notifications as read", 
      error: error.message 
    });
  }
});

// Delete notification
router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    // Emit real-time update
    io.emit("notificationDeleted", {
      notificationId: notification._id,
      recipientId: notification.recipientId,
    });

    res.json({ 
      message: "Notification deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      message: "Failed to delete notification", 
      error: error.message 
    });
  }
});

// Get notifications by type
router.get("/type/:type", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { type } = req.params;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.getNotificationsByType(req.user.id, type, parseInt(limit)),
      Notification.countDocuments({
        recipientId: req.user.id,
        recipientType: req.user.role === 'user' ? 'User' : 
                      req.user.role === 'restaurant' ? 'Restaurant' : 
                      req.user.role === 'rider' ? 'Rider' : 
                      req.user.role === 'admin' ? 'Admin' : 'Charity',
        type
      })
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching notifications by type:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications by type", 
      error: error.message 
    });
  }
});

// Create notification (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      recipientId,
      recipientType,
      title,
      message,
      type = 'info',
      priority = 'medium',
      relatedEntity,
      action,
      channels,
      scheduledFor
    } = req.body;

    const notification = await Notification.createNotification({
      recipientId,
      recipientType,
      title,
      message,
      type,
      priority,
      relatedEntity,
      action,
      channels,
      scheduledFor
    });

    // Emit real-time notification
    io.emit("newNotification", {
      notificationId: notification._id,
      recipientId: notification.recipientId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ 
      message: "Failed to create notification", 
      error: error.message 
    });
  }
});

// Bulk create notifications (Admin only)
router.post("/bulk", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { notifications } = req.body;

    if (!Array.isArray(notifications)) {
      return res.status(400).json({ message: "Notifications must be an array" });
    }

    const createdNotifications = [];

    for (const notificationData of notifications) {
      try {
        const notification = await Notification.createNotification(notificationData);
        createdNotifications.push(notification);

        // Emit real-time notification
        io.emit("newNotification", {
          notificationId: notification._id,
          recipientId: notification.recipientId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority
        });
      } catch (error) {
        console.error("Error creating individual notification:", error);
      }
    }

    res.status(201).json({
      message: `${createdNotifications.length} notifications created successfully`,
      notifications: createdNotifications
    });
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    res.status(500).json({ 
      message: "Failed to create bulk notifications", 
      error: error.message 
    });
  }
});

// Get notification statistics (Admin only)
router.get("/statistics", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalNotifications,
      unreadNotifications,
      notificationsToday,
      notificationsThisMonth,
      notificationsByType,
      notificationsByPriority,
      deliveryStats
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ read: false }),
      Notification.countDocuments({ createdAt: { $gte: today } }),
      Notification.countDocuments({ createdAt: { $gte: thisMonth } }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Notification.aggregate([
        {
          $group: {
            _id: null,
            emailSent: { $sum: { $cond: ['$channels.email.sent', 1, 0] } },
            smsSent: { $sum: { $cond: ['$channels.sms.sent', 1, 0] } },
            pushSent: { $sum: { $cond: ['$channels.push.sent', 1, 0] } },
            inAppSent: { $sum: { $cond: ['$channels.inApp.sent', 1, 0] } }
          }
        }
      ])
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      notificationsToday,
      notificationsThisMonth,
      notificationsByType,
      notificationsByPriority,
      deliveryStats: deliveryStats[0] || {
        emailSent: 0,
        smsSent: 0,
        pushSent: 0,
        inAppSent: 0
      }
    });
  } catch (error) {
    console.error("Error fetching notification statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch notification statistics", 
      error: error.message 
    });
  }
});

// Clean old notifications (Admin only)
router.delete("/cleanup", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { days = 30 } = req.query;
    const result = await Notification.deleteOldNotifications(parseInt(days));

    res.json({
      message: `Cleaned up notifications older than ${days} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    res.status(500).json({ 
      message: "Failed to clean up notifications", 
      error: error.message 
    });
  }
});

export default router; 