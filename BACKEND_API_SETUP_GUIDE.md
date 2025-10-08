# Complete Render.com Backend Setup Guide

## 🎯 **Adding API Endpoints to Your Render Backend**

Your frontend is ready and deployed! Now you need to add the API endpoints to your Render.com backend at `https://getcash-backend-1.onrender.com`.

---

## 📋 **Required API Endpoints**

Here are the endpoints your frontend is expecting:

```
POST   /api/deposits/submit          - Submit new deposit request
GET    /api/deposits/requests        - Get all deposits (admin)
PUT    /api/deposits/approve/:id     - Approve specific deposit
PUT    /api/deposits/reject/:id      - Reject specific deposit
PUT    /api/users/update-level/:id   - Update user level after approval
GET    /api/notifications/user/:id   - Get notifications for user
PUT    /api/notifications/read/:id   - Mark notification as read
```

---

## 🗄️ **Database Schema Needed**

### **1. Deposits Table**
```sql
CREATE TABLE deposits (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    level VARCHAR(50) NOT NULL,
    levelDisplayName VARCHAR(100) NOT NULL,
    accountName VARCHAR(255) NOT NULL,
    accountPhone VARCHAR(20) NOT NULL,
    screenshot TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    adminNotes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approvedAt TIMESTAMP NULL,
    rejectedAt TIMESTAMP NULL
);
```

### **2. Users Table** (if not exists)
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    userName VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    level VARCHAR(50) DEFAULT 'none',
    taskAccess BOOLEAN DEFAULT FALSE,
    totalDeposited DECIMAL(10,2) DEFAULT 0,
    totalEarned DECIMAL(10,2) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **3. Notifications Table**
```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(255) NOT NULL,
    type ENUM('deposit_approved', 'deposit_rejected', 'level_updated') NOT NULL,
    message TEXT NOT NULL,
    depositId VARCHAR(255),
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (depositId) REFERENCES deposits(id)
);
```

---

## 💻 **Backend Code Implementation**

### **Option 1: Node.js/Express (Most Common)**

#### **1. Install Dependencies**
```bash
npm install express cors helmet morgan body-parser mysql2 sequelize bcryptjs jsonwebtoken
```

#### **2. Create API Routes File**
Create `routes/deposits.js`:

```javascript
const express = require('express');
const router = express.Router();
// Assuming you have database models set up

// Submit deposit request
router.post('/submit', async (req, res) => {
    try {
        const {
            userId, userName, phone, email, amount, level,
            levelDisplayName, accountName, accountPhone, screenshot
        } = req.body;

        // Generate unique ID
        const depositId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create deposit record
        const deposit = await Deposit.create({
            id: depositId,
            userId,
            userName,
            phone,
            email,
            amount,
            level,
            levelDisplayName,
            accountName,
            accountPhone,
            screenshot,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Deposit request submitted successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error submitting deposit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit deposit request',
            error: error.message
        });
    }
});

// Get all deposit requests (Admin)
router.get('/requests', async (req, res) => {
    try {
        const { status } = req.query;
        
        const whereClause = status ? { status } : {};
        
        const deposits = await Deposit.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: deposits
        });

    } catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deposit requests',
            error: error.message
        });
    }
});

// Approve deposit
router.put('/approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        // Update deposit status
        const deposit = await Deposit.findByPk(id);
        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        await deposit.update({
            status: 'approved',
            approvedAt: new Date(),
            adminNotes: adminNotes || 'Approved by admin'
        });

        // Create notification for user
        await Notification.create({
            userId: deposit.userId,
            type: 'deposit_approved',
            message: `✅ Payment approved! Your ${deposit.levelDisplayName} has been activated.`,
            depositId: deposit.id
        });

        res.json({
            success: true,
            message: 'Deposit approved successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error approving deposit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve deposit',
            error: error.message
        });
    }
});

// Reject deposit
router.put('/reject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const deposit = await Deposit.findByPk(id);
        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        await deposit.update({
            status: 'rejected',
            rejectedAt: new Date(),
            adminNotes: reason || 'Rejected by admin'
        });

        // Create notification for user
        await Notification.create({
            userId: deposit.userId,
            type: 'deposit_rejected',
            message: `❌ Payment rejected. ${reason || 'Please contact support for details.'}`,
            depositId: deposit.id
        });

        res.json({
            success: true,
            message: 'Deposit rejected successfully',
            data: deposit
        });

    } catch (error) {
        console.error('Error rejecting deposit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject deposit',
            error: error.message
        });
    }
});

module.exports = router;
```

#### **3. Create User Routes File**
Create `routes/users.js`:

```javascript
const express = require('express');
const router = express.Router();

// Update user level after deposit approval
router.put('/update-level/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { level, depositAmount, taskAccess } = req.body;

        // Find or create user
        let user = await User.findOne({ where: { id } });
        
        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                id,
                level,
                taskAccess: taskAccess || true,
                totalDeposited: depositAmount || 0
            });
        } else {
            // Update existing user
            await user.update({
                level,
                taskAccess: taskAccess !== undefined ? taskAccess : true,
                totalDeposited: (user.totalDeposited || 0) + (depositAmount || 0),
                lastUpdated: new Date()
            });
        }

        res.json({
            success: true,
            message: 'User level updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Error updating user level:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user level',
            error: error.message
        });
    }
});

module.exports = router;
```

#### **4. Create Notifications Routes File**
Create `routes/notifications.js`:

```javascript
const express = require('express');
const router = express.Router();

// Get user notifications
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to recent notifications
        });

        res.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByPk(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.update({ isRead: true });

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

module.exports = router;
```

#### **5. Update Main Server File**
In your main `server.js` or `app.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['https://buttuura.github.io', 'http://localhost:3000', 'http://127.0.0.1:8000'],
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const depositRoutes = require('./routes/deposits');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

// Use routes
app.use('/api/deposits', depositRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

## 🚀 **Quick Setup Options**

### **Option A: Add to Existing Render Service**
1. Clone your existing Render backend repository
2. Add the routes files above
3. Update your main server file
4. Deploy to Render

### **Option B: Use Database as a Service**
If you prefer a simpler setup, you can use:
- **Supabase** (PostgreSQL)
- **Firebase Firestore** 
- **MongoDB Atlas**
- **PlanetScale** (MySQL)

### **Option C: Serverless Functions**
- **Vercel Functions**
- **Netlify Functions** 
- **Render Functions**

---

## ✅ **Testing the API**

Once deployed, test with:

```bash
# Test deposit submission
curl -X POST https://getcash-backend-1.onrender.com/api/deposits/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "userName": "Test User",
    "phone": "+256700123456",
    "amount": 50000,
    "level": "intern",
    "levelDisplayName": "Intern Level",
    "accountName": "Test User",
    "accountPhone": "+256700123456"
  }'

# Test getting deposits (admin)
curl https://getcash-backend-1.onrender.com/api/deposits/requests

# Test notifications
curl https://getcash-backend-1.onrender.com/api/notifications/user/test123
```

---

## 🎯 **Next Steps**

1. **Choose your setup method** (existing service, new service, or serverless)
2. **Implement the database schema**
3. **Add the API routes**
4. **Deploy and test**
5. **Your frontend will automatically connect!**

Your frontend is already configured to use these endpoints, so once the backend is ready, everything will work seamlessly!

Would you like me to help you with any specific setup method or do you need help with database configuration?