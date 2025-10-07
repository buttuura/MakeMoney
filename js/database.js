/**
 * GetCash User Database Manager
 * Handles user registration, login, and data management using localStorage
 */

class UserDatabase {
    constructor() {
        this.dbName = 'getcash_users';
        this.sessionKey = 'getcash_session';
        this.init();
    }

    /**
     * Initialize the database
     */
    init() {
        // Create initial database structure if it doesn't exist
        if (!localStorage.getItem(this.dbName)) {
            this.createInitialDatabase();
        }
    }

    /**
     * Create initial database with sample admin user
     */
    createInitialDatabase() {
        const initialUsers = [
            {
                id: 'admin_001',
                firstName: 'Admin',
                lastName: 'User',
                fullName: 'Admin User',
                email: 'admin@getcash.com',
                phone: '+256700000000',
                password: 'admin123',
                level: 'Admin',
                role: 'admin',
                balance: 1000000,
                totalEarned: 0,
                tasksCompleted: 0,
                joinDate: new Date().toISOString(),
                lastLogin: null,
                isActive: true,
                isVerified: true,
                profilePicture: null,
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

        this.saveUsers(initialUsers);
        console.log('User database initialized with admin user');
    }

    /**
     * Generate unique user ID
     */
    generateUserId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `user_${timestamp}_${random}`;
    }

    /**
     * Get all users from database
     */
    getUsers() {
        try {
            const users = localStorage.getItem(this.dbName);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error reading users from database:', error);
            return [];
        }
    }

    /**
     * Save users to database
     */
    saveUsers(users) {
        try {
            localStorage.setItem(this.dbName, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error saving users to database:', error);
            return false;
        }
    }

    /**
     * Register a new user
     */
    registerUser(userData) {
        try {
            const users = this.getUsers();
            
            // Check if email already exists
            if (this.findUserByEmail(userData.email)) {
                return { success: false, message: 'Email already exists' };
            }

            // Generate unique user ID
            const userId = this.generateUserId();

            // Create user object with complete data structure
            const newUser = {
                id: userId,
                firstName: userData.firstName.trim(),
                lastName: userData.lastName.trim(),
                fullName: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
                email: userData.email.toLowerCase().trim(),
                phone: userData.phone.trim(),
                password: userData.password, // In real app, this should be hashed
                level: 'Intern', // Default level
                role: 'user',
                balance: 0,
                totalEarned: 0,
                tasksCompleted: 0,
                joinDate: new Date().toISOString(),
                lastLogin: null,
                isActive: true,
                isVerified: false,
                profilePicture: null,
                settings: {
                    notifications: true,
                    emailUpdates: userData.newsletter || false,
                    smsAlerts: false
                },
                statistics: {
                    loginCount: 0,
                    totalTimeSpent: 0,
                    favoriteLevel: 'Intern'
                }
            };

            // Add user to database
            users.push(newUser);
            
            if (this.saveUsers(users)) {
                console.log('User registered successfully:', newUser.email);
                return { 
                    success: true, 
                    message: 'User registered successfully',
                    user: { ...newUser, password: undefined } // Don't return password
                };
            } else {
                return { success: false, message: 'Failed to save user data' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed due to system error' };
        }
    }

    /**
     * Authenticate user login
     */
    loginUser(email, password) {
        try {
            const user = this.findUserByEmail(email);
            
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (!user.isActive) {
                return { success: false, message: 'Account is deactivated' };
            }

            if (user.password !== password) {
                return { success: false, message: 'Invalid password' };
            }

            // Update last login and statistics
            user.lastLogin = new Date().toISOString();
            user.statistics.loginCount += 1;
            
            // Update user in database
            this.updateUser(user);

            // Create session
            const session = {
                userId: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                level: user.level,
                loginTime: new Date().toISOString(),
                isActive: true
            };

            // Save session
            sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
            sessionStorage.setItem('getcash_logged_in', 'true');
            sessionStorage.setItem('getcash_user_email', user.email);
            sessionStorage.setItem('getcash_user_id', user.id);
            sessionStorage.setItem('getcash_user_name', user.fullName);
            sessionStorage.setItem('getcash_user_level', user.level);

            console.log('User logged in successfully:', user.email);
            return { 
                success: true, 
                message: 'Login successful',
                user: { ...user, password: undefined }, // Don't return password
                session: session
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed due to system error' };
        }
    }

    /**
     * Find user by email
     */
    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Find user by ID
     */
    findUserById(userId) {
        const users = this.getUsers();
        return users.find(user => user.id === userId);
    }

    /**
     * Update user data
     */
    updateUser(updatedUser) {
        try {
            const users = this.getUsers();
            const userIndex = users.findIndex(user => user.id === updatedUser.id);
            
            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }

            users[userIndex] = { ...users[userIndex], ...updatedUser };
            
            if (this.saveUsers(users)) {
                return { success: true, message: 'User updated successfully' };
            } else {
                return { success: false, message: 'Failed to update user' };
            }
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Update failed due to system error' };
        }
    }

    /**
     * Get current logged-in user
     */
    getCurrentUser() {
        try {
            const session = sessionStorage.getItem(this.sessionKey);
            if (!session) return null;

            const sessionData = JSON.parse(session);
            const user = this.findUserById(sessionData.userId);
            
            return user ? { ...user, password: undefined } : null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        const session = sessionStorage.getItem(this.sessionKey);
        const isLoggedIn = sessionStorage.getItem('getcash_logged_in') === 'true';
        return session && isLoggedIn;
    }

    /**
     * Logout user
     */
    logoutUser() {
        try {
            // Clear session data
            sessionStorage.removeItem(this.sessionKey);
            sessionStorage.removeItem('getcash_logged_in');
            sessionStorage.removeItem('getcash_user_email');
            sessionStorage.removeItem('getcash_user_id');
            sessionStorage.removeItem('getcash_user_name');
            sessionStorage.removeItem('getcash_user_level');
            
            console.log('User logged out successfully');
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Logout failed' };
        }
    }

    /**
     * Get user statistics
     */
    getUserStats() {
        const users = this.getUsers();
        return {
            totalUsers: users.length,
            activeUsers: users.filter(user => user.isActive).length,
            verifiedUsers: users.filter(user => user.isVerified).length,
            adminUsers: users.filter(user => user.role === 'admin').length,
            levelDistribution: {
                intern: users.filter(user => user.level === 'Intern').length,
                level1: users.filter(user => user.level === 'Level 1 Worker').length,
                level2: users.filter(user => user.level === 'Senior Worker').length,
                level3: users.filter(user => user.level === 'Expert Worker').length
            }
        };
    }

    /**
     * Export user data (for admin purposes)
     */
    exportUserData() {
        const users = this.getUsers();
        return users.map(user => ({
            ...user,
            password: '***hidden***' // Hide passwords in export
        }));
    }

    /**
     * Delete user account
     */
    deleteUser(userId) {
        try {
            const users = this.getUsers();
            const filteredUsers = users.filter(user => user.id !== userId);
            
            if (filteredUsers.length === users.length) {
                return { success: false, message: 'User not found' };
            }

            if (this.saveUsers(filteredUsers)) {
                return { success: true, message: 'User deleted successfully' };
            } else {
                return { success: false, message: 'Failed to delete user' };
            }
        } catch (error) {
            console.error('Delete user error:', error);
            return { success: false, message: 'Delete failed due to system error' };
        }
    }
}

// Create global instance
window.UserDB = new UserDatabase();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDatabase;
}