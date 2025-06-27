/**
 * RulesModal - Complete rules display modal with CSV-driven content
 * Extracted from ActionPanel.js for better maintainability
 */

function RulesModal({ show, onClose }) {
    if (!show) return null;

    const getRulesData = () => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            return { first: null, subsequent: null };
        }
        
        const rulesSpaceFirst = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'First');
        const rulesSpaceSubsequent = window.CSVDatabase.spaces.find('START-QUICK-PLAY-GUIDE', 'Subsequent');
        
        return {
            first: rulesSpaceFirst,
            subsequent: rulesSpaceSubsequent
        };
    };

    const rulesData = getRulesData();

    return React.createElement('div', {
        className: 'rules-modal-overlay',
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
            zIndex: 10000
        }
    }, [
        React.createElement('div', {
            key: 'rules-modal-content',
            className: 'rules-modal-content',
            onClick: (e) => e.stopPropagation(),
            style: {
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '3px solid var(--primary-color)'
            }
        }, [
            React.createElement('button', {
                key: 'close-button',
                className: 'close-button',
                onClick: onClose,
                style: {
                    position: 'absolute',
                    top: '15px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#666',
                    fontWeight: 'bold'
                }
            }, '×'),

            React.createElement('h2', {
                key: 'title',
                style: {
                    color: '#4285f4',
                    textAlign: 'center',
                    marginBottom: '30px',
                    fontSize: '28px',
                    fontWeight: 'bold'
                }
            }, 'How to Play'),

            // Rules content
            rulesData && (rulesData.first || rulesData.subsequent) ? [
                rulesData.first?.Event && React.createElement('div', {
                    key: 'intro',
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef'
                    }
                }, [
                    React.createElement('h3', {
                        key: 'intro-title',
                        style: {
                            color: '#4285f4',
                            marginBottom: '15px',
                            fontSize: '20px'
                        }
                    }, 'Game Overview'),
                    React.createElement('p', {
                        key: 'intro-text',
                        style: {
                            fontSize: '16px',
                            lineHeight: '1.6',
                            margin: '0'
                        }
                    }, rulesData.first.Event)
                ]),

                // Card Types Section
                React.createElement('div', {
                    key: 'card-types-section',
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef'
                    }
                }, [
                    React.createElement('h3', {
                        key: 'card-types-title',
                        style: {
                            color: '#7b1fa2',
                            marginBottom: '20px',
                            fontSize: '20px'
                        }
                    }, 'Card Types & Resources'),
                    React.createElement('div', {
                        key: 'card-types-grid',
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '15px'
                        }
                    }, [
                        // W Cards (Scope)
                        rulesData.first?.w_card && React.createElement('div', {
                            key: 'w-cards',
                            style: {
                                backgroundColor: '#e3f2fd',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #1976d2'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#1976d2', marginBottom: '8px', fontSize: '16px' }
                            }, '🔨 W Cards (Work/Scope)'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.w_card)
                        ]),

                        // B Cards (Bank)
                        rulesData.first?.b_card && React.createElement('div', {
                            key: 'b-cards',
                            style: {
                                backgroundColor: '#e8f5e8',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #2e7d32'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#2e7d32', marginBottom: '8px', fontSize: '16px' }
                            }, '🏦 B Cards (Bank)'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.b_card)
                        ]),

                        // I Cards (Investor)
                        rulesData.first?.i_card && React.createElement('div', {
                            key: 'i-cards',
                            style: {
                                backgroundColor: '#fff3e0',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #f57c00'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#f57c00', marginBottom: '8px', fontSize: '16px' }
                            }, '💰 I Cards (Investor)'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.i_card)
                        ]),

                        // L Cards (Life Events)
                        rulesData.first?.l_card && React.createElement('div', {
                            key: 'l-cards',
                            style: {
                                backgroundColor: '#ffebee',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #d32f2f'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#d32f2f', marginBottom: '8px', fontSize: '16px' }
                            }, '🎲 L Cards (Life Events)'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.l_card)
                        ]),

                        // E Cards (Expeditor)
                        rulesData.first?.e_card && React.createElement('div', {
                            key: 'e-cards',
                            style: {
                                backgroundColor: '#f3e5f5',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #7b1fa2'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#7b1fa2', marginBottom: '8px', fontSize: '16px' }
                            }, '⚡ E Cards (Expeditor)'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.e_card)
                        ])
                    ])
                ]),

                // Game Mechanics Section
                React.createElement('div', {
                    key: 'game-mechanics-section',
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef'
                    }
                }, [
                    React.createElement('h3', {
                        key: 'mechanics-title',
                        style: {
                            color: '#4285f4',
                            marginBottom: '20px',
                            fontSize: '20px'
                        }
                    }, 'Game Mechanics'),
                    React.createElement('div', {
                        key: 'mechanics-grid',
                        style: {
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '15px'
                        }
                    }, [
                        // Time Management
                        rulesData.first?.Time && React.createElement('div', {
                            key: 'time',
                            style: {
                                backgroundColor: '#e8f5e8',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #2e7d32'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#2e7d32', marginBottom: '8px', fontSize: '16px' }
                            }, '⏰ Time Management'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.Time)
                        ]),

                        // Fee Management
                        rulesData.first?.Fee && React.createElement('div', {
                            key: 'fees',
                            style: {
                                backgroundColor: '#fff3e0',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #f57c00'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#f57c00', marginBottom: '8px', fontSize: '16px' }
                            }, '💳 Fee Management'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.first.Fee)
                        ])
                    ])
                ]),

                // Movement Strategy Section
                rulesData.first?.space_1 && React.createElement('div', {
                    key: 'movement-strategy-section',
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef'
                    }
                }, [
                    React.createElement('h3', {
                        key: 'movement-title',
                        style: {
                            color: '#7b1fa2',
                            marginBottom: '20px',
                            fontSize: '20px'
                        }
                    }, 'Movement & Strategy'),
                    React.createElement('div', {
                        key: 'movement-content',
                        style: {
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '15px'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'movement-desc',
                            style: {
                                backgroundColor: '#e3f2fd',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #1976d2'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#1976d2', marginBottom: '8px', fontSize: '16px' }
                            }, '🚶 Movement Options'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `${rulesData.first.space_1} ${rulesData.first.space_2 || ''} ${rulesData.first.space_3 || ''} ${rulesData.first.space_4 || ''} ${rulesData.first.space_5 || ''}`.trim())
                        ]),
                        
                        // Negotiation
                        rulesData.first?.Negotiate && React.createElement('div', {
                            key: 'negotiation',
                            style: {
                                backgroundColor: '#ffebee',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #d32f2f'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#d32f2f', marginBottom: '8px', fontSize: '16px' }
                            }, '🤝 Negotiation'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, rulesData.subsequent?.space_5 || 'You can negotiate and try again if you don\'t like your options.')
                        ])
                    ])
                ]),

                // Additional Game Information Section  
                React.createElement('div', {
                    key: 'additional-info-section',
                    style: {
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px solid #e9ecef'
                    }
                }, [
                    React.createElement('h3', {
                        key: 'additional-title',
                        style: {
                            color: '#6a1b9a',
                            marginBottom: '20px',
                            fontSize: '20px'
                        }
                    }, 'Additional Game Information'),
                    React.createElement('div', {
                        key: 'additional-grid',
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '15px'
                        }
                    }, [
                        // Game Phases
                        React.createElement('div', {
                            key: 'phases',
                            style: {
                                backgroundColor: '#e8eaf6',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #5c6bc0'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#5c6bc0', marginBottom: '8px', fontSize: '16px' }
                            }, '📋 Game Phases'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `This tutorial covers the ${rulesData.first?.phase || 'SETUP'} phase. The game progresses through multiple project phases.`)
                        ]),

                        // Visit Types
                        React.createElement('div', {
                            key: 'visit-types',
                            style: {
                                backgroundColor: '#e0f2f1',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #26a69a'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#26a69a', marginBottom: '8px', fontSize: '16px' }
                            }, '🔄 Visit Types'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `Spaces have different content for First vs Subsequent visits. This guide shows ${rulesData.first?.visit_type || 'First'} visit content.`)
                        ]),

                        // Dice Requirements
                        rulesData.first?.requires_dice_roll && React.createElement('div', {
                            key: 'dice-requirements',
                            style: {
                                backgroundColor: '#fff8e1',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #ffb74d'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#fb8c00', marginBottom: '8px', fontSize: '16px' }
                            }, '🎲 Dice Requirements'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `Some spaces require dice rolls: ${rulesData.first.requires_dice_roll}`)
                        ]),

                        // Path Information
                        rulesData.first?.path && React.createElement('div', {
                            key: 'path-info',
                            style: {
                                backgroundColor: '#fce4ec',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #f48fb1'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#e91e63', marginBottom: '8px', fontSize: '16px' }
                            }, '🛤️ Path Type'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `This tutorial represents the ${rulesData.first.path} path in the game.`)
                        ]),

                        // Dice Rolls
                        rulesData.first?.rolls && React.createElement('div', {
                            key: 'dice-rolls',
                            style: {
                                backgroundColor: '#f3e5f5',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '2px solid #ba68c8'
                            }
                        }, [
                            React.createElement('h5', {
                                key: 'title',
                                style: { color: '#8e24aa', marginBottom: '8px', fontSize: '16px' }
                            }, '🎯 Dice Rolls'),
                            React.createElement('p', {
                                key: 'content',
                                style: { fontSize: '14px', lineHeight: '1.4', margin: '0' }
                            }, `Dice roll information: ${rulesData.first.rolls}`)
                        ])
                    ])
                ]),

                React.createElement('div', {
                    key: 'rules-sections',
                    style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '20px'
                    }
                }, [
                    // Phase Actions
                    rulesData.subsequent?.Action && React.createElement('div', {
                        key: 'phase-actions',
                        style: {
                            backgroundColor: '#e3f2fd',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '2px solid #bbdefb'
                        }
                    }, [
                        React.createElement('h4', {
                            key: 'title',
                            style: {
                                color: '#1976d2',
                                marginBottom: '15px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }
                        }, 'Phase Actions'),
                        React.createElement('div', {
                            key: 'content',
                            style: { fontSize: '14px', lineHeight: '1.5' },
                            dangerouslySetInnerHTML: {
                                __html: rulesData.subsequent.Action.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Card Types
                    rulesData.first?.Action && React.createElement('div', {
                        key: 'card-types',
                        style: {
                            backgroundColor: '#f3e5f5',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '2px solid #e1bee7'
                        }
                    }, [
                        React.createElement('h4', {
                            key: 'title',
                            style: {
                                color: '#7b1fa2',
                                marginBottom: '15px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }
                        }, 'Card Types'),
                        React.createElement('div', {
                            key: 'content',
                            style: { fontSize: '14px', lineHeight: '1.5' },
                            dangerouslySetInnerHTML: {
                                __html: rulesData.first.Action.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Movement Rules
                    rulesData.subsequent?.Outcome && React.createElement('div', {
                        key: 'movement',
                        style: {
                            backgroundColor: '#e8f5e8',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '2px solid #c8e6c9'
                        }
                    }, [
                        React.createElement('h4', {
                            key: 'title',
                            style: {
                                color: '#2e7d32',
                                marginBottom: '15px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }
                        }, 'Movement & Dice'),
                        React.createElement('div', {
                            key: 'content',
                            style: { fontSize: '14px', lineHeight: '1.5' },
                            dangerouslySetInnerHTML: {
                                __html: rulesData.subsequent.Outcome.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Game Objective
                    rulesData.first?.Outcome && React.createElement('div', {
                        key: 'objective',
                        style: {
                            backgroundColor: '#fff3e0',
                            padding: '20px',
                            borderRadius: '10px',
                            border: '2px solid #ffcc02'
                        }
                    }, [
                        React.createElement('h4', {
                            key: 'title',
                            style: {
                                color: '#ef6c00',
                                marginBottom: '15px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }
                        }, 'Winning the Game'),
                        React.createElement('div', {
                            key: 'content',
                            style: { fontSize: '14px', lineHeight: '1.5' },
                            dangerouslySetInnerHTML: {
                                __html: rulesData.first.Outcome.replace(/\n/g, '<br>')
                            }
                        })
                    ])
                ].filter(Boolean))
            ] : React.createElement('div', {
                key: 'loading',
                style: {
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '16px',
                    padding: '40px'
                }
            }, 'Loading game rules...')
        ])
    ]);
}

// Export component
window.RulesModal = RulesModal;