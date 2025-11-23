// ⚠️ DEPRECATED - Use server.js instead
// This file is kept for reference only
// The main server.js now includes startup file checking

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing server files...\n');

// Files to check
const requiredFiles = [
    'server.js',
    'index.html',
    'gamelogo.png',
    'Asian female.png',
    'game.js'
];

let allFilesExist = true;

// Check if files exist
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(exists ? '✅' : '❌', file);
    if (!exists) allFilesExist = false;
});

console.log('');

// Try to access image files to verify they're readable
const imageFiles = requiredFiles.filter(f => f.endsWith('.png'));
imageFiles.forEach(imgFile => {
    try {
        const buffer = fs.readFileSync(imgFile);
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50; // PNG magic bytes
        console.log(isPng ? '🖼️ ' : '⚠️ ', imgFile, 'is', isPng ? 'a valid PNG' : 'NOT a PNG file');
    } catch(e) {
        console.log('❌ Cannot read', imgFile);
    }
});

console.log('');

if (allFilesExist) {
    console.log('✅ All required files exist! Starting server...\n');
    require('./server.js');
} else {
    console.log('❌ Some files are missing. Please check the files above.\n');
    process.exit(1);
}
