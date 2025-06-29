/**
 * DiceRoll Component - CSV-driven dice rolling system
 * Handles visual dice rolling with animations and CSV-based outcomes
 */

function DiceRoll() {
    const [gameState, gameStateManager] = useGameState();
    const [state, setState] = useState({
        rolling: false,
        rolled: false,
        rollValue: null,
        outcome: null,
        spaceName: null,
        visitType: null,
        playerId: null
    });

    // Handle show dice roll request
    useEventListener('showDiceRoll', ({ playerId, spaceName, visitType }) => {
        // Don't process events when panel layout is active - let DiceRollSection handle it
        if (window.GamePanelLayout && gameState.players && gameState.players.length > 0) {
            return;
        }
        
        setState(prevState => ({
            ...prevState,
            rolling: false,
            rolled: false,
            rollValue: null,
            outcome: null,
            spaceName,
            visitType,
            playerId
        }));
    });

    // Roll dice function
    const rollDice = async () => {
        try {
            // Check if CSVDatabase is loaded
            if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
                console.error('DiceRoll: CSVDatabase not loaded');
                return;
            }
            
            setState(prevState => ({ ...prevState, rolling: true }));
            
            // Simulate dice roll animation delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate random roll (1-6)
            const rollValue = Math.floor(Math.random() * 6) + 1;
            
            // Get outcome from CSV with safety checks
            let outcome = null;
            try {
                const diceData = window.CSVDatabase.diceOutcomes.find(
                    state.spaceName, 
                    state.visitType || 'First'
                );
                outcome = diceData ? diceData[`roll_${rollValue}`] : null;
                
                if (!outcome) {
                    console.warn(`DiceRoll: No outcome found for ${state.spaceName}/${state.visitType}/roll_${rollValue}`);
                }
            } catch (csvError) {
                console.error('DiceRoll: Error accessing CSV data:', csvError);
            }
            
            setState(prevState => ({
                ...prevState,
                rolling: false,
                rolled: true,
                rollValue,
                outcome
            }));
            
            // Emit roll complete event
            gameStateManager.emit('diceRollComplete', {
                playerId: state.playerId,
                spaceName: state.spaceName,
                visitType: state.visitType,
                rollValue,
                outcome
            });
        } catch (error) {
            console.error('DiceRoll: Error during dice roll:', error);
            setState(prevState => ({
                ...prevState,
                rolling: false,
                outcome: 'Error: Unable to complete dice roll'
            }));
        }
    };

    // Apply dice outcome
    const applyOutcome = () => {
        try {
            if (!state.playerId || !state.outcome) {
                console.warn('DiceRoll: Cannot apply outcome - missing required data');
                return;
            }
            
            gameStateManager.emit('processDiceOutcome', {
                playerId: state.playerId,
                outcome: state.outcome,
                spaceName: state.spaceName,
                visitType: state.visitType
            });
            
            // Hide dice roll
            setState(prevState => ({
                ...prevState,
                spaceName: null,
                visitType: null,
                playerId: null
            }));
        } catch (error) {
            console.error('DiceRoll: Error applying outcome:', error);
        }
    };

    // Don't render if no dice roll requested
    if (!state.spaceName) {
        return null;
    }

    // Don't render UI when panel layout is active - let ActionPanel handle the UI
    if (window.GamePanelLayout && gameState.players && gameState.players.length > 0) {
        return null;
    }

    const currentPlayer = gameState.players[state.playerId];
    if (!currentPlayer) return null;

    return React.createElement('div', { className: 'dice-roll-container' },
        React.createElement('div', { className: 'dice-roll-header' },
            React.createElement('h3', {}, `${currentPlayer.name} - Roll Dice`),
            React.createElement('p', {}, 
                `Space: ${state.spaceName} (${state.visitType} visit)`
            )
        ),
        
        React.createElement('div', { className: 'dice-animation-area' },
            React.createElement('div', { 
                className: `dice ${state.rolling ? 'rolling' : ''} ${state.rolled ? 'rolled' : ''}` 
            },
                state.rollValue ? React.createElement('div', { className: 'dice-face' }, state.rollValue) : 
                React.createElement('div', { className: 'dice-face' }, '?')
            )
        ),
        
        state.outcome && React.createElement('div', { className: 'dice-outcome' },
            React.createElement('h4', {}, 'Outcome:'),
            React.createElement('p', {}, state.outcome)
        ),
        
        React.createElement('div', { className: 'dice-actions' },
            !state.rolled && !state.rolling && React.createElement('button', {
                onClick: rollDice,
                className: 'btn btn-primary'
            }, 'Roll Dice'),
            
            state.rolling && React.createElement('div', { className: 'rolling-message' }, 'Rolling...'),
            
            state.rolled && React.createElement('button', {
                onClick: applyOutcome,
                className: 'btn btn-success'
            }, 'Apply Outcome')
        )
    );
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiceRoll;
} else {
    window.DiceRoll = DiceRoll;
}