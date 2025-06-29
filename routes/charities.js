import express from "express";
import Charity from "../models/Charity.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// Charity registration
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      organizationType,
      registrationNumber,
      address,
      coordinates,
      contactPerson,
      mission,
      description,
      operatingHours,
      capacity,
      foodPreferences,
      documents
    } = req.body;

    // Check if charity already exists
    const existingCharity = await Charity.findOne({ 
      $or: [{ email }, { registrationNumber }] 
    });
    
    if (existingCharity) {
      return res.status(400).json({ 
        message: "Charity with this email or registration number already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create charity
    const charity = new Charity({
      name,
      email,
      password: hashedPassword,
      phone,
      organizationType,
      registrationNumber,
      address,
      coordinates,
      contactPerson,
      mission,
      description,
      operatingHours,
      capacity,
      foodPreferences,
      documents,
      status: 'pending',
      verified: false
    });

    await charity.save();

    // Create activity log
    await ActivityLog.createLog({
      userId: charity._id,
      userType: 'Charity',
      userName: charity.name,
      action: 'charity_register',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" registered successfully`,
        metadata: {
          organizationType,
          registrationNumber
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: "Charity registered successfully. Please wait for admin verification.",
      charity: {
        id: charity._id,
        name: charity.name,
        email: charity.email,
        status: charity.status
      }
    });
  } catch (error) {
    console.error("Error registering charity:", error);
    res.status(500).json({ 
      message: "Failed to register charity", 
      error: error.message 
    });
  }
});

// Charity login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find charity
    const charity = await Charity.findOne({ email });
    if (!charity) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if charity is verified
    if (!charity.verified) {
      return res.status(401).json({ 
        message: "Account not verified. Please wait for admin approval." 
      });
    }

    // Check if charity is active
    if (charity.status !== 'active') {
      return res.status(401).json({ 
        message: "Account is not active. Please contact admin." 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, charity.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: charity._id, 
        role: 'charity',
        name: charity.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create activity log
    await ActivityLog.createLog({
      userId: charity._id,
      userType: 'Charity',
      userName: charity.name,
      action: 'charity_login',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" logged in successfully`
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: "Login successful",
      token,
      charity: {
        id: charity._id,
        name: charity.name,
        email: charity.email,
        status: charity.status,
        verified: charity.verified
      }
    });
  } catch (error) {
    console.error("Error logging in charity:", error);
    res.status(500).json({ 
      message: "Failed to login", 
      error: error.message 
    });
  }
});

// Get charity profile
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== 'charity') {
      return res.status(403).json({ message: "Access denied" });
    }

    const charity = await Charity.findById(req.user.id).select('-password');
    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    res.json(charity);
  } catch (error) {
    console.error("Error fetching charity profile:", error);
    res.status(500).json({ 
      message: "Failed to fetch profile", 
      error: error.message 
    });
  }
});

// Update charity profile
router.patch("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== 'charity') {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      phone,
      address,
      coordinates,
      contactPerson,
      mission,
      description,
      operatingHours,
      capacity,
      foodPreferences,
      settings
    } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (coordinates) updateData.coordinates = coordinates;
    if (contactPerson) updateData.contactPerson = contactPerson;
    if (mission) updateData.mission = mission;
    if (description) updateData.description = description;
    if (operatingHours) updateData.operatingHours = operatingHours;
    if (capacity) updateData.capacity = capacity;
    if (foodPreferences) updateData.foodPreferences = foodPreferences;
    if (settings) updateData.settings = settings;

    const charity = await Charity.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    // Create activity log
    await ActivityLog.createLog({
      userId: charity._id,
      userType: 'Charity',
      userName: charity.name,
      action: 'charity_profile_update',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" profile updated`
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: "Profile updated successfully",
      charity
    });
  } catch (error) {
    console.error("Error updating charity profile:", error);
    res.status(500).json({ 
      message: "Failed to update profile", 
      error: error.message 
    });
  }
});

// Change password
router.patch("/change-password", auth, async (req, res) => {
  try {
    if (req.user.role !== 'charity') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { currentPassword, newPassword } = req.body;

    const charity = await Charity.findById(req.user.id);
    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, charity.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    charity.password = hashedPassword;
    await charity.save();

    // Create activity log
    await ActivityLog.createLog({
      userId: charity._id,
      userType: 'Charity',
      userName: charity.name,
      action: 'charity_password_change',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" password changed`
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ 
      message: "Failed to change password", 
      error: error.message 
    });
  }
});

// Get all charities (Admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      status,
      verified,
      organizationType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (status) query.status = status;
    if (verified !== undefined) query.verified = verified === 'true';
    if (organizationType) query.organizationType = organizationType;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [charities, total] = await Promise.all([
      Charity.find(query)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Charity.countDocuments(query)
    ]);

    res.json({
      charities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching charities:", error);
    res.status(500).json({ 
      message: "Failed to fetch charities", 
      error: error.message 
    });
  }
});

// Get charity by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id).select('-password');
    
    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== charity._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(charity);
  } catch (error) {
    console.error("Error fetching charity:", error);
    res.status(500).json({ 
      message: "Failed to fetch charity", 
      error: error.message 
    });
  }
});

// Verify charity (Admin only)
router.patch("/:id/verify", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { verified, notes } = req.body;
    const charity = await Charity.findById(req.params.id);

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    charity.verified = verified;
    charity.verifiedAt = new Date();
    charity.verifiedBy = req.user.id;
    charity.status = verified ? 'active' : 'suspended';

    if (notes) {
      charity.adminNotes = notes;
    }

    await charity.save();

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: 'Admin',
      userName: req.user.name,
      action: 'charity_verification',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" ${verified ? 'verified' : 'unverified'}`,
        metadata: { notes }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: `Charity ${verified ? 'verified' : 'unverified'} successfully`,
      charity
    });
  } catch (error) {
    console.error("Error verifying charity:", error);
    res.status(500).json({ 
      message: "Failed to verify charity", 
      error: error.message 
    });
  }
});

// Update charity status (Admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, notes } = req.body;
    const charity = await Charity.findById(req.params.id);

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    const oldStatus = charity.status;
    charity.status = status;

    if (notes) {
      charity.adminNotes = notes;
    }

    await charity.save();

    // Create activity log
    await ActivityLog.createLog({
      userId: req.user.id,
      userType: 'Admin',
      userName: req.user.name,
      action: 'charity_status_change',
      resource: {
        type: 'Charity',
        id: charity._id,
        name: charity.name
      },
      details: {
        description: `Charity "${charity.name}" status changed from ${oldStatus} to ${status}`,
        oldValue: oldStatus,
        newValue: status,
        metadata: { notes }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: "Charity status updated successfully",
      charity
    });
  } catch (error) {
    console.error("Error updating charity status:", error);
    res.status(500).json({ 
      message: "Failed to update charity status", 
      error: error.message 
    });
  }
});

// Get charity statistics
router.get("/statistics/overview", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const [
      totalCharities,
      verifiedCharities,
      activeCharities,
      pendingCharities,
      charitiesByType,
      charitiesByStatus
    ] = await Promise.all([
      Charity.countDocuments(),
      Charity.countDocuments({ verified: true }),
      Charity.countDocuments({ status: 'active' }),
      Charity.countDocuments({ status: 'pending' }),
      Charity.aggregate([
        { $group: { _id: '$organizationType', count: { $sum: 1 } } }
      ]),
      Charity.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalCharities,
      verifiedCharities,
      activeCharities,
      pendingCharities,
      charitiesByType,
      charitiesByStatus
    });
  } catch (error) {
    console.error("Error fetching charity statistics:", error);
    res.status(500).json({ 
      message: "Failed to fetch charity statistics", 
      error: error.message 
    });
  }
});

export default router; 