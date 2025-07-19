/**
 * GameManager - Core Game Logic Controller
 * Handles game state transitions and business logic
 * NO UI - pure logic component
 */

function GameManager() {
    const [gameState, gameStateManager] = useGameState();
    
    // Handle fallback space effects processing (when MovementEngine not available)
    useEventListener('processSpaceEffectsFallback', ({ playerId, spaceData }) => {
        try {
            processSpaceEffects(playerId, spaceData);
        } catch (error) {
            gameStateManager.handleError(error, 'Space Effects Fallback');
        }
    });
    
    // Handle movement to space requests
    useEventListener('movePlayerToSpace', ({ playerId, destination, visitType }) => {
        try {
            gameStateManager.emit('movePlayerRequest', {
                playerId,
                spaceName: destination,
                visitType: visitType || 'First'
            });
        } catch (error) {
            gameStateManager.handleError(error, 'Move Player To Space');
        }
    });
    
    // Handle dice outcome processing
    useEventListener('processDiceOutcome', ({ playerId, outcome, cardType, spaceName, visitType }) => {
        try {
            processDiceOutcome(playerId, outcome, cardType, spaceName, visitType);
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
    
    // Handle using cards from hand
    useEventListener('useCard', ({ playerId, cardType, cardId, card }) => {
        try {
            gameStateManager.useCard(playerId, cardType, cardId, card);
        } catch (error) {
            gameStateManager.handleError(error, 'Use Card');
        }
    });
    
    // Handle time changes (for negotiation penalties, etc.)
    useEventListener('timeChanged', ({ playerId, amount, source }) => {
        try {
            const playerBefore = gameState.players.find(p => p.id === playerId);
            
            updatePlayerTime(playerId, amount);
            
            const playerAfter = gameState.players.find(p => p.id === playerId);
        } catch (error) {
            console.error('GameManager: Error in timeChanged handler:', error);
            gameStateManager.handleError(error, 'Time Change');
        }
    });
    
    // Handle money changes (for E-card costs and other money effects)
    useEventListener('moneyChanged', ({ playerId, amount, source }) => {
        try {
            gameStateManager.updatePlayerMoney(playerId, amount, source);
        } catch (error) {
            gameStateManager.handleError(error, 'Money Change');
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
        if (cardTypes.length > 0) {
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
        
        const action = ComponentUtils.parseCardAction(actionText);
        
        if (!action) {
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
        
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.error('GameManager: CSVDatabase not loaded for card drawing');
            return;
        }
        
        const availableCards = window.CSVDatabase.cards.query({card_type: cardType});
        
        if (availableCards.length === 0) {
            console.error(`GameManager: No ${cardType} cards available`);
            throw new Error(`No ${cardType} cards available`);
        }
        
        const drawnCards = [];
        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            drawnCards.push(availableCards[randomIndex]);
        }
        
        
        gameStateManager.addCardsToPlayer(playerId, cardType, drawnCards);
        
        
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
    function processDiceOutcome(playerId, outcome, cardType, spaceName, visitType) {
        
        if (!outcome || outcome === 'No change') {
            return;
        }
        
        // Check if outcome is a card action
        if (outcome.includes('Draw') || outcome.includes('Replace') || outcome.includes('Remove')) {
            // Use the provided cardType if available, otherwise parse from outcome
            const effectiveCardType = cardType || ComponentUtils.parseCardTypeFromOutcome(outcome);
            
            if (effectiveCardType) {
                processCardAction(playerId, effectiveCardType, outcome);
            } else {
                // If no specific card type, default to drawing any type of card
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
        // Delegate to GameInitializer if available, otherwise use local logic
        if (window.GameInitializer && window.GameInitializer.showMovementOptions) {
            window.GameInitializer.showMovementOptions(playerId, spaceData);
        } else {
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
    }
    
    /**
     * Update player time spent
     */
    function updatePlayerTime(playerId, timeAmount) {
        
        const players = [...gameState.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error(`GameManager: Player ${playerId} not found in updatePlayerTime`);
            return;
        }
        
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
    
    // Debug function for testing specific cards
    window.giveCardToPlayer = (cardId, playerId) => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.error('CSVDatabase not loaded. Cannot give card.');
            return;
        }
        
        // Use correct CSVDatabase API - cards.find() with filter object
        const card = window.CSVDatabase.cards.find({ card_id: cardId });
        if (card) {
            // Determine card type and add to player
            gameStateManager.addCardsToPlayer(playerId, card.card_type, [card]);
            console.log(`Successfully gave card "${cardId}" (${card.card_name}) to ${playerId}.`);
        } else {
            console.error(`Card with ID "${cardId}" not found in CSVDatabase.`);
        }
    };
    
    
    // GameManager is a logic-only component - no render
    return null;
}

// Export component
window.GameManager = GameManager;