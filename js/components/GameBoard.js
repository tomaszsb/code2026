/**
 * GameBoard - Main game interface
 * Shows current game state and handles player interactions
 */

function GameBoard() {
    const [gameState, gameStateManager] = useGameState();
    const [selectedSpace, setSelectedSpace] = useState(null);
    
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Handle space selection
    const handleSpaceClick = (spaceName) => {
        const spaceData = CSVDatabase.spaces.find(spaceName, 'First');
        setSelectedSpace({ name: spaceName, data: spaceData });
    };
    
    // Handle player move
    const handleMovePlayer = (spaceName, visitType = 'First') => {
        gameStateManager.emit('movePlayerRequest', {
            playerId: gameState.currentPlayer,
            spaceName,
            visitType
        });
        setSelectedSpace(null);
    };
    
    // End current turn
    const endTurn = () => {
        const nextPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        gameStateManager.startTurn(nextPlayer);
    };
    
    return React.createElement('div', 
        { className: 'game-board' },
        
        // Header
        React.createElement('div', 
            { className: 'game-header' },
            React.createElement('h1', null, 'Project Management Board Game'),
            React.createElement('div', 
                { className: 'turn-info' },
                `Turn ${gameState.turnCount} - ${currentPlayer?.name || 'Unknown'}'s Turn`
            )
        ),
        
        // Main game area
        React.createElement('div', 
            { className: 'game-main' },
            
            // Left sidebar - Player status
            React.createElement('div', 
                { className: 'player-sidebar' },
                React.createElement('h2', null, 'Players'),
                gameState.players.map((player, index) => 
                    React.createElement('div', 
                        { 
                            key: player.id,
                            className: `player-status ${index === gameState.currentPlayer ? 'active' : ''}`
                        },
                        React.createElement('h3', null, player.name),
                        React.createElement('div', { className: 'player-info' },
                            React.createElement('div', null, `Position: ${player.position}`),
                            React.createElement('div', null, `Money: ${ComponentUtils.formatMoney(player.money)}`),
                            React.createElement('div', null, `Time: ${ComponentUtils.formatTime(player.timeSpent)}`),
                            React.createElement('div', null, 
                                `Cards: W:${player.cards.W?.length || 0} B:${player.cards.B?.length || 0} ` +
                                `I:${player.cards.I?.length || 0} L:${player.cards.L?.length || 0} E:${player.cards.E?.length || 0}`
                            )
                        )
                    )
                )
            ),
            
            // Center - Game board
            React.createElement('div', 
                { className: 'board-area' },
                React.createElement('h2', null, 'Current Space'),
                currentPlayer && React.createElement(SpaceDisplay, {
                    spaceName: currentPlayer.position,
                    visitType: currentPlayer.visitType,
                    onMoveRequest: handleMovePlayer
                })
            ),
            
            // Right sidebar - Actions
            React.createElement('div', 
                { className: 'actions-sidebar' },
                React.createElement('h2', null, 'Actions'),
                React.createElement('button', 
                    { 
                        className: 'end-turn-button',
                        onClick: endTurn 
                    },
                    'End Turn'
                ),
                
                // Error display
                gameState.error && React.createElement('div', 
                    { className: 'error-display' },
                    React.createElement('h3', null, 'Error'),
                    React.createElement('p', null, gameState.error),
                    React.createElement('button', 
                        { onClick: () => gameStateManager.clearError() },
                        'Clear'
                    )
                )
            )
        ),
        
        // Space detail modal
        selectedSpace && React.createElement(SpaceModal, {
            space: selectedSpace,
            onClose: () => setSelectedSpace(null),
            onMove: handleMovePlayer
        })
    );
}

/**
 * SpaceDisplay - Shows current space information
 */
function SpaceDisplay({ spaceName, visitType, onMoveRequest }) {
    const spaceData = CSVDatabase.spaces.find(spaceName, visitType);
    
    if (!spaceData) {
        return React.createElement('div', 
            { className: 'space-display error' },
            `Space ${spaceName}/${visitType} not found`
        );
    }
    
    const nextSpaces = ComponentUtils.getNextSpaces(spaceData);
    const cardTypes = ComponentUtils.getCardTypes(spaceData);
    
    return React.createElement('div', 
        { className: 'space-display' },
        React.createElement('h3', null, spaceData.space_name),
        React.createElement('div', { className: 'space-phase' }, `Phase: ${spaceData.phase}`),
        
        spaceData.Event && React.createElement('div', 
            { className: 'space-event' },
            React.createElement('h4', null, 'Event'),
            React.createElement('p', null, spaceData.Event)
        ),
        
        spaceData.Action && React.createElement('div', 
            { className: 'space-action' },
            React.createElement('h4', null, 'Action'),
            React.createElement('p', null, spaceData.Action)
        ),
        
        cardTypes.length > 0 && React.createElement('div', 
            { className: 'space-cards' },
            React.createElement('h4', null, 'Card Effects'),
            cardTypes.map(({ type, action }) => 
                React.createElement('div', 
                    { key: type, className: 'card-effect' },
                    `${type}: ${action}`
                )
            )
        ),
        
        (spaceData.Time || spaceData.Fee) && React.createElement('div', 
            { className: 'space-costs' },
            React.createElement('h4', null, 'Costs'),
            spaceData.Time && React.createElement('div', null, `Time: ${spaceData.Time}`),
            spaceData.Fee && React.createElement('div', null, `Fee: ${spaceData.Fee}`)
        ),
        
        nextSpaces.length > 0 && React.createElement('div', 
            { className: 'next-spaces' },
            React.createElement('h4', null, 'Move Options'),
            nextSpaces.map(spaceName => 
                React.createElement('button', 
                    { 
                        key: spaceName,
                        onClick: () => onMoveRequest(spaceName),
                        className: 'move-button'
                    },
                    spaceName
                )
            )
        )
    );
}

/**
 * SpaceModal - Detailed space information modal
 */
function SpaceModal({ space, onClose, onMove }) {
    return React.createElement('div', 
        { className: 'modal-overlay', onClick: onClose },
        React.createElement('div', 
            { 
                className: 'modal-content',
                onClick: (e) => e.stopPropagation()
            },
            React.createElement('h2', null, space.name),
            React.createElement('button', 
                { className: 'close-button', onClick: onClose },
                '×'
            ),
            React.createElement(SpaceDisplay, {
                spaceName: space.name,
                visitType: 'First',
                onMoveRequest: onMove
            })
        )
    );
}

// Export components
window.GameBoard = GameBoard;
window.SpaceDisplay = SpaceDisplay;