// ==================== MAFIA BORN - MULTIPLAYER SERVER ====================
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
// JSON file persistence utilities
const { loadWorldState, saveWorldState, flushWorldState } = require('./worldPersistence');
// User accounts & authentication
const userDB = require('./userDB');

// Server configuration
const PORT = process.env.PORT || 3000;
// Allowed origins for CORS (game website)
const ALLOWED_ORIGINS = [
    'https://mafiaborn.com',
    'http://mafiaborn.com',
    'https://www.mafiaborn.com',
    'http://www.mafiaborn.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

function getCorsHeaders(req) {
    const origin = req.headers.origin || '*';
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, getCorsHeaders(req));
        res.end();
        return;
    }

    // Quick health route for monitoring
    try {
        const urlPath = req.url.split('?')[0];
        if (urlPath === '/health' || urlPath === '/status') {
            const status = {
                status: 'ok',
                serverTime: Date.now(),
                playersConnected: clients ? clients.size : 0,
                serverName: 'Mafia Born - Multiplayer Server'
            };
            res.writeHead(200, { 'Content-Type': 'application/json', ...getCorsHeaders(req) });
            res.end(JSON.stringify(status));
            return;
        }
    } catch (e) {
        // fall through to normal handling
    }

    // ==================== AUTH & CLOUD-SAVE API ====================
    const urlPath = req.url.split('?')[0];
    if (urlPath.startsWith('/api/')) {
        const cors = getCorsHeaders(req);
        cors['Content-Type'] = 'application/json';

        // Helper: read JSON body
        const readBody = () => new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
                if (data.length > 1e7) { reject(new Error('Payload too large')); req.destroy(); }
            });
            req.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Invalid JSON')); }
            });
        });

        // Helper: extract auth token
        const getToken = () => {
            const auth = req.headers.authorization || '';
            return auth.startsWith('Bearer ') ? auth.slice(7) : null;
        };

        // Helper: send JSON response
        const json = (code, obj) => {
            res.writeHead(code, cors);
            res.end(JSON.stringify(obj));
        };

        try {
            // ── POST /api/register ─────────────────────────
            if (urlPath === '/api/register' && req.method === 'POST') {
                const { username, password } = await readBody();
                if (!username || !password) return json(400, { error: 'Username and password required' });
                const result = userDB.createUser(username.trim(), password);
                if (!result.ok) return json(400, { error: result.error });
                const token = userDB.createSession(username.trim().toLowerCase());
                return json(201, { ok: true, token, username: username.trim() });
            }

            // ── POST /api/login ────────────────────────────
            if (urlPath === '/api/login' && req.method === 'POST') {
                const { username, password } = await readBody();
                if (!username || !password) return json(400, { error: 'Username and password required' });
                const result = userDB.authenticateUser(username.trim(), password);
                if (!result.ok) return json(401, { error: result.error });
                const token = userDB.createSession(username.trim().toLowerCase());
                return json(200, { ok: true, token, username: result.username });
            }

            // ── POST /api/logout ───────────────────────────
            if (urlPath === '/api/logout' && req.method === 'POST') {
                const token = getToken();
                if (token) userDB.destroySession(token);
                return json(200, { ok: true });
            }

            // ── GET /api/profile ───────────────────────────
            if (urlPath === '/api/profile' && req.method === 'GET') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                const info = userDB.getUserInfo(username);
                return json(200, info);
            }

            // ── POST /api/save ─────────────────────────────
            if (urlPath === '/api/save' && req.method === 'POST') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                const body = await readBody();
                if (!body || !body.data) return json(400, { error: 'Save data required' });
                // Wrap with metadata
                const saveEntry = {
                    playerName: body.playerName || 'Unknown',
                    level: body.level || 1,
                    money: body.money || 0,
                    reputation: body.reputation || 0,
                    empireRating: body.empireRating || 0,
                    playtime: body.playtime || '0:00',
                    saveDate: new Date().toISOString(),
                    gameVersion: body.gameVersion || '1.3.8',
                    data: body.data
                };
                userDB.setUserSave(username, saveEntry);
                return json(200, { ok: true, saveDate: saveEntry.saveDate });
            }

            // ── GET /api/load ──────────────────────────────
            if (urlPath === '/api/load' && req.method === 'GET') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                const save = userDB.getUserSave(username);
                if (!save) return json(404, { error: 'No cloud save found' });
                return json(200, save);
            }

            // ── POST /api/change-password ──────────────────
            if (urlPath === '/api/change-password' && req.method === 'POST') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                const { oldPassword, newPassword } = await readBody();
                if (!oldPassword || !newPassword) return json(400, { error: 'Both passwords required' });
                const result = userDB.changePassword(username, oldPassword, newPassword);
                if (!result.ok) return json(400, { error: result.error });
                return json(200, { ok: true });
            }

            // ── GET /api/check-name?name=xxx ───────────────
            if (urlPath === '/api/check-name' && req.method === 'GET') {
                const qs = (req.url.split('?')[1] || '');
                const params = new URLSearchParams(qs);
                const name = params.get('name');
                if (!name || name.trim().length === 0) return json(400, { error: 'Name required' });
                // If the caller is logged in, exclude their own account
                const token = getToken();
                const caller = token ? userDB.validateToken(token) : null;
                const taken = userDB.isPlayerNameTaken(name.trim(), caller);
                return json(200, { taken });
            }

            // ── DELETE /api/account ────────────────────────
            if (urlPath === '/api/account' && req.method === 'DELETE') {
                const token = getToken();
                const username = userDB.validateToken(token);
                if (!username) return json(401, { error: 'Not authenticated' });
                userDB.destroySession(token);
                userDB.deleteUser(username);
                return json(200, { ok: true });
            }

            // Unknown API route
            return json(404, { error: 'Not found' });

        } catch (err) {
            console.error('API error:', err.message);
            return json(err.message === 'Payload too large' ? 413 : 400, { error: err.message });
        }
    }

    // Handle HTTP requests to serve game files
    let reqPath = decodeURIComponent(req.url); // Decode URL to handle spaces
    if (reqPath.includes('\0')) reqPath = reqPath.replace(/\0/g, '');
    
    // Determine the static files root directory
    // In cPanel, game files may be in ../public_html while server runs from a separate dir
    const cwd = process.cwd();
    const publicHtmlDir = path.join(path.dirname(cwd), 'public_html');
    const hasPublicHtml = fs.existsSync(publicHtmlDir);
    const staticRoot = hasPublicHtml ? publicHtmlDir : cwd;
    
    // Normalize path and restrict serving to the static root
    let filePath = path.normalize(path.join(staticRoot, reqPath));
    if (reqPath === '/' || reqPath === '') {
        filePath = path.join(staticRoot, 'index.html');
    }
    // Prevent path traversal attacks - ensure resolved path is under the static root
    if (!filePath.startsWith(staticRoot)) {
        console.log(`⚠️ Attempted path traversal: ${req.url} -> ${filePath}`);
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end(`<h1>403 Forbidden</h1><p>Access denied</p>`);
        return;
    }
    if (filePath === './') {
        filePath = path.join(staticRoot, 'index.html');
    }
    
    console.log(`Request for: ${req.url} -> ${filePath}`);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`❌ File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1>🎮 Mafia Born - Multiplayer Server</h1>
                    <p>File not found: ${req.url}</p>
                    <p><a href="/">🏠 Go to Game</a></p>
                    <hr>
                    <p>Server Status: ✅ Online | Players Connected: ${clients.size}</p>
                `, 'utf-8');
            } else {
                console.log(`❌ Server error for ${filePath}:`, error);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Add CORS headers for cross-origin requests
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            // Don't specify encoding for binary files (images, etc.)
            if (contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('json')) {
                res.end(content, 'utf-8');
            } else {
                res.end(content);
            }
            console.log(`✅ Served: ${filePath} (${contentType})`);
        }
    });
});

const wss = new WebSocket.Server({
    server,
    // Accept WebSocket connections from allowed origins
    verifyClient: (info) => {
        const origin = info.origin || info.req.headers.origin || '';
        // Allow all origins in development, check in production
        if (!origin || origin === 'null') return true; // file:// or direct
        return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed)) || origin.includes('localhost');
    }
});

// Heartbeat & Security Configuration
const HEARTBEAT_INTERVAL = 30000;
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_MESSAGES_PER_WINDOW = 5;
const clientMessageHistory = new Map();

// Basic Profanity Filter (Expand as needed)
const BAD_WORDS = ['admin', 'system', 'mod', 'moderator', 'fuck', 'shit', 'ass', 'bitch']; 

function isProfane(text) {
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
}

function checkRateLimit(clientId) {
    const now = Date.now();
    let history = clientMessageHistory.get(clientId) || [];
    // Remove old timestamps
    history = history.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (history.length >= MAX_MESSAGES_PER_WINDOW) {
        return false;
    }
    
    history.push(now);
    clientMessageHistory.set(clientId, history);
    return true;
}

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(noop);
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', function close() {
  clearInterval(interval);
});

// Bot names used for jail bot inmates
const JAIL_BOT_NAMES = [
    "Tony \"The Snake\" Marconi", "Vincent \"Vinny\" Romano",
    "Marco \"The Bull\" Santangelo", "Sal \"Scarface\" DeLuca",
    "Frank \"The Hammer\" Rossini", "Joey \"Two-Times\" Castellano",
    "Nick \"The Knife\" Moretti", "Rocco \"Rocky\" Benedetto",
    "Anthony \"Big Tony\" Genovese", "Michael \"Mikey\" Calabrese",
    "Dominic \"Dom\" Torrino", "Carlo \"The Cat\" Bianchi"
];

// Game state
const gameState = {
    players: new Map(),
    playerStates: new Map(), // Detailed player states including jail status
    cityDistricts: {},
    activeHeists: [],
    globalChat: [],
    cityEvents: [],
    gangWars: [],
    jailBots: [], // Server-managed bot inmates (max 3, 0 if 3+ real players in jail)
    // Unified territory system — 8 districts, server-authoritative
    territories: {},
    serverStats: {
        startTime: Date.now(),
        totalConnections: 0,
        messagesSent: 0,
        jailbreakAttempts: 0,
        successfulJailbreaks: 0
    }
};

// ── Unified Territory Constants (mirror of territories.js for CommonJS) ──
const TERRITORY_IDS = [
    'residential_low', 'residential_middle', 'residential_upscale',
    'commercial_downtown', 'commercial_shopping',
    'industrial_warehouse', 'industrial_port',
    'entertainment_nightlife'
];
const TAX_RATE = 0.10;
const MOVE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function buildDefaultTerritories() {
    const t = {};
    for (const id of TERRITORY_IDS) {
        t[id] = { owner: null, residents: [], defenseRating: 100, taxCollected: 0 };
    }
    return t;
}

// Load world persistence on startup
let persistedLeaderboard = [];
try {
    const persisted = loadWorldState();
    gameState.cityDistricts = persisted.cityDistricts || {};
    gameState.cityEvents = Array.isArray(persisted.cityEvents) ? persisted.cityEvents : [];
    persistedLeaderboard = Array.isArray(persisted.leaderboard) ? persisted.leaderboard : [];
    // Load unified territories (fall back to fresh defaults)
    gameState.territories = persisted.territories || buildDefaultTerritories();
    console.log('💾 World state loaded from world-state.json');
} catch (e) {
    console.log('⚠️ Failed to load world state; using defaults');
    // Provide defaults if not loaded
    gameState.cityDistricts = {
        downtown: { controlledBy: null, crimeLevel: 50 },
        docks: { controlledBy: null, crimeLevel: 75 },
        suburbs: { controlledBy: null, crimeLevel: 25 },
        industrial: { controlledBy: null, crimeLevel: 60 },
        redlight: { controlledBy: null, crimeLevel: 90 }
    };
    gameState.cityEvents = [
        { type: 'police_raid', district: 'industrial', description: 'Heavy police presence, high risk/reward jobs available', timeLeft: '15 min', createdAt: Date.now() },
        { type: 'market_crash', district: 'downtown', description: 'Economic instability, weapon prices fluctuating', timeLeft: '1 hour', createdAt: Date.now() },
        { type: 'gang_meeting', district: 'docks', description: 'Underground meeting, recruitment opportunities', timeLeft: '30 min', createdAt: Date.now() }
    ];
    gameState.territories = buildDefaultTerritories();
}

// Debounced save to avoid frequent disk writes
let savePending = false;
function scheduleWorldSave() {
    if (savePending) return;
    savePending = true;
    setTimeout(() => {
        savePending = false;
        try {
            saveWorldState({
                cityDistricts: gameState.cityDistricts,
                cityEvents: gameState.cityEvents,
                leaderboard: persistedLeaderboard,
                territories: gameState.territories
            });
        } catch (err) {
            console.error('⚠️ Error during world save:', err.message);
        }
    }, 5000);
}

// Connected clients
// Identity/session management
// - clients: Map of server-assigned playerId -> WebSocket (for targeted sends and broadcasting)
// - sessions: Map of WebSocket -> { playerId, playerName } (authoritative identity bound to connection)
const clients = new Map();
const sessions = new Map();

// Basic player name sanitization & uniqueness helpers
function sanitizePlayerName(raw) {
    let name = (raw || '').toString();
    // Strip HTML and trim
    name = name.replace(/<[^>]*>/g, '').trim();
    // Collapse whitespace
    name = name.replace(/\s+/g, ' ');
    // Enforce length
    if (name.length > 20) name = name.substring(0, 20);
    // Fallback if empty or profane
    if (!name || isProfane(name)) {
        name = `Player_${Math.random().toString(36).slice(-4)}`;
    }
    return name;
}

function ensureUniqueName(baseName) {
    const existing = new Set(Array.from(gameState.players.values()).map(p => p.name));
    if (!existing.has(baseName)) return baseName;
    // Append suffix until unique
    let i = 2;
    let candidate = `${baseName}#${i}`;
    while (existing.has(candidate) && i < 1000) {
        i++;
        candidate = `${baseName}#${i}`;
    }
    return candidate;
}

console.log('🌐 Mafia Born - Multiplayer Server Starting...');

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    // SERVER-SIDE IDENTITY: assign server-generated playerId and bind to this WebSocket
    const clientId = generateClientId();
    clients.set(clientId, ws);
    sessions.set(ws, { playerId: clientId, playerName: null });
    gameState.serverStats.totalConnections++;
    
    console.log(`🎮 Player connected: ${clientId} (Total: ${clients.size})`);
    
    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleClientMessage(clientId, message, ws);
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });
    
    // Heartbeat setup
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log(`👋 Player disconnected: ${clientId}`);
        
        // Remove player from game state
        const player = gameState.players.get(clientId);
        if (player) {
            // Broadcast disconnect
            broadcastToAll({
                type: 'player_disconnect',
                playerId: clientId,
                playerName: player.name
            }, clientId);
            
            // Remove from city districts if they controlled any
            Object.keys(gameState.cityDistricts).forEach(district => {
                if (gameState.cityDistricts[district].controlledBy === player.name) {
                    gameState.cityDistricts[district].controlledBy = null;
                    broadcastToAll({
                        type: 'territory_lost',
                        district: district,
                        playerName: player.name
                    });
                    scheduleWorldSave();
                }
            });
            
            gameState.players.delete(clientId);
            gameState.playerStates.delete(clientId);
            
            // Update jail bots (player leaving may change real-player-in-jail count)
            updateJailBots();
            
            // Broadcast updated player states and jail roster
            broadcastPlayerStates();
            broadcastJailRoster();
        }
        
        clients.delete(clientId);
        sessions.delete(ws);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection_established',
        playerId: clientId,
        serverInfo: {
            playerCount: clients.size,
            serverName: 'Mafia Born - Main Server',
            cityEvents: gameState.cityEvents,
            // Use last persisted snapshot for initial info
            globalLeaderboard: persistedLeaderboard
        }
    }));
});

// Handle client messages
function handleClientMessage(clientId, message, ws) {
    gameState.serverStats.messagesSent++;
    
    switch (message.type) {
        case 'player_connect':
            handlePlayerConnect(clientId, message, ws);
            break;
            
        case 'global_chat':
            handleGlobalChat(clientId, message);
            break;
            
        case 'territory_claim':
            handleTerritoryClaim(clientId, message);
            break;
            
        case 'territory_spawn':
            handleTerritorySpawn(clientId, message);
            break;

        case 'territory_move':
            handleTerritoryMove(clientId, message);
            break;

        case 'territory_info':
            handleTerritoryInfo(clientId, message, ws);
            break;

        case 'territory_claim_ownership':
            handleTerritoryClaimOwnership(clientId, message);
            break;

        case 'territory_war':
            handleTerritoryWar(clientId, message);
            break;

        case 'heist_create':
            handleHeistCreate(clientId, message);
            break;
            
        case 'heist_join':
            handleHeistJoin(clientId, message);
            break;
            
        case 'player_challenge':
            handlePlayerChallenge(clientId, message);
            break;
            
        case 'heist_start':
            handleHeistStart(clientId, message);
            break;

        case 'heist_leave':
            handleHeistLeave(clientId, message);
            break;

        case 'heist_cancel':
            handleHeistCancel(clientId, message);
            break;

        case 'heist_invite':
            handleHeistInvite(clientId, message);
            break;
            
        case 'player_update':
            handlePlayerUpdate(clientId, message);
            break;
            
        case 'jailbreak_attempt':
            handleJailbreakAttempt(clientId, message);
            break;
            
        case 'request_jail_roster':
            sendJailRoster(clientId, ws);
            break;
            
        case 'jailbreak_bot':
            handleJailbreakBot(clientId, message);
            break;

        case 'send_gift':
            handleSendGift(clientId, message);
            break;
            
        case 'request_world_state':
            sendWorldState(clientId, ws);
            break;

        
        // ==================== SERVER-AUTHORITATIVE INTENTS (FIRST PASS) ====================
        // Clients now send INTENT messages only. The server validates and computes outcomes.
        // Future gameplay actions should follow this pattern: client -> intent, server -> authoritative result.
        case 'assassination_attempt':
            handleAssassinationAttempt(clientId, message);
            break;

        case 'job_intent':
            handleJobIntent(clientId, message);
            break;
            
        default:
            console.log(`⚠️ Unknown message type: ${message.type}`);
    }
}

// Player connection handler
function handlePlayerConnect(clientId, message, ws) {
    // Sanitize and enforce uniqueness on desired name
    const desiredName = sanitizePlayerName(message.playerName || `Player_${clientId.slice(-4)}`);
    const finalName = ensureUniqueName(desiredName);
    // Persist on session for reference
    const sess = sessions.get(ws);
    if (sess) sess.playerName = finalName;

    const player = {
        id: clientId,
        name: finalName,
        money: message.playerStats?.money || 0,
        reputation: message.playerStats?.reputation || 0,
        territory: message.playerStats?.territory || 0,
        currentTerritory: message.playerStats?.currentTerritory || null,
        lastTerritoryMove: message.playerStats?.lastTerritoryMove || 0,
        level: message.playerStats?.level || 1,
        connectedAt: Date.now(),
        lastActive: Date.now()
    };
    
    gameState.players.set(clientId, player);
    
    // Initialize player state with jail status
    const playerState = {
        playerId: clientId,
        name: player.name,
        money: player.money,
        reputation: player.reputation,
        level: player.level,
        territory: player.territory,
        currentTerritory: player.currentTerritory,
        inJail: message.playerStats?.inJail || false,
        jailTime: message.playerStats?.jailTime || 0,
        health: message.playerStats?.health || 100,
        energy: message.playerStats?.energy || 100,
        wantedLevel: message.playerStats?.wantedLevel || 0,
        lastUpdate: Date.now()
    };
    
    gameState.playerStates.set(clientId, playerState);

    // Re-add player to their territory's resident list on reconnect
    if (player.currentTerritory && gameState.territories[player.currentTerritory]) {
        const residents = gameState.territories[player.currentTerritory].residents;
        if (!residents.includes(player.name)) {
            residents.push(player.name);
        }
    }
    
    console.log(`✅ Player registered: ${player.name} (ID: ${clientId}) ${playerState.inJail ? '[IN JAIL]' : ''}`);
    
    // Update jail bots based on new jail population
    updateJailBots();
    
    // Send initial game state
    ws.send(JSON.stringify({
        type: 'world_update',
        playerCount: clients.size,
        cityDistricts: gameState.cityDistricts,
        activeHeists: gameState.activeHeists,
        cityEvents: gameState.cityEvents,
        globalChat: gameState.globalChat.slice(-10), // Last 10 messages
        playerStates: Object.fromEntries(gameState.playerStates)
    }));
    
    // Send jail roster immediately
    sendJailRoster(clientId, ws);
    
    // Broadcast new player to others
    broadcastToAll({
        type: 'player_connect',
        playerId: clientId,
        playerName: player.name,
        playerStats: {
            level: player.level,
            reputation: player.reputation,
            territory: player.territory
        }
    }, clientId);
    
    // Broadcast updated player states
    broadcastPlayerStates();
    
    // Add join message to global chat
    addGlobalChatMessage('System', `${player.name} joined the criminal underworld!`, '#f39c12');
}

// Global chat handler
function handleGlobalChat(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;

    // Rate limiting check
    if (!checkRateLimit(clientId)) {
        const ws = clients.get(clientId);
        if (ws) {
            ws.send(JSON.stringify({
                type: 'system_message',
                message: 'You are sending messages too fast. Please slow down.',
                color: '#e74c3c'
            }));
        }
        return;
    }
    
    // Filter and sanitize message
    if (!message.message || typeof message.message !== 'string') return;
    let sanitizedMessage = message.message.replace(/<[^>]*>/g, '').substring(0, 200); // Remove HTML and limit length

    // Profanity filter
    if (isProfane(sanitizedMessage)) {
        const ws = clients.get(clientId);
        if (ws) {
            ws.send(JSON.stringify({
                type: 'system_message',
                message: 'Please keep the chat clean.',
                color: '#e74c3c'
            }));
        }
        return; // Block the message entirely
    }

    
    const chatMessage = {
        playerId: clientId,
        playerName: player.name,
        message: sanitizedMessage,
        timestamp: Date.now()
    };
    
    // Add to chat history
    gameState.globalChat.push(chatMessage);
    
    // Keep only last 50 messages
    if (gameState.globalChat.length > 50) {
        gameState.globalChat = gameState.globalChat.slice(-50);
    }
    
    console.log(`💬 ${player.name}: ${sanitizedMessage}`);
    
    // Broadcast to all players
    broadcastToAll({
        type: 'global_chat',
        playerId: clientId,
        playerName: player.name,
        message: sanitizedMessage,
        timestamp: chatMessage.timestamp,
        color: '#3498db' // Default color for other players
    });
}

// Territory claim handler
function handleTerritoryClaim(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    const district = message.district;
    if (!district || !gameState.cityDistricts[district]) return;
    const cost = 50000 + (gameState.cityDistricts[district].crimeLevel * 1000);
    
    if (player.money >= cost) {
        player.money -= cost;
        player.territory += 1;
        gameState.cityDistricts[district].controlledBy = player.name;
        // Keep authoritative playerStates map in sync
        const ps = gameState.playerStates.get(clientId);
        if (ps) {
            ps.money = player.money;
            ps.territory = player.territory;
            ps.lastUpdate = Date.now();
        }
        
        console.log(`🏛️ ${player.name} claimed ${district} for $${cost}`);
        
        // Broadcast territory change with authoritative numeric state
        broadcastToAll({
            type: 'territory_taken',
            district: district,
            playerName: player.name,
            playerId: clientId,
            money: player.money,
            territory: player.territory
        });
        
        // Add to global chat
        addGlobalChatMessage('System', `🏛️ ${player.name} claimed ${district} district!`, '#e74c3c');
        broadcastPlayerStates();
        scheduleWorldSave();
    }
}

// ==================== UNIFIED TERRITORY HANDLERS ====================

// Called once during character creation — player picks their starting district
function handleTerritorySpawn(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);

    const districtId = message.district;
    if (!districtId || !TERRITORY_IDS.includes(districtId)) {
        if (ws) ws.send(JSON.stringify({ type: 'territory_spawn_result', success: false, error: 'Invalid district.' }));
        return;
    }

    // Prevent double-spawn (player already has a territory)
    if (player.currentTerritory) {
        if (ws) ws.send(JSON.stringify({ type: 'territory_spawn_result', success: false, error: 'Already spawned.' }));
        return;
    }

    // Place the player
    player.currentTerritory = districtId;
    const terr = gameState.territories[districtId];
    if (terr && !terr.residents.includes(player.name)) {
        terr.residents.push(player.name);
    }

    // Sync playerStates
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.currentTerritory = districtId; ps.lastUpdate = Date.now(); }

    console.log(`📍 ${player.name} spawned in ${districtId}`);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'territory_spawn_result',
            success: true,
            district: districtId,
            territories: gameState.territories
        }));
    }

    broadcastToAll({
        type: 'territory_population_update',
        territories: gameState.territories
    });

    addGlobalChatMessage('System', `📍 ${player.name} set up shop in ${districtId.replace(/_/g, ' ')}!`, '#3498db');
    scheduleWorldSave();
}

// Player relocates to a different district (costs money + cooldown)
function handleTerritoryMove(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws) ws.send(JSON.stringify({ type: 'territory_move_result', success: false, error: err })); };

    const targetId = message.district;
    if (!targetId || !TERRITORY_IDS.includes(targetId)) return fail('Invalid district.');
    if (player.currentTerritory === targetId) return fail('You already live here.');

    // Cooldown check
    const now = Date.now();
    if (player.lastTerritoryMove && (now - player.lastTerritoryMove < MOVE_COOLDOWN_MS)) {
        const mins = Math.ceil((MOVE_COOLDOWN_MS - (now - player.lastTerritoryMove)) / 60000);
        return fail(`You must wait ${mins} more minute(s) before relocating.`);
    }

    // Cost check — use a flat cost based on district index (higher = pricier)
    const idx = TERRITORY_IDS.indexOf(targetId);
    const moveCost = [500, 1500, 5000, 4000, 2000, 2500, 8000, 3500][idx] || 2000;
    if ((player.money || 0) < moveCost) return fail(`Not enough money. Moving here costs $${moveCost.toLocaleString()}.`);

    // Deduct cost
    player.money -= moveCost;

    // Remove from old territory
    const oldId = player.currentTerritory;
    if (oldId && gameState.territories[oldId]) {
        const r = gameState.territories[oldId].residents;
        const i = r.indexOf(player.name);
        if (i >= 0) r.splice(i, 1);
    }

    // Add to new territory
    player.currentTerritory = targetId;
    player.lastTerritoryMove = now;
    const terr = gameState.territories[targetId];
    if (terr && !terr.residents.includes(player.name)) {
        terr.residents.push(player.name);
    }

    // Sync playerStates
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.currentTerritory = targetId; ps.money = player.money; ps.lastUpdate = now; }

    console.log(`🚚 ${player.name} moved from ${oldId} to ${targetId} ($${moveCost})`);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'territory_move_result',
            success: true,
            district: targetId,
            cost: moveCost,
            money: player.money,
            territories: gameState.territories
        }));
    }

    broadcastToAll({
        type: 'territory_population_update',
        territories: gameState.territories
    });

    addGlobalChatMessage('System', `🚚 ${player.name} relocated to ${targetId.replace(/_/g, ' ')}!`, '#9b59b6');
    broadcastPlayerStates();
    scheduleWorldSave();
}

// Return full territory data to requesting client
function handleTerritoryInfo(clientId, message, ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
        type: 'territory_info',
        territories: gameState.territories
    }));
}

// ==================== PHASE 2: TERRITORY OWNERSHIP CLAIM ====================
// A player who meets MIN_CLAIM_LEVEL, lives in the district, and whose district
// has no current owner can claim ownership. Costs money based on district index.
const CLAIM_COSTS = [10000, 20000, 50000, 40000, 25000, 30000, 80000, 35000];
const MIN_CLAIM_LVL = 10;

function handleTerritoryClaimOwnership(clientId, message) {
    const player = gameState.players.get(clientId);
    const ps = gameState.playerStates.get(clientId);
    if (!player || !ps) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws) ws.send(JSON.stringify({ type: 'territory_claim_ownership_result', success: false, error: err })); };

    const districtId = message.district;
    if (!districtId || !TERRITORY_IDS.includes(districtId)) return fail('Invalid district.');

    const terr = gameState.territories[districtId];
    if (!terr) return fail('Territory data missing.');
    if (terr.owner) return fail(`This district is already owned by ${terr.owner}. Challenge them for control.`);

    // Must live in the district
    if (player.currentTerritory !== districtId) return fail('You must live in this district to claim it.');

    // Level check
    if ((player.level || 1) < MIN_CLAIM_LVL) return fail(`You need to be at least level ${MIN_CLAIM_LVL} to claim a territory.`);

    // Cost check
    const idx = TERRITORY_IDS.indexOf(districtId);
    const cost = CLAIM_COSTS[idx] || 25000;
    if ((player.money || 0) < cost) return fail(`Not enough money. Claiming costs $${cost.toLocaleString()}.`);

    // ---- Claim the territory ----
    player.money -= cost;
    ps.money = player.money;
    terr.owner = player.name;

    console.log(`👑 ${player.name} claimed ownership of ${districtId} for $${cost.toLocaleString()}`);

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'territory_claim_ownership_result',
            success: true,
            district: districtId,
            cost: cost,
            money: player.money,
            territories: gameState.territories
        }));
    }

    broadcastToAll({
        type: 'territory_ownership_changed',
        territories: gameState.territories,
        attacker: player.name,
        defender: null,
        seized: [districtId],
        method: 'claim'
    });

    addGlobalChatMessage('System', `👑 ${player.name} claimed ownership of ${districtId.replace(/_/g, ' ')}!`, '#d4af37');
    broadcastPlayerStates();
    scheduleWorldSave();
}

// ==================== PHASE 2: TERRITORY WAR (GANG WAR CONQUEST) ====================
// A player attacks a district owned by another player. Server-authoritative power comparison.
// Requires: ≥5 gang members, 40 energy, and target district must have an owner.
const TERRITORY_WAR_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const territoryWarCooldowns = new Map();

function handleTerritoryWar(clientId, message) {
    const attacker = gameState.players.get(clientId);
    const attackerState = gameState.playerStates.get(clientId);
    if (!attacker || !attackerState) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws) ws.send(JSON.stringify({ type: 'territory_war_result', success: false, error: err })); };

    // Cooldown
    const lastWar = territoryWarCooldowns.get(clientId) || 0;
    const now = Date.now();
    if (now - lastWar < TERRITORY_WAR_COOLDOWN_MS) {
        const remaining = Math.ceil((TERRITORY_WAR_COOLDOWN_MS - (now - lastWar)) / 60000);
        return fail(`Your crew needs to regroup. Wait ${remaining} more minute(s).`);
    }

    const districtId = message.district;
    if (!districtId || !TERRITORY_IDS.includes(districtId)) return fail('Invalid district.');

    const terr = gameState.territories[districtId];
    if (!terr) return fail('Territory data missing.');
    if (!terr.owner) return fail('This district has no owner. Claim it instead.');
    if (terr.owner === attacker.name) return fail('You already own this district.');

    // Jail check
    if (attackerState.inJail) return fail('Can\'t wage war from behind bars.');

    // Energy cost: 40
    const energyCost = 40;
    if ((attackerState.energy || 0) < energyCost) return fail('Not enough energy (40 required).');

    // Validate client-reported resources (trust minimally, cap values)
    const gangMembers = Math.max(0, Math.min(message.gangMembers || 0, 100));
    const attackPower = Math.max(0, Math.min(message.power || 0, 5000));
    const gangLoyalty = Math.max(0, Math.min(message.gangLoyalty || 100, 200));

    if (gangMembers < 5) return fail('You need at least 5 gang members to wage a territory war.');

    // Deduct energy
    attackerState.energy = Math.max(0, (attackerState.energy || 100) - energyCost);

    // Set cooldown
    territoryWarCooldowns.set(clientId, now);

    // ── Calculate attacker power ──
    // Base: power stat + 10 per gang member + loyalty bonus
    let attackScore = attackPower + (gangMembers * 10) + Math.floor(gangLoyalty * 0.5);
    attackScore += Math.floor(Math.random() * 200); // Randomness (0-199)

    // ── Calculate defender power ──
    // Based on territory defenseRating + owner level/rep (if online)
    let defenseScore = terr.defenseRating || 100;
    // Find defender in online players
    let defenderPlayer = null;
    let defenderState = null;
    let defenderId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === terr.owner) {
            defenderPlayer = p;
            defenderState = gameState.playerStates.get(id);
            defenderId = id;
            break;
        }
    }
    if (defenderPlayer) {
        defenseScore += (defenderPlayer.level || 1) * 15;
        defenseScore += Math.floor((defenderPlayer.reputation || 0) * 0.5);
    } else {
        // Offline defender — moderate NPC resistance
        defenseScore += 150;
    }
    defenseScore += Math.floor(Math.random() * 200); // Randomness

    const victory = attackScore > defenseScore;

    // ── Gang member casualties (both sides take losses) ──
    let gangMembersLost = 0;
    const casualtyRate = victory ? 0.10 : 0.25;
    for (let i = 0; i < gangMembers; i++) {
        if (Math.random() < casualtyRate) gangMembersLost++;
    }

    // Health damage to attacker
    const healthDamage = victory
        ? 15 + Math.floor(Math.random() * 21) // 15-35 on win
        : 25 + Math.floor(Math.random() * 31); // 25-55 on loss
    attackerState.health = Math.max(1, (attackerState.health || 100) - healthDamage);

    // Wanted level increase
    attackerState.wantedLevel = Math.min(100, (attackerState.wantedLevel || 0) + (victory ? 20 : 12));

    if (victory) {
        // Transfer ownership
        const oldOwner = terr.owner;
        terr.owner = attacker.name;
        terr.defenseRating = Math.max(50, (terr.defenseRating || 100) - 20); // Weakened after battle

        // Attacker gains rep
        const repGain = 15 + Math.floor(Math.random() * 10);
        attacker.reputation = (attacker.reputation || 0) + repGain;
        attackerState.reputation = attacker.reputation;

        console.log(`⚔️ TERRITORY WAR: ${attacker.name} conquered ${districtId} from ${oldOwner} (ATK ${attackScore} > DEF ${defenseScore})`);

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'territory_war_result',
                success: true,
                victory: true,
                district: districtId,
                oldOwner: oldOwner,
                attackScore: attackScore,
                defenseScore: defenseScore,
                repGain: repGain,
                gangMembersLost: gangMembersLost,
                healthDamage: healthDamage,
                newHealth: attackerState.health,
                wantedLevel: attackerState.wantedLevel,
                energy: attackerState.energy,
                territories: gameState.territories
            }));
        }

        // Notify defender
        if (defenderId) {
            const defWs = clients.get(defenderId);
            if (defWs && defWs.readyState === WebSocket.OPEN) {
                defWs.send(JSON.stringify({
                    type: 'territory_war_defense_lost',
                    district: districtId,
                    attackerName: attacker.name,
                    territories: gameState.territories
                }));
            }
        }

        broadcastToAll({
            type: 'territory_ownership_changed',
            territories: gameState.territories,
            attacker: attacker.name,
            defender: oldOwner,
            seized: [districtId],
            method: 'war'
        });

        addGlobalChatMessage('System', `⚔️ ${attacker.name} conquered ${districtId.replace(/_/g, ' ')} from ${oldOwner} in a gang war!`, '#8b0000');
    } else {
        // Defense holds — territory gets stronger
        terr.defenseRating = Math.min(300, (terr.defenseRating || 100) + 10);

        // Attacker loses rep
        const repLoss = 5 + Math.floor(Math.random() * 5);
        attacker.reputation = Math.max(0, (attacker.reputation || 0) - repLoss);
        attackerState.reputation = attacker.reputation;

        // 30% arrest chance on failure
        let jailed = false;
        let jailTime = 0;
        if (Math.random() < 0.30) {
            jailTime = 15 + Math.floor(Math.random() * 20);
            attackerState.inJail = true;
            attackerState.jailTime = jailTime;
            jailed = true;
        }

        console.log(`⚔️ TERRITORY WAR FAILED: ${attacker.name} failed to take ${districtId} (ATK ${attackScore} ≤ DEF ${defenseScore})${jailed ? ' — ARRESTED' : ''}`);

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'territory_war_result',
                success: true,
                victory: false,
                district: districtId,
                owner: terr.owner,
                attackScore: attackScore,
                defenseScore: defenseScore,
                repLoss: repLoss,
                gangMembersLost: gangMembersLost,
                healthDamage: healthDamage,
                newHealth: attackerState.health,
                wantedLevel: attackerState.wantedLevel,
                energy: attackerState.energy,
                jailed: jailed,
                jailTime: jailTime,
                error: jailed
                    ? `War for ${districtId.replace(/_/g, ' ')} failed! You were arrested.`
                    : `War for ${districtId.replace(/_/g, ' ')} failed! ${terr.owner}'s forces held the line.`
            }));
        }

        // Notify defender (positive)
        if (defenderId) {
            const defWs = clients.get(defenderId);
            if (defWs && defWs.readyState === WebSocket.OPEN) {
                defWs.send(JSON.stringify({
                    type: 'territory_war_defense_held',
                    district: districtId,
                    attackerName: attacker.name
                }));
            }
        }

        if (jailed) {
            addGlobalChatMessage('System', `⚔️ ${attacker.name} attacked ${districtId.replace(/_/g, ' ')} and was repelled — then arrested!`, '#e74c3c');
        }
    }

    broadcastPlayerStates();
    scheduleWorldSave();
}

// Heist creation handler
function handleHeistCreate(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    // Check if player already has an active heist
    const existingHeist = gameState.activeHeists.find(h => h.organizerId === clientId);
    if (existingHeist) return;

    const heist = {
        id: `heist_${Date.now()}_${clientId}`,
        target: message.target,
        targetId: message.targetId || null,
        organizer: player.name,
        organizerId: clientId,
        participants: [clientId],
        maxParticipants: message.maxParticipants || 4,
        minCrew: message.minCrew || 1,
        difficulty: message.difficulty || 'Medium',
        reward: message.reward || 100000,
        successBase: message.successBase || 60,
        district: message.district,
        createdAt: Date.now()
    };
    
    gameState.activeHeists.push(heist);
    
    console.log(`💰 ${player.name} created heist: ${heist.target}`);
    
    // Broadcast heist creation
    broadcastToAll({
        type: 'heist_broadcast',
        heist: heist,
        playerName: player.name,
        playerId: clientId
    });
    
    // Add to global chat
    addGlobalChatMessage('System', `💰 ${player.name} is organizing a heist: ${heist.target}!`, '#8e44ad');
}

// Heist join handler
function handleHeistJoin(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    if (heist.participants.length < heist.maxParticipants && !heist.participants.includes(clientId)) {
        heist.participants.push(clientId);
        
        console.log(`🚀 ${player.name} joined heist: ${heist.target}`);
        
        // Broadcast heist update
        broadcastToAll({
            type: 'heist_update',
            heist: heist,
            action: 'player_joined',
            playerName: player.name
        });
        
        // Check if heist is full and auto-start
        if (heist.participants.length === heist.maxParticipants) {
            executeHeist(heist);
        }
    }
}

// Player challenge handler
function handlePlayerChallenge(clientId, message) {
    const challenger = gameState.players.get(clientId);
    const targetPlayer = Array.from(gameState.players.values()).find(p => p.name === message.targetPlayer);
    
    if (!challenger || !targetPlayer) return;
    
    // Simulate combat
    const challengerPower = challenger.level + (challenger.reputation / 10);
    const targetPower = targetPlayer.level + (targetPlayer.reputation / 10);
    
    const victory = (challengerPower + Math.random() * 20) > (targetPower + Math.random() * 20);
    
    if (victory) {
        const repGain = 5 + Math.floor(Math.random() * 10);
        challenger.reputation += repGain;
        targetPlayer.reputation = Math.max(0, targetPlayer.reputation - 3);
        
        console.log(`⚔️ ${challenger.name} defeated ${targetPlayer.name}`);
        
        broadcastToAll({
            type: 'combat_result',
            winner: challenger.name,
            loser: targetPlayer.name,
            repChange: repGain
        });
        
        addGlobalChatMessage('System', `⚔️ ${challenger.name} defeated ${targetPlayer.name} in combat!`, '#e74c3c');
        // Persist leaderboard changes
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    } else {
        const repLoss = 2 + Math.floor(Math.random() * 5);
        challenger.reputation = Math.max(0, challenger.reputation - repLoss);
        targetPlayer.reputation += 3;
        
        console.log(`⚔️ ${targetPlayer.name} defeated ${challenger.name}`);
        
        broadcastToAll({
            type: 'combat_result',
            winner: targetPlayer.name,
            loser: challenger.name,
            repChange: 3
        });
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    }
}

// Heist start handler (organizer manually starts)
function handleHeistStart(clientId, message) {
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    // Only organizer can start
    if (heist.organizerId !== clientId) return;
    
    // Must have minimum crew
    if (heist.participants.length < (heist.minCrew || 1)) return;
    
    console.log(`🚀 ${heist.organizer} launched heist: ${heist.target} with ${heist.participants.length} crew`);
    executeHeist(heist);
}

// Heist leave handler
function handleHeistLeave(clientId, message) {
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    // Organizer can't leave, they must cancel
    if (heist.organizerId === clientId) return;
    
    heist.participants = heist.participants.filter(pid => pid !== clientId);
    
    const player = gameState.players.get(clientId);
    console.log(`🚪 ${player ? player.name : clientId} left heist: ${heist.target}`);
    
    broadcastToAll({
        type: 'heist_update',
        heist: heist,
        action: 'player_left',
        playerName: player ? player.name : 'Unknown'
    });
}

// Heist cancel handler (organizer only)
function handleHeistCancel(clientId, message) {
    const heistIdx = gameState.activeHeists.findIndex(h => h.id === message.heistId);
    if (heistIdx < 0) return;
    
    const heist = gameState.activeHeists[heistIdx];
    
    // Only organizer can cancel
    if (heist.organizerId !== clientId) return;
    
    gameState.activeHeists.splice(heistIdx, 1);
    
    console.log(`❌ ${heist.organizer} cancelled heist: ${heist.target}`);
    
    broadcastToAll({
        type: 'heist_cancelled',
        heistId: heist.id,
        message: `❌ ${heist.organizer} cancelled the heist on ${heist.target}.`
    });
    
    addGlobalChatMessage('System', `❌ ${heist.organizer} cancelled their heist on ${heist.target}.`, '#e67e22');
}

// Heist invite handler
function handleHeistInvite(clientId, message) {
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    // Only organizer can invite
    if (heist.organizerId !== clientId) return;
    
    // Find target player by name
    const targetEntry = Array.from(gameState.players.entries()).find(([_, p]) => p.name === message.targetPlayer);
    if (!targetEntry) return;
    
    const [targetClientId, targetPlayer] = targetEntry;
    
    // Don't invite if already in the heist
    if (heist.participants.includes(targetClientId)) return;
    
    // Don't invite if heist is full
    if (heist.participants.length >= heist.maxParticipants) return;
    
    const organizer = gameState.players.get(clientId);
    
    // Send invite to the specific player
    const targetWs = clients.get(targetClientId);
    if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
            type: 'heist_invite',
            heistId: heist.id,
            inviterName: organizer ? organizer.name : 'Unknown',
            target: heist.target,
            reward: heist.reward,
            difficulty: heist.difficulty
        }));
    }
}

// Player update handler
function handlePlayerUpdate(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    // Update basic player info
    if (message.money !== undefined) player.money = message.money;
    if (message.reputation !== undefined) player.reputation = message.reputation;
    if (message.level !== undefined) player.level = message.level;
    if (message.territory !== undefined) player.territory = message.territory;
    
    player.lastActive = Date.now();
    
    // Update detailed player state
    let playerState = gameState.playerStates.get(clientId);
    if (!playerState) {
        playerState = {
            playerId: clientId,
            name: player.name,
            lastUpdate: Date.now()
        };
        gameState.playerStates.set(clientId, playerState);
    }
    
    // Update allowed state fields from message (whitelist approach)
    if (message.playerState) {
        const allowed = ['inJail', 'jailTime', 'health', 'energy', 'wantedLevel'];
        for (const key of allowed) {
            if (message.playerState[key] !== undefined) {
                playerState[key] = message.playerState[key];
            }
        }
        // Enforce server-side identity
        playerState.playerId = clientId;
        playerState.name = player.name;
        playerState.lastUpdate = Date.now();
    }
    
    console.log(`🔄 Updated player state: ${player.name} ${playerState.inJail ? '[IN JAIL]' : ''}`);
    
    // If jail status changed, broadcast it
    const wasInJail = playerState.previousInJail || false;
    if (playerState.inJail !== wasInJail) {
        if (playerState.inJail) {
            // Player was arrested
            broadcastToAll({
                type: 'player_arrested',
                playerId: clientId,
                playerName: player.name,
                jailTime: playerState.jailTime
            });
            
            addGlobalChatMessage('System', `🚔 ${player.name} was arrested and sent to jail!`, '#e74c3c');
        } else {
            // Player was released or escaped
            broadcastToAll({
                type: 'player_released',
                playerId: clientId,
                playerName: player.name
            });
            
            addGlobalChatMessage('System', `🔓 ${player.name} was released from jail!`, '#2ecc71');
        }
        
        playerState.previousInJail = playerState.inJail;
        
        // Jail population changed — update bot limits and broadcast roster
        updateJailBots();
        broadcastJailRoster();
    }
    
    // Broadcast updated player states to all clients
    broadcastPlayerStates();
    
    // Send updated leaderboard if reputation changed
    if (message.reputation !== undefined) {
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({
            type: 'player_ranked',
            leaderboard: persistedLeaderboard
        });
        scheduleWorldSave();
    }
}

// Handle jailbreak attempts
function handleJailbreakAttempt(clientId, message) {
    const helper = gameState.players.get(clientId);
    const helperState = gameState.playerStates.get(clientId);
    const targetState = gameState.playerStates.get(message.targetPlayerId);
    
    if (!helper || !helperState || !targetState) {
        console.log('❌ Invalid jailbreak attempt - missing player data');
        return;
    }
    
    if (helperState.inJail) {
        console.log(`❌ ${helper.name} tried to help jailbreak while in jail themselves`);
        return;
    }
    
    const targetName = targetState.name || (gameState.players.get(message.targetPlayerId)?.name) || 'Unknown';
    if (!targetState.inJail) {
        console.log(`❌ ${helper.name} tried to break out ${targetName} who isn't in jail`);
        return;
    }
    
    gameState.serverStats.jailbreakAttempts++;
    
    console.log(`🔓 ${helper.name} attempting to break out ${targetName}`);
    
    // Calculate success chance (server authoritative)
    const baseSuccessChance = 25;
    const stealthBonus = (helperState.skills?.stealth || 0) * 3;
    const totalSuccessChance = Math.min(75, baseSuccessChance + stealthBonus); // Cap at 75%
    
    const success = Math.random() * 100 < totalSuccessChance;
    
    if (success) {
        // Successful jailbreak
        targetState.inJail = false;
        targetState.jailTime = 0;
        helperState.reputation = (helperState.reputation || 0) + 5;
        
        gameState.serverStats.successfulJailbreaks++;
        
        console.log(`✅ Jailbreak successful! ${helper.name} freed ${targetName}`);
        
        // Notify target player if they're online
        const targetClient = clients.get(message.targetPlayerId);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            targetClient.send(JSON.stringify({
                type: 'jailbreak_success',
                helperName: helper.name,
                helperId: clientId,
                message: `${helper.name} successfully broke you out of jail!`
            }));
        }
        
        // Broadcast successful jailbreak
        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerId: message.targetPlayerId,
            targetPlayerName: targetName,
            success: true
        });
        
        addGlobalChatMessage('System', `🎉 ${helper.name} successfully broke ${targetName} out of jail!`, '#2ecc71');
    } else {
        // Failed jailbreak
        const arrestChance = 30; // 30% chance helper gets arrested
        if (Math.random() * 100 < arrestChance) {
            // Helper gets arrested
            helperState.inJail = true;
            helperState.jailTime = 15 + Math.floor(Math.random() * 10); // 15-24 seconds
            helperState.wantedLevel = (helperState.wantedLevel || 0) + 2;
            
            console.log(`💀 Jailbreak failed! ${helper.name} was arrested`);
            
            // Notify helper
            const helperClient = clients.get(clientId);
            if (helperClient && helperClient.readyState === WebSocket.OPEN) {
                helperClient.send(JSON.stringify({
                    type: 'jailbreak_failed_arrested',
                    jailTime: helperState.jailTime,
                    message: 'Jailbreak failed and you were caught! You\'ve been arrested.'
                }));
            }
            
            addGlobalChatMessage('System', `💀 ${helper.name} failed to break out ${targetName} and was arrested!`, '#e74c3c');
        } else {
            console.log(`💀 Jailbreak failed but ${helper.name} escaped`);
            
            addGlobalChatMessage('System', `💀 ${helper.name} failed to break out ${targetName} but escaped undetected.`, '#f39c12');
        }
        
        // Broadcast failed jailbreak
        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerId: message.targetPlayerId,
            targetPlayerName: targetName,
            success: false,
            helperArrested: helperState.inJail
        });
    }
    
    // Broadcast updated player states
    broadcastPlayerStates();
    broadcastJailRoster();
}

// ==================== JAIL BOT MANAGEMENT ====================

// Count how many real (non-bot) players are currently in jail
function countRealPlayersInJail() {
    let count = 0;
    gameState.playerStates.forEach(state => {
        if (state.inJail) count++;
    });
    return count;
}

// Ensure jail bots are within limits: max 3 total, 0 if 3+ real players in jail
function updateJailBots() {
    const realInJail = countRealPlayersInJail();

    if (realInJail >= 3) {
        // Remove all bots when enough real players occupy jail
        gameState.jailBots = [];
        return;
    }

    // Cap at 3 bots
    while (gameState.jailBots.length > 3) {
        gameState.jailBots.pop();
    }

    // Fill up to 3 bots
    const needed = 3 - gameState.jailBots.length;
    for (let i = 0; i < needed; i++) {
        const name = JAIL_BOT_NAMES[Math.floor(Math.random() * JAIL_BOT_NAMES.length)];
        const difficulty = Math.floor(Math.random() * 3) + 1; // 1-3
        const securityLevel = ['Minimum', 'Medium', 'Maximum'][difficulty - 1];
        gameState.jailBots.push({
            botId: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            difficulty,
            securityLevel,
            sentence: Math.floor(Math.random() * 50) + 15,
            breakoutSuccess: Math.max(20, 55 - (difficulty * 10)), // 45%, 35%, 25%
            isBot: true
        });
    }
}

// Build the jail roster payload (real players + bots)
function buildJailRoster() {
    const realPlayers = [];
    gameState.playerStates.forEach((state, id) => {
        if (state.inJail) {
            realPlayers.push({
                playerId: id,
                name: state.name,
                jailTime: state.jailTime,
                level: state.level || 1,
                isBot: false
            });
        }
    });
    return {
        type: 'jail_roster',
        realPlayers,
        bots: gameState.jailBots,
        totalOnlineInJail: realPlayers.length
    };
}

// Send jail roster to a specific client
function sendJailRoster(clientId, ws) {
    updateJailBots();
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(buildJailRoster()));
    }
}

// Broadcast jail roster to all connected clients
function broadcastJailRoster() {
    updateJailBots();
    broadcastToAll(buildJailRoster());
}

// Handle attempt to break out a jail bot
function handleJailbreakBot(clientId, message) {
    const helper = gameState.players.get(clientId);
    const helperState = gameState.playerStates.get(clientId);

    if (!helper || !helperState) return;

    if (helperState.inJail) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'jailbreak_bot_result',
                success: false,
                message: "You can't help others while you're locked up!"
            }));
        }
        return;
    }

    const botIndex = gameState.jailBots.findIndex(b => b.botId === message.botId);
    if (botIndex === -1) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'jailbreak_bot_result',
                success: false,
                message: 'That inmate is no longer in jail.'
            }));
        }
        return;
    }

    const bot = gameState.jailBots[botIndex];
    const baseSuccess = bot.breakoutSuccess;
    const stealthBonus = (helperState.skills?.stealth || 0) * 3;
    const totalSuccess = Math.min(80, baseSuccess + stealthBonus);
    const success = Math.random() * 100 < totalSuccess;
    const ws = clients.get(clientId);

    gameState.serverStats.jailbreakAttempts++;

    if (success) {
        // Remove bot from jail
        gameState.jailBots.splice(botIndex, 1);
        gameState.serverStats.successfulJailbreaks++;

        const expReward = bot.difficulty * 15 + 10;
        const cashReward = bot.difficulty * 75 + 50;
        helperState.reputation = (helperState.reputation || 0) + Math.floor(bot.difficulty * 1.5);

        console.log(`✅ Bot jailbreak: ${helper.name} freed ${bot.name}`);

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'jailbreak_bot_result',
                success: true,
                botName: bot.name,
                expReward,
                cashReward,
                message: `You freed ${bot.name}! +${expReward} XP, +$${cashReward}`
            }));
        }

        addGlobalChatMessage('System', `🎉 ${helper.name} busted ${bot.name} out of jail!`, '#2ecc71');

        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerName: bot.name,
            success: true
        });

        // Replenish bots after a delay
        setTimeout(() => {
            updateJailBots();
            broadcastJailRoster();
        }, 15000);
    } else {
        const arrestChance = 25;
        if (Math.random() * 100 < arrestChance) {
            helperState.inJail = true;
            helperState.jailTime = 15 + Math.floor(Math.random() * 10);
            helperState.wantedLevel = (helperState.wantedLevel || 0) + 1;

            console.log(`💀 Bot jailbreak failed: ${helper.name} was arrested`);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'jailbreak_bot_result',
                    success: false,
                    arrested: true,
                    jailTime: helperState.jailTime,
                    message: `Failed to break out ${bot.name} — you got caught!`
                }));
            }

            addGlobalChatMessage('System', `💀 ${helper.name} was caught trying to break out ${bot.name}!`, '#e74c3c');
            updateJailBots(); // Recheck — new real player in jail
        } else {
            console.log(`💀 Bot jailbreak failed: ${helper.name} escaped`);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'jailbreak_bot_result',
                    success: false,
                    arrested: false,
                    message: `Failed to break out ${bot.name}, but you slipped away undetected.`
                }));
            }

            addGlobalChatMessage('System', `💀 ${helper.name} failed to break out ${bot.name} but escaped.`, '#f39c12');
        }

        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerName: bot.name,
            success: false,
            helperArrested: helperState.inJail
        });
    }

    broadcastPlayerStates();
    broadcastJailRoster();
}

// ==================== SEND WORLD STATE ====================
function sendWorldState(clientId, ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const playerStatesObj = {};
    gameState.playerStates.forEach((state, id) => {
        playerStatesObj[id] = state;
    });
    ws.send(JSON.stringify({
        type: 'world_update',
        playerCount: gameState.players.size,
        playerStates: playerStatesObj,
        cityDistricts: gameState.cityDistricts,
        cityEvents: gameState.cityEvents,
        activeHeists: gameState.activeHeists,
        territories: gameState.territories
    }));
}

// ==================== GIFT / MONEY TRANSFER ====================
function handleSendGift(senderId, message) {
    const sender = gameState.players.get(senderId);
    const senderState = gameState.playerStates.get(senderId);
    if (!sender || !senderState) return;

    const amount = parseInt(message.amount);
    if (!amount || amount <= 0 || amount > 10000) return; // Cap gift at $10,000

    const targetId = message.targetPlayerId;
    const targetClient = clients.get(targetId);
    const targetPlayer = gameState.players.get(targetId);
    if (!targetClient || !targetPlayer) return;

    // Validate sender has enough money server-side
    if (sender.money < amount) return;
    sender.money -= amount;
    targetPlayer.money = (targetPlayer.money || 0) + amount;
    if (senderState) { senderState.money = sender.money; senderState.lastUpdate = Date.now(); }
    const targetState = gameState.playerStates.get(targetId);
    if (targetState) { targetState.money = targetPlayer.money; targetState.lastUpdate = Date.now(); }

    if (targetClient.readyState === WebSocket.OPEN) {
        targetClient.send(JSON.stringify({
            type: 'gift_received',
            senderName: sender.name,
            amount: amount,
            message: `${sender.name} sent you $${amount.toLocaleString()} as a thank-you gift!`
        }));
    }

    addGlobalChatMessage('System', `💰 ${sender.name} sent a $${amount.toLocaleString()} gift to ${targetPlayer.name}!`, '#c0a062');
    console.log(`💰 Gift: ${sender.name} -> ${targetPlayer.name}: $${amount}`);
}

// ==================== JOB INTENT HANDLER (SERVER AUTHORITATIVE) ====================
// Minimal first-pass job definitions. In future, load from shared balance config.
const JOB_DEFS = {
    pickpocket: { base: 200, risk: 'low', wanted: 1, jailChance: 2, energyCost: 5 },
    carTheft: { base: 1200, risk: 'medium', wanted: 3, jailChance: 5, energyCost: 15 },
    bankRobbery: { base: 25000, risk: 'high', wanted: 8, jailChance: 15, energyCost: 35 }
};

function handleJobIntent(clientId, message) {
    const player = gameState.players.get(clientId);
    const ps = gameState.playerStates.get(clientId);
    if (!player || !ps) return;

    const jobId = message.jobId;
    const jobDef = JOB_DEFS[jobId];
    if (!jobDef) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'job_result', jobId, success: false, error: 'Unknown job' }));
        }
        return;
    }

    // Validation: jail & energy
    if (ps.inJail) {
        const ws = clients.get(clientId);
        if (ws) ws.send(JSON.stringify({ type: 'job_result', jobId, success: false, error: 'Player in jail' }));
        return;
    }
    if ((ps.energy || 0) < jobDef.energyCost) {
        const ws = clients.get(clientId);
        if (ws) ws.send(JSON.stringify({ type: 'job_result', jobId, success: false, error: 'Not enough energy' }));
        return;
    }

    // Deduct energy
    ps.energy = Math.max(0, (ps.energy || 0) - jobDef.energyCost);

    // Compute reward authoritatively
    const variance = 0.5 + Math.random(); // 0.5x - 1.5x
    const grossEarnings = Math.floor(jobDef.base * variance);

    // ── Phase 2: Territory Tax ──────────────────────────────────
    let taxAmount = 0;
    let taxOwnerName = null;
    const playerTerritory = player.currentTerritory;
    if (playerTerritory && gameState.territories[playerTerritory]) {
        const terr = gameState.territories[playerTerritory];
        if (terr.owner && terr.owner !== player.name) {
            taxAmount = Math.floor(grossEarnings * TAX_RATE);
            taxOwnerName = terr.owner;
            terr.taxCollected = (terr.taxCollected || 0) + taxAmount;

            // Credit tax to the territory owner
            for (const [ownerId, ownerPlayer] of gameState.players.entries()) {
                if (ownerPlayer.name === terr.owner) {
                    ownerPlayer.money = (ownerPlayer.money || 0) + taxAmount;
                    const ownerPs = gameState.playerStates.get(ownerId);
                    if (ownerPs) { ownerPs.money = ownerPlayer.money; ownerPs.lastUpdate = Date.now(); }
                    // Notify territory owner of tax income
                    const ownerWs = clients.get(ownerId);
                    if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
                        ownerWs.send(JSON.stringify({
                            type: 'territory_tax_income',
                            from: player.name,
                            district: playerTerritory,
                            amount: taxAmount,
                            newMoney: ownerPlayer.money,
                            totalCollected: terr.taxCollected
                        }));
                    }
                    break;
                }
            }
        }
    }
    const earnings = grossEarnings - taxAmount;
    player.money += earnings;
    ps.money = player.money;

    // Reputation gain scaled by risk
    let repGain = jobDef.risk === 'low' ? 1 : jobDef.risk === 'medium' ? 3 : 6;
    player.reputation += repGain;
    ps.reputation = player.reputation;

    // Wanted level increase
    ps.wantedLevel = (ps.wantedLevel || 0) + jobDef.wanted;

    // Jail chance
    let jailed = false;
    if (Math.random() * 100 < jobDef.jailChance) {
        ps.inJail = true;
        ps.jailTime = 15 + Math.floor(Math.random() * 20); // 15-34 seconds
        jailed = true;
    }

    ps.lastUpdate = Date.now();

    // Send authoritative result to requesting client only
    const ws = clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'job_result',
            jobId,
            success: true,
            earnings,
            grossEarnings,
            taxAmount,
            taxOwnerName,
            repGain,
            wantedAdded: jobDef.wanted,
            jailed,
            jailTime: ps.jailTime || 0,
            money: ps.money,
            reputation: ps.reputation,
            wantedLevel: ps.wantedLevel,
            energy: ps.energy
        }));
    }

    // If jailed, broadcast arrest to others
    if (jailed) {
        broadcastToAll({
            type: 'player_arrested',
            playerId: clientId,
            playerName: player.name,
            jailTime: ps.jailTime
        }, clientId);
        addGlobalChatMessage('System', `🚔 ${player.name} was arrested after a ${jobId} job!`, '#e74c3c');
    }

    broadcastPlayerStates();
    persistedLeaderboard = generateLeaderboard();
    broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
    scheduleWorldSave();
}

// Broadcast player states to all clients
function broadcastPlayerStates() {
    broadcastToAll({
        type: 'world_update',
        playerCount: clients.size,
        playerStates: Object.fromEntries(gameState.playerStates),
        timestamp: Date.now()
    });
}

// Execute heist — uses difficulty-based success rate
function executeHeist(heist) {
    console.log(`🎯 Executing heist: ${heist.target} (${heist.participants.length} crew)`);
    
    // Use difficulty-based success rate from heist data, fallback to 60%
    const baseSuccess = (heist.successBase || 60) / 100;
    // Crew size bonus: +5% per extra member beyond 1
    const crewBonus = (heist.participants.length - 1) * 0.05;
    const successChance = Math.min(baseSuccess + crewBonus, 0.95);
    const success = Math.random() < successChance;
    
    // Get participant names for the world message
    const participantNames = heist.participants.map(pid => {
        const p = gameState.players.get(pid);
        return p ? p.name : 'Unknown';
    }).join(', ');
    
    if (success) {
        const rewardPerPlayer = Math.floor(heist.reward / heist.participants.length);
        const repGain = Math.floor(10 + (heist.reward / 100000) * 5);
        
        heist.participants.forEach(participantId => {
            const participant = gameState.players.get(participantId);
            if (participant) {
                participant.money += rewardPerPlayer;
                participant.reputation += repGain;
            }
            
            // Send personalized result to each participant
            const ws = clients.get(participantId);
            if (ws && ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: 'heist_completed',
                    heistId: heist.id,
                    success: true,
                    involved: true,
                    reward: rewardPerPlayer,
                    repGain: repGain,
                    target: heist.target,
                    crewSize: heist.participants.length,
                    worldMessage: `💰 Heist on ${heist.target} was successful! Crew: ${participantNames}`
                }));
            }
        });
        
        // Broadcast to non-participants
        broadcastToAll({
            type: 'heist_completed',
            heistId: heist.id,
            success: true,
            involved: false,
            worldMessage: `💰 Heist on ${heist.target} was successful! Crew: ${participantNames}`
        });
        
        addGlobalChatMessage('System', `🎉 Heist successful! ${heist.target} netted $${heist.reward.toLocaleString()}!`, '#2ecc71');
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    } else {
        // Failed heist — reputation loss and possible heat
        const repLoss = Math.floor(5 + (heist.reward / 200000) * 3);
        
        heist.participants.forEach(participantId => {
            const participant = gameState.players.get(participantId);
            if (participant) {
                participant.reputation = Math.max(0, participant.reputation - repLoss);
            }
            
            // Send personalized result to each participant
            const ws = clients.get(participantId);
            if (ws && ws.readyState === 1) {
                ws.send(JSON.stringify({
                    type: 'heist_completed',
                    heistId: heist.id,
                    success: false,
                    involved: true,
                    repLoss: repLoss,
                    target: heist.target,
                    crewSize: heist.participants.length,
                    worldMessage: `🚔 Heist on ${heist.target} failed! The crew barely escaped.`
                }));
            }
        });
        
        // Broadcast to non-participants
        broadcastToAll({
            type: 'heist_completed',
            heistId: heist.id,
            success: false,
            involved: false,
            worldMessage: `🚔 Heist on ${heist.target} failed! The crew barely escaped.`
        });
        
        addGlobalChatMessage('System', `💀 Heist failed! ${heist.target} was too well defended.`, '#e74c3c');
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    }
    
    // Remove from active heists
    gameState.activeHeists = gameState.activeHeists.filter(h => h.id !== heist.id);
}

// Helper to broadcast to all connected clients
function broadcastToAll(message, excludeClientId = null) {
    const data = JSON.stringify(message);
    clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN && clientId !== excludeClientId) {
            client.send(data);
        }
    });
}

// Helper to add global chat message
function addGlobalChatMessage(sender, message, color = '#ffffff') {
    const chatMessage = {
        playerId: 'system',
        playerName: sender,
        message: message,
        timestamp: Date.now(),
        color: color
    };
    
    gameState.globalChat.push(chatMessage);
    if (gameState.globalChat.length > 50) gameState.globalChat.shift();
    
    broadcastToAll({
        type: 'global_chat',
        ...chatMessage
    });
}

// Helper to generate leaderboard
// ==================== ASSASSINATION SYSTEM ====================
// Track assassination cooldowns per player (clientId -> timestamp)
const assassinationCooldowns = new Map();
const ASSASSINATION_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

function handleAssassinationAttempt(clientId, message) {
    const attacker = gameState.players.get(clientId);
    const attackerState = gameState.playerStates.get(clientId);
    if (!attacker || !attackerState) return;

    // 10-minute cooldown check
    const lastAttempt = assassinationCooldowns.get(clientId) || 0;
    const now = Date.now();
    if (now - lastAttempt < ASSASSINATION_COOLDOWN_MS) {
        const remaining = Math.ceil((ASSASSINATION_COOLDOWN_MS - (now - lastAttempt)) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: `You must wait ${mins}m ${secs}s before ordering another hit.`, cooldownRemaining: remaining }));
        }
        return;
    }

    const targetName = message.targetPlayer;
    if (!targetName || typeof targetName !== 'string') return;

    // Find target by name
    let targetId = null;
    let target = null;
    let targetState = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === targetName && id !== clientId) {
            targetId = id;
            target = p;
            targetState = gameState.playerStates.get(id);
            break;
        }
    }
    if (!target || !targetState) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'Target not found or offline.' }));
        }
        return;
    }

    // Can't assassinate someone in jail
    if (targetState.inJail) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'Target is in jail — protected by the feds.' }));
        }
        return;
    }

    // Attacker can't be in jail
    if (attackerState.inJail) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'You can\'t plan a hit from behind bars.' }));
        }
        return;
    }

    // Energy check (costs 30 energy)
    const energyCost = 30;
    if ((attackerState.energy || 0) < energyCost) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'Not enough energy. You need 30 energy to plan a hit.' }));
        }
        return;
    }

    // Validate client-reported resources (trust minimally, cap bonuses)
    const bulletsSent = Math.max(0, Math.min(message.bullets || 0, 999));
    const gunCount = Math.max(0, Math.min(message.gunCount || 0, 50));
    const bestGunPower = Math.max(0, Math.min(message.bestGunPower || 0, 300));
    const vehicleCount = Math.max(0, Math.min(message.vehicleCount || 0, 20));
    const gangMembers = Math.max(0, Math.min(message.gangMembers || 0, 100));
    const attackerLevel = attacker.level || 1;
    const attackPower = Math.max(0, Math.min(message.power || 0, 5000));

    // Must have at least 1 gun, 3 bullets, and 1 vehicle
    if (gunCount < 1) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'You need at least one gun to attempt a hit.' }));
        }
        return;
    }
    if (bulletsSent < 3) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'You need at least 3 bullets to attempt a hit.' }));
        }
        return;
    }
    if (vehicleCount < 1) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'assassination_result', success: false, error: 'You need a getaway vehicle to attempt a hit.' }));
        }
        return;
    }

    // ---- Calculate success chance ----
    // Base: 8% — this is HARD to pull off
    let chance = 8;

    // Bullets: +0.5% per bullet, max +15% (30 bullets)
    chance += Math.min(bulletsSent * 0.5, 15);

    // Best gun power: +0.05% per power point, max +6% (120 power sniper)
    chance += Math.min(bestGunPower * 0.05, 6);

    // Extra guns: +1% per extra gun after the first, max +5%
    chance += Math.min((gunCount - 1) * 1, 5);

    // Vehicles: +2% per vehicle, max +6% (3 vehicles)
    chance += Math.min(vehicleCount * 2, 6);

    // Gang members: +0.5% per member, max +10% (20 members)
    chance += Math.min(gangMembers * 0.5, 10);

    // Level advantage: +0.5% per level above target, max +5%
    const levelDiff = attackerLevel - (target.level || 1);
    if (levelDiff > 0) chance += Math.min(levelDiff * 0.5, 5);

    // Total power bonus: +0.002% per power, max +5%
    chance += Math.min(attackPower * 0.002, 5);

    // Target defense: higher level targets are harder
    const targetLevel = target.level || 1;
    chance -= Math.min(targetLevel * 0.3, 10);

    // Clamp to 5%-20% — always risky, never guaranteed
    chance = Math.max(5, Math.min(chance, 20));

    // Deduct energy
    attackerState.energy = Math.max(0, (attackerState.energy || 100) - energyCost);

    // Consume 3-5 bullets regardless (shots fired)
    const bulletsUsed = Math.min(bulletsSent, 5);

    // Set cooldown BEFORE rolling (attempt counts even if it fails)
    assassinationCooldowns.set(clientId, Date.now());

    // Roll the dice
    const roll = Math.random() * 100;
    const success = roll < chance;

    // ---- Health damage to attacker (always takes damage) ----
    // Firefight is brutal regardless of outcome
    let healthDamage;
    if (success) {
        healthDamage = 30 + Math.floor(Math.random() * 31); // 30-60 on success
    } else {
        healthDamage = 20 + Math.floor(Math.random() * 31); // 20-50 on failure
    }
    attackerState.health = Math.max(1, (attackerState.health || 100) - healthDamage);

    // ---- Gang member casualties ----
    // Each gang member sent has a 20% chance of being killed in the firefight
    let gangMembersLost = 0;
    for (let i = 0; i < gangMembers; i++) {
        if (Math.random() < 0.20) gangMembersLost++;
    }

    if (success) {
        // Steal 8-20% of target's money
        const stealPercent = 8 + Math.floor(Math.random() * 13); // 8-20
        const stolenAmount = Math.floor((target.money || 0) * (stealPercent / 100));

        target.money = Math.max(0, (target.money || 0) - stolenAmount);
        targetState.money = target.money;
        attacker.money = (attacker.money || 0) + stolenAmount;
        attackerState.money = attacker.money;

        // Attacker gains reputation
        const repGain = 10 + Math.floor(Math.random() * 15);
        attacker.reputation = (attacker.reputation || 0) + repGain;
        attackerState.reputation = attacker.reputation;

        // Target loses some reputation
        target.reputation = Math.max(0, (target.reputation || 0) - 5);
        targetState.reputation = target.reputation;

        // Attacker gets high wanted level
        attackerState.wantedLevel = Math.min(100, (attackerState.wantedLevel || 0) + 25);

        // ── Phase 2: Territory conquest via assassination ──────────────
        // If the target owns any territories, the attacker seizes them
        let territoriesSeized = [];
        for (const [tId, tData] of Object.entries(gameState.territories)) {
            if (tData.owner === target.name) {
                tData.owner = attacker.name;
                territoriesSeized.push(tId);
                console.log(`👑 TERRITORY SEIZED: ${attacker.name} took ${tId} from ${target.name} via assassination`);
            }
        }
        if (territoriesSeized.length > 0) {
            addGlobalChatMessage('System', `👑 ${attacker.name} seized ${territoriesSeized.length} territory(s) from ${target.name}!`, '#d4af37');
            broadcastToAll({
                type: 'territory_ownership_changed',
                territories: gameState.territories,
                attacker: attacker.name,
                defender: target.name,
                seized: territoriesSeized,
                method: 'assassination'
            });
            scheduleWorldSave();
        }

        console.log(`🎯 ASSASSINATION: ${attacker.name} killed ${target.name} and stole $${stolenAmount.toLocaleString()} (${stealPercent}%) | HP -${healthDamage} | ${gangMembersLost} gang lost`);

        // Notify attacker
        const atkWs = clients.get(clientId);
        if (atkWs && atkWs.readyState === 1) {
            atkWs.send(JSON.stringify({
                type: 'assassination_result',
                success: true,
                targetName: target.name,
                stolenAmount: stolenAmount,
                stealPercent: stealPercent,
                repGain: repGain,
                bulletsUsed: bulletsUsed,
                chance: Math.round(chance),
                newMoney: attacker.money,
                newReputation: attacker.reputation,
                wantedLevel: attackerState.wantedLevel,
                healthDamage: healthDamage,
                newHealth: attackerState.health,
                gangMembersLost: gangMembersLost,
                cooldownSeconds: ASSASSINATION_COOLDOWN_MS / 1000,
                territoriesSeized: territoriesSeized
            }));
        }

        // Notify target
        const tgtWs = clients.get(targetId);
        if (tgtWs && tgtWs.readyState === 1) {
            tgtWs.send(JSON.stringify({
                type: 'assassination_victim',
                attackerName: attacker.name,
                stolenAmount: stolenAmount,
                stealPercent: stealPercent,
                newMoney: target.money
            }));
        }

        // Broadcast to everyone
        addGlobalChatMessage('System', `🎯 ${attacker.name} successfully assassinated ${target.name} and stole $${stolenAmount.toLocaleString()}!`, '#8b0000');

        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
    } else {
        // Failed — attacker might get arrested (40% chance)
        const arrested = Math.random() < 0.40;

        // Attacker loses some reputation
        const repLoss = 3 + Math.floor(Math.random() * 5);
        attacker.reputation = Math.max(0, (attacker.reputation || 0) - repLoss);
        attackerState.reputation = attacker.reputation;

        // Wanted level increases regardless
        attackerState.wantedLevel = Math.min(100, (attackerState.wantedLevel || 0) + 15);

        let jailTime = 0;
        if (arrested) {
            jailTime = 20 + Math.floor(Math.random() * 20); // 20-39 seconds
            attackerState.inJail = true;
            attackerState.jailTime = jailTime;
            updateJailBots();
        }

        console.log(`🎯 ASSASSINATION FAILED: ${attacker.name} failed to kill ${target.name}${arrested ? ' and was ARRESTED' : ''} | HP -${healthDamage} | ${gangMembersLost} gang lost`);

        // Notify attacker
        const atkWs = clients.get(clientId);
        if (atkWs && atkWs.readyState === 1) {
            atkWs.send(JSON.stringify({
                type: 'assassination_result',
                success: false,
                targetName: target.name,
                arrested: arrested,
                jailTime: jailTime,
                repLoss: repLoss,
                bulletsUsed: bulletsUsed,
                chance: Math.round(chance),
                wantedLevel: attackerState.wantedLevel,
                healthDamage: healthDamage,
                newHealth: attackerState.health,
                gangMembersLost: gangMembersLost,
                cooldownSeconds: ASSASSINATION_COOLDOWN_MS / 1000,
                error: arrested
                    ? `Hit on ${target.name} failed! You were spotted and arrested.`
                    : `Hit on ${target.name} failed! You escaped but lost reputation.`
            }));
        }

        // Notify target they were targeted
        const tgtWs = clients.get(targetId);
        if (tgtWs && tgtWs.readyState === 1) {
            tgtWs.send(JSON.stringify({
                type: 'assassination_survived',
                attackerName: attacker.name
            }));
        }

        // Broadcast
        if (arrested) {
            addGlobalChatMessage('System', `🎯 ${attacker.name} botched a hit on ${target.name} and was arrested!`, '#8b0000');
        }
    }

    broadcastPlayerStates();
    scheduleWorldSave();
}

function generateLeaderboard() {
    return Array.from(gameState.players.values())
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, 10)
        .map(p => ({
            name: p.name,
            reputation: p.reputation,
            territory: p.territory
        }));
}

// Helper to generate client ID
function generateClientId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    // Initialize jail bots on startup
    updateJailBots();
    console.log(`🔒 Jail bots initialized: ${gameState.jailBots.length} inmates`);
});

// ==================== GRACEFUL SHUTDOWN ====================
// Handle server shutdown to save world state
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('\n🛑 Server shutting down gracefully...');
    
    // Flush any pending world state changes
    try {
        flushWorldState();
        userDB.flushDB();
        console.log('💾 World state & user DB flushed to disk');
    } catch (err) {
        console.error('⚠️ Error flushing data:', err.message);
    }
    
    // Notify all connected clients
    broadcastToAll({
        type: 'server_shutdown',
        message: 'Server is shutting down. Please reconnect in a moment.'
    });
    
    // Close all WebSocket connections
    wss.clients.forEach(client => {
        try {
            client.close(1000, 'Server shutdown');
        } catch (err) {
            console.error('Error closing client connection:', err.message);
        }
    });
    
    // Close the server
    server.close(() => {
        console.log('👋 Server shut down successfully');
        process.exit(0);
    });
    
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}
