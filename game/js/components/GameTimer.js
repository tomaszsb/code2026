/**
 * GameTimer Component - Real-time game timer and session management
 * Tracks total game time and displays timer UI
 */

function GameTimer() {
    const { useState, useEffect, useCallback, useMemo } = React;
    const [gameState, gameStateManager] = useGameState();
    const [timerState, setTimerState] = useState({
        startTime: null,
        currentTime: 0,
        isRunning: false,
        sessionDuration: 0
    });

    // Start timer when game begins
    useEventListener('gameStarted', () => {
        startTimer();
    });

    // Pause timer when game ends
    useEventListener('gameCompleted', () => {
        pauseTimer();
    });

    // Handle game restart
    useEventListener('gameRestarted', () => {
        resetTimer();
    });

    // Start the game timer
    const startTimer = () => {
        const now = Date.now();
        setTimerState(prev => ({
            ...prev,
            startTime: now,
            currentTime: now,
            isRunning: true
        }));
    };

    // Pause the timer
    const pauseTimer = () => {
        setTimerState(prev => ({
            ...prev,
            isRunning: false
        }));
    };

    // Reset the timer
    const resetTimer = () => {
        setTimerState({
            startTime: null,
            currentTime: 0,
            isRunning: false,
            sessionDuration: 0
        });
    };

    // Update timer every second
    useEffect(() => {
        let interval;
        
        if (timerState.isRunning && timerState.startTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const duration = now - timerState.startTime;
                
                setTimerState(prev => ({
                    ...prev,
                    currentTime: now,
                    sessionDuration: duration
                }));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [timerState.isRunning, timerState.startTime]);

    // Format duration for display
    const formatDuration = useCallback((milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
    }, []);

    // Calculate average turn time
    const getAverageTurnTime = useCallback(() => {
        if (gameState.turnCount === 0) return 0;
        return timerState.sessionDuration / gameState.turnCount;
    }, [gameState.turnCount, timerState.sessionDuration]);

    // Check if game is taking too long
    const checkTimeWarnings = () => {
        const warningThresholds = {
            thirtyMinutes: 30 * 60 * 1000,
            oneHour: 60 * 60 * 1000,
            twoHours: 2 * 60 * 60 * 1000
        };

        if (timerState.sessionDuration >= warningThresholds.twoHours) {
            return 'warning-high';
        } else if (timerState.sessionDuration >= warningThresholds.oneHour) {
            return 'warning-medium';
        } else if (timerState.sessionDuration >= warningThresholds.thirtyMinutes) {
            return 'warning-low';
        }
        return 'normal';
    };

    // Memoize styles to prevent recreation (must be before early return)
    const timerStyles = useMemo(() => ({
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        backgroundColor: 'white',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        padding: '0.75rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 100,
        minWidth: '200px',
        fontFamily: 'monospace'
    }), []);

    // Don't render if game hasn't started
    if (!timerState.startTime) {
        return null;
    }

    const timeWarning = checkTimeWarnings();
    const averageTurnTime = getAverageTurnTime();

    return React.createElement('div', { 
        className: 'game-timer',
        style: timerStyles
    },
        // Timer header
        React.createElement('div', { 
            className: 'timer-header',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
            }
        },
            React.createElement('span', { 
                style: { 
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: timeWarning === 'normal' ? '#2c5530' : 
                           timeWarning === 'warning-low' ? '#856404' :
                           timeWarning === 'warning-medium' ? '#b45309' : '#dc3545'
                }
            }, '⏱️ Game Time'),
            timerState.isRunning && React.createElement('span', {
                style: {
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#28a745',
                    animation: 'pulse 1.5s infinite'
                }
            })
        ),

        // Current session time
        React.createElement('div', { 
            className: 'session-time',
            style: {
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: timeWarning === 'normal' ? '#2c5530' : 
                       timeWarning === 'warning-low' ? '#856404' :
                       timeWarning === 'warning-medium' ? '#b45309' : '#dc3545',
                marginBottom: '0.5rem'
            }
        }, formatDuration(timerState.sessionDuration)),

        // Turn statistics
        gameState.turnCount > 0 && React.createElement('div', { 
            className: 'turn-stats',
            style: {
                fontSize: '0.875rem',
                color: '#6c757d',
                borderTop: '1px solid #e9ecef',
                paddingTop: '0.5rem'
            }
        },
            React.createElement('div', {}, `Turn ${gameState.turnCount}`),
            React.createElement('div', {}, 
                `Avg: ${formatDuration(averageTurnTime)}/turn`
            )
        ),

        // Time warning message
        timeWarning !== 'normal' && React.createElement('div', {
            style: {
                fontSize: '0.75rem',
                color: timeWarning === 'warning-low' ? '#856404' :
                       timeWarning === 'warning-medium' ? '#b45309' : '#dc3545',
                marginTop: '0.5rem',
                fontStyle: 'italic'
            }
        }, 
            timeWarning === 'warning-low' ? 'Long game session' :
            timeWarning === 'warning-medium' ? 'Consider taking a break' :
            'Very long session - save progress?'
        )
    );
}

// Add CSS animation for pulse effect
const timerStyle = document.createElement('style');
timerStyle.textContent = `
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
`;
document.head.appendChild(timerStyle);