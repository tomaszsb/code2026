/**
 * TurnManager Component - Complete turn flow control and validation
 * Manages turn phases, automatic progression, and action validation
 */

function TurnManager() {
    const { useState, useEffect, useCallback } = React;
    const [gameState, gameStateManager] = useGameState();
    const [turnState, setTurnState] = useState({
        phase: 'WAITING', // WAITING, MOVING, ACTING, ENDING
        actionsCompleted: [],
        turnStartTime: null
    });


    // Initialize turn when game starts
    useEffect(() => {
        // Check if game has players and no turn has started yet
        if (gameState.players && gameState.players.length > 0 && 
            gameState.gamePhase !== 'SETUP' && 
            turnState.phase === 'WAITING') {
            gameStateManager.startTurn(0);
        }
    }, [gameState.players, gameState.gamePhase, turnState.phase]);

    // Handle turn started (from GameStateManager)
    useEventListener('turnStarted', ({ player, turnCount, fromNegotiation }) => {
        setTurnState({
            phase: 'MOVING',
            actionsCompleted: [],
            turnStartTime: Date.now()
        });
        
        // Only re-trigger space effects after negotiation, not normal turn progression
        if (fromNegotiation && player && player.position) {
            console.log(`TurnManager: Re-triggering space effects for ${player.position} after negotiation`);
            
            setTimeout(() => {
                // Emit a space re-entry event to trigger action discovery
                gameStateManager.emit('spaceReentry', {
                    playerId: player.id,
                    spaceName: player.position,
                    visitType: player.visitType || 'First'
                });
            }, 100);
        }
    });

    // Handle player movement completion
    useEventListener('playerMoved', ({ player, playerId, newSpace, toSpace }) => {
        // Handle both event formats: some emit player object, some emit playerId
        const targetPlayer = player || (playerId && gameState.players?.find(p => p.id === playerId));
        const targetSpace = newSpace || toSpace;
        if (targetPlayer && targetSpace) {
            handleMovementComplete(targetPlayer, targetSpace);
        }
    });

    // Handle space action completion
    useEventListener('spaceActionCompleted', ({ player, spaceName }) => {
        handleActionComplete(player, spaceName);
    });

    // Handle dice roll completion
    useEventListener('diceRollCompleted', ({ player, outcome }) => {
        markActionCompleted('dice_roll');
        checkTurnCompletion();
    });

    // Handle card action completion
    useEventListener('cardActionCompleted', ({ player, cardType }) => {
        markActionCompleted('card_action');
        checkTurnCompletion();
    });

    // Handle manual turn end (from negotiate or end turn button)
    useEventListener('turnEnded', ({ playerId, reason, source }) => {
        const isFromNegotiation = source === 'negotiation';
        endCurrentTurn(isFromNegotiation);
    });


    // Handle movement completion and determine next actions
    const handleMovementComplete = (player, spaceName) => {
        setTurnState(prev => ({
            ...prev,
            phase: 'ACTING'
        }));

        // GameManager will handle space effects automatically
        // Just check if turn can complete
        setTimeout(() => {
            checkTurnCompletion();
        }, 500);
    };


    // Mark an action as completed
    const markActionCompleted = useCallback((actionType) => {
        setTurnState(prev => ({
            ...prev,
            actionsCompleted: [...prev.actionsCompleted, actionType]
        }));
    }, []);

    // Handle completion of space actions
    const handleActionComplete = (player, spaceName) => {
        markActionCompleted('space_action');
        checkTurnCompletion();
    };

    // Check if turn is complete and can advance
    const checkTurnCompletion = () => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;

        // Check if all required actions are completed
        // Players must manually end their turn - no auto-advance
        setTurnState(prev => ({
            ...prev,
            phase: 'ACTING'  // Keep in acting phase, don't auto-end
        }));

        // Removed auto-advance - players control when turn ends
    };

    // End current player's turn
    const endCurrentTurn = (fromNegotiation = false) => {
        const currentPlayer = getCurrentPlayer();
        
        if (!currentPlayer) {
            return;
        }

        // Don't emit turnEnded here - we're responding TO a turnEnded event
        // Just advance to next player
        advanceToNextPlayer(fromNegotiation);
    };

    // Advance to next player's turn
    const advanceToNextPlayer = (fromNegotiation = false) => {
        // Get fresh state directly from GameStateManager to avoid stale state
        const freshState = gameStateManager.getState();
        
        const players = freshState.players;
        if (!players || players.length === 0) {
            return;
        }

        const nextPlayerIndex = (freshState.currentPlayer + 1) % players.length;

        // Use GameStateManager's startTurn method which properly handles state updates
        setTimeout(() => {
            gameStateManager.startTurn(nextPlayerIndex, fromNegotiation);
        }, 500);
    };

    // Get current player object
    const getCurrentPlayer = useCallback(() => {
        // Get fresh state directly from GameStateManager to avoid stale state
        const freshState = gameStateManager.getState();
        
        if (!freshState.players || freshState.players.length === 0) {
            return null;
        }
        
        return freshState.players[freshState.currentPlayer];
    }, [gameStateManager]);

    // Validate if action is allowed
    const validateAction = (playerId, actionType) => {
        const currentPlayer = getCurrentPlayer();
        
        // Only current player can act
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return false;
        }

        // Check turn phase
        if (turnState.phase === 'WAITING') {
            return false;
        }

        return true;
    };

    // Listen for action attempts and validate
    useEventListener('actionAttempted', ({ playerId, actionType }) => {
        if (!validateAction(playerId, actionType)) {
            gameStateManager.emit('actionDenied', {
                playerId,
                reason: 'Not your turn or invalid action'
            });
        }
    });

    // Force end turn (for skip functionality)
    const forceEndTurn = () => {
        endCurrentTurn();
    };

    // Expose turn management functions
    useEffect(() => {
        gameStateManager.turnManager = {
            forceEndTurn,
            validateAction,
            getTurnState: () => turnState
        };
    }, [turnState]);

    // This is a logic-only component
    return null;
}