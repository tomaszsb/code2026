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
        setState(prevState => ({ ...prevState, rolling: true }));
        
        // Simulate dice roll animation delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate random roll (1-6)
        const rollValue = Math.floor(Math.random() * 6) + 1;
        
        // Get outcome from CSV
        const outcome = window.CSVDatabase.dice.getRollOutcome(
            state.spaceName, 
            state.visitType, 
            rollValue
        );
        
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
    };

    // Apply dice outcome
    const applyOutcome = () => {
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
    };

    // Don't render if no dice roll requested
    if (!state.spaceName) {
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