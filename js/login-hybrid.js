// Hybrid Login Controller for Local/Cloud Sync
class LoginController {
    constructor() {
        this.form = null;
        this.phoneField = null;
        this.passwordField = null;
        this.rememberCheckbox = null;
        this.loginButton = null;
        this.togglePasswordBtn = null;
        this.currentUser = null;
        this.init();
        setInterval(() => this.syncLocalLoginsToCloud(), 30000);
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.form = document.querySelector('.login-form');
        this.phoneField = document.getElementById('phone');
        this.passwordField = document.getElementById('password');
        this.rememberCheckbox = document.getElementById('remember');
        this.loginButton = document.querySelector('.login-btn');
        this.togglePasswordBtn = document.querySelector('.toggle-password');
        this.setupEventListeners();
        this.loadSavedCredentials();
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => this.togglePassword());
        }
        if (this.phoneField) {
            this.phoneField.addEventListener('blur', () => this.validatePhone());
            this.phoneField.addEventListener('input', () => this.clearFieldError(this.phoneField));
        }
        if (this.passwordField) {
            this.passwordField.addEventListener('input', () => this.clearFieldError(this.passwordField));
        }
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) {
            return;
        }
        const formData = {
            phone: this.phoneField.value.trim(),
            password: this.passwordField.value,
            remember: this.rememberCheckbox?.checked || false
        };
        this.setLoadingState(true);
        try {
            const result = await this.performLogin(formData);
            if (result.success) {
                this.handleLoginSuccess(formData, result.user);
            } else {
                this.handleLoginError(result.message || 'Invalid phone or password. Please try again.');
            }
        } catch (error) {
            console.error('Login process error:', error);
            this.handleLoginError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async performLogin(formData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            let result;
            try {
                if (window.CloudDB && window.CloudDB.loginUserCloud) {
                    result = await window.CloudDB.loginUserCloud(formData.phone, formData.password);
                } else {
                    throw new Error('CloudDB not available');
                }
            } catch (err) {
                result = window.UserDB.loginUser(formData.phone, formData.password);
                if (result.success && window.UserDB.markUnsyncedLogin) {
                    window.UserDB.markUnsyncedLogin(result.user);
                }
            }
            if (result.success) {
                this.currentUser = result.user;
                return { success: true, user: result.user, message: result.message };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed due to system error' };
        }
    }

    async syncLocalLoginsToCloud() {
        if (window.CloudDB && window.UserDB && window.UserDB.getUnsyncedLogins) {
            const unsyncedLogins = window.UserDB.getUnsyncedLogins();
            for (const user of unsyncedLogins) {
                try {
                    const cloudResult = await window.CloudDB.loginUserCloud(user.phone, user.password);
                    if (cloudResult.success) {
                        window.UserDB.markLoginSynced(user.phone);
                        console.log('Login synced to cloud:', user.phone);
                    }
                } catch (err) {
                    console.warn('Sync failed for login:', user.phone);
                }
            }
        }
    }

    handleLoginSuccess(formData, user) {
        if (formData.remember) {
            localStorage.setItem('getcash_remember_phone', formData.phone);
        } else {
            localStorage.removeItem('getcash_remember_phone');
        }
        const welcomeMessage = user ? `Welcome back, ${user.firstName}! Redirecting to your dashboard...` : 'Login successful! Redirecting...';
        this.showMessage(welcomeMessage, 'success');
        setTimeout(() => {
            window.location.href = 'Welcomepage.html';
        }, 1500);
    }

    handleLoginError(message) {
        this.showMessage(message, 'error');
        if (this.form) {
            this.form.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                this.form.style.animation = '';
            }, 500);
        }
    }

    validateForm() {
        let isValid = true;
        this.clearAllErrors();
        if (!this.phoneField.value.trim()) {
            this.showFieldError(this.phoneField, 'Phone number is required');
            isValid = false;
        } else if (!this.isValidPhone(this.phoneField.value.trim())) {
            this.showFieldError(this.phoneField, 'Please enter a valid phone number');
            isValid = false;
        }
        if (!this.passwordField.value) {
            this.showFieldError(this.passwordField, 'Password is required');
            isValid = false;
        } else if (this.passwordField.value.length < 6) {
            this.showFieldError(this.passwordField, 'Password must be at least 6 characters');
            isValid = false;
        }
        return isValid;
    }

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

    isValidPhone(phone) {
        const phoneRegex = /^(\+?256|0)?[0-9]{9,10}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    togglePassword() {
        if (!this.passwordField || !this.togglePasswordBtn) return;
        const isPassword = this.passwordField.type === 'password';
        this.passwordField.type = isPassword ? 'text' : 'password';
        this.togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
        this.togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        this.passwordField.focus();
    }

    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message visible';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }

    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('visible');
        }
    }

    clearFieldError(field) {
        field.classList.remove('error', 'success');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('visible');
        }
    }

    clearAllErrors() {
        const fields = [this.phoneField, this.passwordField];
        fields.forEach(field => {
            if (field) {
                this.clearFieldError(field);
            }
        });
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.message-popup');
        existingMessages.forEach(msg => msg.remove());
        const messageElement = document.createElement('div');
        messageElement.className = `message-popup message-${type}`;
        messageElement.textContent = message;
        this.styleMessage(messageElement, type);
        document.body.appendChild(messageElement);
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => messageElement.remove(), 300);
            }
        }, 4000);
    }

    styleMessage(element, type) {
        Object.assign(element.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px',
            textAlign: 'center',
            transition: 'all 0.3s ease'
        });
        const colors = {
            success: {
                background: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb'
            },
            error: {
                background: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb'
            },
            info: {
                background: '#d1ecf1',
                color: '#0c5460',
                border: '1px solid #bee5eb'
            }
        };
        const colorScheme = colors[type] || colors.info;
        Object.assign(element.style, colorScheme);
    }

    setLoadingState(isLoading) {
        if (!this.loginButton) return;
        if (isLoading) {
            this.loginButton.classList.add('loading');
            this.loginButton.disabled = true;
            const btnIcon = this.loginButton.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.textContent = '⟳';
            }
        } else {
            this.loginButton.classList.remove('loading');
            this.loginButton.disabled = false;
            const btnIcon = this.loginButton.querySelector('.btn-icon');
            if (btnIcon) {
                btnIcon.textContent = '→';
            }
        }
    }

    loadSavedCredentials() {
        const savedPhone = localStorage.getItem('getcash_remember_phone');
        if (savedPhone && this.phoneField) {
            this.phoneField.value = savedPhone;
            if (this.rememberCheckbox) {
                this.rememberCheckbox.checked = true;
            }
            if (this.passwordField) {
                this.passwordField.focus();
            }
        }
    }

    handleKeyboard(e) {
        if (e.key === 'Enter' && (e.target === this.phoneField || e.target === this.passwordField)) {
            e.preventDefault();
            this.handleSubmit(e);
        }
        if (e.key === 'Escape') {
            this.clearForm();
        }
    }

    clearForm() {
        if (this.phoneField) this.phoneField.value = '';
        if (this.passwordField) this.passwordField.value = '';
        if (this.rememberCheckbox) this.rememberCheckbox.checked = false;
        this.clearAllErrors();
        if (this.phoneField) {
            this.phoneField.focus();
        }
    }
}

// Add shake animation CSS
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Initialize login controller when page loads
window.loginController = new LoginController();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginController;
}
