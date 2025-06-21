/**
 * SpaceExplorer - Interactive space information panel
 * Shows detailed space information and allows exploration
 */

// Helper function to get phase color
function getPhaseColor(phase) {
    const phaseColors = {
        'SETUP': 'primary',
        'DESIGN': 'warning',
        'FUNDING': 'success',
        'REGULATORY': 'warning',
        'CONSTRUCTION': 'error',
        'OWNER': 'primary',
        'END': 'success'
    };
    return phaseColors[phase] || 'neutral';
}

function SpaceExplorer() {
    const [gameState, gameStateManager] = useGameState();
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [spaceHistory, setSpaceHistory] = useState([]);
    
    // Listen for space selection events
    useEventListener('spaceSelected', (data) => {
        setSelectedSpace(data);
        
        // Add to history if not already there
        if (!spaceHistory.find(s => s.spaceName === data.spaceName)) {
            setSpaceHistory(prev => [...prev, {
                spaceName: data.spaceName,
                timestamp: Date.now()
            }].slice(-10)); // Keep last 10 spaces
        }
    });
    
    // Clear selection
    const clearSelection = () => {
        setSelectedSpace(null);
    };
    
    // Explore related space
    const exploreSpace = (spaceName) => {
        const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
        if (spaceData) {
            gameStateManager.emit('spaceSelected', {
                spaceName,
                spaceData,
                isValidMove: false,
                player: gameState.players[gameState.currentPlayer]
            });
        }
    };
    
    if (!selectedSpace) {
        return React.createElement('div',
            { className: 'text-center' },
            React.createElement('h3', { className: 'heading-3 mb-4' }, 'Space Explorer'),
            React.createElement('p', { className: 'text-body mb-6' }, 'Click on a space to explore its details'),
            spaceHistory.length > 0 && React.createElement('div',
                { className: 'mt-6' },
                React.createElement('h4', { className: 'heading-5 mb-4' }, 'Recently Viewed'),
                React.createElement('div',
                    { className: 'flex flex-col gap-2' },
                    spaceHistory.map(item =>
                        React.createElement('button',
                            {
                                key: item.spaceName,
                                className: 'btn btn--ghost btn--sm text-left',
                                onClick: () => exploreSpace(item.spaceName)
                            },
                            item.spaceName
                        )
                    )
                )
            )
        );
    }
    
    const { spaceName, spaceData, isValidMove, player } = selectedSpace;
    
    return React.createElement('div',
        { className: 'flex flex-col gap-4' },
        
        // Header
        React.createElement('div',
            { className: 'section__header' },
            React.createElement('h3', { className: 'section__title' }, 'Space Explorer'),
            React.createElement('button',
                {
                    className: 'btn btn--ghost btn--sm',
                    onClick: clearSelection
                },
                '×'
            )
        ),
        
        // Space details
        React.createElement(SpaceDetails, {
            spaceName,
            spaceData,
            isValidMove,
            player,
            onExploreSpace: exploreSpace
        }),
        
        // Movement actions
        isValidMove && React.createElement('div',
            { className: 'mt-6 pt-4 border-t border-neutral-200' },
            React.createElement('button',
                {
                    className: 'btn btn--success btn--full',
                    onClick: () => {
                        gameStateManager.emit('movePlayerRequest', {
                            playerId: gameState.currentPlayer,
                            spaceName,
                            visitType: 'First'
                        });
                        clearSelection();
                    }
                },
                `Move to ${spaceName}`
            )
        )
    );
}

/**
 * SpaceDetails - Detailed space information display
 */
function SpaceDetails({ spaceName, spaceData, isValidMove, player, onExploreSpace }) {
    if (!spaceData) {
        return React.createElement('div',
            { className: 'card card--compact text-center' },
            React.createElement('p', { className: 'text-body' }, `Space data not found for ${spaceName}`)
        );
    }
    
    const nextSpaces = ComponentUtils.getNextSpaces(spaceData);
    const cardTypes = ComponentUtils.getCardTypes(spaceData);
    
    return React.createElement('div',
        { className: 'flex flex-col gap-4' },
        
        // Space name and phase
        React.createElement('div',
            { className: 'flex flex-col gap-2' },
            React.createElement('h4', { className: 'heading-3' }, spaceData.space_name),
            React.createElement('div',
                { className: 'flex items-center gap-2' },
                React.createElement('span',
                    { className: `badge badge--${getPhaseColor(spaceData.phase)}` },
                    spaceData.phase
                ),
                isValidMove && React.createElement('span',
                    { className: 'badge badge--success' },
                    '✓ Valid Move'
                )
            )
        ),
        
        // Event description
        spaceData.Event && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Event'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Event)
        ),
        
        // Action description
        spaceData.Action && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Action'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Action)
        ),
        
        // Outcome
        spaceData.Outcome && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Outcome'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Outcome)
        ),
        
        // Costs
        (spaceData.Time || spaceData.Fee) && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Costs'),
            spaceData.Time && React.createElement('div',
                { className: 'flex justify-between mb-2' },
                React.createElement('span', { className: 'text-small' }, 'Time:'),
                React.createElement('span', { className: 'text-small font-weight-medium' }, spaceData.Time)
            ),
            spaceData.Fee && React.createElement('div',
                { className: 'flex justify-between' },
                React.createElement('span', { className: 'text-small' }, 'Fee:'),
                React.createElement('span', { className: 'text-small font-weight-medium' }, spaceData.Fee)
            )
        ),
        
        // Card effects
        cardTypes.length > 0 && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Card Effects'),
            cardTypes.map(({ type, action }) =>
                React.createElement('div',
                    {
                        key: type,
                        className: 'flex justify-between mb-2'
                    },
                    React.createElement('span', { className: 'text-small' }, `${type} Cards:`),
                    React.createElement('span', { className: 'text-small font-weight-medium' }, action)
                )
            )
        ),
        
        // Dice roll requirement
        ComponentUtils.requiresDiceRoll(spaceData) && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Dice Roll Required'),
            React.createElement('p', { className: 'text-small mb-0' }, 'This space requires rolling dice to determine outcome')
        ),
        
        // Next spaces
        nextSpaces.length > 0 && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Connected Spaces'),
            React.createElement('div',
                { className: 'flex flex-col gap-2' },
                nextSpaces.map(nextSpace =>
                    React.createElement('button',
                        {
                            key: nextSpace,
                            className: 'btn btn--secondary btn--sm',
                            onClick: () => onExploreSpace(nextSpace)
                        },
                        nextSpace
                    )
                )
            )
        ),
        
        // Negotiation option
        spaceData.Negotiate === 'YES' && React.createElement('div',
            { className: 'card card--compact' },
            React.createElement('h5', { className: 'heading-5 mb-2' }, 'Negotiation'),
            React.createElement('p', { className: 'text-small mb-0' }, 'You can negotiate and re-roll instead of accepting the outcome')
        )
    );
}

// Export components
window.SpaceExplorer = SpaceExplorer;
window.SpaceDetails = SpaceDetails;