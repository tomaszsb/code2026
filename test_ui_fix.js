#!/usr/bin/env node

/**
 * Test UI Fix - Verify PlayerResources is now reactive
 */

const fs = require('fs');

console.log('🎯 VERIFYING UI FIX');
console.log('==================\n');

// Test 1: Check PlayerResources uses useGameState
console.log('✅ Test 1: PlayerResources Reactivity');
const playerResourcesContent = fs.readFileSync('game/js/components/PlayerResources.js', 'utf8');

const hasUseGameState = playerResourcesContent.includes('const [gameState, gameStateManager] = useGameState();');
const hasPlayerFromState = playerResourcesContent.includes('const player = gameState.players?.find(p => p.id === gameState.currentPlayer);');
const hasNullCheck = playerResourcesContent.includes('if (!player) {\n        return null;\n    }');
const removedPlayerProp = !playerResourcesContent.includes('function PlayerResources({ player,');

if (hasUseGameState && hasPlayerFromState && hasNullCheck && removedPlayerProp) {
    console.log('✅ PlayerResources is now reactive');
} else {
    console.log('❌ PlayerResources fix incomplete');
    console.log(`   - useGameState: ${hasUseGameState}`);
    console.log(`   - player from state: ${hasPlayerFromState}`);
    console.log(`   - null check: ${hasNullCheck}`);
    console.log(`   - removed player prop: ${removedPlayerProp}`);
}

// Test 2: Check PlayerStatusPanel no longer passes player prop to PlayerResources
console.log('\n✅ Test 2: PlayerStatusPanel Prop Removal');
const playerStatusContent = fs.readFileSync('game/js/components/PlayerStatusPanel.js', 'utf8');

// Look for the specific PlayerResources call without player prop
const playerResourcesCallPattern = /React\.createElement\(PlayerResources,\s*\{[^}]*\}/;
const playerResourcesCall = playerStatusContent.match(playerResourcesCallPattern);
const removedPlayerPropFromCall = playerResourcesCall && !playerResourcesCall[0].includes('player: currentPlayer');

if (removedPlayerPropFromCall) {
    console.log('✅ PlayerStatusPanel no longer passes player prop to PlayerResources');
} else {
    console.log('❌ PlayerStatusPanel still passes player prop to PlayerResources');
}

console.log('\n📊 UI FIX VERIFICATION COMPLETE');
console.log('===============================');

if (hasUseGameState && hasPlayerFromState && hasNullCheck && removedPlayerProp && removedPlayerPropFromCall) {
    console.log('🎉 UI FIX SUCCESSFUL!');
    console.log('📝 Expected Result:');
    console.log('   - Cards should now appear in "Cards in Hand" panel immediately');
    console.log('   - UI should update reactively when game state changes');
    console.log('   - No more stale data in PlayerResources component');
    console.log('\n🧪 Test Command:');
    console.log('   window.giveCardToPlayer(window.GameStateManager.state.players[0].id, "W001")');
} else {
    console.log('❌ UI FIX INCOMPLETE - Review above failures');
}