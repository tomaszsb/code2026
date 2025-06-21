/**
 * LoadingScreen - Initial loading interface
 * Shows while CSV data is being loaded
 */

function LoadingScreen() {
    const [dots, setDots] = useState('');
    
    // Animate loading dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        
        return () => clearInterval(interval);
    }, []);
    
    return React.createElement('div', 
        { className: 'loading-screen' },
        React.createElement('div', 
            { className: 'loading-content' },
            React.createElement('h1', null, 'Project Management Board Game'),
            React.createElement('div', 
                { className: 'loading-indicator' },
                React.createElement('p', null, `Loading game data${dots}`),
                React.createElement('div', { className: 'progress-bar' })
            ),
            React.createElement('p', 
                { className: 'loading-subtitle' },
                'Preparing your clean architecture experience...'
            )
        )
    );
}

// Export component
window.LoadingScreen = LoadingScreen;