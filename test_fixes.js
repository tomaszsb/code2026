#!/usr/bin/env node

/**
 * Quick test to verify the fixes applied
 */

const fs = require('fs');

console.log('🔧 VERIFYING APPLIED FIXES');
console.log('==========================\n');

const gameManagerPath = 'game/js/components/GameManager.js';
const content = fs.readFileSync(gameManagerPath, 'utf8');

// Test 1: Check handler definitions come before wrappers
console.log('✅ Test 1: Handler Order');
const processSpaceEffectsPos = content.indexOf('const processSpaceEffects = React.useCallback');
const wrappedProcessSpaceEffectsPos = content.indexOf('const wrappedProcessSpaceEffects = handleEvent');

if (processSpaceEffectsPos < wrappedProcessSpaceEffectsPos && processSpaceEffectsPos > 0 && wrappedProcessSpaceEffectsPos > 0) {
    console.log('✅ Handler definitions come before wrappers');
} else {
    console.log('❌ Handler order issue still exists');
}

// Test 2: Check simplified wrappers (no useCallback)
console.log('\n✅ Test 2: Simplified Wrappers');
const hasSimplifiedWrapper = content.includes('const wrappedProcessCardAction = handleEvent(processCardAction, \'processCardAction\');');
const hasOldPattern = content.includes('React.useCallback(handleEvent(processCardAction');

if (hasSimplifiedWrapper && !hasOldPattern) {
    console.log('✅ Wrappers simplified correctly');
} else {
    console.log('❌ Wrapper simplification incomplete');
}

// Test 3: Check giveCardToPlayer parameter order
console.log('\n✅ Test 3: giveCardToPlayer Parameter Order');
const hasCorrectSignature = content.includes('window.giveCardToPlayer = (playerId, cardId) => {');

if (hasCorrectSignature) {
    console.log('✅ giveCardToPlayer parameters fixed');
} else {
    console.log('❌ giveCardToPlayer parameters still incorrect');
}

// Test 4: Check all handler functions are preserved
console.log('\n✅ Test 4: Handler Functions Preserved');
const handlerFunctions = [
    'processSpaceEffects',
    'processCardAction',
    'drawCardsForPlayer',
    'replaceCardsForPlayer',
    'executeCardReplacement',
    'removeCardsFromPlayer',
    'processDiceOutcome',
    'showMovementOptions'
];

let allHandlersPresent = true;
handlerFunctions.forEach(handler => {
    if (!content.includes(`const ${handler} = React.useCallback`)) {
        console.log(`❌ Missing handler: ${handler}`);
        allHandlersPresent = false;
    }
});

if (allHandlersPresent) {
    console.log('✅ All handler functions preserved');
}

console.log('\n📊 FIX VERIFICATION COMPLETE');
console.log('============================');
console.log('🎯 Ready for browser testing!');
console.log('📝 Test commands:');
console.log('   1. Start game with debug mode: http://localhost:8000/?debug=true');
console.log('   2. Initialize game with a player');
console.log('   3. Run: window.giveCardToPlayer(window.GameStateManager.state.players[0].id, "W001")');
console.log('   4. Check if card appears in UI without errors');