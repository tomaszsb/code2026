/**
 * CardsInHand - Cards display and interaction component
 * Shows card grid, handles selection, and manages hand display
 */

function CardsInHand({ player, onCardSelect, cardsExpanded, onToggleExpanded }) {
    const { useMemo, useState, useEffect } = React;
    const [showCardsModal, setShowCardsModal] = useState(false);
    
    // Handle escape key to close modal
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && showCardsModal) {
                setShowCardsModal(false);
            }
        };
        
        if (showCardsModal) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [showCardsModal]);
    
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
            backgroundColor: '#fff',
            border: '2px solid #17a2b8',
            borderLeft: '6px solid #17a2b8',
            borderRadius: '8px',
            padding: '16px',
            margin: '8px 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
    }, [
        React.createElement('div', {
            key: 'cards-header',
            className: 'cards-header',
            style: { marginTop: '0' }
        }, [
            React.createElement('h4', {
                key: 'cards-title',
                className: 'section-title',
                style: {
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#17a2b8',
                    margin: '0'
                }
            }, '🃏 Cards in Hand'),
            
            React.createElement('button', {
                key: 'view-cards',
                className: 'btn btn--primary btn--sm',
                onClick: () => setShowCardsModal(true),
                'aria-label': 'View all cards',
                style: {
                    fontSize: '12px',
                    padding: '6px 12px',
                    marginLeft: '8px'
                }
            }, 'View All'),
            
            React.createElement('span', {
                key: 'card-count',
                className: 'card-count',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#17a2b8',
                    backgroundColor: '#e9f7fa',
                    padding: '4px 8px',
                    borderRadius: '12px'
                }
            }, `${cardCount}/7`)
        ]),
        
        // Simple card summary
        React.createElement('div', {
            key: 'cards-summary',
            style: {
                padding: '12px 0',
                fontSize: '14px',
                color: '#6c757d'
            }
        }, allCards.length > 0 ? [
            React.createElement('div', {
                key: 'card-types-summary',
                style: { marginBottom: '8px' }
            }, Object.entries(
                allCards.reduce((acc, card) => {
                    acc[card.card_type] = (acc[card.card_type] || 0) + 1;
                    return acc;
                }, {})
            ).map(([type, count]) => `${type}: ${count}`).join(', ')),
            
            // Quick E card actions if any
            allCards.filter(card => card.card_type === 'E' && canUseECard(card)).length > 0 ?
                React.createElement('div', {
                    key: 'quick-e-actions',
                    style: { 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap',
                        marginTop: '8px'
                    }
                }, allCards.filter(card => card.card_type === 'E' && canUseECard(card)).map((card, index) =>
                    React.createElement('button', {
                        key: `quick-use-${index}`,
                        className: 'btn btn--success btn--sm',
                        onClick: () => handleUseCard(card),
                        style: { 
                            fontSize: '11px', 
                            padding: '4px 8px'
                        }
                    }, `Use ${card.card_name?.substring(0, 10) || 'E Card'}`)
                )) : null
        ] : 'Click "View All" to see your cards'),

        // Cards Modal
        showCardsModal && React.createElement('div', {
            key: 'cards-modal-overlay',
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000
            },
            onClick: (e) => {
                if (e.target === e.currentTarget) {
                    setShowCardsModal(false);
                }
            }
        }, React.createElement('div', {
            style: {
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative'
            }
        }, [
            // Modal Header
            React.createElement('div', {
                key: 'modal-header',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    borderBottom: '2px solid #e9ecef',
                    paddingBottom: '16px'
                }
            }, [
                React.createElement('h2', {
                    key: 'modal-title',
                    style: {
                        margin: 0,
                        color: '#17a2b8',
                        fontSize: '24px'
                    }
                }, `🃏 ${player?.name || 'Player'}'s Cards (${cardCount}/7)`),
                React.createElement('button', {
                    key: 'close-button',
                    className: 'btn btn--outline',
                    onClick: () => setShowCardsModal(false),
                    style: {
                        fontSize: '18px',
                        padding: '8px 16px'
                    }
                }, '✕ Close')
            ]),

            // Modal Content - Cards Grid
            React.createElement('div', {
                key: 'modal-cards-grid',
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                }
            }, allCards.map((card, index) => {
                const cardColors = getCardTypeColor(card.card_type);
                return React.createElement('div', {
                    key: `modal-card-${card.card_id}-${index}`,
                    style: {
                        backgroundColor: cardColors.bg,
                        border: `3px solid ${cardColors.text}`,
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        minHeight: '120px'
                    },
                    onClick: () => onCardSelect(card)
                }, [
                    React.createElement('div', {
                        key: 'card-header',
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'card-type',
                            style: {
                                color: cardColors.text,
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }
                        }, `${card.card_type} Card`),
                        React.createElement('div', {
                            key: 'card-badge',
                            style: {
                                backgroundColor: cardColors.text,
                                color: cardColors.bg,
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }
                        }, card.card_type)
                    ]),
                    React.createElement('div', {
                        key: 'card-name',
                        style: {
                            color: cardColors.text,
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            lineHeight: '1.4'
                        }
                    }, card.card_name || 'Unknown Card'),
                    card.description && React.createElement('div', {
                        key: 'card-description',
                        style: {
                            color: cardColors.text,
                            fontSize: '14px',
                            lineHeight: '1.4',
                            opacity: 0.8
                        }
                    }, card.description),
                    
                    // E Card actions in modal
                    card.card_type === 'E' ? React.createElement('div', {
                        key: 'card-actions',
                        style: {
                            marginTop: '12px',
                            display: 'flex',
                            gap: '8px'
                        }
                    }, [
                        React.createElement('button', {
                            key: 'use-in-modal',
                            className: `btn ${canUseECard(card) ? 'btn--success' : 'btn--disabled'} btn--sm`,
                            onClick: (e) => {
                                e.stopPropagation();
                                handleUseCard(card);
                            },
                            disabled: !canUseECard(card),
                            title: !canUseECard(card) ? `Can only be used in ${card.phase_restriction} phase` : 'Use this card'
                        }, 'Use'),
                        React.createElement('button', {
                            key: 'details-in-modal',
                            className: 'btn btn--outline btn--sm',
                            onClick: (e) => {
                                e.stopPropagation();
                                onCardSelect(card);
                            }
                        }, 'Details')
                    ]) : null
                ]);
            }))
        ]))
    ]);
}

window.CardsInHand = CardsInHand;