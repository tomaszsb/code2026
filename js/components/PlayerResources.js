/**
 * PlayerResources - Player resources display component
 * Shows money, time, scope summary with costs and detailed breakdown
 */

function PlayerResources({ player }) {
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
                }, `$${(player.money || 0).toLocaleString()}`)
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
                }, `${player.timeSpent || 0} days`)
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
                    }, `${(player.scopeItems?.length || 0)} work types`)
                ]),
                // Detailed scope breakdown
                player.scopeItems && player.scopeItems.length > 0 && 
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
                    ...player.scopeItems.map((item, index) => 
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
                    player.scopeTotalCost > 0 && React.createElement('div', {
                        key: 'scope-total',
                        className: 'scope-total'
                    }, [
                        React.createElement('span', {key: 'total-label'}, 'Total:'),
                        React.createElement('span', {key: 'total-cost'}, `$${player.scopeTotalCost.toLocaleString()}`)
                    ])
                ])
            ])
        ])
    ]);
}

window.PlayerResources = PlayerResources;