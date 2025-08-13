/**
 * DiceResultModal - Displays dice roll results before effects are applied
 * Uses standard modal CSS classes for consistency
 */

function DiceResultModal({ 
    diceValue, 
    effects, 
    spaceName,
    visitType,
    onContinue 
}) {
    const { useEffect } = React;

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onContinue();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onContinue]);

    // Generate specific no-effect message based on CSV data
    const getSpecificNoEffectMessage = () => {
        if (!spaceName || !visitType || !diceValue || !window.CSVDatabase?.loaded) {
            return 'No effects from this dice roll';
        }

        try {
            // Query dice effects for this space/visit/roll combination
            const diceEffects = window.CSVDatabase.diceEffects.query({
                space_name: spaceName,
                visit_type: visitType
            });

            if (diceEffects.length === 0) {
                return 'No effects from this dice roll';
            }

            const specificMessages = [];
            
            // Check each effect type to see what was expected but resulted in no change
            diceEffects.forEach(effect => {
                const rollColumnKey = `roll_${diceValue}`;
                const rollResult = effect[rollColumnKey];

                if (rollResult === 'No change') {
                    if (effect.effect_type === 'cards') {
                        const cardTypeName = window.CardUtils?.getCardTypeConfig(effect.card_type)?.name || effect.card_type;
                        specificMessages.push(`No ${cardTypeName} card drawn`);
                    } else if (effect.effect_type === 'money') {
                        specificMessages.push('No fee applied');
                    } else if (effect.effect_type === 'time') {
                        specificMessages.push('No time change');
                    }
                } else if (rollResult === '0%' && effect.effect_type === 'money') {
                    specificMessages.push('No fee applied');
                } else if (rollResult === '0' && effect.effect_type === 'time') {
                    specificMessages.push('No time change');
                }
            });

            // Return specific messages or fallback
            if (specificMessages.length > 0) {
                return specificMessages.join(', ') + '.';
            } else {
                return 'No effects from this dice roll';
            }

        } catch (error) {
            console.error('Error generating specific no-effect message:', error);
            return 'No effects from this dice roll';
        }
    };

    // Format effects for display
    const formatEffects = () => {
        if (!effects) return [];

        const formattedEffects = [];

        if (effects.cards && effects.cardType) {
            const cardTypeName = window.CardUtils?.getCardTypeConfig(effects.cardType)?.name || effects.cardType;
            formattedEffects.push({
                icon: '📇',
                text: `${effects.cards} ${cardTypeName} card${effects.cards === 'Draw 1' ? '' : 's'}`
            });
        }

        if (effects.money) {
            const amount = Math.abs(parseInt(effects.money));
            const sign = parseInt(effects.money) > 0 ? '+' : '-';
            formattedEffects.push({
                icon: '💰',
                text: `${sign}$${amount}k money`
            });
        }

        if (effects.time) {
            const amount = Math.abs(parseInt(effects.time));
            const sign = parseInt(effects.time) > 0 ? '+' : '-';
            const unit = amount === 1 ? 'day' : 'days';
            formattedEffects.push({
                icon: '⏰',
                text: `${sign}${amount} ${unit}`
            });
        }

        if (effects.destination) {
            formattedEffects.push({
                icon: '📍',
                text: `Move to ${effects.destination}`
            });
        }

        return formattedEffects;
    };

    const effectsList = formatEffects();

    return React.createElement('div', {
        className: 'modal-overlay',
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                onContinue();
            }
        }
    }, React.createElement('div', {
        className: 'modal-content',
        onClick: (e) => e.stopPropagation(),
        style: {
            maxWidth: '500px',
            textAlign: 'center'
        }
    }, [
        // Close button
        React.createElement('button', {
            key: 'close-button',
            className: 'modal-close-button',
            onClick: onContinue
        }, '×'),

        // Title
        React.createElement('h2', {
            key: 'title',
            className: 'modal-title'
        }, `🎲 Dice Roll: ${diceValue}`),

        // Effects display
        effectsList.length > 0 ? React.createElement('div', {
            key: 'effects',
            style: {
                marginBottom: '24px'
            }
        }, [
            React.createElement('h3', {
                key: 'effects-title',
                style: {
                    fontSize: '18px',
                    marginBottom: '16px',
                    color: '#555'
                }
            }, 'Effects:'),

            React.createElement('div', {
                key: 'effects-list',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }
            }, effectsList.map((effect, index) => 
                React.createElement('div', {
                    key: index,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                    }
                }, [
                    React.createElement('span', {
                        key: 'icon',
                        style: { fontSize: '20px' }
                    }, effect.icon),
                    React.createElement('span', {
                        key: 'text',
                        style: { 
                            fontSize: '16px',
                            fontWeight: '500' 
                        }
                    }, effect.text)
                ])
            ))
        ]) : React.createElement('div', {
            key: 'no-effects',
            style: {
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                color: '#666'
            }
        }, getSpecificNoEffectMessage()),

        // Continue button
        React.createElement('button', {
            key: 'continue-button',
            className: 'btn btn--primary',
            onClick: onContinue,
            style: {
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold'
            }
        }, 'Continue & Apply Effects')
    ]));
}

// Make component available globally
window.DiceResultModal = DiceResultModal;