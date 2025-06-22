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
    useEventListener('gameStarted', () => {
        startPlayerTurn();
    });

    // Handle player movement completion
    useEventListener('playerMoved', ({ player, newSpace }) => {
        handleMovementComplete(player, newSpace);
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

    // Start a player's turn
    const startPlayerTurn = () => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;

        setTurnState({
            phase: 'MOVING',
            actionsCompleted: [],
            turnStartTime: Date.now()
        });

        gameStateManager.emit('turnStarted', {
            player: currentPlayer,
            turnNumber: gameState.turnCount + 1
        });
    };

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
        // For now, allow manual turn ending
        setTurnState(prev => ({
            ...prev,
            phase: 'ENDING'
        }));

        // Auto-advance turn after a short delay
        setTimeout(() => {
            endCurrentTurn();
        }, 1000);
    };

    // End current player's turn
    const endCurrentTurn = () => {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;

        // Calculate turn duration
        const turnDuration = turnState.turnStartTime ? 
            Date.now() - turnState.turnStartTime : 0;

        gameStateManager.emit('turnEnded', {
            player: currentPlayer,
            duration: turnDuration,
            actionsCompleted: turnState.actionsCompleted
        });

        // Advance to next player
        advanceToNextPlayer();
    };

    // Advance to next player's turn
    const advanceToNextPlayer = () => {
        const players = gameState.players;
        if (!players || players.length === 0) return;

        const nextPlayerIndex = (gameState.currentPlayer + 1) % players.length;
        const newTurnCount = nextPlayerIndex === 0 ? 
            gameState.turnCount + 1 : gameState.turnCount;

        gameStateManager.setState({
            currentPlayer: nextPlayerIndex,
            turnCount: newTurnCount
        });

        // Start next player's turn
        setTimeout(() => {
            startPlayerTurn();
        }, 500);
    };

    // Get current player object
    const getCurrentPlayer = useCallback(() => {
        if (!gameState.players || gameState.players.length === 0) return null;
        return gameState.players[gameState.currentPlayer];
    }, [gameState.players, gameState.currentPlayer]);

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