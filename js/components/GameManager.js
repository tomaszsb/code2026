/**
 * GameManager - Core Game Logic Controller
 * Handles game state transitions and business logic
 * NO UI - pure logic component
 */

function GameManager() {
    const [gameState, gameStateManager] = useGameState();
    
    // Get singleton MovementEngine instance
    const [movementEngine] = React.useState(() => {
        const engine = window.MovementEngine.getInstance();
        engine.initialize(gameStateManager);
        return engine;
    });
    
    // Handle player movement
    useEventListener('movePlayerRequest', ({ playerId, spaceName, visitType }) => {
        try {
            // Check if CSVDatabase is loaded before accessing it
            if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
                throw new Error('CSVDatabase not loaded yet');
            }
            
            // Validate the space exists
            const spaceData = window.CSVDatabase.spaces.find(spaceName, visitType);
            if (!spaceData) {
                throw new Error(`Space ${spaceName}/${visitType} not found in CSV data`);
            }
            
            // Move player
            gameStateManager.movePlayer(playerId, spaceName, visitType);
            
            // Save snapshot AFTER movement but BEFORE space effects
            // This captures clean state when entering the space
            gameStateManager.savePlayerSnapshot(playerId);
            
            // Get player object for MovementEngine
            const player = gameState.players.find(p => p.id === playerId);
            if (player && movementEngine) {
                // Use MovementEngine for advanced space effect processing
                const currentSpaceData = movementEngine.getSpaceData(spaceName, visitType || 'First');
                if (currentSpaceData) {
                    movementEngine.applySpaceEffects(player, currentSpaceData, visitType || 'First');
                }
            } else {
                // Fallback to legacy space effects processing
                processSpaceEffects(playerId, spaceData);
            }
            
        } catch (error) {
            gameStateManager.handleError(error, 'Player Movement');
        }
    });
    
    // Handle dice roll outcomes
    useEventListener('diceRollComplete', ({ playerId, spaceName, visitType, rollValue }) => {
        try {
            const outcome = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
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
    
    // Handle card replacement execution
    useEventListener('executeCardReplacement', ({ playerId, cardType, cardIndices }) => {
        try {
            executeCardReplacement(playerId, cardType, cardIndices);
        } catch (error) {
            gameStateManager.handleError(error, 'Card Replacement');
        }
    });
    
    // Handle clearing cards added during turn (for negotiation)
    useEventListener('clearCardsAddedThisTurn', ({ playerId }) => {
        try {
            gameStateManager.clearCardsAddedThisTurn(playerId);
        } catch (error) {
            gameStateManager.handleError(error, 'Clear Cards');
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
        
        // Check if dice roll required FIRST
        if (ComponentUtils.requiresDiceRoll(spaceData.space_name, spaceData.visit_type || 'First')) {
            gameStateManager.emit('showDiceRoll', { 
                playerId, 
                spaceName: spaceData.space_name,
                visitType: spaceData.visit_type 
            });
        } else {
            // For spaces without dice rolls, show movement options immediately
            showMovementOptions(playerId, spaceData);
        }
        
        // Show available card actions for manual selection (regardless of dice requirement)
        const cardTypes = ComponentUtils.getCardTypes(spaceData.space_name, spaceData.visit_type || 'First');
        console.log(`GameManager: Found ${cardTypes.length} card actions for ${spaceData.space_name}:`, cardTypes);
        if (cardTypes.length > 0) {
            console.log(`GameManager: Emitting showCardActions for player ${playerId}`);
            gameStateManager.emit('showCardActions', {
                playerId,
                spaceName: spaceData.space_name,
                cardActions: cardTypes,
                spaceData: spaceData
            });
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
        
        const availableCards = window.CSVDatabase.cards.query({type: cardType});
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
     * Replace cards in player hand - triggers modal for card selection
     */
    function replaceCardsForPlayer(playerId, cardType, amount) {
        const players = gameState.players;
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.warn(`GameManager: Player ${playerId} not found for card replacement`);
            return;
        }
        
        // Initialize card array if it doesn't exist
        if (!player.cards[cardType]) {
            player.cards[cardType] = [];
        }
        
        // If player has no cards of this type, draw some first then allow replacement
        if (player.cards[cardType].length === 0) {
            console.log(`GameManager: Player has no ${cardType} cards, drawing ${amount} first`);
            drawCardsForPlayer(playerId, cardType, amount);
            
            // Show feedback
            if (window.InteractiveFeedback) {
                window.InteractiveFeedback.info(
                    `${player.name} drew ${amount} ${cardType} card${amount > 1 ? 's' : ''} to replace!`,
                    3000
                );
            }
            
            // Wait a moment for the draw to complete, then show replacement modal
            setTimeout(() => {
                gameStateManager.emit('showCardReplacementModal', {
                    playerId,
                    cardType,
                    amount,
                    playerCards: gameState.players.find(p => p.id === playerId).cards,
                    playerName: player.name
                });
            }, 100);
            return;
        }
        
        // Player has cards, show replacement modal directly
        gameStateManager.emit('showCardReplacementModal', {
            playerId,
            cardType,
            amount,
            playerCards: player.cards,
            playerName: player.name
        });
    }
    
    /**
     * Execute card replacement with specific card indices
     */
    function executeCardReplacement(playerId, cardType, cardIndices) {
        const players = [...gameState.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player || !player.cards[cardType]) return;
        
        const currentCards = player.cards[cardType];
        
        // Sort indices in descending order to avoid index shifting issues
        const sortedIndices = [...cardIndices].sort((a, b) => b - a);
        
        // Remove selected cards
        const removedCards = [];
        sortedIndices.forEach(index => {
            if (index >= 0 && index < currentCards.length) {
                removedCards.push(currentCards.splice(index, 1)[0]);
            }
        });
        
        // Draw new cards to replace them
        if (removedCards.length > 0) {
            drawCardsForPlayer(playerId, cardType, removedCards.length);
            
            gameStateManager.emit('cardsReplaced', {
                player,
                cardType,
                removedCards,
                newCardCount: removedCards.length
            });
            
            if (window.InteractiveFeedback) {
                window.InteractiveFeedback.success(
                    `${player.name} replaced ${removedCards.length} ${cardType} card${removedCards.length > 1 ? 's' : ''}!`,
                    3000
                );
            }
        }
    }
    
    /**
     * Remove cards from player hand
     */
    function removeCardsFromPlayer(playerId, cardType, amount) {
        const players = [...gameState.players];
        const player = players.find(p => p.id === playerId);
        
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
        
        // Note: Card actions are now shown immediately when landing on space
        // They should not be tied to dice outcomes
        
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
        const nextSpaces = ComponentUtils.getNextSpaces(spaceData.space_name, spaceData.visit_type || 'First');
        
        if (nextSpaces.length === 0) {
            // No movement options - end turn
            gameStateManager.emit('noMovementOptions', { playerId, spaceData });
        } else {
            // Let player choose their next move regardless of number of options
            // This prevents auto-movement and gives player control
            gameStateManager.emit('availableMovesUpdated', {
                playerId,
                availableMoves: nextSpaces,
                spaceData
            });
        }
    }
    
    /**
     * Update player time spent
     */
    function updatePlayerTime(playerId, timeAmount) {
        const players = [...gameState.players];
        const player = players.find(p => p.id === playerId);
        
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