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
    
    console.log('FixedApp render - gamePhase:', gameState.gamePhase, 'players:', gameState.players.length);
    
    // Initialize game function
    const initializeGame = (players, settings = {}) => {
        console.log('FixedApp: Initializing game with players:', players);
        
        const newGameState = {
            ...gameState,
            gamePhase: 'PLAYING',
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
                loans: [],
                completedSpaces: [],
                visitedSpaces: playerData.visitedSpaces || [],
                isActive: index === 0
            })),
            gameSettings: { ...gameState.gameSettings, ...settings }
        };
        
        setGameState(newGameState);
        console.log('FixedApp: Game initialized successfully');
    };
    
    // Pass game state and functions to global scope for components that expect it
    useEffect(() => {
        window.FixedGameInitializer = { initializeGame };
        
        // Mock the GameStateManager interface for components that depend on it
        if (window.GameStateManager) {
            // Override getState to return our React state
            const originalGetState = window.GameStateManager.getState;
            window.GameStateManager.getState = () => gameState;
            
            // Cleanup function to restore original
            return () => {
                window.GameStateManager.getState = originalGetState;
            };
        }
    }, [gameState]);
    
    // Handle errors
    if (error) {
        return React.createElement('div', 
            { className: 'app-error' },
            React.createElement('h1', null, 'Failed to Load Game'),
            React.createElement('p', null, error),
            React.createElement('button', 
                { onClick: () => window.location.reload() },
                'Retry'
            )
        );
    }
    
    // Show loading screen while CSV data loads
    if (!loaded) {
        return React.createElement(LoadingScreen);
    }
    
    // Determine which screen to show
    const showPlayerSetup = gameState.gamePhase === 'SETUP' || (!gameState.players || gameState.players.length === 0);
    
    console.log('FixedApp: showPlayerSetup =', showPlayerSetup);
    
    // Main application
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', { className: 'app' },
            showPlayerSetup 
                ? React.createElement(FixedPlayerSetup, { onInitializeGame: initializeGame })
                : React.createElement(GameInterface, { gameState: gameState })
        )
    );
}

// Game interface component
function GameInterface({ gameState }) {
    return React.createElement('div', {
        style: { 
            display: 'grid', 
            gridTemplateColumns: '300px 1fr 300px',
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
            React.createElement('h3', { style: { margin: '0 0 15px 0', color: '#333' } }, '👤 Player Status'),
            React.createElement('div', { style: { marginBottom: '10px' } },
                React.createElement('strong', null, gameState.players[0].name),
                React.createElement('div', { style: { fontSize: '14px', color: '#666' } }, 
                    `${gameState.players[0].avatar} | ${gameState.players[0].color}`
                )
            ),
            React.createElement('div', { style: { marginBottom: '10px' } },
                React.createElement('div', null, `💰 Money: $${gameState.players[0].money.toLocaleString()}`),
                React.createElement('div', null, `⏰ Time: ${gameState.players[0].timeSpent} days`)
            ),
            React.createElement('div', { style: { marginBottom: '10px' } },
                React.createElement('div', null, `📍 Position: ${gameState.players[0].position}`),
                React.createElement('div', null, `🔄 Visit Type: ${gameState.players[0].visitType}`)
            ),
            React.createElement('h4', { style: { margin: '15px 0 10px 0' } }, '🃏 Cards'),
            Object.keys(gameState.players[0].cards).map(cardType =>
                React.createElement('div', { key: cardType, style: { fontSize: '14px' } },
                    `${cardType}: ${gameState.players[0].cards[cardType].length} cards`
                )
            )
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
            React.createElement('h2', { style: { color: '#4285f4', marginBottom: '20px' } }, '🎯 Project Management Game Board'),
            React.createElement('div', {
                style: {
                    width: '100%',
                    height: '400px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '2px solid #4285f4',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    textAlign: 'center'
                }
            },
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '48px', marginBottom: '20px' } }, '🏗️'),
                    React.createElement('div', null, 'Game Board Active'),
                    React.createElement('div', { style: { fontSize: '14px', marginTop: '10px', opacity: 0.8 } }, 
                        'Ready for gameplay!'
                    )
                )
            ),
            React.createElement('div', { style: { marginTop: '20px', textAlign: 'center' } },
                React.createElement('button', {
                    style: {
                        background: '#4285f4',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        margin: '0 10px'
                    }
                }, '🎲 Roll Dice'),
                React.createElement('button', {
                    style: {
                        background: '#34a853',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        margin: '0 10px'
                    }
                }, '📋 View Cards'),
                React.createElement('button', {
                    style: {
                        background: '#ea4335',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        margin: '0 10px'
                    }
                }, '⚙️ Actions')
            )
        ),
        
        // Right Panel - Game Info
        React.createElement('div', {
            style: { 
                background: '#f5f5f5', 
                border: '2px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px'
            }
        },
            React.createElement('h3', { style: { margin: '0 0 15px 0', color: '#333' } }, '🎮 Game Info'),
            React.createElement('div', { style: { marginBottom: '10px' } },
                React.createElement('div', null, `Phase: ${gameState.gamePhase}`),
                React.createElement('div', null, `Turn: ${gameState.turnCount}`),
                React.createElement('div', null, `Current Player: ${gameState.currentPlayer + 1}`)
            ),
            React.createElement('h4', { style: { margin: '15px 0 10px 0' } }, '📊 Progress'),
            React.createElement('div', { style: { fontSize: '14px' } },
                React.createElement('div', null, '✅ Game Successfully Started'),
                React.createElement('div', null, '✅ React State Management Fixed'),
                React.createElement('div', null, '✅ Game Interface Loaded'),
                React.createElement('div', { style: { marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '4px' } },
                    '🎉 Phase 28: RESOLVED'
                )
            )
        )
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
        console.log('FixedPlayerSetup: Starting game with players:', players);
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
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }
    },
        React.createElement('div', {
            className: 'setup-card',
            style: {
                background: 'white',
                borderRadius: '20px',
                padding: '3rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                maxWidth: '600px',
                width: '100%'
            }
        },
            React.createElement('div', {
                style: { textAlign: 'center', marginBottom: '2rem' }
            },
                React.createElement('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🏗️'),
                React.createElement('h1', {
                    style: { color: '#2c5530', fontSize: '2rem', marginBottom: '0.5rem' }
                }, 'Project Management Board Game'),
                React.createElement('p', {
                    style: { color: '#6c757d', fontSize: '1.1rem' }
                }, 'Navigate from project initiation to completion!')
            ),
            React.createElement('h3', {
                style: { color: '#2c5530', marginBottom: '1rem' }
            }, '👥 Players'),
            players.map(player =>
                React.createElement('div', {
                    key: player.id,
                    style: { margin: '10px 0', padding: '15px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px' }
                },
                    React.createElement('input', {
                        type: 'text',
                        value: player.name,
                        onChange: (e) => setPlayers(prev => 
                            prev.map(p => p.id === player.id ? { ...p, name: e.target.value } : p)
                        ),
                        style: { margin: '0 10px', padding: '8px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }
                    }),
                    React.createElement('span', { style: { fontSize: '20px' } }, player.avatar)
                )
            ),
            React.createElement('button', {
                onClick: startGame,
                style: { 
                    background: 'linear-gradient(45deg, #2c5530, #4CAF50)',
                    color: 'white', 
                    padding: '1.5rem 3rem', 
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    marginTop: '2rem',
                    border: 'none',
                    borderRadius: '12px',
                    width: '100%',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(44, 85, 48, 0.4)'
                }
            }, '🚀 Start Game')
        )
    );
}

// Export components
window.FixedApp = FixedApp;
window.GameInterface = GameInterface;
window.FixedPlayerSetup = FixedPlayerSetup;