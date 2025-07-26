/**
 * GameInitializer - Game Initialization and Setup Logic
 * Handles MovementEngine setup and initialization tasks
 * Extracted from GameManager to reduce component size
 */

function GameInitializer() {
    const [gameState, gameStateManager] = useGameState();
    
    // Get singleton MovementEngine instance and initialize it
    const [movementEngine] = React.useState(() => {
        const engine = window.MovementEngine.getInstance();
        engine.initialize(gameStateManager);
        return engine;
    });
    
    // Handle player movement with MovementEngine integration
    useEventListener('movePlayerRequest', ({ playerId, spaceName, visitType }) => {
        try {
            // Check if CSVDatabase is loaded before accessing it
            if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
                throw new Error('CSVDatabase not loaded yet');
            }
            
            // Validate the space exists
            const spaceData = window.CSVDatabase.spaceContent.find(spaceName, visitType);
            if (!spaceData) {
                throw new Error(`Space ${spaceName}/${visitType} not found in CSV data`);
            }
            
            // Move player
            gameStateManager.movePlayer(playerId, spaceName, visitType);
            
            // Save snapshot AFTER movement but BEFORE space effects
            // This captures clean state when entering the space
            gameStateManager.savePlayerSnapshot(playerId);
            
            // Get player object for MovementEngine
            const player = gameState.players.find(p => p.id === playerId);
            if (player && movementEngine) {
                // Use MovementEngine for advanced space effect processing
                const currentSpaceData = movementEngine.getSpaceData(spaceName, visitType || 'First');
                if (currentSpaceData) {
                    movementEngine.applySpaceEffects(player, currentSpaceData, visitType || 'First');
                }
            } else {
                // Emit fallback event for GameManager to handle
                gameStateManager.emit('processSpaceEffectsFallback', { playerId, spaceData });
            }
            
        } catch (error) {
            gameStateManager.handleError(error, 'Player Movement');
        }
    });
    
    // Handle dice roll outcomes
    useEventListener('diceRollComplete', ({ playerId, spaceName, visitType, rollValue }) => {
        try {
            const diceConfig = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
            if (diceConfig) {
                // Get the destination space for the specific dice roll
                const destination = diceConfig[`roll_${rollValue}`];
                if (destination) {
                    // Move player to the destination space
                    gameStateManager.emit('movePlayerToSpace', { playerId, destination, visitType: 'First' });
                }
            }
        } catch (error) {
            gameStateManager.handleError(error, 'Dice Roll');
        }
    });
    
    // Handle space re-entry (for rediscovering actions after negotiation)
    useEventListener('spaceReentry', ({ playerId, spaceName, visitType }) => {
        try {
            
            // Check if CSVDatabase is loaded before accessing it
            if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
                console.error('GameInitializer: CSVDatabase not loaded for space re-entry');
                return;
            }
            
            // Get space data and emit for GameManager to re-process space effects
            const spaceData = window.CSVDatabase.spaceContent.find(spaceName, visitType);
            if (spaceData) {
                gameStateManager.emit('processSpaceEffectsFallback', { playerId, spaceData });
            } else {
                console.error(`GameInitializer: Space data not found for ${spaceName}/${visitType}`);
            }
        } catch (error) {
            console.error('GameInitializer: Error in spaceReentry handler:', error);
            gameStateManager.handleError(error, 'Space Re-entry');
        }
    });
    
    /**
     * Show movement options from space data
     */
    function showMovementOptions(playerId, spaceData) {
        const nextSpaces = ComponentUtils.getNextSpaces(spaceData.space_name, spaceData.visit_type || 'First');
        
        if (nextSpaces.length === 0) {
            // No movement options - end turn
            gameStateManager.emit('noMovementOptions', { playerId, spaceData });
        } else {
            // Let player choose their next move regardless of number of options
            // This prevents auto-movement and gives player control
            gameStateManager.emit('availableMovesUpdated', {
                playerId,
                availableMoves: nextSpaces,
                spaceData
            });
        }
    }
    
    // Expose the movement options function for other components
    React.useEffect(() => {
        window.GameInitializer = {
            showMovementOptions
        };
    }, []);
    
    // GameInitializer is a logic-only component - no render
    return null;
}

// Export component
window.GameInitializer = GameInitializer;