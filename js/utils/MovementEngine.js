/**
 * MovementEngine - Advanced movement logic for code2026
 * Integrates sophisticated movement features while preserving code2026 patterns
 * 
 * Architecture:
 * - Singleton pattern to prevent multiple instances
 * - CSV-first database integration
 * - Event-driven communication
 * - Defensive programming with null safety
 * - Component splitting (<500 lines)
 */

class MovementEngine {
    constructor() {
        // Singleton pattern - prevent multiple instances
        if (MovementEngine.instance) {
            return MovementEngine.instance;
        }
        
        this.spaceTypeCache = new Map();
        this.visitHistory = new Map(); // playerId -> Set of visited spaces
        this.singleChoiceDecisions = new Map(); // playerId -> Map of space -> decision
        this.auditStates = new Map(); // playerId -> audit status
        this.debug = false;
        this.gameStateManager = null;
        this.databaseRetryCount = 0;
        this.maxRetries = 3;
        
        MovementEngine.instance = this;
    }

    /**
     * Initialize movement engine with game state
     */
    initialize(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.log('MovementEngine initialized as singleton');
    }

    /**
     * Get available moves for a player with advanced logic
     */
    getAvailableMoves(player) {
        // Return empty array if database not available, but don't fail silently
        const databaseReady = this.validateDatabaseAccess();
        if (!databaseReady) {
            this.log('Database not ready, returning empty moves');
            return [];
        }
        
        if (!player || !player.position) {
            this.log('Invalid player or position provided');
            return [];
        }

        const currentSpace = this.getCurrentSpaceData(player);
        if (!currentSpace) {
            this.log(`No space data found for ${player.position}`);
            return [];
        }

        const spaceType = this.getSpaceType(currentSpace);
        const visitType = this.getVisitType(player, player.position);

        this.log(`Getting moves for ${player.name} at ${player.position} (${spaceType}, ${visitType})`);

        switch (spaceType) {
            case 'Main':
                return this.getMainPathMoves(currentSpace, player, visitType);
            case 'Side quest':
                return this.getSideQuestMoves(currentSpace, player, visitType);
            case 'Special':
                return this.getSpecialMoves(currentSpace, player, visitType);
            case 'Logic':
                return this.getLogicMoves(currentSpace, player, visitType);
            default:
                return this.getDefaultMoves(currentSpace, player, visitType);
        }
    }

    /**
     * Execute movement with advanced validation and processing
     */
    executeMovement(player, targetSpace, options = {}) {
        if (!this.validateDatabaseAccess()) return false;
        if (!player || !targetSpace) return false;

        const currentSpace = this.getCurrentSpaceData(player);
        if (!currentSpace) return false;

        // Validate movement is allowed
        const availableMoves = this.getAvailableMoves(player);
        if (!availableMoves.includes(targetSpace)) {
            this.log(`Movement to ${targetSpace} not allowed for ${player.name}`);
            return false;
        }

        // Process movement based on space type
        const targetSpaceData = this.getSpaceData(targetSpace, 'First');
        if (!targetSpaceData) return false;

        const spaceType = this.getSpaceType(targetSpaceData);
        const visitType = this.getVisitType(player, targetSpace);

        // Track visit history
        this.recordVisit(player.id, targetSpace);

        // Apply space effects
        this.applySpaceEffects(player, targetSpaceData, visitType);

        // Handle special space types
        this.handleSpecialSpaceLogic(player, targetSpaceData, spaceType, visitType);

        this.log(`${player.name} moved to ${targetSpace} (${spaceType}, ${visitType})`);
        return true;
    }

    /**
     * Determine space type from CSV data
     */
    getSpaceType(spaceData) {
        if (!spaceData) return 'Unknown';

        const cacheKey = spaceData.space_name;
        if (this.spaceTypeCache.has(cacheKey)) {
            return this.spaceTypeCache.get(cacheKey);
        }

        let spaceType = 'Main'; // Default

        // Determine type from path field
        if (spaceData.path) {
            const pathLower = spaceData.path.toLowerCase();
            if (pathLower.includes('side quest')) {
                spaceType = 'Side quest';
            } else if (pathLower.includes('special')) {
                spaceType = 'Special';
            } else if (pathLower.includes('logic')) {
                spaceType = 'Logic';
            }
        }

        // Determine type from space name patterns
        const spaceName = spaceData.space_name || '';
        if (spaceName.includes('DECISION-CHECK') || spaceName.includes('LOGIC')) {
            spaceType = 'Logic';
        } else if (spaceName.includes('BANK-') || spaceName.includes('INVESTOR-')) {
            spaceType = 'Side quest';
        }

        // Determine type from event content
        const event = spaceData.Event || '';
        if (event.toLowerCase().includes('yes/no') || event.toLowerCase().includes('choose')) {
            spaceType = 'Logic';
        }

        this.spaceTypeCache.set(cacheKey, spaceType);
        return spaceType;
    }

    /**
     * Determine visit type (First/Subsequent) for player and space
     */
    getVisitType(player, spaceName) {
        if (!player || !spaceName) return 'First';

        // Initialize player history if not exists
        if (!this.visitHistory.has(player.id)) {
            this.visitHistory.set(player.id, new Set());
        }
        
        const playerHistory = this.visitHistory.get(player.id);
        
        // If player is currently at this space but it's not in history,
        // it means this is their first visit (they haven't moved away yet)
        const isFirstVisit = !playerHistory.has(spaceName);
        
        this.log(`Visit type for ${player.name} at ${spaceName}: ${isFirstVisit ? 'First' : 'Subsequent'}`);
        return isFirstVisit ? 'First' : 'Subsequent';
    }

    /**
     * Record player visit to space
     */
    recordVisit(playerId, spaceName) {
        if (!this.visitHistory.has(playerId)) {
            this.visitHistory.set(playerId, new Set());
        }
        this.visitHistory.get(playerId).add(spaceName);
    }

    /**
     * Get main path movement options
     */
    getMainPathMoves(spaceData, player, visitType) {
        const moves = [];
        
        // For dice roll spaces, check if we have dice roll results available
        if (spaceData.requires_dice_roll === 'Yes') {
            // Look for dice roll outcomes in the DiceRoll Info.csv
            const diceConfig = this.getDiceConfiguration(spaceData.space_name, visitType);
            if (diceConfig) {
                // Return all possible dice outcomes as potential moves
                for (let roll = 1; roll <= 6; roll++) {
                    const outcome = diceConfig[roll.toString()];
                    if (outcome && outcome.trim() && !moves.includes(outcome)) {
                        moves.push(outcome);
                    }
                }
            }
            
            // If no dice config found, fall back to direct space connections
            if (moves.length === 0) {
                this.log(`No dice config found for ${spaceData.space_name}, using direct connections`);
            }
        }

        // Always include direct destinations from space_1, space_2, etc.
        for (let i = 1; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (spaceData[spaceKey] && spaceData[spaceKey].trim()) {
                const destination = spaceData[spaceKey].trim();
                if (!moves.includes(destination)) {
                    moves.push(destination);
                }
            }
        }

        return moves;
    }

    /**
     * Get side quest movement options
     */
    getSideQuestMoves(spaceData, player, visitType) {
        const moves = [];

        // Side quests typically return to main path
        if (spaceData.space_1 && spaceData.space_1.trim()) {
            moves.push(spaceData.space_1);
        }

        // Check for additional side quest connections
        for (let i = 2; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (spaceData[spaceKey] && spaceData[spaceKey].trim()) {
                moves.push(spaceData[spaceKey]);
            }
        }

        return moves;
    }

    /**
     * Get special space movement options
     */
    getSpecialMoves(spaceData, player, visitType) {
        const moves = [];

        // Special spaces like PM-DECISION-CHECK offer multiple paths
        for (let i = 1; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (spaceData[spaceKey] && spaceData[spaceKey].trim()) {
                moves.push(spaceData[spaceKey]);
            }
        }

        return moves;
    }

    /**
     * Get logic space movement options (handled by LogicSpaceManager)
     */
    getLogicMoves(spaceData, player, visitType) {
        // Logic spaces are handled by LogicSpaceManager component
        // Return empty moves to prevent normal movement
        return [];
    }

    /**
     * Get default movement options
     */
    getDefaultMoves(spaceData, player, visitType) {
        const moves = [];

        for (let i = 1; i <= 5; i++) {
            const spaceKey = `space_${i}`;
            if (spaceData[spaceKey] && spaceData[spaceKey].trim()) {
                moves.push(spaceData[spaceKey]);
            }
        }

        return moves;
    }

    /**
     * Apply space effects (time, money, cards)
     */
    applySpaceEffects(player, spaceData, visitType) {
        if (!spaceData) return;

        // Apply time effects
        if (spaceData.Time && spaceData.Time !== '') {
            this.applyTimeEffect(player, spaceData.Time);
        }

        // Apply fee effects
        if (spaceData.Fee && spaceData.Fee !== '') {
            this.applyFeeEffect(player, spaceData.Fee);
        }

        // Apply card effects
        this.applyCardEffects(player, spaceData, visitType);

        // Emit space action completed event for turn validation
        if (this.gameStateManager) {
            this.gameStateManager.emit('spaceActionCompleted', {
                playerId: player.id,
                player: player,
                spaceName: spaceData.space_name,
                spaceData: spaceData,
                visitType: visitType
            });
        }
    }

    /**
     * Apply time effects to player
     */
    applyTimeEffect(player, timeEffect) {
        if (!timeEffect || timeEffect === '') return;

        // Parse time effect (e.g., "5 days", "1 day per $200K")
        const timeStr = timeEffect.toLowerCase();
        let timeToAdd = 0;

        if (timeStr.includes('day')) {
            const dayMatch = timeStr.match(/(\d+)\s*day/);
            if (dayMatch) {
                timeToAdd = parseInt(dayMatch[1]);
            }
        }

        if (timeToAdd > 0 && this.gameStateManager) {
            this.gameStateManager.emit('addPlayerTime', {
                playerId: player.id,
                timeToAdd: timeToAdd,
                source: 'space_effect'
            });
        }
    }

    /**
     * Apply fee effects to player
     */
    applyFeeEffect(player, feeEffect) {
        if (!feeEffect || feeEffect === '') return;

        // Parse fee effect (e.g., "1% for loan", "$50K")
        // For now, simple percentage or dollar amount
        let feeAmount = 0;

        if (feeEffect.includes('$')) {
            const dollarMatch = feeEffect.match(/\$(\d+(?:\.\d+)?)[KMB]?/);
            if (dollarMatch) {
                feeAmount = parseFloat(dollarMatch[1]);
                if (feeEffect.includes('K')) feeAmount *= 1000;
                if (feeEffect.includes('M')) feeAmount *= 1000000;
                if (feeEffect.includes('B')) feeAmount *= 1000000000;
            }
        }

        if (feeAmount > 0 && this.gameStateManager) {
            this.gameStateManager.emit('addPlayerMoney', {
                playerId: player.id,
                amount: -feeAmount, // Negative for fee
                source: 'space_effect'
            });
        }
    }

    /**
     * Apply card effects to player
     */
    applyCardEffects(player, spaceData, visitType) {
        const cardTypes = ['w_card', 'b_card', 'i_card', 'l_card', 'e_card'];
        
        cardTypes.forEach(cardType => {
            const cardEffect = spaceData[cardType];
            if (cardEffect && cardEffect !== '') {
                this.processCardEffect(player, cardType, cardEffect);
            }
        });
    }

    /**
     * Process individual card effect
     */
    processCardEffect(player, cardType, effect) {
        if (!effect || effect === '') return;

        const effectLower = effect.toLowerCase();
        
        // Parse card effect (e.g., "Draw 3", "Return 1", "Replace 1")
        if (effectLower.includes('draw')) {
            const drawMatch = effect.match(/draw\s+(\d+)/i);
            if (drawMatch && this.gameStateManager) {
                const count = parseInt(drawMatch[1]);
                const type = cardType.replace('_card', '').toUpperCase();
                this.gameStateManager.emit('drawCards', {
                    playerId: player.id,
                    cardType: type,
                    count: count,
                    source: 'space_effect'
                });
            }
        } else if (effectLower.includes('return')) {
            const returnMatch = effect.match(/return\s+(\d+)/i);
            if (returnMatch && this.gameStateManager) {
                const count = parseInt(returnMatch[1]);
                const type = cardType.replace('_card', '').toUpperCase();
                this.gameStateManager.emit('returnCards', {
                    playerId: player.id,
                    cardType: type,
                    count: count,
                    source: 'space_effect'
                });
            }
        }
    }

    /**
     * Handle special space logic
     */
    handleSpecialSpaceLogic(player, spaceData, spaceType, visitType) {
        const spaceName = spaceData.space_name;

        // Handle single choice spaces
        if (this.isSingleChoiceSpace(spaceData)) {
            this.recordSingleChoiceDecision(player.id, spaceName);
        }

        // Handle audit spaces
        if (this.isAuditSpace(spaceData)) {
            this.updateAuditState(player.id, spaceData);
        }

        // Handle logic spaces (trigger LogicSpaceManager)
        if (spaceType === 'Logic') {
            if (this.gameStateManager) {
                this.gameStateManager.emit('logicSpaceTriggered', {
                    player: player,
                    spaceData: spaceData
                });
            }
        }
    }

    /**
     * Check if space is a single choice space
     */
    isSingleChoiceSpace(spaceData) {
        const spaceName = spaceData.space_name || '';
        const event = spaceData.Event || '';
        
        return spaceName.includes('SINGLE-CHOICE') || 
               event.toLowerCase().includes('permanent') ||
               event.toLowerCase().includes('once only');
    }

    /**
     * Check if space is an audit space
     */
    isAuditSpace(spaceData) {
        const spaceName = spaceData.space_name || '';
        return spaceName.includes('AUDIT') || spaceName.includes('REVIEW');
    }

    /**
     * Record single choice decision
     */
    recordSingleChoiceDecision(playerId, spaceName) {
        if (!this.singleChoiceDecisions.has(playerId)) {
            this.singleChoiceDecisions.set(playerId, new Map());
        }
        this.singleChoiceDecisions.get(playerId).set(spaceName, true);
    }

    /**
     * Update audit state for player
     */
    updateAuditState(playerId, spaceData) {
        // Simplified audit state tracking
        this.auditStates.set(playerId, {
            currentAudit: spaceData.space_name,
            timestamp: Date.now()
        });
    }

    /**
     * Get current space data for player
     */
    getCurrentSpaceData(player) {
        if (!player || !player.position) return null;
        const visitType = this.getVisitType(player, player.position);
        return this.getSpaceData(player.position, visitType);
    }

    /**
     * Get space data with defensive database access
     */
    getSpaceData(spaceName, visitType = 'First') {
        if (!this.validateDatabaseAccess()) return null;
        // Use spaceContent for movement data - it contains space connection info
        return window.CSVDatabase.spaceContent.find(spaceName, visitType) || 
               window.CSVDatabase.movement.find(spaceName, visitType);
    }

    /**
     * Validate CSV database access with retry logic
     */
    validateDatabaseAccess() {
        if (!window.CSVDatabase) {
            this.log('CSVDatabase object not available');
            return false;
        }
        
        if (!window.CSVDatabase.loaded) {
            this.databaseRetryCount++;
            this.log(`CSVDatabase not loaded yet (attempt ${this.databaseRetryCount}/${this.maxRetries})`);
            
            // Try to trigger loading if possible
            if (this.databaseRetryCount <= this.maxRetries && typeof window.CSVDatabase.loadAll === 'function') {
                this.log('Attempting to load CSV database...');
                window.CSVDatabase.loadAll().catch(error => {
                    this.log(`Failed to load CSV database: ${error.message}`);
                });
            }
            
            return false;
        }
        
        // Reset retry count on successful access
        this.databaseRetryCount = 0;
        return true;
    }
    
    /**
     * Get dice configuration for a space
     */
    getDiceConfiguration(spaceName, visitType) {
        if (!this.validateDatabaseAccess()) return null;
        
        try {
            return window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
        } catch (error) {
            this.log(`Error getting dice configuration for ${spaceName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Debug logging
     */
    log(message) {
        if (this.debug) {
            console.log(`[MovementEngine] ${message}`);
        }
    }

    /**
     * Enable debug logging
     */
    enableDebug() {
        this.debug = true;
    }

    /**
     * Get player visit history
     */
    getVisitHistory(playerId) {
        return this.visitHistory.get(playerId) || new Set();
    }

    /**
     * Get single choice decisions for player
     */
    getSingleChoiceDecisions(playerId) {
        return this.singleChoiceDecisions.get(playerId) || new Map();
    }

    /**
     * Get audit state for player
     */
    getAuditState(playerId) {
        return this.auditStates.get(playerId) || null;
    }

    /**
     * Reset player data (for game restart)
     */
    resetPlayerData(playerId) {
        this.visitHistory.delete(playerId);
        this.singleChoiceDecisions.delete(playerId);
        this.auditStates.delete(playerId);
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.spaceTypeCache.clear();
    }
    
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!MovementEngine.instance) {
            MovementEngine.instance = new MovementEngine();
        }
        return MovementEngine.instance;
    }
    
    /**
     * Force recreation of singleton (for testing/debugging)
     */
    static resetInstance() {
        MovementEngine.instance = null;
    }
}

// Initialize singleton instance
MovementEngine.instance = null;

// Create singleton instance and make it available globally
const movementEngineInstance = MovementEngine.getInstance();
window.MovementEngine = MovementEngine;
window.movementEngine = movementEngineInstance;