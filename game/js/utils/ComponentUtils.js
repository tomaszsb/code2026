/**
 * ComponentUtils - Shared utilities for React components
 * Common patterns and helpers for clean component architecture
 */

// React hooks and utilities
const { useState, useEffect, useCallback, useRef } = React;

/**
 * Deep equality comparison for game state objects
 * Prevents unnecessary re-renders from new object references with identical content
 */
function areStatesEqual(state1, state2) {
    // Quick reference equality check
    if (state1 === state2) {
        return true;
    }
    
    // Handle null/undefined cases
    if (state1 == null || state2 == null) {
        return state1 === state2;
    }
    
    // Type check
    if (typeof state1 !== typeof state2) {
        return false;
    }
    
    // Handle primitives
    if (typeof state1 !== 'object') {
        return state1 === state2;
    }
    
    // Handle arrays
    if (Array.isArray(state1) !== Array.isArray(state2)) return false;
    if (Array.isArray(state1)) {
        if (state1.length !== state2.length) {
            return false;
        }
        for (let i = 0; i < state1.length; i++) {
            if (!areStatesEqual(state1[i], state2[i])) {
                return false;
            }
        }
        return true;
    }
    
    // Handle objects
    const keys1 = Object.keys(state1);
    const keys2 = Object.keys(state2);
    
    if (keys1.length !== keys2.length) {
        return false;
    }
    
    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
        if (!areStatesEqual(state1[key], state2[key])) {
            return false;
        }
    }
    
    return true;
}

/**
 * Custom hook for GameStateManager integration - FIXED VERSION
 */
function useGameState() {
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    
    // Initialize gameState directly with function initializer - only called once
    const [gameState, setGameState] = useState(() => {
        if (window.GameStateManager) {
            return window.GameStateManager.getState();
        }
        return null;
    });
    const [isSubscribed, setIsSubscribed] = useState(false);
    
    // DEBUGGING: Counter to track handleStateChange invocations
    const handleStateChangeCallCountRef = useRef(0);
    
    // STABILIZED REFERENCES - Create stable objects to prevent infinite re-renders
    const gameStateManagerRef = useRef(null);
    const fallbackState = useRef({
        players: [],
        gamePhase: 'SETUP',
        currentPlayer: 0,
        turnCount: 0,
        ui: {},
        error: null
    });
    
    // STABLE handleStateChange with useCallback at top level - FIXED RULES OF HOOKS
    const handleStateChange = useCallback(() => {
        const currentGameStateManager = gameStateManagerRef.current;
        if (!currentGameStateManager) {
            return;
        }
        
        const newState = currentGameStateManager.getState();
        
        // Use functional setState to avoid gameState dependency
        setGameState(prevState => {
            const areContentEqual = areStatesEqual(prevState, newState);
            
            if (!areContentEqual) {
                return newState;
            } else {
                return prevState;
            }
        });
    }, []); // Empty dependencies - uses refs for stability
    
    useEffect(() => {
        // Update gameStateManager reference
        gameStateManagerRef.current = window.GameStateManager;
        
        // If GameStateManager is not available, skip subscription
        if (!window.GameStateManager) {
            return;
        }
        
        // GameStateManager is available - perform one-time subscription
        const currentGameStateManager = gameStateManagerRef.current;
        
        // Subscribe to events - ONLY ONCE
        const unsubscribe1 = currentGameStateManager.on('stateChanged', handleStateChange);
        const unsubscribe2 = currentGameStateManager.on('gameInitialized', handleStateChange);
        
        return () => {
            unsubscribe1?.();
            unsubscribe2?.();
        };
    }, []); // Run only once on mount - no dependencies to prevent re-runs
    
    // DIRECT STATE RETURN - Synchronous updates only when GameStateManager changes
    const currentState = useMemo(() => {
        return gameState || fallbackState.current;
    }, [gameState]);
    
    // Only return gameStateManager if window.GameStateManager is actually available
    const safeGameStateManager = window.GameStateManager ? gameStateManagerRef.current : null;
    return [currentState, safeGameStateManager];
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
            const spaceKey = `destination_${i}`;
            if (movement[spaceKey] && movement[spaceKey].trim()) {
                nextSpaces.push(movement[spaceKey].trim());
            }
        }
        return nextSpaces;
    },
    
    // Check if space requires dice roll
    requiresDiceRoll: (spaceName, visitType = 'First') => {
        if (!window.CSVDatabase?.loaded) return false;
        
        // Check for movement-based dice (DICE_OUTCOMES.csv)
        const diceOutcome = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
        if (diceOutcome) {
            return true;
        }
        
        // Check for effect-based dice (SPACE_EFFECTS.csv with use_dice=true)
        // Get all effects for this space first
        const allEffects = window.CSVDatabase.spaceEffects.query({
            space_name: spaceName,
            visit_type: visitType
        });
        
        // Check if any effect has use_dice=true (handle both string and boolean values)
        const diceEffects = allEffects.filter(effect => {
            const useDice = effect.use_dice;
            return useDice === 'true' || useDice === true || useDice === 'True';
        });
        
        // Debug logging for troubleshooting
        if (spaceName === 'PM-DECISION-CHECK') {
            console.log(`🎲 DICE DEBUG: Checking requiresDiceRoll for ${spaceName}/${visitType}`);
            console.log(`🎲 DICE DEBUG: All effects:`, allEffects);
            console.log(`🎲 DICE DEBUG: Dice effects found:`, diceEffects);
            console.log(`🎲 DICE DEBUG: Result:`, diceEffects && diceEffects.length > 0);
        }
        
        return diceEffects && diceEffects.length > 0;
    },
    
    // Get card types that space affects
    getCardTypes: (spaceName, visitType = 'First', gameState = null, effectsEngine = null) => {
        if (!window.CSVDatabase?.loaded) return [];
        const effects = window.CSVDatabase.spaceEffects.query({
            space_name: spaceName,
            visit_type: visitType
        });
        
        const types = [];
        const uniqueActions = new Map(); // Track unique type+action combinations
        
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
                
                // Deduplicate by type+action combination
                const key = `${cardType}-${action}`;
                if (!uniqueActions.has(key)) {
                    uniqueActions.set(key, true);
                    types.push({ 
                        type: cardType, 
                        action: action,
                        trigger_type: effect.trigger_type || ''
                    });
                }
            }
        });
        return types;
    },
    
    // Evaluate effect condition using current game state
    evaluateEffectCondition: (condition, gameState, effectsEngine, spaceName) => {
        // Always allow effects with no condition or 'always'
        if (!condition || condition === 'always') {
            return true;
        }
        
        // Dice roll conditions: Check against actual dice roll value
        if (condition === 'roll_1' || condition === 'roll_2') {
            const requiredRoll = condition === 'roll_1' ? 1 : 2;
            const lastDiceRoll = gameState?.currentTurn?.lastDiceRoll;
            return lastDiceRoll === requiredRoll;
        }
        
        // Other player-choice conditions: These are fulfilled by the player clicking the button
        // Examples: replace, to_right_player, return, etc.
        const playerChoiceConditions = [
            'replace', 'to_right_player', 'return',
            'loan_up_to_1.4M', 'loan_1.5M_to_2.75M', 'loan_above_2.75M',
            'percent_of_borrowed', 'per_200k'
        ];
        
        if (playerChoiceConditions.includes(condition)) {
            return true; // Always show buttons for player-choice conditions
        }
        
        if (!gameState) {
            // No game state available, allow all conditions for now
            // This handles the case where we're called during initial setup
            return true;
        }
        
        // Use EffectsEngine condition evaluation if available
        if (effectsEngine && effectsEngine.meetsCondition) {
            try {
                return effectsEngine.meetsCondition(condition, gameState, gameState.currentPlayer);
            } catch (error) {
                return true;
            }
        }
        
        // Fallback condition evaluation
        if (condition === 'scope_le_4M') {
            return (gameState.projectScope || 0) <= 4000000;
        }
        if (condition === 'scope_gt_4M') {
            return (gameState.projectScope || 0) > 4000000;
        }
        
        // Default to true for unknown conditions
        return true;
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
    },

    // Get dice-based card actions, filtered by actual dice roll conditions
    getDiceCardActions: (spaceName, visitType = 'First', gameState = null) => {
        if (!window.CSVDatabase?.loaded) return [];
        
        const effects = window.CSVDatabase.spaceEffects.query({
            space_name: spaceName,
            visit_type: visitType
        });
        
        const actions = [];
        const uniqueActions = new Map(); // Track unique type+action combinations
        
        effects.forEach(effect => {
            if (effect.effect_type && effect.effect_type.includes('_cards')) {
                
                const cardType = effect.effect_type.replace('_cards', '').toUpperCase();
                
                // Check if this effect has a dice roll condition
                const condition = effect.condition;
                if (condition === 'roll_1' || condition === 'roll_2') {
                    // For dice roll conditions, only show if:
                    // 1. Dice has been rolled (lastDiceRoll is not null)
                    // 2. The condition is met (using same logic as GameStateManager)
                    const lastDiceRoll = gameState?.currentTurn?.lastDiceRoll;
                    if (lastDiceRoll === null || lastDiceRoll === undefined) {
                        // Dice hasn't been rolled yet, don't show this action
                        return;
                    }
                    
                    const requiredRoll = condition === 'roll_1' ? 1 : 2;
                    if (lastDiceRoll !== requiredRoll) {
                        // Dice roll doesn't match required value, don't show this action
                        return;
                    }
                }
                
                let action;
                if (effect.effect_value === 'dice' && effect.use_dice === 'true') {
                    // Look up dice effects to show range
                    action = ComponentUtils.getDiceActionText(spaceName, visitType, cardType);
                } else {
                    action = `Draw ${effect.effect_value || 1}`;
                }
                
                // Deduplicate by type+action combination
                const key = `${cardType}-${action}`;
                if (!uniqueActions.has(key)) {
                    uniqueActions.set(key, true);
                    actions.push({ 
                        type: cardType, 
                        action: action,
                        trigger_type: effect.trigger_type || '',
                        condition: condition
                    });
                }
            }
        });
        
        return actions;
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

// Make window components available globally for React.createElement
// This allows components to be referenced directly without window. prefix in App.js
setTimeout(() => {
    if (window.GameInitializer) globalThis.GameInitializer = window.GameInitializer;
    if (window.GameManager) globalThis.GameManager = window.GameManager;
    if (window.DiceRoll) globalThis.DiceRoll = window.DiceRoll;
    if (window.SpaceChoice) globalThis.SpaceChoice = window.SpaceChoice;
    // TurnManager removed as dead code - replaced by TurnControls
    if (window.WinConditionManager) globalThis.WinConditionManager = window.WinConditionManager;
    if (window.GameEndScreen) globalThis.GameEndScreen = window.GameEndScreen;
    if (window.GameTimer) globalThis.GameTimer = window.GameTimer;
    if (window.GameSaveManager) globalThis.GameSaveManager = window.GameSaveManager;
    if (window.LoadingAndErrorHandler) globalThis.LoadingAndErrorHandler = window.LoadingAndErrorHandler;
    // Note: Only assign if component exists to avoid overwriting with undefined
}, 100);