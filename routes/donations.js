import express from "express";
import FoodDonation from "../models/FoodDonation.js";
import Charity from "../models/Charity.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Rider from "../models/Rider.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import auth from "../middleware/auth.js";
import { io } from "../socket.js";

const router = express.Router();

// Create a new food donation
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      charityId,
      items,
      donationDate,
      pickupDate,
      pickupTime,
      pickupAddress,
      coordinates,
      specialInstructions
    } = req.body;

    // Validate donation date (must be in the future)
    const donationDateObj = new Date(donationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (donationDateObj <= today) {
      return res.status(400).json({ 
        message: "Donation date must be in the future" 
      });
    }

    // Validate pickup date (must be in the future)
    const pickupDateObj = new Date(pickupDate);
    if (pickupDateObj <= today) {
      return res.status(400).json({ 
        message: "Pickup date must be in the future" 
      });
    }

    // Get charity details
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    if (charity.status !== 'active' || !charity.verified) {
      return res.status(400).json({ 
        message: "Charity is not active or verified" 
      });
    }

    // Get donor details
    let donorName, donorEmail, donorPhone;
    if (req.user.role === 'user') {
      const user = await User.findById(req.user.id);
      donorName = user.name;
      donorEmail = user.email;
      donorPhone = user.phone;
    } else if (req.user.role === 'restaurant') {
      const restaurant = await Restaurant.findById(req.user.id);
      donorName = restaurant.restaurantName;
      donorEmail = restaurant.email;
      donorPhone = restaurant.phone;
    } else {
      return res.status(403).json({ 
        message: "Only users and restaurants can create donations" 
      });
    }

    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create donation
    const donation = new FoodDonation({
      donationId: FoodDonation.generateDonationId(),
      title,
      description,
      donorId: req.user.id,
      donorType: req.user.role === 'user' ? 'User' : 'Restaurant',
      donorName,
      donorEmail,
      donorPhone,
      charityId,
      charityName: charity.name,
      items,
      totalValue,
      donationDate: donationDateObj,
      pickupDate: pickupDateObj,
      pickupTime,
      pickupAddress,
      coordinates,
      specialInstructions,
      trackingUpdates: [
        {
          status: "pending",
          message: "Donation created successfully",
          timestamp: new Date(),
        },
      ],
    });

    await donation.save();

    // Update donor statistics
    if (req.user.role === 'user') {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: {
          'statistics.totalDonations': 1,
          'statistics.totalDonationValue': totalValue
        },
        'statistics.lastDonationDate': new Date()
      });
    }

    // Create notification for charity
    await Notification.createNotification({
      recipientId: charityId,
      recipientType: 'Charity',
      title: 'New Food Donation Available',
      message: `A new donation "${title}" worth ৳${totalValue} is available for pickup on ${pickupDate}`,
      type: 'donation',
      priority: 'high',
      relatedEntity: {
        type: 'Donation',
        id: donation._id,
        name: title
      },
      action: {
        type: 'view',
        url: `/donations/${donation._id}`
      }
    });

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'user' ? 'User' : 'Restaurant',
      userName: donorName,
      action: 'donation_created',
      resource: {
        type: 'Donation',
        id: donation._id,
        name: title
      },
      details: {
        description: `Created food donation "${title}" worth ৳${totalValue}`,
        metadata: {
          charityName: charity.name,
          itemCount: items.length,
          pickupDate: pickupDate
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("donationUpdate", {
      donationId: donation.donationId,
      status: donation.status,
      charityId: donation.charityId,
      donorId: donation.donorId,
    });

    res.status(201).json({
      message: "Food donation created successfully",
      donation: {
        ...donation.toObject(),
        totalValue: `৳${totalValue}`,
      },
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({ 
      message: "Failed to create donation", 
      error: error.message 
    });
  }
});

// Get all donations (with filters)
router.get("/", auth, async (req, res) => {
  try {
    const {
      status,
      donorType,
      charityId,
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
    if (donorType) query.donorType = donorType;
    if (charityId) query.charityId = charityId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === 'user') {
      query.donorId = req.user.id;
    } else if (req.user.role === 'restaurant') {
      query.donorId = req.user.id;
    } else if (req.user.role === 'charity') {
      query.charityId = req.user.id;
    } else if (req.user.role === 'rider') {
      query.riderId = req.user.id;
    }
    // Admin can see all donations

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      FoodDonation.find(query)
        .populate('charityId', 'name organizationType')
        .populate('donorId', 'name restaurantName')
        .populate('riderId', 'name phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      FoodDonation.countDocuments(query)
    ]);

    res.json({
      donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ 
      message: "Failed to fetch donations", 
      error: error.message 
    });
  }
});

// Get donation by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const donation = await FoodDonation.findById(req.params.id)
      .populate('charityId', 'name organizationType address coordinates')
      .populate('donorId', 'name restaurantName email phone')
      .populate('riderId', 'name phone currentLocation');

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && 
        donation.donorId.toString() !== req.user.id && 
        donation.charityId.toString() !== req.user.id &&
        (!donation.riderId || donation.riderId.toString() !== req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(donation);
  } catch (error) {
    console.error("Error fetching donation:", error);
    res.status(500).json({ 
      message: "Failed to fetch donation", 
      error: error.message 
    });
  }
});

// Update donation status (Admin/Charity)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const donation = await FoodDonation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check permissions
    if (req.user.role === 'admin') {
      // Admin can update any donation
    } else if (req.user.role === 'charity' && donation.charityId.toString() === req.user.id) {
      // Charity can update their donations
    } else if (req.user.role === 'rider' && donation.riderId?.toString() === req.user.id) {
      // Rider can update assigned donations
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const oldStatus = donation.status;
    donation.status = status;

    // Update admin approval if admin is updating
    if (req.user.role === 'admin' && status === 'approved') {
      donation.adminApproval = {
        approved: true,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        notes: notes || ''
      };
    }

    // Add tracking update
    await donation.addTrackingUpdate(status, `Status updated to ${status}${notes ? `: ${notes}` : ''}`);

    await donation.save();

    // Create notifications
    const notificationData = {
      recipientId: donation.donorId,
      recipientType: donation.donorType,
      title: `Donation Status Updated`,
      message: `Your donation "${donation.title}" status has been updated to ${status}`,
      type: 'donation',
      relatedEntity: {
        type: 'Donation',
        id: donation._id,
        name: donation.title
      }
    };

    await Notification.createNotification(notificationData);

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'admin' ? 'Admin' : 
                req.user.role === 'charity' ? 'Charity' : 'Rider',
      userName: req.user.name || req.user.restaurantName,
      action: 'donation_status_changed',
      resource: {
        type: 'Donation',
        id: donation._id,
        name: donation.title
      },
      details: {
        description: `Donation status changed from ${oldStatus} to ${status}`,
        oldValue: oldStatus,
        newValue: status,
        metadata: { notes }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("donationUpdate", {
      donationId: donation.donationId,
      status: donation.status,
      charityId: donation.charityId,
      donorId: donation.donorId,
    });

    res.json({ 
      message: "Donation status updated successfully", 
      donation 
    });
  } catch (error) {
    console.error("Error updating donation status:", error);
    res.status(500).json({ 
      message: "Failed to update donation status", 
      error: error.message 
    });
  }
});

// Assign rider to donation
router.patch("/:id/assign-rider", auth, async (req, res) => {
  try {
    const { riderId } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'charity') {
      return res.status(403).json({ message: "Access denied" });
    }

    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check if charity has permission
    if (req.user.role === 'charity' && donation.charityId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (rider.status !== 'available') {
      return res.status(400).json({ message: "Rider is not available" });
    }

    donation.riderId = rider._id;
    donation.riderName = rider.name;
    donation.riderPhone = rider.phone;
    donation.status = 'delivery';

    await donation.addTrackingUpdate('delivery', `Assigned to rider ${rider.name}`);

    await donation.save();

    // Update rider status
    await Rider.findByIdAndUpdate(riderId, {
      status: 'busy',
      currentOrder: donation._id
    });

    // Create notifications
    await Promise.all([
      Notification.createNotification({
        recipientId: riderId,
        recipientType: 'Rider',
        title: 'New Donation Assignment',
        message: `You have been assigned to pickup donation "${donation.title}"`,
        type: 'donation',
        priority: 'high',
        relatedEntity: {
          type: 'Donation',
          id: donation._id,
          name: donation.title
        }
      }),
      Notification.createNotification({
        recipientId: donation.donorId,
        recipientType: donation.donorType,
        title: 'Rider Assigned',
        message: `A rider has been assigned to pickup your donation "${donation.title}"`,
        type: 'donation',
        relatedEntity: {
          type: 'Donation',
          id: donation._id,
          name: donation.title
        }
      })
    ]);

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: req.user.role === 'admin' ? 'Admin' : 'Charity',
      userName: req.user.name || req.user.restaurantName,
      action: 'donation_rider_assigned',
      resource: {
        type: 'Donation',
        id: donation._id,
        name: donation.title
      },
      details: {
        description: `Rider ${rider.name} assigned to donation`,
        metadata: {
          riderId: rider._id,
          riderName: rider.name
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Emit real-time update
    io.emit("donationUpdate", {
      donationId: donation.donationId,
      status: donation.status,
      riderId: donation.riderId,
      charityId: donation.charityId,
      donorId: donation.donorId,
    });

    res.json({ 
      message: "Rider assigned successfully", 
      donation 
    });
  } catch (error) {
    console.error("Error assigning rider:", error);
    res.status(500).json({ 
      message: "Failed to assign rider", 
      error: error.message 
    });
  }
});

// Get available charities for donations
router.get("/charities/available", async (req, res) => {
  try {
    const charities = await Charity.find({
      status: 'active',
      verified: true
    }).select('name organizationType address coordinates capacity foodPreferences');

    res.json(charities);
  } catch (error) {
    console.error("Error fetching charities:", error);
    res.status(500).json({ 
      message: "Failed to fetch charities", 
      error: error.message 
    });
  }
});

// Get donation statistics
router.get("/statistics/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalDonations,
      pendingDonations,
      approvedDonations,
      deliveredDonations,
      totalValue,
      donationsToday,
      donationsThisMonth,
      donationsByStatus,
      topDonors,
      topCharities
    ] = await Promise.all([
      FoodDonation.countDocuments(),
      FoodDonation.countDocuments({ status: 'pending' }),
      FoodDonation.countDocuments({ status: 'approved' }),
      FoodDonation.countDocuments({ status: 'completed' }),
      FoodDonation.aggregate([
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      FoodDonation.countDocuments({ createdAt: { $gte: today } }),
      FoodDonation.countDocuments({ createdAt: { $gte: thisMonth } }),
      FoodDonation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FoodDonation.aggregate([
        { $group: { _id: '$donorId', count: { $sum: 1 }, totalValue: { $sum: '$totalValue' } } },
        { $sort: { totalValue: -1 } },
        { $limit: 5 }
      ]),
      FoodDonation.aggregate([
        { $group: { _id: '$charityId', count: { $sum: 1 }, totalValue: { $sum: '$totalValue' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'charities', localField: '_id', foreignField: '_id', as: 'charity' } }
      ])
    ]);

    res.json({
      totalDonations,
      pendingDonations,
      approvedDonations,
      deliveredDonations,
      totalValue: totalValue[0]?.total || 0,
      donationsToday,
      donationsThisMonth,
      donationsByStatus,
      topDonors,
      topCharities
    });
  } catch (error) {
    console.error("Error fetching donation statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch statistics", 
      error: error.message 
    });
  }
});

export default router; 