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
            // Handle special cases
            if (!spaceName || spaceName === 'n/a' || spaceName === '{ORIGINAL_SPACE}') {
                // Skip invalid moves
                console.warn(`Skipping invalid move to: ${spaceName}`);
                return;
            }
            
            // Clean the space name
            const cleanSpaceName = ComponentUtils.cleanSpaceName(spaceName);
            
            // Validate the space exists
            const spaceData = window.CSVDatabase.spaces.find(cleanSpaceName, visitType);
            if (!spaceData) {
                throw new Error(`Space ${cleanSpaceName}/${visitType} not found in CSV data`);
            }
            
            // Move player
            gameStateManager.movePlayer(playerId, cleanSpaceName, visitType);
            
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
        const availableCards = window.CSVDatabase.cards.byType(cardType);
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
     * Process dice roll outcomes from CSV data
     */
    function processDiceOutcome(playerId, outcome, spaceName, visitType) {
        if (!outcome || outcome === 'No change') return;
        
        // Check if outcome is a card action
        if (outcome.includes('Draw') || outcome.includes('Replace') || outcome.includes('Remove')) {
            // Parse card action from outcome
            const cardType = ComponentUtils.parseCardTypeFromOutcome(outcome);
            if (cardType) {
                processCardAction(playerId, cardType, outcome);
            }
        }
        // Check if outcome is a movement instruction
        else if (outcome.includes(' or ')) {
            // Multiple space options - emit for player choice
            const spaceOptions = outcome.split(' or ').map(opt => opt.trim());
            // Filter out n/a options
            const validOptions = spaceOptions.filter(space => {
                const clean = ComponentUtils.cleanSpaceName(space);
                return clean && clean !== 'n/a';
            });
            
            if (validOptions.length > 0) {
                gameStateManager.emit('showSpaceChoice', {
                    playerId,
                    spaceOptions: validOptions,
                    source: 'dice_outcome'
                });
            }
        }
        // Check if outcome is a single space movement
        else if (outcome.includes('-')) {
            // Single space movement - clean the space name
            const cleanSpaceName = ComponentUtils.cleanSpaceName(outcome.trim());
            if (cleanSpaceName && cleanSpaceName !== 'n/a') {
                gameStateManager.emit('movePlayerRequest', {
                    playerId,
                    spaceName: cleanSpaceName,
                    visitType: 'First'
                });
            }
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
            const cleanSpaceName = ComponentUtils.cleanSpaceName(nextSpaces[0]);
            if (cleanSpaceName && cleanSpaceName !== 'n/a') {
                gameStateManager.emit('movePlayerRequest', {
                    playerId,
                    spaceName: cleanSpaceName,
                    visitType: 'First'
                });
            }
        } else {
            // Multiple options - let player choose
            // Filter out n/a options and provide both original and clean names
            const validSpaces = nextSpaces.filter(space => {
                const clean = ComponentUtils.cleanSpaceName(space);
                return clean && clean !== 'n/a';
            });
            
            if (validSpaces.length > 0) {
                gameStateManager.emit('showSpaceChoice', {
                    playerId,
                    spaceOptions: validSpaces,
                    source: 'space_movement'
                });
            }
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