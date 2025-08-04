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

**For detailed development history see DEVELOPMENT.md**  
**For verification procedures see VERIFICATION_PLAN.md**

**Architecture: Clean CSV architecture, specialized engines, single source of truth state management.**