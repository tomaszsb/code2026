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
# Development server
python -m http.server 8000

# Testing URLs
http://localhost:8000/                              # Main game
http://localhost:8000/?debug=true&logLevel=debug     # Debug mode

# Git operations
git add .                                           # Stage changes
git commit -m "Description of changes"             # Commit changes
git push origin main                                # Push to GitHub
git pull origin main                                # Pull latest changes
```
**No build required** - Browser-based Babel compilation.

## Core Architecture

### CSV-as-Database Philosophy
- **Game DATA lives in CSV files** - card properties, space effects, dice outcomes
- **Game LOGIC lives in JavaScript** - how to process data, UI flow, turn mechanics
- **One unified API** - same query pattern for all CSV data types
- **No data duplication** - CSV is single source of truth for game content

### Key Files
```
js/data/CSVDatabase.js              # Unified CSV query system
js/data/GameStateManager.js         # Central state + events
js/components/App.js                # Root component
js/components/GameBoard.js          # Interactive board with movement system
js/components/SpaceExplorer.js      # Space details and exploration panel

# Advanced System Components (Professional Features)
js/components/InteractiveFeedback.js       # Toast notifications & visual feedback
js/components/TooltipSystem.js             # Context-sensitive help system
js/components/LogicSpaceManager.js         # Complex decision-based spaces
js/components/AdvancedCardManager.js       # Card combos & chain effects
js/components/AdvancedDiceManager.js       # Sophisticated dice mechanics
js/components/PlayerInfo.js               # Comprehensive player dashboard
js/components/PlayerMovementVisualizer.js # Visual movement animations

css/unified-design.css          # Design system with consistent styling
data/cards.csv                  # Card properties and effects
data/Spaces.csv                 # Space actions and outcomes
data/DiceRoll Info.csv          # Dice result mappings
```

## Development Rules

### CSV Data Standards
```javascript
// ✅ Query CSV data with unified API
const cards = CSVDatabase.cards.query({type: 'W', phase: 'DESIGN'});
const space = CSVDatabase.spaces.find(spaceName, visitType);
const dice = CSVDatabase.dice.query({space: spaceName, visitType});

// ❌ No direct array manipulation
spaces.find(s => s.space_name === name);  // Forbidden
```

### Component Communication
```javascript
// ✅ Event-driven only
GameStateManager.emit('playerMoved', {player, newSpace});
GameStateManager.on('playerMoved', this.handlePlayerMoved);

// ❌ No direct component calls
otherComponent.updatePlayer(player);  // Forbidden
```

### What's Forbidden
- ❌ **Magic strings in JS** - no `if (spaceName === 'OWNER-SCOPE-INITIATION')`
- ❌ **Hardcoded amounts** - no `drawCards('W', 3)` without CSV lookup
- ❌ **Multiple data access paths** - one API only
- ❌ **Component-to-component calls** - events only
- ❌ **Fallback data sources** - CSV or error, no alternatives

## Loading Order (Critical)
```html
1. Unified Design System (CSS)
2. CSVDatabase system
3. GameStateManager
4. Component utilities  
5. Manager components
6. UI components (GameBoard, SpaceExplorer)
7. Main App
```

## What Lives Where

### CSV Files (Game Content)
- ✅ Space names, actions, card requirements
- ✅ Card effects, costs, descriptions
- ✅ Dice outcomes, movement options

### JavaScript (Game Engine)
- ✅ Turn flow logic (roll dice → move → apply effects)
- ✅ Card effect interpretation ("Draw 3" → drawCards function)
- ✅ UI state management and event coordination
- ✅ Interactive board with clickable spaces and visual feedback
- ✅ Player movement system using CSV space connections

## Reference Materials

### code2025 Folder - REFERENCE ONLY
- 📚 **For understanding existing game logic**
- ❌ **NO mixing of old and new code**
- ❌ **NO importing files from code2025**

### Screenshots and Visual Feedback
- 📸 **Screenshots are uploaded to code2026 folder**
- 📸 **Reference screenshots by filename when discussing layout/UI issues**

---

## Documentation Structure

**CLAUDE.md contains ONLY essential development guidelines.**

For detailed information see:
- `DEVELOPMENT.md` - Phase tracking, patterns, debugging, detailed examples
- Git commit history - Change log with reasoning

**Architecture: CSV-driven content, unified APIs, event-driven communication, consistent design system.**

## Current Features

### ✅ Advanced Professional Game System

#### 🎯 **Sophisticated Gameplay Mechanics**
- **Complex Logic Spaces**: Interactive decision points with YES/NO choices and branching outcomes
- **Advanced Card Combos**: Multi-card synergies with automatic detection and bonus calculation
  - Finance Synergy: Bank + Investor cards (+$75k bonus)
  - Work-Life Balance: Work + Life cards (+$25k, +2 time)
  - Type Mastery: Multiple same-type cards (+40k, 1.3x multiplier)
  - Project Spectrum: All 5 card types (+$150k, +5 time, 2x multiplier)
- **Intelligent Dice System**: Conditional outcomes, roll-based multipliers, automatic card draws
- **Chain Effects**: Sequential card bonuses and phase progression rewards

#### 💫 **Professional UI Experience**
- **Interactive Feedback System**: Toast notifications with success/warning/error messages
- **Context-Sensitive Help**: Comprehensive tooltip system with game-specific guidance
- **Visual Movement System**: Smooth animations, path highlighting, position indicators
- **Rich Player Dashboard**: Financial analysis, scope tracking, combo history, phase progress
- **Enhanced Visual Feedback**: Button ripple effects, loading states, progress indicators

#### 🎮 **Complete Game Features**
- **Interactive Game Board**: Clickable spaces with visual feedback and state indicators
- **Enhanced Space Explorer**: Comprehensive space information with dice alerts and movement navigation
- **Complete Card Management**: 5 card types with drag-and-drop interface and effect animations
- **Full Gameplay Loop**: Turn management, win condition detection, real-time timer
- **Production Systems**: Auto-save/load, import/export, comprehensive error handling

#### 🏗️ **Advanced Architecture**
- **CSV-First Design**: All game content driven by data, no hardcoded rules
- **Event-Driven Communication**: Clean component interactions via GameStateManager
- **Unified Design System**: Consistent styling with professional card layouts and typography
- **Mobile Responsive**: Optimized for all devices with touch-friendly interactions
- **Accessibility Complete**: ARIA support, keyboard navigation, screen reader compatibility

#### 🔧 **Developer Experience**
- **Component-Based Architecture**: 25+ React components with clear separation of concerns
- **Advanced State Management**: Event system with proper cleanup and memory management
- **Debug Mode**: Comprehensive logging and development tools
- **Hot Reload**: Browser-based Babel compilation, no build required
- **Error Boundaries**: Comprehensive error handling with user feedback