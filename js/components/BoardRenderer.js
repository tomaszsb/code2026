/**
 * BoardRenderer - Visual board rendering components
 * Extracted from GameBoard.js for better maintainability and separation of concerns
 * Handles the visual representation and space interactions
 */

/**
 * VisualBoard - Visual representation of the game board
 */
function VisualBoard({ gameState, onSpaceClick, availableMoves, boardState, currentPlayer }) {
    const { useState, useEffect } = React;
    const [allSpaces, setAllSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Load all unique spaces for the board
        if (window.CSVDatabase && window.CSVDatabase.loaded) {
            const spaces = window.CSVDatabase.spaceContent.query();
            const gameConfig = window.CSVDatabase.gameConfig.query();
            
            // Get unique spaces by name and merge with config data for phase info
            const uniqueSpaces = spaces.reduce((acc, space) => {
                if (!acc.find(s => s.space_name === space.space_name)) {
                    const configData = gameConfig.find(config => config.space_name === space.space_name);
                    acc.push({
                        ...space,
                        phase: configData?.phase || 'MISC'
                    });
                }
                return acc;
            }, []);
            
            setAllSpaces(uniqueSpaces);
            setLoading(false);
        }
    }, []);
    
    if (loading) {
        return React.createElement('div', { className: 'board-loading' }, 'Loading board...');
    }
    
    // Define all spaces in snake flow order for wrapping layout
    const snakeFlow = [
        'OWNER-SCOPE-INITIATION', 'OWNER-FUND-INITIATION', 'PM-DECISION-CHECK',
        'OWNER-DECISION-REVIEW', 'LEND-SCOPE-CHECK', 'BANK-FUND-REVIEW', 'INVESTOR-FUND-REVIEW',
        'ARCH-INITIATION', 'ARCH-FEE-REVIEW', 'ARCH-SCOPE-CHECK', 'ENG-INITIATION',
        'ENG-FEE-REVIEW', 'ENG-SCOPE-CHECK', 'REG-DOB-FEE-REVIEW', 'REG-DOB-TYPE-SELECT',
        'REG-DOB-PLAN-EXAM', 'REG-DOB-PROF-CERT', 'REG-FDNY-FEE-REVIEW', 'REG-FDNY-PLAN-EXAM',
        'REG-DOB-AUDIT', 'REG-DOB-FINAL-REVIEW', 'CON-INITIATION', 'CON-ISSUES',
        'CON-INSPECT', 'FINISH', 'CHEAT-BYPASS'
    ];
    
    // Create space lookup for quick access
    const spaceMap = allSpaces.reduce((acc, space) => {
        acc[space.space_name] = space;
        return acc;
    }, {});
    
    return React.createElement('div', 
        { className: 'visual-board snake-layout' },
        React.createElement('div', { className: 'board-title' }, 'Project Management Board'),
        React.createElement('div', 
            { className: 'snake-grid' },
            snakeFlow.map((spaceName, index) => {
                const space = spaceMap[spaceName];
                if (!space) return null;
                
                return React.createElement(BoardSpace, {
                    key: space.space_name,
                    space,
                    players: gameState.players.filter(p => p.position === space.space_name),
                    onClick: () => onSpaceClick(space.space_name),
                    isAvailableMove: availableMoves.includes(space.space_name),
                    isCurrentPosition: currentPlayer && currentPlayer.position === space.space_name,
                    isVisited: boardState.visitedSpaces.includes(space.space_name),
                    'data-order': index + 1
                });
            })
        )
    );
}

/**
 * BoardSpace - Individual space on the board
 */
function BoardSpace({ space, players, onClick, isAvailableMove, isCurrentPosition, isVisited }) {
    const hasPlayers = players.length > 0;
    
    // Build CSS classes based on state
    const spaceClasses = [
        'board-space',
        hasPlayers ? 'has-players' : '',
        isAvailableMove ? 'available-move' : '',
        isCurrentPosition ? 'current-position' : '',
        isVisited ? 'visited' : '',
        isAvailableMove ? 'clickable' : ''
    ].filter(Boolean).join(' ');
    
    return React.createElement('div', 
        { 
            className: spaceClasses,
            onClick: onClick,
            title: `${space.space_name}${hasPlayers ? ` (${players.length} player${players.length > 1 ? 's' : ''})` : ''}`
        },
        React.createElement('div', { className: 'space-header' },
            React.createElement('div', { className: 'space-name' }, space.space_name),
            space.phase && React.createElement('div', { className: 'space-phase' }, space.phase)
        ),
        React.createElement('div', { className: 'space-content' },
            space.Event && React.createElement('div', { className: 'space-event' }, 
                space.Event.substring(0, 100) + (space.Event.length > 100 ? '...' : '')
            )
        ),
        hasPlayers && React.createElement('div', { className: 'space-players' },
            players.map(player => 
                React.createElement('span', 
                    { 
                        key: player.id,
                        className: 'player-marker',
                        title: player.name
                    },
                    player.name.charAt(0)
                )
            )
        ),
        isAvailableMove && React.createElement('div', { className: 'move-indicator' }, '→')
    );
}

/**
 * SpaceDisplay - Detailed display of a space
 */
function SpaceDisplay({ spaceName, visitType, onMoveRequest }) {
    if (!window.CSVDatabase || !window.CSVDatabase.loaded || !spaceName) {
        return React.createElement('div', 
            { className: 'text-center' },
            React.createElement('p', { className: 'text-body' }, 'No space data available')
        );
    }
    
    const spaceData = window.CSVDatabase.spaceContent.find(spaceName, visitType);
    
    if (!spaceData) {
        return React.createElement('div', 
            { className: 'text-center' },
            React.createElement('p', { className: 'text-body' }, `Space ${spaceName}/${visitType} not found`)
        );
    }
    
    const nextSpaces = ComponentUtils.getNextSpaces(spaceName, visitType || 'First');
    const cardTypes = ComponentUtils.getCardTypes(spaceName, visitType || 'First');
    
    return React.createElement('div', 
        { className: 'flex flex-col gap-4' },
        React.createElement('div',
            { className: 'flex items-center gap-2' },
            React.createElement('h3', { className: 'heading-3' }, spaceData.space_name),
            React.createElement('span', { className: 'badge badge--primary' }, spaceData.phase)
        ),
        
        spaceData.Event && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Event'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Event)
        ),
        
        spaceData.Action && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Action'),
            React.createElement('p', { className: 'text-body mb-0' }, spaceData.Action)
        ),
        
        cardTypes.length > 0 && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Card Effects'),
            cardTypes.map(({ type, action }) => 
                React.createElement('div', 
                    { key: type, className: 'flex justify-between mb-2' },
                    React.createElement('span', { className: 'text-small' }, `${type}:`),
                    React.createElement('span', { className: 'text-small font-weight-medium' }, action)
                )
            )
        ),
        
        (spaceData.Time || spaceData.Fee) && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Costs'),
            spaceData.Time && React.createElement('div', 
                { className: 'flex justify-between mb-2' },
                React.createElement('span', { className: 'text-small' }, 'Time:'),
                React.createElement('span', { className: 'text-small font-weight-medium' }, `${spaceData.Time} days`)
            ),
            spaceData.Fee && React.createElement('div', 
                { className: 'flex justify-between mb-2' },
                React.createElement('span', { className: 'text-small' }, 'Fee:'),
                React.createElement('span', { className: 'text-small font-weight-medium' }, ComponentUtils.formatMoney(spaceData.Fee))
            )
        ),
        
        nextSpaces.length > 0 && React.createElement('div', 
            { className: 'card card--compact' },
            React.createElement('h4', { className: 'heading-5 mb-2' }, 'Next Moves'),
            React.createElement('div', 
                { className: 'flex flex-col gap-1' },
                nextSpaces.map(spaceName => 
                    React.createElement('div', 
                        { 
                            key: spaceName,
                            className: 'text-small'
                        },
                        `• ${spaceName}`
                    )
                )
            ),
            React.createElement('p', { 
                className: 'text-small mt-2', 
                style: { fontStyle: 'italic', color: '#666' } 
            }, 'Use the Action Panel to select and confirm moves')
        )
    );
}

// Export components
window.VisualBoard = VisualBoard;
window.BoardSpace = BoardSpace; 
window.SpaceDisplay = SpaceDisplay;