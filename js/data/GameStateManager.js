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

    /**
     * GAME STATE ACTIONS
     */

    /**
     * Initialize new game
     */
    initializeGame(players, settings = {}) {
        const newGameState = {
            ...this.getInitialState(),
            players: players.map((name, index) => ({
                id: index,
                name,
                position: 'OWNER-SCOPE-INITIATION',
                visitType: 'First',
                money: 0,
                timeSpent: 0,
                cards: {
                    W: [],
                    B: [],
                    I: [],
                    L: [],
                    E: []
                },
                loans: [],
                completedSpaces: [],
                isActive: index === 0
            })),
            gameSettings: { ...this.state.gameSettings, ...settings }
        };
        
        // Use setState to ensure proper event emission
        this.state = newGameState;
        this.emit('stateChanged', {
            previous: this.getInitialState(),
            current: this.getState(),
            updates: newGameState
        });
        this.emit('gameInitialized', this.getState());
    }

    /**
     * Start player turn
     */
    startTurn(playerId) {
        const player = this.state.players[playerId];
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        this.setState({
            currentPlayer: playerId,
            turnCount: this.state.turnCount + 1,
            lastAction: null
        });

        this.emit('turnStarted', { player, turnCount: this.state.turnCount });
    }

    /**
     * Move player to new space
     */
    movePlayer(playerId, spaceName, visitType = 'First') {
        const players = [...this.state.players];
        const player = players[playerId];
        
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
    }

    /**
     * Update player money
     */
    updatePlayerMoney(playerId, amount, reason = '') {
        const players = [...this.state.players];
        const player = players[playerId];
        
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
    }

    /**
     * Add cards to player hand
     */
    addCardsToPlayer(playerId, cardType, cards) {
        const players = [...this.state.players];
        const player = players[playerId];
        
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        if (!player.cards[cardType]) {
            player.cards[cardType] = [];
        }

        player.cards[cardType].push(...cards);

        this.setState({ players });
        
        this.emit('cardsAddedToPlayer', {
            player,
            cardType,
            cards,
            totalCards: player.cards[cardType].length
        });
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
                console.log(`[GameStateManager] ${message}`, data);
            } else {
                console.log(`[GameStateManager] ${message}`);
            }
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