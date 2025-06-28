/**
 * GameBoard - Main game interface controller
 * Refactored to use BoardRenderer components for better maintainability
 * Focuses on game logic and state management, visual rendering delegated to BoardRenderer
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
            const currentSpaceData = window.CSVDatabase.spaceContent.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentPlayer.position, currentPlayer.visitType || 'First');
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
        
        const spaceData = window.CSVDatabase.spaceContent.find(spaceName, 'First');
        
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
        const spaceData = window.CSVDatabase.spaceContent.find(spaceName, visitType);
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
            visitedSpaces: [...prev.visitedSpaces, spaceData.space_name]
        }));
    };
    
    // Process individual card effect
    const processCardEffect = (effectText, cardType, player) => {
        gameStateManager.emit('cardEffectTriggered', {
            effect: effectText,
            cardType: cardType,
            player: player,
            source: 'space'
        });
    };
    
    // For panel layout, defer to GamePanelLayout
    if (isPanelLayoutActive) {
        return React.createElement(GamePanelLayout);
    }
    
    // Legacy layout for when panel system not active
    if (!gameState.players || gameState.players.length === 0) {
        return React.createElement('div', 
            { className: 'game-board-wrapper' },
            React.createElement('div', 
                { className: 'card' },
                React.createElement('h2', { className: 'heading-2' }, 'No Game Active'),
                React.createElement('p', { className: 'text-body' }, 'Please start a new game or load a saved game.')
            )
        );
    }
    
    return React.createElement('div', 
        { 
            className: 'game-board-wrapper layout-grid layout-grid--main',
            style: { minHeight: '100vh', background: '#f0f0f0', padding: '20px' }
        },
        
        
        // Header
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
            
            // Game board section - now uses BoardRenderer
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
            
            // Current space section - now uses BoardRenderer
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
            )
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
                    React.createElement('div', 
                        { className: 'card' },
                        React.createElement('p', { className: 'text-body' }, 'Use Action Panel for game controls')
                    )
                )
            )
        )
    );
}

// Export component  
window.GameBoard = GameBoard;