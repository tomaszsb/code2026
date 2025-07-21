/**
 * EnhancedPlayerSetup - Modern game setup interface with graphics and color selection
 * Beautiful setup experience with player customization
 */

function EnhancedPlayerSetup() {
    const { useState, useEffect } = React;
    const [players, setPlayers] = useState([
        { 
            id: 1, 
            name: 'Player 1', 
            color: '#007bff',
            avatar: '👤'
        }
    ]);
    const [gameSettings, setGameSettings] = useState({
        maxPlayers: 4,
        winCondition: 'FIRST_TO_FINISH',
        difficulty: 'normal'
    });
    const [gameState, gameStateManager] = useGameState();
    const [isStarting, setIsStarting] = useState(false);
    
    // Available colors for players
    const availableColors = [
        { color: '#007bff', name: 'Blue' },
        { color: '#28a745', name: 'Green' },
        { color: '#dc3545', name: 'Red' },
        { color: '#fd7e14', name: 'Orange' },
        { color: '#6f42c1', name: 'Purple' },
        { color: '#e83e8c', name: 'Pink' },
        { color: '#20c997', name: 'Teal' },
        { color: '#ffc107', name: 'Yellow' }
    ];

    // Available avatars
    const availableAvatars = ['👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🏫', '👩‍🏫'];
    
    // Add player
    const addPlayer = () => {
        if (players.length < gameSettings.maxPlayers) {
            const usedColors = players.map(p => p.color);
            const availableColor = availableColors.find(c => !usedColors.includes(c.color));
            
            setPlayers([...players, {
                id: Date.now(),
                name: `Player ${players.length + 1}`,
                color: availableColor ? availableColor.color : availableColors[0].color,
                avatar: availableAvatars[players.length % availableAvatars.length]
            }]);
        }
    };
    
    // Remove player
    const removePlayer = (playerId) => {
        if (players.length > 1) {
            setPlayers(players.filter(p => p.id !== playerId));
        }
    };
    
    // Update player property
    const updatePlayer = (playerId, property, value) => {
        setPlayers(players.map(player => 
            player.id === playerId 
                ? { ...player, [property]: value }
                : player
        ));
    };
    
    // Start game with enhanced loading
    const startGame = async () => {
        const validPlayers = players.filter(p => p.name.trim());
        if (validPlayers.length === 0) {
            if (window.AccessibilityUtils) {
                window.AccessibilityUtils.announceToScreenReader('Please add at least one player', 'assertive');
            }
            alert('Please add at least one player');
            return;
        }
        
        setIsStarting(true);
        
        // Emit loading event
        gameStateManager.emit('loadingStart', {
            message: 'Initializing game...',
            type: 'general'
        });
        
        try {
            // Simulate setup time for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update progress
            gameStateManager.emit('loadingProgress', {
                progress: 50,
                message: 'Setting up players...'
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Prepare players with full data
            const playersWithData = validPlayers.map((player, index) => ({
                id: player.id,
                name: player.name.trim(),
                color: player.color,
                avatar: player.avatar,
                position: 'OWNER-SCOPE-INITIATION',
                visitType: 'First',
                money: 0, // Starting money
                timeSpent: 0,
                cards: [],
                visitedSpaces: []
            }));
            
            gameStateManager.emit('loadingProgress', {
                progress: 100,
                message: 'Starting game...'
            });
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            if (gameStateManager && gameStateManager.initializeGame) {
                gameStateManager.initializeGame(playersWithData, gameSettings);
                gameStateManager.emit('gameStarted', { players: playersWithData });
            } else {
                throw new Error('GameStateManager not available');
            }
            
            gameStateManager.emit('loadingComplete');
            
        } catch (error) {
            gameStateManager.emit('error', {
                message: 'Failed to start game: ' + error.message,
                type: 'general',
                canRetry: true,
                retryAction: () => startGame()
            });
        } finally {
            setIsStarting(false);
        }
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
                maxWidth: '800px',
                width: '100%',
                animation: 'fadeIn 0.8s ease-out'
            }
        },
            // Header with game logo/title
            React.createElement('div', {
                className: 'setup-header',
                style: {
                    textAlign: 'center',
                    marginBottom: '3rem'
                }
            },
                React.createElement('div', {
                    className: 'game-logo',
                    style: {
                        fontSize: '4rem',
                        marginBottom: '1rem'
                    }
                }, '🏗️'),
                
                React.createElement('h1', {
                    style: {
                        color: '#2c5530',
                        fontSize: '2.5rem',
                        marginBottom: '0.5rem',
                        fontWeight: 'bold'
                    }
                }, 'Project Management'),
                
                React.createElement('h2', {
                    style: {
                        color: '#6c757d',
                        fontSize: '1.5rem',
                        fontWeight: 'normal',
                        margin: 0
                    }
                }, 'Board Game'),
                
                React.createElement('p', {
                    style: {
                        color: '#6c757d',
                        fontSize: '1.1rem',
                        margin: '1rem 0 0 0'
                    }
                }, 'Navigate from project initiation to completion!')
            ),
            
            // Players section
            React.createElement('div', {
                className: 'players-section',
                style: { marginBottom: '2rem' }
            },
                React.createElement('h3', {
                    style: {
                        color: '#2c5530',
                        fontSize: '1.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }
                }, '👥 Players'),
                
                // Player list
                React.createElement('div', {
                    className: 'players-list',
                    style: {
                        display: 'grid',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }
                },
                    players.map(player =>
                        React.createElement('div', {
                            key: player.id,
                            className: 'player-card',
                            style: {
                                background: '#f8f9fa',
                                border: `3px solid ${player.color}`,
                                borderRadius: '12px',
                                padding: '1.5rem',
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr auto',
                                gap: '1rem',
                                alignItems: 'center',
                                transition: 'all 0.3s ease',
                                animation: 'slideInFromLeft 0.5s ease-out'
                            }
                        },
                            // Avatar selection
                            React.createElement('div', {
                                className: 'avatar-section',
                                style: { textAlign: 'center' }
                            },
                                React.createElement('div', {
                                    className: 'avatar-display',
                                    style: {
                                        fontSize: '2.5rem',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    },
                                    onClick: () => {
                                        const currentIndex = availableAvatars.indexOf(player.avatar);
                                        const nextIndex = (currentIndex + 1) % availableAvatars.length;
                                        updatePlayer(player.id, 'avatar', availableAvatars[nextIndex]);
                                    },
                                    title: 'Click to change avatar'
                                }, player.avatar),
                                
                                React.createElement('div', {
                                    style: {
                                        fontSize: '0.75rem',
                                        color: '#6c757d'
                                    }
                                }, 'Click to change')
                            ),
                            
                            // Name and color inputs
                            React.createElement('div', {
                                className: 'player-inputs',
                                style: { display: 'flex', flexDirection: 'column', gap: '1rem' }
                            },
                                // Name input
                                React.createElement('input', {
                                    type: 'text',
                                    placeholder: 'Enter player name',
                                    value: player.name,
                                    onChange: (e) => updatePlayer(player.id, 'name', e.target.value),
                                    maxLength: 20,
                                    style: {
                                        padding: '0.75rem',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        transition: 'border-color 0.3s ease'
                                    },
                                    onFocus: (e) => {
                                        e.target.style.borderColor = player.color;
                                    },
                                    onBlur: (e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                    }
                                }),
                                
                                // Color picker
                                React.createElement('div', {
                                    className: 'color-picker',
                                    style: {
                                        display: 'flex',
                                        gap: '0.5rem',
                                        flexWrap: 'wrap'
                                    }
                                },
                                    availableColors.map(colorOption =>
                                        React.createElement('button', {
                                            key: colorOption.color,
                                            className: 'color-option',
                                            onClick: () => updatePlayer(player.id, 'color', colorOption.color),
                                            style: {
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                backgroundColor: colorOption.color,
                                                border: player.color === colorOption.color ? 
                                                    '3px solid #2c5530' : '2px solid #e9ecef',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                transform: player.color === colorOption.color ? 'scale(1.2)' : 'scale(1)'
                                            },
                                            title: colorOption.name,
                                            'aria-label': `Select ${colorOption.name} color`
                                        })
                                    )
                                )
                            ),
                            
                            // Remove button
                            players.length > 1 && React.createElement('button', {
                                onClick: () => removePlayer(player.id),
                                className: 'remove-player-btn',
                                style: {
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease'
                                },
                                onMouseOver: (e) => {
                                    e.target.style.transform = 'scale(1.1)';
                                },
                                onMouseOut: (e) => {
                                    e.target.style.transform = 'scale(1)';
                                },
                                title: 'Remove player'
                            }, '×')
                        )
                    )
                ),
                
                // Add player button
                players.length < gameSettings.maxPlayers && React.createElement('button', {
                    onClick: addPlayer,
                    className: 'add-player-btn',
                    style: {
                        background: 'linear-gradient(45deg, #28a745, #20c997)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                    },
                    onMouseOver: (e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
                    },
                    onMouseOut: (e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                    }
                }, '+ Add Player')
            ),
            
            // Game settings section
            React.createElement('div', {
                className: 'settings-section',
                style: {
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }
            },
                React.createElement('h3', {
                    style: {
                        color: '#2c5530',
                        fontSize: '1.2rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }
                }, '⚙️ Game Settings'),
                
                React.createElement('div', {
                    className: 'settings-grid',
                    style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }
                },
                    React.createElement('div', {},
                        React.createElement('label', {
                            style: { 
                                display: 'block', 
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                color: '#495057'
                            }
                        }, 'Max Players'),
                        React.createElement('select', {
                            value: gameSettings.maxPlayers,
                            onChange: (e) => setGameSettings({
                                ...gameSettings,
                                maxPlayers: parseInt(e.target.value)
                            }),
                            style: {
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e9ecef',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }
                        },
                            [2, 3, 4].map(num =>
                                React.createElement('option', {
                                    key: num,
                                    value: num
                                }, `${num} Players`)
                            )
                        )
                    ),
                    
                    React.createElement('div', {},
                        React.createElement('label', {
                            style: { 
                                display: 'block', 
                                marginBottom: '0.5rem',
                                fontWeight: 'bold',
                                color: '#495057'
                            }
                        }, 'Win Condition'),
                        React.createElement('select', {
                            value: gameSettings.winCondition,
                            onChange: (e) => setGameSettings({
                                ...gameSettings,
                                winCondition: e.target.value
                            }),
                            style: {
                                width: '100%',
                                padding: '0.75rem',
                                border: '2px solid #e9ecef',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }
                        },
                            React.createElement('option', {
                                value: 'FIRST_TO_FINISH'
                            }, 'First to Finish'),
                            React.createElement('option', {
                                value: 'HIGHEST_SCORE'
                            }, 'Highest Score')
                        )
                    )
                )
            ),
            
            // Start game button
            React.createElement('button', {
                onClick: startGame,
                disabled: isStarting,
                className: 'start-game-btn',
                style: {
                    background: isStarting ? '#6c757d' : 'linear-gradient(45deg, #2c5530, #4CAF50)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1.5rem 3rem',
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    cursor: isStarting ? 'not-allowed' : 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(44, 85, 48, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                },
                onMouseOver: (e) => {
                    if (!isStarting) {
                        e.target.style.transform = 'translateY(-3px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(44, 85, 48, 0.5)';
                    }
                },
                onMouseOut: (e) => {
                    if (!isStarting) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 6px 20px rgba(44, 85, 48, 0.4)';
                    }
                }
            },
                isStarting ? '🎲 Starting Game...' : '🚀 Start Game'
            )
        )
    );
}