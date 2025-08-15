# CLAUDE.md - Development Reference

**Project Management Board Game - Clean Architecture**

## Quick Start
```bash
# Start game server
python3 -m http.server 8000

# Open game
http://localhost:8000/
http://localhost:8000/?debug=true  # Debug mode
```

## Repository
- **GitHub**: https://github.com/tomaszsb/code2026  
- **Branch**: main

## Debug Tools
```javascript
// Browser console commands (after game start)
window.giveCardToPlayer(playerId, 'W001');  // Add card
window.GameStateManager.usePlayerCard(playerId, 'W001');  // Use card
window.showGameState();  // View state
```

## Architecture Status
- ✅ **GameStateManager**: Single source of truth
- ✅ **CSV Database**: Unified query system
- ✅ **Card System**: Unified rendering (Card.js, CardGrid.js)
- ✅ **Turn Logic**: Game round tracking with skip support
- ✅ **Production Ready**: Clean console, stable architecture

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
js/components/Card.js               # Unified card component with phase styling and effects (376 lines)
js/components/CardModal.js          # Enhanced card display with flip animation (248 lines)
js/components/CardAcknowledgmentModal.js # Card drawn modal using unified Card component
js/components/CardDisplay.js        # Card grid display with detail panels using unified system
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

### Data Access Patterns
```javascript
// ✅ Safe CSV queries (always check loading)
if (!window.CSVDatabase?.loaded) return null;
const cards = window.CSVDatabase.cards.query({type: 'W', phase: 'DESIGN'});
const movement = window.CSVDatabase.movement.find(spaceName, visitType);

// ❌ Unsafe access
spaces.find(s => s.space_name === name);  // Forbidden
CSVDatabase.spaceContent.find(name, type);  // Missing checks
```

### Card System
```javascript
// ✅ Use unified Card component
React.createElement(window.Card, {
    card: cardObject,
    size: 'large',
    onClick: handleClick
});

// ✅ Use CardUtils for operations
const config = window.CardUtils.getCardTypeConfig('W');
const effects = window.CardUtils.getCardEffectDescription(card);

// ✅ Card replacement via event system
gameStateManager.emit('showCardReplacement', {
    playerId: playerId,
    cardType: 'E',
    amount: 1,
    source: 'manual_action'
});

// ❌ Custom rendering forbidden
React.createElement('div', { /* custom layout */ });  // Forbidden
```

### State Management
```javascript
// ✅ Only GameStateManager modifies game state
const message = window.GameStateManager.movePlayerWithEffects(playerId, destination, visitType);

// ✅ FixedApp manages state, GameManager receives props
const [gameState, gameStateManager] = window.useGameState();
React.createElement(GameManager, { gameState, gameStateManager });

// ✅ Event-driven communication with defensive handling
GameStateManager.emit('playerMoved', {player, newSpace});
useEventListener('playerMoved', ({ player, playerId, newSpace, toSpace }) => {
    const targetPlayer = player || gameState.players?.find(p => p.id === playerId);
    if (targetPlayer) handlePlayerMoved(targetPlayer, newSpace || toSpace);
});

// ❌ Direct mutations forbidden
player.money += amount;  // FORBIDDEN
```

### Forbidden Patterns
- ❌ **Magic strings** - no hardcoded space names in JS
- ❌ **Hardcoded values** - use CSV data only
- ❌ **Unsafe DB access** - always check loading state
- ❌ **Custom card rendering** - use unified Card/CardGrid components
- ❌ **Direct state mutations** - use GameStateManager methods only
- ❌ **Component-to-component calls** - use events only
- ❌ **Duplicate useGameState calls** - FixedApp only
- ❌ **Large components** - split if >500 lines
- ❌ **fontSize arithmetic** - parseInt() before calculations

## Loading Order
1. CSS (unified-design.css)
2. CSVDatabase system 
3. GameStateManager
4. Utilities (CardUtils.js)
5. Engines (MovementEngine.js, EffectsEngine.js)
6. Card system (Card.js, CardGrid.js)
7. UI components
8. Main App

## Architecture Principles
- **Event-Driven**: Components communicate via events, not direct calls
- **CSV-as-Database**: All game data in CSV files
- **Single State Source**: GameStateManager only
- **Immutable Updates**: All state changes create new objects
- **Unified Components**: Use Card/CardGrid for all card displays

## Documentation
- **CLAUDE.md**: Technical reference (this file)
- **DEVELOPMENT.md**: Status tracking
- **TECHNICAL_DEEP_DIVE.md**: Architecture details

## Recent Work Log

### 2025-08-15: Card System Bug Fixes

**UI Rendering Bug Fix: Cards Not Disappearing From Hand**
- **Symptom**: Used cards were not being removed from the player's hand in the UI.
- **Root Cause**: A React re-rendering issue in the `CardsInHand` component.
- **Solution**: Implemented a forced re-render mechanism using an `updateCounter` state variable in the `CardsInHand` component to ensure the UI updates correctly after a card is used.

**Dice Effect Bug Fix: Automatic Life Card Not Awarded**
- **Symptom**: On PM-DECISION-CHECK space, rolling a 1 was not automatically adding a Life card.
- **Root Cause**: The dice roll logic in `DiceRollSection.js` was not correctly identifying the `l_cards` effect type.
- **Solution**: Updated the condition to `effect.effect_type === 'cards' || effect.effect_type.endsWith('_cards')`.

### 2025-08-15: Critical Movement System Fix

**Major Bug Fix**: Resolved movement failure from choice-type spaces like PM-DECISION-CHECK

**Root Cause Identified**:
- **MovementEngine Classification**: PM-DECISION-CHECK was correctly classified as "Logic" space due to containing "DECISION-CHECK"
- **Empty Movement Bug**: `getLogicMoves()` function returned empty array `[]`, preventing all movement from Logic spaces
- **TurnControls Dependency**: End Turn button requires `availableMoves.length > 0` to execute movement
- **Preserved Selection Lost**: User's selected destination (ARCH-INITIATION) was correctly stored but never used

**Technical Solution**:
- **MovementEngine.js Fix**: Modified `getLogicMoves()` to read actual destinations from CSV data instead of returning empty array
- **Destination Preservation**: Enhanced GameStateManager to preserve selectedDestination across state updates
- **Early Return Logic**: Added protection against unwanted turn reinitialization that wipes stored destinations

**Files Modified**:
- **game/js/utils/MovementEngine.js**: Fixed `getLogicMoves()` function (lines 282-293)
- **game/js/data/GameStateManager.js**: Enhanced `initializeTurnActions()` with preservation logic and early return
- **Architecture Compliance**: Maintains event-driven patterns and CSV-as-database principles

### 2025-08-14: Card Replacement System Implementation

**Major Achievement**: Fully functional card replacement system with event-driven architecture

**Components Implemented**:
- **CSV Parsing**: Fixed `ComponentUtils.js` to properly handle `replace` condition from CSV data
- **Button Text**: "Replace 1 E Card" now displays correctly instead of "Draw 1 E Card"
- **CardReplacementModal**: Event-driven modal using `useEventListener` and `emit` patterns
- **GameStateManager**: Added `handleShowCardReplacement()` and `handleCardReplacementConfirmed()` methods
- **Event Flow**: `showCardReplacement` → `showCardReplacementModal` → `cardReplacementConfirmed`

**Technical Details**:
- **Data-Driven**: CSV `condition: 'replace'` now properly parsed and handled
- **Architecture Compliant**: Uses existing event patterns, follows GameStateManager as single source of truth
- **UI Integration**: Modal shows player's cards for selection, integrates with acknowledgment system
- **Defensive Programming**: Prevents infinite recursion, handles edge cases (no cards to replace)

### 2025-08-13: Bug Fixes & Unified Card System

**Completed**:
- **DICE_EFFECTS.csv Data Integrity**: Fixed column headers for L/E card filtering
- **Card.js fontSize Bug**: Added parseInt() parsing to prevent NaN values  
- **CardAcknowledgmentModal**: Unified with main Card component (removed 190+ lines)
- **Card Height Restrictions**: Removed truncation for full content display
- **Dice-Based Actions**: Enhanced filtering logic with debug capabilities
- **Event Integration**: Added `playerActionTaken` events for turn progression

### 2025-08-10: Conditional Card Drawing & Manual Funding

**Major Features**:
- **Conditional Logic**: Implemented scope-based B/I card distribution (≤$4M vs >$4M)
- **Manual Funding**: Player-controlled funding card draw buttons
- **State Tracking**: Prevents duplicate draws, integrates with turn system
- **UX Enhancement**: Contextual button messaging based on project scope



### 2025-08-08: Data-Driven Card Actions & Manual Dice Buttons

**Achievement**: Fixed missing manual dice action buttons using data-driven approach

**Solution**:
- **Data Layer**: Added `trigger_type` column to SPACE_EFFECTS.csv
- **Logic**: Replaced hardcoded space arrays with CSV-driven filtering
- **Component Utils**: Enhanced condition evaluation for player-choice actions
- **Result**: PM-DECISION-CHECK, INVESTOR-FUND-REVIEW, LEND-SCOPE-CHECK buttons now display correctly

### 2025-08-06: Data-Driven Card Activation & Documentation Cleanup

**Card Activation Refactoring**:
- **Problem**: Hardcoded `if (cardType !== 'E')` logic violated data-driven principles
- **Solution**: Used CSV `activation_timing` column for behavior control
- **Changes**: E cards → "Player Controlled", others → "Immediate"
- **Result**: Fully data-driven card activation system

**Documentation Consolidation**:
- Cleaned up 8 .md files, removed duplication and outdated information
- Updated architecture status, streamlined development docs



### 2025-08-05: Critical Bug Fixes

**Major Fixes**:
- **Turn Counter**: Fixed to represent game rounds (not individual player turns)
- **Card Effect Duplication**: Eliminated duplicate E card processing
- **Skip Turn**: Complete implementation for L014, E029, E030 cards
- **UI State**: Fixed turn display and negotiate button rendering
- **Reference Errors**: Fixed cardCount variable issues



---

**Current Status**: Production-ready game with unified card system, data-driven architecture, and comprehensive bug fixes.