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

    // Handle move selection (select only, don't execute)
    const handleMoveSelect = (spaceName) => {
        console.log(`MovementSection: Selecting move to ${spaceName}`);
        
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
                        className: `move-button ${selectedMove === spaceName ? 'selected' : ''}`,
                        onClick: () => handleMoveSelect(spaceName),
                        title: spaceData ? spaceData.Event : spaceName
                    }, 
                        React.createElement('div', {
                            key: 'space-name',
                            className: 'move-space-name'
                        }, spaceName)
                    );
                })
            )
        ])
    ]);
}

// Make component available globally
window.MovementSection = MovementSection;