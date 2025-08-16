// Simple test script to start server and test image loading
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing From Dusk to Don Server...');
console.log('Current directory:', process.cwd());

// Check if key files exist
const filesToCheck = [
    'server.js',
    'index.html',
    'From DusktoDonLogo.png',
    'Asian female.png',
    'game.js'
];

console.log('\n📁 Checking files:');
filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Test if we can read an image file
console.log('\n🖼️ Testing image file access:');
try {
    const logoPath = 'From DusktoDonLogo.png';
    if (fs.existsSync(logoPath)) {
        const imageData = fs.readFileSync(logoPath);
        console.log(`✅ Logo image loaded successfully (${imageData.length} bytes)`);
        console.log(`   File type: ${imageData[0] === 0x89 && imageData[1] === 0x50 ? 'PNG' : 'Unknown'}`);
    } else {
        console.log('❌ Logo image not found');
    }
} catch (error) {
    console.log('❌ Error reading logo image:', error.message);
}

console.log('\n🚀 Starting server...');
require('./server.js');
