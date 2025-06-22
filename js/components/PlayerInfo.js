/**
 * PlayerInfo Component - Detailed player dashboard with comprehensive status
 * Adapted for code2026's architecture with enhanced features from code2025
 */

function PlayerInfo({ player, isCurrentPlayer = false, compact = false }) {
    const { useState } = React;
    const [gameState, gameStateManager] = useGameState();
    const [expanded, setExpanded] = useState(!compact);
    const [showScope, setShowScope] = useState(false);

    if (!player) {
        return React.createElement('div', { className: 'player-info-empty' },
            'No player data available'
        );
    }

    // Extract scope information from W (Work) cards
    const extractScope = () => {
        if (!player.cards || player.cards.length === 0) {
            return { items: [], totalCost: 0, totalTime: 0 };
        }

        // Filter W cards only
        const workCards = player.cards.filter(card => card.card_type === 'W');
        
        const scopeItems = workCards.map(card => {
            const workType = card.work_type || card.work_type_restriction || 'General Work';
            const estimatedCost = parseInt(card.work_cost) || parseInt(card.money_cost) || 0;
            const timeRequired = parseInt(card.time_cost) || 0;
            
            return {
                workType,
                estimatedCost,
                timeRequired,
                cardName: card.card_name || card.description || 'Work Card'
            };
        });

        const totalCost = scopeItems.reduce((sum, item) => sum + item.estimatedCost, 0);
        const totalTime = scopeItems.reduce((sum, item) => sum + item.timeRequired, 0);

        return { items: scopeItems, totalCost, totalTime };
    };

    // Calculate financial status
    const calculateFinancialStatus = () => {
        const scope = extractScope();
        const playerMoney = player.money || 0;
        const totalScopeCost = scope.totalCost;
        
        let surplus = 0;
        let deficit = 0;
        let status = 'balanced';

        if (playerMoney >= totalScopeCost) {
            surplus = playerMoney - totalScopeCost;
            status = 'surplus';
        } else {
            deficit = totalScopeCost - playerMoney;
            status = 'deficit';
        }

        return { surplus, deficit, status, playerMoney, totalScopeCost };
    };

    // Get player's progress through phases
    const getPhaseProgress = () => {
        const position = player.position || '';
        const phases = ['INITIATION', 'PLANNING', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY'];
        
        let currentPhase = 'INITIATION';
        let progress = 0;

        phases.forEach((phase, index) => {
            if (position.includes(phase)) {
                currentPhase = phase;
                progress = ((index + 1) / phases.length) * 100;
            }
        });

        return { currentPhase, progress, phases };
    };

    // Get card type distribution
    const getCardDistribution = () => {
        if (!player.cards) return {};
        
        const distribution = {};
        const cardTypes = ['W', 'B', 'I', 'L', 'E'];
        
        cardTypes.forEach(type => {
            distribution[type] = player.cards.filter(card => card.card_type === type).length;
        });

        return distribution;
    };

    // Get recent combo history
    const getRecentCombos = () => {
        return player.comboState?.completedCombos?.slice(-3) || [];
    };

    const scope = extractScope();
    const financialStatus = calculateFinancialStatus();
    const phaseProgress = getPhaseProgress();
    const cardDistribution = getCardDistribution();
    const recentCombos = getRecentCombos();

    // Render compact version
    if (compact) {
        return React.createElement('div', {
            className: `player-info-compact ${isCurrentPlayer ? 'is-current' : ''}`,
            style: {
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isCurrentPlayer ? player.color + '22' : '#ffffff',
                border: `2px solid ${isCurrentPlayer ? player.color : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: isCurrentPlayer ? `0 0 8px ${player.color}44` : '0 2px 4px rgba(0,0,0,0.1)'
            }
        }, [
            // Player color indicator
            React.createElement('div', {
                key: 'color',
                style: {
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: player.color,
                    border: '2px solid white',
                    boxShadow: isCurrentPlayer ? `0 0 6px ${player.color}` : 'none'
                }
            }),
            
            // Player name and basic info
            React.createElement('div', { key: 'info', style: { flex: 1 } }, [
                React.createElement('div', {
                    key: 'name',
                    className: 'font-bold',
                    style: { color: isCurrentPlayer ? '#333' : '#555' }
                }, player.name),
                React.createElement('div', {
                    key: 'money',
                    className: 'text-small text-gray-600'
                }, ComponentUtils.formatMoney(player.money)),
                React.createElement('div', {
                    key: 'position',
                    className: 'text-small text-gray-500'
                }, player.position)
            ]),
            
            // Cards count
            React.createElement('div', {
                key: 'cards',
                className: 'text-small',
                style: {
                    background: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }
            }, `${player.cards?.length || 0} cards`)
        ]);
    }

    // Render expanded version
    return React.createElement('div', {
        className: `player-info-detailed ${isCurrentPlayer ? 'is-current' : ''}`,
        style: {
            background: isCurrentPlayer ? 
                `linear-gradient(135deg, ${player.color}22, ${player.color}11)` : 
                'white',
            border: `2px solid ${isCurrentPlayer ? player.color : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: isCurrentPlayer ? 
                `0 8px 25px ${player.color}33` : 
                '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '16px'
        }
    }, [
        // Header with player name and controls
        React.createElement('div', {
            key: 'header',
            style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${isCurrentPlayer ? player.color + '33' : '#e5e7eb'}`
            }
        }, [
            React.createElement('div', {
                key: 'avatar',
                style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: player.color,
                    border: '3px solid white',
                    boxShadow: isCurrentPlayer ? `0 0 12px ${player.color}66` : '0 2px 8px rgba(0,0,0,0.2)',
                    marginRight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px'
                }
            }, player.name?.charAt(0) || '?'),
            
            React.createElement('div', { key: 'title', style: { flex: 1 } }, [
                React.createElement('h3', {
                    key: 'name',
                    style: {
                        margin: '0 0 4px 0',
                        color: isCurrentPlayer ? '#333' : '#555',
                        fontSize: '18px'
                    }
                }, player.name),
                React.createElement('div', {
                    key: 'status',
                    className: 'text-small',
                    style: { color: '#6b7280' }
                }, isCurrentPlayer ? '🎯 Current Player' : 'Waiting')
            ]),
            
            React.createElement('button', {
                key: 'toggle',
                onClick: () => setExpanded(!expanded),
                className: 'btn btn--small',
                style: {
                    background: player.color,
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px'
                }
            }, expanded ? '▼' : '▶')
        ]),

        // Expanded content
        expanded && React.createElement('div', { key: 'content' }, [
            // Financial overview
            React.createElement('div', {
                key: 'financial',
                className: 'section mb-4'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'heading-5 mb-2'
                }, '💰 Financial Status'),
                React.createElement('div', {
                    key: 'grid',
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('div', { key: 'money' }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-small text-gray-600'
                        }, 'Available Money'),
                        React.createElement('div', {
                            key: 'value',
                            className: 'font-bold text-large',
                            style: { color: '#059669' }
                        }, ComponentUtils.formatMoney(financialStatus.playerMoney))
                    ]),
                    React.createElement('div', { key: 'scope' }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-small text-gray-600'
                        }, 'Scope Cost'),
                        React.createElement('div', {
                            key: 'value',
                            className: 'font-bold text-large',
                            style: { color: '#dc2626' }
                        }, ComponentUtils.formatMoney(financialStatus.totalScopeCost))
                    ]),
                    React.createElement('div', { key: 'status' }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-small text-gray-600'
                        }, 'Status'),
                        React.createElement('div', {
                            key: 'value',
                            className: 'font-bold',
                            style: {
                                color: financialStatus.status === 'surplus' ? '#059669' : 
                                       financialStatus.status === 'deficit' ? '#dc2626' : '#6b7280'
                            }
                        }, financialStatus.status === 'surplus' ? 
                            `+${ComponentUtils.formatMoney(financialStatus.surplus)}` :
                            financialStatus.status === 'deficit' ?
                            `-${ComponentUtils.formatMoney(financialStatus.deficit)}` :
                            'Balanced'
                        )
                    ]),
                    React.createElement('div', { key: 'cards' }, [
                        React.createElement('div', {
                            key: 'label',
                            className: 'text-small text-gray-600'
                        }, 'Cards in Hand'),
                        React.createElement('div', {
                            key: 'value',
                            className: 'font-bold text-large'
                        }, player.cards?.length || 0)
                    ])
                ])
            ]),

            // Phase progress
            React.createElement('div', {
                key: 'progress',
                className: 'section mb-4'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'heading-5 mb-2'
                }, '🎯 Project Progress'),
                React.createElement('div', {
                    key: 'current',
                    className: 'mb-2'
                }, [
                    React.createElement('span', {
                        key: 'label',
                        className: 'text-small text-gray-600'
                    }, 'Current Phase: '),
                    React.createElement('span', {
                        key: 'phase',
                        className: 'font-bold',
                        style: { color: player.color }
                    }, phaseProgress.currentPhase)
                ]),
                React.createElement('div', {
                    key: 'bar-container',
                    style: {
                        background: '#e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: '8px'
                    }
                },
                    React.createElement('div', {
                        style: {
                            background: `linear-gradient(90deg, ${player.color}, ${player.color}cc)`,
                            height: '100%',
                            width: `${phaseProgress.progress}%`,
                            transition: 'width 0.3s ease'
                        }
                    })
                ),
                React.createElement('div', {
                    key: 'position',
                    className: 'text-small text-gray-600 mt-2'
                }, `Currently at: ${player.position}`)
            ]),

            // Card distribution
            React.createElement('div', {
                key: 'cards',
                className: 'section mb-4'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'heading-5 mb-2'
                }, '🃏 Card Portfolio'),
                React.createElement('div', {
                    key: 'distribution',
                    style: {
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }
                }, Object.entries(cardDistribution).map(([type, count]) => {
                    const typeNames = {
                        'W': { name: 'Work', icon: '🔧', color: '#3b82f6' },
                        'B': { name: 'Bank', icon: '💼', color: '#10b981' },
                        'I': { name: 'Investment', icon: '🔍', color: '#f59e0b' },
                        'L': { name: 'Life', icon: '⚖️', color: '#ef4444' },
                        'E': { name: 'Expeditor', icon: '⚠️', color: '#f59e0b' }
                    };
                    const typeInfo = typeNames[type] || typeNames['W'];
                    
                    return React.createElement('div', {
                        key: type,
                        style: {
                            background: typeInfo.color + '22',
                            border: `1px solid ${typeInfo.color}44`,
                            borderRadius: '6px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }
                    }, [
                        React.createElement('span', { key: 'icon' }, typeInfo.icon),
                        React.createElement('span', { key: 'count', className: 'font-bold' }, count),
                        React.createElement('span', { key: 'name', className: 'text-small' }, typeInfo.name)
                    ]);
                }))
            ]),

            // Recent combos (if any)
            recentCombos.length > 0 && React.createElement('div', {
                key: 'combos',
                className: 'section'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'heading-5 mb-2'
                }, '🎯 Recent Combos'),
                React.createElement('div', {
                    key: 'list',
                    style: { display: 'flex', flexDirection: 'column', gap: '6px' }
                }, recentCombos.map((combo, index) =>
                    React.createElement('div', {
                        key: index,
                        style: {
                            background: '#10b981',
                            color: 'white',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px'
                        }
                    }, `${combo.name} (+${ComponentUtils.formatMoney(combo.bonus.money || 0)})`)
                ))
            ]),

            // Scope details toggle
            scope.items.length > 0 && React.createElement('div', {
                key: 'scope-section',
                className: 'section mt-4'
            }, [
                React.createElement('button', {
                    key: 'scope-toggle',
                    onClick: () => setShowScope(!showScope),
                    className: 'btn btn--small btn--full',
                    style: {
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db'
                    }
                }, `${showScope ? '▼' : '▶'} Project Scope Details (${scope.items.length} items)`),
                
                showScope && React.createElement('div', {
                    key: 'scope-details',
                    style: {
                        marginTop: '12px',
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px'
                    }
                }, scope.items.map((item, index) =>
                    React.createElement('div', {
                        key: index,
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: index < scope.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }
                    }, [
                        React.createElement('div', { key: 'work' }, [
                            React.createElement('div', {
                                key: 'type',
                                className: 'font-medium text-small'
                            }, item.workType),
                            React.createElement('div', {
                                key: 'name',
                                className: 'text-small text-gray-600'
                            }, item.cardName)
                        ]),
                        React.createElement('div', {
                            key: 'cost',
                            className: 'font-bold text-small',
                            style: { color: '#dc2626' }
                        }, ComponentUtils.formatMoney(item.estimatedCost))
                    ])
                ))
            ])
        ])
    ]);
}

// Export for module loading  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerInfo;
} else {
    window.PlayerInfoComponent = PlayerInfo;
}