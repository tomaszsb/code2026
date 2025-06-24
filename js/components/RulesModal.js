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
                rulesData.first?.event_description && React.createElement('div', {
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
                    }, rulesData.first.event_description)
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
                    rulesData.subsequent?.action && React.createElement('div', {
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
                                __html: rulesData.subsequent.action.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Card Types
                    rulesData.first?.action && React.createElement('div', {
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
                                __html: rulesData.first.action.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Movement Rules
                    rulesData.subsequent?.outcome && React.createElement('div', {
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
                                __html: rulesData.subsequent.outcome.replace(/\n/g, '<br>')
                            }
                        })
                    ]),

                    // Game Objective
                    rulesData.first?.outcome && React.createElement('div', {
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
                                __html: rulesData.first.outcome.replace(/\n/g, '<br>')
                            }
                        })
                    ])
                ])
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