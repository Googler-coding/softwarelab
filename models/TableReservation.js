import mongoose from "mongoose";

const tableReservationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    tableName: {
      type: String,
      required: true,
      default: function() {
        // Generate table name like "abcd", "efgh", etc.
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const index = (this.tableNumber - 1) * 4;
        return letters.slice(index, index + 4);
      }
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    reservationTime: {
      type: String, // "12:00", "12:30", "13:00", etc.
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "cancel_requested"],
      default: "pending",
    },
    specialRequests: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent double booking
tableReservationSchema.index(
  { 
    restaurantId: 1, 
    tableNumber: 1, 
    reservationDate: 1, 
    reservationTime: 1 
  }, 
  { unique: true }
);

// Index for querying reservations
tableReservationSchema.index({ restaurantId: 1, reservationDate: 1 });
tableReservationSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to update timestamps and validate
tableReservationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  
  // Validate that reservation is not in the past
  const reservationDateTime = new Date(`${this.reservationDate.toISOString().split('T')[0]}T${this.reservationTime}`);
  const now = new Date();
  
  if (reservationDateTime <= now) {
    const error = new Error('Cannot create reservations for past dates and times');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // Validate reservation is not more than 30 days in the future
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (reservationDateTime > maxDate) {
    const error = new Error('Reservations can only be made up to 30 days in advance');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Static method to get available tables
tableReservationSchema.statics.getAvailableTables = async function(restaurantId, date, time, numberOfGuests) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const bookedReservations = await this.find({
    restaurantId,
    reservationDate: {
      $gte: startDate,
      $lt: endDate,
    },
    reservationTime: time,
    status: { $ne: 'cancelled' }
  });

  const bookedTableNumbers = bookedReservations.map(reservation => reservation.tableNumber);
  
  // Get restaurant's table configuration
  const Restaurant = mongoose.model('Restaurant');
  const restaurant = await Restaurant.findById(restaurantId);
  
  if (!restaurant || !restaurant.tableConfiguration) {
    return [];
  }

  // Return available table numbers
  const allTableNumbers = restaurant.tableConfiguration.tableSizes
    .filter(table => table.capacity >= numberOfGuests)
    .map(table => table.tableNumber);
  
  return allTableNumbers.filter(tableNumber => !bookedTableNumbers.includes(tableNumber));
};

// Static method to check availability
tableReservationSchema.statics.checkAvailability = async function(restaurantId, tableNumber, date, time) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const existingReservation = await this.findOne({
    restaurantId,
    tableNumber,
    reservationDate: {
      $gte: startDate,
      $lt: endDate,
    },
    reservationTime: time,
    status: { $ne: 'cancelled' }
  });

  return !existingReservation;
};

// Method to cancel reservation
tableReservationSchema.methods.cancelReservation = function () {
  this.status = "cancelled";
  return this.save();
};

export default mongoose.model("TableReservation", tableReservationSchema); 