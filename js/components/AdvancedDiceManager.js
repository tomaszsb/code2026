/**
 * AdvancedDiceManager Component - Sophisticated dice system with conditional outcomes
 * Adapted for code2026's architecture from code2025's advanced features
 */

function AdvancedDiceManager() {
    const { useState, useEffect, useRef } = React;
    const [gameState, gameStateManager] = useGameState();
    const [diceState, setDiceState] = useState({
        rolling: false,
        rollValue: null,
        outcomes: [],
        conditionalRequirements: new Map(),
        pendingCardDraws: [],
        rollHistory: []
    });

    // Handle dice roll request
    useEventListener('rollDiceRequest', ({ playerId, spaceName, visitType, options = {} }) => {
        performDiceRoll(playerId, spaceName, visitType, options);
    });

    // Handle player movement to check for dice requirements
    useEventListener('playerMoved', ({ player, playerId }) => {
        // Handle both event formats: some emit player object, some emit playerId
        const targetPlayer = player || (playerId && gameState.players?.find(p => p.id === playerId));
        if (targetPlayer) {
            checkDiceRequirements(targetPlayer);
        }
    });

    // Perform dice roll with advanced processing
    const performDiceRoll = async (playerId, spaceName, visitType, options) => {
        if (diceState.rolling) return;

        setDiceState(prev => ({ ...prev, rolling: true }));

        // Show feedback
        if (window.InteractiveFeedback) {
            window.InteractiveFeedback.info('🎲 Rolling dice...', 2000);
        }

        // Simulate dice animation
        await simulateDiceAnimation();

        // Generate roll value (1-6)
        const rollValue = Math.floor(Math.random() * 6) + 1;

        // Process roll outcomes
        const outcomes = processRollOutcomes(spaceName, visitType, rollValue, options);
        
        // Record roll in history
        const rollRecord = {
            playerId,
            spaceName,
            visitType,
            rollValue,
            outcomes,
            timestamp: Date.now(),
            turn: gameState.currentTurn || 0
        };

        setDiceState(prev => ({
            ...prev,
            rolling: false,
            rollValue,
            outcomes,
            rollHistory: [rollRecord, ...prev.rollHistory.slice(0, 9)]
        }));

        // Process outcomes
        processOutcomeEffects(outcomes, playerId, rollRecord);

        // Emit dice rolled event
        gameStateManager.emit('diceRolled', {
            playerId,
            rollValue,
            outcomes,
            rollRecord
        });

        console.log('AdvancedDiceManager: Dice roll completed', rollRecord);
    };

    // Simulate dice rolling animation
    const simulateDiceAnimation = () => {
        return new Promise(resolve => {
            let animationCount = 0;
            const maxAnimations = 8;
            
            const animate = () => {
                if (animationCount < maxAnimations) {
                    const tempValue = Math.floor(Math.random() * 6) + 1;
                    setDiceState(prev => ({ ...prev, rollValue: tempValue }));
                    animationCount++;
                    setTimeout(animate, 200);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    };

    // Process roll outcomes from CSV data
    const processRollOutcomes = (spaceName, visitType, rollValue, options) => {
        // Ensure CSVDatabase is loaded
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.warn('AdvancedDiceManager: CSVDatabase not loaded for roll outcomes');
            return [{
                type: 'default',
                description: `Rolled ${rollValue} - CSV data not loaded`,
                effects: { rollValue }
            }];
        }
        
        // Get base outcome from CSV
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        const baseOutcome = window.CSVDatabase.dice.getRollOutcome(spaceName, visitType, rollValue);
        
        if (!baseOutcome) {
            return [{
                type: 'default',
                description: `Rolled ${rollValue} - No specific outcome defined`,
                effects: { rollValue }
            }];
        }

        const outcomes = [];

        // Process movement outcomes
        if (baseOutcome.movement_options) {
            const movementOptions = parseMovementOptions(baseOutcome.movement_options);
            outcomes.push({
                type: 'movement',
                description: baseOutcome.description || `Rolled ${rollValue}`,
                effects: { movementOptions },
                rollValue
            });
        }

        // Process card draw outcomes
        if (baseOutcome.card_draw) {
            const cardDraws = parseCardDrawOutcome(baseOutcome.card_draw, rollValue);
            outcomes.push({
                type: 'cardDraw',
                description: `Draw ${cardDraws.count} ${cardDraws.type} card${cardDraws.count > 1 ? 's' : ''}`,
                effects: { cardDraws },
                rollValue
            });
        }

        // Process monetary effects
        if (baseOutcome.money_effect) {
            const moneyEffect = parseMoneyEffect(baseOutcome.money_effect, rollValue);
            outcomes.push({
                type: 'money',
                description: moneyEffect.description,
                effects: { money: moneyEffect.amount },
                rollValue
            });
        }

        // Process time effects
        if (baseOutcome.time_effect) {
            const timeEffect = parseTimeEffect(baseOutcome.time_effect, rollValue);
            outcomes.push({
                type: 'time',
                description: timeEffect.description,
                effects: { time: timeEffect.amount },
                rollValue
            });
        }

        // Process conditional requirements
        if (baseOutcome.conditional_requirement) {
            const conditional = parseConditionalRequirement(baseOutcome.conditional_requirement, rollValue);
            if (conditional) {
                outcomes.push({
                    type: 'conditional',
                    description: conditional.description,
                    effects: { conditional },
                    rollValue
                });
            }
        }

        // If no specific outcomes, create default
        if (outcomes.length === 0) {
            outcomes.push({
                type: 'default',
                description: baseOutcome.description || `Rolled ${rollValue}`,
                effects: { rollValue },
                rollValue
            });
        }

        return outcomes;
    };

    // Parse movement options from dice outcome
    const parseMovementOptions = (movementText) => {
        if (!movementText) return [];
        
        // Handle patterns like "SPACE-A or SPACE-B", "Move 1-3 spaces", etc.
        const options = [];
        
        if (movementText.includes(' or ')) {
            // Multiple specific destinations
            const destinations = movementText.split(' or ').map(dest => dest.trim());
            destinations.forEach(dest => {
                options.push({
                    type: 'specific',
                    destination: dest,
                    description: `Move to ${dest}`
                });
            });
        } else if (movementText.includes('Move')) {
            // Movement distance
            const match = movementText.match(/Move (\d+)(?:-(\d+))? space/);
            if (match) {
                const min = parseInt(match[1]);
                const max = match[2] ? parseInt(match[2]) : min;
                options.push({
                    type: 'distance',
                    minSpaces: min,
                    maxSpaces: max,
                    description: `Move ${min}${max > min ? `-${max}` : ''} space${max > 1 ? 's' : ''}`
                });
            }
        } else {
            // Single destination
            options.push({
                type: 'specific',
                destination: movementText,
                description: `Move to ${movementText}`
            });
        }
        
        return options;
    };

    // Parse card draw outcome
    const parseCardDrawOutcome = (cardDrawText, rollValue) => {
        // Handle patterns like "Draw 2 W cards", "Draw 1 card", "Draw W+B card"
        const cardDraw = { count: 1, type: 'any', specific: [] };
        
        const countMatch = cardDrawText.match(/Draw (\d+)/);
        if (countMatch) {
            cardDraw.count = parseInt(countMatch[1]);
        }

        const typeMatch = cardDrawText.match(/(\d+\s+)?([WBILE]+)(?:\+([WBILE]+))?\s+card/);
        if (typeMatch) {
            cardDraw.type = typeMatch[2];
            if (typeMatch[3]) {
                cardDraw.specific = [typeMatch[2], typeMatch[3]];
            }
        }

        // Roll value modifiers
        if (cardDrawText.includes('per roll')) {
            cardDraw.count = Math.ceil(rollValue / 2); // Example: higher rolls = more cards
        }

        return cardDraw;
    };

    // Parse money effects
    const parseMoneyEffect = (moneyText, rollValue) => {
        let amount = 0;
        let description = moneyText;

        // Handle patterns like "+$10000", "-$5000", "$1000 per roll point"
        const fixedMatch = moneyText.match(/([+-]?)\$(\d+)/);
        if (fixedMatch) {
            amount = parseInt(fixedMatch[2]);
            if (fixedMatch[1] === '-') amount = -amount;
        }

        // Handle roll-based multipliers
        if (moneyText.includes('per roll')) {
            const perRollMatch = moneyText.match(/\$(\d+)\s+per roll/);
            if (perRollMatch) {
                amount = parseInt(perRollMatch[1]) * rollValue;
                description = `$${perRollMatch[1]} × ${rollValue} = $${amount}`;
            }
        }

        return { amount, description };
    };

    // Parse time effects
    const parseTimeEffect = (timeText, rollValue) => {
        let amount = 0;
        let description = timeText;

        // Handle patterns like "+2 time", "-1 time", "1 time per 2 roll points"
        const fixedMatch = timeText.match(/([+-]?)(\d+)\s+time/);
        if (fixedMatch) {
            amount = parseInt(fixedMatch[2]);
            if (fixedMatch[1] === '-') amount = -amount;
        }

        // Handle roll-based time
        if (timeText.includes('per roll') || timeText.includes('per 2 roll')) {
            if (timeText.includes('per 2 roll')) {
                amount = Math.floor(rollValue / 2);
            } else {
                amount = rollValue;
            }
            description = `${amount} time from roll ${rollValue}`;
        }

        return { amount, description };
    };

    // Parse conditional requirements
    const parseConditionalRequirement = (conditionalText, rollValue) => {
        // Handle requirements like "If roll >= 4: Draw W card", "If roll <= 2: Pay $5000"
        const ifMatch = conditionalText.match(/If roll ([><=]+) (\d+): (.+)/);
        if (!ifMatch) return null;

        const operator = ifMatch[1];
        const threshold = parseInt(ifMatch[2]);
        const action = ifMatch[3];

        let conditionMet = false;
        switch (operator) {
            case '>=':
                conditionMet = rollValue >= threshold;
                break;
            case '<=':
                conditionMet = rollValue <= threshold;
                break;
            case '>':
                conditionMet = rollValue > threshold;
                break;
            case '<':
                conditionMet = rollValue < threshold;
                break;
            case '=':
            case '==':
                conditionMet = rollValue === threshold;
                break;
        }

        return {
            condition: `roll ${operator} ${threshold}`,
            conditionMet,
            action,
            description: conditionMet ? 
                `Condition met (${rollValue} ${operator} ${threshold}): ${action}` :
                `Condition not met (${rollValue} ${operator} ${threshold})`
        };
    };

    // Process outcome effects on game state
    const processOutcomeEffects = (outcomes, playerId, rollRecord) => {
        const player = gameState.players?.find(p => p.id === playerId);
        if (!player) return;

        outcomes.forEach(outcome => {
            switch (outcome.type) {
                case 'movement':
                    handleMovementOutcome(outcome, player);
                    break;
                case 'cardDraw':
                    handleCardDrawOutcome(outcome, player);
                    break;
                case 'money':
                    handleMoneyOutcome(outcome, player);
                    break;
                case 'time':
                    handleTimeOutcome(outcome, player);
                    break;
                case 'conditional':
                    handleConditionalOutcome(outcome, player);
                    break;
            }
        });

        // Show combined feedback
        showOutcomeFeedback(outcomes, rollRecord);
    };

    // Handle movement outcomes
    const handleMovementOutcome = (outcome, player) => {
        const { movementOptions } = outcome.effects;
        
        if (movementOptions.length === 1) {
            // Single option - auto-move
            const option = movementOptions[0];
            if (option.type === 'specific') {
                gameStateManager.emit('movePlayerRequest', {
                    playerId: player.id,
                    spaceName: option.destination,
                    visitType: 'First'
                });
            }
        } else if (movementOptions.length > 1) {
            // Multiple options - let player choose
            gameStateManager.emit('showSpaceChoice', {
                playerId: player.id,
                spaceOptions: movementOptions.map(opt => opt.destination || opt.description),
                source: 'dice_outcome'
            });
        }
    };

    // Handle card draw outcomes
    const handleCardDrawOutcome = (outcome, player) => {
        const { cardDraws } = outcome.effects;
        
        for (let i = 0; i < cardDraws.count; i++) {
            gameStateManager.emit('drawCard', {
                playerId: player.id,
                cardType: cardDraws.type !== 'any' ? cardDraws.type : null,
                source: 'dice_roll'
            });
        }
    };

    // Handle money outcomes
    const handleMoneyOutcome = (outcome, player) => {
        const { money } = outcome.effects;
        
        if (money !== 0) {
            const newMoney = Math.max(0, player.money + money);
            gameStateManager.emit('updatePlayer', {
                playerId: player.id,
                updates: { money: newMoney }
            });
        }
    };

    // Handle time outcomes
    const handleTimeOutcome = (outcome, player) => {
        const { time } = outcome.effects;
        
        if (time !== 0 && window.InteractiveFeedback) {
            const message = time > 0 ? 
                `+${time} time gained from dice roll` : 
                `${Math.abs(time)} time spent from dice roll`;
            window.InteractiveFeedback.info(message);
        }
    };

    // Handle conditional outcomes
    const handleConditionalOutcome = (outcome, player) => {
        const { conditional } = outcome.effects;
        
        if (conditional.conditionMet) {
            // Process the conditional action
            if (conditional.action.includes('Draw')) {
                const cardType = conditional.action.match(/Draw ([WBILE])/)?.[1] || null;
                gameStateManager.emit('drawCard', {
                    playerId: player.id,
                    cardType,
                    source: 'conditional_dice'
                });
            } else if (conditional.action.includes('Pay')) {
                const amount = conditional.action.match(/Pay \$(\d+)/)?.[1];
                if (amount) {
                    const newMoney = Math.max(0, player.money - parseInt(amount));
                    gameStateManager.emit('updatePlayer', {
                        playerId: player.id,
                        updates: { money: newMoney }
                    });
                }
            }
        }
    };

    // Show feedback for dice outcomes
    const showOutcomeFeedback = (outcomes, rollRecord) => {
        if (!window.InteractiveFeedback) return;

        const { rollValue } = rollRecord;
        const mainOutcomes = outcomes.filter(o => o.type !== 'default');
        
        if (mainOutcomes.length === 0) {
            window.InteractiveFeedback.info(`🎲 Rolled ${rollValue}`);
        } else {
            const message = `🎲 Rolled ${rollValue}: ${mainOutcomes.map(o => o.description).join(', ')}`;
            window.InteractiveFeedback.success(message, 6000);
        }
    };

    // Check if current player position requires dice roll
    const checkDiceRequirements = (player) => {
        if (!player || !player.position) return;
        
        // Ensure CSVDatabase is loaded before querying
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.warn('AdvancedDiceManager: CSVDatabase not loaded yet');
            return;
        }

        if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        const spaceData = window.CSVDatabase.spaces.find(player.position, player.visitType || 'First');
        
        if (spaceData && spaceData.Event && spaceData.Event.toLowerCase().includes('roll dice')) {
            // Auto-trigger dice roll requirement
            setTimeout(() => {
                gameStateManager.emit('showDiceRoll', {
                    playerId: player.id,
                    spaceName: player.position,
                    visitType: player.visitType || 'First'
                });
            }, 500);
        }
    };

    // Expose dice manager methods globally
    useEffect(() => {
        window.AdvancedDiceManager = {
            rollDice: (playerId, spaceName, visitType, options) => 
                performDiceRoll(playerId, spaceName, visitType, options),
            getRollHistory: () => diceState.rollHistory,
            isRolling: () => diceState.rolling,
            getLastRoll: () => diceState.rollHistory[0] || null
        };
    }, [diceState]);

    // Render dice display (if needed for visual feedback)
    if (diceState.rolling || diceState.rollValue) {
        return React.createElement('div', {
            className: 'advanced-dice-display',
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1001,
                background: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                textAlign: 'center',
                minWidth: '200px'
            }
        }, [
            React.createElement('div', {
                key: 'dice',
                style: {
                    fontSize: '48px',
                    marginBottom: '16px',
                    animation: diceState.rolling ? 'roll 0.2s infinite' : 'none'
                }
            }, `🎲 ${diceState.rollValue || '?'}`),
            
            diceState.rolling && React.createElement('div', {
                key: 'rolling',
                style: { color: '#6b7280' }
            }, 'Rolling...'),
            
            !diceState.rolling && diceState.outcomes.length > 0 && 
            React.createElement('div', {
                key: 'outcomes',
                style: { fontSize: '14px', color: '#374151' }
            }, diceState.outcomes.map(outcome => outcome.description).join(' • ')),

            React.createElement('style', {
                key: 'styles'
            }, `
                @keyframes roll {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(90deg); }
                    50% { transform: rotate(180deg); }
                    75% { transform: rotate(270deg); }
                }
            `)
        ]);
    }

    return null;
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedDiceManager;
} else {
    window.AdvancedDiceManagerComponent = AdvancedDiceManager;
}