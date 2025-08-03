#!/usr/bin/env node

/**
 * Test Script Order Fix
 * Verify debug mode detection is moved to head
 */

const fs = require('fs');

console.log('🎯 VERIFYING SCRIPT ORDER FIX');
console.log('=============================\n');

const htmlContent = fs.readFileSync('game/index.html', 'utf8');

// Test 1: Check debug detection is in head
console.log('✅ Test 1: Debug Detection in Head');
const headSection = htmlContent.substring(
    htmlContent.indexOf('<head>'), 
    htmlContent.indexOf('</head>')
);

const hasEarlyDebugDetection = headSection.includes('window.debugMode = true') && 
                               headSection.includes('DEBUG: window.debugMode set to true EARLY');

if (hasEarlyDebugDetection) {
    console.log('✅ Debug detection moved to head section');
} else {
    console.log('❌ Debug detection not found in head section');
}

// Test 2: Check original debug detection is modified
console.log('\n✅ Test 2: Original Debug Detection Modified');
const hasOldPattern = htmlContent.includes('const debugMode = urlParams.get(\'debug\') === \'true\';\n        const logLevel');
const hasNewPattern = htmlContent.includes('const debugMode = window.debugMode || false;');

if (!hasOldPattern && hasNewPattern) {
    console.log('✅ Original debug detection properly modified');
} else {
    console.log('❌ Original debug detection not properly modified');
    console.log(`   - Old pattern removed: ${!hasOldPattern}`);
    console.log(`   - New pattern added: ${hasNewPattern}`);
}

// Test 3: Check positioning
console.log('\n✅ Test 3: Script Positioning');
const titleIndex = htmlContent.indexOf('<title>');
const debugScriptIndex = htmlContent.indexOf('window.debugMode = true');
const firstJSScriptIndex = htmlContent.indexOf('js/config.js');

const correctOrder = titleIndex < debugScriptIndex && debugScriptIndex < firstJSScriptIndex;

if (correctOrder) {
    console.log('✅ Script execution order is correct');
} else {
    console.log('❌ Script execution order is incorrect');
}

console.log('\n📊 SCRIPT ORDER FIX VERIFICATION');
console.log('=================================');

if (hasEarlyDebugDetection && !hasOldPattern && hasNewPattern && correctOrder) {
    console.log('🎉 SCRIPT ORDER FIX SUCCESSFUL!');
    console.log('\n🔄 Expected Execution Order:');
    console.log('   1. HTML head loads');
    console.log('   2. Debug detection script runs → window.debugMode = true');
    console.log('   3. GameManager.js loads → sees window.debugMode = true');
    console.log('   4. giveCardToPlayer function gets created');
    console.log('   5. User can call window.giveCardToPlayer() successfully');
    console.log('\n🧪 Test Command (should work now):');
    console.log('   window.giveCardToPlayer(window.GameStateManager.state.players[0].id, "W001")');
} else {
    console.log('❌ SCRIPT ORDER FIX INCOMPLETE');
    console.log(`   - Early debug detection: ${hasEarlyDebugDetection}`);
    console.log(`   - Old pattern removed: ${!hasOldPattern}`);
    console.log(`   - New pattern added: ${hasNewPattern}`);
    console.log(`   - Correct order: ${correctOrder}`);
}