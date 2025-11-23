// ⚠️ DEPRECATED - Use server.js instead
// This file is kept for reference only
// The main server.js now includes all functionality

const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple test server
const PORT = 8080;

const server = http.createServer((req, res) => {
    console.log('📥 Request:', req.url);
    
    let reqPath = decodeURIComponent(req.url);
    if (reqPath.includes('\0')) reqPath = reqPath.replace(/\0/g, '');
    // Prevent directory traversal and only serve files from the current directory
    let filePath = path.normalize(path.join(process.cwd(), reqPath));
    if (reqPath === '/' || reqPath === '') {
        filePath = path.join(process.cwd(), 'index.html');
    }
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log('❌ File not found:', filePath);
        res.writeHead(404);
        res.end('File not found: ' + req.url);
        return;
    }
    
    // Determine content type
    const ext = filePath.split('.').pop().toLowerCase();
    const contentTypes = {
        'html': 'text/html',
        'js': 'text/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.log('❌ Error reading file:', err);
            res.writeHead(500);
            res.end('Error reading file');
            return;
        }
        
        console.log('✅ Serving:', filePath, '(' + contentType + ')');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log('🚀 Test server running on http://localhost:' + PORT);
    console.log('📁 Serving from:', process.cwd());
    
    // List available PNG files
    const pngs = fs.readdirSync('.').filter(file => file.endsWith('.png'));
    console.log('🖼️ Available images:', pngs.length > 0 ? pngs : 'None found');
});
