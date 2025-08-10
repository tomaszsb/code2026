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
    const [isFlipped, setIsFlipped] = useState(false);
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
            setIsFlipped(false); // Reset flip state for new card
            
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

    // Handle card flip
    const handleCardClick = () => {
        setIsFlipped(prev => !prev);
    };

    if (!isVisible || !card) {
        return null;
    }

    // Get card type styling
    const getCardTypeStyle = (cardType) => {
        const styles = {
            W: { bg: '#e8f5e8', border: '#28a745', color: '#155724' },
            B: { bg: '#fff3cd', border: '#ffc107', color: '#856404' },
            I: { bg: '#d4edda', border: '#17a2b8', color: '#0c5460' },
            L: { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
            E: { bg: '#e2e3e5', border: '#6c757d', color: '#383d41' }
        };
        return styles[cardType] || styles.E;
    };

    const cardStyle = getCardTypeStyle(card.cardType);

    // Format card effects for display with improved styling
    const getCardEffects = () => {
        const effects = [];
        
        if (card.loan_amount) {
            const amount = parseInt(card.loan_amount).toLocaleString();
            effects.push({ 
                icon: '💰', 
                text: 'Loan: ', 
                amount: `$${amount}` 
            });
        }
        if (card.investment_amount) {
            const amount = parseInt(card.investment_amount).toLocaleString();
            effects.push({ 
                icon: '💎', 
                text: 'Investment: ', 
                amount: `$${amount}` 
            });
        }
        if (card.money_effect) {
            const amountVal = parseInt(card.money_effect);
            const amount = Math.abs(amountVal).toLocaleString();
            effects.push({ 
                icon: '💵', 
                text: `${amountVal > 0 ? 'Gain' : 'Spend'}: `, 
                amount: `$${amount}` 
            });
        }
        if (card.time_effect) {
            const timeVal = parseInt(card.time_effect);
            const time = Math.abs(timeVal);
            effects.push({ 
                icon: '⏰', 
                text: `${timeVal > 0 ? 'Spend' : 'Save'}: `, 
                amount: `${time} ${time === 1 ? 'day' : 'days'}` 
            });
        }
        if (card.work_cost) {
            const amount = parseInt(card.work_cost).toLocaleString();
            effects.push({ 
                icon: '🏗️', 
                text: 'Work Cost: ', 
                amount: `$${amount}` 
            });
        }

        return effects;
    };

    const cardEffects = getCardEffects();

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

        // Card Display with Flip Animation
        React.createElement('div', {
            key: 'card-display',
            style: {
                backgroundColor: cardStyle.bg,
                border: `3px solid ${cardStyle.border}`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                perspective: '1000px',
                minHeight: '300px',
                position: 'relative'
            },
            onClick: handleCardClick
        }, [
            // Card Front/Back Container
            React.createElement('div', {
                key: 'card-flip-container',
                style: {
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }
            }, [
                // Card Front
                React.createElement('div', {
                    key: 'card-front',
                    style: {
                        position: isFlipped ? 'absolute' : 'relative',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                    }
                }, [
                    // Card Type and Badge
                    React.createElement('div', {
                        key: 'card-type',
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'type-badge',
                            style: {
                                backgroundColor: cardStyle.border,
                                color: 'white',
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                marginRight: '12px'
                            }
                        }, card.cardType),
                        React.createElement('div', {
                            key: 'type-name',
                            style: {
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: cardStyle.color
                            }
                        }, `${card.cardType} Card`)
                    ]),

                    // Card Name
                    React.createElement('h3', {
                        key: 'card-name',
                        style: {
                            margin: '0 0 12px 0',
                            color: cardStyle.color,
                            fontSize: '20px',
                            fontWeight: '600'
                        }
                    }, card.card_name || 'Unknown Card'),

                    // Card Description
                    card.description && React.createElement('p', {
                        key: 'description',
                        style: {
                            margin: '0 0 16px 0',
                            color: cardStyle.color,
                            fontSize: '14px',
                            lineHeight: '1.5',
                            opacity: 0.9
                        }
                    }, card.description),

                    // Card Effects with improved styling
                    cardEffects.length > 0 && React.createElement('div', {
                        key: 'effects',
                        style: {
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '16px'
                        }
                    }, [
                        React.createElement('h4', {
                            key: 'effects-title',
                            style: {
                                margin: '0 0 8px 0',
                                color: cardStyle.color,
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }
                        }, 'Effects:'),
                        React.createElement('div', {
                            key: 'effects-list',
                            style: {
                                margin: 0
                            }
                        }, cardEffects.map((effect, index) =>
                            React.createElement('div', {
                                key: index,
                                style: {
                                    marginBottom: '6px',
                                    fontSize: '14px',
                                    color: cardStyle.color,
                                    display: 'flex',
                                    alignItems: 'center'
                                }
                            }, [
                                React.createElement('span', { key: 'icon' }, effect.icon + ' '),
                                React.createElement('span', { key: 'text' }, effect.text),
                                React.createElement('span', { 
                                    key: 'amount',
                                    style: { 
                                        fontWeight: 'bold',
                                        fontSize: '14px'
                                    }
                                }, effect.amount)
                            ])
                        ))
                    ])
                ]),

                // Card Back
                React.createElement('div', {
                    key: 'card-back',
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('img', {
                        key: 'logo',
                        src: 'graphics/My ChatGPT image.png',
                        alt: 'Unravel Logo',
                        style: {
                            maxWidth: '150px',
                            maxHeight: '150px',
                            opacity: 0.8
                        },
                        onError: (e) => {
                            e.target.style.display = 'none';
                        }
                    }),
                    React.createElement('div', {
                        key: 'logo-fallback',
                        style: {
                            fontSize: '48px',
                            color: cardStyle.color,
                            opacity: 0.6,
                            marginTop: '20px'
                        }
                    }, '🎴')
                ])
            ])
        ]),

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