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
    
    // Skip GamePanelLayout when used as a component within FixedApp
    // (GamePanelLayout creates its own full 3-panel layout which causes nesting)
    // if (isPanelLayoutActive) {
    //     return React.createElement(GamePanelLayout);
    // }
    
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
    
    // When used within FixedApp, just render the board content (no full layout)
    return React.createElement('div', 
        { 
            className: 'game-board-content',
            style: { 
                height: '100%', 
                padding: '20px',
                width: '100%',
                minWidth: '600px', // Ensure enough width for snake wrapping
                overflow: 'auto'   // Allow scrolling if needed
            }
        },
        // Just render the visual board - panels handle player info, space details, and actions
        React.createElement('div', 
            { className: 'section' },
            React.createElement('div', 
                { className: 'section__header' },
                React.createElement('h2', { className: 'section__title' }, 'Game Board')
            ),
            React.createElement('div', 
                { className: 'section__content' },
                React.createElement(window.VisualBoard, {
                    gameState,
                    onSpaceClick: handleSpaceClick,
                    availableMoves,
                    boardState,
                    currentPlayer
                })
            )
        )
    );
}

// Export component  
window.GameBoard = GameBoard;