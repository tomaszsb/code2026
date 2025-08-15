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
        console.log('🎲 DICE DEBUG: handleDiceRoll function called');
        
        if (!currentPlayer || !window.CSVDatabase?.loaded) {
            console.error('Cannot roll dice: missing player or database');
            return;
        }

        try {
            onDiceRoll({ 
                rolling: true,
                diceRollValue: '🎲',
                diceOutcome: null,
                diceValue: null
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
                            
                            if (effect.effect_type === 'cards' || effect.effect_type.endsWith('_cards')) {
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
                diceOutcomeText: formattedOutcome,
                diceValue: diceValue
            });

            // CRITICAL: Fire playerActionTaken immediately to allow turn progression
            console.log('🎲 DICE DEBUG: Firing playerActionTaken event for turn system');
            gameStateManager.emit('playerActionTaken', {
                playerId: currentPlayer.id,
                actionType: 'dice',
                actionData: {
                    diceValue: diceValue,
                    rollValue: diceValue,
                    effects: diceOutcomeResult,
                    outcome: formattedOutcome
                },
                timestamp: Date.now(),
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });

            // Always show dice result modal with context data for specific feedback
            console.log('🎲 DICE DEBUG: Preparing to show dice result modal');
            console.log('🎲 DICE DEBUG: diceOutcomeResult:', diceOutcomeResult);
            
            // Always create a modal data object with context, even if no effects applied
            const modalData = {
                diceValue: diceValue,
                effects: diceOutcomeResult, // Can be null - modal will handle this
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            };
            
            console.log('🎲 DICE DEBUG: Showing dice result modal with context data');
            gameStateManager.emit('showDiceResult', modalData);
            console.log('🎲 DICE DEBUG: Global modal event emitted with context');

        } catch (error) {
            console.error('Error rolling dice:', error);
            onDiceRoll({ rolling: false });
        }
    };


    // DEBUG: Log dice roll section props (commented out to reduce log spam)
    // if (currentPlayer && (currentPlayer.position === 'OWNER-SCOPE-INITIATION' || currentPlayer.position === 'PM-DECISION-CHECK')) {
    //     console.log(`🎲 DICE SECTION DEBUG: ${currentPlayer.position}`);
    //     console.log(`🎲 DICE SECTION DEBUG: diceRequired=${diceRequired}, showDiceRoll=${showDiceRoll}`);
    //     console.log(`🎲 DICE SECTION DEBUG: hasRolled=${hasRolled}, rolling=${rolling}`);
    //     console.log(`🎲 DICE SECTION DEBUG: diceRollValue=${diceRollValue}, diceOutcome=`, diceOutcome);
    // }

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
            if ((effect.effect_type === 'cards' || effect.effect_type.endsWith('_cards')) && effect.card_type) {
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