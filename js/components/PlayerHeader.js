/**
 * PlayerHeader - Player information display component
 * Shows player name, avatar, and turn information
 */

function PlayerHeader({ player, currentPlayerIndex, totalPlayers }) {
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

    return React.createElement('div', {
        className: 'player-header'
    }, [
        React.createElement('div', {
            key: 'player-avatar',
            className: 'player-avatar',
            style: { backgroundColor: player.color }
        }, player.name.charAt(0).toUpperCase()),
        
        React.createElement('div', {
            key: 'player-info',
            className: 'player-info'
        }, [
            React.createElement('h3', {
                key: 'name',
                style: { color: player.color }
            }, player.name),
            React.createElement('p', {
                key: 'turn-info',
                className: 'turn-info'
            }, `Turn ${currentPlayerIndex + 1} of ${totalPlayers}`)
        ])
    ]);
}

window.PlayerHeader = PlayerHeader;