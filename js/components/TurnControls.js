/**
 * TurnControls - Turn management and validation interface
 * Handles end turn, negotiate, action counting, and turn validation
 */

function TurnControls({ 
    currentPlayer,
    gameStateManager,
    canEndTurn,
    completedActions,
    requiredActions,
    diceRequired,
    hasRolled,
    selectedMove,
    availableCardActions,
    originalCardActionCount,
    availableMoves,
    onTurnControlsStateChange,
    onShowRulesModal,
    debugMode = false
}) {
    const { useState, useEffect } = React;
    
    // Get singleton MovementEngine instance for visit type determination
    const [movementEngine] = useState(() => {
        const engine = window.MovementEngine.getInstance();
        engine.initialize(gameStateManager);
        return engine;
    });

    // Listen for turn started events to reset state
    useEventListener('turnStarted', ({ player, turnNumber }) => {
        if (player.id === currentPlayer?.id && onTurnControlsStateChange) {
            onTurnControlsStateChange({
                turnPhase: 'MOVING',
                actionsCompleted: [],
                hasMoved: false,
                canEndTurn: false
            });
        }
    });

    // Listen for space action completed events
    useEventListener('spaceActionCompleted', ({ playerId }) => {
        if (playerId === currentPlayer?.id) {
            if (onTurnControlsStateChange) {
                onTurnControlsStateChange({
                    actionsCompleted: ['space_action'] // Add to existing array
                });
            }
            setTimeout(() => checkCanEndTurn(), 100);
        }
    });

    // Check if turn can end based on completed actions
    const checkCanEndTurn = () => {
        if (!currentPlayer) return;

        // Calculate required vs completed actions
        let requiredActionsCount = 0;
        let completedActionsCount = 0;

        // Count required actions
        if (diceRequired) requiredActionsCount++;
        if (originalCardActionCount > 0) requiredActionsCount++; // Card actions count as 1 total action
        if (availableMoves && availableMoves.length > 0) requiredActionsCount++; // Movement selection

        // Count completed actions
        if (diceRequired && hasRolled) completedActionsCount++;
        
        // Card actions completed - any card action counts as 1 completed action
        const cardActionsCompleted = originalCardActionCount - (availableCardActions ? availableCardActions.length : 0);
        if (cardActionsCompleted > 0) completedActionsCount++; // Any card action completion counts as 1
        
        if (selectedMove) completedActionsCount++; // Movement selected

        const canEnd = completedActionsCount >= requiredActionsCount;

        if (onTurnControlsStateChange) {
            onTurnControlsStateChange({
                requiredActions: requiredActionsCount,
                completedActions: completedActionsCount,
                canEndTurn: canEnd
            });
        }

        console.log(`TurnControls: Actions ${completedActionsCount}/${requiredActionsCount}, canEndTurn: ${canEnd}`);
    };

    // Check if negotiate button should be enabled
    const checkNegotiateEnabled = () => {
        if (!currentPlayer || !window.CSVDatabase || !window.CSVDatabase.loaded) return false;

        const currentSpaceData = window.CSVDatabase.spaceContent.find(
            currentPlayer.position, 
            currentPlayer.visitType || 'First'
        );

        if (!currentSpaceData) return false;

        // Negotiate is enabled if space has immediate time data
        // It's disabled if time is determined by choice, roll, or drawing cards
        const hasImmediateTime = currentSpaceData.Time && 
                                currentSpaceData.Time !== '' && 
                                !currentSpaceData.Time.includes('roll') &&
                                !currentSpaceData.Time.includes('choice') &&
                                !currentSpaceData.Time.includes('draw');

        return hasImmediateTime;
    };

    // Handle negotiate action
    const handleNegotiate = () => {
        if (!currentPlayer) return;

        console.log('TurnControls: Negotiating - applying time penalty and clearing state');

        // Apply -1 day time penalty for negotiating
        gameStateManager.emit('timeChanged', {
            playerId: currentPlayer.id,
            amount: -1,
            source: 'negotiation'
        });

        // Show message about negotiation
        gameStateManager.emit('showMessage', {
            type: 'info',
            message: 'Negotiation Used',
            description: 'Time penalty applied (-1 day). All selections cleared.'
        });

        console.log('TurnControls: Restored player state with time penalty');

        // Reset all turn state
        if (onTurnControlsStateChange) {
            onTurnControlsStateChange({
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
            });
        }

        console.log('TurnControls: Reset turn state, ending turn');

        // End the turn after negotiating
        setTimeout(() => {
            gameStateManager.emit('turnEnded', {
                playerId: currentPlayer.id,
                source: 'negotiation'
            });
            console.log('TurnControls: Turn ended after negotiation');
        }, 500); // Small delay to ensure state is cleared first
    };

    // Handle end turn action
    const handleEndTurn = () => {
        if (!currentPlayer) return;

        // Check if current space requires a decision
        if (window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaceContent.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData && currentSpaceData.Space_Type === 'Logic') {
                const spaceName = currentSpaceData.Space_Name || currentPlayer.position;
                if (!currentPlayer.lastDecision || currentPlayer.lastDecision.space !== spaceName) {
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
        
        // Execute selected move if one is selected
        if (selectedMove) {
            console.log(`TurnControls: Executing selected move to ${selectedMove}`);
            
            // Determine correct visit type using MovementEngine
            const visitType = movementEngine.getVisitType(currentPlayer, selectedMove);
            console.log(`TurnControls: Visit type for ${selectedMove}: ${visitType}`);
            
            // Execute the move
            gameStateManager.emit('movePlayerRequest', {
                playerId: currentPlayer.id,
                spaceName: selectedMove,
                visitType: visitType
            });

            // Emit player moved event for turn tracking
            gameStateManager.emit('playerMoved', {
                playerId: currentPlayer.id,
                fromSpace: currentPlayer.position,
                toSpace: selectedMove
            });
        }
        
        gameStateManager.emit('turnEnded', {
            playerId: currentPlayer.id
        });

        // Reset turn-specific state
        if (onTurnControlsStateChange) {
            onTurnControlsStateChange({
                selectedMove: null,
                showMoveDetails: false,
                diceRequired: false,
                hasRolled: false,
                pendingAction: null
            });
        }
    };

    // Update turn validation when props change
    useEffect(() => {
        checkCanEndTurn();
    }, [diceRequired, hasRolled, selectedMove, availableCardActions, originalCardActionCount, availableMoves]);

    if (!currentPlayer) {
        return null;
    }

    return React.createElement('div', {
        key: 'turn-controls',
        className: 'turn-controls'
    }, [
        React.createElement('h4', {
            key: 'controls-title',
            className: 'section-title'
        }, '🎮 Turn Controls'),

        // Action Progress Display
        React.createElement('div', {
            key: 'action-progress',
            className: 'action-progress'
        }, [
            React.createElement('div', {
                key: 'progress-text',
                className: 'progress-text'
            }, `Actions: ${completedActions}/${requiredActions}`)
        ]),

        // Control Buttons
        React.createElement('div', {
            key: 'control-buttons',
            className: 'control-buttons'
        }, [
            React.createElement('button', {
                key: 'end-turn',
                className: `btn ${canEndTurn ? 'btn--success' : 'btn--secondary is-disabled'} btn--full end-turn-button`,
                onClick: handleEndTurn,
                disabled: !canEndTurn,
                title: canEndTurn ? 'End your turn' : `Complete ${requiredActions - completedActions} more action(s) to end turn`
            }, `End Turn (${completedActions}/${requiredActions})`),

            React.createElement('button', {
                key: 'negotiate',
                className: `btn btn--warning btn--full negotiate-button ${!checkNegotiateEnabled() ? 'is-disabled' : ''}`,
                onClick: checkNegotiateEnabled() ? handleNegotiate : undefined,
                disabled: !checkNegotiateEnabled(),
                title: checkNegotiateEnabled() ? 
                    'Clear all selections and end turn (applies -1 day penalty)' : 
                    'Negotiate unavailable - time determined by roll/choice/cards'
            }, 'Negotiate'),

            React.createElement('button', {
                key: 'view-rules',
                className: 'btn btn--ghost btn--full view-rules-button',
                onClick: onShowRulesModal,
                title: 'View game rules and help'
            }, 'View Rules')
        ]),

        // Debug Information (only show in debug mode)
        debugMode && React.createElement('div', {
            key: 'debug-info',
            className: 'debug-info'
        }, [
            React.createElement('h5', {
                key: 'debug-title',
                className: 'debug-title'
            }, 'Debug - Turn State'),
            React.createElement('div', {
                key: 'debug-content',
                className: 'debug-content'
            }, [
                React.createElement('div', { key: 'dice' }, `Dice Required: ${diceRequired}, Has Rolled: ${hasRolled}`),
                React.createElement('div', { key: 'cards' }, `Card Actions: ${originalCardActionCount - (availableCardActions ? availableCardActions.length : 0)}/${originalCardActionCount}`),
                React.createElement('div', { key: 'movement' }, `Selected Move: ${selectedMove || 'None'}`),
                React.createElement('div', { key: 'can-end' }, `Can End Turn: ${canEndTurn}`)
            ])
        ])
    ]);
}

// Make component available globally
window.TurnControls = TurnControls;