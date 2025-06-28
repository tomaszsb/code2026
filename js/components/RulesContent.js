/**
 * RulesContent - Rules modal content component
 * Extracted from RulesModal.js for better maintainability
 * Handles all the complex rules content rendering using CSS classes
 */

function RulesContent({ rulesData }) {
    try {
        if (!rulesData || (!rulesData.first && !rulesData.subsequent)) {
            return React.createElement('div', {
                className: 'text-center',
                style: { padding: '40px' }
            }, 'Loading game rules...');
        }

        // Defensive property access
        const first = rulesData.first || {};
        const subsequent = rulesData.subsequent || {};

    return React.createElement('div', null, [
        // Game Overview Section
        first?.Event && React.createElement('div', {
            key: 'intro',
            className: 'rules-section'
        }, [
            React.createElement('h3', {
                key: 'intro-title',
                className: 'rules-section-title'
            }, 'Game Overview'),
            React.createElement('p', {
                key: 'intro-text',
                className: 'rules-card-content'
            }, first.Event)
        ]),

        // Card Types Section
        React.createElement('div', {
            key: 'card-types-section',
            className: 'rules-section'
        }, [
            React.createElement('h3', {
                key: 'card-types-title',
                className: 'rules-section-title'
            }, 'Card Types & Resources'),
            React.createElement('div', {
                key: 'card-types-grid',
                className: 'rules-grid rules-grid--2-col'
            }, [
                // W Cards (Scope)
                first?.w_card && React.createElement('div', {
                    key: 'w-cards',
                    className: 'rules-card rules-card--work'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🔨 W Cards (Work/Scope)'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.w_card)
                ]),

                // B Cards (Bank)
                first?.b_card && React.createElement('div', {
                    key: 'b-cards',
                    className: 'rules-card rules-card--bank'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🏦 B Cards (Bank)'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.b_card)
                ]),

                // I Cards (Investor)
                first?.i_card && React.createElement('div', {
                    key: 'i-cards',
                    className: 'rules-card rules-card--investor'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '💰 I Cards (Investor)'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.i_card)
                ]),

                // L Cards (Life Events)
                first?.l_card && React.createElement('div', {
                    key: 'l-cards',
                    className: 'rules-card rules-card--life'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🎲 L Cards (Life Events)'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.l_card)
                ]),

                // E Cards (Expeditor)
                first?.e_card && React.createElement('div', {
                    key: 'e-cards',
                    className: 'rules-card rules-card--expeditor'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '⚡ E Cards (Expeditor)'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.e_card)
                ])
            ].filter(Boolean))
        ]),

        // Game Mechanics Section
        React.createElement('div', {
            key: 'game-mechanics-section',
            className: 'rules-section'
        }, [
            React.createElement('h3', {
                key: 'mechanics-title',
                className: 'rules-section-title'
            }, 'Game Mechanics'),
            React.createElement('div', {
                key: 'mechanics-grid',
                className: 'rules-grid rules-grid--2-col'
            }, [
                // Time Management
                first?.Time && React.createElement('div', {
                    key: 'time',
                    className: 'rules-card rules-card--time'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '⏰ Time Management'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.Time)
                ]),

                // Fee Management
                first?.Fee && React.createElement('div', {
                    key: 'fees',
                    className: 'rules-card rules-card--fee'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '💳 Fee Management'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, first.Fee)
                ])
            ].filter(Boolean))
        ]),

        // Movement Strategy Section
        first?.space_1 && React.createElement('div', {
            key: 'movement-strategy-section',
            className: 'rules-section'
        }, [
            React.createElement('h3', {
                key: 'movement-title',
                className: 'rules-section-title'
            }, 'Movement & Strategy'),
            React.createElement('div', {
                key: 'movement-content',
                className: 'rules-grid rules-grid--single'
            }, [
                React.createElement('div', {
                    key: 'movement-desc',
                    className: 'rules-card rules-card--movement'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🚶 Movement Options'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, `${first.space_1} ${first.space_2 || ''} ${first.space_3 || ''} ${first.space_4 || ''} ${first.space_5 || ''}`.trim())
                ]),
                
                // Negotiation
                first?.Negotiate && React.createElement('div', {
                    key: 'negotiation',
                    className: 'rules-card rules-card--negotiation'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🤝 Negotiation'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, subsequent?.space_5 || 'You can negotiate and try again if you don\'t like your options.')
                ])
            ].filter(Boolean))
        ]),

        // Additional Game Information Section  
        React.createElement('div', {
            key: 'additional-info-section',
            className: 'rules-section'
        }, [
            React.createElement('h3', {
                key: 'additional-title',
                className: 'rules-section-title'
            }, 'Additional Game Information'),
            React.createElement('div', {
                key: 'additional-grid',
                className: 'rules-grid rules-grid--2-col'
            }, [
                // Game Phases
                React.createElement('div', {
                    key: 'phases',
                    className: 'rules-card rules-card--work'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '📋 Game Phases'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, `This tutorial covers the ${first?.phase || 'SETUP'} phase. The game progresses through multiple project phases.`)
                ]),

                // Visit Types
                React.createElement('div', {
                    key: 'visit-types',
                    className: 'rules-card rules-card--time'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🔄 Visit Types'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, `Spaces have different content for First vs Subsequent visits. This guide shows ${first?.visit_type || 'First'} visit content.`)
                ]),

                // Dice Requirements
                first?.requires_dice_roll && React.createElement('div', {
                    key: 'dice-requirements',
                    className: 'rules-card rules-card--fee'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🎲 Dice Requirements'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, `Some spaces require dice rolls: ${first.requires_dice_roll}`)
                ]),

                // Path Information
                first?.path && React.createElement('div', {
                    key: 'path-info',
                    className: 'rules-card rules-card--expeditor'
                }, [
                    React.createElement('h5', {
                        key: 'title',
                        className: 'rules-card-title'
                    }, '🛤️ Path Type'),
                    React.createElement('p', {
                        key: 'content',
                        className: 'rules-card-content'
                    }, `This tutorial represents the ${first.path} path in the game.`)
                ])
            ].filter(Boolean))
        ]),

        // Legacy Content Sections (for compatibility)
        React.createElement('div', {
            key: 'rules-sections',
            className: 'rules-grid rules-grid--2-col'
        }, [
            // Phase Actions
            subsequent?.Action && React.createElement('div', {
                key: 'phase-actions',
                className: 'rules-card rules-card--work'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'rules-card-title'
                }, 'Phase Actions'),
                React.createElement('div', {
                    key: 'content',
                    className: 'rules-card-content',
                    dangerouslySetInnerHTML: {
                        __html: subsequent.Action.replace(/\n/g, '<br>')
                    }
                })
            ]),

            // Card Types
            first?.Action && React.createElement('div', {
                key: 'card-types',
                className: 'rules-card rules-card--expeditor'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'rules-card-title'
                }, 'Card Types'),
                React.createElement('div', {
                    key: 'content',
                    className: 'rules-card-content',
                    dangerouslySetInnerHTML: {
                        __html: first.Action.replace(/\n/g, '<br>')
                    }
                })
            ]),

            // Movement Rules
            subsequent?.Outcome && React.createElement('div', {
                key: 'movement',
                className: 'rules-card rules-card--time'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'rules-card-title'
                }, 'Movement & Dice'),
                React.createElement('div', {
                    key: 'content',
                    className: 'rules-card-content',
                    dangerouslySetInnerHTML: {
                        __html: subsequent.Outcome.replace(/\n/g, '<br>')
                    }
                })
            ]),

            // Game Objective
            first?.Outcome && React.createElement('div', {
                key: 'objective',
                className: 'rules-card rules-card--investor'
            }, [
                React.createElement('h4', {
                    key: 'title',
                    className: 'rules-card-title'
                }, 'Winning the Game'),
                React.createElement('div', {
                    key: 'content',
                    className: 'rules-card-content',
                    dangerouslySetInnerHTML: {
                        __html: first.Outcome.replace(/\n/g, '<br>')
                    }
                })
            ])
        ].filter(Boolean))
    ].filter(Boolean));
    } catch (error) {
        console.error('RulesContent: Error rendering component:', error);
        return React.createElement('div', {
            className: 'text-center error',
            style: { padding: '40px' }
        }, [
            React.createElement('h3', {
                key: 'error-title'
            }, 'Error Loading Rules'),
            React.createElement('p', {
                key: 'error-message'
            }, 'Unable to load game rules. Please try refreshing the page.')
        ]);
    }
}

// Export component
window.RulesContent = RulesContent;