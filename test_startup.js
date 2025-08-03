#!/usr/bin/env node

/**
 * Startup Verification Script
 * Tests the core components for syntax errors and basic functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 STARTUP VERIFICATION SCRIPT');
console.log('==============================\n');

let hasErrors = false;

// Test 1: Check if core files exist and are readable
console.log('📁 Test 1: File Accessibility');
const coreFiles = [
    'game/index.html',
    'game/js/data/GameStateManager.js',
    'game/js/data/CSVDatabase.js',
    'game/js/utils/ComponentUtils.js',
    'game/js/components/FixedApp.js'
];

for (const file of coreFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`✅ ${file} (${content.length} bytes)`);
    } catch (error) {
        console.log(`❌ ${file} - ${error.message}`);
        hasErrors = true;
    }
}

// Test 2: Check for obvious syntax issues in JavaScript files
console.log('\n🔍 Test 2: Basic Syntax Check');
const jsFiles = [
    'game/js/data/GameStateManager.js',
    'game/js/data/CSVDatabase.js',
    'game/js/utils/ComponentUtils.js'
];

for (const file of jsFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic checks for common issues
        const hasUnclosedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
        const hasUnclosedParens = (content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length;
        const hasUnclosedBrackets = (content.match(/\[/g) || []).length !== (content.match(/\]/g) || []).length;
        
        if (hasUnclosedBraces || hasUnclosedParens || hasUnclosedBrackets) {
            console.log(`❌ ${file} - Mismatched brackets/braces/parentheses`);
            hasErrors = true;
        } else {
            console.log(`✅ ${file} - Basic syntax OK`);
        }
    } catch (error) {
        console.log(`❌ ${file} - ${error.message}`);
        hasErrors = true;
    }
}

// Test 3: Check if GameStateManager class structure is intact
console.log('\n🎮 Test 3: GameStateManager Structure');
try {
    const gsm = fs.readFileSync('game/js/data/GameStateManager.js', 'utf8');
    
    const hasClass = gsm.includes('class GameStateManager');
    const hasConstructor = gsm.includes('constructor()');
    const hasEmit = gsm.includes('emit(eventName');
    const hasOn = gsm.includes('on(eventName');
    const hasInitializeGame = gsm.includes('initializeGame(');
    
    if (hasClass && hasConstructor && hasEmit && hasOn && hasInitializeGame) {
        console.log('✅ GameStateManager structure intact');
    } else {
        console.log('❌ GameStateManager missing core methods');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ GameStateManager check failed: ${error.message}`);
    hasErrors = true;
}

// Test 4: Check if useGameState hook exists
console.log('\n🔧 Test 4: useGameState Hook');
try {
    const utils = fs.readFileSync('game/js/utils/ComponentUtils.js', 'utf8');
    
    const hasUseGameState = utils.includes('function useGameState()');
    const hasUseCSVData = utils.includes('function useCSVData()');
    
    if (hasUseGameState && hasUseCSVData) {
        console.log('✅ React hooks available');
    } else {
        console.log('❌ React hooks missing');
        hasErrors = true;
    }
} catch (error) {
    console.log(`❌ Hook check failed: ${error.message}`);
    hasErrors = true;
}

console.log('\n📊 VERIFICATION RESULTS');
console.log('=======================');

if (hasErrors) {
    console.log('❌ CRITICAL ISSUES FOUND - Game startup likely to fail');
    console.log('🚨 Action required: Fix the identified issues before proceeding');
    process.exit(1);
} else {
    console.log('✅ NO CRITICAL ISSUES DETECTED');
    console.log('🎯 Core files appear structurally sound');
    console.log('⚡ Game startup should work (basic verification passed)');
    process.exit(0);
}