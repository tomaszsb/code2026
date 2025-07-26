/**
 * InteractiveFeedback Component - Professional UI notifications and feedback
 * Adapted for code2026's React architecture and unified design system
 */

function InteractiveFeedback() {
    const { useState, useCallback, useRef, useEffect } = React;
    const [toasts, setToasts] = useState([]);
    const [loadingStates, setLoadingStates] = useState(new Map());
    const toastTimeouts = useRef(new Map());

    // Show toast notification
    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newToast = {
            id: toastId,
            message,
            type,
            timestamp: Date.now()
        };

        setToasts(prevToasts => [...prevToasts, newToast]);

        // Auto-remove after duration
        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                removeToast(toastId);
            }, duration);
            toastTimeouts.current.set(toastId, timeoutId);
        }

        return toastId;
    }, []);

    // Remove toast notification
    const removeToast = useCallback((toastId) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
        
        // Clear timeout if exists
        const timeoutId = toastTimeouts.current.get(toastId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            toastTimeouts.current.delete(toastId);
        }
    }, []);

    // Convenience methods
    const success = useCallback((message, duration = 4000) => 
        showToast(message, 'success', duration), [showToast]);
    
    const warning = useCallback((message, duration = 6000) => 
        showToast(message, 'warning', duration), [showToast]);
    
    const error = useCallback((message, duration = 8000) => 
        showToast(message, 'error', duration), [showToast]);
    
    const info = useCallback((message, duration = 4000) => 
        showToast(message, 'info', duration), [showToast]);

    // Show loading state
    const showLoading = useCallback((elementId, text = 'Loading...') => {
        const loadingId = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setLoadingStates(prev => new Map(prev).set(loadingId, { elementId, text }));
        return loadingId;
    }, []);

    // Hide loading state
    const hideLoading = useCallback((loadingId) => {
        setLoadingStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(loadingId);
            return newMap;
        });
    }, []);

    // Clear all toasts
    const clearAllToasts = useCallback(() => {
        // Clear all timeouts
        toastTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        toastTimeouts.current.clear();
        setToasts([]);
    }, []);

    // Get icon for toast type
    const getToastIcon = (type) => {
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    };

    // Expose methods globally for components to use
    useEffect(() => {
        if (!window.InteractiveFeedback) {
            window.InteractiveFeedback = {
                showToast,
                removeToast,
                success,
                warning,
                error,
                info,
                showLoading,
                hideLoading,
                clearAllToasts
            };
        }

        return () => {
            // Cleanup on unmount
            toastTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            toastTimeouts.current.clear();
        };
    }, [showToast, removeToast, success, warning, error, info, showLoading, hideLoading, clearAllToasts]);

    // Button ripple effect
    const addRippleEffect = (event) => {
        const button = event.currentTarget;
        if (!button || typeof button.getBoundingClientRect !== 'function') return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    };

    // Add global button enhancement
    useEffect(() => {
        const handleButtonClick = (event) => {
            if (event.target && typeof event.target.matches === 'function' && 
                event.target.matches('button:not(.toast-close), .btn')) {
                addRippleEffect(event);
            }
        };

        document.addEventListener('click', handleButtonClick);
        return () => document.removeEventListener('click', handleButtonClick);
    }, []);

    return React.createElement('div', null, [
        // Toast container
        toasts.length > 0 && React.createElement('div', {
            key: 'toast-container',
            className: 'toast-container',
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '400px'
            }
        },
            toasts.map(toast => 
                React.createElement('div', {
                    key: toast.id,
                    className: `toast toast-${toast.type}`,
                    style: {
                        background: toast.type === 'success' ? '#10b981' :
                                   toast.type === 'warning' ? '#f59e0b' :
                                   toast.type === 'error' ? '#ef4444' : '#3b82f6',
                        color: 'white',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'slideInRight 0.3s ease-out',
                        minWidth: '300px',
                        position: 'relative'
                    }
                }, [
                    React.createElement('span', {
                        key: 'icon',
                        className: 'toast-icon',
                        style: { fontSize: '18px', fontWeight: 'bold' }
                    }, getToastIcon(toast.type)),
                    
                    React.createElement('span', {
                        key: 'message',
                        className: 'toast-message',
                        style: { flex: 1, fontSize: '14px' }
                    }, toast.message),
                    
                    React.createElement('button', {
                        key: 'close',
                        className: 'toast-close',
                        onClick: () => removeToast(toast.id),
                        style: {
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '0',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        },
                        onMouseEnter: (e) => e.target.style.opacity = 1,
                        onMouseLeave: (e) => e.target.style.opacity = 0.7
                    }, '×')
                ])
            )
        ),

        // CSS animations
        React.createElement('style', {
            key: 'feedback-styles'
        }, `
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

            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            .btn-interactive {
                transition: all 0.2s ease;
            }

            .btn-interactive:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: inherit;
                z-index: 10;
            }

            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e5e7eb;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .btn.loading {
                position: relative;
                color: transparent !important;
            }

            .btn.loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                border: 2px solid currentColor;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .pulse {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }

            .progress-indicator {
                width: 100%;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 8px;
            }

            .progress-bar {
                height: 4px;
                background: #3b82f6;
                transition: width 0.3s ease;
            }
        `)
    ]);
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveFeedback;
} else {
    window.InteractiveFeedbackComponent = InteractiveFeedback;
}