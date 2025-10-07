const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'getcash-secret-key-2025';

// Rate limiter
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 10, // Number of requests
    duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'https://buttuura.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({ 
            success: false, 
            message: 'Too many requests. Please try again later.' 
        });
    }
});

// In-memory database (for simplicity - in production, use PostgreSQL/MongoDB)
let users = [
    {
        id: 'admin_001',
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: 'admin@getcash.com',
        phone: '+256700000000',
        password: '$2a$10$8K1p/a0dclxKD4Vm5rNhLOe0d9X2qNKc5ZQ0zY1PvZ5xJrGj6NqeG', // admin123
        level: 'Admin',
        role: 'admin',
        balance: 1000000,
        totalEarned: 0,
        tasksCompleted: 0,
        joinDate: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        isVerified: true,
        settings: {
            notifications: true,
            emailUpdates: true,
            smsAlerts: false
        },
        statistics: {
            loginCount: 0,
            totalTimeSpent: 0,
            favoriteLevel: 'Admin'
        }
    }
];

// Helper functions
function generateUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `user_${timestamp}_${random}`;
}

function findUserByPhone(phone) {
    return users.find(user => user.phone === phone.trim());
}

function findUserById(id) {
    return users.find(user => user.id === id);
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
}

// Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'GetCash API is running!',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/user/profile',
            updateProfile: 'PUT /api/user/profile',
            balance: 'GET /api/user/balance',
            updateBalance: 'POST /api/user/balance',
            users: 'GET /api/admin/users'
        }
    });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if phone number already exists
        if (findUserByPhone(phone)) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            id: generateUserId(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            fullName: `${firstName.trim()} ${lastName.trim()}`,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            level: 'Intern',
            role: 'user',
            balance: 0,
            totalEarned: 0,
            tasksCompleted: 0,
            joinDate: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            isVerified: false,
            settings: {
                notifications: true,
                emailUpdates: true,
                smsAlerts: false
            },
            statistics: {
                loginCount: 0,
                totalTimeSpent: 0,
                favoriteLevel: 'Intern'
            }
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, phone: newUser.phone, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and password are required'
            });
        }

        // Find user
        const user = findUserByPhone(phone);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid phone number or password'
            });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        user.statistics.loginCount += 1;

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, phone: user.phone, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { firstName, lastName, email, settings } = req.body;

        // Update user data
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (firstName && lastName) user.fullName = `${firstName.trim()} ${lastName.trim()}`;
        if (email) user.email = email.toLowerCase().trim();
        if (settings) user.settings = { ...user.settings, ...settings };

        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user balance
app.get('/api/user/balance', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            balance: user.balance,
            totalEarned: user.totalEarned,
            level: user.level,
            tasksCompleted: user.tasksCompleted
        });

    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user balance
app.post('/api/user/balance', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { amount, type, description } = req.body;
        
        if (!amount || !type) {
            return res.status(400).json({
                success: false,
                message: 'Amount and type are required'
            });
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Update balance based on type
        if (type === 'add') {
            user.balance += numAmount;
            user.totalEarned += numAmount;
        } else if (type === 'subtract') {
            if (user.balance < numAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }
            user.balance -= numAmount;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Use "add" or "subtract"'
            });
        }

        res.json({
            success: true,
            message: `Balance ${type === 'add' ? 'added' : 'deducted'} successfully`,
            balance: user.balance,
            totalEarned: user.totalEarned,
            transaction: {
                amount: numAmount,
                type,
                description: description || `Balance ${type}`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Balance update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, (req, res) => {
    try {
        // Check if user is admin
        const requestingUser = findUserById(req.user.userId);
        if (!requestingUser || requestingUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const usersWithoutPasswords = users.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            users: usersWithoutPasswords,
            totalUsers: users.length
        });

    } catch (error) {
        console.error('Admin users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 GetCash API server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/`);
    console.log(`🌐 CORS enabled for GitHub Pages`);
});

module.exports = app;