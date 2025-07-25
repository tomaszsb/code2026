// Test Script for Card Effects Fix Implementation
// Tests the surgical fixes for usePlayerCard routing and effect processing

console.log('=== CARD EFFECTS FIX VALIDATION ===');

// Wait for systems to initialize
setTimeout(function() {
    console.log('\n🔧 TESTING IMPLEMENTATION FIXES...');
    
    try {
        // Test 1: Verify GameStateManager new methods exist
        console.log('\n1. Checking new GameStateManager methods:');
        console.log('   - addWorkToPlayerScope:', typeof window.GameStateManager?.addWorkToPlayerScope === 'function' ? '✅' : '❌');
        console.log('   - forcePlayerDiscard:', typeof window.GameStateManager?.forcePlayerDiscard === 'function' ? '✅' : '❌');
        
        // Test 2: Verify EffectsEngine new method exists
        console.log('\n2. Checking new EffectsEngine method:');
        console.log('   - applyCardEffect:', typeof window.EffectsEngine?.applyCardEffect === 'function' ? '✅' : '❌');
        
        // Test 3: Add a Work card and test the fixed flow
        console.log('\n3. Testing Apply Work effect flow:');
        
        // Give player a Work card
        if (typeof window.giveCardToPlayer === 'function') {
            window.giveCardToPlayer(0, 'W001');
            console.log('   ✓ Added W001 card to Player 0');
        } else {
            console.log('   ❌ giveCardToPlayer function not available');
            return;
        }
        
        // Get player ID safely
        const playerId = window.GameStateManager?.state?.players?.[0]?.id;
        if (playerId === undefined) {
            console.log('   ❌ Could not get Player 0 ID');
            return;
        }
        
        // Capture initial scope
        const initialScope = window.GameStateManager.state.players[0].scopeTotalCost || 0;
        console.log(`   - Initial scope: $${initialScope.toLocaleString()}`);
        
        // Test the fixed usePlayerCard method
        const result = window.GameStateManager.usePlayerCard(playerId, 'W001');
        console.log(`   ✓ usePlayerCard result: ${result}`);
        
        // Check final scope
        const finalScope = window.GameStateManager.state.players[0].scopeTotalCost || 0;
        console.log(`   - Final scope: $${finalScope.toLocaleString()}`);
        console.log(`   - Scope increase: $${(finalScope - initialScope).toLocaleString()}`);
        
        // Verify scope increased
        if (finalScope > initialScope) {
            console.log('   ✅ SUCCESS: Scope was properly increased!');
        } else {
            console.log('   ❌ FAILURE: Scope was not increased');
        }
        
        // Test 4: Show final game state
        console.log('\n4. Final game state:');
        if (typeof window.showGameState === 'function') {
            window.showGameState();
        } else {
            const player = window.GameStateManager.state.players[0];
            console.log('   Player 0 scope items:', player.scopeItems);
            console.log('   Player 0 scope total:', player.scopeTotalCost);
        }
        
        console.log('\n=== VALIDATION COMPLETE ===');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
    
}, 3000); // Wait 3 seconds for initialization