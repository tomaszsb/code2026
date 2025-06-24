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
            if (prev.originalCardActionCount > 0) requiredActions++; // Card actions count as 1 total action
            if (prev.availableMoves.length > 0) requiredActions++; // Movement selection
            
            // Count completed actions
            if (prev.diceRequired && prev.hasRolled) completedActions++;
            if (prev.selectedMove) completedActions++; // Movement selected
            
            // Card actions completed - any card action counts as 1 completed action
            const cardActionsCompleted = prev.originalCardActionCount - prev.availableCardActions.length;
            if (cardActionsCompleted > 0) completedActions++; // Any card action completion counts as 1
            
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
                actionState.availableCardActions.filter((cardAction) => {
                    // Smart filtering for OWNER-FUND-INITIATION space
                    if (currentPlayer && currentPlayer.position === 'OWNER-FUND-INITIATION') {
                        const scopeCost = currentPlayer.scopeTotalCost || 0;
                        const fourMillion = 4000000; // $4M threshold
                        
                        // Bank card: only show if scope ≤ $4M
                        if (cardAction.type === 'B' && scopeCost > fourMillion) {
                            return false;
                        }
                        
                        // Investor card: only show if scope > $4M
                        if (cardAction.type === 'I' && scopeCost <= fourMillion) {
                            return false;
                        }
                    }
                    
                    return true; // Show all other cards normally
                }).map((cardAction, index) => {
                    const cardTypeName = window.CardUtils.getCardTypeConfig(cardAction.type).name;
                    
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
        React.createElement(window.RulesModal, {
            show: actionState.showRulesModal,
            onClose: hideRulesModal
        })
    ]);
}

window.ActionPanel = ActionPanel;
