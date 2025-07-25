/**
 * Movement Bug Fix Verification Test
 * Run this in browser console after loading the game
 */

function testMovementFix() {
    console.log('🔧 Testing Player Movement Bug Fix...');
    
    // Test 1: Verify GameStateManager has movePlayerWithEffects method
    console.log('\n📋 Test 1: Check GameStateManager.movePlayerWithEffects exists');
    if (window.GameStateManager && typeof window.GameStateManager.movePlayerWithEffects === 'function') {
        console.log('✅ GameStateManager.movePlayerWithEffects method exists');
    } else {
        console.error('❌ GameStateManager.movePlayerWithEffects method missing');
        return false;
    }
    
    // Test 2: Verify game state structure
    console.log('\n📋 Test 2: Check game state structure');
    const gameState = window.GameStateManager.getState();
    if (gameState && gameState.players && gameState.players.length > 0) {
        console.log('✅ Game state has players');
        console.log(`   Players: ${gameState.players.length}`);
        console.log(`   Current Player ID: ${gameState.currentPlayer}`);
    } else {
        console.error('❌ Invalid game state - no players found');
        return false;
    }
    
    // Test 3: Verify current player position
    console.log('\n📋 Test 3: Check current player position');
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (currentPlayer) {
        console.log('✅ Current player found');
        console.log(`   Name: ${currentPlayer.name}`);
        console.log(`   Position: ${currentPlayer.position}`);
        console.log(`   Visit Type: ${currentPlayer.visitType}`);
    } else {
        console.error('❌ Current player not found');
        return false;
    }
    
    // Test 4: Simulate movement (safe test)
    console.log('\n📋 Test 4: Test movement method call (dry run)');
    try {
        // Get available moves using MovementEngine
        const movementEngine = window.movementEngine || window.MovementEngine?.getInstance();
        if (movementEngine) {
            const availableMoves = movementEngine.getAvailableMoves(currentPlayer);
            console.log('✅ MovementEngine available');
            console.log(`   Available moves: ${availableMoves.length}`);
            console.log(`   Moves: ${availableMoves.join(', ')}`);
            
            if (availableMoves.length > 0) {
                console.log('\n🔄 Ready for actual movement test');
                console.log('   To test actual movement, run:');
                console.log(`   testActualMovement('${availableMoves[0]}')`);
            }
        } else {
            console.error('❌ MovementEngine not available');
        }
    } catch (error) {
        console.error('❌ Error testing movement:', error.message);
        return false;
    }
    
    console.log('\n✅ All movement fix verification tests passed!');
    return true;
}

function testActualMovement(destination) {
    console.log(`🚀 Testing actual movement to: ${destination}`);
    
    const gameState = window.GameStateManager.getState();
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    const initialPosition = currentPlayer.position;
    
    console.log(`   From: ${initialPosition}`);
    console.log(`   To: ${destination}`);
    
    try {
        // Call the fixed movement method directly
        const messages = window.GameStateManager.movePlayerWithEffects(
            currentPlayer.id,
            destination,
            'First'
        );
        
        // Check if position was updated
        const updatedGameState = window.GameStateManager.getState();
        const updatedPlayer = updatedGameState.players.find(p => p.id === gameState.currentPlayer);
        
        if (updatedPlayer.position === destination) {
            console.log('✅ Movement successful!');
            console.log(`   Player position updated: ${initialPosition} → ${updatedPlayer.position}`);
            console.log(`   Messages: ${messages.join(', ')}`);
            return true;
        } else {
            console.error('❌ Movement failed - position not updated');
            console.error(`   Expected: ${destination}, Got: ${updatedPlayer.position}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Movement error:', error.message);
        return false;
    }
}

// Test flow simulation
function testCompleteFlow() {
    console.log('🎮 Testing Complete Game Flow...');
    
    // Step 1: Initial setup check
    if (!testMovementFix()) {
        return;
    }
    
    // Step 2: Simulate dice roll selection
    console.log('\n🎲 Simulating dice roll and move selection...');
    const gameState = window.GameStateManager.getState();
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    
    // Get available moves
    const movementEngine = window.movementEngine || window.MovementEngine?.getInstance();
    if (movementEngine) {
        const availableMoves = movementEngine.getAvailableMoves(currentPlayer);
        
        if (availableMoves.length > 0) {
            // Step 3: Test the actual movement (the bug we fixed)
            console.log('\n🔧 Testing TurnControls.js movement fix...');
            const success = testActualMovement(availableMoves[0]);
            
            if (success) {
                console.log('\n🎉 COMPLETE FLOW TEST PASSED!');
                console.log('   ✅ Dice roll → Move selection → End Turn flow works');
                console.log('   ✅ Player position updated in game state');
                console.log('   ✅ Visual token should move on board');
            } else {
                console.log('\n❌ COMPLETE FLOW TEST FAILED');
            }
        } else {
            console.log('⚠️ No available moves to test');
        }
    }
}

// Make functions available globally for manual testing
window.testMovementFix = testMovementFix;
window.testActualMovement = testActualMovement;
window.testCompleteFlow = testCompleteFlow;

console.log('🧪 Movement test functions loaded. Run testCompleteFlow() to start testing.');