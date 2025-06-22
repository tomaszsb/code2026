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
        cardsExpanded: true,
        cardFlipped: false
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
    
    // Get icon and color for card type (consistent with rules modal)
    const getCardTypeIcon = (cardType) => {
        const icons = {
            'W': '🔧', // Work
            'B': '💼', // Bank
            'I': '🔍', // Investor
            'L': '⚖️', // Life
            'E': '⚠️'  // Expeditor
        };
        return icons[cardType] || '🃏';
    };

    const getCardTypeColor = (cardType) => {
        const colors = {
            'W': { bg: '#e3f2fd', text: '#1976d2' }, // Work - blue
            'B': { bg: '#e8f5e8', text: '#388e3c' }, // Bank - green
            'I': { bg: '#fff3e0', text: '#f57c00' }, // Investor - orange
            'L': { bg: '#ffebee', text: '#d32f2f' }, // Life - red
            'E': { bg: '#f3e5f5', text: '#7b1fa2' }  // Expeditor - purple
        };
        return colors[cardType] || { bg: '#f5f5f5', text: '#666' };
    };
    
    // Get current space information
    const getCurrentSpaceInfo = () => {
        if (!currentPlayer || !window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        
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
            showCardDetails: false,
            cardFlipped: false
        }));
    };

    const flipCard = () => {
        setPanelState(prev => ({
            ...prev,
            cardFlipped: !prev.cardFlipped
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
                    className: 'resource-item scope-section'
                }, [
                    React.createElement('span', {
                        key: 'scope-header',
                        className: 'scope-main-header'
                    }, [
                        React.createElement('span', {
                            key: 'scope-label',
                            className: 'resource-label'
                        }, 'Project Scope'),
                        React.createElement('span', {
                            key: 'scope-count',
                            className: 'resource-value'
                        }, `${(currentPlayer.scopeItems?.length || 0)} work types`)
                    ]),
                    // Detailed scope breakdown
                    currentPlayer.scopeItems && currentPlayer.scopeItems.length > 0 && 
                    React.createElement('div', {
                        key: 'scope-details',
                        className: 'scope-details'
                    }, [
                        React.createElement('div', {
                            key: 'scope-header',
                            className: 'scope-header'
                        }, [
                            React.createElement('span', {key: 'work-type-header'}, 'Work Type'),
                            React.createElement('span', {key: 'cost-header'}, 'Est. Cost')
                        ]),
                        ...currentPlayer.scopeItems.map((item, index) => 
                            React.createElement('div', {
                                key: `scope-item-${index}`,
                                className: 'scope-item'
                            }, [
                                React.createElement('span', {
                                    key: 'work-type',
                                    className: 'work-type'
                                }, item.count > 1 ? `${item.workType} (${item.count})` : item.workType),
                                React.createElement('span', {
                                    key: 'cost',
                                    className: 'cost'
                                }, `$${item.cost.toLocaleString()}`)
                            ])
                        ),
                        currentPlayer.scopeTotalCost > 0 && React.createElement('div', {
                            key: 'scope-total',
                            className: 'scope-total'
                        }, [
                            React.createElement('span', {key: 'total-label'}, 'Total:'),
                            React.createElement('span', {key: 'total-cost'}, `$${currentPlayer.scopeTotalCost.toLocaleString()}`)
                        ])
                    ])
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
                    getAllCards(currentPlayer.cards).map((card, index) => {
                        const cardColors = getCardTypeColor(card.card_type);
                        return React.createElement('div', {
                            key: `card-${index}`,
                            className: 'card-mini',
                            onClick: () => handleCardSelect(card),
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
                
                panelState.selectedCard ? (() => {
                    const cardColors = getCardTypeColor(panelState.selectedCard.card_type);
                    return React.createElement('div', {
                        key: 'card-container',
                        style: {
                            width: '400px',
                            height: '600px',
                            perspective: '1000px',
                            cursor: 'pointer'
                        },
                        onClick: flipCard
                    }, [
                        React.createElement('div', {
                            key: 'card-flipper',
                            style: {
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                                transform: panelState.cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                transition: 'transform 0.6s ease-in-out'
                            }
                        }, [
                            // Front side (card details)
                            React.createElement('div', {
                                key: 'card-front',
                                style: {
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    background: `linear-gradient(135deg, ${cardColors.bg} 0%, ${cardColors.bg}dd 100%)`,
                                    border: `3px solid ${cardColors.text}`,
                                    borderRadius: '15px',
                                    boxShadow: `0 8px 32px ${cardColors.text}33`,
                                    overflow: 'hidden'
                                }
                            }, [
                        // Card header with type
                        React.createElement('div', {
                            key: 'header',
                            style: {
                                background: `linear-gradient(135deg, ${cardColors.text}, ${cardColors.text}dd)`,
                                color: 'white',
                                padding: '15px 20px',
                                textAlign: 'center',
                                borderBottom: `2px solid ${cardColors.text}`
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
                        
                        // Card name with small graphic on left
                        React.createElement('div', {
                            key: 'name',
                            style: {
                                padding: '20px',
                                borderBottom: '1px solid #dee2e6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }
                        }, [
                            // Small graphic on left
                            React.createElement('div', {
                                key: 'small-graphic',
                                style: {
                                    width: '60px',
                                    height: '60px',
                                    background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #ced4da',
                                    color: '#6c757d',
                                    fontSize: '24px',
                                    flexShrink: 0
                                }
                            }, getCardTypeIcon(panelState.selectedCard.card_type)),
                            
                            // Card title
                            React.createElement('h3', {
                                key: 'title',
                                style: {
                                    margin: '0',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#212529',
                                    lineHeight: '1.3',
                                    textAlign: 'left'
                                }
                            }, panelState.selectedCard.card_name || 'Unknown Card')
                        ]),
                        
                        // Scrollable card content area
                        React.createElement('div', {
                            key: 'card-content',
                            style: {
                                padding: '20px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontSize: '13px'
                            }
                        }, (() => {
                            const card = panelState.selectedCard;
                            const isWCard = card.card_type === 'W';
                            
                            if (isWCard) {
                                // Simplified view for W cards (as requested)
                                return [
                                    // Costs section
                                    React.createElement('div', {
                                        key: 'costs-section',
                                        style: {
                                            background: '#fff3cd',
                                            border: '1px solid #ffeaa7',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'costs-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#856404',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Costs & Requirements'),
                                        
                                        // Work Cost
                                        card.work_cost && React.createElement('div', {
                                            key: 'work-cost',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'label'}, 'Work Cost: '),
                                            `$${parseInt(card.work_cost).toLocaleString()}`
                                        ]),
                                        
                                        // Money Cost
                                        card.money_cost && React.createElement('div', {
                                            key: 'money-cost',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'label'}, 'Money Cost: '),
                                            card.money_cost
                                        ])
                                    ]),
                                    
                                    // Restrictions section
                                    React.createElement('div', {
                                        key: 'restrictions-section',
                                        style: {
                                            background: '#ffebee',
                                            border: '1px solid #f44336',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'restrictions-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#d32f2f',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Restrictions & Limits'),
                                        
                                        // Work Type Restriction
                                        card.work_type_restriction && React.createElement('div', {
                                            key: 'work-type',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'label'}, 'Work Type: '),
                                            card.work_type_restriction
                                        ]),
                                        
                                        // Space Restriction
                                        card.space_restriction && React.createElement('div', {
                                            key: 'space-restriction',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'label'}, 'Space: '),
                                            card.space_restriction
                                        ])
                                    ])
                                ];
                            } else {
                                // Full information view for non-W cards (B, I, L, E)
                                const sections = [];
                                
                                // Description section
                                if (card.description) {
                                    sections.push(React.createElement('div', {
                                        key: 'description-section',
                                        style: {
                                            background: '#e3f2fd',
                                            border: '1px solid #2196f3',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'desc-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#1976d2',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Description'),
                                        React.createElement('div', {
                                            key: 'desc-text',
                                            style: { lineHeight: '1.4' }
                                        }, card.description)
                                    ]));
                                }
                                
                                // Effects section
                                const effects = [];
                                if (card.loan_amount) effects.push(['Loan Amount', `$${parseInt(card.loan_amount).toLocaleString()}`]);
                                if (card.loan_rate) effects.push(['Interest Rate', `${card.loan_rate}%`]);
                                if (card.money_effect) effects.push(['Money Effect', card.money_effect]);
                                if (card.money_cost) effects.push(['Money Cost', card.money_cost]);
                                if (card.time_effect) effects.push(['Time Effect', `${card.time_effect} days`]);
                                if (card.immediate_effect) effects.push(['Immediate Effect', card.immediate_effect]);
                                if (card.turn_effect) effects.push(['Turn Effect', card.turn_effect]);
                                if (card.investment_amount) effects.push(['Investment Amount', `$${parseInt(card.investment_amount).toLocaleString()}`]);
                                
                                if (effects.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'effects-section',
                                        style: {
                                            background: '#e8f5e8',
                                            border: '1px solid #4caf50',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'effects-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#388e3c',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Card Effects'),
                                        ...effects.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `effect-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: 'label'}, `${label}: `),
                                                value
                                            ])
                                        )
                                    ]));
                                }
                                
                                // Additional Information section
                                const additionalInfo = [];
                                if (card.flavor_text) additionalInfo.push(['Flavor Text', card.flavor_text]);
                                if (card.target) additionalInfo.push(['Target', card.target]);
                                if (card.scope) additionalInfo.push(['Scope', card.scope]);
                                if (card.duration) additionalInfo.push(['Duration', card.duration]);
                                if (card.activation_timing) additionalInfo.push(['Activation', card.activation_timing]);
                                if (card.phase_restriction) additionalInfo.push(['Phase Restriction', card.phase_restriction]);
                                if (card.space_restriction) additionalInfo.push(['Space Restriction', card.space_restriction]);
                                if (card.work_type_restriction) additionalInfo.push(['Work Type', card.work_type_restriction]);
                                
                                if (additionalInfo.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'additional-section',
                                        style: {
                                            background: '#fff3e0',
                                            border: '1px solid #ff9800',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'additional-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#f57c00',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Additional Information'),
                                        ...additionalInfo.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `info-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: 'label'}, `${label}: `),
                                                value
                                            ])
                                        )
                                    ]));
                                }
                                
                                // Usage & Stacking section
                                const usageInfo = [];
                                if (card.usage_limit) usageInfo.push(['Usage Limit', card.usage_limit]);
                                if (card.stacking_limit) usageInfo.push(['Stacking Limit', card.stacking_limit]);
                                if (card.cooldown) usageInfo.push(['Cooldown', card.cooldown]);
                                if (card.combo_requirement) usageInfo.push(['Combo Requirement', card.combo_requirement]);
                                if (card.prerequisite) usageInfo.push(['Prerequisite', card.prerequisite]);
                                
                                if (usageInfo.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'usage-section',
                                        style: {
                                            background: '#f3e5f5',
                                            border: '1px solid #9c27b0',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'usage-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#7b1fa2',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Usage & Stacking Limits'),
                                        ...usageInfo.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `usage-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: 'label'}, `${label}: `),
                                                value
                                            ])
                                        )
                                    ]));
                                }
                                
                                return sections;
                            }
                        })()),
                        
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
                            ]),

                            // Back side (Unravel logo)
                            React.createElement('div', {
                                key: 'card-back',
                                style: {
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                                    border: '3px solid #2c3e50',
                                    borderRadius: '15px',
                                    boxShadow: '0 8px 32px rgba(44, 62, 80, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    textAlign: 'center'
                                }
                            }, [
                                React.createElement('img', {
                                    key: 'unravel-logo',
                                    src: './graphics/My ChatGPT image.png',
                                    alt: 'Unravel Logo',
                                    style: {
                                        maxWidth: '200px',
                                        maxHeight: '200px',
                                        marginBottom: '20px',
                                        borderRadius: '10px'
                                    },
                                    onError: (e) => {
                                        e.target.style.display = 'none';
                                    }
                                }),
                                React.createElement('h3', {
                                    key: 'back-title',
                                    style: {
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                    }
                                }, 'UNRAVEL'),
                                React.createElement('p', {
                                    key: 'back-subtitle',
                                    style: {
                                        fontSize: '14px',
                                        opacity: 0.8,
                                        fontStyle: 'italic'
                                    }
                                }, 'Project Management Game'),
                                React.createElement('p', {
                                    key: 'flip-hint',
                                    style: {
                                        fontSize: '12px',
                                        opacity: 0.6,
                                        marginTop: '20px'
                                    }
                                }, 'Click to flip back')
                            ])
                        ])
                    ]);
                })() : React.createElement('div', {
                    key: 'no-card',
                    style: { textAlign: 'center', padding: '20px' }
                }, 'No card selected')
            ])
        ])
    ]);
}

window.PlayerStatusPanel = PlayerStatusPanel;