/**
 * TurnControls - Pure presentation component for turn management
 * Displays turn state from GameStateManager and handles turn actions
 */

function TurnControls({ 
    currentPlayer,
    gameStateManager,
    onShowRulesModal,
    debugMode = false
}) {
    const { useState } = React;
    
    // Get game state directly from GameStateManager
    const [gameState] = window.useGameState();
    const { currentTurn } = gameState;
    
    // Get singleton MovementEngine instance for turn actions
    const [movementEngine] = useState(() => {
        const engine = window.MovementEngine.getInstance();
        engine.initialize(gameStateManager);
        return engine;
    });

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

        // For dice-based time effects, check if dice action was completed
        if (useDice || timeValue === 'dice') {
            const diceCompleted = currentTurn.requiredActions.some(action => 
                action.type === 'dice' && action.completed
            );
            if (diceCompleted) {
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
        if (!currentPlayer) {
            console.error('TurnControls: No current player found for negotiation');
            return;
        }

        // Restore player state to space entry snapshot and apply time penalty
        if (currentPlayer.spaceEntrySnapshot) {
            // Has snapshot - restore state with penalty
            gameStateManager.restorePlayerSnapshot(currentPlayer.id);
        } else {
            // No snapshot (first space) - just apply time penalty
            
            // Get time penalty from space effects
            const timeEffects = window.CSVDatabase.spaceEffects.query({
                space_name: currentPlayer.position,
                visit_type: currentPlayer.visitType || 'First',
                effect_type: 'time'
            });
            
            const timePenalty = timeEffects.length > 0 ? parseInt(timeEffects[0].effect_value) || 1 : 1;
            
            gameStateManager.emit('timeChanged', {
                playerId: currentPlayer.id,
                amount: timePenalty,
                source: 'negotiation_penalty'
            });
        }

        // Show message about negotiation
        gameStateManager.emit('showMessage', {
            type: 'info',
            message: 'Negotiation Used',
            description: 'Player state restored to space entry. Time penalty applied.'
        });

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
        }, 100);
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
        
        // AUTOMATIC MOVEMENT: Execute movement automatically when ending turn
        try {
            // Get available moves using MovementEngine
            const availableMoves = movementEngine.getAvailableMoves(currentPlayer);
            if (availableMoves && availableMoves.length > 0) {
                // Select the first available move (most spaces have only one destination)
                const selectedMove = availableMoves[0];
                const visitType = movementEngine.getVisitType(currentPlayer, selectedMove);
                
                // Execute the move directly through GameStateManager BEFORE ending turn
                const allMessages = gameStateManager.movePlayerWithEffects(
                    currentPlayer.id, 
                    selectedMove, 
                    visitType
                );
                
                // Emit standardized player action taken event
                gameStateManager.emit('playerActionTaken', {
                    playerId: currentPlayer.id,
                    actionType: 'movement',
                    actionData: {
                        destination: selectedMove,
                        visitType: visitType,
                        movementMessages: allMessages
                    },
                    timestamp: Date.now(),
                    spaceName: currentPlayer.position,
                    visitType: currentPlayer.visitType || 'First'
                });
                
                // Allow a brief moment for visual updates to complete before ending turn
                setTimeout(() => {
                    gameStateManager.emit('turnEnded', {
                        playerId: currentPlayer.id
                    });
                }, 50); // Small delay to ensure movement visual update completes
                
                return; // Exit early since turn end is handled in setTimeout
            }
        } catch (error) {
            console.error('Error executing automatic movement:', error);
            gameStateManager.handleError(error, 'Automatic Movement from TurnControls');
            // Continue to end turn even if movement fails
        }
        
        // Only reach here if no movement was required
        gameStateManager.emit('turnEnded', {
            playerId: currentPlayer.id
        });
    };

    if (!currentPlayer) {
        return null;
    }

    // Extract current turn data with safe defaults
    const actionCounts = currentTurn?.actionCounts || { required: 0, completed: 0 };
    const canEndTurn = currentTurn?.canEndTurn || false;

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
            }, `Actions: ${actionCounts.completed}/${actionCounts.required}`)
        ]),

        // Control Buttons
        React.createElement('div', {
            key: 'control-buttons',
            className: 'control-buttons',
            style: {
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'center'
            }
        }, [
            React.createElement('button', {
                key: 'end-turn',
                className: `btn ${canEndTurn ? 'btn--success' : 'btn--secondary is-disabled'} end-turn-button`,
                onClick: handleEndTurn,
                disabled: !canEndTurn,
                title: canEndTurn ? 'End your turn' : `Complete ${actionCounts.required - actionCounts.completed} more action(s) to end turn`
            }, `End Turn (${actionCounts.completed}/${actionCounts.required})`),

            React.createElement('button', {
                key: 'negotiate',
                className: `btn btn--warning negotiate-button ${!checkNegotiateEnabled() ? 'is-disabled' : ''}`,
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
                className: 'btn btn--ghost view-rules-button',
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
                React.createElement('div', { key: 'actions' }, `Actions: ${actionCounts.completed}/${actionCounts.required}`),
                React.createElement('div', { key: 'can-end' }, `Can End Turn: ${canEndTurn}`),
                React.createElement('div', { key: 'turn-phase' }, `Turn Phase: ${currentTurn?.phase || 'Unknown'}`),
                React.createElement('div', { key: 'required-actions' }, `Required Actions: ${JSON.stringify(currentTurn?.requiredActions || [])}`)
            ])
        ])
    ]);
}

// Make component available globally
window.TurnControls = TurnControls;