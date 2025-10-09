// Admin Approval Controller

class AdminApprovalController {
    constructor() {
        this.pendingApprovals = [];
        this.allApprovals = [];
        this.selectedApprovals = new Set();
        this.currentModal = null;
        
        // Use Render.com backend instead of GitHub
        this.apiService = new APIService();
        
        this.init();
    }
    
    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPage());
        } else {
            await this.setupPage();
        }
    }
    
    async setupPage() {
        this.setupEventListeners();
        await this.loadApprovals();
        this.updateStats();
        // Auto-refresh every 10 seconds
        setInterval(async () => {
            await this.loadApprovals();
            this.updateStats();
        }, 10000);
    }


    
    setupEventListeners() {
        // Bulk selection checkbox
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-checkbox')) {
                this.handleSelection(e.target);
            }
        });
        
        // Modal click outside to close
        document.getElementById('approvalModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }
    
    async loadApprovals() {
        try {
            this.showLoading(true);
            
            // Load deposit requests from Render backend
            const response = await this.apiService.getDepositRequests();
            const deposits = response.data || [];
            
            if (deposits && deposits.length > 0) {
                this.allApprovals = deposits;
                this.showNotification('✅ Deposit requests loaded successfully!', 'success');
            } else {
                this.allApprovals = [];
                this.showNotification('📋 No deposit requests found. Waiting for users to submit deposits.', 'info');
            }
            
            this.pendingApprovals = this.allApprovals.filter(item => item.status === 'pending');
            this.displayApprovals();
            
        } catch (error) {
            console.error('Error loading approvals:', error);
            
            // If API fails, show empty state
            this.allApprovals = [];
            this.pendingApprovals = [];
            this.displayApprovals();
            this.showNotification('❌ API connection failed. Check if backend server is running.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    

    
    displayApprovals() {
        const container = document.getElementById('approvalsList');
        const currentFilter = document.getElementById('statusFilter').value;
        const levelFilter = document.getElementById('levelFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        let filteredApprovals = this.allApprovals;
        
        // Apply filters
        if (currentFilter !== 'all') {
            filteredApprovals = filteredApprovals.filter(item => item.status === currentFilter);
        }
        
        if (levelFilter !== 'all') {
            filteredApprovals = filteredApprovals.filter(item => item.level === levelFilter);
        }
        
        if (dateFilter !== 'all') {
            const now = new Date();
            filteredApprovals = filteredApprovals.filter(item => {
                const itemDate = new Date(item.submittedAt);
                switch (dateFilter) {
                    case 'today':
                        return itemDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return itemDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return itemDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }
        
        if (searchTerm) {
            filteredApprovals = filteredApprovals.filter(item =>
                item.userId.toLowerCase().includes(searchTerm) ||
                item.userName.toLowerCase().includes(searchTerm) ||
                item.phone.includes(searchTerm) ||
                item.email.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filteredApprovals.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        document.getElementById('emptyState').style.display = 'none';
        
        container.innerHTML = filteredApprovals.map(approval => `
            <div class="approval-item ${approval.status}" data-id="${approval.id}">
                <div class="approval-header">
                    <div class="user-info">
                        <div class="user-avatar">
                            ${approval.userName.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-details">
                            <h4>${approval.userName}</h4>
                            <p>${approval.userId} • ${approval.phone}</p>
                        </div>
                    </div>
                    <div class="status-badge status-${approval.status}">
                        ${approval.status}
                    </div>
                </div>
                
                <div class="approval-details">
                    <div class="detail-group">
                        <h5>Investment Level</h5>
                        <div class="level-info">
                            <span class="level-badge level-${approval.level}">${approval.levelDisplayName}</span>
                        </div>
                    </div>
                    <div class="detail-group">
                        <h5>Amount</h5>
                        <p>UGX ${approval.amount.toLocaleString()}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Payment Method</h5>
                        <p>${approval.paymentMethod}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Transaction ID</h5>
                        <p>${approval.transactionId}</p>
                    </div>
                    <div class="detail-group">
                        <h5>Submitted</h5>
                        <p>${this.formatDate(approval.submittedAt)}</p>
                    </div>
                    ${approval.status !== 'pending' ? `
                        <div class="detail-group">
                            <h5>${approval.status === 'approved' ? 'Approved' : 'Rejected'}</h5>
                            <p>${this.formatDate(approval.status === 'approved' ? approval.approvedAt : approval.rejectedAt)}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="payment-info">
                    <div class="payment-method">
                        <div class="payment-icon">💳</div>
                        <div>
                            <strong>${approval.paymentMethod}</strong>
                            <p style="margin: 0; font-size: 0.85rem; color: #666;">Transaction: ${approval.transactionId}</p>
                        </div>
                    </div>
                </div>
                
                <div class="approval-actions">
                    ${approval.status === 'pending' ? `
                        <label class="select-checkbox">
                            <input type="checkbox" value="${approval.id}"> Select
                        </label>
                    ` : ''}
                    <button class="action-btn btn-view" onclick="viewApproval('${approval.id}')">
                        👁️ View Details
                    </button>
                    ${approval.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="quickApprove('${approval.id}')">
                            ✅ Approve
                        </button>
                        <button class="action-btn btn-reject" onclick="quickReject('${approval.id}')">
                            ❌ Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    updateStats() {
        const pending = this.allApprovals.filter(item => item.status === 'pending').length;
        const today = new Date().toDateString();
        const approvedToday = this.allApprovals.filter(item => 
            item.status === 'approved' && new Date(item.approvedAt).toDateString() === today
        ).length;
        const rejectedToday = this.allApprovals.filter(item => 
            item.status === 'rejected' && new Date(item.rejectedAt).toDateString() === today
        ).length;
        const totalRevenue = this.allApprovals
            .filter(item => item.status === 'approved')
            .reduce((sum, item) => sum + item.amount, 0);
        
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approvedToday;
        document.getElementById('rejectedCount').textContent = rejectedToday;
        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString();
    }
    
    handleSelection(checkbox) {
        const approvalId = checkbox.value;
        
        if (checkbox.checked) {
            this.selectedApprovals.add(approvalId);
        } else {
            this.selectedApprovals.delete(approvalId);
        }
        
        // Update bulk action buttons
        const approveBtn = document.querySelector('.approve-all');
        const rejectBtn = document.querySelector('.reject-all');
        const hasSelection = this.selectedApprovals.size > 0;
        
        approveBtn.disabled = !hasSelection;
        rejectBtn.disabled = !hasSelection;
    }
    
    async viewApproval(approvalId) {
        const approval = this.allApprovals.find(item => item.id === approvalId);
        if (!approval) return;
        
        this.currentModal = approval;
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="approval-detail-view">
                <div class="user-profile">
                    <div class="user-avatar large">
                        ${approval.userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-info">
                        <h3>${approval.userName}</h3>
                        <p><strong>User ID:</strong> ${approval.userId}</p>
                        <p><strong>Phone:</strong> ${approval.phone}</p>
                        <p><strong>Email:</strong> ${approval.email}</p>
                    </div>
                </div>
                
                <div class="deposit-details">
                    <h4>Deposit Information</h4>
                    <div class="detail-grid">
                        <div><strong>Level:</strong> ${approval.levelDisplayName}</div>
                        <div><strong>Amount:</strong> UGX ${approval.amount.toLocaleString()}</div>
                        <div><strong>Payment Method:</strong> ${approval.paymentMethod}</div>
                        <div><strong>Transaction ID:</strong> ${approval.transactionId}</div>
                        <div><strong>Status:</strong> <span class="status-badge status-${approval.status}">${approval.status}</span></div>
                        <div><strong>Submitted:</strong> ${this.formatDate(approval.submittedAt)}</div>
                        ${approval.status === 'approved' ? `<div><strong>Approved:</strong> ${this.formatDate(approval.approvedAt)}</div>` : ''}
                        ${approval.status === 'rejected' ? `<div><strong>Rejected:</strong> ${this.formatDate(approval.rejectedAt)}</div>` : ''}
                    </div>
                </div>
                
                <div class="payment-screenshot">
                    <h4>Payment Screenshot</h4>
                    <img src="${approval.screenshot}" alt="Payment Screenshot" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e1e5e9;">
                </div>
                
                ${approval.adminNotes ? `
                    <div class="admin-notes">
                        <h4>Admin Notes</h4>
                        <p>${approval.adminNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Update modal title and footer based on status
        document.getElementById('modalTitle').textContent = `Review Deposit - ${approval.userName}`;
        
        const modalFooter = document.querySelector('.modal-footer');
        if (approval.status === 'pending') {
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="rejectDeposit()">Reject</button>
                <button class="btn btn-success" onclick="approveDeposit()">Approve</button>
            `;
        } else {
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            `;
        }
        
        document.getElementById('approvalModal').style.display = 'block';
    }
    
    async approveDeposit() {
        if (!this.currentModal) return;
        
        try {
            const approval = this.currentModal;
            approval.status = 'approved';
            approval.approvedAt = new Date().toISOString();
            approval.adminNotes = 'Approved by admin';
            
            // Debug logging
            console.log('Approving deposit:', approval);
            console.log('Deposit ID:', approval.id || approval.timestamp);
            
            // Approve via API service
            const depositId = approval.id || approval.timestamp;
            if (!depositId) {
                throw new Error('No deposit ID found for approval');
            }
            
            await this.apiService.approveDepositRequest(depositId, 'Approved by admin');
            
            // Update user level via API
            await this.apiService.updateUserLevel(approval.userId, approval.level, approval.amount);
            
            this.showNotification(`Deposit approved for ${approval.userName}. Task access activated.`, 'success');
            this.closeModal();
            this.displayApprovals();
            this.updateStats();
            
        } catch (error) {
            console.error('Error approving deposit:', error);
            
            this.showNotification(`❌ Failed to approve deposit for ${approval.userName}. Error: ${error.message}`, 'error');
            console.error('Approval error details:', error);
        }
    }
    
    async rejectDeposit() {
        if (!this.currentModal) return;
        
        const reason = prompt('Enter rejection reason (optional):');
        
        try {
            const approval = this.currentModal;
            const depositId = approval.id || approval.timestamp;
            const adminNotes = reason ? `Rejected: ${reason}` : 'Rejected by admin';
            
            // Reject via API service
            await this.apiService.rejectDepositRequest(depositId, adminNotes);
            
            this.showNotification(`Deposit rejected for ${approval.userName}.`, 'info');
            this.closeModal();
            this.displayApprovals();
            this.updateStats();
            
        } catch (error) {
            console.error('Error rejecting deposit:', error);
            this.showNotification(`❌ Failed to reject deposit. Error: ${error.message}`, 'error');
        }
    }
    

    
    closeModal() {
        document.getElementById('approvalModal').style.display = 'none';
        this.currentModal = null;
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
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
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    

}

// Global functions
async function refreshApprovals() {
    if (window.adminController) {
        await window.adminController.loadApprovals();
        window.adminController.updateStats();
        window.adminController.showNotification('Approvals refreshed successfully!', 'success');
    }
}

function filterApprovals() {
    if (window.adminController) {
        window.adminController.displayApprovals();
    }
}

function viewApproval(id) {
    if (window.adminController) {
        window.adminController.viewApproval(id);
    }
}

async function quickApprove(id) {
    if (window.adminController) {
        const approval = window.adminController.allApprovals.find(item => item.id === id);
        if (approval && confirm(`Approve deposit for ${approval.userName}?`)) {
            window.adminController.currentModal = approval;
            await window.adminController.approveDeposit();
        }
    }
}

async function quickReject(id) {
    if (window.adminController) {
        const approval = window.adminController.allApprovals.find(item => item.id === id);
        if (approval && confirm(`Reject deposit for ${approval.userName}?`)) {
            window.adminController.currentModal = approval;
            await window.adminController.rejectDeposit();
        }
    }
}

function bulkApprove() {
    if (window.adminController && window.adminController.selectedApprovals.size > 0) {
        if (confirm(`Approve ${window.adminController.selectedApprovals.size} selected deposits?`)) {
            // Implement bulk approval logic
            window.adminController.showNotification('Bulk approval feature coming soon!', 'info');
        }
    }
}

function bulkReject() {
    if (window.adminController && window.adminController.selectedApprovals.size > 0) {
        if (confirm(`Reject ${window.adminController.selectedApprovals.size} selected deposits?`)) {
            // Implement bulk rejection logic
            window.adminController.showNotification('Bulk rejection feature coming soon!', 'info');
        }
    }
}

function closeModal() {
    if (window.adminController) {
        window.adminController.closeModal();
    }
}

function approveDeposit() {
    if (window.adminController) {
        window.adminController.approveDeposit();
    }
}

function rejectDeposit() {
    if (window.adminController) {
        window.adminController.rejectDeposit();
    }
}

// Initialize controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminController = new AdminApprovalController();
});