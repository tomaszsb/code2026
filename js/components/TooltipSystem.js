/**
 * TooltipSystem Component - Context-sensitive help and guidance
 * Adapted for code2026's React architecture and game context
 */

function TooltipSystem() {
    const { useState, useEffect, useCallback, useRef } = React;
    const [tooltip, setTooltip] = useState({
        visible: false,
        content: '',
        title: '',
        x: 0,
        y: 0,
        theme: 'dark'
    });
    
    const tooltipTimers = useRef(new Map());
    const tooltipConfigs = useRef(new Map());

    // Default tooltip configuration
    const defaultConfig = {
        delay: 800,
        hideDelay: 200,
        maxWidth: 350,
        theme: 'dark',
        position: 'auto'
    };

    // Game-specific tooltip configurations
    useEffect(() => {
        // Card type tooltips
        tooltipConfigs.current.set('[data-card-type="W"]', {
            title: '🔧 Work Card',
            content: 'Represents scope and commitments in your project. Use to define project requirements and track progress.',
            delay: 500,
            theme: 'info'
        });

        tooltipConfigs.current.set('[data-card-type="B"]', {
            title: '💼 Bank Card',
            content: 'Provides funding for your project. Play to add money to your resources.',
            delay: 500,
            theme: 'success'
        });

        tooltipConfigs.current.set('[data-card-type="I"]', {
            title: '🔍 Investor Card',
            content: 'External investment opportunities. Can provide large amounts of funding with potential conditions.',
            delay: 500,
            theme: 'warning'
        });

        tooltipConfigs.current.set('[data-card-type="L"]', {
            title: '⚖️ Life Card',
            content: 'Represents work-life balance factors. Can affect time and project efficiency.',
            delay: 500,
            theme: 'info'
        });

        tooltipConfigs.current.set('[data-card-type="E"]', {
            title: '⚠️ Expeditor Card',
            content: 'Accelerates project progress. Can speed up processes and bypass certain requirements.',
            delay: 500,
            theme: 'danger'
        });

        // Space type tooltips
        tooltipConfigs.current.set('.space-initiation', {
            title: '🚀 Initiation Phase',
            content: 'Initial project setup and planning activities. Foundation for your project success.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.space-planning', {
            title: '📋 Planning Phase',
            content: 'Detailed project planning and resource allocation. Critical for project organization.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.space-design', {
            title: '🎨 Design Phase',
            content: 'Architectural and engineering design work. Defines project specifications.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.space-build', {
            title: '🔨 Build Phase',
            content: 'Physical project implementation. The main execution of your plans.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.space-test', {
            title: '🧪 Test Phase',
            content: 'Quality assurance and testing. Ensure project meets requirements.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.space-deploy', {
            title: '🚀 Deploy Phase',
            content: 'Final project deployment and delivery. Project completion phase.',
            delay: 600,
            theme: 'success'
        });

        // Game action tooltips
        tooltipConfigs.current.set('.btn--danger', {
            title: '⏹️ End Turn',
            content: 'Complete your current turn and pass control to the next player. Make sure you\'ve taken your action!',
            delay: 1000,
            theme: 'warning'
        });

        tooltipConfigs.current.set('.dice-roll-btn', {
            title: '🎲 Roll Dice',
            content: 'Roll dice to determine movement options or resolve space effects. Some spaces require dice rolls.',
            delay: 800,
            theme: 'info'
        });

        // Movement tooltips
        tooltipConfigs.current.set('.available-move', {
            title: '✅ Available Move',
            content: 'Click to select this space as your movement destination. Highlighted spaces show valid moves.',
            delay: 400,
            theme: 'success'
        });

        tooltipConfigs.current.set('.current-position', {
            title: '📍 Current Position',
            content: 'This is your current location on the board. Orange highlighting shows where you are.',
            delay: 300,
            theme: 'warning'
        });

        // Card interaction tooltips
        tooltipConfigs.current.set('.card-hand', {
            title: '🃏 Your Hand',
            content: 'Cards available to play. Drag cards to the play area or click to play them.',
            delay: 600,
            theme: 'info'
        });

        tooltipConfigs.current.set('.drop-zone', {
            title: '🎯 Play Area',
            content: 'Drop cards here to play them. Valid cards will provide immediate effects.',
            delay: 400,
            theme: 'success'
        });

        // Space Explorer tooltips
        tooltipConfigs.current.set('.space-details', {
            title: '🔍 Space Information',
            content: 'Detailed information about the selected space, including actions, events, and movement options.',
            delay: 500,
            theme: 'info'
        });

        tooltipConfigs.current.set('.dice-warning', {
            title: '⚠️ Dice Required',
            content: 'This space requires a dice roll to determine outcomes. Click the dice button when you land here.',
            delay: 300,
            theme: 'warning'
        });
    }, []);

    // Find tooltip configuration for element
    const findTooltipConfig = (element) => {
        if (!element || typeof element.matches !== 'function') return null;
        
        // Check configured selectors
        for (let [selector, config] of tooltipConfigs.current) {
            if (element.matches(selector) || element.closest(selector)) {
                return config;
            }
        }

        // Check data attributes
        if (element.hasAttribute('data-tooltip')) {
            return {
                ...defaultConfig,
                content: element.getAttribute('data-tooltip'),
                title: element.getAttribute('data-tooltip-title') || '',
                theme: element.getAttribute('data-tooltip-theme') || 'dark'
            };
        }

        // Check title attribute
        if (element.hasAttribute('title')) {
            const title = element.getAttribute('title');
            return {
                ...defaultConfig,
                content: title,
                title: ''
            };
        }

        return null;
    };

    // Calculate tooltip position
    const calculatePosition = (element, config) => {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = config.maxWidth || defaultConfig.maxWidth;
        const tooltipHeight = 100; // Estimated height
        
        let x = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let y = rect.top - tooltipHeight - 10;

        // Adjust for screen boundaries
        if (x < 10) x = 10;
        if (x + tooltipWidth > window.innerWidth - 10) {
            x = window.innerWidth - tooltipWidth - 10;
        }
        
        if (y < 10) {
            y = rect.bottom + 10; // Show below if not enough space above
        }

        return { x, y };
    };

    // Show tooltip
    const showTooltip = (element, config) => {
        const position = calculatePosition(element, config);
        
        setTooltip({
            visible: true,
            content: config.content,
            title: config.title || '',
            theme: config.theme || 'dark',
            x: position.x,
            y: position.y,
            maxWidth: config.maxWidth || defaultConfig.maxWidth
        });
    };

    // Hide tooltip
    const hideTooltip = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    // Handle mouse enter
    const handleMouseEnter = useCallback((event) => {
        const element = event.target;
        const config = findTooltipConfig(element);
        
        if (config) {
            // Clear any existing timer
            const existingTimer = tooltipTimers.current.get(element);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            // Set new timer
            const timer = setTimeout(() => {
                showTooltip(element, config);
            }, config.delay || defaultConfig.delay);
            
            tooltipTimers.current.set(element, timer);
        }
    }, []);

    // Handle mouse leave
    const handleMouseLeave = useCallback((event) => {
        const element = event.target;
        
        // Clear timer
        const timer = tooltipTimers.current.get(element);
        if (timer) {
            clearTimeout(timer);
            tooltipTimers.current.delete(element);
        }

        // Hide tooltip after delay
        setTimeout(hideTooltip, defaultConfig.hideDelay);
    }, []);

    // Handle clicks to hide tooltips
    const handleClick = useCallback(() => {
        hideTooltip();
    }, []);

    // Handle escape key
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            hideTooltip();
        }
    }, []);

    // Add global event listeners
    useEffect(() => {
        document.addEventListener('mouseenter', handleMouseEnter, true);
        document.addEventListener('mouseleave', handleMouseLeave, true);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mouseenter', handleMouseEnter, true);
            document.removeEventListener('mouseleave', handleMouseLeave, true);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);

            // Clear all timers
            tooltipTimers.current.forEach(timer => clearTimeout(timer));
            tooltipTimers.current.clear();
        };
    }, [handleMouseEnter, handleMouseLeave, handleClick, handleKeyDown]);

    // Don't render if not visible
    if (!tooltip.visible) {
        return null;
    }

    return React.createElement('div', {
        className: `tooltip tooltip-${tooltip.theme}`,
        style: {
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            maxWidth: `${tooltip.maxWidth}px`,
            zIndex: 10001,
            backgroundColor: tooltip.theme === 'dark' ? '#1f2937' : 
                           tooltip.theme === 'success' ? '#10b981' :
                           tooltip.theme === 'warning' ? '#f59e0b' :
                           tooltip.theme === 'danger' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '14px',
            lineHeight: '1.4',
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none'
        }
    }, [
        tooltip.title && React.createElement('div', {
            key: 'title',
            style: {
                fontWeight: 'bold',
                marginBottom: '6px',
                fontSize: '15px'
            }
        }, tooltip.title),
        
        React.createElement('div', {
            key: 'content',
            style: {
                fontSize: '13px',
                opacity: 0.95
            }
        }, tooltip.content),

        // Arrow pointing down (when tooltip is above element)
        React.createElement('div', {
            key: 'arrow',
            style: {
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${
                    tooltip.theme === 'dark' ? '#1f2937' : 
                    tooltip.theme === 'success' ? '#10b981' :
                    tooltip.theme === 'warning' ? '#f59e0b' :
                    tooltip.theme === 'danger' ? '#ef4444' : '#3b82f6'
                }`
            }
        }),

        // Styles
        React.createElement('style', {
            key: 'styles'
        }, `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `)
    ]);
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipSystem;
} else {
    window.TooltipSystemComponent = TooltipSystem;
}