import express from "express";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Rider from "../models/Rider.js";
import User from "../models/User.js";
import TableReservation from "../models/TableReservation.js";
import auth from "../middleware/auth.js";
import { io } from "../socket.js";

const router = express.Router();

// Place a new order
router.post("/", auth, async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      total,
      orderType = "delivery",
      tableReservation,
      specialInstructions,
      paymentMethod = "cash",
    } = req.body;

    // Get user details
    const userName = req.user.name || "Customer";
    const userEmail = req.user.email || "customer@example.com";
    const userPhone = req.user.phone || "Phone not provided";

    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Handle table reservation for dine-in orders
    let reservationId = null;
    if (orderType === "dine-in" && tableReservation) {
      const reservation = new TableReservation({
        restaurantId,
        tableNumber: tableReservation.tableNumber,
        reservationDate: tableReservation.reservationDate,
        reservationTime: tableReservation.reservationTime,
        numberOfGuests: tableReservation.numberOfGuests,
        customerName: userName,
        customerEmail: userEmail,
        customerPhone: userPhone,
        userId: req.user.id,
        specialRequests: specialInstructions,
      });

      await reservation.save();
      reservationId = reservation._id;
    }

    // Calculate estimated preparation time
    const estimatedPreparationTime = restaurant.kitchenSettings.estimatedPreparationTime;
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + estimatedPreparationTime + 30); // +30 for delivery

    // Create order
    const order = new Order({
      orderId: Order.generateOrderId(),
      restaurantId,
      restaurantName: restaurant.restaurantName,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      customerAddress: req.body.customerAddress || "Delivery Address",
      items,
      total,
      orderType,
      estimatedPreparationTime,
      estimatedDeliveryTime,
      userId: req.user.id,
      userRole: req.user.role,
      paymentMethod,
      specialInstructions,
      tableReservation: orderType === "dine-in" ? tableReservation : null,
      trackingUpdates: [
        {
          status: "pending",
          message: "Order placed successfully",
          timestamp: new Date(),
        },
      ],
    });

    await order.save();

    // Auto-assign rider for delivery orders
    if (orderType === "delivery") {
      const availableRiders = await Rider.findAvailableRiders(
        restaurant.lat,
        restaurant.lon,
        restaurant.deliverySettings.maxDeliveryDistance
      );

      if (availableRiders.length > 0) {
        const rider = availableRiders[0];
        order.riderId = rider._id;
        order.riderName = rider.name;
        order.riderPhone = rider.phone;
        await order.save();

        // Update rider status
        await rider.assignOrder(order._id);

        // Add tracking update
        await order.addTrackingUpdate(
          "confirmed",
          `Order assigned to rider ${rider.name}`
        );
      }
    }

    // Emit real-time update
    io.emit("orderUpdate", {
      orderId: order.orderId,
      status: order.status,
      kitchenStatus: order.kitchenStatus,
      restaurantId: order.restaurantId,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order: {
        ...order.toObject(),
        estimatedPreparationTime: `${estimatedPreparationTime} minutes`,
        estimatedDeliveryTime: estimatedDeliveryTime.toLocaleString(),
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

// Get user's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name phone currentLocation");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Get user's orders (alternative route for backward compatibility)
router.get("/user/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name phone currentLocation");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Get restaurant's orders (for restaurant dashboard)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    if (req.user.role !== "restaurant" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find({ restaurantId: req.params.restaurantId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone")
      .populate("riderId", "name phone currentLocation");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Update order status (Restaurant)
router.put("/restaurant/:orderId/status", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Check if user is a restaurant
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ message: "Access denied. Restaurant role required." });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find order and check if it belongs to this restaurant
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to this restaurant using req.user.id (restaurant ID)
    if (order.restaurantId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Access denied. Order does not belong to this restaurant." });
    }

    // Update order status
    order.status = status;
    order.updatedAt = new Date();
    
    // Update preparation times
    if (status === 'preparing' && !order.preparationStartTime) {
      order.preparationStartTime = new Date();
    }
    
    if (status === 'ready' && order.preparationStartTime) {
      order.preparationEndTime = new Date();
      order.actualPreparationTime = Math.round(
        (order.preparationEndTime - order.preparationStartTime) / (1000 * 60)
      );
    }
    
    await order.save();

    // Add tracking update
    await order.addTrackingUpdate(status, `Order status updated to ${status}`);

    console.log(`Order ${orderId} status updated to: ${status}`);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit("orderUpdate", {
        orderId: order.orderId,
        status: order.status,
        restaurantId: order.restaurantId,
        userId: order.userId,
      });

      // Emit specific orderStatusUpdate event
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: order.status,
        restaurantId: order.restaurantId,
        userId: order.userId,
        timestamp: new Date(),
      });
    }

    res.json({ 
      message: "Order status updated successfully", 
      order 
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
});

// Update order status (kitchen updates)
router.patch("/:orderId/status", auth, async (req, res) => {
  try {
    const { status, kitchenStatus, message } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update status
    if (status) {
      order.status = status;
    }

    // Update kitchen status
    if (kitchenStatus) {
      order.kitchenStatus = kitchenStatus;
      
      // Update preparation times
      if (kitchenStatus === "preparing" && !order.preparationStartTime) {
        order.preparationStartTime = new Date();
      } else if (kitchenStatus === "ready" && !order.preparationEndTime) {
        order.preparationEndTime = new Date();
        order.calculatePreparationTime();
      }
    }

    // Add tracking update
    if (message) {
      await order.addTrackingUpdate(status || kitchenStatus, message);
    }

    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit("orderUpdate", {
        orderId: order.orderId,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        restaurantId: order.restaurantId,
        userId: order.userId,
      });

      // Emit specific orderStatusUpdate event
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: order.status,
        kitchenStatus: order.kitchenStatus,
        restaurantId: order.restaurantId,
        userId: order.userId,
        timestamp: new Date(),
      });
    }

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// Assign rider to order
router.patch("/:orderId/assign-rider", auth, async (req, res) => {
  try {
    const { riderId } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    order.riderId = rider._id;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.status = "confirmed";

    await order.save();
    await rider.assignOrder(order._id);

    // Add tracking update
    await order.addTrackingUpdate(
      "confirmed",
      `Order assigned to rider ${rider.name}`
    );

    // Emit real-time update
    io.emit("orderUpdate", {
      orderId: order.orderId,
      status: order.status,
      riderId: order.riderId,
      userId: order.userId,
    });

    res.json({ message: "Rider assigned successfully", order });
  } catch (error) {
    console.error("Error assigning rider:", error);
    res.status(500).json({ message: "Failed to assign rider" });
  }
});

// Update delivery status (rider updates)
router.patch("/:orderId/delivery-status", auth, async (req, res) => {
  try {
    const { status, message, location } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify rider
    if (order.riderId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    order.status = status;

    // Update delivery times
    if (status === "picked-up" && !order.deliveryStartTime) {
      order.deliveryStartTime = new Date();
    } else if (status === "delivered" && !order.actualDeliveryTime) {
      order.actualDeliveryTime = new Date();
      
      // Update rider stats
      const rider = await Rider.findById(order.riderId);
      if (rider) {
        const deliveryTime = Math.round(
          (order.actualDeliveryTime - order.deliveryStartTime) / (1000 * 60)
        );
        await rider.completeDelivery(deliveryTime);
      }
    }

    // Add tracking update
    await order.addTrackingUpdate(status, message, location);

    await order.save();

    // Emit real-time update
    io.emit("orderUpdate", {
      orderId: order.orderId,
      status: order.status,
      userId: order.userId,
      restaurantId: order.restaurantId,
    });

    res.json({ message: "Delivery status updated", order });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Failed to update delivery status" });
  }
});

// Get order tracking
router.get("/:orderId/tracking", auth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate("riderId", "name phone currentLocation");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify user has access to this order
    if (order.userId.toString() !== req.user.id && 
        order.restaurantId.toString() !== req.user.id &&
        req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      kitchenStatus: order.kitchenStatus,
      trackingUpdates: order.trackingUpdates,
      estimatedPreparationTime: order.estimatedPreparationTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      rider: order.riderId,
      preparationStartTime: order.preparationStartTime,
      preparationEndTime: order.preparationEndTime,
      actualPreparationTime: order.actualPreparationTime,
    });
  } catch (error) {
    console.error("Error fetching order tracking:", error);
    res.status(500).json({ message: "Failed to fetch order tracking" });
  }
});

// Cancel order
router.patch("/:orderId/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only allow cancellation if order is still pending or confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    order.status = "cancelled";
    order.cancellationReason = reason;

    // Add tracking update
    await order.addTrackingUpdate("cancelled", `Order cancelled: ${reason}`);

    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit("orderUpdate", {
        orderId: order.orderId,
        status: order.status,
        restaurantId: order.restaurantId,
        userId: order.userId,
      });

      // Emit specific orderStatusUpdate event
      io.emit("orderStatusUpdate", {
        orderId: order._id,
        status: order.status,
        restaurantId: order.restaurantId,
        userId: order.userId,
        timestamp: new Date(),
      });

      // Notify restaurant specifically
      io.to(`restaurant_${order.restaurantId}`).emit('orderUpdate', {
        orderId: order.orderId,
        status: order.status,
        message: 'Order cancelled by customer'
      });

      // Notify user specifically
      io.to(`user_${order.userId}`).emit('orderUpdate', {
        orderId: order.orderId,
        status: order.status,
        message: 'Your order has been cancelled'
      });
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  }
});

// Get order tracking details for a specific order
router.get("/tracking/:orderId", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("restaurantId", "restaurantName lat lon")
      .populate("riderId", "name email phone lat lon");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has permission to view this order
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow access if user is the customer, restaurant owner, or admin
    const isCustomer = order.customerEmail === user.email;
    const isRestaurantOwner = order.restaurantId && order.restaurantId._id.toString() === user.restaurantId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRestaurantOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Format the order data for tracking
    const trackingData = {
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        orderType: order.orderType,
        total: order.total,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        items: order.items,
        specialInstructions: order.specialInstructions,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        restaurantName: order.restaurantId?.restaurantName || "Unknown Restaurant",
        riderName: order.riderId?.name || null,
        riderPhone: order.riderId?.phone || null,
        trackingUpdates: order.trackingUpdates || [],
        kitchenStatus: order.kitchenStatus || "pending"
      }
    };

    res.json(trackingData);
  } catch (error) {
    console.error("Error fetching order tracking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router; 