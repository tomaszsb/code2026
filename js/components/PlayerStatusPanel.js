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
    
    // Debug logging for current player
    useEffect(() => {
        if (currentPlayer) {
            console.log('PlayerStatusPanel: Current player:', currentPlayer);
            console.log('PlayerStatusPanel: Current player cards:', currentPlayer.cards);
        }
    }, [currentPlayer]);
    
    // Helper functions to handle cards object structure
    const getAllCards = (cardsObj) => {
        console.log('PlayerStatusPanel: getAllCards called with:', cardsObj);
        
        if (!cardsObj || typeof cardsObj !== 'object') {
            console.log('PlayerStatusPanel: No cards object or not an object, returning empty array');
            return [];
        }
        
        const allCards = [];
        Object.keys(cardsObj).forEach(cardType => {
            console.log(`PlayerStatusPanel: Processing card type ${cardType}:`, cardsObj[cardType]);
            if (Array.isArray(cardsObj[cardType])) {
                allCards.push(...cardsObj[cardType]);
            }
        });
        
        console.log('PlayerStatusPanel: All cards combined:', allCards);
        return allCards;
    };
    
    const getAllCardsCount = (cardsObj) => {
        const count = getAllCards(cardsObj).length;
        console.log(`PlayerStatusPanel: Total card count: ${count}`);
        return count;
    };
    
    // Get icon for card type
    const getCardTypeIcon = (cardType) => {
        const icons = {
            'W': '🔧', // Work
            'B': '💼', // Business
            'I': '🔍', // Investigation
            'L': '⚖️', // Legal
            'E': '⚠️'  // Emergency
        };
        return icons[cardType] || '🃏';
    };
    
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
        console.log('PlayerStatusPanel: Card clicked:', card);
        setPanelState(prev => ({
            ...prev,
            selectedCard: card,
            showCardDetails: true
        }));
        console.log('PlayerStatusPanel: Card modal should now be visible');
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
                }, `${getAllCardsCount(currentPlayer.cards)}/7`)
            ]),
            
            panelState.cardsExpanded && React.createElement('div', {
                key: 'cards-container',
                className: 'cards-container'
            }, 
                getAllCards(currentPlayer.cards).length > 0 ? 
                    getAllCards(currentPlayer.cards).map((card, index) => 
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

        // Action Panel Section - Integrated into Player Status
        React.createElement('div', {
            key: 'action-section',
            className: 'action-section'
        }, [
            window.ActionPanel ? React.createElement(ActionPanel, {
                key: 'action-panel'
            }) : React.createElement('div', {
                key: 'action-loading',
                className: 'action-loading'
            }, 'Loading actions...')
        ]),

        // Card Details Modal
        panelState.showCardDetails && React.createElement('div', {
            key: 'card-modal',
            className: 'card-modal-overlay',
            onClick: closeCardDetails,
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
                zIndex: 9999
            }
        }, [
            React.createElement('div', {
                key: 'card-modal-content',
                className: 'card-modal-content',
                onClick: (e) => e.stopPropagation(),
                style: {
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }
            }, [
                React.createElement('button', {
                    key: 'close-button',
                    className: 'close-button',
                    onClick: closeCardDetails,
                    style: {
                        position: 'absolute',
                        top: '10px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                    }
                }, '×'),
                
                panelState.selectedCard ? (
                    React.createElement('div', {
                        key: 'game-card',
                        style: {
                            width: '400px',
                            height: '600px',
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            border: '3px solid #007bff',
                            borderRadius: '15px',
                            position: 'relative',
                            boxShadow: '0 8px 32px rgba(0,123,255,0.3)',
                            overflow: 'hidden'
                        }
                    }, [
                        // Card header with type
                        React.createElement('div', {
                            key: 'header',
                            style: {
                                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                color: 'white',
                                padding: '15px 20px',
                                textAlign: 'center',
                                borderBottom: '2px solid #0056b3'
                            }
                        }, [
                            React.createElement('div', {
                                key: 'type-badge',
                                style: {
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    letterSpacing: '2px'
                                }
                            }, `${panelState.selectedCard.card_type} CARD`),
                            React.createElement('div', {
                                key: 'id',
                                style: {
                                    fontSize: '12px',
                                    opacity: 0.8,
                                    marginTop: '5px'
                                }
                            }, panelState.selectedCard.card_id)
                        ]),
                        
                        // Card name
                        React.createElement('div', {
                            key: 'name',
                            style: {
                                padding: '20px',
                                textAlign: 'center',
                                borderBottom: '1px solid #dee2e6'
                            }
                        }, [
                            React.createElement('h3', {
                                key: 'title',
                                style: {
                                    margin: '0',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#212529',
                                    lineHeight: '1.3'
                                }
                            }, panelState.selectedCard.card_name || 'Unknown Card')
                        ]),
                        
                        // Card image placeholder
                        React.createElement('div', {
                            key: 'image',
                            style: {
                                height: '180px',
                                background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                                margin: '20px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #ced4da',
                                color: '#6c757d',
                                fontSize: '48px'
                            }
                        }, getCardTypeIcon(panelState.selectedCard.card_type)),
                        
                        // Card effects
                        React.createElement('div', {
                            key: 'effects',
                            style: {
                                padding: '20px',
                                flex: 1
                            }
                        }, [
                            React.createElement('div', {
                                key: 'immediate-effect',
                                style: {
                                    background: '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                }
                            }, [
                                React.createElement('div', {
                                    key: 'effect-label',
                                    style: {
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#495057',
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }
                                }, 'Effect'),
                                React.createElement('div', {
                                    key: 'effect-text',
                                    style: {
                                        fontSize: '14px',
                                        color: '#212529',
                                        lineHeight: '1.4'
                                    }
                                }, panelState.selectedCard.immediate_effect || 'No effect specified')
                            ]),
                            
                            // Work cost if available
                            panelState.selectedCard.work_cost && React.createElement('div', {
                                key: 'cost',
                                style: {
                                    background: '#fff3cd',
                                    border: '1px solid #ffeaa7',
                                    borderRadius: '8px',
                                    padding: '10px 15px',
                                    marginBottom: '10px'
                                }
                            }, [
                                React.createElement('span', {
                                    key: 'cost-label',
                                    style: {
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#856404'
                                    }
                                }, 'Work Cost: '),
                                React.createElement('span', {
                                    key: 'cost-value',
                                    style: {
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#856404'
                                    }
                                }, `$${parseInt(panelState.selectedCard.work_cost).toLocaleString()}`)
                            ])
                        ]),
                        
                        // Card footer
                        React.createElement('div', {
                            key: 'footer',
                            style: {
                                background: '#f8f9fa',
                                padding: '10px 20px',
                                borderTop: '1px solid #dee2e6',
                                fontSize: '11px',
                                color: '#6c757d',
                                textAlign: 'center'
                            }
                        }, [
                            React.createElement('div', {key: 'rarity'}, `${panelState.selectedCard.rarity || 'Common'} • ${panelState.selectedCard.work_type_restriction || 'General'}`),
                            React.createElement('div', {key: 'phase'}, `Phase: ${panelState.selectedCard.phase_restriction || 'Any'}`)
                        ])
                    ])
                ) : React.createElement('div', {
                    key: 'no-card',
                    style: { textAlign: 'center', padding: '20px' }
                }, 'No card selected')
            ])
        ])
    ]);
}

window.PlayerStatusPanel = PlayerStatusPanel;