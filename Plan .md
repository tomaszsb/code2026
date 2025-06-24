● Detailed Development Plan for Code2026

  Overview: Quality-First Approach (6-9 Weeks)

  This plan provides step-by-step instructions with detailed prompts for each task. Each phase builds on the previous one to ensure a clean, maintainable, and feature-rich codebase.

  ---
  📋 Phase 1: Code Cleanup & Organization (3 weeks)

  Week 1: Quick Wins & Duplicate Removal

  Day 1: Remove Duplicate PlayerSetup Component

  PROMPT: Remove the unused PlayerSetup.js component and clean up references

  Tasks:
  1. Delete /js/components/PlayerSetup.js
  2. Search entire codebase for any imports or references to PlayerSetup
  3. Update any documentation that mentions both components
  4. Test that EnhancedPlayerSetup still works correctly
  5. Commit changes with message: "Remove duplicate PlayerSetup component"

  Expected outcome: One less duplicate component, cleaner file structure
  Time estimate: 30 minutes

  Day 1-2: CSS Audit & Initial Consolidation

  PROMPT: Audit all CSS files and create consolidation plan

  Tasks:
  1. Create a spreadsheet listing all 15 CSS files and their primary purposes
  2. Identify duplicate CSS rules across files (focus on button styles, card styles, colors)
  3. Count instances of repeated CSS properties (border-radius, background gradients, etc.)
  4. Create merge plan: which files should be combined
  5. Back up current CSS structure
  6. Start with merging main.css + game-components.css → main.css

  Detailed steps for CSS merge:
  - Copy all unique rules from game-components.css to main.css
  - Remove duplicates, keeping the most recent/complete version
  - Test UI on all major screens (setup, game board, various spaces)
  - Delete game-components.css
  - Update index.html to remove reference to game-components.css

  Expected outcome: 14 CSS files instead of 15, documented merge plan
  Time estimate: 4-6 hours

  Day 3-4: Create CardUtils Shared Module

  PROMPT: Extract card-related utilities into a shared module to eliminate duplication

  Tasks:
  1. Create /js/utils/CardUtils.js
  2. Move getCardTypeConfig() from CardDisplay.js to CardUtils.js
  3. Standardize card type names (Bank not Business, Investor not Investigation)
  4. Extract formatCardValue() and other shared card functions
  5. Update all components to import from CardUtils instead of duplicating code

  Detailed CardUtils.js structure:
  ```javascript
  // CardUtils.js template
  const CardUtils = {
      // Standardized card configuration
      getCardTypeConfig(cardType) {
          const configs = {
              'W': { name: 'Work', color: 'var(--primary-blue)', icon: '🔨' },
              'B': { name: 'Bank', color: 'var(--secondary-green)', icon: '🏦' },
              'I': { name: 'Investor', color: 'var(--tertiary-orange)', icon: '💰' },
              'L': { name: 'Life', color: 'var(--quaternary-red)', icon: '❤️' },
              'E': { name: 'Expeditor', color: 'var(--quinary-purple)', icon: '⚡' }
          };
          return configs[cardType] || { name: 'Unknown', color: '#gray', icon: '❓' };
      },

      // Standardized card value formatting
      formatCardValue(card) {
          // Implementation here
      },

      // Other shared utilities
      getCardDisplayName(cardType) {
          return this.getCardTypeConfig(cardType).name + ' Cards';
      }
  };

  window.CardUtils = CardUtils;

  Files to update:
  - CardDisplay.js (remove getCardTypeConfig, import CardUtils)
  - HandManager.js (fix card type names, use CardUtils)
  - AdvancedCardManager.js (use shared formatting)
  - Any other components with card logic

  Expected outcome: Single source of truth for card configurations
  Time estimate: 6-8 hours

  #### **Day 5: Initial Component Size Analysis**
  PROMPT: Analyze large components and create splitting plan

  Tasks:
  1. Count lines in PlayerStatusPanel.js and ActionPanel.js
  2. Identify logical boundaries for splitting:

  For PlayerStatusPanel.js:
  - PlayerHeader.js (name, position, phase info) ~50 lines
  - CurrentSpaceInfo.js (space details, requirements) ~100 lines
  - PlayerResources.js (money, time, scope) ~150 lines
  - CardsInHand.js (card grid, selection) ~200 lines
  - CardModal.js (detailed card view, flip animation) ~300 lines

  For ActionPanel.js:
  - DiceRollSection.js (dice UI, rolling logic) ~200 lines
  - CardActionsSection.js (card action buttons, smart filtering) ~150 lines
  - MovementSection.js (move selection, execution) ~200 lines
  - TurnControls.js (end turn, negotiate buttons) ~150 lines
  - RulesModal.js (help system, rules display) ~300 lines

  3. Create detailed splitting plan with file structure
  4. Identify shared state that needs to be managed at parent level
  5. Plan event handling for communication between split components

  Expected outcome: Detailed plan for component splitting
  Time estimate: 2-3 hours

  ### **Week 2: Component Splitting - PlayerStatusPanel**

  #### **Day 1: Extract CardModal Component**
  PROMPT: Extract the card modal functionality into a separate component

  Tasks:
  1. Create /js/components/CardModal.js
  2. Move all card modal-related JSX from PlayerStatusPanel.js
  3. Move card modal state management (selectedCard, showModal, etc.)
  4. Create props interface for CardModal:
    - selectedCard (object)
    - isVisible (boolean)
    - onClose (function)
    - cardData (array)

  Detailed CardModal.js structure:
  const CardModal = ({ selectedCard, isVisible, onClose }) => {
      // Move modal-specific useEffect hooks here
      // Move card flip animation logic
      // Move modal JSX structure

      // Event handlers to move:
      const handleModalClick = (e) => { /* existing logic */ };
      const handleCardFlip = () => { /* existing logic */ };

      return isVisible ? React.createElement(/* modal JSX */) : null;
  };

  window.CardModal = CardModal;

  3. Update PlayerStatusPanel.js to use CardModal component
  4. Test card modal functionality thoroughly
  5. Verify card flip animations still work
  6. Test on mobile and desktop
  7. Commit with message: "Extract CardModal from PlayerStatusPanel"

  Expected outcome: PlayerStatusPanel reduced by ~300 lines
  Time estimate: 4-6 hours

  #### **Day 2: Extract PlayerHeader Component**
  PROMPT: Extract player header information into a separate component

  Tasks:
  1. Create /js/components/PlayerHeader.js
  2. Move player name, position, phase info display
  3. Create props interface:
    - player (object)
    - currentSpace (string)
    - phaseInfo (object)

  PlayerHeader.js should include:
  - Player name display
  - Current position
  - Phase indicator
  - Any status icons or indicators

  Test:
  - Verify all player info displays correctly
  - Check responsive behavior
  - Ensure phase information updates properly

  Expected outcome: Clean header component, PlayerStatusPanel reduced by ~50 lines
  Time estimate: 2-3 hours

  #### **Day 3: Extract CurrentSpaceInfo Component**
  PROMPT: Extract current space information display into separate component

  Tasks:
  1. Create /js/components/CurrentSpaceInfo.js
  2. Move space details, requirements, and descriptions
  3. Create props interface:
    - spaceData (object)
    - requirements (array)
    - isCurrentSpace (boolean)

  CurrentSpaceInfo.js should handle:
  - Space name and phase display
  - Event description
  - Action requirements
  - Any space-specific UI elements

  Integration:
  - Update PlayerStatusPanel to use CurrentSpaceInfo
  - Pass necessary props from parent state
  - Test space information updates when player moves

  Expected outcome: PlayerStatusPanel reduced by ~100 lines
  Time estimate: 3-4 hours

  #### **Day 4: Extract PlayerResources Component**
  PROMPT: Extract player resources (money, time, scope) into separate component

  Tasks:
  1. Create /js/components/PlayerResources.js
  2. Move money, time, scope display logic
  3. Include resource calculation and formatting
  4. Create props interface:
    - player (object)
    - scopeData (object)
    - formatCurrency (function)

  PlayerResources.js should display:
  - Current money with formatting
  - Time remaining/elapsed
  - Scope summary with costs
  - Any resource-related calculations

  Testing focus:
  - Resource updates when cards are played
  - Currency formatting consistency
  - Scope calculations accuracy

  Expected outcome: PlayerStatusPanel reduced by ~150 lines
  Time estimate: 3-4 hours

  #### **Day 5: Extract CardsInHand Component & Integration**
  PROMPT: Extract cards in hand display and complete PlayerStatusPanel refactor

  Tasks:
  1. Create /js/components/CardsInHand.js
  2. Move card grid, selection, and hand management
  3. Create props interface:
    - cards (array)
    - onCardSelect (function)
    - selectedCard (object)
    - groupByType (boolean)

  CardsInHand.js responsibilities:
  - Card grid layout and display
  - Card selection handling
  - Card grouping by type
  - Card interaction events

  Final PlayerStatusPanel integration:
  - Import all new components
  - Pass props correctly to each component
  - Maintain existing event handling
  - Ensure state updates propagate correctly

  Comprehensive testing:
  - Full player status panel functionality
  - Card selection and modal display
  - Resource updates and space information
  - Mobile responsiveness
  - Event propagation between components

  Expected outcome: PlayerStatusPanel reduced from ~913 to ~200 lines
  Time estimate: 6-8 hours

  ### **Week 3: Component Splitting - ActionPanel**

  #### **Day 1: Extract RulesModal Component**
  PROMPT: Extract the rules modal system into a separate component

  Tasks:
  1. Create /js/components/RulesModal.js
  2. Move all rules-related JSX and logic from ActionPanel.js
  3. Move CSV-driven rules content generation
  4. Create props interface:
    - isVisible (boolean)
    - onClose (function)
    - csvData (object)

  RulesModal.js should include:
  - Modal overlay and styling
  - CSV-driven content generation
  - Two-column layout logic
  - Close button and escape key handling

  Test thoroughly:
  - Rules modal opens/closes correctly
  - CSV content loads and displays properly
  - Two-column layout works on different screen sizes
  - All rules sections display correctly

  Expected outcome: ActionPanel reduced by ~300 lines
  Time estimate: 4-5 hours

  #### **Day 2: Extract DiceRollSection Component**
  PROMPT: Extract dice rolling functionality into separate component

  Tasks:
  1. Create /js/components/DiceRollSection.js
  2. Move dice rolling state, UI, and event handling
  3. Create props interface:
    - isRequired (boolean)
    - hasRolled (boolean)
    - isRolling (boolean)
    - outcome (string)
    - onRoll (function)

  DiceRollSection.js should handle:
  - Dice roll button and disabled states
  - Rolling animation and feedback
  - Outcome display
  - Integration with turn management

  Testing:
  - Dice roll triggers correctly
  - Animation states work properly
  - Outcome displays match CSV data
  - Turn progression works after roll

  Expected outcome: ActionPanel reduced by ~200 lines
  Time estimate: 3-4 hours

  #### **Day 3: Extract CardActionsSection Component**
  PROMPT: Extract card actions interface into separate component

  Tasks:
  1. Create /js/components/CardActionsSection.js
  2. Move card action buttons and smart filtering logic
  3. Include OWNER-FUND-INITIATION filtering
  4. Create props interface:
    - availableActions (array)
    - currentSpace (string)
    - playerScope (number)
    - onCardAction (function)

  CardActionsSection.js responsibilities:
  - Card action button generation
  - Smart filtering based on game state
  - Button styling and layout
  - Action execution handling

  Focus on preserving:
  - Smart filtering for OWNER-FUND-INITIATION
  - Button styling and color coding
  - Action removal after execution
  - Proper event handling

  Expected outcome: ActionPanel reduced by ~150 lines
  Time estimate: 3-4 hours

  #### **Day 4: Extract MovementSection Component**
  PROMPT: Extract movement selection interface into separate component

  Tasks:
  1. Create /js/components/MovementSection.js
  2. Move available moves display and selection
  3. Move movement execution logic
  4. Create props interface:
    - availableMoves (array)
    - selectedMove (string)
    - onMoveSelect (function)
    - onMoveExecute (function)

  MovementSection.js should handle:
  - Available moves button grid
  - Move selection state
  - Move execution triggers
  - Movement validation

  Integration testing:
  - Move buttons display correctly
  - Selection state updates properly
  - Movement execution works
  - Turn management integration intact

  Expected outcome: ActionPanel reduced by ~200 lines
  Time estimate: 4-5 hours

  #### **Day 5: Extract TurnControls & Final Integration**
  PROMPT: Complete ActionPanel refactor with turn controls extraction

  Tasks:
  1. Create /js/components/TurnControls.js
  2. Move end turn, negotiate buttons and logic
  3. Create props interface:
    - canEndTurn (boolean)
    - completedActions (number)
    - requiredActions (number)
    - onEndTurn (function)
    - onNegotiate (function)

  TurnControls.js responsibilities:
  - End turn button with action counter
  - Negotiate button and functionality
  - Turn validation and feedback
  - Action progress display

  Final ActionPanel integration:
  - Import all extracted components
  - Maintain state management at ActionPanel level
  - Ensure proper prop passing
  - Preserve all existing functionality

  Comprehensive testing:
  - Complete turn flow functionality
  - All buttons work correctly
  - Action counting still accurate
  - Turn management behaves properly
  - No functionality lost in refactor

  Expected outcome: ActionPanel reduced from ~1,138 to ~300 lines
  Time estimate: 6-8 hours

  ---

  ## 📋 **Phase 2: Documentation Updates (1 week)**

  ### **Day 1: Fix Panel System Documentation**
  PROMPT: Correct panel system descriptions across all documentation

  Tasks:
  1. Search all .md files for "two-panel" and "three-panel" references
  2. Correct CLAUDE.md description of panel system:
    - Current: "Streamlined Two-Panel System"
    - Should be: "Professional Three-Panel System"
    - Update all related descriptions
  3. Verify actual UI structure:
    - Left Panel: Player status and controls (PlayerStatusPanel + ActionPanel)
    - Center Panel: Game board (GameBoard)
    - Right Panel: Results and exploration (ResultsPanel + SpaceExplorer)
  4. Update architecture diagrams and descriptions
  5. Fix any UI flow descriptions that mention incorrect layout

  Files to check and update:
  - CLAUDE.md (multiple references)
  - DEVELOPMENT.md
  - FEATURE_COMPARISON.md
  - Any README files

  Expected outcome: Accurate panel system documentation
  Time estimate: 2-3 hours

  ### **Day 2: Update Phase Status Documentation**
  PROMPT: Update DEVELOPMENT.md to reflect current Phase 11 status

  Tasks:
  1. Review git commit history for Phase 10 and 11 details:
    - Phase 10: Enhanced UI System & Rules Modal
    - Phase 11: Enhanced Action System & Button Logic
  2. Add Phase 10 section to DEVELOPMENT.md:
    - Rules modal implementation
    - UI system enhancements
    - Color scheme standardization
    - Three-panel layout perfection
  3. Add Phase 11 section to DEVELOPMENT.md:
    - Action system fixes
    - Button logic improvements
    - Turn management enhancements
    - Card action counting fixes
  4. Update current status from "Phase 9 Complete" to "Phase 11 Complete"
  5. Update achievement counts and metrics

  Template for phase documentation:
  ### Phase 10: Enhanced UI System & Rules Modal (Completed)
  **Duration:** [Date range]
  **Focus:** Professional UI polish and comprehensive help system

  #### Key Achievements:
  - Complete rules modal with CSV-driven content
  - Unified color scheme across all panels
  - Perfect two-column layout in rules
  - Enhanced visual consistency

  #### Technical Details:
  - [Specific implementation details]
  - [Performance improvements]
  - [Bug fixes]

  #### Metrics:
  - [Component counts]
  - [Lines of code]
  - [Performance measures]

  Expected outcome: Up-to-date phase tracking documentation
  Time estimate: 3-4 hours

  ### **Day 3: Verify and Update Component Lists**
  PROMPT: Audit all component references in documentation against actual codebase

  Tasks:
  1. Generate complete list of components in /js/components/
  2. Cross-reference with component lists in CLAUDE.md and DEVELOPMENT.md
  3. Remove any references to non-existent components
  4. Add any missing components to documentation
  5. Update component counts (currently claims "25+" - verify actual number)
  6. Update component descriptions to match current functionality

  Create component audit spreadsheet:
  | Component Name       | Exists? | Documented? | Description Accurate? | Action Needed         |
  |----------------------|---------|-------------|-----------------------|-----------------------|
  | ActionPanel.js       | Yes     | Yes         | Partially             | Update after refactor |
  | PlayerStatusPanel.js | Yes     | Yes         | Partially             | Update after refactor |
  | [etc.]               |         |             |                       |                       |

  Focus areas:
  - Recently split components (need to add documentation)
  - Manager components (verify they're all needed and documented)
  - Utility components (ensure they're mentioned appropriately)

  Expected outcome: Accurate component documentation
  Time estimate: 2-3 hours

  ### **Day 4: Document Recent Features**
  PROMPT: Add comprehensive documentation for recent improvements

  Tasks:
  1. Document smart card filtering system:
    - How OWNER-FUND-INITIATION filtering works
    - Scope-based logic ($4M threshold)
    - Implementation details in ActionPanel.js
  2. Document card action counting fixes:
    - Original problem (required all card actions)
    - Solution (count as 1 total action)
    - Impact on game flow
  3. Update feature lists in all documentation files
  4. Add technical details to DEVELOPMENT.md
  5. Update architecture descriptions where needed

  Documentation template for new features:
  #### Smart Card Filtering System
  **Location:** `ActionPanel.js` lines 552-570
  **Purpose:** Context-aware button display based on game state

  **Implementation:**
  - Analyzes player scope cost vs $4M threshold
  - Shows only appropriate funding button (Bank OR Investor)
  - Maintains game narrative consistency

  **Technical Details:**
  ```javascript
  // Smart filtering logic
  if (currentPlayer.position === 'OWNER-FUND-INITIATION') {
      const scopeCost = currentPlayer.scopeTotalCost || 0;
      const fourMillion = 4000000;
      // Filter logic here
  }

  Expected outcome: Complete documentation of recent features
  Time estimate: 3-4 hours

  ### **Day 5: Cross-Reference Consistency Check**
  PROMPT: Ensure consistency across all documentation files

  Tasks:
  1. Create cross-reference matrix of key information:
    - Component counts
    - Architecture descriptions
    - Feature lists
    - Technical specifications
  2. Identify and fix any conflicting information
  3. Standardize terminology across all documents
  4. Ensure all files reference the same architectural principles
  5. Verify all code examples work with current implementation

  Consistency checklist:
  - Panel system described identically in all files
  - Component counts match across documents
  - Architecture principles consistent
  - Feature lists synchronized
  - Phase tracking aligned
  - Code examples functional
  - Terminology standardized

  Final review:
  - Read through all documentation as a new developer
  - Check for any confusing or contradictory information
  - Ensure smooth flow between documents
  - Verify all external references (like GitHub repo) are correct

  Expected outcome: Internally consistent documentation suite
  Time estimate: 2-3 hours

  ---

  ## 📋 **Phase 3: Advanced Feature Integration (3-4 weeks)**

  ### **Week 1: MovementEngine Integration**

  #### **Day 1-2: Analyze code2025 MovementEngine**
  PROMPT: Deep analysis of code2025 MovementEngine for integration planning

  Tasks:
  1. Read through code2025/js/components/MovementEngine.js completely
  2. Identify core functionalities that should be ported:
    - Advanced movement calculations
    - Edge case handling
    - Emergency fallback systems
    - Audit and logging capabilities
    - Logic space processing
  3. Map current code2026 movement logic to MovementEngine features
  4. Identify integration points in current architecture
  5. Plan data flow and event integration

  Analysis deliverables:
  - Feature comparison spreadsheet
  - Integration architecture diagram
  - Data flow mapping
  - Event handling plan
  - Risk assessment for integration

  Key questions to answer:
  - Which MovementEngine features add significant value?
  - How to integrate with current event-driven architecture?
  - What current functionality might be replaced vs enhanced?
  - What are the migration risks?

  Expected outcome: Detailed integration plan for MovementEngine
  Time estimate: 8-12 hours

  #### **Day 3-4: Port Core MovementEngine Logic**
  PROMPT: Port essential MovementEngine functionality to code2026

  Tasks:
  1. Create /js/components/EnhancedMovementEngine.js
  2. Port core movement calculation logic from code2025
  3. Adapt to code2026's event-driven architecture
  4. Integrate with existing CSVDatabase system

  Priority features to port:
  - Advanced movement option calculations
  - Visit type determination logic
  - Single choice space tracking
  - Emergency fallback movements
  - Movement validation systems

  Integration approach:
  class EnhancedMovementEngine {
      constructor(gameStateManager, csvDatabase) {
          this.gameStateManager = gameStateManager;
          this.csvDatabase = csvDatabase;
          // Event listener setup
      }

      getAvailableMovements(player) {
          // Port logic from code2025
          // Adapt to code2026 data structures
          // Return enhanced movement options
      }

      executePlayerMove(player, moveOption) {
          // Enhanced move execution with audit trail
          // Integration with existing event system
      }
  }

  3. Update existing movement logic to use enhanced engine
  4. Maintain backward compatibility during transition
  5. Add comprehensive logging and error handling

  Testing focus:
  - Movement calculations match expected outcomes
  - Integration with existing UI works smoothly
  - No regression in current functionality
  - Performance is acceptable

  Expected outcome: Enhanced movement engine integrated
  Time estimate: 12-16 hours

  #### **Day 5: Movement Engine Testing & Refinement**
  PROMPT: Comprehensive testing of enhanced movement engine

  Tasks:
  1. Test all movement scenarios systematically:
    - Standard space-to-space movements
    - Logic space decisions (YES/NO paths)
    - Single choice space handling
    - Emergency fallback situations
    - Edge cases from various game phases
  2. Performance testing:
    - Movement calculation speed
    - Memory usage patterns
    - Event handling efficiency
  3. Integration testing:
    - UI updates correctly with enhanced engine
    - Action counting still works properly
    - Turn management integration intact
    - Save/load compatibility maintained
  4. Bug fixes and refinements based on testing
  5. Documentation of new capabilities

  Test scenarios to cover:
  - All major space types and transitions
  - Complex movement chains
  - Error conditions and recovery
  - Performance under load

  Expected outcome: Stable, tested enhanced movement engine
  Time estimate: 6-8 hours

  ### **Week 2: Animation & Visual Enhancement**

  #### **Day 1-2: GameStateAnimations System**
  PROMPT: Create comprehensive animation system for game state changes

  Tasks:
  1. Analyze code2025 animation systems for inspiration
  2. Create /js/components/GameStateAnimations.js
  3. Implement key animation types:
    - Player movement animations
    - Card action feedback
    - Turn transition effects
    - State change notifications

  Animation system architecture:
  class GameStateAnimations {
      constructor(gameStateManager) {
          this.gameStateManager = gameStateManager;
          this.setupEventListeners();
      }

      setupEventListeners() {
          // Listen for game state changes
          // Trigger appropriate animations
      }

      animatePlayerMovement(fromSpace, toSpace, player) {
          // Smooth movement animation
          // Path highlighting
          // Visual feedback
      }

      animateCardAction(cardType, action, result) {
          // Card action visual feedback
          // Result display animation
          // Success/failure indicators
      }

      animateStateTransition(fromState, toState) {
          // Smooth state transitions
          // Loading states
          // Progress indicators
      }
  }

  4. Integrate with existing event system
  5. Add CSS animations and transitions
  6. Test animation performance and smoothness

  Expected outcome: Professional animation system
  Time estimate: 10-12 hours

  #### **Day 3: Enhanced Board Visualization**
  PROMPT: Enhance game board with advanced visual features

  Tasks:
  1. Add movement trail visualization:
    - Show path from current position to available moves
    - Highlight optimal paths
    - Visual indicators for different move types
  2. Enhanced space highlighting:
    - Current position emphasis
    - Available move highlighting
    - Interactive hover effects
    - Phase-based space coloring
  3. Player position indicators:
    - Clear visual markers for each player
    - Movement animation between spaces
    - Turn indicator highlighting

  CSS enhancements to add:
  .space-movement-trail {
      /* Path visualization */
  }

  .space-available-move {
      /* Enhanced highlighting */
      animation: pulse 2s infinite;
  }

  .player-position-marker {
      /* Clear position indicators */
  }

  4. Performance optimization for visual effects
  5. Mobile responsiveness for enhanced visuals

  Expected outcome: Visually enhanced game board
  Time estimate: 6-8 hours

  #### **Day 4-5: Card Information Enhancement**
  PROMPT: Create enhanced card information and interaction system

  Tasks:
  1. Analyze code2025 card information systems
  2. Create detailed card view component with:
    - Comprehensive card statistics
    - Usage history and tracking
    - Effect previews and calculations
    - Related card suggestions
  3. Enhanced card modal features:
    - Better flip animations
    - More detailed information display
    - Interactive effect previews
    - Usage recommendations
  4. Card interaction improvements:
    - Hover effects with preview information
    - Quick action buttons
    - Batch operations for multiple cards
    - Smart suggestions based on game state

  Enhanced CardModal structure:
  const EnhancedCardModal = ({ card, gameState, onAction }) => {
      return React.createElement('div', { className: 'enhanced-card-modal' }, [
          // Detailed card information
          // Effect preview calculations
          // Usage recommendations
          // Interactive action buttons
          // Related cards display
      ]);
  };

  5. Integration with existing card systems
  6. Performance optimization for complex displays

  Expected outcome: Professional card information system
  Time estimate: 10-12 hours

  ### **Week 3: Advanced Features & Polish**

  #### **Day 1-2: Enhanced Error Handling & Recovery**
  PROMPT: Implement robust error handling and recovery systems

  Tasks:
  1. Analyze error patterns from code2025 and code2026
  2. Create comprehensive error handling framework:
    - Graceful degradation for component failures
    - Automatic state recovery mechanisms
    - User-friendly error messages
    - Developer debugging information
  3. Error boundary improvements:
    - Component-level error isolation
    - Automatic retry mechanisms
    - State restoration capabilities
    - Detailed error reporting

  Error handling framework:
  class GameErrorHandler {
      constructor(gameStateManager) {
          this.gameStateManager = gameStateManager;
          this.setupErrorBoundaries();
      }

      handleError(error, context, severity) {
          // Log error with context
          // Attempt automatic recovery
          // Notify user appropriately
          // Provide recovery options
      }

      recoverGameState(lastKnownGoodState) {
          // Restore to stable state
          // Validate data integrity
          // Resume normal operation
      }
  }

  4. Testing error scenarios:
    - Network failures
    - Data corruption
    - Component crashes
    - Performance issues

  Expected outcome: Robust error handling system
  Time estimate: 8-10 hours

  #### **Day 3: Performance Optimization**
  PROMPT: Optimize performance and implement advanced caching

  Tasks:
  1. Performance audit of current system:
    - Component render times
    - Event handling efficiency
    - Memory usage patterns
    - CSV data access speed
  2. Implement optimization strategies:
    - Component memoization where appropriate
    - Event handler optimization
    - CSV data caching improvements
    - State update batching
  3. Advanced caching system:
    - Movement calculation caching
    - Card information caching
    - UI state preservation
    - Progressive loading

  Performance monitoring:
  class PerformanceMonitor {
      constructor() {
          this.metrics = {};
          this.setupMonitoring();
      }

      measureComponentRender(component, renderTime) {
          // Track component performance
      }

      measureEventHandling(event, processingTime) {
          // Track event efficiency
      }

      generatePerformanceReport() {
          // Detailed performance analysis
      }
  }

  4. Bundle size optimization
  5. Loading time improvements

  Expected outcome: Optimized, fast-performing application
  Time estimate: 6-8 hours

  #### **Day 4-5: Final Integration & Testing**
  PROMPT: Complete integration testing and final polish

  Tasks:
  1. Comprehensive integration testing:
    - Full game flow from setup to completion
    - All component interactions
    - Performance under various conditions
    - Cross-browser compatibility
  2. User experience polish:
    - Smooth transitions between all states
    - Consistent visual feedback
    - Intuitive interaction patterns
    - Mobile optimization verification
  3. Developer experience improvements:
    - Enhanced debugging tools
    - Comprehensive logging
    - Development mode features
    - Documentation updates
  4. Final bug fixes and refinements
  5. Performance validation and optimization

  Testing scenarios:
  - Complete game playthroughs
  - Edge case scenarios
  - Error condition handling
  - Performance stress testing
  - Mobile device testing
  - Multiple browser testing

  Expected outcome: Production-ready, polished application
  Time estimate: 12-16 hours

  ---

  ## 📋 **Success Metrics & Validation**

  ### **Code Quality Metrics**
  - **Component sizes**: All components <300 lines
  - **Duplication reduction**: 800-1000 lines eliminated
  - **CSS files**: Reduced from 15 to 4-5 logical groups
  - **Test coverage**: All major functionality tested

  ### **Performance Metrics**
  - **Bundle size**: Measure and optimize
  - **Loading time**: <3 seconds on average connection
  - **Component render time**: <100ms for major components
  - **Memory usage**: Stable, no memory leaks

  ### **Feature Completeness**
  - **Enhanced movement engine**: Advanced logic ported and integrated
  - **Professional animations**: Smooth state transitions and feedback
  - **Robust error handling**: Graceful degradation and recovery
  - **Comprehensive documentation**: Up-to-date and accurate

  ### **User Experience**
  - **Intuitive interface**: Clear, professional appearance
  - **Responsive design**: Works well on all devices
  - **Smooth interactions**: No jarring transitions or delays
  - **Helpful feedback**: Clear indication of game state and options

  ---

  ## 📋 **Risk Mitigation**

  ### **High-Risk Areas**
  1. **Component splitting**: Risk of breaking existing functionality
     - **Mitigation**: Extensive testing after each component extraction
     - **Rollback plan**: Git branches for each major change

  2. **MovementEngine integration**: Complex logic integration
     - **Mitigation**: Gradual integration with parallel testing
     - **Rollback plan**: Feature flags to toggle old/new system

  3. **Performance regression**: Added features slowing system
     - **Mitigation**: Continuous performance monitoring
     - **Rollback plan**: Performance budgets and alerts

  ### **Timeline Risks**
  - **Underestimated complexity**: Tasks taking longer than planned
    - **Mitigation**: 20% time buffer built into estimates
    - **Response**: Prioritize high-impact features if time pressure

  - **Integration conflicts**: New features conflicting with existing
    - **Mitigation**: Frequent integration testing
    - **Response**: Simplify integration approach if needed

  This plan provides a structured, step-by-step approach to transforming code2026 into a production-ready, maintainable, and feature-rich application while preserving all existing functionality.