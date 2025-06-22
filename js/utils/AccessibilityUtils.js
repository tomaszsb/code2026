/**
 * AccessibilityUtils - ARIA support and keyboard navigation
 * Ensures the game is accessible to users with disabilities
 */

// Accessibility utility functions
const AccessibilityUtils = {
    // Add ARIA attributes to elements
    addAriaAttributes: (element, attributes) => {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(`aria-${key}`, value);
        });
    },

    // Announce changes to screen readers
    announceToScreenReader: (message, priority = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },

    // Create accessible button with proper ARIA
    createAccessibleButton: (text, onClick, options = {}) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.onclick = onClick;
        
        // Default ARIA attributes
        const ariaDefaults = {
            role: 'button',
            ...options.aria
        };
        
        AccessibilityUtils.addAriaAttributes(button, ariaDefaults);
        
        if (options.describedBy) {
            button.setAttribute('aria-describedby', options.describedBy);
        }
        
        if (options.className) {
            button.className = options.className;
        }
        
        return button;
    },

    // Create accessible list with proper ARIA
    createAccessibleList: (items, options = {}) => {
        const list = document.createElement(options.ordered ? 'ol' : 'ul');
        list.setAttribute('role', 'list');
        
        if (options.label) {
            list.setAttribute('aria-label', options.label);
        }
        
        items.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.setAttribute('role', 'listitem');
            listItem.textContent = item;
            list.appendChild(listItem);
        });
        
        return list;
    },

    // Focus management
    focusManagement: {
        // Focus trap for modals
        trapFocus: (containerElement) => {
            const focusableElements = containerElement.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };
            
            containerElement.addEventListener('keydown', handleTabKey);
            firstElement.focus();
            
            // Return cleanup function
            return () => {
                containerElement.removeEventListener('keydown', handleTabKey);
            };
        },

        // Set focus to element with announcement
        setFocusWithAnnouncement: (element, message) => {
            element.focus();
            if (message) {
                AccessibilityUtils.announceToScreenReader(message);
            }
        },

        // Get next focusable element
        getNextFocusableElement: (direction = 'forward') => {
            const focusableElements = Array.from(document.querySelectorAll(
                'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
            ));
            
            const currentIndex = focusableElements.indexOf(document.activeElement);
            
            if (direction === 'forward') {
                return focusableElements[currentIndex + 1] || focusableElements[0];
            } else {
                return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
            }
        }
    },

    // Keyboard navigation helpers
    keyboardNavigation: {
        // Add arrow key navigation to a container
        addArrowKeyNavigation: (container, items, options = {}) => {
            let currentIndex = 0;
            
            const navigate = (direction) => {
                items[currentIndex].classList.remove('keyboard-focused');
                
                if (direction === 'ArrowDown' || direction === 'ArrowRight') {
                    currentIndex = (currentIndex + 1) % items.length;
                } else if (direction === 'ArrowUp' || direction === 'ArrowLeft') {
                    currentIndex = (currentIndex - 1 + items.length) % items.length;
                }
                
                items[currentIndex].classList.add('keyboard-focused');
                items[currentIndex].focus();
                
                if (options.announce) {
                    const itemText = items[currentIndex].textContent || items[currentIndex].getAttribute('aria-label');
                    AccessibilityUtils.announceToScreenReader(`${itemText}. ${currentIndex + 1} of ${items.length}`);
                }
            };
            
            const handleKeyDown = (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    navigate(e.key);
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    items[currentIndex].click();
                }
            };
            
            container.addEventListener('keydown', handleKeyDown);
            
            // Initialize first item
            if (items.length > 0) {
                items[0].classList.add('keyboard-focused');
                items[0].setAttribute('tabindex', '0');
                items.forEach((item, index) => {
                    if (index !== 0) {
                        item.setAttribute('tabindex', '-1');
                    }
                });
            }
            
            return () => {
                container.removeEventListener('keydown', handleKeyDown);
            };
        },

        // Game-specific keyboard shortcuts
        addGameKeyboardShortcuts: () => {
            const shortcuts = {
                'KeyE': () => {
                    // End turn shortcut
                    if (window.GameStateManager?.turnManager?.forceEndTurn) {
                        window.GameStateManager.turnManager.forceEndTurn();
                        AccessibilityUtils.announceToScreenReader('Turn ended');
                    }
                },
                'KeyS': () => {
                    // Save game shortcut
                    if (window.GameStateManager?.saveManager?.saveGame) {
                        window.GameStateManager.saveManager.saveGame('Quick Save');
                        AccessibilityUtils.announceToScreenReader('Game saved');
                    }
                },
                'KeyH': () => {
                    // Show help
                    AccessibilityUtils.announceToScreenReader('Press E to end turn, S to save game, H for help, Arrow keys to navigate');
                },
                'Escape': () => {
                    // Close modals
                    const modals = document.querySelectorAll('.modal-overlay, .dice-roll-overlay, .game-end-overlay');
                    modals.forEach(modal => {
                        const closeButton = modal.querySelector('button[aria-label*="close"], .close-button');
                        if (closeButton) {
                            closeButton.click();
                        }
                    });
                }
            };
            
            const handleKeyDown = (e) => {
                // Only handle shortcuts when not in an input field
                if (e.target.tagName.toLowerCase() === 'input' || 
                    e.target.tagName.toLowerCase() === 'textarea') {
                    return;
                }
                
                const shortcut = shortcuts[e.code] || shortcuts[e.key];
                if (shortcut) {
                    e.preventDefault();
                    shortcut();
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    },

    // Color contrast and visual accessibility
    visualAccessibility: {
        // Check if user prefers reduced motion
        prefersReducedMotion: () => {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },

        // Check if user prefers high contrast
        prefersHighContrast: () => {
            return window.matchMedia('(prefers-contrast: high)').matches;
        },

        // Add high contrast mode
        enableHighContrastMode: () => {
            document.body.classList.add('high-contrast-mode');
            AccessibilityUtils.announceToScreenReader('High contrast mode enabled');
        },

        // Remove high contrast mode
        disableHighContrastMode: () => {
            document.body.classList.remove('high-contrast-mode');
            AccessibilityUtils.announceToScreenReader('High contrast mode disabled');
        }
    },

    // Game state announcements
    gameAnnouncements: {
        announcePlayerTurn: (playerName) => {
            AccessibilityUtils.announceToScreenReader(`${playerName}'s turn`, 'assertive');
        },

        announceMovement: (playerName, spaceName) => {
            AccessibilityUtils.announceToScreenReader(`${playerName} moved to ${spaceName}`, 'polite');
        },

        announceCardDraw: (playerName, cardCount, cardType) => {
            const typeNames = {
                'W': 'work',
                'B': 'bank',
                'I': 'investor',
                'L': 'legal',
                'E': 'expert'
            };
            const typeName = typeNames[cardType] || cardType;
            AccessibilityUtils.announceToScreenReader(`${playerName} drew ${cardCount} ${typeName} card${cardCount !== 1 ? 's' : ''}`, 'polite');
        },

        announceGameWin: (winnerName, finalScore) => {
            AccessibilityUtils.announceToScreenReader(`Game complete! ${winnerName} wins with a score of ${finalScore}`, 'assertive');
        },

        announceSpaceSelection: (spaceName, spaceDetails) => {
            const message = `Selected ${spaceName}. ${spaceDetails}`;
            AccessibilityUtils.announceToScreenReader(message, 'polite');
        }
    }
};

// CSS for screen reader only content
const accessibilityCSS = `
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.keyboard-focused {
    outline: 3px solid #ff6b35 !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 5px rgba(255, 107, 53, 0.3) !important;
}

/* High contrast mode styles */
.high-contrast-mode {
    filter: contrast(150%) brightness(110%);
}

.high-contrast-mode .board-space {
    border: 2px solid #000 !important;
}

.high-contrast-mode .game-card {
    border: 2px solid #000 !important;
    background: #fff !important;
    color: #000 !important;
}

/* Focus indicators for better visibility */
button:focus,
.board-space:focus,
.game-card:focus {
    outline: 3px solid #ff6b35 !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 5px rgba(255, 107, 53, 0.3) !important;
}

/* Skip link for keyboard navigation */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
    border-radius: 4px;
}

.skip-link:focus {
    top: 6px;
}
`;

// Inject accessibility CSS
const accessibilityStyle = document.createElement('style');
accessibilityStyle.textContent = accessibilityCSS;
document.head.appendChild(accessibilityStyle);

// Export for use in other components
window.AccessibilityUtils = AccessibilityUtils;