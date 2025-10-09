/**
 * GetCash Login with API Service - True Cross-Device Access
 */

class LoginControllerAPI {
    constructor() {
        this.form = null;
        this.phoneField = null;
        this.passwordField = null;
        this.rememberCheckbox = null;
        this.loginButton = null;
        this.togglePasswordBtn = null;
        
        this.init();
    }
    
    /**
     * Initialize the login page
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }
    
    /**
     * Setup DOM elements and event listeners
     */
    setupElements() {
        // Get DOM elements
        this.form = document.querySelector('.login-form');
        this.phoneField = document.getElementById('phone');
        this.passwordField = document.getElementById('password');
        this.rememberCheckbox = document.getElementById('remember');
        this.loginButton = document.querySelector('.login-btn');
        this.togglePasswordBtn = document.querySelector('.toggle-password');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved phone if exists
        this.loadSavedCredentials();
        
        // Check if user is already logged in
        this.checkExistingAuth();
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => this.togglePassword());
        }
        
        // Real-time validation
        if (this.phoneField) {
            this.phoneField.addEventListener('blur', () => this.validatePhone());
            this.phoneField.addEventListener('input', () => this.clearFieldError(this.phoneField));
        }
        
        if (this.passwordField) {
            this.passwordField.addEventListener('input', () => this.clearFieldError(this.passwordField));
        }
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Get form data
        const formData = {
            phone: this.phoneField.value.trim(),
            password: this.passwordField.value,
            remember: this.rememberCheckbox?.checked || false
        };
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Perform login using API service for cross-device access
            const result = await this.performAPILogin(formData);
            
            if (result.success) {
                this.handleLoginSuccess(formData, result.user);
            } else {
                this.handleLoginError(result.message || 'Invalid phone number or password. Please try again.');
            }
        } catch (error) {
            console.error('Login process error:', error);
            this.handleLoginError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Perform login using API service (cross-device) with fallback
     */
    async performAPILogin(formData) {
        try {
            console.log('Attempting API login for cross-device access...');
            
            // First try API service (Render.com backend)
            if (window.APIService) {
                const result = await window.APIService.loginUser(formData.phone, formData.password);
                console.log('API Login result:', result);
                
                if (result.success) {
                    // Sync user data for immediate access
                    await window.APIService.syncUserData();
                    
                    return {
                        success: true,
                        user: result.user,
                        message: result.message,
                        isAPILogin: true
                    };
                } else {
                    console.log('API login failed, trying local fallback...');
                }
            }
            
            // Fallback to local database if API fails
            console.log('Using local database fallback...');
            if (window.UserDB) {
                const localResult = window.UserDB.loginUser(formData.phone, formData.password);
                if (localResult.success) {
                    return {
                        success: true,
                        user: localResult.user,
                        message: 'Logged in locally (device-specific)',
                        isAPILogin: false
                    };
                }
            }
            
            return { success: false, message: 'Invalid phone number or password' };
            
        } catch (error) {
            console.error('API Login error:', error);
            
            // Try local fallback on error
            if (window.UserDB) {
                const localResult = window.UserDB.loginUser(formData.phone, formData.password);
                if (localResult.success) {
                    return {
                        success: true,
                        user: localResult.user,
                        message: 'Logged in locally (API unavailable)',
                        isAPILogin: false
                    };
                }
            }
            
            return { 
                success: false, 
                message: 'Login failed due to system error' 
            };
        }
    }
    
    /**
     * Check if user is already authenticated
     */
    async checkExistingAuth() {
        try {
            // Only redirect if authenticated, do not auto-login after sign out
            if (window.APIService && window.APIService.isAuthenticated()) {
                console.log('Found API authentication, syncing user data...');
                const syncResult = await window.APIService.syncUserData();
                if (syncResult.success) {
                    this.showMessage('You are already logged in. Redirecting...', 'info');
                    setTimeout(() => {
                        window.location.href = 'Welcomepage.html';
                    }, 1500);
                    return;
                }
            }
            // Check local session
            if (window.UserDB && window.UserDB.isLoggedIn()) {
                console.log('Found local session');
                this.showMessage('You are already logged in locally. Redirecting...', 'info');
                setTimeout(() => {
                    window.location.href = 'Welcomepage.html';
                }, 1500);
            }
            // If not authenticated, stay on login page and do not auto-login
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
    
    /**
     * Handle successful login
     */
    handleLoginSuccess(formData, user) {
        // Save credentials if remember me is checked
        if (formData.remember) {
            localStorage.setItem('getcash_remember_phone', formData.phone);
        } else {
            localStorage.removeItem('getcash_remember_phone');
        }
        
        // Save user profile data for profile page
        if (user) {
            const profileData = {
                name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || formData.phone,
                email: user.email || '',
                level: user.level || 'intern',
                memberSince: user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                status: user.isActive ? 'active' : 'inactive',
                joinDate: user.joinDate || new Date().toISOString()
            };
            
            // Save to localStorage for profile page
            localStorage.setItem('userData', JSON.stringify(profileData));
            localStorage.setItem('userLevel', profileData.level);
            localStorage.setItem('userPhone', profileData.phone);
            localStorage.setItem('isLoggedIn', 'true');
            
            // Save or load financial data
            if (!localStorage.getItem('financialData')) {
                const financialData = {
                    accountBalance: user.balance || 0,
                    totalEarned: user.totalEarned || 0,
                    todayEarnings: 0,
                    taskEarnings: 0,
                    totalDeposited: 0,
                    availableWithdrawal: 0,
                    pendingWithdrawal: 0,
                    lastDepositAmount: 0,
                    levelBonus: 0,
                    referralBonus: 0
                };
                
                localStorage.setItem('financialData', JSON.stringify(financialData));
            }
            
            console.log('Profile data loaded for user:', profileData.name);
        }
        
        // Show personalized success message with cross-device info
        const deviceInfo = window.APIService && window.APIService.isAuthenticated() ? 
            'Your account is synced across all devices!' : 
            'Logged in locally on this device.';
            
        const welcomeMessage = user ? 
            `Welcome back, ${user.firstName}! ${deviceInfo} Redirecting to your dashboard...` : 
            'Login successful! Redirecting...';
            
        this.showMessage(welcomeMessage, 'success');
        
        // Start auto-sync if using API
        if (window.APIService && window.APIService.isAuthenticated()) {
            window.APIService.startAutoSync(5); // Sync every 5 minutes
        }
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'Welcomepage.html';
        }, 2000);
    }
    
    /**
     * Handle login error
     */
    handleLoginError(message) {
        this.showMessage(message, 'error');
        
        // Clear password field
        if (this.passwordField) {
            this.passwordField.value = '';
        }
        
        // Focus on phone field
        if (this.phoneField) {
            this.phoneField.focus();
        }
    }
    
    /**
     * Validate the entire form
     */
    validateForm() {
        let isValid = true;
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Validate phone number
        if (!this.phoneField.value.trim()) {
            this.showFieldError(this.phoneField, 'Phone number is required');
            isValid = false;
        } else if (!this.isValidPhone(this.phoneField.value.trim())) {
            this.showFieldError(this.phoneField, 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Validate password
        if (!this.passwordField.value) {
            this.showFieldError(this.passwordField, 'Password is required');
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Validate phone field
     */
    validatePhone() {
        const phone = this.phoneField.value.trim();
        
        if (phone && !this.isValidPhone(phone)) {
            this.showFieldError(this.phoneField, 'Please enter a valid phone number');
            return false;
        } else if (phone) {
            this.showFieldSuccess(this.phoneField);
            return true;
        }
        
        return true;
    }
    
    /**
     * Check if phone format is valid
     */
    isValidPhone(phone) {
        // Allow various phone formats: +256700000000, 256700000000, 0700000000, 700000000
        const phoneRegex = /^(\+?256|0)?[0-9]{9,10}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    /**
     * Toggle password visibility
     */
    togglePassword() {
        if (!this.passwordField || !this.togglePasswordBtn) return;
        
        const type = this.passwordField.type === 'password' ? 'text' : 'password';
        this.passwordField.type = type;
        
        // Update toggle button icon
        this.togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
    }
    
    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        if (!this.loginButton) return;
        
        if (isLoading) {
            this.loginButton.disabled = true;
            this.loginButton.innerHTML = `
                <span class="btn-text">Signing In...</span>
                <span class="btn-icon">⏳</span>
            `;
        } else {
            this.loginButton.disabled = false;
            this.loginButton.innerHTML = `
                <span class="btn-text">Sign In</span>
                <span class="btn-icon">→</span>
            `;
        }
    }
    
    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color: #f44336; font-size: 12px; margin-top: 4px;';
        
        field.parentNode.appendChild(errorDiv);
    }
    
    /**
     * Show field success
     */
    showFieldSuccess(field) {
        field.classList.remove('error');
        field.classList.add('success');
        
        // Remove error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error', 'success');
        
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
    
    /**
     * Clear all errors
     */
    clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }
    
    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.querySelector('.login-message');
        
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'login-message';
            
            if (this.form) {
                this.form.appendChild(messageEl);
            }
        }
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#ff9800'
        };
        
        messageEl.style.cssText = `
            padding: 12px;
            margin: 16px 0;
            border-radius: 6px;
            text-align: center;
            font-weight: 500;
            background-color: ${colors[type]};
            color: white;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        messageEl.textContent = message;
        
        // Trigger animation
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto-hide after 5 seconds for non-success messages
        if (type !== 'success') {
            setTimeout(() => {
                if (messageEl) {
                    messageEl.style.opacity = '0';
                    setTimeout(() => messageEl.remove(), 300);
                }
            }, 5000);
        }
    }
    
    /**
     * Load saved credentials
     */
    loadSavedCredentials() {
        const savedPhone = localStorage.getItem('getcash_remember_phone');
        
        if (savedPhone && this.phoneField) {
            this.phoneField.value = savedPhone;
            
            if (this.rememberCheckbox) {
                this.rememberCheckbox.checked = true;
            }
            
            // Focus on password field if phone is pre-filled
            if (this.passwordField) {
                this.passwordField.focus();
            }
        }
    }
}

// Initialize login controller when DOM is loaded
new LoginControllerAPI();