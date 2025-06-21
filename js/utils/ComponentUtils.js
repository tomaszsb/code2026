/**
 * ComponentUtils - Shared utilities for React components
 * Common patterns and helpers for clean component architecture
 */

// React hooks and utilities
const { useState, useEffect, useCallback, useRef } = React;

/**
 * Custom hook for GameStateManager integration
 */
function useGameState() {
    const [state, setState] = useState(() => {
        // Ensure GameStateManager is available
        if (typeof window.GameStateManager === 'undefined') {
            console.error('GameStateManager not available');
            return { players: [], gamePhase: 'SETUP', currentPlayer: 0, turnCount: 0, ui: {}, error: null };
        }
        return window.GameStateManager.getState();
    });
    
    const gameStateManager = useRef(window.GameStateManager);
    
    useEffect(() => {
        // Ensure GameStateManager is available
        if (!gameStateManager.current) {
            console.error('GameStateManager not available for event listener');
            return;
        }
        
        const unsubscribe = gameStateManager.current.on('stateChanged', (data) => {
            setState(data.current);
        });
        
        return unsubscribe;
    }, []);
    
    return [state, gameStateManager.current];
}

/**
 * Custom hook for CSV data queries
 */
function useCSVData() {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    const databaseRef = useRef(window.CSVDatabase);
    
    useEffect(() => {
        // Ensure CSVDatabase is available
        if (!databaseRef.current) {
            setError('CSVDatabase not loaded');
            return;
        }
        
        const csvDB = databaseRef.current;
        
        if (csvDB.loaded) {
            setLoaded(true);
        } else {
            csvDB.loadAll()
                .then(() => setLoaded(true))
                .catch(err => setError(err.message));
        }
    }, []);
    
    return { loaded, error, database: databaseRef.current };
}

/**
 * Custom hook for event listeners
 */
function useEventListener(eventName, handler, deps = []) {
    const gameStateManager = useRef(window.GameStateManager);
    
    useEffect(() => {
        // Ensure GameStateManager is available
        if (!gameStateManager.current) {
            console.error('GameStateManager not available for event listener');
            return;
        }
        
        const unsubscribe = gameStateManager.current.on(eventName, handler);
        return unsubscribe;
    }, [eventName, ...deps]);
}

/**
 * Component error boundary utility
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('Component Error:', error, errorInfo);
        if (window.GameStateManager) {
            window.GameStateManager.handleError(error, 'Component Boundary');
        }
    }
    
    render() {
        if (this.state.hasError) {
            return React.createElement('div', 
                { className: 'error-boundary' },
                React.createElement('h2', null, 'Something went wrong'),
                React.createElement('p', null, this.state.error?.message || 'Unknown error'),
                React.createElement('button', 
                    { onClick: () => window.location.reload() },
                    'Reload Game'
                )
            );
        }
        
        return this.props.children;
    }
}

/**
 * Loading wrapper component
 */
function LoadingWrapper({ loading, children, fallback = null }) {
    if (loading) {
        return fallback || React.createElement('div', 
            { className: 'loading' }, 
            'Loading...'
        );
    }
    
    return children;
}

/**
 * Debug info component
 */
function DebugInfo({ enabled = false }) {
    const [state] = useGameState();
    
    if (!enabled) return null;
    
    return React.createElement('div', 
        { className: 'debug-info' },
        React.createElement('h3', null, 'Debug Info'),
        React.createElement('pre', null, JSON.stringify(state, null, 2))
    );
}

/**
 * Utility functions
 */
const ComponentUtils = {
    // Format currency
    formatMoney: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    },
    
    // Format time
    formatTime: (days) => {
        if (days === 1) return '1 day';
        if (days < 30) return `${days} days`;
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
        return `${months}m ${remainingDays}d`;
    },
    
    // Parse card action text
    parseCardAction: (actionText) => {
        if (!actionText) return null;
        
        const drawMatch = actionText.match(/Draw (\d+)/);
        const replaceMatch = actionText.match(/Replace (\d+)/);
        const removeMatch = actionText.match(/Remove (\d+)/);
        
        if (drawMatch) {
            return { type: 'draw', amount: parseInt(drawMatch[1]) };
        }
        if (replaceMatch) {
            return { type: 'replace', amount: parseInt(replaceMatch[1]) };
        }
        if (removeMatch) {
            return { type: 'remove', amount: parseInt(removeMatch[1]) };
        }
        
        return { type: 'custom', text: actionText };
    },
    
    // Get next spaces from space data
    getNextSpaces: (spaceData) => {
        const nextSpaces = [];
        for (let i = 1; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (spaceData[spaceKey] && spaceData[spaceKey].trim()) {
                nextSpaces.push(spaceData[spaceKey].trim());
            }
        }
        return nextSpaces;
    },
    
    // Check if space requires dice roll
    requiresDiceRoll: (spaceData) => {
        return spaceData.requires_dice_roll === 'Yes';
    },
    
    // Get card types that space affects
    getCardTypes: (spaceData) => {
        const types = [];
        if (spaceData.w_card) types.push({ type: 'W', action: spaceData.w_card });
        if (spaceData.b_card) types.push({ type: 'B', action: spaceData.b_card });
        if (spaceData.i_card) types.push({ type: 'I', action: spaceData.i_card });
        if (spaceData.l_card) types.push({ type: 'L', action: spaceData.l_card });
        if (spaceData.e_card) types.push({ type: 'E', action: spaceData.e_card });
        return types;
    }
};

// Export utilities
window.ComponentUtils = ComponentUtils;
window.useGameState = useGameState;
window.useCSVData = useCSVData;
window.useEventListener = useEventListener;
window.ErrorBoundary = ErrorBoundary;
window.LoadingWrapper = LoadingWrapper;
window.DebugInfo = DebugInfo;