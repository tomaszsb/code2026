/**
 * CardUtils - Shared card utilities and configurations
 * Centralizes card-related functions to eliminate duplication
 */

const CardUtils = {
    // Standardized card configuration
    getCardTypeConfig(cardType) {
        const configs = {
            'W': { 
                name: 'Work', 
                color: 'var(--primary-blue)', 
                bgColor: '#e3f2fd',
                borderColor: 'var(--primary-blue)',
                icon: '🔨' 
            },
            'B': { 
                name: 'Bank', 
                color: 'var(--secondary-green)', 
                bgColor: '#e8f5e8',
                borderColor: 'var(--secondary-green)',
                icon: '🏦' 
            },
            'I': { 
                name: 'Investor', 
                color: 'var(--tertiary-orange)', 
                bgColor: '#fff3e0',
                borderColor: 'var(--tertiary-orange)',
                icon: '💰' 
            },
            'L': { 
                name: 'Life', 
                color: 'var(--quaternary-red)', 
                bgColor: '#ffebee',
                borderColor: 'var(--quaternary-red)',
                icon: '❤️' 
            },
            'E': { 
                name: 'Expeditor', 
                color: 'var(--quinary-purple)', 
                bgColor: '#f3e5f5',
                borderColor: 'var(--quinary-purple)',
                icon: '⚡' 
            }
        };
        return configs[cardType] || { name: 'Unknown', color: '#gray', icon: '❓' };
    },

    // Standardized card value formatting - ENHANCED
    formatCardValue(card) {
        if (!card) return null;
        
        if (card.loan_amount) {
            return `$${parseInt(card.loan_amount).toLocaleString()}`;
        }
        if (card.investment_amount) {
            return `$${parseInt(card.investment_amount).toLocaleString()}`;
        }
        if (card.money_effect) {
            return `$${parseInt(card.money_effect).toLocaleString()}`;
        }
        if (card.money_cost) {
            const cost = parseInt(card.money_cost);
            return cost !== 0 ? `$${Math.abs(cost).toLocaleString()}` : null;
        }
        if (card.work_cost) {
            const cost = parseInt(card.work_cost);
            return cost !== 0 ? `$${Math.abs(cost).toLocaleString()}` : null;
        }
        if (card.time_effect) {
            const timeValue = parseInt(card.time_effect);
            return timeValue !== 0 ? `${Math.abs(timeValue)} days` : null;
        }
        if (card.tick_modifier) {
            const tickValue = parseInt(card.tick_modifier);
            return tickValue !== 0 ? `${tickValue > 0 ? '+' : ''}${tickValue} ticks` : null;
        }
        return null;
    },

    // Get card display name for UI
    getCardDisplayName(cardType) {
        return this.getCardTypeConfig(cardType).name + ' Cards';
    },

    // Get card icon for display
    getCardIcon(cardType) {
        return this.getCardTypeConfig(cardType).icon;
    },

    // Get card color for styling
    getCardColor(cardType) {
        return this.getCardTypeConfig(cardType).color;
    },

    // Get card background color
    getCardBgColor(cardType) {
        return this.getCardTypeConfig(cardType).bgColor;
    },

    // Get card border color
    getCardBorderColor(cardType) {
        return this.getCardTypeConfig(cardType).borderColor;
    },

    // Validate card type
    isValidCardType(cardType) {
        return ['W', 'B', 'I', 'L', 'E'].includes(cardType);
    },

    // Get all valid card types
    getAllCardTypes() {
        return ['W', 'B', 'I', 'L', 'E'];
    },

    // Sort cards by type
    sortCardsByType(cards) {
        const typeOrder = { 'W': 0, 'B': 1, 'I': 2, 'L': 3, 'E': 4 };
        return [...cards].sort((a, b) => {
            const aOrder = typeOrder[a.card_type] || 999;
            const bOrder = typeOrder[b.card_type] || 999;
            return aOrder - bOrder;
        });
    },

    // Group cards by type
    groupCardsByType(cards) {
        const grouped = {};
        this.getAllCardTypes().forEach(type => {
            grouped[type] = cards.filter(card => card.card_type === type);
        });
        return grouped;
    },

    // Calculate total value of cards
    calculateCardsValue(cards) {
        return cards.reduce((total, card) => {
            const value = this.formatCardValue(card);
            if (value && value.includes('$')) {
                const numericValue = parseInt(value.replace(/[$,]/g, ''));
                return total + numericValue;
            }
            return total;
        }, 0);
    },

    // Get comprehensive card effect description - ENHANCED
    getCardEffectDescription(card) {
        if (!card) return 'No effects';
        
        const effects = [];
        
        // Helper function to check if field has meaningful value
        const hasValue = (value) => {
            return value && value !== '' && value !== '0' && value.toString().toLowerCase() !== 'null';
        };

        // Helper function to format monetary values
        const formatMoney = (value) => {
            const num = parseInt(value);
            return isNaN(num) ? value : `$${num.toLocaleString()}`;
        };

        // TIME EFFECTS
        if (hasValue(card.time_effect)) {
            effects.push(`Time: ${card.time_effect}`);
        }
        
        if (hasValue(card.tick_modifier)) {
            const tickValue = parseInt(card.tick_modifier);
            const tickText = tickValue > 0 ? `+${tickValue} ticks` : `${tickValue} ticks`;
            effects.push(`Ticks: ${tickText}`);
        }

        if (hasValue(card.duration) && card.duration !== 'Permanent') {
            effects.push(`Duration: ${card.duration}`);
        }

        // MONEY EFFECTS
        if (hasValue(card.money_cost)) {
            effects.push(`Cost: ${formatMoney(card.money_cost)}`);
        }

        if (hasValue(card.money_effect)) {
            effects.push(`Money: ${card.money_effect}`);
        }

        if (hasValue(card.loan_amount)) {
            effects.push(`Loan: ${formatMoney(card.loan_amount)}`);
        }

        if (hasValue(card.investment_amount)) {
            effects.push(`Investment: ${formatMoney(card.investment_amount)}`);
        }

        if (hasValue(card.work_cost)) {
            effects.push(`Work: ${formatMoney(card.work_cost)}`);
        }

        if (hasValue(card.loan_rate)) {
            effects.push(`Rate: ${card.loan_rate}%`);
        }

        // CARD EFFECTS
        if (hasValue(card.draw_cards)) {
            const drawCount = parseInt(card.draw_cards);
            effects.push(`Draw ${drawCount} card${drawCount !== 1 ? 's' : ''}`);
        }

        if (hasValue(card.discard_cards)) {
            const discardCount = parseInt(card.discard_cards);
            effects.push(`Discard ${discardCount} card${discardCount !== 1 ? 's' : ''}`);
        }

        if (hasValue(card.card_type_filter)) {
            effects.push(`Affects: ${card.card_type_filter} cards`);
        }

        // TURN EFFECTS
        if (hasValue(card.turn_effect)) {
            effects.push(`Turn: ${card.turn_effect}`);
        }

        // CONDITIONAL LOGIC
        if (hasValue(card.conditional_logic)) {
            effects.push(`Condition: ${card.conditional_logic}`);
        }

        // DICE EFFECTS
        if (hasValue(card.dice_trigger)) {
            effects.push(`Dice: ${card.dice_trigger}`);
        }

        if (hasValue(card.dice_effect)) {
            effects.push(`Dice Effect: ${card.dice_effect}`);
        }

        // MOVEMENT & SPACE EFFECTS
        if (hasValue(card.movement_effect)) {
            effects.push(`Movement: ${card.movement_effect}`);
        }

        if (hasValue(card.space_effect)) {
            effects.push(`Space: ${card.space_effect}`);
        }

        // SPECIAL EFFECTS
        if (hasValue(card.immediate_effect)) {
            effects.push(`Effect: ${card.immediate_effect}`);
        }

        if (hasValue(card.chain_effect)) {
            effects.push(`Chain: ${card.chain_effect}`);
        }

        if (hasValue(card.nullify_effect)) {
            effects.push(`Nullify: ${card.nullify_effect}`);
        }

        if (hasValue(card.percentage_effect)) {
            effects.push(`Percentage: ${card.percentage_effect}`);
        }

        if (hasValue(card.inspection_effect)) {
            effects.push(`Inspection: ${card.inspection_effect}`);
        }

        // USAGE LIMITATIONS
        if (hasValue(card.usage_limit) && card.usage_limit !== '1') {
            effects.push(`Uses: ${card.usage_limit} max`);
        }

        if (hasValue(card.cooldown)) {
            effects.push(`Cooldown: ${card.cooldown}`);
        }

        if (hasValue(card.stacking_limit) && card.stacking_limit !== '1') {
            effects.push(`Stack: ${card.stacking_limit} max`);
        }

        return effects.length > 0 ? effects.join(' • ') : 'No direct effects';
    },

    // Check if card has monetary effects - ENHANCED
    hasMonetaryEffect(card) {
        return !!(card.money_effect || card.money_cost || card.loan_amount || card.investment_amount || card.work_cost);
    },

    // Check if card has time effects - ENHANCED
    hasTimeEffect(card) {
        return !!(card.time_effect || card.tick_modifier);
    },

    // Check if card has turn effects
    hasTurnEffect(card) {
        return !!(card.turn_effect);
    },

    // Check if card has card manipulation effects
    hasCardEffect(card) {
        return !!(card.draw_cards || card.discard_cards);
    },

    // Check if card has conditional logic
    hasConditionalLogic(card) {
        return !!(card.conditional_logic);
    },

    // Check if card has dice effects
    hasDiceEffect(card) {
        return !!(card.dice_trigger || card.dice_effect);
    },

    // Check if card has any special effects
    hasAnyEffect(card) {
        return this.hasMonetaryEffect(card) || 
               this.hasTimeEffect(card) || 
               this.hasTurnEffect(card) || 
               this.hasCardEffect(card) || 
               this.hasConditionalLogic(card) || 
               this.hasDiceEffect(card) ||
               !!(card.movement_effect || card.space_effect || card.immediate_effect || 
                  card.chain_effect || card.nullify_effect || card.percentage_effect || 
                  card.inspection_effect);
    },

    // Format card for display in UI
    formatCardForDisplay(card) {
        const config = this.getCardTypeConfig(card.card_type);
        return {
            ...card,
            displayName: config.name,
            icon: config.icon,
            color: config.color,
            bgColor: config.bgColor,
            borderColor: config.borderColor,
            formattedValue: this.formatCardValue(card),
            effectDescription: this.getCardEffectDescription(card)
        };
    }
};

// Export for use in other components
window.CardUtils = CardUtils;