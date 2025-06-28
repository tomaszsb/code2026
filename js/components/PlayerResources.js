/**
 * PlayerResources - Player resources display component
 * Shows money, time, scope summary with costs and detailed breakdown
 */

function PlayerResources({ player }) {
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

        return React.createElement('div', {
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
                }, `$${money.toLocaleString()}`)
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
                }, `${timeSpent} days`)
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
            ])
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