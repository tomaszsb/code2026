/**
 * DiceRollSection - Dice rolling interface and logic
 * Handles dice rolling requirements, animation, and outcome display
 */

function DiceRollSection({ 
    diceRequired, 
    hasRolled, 
    rolling, 
    showDiceRoll, 
    diceRollValue, 
    diceOutcome, 
    pendingAction,
    currentPlayer,
    onDiceRoll,
    onDiceCompleted,
    gameStateManager 
}) {
    const { useState, useEffect } = React;

    // Listen for dice completion to notify parent
    useEventListener('diceRollCompleted', ({ playerId }) => {
        if (playerId === currentPlayer?.id && onDiceCompleted) {
            onDiceCompleted();
        }
    });

    // Handle dice roll action
    const handleDiceRoll = async () => {
        if (!currentPlayer || !window.CSVDatabase?.loaded) {
            console.error('Cannot roll dice: missing player or database');
            return;
        }

        try {
            onDiceRoll({ 
                rolling: true,
                diceRollValue: '🎲',
                diceOutcome: null
            });

            // Simulate dice roll animation delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Generate random dice value (1-6)
            const diceValue = Math.floor(Math.random() * 6) + 1;
            
            // Get current space data
            if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
                console.error('DiceRollSection: CSVDatabase not loaded');
                return;
            }
            const currentSpaceData = window.CSVDatabase.spaceContent.find(currentPlayer.position, 'First');
            
            // Look up dice effects and movement outcomes
            let diceOutcomeResult = null;
            let destination = null;
            
            if (currentSpaceData) {
                // Check for dice effects (cards/money/time)
                const diceEffects = window.CSVDatabase.diceEffects.query({
                    space_name: currentPlayer.position,
                    visit_type: currentPlayer.visitType || 'First'
                });
                
                if (diceEffects.length > 0) {
                    for (const effect of diceEffects) {
                        const rollEffect = effect[`roll_${diceValue}`];
                        if (rollEffect && rollEffect !== 'No change') {
                            if (!diceOutcomeResult) diceOutcomeResult = {};
                            
                            if (effect.effect_type === 'cards') {
                                diceOutcomeResult.cards = rollEffect;
                                diceOutcomeResult.cardType = effect.card_type;
                            } else if (effect.effect_type === 'money') {
                                diceOutcomeResult.money = rollEffect;
                            } else if (effect.effect_type === 'time') {
                                diceOutcomeResult.time = rollEffect;
                            }
                        }
                    }
                }
                
                // Check for movement destinations
                const movementConfig = window.CSVDatabase.diceOutcomes.find(
                    currentPlayer.position,
                    currentPlayer.visitType || 'First'
                );
                
                if (movementConfig) {
                    destination = movementConfig[`roll_${diceValue}`];
                    if (destination) {
                        if (!diceOutcomeResult) diceOutcomeResult = {};
                        diceOutcomeResult.destination = destination;
                    }
                }
            }

            // Format outcome for display
            let formattedOutcome = `Roll ${diceValue}: `;
            if (diceOutcomeResult) {
                const parts = [];
                if (diceOutcomeResult.cards) parts.push(diceOutcomeResult.cards);
                if (diceOutcomeResult.money) parts.push(`$${diceOutcomeResult.money}`);
                if (diceOutcomeResult.time) parts.push(`${diceOutcomeResult.time} days`);
                if (diceOutcomeResult.destination) parts.push(`Move to ${diceOutcomeResult.destination}`);
                formattedOutcome += parts.join(' | ') || 'No effect';
            } else {
                formattedOutcome += 'No effect';
            }

            // Update state with results
            onDiceRoll({
                rolling: false,
                hasRolled: true,
                diceRollValue: diceValue,
                diceOutcome: diceOutcomeResult,
                diceOutcomeText: formattedOutcome
            });

            // Process dice effects if any
            if (diceOutcomeResult) {
                // Process card effects
                if (diceOutcomeResult.cards && diceOutcomeResult.cardType) {
                    gameStateManager.emit('processDiceOutcome', {
                        playerId: currentPlayer.id,
                        outcome: diceOutcomeResult.cards,
                        cardType: diceOutcomeResult.cardType,
                        spaceName: currentPlayer.position,
                        visitType: currentPlayer.visitType || 'First'
                    });
                }

                // Process money effects
                if (diceOutcomeResult.money) {
                    let moneyAmount = 0;
                    if (diceOutcomeResult.money.includes('%')) {
                        // Percentage-based (like fees)
                        const percentage = parseFloat(diceOutcomeResult.money.replace('%', ''));
                        // Apply percentage to player's current money (this would need player data)
                        moneyAmount = Math.floor((currentPlayer.money || 0) * percentage / 100);
                    } else {
                        moneyAmount = parseInt(diceOutcomeResult.money);
                    }
                    
                    if (!isNaN(moneyAmount) && moneyAmount !== 0) {
                        gameStateManager.emit('moneyChanged', {
                            playerId: currentPlayer.id,
                            amount: moneyAmount,
                            source: 'dice_roll'
                        });
                    }
                }

                // Process time effects
                if (diceOutcomeResult.time) {
                    const timeAmount = parseInt(diceOutcomeResult.time);
                    if (!isNaN(timeAmount) && timeAmount !== 0) {
                        gameStateManager.emit('timeChanged', {
                            playerId: currentPlayer.id,
                            amount: timeAmount,
                            source: 'dice_roll'
                        });
                    }
                }
            }

            // Emit completion event for movement (if destination exists)
            gameStateManager.emit('diceRollComplete', {
                playerId: currentPlayer.id,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First',
                rollValue: diceValue
            });

            // Emit standardized player action taken event
            gameStateManager.emit('playerActionTaken', {
                playerId: currentPlayer.id,
                actionType: 'dice',
                actionData: {
                    rollValue: diceValue,
                    effects: diceOutcomeResult,
                    outcome: formattedOutcome
                },
                timestamp: Date.now(),
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });

        } catch (error) {
            console.error('Error rolling dice:', error);
            onDiceRoll({ rolling: false });
        }
    };


    // Don't render if dice roll is not required or shown
    if (!showDiceRoll && !diceRequired) {
        return null;
    }

    // Get available dice effects for preview
    const getDiceEffectsPreview = () => {
        if (!currentPlayer || !window.CSVDatabase?.loaded || hasRolled) return null;
        
        const diceEffects = window.CSVDatabase.diceEffects.query({
            space_name: currentPlayer.position,
            visit_type: currentPlayer.visitType || 'First'
        });
        
        if (diceEffects.length === 0) return null;
        
        const effectTypes = [];
        diceEffects.forEach(effect => {
            if (effect.effect_type === 'cards' && effect.card_type) {
                const cardTypeName = window.CardUtils?.getCardTypeConfig(effect.card_type)?.name || effect.card_type;
                const actionText = window.ComponentUtils?.getDiceActionText(
                    currentPlayer.position, 
                    currentPlayer.visitType || 'First', 
                    effect.card_type
                ) || 'Draw dice';
                effectTypes.push(`${cardTypeName}: ${actionText}`);
            } else if (effect.effect_type === 'money') {
                effectTypes.push('Money effects');
            } else if (effect.effect_type === 'time') {
                effectTypes.push('Time effects');
            }
        });
        
        return effectTypes.length > 0 ? effectTypes.join(' • ') : null;
    };

    const effectsPreview = getDiceEffectsPreview();

    return React.createElement('div', {
        key: 'dice-roll-section',
        className: 'dice-roll-section'
    }, [
        React.createElement('h4', { 
            key: 'dice-title',
            className: 'section-title'
        }, '🎲 Dice Roll'),
        
        effectsPreview && React.createElement('div', {
            key: 'effects-preview',
            className: 'dice-effects-preview space-info-container',
            style: {
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderLeft: '4px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px'
            }
        }, [
            React.createElement('span', {key: 'icon'}, '🎲 '),
            React.createElement('small', {
                key: 'preview-label',
                className: 'preview-label'
            }, 'Dice-based effects: '),
            React.createElement('span', {
                key: 'preview-text',
                className: 'preview-text'
            }, effectsPreview),
            React.createElement('div', {
                key: 'dice-button-container',
                style: { marginTop: '10px' }
            }, [
                React.createElement('button', {
                    key: 'dice-button',
                    className: `btn ${hasRolled ? 'btn--success' : 'btn--primary'} btn--full ${rolling ? 'is-loading' : ''} dice-roll-button`,
                    onClick: handleDiceRoll,
                    disabled: rolling || hasRolled,
                    title: hasRolled ? 'Dice rolled' : 'Roll dice and apply all dice-based effects'
                }, rolling ? 'Rolling...' : hasRolled ? 'Rolled' : 'Roll Dice & Apply Effects')
            ])
        ]),
        
        hasRolled && diceRollValue && React.createElement('div', {
            key: 'dice-result',
            className: 'dice-result'
        }, [
                React.createElement('div', {
                    key: 'dice-value',
                    className: 'dice-value'
                }, `Rolled: ${diceRollValue}`),
                
                diceOutcome && React.createElement('div', {
                    key: 'dice-outcome',
                    className: 'dice-outcome'
                }, [
                    diceOutcome.cards && diceOutcome.cards !== 'None' && React.createElement('div', {
                        key: 'outcome-cards',
                        className: 'outcome-item'
                    }, `📇 Cards: ${diceOutcome.cards}`),
                    
                    diceOutcome.money && diceOutcome.money !== '0' && React.createElement('div', {
                        key: 'outcome-money',
                        className: 'outcome-item'
                    }, `💰 Money: ${diceOutcome.money > 0 ? '+' : ''}$${diceOutcome.money}k`),
                    
                    diceOutcome.time && diceOutcome.time !== '0' && React.createElement('div', {
                        key: 'outcome-time',
                        className: 'outcome-item'
                    }, `⏰ Time: ${diceOutcome.time > 0 ? '+' : ''}${diceOutcome.time} days`),
                    
                    diceOutcome.special_note && React.createElement('div', {
                        key: 'outcome-note',
                        className: 'outcome-note'
                    }, diceOutcome.special_note)
                ])
            ])
    ]);
}

// Make component available globally
window.DiceRollSection = DiceRollSection;