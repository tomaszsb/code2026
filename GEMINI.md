Project Hub NYC PM Game (Version 4.8)
Last Updated: July 25, 2025

1. Project Charter & Vision
1.1. Game Concept: A 27-space digital board game simulating the 6 major phases of an NYC construction project. Players navigate the board making decisions that impact their Time, Money, and Scope.
1.2. Player Role & Goal: The player is a project manager whose primary objective is to complete a project by navigating all 6 phases. Success is measured by efficiency in managing Time, Money, and Scope.
1.3. Core Mechanics & Rules: The game operates on dice-based movement, resource management, and a strategic card system. Key rules are based on real-world principles like sequential regulatory processes.
1.4. Win & Loss Conditions: The primary win condition is reaching the FINISH space. A leaderboard ranks players based on final metrics.
1.5. The "Vibe": A strategic puzzle under mounting pressure, evolving from optimistic and thoughtful to tense and complex.

2. Current Project State
2.1. Implemented Features
NEW (v4.8): Major Architectural Refactor - Centralized Action Tracking. The entire system for tracking player actions has been refactored. The GameStateManager is now the single source of truth, eliminating numerous race conditions. UI components like TurnControls.js have been dramatically simplified. The action counter is now fully functional.

2.2. Known Issues & Master "Punch List"
NEW: Player Movement Post-Turn Bug: After all required actions are complete and the "End Turn" button is clicked, the player's token does not move to the selected space.
NEW: Cards Not Appearing in Hand Bug: When a player draws cards, the UI in the "Cards in Hand" panel does not update to show the new cards.
NEW: TypeError: Cannot read properties of null (reading 'emit') - Occurs after Start Game button click, preventing UI transition.
Environmental Bug (Workaround Found): The browser console enters a loop when the "Enter" key is used. The current workaround is to use the browser's "Snippets" tool for testing.

3. Project Assets
Repository: https://github.com/tomaszsb/code2026
Final Commit of Session: d20fad3 (This will be updated by Claude)
Tech: React (CDN), JavaScript (ES6 Modules), CSS, Papa Parse.
Run locally: python3 -m http.server 8000

4. Workflow & Session Management
4.1. Mutual Synchronization Protocol (v3.1)
4.2. Session Conclusion Protocol (v4.0)
4.3. Owner-to-PM Instruction Protocol (v4.5)

5. Team Roles & Responsibilities (v3.2)
5.1. The Owner (Your Role): The project's visionary and final decision-maker.
5.2. The AI Project Manager (My Role): The Translator and Strategist.
5.3. The AI Programmer (Claude's Role): The hands-on technical expert.

6. Document Management Directive
At the end of every successful work session, I must provide a new, complete, and updated version of this entire Project Hub document.

7. Active Development Plan
Objective: Formally conclude the session to secure the successful architectural refactor.
Status: COMPLETE.
Next Action: Begin the next session by addressing the "TypeError: Cannot read properties of null (reading 'emit')" noted in the Punch List (Section 2.2).

8. Version Log
v4.8 (July 23, 2025): Landmark Architectural Refactor. After a prolonged debugging session, the entire action-tracking system was successfully refactored. All action-counting logic was centralized into the GameStateManager. This fixed a cascade of bugs related to the action counter. Two new bugs related to post-turn movement and card UI updates were identified and logged.
v4.9 (July 25, 2025): Extensive React State Management Debugging. Addressed persistent "Maximum update depth exceeded" errors through comprehensive fixes to `useGameState` hook (deep equality, stable references, `useEffect` dependency management). Implemented loading gates and prop passing for `GameStateManager` availability. Unresolved: `TypeError: Cannot read properties of null (reading 'emit')` persists.

9. Core Principles & Lessons Learned
9.1. Start with a complete, single-file document.
9.2. The AI PM must protect the Owner from raw code.
9.3. A Master "Punch List" is essential.
9.4. Explicitly instruct AI to check for existing code.
9.5. AI can hallucinate file paths and code structures.
9.6. AI must provide complete, production-ready code.
9.7. A phased approach (Analyze > Plan > Code) prevents wasted effort.
9.8. Always ask the AI to "search for and update" all relevant code.
9.9. Treat every session as if the AI has amnesia.
9.10. Use versioning for the guiding document.
9.11. Formally define team roles.
9.12. Use a "diff" format in prompts.
9.13. Establish and follow a strict session startup protocol.
9.14. (v3.1): Synchronization Must Be Mutual, Not Directive.
9.15. (v3.2): The Translator Must Serve the Visionary.
9.16. (v4.0): Commit Code First, Document Second.
9.17. (v4.0): The Definition of Done Includes All Documentation.
9.18. (v4.0): A Task's "Blast Radius" Includes All Documentation.
9.19. (v4.1): Prompts Must Be Optimized for the Recipient AI.
9.20. (v4.3): Trust, but Verify with Live Tests.
9.21. (v4.3): Acknowledge a Deeper Problem.
9.22. (v4.3): AI Can Go Off-Script.
9.23. (v4.5): The PM's Plan vs. The Programmer's Prompt.
9.24. (v4.5): The AI PM's Prime Directive - Audit Thyself.
9.25. (v4.5): Collaboration is Between AIs.
9.26. (v4.6): Functional Verification Over Component Verification.
9.27. (v4.7): Prompts Must Command, Not Suggest.
9.28. NEW (v4.8): AI-to-AI Prompts Must Delegate, Not Command. A prompt from a PM to a Programmer AI should define the objective and context, then delegate the creation of the technical plan to the expert.
9.29. NEW (v4.8): A Fix Must Be Verified Against the Component's Entire Lifecycle. Verification must validate the component's state at initialization, during interaction, and at completion.
9.30. NEW (v4.8): The Owner's Visual Verification is the Only Source of Truth. A feature or bug fix is not complete until the Owner has visually confirmed that the live application behaves exactly as expected.
9.31. NEW (v4.9): Deep Immutability is Paramount. React's shallow comparison means `getState()` always returning a new object reference (even if content is same) will cause re-renders. Deep equality checks are crucial.
9.32. NEW (v4.9): React Hook Dependencies are Tricky. `useEffect` and `useCallback` dependencies require extreme precision. Race conditions and premature cleanup can arise from incorrect dependencies or synchronous state updates within effects.
9.33. NEW (v4.9): Global vs. Prop References. Mixing global `window` object access with prop-based dependency injection in React components leads to timing issues and `null` reference errors. Components should consistently rely on props for external dependencies.
9.34. NEW (v4.9): Iterative Debugging is Essential, but Isolation is Key. When targeted fixes fail, drastic isolation steps (like simplifying components) are necessary to pinpoint the root cause of persistent issues.
9.35. NEW (v4.9): User Feedback is Invaluable. Detailed symptom descriptions and console output from the user are critical for diagnosing complex, interconnected issues.
