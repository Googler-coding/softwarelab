import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orders.js";
import reservationRoutes from "./routes/reservations.js";
import riderRoutes from "./routes/riders.js";
import chatRoutes from "./routes/chat.js";
import restaurantRoutes from "./routes/restaurants.js";
import donationRoutes from "./routes/donations.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import notificationRoutes from "./routes/notifications.js";
import activityLogRoutes from "./routes/activity-logs.js";
import charityRoutes from "./routes/charities.js";
import jwt from "jsonwebtoken";
import net from "net";
import Restaurant from "./models/Restaurant.js";
import Order from "./models/Order.js";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";
import Rider from "./models/Rider.js";
import User from "./models/User.js";
import Chat from "./models/Chat.js";
import { initializeSocket } from "./socket.js";
import Table from "./models/Table.js";
import TableReservation from "./models/TableReservation.js";
import FoodDonation from "./models/FoodDonation.js";
import Charity from "./models/Charity.js";
import Subscription from "./models/Subscription.js";
import Notification from "./models/Notification.js";
import ActivityLog from "./models/ActivityLog.js";

dotenv.config();

const app = express();

// Middleware to enforce JSON content type
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body,
  });
  const originalSend = res.send;
  res.send = function (body) {
    console.log(
      `[${new Date().toISOString()}] Response for ${req.method} ${req.url}`,
      {
        status: res.statusCode,
        body: typeof body === "string" ? body : JSON.stringify(body),
      }
    );
    return originalSend.call(this, body);
  };
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/foodDeliveryApp";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Update existing restaurants with random coordinates
    updateExistingRestaurants();
    // Create default admin account
    createDefaultAdmin();
    // Sample orders are now created only through real user interactions
    console.log("✅ System ready for real data tracking");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  userId: { type: String, required: true },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.error("No token provided", {
      headers: req.headers,
      path: req.path,
    });
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined");
      return res.status(500).json({ message: "Server configuration error" });
    }
    console.log("Verifying token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    // Allow all authenticated users for general endpoints
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
      phone: decoded.phone,
    };
    next();
  } catch (error) {
    console.error("Token verification error:", {
      message: error.message,
      name: error.name,
      token,
    });
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired", details: error.message });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token", details: error.message });
    }
    res
      .status(401)
      .json({ message: "Authentication error", details: error.message });
  }
};

// Restaurant-specific middleware
const restaurantAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "restaurant") {
      return res.status(403).json({ message: "Restaurant access required" });
    }
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("Restaurant auth error:", error);
    res.status(401).json({ message: "Authentication error" });
  }
};

// Rider-specific middleware
const riderAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "rider") {
      return res.status(403).json({ message: "Rider access required" });
    }
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("Rider auth error:", error);
    res.status(401).json({ message: "Authentication error" });
  }
};

// User-specific middleware
const userAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return res.status(403).json({ message: "User access required" });
    }
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("User auth error:", error);
    res.status(401).json({ message: "Authentication error" });
  }
};

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/reservations", authMiddleware, reservationRoutes);
app.use("/api/riders", authMiddleware, riderRoutes);
app.use("/api/chat", chatRoutes);

// Public routes (no authentication required)
app.use("/api/charities", charityRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// New feature routes (with authentication)
app.use("/api/donations", authMiddleware, donationRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/activity-logs", authMiddleware, activityLogRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.get("/api/menu/:userId", restaurantAuthMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.user.id,
        paramUserId: req.params.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    const items = await MenuItem.find({ userId: req.params.userId });
    console.log("Fetched menu items:", items);
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch items", details: error.message });
  }
});

app.post("/api/menu", restaurantAuthMiddleware, async (req, res) => {
  try {
    const { name, price, userId } = req.body;
    console.log("Received POST payload:", { name, price, userId });
    if (!name || !price || !userId) {
      console.error("Missing required fields", { name, price, userId });
      return res
        .status(400)
        .json({ message: "Name, price, and userId are required" });
    }
    if (req.user.id !== userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.user.id,
        bodyUserId: userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (isNaN(price) || Number(price) <= 0) {
      console.error("Invalid price", { price });
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }
    const newItem = new MenuItem({ name, price: Number(price), userId });
    await newItem.save();
    console.log("Saved new menu item:", newItem);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error saving item:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/menu/:id", restaurantAuthMiddleware, async (req, res) => {
  try {
    const { name, price } = req.body;
    console.log("Received PUT payload:", { name, price, id: req.params.id });
    if (!name || !price) {
      console.error("Missing required fields", { name, price });
      return res.status(400).json({ message: "Name and price are required" });
    }
    if (isNaN(price) || Number(price) <= 0) {
      console.error("Invalid price", { price });
      return res
        .status(400)
        .json({ message: "Price must be a positive number" });
    }
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      console.error("Item not found", { id: req.params.id });
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.userId !== req.user.id) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.user.id,
        itemUserId: item.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price: Number(price) },
      { new: true }
    );
    console.log("Updated menu item:", updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/menu/:id", restaurantAuthMiddleware, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      console.error("Item not found", { id: req.params.id });
      return res.status(404).json({ message: "Item not found" });
    }
    if (item.userId !== req.user.id) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.user.id,
        itemUserId: item.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    await MenuItem.findByIdAndDelete(req.params.id);
    console.log("Deleted menu item:", { id: req.params.id });
    res.status(204).json({});
  } catch (error) {
    console.error("Error deleting item:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to delete item", details: error.message });
  }
});

app.get("/api/public/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "restaurantName lat lon _id");
    const restaurantsWithMenu = await Promise.all(
      restaurants.map(async (restaurant) => {
        const menu = await MenuItem.find({ userId: restaurant._id });
        return {
          ...restaurant._doc,
          name: restaurant.restaurantName || "",
          menu,
        };
      })
    );
    console.log("Fetched restaurants with menus:", restaurantsWithMenu);
    res.json(restaurantsWithMenu);
  } catch (error) {
    console.error("Error fetching restaurants:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch restaurants", details: error.message });
  }
});

app.get("/api/orders/:userId", restaurantAuthMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      console.error("Unauthorized: userId mismatch", {
        requestUserId: req.user.id,
        paramUserId: req.params.userId,
      });
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Find orders where the restaurantId matches the restaurant's _id
    const orders = await Order.find({ restaurantId: req.params.userId });
    console.log("Fetched orders for restaurant:", { restaurantId: req.params.userId, ordersCount: orders.length });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch orders", details: error.message });
  }
});

// Admin endpoint to get all orders
app.get("/api/admin/orders", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const orders = await Order.find()
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name email phone lat lon totalDeliveries totalEarnings")
      .sort({ createdAt: -1 }); // Most recent first
    
    console.log("Admin fetched all orders with full tracking:", {
      totalOrders: orders.length,
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      ordersWithRiders: orders.filter(o => o.riderId).length,
      ordersWithoutRiders: orders.filter(o => !o.riderId).length
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching all orders:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch orders", details: error.message });
  }
});

// Admin endpoint to get all reservations
app.get("/api/admin/reservations", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const TableReservation = mongoose.model("TableReservation");
    const reservations = await TableReservation.find()
      .populate("restaurantId", "restaurantName address")
      .populate("userId", "name email phone")
      .sort({ reservationDate: -1, reservationTime: -1 }); // Most recent first
    
    console.log("Admin fetched all reservations:", {
      totalReservations: reservations.length,
      reservationsByStatus: reservations.reduce((acc, reservation) => {
        acc[reservation.status] = (acc[reservation.status] || 0) + 1;
        return acc;
      }, {})
    });
    
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching all reservations:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch reservations", details: error.message });
  }
});

// Get available orders for riders
app.get("/api/rider/available-orders", riderAuthMiddleware, async (req, res) => {
  try {
    // Get orders that are ready for pickup (status: "ready")
    const orders = await Order.find({ 
      status: "ready",
      riderId: { $exists: false } // Not assigned to any rider yet
    }).populate("restaurantId", "restaurantName lat lon");
    
    console.log("Available orders for riders:", orders.length);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching available orders:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch available orders", details: error.message });
  }
});

// Rider accept order
app.post("/api/rider/accept-order/:orderId", riderAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.status !== "ready") {
      return res.status(400).json({ message: "Order is not ready for pickup" });
    }
    
    if (order.riderId) {
      return res.status(400).json({ message: "Order already assigned to another rider" });
    }
    
    // Get rider details for tracking
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }
    
    // Update order with rider assignment and status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        riderId: req.user.id,
        status: "assigned",
        assignedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("restaurantId", "restaurantName lat lon");
    
    // Update rider status to busy
    await Rider.findByIdAndUpdate(req.user.id, {
      status: "busy",
      currentOrder: orderId,
      updatedAt: new Date()
    });
    
    console.log("Rider accepted order with full tracking:", { 
      orderId, 
      riderId: req.user.id,
      riderName: rider.name,
      restaurantName: updatedOrder.restaurantId.restaurantName,
      customerName: updatedOrder.customerName,
      orderTotal: updatedOrder.total,
      assignedAt: updatedOrder.assignedAt,
      riderLocation: { lat: rider.lat, lon: rider.lon }
    });
    
    res.json({
      ...updatedOrder._doc,
      riderName: rider.name,
      riderPhone: rider.phone
    });
  } catch (error) {
    console.error("Error accepting order:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to accept order", details: error.message });
  }
});

// Update rider location
app.put("/api/rider/location", riderAuthMiddleware, async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    if (!lat || !lon) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    const updatedRider = await Rider.findByIdAndUpdate(
      req.user.id,
      { lat, lon },
      { new: true }
    );
    
    console.log("Updated rider location:", { riderId: req.user.id, lat, lon });
    res.json(updatedRider);
  } catch (error) {
    console.error("Error updating rider location:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to update location", details: error.message });
  }
});

// Update rider status (online/offline)
app.put("/api/rider/status", riderAuthMiddleware, async (req, res) => {
  try {
    const { status, isOnline } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isOnline === 'boolean') updateData.isOnline = isOnline;
    
    const updatedRider = await Rider.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );
    
    console.log("Updated rider status:", { riderId: req.user.id, status, isOnline });
    res.json(updatedRider);
  } catch (error) {
    console.error("Error updating rider status:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to update status", details: error.message });
  }
});

// Get rider's current order
app.get("/api/rider/current-order", riderAuthMiddleware, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id).populate({
      path: 'currentOrder',
      populate: {
        path: 'restaurantId',
        select: 'restaurantName lat lon'
      }
    });
    
    if (!rider.currentOrder) {
      return res.json({ currentOrder: null });
    }
    
    res.json({ currentOrder: rider.currentOrder });
  } catch (error) {
    console.error("Error fetching current order:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch current order", details: error.message });
  }
});

// Update order delivery status (picked up, delivered, etc.)
app.put("/api/rider/order-status/:orderId", riderAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.riderId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }
    
    // Get rider details for tracking
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }
    
    // Prepare update data with appropriate timestamps
    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    // Add specific timestamps based on status
    if (status === "picked_up") {
      updateData.pickedUpAt = new Date();
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date();
      updateData.actualDeliveryTime = new Date();
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate("restaurantId", "restaurantName lat lon");
    
    // If order is delivered, update rider stats and free up rider
    if (status === "delivered") {
      const deliveryFee = 50; // Fixed delivery fee
      await Rider.findByIdAndUpdate(req.user.id, {
        status: "available",
        currentOrder: null,
        $inc: { 
          totalDeliveries: 1,
          totalEarnings: deliveryFee
        },
        updatedAt: new Date()
      });
      
      console.log("Order delivered with full tracking:", {
        orderId,
        riderId: req.user.id,
        riderName: rider.name,
        restaurantName: updatedOrder.restaurantId.restaurantName,
        customerName: updatedOrder.customerName,
        orderTotal: updatedOrder.total,
        deliveryFee,
        deliveredAt: updatedOrder.deliveredAt,
        actualDeliveryTime: updatedOrder.actualDeliveryTime,
        estimatedDeliveryTime: updatedOrder.estimatedDeliveryTime,
        deliveryTimeDifference: updatedOrder.actualDeliveryTime - updatedOrder.estimatedDeliveryTime
      });
    } else {
      console.log("Order status updated with tracking:", {
        orderId,
        status,
        riderId: req.user.id,
        riderName: rider.name,
        restaurantName: updatedOrder.restaurantId.restaurantName,
        customerName: updatedOrder.customerName,
        updatedAt: updatedOrder.updatedAt
      });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order delivery status:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to update order status", details: error.message });
  }
});

// Get rider statistics
app.get("/api/rider/stats", riderAuthMiddleware, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's deliveries
    const todayDeliveries = await Order.countDocuments({
      riderId: req.user.id,
      status: "delivered",
      updatedAt: { $gte: today }
    });
    
    const stats = {
      totalDeliveries: rider.totalDeliveries,
      totalEarnings: rider.totalEarnings,
      todayDeliveries,
      todayEarnings: todayDeliveries * 50, // Fixed delivery fee
      rating: rider.rating,
      status: rider.status,
      isOnline: rider.isOnline
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching rider stats:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch stats", details: error.message });
  }
});

// Comprehensive system analytics for admin
app.get("/api/admin/analytics", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get comprehensive analytics
    const [
      totalOrders,
      totalRestaurants,
      totalRiders,
      totalUsers,
      ordersToday,
      ordersThisMonth,
      ordersByStatus,
      topRestaurants,
      topRiders,
      deliveryMetrics
    ] = await Promise.all([
      Order.countDocuments(),
      Restaurant.countDocuments(),
      Rider.countDocuments(),
      User.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $group: { _id: "$restaurantId", count: { $sum: 1 }, total: { $sum: "$total" } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "restaurants", localField: "_id", foreignField: "_id", as: "restaurant" } }
      ]),
      Order.aggregate([
        { $match: { riderId: { $exists: true } } },
        { $group: { _id: "$riderId", deliveries: { $sum: 1 }, earnings: { $sum: 50 } } },
        { $sort: { deliveries: -1 } },
        { $limit: 5 },
        { $lookup: { from: "riders", localField: "_id", foreignField: "_id", as: "rider" } }
      ]),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          avgDeliveryTime: { $avg: { $subtract: ["$actualDeliveryTime", "$assignedAt"] } },
          totalEarnings: { $sum: 50 }
        }}
      ])
    ]);
    
    const analytics = {
      overview: {
        totalOrders,
        totalRestaurants,
        totalRiders,
        totalUsers,
        ordersToday,
        ordersThisMonth
      },
      orderStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topRestaurants: topRestaurants.map(item => ({
        restaurantName: item.restaurant[0]?.restaurantName || "Unknown",
        orderCount: item.count,
        totalRevenue: item.total
      })),
      topRiders: topRiders.map(item => ({
        riderName: item.rider[0]?.name || "Unknown",
        deliveries: item.deliveries,
        earnings: item.earnings
      })),
      deliveryMetrics: deliveryMetrics[0] || {
        totalDeliveries: 0,
        avgDeliveryTime: 0,
        totalEarnings: 0
      }
    };
    
    console.log("Admin analytics generated:", {
      totalOrders,
      totalRestaurants,
      totalRiders,
      totalUsers,
      ordersToday,
      ordersThisMonth
    });
    
    res.json(analytics);
  } catch (error) {
    console.error("Error generating analytics:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to generate analytics", details: error.message });
  }
});

// Chat Routes
// Get or create chat for an order
app.get("/api/chat/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find existing chat
    let chat = await Chat.findOne({ orderId });
    
    if (!chat) {
      // Get order details to create chat
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Find the user who placed the order
      const user = await User.findOne({ email: order.customerEmail });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create new chat
      chat = new Chat({
        orderId,
        userId: user._id,
        riderId: order.riderId,
        messages: []
      });
      await chat.save();
    }
    
    res.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ message: "Failed to fetch chat", details: error.message });
  }
});

// Send message
app.post("/api/chat/message", authMiddleware, async (req, res) => {
  try {
    const { orderId, content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Find or create chat
    let chat = await Chat.findOne({ orderId });
    if (!chat) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Find the user who placed the order
      const user = await User.findOne({ email: order.customerEmail });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      chat = new Chat({
        orderId,
        userId: user._id,
        riderId: order.riderId,
        messages: []
      });
    }
    
    // Add message
    const message = {
      senderId: req.user.id,
      senderRole: req.user.role,
      content: content.trim(),
      timestamp: new Date(),
      isRead: false
    };
    
    chat.messages.push(message);
    chat.lastMessageAt = new Date();
    await chat.save();
    
    res.json({ message: "Message sent successfully", chat });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", details: error.message });
  }
});

// Get user's chats
app.get("/api/chat/user", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: "User access required" });
    }
    
    const chats = await Chat.find({ 
      userId: req.user.id,
      isActive: true 
    })
    .populate('riderId', 'name')
    .populate('orderId', 'customerName total status')
    .sort({ lastMessageAt: -1 });
    
    res.json(chats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ message: "Failed to fetch chats", details: error.message });
  }
});

// Get rider's chats
app.get("/api/chat/rider", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: "Rider access required" });
    }
    
    const chats = await Chat.find({ 
      riderId: req.user.id,
      isActive: true 
    })
    .populate('userId', 'name')
    .populate('orderId', 'customerName total status')
    .sort({ lastMessageAt: -1 });
    
    res.json(chats);
  } catch (error) {
    console.error("Error fetching rider chats:", error);
    res.status(500).json({ message: "Failed to fetch chats", details: error.message });
  }
});

// Mark messages as read
app.put("/api/chat/read/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const chat = await Chat.findOne({ orderId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Mark messages from other user as read
    chat.messages.forEach(message => {
      if (message.senderId.toString() !== req.user.id) {
        message.isRead = true;
      }
    });
    
    await chat.save();
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read", details: error.message });
  }
});

// Get order tracking information
app.get("/api/orders/:orderId/tracking", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name email phone lat lon totalDeliveries totalEarnings")
      .populate("userId", "name email phone");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user has access to this order
    if (req.user.role === 'user' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (req.user.role === 'restaurant' && order.restaurantId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (req.user.role === 'rider' && order.riderId && order.riderId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Calculate estimated delivery time if not set
    if (!order.estimatedDeliveryTime) {
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + order.estimatedPreparationTime + 30); // 30 min for delivery
      order.estimatedDeliveryTime = estimatedTime;
      await order.save();
    }
    
    console.log("Order tracking fetched:", {
      orderId,
      status: order.status,
      customerName: order.customerName,
      restaurantName: order.restaurantId.restaurantName,
      riderName: order.riderId?.name || 'Not assigned'
    });
    
    res.json({
      order,
      tracking: {
        currentStatus: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        actualDeliveryTime: order.actualDeliveryTime,
        preparationTime: order.actualPreparationTime || order.estimatedPreparationTime,
        trackingUpdates: order.trackingUpdates
      }
    });
  } catch (error) {
    console.error("Error fetching order tracking:", {
      message: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch order tracking", details: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global server error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

app.get("/debug/env", (req, res) => {
  res.json({ JWT_SECRET: process.env.JWT_SECRET });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// Get user's orders
app.get("/api/user/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name email phone")
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

// Restaurant Dashboard Routes
app.get("/api/restaurants/menu", restaurantAuthMiddleware, async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ userId: req.user.id });
    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    res.status(500).json({ message: "Error fetching menu items", error: error.message });
  }
});

app.get("/api/restaurants/tables", restaurantAuthMiddleware, async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.user.id });
    res.json(tables);
  } catch (error) {
    console.error("Error fetching restaurant tables:", error);
    res.status(500).json({ message: "Error fetching tables", error: error.message });
  }
});

app.get("/api/restaurants/orders", restaurantAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.id })
      .populate("riderId", "name email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

app.get("/api/restaurants/reservations", restaurantAuthMiddleware, async (req, res) => {
  try {
    const reservations = await TableReservation.find({ restaurantId: req.user.id })
      .populate("tableId", "tableName capacity location")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error("Error fetching restaurant reservations:", error);
    res.status(500).json({ message: "Error fetching reservations", error: error.message });
  }
});

// Table availability checking
app.get("/api/reservations/availability", async (req, res) => {
  try {
    const { restaurantId, date, time } = req.query;
    
    if (!restaurantId || !date || !time) {
      return res.status(400).json({ message: "Restaurant ID, date, and time are required" });
    }
    
    // Get all tables for the restaurant
    const tables = await Table.find({ restaurantId, isActive: true });
    
    // Get booked tables for this date and time
    const bookedReservations = await TableReservation.find({
      restaurantId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });
    
    const bookedTableIds = bookedReservations.map(reservation => reservation.tableId.toString());
    
    // Separate available and booked tables
    const availableTables = tables.filter(table => !bookedTableIds.includes(table._id.toString()));
    const bookedTables = tables.filter(table => bookedTableIds.includes(table._id.toString()));
    
    res.json({
      available: availableTables,
      booked: bookedTables,
      total: tables.length,
      availableCount: availableTables.length,
      bookedCount: bookedTables.length
    });
  } catch (error) {
    console.error("Error checking table availability:", error);
    res.status(500).json({ message: "Error checking availability", error: error.message });
  }
});

// Get tables for a specific restaurant (public route)
app.get("/api/public/restaurants/:id/tables", async (req, res) => {
  try {
    const { id } = req.params;
    const tables = await Table.find({ restaurantId: id, isActive: true });
    res.json(tables);
  } catch (error) {
    console.error("Error fetching restaurant tables:", error);
    res.status(500).json({ message: "Error fetching tables", error: error.message });
  }
});

// Update reservation status
app.patch("/api/reservations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const reservation = await TableReservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
});

// Error handling for invalid routes
app.use((req, res) => {
  console.error("404 Not Found", { method: req.method, url: req.url });
  res.status(404).json({ message: "Route not found" });
});

// Get menu for a specific restaurant (public route)
app.get("/api/restaurants/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await MenuItem.find({ userId: id });
    res.json(menu);
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    res.status(500).json({ message: "Error fetching menu", error: error.message });
  }
});

// Create new order
app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const {
      restaurantId,
      restaurantName,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      total,
      orderType,
      estimatedDeliveryTime,
      paymentMethod,
      specialInstructions
    } = req.body;

    // Generate unique order ID
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const order = new Order({
      orderId,
      restaurantId,
      restaurantName,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      total,
      orderType,
      estimatedDeliveryTime,
      paymentMethod,
      specialInstructions,
      userId: req.user.id,
      status: "pending",
      kitchenStatus: "pending"
    });

    await order.save();

    // Emit socket event for real-time updates
    io.emit('orderUpdate', {
      orderId: order._id,
      status: order.status,
      restaurantId: order.restaurantId,
      userId: order.userId
    });

    res.status(201).json({
      message: "Order created successfully",
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        total: order.total
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

// Check if port is in use
const checkPort = (port, callback) => {
  const server = net.createServer();
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
      callback(new Error(`Port ${port} is already in use`));
    } else {
      callback(err);
    }
  });
  server.once("listening", () => {
    server.close();
    callback(null);
  });
  server.listen(port);
};

checkPort(PORT, (err) => {
  if (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
  
  // Create HTTP server and initialize Socket.IO
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO initialized`);
    console.log(`🔗 API available at http://localhost:${PORT}`);
  });
  
  // Initialize Socket.IO and make it available to routes
  const io = initializeSocket(server);
  app.set('io', io);
});

// Generate random coordinates within Dhaka area
const generateRandomDhakaCoordinates = () => {
  // Dhaka area coordinates (roughly)
  const lat = 23.7 + Math.random() * 0.2; // Range: 23.7 to 23.9
  const lon = 90.3 + Math.random() * 0.3; // Range: 90.3 to 90.6
  return { lat, lon };
};

// Update existing restaurants with random coordinates
const updateExistingRestaurants = async () => {
  try {
    const restaurants = await Restaurant.find({});
    for (const restaurant of restaurants) {
      if (restaurant.lat === 23.8103 && restaurant.lon === 90.4125) {
        const { lat, lon } = generateRandomDhakaCoordinates();
        await Restaurant.findByIdAndUpdate(restaurant._id, { lat, lon });
        console.log(`Updated restaurant ${restaurant.restaurantName} with coordinates: ${lat}, ${lon}`);
      }
    }
  } catch (error) {
    console.error("Error updating existing restaurants:", error);
  }
};

// Create default admin account
const createDefaultAdmin = async () => {
  try {
    const defaultAdminEmail = "admin@fooddelivery.com";
    const defaultAdminPassword = "admin123";
    
    // Check if default admin already exists
    const existingAdmin = await Admin.findOne({ email: defaultAdminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
      const admin = new Admin({ 
        email: defaultAdminEmail, 
        password: hashedPassword 
      });
      await admin.save();
      console.log("✅ Default admin account created successfully!");
      console.log("📧 Email:", defaultAdminEmail);
      console.log("🔑 Password:", defaultAdminPassword);
      console.log("⚠️  Please change these credentials in production!");
    } else {
      console.log("✅ Default admin account already exists");
      console.log("📧 Email:", defaultAdminEmail);
      console.log("🔑 Password:", defaultAdminPassword);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};
