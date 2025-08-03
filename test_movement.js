#!/usr/bin/env node

/**
 * Movement System Verification Script
 * Tests player movement mechanics and related functionality
 */

const fs = require('fs');

console.log('🚶 MOVEMENT SYSTEM VERIFICATION');
console.log('===============================\n');

let hasErrors = false;

// Test 1: Check movement-related files
console.log('📁 Test 1: Movement System Files');
const movementFiles = [
    'game/js/utils/MovementEngine.js',
    'game/js/components/MovementSection.js',
    'game/js/components/GameBoard.js',
    'game/data/MOVEMENT.csv',
    'game/data/DICE_OUTCOMES.csv'
];

for (const file of movementFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`✅ ${file} (${content.length} bytes)`);
    } catch (error) {
        console.log(`❌ ${file} - ${error.message}`);
        hasErrors = true;
    }
}

// Test 2: Check GameStateManager movement methods
console.log('\n🎮 Test 2: GameStateManager Movement Methods');
try {
    const gsm = fs.readFileSync('game/js/data/GameStateManager.js', 'utf8');
    
    const hasMovePlayer = gsm.includes('movePlayer(');
    const hasMovePlayerWithEffects = gsm.includes('movePlayerWithEffects(');
    const hasEndTurn = gsm.includes('endTurn(');
    
    if (hasMovePlayer && hasMovePlayerWithEffects && hasEndTurn) {
        console.log('✅ Movement methods present in GameStateManager');
    } else {
        console.log(`❌ Missing movement methods: movePlayer=${hasMovePlayer}, movePlayerWithEffects=${hasMovePlayerWithEffects}, endTurn=${hasEndTurn}`);
        hasErrors = true;
    }
    
} catch (error) {
    console.log(`❌ GameStateManager movement check failed: ${error.message}`);
    hasErrors = true;
}

// Test 3: Check MovementEngine structure
console.log('\n🔧 Test 3: MovementEngine Functions');
try {
    const movementEngine = fs.readFileSync('game/js/utils/MovementEngine.js', 'utf8');
    
    const hasCalculateDestination = movementEngine.includes('calculateDestination');
    const hasValidateMovement = movementEngine.includes('validateMovement');
    const hasProcessMovement = movementEngine.includes('processMovement');
    
    if (hasCalculateDestination && hasValidateMovement && hasProcessMovement) {
        console.log('✅ MovementEngine functions available');
    } else {
        console.log('❌ MovementEngine missing core functions');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ MovementEngine check failed: ${error.message}`);
    hasErrors = true;
}

// Test 4: Check MOVEMENT.csv structure
console.log('\n📊 Test 4: Movement CSV Structure');
try {
    const movementCSV = fs.readFileSync('game/data/MOVEMENT.csv', 'utf8');
    const lines = movementCSV.split('\n');
    const header = lines[0];
    
    const hasSpaceName = header.includes('space_name');
    const hasVisitType = header.includes('visit_type');
    const hasDestinations = header.includes('destinations') || header.includes('destination');
    
    if (hasSpaceName && hasVisitType && hasDestinations) {
        console.log(`✅ Movement CSV structure OK (${lines.length - 1} entries)`);
    } else {
        console.log('❌ Movement CSV missing required columns');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ Movement CSV check failed: ${error.message}`);
    hasErrors = true;
}

// Test 5: Check DICE_OUTCOMES.csv structure
console.log('\n🎲 Test 5: Dice Outcomes CSV Structure');
try {
    const diceCSV = fs.readFileSync('game/data/DICE_OUTCOMES.csv', 'utf8');
    const lines = diceCSV.split('\n');
    const header = lines[0];
    
    const hasSpaceName = header.includes('space_name');
    const hasDiceValue = header.includes('dice_value') || header.includes('roll');
    const hasDestination = header.includes('destination');
    
    if (hasSpaceName && hasDiceValue && hasDestination) {
        console.log(`✅ Dice outcomes CSV structure OK (${lines.length - 1} entries)`);
    } else {
        console.log('❌ Dice outcomes CSV missing required columns');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ Dice outcomes CSV check failed: ${error.message}`);
    hasErrors = true;
}

// Test 6: Check CSVDatabase movement queries
console.log('\n🗄️ Test 6: CSVDatabase Movement Queries');
try {
    const csvDB = fs.readFileSync('game/js/data/CSVDatabase.js', 'utf8');
    
    const hasMovementQueries = csvDB.includes('get movement()') || csvDB.includes('movement:');
    const hasDiceOutcomeQueries = csvDB.includes('get diceOutcomes()');
    
    if (hasMovementQueries && hasDiceOutcomeQueries) {
        console.log('✅ CSVDatabase movement query methods available');
    } else {
        console.log('❌ CSVDatabase missing movement query capabilities');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ CSVDatabase movement check failed: ${error.message}`);
    hasErrors = true;
}

console.log('\n📊 MOVEMENT SYSTEM VERIFICATION RESULTS');
console.log('=======================================');

if (hasErrors) {
    console.log('❌ MOVEMENT SYSTEM ISSUES FOUND');
    console.log('🚨 Player movement functionality likely to fail');
    process.exit(1);
} else {
    console.log('✅ MOVEMENT SYSTEM STRUCTURE OK');
    console.log('🎯 Player movement should work (structural verification passed)');
    process.exit(0);
}