/**
 * ResultsPanel - Display game results, dice outcomes, and action history
 * Shows recent actions, current game state, and feedback
 */

function ResultsPanel() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [resultsState, setResultsState] = useState({
        recentActions: [],
        lastDiceRoll: null,
        gameProgress: null,
        notifications: [],
        showHistory: true
    });

    // Listen for game events
    useEventListener('diceRolled', ({ playerId, roll, space, result }) => {
        const player = gameState.players.find(p => p.id === playerId);
        setResultsState(prev => ({
            ...prev,
            lastDiceRoll: {
                player: player?.name,
                roll,
                space,
                result,
                timestamp: Date.now()
            }
        }));
        
        addAction(`${player?.name} rolled ${roll} at ${space}`, 'dice');
    });

    useEventListener('playerMoved', ({ playerId, fromSpace, toSpace }) => {
        const player = gameState.players.find(p => p.id === playerId);
        addAction(`${player?.name} moved from ${fromSpace} to ${toSpace}`, 'movement');
    });

    useEventListener('cardDrawn', ({ playerId, card, cardType }) => {
        const player = gameState.players.find(p => p.id === playerId);
        addAction(`${player?.name} drew a ${cardType} card`, 'card');
    });

    useEventListener('cardPlayed', ({ playerId, card }) => {
        const player = gameState.players.find(p => p.id === playerId);
        addAction(`${player?.name} played ${card.card_name || 'a card'}`, 'card');
    });

    useEventListener('negotiationChosen', ({ playerId, option, space }) => {
        const player = gameState.players.find(p => p.id === playerId);
        addAction(`${player?.name} chose to ${option} at ${space}`, 'negotiation');
    });

    useEventListener('turnEnded', ({ playerId }) => {
        const player = gameState.players.find(p => p.id === playerId);
        addAction(`${player?.name} ended their turn`, 'turn');
    });

    const addAction = (description, type) => {
        const action = {
            id: Date.now(),
            description,
            type,
            timestamp: Date.now(),
            playerColor: gameState.players[gameState.currentPlayer]?.color
        };

        setResultsState(prev => ({
            ...prev,
            recentActions: [action, ...prev.recentActions.slice(0, 9)] // Keep last 10 actions
        }));
    };

    const addNotification = (message, type = 'info') => {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now()
        };

        setResultsState(prev => ({
            ...prev,
            notifications: [notification, ...prev.notifications.slice(0, 4)] // Keep last 5 notifications
        }));

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setResultsState(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== notification.id)
            }));
        }, 5000);
    };

    const getActionIcon = (type) => {
        switch (type) {
            case 'dice': return '🎲';
            case 'movement': return '🚶';
            case 'card': return '🃏';
            case 'negotiation': return '🤝';
            case 'turn': return '⏭️';
            default: return '📝';
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getGameProgress = () => {
        if (!gameState.players || gameState.players.length === 0) return null;

        const totalPlayers = gameState.players.length;
        const currentTurn = gameState.currentPlayer + 1;
        const phases = ['INITIATION', 'OWNER-SCOPE', 'FUNDING', 'DESIGN', 'REGULATORY', 'CONSTRUCTION'];
        
        // Calculate average phase progress
        let phaseProgress = {};
        gameState.players.forEach(player => {
            const spaceData = window.CSVDatabase.spaces.find(player.position, 'First');
            if (spaceData && spaceData.phase) {
                phaseProgress[spaceData.phase] = (phaseProgress[spaceData.phase] || 0) + 1;
            }
        });

        return {
            totalPlayers,
            currentTurn,
            phaseProgress
        };
    };

    const toggleHistory = () => {
        setResultsState(prev => ({
            ...prev,
            showHistory: !prev.showHistory
        }));
    };

    const clearHistory = () => {
        setResultsState(prev => ({
            ...prev,
            recentActions: []
        }));
    };

    const gameProgress = getGameProgress();

    return React.createElement('div', {
        className: 'results-panel'
    }, [
        // Space Explorer Section
        React.createElement('div', {
            key: 'space-explorer-section',
            className: 'space-explorer-section'
        }, [
            window.SpaceExplorer ? React.createElement(SpaceExplorer, {
                key: 'space-explorer'
            }) : React.createElement('div', {
                key: 'explorer-loading',
                className: 'explorer-loading'
            }, 'Loading Space Explorer...')
        ]),

        // Results Header
        React.createElement('div', {
            key: 'results-header',
            className: 'results-header'
        }, [
            React.createElement('h4', {
                key: 'title',
                className: 'section-title'
            }, '📊 Results & Progress'),
            React.createElement('button', {
                key: 'toggle-history',
                className: 'toggle-button',
                onClick: toggleHistory,
                'aria-label': 'Toggle action history'
            }, resultsState.showHistory ? '▼' : '▶')
        ]),

        // Notifications
        resultsState.notifications.length > 0 && React.createElement('div', {
            key: 'notifications',
            className: 'notifications'
        }, 
            resultsState.notifications.map(notification => 
                React.createElement('div', {
                    key: notification.id,
                    className: `notification ${notification.type}`
                }, [
                    React.createElement('span', {
                        key: 'message',
                        className: 'notification-message'
                    }, notification.message),
                    React.createElement('span', {
                        key: 'time',
                        className: 'notification-time'
                    }, formatTimestamp(notification.timestamp))
                ])
            )
        ),

        // Last Dice Roll
        resultsState.lastDiceRoll && React.createElement('div', {
            key: 'last-dice',
            className: 'last-dice-result'
        }, [
            React.createElement('h5', {
                key: 'dice-title',
                className: 'subsection-title'
            }, '🎲 Last Dice Roll'),
            React.createElement('div', {
                key: 'dice-details',
                className: 'dice-details'
            }, [
                React.createElement('div', {
                    key: 'dice-display',
                    className: 'dice-display'
                }, resultsState.lastDiceRoll.roll),
                React.createElement('div', {
                    key: 'dice-info',
                    className: 'dice-info'
                }, [
                    React.createElement('p', {
                        key: 'player',
                        className: 'dice-player'
                    }, resultsState.lastDiceRoll.player),
                    React.createElement('p', {
                        key: 'space',
                        className: 'dice-space'
                    }, resultsState.lastDiceRoll.space),
                    React.createElement('p', {
                        key: 'time',
                        className: 'dice-time'
                    }, formatTimestamp(resultsState.lastDiceRoll.timestamp))
                ])
            ])
        ]),

        // Game Progress
        gameProgress && React.createElement('div', {
            key: 'game-progress',
            className: 'game-progress'
        }, [
            React.createElement('h5', {
                key: 'progress-title',
                className: 'subsection-title'
            }, '📈 Game Progress'),
            React.createElement('div', {
                key: 'progress-stats',
                className: 'progress-stats'
            }, [
                React.createElement('div', {
                    key: 'turn-info',
                    className: 'stat-item'
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: 'stat-label'
                    }, 'Current Turn:'),
                    React.createElement('span', {
                        key: 'value',
                        className: 'stat-value'
                    }, `${gameProgress.currentTurn}/${gameProgress.totalPlayers}`)
                ]),
                React.createElement('div', {
                    key: 'players-info',
                    className: 'stat-item'
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: 'stat-label'
                    }, 'Total Players:'),
                    React.createElement('span', {
                        key: 'value',
                        className: 'stat-value'
                    }, gameProgress.totalPlayers)
                ])
            ]),
            
            // Phase Progress
            Object.keys(gameProgress.phaseProgress).length > 0 && React.createElement('div', {
                key: 'phase-progress',
                className: 'phase-progress'
            }, [
                React.createElement('h6', {
                    key: 'phase-title',
                    className: 'phase-title'
                }, 'Players by Phase:'),
                React.createElement('div', {
                    key: 'phase-list',
                    className: 'phase-list'
                }, 
                    Object.entries(gameProgress.phaseProgress).map(([phase, count]) => 
                        React.createElement('div', {
                            key: phase,
                            className: 'phase-item'
                        }, [
                            React.createElement('span', {
                                key: 'phase-name',
                                className: 'phase-name'
                            }, phase),
                            React.createElement('span', {
                                key: 'phase-count',
                                className: 'phase-count'
                            }, count)
                        ])
                    )
                )
            ])
        ]),

        // Recent Actions History
        resultsState.showHistory && React.createElement('div', {
            key: 'action-history',
            className: 'action-history'
        }, [
            React.createElement('div', {
                key: 'history-header',
                className: 'history-header'
            }, [
                React.createElement('h5', {
                    key: 'history-title',
                    className: 'subsection-title'
                }, '📜 Recent Actions'),
                resultsState.recentActions.length > 0 && React.createElement('button', {
                    key: 'clear-history',
                    className: 'clear-button',
                    onClick: clearHistory,
                    title: 'Clear action history'
                }, '🗑️')
            ]),
            
            resultsState.recentActions.length > 0 ? React.createElement('div', {
                key: 'actions-list',
                className: 'actions-list'
            }, 
                resultsState.recentActions.map(action => 
                    React.createElement('div', {
                        key: action.id,
                        className: `action-item ${action.type}`
                    }, [
                        React.createElement('span', {
                            key: 'icon',
                            className: 'action-icon'
                        }, getActionIcon(action.type)),
                        React.createElement('span', {
                            key: 'description',
                            className: 'action-description'
                        }, action.description),
                        React.createElement('span', {
                            key: 'time',
                            className: 'action-time'
                        }, formatTimestamp(action.timestamp))
                    ])
                )
            ) : React.createElement('p', {
                key: 'no-actions',
                className: 'no-actions-message'
            }, 'No actions recorded yet.')
        ])
    ]);
}

window.ResultsPanel = ResultsPanel;