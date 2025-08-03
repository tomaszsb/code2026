#!/usr/bin/env node

/**
 * Card System Verification Script
 * Tests the card-related functionality without requiring browser environment
 */

const fs = require('fs');
const path = require('path');

console.log('🃏 CARD SYSTEM VERIFICATION');
console.log('===========================\n');

let hasErrors = false;

// Test 1: Check if card-related files exist
console.log('📁 Test 1: Card System Files');
const cardFiles = [
    'game/js/utils/CardUtils.js',
    'game/js/components/CardsInHand.js',
    'game/js/components/CardModal.js',
    'game/data/cards.csv'
];

for (const file of cardFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`✅ ${file} (${content.length} bytes)`);
    } catch (error) {
        console.log(`❌ ${file} - ${error.message}`);
        hasErrors = true;
    }
}

// Test 2: Check if GameStateManager has card-related methods
console.log('\n🎮 Test 2: GameStateManager Card Methods');
try {
    const gsm = fs.readFileSync('game/js/data/GameStateManager.js', 'utf8');
    
    const hasAddCardsToPlayer = gsm.includes('addCardsToPlayer(');
    const hasUsePlayerCard = gsm.includes('usePlayerCard(');
    const hasGiveCardToPlayer = gsm.includes('giveCardToPlayer');
    
    if (hasAddCardsToPlayer && hasUsePlayerCard) {
        console.log('✅ Card management methods present');
    } else {
        console.log(`❌ Missing card methods: addCardsToPlayer=${hasAddCardsToPlayer}, usePlayerCard=${hasUsePlayerCard}`);
        hasErrors = true;
    }
    
    if (hasGiveCardToPlayer) {
        console.log('✅ Debug function giveCardToPlayer present');
    } else {
        console.log('❌ Debug function giveCardToPlayer missing');
        hasErrors = true;
    }
    
} catch (error) {
    console.log(`❌ GameStateManager card method check failed: ${error.message}`);
    hasErrors = true;
}

// Test 3: Check CardUtils structure
console.log('\n🔧 Test 3: CardUtils Functions');
try {
    const cardUtils = fs.readFileSync('game/js/utils/CardUtils.js', 'utf8');
    
    const hasGetCardTypeConfig = cardUtils.includes('getCardTypeConfig');
    const hasFormatCardValue = cardUtils.includes('formatCardValue');
    const hasSortCardsByType = cardUtils.includes('sortCardsByType');
    
    if (hasGetCardTypeConfig && hasFormatCardValue && hasSortCardsByType) {
        console.log('✅ CardUtils functions available');
    } else {
        console.log('❌ CardUtils missing core functions');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ CardUtils check failed: ${error.message}`);
    hasErrors = true;
}

// Test 4: Check CSV cards structure
console.log('\n📊 Test 4: Cards CSV Structure');
try {
    const cardsCSV = fs.readFileSync('game/data/cards.csv', 'utf8');
    const lines = cardsCSV.split('\n');
    const header = lines[0];
    
    const hasCardId = header.includes('card_id');
    const hasCardType = header.includes('card_type');
    const hasCardName = header.includes('card_name');
    
    if (hasCardId && hasCardType && hasCardName) {
        console.log(`✅ Cards CSV structure OK (${lines.length - 1} cards)`);
        
        // Check if W001 exists (used in test)
        const hasW001 = cardsCSV.includes('W001');
        if (hasW001) {
            console.log('✅ Test card W001 exists');
        } else {
            console.log('❌ Test card W001 missing');
            hasErrors = true;
        }
    } else {
        console.log('❌ Cards CSV missing required columns');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ Cards CSV check failed: ${error.message}`);
    hasErrors = true;
}

// Test 5: Check CSVDatabase card query methods
console.log('\n🗄️ Test 5: CSVDatabase Card Queries');
try {
    const csvDB = fs.readFileSync('game/js/data/CSVDatabase.js', 'utf8');
    
    const hasCardQueries = csvDB.includes('cards:') || csvDB.includes('"cards"');
    const hasQueryMethod = csvDB.includes('.query(');
    const hasFindMethod = csvDB.includes('.find(');
    
    if (hasCardQueries && hasQueryMethod && hasFindMethod) {
        console.log('✅ CSVDatabase card query methods available');
    } else {
        console.log('❌ CSVDatabase missing card query capabilities');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ CSVDatabase check failed: ${error.message}`);
    hasErrors = true;
}

console.log('\n📊 CARD SYSTEM VERIFICATION RESULTS');
console.log('===================================');

if (hasErrors) {
    console.log('❌ CARD SYSTEM ISSUES FOUND');
    console.log('🚨 Card drawing functionality likely to fail');
    process.exit(1);
} else {
    console.log('✅ CARD SYSTEM STRUCTURE OK');
    console.log('🎯 Card drawing should work (structural verification passed)');
    console.log('📝 Note: Debug functions require debugMode=true in browser');
    process.exit(0);
}