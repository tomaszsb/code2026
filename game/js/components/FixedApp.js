/**
 * FixedApp - Fixed version using useGameState hook for automatic state synchronization
 */

function FixedApp({ debugMode = false, logLevel = 'info' }) {
    const { useState, useEffect } = React;
    const { loaded, error } = useCSVData();
    
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
    
    // Debug current game state
    console.log('🎮 FixedApp render - Current gameState:', {
        gamePhase: gameState.gamePhase,
        playersLength: gameState.players?.length || 0,
        showPlayerSetup: showPlayerSetup,
        gameStateManager: gameStateManager ? 'AVAILABLE' : 'NULL'
    });
    
    
    // Main application
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', { className: 'app' },
            showPlayerSetup 
                ? React.createElement(FixedPlayerSetup, { onInitializeGame: initializeGame })
                : React.createElement(GameInterface, { 
                    gameState: gameState,
                    gameStateManager: gameStateManager
                })
        )
    );
}

// Game interface component - Using actual game components
const GameInterface = React.memo(({ gameState, gameStateManager }) => {
    const { useState, useEffect, useRef } = React;
    
    // STABILIZED UI STATE - Use useRef for non-reactive state to prevent re-renders
    const gameUIStateRef = useRef({
        showingDiceResult: false,
        diceResult: null,
        availableMoves: [],
        showingMoves: false,
        showSpaceExplorer: false,
        selectedSpaceData: null
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

        if (gameStateManager) {
            gameStateManager.on('spaceSelected', handleSpaceSelected);
        }

        if (gameUIStateRef.current.showSpaceExplorer) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (gameStateManager) {
                gameStateManager.off('spaceSelected', handleSpaceSelected);
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
        window.GameManager ? React.createElement(window.GameManager, { key: 'game-manager' }) : null,
        
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
    return (
        prevState.currentPlayer === nextState.currentPlayer &&
        prevState.gamePhase === nextState.gamePhase &&
        prevState.turnCount === nextState.turnCount &&
        prevState.players?.length === nextState.players?.length &&
        prevState.gameStatus === nextState.gameStatus &&
        prevProps.gameStateManager === nextProps.gameStateManager
    );
});

// Simple player setup component that works with the fixed app
const FixedPlayerSetup = React.memo(({ onInitializeGame }) => {
    const { useState } = React;
    const [players, setPlayers] = useState([
        {
            id: 1,
            name: 'Player 1',
            color: '#007bff',
            avatar: '👤',
            money: 0
        }
    ]);
    
    const startGame = () => {
        const validPlayers = players.filter(p => p.name.trim());
        if (validPlayers.length === 0) {
            alert('Please add at least one player');
            return;
        }
        
        onInitializeGame(validPlayers);
    };
    
    return React.createElement('div', {
        className: 'enhanced-player-setup',
        style: { 
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            background: '#f8f9fa',
            borderRadius: '8px'
        }
    },
        React.createElement('h2', { style: { textAlign: 'center', marginBottom: '30px' } }, 
            '🎯 Project Management Game Setup'
        ),
        React.createElement('div', { className: 'players-section' },
            React.createElement('h3', null, 'Players'),
            ...players.map((player, index) =>
                React.createElement('div', { 
                    key: player.id,
                    style: { 
                        display: 'flex', 
                        gap: '10px', 
                        marginBottom: '15px',
                        padding: '15px',
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                    }
                },
                    React.createElement('input', {
                        type: 'text',
                        placeholder: `Player ${index + 1} Name`,
                        value: player.name,
                        onChange: (e) => {
                            const newPlayers = [...players];
                            newPlayers[index].name = e.target.value;
                            setPlayers(newPlayers);
                        },
                        style: { 
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }
                    }),
                    React.createElement('input', {
                        type: 'color',
                        value: player.color,
                        onChange: (e) => {
                            const newPlayers = [...players];
                            newPlayers[index].color = e.target.value;
                            setPlayers(newPlayers);
                        },
                        style: { width: '50px' }
                    })
                )
            ),
            React.createElement('div', { style: { textAlign: 'center', marginTop: '30px' } },
                React.createElement('button', {
                    onClick: startGame,
                    className: 'btn btn-primary',
                    style: { 
                        padding: '12px 24px',
                        fontSize: '16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }
                }, '🚀 Start Game')
            )
        )
    );
});

// Error boundary component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error info:', errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', 
                { style: { padding: '20px', background: '#ffe6e6', border: '1px solid #ff9999', borderRadius: '8px', margin: '20px' } },
                React.createElement('h2', { style: { color: '#cc0000' } }, 'React Error Caught'),
                React.createElement('p', null, 'Error: ' + (this.state.error?.message || 'Unknown error')),
                React.createElement('pre', { style: { fontSize: '12px', background: '#f5f5f5', padding: '10px' } }, 
                    this.state.error?.stack || 'No stack trace'
                ),
                React.createElement('button', { 
                    onClick: () => {
                        this.setState({ hasError: false, error: null, errorInfo: null });
                    },
                    style: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }
                }, 'Try Again')
            );
        }

        return this.props.children;
    }
}

// CSV data loading hook
function useCSVData() {
    const { useState, useEffect } = React;
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (window.CSVDatabase && window.CSVDatabase.loaded) {
            setLoaded(true);
        } else {
            const checkLoading = setInterval(() => {
                if (window.CSVDatabase && window.CSVDatabase.loaded) {
                    setLoaded(true);
                    clearInterval(checkLoading);
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!loaded) {
                    setError('Failed to load game data');
                    clearInterval(checkLoading);
                }
            }, 10000);
            
            return () => clearInterval(checkLoading);
        }
    }, []);
    
    return { loaded, error };
}

// Export components
window.FixedApp = FixedApp;
window.FixedPlayerSetup = FixedPlayerSetup;
window.GameInterface = GameInterface;