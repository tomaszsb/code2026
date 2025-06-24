/**
 * CardsInHand - Cards display and interaction component
 * Shows card grid, handles selection, and manages hand display
 */

function CardsInHand({ player, onCardSelect, cardsExpanded, onToggleExpanded }) {
    // Helper functions to handle cards object structure
    const getAllCards = (cardsObj) => {
        console.log('CardsInHand: getAllCards called with:', cardsObj);
        
        if (!cardsObj || typeof cardsObj !== 'object') {
            console.log('CardsInHand: No cards object or not an object, returning empty array');
            return [];
        }
        
        const allCards = [];
        Object.keys(cardsObj).forEach(cardType => {
            console.log(`CardsInHand: Processing card type ${cardType}:`, cardsObj[cardType]);
            if (Array.isArray(cardsObj[cardType])) {
                allCards.push(...cardsObj[cardType]);
            }
        });
        
        console.log('CardsInHand: All cards combined:', allCards);
        return allCards;
    };
    
    const getAllCardsCount = (cardsObj) => {
        const count = getAllCards(cardsObj).length;
        console.log(`CardsInHand: Total card count: ${count}`);
        return count;
    };
    
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
            }, `${getAllCardsCount(player.cards)}/7`)
        ]),
        
        cardsExpanded && React.createElement('div', {
            key: 'cards-container',
            className: 'cards-container'
        }, 
            getAllCards(player.cards).length > 0 ? 
                getAllCards(player.cards).map((card, index) => {
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