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
            onDiceRoll({ rolling: true });

            // Simulate dice roll delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate random dice value (1-6)
            const diceValue = Math.floor(Math.random() * 6) + 1;
            
            // Get current space data
            const currentSpaceData = window.CSVDatabase.spaces.find(currentPlayer.position, 'FIRST_VISIT');
            
            // Look up dice outcome from CSV
            let diceOutcomeResult = null;
            if (currentSpaceData) {
                const diceData = window.CSVDatabase.dice.query({
                    space: currentPlayer.position,
                    visitType: 'FIRST_VISIT',
                    diceValue: diceValue
                });
                
                if (diceData && diceData.length > 0) {
                    diceOutcomeResult = diceData[0];
                }
            }

            // Update state with results
            onDiceRoll({
                rolling: false,
                hasRolled: true,
                diceRollValue: diceValue,
                diceOutcome: diceOutcomeResult
            });

            // Process dice outcome
            if (diceOutcomeResult) {
                await processDiceOutcome(diceOutcomeResult, currentPlayer);
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

    // Process dice outcome based on CSV data
    const processDiceOutcome = async (outcome, player) => {
        if (!outcome || !player) return;

        try {
            // Handle cards from dice outcome
            if (outcome.cards && outcome.cards !== 'None') {
                const cardInstructions = outcome.cards.split(',').map(c => c.trim());
                
                for (const instruction of cardInstructions) {
                    if (instruction.includes('Draw')) {
                        const matches = instruction.match(/Draw (\d+) ([BWILE])/);
                        if (matches) {
                            const count = parseInt(matches[1]);
                            const cardType = matches[2];
                            
                            // Draw cards
                            const newCards = [];
                            for (let i = 0; i < count; i++) {
                                const availableCards = window.CSVDatabase.cards.query({ type: cardType });
                                if (availableCards && availableCards.length > 0) {
                                    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                                    newCards.push({ ...randomCard, id: Date.now() + i });
                                }
                            }
                            
                            if (newCards.length > 0) {
                                gameStateManager.emit('cardsDrawn', {
                                    playerId: player.id,
                                    cards: newCards,
                                    source: 'dice_roll'
                                });
                            }
                        }
                    }
                }
            }

            // Handle money changes
            if (outcome.money && outcome.money !== '0') {
                const moneyChange = parseInt(outcome.money);
                if (!isNaN(moneyChange)) {
                    gameStateManager.emit('moneyChanged', {
                        playerId: player.id,
                        amount: moneyChange,
                        source: 'dice_roll'
                    });
                }
            }

            // Handle time changes
            if (outcome.time && outcome.time !== '0') {
                const timeChange = parseInt(outcome.time);
                if (!isNaN(timeChange)) {
                    gameStateManager.emit('timeChanged', {
                        playerId: player.id,
                        amount: timeChange,
                        source: 'dice_roll'
                    });
                }
            }

        } catch (error) {
            console.error('Error processing dice outcome:', error);
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