/**
 * SpaceExplorer - Interactive space information panel
 * Shows detailed space information and allows exploration
 */

// React hooks
const { useState, useEffect } = React;

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
    const { useState, useEffect, useCallback } = React;
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
    const clearSelection = useCallback(() => {
        setSelectedSpace(null);
    }, []);
    
    // Explore related space
    const exploreSpace = useCallback((spaceName) => {
        const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
        if (spaceData) {
            gameStateManager.emit('spaceSelected', {
                spaceName,
                spaceData,
                isValidMove: false,
                player: gameState.players[gameState.currentPlayer]
            });
        }
    }, [gameStateManager, gameState.players, gameState.currentPlayer]);
    
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
        
        // Movement info (no direct movement button)
        isValidMove && React.createElement('div',
            { className: 'mt-6 pt-4 border-t border-neutral-200' },
            React.createElement('div',
                {
                    className: 'movement-info'
                },
                React.createElement('p', {
                    className: 'text-small',
                    style: { fontStyle: 'italic', color: '#0066cc' }
                }, `✓ This is a valid move from your current position`)
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
    const requiresDice = ComponentUtils.requiresDiceRoll(spaceData);
    
    // Determine visit status
    const visitStatus = 'First Visit'; // TODO: Track actual visit history
    
    // Get movement choices
    const movementChoices = [];
    if (spaceData.space_1) movementChoices.push(spaceData.space_1);
    if (spaceData.space_2) movementChoices.push(spaceData.space_2);
    if (spaceData.space_3) movementChoices.push(spaceData.space_3);
    if (spaceData.space_4) movementChoices.push(spaceData.space_4);
    if (spaceData.space_5) movementChoices.push(spaceData.space_5);
    
    return React.createElement('div',
        { className: 'space-explorer-details' },
        
        // Space name and visit status
        React.createElement('div',
            { className: 'space-header' },
            React.createElement('h2', { className: 'space-name' }, spaceData.space_name || spaceName),
            React.createElement('div', { className: 'visit-status' }, visitStatus)
        ),
        
        // Dice roll requirement alert
        requiresDice && React.createElement('div',
            { className: 'dice-alert' },
            React.createElement('span', { className: 'alert-icon' }, '🎲'),
            React.createElement('span', { className: 'alert-text' }, 'This space requires a dice roll')
        ),
        
        // Event section
        spaceData.Event && React.createElement('div',
            { className: 'space-section' },
            React.createElement('h4', { className: 'section-title' }, 'Event:'),
            React.createElement('div', { className: 'section-content event-content' }, spaceData.Event)
        ),
        
        // Action section
        spaceData.Action && React.createElement('div',
            { className: 'space-section' },
            React.createElement('h4', { className: 'section-title' }, 'Action:'),
            React.createElement('div', { className: 'section-content action-content' }, spaceData.Action)
        ),
        
        // Card draw effects
        cardTypes.length > 0 && React.createElement('div',
            { className: 'space-section' },
            cardTypes.map(({ type, action }) => {
                // Extract number from action (e.g., "Draw 3" -> "3")
                const match = action.match(/(\d+)/);
                const count = match ? match[1] : action;
                
                return React.createElement('div',
                    { 
                        key: type,
                        className: `card-draw-badge card-draw-${type.toLowerCase()}`
                    },
                    React.createElement('span', { className: 'badge-icon' }, getCardTypeIcon(type)),
                    React.createElement('span', { className: 'badge-text' }, `Draw ${count} ${type} Cards`)
                );
            })
        ),
        
        // Time cost
        spaceData.Time && React.createElement('div',
            { className: 'space-section time-section' },
            React.createElement('span', { className: 'time-label' }, 'Time:'),
            React.createElement('span', { className: 'time-value' }, spaceData.Time)
        ),
        
        // Movement choices
        movementChoices.length > 0 && React.createElement('div',
            { className: 'space-section' },
            React.createElement('h4', { className: 'section-title' }, 'Movement Choices:'),
            React.createElement('div',
                { className: 'movement-list' },
                movementChoices.map((choice, index) => 
                    choice && choice !== 'n/a' && React.createElement('div',
                        { 
                            key: index,
                            className: 'movement-item'
                        },
                        React.createElement('span', { className: 'movement-number' }, `${index + 1}.`),
                        React.createElement('button',
                            {
                                className: 'movement-link',
                                onClick: () => onExploreSpace(choice)
                            },
                            choice
                        )
                    )
                )
            )
        ),
        
        // Dice roll outcomes
        requiresDice && React.createElement(DiceOutcomes, {
            spaceName: spaceName,
            spaceData: spaceData
        }),
        
        // Fee information
        spaceData.Fee && React.createElement('div',
            { className: 'space-section' },
            React.createElement('h4', { className: 'section-title' }, 'Fee:'),
            React.createElement('div', { className: 'section-content' }, spaceData.Fee)
        ),
        
        // Outcome information
        spaceData.Outcome && React.createElement('div',
            { className: 'space-section' },
            React.createElement('h4', { className: 'section-title' }, 'Outcome:'),
            React.createElement('div', { className: 'section-content' }, spaceData.Outcome)
        ),
        
        // Negotiation option
        spaceData.Negotiate === 'YES' && React.createElement('div',
            { className: 'space-section negotiation-section' },
            React.createElement('h4', { className: 'section-title' }, 'Negotiation Available'),
            React.createElement('div', { className: 'section-content' }, 'You can negotiate and re-roll instead of accepting the outcome')
        )
    );
}

/**
 * DiceOutcomes - Display dice roll outcomes for a space
 */
function DiceOutcomes({ spaceName, spaceData }) {
    const [diceData, setDiceData] = useState(null);
    
    useEffect(() => {
        // Get dice data for this space
        const diceOutcomes = window.CSVDatabase?.dice?.query({ space: spaceName });
        if (diceOutcomes && diceOutcomes.length > 0) {
            setDiceData(diceOutcomes[0]);
        }
    }, [spaceName]);
    
    if (!diceData) {
        return null;
    }
    
    return React.createElement('div',
        { className: 'space-section dice-outcomes-section' },
        React.createElement('h4', { className: 'section-title' }, 'Dice Roll Outcomes:'),
        React.createElement('div',
            { className: 'dice-outcomes-table' },
            [1, 2, 3, 4, 5, 6].map(roll => {
                const outcome = diceData[roll.toString()];
                if (!outcome || outcome === 'n/a') return null;
                
                return React.createElement('div',
                    {
                        key: roll,
                        className: 'dice-outcome-row'
                    },
                    React.createElement('span', { className: 'dice-roll-number' }, roll),
                    React.createElement('span', { className: 'dice-outcome-text' }, outcome)
                );
            })
        )
    );
}

// Helper function to get card type icons
function getCardTypeIcon(type) {
    const icons = {
        'W': '🔧',
        'B': '💼',
        'I': '🔍',
        'L': '⚖️',
        'E': '⚠️'
    };
    return icons[type] || '🃏';
}

// Export components
window.SpaceExplorer = SpaceExplorer;
window.SpaceDetails = SpaceDetails;
window.DiceOutcomes = DiceOutcomes;