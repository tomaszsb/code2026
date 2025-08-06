# Development Roadmap

This document outlines the strategic plan for the development of the Project Hub NYC PM Game. It integrates feedback from the Owner, AI Project Manager (Gemini), and AI Programmer (Claude), as well as findings from existing project documentation.

---

## **Priority 1: Establish Core Playability & Orientation**
*   **Goal:** Fix the most critical orientation issues so the player can understand the game state at a glance.
*   **Tasks:**
    1.  **Add Player Position:** Place a distinct token/highlight on the `Project Management Board` to show the player's current space.
    2.  **Show the Path:** Add lines/arrows connecting the spaces on the board to visualize the game flow.
    3.  **Color-Code Phases:** Color-code the board spaces to correspond with the major phases of a project (e.g., Initiation, Design, Construction).

---

## **Priority 2: Display Critical Strategic Information**
*   **Goal:** Surface the key numbers and constraints players need to make meaningful strategic decisions.
*   **Tasks:**
    1.  **Add Win Condition Tracker:** Implement a visual tracker showing progress towards the game's win condition.
    2.  **Add Constraint Indicators:** Add a specific UI element to track critical constraints (e.g., "20% budget for design fees").
    3.  **Contextualize Costs:** When an action requires money or time, display that cost directly on the associated button or action description.

---

## **Priority 3: Streamline UI & Player Actions**
*   **Goal:** Reduce confusion, remove redundancy, and clarify the action loop.
*   **Tasks:**
    1.  **Fix Action Counter:** Ensure the "Actions: 0/2" counter is reliable.
    2.  **Delineate Project Scopes:** Clarify the two "Project Scope" areas, consolidating the information into one logical place.
    3.  **Implement Player Log:** Begin populating the "Future Log Area" with a turn-by-turn log of player actions.

---

## **Priority 4: Resolve Core Technical Debt**
*   **Goal:** Improve code quality and adherence to architectural principles based on findings in `TECHNICAL_DEEP_DIVE.md`.
*   **Tasks:**
    1.  **Refactor 'E' Card Logic:** Remove the duplicate effect processing from `CardsInHand.js` and ensure `EffectsEngine.js` is the single source of truth.
    2.  **Implement Data-Driven Activation:** Modify the card drawing logic to use the `activation_timing` column from `cards.csv` instead of the hardcoded `if (cardType !== 'E')` check.

---

## **Priority 5: Enhance Thematic & Aesthetic Appeal**
*   **Goal:** Improve the game's visual identity and make the UI more intuitive and engaging.
*   **Tasks:**
    1.  **Create Thematic Buttons:** Redesign action buttons to look like the things they represent (e.g., a die for "Roll Dice").
    2.  **Display Cards Directly:** Overhaul the `Cards in Hand` panel to always show card thumbnails/backs.
    3.  **Improve Player Identity:** Implement richer player avatars/personas.

---

## **Priority 6: Plan for Future Features**
*   **Goal:** Acknowledge and create a space for long-term ideas without disrupting the current development flow.
*   **Tasks:**
    1.  **Designate "Companion App" Area:** Formally designate a section of the UI as a placeholder for a future phone/second-screen experience.
    2.  **Acknowledge "Performance Dashboard" Concept:** Keep the idea of a real-time performance score dashboard in the long-term vision.
