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
        console.log(`CardActionsSection: Received showCardActions event for player ${playerId}, currentPlayer: ${currentPlayer?.id}`);
        console.log('CardActionsSection: Card actions:', cardActions);
        if (playerId === currentPlayer?.id && onCardActionsStateChange) {
            console.log('CardActionsSection: Setting card actions in state');
            onCardActionsStateChange({
                availableCardActions: cardActions,
                showCardActions: true
            });
        }
    });

    // Handle card action execution
    const handleCardAction = (cardType, action) => {
        if (!currentPlayer) return;

        console.log(`CardActionsSection: Processing card action ${cardType} - ${action}`);
        
        // Emit the card action processing event
        gameStateManager.emit('processCardAction', {
            playerId: currentPlayer.id,
            cardType,
            action
        });
        
        // Remove this action from available actions and track completion
        const newAvailableActions = availableCardActions.filter(
            ca => !(ca.type === cardType && ca.action === action)
        );
        
        console.log(`CardActionsSection: Removed action, ${availableCardActions.length} -> ${newAvailableActions.length}`);
        
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
            console.log('CardActionsSection: isDiceBasedAction - missing dependencies');
            return false;
        }
        
        // Check if this space has dice effects for this card type
        const diceEffects = window.CSVDatabase.diceEffects.data || [];
        const matchingEffect = diceEffects.find(row => 
            row.space_name === currentPlayer.position && 
            row.visit_type === (currentPlayer.visitType || 'First') && 
            row.card_type === cardAction.type
        );
        
        console.log(`CardActionsSection: isDiceBasedAction for ${cardAction.type} at ${currentPlayer.position}:`, !!matchingEffect);
        return !!matchingEffect;
    };

    // Smart filtering for card actions
    const getFilteredCardActions = () => {
        if (!availableCardActions) return [];

        return availableCardActions.filter((cardAction) => {
            // Filter out dice-based card actions (these are handled by dice roll automatically)
            if (isDiceBasedAction(cardAction)) {
                console.log(`CardActionsSection: Filtering out dice-based action: ${cardAction.type} - ${cardAction.action}`);
                return false;
            }
            
            // Temporary aggressive filter: remove any "Draw dice" actions
            if (cardAction.action && cardAction.action.includes('dice')) {
                console.log(`CardActionsSection: Filtering out dice action by text: ${cardAction.type} - ${cardAction.action}`);
                return false;
            }
            
            // Smart filtering for OWNER-FUND-INITIATION space
            if (currentPlayer && currentPlayer.position === 'OWNER-FUND-INITIATION') {
                const scopeCost = currentPlayer.scopeTotalCost || 0;
                const fourMillion = 4000000; // $4M threshold
                
                // Work card: hide on OWNER-FUND-INITIATION (funding space, not work space)
                if (cardAction.type === 'W') {
                    return false;
                }
                
                // Bank card: only show if scope ≤ $4M
                if (cardAction.type === 'B' && scopeCost > fourMillion) {
                    return false;
                }
                
                // Investor card: only show if scope > $4M
                if (cardAction.type === 'I' && scopeCost <= fourMillion) {
                    return false;
                }
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
        
        React.createElement('div', {
            key: 'card-actions-grid',
            className: 'card-actions-grid'
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
        ),

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