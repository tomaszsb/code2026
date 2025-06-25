/**
 * CardsInHand - Cards display and interaction component
 * Shows card grid, handles selection, and manages hand display
 */

function CardsInHand({ player, onCardSelect, cardsExpanded, onToggleExpanded }) {
    const { useMemo } = React;
    
    // Memoized helper functions to prevent excessive recalculation
    const allCards = useMemo(() => {
        if (!player?.cards || typeof player.cards !== 'object') {
            return [];
        }
        
        const cards = [];
        Object.keys(player.cards).forEach(cardType => {
            if (Array.isArray(player.cards[cardType])) {
                cards.push(...player.cards[cardType]);
            }
        });
        
        return cards;
    }, [player?.cards]);
    
    const cardCount = useMemo(() => allCards.length, [allCards]);
    
    // Get icon and color for card type (consistent with rules modal)
    const getCardTypeColor = (cardType) => {
        return {
            bg: window.CardUtils.getCardBgColor(cardType),
            text: window.CardUtils.getCardColor(cardType)
        };
    };

    if (!player) {
        return React.createElement('div', {
            className: 'cards-section'
        }, [
            React.createElement('div', {
                key: 'cards-header',
                className: 'cards-header'
            }, [
                React.createElement('h4', {
                    key: 'cards-title',
                    className: 'section-title'
                }, '🃏 Cards in Hand'),
                React.createElement('span', {
                    key: 'card-count',
                    className: 'card-count'
                }, '0/7')
            ]),
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'No active player')
        ]);
    }

    return React.createElement('div', {
        className: 'cards-section'
    }, [
        React.createElement('div', {
            key: 'cards-header',
            className: 'cards-header'
        }, [
            React.createElement('h4', {
                key: 'cards-title',
                className: 'section-title'
            }, '🃏 Cards in Hand'),
            
            React.createElement('button', {
                key: 'toggle-cards',
                className: 'toggle-button',
                onClick: onToggleExpanded,
                'aria-label': 'Toggle cards display'
            }, cardsExpanded ? '▼' : '▶'),
            
            React.createElement('span', {
                key: 'card-count',
                className: 'card-count'
            }, `${cardCount}/7`)
        ]),
        
        cardsExpanded && React.createElement('div', {
            key: 'cards-container',
            className: 'cards-container'
        }, 
            allCards.length > 0 ? 
                allCards.map((card, index) => {
                    const cardColors = getCardTypeColor(card.card_type);
                    return React.createElement('div', {
                        key: `card-${index}`,
                        className: 'card-mini',
                        onClick: () => onCardSelect(card),
                        title: card.card_name || `${card.card_type} Card`,
                        style: {
                            backgroundColor: cardColors.bg,
                            border: `2px solid ${cardColors.text}`,
                            borderRadius: '8px',
                            padding: '8px',
                            margin: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'card-type',
                            className: `card-type-indicator ${card.card_type}`,
                            style: {
                                color: cardColors.text,
                                fontWeight: 'bold',
                                fontSize: '12px'
                            }
                        }, card.card_type),
                        React.createElement('div', {
                            key: 'card-name',
                            className: 'card-name-mini',
                            style: {
                                color: cardColors.text,
                                fontSize: '10px',
                                marginTop: '4px'
                            }
                        }, (card.card_name || 'Unknown').substring(0, 10) + '...')
                    ]);
                }) :
                React.createElement('p', {
                    key: 'no-cards',
                    className: 'no-cards-message'
                }, 'No cards in hand')
        )
    ]);
}

window.CardsInHand = CardsInHand;