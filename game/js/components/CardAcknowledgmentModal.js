/**
 * CardAcknowledgmentModal - Modal for acknowledging immediate cards
 * Shows cards that need user confirmation before processing
 */

function CardAcknowledgmentModal({ 
    isVisible, 
    card, 
    playerName, 
    onAcknowledge,
    gameStateManager 
}) {
    const { useEffect, useState } = React;
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isVisible) {
                onAcknowledge();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onAcknowledge]);

    // Handle card transitions when card changes
    useEffect(() => {
        if (isVisible && card) {
            setIsTransitioning(true);
            
            // Brief transition effect with smooth fade
            const transitionTimeout = setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
            
            return () => clearTimeout(transitionTimeout);
        }
    }, [card?.card_id, isVisible]);

    // Add entrance animation when modal becomes visible
    useEffect(() => {
        if (isVisible) {
            // Trigger entrance animation
            const entranceTimeout = setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
            
            return () => clearTimeout(entranceTimeout);
        }
    }, [isVisible]);

    // Handle card click (no flip needed with unified Card component)
    const handleCardClick = () => {
        // Card component handles its own interactions
    };

    if (!isVisible || !card) {
        return null;
    }

    // Get card type styling for modal border (keep minimal styling for modal frame)
    const getCardTypeStyle = (cardType) => {
        const styles = {
            W: { border: '#28a745' },
            B: { border: '#ffc107' },
            I: { border: '#17a2b8' },
            L: { border: '#dc3545' },
            E: { border: '#6c757d' }
        };
        return styles[cardType] || styles.E;
    };

    const cardStyle = getCardTypeStyle(card.card_type || card.cardType);


    return React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20000,
            opacity: isTransitioning ? 0.7 : 1,
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
        },
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                onAcknowledge();
            }
        }
    }, React.createElement('div', {
        style: {
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `4px solid ${cardStyle.border}`,
            transform: isTransitioning ? 'scale(0.9) translateY(-10px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
            opacity: isTransitioning ? 0.3 : 1
        }
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            style: {
                textAlign: 'center',
                marginBottom: '24px'
            }
        }, [
            React.createElement('h2', {
                key: 'title',
                style: {
                    margin: '0 0 8px 0',
                    color: '#333',
                    fontSize: '24px'
                }
            }, '🎴 Card Drawn'),
            React.createElement('p', {
                key: 'subtitle',
                style: {
                    margin: 0,
                    color: '#666',
                    fontSize: '16px'
                }
            }, `${playerName} drew a ${card.cardType} card`),
            React.createElement('p', {
                key: 'card-action',
                style: {
                    margin: '8px 0 0 0',
                    color: card.activation_timing === 'Immediate' ? '#d63384' : '#198754',
                    fontSize: '14px',
                    fontStyle: 'italic'
                }
            }, card.activation_timing === 'Immediate' 
                ? '⚡ Effects will be applied immediately'
                : '📋 Card will be added to your hand'
            )
        ]),

        // Unified Card Display
        React.createElement('div', {
            key: 'card-display',
            style: {
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
                padding: '16px'
            }
        }, React.createElement(window.Card, {
            card: card,
            size: 'large',
            onClick: handleCardClick,
            style: {
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
            }
        })),

        // Action Buttons
        React.createElement('div', {
            key: 'actions',
            style: {
                display: 'flex',
                justifyContent: 'center',
                gap: '16px'
            }
        }, [
            React.createElement('button', {
                key: 'acknowledge-btn',
                className: 'btn btn--success btn--lg',
                onClick: onAcknowledge,
                style: {
                    fontSize: '18px',
                    padding: '12px 32px',
                    minWidth: '150px',
                    background: cardStyle.border,
                    borderColor: cardStyle.border
                }
            }, card.activation_timing === 'Immediate' ? '⚡ Apply Effects' : '📋 Add to Hand')
        ])
    ]));
}

window.CardAcknowledgmentModal = CardAcknowledgmentModal;