// CardDisplay.js - Visual card display component
class CardDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedCard: null,
            hoverCard: null
        };
    }

    getCardTypeConfig(cardType) {
        const configs = {
            'W': {
                name: 'Work',
                color: 'var(--primary-blue)',
                bgColor: '#e3f2fd',
                borderColor: 'var(--primary-blue)',
                icon: '🔧'
            },
            'B': {
                name: 'Bank',
                color: 'var(--secondary-green)',
                bgColor: '#e8f5e8',
                borderColor: 'var(--secondary-green)',
                icon: '💼'
            },
            'I': {
                name: 'Inspection',
                color: 'var(--accent-orange)',
                bgColor: '#fff3e0',
                borderColor: 'var(--accent-orange)',
                icon: '🔍'
            },
            'L': {
                name: 'Life',
                color: 'var(--error-red)',
                bgColor: '#ffebee',
                borderColor: 'var(--error-red)',
                icon: '⚖️'
            },
            'E': {
                name: 'Expeditor',
                color: 'var(--warning-amber)',
                bgColor: '#fff8e1',
                borderColor: 'var(--warning-amber)',
                icon: '⚠️'
            }
        };
        return configs[cardType] || configs['W'];
    }

    formatCardValue(card) {
        if (card.loan_amount) {
            return `$${parseInt(card.loan_amount).toLocaleString()}`;
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
    }

    renderCard(card, isSelected = false, isHovered = false) {
        const config = this.getCardTypeConfig(card.card_type);
        const value = this.formatCardValue(card);
        
        return React.createElement('div', {
            key: card.card_id,
            className: `game-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`,
            style: {
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
                color: config.color
            },
            onClick: () => this.handleCardClick(card),
            onMouseEnter: () => this.setState({ hoverCard: card }),
            onMouseLeave: () => this.setState({ hoverCard: null })
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'card-header'
            }, [
                React.createElement('div', {
                    key: 'type-badge',
                    className: 'card-type-badge'
                }, [
                    React.createElement('span', { key: 'icon', className: 'card-icon' }, config.icon),
                    React.createElement('span', { key: 'type', className: 'card-type' }, config.name)
                ]),
                value && React.createElement('div', {
                    key: 'value',
                    className: 'card-value'
                }, value)
            ]),
            React.createElement('div', {
                key: 'body',
                className: 'card-body'
            }, [
                React.createElement('div', {
                    key: 'name',
                    className: 'card-name'
                }, card.card_name),
                React.createElement('div', {
                    key: 'description',
                    className: 'card-description'
                }, card.description)
            ]),
            card.flavor_text && React.createElement('div', {
                key: 'flavor',
                className: 'card-flavor'
            }, card.flavor_text)
        ]);
    }

    handleCardClick(card) {
        this.setState({ selectedCard: card });
        if (this.props.onCardSelect) {
            this.props.onCardSelect(card);
        }
    }

    render() {
        const { cards, layout = 'grid', maxCards = null } = this.props;
        const { selectedCard, hoverCard } = this.state;

        if (!cards || cards.length === 0) {
            return React.createElement('div', {
                className: 'no-cards-message'
            }, 'No cards available');
        }

        const displayCards = maxCards ? cards.slice(0, maxCards) : cards;

        return React.createElement('div', {
            className: `card-display card-display--${layout}`
        }, [
            React.createElement('div', {
                key: 'cards',
                className: 'cards-container'
            }, displayCards.map(card => this.renderCard(
                card,
                selectedCard && selectedCard.card_id === card.card_id,
                hoverCard && hoverCard.card_id === card.card_id
            ))),
            
            (selectedCard || hoverCard) && React.createElement('div', {
                key: 'detail',
                className: 'card-detail-panel'
            }, this.renderCardDetails(selectedCard || hoverCard))
        ]);
    }

    renderCardDetails(card) {
        const config = this.getCardTypeConfig(card.card_type);
        
        return React.createElement('div', {
            className: 'card-detail-content'
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'detail-header'
            }, [
                React.createElement('h3', {
                    key: 'name',
                    className: 'heading-3'
                }, card.card_name),
                React.createElement('div', {
                    key: 'type',
                    className: 'badge',
                    style: {
                        backgroundColor: config.bgColor,
                        color: config.color
                    }
                }, `${config.icon} ${config.name}`)
            ]),
            
            React.createElement('div', {
                key: 'description',
                className: 'detail-description text-body'
            }, card.description),
            
            card.flavor_text && React.createElement('div', {
                key: 'flavor',
                className: 'detail-flavor text-small'
            }, card.flavor_text),
            
            React.createElement('div', {
                key: 'effects',
                className: 'detail-effects'
            }, this.renderCardEffects(card))
        ]);
    }

    renderCardEffects(card) {
        const effects = [];
        
        // Bank cards - loan information
        if (card.loan_amount) {
            effects.push({
                label: 'Loan Amount',
                value: `$${parseInt(card.loan_amount).toLocaleString()}`,
                type: 'money'
            });
        }
        
        if (card.loan_rate) {
            effects.push({
                label: 'Interest Rate',
                value: `${card.loan_rate}%`,
                type: 'percentage'
            });
        }
        
        // General money effects
        if (card.money_effect) {
            const amount = parseInt(card.money_effect);
            effects.push({
                label: amount > 0 ? 'Money Gain' : 'Money Cost',
                value: `$${Math.abs(amount).toLocaleString()}`,
                type: 'money'
            });
        }
        
        // Expeditor cards - money cost
        if (card.money_cost) {
            const cost = parseInt(card.money_cost);
            if (cost !== 0) {
                effects.push({
                    label: cost > 0 ? 'Money Gain' : 'Money Cost',
                    value: `$${Math.abs(cost).toLocaleString()}`,
                    type: 'money'
                });
            }
        }
        
        // Time effects (for expeditor cards)
        if (card.time_effect) {
            const timeValue = parseInt(card.time_effect);
            if (timeValue !== 0) {
                effects.push({
                    label: timeValue > 0 ? 'Time Added' : 'Time Reduced',
                    value: `${Math.abs(timeValue)} days`,
                    type: 'time'
                });
            }
        }
        
        // Immediate effects (for expeditor cards)
        if (card.immediate_effect && card.immediate_effect !== 'Apply Card') {
            effects.push({
                label: 'Effect',
                value: card.immediate_effect,
                type: 'effect'
            });
        }
        
        // Turn effects (special conditions)
        if (card.turn_effect) {
            effects.push({
                label: 'Special Effect',
                value: card.turn_effect,
                type: 'effect'
            });
        }
        
        // Work cost (for work cards)
        if (card.work_cost) {
            const workCost = parseInt(card.work_cost);
            if (workCost > 0) {
                effects.push({
                    label: 'Work Cost',
                    value: `$${workCost.toLocaleString()}`,
                    type: 'money'
                });
            }
        }
        
        if (card.draw_cards) {
            effects.push({
                label: 'Draw Cards',
                value: card.draw_cards,
                type: 'cards'
            });
        }

        if (effects.length === 0) {
            return React.createElement('div', {
                className: 'text-small'
            }, 'No special effects');
        }

        return React.createElement('div', {
            className: 'effects-list'
        }, effects.map((effect, index) => 
            React.createElement('div', {
                key: index,
                className: 'effect-item'
            }, [
                React.createElement('span', {
                    key: 'label',
                    className: 'effect-label'
                }, effect.label + ':'),
                React.createElement('span', {
                    key: 'value',
                    className: `effect-value effect-value--${effect.type}`
                }, effect.value)
            ])
        ));
    }
}

// Register component globally
window.CardDisplay = CardDisplay;