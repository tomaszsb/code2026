/**
 * MovementSection - Movement selection and execution interface
 * Handles move selection, validation, execution, and move details display
 */

function MovementSection({ 
    currentPlayer,
    gameStateManager,
    availableMoves,
    selectedMove,
    showMoveDetails,
    hasMoved,
    onMoveSelect,
    onMoveExecute,
    onMovementStateChange,
    onActionCompleted
}) {
    const { useState, useEffect } = React;

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

    // Handle move selection (execute immediately)
    const handleMoveSelect = (spaceName) => {
        console.log(`MovementSection: Executing move to ${spaceName}`);
        
        if (!currentPlayer || !window.CSVDatabase?.loaded) {
            console.error('MovementSection: Cannot execute move - missing requirements');
            return;
        }

        // Execute the move immediately
        gameStateManager.emit('movePlayerRequest', {
            playerId: currentPlayer.id,
            spaceName: spaceName,
            visitType: 'First'
        });

        // Emit player moved event for turn tracking
        gameStateManager.emit('playerMoved', {
            playerId: currentPlayer.id,
            fromSpace: currentPlayer.position,
            toSpace: spaceName
        });
        
        // Update state
        if (onMovementStateChange) {
            onMovementStateChange({
                selectedMove: null,
                showMoveDetails: false,
                hasMoved: true
            });
        }

        if (onMoveExecute) {
            onMoveExecute();
        }

        if (onActionCompleted) {
            onActionCompleted();
        }
    };

    // Execute the selected move
    const executeSelectedMove = () => {
        if (!selectedMove || !currentPlayer || !window.CSVDatabase?.loaded) {
            console.error('MovementSection: Cannot execute move - missing requirements');
            return;
        }

        console.log(`MovementSection: Executing move to ${selectedMove}`);

        // Use only movePlayerRequest - this handles both movement and space effects
        gameStateManager.emit('movePlayerRequest', {
            playerId: currentPlayer.id,
            spaceName: selectedMove,
            visitType: 'FIRST_VISIT'
        });

        // Emit player moved event for turn tracking
        gameStateManager.emit('playerMoved', {
            playerId: currentPlayer.id,
            fromSpace: currentPlayer.position,
            toSpace: selectedMove
        });
        
        // Update state
        if (onMovementStateChange) {
            onMovementStateChange({
                selectedMove: null,
                showMoveDetails: false,
                hasMoved: true
            });
        }

        if (onMoveExecute) {
            onMoveExecute();
        }

        if (onActionCompleted) {
            onActionCompleted();
        }
    };

    // Get space data for display
    const getSpaceData = (spaceName) => {
        if (!window.CSVDatabase?.loaded) return null;
        return window.CSVDatabase.spaces.find(spaceName, 'First');
    };

    // Don't render if no moves available
    if (!availableMoves || availableMoves.length === 0) {
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
                availableMoves.map(spaceName => {
                    const spaceData = getSpaceData(spaceName);
                    
                    return React.createElement('button', {
                        key: spaceName,
                        className: 'move-button',
                        onClick: () => handleMoveSelect(spaceName),
                        title: spaceData ? spaceData.Event : spaceName
                    }, [
                        React.createElement('div', {
                            key: 'space-name',
                            className: 'space-name'
                        }, spaceName),
                        
                        spaceData && React.createElement('div', {
                            key: 'space-phase',
                            className: 'space-phase'
                        }, spaceData.Phase || 'Unknown'),
                        
                        spaceData && spaceData.Event && React.createElement('div', {
                            key: 'space-event',
                            className: 'space-event'
                        }, spaceData.Event.length > 50 ? 
                            spaceData.Event.substring(0, 50) + '...' : 
                            spaceData.Event
                        )
                    ]);
                })
            )
        ])
    ]);
}

// Make component available globally
window.MovementSection = MovementSection;