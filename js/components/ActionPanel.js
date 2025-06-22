/**
 * ActionPanel - Interactive action and movement interface
 * Handles move selection, dice rolling, and game actions
 */

function ActionPanel() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [actionState, setActionState] = useState({
        availableMoves: [],
        selectedMove: null,
        showMoveDetails: false,
        diceRequired: false,
        hasRolled: false,
        pendingAction: null,
        showNegotiate: false,
        negotiationOptions: [],
        turnPhase: 'WAITING', // Track turn state
        actionsCompleted: [],
        hasMoved: false,
        canEndTurn: false,
        showDiceRoll: false,
        diceRollValue: null,
        diceOutcome: null,
        canTakeAction: false
    });

    const currentPlayer = gameState.players[gameState.currentPlayer];

    // Listen for game state changes
    useEventListener('availableMovesUpdated', ({ availableMoves }) => {
        setActionState(prev => ({
            ...prev,
            availableMoves
        }));
    });

    useEventListener('diceRequired', ({ required, space }) => {
        setActionState(prev => ({
            ...prev,
            diceRequired: required,
            pendingAction: space
        }));
    });

    useEventListener('negotiationAvailable', ({ options }) => {
        setActionState(prev => ({
            ...prev,
            showNegotiate: true,
            negotiationOptions: options
        }));
    });

    // Listen for turn state changes
    useEventListener('turnStarted', ({ player, turnNumber }) => {
        if (player.id === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                turnPhase: 'MOVING',
                actionsCompleted: [],
                hasMoved: false,
                canEndTurn: false
            }));
        }
    });

    useEventListener('playerMoved', ({ playerId }) => {
        if (playerId === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                hasMoved: true,
                turnPhase: 'ACTING'
            }));
            checkCanEndTurn();
        }
    });

    useEventListener('spaceActionCompleted', ({ playerId }) => {
        if (playerId === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                actionsCompleted: [...prev.actionsCompleted, 'space_action']
            }));
            checkCanEndTurn();
        }
    });

    useEventListener('diceRollCompleted', ({ playerId }) => {
        if (playerId === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                actionsCompleted: [...prev.actionsCompleted, 'dice_roll']
            }));
            checkCanEndTurn();
        }
    });

    // Check if turn can end based on completed actions
    const checkCanEndTurn = () => {
        setActionState(prev => {
            const hasCompletedMove = prev.hasMoved;
            const hasRequiredActions = prev.diceRequired ? prev.hasRolled : true;
            const canEnd = hasCompletedMove && hasRequiredActions;
            
            return {
                ...prev,
                canEndTurn: canEnd
            };
        });
    };

    // Get available moves and check action availability on player change
    useEffect(() => {
        if (currentPlayer) {
            const currentSpaceData = window.CSVDatabase.spaces.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentSpaceData);
                const canTakeAction = currentSpaceData.Action || ComponentUtils.requiresDiceRoll(currentSpaceData);
                
                setActionState(prev => ({
                    ...prev,
                    availableMoves: moves,
                    canTakeAction
                }));
            }
        }
    }, [currentPlayer?.position, currentPlayer?.id]);

    const handleMoveSelect = (spaceName) => {
        const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
        
        setActionState(prev => ({
            ...prev,
            selectedMove: spaceName,
            showMoveDetails: true
        }));

        // Check if dice roll is required
        const diceInfo = window.CSVDatabase.dice.query({
            space: spaceName,
            visitType: 'First'
        });

        if (diceInfo.length > 0) {
            setActionState(prev => ({
                ...prev,
                diceRequired: true,
                pendingAction: spaceName
            }));
        }
    };

    const handleMoveConfirm = () => {
        if (actionState.selectedMove && currentPlayer) {
            // Check if negotiation is available
            const spaceData = window.CSVDatabase.spaces.find(actionState.selectedMove, 'First');
            if (spaceData && spaceData.Action && spaceData.Action.includes('negotiate')) {
                setActionState(prev => ({
                    ...prev,
                    showNegotiate: true,
                    negotiationOptions: ['Accept', 'Negotiate for better terms']
                }));
                return;
            }

            // Direct move
            gameStateManager.emit('playerMove', {
                playerId: currentPlayer.id,
                targetSpace: actionState.selectedMove,
                visitType: 'First'
            });

            // Emit player moved event for turn tracking
            gameStateManager.emit('playerMoved', {
                playerId: currentPlayer.id,
                fromSpace: currentPlayer.position,
                toSpace: actionState.selectedMove
            });

            setActionState(prev => ({
                ...prev,
                selectedMove: null,
                showMoveDetails: false,
                hasMoved: true
            }));

            checkCanEndTurn();
        }
    };

    // Handle Take Action button - similar to original GameBoard logic
    const handleTakeAction = () => {
        if (!currentPlayer) return;
        
        const spaceData = window.CSVDatabase.spaces.find(
            currentPlayer.position, 
            currentPlayer.visitType || 'First'
        );
        
        if (ComponentUtils.requiresDiceRoll(spaceData)) {
            // Show dice roll in this panel
            setActionState(prev => ({
                ...prev,
                showDiceRoll: true,
                diceRequired: true,
                pendingAction: currentPlayer.position
            }));
            
            // Also emit for other components
            gameStateManager.emit('showDiceRoll', {
                playerId: gameState.currentPlayer,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
        } else {
            // Process space effects directly
            gameStateManager.emit('movePlayerRequest', {
                playerId: gameState.currentPlayer,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
            
            // Mark action as completed
            setActionState(prev => ({
                ...prev,
                actionsCompleted: [...prev.actionsCompleted, 'space_action']
            }));
            checkCanEndTurn();
        }
    };

    const handleDiceRoll = () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Get outcome from CSV
        const outcome = window.CSVDatabase.dice.getRollOutcome(
            currentPlayer.position, 
            currentPlayer.visitType || 'First', 
            roll
        ) || `You rolled ${roll}`;
        
        setActionState(prev => ({
            ...prev,
            hasRolled: true,
            diceRollValue: roll,
            diceOutcome: outcome
        }));

        gameStateManager.emit('diceRolled', {
            playerId: currentPlayer.id,
            roll,
            space: actionState.pendingAction,
            outcome
        });

        // Emit completion event for turn tracking
        gameStateManager.emit('diceRollCompleted', {
            playerId: currentPlayer.id,
            roll,
            space: actionState.pendingAction,
            outcome
        });

        checkCanEndTurn();
    };

    const handleApplyOutcome = () => {
        if (!actionState.diceOutcome) return;
        
        // Process the dice outcome - use same event as original DiceRoll component
        gameStateManager.emit('processDiceOutcome', {
            playerId: currentPlayer.id,
            outcome: actionState.diceOutcome,
            spaceName: currentPlayer.position,
            visitType: currentPlayer.visitType || 'First'
        });
        
        // Hide dice roll interface
        setActionState(prev => ({
            ...prev,
            showDiceRoll: false,
            diceRequired: false,
            actionsCompleted: [...prev.actionsCompleted, 'dice_action']
        }));
        
        checkCanEndTurn();
    };

    const handleNegotiate = (option) => {
        gameStateManager.emit('negotiationChosen', {
            playerId: currentPlayer.id,
            option,
            space: actionState.selectedMove
        });

        setActionState(prev => ({
            ...prev,
            showNegotiate: false,
            negotiationOptions: []
        }));

        if (option === 'Accept') {
            handleMoveConfirm();
        }
    };

    const handleEndTurn = () => {
        gameStateManager.emit('turnEnded', {
            playerId: currentPlayer.id
        });

        setActionState(prev => ({
            ...prev,
            selectedMove: null,
            showMoveDetails: false,
            diceRequired: false,
            hasRolled: false,
            pendingAction: null
        }));
    };

    if (!currentPlayer) {
        return React.createElement('div', {
            className: 'action-panel'
        }, [
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'Waiting for game to start...')
        ]);
    }

    return React.createElement('div', {
        className: 'action-panel'
    }, [
        // Action Header
        React.createElement('div', {
            key: 'action-header',
            className: 'action-header'
        }, [
            React.createElement('h4', {
                key: 'title',
                className: 'section-title'
            }, '🎯 Actions'),
            React.createElement('p', {
                key: 'turn-indicator',
                className: 'turn-indicator'
            }, `${currentPlayer.name}'s Turn`)
        ]),

        // Take Action Section (for current space)
        actionState.canTakeAction && React.createElement('div', {
            key: 'take-action-section',
            className: 'take-action-section'
        }, [
            React.createElement('h5', {
                key: 'action-title',
                className: 'subsection-title'
            }, '⚡ Current Space Action'),
            
            React.createElement('button', {
                key: 'take-action',
                className: 'take-action-button',
                onClick: handleTakeAction
            }, 'Take Action')
        ]),

        // Dice Roll Section (when active)
        actionState.showDiceRoll && React.createElement('div', {
            key: 'dice-roll-section',
            className: 'dice-roll-section'
        }, [
            React.createElement('h5', {
                key: 'dice-title',
                className: 'subsection-title'
            }, '🎲 Dice Roll'),
            
            React.createElement('div', {
                key: 'dice-container',
                className: 'dice-container'
            }, [
                React.createElement('div', {
                    key: 'dice-display',
                    className: 'dice-display-large'
                }, actionState.diceRollValue || '?'),
                
                actionState.diceOutcome && React.createElement('div', {
                    key: 'outcome',
                    className: 'dice-outcome-text'
                }, actionState.diceOutcome)
            ]),
            
            React.createElement('div', {
                key: 'dice-actions',
                className: 'dice-actions'
            }, [
                !actionState.hasRolled && React.createElement('button', {
                    key: 'roll',
                    className: 'dice-button',
                    onClick: handleDiceRoll
                }, '🎲 Roll Dice'),
                
                actionState.hasRolled && React.createElement('button', {
                    key: 'apply',
                    className: 'apply-outcome-button',
                    onClick: handleApplyOutcome
                }, 'Apply Outcome')
            ])
        ]),

        // Available Moves Section
        actionState.availableMoves.length > 0 && React.createElement('div', {
            key: 'moves-section',
            className: 'moves-section'
        }, [
            React.createElement('h5', {
                key: 'moves-title',
                className: 'subsection-title'
            }, '🚶 Available Moves'),
            
            React.createElement('div', {
                key: 'moves-grid',
                className: 'moves-grid'
            }, 
                actionState.availableMoves.map(spaceName => {
                    const spaceData = window.CSVDatabase.spaces.find(spaceName, 'First');
                    const isSelected = actionState.selectedMove === spaceName;
                    
                    return React.createElement('button', {
                        key: spaceName,
                        className: `move-button ${isSelected ? 'selected' : ''}`,
                        onClick: () => handleMoveSelect(spaceName),
                        title: spaceData ? spaceData.Event : spaceName
                    }, [
                        React.createElement('div', {
                            key: 'space-name',
                            className: 'move-space-name'
                        }, spaceName),
                        spaceData && React.createElement('div', {
                            key: 'space-phase',
                            className: 'move-space-phase'
                        }, spaceData.phase)
                    ]);
                })
            )
        ]),

        // Selected Move Details
        actionState.showMoveDetails && actionState.selectedMove && React.createElement('div', {
            key: 'move-details',
            className: 'move-details'
        }, [
            React.createElement('h5', {
                key: 'details-title',
                className: 'subsection-title'
            }, '📋 Move Details'),
            
            React.createElement('div', {
                key: 'details-content',
                className: 'details-content'
            }, [
                React.createElement('p', {
                    key: 'target-space',
                    className: 'target-space'
                }, [
                    React.createElement('strong', null, 'Target: '),
                    actionState.selectedMove
                ]),
                
                (() => {
                    const spaceData = window.CSVDatabase.spaces.find(actionState.selectedMove, 'First');
                    if (!spaceData) return null;
                    
                    return [
                        spaceData.Event && React.createElement('p', {
                            key: 'event',
                            className: 'space-event'
                        }, [
                            React.createElement('strong', null, 'Event: '),
                            spaceData.Event
                        ]),
                        
                        spaceData.Action && React.createElement('p', {
                            key: 'action',
                            className: 'space-action'
                        }, [
                            React.createElement('strong', null, 'Action: '),
                            spaceData.Action
                        ]),
                        
                        spaceData.Time && React.createElement('p', {
                            key: 'time-cost',
                            className: 'time-cost'
                        }, [
                            React.createElement('strong', null, 'Time Cost: '),
                            `${spaceData.Time} units`
                        ])
                    ];
                })()
            ]),
            
            // Action Buttons
            React.createElement('div', {
                key: 'action-buttons',
                className: 'action-buttons'
            }, [
                React.createElement('button', {
                    key: 'confirm-move',
                    className: 'confirm-button',
                    onClick: handleMoveConfirm
                }, 'Confirm Move'),
                
                React.createElement('button', {
                    key: 'cancel-move',
                    className: 'cancel-button',
                    onClick: () => setActionState(prev => ({
                        ...prev,
                        selectedMove: null,
                        showMoveDetails: false
                    }))
                }, 'Cancel')
            ])
        ]),

        // Dice Rolling Section
        actionState.diceRequired && React.createElement('div', {
            key: 'dice-section',
            className: 'dice-section'
        }, [
            React.createElement('h5', {
                key: 'dice-title',
                className: 'subsection-title'
            }, '🎲 Dice Required'),
            
            React.createElement('p', {
                key: 'dice-instruction',
                className: 'dice-instruction'
            }, 'This space requires a dice roll to determine the outcome.'),
            
            React.createElement('button', {
                key: 'roll-dice',
                className: 'dice-button',
                onClick: handleDiceRoll,
                disabled: actionState.hasRolled
            }, actionState.hasRolled ? 'Rolled!' : '🎲 Roll Dice')
        ]),

        // Negotiation Section
        actionState.showNegotiate && React.createElement('div', {
            key: 'negotiate-section',
            className: 'negotiate-section'
        }, [
            React.createElement('h5', {
                key: 'negotiate-title',
                className: 'subsection-title'
            }, '🤝 Negotiation'),
            
            React.createElement('p', {
                key: 'negotiate-instruction',
                className: 'negotiate-instruction'
            }, 'Choose how to handle this situation:'),
            
            React.createElement('div', {
                key: 'negotiate-options',
                className: 'negotiate-options'
            }, 
                actionState.negotiationOptions.map(option => 
                    React.createElement('button', {
                        key: option,
                        className: 'negotiate-button',
                        onClick: () => handleNegotiate(option)
                    }, option)
                )
            )
        ]),

        // Turn Controls
        React.createElement('div', {
            key: 'turn-controls',
            className: 'turn-controls'
        }, [
            React.createElement('button', {
                key: 'end-turn',
                className: `end-turn-button ${!actionState.canEndTurn ? 'disabled' : ''}`,
                onClick: handleEndTurn,
                disabled: !actionState.canEndTurn,
                title: !actionState.canEndTurn ? 'Complete required actions first' : 'End your turn'
            }, 'End Turn'),
            
            React.createElement('button', {
                key: 'view-rules',
                className: 'secondary-button',
                onClick: () => gameStateManager.emit('showRules')
            }, 'View Rules'),

            // Debug info for turn state (only show in debug mode)
            window.location.search.includes('debug=true') && React.createElement('div', {
                key: 'debug-turn-state',
                className: 'debug-turn-state',
                style: { fontSize: '10px', color: '#666', marginTop: '8px' }
            }, [
                React.createElement('div', {key: 'moved'}, `Moved: ${actionState.hasMoved}`),
                React.createElement('div', {key: 'dice'}, `Dice Required: ${actionState.diceRequired}, Rolled: ${actionState.hasRolled}`),
                React.createElement('div', {key: 'can-end'}, `Can End Turn: ${actionState.canEndTurn}`)
            ])
        ])
    ]);
}

window.ActionPanel = ActionPanel;