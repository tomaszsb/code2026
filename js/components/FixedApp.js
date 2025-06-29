/**
 * FixedApp - Working version using React useState instead of useGameState hook
 */

function FixedApp({ debugMode = false, logLevel = 'info' }) {
    const { useState, useEffect } = React;
    const { loaded, error } = useCSVData();
    
    // Use React's built-in state instead of useGameState hook
    const [gameState, setGameState] = useState({
        gamePhase: 'SETUP',
        currentPlayer: 0,
        turnCount: 0,
        players: [],
        gameSettings: {
            maxPlayers: 4,
            winCondition: 'FIRST_TO_FINISH',
            debugMode: false
        },
        ui: {
            activeModal: null,
            showingSpace: null,
            diceRolling: false,
            loading: false
        },
        error: null,
        lastAction: null
    });
    
    
    // Initialize game function
    const initializeGame = (players, settings = {}) => {
        
        const newGameState = {
            ...gameState,
            gamePhase: 'PLAYING',
            currentPlayer: 0, // Explicitly set current player to first player
            players: players.map((playerData, index) => ({
                id: playerData.id || index,
                name: typeof playerData === 'string' ? playerData : playerData.name,
                color: typeof playerData === 'string' ? '#007bff' : playerData.color,
                avatar: playerData.avatar || '👤',
                position: playerData.position || 'OWNER-SCOPE-INITIATION',
                visitType: playerData.visitType || 'First',
                money: playerData.money || 10000,
                timeSpent: playerData.timeSpent || 0,
                cards: {
                    W: [],
                    B: [],
                    I: [],
                    L: [],
                    E: []
                },
                phase: playerData.phase || 'INITIATION'
            })),
            gameSettings: { ...gameState.gameSettings, ...settings }
        };
        
        // Update GameStateManager directly and immediately
        if (window.GameStateManager) {
            window.GameStateManager.setState(newGameState);
            window.GameStateManager.emit('gameInitialized');
        }
        
        setGameState(newGameState);
    };
    
    // Initialize systems and sync state only when needed
    useEffect(() => {
        window.FixedGameInitializer = { initializeGame };
        
        // Initialize MovementEngine once
        if (window.GameStateManager && window.MovementEngine) {
            try {
                const movementEngine = window.movementEngine || (window.MovementEngine?.getInstance && window.MovementEngine.getInstance());
                if (movementEngine && !movementEngine.gameStateManager) {
                    movementEngine.initialize(window.GameStateManager);
                }
            } catch (error) {
                console.error('Error initializing MovementEngine:', error);
            }
        }
    }, []); // Run only once
    
    // Sync React state to GameStateManager only when game phase changes
    useEffect(() => {
        if (window.GameStateManager && gameState.gamePhase === 'PLAYING') {
            window.GameStateManager.setState(gameState);
            
            // Debug: Show current card counts
            gameState.players.forEach((player, index) => {
                const totalCards = Object.values(player.cards || {}).reduce((sum, cardArray) => sum + cardArray.length, 0);
            });
        }
    }, [gameState.gamePhase, gameState.players.length, gameState.players[0]?.cards]); // Also watch for card changes
    
    // Listen for GameStateManager changes and sync back to React state (DISABLED TO PREVENT LOOPS)
    // The sophisticated components use useGameState() hook which reads directly from GameStateManager
    // No need for bidirectional sync - just push React state TO GameStateManager
    useEffect(() => {
        // Only listen for critical events that require React re-render
        if (!window.GameStateManager) return;
        
        const handleCriticalStateChange = () => {
            // Only sync back for game phase changes or similar critical updates
            const newState = window.GameStateManager.getState();
            if (newState.gamePhase !== gameState.gamePhase) {
                setGameState(prevState => ({
                    ...prevState,
                    gamePhase: newState.gamePhase
                }));
            }
        };
        
        // Listen to critical game events that need React state updates
        const handleCardsDrawn = ({ playerId, cardType, cards }) => {
            // Cards are already added to GameStateManager by GameManager.drawCardsForPlayer()
            // This event is just for UI feedback - sync GameStateManager state to React
            setGameState(prevState => {
                // Get the current state from GameStateManager instead of adding cards again
                const currentGameState = window.GameStateManager?.getState();
                if (currentGameState && currentGameState.players) {
                    return { ...prevState, players: currentGameState.players };
                }
                return prevState;
            });
        };
        
        const unsubscribe1 = window.GameStateManager.on('gamePhaseChanged', handleCriticalStateChange);
        const unsubscribe2 = window.GameStateManager.on('cardsDrawnForPlayer', handleCardsDrawn);
        const unsubscribe3 = window.GameStateManager.on('cardsDrawn', handleCardsDrawn); // Alternative event name
        const unsubscribe4 = window.GameStateManager.on('playerCardsUpdated', handleCardsDrawn); // Another possible event name
        
        return () => {
            unsubscribe1?.();
            unsubscribe2?.();
            unsubscribe3?.();
            unsubscribe4?.();
        };
    }, []);
    
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
        return React.createElement(LoadingScreen);
    }
    
    const showPlayerSetup = gameState.gamePhase === 'SETUP' || gameState.players.length === 0;
    
    
    // Main application
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', { className: 'app' },
            showPlayerSetup 
                ? React.createElement(FixedPlayerSetup, { onInitializeGame: initializeGame })
                : React.createElement(GameInterface, { 
                    gameState: gameState,
                    updateGameState: setGameState
                })
        )
    );
}

// Game interface component - Using actual game components
function GameInterface({ gameState, updateGameState }) {
    const { useState } = React;
    const [gameUIState, setGameUIState] = useState({
        showingDiceResult: false,
        diceResult: null,
        availableMoves: [],
        showingMoves: false,
        showSpaceExplorer: false,
        selectedSpaceData: null
    });
    
    
    // Get current player
    const currentPlayer = gameState.players?.[gameState.currentPlayer];
    
    // Listen for space selection events to show modal
    React.useEffect(() => {
        const handleSpaceSelected = (data) => {
            setGameUIState(prev => ({
                ...prev,
                showSpaceExplorer: true,
                selectedSpaceData: data
            }));
        };
        
        if (window.GameStateManager) {
            window.GameStateManager.on('spaceSelected', handleSpaceSelected);
            return () => {
                window.GameStateManager.off('spaceSelected', handleSpaceSelected);
            };
        }
    }, []);
    
    // Close space explorer modal
    const closeSpaceExplorer = () => {
        setGameUIState(prev => ({
            ...prev,
            showSpaceExplorer: false,
            selectedSpaceData: null
        }));
    };
    
    // Listen for Escape key to close modal
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && gameUIState.showSpaceExplorer) {
                closeSpaceExplorer();
            }
        };
        
        if (gameUIState.showSpaceExplorer) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [gameUIState.showSpaceExplorer]);
    
    // Roll dice function
    const rollDice = () => {
        
        if (!window.CSVDatabase?.loaded) {
            alert('Game data not loaded yet');
            return;
        }
        
        const diceResult = Math.floor(Math.random() * 6) + 1;
        
        // Get available moves using MovementEngine instance
        const movementEngine = window.movementEngine || (window.MovementEngine?.getInstance && window.MovementEngine.getInstance());
        if (movementEngine && currentPlayer) {
            try {
                const moves = movementEngine.getAvailableMoves(currentPlayer);
                
                setGameUIState({
                    showingDiceResult: true,
                    diceResult: diceResult,
                    availableMoves: moves || [],
                    showingMoves: (moves && moves.length > 0)
                });
                
            } catch (error) {
                console.error('Error getting moves:', error);
                setGameUIState({
                    showingDiceResult: true,
                    diceResult: diceResult,
                    availableMoves: ['OWNER-FUND-INITIATION'], // Hardcoded fallback
                    showingMoves: true
                });
            }
        } else {
            setGameUIState({
                showingDiceResult: true,
                diceResult: diceResult,
                availableMoves: ['OWNER-FUND-INITIATION'], // Hardcoded fallback
                showingMoves: true
            });
        }
    };
    
    // Move player function
    const movePlayer = (destination) => {
        if (!currentPlayer || !destination) {
            alert('Invalid move');
            return;
        }
        
        
        // Apply space effects (draw cards, spend time/money)
        let updatedPlayer = { ...currentPlayer };
        let effectMessages = [];
        
        // Check for space effects
        if (window.CSVDatabase?.loaded && window.EffectsEngine) {
            try {
                const spaceEffects = window.CSVDatabase.spaceEffects.query({
                    space: destination,
                    visitType: 'First'
                });
                
                
                spaceEffects.forEach(effect => {
                    if (effect.effect_type === 'e_cards') {
                        const cardType = effect.card_type || 'W';
                        const amount = parseInt(effect.effect_value) || 1;
                        
                        // Draw cards
                        if (!updatedPlayer.cards[cardType]) {
                            updatedPlayer.cards[cardType] = [];
                        }
                        
                        for (let i = 0; i < amount; i++) {
                            updatedPlayer.cards[cardType].push({
                                id: Date.now() + i,
                                type: cardType,
                                drawnAt: destination
                            });
                        }
                        
                        effectMessages.push(`Drew ${amount} ${cardType} card(s)`);
                    }
                    
                    if (effect.effect_type === 'e_time') {
                        const timeSpent = parseInt(effect.effect_value) || 0;
                        updatedPlayer.timeSpent += timeSpent;
                        effectMessages.push(`Spent ${timeSpent} days`);
                    }
                    
                    if (effect.effect_type === 'e_money') {
                        const moneyChange = parseInt(effect.effect_value) || 0;
                        updatedPlayer.money += moneyChange;
                        effectMessages.push(moneyChange > 0 ? `Gained $${moneyChange}` : `Spent $${Math.abs(moneyChange)}`);
                    }
                });
            } catch (error) {
                console.error('Error applying space effects:', error);
            }
        }
        
        // Update player position
        updatedPlayer.position = destination;
        updatedPlayer.visitType = 'First'; // For now, always first visit
        
        const newPlayers = [...gameState.players];
        newPlayers[gameState.currentPlayer] = updatedPlayer;
        
        const newGameState = {
            ...gameState,
            players: newPlayers,
            turnCount: gameState.turnCount + 1
        };
        
        updateGameState(newGameState);
        
        // Reset UI state
        setGameUIState({
            showingDiceResult: false,
            diceResult: null,
            availableMoves: [],
            showingMoves: false
        });
        
        // Show results
        const message = `Moved to ${destination}!` + 
            (effectMessages.length > 0 ? '\n\n' + effectMessages.join('\n') : '');
        alert(message);
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
                gameState.players?.[0] ? [
                    React.createElement('div', { key: 'name' }, React.createElement('strong', null, gameState.players[0].name)),
                    React.createElement('div', { key: 'money' }, `💰 Money: $${gameState.players[0].money?.toLocaleString() || 0}`),
                    React.createElement('div', { key: 'time' }, `⏰ Time: ${gameState.players[0].timeSpent || 0} days`),
                    React.createElement('div', { key: 'position' }, `📍 Position: ${gameState.players[0].position || 'Unknown'}`),
                    React.createElement('div', { key: 'turn' }, `🔄 Turn: ${gameState.turnCount + 1}`),
                    React.createElement('div', { key: 'cards-header', style: { marginTop: '15px', fontWeight: 'bold' } }, '🃏 Cards'),
                    ...Object.entries(gameState.players[0].cards || {}).map(([cardType, cards]) => 
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
                            gameState.players?.[0]?.position || 'OWNER-SCOPE-INITIATION'
                        ),
                        React.createElement('p', { style: { margin: '0', color: '#666' } }, 
                            `${gameState.players?.[0]?.visitType || 'First'} Visit`
                        )
                    ),
                    // Dice result display
                    gameUIState.showingDiceResult ? 
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
                                `🎲 Rolled: ${gameUIState.diceResult}`
                            ),
                            gameUIState.showingMoves && gameUIState.availableMoves.length > 0 ? [
                                React.createElement('p', { key: 'moves-text', style: { margin: '0 0 10px 0' } }, 
                                    'Available moves:'
                                ),
                                ...gameUIState.availableMoves.map((move, index) => 
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
                            disabled: gameUIState.showingDiceResult
                        }, '🎲 Roll Dice'),
                        gameUIState.showingDiceResult ? 
                            React.createElement('button', { 
                                className: 'btn btn-secondary',
                                style: { padding: '10px 20px' },
                                onClick: () => setGameUIState({
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
            gameStateManager: window.GameStateManager,
            onGameStateUpdate: updateGameState
        }) : null,
        
        // Hidden WinConditionManager component for game completion detection
        window.WinConditionManager ? React.createElement(window.WinConditionManager, { 
            key: 'win-manager',
            gameState: gameState,
            gameStateManager: window.GameStateManager,
            onGameStateUpdate: updateGameState
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
        gameUIState.showSpaceExplorer && gameUIState.selectedSpaceData && window.SpaceExplorer ? 
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
                        spaceName: gameUIState.selectedSpaceData.spaceName,
                        spaceData: gameUIState.selectedSpaceData.spaceData,
                        isValidMove: gameUIState.selectedSpaceData.isValidMove,
                        player: gameUIState.selectedSpaceData.player,
                        onExploreSpace: (spaceName) => {
                            // Handle exploring another space from modal
                            if (window.CSVDatabase?.loaded) {
                                const spaceData = window.CSVDatabase.spaceContent.find(spaceName, 'First');
                                if (spaceData) {
                                    setGameUIState(prev => ({
                                        ...prev,
                                        selectedSpaceData: {
                                            spaceName,
                                            spaceData,
                                            isValidMove: false,
                                            player: currentPlayer
                                        }
                                    }));
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
                onGameStateUpdate: updateGameState,
                show: true
            }) : null
    );
}

// Simple player setup component that works with the fixed app
function FixedPlayerSetup({ onInitializeGame }) {
    const { useState } = React;
    const [players, setPlayers] = useState([
        { 
            id: 1, 
            name: 'Player 1', 
            color: '#007bff',
            avatar: '👤'
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
}

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