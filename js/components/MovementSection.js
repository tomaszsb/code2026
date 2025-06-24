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

    // Handle move selection (preview only, don't execute)
    const handleMoveSelect = (spaceName) => {
        console.log(`MovementSection: Move selected: ${spaceName}`);
        
        if (onMovementStateChange) {
            onMovementStateChange({
                selectedMove: spaceName,
                showMoveDetails: true
            });
        }

        if (onMoveSelect) {
            onMoveSelect(spaceName);
        }

        // Update action counter
        if (onActionCompleted) {
            setTimeout(() => onActionCompleted(), 100);
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
            visitType: 'First'
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
                    const isSelected = selectedMove === spaceName;
                    
                    return React.createElement('button', {
                        key: spaceName,
                        className: `move-button ${isSelected ? 'selected' : ''}`,
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
        ]),

        // Selected Move Details
        showMoveDetails && selectedMove && React.createElement('div', {
            key: 'move-details',
            className: 'move-details'
        }, [
            React.createElement('h5', {
                key: 'details-title',
                className: 'details-title'
            }, `Selected Move: ${selectedMove}`),
            
            React.createElement('div', {
                key: 'details-content',
                className: 'details-content'
            }, [
                (() => {
                    const spaceData = getSpaceData(selectedMove);
                    if (!spaceData) {
                        return React.createElement('p', {
                            key: 'no-data',
                            className: 'no-data'
                        }, 'Space information not available');
                    }

                    return [
                        spaceData.Phase && React.createElement('div', {
                            key: 'phase',
                            className: 'detail-item'
                        }, [
                            React.createElement('strong', { key: 'phase-label' }, 'Phase: '),
                            spaceData.Phase
                        ]),
                        
                        spaceData.Event && React.createElement('div', {
                            key: 'event',
                            className: 'detail-item'
                        }, [
                            React.createElement('strong', { key: 'event-label' }, 'Event: '),
                            spaceData.Event
                        ]),
                        
                        spaceData.Actions && React.createElement('div', {
                            key: 'actions',
                            className: 'detail-item'
                        }, [
                            React.createElement('strong', { key: 'actions-label' }, 'Actions: '),
                            spaceData.Actions
                        ])
                    ];
                })()
            ]),
            
            React.createElement('div', {
                key: 'details-actions',
                className: 'details-actions'
            }, [
                React.createElement('button', {
                    key: 'execute-move',
                    className: 'execute-move-button',
                    onClick: executeSelectedMove
                }, `Move to ${selectedMove}`),
                
                React.createElement('button', {
                    key: 'cancel-move',
                    className: 'cancel-move-button',
                    onClick: () => {
                        if (onMovementStateChange) {
                            onMovementStateChange({
                                selectedMove: null,
                                showMoveDetails: false
                            });
                        }
                    }
                }, 'Cancel')
            ])
        ])
    ]);
}

// Make component available globally
window.MovementSection = MovementSection;