# TECHNICAL ARCHITECTURE REFERENCE

**Status**: Current system architecture and design patterns for Project Hub NYC PM Game.

**Purpose**: Deep-dive architectural reference for core game systems. For current implementation details and recent work, see `CLAUDE.md`.

## 1. Card System Architecture

The card system is a highly data-driven and intricate part of the game, governing how players acquire, manage, and use various types of cards to influence game state.

### 1.1. Data Layer: Card Definitions

*   **Single Source of Truth:** `cards.csv` is the definitive source for all card data. Each row represents a unique card, defining its type (`W`, `B`, `I`, `L`, `E`), name, description, and most importantly, its mechanical effects.
*   **`immediate_effect` Column:** This crucial column dictates the primary behavior of a card when it's processed. Values like `Apply Work`, `Apply Loan`, `Apply Card` (for Expeditor cards) direct the `EffectsEngine` to the appropriate logic.
*   **Data-Driven Effects:** All numerical and conditional effects (e.g., `loan_amount`, `work_cost`, `money_effect`, `time_effect`) are specified directly in the CSV. The game logic reads these values; it does not contain them.
*   **Card Categories:**
    *   **Immediate Effect Cards (W, B, I, L):** These cards apply their effects automatically upon being drawn. Their values (e.g., `loan_amount` for 'B' cards, `work_cost` for 'W' cards) are immediately processed by `GameStateManager.addCardsToPlayer`.
    *   **Player-Controlled Cards (E - Expeditor):** These are the only cards that remain in the player's hand for strategic, player-initiated use. Their effects are triggered only when the player explicitly chooses to use them.

### 1.2. Card Acquisition Pipeline

1.  **Trigger:** Card draws are typically initiated by game events, such as landing on specific spaces or certain dice roll outcomes.
2.  **`GameManager.js` (`drawCardsForPlayer`):** This function is responsible for fetching and preparing cards for a player.
    *   It receives the `playerId`, `cardType` (e.g., 'W'), and `amount` to draw.
    *   It queries `window.CSVDatabase.cards` to retrieve available cards of the specified type.
    *   It randomly selects the required number of cards from the returned list.
3.  **`GameStateManager.js` (`addCardsToPlayer`):** This is the critical state-mutation method for adding cards.
    *   It adds the drawn card objects to the player's `cards` object, categorized by `card_type` (e.g., `player.cards.W.push(card)`).
    *   **Immediate Effect Processing:** For `W`, `B`, `I`, and `L` cards, this method *immediately* processes their associated effects (e.g., `loan_amount`, `investment_amount`, `money_effect`, `time_effect`) and updates the player's `money` and `timeSpent` accordingly.
    *   It emits a `cardsAddedToPlayer` event, notifying other components of the change.
4.  **UI Update:** React components (e.g., `CardsInHand.js`) listen for `stateChanged` events (which `GameStateManager.setState` emits after any state update) and re-render to display the newly acquired cards and updated player resources.

### 1.3. Card Usage Orchestration

1.  **UI Interaction:** Players initiate the use of an 'E' card by clicking a "Use" button within the `CardsInHand.js` component.
2.  **`CardsInHand.js` (`handleUseCard`):**
    *   Performs a `phase_restriction` check against the current game phase (from `GAME_CONFIG.csv`) to ensure the card can be used.
    *   Emits a `useCard` event to the `GameStateManager`.
3.  **`GameStateManager.js` (`usePlayerCard`):** This method orchestrates the card's effect application.
    *   It retrieves the full card object from the player's hand.
    *   It reads the `immediate_effect` property from the card data.
    *   **Safe Routing:** It uses a `switch` statement to call the appropriate, specialized method within `window.EffectsEngine` (e.g., `EffectsEngine.applyEfficiencyEffect`, `EffectsEngine.applyCardEffect`). This ensures that `EffectsEngine` methods are called correctly based on the card's defined behavior.
4.  **`EffectsEngine.js` (`applyWorkEffect`, `applyLoanEffect`, `applyEfficiencyEffect`, `applyCardEffect`, etc.):**
    *   These methods receive the card data and extract the specific effect values (e.g., `money_effect`, `time_effect`, `discard_cards`).
    *   Crucially, these methods *do not directly modify game state*. Instead, they call the appropriate state-mutation methods on `window.GameStateManager` (e.g., `GameStateManager.updatePlayerMoney`, `GameStateManager.updatePlayerTime`, `GameStateManager.forcePlayerDiscard`). This maintains `GameStateManager` as the single authority for state changes.
5.  **`GameStateManager.js` (`removeCardFromHand`):** After the effects are successfully applied, `usePlayerCard` calls this method to remove the used card from the player's hand.
6.  **UI Update:** The `stateChanged` event propagates, causing the UI to update, reflecting the removed card and any changes to player resources.

### 1.4. Card Acknowledgment & Unified Drawing System

**Major Achievement (2025-08-13)**: Successfully implemented unified card acknowledgment system that ensures all drawn cards are properly acknowledged before being added to player hands, eliminating immediate effect duplication.

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

### 1.5. Current Architecture Status

**All major technical debt resolved as of 2025-08-13:**

*   ✅ **Unified Card Processing**: Single source of truth through GameStateManager.usePlayerCard()
*   ✅ **Data-Driven Activation**: CSV `activation_timing` column controls card behavior
*   ✅ **Unified Card Acknowledgment**: All card draws use consistent modal display system
*   ✅ **Conditional Logic**: Scope-based B/I card distribution working correctly
*   ✅ **Manual Funding Control**: Player-initiated funding card acquisition implemented
*   ✅ **fontSize Bug Resolution**: All React warnings eliminated with parseInt() parsing
*   ✅ **Card Height Restrictions**: Removed truncation for full content display

### 1.6. Unified Card Component System Implementation

**Major Implementation (2025-08-13)**: Completed unified card system with comprehensive effect rendering and resolved critical display bugs throughout the UI.

**CardAcknowledgmentModal Unified Integration**:
- **Problem**: "Card Drawn" modal used custom rendering (190+ lines), different appearance from other cards
- **Solution**: Replaced entire custom card display with unified Card component
- **Implementation**:
  ```javascript
  // BEFORE - 190+ lines of custom rendering
  React.createElement('div', { /* complex custom card layout */ });
  
  // AFTER - Clean unified approach
  React.createElement(window.Card, {
      card: card,
      size: 'large',
      onClick: handleCardClick
  });
  ```
- **Benefits**: Visual consistency, comprehensive effects display, maintainable codebase

**Card.js fontSize Bug Resolution**:
- **Problem**: React warning "NaN is an invalid value for the fontSize css style property"
- **Root Cause**: Arithmetic operations on fontSize strings like '12px' - 1 = NaN
- **Solution**: Added parseInt() parsing before calculations
- **Locations Fixed**: Effect description, flavor text, phase restriction indicator, action buttons
- **Technical Fix**:
  ```javascript
  // BEFORE
  fontSize: sizeConfig.fontSize - 1
  
  // AFTER  
  fontSize: parseInt(sizeConfig.fontSize) - 1 + 'px'
  ```

**Card Height Restrictions Removal**:
- **Problem**: Large cards in modals not showing full content due to height constraints
- **Root Cause**: `minHeight` and `WebkitLineClamp` properties truncating text content
- **Changes Made**:
  - Removed `minHeight: sizeConfig.minHeight` from cardStyle
  - Removed `WebkitLineClamp` from card-name, card-description, card-effects, card-flavor
  - Changed `overflow: 'hidden'` to `overflow: 'visible'`
- **Result**: Complete card information display without truncation

## 2. Phase 22 Systems - LIFE Card Mechanics & CSV Data Consistency ✅ NEW (2025-08-13)

The Phase 22 development cycle resolved critical LIFE card button logic issues and established unified CSV data consistency across the entire card action system, ensuring reliable dice-based interactions and proper manual/automatic action distinctions.

### 2.1. LIFE Card Button Logic Resolution

**Problem Addressed:** PM-DECISION-CHECK LIFE card buttons were not following the specified behavior:
- **Expected:** Roll = 1 → automatic L card draw, Roll ≠ 1 → no manual button appears
- **Actual:** Manual L card buttons appeared regardless of dice roll results due to incorrect filtering logic

**Root Cause Analysis:**
```javascript
// ISSUE: isDiceBasedAction() returned false for L cards
🔍 isDiceBasedAction: Checking for card type "L" at space "PM-DECISION-CHECK"
🔍 isDiceBasedAction: Result for card type "L" is: false
🔍 FILTER DEBUG: Layer 2B - Pure manual action for L: SHOW

// EXPECTED: Should use Layer 2A (manual + dice-based) filtering
🔍 FILTER DEBUG: Layer 2A - Manual + dice-based action for L
```

**Technical Solution Architecture:**

**1. CSV Data Consistency Fixes** (DICE_EFFECTS.csv):
```csv
# BEFORE: Mismatched effect_type values
PM-DECISION-CHECK,First,cards,L,Draw 1,No change,No change...

# AFTER: Consistent with SPACE_EFFECTS.csv  
PM-DECISION-CHECK,First,l_cards,L,Draw 1,No change,No change...
```

**2. Unified Data Access Pattern** (CardActionsSection.js):
```javascript
// BEFORE: Direct data array access
const diceEffects = window.CSVDatabase.diceEffects.data || [];
const matchingEffect = diceEffects.find(row => /* manual filtering */);

// AFTER: Unified query method with built-in filtering
const diceEffects = window.CSVDatabase.diceEffects.query({
    space_name: currentPlayer.position,
    visit_type: currentPlayer.visitType || 'First',
    card_type: cardAction.type
});
const matchingEffect = diceEffects.length > 0 ? diceEffects[0] : null;
```

**3. Enhanced Effect Type Recognition** (DiceRollSection.js):
```javascript
// BEFORE: Only recognized automatic cards
if (effect.effect_type === 'cards' && effect.card_type)

// AFTER: Recognizes all card effect types  
if ((effect.effect_type === 'cards' || effect.effect_type.endsWith('_cards')) && effect.card_type)
```

### 2.2. CSV Data Consistency Resolution

**Problem Addressed:** Multiple spaces had mismatched `effect_type` values between SPACE_EFFECTS.csv and DICE_EFFECTS.csv, breaking data lookups and preventing proper dice button rendering.

**Affected Spaces & Fixes:**
- **PM-DECISION-CHECK:** `cards` → `l_cards` (manual LIFE card actions)
- **LEND-SCOPE-CHECK:** `cards` → `l_cards` and `e_cards` (manual actions)  
- **OWNER-SCOPE-INITIATION:** Kept as `cards` (automatic dice processing)
- **INVESTOR-FUND-REVIEW:** Kept as `cards` (automatic dice processing)

**Data Architecture Rules Established:**
- **Automatic Dice Spaces:** Use `effect_type: 'cards'` for DiceRollSection.js automatic processing
- **Manual Action Spaces:** Use specific prefixes (`l_cards`, `e_cards`) to match SPACE_EFFECTS.csv trigger types
- **Single Source of Truth:** CSV data drives all button visibility and filtering decisions

### 2.3. Layer 2A/2B Filtering Logic Correction

**Problem Addressed:** LIFE cards were incorrectly using Layer 2B (pure manual) filtering instead of Layer 2A (manual + dice-based) filtering, causing buttons to appear when they should be hidden.

**Filtering Logic Flow:**
```javascript
// Layer 2A: Manual + dice-based actions (CORRECT for L cards)
if (cardAction.trigger_type === 'manual' && isDiceBasedAction(cardAction)) {
    return isDiceBasedManualActionAvailable(cardAction); // Check dice results
}

// Layer 2B: Pure manual actions (for E cards only)
if (cardAction.trigger_type === 'manual') {
    return true; // Always show non-dice manual actions
}
```

**Result:** L cards now properly check dice roll results before showing manual buttons.

## 3. Conditional Card Drawing & Manual Funding Architecture

**Core Pattern**: Scope-based conditional card distribution with player-controlled timing at OWNER-FUND-INITIATION space.

### 2.1. Conditional Card Drawing System

**Problem Addressed:** OWNER-FUND-INITIATION space was drawing both Bank (B) and Investment (I) cards simultaneously from mutually exclusive conditions, violating the business rule that project scope should determine funding type exclusively.

**Solution Architecture:**

**1. Conditional Logic Engine** (GameStateManager.js):
```javascript
// Condition evaluation with defensive programming
evaluateEffectCondition(condition, player) {
    if (!condition || !player) return true;
    
    switch (condition) {
        case 'scope_le_4M': 
            return (player.scope || 0) <= 4000000;
        case 'scope_gt_4M': 
            return (player.scope || 0) > 4000000;
        default: 
            return true; // Allow unknown conditions
    }
}

// Mutually exclusive effect processing
processMutuallyExclusiveCardEffects(playerId, effects) {
    const player = this.state.players.find(p => p.id === playerId);
    const messages = [];
    
    for (const effect of effects) {
        if (this.evaluateEffectCondition(effect.condition, player)) {
            const message = this.processSpaceEffect(playerId, effect);
            if (message) messages.push(message);
            break; // Process only the FIRST matching condition
        }
    }
    return messages;
}
```

**2. Data Layer Integration** (SPACE_EFFECTS.csv):
- Fixed card_type column assignments for proper conditional routing
- B cards: `condition: scope_le_4M` (projects ≤$4M get Bank funding)  
- I cards: `condition: scope_gt_4M` (projects >$4M get Investment funding)

### 2.2. Manual Funding Card Draw System

**Problem Addressed:** Funding cards were automatically drawn on space entry, removing strategic player decision-making from the funding acquisition process.

**Solution Implementation:**

**1. GameStateManager Integration:**
```javascript
triggerFundingCardDraw(playerId) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.position !== 'OWNER-FUND-INITIATION') {
        return [];
    }
    
    // Process conditional effects and track completion
    const messages = this.processMutuallyExclusiveCardEffects(playerId, mutuallyExclusiveEffects);
    
    if (messages.length > 0) {
        // Mark space actions as completed to prevent button reappearance
        this.setState({
            currentTurn: {
                ...this.state.currentTurn,
                fundingCardDrawnForSpace: true,
                spaceActionsCompleted: true
            }
        });
        
        // Emit turn completion event
        this.emit('playerActionTaken', {
            playerId: playerId,
            actionType: 'card',
            actionData: { source: 'funding_card_draw', cardType: mutuallyExclusiveEffects[0]?.card_type }
        });
    }
    
    return messages;
}
```

**2. UI Integration** (CardActionsSection.js):
- Dynamic button text based on project scope: "Get Bank Card" (≤$4M) vs "Get Investment Card" (>$4M)
- Contextual tooltips explaining funding thresholds
- Button visibility controlled by `fundingCardDrawnForSpace` state
- Integration with existing card action filtering system

### 2.3. Space Action Completion System

**Problem Addressed:** Bank/Investor buttons reappeared after funding card draw completion, allowing duplicate card acquisition.

**Solution Features:**
- **State Persistence:** `spaceActionsCompleted` property prevents button reappearance after funding card draw
- **State Reset Logic:** Automatic reset on turn changes and space movement
- **Integration Points:** Works with existing `getFilteredCardActions()` filtering system
- **Defensive Programming:** Multiple validation layers to prevent state corruption

### 2.4. Benefits Achieved

**✅ Business Logic Integrity:** Project scope now correctly determines exclusive funding type (B or I cards)
**✅ Player Agency:** Funding decisions require deliberate player action and strategic timing
**✅ State Consistency:** Button visibility accurately reflects completion status across turn cycles
**✅ Turn Integration:** Manual actions seamlessly integrate with existing turn progression system
**✅ Data-Driven Architecture:** All conditional logic controlled by CSV data, not hardcoded business rules
**✅ Extensibility:** Conditional system supports unlimited new conditions and mutually exclusive effect groups

## 3. Data-Driven Card Actions Filtering System ✅ (2025-08-08)

The card actions filtering system is a sophisticated data-driven architecture that controls the visibility and availability of manual card action buttons across different game spaces. This system was completely refactored in August 2025 to eliminate hardcoded business logic and implement CSV-controlled filtering.

### 3.1. Architecture Overview

**Problem Solved:** Previously, CardActionsSection.js used hardcoded arrays (`allowDiceActionsSpaces = ['INVESTOR-FUND-REVIEW', 'LEND-SCOPE-CHECK']`) to determine which spaces should display manual dice action buttons. This approach was brittle, required code changes for new spaces, and violated the CSV-as-database philosophy.

**Solution Implemented:** A three-layer data-driven pipeline:
1. **Data Layer**: `SPACE_EFFECTS.csv` with `trigger_type` column
2. **Processing Layer**: `ComponentUtils.getCardTypes()` with condition evaluation  
3. **Filtering Layer**: `CardActionsSection.js` with trigger_type-based filtering

### 3.2. Data-Driven Button Control

**SPACE_EFFECTS.csv Fields:**
- **`trigger_type`**: Controls button visibility (`manual` = show button, `auto` = automatic, blank = condition-based)
- **`condition`**: Defines trigger requirements (`roll_1`, `roll_2`, `replace`, `always`, etc.)
- **`use_dice`**: Indicates dice-based mechanics integration

### 3.3. Condition Evaluation System

**Two-Tier Condition Logic:**
- **Game State Conditions**: Evaluated against current player state (`scope_le_4M`, `scope_gt_4M`)
- **Player Choice Conditions**: Always display buttons for player decision (`roll_1`, `roll_2`, `replace`)

### 3.4. Architecture Benefits

**Data-Driven Filtering**: Replaced hardcoded space arrays with CSV `trigger_type` column control
**Extensible Design**: Easy to add new trigger types without code changes  
**Maintainable**: New spaces require only CSV updates
**Robust**: Single source of truth eliminates inconsistencies
**Debuggable**: Comprehensive logging system traces filtering pipeline from CSV to UI

## 4. Turn Management Architecture

The end-of-turn sequence is a critical orchestration of events that transitions the game from one player's actions to the next, including automatic movement and re-evaluation of game state.

### 4.1. Turn Termination Logic

1.  **Component:** `TurnControls.js`
2.  **User Action:** The player clicks the "End Turn" button.
3.  **Pre-conditions:**
    *   The button's enabled state is controlled by `gameState.currentTurn.canEndTurn`, which is `true` only when all `requiredActions` for the current turn have been `completed`.
    *   A check prevents ending the turn if the player is on a "Logic" space and has not yet made a required decision.

### 4.2. Movement Orchestration

1.  **Location:** `handleEndTurn` function within `TurnControls.js`.
2.  **Movement Calculation:** It uses `movementEngine.getAvailableMoves(currentPlayer)` to determine the possible next spaces based on the current player's position and game rules.
3.  **Orchestration:** If available moves exist, it selects the first one and calls `gameStateManager.movePlayerWithEffects()`. This is a crucial, high-level method in `GameStateManager` that encapsulates several sub-steps:
    *   Updates the player's `position` and `visitType` in the game state.
    *   Saves a snapshot of the player's state (`spaceEntrySnapshot`) for potential "negotiation" (reverting to previous state with a penalty).
    *   Processes all `SPACE_EFFECTS.csv` entries for the *new* space (e.g., applying time costs, drawing cards, money changes).
    *   Emits a `playerMovedWithEffects` event.
4.  **Visual Delay:** A small `setTimeout` (50ms) is used to allow the UI to visually update the player's movement before the turn officially concludes.
5.  **Design Implication:** This design means that player movement is an *automatic consequence* of ending a turn, not a separate player action.

### 4.3. State Transition Processing

1.  **Location:** `handleEndTurn` in `TurnControls.js`.
2.  **Event Emission:** After the automatic movement (or if no movement was required), `TurnControls.js` emits a `turnEnded` event to the `GameStateManager`:
    ```javascript
    gameStateManager.emit('turnEnded', { playerId: currentPlayer.id });
    ```
3.  **`GameStateManager.js` (`endTurn`):** This method is the primary listener for the `turnEnded` event.
    *   It identifies the `currentPlayer`.
    *   It calculates the `nextPlayer` by cycling through the `this.state.players` array.
    *   It updates the global `currentPlayer` ID in the game state to the `nextPlayer.id`.
    *   It emits a `turnAdvanced` event, providing both the `previousPlayer` and the `currentPlayer` to allow other components to react to the turn change.

### 4.4. Action Requirement Calculation

1.  **Location:** `GameStateManager.js` (`endTurn` calls this immediately after advancing the turn).
2.  **`GameStateManager.js` (`initializeTurnActions`):**
    *   This function determines the `requiredActions` for the `nextPlayer` based on the effects defined for their current `position` and `visitType` in the `GAME_CONFIG.csv` and `SPACE_EFFECTS.csv` (e.g., if the space requires a dice roll, or specific card actions).
    *   It updates the `gameState.currentTurn` object with these new requirements, setting the `actionCounts` and `canEndTurn` flag for the new player's turn.
    *   It emits a `turnActionsInitialized` event.

### 4.5. Event-Driven UI Synchronization

*   Throughout this sequence, various React components (e.g., `PlayerStatusPanel`, `ActionPanel`, `TurnControls` itself) are listening for `stateChanged`, `playerMoved`, `turnAdvanced`, and `turnActionsInitialized` events from the `GameStateManager`. They re-render dynamically to reflect the new player, their position, updated resources, and the actions required for their turn.