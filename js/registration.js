document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.querySelector('.registration-form');
    
    registrationForm.addEventListener('submit', function(e) {
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
        
        // Create user account
        const userData = {
            id: Date.now().toString(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            level: 'Intern',
            balance: 0,
            totalEarned: 0,
            tasksCompleted: 0,
            joinDate: new Date().toISOString(),
            isActive: true
        };
        
        // Save user data using UserDatabase
        try {
            // Register user using the database system
            const result = window.UserDB.registerUser(formData);
            
            if (result.success) {
                // Show success message with user info
                showAlert('Success', `Welcome ${result.user.fullName}! Account created successfully. You can now sign in with your email: ${result.user.email}`, 'success', function() {
                    // Redirect to login page
                    window.location.href = 'index.html';
                });
            } else {
                // Show error message
                showAlert('Registration Failed', result.message, 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Error', 'Failed to create account. Please try again.', 'error');
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
    
    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.phone) || data.phone.length < 10) {
        showAlert('Validation Error', 'Please enter a valid phone number.', 'error');
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
        max-width: 400px;
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
        <p style="margin: 0 0 20px 0; color: #666;">${message}</p>
        <button onclick="this.closest('.alert-overlay').remove(); ${callback ? callback.toString() + '()' : ''}" 
                style="background: ${colors[type]}; color: white; border: none; padding: 10px 20px; 
                       border-radius: 5px; cursor: pointer; font-size: 16px;">
            OK
        </button>
    `;
    
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    
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