/**
 * PlayerSetup - Initial game setup interface
 * Collects player names and game settings
 */

function PlayerSetup() {
    const [players, setPlayers] = useState(['Player 1']);
    const [gameSettings] = useState({
        maxPlayers: 4,
        winCondition: 'FIRST_TO_FINISH'
    });
    const [gameState, gameStateManager] = useGameState();
    
    // Add player input
    const addPlayer = () => {
        if (players.length < gameSettings.maxPlayers) {
            setPlayers([...players, `Player ${players.length + 1}`]);
        }
    };
    
    // Remove player input
    const removePlayer = (index) => {
        if (players.length > 1) {
            setPlayers(players.filter((_, i) => i !== index));
        }
    };
    
    // Update player name
    const updatePlayerName = (index, name) => {
        const newPlayers = [...players];
        newPlayers[index] = name;
        setPlayers(newPlayers);
    };
    
    // Start game
    const startGame = () => {
        const validPlayers = players.filter(name => name.trim());
        if (validPlayers.length === 0) {
            alert('Please add at least one player');
            return;
        }
        
        gameStateManager.initializeGame(validPlayers, gameSettings);
    };
    
    return React.createElement('div', 
        { className: 'player-setup' },
        
        React.createElement('div', 
            { className: 'setup-container' },
            
            React.createElement('h1', null, 'Project Management Board Game'),
            React.createElement('h2', null, 'Game Setup'),
            
            // Player inputs
            React.createElement('div', 
                { className: 'players-section' },
                React.createElement('h3', null, 'Players'),
                
                players.map((playerName, index) => 
                    React.createElement('div', 
                        { key: index, className: 'player-input' },
                        React.createElement('input', {
                            type: 'text',
                            placeholder: `Player ${index + 1} Name`,
                            value: playerName,
                            onChange: (e) => updatePlayerName(index, e.target.value),
                            maxLength: 20
                        }),
                        players.length > 1 && React.createElement('button', 
                            { 
                                type: 'button',
                                onClick: () => removePlayer(index),
                                className: 'remove-player'
                            },
                            '×'
                        )
                    )
                ),
                
                players.length < gameSettings.maxPlayers && React.createElement('button', 
                    { 
                        type: 'button',
                        onClick: addPlayer,
                        className: 'add-player'
                    },
                    'Add Player'
                )
            ),
            
            // Quick start section
            React.createElement('div', 
                { className: 'quick-start-section' },
                React.createElement('button', 
                    { 
                        className: 'quick-start-button',
                        onClick: () => {
                            gameStateManager.initializeGame(['Player 1'], gameSettings);
                        }
                    },
                    'Quick Start (1 Player)'
                )
            ),
            
            // Start button
            React.createElement('div', 
                { className: 'start-section' },
                React.createElement('button', 
                    { 
                        className: 'start-game-button',
                        onClick: startGame,
                        disabled: players.filter(name => name.trim()).length === 0
                    },
                    'Start Game'
                )
            ),
            
            // Game info
            React.createElement('div', 
                { className: 'game-info' },
                React.createElement('h3', null, 'How to Play'),
                React.createElement('p', null, 
                    'Navigate through project phases from initiation to completion. '
                ),
                React.createElement('p', null,
                    'Manage scope, budget, and timeline while dealing with real-world challenges.'
                ),
                React.createElement('p', null,
                    'Use the CSV-driven architecture for consistent game content!'
                )
            )
        )
    );
}

// Export component
window.PlayerSetup = PlayerSetup;