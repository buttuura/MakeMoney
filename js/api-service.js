/**
 * GetCash API Service - Connects to Render.com backend
 * Enables true cross-device user synchronization
 */

class APIService {
    constructor() {
        // This will be your Render.com backend URL
        this.baseURL = 'https://getcash-backend-1.onrender.com'; // Updated to new backend URL
        this.token = null;
        this.init();
    }

    /**
     * Initialize API service
     */
    init() {
        // Load stored token
        this.token = localStorage.getItem('getcash_api_token');
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('getcash_api_token', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('getcash_api_token');
    }

    /**
     * Get request headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make API request
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                ...options
            };

            console.log(`API Request: ${config.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Register user on backend (cross-device enabled)
     */
    async registerUser(userData) {
        try {
            console.log('API Service: Starting registration request...');
            console.log('API Service: Data to send:', userData);
            
            const response = await this.makeRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            console.log('API Service: Registration response received:', response);

            if (response.success && response.token) {
                console.log('API Service: Registration successful, saving token...');
                this.setToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('API Service: Registration failed with error:', error);
            console.error('API Service: Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            return {
                success: false,
                message: error.message || 'Registration failed - network or server error'
            };
        }
    }

    /**
     * Login user (works on any device)
     */
    async loginUser(phone, password) {
        try {
            const response = await this.makeRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ phone, password })
            });

            if (response.success && response.token) {
                this.setToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    }

    /**
     * Get user profile (synced across all devices)
     */
    async getUserProfile() {
        try {
            if (!this.token) {
                throw new Error('No authentication token');
            }

            const response = await this.makeRequest('/api/user/profile');
            return response;
        } catch (error) {
            console.error('Profile fetch failed:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch profile'
            };
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            if (!this.token) {
                throw new Error('No authentication token');
            }

            const response = await this.makeRequest('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            return response;
        } catch (error) {
            console.error('Profile update failed:', error);
            return {
                success: false,
                message: error.message || 'Failed to update profile'
            };
        }
    }

    /**
     * Get user balance (real-time across devices)
     */
    async getUserBalance() {
        try {
            if (!this.token) {
                throw new Error('No authentication token');
            }

            const response = await this.makeRequest('/api/user/balance');
            return response;
        } catch (error) {
            console.error('Balance fetch failed:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch balance'
            };
        }
    }

    /**
     * Update user balance (syncs to all devices instantly)
     */
    async updateBalance(amount, type, description) {
        try {
            if (!this.token) {
                throw new Error('No authentication token');
            }

            const response = await this.makeRequest('/api/user/balance', {
                method: 'POST',
                body: JSON.stringify({ amount, type, description })
            });

            return response;
        } catch (error) {
            console.error('Balance update failed:', error);
            return {
                success: false,
                message: error.message || 'Failed to update balance'
            };
        }
    }

    /**
     * Admin: Get all users
     */
    async getAllUsers() {
        try {
            if (!this.token) {
                throw new Error('No authentication token');
            }

            const response = await this.makeRequest('/api/admin/users');
            return response;
        } catch (error) {
            console.error('Users fetch failed:', error);
            return {
                success: false,
                message: error.message || 'Failed to fetch users'
            };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Logout user
     */
    logout() {
        this.clearToken();
        sessionStorage.clear();
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await fetch(this.baseURL);
            const data = await response.json();
            return {
                success: response.ok,
                message: data.message || 'API connection test',
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'API connection failed',
                error: error
            };
        }
    }

    /**
     * Sync user data across devices
     */
    async syncUserData() {
        try {
            if (!this.token) {
                return { success: false, message: 'Not authenticated' };
            }

            // Fetch latest user data from backend
            const profileResponse = await this.getUserProfile();
            const balanceResponse = await this.getUserBalance();

            if (profileResponse.success && balanceResponse.success) {
                // Store in session for immediate access
                sessionStorage.setItem('getcash_user_data', JSON.stringify(profileResponse.user));
                sessionStorage.setItem('getcash_balance_data', JSON.stringify(balanceResponse));

                return {
                    success: true,
                    message: 'User data synced successfully',
                    user: profileResponse.user,
                    balance: balanceResponse
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to sync user data'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Sync failed'
            };
        }
    }

    /**
     * Get cached user data
     */
    getCachedUserData() {
        const userData = sessionStorage.getItem('getcash_user_data');
        const balanceData = sessionStorage.getItem('getcash_balance_data');

        return {
            user: userData ? JSON.parse(userData) : null,
            balance: balanceData ? JSON.parse(balanceData) : null
        };
    }

    /**
     * Auto-sync in background
     */
    startAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            if (this.token) {
                await this.syncUserData();
                console.log('Background sync completed');
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // ===== DEPOSIT APPROVAL METHODS =====

    /**
     * Submit deposit request
     */
    async submitDepositRequest(depositData) {
        try {
            const response = await this.makeRequest('/api/deposits/submit', {
                method: 'POST',
                data: depositData
            });

            console.log('Deposit request submitted successfully:', response);
            return response;
        } catch (error) {
            console.error('Failed to submit deposit request:', error);
            throw error;
        }
    }

    /**
     * Get all deposit requests (admin)
     */
    async getDepositRequests(status = null) {
        try {
            let url = '/api/deposits/requests';
            if (status) {
                url += `?status=${status}`;
            }

            const response = await this.makeRequest(url, {
                method: 'GET'
            });

            console.log('Deposit requests loaded:', response);
            return response;
        } catch (error) {
            console.error('Failed to load deposit requests:', error);
            throw error;
        }
    }

    /**
     * Approve deposit request (admin)
     */
    async approveDepositRequest(depositId, adminNotes = '') {
        try {
            const response = await this.makeRequest(`/api/deposits/approve/${depositId}`, {
                method: 'PUT',
                data: { adminNotes }
            });

            console.log('Deposit approved successfully:', response);
            return response;
        } catch (error) {
            console.error('Failed to approve deposit:', error);
            throw error;
        }
    }

    /**
     * Reject deposit request (admin)
     */
    async rejectDepositRequest(depositId, reason = '') {
        try {
            const response = await this.makeRequest(`/api/deposits/reject/${depositId}`, {
                method: 'PUT',
                data: { reason }
            });

            console.log('Deposit rejected successfully:', response);
            return response;
        } catch (error) {
            console.error('Failed to reject deposit:', error);
            throw error;
        }
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId) {
        try {
            const response = await this.makeRequest(`/api/notifications/user/${userId}`, {
                method: 'GET'
            });

            console.log('User notifications loaded:', response);
            return response;
        } catch (error) {
            console.error('Failed to load user notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        try {
            const response = await this.makeRequest(`/api/notifications/read/${notificationId}`, {
                method: 'PUT'
            });

            console.log('Notification marked as read:', response);
            return response;
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    }

    /**
     * Update user level and access (after approval)
     */
    async updateUserLevel(userId, level, depositAmount) {
        try {
            const response = await this.makeRequest(`/api/users/update-level/${userId}`, {
                method: 'PUT',
                data: { 
                    level, 
                    depositAmount,
                    taskAccess: true 
                }
            });

            console.log('User level updated successfully:', response);
            return response;
        } catch (error) {
            console.error('Failed to update user level:', error);
            throw error;
        }
    }
}

// Create global instance
window.APIService = new APIService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}