# Food Delivery App Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/foodDeliveryApp

# Frontend API URL
VITE_API_URL=http://localhost:5000
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB (if running locally):
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

3. Start the backend server:
```bash
npm run server
# or for development with auto-restart:
npm run dev:server
```

4. In a new terminal, start the frontend:
```bash
npm run dev
```

## Features Implemented

### Restaurant Dashboard
- ✅ CRUD operations for menu items
- ✅ View and manage customer orders
- ✅ Update order status (pending → preparing → completed)
- ✅ Authentication required

### In-Restaurant Order
- ✅ Interactive map showing restaurant locations
- ✅ Search restaurants by name
- ✅ View restaurant menus
- ✅ Add items to cart with quantity controls
- ✅ Place orders (saved to database)
- ✅ User authentication required

### Admin Dashboard
- ✅ View all orders from all restaurants
- ✅ Order details with restaurant information
- ✅ Order status tracking
- ✅ Admin authentication required

### Authentication
- ✅ User registration and login
- ✅ Restaurant registration and login
- ✅ Admin registration and login
- ✅ JWT token-based authentication
- ✅ Role-based access control

### Database
- ✅ MongoDB integration
- ✅ Restaurant data with location coordinates
- ✅ Menu items linked to restaurants
- ✅ Orders with full details
- ✅ User management

## Usage Flow

1. **Restaurant Setup**:
   - Register as a restaurant
   - Log in to restaurant dashboard
   - Add menu items (CRUD operations)
   - View incoming orders

2. **Customer Ordering**:
   - Log in as a user
   - Go to "In-Restaurant Order" page
   - Search for restaurants
   - View restaurant on map
   - Add items to cart
   - Place order

3. **Admin Monitoring**:
   - Log in as admin
   - View all orders from all restaurants
   - Monitor order status and details

## API Endpoints

### Authentication
- `POST /api/auth/signup/restaurant` - Restaurant registration
- `POST /api/auth/signin/restaurant` - Restaurant login
- `POST /api/auth/signup/user` - User registration
- `POST /api/auth/signin/user` - User login
- `POST /api/auth/signup/admin` - Admin registration
- `POST /api/auth/signin/admin` - Admin login

### Menu Management (Restaurant only)
- `GET /api/menu/:userId` - Get restaurant menu
- `POST /api/menu` - Add menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Orders
- `GET /api/restaurants` - Get all restaurants with menus
- `POST /api/orders` - Place new order
- `GET /api/orders/:userId` - Get restaurant orders
- `PUT /api/orders/:orderId/status` - Update order status
- `GET /api/admin/orders` - Get all orders (Admin only)

## Database Schema

### Restaurant
```javascript
{
  restaurantName: String,
  ownerName: String,
  email: String (unique),
  password: String (hashed),
  lat: Number,
  lon: Number
}
```

### MenuItem
```javascript
{
  name: String,
  price: Number,
  userId: String (restaurant ID)
}
```

### Order
```javascript
{
  restaurantId: ObjectId,
  customerName: String,
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: String,
  userId: ObjectId (restaurant ID)
}
```

## Troubleshooting

1. **MongoDB Connection Error**: Make sure MongoDB is running and the connection string is correct
2. **JWT Secret Error**: Ensure JWT_SECRET is set in your .env file
3. **CORS Error**: Check that the frontend URL is included in the CORS configuration
4. **Port Already in Use**: Change the PORT in .env file or kill the process using the port

## Security Notes

- Change the JWT_SECRET in production
- Use HTTPS in production
- Implement rate limiting for production
- Add input validation and sanitization
- Use environment variables for sensitive data 