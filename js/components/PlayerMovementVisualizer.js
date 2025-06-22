/**
 * PlayerMovementVisualizer Component - Visual movement feedback and animations
 * Provides smooth visual transitions and path indicators for player movement
 */

function PlayerMovementVisualizer() {
    const { useState, useEffect, useCallback } = React;
    const [gameState, gameStateManager] = useGameState();
    const [movementState, setMovementState] = useState({
        activeMovements: new Map(),
        movementPaths: new Map(),
        animationQueue: []
    });

    // Handle player movement events
    useEventListener('playerMoved', ({ player, fromSpace, toSpace }) => {
        visualizeMovement(player, fromSpace, toSpace);
    });

    // Handle movement path calculation
    useEventListener('calculateMovementPath', ({ player, targetSpace }) => {
        const path = calculateMovementPath(player.position, targetSpace);
        if (path) {
            showMovementPath(player.id, path);
        }
    });

    // Visualize player movement with smooth animation
    const visualizeMovement = (player, fromSpace, toSpace) => {
        if (!player || !toSpace) return;

        const movementId = `movement-${player.id}-${Date.now()}`;
        
        // Create movement animation data
        const movementData = {
            id: movementId,
            playerId: player.id,
            fromSpace,
            toSpace,
            startTime: Date.now(),
            duration: 1500, // 1.5 second animation
            color: player.color
        };

        // Add to active movements
        setMovementState(prev => ({
            ...prev,
            activeMovements: new Map(prev.activeMovements).set(movementId, movementData)
        }));

        // Create visual trail effect
        createMovementTrail(movementData);

        // Show notification
        if (window.InteractiveFeedback) {
            window.InteractiveFeedback.info(
                `${player.name} moved to ${toSpace}`,
                3000
            );
        }

        // Clean up after animation
        setTimeout(() => {
            setMovementState(prev => {
                const newMovements = new Map(prev.activeMovements);
                newMovements.delete(movementId);
                return { ...prev, activeMovements: newMovements };
            });
        }, movementData.duration + 500);
    };

    // Calculate movement path between spaces
    const calculateMovementPath = (fromSpace, toSpace) => {
        // Use CSV data to find space connections
        const fromSpaceData = CSVDatabase.spaces.find(fromSpace, 'First');
        const toSpaceData = CSVDatabase.spaces.find(toSpace, 'First');
        
        if (!fromSpaceData || !toSpaceData) return null;

        // For now, create a simple direct path
        // In a more advanced implementation, this could calculate optimal routes
        return {
            spaces: [fromSpace, toSpace],
            distance: 1,
            estimatedTime: 1500
        };
    };

    // Show movement path preview
    const showMovementPath = (playerId, path) => {
        if (!path) return;

        setMovementState(prev => ({
            ...prev,
            movementPaths: new Map(prev.movementPaths).set(playerId, {
                path,
                timestamp: Date.now(),
                expires: Date.now() + 5000 // Show for 5 seconds
            })
        }));

        // Auto-clear expired paths
        setTimeout(() => {
            setMovementState(prev => {
                const newPaths = new Map(prev.movementPaths);
                const pathData = newPaths.get(playerId);
                if (pathData && Date.now() > pathData.expires) {
                    newPaths.delete(playerId);
                }
                return { ...prev, movementPaths: newPaths };
            });
        }, 5000);
    };

    // Create movement trail effect
    const createMovementTrail = (movementData) => {
        // Add visual trail particles
        const trailId = `trail-${movementData.id}`;
        
        // This would create animated particles following the movement
        // For now, we'll use a simple flash effect
        const flashElements = document.querySelectorAll(`[data-space="${movementData.toSpace}"]`);
        
        flashElements.forEach(element => {
            element.style.transition = 'all 0.3s ease';
            element.style.boxShadow = `0 0 20px ${movementData.color}`;
            element.style.transform = 'scale(1.05)';
            
            setTimeout(() => {
                element.style.boxShadow = '';
                element.style.transform = 'scale(1)';
            }, 600);
        });
    };

    // Highlight available moves with visual indicators
    const highlightAvailableMoves = (player, availableMoves) => {
        if (!availableMoves || availableMoves.length === 0) return;

        // Add pulsing animation to available move spaces
        availableMoves.forEach((spaceName, index) => {
            const spaceElements = document.querySelectorAll(`[data-space="${spaceName}"]`);
            
            spaceElements.forEach(element => {
                element.classList.add('available-move-highlight');
                element.style.animationDelay = `${index * 100}ms`;
                
                // Add tooltip info
                element.setAttribute('data-tooltip', `Click to move to ${spaceName}`);
                element.setAttribute('data-tooltip-theme', 'success');
            });
        });
    };

    // Remove movement highlights
    const clearMovementHighlights = () => {
        const highlightedElements = document.querySelectorAll('.available-move-highlight');
        highlightedElements.forEach(element => {
            element.classList.remove('available-move-highlight');
            element.style.animationDelay = '';
            element.removeAttribute('data-tooltip');
            element.removeAttribute('data-tooltip-theme');
        });
    };

    // Handle available moves highlighting
    useEventListener('showAvailableMoves', ({ player, moves }) => {
        clearMovementHighlights();
        highlightAvailableMoves(player, moves);
    });

    // Clear highlights when moves are hidden
    useEventListener('hideAvailableMoves', () => {
        clearMovementHighlights();
    });

    // Visual feedback for player position updates
    const updatePlayerPosition = (player) => {
        const playerElements = document.querySelectorAll(`[data-player="${player.id}"]`);
        const spaceElements = document.querySelectorAll(`[data-space="${player.position}"]`);
        
        // Update player position indicators
        playerElements.forEach(element => {
            element.style.transition = 'all 0.5s ease';
            element.style.transform = 'translateY(-2px)';
            
            setTimeout(() => {
                element.style.transform = 'translateY(0)';
            }, 300);
        });

        // Highlight current space
        spaceElements.forEach(element => {
            element.classList.add('current-player-space');
            element.style.borderColor = player.color;
            
            // Auto-remove highlight after delay
            setTimeout(() => {
                element.classList.remove('current-player-space');
                element.style.borderColor = '';
            }, 2000);
        });
    };

    // Expose visualizer methods globally
    useEffect(() => {
        window.PlayerMovementVisualizer = {
            visualizeMovement,
            highlightAvailableMoves,
            clearMovementHighlights,
            showMovementPath,
            updatePlayerPosition
        };
    }, []);

    // Render movement animations and effects
    return React.createElement('div', {
        className: 'player-movement-visualizer'
    }, [
        // CSS for movement animations
        React.createElement('style', {
            key: 'movement-styles'
        }, `
            .available-move-highlight {
                animation: availableMovePulse 2s infinite;
                border: 2px solid #10b981 !important;
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
                z-index: 10;
                position: relative;
            }

            @keyframes availableMovePulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.02);
                    opacity: 0.8;
                }
            }

            .current-player-space {
                animation: currentSpacePulse 1s ease-out;
                border-width: 3px !important;
                z-index: 15;
                position: relative;
            }

            @keyframes currentSpacePulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 rgba(255, 255, 255, 0.7);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
                }
            }

            .movement-trail {
                position: absolute;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle, rgba(16, 185, 129, 0.8), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 20;
                animation: trailFade 1.5s ease-out forwards;
            }

            @keyframes trailFade {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.5);
                }
            }

            .player-position-indicator {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: positionPulse 2s infinite;
                z-index: 25;
            }

            @keyframes positionPulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(1.2);
                }
            }

            .movement-path-preview {
                position: absolute;
                border: 2px dashed #f59e0b;
                border-radius: 4px;
                background: rgba(245, 158, 11, 0.1);
                animation: pathPreview 3s ease-in-out infinite;
                z-index: 5;
            }

            @keyframes pathPreview {
                0%, 100% {
                    opacity: 0.6;
                    border-color: #f59e0b;
                }
                50% {
                    opacity: 0.8;
                    border-color: #d97706;
                }
            }
        `),

        // Active movement animations
        Array.from(movementState.activeMovements.values()).map(movement =>
            React.createElement('div', {
                key: movement.id,
                className: 'movement-animation',
                style: {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    color: movement.color,
                    fontSize: '24px',
                    animation: 'movementNotification 1.5s ease-out forwards'
                }
            }, `👤 ${movement.toSpace}`)
        ),

        // Additional movement notification styles
        React.createElement('style', {
            key: 'notification-styles'
        }, `
            @keyframes movementNotification {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                80% {
                    opacity: 1;
                    transform: translate(-50%, -80%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -120%) scale(0.8);
                }
            }
        `)
    ]);
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerMovementVisualizer;
} else {
    window.PlayerMovementVisualizerComponent = PlayerMovementVisualizer;
}