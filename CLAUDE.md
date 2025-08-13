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
# 🎮 GAME SERVER
python3 -m http.server 8000                       # Game server (port 8000)

# 📊 GAME URLs  
http://localhost:8000/                             # Main game
http://localhost:8000/?debug=true                  # Debug mode

# Debug Tools (in browser console after game start)
window.giveCardToPlayer(playerId, 'W001');         # Add card to player
window.GameStateManager.usePlayerCard(playerId, 'W001'); # Use card
window.showGameState();                             # View game state

# Git Operations
git add . && git commit -m "Description" && git push origin main
```

## Testing Procedures

### Basic Functionality Test
```bash
# 1. Start game server
python3 -m http.server 8000

# 2. Navigate to http://localhost:8000/
# 3. Complete player setup and start game
# 4. Verify: Turn counter advances correctly per game round
# 5. Verify: Cards apply effects without duplication
# 6. Verify: UI updates immediately when game state changes
```

### Known Stable Components
- **GameStateManager**: Single source of truth for all state management
- **CSV Database**: Unified query system with loading state protection
- **Card Effects**: Unified processing through EffectsEngine with proper delegation
- **Turn Logic**: Game round tracking with skip turn support
- **UI Components**: Event-driven updates with proper state synchronization
**No build required** - React via CDN with browser-based Babel.

## Core Architecture

### CSV-as-Database Philosophy
- **Game DATA lives in CSV files** - card properties, space effects, dice outcomes
- **Game LOGIC lives in JavaScript** - how to process data, UI flow, turn mechanics
- **One unified API** - same query pattern for all CSV data types
- **No data duplication** - CSV is single source of truth for game content

### Key Files
```
# Core Game Systems - CENTRALIZED STATE MANAGEMENT
js/data/GameStateManager.js         # SINGLE SOURCE OF TRUTH for all state management
js/data/CSVDatabase.js              # Unified CSV query system with loading state checks
js/utils/CardUtils.js               # Centralized card configurations & utilities
js/utils/EffectsEngine.js           # Card effect processing system
js/utils/MovementEngine.js          # Movement logic with audit trails
js/utils/AccessibilityUtils.js      # ARIA support and keyboard navigation utilities

# Main Application Architecture - PRODUCTION READY
js/components/FixedApp.js           # Main app coordinator with turnAdvanced event handling (583 lines)
js/components/EnhancedPlayerSetup.js # Full multiplayer setup with unique validation (585 lines)
js/components/GameManager.js        # Game logic coordination component
js/components/TurnControls.js       # Turn management UI (308 lines)

# Panel System - EVENT-DRIVEN UI COMPONENTS  
js/components/ActionPanel.js        # Action coordination with dice UI reset (365 lines)
js/components/PlayerStatusPanel.js  # Player information display (126 lines) 
js/components/ResultsPanel.js       # Game results and history tracking (382 lines)

# Interactive Game Components
js/components/GameBoard.js          # Interactive board with click-to-explore
js/components/SpaceExplorer.js      # Space details and exploration modal
js/components/CardModal.js          # Enhanced card display with flip animation (248 lines)
js/components/RulesModal.js         # Rules display with CSV content

# Specialized UI Sections
js/components/DiceRollSection.js    # Dice rolling with outcome processing (316 lines)
js/components/MovementSection.js    # Movement selection and execution
js/components/CardActionsSection.js # Card action filtering and execution
js/components/PlayerHeader.js       # Player info with avatar integration (93 lines) 
js/components/CurrentSpaceInfo.js   # Space details and requirements
js/components/PlayerResources.js    # Money/time management display
js/components/CardsInHand.js        # Card grid with modal integration

# Data Files - CLEAN CSV ARCHITECTURE
data/cards.csv                      # Card properties and effects (405 entries)
data/MOVEMENT.csv                   # Space-to-space connections (52 entries)
data/DICE_OUTCOMES.csv              # Dice roll destinations (18 entries) 
data/SPACE_EFFECTS.csv              # Card/time/money effects (42 entries)
data/DICE_EFFECTS.csv               # Dice-based effects (35 entries)
data/SPACE_CONTENT.csv              # UI display text and content (12 entries)
data/GAME_CONFIG.csv                # Game metadata and configuration (26 entries)
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

## Architecture Patterns

### Event-Driven UI Management
- **turnAdvanced Event**: UI components listen for turn changes to reset state
- **GameStateManager Events**: Components communicate via event system, not direct calls
- **Immutable State Updates**: All state changes create new objects for React change detection

### Component Responsibilities  
- **FixedApp.js**: UI state coordination, receives gameState as props
- **ActionPanel.js**: Action state management with event-driven reset
- **GameStateManager.js**: Single source of truth for all game state modifications
- **DiceRollSection.js**: Stateless dice component, state managed by parents

## CSS Architecture
- **Unified design system**: `unified-design.css` contains authoritative styles
- **Button standardization**: All action buttons use `.btn` base class
- **Movement labels**: Use "FIRST VISIT" and "SUBSEQUENT VISIT"

---

**Documentation Structure:**
- **CLAUDE.md**: Primary technical reference with current work log (this file)
- **GEMINI.md**: AI collaboration charter and workflow  
- **PRODUCT_CHARTER.md**: Product vision and performance dashboard goals
- **DEVELOPMENT_ROADMAP.md**: Current priorities and next steps
- **TECHNICAL_DEEP_DIVE.md**: Architectural patterns and system design
- **DEVELOPMENT.md**: High-level status tracking

**Architecture: Clean CSV architecture, specialized engines, single source of truth state management.**

## Recent Work Log

### 2025-08-10: Phase 21 - Conditional Card Drawing & Manual Funding System

**Major Achievement**: Successfully implemented conditional card drawing system and manual funding card draw feature, eliminating card duplication and enabling player-controlled actions.

**Phase 21 Accomplishments**:

1. **Conditional Card Drawing System** ✅ COMPLETED
   - **Problem**: OWNER-FUND-INITIATION space was drawing both B and I cards simultaneously from mutually exclusive conditions 
   - **Root Cause**: Space effects processing lacked conditional logic evaluation
   - **Solution**: Implemented `evaluateEffectCondition()` and `processMutuallyExclusiveCardEffects()` methods in GameStateManager
   - **Technical Implementation**:
     ```javascript
     // GameStateManager.js - Conditional Logic
     evaluateEffectCondition(condition, player) {
         switch (condition) {
             case 'scope_le_4M': return player.scope <= 4000000;
             case 'scope_gt_4M': return player.scope > 4000000;
             default: return true;
         }
     }
     ```
   - **Data Layer**: Fixed `card_type` column assignments in SPACE_EFFECTS.csv for proper B/I card distribution
   - **Result**: Project scope now correctly determines Bank cards (≤$4M) vs Investment cards (>$4M)

2. **Manual Funding Card Draw Feature** ✅ COMPLETED  
   - **Problem**: Funding cards auto-drawn on space entry, removing player agency
   - **User Requirement**: Convert to player-initiated button action in CardActionsSection
   - **Implementation**:
     - Added `triggerFundingCardDraw()` method to GameStateManager
     - Implemented funding button in CardActionsSection.js with scope-based tooltips
     - Added state tracking with `fundingCardDrawnForSpace` to prevent duplicate draws
     - Integrated with turn completion system via `playerActionTaken` event emission
   - **UX Enhancement**: Button shows contextual messaging - "Get Bank Card" (≤$4M) or "Get Investment Card" (>$4M)

3. **Space Action Completion System** ✅ COMPLETED
   - **Problem**: Bank/Investor buttons reappeared after funding card draw completion
   - **Solution**: Implemented `spaceActionsCompleted` state tracking
   - **Features**:
     - Permanent button hiding after funding card draw
     - State reset on turn changes and space movement  
     - Integration with existing action completion patterns
     - Enhanced filtering logic in CardActionsSection.js

4. **Turn Requirement Integration** ✅ COMPLETED
   - **Issue**: Funding card draw wasn't advancing "End Turn" button counter
   - **Solution**: Added `playerActionTaken` event emission to `triggerFundingCardDraw()`
   - **Result**: Manual funding action now properly completes turn requirements

**Technical Architecture Maintained**:
- ✅ **CSV-as-Database**: All conditional logic driven by SPACE_EFFECTS.csv data
- ✅ **Event-Driven**: Player actions communicate via event system 
- ✅ **Immutable State**: All state changes through GameStateManager methods
- ✅ **Component Separation**: UI logic in CardActionsSection, state logic in GameStateManager
- ✅ **Defensive Programming**: Comprehensive validation and error handling

**User Experience Improvements**:
- ✅ **Player Agency**: Funding cards now require deliberate player action
- ✅ **Clear Feedback**: Scope-based button text and tooltips 
- ✅ **Turn Flow**: Manual actions properly integrate with turn progression
- ✅ **State Consistency**: Button visibility reflects completion status

### 2025-08-13: Dice-Based Card Action System Bug Fixes

**Major Achievement**: Successfully resolved critical bugs in dice-based card action filtering system, fixing data integrity issues and improving code reliability.

**Issues Resolved**:

1. **DICE_EFFECTS.csv Data Integrity** ✅ FIXED
   - **Problem**: Column headers used `cards` instead of specific card type columns (`l_cards`, `e_cards`) for LEND-SCOPE-CHECK space
   - **Impact**: L and E card filtering logic failed, preventing proper dice-based card actions
   - **Solution**: Fixed column headers from `cards` to `l_cards` and `e_cards` in DICE_EFFECTS.csv
   - **Result**: L and E card dice actions now filter and display correctly

2. **CardActionsSection.js Filtering Logic** ✅ ENHANCED  
   - **Problem**: Inconsistent dice-based action detection and missing debug capabilities
   - **Enhancement**: Added comprehensive debugging with console logging
   - **Implementation**:
     ```javascript
     // Enhanced dice-based action detection with CSVDatabase query patterns
     const diceEffects = window.CSVDatabase.diceEffects.query({
         space_name: currentPlayer.position,
         visit_type: currentPlayer.visitType || 'First',
         card_type: cardAction.type
     });
     ```
   - **Result**: Reliable dice-based action filtering with diagnostic capabilities

3. **DiceRollSection.js Event Integration** ✅ IMPROVED
   - **Problem**: Missing player action event emission for turn progression
   - **Solution**: Added `playerActionTaken` event emission after dice roll processing
   - **Integration**: Dice rolls now properly advance turn completion requirements
   - **Result**: Improved turn flow integration with dice-based actions

4. **UI State Management** ✅ ENHANCED
   - **Addition**: Added dice result modal state tracking in CardActionsSection
   - **Integration**: Enhanced coordination between dice rolling and card action filtering
   - **Result**: Better UI synchronization between dice and card action components

**Technical Architecture Maintained**:
- ✅ **CSV-as-Database**: Data integrity fixes maintain single source of truth principle
- ✅ **Event-Driven**: Enhanced event emission for proper turn progression
- ✅ **Debugging Support**: Comprehensive logging for troubleshooting dice-based actions
- ✅ **Query Patterns**: Consistent CSVDatabase query usage throughout filtering logic

**Benefits Achieved**:
- ✅ **Data Accuracy**: DICE_EFFECTS.csv now has correct column mappings for all card types
- ✅ **Reliable Filtering**: Dice-based card actions display correctly for L and E cards
- ✅ **Enhanced Debugging**: Comprehensive logging helps identify filtering issues
- ✅ **Turn Integration**: Dice actions properly participate in turn completion system
- ✅ **Code Quality**: Improved error handling and validation throughout the system

### 2025-08-13: Card Acknowledgment & Unified Drawing System

**Major Achievement**: Successfully implemented unified card acknowledgment system that ensures all drawn cards are properly acknowledged before being added to player hands, eliminating immediate effect duplication.

**Architecture Evolution**:
- **Problem**: Card drawing system had two parallel paths - immediate effects and hand additions, causing inconsistent user experience
- **Solution**: Unified all card drawing through acknowledgment modal system with proper effect timing control

**Technical Implementation**:

1. **Unified Card Drawing Flow** (`game/js/data/GameStateManager.js:1363-1395`):
   ```javascript
   addCardsToPlayer(playerId, cardType, cards, returnMessage = false) {
       // ALL cards now go through unified acknowledgment process
       return this.processDrawnCardsWithAcknowledgment(
           playerId, cardType, cardsToAdd, returnMessage
       );
   }
   ```

2. **Card Acknowledgment System** (`game/js/data/GameStateManager.js:440-540`):
   - **Queue Management**: Cards queued for sequential acknowledgment display
   - **Effect Timing**: Immediate activation timing controlled by CSV `activation_timing` column
   - **Player Experience**: All cards shown to player before effects applied

3. **Dice Rolling Integration** (`game/js/components/DiceRollSection.js:38-162`):
   - **Event Emission**: Dice rolls emit `playerActionTaken` for turn progression
   - **Effect Processing**: Supports all card effect types (`cards`, `l_cards`, `e_cards`, etc.)
   - **Modal Display**: Shows dice result modal with context for all rolls

4. **Manual Funding System** (`game/js/data/GameStateManager.js:2266-2320`):
   - **Player Agency**: Funding cards require deliberate button press at OWNER-FUND-INITIATION
   - **Conditional Logic**: Scope-based B/I card selection (≤$4M vs >$4M)
   - **State Tracking**: Prevents duplicate funding card draws per space visit

**Current Card Drawing Behavior**:
- **Automatic Draws**: Space entry, dice effects → Cards acknowledged then added to hand
- **Manual Draws**: Player button actions → Cards acknowledged then added to hand  
- **Immediate Effects**: Only cards with `activation_timing: "Immediate"` apply effects during acknowledgment
- **Player Controlled**: E cards (`activation_timing: "Player Controlled"`) go to hand without immediate effects

**Technical Architecture Maintained**:
- ✅ **CSV-as-Database**: All card behavior controlled by CSV `activation_timing` column
- ✅ **Event-Driven**: Dice and card actions emit `playerActionTaken` for turn system
- ✅ **Unified API**: Single `addCardsToPlayer()` method handles all card drawing scenarios
- ✅ **Immutable State**: All state changes create new objects for React change detection

### 2025-08-08: Data-Driven Card Actions System - Manual Dice Buttons Fix

**Major Achievement**: Successfully resolved critical bug where manual dice action buttons were missing on multiple spaces and implemented a robust data-driven filtering system.

**Problem Resolved**:
- **Missing Buttons**: PM-DECISION-CHECK, INVESTOR-FUND-REVIEW, and LEND-SCOPE-CHECK spaces were not displaying their manual card action buttons
- **Brittle Architecture**: CardActionsSection.js used hardcoded space arrays that required manual updates for each new space
- **Condition Evaluation Issues**: ComponentUtils.js failed to recognize player-choice conditions like `roll_1`, `roll_2`, and `replace`

**Technical Solutions Implemented**:

1. **Data Layer Enhancement** (`game/data/SPACE_EFFECTS.csv`):
   - Added `trigger_type` column as 7th column in SPACE_EFFECTS.csv
   - Set `trigger_type: manual` for 10 dice-based card actions across target spaces
   - Created single source of truth for button visibility control

2. **Data-Driven Filtering Logic** (`game/js/components/CardActionsSection.js`):
   ```javascript
   // BEFORE - Hardcoded array approach:
   const allowDiceActionsSpaces = ['INVESTOR-FUND-REVIEW', 'LEND-SCOPE-CHECK'];
   const isManualDiceSpace = allowDiceActionsSpaces.includes(currentPlayer.position);
   
   // AFTER - Data-driven approach:
   if (cardAction.trigger_type === 'manual') {
       return true; // Always show manual trigger actions
   }
   ```

3. **Enhanced ComponentUtils** (`game/js/utils/ComponentUtils.js`):
   - Updated `getCardTypes()` to return `trigger_type` from CSV data
   - Enhanced `evaluateEffectCondition()` to recognize player-choice conditions:
     ```javascript
     const playerChoiceConditions = ['roll_1', 'roll_2', 'replace', 'to_right_player', 'return'];
     if (playerChoiceConditions.includes(condition)) {
         return true; // Show buttons for player-choice conditions
     }
     ```

4. **Code Simplification**:
   - Removed duplicate filtering logic from CardActionsSection.js
   - Eliminated hardcoded space-specific business logic
   - Centralized all filtering decisions in CSV data layer

**Benefits Achieved**:
- ✅ **Bug Resolution**: All manual dice action buttons now appear correctly
- ✅ **Maintainable**: New spaces only require CSV updates, no code changes  
- ✅ **Extensible**: Easy to add new trigger types (auto, manual, conditional, etc.)
- ✅ **Clean Architecture**: Single source of truth in CSV data
- ✅ **Robust**: No hardcoded space arrays to maintain
- ✅ **Data-Driven**: Follows established CSV-as-database philosophy

**Spaces Fixed**: PM-DECISION-CHECK, INVESTOR-FUND-REVIEW, LEND-SCOPE-CHECK now properly display manual dice action buttons based on CSV `trigger_type: manual` settings.

### 2025-08-06: Data-Driven Card Activation Refactoring

**Major Achievement**: Successfully refactored card activation system to be fully data-driven using CSV `activation_timing` column, eliminating hardcoded logic.

**Technical Debt Resolution**:
- **Problem**: GameStateManager.addCardsToPlayer used hardcoded `if (cardType !== 'E')` check to determine card behavior
- **Impact**: Violated data-driven architectural principles and made adding new card types difficult
- **Solution**: Refactored to use `activation_timing` column from cards.csv for behavior control

**Changes Made**:

1. **CSV Data Update** (`game/data/cards.csv`):
   - **E Cards**: Updated `activation_timing` from "Immediate" to "Player Controlled" (47 cards updated)
   - **W, B, I, L Cards**: Maintained "Immediate" activation timing (358 cards)
   - **Result**: CSV data now accurately reflects intended card behavior

2. **GameStateManager Refactoring** (`game/js/data/GameStateManager.js:508-518`):
   ```javascript
   // BEFORE - Hardcoded logic:
   if (cardType !== 'E') {
       cardsToAdd.forEach(card => {
           // Apply effects...
       });
   }

   // AFTER - Data-driven logic:
   cardsToAdd.forEach(card => {
       if (card.activation_timing === 'Immediate') {
           // Apply effects...
       }
       // Skip effects for "Player Controlled" cards
   });
   ```

**Benefits Achieved**:
- ✅ **Fully Data-Driven**: Card behavior controlled by CSV data, not code logic
- ✅ **Extensible**: Easy to add new card types with different activation behaviors
- ✅ **Maintainable**: Card behavior changes require only CSV updates
- ✅ **Architecture Compliant**: Follows CSV-as-database philosophy consistently
- ✅ **Functionality Preserved**: All existing game behavior remains unchanged
- ✅ **Tested**: Logic verification confirmed identical behavior to previous hardcoded system

**Technical Architecture**: Maintained event-driven patterns, immutable state management, and CSV-as-database philosophy while eliminating technical debt.

### 2025-08-06: Documentation Consolidation & Architecture Update

**Major Achievement**: Comprehensive documentation cleanup and consolidation to eliminate duplication and outdated information across 8 .md files.

**Documentation Changes**:
- **CLAUDE.md**: Updated with current architecture status, removed historical details now covered elsewhere
- **DEVELOPMENT.md**: Streamlined to focus on recent achievements, removed redundant phase documentation  
- **TECHNICAL_DEEP_DIVE.md**: Updated implementation findings and removed resolved concerns
- **Other Files**: Removed obsolete information and consolidated essential content

**Current Architecture Status**:
- ✅ **Dynamic Badge Coloring**: Completed - numbered badges change color based on player occupancy
- ✅ **Game Round Logic**: Turn counter represents complete player cycles, not individual turns
- ✅ **Card Effects System**: Unified processing through GameStateManager with no duplication
- ✅ **Skip Turn Functionality**: Complete implementation for cards L014, E029, E030
- ✅ **Production Ready**: Clean console output, stable architecture, comprehensive error handling

### 2025-08-05: Major Bug Resolution Session

**Issues Resolved**:
1. **Turn Counter Regression**: Fixed counter to represent game rounds instead of player turns
2. **Card Effect Duplication**: Eliminated duplicate E card processing between CardsInHand.js and EffectsEngine
3. **Skip Turn Implementation**: Added complete skip turn functionality with proper game round integration
4. **UI State Management**: Fixed turn counter display and negotiate button conditional rendering
5. **Reference Errors**: Fixed cardCount variable issues in GameStateManager

**Technical Architecture**: All changes maintained event-driven patterns, CSV-as-database philosophy, and immutable state management

### 2025-08-05: Critical Bug Fixes - Card Effects & Turn Management

**Task**: Fixed three critical regressions after implementing card effects and skip turn functionality

**Issues Resolved**:

1. **Expeditor Card Effect Duplication** ✅ FIXED
   - **Root Cause**: CardsInHand.js:86-122 manually processed E card effects, duplicating EffectsEngine processing
   - **Location**: `/mnt/d/unravel/current_game/code2026/game/js/components/CardsInHand.js:86-95`
   - **Solution**: Replaced duplicate manual processing with unified `GameStateManager.usePlayerCard()` call
   - **Result**: E cards now apply effects exactly once when used

2. **cardCount Reference Error** ✅ FIXED  
   - **Root Cause**: `addCardsToPlayer()` used undefined `cardCount` variable in return message
   - **Location**: `/mnt/d/unravel/current_game/code2026/game/js/data/GameStateManager.js:570,574`
   - **Solution**: Replaced `cardCount` with `cardsToAdd.length`
   - **Result**: Card drawing messages display correctly without ReferenceError

3. **Skip Turn Functionality** ✅ IMPLEMENTED
   - **Root Cause**: Complete missing implementation despite CSV data support
   - **Implementation**: Multi-part solution across GameStateManager.js and EffectsEngine.js
   - **Components**:
     - Player state: Added `skipNextTurn: false` to player initialization
     - Turn logic: Enhanced `endTurn()` to handle skip turn mechanics  
     - Card processing: Added `turn_effect` handling in EffectsEngine.applyCardEffect()
   - **Result**: Cards L014, E029, E030 now properly skip turns and advance turn counter

4. **Duplicate Effects Block Removal** ✅ FIXED
   - **Root Cause**: Redundant second effects processing block in `addCardsToPlayer()`
   - **Location**: `/mnt/d/unravel/current_game/code2026/game/js/data/GameState Manager.js:517-548`
   - **Solution**: Removed duplicate processing, effects calculated once in first phase
   - **Result**: Prevents potential duplicate effect application

### 2025-08-05: UI Turn Counter & Negotiate Button Regressions

**Task**: Fixed two new regressions reported after the card effects implementation

**Issues Resolved**:

1. **UI Turn Counter Not Advancing** ✅ FIXED
   - **Root Cause**: `turnAdvanced` event emitted before `turnCount` state fully updated
   - **Location**: `/mnt/d/unravel/current_game/code2026/game/js/data/GameStateManager.js:334-338`
   - **Problem**: Event used local `newTurnCount` variable instead of updated state
   - **Solution**: Modified event emission to use `this.state.turnCount` after setState completes
   - **Result**: UI components (FixedApp.js:266, PlayerHeader.js:23) now display correct turn numbers

2. **Negotiate Button Refined Behavior** ✅ IMPLEMENTED
   - **Root Cause**: Button behavior didn't match Owner's requirements for conditional rendering
   - **Requirements**: 
     - `can_negotiate: No` → Button completely hidden
     - `can_negotiate: Yes` + dice required + not rolled → Button disabled with "Roll for Time to Negotiate"
     - `can_negotiate: Yes` + prerequisites met → Button active
   - **Location**: `/mnt/d/unravel/current_game/code2026/game/js/components/TurnControls.js:25-83,267-300`
   - **Implementation**:
     - Enhanced `getNegotiateStatus()` to return three states: `hidden`, `disabled`, `enabled`
     - Added conditional rendering logic to hide button when `status === 'hidden'`
     - Implemented specific messaging: "Roll for Time to Negotiate" for disabled state
     - Added tooltip: "If you want to negotiate, you have to roll for time"
   - **Result**: 
     - PM-DECISION-CHECK (can_negotiate: No) → No button displayed
     - Dice-based spaces → Button shows "Roll for Time to Negotiate" when dice not rolled
     - Fixed time spaces → Button active and ready

**Technical Architecture Maintained**:
- Event-driven communication patterns preserved
- Clean CSS architecture (button rendering logic)
- CSV-as-database philosophy maintained
- Immutable state update patterns followed
- React conditional rendering best practices implemented

**Testing Scenarios Validated**:
- ✅ OWNER-SCOPE-INITIATION (can_negotiate: Yes, fixed time) → Active button
- ✅ PM-DECISION-CHECK (can_negotiate: No) → No button rendered
- ✅ Dice spaces before roll → "Roll for Time to Negotiate" disabled button
- ✅ Dice spaces after roll → Active "Negotiate" button
- ✅ Turn counter increments correctly in all UI locations
- ✅ Skip turn cards advance counter appropriately

### 2025-08-05: Turn Counter Regression - Game Round Logic Implementation

**Task**: Resolved critical turn counter regression where counter incremented per player turn instead of per game round

**Root Cause Investigation**:

**Phase 1: Debugging Strategy Implementation**
- **Problem**: UI turn counter not advancing despite underlying `turnCount` updates
- **Hypothesis**: Issue in `useGameState` hook or `areStatesEqual` function
- **Debug Implementation**: Added comprehensive logging to GameStateManager.setState and ComponentUtils.handleStateChange
- **Critical Discovery**: Debug logs revealed `turnCount` was incrementing but **not actually changing values**

**Phase 2: Root Cause Identified**
- **Location**: GameStateManager.js `endTurn` method line 326
- **Issue**: `let newTurnCount = this.state.turnCount;` **never incremented for normal turns**
- **Evidence**: Debug output showed `previousTurnCount: 1, newTurnCount: 1` (no change)
- **Initial Fix**: Added `+ 1` to always increment turn counter
- **Regression Created**: Counter now incremented **per player turn** instead of **per game round**

**Phase 3: Business Logic Analysis**
- **Requirement**: `turnCount` should represent **game rounds** (complete cycles through all players)
- **Problem**: Both `startTurn()` and `endTurn()` were incrementing counter
- **Result**: Counter behaved like "player turn count" rather than "game round count"

**Final Solution Implementation**:

**1. startTurn Method Fix** (GameStateManager.js:295-310)
```javascript
// REMOVED: turnCount: this.state.turnCount + 1,
// startTurn now only updates currentPlayer, no counter increment
```

**2. endTurn Method Game Round Logic** (GameStateManager.js:316-348)
```javascript
// Determine if we're starting a new game round
// A new round starts when we advance to the first player (index 0)
let newTurnCount = this.state.turnCount;
let isNewRound = nextIndex === 0;

// Check skip turn logic
if (nextPlayer.skipNextTurn) {
    // Update round logic: if we skipped past the first player, it's still a new round
    if (nextIndex === 0 || afterNextIndex === 0) {
        isNewRound = true;
    }
}

// Increment turn counter only for new game rounds
if (isNewRound) {
    newTurnCount += 1;
}
```

**Game Round Logic Examples**:
- **2-Player**: Alice → Bob (Round 0) → Alice (Round 1) → Bob → Alice (Round 2)
- **3-Player**: Alice → Bob → Charlie (Round 0) → Alice (Round 1) → Bob → Charlie → Alice (Round 2)
- **Skip Turn**: Alice → Skip Bob → Alice = New Round (proper handling)

**Testing & Verification**:
- **Comprehensive Smoke Test**: 4 test scenarios covering 2-player, 3-player, skip turn, and startTurn behavior
- **Results**: All tests passed with 100% accuracy
- **Verification**: Turn counter now represents true game rounds as intended

**Technical Impact**:
- ✅ **Semantic Accuracy**: `turnCount` now represents actual game rounds
- ✅ **UI Consistency**: Turn display shows correct round progression
- ✅ **Skip Turn Integration**: Skip mechanics properly integrated with round logic
- ✅ **Performance**: Single increment point prevents duplicate processing
- ✅ **Maintainability**: Clear separation between player turns and game rounds

**Debug Cleanup**: All diagnostic console.log statements removed from production code