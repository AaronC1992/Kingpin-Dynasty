// ==================== FROM DUSK TO DON - MULTIPLAYER SERVER ====================
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Server configuration
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    // Handle HTTP requests to serve game files
    let reqPath = decodeURIComponent(req.url); // Decode URL to handle spaces
    if (reqPath.includes('\0')) reqPath = reqPath.replace(/\0/g, '');
    // Normalize path and restrict serving to the server's working directory
    let filePath = path.normalize(path.join(process.cwd(), reqPath));
    if (reqPath === '/' || reqPath === '') {
        filePath = path.join(process.cwd(), 'index.html');
    }
    // Prevent path traversal attacks - ensure resolved path is under the project root
    if (!filePath.startsWith(process.cwd())) {
        console.log(`⚠️ Attempted path traversal: ${req.url} -> ${filePath}`);
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end(`<h1>403 Forbidden</h1><p>Access denied</p>`);
        return;
    }
    if (filePath === './') {
        filePath = './index.html';
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
                    <h1>🎮 From Dusk to Don - Multiplayer Server</h1>
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

const wss = new WebSocket.Server({ server });

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

// Game state
const gameState = {
    players: new Map(),
    playerStates: new Map(), // Detailed player states including jail status
    cityDistricts: {
        downtown: { controlledBy: null, crimeLevel: 50 },
        docks: { controlledBy: null, crimeLevel: 75 },
        suburbs: { controlledBy: null, crimeLevel: 25 },
        industrial: { controlledBy: null, crimeLevel: 60 },
        redlight: { controlledBy: null, crimeLevel: 90 }
    },
    activeHeists: [],
    globalChat: [],
    cityEvents: [
        { type: 'police_raid', district: 'industrial', description: 'Heavy police presence, high risk/reward jobs available', timeLeft: '15 min', createdAt: Date.now() },
        { type: 'market_crash', district: 'downtown', description: 'Economic instability, weapon prices fluctuating', timeLeft: '1 hour', createdAt: Date.now() },
        { type: 'gang_meeting', district: 'docks', description: 'Underground meeting, recruitment opportunities', timeLeft: '30 min', createdAt: Date.now() }
    ],
    tradeOffers: [],
    gangWars: [],
    serverStats: {
        startTime: Date.now(),
        totalConnections: 0,
        messagesSent: 0,
        jailbreakAttempts: 0,
        successfulJailbreaks: 0
    }
};

// Connected clients
const clients = new Map();

console.log('🌐 From Dusk to Don - Multiplayer Server Starting...');

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    clients.set(clientId, ws);
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
                }
            });
            
            gameState.players.delete(clientId);
            gameState.playerStates.delete(clientId);
            
            // Broadcast updated player states
            broadcastPlayerStates();
        }
        
        clients.delete(clientId);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection_established',
        playerId: clientId,
        serverInfo: {
            playerCount: clients.size,
            serverName: 'From Dusk to Don - Main Server',
            cityEvents: gameState.cityEvents,
            globalLeaderboard: generateLeaderboard()
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
            
        case 'request_world_state':
            sendWorldState(clientId, ws);
            break;
        
        // ==================== SERVER-AUTHORITATIVE INTENTS (FIRST PASS) ====================
        // Clients now send INTENT messages only. The server validates and computes outcomes.
        // Future gameplay actions should follow this pattern: client -> intent, server -> authoritative result.
        case 'job_intent':
            handleJobIntent(clientId, message);
            break;
            
        default:
            console.log(`⚠️ Unknown message type: ${message.type}`);
    }
}

// Player connection handler
function handlePlayerConnect(clientId, message, ws) {
    const player = {
        id: clientId,
        name: message.playerName || `Player_${clientId.slice(-4)}`,
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
    
    // Update all state fields from message
    if (message.playerState) {
        Object.assign(playerState, message.playerState);
        playerState.playerId = clientId;
        playerState.name = message.playerName || player.name;
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
    }
    
    // Broadcast updated player states to all clients
    broadcastPlayerStates();
    
    // Send updated leaderboard if reputation changed
    if (message.reputation !== undefined) {
        broadcastToAll({
            type: 'player_ranked',
            leaderboard: generateLeaderboard()
        });
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
    
    if (!targetState.inJail) {
        console.log(`❌ ${helper.name} tried to break out ${message.targetPlayerName} who isn't in jail`);
        return;
    }
    
    gameState.serverStats.jailbreakAttempts++;
    
    console.log(`🔓 ${helper.name} attempting to break out ${message.targetPlayerName}`);
    
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
        
        console.log(`✅ Jailbreak successful! ${helper.name} freed ${message.targetPlayerName}`);
        
        // Notify target player if they're online
        const targetClient = clients.get(message.targetPlayerId);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            targetClient.send(JSON.stringify({
                type: 'jailbreak_success',
                helperName: helper.name,
                message: `${helper.name} successfully broke you out of jail!`
            }));
        }
        
        // Broadcast successful jailbreak
        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerId: message.targetPlayerId,
            targetPlayerName: message.targetPlayerName,
            success: true
        });
        
        addGlobalChatMessage('System', `🎉 ${helper.name} successfully broke ${message.targetPlayerName} out of jail!`, '#2ecc71');
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
                    message: 'Jailbreak failed and you were caught! You\'ve been arrested.'
                }));
            }
            
            addGlobalChatMessage('System', `💀 ${helper.name} failed to break out ${message.targetPlayerName} and was arrested!`, '#e74c3c');
        } else {
            console.log(`💀 Jailbreak failed but ${helper.name} escaped`);
            
            addGlobalChatMessage('System', `💀 ${helper.name} failed to break out ${message.targetPlayerName} but escaped undetected.`, '#f39c12');
        }
        
        // Broadcast failed jailbreak
        broadcastToAll({
            type: 'jailbreak_attempt',
            playerId: clientId,
            playerName: helper.name,
            targetPlayerId: message.targetPlayerId,
            targetPlayerName: message.targetPlayerName,
            success: false,
            helperArrested: helperState.inJail
        });
    }
    
    // Broadcast updated player states
    broadcastPlayerStates();
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
    broadcastToAll({ type: 'player_ranked', leaderboard: generateLeaderboard() });
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
});
