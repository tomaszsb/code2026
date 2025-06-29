/**
 * GameEndScreen Component - Display final results and scores
 * Shows when game is completed with winner and score breakdown
 * Updated for React state compatibility (Phase 2 reconnection)
 */

function GameEndScreen({ gameState, gameStateManager, onGameStateUpdate, show = false }) {
    // Use props instead of problematic useGameState hook
    const [showResults, setShowResults] = useState(show);

    // Sync with show prop
    React.useEffect(() => {
        setShowResults(show);
    }, [show]);

    // Show results when game is completed
    useEventListener('gameCompleted', ({ winner, finalScores }) => {
        setShowResults(true);
    });

    // Handle game restart
    const restartGame = () => {
        if (confirm('Start a new game? This will reset all progress.')) {
            const resetGameState = {
                gamePhase: 'SETUP',
                players: [],
                currentPlayer: 0,
                turnCount: 0,
                winner: null,
                finalScores: null,
                gameSettings: gameState.gameSettings || { maxPlayers: 4, winCondition: 'FIRST_TO_FINISH' }
            };
            
            if (onGameStateUpdate) {
                onGameStateUpdate(resetGameState);
            }
            
            if (gameStateManager) {
                gameStateManager.setState(resetGameState);
                gameStateManager.emit('gameRestarted');
            }
            
            setShowResults(false);
        }
    };

    // Format time display
    const formatTime = (days) => {
        if (days === 0) return '0 days';
        if (days === 1) return '1 day';
        return `${days} days`;
    };

    // Format money display
    const formatMoney = (amount) => {
        return `$${amount.toLocaleString()}`;
    };

    if (!showResults || !gameState.finalScores) {
        return null;
    }

    const winner = gameState.finalScores[0]; // First place
    const allPlayers = gameState.finalScores;

    return React.createElement('div', { 
        className: 'game-end-overlay',
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }
    },
        React.createElement('div', { 
            className: 'game-end-screen',
            style: {
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }
        },
            // Winner announcement
            React.createElement('div', { 
                className: 'winner-announcement',
                style: { 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }
            },
                React.createElement('h1', { 
                    style: { 
                        color: '#2c5530', 
                        margin: 0, 
                        fontSize: '2rem' 
                    } 
                }, '🏆 Game Complete!'),
                React.createElement('h2', { 
                    style: { 
                        color: '#2c5530', 
                        margin: '0.5rem 0',
                        fontSize: '1.5rem' 
                    } 
                }, `Winner: ${winner.playerName}`),
                React.createElement('p', { 
                    style: { 
                        fontSize: '1.1rem', 
                        margin: 0,
                        color: '#666' 
                    } 
                }, `Final Score: ${formatMoney(winner.finalScore)}`)
            ),

            // Score breakdown table
            React.createElement('div', { className: 'score-breakdown' },
                React.createElement('h3', { 
                    style: { marginBottom: '1rem' } 
                }, 'Final Standings'),
                
                React.createElement('table', { 
                    style: { 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginBottom: '2rem'
                    } 
                },
                    React.createElement('thead', {},
                        React.createElement('tr', { 
                            style: { backgroundColor: '#f8f9fa' } 
                        },
                            React.createElement('th', { 
                                style: { 
                                    padding: '0.75rem', 
                                    textAlign: 'left',
                                    borderBottom: '2px solid #dee2e6'
                                } 
                            }, 'Rank'),
                            React.createElement('th', { 
                                style: { 
                                    padding: '0.75rem', 
                                    textAlign: 'left',
                                    borderBottom: '2px solid #dee2e6'
                                } 
                            }, 'Player'),
                            React.createElement('th', { 
                                style: { 
                                    padding: '0.75rem', 
                                    textAlign: 'center',
                                    borderBottom: '2px solid #dee2e6'
                                } 
                            }, 'Time'),
                            React.createElement('th', { 
                                style: { 
                                    padding: '0.75rem', 
                                    textAlign: 'center',
                                    borderBottom: '2px solid #dee2e6'
                                } 
                            }, 'Money'),
                            React.createElement('th', { 
                                style: { 
                                    padding: '0.75rem', 
                                    textAlign: 'center',
                                    borderBottom: '2px solid #dee2e6'
                                } 
                            }, 'Final Score')
                        )
                    ),
                    React.createElement('tbody', {},
                        allPlayers.map((player, index) =>
                            React.createElement('tr', { 
                                key: player.playerId,
                                style: {
                                    backgroundColor: index === 0 ? '#e8f5e8' : 'transparent'
                                }
                            },
                                React.createElement('td', { 
                                    style: { 
                                        padding: '0.75rem',
                                        borderBottom: '1px solid #dee2e6',
                                        fontWeight: index === 0 ? 'bold' : 'normal'
                                    } 
                                }, `#${index + 1}`),
                                React.createElement('td', { 
                                    style: { 
                                        padding: '0.75rem',
                                        borderBottom: '1px solid #dee2e6',
                                        fontWeight: index === 0 ? 'bold' : 'normal'
                                    } 
                                }, player.playerName),
                                React.createElement('td', { 
                                    style: { 
                                        padding: '0.75rem', 
                                        textAlign: 'center',
                                        borderBottom: '1px solid #dee2e6'
                                    } 
                                }, formatTime(player.timeSpent)),
                                React.createElement('td', { 
                                    style: { 
                                        padding: '0.75rem', 
                                        textAlign: 'center',
                                        borderBottom: '1px solid #dee2e6'
                                    } 
                                }, formatMoney(player.moneyRemaining)),
                                React.createElement('td', { 
                                    style: { 
                                        padding: '0.75rem', 
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: index === 0 ? '#2c5530' : 'inherit',
                                        borderBottom: '1px solid #dee2e6'
                                    } 
                                }, formatMoney(player.finalScore))
                            )
                        )
                    )
                )
            ),

            // Action buttons
            React.createElement('div', { 
                className: 'game-end-actions',
                style: { 
                    display: 'flex', 
                    gap: '1rem', 
                    justifyContent: 'center' 
                }
            },
                React.createElement('button', {
                    onClick: restartGame,
                    style: {
                        padding: '0.75rem 2rem',
                        backgroundColor: '#2c5530',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }
                }, 'New Game'),
                React.createElement('button', {
                    onClick: () => setShowResults(false),
                    style: {
                        padding: '0.75rem 2rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }
                }, 'Close')
            )
        )
    );
}

// Export component globally for integration
window.GameEndScreen = GameEndScreen;