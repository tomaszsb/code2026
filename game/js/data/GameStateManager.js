/**
 * GameStateManager - Central State & Event System
 * Clean event-driven architecture for component communication
 * 
 * Architecture principles:
 * - All state changes go through this manager
 * - Components communicate only via events
 * - No direct component-to-component calls
 * - Immutable state updates
 */

class GameStateManager {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.debug = false;
        this.eventHistory = [];
        
        // Event listeners
        this.on('turnEnded', (event) => this.endTurn(event.playerId));
        this.on('playerActionTaken', (event) => this.handlePlayerAction(event));
    }

    /**
     * Initial game state structure
     */
    getInitialState() {
        return {
            gamePhase: 'SETUP',
            currentPlayer: 0,
            turnCount: 0,
            players: [],
            currentTurn: {
                playerId: null,
                turnNumber: 0,
                phase: 'SETUP', // 'SETUP', 'ACTIONS', 'COMPLETED'
                requiredActions: [],
                completedActions: [],
                actionCounts: {
                    required: 0,
                    completed: 0
                },
                canEndTurn: false,
                lastActionTimestamp: null
            },
            gameSettings: {
                maxPlayers: 4,
                winCondition: 'TIME_AND_MONEY',
                debugMode: false
            },
            ui: {
                activeModal: null,
                showingSpace: null,
                diceRolling: false,
                loading: false
            },
            error: null,
            lastAction: null
        };
    }

    /**
     * EVENT SYSTEM
     */

    /**
     * Subscribe to events
     */
    on(eventName, callback, context = null) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        
        const listener = { callback, context };
        this.listeners.get(eventName).push(listener);
        
        this.log(`Listener added for event: ${eventName}`);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Unsubscribe from events
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            return;
        }
        
        const listeners = this.listeners.get(eventName);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            this.log(`Listener removed for event: ${eventName}`);
        }
    }

    /**
     * Emit events to all listeners
     */
    emit(eventName, data = null) {
        this.log(`Emitting event: ${eventName}`, data);
        
        // Add to event history for debugging
        if (this.debug) {
            this.eventHistory.push({
                event: eventName,
                data,
                timestamp: Date.now(),
                state: this.getState()
            });
        }
        
        if (!this.listeners.has(eventName)) {
            return;
        }
        
        const listeners = this.listeners.get(eventName);
        listeners.forEach(({ callback, context }, index) => {
            try {
                if (context) {
                    callback.call(context, data);
                } else {
                    callback(data);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
                this.setState({ error: error.message });
            }
        });
    }

    /**
     * STATE MANAGEMENT
     */

    /**
     * Get current state (immutable)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Update state and emit stateChanged event
     */
    setState(updates) {
        const previousState = this.getState();
        
        // Merge updates with existing state
        this.state = this.deepMerge(this.state, updates);
        
        this.log('State updated:', updates);
        
        // Emit state change event
        this.emit('stateChanged', {
            previous: previousState,
            current: this.getState(),
            updates
        });
    }

    /**
     * Deep merge utility for state updates
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * SYSTEMIC FIX: Immutable player update helper method
     * Creates new player object and updates players array with new references
     */
    updatePlayer(playerId, playerUpdates) {
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            throw new Error(`Player ${playerId} not found`);
        }

        const currentPlayer = this.state.players[playerIndex];
        
        // Create completely new player object with updates
        const updatedPlayer = {
            ...currentPlayer,
            ...playerUpdates
        };

        // Create new players array with updated player
        const players = [
            ...this.state.players.slice(0, playerIndex),
            updatedPlayer,
            ...this.state.players.slice(playerIndex + 1)
        ];

        // Update state with new players array
        this.setState({ players });
        
        return updatedPlayer;
    }

    getStartingSpace() {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            return 'OWNER-SCOPE-INITIATION'; // fallback
        }
        
        const startingSpace = window.CSVDatabase.gameConfig.query()
            .find(config => config.is_starting_space === 'Yes');
        
        return startingSpace ? startingSpace.space_name : 'OWNER-SCOPE-INITIATION';
    }

    /**
     * GAME STATE ACTIONS
     */

    /**
     * Initialize new game
     */
    initializeGame(players, settings = {}) {
        
        const newGameState = {
            ...this.getInitialState(),
            gamePhase: 'PLAYING', // Transition from SETUP to PLAYING
            currentPlayer: players[0]?.id || 0, // CRITICAL FIX: Use first player's actual ID
            players: players.map((playerData, index) => ({
                id: playerData.id || index,
                name: typeof playerData === 'string' ? playerData : playerData.name,
                color: typeof playerData === 'string' ? '#007bff' : playerData.color,
                avatar: playerData.avatar || '👤',
                position: playerData.position || 'OWNER-SCOPE-INITIATION',
                visitType: playerData.visitType || 'First',
                money: playerData.money,
                timeSpent: playerData.timeSpent || 0,
                cards: {
                    W: [],
                    B: [],
                    I: [],
                    L: [],
                    E: []
                },
                loans: [],
                completedSpaces: [],
                visitedSpaces: playerData.visitedSpaces || [],
                skipNextTurn: false,
                isActive: index === 0
            })),
            gameSettings: { ...this.state.gameSettings, ...settings }
        };
        
        // Use setState to ensure proper event emission and state change event
        this.setState(newGameState);
        
        // Save initial snapshots for all players at their starting positions
        this.state.players.forEach((player) => {
            this.savePlayerSnapshot(player.id);
        });
        
        // Emit game initialized event (stateChanged already emitted by setState)
        // Add small delay to ensure React can process the state change
        setTimeout(() => {
            this.emit('gameInitialized', this.getState());
            // Initialize turn actions for the first player
            this.initializeTurnActions(players[0]?.id || 0);
            // Emit gameReady event for TurnControls initialization
            this.emit('gameReady', { gameState: this.getState() });
        }, 0);
    }

    /**
     * Start player turn
     */
    startTurn(playerId, fromNegotiation = false) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        this.setState({
            currentPlayer: playerId,
            lastAction: null
        });

        this.emit('turnStarted', { player, turnCount: this.state.turnCount, fromNegotiation });
        
        // Initialize turn actions for the current player
        this.initializeTurnActions(playerId);
    }

    /**
     * End current turn and advance to next player
     */
    endTurn(playerId) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        // Find next player
        const currentIndex = this.state.players.findIndex(p => p.id === playerId);
        let nextIndex = (currentIndex + 1) % this.state.players.length;
        let nextPlayer = this.state.players[nextIndex];
        
        // Determine if we're starting a new game round
        // A new round starts when we advance to the first player (index 0)
        let newTurnCount = this.state.turnCount;
        let isNewRound = nextIndex === 0;

        // Check if next player should skip their turn
        if (nextPlayer.skipNextTurn) {
            // Reset skip flag and advance to following player
            this.updatePlayer(nextPlayer.id, { skipNextTurn: false });
            const afterNextIndex = (nextIndex + 1) % this.state.players.length;
            const afterNextPlayer = this.state.players[afterNextIndex];
            nextPlayer = afterNextPlayer;
            
            // Update round logic: if we skipped past the first player, it's still a new round
            if (nextIndex === 0 || afterNextIndex === 0) {
                isNewRound = true;
            }
        }
        
        // Increment turn counter only for new game rounds
        if (isNewRound) {
            newTurnCount += 1;
        }

        this.setState({
            currentPlayer: nextPlayer.id,
            turnCount: newTurnCount,
            lastAction: `${player.name} ended their turn`
        });

        // Emit AFTER state is updated, using actual state value
        this.emit('turnAdvanced', { 
            previousPlayer: player, 
            currentPlayer: nextPlayer,
            turnCount: this.state.turnCount
        });

        // Initialize turn actions for the new current player
        this.initializeTurnActions(nextPlayer.id);
    }

    /**
     * Save player state snapshot when entering a space (for negotiation)
     */
    savePlayerSnapshot(playerId) {
        const players = [...this.state.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error(`GameStateManager: Player ${playerId} not found for snapshot`);
            return;
        }

        // Save a deep copy of the player state
        player.spaceEntrySnapshot = {
            cards: player.cards ? JSON.parse(JSON.stringify(player.cards)) : {},
            money: player.money,
            timeSpent: player.timeSpent,
            scope: player.scope ? JSON.parse(JSON.stringify(player.scope)) : null,
            scopeItems: player.scopeItems ? JSON.parse(JSON.stringify(player.scopeItems)) : [],
            scopeTotalCost: player.scopeTotalCost || 0
        };

        
        this.setState({ players });
    }

    /**
     * Move player to new space
     */
    movePlayer(playerId, spaceName, visitType = 'First', returnMessage = false) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            throw new Error(`Player ${playerId} not found`);
        }

        const previousPosition = currentPlayer.position;
        
        // Use helper method to create new player object
        const updatedPlayer = this.updatePlayer(playerId, {
            position: spaceName,
            visitType: visitType
        });
        
        this.emit('playerMoved', {
            player: updatedPlayer,
            previousPosition,
            newPosition: spaceName,
            visitType
        });
        
        // NEW: Return user-friendly message if requested
        if (returnMessage) {
            return `Moved to ${spaceName}`;
        }
    }

    /**
     * Update player money
     */
    updatePlayerMoney(playerId, amount, reason = '', returnMessage = false) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            throw new Error(`Player ${playerId} not found`);
        }

        const previousAmount = currentPlayer.money || 0;
        const newAmount = previousAmount + amount;

        // Use helper method to create new player object
        const updatedPlayer = this.updatePlayer(playerId, {
            money: newAmount
        });
        
        this.emit('playerMoneyChanged', {
            player: updatedPlayer,
            previousAmount,
            newAmount,
            change: amount,
            reason
        });
        
        // NEW: Return user-friendly message if requested
        if (returnMessage) {
            if (amount > 0) {
                return `Gained $${amount.toLocaleString()}`;
            } else {
                return `Spent $${Math.abs(amount).toLocaleString()}`;
            }
        }
    }

    /**
     * Update player time spent - Explicit immutable implementation
     */
    updatePlayerTime(playerId, amount, reason = '', returnMessage = false) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            throw new Error(`Player ${playerId} not found`);
        }

        const previousAmount = currentPlayer.timeSpent || 0;
        const newAmount = previousAmount + amount;
        
        // Use helper method to create new player object
        const updatedPlayer = this.updatePlayer(playerId, {
            timeSpent: newAmount
        });
        
        this.emit('playerTimeChanged', {
            player: updatedPlayer,
            previousAmount,
            newAmount: updatedPlayer.timeSpent,
            change: amount,
            reason
        });
        
        // NEW: Return user-friendly message if requested
        if (returnMessage) {
            const dayLabel = Math.abs(amount) === 1 ? 'day' : 'days';
            if (amount > 0) {
                return `Spent ${amount} ${dayLabel}`;
            } else {
                return `Saved ${Math.abs(amount)} ${dayLabel}`;
            }
        }
    }

    /**
     * Add cards to player hand
     */
    addCardsToPlayer(playerId, cardType, cards, returnMessage = false) {
        
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            console.error(`GameStateManager: Player ${playerId} not found`);
            throw new Error(`Player ${playerId} not found`);
        }

        const currentPlayer = this.state.players[playerIndex];
        const cardsToAdd = Array.isArray(cards) ? cards : [cards];

        // --- Start of Immutable Update Logic ---

        // 1. Calculate all potential changes first
        let newMoney = currentPlayer.money || 0;
        let newTimeSpent = currentPlayer.timeSpent || 0;

        if (cardType !== 'E') {
            cardsToAdd.forEach(card => {
                newMoney += parseInt(card.loan_amount || 0);
                newMoney += parseInt(card.investment_amount || 0);
                newMoney += parseInt(card.money_effect || 0);
                newTimeSpent += parseInt(card.time_effect || 0);
            });
        }

        const newCardsForType = [...(currentPlayer.cards?.[cardType] || []), ...cardsToAdd];
        const allWCards = cardType === 'W' ? newCardsForType : (currentPlayer.cards?.W || []);
        const { scopeItems, scopeTotalCost } = this.calculatePlayerScope(allWCards);

        // 2. Create the single, new, updated player object
        const updatedPlayer = {
            ...currentPlayer,
            money: newMoney,
            timeSpent: newTimeSpent,
            cards: {
                ...currentPlayer.cards,
                [cardType]: newCardsForType
            },
            scopeItems: scopeItems,
            scopeTotalCost: scopeTotalCost
        };

        // 3. Create the new players array
        const players = [
            ...this.state.players.slice(0, playerIndex),
            updatedPlayer,
            ...this.state.players.slice(playerIndex + 1)
        ];

        // --- End of Immutable Update Logic ---
        // Note: Effects are already calculated in the first phase above
        // No duplicate processing needed here
        
        // Update player scope if W cards were added
        if (cardType === 'W') {
            const { scopeItems, scopeTotalCost } = this.calculatePlayerScope(updatedPlayer.cards.W);
            updatedPlayer.scopeItems = scopeItems;
            updatedPlayer.scopeTotalCost = scopeTotalCost;
        }

        
        this.setState({ players });
        
        
        this.emit('cardsAddedToPlayer', {
            player: updatedPlayer,
            cardType,
            cards: cardsToAdd,
            totalCards: updatedPlayer.cards[cardType].length
        });
        
        // NEW: Return user-friendly message if requested
        if (returnMessage) {
            const cardLabel = cardsToAdd.length === 1 ? 'card' : 'cards';
            const cardTypeName = window.CardUtils ? 
                window.CardUtils.getCardTypeConfig(cardType)?.name || cardType : 
                cardType;
            return `Drew ${cardsToAdd.length} ${cardTypeName} ${cardLabel}`;
        }
    }

    /**
     * Clear cards added during current turn (for negotiation)
     */
    /**
     * Restore player state to space entry snapshot and apply time penalty (negotiation)
     */
    restorePlayerSnapshot(playerId, timePenalty = null) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            console.error(`GameStateManager: Player ${playerId} not found`);
            return;
        }

        if (!currentPlayer.spaceEntrySnapshot) {
            console.warn(`GameStateManager: No snapshot found for player ${playerId}, cannot restore`);
            return;
        }

        const snapshot = currentPlayer.spaceEntrySnapshot;

        // Get current space time cost for penalty if not provided
        let actualTimePenalty = timePenalty;
        if (actualTimePenalty === null && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaceEffects.find(
                currentPlayer.position, 
                currentPlayer.visitType || 'First'
            );
            if (currentSpaceData && currentSpaceData.Time) {
                actualTimePenalty = parseInt(currentSpaceData.Time.replace(/\D/g, '')) || 1;
            } else {
                actualTimePenalty = 1; // Default fallback
            }
        }
        
        if (actualTimePenalty === null) {
            actualTimePenalty = 1; // Fallback if CSV not available
        }

        // Restore player state from snapshot using immutable update
        const restoredPlayer = this.updatePlayer(playerId, {
            cards: JSON.parse(JSON.stringify(snapshot.cards)),
            money: snapshot.money,
            scope: snapshot.scope ? JSON.parse(JSON.stringify(snapshot.scope)) : null,
            scopeItems: snapshot.scopeItems ? JSON.parse(JSON.stringify(snapshot.scopeItems)) : [],
            scopeTotalCost: snapshot.scopeTotalCost || 0,
            // Apply time penalty for negotiation (add to current time, don't reset to snapshot time)
            timeSpent: currentPlayer.timeSpent + actualTimePenalty
        });
        
        this.emit('playerStateRestored', {
            player: restoredPlayer,
            timePenalty: actualTimePenalty,
            reason: 'Negotiation - state restored with time penalty'
        });
        
    }

    // Legacy method name for compatibility
    clearCardsAddedThisTurn(playerId) {
        this.restorePlayerSnapshot(playerId);
    }

    /**
     * Remove card from player's hand when used
     */
    useCard(playerId, cardType, cardId, card) {
        
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            console.error(`GameStateManager: Player ${playerId} not found for card usage`);
            return;
        }
        
        if (!currentPlayer.cards || !currentPlayer.cards[cardType]) {
            console.error(`GameStateManager: No ${cardType} cards found for player ${playerId}`);
            return;
        }
        
        // Find and remove the card from hand
        const cardIndex = currentPlayer.cards[cardType].findIndex(c => c.card_id === cardId);
        if (cardIndex >= 0) {
            // Create immutable update with card removed
            const updatedCards = { ...currentPlayer.cards };
            updatedCards[cardType] = [...currentPlayer.cards[cardType]];
            updatedCards[cardType].splice(cardIndex, 1);
            
            const updatedPlayer = this.updatePlayer(playerId, { cards: updatedCards });
            this.emit('cardUsed', { playerId, cardType, cardId, card });
        } else {
            console.error(`GameStateManager: Card ${cardId} not found in player ${playerId}'s ${cardType} cards`);
        }
    }

    /**
     * Find card in player's hand by card ID
     */
    findCardInPlayerHand(player, cardId) {
        if (!player || !player.cards) {
            return null;
        }
        
        // Search through all card types
        for (const cardType of ['W', 'B', 'I', 'L', 'E']) {
            if (player.cards[cardType]) {
                const card = player.cards[cardType].find(c => c.card_id === cardId);
                if (card) {
                    return { card, cardType };
                }
            }
        }
        
        return null;
    }

    /**
     * Remove card from player's hand (helper method)
     */
    removeCardFromHand(playerId, cardId) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            console.error(`GameStateManager: Player ${playerId} not found for card removal`);
            return false;
        }
        
        const cardResult = this.findCardInPlayerHand(currentPlayer, cardId);
        if (!cardResult) {
            console.error(`GameStateManager: Card ${cardId} not found in player ${playerId}'s hand`);
            return false;
        }
        
        const { cardType } = cardResult;
        const cardIndex = currentPlayer.cards[cardType].findIndex(c => c.card_id === cardId);
        
        if (cardIndex >= 0) {
            // Create immutable update with card removed
            const updatedCards = { ...currentPlayer.cards };
            updatedCards[cardType] = [...currentPlayer.cards[cardType]];
            updatedCards[cardType].splice(cardIndex, 1);
            
            this.updatePlayer(playerId, { cards: updatedCards });
            return true;
        }
        
        return false;
    }

    /**
     * ARCHITECTURE SAFETY NOTE:
     * This method ONLY calls card-specific EffectsEngine methods that 
     * properly delegate to GameStateManager. It NEVER calls space effect 
     * methods that perform direct state mutation.
     * 
     * Use player card with effects processing through EffectsEngine
     * Returns user-friendly message for UI feedback
     */
    usePlayerCard(playerId, cardId) {
        try {
            // 1. Validation & Card Lookup
            const player = this.state.players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found`);
            }
            
            const cardResult = this.findCardInPlayerHand(player, cardId);
            if (!cardResult) {
                throw new Error(`Card ${cardId} not found in player's hand`);
            }
            
            const { card, cardType } = cardResult;
            
            // Ensure EffectsEngine is available
            if (!window.EffectsEngine) {
                throw new Error('EffectsEngine not available');
            }
            
            // 2. SAFE ROUTING - Route by actual card mechanic from immediate_effect column
            let result;
            switch (card.immediate_effect) {
                case 'Apply Work':
                    result = window.EffectsEngine.applyWorkEffect(card, playerId);
                    break;
                case 'Apply Loan':
                    result = window.EffectsEngine.applyLoanEffect(card, playerId);
                    break;
                case 'Apply Investment':
                    result = window.EffectsEngine.applyInvestmentEffect(card, playerId);
                    break;
                case 'Apply Life Balance':
                    result = window.EffectsEngine.applyLifeBalanceEffect(card, playerId);
                    break;
                case 'Apply Efficiency':
                    result = window.EffectsEngine.applyEfficiencyEffect(card, playerId);
                    break;
                case 'Apply Card':
                    result = window.EffectsEngine.applyCardEffect(card, playerId);
                    break;
                default:
                    throw new Error(`Unknown immediate effect: ${card.immediate_effect}`);
            }
            
            // 3. Validate effect result
            if (!result || !result.success) {
                throw new Error(result?.reason || 'Card effect failed');
            }
            
            // 4. Remove card from hand & emit events
            const removed = this.removeCardFromHand(playerId, cardId);
            if (!removed) {
                throw new Error('Failed to remove card from hand');
            }
            
            this.emit('cardUsed', { playerId, card, cardType, result });
            
            // Emit standardized player action taken event
            this.emit('playerActionTaken', {
                playerId: playerId,
                actionType: 'card',
                actionData: {
                    cardId: cardId,
                    cardType: cardType,
                    cardName: card.card_name || `${cardType} Card`,
                    effectResult: result
                },
                timestamp: Date.now(),
                spaceName: this.state.players.find(p => p.id === playerId)?.position,
                visitType: this.state.players.find(p => p.id === playerId)?.visitType || 'First'
            });
            
            // 5. Return user-friendly message
            const cardName = card.card_name || `${cardType} Card`;
            const effectDescription = this.formatEffectResult(result, cardType);
            
            this.log(`Successfully used card: ${cardName} for player ${playerId}`);
            return `Used ${cardName}: ${effectDescription}`;
            
        } catch (error) {
            console.error('Error in usePlayerCard:', error);
            this.handleError(error, 'usePlayerCard');
            return `Failed to use card: ${error.message}`;
        }
    }

    /**
     * Format effect result for user-friendly display
     */
    formatEffectResult(result, cardType) {
        switch (result.action) {
            case 'work_added_to_scope':
                return `Added $${result.workCost?.toLocaleString()} ${result.workType} to project scope`;
            case 'loan_amount_added':
                return `Received $${result.loanAmount?.toLocaleString()} loan`;
            case 'investment_amount_added':
                return `Received $${result.investmentAmount?.toLocaleString()} investment`;
            case 'life_balance_time_adjusted':
                const timeDesc = result.timeEffect > 0 ? 'Added' : 'Saved';
                const days = Math.abs(result.timeEffect);
                const dayLabel = days === 1 ? 'day' : 'days';
                return `${timeDesc} ${days} ${dayLabel}`;
            case 'efficiency_effects_applied':
                return result.effects?.map(e => e.description).join(', ') || 'Applied efficiency effects';
            default:
                return result.note || 'Effect applied';
        }
    }

    /**
     * UI STATE MANAGEMENT
     */

    /**
     * Show modal
     */
    showModal(modalName, data = null) {
        this.setState({
            ui: {
                ...this.state.ui,
                activeModal: modalName
            }
        });
        
        this.emit('modalShown', { modal: modalName, data });
    }

    /**
     * Hide modal
     */
    hideModal() {
        const previousModal = this.state.ui.activeModal;
        
        this.setState({
            ui: {
                ...this.state.ui,
                activeModal: null
            }
        });
        
        this.emit('modalHidden', { previousModal });
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        this.setState({
            ui: {
                ...this.state.ui,
                loading: isLoading
            }
        });
        
        this.emit('loadingChanged', { loading: isLoading });
    }

    /**
     * ERROR HANDLING
     */

    /**
     * Handle error
     */
    handleError(error, context = '') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.setState({ error: errorMessage });
        
        this.emit('errorOccurred', {
            error: errorMessage,
            context,
            timestamp: Date.now()
        });
        
        console.error(`GameStateManager Error (${context}):`, error);
    }

    /**
     * Clear error
     */
    clearError() {
        this.setState({ error: null });
        this.emit('errorCleared');
    }

    /**
     * DEBUGGING UTILITIES
     */

    /**
     * Add work to player scope (additive, not recalculated)
     */
    addWorkToPlayerScope(playerId, workCost, workType, returnMessage = false) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer) {
            throw new Error(`Player ${playerId} not found`);
        }
        
        // Initialize scope tracking with defaults
        const currentScopeItems = currentPlayer.scopeItems || [];
        const currentScopeTotalCost = currentPlayer.scopeTotalCost || 0;
        
        // Create new scopeItems array with immutable update
        const existingItemIndex = currentScopeItems.findIndex(item => item.workType === workType);
        let newScopeItems;
        
        if (existingItemIndex !== -1) {
            // Update existing item immutably
            newScopeItems = [
                ...currentScopeItems.slice(0, existingItemIndex),
                {
                    ...currentScopeItems[existingItemIndex],
                    cost: currentScopeItems[existingItemIndex].cost + workCost,
                    count: currentScopeItems[existingItemIndex].count + 1
                },
                ...currentScopeItems.slice(existingItemIndex + 1)
            ];
        } else {
            // Add new item immutably
            newScopeItems = [
                ...currentScopeItems,
                {
                    workType: workType,
                    cost: workCost,
                    count: 1
                }
            ];
        }
        
        // Use helper method to create new player object
        const updatedPlayer = this.updatePlayer(playerId, {
            scopeItems: newScopeItems,
            scopeTotalCost: currentScopeTotalCost + workCost
        });
        
        this.emit('playerScopeChanged', { player: updatedPlayer, workCost, workType });
        
        if (returnMessage) {
            return `Added $${workCost.toLocaleString()} ${workType} to project scope`;
        }
        
        return {
            success: true,
            action: 'work_added_to_scope',
            workCost: workCost,
            workType: workType,
            newScopeTotal: player.scopeTotalCost
        };
    }

    /**
     * Force player to discard cards
     */
    forcePlayerDiscard(playerId, cardCount, cardTypeFilter = null) {
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        
        if (!currentPlayer || !currentPlayer.cards) {
            throw new Error(`Player ${playerId} not found or has no cards`);
        }
        
        const discardedCards = [];
        let remainingToDiscard = cardCount;
        const updatedCards = { ...currentPlayer.cards };
        
        // Get eligible cards for discard
        const cardTypes = cardTypeFilter ? [cardTypeFilter] : ['W', 'B', 'I', 'L', 'E'];
        
        for (const cardType of cardTypes) {
            const cards = updatedCards[cardType] || [];
            const toDiscard = Math.min(remainingToDiscard, cards.length);
            
            if (toDiscard > 0) {
                // Create immutable copy of cards array
                updatedCards[cardType] = [...cards];
                const discarded = updatedCards[cardType].splice(0, toDiscard);
                discardedCards.push(...discarded);
                remainingToDiscard -= toDiscard;
            }
            
            if (remainingToDiscard === 0) break;
        }
        
        const updatedPlayer = this.updatePlayer(playerId, { cards: updatedCards });
        this.emit('playerCardsDiscarded', { player: updatedPlayer, discardedCards, cardTypeFilter });
        
        const filterText = cardTypeFilter ? ` ${cardTypeFilter}` : '';
        return `Discarded ${discardedCards.length}${filterText} cards`;
    }

    /**
     * Calculate player scope based on W cards. PURE IMMUTABLE FUNCTION.
     * @returns {{scopeItems: Array, scopeTotalCost: number}}
     */
    calculatePlayerScope(wCards = []) {
        let totalCost = 0;
        const scopeMap = new Map();

        wCards.forEach(card => {
            const workType = card.work_type_restriction || 'General Construction';
            const workCost = parseInt(card.work_cost) || 0;
            totalCost += workCost;

            const existingItem = scopeMap.get(workType);
            if (existingItem) {
                // Create a new object instead of mutating
                scopeMap.set(workType, {
                    ...existingItem,
                    cost: existingItem.cost + workCost,
                    count: existingItem.count + 1
                });
            } else {
                scopeMap.set(workType, {
                    workType: workType,
                    cost: workCost,
                    count: 1
                });
            }
        });

        // Convert map back to array of objects
        const scopeItems = Array.from(scopeMap.values());
        return { scopeItems, scopeTotalCost: totalCost };
    }

    // updatePlayerScope removed - replaced by calculatePlayerScope for immutable operations

    /**
     * Enable/disable debug mode
     */
    setDebug(enabled) {
        this.debug = enabled;
        this.setState({
            gameSettings: {
                ...this.state.gameSettings,
                debugMode: enabled
            }
        });
    }

    /**
     * Get event history (debug only)
     */
    getEventHistory() {
        return [...this.eventHistory];
    }

    /**
     * Log debug messages
     */
    log(message, data = null) {
        if (this.debug) {
            if (data) {
            } else {
            }
        }
    }

    /**
     * SPACE EFFECTS PROCESSING (NEW)
     */

    /**
     * Get space effects from CSV database for a specific space and visit type
     */
    getSpaceEffects(spaceName, visitType = 'First') {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            this.log('CSV Database not loaded, no space effects available');
            return [];
        }

        try {
            const effects = window.CSVDatabase.spaceEffects.query({
                space_name: spaceName,
                visit_type: visitType
            });
            
            this.log(`Found ${effects.length} space effects for ${spaceName}/${visitType}`);
            return effects || [];
        } catch (error) {
            console.error('Error querying space effects:', error);
            return [];
        }
    }

    /**
     * Process a single space effect through appropriate GameStateManager method
     * Returns effect message for UI feedback
     */
    processSpaceEffect(playerId, effect) {
        try {
            switch (effect.effect_type) {
                case 'e_cards': {
                    const cardType = effect.card_type || 'W';
                    const amount = parseInt(effect.effect_value) || 1;
                    
                    // Generate card objects matching FixedApp.js pattern
                    const cards = [];
                    for (let i = 0; i < amount; i++) {
                        cards.push({
                            id: Date.now() + Math.random(), // Ensure uniqueness
                            card_id: `generated_${Date.now()}_${i}`,
                            type: cardType,
                            drawnAt: effect.space || 'unknown'
                        });
                    }
                    
                    // Add cards through existing method with message return
                    return this.addCardsToPlayer(playerId, cardType, cards, true);
                }
                
                case 'time': {
                    const timeAmount = parseInt(effect.effect_value) || 0;
                    return this.updatePlayerTime(playerId, timeAmount, `Space effect: ${effect.space}`, true);
                }
                
                case 'e_money': {
                    const moneyAmount = parseInt(effect.effect_value) || 0;
                    return this.updatePlayerMoney(playerId, moneyAmount, `Space effect: ${effect.space}`, true);
                }
                
                default:
                    this.log(`Unknown effect type: ${effect.effect_type}`);
                    return null;
            }
        } catch (error) {
            console.error('Error processing space effect:', error);
            return `Error applying ${effect.effect_type} effect`;
        }
    }

    /**
     * Process all space effects for a player at a specific space
     * Returns array of effect messages for UI feedback
     */
    processAllSpaceEffects(playerId, spaceName, visitType = 'First') {
        const effects = this.getSpaceEffects(spaceName, visitType);
        const effectMessages = [];
        
        this.log(`Processing ${effects.length} space effects for player ${playerId} at ${spaceName}`);
        
        effects.forEach((effect, index) => {
            this.log(`Processing effect ${index + 1}:`, effect);
            
            const message = this.processSpaceEffect(playerId, effect);
            if (message) {
                effectMessages.push(message);
            }
        });
        
        return effectMessages;
    }

    /**
     * INTEGRATED MOVEMENT & EFFECTS (NEW)
     */

    /**
     * Move player to new space and apply all associated space effects
     * This replaces the functionality currently in FixedApp.js movePlayer()
     * Returns array of all effect messages for UI feedback
     */
    movePlayerWithEffects(playerId, destination, visitType = 'First') {
        // Input validation (matching FixedApp.js validation)
        const currentPlayer = this.state.players.find(p => p.id === playerId);
        if (!currentPlayer) {
            throw new Error(`Player ${playerId} not found`);
        }
        
        if (!destination) {
            throw new Error('Destination is required');
        }
        
        this.log(`Moving player ${playerId} to ${destination} with effects processing`);
        
        const allMessages = [];
        
        try {
            // Step 1: Move the player (this handles position and visitType)
            const moveMessage = this.movePlayer(playerId, destination, visitType, true);
            if (moveMessage) {
                allMessages.push(moveMessage);
            }
            
            // Step 2: Save snapshot for potential negotiation (existing functionality)
            this.savePlayerSnapshot(playerId);
            
            // Step 3: Process all space effects and collect messages
            const effectMessages = this.processAllSpaceEffects(playerId, destination, visitType);
            allMessages.push(...effectMessages);
            
            // Step 4: Emit integrated movement event for other components
            this.emit('playerMovedWithEffects', {
                playerId,
                destination,
                visitType,
                effects: effectMessages,
                allMessages
            });
            
            this.log(`Successfully moved player ${playerId} to ${destination}. Applied ${effectMessages.length} effects.`);
            
            return allMessages;
            
        } catch (error) {
            console.error('Error in movePlayerWithEffects:', error);
            this.handleError(error, 'movePlayerWithEffects');
            throw error;
        }
    }

    /**
     * Move player based on dice roll (common pattern in game)
     * Handles getting available moves and applying effects
     */
    movePlayerWithDiceEffects(playerId, diceRoll) {
        try {
            // Get available moves using existing MovementEngine integration
            const movementEngine = window.movementEngine || 
                (window.MovementEngine?.getInstance && window.MovementEngine.getInstance());
                
            if (!movementEngine) {
                throw new Error('MovementEngine not available');
            }
            
            const currentPlayer = this.state.players.find(p => p.id === playerId);
            if (!currentPlayer) {
                throw new Error(`Player ${playerId} not found`);
            }
            
            const availableMoves = movementEngine.getAvailableMoves(currentPlayer);
            
            if (!availableMoves || availableMoves.length === 0) {
                throw new Error('No available moves found');
            }
            
            // For now, take first available move (can be enhanced later for choice handling)
            const destination = availableMoves[0].destination || availableMoves[0];
            const visitType = availableMoves[0].visitType || 'First';
            
            // Use the main orchestration method
            return this.movePlayerWithEffects(playerId, destination, visitType);
            
        } catch (error) {
            console.error('Error in movePlayerWithDiceEffects:', error);
            throw error;
        }
    }

    /**
     * Complete player turn with movement and effects, then advance turn
     * Matches the full turn cycle from FixedApp.js
     */
    completePlayerTurnWithEffects(playerId, destination, visitType = 'First') {
        try {
            // Execute movement and effects
            const messages = this.movePlayerWithEffects(playerId, destination, visitType);
            
            // Advance turn count (matching FixedApp.js behavior)
            this.setState({
                turnCount: this.state.turnCount + 1,
                lastAction: `Player moved to ${destination}`
            });
            
            // Emit turn completion event
            this.emit('turnCompletedWithEffects', {
                playerId,
                destination,
                visitType,
                messages,
                newTurnCount: this.state.turnCount
            });
            
            return {
                messages,
                newTurnCount: this.state.turnCount
            };
            
        } catch (error) {
            console.error('Error in completePlayerTurnWithEffects:', error);
            throw error;
        }
    }

    /**
     * Initialize turn actions for a player based on their current space
     */
    initializeTurnActions(playerId) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`GameStateManager: Player ${playerId} not found for turn initialization`);
            return;
        }

        // Check if CSVDatabase is loaded
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.warn('GameStateManager: CSVDatabase not loaded, using minimal turn initialization');
            this.setState({
                currentTurn: {
                    playerId: playerId,
                    turnNumber: this.state.turnCount,
                    phase: 'ACTIONS',
                    requiredActions: [],
                    completedActions: [],
                    actionCounts: {
                        required: 0,
                        completed: 0
                    },
                    canEndTurn: true,
                    lastActionTimestamp: Date.now()
                }
            });
            return;
        }

        const requiredActions = [];
        let requiredCount = 0;

        try {
            // Check if space requires dice roll
            if (window.ComponentUtils && window.ComponentUtils.requiresDiceRoll) {
                const diceRequired = window.ComponentUtils.requiresDiceRoll(
                    player.position, 
                    player.visitType || 'First'
                );
                if (diceRequired) {
                    requiredActions.push({ type: 'dice', required: true, completed: false });
                    requiredCount++;
                }
            }

            // Check for available card actions
            if (window.ComponentUtils && window.ComponentUtils.getCardTypes) {
                const cardTypes = window.ComponentUtils.getCardTypes(
                    player.position, 
                    player.visitType || 'First'
                );
                if (cardTypes && cardTypes.length > 0) {
                    requiredActions.push({ type: 'card', required: true, completed: false, cardTypes });
                    requiredCount++;
                }
            }

            // MOVEMENT CORRECTION: Movement handled automatically during End Turn, not as required action
            // Movement logic exists in handleEndTurn() in TurnControls.js
            // This prevents the "Actions: 2/3" issue where movement blocks turn completion

        } catch (error) {
            console.error('Error analyzing space requirements:', error);
        }

        // Update current turn state
        this.setState({
            currentTurn: {
                playerId: playerId,
                turnNumber: this.state.turnCount,
                phase: 'ACTIONS',
                requiredActions: requiredActions,
                completedActions: [],
                actionCounts: {
                    required: requiredCount,
                    completed: 0
                },
                canEndTurn: requiredCount === 0,
                lastActionTimestamp: Date.now()
            }
        });

        // Emit turn initialization event
        this.emit('turnActionsInitialized', {
            playerId: playerId,
            requiredActions: requiredActions,
            actionCounts: {
                required: requiredCount,
                completed: 0
            },
            canEndTurn: requiredCount === 0
        });
    }

    /**
     * Process a completed player action
     */
    processPlayerAction(actionData) {
        const { playerId, actionType, actionDetails } = actionData;
        
        if (this.state.currentTurn.playerId !== playerId) {
            console.warn(`GameStateManager: Action from ${playerId} but current turn is ${this.state.currentTurn.playerId}`);
            return;
        }

        // Find the required action and mark it completed
        const requiredActions = [...this.state.currentTurn.requiredActions];
        const actionIndex = requiredActions.findIndex(action => 
            action.type === actionType && !action.completed
        );

        if (actionIndex === -1) {
            console.warn(`GameStateManager: Action type ${actionType} not required or already completed`);
            return;
        }

        // Mark action as completed
        requiredActions[actionIndex].completed = true;
        requiredActions[actionIndex].completedAt = Date.now();
        requiredActions[actionIndex].details = actionDetails;

        // Add to completed actions log
        const completedActions = [...this.state.currentTurn.completedActions];
        completedActions.push({
            type: actionType,
            details: actionDetails,
            timestamp: Date.now()
        });

        // Recalculate counts
        const completedCount = requiredActions.filter(action => action.completed).length;
        const requiredCount = requiredActions.length;
        const canEndTurn = completedCount >= requiredCount;

        // Update state
        this.setState({
            currentTurn: {
                ...this.state.currentTurn,
                requiredActions: requiredActions,
                completedActions: completedActions,
                actionCounts: {
                    required: requiredCount,
                    completed: completedCount
                },
                canEndTurn: canEndTurn,
                lastActionTimestamp: Date.now()
            }
        });

        // Emit action completion event
        this.emit('actionCompleted', {
            playerId: playerId,
            actionType: actionType,
            actionDetails: actionDetails,
            actionCounts: {
                required: requiredCount,
                completed: completedCount
            },
            canEndTurn: canEndTurn
        });
    }

    /**
     * Handle player action taken events
     */
    handlePlayerAction(eventData) {
        try {
            this.processPlayerAction({
                playerId: eventData.playerId,
                actionType: eventData.actionType,
                actionDetails: eventData.actionData
            });
        } catch (error) {
            console.error('GameStateManager: Error handling player action:', error);
            this.handleError(error, 'Player Action Processing');
        }
    }

    /**
     * Reset game state
     */
    reset() {
        this.state = this.getInitialState();
        this.eventHistory = [];
        this.emit('gameReset');
    }

    /**
     * Set player skip next turn flag
     */
    setPlayerSkipNextTurn(playerId, shouldSkip) {
        this.updatePlayer(playerId, { skipNextTurn: shouldSkip });
    }
}

// Create singleton instance
const GameStateManagerInstance = new GameStateManager();

// Export for browser usage
if (typeof window !== 'undefined') {
    window.GameStateManager = GameStateManagerInstance;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManagerInstance;
}