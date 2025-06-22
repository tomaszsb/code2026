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
        rolling: false,
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
        canTakeAction: false,
        showRulesModal: false
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

    // Get available moves and check if current space requires dice
    useEffect(() => {
        if (currentPlayer) {
            const currentSpaceData = window.CSVDatabase.spaces.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentSpaceData);
                const requiresDice = ComponentUtils.requiresDiceRoll(currentSpaceData);
                
                setActionState(prev => ({
                    ...prev,
                    availableMoves: moves,
                    diceRequired: requiresDice,
                    showDiceRoll: requiresDice,
                    pendingAction: requiresDice ? currentPlayer.position : null
                }));
            }
        }
    }, [currentPlayer?.position, currentPlayer?.id]);

    const handleMoveSelect = (spaceName) => {
        // Select/preview the move choice (don't execute yet)
        setActionState(prev => ({
            ...prev,
            selectedMove: spaceName,
            showMoveDetails: true
        }));
    };

    const executeSelectedMove = () => {
        if (actionState.selectedMove && currentPlayer) {
            const spaceData = window.CSVDatabase.spaces.find(actionState.selectedMove, 'First');
            
            // Skip negotiation check - we already have negotiate button in UI

            // Move player to new space
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

            // Auto-trigger space effects after move
            if (spaceData) {
                if (ComponentUtils.requiresDiceRoll(spaceData)) {
                    // Show dice roll interface for this space
                    setActionState(prev => ({
                        ...prev,
                        showDiceRoll: true,
                        diceRequired: true,
                        pendingAction: actionState.selectedMove,
                        selectedMove: null,
                        showMoveDetails: false,
                        hasMoved: true
                    }));
                } else {
                    // Process space effects directly
                    gameStateManager.emit('movePlayerRequest', {
                        playerId: currentPlayer.id,
                        spaceName: actionState.selectedMove,
                        visitType: 'First'
                    });
                    
                    setActionState(prev => ({
                        ...prev,
                        selectedMove: null,
                        showMoveDetails: false,
                        hasMoved: true,
                        actionsCompleted: [...prev.actionsCompleted, 'space_action']
                    }));
                }
            } else {
                // No space data, just clear selection
                setActionState(prev => ({
                    ...prev,
                    selectedMove: null,
                    showMoveDetails: false,
                    hasMoved: true
                }));
            }

            checkCanEndTurn();
        }
    };

    // handleTakeAction removed - space effects now auto-trigger on move

    const handleDiceRoll = async () => {
        // Start rolling animation
        setActionState(prev => ({
            ...prev,
            rolling: true,
            diceRollValue: '🎲'
        }));
        
        // Simulate dice roll animation delay (like original DiceRoll component)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate random roll (1-6)
        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Check if CSV database is loaded
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.error('ActionPanel: CSVDatabase not loaded for dice roll');
            const fallbackOutcome = `Rolled ${roll} - CSV data not available`;
            setActionState(prev => ({
                ...prev,
                rolling: false,
                hasRolled: true,
                diceRollValue: roll,
                diceOutcome: fallbackOutcome
            }));
            return;
        }
        
        // Get outcome from CSV
        const outcome = window.CSVDatabase.dice.getRollOutcome(
            actionState.pendingAction || currentPlayer.position, 
            currentPlayer.visitType || 'First', 
            roll
        );
        
        const finalOutcome = outcome || `You rolled ${roll} - no specific outcome defined`;
        
        console.log(`ActionPanel: Dice roll ${roll} at ${actionState.pendingAction || currentPlayer.position}, outcome: "${finalOutcome}"`);
        
        setActionState(prev => ({
            ...prev,
            rolling: false,
            hasRolled: true,
            diceRollValue: roll,
            diceOutcome: finalOutcome
        }));

        // Only emit processDiceOutcome to avoid double processing
        gameStateManager.emit('processDiceOutcome', {
            playerId: currentPlayer.id,
            outcome: finalOutcome,
            spaceName: actionState.pendingAction || currentPlayer.position,
            visitType: currentPlayer.visitType || 'First'
        });

        // Emit completion event for turn tracking
        gameStateManager.emit('diceRollCompleted', {
            playerId: currentPlayer.id,
            roll,
            space: actionState.pendingAction || currentPlayer.position,
            outcome: finalOutcome
        });

        // Hide dice interface after processing
        setTimeout(() => {
            setActionState(prev => ({
                ...prev,
                showDiceRoll: false,
                diceRequired: false,
                hasRolled: false,
                rolling: false,
                diceRollValue: null,
                diceOutcome: null,
                pendingAction: null
            }));
        }, 2000); // Show result for 2 seconds then hide

        checkCanEndTurn();
    };

    // handleApplyOutcome removed - outcomes now auto-apply after dice roll

    const showRulesModal = () => {
        setActionState(prev => ({
            ...prev,
            showRulesModal: true
        }));
    };

    const hideRulesModal = () => {
        setActionState(prev => ({
            ...prev,
            showRulesModal: false
        }));
    };

    const getRulesData = () => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            return null;
        }
        
        // Get both First and Subsequent versions of the rules space
        const rulesSpaceFirst = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'First');
        const rulesSpaceSubsequent = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'Subsequent');
        
        return {
            first: rulesSpaceFirst,
            subsequent: rulesSpaceSubsequent
        };
    };

    const handleNegotiate = () => {
        // Clear selected move and apply time penalty
        gameStateManager.emit('negotiationChosen', {
            playerId: currentPlayer.id,
            option: 'Clear choices with time penalty',
            space: actionState.selectedMove
        });

        // Apply time penalty (reduce time by 1)
        gameStateManager.emit('updatePlayerResources', {
            playerId: currentPlayer.id,
            timeChange: -1,
            reason: 'Negotiation time penalty'
        });

        // Clear all selections
        setActionState(prev => ({
            ...prev,
            selectedMove: null,
            showMoveDetails: false,
            showNegotiate: false,
            negotiationOptions: []
        }));
    };

    const handleEndTurn = () => {
        // If a move is selected, execute it first
        if (actionState.selectedMove) {
            executeSelectedMove();
        }
        
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

        // Take Action Section removed - space effects now auto-trigger on move

        // Unified Dice Roll Section (when dice is required or active)
        (actionState.showDiceRoll || actionState.diceRequired) && React.createElement('div', {
            key: 'dice-roll-section',
            className: 'dice-roll-section'
        }, [
            React.createElement('h5', {
                key: 'dice-title',
                className: 'subsection-title'
            }, '🎲 Dice Roll Required'),
            
            actionState.diceRequired && !actionState.showDiceRoll && React.createElement('p', {
                key: 'dice-instruction',
                className: 'dice-instruction'
            }, 'This space requires a dice roll to determine the outcome.'),
            
            React.createElement('div', {
                key: 'dice-container',
                className: 'dice-container'
            }, [
                React.createElement('div', {
                    key: 'dice-display',
                    className: `dice-display-large ${actionState.rolling ? 'rolling' : ''}`
                }, actionState.rolling ? '🎲' : (actionState.diceRollValue || '?')),
                
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
                    onClick: handleDiceRoll,
                    disabled: actionState.rolling
                }, actionState.rolling ? '🎲 Rolling...' : '🎲 Roll Dice')
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

        // Selected Move Details (simplified - no confirm/cancel buttons)
        actionState.showMoveDetails && actionState.selectedMove && React.createElement('div', {
            key: 'move-details',
            className: 'move-details'
        }, [
            React.createElement('h5', {
                key: 'details-title',
                className: 'subsection-title'
            }, '📋 Selected Move'),
            
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
                        // Only show Time Cost (unique info not displayed elsewhere)
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
            
            React.createElement('p', {
                key: 'instruction',
                className: 'move-instruction'
            }, 'Click "End Turn" to execute this move, or "Negotiate" to clear selection.')
        ]),

        // Duplicate dice section removed - now using unified dice interface above

        // Old negotiation section removed - using negotiate button in turn controls instead

        // Turn Controls
        React.createElement('div', {
            key: 'turn-controls',
            className: 'turn-controls'
        }, [
            React.createElement('button', {
                key: 'end-turn',
                className: 'end-turn-button',
                onClick: handleEndTurn,
                title: actionState.selectedMove ? 'Execute selected move and end turn' : 'End turn without moving'
            }, actionState.selectedMove ? 'Execute Move & End Turn' : 'End Turn'),
            
            React.createElement('button', {
                key: 'negotiate',
                className: 'negotiate-button',
                onClick: handleNegotiate,
                disabled: !actionState.selectedMove,
                title: 'Clear selection with time penalty (-1 time)'
            }, 'Negotiate (-1 Time)'),

            React.createElement('button', {
                key: 'view-rules',
                className: 'secondary-button',
                onClick: showRulesModal
            }, 'View Rules'),

            // Debug info for turn state (only show in debug mode)
            window.location.search.includes('debug=true') && React.createElement('div', {
                key: 'debug-turn-state',
                className: 'debug-turn-state',
                style: { fontSize: '10px', color: '#666', marginTop: '8px' }
            }, [
                React.createElement('div', {key: 'selected'}, `Selected: ${actionState.selectedMove || 'None'}`),
                React.createElement('div', {key: 'dice'}, `Dice Required: ${actionState.diceRequired}, Rolled: ${actionState.hasRolled}`)
            ])
        ]),

        // Rules Modal
        actionState.showRulesModal && React.createElement('div', {
            key: 'rules-modal',
            className: 'rules-modal-overlay',
            onClick: hideRulesModal,
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000
            }
        }, [
            React.createElement('div', {
                key: 'rules-modal-content',
                className: 'rules-modal-content',
                onClick: (e) => e.stopPropagation(),
                style: {
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '15px',
                    maxWidth: '800px',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    border: '3px solid var(--primary-color)'
                }
            }, [
                React.createElement('button', {
                    key: 'close-button',
                    className: 'close-button',
                    onClick: hideRulesModal,
                    style: {
                        position: 'absolute',
                        top: '15px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        fontSize: '28px',
                        cursor: 'pointer',
                        color: '#666',
                        fontWeight: 'bold'
                    }
                }, '×'),
                
                React.createElement('div', {
                    key: 'rules-content',
                    className: 'rules-content'
                }, (() => {
                    const rulesData = getRulesData();
                    if (!rulesData || !rulesData.first) {
                        return React.createElement('div', null, 'Rules not available - CSV data not loaded.');
                    }
                    
                    // Display Event, Action, and Outcome from both First and Subsequent versions as separate fields
                    
                    return [
                        React.createElement('h1', {
                            key: 'title',
                            style: {
                                color: 'var(--primary-color)',
                                marginBottom: '30px',
                                textAlign: 'center',
                                fontSize: '28px',
                                borderBottom: '3px solid var(--primary-color)',
                                paddingBottom: '15px'
                            }
                        }, '📋 Project Management Game - Quick Play Guide'),
                        
                        // Two-column layout for First and Subsequent versions
                        React.createElement('div', {
                            key: 'rules-columns',
                            style: {
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginBottom: '30px'
                            }
                        }, [
                            // First version column
                            React.createElement('div', {
                                key: 'first-column',
                                style: {
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    border: '2px solid #e9ecef'
                                }
                            }, [
                                React.createElement('h3', {
                                    key: 'first-title',
                                    style: {
                                        color: 'var(--primary-color)',
                                        marginBottom: '15px',
                                        textAlign: 'center',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--primary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '📚 Introduction & Rules'),
                                
                                rulesData.first.Event && React.createElement('div', {
                                    key: 'event-first',
                                    style: { padding: '10px', backgroundColor: '#e1f5fe', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#0277bd'}}, '📖 Event: '),
                                    rulesData.first.Event
                                ]),
                                
                                rulesData.first.Action && React.createElement('div', {
                                    key: 'action-first',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#7b1fa2'}}, '⚡ Action: '),
                                    rulesData.first.Action
                                ]),
                                
                                rulesData.first.Outcome && React.createElement('div', {
                                    key: 'outcome-first',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#388e3c'}}, '🎯 Outcome: '),
                                    rulesData.first.Outcome
                                ])
                            ]),
                            
                            // Subsequent version column
                            React.createElement('div', {
                                key: 'subsequent-column',
                                style: {
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    border: '2px solid #e9ecef'
                                }
                            }, [
                                React.createElement('h3', {
                                    key: 'subsequent-title',
                                    style: {
                                        color: 'var(--secondary-color)',
                                        marginBottom: '15px',
                                        textAlign: 'center',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--secondary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '🎮 Story & Strategy'),
                                
                                rulesData.subsequent && rulesData.subsequent.Event ? React.createElement('div', {
                                    key: 'event-subsequent',
                                    style: { padding: '10px', backgroundColor: '#e1f5fe', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#0277bd'}}, '📖 Event: '),
                                    rulesData.subsequent.Event
                                ]) : React.createElement('div', {
                                    key: 'event-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional event information'),
                                
                                rulesData.subsequent && rulesData.subsequent.Action ? React.createElement('div', {
                                    key: 'action-subsequent',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#7b1fa2'}}, '⚡ Action: '),
                                    rulesData.subsequent.Action
                                ]) : React.createElement('div', {
                                    key: 'action-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional action information'),
                                
                                rulesData.subsequent && rulesData.subsequent.Outcome ? React.createElement('div', {
                                    key: 'outcome-subsequent',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {style: {color: '#388e3c'}}, '🎯 Outcome: '),
                                    rulesData.subsequent.Outcome
                                ]) : React.createElement('div', {
                                    key: 'outcome-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional outcome information')
                            ])
                        ]),
                        
                        React.createElement('div', {
                            key: 'card-types',
                            style: {
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                border: '2px solid var(--border-color)'
                            }
                        }, [
                            React.createElement('h2', {
                                key: 'cards-title',
                                style: { color: 'var(--primary-color)', marginBottom: '20px', textAlign: 'center' }
                            }, '🃏 Card Types & Resources'),
                            
                            React.createElement('div', {
                                key: 'cards-grid',
                                style: {
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '20px'
                                }
                            }, [
                                // Left column - Card Types
                                React.createElement('div', {
                                    key: 'card-types-column',
                                    style: {
                                        display: 'grid',
                                        gap: '12px'
                                    }
                                }, [
                                    React.createElement('h3', {
                                        key: 'card-types-title',
                                        style: { 
                                            color: 'var(--primary-color)', 
                                            marginBottom: '10px',
                                            textAlign: 'center',
                                            fontSize: '16px',
                                            borderBottom: '2px solid var(--primary-color)',
                                            paddingBottom: '5px'
                                        }
                                    }, '🃏 Card Types'),
                                    
                                    React.createElement('div', {
                                        key: 'w-cards',
                                        style: { padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#1976d2'}}, '🔧 W Cards (Work): '),
                                        rulesData.first.w_card
                                    ]),
                                    React.createElement('div', {
                                        key: 'b-cards',
                                        style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#388e3c'}}, '💼 B Cards (Business): '),
                                        rulesData.first.b_card
                                    ]),
                                    React.createElement('div', {
                                        key: 'i-cards',
                                        style: { padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#f57c00'}}, '🔍 I Cards (Investigation): '),
                                        rulesData.first.i_card
                                    ]),
                                    React.createElement('div', {
                                        key: 'l-cards',
                                        style: { padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#d32f2f'}}, '⚖️ L Cards (Legal): '),
                                        rulesData.first.l_card
                                    ]),
                                    React.createElement('div', {
                                        key: 'e-cards',
                                        style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#7b1fa2'}}, '⚠️ E Cards (Emergency): '),
                                        rulesData.first.e_card
                                    ])
                                ]),
                                
                                // Right column - Resources & Game Elements
                                React.createElement('div', {
                                    key: 'resources-column',
                                    style: {
                                        display: 'grid',
                                        gap: '12px'
                                    }
                                }, [
                                    React.createElement('h3', {
                                        key: 'resources-title',
                                        style: { 
                                            color: 'var(--secondary-color)', 
                                            marginBottom: '10px',
                                            textAlign: 'center',
                                            fontSize: '16px',
                                            borderBottom: '2px solid var(--secondary-color)',
                                            paddingBottom: '5px'
                                        }
                                    }, '💰 Resources & Game Elements'),
                                    
                                    React.createElement('div', {
                                        key: 'time',
                                        style: { padding: '10px', backgroundColor: '#fce4ec', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#c2185b'}}, '⏰ Time: '),
                                        rulesData.first.Time
                                    ]),
                                    React.createElement('div', {
                                        key: 'fee',
                                        style: { padding: '10px', backgroundColor: '#f1f8e9', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#689f38'}}, '💰 Fees: '),
                                        rulesData.first.Fee
                                    ]),
                                    React.createElement('div', {
                                        key: 'paths',
                                        style: { padding: '10px', backgroundColor: '#e8eaf6', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#5e35b1'}}, '🛤️ Paths: '),
                                        rulesData.first.space_1
                                    ]),
                                    React.createElement('div', {
                                        key: 'negotiate',
                                        style: { padding: '10px', backgroundColor: '#e0f2f1', borderRadius: '8px' }
                                    }, [
                                        React.createElement('strong', {style: {color: '#00695c'}}, '🤝 Negotiate: '),
                                        rulesData.first.Negotiate
                                    ])
                                ])
                            ])
                        ])
                    ];
                })())
            ])
        ])
    ]);
}

window.ActionPanel = ActionPanel;