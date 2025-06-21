# CLAUDE.md - Development Reference

**Project Management Board Game - Clean Architecture Rebuild**

## Project Summary
Single-page web app using vanilla HTML/CSS/JavaScript with React (via CDN). Players navigate project phases from initiation to completion.

## Essential Commands
```bash
# Development server
python -m http.server 8000

# Testing URLs
http://localhost:8000/                              # Main game
http://localhost:8000/?debug=true&logLevel=debug     # Debug mode
```
**No build required** - Browser-based Babel compilation.

## Core Architecture

### CSV-as-Database Philosophy
- **Game DATA lives in CSV files** - card properties, space effects, dice outcomes
- **Game LOGIC lives in JavaScript** - how to process data, UI flow, turn mechanics
- **One unified API** - same query pattern for all CSV data types
- **No data duplication** - CSV is single source of truth for game content

### Realistic Separation
```javascript
// ✅ DATA from CSV - what the space does
const space = CSVDatabase.spaces.find(spaceName, visitType);
const cardAction = space.w_card; // "Draw 3"

// ✅ LOGIC in JavaScript - how to execute it
if (cardAction.startsWith('Draw ')) {
  const amount = parseInt(cardAction.split(' ')[1]);
  this.drawCards('W', amount);
}
```

### Key Files
```
js/data/CSVDatabase.js          # Unified CSV query system
js/data/GameStateManager.js     # Central state + events
js/components/App.js            # Root component
data/cards.csv                  # Card properties and effects
data/Spaces.csv                 # Space actions and outcomes
data/DiceRoll Info.csv          # Dice result mappings
scripts/clean-spaces-csv.js     # CSV cleanup utilities
scripts/clean-dice-csv.js       # Dice data cleanup utilities
```

## Development Rules

### CSV Data Integrity (CRITICAL)
**All space names must be clean and consistent across CSV files:**

```csv
# ✅ CORRECT - Clean space names in movement columns
space_1,space_2,space_3
LEND-SCOPE-CHECK,ARCH-INITIATION,CHEAT-BYPASS

# ❌ WRONG - Descriptions mixed with space names  
space_1,space_2,space_3
LEND-SCOPE-CHECK - To get more $,ARCH-INITIATION - To start design,CHEAT-BYPASS - To get ahead

# ✅ CORRECT - Clean dice outcomes
1,2,3,4,5,6
REG-FDNY-FEE-REVIEW,REG-DOB-PLAN-EXAM,ARCH-INITIATION,ARCH-INITIATION,REG-FDNY-FEE-REVIEW,REG-FDNY-FEE-REVIEW

# ❌ WRONG - Descriptions in dice outcomes
1,2,3,4,5,6
REG-FDNY-FEE-REVIEW - Pass,REG-DOB-PLAN-EXAM - Missing files,ARCH-INITIATION - Major problem,ARCH-INITIATION - Major problem,REG-FDNY-FEE-REVIEW - Missing Approval,REG-FDNY-FEE-REVIEW - Missing Approval
```

**Maintenance Scripts:**
```bash
# Clean space movement data (space_1 through space_5 columns)
node scripts/clean-spaces-csv.js

# Clean dice roll outcomes (columns 1-6)
node scripts/clean-dice-csv.js
```

**RULE: Space references must match space_name entries exactly**
- No descriptions, no extra text, no inconsistent naming
- Backups created automatically before cleaning
- Run scripts after any CSV data changes

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

### State Management
```javascript
// ✅ Always preserve existing state
this.setState(prevState => ({ 
    ...prevState, 
    newProperty: value 
}));
```

## What Lives Where

### CSV Files (Game Content)
- ✅ Space names, actions, card requirements
- ✅ Card effects, costs, descriptions
- ✅ Dice outcomes, movement options
- ✅ Phase restrictions, prerequisites

### JavaScript (Game Engine)
- ✅ Turn flow logic (roll dice → move → apply effects)
- ✅ Card effect interpretation ("Draw 3" → drawCards function)
- ✅ Win condition checking
- ✅ UI state management
- ✅ Event handling and component coordination

### What's Forbidden
- ❌ **Magic strings in JS** - no `if (spaceName === 'OWNER-SCOPE-INITIATION')`
- ❌ **Hardcoded amounts** - no `drawCards('W', 3)` without CSV lookup
- ❌ **Multiple data access paths** - one API only
- ❌ **Component-to-component calls** - events only
- ❌ **Fallback data sources** - CSV or error, no alternatives

## Loading Order (Critical)
```html
1. CSVDatabase system
2. GameStateManager
3. Component utilities  
4. Manager components
5. UI components
6. Main App
```

## Common Patterns

### Data-Driven Actions
```javascript
// ✅ Let CSV drive the logic
const space = CSVDatabase.spaces.find(player.position, visitType);
if (space.requires_dice_roll === 'Yes') {
  this.showDiceRoll();
}
if (space.w_card) {
  this.processCardAction(space.w_card, 'W');
}
```

### Error Handling
```javascript
try {
  const data = CSVDatabase.query(type, filters);
  if (!data || data.length === 0) {
    throw new Error(`No ${type} data found for filters`);
  }
  this.processData(data);
} catch (error) {
  console.error('Data error:', error);
  this.setState({error: error.message});
}
```

### Component Cleanup
```javascript
componentWillUnmount() {
  GameStateManager.off('eventName', this.handleEvent);
  this.timers?.forEach(clearTimeout);
  this.refs = null;
}
```

## Debugging

### CSV Data Issues
```javascript
// Enable CSV query logging
CSVDatabase.debug = true;

// Enable event system logging  
GameStateManager.debug = true;

// Component-specific debugging
window.DEBUG_COMPONENT = 'ComponentName';
```

**Common "Space not found" errors:**
```bash
# Error: Space LEND-SCOPE-CHECK - To get more $/First not found
# CAUSE: CSV contains descriptions mixed with space names
# FIX: Run cleaning scripts
node scripts/clean-spaces-csv.js
node scripts/clean-dice-csv.js

# Error: Space REG-FDNY-PLAN EXAM/First not found  
# CAUSE: Space name inconsistency (space vs dash)
# FIX: Check space_name column matches dice outcomes exactly
```

**CSV Validation Checklist:**
- ✅ All space_1 through space_5 contain clean space names only
- ✅ All dice outcome columns (1-6) contain clean space names only  
- ✅ Space names match exactly across Spaces.csv and DiceRoll Info.csv
- ✅ No descriptions after " - " in movement/outcome fields
- ✅ Consistent naming (dashes vs spaces vs underscores)

## Reference Materials

### code2025 Folder - REFERENCE ONLY
- 📚 **For reference and understanding existing game logic**
- 📚 **Review old implementations before building new ones** 
- 📚 **Copy concepts, never copy code**
- ❌ **NO mixing of old and new code**
- ❌ **NO importing files from code2025**

### Development Approach
- ✅ **All new work goes in code2026 only**
- ✅ **Build clean implementations from scratch**
- ✅ **Use code2025 to understand requirements, not solutions**

---

## Essential Project Guidelines

**CLAUDE.md contains ONLY essential development guidelines.**

For project status, progress tracking, and detailed notes, see:
- `DEVELOPMENT.md` - Phase tracking, completion status, and development notes
- Git commit history - Detailed change log with reasoning

**Clean rebuild: CSV-driven content, unified APIs, event-driven architecture.**