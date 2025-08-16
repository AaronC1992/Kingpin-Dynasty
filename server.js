// ==================== FROM DUSK TO DON - MULTIPLAYER SERVER ====================
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Server configuration
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    // Handle HTTP requests to serve game files
    let filePath = '.' + decodeURIComponent(req.url); // Decode URL to handle spaces in filenames
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
    
    // Filter and sanitize message
    const sanitizedMessage = message.message.replace(/<[^>]*>/g, '').substring(0, 200); // Remove HTML and limit length
    
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
        
        console.log(`🏛️ ${player.name} claimed ${district} for $${cost}`);
        
        // Broadcast territory change
        broadcastToAll({
            type: 'territory_taken',
            district: district,
            playerName: player.name,
            playerId: clientId
        });
        
        // Add to global chat
        addGlobalChatMessage('System', `🏛️ ${player.name} claimed ${district} district!`, '#e74c3c');
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
            success: false,
            reward: 0
        });
        
        addGlobalChatMessage('System', `💀 Heist failed! ${heist.target} was too well protected!`, '#e74c3c');
    }
    
    // Remove heist from active list
    gameState.activeHeists = gameState.activeHeists.filter(h => h.id !== heist.id);
}

// Utility functions
function generateClientId() {
    return 'client_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function broadcastToAll(message, excludeClientId = null) {
    const messageStr = JSON.stringify(message);
    
    clients.forEach((ws, clientId) => {
        if (clientId !== excludeClientId && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

function addGlobalChatMessage(playerName, message, color = '#3498db') {
    const chatMessage = {
        playerId: 'system',
        playerName: playerName,
        message: message,
        timestamp: Date.now()
    };
    
    gameState.globalChat.push(chatMessage);
    
    if (gameState.globalChat.length > 50) {
        gameState.globalChat = gameState.globalChat.slice(-50);
    }
    
    broadcastToAll({
        type: 'global_chat',
        playerId: 'system',
        playerName: playerName,
        message: message,
        timestamp: chatMessage.timestamp,
        color: color
    });
}

function generateLeaderboard() {
    const players = Array.from(gameState.players.values())
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, 10)
        .map((player, index) => ({
            rank: index + 1,
            name: player.name,
            money: player.money,
            reputation: player.reputation,
            territory: player.territory,
            level: player.level
        }));
    
    return players;
}

function sendWorldState(clientId, ws) {
    const worldState = {
        type: 'world_state',
        players: Array.from(gameState.players.values()),
        playerStates: Object.fromEntries(gameState.playerStates),
        cityDistricts: gameState.cityDistricts,
        activeHeists: gameState.activeHeists,
        cityEvents: gameState.cityEvents,
        globalChat: gameState.globalChat.slice(-20),
        leaderboard: generateLeaderboard(),
        serverStats: {
            playerCount: clients.size,
            uptime: Date.now() - gameState.serverStats.startTime,
            totalConnections: gameState.serverStats.totalConnections,
            jailbreakAttempts: gameState.serverStats.jailbreakAttempts,
            successfulJailbreaks: gameState.serverStats.successfulJailbreaks
        }
    };
    
    ws.send(JSON.stringify(worldState));
}

// Periodic updates
setInterval(() => {
    // Send periodic world updates
    broadcastToAll({
        type: 'world_update',
        playerCount: clients.size,
        playerStates: Object.fromEntries(gameState.playerStates),
        timestamp: Date.now()
    });
    
    // Update jail timers for all players
    gameState.playerStates.forEach((playerState, playerId) => {
        if (playerState.inJail && playerState.jailTime > 0) {
            playerState.jailTime = Math.max(0, playerState.jailTime - 30); // Decrease by 30 seconds
            
            if (playerState.jailTime <= 0) {
                playerState.inJail = false;
                
                // Notify player of release
                const client = clients.get(playerId);
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'jail_release',
                        message: 'Your jail sentence is complete! You are now free.'
                    }));
                }
                
                addGlobalChatMessage('System', `🔓 ${playerState.name} completed their jail sentence and was released!`, '#2ecc71');
            }
        }
    });
    
    // Randomly generate city events
    if (Math.random() < 0.1 && gameState.cityEvents.length < 5) {
        const newEvent = generateRandomCityEvent();
        gameState.cityEvents.push(newEvent);
        
        broadcastToAll({
            type: 'city_event',
            event: newEvent
        });
        
        addGlobalChatMessage('System', `🎯 New city event: ${newEvent.description}`, '#9b59b6');
    }
    
    // Clean up old events
    gameState.cityEvents = gameState.cityEvents.filter(event => {
        // Remove events older than 1 hour
        return Date.now() - event.createdAt < 3600000;
    });
    
}, 30000); // Every 30 seconds

function generateRandomCityEvent() {
    const events = [
        { type: 'police_raid', description: 'Police raid in progress', district: 'industrial' },
        { type: 'market_fluctuation', description: 'Black market prices volatile', district: 'downtown' },
        { type: 'gang_recruitment', description: 'Gang recruitment opportunity', district: 'docks' },
        { type: 'heist_opportunity', description: 'High-value target spotted', district: 'redlight' },
        { type: 'territory_dispute', description: 'Territory dispute escalating', district: 'suburbs' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    return {
        ...event,
        timeLeft: Math.floor(Math.random() * 60) + 15 + ' min',
        createdAt: Date.now()
    };
}

// Server startup
server.listen(PORT, () => {
    console.log(`🚀 From Dusk to Don Multiplayer Server running on port ${PORT}`);
    console.log(`🌐 WebSocket server ready for connections`);
    console.log(`📊 Server stats:`);
    console.log(`   - Max players per server: unlimited`);
    console.log(`   - Districts: ${Object.keys(gameState.cityDistricts).length}`);
    console.log(`   - City events: ${gameState.cityEvents.length}`);
    console.log('');
    console.log('🎮 Ready for players to connect!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    // Notify all connected clients
    broadcastToAll({
        type: 'server_shutdown',
        message: 'Server is shutting down for maintenance. Please reconnect in a few moments.'
    });
    
    // Close all connections
    clients.forEach(ws => {
        ws.close();
    });
    
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});

module.exports = { gameState, clients };
