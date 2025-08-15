/**
 * CardsInHand - Cards display and interaction component
 * Shows card grid, handles selection, and manages hand display
 */

function CardsInHand({ player, onCardSelect, cardsExpanded, onToggleExpanded }) {
    const { useMemo, useState, useEffect } = React;
    const [showCardsModal, setShowCardsModal] = useState(false);
    const [updateCounter, setUpdateCounter] = useState(0);
    
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
    
    // CARDS DISPLAY FIX: Enhanced memoization with defensive filtering
    const allCards = useMemo(() => {
        if (!player?.cards || typeof player.cards !== 'object') {
            return [];
        }
        
        const cards = [];
        Object.keys(player.cards).forEach(cardType => {
            if (Array.isArray(player.cards[cardType])) {
                // DEFENSIVE FILTER: Only add valid card objects
                const validCards = player.cards[cardType].filter(card => {
                    // Check if card is valid
                    const isValid = card && 
                                   typeof card === 'object' && 
                                   card.card_id && 
                                   card.card_type;
                    
                    if (!isValid) {
                    }
                    
                    return isValid;
                });
                
                cards.push(...validCards);
            }
        });
        
        return cards;
    }, [player?.cards, updateCounter]);
    
    const cardCount = useMemo(() => allCards.length, [allCards]);
    
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
        
        
        // Use GameStateManager's unified card usage system
        // This handles all effects through EffectsEngine and deck management
        // Could also use: window.GameStateManager.playCardFromHand(player.id, card.card_id)
        const result = window.GameStateManager.usePlayerCard(player.id, card.card_id);
        
        // Show feedback message
        window.GameStateManager.emit('showMessage', {
            type: 'success',
            message: `Used ${card.card_name || 'E Card'}`,
            description: result || 'Card effect applied'
        });
        
        setUpdateCounter(c => c + 1);
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
        
        // Unified card display using Card components
        React.createElement('div', {
            key: 'cards-display',
            style: {
                padding: '12px 0'
            }
        }, allCards.length > 0 ? 
            React.createElement(window.CardGrid, {
                cards: allCards.slice(0, 6), // Show first 6 cards in summary
                onCardClick: onCardSelect,
                cardSize: 'small',
                showActions: true,
                getActionButtons: (card) => {
                    const buttons = [];
                    
                    // Add "Use" button for E cards that can be used
                    if (card.card_type === 'E' && canUseECard(card)) {
                        buttons.push({
                            text: 'Use',
                            className: 'btn btn--success btn--sm',
                            onClick: (e) => {
                                e.stopPropagation();
                                handleUseCard(card);
                                onCardSelect(card); // Also open modal to see effect details
                            }
                        });
                    }
                    
                    return buttons;
                },
                style: {
                    maxHeight: '200px',
                    overflowY: 'auto'
                },
                emptyMessage: 'No cards in hand'
            }) :
            React.createElement('div', {
                style: {
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6c757d',
                    fontStyle: 'italic'
                }
            }, 'Click "View All" to see your cards')
        ),

        // Show "and X more..." if there are more than 6 cards
        allCards.length > 6 && React.createElement('div', {
            key: 'more-cards-indicator',
            style: {
                textAlign: 'center',
                padding: '8px',
                fontSize: '12px',
                color: '#6c757d',
                fontStyle: 'italic'
            }
        }, `... and ${allCards.length - 6} more card${allCards.length - 6 !== 1 ? 's' : ''}`),

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

            // Modal Content - Unified Cards Grid
            React.createElement(window.CardGrid, {
                key: 'modal-cards-grid',
                cards: allCards,
                onCardClick: onCardSelect,
                cardSize: 'large',
                showActions: true,
                getActionButtons: (card) => {
                    const buttons = [];
                    
                    // Add "Use" button for E cards
                    if (card.card_type === 'E') {
                        buttons.push({
                            text: 'Use',
                            className: `btn ${canUseECard(card) ? 'btn--success' : 'btn--disabled'} btn--sm`,
                            onClick: (e) => {
                                e.stopPropagation();
                                handleUseCard(card);
                                onCardSelect(card); // Also trigger modal update to show effects
                            },
                            disabled: !canUseECard(card),
                            title: !canUseECard(card) ? `Can only be used in ${card.phase_restriction} phase` : 'Use this card'
                        });
                    }
                    
                    // Add "Details" button for all cards
                    buttons.push({
                        text: 'Details',
                        className: 'btn btn--outline btn--sm',
                        onClick: (e) => {
                            e.stopPropagation();
                            onCardSelect(card);
                        }
                    });
                    
                    return buttons;
                },
                style: {
                    marginBottom: '24px',
                    maxHeight: '60vh',
                    overflowY: 'auto'
                },
                emptyMessage: 'No cards in hand'
            })
        ]))
    ]);
}

// OPTIMIZED MEMOIZATION - Custom comparison to prevent unnecessary re-renders
const CardsInHandMemo = React.memo(CardsInHand, (prevProps, nextProps) => {
    // Only re-render if player cards actually changed
    const prevCards = prevProps.player?.cards;
    const nextCards = nextProps.player?.cards;
    
    // Quick identity check
    if (prevCards === nextCards) return true;
    
    // If either is null/undefined, check if both are
    if (!prevCards || !nextCards) return prevCards === nextCards;
    
    // Compare card counts and actual card IDs for each type
    const cardTypes = ['W', 'B', 'I', 'L', 'E'];
    for (const type of cardTypes) {
        const prevCount = prevCards[type]?.length || 0;
        const nextCount = nextCards[type]?.length || 0;
        if (prevCount !== nextCount) return false;
        
        // Compare actual card IDs to detect card changes
        const prevCardIds = (prevCards[type] || []).map(card => card.card_id).sort();
        const nextCardIds = (nextCards[type] || []).map(card => card.card_id).sort();
        if (prevCardIds.length !== nextCardIds.length) return false;
        for (let i = 0; i < prevCardIds.length; i++) {
            if (prevCardIds[i] !== nextCardIds[i]) return false;
        }
    }
    
    // Check other props
    return (
        prevProps.player?.id === nextProps.player?.id &&
        prevProps.cardsExpanded === nextProps.cardsExpanded &&
        prevProps.onCardSelect === nextProps.onCardSelect &&
        prevProps.onToggleExpanded === nextProps.onToggleExpanded
    );
});

window.CardsInHand = CardsInHandMemo;