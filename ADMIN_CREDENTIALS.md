# 🔐 Admin Credentials

## Default Admin Account

The system comes with a pre-configured admin account that is automatically created when the server starts.

### Login Credentials:
- **Email:** `admin@fooddelivery.com`
- **Password:** `admin123`

### How to Access:
1. Click on "Sign In" in the header
2. Select "Admin" role
3. Enter the credentials above
4. Click "Sign In"

### Security Notes:
- ⚠️ **IMPORTANT:** These are default credentials for development/testing
- 🔒 **Production:** Change these credentials before deploying to production
- 🚫 **No Additional Admins:** Admin account creation is disabled for security
- 📧 **Contact:** For production deployment, contact the system administrator

### Admin Dashboard Features:
- 📊 View system statistics
- 📦 Monitor all restaurant orders
- 👥 Track user activity
- 🏪 Manage restaurant data
- 📈 View revenue analytics

### Changing Admin Password (Production):
To change the admin password in production, you can:
1. Connect to your MongoDB database
2. Update the admin document with a new hashed password
3. Use bcrypt to hash the new password

```javascript
// Example: Update admin password
const bcrypt = require('bcrypt');
const newPassword = "your_new_secure_password";
const hashedPassword = await bcrypt.hash(newPassword, 10);

// Update in MongoDB
db.admins.updateOne(
  { email: "admin@fooddelivery.com" },
  { $set: { password: hashedPassword } }
);
```

### System Requirements:
- Node.js server running
- MongoDB database connected
- Frontend application accessible

---
**Note:** Keep these credentials secure and change them immediately after first login in production environments. 