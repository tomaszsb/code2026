/**
 * GamePanelLayout - Modern responsive panel system
 * Brings back the three-panel functionality with modern UX
 */

function GamePanelLayout() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [layoutState, setLayoutState] = useState({
        leftPanelExpanded: true,
        rightPanelExpanded: true,
        bottomPanelExpanded: true,
        activeTab: 'status', // status, actions, results
        isMobile: window.innerWidth < 768
    });

    // Handle responsive layout
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            setLayoutState(prev => ({
                ...prev,
                isMobile,
                leftPanelExpanded: !isMobile,
                rightPanelExpanded: !isMobile
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const togglePanel = (panel) => {
        setLayoutState(prev => ({
            ...prev,
            [`${panel}PanelExpanded`]: !prev[`${panel}PanelExpanded`]
        }));
    };

    const setActiveTab = (tab) => {
        setLayoutState(prev => ({ ...prev, activeTab: tab }));
    };

    // Only show panels when players are set up
    if (!gameState.players || gameState.players.length === 0) {
        return null;
    }

    return React.createElement('div', {
        className: `game-panel-layout ${layoutState.isMobile ? 'mobile' : 'desktop'}`
    }, [
        // Main game board area - CENTER AREA (Game Board)
        React.createElement('div', {
            key: 'main-board',
            className: 'main-board-area',
            'data-panel-name': 'center-board'
        }, [
            window.GameBoard ? React.createElement(GameBoard, {
                key: 'game-board'
            }) : React.createElement('div', {
                key: 'board-loading',
                className: 'board-loading'
            }, 'Loading game board...')
        ]),

        // Mobile: Tabbed bottom panel - MOBILE TABS AREA
        layoutState.isMobile ? React.createElement('div', {
            key: 'mobile-panels',
            className: `mobile-panel-container ${layoutState.bottomPanelExpanded ? 'expanded' : 'collapsed'}`,
            'data-panel-name': 'mobile-tabs'
        }, [
            // Tab navigation
            React.createElement('div', {
                key: 'tab-nav',
                className: 'tab-navigation'
            }, [
                React.createElement('button', {
                    key: 'toggle',
                    className: 'panel-toggle',
                    onClick: () => togglePanel('bottom'),
                    'aria-label': 'Toggle game panels'
                }, layoutState.bottomPanelExpanded ? '▼' : '▲'),
                
                React.createElement('div', {
                    key: 'tabs',
                    className: 'tab-buttons'
                }, [
                    React.createElement('button', {
                        key: 'status-tab',
                        className: `tab-button ${layoutState.activeTab === 'status' ? 'active' : ''}`,
                        onClick: () => setActiveTab('status')
                    }, '👤 Status'),
                    React.createElement('button', {
                        key: 'actions-tab',
                        className: `tab-button ${layoutState.activeTab === 'actions' ? 'active' : ''}`,
                        onClick: () => setActiveTab('actions')
                    }, '🎯 Actions'),
                    React.createElement('button', {
                        key: 'results-tab',
                        className: `tab-button ${layoutState.activeTab === 'results' ? 'active' : ''}`,
                        onClick: () => setActiveTab('results')
                    }, '📊 Results')
                ])
            ]),

            // Tab content
            layoutState.bottomPanelExpanded && React.createElement('div', {
                key: 'tab-content',
                className: 'tab-content'
            }, [
                layoutState.activeTab === 'status' && (window.PlayerStatusPanel ? 
                    React.createElement(PlayerStatusPanel, {
                        key: 'status-panel'
                    }) : React.createElement('div', {key: 'status-loading'}, 'Loading status...')
                ),
                layoutState.activeTab === 'actions' && (window.ActionPanel ?
                    React.createElement(ActionPanel, {
                        key: 'action-panel'
                    }) : React.createElement('div', {key: 'action-loading'}, 'Loading actions...')
                ),
                layoutState.activeTab === 'results' && (window.ResultsPanel ?
                    React.createElement(ResultsPanel, {
                        key: 'results-panel'
                    }) : React.createElement('div', {key: 'results-loading'}, 'Loading results...')
                )
            ])
        ]) : [
            // Desktop: Side panels - LEFT PANEL (Player Status)
            React.createElement('div', {
                key: 'left-panel',
                className: `side-panel left-panel ${layoutState.leftPanelExpanded ? 'expanded' : 'collapsed'}`,
                'data-panel-name': 'left-status'
            }, [
                React.createElement('button', {
                    key: 'toggle',
                    className: 'panel-toggle',
                    onClick: () => togglePanel('left'),
                    'aria-label': 'Toggle player status panel'
                }, layoutState.leftPanelExpanded ? '◀' : '▶'),
                
                layoutState.leftPanelExpanded && (window.PlayerStatusPanel ?
                    React.createElement(PlayerStatusPanel, {
                        key: 'status-panel'
                    }) : React.createElement('div', {key: 'status-loading'}, 'Loading status...')
                )
            ]),

            // RIGHT PANEL (Results & Space Explorer)
            React.createElement('div', {
                key: 'right-panel',
                className: `side-panel right-panel ${layoutState.rightPanelExpanded ? 'expanded' : 'collapsed'}`,
                'data-panel-name': 'right-results'
            }, [
                React.createElement('button', {
                    key: 'toggle',
                    className: 'panel-toggle',
                    onClick: () => togglePanel('right'),
                    'aria-label': 'Toggle results panel'
                }, layoutState.rightPanelExpanded ? '▶' : '◀'),
                
                layoutState.rightPanelExpanded && (window.ResultsPanel ?
                    React.createElement(ResultsPanel, {
                        key: 'results-panel'
                    }) : React.createElement('div', {key: 'results-loading'}, 'Loading results...')
                )
            ]),

            // BOTTOM PANEL REMOVED - Actions now integrated into left panel
        ]
    ]);
}

window.GamePanelLayout = GamePanelLayout;