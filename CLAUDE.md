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
js/data/CSVDatabase.js              # Unified CSV query system
js/data/GameStateManager.js         # Central state + events
js/utils/CardUtils.js               # Centralized card configurations & utilities
js/components/App.js                # Root component
js/components/GameBoard.js          # Interactive board with movement system
js/components/SpaceExplorer.js      # Space details and exploration panel

# Modern Panel System (User Interface)
js/components/GamePanelLayout.js    # Responsive three-panel layout container
js/components/PlayerStatusPanel.js  # Left panel coordinator (117 lines - refactored)
js/components/ActionPanel.js        # Bottom panel: actions, dice, moves, turn control (720 lines)
js/components/ResultsPanel.js       # Right panel: results, history, game progress
js/components/RulesModal.js         # Standalone rules modal with CSV-driven content

# PlayerStatusPanel Components (Split Architecture)
js/components/CardModal.js          # Enhanced card display modal with 3D flip animation (527 lines)
js/components/PlayerHeader.js       # Player avatar, name, and turn information (42 lines)
js/components/CurrentSpaceInfo.js   # Space details, requirements, and CSV content (84 lines)
js/components/PlayerResources.js    # Money, time, and project scope management (119 lines)
js/components/CardsInHand.js        # Card grid display and interaction handling (140 lines)

# Advanced System Components (Professional Features)
js/components/InteractiveFeedback.js       # Toast notifications & visual feedback
js/components/TooltipSystem.js             # Context-sensitive help system
js/components/LogicSpaceManager.js         # Complex decision-based spaces
js/components/AdvancedCardManager.js       # Card combos & chain effects
js/components/AdvancedDiceManager.js       # Sophisticated dice mechanics
js/components/PlayerInfo.js               # Comprehensive player dashboard
js/components/PlayerMovementVisualizer.js # Visual movement animations

css/unified-design.css          # Design system with consistent styling
css/main.css                    # Consolidated core layout and UI (merged from game-components.css)
css/panel-layout.css            # Three-panel layout styling
css/card-components.css         # Card-specific styling
data/cards.csv                  # Card properties and effects
data/Spaces.csv                 # Space actions and outcomes
data/DiceRoll Info.csv          # Dice result mappings
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

// ❌ No duplicate card type configurations
getCardTypeConfig(cardType) { /* local implementation */ }  // Use CardUtils instead
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
        // Safe to access properties
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

## Reference Materials

### code2025 Folder - REFERENCE ONLY
- 📚 **For understanding existing game logic**
- ❌ **NO mixing of old and new code**
- ❌ **NO importing files from code2025**

### Screenshots and Visual Feedback
- 📸 **Screenshots are uploaded to code2026 folder**
- 📸 **Reference screenshots by filename when discussing layout/UI issues**

---

## Documentation Structure

**CLAUDE.md contains ONLY essential development guidelines.**

For detailed information see:
- `DEVELOPMENT.md` - Phase tracking, patterns, debugging, detailed examples
- Git commit history - Change log with reasoning

**Architecture: CSV-driven content, unified APIs, event-driven communication, consistent design system.**

## Recent Improvements (Latest Session)

### ✅ **Phase 12: Component Splitting - PlayerStatusPanel (Current Session)**
- **Major Architectural Refactor**: Complete PlayerStatusPanel component splitting achieving 87% size reduction
  - Original PlayerStatusPanel: 902 lines → Final: 117 lines (785 lines reduced)
  - Extracted 5 new focused components with clean separation of concerns
  - No functionality lost - all features preserved with improved maintainability
- **New Components Created**: Professional component architecture with props-based communication
  - CardModal.js (527 lines): Enhanced card display modal with 3D flip animation and type-specific filtering
  - PlayerHeader.js (42 lines): Player avatar, name, and turn information display
  - CurrentSpaceInfo.js (84 lines): Space details, requirements, and CSV-driven content
  - PlayerResources.js (119 lines): Money, time, and detailed project scope management
  - CardsInHand.js (140 lines): Card grid display with expand/collapse and interaction handling
- **Enhanced Maintainability**: Each component has single responsibility and clear interfaces
  - Improved testability with isolated functionality
  - Better debugging and development experience
  - Established pattern for future large component refactoring

### ✅ **Phase 1: Code Cleanup & Organization (Previous Session)**
- **Component Consolidation & Duplication Removal**: Major codebase cleanup and maintainability improvements
  - Removed duplicate PlayerSetup.js component, kept EnhancedPlayerSetup as active
  - Merged game-components.css into main.css, reducing from 15 to 14 CSS files (~17% reduction)
  - Created centralized CardUtils.js shared module eliminating duplicate card functions across 4+ components
  - Fixed critical card type naming inconsistencies (Business→Bank, Inspection→Investor, Legal→Life, Emergency→Expeditor)
  - Extracted RulesModal.js from ActionPanel.js, reducing ActionPanel from 1,137 to 720 lines (36% reduction)
- **Standardized Card System**: Unified card configurations, icons, colors, and naming throughout codebase
  - All components now use CardUtils.getCardTypeConfig() for consistent card properties
  - Eliminated hardcoded card mappings and duplicate configuration objects
  - Fixed incorrect card type references that caused inconsistent UI display
- **Architecture Improvements**: Enhanced maintainability through proper separation of concerns
  - RulesModal now self-contained with CSV-driven content loading
  - Reduced code duplication by ~2,000+ lines across CSS and JavaScript files
  - Established pattern for future component extractions from large monolithic components

### ✅ **Action System Fixes & Smart Card Filtering** (Previous Session)
- **Fixed Card Action Counting Bug**: Spaces with multiple card types now require only ONE action instead of ALL
  - Code2026 was incorrectly requiring players to click all available card action buttons
  - Now matches code2025 behavior: choose and execute one card action, then move forward
  - Fixed in ActionPanel.js checkCanEndTurn() - card actions count as 1 total action regardless of quantity
  - Resolves "stuck on space" issues for 28+ spaces with multiple card types (L+E, B+I combinations)
- **Smart Card Filtering for OWNER-FUND-INITIATION**: Contextual button display based on project scope
  - Bank button only shows if scope ≤ $4M (matches CSV condition: "Draw 1 if scope ≤ $ 4 M")
  - Investor button only shows if scope > $4M (matches CSV condition: "Draw 1 if scope > $ 4 M")
  - Eliminates illogical choice between two buttons when only one is correct based on game state
  - Uses player.scopeTotalCost to determine appropriate funding source
  - Maintains game narrative consistency: owner provides funding based on pre-determined scope

### ✅ **Enhanced Action System & Button Logic**
- **Fixed End Turn Button**: Proper state management with action progress counter
  - Shows "End Turn (2/3)" format displaying completed vs required actions
  - Disabled by default, only enabled when all actions are completed
  - Real-time updates when moves selected, dice rolled, or card actions executed
- **Fixed Negotiate Button**: Complete functionality overhaul for proper turn management
  - Always available (no longer restricted by dice requirements)
  - Applies -1 day time penalty
  - Clears all cards added during turn
  - Resets dice roll state and all turn selections
  - Automatically ends turn after clearing state
- **Action Counter System**: Comprehensive tracking of space requirements
  - Counts dice rolls, card actions (as 1 total), and movement selections as separate actions
  - Card actions count as 1 completed action regardless of quantity available
  - Updates in real-time as actions are completed
  - Proper validation for spaces with no required actions (e.g., first space)

### ✅ **Card System & Scope Management**
- **Enhanced W Card Scope Display**: Project scope now shows work types and costs
  - Removed percentage calculation (no longer "40%" display)
  - Shows work types like "Plumbing", "Electrical", "General Construction"
  - Displays estimated costs with automatic summation for multiple cards
  - Two-column layout: Work Type | Est. Cost with totals
- **Card Information Display**: Type-specific information filtering
  - W Cards: Simplified view with costs and work type restrictions
  - B, I, L, E Cards: Full information display with all available CSV fields
  - Fixed E card information that was previously missing
  - Added comprehensive effects, restrictions, and usage information
- **Card Modal Enhancements**: Professional card flip animation and information display
  - 3D flip animation reveals Unravel-branded back side
  - Type-specific information filtering based on card type
  - Compact left-side icon design (60px) for streamlined appearance

### ✅ **UI System & Color Scheme**
- **Applied Instructions Modal Colors**: Left status panel now matches rules modal design
  - Clean white backgrounds replace gradients
  - Primary blue (#4285f4) for headers and values
  - Consistent light gray borders (#e0e0e0) throughout
  - Professional typography matching modal design system
- **Terminology Standardization**: Replaced all "ticks" references with "days"
  - Card effects now show "2 days" instead of "2 ticks"
  - Consistent time terminology across all components
  - Updated tooltips and descriptions to use "days"

### ✅ **Previous Session Fixes**
- **Enhanced Card System & Manual Actions**: Separated dice outcomes from space card actions
- **Interactive Card Display Enhancement**: Streamlined card information with flip animations
- **Logic Space Decision System**: Enhanced PM-DECISION-CHECK with proper validation
- **Rules System Enhancement**: Complete rules coverage with perfect two-column layout
- **Card System Standardization**: Corrected card names (Bank, Investor, Life, Expeditor)
- **Critical Error Resolution**: Fixed database access errors and defensive programming

## Current Features

### ✅ Advanced Professional Game System with Modern Three-Panel UI

#### 🎯 **Sophisticated Gameplay Mechanics**
- **Manual Card Action System**: Separated dice outcomes from space card actions for precise control
  - Dice rolls provide specific card types based on DiceRoll Info.csv
  - Space actions appear as clickable buttons (e.g., "Life Cards: Draw 3")
  - Players have full control over when to execute card actions
- **Complex Logic Spaces**: Interactive decision points with YES/NO choices and branching outcomes
  - Enhanced PM-DECISION-CHECK with proper validation and CSV-driven destinations
  - Warning system prevents ending turns without making required decisions
- **Advanced Card Combos**: Multi-card synergies with automatic detection and bonus calculation
  - Finance Synergy: Bank + Investor cards (+$75k bonus)
  - Work-Life Balance: Work + Life cards (+$25k, +2 time)
  - Type Mastery: Multiple same-type cards (+40k, 1.3x multiplier)
  - Project Spectrum: All 5 card types (+$150k, +5 time, 2x multiplier)
- **Intelligent Dice System**: Conditional outcomes, roll-based multipliers, separated from space actions
- **Deliberate Movement System**: All player movement requires explicit choice, no auto-movement

#### 💫 **Professional UI Experience with Modern Panel Layout**
- **Streamlined Two-Panel System**: Player status (left) + Results/Explorer (right), actions integrated into left panel
- **Responsive Design**: Desktop panels and mobile tabbed interface with smooth transitions
- **Interactive Card Display System**: Enhanced card modal with flip animation and streamlined information
  - Click cards to view detailed information with compact left-side icon (60px)
  - Smooth 3D flip animation (0.6s) reveals Unravel-branded back side
  - Streamlined display for W cards: essential costs and restrictions only
  - Professional card back with logo from graphics folder
- **Manual Card Action Interface**: Dedicated "🎴 Available Card Actions" section in ActionPanel
  - Clickable buttons for space-based card actions (separate from dice outcomes)
  - Smart contextual filtering: shows only appropriate buttons based on game state
  - OWNER-FUND-INITIATION displays Bank OR Investor button based on project scope (not both)
  - Actions execute immediately and are removed from available list
  - Color-coded buttons matching card type themes
- **Interactive Feedback System**: Toast notifications with success/warning/error messages
- **Context-Sensitive Help**: Comprehensive rules modal with CSV-driven content and two-column layout
- **Visual Movement System**: Smooth animations, path highlighting, position indicators
- **Rich Player Dashboard**: Financial analysis, scope tracking, combo history, phase progress
- **Enhanced Visual Feedback**: Button ripple effects, loading states, progress indicators
- **Integrated Action System**: Choice selection, dice rolling, negotiate button, and turn management in left panel
- **Unified Color Scheme**: Consistent color coding across rules modal and player status panels
- **Aligned Layout System**: Perfect cell alignment in rules modal with responsive grid design

#### 🎮 **Complete Game Features**
- **Interactive Game Board**: Clickable spaces with visual feedback and state indicators
- **Enhanced Space Explorer**: Comprehensive space information with dice alerts and movement navigation
- **Complete Card Management**: 5 card types (Work, Bank, Investor, Life, Expeditor) with unified color scheme
  - Interactive card display with flip animation and Unravel branding
  - Manual card action buttons for space-based effects
  - Streamlined information display optimized for W cards
- **Controlled Turn System**: Deliberate choice selection → Manual card actions → End Turn validation
  - Decision space validation prevents ending turns without required choices
  - Manual control over all card actions and movement decisions
  - Negotiate option available with time penalty
- **Enhanced Rules System**: Beautiful modal with complete CSV-driven content, perfect two-column alignment
- **Separated Dice & Card System**: Clear distinction between dice outcomes and space card actions
  - Dice rolls provide specific cards based on DiceRoll Info.csv
  - Space card actions appear as dedicated manual buttons
  - No auto-processing of card effects, full player control
- **Full Gameplay Loop**: Turn management, win condition detection, real-time timer
- **Production Systems**: Auto-save/load, import/export, comprehensive error handling
- **Corrected Card Names**: Bank (not Business), Investor (not Investigation), Life (not Legal), Expeditor (not Emergency)

#### 🏗️ **Advanced Architecture**
- **CSV-First Design**: All game content driven by data, no hardcoded rules
- **Event-Driven Communication**: Clean component interactions via GameStateManager with defensive event handling
- **Unified Design System**: Consistent styling with professional card layouts and typography
- **Mobile Responsive**: Optimized for all devices with touch-friendly interactions
- **Accessibility Complete**: ARIA support, keyboard navigation, screen reader compatibility
- **Defensive Programming**: All database access with loading checks and null safety
- **Error Resilience**: Graceful handling of undefined data and event format variations

#### 🔧 **Developer Experience**
- **Component-Based Architecture**: 35 React components with clear separation of concerns
- **Advanced State Management**: Event system with proper cleanup and memory management
- **Debug Mode**: Comprehensive logging and development tools
- **Hot Reload**: Browser-based Babel compilation, no build required
- **Error Boundaries**: Comprehensive error handling with user feedback
- **Robust Error Handling**: Fixed all "Cannot read properties of undefined" errors
- **Consistent Database Access**: Standardized CSV query patterns with safety checks
- **Event System Reliability**: Defensive event listeners handle data format variations