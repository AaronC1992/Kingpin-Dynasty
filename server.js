// ==================== MAFIA BORN - MULTIPLAYER SERVER ====================
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
// JSON file persistence utilities
const { loadWorldState, saveWorldState, flushWorldState } = require('./worldPersistence');

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

const server = http.createServer((req, res) => {
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
    tradeOffers: [],
    gangWars: [],
    jailBots: [], // Server-managed bot inmates (max 3, 0 if 3+ real players in jail)
    serverStats: {
        startTime: Date.now(),
        totalConnections: 0,
        messagesSent: 0,
        jailbreakAttempts: 0,
        successfulJailbreaks: 0
    }
};

// Load world persistence on startup
let persistedLeaderboard = [];
try {
    const persisted = loadWorldState();
    gameState.cityDistricts = persisted.cityDistricts || {};
    gameState.cityEvents = Array.isArray(persisted.cityEvents) ? persisted.cityEvents : [];
    persistedLeaderboard = Array.isArray(persisted.leaderboard) ? persisted.leaderboard : [];
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
                leaderboard: persistedLeaderboard
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
            
        case 'heist_create':
            handleHeistCreate(clientId, message);
            break;
            
        case 'heist_join':
            handleHeistJoin(clientId, message);
            break;
            
        case 'player_challenge':
            handlePlayerChallenge(clientId, message);
            break;
            
        case 'trade_offer':
            handleTradeOffer(clientId, message);
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
        money: message.playerStats?.money || 10000,
        reputation: message.playerStats?.reputation || 0,
        territory: message.playerStats?.territory || 0,
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
        inJail: message.playerStats?.inJail || false,
        jailTime: message.playerStats?.jailTime || 0,
        health: message.playerStats?.health || 100,
        energy: message.playerStats?.energy || 100,
        wantedLevel: message.playerStats?.wantedLevel || 0,
        lastUpdate: Date.now()
    };
    
    gameState.playerStates.set(clientId, playerState);
    
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

// Heist creation handler
function handleHeistCreate(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    const heist = {
        id: `heist_${Date.now()}_${clientId}`,
        target: message.target,
        organizer: player.name,
        organizerId: clientId,
        participants: [clientId],
        maxParticipants: message.maxParticipants || 4,
        difficulty: message.difficulty || 'Medium',
        reward: message.reward || 100000,
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

// Trade offer handler
function handleTradeOffer(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    const tradeOffer = {
        id: `trade_${Date.now()}_${clientId}`,
        fromPlayer: player.name,
        fromPlayerId: clientId,
        toPlayer: message.toPlayer,
        item: message.item,
        price: message.price,
        createdAt: Date.now()
    };
    
    gameState.tradeOffers.push(tradeOffer);
    
    console.log(`🤝 ${player.name} offered to trade ${message.item} for $${message.price}`);
    
    // Broadcast trade offer
    broadcastToAll({
        type: 'trade_offer',
        trade: tradeOffer
    });
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
        activeHeists: gameState.activeHeists
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
    const earnings = Math.floor(jobDef.base * variance);
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

// Execute heist when full
function executeHeist(heist) {
    console.log(`🎯 Executing heist: ${heist.target}`);
    
    // Simulate heist outcome
    const success = Math.random() > 0.3; // 70% success rate
    
    if (success) {
        const rewardPerPlayer = Math.floor(heist.reward / heist.participants.length);
        
        heist.participants.forEach(participantId => {
            const participant = gameState.players.get(participantId);
            if (participant) {
                participant.money += rewardPerPlayer;
                participant.reputation += 10;
            }
        });
        
        broadcastToAll({
            type: 'heist_completed',
            heist: heist,
            success: true,
            reward: rewardPerPlayer
        });
        
        addGlobalChatMessage('System', `🎉 Heist successful! ${heist.target} netted $${heist.reward.toLocaleString()}!`, '#2ecc71');
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    } else {
        // Failed heist
        heist.participants.forEach(participantId => {
            const participant = gameState.players.get(participantId);
            if (participant) {
                participant.reputation = Math.max(0, participant.reputation - 5);
            }
        });
        
        broadcastToAll({
            type: 'heist_completed',
            heist: heist,
            success: false
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
function handleAssassinationAttempt(clientId, message) {
    const attacker = gameState.players.get(clientId);
    const attackerState = gameState.playerStates.get(clientId);
    if (!attacker || !attackerState) return;

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

    // Consume 3 bullets regardless (shots fired)
    const bulletsUsed = Math.min(bulletsSent, 5);

    // Roll the dice
    const roll = Math.random() * 100;
    const success = roll < chance;

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

        console.log(`🎯 ASSASSINATION: ${attacker.name} killed ${target.name} and stole $${stolenAmount.toLocaleString()} (${stealPercent}%)`);

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
                wantedLevel: attackerState.wantedLevel
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

        console.log(`🎯 ASSASSINATION FAILED: ${attacker.name} failed to kill ${target.name}${arrested ? ' and was ARRESTED' : ''}`);

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
        console.log('💾 World state flushed to disk');
    } catch (err) {
        console.error('⚠️ Error flushing world state:', err.message);
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
