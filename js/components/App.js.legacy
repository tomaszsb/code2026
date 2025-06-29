/**
 * App - Root Application Component
 * Clean architecture entry point with proper loading order
 */

function App({ debugMode = false, logLevel = 'info' }) {
    console.log('🚨 APP COMPONENT FUNCTION CALLED - React is trying to render');
    console.log('🚨 App props:', { debugMode, logLevel });
    
    const { loaded, error } = useCSVData();
    console.log('🚨 CSV loaded:', loaded, 'error:', error);
    
    const [gameState, gameManager] = useGameState();
    console.log('🚨 Game state received:', gameState);
    
    console.log('=== APP COMPONENT RENDER ===');
    console.log('App received gameState:', gameState);
    console.log('App gameState.gamePhase:', gameState.gamePhase);
    console.log('App gameState.players:', gameState.players);
    const { useState } = React;
    
    // Test state - add a simple React state to test if React updates work at all
    const [testCounter, setTestCounter] = useState(0);
    console.log('🚨 Test counter state:', testCounter);
    
    // Card replacement modal state
    const [cardReplacementModal, setCardReplacementModal] = useState({
        show: false,
        playerId: null,
        cardType: null,
        amount: 0,
        playerCards: {},
        playerName: ''
    });
    
    // Initialize app state
    useEffect(() => {
        if (loaded && !error) {
            console.log('Application initialized successfully');
            gameManager.emit('appReady');
        }
    }, [loaded, error]);
    
    // Listen for card replacement modal events
    useEventListener('showCardReplacementModal', (data) => {
        setCardReplacementModal({
            show: true,
            playerId: data.playerId,
            cardType: data.cardType,
            amount: data.amount,
            playerCards: data.playerCards,
            playerName: data.playerName
        });
    });
    
    // Handle card replacement modal actions
    const handleCardReplacementConfirm = (selectedCardIndices) => {
        gameManager.emit('executeCardReplacement', {
            playerId: cardReplacementModal.playerId,
            cardType: cardReplacementModal.cardType,
            cardIndices: selectedCardIndices
        });
        setCardReplacementModal(prev => ({ ...prev, show: false }));
    };
    
    const handleCardReplacementClose = () => {
        setCardReplacementModal(prev => ({ ...prev, show: false }));
    };
    
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
    
    // Determine which screen to show - simplified logic
    const showPlayerSetup = gameState.gamePhase === 'SETUP' || (!gameState.players || gameState.players.length === 0);
    
    // Simplified debug logging
    console.log('App render - gamePhase:', gameState.gamePhase, 'players:', gameState.players?.length || 0, 'showPlayerSetup:', showPlayerSetup);
    
    // Check for any errors
    if (gameState.error) {
        console.error('GameState error:', gameState.error);
    }
    
    console.log('Available components:', {
        GameInitializer: typeof window.GameInitializer,
        GameManager: typeof window.GameManager,
        EnhancedPlayerSetup: typeof window.EnhancedPlayerSetup,
        GameBoard: typeof window.GameBoard,
        GamePanelLayout: typeof window.GamePanelLayout
    });
    
    // Additional debug logging (removed to prevent infinite loop)
    // console.log('App: showPlayerSetup =', showPlayerSetup, 'gamePhase =', gameState.gamePhase, 'players =', gameState.players?.length || 0);
    
    // Main application - clean render without forced keys
    return React.createElement(ErrorBoundary, null,
        React.createElement('div', 
            { className: 'app' },
            
            // Core game components
            typeof window.GameInitializer === 'function' && React.createElement(GameInitializer),
            typeof window.GameManager === 'function' && React.createElement(GameManager),
            
            // Simple debug info + test button
            React.createElement('div', 
                { 
                    style: { 
                        position: 'fixed', 
                        top: '10px', 
                        right: '10px', 
                        background: 'rgba(255, 255, 0, 0.9)', 
                        padding: '10px', 
                        fontSize: '12px',
                        borderRadius: '4px',
                        zIndex: 9999,
                        border: '2px solid red'
                    } 
                },
                React.createElement('div', null, `Phase: ${gameState.gamePhase} | Players: ${gameState.players?.length || 0} | Setup: ${showPlayerSetup}`),
                React.createElement('div', null, `Test Counter: ${testCounter}`),
                React.createElement('button', {
                    onClick: () => setTestCounter(prev => prev + 1),
                    style: { margin: '5px 0', background: 'red', color: 'white', border: 'none', padding: '5px' }
                }, 'Test React Update'),
                React.createElement('div', null, `Current Time: ${new Date().toLocaleTimeString()}`)
            ),
            
            // Main content conditional with visible indicators
            showPlayerSetup 
                ? React.createElement('div', 
                    { style: { border: '5px solid blue', margin: '20px', padding: '20px', background: 'lightblue' } },
                    React.createElement('h1', { style: { color: 'blue', fontSize: '2rem' } }, '🔵 PLAYER SETUP SCREEN'),
                    React.createElement('div', null, `Render time: ${new Date().toLocaleTimeString()}`),
                    React.createElement(EnhancedPlayerSetup)
                )
                : React.createElement('div', 
                    { style: { border: '5px solid green', margin: '20px', padding: '20px', background: 'lightgreen' } },
                    React.createElement('h1', { style: { color: 'green', fontSize: '2rem' } }, '🟢 GAME BOARD SCREEN'),
                    React.createElement('div', null, `Render time: ${new Date().toLocaleTimeString()}`),
                    React.createElement(GameBoard)
                )
        )
    );
}

// Export component
window.App = App;