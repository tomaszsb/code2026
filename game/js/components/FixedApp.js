/**
 * FixedApp - Fixed version using useGameState hook for automatic state synchronization
 */

function FixedApp({ debugMode = false, logLevel = 'info' }) {
    const { useState, useEffect } = React;
    const { loaded, error } = window.useCSVData();
    
    // Use working useGameState hook pattern (same as other components)
    const [gameState, gameStateManager] = window.useGameState();
    
    
    // Initialize game function - STABILIZED with useCallback
    const initializeGame = React.useCallback((players, settings = {}) => {
        console.log('🚀 initializeGame called with players:', players);
        console.log('🔍 gameStateManager availability:', gameStateManager ? 'AVAILABLE' : 'NULL/UNDEFINED');
        
        if (gameStateManager) {
            console.log('✅ Calling gameStateManager.initializeGame...');
            gameStateManager.initializeGame(players, settings);
            console.log('✅ gameStateManager.initializeGame completed');
        } else {
            console.error('❌ GameStateManager not available - cannot initialize game');
            alert('Game initialization failed: GameStateManager not ready. Please try again.');
        }
    }, [gameStateManager]);
    
    // Initialize systems - OPTIMIZED to prevent dependency loops
    useEffect(() => {
        // Only set global reference if gameStateManager is available
        if (gameStateManager) {
            window.FixedGameInitializer = { initializeGame };
        }
        
        // Initialize MovementEngine once when gameStateManager becomes available
        if (gameStateManager && window.MovementEngine) {
            try {
                const movementEngine = window.movementEngine || (window.MovementEngine?.getInstance && window.MovementEngine.getInstance());
                if (movementEngine && !movementEngine.gameStateManager) {
                    movementEngine.initialize(gameStateManager);
                }
            } catch (error) {
                console.error('Error initializing MovementEngine:', error);
            }
        }
    }, [gameStateManager]); // Only depend on gameStateManager, not initializeGame
    
    // Handle errors
    if (error) {
        return React.createElement('div', 
            { className: 'app-error' },
            React.createElement('h1', null, 'Failed to Load Game'),
            React.createElement('p', null, error),
            React.createElement('button', { onClick: () => window.location.reload() }, 'Reload')
        );
    }
    
    // Handle loading
    if (!loaded) {
        return React.createElement('div', { className: 'loading-screen' }, 'Loading game data...');
    }
    
    // Handle gameStateManager not available yet
    if (!gameStateManager) {
        return React.createElement('div', { className: 'loading-screen' }, 'Loading game system...');
    }
    
    const showPlayerSetup = gameState.gamePhase === 'SETUP' || gameState.players.length === 0;
    
    
    
    // Main application
    return React.createElement(window.ErrorBoundary, null,
        React.createElement('div', { className: 'app' },
            showPlayerSetup 
                ? React.createElement(EnhancedPlayerSetup, { 
                    onInitializeGame: initializeGame,
                    gameStateManager: gameStateManager 
                })
                : React.createElement(GameInterface, { 
                    gameState: gameState,
                    gameStateManager: gameStateManager,
                    debugMode: debugMode
                })
        )
    );
}

// Game interface component - Using actual game components
const GameInterface = React.memo(({ gameState, gameStateManager, debugMode }) => {
    const { useState, useEffect, useRef } = React;
    
    // STABILIZED UI STATE - Use useRef for non-reactive state to prevent re-renders
    const gameUIStateRef = useRef({
        showingDiceResult: false,
        diceResult: null,
        availableMoves: [],
        showingMoves: false,
        showSpaceExplorer: false,
        selectedSpaceData: null,
        // Modal management - scalable activeModal pattern
        activeModal: null, // 'DICE_RESULT', 'CARD_ACK', 'RULES', etc.
        modalProps: {}, // Props for the active modal
        // Legacy card acknowledgment state (to be migrated)
        showCardAcknowledgment: false,
        cardToAcknowledge: null,
        playerName: null
    });
    
    // Only use useState for state that actually needs to trigger re-renders
    const [forceRender, setForceRender] = useState(0);
    
    // Helper to update UI state and trigger re-render only when needed - STABILIZED
    const updateGameUIState = React.useCallback((updater) => {
        const currentState = gameUIStateRef.current;
        const newState = typeof updater === 'function' ? updater(currentState) : updater;
        gameUIStateRef.current = { ...currentState, ...newState };
        setForceRender(prev => prev + 1);
    }, []); // Empty dependency array since it only uses refs and setters
    
    // Handle modal closure - MOVED OUT OF useEffect TO MAIN COMPONENT SCOPE
    const handleCloseModal = React.useCallback(() => {
        updateGameUIState({
            activeModal: null,
            modalProps: {}
        });
        
        // Clear global modal state when any modal closes
        if (gameStateManager) {
            gameStateManager.setUIState('isDiceResultModalActive', false);
        }
    }, [updateGameUIState, gameStateManager]);

    // Handle dice result modal display - MOVED OUT OF useEffect TO MAIN COMPONENT SCOPE
    const handleShowDiceResult = React.useCallback(({ diceValue, effects, spaceName, visitType }) => {
        updateGameUIState({
            activeModal: 'DICE_RESULT',
            modalProps: {
                diceValue: diceValue,
                effects: effects,
                spaceName: spaceName,
                visitType: visitType
            }
        });
        
        // Make modal state globally accessible for CardActionsSection
        if (gameStateManager) {
            gameStateManager.setUIState('isDiceResultModalActive', true);
        }
    }, [updateGameUIState, gameStateManager]);
    
    
    
    // Get current player by ID lookup
    const currentPlayer = gameState.players?.find(p => p.id === gameState.currentPlayer);
    
    // Close space explorer modal - STABILIZED
    const closeSpaceExplorer = React.useCallback(() => {
        updateGameUIState({
            showSpaceExplorer: false,
            selectedSpaceData: null
        });
    }, [updateGameUIState]);
    
    useEffect(() => {
        const handleSpaceSelected = (data) => {
            updateGameUIState({
                showSpaceExplorer: true,
                selectedSpaceData: data
            });
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && gameUIStateRef.current.showSpaceExplorer) {
                closeSpaceExplorer();
            }
        };

        // Reset dice UI state when turn changes
        const handleTurnAdvanced = ({ previousPlayer, currentPlayer }) => {
            // Reset dice-related UI state for all players when turn advances
            updateGameUIState({
                showingDiceResult: false,
                diceResult: null,
                availableMoves: [],
                showingMoves: false
            });
        };

        // Handle card acknowledgment display
        const handleShowCardAcknowledgment = ({ card, playerId, playerName }) => {
            updateGameUIState({
                showCardAcknowledgment: true,
                cardToAcknowledge: card,
                playerName: playerName
            });
        };

        // Handle card acknowledgment completion
        const handleCardAcknowledged = ({ card, acknowledged }) => {
            updateGameUIState({
                showCardAcknowledgment: false,
                cardToAcknowledge: null,
                playerName: null
            });
        };



        if (gameStateManager) {
            gameStateManager.on('spaceSelected', handleSpaceSelected);
            gameStateManager.on('turnAdvanced', handleTurnAdvanced);
            gameStateManager.on('showCardAcknowledgment', handleShowCardAcknowledgment);
            gameStateManager.on('cardAcknowledged', handleCardAcknowledged);
            gameStateManager.on('showDiceResult', handleShowDiceResult);
        }

        if (gameUIStateRef.current.showSpaceExplorer) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (gameStateManager) {
                gameStateManager.off('spaceSelected', handleSpaceSelected);
                gameStateManager.off('turnAdvanced', handleTurnAdvanced);
                gameStateManager.off('showCardAcknowledgment', handleShowCardAcknowledgment);
                gameStateManager.off('cardAcknowledged', handleCardAcknowledged);
                gameStateManager.off('showDiceResult', handleShowDiceResult);
            }
            if (gameUIStateRef.current.showSpaceExplorer) {
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [forceRender, updateGameUIState, closeSpaceExplorer, gameStateManager]); // Added gameStateManager to dependencies
    
    // Roll dice function - STABILIZED
    const setDiceResult = React.useCallback((diceResult, moves) => {
        updateGameUIState({
            showingDiceResult: true,
            diceResult: diceResult,
            availableMoves: moves || [],
            showingMoves: (moves && moves.length > 0)
        });
    }, [updateGameUIState]);

    const rollDice = () => {
        if (!window.CSVDatabase?.loaded) {
            alert('Game data not loaded yet');
            return;
        }

        const diceResult = Math.floor(Math.random() * 6) + 1;
        const movementEngine = window.movementEngine || (window.MovementEngine?.getInstance && window.MovementEngine.getInstance());
        let moves = window.gameConfig.fallbackMoves || [];

        if (movementEngine && currentPlayer) {
            try {
                moves = movementEngine.getAvailableMoves(currentPlayer);
            } catch (error) {
                console.error('Error getting moves:', error);
            }
        }
        
        setDiceResult(diceResult, moves);
    };
    
    // Move player function - REFACTORED to use enhanced GameStateManager
    const movePlayer = (destination) => {
        if (!currentPlayer || !destination) {
            alert('Invalid move');
            return;
        }
        
        try {
            // Use enhanced GameStateManager for all game logic
            const allMessages = gameStateManager.movePlayerWithEffects(
                currentPlayer.id, 
                destination, 
                'First' // For now, always first visit
            );
            
            // Reset UI state (UI-only concern, stays in FixedApp)
            updateGameUIState({
                showingDiceResult: false,
                diceResult: null,
                availableMoves: [],
                showingMoves: false
            });
            
            // Show results using messages from GameStateManager
            const message = allMessages.length > 0 ? 
                allMessages.join('\n\n') : 
                `Moved to ${destination}!`;
            alert(message);
            
        } catch (error) {
            console.error('Error in movePlayer:', error);
            alert(`Failed to move to ${destination}: ${error.message}`);
        }
    };
    
    // Test if sophisticated components work with fixed useGameState hook
    const useSimplified = !window.PlayerStatusPanel || !window.ActionPanel || !window.ResultsPanel;
    
    if (useSimplified) {
        return React.createElement('div', { 
            style: { 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr 1fr',
                gap: '20px',
                height: '100vh',
                padding: '20px'
            }
        },
            // Left Panel - Player Status
            React.createElement('div', {
                style: { 
                    background: '#f5f5f5', 
                    border: '2px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '15px'
                }
            },
                React.createElement('h3', null, '👤 Player Status'),
                currentPlayer ? [
                    React.createElement('div', { key: 'name' }, React.createElement('strong', null, currentPlayer.name)),
                    React.createElement('div', { key: 'money' }, `💰 Money: $${currentPlayer.money?.toLocaleString() || 0}`),
                    React.createElement('div', { key: 'time' }, `⏰ Time: ${currentPlayer.timeSpent || 0} days`),
                    React.createElement('div', { key: 'position' }, `📍 Position: ${currentPlayer.position || 'Unknown'}`),
                    React.createElement('div', { key: 'turn' }, `🔄 Turn: ${gameState.turnCount + 1}`),
                    React.createElement('div', { key: 'cards-header', style: { marginTop: '15px', fontWeight: 'bold' } }, '🃏 Cards'),
                    ...Object.entries(currentPlayer.cards || {}).map(([cardType, cards]) => 
                        React.createElement('div', { 
                            key: `card-type-${cardType}`,
                            style: { fontSize: '14px', margin: '2px 0' }
                        }, `${cardType}: ${cards.length}`)
                    )
                ] : React.createElement('div', null, 'No player data')
            ),
            
            // Center Panel - Game Board
            React.createElement('div', {
                style: { 
                    background: '#fff', 
                    border: '3px solid #4285f4', 
                    borderRadius: '8px', 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            },
                React.createElement('h2', { style: { color: '#4285f4' } }, '🎯 Game Board'),
                React.createElement('div', { style: { padding: '20px', textAlign: 'center' } },
                    React.createElement('div', { 
                        style: { 
                            background: '#e3f2fd', 
                            border: '3px solid #2196f3',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px'
                        }
                    },
                        React.createElement('h3', { style: { margin: '0 0 10px 0', color: '#1976d2' } }, 
                            currentPlayer?.position || 'OWNER-SCOPE-INITIATION'
                        ),
                        React.createElement('p', { style: { margin: '0', color: '#666' } }, 
                            `${currentPlayer?.visitType || 'First'} Visit`
                        )
                    ),
                    // Dice result display
                    gameUIStateRef.current.showingDiceResult ? 
                        React.createElement('div', { 
                            style: { 
                                background: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '15px'
                            }
                        },
                            React.createElement('h4', { style: { margin: '0 0 10px 0' } }, 
                                `🎲 Rolled: ${gameUIStateRef.current.diceResult}`
                            ),
                            gameUIStateRef.current.showingMoves && gameUIStateRef.current.availableMoves.length > 0 ? [
                                React.createElement('p', { key: 'moves-text', style: { margin: '0 0 10px 0' } }, 
                                    'Available moves:'
                                ),
                                ...gameUIStateRef.current.availableMoves.map((move, index) => 
                                    React.createElement('button', {
                                        key: move.destination || index,
                                        className: 'btn btn-success',
                                        style: { margin: '5px', padding: '8px 15px' },
                                        onClick: () => movePlayer(move.destination || move)
                                    }, `➡️ ${move.destination || move}`)
                                )
                            ] : React.createElement('p', { style: { margin: 0 } }, 'No moves available')
                        ) : null,
                    
                    // Action buttons
                    React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
                        React.createElement('button', { 
                            className: 'btn btn-primary',
                            style: { padding: '10px 20px' },
                            onClick: rollDice,
                            disabled: gameUIStateRef.current.showingDiceResult
                        }, '🎲 Roll Dice'),
                        gameUIStateRef.current.showingDiceResult ? 
                            React.createElement('button', { 
                                className: 'btn btn-secondary',
                                style: { padding: '10px 20px' },
                                onClick: () => updateGameUIState({
                                    showingDiceResult: false,
                                    diceResult: null,
                                    availableMoves: [],
                                    showingMoves: false
                                })
                            }, '🔄 Reset') : null
                    )
                )
            ),
            
            // Right Panel - Actions
            React.createElement('div', {
                style: { 
                    background: '#fff4e6', 
                    border: '2px solid #ff9800', 
                    borderRadius: '8px', 
                    padding: '15px'
                }
            },
                React.createElement('h3', null, '🎮 Game Actions'),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                    React.createElement('button', { 
                        className: 'btn btn-primary',
                        style: { padding: '10px' }
                    }, '🎲 Roll Dice'),
                    React.createElement('button', { 
                        className: 'btn btn-secondary',
                        style: { padding: '10px' }
                    }, '🃏 Use Card'),
                    React.createElement('button', { 
                        className: 'btn btn-success',
                        style: { padding: '10px' }
                    }, '➡️ End Turn')
                )
            )
        );
    }
    
    // Use sophisticated panel components - they get state from GameStateManager
    return React.createElement('div', { 
        className: 'game-interface',
        style: { 
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            gridTemplateRows: '1fr auto',
            columnGap: '20px',
            rowGap: '20px',
            height: '100vh',
            padding: '20px',
            minWidth: '1400px'
        }
    },
        // Hidden GameManager component to handle game logic events
        // Pass state and manager down as props to eliminate race condition
        gameStateManager && window.GameManager ? React.createElement(window.GameManager, {
            key: 'game-manager',
            gameState: gameState,
            gameStateManager: gameStateManager
        }) : null,
        
        // Hidden GameSaveManager component for save/load functionality
        window.GameSaveManager ? React.createElement(window.GameSaveManager, { 
            key: 'save-manager',
            gameState: gameState,
            gameStateManager: window.GameStateManager
        }) : null,
        
        // Hidden WinConditionManager component for game completion detection
        window.WinConditionManager ? React.createElement(window.WinConditionManager, { 
            key: 'win-manager',
            gameState: gameState,
            gameStateManager: window.GameStateManager
        }) : null,
        
        // Card Acknowledgment Modal (Legacy)
        window.CardAcknowledgmentModal ? React.createElement(window.CardAcknowledgmentModal, {
            key: 'card-acknowledgment-modal',
            isVisible: gameUIStateRef.current.showCardAcknowledgment,
            card: gameUIStateRef.current.cardToAcknowledge,
            playerName: gameUIStateRef.current.playerName,
            onAcknowledge: () => {
                if (gameStateManager) {
                    gameStateManager.acknowledgeCard(true);
                }
            },
            gameStateManager: gameStateManager
        }) : null,

        // New Scalable Modal System
        (() => {
            const activeModal = gameUIStateRef.current.activeModal;
            const modalProps = gameUIStateRef.current.modalProps;
            
            switch (activeModal) {
                case 'DICE_RESULT':
                    return window.DiceResultModal ? React.createElement(window.DiceResultModal, {
                        key: 'dice-result-modal',
                        diceValue: modalProps.diceValue,
                        effects: modalProps.effects,
                        spaceName: modalProps.spaceName,
                        visitType: modalProps.visitType,
                        onContinue: () => {
                            // Close modal first
                            handleCloseModal();
                            // Then trigger effect processing
                            if (gameStateManager) {
                                gameStateManager.emit('applyDiceEffects', modalProps);
                            }
                        }
                    }) : null;
                
                case 'RULES':
                    // Future: move rules modal to this system
                    return null;
                    
                default:
                    return null;
            }
        })(),
        // Left Panel - Complete Player Container
        React.createElement('div', {
            key: 'left-panel',
            style: { gridColumn: '1', gridRow: '1' }
        }, 
            window.PlayerStatusPanel ? 
                React.createElement(window.PlayerStatusPanel, { key: 'player-status' }) :
                React.createElement('div', { key: 'player-loading', className: 'panel-placeholder' }, 'Player Status Loading...')
        ),
        
        // Right Panel - Game Board (now includes Future Log internally)
        React.createElement('div', {
            key: 'right-panel',
            style: { 
                gridColumn: '2',
                gridRow: '1'
            }
        }, 
            window.GameBoard ? 
                React.createElement(window.GameBoard, { key: 'game-board' }) :
                React.createElement('div', { key: 'board-loading', className: 'panel-placeholder' }, 'Game Board Loading...')
        ),
        
        // Turn Controls - Bottom row spanning full width
        React.createElement('div', {
            key: 'bottom-panel',
            style: { 
                gridColumn: '1 / -1',
                gridRow: '2',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                minHeight: '80px'
            }
        }, 
            window.TurnControls ? 
                React.createElement(window.TurnControls, {
                    key: 'turn-controls-bottom',
                    currentPlayer: currentPlayer,
                    gameStateManager: window.GameStateManager,
                    debugMode: debugMode
                }) :
                React.createElement('div', { key: 'controls-loading', className: 'panel-placeholder' }, 'Turn Controls Loading...')
        ),
            
        // Space Explorer Modal
        gameUIStateRef.current.showSpaceExplorer && gameUIStateRef.current.selectedSpaceData && window.SpaceExplorer ? 
            React.createElement('div', {
                key: 'space-explorer-modal',
                className: 'modal-backdrop',
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                },
                onClick: closeSpaceExplorer
            },
                React.createElement('div', {
                    className: 'modal-content',
                    style: {
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        position: 'relative',
                        margin: '20px'
                    },
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('button', {
                        style: {
                            position: 'absolute',
                            top: '10px',
                            right: '15px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666'
                        },
                        onClick: closeSpaceExplorer
                    }, '×'),
                    React.createElement(window.SpaceDetails, {
                        spaceName: gameUIStateRef.current.selectedSpaceData.spaceName,
                        spaceData: gameUIStateRef.current.selectedSpaceData.spaceData,
                        isValidMove: gameUIStateRef.current.selectedSpaceData.isValidMove,
                        player: gameUIStateRef.current.selectedSpaceData.player,
                        onExploreSpace: (spaceName) => {
                            // Handle exploring another space from modal
                            if (window.CSVDatabase?.loaded) {
                                const spaceData = window.CSVDatabase.spaceContent.find(spaceName, 'First');
                                if (spaceData) {
                                    updateGameUIState({
                                        selectedSpaceData: {
                                            spaceName,
                                            spaceData,
                                            isValidMove: false,
                                            player: currentPlayer
                                        }
                                    });
                                }
                            }
                        }
                    })
                )
            ) : null,
            
        // Game End Screen Modal - Show when game is completed
        gameState.gameStatus === 'completed' && window.GameEndScreen ? 
            React.createElement(window.GameEndScreen, {
                key: 'game-end-screen',
                gameState: gameState,
                gameStateManager: window.GameStateManager,
                show: true
            }) : null
    );
}, (prevProps, nextProps) => {
    // Custom comparison for GameInterface - only re-render if critical game state changes
    const prevState = prevProps.gameState;
    const nextState = nextProps.gameState;
    
    
    // Quick identity check for both gameState and gameStateManager
    if (prevState === nextState && prevProps.gameStateManager === nextProps.gameStateManager) return true;
    
    // If either is null/undefined, check if both are
    if (!prevState || !nextState) return prevState === nextState;
    
    // Compare critical state properties that affect UI
    // CRITICAL FIX: Also check for player object reference changes.
    return (
        prevState.currentPlayer === nextState.currentPlayer &&
        prevState.gamePhase === nextState.gamePhase &&
        prevState.turnCount === nextState.turnCount &&
        prevState.players === nextState.players && // Check if the players array itself is the same object
        prevState.gameStatus === nextState.gameStatus &&
        prevProps.gameStateManager === nextProps.gameStateManager
    );
});




// Export components
window.FixedApp = FixedApp;
window.GameInterface = GameInterface;