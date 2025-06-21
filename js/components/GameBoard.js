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
        const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
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
    
    // Take action on current space (dice or direct action)
    const takeAction = () => {
        const spaceData = window.CSVDatabase.spaces.find(
            currentPlayer.position, 
            currentPlayer.visitType || 'First'
        );
        
        if (ComponentUtils.requiresDiceRoll(spaceData)) {
            // Show dice roll
            gameStateManager.emit('showDiceRoll', {
                playerId: gameState.currentPlayer,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
        } else {
            // Process space effects directly
            gameStateManager.emit('movePlayerRequest', {
                playerId: gameState.currentPlayer,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
        }
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
            
            // Compact player info in header - no sidebar
            React.createElement('div', 
                { className: 'compact-player-info' },
                gameState.players.map((player, index) => 
                    React.createElement('div', 
                        { 
                            key: player.id,
                            className: `compact-player ${index === gameState.currentPlayer ? 'active' : ''}`
                        },
                        React.createElement('span', { className: 'player-name' }, player.name),
                        React.createElement('span', { className: 'player-position' }, player.position),
                        React.createElement('span', { className: 'player-money' }, ComponentUtils.formatMoney(player.money))
                    )
                )
            ),
            
            // Center - Visual Game board
            React.createElement('div', 
                { className: 'board-area' },
                React.createElement('h2', null, 'Game Board'),
                React.createElement(VisualBoard, {
                    gameState,
                    onSpaceClick: handleSpaceClick
                }),
                React.createElement('div', { className: 'current-space-section' },
                    React.createElement('h3', null, 'Current Space'),
                    currentPlayer && React.createElement(SpaceDisplay, {
                        spaceName: currentPlayer.position,
                        visitType: currentPlayer.visitType,
                        onMoveRequest: handleMovePlayer
                    })
                )
            ),
            
            // Right sidebar - Actions
            React.createElement('div', 
                { className: 'actions-sidebar' },
                React.createElement('h2', null, 'Actions'),
                React.createElement('button', 
                    { 
                        className: 'take-action-button',
                        onClick: takeAction 
                    },
                    'Take Action'
                ),
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
    const spaceData = window.CSVDatabase.spaces.find(spaceName, visitType);
    
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
 * VisualBoard - Visual representation of the game board
 */
function VisualBoard({ gameState, onSpaceClick }) {
    const [allSpaces, setAllSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Load all unique spaces for the board
        if (window.CSVDatabase.loaded) {
            const spaces = window.CSVDatabase.spaces.query();
            // Get unique spaces by name (ignoring visit type for board display)
            const uniqueSpaces = spaces.reduce((acc, space) => {
                if (!acc.find(s => s.space_name === space.space_name)) {
                    acc.push(space);
                }
                return acc;
            }, []);
            
            setAllSpaces(uniqueSpaces);
            setLoading(false);
        }
    }, []);
    
    if (loading) {
        return React.createElement('div', { className: 'board-loading' }, 'Loading board...');
    }
    
    // Group spaces by phase for visual organization
    const spacesByPhase = allSpaces.reduce((acc, space) => {
        const phase = space.phase || 'MISC';
        if (!acc[phase]) acc[phase] = [];
        acc[phase].push(space);
        return acc;
    }, {});
    
    return React.createElement('div', 
        { className: 'visual-board' },
        Object.entries(spacesByPhase).map(([phase, spaces]) =>
            React.createElement('div', 
                { key: phase, className: `phase-section phase-${phase.toLowerCase()}` },
                React.createElement('h4', { className: 'phase-title' }, phase),
                React.createElement('div', 
                    { className: 'spaces-container' },
                    spaces.map(space => 
                        React.createElement(BoardSpace, {
                            key: space.space_name,
                            space,
                            players: gameState.players.filter(p => p.position === space.space_name),
                            onClick: () => onSpaceClick(space.space_name)
                        })
                    )
                )
            )
        )
    );
}

/**
 * BoardSpace - Individual space on the board
 */
function BoardSpace({ space, players, onClick }) {
    const hasPlayers = players.length > 0;
    
    return React.createElement('div', 
        { 
            className: `board-space ${hasPlayers ? 'has-players' : ''}`,
            onClick,
            title: space.space_name
        },
        React.createElement('div', { className: 'space-name' }, space.space_name),
        React.createElement('div', { className: 'space-phase' }, space.phase),
        hasPlayers && React.createElement('div', 
            { className: 'players-on-space' },
            players.map(player => 
                React.createElement('div', 
                    { 
                        key: player.id,
                        className: 'player-piece',
                        style: { backgroundColor: player.color || '#333' },
                        title: player.name
                    },
                    player.name.charAt(0).toUpperCase()
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
window.VisualBoard = VisualBoard;
window.BoardSpace = BoardSpace;