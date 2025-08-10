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
    const handleCardAction = (cardType, action) => {
        if (!currentPlayer) {
            return;
        }
        
        // Emit the card action processing event
        gameStateManager.emit('processCardAction', {
            playerId: currentPlayer.id,
            cardType,
            action
        });

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
        const diceEffects = window.CSVDatabase.diceEffects.data || [];
        const matchingEffect = diceEffects.find(row => 
            row.space_name === currentPlayer.position && 
            row.visit_type === (currentPlayer.visitType || 'First') && 
            row.card_type === cardAction.type
        );
        
        return !!matchingEffect;
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

    // Smart filtering for card actions
    const getFilteredCardActions = () => {
        if (!availableCardActions) return [];

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

        return availableCardActions.filter((cardAction) => {
            // Data-driven filtering: Check trigger_type first
            if (cardAction.trigger_type === 'manual') {
                return true; // Always show manual trigger actions
            }
            
            // Hide dice-based actions that don't have trigger_type='manual'
            if (isDiceBasedAction(cardAction) || (cardAction.action && cardAction.action.includes('dice'))) {
                return false; // Hide automatic dice actions
            }
            
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
                    onClick: () => handleCardAction(cardAction.type, cardAction.action),
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