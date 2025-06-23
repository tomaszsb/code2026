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
        showRulesModal: false,
        availableCardActions: [],
        originalCardActionCount: 0, // Track original count to compare against current
        showCardActions: false,
        requiredActions: 0,
        completedActions: 0
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

    useEventListener('showCardActions', ({ playerId, cardActions, spaceName }) => {
        console.log(`ActionPanel: Received showCardActions event for player ${playerId}, currentPlayer: ${currentPlayer?.id}`);
        console.log('ActionPanel: Card actions:', cardActions);
        if (playerId === currentPlayer?.id) {
            console.log('ActionPanel: Setting card actions in state');
            setActionState(prev => ({
                ...prev,
                availableCardActions: cardActions,
                showCardActions: true
            }));
        }
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
            // Calculate required vs completed actions
            let requiredActions = 0;
            let completedActions = 0;
            
            // Count required actions for current space
            if (prev.diceRequired) requiredActions++;
            if (prev.originalCardActionCount > 0) requiredActions += prev.originalCardActionCount;
            if (prev.availableMoves.length > 0) requiredActions++; // Movement selection
            
            // Count completed actions
            if (prev.diceRequired && prev.hasRolled) completedActions++;
            if (prev.selectedMove) completedActions++; // Movement selected
            
            // Card actions completed = original count - remaining count
            const cardActionsCompleted = prev.originalCardActionCount - prev.availableCardActions.length;
            completedActions += cardActionsCompleted;
            
            // If no actions are required on this space, allow ending turn immediately
            const canEnd = requiredActions === 0 || completedActions >= requiredActions;
            
            console.log(`ActionPanel: Required actions: ${requiredActions}, Completed: ${completedActions}, Can end: ${canEnd}`);
            
            return {
                ...prev,
                canEndTurn: canEnd,
                requiredActions: requiredActions,
                completedActions: completedActions
            };
        });
    };

    // Get available moves and check if current space requires dice
    useEffect(() => {
        if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaces.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentSpaceData);
                const requiresDice = ComponentUtils.requiresDiceRoll(currentSpaceData);
                const cardTypes = ComponentUtils.getCardTypes(currentSpaceData);
                
                console.log(`ActionPanel: Current space ${currentPlayer.position} has ${cardTypes.length} card actions:`, cardTypes);
                
                setActionState(prev => ({
                    ...prev,
                    availableMoves: moves,
                    diceRequired: requiresDice,
                    showDiceRoll: requiresDice,
                    pendingAction: requiresDice ? currentPlayer.position : null,
                    availableCardActions: cardTypes,
                    originalCardActionCount: cardTypes.length, // Store original count
                    showCardActions: cardTypes.length > 0
                }));
                
                // Recalculate action counts when space data changes
                setTimeout(() => checkCanEndTurn(), 100);
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
        
        // Update action counter
        setTimeout(() => checkCanEndTurn(), 100);
    };

    const executeSelectedMove = () => {
        if (actionState.selectedMove && currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            // Use only movePlayerRequest - this handles both movement and space effects
            gameStateManager.emit('movePlayerRequest', {
                playerId: currentPlayer.id,
                spaceName: actionState.selectedMove,
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
                hasMoved: true,
                actionsCompleted: [...prev.actionsCompleted, 'space_action']
            }));

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
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            return { first: null, subsequent: null };
        }
        
        const rulesSpaceFirst = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'First');
        const rulesSpaceSubsequent = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'Subsequent');
        
        return {
            first: rulesSpaceFirst,
            subsequent: rulesSpaceSubsequent
        };
    };

    const handleNegotiate = () => {
        console.log('ActionPanel: Negotiate button clicked');
        
        // Restore player state to space entry and apply time penalty
        gameStateManager.emit('clearCardsAddedThisTurn', {
            playerId: currentPlayer.id
        });
        
        console.log('ActionPanel: Restored player state with time penalty');

        // Reset all turn state
        setActionState(prev => ({
            ...prev,
            selectedMove: null,
            showMoveDetails: false,
            showNegotiate: false,
            negotiationOptions: [],
            hasRolled: false,
            rolling: false,
            diceRequired: false,
            showDiceRoll: false,
            diceRollValue: null,
            diceOutcome: null,
            pendingAction: null,
            availableCardActions: [],
            originalCardActionCount: 0,
            showCardActions: false,
            actionsCompleted: [],
            hasMoved: false,
            canEndTurn: false,
            requiredActions: 0,
            completedActions: 0
        }));
        
        console.log('ActionPanel: Reset turn state, ending turn');

        // End the turn after negotiating
        setTimeout(() => {
            gameStateManager.emit('turnEnded', {
                playerId: currentPlayer.id,
                reason: 'Negotiation - turn ended'
            });
            console.log('ActionPanel: Turn ended after negotiation');
        }, 500); // Small delay to ensure state is cleared first
    };

    const handleCardAction = (cardType, action) => {
        if (currentPlayer) {
            console.log(`ActionPanel: Processing card action ${cardType} - ${action}`);
            
            gameStateManager.emit('processCardAction', {
                playerId: currentPlayer.id,
                cardType,
                action
            });
            
            // Remove this action from available actions and track completion
            setActionState(prev => {
                const newAvailableActions = prev.availableCardActions.filter(
                    ca => !(ca.type === cardType && ca.action === action)
                );
                
                console.log(`ActionPanel: Removed action, ${prev.availableCardActions.length} -> ${newAvailableActions.length}`);
                
                return {
                    ...prev,
                    availableCardActions: newAvailableActions,
                    actionsCompleted: [...prev.actionsCompleted, `card_${cardType}_${action}`]
                };
            });
            
            // Recalculate if we can end turn
            setTimeout(() => checkCanEndTurn(), 100);
        }
    };

    const handleEndTurn = () => {
        // Check if current space requires a decision
        if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaces.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            // Prevent ending turn if this is a decision space without making a choice
            if (currentSpaceData) {
                const spaceName = currentSpaceData.space_name || '';
                const event = (currentSpaceData.Event || '').toLowerCase();
                
                if (spaceName.includes('DECISION-CHECK') || spaceName.includes('DECISION') ||
                    event.includes('yes/no') || event.includes('choose') || event.includes('decision')) {
                    // Show error message for decision required
                    gameStateManager.emit('showMessage', {
                        type: 'warning',
                        message: `Decision Required for ${spaceName}`,
                        description: 'You must make a decision before ending your turn.'
                    });
                    return; // Prevent turn from ending
                }
            }
        }
        
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

        // Card Actions Section
        actionState.showCardActions && actionState.availableCardActions.length > 0 && React.createElement('div', {
            key: 'card-actions-section',
            className: 'card-actions-section'
        }, [
            React.createElement('h5', {
                key: 'card-actions-title',
                className: 'subsection-title'
            }, '🎴 Available Card Actions'),
            
            React.createElement('div', {
                key: 'card-actions-grid',
                className: 'card-actions-grid'
            }, 
                actionState.availableCardActions.map((cardAction, index) => {
                    const cardTypeNames = { W: 'Work', B: 'Bank', I: 'Investor', L: 'Life', E: 'Expeditor' };
                    const cardTypeName = cardTypeNames[cardAction.type] || cardAction.type;
                    
                    return React.createElement('button', {
                        key: `${cardAction.type}-${index}`,
                        className: `card-action-button card-action-${cardAction.type.toLowerCase()}`,
                        onClick: () => handleCardAction(cardAction.type, cardAction.action),
                        title: `${cardTypeName}: ${cardAction.action}`
                    }, [
                        React.createElement('div', {
                            key: 'card-type',
                            className: 'card-action-type'
                        }, `${cardTypeName} Cards`),
                        React.createElement('div', {
                            key: 'card-action',
                            className: 'card-action-text'
                        }, cardAction.action)
                    ]);
                })
            )
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
                    if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
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
                    React.createElement('strong', {key: 'target-label'}, 'Target: '),
                    actionState.selectedMove
                ]),
                
                (() => {
                    if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
                    const spaceData = window.CSVDatabase.spaces.find(actionState.selectedMove, 'First');
                    if (!spaceData) return null;
                    
                    return [
                        // Only show Time Cost (unique info not displayed elsewhere)
                        spaceData.Time && React.createElement('p', {
                            key: 'time-cost',
                            className: 'time-cost'
                        }, [
                            React.createElement('strong', {key: 'time-label'}, 'Time Cost: '),
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
                disabled: !actionState.canEndTurn,
                title: actionState.canEndTurn ? 'End your turn' : `Complete all required actions first (${actionState.completedActions}/${actionState.requiredActions})`
            }, `End Turn (${actionState.completedActions}/${actionState.requiredActions})`),
            
            React.createElement('button', {
                key: 'negotiate',
                className: 'negotiate-button',
                onClick: handleNegotiate,
                disabled: false, // Always available - time penalty is calculated from current space
                title: (() => {
                    // Calculate time penalty from current space
                    if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
                        const currentSpaceData = window.CSVDatabase.spaces.find(
                            currentPlayer.position, 
                            currentPlayer.visitType || 'First'
                        );
                        if (currentSpaceData && currentSpaceData.Time) {
                            const timeCost = parseInt(currentSpaceData.Time.replace(/\D/g, '')) || 1;
                            return `Reset to space entry with time penalty (-${timeCost} days)`;
                        }
                    }
                    return 'Reset to space entry with time penalty (-1 day)';
                })()
            }, 'Negotiate'),

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
                                marginBottom: '30px',
                                alignItems: 'start'
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
                                    React.createElement('strong', {key: 'event-label-first', style: {color: '#0277bd'}}, '📖 Event: '),
                                    React.createElement('span', {key: 'event-text-first'}, rulesData.first.Event)
                                ]),
                                
                                rulesData.first.Action && React.createElement('div', {
                                    key: 'action-first',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {key: 'action-label-first', style: {color: '#7b1fa2'}}, '⚡ Action: '),
                                    React.createElement('span', {key: 'action-text-first'}, rulesData.first.Action)
                                ]),
                                
                                rulesData.first.Outcome && React.createElement('div', {
                                    key: 'outcome-first',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {key: 'outcome-label-first', style: {color: '#388e3c'}}, '🎯 Outcome: '),
                                    React.createElement('span', {key: 'outcome-text-first'}, rulesData.first.Outcome)
                                ]),
                                
                                // Add first card types section
                                React.createElement('h4', {
                                    key: 'first-cards-title',
                                    style: {
                                        color: 'var(--primary-color)',
                                        margin: '20px 0 15px 0',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--primary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '🃏 Card Types'),
                                
                                rulesData.first.w_card && React.createElement('div', {
                                    key: 'w-cards-first',
                                    style: { 
                                        padding: '10px', 
                                        backgroundColor: '#e3f2fd', 
                                        borderRadius: '8px', 
                                        marginBottom: '8px',
                                        minHeight: '60px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }
                                }, [
                                    React.createElement('strong', {key: 'w-label-first', style: {color: '#1976d2'}}, '🔧 W Cards (Work): '),
                                    React.createElement('span', {key: 'w-text-first'}, rulesData.first.w_card)
                                ]),
                                
                                rulesData.first.b_card && React.createElement('div', {
                                    key: 'b-cards-first',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'b-label-first', style: {color: '#388e3c'}}, '💼 B Cards (Bank): '),
                                    React.createElement('span', {key: 'b-text-first'}, rulesData.first.b_card)
                                ]),
                                
                                rulesData.first.i_card && React.createElement('div', {
                                    key: 'i-cards-first',
                                    style: { padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'i-label-first', style: {color: '#f57c00'}}, '🔍 I Cards (Investor): '),
                                    React.createElement('span', {key: 'i-text-first'}, rulesData.first.i_card)
                                ]),
                                
                                rulesData.first.l_card && React.createElement('div', {
                                    key: 'l-cards-first',
                                    style: { padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'l-label-first', style: {color: '#d32f2f'}}, '⚖️ L Cards (Life): '),
                                    React.createElement('span', {key: 'l-text-first'}, rulesData.first.l_card)
                                ]),
                                
                                rulesData.first.e_card && React.createElement('div', {
                                    key: 'e-cards-first',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'e-label-first', style: {color: '#7b1fa2'}}, '⚠️ E Cards (Expeditor): '),
                                    React.createElement('span', {key: 'e-text-first'}, rulesData.first.e_card)
                                ]),
                                
                                // Add first resources section
                                React.createElement('h4', {
                                    key: 'first-resources-title',
                                    style: {
                                        color: 'var(--primary-color)',
                                        margin: '20px 0 15px 0',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--primary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '💰 Resources & Game Elements'),
                                
                                rulesData.first.Time && React.createElement('div', {
                                    key: 'time-first',
                                    style: { padding: '10px', backgroundColor: '#fce4ec', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'time-label-first', style: {color: '#c2185b'}}, '⏰ Time: '),
                                    React.createElement('span', {key: 'time-text-first'}, rulesData.first.Time)
                                ]),
                                
                                rulesData.first.Fee && React.createElement('div', {
                                    key: 'fee-first',
                                    style: { padding: '10px', backgroundColor: '#f1f8e9', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'fee-label-first', style: {color: '#689f38'}}, '💰 Fees: '),
                                    React.createElement('span', {key: 'fee-text-first'}, rulesData.first.Fee)
                                ]),
                                
                                rulesData.first.space_1 && React.createElement('div', {
                                    key: 'paths-first',
                                    style: { padding: '10px', backgroundColor: '#e8eaf6', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'paths-label-first', style: {color: '#5e35b1'}}, '🛤️ Paths: '),
                                    React.createElement('span', {key: 'paths-text-first'}, rulesData.first.space_1)
                                ]),
                                
                                rulesData.first.Negotiate && React.createElement('div', {
                                    key: 'negotiate-first',
                                    style: { padding: '10px', backgroundColor: '#e0f2f1', borderRadius: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'negotiate-label-first', style: {color: '#00695c'}}, '🤝 Negotiate: '),
                                    React.createElement('span', {key: 'negotiate-text-first'}, rulesData.first.Negotiate)
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
                                    React.createElement('strong', {key: 'event-label-sub', style: {color: '#0277bd'}}, '📖 Event: '),
                                    React.createElement('span', {key: 'event-text-sub'}, rulesData.subsequent.Event)
                                ]) : React.createElement('div', {
                                    key: 'event-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional event information'),
                                
                                rulesData.subsequent && rulesData.subsequent.Action ? React.createElement('div', {
                                    key: 'action-subsequent',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {key: 'action-label-sub', style: {color: '#7b1fa2'}}, '⚡ Action: '),
                                    React.createElement('span', {key: 'action-text-sub'}, rulesData.subsequent.Action)
                                ]) : React.createElement('div', {
                                    key: 'action-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional action information'),
                                
                                rulesData.subsequent && rulesData.subsequent.Outcome ? React.createElement('div', {
                                    key: 'outcome-subsequent',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '12px' }
                                }, [
                                    React.createElement('strong', {key: 'outcome-label-sub', style: {color: '#388e3c'}}, '🎯 Outcome: '),
                                    React.createElement('span', {key: 'outcome-text-sub'}, rulesData.subsequent.Outcome)
                                ]) : React.createElement('div', {
                                    key: 'outcome-placeholder',
                                    style: { padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '12px', fontStyle: 'italic', color: '#999' }
                                }, 'No additional outcome information'),
                                
                                // Add subsequent card types section
                                React.createElement('h4', {
                                    key: 'subsequent-cards-title',
                                    style: {
                                        color: 'var(--secondary-color)',
                                        margin: '20px 0 15px 0',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--secondary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '🃏 Card Types Strategy'),
                                
                                rulesData.subsequent && rulesData.subsequent.w_card ? React.createElement('div', {
                                    key: 'w-cards-sub',
                                    style: { 
                                        padding: '10px', 
                                        backgroundColor: '#e3f2fd', 
                                        borderRadius: '8px', 
                                        marginBottom: '8px',
                                        minHeight: '60px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center'
                                    }
                                }, [
                                    React.createElement('strong', {key: 'w-label-sub', style: {color: '#1976d2'}}, '🔧 W Cards (Work): '),
                                    React.createElement('span', {key: 'w-text-sub'}, rulesData.subsequent.w_card)
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.b_card ? React.createElement('div', {
                                    key: 'b-cards-sub',
                                    style: { padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'b-label-sub', style: {color: '#388e3c'}}, '💼 B Cards (Bank): '),
                                    React.createElement('span', {key: 'b-text-sub'}, rulesData.subsequent.b_card)
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.i_card ? React.createElement('div', {
                                    key: 'i-cards-sub',
                                    style: { padding: '10px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'i-label-sub', style: {color: '#f57c00'}}, '🔍 I Cards (Investor): '),
                                    React.createElement('span', {key: 'i-text-sub'}, rulesData.subsequent.i_card)
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.l_card ? React.createElement('div', {
                                    key: 'l-cards-sub',
                                    style: { padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'l-label-sub', style: {color: '#d32f2f'}}, '⚖️ L Cards (Life): '),
                                    React.createElement('span', {key: 'l-text-sub'}, rulesData.subsequent.l_card)
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.e_card ? React.createElement('div', {
                                    key: 'e-cards-sub',
                                    style: { padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'e-label-sub', style: {color: '#7b1fa2'}}, '⚠️ E Cards (Expeditor): '),
                                    React.createElement('span', {key: 'e-text-sub'}, rulesData.subsequent.e_card)
                                ]) : null,
                                
                                // Add subsequent resources section
                                React.createElement('h4', {
                                    key: 'subsequent-resources-title',
                                    style: {
                                        color: 'var(--secondary-color)',
                                        margin: '20px 0 15px 0',
                                        fontSize: '18px',
                                        borderBottom: '2px solid var(--secondary-color)',
                                        paddingBottom: '8px'
                                    }
                                }, '💰 Resources Strategy'),
                                
                                rulesData.subsequent && rulesData.subsequent.Time ? React.createElement('div', {
                                    key: 'time-sub',
                                    style: { padding: '10px', backgroundColor: '#fce4ec', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'time-label-sub', style: {color: '#c2185b'}}, '⏰ Time: '),
                                    React.createElement('span', {key: 'time-text-sub'}, rulesData.subsequent.Time)
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.Fee ? React.createElement('div', {
                                    key: 'fee-sub',
                                    style: { padding: '10px', backgroundColor: '#f1f8e9', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'fee-label-sub', style: {color: '#689f38'}}, '💰 Fees: '),
                                    React.createElement('span', {key: 'fee-text-sub'}, rulesData.subsequent.Fee)
                                ]) : null,
                                
                                rulesData.subsequent && (rulesData.subsequent.space_1 || rulesData.subsequent.space_2 || rulesData.subsequent.space_3) ? React.createElement('div', {
                                    key: 'paths-sub',
                                    style: { padding: '10px', backgroundColor: '#e8eaf6', borderRadius: '8px', marginBottom: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'paths-label-sub', style: {color: '#5e35b1'}}, '🛤️ Paths: '),
                                    React.createElement('span', {key: 'paths-text-sub'}, [rulesData.subsequent.space_1, rulesData.subsequent.space_2, rulesData.subsequent.space_3, rulesData.subsequent.space_4, rulesData.subsequent.space_5].filter(Boolean).join(', ') || 'Strategic path planning')
                                ]) : null,
                                
                                rulesData.subsequent && rulesData.subsequent.Negotiate ? React.createElement('div', {
                                    key: 'negotiate-sub',
                                    style: { padding: '10px', backgroundColor: '#e0f2f1', borderRadius: '8px' }
                                }, [
                                    React.createElement('strong', {key: 'negotiate-label-sub', style: {color: '#00695c'}}, '🤝 Negotiate: '),
                                    React.createElement('span', {key: 'negotiate-text-sub'}, rulesData.subsequent.Negotiate)
                                ]) : null
                            ])
                        ])
                    ];
                })())
            ])
        ])
    ]);
}

window.ActionPanel = ActionPanel;
