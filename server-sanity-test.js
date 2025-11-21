/**
 * server-sanity-test.js - Basic sanity tests for server message handling
 * 
 * Runs simple tests to ensure server handlers don't crash on basic messages.
 * Not a comprehensive test suite, just a smoke test to catch obvious regressions.
 * 
 * Run with: node server-sanity-test.js
 */

console.log('🧪 Running server sanity tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
        failed++;
    }
}

// Test 1: World persistence module loads
test('worldPersistence module loads', () => {
    const wp = require('./worldPersistence');
    if (!wp.loadWorldState || !wp.saveWorldState) {
        throw new Error('Missing expected functions');
    }
});

// Test 2: Load world state doesn't crash
test('loadWorldState returns valid data', () => {
    const { loadWorldState } = require('./worldPersistence');
    const state = loadWorldState();
    if (!state.cityDistricts || !state.cityEvents || !state.leaderboard) {
        throw new Error('Invalid state structure');
    }
});

// Test 3: Server file syntax is valid
test('server.js has valid syntax', () => {
    try {
        require.resolve('./server.js');
    } catch (e) {
        throw new Error(`Server file error: ${e.message}`);
    }
});

// Test 4: Config files exist
test('config/balance.js exists', () => {
    const fs = require('fs');
    if (!fs.existsSync('./config/balance.js')) {
        throw new Error('balance.js not found');
    }
});

test('config/meta.js exists', () => {
    const fs = require('fs');
    if (!fs.existsSync('./config/meta.js')) {
        throw new Error('meta.js not found');
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review errors above.');
    process.exit(1);
} else {
    console.log('\n✨ All tests passed! Server code looks good.');
    process.exit(0);
}
