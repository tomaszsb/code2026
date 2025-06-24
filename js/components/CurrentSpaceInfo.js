/**
 * CurrentSpaceInfo - Current space information display component
 * Shows space details, requirements, and descriptions
 */

function CurrentSpaceInfo({ player }) {
    // Get current space information
    const getCurrentSpaceInfo = () => {
        if (!player || !window.CSVDatabase || !window.CSVDatabase.loaded) return null;
        
        const spaceData = window.CSVDatabase.spaces.find(
            player.position, 
            player.visitType || 'First'
        );
        
        return spaceData;
    };

    const currentSpace = getCurrentSpaceInfo();

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
        ])
    ]);
}

window.CurrentSpaceInfo = CurrentSpaceInfo;