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
            const currentSpaceData = window.CSVDatabase.spaces.find(currentPlayer.position, 'First');
            
            // Look up dice outcome from CSV
            let diceOutcomeResult = null;
            if (currentSpaceData) {
                // Find dice configuration for this space
                const diceConfig = window.CSVDatabase.dice.query({
                    space_name: currentPlayer.position,
                    visit_type: 'First'
                });
                
                if (diceConfig && diceConfig.length > 0) {
                    // Get the outcome for the specific dice value (1-6)
                    const config = diceConfig[0];
                    const outcome = config[diceValue.toString()]; // Use dice value as column name
                    
                    if (outcome) {
                        diceOutcomeResult = {
                            cards: outcome,
                            money: '0',
                            time: '0'
                        };
                    }
                }
            }

            // Format outcome for display
            const formattedOutcome = diceOutcomeResult ? 
                `${diceOutcomeResult.cards || 'No cards'} | ${diceOutcomeResult.money ? '$' + diceOutcomeResult.money + 'k' : '$0'} | ${diceOutcomeResult.time ? diceOutcomeResult.time + ' days' : '0 days'}` :
                `No outcome data for roll ${diceValue}`;

            // Update state with results
            onDiceRoll({
                rolling: false,
                hasRolled: true,
                diceRollValue: diceValue,
                diceOutcome: diceOutcomeResult,
                diceOutcomeText: formattedOutcome
            });

            // Process dice outcome using GameManager
            if (diceOutcomeResult) {
                // Convert dice outcome object to string format that GameManager expects
                let outcomeString = '';
                if (diceOutcomeResult.cards && diceOutcomeResult.cards !== 'None') {
                    outcomeString = diceOutcomeResult.cards;
                }
                
                if (outcomeString) {
                    gameStateManager.emit('processDiceOutcome', {
                        playerId: currentPlayer.id,
                        outcome: outcomeString,
                        spaceName: currentPlayer.position,
                        visitType: 'First'
                    });
                }

                // Handle money changes separately
                if (diceOutcomeResult.money && diceOutcomeResult.money !== '0') {
                    const moneyChange = parseInt(diceOutcomeResult.money);
                    if (!isNaN(moneyChange)) {
                        gameStateManager.emit('moneyChanged', {
                            playerId: currentPlayer.id,
                            amount: moneyChange,
                            source: 'dice_roll'
                        });
                    }
                }

                // Handle time changes separately
                if (diceOutcomeResult.time && diceOutcomeResult.time !== '0') {
                    const timeChange = parseInt(diceOutcomeResult.time);
                    if (!isNaN(timeChange)) {
                        gameStateManager.emit('timeChanged', {
                            playerId: currentPlayer.id,
                            amount: timeChange,
                            source: 'dice_roll'
                        });
                    }
                }
            }

            // Emit completion event
            gameStateManager.emit('diceRollCompleted', {
                playerId: currentPlayer.id,
                diceValue: diceValue,
                outcome: diceOutcomeResult
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

    return React.createElement('div', {
        key: 'dice-roll-section',
        className: 'dice-roll-section'
    }, [
        React.createElement('h4', { 
            key: 'dice-title',
            className: 'section-title'
        }, '🎲 Dice Roll'),
        
        React.createElement('div', { 
            key: 'dice-content',
            className: 'dice-content'
        }, [
            React.createElement('p', { 
                key: 'dice-instruction',
                className: 'dice-instruction'
            }, 'Roll the dice to determine your outcome for this space.'),
            
            React.createElement('div', { 
                key: 'dice-controls',
                className: 'dice-controls'
            }, [
                React.createElement('button', {
                    key: 'dice-button',
                    className: `dice-roll-button ${rolling ? 'rolling' : ''} ${hasRolled ? 'completed' : ''}`,
                    onClick: handleDiceRoll,
                    disabled: rolling || hasRolled
                }, rolling ? '🎲 Rolling...' : hasRolled ? '✅ Rolled' : '🎲 Roll Dice'),
                
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
            ])
        ])
    ]);
}

// Make component available globally
window.DiceRollSection = DiceRollSection;