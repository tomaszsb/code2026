/**
 * DiceRenderer Component - Visual dice display and animation
 * Extracted from AdvancedDiceManager for better separation of concerns
 */

function DiceRenderer({ diceState, onClose }) {
    const { useState, useEffect } = React;

    // Don't render if not rolling and no value to show
    if (!diceState.rolling && !diceState.rollValue) {
        return null;
    }

    return React.createElement('div', {
        className: 'advanced-dice-display',
        style: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            textAlign: 'center',
            minWidth: '200px'
        },
        onClick: (e) => e.stopPropagation() // Prevent event bubbling
    }, [
        // Dice display
        React.createElement('div', {
            key: 'dice',
            style: {
                fontSize: '48px',
                marginBottom: '16px',
                animation: diceState.rolling ? 'roll 0.2s infinite' : 'none'
            }
        }, `🎲 ${diceState.rollValue || '?'}`),
        
        // Rolling indicator
        diceState.rolling && React.createElement('div', {
            key: 'rolling',
            style: { color: '#6b7280' }
        }, 'Rolling...'),
        
        // Outcomes display
        !diceState.rolling && diceState.outcomes.length > 0 && 
        React.createElement('div', {
            key: 'outcomes',
            style: { fontSize: '14px', color: '#374151', marginBottom: '16px' }
        }, diceState.outcomes.map(outcome => outcome.description).join(' • ')),

        // Close button (when not rolling)
        !diceState.rolling && React.createElement('button', {
            key: 'close',
            onClick: onClose,
            style: {
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
            }
        }, 'Continue'),

        // CSS animations
        React.createElement('style', {
            key: 'styles'
        }, `
            @keyframes roll {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(90deg); }
                50% { transform: rotate(180deg); }
                75% { transform: rotate(270deg); }
            }
        `)
    ]);
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiceRenderer;
} else {
    window.DiceRenderer = DiceRenderer;
}