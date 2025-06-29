import express from "express";
import Rider from "../models/Rider.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all available riders
router.get("/available", auth, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const availableRiders = await Rider.findAvailableRiders(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(maxDistance)
    );

    res.json(availableRiders);
  } catch (error) {
    console.error("Error fetching available riders:", error);
    res.status(500).json({ message: "Failed to fetch available riders" });
  }
});

// Update rider location
router.patch("/location", auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    await rider.updateLocation(parseFloat(lat), parseFloat(lng));

    res.json({ message: "Location updated successfully", rider });
  } catch (error) {
    console.error("Error updating rider location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
});

// Update rider status
router.patch("/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    await rider.updateStatus(status);

    res.json({ message: "Status updated successfully", rider });
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// Get rider's active order
router.get("/active-order", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (!rider.activeOrderId) {
      return res.json({ message: "No active order", order: null });
    }

    const order = await Order.findById(rider.activeOrderId)
      .populate("restaurantId", "restaurantName lat lon address")
      .populate("userId", "name phone");

    if (!order) {
      return res.status(404).json({ message: "Active order not found" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Error fetching active order:", error);
    res.status(500).json({ message: "Failed to fetch active order" });
  }
});

// Get rider's delivery history
router.get("/delivery-history", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    const orders = await Order.find({ 
      riderId: req.user.id,
      status: { $in: ["delivered", "cancelled"] }
    })
      .populate("restaurantId", "restaurantName")
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(orders);
  } catch (error) {
    console.error("Error fetching delivery history:", error);
    res.status(500).json({ message: "Failed to fetch delivery history" });
  }
});

// Get rider's earnings and stats
router.get("/stats", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Calculate weekly and monthly earnings
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyOrders = await Order.find({
      riderId: req.user.id,
      status: "delivered",
      createdAt: { $gte: weekStart }
    });

    const monthlyOrders = await Order.find({
      riderId: req.user.id,
      status: "delivered",
      createdAt: { $gte: monthStart }
    });

    const weeklyEarnings = weeklyOrders.reduce((sum, order) => sum + (order.total * 0.1), 0); // 10% commission
    const monthlyEarnings = monthlyOrders.reduce((sum, order) => sum + (order.total * 0.1), 0);

    // Update rider earnings
    rider.earnings.thisWeek = weeklyEarnings;
    rider.earnings.thisMonth = monthlyEarnings;
    await rider.save();

    res.json({
      rider: {
        name: rider.name,
        status: rider.status,
        rating: rider.rating,
        deliveryStats: rider.deliveryStats,
        earnings: rider.earnings,
        currentLocation: rider.currentLocation,
      },
      weeklyOrders: weeklyOrders.length,
      monthlyOrders: monthlyOrders.length,
    });
  } catch (error) {
    console.error("Error fetching rider stats:", error);
    res.status(500).json({ message: "Failed to fetch rider stats" });
  }
});

// Get available orders for rider
router.get("/available-orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "rider") {
      return res.status(403).json({ message: "Rider access required" });
    }

    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Find orders that are pending and within rider's delivery range
    const availableOrders = await Order.find({
      status: "pending",
      orderType: "delivery",
      riderId: null
    })
      .populate("restaurantId", "restaurantName lat lon address")
      .populate("userId", "name phone");

    res.json(availableOrders);
  } catch (error) {
    console.error("Error fetching available orders:", error);
    res.status(500).json({ message: "Failed to fetch available orders" });
  }
});

// Get rider's current order
router.get("/current-order", auth, async (req, res) => {
  try {
    if (req.user.role !== "rider") {
      return res.status(403).json({ message: "Rider access required" });
    }

    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (!rider.activeOrderId) {
      return res.json({ order: null });
    }

    const order = await Order.findById(rider.activeOrderId)
      .populate("restaurantId", "restaurantName lat lon address")
      .populate("userId", "name phone");

    res.json({ order });
  } catch (error) {
    console.error("Error fetching current order:", error);
    res.status(500).json({ message: "Failed to fetch current order" });
  }
});

// Accept an order
router.post("/accept-order/:orderId", auth, async (req, res) => {
  try {
    if (req.user.role !== "rider") {
      return res.status(403).json({ message: "Rider access required" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending" || order.riderId) {
      return res.status(400).json({ message: "Order is not available" });
    }

    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Assign order to rider
    order.riderId = rider._id;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.status = "confirmed";
    await order.save();

    // Update rider
    rider.activeOrderId = order._id;
    rider.status = "busy";
    await rider.save();

    res.json({ message: "Order accepted successfully", order });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ message: "Failed to accept order" });
  }
});

// Update order status (for rider)
router.post("/order-status/:orderId", auth, async (req, res) => {
  try {
    if (req.user.role !== "rider") {
      return res.status(403).json({ message: "Rider access required" });
    }

    const { status, message } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.riderId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    order.status = status;
    await order.addTrackingUpdate(status, message);
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// Update rider preferences
router.patch("/preferences", auth, async (req, res) => {
  try {
    const { maxDeliveryDistance, preferredAreas, autoAcceptOrders } = req.body;
    
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (maxDeliveryDistance !== undefined) {
      rider.preferences.maxDeliveryDistance = maxDeliveryDistance;
    }

    if (preferredAreas !== undefined) {
      rider.preferences.preferredAreas = preferredAreas;
    }

    if (autoAcceptOrders !== undefined) {
      rider.preferences.autoAcceptOrders = autoAcceptOrders;
    }

    await rider.save();

    res.json({ message: "Preferences updated successfully", rider });
  } catch (error) {
    console.error("Error updating rider preferences:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

// Update working hours
router.patch("/working-hours", auth, async (req, res) => {
  try {
    const { startTime, endTime, isWorking } = req.body;
    
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (startTime !== undefined) {
      rider.workingHours.startTime = startTime;
    }

    if (endTime !== undefined) {
      rider.workingHours.endTime = endTime;
    }

    if (isWorking !== undefined) {
      rider.workingHours.isWorking = isWorking;
    }

    await rider.save();

    res.json({ message: "Working hours updated successfully", rider });
  } catch (error) {
    console.error("Error updating working hours:", error);
    res.status(500).json({ message: "Failed to update working hours" });
  }
});

// Get all riders (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const riders = await Rider.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(riders);
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({ message: "Failed to fetch riders" });
  }
});

// Get rider by ID (admin only)
router.get("/:riderId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const rider = await Rider.findById(req.params.riderId)
      .select("-password");

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    res.json(rider);
  } catch (error) {
    console.error("Error fetching rider:", error);
    res.status(500).json({ message: "Failed to fetch rider" });
  }
});

// Update rider verification status (admin only)
router.patch("/:riderId/verify", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { isVerified } = req.body;
    
    const rider = await Rider.findById(req.params.riderId);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.documents.isVerified = isVerified;
    await rider.save();

    res.json({ message: "Rider verification status updated", rider });
  } catch (error) {
    console.error("Error updating rider verification:", error);
    res.status(500).json({ message: "Failed to update verification status" });
  }
});

export default router; 