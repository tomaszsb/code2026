/**
 * PlayerResources - Player resources display component
 * Shows money, time, scope summary with costs and detailed breakdown
 */

function PlayerResources({ player, onCardSelect, cardsExpanded, onToggleExpanded }) {
    // Helper function to convert hex to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    try {
        if (!player) {
            return React.createElement('div', {
                className: 'player-resources'
            }, [
                React.createElement('h4', {
                    key: 'resources-title',
                    className: 'section-title'
                }, '💰 Resources'),
                React.createElement('p', {
                    key: 'no-player',
                    className: 'no-player-message'
                }, 'No active player')
            ]);
        }

        // Defensive property access with fallbacks
        const money = typeof player.money === 'number' ? player.money : 0;
        const timeSpent = typeof player.timeSpent === 'number' ? player.timeSpent : 0;
        const scopeItems = Array.isArray(player.scopeItems) ? player.scopeItems : [];
        const scopeTotalCost = typeof player.scopeTotalCost === 'number' ? player.scopeTotalCost : 0;

        // Get player color for background hue
        const playerColor = player.color || '#4285f4'; // Default to blue if no color
        const playerColorRgb = hexToRgb(playerColor);
        const playerBgColor = playerColorRgb ? 
            `rgba(${playerColorRgb.r}, ${playerColorRgb.g}, ${playerColorRgb.b}, 0.1)` : 
            'rgba(66, 133, 244, 0.1)';
        
        return React.createElement('div', {
            className: 'player-resources',
            style: {
                backgroundColor: playerBgColor,
                border: `1px solid ${playerColor}30`,
                borderRadius: '8px',
                padding: '12px'
            }
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
                }, `$${money.toLocaleString()}`)
            ]),
            
            React.createElement('div', {
                key: 'time',
                className: 'resource-item space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #dc3545',
                    borderRadius: '4px',
                    padding: '8px',
                    margin: '4px 0'
                }
            }, [
                React.createElement('span', {key: 'icon'}, '⏰ '),
                React.createElement('span', {
                    key: 'time-label',
                    className: 'resource-label'
                }, 'Time:'),
                React.createElement('span', {
                    key: 'time-value',
                    className: 'resource-value'
                }, `${timeSpent} days`)
            ]),
            
            React.createElement('div', {
                key: 'scope',
                className: 'resource-item scope-section space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #007bff',
                    borderRadius: '4px',
                    padding: '8px',
                    margin: '4px 0'
                }
            }, [
                React.createElement('span', {
                    key: 'scope-header',
                    className: 'scope-main-header'
                }, [
                    React.createElement('span', {key: 'icon'}, '📋 '),
                    React.createElement('span', {
                        key: 'scope-label',
                        className: 'resource-label'
                    }, 'Project Scope:'),
                    React.createElement('span', {
                        key: 'scope-count',
                        className: 'resource-value'
                    }, `${scopeItems.length} work types`)
                ]),
                // Detailed scope breakdown
                scopeItems.length > 0 && 
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
                    ...scopeItems.map((item, index) => 
                        React.createElement('div', {
                            key: `scope-item-${index}`,
                            className: 'scope-item'
                        }, [
                            React.createElement('span', {
                                key: 'work-type',
                                className: 'work-type'
                            }, (item.count && item.count > 1) ? `${item.workType || 'Unknown'} (${item.count})` : (item.workType || 'Unknown')),
                            React.createElement('span', {
                                key: 'cost',
                                className: 'cost'
                            }, `$${(item.cost || 0).toLocaleString()}`)
                        ])
                    ),
                    scopeTotalCost > 0 && React.createElement('div', {
                        key: 'scope-total',
                        className: 'scope-total'
                    }, [
                        React.createElement('span', {key: 'total-label'}, 'Total:'),
                        React.createElement('span', {key: 'total-cost'}, `$${scopeTotalCost.toLocaleString()}`)
                    ])
                ])
            ]),
            
            // Cards in Hand section inside resources
            window.CardsInHand ? React.createElement(window.CardsInHand, {
                key: 'cards-in-hand',
                player: player,
                onCardSelect: onCardSelect,
                cardsExpanded: cardsExpanded,
                onToggleExpanded: onToggleExpanded
            }) : null
        ])
    ]);
    } catch (error) {
        console.error('PlayerResources: Error rendering component:', error);
        return React.createElement('div', {
            className: 'player-resources error'
        }, [
            React.createElement('h4', {
                key: 'resources-title',
                className: 'section-title'
            }, '💰 Resources'),
            React.createElement('p', {
                key: 'error',
                className: 'error-message'
            }, 'Error loading player resources')
        ]);
    }
}

window.PlayerResources = PlayerResources;