/**
 * WinConditionManager Component - Handle game completion and scoring
 * Detects when players reach FINISH and calculates final scores
 * Updated for React state compatibility (Phase 2 reconnection)
 */

function WinConditionManager({ gameState, gameStateManager, onGameStateUpdate }) {
    // Use props instead of problematic useGameState hook

    // Listen for player movements to check win conditions
    useEventListener('playerMoved', ({ player, playerId, newSpace, toSpace }) => {
        // Handle both event formats: some emit player object, some emit playerId
        const targetPlayer = player || (playerId && gameState.players?.find(p => p.id === playerId));
        const targetSpace = newSpace || toSpace;
        if (targetPlayer && targetSpace) {
            checkWinCondition(targetPlayer, targetSpace);
        }
    });

    // Check if player has won the game
    const checkWinCondition = (player, spaceName) => {
        if (spaceName === 'FINISH') {
            handleGameWin(player);
        }
    };

    // Handle game completion
    const handleGameWin = (winner) => {
        // Calculate final scores for all players
        const finalScores = calculateFinalScores();
        
        // Mark game as completed using React state update
        const gameCompletionData = {
            gameStatus: 'completed',
            winner: winner,
            finalScores: finalScores,
            completedAt: new Date()
        };
        
        if (onGameStateUpdate) {
            onGameStateUpdate(prevState => ({
                ...prevState,
                ...gameCompletionData
            }));
        }

        // Also update GameStateManager for component compatibility
        if (gameStateManager) {
            gameStateManager.setState(gameCompletionData);
            gameStateManager.emit('gameCompleted', {
                winner,
                finalScores,
                completedAt: new Date()
            });
        }
    };

    // Calculate final scores based on time and money
    const calculateFinalScores = () => {
        return gameState.players.map(player => {
            // Score formula: Money remaining - Time penalty
            // Lower time spent = higher score
            const timeSpent = player.timeSpent || 0;
            const moneyRemaining = player.money || 0;
            
            // Time penalty: each day costs 100 points
            const timePenalty = timeSpent * 100;
            const finalScore = Math.max(0, moneyRemaining - timePenalty);

            return {
                playerId: player.id,
                playerName: player.name,
                timeSpent,
                moneyRemaining,
                timePenalty,
                finalScore,
                position: player.position
            };
        }).sort((a, b) => b.finalScore - a.finalScore); // Sort by highest score
    };

    // Check if game should end due to time limit or other conditions
    const checkGameEndConditions = () => {
        const maxTimeLimit = 365; // 1 year limit
        
        // Check if any player exceeded time limit
        const playerOverTime = gameState.players?.find(p => p.timeSpent > maxTimeLimit);
        if (playerOverTime && gameStateManager) {
            gameStateManager.emit('gameTimeout', {
                player: playerOverTime,
                timeLimit: maxTimeLimit
            });
        }
    };

    // Monitor time changes to check for game end conditions
    useEventListener('playerTimeChanged', ({ player }) => {
        checkGameEndConditions();
    });

    // This is a logic-only component
    return null;
}

// Export component globally for integration
window.WinConditionManager = WinConditionManager;