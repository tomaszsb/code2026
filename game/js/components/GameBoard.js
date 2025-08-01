/**
 * GameBoard - Main game interface controller
 * Refactored to use BoardRenderer components for better maintainability
 * Focuses on game logic and state management, visual rendering delegated to BoardRenderer
 */

function GameBoard() {
    const { useState, useEffect, useCallback } = React;
    const [gameState, gameStateManager] = window.useGameState();
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [availableMoves, setAvailableMoves] = useState([]);
    const [boardState, setBoardState] = useState({
        highlightedSpaces: [],
        visitedSpaces: []
    });
    
    const currentPlayer = gameState.players?.find(p => p.id === gameState.currentPlayer);
    
    // Check if panel layout is active
    const isPanelLayoutActive = window.GamePanelLayout && gameState.players && gameState.players.length > 0;
    
    // Update available moves when current player or position changes
    useEffect(() => {
        if (!gameStateManager) {
            return; // Do nothing if the manager isn't ready
        }
        
        if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaceContent.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = window.ComponentUtils.getNextSpaces(currentPlayer.position, currentPlayer.visitType || 'First');
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
    }, [gameStateManager, currentPlayer?.position, currentPlayer?.visitType, currentPlayer?.id]);
    
    // Handle space selection - only updates Space Explorer, never moves player
    const handleSpaceClick = useCallback((spaceName) => {
        if (!gameStateManager) return;
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
        if (!gameStateManager) return;
        if (!currentPlayer || !window.CSVDatabase || !window.CSVDatabase.loaded) return;
        
        // Get space data to determine effects
        const spaceData = window.CSVDatabase.spaceContent.find(spaceName, visitType);
        if (!spaceData) {
            gameStateManager.handleError(`Space ${spaceName}/${visitType} not found`);
            return;
        }
        
        // Move player
        gameStateManager.movePlayer(currentPlayer.id, spaceName, visitType);
        
        // Process space effects
        processSpaceEffects(spaceData, currentPlayer);
        
        setSelectedSpace(null);
    }, [currentPlayer, gameStateManager]);
    
    // Process space effects based on CSV data
    const processSpaceEffects = (spaceData, player) => {
        if (!gameStateManager) return;
        
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
            const feeValue = window.ComponentUtils.parseFeeAmount(spaceData.Fee);
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
        if (!gameStateManager) return;
        
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
                padding: '10px',
                margin: '0',
                width: '100%',
                minWidth: '600px',
                overflow: 'auto'
            }
        },
        // Game Board with seamlessly integrated Future Log
        React.createElement('div', {
            style: {
                margin: '0',
                padding: '10px',
                height: 'fit-content',
                maxHeight: '100%',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                background: '#fff'
            }
        }, [
            React.createElement('h2', { 
                key: 'board-title',
                style: { 
                    margin: '0 0 10px 0', 
                    padding: '0',
                    fontSize: '18px',
                    color: '#4285f4'
                } 
            }, 'Game Board'),
            React.createElement(window.VisualBoard, {
                key: 'visual-board',
                gameState,
                onSpaceClick: handleSpaceClick,
                availableMoves,
                boardState,
                currentPlayer
            }),
            
            // Future Log Area - Seamlessly integrated with same background
            React.createElement('div', {
                key: 'seamless-future-log',
                style: {
                    background: '#fff',
                    padding: '15px 0 0 0',
                    textAlign: 'center',
                    color: '#6c757d',
                    height: '80px'
                }
            }, [
                React.createElement('h4', {
                    key: 'future-log-title',
                    style: { margin: '10px 0', color: '#495057' }
                }, '📝 Future Log Area'),
                React.createElement('p', {
                    key: 'future-log-text',
                    style: { margin: 0, fontStyle: 'italic' }
                }, 'This area is reserved for future logging functionality')
            ])
        ])
    );
}

// Export component  
window.GameBoard = GameBoard;