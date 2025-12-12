// Utility functions for Hotel Management System

// Toast notification system
class ToastManager {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// Modal management
class ModalManager {
    static show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    static hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    static create(modalId, content) {
        const container = document.getElementById('modal-container');
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = content;
        container.appendChild(modal);
        return modal;
    }
    
    static destroy(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
}

// API helper with error handling and rate limiting
class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.requestQueue = new Map();
        this.rateLimits = {
            general: 30, // 30 requests per minute
            write: 10    // 10 write operations per minute
        };
        this.requestCounts = {
            general: [],
            write: []
        };
    }
    
    // Check rate limits
    checkRateLimit(type = 'general') {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Clean old requests
        this.requestCounts[type] = this.requestCounts[type].filter(time => time > oneMinuteAgo);
        
        // Check if limit exceeded
        if (this.requestCounts[type].length >= this.rateLimits[type]) {
            const oldestRequest = Math.min(...this.requestCounts[type]);
            const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
        }
        
        // Add current request
        this.requestCounts[type].push(now);
    }
    
    async request(endpoint, options = {}) {
        try {
            // Check rate limits
            const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET');
            this.checkRateLimit(isWriteOperation ? 'write' : 'general');
            
            // Prevent duplicate requests
            const requestKey = `${options.method || 'GET'}-${endpoint}-${JSON.stringify(options.body || {})}`;
            
            // Create request promise
            const requestPromise = this.executeRequest(endpoint, options);
            
            // Store in queue and clean up after completion
            this.requestQueue.set(requestKey, requestPromise);
            requestPromise.finally(() => {
                this.requestQueue.delete(requestKey);
            });
            
            return requestPromise;
        } catch (error) {
            console.error('API Error:', error);
            ToastManager.show(error.message, 'error');
            throw error;
        }
    }
    
    async executeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            let error;
            try {
                error = await response.json();
            } catch (e) {
                // If response is not JSON, use status text
                error = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle success response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            // If not JSON, return text or throw error
            const text = await response.text();
            if (text.startsWith('<')) {
                throw new Error('Server returned HTML instead of JSON - check API configuration');
            }
            return text;
        }
    }
    
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url);
    }
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Form validation
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    
    static validateRequired(fields) {
        const errors = [];
        fields.forEach(field => {
            if (!field.value || field.value.trim() === '') {
                errors.push(`${field.name} is required`);
            }
        });
        return errors;
    }
    
    static showError(field, message) {
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const error = document.createElement('div');
        error.className = 'error-message';
        error.style.color = 'var(--danger-color)';
        error.style.fontSize = '0.875rem';
        error.style.marginTop = '0.25rem';
        error.textContent = message;
        
        field.parentElement.appendChild(error);
        field.style.borderColor = 'var(--danger-color)';
    }
    
    static clearError(field) {
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }
}

// Date utilities
class DateUtils {
    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    static formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static isFuture(date) {
        return new Date(date) > new Date();
    }
    
    static isPast(date) {
        return new Date(date) < new Date();
    }
    
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    static getDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

// Currency utilities
class CurrencyUtils {
    static format(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    static calculateTotal(pricePerNight, nights) {
        return pricePerNight * nights;
    }
}

// Loading states
class LoadingManager {
    static show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
    }
    
    static hide(element, content) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element && content) {
            element.innerHTML = content;
        }
    }
}

// Debounce utility for frequent operations
class Debouncer {
    constructor() {
        this.timeouts = new Map();
    }
    
    debounce(key, func, delay = 300) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
        }
        
        const timeout = setTimeout(() => {
            func();
            this.timeouts.delete(key);
        }, delay);
        
        this.timeouts.set(key, timeout);
    }
    
    cancel(key) {
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
    }
}

// Create global instances
const debouncer = new Debouncer();
window.api = new ApiClient();
window.HotelUtils = {
    ToastManager,
    ModalManager,
    DateUtils,
    CurrencyUtils,
    FormValidator,
    LoadingManager,
    Debouncer: debouncer
};
