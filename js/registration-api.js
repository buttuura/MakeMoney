document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.querySelector('.registration-form');
    
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };
        
        // Validation
        if (!validateForm(formData)) {
            return;
        }
        
        // Show loading state
        const submitButton = document.querySelector('.register-btn');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="btn-text">Creating Account...</span><span class="btn-icon">⏳</span>';
        submitButton.disabled = true;
        
        // Register user using API service for true cross-device access
        try {
            console.log('Registering with API Service for cross-device access...');
            console.log('APIService available:', !!window.APIService);
            console.log('Backend URL:', window.APIService ? window.APIService.baseURL : 'N/A');
            
            // First try API service (Render.com backend)
            let result;
            if (window.APIService) {
                console.log('Attempting API registration...');
                result = await window.APIService.registerUser(formData);
                console.log('API Registration result:', result);
                
                if (!result || !result.success) {
                    // If API fails, fall back to local storage
                    console.log('API registration failed, error:', result ? result.message : 'Unknown error');
                    console.log('Falling back to local storage...');
                    result = window.UserDB.registerUser(formData);
                    console.log('Local storage registration result:', result);
                }
            } else {
                // No API service available, use local storage
                console.log('No API service available, using local storage...');
                result = window.UserDB.registerUser(formData);
            }
            
            if (result.success) {
                const isAPIRegistration = result.token ? true : false;
                const deviceMessage = isAPIRegistration ? 
                    'Your account is now available on ALL devices! Login from anywhere with your phone number.' :
                    'Account created locally. For cross-device access, ensure API backend is available.';
                
                // Save user profile data for profile page
                const profileData = {
                    name: result.user.fullName || `${formData.firstName} ${formData.lastName}`,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: result.user.phone || formData.phone,
                    email: result.user.email || formData.email,
                    level: result.user.level || 'intern',
                    memberSince: new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }),
                    status: 'active',
                    joinDate: result.user.joinDate || new Date().toISOString()
                };
                
                // Save to localStorage for profile page
                localStorage.setItem('userData', JSON.stringify(profileData));
                localStorage.setItem('userLevel', profileData.level);
                localStorage.setItem('userPhone', profileData.phone);
                
                // Initialize default financial data
                const financialData = {
                    accountBalance: 0,
                    totalEarned: 0,
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
                
                console.log('Profile data saved for user:', profileData.name);
                
                // Show success message
                showAlert('Success', 
                    `Welcome ${result.user.fullName}! Account created successfully.\n\n${deviceMessage}\n\nPhone: ${result.user.phone}`, 
                    'success', 
                    function() {
                        // Redirect to login page
                        window.location.href = 'index.html';
                    }
                );
            } else {
                // Show error message
                showAlert('Registration Failed', result.message, 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Error', 'Failed to create account. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });
});

function validateForm(data) {
    // Check if all fields are filled
    for (let key in data) {
        if (!data[key]) {
            showAlert('Validation Error', 'Please fill in all fields.', 'error');
            return false;
        }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showAlert('Validation Error', 'Please enter a valid email address.', 'error');
        return false;
    }
    
    // Validate phone number (Uganda formats)
    const phoneRegex = /^(\+?256|0)?[0-9]{9,10}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        showAlert('Validation Error', 'Please enter a valid Uganda phone number (+256XXXXXXXXX or 07XXXXXXXX).', 'error');
        return false;
    }
    
    // Validate password strength
    if (data.password.length < 6) {
        showAlert('Validation Error', 'Password must be at least 6 characters long.', 'error');
        return false;
    }
    
    // Check if passwords match
    if (data.password !== data.confirmPassword) {
        showAlert('Validation Error', 'Passwords do not match.', 'error');
        return false;
    }
    
    return true;
}

function showAlert(title, message, type = 'info', callback = null) {
    // Create alert overlay
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    // Create alert box
    const alertBox = document.createElement('div');
    alertBox.className = 'alert-box';
    alertBox.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        text-align: center;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set color based on type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    alertBox.innerHTML = `
        <div style="color: ${colors[type]}; font-size: 24px; margin-bottom: 10px;">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <h3 style="margin: 0 0 10px 0; color: #333;">${title}</h3>
        <p style="margin: 0 0 20px 0; color: #666; white-space: pre-line;">${message}</p>
        <button id="alertOkButton" 
                style="background: ${colors[type]}; color: white; border: none; padding: 10px 20px; 
                       border-radius: 5px; cursor: pointer; font-size: 16px;">
            OK
        </button>
    `;
    
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    
    // Add event listener for OK button
    const okButton = document.getElementById('alertOkButton');
    if (okButton) {
        okButton.addEventListener('click', function() {
            overlay.remove();
            if (callback && typeof callback === 'function') {
                callback();
            }
        });
    }
    
    // Add CSS animation
    if (!document.getElementById('alertStyles')) {
        const style = document.createElement('style');
        style.id = 'alertStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    const toggleBtn = event.target;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        if (confirmPasswordField) confirmPasswordField.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        if (confirmPasswordField) confirmPasswordField.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}