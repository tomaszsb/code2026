/**
 * CardActionsSection - Card actions interface and smart filtering
 * Handles card action buttons, OWNER-FUND-INITIATION filtering, and action execution
 */

function CardActionsSection({ 
    availableCardActions,
    showCardActions,
    originalCardActionCount,
    currentPlayer,
    onCardAction,
    onCardActionsStateChange,
    onActionCompleted,
    gameStateManager
}) {
    const { useState, useEffect } = React;
    
    // Get global game state to access UI state
    const [gameState] = useGameState();
    const isDiceResultModalActive = gameState?.ui?.isDiceResultModalActive || false;

    // Listen for card actions being shown
    useEventListener('showCardActions', ({ playerId, cardActions, spaceName }) => {
        if (playerId === currentPlayer?.id && onCardActionsStateChange) {
            onCardActionsStateChange({
                availableCardActions: cardActions,
                showCardActions: true
            });
        }
    });

    // Handle card action execution
    const handleCardAction = (cardType, action, condition) => {
        if (!currentPlayer) {
            return;
        }
        
        // Check if this is a replace action
        if (condition === 'replace' && action.includes('Replace')) {
            // Extract amount from action text (e.g., "Replace 1" -> 1)
            const amountMatch = action.match(/Replace (\d+)/i);
            const amount = amountMatch ? parseInt(amountMatch[1]) : 1;
            
            console.log('CardActionsSection: Handling replace action:', {
                cardType,
                action,
                condition,
                amount,
                playerId: currentPlayer.id
            });
            
            // Emit show card replacement event
            gameStateManager.emit('showCardReplacement', {
                playerId: currentPlayer.id,
                cardType,
                amount,
                source: 'manual_action'
            });
        } else {
            // Emit the card action processing event for other actions
            gameStateManager.emit('processCardAction', {
                playerId: currentPlayer.id,
                cardType,
                action
            });
        }

        // Emit standardized player action taken event
        gameStateManager.emit('playerActionTaken', {
            playerId: currentPlayer.id,
            actionType: 'card',
            actionData: {
                cardType: cardType,
                action: action,
                source: 'available_card_action'
            },
            timestamp: Date.now(),
            spaceName: currentPlayer.position,
            visitType: currentPlayer.visitType || 'First'
        });
        
        // Remove this action from available actions and track completion
        const newAvailableActions = availableCardActions.filter(
            ca => !(ca.type === cardType && ca.action === action)
        );
        
        
        // Update parent state
        if (onCardActionsStateChange) {
            onCardActionsStateChange({
                availableCardActions: newAvailableActions
            });
        }

        // Trigger the provided card action handler
        if (onCardAction) {
            onCardAction(cardType, action);
        }

        // Notify parent about action completion
        if (onActionCompleted) {
            onActionCompleted();
        }
    };

    // Handle funding card draw action for OWNER-FUND-INITIATION
    const handleFundingCardDraw = () => {
        if (!currentPlayer) {
            console.error('CardActionsSection: No current player found for funding card draw');
            return;
        }

        if (currentPlayer.position !== 'OWNER-FUND-INITIATION') {
            console.error(`CardActionsSection: Player ${currentPlayer.name} is not at OWNER-FUND-INITIATION`);
            return;
        }

        console.log(`🔍 CARD ACTIONS: Drawing funding card for ${currentPlayer.name} at ${currentPlayer.position}`);
        
        // Call the GameStateManager method to trigger funding card draw
        const messages = gameStateManager.triggerFundingCardDraw(currentPlayer.id);
        
        if (messages.length > 0) {
            console.log('🔍 CARD ACTIONS: Funding card draw results:', messages);
        } else {
            console.log('🔍 CARD ACTIONS: No funding cards were drawn');
        }

        // Notify parent about action completion
        if (onActionCompleted) {
            onActionCompleted();
        }
    };

    // Check if a card action is dice-based
    const isDiceBasedAction = (cardAction) => {
        if (!currentPlayer || !window.CSVDatabase?.loaded || !window.CSVDatabase.diceEffects) {
            return false;
        }
        
        // Check if this space has dice effects for this card type
        // console.log(`🔍 isDiceBasedAction: Checking for card type "${cardAction.type}" at space "${currentPlayer.position}"`);
        
        const diceEffects = window.CSVDatabase.diceEffects.query({
            space_name: currentPlayer.position,
            visit_type: currentPlayer.visitType || 'First',
            card_type: cardAction.type
        });
        
        // console.log(`🔍 isDiceBasedAction: Found ${diceEffects.length} matching effects`);
        // if (diceEffects.length > 0) {
        //     console.log(`🔍 isDiceBasedAction: Found matching row in DICE_EFFECTS.csv:`, diceEffects[0]);
        // }
        
        const matchingEffect = diceEffects.length > 0 ? diceEffects[0] : null;
        
        // console.log(`🔍 isDiceBasedAction: Result for card type "${cardAction.type}" is: ${!!matchingEffect}`);
        return !!matchingEffect;
    };

    // Check if a dice-based manual action is available based on dice roll results
    const isDiceBasedManualActionAvailable = (cardAction) => {
        // console.log(`🔍 FILTER DEBUG: Checking dice-based manual action for ${cardAction.type}`);
        
        if (!currentPlayer || !window.CSVDatabase?.loaded) {
            // console.log(`🔍 FILTER DEBUG: Missing player or database`);
            return false;
        }

        // Get the dice roll results from game state
        const gameState = gameStateManager?.getState();
        const lastDiceRoll = gameState?.currentTurn?.lastDiceRoll;
        
        // console.log(`🔍 FILTER DEBUG: lastDiceRoll = ${lastDiceRoll}`);
        
        // If no dice has been rolled, hide the action
        if (!lastDiceRoll) {
            // console.log(`🔍 FILTER DEBUG: No dice rolled yet, hiding action`);
            return false;
        }

        // Check dice effects to see if this specific card type is available for this roll
        const diceEffects = window.CSVDatabase.diceEffects.query({
            space_name: currentPlayer.position,
            visit_type: currentPlayer.visitType || 'First',
            card_type: cardAction.type
        });

        // console.log(`🔍 FILTER DEBUG: Found ${diceEffects.length} dice effects for ${cardAction.type} at ${currentPlayer.position}`);

        if (diceEffects.length === 0) {
            // console.log(`🔍 FILTER DEBUG: No dice effects found, hiding action`);
            return false;
        }

        // Check if the last dice roll result allows this card action
        const diceEffect = diceEffects[0]; // Should be only one effect per card type per space/visit
        const rollResult = diceEffect[`roll_${lastDiceRoll}`];
        
        // console.log(`🔍 FILTER DEBUG: Roll ${lastDiceRoll} result for ${cardAction.type}: "${rollResult}"`);
        
        // Available if roll result is not "No change" and not empty
        const isAvailable = rollResult && rollResult !== 'No change' && rollResult.trim() !== '';
        // console.log(`🔍 FILTER DEBUG: Action ${cardAction.type} available: ${isAvailable}`);
        
        return isAvailable;
    };

    // Check if funding card draw button should be shown
    const shouldShowFundingButton = () => {
        if (!currentPlayer || currentPlayer.position !== 'OWNER-FUND-INITIATION') {
            return false;
        }
        
        // Check if funding card has already been drawn for this space
        const gameState = gameStateManager?.getState();
        if (gameState?.currentTurn?.fundingCardDrawnForSpace) {
            return false;
        }
        
        return true;
    };

    // Smart filtering for card actions - HYBRID APPROACH
    const getFilteredCardActions = () => {
        if (!availableCardActions) return [];

        // Layer 1: Hide all actions during dice result modal (temporal fix)
        if (isDiceResultModalActive) {
            return []; // Prevent all card actions while dice modal is active
        }

        // Check if space actions are completed
        const gameState = gameStateManager?.getState();
        const spaceActionsCompleted = gameState?.currentTurn?.spaceActionsCompleted;

        // If we're at OWNER-FUND-INITIATION and space actions are completed, hide all card actions
        if (currentPlayer?.position === 'OWNER-FUND-INITIATION' && spaceActionsCompleted) {
            return []; // Hide all card actions when space actions are completed
        }

        // If we're at OWNER-FUND-INITIATION and showing funding button, hide regular card actions
        if (shouldShowFundingButton()) {
            return []; // Hide regular card actions at OWNER-FUND-INITIATION when funding button is visible
        }

        // Layer 2: Proper data-driven filtering (logical fix)
        return availableCardActions.filter((cardAction) => {
            // console.log(`🔍 FILTER DEBUG: Processing card action ${cardAction.type} with trigger_type: ${cardAction.trigger_type}`);
            
            // Layer 2A: Manual actions that are ALSO dice-based need dice validation
            if (cardAction.trigger_type === 'manual' && isDiceBasedAction(cardAction)) {
                // console.log(`🔍 FILTER DEBUG: Layer 2A - Manual + dice-based action for ${cardAction.type}`);
                // Check if dice has been rolled and if this action is available based on dice result
                const result = isDiceBasedManualActionAvailable(cardAction);
                // console.log(`🔍 FILTER DEBUG: Layer 2A result for ${cardAction.type}: ${result}`);
                return result;
            }
            
            // Layer 2B: Pure manual actions (not dice-based) always show
            if (cardAction.trigger_type === 'manual') {
                // console.log(`🔍 FILTER DEBUG: Layer 2B - Pure manual action for ${cardAction.type}: SHOW`);
                return true; // Always show manual trigger actions that aren't dice-based
            }
            
            // Layer 2C: Hide automatic dice actions that aren't marked as manual
            if (isDiceBasedAction(cardAction) || (cardAction.action && cardAction.action.includes('dice'))) {
                // console.log(`🔍 FILTER DEBUG: Layer 2C - Automatic dice action for ${cardAction.type}: HIDE`);
                return false; // Hide automatic dice actions
            }
            
            // console.log(`🔍 FILTER DEBUG: Default case for ${cardAction.type}: SHOW`);
            return true; // Show all other cards normally
        });
    };

    // Don't render if no card actions to show AND not showing funding button
    if (!shouldShowFundingButton() && (!showCardActions || !availableCardActions || availableCardActions.length === 0)) {
        return null;
    }

    const filteredActions = getFilteredCardActions();

    return React.createElement('div', {
        key: 'card-actions-section',
        className: 'card-actions-section'
    }, [
        React.createElement('h4', {
            key: 'card-actions-title',
            className: 'section-title'
        }, '🎴 Available Card Actions'),
        
        // Regular card actions (hidden at OWNER-FUND-INITIATION)
        filteredActions.length > 0 && React.createElement('div', {
            key: 'available-cards-container',
            className: 'space-info-container',
            style: {
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderLeft: '4px solid #17a2b8',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px'
            }
        }, [
            React.createElement('span', {key: 'icon'}, '🎴 '),
            React.createElement('strong', {key: 'label'}, 'Available Cards: '),
            React.createElement('div', {
                key: 'card-actions-grid',
                className: 'card-actions-grid',
                style: { marginTop: '8px' }
            }, 
                filteredActions.map((cardAction, index) => {
                if (!window.CardUtils) {
                    console.warn('CardUtils not available for card action display');
                    return null;
                }

                const cardTypeName = window.CardUtils.getCardTypeConfig(cardAction.type).name;
                
                return React.createElement('button', {
                    key: `${cardAction.type}-${index}`,
                    className: `btn btn--secondary btn--full card-action-button card-action-${cardAction.type.toLowerCase()}`,
                    onClick: () => handleCardAction(cardAction.type, cardAction.action, cardAction.condition),
                    title: `${cardTypeName}: ${cardAction.action}`
                }, `${cardTypeName} - ${cardAction.action}`);
            })
            )
        ]),

        // Funding card draw button (only show at OWNER-FUND-INITIATION)
        shouldShowFundingButton() && React.createElement('div', {
            key: 'funding-card-container',
            className: 'space-info-container',
            style: {
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderLeft: '4px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px'
            }
        }, [
            React.createElement('span', {key: 'icon'}, '💰 '),
            React.createElement('strong', {key: 'label'}, 'Funding Options: '),
            React.createElement('div', {
                key: 'funding-button-container',
                style: { marginTop: '8px' }
            }, [
                React.createElement('button', {
                    key: 'draw-funding-card',
                    className: 'btn btn--primary btn--full funding-button',
                    onClick: handleFundingCardDraw,
                    title: 'Draw funding card based on your project scope (Bank card for ≤$4M, Investment card for >$4M)',
                    style: {
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }
                }, '💰 Draw Funding Card'),
                React.createElement('small', {
                    key: 'funding-hint',
                    style: {
                        display: 'block',
                        marginTop: '4px',
                        color: '#856404',
                        fontStyle: 'italic'
                    }
                }, currentPlayer && currentPlayer.scopeTotalCost 
                    ? (currentPlayer.scopeTotalCost <= 4000000 
                        ? `Scope: $${(currentPlayer.scopeTotalCost / 1000).toLocaleString()}k → Bank Card`
                        : `Scope: $${(currentPlayer.scopeTotalCost / 1000).toLocaleString()}k → Investment Card`)
                    : 'Scope-based funding card selection'
                )
            ])
        ]),

        // Show additional information for OWNER-FUND-INITIATION
        (() => {
            const gameState = gameStateManager?.getState();
            const spaceActionsCompleted = gameState?.currentTurn?.spaceActionsCompleted;
            
            if (currentPlayer?.position === 'OWNER-FUND-INITIATION') {
                if (spaceActionsCompleted) {
                    // Space actions completed - show completion message
                    return React.createElement('div', {
                        key: 'funding-completed-info',
                        className: 'card-actions-filtering-info',
                        style: {
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#d4edda',
                            borderRadius: '4px',
                            border: '1px solid #c3e6cb'
                        }
                    }, [
                        React.createElement('small', {
                            key: 'completion-message',
                            style: {
                                color: '#155724',
                                fontStyle: 'italic'
                            }
                        }, '✅ Funding card has been drawn. All card actions for this space are completed.')
                    ]);
                } else if (shouldShowFundingButton()) {
                    // Funding button visible - show instruction message
                    return React.createElement('div', {
                        key: 'funding-info',
                        className: 'card-actions-filtering-info',
                        style: {
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                        }
                    }, [
                        React.createElement('small', {
                            key: 'funding-explanation',
                            style: {
                                color: '#6c757d',
                                fontStyle: 'italic'
                            }
                        }, 'Regular card actions are hidden at OWNER-FUND-INITIATION. Use the funding button above to access scope-based funding cards.')
                    ]);
                }
            }
            
            return null;
        })()
    ]);
}

// Make component available globally
window.CardActionsSection = CardActionsSection;