# 🍽️ Meal Order System

A comprehensive meal ordering platform with restaurant management, table reservations, food donations, and real-time order tracking.

## 🚀 Features

- **User Management**: Customer registration, authentication, and profiles
- **Restaurant Management**: Restaurant registration, menu management, and order processing
- **Table Reservations**: Real-time table booking with time slot selection (10 AM - 11 PM)
- **Order Tracking**: Real-time order status updates with socket.io
- **Food Donations**: Charity integration for food donations
- **Subscription System**: Meal subscription management
- **Admin Dashboard**: Comprehensive system administration
- **Rider Management**: Delivery tracking and management

## 🛠️ Technology Stack

- **Frontend**: React + Vite + Bootstrap
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (running on localhost:27017)
- npm or yarn

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd softwarelab-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Reset database (if needed)
   node reset-db.js
   
   # Create admin user
   node setup-admin.js
   ```

4. **Start the servers**
   ```bash
   # Start backend server (in one terminal)
   node server.js
   
   # Start frontend server (in another terminal)
   npm run dev
   ```

## 👤 User Roles & Access

### Admin User
- **Email**: admin@fooddelivery.com
- **Password**: admin123
- **Access**: Full system administration

### Restaurant Owner
- Register through the signup form
- Manage menu, orders, and table reservations
- Real-time order status updates

### Customer
- Register through the signup form
- Place orders, make table reservations
- Track orders in real-time
- Manage subscriptions and donations

## 🍽️ Table Reservation System

### Time Slots Available
- **Morning**: 10:00 AM - 11:59 AM
- **Afternoon**: 12:00 PM - 5:59 PM
- **Evening**: 6:00 PM - 11:00 PM
- **Interval**: 30-minute slots
- **Advance Booking**: Up to 30 days
- **Minimum Notice**: 30 minutes

### Features
- Real-time availability checking
- Seat selection and locking
- Reservation tracking and cancellation
- Special requests and dietary requirements

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/health` - Server health check
- `GET /api/charities` - List charities
- `GET /api/subscriptions` - Subscription plans
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/:id/tables` - Restaurant tables
- `POST /api/reservations` - Create reservation
- `GET /api/orders` - User orders
- `PUT /api/orders/:id/status` - Update order status

## 📱 Frontend Routes

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard (orders & reservations)
- `/restaurant-dashboard` - Restaurant management
- `/admin-dashboard` - Admin panel
- `/table-reservation` - Table booking
- `/food-donation` - Food donation
- `/subscription` - Subscription management

## 🔄 Real-time Features

- **Order Status Updates**: Real-time order tracking
- **Table Availability**: Live table status updates
- **Chat System**: Customer-restaurant communication
- **Notifications**: Instant status notifications

## 🗄️ Database Schema

### Collections
- `users` - Customer accounts
- `restaurants` - Restaurant profiles and menus
- `orders` - Order details and tracking
- `reservations` - Table reservations
- `admins` - System administrators
- `riders` - Delivery personnel
- `charities` - Food donation organizations
- `subscriptions` - Meal subscription plans

## 🛡️ Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing Node.js processes
   taskkill /f /im node.exe
   ```

2. **Database Connection Issues**
   ```bash
   # Reset database
   node reset-db.js
   ```

3. **CastError Issues**
   - Database has been cleaned and reset
   - All test data removed
   - Ready for real user data only

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check server logs for detailed error messages

## 🎯 Next Steps

The system is now ready for real user data:
1. Register restaurants through the signup form
2. Register customers through the signup form
3. Start using the table reservation system
4. Test order tracking and real-time updates

---

**Note**: This system is designed to work with real user data only. All test data has been removed for production use.
