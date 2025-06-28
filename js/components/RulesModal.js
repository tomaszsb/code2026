/**
 * RulesModal - Clean rules display modal using CSS classes and separated content
 * Refactored from 644 lines to ~200 lines for better maintainability
 */

function RulesModal({ show, onClose }) {
    if (!show) return null;

    const getRulesData = () => {
        if (!window.CSVDatabase || !window.CSVDatabase.loaded) {
            return { first: null, subsequent: null };
        }
        
        const rulesSpaceFirst = window.CSVDatabase.spaceContent.find('OWNER-SCOPE-INITIATION', 'First');
        const rulesSpaceSubsequent = window.CSVDatabase.spaceContent.find('OWNER-SCOPE-INITIATION', 'Subsequent');
        
        return {
            first: rulesSpaceFirst,
            subsequent: rulesSpaceSubsequent
        };
    };

    const rulesData = getRulesData();

    return React.createElement('div', {
        className: 'modal-overlay',
        onClick: onClose
    }, [
        React.createElement('div', {
            key: 'modal-content',
            className: 'modal-content',
            onClick: (e) => e.stopPropagation()
        }, [
            React.createElement('button', {
                key: 'close-button',
                className: 'modal-close-button',
                onClick: onClose
            }, '×'),

            React.createElement('h2', {
                key: 'title',
                className: 'modal-title'
            }, 'How to Play'),

            React.createElement(RulesContent, {
                key: 'rules-content',
                rulesData: rulesData
            })
        ])
    ]);
}

// Export component
window.RulesModal = RulesModal;