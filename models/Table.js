import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableName: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  location: {
    type: String,
    required: true,
    enum: ['Indoor', 'Outdoor', 'Window', 'Garden', 'VIP', 'Bar', 'Private Room']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    enum: ['Window View', 'Quiet', 'Romantic', 'Business', 'Family', 'Wheelchair Accessible']
  }],
  minimumSpend: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
tableSchema.index({ restaurantId: 1, isAvailable: 1 });
tableSchema.index({ restaurantId: 1, location: 1 });
tableSchema.index({ restaurantId: 1, capacity: 1 });

// Virtual for table status
tableSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  return this.isAvailable ? 'available' : 'occupied';
});

// Method to check if table can be reserved for a specific time
tableSchema.methods.canBeReserved = async function(date, time, duration = 2) {
  if (!this.isAvailable || !this.isActive) return false;
  
  // Check for existing reservations
  const TableReservation = mongoose.model('TableReservation');
  const existingReservation = await TableReservation.findOne({
    tableId: this._id,
    reservationDate: date,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        reservationTime: { $lte: time },
        endTime: { $gt: time }
      },
      {
        reservationTime: { $lt: this.addHours(time, duration) },
        endTime: { $gte: this.addHours(time, duration) }
      }
    ]
  });
  
  return !existingReservation;
};

// Helper method to add hours to time
tableSchema.methods.addHours = function(time, hours) {
  const [hour, minute] = time.split(':').map(Number);
  const newHour = (hour + hours) % 24;
  return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Pre-save middleware to ensure unique table names per restaurant
tableSchema.pre('save', async function(next) {
  if (this.isModified('tableName')) {
    const Table = mongoose.model('Table');
    const existingTable = await Table.findOne({
      restaurantId: this.restaurantId,
      tableName: this.tableName,
      _id: { $ne: this._id }
    });
    
    if (existingTable) {
      throw new Error('Table name must be unique within the restaurant');
    }
  }
  next();
});

const Table = mongoose.model('Table', tableSchema);

export default Table; 