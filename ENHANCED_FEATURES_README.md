# 🍽️ Enhanced Food Management System

A comprehensive food delivery and restaurant management system with real-time tracking, table reservations, and advanced order management features.

## ✨ New Features Added

### 1. **Estimated Preparation Time**
- Automatic calculation based on restaurant settings
- Real-time updates during order preparation
- Manual override capability for restaurants
- Display of actual vs estimated preparation times

### 2. **Real-Time Kitchen Status Updates**
- Live status tracking: Pending → Preparing → Ready → Delivered
- Socket.IO integration for instant updates
- Kitchen dashboard for restaurant staff
- Customer notifications for status changes

### 3. **Restaurant Table Reservation System**
- Real-time seat availability checking
- Time-slot selection (30-minute intervals)
- Prevent double booking with unique constraints
- Reservation management dashboard
- Special requests and dietary requirements

### 4. **Takeaway Option**
- Order type selection (Delivery/Takeaway/Dine-in)
- Different workflows for each order type
- Takeaway pickup notifications
- Estimated pickup times

### 5. **Home Delivery with Rider Assignment**
- Automatic rider assignment based on location
- Manual rider assignment by admin/restaurant
- Real-time rider location tracking
- Delivery status updates
- Rider earnings and performance tracking

## 🏗️ System Architecture

### Backend Technologies
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend Technologies
- **React** with functional components
- **React Bootstrap** for UI components
- **Leaflet** for interactive maps
- **Socket.IO Client** for real-time updates

## 📊 Enhanced Database Schemas

### Order Schema
```javascript
{
  orderId: String,                    // Unique order identifier
  restaurantId: ObjectId,            // Reference to restaurant
  customerName: String,              // Customer name
  customerEmail: String,             // Customer email
  customerPhone: String,             // Customer phone
  customerAddress: String,           // Delivery address
  items: [{                          // Order items
    name: String,
    price: Number,
    quantity: Number,
    specialInstructions: String
  }],
  total: Number,                     // Order total
  orderType: String,                 // "delivery", "takeaway", "dine-in"
  status: String,                    // Order status
  kitchenStatus: String,             // Kitchen preparation status
  estimatedPreparationTime: Number,  // In minutes
  actualPreparationTime: Number,     // In minutes
  preparationStartTime: Date,
  preparationEndTime: Date,
  riderId: ObjectId,                 // Assigned rider
  riderName: String,
  riderPhone: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  tableReservation: {                // For dine-in orders
    tableNumber: Number,
    reservationDate: Date,
    reservationTime: String,
    numberOfGuests: Number
  },
  trackingUpdates: [{                // Real-time tracking
    status: String,
    message: String,
    timestamp: Date,
    location: { lat: Number, lng: Number }
  }],
  paymentMethod: String,             // "cash", "card", "online"
  paymentStatus: String,             // "pending", "paid", "failed"
  specialInstructions: String,
  cancellationReason: String
}
```

### Table Reservation Schema
```javascript
{
  restaurantId: ObjectId,            // Reference to restaurant
  tableNumber: Number,               // Table number
  reservationDate: Date,             // Reservation date
  reservationTime: String,           // Time slot (e.g., "12:00")
  numberOfGuests: Number,            // Number of guests
  customerName: String,              // Customer name
  customerEmail: String,             // Customer email
  customerPhone: String,             // Customer phone
  status: String,                    // "pending", "confirmed", "cancelled", "completed"
  specialRequests: String,           // Special requests
  orderId: ObjectId,                 // Associated order (if any)
  userId: ObjectId                   // Customer reference
}
```

### Enhanced Rider Schema
```javascript
{
  name: String,                      // Rider name
  email: String,                     // Rider email
  phone: String,                     // Rider phone
  password: String,                  // Hashed password
  status: String,                    // "available", "busy", "offline", "on-delivery"
  currentLocation: {                 // Real-time location
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  vehicleInfo: {                     // Vehicle details
    type: String,                    // "bike", "scooter", "car", "bicycle"
    model: String,
    plateNumber: String
  },
  rating: {                          // Performance metrics
    average: Number,
    totalReviews: Number
  },
  earnings: {                        // Financial tracking
    total: Number,
    thisWeek: Number,
    thisMonth: Number
  },
  deliveryStats: {                   // Delivery statistics
    totalDeliveries: Number,
    completedDeliveries: Number,
    cancelledDeliveries: Number,
    averageDeliveryTime: Number
  },
  workingHours: {                    // Working schedule
    startTime: String,
    endTime: String,
    isWorking: Boolean
  },
  activeOrderId: ObjectId,           // Current active order
  locationHistory: [{                // Location tracking history
    lat: Number,
    lng: Number,
    timestamp: Date
  }],
  documents: {                       // Verification documents
    idProof: String,
    vehicleRegistration: String,
    insurance: String,
    isVerified: Boolean
  },
  preferences: {                     // Rider preferences
    maxDeliveryDistance: Number,
    preferredAreas: [String],
    autoAcceptOrders: Boolean
  }
}
```

### Enhanced Restaurant Schema
```javascript
{
  name: String,                      // Restaurant name
  restaurantName: String,            // Display name
  email: String,                     // Restaurant email
  password: String,                  // Hashed password
  phone: String,                     // Restaurant phone
  address: String,                   // Restaurant address
  lat: Number,                       // Latitude
  lon: Number,                       // Longitude
  cuisine: String,                   // Cuisine type
  rating: {                          // Restaurant rating
    average: Number,
    totalReviews: Number
  },
  operatingHours: {                  // Operating hours
    monday: { open: String, close: String, isOpen: Boolean },
    // ... other days
  },
  tableConfiguration: {              // Table management
    totalTables: Number,
    tableSizes: [{
      tableNumber: Number,
      capacity: Number,
      isAvailable: Boolean,
      location: String
    }],
    reservationTimeSlots: [{
      time: String,
      duration: Number
    }]
  },
  kitchenSettings: {                 // Kitchen configuration
    estimatedPreparationTime: Number,
    maxPreparationTime: Number,
    autoAcceptOrders: Boolean,
    kitchenStatus: String
  },
  deliverySettings: {                // Delivery configuration
    isDeliveryAvailable: Boolean,
    isTakeawayAvailable: Boolean,
    isDineInAvailable: Boolean,
    maxDeliveryDistance: Number,
    deliveryFee: Number,
    minimumOrderAmount: Number
  },
  menu: [{                           // Menu items
    name: String,
    price: Number,
    description: String,
    category: String,
    preparationTime: Number,
    isAvailable: Boolean,
    image: String,
    allergens: [String],
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  }],
  status: String,                    // "open", "closed", "temporarily-closed"
  isVerified: Boolean,
  stats: {                           // Restaurant statistics
    totalOrders: Number,
    totalRevenue: Number,
    averageOrderValue: Number,
    averagePreparationTime: Number
  }
}
```

## 🚀 API Endpoints

### Order Management
```
POST   /api/orders                    # Place new order
GET    /api/orders/my-orders          # Get user's orders
GET    /api/orders/restaurant/:id     # Get restaurant's orders
PATCH  /api/orders/:id/status         # Update order status
PATCH  /api/orders/:id/assign-rider   # Assign rider to order
PATCH  /api/orders/:id/delivery-status # Update delivery status
GET    /api/orders/:id/tracking       # Get order tracking
PATCH  /api/orders/:id/cancel         # Cancel order
```

### Table Reservations
```
GET    /api/reservations/available/:restaurantId    # Check table availability
POST   /api/reservations                            # Create reservation
GET    /api/reservations/my-reservations           # Get user's reservations
GET    /api/reservations/restaurant/:id            # Get restaurant's reservations
PATCH  /api/reservations/:id/status                # Update reservation status
PATCH  /api/reservations/:id/cancel                # Cancel reservation
GET    /api/reservations/restaurant/:id/tables     # Get table configuration
PATCH  /api/reservations/restaurant/:id/tables     # Update table configuration
```

### Rider Management
```
GET    /api/riders/available                        # Get available riders
PATCH  /api/riders/location                         # Update rider location
PATCH  /api/riders/status                           # Update rider status
GET    /api/riders/active-order                     # Get rider's active order
GET    /api/riders/delivery-history                 # Get delivery history
GET    /api/riders/stats                            # Get rider statistics
PATCH  /api/riders/preferences                      # Update preferences
PATCH  /api/riders/working-hours                    # Update working hours
GET    /api/riders                                  # Get all riders (admin)
GET    /api/riders/:id                              # Get rider by ID (admin)
PATCH  /api/riders/:id/verify                       # Verify rider (admin)
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd softwarelab-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/foodDeliveryApp
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```

### Frontend Setup
1. **Navigate to the frontend directory**
   ```bash
   cd src
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔌 Socket.IO Events

### Client to Server
```javascript
// Join user room
socket.emit('joinUser', userId);

// Join restaurant room
socket.emit('joinRestaurant', restaurantId);

// Join rider room
socket.emit('joinRider', riderId);

// Join admin room
socket.emit('joinAdmin');

// Order status update
socket.emit('orderStatusUpdate', {
  orderId: String,
  status: String,
  kitchenStatus: String,
  restaurantId: String,
  userId: String,
  riderId: String
});

// Kitchen status update
socket.emit('kitchenStatusUpdate', {
  restaurantId: String,
  kitchenStatus: String,
  message: String
});

// Rider location update
socket.emit('riderLocationUpdate', {
  riderId: String,
  location: { lat: Number, lng: Number },
  orderId: String
});

// Reservation update
socket.emit('reservationUpdate', {
  restaurantId: String,
  reservationId: String,
  status: String
});

// Chat message
socket.emit('chatMessage', {
  orderId: String,
  senderId: String,
  senderRole: String,
  message: String,
  receiverId: String
});

// Join order chat
socket.emit('joinOrderChat', orderId);
```

### Server to Client
```javascript
// Order updates
socket.on('orderUpdate', (data) => {
  // Handle order status changes
});

// Kitchen status updates
socket.on('kitchenStatusUpdate', (data) => {
  // Handle kitchen status changes
});

// Rider location updates
socket.on('riderLocationUpdate', (data) => {
  // Handle rider location changes
});

// Reservation updates
socket.on('reservationUpdate', (data) => {
  // Handle reservation changes
});

// Chat messages
socket.on('chatMessage', (data) => {
  // Handle chat messages
});
```

## 🎯 Key Features Implementation

### 1. Real-Time Order Tracking
- **Socket.IO Integration**: Instant updates across all connected clients
- **Progress Visualization**: Visual progress bar showing order stages
- **Status Notifications**: Real-time notifications for status changes
- **Location Tracking**: Live rider location updates on map

### 2. Kitchen Management
- **Status Workflow**: Pending → Preparing → Ready → Delivered
- **Time Tracking**: Automatic calculation of preparation times
- **Kitchen Dashboard**: Real-time order queue for restaurant staff
- **Performance Metrics**: Average preparation time tracking

### 3. Table Reservation System
- **Availability Checking**: Real-time table availability verification
- **Time Slot Management**: Configurable reservation time slots
- **Double Booking Prevention**: Database constraints prevent conflicts
- **Reservation Dashboard**: Restaurant staff can manage reservations

### 4. Rider Management
- **Automatic Assignment**: AI-based rider assignment by location
- **Manual Assignment**: Admin/restaurant can manually assign riders
- **Performance Tracking**: Delivery statistics and earnings
- **Location History**: Track rider movement patterns

### 5. Order Type Management
- **Multiple Order Types**: Delivery, Takeaway, Dine-in
- **Type-Specific Workflows**: Different processes for each type
- **Pricing Variations**: Different pricing for different order types
- **Status Tracking**: Type-specific status updates

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different permissions for users, restaurants, riders, and admins
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 📱 Responsive Design

- **Mobile-First Approach**: Optimized for mobile devices
- **Progressive Web App**: Can be installed as a mobile app
- **Touch-Friendly Interface**: Optimized for touch interactions
- **Cross-Browser Compatibility**: Works on all modern browsers

## 🧪 Testing

### Backend Testing
```bash
# Run backend tests
npm test

# Run with coverage
npm run test:coverage
```

### Frontend Testing
```bash
# Run frontend tests
npm run test

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Backend Deployment
1. **Environment Setup**
   ```bash
   NODE_ENV=production
   MONGO_URI=your_production_mongodb_uri
   JWT_SECRET=your_production_jwt_secret
   ```

2. **Start Production Server**
   ```bash
   npm run start:prod
   ```

### Frontend Deployment
1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy to Static Hosting**
   - Vercel
   - Netlify
   - AWS S3
   - Firebase Hosting

## 📊 Monitoring and Analytics

- **Order Analytics**: Track order patterns and performance
- **Rider Performance**: Monitor delivery times and ratings
- **Restaurant Metrics**: Analyze restaurant performance
- **User Behavior**: Track user interaction patterns

## 🔄 Future Enhancements

- **Payment Gateway Integration**: Stripe, PayPal, etc.
- **Push Notifications**: Mobile push notifications
- **AI-Powered Recommendations**: Smart menu recommendations
- **Advanced Analytics**: Machine learning insights
- **Multi-Language Support**: Internationalization
- **Dark Mode**: Theme customization
- **Voice Commands**: Voice-based ordering
- **AR Menu Visualization**: Augmented reality menu viewing

## 📞 Support

For technical support or feature requests, please contact:
- Email: support@fooddelivery.com
- Documentation: [API Documentation](link-to-docs)
- Issues: [GitHub Issues](link-to-issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the food delivery industry** 