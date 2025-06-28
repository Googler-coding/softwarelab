# 🚀 Food Delivery System - Troubleshooting Guide

## System Overview

This is a comprehensive food delivery system with the following components:

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT tokens
- **Real-time Features**: Chat system, order tracking, live maps

## 🛠️ Quick Start

### 1. Start the Backend Server
```bash
cd /path/to/your/project
node server.js
```

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Test Page: http://localhost:5173/test.html

## 🔧 Common Issues and Solutions

### Issue 1: Server Won't Start

**Symptoms:**
- "Port 5000 is already in use" error
- MongoDB connection failed
- JWT_SECRET not defined

**Solutions:**
1. **Port Conflict:**
   ```bash
   # Kill process using port 5000
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. **MongoDB Connection:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file
   - Default: `mongodb://localhost:27017/foodDeliveryApp`

3. **JWT_SECRET Missing:**
   ```bash
   # Create .env file
   echo "JWT_SECRET=your-secret-key-here" > .env
   ```

### Issue 2: Frontend Can't Connect to Backend

**Symptoms:**
- "Cannot connect to server" errors
- CORS errors in browser console
- API calls failing

**Solutions:**
1. **Check Server Status:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Verify CORS Configuration:**
   - Backend allows: localhost:5173, localhost:3000
   - Check server.js CORS settings

3. **Check Environment Variables:**
   ```bash
   # In frontend, ensure VITE_API_URL is set
   echo "VITE_API_URL=http://localhost:5000" > .env
   ```

### Issue 3: Authentication Issues

**Symptoms:**
- Login fails
- "Invalid credentials" errors
- Token expiration issues

**Solutions:**
1. **Default Admin Credentials:**
   - Email: `admin@fooddelivery.com`
   - Password: `admin123`

2. **Token Issues:**
   - Clear localStorage: `localStorage.clear()`
   - Check JWT_SECRET is consistent
   - Verify token expiration (1 hour default)

3. **User Registration:**
   - Ensure all required fields are provided
   - Check email format validation
   - Password minimum 6 characters

### Issue 4: Order Flow Issues

**Symptoms:**
- Orders not appearing for riders
- Status updates not working
- Chat not functioning

**Solutions:**
1. **Order Status Flow:**
   ```
   pending → preparing → ready → assigned → picked_up → on_way → delivered
   ```

2. **Rider Order Acceptance:**
   - Rider must be online (`isOnline: true`)
   - Order must be in "ready" status
   - No other rider assigned

3. **Chat System:**
   - Requires order to have both user and rider
   - Check Chat model structure
   - Verify message permissions

### Issue 5: Database Issues

**Symptoms:**
- Data not persisting
- Duplicate entries
- Connection timeouts

**Solutions:**
1. **MongoDB Connection:**
   ```bash
   # Check MongoDB status
   mongosh
   show dbs
   use foodDeliveryApp
   show collections
   ```

2. **Data Validation:**
   - Check model schemas
   - Verify required fields
   - Check unique constraints

3. **Index Issues:**
   ```javascript
   // Recreate indexes if needed
   db.users.createIndex({ "email": 1 }, { unique: true })
   db.restaurants.createIndex({ "email": 1 }, { unique: true })
   db.riders.createIndex({ "email": 1 }, { unique: true })
   ```

## 🧪 Testing the System

### Automated Testing
1. Open `test.html` in your browser
2. Click "Run All Tests"
3. Review results for any failures

### Manual Testing Flow
1. **User Registration/Login**
2. **Restaurant Registration/Login**
3. **Rider Registration/Login**
4. **Restaurant adds menu items**
5. **User places order**
6. **Restaurant marks order as ready**
7. **Rider accepts order**
8. **Test chat functionality**
9. **Complete delivery**

## 📊 System Health Check

### Backend Endpoints
- `GET /api/health` - Server status
- `GET /api/auth/health` - Auth routes status
- `GET /debug/env` - Environment variables (development)

### Frontend Health
- Check browser console for errors
- Verify API calls in Network tab
- Test localStorage persistence

## 🔍 Debug Mode

### Enable Detailed Logging
```javascript
// In server.js, ensure logging is enabled
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
```

### Database Debugging
```javascript
// Enable Mongoose debug mode
mongoose.set('debug', true);
```

## 🚨 Emergency Fixes

### Reset Everything
```bash
# Clear database
mongosh foodDeliveryApp --eval "db.dropDatabase()"

# Clear frontend storage
localStorage.clear()

# Restart both servers
```

### Recreate Default Admin
```javascript
// The server automatically creates default admin on startup
// Email: admin@fooddelivery.com
// Password: admin123
```

## 📞 Support

### Log Files
- Check server console output
- Browser developer tools console
- Network tab for API calls

### Common Error Codes
- `401` - Authentication required
- `403` - Access forbidden
- `404` - Resource not found
- `500` - Internal server error

### Performance Issues
- Check MongoDB indexes
- Monitor API response times
- Verify frontend bundle size

## 🔄 System Updates

### Recent Fixes Applied
1. **Chat Model**: Fixed refPath issues, made riderId optional
2. **Order Status**: Fixed restaurant status update validation
3. **Authentication**: Improved token handling and error messages
4. **Frontend Navigation**: Fixed dashboard navigation issues
5. **Real-time Updates**: Enhanced polling and state management

### Known Limitations
- No real-time WebSocket connections (uses polling)
- Map markers use default Leaflet icons
- No payment integration
- Limited address validation

## 🎯 Best Practices

1. **Always test the complete order flow**
2. **Check server logs for detailed error information**
3. **Use the test page to verify system health**
4. **Clear browser cache if experiencing frontend issues**
5. **Restart servers after major configuration changes**

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅ 