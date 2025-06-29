/**
 * ActionPanel - Interactive action and movement interface
 * Handles move selection, dice rolling, and game actions
 */

function ActionPanel() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    
    
    const [actionState, setActionState] = useState({
        availableMoves: [],
        selectedMove: null,
        showMoveDetails: false,
        diceRequired: false,
        hasRolled: false,
        rolling: false,
        pendingAction: null,
        showNegotiate: false,
        negotiationOptions: [],
        turnPhase: 'WAITING', // Track turn state
        actionsCompleted: [],
        hasMoved: false,
        canEndTurn: false,
        showDiceRoll: false,
        diceRollValue: null,
        diceOutcome: null,
        canTakeAction: false,
        showRulesModal: false,
        availableCardActions: [],
        originalCardActionCount: 0, // Track original count to compare against current
        showCardActions: false,
        requiredActions: 0,
        completedActions: 0,
        availableSpaceActions: [],
        showSpaceActions: false
    });

    // Handle dice roll state updates from DiceRollSection
    const handleDiceRollUpdate = (diceState) => {
        setActionState(prev => ({
            ...prev,
            ...diceState
        }));
    };

    // Handle dice completion from DiceRollSection
    const handleDiceCompleted = () => {
        setActionState(prev => ({
            ...prev,
            actionsCompleted: [...prev.actionsCompleted, 'dice_roll']
        }));
    };

    // Handle card actions state updates from CardActionsSection
    const handleCardActionsStateChange = (cardActionState) => {
        setActionState(prev => ({
            ...prev,
            ...cardActionState
        }));
    };

    // Handle card action completion
    const handleCardActionCompleted = () => {
        // Turn validation now handled by TurnControls component
    };

    // Handle space actions state updates from SpaceActionsSection
    const handleSpaceActionsStateChange = (spaceActionState) => {
        setActionState(prev => ({
            ...prev,
            ...spaceActionState
        }));
    };

    // Handle space action completion
    const handleSpaceActionCompleted = () => {
        // Turn validation now handled by TurnControls component
    };

    // Handle movement state updates from MovementSection
    const handleMovementStateChange = (movementState) => {
        setActionState(prev => ({
            ...prev,
            ...movementState
        }));
    };

    // Handle movement completion
    const handleMovementCompleted = () => {
        // Turn validation now handled by TurnControls component
    };

    // Handle turn controls state updates from TurnControls
    const handleTurnControlsStateChange = (turnControlsState) => {
        setActionState(prev => ({
            ...prev,
            ...turnControlsState
        }));
    };

    // Handle showing rules modal
    const showRulesModal = () => {
        setActionState(prev => ({
            ...prev,
            showRulesModal: true
        }));
    };

    const currentPlayer = gameState.players[gameState.currentPlayer];

    // Listen for game state changes

    useEventListener('diceRequired', ({ required, space }) => {
        setActionState(prev => ({
            ...prev,
            diceRequired: required,
            pendingAction: space
        }));
    });

    useEventListener('negotiationAvailable', ({ options }) => {
        setActionState(prev => ({
            ...prev,
            showNegotiate: true,
            negotiationOptions: options
        }));
    });

    // Listen for dice roll requirements
    useEventListener('showDiceRoll', ({ playerId, spaceName, visitType }) => {
        if (playerId === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                diceRequired: true,
                showDiceRoll: true,
                pendingAction: spaceName
            }));
        }
    });


    // Listen for turn state changes
    useEventListener('turnStarted', ({ player, turnNumber }) => {
        if (player.id === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                turnPhase: 'MOVING',
                actionsCompleted: [],
                hasMoved: false,
                canEndTurn: false
            }));
        }
    });


    useEventListener('spaceActionCompleted', ({ playerId }) => {
        if (playerId === currentPlayer?.id) {
            setActionState(prev => ({
                ...prev,
                actionsCompleted: [...prev.actionsCompleted, 'space_action']
            }));
            // Turn validation now handled by TurnControls component
        }
    });



    // Get available moves and check if current space requires dice
    useEffect(() => {
        if (currentPlayer && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaceContent.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            
            if (currentSpaceData) {
                const moves = ComponentUtils.getNextSpaces(currentPlayer.position, currentPlayer.visitType || 'First');
                const requiresDice = ComponentUtils.requiresDiceRoll(currentPlayer.position, currentPlayer.visitType || 'First');
                const cardTypes = ComponentUtils.getCardTypes(currentPlayer.position, currentPlayer.visitType || 'First');
                
                
                setActionState(prev => ({
                    ...prev,
                    availableMoves: moves,
                    diceRequired: requiresDice,
                    showDiceRoll: requiresDice,
                    pendingAction: requiresDice ? currentPlayer.position : null,
                    availableCardActions: cardTypes,
                    originalCardActionCount: cardTypes.length, // Store original count
                    showCardActions: cardTypes.length > 0
                }));
                
                // Turn validation now handled by TurnControls component
            }
        }
    }, [currentPlayer?.position, currentPlayer?.id]);


    // handleTakeAction removed - space effects now auto-trigger on move


    // handleApplyOutcome removed - outcomes now auto-apply after dice roll

    const hideRulesModal = () => {
        setActionState(prev => ({
            ...prev,
            showRulesModal: false
        }));
    };




    if (!currentPlayer) {
        return React.createElement('div', {
            className: 'action-panel'
        }, [
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'Waiting for game to start...')
        ]);
    }

    return React.createElement('div', {
        className: 'action-panel'
    }, [
        // Action Header
        React.createElement('div', {
            key: 'action-header',
            className: 'action-header'
        }, [
            React.createElement('h4', {
                key: 'title',
                className: 'section-title'
            }, '🎯 Actions'),
            React.createElement('p', {
                key: 'turn-indicator',
                className: 'turn-indicator'
            }, `${currentPlayer.name}'s Turn`)
        ]),

        // Take Action Section removed - space effects now auto-trigger on move

        // Dice Roll Section
        React.createElement(window.DiceRollSection, {
            key: 'dice-roll-section',
            diceRequired: actionState.diceRequired,
            hasRolled: actionState.hasRolled,
            rolling: actionState.rolling,
            showDiceRoll: actionState.showDiceRoll,
            diceRollValue: actionState.diceRollValue,
            diceOutcome: actionState.diceOutcome,
            pendingAction: actionState.pendingAction,
            currentPlayer: currentPlayer,
            onDiceRoll: handleDiceRollUpdate,
            onDiceCompleted: handleDiceCompleted,
            gameStateManager: gameStateManager
        }),

        // Card Actions Section
        React.createElement(window.CardActionsSection, {
            key: 'card-actions-section',
            availableCardActions: actionState.availableCardActions,
            showCardActions: actionState.showCardActions,
            originalCardActionCount: actionState.originalCardActionCount,
            currentPlayer: currentPlayer,
            onCardAction: (cardType, action) => {
                setActionState(prev => ({
                    ...prev,
                    actionsCompleted: [...prev.actionsCompleted, `card_${cardType}_${action}`]
                }));
            },
            onCardActionsStateChange: handleCardActionsStateChange,
            onActionCompleted: handleCardActionCompleted,
            gameStateManager: gameStateManager
        }),

        // Space Actions Section
        React.createElement(window.SpaceActionsSection, {
            key: 'space-actions-section',
            currentPlayer: currentPlayer,
            gameStateManager: gameStateManager,
            currentSpace: currentPlayer?.position,
            spaceData: currentPlayer?.position && window.CSVDatabase && window.CSVDatabase.loaded ? 
                window.CSVDatabase.spaceContent.find(currentPlayer.position, currentPlayer.visitType || 'First') : null,
            onSpaceActionCompleted: handleSpaceActionCompleted,
            onSpaceActionsStateChange: handleSpaceActionsStateChange
        }),

        // Movement Section
        React.createElement(window.MovementSection, {
            key: 'movement-section',
            currentPlayer: currentPlayer,
            gameStateManager: gameStateManager,
            availableMoves: actionState.availableMoves,
            selectedMove: actionState.selectedMove,
            showMoveDetails: actionState.showMoveDetails,
            hasMoved: actionState.hasMoved,
            hasRolled: actionState.hasRolled,
            onMoveSelect: (spaceName) => {
                setActionState(prev => ({
                    ...prev,
                    actionsCompleted: [...prev.actionsCompleted, 'move_select']
                }));
            },
            onMoveExecute: () => {
                setActionState(prev => ({
                    ...prev,
                    actionsCompleted: [...prev.actionsCompleted, 'space_action']
                }));
            },
            onMovementStateChange: handleMovementStateChange,
            onActionCompleted: handleMovementCompleted
        }),

        // Duplicate dice section removed - now using unified dice interface above

        // Old negotiation section removed - using negotiate button in turn controls instead

        // Turn Controls Section
        React.createElement(window.TurnControls, {
            key: 'turn-controls',
            currentPlayer: currentPlayer,
            gameStateManager: gameStateManager,
            canEndTurn: actionState.canEndTurn,
            completedActions: actionState.completedActions,
            requiredActions: actionState.requiredActions,
            diceRequired: actionState.diceRequired,
            hasRolled: actionState.hasRolled,
            selectedMove: actionState.selectedMove,
            availableCardActions: actionState.availableCardActions,
            originalCardActionCount: actionState.originalCardActionCount,
            availableMoves: actionState.availableMoves,
            onTurnControlsStateChange: handleTurnControlsStateChange,
            onShowRulesModal: showRulesModal,
            debugMode: window.location.search.includes('debug=true')
        }),

        // Rules Modal
        React.createElement(window.RulesModal, {
            key: 'rules-modal',
            show: actionState.showRulesModal,
            onClose: hideRulesModal
        })
    ]);
}

window.ActionPanel = ActionPanel;
