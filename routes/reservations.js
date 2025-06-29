import express from "express";
import TableReservation from "../models/TableReservation.js";
import Restaurant from "../models/Restaurant.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get available tables for a restaurant
router.get("/available/:restaurantId", auth, async (req, res) => {
  try {
    const { date, time, numberOfGuests } = req.query;
    
    if (!date || !time || !numberOfGuests) {
      return res.status(400).json({ 
        message: "Date, time, and number of guests are required" 
      });
    }

    // Validate date and time - prevent past dates and times
    const now = new Date();
    const reservationDateTime = new Date(`${date}T${time}`);
    
    if (reservationDateTime <= now) {
      return res.status(400).json({ 
        message: "Cannot check availability for past dates and times" 
      });
    }

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Get all tables for this restaurant
    const allTables = restaurant.tableConfiguration?.tableSizes || [];
    
    // Get booked tables for this date and time
    const bookedReservations = await TableReservation.find({
      restaurantId: req.params.restaurantId,
      reservationDate: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      },
      reservationTime: time,
      status: { $ne: 'cancelled' }
    });

    const bookedTableNumbers = bookedReservations.map(reservation => reservation.tableNumber);
    
    // Filter available tables by capacity and availability
    const availableTables = allTables.filter(table => 
      !bookedTableNumbers.includes(table.tableNumber) && 
      table.capacity >= parseInt(numberOfGuests) &&
      table.isAvailable !== false
    );

    // Generate time slots with real-time validation
    const timeSlots = generateTimeSlotsWithValidation();

    res.json({
      availableTables,
      bookedTables: bookedReservations.map(reservation => ({
        tableNumber: reservation.tableNumber,
        tableName: reservation.tableName,
        customerName: reservation.customerName,
        numberOfGuests: reservation.numberOfGuests
      })),
      total: allTables.length,
      availableCount: availableTables.length,
      bookedCount: bookedTableNumbers.length,
      timeSlots
    });
  } catch (error) {
    console.error("Error fetching available tables:", error);
    res.status(500).json({ message: "Failed to fetch available tables" });
  }
});

// Helper function to generate time slots with real-time validation
function generateTimeSlotsWithValidation() {
  const slots = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = now.toISOString().split('T')[0];

  for (let hour = 12; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Skip past times for today
      const isPastTime = hour < currentHour || (hour === currentHour && minute <= currentMinute);
      
      slots.push({
        time: timeString,
        label: `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
        available: !isPastTime,
        disabled: isPastTime
      });
    }
  }
  return slots;
}

// Create a table reservation
router.post("/", auth, async (req, res) => {
  try {
    const {
      restaurantId,
      tableNumber,
      tableName,
      reservationDate,
      reservationTime,
      numberOfGuests,
      specialRequests,
    } = req.body;

    console.log("Creating reservation with data:", {
      restaurantId,
      tableNumber,
      reservationDate,
      reservationTime,
      numberOfGuests
    });

    // Validate required fields
    if (!restaurantId || !tableNumber || !reservationDate || !reservationTime || !numberOfGuests) {
      return res.status(400).json({ 
        message: "restaurantId, tableNumber, reservationDate, reservationTime, and numberOfGuests are required" 
      });
    }

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Validate table exists and has sufficient capacity
    const tableConfig = restaurant.tableConfiguration?.tableSizes?.find(t => t.tableNumber === parseInt(tableNumber));
    if (!tableConfig) {
      return res.status(400).json({ 
        message: `Table number ${tableNumber} not found in restaurant configuration` 
      });
    }

    if (tableConfig.capacity < parseInt(numberOfGuests)) {
      return res.status(400).json({ 
        message: `Table capacity (${tableConfig.capacity}) is less than requested guests (${numberOfGuests})` 
      });
    }

    // Validate date and time - prevent past dates and times
    const now = new Date();
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
    
    if (reservationDateTime <= now) {
      return res.status(400).json({ 
        message: "Cannot make reservations for past dates and times" 
      });
    }

    // Validate reservation date is not more than 30 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (reservationDateTime > maxDate) {
      return res.status(400).json({ 
        message: "Reservations can only be made up to 30 days in advance" 
      });
    }

    // Check if table is available for this specific time slot
    const existingReservation = await TableReservation.findOne({
      restaurantId,
      tableNumber: parseInt(tableNumber),
      reservationDate: {
        $gte: new Date(reservationDate),
        $lt: new Date(new Date(reservationDate).setDate(new Date(reservationDate).getDate() + 1))
      },
      reservationTime,
      status: { $ne: 'cancelled' }
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: `Table ${tableNumber} is already booked for ${reservationDate} at ${reservationTime}` 
      });
    }

    // Get user details
    const userName = req.user.name || "Customer";
    const userEmail = req.user.email || "customer@example.com";
    const userPhone = req.user.phone || "Phone not provided";

    const reservation = new TableReservation({
      restaurantId,
      tableNumber: parseInt(tableNumber),
      tableName: tableName || generateTableName(tableNumber),
      reservationDate: new Date(reservationDate),
      reservationTime,
      numberOfGuests: parseInt(numberOfGuests),
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      userId: req.user.id,
      specialRequests,
    });

    await reservation.save();

    console.log("Reservation created successfully:", reservation._id);

    res.status(201).json({
      message: "Table reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Table is already booked for this time slot" });
    }
    res.status(500).json({ message: "Failed to create reservation", error: error.message });
  }
});

// Helper function to generate table name
function generateTableName(tableNumber) {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const index = (tableNumber - 1) * 4;
  return letters.slice(index, index + 4);
}

// Get user's reservations
router.get("/my-reservations", auth, async (req, res) => {
  try {
    const reservations = await TableReservation.find({ userId: req.user.id })
      .populate("restaurantId", "restaurantName address")
      .sort({ reservationDate: 1, reservationTime: 1 });

    res.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

// Get restaurant's reservations (for restaurant dashboard)
router.get("/restaurant/:restaurantId", auth, async (req, res) => {
  try {
    if (req.user.role !== "restaurant" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { date } = req.query;
    let query = { restaurantId: req.params.restaurantId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.reservationDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const reservations = await TableReservation.find(query)
      .populate("userId", "name email phone")
      .sort({ reservationDate: 1, reservationTime: 1 });

    res.json(reservations);
  } catch (error) {
    console.error("Error fetching restaurant reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

// Update reservation status
router.patch("/:reservationId/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await TableReservation.findById(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Verify user has access
    if (reservation.userId.toString() !== req.user.id && 
        reservation.restaurantId.toString() !== req.user.id &&
        req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    reservation.status = status;
    await reservation.save();

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify restaurant
      io.to(`restaurant_${reservation.restaurantId}`).emit('reservationUpdate', {
        restaurantId: reservation.restaurantId,
        reservationId: reservation._id,
        status: reservation.status,
        message: `Reservation status updated to ${status}`
      });

      // Notify user
      io.to(`user_${reservation.userId}`).emit('reservationUpdate', {
        reservationId: reservation._id,
        status: reservation.status,
        message: `Your reservation status has been updated to ${status}`
      });
    }

    res.json({ message: "Reservation status updated", reservation });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    res.status(500).json({ message: "Failed to update reservation status" });
  }
});

// Cancel reservation
router.patch("/:reservationId/cancel", auth, async (req, res) => {
  try {
    const reservation = await TableReservation.findById(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Verify user has access
    if (reservation.userId.toString() !== req.user.id && 
        reservation.restaurantId.toString() !== req.user.id &&
        req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await reservation.cancelReservation();

    res.json({ message: "Reservation cancelled successfully", reservation });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
});

// Request cancellation of reservation
router.patch("/:reservationId/cancel-request", auth, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const reservation = await TableReservation.findById(req.params.reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Verify user has access (only the customer who made the reservation can request cancellation)
    if (reservation.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only allow cancellation request for pending or confirmed reservations
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ 
        message: "Cannot request cancellation for this reservation status" 
      });
    }

    // Update reservation status to cancel_requested
    reservation.status = 'cancel_requested';
    reservation.cancellationReason = cancellationReason || 'Customer requested cancellation';
    reservation.updatedAt = new Date();

    await reservation.save();

    // Emit real-time update to restaurant
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant_${reservation.restaurantId}`).emit('reservationUpdate', {
        restaurantId: reservation.restaurantId,
        reservationId: reservation._id,
        status: reservation.status,
        message: 'New cancellation request received'
      });
    }

    res.json({ 
      message: "Cancellation request sent successfully", 
      reservation 
    });
  } catch (error) {
    console.error("Error requesting cancellation:", error);
    res.status(500).json({ message: "Failed to request cancellation" });
  }
});

// Get restaurant's table configuration
router.get("/restaurant/:restaurantId/tables", auth, async (req, res) => {
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

    res.json({
      tableConfiguration: restaurant.tableConfiguration,
      operatingHours: restaurant.operatingHours
    });
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

// Get booked tables for a restaurant on a specific date and time
router.get("/booked/:restaurantId", auth, async (req, res) => {
  try {
    const { date, time } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ 
        message: "Date and time are required" 
      });
    }

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const bookedTables = await TableReservation.find({
      restaurantId: req.params.restaurantId,
      reservationDate: new Date(date),
      reservationTime: time,
      status: { $ne: "cancelled" }
    });

    res.json({
      bookedTables: bookedTables.map(reservation => ({
        tableNumber: reservation.tableNumber,
        tableName: reservation.tableName,
        customerName: reservation.customerName,
        numberOfGuests: reservation.numberOfGuests,
        reservationTime: reservation.reservationTime
      }))
    });
  } catch (error) {
    console.error("Error fetching booked tables:", error);
    res.status(500).json({ message: "Failed to fetch booked tables" });
  }
});

// Update restaurant's table configuration (admin/restaurant only)
router.patch("/restaurant/:restaurantId/tables", auth, async (req, res) => {
  try {
    if (req.user.role !== "restaurant" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { tableConfiguration, operatingHours } = req.body;
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (tableConfiguration) {
      restaurant.tableConfiguration = tableConfiguration;
    }

    if (operatingHours) {
      restaurant.operatingHours = operatingHours;
    }

    await restaurant.save();

    res.json({ message: "Table configuration updated", restaurant });
  } catch (error) {
    console.error("Error updating table configuration:", error);
    res.status(500).json({ message: "Failed to update table configuration" });
  }
});

// Check table availability
router.post("/availability", async (req, res) => {
  try {
    const { restaurantId, reservationDate, reservationTime, numberOfGuests } = req.body;

    // Validate required fields
    if (!restaurantId || !reservationDate || !reservationTime || !numberOfGuests) {
      return res.status(400).json({ 
        message: "restaurantId, reservationDate, reservationTime, and numberOfGuests are required" 
      });
    }

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Get all tables that can accommodate the requested number of guests
    const suitableTables = restaurant.tableConfiguration?.tableSizes?.filter(
      table => table.capacity >= parseInt(numberOfGuests)
    ) || [];

    if (suitableTables.length === 0) {
      return res.status(200).json([]);
    }

    // Check which tables are already booked for this time slot
    const startDate = new Date(reservationDate);
    const endDate = new Date(reservationDate);
    endDate.setDate(endDate.getDate() + 1);

    const bookedReservations = await TableReservation.find({
      restaurantId,
      tableNumber: { $in: suitableTables.map(t => t.tableNumber) },
      reservationDate: {
        $gte: startDate,
        $lt: endDate,
      },
      reservationTime,
      status: { $ne: 'cancelled' }
    });

    const bookedTableNumbers = bookedReservations.map(reservation => reservation.tableNumber);

    // Return available tables
    const availableTables = suitableTables.filter(
      table => !bookedTableNumbers.includes(table.tableNumber)
    );

    res.json(availableTables);
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ message: "Failed to check availability", error: error.message });
  }
});

// Get reservations for a specific restaurant
router.get("/restaurant", auth, async (req, res) => {
  try {
    // Check if user is a restaurant
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ message: "Access denied. Restaurant role required." });
    }

    const reservations = await TableReservation.find({ 
      restaurantId: req.user.id 
    })
    .sort({ reservationDate: 1, reservationTime: 1 })
    .populate('userId', 'name email phone');

    res.json(reservations);
  } catch (error) {
    console.error("Error fetching restaurant reservations:", error);
    res.status(500).json({ message: "Failed to fetch reservations", error: error.message });
  }
});

export default router; 