/**
 * PlayerStatusPanel - Enhanced player status display
 * Shows current player info, space details, and cards in hand
 */

function PlayerStatusPanel() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [panelState, setPanelState] = useState({
        showCardDetails: false,
        selectedCard: null,
        cardsExpanded: true
    });

    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Get current space information
    const getCurrentSpaceInfo = () => {
        if (!currentPlayer) return null;
        
        const spaceData = window.CSVDatabase.spaces.find(
            currentPlayer.position, 
            currentPlayer.visitType || 'First'
        );
        
        return spaceData;
    };

    const currentSpace = getCurrentSpaceInfo();

    const handleCardSelect = (card) => {
        setPanelState(prev => ({
            ...prev,
            selectedCard: card,
            showCardDetails: true
        }));
    };

    const closeCardDetails = () => {
        setPanelState(prev => ({
            ...prev,
            selectedCard: null,
            showCardDetails: false
        }));
    };

    const toggleCardsExpanded = () => {
        setPanelState(prev => ({
            ...prev,
            cardsExpanded: !prev.cardsExpanded
        }));
    };

    if (!currentPlayer) {
        return React.createElement('div', {
            className: 'player-status-panel'
        }, [
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'No active player')
        ]);
    }

    return React.createElement('div', {
        className: 'player-status-panel'
    }, [
        // Player Header
        React.createElement('div', {
            key: 'player-header',
            className: 'player-header'
        }, [
            React.createElement('div', {
                key: 'player-avatar',
                className: 'player-avatar',
                style: { backgroundColor: currentPlayer.color }
            }, currentPlayer.name.charAt(0).toUpperCase()),
            
            React.createElement('div', {
                key: 'player-info',
                className: 'player-info'
            }, [
                React.createElement('h3', {
                    key: 'name',
                    style: { color: currentPlayer.color }
                }, currentPlayer.name),
                React.createElement('p', {
                    key: 'turn-info',
                    className: 'turn-info'
                }, `Turn ${gameState.currentPlayer + 1} of ${gameState.players.length}`)
            ])
        ]),

        // Current Space Info
        React.createElement('div', {
            key: 'space-info',
            className: 'current-space-info'
        }, [
            React.createElement('h4', {
                key: 'space-title',
                className: 'section-title'
            }, '📍 Current Space'),
            
            React.createElement('div', {
                key: 'space-card',
                className: 'space-card'
            }, [
                React.createElement('h5', {
                    key: 'space-name',
                    className: 'space-name'
                }, currentPlayer.position || 'Unknown'),
                
                currentSpace && React.createElement('div', {
                    key: 'space-details',
                    className: 'space-details'
                }, [
                    React.createElement('p', {
                        key: 'phase',
                        className: 'space-phase'
                    }, [
                        React.createElement('strong', {key: 'label'}, 'Phase: '),
                        currentSpace.phase || 'N/A'
                    ]),
                    
                    currentSpace.Event && React.createElement('p', {
                        key: 'event',
                        className: 'space-event'
                    }, [
                        React.createElement('strong', {key: 'label'}, 'Event: '),
                        currentSpace.Event
                    ]),
                    
                    currentSpace.Action && React.createElement('p', {
                        key: 'action',
                        className: 'space-action'
                    }, [
                        React.createElement('strong', {key: 'label'}, 'Action: '),
                        currentSpace.Action
                    ])
                ])
            ])
        ]),

        // Player Resources
        React.createElement('div', {
            key: 'resources',
            className: 'player-resources'
        }, [
            React.createElement('h4', {
                key: 'resources-title',
                className: 'section-title'
            }, '💰 Resources'),
            
            React.createElement('div', {
                key: 'resource-grid',
                className: 'resource-grid'
            }, [
                React.createElement('div', {
                    key: 'money',
                    className: 'resource-item'
                }, [
                    React.createElement('span', {
                        key: 'money-label',
                        className: 'resource-label'
                    }, 'Money:'),
                    React.createElement('span', {
                        key: 'money-value',
                        className: 'resource-value'
                    }, `$${(currentPlayer.money || 0).toLocaleString()}`)
                ]),
                
                React.createElement('div', {
                    key: 'time',
                    className: 'resource-item'
                }, [
                    React.createElement('span', {
                        key: 'time-label',
                        className: 'resource-label'
                    }, 'Time:'),
                    React.createElement('span', {
                        key: 'time-value',
                        className: 'resource-value'
                    }, `${currentPlayer.time || 0} units`)
                ]),
                
                React.createElement('div', {
                    key: 'scope',
                    className: 'resource-item'
                }, [
                    React.createElement('span', {
                        key: 'scope-label',
                        className: 'resource-label'
                    }, 'Scope:'),
                    React.createElement('span', {
                        key: 'scope-value',
                        className: 'resource-value'
                    }, `${currentPlayer.scope || 0}%`)
                ])
            ])
        ]),

        // Cards in Hand
        React.createElement('div', {
            key: 'cards-section',
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
                    onClick: toggleCardsExpanded,
                    'aria-label': 'Toggle cards display'
                }, panelState.cardsExpanded ? '▼' : '▶'),
                
                React.createElement('span', {
                    key: 'card-count',
                    className: 'card-count'
                }, `${(currentPlayer.cards || []).length}/7`)
            ]),
            
            panelState.cardsExpanded && React.createElement('div', {
                key: 'cards-container',
                className: 'cards-container'
            }, 
                (currentPlayer.cards || []).length > 0 ? 
                    (currentPlayer.cards || []).map((card, index) => 
                        React.createElement('div', {
                            key: `card-${index}`,
                            className: 'card-mini',
                            onClick: () => handleCardSelect(card),
                            title: card.card_name || `${card.card_type} Card`
                        }, [
                            React.createElement('div', {
                                key: 'card-type',
                                className: `card-type-indicator ${card.card_type}`
                            }, card.card_type),
                            React.createElement('div', {
                                key: 'card-name',
                                className: 'card-name-mini'
                            }, (card.card_name || 'Unknown').substring(0, 10) + '...')
                        ])
                    ) :
                    React.createElement('p', {
                        key: 'no-cards',
                        className: 'no-cards-message'
                    }, 'No cards in hand')
            )
        ]),

        // Card Details Modal
        panelState.showCardDetails && React.createElement('div', {
            key: 'card-modal',
            className: 'card-modal-overlay',
            onClick: closeCardDetails
        }, [
            React.createElement('div', {
                key: 'card-modal-content',
                className: 'card-modal-content',
                onClick: (e) => e.stopPropagation()
            }, [
                React.createElement('button', {
                    key: 'close-button',
                    className: 'close-button',
                    onClick: closeCardDetails
                }, '×'),
                
                panelState.selectedCard && (window.CardDisplay ? 
                    React.createElement(CardDisplay, {
                        key: 'card-display',
                        card: panelState.selectedCard,
                        showDetails: true
                    }) : React.createElement('div', {
                        key: 'card-details',
                        className: 'card-details-fallback'
                    }, [
                        React.createElement('h4', {key: 'name'}, panelState.selectedCard.card_name || 'Card Details'),
                        React.createElement('p', {key: 'type'}, `Type: ${panelState.selectedCard.card_type}`),
                        React.createElement('p', {key: 'desc'}, panelState.selectedCard.immediate_effect || 'No description available')
                    ])
                )
            ])
        ])
    ]);
}

window.PlayerStatusPanel = PlayerStatusPanel;