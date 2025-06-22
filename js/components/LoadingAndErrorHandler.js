/**
 * LoadingAndErrorHandler Component - Enhanced loading states and error handling
 * Provides comprehensive feedback for all game operations
 */

function LoadingAndErrorHandler() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [loadingState, setLoadingState] = useState({
        isLoading: false,
        loadingMessage: '',
        loadingType: 'general', // general, save, load, move, dice
        progress: 0
    });
    const [errorState, setErrorState] = useState({
        hasError: false,
        errorMessage: '',
        errorType: 'general',
        canRetry: false,
        retryAction: null
    });
    const [notifications, setNotifications] = useState([]);

    // Loading event listeners
    useEventListener('loadingStart', ({ message, type = 'general' }) => {
        setLoadingState({
            isLoading: true,
            loadingMessage: message,
            loadingType: type,
            progress: 0
        });
    });

    useEventListener('loadingProgress', ({ progress, message }) => {
        setLoadingState(prev => ({
            ...prev,
            progress: Math.min(100, Math.max(0, progress)),
            loadingMessage: message || prev.loadingMessage
        }));
    });

    useEventListener('loadingComplete', () => {
        setLoadingState({
            isLoading: false,
            loadingMessage: '',
            loadingType: 'general',
            progress: 100
        });
    });

    // Error event listeners
    useEventListener('error', ({ message, type = 'general', canRetry = false, retryAction = null }) => {
        setErrorState({
            hasError: true,
            errorMessage: message,
            errorType: type,
            canRetry,
            retryAction
        });

        // Also show as notification
        addNotification({
            type: 'error',
            message,
            duration: 5000
        });
    });

    // Success/info notifications
    useEventListener('gameSaved', ({ slotName }) => {
        addNotification({
            type: 'success',
            message: `Game saved: ${slotName}`,
            duration: 3000
        });
    });

    useEventListener('gameLoaded', ({ metadata }) => {
        addNotification({
            type: 'success',
            message: 'Game loaded successfully',
            duration: 3000
        });
    });

    useEventListener('playerMoved', ({ player, newSpace }) => {
        if (window.AccessibilityUtils) {
            window.AccessibilityUtils.gameAnnouncements.announceMovement(player.name, newSpace);
        }
    });

    useEventListener('turnStarted', ({ player }) => {
        if (window.AccessibilityUtils) {
            window.AccessibilityUtils.gameAnnouncements.announcePlayerTurn(player.name);
        }
        
        addNotification({
            type: 'info',
            message: `${player.name}'s turn`,
            duration: 2000
        });
    });

    // Add notification helper
    const addNotification = (notification) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            ...notification,
            timestamp: Date.now()
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove after duration
        if (notification.duration) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration);
        }
    };

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Retry error action
    const retryAction = () => {
        if (errorState.retryAction) {
            errorState.retryAction();
        }
        setErrorState({
            hasError: false,
            errorMessage: '',
            errorType: 'general',
            canRetry: false,
            retryAction: null
        });
    };

    // Dismiss error
    const dismissError = () => {
        setErrorState({
            hasError: false,
            errorMessage: '',
            errorType: 'general',
            canRetry: false,
            retryAction: null
        });
    };

    // Loading component
    const LoadingOverlay = () => {
        if (!loadingState.isLoading) return null;

        const getLoadingIcon = (type) => {
            switch (type) {
                case 'save': return '💾';
                case 'load': return '📁';
                case 'move': return '🎲';
                case 'dice': return '🎲';
                default: return '⏳';
            }
        };

        return React.createElement('div', {
            className: 'loading-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                flexDirection: 'column'
            },
            role: 'status',
            'aria-live': 'polite',
            'aria-label': loadingState.loadingMessage
        },
            React.createElement('div', {
                className: 'loading-content',
                style: {
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    minWidth: '300px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }
            },
                React.createElement('div', {
                    className: 'loading-icon',
                    style: {
                        fontSize: '3rem',
                        marginBottom: '1rem',
                        animation: 'bounce 1s infinite'
                    }
                }, getLoadingIcon(loadingState.loadingType)),
                
                React.createElement('h3', {
                    style: { margin: '0 0 1rem 0', color: '#2c5530' }
                }, loadingState.loadingMessage),
                
                loadingState.progress > 0 && React.createElement('div', {
                    className: 'progress-container',
                    style: {
                        width: '100%',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginTop: '1rem'
                    }
                },
                    React.createElement('div', {
                        className: 'progress-bar',
                        style: {
                            width: `${loadingState.progress}%`,
                            height: '8px',
                            backgroundColor: '#28a745',
                            transition: 'width 0.3s ease',
                            borderRadius: '4px'
                        },
                        role: 'progressbar',
                        'aria-valuenow': loadingState.progress,
                        'aria-valuemin': 0,
                        'aria-valuemax': 100
                    })
                ),
                
                React.createElement('div', {
                    className: 'loading-dots',
                    style: {
                        marginTop: '1rem',
                        color: '#6c757d'
                    }
                }, 'Please wait')
            )
        );
    };

    // Error modal component
    const ErrorModal = () => {
        if (!errorState.hasError) return null;

        const getErrorIcon = (type) => {
            switch (type) {
                case 'network': return '🌐';
                case 'save': return '💾';
                case 'load': return '📁';
                case 'validation': return '⚠️';
                default: return '❌';
            }
        };

        return React.createElement('div', {
            className: 'error-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem'
            },
            role: 'alertdialog',
            'aria-labelledby': 'error-title',
            'aria-describedby': 'error-message'
        },
            React.createElement('div', {
                className: 'error-modal',
                style: {
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }
            },
                React.createElement('div', {
                    style: {
                        fontSize: '3rem',
                        marginBottom: '1rem'
                    }
                }, getErrorIcon(errorState.errorType)),
                
                React.createElement('h3', {
                    id: 'error-title',
                    style: { margin: '0 0 1rem 0', color: '#dc3545' }
                }, 'Error'),
                
                React.createElement('p', {
                    id: 'error-message',
                    style: { margin: '0 0 2rem 0', color: '#6c757d' }
                }, errorState.errorMessage),
                
                React.createElement('div', {
                    className: 'error-actions',
                    style: { display: 'flex', gap: '1rem', justifyContent: 'center' }
                },
                    errorState.canRetry && React.createElement('button', {
                        onClick: retryAction,
                        className: 'btn btn--primary',
                        style: { minWidth: '100px' }
                    }, 'Retry'),
                    
                    React.createElement('button', {
                        onClick: dismissError,
                        className: 'btn btn--secondary',
                        style: { minWidth: '100px' }
                    }, 'Dismiss')
                )
            )
        );
    };

    // Notification system
    const NotificationContainer = () => {
        if (notifications.length === 0) return null;

        return React.createElement('div', {
            className: 'notification-container',
            style: {
                position: 'fixed',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                pointerEvents: 'none'
            },
            'aria-live': 'polite',
            'aria-atomic': 'false'
        },
            notifications.map(notification =>
                React.createElement('div', {
                    key: notification.id,
                    className: `notification notification--${notification.type}`,
                    style: {
                        backgroundColor: notification.type === 'error' ? '#dc3545' :
                                       notification.type === 'success' ? '#28a745' :
                                       notification.type === 'warning' ? '#ffc107' : '#17a2b8',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        animation: 'slideInFromTop 0.3s ease-out',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        minWidth: '200px',
                        textAlign: 'center'
                    },
                    onClick: () => removeNotification(notification.id),
                    role: 'alert'
                }, notification.message)
            )
        );
    };

    return React.createElement(React.Fragment, null,
        React.createElement(LoadingOverlay),
        React.createElement(ErrorModal),
        React.createElement(NotificationContainer)
    );
}

// Add notification slide animation CSS
const notificationCSS = `
@keyframes slideInFromTop {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.notification {
    animation: slideInFromTop 0.3s ease-out;
}

.notification.removing {
    animation: slideInFromTop 0.3s ease-out reverse;
}
`;

const notificationStyle = document.createElement('style');
notificationStyle.textContent = notificationCSS;
document.head.appendChild(notificationStyle);