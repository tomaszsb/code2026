/**
 * PlayerHeader - Player information display component
 * Shows player name, avatar, and turn information
 */

function PlayerHeader({ player, currentPlayerIndex = 0, totalPlayers = 1 }) {
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
        const safeCurrentIndex = Math.max(0, currentPlayerIndex || 0);
        const safeTotalPlayers = Math.max(1, totalPlayers || 1);

        return React.createElement('div', {
            className: 'player-header'
        }, [
            React.createElement('div', {
                key: 'player-avatar',
                className: 'player-avatar',
                style: { backgroundColor: playerColor }
            }, playerName.charAt(0).toUpperCase()),
            
            React.createElement('div', {
                key: 'player-info',
                className: 'player-info'
            }, [
                React.createElement('h3', {
                    key: 'name',
                    style: { color: playerColor }
                }, playerName),
                React.createElement('p', {
                    key: 'turn-info',
                    className: 'turn-info'
                }, `Turn ${safeCurrentIndex + 1} of ${safeTotalPlayers}`)
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