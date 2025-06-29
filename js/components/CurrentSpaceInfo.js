/**
 * CurrentSpaceInfo - Enhanced current space information display component
 * Shows comprehensive space details, effects, requirements, and actions
 * Restored in Phase 32: Enhanced space information panel
 */

function CurrentSpaceInfo({ player, debugMode = false, isInUnifiedContainer = false }) {
    // Get comprehensive current space information
    const getCurrentSpaceInfo = () => {
        if (!player || !window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        
        const visitType = player.visitType || 'First';
        const spaceName = player.position;
        
        // Get all relevant space data
        const spaceContent = window.CSVDatabase.spaceContent.find(spaceName, visitType);
        const configData = window.CSVDatabase.gameConfig.find(spaceName);
        const spaceEffects = window.CSVDatabase.spaceEffects.query({
            space_name: spaceName,
            visit_type: visitType
        });
        const movement = window.CSVDatabase.movement.find(spaceName, visitType);
        const diceOutcomes = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
        
        return {
            content: spaceContent,
            config: configData,
            effects: spaceEffects || [],
            movement: movement,
            diceOutcomes: diceOutcomes,
            spaceName: spaceName,
            visitType: visitType,
            phase: configData?.phase || 'N/A'
        };
    };

    // Helper functions for contextual information
    const getContextualEffects = (effects) => {
        if (!effects || effects.length === 0) return [];
        
        const contextualEffects = [];
        
        effects.forEach(effect => {
            // Only show time effects in space panel (contextual info)
            if (effect.effect_type === 'time') {
                const value = effect.use_dice ? 'varies by dice' : `${effect.effect_value > 0 ? '+' : ''}${effect.effect_value} day${Math.abs(effect.effect_value) !== 1 ? 's' : ''}`;
                const condition = effect.condition && effect.condition !== 'always' ? ` (${effect.condition})` : '';
                
                contextualEffects.push({
                    icon: '⏰',
                    label: 'Time',
                    value: value + condition
                });
            }
        });
        
        return contextualEffects;
    };
    
    const getMovementContext = (movement, diceOutcomes) => {
        if (!movement) return null;
        
        // Only show single fixed destination in space panel (contextual)
        // Multiple destinations/choices belong in action panel (interactive)
        if (movement.movement_type === 'fixed') {
            const destination = movement.destination_1;
            if (destination && destination !== 'null') {
                return {
                    type: 'single',
                    destination: destination
                };
            }
        }
        
        return null;
    };

    const spaceInfo = getCurrentSpaceInfo();
    const allSpaceData = debugMode ? spaceInfo : null;
    
    const contextualEffects = spaceInfo ? getContextualEffects(spaceInfo.effects) : [];
    const movementContext = spaceInfo ? getMovementContext(spaceInfo.movement, spaceInfo.diceOutcomes) : null;

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

    if (!spaceInfo) {
        return React.createElement('div', {
            className: 'current-space-info'
        }, [
            React.createElement('h4', {
                key: 'space-title',
                className: 'section-title'
            }, '📍 Current Space'),
            React.createElement('p', {
                key: 'loading',
                className: 'loading-message'
            }, 'Loading space information...')
        ]);
    }

    return React.createElement('div', {
        className: isInUnifiedContainer ? 'current-space-info-minimal' : 'current-space-info enhanced',
        style: isInUnifiedContainer ? {
            background: 'transparent',
            border: 'none',
            padding: '0',
            margin: '0'
        } : {}
    }, [
        React.createElement('h4', {
            key: 'space-title',
            className: 'section-title'
        }, '📍 Current Space'),
        
        React.createElement('div', {
            key: 'space-card',
            className: 'space-card enhanced'
        }, [
            // Phase • Space Name • Visit format
            React.createElement('div', {
                key: 'phase-space-visit',
                className: 'space-meta-line primary'
            }, `${spaceInfo.phase || 'UNKNOWN'} • ${spaceInfo.spaceName || 'Unknown'} • ${spaceInfo.visitType === 'Subsequent' ? 'SUBSEQUENT' : 'FIRST'} VISIT`),
            
            // Space title and story with container styling
            spaceInfo.content && spaceInfo.content.title && React.createElement('div', {
                key: 'space-title-container',
                className: 'space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #007bff',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '8px'
                }
            }, [
                React.createElement('span', {key: 'icon'}, '📍 '),
                React.createElement('strong', {key: 'label'}, spaceInfo.content.title)
            ]),
            
            spaceInfo.content && spaceInfo.content.story && React.createElement('div', {
                key: 'space-story-container',
                className: 'space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #28a745',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '8px'
                }
            }, [
                React.createElement('span', {key: 'icon'}, '📖 '),
                spaceInfo.content.story
            ]),
            
            // Expected outcome with container styling
            spaceInfo.content && spaceInfo.content.outcome_description && React.createElement('div', {
                key: 'space-outcome-container',
                className: 'space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #ffc107',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '8px'
                }
            }, [
                React.createElement('span', {key: 'icon'}, '📋 '),
                React.createElement('strong', {key: 'label'}, 'Expected Outcome: '),
                spaceInfo.content.outcome_description
            ]),
            
            // Contextual effects with container styling
            contextualEffects.length > 0 && contextualEffects.map((effect, index) => 
                React.createElement('div', {
                    key: `context-effect-container-${index}`,
                    className: 'space-info-container',
                    style: {
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderLeft: '4px solid #dc3545',
                        borderRadius: '4px',
                        padding: '12px',
                        marginBottom: '8px'
                    }
                }, [
                    React.createElement('span', {key: 'icon'}, effect.icon + ' '),
                    React.createElement('strong', {key: 'label'}, effect.label + ': '),
                    effect.value
                ])
            ),
            
            // Single destination movement with container styling
            movementContext && React.createElement('div', {
                key: 'movement-context-container',
                className: 'space-info-container',
                style: {
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderLeft: '4px solid #6f42c1',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '8px'
                }
            }, [
                React.createElement('span', {key: 'icon'}, '➡️ '),
                React.createElement('strong', {key: 'label'}, 'Next: '),
                movementContext.destination
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
            }, '🐛 Debug: Enhanced Space Data'),
            
            React.createElement('pre', {
                key: 'debug-content',
                style: { fontSize: '11px', overflow: 'auto', maxHeight: '200px' }
            }, JSON.stringify(allSpaceData, null, 2))
        ])
    ]);
}

window.CurrentSpaceInfo = CurrentSpaceInfo;