/**
 * App - Root Application Component
 * Clean architecture entry point with proper loading order
 */

function App({ debugMode = false, logLevel = 'info' }) {
    const { loaded, error } = useCSVData();
    const [gameState, gameManager] = useGameState();
    
    // Initialize app state
    useEffect(() => {
        if (loaded && !error) {
            console.log('Application initialized successfully');
            gameManager.emit('appReady');
        }
    }, [loaded, error]);
    
    // Handle errors
    if (error) {
        return React.createElement('div', 
            { className: 'app-error' },
            React.createElement('h1', null, 'Failed to Load Game'),
            React.createElement('p', null, error),
            React.createElement('button', 
                { onClick: () => window.location.reload() },
                'Retry'
            )
        );
    }
    
    // Show loading screen while CSV data loads
    if (!loaded) {
        return React.createElement(LoadingScreen);
    }
    
    // Debug log to track state changes
    if (debugMode) {
        console.log('App render - gameState.players.length:', gameState.players.length);
    }
    
    // Determine which screen to show
    const showPlayerSetup = !gameState.players || gameState.players.length === 0;
    
    // Main application
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', 
            { className: 'app' },
            
            // Game Manager - handles game logic
            React.createElement(GameManager),
            
            // Main game UI based on current state
            showPlayerSetup
                ? React.createElement(PlayerSetup)
                : React.createElement(GameBoard),
            
            // Debug overlay
            debugMode && React.createElement(DebugInfo, { enabled: true })
        )
    );
}

// Export component
window.App = App;