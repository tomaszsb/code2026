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
http://localhost:8000/                              # Main game (FixedApp)
http://localhost:8000/?debug=true&logLevel=debug     # Debug mode

# Git operations
git add .                                           # Stage changes
git commit -m "Description of changes"             # Commit changes
git push origin main                                # Push to GitHub
git pull origin main                                # Pull latest changes
```
**No build required** - Browser-based Babel compilation with clean React architecture.

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
js/data/GameStateManager.js         # Central state + events (legacy - not used in FixedApp)
js/utils/CardUtils.js               # Centralized card configurations & utilities

# Main Interface (New Architecture)
js/components/FixedApp.js           # Production React app with native state management
js/components/GameInterface.js      # Clean 3-panel game layout (inside FixedApp.js)
js/components/FixedPlayerSetup.js   # Professional player setup (inside FixedApp.js)

# Legacy Interface (Original - Complex State Management)
js/components/App.js                # Original root component (uses problematic useGameState)
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

# Data Files - Clean CSV Architecture with Dice Integration
data/cards.csv                      # Card properties and effects (unchanged)
data/MOVEMENT.csv                   # Space-to-space connections
data/DICE_OUTCOMES.csv              # Dice roll destinations  
data/SPACE_EFFECTS.csv              # Card/time/money effects with conditions + dice references
data/DICE_EFFECTS.csv               # Dice-based card drawing amounts (1-6 outcomes)
data/SPACE_CONTENT.csv              # UI display text and story content
data/GAME_CONFIG.csv                # Metadata & configuration
```

## Development Rules

### CSV Data Standards - Clean Architecture with Dice Integration
```javascript
// ✅ Query clean CSV data with unified API (with safety checks)
if (!window.CSVDatabase || !window.CSVDatabase.loaded) return null;

// Clean data access patterns (ONLY patterns allowed):
const cards = window.CSVDatabase.cards.query({type: 'W', phase: 'DESIGN'});
const movement = window.CSVDatabase.movement.find(spaceName, visitType);
const spaceEffects = window.CSVDatabase.spaceEffects.query({space: spaceName, visitType});
const spaceContent = window.CSVDatabase.spaceContent.find(spaceName, visitType);
const diceOutcomes = window.CSVDatabase.diceOutcomes.find(spaceName, visitType);
const diceEffects = window.CSVDatabase.diceEffects.find(spaceName, visitType);
const gameConfig = window.CSVDatabase.gameConfig.find(spaceName);

// ✅ Dice-based card effects (new hybrid system)
// SPACE_EFFECTS.csv: effect_type=e_cards, effect_value=dice, use_dice=true
// DICE_EFFECTS.csv: roll_1=Draw 1, roll_2=Draw 1, roll_3=Draw 2, etc.

// ❌ No direct array manipulation
spaces.find(s => s.space_name === name);  // Forbidden

// ❌ No unsafe database access
const space = CSVDatabase.spaceContent.find(name, type);  // Missing window prefix
const space = window.CSVDatabase.spaceContent.find(name, type);  // Missing loading check
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
- ❌ **Multiple data access paths** - use clean CSV API only
- ❌ **Component-to-component calls** - events only
- ❌ **Fallback data sources** - clean CSV or error, no alternatives
- ❌ **Unsafe database access** - always check loading state first
- ❌ **Direct property access** - always use optional chaining and fallbacks
- ❌ **Event data assumptions** - handle multiple event formats gracefully
- ❌ **Duplicate card configurations** - use CardUtils.js only
- ❌ **Hardcoded card type names** - no `{ 'B': 'Business' }` mappings
- ❌ **Large monolithic components** - split components >500 lines
- ❌ **Legacy CSV patterns** - ALL LEGACY CODE REMOVED (Phase 20)
- ❌ **Mixed data concerns** - use specialized files (movement vs effects vs content)

## Loading Order (Critical)
```html
1. Unified Design System (CSS)
2. CSVDatabase system (clean CSV architecture only)
3. GameStateManager
4. Shared utilities (CardUtils.js)
5. New engines (MovementEngine.js, EffectsEngine.js, ContentEngine.js)
6. Component utilities  
7. Manager components
8. UI components (GameBoard, SpaceExplorer, RulesModal)
9. Panel components (PlayerStatusPanel, ActionPanel)
10. Main App
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

### ✅ **Phase 28: Critical React Rendering Issue (Latest - RESOLVED)**
- **Root Cause Identified**: The `useGameState` hook was fundamentally incompatible with React's rendering model
- **Issue Details**: Hook created infinite render loops by calling `getCurrentState()` on every render, triggering events that caused re-renders
- **Symptoms**: State updated correctly in GameStateManager but React components never re-rendered to reflect changes
- **Debugging Process**: Extensive testing revealed React state updates worked but DOM didn't re-render - discovered infinite loop patterns
- **Solution Implemented**: Complete architectural shift from custom event-driven state to React's native `useState` patterns
- **New Architecture**: `FixedApp` component with clean React state management, separated GameInterface component, professional 3-panel layout
- **Key Components**: FixedPlayerSetup for game initialization, GameInterface for main gameplay, all using standard React patterns
- **Technical Cleanup**: Removed all test components, infinite loop debugging code, and temporary files
- **Result**: ✅ React rendering works perfectly, ✅ State transitions work flawlessly, ✅ Professional game interface, ✅ No infinite loops
- **Status**: **COMPLETELY RESOLVED** - Game now has production-ready React foundation with clean architecture

### ✅ **Phase 27: Snake Layout Board Design**
- **Complete Board Redesign**: Replaced phase-grouped layout with flowing snake pattern showing all 27 spaces
- **Responsive Wrapping**: Snake layout automatically adjusts to screen width using flex-wrap
- **Visual Hierarchy**: Current player space 2x bigger (240×160px), destination spaces 1.5x bigger (180×120px)
- **Flow Indicators**: Numbered circles (1-27) show progression order through project phases
- **Enhanced UX**: Pulsing animations for available moves, green highlighting for current position
- **Compact Design**: Optimized spacing and sizing to fit all spaces in viewport
- **True Snake Behavior**: Spaces flow left-to-right and wrap naturally like a snake winding across screen

### ✅ **Phase 26: Correct Card Usage System**
- **Fixed Card Types**: W, B, I, L cards apply immediate effects when drawn (as intended)
- **E Cards Only**: Only E (Expeditor) cards remain in hand for player-controlled usage
- **Phase Restrictions**: E cards disabled until player reaches correct phase (from card's phase_restriction field)
- **Smart UI**: Use/View buttons only on E cards, View-only buttons on immediate effect cards
- **Proper Effects**: E cards apply money/time effects only when explicitly used by player
- **Card Removal**: E cards removed from hand after use, preventing multiple uses

### ✅ **Phase 25: Fix End Turn Player Movement System**
- **Core Movement Fix**: End turn button now properly advances players to next space (OWNER-SCOPE-INITIATION → OWNER-FUND-INITIATION)
- **CSV Field Mapping Fix**: Corrected critical field name mismatch in MovementEngine (space_1/space_2 → destination_1/destination_2)
- **Event Loop Resolution**: Fixed infinite spaceReentry event loop that prevented turn completion and reset actions continuously
- **Smart Movement UX**: Auto-select single move destinations, only show selection UI for multiple choices
- **Event Chain Cleanup**: Removed duplicate playerMoved event emission causing race conditions in turn flow
- **Negotiation Context**: Added fromNegotiation flag to prevent unnecessary spaceReentry triggers during normal gameplay
- **Debug Infrastructure**: Comprehensive movement debugging to trace CSV data access and field mapping issues
- **Data Source Priority**: Fixed MovementEngine to prioritize MOVEMENT.csv over SPACE_CONTENT.csv for connection data

### ✅ **Phase 24: Complete Negotiate Button Implementation**
- **Full Negotiate Functionality**: Negotiate button now works correctly with proper time penalty accumulation
- **State Restoration Logic**: Fixed time penalty to accumulate (current + penalty) instead of resetting to snapshot time
- **Enhanced Dice Detection**: Updated ComponentUtils.requiresDiceRoll to detect both movement dice and effect-based dice (use_dice=true)
- **Action Rediscovery System**: Added spaceReentry event system to rediscover actions after negotiation
- **Event Flow Integration**: Fixed showDiceRoll event handling in ActionPanel to restore dice button after negotiation
- **Debug Information**: Added comprehensive negotiate status debugging and space data visualization in debug mode
- **UI Display Fix**: Corrected PlayerResources to show player.timeSpent instead of player.time
- **Complete Turn Cycle**: Negotiate now properly restores state, applies penalty, ends turn, and rediscovers actions

### ✅ **Phase 23: Unified Dice System and UI Cleanup**
- **Single Button Interface**: Combined dice rolling and card effects into one "Roll Dice & Apply Effects" button
- **Smart Action Filtering**: CardActionsSection now automatically hides dice-based card actions to prevent duplication
- **Enhanced User Experience**: Players see dice preview ("Work: Draw 1-3") before rolling, then automatic effect application
- **Improved Button Text**: Fixed ComponentUtils to show ranges like "Draw 1-3" instead of "Draw dice"
- **Debugging Infrastructure**: Added comprehensive logging for dice action detection and filtering
- **Clean UI Architecture**: Eliminated confusing dual dice buttons while preserving separate fixed-amount actions

### ✅ **Phase 22: Dice-Based Card Effects Integration**
- **Hybrid CSV Architecture**: Enhanced SPACE_EFFECTS.csv with `use_dice` column for dice-based randomization
- **EffectsEngine Enhanced**: Added dice lookup system that references DICE_EFFECTS.csv for variable card amounts
- **Original Game Logic Restored**: Card types and dice-based amounts now match original Spaces.csv design
- **Card Type Corrections**: Fixed OWNER-SCOPE-INITIATION (expeditor cards), LEND-SCOPE-CHECK (life+expeditor), based on original data
- **Dice Integration**: Players now get 1-3 cards based on dice rolls instead of fixed amounts, preserving excitement
- **Clean Architecture Maintained**: System uses existing CSV structure while adding dynamic dice effects

### ✅ **Phase 21: Critical Bug Fixes & React Optimization**
- **Legacy API Violations Fixed**: Corrected 18+ critical violations where components used removed `spaces` API
- **Database Initialization Fixed**: Added missing `cleanArchitecture = true` flag that broke movement API completely  
- **Dice Functionality Restored**: Fixed dice rolls to trigger card drawing, money/time effects, and player movement
- **Phase Display Implemented**: Phases now show in left panel, center board, and mobile tabs via GAME_CONFIG.csv
- **Card Drawing Pipeline Fixed**: Resolved missing cardType parameter and incorrect field queries
- **React Warnings Eliminated**: Fixed all key prop warnings by replacing `&&` with spread array conditional rendering

### ✅ **Phase 20: Legacy Code Removal & Architecture Finalization**
- **Complete Legacy Removal**: All legacy CSV files (Spaces.csv, DiceRoll Info.csv) and APIs removed
- **Clean API Migration**: Fixed all legacy `dice.getRollOutcome()` and `cards.byType()` calls across 16 components
- **ComponentUtils Modernization**: Updated utility functions to work with clean CSV architecture
- **Single Data Access Path**: Only clean CSV APIs remain - no more confusion between old/new patterns
- **Documentation Updated**: CLAUDE.md reflects finalized architecture without legacy references
- **Zero Technical Debt**: Codebase now has single, consistent data access pattern

### ✅ **Phase 19: Clean CSV Architecture Integration**
- **Complete Migration**: Successfully integrated code2027 clean CSV architecture
- **6-File Structure**: MOVEMENT.csv, DICE_OUTCOMES.csv, SPACE_EFFECTS.csv, DICE_EFFECTS.csv, SPACE_CONTENT.csv, GAME_CONFIG.csv
- **Enhanced Engines**: Added EffectsEngine.js (18KB) and ContentEngine.js (12KB) for specialized processing
- **Defensive Programming**: Fixed null safety issues in all query methods

### ✅ **Phase 18: Documentation & Integration Preparation**
- **Updated CLAUDE.md**: Added clean CSV architecture patterns and migration guidance
- **Updated DEVELOPMENT.md**: Documented Phase 19 migration status and next actions
- **Integration Testing**: Created test-integration.html for comprehensive validation
- **File Organization**: Structured migration with proper backups and fallback support

### ✅ **Phase 17: Critical Database & UI Fixes**
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
- **Snake layout game board**: All 27 spaces in flowing pattern with responsive wrapping
- **Visual hierarchy**: Current player space 2x larger, destination spaces 1.5x larger
- **Enhanced card system**: Phase-restricted E cards, immediate effects for W/B/I/L cards
- **Comprehensive rules modal**: CSV-driven content with proper field mapping
- **Professional feedback system**: Toast notifications, loading states, progress indicators
- **Unified dice system**: Single "Roll Dice & Apply Effects" button with smart action filtering
- **Compact interface**: Reduced padding and spacing for better space utilization

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

**Architecture: Clean CSV architecture, specialized engines, complete legacy removal, single data access pattern.**

## What Lives Where

### CSV Files (Game Content) - Clean Architecture
- ✅ **MOVEMENT.csv**: Pure space-to-space connections (54 entries)
- ✅ **SPACE_EFFECTS.csv**: Card/time/money effects with conditions (120 entries)  
- ✅ **SPACE_CONTENT.csv**: UI display text and story content (54 entries)
- ✅ **DICE_OUTCOMES.csv**: Dice roll destination mapping (18 entries)
- ✅ **DICE_EFFECTS.csv**: Dice-based card/money effects (33 entries)
- ✅ **GAME_CONFIG.csv**: Metadata, phases, game configuration (27 entries)
- ✅ **cards.csv**: Card properties and effects (405 entries)

### JavaScript Engines - Enhanced Architecture
- ✅ **MovementEngine.js**: Advanced movement logic with audit trails and decision tracking (20KB)
- ✅ **EffectsEngine.js**: Specialized card/time/money effects processor with condition evaluation (18KB)
- ✅ **ContentEngine.js**: UI content and configuration manager with caching (12KB)
- ✅ **CSVDatabase.js**: Unified API for clean CSV architecture with null safety
- ✅ **CardUtils.js**: Centralized card configurations eliminating hardcoded mappings

### Clean Architecture Benefits
- 🔧 **Single Responsibility**: Each CSV file handles one concern (movement vs effects vs content)
- 🛡️ **Defensive Programming**: All APIs handle null/undefined gracefully
- ✨ **Single Data Path**: Only one way to access data - no legacy confusion
- 📊 **Structured Data**: No more complex parsing like `"Draw 1 if scope ≤ $ 4 M"`
- 🎲 **Dice Integration**: Hybrid system combines clean CSV structure with dice-based randomization
- 🐛 **Easy Debugging**: Issues isolated to specific data types and engines
- 🚀 **Performance**: Specialized engines with caching and optimized queries