/**
 * CurrentSpaceInfo - Current space information display component
 * Shows space details, requirements, and descriptions
 */

function CurrentSpaceInfo({ player, debugMode = false }) {
    // Get current space information
    const getCurrentSpaceInfo = () => {
        if (!player || !window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        
        const spaceData = window.CSVDatabase.spaceContent.find(
            player.position, 
            player.visitType || 'First'
        );
        
        const configData = window.CSVDatabase.gameConfig.find(player.position);
        
        // Merge space content with config data for complete information
        return spaceData ? {
            ...spaceData,
            phase: configData?.phase || 'N/A'
        } : null;
    };

    // Get all space data for debug mode
    const getAllSpaceData = () => {
        if (!player || !window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        
        const visitType = player.visitType || 'First';
        return {
            content: window.CSVDatabase.spaceContent.find(player.position, visitType),
            effects: window.CSVDatabase.spaceEffects.query({
                space_name: player.position,
                visit_type: visitType
            }),
            movement: window.CSVDatabase.movement.find(player.position, visitType),
            diceOutcomes: window.CSVDatabase.diceOutcomes.find(player.position, visitType),
            config: window.CSVDatabase.gameConfig.find(player.position)
        };
    };

    const currentSpace = getCurrentSpaceInfo();
    const allSpaceData = debugMode ? getAllSpaceData() : null;

    if (!player) {
        return React.createElement('div', {
            className: 'current-space-info'
        }, [
            React.createElement('h4', {
                key: 'space-title',
                className: 'section-title'
            }, '📍 Current Space'),
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'No active player')
        ]);
    }

    return React.createElement('div', {
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
            }, player.position || 'Unknown'),
            
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
        ]),

        // Debug information (only show in debug mode)
        debugMode && allSpaceData && React.createElement('div', {
            key: 'debug-space-data',
            className: 'debug-space-data',
            style: { 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px'
            }
        }, [
            React.createElement('h6', {
                key: 'debug-title',
                style: { margin: '0 0 10px 0', fontWeight: 'bold' }
            }, '🐛 Debug: All Space Data'),
            
            React.createElement('div', {
                key: 'content-data',
                style: { marginBottom: '8px' }
            }, [
                React.createElement('strong', { key: 'label' }, 'Content: '),
                React.createElement('code', { key: 'value' }, 
                    allSpaceData.content ? JSON.stringify(allSpaceData.content, null, 2) : 'null'
                )
            ]),
            
            React.createElement('div', {
                key: 'effects-data',
                style: { marginBottom: '8px' }
            }, [
                React.createElement('strong', { key: 'label' }, 'Effects: '),
                React.createElement('code', { key: 'value' }, 
                    allSpaceData.effects ? JSON.stringify(allSpaceData.effects, null, 2) : 'null'
                )
            ]),
            
            React.createElement('div', {
                key: 'movement-data',
                style: { marginBottom: '8px' }
            }, [
                React.createElement('strong', { key: 'label' }, 'Movement: '),
                React.createElement('code', { key: 'value' }, 
                    allSpaceData.movement ? JSON.stringify(allSpaceData.movement, null, 2) : 'null'
                )
            ])
        ])
    ]);
}

window.CurrentSpaceInfo = CurrentSpaceInfo;