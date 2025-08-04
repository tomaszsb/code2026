---

# CLAUDE.md - Essential Development Reference

**Project Management Board Game - Clean Architecture**

## Latest Session Achievements - MULTIPLAYER SETUP & UI ENHANCEMENTS COMPLETE
- **✅ MULTIPLAYER FUNCTIONALITY RESTORED**: Fixed FixedApp to use EnhancedPlayerSetup, enabling full 4-player support
- **✅ LOADING PERFORMANCE OPTIMIZED**: Removed 1.8 seconds of artificial delays from game startup
- **✅ COLOR PICKER SYSTEM OPERATIONAL**: Resolved React stale closures and CSS conflicts preventing color selection
- **✅ UNIQUE PLAYER IDENTIFICATION**: Enforced unique colors and avatars with comprehensive validation
- **✅ TURN DISPLAY CORRECTED**: Fixed erroneous "Turn X of Y" format showing timestamps instead of proper turn numbers
- **✅ PLAYER AVATAR INTEGRATION**: Added emoji avatar display in PlayerHeader for improved player identification
- **✅ ENHANCED USER EXPERIENCE**: Streamlined player setup with real-time feedback and constraints

## Technical Fixes Applied This Session
- **Component Architecture**: `FixedApp.js:83` - Changed from `FixedPlayerSetup` to `EnhancedPlayerSetup`
- **CSS Conflicts**: `EnhancedPlayerSetup.js:321` - Renamed `color-picker` to `color-picker-container` class
- **React Closures**: `EnhancedPlayerSetup.js:67-115` - Fixed functional state updates (`setPlayers(currentPlayers => ...)`)
- **Performance**: `EnhancedPlayerSetup.js:95,104,125` - Removed artificial `setTimeout` delays totaling 1.8s
- **Turn Logic**: `PlayerHeader.js:22,44` - Fixed turn display using `(turnCount || 0) + 1` instead of player ID
- **HTML Cleanup**: `index.html:30` - Removed skip-link as requested
- **State Validation**: `EnhancedPlayerSetup.js:71-89` - Added uniqueness enforcement for colors and avatars

## Project Summary
Single-page web app using vanilla HTML/CSS/JavaScript with React (via CDN). Players navigate project phases from initiation to completion.

## Repository
- **GitHub**: https://github.com/tomaszsb/code2026
- **Owner**: tomaszsb@gmail.com
- **Branch**: main

## Essential Commands
```bash
# 🎮 GAME SERVER (Manual start if needed)
python3 -m http.server 8000                       # Game server only (port 8000)

# 📊 GAME URLs
http://localhost:8000/                             # Main game (FixedApp)
http://localhost:8000/?debug=true&logLevel=debug   # Debug mode

# Card Testing (after game initialization)
window.giveCardToPlayer(playerId, 'W001')           # Add Work Card to player
window.GameStateManager.usePlayerCard(playerId, 'W001')  # Use card with effects
window.showGameState()                              # View current game state

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
# Core Game Systems - CENTRALIZED ACTION TRACKING
js/data/GameStateManager.js         # SINGLE SOURCE OF TRUTH for all action tracking
js/data/CSVDatabase.js              # Unified CSV query system
js/utils/CardUtils.js               # Centralized card configurations & utilities
js/utils/EffectsEngine.js           # Complete card effect processing system

# Main Interface (Production) - PURE PRESENTATION COMPONENTS
js/components/FixedApp.js           # Layout coordinator - NO action logic
js/components/GameInterface.js      # Clean 3-panel game layout (inside FixedApp.js)
js/components/FixedPlayerSetup.js   # Professional player setup (inside FixedApp.js)
js/components/TurnControls.js       # PURE UI - reads from GameStateManager only

# Legacy Interface (DO NOT USE - Complex State Management)
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

### CSV Data Standards
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

### GameStateManager Architecture
```javascript
// ✅ ONLY GameStateManager modifies core game state
const messages = window.GameStateManager.movePlayerWithEffects(playerId, destination, visitType);

// ✅ All state modifications return user-friendly messages
const moneyMessage = GameStateManager.updatePlayerMoney(playerId, amount, reason, true);
const timeMessage = GameStateManager.updatePlayerTime(playerId, amount, reason, true);
const cardMessage = GameStateManager.addCardsToPlayer(playerId, cardType, cards, true);
const cardUsageMessage = GameStateManager.usePlayerCard(playerId, cardId);
const scopeMessage = GameStateManager.addWorkToPlayerScope(playerId, workCost, workType, true);
const discardMessage = GameStateManager.forcePlayerDiscard(playerId, cardCount, cardTypeFilter);

// ✅ FixedApp calls useGameState, passes to GameManager as props (FIXED ARCHITECTURE)
// In FixedApp.js:
const [gameState, gameStateManager] = window.useGameState();
// Pass to GameManager:
React.createElement(GameManager, { gameState, gameStateManager })

// ✅ GameManager receives state as props (NO useGameState call)
function GameManager({ gameState, gameStateManager }) {
    // All event handlers have guaranteed valid gameStateManager reference
}

// ✅ React useState ONLY for UI-only concerns
const [gameUIState, setGameUIState] = useState({
    showingDiceResult: false,
    showSpaceExplorer: false,
    selectedSpaceData: null
});

// ❌ NO manual game state mutations in components
updatedPlayer.money += amount;  // FORBIDDEN
player.cards[cardType].push(card);  // FORBIDDEN

// ❌ NO duplicate useGameState calls (RACE CONDITION FIXED)
// GameManager should NOT call useGameState() - receives props only

// ❌ NO duplicate game logic outside GameStateManager
const spaceEffects = window.CSVDatabase.spaceEffects.query(...);  // FORBIDDEN in components
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
- ❌ **Duplicate game logic** - ONLY GameStateManager modifies core game state
- ❌ **Manual space effects processing** - use `GameStateManager.movePlayerWithEffects()` instead
- ❌ **Dual state management** - FIXED: Only FixedApp calls useGameState(), GameManager receives props
- ❌ **Direct state mutations** - ALL game state changes must go through GameStateManager methods  
- ❌ **Race conditions** - FIXED: GameManager receives valid gameStateManager as prop
- ❌ **React Hooks violations** - FIXED: No conditional hook calls
- ❌ **Unconditional debug functions** - FIXED: Debug functions check URL parameters directly

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

## Current Status

### Architecture State - COMPREHENSIVE CLEANUP COMPLETE
- ✅ **CENTRALIZED ACTION TRACKING** - GameStateManager is single source of truth
- ✅ **STANDARDIZED EVENTS** - All actions use playerActionTaken event
- ✅ **PURE UI COMPONENTS** - TurnControls/FixedApp are presentation-only
- ✅ **ZERO RACE CONDITIONS** - Synchronous centralized state updates
- ✅ **ACTION COUNTER FUNCTIONAL** - Real-time updates from centralized brain
- ✅ **CLEAN COMPONENT SEPARATION** - GameManager/GameInitializer roles clarified
- ✅ **CONSOLIDATED DICE PROCESSING** - All dice logic centralized in GameManager
- ✅ **BULLETPROOF CSV ERROR HANDLING** - 100% loading state coverage verified
- ✅ **PRODUCTION-READY DEBUG FUNCTIONS** - Debug functions conditionalized

### Latest Session Achievements - CARD DRAWING FUNCTIONALITY RESOLVED
- **✅ CRITICAL BUG FIXED**: Card drawing functionality now works correctly
- **Architectural Race Condition Resolved**: Fixed GameManager receiving gameState/gameStateManager as props instead of calling useGameState() internally
- **Event Handler Stability**: Added guard clauses to all event handlers to prevent null reference errors
- **React Hooks Compliance**: Fixed Rules of Hooks violations by removing conditional hook calls
- **Immutability Bug Fixed**: Corrected calculatePlayerScope function to create new objects instead of mutating existing ones
- **Debug Function Availability**: Made debug functions self-sufficient by checking URL parameters directly
- **Infinite Loop Prevention**: Stabilized useCallback dependencies to prevent event listener re-registration loops
- ✅ **Full GameStateManager** - Unified state management, zero duplicate logic
- ✅ **Clean CSV Architecture** - 7-file structure, specialized engines
- ✅ **Production Code Quality** - All syntax/reference errors resolved
- ✅ **UI Reactivity Working** - Cards are successfully added and UI updates in real-time

- **CSV-driven content**: All game data from unified CSV API
- **Interactive board**: Snake layout, 27 spaces, click-to-explore
- **Card system**: Phase-restricted E cards, immediate W/B/I/L effects
- **Modal system**: Cards in Hand, SpaceExplorer, Rules with keyboard support
- **Event-driven**: Components communicate via GameStateManager events
- **Defensive programming**: Safe database access, null safety throughout

### CSS Architecture
- **Unified design system**: `unified-design.css` contains authoritative styles
- **Button standardization**: All action buttons use `.btn` base class
- **Movement labels**: Use "FIRST VISIT" and "SUBSEQUENT VISIT"

## MAJOR ARCHITECTURAL REFACTOR - CARD DRAWING FUNCTIONALITY RESOLUTION

### Overview
Comprehensive debugging and architectural improvements to resolve critical card drawing functionality bugs.

### Root Cause Analysis
The card drawing system had multiple interconnected issues:
1. **Race Condition**: GameManager and FixedApp both calling useGameState() independently
2. **Stale Closures**: Event handlers created with null gameStateManager references
3. **React Hooks Violations**: Conditional hook calls violating Rules of Hooks
4. **Immutability Bugs**: State mutations preventing React change detection
5. **Event Handler Instability**: Infinite loops from unstable useCallback dependencies

### Critical Fixes Applied

1. **Architectural Race Condition Resolution**:
   - Refactored GameManager to receive gameState/gameStateManager as props
   - Eliminated dual useGameState() calls creating initialization race conditions
   - Established clean top-down data flow from FixedApp → GameManager

2. **Event Handler Stabilization**:
   - Added guard clauses (`if (!gameStateManager) return;`) to all event handlers
   - Fixed Rules of Hooks violations by removing conditional hook calls
   - Stabilized useCallback dependencies to prevent infinite re-registration loops

3. **Immutability Corrections**:
   - Fixed calculatePlayerScope to create new objects instead of mutating existing ones
   - Ensured all state updates follow immutable patterns for React change detection
   - Corrected event handler parameter destructuring to match emitted event format

4. **Debug System Improvements**:
   - Made debug functions self-sufficient by checking URL parameters directly
   - Removed dependency on script loading order for debug function availability
   - Added comprehensive diagnostic logging for debugging complex event flows

### Technical Implementation Details

**GameManager.js Changes**:
- Function signature: `function GameManager({ gameState, gameStateManager })`
- Removed internal `useGameState()` call
- Added guard clauses to all event handlers
- Fixed processCardAction parameter destructuring: `({ playerId, cardType, action })`

**FixedApp.js Changes**:
- Added props passing to GameManager: `gameState: gameState, gameStateManager: gameStateManager`
- Conditional rendering: `gameStateManager && window.GameManager`

**GameStateManager.js Changes**:
- Fixed calculatePlayerScope immutability using Map and spread syntax
- Removed legacy updatePlayerScope function
- Enhanced addCardsToPlayer with proper immutable state updates

### Results
- ✅ **Card Drawing Functional**: "Draw 3" buttons work correctly and add cards to player hands
- ✅ **UI Reactivity Working**: Real-time updates when cards are added/removed
- ✅ **Zero Race Conditions**: Predictable component initialization order
- ✅ **React Compliance**: No Rules of Hooks violations or infinite loops
- ✅ **Debugging Capability**: Comprehensive logging for future development
- ✅ **Architectural Integrity**: Clean separation of concerns and data flow

---

## Documentation Structure

**CLAUDE.md contains ONLY essential development guidelines.**

For detailed information see:
- `DEVELOPMENT.md` - Phase tracking, patterns, debugging, detailed examples
- Git commit history - Change log with reasoning

**Architecture: Clean CSV architecture, specialized engines, complete legacy removal, single data access pattern.**

## Data Architecture

### CSV Files (Clean Architecture)
- ✅ **MOVEMENT.csv**: Space-to-space connections (54 entries)
- ✅ **SPACE_EFFECTS.csv**: Card/time/money effects with conditions (120 entries)
- ✅ **SPACE_CONTENT.csv**: UI display text and story content (54 entries)
- ✅ **DICE_OUTCOMES.csv**: Dice roll destination mapping (18 entries)
- ✅ **DICE_EFFECTS.csv**: Dice-based card/money effects (33 entries)
- ✅ **GAME_CONFIG.csv**: Metadata, phases, game configuration (27 entries)
- ✅ **cards.csv**: Card properties and effects (405 entries)

### JavaScript Engines
- ✅ **MovementEngine.js**: Movement logic with audit trails (20KB)
- ✅ **EffectsEngine.js**: Card/time/money effects processor (18KB)
- ✅ **ContentEngine.js**: UI content and configuration manager (12KB)
- ✅ **CSVDatabase.js**: Unified API with null safety
- ✅ **CardUtils.js**: Centralized card configurations