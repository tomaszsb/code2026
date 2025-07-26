/**
 * MovementSection - Movement selection and execution interface
 * Enhanced with MovementEngine for advanced movement logic
 * Handles move selection, validation, execution, and move details display
 */

function MovementSection({ 
    currentPlayer,
    gameStateManager,
    availableMoves,
    selectedMove,
    showMoveDetails,
    hasMoved,
    hasRolled,
    onMoveSelect,
    onMoveExecute,
    onMovementStateChange,
    onActionCompleted
}) {
    const { useState, useEffect } = React;
    const [movementEngine] = useState(() => {
        const engine = window.MovementEngine.getInstance();
        engine.initialize(gameStateManager);
        engine.enableDebug(); // Enable debug logging
        return engine;
    });

    // Calculate advanced moves when player or state changes
    useEffect(() => {
        if (currentPlayer && window.MovementEngine) {
            const advancedMoves = movementEngine.getAvailableMoves(currentPlayer);
            
            if (onMovementStateChange && advancedMoves.length > 0) {
                // Auto-select if there's only one move (no choice needed)
                if (advancedMoves.length === 1) {
                    onMovementStateChange({
                        availableMoves: advancedMoves,
                        selectedMove: advancedMoves[0],
                        showMoveSelection: false  // Don't show UI for single moves
                    });
                } else {
                    // Multiple moves - show selection UI
                    onMovementStateChange({
                        availableMoves: advancedMoves,
                        showMoveSelection: true
                    });
                }
            }
        }
    }, [currentPlayer?.position, currentPlayer?.id]);

    // Listen for available moves updates
    useEventListener('availableMovesUpdated', ({ availableMoves }) => {
        if (onMovementStateChange) {
            onMovementStateChange({
                availableMoves
            });
        }
    });

    // Listen for player movement completion
    useEventListener('playerMoved', ({ playerId }) => {
        if (playerId === currentPlayer?.id && onMovementStateChange) {
            onMovementStateChange({
                hasMoved: true,
                turnPhase: 'ACTING'
            });
            if (onActionCompleted) {
                onActionCompleted();
            }
        }
    });

    // Handle move selection with advanced validation
    const handleMoveSelect = (spaceName) => {
        
        // Check if dice roll is required first
        if (currentPlayer && movementEngine) {
            const currentSpaceData = movementEngine.getCurrentSpaceData(currentPlayer);
            if (currentSpaceData?.requires_dice_roll === 'Yes' && !hasRolled) {
                // Show message but allow selection for display purposes
                // Continue to allow selection for UI feedback
            } else {
                // Validate move with MovementEngine for non-dice spaces
                const availableMoves = movementEngine.getAvailableMoves(currentPlayer);
                if (availableMoves.length > 0 && !availableMoves.includes(spaceName)) {
                    console.warn(`Move to ${spaceName} not allowed for ${currentPlayer.name}`);
                    return;
                }
            }
        }
        
        // Just select the move, don't execute it
        if (onMoveSelect) {
            onMoveSelect(spaceName);
        }
        
        // Update state to show selected move
        if (onMovementStateChange) {
            onMovementStateChange({
                selectedMove: spaceName,
                showMoveDetails: true
            });
        }
    };


    // Get space data for display with visit type awareness
    const getSpaceData = (spaceName) => {
        if (!window.CSVDatabase?.loaded) return null;
        
        // Use MovementEngine to determine visit type
        let visitType = 'First';
        if (currentPlayer && movementEngine) {
            visitType = movementEngine.getVisitType(currentPlayer, spaceName);
        }
        
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        return window.CSVDatabase.spaceContent.find(spaceName, visitType);
    };

    // Get space type for display styling
    const getSpaceType = (spaceName) => {
        if (!movementEngine) return 'Main';
        const spaceData = getSpaceData(spaceName);
        return spaceData ? movementEngine.getSpaceType(spaceData) : 'Main';
    };

    // Get effective available moves - use MovementEngine for validation
    const getEffectiveAvailableMoves = () => {
        if (!currentPlayer || !movementEngine) {
            return availableMoves || [];
        }
        
        // Get moves from MovementEngine (handles dice roll requirements)
        const engineMoves = movementEngine.getAvailableMoves(currentPlayer);
        
        // If MovementEngine returns moves, use those (authoritative)
        if (engineMoves.length > 0) {
            return engineMoves;
        }
        
        // Always show available moves from props - let validation happen during execution
        return availableMoves || [];
    };
    
    const effectiveAvailableMoves = getEffectiveAvailableMoves();
    
    // Don't render if no moves available
    if (!effectiveAvailableMoves || effectiveAvailableMoves.length === 0) {
        return null;
    }

    // Don't render UI if there's only one move (auto-selected)
    // Single destinations are shown in the Current Space panel to avoid duplication
    if (effectiveAvailableMoves.length === 1) {
        return null;
    }

    return React.createElement('div', { key: 'movement-section' }, [
        // Available Moves Section
        React.createElement('div', {
            key: 'moves-section',
            className: 'moves-section'
        }, [
            React.createElement('h4', {
                key: 'moves-title',
                className: 'section-title'
            }, '🚶 Available Moves'),
            
            React.createElement('div', {
                key: 'moves-grid',
                className: 'moves-grid'
            }, 
                effectiveAvailableMoves.map(spaceName => {
                    const spaceData = getSpaceData(spaceName);
                    const spaceType = getSpaceType(spaceName);
                    const visitType = currentPlayer && movementEngine ? 
                        movementEngine.getVisitType(currentPlayer, spaceName) : 'First';
                    
                    // Space type styling
                    const spaceTypeClass = spaceType.toLowerCase().replace(' ', '-');
                    const visitTypeClass = visitType.toLowerCase();
                    
                    return React.createElement('button', {
                        key: spaceName,
                        className: `btn move-button space-${spaceTypeClass} visit-${visitTypeClass} ${selectedMove === spaceName ? 'is-active' : ''}`,
                        onClick: () => handleMoveSelect(spaceName),
                        title: spaceData ? `${spaceData.Event} (${spaceType}, ${visitType})` : spaceName
                    }, spaceName);
                })
            )
        ])
    ]);
}

// Make component available globally
window.MovementSection = MovementSection;