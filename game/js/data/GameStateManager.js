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
        this.on('drawCards', (event) => this.handleDrawCards(event));
        this.on('removeCards', (event) => this.handleRemoveCards(event));
        this.on('showCardReplacement', (event) => this.handleShowCardReplacement(event));
        this.on('cardReplacementConfirmed', (event) => this.handleCardReplacementConfirmed(event));
        // REMOVED: Duplicate processDiceOutcome listener - GameManager handles this event
        this.on('applyDiceEffects', (event) => this.handleApplyDiceEffects(event));
    }

    /**
     * NEW: Process dice roll outcomes from DiceRollSection
     * This handles drawing, removing, or replacing cards based on dice results.
     */
    handleProcessDiceOutcome(event) {
        this.log('🎲 Processing dice outcome:', event);
        const { playerId, outcome, cardType, rollValue } = event;

        // Store the last dice roll value for condition checks
        if (rollValue) {
            this.setState({
                currentTurn: {
                    ...this.state.currentTurn,
                    lastDiceRoll: rollValue
                }
            });
        }

        if (!outcome || !cardType) {
            this.log('🎲 No card outcome to process.');
            return;
        }

        const parts = outcome.split(' ');
        const action = parts[0];
        const amount = parseInt(parts[1]);

        if (isNaN(amount)) {
            console.error("Invalid amount in dice outcome:", outcome);
            this.handleError(new Error(`Invalid amount in dice outcome: ${outcome}`), 'handleProcessDiceOutcome');
            return;
        }

        if (action === 'Draw') {
            const drawnCards = this.drawCardsFromDeck(cardType, amount);
            if (drawnCards.length > 0) {
                this.log(`🎲 Drawn ${drawnCards.length} ${cardType} cards from deck.`);
                // Use the unified acknowledgment system to show cards to the player
                this.processDrawnCardsWithAcknowledgment(playerId, cardType, drawnCards, true);
            } else {
                this.log(`🎲 No ${cardType} cards were available to draw.`);
            }
        } else if (action === 'Remove') {
            this.log(`🎲 Removing ${amount} ${cardType} cards from player ${playerId}.`);
            this.forcePlayerDiscard(playerId, amount, cardType);
        } else {
            this.log(`🎲 Dice outcome action '${action}' not yet implemented.`);
            // Future actions like 'Replace' can be added here.
        }
    }

    /**
     * Apply dice effects after user confirms the modal
     * This processes all the dice roll effects (cards, money, time) and applies them to the game state
     */
    handleApplyDiceEffects(event) {
        console.log('🎲 DICE EFFECTS: Applying dice effects after modal confirmation:', event);
        const { effects, diceValue } = event;
        
        const currentPlayer = this.state.players.find(p => p.id === this.state.currentPlayer);
        if (!currentPlayer) {
            console.error('🎲 DICE EFFECTS: Current player not found');
            return;
        }

        // Process card effects - emit event for GameManager to handle
        if (effects && effects.cards && effects.cardType) {
            console.log(`🎲 DICE EFFECTS: Emitting processDiceOutcome for GameManager`);
            this.emit('processDiceOutcome', {
                playerId: currentPlayer.id,
                outcome: effects.cards,
                cardType: effects.cardType,
                spaceName: currentPlayer.position,
                visitType: currentPlayer.visitType || 'First'
            });
        }

        // Process money effects
        if (effects && effects.money) {
            console.log(`🎲 DICE EFFECTS: Processing money effect: ${effects.money}`);
            let moneyAmount = 0;
            if (effects.money.includes && effects.money.includes('%')) {
                // Percentage-based (like fees)
                const percentage = parseFloat(effects.money.replace('%', ''));
                moneyAmount = Math.floor((currentPlayer.money || 0) * percentage / 100);
            } else {
                moneyAmount = parseInt(effects.money);
            }
            
            if (!isNaN(moneyAmount) && moneyAmount !== 0) {
                this.emit('moneyChanged', {
                    playerId: currentPlayer.id,
                    amount: moneyAmount,
                    source: 'dice_roll'
                });
            }
        }

        // Process time effects
        if (effects && effects.time) {
            console.log(`🎲 DICE EFFECTS: Processing time effect: ${effects.time} days`);
            const timeAmount = parseInt(effects.time);
            if (!isNaN(timeAmount) && timeAmount !== 0) {
                this.emit('timeChanged', {
                    playerId: currentPlayer.id,
                    amount: timeAmount,
                    source: 'dice_roll'
                });
            }
        }

        // Process movement effects (if any)
        if (effects && effects.destination) {
            console.log(`🎲 DICE EFFECTS: Processing movement to: ${effects.destination}`);
            // This would trigger movement logic if dice results include movement
            // For now, just log it as movement is typically handled separately
        }

        // Emit completion event now that all effects are applied
        console.log('🎲 DICE EFFECTS: All effects applied, emitting diceRollComplete');
        this.emit('diceRollComplete', {
            playerId: currentPlayer.id,
            spaceName: currentPlayer.position,
            visitType: currentPlayer.visitType || 'First',
            rollValue: diceValue
        });
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
                lastActionTimestamp: null,
                fundingCardDrawnForSpace: false,
                spaceActionsCompleted: false,
                lastDiceRoll: null
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
                loading: false,
                isDiceResultModalActive: false
            },
            // CARD ACKNOWLEDGMENT STATE
            cardAcknowledgment: {
                isActive: false,
                queue: [],
                currentCard: null,
                playerId: null,
                onComplete: null
            },
            // DECK MANAGEMENT STATE - Separate decks for each card type
            cardDecks: {
                W: { available: [], discarded: [], inPlay: [] },
                B: { available: [], discarded: [], inPlay: [] },
                I: { available: [], discarded: [], inPlay: [] },
                L: { available: [], discarded: [], inPlay: [] },
                E: { available: [], discarded: [], inPlay: [] }
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
     * Set UI state - convenience method for updating UI-related state
     */
    setUIState(key, value) {
        this.setState({
            ui: {
                ...this.state.ui,
                [key]: value
            }
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
     * CARD ACKNOWLEDGMENT SYSTEM
     * Provides UX for immediate cards that need user confirmation
     */

    /**
     * Show immediate card to user for acknowledgment
     * @param {Object} card - Card to show
     * @param {string} cardType - Card type
     * @param {number} playerId - Player who received the card
     * @param {Function} onAcknowledge - Callback after acknowledgment
     */
    showCardForAcknowledgment(card, cardType, playerId, onAcknowledge) {
        this.setState({
            cardAcknowledgment: {
                isActive: true,
                currentCard: { ...card, cardType },
                playerId: playerId,
                onComplete: onAcknowledge,
                queue: this.state.cardAcknowledgment.queue
            }
        });

        this.emit('showCardAcknowledgment', {
            card: { ...card, cardType },
            playerId,
            playerName: this.state.players.find(p => p.id === playerId)?.name || 'Player'
        });
    }

    /**
     * Process card acknowledgment from UI
     * @param {boolean} acknowledged - Whether user acknowledged the card
     */
    acknowledgeCard(acknowledged = true) {
        const acknowledgment = this.state.cardAcknowledgment;
        
        if (!acknowledgment.isActive || !acknowledgment.currentCard) {
            console.warn('GameStateManager: No card waiting for acknowledgment');
            return;
        }

        const { currentCard, onComplete } = acknowledgment;
        
        // Clear current acknowledgment state
        this.setState({
            cardAcknowledgment: {
                ...acknowledgment,
                isActive: false,
                currentCard: null,
                onComplete: null
            }
        });

        this.emit('cardAcknowledged', {
            card: currentCard,
            acknowledged
        });

        // Call completion callback if provided
        if (onComplete && typeof onComplete === 'function') {
            onComplete(acknowledged);
        }

        // Process next card in queue if any
        this.processNextCardAcknowledgment();
    }

    /**
     * Add multiple cards to acknowledgment queue
     * @param {Array} cards - Cards to add to queue
     * @param {string} cardType - Card type
     * @param {number} playerId - Player ID
     * @param {Function} onComplete - Callback when all cards acknowledged
     */
    queueCardsForAcknowledgment(cards, cardType, playerId, onComplete) {
        const queue = cards.map(card => ({
            card: { ...card, cardType },
            cardType,
            playerId,
            onAcknowledge: (acknowledged) => {
                // Individual card acknowledgment handling can go here
            }
        }));

        this.setState({
            cardAcknowledgment: {
                ...this.state.cardAcknowledgment,
                queue: [...this.state.cardAcknowledgment.queue, ...queue],
                onComplete: onComplete
            }
        });

        // Start processing if not already active
        if (!this.state.cardAcknowledgment.isActive) {
            this.processNextCardAcknowledgment();
        }
    }

    /**
     * Process next card in acknowledgment queue
     */
    processNextCardAcknowledgment() {
        const acknowledgment = this.state.cardAcknowledgment;
        
        if (acknowledgment.isActive || acknowledgment.queue.length === 0) {
            // Check if queue is empty and we have a completion callback
            if (acknowledgment.queue.length === 0 && acknowledgment.onComplete) {
                const callback = acknowledgment.onComplete;
                this.setState({
                    cardAcknowledgment: {
                        ...acknowledgment,
                        onComplete: null
                    }
                });
                callback();
            }
            return;
        }

        // Get next card from queue
        const nextCardInfo = acknowledgment.queue[0];
        const remainingQueue = acknowledgment.queue.slice(1);

        // Update state with next card
        this.setState({
            cardAcknowledgment: {
                ...acknowledgment,
                isActive: true,
                currentCard: nextCardInfo.card,
                playerId: nextCardInfo.playerId,
                queue: remainingQueue,
                onComplete: acknowledgment.onComplete // Keep overall completion callback
            }
        });

        // Show the card
        this.emit('showCardAcknowledgment', {
            card: nextCardInfo.card,
            playerId: nextCardInfo.playerId,
            playerName: this.state.players.find(p => p.id === nextCardInfo.playerId)?.name || 'Player'
        });
    }

    /**
     * Check if card acknowledgment system is currently active
     */
    isCardAcknowledgmentActive() {
        return this.state.cardAcknowledgment.isActive;
    }

    /**
     * DECK MANAGEMENT SYSTEM
     */

    /**
     * Initialize card decks from CSV data
     * Called once during game initialization
     */
    initializeCardDecks() {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.error('GameStateManager: Cannot initialize decks - CSVDatabase not loaded');
            return;
        }

        const cardTypes = ['W', 'B', 'I', 'L', 'E'];
        const newCardDecks = {};

        cardTypes.forEach(cardType => {
            // Get all cards of this type from CSV
            const allCardsOfType = window.CSVDatabase.cards.query({card_type: cardType});
            
            // Shuffle the deck
            const shuffledCards = this.shuffleArray([...allCardsOfType]);
            
            newCardDecks[cardType] = {
                available: shuffledCards,
                discarded: [],
                inPlay: []
            };
            
            this.log(`Initialized ${cardType} deck with ${shuffledCards.length} cards`);
        });

        this.setState({ cardDecks: newCardDecks });
        this.log('All card decks initialized');
    }

    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Draw cards from deck with proper removal and reshuffling
     * SOLVES: Duplicate card drawing bug
     * @param {string} cardType - Card type (W, B, I, L, E)
     * @param {number} count - Number of cards to draw
     * @returns {Array} Array of unique cards drawn from deck
     */
    drawCardsFromDeck(cardType, count) {
        if (!this.state.cardDecks || !this.state.cardDecks[cardType]) {
            console.error(`GameStateManager: Invalid card type ${cardType}`);
            return [];
        }

        const deck = this.state.cardDecks[cardType];
        const drawnCards = [];
        
        // Create working copy of deck state
        let availableCards = [...deck.available];
        let discardedCards = [...deck.discarded];

        for (let i = 0; i < count; i++) {
            // Check if deck is empty and needs reshuffling
            if (availableCards.length === 0) {
                if (discardedCards.length === 0) {
                    console.warn(`GameStateManager: No more ${cardType} cards available to draw`);
                    break;
                }
                
                // Reshuffle discarded cards back into available deck
                availableCards = this.shuffleArray(discardedCards);
                discardedCards = [];
                this.log(`Reshuffled ${cardType} deck: ${availableCards.length} cards back in play`);
            }

            // Draw a card (remove from available)
            const drawnCard = availableCards.shift();
            if (drawnCard) {
                drawnCards.push(drawnCard);
                this.log(`Drew ${cardType} card: ${drawnCard.card_id}`);
            }
        }

        // Update deck state with changes
        const newCardDecks = {
            ...this.state.cardDecks,
            [cardType]: {
                ...this.state.cardDecks[cardType],
                available: availableCards,
                discarded: discardedCards
            }
        };

        this.setState({ cardDecks: newCardDecks });

        return drawnCards;
    }

    /**
     * Move card to discard pile (when effect completes)
     * @param {string} cardType - Card type
     * @param {Object} card - Card object to discard
     */
    discardCard(cardType, card) {
        const deck = this.state.cardDecks[cardType];
        if (!deck) {
            console.error(`GameStateManager: Invalid card type ${cardType} for discard`);
            return;
        }

        const newCardDecks = {
            ...this.state.cardDecks,
            [cardType]: {
                ...deck,
                discarded: [...deck.discarded, card]
            }
        };

        this.setState({ cardDecks: newCardDecks });
        this.log(`Discarded ${cardType} card: ${card.card_id}`);
    }

    /**
     * Move card to in-play state (for persistent effects)
     * @param {string} cardType - Card type
     * @param {Object} card - Card object with persistent effects
     * @param {number} playerId - Player who activated the card
     */
    moveCardToInPlay(cardType, card, playerId) {
        const deck = this.state.cardDecks[cardType];
        if (!deck) {
            console.error(`GameStateManager: Invalid card type ${cardType} for in-play`);
            return;
        }

        // Add metadata for tracking
        const inPlayCard = {
            ...card,
            playerId: playerId,
            activatedTurn: this.state.turnCount,
            turnsRemaining: parseInt(card.duration_count) || 1
        };

        const newCardDecks = {
            ...this.state.cardDecks,
            [cardType]: {
                ...deck,
                inPlay: [...deck.inPlay, inPlayCard]
            }
        };

        this.setState({ cardDecks: newCardDecks });
        this.log(`Moved ${cardType} card to in-play: ${card.card_id} for ${inPlayCard.turnsRemaining} turns`);
    }

    /**
     * Process in-play cards at turn end (decrement counters, move expired to discard)
     */
    processInPlayCards() {
        const newCardDecks = { ...this.state.cardDecks };
        let hasChanges = false;

        ['W', 'B', 'I', 'L', 'E'].forEach(cardType => {
            const deck = newCardDecks[cardType];
            const updatedInPlay = [];
            
            deck.inPlay.forEach(card => {
                const newTurnsRemaining = card.turnsRemaining - 1;
                
                if (newTurnsRemaining <= 0) {
                    // Move to discard pile
                    deck.discarded.push({
                        ...card,
                        // Remove in-play metadata
                        playerId: undefined,
                        activatedTurn: undefined,
                        turnsRemaining: undefined
                    });
                    this.log(`${cardType} card ${card.card_id} effect expired, moved to discard`);
                    hasChanges = true;
                } else {
                    // Keep in play with decremented counter
                    updatedInPlay.push({
                        ...card,
                        turnsRemaining: newTurnsRemaining
                    });
                }
            });

            deck.inPlay = updatedInPlay;
        });

        if (hasChanges) {
            this.setState({ cardDecks: newCardDecks });
        }
    }

    /**
     * Get current in-play cards (for UI display and effect processing)
     * @returns {Object} In-play cards organized by card type
     */
    getInPlayCards() {
        const inPlayCards = {};
        ['W', 'B', 'I', 'L', 'E'].forEach(cardType => {
            inPlayCards[cardType] = [...this.state.cardDecks[cardType].inPlay];
        });
        return inPlayCards;
    }

    /**
     * Handle card state transition after being played from hand
     * Determines if card goes to discarded pile or in-play state
     * @param {Object} card - Card object
     * @param {string} cardType - Card type (W, B, I, L, E)
     * @param {number} playerId - Player who used the card
     */
    handleCardStateTransition(card, cardType, playerId) {
        try {
            // Check if card has persistent effects based on duration
            const hasPersistentEffect = card.duration && 
                                      card.duration !== 'Immediate' && 
                                      card.duration !== 'Permanent' && 
                                      card.duration_count && 
                                      parseInt(card.duration_count) > 0;

            if (hasPersistentEffect) {
                // Move to in-play state for persistent effects
                this.moveCardToInPlay(cardType, card, playerId);
                this.log(`Card ${card.card_id} moved to in-play state (${card.duration} for ${card.duration_count} turns)`);
            } else {
                // Move to discard pile for immediate/permanent effects
                this.discardCard(cardType, card);
                this.log(`Card ${card.card_id} moved to discard pile (${card.duration || 'Immediate'} effect)`);
            }
        } catch (error) {
            console.error('Error in handleCardStateTransition:', error);
            // Fallback: move to discard pile
            this.discardCard(cardType, card);
        }
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
        
        // Initialize card decks AFTER state is set
        this.initializeCardDecks();
        
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

        // Process in-play cards (decrement counters, move expired to discard)
        this.processInPlayCards();

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
        
        // Reset funding card state and space actions when moving to a new space
        if (previousPosition !== spaceName) {
            this.setState({
                currentTurn: {
                    ...this.state.currentTurn,
                    fundingCardDrawnForSpace: false,
                    spaceActionsCompleted: false
                }
            });
        }
        
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
     * Process immediate cards with user acknowledgment system
     * @param {number} playerId - Player ID
     * @param {string} cardType - Card type
     * @param {Array} immediateCards - Cards requiring immediate processing
     * @param {Array} cardsForHand - Cards that go to hand
     * @param {boolean} returnMessage - Whether to return user message
     */
    processImmediateCardsWithAcknowledgment(playerId, cardType, immediateCards, cardsForHand, returnMessage) {
        // Add any non-immediate cards to hand first
        if (cardsForHand.length > 0) {
            this.addCardsToPlayerHand(playerId, cardType, cardsForHand);
        }

        // Queue immediate cards for acknowledgment
        this.queueCardsForAcknowledgment(immediateCards, cardType, playerId, () => {
            // This callback runs after all immediate cards are acknowledged
            // Now apply their effects
            this.applyImmediateCardEffects(playerId, cardType, immediateCards);
        });

        // Return early message about cards being shown
        if (returnMessage) {
            const immediateCount = immediateCards.length;
            const handCount = cardsForHand.length;
            const cardLabel = (immediateCount + handCount) === 1 ? 'card' : 'cards';
            
            if (immediateCount > 0 && handCount > 0) {
                return `Drew ${immediateCount + handCount} ${cardLabel} (${immediateCount} immediate, ${handCount} to hand)`;
            } else if (immediateCount > 0) {
                return `Drew ${immediateCount} ${cardLabel} - click to acknowledge`;
            } else {
                return `Drew ${handCount} ${cardLabel} to hand`;
            }
        }
    }

    /**
     * UNIFIED CARD ACKNOWLEDGMENT: Process all drawn cards (immediate and player-controlled) with acknowledgment
     * @param {number} playerId - Player ID
     * @param {string} cardType - Card type
     * @param {Array} allCards - All cards to be acknowledged
     * @param {boolean} returnMessage - Whether to return user message
     */
    processDrawnCardsWithAcknowledgment(playerId, cardType, allCards, returnMessage) {
        console.log('🎴 UNIFIED: Processing', allCards.length, 'cards for acknowledgment');
        
        // Queue ALL cards for acknowledgment (immediate and player-controlled)
        this.queueCardsForAcknowledgment(allCards, cardType, playerId, () => {
            // This callback runs after ALL cards are acknowledged
            // Now process each card based on its type
            this.processAcknowledgedCards(playerId, cardType, allCards);
        });

        // Return message about cards being shown
        if (returnMessage) {
            const cardLabel = allCards.length === 1 ? 'card' : 'cards';
            return `Drew ${allCards.length} ${cardLabel} - click to acknowledge each card`;
        }
    }

    /**
     * Process cards after acknowledgment based on their activation timing
     * @param {number} playerId - Player ID
     * @param {string} cardType - Card type
     * @param {Array} allCards - All acknowledged cards
     */
    processAcknowledgedCards(playerId, cardType, allCards) {
        console.log('🎴 UNIFIED: Processing acknowledged cards:', allCards.length);
        
        // Separate cards by activation timing for processing
        const immediateCards = [];
        const playerControlledCards = [];
        
        allCards.forEach(card => {
            if (card.activation_timing === 'Immediate') {
                immediateCards.push(card);
            } else {
                playerControlledCards.push(card);
            }
        });

        // Process immediate cards (apply effects)
        if (immediateCards.length > 0) {
            console.log('🎴 UNIFIED: Applying effects for', immediateCards.length, 'immediate cards');
            this.applyImmediateCardEffects(playerId, cardType, immediateCards);
        }

        // Process player-controlled cards (add to hand)
        if (playerControlledCards.length > 0) {
            console.log('🎴 UNIFIED: Adding', playerControlledCards.length, 'player-controlled cards to hand');
            this.addCardsToPlayerHand(playerId, cardType, playerControlledCards);
        }
    }

    /**
     * Apply effects for immediate cards after user acknowledgment
     * @param {number} playerId - Player ID  
     * @param {string} cardType - Card type
     * @param {Array} cards - Immediate cards to process
     */
    applyImmediateCardEffects(playerId, cardType, cards) {
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            console.error(`GameStateManager: Player ${playerId} not found for immediate card effects`);
            return;
        }

        const currentPlayer = this.state.players[playerIndex];
        let newMoney = currentPlayer.money || 0;
        let newTimeSpent = currentPlayer.timeSpent || 0;

        // Apply effects for each acknowledged card
        cards.forEach(card => {
            newMoney += parseInt(card.loan_amount || 0);
            newMoney += parseInt(card.investment_amount || 0);  
            newMoney += parseInt(card.money_effect || 0);
            newTimeSpent += parseInt(card.time_effect || 0);

            // Handle card state transition to discard/in-play
            const hasPersistentEffect = card.duration && 
                                      card.duration !== 'Immediate' && 
                                      card.duration !== 'Permanent';

            if (hasPersistentEffect) {
                this.moveCardToInPlay(cardType, card, playerId);
            } else {
                this.discardCard(cardType, card);
            }
        });

        // Update player with new money/time (for W cards: also update scope)
        let updatedPlayer = {
            ...currentPlayer,
            money: newMoney,
            timeSpent: newTimeSpent
        };

        // Handle W card scope calculation  
        if (cardType === 'W') {
            console.log('🔍 DEBUG: Starting W card scope calculation for player:', playerId);
            console.log('🔍 DEBUG: Current player data:', currentPlayer);
            console.log('🔍 DEBUG: Processing W cards:', cards);
            
            // For immediate W cards, we need to calculate scope from the processed cards
            // since they don't go to hand but contribute to project scope directly
            const existingScopeItems = currentPlayer.scopeItems || [];
            const existingScopeTotal = currentPlayer.scopeTotalCost || 0;
            
            console.log('🔍 DEBUG: existingScopeItems:', existingScopeItems);
            console.log('🔍 DEBUG: existingScopeTotal:', existingScopeTotal);
            
            // Add new W cards to project scope
            let newScopeTotal = existingScopeTotal;
            const scopeItemsMap = new Map();
            
            // Add existing scope items to map
            existingScopeItems.forEach(item => {
                scopeItemsMap.set(item.workType, { ...item });
            });
            
            console.log('🔍 DEBUG: scopeItemsMap after adding existing items:', scopeItemsMap);
            
            // Process immediate W cards and add to scope
            cards.forEach(card => {
                const workType = card.work_type_restriction || 'General Construction';
                const workCost = parseInt(card.work_cost) || 0;
                console.log('🔍 DEBUG: Processing card:', card.card_id, 'workType:', workType, 'workCost:', workCost);
                
                newScopeTotal += workCost;
                
                if (scopeItemsMap.has(workType)) {
                    const existing = scopeItemsMap.get(workType);
                    console.log('🔍 DEBUG: Updating existing workType:', workType, 'existing:', existing);
                    scopeItemsMap.set(workType, {
                        ...existing,
                        cost: existing.cost + workCost,
                        count: existing.count + 1
                    });
                } else {
                    console.log('🔍 DEBUG: Adding new workType:', workType);
                    scopeItemsMap.set(workType, {
                        workType: workType,
                        cost: workCost,
                        count: 1
                    });
                }
                console.log('🔍 DEBUG: scopeItemsMap after processing card:', scopeItemsMap);
            });
            
            console.log('🔍 DEBUG: newScopeTotal:', newScopeTotal);
            
            updatedPlayer.scopeItems = Array.from(scopeItemsMap.values());
            updatedPlayer.scopeTotalCost = newScopeTotal;
            
            console.log('🔍 DEBUG: Final updatedPlayer.scopeItems:', updatedPlayer.scopeItems);
            console.log('🔍 DEBUG: Final updatedPlayer.scopeTotalCost:', updatedPlayer.scopeTotalCost);
        }

        // Update state
        const players = [
            ...this.state.players.slice(0, playerIndex),
            updatedPlayer,
            ...this.state.players.slice(playerIndex + 1)
        ];

        console.log('🔍 DEBUG: About to call setState with updatedPlayer:', updatedPlayer);
        console.log('🔍 DEBUG: updatedPlayer.scopeItems before setState:', updatedPlayer.scopeItems);
        console.log('🔍 DEBUG: updatedPlayer.scopeTotalCost before setState:', updatedPlayer.scopeTotalCost);

        this.setState({ players });
        
        console.log('🔍 DEBUG: setState called, checking state after update...');
        // Check state after setState (note: might be async)
        setTimeout(() => {
            const verifyPlayer = this.state.players.find(p => p.id === playerId);
            console.log('🔍 DEBUG: Player state after setState:', verifyPlayer);
            console.log('🔍 DEBUG: Player scopeItems after setState:', verifyPlayer?.scopeItems);
            console.log('🔍 DEBUG: Player scopeTotalCost after setState:', verifyPlayer?.scopeTotalCost);
        }, 100);

        // Emit events
        this.emit('cardsProcessedImmediate', {
            player: updatedPlayer,
            cardType,
            cards: cards,
            totalCards: cards.length
        });

        this.log(`Applied effects for ${cards.length} immediate ${cardType} cards for player ${playerId}`);
    }

    /**
     * Add cards directly to player hand (for non-immediate cards)
     * @param {number} playerId - Player ID
     * @param {string} cardType - Card type  
     * @param {Array} cards - Cards to add to hand
     */
    addCardsToPlayerHand(playerId, cardType, cards) {
        console.log('🔍 E-CARD DEBUG: addCardsToPlayerHand called');
        console.log('🔍 E-CARD DEBUG: playerId:', playerId, 'cardType:', cardType, 'cards.length:', cards.length);
        
        const playerIndex = this.state.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            console.error(`GameStateManager: Player ${playerId} not found`);
            return;
        }

        const currentPlayer = this.state.players[playerIndex];
        console.log('🔍 E-CARD DEBUG: currentPlayer before update:', currentPlayer);
        console.log('🔍 E-CARD DEBUG: currentPlayer.scopeItems:', currentPlayer.scopeItems);
        console.log('🔍 E-CARD DEBUG: currentPlayer.scopeTotalCost:', currentPlayer.scopeTotalCost);
        
        const newCardsForType = [...(currentPlayer.cards?.[cardType] || []), ...cards];

        const updatedPlayer = {
            ...currentPlayer,
            cards: {
                ...currentPlayer.cards,
                [cardType]: newCardsForType
            }
        };

        console.log('🔍 E-CARD DEBUG: updatedPlayer after creation:', updatedPlayer);
        console.log('🔍 E-CARD DEBUG: updatedPlayer.scopeItems:', updatedPlayer.scopeItems);
        console.log('🔍 E-CARD DEBUG: updatedPlayer.scopeTotalCost:', updatedPlayer.scopeTotalCost);

        const players = [
            ...this.state.players.slice(0, playerIndex),
            updatedPlayer,
            ...this.state.players.slice(playerIndex + 1)
        ];

        console.log('🔍 E-CARD DEBUG: About to call setState with updated players array');
        this.setState({ players });
        
        console.log('🔍 E-CARD DEBUG: setState called, checking result...');
        setTimeout(() => {
            const verifyPlayer = this.state.players.find(p => p.id === playerId);
            console.log('🔍 E-CARD DEBUG: Player state after setState:', verifyPlayer);
            console.log('🔍 E-CARD DEBUG: Player scopeItems after setState:', verifyPlayer?.scopeItems);
            console.log('🔍 E-CARD DEBUG: Player scopeTotalCost after setState:', verifyPlayer?.scopeTotalCost);
        }, 100);

        this.emit('cardsAddedToHand', {
            player: updatedPlayer,
            cardType,
            cards: cards,
            totalCards: newCardsForType.length
        });
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

        // UNIFIED ACKNOWLEDGMENT: All cards now go through acknowledgment modal
        // No need to separate immediate vs hand cards - all get acknowledged first
        
        // Send ALL cards through unified acknowledgment process
        return this.processDrawnCardsWithAcknowledgment(
            playerId,
            cardType, 
            cardsToAdd,
            returnMessage
        );

        const newCardsForType = [...(currentPlayer.cards?.[cardType] || []), ...cardsForHand];
        
        
        
        // Only recalculate scope for W cards, preserve existing scope for other card types
        let scopeItems, scopeTotalCost;
        if (cardType === 'W') {
            // For W cards, recalculate scope from all W cards (hand cards only, immediate W cards are handled separately)
            const result = this.calculatePlayerScope(newCardsForType);
            scopeItems = result.scopeItems;
            scopeTotalCost = result.scopeTotalCost;
            console.log('✅ SCOPE FIX: Recalculated scope for W cards:', { items: scopeItems.length, total: scopeTotalCost });
        } else {
            // For non-W cards (like E), preserve existing scope data
            scopeItems = currentPlayer.scopeItems || [];
            scopeTotalCost = currentPlayer.scopeTotalCost || 0;
            console.log('✅ SCOPE FIX: Preserved existing scope for', cardType, 'cards:', { items: scopeItems.length, total: scopeTotalCost });
        }

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
     * Play card from hand with full deck management integration
     * This is the main method for playing cards from hand UI
     * @param {number} playerId - Player ID
     * @param {string} cardId - Card ID to play
     * @returns {string} User-friendly result message
     */
    playCardFromHand(playerId, cardId) {
        return this.usePlayerCard(playerId, cardId);
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
            
            // 4. Remove card from hand
            const removed = this.removeCardFromHand(playerId, cardId);
            if (!removed) {
                throw new Error('Failed to remove card from hand');
            }
            
            // 5. DECK MANAGEMENT INTEGRATION: Handle card state transitions
            this.handleCardStateTransition(card, cardType, playerId);
            
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
     * Evaluate space effect condition for a player
     */
    evaluateEffectCondition(playerId, condition) {
        if (!condition || condition === 'always') {
            return true;
        }

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            return false;
        }

        const playerScope = player.scopeTotalCost || 0;
        
        console.log(`🔍 CONDITION: Evaluating ${condition} for player ${player.name}`);
        console.log(`🔍 CONDITION: Player scope: $${playerScope.toLocaleString()}`);

        switch (condition) {
            case 'scope_le_4M':
                const result_le = playerScope <= 4000000;
                console.log(`🔍 CONDITION: ${condition} result: ${result_le}`);
                return result_le;
            case 'scope_gt_4M':
                const result_gt = playerScope > 4000000;
                console.log(`🔍 CONDITION: ${condition} result: ${result_gt}`);
                return result_gt;
                
            // Dice roll conditions: Check against actual dice roll value
            case 'roll_1':
                const lastDiceRoll_1 = this.state.currentTurn?.lastDiceRoll;
                const result_roll1 = lastDiceRoll_1 === 1;
                console.log(`🔍 CONDITION: ${condition} result: ${result_roll1} (lastDiceRoll: ${lastDiceRoll_1})`);
                return result_roll1;
            case 'roll_2':
                const lastDiceRoll_2 = this.state.currentTurn?.lastDiceRoll;
                const result_roll2 = lastDiceRoll_2 === 2;
                console.log(`🔍 CONDITION: ${condition} result: ${result_roll2} (lastDiceRoll: ${lastDiceRoll_2})`);
                return result_roll2;
                
            // Player-choice conditions: These are fulfilled by the player clicking the button
            case 'replace':
            case 'to_right_player':
            case 'return':
            case 'loan_up_to_1.4M':
            case 'loan_1.5M_to_2.75M':
            case 'loan_above_2.75M':
            case 'percent_of_borrowed':
            case 'per_200k':
                console.log(`🔍 CONDITION: Player-choice condition ${condition} - returning true`);
                return true;
                
            default:
                console.warn(`Unknown condition: ${condition}`);
                return false;
        }
    }

    /**
     * Determine if an effect inherently requires a dice roll and cannot be processed automatically
     * This makes the system resilient to missing 'manual' flags on dice-dependent effects
     */
    effectRequiresDiceRoll(effect) {
        // Check if effect explicitly uses dice
        if (effect.use_dice === 'true' || effect.use_dice === true) {
            return true;
        }

        // Check if effect value depends on dice roll
        if (effect.effect_value === 'dice') {
            return true;
        }

        // Check if effect condition depends on specific dice roll results
        if (effect.condition && (effect.condition.startsWith('roll_') || 
            ['roll_1', 'roll_2', 'roll_3', 'roll_4', 'roll_5', 'roll_6'].includes(effect.condition))) {
            return true;
        }

        return false;
    }

    /**
     * Process mutually exclusive card effects (like B/I cards based on scope)
     */
    processMutuallyExclusiveCardEffects(playerId, effects) {
        console.log('🔍 CONDITIONAL: Processing mutually exclusive card effects');
        console.log('🔍 CONDITIONAL: Effects to evaluate:', effects.length);
        
        const messages = [];
        
        // Group effects by their mutual exclusion criteria
        const scopeBasedEffects = effects.filter(effect => 
            effect.condition && (effect.condition.includes('scope_le_4M') || effect.condition.includes('scope_gt_4M'))
        );
        
        if (scopeBasedEffects.length > 0) {
            console.log('🔍 CONDITIONAL: Found', scopeBasedEffects.length, 'scope-based effects');
            
            // Evaluate each condition and only process the first one that matches
            for (const effect of scopeBasedEffects) {
                const conditionMet = this.evaluateEffectCondition(playerId, effect.condition);
                console.log('🔍 CONDITIONAL: Effect', effect.effect_type, 'condition', effect.condition, 'met:', conditionMet);
                
                if (conditionMet) {
                    const message = this.processSpaceEffect(playerId, effect);
                    if (message) {
                        messages.push(message);
                    }
                    // CRITICAL: Only process ONE effect from mutually exclusive group
                    break;
                }
            }
        }
        
        return messages;
    }

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
                case 'w_cards':
                case 'b_cards':
                case 'i_cards':
                case 'l_cards':
                case 'e_cards': {
                    const cardType = effect.card_type || 'W';
                    const amount = parseInt(effect.effect_value) || 1;
                    
                    // Use new deck management system - draws unique cards with proper removal
                    const drawnCards = this.drawCardsFromDeck(cardType, amount);
                    
                    if (drawnCards.length === 0) {
                        return `No ${cardType} cards available to draw`;
                    }
                    
                    // Add cards through existing method with message return
                    return this.addCardsToPlayer(playerId, cardType, drawnCards, true);
                }
                
                case 'time': {
                    const timeAmount = parseInt(effect.effect_value) || 0;
                    return this.updatePlayerTime(playerId, timeAmount, `Space effect: ${effect.space}`, true);
                }
                
                case 'money': {
                    const moneyAmount = parseInt(effect.effect_value) || 0;
                    return this.updatePlayerMoney(playerId, moneyAmount, `Space effect: ${effect.space}`, true);
                }
                
                case 'fee': {
                    const feeAmount = parseInt(effect.effect_value) || 0;
                    // Fees are negative money effects
                    return this.updatePlayerMoney(playerId, -feeAmount, `Space fee: ${effect.space}`, true);
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
        
        
        // Identify mutually exclusive card effect groups (B/I cards based on scope)
        const mutuallyExclusiveEffects = effects.filter(effect => {
            return (effect.effect_type === 'b_cards' || effect.effect_type === 'i_cards') && 
                   effect.condition && 
                   (effect.condition.includes('scope_le_4M') || effect.condition.includes('scope_gt_4M'));
        });
        
        // Process mutually exclusive groups first, BUT skip automatic processing for OWNER-FUND-INITIATION
        if (mutuallyExclusiveEffects.length > 0 && spaceName !== 'OWNER-FUND-INITIATION') {
            console.log('🔍 CONDITIONAL: Found mutually exclusive card effects, processing with conditional logic');
            const conditionalMessages = this.processMutuallyExclusiveCardEffects(playerId, mutuallyExclusiveEffects);
            effectMessages.push(...conditionalMessages);
        } else if (spaceName === 'OWNER-FUND-INITIATION') {
            console.log('🔍 CONDITIONAL: Skipping automatic B/I card draw at OWNER-FUND-INITIATION - waiting for manual trigger');
        }
        
        // Process remaining non-mutually-exclusive effects
        const remainingEffects = effects.filter(effect => {
            // Skip effects that were already processed in mutually exclusive groups
            return !(mutuallyExclusiveEffects.includes(effect));
        });
        
        for (const effect of remainingEffects) {
            this.log(`Processing regular effect:`, effect);
            
            
            // Skip effects that are manually triggered OR inherently require dice rolls
            if (effect.trigger_type === 'manual' || this.effectRequiresDiceRoll(effect)) {
                if (effect.trigger_type === 'manual') {
                    this.log(`Skipping manual trigger effect: ${effect.effect_type}`);
                } else {
                    this.log(`Skipping dice-dependent effect: ${effect.effect_type} (requires dice roll)`);
                }
                continue;
            }
            
            // Evaluate condition for regular effects
            const conditionMet = this.evaluateEffectCondition(playerId, effect.condition);
            if (conditionMet) {
                const message = this.processSpaceEffect(playerId, effect);
                if (message) {
                    effectMessages.push(message);
                }
            } else {
                this.log(`Skipping effect due to unmet condition: ${effect.condition}`);
            }
        }
        
        return effectMessages;
    }

    /**
     * Trigger manual funding card draw for OWNER-FUND-INITIATION space
     * This method handles the B/I card conditional logic that was skipped during automatic processing
     */
    triggerFundingCardDraw(playerId) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`Player ${playerId} not found`);
            return [];
        }

        // Only allow this for players at OWNER-FUND-INITIATION
        if (player.position !== 'OWNER-FUND-INITIATION') {
            console.error(`Player ${player.name} is not at OWNER-FUND-INITIATION space`);
            return [];
        }

        console.log(`🔍 MANUAL: Triggering funding card draw for ${player.name} at ${player.position}`);

        // Get the B/I card effects for OWNER-FUND-INITIATION
        const effects = this.getSpaceEffects('OWNER-FUND-INITIATION', player.visitType || 'First');
        const mutuallyExclusiveEffects = effects.filter(effect => {
            return (effect.effect_type === 'b_cards' || effect.effect_type === 'i_cards') && 
                   effect.condition && 
                   (effect.condition.includes('scope_le_4M') || effect.condition.includes('scope_gt_4M'));
        });

        if (mutuallyExclusiveEffects.length === 0) {
            console.log('🔍 MANUAL: No B/I card effects found for OWNER-FUND-INITIATION');
            return [];
        }

        // Process the conditional B/I card effects
        const messages = this.processMutuallyExclusiveCardEffects(playerId, mutuallyExclusiveEffects);
        
        // If card was successfully drawn, mark funding card as drawn and space actions as completed
        if (messages.length > 0) {
            this.setState({
                currentTurn: {
                    ...this.state.currentTurn,
                    fundingCardDrawnForSpace: true,
                    spaceActionsCompleted: true
                }
            });
            console.log('🔍 MANUAL: Funding card draw completed, button will be hidden');
            console.log('🔍 MANUAL: Space actions marked as completed, other card buttons will be hidden');
            
            // Mark funding card draw as completed action
            this.emit('playerActionTaken', {
                playerId: playerId,
                actionType: 'card',
                actionData: {
                    source: 'funding_card_draw',
                    spaceName: 'OWNER-FUND-INITIATION',
                    cardType: mutuallyExclusiveEffects[0]?.card_type,
                    messages: messages
                },
                timestamp: Date.now(),
                spaceName: 'OWNER-FUND-INITIATION',
                visitType: player.visitType || 'First'
            });
            console.log('🔍 MANUAL: Funding card draw marked as completed action');
        }
        
        // Emit event for UI feedback
        this.emit('fundingCardDrawn', {
            playerId,
            player,
            spaceName: 'OWNER-FUND-INITIATION',
            messages
        });

        return messages;
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
                    lastActionTimestamp: Date.now(),
                    fundingCardDrawnForSpace: false,
                    spaceActionsCompleted: false,
                    lastDiceRoll: null
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
                    player.visitType || 'First',
                    this.state,
                    window.GameManagerEffectsEngine
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
                lastActionTimestamp: Date.now(),
                fundingCardDrawnForSpace: false,
                spaceActionsCompleted: false,
                lastDiceRoll: null
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

        // Store dice roll value if this is a dice action
        let updatedCurrentTurn = {
            ...this.state.currentTurn,
            requiredActions: requiredActions,
            completedActions: completedActions,
            actionCounts: {
                required: requiredCount,
                completed: completedCount
            },
            canEndTurn: canEndTurn,
            lastActionTimestamp: Date.now()
        };

        // If this is a dice action, store the dice value
        if (actionType === 'dice' && actionDetails?.diceValue) {
            updatedCurrentTurn.lastDiceRoll = actionDetails.diceValue;
        }

        // Update state
        this.setState({
            currentTurn: updatedCurrentTurn
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
     * Handle drawCards events from EffectsEngine
     * FIXED: Now uses proper deck management system
     */
    handleDrawCards(eventData) {
        const { playerId, cardType, count, source } = eventData;
        
        try {
            // Use new deck management system - draws unique cards with proper removal
            const drawnCards = this.drawCardsFromDeck(cardType, count || 1);
            
            if (drawnCards.length === 0) {
                console.warn(`GameStateManager: No ${cardType} cards could be drawn`);
                return;
            }
            
            // Use existing addCardsToPlayer method
            const message = this.addCardsToPlayer(playerId, cardType, drawnCards, true);
            
        } catch (error) {
            console.error('GameStateManager: Error handling drawCards event:', error);
            this.handleError(error, 'Draw Cards Event');
        }
    }

    /**
     * Handle removeCards events from EffectsEngine
     */
    handleRemoveCards(eventData) {
        const { playerId, cardType, count, source } = eventData;
        
        try {
            const playerIndex = this.state.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                console.error(`GameStateManager: Player ${playerId} not found for card removal`);
                return;
            }
            
            const currentPlayer = this.state.players[playerIndex];
            
            // Ensure player has cards of this type
            if (!currentPlayer.cards[cardType] || !Array.isArray(currentPlayer.cards[cardType])) {
                console.log(`GameStateManager: Player ${playerId} has no ${cardType} cards to remove`);
                return;
            }
            
            const currentCards = currentPlayer.cards[cardType];
            const removeCount = Math.min(count, currentCards.length);
            
            if (removeCount > 0) {
                // Create new player object with updated cards
                const updatedPlayer = {
                    ...currentPlayer,
                    cards: {
                        ...currentPlayer.cards,
                        [cardType]: currentCards.slice(removeCount) // Remove from beginning of array
                    }
                };
                
                // Update state
                const updatedPlayers = [...this.state.players];
                updatedPlayers[playerIndex] = updatedPlayer;
                this.setState({ players: updatedPlayers });
                
                // Emit event for UI feedback
                this.emit('cardsRemovedFromPlayer', {
                    playerId,
                    cardType,
                    removedCount: removeCount,
                    source
                });
            }
            
        } catch (error) {
            console.error('GameStateManager: Error handling removeCards event:', error);
            this.handleError(error, 'Remove Cards Event');
        }
    }

    /**
     * Handle showCardReplacement events - triggers the replacement modal
     */
    handleShowCardReplacement(eventData) {
        const { playerId, cardType, amount } = eventData;
        
        try {
            const player = this.state.players.find(p => p.id === playerId);
            if (!player) {
                console.error(`GameStateManager: Player ${playerId} not found for card replacement`);
                return;
            }
            
            // Check if player has cards of this type
            if (!player.cards[cardType] || !Array.isArray(player.cards[cardType]) || player.cards[cardType].length === 0) {
                console.log(`GameStateManager: Player ${playerId} has no ${cardType} cards to replace. Drawing cards first...`);
                
                // If no cards to replace, just draw new cards instead
                this.emit('drawCards', {
                    playerId,
                    cardType,
                    count: amount,
                    source: 'replacement_fallback'
                });
                return;
            }
            
            // Emit event to show the replacement modal
            console.log('GameStateManager: Emitting showCardReplacementModal with player.cards:', player.cards);
            this.emit('showCardReplacementModal', {
                playerId,
                cardType,
                amount,
                playerCards: player.cards,
                playerName: player.name
            });
            
        } catch (error) {
            console.error('GameStateManager: Error handling showCardReplacement event:', error);
            this.handleError(error, 'Show Card Replacement Event');
        }
    }

    /**
     * Handle cardReplacementConfirmed events - executes the actual replacement
     */
    handleCardReplacementConfirmed(eventData) {
        const { playerId, cardType, amount, cardsToReplace, selectedIndices } = eventData;
        
        try {
            const playerIndex = this.state.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) {
                console.error(`GameStateManager: Player ${playerId} not found for card replacement`);
                return;
            }
            
            const currentPlayer = this.state.players[playerIndex];
            
            // Draw new cards first
            const newCards = this.drawCardsFromDeck(cardType, amount);
            if (newCards.length === 0) {
                console.warn(`GameStateManager: No ${cardType} cards could be drawn for replacement`);
                return;
            }
            
            // Remove selected cards from player's hand (sort indices in descending order to avoid index shifts)
            let updatedCards = [...currentPlayer.cards[cardType]];
            const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
            for (const index of sortedIndices) {
                if (index >= 0 && index < updatedCards.length) {
                    updatedCards.splice(index, 1);
                }
            }
            
            // Add new cards to player's hand
            updatedCards = [...updatedCards, ...newCards];
            
            // Update player state
            const updatedPlayer = {
                ...currentPlayer,
                cards: {
                    ...currentPlayer.cards,
                    [cardType]: updatedCards
                }
            };
            
            const updatedPlayers = [...this.state.players];
            updatedPlayers[playerIndex] = updatedPlayer;
            this.setState({ players: updatedPlayers });
            
            // Show acknowledgment for the new cards
            this.processDrawnCardsWithAcknowledgment(playerId, cardType, newCards, true);
            
            // Emit event for UI feedback
            this.emit('cardReplacementCompleted', {
                playerId,
                cardType,
                replacedCards: cardsToReplace,
                newCards,
                source: 'card_replacement'
            });
            
            console.log(`GameStateManager: Replaced ${amount} ${cardType} cards for player ${currentPlayer.name}`);
            
        } catch (error) {
            console.error('GameStateManager: Error handling cardReplacementConfirmed event:', error);
            this.handleError(error, 'Card Replacement Confirmed Event');
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

    /**
     * DEBUG: Test immediate card acknowledgment system
     * Tests W, B, I, L cards with user acknowledgment flow
     */
    testImmediateCardAcknowledgment() {
        console.log('🧪 Testing Immediate Card Acknowledgment System...');
        
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.log('❌ CSVDatabase not loaded');
            return false;
        }

        try {
            // Initialize decks if not done
            if (!this.state.cardDecks || !this.state.cardDecks.W.available.length) {
                this.initializeCardDecks();
            }

            // Ensure we have a test player
            if (this.state.players.length === 0) {
                this.setState({
                    players: [{
                        id: 1,
                        name: 'Test Player',
                        cards: { W: [], B: [], I: [], L: [], E: [] },
                        money: 10000,
                        timeSpent: 0
                    }]
                });
            }

            const testPlayerId = this.state.players[0].id;

            // Test each immediate card type
            const cardTests = [
                { type: 'W', description: 'Worktype (immediate to project scope)' },
                { type: 'B', description: 'Bank (immediate money effect)' },
                { type: 'I', description: 'Investment (immediate money effect)' },
                { type: 'L', description: 'Life (immediate or persistent effects)' }
            ];

            cardTests.forEach(({ type, description }) => {
                console.log(`\n🎯 Testing ${type} card acknowledgment (${description})`);
                
                // Draw 2 cards of this type to test the acknowledgment system
                const testCards = this.drawCardsFromDeck(type, 2);
                
                if (testCards.length > 0) {
                    console.log(`✅ Drew ${testCards.length} ${type} cards: ${testCards.map(c => c.card_id).join(', ')}`);
                    
                    // This should trigger the acknowledgment system
                    const message = this.addCardsToPlayer(testPlayerId, type, testCards, true);
                    console.log(`📋 Result message: ${message}`);
                    
                    // Check if acknowledgment system is active
                    if (this.isCardAcknowledgmentActive()) {
                        console.log(`✅ Card acknowledgment system activated`);
                        console.log(`📋 Cards in queue: ${this.state.cardAcknowledgment.queue.length}`);
                        console.log(`🎴 Current card: ${this.state.cardAcknowledgment.currentCard?.card_id}`);
                    } else {
                        console.log(`❌ Card acknowledgment system NOT activated`);
                    }
                } else {
                    console.log(`❌ No ${type} cards available for testing`);
                }
            });

            console.log(`\n📊 Final acknowledgment state:`, {
                isActive: this.state.cardAcknowledgment.isActive,
                queueLength: this.state.cardAcknowledgment.queue.length,
                currentCard: this.state.cardAcknowledgment.currentCard?.card_id || 'None'
            });

            console.log('🎉 Immediate card acknowledgment test setup completed');
            console.log('💡 Use window.GameStateManager.acknowledgeCard() to manually acknowledge cards');
            
            return true;

        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
            return false;
        }
    }

    /**
     * DEBUG: Test card playing from hand functionality
     * Creates a test scenario with cards in hand and tests playing them
     */
    testCardPlayingFromHand() {
        console.log('🧪 Testing Card Playing From Hand...');
        
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            console.log('❌ CSVDatabase not loaded');
            return false;
        }

        try {
            // Initialize decks if not done
            if (!this.state.cardDecks || !this.state.cardDecks.E.available.length) {
                this.initializeCardDecks();
            }

            // Get test E cards
            const testECards = window.CSVDatabase.cards.query({
                card_type: 'E',
                activation_timing: 'Player Controlled'
            }).slice(0, 2);

            if (testECards.length === 0) {
                console.log('❌ No E cards available for testing');
                return false;
            }

            // Ensure we have a test player
            if (this.state.players.length === 0) {
                this.setState({
                    players: [{
                        id: 1,
                        name: 'Test Player',
                        cards: { W: [], B: [], I: [], L: [], E: [] },
                        money: 10000,
                        timeSpent: 0
                    }]
                });
            }

            const testPlayerId = this.state.players[0].id;

            // Add E cards to player's hand manually for testing
            this.addCardsToPlayer(testPlayerId, 'E', testECards, false);

            console.log(`✅ Added ${testECards.length} E cards to player hand`);
            console.log(`📋 Player hand: ${testECards.map(c => c.card_id).join(', ')}`);

            // Test playing first card
            const testCard = testECards[0];
            console.log(`🎮 Playing card: ${testCard.card_id} (${testCard.card_name})`);
            
            const result = this.playCardFromHand(testPlayerId, testCard.card_id);
            console.log(`✅ Card played result: ${result}`);

            // Check deck states
            const deckStates = {
                discarded: this.state.cardDecks.E.discarded.length,
                inPlay: this.state.cardDecks.E.inPlay.length,
                available: this.state.cardDecks.E.available.length
            };

            console.log(`📊 Deck States - Discarded: ${deckStates.discarded}, In-Play: ${deckStates.inPlay}, Available: ${deckStates.available}`);
            
            // Check if card was removed from player hand
            const playerCards = this.state.players.find(p => p.id === testPlayerId)?.cards?.E || [];
            const cardRemovedFromHand = !playerCards.find(c => c.card_id === testCard.card_id);
            
            if (cardRemovedFromHand) {
                console.log('✅ Card successfully removed from player hand');
            } else {
                console.log('❌ Card still in player hand');
            }

            console.log('🎉 Card playing from hand test completed');
            return true;

        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
            return false;
        }
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