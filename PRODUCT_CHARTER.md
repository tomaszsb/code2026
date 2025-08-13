# Product Charter: Project Hub NYC PM Game

## 1. Core Vision & Product Identity

*   **Product Statement:** An educational and competitive digital board game that simulates the complex, high-stakes world of New York City project management.
*   **Core Purpose:** To serve as a learning tool for university courses, professional training programs, and as a preparatory tool for clients of architectural and construction firms.
*   **The Player Experience:** The initial gameplay is intentionally overwhelming, designed to foster an appreciation for the complexity of the PM role. The game is designed for high replayability, allowing players to evolve from surviving to strategizing and, ultimately, mastering the systems.

## 2. Target Audience & Use Cases

*   **Primary:** University students in project management or related fields.
*   **Secondary:** Industry professionals (architects, contractors) using it as a client education tool.
*   **Tertiary:** Experienced PMs using it as a competitive simulation to test their efficiency against peers.

## 3. Game Objectives & "Winning"

The primary goal is to successfully navigate a project from initiation to completion. However, "winning" is not just about finishing; it's about **efficiency**.

A player's success is measured by a **Normalized Performance Score** that balances the final project value against the resources (time and money) consumed. This allows for meaningful comparison between projects of different scales and complexities.

## 4. Key Mechanics & Gameplay Feel

*   **Core Loop:** Players manage resources (Time, Money), draw and play cards (Work, Bank, Investor, Life, Expeditor), and move across a game board representing the project lifecycle.
*   **Strategic Feel:** The game is a constant balancing act. Players must make strategic trade-offs, manage risk (e.g., the "Cheat" path), and react to unforeseen events introduced by "Life" cards and complex space effects.
*   **Data-Driven World:** Every card, space, and effect is defined in `.csv` files, creating a dynamic and easily modifiable game world.

## 5. Architectural Philosophy

*   **"No Build Step" Prototyping:** The architecture (React via CDN, in-browser Babel) is intentionally simple to allow for rapid development and iteration without complex build configurations.
*   **"CSV-as-Database":** The game's strongest architectural feature. All game content and balancing parameters are stored in `.csv` files, cleanly separating game data from game logic. This allows for easy updates by non-developers.
*   **Hybrid State Management:** The game uses a pragmatic hybrid model. A global, singleton `GameStateManager` serves as the central source of truth for game logic, while React is used for rendering the UI. This was chosen to handle the complex, event-driven nature of a board game.
*   **Known Risk:** The reliance on a global `GameStateManager` can create initialization race conditions. New features must be designed carefully to avoid exacerbating this risk.

## 6. Current Feature Development: UI Polish & Enhancement

**Recent Completions (2025-08-13):**
*   **✅ Unified Card System:** Implemented consistent card display across all UI contexts using Card.js and CardGrid.js components
*   **✅ Comprehensive Effect Rendering:** All 20+ CSV effect fields now properly displayed with intelligent parsing
*   **✅ Visual Phase Indicators:** Color-coded phase restrictions and enhanced card styling  
*   **✅ Critical Bug Fixes:** Resolved React fontSize warnings, height restrictions, and modal consistency issues
*   **✅ Enhanced User Experience:** Cards now display full content without truncation, maintaining professional appearance

**Next Priority: The Performance Dashboard**
*   **Objective:** To implement a real-time dashboard that displays the **Normalized Performance Score**, providing players with immediate feedback and fostering a competitive environment.
*   **Proposed Formula:** `score = moneyRemaining - (timeSpent * 100)` (derived from `WinConditionManager.js`).
*   **Implementation Strategy:**
    *   **Logic:** Create a new `js/utils/PerformanceUtils.js` file to house the calculation logic, keeping `GameStateManager` clean.
    *   **UI:** Create a new `PerformanceDashboard.js` component using unified design patterns.
    *   **State:** The component will receive `gameState` and `gameStateManager` as props from `FixedApp.js`. It will subscribe to specific events (`playerMoneyChanged`, `playerTimeChanged`) for efficient, targeted updates.

## 7. Future Vision: The "Jackbox" Model

*   **Long-Term Goal:** To re-architect the game into a client-server model to enable a "shared screen" multiplayer experience.
*   **Feasibility:** High. The current architecture (isolated game logic, event-driven communication) is exceptionally well-suited for this migration.
*   **Migration Strategy:**
    1.  **Server Foundation:** Create a Node.js server using the existing `express` and `socket.io` dependencies. Port the `GameStateManager` to this server.
    2.  **Socket Communication:** Replace the client-side event bus with `socket.io` for server-client communication.
    3.  **Client Separation:** Refactor the front-end into two primary clients: a "Main Board" display and a "Player Dashboard" for mobile devices.
*   **Key Challenge:** The main development effort will be in building standard multiplayer components like authentication, room management, and reconnection logic, not in rewriting the core game itself.
