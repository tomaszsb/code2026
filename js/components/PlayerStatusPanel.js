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

    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    // Debug logging for current player
    useEffect(() => {
        if (currentPlayer) {
            console.log('PlayerStatusPanel: Current player:', currentPlayer);
            console.log('PlayerStatusPanel: Current player cards:', currentPlayer.cards);
        }
    }, [currentPlayer]);
    
    

    const handleCardSelect = (card) => {
        console.log('PlayerStatusPanel: Card clicked:', card);
        setPanelState(prev => ({
            ...prev,
            selectedCard: card,
            showCardDetails: true
        }));
        console.log('PlayerStatusPanel: Card modal should now be visible');
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
            currentPlayerIndex: gameState.currentPlayer,
            totalPlayers: gameState.players.length
        })] : []),

        // Current Space Info
        ...(window.CurrentSpaceInfo ? [React.createElement(CurrentSpaceInfo, {
            key: 'space-info',
            player: currentPlayer,
            debugMode: debugMode
        })] : []),

        // Player Resources
        ...(window.PlayerResources ? [React.createElement(PlayerResources, {
            key: 'resources',
            player: currentPlayer
        })] : []),

        // Cards in Hand
        ...(window.CardsInHand ? [React.createElement(CardsInHand, {
            key: 'cards-section',
            player: currentPlayer,
            onCardSelect: handleCardSelect,
            cardsExpanded: panelState.cardsExpanded,
            onToggleExpanded: toggleCardsExpanded
        })] : []),

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