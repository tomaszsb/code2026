/**
 * CardModalContent - Comprehensive card content rendering component
 * Major refactor: Unified effect-rendering system with phase restrictions
 */

function CardModalContent({ selectedCard, cardFlipped }) {

    // ===============================
    // UNIFIED EFFECT-RENDERING SYSTEM
    // ===============================

    /**
     * Comprehensive effect parser - analyzes all effect-related fields
     * Returns structured effect objects grouped by category
     */
    const parseCardEffects = (card) => {
        const effects = [];

        // Helper function to check if field has meaningful value
        const hasValue = (value) => {
            return value && value !== '' && value !== '0' && value.toString().toLowerCase() !== 'null';
        };

        // Helper function to format monetary values
        const formatMoney = (value) => {
            const num = parseInt(value);
            return isNaN(num) ? value : `$${num.toLocaleString()}`;
        };

        // TIME EFFECTS
        if (hasValue(card.time_effect)) {
            effects.push({
                category: 'Time Effects',
                type: 'time_effect',
                label: 'Time Effect',
                value: card.time_effect,
                icon: '⏱️'
            });
        }
        
        if (hasValue(card.tick_modifier)) {
            const tickValue = parseInt(card.tick_modifier);
            const tickText = tickValue > 0 ? `+${tickValue} ticks` : `${tickValue} ticks`;
            effects.push({
                category: 'Time Effects',
                type: 'tick_modifier', 
                label: 'Tick Modifier',
                value: tickText,
                icon: '⏲️'
            });
        }

        if (hasValue(card.duration) && card.duration !== 'Permanent') {
            effects.push({
                category: 'Time Effects',
                type: 'duration',
                label: 'Duration',
                value: card.duration,
                icon: '⏳'
            });
        }

        // MONEY EFFECTS
        if (hasValue(card.money_cost)) {
            effects.push({
                category: 'Money Effects',
                type: 'money_cost',
                label: 'Money Cost',
                value: formatMoney(card.money_cost),
                icon: '💰'
            });
        }

        if (hasValue(card.money_effect)) {
            effects.push({
                category: 'Money Effects', 
                type: 'money_effect',
                label: 'Money Effect',
                value: card.money_effect,
                icon: '💵'
            });
        }

        if (hasValue(card.loan_amount)) {
            effects.push({
                category: 'Money Effects',
                type: 'loan_amount',
                label: 'Loan Amount', 
                value: formatMoney(card.loan_amount),
                icon: '🏦'
            });
        }

        if (hasValue(card.investment_amount)) {
            effects.push({
                category: 'Money Effects',
                type: 'investment_amount',
                label: 'Investment Amount',
                value: formatMoney(card.investment_amount),
                icon: '📈'
            });
        }

        if (hasValue(card.work_cost)) {
            effects.push({
                category: 'Money Effects',
                type: 'work_cost',
                label: 'Work Cost',
                value: formatMoney(card.work_cost),
                icon: '🔨'
            });
        }

        if (hasValue(card.loan_rate)) {
            effects.push({
                category: 'Money Effects',
                type: 'loan_rate',
                label: 'Loan Rate',
                value: `${card.loan_rate}%`,
                icon: '📊'
            });
        }

        // CARD EFFECTS
        if (hasValue(card.draw_cards)) {
            const drawCount = parseInt(card.draw_cards);
            effects.push({
                category: 'Card Effects',
                type: 'draw_cards',
                label: 'Draw Cards',
                value: `Draw ${drawCount} card${drawCount !== 1 ? 's' : ''}`,
                icon: '🎴'
            });
        }

        if (hasValue(card.discard_cards)) {
            const discardCount = parseInt(card.discard_cards);
            effects.push({
                category: 'Card Effects', 
                type: 'discard_cards',
                label: 'Discard Cards',
                value: `Discard ${discardCount} card${discardCount !== 1 ? 's' : ''}`,
                icon: '🗑️'
            });
        }

        if (hasValue(card.card_type_filter)) {
            effects.push({
                category: 'Card Effects',
                type: 'card_type_filter',
                label: 'Card Type Filter',
                value: `${card.card_type_filter} cards only`,
                icon: '🎯'
            });
        }

        // TURN EFFECTS
        if (hasValue(card.turn_effect)) {
            effects.push({
                category: 'Turn Effects',
                type: 'turn_effect',
                label: 'Turn Effect',
                value: card.turn_effect,
                icon: '🔄'
            });
        }

        // CONDITIONAL LOGIC 
        if (hasValue(card.conditional_logic)) {
            effects.push({
                category: 'Conditional Logic',
                type: 'conditional_logic',
                label: 'Conditional Logic',
                value: card.conditional_logic,
                icon: '🎯'
            });
        }

        // DICE EFFECTS
        if (hasValue(card.dice_trigger)) {
            effects.push({
                category: 'Dice Effects',
                type: 'dice_trigger',
                label: 'Dice Trigger',
                value: card.dice_trigger,
                icon: '🎲'
            });
        }

        if (hasValue(card.dice_effect)) {
            effects.push({
                category: 'Dice Effects',
                type: 'dice_effect', 
                label: 'Dice Effect',
                value: card.dice_effect,
                icon: '🎲'
            });
        }

        // MOVEMENT & SPACE EFFECTS
        if (hasValue(card.movement_effect)) {
            effects.push({
                category: 'Movement Effects',
                type: 'movement_effect',
                label: 'Movement Effect', 
                value: card.movement_effect,
                icon: '➡️'
            });
        }

        if (hasValue(card.space_effect)) {
            effects.push({
                category: 'Movement Effects',
                type: 'space_effect',
                label: 'Space Effect',
                value: card.space_effect,
                icon: '📍'
            });
        }

        // SPECIAL EFFECTS
        if (hasValue(card.immediate_effect)) {
            effects.push({
                category: 'Special Effects',
                type: 'immediate_effect',
                label: 'Immediate Effect',
                value: card.immediate_effect,
                icon: '⚡'
            });
        }

        if (hasValue(card.chain_effect)) {
            effects.push({
                category: 'Special Effects',
                type: 'chain_effect',
                label: 'Chain Effect',
                value: card.chain_effect,
                icon: '🔗'
            });
        }

        if (hasValue(card.nullify_effect)) {
            effects.push({
                category: 'Special Effects',
                type: 'nullify_effect',
                label: 'Nullify Effect',
                value: card.nullify_effect,
                icon: '🚫'
            });
        }

        // GAME STATE EFFECTS
        if (hasValue(card.percentage_effect)) {
            effects.push({
                category: 'Special Effects',
                type: 'percentage_effect',
                label: 'Percentage Effect',
                value: card.percentage_effect,
                icon: '📈'
            });
        }

        if (hasValue(card.inspection_effect)) {
            effects.push({
                category: 'Special Effects',
                type: 'inspection_effect',
                label: 'Inspection Effect',
                value: card.inspection_effect,
                icon: '🔍'
            });
        }

        // USAGE LIMITATIONS
        if (hasValue(card.usage_limit) && card.usage_limit !== '1') {
            effects.push({
                category: 'Usage Rules',
                type: 'usage_limit',
                label: 'Usage Limit',
                value: `${card.usage_limit} uses maximum`,
                icon: '🔢'
            });
        }

        if (hasValue(card.cooldown)) {
            effects.push({
                category: 'Usage Rules',
                type: 'cooldown',
                label: 'Cooldown',
                value: card.cooldown,
                icon: '⏰'
            });
        }

        if (hasValue(card.stacking_limit) && card.stacking_limit !== '1') {
            effects.push({
                category: 'Usage Rules',
                type: 'stacking_limit',
                label: 'Stacking Limit',
                value: `Maximum ${card.stacking_limit} in effect`,
                icon: '📚'
            });
        }

        return effects;
    };

    /**
     * Groups effects by category for organized display
     */
    const groupEffectsByCategory = (effects) => {
        const grouped = {};
        effects.forEach(effect => {
            if (!grouped[effect.category]) {
                grouped[effect.category] = [];
            }
            grouped[effect.category].push(effect);
        });
        return grouped;
    };

    /**
     * Phase restriction color mapping
     */
    const getPhaseColors = (phaseRestriction) => {
        const colorMap = {
            'DESIGN': { 
                bg: '#fff9c4', 
                border: '#fbbf24', 
                accent: '#f59e0b',
                text: '#92400e' 
            },
            'CONSTRUCTION': { 
                bg: '#ede9fe', 
                border: '#8b5cf6', 
                accent: '#7c3aed',
                text: '#5b21b6' 
            },
            'FUNDING': { 
                bg: '#dcfce7', 
                border: '#22c55e', 
                accent: '#16a34a',
                text: '#15803d' 
            },
            'REGULATORY_REVIEW': { 
                bg: '#fee2e2', 
                border: '#ef4444', 
                accent: '#dc2626',
                text: '#991b1b' 
            }
        };
        return colorMap[phaseRestriction] || { 
            bg: '#f8f9fa', 
            border: '#dee2e6', 
            accent: '#6c757d',
            text: '#495057' 
        };
    };

    /**
     * Category-specific color schemes for effect sections
     */
    const getCategoryColors = (categoryName) => {
        const categoryColors = {
            'Time Effects': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
            'Money Effects': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            'Card Effects': { bg: '#e2e3f3', border: '#c3c6f7', text: '#4a2c7a' },
            'Turn Effects': { bg: '#fef0e5', border: '#fdd5b4', text: '#8a4a14' },
            'Conditional Logic': { bg: '#f0f9ff', border: '#bae6ff', text: '#0c4a6e' },
            'Dice Effects': { bg: '#fdf2f8', border: '#fbb6ce', text: '#9d174d' },
            'Movement Effects': { bg: '#ecfdf5', border: '#bbf7d0', text: '#047857' },
            'Special Effects': { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
            'Usage Rules': { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' }
        };
        return categoryColors[categoryName] || { bg: '#f8f9fa', border: '#dee2e6', text: '#495057' };
    };

    /**
     * Renders an individual effect with icon and proper formatting
     */
    const renderEffect = (effect, index) => {
        return React.createElement('div', {
            key: `effect-${effect.type}-${index}`,
            style: {
                marginBottom: '8px',
                padding: '6px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
            }
        }, [
            React.createElement('span', {
                key: 'icon',
                style: {
                    marginRight: '8px',
                    fontSize: '14px'
                }
            }, effect.icon),
            React.createElement('strong', {
                key: 'label',
                style: { marginRight: '4px' }
            }, `${effect.label}: `),
            React.createElement('span', {
                key: 'value'
            }, effect.value)
        ]);
    };

    /**
     * Renders an effect category section
     */
    const renderEffectCategory = (categoryName, effects, index) => {
        const colors = getCategoryColors(categoryName);

        return React.createElement('div', {
            key: `category-${index}`,
            style: {
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px'
            }
        }, [
            React.createElement('div', {
                key: 'category-title',
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: colors.text,
                    marginBottom: '10px',
                    textTransform: 'uppercase'
                }
            }, categoryName),
            ...effects.map((effect, effectIndex) => renderEffect(effect, effectIndex))
        ]);
    };

    /**
     * Renders the phase restriction header badge
     */
    const renderPhaseHeader = (phaseRestriction, phaseColors) => {
        if (!phaseRestriction || phaseRestriction === '' || phaseRestriction === 'Any') {
            return null;
        }

        return React.createElement('div', {
            key: 'phase-header',
            style: {
                background: `linear-gradient(135deg, ${phaseColors.border}, ${phaseColors.accent})`,
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }
        }, `🏷️ Phase: ${phaseRestriction}`);
    };

    /**
     * Renders basic card information section
     */
    const renderBasicInfo = (card, phaseColors) => {
        if (!card.card_name && !card.description) {
            return null;
        }

        return React.createElement('div', {
            key: 'basic-info',
            style: {
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.1)',
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
                    color: phaseColors.text,
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
        ]);
    };

    /**
     * Renders usage restrictions section (excluding phase_restriction)
     */
    const renderRestrictionsSection = (card) => {
        const restrictions = [];
        
        if (card.space_restriction && card.space_restriction !== '' && card.space_restriction !== 'Any') {
            restrictions.push({ label: 'Space', value: card.space_restriction });
        }
        if (card.scope_restriction && card.scope_restriction !== '' && card.scope_restriction !== 'Any') {
            restrictions.push({ label: 'Scope', value: card.scope_restriction });
        }
        if (card.work_type_restriction && card.work_type_restriction !== '' && card.work_type_restriction !== 'Any') {
            restrictions.push({ label: 'Work Type', value: card.work_type_restriction });
        }

        if (restrictions.length === 0) {
            return null;
        }

        return React.createElement('div', {
            key: 'restrictions-section',
            style: {
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
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
                    color: '#721c24',
                    marginBottom: '10px',
                    textTransform: 'uppercase'
                }
            }, '🚫 Usage Restrictions'),
            
            ...restrictions.map((restriction, index) => 
                React.createElement('div', {
                    key: `restriction-${index}`,
                    style: { marginBottom: '8px' }
                }, [
                    React.createElement('strong', {key: 'restriction-label'}, `${restriction.label}: `),
                    React.createElement('span', {key: 'restriction-value'}, restriction.value)
                ])
            )
        ]);
    };

    /**
     * Renders "no effects" message when card has no special effects
     */
    const renderNoEffectsMessage = () => {
        return React.createElement('div', {
            key: 'no-effects',
            style: {
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
                fontStyle: 'italic',
                color: '#6c757d'
            }
        }, '📄 This card has no special effects or restrictions.');
    };

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

    // ===============================
    // MAIN CARD CONTENT RENDERING  
    // ===============================

    const card = selectedCard;
    const effects = parseCardEffects(card);
    const groupedEffects = groupEffectsByCategory(effects);
    
    // Phase restriction colors
    const phaseColors = getPhaseColors(card.phase_restriction);
    
    // Main modal styling with phase-based coloring
    const modalStyle = {
        padding: '20px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontSize: '13px',
        background: phaseColors.bg,
        border: `2px solid ${phaseColors.border}`,
        borderRadius: '8px'
    };

    // Build content sections array
    const sections = [];

    // Phase restriction header (if exists)
    const phaseHeader = renderPhaseHeader(card.phase_restriction, phaseColors);
    if (phaseHeader) {
        sections.push(phaseHeader);
    }

    // Basic card information
    const basicInfo = renderBasicInfo(card, phaseColors);
    if (basicInfo) {
        sections.push(basicInfo);
    }

    // Render effect categories
    Object.entries(groupedEffects).forEach(([categoryName, categoryEffects], index) => {
        sections.push(renderEffectCategory(categoryName, categoryEffects, index));
    });

    // Usage restrictions section
    const restrictionsSection = renderRestrictionsSection(card);
    if (restrictionsSection) {
        sections.push(restrictionsSection);
    }

    // Show message if no effects found
    if (Object.keys(groupedEffects).length === 0 && !restrictionsSection && !basicInfo) {
        sections.push(renderNoEffectsMessage());
    }

    // Card front content with unified rendering system
    return React.createElement('div', {
        key: 'card-content-area',
        style: modalStyle
    }, sections);
}

// Export component
window.CardModalContent = CardModalContent;