# NEXT SESSION OBJECTIVE

## Primary Goal: Resolve TypeError: Cannot read properties of null (reading 'emit')

### Current State Summary
The application has successfully resolved the "Maximum update depth exceeded" infinite re-render loop that was preventing the game from loading. The useGameState hook has been completely refactored with deep equality comparison and stable event listener management.

However, after clicking the "Start Game" button, the application shows a React Error Boundary with:
```
TypeError: Cannot read properties of null (reading 'emit')
    at <anonymous>:71:26
```

### Last Known Progress
- ✅ **Fixed**: Infinite re-render loop in useGameState hook
- ✅ **Fixed**: Event listener race conditions and premature cleanup
- ✅ **Fixed**: GameStateManager reference consistency between global and hook
- ✅ **Fixed**: GameInterface now receives gameStateManager as prop instead of accessing window.GameStateManager
- ⚠️ **Unresolved**: Null reference error when calling .emit() method

### Current Architecture
- `FixedApp.js` has loading gate: renders "Loading game system..." if gameStateManager is null
- `GameInterface` receives `gameStateManager` as prop and uses it instead of window.GameStateManager
- `useGameState` hook returns null for gameStateManager until window.GameStateManager is available

### Next Session Tasks
1. **Identify the Component**: Determine which component is calling .emit() on null gameStateManager
2. **Trace the Call Stack**: The error shows `<anonymous>:71:26` - need to identify the actual component
3. **Check Child Components**: GameInterface may be passing null gameStateManager to child components
4. **Verify Prop Drilling**: Ensure all child components receiving gameStateManager handle null states
5. **Component Initialization Order**: Check if components are trying to emit events before gameStateManager is fully initialized

### Files Recently Modified
- `js/utils/ComponentUtils.js` - useGameState hook with deep equality
- `js/components/FixedApp.js` - Loading gates and GameInterface prop passing
- `js/data/GameStateManager.js` - Enhanced debugging logs

### Debugging Strategy
Start by adding console.log statements to identify which component is calling emit() and receiving null gameStateManager, then trace backwards to find why the prop is null despite the loading gates.

### How to Start Next Session

```
I'm continuing the debugging session for the Project Management Board Game. We successfully resolved the "Maximum update depth exceeded" infinite re-render loop, but now have a TypeError: Cannot read properties of null (reading 'emit') error that occurs after clicking the Start Game button.

The useGameState hook has been refactored with deep equality comparison and stable event listeners. FixedApp has loading gates to prevent rendering when gameStateManager is null, and GameInterface now receives gameStateManager as a prop.

However, some component is still calling .emit() on a null gameStateManager reference. We need to identify which component is causing this and ensure proper null handling throughout the component tree.

The error stack shows <anonymous>:71:26 so we need to trace which actual component file is causing this issue.
```