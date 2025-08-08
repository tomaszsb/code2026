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

    // Smart filtering for card actions
    const getFilteredCardActions = () => {
        if (!availableCardActions) return [];

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

    // Don't render if no card actions to show
    if (!showCardActions || !availableCardActions || availableCardActions.length === 0) {
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

        // Show filtering information for OWNER-FUND-INITIATION
        currentPlayer && currentPlayer.position === 'OWNER-FUND-INITIATION' && React.createElement('div', {
            key: 'filtering-info',
            className: 'card-actions-filtering-info'
        }, [
            React.createElement('small', {
                key: 'filtering-text',
                className: 'filtering-text'
            }, `Smart filtering based on project scope: $${((currentPlayer.scopeTotalCost || 0) / 1000).toLocaleString()}k`)
        ])
    ]);
}

// Make component available globally
window.CardActionsSection = CardActionsSection;