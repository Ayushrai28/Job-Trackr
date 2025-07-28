// JobTrackr - Job Application Tracker
// Main JavaScript functionality

class JobTracker {
    constructor() {
        this.jobs = this.loadJobsFromStorage();
        this.editingJobId = null;
        this.currentFilter = 'all';
        this.deleteJobId = null;
        
        this.initializeEventListeners();
        this.renderJobs();
        this.updateJobCount();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Form submission
        document.getElementById('jobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.dataset.filter);
            });
        });

        // Cancel edit button
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Modal event listeners
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Close modal when clicking outside
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.hideDeleteModal();
            }
        });

        // Keyboard accessibility for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideDeleteModal();
                this.cancelEdit();
            }
        });
    }

    // Handle form submission (add or edit job)
    handleFormSubmit() {
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        if (this.editingJobId) {
            this.updateJob(this.editingJobId, formData);
            this.showToast('Job application updated successfully!');
        } else {
            this.addJob(formData);
            this.showToast('Job application added successfully!');
        }

        this.resetForm();
        this.renderJobs();
        this.updateJobCount();
    }

    // Validate form inputs
    validateForm() {
        let isValid = true;
        const requiredFields = ['companyName', 'jobTitle', 'dateApplied', 'status'];
        
        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const value = field.value.trim();
            const errorElement = document.getElementById(fieldName.replace(/([A-Z])/g, '') + 'Error');

            if (!value) {
                errorElement.textContent = `${this.getFieldLabel(fieldName)} is required.`;
                isValid = false;
                field.focus();
            } else if (fieldName === 'dateApplied' && !this.isValidDate(value)) {
                errorElement.textContent = 'Please enter a valid date.';
                isValid = false;
            }
        });

        return isValid;
    }

    // Get field label for error messages
    getFieldLabel(fieldName) {
        const labels = {
            companyName: 'Company Name',
            jobTitle: 'Job Title',
            dateApplied: 'Date Applied',
            status: 'Status'
        };
        return labels[fieldName] || fieldName;
    }

    // Validate date input
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Get form data
    getFormData() {
        return {
            id: this.editingJobId || this.generateId(),
            companyName: document.getElementById('companyName').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            dateApplied: document.getElementById('dateApplied').value,
            status: document.getElementById('status').value,
            dateCreated: this.editingJobId ? 
                this.jobs.find(job => job.id === this.editingJobId)?.dateCreated : 
                new Date().toISOString()
        };
    }

    // Generate unique ID for jobs
    generateId() {
        return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add new job
    addJob(jobData) {
        this.jobs.unshift(jobData); // Add to beginning for newest first
        this.saveJobsToStorage();
    }

    // Update existing job
    updateJob(jobId, jobData) {
        const index = this.jobs.findIndex(job => job.id === jobId);
        if (index !== -1) {
            this.jobs[index] = { ...this.jobs[index], ...jobData };
            this.saveJobsToStorage();
        }
    }

    // Delete job
    deleteJob(jobId) {
        this.jobs = this.jobs.filter(job => job.id !== jobId);
        this.saveJobsToStorage();
        this.renderJobs();
        this.updateJobCount();
        this.showToast('Job application deleted successfully!');
    }

    // Edit job (populate form with job data)
    editJob(jobId) {
        const job = this.jobs.find(job => job.id === jobId);
        if (!job) return;

        this.editingJobId = jobId;
        
        // Populate form fields
        document.getElementById('companyName').value = job.companyName;
        document.getElementById('jobTitle').value = job.jobTitle;
        document.getElementById('dateApplied').value = job.dateApplied;
        document.getElementById('status').value = job.status;

        // Update form UI
        const submitBtn = document.querySelector('.btn-primary');
        const cancelBtn = document.getElementById('cancelEdit');
        
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Job';
        cancelBtn.style.display = 'inline-flex';

        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        // Focus first field
        document.getElementById('companyName').focus();
    }

    // Cancel edit mode
    cancelEdit() {
        this.editingJobId = null;
        this.resetForm();
        
        const submitBtn = document.querySelector('.btn-primary');
        const cancelBtn = document.getElementById('cancelEdit');
        
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Job';
        cancelBtn.style.display = 'none';
    }

    // Reset form
    resetForm() {
        document.getElementById('jobForm').reset();
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    // Handle filter changes
    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.renderJobs();
        this.updateJobCount();
    }

    // Show delete confirmation modal
    showDeleteModal(jobId) {
        this.deleteJobId = jobId;
        const modal = document.getElementById('deleteModal');
        modal.classList.add('show');
        document.getElementById('confirmDelete').focus();
    }

    // Hide delete confirmation modal
    hideDeleteModal() {
        this.deleteJobId = null;
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('show');
    }

    // Confirm delete action
    confirmDelete() {
        if (this.deleteJobId) {
            this.deleteJob(this.deleteJobId);
            this.hideDeleteModal();
        }
    }

    // Filter jobs based on current filter
    getFilteredJobs() {
        if (this.currentFilter === 'all') {
            return this.jobs;
        }
        return this.jobs.filter(job => job.status === this.currentFilter);
    }

    // Render jobs in the UI
    renderJobs() {
        const jobsList = document.getElementById('jobsList');
        const emptyState = document.getElementById('emptyState');
        const filteredJobs = this.getFilteredJobs();

        // Clear current jobs
        jobsList.innerHTML = '';

        if (filteredJobs.length === 0) {
            emptyState.style.display = 'block';
            jobsList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            jobsList.style.display = 'grid';
            
            filteredJobs.forEach((job, index) => {
                const jobCard = this.createJobCard(job, index);
                jobsList.appendChild(jobCard);
            });
        }
    }

    // Create job card element
    createJobCard(job, index) {
        const card = document.createElement('div');
        card.className = `job-card status-${job.status}`;
        card.style.animationDelay = `${index * 0.1}s`;

        const formattedDate = this.formatDate(job.dateApplied);
        const statusIcon = this.getStatusIcon(job.status);
        const statusLabel = this.getStatusLabel(job.status);

        card.innerHTML = `
            <div class="job-card-header">
                <div class="job-info">
                    <h4>${this.escapeHtml(job.companyName)}</h4>
                    <p>${this.escapeHtml(job.jobTitle)}</p>
                </div>
                <div class="job-actions">
                    <button class="btn btn-edit" onclick="jobTracker.editJob('${job.id}')" 
                            aria-label="Edit ${job.companyName} application">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete" onclick="jobTracker.showDeleteModal('${job.id}')"
                            aria-label="Delete ${job.companyName} application">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="job-details">
                <div class="job-date">
                    <i class="fas fa-calendar-alt"></i>
                    Applied on ${formattedDate}
                </div>
                <div class="status-badge status-${job.status}">
                    <i class="${statusIcon}"></i>
                    ${statusLabel}
                </div>
            </div>
        `;

        return card;
    }

    // Get status icon
    getStatusIcon(status) {
        const icons = {
            applied: 'fas fa-paper-plane',
            interview: 'fas fa-comments',
            offer: 'fas fa-handshake',
            rejected: 'fas fa-times-circle'
        };
        return icons[status] || 'fas fa-question-circle';
    }

    // Get status label
    getStatusLabel(status) {
        const labels = {
            applied: 'Applied',
            interview: 'Interview',
            offer: 'Offer',
            rejected: 'Rejected'
        };
        return labels[status] || status;
    }

    // Format date for display
    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update job count display
    updateJobCount() {
        const filteredJobs = this.getFilteredJobs();
        const count = filteredJobs.length;
        const countElement = document.getElementById('jobCount');
        
        let text;
        if (count === 0) {
            text = 'No applications';
        } else if (count === 1) {
            text = '1 application';
        } else {
            text = `${count} applications`;
        }

        if (this.currentFilter !== 'all') {
            const filterLabel = this.getStatusLabel(this.currentFilter).toLowerCase();
            text += ` (${filterLabel})`;
        }

        countElement.textContent = text;
    }

    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        const messageElement = document.getElementById('toastMessage');
        
        messageElement.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Save jobs to localStorage
    saveJobsToStorage() {
        try {
            localStorage.setItem('jobTracker_jobs', JSON.stringify(this.jobs));
        } catch (error) {
            console.error('Error saving jobs to localStorage:', error);
            this.showToast('Error saving data. Please try again.');
        }
    }

    // Load jobs from localStorage
    loadJobsFromStorage() {
        try {
            const storedJobs = localStorage.getItem('jobTracker_jobs');
            return storedJobs ? JSON.parse(storedJobs) : [];
        } catch (error) {
            console.error('Error loading jobs from localStorage:', error);
            return [];
        }
    }

    // Export jobs data (for backup/sharing)
    exportJobs() {
        const dataStr = JSON.stringify(this.jobs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'jobtracker_backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import jobs data
    importJobs(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedJobs = JSON.parse(e.target.result);
                if (Array.isArray(importedJobs)) {
                    this.jobs = importedJobs;
                    this.saveJobsToStorage();
                    this.renderJobs();
                    this.updateJobCount();
                    this.showToast('Jobs imported successfully!');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Error importing jobs:', error);
                this.showToast('Error importing file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    // Get statistics
    getStatistics() {
        const stats = {
            total: this.jobs.length,
            applied: this.jobs.filter(job => job.status === 'applied').length,
            interview: this.jobs.filter(job => job.status === 'interview').length,
            offer: this.jobs.filter(job => job.status === 'offer').length,
            rejected: this.jobs.filter(job => job.status === 'rejected').length
        };

        return stats;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.jobTracker = new JobTracker();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateApplied').value = today;

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('jobForm');
            if (document.activeElement && form.contains(document.activeElement)) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Add service worker for offline functionality (if supported)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }

    console.log('JobTrackr initialized successfully!');
});

// Handle page visibility change to save data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && window.jobTracker) {
        window.jobTracker.saveJobsToStorage();
    }
});

// Handle before unload to save data
window.addEventListener('beforeunload', () => {
    if (window.jobTracker) {
        window.jobTracker.saveJobsToStorage();
    }
});
