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
js/data/CSVDatabase.js          # Unified CSV query system
js/data/GameStateManager.js     # Central state + events
js/components/App.js            # Root component
js/components/GameBoard.js      # Interactive board with movement system
js/components/SpaceExplorer.js  # Space details and exploration panel
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

### ✅ Interactive Game Board
- **Clickable Spaces**: Visual feedback with hover effects and state indicators
- **Player Movement**: CSV-driven movement system using space connections
- **Available Moves**: Highlighted valid moves with pulsing animations
- **Current Position**: Orange highlighting with pulse animation
- **Visited Spaces**: Visual tracking of player's journey

### ✅ Space Explorer Panel
- **Real-time Details**: Comprehensive space information on click
- **Space Navigation**: Explore connected spaces with clickable buttons
- **Move Actions**: Direct movement to valid spaces
- **History Tracking**: Recently viewed spaces for easy navigation

### ✅ Unified Design System
- **Consistent Styling**: All panels use unified card system and typography
- **Design Tokens**: Standardized colors, spacing, and typography
- **Button System**: Consistent button styles across all components
- **Professional UI**: Cohesive visual experience throughout the game

### ✅ CSV-First Architecture
- **No Magic Strings**: All space names and effects from CSV data
- **Event-Driven**: Components communicate via GameStateManager only
- **Unified API**: Single query pattern for all game data
- **Clean Separation**: Game data in CSV, game logic in JavaScript