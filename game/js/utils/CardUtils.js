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

    // Standardized card value formatting
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
        if (card.time_effect) {
            const timeValue = parseInt(card.time_effect);
            return timeValue !== 0 ? `${Math.abs(timeValue)} days` : null;
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

    // Get card effect description
    getCardEffectDescription(card) {
        const effects = [];
        
        if (card.money_effect) {
            const effect = parseInt(card.money_effect);
            effects.push(effect > 0 ? `+$${effect.toLocaleString()}` : `-$${Math.abs(effect).toLocaleString()}`);
        }
        
        if (card.time_effect) {
            const effect = parseInt(card.time_effect);
            effects.push(effect > 0 ? `+${effect} days` : `-${Math.abs(effect)} days`);
        }
        
        if (card.loan_amount) {
            effects.push(`Loan: $${parseInt(card.loan_amount).toLocaleString()}`);
        }
        
        if (card.investment_amount) {
            effects.push(`Investment: $${parseInt(card.investment_amount).toLocaleString()}`);
        }
        
        return effects.join(', ') || 'No direct effects';
    },

    // Check if card has monetary effects
    hasMonetaryEffect(card) {
        return !!(card.money_effect || card.money_cost || card.loan_amount || card.investment_amount);
    },

    // Check if card has time effects
    hasTimeEffect(card) {
        return !!(card.time_effect);
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