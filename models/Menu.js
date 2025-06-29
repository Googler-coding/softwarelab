import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
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
  category: {
    type: String,
    enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side Dish', 'Salad', 'Soup', 'Pizza', 'Burger', 'Pasta', 'Seafood', 'Vegetarian', 'Non-Vegetarian'],
    default: 'Main Course'
  },
  image: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  spicyLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  allergens: [{
    type: String,
    enum: ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Fish', 'Shellfish', 'Wheat']
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  tags: [{
    type: String,
    enum: ['Popular', 'Chef Special', 'Healthy', 'Spicy', 'Sweet', 'Vegan', 'Organic', 'Local']
  }],
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
menuSchema.index({ restaurantId: 1, isAvailable: 1 });
menuSchema.index({ restaurantId: 1, category: 1 });
menuSchema.index({ restaurantId: 1, isActive: 1 });

// Virtual for discounted price
menuSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount / 100);
  }
  return this.price;
});

// Virtual for availability status
menuSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  return this.isAvailable ? 'available' : 'unavailable';
});

// Pre-save middleware to ensure unique menu item names per restaurant
menuSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const Menu = mongoose.model('Menu');
    const existingItem = await Menu.findOne({
      restaurantId: this.restaurantId,
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingItem) {
      throw new Error('Menu item name must be unique within the restaurant');
    }
  }
  next();
});

// Static method to get menu by restaurant with filters
menuSchema.statics.getMenuByRestaurant = function(restaurantId, filters = {}) {
  const query = { restaurantId, isActive: true };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.isAvailable !== undefined) {
    query.isAvailable = filters.isAvailable;
  }
  
  if (filters.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }
  
  return this.find(query).sort({ category: 1, name: 1 });
};

const Menu = mongoose.model('Menu', menuSchema);

export default Menu; 