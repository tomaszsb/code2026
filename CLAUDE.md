# CLAUDE.md - Essential Development Reference

**Project Management Board Game - Clean Architecture**

## Project Summary
Single-page web app using vanilla HTML/CSS/JavaScript with React (via CDN). Players navigate project phases from initiation to completion.

## Repository
- **GitHub**: https://github.com/tomaszsb/code2026
- **Owner**: tomaszsb@gmail.com
- **Branch**: main

## Essential Commands
```bash
# Development server
python -m http.server 8000

# Testing URLs
http://localhost:8000/                              # Main game
http://localhost:8000/?debug=true&logLevel=debug     # Debug mode

# Git operations
git add .                                           # Stage changes
git commit -m "Description of changes"             # Commit changes
git push origin main                                # Push to GitHub
git pull origin main                                # Pull latest changes
```
**No build required** - Browser-based Babel compilation.

## Core Architecture

### CSV-as-Database Philosophy
- **Game DATA lives in CSV files** - card properties, space effects, dice outcomes
- **Game LOGIC lives in JavaScript** - how to process data, UI flow, turn mechanics
- **One unified API** - same query pattern for all CSV data types
- **No data duplication** - CSV is single source of truth for game content

### Key Files
```
# Core Systems
js/data/CSVDatabase.js              # Unified CSV query system
js/data/GameStateManager.js         # Central state + events
js/utils/CardUtils.js               # Centralized card configurations & utilities

# Main Interface
js/components/App.js                # Root component
js/components/GamePanelLayout.js    # Responsive panel layout container
js/components/PlayerStatusPanel.js  # Left panel coordinator (117 lines)
js/components/ActionPanel.js        # Bottom panel coordinator (318 lines)
js/components/ResultsPanel.js       # Right panel: results, history, progress

# Game Components
js/components/GameBoard.js          # Interactive board with movement system
js/components/SpaceExplorer.js      # Space details and exploration panel
js/components/RulesModal.js         # Standalone rules modal with CSV content

# Split Architecture Components
js/components/DiceRollSection.js    # Dice rolling with animation (227 lines)
js/components/CardActionsSection.js # Card actions with filtering (153 lines)
js/components/MovementSection.js    # Movement selection/execution (240 lines)
js/components/TurnControls.js       # Turn management/validation (264 lines)
js/components/CardModal.js          # Enhanced card display (527 lines)
js/components/PlayerHeader.js       # Player info display (42 lines)
js/components/CurrentSpaceInfo.js   # Space details/requirements (84 lines)
js/components/PlayerResources.js    # Money/time management (119 lines)
js/components/CardsInHand.js        # Card grid display (140 lines)

# Data Files
data/cards.csv                      # Card properties and effects
data/Spaces.csv                     # Space actions and outcomes
data/DiceRoll Info.csv              # Dice result mappings
```

## Development Rules

### CSV Data Standards
```javascript
// ✅ Query CSV data with unified API (with safety checks)
if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;
const cards = window.CSVDatabase.cards.query({type: 'W', phase: 'DESIGN'});
const space = window.CSVDatabase.spaces.find(spaceName, visitType);
const dice = window.CSVDatabase.dice.query({space: spaceName, visitType});

// ❌ No direct array manipulation
spaces.find(s => s.space_name === name);  // Forbidden

// ❌ No unsafe database access
const space = CSVDatabase.spaces.find(name, type);  // Missing window prefix
const space = window.CSVDatabase.spaces.find(name, type);  // Missing loading check
```

### Card System Standards
```javascript
// ✅ Use CardUtils for all card-related operations
const cardConfig = window.CardUtils.getCardTypeConfig('W');  // Returns {name: 'Work', icon: '🔨', color: '...'}
const formattedValue = window.CardUtils.formatCardValue(card);
const sortedCards = window.CardUtils.sortCardsByType(cards);

// ❌ No hardcoded card mappings
const cardNames = { 'B': 'Business' };  // Forbidden - use CardUtils
const cardIcons = { 'W': '🔧' };       // Forbidden - use CardUtils
```

### Component Communication
```javascript
// ✅ Event-driven only (with defensive event handling)
GameStateManager.emit('playerMoved', {player, newSpace});
useEventListener('playerMoved', ({ player, playerId, newSpace, toSpace }) => {
    // Handle both event formats gracefully
    const targetPlayer = player || (playerId && gameState.players?.find(p => p.id === playerId));
    const targetSpace = newSpace || toSpace;
    if (targetPlayer && targetSpace) {
        handlePlayerMoved(targetPlayer, targetSpace);
    }
});

// ❌ No direct component calls
otherComponent.updatePlayer(player);  // Forbidden

// ❌ Unsafe property access
player.name  // Could be undefined
gameState.players.find()  // Could be undefined

// ✅ Safe property access
player?.name || 'Player'  // Defensive
gameState.players?.find()  // Defensive
```

### What's Forbidden
- ❌ **Magic strings in JS** - no `if (spaceName === 'OWNER-SCOPE-INITIATION')`
- ❌ **Hardcoded amounts** - no `drawCards('W', 3)` without CSV lookup
- ❌ **Multiple data access paths** - one API only
- ❌ **Component-to-component calls** - events only
- ❌ **Fallback data sources** - CSV or error, no alternatives
- ❌ **Unsafe database access** - always check loading state first
- ❌ **Direct property access** - always use optional chaining and fallbacks
- ❌ **Event data assumptions** - handle multiple event formats gracefully
- ❌ **Duplicate card configurations** - use CardUtils.js only
- ❌ **Hardcoded card type names** - no `{ 'B': 'Business' }` mappings
- ❌ **Large monolithic components** - split components >500 lines

## Loading Order (Critical)
```html
1. Unified Design System (CSS)
2. CSVDatabase system
3. GameStateManager
4. Shared utilities (CardUtils.js)
5. Component utilities  
6. Manager components
7. UI components (GameBoard, SpaceExplorer, RulesModal)
8. Panel components (PlayerStatusPanel, ActionPanel)
9. Main App
```

## What Lives Where

### CSV Files (Game Content)
- ✅ Space names, actions, card requirements
- ✅ Card effects, costs, descriptions
- ✅ Dice outcomes, movement options

### JavaScript (Game Engine)
- ✅ Turn flow logic (roll dice → move → apply effects)
- ✅ Card effect interpretation ("Draw 3" → drawCards function)
- ✅ UI state management and event coordination
- ✅ Interactive board with clickable spaces and visual feedback
- ✅ Player movement system using CSV space connections

## Recent Improvements

### ✅ **Phase 17: Critical Database & UI Fixes (Latest)**
- **Fixed Space Lookup Error**: Resolved "Space OWNER-FUND-INITIATION/First not found" by fixing missing comma in Spaces.csv line 6
- **Enhanced CSVDatabase Safety**: Added comprehensive loading checks to prevent unsafe database access across 10+ components
- **Smart Negotiate Button**: Negotiate now activates only when space has immediate time data, deactivates for roll/choice/card-based timing
- **Improved Error Handling**: Added retry logic and detailed debugging for space lookup failures

### ✅ **Phase 16: CSS Deduplication & Game Logic Fixes**
- **Comprehensive CSS Cleanup**: Eliminated all duplicate CSS rules across multiple files (~200+ lines removed)
- **Move Button Sizing Fix**: Standardized move button height to match other action buttons perfectly
- **GameStateManager Error Fix**: Fixed hardcoded visit types by implementing proper MovementEngine integration
- **Architecture Consolidation**: Established unified-design.css as single source of truth for all styling

### ✅ **Phase 15: Button Standardization & UI Polish**
- **Unified Action Buttons**: Standardized all action buttons to consistent width, styling, and fonts
- **Enhanced Movement Labels**: Changed "NEW" to "FIRST VISIT" and "REVISIT" to "SUBSEQUENT VISIT"
- **CSS Architecture Cleanup**: Fixed duplicate CSS rules causing styling conflicts
- **Improved User Experience**: Consistent button behavior across dice, cards, movement, and controls

### ✅ **Phase 14: Critical Bug Fixes**
- **Fixed Rules Modal**: Corrected CSV field references (Event/Action/Outcome vs event_description/action/outcome)
- **Fixed Card Money Effects**: Bank loan_amount and Investment investment_amount now apply immediately
- **Fixed Decision Modals**: Added close button, escape key, and click-outside dismissal

### ✅ **Phase 13: ActionPanel Component Splitting**
- Split 720-line ActionPanel into 4 focused components (56% size reduction)
- Created DiceRollSection, CardActionsSection, MovementSection, TurnControls
- Improved event-driven architecture and maintainability

### ✅ **Phase 12: PlayerStatusPanel Component Splitting**
- Split 902-line PlayerStatusPanel into 5 focused components (87% size reduction)
- Created CardModal, PlayerHeader, CurrentSpaceInfo, PlayerResources, CardsInHand
- Established component splitting patterns for large files

### ✅ **Phase 1: Initial Code Cleanup & Organization**
- Removed duplicate components and consolidated CSS files
- Created centralized CardUtils.js eliminating duplicate functions
- Fixed card type naming inconsistencies (Business→Bank, etc.)
- Extracted RulesModal from ActionPanel

## Current Architecture Features

### 🎯 **Game Systems**
- **CSV-driven content**: All game data from CSV files with unified API
- **Manual card actions**: Player-controlled card effects separate from dice outcomes
- **Interactive decision spaces**: YES/NO choices with CSV-driven destinations and dismissible modals
- **Smart card filtering**: Context-aware button display (e.g., Bank vs Investor based on scope)
- **Advanced card combos**: Multi-card synergies with automatic detection
- **Immediate card effects**: Money and time effects apply when cards are drawn

### 🎮 **User Interface**
- **Three-panel responsive layout**: Player status (left) + Action controls (bottom) + Results/Explorer (right)
- **Interactive game board**: Clickable spaces with visual feedback
- **Enhanced card system**: 3D flip animations, type-specific filtering, Unravel branding
- **Comprehensive rules modal**: CSV-driven content with proper field mapping
- **Professional feedback system**: Toast notifications, loading states, progress indicators
- **Unified action buttons**: Consistent width, styling, and behavior across all action sections

### 🏗️ **Technical Architecture**
- **Event-driven communication**: Components communicate via GameStateManager events
- **Defensive programming**: Safe database access and null safety throughout
- **Component-based design**: 35+ focused components with clear separation of concerns
- **Split architecture**: Large components split into maintainable sub-components
- **Browser-based compilation**: No build step required, Babel transforms JSX in browser
- **Comprehensive error handling**: Robust CSV data validation and space lookup safety
- **Smart UI state management**: Context-aware button activation based on game state

### 🎨 **CSS Architecture**
- **Unified design system**: `unified-design.css` contains authoritative styles and design tokens
- **Button standardization**: All action buttons use `.btn` base class with consistent variants
- **Single source of truth**: Avoid CSS duplicates - `unified-design.css` takes precedence
- **Movement labels**: Use "FIRST VISIT" and "SUBSEQUENT VISIT" instead of "NEW" and "REVISIT"

---

## Documentation Structure

**CLAUDE.md contains ONLY essential development guidelines.**

For detailed information see:
- `DEVELOPMENT.md` - Phase tracking, patterns, debugging, detailed examples
- Git commit history - Change log with reasoning

**Architecture: CSV-driven content, unified APIs, event-driven communication, consistent design system.**