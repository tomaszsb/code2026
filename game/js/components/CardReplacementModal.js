/**
 * CardReplacementModal - Modal for selecting cards to replace
 * Allows player to choose which specific cards to replace when using "Replace X" actions
 */

function CardReplacementModal({ gameStateManager }) {
    const { useState, useEffect } = React;
    const [show, setShow] = useState(false);
    const [cardType, setCardType] = useState('');
    const [amount, setAmount] = useState(1);
    const [playerCards, setPlayerCards] = useState({});
    const [playerName, setPlayerName] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [selectedCards, setSelectedCards] = useState([]);

    // Event listener for showing the replacement modal
    useEventListener('showCardReplacementModal', ({ 
        playerId: eventPlayerId, 
        cardType: eventCardType, 
        amount: eventAmount, 
        playerCards: eventPlayerCards, 
        playerName: eventPlayerName 
    }) => {
        console.log('CardReplacementModal: Received showCardReplacement event:', {
            playerId: eventPlayerId,
            cardType: eventCardType,
            amount: eventAmount,
            playerCards: eventPlayerCards,
            playerName: eventPlayerName
        });
        setShow(true);
        setCardType(eventCardType);
        setAmount(eventAmount);
        setPlayerCards(eventPlayerCards);
        setPlayerName(eventPlayerName);
        setPlayerId(eventPlayerId);
        setSelectedCards([]);
    });

    // Reset selection when modal opens
    useEffect(() => {
        if (show) {
            setSelectedCards([]);
        }
    }, [show]);

    if (!show) return null;

    // Defensive checks for undefined data
    if (!playerCards || !cardType) {
        return null;
    }

    const availableCards = playerCards[cardType] || [];
    const cardConfig = window.CardUtils ? window.CardUtils.getCardTypeConfig(cardType) : { name: cardType, icon: '🎴' };
    
    // Don't show modal if no cards available (shouldn't happen after fix, but safety check)
    if (availableCards.length === 0) {
        return React.createElement('div', {
            className: 'modal-overlay card-replacement-modal',
            onClick: handleCancel
        }, [
            React.createElement('div', {
                key: 'modal-content',
                className: 'modal-content card-replacement-content'
            }, [
                React.createElement('div', {
                    key: 'modal-header',
                    className: 'modal-header'
                }, [
                    React.createElement('h3', {
                        key: 'title',
                        className: 'modal-title'
                    }, `${cardConfig.icon} No ${cardConfig.name} Cards`),
                    React.createElement('button', {
                        key: 'close-btn',
                        className: 'modal-close-btn',
                        onClick: handleCancel,
                        'aria-label': 'Close'
                    }, '×')
                ]),
                React.createElement('div', {
                    key: 'modal-body',
                    className: 'modal-body'
                }, [
                    React.createElement('p', {
                        key: 'no-cards-message'
                    }, `${playerName} has no ${cardConfig.name} cards to replace. Drawing cards first...`)
                ]),
                React.createElement('div', {
                    key: 'modal-footer',
                    className: 'modal-footer'
                }, [
                    React.createElement('button', {
                        key: 'close-btn',
                        className: 'btn btn--primary',
                        onClick: handleCancel
                    }, 'Close')
                ])
            ])
        ]);
    }

    const handleCardToggle = (cardIndex) => {
        setSelectedCards(prev => {
            const newSelection = [...prev];
            const existingIndex = newSelection.indexOf(cardIndex);
            
            if (existingIndex >= 0) {
                // Remove from selection
                newSelection.splice(existingIndex, 1);
            } else if (newSelection.length < amount) {
                // Add to selection if not at limit
                newSelection.push(cardIndex);
            }
            
            return newSelection;
        });
    };

    const handleConfirm = () => {
        if (selectedCards.length === amount && gameStateManager) {
            // Get the actual card objects that were selected
            const cardsToReplace = selectedCards.map(index => playerCards[cardType][index]);
            
            // Emit the card replacement confirmation event
            gameStateManager.emit('cardReplacementConfirmed', {
                playerId: playerId,
                cardType: cardType,
                amount: amount,
                cardsToReplace: cardsToReplace,
                selectedIndices: selectedCards
            });
            
            // Close the modal
            setShow(false);
            setSelectedCards([]);
        }
    };

    const handleCancel = () => {
        setSelectedCards([]);
        setShow(false);
    };

    return React.createElement('div', {
        className: 'modal-overlay card-replacement-modal',
        onClick: (e) => {
            if (e.target.className.includes('modal-overlay')) {
                handleCancel();
            }
        }
    }, [
        React.createElement('div', {
            key: 'modal-content',
            className: 'modal-content card-replacement-content'
        }, [
            React.createElement('div', {
                key: 'modal-header',
                className: 'modal-header'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'modal-title'
                }, `${cardConfig.icon} Replace ${amount} ${cardConfig.name} Card${amount > 1 ? 's' : ''}`),
                React.createElement('button', {
                    key: 'close-btn',
                    className: 'modal-close-btn',
                    onClick: handleCancel,
                    'aria-label': 'Close'
                }, '×')
            ]),

            React.createElement('div', {
                key: 'modal-body',
                className: 'modal-body'
            }, [
                React.createElement('p', {
                    key: 'instructions',
                    className: 'replacement-instructions'
                }, `${playerName}, select ${amount} card${amount > 1 ? 's' : ''} to replace:`),

                React.createElement('div', {
                    key: 'selection-count',
                    className: 'selection-count'
                }, `Selected: ${selectedCards.length}/${amount}`),

                React.createElement('div', {
                    key: 'card-grid',
                    className: 'card-replacement-grid'
                }, availableCards.map((card, index) => {
                    const isSelected = selectedCards.includes(index);
                    const isDisabled = !isSelected && selectedCards.length >= amount;

                    return React.createElement('div', {
                        key: `card-${index}`,
                        className: `card-replacement-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`,
                        onClick: () => !isDisabled && handleCardToggle(index)
                    }, [
                        React.createElement('div', {
                            key: 'card-header',
                            className: 'card-header'
                        }, [
                            React.createElement('span', {
                                key: 'card-type',
                                className: 'card-type'
                            }, cardConfig.icon),
                            React.createElement('span', {
                                key: 'card-name',
                                className: 'card-name'
                            }, card.card_name || `${cardConfig.name} Card`)
                        ]),

                        card.description && React.createElement('div', {
                            key: 'card-description',
                            className: 'card-description'
                        }, card.description),

                        window.CardUtils && React.createElement('div', {
                            key: 'card-value',
                            className: 'card-value'
                        }, window.CardUtils.formatCardValue(card)),

                        isSelected && React.createElement('div', {
                            key: 'selected-indicator',
                            className: 'selected-indicator'
                        }, '✓ Selected')
                    ]);
                }))
            ]),

            React.createElement('div', {
                key: 'modal-footer',
                className: 'modal-footer'
            }, [
                React.createElement('button', {
                    key: 'cancel-btn',
                    className: 'btn btn--secondary',
                    onClick: handleCancel
                }, 'Cancel'),
                React.createElement('button', {
                    key: 'confirm-btn',
                    className: `btn btn--primary ${selectedCards.length !== amount ? 'btn--disabled' : ''}`,
                    onClick: handleConfirm,
                    disabled: selectedCards.length !== amount
                }, `Replace ${selectedCards.length}/${amount} Card${amount > 1 ? 's' : ''}`)
            ])
        ])
    ]);
}

// Make component available globally
window.CardReplacementModal = CardReplacementModal;