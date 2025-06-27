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
        if (availableMoves && availableMoves.length > 1) requiredActionsCount++; // Only count movement if multiple choices

        // Count completed actions
        if (diceRequired && hasRolled) completedActionsCount++;
        
        // Card actions completed - any card action counts as 1 completed action
        const cardActionsCompleted = originalCardActionCount - (availableCardActions ? availableCardActions.length : 0);
        if (cardActionsCompleted > 0) completedActionsCount++; // Any card action completion counts as 1
        
        if (selectedMove && availableMoves && availableMoves.length > 1) completedActionsCount++; // Only count movement if choice was required

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

    // Check if negotiate button should be enabled and get reason if disabled
    const getNegotiateStatus = () => {
        if (!currentPlayer) return { enabled: false, reason: 'No current player' };
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return { enabled: false, reason: 'Database not loaded' };

        // Check space content for negotiation permission
        const currentSpaceData = window.CSVDatabase.spaceContent.find(
            currentPlayer.position, 
            currentPlayer.visitType || 'First'
        );

        if (!currentSpaceData) return { enabled: false, reason: `Space data not found for ${currentPlayer.position}` };

        // Check if space allows negotiation
        if (currentSpaceData.can_negotiate === 'No') {
            return { enabled: false, reason: 'Space does not allow negotiation' };
        }

        // Get time effects from SPACE_EFFECTS.csv
        const timeEffects = window.CSVDatabase.spaceEffects.query({
            space_name: currentPlayer.position,
            visit_type: currentPlayer.visitType || 'First',
            effect_type: 'time'
        });

        if (!timeEffects || timeEffects.length === 0) {
            return { enabled: false, reason: 'No time effects found' };
        }

        const timeEffect = timeEffects[0];
        const timeValue = timeEffect.effect_value;
        const useDice = timeEffect.use_dice === 'true';

        // If time is fixed (not dice-based), always enable
        if (!useDice && timeValue && timeValue !== 'dice') {
            return { enabled: true, reason: `Fixed time: ${timeValue} days` };
        }

        // If time depends on dice roll, enable after dice rolled
        if (useDice || timeValue === 'dice') {
            if (hasRolled) {
                return { enabled: true, reason: `Dice rolled, time determined` };
            } else {
                return { enabled: false, reason: `Waiting for dice roll to determine time` };
            }
        }

        return { enabled: false, reason: `Unknown time format: ${timeValue}` };
    };

    // Legacy function for compatibility
    const checkNegotiateEnabled = () => {
        return getNegotiateStatus().enabled;
    };

    // Handle negotiate action
    const handleNegotiate = () => {
        console.log('TurnControls: Negotiate button clicked');
        
        if (!currentPlayer) {
            console.error('TurnControls: No current player found for negotiation');
            return;
        }

        console.log('TurnControls: Applying negotiation - restoring state and time penalty');

        // Restore player state to space entry snapshot and apply time penalty
        if (currentPlayer.spaceEntrySnapshot) {
            // Has snapshot - restore state with penalty
            gameStateManager.restorePlayerSnapshot(currentPlayer.id);
        } else {
            // No snapshot (first space) - just apply time penalty
            console.log('TurnControls: No snapshot found, applying direct time penalty for first space');
            
            // Get time penalty from space effects
            const timeEffects = window.CSVDatabase.spaceEffects.query({
                space_name: currentPlayer.position,
                visit_type: currentPlayer.visitType || 'First',
                effect_type: 'time'
            });
            
            const timePenalty = timeEffects.length > 0 ? parseInt(timeEffects[0].effect_value) || 1 : 1;
            
            console.log(`TurnControls: Applying ${timePenalty} day time penalty for negotiation`);
            
            gameStateManager.emit('timeChanged', {
                playerId: currentPlayer.id,
                amount: timePenalty,
                source: 'negotiation_penalty'
            });
            
            console.log(`TurnControls: Applied ${timePenalty} time penalty for negotiation on first space`);
        }
        
        console.log('TurnControls: Current player after negotiation:', {
            timeSpent: currentPlayer.timeSpent
        });

        // Show message about negotiation
        gameStateManager.emit('showMessage', {
            type: 'info',
            message: 'Negotiation Used',
            description: 'Player state restored to space entry. Time penalty applied.'
        });

        console.log('TurnControls: Player state restored with time penalty');

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

        console.log('TurnControls: Reset turn state, triggering immediate action rediscovery');

        // Immediately trigger action rediscovery before ending turn
        setTimeout(() => {
            // Trigger spaceReentry immediately to rediscover actions
            gameStateManager.emit('spaceReentry', {
                playerId: currentPlayer.id,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
            
            // Then end the turn
            gameStateManager.emit('turnEnded', {
                playerId: currentPlayer.id,
                source: 'negotiation'
            });
            console.log('TurnControls: Turn ended after negotiation with immediate action rediscovery');
        }, 100); // Reduced delay and immediate action rediscovery
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
            console.log('TurnControls: Current player:', currentPlayer);
            
            // Determine correct visit type using MovementEngine
            const visitType = movementEngine.getVisitType(currentPlayer, selectedMove);
            console.log(`TurnControls: Visit type for ${selectedMove}: ${visitType}`);
            
            // Execute the move (GameManager will handle position update and emit playerMoved)
            gameStateManager.emit('movePlayerRequest', {
                playerId: currentPlayer.id,
                spaceName: selectedMove,
                visitType: visitType
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
                title: (() => {
                    const status = getNegotiateStatus();
                    return status.enabled ? 
                        'Clear all selections and end turn (applies -1 day penalty)' : 
                        `Negotiate unavailable: ${status.reason}`;
                })()
            }, debugMode ? 
                (() => {
                    const status = getNegotiateStatus();
                    return status.enabled ? 'Negotiate' : `Negotiate (${status.reason})`;
                })() : 
                'Negotiate'),

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