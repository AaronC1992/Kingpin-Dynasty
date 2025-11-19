class ModalSystem {
    constructor() {
        this.activeModals = [];
        this.toastContainer = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        } else {
            this.toastContainer = document.querySelector('.toast-container');
        }
    }

    /**
     * Show a generic modal
     * @param {string} title - Modal title
     * @param {string} message - Modal body text (can be HTML)
     * @param {Array} buttons - Array of button objects {text, class, callback}
     * @param {boolean} hasInput - Whether to include an input field
     * @param {string} inputPlaceholder - Placeholder for input
     */
    show(title, message, buttons = [], hasInput = false, inputPlaceholder = '') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const container = document.createElement('div');
            container.className = 'modal-container';
            
            const header = document.createElement('div');
            header.className = 'modal-header';
            header.innerHTML = `<h3 class="modal-title">${this.stripEmoji(title)}</h3>`;
            
            const body = document.createElement('div');
            body.className = 'modal-body';
            body.innerHTML = this.stripEmoji(message);
            
            let inputElement = null;
            if (hasInput) {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.className = 'modal-input';
                inputElement.placeholder = inputPlaceholder;
                // Pre-fill with placeholder if it's a value (hacky but works for prompt default)
                if (inputPlaceholder && inputPlaceholder !== '') {
                    inputElement.value = inputPlaceholder;
                }
                body.appendChild(inputElement);
                
                // Focus input after a short delay
                setTimeout(() => inputElement.focus(), 100);
            }
            
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            
            // Default OK button if none provided
            if (buttons.length === 0) {
                buttons.push({
                    text: 'OK',
                    class: 'modal-btn-primary',
                    callback: () => true
                });
            }
            
            buttons.forEach(btnConfig => {
                const btn = document.createElement('button');
                btn.className = `modal-btn ${btnConfig.class || 'modal-btn-secondary'}`;
                btn.textContent = btnConfig.text;
                btn.onclick = () => {
                    const result = hasInput ? inputElement.value : (btnConfig.value !== undefined ? btnConfig.value : true);
                    
                    // If callback returns false, don't close modal
                    if (btnConfig.callback) {
                        const shouldClose = btnConfig.callback(result);
                        if (shouldClose === false) return;
                    }
                    
                    this.close(overlay);
                    resolve(result);
                };
                footer.appendChild(btn);
            });
            
            container.appendChild(header);
            container.appendChild(body);
            container.appendChild(footer);
            overlay.appendChild(container);
            
            document.body.appendChild(overlay);
            this.activeModals.push(overlay);
            
            // Handle Enter key for input
            if (hasInput && inputElement) {
                inputElement.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        // Find the primary button (usually Submit/Confirm)
                        const primaryBtn = Array.from(footer.querySelectorAll('button')).find(b => b.classList.contains('modal-btn-primary'));
                        if (primaryBtn) primaryBtn.click();
                    }
                });
            }
            
            // Close on overlay click (optional, maybe configurable)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && !hasInput) { // Don't auto-close input modals
                    this.close(overlay);
                    resolve(null);
                }
            });
        });
    }

    // Remove emoji and pictographic symbols for a cleaner, image-only UI
    stripEmoji(str) {
        if (!str) return str;
        try {
            // Remove emoji and variation selectors
            return str
                .replace(/\p{Extended_Pictographic}/gu, '')
                .replace(/\uFE0F/gu, '')
                .replace(/[\u2600-\u27BF]/g, '');
        } catch (e) {
            // Fallback for environments without Unicode property escapes
            return str.replace(/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '');
        }
    }

    close(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.activeModals = this.activeModals.filter(m => m !== overlay);
        }, 200);
    }

    /**
     * Replacement for alert()
     */
    alert(message, title = 'Word on the Street') {
        return this.show(title, message, [{
            text: 'Understood',
            class: 'modal-btn-primary',
            callback: () => true
        }]);
    }

    /**
     * Replacement for confirm()
     */
    confirm(message, title = 'Make a Choice') {
        return this.show(title, message, [
            {
                text: 'Forget It',
                class: 'modal-btn-secondary',
                callback: () => false,
                value: false
            },
            {
                text: 'Do It',
                class: 'modal-btn-primary',
                callback: () => true,
                value: true
            }
        ]);
    }

    /**
     * Replacement for prompt()
     * Single-action flow: user types a value and clicks Continue.
     */
    prompt(message, defaultValue = '', title = 'Enter Details') {
        return this.show(title, message, [
            {
                text: 'Continue',
                class: 'modal-btn-primary',
                callback: (val) => val
            }
        ], true, defaultValue);
    }

    /**
     * Show a toast notification
     * @param {string} message 
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - ms
     */
    toast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        
        toast.innerHTML = `
            <span class="toast-message">${this.stripEmoji(message)}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Initialize global instance
const ui = new ModalSystem();
