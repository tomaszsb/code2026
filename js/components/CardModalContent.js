/**
 * CardModalContent - Card content rendering component
 * Extracted from CardModal for better separation of concerns
 */

function CardModalContent({ selectedCard, cardFlipped }) {
    if (!selectedCard) {
        return null;
    }

    // Card back content (when flipped)
    if (cardFlipped) {
        return React.createElement('div', {
            key: 'card-back',
            style: {
                padding: '40px',
                textAlign: 'center',
                color: 'white',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
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
        ]);
    }

    // Card front content
    return React.createElement('div', {
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

            // Basic info section
            sections.push(React.createElement('div', {
                key: 'basic-info',
                style: {
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px'
                }
            }, [
                React.createElement('div', {
                    key: 'basic-title',
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#495057',
                        marginBottom: '10px',
                        textTransform: 'uppercase'
                    }
                }, 'Card Information'),
                
                ...(card.card_name ? [React.createElement('div', {
                    key: 'card-name',
                    style: { marginBottom: '8px' }
                }, [
                    React.createElement('strong', {key: 'name-label'}, 'Name: '),
                    React.createElement('span', {key: 'name-value'}, card.card_name)
                ])] : []),
                
                ...(card.description ? [React.createElement('div', {
                    key: 'description',
                    style: { marginBottom: '8px' }
                }, [
                    React.createElement('strong', {key: 'desc-label'}, 'Description: '),
                    React.createElement('span', {key: 'desc-value'}, card.description)
                ])] : [])
            ]));

            // Financial effects section
            if (card.loan_amount || card.investment_amount || card.money_effect) {
                sections.push(React.createElement('div', {
                    key: 'financial-section',
                    style: {
                        background: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'financial-title',
                        style: {
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#155724',
                            marginBottom: '10px',
                            textTransform: 'uppercase'
                        }
                    }, 'Financial Effects'),
                    
                    ...(card.loan_amount ? [React.createElement('div', {
                        key: 'loan-amount',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'loan-label'}, 'Loan Amount: '),
                        React.createElement('span', {key: 'loan-value'}, `$${parseInt(card.loan_amount).toLocaleString()}`)
                    ])] : []),
                    
                    ...(card.investment_amount ? [React.createElement('div', {
                        key: 'investment-amount',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'investment-label'}, 'Investment: '),
                        React.createElement('span', {key: 'investment-value'}, `$${parseInt(card.investment_amount).toLocaleString()}`)
                    ])] : []),
                    
                    ...(card.money_effect ? [React.createElement('div', {
                        key: 'money-effect',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'money-effect-label'}, 'Money Effect: '),
                        React.createElement('span', {key: 'money-effect-value'}, card.money_effect)
                    ])] : [])
                ]));
            }

            // Time effects section
            if (card.time_effect) {
                sections.push(React.createElement('div', {
                    key: 'time-section',
                    style: {
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'time-title',
                        style: {
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#856404',
                            marginBottom: '10px',
                            textTransform: 'uppercase'
                        }
                    }, 'Time Effects'),
                    
                    React.createElement('div', {
                        key: 'time-effect',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'time-effect-label'}, 'Time Effect: '),
                        React.createElement('span', {key: 'time-effect-value'}, card.time_effect)
                    ])
                ]));
            }

            // Restrictions section
            if (card.phase_restriction || card.space_restriction || card.scope_restriction) {
                sections.push(React.createElement('div', {
                    key: 'restrictions-section-full',
                    style: {
                        background: '#ffebee',
                        border: '1px solid #f44336',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '15px'
                    }
                }, [
                    React.createElement('div', {
                        key: 'restrictions-title-full',
                        style: {
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#d32f2f',
                            marginBottom: '10px',
                            textTransform: 'uppercase'
                        }
                    }, 'Usage Restrictions'),
                    
                    ...(card.phase_restriction ? [React.createElement('div', {
                        key: 'phase-restriction',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'phase-label'}, 'Phase: '),
                        React.createElement('span', {key: 'phase-value'}, card.phase_restriction)
                    ])] : []),
                    
                    ...(card.space_restriction ? [React.createElement('div', {
                        key: 'space-restriction-full',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'space-label'}, 'Space: '),
                        React.createElement('span', {key: 'space-value'}, card.space_restriction)
                    ])] : []),
                    
                    ...(card.scope_restriction ? [React.createElement('div', {
                        key: 'scope-restriction',
                        style: { marginBottom: '8px' }
                    }, [
                        React.createElement('strong', {key: 'scope-label'}, 'Scope: '),
                        React.createElement('span', {key: 'scope-value'}, card.scope_restriction)
                    ])] : [])
                ]));
            }

            return sections;
        }
    })());
}

// Export component
window.CardModalContent = CardModalContent;