/**
 * GameBoard - Main game interface
 * Shows current game state and handles player interactions
 */

function GameBoard() {
    const { useState, useEffect, useCallback } = React;
    const [gameState, gameStateManager] = useGameState();
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [availableMoves, setAvailableMoves] = useState([]);
    const [boardState, setBoardState] = useState({
        highlightedSpaces: [],
        visitedSpaces: []
    });
    
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Check if panel layout is active
    const isPanelLayoutActive = window.GamePanelLayout && gameState.players && gameState.players.length > 0;
    
    // Update available moves when current player or position changes
    useEffect(() => {
        if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaces.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentSpaceData);
                setAvailableMoves(moves);
                
                // Update board state
                setBoardState(prev => ({
                    ...prev,
                    highlightedSpaces: moves
                }));
                
                gameStateManager.emit('availableMovesUpdated', {
                    player: currentPlayer,
                    availableMoves: moves
                });
            }
        }
    }, [currentPlayer?.position, currentPlayer?.visitType, currentPlayer?.id]);
    
    // Handle space selection - only updates Space Explorer, never moves player
    const handleSpaceClick = useCallback((spaceName) => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return;
        
        const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
        
        // Check if this is a valid move (for display purposes only)
        const isValidMove = availableMoves.includes(spaceName);
        const isCurrentPosition = currentPlayer && currentPlayer.position === spaceName;
        
        // Always just show space details and update Space Explorer - never move
        setSelectedSpace({ name: spaceName, data: spaceData, isValidMove });
        
        // Update Space Explorer panel
        gameStateManager.emit('spaceSelected', {
            spaceName,
            spaceData,
            isValidMove,
            player: currentPlayer
        });
    }, [availableMoves, currentPlayer, gameStateManager]);
    
    // Handle player move with CSV-driven logic
    const handleMovePlayer = useCallback((spaceName, visitType = 'First') => {
        if (!currentPlayer || !window.CSVDatabase || !window.CSVDatabase.loaded) return;
        
        // Get space data to determine effects
        const spaceData = window.CSVDatabase.spaces.find(spaceName, visitType);
        if (!spaceData) {
            gameStateManager.handleError(`Space ${spaceName}/${visitType} not found`);
            return;
        }
        
        // Move player
        gameStateManager.movePlayer(gameState.currentPlayer, spaceName, visitType);
        
        // Process space effects
        processSpaceEffects(spaceData, currentPlayer);
        
        setSelectedSpace(null);
    }, [currentPlayer, gameState.currentPlayer, gameStateManager]);
    
    // Process space effects based on CSV data
    const processSpaceEffects = (spaceData, player) => {
        // Time cost
        if (spaceData.Time) {
            const timeValue = parseInt(spaceData.Time) || 0;
            if (timeValue > 0) {
                gameStateManager.emit('playerTimeChanged', {
                    playerId: player.id,
                    timeChange: timeValue,
                    reason: `Time spent at ${spaceData.space_name}`
                });
            }
        }
        
        // Fee cost
        if (spaceData.Fee) {
            const feeValue = ComponentUtils.parseFeeAmount(spaceData.Fee);
            if (feeValue > 0) {
                gameStateManager.updatePlayerMoney(player.id, -feeValue, `Fee at ${spaceData.space_name}`);
            }
        }
        
        // Card effects
        ['w_card', 'b_card', 'i_card', 'l_card', 'e_card'].forEach(cardType => {
            if (spaceData[cardType]) {
                processCardEffect(spaceData[cardType], cardType.charAt(0).toUpperCase(), player);
            }
        });
        
        // Mark space as visited
        setBoardState(prev => ({
            ...prev,
            visitedSpaces: [...new Set([...prev.visitedSpaces, spaceData.space_name])]
        }));
    };
    
    // Process card effects from CSV
    const processCardEffect = (cardEffect, cardType, player) => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return;
        
        if (cardEffect.includes('Draw')) {
            const drawCount = parseInt(cardEffect.match(/\d+/)?.[0]) || 1;
            const cards = window.CSVDatabase.cards.query({ card_type: cardType });
            const drawnCards = cards.slice(0, drawCount);
            
            gameStateManager.addCardsToPlayer(player.id, cardType, drawnCards);
        } else if (cardEffect.includes('Return')) {
            const returnCount = parseInt(cardEffect.match(/\d+/)?.[0]) || 1;
            gameStateManager.emit('returnCardsRequest', {
                playerId: player.id,
                cardType,
                count: returnCount
            });
        } else if (cardEffect.includes('Replace')) {
            const replaceCount = parseInt(cardEffect.match(/\d+/)?.[0]) || 1;
            gameStateManager.emit('replaceCardsRequest', {
                playerId: player.id,
                cardType,
                count: replaceCount
            });
        }
    };
    
    // End current turn
    const endTurn = () => {
        const nextPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
        gameStateManager.startTurn(nextPlayer);
    };
    
    // Take action on current space (dice or direct action)
    const takeAction = () => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return;
        
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
    
    // If panel layout is active, only render the visual board
    if (isPanelLayoutActive) {
        return React.createElement(VisualBoard, {
            gameState,
            onSpaceClick: handleSpaceClick,
            availableMoves,
            boardState,
            currentPlayer
        });
    }

    // Full GameBoard UI for fallback/original mode
    return React.createElement('div', 
        { className: 'layout-grid layout-grid--main' },
        
        // Header (spans full width)
        React.createElement('div', 
            { 
                className: 'card section__header',
                style: { gridColumn: '1 / -1' }
            },
            React.createElement('h1', { className: 'heading-1' }, 'Project Management Board Game'),
            React.createElement('div', 
                { className: 'flex items-center gap-4' },
                React.createElement('span', { className: 'badge badge--primary' }, 
                    `Turn ${gameState.turnCount}`
                ),
                React.createElement('span', { className: 'text-body' }, 
                    `${currentPlayer?.name || 'Unknown'}'s Turn`
                )
            )
        ),
        
        // Main game area
        React.createElement('div', 
            { className: 'game-main', style: { gridColumn: '1 / 3' } },
            
            // Player info section
            React.createElement('section', 
                { className: 'section' },
                React.createElement('div', 
                    { className: 'section__header' },
                    React.createElement('h2', { className: 'section__title' }, 'Players')
                ),
                React.createElement('div', 
                    { className: 'flex gap-4' },
                    gameState.players.map((player, index) => 
                        React.createElement('div', 
                            { 
                                key: player.id,
                                className: `card card--compact ${index === gameState.currentPlayer ? 'is-active' : ''}`
                            },
                            React.createElement('div', { className: 'heading-4 mb-2' }, player.name),
                            React.createElement('div', { className: 'text-small mb-2' }, player.position),
                            React.createElement('div', { className: 'text-small' }, ComponentUtils.formatMoney(player.money))
                        )
                    )
                )
            ),
            
            // Game board section
            React.createElement('section', 
                { className: 'section' },
                React.createElement('div', 
                    { className: 'section__header' },
                    React.createElement('h2', { className: 'section__title' }, 'Game Board')
                ),
                React.createElement('div', 
                    { className: 'section__content' },
                    React.createElement(VisualBoard, {
                        gameState,
                        onSpaceClick: handleSpaceClick,
                        availableMoves,
                        boardState,
                        currentPlayer
                    })
                )
            ),
            
            // Current space section
            currentPlayer && React.createElement('section', 
                { className: 'section' },
                React.createElement('div', 
                    { className: 'section__header' },
                    React.createElement('h2', { className: 'section__title' }, 'Current Space')
                ),
                React.createElement('div', 
                    { className: 'card' },
                    React.createElement(SpaceDisplay, {
                        spaceName: currentPlayer.position,
                        visitType: currentPlayer.visitType,
                        onMoveRequest: null
                    })
                )
            ),
            
        ),
        
        // Right sidebar - Space Explorer and Actions
        React.createElement('div', 
            { className: 'flex flex-col gap-4', style: { gridColumn: '3 / 4' } },
            
            // Space Explorer Panel
            React.createElement('div',
                { className: 'card' },
                React.createElement(SpaceExplorer)
            ),
            
            // Actions section
            React.createElement('section', 
                { className: 'section' },
                React.createElement('div', 
                    { className: 'section__header' },
                    React.createElement('h2', { className: 'section__title' }, 'Actions')
                ),
                React.createElement('div', 
                    { className: 'section__content' },
                    React.createElement('button', 
                        { 
                            className: 'btn btn--primary btn--full mb-4',
                            onClick: takeAction 
                        },
                        'Take Action'
                    ),
                    React.createElement('button', 
                        { 
                            className: 'btn btn--danger btn--full',
                            onClick: endTurn 
                        },
                        'End Turn'
                    )
                )
            ),
            
            // Error display
            gameState.error && React.createElement('div', 
                { className: 'card' },
                React.createElement('div', 
                    { className: 'section__header' },
                    React.createElement('h3', { className: 'section__title' }, 'Error')
                ),
                React.createElement('p', { className: 'text-body mb-4' }, gameState.error),
                React.createElement('button', 
                    { 
                        className: 'btn btn--secondary btn--full',
                        onClick: () => gameStateManager.clearError() 
                    },
                    'Clear'
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
    if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
    
    const spaceData = window.CSVDatabase.spaces.find(spaceName, visitType);
    
    if (!spaceData) {
        return React.createElement('div', 
            { className: 'text-center' },
            React.createElement('p', { className: 'text-body' }, `Space ${spaceName}/${visitType} not found`)
        );
    }
    
    const nextSpaces = ComponentUtils.getNextSpaces(spaceData);
    const cardTypes = ComponentUtils.getCardTypes(spaceData);
    
    return React.createElement('div', 
        { className: 'flex flex-col gap-4' },
        React.createElement('div',
            { className: 'flex items-center gap-2' },
            React.createElement('h3', { className: 'heading-3' }, spaceData.space_name),
            React.createElement('span', { className: 'badge badge--primary' }, spaceData.phase)
        ),
        
        spaceData.Event && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Event'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Event)
        ),
        
        spaceData.Action && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Action'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Action)
        ),
        
        cardTypes.length > 0 && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Card Effects'),
            cardTypes.map(({ type, action }) => 
                React.createElement('div', 
                    { key: type, className: 'flex justify-between mb-2' },
                    React.createElement('span', { className: 'text-small' }, `${type}:`),
                    React.createElement('span', { className: 'text-small font-weight-medium' }, action)
                )
            )
        ),
        
        (spaceData.Time || spaceData.Fee) && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Costs'),
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
        
        nextSpaces.length > 0 && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Move Options'),
            React.createElement('div',
                { className: 'text-body' },
                React.createElement('p', { className: 'text-small mb-2' }, 'Available moves from this space:'),
                React.createElement('div',
                    { className: 'flex flex-col gap-1' },
                    nextSpaces.map(spaceName => 
                        React.createElement('div', 
                            { 
                                key: spaceName,
                                className: 'text-small'
                            },
                            `• ${spaceName}`
                        )
                    )
                ),
                React.createElement('p', { 
                    className: 'text-small mt-2', 
                    style: { fontStyle: 'italic', color: '#666' } 
                }, 'Use the Action Panel to select and confirm moves')
            )
        )
    );
}

/**
 * VisualBoard - Visual representation of the game board
 */
function VisualBoard({ gameState, onSpaceClick, availableMoves, boardState, currentPlayer }) {
    const [allSpaces, setAllSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Load all unique spaces for the board
        if (window.CSVDatabase && window.CSVDatabase.loaded) {
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
                { key: phase, className: 'phase-section' },
                React.createElement('h4', { className: 'phase-title' }, phase),
                React.createElement('div', 
                    { className: 'spaces-container' },
                    spaces.map(space => 
                        React.createElement(BoardSpace, {
                            key: space.space_name,
                            space,
                            players: gameState.players.filter(p => p.position === space.space_name),
                            onClick: () => onSpaceClick(space.space_name),
                            isAvailableMove: availableMoves.includes(space.space_name),
                            isCurrentPosition: currentPlayer && currentPlayer.position === space.space_name,
                            isVisited: boardState.visitedSpaces.includes(space.space_name)
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
function BoardSpace({ space, players, onClick, isAvailableMove, isCurrentPosition, isVisited }) {
    const hasPlayers = players.length > 0;
    
    // Build CSS classes based on state
    const spaceClasses = [
        'board-space',
        hasPlayers ? 'has-players' : '',
        isAvailableMove ? 'available-move' : '',
        isCurrentPosition ? 'current-position' : '',
        isVisited ? 'visited' : '',
        isAvailableMove ? 'clickable' : ''
    ].filter(Boolean).join(' ');
    
    return React.createElement('div', 
        { 
            className: spaceClasses,
            onClick,
            title: `${space.space_name}${isAvailableMove ? ' (Click to move)' : ''}${isCurrentPosition ? ' (Current position)' : ''}`
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
        ),
        isAvailableMove && React.createElement('div', 
            { className: 'move-indicator' },
            '→'
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
                onMoveRequest: null
            })
        )
    );
}

// Export components
window.GameBoard = GameBoard;
window.SpaceDisplay = SpaceDisplay;
window.VisualBoard = VisualBoard;
window.BoardSpace = BoardSpace;