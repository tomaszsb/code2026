/**
 * SpaceActionsSection - Handle space-specific actions from Outcome field
 * Similar to CardActionsSection but for space outcomes like "Take Owner Money: $2M"
 */

function SpaceActionsSection({
    currentPlayer,
    gameStateManager,
    currentSpace,
    spaceData,
    onSpaceActionCompleted,
    onSpaceActionsStateChange
}) {
    const { useState, useEffect } = React;
    const [availableActions, setAvailableActions] = useState([]);
    const [actionsTaken, setActionsTaken] = useState(new Set());

    // Parse space actions from Outcome field
    useEffect(() => {
        if (!spaceData || !spaceData.Outcome) {
            setAvailableActions([]);
            return;
        }

        const actions = parseSpaceActions(spaceData.Outcome);
        setAvailableActions(actions);
        
        if (onSpaceActionsStateChange) {
            onSpaceActionsStateChange({
                availableSpaceActions: actions,
                showSpaceActions: actions.length > 0
            });
        }
    }, [spaceData?.space_name, spaceData?.Outcome]);

    // Parse space actions from outcome text
    const parseSpaceActions = (outcomeText) => {
        if (!outcomeText || outcomeText.trim() === '') return [];

        const actions = [];
        
        // Pattern: "Action Name: $Amount" or "Action Name: Amount"
        const actionMatches = outcomeText.match(/([^:]+):\s*\$?([0-9.]+)([KMB]?)/gi);
        
        if (actionMatches) {
            actionMatches.forEach((match, index) => {
                const parts = match.split(':');
                if (parts.length === 2) {
                    const actionName = parts[0].trim();
                    const amountText = parts[1].trim();
                    const amount = parseMoneyAmount(amountText);
                    
                    if (amount > 0) {
                        actions.push({
                            id: `space_action_${index}`,
                            name: actionName,
                            amount: amount,
                            amountText: amountText,
                            type: 'money'
                        });
                    }
                }
            });
        }

        // Pattern: Other action types can be added here
        // For now, focus on money actions

        return actions;
    };

    // Parse money amounts like "$2M", "500K", "1.5M"
    const parseMoneyAmount = (amountText) => {
        const cleanText = amountText.replace(/[\$,]/g, '');
        const match = cleanText.match(/([0-9.]+)([KMB]?)/i);
        
        if (!match) return 0;
        
        let amount = parseFloat(match[1]);
        const unit = match[2]?.toUpperCase();
        
        switch (unit) {
            case 'K':
                amount *= 1000;
                break;
            case 'M':
                amount *= 1000000;
                break;
            case 'B':
                amount *= 1000000000;
                break;
        }
        
        return Math.round(amount);
    };

    // Handle space action execution
    const handleSpaceAction = (action) => {
        if (!currentPlayer || !gameStateManager) return;
        
        console.log(`SpaceActionsSection: Executing ${action.name} for ${action.amountText}`);
        
        try {
            // Process money action
            if (action.type === 'money') {
                gameStateManager.updatePlayerMoney(
                    currentPlayer.id, 
                    action.amount, 
                    `${action.name} (${spaceData.space_name})`
                );
                
                // Show feedback
                if (window.InteractiveFeedback) {
                    window.InteractiveFeedback.success(
                        `${currentPlayer.name} received ${action.amountText} from ${action.name}!`,
                        3000
                    );
                }
            }
            
            // Mark action as taken
            setActionsTaken(prev => new Set(prev).add(action.id));
            
            // Notify completion
            if (onSpaceActionCompleted) {
                onSpaceActionCompleted(action);
            }
            
            // Emit space action completed event
            gameStateManager.emit('spaceActionExecuted', {
                playerId: currentPlayer.id,
                spaceName: spaceData.space_name,
                action: action
            });
            
        } catch (error) {
            console.error('SpaceActionsSection: Error executing space action:', error);
            if (window.InteractiveFeedback) {
                window.InteractiveFeedback.error(
                    `Failed to execute ${action.name}`,
                    3000
                );
            }
        }
    };

    // Don't render if no actions available
    if (!availableActions || availableActions.length === 0) {
        return null;
    }

    return React.createElement('div', { 
        key: 'space-actions-section',
        className: 'space-actions-section' 
    }, [
        React.createElement('h4', {
            key: 'space-actions-title',
            className: 'section-title'
        }, '💰 Space Actions'),
        
        React.createElement('div', {
            key: 'space-actions-grid',
            className: 'space-actions-grid'
        }, 
            availableActions.map(action => {
                const isTaken = actionsTaken.has(action.id);
                
                return React.createElement('button', {
                    key: action.id,
                    className: `space-action-button ${isTaken ? 'completed' : ''}`,
                    onClick: () => handleSpaceAction(action),
                    disabled: isTaken,
                    title: isTaken ? 'Action already taken' : `Click to ${action.name}`
                }, [
                    React.createElement('div', {
                        key: 'action-name',
                        className: 'space-action-name'
                    }, action.name),
                    React.createElement('div', {
                        key: 'action-amount',
                        className: 'space-action-amount'
                    }, action.amountText),
                    isTaken && React.createElement('div', {
                        key: 'completed-indicator',
                        className: 'space-action-completed'
                    }, '✓')
                ]);
            })
        )
    ]);
}

// Make component available globally
window.SpaceActionsSection = SpaceActionsSection;