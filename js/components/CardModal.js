/**
 * CardModal - Enhanced card display modal with flip animation
 * Refactored to use CardModalContent component for better separation of concerns
 */

function CardModal({ selectedCard, isVisible, onClose }) {
    const { useState } = React;
    const [cardFlipped, setCardFlipped] = useState(false);

    // Get card type styling
    const getCardTypeIcon = (cardType) => {
        return window.CardUtils.getCardIcon(cardType);
    };

    const getCardTypeColor = (cardType) => {
        return {
            bg: window.CardUtils.getCardBgColor(cardType),
            text: window.CardUtils.getCardColor(cardType)
        };
    };

    const flipCard = () => {
        setCardFlipped(prev => !prev);
    };

    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    // Reset flip state when modal opens/closes
    React.useEffect(() => {
        if (!isVisible) {
            setCardFlipped(false);
        }
    }, [isVisible]);

    if (!isVisible || !selectedCard) {
        return null;
    }

    const cardColors = getCardTypeColor(selectedCard.card_type);

    return React.createElement('div', {
        key: 'card-modal-overlay',
        className: 'card-modal-overlay',
        onClick: onClose,
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
        }
    }, [
        React.createElement('div', {
            key: 'card-modal-content',
            className: 'card-modal-content',
            onClick: handleModalClick,
            style: {
                background: 'white',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                transform: 'scale(1)',
                animation: 'modalSlideIn 0.3s ease-out'
            }
        }, [
            // Card container with flip animation
            React.createElement('div', {
                key: 'card-flip-container',
                style: {
                    perspective: '1000px',
                    cursor: 'pointer'
                },
                onClick: flipCard
            }, [
                React.createElement('div', {
                    key: 'card-inner',
                    style: {
                        position: 'relative',
                        width: '100%',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s',
                        transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        minHeight: '400px'
                    }
                }, [
                    // Card front
                    React.createElement('div', {
                        key: 'card-front',
                        style: {
                            position: 'absolute',
                            width: '100%',
                            backfaceVisibility: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }
                    }, [
                        // Header with card type and title
                        React.createElement('div', {
                            key: 'card-header',
                            style: {
                                background: cardColors.bg,
                                color: cardColors.text,
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                borderRadius: '20px 20px 0 0'
                            }
                        }, [
                            // Card type icon
                            React.createElement('div', {
                                key: 'card-icon',
                                style: {
                                    fontSize: '24px',
                                    flexShrink: 0
                                }
                            }, getCardTypeIcon(selectedCard.card_type)),
                            
                            // Card title
                            React.createElement('h3', {
                                key: 'card-title',
                                style: {
                                    margin: '0',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#212529',
                                    lineHeight: '1.3',
                                    textAlign: 'left'
                                }
                            }, selectedCard.card_name || 'Unknown Card')
                        ]),
                        
                        // Card content area - now uses CardModalContent component
                        React.createElement(CardModalContent, {
                            selectedCard,
                            cardFlipped: false
                        }),
                        
                        // Card footer
                        React.createElement('div', {
                            key: 'card-footer',
                            style: {
                                background: '#f8f9fa',
                                padding: '10px 20px',
                                borderTop: '1px solid #dee2e6',
                                fontSize: '11px',
                                color: '#6c757d',
                                textAlign: 'center'
                            }
                        }, [
                            React.createElement('div', { key: 'card-rarity' }, `${selectedCard.rarity || 'Common'} • ${selectedCard.work_type_restriction || 'General'}`),
                            React.createElement('div', { key: 'card-phase' }, `Phase: ${selectedCard.phase_restriction || 'Any'}`)
                        ])
                    ]),
                    
                    // Card back (when flipped)
                    React.createElement('div', {
                        key: 'card-back',
                        style: {
                            position: 'absolute',
                            width: '100%',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            borderRadius: '20px'
                        }
                    }, [
                        React.createElement(CardModalContent, {
                            selectedCard,
                            cardFlipped: true
                        })
                    ])
                ])
            ]),
            
            // Close button
            React.createElement('button', {
                key: 'close-btn',
                onClick: onClose,
                style: {
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#666',
                    transition: 'all 0.2s ease',
                    zIndex: 10
                },
                onMouseEnter: (e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.2)';
                },
                onMouseLeave: (e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.1)';
                }
            }, '×'),
            
            // CSS animations
            React.createElement('style', {
                key: 'modal-styles'
            }, `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes modalSlideIn {
                    from { 
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `)
        ])
    ]);
}

window.CardModal = CardModal;