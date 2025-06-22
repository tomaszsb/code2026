/**
 * GameManager - Core Game Logic Controller
 * Handles game state transitions and business logic
 * NO UI - pure logic component
 */

function GameManager() {
    const [gameState, gameStateManager] = useGameState();
    
    // Handle player movement
    useEventListener('movePlayerRequest', ({ playerId, spaceName, visitType }) => {
        try {
            // Validate the space exists
            const spaceData = window.CSVDatabase.spaces.find(spaceName, visitType);
            if (!spaceData) {
                throw new Error(`Space ${spaceName}/${visitType} not found in CSV data`);
            }
            
            // Move player
            gameStateManager.movePlayer(playerId, spaceName, visitType);
            
            // Process space effects
            processSpaceEffects(playerId, spaceData);
            
        } catch (error) {
            gameStateManager.handleError(error, 'Player Movement');
        }
    });
    
    // Handle dice roll outcomes
    useEventListener('diceRollComplete', ({ playerId, spaceName, visitType, rollValue }) => {
        try {
            const outcome = window.CSVDatabase.dice.getRollOutcome(spaceName, visitType, rollValue);
            if (outcome) {
                processDiceOutcome(playerId, outcome);
            }
        } catch (error) {
            gameStateManager.handleError(error, 'Dice Roll');
        }
    });
    
    // Handle dice outcome processing
    useEventListener('processDiceOutcome', ({ playerId, outcome, spaceName, visitType }) => {
        try {
            processDiceOutcome(playerId, outcome, spaceName, visitType);
        } catch (error) {
            gameStateManager.handleError(error, 'Dice Outcome Processing');
        }
    });
    
    // Handle card actions
    useEventListener('processCardAction', ({ playerId, cardType, action }) => {
        try {
            processCardAction(playerId, cardType, action);
        } catch (error) {
            gameStateManager.handleError(error, 'Card Action');
        }
    });
    
    /**
     * Process space effects when player lands on space
     */
    function processSpaceEffects(playerId, spaceData) {
        // Process time cost
        if (spaceData.Time) {
            const timeValue = parseInt(spaceData.Time.replace(/\D/g, '')) || 0;
            if (timeValue > 0) {
                updatePlayerTime(playerId, timeValue);
            }
        }
        
        // Process fee cost
        if (spaceData.Fee) {
            const feeValue = parseInt(spaceData.Fee.replace(/\D/g, '')) || 0;
            if (feeValue > 0) {
                gameStateManager.updatePlayerMoney(playerId, -feeValue, `${spaceData.space_name} fee`);
            }
        }
        
        // Process card actions
        const cardTypes = ComponentUtils.getCardTypes(spaceData);
        cardTypes.forEach(({ type, action }) => {
            if (action) {
                gameStateManager.emit('processCardAction', { playerId, cardType: type, action });
            }
        });
        
        // Check if dice roll required
        if (ComponentUtils.requiresDiceRoll(spaceData)) {
            gameStateManager.emit('showDiceRoll', { 
                playerId, 
                spaceName: spaceData.space_name,
                visitType: spaceData.visit_type 
            });
        } else {
            // Show movement options
            showMovementOptions(playerId, spaceData);
        }
    }
    
    /**
     * Process card actions (Draw, Replace, Remove, etc.)
     */
    function processCardAction(playerId, cardType, actionText) {
        console.log(`GameManager: processCardAction called with playerId=${playerId}, cardType=${cardType}, actionText="${actionText}"`);
        
        const action = ComponentUtils.parseCardAction(actionText);
        console.log(`GameManager: Parsed action:`, action);
        
        if (!action) {
            console.log('GameManager: No action parsed, returning');
            return;
        }
        
        switch (action.type) {
            case 'draw':
                drawCardsForPlayer(playerId, cardType, action.amount);
                break;
                
            case 'replace':
                replaceCardsForPlayer(playerId, cardType, action.amount);
                break;
                
            case 'remove':
                removeCardsFromPlayer(playerId, cardType, action.amount);
                break;
                
            default:
                // Custom action - emit for UI to handle
                gameStateManager.emit('customCardAction', { 
                    playerId, 
                    cardType, 
                    action: action.text 
                });
        }
    }
    
    /**
     * Draw random cards for player
     */
    function drawCardsForPlayer(playerId, cardType, amount) {
        console.log(`GameManager: drawCardsForPlayer called with playerId=${playerId}, cardType=${cardType}, amount=${amount}`);
        
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.error('GameManager: CSVDatabase not loaded for card drawing');
            return;
        }
        
        const availableCards = window.CSVDatabase.cards.byType(cardType);
        console.log(`GameManager: Found ${availableCards.length} available ${cardType} cards`);
        
        if (availableCards.length === 0) {
            console.error(`GameManager: No ${cardType} cards available`);
            throw new Error(`No ${cardType} cards available`);
        }
        
        const drawnCards = [];
        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            drawnCards.push(availableCards[randomIndex]);
        }
        
        console.log(`GameManager: Drew ${drawnCards.length} cards:`, drawnCards.map(c => c.card_name || c.card_id));
        
        gameStateManager.addCardsToPlayer(playerId, cardType, drawnCards);
        
        console.log(`GameManager: Added cards to player ${playerId}`);
        
        // Emit event for UI feedback
        gameStateManager.emit('cardsDrawnForPlayer', {
            playerId,
            cardType,
            cards: drawnCards,
            amount: drawnCards.length
        });
    }
    
    /**
     * Replace cards in player hand
     */
    function replaceCardsForPlayer(playerId, cardType, amount) {
        // For now, just remove and draw new ones
        removeCardsFromPlayer(playerId, cardType, amount);
        drawCardsForPlayer(playerId, cardType, amount);
    }
    
    /**
     * Remove cards from player hand
     */
    function removeCardsFromPlayer(playerId, cardType, amount) {
        const players = [...gameState.players];
        const player = players[playerId];
        
        if (!player || !player.cards[cardType]) return;
        
        const currentCards = player.cards[cardType];
        const removeCount = Math.min(amount, currentCards.length);
        
        if (removeCount > 0) {
            player.cards[cardType] = currentCards.slice(removeCount);
            gameStateManager.setState({ players });
            
            gameStateManager.emit('cardsRemovedFromPlayer', {
                player,
                cardType,
                amount: removeCount
            });
        }
    }
    
    /**
     * Process dice roll outcomes from CSV data
     */
    function processDiceOutcome(playerId, outcome, spaceName, visitType) {
        console.log(`GameManager: processDiceOutcome called with playerId=${playerId}, outcome="${outcome}", spaceName=${spaceName}, visitType=${visitType}`);
        
        if (!outcome || outcome === 'No change') {
            console.log('GameManager: No outcome to process or outcome is "No change"');
            return;
        }
        
        // Check if outcome is a card action
        if (outcome.includes('Draw') || outcome.includes('Replace') || outcome.includes('Remove')) {
            // Parse card action from outcome
            const cardType = ComponentUtils.parseCardTypeFromOutcome(outcome);
            console.log(`GameManager: Parsed card type "${cardType}" from outcome "${outcome}"`);
            
            if (cardType) {
                processCardAction(playerId, cardType, outcome);
            } else {
                // If no specific card type, default to drawing any type of card
                console.log(`GameManager: No specific card type found, defaulting to 'W' card for outcome "${outcome}"`);
                processCardAction(playerId, 'W', outcome);
            }
        }
        // Check if outcome is a movement instruction
        else if (outcome.includes(' or ')) {
            // Multiple space options - emit for player choice
            const spaceOptions = outcome.split(' or ').map(opt => opt.trim());
            gameStateManager.emit('showSpaceChoice', {
                playerId,
                spaceOptions,
                source: 'dice_outcome'
            });
        }
        // Check if outcome is a single space movement
        else if (outcome.includes('-')) {
            // Single space movement
            gameStateManager.emit('movePlayerRequest', {
                playerId,
                spaceName: outcome.trim(),
                visitType: 'First'
            });
        }
        // Check if outcome is a fee/percentage
        else if (outcome.includes('%')) {
            const percentage = parseFloat(outcome.replace('%', ''));
            gameStateManager.emit('applyFeePercentage', {
                playerId,
                percentage,
                source: `${spaceName} dice outcome`
            });
        }
        // Check if outcome is time-based
        else if (outcome.includes('day')) {
            const timeMatch = outcome.match(/(\d+)\s*day/);
            if (timeMatch) {
                const timeAmount = parseInt(timeMatch[1]);
                updatePlayerTime(playerId, timeAmount);
            }
        }
        
        // Emit generic outcome event for custom handling
        gameStateManager.emit('diceOutcomeProcessed', {
            playerId,
            outcome,
            spaceName,
            visitType
        });
    }
    
    /**
     * Show movement options from space data
     */
    function showMovementOptions(playerId, spaceData) {
        const nextSpaces = ComponentUtils.getNextSpaces(spaceData);
        
        if (nextSpaces.length === 0) {
            // No movement options - end turn
            gameStateManager.emit('noMovementOptions', { playerId, spaceData });
        } else if (nextSpaces.length === 1) {
            // Only one option - move automatically
            gameStateManager.emit('movePlayerRequest', {
                playerId,
                spaceName: nextSpaces[0],
                visitType: 'First'
            });
        } else {
            // Multiple options - let player choose
            gameStateManager.emit('showSpaceChoice', {
                playerId,
                spaceOptions: nextSpaces,
                source: 'space_movement'
            });
        }
    }
    
    /**
     * Update player time spent
     */
    function updatePlayerTime(playerId, timeAmount) {
        const players = [...gameState.players];
        const player = players[playerId];
        
        if (!player) return;
        
        const previousTime = player.timeSpent;
        player.timeSpent += timeAmount;
        
        gameStateManager.setState({ players });
        
        gameStateManager.emit('playerTimeChanged', {
            player,
            previousTime,
            newTime: player.timeSpent,
            change: timeAmount
        });
    }
    
    
    // GameManager is a logic-only component - no render
    return null;
}

// Export component
window.GameManager = GameManager;