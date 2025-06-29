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
    
    // Check if E card can be used based on current phase
    const canUseECard = (card) => {
        if (!card || card.card_type !== 'E') return false;
        if (!card.phase_restriction || card.phase_restriction === 'Any') return true;
        
        // Get current game phase
        const currentPhase = getCurrentGamePhase();
        return currentPhase === card.phase_restriction;
    };
    
    // Get current game phase
    const getCurrentGamePhase = () => {
        if (!player || !player.position || !window.CSVDatabase || !window.CSVDatabase.loaded) {
            return null;
        }
        
        const configData = window.CSVDatabase.gameConfig.find(player.position);
        return configData?.phase || null;
    };
    
    // Handle using an E card from hand
    const handleUseCard = (card) => {
        if (!player || !card || card.card_type !== 'E') return;
        
        if (!canUseECard(card)) {
            window.GameStateManager.emit('showMessage', {
                type: 'warning',
                message: 'Card Cannot Be Used',
                description: `This card can only be used in ${card.phase_restriction} phase. Current phase: ${getCurrentGamePhase() || 'Unknown'}`
            });
            return;
        }
        
        
        // Apply card effects based on card properties
        const effects = {
            money: 0,
            time: 0,
            messages: []
        };
        
        // Process general money effects
        if (card.money_effect) {
            const moneyEffect = parseInt(card.money_effect) || 0;
            effects.money += moneyEffect;
            effects.messages.push(`Money effect: ${moneyEffect >= 0 ? '+' : ''}$${moneyEffect.toLocaleString()}`);
        }
        
        // Process time effects
        if (card.time_effect) {
            const timeEffect = parseInt(card.time_effect) || 0;
            effects.time += timeEffect;
            effects.messages.push(`Time effect: ${timeEffect >= 0 ? '+' : ''}${timeEffect} days`);
        }
        
        // Apply effects via GameStateManager
        if (effects.money !== 0) {
            window.GameStateManager.emit('moneyChanged', {
                playerId: player.id,
                amount: effects.money,
                source: `card_E_${card.card_id}`
            });
        }
        
        if (effects.time !== 0) {
            window.GameStateManager.emit('timeChanged', {
                playerId: player.id,
                amount: effects.time,
                source: `card_E_${card.card_id}`
            });
        }
        
        // Remove card from hand
        window.GameStateManager.emit('useCard', {
            playerId: player.id,
            cardType: card.card_type,
            cardId: card.card_id,
            card: card
        });
        
        // Show feedback message
        const baseMessage = effects.messages.length > 0 ? effects.messages.join(', ') : 'Card effect applied';
        window.GameStateManager.emit('showMessage', {
            type: 'success',
            message: `Used ${card.card_name || 'E Card'}`,
            description: baseMessage
        });
        
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
        className: 'cards-section space-info-container',
        style: {
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderLeft: '4px solid #17a2b8',
            borderRadius: '4px',
            padding: '12px',
            margin: '8px 0'
        }
    }, [
        React.createElement('span', {key: 'icon'}, '🃏 '),
        React.createElement('div', {
            key: 'cards-header',
            className: 'cards-header',
            style: { marginTop: '0' }
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
            className: 'cards-container enhanced-cards'
        }, 
            allCards.length > 0 ? [
                // Use enhanced CardDisplay component if available, otherwise fallback to basic
                window.CardDisplay ? 
                    React.createElement(window.CardDisplay, {
                        key: 'enhanced-cards',
                        cards: allCards,
                        layout: 'compact',
                        maxCards: 7,
                        onCardSelect: onCardSelect
                    }) :
                    // Fallback to basic card display
                    React.createElement('div', {
                        key: 'basic-cards',
                        className: 'basic-cards-fallback'
                    }, allCards.map((card, index) => {
                        const cardColors = getCardTypeColor(card.card_type);
                        return React.createElement('div', {
                            key: `card-${index}`,
                            className: 'card-mini',
                            title: card.card_name || `${card.card_type} Card`,
                            style: {
                                backgroundColor: cardColors.bg,
                                border: `2px solid ${cardColors.text}`,
                                borderRadius: '8px',
                                padding: '8px',
                                margin: '4px',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
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
                    })),
                    
                // Action buttons for E cards (separate from display)
                ...allCards.filter(card => card.card_type === 'E').map((card, index) => 
                    React.createElement('div', {
                        key: `e-card-actions-${index}`,
                        className: 'e-card-actions',
                        style: {
                            display: 'flex',
                            gap: '8px',
                            margin: '8px 4px',
                            padding: '8px',
                            backgroundColor: '#f0f8ff',
                            borderRadius: '4px',
                            border: '1px solid #d1ecf1'
                        }
                    }, [
                        React.createElement('span', {
                            key: 'card-name',
                            style: { fontSize: '12px', fontWeight: 'bold', flex: 1 }
                        }, card.card_name || 'E Card'),
                        React.createElement('button', {
                            key: 'use-button',
                            className: `btn btn--sm ${!canUseECard(card) ? 'btn--disabled' : ''}`,
                            onClick: () => handleUseCard(card),
                            disabled: !canUseECard(card),
                            title: !canUseECard(card) ? `Can only be used in ${card.phase_restriction} phase` : 'Use this card',
                            style: { fontSize: '10px', padding: '4px 8px' }
                        }, 'Use'),
                        React.createElement('button', {
                            key: 'view-button',
                            className: 'btn btn--outline btn--sm',
                            onClick: () => onCardSelect(card),
                            style: { fontSize: '10px', padding: '4px 8px' }
                        }, 'View')
                    ])
                )
            ] :
            React.createElement('p', {
                key: 'no-cards',
                className: 'no-cards-message'
            }, 'No cards in hand')
        )
    ]);
}

window.CardsInHand = CardsInHand;