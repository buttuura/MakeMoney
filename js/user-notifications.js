// User Notification System
// This script checks for deposit approval notifications and shows them to users

class UserNotificationChecker {
    constructor() {
        // Use Render.com backend instead of GitHub
        this.apiService = new APIService();
        this.checkInterval = 30000; // Check every 30 seconds
        this.isChecking = false;
    }

    async init() {
        // Check notifications on page load
        await this.checkForNotifications();
        
        // Set up periodic checking
        setInterval(() => {
            this.checkForNotifications();
        }, this.checkInterval);
    }

    async checkForNotifications() {
        if (this.isChecking) return;
        this.isChecking = true;

        try {
            const currentUser = localStorage.getItem('currentUser');
            const userPhone = localStorage.getItem('userPhone');
            
            if (!currentUser && !userPhone) {
                this.isChecking = false;
                return;
            }

            // Get notifications from API
            const notifications = await this.apiService.getUserNotifications(currentUser) || [];
            const unreadNotifications = notifications.filter(n => !n.read);

            for (const notification of unreadNotifications) {
                if (notification.type === 'deposit_approved') {
                    this.showDepositApprovedNotification(notification);
                    await this.apiService.markNotificationRead(notification.id);
                }
            }

        } catch (error) {
            console.error('Error checking notifications:', error);
        } finally {
            this.isChecking = false;
        }
    }

    showDepositApprovedNotification(notification) {
        // Update localStorage with new level
        if (notification.depositRequest) {
            localStorage.setItem('userLevel', notification.depositRequest.level);
            localStorage.setItem('taskAccess', 'true');
        }

        // Show success notification
        this.showNotification(notification.message, 'success', 6000);

        // Update UI if on specific pages
        this.updatePageUI(notification);
    }

    updatePageUI(notification) {
        // Update level display if present on current page
        const levelDisplay = document.querySelector('.user-level, .level-display, #userLevel');
        if (levelDisplay && notification.depositRequest) {
            levelDisplay.textContent = notification.depositRequest.levelDisplayName || 
                                       `Level ${notification.depositRequest.level}`;
        }

        // Enable task access buttons if present
        const taskButtons = document.querySelectorAll('.task-btn, .job-btn');
        taskButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });

        // Update balance if present
        const balanceDisplay = document.querySelector('.balance, #userBalance');
        if (balanceDisplay) {
            const currentBalance = parseFloat(balanceDisplay.textContent.replace(/[^\d.]/g, '')) || 0;
            balanceDisplay.textContent = `$${currentBalance}`;
        }
    }

    async markNotificationAsRead(notification) {
        try {
            const notifications = await this.loadFromGitHub('user_notifications.json') || [];
            const notificationIndex = notifications.findIndex(n => 
                n.userId === notification.userId && 
                n.createdAt === notification.createdAt
            );

            if (notificationIndex !== -1) {
                notifications[notificationIndex].read = true;
                await this.saveToGitHub('user_notifications.json', notifications);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `user-notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 18px;">×</button>
            </div>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '500',
            zIndex: '10001',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease'
        });
        
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'info': '#007bff',
            'warning': '#ffc107'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    // GitHub helper methods
    async loadFromGitHub(fileName) {
        try {
            const file = await this.getGitHubFile(fileName);
            if (file && file.content) {
                const decodedContent = atob(file.content);
                return JSON.parse(decodedContent);
            }
            return null;
        } catch (error) {
            console.error(`Error loading ${fileName} from GitHub:`, error);
            return null;
        }
    }

    async saveToGitHub(fileName, data) {
        try {
            const existingFile = await this.getGitHubFile(fileName);
            const content = btoa(JSON.stringify(data, null, 2));
            
            const requestBody = {
                message: `Update ${fileName}`,
                content: content
            };

            if (existingFile) {
                requestBody.sha = existingFile.sha;
            }

            const response = await fetch(`https://api.github.com/repos/${this.github.owner}/${this.github.repo}/contents/data/${fileName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.github.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error saving ${fileName} to GitHub:`, error);
            throw error;
        }
    }

    async getGitHubFile(fileName) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.github.owner}/${this.github.repo}/contents/data/${fileName}`, {
                headers: {
                    'Authorization': `token ${this.github.token}`
                }
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error getting ${fileName} from GitHub:`, error);
            return null;
        }
    }
}

// Initialize notification checker when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.userNotificationChecker = new UserNotificationChecker();
    window.userNotificationChecker.init();
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .user-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .user-notification:hover {
        transform: scale(1.02);
    }
`;
document.head.appendChild(notificationStyles);