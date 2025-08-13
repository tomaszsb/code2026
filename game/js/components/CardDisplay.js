// CardDisplay.js - Visual card display component using unified Card system
class CardDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedCard: null
        };
    }

    handleCardClick(card) {
        this.setState({ selectedCard: card });
        if (this.props.onCardSelect) {
            this.props.onCardSelect(card);
        }
    }

    render() {
        const { cards, layout = 'grid', maxCards = null, onCardSelect } = this.props;
        const { selectedCard } = this.state;

        if (!cards || cards.length === 0) {
            return React.createElement('div', {
                className: 'no-cards-message'
            }, 'No cards available');
        }

        const displayCards = maxCards ? cards.slice(0, maxCards) : cards;

        return React.createElement('div', {
            className: `card-display card-display--${layout}`
        }, [
            // Unified CardGrid using large size for detailed display
            React.createElement(window.CardGrid, {
                key: 'cards',
                cards: displayCards,
                onCardClick: (card) => this.handleCardClick(card),
                cardSize: 'large',
                className: 'cards-container',
                emptyMessage: 'No cards available'
            }),
            
            // Selected card detail panel (enhanced with comprehensive effects)
            selectedCard && React.createElement('div', {
                key: 'detail',
                className: 'card-detail-panel'
            }, this.renderCardDetails(selectedCard))
        ]);
    }

    renderCardDetails(card) {
        const config = window.CardUtils.getCardTypeConfig(card.card_type);
        const effectDescription = window.CardUtils.getCardEffectDescription(card);
        
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
            }, [
                React.createElement('h4', {
                    key: 'effects-title',
                    className: 'heading-4'
                }, 'Card Effects'),
                React.createElement('div', {
                    key: 'effects-content',
                    className: 'text-body'
                }, effectDescription)
            ])
        ]);
    }
}

// Register component globally
window.CardDisplay = CardDisplay;