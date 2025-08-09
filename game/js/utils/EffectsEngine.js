/**
 * EffectsEngine - Clean CSV Effects System
 * Handles all card, time, and money effects using clean CSV architecture
 * 
 * Uses: SPACE_EFFECTS.csv, DICE_EFFECTS.csv
 */

class EffectsEngine {
    constructor() {
        this.database = null;
        this.debug = false;
        this.conditionHandlers = new Map();
        
        // Initialize condition handlers
        this.initializeConditionHandlers();
    }

    /**
     * Initialize with clean CSV database
     */
    initialize(csvDatabase) {
        this.database = csvDatabase;
        this.log('EffectsEngine initialized with clean CSV database');
    }

    /**
     * Apply all space effects for a player visiting a space
     */
    applySpaceEffects(player, spaceName, visitType = 'First', gameState = {}) {
        if (!this.database || !this.database.loaded) {
            throw new Error('EffectsEngine: Database not loaded');
        }

        const effects = this.database.spaceEffects.find(spaceName, visitType);
        if (!effects || effects.length === 0) {
            this.log(`No space effects found for ${spaceName}/${visitType}`);
            return [];
        }

        const appliedEffects = [];

        effects.forEach(effect => {
            if (this.meetsCondition(effect.condition, gameState, player)) {
                const result = this.applyEffect(player, effect, gameState);
                if (result.success) {
                    appliedEffects.push({
                        effect: effect,
                        result: result
                    });
                }
            } else {
                this.log(`Condition not met for effect: ${effect.condition}`);
            }
        });

        this.log(`Applied ${appliedEffects.length} space effects for ${spaceName}/${visitType}`);
        return appliedEffects;
    }

    /**
     * Apply dice-based effects for a player's dice roll
     */
    applyDiceEffects(player, spaceName, visitType, diceRoll, gameState = {}) {
        if (!this.database || !this.database.loaded) {
            throw new Error('EffectsEngine: Database not loaded');
        }

        const diceEffects = this.database.diceEffects.find(spaceName, visitType);
        if (!diceEffects || diceEffects.length === 0) {
            this.log(`No dice effects found for ${spaceName}/${visitType}`);
            return [];
        }

        const appliedEffects = [];

        diceEffects.forEach(effectRow => {
            const rollResult = effectRow[`roll_${diceRoll}`];
            if (rollResult && rollResult !== 'No change') {
                const effect = this.parseDiceEffect(effectRow, rollResult, diceRoll);
                if (effect) {
                    const result = this.applyEffect(player, effect, gameState);
                    if (result.success) {
                        appliedEffects.push({
                            effect: effect,
                            result: result,
                            diceRoll: diceRoll
                        });
                    }
                }
            }
        });

        this.log(`Applied ${appliedEffects.length} dice effects for ${spaceName}/${visitType} roll ${diceRoll}`);
        return appliedEffects;
    }

    /**
     * Apply a single effect to a player
     */
    applyEffect(player, effect, gameState = {}) {
        try {
            switch (effect.effect_type) {
                case 'time':
                    return this.applyTimeEffect(player, effect, gameState);
                case 'cards':
                    return this.applyCardEffect(player, effect, gameState);
                case 'money':
                    return this.applyMoneyEffect(player, effect, gameState);
                case 'w_cards':
                case 'b_cards':
                case 'i_cards':
                case 'l_cards':
                case 'e_cards':
                    return this.applySpecificCardEffect(player, effect, gameState);
                default:
                    this.log(`Unknown effect type: ${effect.effect_type}`);
                    return { success: false, reason: 'Unknown effect type' };
            }
        } catch (error) {
            this.log(`Error applying effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply time effect to player
     */
    applyTimeEffect(player, effect, gameState) {
        const action = effect.effect_action;
        const value = parseInt(effect.effect_value) || 0;

        switch (action) {
            case 'add':
                player.time = (player.time || 0) + value;
                this.log(`Added ${value} time to player (total: ${player.time})`);
                return { 
                    success: true, 
                    action: 'time_add', 
                    value: value, 
                    newTotal: player.time 
                };

            case 'add_per_amount':
                // e.g., "1 day per $200K borrowed"
                const baseAmount = this.parsePerAmountCondition(effect.condition);
                const playerAmount = this.getPlayerAmount(player, effect.condition);
                const timeToAdd = Math.floor(playerAmount / baseAmount) * value;
                
                player.time = (player.time || 0) + timeToAdd;
                this.log(`Added ${timeToAdd} time per amount (${playerAmount}/${baseAmount})`);
                return { 
                    success: true, 
                    action: 'time_add_per_amount', 
                    value: timeToAdd, 
                    newTotal: player.time 
                };

            default:
                this.log(`Unknown time action: ${action}`);
                return { success: false, reason: 'Unknown time action' };
        }
    }

    /**
     * Apply card effect to player
     */
    applyCardEffect(player, effect, gameState) {
        const action = effect.effect_action;
        const value = parseInt(effect.effect_value) || 0;
        
        // Parse card type from action (e.g., 'draw_w' -> 'w')
        const cardType = this.parseCardType(action, effect);

        // ARCHITECTURE FIX: EffectsEngine should NOT modify player state directly
        // All card modifications MUST go through GameStateManager events
        
        switch (true) {
            case action.includes('draw'):
                // Emit event for GameStateManager to handle
                if (window.GameStateManager) {
                    window.GameStateManager.emit('drawCards', {
                        playerId: player.id,
                        cardType: cardType,
                        count: value,
                        source: 'card_effect'
                    });
                }
                this.log(`Requested draw of ${value} ${cardType} cards for player ${player.id}`);
                return { 
                    success: true, 
                    action: 'card_draw', 
                    cardType: cardType, 
                    value: value
                };

            case action.includes('remove'):
                // Emit event for GameStateManager to handle
                if (window.GameStateManager) {
                    window.GameStateManager.emit('removeCards', {
                        playerId: player.id,
                        cardType: cardType,
                        count: value,
                        source: 'card_effect'
                    });
                }
                this.log(`Requested removal of ${value} ${cardType} cards for player ${player.id}`);
                return { 
                    success: true, 
                    action: 'card_remove', 
                    cardType: cardType, 
                    value: value
                };

            case action.includes('replace'):
                // Replace typically means remove and draw
                this.log(`Replacing ${value} ${cardType.toUpperCase()} cards`);
                return { 
                    success: true, 
                    action: 'card_replace', 
                    cardType: cardType, 
                    value: value,
                    note: 'Replace action requires UI interaction'
                };

            case action.includes('transfer'):
                this.log(`Transferring ${value} cards (requires multiplayer logic)`);
                return { 
                    success: true, 
                    action: 'card_transfer', 
                    value: value,
                    note: 'Transfer action requires game state management'
                };

            default:
                this.log(`Unknown card action: ${action}`);
                return { success: false, reason: 'Unknown card action' };
        }
    }

    /**
     * Apply specific card type effects (w_cards, b_cards, etc.)
     */
    applySpecificCardEffect(player, effect, gameState) {
        // Extract card type from effect_type (e.g., 'w_cards' -> 'W')
        const cardType = effect.effect_type.replace('_cards', '').toUpperCase();
        
        let value, note;
        
        // Check if this effect uses dice
        if (effect.use_dice === 'true' && effect.effect_value === 'dice') {
            // Look up dice effect from DICE_EFFECTS.csv
            const diceResult = this.getDiceCardEffect(effect.space_name, effect.visit_type, cardType, gameState.lastDiceRoll);
            if (diceResult) {
                value = diceResult.amount;
                note = `Dice roll ${gameState.lastDiceRoll}: ${diceResult.action}`;
                this.log(`Dice-based card effect: ${note}`);
            } else {
                this.log(`No dice effect found for ${effect.space_name}/${effect.visit_type}/${cardType}`);
                return { success: false, reason: 'No dice effect found' };
            }
        } else {
            // Use fixed value
            value = parseInt(effect.effect_value) || 0;
            note = `Drew ${value} ${cardType} cards`;
        }
        
        this.log(`Drawing ${value} ${cardType} cards for player`);
        
        // Emit event for GameStateManager to handle card drawing
        if (window.GameStateManager && value > 0) {
            // DEFENSIVE LOGGING: Log drawCards event emission
            window.GameStateManager.emit('drawCards', {
                playerId: player.id,
                cardType: cardType,
                amount: value,
                source: 'space_effect'
            });
        }
        
        return { 
            success: true, 
            action: 'specific_card_draw', 
            cardType: cardType, 
            value: value,
            note: note
        };
    }

    /**
     * Get dice-based card effect from DICE_EFFECTS.csv
     */
    getDiceCardEffect(spaceName, visitType, cardType, diceRoll) {
        if (!this.database || !this.database.loaded || !this.database.diceEffects) {
            this.log('DICE_EFFECTS database not available');
            return null;
        }

        // Find matching dice effect entry
        const diceEffects = this.database.diceEffects.data || [];
        const matchingEffect = diceEffects.find(row => 
            row.space_name === spaceName && 
            row.visit_type === visitType && 
            row.card_type === cardType.toUpperCase()
        );

        if (!matchingEffect) {
            this.log(`No dice effect found for ${spaceName}/${visitType}/${cardType}`);
            return null;
        }

        // Get the dice roll column (roll_1, roll_2, etc.)
        const rollColumn = `roll_${diceRoll}`;
        const rollValue = matchingEffect[rollColumn];

        if (!rollValue) {
            this.log(`No dice value found for ${rollColumn} in ${spaceName}/${visitType}/${cardType}`);
            return null;
        }

        // Parse the roll value (e.g., "Draw 2", "Remove 1", "No change")
        return this.parseDiceCardAction(rollValue);
    }

    /**
     * Parse dice card action text (e.g., "Draw 2", "Remove 1", "No change")
     */
    parseDiceCardAction(actionText) {
        if (!actionText || actionText === 'No change') {
            return { action: 'No change', amount: 0 };
        }

        const text = actionText.trim();
        
        // Match patterns like "Draw 1", "Draw 2", "Remove 1", "Replace 1"
        const drawMatch = text.match(/Draw (\d+)/i);
        if (drawMatch) {
            return { action: text, amount: parseInt(drawMatch[1]) };
        }

        const removeMatch = text.match(/Remove (\d+)/i);
        if (removeMatch) {
            return { action: text, amount: -parseInt(removeMatch[1]) };
        }

        const replaceMatch = text.match(/Replace (\d+)/i);
        if (replaceMatch) {
            // Replace means remove then draw, so net effect is 0, but we'll treat as draw for now
            return { action: text, amount: parseInt(replaceMatch[1]) };
        }

        // Default to no change if we can't parse
        this.log(`Could not parse dice action: ${text}`);
        return { action: text, amount: 0 };
    }

    /**
     * Apply money effect to player
     */
    applyMoneyEffect(player, effect, gameState) {
        const action = effect.effect_action;
        const value = parseFloat(effect.effect_value) || 0;

        // Ensure player has money
        if (typeof player.money === 'undefined') {
            player.money = 0;
        }

        switch (action) {
            case 'add':
                player.money += value;
                this.log(`Added $${value} to player (total: $${player.money})`);
                return { 
                    success: true, 
                    action: 'money_add', 
                    value: value,
                    newTotal: player.money
                };

            case 'fee_percent':
                // Calculate percentage fee
                const baseAmount = this.getPlayerAmount(player, effect.condition);
                const feeAmount = (baseAmount * value) / 100;
                player.money -= feeAmount;
                this.log(`Applied ${value}% fee ($${feeAmount}) on $${baseAmount}`);
                return { 
                    success: true, 
                    action: 'money_fee_percent', 
                    percentage: value,
                    feeAmount: feeAmount,
                    baseAmount: baseAmount,
                    newTotal: player.money
                };

            case 'fee_fixed':
                player.money -= value;
                this.log(`Applied fixed fee of $${value}`);
                return { 
                    success: true, 
                    action: 'money_fee_fixed', 
                    value: value,
                    newTotal: player.money
                };

            default:
                this.log(`Unknown money action: ${action}`);
                return { success: false, reason: 'Unknown money action' };
        }
    }

    /**
     * Apply work effect to player - Adds work to project scope
     */
    applyWorkEffect(card, playerId) {
        this.log(`Applying work effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyWorkEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyWorkEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Get work cost from card
        const workCost = parseInt(card.work_cost) || 0;
        
        if (workCost === 0) {
            this.log(`Warning: Card ${card.card_id} has no work_cost value`);
            return { success: false, reason: 'No work cost in card' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for work effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        try {
            // Call new addWorkToPlayerScope method with extracted values
            const workType = card.work_type_restriction || 'General Construction';
            const result = window.GameStateManager.addWorkToPlayerScope(playerId, workCost, workType);
            
            this.log(`Successfully applied work effect: Added $${workCost} work cost to player ${playerId} scope`);
            
            return {
                success: true,
                action: 'work_added_to_scope',
                workCost: workCost,
                cardId: card.card_id,
                cardName: card.card_name,
                workType: workType,
                newScopeTotal: result.newScopeTotal
            };
            
        } catch (error) {
            this.log(`Error applying work effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply loan effect to player - Adds loan amount to player's money
     */
    applyLoanEffect(card, playerId) {
        this.log(`Applying loan effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyLoanEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyLoanEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Get loan amount from card
        const loanAmount = parseInt(card.loan_amount) || 0;
        
        if (loanAmount === 0) {
            this.log(`Warning: Card ${card.card_id} has no loan_amount value`);
            return { success: false, reason: 'No loan amount in card' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for loan effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        try {
            // Call existing updatePlayerMoney method with extracted values
            const reason = `Bank loan: ${card.card_name}`;
            const message = window.GameStateManager.updatePlayerMoney(playerId, loanAmount, reason, true);
            
            this.log(`Successfully applied loan effect: Added $${loanAmount} to player ${playerId} from loan`);
            
            return {
                success: true,
                action: 'loan_amount_added',
                loanAmount: loanAmount,
                cardId: card.card_id,
                cardName: card.card_name,
                loanRate: card.loan_rate || 'N/A',
                message: message
            };
            
        } catch (error) {
            this.log(`Error applying loan effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply investment effect to player - Adds investment amount to player's money
     */
    applyInvestmentEffect(card, playerId) {
        this.log(`Applying investment effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyInvestmentEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyInvestmentEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Get investment amount from card
        const investmentAmount = parseInt(card.investment_amount) || 0;
        
        if (investmentAmount === 0) {
            this.log(`Warning: Card ${card.card_id} has no investment_amount value`);
            return { success: false, reason: 'No investment amount in card' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for investment effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        try {
            // Call existing updatePlayerMoney method with extracted values
            const reason = `Investment: ${card.card_name}`;
            const message = window.GameStateManager.updatePlayerMoney(playerId, investmentAmount, reason, true);
            
            this.log(`Successfully applied investment effect: Added $${investmentAmount} to player ${playerId} from investment`);
            
            return {
                success: true,
                action: 'investment_amount_added',
                investmentAmount: investmentAmount,
                cardId: card.card_id,
                cardName: card.card_name,
                message: message
            };
            
        } catch (error) {
            this.log(`Error applying investment effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply life balance effect to player - Adjusts time using time_effect
     */
    applyLifeBalanceEffect(card, playerId) {
        this.log(`Applying life balance effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyLifeBalanceEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyLifeBalanceEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Get time effect from card
        const timeEffect = parseInt(card.time_effect) || 0;
        
        if (timeEffect === 0) {
            this.log(`Warning: Card ${card.card_id} has no time_effect value`);
            return { success: false, reason: 'No time effect in card' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for life balance effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        try {
            // Call existing updatePlayerTime method with extracted values
            const reason = `Life balance: ${card.card_name}`;
            const message = window.GameStateManager.updatePlayerTime(playerId, timeEffect, reason, true);
            
            this.log(`Successfully applied life balance effect: ${timeEffect > 0 ? 'Added' : 'Saved'} ${Math.abs(timeEffect)} days for player ${playerId}`);
            
            return {
                success: true,
                action: 'life_balance_time_adjusted',
                timeEffect: timeEffect,
                cardId: card.card_id,
                cardName: card.card_name,
                message: message
            };
            
        } catch (error) {
            this.log(`Error applying life balance effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply efficiency effect to player - Handles both time and money effects for E cards
     */
    applyEfficiencyEffect(card, playerId) {
        this.log(`Applying efficiency effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyEfficiencyEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyEfficiencyEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for efficiency effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        const results = [];
        let hasEffects = false;

        try {
            // Check for time effect
            const timeEffect = parseInt(card.time_effect) || 0;
            if (timeEffect !== 0) {
                const timeReason = `Efficiency: ${card.card_name}`;
                const timeMessage = window.GameStateManager.updatePlayerTime(playerId, timeEffect, timeReason, true);
                results.push({
                    type: 'time',
                    value: timeEffect,
                    description: `${timeEffect > 0 ? 'Added' : 'Saved'} ${Math.abs(timeEffect)} days`,
                    message: timeMessage
                });
                hasEffects = true;
                this.log(`Applied time effect: ${timeEffect} days for player ${playerId}`);
            }

            // Check for money effect
            const moneyEffect = parseInt(card.money_effect) || 0;
            if (moneyEffect !== 0) {
                const moneyReason = `Efficiency: ${card.card_name}`;
                const moneyMessage = window.GameStateManager.updatePlayerMoney(playerId, moneyEffect, moneyReason, true);
                results.push({
                    type: 'money',
                    value: moneyEffect,
                    description: `${moneyEffect > 0 ? 'Gained' : 'Spent'} $${Math.abs(moneyEffect)}`,
                    message: moneyMessage
                });
                hasEffects = true;
                this.log(`Applied money effect: $${moneyEffect} for player ${playerId}`);
            }

            if (!hasEffects) {
                this.log(`Warning: Card ${card.card_id} has no time_effect or money_effect values`);
                return { success: false, reason: 'No effects in card' };
            }

            this.log(`Successfully applied efficiency effects for player ${playerId}: ${results.length} effects processed`);
            
            return {
                success: true,
                action: 'efficiency_effects_applied',
                effects: results,
                cardId: card.card_id,
                cardName: card.card_name
            };
            
        } catch (error) {
            this.log(`Error applying efficiency effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Apply card effect to player - Handles time effects and forced discards
     */
    applyCardEffect(card, playerId) {
        this.log(`Applying card effect for card ${card.card_id} to player ${playerId}`);
        
        // Validate inputs
        if (!card) {
            this.log('Error: No card provided to applyCardEffect');
            return { success: false, reason: 'No card provided' };
        }
        
        if (!playerId) {
            this.log('Error: No playerId provided to applyCardEffect');
            return { success: false, reason: 'No playerId provided' };
        }

        // Ensure GameStateManager is available
        if (!window.GameStateManager) {
            this.log('Error: GameStateManager not available for card effect');
            return { success: false, reason: 'GameStateManager not available' };
        }

        const results = [];
        let hasEffects = false;

        try {
            // Handle time effects
            const timeEffect = parseInt(card.time_effect) || 0;
            if (timeEffect !== 0) {
                const timeReason = `Card effect: ${card.card_name}`;
                const timeMessage = window.GameStateManager.updatePlayerTime(playerId, timeEffect, timeReason, true);
                results.push(timeMessage);
                hasEffects = true;
                this.log(`Applied time effect: ${timeEffect} days for player ${playerId}`);
            }
            
            // Handle forced discards
            const discardCount = parseInt(card.discard_cards) || 0;
            if (discardCount > 0) {
                const cardTypeFilter = card.card_type_filter || null; // e.g., 'E' for Expeditor cards
                const discardMessage = window.GameStateManager.forcePlayerDiscard(playerId, discardCount, cardTypeFilter);
                results.push(discardMessage);
                hasEffects = true;
                this.log(`Forced discard: ${discardCount} cards for player ${playerId}`);
            }

            // Handle turn effects (skip turn functionality)
            if (card.turn_effect) {
                if (card.turn_effect.includes('Skip next turn')) {
                    window.GameStateManager.setPlayerSkipNextTurn(playerId, true);
                    hasEffects = true;
                    this.log(`Set skip next turn for player ${playerId}`);
                } else if (card.turn_effect.includes('Skip this turn')) {
                    // For "skip this turn", we need immediate turn advancement
                    // This will be handled by the current endTurn() logic
                    hasEffects = true;
                    this.log(`Skip this turn effect for player ${playerId}`);
                }
                results.push(`Turn effect: ${card.turn_effect}`);
            }

            if (!hasEffects) {
                this.log(`Warning: Card ${card.card_id} has no time_effect, discard_cards, or turn_effect values`);
                return { success: false, reason: 'No effects in card' };
            }

            this.log(`Successfully applied card effects for player ${playerId}: ${results.length} effects processed`);
            
            return {
                success: true,
                action: 'card_effects_applied',
                effects: results,
                cardId: card.card_id,
                cardName: card.card_name
            };
            
        } catch (error) {
            this.log(`Error applying card effect: ${error.message}`);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Check if effect condition is met
     */
    meetsCondition(condition, gameState, player) {
        if (!condition || condition === 'always') {
            return true;
        }

        const handler = this.conditionHandlers.get(condition);
        if (handler) {
            return handler(gameState, player);
        }

        // Dynamic condition parsing
        if (condition.includes('scope_le_')) {
            const amount = this.parseAmount(condition.replace('scope_le_', ''));
            return (gameState.projectScope || 0) <= amount;
        }

        if (condition.includes('scope_gt_')) {
            const amount = this.parseAmount(condition.replace('scope_gt_', ''));
            return (gameState.projectScope || 0) > amount;
        }

        if (condition.includes('dice_roll_')) {
            const rollValue = parseInt(condition.replace('dice_roll_', ''));
            return gameState.lastDiceRoll === rollValue;
        }

        this.log(`Unknown condition: ${condition}`);
        return false;
    }

    /**
     * Initialize condition handlers
     */
    initializeConditionHandlers() {
        this.conditionHandlers.set('always', () => true);
        
        this.conditionHandlers.set('scope_le_4M', (gameState) => 
            (gameState.projectScope || 0) <= 4000000
        );
        
        this.conditionHandlers.set('scope_gt_4M', (gameState) => 
            (gameState.projectScope || 0) > 4000000
        );

        // Add dice roll conditions
        for (let i = 1; i <= 6; i++) {
            this.conditionHandlers.set(`dice_roll_${i}`, (gameState) => 
                gameState.lastDiceRoll === i
            );
        }

        // Add loan amount conditions
        this.conditionHandlers.set('loan_up_to_1.4M', (gameState, player) => 
            (player.loanAmount || 0) <= 1400000
        );
        
        this.conditionHandlers.set('loan_1.5M_to_2.75M', (gameState, player) => {
            const loan = player.loanAmount || 0;
            return loan >= 1500000 && loan <= 2750000;
        });
        
        this.conditionHandlers.set('loan_above_2.75M', (gameState, player) => 
            (player.loanAmount || 0) > 2750000
        );
    }

    /**
     * Parse dice effect from CSV row
     */
    parseDiceEffect(effectRow, rollResult, diceRoll) {
        // Convert dice effect format to standard effect format
        const effect = {
            space_name: effectRow.space_name,
            visit_type: effectRow.visit_type,
            effect_type: effectRow.effect_type,
            effect_action: this.parseDiceAction(effectRow, rollResult),
            effect_value: this.parseDiceValue(rollResult),
            condition: 'always',
            description: `Dice roll ${diceRoll}: ${rollResult}`
        };

        return effect;
    }

    /**
     * Parse dice action from roll result
     */
    parseDiceAction(effectRow, rollResult) {
        const effectType = effectRow.effect_type;
        const cardType = effectRow.card_type;

        if (effectType === 'cards') {
            if (rollResult.toLowerCase().includes('draw')) {
                return `draw_${cardType.toLowerCase()}`;
            } else if (rollResult.toLowerCase().includes('remove')) {
                return `remove_${cardType.toLowerCase()}`;
            }
        } else if (effectType === 'money') {
            return 'fee_percent';
        } else if (effectType === 'time') {
            return 'add';
        }

        return 'unknown';
    }

    /**
     * Parse dice value from roll result
     */
    parseDiceValue(rollResult) {
        // Extract number from result (e.g., "Draw 2" -> 2, "8%" -> 8)
        const numberMatch = rollResult.match(/(\d+)/);
        return numberMatch ? numberMatch[1] : '1';
    }

    /**
     * Parse card type from action or effect
     */
    parseCardType(action, effect) {
        // Try to extract from action (e.g., 'draw_w')
        if (action.includes('_')) {
            return action.split('_')[1].toUpperCase(); // Return UPPERCASE
        }

        // Fallback to inferring from description or space
        if (effect.description) {
            const desc = effect.description.toLowerCase();
            if (desc.includes(' w ')) return 'W';
            if (desc.includes(' b ')) return 'B';
            if (desc.includes(' i ')) return 'I';
            if (desc.includes(' l ')) return 'L';
            if (desc.includes(' e ')) return 'E';
        }

        return 'W'; // Default fallback
    }

    /**
     * Parse amount from string (e.g., "4M" -> 4000000)
     */
    parseAmount(amountStr) {
        const cleanStr = amountStr.replace(/[^0-9.KMB]/gi, '');
        let amount = parseFloat(cleanStr);

        if (amountStr.toUpperCase().includes('K')) {
            amount *= 1000;
        } else if (amountStr.toUpperCase().includes('M')) {
            amount *= 1000000;
        } else if (amountStr.toUpperCase().includes('B')) {
            amount *= 1000000000;
        }

        return amount;
    }

    /**
     * Parse per-amount condition (e.g., "per_200k" -> 200000)
     */
    parsePerAmountCondition(condition) {
        if (condition.includes('per_')) {
            const amountPart = condition.split('per_')[1];
            return this.parseAmount(amountPart);
        }
        return 1;
    }

    /**
     * Get player amount based on condition context
     */
    getPlayerAmount(player, condition) {
        if (condition.includes('borrowed') || condition.includes('loan')) {
            return player.loanAmount || 0;
        }
        if (condition.includes('investment')) {
            return player.investmentAmount || 0;
        }
        return player.money || 0;
    }

    /**
     * Utility methods
     */
    log(message) {
        if (this.debug) {
        }
    }

    enableDebug() {
        this.debug = true;
        this.log('Debug logging enabled');
    }

    disableDebug() {
        this.debug = false;
    }

    /**
     * Get effects summary for debugging
     */
    getEffectsSummary(spaceName, visitType = 'First') {
        if (!this.database || !this.database.loaded) {
            return 'Database not loaded';
        }

        const spaceEffects = this.database.spaceEffects.find(spaceName, visitType);
        const diceEffects = this.database.diceEffects.find(spaceName, visitType);

        return {
            space: spaceName,
            visitType: visitType,
            spaceEffectsCount: spaceEffects?.length || 0,
            diceEffectsCount: diceEffects?.length || 0,
            spaceEffects: spaceEffects || [],
            diceEffects: diceEffects || []
        };
    }

    /**
     * Validate effects data integrity
     */
    validateEffectsData() {
        if (!this.database || !this.database.loaded) {
            throw new Error('Database not loaded');
        }

        const issues = [];
        const spaceEffects = this.database.data.spaceEffects;
        const diceEffects = this.database.data.diceEffects;

        // Validate space effects
        spaceEffects.forEach(effect => {
            if (!effect.effect_type || !['time', 'cards', 'money'].includes(effect.effect_type)) {
                issues.push(`Invalid effect_type in space effects: ${effect.effect_type}`);
            }
            if (!effect.effect_action) {
                issues.push(`Missing effect_action in space effects for ${effect.space_name}`);
            }
        });

        // Validate dice effects
        diceEffects.forEach(effect => {
            if (!effect.effect_type || !['time', 'cards', 'money'].includes(effect.effect_type)) {
                issues.push(`Invalid effect_type in dice effects: ${effect.effect_type}`);
            }
        });

        if (issues.length > 0) {
            console.warn('Effects data validation issues:', issues);
            return { valid: false, issues };
        }

        this.log('Effects data validation passed');
        return { valid: true, issues: [] };
    }
}

// Create singleton instance
const EffectsEngineInstance = new EffectsEngine();

// Export for browser usage
if (typeof window !== 'undefined') {
    window.EffectsEngine = EffectsEngineInstance;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EffectsEngineInstance;
}