/**
 * PlayerHeader - Player information display component
 * Shows player name, avatar, and turn information
 */

function PlayerHeader({ player, turnCount = 1 }) {
    try {
        if (!player) {
            return React.createElement('div', {
                className: 'player-header'
            }, [
                React.createElement('p', {
                    key: 'no-player',
                    className: 'no-player-message'
                }, 'No active player')
            ]);
        }

        // Defensive checks for player properties
        const playerName = player.name || 'Unknown Player';
        const playerColor = player.color || '#666666';
        const playerAvatar = player.avatar || '👤';
        const safeTurnCount = Math.max(1, (turnCount || 0) + 1);

        return React.createElement('div', {
            className: 'player-header',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '10px'
            }
        }, [
            React.createElement('div', {
                key: 'player-avatar',
                className: 'player-avatar',
                style: { 
                    backgroundColor: playerColor,
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: `3px solid ${playerColor}`,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }
            }, playerAvatar),
            
            React.createElement('div', {
                key: 'player-info',
                className: 'player-info',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }
            }, [
                React.createElement('h3', {
                    key: 'name',
                    style: { 
                        color: playerColor,
                        margin: '0 0 5px 0',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                    }
                }, playerName),
                React.createElement('p', {
                    key: 'turn-info',
                    className: 'turn-info',
                    style: {
                        margin: '0',
                        fontSize: '0.9rem',
                        color: '#666',
                        fontWeight: '500'
                    }
                }, `Turn ${safeTurnCount}`)
])
        ]);
    } catch (error) {
        console.error('PlayerHeader: Error rendering component:', error);
        return React.createElement('div', {
            className: 'player-header error'
        }, [
            React.createElement('p', {
                key: 'error',
                className: 'error-message'
            }, 'Error loading player information')
        ]);
    }
}

window.PlayerHeader = PlayerHeader;