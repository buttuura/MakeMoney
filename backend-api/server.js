const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: [
        'https://buttuura.github.io',
        'https://getcash-admin.netlify.app',
        'http://localhost:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage (replace with real database)
let deposits = [];
let users = [];
let notifications = [];
let depositIdCounter = 1;
let notificationIdCounter = 1;

// Generate unique IDs
const generateDepositId = () => `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ===== DEPOSIT ROUTES =====

// Submit deposit request
app.post('/api/deposits/submit', (req, res) => {
    try {
        console.log('Deposit submission received:', req.body);
        
        const {
            userId, userName, phone, email, amount, level,
            levelDisplayName, accountName, accountPhone, screenshot
        } = req.body;

        // Validate required fields
        if (!userId || !userName || !phone || !amount || !level) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['userId', 'userName', 'phone', 'amount', 'level']
            });
        }

        // Create deposit record
        const deposit = {
            id: generateDepositId(),
            userId,
            userName,
            phone,
            email: email || '',
            amount: parseFloat(amount),
            level,
            levelDisplayName: levelDisplayName || level,
            accountName: accountName || userName,
            accountPhone: accountPhone || phone,
            screenshot: screenshot || '',
            status: 'pending',
            adminNotes: '',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            rejectedAt: null
        };

        deposits.push(deposit);

        console.log('Deposit created:', deposit.id);

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
app.get('/api/deposits/requests', (req, res) => {
    try {
        const { status } = req.query;
        
        let filteredDeposits = deposits;
        if (status) {
            filteredDeposits = deposits.filter(d => d.status === status);
        }

        // Sort by creation date (newest first)
        filteredDeposits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`Returning ${filteredDeposits.length} deposits (status: ${status || 'all'})`);

        res.json({
            success: true,
            data: filteredDeposits,
            total: filteredDeposits.length
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
app.put('/api/deposits/approve/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        console.log('Approving deposit:', id);

        // Find deposit
        const depositIndex = deposits.findIndex(d => d.id === id);
        if (depositIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        // Update deposit status
        deposits[depositIndex] = {
            ...deposits[depositIndex],
            status: 'approved',
            approvedAt: new Date().toISOString(),
            adminNotes: adminNotes || 'Approved by admin'
        };

        const deposit = deposits[depositIndex];

        // Create notification for user
        const notification = {
            id: notificationIdCounter++,
            userId: deposit.userId,
            type: 'deposit_approved',
            message: `✅ Payment approved! Your ${deposit.levelDisplayName} has been activated.`,
            depositId: deposit.id,
            read: false,
            createdAt: new Date().toISOString()
        };

        notifications.push(notification);

        console.log('Deposit approved and notification created:', notification.id);

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
app.put('/api/deposits/reject/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        console.log('Rejecting deposit:', id);

        // Find deposit
        const depositIndex = deposits.findIndex(d => d.id === id);
        if (depositIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        // Update deposit status
        deposits[depositIndex] = {
            ...deposits[depositIndex],
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            adminNotes: reason || 'Rejected by admin'
        };

        const deposit = deposits[depositIndex];

        // Create notification for user
        const notification = {
            id: notificationIdCounter++,
            userId: deposit.userId,
            type: 'deposit_rejected',
            message: `❌ Payment rejected. ${reason || 'Please contact support for details.'}`,
            depositId: deposit.id,
            read: false,
            createdAt: new Date().toISOString()
        };

        notifications.push(notification);

        console.log('Deposit rejected and notification created:', notification.id);

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

// ===== USER ROUTES =====

// Update user level after deposit approval
app.put('/api/users/update-level/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { level, depositAmount, taskAccess } = req.body;

        console.log('Updating user level:', id, { level, depositAmount, taskAccess });

        // Find or create user
        let userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            // Create new user
            const newUser = {
                id,
                level,
                taskAccess: taskAccess !== undefined ? taskAccess : true,
                totalDeposited: parseFloat(depositAmount) || 0,
                totalEarned: 0,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            users.push(newUser);
            
            res.json({
                success: true,
                message: 'User created and level updated successfully',
                data: newUser
            });
        } else {
            // Update existing user
            users[userIndex] = {
                ...users[userIndex],
                level,
                taskAccess: taskAccess !== undefined ? taskAccess : true,
                totalDeposited: (users[userIndex].totalDeposited || 0) + (parseFloat(depositAmount) || 0),
                lastUpdated: new Date().toISOString()
            };

            res.json({
                success: true,
                message: 'User level updated successfully',
                data: users[userIndex]
            });
        }

    } catch (error) {
        console.error('Error updating user level:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user level',
            error: error.message
        });
    }
});

// ===== NOTIFICATION ROUTES =====

// Get user notifications
app.get('/api/notifications/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;

        console.log('Fetching notifications for user:', userId);

        // Filter notifications for this user
        const userNotifications = notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50); // Limit to 50 recent notifications

        console.log(`Found ${userNotifications.length} notifications for user ${userId}`);

        res.json({
            success: true,
            data: userNotifications
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
app.put('/api/notifications/read/:id', (req, res) => {
    try {
        const { id } = req.params;

        console.log('Marking notification as read:', id);

        // Find notification
        const notificationIndex = notifications.findIndex(n => n.id === parseInt(id));
        if (notificationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Mark as read
        notifications[notificationIndex].read = true;

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

// ===== UTILITY ROUTES =====

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        deposits: deposits.length,
        users: users.length,
        notifications: notifications.length
    });
});

// Get system stats (for debugging)
app.get('/api/stats', (req, res) => {
    res.json({
        deposits: {
            total: deposits.length,
            pending: deposits.filter(d => d.status === 'pending').length,
            approved: deposits.filter(d => d.status === 'approved').length,
            rejected: deposits.filter(d => d.status === 'rejected').length
        },
        users: users.length,
        notifications: {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length
        }
    });
});

// Clear all data (for testing - remove in production)
app.post('/api/clear-all', (req, res) => {
    deposits = [];
    users = [];
    notifications = [];
    depositIdCounter = 1;
    notificationIdCounter = 1;
    
    res.json({ 
        success: true, 
        message: 'All data cleared' 
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 GetCash Backend API Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
});

module.exports = app;