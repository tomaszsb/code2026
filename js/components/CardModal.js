/**
 * CardModal - Enhanced card display modal with flip animation
 * Handles detailed card information display and interaction
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
        className: 'card-modal-overlay',
        onClick: onClose,
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
            zIndex: 9999
        }
    }, [
        React.createElement('div', {
            className: 'card-modal-content',
            onClick: handleModalClick,
            style: {
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }
        }, [
            React.createElement('button', {
                key: 'close-button',
                className: 'close-button',
                onClick: onClose,
                style: {
                    position: 'absolute',
                    top: '10px',
                    right: '15px',
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666'
                }
            }, '×'),
            
            React.createElement('div', {
                key: 'card-container',
                style: {
                    width: '400px',
                    height: '600px',
                    perspective: '1000px',
                    cursor: 'pointer'
                },
                onClick: flipCard
            }, [
                React.createElement('div', {
                    key: 'card-flip-inner',
                    style: {
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s ease-in-out'
                    }
                }, [
                    // Front side (card details)
                    React.createElement('div', {
                        key: 'card-front',
                        style: {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            background: `linear-gradient(135deg, ${cardColors.bg} 0%, ${cardColors.bg}dd 100%)`,
                            border: `3px solid ${cardColors.text}`,
                            borderRadius: '15px',
                            boxShadow: `0 8px 32px ${cardColors.text}33`,
                            overflow: 'hidden'
                        }
                    }, [
                        // Card header with type
                        React.createElement('div', {
                            key: 'card-header',
                            style: {
                                background: `linear-gradient(135deg, ${cardColors.text}, ${cardColors.text}dd)`,
                                color: 'white',
                                padding: '15px 20px',
                                textAlign: 'center',
                                borderBottom: `2px solid ${cardColors.text}`
                            }
                        }, [
                            React.createElement('div', {
                                key: 'card-type-title',
                                style: {
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    letterSpacing: '2px'
                                }
                            }, `${selectedCard.card_type} CARD`),
                            React.createElement('div', {
                                key: 'card-id',
                                style: {
                                    fontSize: '12px',
                                    opacity: 0.8,
                                    marginTop: '5px'
                                }
                            }, selectedCard.card_id)
                        ]),
                        
                        // Card name with small graphic on left
                        React.createElement('div', {
                            key: 'card-name-section',
                            style: {
                                padding: '20px',
                                borderBottom: '1px solid #dee2e6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }
                        }, [
                            // Small graphic on left
                            React.createElement('div', {
                                key: 'card-icon',
                                style: {
                                    width: '60px',
                                    height: '60px',
                                    background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #ced4da',
                                    color: '#6c757d',
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
                        
                        // Scrollable card content area
                        React.createElement('div', {
                            key: 'card-content-area',
                            style: {
                                padding: '20px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontSize: '13px'
                            }
                        }, (() => {
                            const card = selectedCard;
                            const isWCard = card.card_type === 'W';
                            
                            if (isWCard) {
                                // Simplified view for W cards
                                return [
                                    // Costs section
                                    React.createElement('div', {
                                        key: 'costs-section',
                                        style: {
                                            background: '#fff3cd',
                                            border: '1px solid #ffeaa7',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'costs-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#856404',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Costs & Requirements'),
                                        
                                        // Work Cost
                                        ...(card.work_cost ? [React.createElement('div', {
                                            key: 'work-cost',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'work-cost-label'}, 'Work Cost: '),
                                            React.createElement('span', {key: 'work-cost-value'}, `$${parseInt(card.work_cost).toLocaleString()}`)
                                        ])] : []),
                                        
                                        // Money Cost
                                        ...(card.money_cost ? [React.createElement('div', {
                                            key: 'money-cost',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'money-cost-label'}, 'Money Cost: '),
                                            React.createElement('span', {key: 'money-cost-value'}, card.money_cost)
                                        ])] : [])
                                    ]),
                                    
                                    // Restrictions section
                                    React.createElement('div', {
                                        key: 'restrictions-section',
                                        style: {
                                            background: '#ffebee',
                                            border: '1px solid #f44336',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'restrictions-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#d32f2f',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Restrictions & Limits'),
                                        
                                        // Work Type Restriction
                                        ...(card.work_type_restriction ? [React.createElement('div', {
                                            key: 'work-type',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'work-type-label'}, 'Work Type: '),
                                            React.createElement('span', {key: 'work-type-value'}, card.work_type_restriction)
                                        ])] : []),
                                        
                                        // Space Restriction
                                        ...(card.space_restriction ? [React.createElement('div', {
                                            key: 'space-restriction',
                                            style: { marginBottom: '8px' }
                                        }, [
                                            React.createElement('strong', {key: 'space-restriction-label'}, 'Space: '),
                                            React.createElement('span', {key: 'space-restriction-value'}, card.space_restriction)
                                        ])] : [])
                                    ])
                                ];
                            } else {
                                // Full information view for non-W cards (B, I, L, E)
                                const sections = [];
                                
                                // Description section
                                if (card.description) {
                                    sections.push(React.createElement('div', {
                                        key: 'description-section',
                                        style: {
                                            background: '#e3f2fd',
                                            border: '1px solid #2196f3',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'desc-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#1976d2',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Description'),
                                        React.createElement('div', {
                                            key: 'desc-text',
                                            style: { lineHeight: '1.4' }
                                        }, card.description)
                                    ]));
                                }
                                
                                // Effects section
                                const effects = [];
                                if (card.loan_amount) effects.push(['Loan Amount', `$${parseInt(card.loan_amount).toLocaleString()}`]);
                                if (card.loan_rate) effects.push(['Interest Rate', `${card.loan_rate}%`]);
                                if (card.money_effect) effects.push(['Money Effect', card.money_effect]);
                                if (card.money_cost) effects.push(['Money Cost', card.money_cost]);
                                if (card.time_effect) effects.push(['Time Effect', `${card.time_effect} days`]);
                                if (card.immediate_effect) effects.push(['Immediate Effect', card.immediate_effect]);
                                if (card.turn_effect) effects.push(['Turn Effect', card.turn_effect]);
                                if (card.investment_amount) effects.push(['Investment Amount', `$${parseInt(card.investment_amount).toLocaleString()}`]);
                                
                                if (effects.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'effects-section',
                                        style: {
                                            background: '#e8f5e8',
                                            border: '1px solid #4caf50',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'effects-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#388e3c',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Card Effects'),
                                        ...effects.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `effect-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: `effect-label-${index}`}, `${label}: `),
                                                React.createElement('span', {key: `effect-value-${index}`}, value)
                                            ])
                                        )
                                    ]));
                                }
                                
                                // Additional Information section
                                const additionalInfo = [];
                                if (card.flavor_text) additionalInfo.push(['Flavor Text', card.flavor_text]);
                                if (card.target) additionalInfo.push(['Target', card.target]);
                                if (card.scope) additionalInfo.push(['Scope', card.scope]);
                                if (card.duration) additionalInfo.push(['Duration', card.duration]);
                                if (card.activation_timing) additionalInfo.push(['Activation', card.activation_timing]);
                                if (card.phase_restriction) additionalInfo.push(['Phase Restriction', card.phase_restriction]);
                                if (card.space_restriction) additionalInfo.push(['Space Restriction', card.space_restriction]);
                                if (card.work_type_restriction) additionalInfo.push(['Work Type', card.work_type_restriction]);
                                
                                if (additionalInfo.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'additional-section',
                                        style: {
                                            background: '#fff3e0',
                                            border: '1px solid #ff9800',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'additional-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#f57c00',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Additional Information'),
                                        ...additionalInfo.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `info-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: `info-label-${index}`}, `${label}: `),
                                                React.createElement('span', {key: `info-value-${index}`}, value)
                                            ])
                                        )
                                    ]));
                                }
                                
                                // Usage & Stacking section
                                const usageInfo = [];
                                if (card.usage_limit) usageInfo.push(['Usage Limit', card.usage_limit]);
                                if (card.stacking_limit) usageInfo.push(['Stacking Limit', card.stacking_limit]);
                                if (card.cooldown) usageInfo.push(['Cooldown', card.cooldown]);
                                if (card.combo_requirement) usageInfo.push(['Combo Requirement', card.combo_requirement]);
                                if (card.prerequisite) usageInfo.push(['Prerequisite', card.prerequisite]);
                                
                                if (usageInfo.length > 0) {
                                    sections.push(React.createElement('div', {
                                        key: 'usage-section',
                                        style: {
                                            background: '#f3e5f5',
                                            border: '1px solid #9c27b0',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            marginBottom: '15px'
                                        }
                                    }, [
                                        React.createElement('div', {
                                            key: 'usage-title',
                                            style: {
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#7b1fa2',
                                                marginBottom: '10px',
                                                textTransform: 'uppercase'
                                            }
                                        }, 'Usage & Stacking Limits'),
                                        ...usageInfo.map(([label, value], index) => 
                                            React.createElement('div', {
                                                key: `usage-${index}`,
                                                style: { marginBottom: '8px' }
                                            }, [
                                                React.createElement('strong', {key: `usage-label-${index}`}, `${label}: `),
                                                React.createElement('span', {key: `usage-value-${index}`}, value)
                                            ])
                                        )
                                    ]));
                                }
                                
                                return sections;
                            }
                        })()),
                        
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

                    // Back side (Unravel logo)
                    React.createElement('div', {
                        key: 'card-back',
                        style: {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                            border: '3px solid #2c3e50',
                            borderRadius: '15px',
                            boxShadow: '0 8px 32px rgba(44, 62, 80, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            textAlign: 'center'
                        }
                    }, [
                        React.createElement('img', {
                            key: 'unravel-logo',
                            src: './graphics/My ChatGPT image.png',
                            alt: 'Unravel Logo',
                            style: {
                                maxWidth: '200px',
                                maxHeight: '200px',
                                marginBottom: '20px',
                                borderRadius: '10px'
                            },
                            onError: (e) => {
                                e.target.style.display = 'none';
                            }
                        }),
                        React.createElement('h3', {
                            key: 'unravel-title',
                            style: {
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '10px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }
                        }, 'UNRAVEL'),
                        React.createElement('p', {
                            key: 'game-subtitle',
                            style: {
                                fontSize: '14px',
                                opacity: 0.8,
                                fontStyle: 'italic'
                            }
                        }, 'Project Management Game'),
                        React.createElement('p', {
                            key: 'flip-instruction',
                            style: {
                                fontSize: '12px',
                                opacity: 0.6,
                                marginTop: '20px'
                            }
                        }, 'Click to flip back')
                    ])
                ])
            ])
        ])
    ]);
}

window.CardModal = CardModal;