/**
 * SpaceChoice Component - Handle player space selection
 * CSV-driven movement options with player choice UI
 */

function SpaceChoice() {
    const [gameState, gameStateManager] = useGameState();
    const [state, setState] = useState({
        playerId: null,
        spaceOptions: [],
        source: null,
        selectedSpace: null
    });

    // Handle space choice request
    useEventListener('showSpaceChoice', ({ playerId, spaceOptions, source }) => {
        setState(prevState => ({
            ...prevState,
            playerId,
            spaceOptions,
            source,
            selectedSpace: null
        }));
    });

    // Select a space option
    const selectSpace = (spaceName) => {
        setState(prevState => ({
            ...prevState,
            selectedSpace: spaceName
        }));
    };

    // Confirm space selection
    const confirmSelection = () => {
        if (!state.selectedSpace) return;
        
        // Move player to selected space
        gameStateManager.emit('movePlayerRequest', {
            playerId: state.playerId,
            spaceName: state.selectedSpace,
            visitType: 'First'
        });
        
        // Clear space choice
        setState(prevState => ({
            ...prevState,
            playerId: null,
            spaceOptions: [],
            source: null,
            selectedSpace: null
        }));
    };

    // Auto-select if only one option
    useEffect(() => {
        if (state.spaceOptions.length === 1 && !state.selectedSpace) {
            const timeoutId = setTimeout(() => {
                selectSpace(state.spaceOptions[0]);
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [state.spaceOptions.length, state.selectedSpace]);

    // Don't render if no choice needed
    if (!state.playerId || state.spaceOptions.length === 0) {
        return null;
    }

    // Don't render UI when panel layout is active - let ActionPanel handle the UI
    if (window.GamePanelLayout && gameState.players && gameState.players.length > 0) {
        return null;
    }

    const currentPlayer = gameState.players[state.playerId];
    if (!currentPlayer) return null;

    return React.createElement('div', { className: 'space-choice-container' },
        React.createElement('div', { className: 'space-choice-header' },
            React.createElement('h3', {}, `${currentPlayer.name} - Choose Next Space`),
            React.createElement('p', {}, 
                state.source === 'dice_outcome' ? 
                'Dice roll gives you multiple options:' :
                'Choose your next move:'
            )
        ),
        
        React.createElement('div', { className: 'space-options' },
            state.spaceOptions.map((spaceName, index) => {
                const cleanSpaceName = spaceName.split(' - ')[0]; // Remove descriptions
                const isSelected = state.selectedSpace === cleanSpaceName;
                
                return React.createElement('div', {
                    key: index,
                    className: `space-option ${isSelected ? 'selected' : ''}`,
                    onClick: () => selectSpace(cleanSpaceName)
                },
                    React.createElement('div', { className: 'space-name' }, cleanSpaceName),
                    spaceName.includes(' - ') && 
                    React.createElement('div', { className: 'space-description' }, 
                        spaceName.split(' - ')[1]
                    )
                );
            })
        ),
        
        React.createElement('div', { className: 'space-choice-actions' },
            state.spaceOptions.length === 1 && 
            React.createElement('button', {
                onClick: confirmSelection,
                className: 'btn btn-primary',
                disabled: !state.selectedSpace
            }, 'Continue'),
            
            state.spaceOptions.length > 1 && React.createElement('button', {
                onClick: confirmSelection,
                className: 'btn btn-success',
                disabled: !state.selectedSpace
            }, 'Go to Selected Space')
        )
    );
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpaceChoice;
} else {
    window.SpaceChoice = SpaceChoice;
}