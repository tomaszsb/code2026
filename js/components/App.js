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
        console.log('App render - gameState:', gameState);
        console.log('App render - gameState.players.length:', gameState.players.length);
        console.log('App render - gameState.gamePhase:', gameState.gamePhase);
    }
    
    // Determine which screen to show
    const showPlayerSetup = !gameState.players || gameState.players.length === 0;
    
    // Additional debug logging
    console.log('App: showPlayerSetup =', showPlayerSetup, 'gamePhase =', gameState.gamePhase, 'players =', gameState.players?.length || 0);
    
    // Main application
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', 
            { className: 'app' },
            
            // Game Manager - handles game logic
            React.createElement(GameManager),
            
            // Advanced System Components (Professional UI & Enhanced Features)
            React.createElement(InteractiveFeedbackComponent),
            React.createElement(TooltipSystemComponent),
            React.createElement(LogicSpaceManagerComponent),
            React.createElement(AdvancedCardManagerComponent),
            React.createElement(AdvancedDiceManagerComponent),
            React.createElement(PlayerMovementVisualizerComponent),
            
            // Game mechanics components
            React.createElement(DiceRoll),
            React.createElement(SpaceChoice),
            React.createElement(TurnManager),
            React.createElement(WinConditionManager),
            React.createElement(GameEndScreen),
            React.createElement(GameTimer),
            React.createElement(GameSaveManager),
            React.createElement(LoadingAndErrorHandler),
            
            // Main game UI based on current state
            showPlayerSetup
                ? React.createElement(EnhancedPlayerSetup)
                : (window.GamePanelLayout ? 
                    React.createElement(GamePanelLayout) :
                    React.createElement(GameBoard)
                  ),
            
            // Debug overlay
            debugMode && React.createElement(DebugInfo, { enabled: true })
        )
    );
}

// Export component
window.App = App;