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
            const spaceData = CSVDatabase.spaces.find(spaceName, visitType);
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
            const outcome = CSVDatabase.dice.getRollOutcome(spaceName, visitType, rollValue);
            if (outcome) {
                processDiceOutcome(playerId, outcome);
            }
        } catch (error) {
            gameStateManager.handleError(error, 'Dice Roll');
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
        }
    }
    
    /**
     * Process card actions (Draw, Replace, Remove, etc.)
     */
    function processCardAction(playerId, cardType, actionText) {
        const action = ComponentUtils.parseCardAction(actionText);
        if (!action) return;
        
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
        const availableCards = CSVDatabase.cards.byType(cardType);
        if (availableCards.length === 0) {
            throw new Error(`No ${cardType} cards available`);
        }
        
        const drawnCards = [];
        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            drawnCards.push(availableCards[randomIndex]);
        }
        
        gameStateManager.addCardsToPlayer(playerId, cardType, drawnCards);
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
    
    /**
     * Process dice roll outcomes
     */
    function processDiceOutcome(playerId, outcome) {
        // Dice outcomes vary by space - could be card actions, money, time, etc.
        if (outcome.includes('Draw')) {
            const match = outcome.match(/Draw (\d+)/);
            if (match) {
                // Default to W cards for basic draws
                drawCardsForPlayer(playerId, 'W', parseInt(match[1]));
            }
        } else {
            // Custom outcome - emit for UI to handle
            gameStateManager.emit('customDiceOutcome', { playerId, outcome });
        }
    }
    
    // GameManager is a logic-only component - no render
    return null;
}

// Export component
window.GameManager = GameManager;