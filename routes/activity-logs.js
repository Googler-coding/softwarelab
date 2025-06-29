import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get activity logs (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      userId,
      userType,
      action,
      resourceType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (userId) query.userId = userId;
    if (userType) query.userType = userType;
    if (action) query.action = action;
    if (resourceType) query['resource.type'] = resourceType;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name restaurantName email')
        .populate('resource.id')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ 
      message: "Failed to fetch activity logs", 
      error: error.message 
    });
  }
});

// Get user activity logs
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.getUserActivity(userId, parseInt(limit), skip),
      ActivityLog.countDocuments({ userId })
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    res.status(500).json({ 
      message: "Failed to fetch user activity logs", 
      error: error.message 
    });
  }
});

// Get activity logs by action
router.get("/action/:action", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { action } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.getActivityByAction(action, parseInt(limit), skip),
      ActivityLog.countDocuments({ action })
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs by action:", error);
    res.status(500).json({ 
      message: "Failed to fetch activity logs by action", 
      error: error.message 
    });
  }
});

// Get activity logs by resource
router.get("/resource/:type/:id", auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check permissions for non-admin users
    if (req.user.role !== 'admin') {
      // Users can only see logs related to their own resources
      if (type === 'User' && id !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (type === 'Restaurant' && id !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (type === 'Rider' && id !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.getActivityByResource(type, id, parseInt(limit)),
      ActivityLog.countDocuments({
        'resource.type': type,
        'resource.id': id
      })
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs by resource:", error);
    res.status(500).json({ 
      message: "Failed to fetch activity logs by resource", 
      error: error.message 
    });
  }
});

// Get suspicious activities (Admin only)
router.get("/suspicious", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.getSuspiciousActivities(parseInt(limit)),
      ActivityLog.countDocuments({
        $or: [
          { 'security.isSuspicious': true },
          { 'security.riskLevel': { $in: ['high', 'critical'] } },
          { status: 'failed' },
        ],
      })
    ]);

    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching suspicious activities:", error);
    res.status(500).json({ 
      message: "Failed to fetch suspicious activities", 
      error: error.message 
    });
  }
});

// Get activity statistics (Admin only)
router.get("/statistics", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const statistics = await ActivityLog.getActivityStatistics(start, end);

    res.json(statistics);
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch activity statistics", 
      error: error.message 
    });
  }
});

// Mark activity as suspicious (Admin only)
router.patch("/:id/mark-suspicious", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { reason } = req.body;
    const log = await ActivityLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Activity log not found" });
    }

    await log.markAsSuspicious(reason);

    res.json({ 
      message: "Activity marked as suspicious", 
      log 
    });
  } catch (error) {
    console.error("Error marking activity as suspicious:", error);
    res.status(500).json({ 
      message: "Failed to mark activity as suspicious", 
      error: error.message 
    });
  }
});

// Clean old activity logs (Admin only)
router.delete("/cleanup", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { days = 90 } = req.query;
    const result = await ActivityLog.cleanOldLogs(parseInt(days));

    res.json({
      message: `Cleaned up activity logs older than ${days} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error cleaning up activity logs:", error);
    res.status(500).json({ 
      message: "Failed to clean up activity logs", 
      error: error.message 
    });
  }
});

// Export activity logs (Admin only)
router.get("/export", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const query = {};
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name restaurantName email')
      .populate('resource.id')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Timestamp',
        'User ID',
        'User Type',
        'User Name',
        'Action',
        'Resource Type',
        'Resource ID',
        'Status',
        'IP Address',
        'Description'
      ];

      const csvData = logs.map(log => [
        log.createdAt,
        log.userId?._id || log.userId,
        log.userType,
        log.userName,
        log.action,
        log.resource?.type || '',
        log.resource?.id || '',
        log.status,
        log.ipAddress || '',
        log.details?.description || ''
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.json`);
      res.json(logs);
    }
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    res.status(500).json({ 
      message: "Failed to export activity logs", 
      error: error.message 
    });
  }
});

export default router; 