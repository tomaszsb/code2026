/**
 * Card - Unified reusable card component
 * Provides consistent card rendering across all UI contexts
 */

function Card({ 
    card, 
    onClick, 
    showActions = false, 
    actionButtons = [], 
    size = 'medium',
    className = '',
    style = {}
}) {
    if (!card) {
        return null;
    }

    // Get card configuration from CardUtils
    const cardConfig = window.CardUtils.getCardTypeConfig(card.card_type);
    const effectDescription = window.CardUtils.getCardEffectDescription(card);
    const formattedValue = window.CardUtils.formatCardValue(card);

    // Size configurations
    const sizeConfigs = {
        small: {
            width: '140px',
            minHeight: '100px',
            padding: '8px',
            fontSize: '11px',
            titleSize: '13px',
            iconSize: '16px'
        },
        medium: {
            width: '180px',
            minHeight: '120px',
            padding: '12px',
            fontSize: '12px',
            titleSize: '14px',
            iconSize: '18px'
        },
        large: {
            width: '220px',
            minHeight: '140px',
            padding: '16px',
            fontSize: '13px',
            titleSize: '16px',
            iconSize: '20px'
        }
    };

    const sizeConfig = sizeConfigs[size] || sizeConfigs.medium;

    // Phase-based styling (if card has phase restrictions)
    const getPhaseAccent = (phaseRestriction) => {
        const phaseColors = {
            'DESIGN': '#f59e0b',
            'CONSTRUCTION': '#7c3aed', 
            'FUNDING': '#16a34a',
            'REGULATORY_REVIEW': '#dc2626'
        };
        return phaseColors[phaseRestriction] || null;
    };

    const phaseAccent = getPhaseAccent(card.phase_restriction);

    // Card styling
    const cardStyle = {
        width: sizeConfig.width,
        backgroundColor: cardConfig.bgColor,
        padding: sizeConfig.padding,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontSize: sizeConfig.fontSize,
        // Default borders and radii
        border: `2px solid ${cardConfig.borderColor}`,
        borderRadius: '8px',

        // Override for phase accent
        ...(phaseAccent && {
            borderTop: `4px solid ${phaseAccent}`,
            borderLeft: `2px solid ${cardConfig.borderColor}`,
            borderRight: `2px solid ${cardConfig.borderColor}`,
            borderBottom: `2px solid ${cardConfig.borderColor}`,
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
        }),
        // Custom styling
        ...style
    };

    const hoverStyle = onClick ? {
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            borderColor: cardConfig.color
        }
    } : {};

    return React.createElement('div', {
        className: `card-component game-card ${className}`,
        style: cardStyle,
        onClick: onClick,
        onMouseEnter: (e) => {
            if (onClick) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                e.target.style.borderColor = cardConfig.color;
            }
        },
        onMouseLeave: (e) => {
            if (onClick) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                e.target.style.borderColor = cardConfig.borderColor;
            }
        },
        title: `${card.card_name || 'Unknown Card'}\n${effectDescription}`
    }, [
        // Phase indicator (if exists)
        phaseAccent && React.createElement('div', {
            key: 'phase-indicator',
            style: {
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                height: '4px',
                backgroundColor: phaseAccent,
                borderRadius: '6px 6px 0 0'
            }
        }),

        // Card header
        React.createElement('div', {
            key: 'card-header',
            className: 'card-header',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
            }
        }, [
            // Card type badge
            React.createElement('div', {
                key: 'card-type',
                style: {
                    backgroundColor: cardConfig.color,
                    color: cardConfig.bgColor,
                    borderRadius: '50%',
                    width: sizeConfig.iconSize,
                    height: sizeConfig.iconSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: sizeConfig.fontSize,
                    fontWeight: 'bold'
                }
            }, card.card_type),

            // Card icon and type name
            React.createElement('div', {
                key: 'card-type-info',
                style: {
                    color: cardConfig.color,
                    fontWeight: 'bold',
                    fontSize: sizeConfig.fontSize,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }
            }, [
                React.createElement('span', {
                    key: 'icon',
                    style: { fontSize: sizeConfig.iconSize }
                }, cardConfig.icon),
                React.createElement('span', {
                    key: 'type-name'
                }, cardConfig.name)
            ])
        ]),

        // Card body (name + description)
        React.createElement('div', {
            key: 'card-body',
            className: 'card-body',
            style: {
                flex: 1,
                marginBottom: '6px'
            }
        }, [
            React.createElement('div', {
                key: 'card-name',
                className: 'card-name',
                style: {
                    color: cardConfig.color,
                    fontSize: sizeConfig.titleSize,
                    fontWeight: '600',
                    marginBottom: '4px',
                    lineHeight: '1.2',
                    overflow: 'visible'
                }
            }, card.card_name || 'Unknown Card'),
            
            // Card description
            card.description && React.createElement('div', {
                key: 'card-description',
                className: 'card-description',
                style: {
                    color: cardConfig.color,
                    fontSize: sizeConfig.fontSize,
                    lineHeight: '1.3',
                    opacity: 0.8,
                    overflow: 'visible',
                    marginBottom: '4px'
                }
            }, card.description)
        ]),

        // Formatted value (if exists)
        formattedValue && React.createElement('div', {
            key: 'card-value',
            style: {
                color: cardConfig.color,
                fontSize: sizeConfig.titleSize,
                fontWeight: 'bold',
                marginBottom: '4px',
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: '2px 6px',
                borderRadius: '4px',
                alignSelf: 'flex-start'
            }
        }, formattedValue),

        // Effect description
        effectDescription !== 'No direct effects' && React.createElement('div', {
            key: 'card-effects',
            className: 'card-effects',
            style: {
                color: cardConfig.color,
                fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px',
                lineHeight: '1.3',
                opacity: 0.7,
                overflow: 'visible',
                marginBottom: '4px',
                backgroundColor: 'rgba(255,255,255,0.6)',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px'
            }
        }, effectDescription),

        // Flavor text (if exists)
        card.flavor_text && React.createElement('div', {
            key: 'card-flavor',
            className: 'card-flavor',
            style: {
                color: cardConfig.color,
                fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px',
                lineHeight: '1.2',
                opacity: 0.6,
                fontStyle: 'italic',
                overflow: 'visible',
                marginBottom: '4px'
            }
        }, card.flavor_text),

        // Phase restriction indicator
        card.phase_restriction && card.phase_restriction !== 'Any' && React.createElement('div', {
            key: 'phase-restriction',
            style: {
                marginTop: '4px',
                fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px',
                color: phaseAccent || cardConfig.color,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '2px 4px',
                borderRadius: '3px'
            }
        }, `📋 ${card.phase_restriction}`),

        // Action buttons (if provided)
        showActions && actionButtons.length > 0 && React.createElement('div', {
            key: 'card-actions',
            style: {
                marginTop: '6px',
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap'
            }
        }, actionButtons.map((button, index) => 
            React.createElement('button', {
                key: `action-${index}`,
                className: button.className || 'btn btn--sm',
                onClick: button.onClick,
                disabled: button.disabled,
                title: button.title,
                style: {
                    fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px',
                    padding: '2px 6px',
                    ...button.style
                }
            }, button.text)
        ))
    ]);
}

// Higher-order component for card grids
function CardGrid({ 
    cards = [], 
    onCardClick, 
    cardSize = 'medium',
    showActions = false,
    getActionButtons = () => [],
    className = '',
    style = {},
    emptyMessage = 'No cards to display'
}) {
    if (!Array.isArray(cards) || cards.length === 0) {
        return React.createElement('div', {
            className: 'card-grid-empty',
            style: {
                textAlign: 'center',
                padding: '20px',
                color: '#6c757d',
                fontStyle: 'italic',
                ...style
            }
        }, emptyMessage);
    }

    return React.createElement('div', {
        className: `card-grid ${className}`,
        style: {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${
                cardSize === 'small' ? '140px' : 
                cardSize === 'large' ? '220px' : '180px'
            }, 1fr))`,
            gap: '12px',
            padding: '8px',
            ...style
        }
    }, cards.map((card, index) => 
        React.createElement(Card, {
            key: `card-${card.card_id}-${index}`,
            card: card,
            onClick: onCardClick ? () => onCardClick(card) : null,
            size: cardSize,
            showActions: showActions,
            actionButtons: getActionButtons ? getActionButtons(card) : []
        })
    ));
}

// Export components
window.Card = Card;
window.CardGrid = CardGrid;