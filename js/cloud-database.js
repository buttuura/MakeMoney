/**
 * GetCash Cloud Database Manager
 * Enables cross-device user authentication using GitHub as cloud storage
 */

class CloudDatabase {
    constructor() {
        this.repoOwner = 'buttuura';
        this.repoName = 'MakeMoney';
        this.dataFile = 'users-data.json';
        this.githubToken = null; // Will be set dynamically
        this.localDB = null;
        
        this.init();
    }

    /**
     * Initialize cloud database
     */
    async init() {
        // Get reference to local database
        this.localDB = window.UserDB;
        
        // Try to sync with cloud on startup
        await this.syncFromCloud();
    }

    /**
     * Get GitHub API headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add authorization if token is available
        if (this.githubToken) {
            headers['Authorization'] = `token ${this.githubToken}`;
        }
        
        return headers;
    }

    /**
     * Fetch users data from GitHub
     */
    async fetchCloudData() {
        try {
            const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataFile}`;
            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.status === 404) {
                // File doesn't exist yet, create it
                console.log('Cloud users file not found, will create on first sync');
                return [];
            }

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content.replace(/\s/g, ''));
            return JSON.parse(content);
        } catch (error) {
            console.error('Error fetching cloud data:', error);
            return null;
        }
    }

    /**
     * Save users data to GitHub
     */
    async saveCloudData(users) {
        try {
            const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.dataFile}`;
            
            // First, try to get the current file to get its SHA
            let sha = null;
            try {
                const currentFile = await fetch(url, { headers: this.getHeaders() });
                if (currentFile.ok) {
                    const currentData = await currentFile.json();
                    sha = currentData.sha;
                }
            } catch (e) {
                // File might not exist, that's okay
            }

            const content = btoa(JSON.stringify(users, null, 2));
            const payload = {
                message: `Update users data - ${new Date().toISOString()}`,
                content: content,
                ...(sha && { sha })
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to save to cloud: ${response.status}`);
            }

            console.log('Successfully synced users data to cloud');
            return true;
        } catch (error) {
            console.error('Error saving cloud data:', error);
            return false;
        }
    }

    /**
     * Sync local data with cloud
     */
    async syncFromCloud() {
        try {
            const cloudUsers = await this.fetchCloudData();
            
            if (cloudUsers && Array.isArray(cloudUsers)) {
                // Merge cloud data with local data
                const localUsers = this.localDB.getUsers();
                const mergedUsers = this.mergeUserData(localUsers, cloudUsers);
                
                // Update local storage
                this.localDB.saveUsers(mergedUsers);
                
                console.log(`Synced ${mergedUsers.length} users from cloud`);
                return true;
            }
        } catch (error) {
            console.error('Error syncing from cloud:', error);
        }
        return false;
    }

    /**
     * Sync local data to cloud
     */
    async syncToCloud() {
        try {
            const localUsers = this.localDB.getUsers();
            return await this.saveCloudData(localUsers);
        } catch (error) {
            console.error('Error syncing to cloud:', error);
            return false;
        }
    }

    /**
     * Merge local and cloud user data (cloud takes priority for conflicts)
     */
    mergeUserData(localUsers, cloudUsers) {
        const merged = [...cloudUsers];
        
        // Add local users that don't exist in cloud
        localUsers.forEach(localUser => {
            const existsInCloud = cloudUsers.find(cloudUser => 
                cloudUser.id === localUser.id || 
                cloudUser.email === localUser.email || 
                cloudUser.phone === localUser.phone
            );
            
            if (!existsInCloud) {
                merged.push(localUser);
            }
        });
        
        return merged;
    }

    /**
     * Register user with cloud sync
     */
    async registerUserCloud(userData) {
        try {
            // First register locally
            const result = this.localDB.registerUser(userData);
            
            if (result.success) {
                // Sync to cloud in background
                setTimeout(async () => {
                    await this.syncToCloud();
                }, 1000);
            }
            
            return result;
        } catch (error) {
            console.error('Cloud registration error:', error);
            return { success: false, message: 'Registration failed' };
        }
    }

    /**
     * Login user with cloud sync
     */
    async loginUserCloud(phone, password) {
        try {
            // First try to sync from cloud to get latest data
            await this.syncFromCloud();
            
            // Then attempt login
            const result = this.localDB.loginUser(phone, password);
            
            if (result.success) {
                // Update last login and sync to cloud
                setTimeout(async () => {
                    await this.syncToCloud();
                }, 1000);
            }
            
            return result;
        } catch (error) {
            console.error('Cloud login error:', error);
            return { success: false, message: 'Login failed' };
        }
    }

    /**
     * Check if user exists across devices
     */
    async findUserAcrossDevices(phone) {
        try {
            // Sync from cloud first
            await this.syncFromCloud();
            
            // Then check if user exists
            return this.localDB.findUserByPhone(phone);
        } catch (error) {
            console.error('Error finding user across devices:', error);
            return null;
        }
    }

    /**
     * Manual sync function for UI
     */
    async manualSync() {
        try {
            console.log('Starting manual sync...');
            
            // Sync from cloud first
            const syncDown = await this.syncFromCloud();
            
            // Then sync local changes to cloud
            const syncUp = await this.syncToCloud();
            
            return {
                success: syncDown || syncUp,
                message: syncDown && syncUp ? 'Full sync completed' : 
                        syncDown ? 'Downloaded cloud data' : 
                        syncUp ? 'Uploaded local data' : 'Sync failed'
            };
        } catch (error) {
            console.error('Manual sync error:', error);
            return { success: false, message: 'Sync failed' };
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            hasLocalData: localStorage.getItem('getcash_users') !== null,
            lastSync: localStorage.getItem('getcash_last_sync'),
            userCount: this.localDB.getUsers().length
        };
    }

    /**
     * Force cloud sync (admin function)
     */
    async forceCloudSync() {
        try {
            const users = this.localDB.getUsers();
            const result = await this.saveCloudData(users);
            
            if (result) {
                localStorage.setItem('getcash_last_sync', new Date().toISOString());
            }
            
            return result;
        } catch (error) {
            console.error('Force sync error:', error);
            return false;
        }
    }
}

// Create global cloud database instance
window.CloudDB = new CloudDatabase();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudDatabase;
}