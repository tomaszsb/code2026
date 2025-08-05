# TECHNICAL_DEEP_DIVE.md - Project Hub NYC PM Game

This document provides comprehensive technical analysis of the game's core systems: Card Lifecycle Management and Turn Sequence Orchestration. It serves as a definitive reference for understanding system mechanics, architectural patterns, and implementation details including identified technical debt and optimization opportunities.

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

### 1.4. Technical Debt Assessment

*   **Concern 1: Duplicate 'E' Card Logic - RESOLVED:**
    *   **Description:** The `handleUseCard` function in `CardsInHand.js` contained logic for processing 'E' card effects (money and time updates) that was duplicated in `EffectsEngine.js` (`applyEfficiencyEffect`). This violated the Single Source of Truth principle and created maintenance overhead.
    *   **Resolution:** Refactored `CardsInHand.js` to remove duplicated effect processing logic. The `handleUseCard` function now delegates effect application entirely to the unified `GameStateManager.usePlayerCard()` system, eliminating code duplication and establishing single source of truth for card effects.

*   **Concern 2: Hardcoded vs. Data-Driven Card Behavior:**
    *   **Description:** The `GameStateManager.addCardsToPlayer` function contains a hardcoded check (`if (cardType !== 'E')`) to determine if a card's effects are immediate or player-controlled. This means adding a new player-controlled card type would require code modification, breaking the data-driven philosophy.
    *   **Reasoning:** This reflects a business rule that 'E' cards are unique in their player-controlled activation.
    *   **Proposed Solution:** Leverage the existing `activation_timing` column in `cards.csv` (column 42). Modify `GameStateManager.addCardsToPlayer` to read `card.activation_timing` (e.g., 'Immediate' or 'Player_Controlled') instead of hardcoding the 'E' card type. This makes the behavior fully data-driven and extensible.

## 2. Turn Management Architecture

The end-of-turn sequence is a critical orchestration of events that transitions the game from one player's actions to the next, including automatic movement and re-evaluation of game state.

### 2.1. Turn Termination Logic

1.  **Component:** `TurnControls.js`
2.  **User Action:** The player clicks the "End Turn" button.
3.  **Pre-conditions:**
    *   The button's enabled state is controlled by `gameState.currentTurn.canEndTurn`, which is `true` only when all `requiredActions` for the current turn have been `completed`.
    *   A check prevents ending the turn if the player is on a "Logic" space and has not yet made a required decision.

### 2.2. Movement Orchestration

1.  **Location:** `handleEndTurn` function within `TurnControls.js`.
2.  **Movement Calculation:** It uses `movementEngine.getAvailableMoves(currentPlayer)` to determine the possible next spaces based on the current player's position and game rules.
3.  **Orchestration:** If available moves exist, it selects the first one and calls `gameStateManager.movePlayerWithEffects()`. This is a crucial, high-level method in `GameStateManager` that encapsulates several sub-steps:
    *   Updates the player's `position` and `visitType` in the game state.
    *   Saves a snapshot of the player's state (`spaceEntrySnapshot`) for potential "negotiation" (reverting to previous state with a penalty).
    *   Processes all `SPACE_EFFECTS.csv` entries for the *new* space (e.g., applying time costs, drawing cards, money changes).
    *   Emits a `playerMovedWithEffects` event.
4.  **Visual Delay:** A small `setTimeout` (50ms) is used to allow the UI to visually update the player's movement before the turn officially concludes.
5.  **Design Implication:** This design means that player movement is an *automatic consequence* of ending a turn, not a separate player action.

### 2.3. State Transition Processing

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

### 2.4. Action Requirement Calculation

1.  **Location:** `GameStateManager.js` (`endTurn` calls this immediately after advancing the turn).
2.  **`GameStateManager.js` (`initializeTurnActions`):**
    *   This function determines the `requiredActions` for the `nextPlayer` based on the effects defined for their current `position` and `visitType` in the `GAME_CONFIG.csv` and `SPACE_EFFECTS.csv` (e.g., if the space requires a dice roll, or specific card actions).
    *   It updates the `gameState.currentTurn` object with these new requirements, setting the `actionCounts` and `canEndTurn` flag for the new player's turn.
    *   It emits a `turnActionsInitialized` event.

### 2.5. Event-Driven UI Synchronization

*   Throughout this sequence, various React components (e.g., `PlayerStatusPanel`, `ActionPanel`, `TurnControls` itself) are listening for `stateChanged`, `playerMoved`, `turnAdvanced`, and `turnActionsInitialized` events from the `GameStateManager`. They re-render dynamically to reflect the new player, their position, updated resources, and the actions required for their turn.

## 3. Implementation Status & Findings (2025-08-05)

This section documents the current implementation status of the architectural concerns identified above, based on codebase review.

### 3.1. Concern 1: Duplicate 'E' Card Logic - **CONFIRMED**

**Status**: The duplicate logic concern is **validated** in the current implementation.

**Evidence**:
*   **Location**: `/mnt/d/unravel/current_game/code2026/game/js/components/CardsInHand.js:86-122`
*   **Duplicate Processing**: The `handleUseCard` function manually processes money and time effects:
    ```javascript
    // Process general money effects
    if (card.money_effect) {
        const moneyEffect = parseInt(card.money_effect) || 0;
        effects.money += moneyEffect;
    }
    
    // Process time effects  
    if (card.time_effect) {
        const timeEffect = parseInt(card.time_effect) || 0;
        effects.time += timeEffect;
    }
    ```
*   **Parallel Implementation**: `EffectsEngine.js` contains `applyEfficiencyEffect()` method that handles identical E card processing through proper GameStateManager delegation.
*   **Maintenance Risk**: Changes to E card effect logic must be made in two places, violating the Single Source of Truth principle.

**Impact**: Creates technical debt and increases maintenance overhead. The system functions correctly but violates architectural consistency.

### 3.2. Concern 2: Hardcoded vs. Data-Driven Card Behavior - **CONFIRMED**

**Status**: The hardcoded behavior concern is **validated** in the current implementation.

**Evidence**:
*   **Location**: `/mnt/d/unravel/current_game/code2026/game/js/data/GameStateManager.js:279`
*   **Hardcoded Logic**: 
    ```javascript
    if (cardType !== 'E') {
        // Apply immediate effects for W, B, I, L cards
        cardsToAdd.forEach(card => {
            // Process effects...
        });
    }
    ```
*   **Data Available**: `cards.csv` contains `activation_timing` column (column 42) with "Immediate" values, but this data is **not utilized** for behavioral decisions.
*   **Extensibility Issue**: Adding new player-controlled card types requires code modification instead of CSV data changes.

**Impact**: Violates the CSV-as-Database philosophy and reduces system flexibility. New card activation patterns require development work rather than content updates.

### 3.3. Current System Assessment

**Overall Architecture**: The system successfully implements the CSV-as-Database philosophy for most game content, with clean separation between data and logic. The hybrid state management approach works effectively.

**Technical Debt Areas**:
1. **Effect Processing Duplication**: E card effects processed in both UI components and EffectsEngine
2. **Mixed Data-Driven Patterns**: Most card behavior is data-driven, but activation timing remains hardcoded

**System Functionality**: Both concerns represent architectural inconsistencies rather than functional bugs. The game operates correctly but has maintainability and extensibility limitations.

**Recommended Refactoring Priority**: 
1. **High**: Eliminate duplicate E card logic to establish single source of truth
2. **Medium**: Implement data-driven activation timing to complete CSV-as-Database transition
