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
        if (!this.listeners.has(eventName)) return;
        
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
        
        if (!this.listeners.has(eventName)) return;
        
        const listeners = this.listeners.get(eventName);
        listeners.forEach(({ callback, context }) => {
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
            turnCount: this.state.turnCount + 1,
            lastAction: null
        });

        this.emit('turnStarted', { player, turnCount: this.state.turnCount, fromNegotiation });
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
        const players = [...this.state.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        const previousPosition = player.position;
        player.position = spaceName;
        player.visitType = visitType;

        this.setState({ players });
        
        this.emit('playerMoved', {
            player,
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
        const players = [...this.state.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        const previousAmount = player.money;
        player.money += amount;

        this.setState({ players });
        
        this.emit('playerMoneyChanged', {
            player,
            previousAmount,
            newAmount: player.money,
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
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            throw new Error(`Player ${playerId} not found`);
        }

        const currentPlayer = this.state.players[playerIndex];
        const previousAmount = currentPlayer.timeSpent || 0;
        
        // Create completely new player object
        const updatedPlayer = {
            ...currentPlayer,
            timeSpent: previousAmount + amount
        };
        
        // Create completely new players array
        const players = [
            ...this.state.players.slice(0, playerIndex),
            updatedPlayer,
            ...this.state.players.slice(playerIndex + 1)
        ];

        this.setState({ players });
        
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
        
        const players = [...this.state.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error(`GameStateManager: Player ${playerId} not found`);
            throw new Error(`Player ${playerId} not found`);
        }

        // Initialize cards object if it doesn't exist
        if (!player.cards) {
            player.cards = {};
        }

        if (!player.cards[cardType]) {
            player.cards[cardType] = [];
        }

        const cardCount = Array.isArray(cards) ? cards.length : 1;
        const cardsToAdd = Array.isArray(cards) ? cards : [cards];

        player.cards[cardType].push(...cardsToAdd);
        
        // Apply immediate effects for W, B, I, L cards only
        // E cards remain in hand for player-controlled usage
        if (cardType !== 'E') {
            cardsToAdd.forEach(card => {
                // Process Bank card loan amounts
                if (card.loan_amount) {
                    const loanAmount = parseInt(card.loan_amount) || 0;
                    player.money = (player.money || 0) + loanAmount;
                }
                
                // Process Investment card investment amounts
                if (card.investment_amount) {
                    const investmentAmount = parseInt(card.investment_amount) || 0;
                    player.money = (player.money || 0) + investmentAmount;
                }
                
                // Process general money effects
                if (card.money_effect) {
                    const moneyEffect = parseInt(card.money_effect) || 0;
                    player.money = (player.money || 0) + moneyEffect;
                }
                
                // Process time effects
                if (card.time_effect) {
                    const timeEffect = parseInt(card.time_effect) || 0;
                    player.timeSpent = (player.timeSpent || 0) + timeEffect;
                }
            });
        }
        
        // Update player scope if W cards were added
        if (cardType === 'W') {
            this.updatePlayerScope(playerId, players);
        }

        this.setState({ players });
        
        this.emit('cardsAddedToPlayer', {
            player,
            cardType,
            cards: cardsToAdd,
            totalCards: player.cards[cardType].length
        });
        
        // NEW: Return user-friendly message if requested
        if (returnMessage) {
            const cardLabel = cardCount === 1 ? 'card' : 'cards';
            const cardTypeName = window.CardUtils ? 
                window.CardUtils.getCardTypeConfig(cardType)?.name || cardType : 
                cardType;
            return `Drew ${cardCount} ${cardTypeName} ${cardLabel}`;
        }
    }

    /**
     * Clear cards added during current turn (for negotiation)
     */
    /**
     * Restore player state to space entry snapshot and apply time penalty (negotiation)
     */
    restorePlayerSnapshot(playerId, timePenalty = null) {
        const players = [...this.state.players];
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error(`GameStateManager: Player ${playerId} not found`);
            return;
        }

        if (!player.spaceEntrySnapshot) {
            console.warn(`GameStateManager: No snapshot found for player ${playerId}, cannot restore`);
            return;
        }

        const snapshot = player.spaceEntrySnapshot;

        // Get current space time cost for penalty if not provided
        let actualTimePenalty = timePenalty;
        if (actualTimePenalty === null && window.CSVDatabase && window.CSVDatabase.loaded) {
            const currentSpaceData = window.CSVDatabase.spaceEffects.find(
                player.position, 
                player.visitType || 'First'
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

        // Restore player state from snapshot
        player.cards = JSON.parse(JSON.stringify(snapshot.cards));
        player.money = snapshot.money;
        player.scope = snapshot.scope ? JSON.parse(JSON.stringify(snapshot.scope)) : null;
        player.scopeItems = snapshot.scopeItems ? JSON.parse(JSON.stringify(snapshot.scopeItems)) : [];
        player.scopeTotalCost = snapshot.scopeTotalCost || 0;
        
        // Apply time penalty for negotiation (add to current time, don't reset to snapshot time)
        player.timeSpent = player.timeSpent + actualTimePenalty;
        
        this.setState({ players });
        
        this.emit('playerStateRestored', {
            player,
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
        
        const players = this.state.players;
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error(`GameStateManager: Player ${playerId} not found for card usage`);
            return;
        }
        
        if (!player.cards || !player.cards[cardType]) {
            console.error(`GameStateManager: No ${cardType} cards found for player ${playerId}`);
            return;
        }
        
        // Find and remove the card from hand
        const cardIndex = player.cards[cardType].findIndex(c => c.card_id === cardId);
        if (cardIndex >= 0) {
            player.cards[cardType].splice(cardIndex, 1);
            
            // Emit state change
            this.setState({ players });
            this.emit('cardUsed', { playerId, cardType, cardId, card });
        } else {
            console.error(`GameStateManager: Card ${cardId} not found in player ${playerId}'s ${cardType} cards`);
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
     * Update player scope based on W cards
     */
    updatePlayerScope(playerId, players = null) {
        const playerArray = players || [...this.state.players];
        const player = playerArray[playerId];
        
        if (!player) return;
        
        // Calculate scope based on W cards
        const wCards = player.cards?.W || [];
        const scopeItems = [];
        let totalCost = 0;
        
        wCards.forEach(card => {
            const workType = card.work_type_restriction || 'General Construction';
            const workCost = parseInt(card.work_cost) || 0;
            
            // Find existing scope item with same work type
            const existingItem = scopeItems.find(item => item.workType === workType);
            if (existingItem) {
                existingItem.cost += workCost;
                existingItem.count += 1;
            } else {
                scopeItems.push({
                    workType: workType,
                    cost: workCost,
                    count: 1
                });
            }
            
            totalCost += workCost;
        });
        
        // Store scope items and total cost on player
        player.scopeItems = scopeItems;
        player.scopeTotalCost = totalCost;
        
        
        // If players array was not passed in, update state
        if (!players) {
            this.setState({ players: playerArray });
        }
    }

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
                space: spaceName,
                visitType: visitType
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
                
                case 'e_time': {
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
     * Reset game state
     */
    reset() {
        this.state = this.getInitialState();
        this.eventHistory = [];
        this.emit('gameReset');
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