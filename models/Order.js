import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: {
      type: String,
      required: true,
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
    customerAddress: {
      type: String,
      required: true,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        specialInstructions: {
          type: String,
          default: "",
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "delivery",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "picked-up", "on-the-way", "delivered", "cancelled"],
      default: "pending",
    },
    kitchenStatus: {
      type: String,
      enum: ["pending", "preparing", "ready"],
      default: "pending",
    },
    estimatedPreparationTime: {
      type: Number, // in minutes
      default: 30,
    },
    actualPreparationTime: {
      type: Number, // in minutes
      default: null,
    },
    preparationStartTime: {
      type: Date,
      default: null,
    },
    preparationEndTime: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      default: null,
    },
    riderName: {
      type: String,
      default: null,
    },
    riderPhone: {
      type: String,
      default: null,
    },
    estimatedDeliveryTime: {
      type: Date,
      required: true,
    },
    actualDeliveryTime: {
      type: Date,
      default: null,
    },
    deliveryStartTime: {
      type: Date,
      default: null,
    },
    // Table reservation fields
    tableReservation: {
      tableNumber: {
        type: Number,
        default: null,
      },
      reservationDate: {
        type: Date,
        default: null,
      },
      reservationTime: {
        type: String, // "12:00", "12:30", etc.
        default: null,
      },
      numberOfGuests: {
        type: Number,
        default: null,
      },
    },
    // Real-time tracking
    trackingUpdates: [
      {
        status: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          lat: Number,
          lng: Number,
        },
      },
    ],
    // Payment and additional info
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: null,
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

// Indexes for better query performance
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ riderId: 1, status: 1 });

// Pre-save middleware to update timestamps
orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to add tracking update
orderSchema.methods.addTrackingUpdate = function (status, message, location = null) {
  this.trackingUpdates.push({
    status,
    message,
    timestamp: new Date(),
    location,
  });
  return this.save();
};

// Method to calculate preparation time
orderSchema.methods.calculatePreparationTime = function () {
  if (this.preparationStartTime && this.preparationEndTime) {
    const diffMs = this.preparationEndTime - this.preparationStartTime;
    this.actualPreparationTime = Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }
  return this.actualPreparationTime;
};

// Static method to generate order ID
orderSchema.statics.generateOrderId = function () {
  return "ORD" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

export default mongoose.model("Order", orderSchema); 