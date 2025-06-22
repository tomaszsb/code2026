/**
 * LogicSpaceManager Component - Handle complex decision-based spaces
 * Adapted for code2026's CSV-driven architecture and event system
 */

function LogicSpaceManager() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [state, setState] = useState({
        isVisible: false,
        currentQuestion: null,
        questionType: null, // 'question' or 'destinations'
        destinations: [],
        currentPlayer: null
    });

    // Check if current space requires logic decisions
    const checkForLogicSpace = (player) => {
        if (!player || !player.position) return;

        // Query CSV for current space data
        const spaceData = CSVDatabase.spaces.find(player.position, player.visitType || 'First');
        
        if (spaceData && spaceData.Event) {
            // Check if Event contains logic decision markers
            const event = spaceData.Event.toLowerCase();
            if (event.includes('yes/no') || event.includes('choose') || event.includes('decision')) {
                setState(prevState => ({
                    ...prevState,
                    isVisible: true,
                    currentQuestion: spaceData.Event,
                    questionType: 'question',
                    currentPlayer: player
                }));
            }
        }
    };

    // Handle player movement events
    useEventListener('playerMoved', ({ player }) => {
        if (player && player.id === gameState.currentPlayer) {
            checkForLogicSpace(player);
        }
    });

    // Handle logic choice (YES/NO)
    const makeLogicChoice = (choice) => {
        if (!state.currentPlayer) return;

        const spaceData = CSVDatabase.spaces.find(
            state.currentPlayer.position, 
            state.currentPlayer.visitType || 'First'
        );

        if (!spaceData) return;

        // Process the choice based on space configuration
        const result = processLogicChoice(spaceData, choice);
        
        if (result) {
            if (result.type === 'directMove') {
                // Move directly to destination
                gameStateManager.emit('movePlayerRequest', {
                    playerId: state.currentPlayer.id,
                    spaceName: result.destination,
                    visitType: 'First'
                });
                hideLogicInterface();
            } else if (result.type === 'chooseDestination') {
                // Show destination choices
                setState(prevState => ({
                    ...prevState,
                    questionType: 'destinations',
                    destinations: result.destinations
                }));
            }
        }
    };

    // Process logic choice based on CSV data and game rules
    const processLogicChoice = (spaceData, choice) => {
        const spaceName = spaceData.space_name;
        const event = spaceData.Event;

        // Logic for specific known spaces - can be expanded based on CSV data
        if (spaceName.includes('LOGIC') || event.includes('yes/no')) {
            // Extract destination logic from Action field if available
            const action = spaceData.Action || '';
            
            if (choice) {
                // YES choice - typically moves to "success" destination
                if (action.includes('DESIGN')) {
                    return { type: 'directMove', destination: 'DESIGN-PHASE-COMPLETE' };
                } else if (action.includes('BUILD')) {
                    return { type: 'directMove', destination: 'BUILD-PHASE-COMPLETE' };
                } else {
                    // Generic positive outcome
                    return { type: 'directMove', destination: getNextPhaseSpace(spaceName) };
                }
            } else {
                // NO choice - typically has consequences or alternative paths
                return { 
                    type: 'chooseDestination', 
                    destinations: [
                        { id: 'RISK-SPACE', name: 'Risk Management Space' },
                        { id: 'OWNER-SCOPE-INITIATION', name: 'Return to Owner Scope' }
                    ]
                };
            }
        }

        return null;
    };

    // Get next phase space based on current space
    const getNextPhaseSpace = (currentSpace) => {
        if (currentSpace.includes('INITIATION')) return 'PLANNING-PHASE-START';
        if (currentSpace.includes('PLANNING')) return 'DESIGN-PHASE-START';
        if (currentSpace.includes('DESIGN')) return 'BUILD-PHASE-START';
        if (currentSpace.includes('BUILD')) return 'TEST-PHASE-START';
        if (currentSpace.includes('TEST')) return 'DEPLOY-PHASE-START';
        return 'FINISH';
    };

    // Select destination from multiple choices
    const selectDestination = (destinationId) => {
        if (!state.currentPlayer) return;

        gameStateManager.emit('movePlayerRequest', {
            playerId: state.currentPlayer.id,
            spaceName: destinationId,
            visitType: 'First'
        });

        hideLogicInterface();
    };

    // Hide logic interface
    const hideLogicInterface = () => {
        setState(prevState => ({
            ...prevState,
            isVisible: false,
            currentQuestion: null,
            questionType: null,
            destinations: [],
            currentPlayer: null
        }));
    };

    // Don't render if not visible
    if (!state.isVisible || !state.currentPlayer) {
        return null;
    }

    // Render logic question interface
    if (state.questionType === 'question') {
        return React.createElement('div', {
            className: 'logic-space-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }
        },
            React.createElement('div', {
                className: 'card card--large logic-question-card',
                style: {
                    background: 'linear-gradient(135deg, #007bff, #0056b3)',
                    color: 'white',
                    padding: '40px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }
            }, [
                React.createElement('div', { 
                    key: 'header',
                    className: 'logic-question-header mb-6'
                }, [
                    React.createElement('h2', { 
                        key: 'title',
                        className: 'heading-2 mb-4'
                    }, '🤔 Decision Required'),
                    React.createElement('div', {
                        key: 'player',
                        className: 'text-large mb-4'
                    }, `${state.currentPlayer.name} at ${state.currentPlayer.position}`)
                ]),
                
                React.createElement('div', {
                    key: 'question',
                    className: 'logic-question-content mb-8'
                },
                    React.createElement('p', {
                        className: 'text-large',
                        style: { lineHeight: '1.6' }
                    }, state.currentQuestion)
                ),
                
                React.createElement('div', {
                    key: 'buttons',
                    className: 'logic-question-buttons flex gap-6 justify-center'
                }, [
                    React.createElement('button', {
                        key: 'yes',
                        onClick: () => makeLogicChoice(true),
                        className: 'btn btn--success btn--large',
                        style: {
                            minWidth: '120px',
                            fontSize: '18px',
                            padding: '15px 30px'
                        }
                    }, '✓ YES'),
                    React.createElement('button', {
                        key: 'no',
                        onClick: () => makeLogicChoice(false),
                        className: 'btn btn--danger btn--large',
                        style: {
                            minWidth: '120px',
                            fontSize: '18px',
                            padding: '15px 30px'
                        }
                    }, '✗ NO')
                ])
            ])
        );
    }

    // Render destination selection interface
    if (state.questionType === 'destinations') {
        return React.createElement('div', {
            className: 'logic-space-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }
        },
            React.createElement('div', {
                className: 'card card--large logic-destinations-card',
                style: {
                    background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                    color: 'white',
                    padding: '40px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    maxWidth: '700px',
                    margin: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                }
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'logic-destinations-header mb-6'
                }, [
                    React.createElement('h2', {
                        key: 'title',
                        className: 'heading-2 mb-4'
                    }, '🎯 Choose Your Destination'),
                    React.createElement('div', {
                        key: 'player',
                        className: 'text-large mb-4'
                    }, `${state.currentPlayer.name} - Select where to go next`)
                ]),
                
                React.createElement('div', {
                    key: 'destinations',
                    className: 'logic-destinations-list'
                },
                    state.destinations.map((destination, index) =>
                        React.createElement('button', {
                            key: index,
                            onClick: () => selectDestination(destination.id),
                            className: 'btn btn--primary btn--full mb-4',
                            style: {
                                fontSize: '16px',
                                padding: '20px',
                                textAlign: 'left',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '10px'
                            }
                        }, [
                            React.createElement('div', {
                                key: 'name',
                                className: 'font-bold mb-2'
                            }, destination.name),
                            destination.description && React.createElement('div', {
                                key: 'desc',
                                className: 'text-small opacity-90'
                            }, destination.description)
                        ])
                    )
                )
            ])
        );
    }

    return null;
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogicSpaceManager;
} else {
    window.LogicSpaceManagerComponent = LogicSpaceManager;
}