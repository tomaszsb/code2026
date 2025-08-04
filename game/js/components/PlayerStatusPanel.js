/**
 * PlayerStatusPanel - Enhanced player status display
 * Shows current player info, space details, and cards in hand
 */

function PlayerStatusPanel({ debugMode = false }) {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [panelState, setPanelState] = useState({
        showCardDetails: false,
        selectedCard: null,
        cardsExpanded: true
    });

    const currentPlayer = gameState.players?.find(p => p.id === gameState.currentPlayer);
    console.log('RENDER CHECK: PlayerStatusPanel. Player has ' + (currentPlayer?.cards?.W?.length || 0) + ' W cards.');
    
    // Debug logging for current player
    useEffect(() => {
        if (currentPlayer) {
        }
    }, [currentPlayer]);
    
    

    const handleCardSelect = (card) => {
        setPanelState(prev => ({
            ...prev,
            selectedCard: card,
            showCardDetails: true
        }));
    };

    const closeCardDetails = () => {
        setPanelState(prev => ({
            ...prev,
            selectedCard: null,
            showCardDetails: false
        }));
    };

    const toggleCardsExpanded = () => {
        setPanelState(prev => ({
            ...prev,
            cardsExpanded: !prev.cardsExpanded
        }));
    };

    if (!currentPlayer) {
        return React.createElement('div', {
            className: 'player-status-panel'
        }, [
            React.createElement('p', {
                key: 'no-player',
                className: 'no-player-message'
            }, 'No active player')
        ]);
    }

    return React.createElement('div', {
        className: 'player-status-panel'
    }, [
        // Player Header
        ...(window.PlayerHeader ? [React.createElement(PlayerHeader, {
            key: 'player-header',
            player: currentPlayer,
            turnCount: gameState.turnCount
        })] : []),
        
        // Player Resources
        ...(window.PlayerResources ? [React.createElement(PlayerResources, {
            key: 'resources',
            onCardSelect: handleCardSelect,
            cardsExpanded: panelState.cardsExpanded,
            onToggleExpanded: toggleCardsExpanded
        })] : []),
        
        // Current Space and Actions - One coherent container like Resources
        React.createElement('div', {
            key: 'space-actions-main-container',
            style: {
                backgroundColor: '#e8f5e8',
                backgroundImage: 'linear-gradient(135deg, #e8f5e8 0%, #d4edd5 100%)',
                border: '1px solid #c8e6c8',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px'
            }
        }, [
            React.createElement('h4', {
                key: 'space-actions-title',
                className: 'section-title'
            }, '🎮 Current Space & Actions'),
            
            React.createElement('div', {
                key: 'space-actions-grid',
                className: 'resource-grid'
            }, [
                // Left column: Current Space Info (minimal styling for unified container)
                window.CurrentSpaceInfo ? React.createElement(CurrentSpaceInfo, {
                    key: 'space-info',
                    player: currentPlayer,
                    debugMode: debugMode,
                    isInUnifiedContainer: true
                }) : React.createElement('div', { className: 'panel-placeholder' }, 'Space Info Loading...'),
                
                // Right column: Action Panel (minimal styling for unified container)
                window.ActionPanel ? React.createElement(window.ActionPanel, {
                    key: 'action-panel',
                    isInUnifiedContainer: true
                }) : React.createElement('div', { className: 'panel-placeholder' }, 'Actions Loading...')
            ])
        ]),

        // Action Panel removed - now handled by right panel in FixedApp

        // Card Details Modal
        ...(window.CardModal ? [React.createElement(CardModal, {
            key: 'card-modal',
            selectedCard: panelState.selectedCard,
            isVisible: panelState.showCardDetails,
            onClose: closeCardDetails
        })] : [])
    ]);
}

window.PlayerStatusPanel = PlayerStatusPanel;