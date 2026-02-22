// ==================== THE COMMISSION SYSTEM ====================

// Online world configuration
const onlineWorld = {
    maxPlayersPerServer: 100,
    // Production WebSocket URL - dynamically constructed so the client connects to the same host/protocol
    // You can override this by setting `window.__MULTIPLAYER_SERVER_URL__ = 'wss://yourserver:port'` before this file loads
    serverUrl: (function(){
        try {
            if (window.__MULTIPLAYER_SERVER_URL__) return window.__MULTIPLAYER_SERVER_URL__;
            const hostname = window.location.hostname;
            const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
            if (isLocal) return 'ws://localhost:3000'; // Local development
            // For production (cPanel/Passenger), use wss:// on same host
            // Passenger handles the WebSocket upgrade on the same domain
            const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            return proto + window.location.host;
        } catch (e) {
            return 'wss://mafiaborn.com';
        }
    })(),
    updateInterval: 3000, // 3 second update interval for world state
    reconnectInterval: 5000, // 5 seconds between reconnect attempts
    events: {
        PLAYER_CONNECT: 'player_connect',
        PLAYER_DISCONNECT: 'player_disconnect',
        WORLD_UPDATE: 'world_update',
        JOB_COMPLETE: 'job_complete',
        TERRITORY_TAKEN: 'territory_taken',
        GANG_WAR_STARTED: 'gang_war_started',
        TRADE_OFFER: 'trade_offer',
        GLOBAL_CHAT: 'global_chat',
        HEIST_BROADCAST: 'heist_broadcast',
        PLAYER_RANKED: 'player_ranked',
        CITY_EVENT: 'city_event'
    }
}

// Log resolved server URL for debugging so uploader can see what client will attempt to connect to
try {
    console.log('[multiplayer] Resolved serverUrl ->', onlineWorld.serverUrl);
} catch (e) {}


// Online world state
let onlineWorldState = {
    isConnected: false,
    connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
    socket: null,
    playerId: null,
    serverInfo: {
        playerCount: 0,
        serverName: 'Mafia Born - The Commission',
        cityEvents: [],
        globalLeaderboard: []
    },
    nearbyPlayers: [],
    globalChat: [],
    cityDistricts: {
        downtown: { 
            controlledBy: null, 
            controllerType: 'npc', // 'npc' or 'player'
            npcGang: 'The Street Kings',
            crimeLevel: 50,
            defenseRating: 100,
            weeklyIncome: 15000,
            assignedMembers: 0,
            assignedCars: 0,
            assignedWeapons: 0
        },
        docks: { 
            controlledBy: null, 
            controllerType: 'npc',
            npcGang: 'The Longshoremen',
            crimeLevel: 75,
            defenseRating: 150,
            weeklyIncome: 25000,
            assignedMembers: 0,
            assignedCars: 0,
            assignedWeapons: 0
        },
        suburbs: { 
            controlledBy: null, 
            controllerType: 'npc',
            npcGang: 'The Neighborhood Watch',
            crimeLevel: 25,
            defenseRating: 50,
            weeklyIncome: 8000,
            assignedMembers: 0,
            assignedCars: 0,
            assignedWeapons: 0
        },
        industrial: { 
            controlledBy: null, 
            controllerType: 'npc',
            npcGang: 'The Factory Boys',
            crimeLevel: 60,
            defenseRating: 120,
            weeklyIncome: 18000,
            assignedMembers: 0,
            assignedCars: 0,
            assignedWeapons: 0
        },
        redlight: { 
            controlledBy: null, 
            controllerType: 'npc',
            npcGang: 'The Vice Lords',
            crimeLevel: 90,
            defenseRating: 200,
            weeklyIncome: 35000,
            assignedMembers: 0,
            assignedCars: 0,
            assignedWeapons: 0
        }
    },
    activeHeists: [],
    tradeOffers: [],
    gangWars: [],
    lastUpdate: null
};

// Territory income tracking
let territoryIncomeNextCollection = Date.now() + (7 * 24 * 60 * 60 * 1000); // Next weekly collection

// ==================== MISSING FUNCTION IMPLEMENTATIONS ====================

// Sync server territory data to local player object
function syncMultiplayerTerritoriesToPlayer() {
    // If connected to server, territories come from server state
    // Otherwise use local player.territories
    if (onlineWorldState.isConnected && onlineWorldState.territories) {
        // Server territories override local
        console.log('[multiplayer] Syncing territories from server');
    }
    // No-op if offline — local territories are already on player object
}

// Count territories the player controls
function countControlledTerritories() {
    if (typeof player !== 'undefined' && player.territories) {
        return player.territories.length;
    }
    return 0;
}

// Calculate weekly income from multiplayer territories
function calculateMultiplayerTerritoryWeeklyIncome() {
    if (typeof player !== 'undefined' && player.territoryIncome) {
        return player.territoryIncome;
    }
    return 0;
}

// Show the "Whack Rival Don" high-risk PvP challenge
function showWhackRivalDon() {
    if (!onlineWorldState.isConnected) {
        alert('You must be connected to the online world to challenge a rival Don.');
        return;
    }
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #8b0000;">
            <h2 style="color: #ff4444; text-align: center; font-family: 'Georgia', serif;"> Whack Rival Don</h2>
            <p style="color: #ff6666; text-align: center; font-style: italic;">Challenge another player's Don to a life-or-death showdown.<br>The loser's character is permanently eliminated.</p>
            <div id="online-player-list" style="margin: 20px 0;">
                <p style="color: #888; text-align: center;">Loading online players...</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
    updateOnlinePlayerList();
}

// Show active heists available to join
function showActiveHeists() {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
    
    const heists = onlineWorldState.activeHeists || [];
    let heistHTML = heists.length > 0 
        ? heists.map(h => `
            <div style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #8b0000;">
                <div style="color: #c0a062; font-weight: bold;">${h.name || 'Unknown Heist'}</div>
                <div style="color: #ccc; font-size: 0.9em;">Crew: ${h.members ? h.members.length : 0}/${h.maxMembers || 4}</div>
                <button onclick="joinHeist('${h.id}')" style="margin-top: 8px; background: #8b0000; color: #fff; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">Join Heist</button>
            </div>
        `).join('')
        : '<p style="color: #888; text-align: center; font-style: italic;">No active heists right now. Check back later!</p>';
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #8b0000;">
            <h2 style="color: #c0a062; text-align: center; font-family: 'Georgia', serif;"> Big Scores</h2>
            <p style="color: #ccc; text-align: center;">Join other players on high-paying heists.</p>
            ${heistHTML}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

// Show the trade market
function showTradeMarket() {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #27ae60;">
            <h2 style="color: #27ae60; text-align: center; font-family: 'Georgia', serif;"> Black Market Trading</h2>
            <p style="color: #ccc; text-align: center;">Buy and sell contraband with other players.</p>
            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                <p style="color: #888; font-style: italic;">No items listed for trade. List some of yours to get started!</p>
                <button onclick="listItemForSale()" style="margin-top: 10px; background: #27ae60; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">List Item for Sale</button>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

// Show gang wars / turf war battles
function showGangWars() {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
    
    const wars = onlineWorldState.gangWars || [];
    let warsHTML = wars.length > 0
        ? wars.map(w => `
            <div style="background: rgba(139,0,0,0.2); padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #8b0000;">
                <div style="color: #ff4444; font-weight: bold;">${w.attacker || '???'} vs ${w.defender || '???'}</div>
                <div style="color: #ccc; font-size: 0.9em;">District: ${w.district || 'Unknown'}</div>
                <button onclick="spectateWar('${w.district}')" style="margin-top: 8px; background: #444; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer;">Spectate</button>
            </div>
        `).join('')
        : '<p style="color: #888; text-align: center; font-style: italic;">No active turf wars. The streets are quiet... for now.</p>';
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #8b0000;">
            <h2 style="color: #8b0000; text-align: center; font-family: 'Georgia', serif;"> Turf Wars</h2>
            <p style="color: #ccc; text-align: center;">Watch or join territorial battles between crews.</p>
            ${warsHTML}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

// Show nearby players list
function showNearbyPlayers() {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
    
    const players = onlineWorldState.nearbyPlayers || [];
    let playersHTML = players.length > 0
        ? players.map(p => `
            <div style="background: rgba(0,0,0,0.6); padding: 12px; border-radius: 8px; margin: 8px 0; border: 1px solid #f39c12; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="color: #f39c12; font-weight: bold;">${p.name || 'Unknown'}</span>
                    <span style="color: #888; font-size: 0.85em;"> Lvl ${p.level || 1}</span>
                </div>
                <div>
                    <button onclick="challengePlayer('${p.name}')" style="background: #8b0000; color: #fff; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 0 3px;">Fight</button>
                    <button onclick="tradeWithPlayer('${p.name}')" style="background: #27ae60; color: #fff; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 0 3px;">Trade</button>
                </div>
            </div>
        `).join('')
        : '<p style="color: #888; text-align: center; font-style: italic;">No players nearby. Try exploring different districts.</p>';
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #f39c12;">
            <h2 style="color: #f39c12; text-align: center; font-family: 'Georgia', serif;"> Local Crew</h2>
            <p style="color: #ccc; text-align: center;">Players in your area. Challenge, trade, or recruit them.</p>
            ${playersHTML}
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

// View territory details for a specific district
function viewTerritoryDetails(district) {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    const territories = onlineWorldState.territories || {};
    const info = territories[district] || { controlledBy: 'Unclaimed', power: 0 };
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #c0a062;">
            <h2 style="color: #c0a062; text-align: center; font-family: 'Georgia', serif;"> ${district}</h2>
            <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p style="color: #ccc;">Controlled by: <span style="color: #f39c12; font-weight: bold;">${info.controlledBy}</span></p>
                <p style="color: #ccc;">Defense Power: <span style="color: #e74c3c;">${info.power || 0}</span></p>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="challengeForTerritory('${district}')" style="background: #8b0000; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Attack</button>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 10px 20px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; margin: 5px;">Back</button>
            </div>
        </div>
    `;
}

// Challenge for a territory (sends to server if connected)
function challengeForTerritory(district) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket) {
        alert('You must be connected to the online world to challenge for territory.');
        return;
    }
    
    onlineWorldState.socket.send(JSON.stringify({
        type: 'territory_claim',
        district: district,
        playerName: player.name,
        money: player.money
    }));
    
    logAction(` Challenging for control of ${district}...`);
}

// Start a heist in a specific district
function startDistrictHeist(districtName) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket) {
        alert('You must be connected to the online world to start a heist.');
        return;
    }
    
    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_create',
        district: districtName,
        playerName: player.name,
        level: player.level
    }));
    
    logAction(` Starting a heist in ${districtName}... looking for crew members.`);
}

// ==================== CORE ONLINE WORLD FUNCTIONS ====================

// Initialize online world connection
function initializeOnlineWorld() {
    setupOnlineWorldUI();
    
    // Don't auto-connect immediately - wait for game to be loaded or started
    // The connection will be made when a game is loaded or started
    
    // Load saved player data
    if (typeof(Storage) !== "undefined") {
        const savedWorldData = localStorage.getItem('onlineWorldData');
        if (savedWorldData) {
            const data = JSON.parse(savedWorldData);
            onlineWorldState = { ...onlineWorldState, ...data };
        }
    }
    
    // Set up periodic state sync
    setInterval(() => {
        if (onlineWorldState.isConnected) {
            syncPlayerState();
        }
    }, 5000); // Sync every 5 seconds
}

// Function to connect to multiplayer after game is loaded/started
function connectMultiplayerAfterGame() {
    console.log('Connecting to multiplayer after game is ready...');
    if (!onlineWorldState.isConnected) {
        connectToOnlineWorld();
    }
}

// Connect to the online world
function connectToOnlineWorld() {
    if (onlineWorldState.isConnected) {
        return;
    }
    
    onlineWorldState.connectionStatus = 'connecting';
    updateConnectionStatus();
    
    try {
        // Try to connect to real WebSocket server
        const serverUrl = onlineWorld.serverUrl;
        logAction(" Connecting to online world...");
        // Add a console log for clearer diagnostics
        console.log('[multiplayer] Connecting to WebSocket server at', serverUrl);
        
        onlineWorldState.socket = new WebSocket(serverUrl);
        
        onlineWorldState.socket.onopen = function(event) {
            onlineWorldState.isConnected = true;
            onlineWorldState.connectionStatus = 'connected';
            onlineWorldState.playerId = generatePlayerId();
            
            // Don't prompt for name on connection - only when actually needed
            // Try to get saved name first, fallback to anonymous if none found
            let playerName = ensurePlayerName();
            if (!playerName) {
                playerName = 'Anonymous_' + Math.floor(Math.random() * 1000);
            }
            
            // Send initial player data to server
            const playerData = {
                type: 'player_connect',
                playerId: onlineWorldState.playerId,
                playerName: playerName, // Use saved name or default
                playerStats: {
                    money: player.money,
                    reputation: player.reputation,
                    territory: player.territory,
                    level: player.level || 1
                }
            };
            
            onlineWorldState.socket.send(JSON.stringify(playerData));
            
            updateConnectionStatus();
            initializeWorldData();
            startWorldUpdates();
            
            logAction(` Connected to online world! Player ID: ${onlineWorldState.playerId}`);
            showWelcomeMessage();
        };
        
        onlineWorldState.socket.onmessage = function(event) {
            handleServerMessage(JSON.parse(event.data));
        };
        
        onlineWorldState.socket.onclose = function(event) {
            onlineWorldState.isConnected = false;
            onlineWorldState.connectionStatus = 'disconnected';
            updateConnectionStatus();
            logAction(" Disconnected from online world");
            
            // Attempt to reconnect
            setTimeout(() => {
                connectToOnlineWorld();
            }, onlineWorld.reconnectInterval);
        };
        
        onlineWorldState.socket.onerror = function(error) {
            onlineWorldState.connectionStatus = 'error';
            updateConnectionStatus();
            logAction(" Failed to connect to online world. Retrying...");
            
            // Fallback to local demo mode
            setTimeout(() => {
                connectToLocalDemo();
            }, 3000);
        };
        
    } catch (error) {
        onlineWorldState.connectionStatus = 'error';
        updateConnectionStatus();
        logAction(" Failed to connect to online world. Retrying...");
        
        setTimeout(() => {
            connectToLocalDemo();
        }, onlineWorld.reconnectInterval);
    }
}

// Fallback to local demo mode when server is unavailable
function connectToLocalDemo() {
    logAction(" Starting in offline demo mode...");
    
    setTimeout(() => {
        onlineWorldState.isConnected = false; // Keep as demo mode
        onlineWorldState.connectionStatus = 'demo';
        onlineWorldState.playerId = generatePlayerId();
        onlineWorldState.serverInfo.playerCount = 47 + Math.floor(Math.random() * 30);
        
        updateConnectionStatus();
        initializeWorldData();
        startWorldUpdates();
        
        logAction(` Demo mode active - ${onlineWorldState.serverInfo.playerCount} simulated players`);
    }, 2000);
}

// Handle messages from the server
function handleServerMessage(message) {
    switch(message.type) {
        case 'world_update':
            onlineWorldState.serverInfo.playerCount = message.playerCount;
            onlineWorldState.lastUpdate = new Date().toLocaleTimeString();
            
            // Update player states including jail status
            if (message.playerStates) {
                onlineWorldState.playerStates = message.playerStates;
                updateJailVisibility();
                updateOnlinePlayerList();

                // SERVER-AUTHORITATIVE SYNC: overwrite local critical stats from authoritative state
                const selfPs = onlineWorldState.playerStates[onlineWorldState.playerId];
                if (selfPs) {
                    // Only trust server for these values
                    if (typeof player.money === 'number' && typeof selfPs.money === 'number') player.money = selfPs.money;
                    if (typeof selfPs.reputation === 'number') player.reputation = selfPs.reputation;
                    if (typeof selfPs.level === 'number') player.level = selfPs.level;
                    if (typeof selfPs.territory === 'number') player.territory = selfPs.territory;
                    player.inJail = !!selfPs.inJail;
                    player.jailTime = selfPs.jailTime || 0;
                    if (typeof selfPs.wantedLevel === 'number') player.wantedLevel = selfPs.wantedLevel;
                    if (typeof selfPs.energy === 'number') player.energy = selfPs.energy;
                    updateUI(); // reflect authoritative corrections
                }
            }
            
            updateConnectionStatus();
            break;
            
        case 'global_chat':
            const chatMessage = {
                player: message.playerName,
                message: message.message,
                time: new Date(message.timestamp).toLocaleTimeString() || 'Just now',
                color: message.color || (message.playerId === onlineWorldState.playerId ? '#2ecc71' : '#3498db'),
                playerId: message.playerId
            };
            onlineWorldState.globalChat.push(chatMessage);
            
            // Keep only last 50 messages
            if (onlineWorldState.globalChat.length > 50) {
                onlineWorldState.globalChat = onlineWorldState.globalChat.slice(-50);
            }
            
            // Update chat if visible
            const chatArea = document.getElementById('global-chat-area');
            if (chatArea) {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.3); border-radius: 5px; border-left: 3px solid ' + chatMessage.color + ';';
                messageDiv.innerHTML = `<strong style="color: ${chatMessage.color};">${escapeHTML(chatMessage.player)}:</strong> ${escapeHTML(chatMessage.message)} <small style="color: #95a5a6; float: right;">${chatMessage.time}</small>`;
                chatArea.appendChild(messageDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
            }
            
            // Update quick chat display
            updateQuickChatDisplay();
            
            // Update mobile action log if available
            if (typeof updateMobileActionLog === 'function') {
                updateMobileActionLog();
            }
            break;
        
        case 'player_jail_update':
            // Handle jail status updates for other players
            if (message.playerId !== onlineWorldState.playerId) {
                updatePlayerJailStatus(message.playerId, message.playerName, message.jailStatus);
            }
            break;
            
        case 'jailbreak_attempt':
            // Notify about jailbreak attempts by other players
            const jailbreakMsg = ` ${message.playerName} ${message.success ? 'successfully broke out of jail!' : 'failed a jailbreak attempt!'}`;
            addWorldEvent(jailbreakMsg);
            
            if (document.getElementById('global-chat-area')) {
                showSystemMessage(jailbreakMsg, message.success ? '#c0a062' : '#8b0000');
            }
            break;
            
        case 'player_arrested':
            // Notify when another player gets arrested
            const arrestMsg = ` ${message.playerName} was arrested and sent to jail!`;
            addWorldEvent(arrestMsg);
            
            if (document.getElementById('global-chat-area')) {
                showSystemMessage(arrestMsg, '#8b0000');
            }
            break;
            
        case 'territory_taken':
            onlineWorldState.cityDistricts[message.district].controlledBy = message.playerName;
            addWorldEvent(` ${message.playerName} claimed ${message.district} district!`);
            // If this was our claim, apply authoritative money & territory
            if (message.playerId === onlineWorldState.playerId) {
                if (typeof message.money === 'number') player.money = message.money;
                if (typeof message.territory === 'number') player.territory = message.territory;
                updateUI();
            }
            break;

        case 'job_result':
            // SERVER-AUTHORITATIVE job outcome (sent only to requesting client)
            if (message.success) {
                if (typeof message.money === 'number') player.money = message.money;
                if (typeof message.reputation === 'number') player.reputation = message.reputation;
                if (typeof message.wantedLevel === 'number') player.wantedLevel = message.wantedLevel;
                if (typeof message.energy === 'number') player.energy = message.energy;
                player.inJail = !!message.jailed ? true : player.inJail;
                if (message.jailed) player.jailTime = message.jailTime || player.jailTime;
                // Log outcome
                const earningsStr = message.earnings ? `+$${message.earnings.toLocaleString()}` : '';
                logAction(` Job '${message.jobId}' completed ${earningsStr} (Rep +${message.repGain || 0}, Wanted +${message.wantedAdded || 0})`);
                if (message.jailed) {
                    logAction(` Arrested during job. Jail Time: ${player.jailTime}s`);
                    addWorldEvent(` Arrested during ${message.jobId} job.`);
                }
            } else {
                logAction(` Job '${message.jobId}' failed: ${message.error || 'Unknown error'}`);
            }
            updateUI();
            break;

        case 'jailbreak_success':
            // If we were freed, update local jail status
            if (message.helperName) {
                showSystemMessage(` ${message.helperName} freed you from jail!`, '#c0a062');
            }
            player.inJail = false;
            player.jailTime = 0;
            updateUI();
            break;

        case 'jailbreak_failed_arrested':
            // We got arrested during jailbreak attempt
            showSystemMessage(message.message || 'Jailbreak failed and you were arrested.', '#8b0000');
            // Jail state will sync on next world_update; avoid guessing remaining time here.
            updateUI();
            break;
            
        case 'heist_broadcast':
            onlineWorldState.activeHeists.push(message.heist);
            addWorldEvent(` ${message.playerName} is organizing a heist!`);
            break;
            
        case 'player_ranked':
            // Update leaderboard
            loadGlobalLeaderboard();
            break;
            
        case 'system_message':
            const systemMsg = {
                player: 'System',
                message: message.message,
                time: new Date().toLocaleTimeString(),
                color: message.color || '#e74c3c',
                playerId: 'system'
            };
            onlineWorldState.globalChat.push(systemMsg);
            
            // Update chat if visible
            const chatAreaSys = document.getElementById('global-chat-area');
            if (chatAreaSys) {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.3); border-radius: 5px; border-left: 3px solid ' + systemMsg.color + ';';
                messageDiv.innerHTML = `<strong style="color: ${systemMsg.color};">System:</strong> ${escapeHTML(systemMsg.message)} <small style="color: #95a5a6; float: right;">${systemMsg.time}</small>`;
                chatAreaSys.appendChild(messageDiv);
                chatAreaSys.scrollTop = chatAreaSys.scrollHeight;
            }
            
            // Also show as a toast if UI system is available
            if (typeof ui !== 'undefined' && ui.toast) {
                ui.toast(message.message, 'warning');
            }
            break;
            
        case 'combat_result':
            // Server-authoritative PvP combat outcome
            const isWinner = message.winner === (player.name || '');
            const isLoser = message.loser === (player.name || '');
            if (isWinner) {
                const repGain = message.repChange || 5;
                logAction(` Victory! You defeated ${message.loser} and gained ${repGain} reputation!`);
                addWorldEvent(` ${message.winner} defeated ${message.loser} in combat!`);
            } else if (isLoser) {
                logAction(` Defeat! ${message.winner} defeated you in combat.`);
            } else {
                addWorldEvent(` ${message.winner} defeated ${message.loser} in combat!`);
            }
            // Stats sync happens via next world_update
            break;

        default:
            console.log('Unknown message type:', message.type);
    }
}

// Update jail visibility for online players
function updateJailVisibility() {
    // This function will be called when we receive player state updates
    // It updates the UI to show which players are in jail
    const jailStatusContainer = document.getElementById('online-jail-status');
    if (!jailStatusContainer) return;
    
    let jailHTML = '<h4 style="color: #8b0000; margin: 0 0 15px 0; font-family: \'Georgia\', serif;"> Made Men In The Can</h4>';
    
    const playersInJail = Object.values(onlineWorldState.playerStates || {}).filter(p => p.inJail);
    
    if (playersInJail.length === 0) {
        jailHTML += '<div style="color: #95a5a6; font-style: italic; text-align: center;">No players currently in jail</div>';
    } else {
        playersInJail.forEach(prisoner => {
            const timeLeft = Math.max(0, Math.ceil(prisoner.jailTime));
            jailHTML += `
                <div style="background: rgba(139, 0, 0, 0.2); padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #8b0000;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #8b0000; font-family: \'Georgia\', serif;">${prisoner.name}</strong>
                            <br><small style="color: #ecf0f1;">Time Left: ${timeLeft}s</small>
                        </div>
                        <div>
                            ${prisoner.playerId !== onlineWorldState.playerId ? `
                                <button onclick="attemptPlayerJailbreak('${prisoner.playerId}', '${prisoner.name}')" 
                                        style="background: #f39c12; color: white; border: none; padding: 6px 12px; 
                                               border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                     Break Out
                                </button>
                            ` : `
                                <span style="color: #95a5a6; font-style: italic;">You</span>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    jailStatusContainer.innerHTML = jailHTML;
}

// Update online player list
function updateOnlinePlayerList() {
    const playerListContainer = document.getElementById('online-player-list');
    if (!playerListContainer) return;
    
    let playersHTML = '<h4 style="color: #c0a062; margin: 0 0 15px 0; font-family: \'Georgia\', serif;"> Made Men Online</h4>';
    
    const onlinePlayers = Object.values(onlineWorldState.playerStates || {});
    
    if (onlinePlayers.length === 0) {
        playersHTML += '<div style="color: #95a5a6; font-style: italic; text-align: center;">Loading player list...</div>';
    } else {
        onlinePlayers.forEach(player => {
            const statusIcon = player.inJail ? '' : '🟢';
            const statusText = player.inJail ? 'In Jail' : 'Free';
            const statusColor = player.inJail ? '#8b0000' : '#c0a062';
            
            playersHTML += `
                <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; margin: 8px 0; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: ${player.playerId === onlineWorldState.playerId ? '#c0a062' : '#ecf0f1'}; font-family: 'Georgia', serif;">
                                ${player.name} ${player.playerId === onlineWorldState.playerId ? '(You)' : ''}
                            </strong>
                            <br><small style="color: ${statusColor};">${statusIcon} ${statusText}</small>
                        </div>
                        <div style="text-align: right; font-size: 0.9em;">
                            <div>Level ${player.level || 1}</div>
                            <div style="color: #95a5a6;">${player.reputation || 0} rep</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    playerListContainer.innerHTML = playersHTML;
}

// Update player jail status
function updatePlayerJailStatus(playerId, playerName, jailStatus) {
    if (!onlineWorldState.playerStates) {
        onlineWorldState.playerStates = {};
    }
    
    if (!onlineWorldState.playerStates[playerId]) {
        onlineWorldState.playerStates[playerId] = {
            playerId: playerId,
            name: playerName
        };
    }
    
    onlineWorldState.playerStates[playerId].inJail = jailStatus.inJail;
    onlineWorldState.playerStates[playerId].jailTime = jailStatus.jailTime;
    
    // Update UI if jail screen is visible
    updateJailVisibility();
    updateOnlinePlayerList();
}

// Attempt to break out another player
function attemptPlayerJailbreak(targetPlayerId, targetPlayerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    if (player.inJail) {
        alert("You can't help others break out while you're in jail yourself!");
        return;
    }
    
    if (player.energy < 15) {
        alert("You need at least 15 energy to attempt a jailbreak!");
        return;
    }
    
    const confirmBreakout = confirm(`Attempt to break ${targetPlayerName} out of jail? This will cost 15 energy and has risks.`);
    
    if (confirmBreakout) {
        // SERVER-AUTHORITATIVE INTENT: Energy deducted locally, outcome (success/arrest) decided by server.
        player.energy -= 15;
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'jailbreak_attempt',
                targetPlayerId,
                targetPlayerName,
                helperPlayerId: onlineWorldState.playerId,
                helperPlayerName: player.name || 'You'
            }));
            logAction(` Jailbreak intent sent to free ${targetPlayerName}. Awaiting authoritative outcome...`);
        } else {
            alert('Connection lost before sending jailbreak intent.');
        }
        updateUI(); // Show reduced energy immediately; success/failure will arrive via server messages
    }
}

// Show system message in chat
function showSystemMessage(message, color = '#f39c12') {
    const chatArea = document.getElementById('global-chat-area');
    if (chatArea) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.4); border-radius: 5px; border-left: 3px solid ${color};`;
        // Sanitize messages from untrusted sources before injecting into the DOM
        messageDiv.innerHTML = `<strong style="color: ${color};">System:</strong> ${escapeHTML(message)} <small style="color: #95a5a6; float: right;">${new Date().toLocaleTimeString()}</small>`;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Sync player state to server
function syncPlayerState() {
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        // Ensure we have the saved player name before syncing
        let playerName = ensurePlayerName();
        if (!playerName) {
            playerName = 'Anonymous_' + Math.floor(Math.random() * 1000);
        }
        
        onlineWorldState.socket.send(JSON.stringify({
            type: 'player_update',
            playerId: onlineWorldState.playerId,
            playerName: playerName,
            playerState: {
                money: player.money,
                reputation: player.reputation,
                level: player.level || 1,
                territory: player.territory,
                inJail: player.inJail || false,
                jailTime: player.jailTime || 0,
                health: player.health,
                energy: player.energy,
                wantedLevel: player.wantedLevel
            }
        }));
    }
}

// ==================== SERVER-AUTHORITATIVE JOB INTENT ====================
// Send a job intent to the server. The server decides earnings, reputation, wanted level, jail outcome, and energy.
// Temporary mapping: collapse many local job types into limited server prototypes.
function sendJobIntent(localJob) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        return false;
    }
    // Map local job risk to a prototype jobId recognized by server.
    // This is a placeholder until full job catalog mirrored server-side.
    let jobId;
    const risk = (localJob.risk || '').toLowerCase();
    if (risk === 'low') jobId = 'pickpocket';
    else if (risk === 'medium') jobId = 'carTheft';
    else jobId = 'bankRobbery'; // high / very high / extreme / legendary bucket for now

    onlineWorldState.socket.send(JSON.stringify({
        type: 'job_intent',
        jobId
    }));
    logAction(` Job intent sent (${localJob.name} → ${jobId}). Awaiting authoritative result...`);
    return true;
}

// ==================== GLOBAL CHAT SYSTEM ====================

// Debug test function
function testGlobalFunctions() {
    console.log('=== DEBUGGING GLOBAL FUNCTIONS ===');
    console.log('showGlobalChat exists:', typeof showGlobalChat);
    console.log('window.showGlobalChat exists:', typeof window.showGlobalChat);
    console.log('Attempting to call showGlobalChat...');
    try {
        showGlobalChat();
        console.log('showGlobalChat called successfully');
    } catch (e) {
        console.error('Error calling showGlobalChat:', e);
    }
}

// Show dedicated global chat screen
// ==================== PVP ARENA SCREEN ====================

function showPVP() {
    // Sync territories before displaying
    syncMultiplayerTerritoriesToPlayer();
    
    const pvpHTML = `
        <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #8b0000;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8b0000; font-family: 'Georgia', serif; font-size: 2.5em; text-shadow: 2px 2px 8px #000; margin: 0;"> PVP ARENA</h1>
                <p style="color: #ff6666; margin: 10px 0 0 0; font-size: 1.1em; font-style: italic;">Prove your worth. Crush your rivals. Take what's theirs.</p>
            </div>
            
            <!-- Territory Income Timer -->
            <div id="territory-income-timer-pvp" style="background: rgba(39, 174, 96, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #27ae60; text-align: center;">
                <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;"> Next Territory Income</div>
                <div id="income-countdown-pvp" style="color: #ccc; margin-top: 5px; font-family: monospace; font-size: 1.3em;">Calculating...</div>
                <div style="color: #888; font-size: 0.85em; margin-top: 5px;">Controlled Territories: <span id="controlled-count-pvp" style="color: #27ae60; font-weight: bold;">0</span> | Weekly Income: <span id="weekly-income-total-pvp" style="color: #27ae60; font-weight: bold;">$0</span></div>
            </div>
            
            <!-- PVP Actions Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 30px 0;">
                
                <!-- Whack Rival Don -->
                <div style="background: linear-gradient(180deg, rgba(139, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%); padding: 25px; border-radius: 15px; border: 2px solid #8b0000; cursor: pointer; transition: transform 0.2s;" onclick="showWhackRivalDon()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="font-size: 4em; margin-bottom: 15px;"></div>
                        <h3 style="color: #ff4444; margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 1.5em;">Whack Rival Don</h3>
                        <p style="color: #ffaaaa; margin: 0 0 15px 0; font-size: 0.95em;">High-risk assassination with permadeath</p>
                        <div style="background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 8px; margin-top: 15px;">
                            <div style="color: #ccc; font-size: 0.85em; line-height: 1.6;">
                                 Steal 10-50% money + cars<br>
                                 Target permanently removed<br>
                                 Risk: 20-60% health damage
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Territory Conquest -->
                <div style="background: linear-gradient(180deg, rgba(243, 156, 18, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%); padding: 25px; border-radius: 15px; border: 2px solid #f39c12; cursor: pointer; transition: transform 0.2s;" onclick="showOnlineWorld()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="font-size: 4em; margin-bottom: 15px;"></div>
                        <h3 style="color: #f39c12; margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 1.5em;">Territory Conquest</h3>
                        <p style="color: #f9ca7e; margin: 0 0 15px 0; font-size: 0.95em;">Conquer districts for weekly income</p>
                        <div style="background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 8px; margin-top: 15px;">
                            <div style="color: #ccc; font-size: 0.85em; line-height: 1.6;">
                                 Assign gang/cars/weapons<br>
                                 Weekly dirty money income<br>
                                 Battle NPC or player gangs<br>
                                 Risk: Lose assigned resources
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <!-- PVP Stats Overview -->
            <div style="background: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif; text-align: center;"> Your PVP Stats</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                    <div>
                        <div style="color: #888; font-size: 0.85em;">Attack Power</div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.3em;">${calculateAttackPower()}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.85em;">Defense Power</div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.3em;">${calculateDefensePower()}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.85em;">Territories</div>
                        <div style="color: #27ae60; font-weight: bold; font-size: 1.3em;">${countControlledTerritories()}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.85em;">Gang Members</div>
                        <div style="color: #3498db; font-weight: bold; font-size: 1.3em;">${player.gangMembers || 0}</div>
                    </div>
                </div>
            </div>
            
            <!-- Warning Notice -->
            <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                <h4 style="color: #ff6666; margin: 0 0 10px 0;"> PVP WARNING</h4>
                <p style="color: #ccc; margin: 0; font-size: 0.95em; line-height: 1.6;">
                    PVP actions carry real consequences. Assassination attempts can result in permanent character death (permadeath). 
                    Territory battles may result in the loss of gang members, vehicles, and weapons. Only engage if you're prepared to lose what you stake.
                </p>
            </div>
            
            <!-- Navigation -->
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="showOnlineWorld()" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 10px;">
                     The Commission
                </button>
                <button onclick="goBackToMainMenu()" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                     Main Menu
                </button>
            </div>
        </div>
    `;
    
    const mpContent = document.getElementById("multiplayer-content");
    if (!mpContent) {
        console.error("Error: multiplayer-content element not found in DOM");
        return;
    }
    mpContent.innerHTML = pvpHTML;
    
    // Start countdown display
    updatePVPCountdown();
    if (!window.pvpCountdownInterval) {
        window.pvpCountdownInterval = setInterval(updatePVPCountdown, 1000);
    }
    
    // Show multiplayer screen container
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
}

// Helper to calculate attack power for display
function calculateAttackPower() {
    return (player.level * 10) + 
           (player.skills.stealth * 8) + 
           (player.skills.firearms * 12) + 
           (player.skills.intelligence * 6) + 
           (player.skills.power * 2);
}

// Helper to calculate defense power for display
function calculateDefensePower() {
    const territoryCount = countControlledTerritories();
    return (player.level * 10) + 
           (player.reputation * 0.5) + 
           (player.skills.power * 2) + 
           (territoryCount * 15);
}

// Update PVP screen countdown
function updatePVPCountdown() {
    const countdownEl = document.getElementById('income-countdown-pvp');
    const controlledCountEl = document.getElementById('controlled-count-pvp');
    const weeklyIncomeEl = document.getElementById('weekly-income-total-pvp');
    
    if (countdownEl) {
        const remaining = territoryIncomeNextCollection - Date.now();
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            countdownEl.textContent = 'Collecting...';
        }
    }
    
    if (controlledCountEl) {
        controlledCountEl.textContent = countControlledTerritories();
    }
    
    if (weeklyIncomeEl) {
        weeklyIncomeEl.textContent = `$${calculateMultiplayerTerritoryWeeklyIncome().toLocaleString()}`;
    }
}

// ==================== GLOBAL CHAT & ONLINE WORLD ====================

// World Chat - accessible from level 0, auto-connects if needed
function showWorldChat() {
    // If not connected, trigger connection first
    if (!onlineWorldState.isConnected && typeof connectToOnlineWorld === 'function') {
        connectToOnlineWorld();
    }
    showGlobalChat();
}

function showGlobalChat() {
    console.log('showGlobalChat called'); // Debug log
    
    // Hide all screens using game.js function, or fallback
    if (typeof hideAllScreens === 'function') {
        hideAllScreens();
    } else {
        // Fallback: hide common screen elements
        const screens = document.querySelectorAll('.game-screen');
        screens.forEach(screen => screen.style.display = 'none');
        const menu = document.getElementById('menu');
        if (menu) menu.style.display = 'none';
        
        // Hide mobile-specific elements
        const mobileMenu = document.querySelector('.mobile-slide-menu');
        if (mobileMenu) mobileMenu.style.display = 'none';
        const mobileActions = document.querySelector('.mobile-quick-actions');
        if (mobileActions) mobileActions.style.display = 'none';
    }
    
    // Clean up any existing mobile back buttons first
    const existingMobileBackBtns = document.querySelectorAll('button[style*="position: fixed"]');
    existingMobileBackBtns.forEach(btn => {
        if (btn.innerHTML === '← Back') {
            btn.remove();
        }
    });
    
    // Ensure multiplayer screen exists
    let multiplayerScreen = document.getElementById('multiplayer-screen');
    if (!multiplayerScreen) {
        // Create the multiplayer screen if it doesn't exist
        multiplayerScreen = document.createElement('div');
        multiplayerScreen.id = 'multiplayer-screen';
        multiplayerScreen.className = 'game-screen';
        multiplayerScreen.style.display = 'none';
        document.getElementById('game').appendChild(multiplayerScreen);
    }
    
    let chatHTML = `
        <div class="game-screen" style="display: block;">
            <h2 style="color: #c0a062; font-family: 'Georgia', serif; text-shadow: 2px 2px 4px #000;">💬 World Chat</h2>
            <p style="color: #ccc;">Chat with players from around the world.</p>
            
            <!-- Connection Status -->
            <div id="chat-connection-status" style="background: rgba(0, 0, 0, 0.8); padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; border: 1px solid #c0a062;">
                ${getConnectionStatusHTML()}
            </div>
            
            <!-- Chat Area -->
            <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062; margin-bottom: 20px; box-shadow: 0 0 15px rgba(192, 160, 98, 0.2);">
                <div id="global-chat-area" style="height: 400px; overflow-y: auto; background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #555;">
                    ${generateChatHTML()}
                </div>
                
                <!-- Chat Input -->
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="chat-input" placeholder="Speak your mind..." 
                           style="flex: 1; padding: 12px; border: 2px solid #c0a062; border-radius: 8px; background: rgba(0, 0, 0, 0.8); color: #c0a062; font-size: 14px; font-family: 'Georgia', serif;"
                           onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()" 
                            style="padding: 12px 20px; background: linear-gradient(180deg, #c0a062 0%, #8a6e2f 100%); color: #000; border: 1px solid #ffd700; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: 'Georgia', serif; text-transform: uppercase;">
                         Send
                    </button>
                </div>
                
                <!-- Quick Chat Options -->
                <div style="margin-top: 15px;">
                    <h4 style="color: #c0a062; margin-bottom: 10px; font-family: 'Georgia', serif;"> Quick Words</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        <button onclick="sendQuickChat('Respect.')" style="padding: 8px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"> Respect.</button>
                        <button onclick="sendQuickChat('Looking for work.')" style="padding: 8px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-size: 12px; font-family: 'Georgia', serif;"> Looking for work</button>
                        <button onclick="sendQuickChat('Watch your back.')" style="padding: 8px; background: #8b0000; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"> Watch your back</button>
                        <button onclick="sendQuickChat('Good business.')" style="padding: 8px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"> Good business</button>
                        <button onclick="sendQuickChat('Anyone need a lawyer?')" style="padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"> Need a lawyer?</button>
                        <button onclick="sendQuickChat('My regards to the Don.')" style="padding: 8px; background: #1abc9c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"> Regards to the Don</button>
                    </div>
                </div>
            </div>
            
            <!-- Online Players List -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c0a062;">
                <h4 style="color: #c0a062; margin-bottom: 10px; font-family: 'Georgia', serif;"> Made Men Online</h4>
                <div id="chat-player-list" style="max-height: 150px; overflow-y: auto;">
                    ${generateOnlinePlayersHTML()}
                </div>
            </div>
            
            <button onclick="goBackToMainMenu()" style="background: linear-gradient(180deg, #333 0%, #000 100%); color: #c0a062; padding: 15px 30px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold; font-family: 'Georgia', serif; text-transform: uppercase;">
                 Back to Safehouse
            </button>
        </div>
    `;
    
    console.log('Setting chat HTML'); // Debug log
    multiplayerScreen.innerHTML = chatHTML;
    multiplayerScreen.style.display = 'block';
    
    // Show mobile UI elements if on mobile
    if (window.innerWidth <= 768) {
        const mobileActions = document.querySelector('.mobile-quick-actions');
        if (mobileActions) mobileActions.style.display = 'flex';
        
        // Add mobile-specific back button if needed
        const chatContainer = multiplayerScreen.querySelector('div');
        if (chatContainer) {
            const mobileBackBtn = document.createElement('button');
            mobileBackBtn.innerHTML = '← Back';
            mobileBackBtn.style.cssText = 'position: fixed; top: 10px; left: 10px; background: linear-gradient(45deg, #8b0000, #5a0000); color: white; padding: 10px 15px; border: 1px solid #ff0000; border-radius: 5px; cursor: pointer; z-index: 1000; font-family: "Georgia", serif;';
            mobileBackBtn.onclick = goBackToMainMenu;
            document.body.appendChild(mobileBackBtn);
            
            // Remove the button when leaving the screen
            setTimeout(() => {
                const existingBtn = document.querySelector('button[style*="position: fixed"]');
                if (existingBtn && existingBtn.innerHTML === '← Back') {
                    existingBtn.remove();
                }
            }, 100);
        }
    }
    
    console.log('Global chat screen should now be visible'); // Debug log
}

// Generate chat HTML
function generateChatHTML() {
    if (!onlineWorldState.globalChat || onlineWorldState.globalChat.length === 0) {
        return '<p style="color: #95a5a6; text-align: center; padding: 20px;">No messages yet. Be the first to say something!</p>';
    }
    
    return onlineWorldState.globalChat.map(msg => `
        <div style="margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.3); border-radius: 5px; border-left: 3px solid ${msg.color};">
            <strong style="color: ${msg.color};">${escapeHTML(msg.player)}:</strong> ${escapeHTML(msg.message)} 
            <small style="color: #95a5a6; float: right;">${msg.time}</small>
        </div>
    `).join('');
}

// Simple HTML escape to prevent XSS in chat messages and other user-generated content
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return charsToReplace[tag] || tag;
    });
}

// Send chat message
// Ensure player has a valid name for multiplayer
function ensurePlayerName() {
    // If player doesn't have a name, try to get it from localStorage first
    if (!player.name || player.name.trim() === '') {
        // Try to get name from saved game data
        const savedData = localStorage.getItem('gameState');
        
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Check for name in player object (new format)
                if (parsedData.player && parsedData.player.name && parsedData.player.name.trim() !== '') {
                    player.name = parsedData.player.name.trim();
                    console.log('Retrieved player name from saved data:', player.name);
                    return player.name;
                }
                // Fallback to old format for backwards compatibility
                if (parsedData.name && parsedData.name.trim() !== '') {
                    player.name = parsedData.name.trim();
                    console.log('Retrieved player name from saved data (legacy format):', player.name);
                    return player.name;
                }
            } catch (e) {
                console.warn('Could not parse saved game data for name', e);
            }
        }
        
        // Only prompt if we're actually trying to use chat features
        // Don't prompt during automatic connection
        return null; // Return null to indicate name is not available
    }
    return player.name;
}

// Function to ensure player name for chat (prompts if needed)
function ensurePlayerNameForChat() {
    // First try the regular ensurePlayerName
    let name = ensurePlayerName();
    if (name) {
        return name;
    }
    
    // If no name available, prompt the user
    let userName = prompt('Enter your criminal name for multiplayer chat:', 'Criminal_' + Math.floor(Math.random() * 1000));
    if (userName && userName.trim() !== '') {
        player.name = userName.trim();
        // Save the name immediately
        if (typeof saveGame === 'function') {
            saveGame();
        }
        console.log('Player entered new name for chat:', player.name);
        return player.name;
    } else {
        // User cancelled or entered empty name
        return null;
    }
}

function sendChatMessage() {
    // Ensure player has a valid name before sending chat (prompt if needed)
    const playerName = ensurePlayerNameForChat();
    if (!playerName) {
        // User cancelled name entry
        return;
    }
    
    const chatInput = document.getElementById('chat-input');
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = chatInput.value.trim();
    chatInput.value = '';
    
    if (onlineWorldState.isConnected && onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        // Send to server with guaranteed name
        onlineWorldState.socket.send(JSON.stringify({
            type: 'global_chat',
            playerId: onlineWorldState.playerId,
            message: message,
            playerName: playerName,
            timestamp: Date.now()
        }));
    } else {
        // Add locally if not connected
        addChatMessage(playerName, message, '#c0a062');
    }
}

// Send quick chat message
function sendQuickChat(message) {
    // Ensure player has a valid name before sending quick chat (prompt if needed)
    const playerName = ensurePlayerNameForChat();
    if (!playerName) {
        // User cancelled name entry
        return;
    }
    
    if (onlineWorldState.isConnected && onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'global_chat',
            playerId: onlineWorldState.playerId,
            message: message,
            playerName: playerName,
            timestamp: Date.now()
        }));
    } else {
        addChatMessage(player.name || 'You', message, '#c0a062');
    }
}

// Add chat message locally
function addChatMessage(playerName, message, color = '#ecf0f1') {
    const chatMessage = {
        player: playerName,
        message: message,
        time: new Date().toLocaleTimeString(),
        color: color
    };
    
    onlineWorldState.globalChat.push(chatMessage);
    
    // Keep only last 50 messages
    if (onlineWorldState.globalChat.length > 50) {
        onlineWorldState.globalChat = onlineWorldState.globalChat.slice(-50);
    }
    
    // Update chat area if visible
    const chatArea = document.getElementById('global-chat-area');
    if (chatArea) {
        chatArea.innerHTML = generateChatHTML();
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Get connection status HTML for chat
function getConnectionStatusHTML() {
    if (onlineWorldState.isConnected) {
        return `<span style="color: #c0a062; font-family: 'Georgia', serif;">🟢 Connected to World Chat</span>`;
    } else {
        return `<span style="color: #8b0000; font-family: 'Georgia', serif;"> Connecting to World Chat...</span>`;
    }
}

// Generate online players HTML for chat
function generateOnlinePlayersHTML() {
    if (!onlineWorldState.nearbyPlayers || onlineWorldState.nearbyPlayers.length === 0) {
        return '<p style="color: #95a5a6; text-align: center;">Loading players...</p>';
    }
    
    return onlineWorldState.nearbyPlayers.map(player => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; margin: 2px 0; background: rgba(52, 73, 94, 0.3); border-radius: 5px;">
            <span style="color: ${player.color};"> ${player.name}</span>
            <span style="color: #95a5a6; font-size: 12px;">Level ${player.level}</span>
        </div>
    `).join('');
}

// Show online world hub (replaces old multiplayer menu)
function showOnlineWorld() {
    // Sync multiplayer territories to player object
    syncMultiplayerTerritoriesToPlayer();
    
    let worldHTML = `
        <h2 style="color: #c0a062; font-family: 'Georgia', serif; text-shadow: 2px 2px 4px #000;"> The Commission</h2>
        <p style="color: #ccc;">Welcome to the family. Compete and cooperate with other Dons worldwide.</p>
        
        <!-- Territory Income Timer -->
        <div id="territory-income-timer" style="background: rgba(39, 174, 96, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #27ae60; text-align: center;">
            <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;"> Next Territory Income</div>
            <div id="income-countdown" style="color: #ccc; margin-top: 5px; font-family: monospace; font-size: 1.3em;">Calculating...</div>
            <div style="color: #888; font-size: 0.85em; margin-top: 5px;">Controlled Territories: <span id="controlled-count" style="color: #27ae60; font-weight: bold;">0</span> | Weekly Income: <span id="weekly-income-total" style="color: #27ae60; font-weight: bold;">$0</span></div>
        </div>
        
        <!-- Connection Status -->
        <div id="world-connection-status" style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c0a062;">
            <!-- Status content will be updated by updateConnectionStatus() -->
        </div>
        
        <!-- Online Players & Jail Status -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            
            <!-- Online Players List -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
                <div id="online-player-list">
                    <h4 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif;"> Made Men Online</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Loading associates...</div>
                </div>
            </div>
            
            <!-- Players in Jail -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #8b0000;">
                <div id="online-jail-status">
                    <h4 style="color: #8b0000; margin: 0 0 15px 0; font-family: 'Georgia', serif;"> In The Can</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Checking prison records...</div>
                </div>
            </div>
        </div>
        
        <!-- World Overview -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            
            <!-- City Districts -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #f39c12;">
                <h3 style="color: #f39c12; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;"> Turf</h3>
                <div id="city-districts">
                    ${Object.keys(onlineWorldState.cityDistricts).map(district => {
                        const districtData = onlineWorldState.cityDistricts[district];
                        const isPlayerControlled = districtData.controllerType === 'player';
                        const controllerName = isPlayerControlled ? districtData.controlledBy : districtData.npcGang;
                        const borderColor = isPlayerControlled ? '#c0a062' : '#666';
                        
                        return `
                            <div style="background: rgba(20, 20, 20, 0.8); padding: 12px; margin: 8px 0; border-radius: 8px; border: 2px solid ${borderColor};">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="flex: 1;">
                                        <strong style="color: #c0a062; font-size: 1.1em;">${district.charAt(0).toUpperCase() + district.slice(1)}</strong>
                                        <div style="margin: 5px 0; font-size: 0.85em;">
                                            <div style="color: #ccc;">Controlled by: <span style="color: ${isPlayerControlled ? '#27ae60' : '#95a5a6'};">${controllerName || 'Unknown'}</span></div>
                                            <div style="color: #ccc;">Defense: <span style="color: #e74c3c;">${districtData.defenseRating}</span></div>
                                            <div style="color: #ccc;">Income: <span style="color: #27ae60;">$${districtData.weeklyIncome.toLocaleString()}/week</span></div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <button onclick="viewTerritoryDetails('${district}')" 
                                                style="background: #f39c12; color: #000; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 5px; width: 100%;">
                                             Details
                                        </button>
                                        <button onclick="challengeForTerritory('${district}')" 
                                                style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #fff; padding: 8px 12px; border: 1px solid #ff0000; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;">
                                             Attack
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Global Leaderboard -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
                <h3 style="color: #c0a062; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;"> The Bosses</h3>
                <div id="global-leaderboard">
                    <div style="color: #95a5a6; text-align: center; font-style: italic;">
                        Loading rankings...
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Online Activities -->
        <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #c0a062; margin: 20px 0;">
            <h3 style="color: #c0a062; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;"> Family Business</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <button onclick="showGlobalChat()" style="background: #333; color: #c0a062; padding: 15px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     The Wire<br><small style="color: #ccc;">Talk with the family</small>
                </button>
                <button onclick="showWhackRivalDon()" style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ff4444; padding: 15px; border: 1px solid #ff0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                     Whack Rival Don<br><small style="color: #ffaaaa;">HIGH RISK - PERMADEATH</small>
                </button>
                <button onclick="showActiveHeists()" style="background: #333; color: #8b0000; padding: 15px; border: 1px solid #8b0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Big Scores<br><small style="color: #ccc;">Join ongoing jobs</small>
                </button>
                <button onclick="showTradeMarket()" style="background: #333; color: #27ae60; padding: 15px; border: 1px solid #27ae60; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Black Market<br><small style="color: #ccc;">Buy/sell contraband</small>
                </button>
                <button onclick="showGangWars()" style="background: #333; color: #8b0000; padding: 15px; border: 1px solid #8b0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Turf Wars<br><small style="color: #ccc;">Fight for territory</small>
                </button>
                <button onclick="showNearbyPlayers()" style="background: #333; color: #f39c12; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Local Crew<br><small style="color: #ccc;">Players in your area</small>
                </button>
                <button onclick="showCityEvents()" style="background: #333; color: #9b59b6; padding: 15px; border: 1px solid #9b59b6; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Street News<br><small style="color: #ccc;">Special opportunities</small>
                </button>
            </div>
        </div>
        
        <!-- Quick Chat Access -->
        <div style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #c0a062;">
            <h4 style="color: #c0a062; margin: 0 0 10px 0; font-family: 'Georgia', serif;"> Quick Wire</h4>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="quick-chat-input" placeholder="Send a message to the family..." 
                       style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid #c0a062; background: #222; color: #c0a062;"
                       onkeypress="if(event.key==='Enter') sendQuickChatMessage()" maxlength="200">
                <button onclick="sendQuickChatMessage()" style="background: #c0a062; color: #000; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Send
                </button>
            </div>
            <div style="margin-top: 10px; max-height: 120px; overflow-y: auto; background: rgba(20, 20, 20, 0.8); padding: 8px; border-radius: 5px; border: 1px solid #555;">
                <div id="quick-chat-messages">
                    ${onlineWorldState.globalChat.slice(-3).map(msg => `
                        <div style="margin: 4px 0; font-size: 0.9em;">
                            <strong style="color: ${msg.color || '#c0a062'};">${escapeHTML(msg.player)}:</strong> ${escapeHTML(msg.message)}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Recent World Activity -->
        <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 10px; margin-top: 20px; border: 1px solid #555;">
            <h3 style="color: #ccc; font-family: 'Georgia', serif;"> Street Activity</h3>
            <div id="world-activity-feed" style="height: 200px; overflow-y: auto; background: rgba(20, 20, 20, 0.8); padding: 10px; border-radius: 5px;">
                <div style="color: #95a5a6; font-style: italic;">Loading street news...</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <button onclick="goBackToMainMenu()" 
                    style="background: linear-gradient(180deg, #333 0%, #000 100%); color: #c0a062; padding: 18px 35px; 
                           border: 1px solid #c0a062; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif; text-transform: uppercase;">
                 Back to Safehouse
            </button>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = worldHTML;
    hideAllScreens();
    document.getElementById("multiplayer-screen").style.display = "block";
    
    // Update dynamic content
    updateConnectionStatus();
    loadGlobalLeaderboard();
    loadWorldActivityFeed();
    updateJailVisibility();
    updateOnlinePlayerList();
    
    // Request updated world state from server
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'request_world_state'
        }));
    }
}

// ==================== ONLINE WORLD FUNCTIONS ====================

// Update connection status display
function updateConnectionStatus() {
    const statusElement = document.getElementById("world-connection-status");
    if (!statusElement) return;
    
    let statusHTML = '';
    
    switch(onlineWorldState.connectionStatus) {
        case 'connecting':
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #f39c12;"> Connecting to Online World...</h4>
                    <p>Establishing connection to ${onlineWorldState.serverInfo.serverName}</p>
                </div>
            `;
            break;
            
        case 'connected':
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #c0a062; font-family: 'Georgia', serif;"> Connected to The Commission</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                        <div><strong>Server:</strong> ${onlineWorldState.serverInfo.serverName}</div>
                        <div><strong>Players Online:</strong> ${onlineWorldState.serverInfo.playerCount}</div>
                        <div><strong>Your ID:</strong> ${onlineWorldState.playerId}</div>
                        <div><strong>Status:</strong> <span style="color: #2ecc71;">🟢 Live</span></div>
                    </div>
                </div>
            `;
            break;
            
        case 'demo':
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #f39c12;"> Demo Mode (Server Offline)</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                        <div><strong>Mode:</strong> Offline Demo</div>
                        <div><strong>Simulated Players:</strong> ${onlineWorldState.serverInfo.playerCount}</div>
                        <div><strong>Your ID:</strong> ${onlineWorldState.playerId}</div>
                        <div><strong>Status:</strong> <span style="color: #f39c12;">🟡 Demo</span></div>
                    </div>
                    <p style="margin-top: 10px; color: #95a5a6; font-size: 0.9em;">
                        Server unavailable - running in demo mode with simulated players
                    </p>
                </div>
            `;
            break;
            
        case 'error':
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #e74c3c;"> Connection Error</h4>
                    <p>Unable to connect to online world. Retrying automatically...</p>
                    <p style="margin-top: 10px; color: #95a5a6; font-size: 0.9em;">
                        The game will continue trying to connect in the background
                    </p>
                </div>
            `;
            break;
            
        default:
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #f39c12;"> Connecting to Online World...</h4>
                    <p>Establishing connection automatically...</p>
                    <p style="margin-top: 10px; color: #95a5a6; font-size: 0.9em;">
                        Please wait while we connect you to the global network
                    </p>
                </div>
            `;
    }
    
    statusElement.innerHTML = statusHTML;
}

// Initialize world data after connection
function initializeWorldData() {
    // Simulate loading world data
    onlineWorldState.nearbyPlayers = generateNearbyPlayers();
    onlineWorldState.globalChat = generateGlobalChatHistory();
    onlineWorldState.serverInfo.cityEvents = generateCityEvents();
    onlineWorldState.activeHeists = generateActiveHeists();
    
    onlineWorldState.lastUpdate = new Date().toLocaleTimeString();
}

// Start periodic world updates
function startWorldUpdates() {
    setInterval(() => {
        if (onlineWorldState.isConnected) {
            updateWorldState();
        }
    }, onlineWorld.updateInterval);
}

// Update world state
function updateWorldState() {
    // Simulate receiving world updates
    onlineWorldState.serverInfo.playerCount = Math.max(30, onlineWorldState.serverInfo.playerCount + (Math.random() > 0.5 ? 1 : -1));
    onlineWorldState.lastUpdate = new Date().toLocaleTimeString();
    
    // Update displays if visible
    updateConnectionStatus();
    
    // Occasionally add new world events
    if (Math.random() < 0.1) {
        addWorldEvent(generateRandomWorldEvent());
    }
}

// Show welcome message when connected
function showWelcomeMessage() {
    const messages = [
        "Welcome to the criminal underworld! The city awaits your influence.",
        "Other players are active. Watch your back and seize opportunities.",
        "Territory wars are brewing. Choose your alliances wisely.",
        "The market is volatile. Check trade opportunities with other players.",
        "A new criminal empire rises. Will it be yours?"
    ];
    
    const welcomeMsg = messages[Math.floor(Math.random() * messages.length)];
    
    setTimeout(() => {
        alert(` ${welcomeMsg}`);
    }, 1000);
}

// Simulate online connection
function simulateOnlineConnection() {
    // In real implementation, this would create actual WebSocket connection
    onlineWorldState.socket = {
        send: (data) => console.log('Sending to server:', data),
        close: () => console.log('Connection closed'),
        readyState: 1 // OPEN
    };
}

// Generate player ID
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// District exploration
function exploreDistrict(districtName) {
    const district = onlineWorldState.cityDistricts[districtName];
    
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world to explore districts!");
        return;
    }
    
    let districtHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;"> ${districtName.charAt(0).toUpperCase() + districtName.slice(1)} District</h3>
            
            <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #555;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong style="color: #c0a062;">Crime Level:</strong> <span style="color: #ccc;">${district.crimeLevel}%</span></div>
                    <div><strong style="color: #c0a062;">Controlled By:</strong> <span style="color: #ccc;">${district.controlledBy || 'No one'}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0;">
                <button onclick="doDistrictJob('${districtName}')" style="background: #333; color: #c0a062; padding: 10px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Find Work
                </button>
                <button onclick="claimTerritory('${districtName}')" style="background: #333; color: #8b0000; padding: 10px; border: 1px solid #8b0000; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Claim Turf
                </button>
                <button onclick="findPlayersInDistrict('${districtName}')" style="background: #333; color: #f39c12; padding: 10px; border: 1px solid #f39c12; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Find Crew
                </button>
                <button onclick="startDistrictHeist('${districtName}')" style="background: #333; color: #27ae60; padding: 10px; border: 1px solid #27ae60; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Plan Score
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 10px 20px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back to The Commission
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = districtHTML;
    
    logAction(` Exploring ${districtName} district...`);
}

// Load global leaderboard
function loadGlobalLeaderboard() {
    const leaderboardElement = document.getElementById('global-leaderboard');
    if (!leaderboardElement) return;
    
    // Simulate leaderboard data
    const leaderboard = [
        { rank: 1, name: 'DonVitoCorp', money: 2500000, reputation: 150 },
        { rank: 2, name: 'ScarfaceKing', money: 1800000, reputation: 142 },
        { rank: 3, name: 'MafiaQueen', money: 1650000, reputation: 138 },
        { rank: 4, name: player.name || 'You', money: player.money, reputation: player.reputation },
        { rank: 5, name: 'CrimeLord88', money: 1200000, reputation: 125 }
    ];
    
    leaderboardElement.innerHTML = leaderboard.map(entry => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: rgba(0, 0, 0, 0.3); border-radius: 5px; ${entry.name === (player.name || 'You') ? 'border: 2px solid #2ecc71;' : ''}">
            <div>
                <span style="color: ${entry.rank <= 3 ? '#f39c12' : '#ecf0f1'};">#${entry.rank}</span>
                <strong style="margin-left: 10px; color: ${entry.name === (player.name || 'You') ? '#2ecc71' : '#ecf0f1'};">${entry.name}</strong>
            </div>
            <div style="text-align: right; font-size: 0.9em;">
                <div>$${entry.money.toLocaleString()}</div>
                <div style="color: #95a5a6;">${entry.reputation} rep</div>
            </div>
        </div>
    `).join('');
}

// Generate world data
function generateNearbyPlayers() {
    const playerNames = ['CrimeBoss42', 'ShadowDealer', 'StreetKing', 'DarkVendor', 'NightCrawler', 'UrbanLegend'];
    return playerNames.slice(0, 3 + Math.floor(Math.random() * 3)).map((name, index) => ({
        id: `nearby_${index}`,
        name: name,
        level: 5 + Math.floor(Math.random() * 20),
        reputation: Math.floor(Math.random() * 100),
        territory: Math.floor(Math.random() * 5),
        isOnline: true,
        lastSeen: 'Now'
    }));
}

function generateGlobalChatHistory() {
    const messages = [
        { player: 'CrimeBoss42', message: 'Anyone want to team up for a heist?', time: '2 min ago', color: '#3498db' },
        { player: 'ShadowDealer', message: 'Trading high-end weapons, good prices!', time: '5 min ago', color: '#e74c3c' },
        { player: 'StreetKing', message: 'Just took over downtown district ', time: '8 min ago', color: '#2ecc71' },
        { player: 'System', message: 'City Event: Police raid in industrial district!', time: '10 min ago', color: '#f39c12' }
    ];
    return messages;
}

function generateCityEvents() {
    const events = [
        { type: 'police_raid', district: 'industrial', description: 'Heavy police presence, high risk/reward jobs available', timeLeft: '15 min' },
        { type: 'market_crash', district: 'downtown', description: 'Economic instability, weapon prices fluctuating', timeLeft: '1 hour' },
        { type: 'gang_meeting', district: 'docks', description: 'Underground meeting, recruitment opportunities', timeLeft: '30 min' }
    ];
    return events;
}

function generateActiveHeists() {
    return [
        { id: 'heist_1', target: 'First National Bank', organizer: 'CrimeBoss42', participants: 2, maxParticipants: 4, difficulty: 'Hard', reward: 150000 },
        { id: 'heist_2', target: 'Diamond Jewelry Store', organizer: 'ShadowDealer', participants: 1, maxParticipants: 3, difficulty: 'Medium', reward: 75000 }
    ];
}

function generateRandomWorldEvent() {
    const events = [
        ` Police raid in ${Object.keys(onlineWorldState.cityDistricts)[Math.floor(Math.random() * 5)]} district!`,
        ` ${onlineWorldState.nearbyPlayers[Math.floor(Math.random() * onlineWorldState.nearbyPlayers.length)]?.name || 'A player'} completed a major heist!`,
        ` Territory war brewing between rival gangs!`,
        ` Weapon prices surge in black market!`,
        ` New high-value target spotted in the city!`
    ];
    return events[Math.floor(Math.random() * events.length)];
}

// World activity functions
function loadWorldActivityFeed() {
    const feedElement = document.getElementById('world-activity-feed');
    if (!feedElement) return;
    
    const activities = [
        ' CrimeBoss42 claimed territory in downtown district',
        ' ShadowDealer completed a $50,000 heist',
        ' Gang war started between Serpents and Wolves',
        ' StreetKing sold rare weapons in trade market',
        ' Police raid ended in industrial district',
        ' 15 players currently in global chat',
        ' 67 players online worldwide'
    ];
    
    feedElement.innerHTML = activities.map((activity, index) => `
        <div style="margin: 5px 0; padding: 8px; background: rgba(52, 73, 94, 0.3); border-radius: 5px;">
            ${activity}
            <small style="color: #95a5a6; float: right;">${Math.floor(Math.random() * 30) + 1} min ago</small>
        </div>
    `).join('');
}

function addWorldEvent(event) {
    const feedElement = document.getElementById('world-activity-feed');
    if (feedElement) {
        const newEvent = document.createElement('div');
        newEvent.style.cssText = 'margin: 5px 0; padding: 8px; background: rgba(46, 204, 113, 0.3); border-radius: 5px;';
        // Escape any content added to the activity feed to prevent script injection
        newEvent.innerHTML = `${escapeHTML(event)} <small style="color: #95a5a6; float: right;">Just now</small>`;
        feedElement.insertBefore(newEvent, feedElement.firstChild);
        
        // Keep only last 10 events
        while (feedElement.children.length > 10) {
            feedElement.removeChild(feedElement.lastChild);
        }
    }
}

// Chat functions
function sendGlobalChatMessage() {
    const chatInput = document.getElementById('global-chat-input');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world to chat!");
        return;
    }
    
    // Send message to server
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'global_chat',
            message: message,
            playerId: onlineWorldState.playerId,
            playerName: player.name || 'You',
            timestamp: Date.now()
        }));
    }
    
    chatInput.value = '';
    
    logAction(` Sent message to global chat: "${message}"`);
}

// Quick chat function for main online world screen
function sendQuickChatMessage() {
    const quickChatInput = document.getElementById('quick-chat-input');
    const message = quickChatInput.value.trim();
    
    if (!message) return;
    
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world to chat!");
        return;
    }
    
    // Send message to server
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'global_chat',
            message: message,
            playerId: onlineWorldState.playerId,
            playerName: player.name || 'You',
            timestamp: Date.now()
        }));
    }
    
    quickChatInput.value = '';
    
    logAction(` Sent message to global chat: "${message}"`);
}

// Update quick chat display when new messages arrive
function updateQuickChatDisplay() {
    const quickChatMessages = document.getElementById('quick-chat-messages');
    if (quickChatMessages) {
        const recentMessages = onlineWorldState.globalChat.slice(-3);
        quickChatMessages.innerHTML = recentMessages.map(msg => `
            <div style="margin: 4px 0; font-size: 0.9em;">
                <strong style="color: ${msg.color || '#c0a062'};">${escapeHTML(msg.player)}:</strong> ${escapeHTML(msg.message)}
            </div>
        `).join('');
    }
}

function simulateGlobalChatResponse() {
    const responses = [
        { player: 'CrimeBoss42', message: 'Nice move!', color: '#3498db' },
        { player: 'ShadowDealer', message: 'Anyone want to trade?', color: '#e74c3c' },
        { player: 'StreetKing', message: 'The docks are heating up', color: '#f39c12' }
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    response.time = 'Just now';
    
    onlineWorldState.globalChat.push(response);
    
    const chatArea = document.getElementById('global-chat-area');
    if (chatArea) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.3); border-radius: 5px;';
        messageDiv.innerHTML = `<strong style="color: ${response.color};">${escapeHTML(response.player)}:</strong> ${escapeHTML(response.message)} <small style="color: #95a5a6; float: right;">${response.time}</small>`;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// District actions
function doDistrictJob(districtName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    const district = onlineWorldState.cityDistricts[districtName];
    const riskMultiplier = district.crimeLevel / 100;
    
    alert(` Looking for jobs in ${districtName}... Crime level affects difficulty and rewards.`);
    
    // Integrate with existing job system but with online world context
    showJobs();
    
    logAction(` Searching for jobs in ${districtName} district (Crime Level: ${district.crimeLevel}%)`);
}

function claimTerritory(districtName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    const district = onlineWorldState.cityDistricts[districtName];
    const cost = 50000 + (district.crimeLevel * 1000);
    
    if (player.money < cost) {
        alert(`Not enough money! Need $${cost.toLocaleString()} to claim ${districtName}.`);
        return;
    }
    
    if (confirm(`Claim ${districtName} district for $${cost.toLocaleString()}? This will be visible to all players.`)) {
        // SERVER-AUTHORITATIVE INTENT: Do NOT mutate local money/territory.
        // Send territory_claim intent; server will validate cost, apply changes, then broadcast territory_taken.
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'territory_claim',
                district: districtName
            }));
            logAction(` Territory claim intent sent for ${districtName} ($${cost.toLocaleString()}). Awaiting authoritative confirmation...`);
        } else {
            alert('Connection lost before sending claim intent.');
        }
    }
}

function findPlayersInDistrict(districtName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    const playersInDistrict = onlineWorldState.nearbyPlayers.filter(() => Math.random() > 0.5);
    
    if (playersInDistrict.length === 0) {
        alert(`No other players currently in ${districtName} district.`);
        return;
    }
    
    let playersHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;"> Crew in ${districtName.charAt(0).toUpperCase() + districtName.slice(1)}</h3>
            <div style="margin: 20px 0;">
                ${playersInDistrict.map(p => `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #555;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #c0a062; margin: 0; font-family: 'Georgia', serif;">${p.name}</h4>
                                <div style="display: flex; gap: 20px; font-size: 0.9em; margin: 5px 0; color: #ccc;">
                                    <span>Level ${p.level}</span>
                                    <span>Rep: ${p.reputation}</span>
                                    <span>Territory: ${p.territory}</span>
                                    <span style="color: #27ae60;">● Online</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="challengePlayer('${p.name}')" style="background: #8b0000; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                     Challenge
                                </button>
                                <button onclick="tradeWithPlayer('${p.name}')" style="background: #27ae60; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                     Trade
                                </button>
                                <button onclick="inviteToHeist('${p.name}')" style="background: #f39c12; color: #000; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                     Invite
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = playersHTML;
}

// Show city events
function showCityEvents() {
    let eventsHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #9b59b6; font-family: 'Georgia', serif;"> Street News</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.serverInfo.cityEvents.map(event => `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #555;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #c0a062; margin: 0; font-family: 'Georgia', serif;">${event.type.replace('_', ' ').toUpperCase()}</h4>
                                <p style="margin: 5px 0; color: #ccc;">${event.description}</p>
                                <small style="color: #999;">District: ${event.district.charAt(0).toUpperCase() + event.district.slice(1)}</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #f39c12; font-weight: bold;"> ${event.timeLeft}</div>
                                <button onclick="participateInEvent('${event.type}', '${event.district}')" style="background: #9b59b6; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-family: 'Georgia', serif;">
                                     Get Involved
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = eventsHTML;
}

// Player interaction functions
function challengePlayer(playerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    const confirmChallenge = confirm(`Challenge ${playerName} to combat? This will cost energy and the winner gains reputation.`);
    
    if (confirmChallenge) {
        // Send challenge to server for authoritative resolution
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'player_challenge',
                targetPlayer: playerName,
                playerName: player.name,
                level: player.level,
                reputation: player.reputation
            }));
            logAction(` Challenged ${playerName} to combat! Awaiting outcome...`);
        } else {
            alert('Connection lost. Reconnecting...');
            connectToOnlineWorld();
        }
    }
}

function tradeWithPlayer(playerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    alert(` Trade request sent to ${playerName}! (In a real implementation, this would open direct trade negotiations)`);
    logAction(` Sent trade request to ${playerName}`);
}

function inviteToHeist(playerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    alert(` Heist invitation sent to ${playerName}! They can join your next heist.`);
    logAction(` Invited ${playerName} to join heist`);
}

// ==================== UTILITY FUNCTIONS ====================

// Setup online world UI
function setupOnlineWorldUI() {
    // Create multiplayer screen if it doesn't exist (reusing existing structure)
    if (!document.getElementById("multiplayer-screen")) {
        const multiplayerScreen = document.createElement('div');
        multiplayerScreen.id = "multiplayer-screen";
        multiplayerScreen.className = "game-screen";
        multiplayerScreen.style.display = "none";
        
        const multiplayerContent = document.createElement('div');
        multiplayerContent.id = "multiplayer-content";
        
        multiplayerScreen.appendChild(multiplayerContent);
        document.getElementById("game").appendChild(multiplayerScreen);
    }
}

// Removed addOnlineWorldButton function - Global Chat button is now in HTML main menu

// Log online world actions
function logOnlineWorldAction(message) {
    if (typeof logAction === 'function') {
        logAction(`[ONLINE WORLD] ${message}`);
    } else {
        console.log(`[ONLINE WORLD] ${message}`);
    }
}

// Save online world settings
function saveOnlineWorldData() {
    if (typeof(Storage) !== "undefined") {
        const data = {
            playerId: onlineWorldState.playerId,
            lastConnected: new Date().toISOString(),
            // Don't save sensitive data like socket connections
        };
        localStorage.setItem('onlineWorldData', JSON.stringify(data));
    }
}

// Placeholder functions for missing interactions
function joinHeist(heistId) {
    const heist = onlineWorldState.activeHeists.find(h => h.id === heistId);
    if (heist && heist.participants < heist.maxParticipants) {
        heist.participants++;
        alert(` Joined ${heist.target}! Get ready for action.`);
        logAction(` Joined heist: ${heist.target}`);
        showActiveHeists(); // Refresh the display
    }
}

function manageHeist(heistId) {
    alert(" Heist management panel would open here (start heist, kick players, etc.)");
}

function buyFromPlayer(item, price) {
    if (player.money >= price) {
        player.money -= price;
        alert(` Purchased ${item} for $${price.toLocaleString()}!`);
        logAction(` Bought ${item} from player for $${price.toLocaleString()}`);
    } else {
        alert(" Not enough money!");
    }
}

function listItemForSale() {
    alert(" Item listing interface would open here (select item, set price, etc.)");
}

function spectateWar(district) {
    if (!district) return;
    // Create or reuse modal container
    let modal = document.getElementById('turf-war-spectator');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'turf-war-spectator';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '9999';
        modal.style.width = '600px';
        modal.style.maxWidth = '95%';
        modal.style.background = 'rgba(0,0,0,0.92)';
        modal.style.border = '2px solid #8b0000';
        modal.style.borderRadius = '12px';
        modal.style.fontFamily = 'Georgia, serif';
        modal.style.color = '#ecf0f1';
        modal.style.boxShadow = '0 0 25px rgba(139,0,0,0.7)';
        document.body.appendChild(modal);
    }
    modal.innerHTML = '';

    const attackerStrengthStart = 60 + Math.floor(Math.random()*40);
    const defenderStrengthStart = 55 + Math.floor(Math.random()*45);
    let attackerStrength = attackerStrengthStart;
    let defenderStrength = defenderStrengthStart;
    let tick = 0;
    const maxTicks = 12 + Math.floor(Math.random()*5); // variable length

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = `
        <h3 style="margin:0; color:#ff4444; text-shadow:2px 2px 6px #8b0000;"> Turf War: ${district}</h3>
        <button style="background:#333; color:#c0a062; padding:6px 12px; border:1px solid #c0a062; border-radius:6px; cursor:pointer;" onclick="document.getElementById('turf-war-spectator').remove();"> Close</button>
    `;
    modal.appendChild(header);

    const barsContainer = document.createElement('div');
    barsContainer.style.margin = '15px 0 10px 0';
    barsContainer.innerHTML = `
        <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85em; margin-bottom:3px;">
                <span style="color:#c0a062;">Attacker Strength</span>
                <span id="attacker-strength-val">${attackerStrength}</span>
            </div>
            <div style="background:#222; height:16px; border:1px solid #444; border-radius:8px; overflow:hidden;">
                <div id="attacker-bar" style="height:100%; width:${(attackerStrength/attackerStrengthStart)*100}%; background:linear-gradient(90deg,#8b0000,#ff4444);"></div>
            </div>
        </div>
        <div>
            <div style="display:flex; justify-content:space-between; font-size:0.85em; margin-bottom:3px;">
                <span style="color:#c0a062;">Defender Strength</span>
                <span id="defender-strength-val">${defenderStrength}</span>
            </div>
            <div style="background:#222; height:16px; border:1px solid #444; border-radius:8px; overflow:hidden;">
                <div id="defender-bar" style="height:100%; width:${(defenderStrength/defenderStrengthStart)*100}%; background:linear-gradient(90deg,#004d40,#00a884);"></div>
            </div>
        </div>
    `;
    modal.appendChild(barsContainer);

    const logArea = document.createElement('div');
    logArea.style.height = '180px';
    logArea.style.overflowY = 'auto';
    logArea.style.background = 'rgba(255,255,255,0.06)';
    logArea.style.padding = '10px';
    logArea.style.border = '1px solid #444';
    logArea.style.borderRadius = '6px';
    logArea.style.fontSize = '0.85em';
    logArea.id = 'war-event-log';
    modal.appendChild(logArea);

    const footer = document.createElement('div');
    footer.style.marginTop = '12px';
    footer.style.fontSize = '0.8em';
    footer.style.color = '#95a5a6';
    footer.innerHTML = 'Live engagement feed: dynamic swings, losses, morale shifts.';
    modal.appendChild(footer);

    function log(msg) {
        const line = document.createElement('div');
        line.textContent = msg;
        logArea.appendChild(line);
        logArea.scrollTop = logArea.scrollHeight;
    }

    log(` You begin watching the clash for ${district}...`);

    const attackerBar = () => document.getElementById('attacker-bar');
    const defenderBar = () => document.getElementById('defender-bar');
    const attackerVal = () => document.getElementById('attacker-strength-val');
    const defenderVal = () => document.getElementById('defender-strength-val');

    const interval = setInterval(() => {
        tick++;

        // Random exchanges
        const attackerHit = Math.random() < 0.55; // attacker slightly aggressive
        const defenderHit = Math.random() < 0.5;

        if (attackerHit) {
            const dmg = 3 + Math.floor(Math.random()*6);
            defenderStrength = Math.max(0, defenderStrength - dmg);
            log(` Attacker pushes forward (-${dmg} defender strength)`);
        }
        if (defenderHit) {
            const dmg = 2 + Math.floor(Math.random()*6);
            attackerStrength = Math.max(0, attackerStrength - dmg);
            log(` Counter-fire from defenders (-${dmg} attacker strength)`);
        }

        // Momentum swings
        if (Math.random() < 0.15) {
            const swingTarget = Math.random() < 0.5 ? 'attacker' : 'defender';
            const swing = 4 + Math.floor(Math.random()*5);
            if (swingTarget === 'attacker') {
                attackerStrength += swing;
                log(` Sudden reinforcements bolster attackers (+${swing})`);
            } else {
                defenderStrength += swing;
                log(` Hidden reserves fortify defenders (+${swing})`);
            }
        }

        // Update bars
        attackerBar().style.width = `${(attackerStrength/attackerStrengthStart)*100}%`;
        defenderBar().style.width = `${(defenderStrength/defenderStrengthStart)*100}%`;
        attackerVal().textContent = attackerStrength;
        defenderVal().textContent = defenderStrength;

        // Check end conditions
        if (attackerStrength <= 0 || defenderStrength <= 0 || tick >= maxTicks) {
            clearInterval(interval);
            let outcome;
            if (attackerStrength === defenderStrength) {
                outcome = 'Stalemate — both sides withdraw';
            } else if (attackerStrength > defenderStrength) {
                outcome = 'Attackers overwhelm defenders — territory likely to flip';
                addWorldEvent?.(` Attackers appear victorious in ${district}!`);
            } else {
                outcome = 'Defenders hold firm — control remains';
                addWorldEvent?.(` Defenders repel assault in ${district}.`);
            }
            log(` Battle concludes: ${outcome}`);
            log(` Final Strength — A:${attackerStrength} D:${defenderStrength}`);
            setTimeout(() => { footer.innerHTML = outcome; }, 500);
            logAction?.(` Spectated turf war in ${district} (${outcome})`);
        }
    }, 1000);
}

// Removed placeholder challengeForTerritory(district); full implementation defined later.

function participateInEvent(eventType, district) {
    alert(` Participating in ${eventType.replace('_', ' ')} event in ${district}...`);
    logAction(` Joined city event: ${eventType} in ${district}`);
}
