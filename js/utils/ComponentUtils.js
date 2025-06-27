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
    
    // Get next spaces from space name and visit type
    getNextSpaces: (spaceName, visitType = 'First') => {
        if (!window.CSVDatabase?.loaded) return [];
        const movement = window.CSVDatabase.movement.find(spaceName, visitType);
        if (!movement) return [];
        
        const nextSpaces = [];
        for (let i = 1; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (movement[spaceKey] && movement[spaceKey].trim()) {
                nextSpaces.push(movement[spaceKey].trim());
            }
        }
        return nextSpaces;
    },
    
    // Check if space requires dice roll
    requiresDiceRoll: (spaceName, visitType = 'First') => {
        if (!window.CSVDatabase?.loaded) return false;
        const diceOutcome = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
        return diceOutcome !== null;
    },
    
    // Get card types that space affects
    getCardTypes: (spaceName, visitType = 'First') => {
        if (!window.CSVDatabase?.loaded) return [];
        const effects = window.CSVDatabase.spaceEffects.query({
            space_name: spaceName,
            visit_type: visitType
        });
        
        const types = [];
        effects.forEach(effect => {
            if (effect.effect_type && effect.effect_type.includes('_cards')) {
                const cardType = effect.effect_type.replace('_cards', '').toUpperCase();
                
                let action;
                if (effect.effect_value === 'dice' && effect.use_dice === 'true') {
                    // Look up dice effects to show range
                    action = ComponentUtils.getDiceActionText(spaceName, visitType, cardType);
                } else {
                    action = `Draw ${effect.effect_value || 1}`;
                }
                
                types.push({ 
                    type: cardType, 
                    action: action
                });
            }
        });
        return types;
    },
    
    // Get dice action text showing range (e.g., "Draw 1-3")
    getDiceActionText: (spaceName, visitType, cardType) => {
        if (!window.CSVDatabase?.loaded || !window.CSVDatabase.diceEffects) {
            return "Draw dice";
        }
        
        // Find dice effects for this space/visit/card type
        const diceEffects = window.CSVDatabase.diceEffects.data || [];
        const matchingEffect = diceEffects.find(row => 
            row.space_name === spaceName && 
            row.visit_type === visitType && 
            row.card_type === cardType
        );
        
        if (!matchingEffect) {
            return "Draw dice";
        }
        
        // Get all dice outcomes
        const outcomes = [
            matchingEffect.roll_1,
            matchingEffect.roll_2, 
            matchingEffect.roll_3,
            matchingEffect.roll_4,
            matchingEffect.roll_5,
            matchingEffect.roll_6
        ].filter(outcome => outcome && outcome !== 'No change');
        
        if (outcomes.length === 0) {
            return "Draw dice";
        }
        
        // Extract numbers from outcomes (e.g., "Draw 1" -> 1)
        const amounts = outcomes.map(outcome => {
            const match = outcome.match(/Draw (\d+)/i);
            return match ? parseInt(match[1]) : 0;
        }).filter(amount => amount > 0);
        
        if (amounts.length === 0) {
            return "Draw dice";
        }
        
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);
        
        if (min === max) {
            return `Draw ${min}`;
        } else {
            return `Draw ${min}-${max}`;
        }
    },
    
    // Parse card type from dice outcome
    parseCardTypeFromOutcome: (outcome) => {
        if (outcome.includes('W Cards') || outcome.includes('W Card')) return 'W';
        if (outcome.includes('B Cards') || outcome.includes('B Card')) return 'B';
        if (outcome.includes('I Cards') || outcome.includes('I Card')) return 'I';
        if (outcome.includes('L Cards') || outcome.includes('L Card')) return 'L';
        if (outcome.includes('E Cards') || outcome.includes('E Card')) return 'E';
        return null;
    },
    
    // Parse fee amount from CSV fee text
    parseFeeAmount: (feeText) => {
        if (!feeText) return 0;
        
        // Handle percentage fees
        if (feeText.includes('%')) {
            // Return 0 for now - percentage fees need context
            return 0;
        }
        
        // Extract numeric value from text like "$1000" or "1000"
        const numericMatch = feeText.match(/[\d,]+/);
        if (numericMatch) {
            return parseInt(numericMatch[0].replace(/,/g, ''));
        }
        
        return 0;
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