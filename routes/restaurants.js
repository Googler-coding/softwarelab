import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Restaurant from '../models/Restaurant.js';
import Menu from '../models/Menu.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import TableReservation from '../models/TableReservation.js';

const router = express.Router();

// Middleware to verify restaurant token
const verifyRestaurantToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied. Restaurant role required.' });
    }

    const restaurant = await Restaurant.findById(decoded.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    req.restaurant = restaurant;
    req.restaurantId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Menu Management Routes
// GET /api/restaurants/menu - Get restaurant's menu
router.get('/menu', verifyRestaurantToken, async (req, res) => {
  try {
    const menuItems = await Menu.find({ restaurantId: req.restaurantId });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// POST /api/restaurants/menu - Add new menu item
router.post('/menu', verifyRestaurantToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const menuItem = new Menu({
      name,
      price: parseFloat(price),
      restaurantId: req.restaurantId
    });

    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating menu item', error: error.message });
  }
});

// PUT /api/restaurants/menu/:id - Update menu item
router.put('/menu/:id', verifyRestaurantToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    const menuId = req.params.id;

    const menuItem = await Menu.findOne({ _id: menuId, restaurantId: req.restaurantId });
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.name = name || menuItem.name;
    menuItem.price = price ? parseFloat(price) : menuItem.price;

    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu item', error: error.message });
  }
});

// DELETE /api/restaurants/menu/:id - Delete menu item
router.delete('/menu/:id', verifyRestaurantToken, async (req, res) => {
  try {
    const menuId = req.params.id;
    const menuItem = await Menu.findOneAndDelete({ _id: menuId, restaurantId: req.restaurantId });
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error: error.message });
  }
});

// GET /api/restaurants/:id/menu - Get specific restaurant's menu (public route)
router.get('/:id/menu', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const menuItems = await Menu.find({ restaurantId });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error: error.message });
  }
});

// Table Management Routes
// GET /api/restaurants/tables - Get restaurant's tables
router.get('/tables', verifyRestaurantToken, async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.restaurantId });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tables', error: error.message });
  }
});

// POST /api/restaurants/tables - Add new table
router.post('/tables', verifyRestaurantToken, async (req, res) => {
  try {
    const { tableName, capacity, location, isAvailable = true } = req.body;
    
    if (!tableName || !capacity || !location) {
      return res.status(400).json({ message: 'Table name, capacity, and location are required' });
    }

    const table = new Table({
      tableName,
      capacity: parseInt(capacity),
      location,
      isAvailable,
      restaurantId: req.restaurantId
    });

    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error creating table', error: error.message });
  }
});

// PUT /api/restaurants/tables/:id - Update table
router.put('/tables/:id', verifyRestaurantToken, async (req, res) => {
  try {
    const { tableName, capacity, location, isAvailable } = req.body;
    const tableId = req.params.id;

    const table = await Table.findOne({ _id: tableId, restaurantId: req.restaurantId });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.tableName = tableName || table.tableName;
    table.capacity = capacity ? parseInt(capacity) : table.capacity;
    table.location = location || table.location;
    if (isAvailable !== undefined) table.isAvailable = isAvailable;

    await table.save();
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: 'Error updating table', error: error.message });
  }
});

// DELETE /api/restaurants/tables/:id - Delete table
router.delete('/tables/:id', verifyRestaurantToken, async (req, res) => {
  try {
    const tableId = req.params.id;
    const table = await Table.findOneAndDelete({ _id: tableId, restaurantId: req.restaurantId });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting table', error: error.message });
  }
});

// Orders Routes
// GET /api/restaurants/orders - Get restaurant's orders
router.get('/orders', verifyRestaurantToken, async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.restaurantId })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    // Transform orders to include customer name
    const transformedOrders = orders.map(order => ({
      ...order.toObject(),
      customerName: order.userId?.name || 'Unknown Customer'
    }));

    res.json(transformedOrders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// PUT /api/restaurants/orders/:orderId/status - Update order status (restaurant specific)
router.put('/orders/:orderId/status', verifyRestaurantToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`Restaurant ${req.restaurantId} updating order ${orderId} to status: ${status}`);
    
    // Find order that belongs to this restaurant
    const order = await Order.findOne({ 
      _id: orderId, 
      restaurantId: req.restaurantId 
    });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found or doesn't belong to this restaurant" });
    }
    
    // Validate status for restaurant
    const validRestaurantStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validRestaurantStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status for restaurant" });
    }
    
    order.status = status;
    
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
    await order.addTrackingUpdate(status, `Order status updated to ${status} by restaurant`);
    
    console.log(`Order ${orderId} status updated to ${status} successfully`);
    
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
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        customerName: order.customerName,
        total: order.total,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status", error: error.message });
  }
});

// Reservations Routes
// GET /api/restaurants/reservations - Get restaurant's reservations
router.get('/reservations', verifyRestaurantToken, async (req, res) => {
  try {
    const reservations = await TableReservation.find({ restaurantId: req.restaurantId })
      .populate('userId', 'name email phone')
      .populate('tableId', 'tableName')
      .sort({ reservationDate: 1, reservationTime: 1 });
    
    // Transform reservations to include customer name and table name
    const transformedReservations = reservations.map(reservation => ({
      ...reservation.toObject(),
      customerName: reservation.userId?.name || 'Unknown Customer',
      tableName: reservation.tableId?.tableName || 'Unknown Table'
    }));

    res.json(transformedReservations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations', error: error.message });
  }
});

// Restaurant Profile Routes
// GET /api/restaurants/profile - Get restaurant profile
router.get('/profile', verifyRestaurantToken, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId).select('-password');
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// PUT /api/restaurants/profile - Update restaurant profile
router.put('/profile', verifyRestaurantToken, async (req, res) => {
  try {
    const { name, email, phone, address, cuisine, description, openingHours, deliveryRadius } = req.body;
    
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Update fields if provided
    if (name) restaurant.name = name;
    if (email) restaurant.email = email;
    if (phone) restaurant.phone = phone;
    if (address) restaurant.address = address;
    if (cuisine) restaurant.cuisine = cuisine;
    if (description) restaurant.description = description;
    if (openingHours) restaurant.openingHours = openingHours;
    if (deliveryRadius) restaurant.deliveryRadius = deliveryRadius;

    await restaurant.save();
    
    const { password, ...restaurantWithoutPassword } = restaurant.toObject();
    res.json(restaurantWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Restaurant Statistics
// GET /api/restaurants/stats - Get restaurant statistics
router.get('/stats', verifyRestaurantToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders
    const todayOrders = await Order.find({
      restaurantId: req.restaurantId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Total orders
    const totalOrders = await Order.countDocuments({ restaurantId: req.restaurantId });

    // Total revenue
    const revenueResult = await Order.aggregate([
      { $match: { restaurantId: req.restaurantId, status: { $in: ['delivered', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Pending orders
    const pendingOrders = await Order.countDocuments({ 
      restaurantId: req.restaurantId, 
      status: { $in: ['pending', 'confirmed', 'preparing'] } 
    });

    // Today's reservations
    const todayReservations = await TableReservation.find({
      restaurantId: req.restaurantId,
      reservationDate: {
        $gte: today.toISOString().split('T')[0],
        $lt: tomorrow.toISOString().split('T')[0]
      }
    });

    const stats = {
      todayOrders: todayOrders.length,
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      pendingOrders,
      todayReservations: todayReservations.length,
      menuItems: await Menu.countDocuments({ restaurantId: req.restaurantId }),
      tables: await Table.countDocuments({ restaurantId: req.restaurantId })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get restaurant tables (public)
router.get("/:restaurantId/tables", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Generate default table configuration if not exists
    if (!restaurant.tableConfiguration || !restaurant.tableConfiguration.tableSizes || restaurant.tableConfiguration.tableSizes.length === 0) {
      const defaultTables = [];
      for (let i = 1; i <= 20; i++) {
        defaultTables.push({
          tableNumber: i,
          tableName: `Table ${i}`,
          tableCode: `${String.fromCharCode(65 + Math.floor((i-1) / 10))}${(i-1) % 10 + 1}`,
          capacity: Math.max(2, Math.floor(Math.random() * 6) + 2),
          isAvailable: true,
          location: ['Window', 'Garden', 'Indoor', 'Outdoor'][Math.floor(Math.random() * 4)]
        });
      }

      restaurant.tableConfiguration = {
        totalTables: 20,
        tableSizes: defaultTables,
        reservationTimeSlots: generateDefaultTimeSlots()
      };

      await restaurant.save();
    }

    // Return tables in the format expected by the frontend
    const tables = restaurant.tableConfiguration.tableSizes.map((table, index) => ({
      _id: table._id || `table_${table.tableNumber}_${index}`,
      tableNumber: table.tableNumber,
      tableName: table.tableName || `Table ${table.tableNumber}`,
      tableCode: table.tableCode || `${String.fromCharCode(65 + Math.floor((table.tableNumber-1) / 10))}${(table.tableNumber-1) % 10 + 1}`,
      capacity: table.capacity,
      location: table.location,
      isAvailable: table.isAvailable !== false,
      isBooked: false
    }));

    res.json(tables);
  } catch (error) {
    console.error("Error fetching restaurant tables:", error);
    res.status(500).json({ message: "Failed to fetch restaurant tables" });
  }
});

// Helper function to generate default time slots
function generateDefaultTimeSlots() {
  const slots = [];
  for (let hour = 12; hour <= 22; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, '0')}:00`, duration: 90 });
    if (hour < 22) {
      slots.push({ time: `${hour.toString().padStart(2, '0')}:30`, duration: 90 });
    }
  }
  return slots;
}

export default router; 