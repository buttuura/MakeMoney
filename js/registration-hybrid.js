// Hybrid Registration Controller for Local/Cloud Sync

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.querySelector('.registration-form');
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };
        if (!validateForm(formData)) {
            return;
        }
        let result;
        try {
            if (window.CloudDB && window.CloudDB.registerUserCloud) {
                result = await window.CloudDB.registerUserCloud(formData);
            } else {
                throw new Error('CloudDB not available');
            }
        } catch (err) {
            result = window.UserDB.registerUser(formData);
            if (result.success) {
                result.user.unsynced = true;
                if (window.UserDB.markUnsyncedUser) {
                    window.UserDB.markUnsyncedUser(result.user);
                }
            }
        }
        if (result.success) {
            showAlert('Success', `Welcome ${result.user.fullName}! Account created. ${result.user.unsynced ? 'Saved locally, will sync when online.' : 'Synced to cloud. You can now sign in from ANY device.'}`, 'success', function() {
                window.location.href = 'index.html';
            });
        } else {
            showAlert('Registration Failed', result.message, 'error');
        }
    });

    // Sync unsynced users when network/API is available
    async function syncLocalUsersToCloud() {
        if (window.CloudDB && window.UserDB && window.UserDB.getUnsyncedUsers) {
            const unsyncedUsers = window.UserDB.getUnsyncedUsers();
            for (const user of unsyncedUsers) {
                try {
                    const cloudResult = await window.CloudDB.registerUserCloud(user);
                    if (cloudResult.success) {
                        window.UserDB.markUserSynced(user.phone);
                        console.log('User synced to cloud:', user.phone);
                    }
                } catch (err) {
                    console.warn('Sync failed for user:', user.phone);
                }
            }
        }
    }
    setInterval(syncLocalUsersToCloud, 30000);
});

function validateForm(data) {
    for (let key in data) {
        if (!data[key]) {
            showAlert('Validation Error', 'Please fill in all fields.', 'error');
            return false;
        }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showAlert('Validation Error', 'Please enter a valid email address.', 'error');
        return false;
    }
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(data.phone) || data.phone.length < 10) {
        showAlert('Validation Error', 'Please enter a valid phone number.', 'error');
        return false;
    }
    if (data.password.length < 6) {
        showAlert('Validation Error', 'Password must be at least 6 characters long.', 'error');
        return false;
    }
    if (data.password !== data.confirmPassword) {
        showAlert('Validation Error', 'Passwords do not match.', 'error');
        return false;
    }
    return true;
}

function showAlert(title, message, type = 'info', callback = null) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.style.cssText = `position: fixed;top: 0;left: 0;width: 100%;height: 100%;background: rgba(0, 0, 0, 0.5);display: flex;justify-content: center;align-items: center;z-index: 10000;`;
    const alertBox = document.createElement('div');
    alertBox.className = 'alert-box';
    alertBox.style.cssText = `background: white;padding: 20px;border-radius: 10px;box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);max-width: 400px;width: 90%;text-align: center;animation: slideIn 0.3s ease-out;`;
    const colors = {success: '#4CAF50',error: '#f44336',info: '#2196F3',warning: '#ff9800'};
    alertBox.innerHTML = `<div style="color: ${colors[type]}; font-size: 24px; margin-bottom: 10px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div><h3 style="margin: 0 0 10px 0; color: #333;">${title}</h3><p style="margin: 0 0 20px 0; color: #666;">${message}</p><button id="alertOkButton" style="background: ${colors[type]}; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">OK</button>`;
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    const okButton = document.getElementById('alertOkButton');
    if (okButton) {
        okButton.addEventListener('click', function() {
            overlay.remove();
            if (callback && typeof callback === 'function') {
                callback();
            }
        });
    }
    if (!document.getElementById('alertStyles')) {
        const style = document.createElement('style');
        style.id = 'alertStyles';
        style.textContent = `@keyframes slideIn {from { transform: translateY(-50px); opacity: 0; }to { transform: translateY(0); opacity: 1; }}`;
        document.head.appendChild(style);
    }
}

function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    if (!passwordField) return;
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
}
