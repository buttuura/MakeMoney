/**
 * GetCash API Service - Connects to Render.com backend
 * Enables true cross-device user synchronization
 */

class APIService {
    constructor() {
        // This will be your Render.com backend URL
        this.baseURL = 'https://getcash-backend.onrender.com'; // Update after deployment
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
            const response = await this.makeRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success && response.token) {
                this.setToken(response.token);
            }

            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            return {
                success: false,
                message: error.message || 'Registration failed'
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
}

// Create global instance
window.APIService = new APIService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}