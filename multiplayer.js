// ==================== THE COMMISSION SYSTEM ====================

// Online world configuration
const onlineWorld = {
    maxPlayersPerServer: 100,
    serverUrl: 'wss://c8da9398376a.ngrok-free.app', // Updated ngrok tunnel for online testing
    productionServerUrl: 'wss://your-server-domain.com', // Replace with your deployed server URL
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
};

// Online world state
let onlineWorldState = {
    isConnected: false,
    connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
    socket: null,
    playerId: null,
    serverInfo: {
        playerCount: 0,
        serverName: 'From Dusk to Don - The Commission',
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
        logAction("🌐 Connecting to online world...");
        
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
            
            logAction(`🌐 Connected to online world! Player ID: ${onlineWorldState.playerId}`);
            showWelcomeMessage();
        };
        
        onlineWorldState.socket.onmessage = function(event) {
            handleServerMessage(JSON.parse(event.data));
        };
        
        onlineWorldState.socket.onclose = function(event) {
            onlineWorldState.isConnected = false;
            onlineWorldState.connectionStatus = 'disconnected';
            updateConnectionStatus();
            logAction("🌐 Disconnected from online world");
            
            // Attempt to reconnect
            setTimeout(() => {
                connectToOnlineWorld();
            }, onlineWorld.reconnectInterval);
        };
        
        onlineWorldState.socket.onerror = function(error) {
            onlineWorldState.connectionStatus = 'error';
            updateConnectionStatus();
            logAction("❌ Failed to connect to online world. Retrying...");
            
            // Fallback to local demo mode
            setTimeout(() => {
                connectToLocalDemo();
            }, 3000);
        };
        
    } catch (error) {
        onlineWorldState.connectionStatus = 'error';
        updateConnectionStatus();
        logAction("❌ Failed to connect to online world. Retrying...");
        
        setTimeout(() => {
            connectToLocalDemo();
        }, onlineWorld.reconnectInterval);
    }
}

// Fallback to local demo mode when server is unavailable
function connectToLocalDemo() {
    logAction("🔧 Starting in offline demo mode...");
    
    setTimeout(() => {
        onlineWorldState.isConnected = false; // Keep as demo mode
        onlineWorldState.connectionStatus = 'demo';
        onlineWorldState.playerId = generatePlayerId();
        onlineWorldState.serverInfo.playerCount = 47 + Math.floor(Math.random() * 30);
        
        updateConnectionStatus();
        initializeWorldData();
        startWorldUpdates();
        
        logAction(`🔧 Demo mode active - ${onlineWorldState.serverInfo.playerCount} simulated players`);
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
            const jailbreakMsg = `🚨 ${message.playerName} ${message.success ? 'successfully broke out of jail!' : 'failed a jailbreak attempt!'}`;
            addWorldEvent(jailbreakMsg);
            
            if (document.getElementById('global-chat-area')) {
                showSystemMessage(jailbreakMsg, message.success ? '#c0a062' : '#8b0000');
            }
            break;
            
        case 'player_arrested':
            // Notify when another player gets arrested
            const arrestMsg = `🚔 ${message.playerName} was arrested and sent to jail!`;
            addWorldEvent(arrestMsg);
            
            if (document.getElementById('global-chat-area')) {
                showSystemMessage(arrestMsg, '#8b0000');
            }
            break;
            
        case 'territory_taken':
            onlineWorldState.cityDistricts[message.district].controlledBy = message.playerName;
            addWorldEvent(`🏛️ ${message.playerName} claimed ${message.district} district!`);
            break;
            
        case 'heist_broadcast':
            onlineWorldState.activeHeists.push(message.heist);
            addWorldEvent(`💰 ${message.playerName} is organizing a heist!`);
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
    
    let jailHTML = '<h4 style="color: #8b0000; margin: 0 0 15px 0; font-family: \'Georgia\', serif;">🔒 Made Men In The Can</h4>';
    
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
                                    🔓 Break Out
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
    
    let playersHTML = '<h4 style="color: #c0a062; margin: 0 0 15px 0; font-family: \'Georgia\', serif;">👥 Made Men Online</h4>';
    
    const onlinePlayers = Object.values(onlineWorldState.playerStates || {});
    
    if (onlinePlayers.length === 0) {
        playersHTML += '<div style="color: #95a5a6; font-style: italic; text-align: center;">Loading player list...</div>';
    } else {
        onlinePlayers.forEach(player => {
            const statusIcon = player.inJail ? '🔒' : '🟢';
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
        player.energy -= 15;
        
        // Send jailbreak attempt to server
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'jailbreak_attempt',
                targetPlayerId: targetPlayerId,
                targetPlayerName: targetPlayerName,
                helperPlayerId: onlineWorldState.playerId,
                helperPlayerName: player.name || 'You'
            }));
        }
        
        // Simulate jailbreak result locally
        const successChance = 25 + (player.skills?.stealth || 0) * 3; // Base 25% + stealth bonus
        const success = Math.random() * 100 < successChance;
        
        if (success) {
            player.reputation += 5;
            alert(`🎉 Success! You helped ${targetPlayerName} escape from jail! (+5 reputation)`);
            logAction(`🔓 Successfully helped ${targetPlayerName} break out of jail (+5 reputation)`);
        } else {
            const arrestChance = 30; // 30% chance of getting arrested
            if (Math.random() * 100 < arrestChance) {
                // Player gets arrested for failed jailbreak attempt
                sendToJail(2);
                alert(`💀 Jailbreak failed and you were caught! You've been arrested.`);
                logAction(`🚔 Failed jailbreak attempt - arrested while trying to help ${targetPlayerName}`);
            } else {
                alert(`💀 Jailbreak failed, but you managed to escape undetected.`);
                logAction(`⚠️ Failed to break ${targetPlayerName} out of jail, but avoided capture`);
            }
        }
        
        updateUI();
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
                <h1 style="color: #8b0000; font-family: 'Georgia', serif; font-size: 2.5em; text-shadow: 2px 2px 8px #000; margin: 0;">⚔️ PVP ARENA</h1>
                <p style="color: #ff6666; margin: 10px 0 0 0; font-size: 1.1em; font-style: italic;">Prove your worth. Crush your rivals. Take what's theirs.</p>
            </div>
            
            <!-- Territory Income Timer -->
            <div id="territory-income-timer-pvp" style="background: rgba(39, 174, 96, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #27ae60; text-align: center;">
                <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;">💰 Next Territory Income</div>
                <div id="income-countdown-pvp" style="color: #ccc; margin-top: 5px; font-family: monospace; font-size: 1.3em;">Calculating...</div>
                <div style="color: #888; font-size: 0.85em; margin-top: 5px;">Controlled Territories: <span id="controlled-count-pvp" style="color: #27ae60; font-weight: bold;">0</span> | Weekly Income: <span id="weekly-income-total-pvp" style="color: #27ae60; font-weight: bold;">$0</span></div>
            </div>
            
            <!-- PVP Actions Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 30px 0;">
                
                <!-- Whack Rival Don -->
                <div style="background: linear-gradient(180deg, rgba(139, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%); padding: 25px; border-radius: 15px; border: 2px solid #8b0000; cursor: pointer; transition: transform 0.2s;" onclick="showWhackRivalDon()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="font-size: 4em; margin-bottom: 15px;">💀</div>
                        <h3 style="color: #ff4444; margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 1.5em;">Whack Rival Don</h3>
                        <p style="color: #ffaaaa; margin: 0 0 15px 0; font-size: 0.95em;">High-risk assassination with permadeath</p>
                        <div style="background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 8px; margin-top: 15px;">
                            <div style="color: #ccc; font-size: 0.85em; line-height: 1.6;">
                                ✓ Narrative 5-stage combat<br>
                                ✓ Steal 10-50% money + cars<br>
                                ✓ Target permanently removed<br>
                                ⚠️ Risk: 20-60% health damage
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Territory Conquest -->
                <div style="background: linear-gradient(180deg, rgba(243, 156, 18, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%); padding: 25px; border-radius: 15px; border: 2px solid #f39c12; cursor: pointer; transition: transform 0.2s;" onclick="showOnlineWorld()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="font-size: 4em; margin-bottom: 15px;">🏛️</div>
                        <h3 style="color: #f39c12; margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 1.5em;">Territory Conquest</h3>
                        <p style="color: #f9ca7e; margin: 0 0 15px 0; font-size: 0.95em;">Conquer districts for weekly income</p>
                        <div style="background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 8px; margin-top: 15px;">
                            <div style="color: #ccc; font-size: 0.85em; line-height: 1.6;">
                                ✓ Assign gang/cars/weapons<br>
                                ✓ Weekly dirty money income<br>
                                ✓ Battle NPC or player gangs<br>
                                ⚠️ Risk: Lose assigned resources
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <!-- PVP Stats Overview -->
            <div style="background: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif; text-align: center;">📊 Your PVP Stats</h3>
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
                <h4 style="color: #ff6666; margin: 0 0 10px 0;">⚠️ PVP WARNING</h4>
                <p style="color: #ccc; margin: 0; font-size: 0.95em; line-height: 1.6;">
                    PVP actions carry real consequences. Assassination attempts can result in permanent character death (permadeath). 
                    Territory battles may result in the loss of gang members, vehicles, and weapons. Only engage if you're prepared to lose what you stake.
                </p>
            </div>
            
            <!-- Navigation -->
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="showOnlineWorld()" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 10px;">
                    🌐 The Commission
                </button>
                <button onclick="goBackToMainMenu()" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    🏠 Main Menu
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = pvpHTML;
    
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
            <h2 style="color: #c0a062; font-family: 'Georgia', serif; text-shadow: 2px 2px 4px #000;">📞 The Wire</h2>
            <p style="color: #ccc;">Communicate with other associates in the family.</p>
            
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
                        📞 Send
                    </button>
                </div>
                
                <!-- Quick Chat Options -->
                <div style="margin-top: 15px;">
                    <h4 style="color: #c0a062; margin-bottom: 10px; font-family: 'Georgia', serif;">⚡ Quick Words</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        <button onclick="sendQuickChat('Respect.')" style="padding: 8px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🎩 Respect.</button>
                        <button onclick="sendQuickChat('Looking for work.')" style="padding: 8px; background: linear-gradient(45deg, #333, #000); color: #c0a062; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-size: 12px; font-family: 'Georgia', serif;">💼 Looking for work</button>
                        <button onclick="sendQuickChat('Watch your back.')" style="padding: 8px; background: #8b0000; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🔫 Watch your back</button>
                        <button onclick="sendQuickChat('Good business.')" style="padding: 8px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🤝 Good business</button>
                        <button onclick="sendQuickChat('Anyone need a lawyer?')" style="padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">⚖️ Need a lawyer?</button>
                        <button onclick="sendQuickChat('My regards to the Don.')" style="padding: 8px; background: #1abc9c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🍷 Regards to the Don</button>
                    </div>
                </div>
            </div>
            
            <!-- Online Players List -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c0a062;">
                <h4 style="color: #c0a062; margin-bottom: 10px; font-family: 'Georgia', serif;">👥 Made Men Online</h4>
                <div id="chat-player-list" style="max-height: 150px; overflow-y: auto;">
                    ${generateOnlinePlayersHTML()}
                </div>
            </div>
            
            <button onclick="goBackToMainMenu()" style="background: linear-gradient(180deg, #333 0%, #000 100%); color: #c0a062; padding: 15px 30px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold; font-family: 'Georgia', serif; text-transform: uppercase;">
                🏠 Back to Safehouse
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
        return `<span style="color: #c0a062; font-family: 'Georgia', serif;">🟢 Connected to The Wire</span>`;
    } else {
        return `<span style="color: #8b0000; font-family: 'Georgia', serif;">🔴 Connecting to The Wire...</span>`;
    }
}

// Generate online players HTML for chat
function generateOnlinePlayersHTML() {
    if (!onlineWorldState.nearbyPlayers || onlineWorldState.nearbyPlayers.length === 0) {
        return '<p style="color: #95a5a6; text-align: center;">Loading players...</p>';
    }
    
    return onlineWorldState.nearbyPlayers.map(player => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; margin: 2px 0; background: rgba(52, 73, 94, 0.3); border-radius: 5px;">
            <span style="color: ${player.color};">🎭 ${player.name}</span>
            <span style="color: #95a5a6; font-size: 12px;">Level ${player.level}</span>
        </div>
    `).join('');
}

// Show online world hub (replaces old multiplayer menu)
function showOnlineWorld() {
    // Sync multiplayer territories to player object
    syncMultiplayerTerritoriesToPlayer();
    
    let worldHTML = `
        <h2 style="color: #c0a062; font-family: 'Georgia', serif; text-shadow: 2px 2px 4px #000;">🌐 The Commission</h2>
        <p style="color: #ccc;">Welcome to the family. Compete and cooperate with other Dons worldwide.</p>
        
        <!-- Territory Income Timer -->
        <div id="territory-income-timer" style="background: rgba(39, 174, 96, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #27ae60; text-align: center;">
            <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;">💰 Next Territory Income</div>
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
                    <h4 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif;">👥 Made Men Online</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Loading associates...</div>
                </div>
            </div>
            
            <!-- Players in Jail -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #8b0000;">
                <div id="online-jail-status">
                    <h4 style="color: #8b0000; margin: 0 0 15px 0; font-family: 'Georgia', serif;">🔒 In The Can</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Checking prison records...</div>
                </div>
            </div>
        </div>
        
        <!-- World Overview -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            
            <!-- City Districts -->
            <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #f39c12;">
                <h3 style="color: #f39c12; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;">🏙️ Turf</h3>
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
                                            📊 Details
                                        </button>
                                        <button onclick="challengeForTerritory('${district}')" 
                                                style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #fff; padding: 8px 12px; border: 1px solid #ff0000; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;">
                                            ⚔️ Attack
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
                <h3 style="color: #c0a062; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;">🏆 The Bosses</h3>
                <div id="global-leaderboard">
                    <div style="color: #95a5a6; text-align: center; font-style: italic;">
                        Loading rankings...
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Online Activities -->
        <div style="background: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #c0a062; margin: 20px 0;">
            <h3 style="color: #c0a062; text-align: center; margin-bottom: 15px; font-family: 'Georgia', serif;">⚡ Family Business</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <button onclick="showGlobalChat()" style="background: #333; color: #c0a062; padding: 15px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    📞 The Wire<br><small style="color: #ccc;">Talk with the family</small>
                </button>
                <button onclick="showWhackRivalDon()" style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ff4444; padding: 15px; border: 1px solid #ff0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    💀 Whack Rival Don<br><small style="color: #ffaaaa;">HIGH RISK - PERMADEATH</small>
                </button>
                <button onclick="showActiveHeists()" style="background: #333; color: #8b0000; padding: 15px; border: 1px solid #8b0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    💰 Big Scores<br><small style="color: #ccc;">Join ongoing jobs</small>
                </button>
                <button onclick="showTradeMarket()" style="background: #333; color: #27ae60; padding: 15px; border: 1px solid #27ae60; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    🛒 Black Market<br><small style="color: #ccc;">Buy/sell contraband</small>
                </button>
                <button onclick="showGangWars()" style="background: #333; color: #8b0000; padding: 15px; border: 1px solid #8b0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    ⚔️ Turf Wars<br><small style="color: #ccc;">Fight for territory</small>
                </button>
                <button onclick="showNearbyPlayers()" style="background: #333; color: #f39c12; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    👥 Local Crew<br><small style="color: #ccc;">Players in your area</small>
                </button>
                <button onclick="showCityEvents()" style="background: #333; color: #9b59b6; padding: 15px; border: 1px solid #9b59b6; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    📰 Street News<br><small style="color: #ccc;">Special opportunities</small>
                </button>
            </div>
        </div>
        
        <!-- Quick Chat Access -->
        <div style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #c0a062;">
            <h4 style="color: #c0a062; margin: 0 0 10px 0; font-family: 'Georgia', serif;">💬 Quick Wire</h4>
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
            <h3 style="color: #ccc; font-family: 'Georgia', serif;">📊 Street Activity</h3>
            <div id="world-activity-feed" style="height: 200px; overflow-y: auto; background: rgba(20, 20, 20, 0.8); padding: 10px; border-radius: 5px;">
                <div style="color: #95a5a6; font-style: italic;">Loading street news...</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <button onclick="goBackToMainMenu()" 
                    style="background: linear-gradient(180deg, #333 0%, #000 100%); color: #c0a062; padding: 18px 35px; 
                           border: 1px solid #c0a062; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif; text-transform: uppercase;">
                🏠 Back to Safehouse
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
                    <h4 style="color: #f39c12;">🔄 Connecting to Online World...</h4>
                    <p>Establishing connection to ${onlineWorldState.serverInfo.serverName}</p>
                </div>
            `;
            break;
            
        case 'connected':
            statusHTML = `
                <div style="text-align: center;">
                    <h4 style="color: #c0a062; font-family: 'Georgia', serif;">✅ Connected to The Commission</h4>
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
                    <h4 style="color: #f39c12;">🔧 Demo Mode (Server Offline)</h4>
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
                    <h4 style="color: #e74c3c;">❌ Connection Error</h4>
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
                    <h4 style="color: #f39c12;">🔄 Connecting to Online World...</h4>
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
        alert(`🌐 ${welcomeMsg}`);
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
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; max-width: 600px; margin: 20px auto; border: 2px solid #c0a062;">
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;">🏙️ ${districtName.charAt(0).toUpperCase() + districtName.slice(1)} District</h3>
            
            <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #555;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><strong style="color: #c0a062;">Crime Level:</strong> <span style="color: #ccc;">${district.crimeLevel}%</span></div>
                    <div><strong style="color: #c0a062;">Controlled By:</strong> <span style="color: #ccc;">${district.controlledBy || 'No one'}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0;">
                <button onclick="doDistrictJob('${districtName}')" style="background: #333; color: #c0a062; padding: 10px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    💼 Find Work
                </button>
                <button onclick="claimTerritory('${districtName}')" style="background: #333; color: #8b0000; padding: 10px; border: 1px solid #8b0000; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    🏛️ Claim Turf
                </button>
                <button onclick="findPlayersInDistrict('${districtName}')" style="background: #333; color: #f39c12; padding: 10px; border: 1px solid #f39c12; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    👥 Find Crew
                </button>
                <button onclick="startDistrictHeist('${districtName}')" style="background: #333; color: #27ae60; padding: 10px; border: 1px solid #27ae60; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    💰 Plan Score
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
    
    logAction(`🏙️ Exploring ${districtName} district...`);
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
        { player: 'StreetKing', message: 'Just took over downtown district 💪', time: '8 min ago', color: '#2ecc71' },
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
        `🚨 Police raid in ${Object.keys(onlineWorldState.cityDistricts)[Math.floor(Math.random() * 5)]} district!`,
        `💰 ${onlineWorldState.nearbyPlayers[Math.floor(Math.random() * onlineWorldState.nearbyPlayers.length)]?.name || 'A player'} completed a major heist!`,
        `🏛️ Territory war brewing between rival gangs!`,
        `📈 Weapon prices surge in black market!`,
        `🎯 New high-value target spotted in the city!`
    ];
    return events[Math.floor(Math.random() * events.length)];
}

// World activity functions
function loadWorldActivityFeed() {
    const feedElement = document.getElementById('world-activity-feed');
    if (!feedElement) return;
    
    const activities = [
        '🏛️ CrimeBoss42 claimed territory in downtown district',
        '💰 ShadowDealer completed a $50,000 heist',
        '⚔️ Gang war started between Serpents and Wolves',
        '🛒 StreetKing sold rare weapons in trade market',
        '🎯 Police raid ended in industrial district',
        '💬 15 players currently in global chat',
        '🌐 67 players online worldwide'
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
    
    logAction(`💬 Sent message to global chat: "${message}"`);
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
    
    logAction(`💬 Sent message to global chat: "${message}"`);
}

// Update quick chat display when new messages arrive
function updateQuickChatDisplay() {
    const quickChatMessages = document.getElementById('quick-chat-messages');
    if (quickChatMessages) {
        const recentMessages = onlineWorldState.globalChat.slice(-3);
        quickChatMessages.innerHTML = recentMessages.map(msg => `
            <div style="margin: 4px 0; font-size: 0.9em;">
                <strong style="color: ${msg.color || '#3498db'};">${escapeHTML(msg.player)}:</strong> ${escapeHTML(msg.message)}
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
    
    alert(`🎯 Looking for jobs in ${districtName}... Crime level affects difficulty and rewards.`);
    
    // Integrate with existing job system but with online world context
    showJobs();
    
    logAction(`💼 Searching for jobs in ${districtName} district (Crime Level: ${district.crimeLevel}%)`);
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
        player.money -= cost;
        district.controlledBy = player.name || 'You';
        player.territory += 1;
        
        alert(`🏛️ Successfully claimed ${districtName} district!`);
        logAction(`🏛️ Claimed ${districtName} district for $${cost.toLocaleString()}`);
        
        // Broadcast to world
        addWorldEvent(`🏛️ ${player.name || 'A player'} claimed ${districtName} district!`);
        
        // Update display
        showOnlineWorld();
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
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;">👥 Crew in ${districtName.charAt(0).toUpperCase() + districtName.slice(1)}</h3>
            <div style="margin: 20px 0;">
                ${playersInDistrict.map(p => `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #555;">
                        <div>
                            <strong style="color: #c0a062;">${p.name}</strong> (Level ${p.level})
                            <br><small style="color: #ccc;">Rep: ${p.reputation} | Territory: ${p.territory}</small>
                        </div>
                        <div>
                            <button onclick="challengePlayer('${p.name}')" style="background: #8b0000; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 2px; font-family: 'Georgia', serif;">
                                ⚔️ Challenge
                            </button>
                            <button onclick="tradeWithPlayer('${p.name}')" style="background: #27ae60; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 2px; font-family: 'Georgia', serif;">
                                🤝 Trade
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center;">
                <button onclick="exploreDistrict('${districtName}')" style="background: #333; color: #c0a062; padding: 10px 20px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back to District
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = playersHTML;
}

function startDistrictHeist(districtName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    alert(`💰 Organizing heist in ${districtName}... This will be broadcast to all players in the area!`);
    
    const heistTarget = `${districtName.charAt(0).toUpperCase() + districtName.slice(1)} Bank`;
    const reward = 100000 + (Math.random() * 200000);
    
    // Add to active heists
    const newHeist = {
        id: `heist_${Date.now()}`,
        target: heistTarget,
        organizer: player.name || 'You',
        participants: 1,
        maxParticipants: 4,
        difficulty: onlineWorldState.cityDistricts[districtName].crimeLevel > 70 ? 'Hard' : 'Medium',
        reward: Math.floor(reward)
    };
    
    onlineWorldState.activeHeists.push(newHeist);
    
    logAction(`💰 Organized heist: ${heistTarget} (Reward: $${newHeist.reward.toLocaleString()})`);
    addWorldEvent(`💰 ${player.name || 'A player'} is organizing a heist in ${districtName}!`);
    
    setTimeout(() => {
        showActiveHeists();
    }, 1000);
}

// Show active heists
function showActiveHeists() {
    let heistsHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #8b0000; font-family: 'Georgia', serif;">💰 Active Scores</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.activeHeists.length === 0 ? `
                    <div style="text-align: center; color: #95a5a6; font-style: italic; padding: 40px;">
                        No active scores at the moment. Plan one in a district!
                    </div>
                ` : onlineWorldState.activeHeists.map(heist => `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #555;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #c0a062; margin: 0; font-family: 'Georgia', serif;">${heist.target}</h4>
                                <p style="margin: 5px 0; color: #ccc;">Organized by: <strong style="color: #fff;">${heist.organizer}</strong></p>
                                <div style="display: flex; gap: 20px; font-size: 0.9em; color: #999;">
                                    <span>👥 ${heist.participants}/${heist.maxParticipants}</span>
                                    <span>🎯 ${heist.difficulty}</span>
                                    <span style="color: #27ae60;">💰 $${heist.reward.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                ${heist.organizer === (player.name || 'You') ? `
                                    <button onclick="manageHeist('${heist.id}')" style="background: #f39c12; color: #000; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                        ⚙️ Manage
                                    </button>
                                ` : `
                                    <button onclick="joinHeist('${heist.id}')" style="background: #27ae60; color: #fff; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;" ${heist.participants >= heist.maxParticipants ? 'disabled' : ''}>
                                        ${heist.participants >= heist.maxParticipants ? 'Full' : '🚀 Join'}
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = heistsHTML;
}

// Show trade market
function showTradeMarket() {
    let marketHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #27ae60; font-family: 'Georgia', serif;">🛒 Black Market</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; border: 1px solid #555;">
                    <h4 style="color: #c0a062; font-family: 'Georgia', serif;">🛍️ Buy Contraband</h4>
                    <div style="margin: 15px 0;">
                        <div style="background: rgba(0, 0, 0, 0.5); padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333;">
                            <div><strong style="color: #fff;">Bulletproof Vest</strong><br><small style="color: #999;">Seller: CrimeBoss42</small></div>
                            <div><button onclick="buyFromPlayer('vest', 2500)" style="background: #27ae60; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">$2,500</button></div>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.5); padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333;">
                            <div><strong style="color: #fff;">Tommy Gun</strong><br><small style="color: #999;">Seller: ShadowDealer</small></div>
                            <div><button onclick="buyFromPlayer('tommy', 15000)" style="background: #27ae60; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">$15,000</button></div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; border: 1px solid #555;">
                    <h4 style="color: #c0a062; font-family: 'Georgia', serif;">💰 Sell Goods</h4>
                    <div style="margin: 15px 0;">
                        <p style="color: #ccc;">List your items for other players to buy:</p>
                        <button onclick="listItemForSale()" style="background: #f39c12; color: #000; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold;">
                            📝 List Item for Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = marketHTML;
}

// Show gang wars
function showGangWars() {
    let warsHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #8b0000; font-family: 'Georgia', serif;">⚔️ Turf Wars</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #555;">
                <h4 style="color: #c0a062; font-family: 'Georgia', serif;">🏛️ Territory Battles</h4>
                <p style="color: #ccc;">Fight other families for control of city districts. Winners gain territory and respect.</p>
                
                <div style="margin: 15px 0;">
                    <div style="background: rgba(139, 0, 0, 0.2); padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #8b0000;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #c0a062;">Downtown District War</strong>
                                <br><small style="color: #ccc;">CrimeBoss42 vs ShadowDealer</small>
                            </div>
                            <button onclick="spectateWar('downtown')" style="background: #333; color: #c0a062; padding: 8px 12px; border: 1px solid #c0a062; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                👁️ Watch
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: rgba(139, 0, 0, 0.2); padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #8b0000;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #c0a062;">Docks District</strong>
                                <br><small style="color: #ccc;">Challenge the current owner</small>
                            </div>
                            <button onclick="challengeForTerritory('docks')" style="background: #8b0000; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                ⚔️ Challenge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = warsHTML;
}

// Show nearby players
function showNearbyPlayers() {
    let playersHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #f39c12; font-family: 'Georgia', serif;">👥 Local Crew</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.nearbyPlayers.map(p => `
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
                                    ⚔️ Challenge
                                </button>
                                <button onclick="tradeWithPlayer('${p.name}')" style="background: #27ae60; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                    🤝 Trade
                                </button>
                                <button onclick="inviteToHeist('${p.name}')" style="background: #f39c12; color: #000; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                    💰 Invite
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
                <h3 style="color: #9b59b6; font-family: 'Georgia', serif;">📰 Street News</h3>
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
                                <div style="color: #f39c12; font-weight: bold;">⏰ ${event.timeLeft}</div>
                                <button onclick="participateInEvent('${event.type}', '${event.district}')" style="background: #9b59b6; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-family: 'Georgia', serif;">
                                    🎯 Get Involved
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
        // Simulate challenge
        const victory = Math.random() > 0.5;
        
        if (victory) {
            const repGain = 5 + Math.floor(Math.random() * 10);
            player.reputation += repGain;
            alert(`🏆 Victory! You defeated ${playerName} and gained ${repGain} reputation!`);
            logAction(`⚔️ Defeated ${playerName} in combat (+${repGain} reputation)`);
            addWorldEvent(`⚔️ ${player.name || 'A player'} defeated ${playerName} in combat!`);
        } else {
            const repLoss = 2 + Math.floor(Math.random() * 5);
            player.reputation = Math.max(0, player.reputation - repLoss);
            alert(`💀 Defeat! ${playerName} defeated you. Lost ${repLoss} reputation.`);
            logAction(`💀 Defeated by ${playerName} in combat (-${repLoss} reputation)`);
        }
    }
}

function tradeWithPlayer(playerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    alert(`🤝 Trade request sent to ${playerName}! (In a real implementation, this would open direct trade negotiations)`);
    logAction(`🤝 Sent trade request to ${playerName}`);
}

function inviteToHeist(playerName) {
    if (!onlineWorldState.isConnected) {
        alert("You need to be connected to the online world!");
        return;
    }
    
    alert(`💰 Heist invitation sent to ${playerName}! They can join your next heist.`);
    logAction(`💰 Invited ${playerName} to join heist`);
}

// ==================== UTILITY FUNCTIONS ====================

// Setup online world UI
function setupOnlineWorldUI() {
    // Create multiplayer screen if it doesn't exist (reusing existing structure)
    if (!document.getElementById("multiplayer-screen")) {
        const multiplayerScreen = document.createElement("div");
        multiplayerScreen.id = "multiplayer-screen";
        multiplayerScreen.className = "game-screen";
        multiplayerScreen.style.display = "none";
        
        const multiplayerContent = document.createElement("div");
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
        alert(`🚀 Joined ${heist.target}! Get ready for action.`);
        logAction(`💰 Joined heist: ${heist.target}`);
        showActiveHeists(); // Refresh the display
    }
}

function manageHeist(heistId) {
    alert("🎯 Heist management panel would open here (start heist, kick players, etc.)");
}

function buyFromPlayer(item, price) {
    if (player.money >= price) {
        player.money -= price;
        alert(`✅ Purchased ${item} for $${price.toLocaleString()}!`);
        logAction(`🛒 Bought ${item} from player for $${price.toLocaleString()}`);
    } else {
        alert("❌ Not enough money!");
    }
}

function listItemForSale() {
    alert("📝 Item listing interface would open here (select item, set price, etc.)");
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
        <h3 style="margin:0; color:#ff4444; text-shadow:2px 2px 6px #8b0000;">👁️ Turf War: ${district}</h3>
        <button style="background:#333; color:#c0a062; padding:6px 12px; border:1px solid #c0a062; border-radius:6px; cursor:pointer;" onclick="document.getElementById('turf-war-spectator').remove();">✖ Close</button>
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

    log(`👁️ You begin watching the clash for ${district}...`);

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
            log(`🩸 Attacker pushes forward (-${dmg} defender strength)`);
        }
        if (defenderHit) {
            const dmg = 2 + Math.floor(Math.random()*6);
            attackerStrength = Math.max(0, attackerStrength - dmg);
            log(`💥 Counter-fire from defenders (-${dmg} attacker strength)`);
        }

        // Momentum swings
        if (Math.random() < 0.15) {
            const swingTarget = Math.random() < 0.5 ? 'attacker' : 'defender';
            const swing = 4 + Math.floor(Math.random()*5);
            if (swingTarget === 'attacker') {
                attackerStrength += swing;
                log(`🔥 Sudden reinforcements bolster attackers (+${swing})`);
            } else {
                defenderStrength += swing;
                log(`🛡️ Hidden reserves fortify defenders (+${swing})`);
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
                addWorldEvent?.(`🔥 Attackers appear victorious in ${district}!`);
            } else {
                outcome = 'Defenders hold firm — control remains';
                addWorldEvent?.(`🛡️ Defenders repel assault in ${district}.`);
            }
            log(`🏁 Battle concludes: ${outcome}`);
            log(`📊 Final Strength — A:${attackerStrength} D:${defenderStrength}`);
            setTimeout(() => { footer.innerHTML = outcome; }, 500);
            logAction?.(`👁️ Spectated turf war in ${district} (${outcome})`);
        }
    }, 1000);
}

// Removed placeholder challengeForTerritory(district); full implementation defined later.

function participateInEvent(eventType, district) {
    alert(`🎯 Participating in ${eventType.replace('_', ' ')} event in ${district}...`);
    logAction(`🎯 Joined city event: ${eventType} in ${district}`);
}

// ==================== WHACK RIVAL DON PVP SYSTEM ====================

// Show Whack Rival Don screen
function showWhackRivalDon() {
    const availableTargets = Object.values(onlineWorldState.playerStates)
        .filter(p => p.playerId !== (player.id || 'local') && !p.inJail)
        .sort((a, b) => (b.money || 0) - (a.money || 0));

    let pvpHTML = `
        <div style="background: rgba(0, 0, 0, 0.95); padding: 20px; border-radius: 15px; border: 2px solid #8b0000;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #ff0000; font-family: 'Georgia', serif; text-shadow: 2px 2px 8px #8b0000;">💀 Whack Rival Don</h3>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
            
            <!-- Warning Section -->
            <div style="background: rgba(139, 0, 0, 0.3); padding: 20px; border-radius: 10px; border: 2px solid #ff0000; margin-bottom: 25px;">
                <h4 style="color: #ff4444; margin: 0 0 15px 0; font-family: 'Georgia', serif; text-align: center;">⚠️ WARNING: EXTREME RISK ⚠️</h4>
                <div style="color: #ffaaaa; line-height: 1.8; font-family: 'Georgia', serif;">
                    <p style="margin: 10px 0;">• <strong>PERMADEATH:</strong> If successful, your target is <span style="color: #ff0000; font-weight: bold;">PERMANENTLY ELIMINATED</span></p>
                    <p style="margin: 10px 0;">• <strong>HIGH FAILURE RATE:</strong> Most hits fail. You'll take damage either way.</p>
                    <p style="margin: 10px 0;">• <strong>COSTLY:</strong> Requires upfront payment for weapons, intel, and crew.</p>
                    <p style="margin: 10px 0;">• <strong>REWARDS:</strong> Successful hits yield random % of victim's money and stolen cars.</p>
                    <p style="margin: 10px 0; text-align: center; font-style: italic; color: #ff6666;">"This is the business we've chosen."</p>
                </div>
            </div>
            
            <!-- Available Targets -->
            <div style="margin: 20px 0;">
                <h4 style="color: #c0a062; margin-bottom: 15px; font-family: 'Georgia', serif;">🎯 Available Targets</h4>
                ${availableTargets.length === 0 ? `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 30px; border-radius: 10px; text-align: center; border: 1px solid #555;">
                        <p style="color: #95a5a6; font-style: italic; font-family: 'Georgia', serif;">No targets available. All Dons are either in jail or offline.</p>
                        <p style="color: #666; font-size: 0.9em; margin-top: 10px;">Check back later...</p>
                    </div>
                ` : availableTargets.map(target => {
                    const hitCost = 25000 + (target.level || 1) * 5000;
                    const estimatedTake = Math.floor((target.money || 0) * 0.35);
                    const canAfford = (player.money || 0) >= hitCost;
                    
                    return `
                        <div style="background: rgba(20, 20, 20, 0.9); padding: 20px; margin: 15px 0; border-radius: 10px; border: 1px solid ${canAfford ? '#c0a062' : '#555'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-size: 1.3em; color: #c0a062; font-weight: bold; margin-bottom: 8px; font-family: 'Georgia', serif;">
                                        ${escapeHTML(target.name || 'Unknown Don')}
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0; font-size: 0.95em;">
                                        <div><span style="color: #999;">Level:</span> <span style="color: #c0a062;">${target.level || 1}</span></div>
                                        <div><span style="color: #999;">Reputation:</span> <span style="color: #f39c12;">${target.reputation || 0}</span></div>
                                        <div><span style="color: #999;">Territory:</span> <span style="color: #27ae60;">${target.territory || 0}</span></div>
                                        <div><span style="color: #999;">Health:</span> <span style="color: ${(target.health || 100) > 60 ? '#27ae60' : '#e74c3c'}">${target.health || 100}%</span></div>
                                    </div>
                                    <div style="margin-top: 12px; padding: 10px; background: rgba(0, 0, 0, 0.5); border-radius: 5px; border-left: 3px solid #27ae60;">
                                        <div style="color: #999; font-size: 0.85em;">Estimated Take (varies):</div>
                                        <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;">$${estimatedTake.toLocaleString()} + Random Cars</div>
                                        <div style="color: #666; font-size: 0.8em; margin-top: 5px;">Actual: 10-50% of wealth</div>
                                    </div>
                                </div>
                                <div style="text-align: right; margin-left: 20px;">
                                    <div style="background: rgba(139, 0, 0, 0.3); padding: 10px; border-radius: 8px; border: 1px solid #8b0000; margin-bottom: 15px;">
                                        <div style="color: #ff6666; font-size: 0.85em;">Hit Cost:</div>
                                        <div style="color: #ff4444; font-weight: bold; font-size: 1.2em;">$${hitCost.toLocaleString()}</div>
                                    </div>
                                    <button onclick="confirmWhackRivalDon('${target.playerId}', '${escapeHTML(target.name || 'Unknown')}', ${hitCost})" 
                                            style="background: ${canAfford ? 'linear-gradient(180deg, #8b0000 0%, #5a0000 100%)' : '#444'}; 
                                                   color: ${canAfford ? '#ffffff' : '#666'}; 
                                                   padding: 12px 20px; 
                                                   border: 1px solid ${canAfford ? '#ff0000' : '#555'}; 
                                                   border-radius: 8px; 
                                                   cursor: ${canAfford ? 'pointer' : 'not-allowed'}; 
                                                   font-family: 'Georgia', serif; 
                                                   font-weight: bold;
                                                   ${canAfford ? '' : 'opacity: 0.5;'}">
                                        ${canAfford ? '💀 Execute Hit' : '💰 Can\'t Afford'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="showOnlineWorld()" 
                        style="background: #333; color: #c0a062; padding: 15px 30px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    🏠 Return to Commission
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = pvpHTML;
    hideAllScreens();
    document.getElementById("multiplayer-screen").style.display = "block";
}

// Confirm and initiate the hit
function confirmWhackRivalDon(targetId, targetName, cost) {
    if (!player.money || player.money < cost) {
        alert('Not enough money to execute this hit. You need $' + cost.toLocaleString());
        return;
    }
    
    const confirm = window.confirm(
        `Are you sure you want to whack ${targetName}?\n\n` +
        `Cost: $${cost.toLocaleString()}\n` +
        `Risk: HIGH - You will take damage\n` +
        `Target: PERMADEATH if successful\n\n` +
        `This action cannot be undone.`
    );
    
    if (confirm) {
        executeWhackRivalDon(targetId, targetName, cost);
    }
}

// Execute the hit with narrative combat
function executeWhackRivalDon(targetId, targetName, cost) {
    // Deduct cost
    player.money -= cost;
    if (typeof updateUI === 'function') updateUI();
    
    // Get target data
    const target = onlineWorldState.playerStates[targetId];
    if (!target) {
        alert('Target is no longer available.');
        showWhackRivalDon();
        return;
    }
    
    // Calculate attacker power
    const attackerPower = (player.level || 1) * 10 
                        + (player.skills?.stealth || 0) * 8
                        + (player.skillTrees?.violence?.firearms || 0) * 12
                        + (player.skills?.intelligence || 0) * 6
                        + (player.power || 0) * 2;
    
    // Calculate target defense power
    const targetPower = (target.level || 1) * 10
                      + (target.reputation || 0) * 0.5
                      + (target.power || 0) * 2
                      + (target.territory || 0) * 15; // More territory = better defenses
    
    // Calculate success chance based on power ratio
    const powerRatio = attackerPower / (targetPower + 1); // Avoid division by zero
    let baseChance;
    if (powerRatio >= 2.0) {
        baseChance = 50; // 2x stronger
    } else if (powerRatio >= 1.5) {
        baseChance = 40; // 1.5x stronger
    } else if (powerRatio >= 1.2) {
        baseChance = 30; // Slightly stronger
    } else if (powerRatio >= 0.8) {
        baseChance = 20; // Even match
    } else if (powerRatio >= 0.5) {
        baseChance = 12; // Weaker
    } else {
        baseChance = 5; // Much weaker
    }
    
    const successChance = Math.max(5, Math.min(55, baseChance));
    const success = Math.random() * 100 < successChance;
    
    // Attacker always takes damage (20-60%, never fatal)
    const attackerDamage = 20 + Math.floor(Math.random() * 41); // 20-60%
    player.health = Math.max(1, (player.health || 100) - attackerDamage);
    
    // Generate narrative
    const narratives = generateHitNarrative(targetName, success, attackerDamage);
    
    // Show narrative screen
    showNarrativeCombat(narratives, success, target, attackerDamage, cost);
}

// Generate hit narrative
function generateHitNarrative(targetName, success, attackerDamage) {
    const setupNarratives = [
        `You spend days surveilling ${targetName}, learning their patterns, their weaknesses...`,
        `Your informant whispers locations. You assemble your crew in the dead of night.`,
        `The contract is set. You load your weapon and rehearse the plan one last time.`,
        `Intel suggests ${targetName} will be vulnerable tonight. It's now or never.`,
        `You bribe the doorman. Your inside man confirms the target is alone.`
    ];
    
    const approachNarratives = [
        `The building is dark. You move silently through the shadows, heart pounding.`,
        `Your crew positions at every exit. No one gets out alive if this goes wrong.`,
        `You slip past the guards. Every sound feels deafening in the silence.`,
        `The hallway stretches before you. Behind that door, ${targetName} waits.`,
        `Your hand tightens on the weapon. Years of planning come down to this moment.`
    ];
    
    const tensionNarratives = [
        `You kick open the door. Time slows. ${targetName} reaches for their piece—`,
        `The confrontation is instant. Gunfire erupts. Chaos. Screaming. Blood.`,
        `${targetName} turns. Recognition. Fear. Then violence, sudden and brutal.`,
        `Everything goes wrong. Bodyguards appear from nowhere. You return fire.`,
        `The ambush is perfect—until it isn't. Someone tipped them off. You're in a firefight.`
    ];
    
    let outcomeNarrative;
    if (success) {
        const successOutcomes = [
            `Your shot is true. ${targetName} collapses. The Don is dead. You grab what you can and vanish into the night.`,
            `${targetName} never saw it coming. Clean. Professional. You leave no witnesses.`,
            `The deed is done. ${targetName} lies in a pool of blood. You take their wealth and disappear.`,
            `One bullet. ${targetName}'s empire crumbles in an instant. You claim your prize.`,
            `It's over in seconds. ${targetName} is finished. Their cars, their cash—all yours now.`
        ];
        outcomeNarrative = successOutcomes[Math.floor(Math.random() * successOutcomes.length)];
    } else {
        const failureOutcomes = [
            `${targetName} returns fire. You take a hit and barely escape with your life.`,
            `The hit goes sideways. You're wounded, bleeding, but alive. ${targetName} survives.`,
            `Reinforcements arrive. You fight your way out, hurt and humiliated.`,
            `Your shot misses. ${targetName}'s crew opens up. You flee, nursing your wounds.`,
            `It's a disaster. ${targetName} lives. You take a bullet and limp away, money gone, pride shattered.`
        ];
        outcomeNarrative = failureOutcomes[Math.floor(Math.random() * failureOutcomes.length)];
    }
    
    const damageNarrative = attackerDamage > 40 ? 
        `You're hit bad. Blood soaks through your shirt. (-${attackerDamage}% Health)` :
        `A bullet grazes you. It hurts like hell. (-${attackerDamage}% Health)`;
    
    return {
        setup: setupNarratives[Math.floor(Math.random() * setupNarratives.length)],
        approach: approachNarratives[Math.floor(Math.random() * approachNarratives.length)],
        tension: tensionNarratives[Math.floor(Math.random() * tensionNarratives.length)],
        outcome: outcomeNarrative,
        damage: damageNarrative
    };
}

// Show narrative combat screen
function showNarrativeCombat(narratives, success, target, attackerDamage, cost) {
    let currentStage = 0;
    const stages = ['setup', 'approach', 'tension', 'outcome', 'damage'];
    
    function showNextStage() {
        if (currentStage >= stages.length) {
            // Show results
            showHitResults(success, target, attackerDamage, cost);
            return;
        }
        
        const stage = stages[currentStage];
        const text = narratives[stage];
        
        let bgColor, borderColor;
        if (stage === 'setup') {
            bgColor = 'rgba(30, 30, 50, 0.95)';
            borderColor = '#3498db';
        } else if (stage === 'approach') {
            bgColor = 'rgba(40, 40, 30, 0.95)';
            borderColor = '#f39c12';
        } else if (stage === 'tension') {
            bgColor = 'rgba(50, 20, 20, 0.95)';
            borderColor = '#e74c3c';
        } else if (stage === 'outcome') {
            bgColor = success ? 'rgba(20, 50, 20, 0.95)' : 'rgba(50, 10, 10, 0.95)';
            borderColor = success ? '#27ae60' : '#8b0000';
        } else {
            bgColor = 'rgba(60, 20, 20, 0.95)';
            borderColor = '#ff4444';
        }
        
        const narrativeHTML = `
            <div style="background: ${bgColor}; padding: 40px; border-radius: 15px; border: 3px solid ${borderColor}; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <div style="color: #fff; font-size: 1.4em; line-height: 1.8; font-family: 'Georgia', serif; max-width: 700px; margin-bottom: 40px;">
                    ${text}
                </div>
                <button onclick="window.narrativeNextStage()" 
                        style="background: linear-gradient(180deg, #c0a062 0%, #8a6e2f 100%); 
                               color: #000; 
                               padding: 18px 50px; 
                               border: 2px solid #ffd700; 
                               border-radius: 10px; 
                               cursor: pointer; 
                               font-size: 1.2em; 
                               font-weight: bold; 
                               font-family: 'Georgia', serif; 
                               text-transform: uppercase;
                               box-shadow: 0 4px 15px rgba(192, 160, 98, 0.4);">
                    ${currentStage < stages.length - 1 ? 'Continue →' : 'See Results →'}
                </button>
            </div>
        `;
        
        document.getElementById("multiplayer-content").innerHTML = narrativeHTML;
        currentStage++;
    }
    
    window.narrativeNextStage = showNextStage;
    showNextStage();
}

// Show hit results with loot
function showHitResults(success, target, attackerDamage, cost) {
    let lootMoney = 0;
    let lootCars = [];
    let resultHTML = '';
    
    if (success) {
        // Target is dead - calculate loot
        const moneyPercentage = 10 + Math.floor(Math.random() * 41); // 10-50%
        lootMoney = Math.floor((target.money || 0) * (moneyPercentage / 100));
        player.money += lootMoney;
        
        // Steal random percentage of cars (0-100%, but at least 1 if they have any)
        if (target.cars && target.cars > 0) {
            const carsPercentage = Math.floor(Math.random() * 101); // 0-100%
            const carsToSteal = Math.max(1, Math.floor(target.cars * (carsPercentage / 100)));
            lootCars = Array(carsToSteal).fill('Stolen Vehicle'); // Simplified for now
        }
        
        // Reset target territories to NPC control (permadeath consequence)
        if (target && target.name) {
            resetPlayerTerritories(target.name);
        }

        resultHTML = `
            <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #27ae60;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">💀</div>
                    <h2 style="color: #27ae60; font-family: 'Georgia', serif; margin: 0; font-size: 2em;">HIT SUCCESSFUL</h2>
                    <div style="color: #aaa; margin-top: 10px; font-size: 1.1em; font-family: 'Georgia', serif;">
                        ${escapeHTML(target.name || 'The target')} has been permanently eliminated.
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #27ae60;">
                    <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">💰 The Take</h3>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(39, 174, 96, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Money Seized:</span>
                            <span style="color: #27ae60; font-weight: bold; font-size: 1.2em;">+$${lootMoney.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(39, 174, 96, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Cars Stolen:</span>
                            <span style="color: #27ae60; font-weight: bold; font-size: 1.2em;">${lootCars.length} Vehicles</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border-top: 1px solid #555;">
                            <span style="color: #ccc;">Hit Cost:</span>
                            <span style="color: #e74c3c; font-weight: bold;">-$${cost.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Damage Taken:</span>
                            <span style="color: #e74c3c; font-weight: bold;">-${attackerDamage}% Health</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(192, 160, 98, 0.2); border-radius: 5px; border: 2px solid #c0a062; margin-top: 10px;">
                            <span style="color: #c0a062; font-weight: bold;">Net Profit:</span>
                            <span style="color: ${lootMoney > cost ? '#27ae60' : '#e74c3c'}; font-weight: bold; font-size: 1.4em;">$${(lootMoney - cost).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                    <p style="color: #ff6666; margin: 0; font-family: 'Georgia', serif; font-style: italic;">
                        "${target.name || 'The Don'}'s empire has fallen. Their name will be forgotten. Their wealth is yours."
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="showWhackRivalDon()" 
                            style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ffffff; padding: 15px 35px; border: 1px solid #ff0000; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 15px;">
                        💀 Find Another Target
                    </button>
                    <button onclick="showOnlineWorld()" 
                            style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                        🏠 Return to Commission
                    </button>
                </div>
            </div>
        `;
    } else {
        // Failed hit
        resultHTML = `
            <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #8b0000;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">💥</div>
                    <h2 style="color: #e74c3c; font-family: 'Georgia', serif; margin: 0; font-size: 2em;">HIT FAILED</h2>
                    <div style="color: #aaa; margin-top: 10px; font-size: 1.1em; font-family: 'Georgia', serif;">
                        ${escapeHTML(target.name || 'The target')} survives. You barely escape.
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #8b0000;">
                    <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">💸 The Cost</h3>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Hit Cost (Lost):</span>
                            <span style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">-$${cost.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Damage Taken:</span>
                            <span style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">-${attackerDamage}% Health</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <span style="color: #ccc;">Money Seized:</span>
                            <span style="color: #666; font-weight: bold;">$0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(139, 0, 0, 0.3); border-radius: 5px; border: 2px solid #8b0000; margin-top: 10px;">
                            <span style="color: #ff6666; font-weight: bold;">Total Loss:</span>
                            <span style="color: #e74c3c; font-weight: bold; font-size: 1.4em;">-$${cost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                    <p style="color: #ff6666; margin: 0; font-family: 'Georgia', serif; font-style: italic;">
                        "You got sloppy. ${target.name || 'The Don'} is still breathing, and now you're wounded, broke, and marked for death."
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="showWhackRivalDon()" 
                            style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ffffff; padding: 15px 35px; border: 1px solid #ff0000; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 15px;">
                        💀 Try Again
                    </button>
                    <button onclick="showOnlineWorld()" 
                            style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                        🏠 Return to Commission
                    </button>
                </div>
            </div>
        `;
    }
    
    document.getElementById("multiplayer-content").innerHTML = resultHTML;
    
    // Update UI
    if (typeof updateUI === 'function') updateUI();
    
    // Log the action
    if (typeof logAction === 'function') {
        if (success) {
            logAction(`💀 Successfully whacked ${target.name || 'rival Don'}! Seized $${lootMoney.toLocaleString()} and ${lootCars.length} cars. Took ${attackerDamage}% damage.`);
        } else {
            logAction(`💥 Failed to whack ${target.name || 'rival Don'}. Lost $${cost.toLocaleString()} and took ${attackerDamage}% damage.`);
        }
    }
}

// ==================== TERRITORY CONQUEST SYSTEM ====================

// View detailed territory information
function viewTerritoryDetails(districtName) {
    const district = onlineWorldState.cityDistricts[districtName];
    if (!district) return;
    
    const isPlayerControlled = district.controllerType === 'player';
    const controllerName = isPlayerControlled ? district.controlledBy : district.npcGang;
    
    const detailsHTML = `
        <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid ${isPlayerControlled ? '#c0a062' : '#666'};">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 3em; margin-bottom: 15px;">🏛️</div>
                <h2 style="color: #c0a062; font-family: 'Georgia', serif; margin: 0; font-size: 2em; text-transform: uppercase;">
                    ${districtName}
                </h2>
                <div style="color: #aaa; margin-top: 10px; font-size: 1.1em;">
                    Controlled by <span style="color: ${isPlayerControlled ? '#27ae60' : '#95a5a6'}; font-weight: bold;">${controllerName}</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
                <div style="background: rgba(231, 76, 60, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #e74c3c; text-align: center;">
                    <div style="color: #e74c3c; font-size: 2.5em; font-weight: bold;">${district.defenseRating}</div>
                    <div style="color: #ccc; margin-top: 5px;">Defense Rating</div>
                </div>
                <div style="background: rgba(39, 174, 96, 0.1); padding: 20px; border-radius: 10px; border: 2px solid #27ae60; text-align: center;">
                    <div style="color: #27ae60; font-size: 2em; font-weight: bold;">$${district.weeklyIncome.toLocaleString()}</div>
                    <div style="color: #ccc; margin-top: 5px;">Weekly Income</div>
                </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">🛡️ Defense Forces</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 2em; margin-bottom: 5px;">👤</div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.2em;">${district.assignedMembers}</div>
                        <div style="color: #888; font-size: 0.85em;">Gang Members</div>
                    </div>
                    <div>
                        <div style="font-size: 2em; margin-bottom: 5px;">🚗</div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.2em;">${district.assignedCars}</div>
                        <div style="color: #888; font-size: 0.85em;">Vehicles</div>
                    </div>
                    <div>
                        <div style="font-size: 2em; margin-bottom: 5px;">🔫</div>
                        <div style="color: #fff; font-weight: bold; font-size: 1.2em;">${district.assignedWeapons}</div>
                        <div style="color: #888; font-size: 0.85em;">Weapons</div>
                    </div>
                </div>
            </div>
            
            ${!isPlayerControlled ? `
                <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                    <h4 style="color: #ff6666; margin: 0 0 10px 0; font-family: 'Georgia', serif;">About ${district.npcGang}</h4>
                    <p style="color: #ccc; margin: 0; font-size: 0.95em; line-height: 1.6;">
                        ${getTerritoryLore(districtName, district.npcGang)}
                    </p>
                </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="challengeForTerritory('${districtName}')" 
                        style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ffffff; padding: 15px 35px; border: 1px solid #ff0000; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 15px; font-size: 1.1em;">
                    ⚔️ Attack This Territory
                </button>
                <button onclick="showOnlineWorld()" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    🏠 Return to Commission
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = detailsHTML;
}

// Get lore text for NPC gangs
function getTerritoryLore(district, gangName) {
    const lore = {
        'Street Kings': 'A crew of hardened street fighters who control the underground through fear and violence. They\'ve held these streets since the old days.',
        'Longshoremen': 'Union workers turned gangsters. They control the shipping and know how to move anything through the docks without questions.',
        'Neighborhood Watch': 'Don\'t let the name fool you - these are ex-military vets who protect their turf with military precision.',
        'Factory Boys': 'Blue-collar workers who learned to fight for what\'s theirs. They control the industrial sector with iron fists.',
        'Vice Lords': 'They run the nightlife and pleasure businesses. Cross them and you\'ll disappear into the red light district.'
    };
    return lore[gangName] || 'A powerful local gang that controls this territory.';
}

// Challenge for territory
function challengeForTerritory(districtName) {
    const district = onlineWorldState.cityDistricts[districtName];
    if (!district) return;
    
    // Check if player has resources to attack
    const playerGangSize = player.gangMembers || 0;
    const playerCars = (player.garage && player.garage.length) || 0;
    const playerWeapons = (player.inventory && player.inventory.filter(i => i.type === 'weapon').length) || 0;
    
    const baseCost = 50000; // Base cost to attack
    const attackCost = baseCost + (district.defenseRating * 100);
    
    const canAfford = player.money >= attackCost;
    
    const challengeHTML = `
        <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #8b0000;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 3em; margin-bottom: 15px;">⚔️</div>
                <h2 style="color: #e74c3c; font-family: 'Georgia', serif; margin: 0; font-size: 2em;">CHALLENGE FOR TERRITORY</h2>
                <div style="color: #aaa; margin-top: 10px; font-size: 1.1em; text-transform: uppercase;">
                    ${districtName}
                </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #8b0000;">
                <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">💰 Attack Cost</h3>
                <div style="text-align: center;">
                    <div style="font-size: 2.5em; color: ${canAfford ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                        $${attackCost.toLocaleString()}
                    </div>
                    <div style="color: #888; margin-top: 5px;">
                        ${canAfford ? '✓ You can afford this' : '✗ Not enough money'}
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">⚡ Assign Attack Force</h3>
                <div style="margin-bottom: 15px;">
                    <label style="color: #ccc; display: block; margin-bottom: 5px;">👤 Gang Members (You have: ${playerGangSize})</label>
                    <input type="number" id="attack-members" min="0" max="${playerGangSize}" value="0" 
                           style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 5px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="color: #ccc; display: block; margin-bottom: 5px;">🚗 Vehicles (You have: ${playerCars})</label>
                    <input type="number" id="attack-cars" min="0" max="${playerCars}" value="0" 
                           style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 5px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="color: #ccc; display: block; margin-bottom: 5px;">🔫 Weapons (You have: ${playerWeapons})</label>
                    <input type="number" id="attack-weapons" min="0" max="${playerWeapons}" value="0" 
                           style="width: 100%; padding: 10px; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 5px;">
                </div>
            </div>
            
            <div style="background: rgba(231, 76, 60, 0.1); padding: 20px; border-radius: 8px; border: 2px solid #e74c3c; margin: 25px 0;">
                <h4 style="color: #e74c3c; margin: 0 0 10px 0;">⚠️ WARNING</h4>
                <p style="color: #ccc; margin: 0; font-size: 0.95em;">
                    Any gang members, cars, or weapons you assign to this attack may be lost if you fail. 
                    The stronger your attack force, the better your chances of victory.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <button onclick="executeTerritoryBattle('${districtName}')" 
                        ${!canAfford ? 'disabled' : ''}
                        style="background: ${canAfford ? 'linear-gradient(180deg, #8b0000 0%, #5a0000 100%)' : '#444'}; 
                               color: ${canAfford ? '#ffffff' : '#666'}; 
                               padding: 15px 35px; 
                               border: 1px solid ${canAfford ? '#ff0000' : '#555'}; 
                               border-radius: 10px; 
                               cursor: ${canAfford ? 'pointer' : 'not-allowed'}; 
                               font-family: 'Georgia', serif; 
                               font-weight: bold; 
                               margin-right: 15px; 
                               font-size: 1.1em;">
                    ⚔️ Launch Attack
                </button>
                <button onclick="viewTerritoryDetails('${districtName}')" 
                        style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    ← Back
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("multiplayer-content").innerHTML = challengeHTML;
}

// Execute territory battle
function executeTerritoryBattle(districtName) {
    const district = onlineWorldState.cityDistricts[districtName];
    if (!district) return;
    
    // Get attack force from inputs
    const attackMembers = parseInt(document.getElementById('attack-members').value) || 0;
    const attackCars = parseInt(document.getElementById('attack-cars').value) || 0;
    const attackWeapons = parseInt(document.getElementById('attack-weapons').value) || 0;
    
    // Calculate costs
    const baseCost = 50000;
    const attackCost = baseCost + (district.defenseRating * 100);
    
    // Validate resources
    const playerGangSize = player.gangMembers || 0;
    const playerCars = (player.garage && player.garage.length) || 0;
    const playerWeapons = (player.inventory && player.inventory.filter(i => i.type === 'weapon').length) || 0;
    
    if (player.money < attackCost) {
        alert('Not enough money to launch this attack!');
        return;
    }
    
    if (attackMembers > playerGangSize || attackCars > playerCars || attackWeapons > playerWeapons) {
        alert('You don\'t have enough resources!');
        return;
    }
    
    // Pay attack cost
    player.money -= attackCost;
    
    // Calculate attack power
    const playerSkillPower = (player.level * 10) + 
                            (player.skills.stealth * 8) + 
                            (player.skills.firearms * 12) + 
                            (player.skills.intelligence * 6) + 
                            (player.skills.power * 2);
    
    const attackForce = playerSkillPower + 
                       (attackMembers * 10) + 
                       (attackCars * 5) + 
                       (attackWeapons * 8);
    
    // Calculate defense power
    const defenseForce = district.defenseRating + 
                        (district.assignedMembers * 10) + 
                        (district.assignedCars * 5) + 
                        (district.assignedWeapons * 8);
    
    // Determine outcome (attack force vs defense force)
    const powerRatio = attackForce / defenseForce;
    let successChance = 0;
    
    if (powerRatio >= 2.0) successChance = 75;
    else if (powerRatio >= 1.5) successChance = 60;
    else if (powerRatio >= 1.2) successChance = 45;
    else if (powerRatio >= 1.0) successChance = 35;
    else if (powerRatio >= 0.8) successChance = 25;
    else if (powerRatio >= 0.5) successChance = 15;
    else successChance = 8;
    
    const success = Math.random() * 100 < successChance;
    
    // Calculate losses
    let membersLost = 0;
    let carsLost = 0;
    let weaponsLost = 0;
    
    if (success) {
        // Victory - light losses
        membersLost = Math.floor(attackMembers * (Math.random() * 0.3)); // 0-30% losses
        carsLost = Math.floor(attackCars * (Math.random() * 0.2)); // 0-20% losses
        weaponsLost = Math.floor(attackWeapons * (Math.random() * 0.25)); // 0-25% losses
        
        // Take over territory
        district.controllerType = 'player';
        district.controlledBy = player.name;
        district.assignedMembers = attackMembers - membersLost;
        district.assignedCars = attackCars - carsLost;
        district.assignedWeapons = attackWeapons - weaponsLost;
        
    } else {
        // Defeat - heavy losses
        membersLost = Math.floor(attackMembers * (0.5 + Math.random() * 0.5)); // 50-100% losses
        carsLost = Math.floor(attackCars * (0.4 + Math.random() * 0.4)); // 40-80% losses
        weaponsLost = Math.floor(attackWeapons * (0.5 + Math.random() * 0.5)); // 50-100% losses
    }
    
    // Apply losses to player
    if (player.gangMembers) player.gangMembers -= membersLost;
    
    // Remove lost cars
    if (player.garage && carsLost > 0) {
        for (let i = 0; i < carsLost; i++) {
            if (player.garage.length > 0) {
                player.garage.splice(Math.floor(Math.random() * player.garage.length), 1);
            }
        }
    }
    
    // Remove lost weapons
    if (player.inventory && weaponsLost > 0) {
        const weapons = player.inventory.filter(i => i.type === 'weapon');
        for (let i = 0; i < weaponsLost; i++) {
            if (weapons.length > 0) {
                const weaponToRemove = weapons[Math.floor(Math.random() * weapons.length)];
                const index = player.inventory.indexOf(weaponToRemove);
                if (index > -1) player.inventory.splice(index, 1);
                weapons.splice(weapons.indexOf(weaponToRemove), 1);
            }
        }
    }
    
    // Show narrative battle results
    showTerritoryBattleResults(success, districtName, district, attackCost, {
        attackForce,
        defenseForce,
        successChance,
        membersLost,
        carsLost,
        weaponsLost,
        attackMembers,
        attackCars,
        attackWeapons
    });
}

// Show territory battle results
function showTerritoryBattleResults(success, districtName, district, cost, battleStats) {
    let resultHTML;
    
    if (success) {
        // Victory
        resultHTML = `
            <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #27ae60;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">👑</div>
                    <h2 style="color: #27ae60; font-family: 'Georgia', serif; margin: 0; font-size: 2em;">TERRITORY CONQUERED!</h2>
                    <div style="color: #aaa; margin-top: 10px; font-size: 1.3em; text-transform: uppercase;">
                        ${districtName} is now yours
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #27ae60;">
                    <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">⚔️ Battle Report</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: rgba(39, 174, 96, 0.1); border-radius: 5px;">
                            <div style="color: #27ae60; font-size: 1.8em; font-weight: bold;">${battleStats.attackForce}</div>
                            <div style="color: #ccc; margin-top: 5px;">Your Force</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <div style="color: #e74c3c; font-size: 1.8em; font-weight: bold;">${battleStats.defenseForce}</div>
                            <div style="color: #ccc; margin-top: 5px;">Enemy Defense</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 15px; padding: 12px; background: rgba(192, 160, 98, 0.1); border-radius: 5px;">
                        <div style="color: #c0a062;">Success Chance: <span style="font-weight: bold;">${battleStats.successChance}%</span></div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #555;">
                    <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">💀 Casualties</h3>
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 1.8em; color: ${battleStats.membersLost > 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                                ${battleStats.membersLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Gang Members Lost</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">${battleStats.attackMembers - battleStats.membersLost} survived</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; color: ${battleStats.carsLost > 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                                ${battleStats.carsLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Vehicles Lost</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">${battleStats.attackCars - battleStats.carsLost} survived</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; color: ${battleStats.weaponsLost > 0 ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
                                ${battleStats.weaponsLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Weapons Lost</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">${battleStats.attackWeapons - battleStats.weaponsLost} survived</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(39, 174, 96, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #27ae60; margin: 25px 0;">
                    <h4 style="color: #27ae60; margin: 0 0 10px 0; font-family: 'Georgia', serif;">💰 Territory Rewards</h4>
                    <p style="color: #ccc; margin: 0; font-size: 1.1em;">
                        Weekly Income: <span style="color: #27ae60; font-weight: bold; font-size: 1.2em;">$${district.weeklyIncome.toLocaleString()}</span>
                    </p>
                    <p style="color: #888; margin: 5px 0 0 0; font-size: 0.9em;">
                        This territory will generate income every week you hold it.
                    </p>
                </div>
                
                <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                    <p style="color: #ff6666; margin: 0; font-family: 'Georgia', serif; font-style: italic;">
                        "Word on the street: ${player.name || 'The new Don'} just took ${districtName}. The old crew? Scattered like rats."
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="showOnlineWorld()" 
                            style="background: linear-gradient(180deg, #27ae60 0%, #1e8449 100%); color: #ffffff; padding: 15px 35px; border: 1px solid #2ecc71; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; font-size: 1.1em;">
                        🏛️ View Your Empire
                    </button>
                </div>
            </div>
        `;
    } else {
        // Defeat
        resultHTML = `
            <div style="background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 15px; border: 3px solid #8b0000;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 3em; margin-bottom: 15px;">💥</div>
                    <h2 style="color: #e74c3c; font-family: 'Georgia', serif; margin: 0; font-size: 2em;">ATTACK FAILED</h2>
                    <div style="color: #aaa; margin-top: 10px; font-size: 1.1em;">
                        Your forces were crushed defending ${districtName}
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #8b0000;">
                    <h3 style="color: #c0a062; margin: 0 0 20px 0; font-family: 'Georgia', serif;">⚔️ Battle Report</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: rgba(231, 76, 60, 0.1); border-radius: 5px;">
                            <div style="color: #e74c3c; font-size: 1.8em; font-weight: bold;">${battleStats.attackForce}</div>
                            <div style="color: #ccc; margin-top: 5px;">Your Force</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(39, 174, 96, 0.1); border-radius: 5px;">
                            <div style="color: #27ae60; font-size: 1.8em; font-weight: bold;">${battleStats.defenseForce}</div>
                            <div style="color: #ccc; margin-top: 5px;">Enemy Defense</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 15px; padding: 12px; background: rgba(139, 0, 0, 0.2); border-radius: 5px;">
                        <div style="color: #e74c3c;">Success Chance: <span style="font-weight: bold;">${battleStats.successChance}%</span></div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.7); padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #8b0000;">
                    <h3 style="color: #e74c3c; margin: 0 0 20px 0; font-family: 'Georgia', serif;">💀 Heavy Losses</h3>
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                ${battleStats.membersLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Gang Members Killed</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">of ${battleStats.attackMembers} sent</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                ${battleStats.carsLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Vehicles Destroyed</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">of ${battleStats.attackCars} sent</div>
                        </div>
                        <div>
                            <div style="font-size: 1.8em; color: #e74c3c; font-weight: bold;">
                                ${battleStats.weaponsLost}
                            </div>
                            <div style="color: #888; font-size: 0.85em;">Weapons Lost</div>
                            <div style="color: #666; font-size: 0.75em; margin-top: 3px;">of ${battleStats.attackWeapons} sent</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(139, 0, 0, 0.3); padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #8b0000;">
                    <h4 style="color: #ff6666; margin: 0 0 10px 0; font-family: 'Georgia', serif;">💸 Total Cost</h4>
                    <div style="text-align: center;">
                        <div style="font-size: 2em; color: #e74c3c; font-weight: bold;">-$${cost.toLocaleString()}</div>
                        <div style="color: #888; margin-top: 5px;">Attack cost (not refunded)</div>
                    </div>
                </div>
                
                <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 8px; border-left: 4px solid #8b0000; margin: 25px 0;">
                    <p style="color: #ff6666; margin: 0; font-family: 'Georgia', serif; font-style: italic;">
                        "You got cocky. ${district.controllerType === 'npc' ? district.npcGang : district.controlledBy} was ready. Your crew paid the price."
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="viewTerritoryDetails('${districtName}')" 
                            style="background: linear-gradient(180deg, #8b0000 0%, #5a0000 100%); color: #ffffff; padding: 15px 35px; border: 1px solid #ff0000; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; margin-right: 15px;">
                        🔄 Try Again
                    </button>
                    <button onclick="showOnlineWorld()" 
                            style="background: #333; color: #c0a062; padding: 15px 35px; border: 1px solid #c0a062; border-radius: 10px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                        🏠 Return to Commission
                    </button>
                </div>
            </div>
        `;
    }
    
    document.getElementById("multiplayer-content").innerHTML = resultHTML;
    
    // Update UI
    if (typeof updateUI === 'function') updateUI();
    
    // Log the action
    if (typeof logAction === 'function') {
        if (success) {
            logAction(`👑 Conquered ${districtName}! Lost ${battleStats.membersLost} members, ${battleStats.carsLost} cars, ${battleStats.weaponsLost} weapons. Earning $${district.weeklyIncome.toLocaleString()}/week.`);
        } else {
            logAction(`💥 Failed to take ${districtName}. Lost ${battleStats.membersLost} members, ${battleStats.carsLost} cars, ${battleStats.weaponsLost} weapons, and $${cost.toLocaleString()}.`);
        }
    }
}

// Keep compatibility with existing game integration
// ==================== MULTIPLAYER TERRITORY INCOME & RESET ====================

// Reset a player's controlled territories back to NPC control
function resetPlayerTerritories(playerName) {
    Object.keys(onlineWorldState.cityDistricts).forEach(district => {
        const data = onlineWorldState.cityDistricts[district];
        if (data.controllerType === 'player' && data.controlledBy === playerName) {
            data.controllerType = 'npc';
            data.controlledBy = '';
            data.assignedMembers = 0;
            data.assignedCars = 0;
            data.assignedWeapons = 0;
        }
    });
}

// Sync multiplayer territories to player.territories for unified UI
function syncMultiplayerTerritoriesToPlayer() {
    if (!player.territories) player.territories = [];
    
    // Clear existing multiplayer territories (keep single-player ones)
    player.territories = player.territories.filter(t => !t.isMultiplayer);
    
    // Add current multiplayer territories
    Object.keys(onlineWorldState.cityDistricts).forEach(district => {
        const data = onlineWorldState.cityDistricts[district];
        if (data.controllerType === 'player' && data.controlledBy === player.name) {
            player.territories.push({
                id: `mp_${district}`,
                districtId: district,
                isMultiplayer: true,
                defenseLevel: Math.floor(data.defenseRating / 50),
                weeklyIncome: data.weeklyIncome,
                acquisitionDate: Date.now()
            });
        }
    });
    
    // Update territory income display
    if (typeof updateUI === 'function') updateUI();
}

// Calculate total weekly income from player-controlled multiplayer territories
function calculateMultiplayerTerritoryWeeklyIncome() {
    let total = 0;
    Object.keys(onlineWorldState.cityDistricts).forEach(district => {
        const data = onlineWorldState.cityDistricts[district];
        if (data.controllerType === 'player' && data.controlledBy === player.name) {
            total += (data.weeklyIncome || 0);
        }
    });
    return total;
}

// Count controlled territories
function countControlledTerritories() {
    let count = 0;
    Object.keys(onlineWorldState.cityDistricts).forEach(district => {
        const data = onlineWorldState.cityDistricts[district];
        if (data.controllerType === 'player' && data.controlledBy === player.name) {
            count++;
        }
    });
    return count;
}

// Grant income periodically (dev cadence: every 10 minutes == 1 game week)
const MULTI_TERRITORY_WEEK_MS = 10 * 60 * 1000;
let multiplayerTerritoryIncomeTimer = null;
let territoryIncomeNextCollection = Date.now() + MULTI_TERRITORY_WEEK_MS;
let territoryIncomeCountdownInterval = null;

function startMultiplayerTerritoryIncomeTimer() {
    if (multiplayerTerritoryIncomeTimer) return;
    
    territoryIncomeNextCollection = Date.now() + MULTI_TERRITORY_WEEK_MS;
    
    multiplayerTerritoryIncomeTimer = setInterval(() => {
        const income = calculateMultiplayerTerritoryWeeklyIncome();
        if (income > 0) {
            // Add as DIRTY money (territory income is illicit)
            player.dirtyMoney = (player.dirtyMoney || 0) + income;
            logAction(`🏛️ Territory income collected: $${income.toLocaleString()} (dirty) from controlled districts.`);
            if (typeof updateUI === 'function') updateUI();
        }
        territoryIncomeNextCollection = Date.now() + MULTI_TERRITORY_WEEK_MS;
    }, MULTI_TERRITORY_WEEK_MS);
    
    // Start countdown display updater
    startTerritoryIncomeCountdown();
}

function startTerritoryIncomeCountdown() {
    if (territoryIncomeCountdownInterval) return;
    
    territoryIncomeCountdownInterval = setInterval(() => {
        const countdownEl = document.getElementById('income-countdown');
        const controlledCountEl = document.getElementById('controlled-count');
        const weeklyIncomeEl = document.getElementById('weekly-income-total');
        
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
    }, 1000);
}

// Start timer after DOM load if multiplayer initialized
document.addEventListener('DOMContentLoaded', () => {
    startMultiplayerTerritoryIncomeTimer();
});

// Expose helper functions
window.resetPlayerTerritories = resetPlayerTerritories;
window.syncMultiplayerTerritoriesToPlayer = syncMultiplayerTerritoriesToPlayer;
window.calculateMultiplayerTerritoryWeeklyIncome = calculateMultiplayerTerritoryWeeklyIncome;
window.countControlledTerritories = countControlledTerritories;
window.startMultiplayerTerritoryIncomeTimer = startMultiplayerTerritoryIncomeTimer;
window.startTerritoryIncomeCountdown = startTerritoryIncomeCountdown;
function showMultiplayer() {
    showOnlineWorld();
}

// Initialize online world when game loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Multiplayer DOM loaded, initializing...');
    initializeOnlineWorld();
});

// Make functions globally available immediately
window.showGlobalChat = showGlobalChat;
window.showOnlineWorld = showOnlineWorld;
window.showMultiplayer = showMultiplayer;
window.showPVP = showPVP;
window.testGlobalFunctions = testGlobalFunctions; // Add debug function
window.connectMultiplayerAfterGame = connectMultiplayerAfterGame; // Add connection function
// Territory conquest functions
window.viewTerritoryDetails = viewTerritoryDetails;
window.challengeForTerritory = challengeForTerritory;
window.executeTerritoryBattle = executeTerritoryBattle;

// Also make them available after a slight delay to ensure everything is loaded
setTimeout(() => {
    window.showGlobalChat = showGlobalChat;
    window.showOnlineWorld = showOnlineWorld;
    window.showMultiplayer = showMultiplayer;
    window.showPVP = showPVP;
    window.testGlobalFunctions = testGlobalFunctions;
    window.viewTerritoryDetails = viewTerritoryDetails;
    window.challengeForTerritory = challengeForTerritory;
    window.executeTerritoryBattle = executeTerritoryBattle;
    console.log('Global functions assigned:', {
        showGlobalChat: typeof window.showGlobalChat,
        showOnlineWorld: typeof window.showOnlineWorld,
        showMultiplayer: typeof window.showMultiplayer,
        showPVP: typeof window.showPVP,
        testGlobalFunctions: typeof window.testGlobalFunctions,
        viewTerritoryDetails: typeof window.viewTerritoryDetails,
        challengeForTerritory: typeof window.challengeForTerritory,
        executeTerritoryBattle: typeof window.executeTerritoryBattle
    });
}, 100);

// Export functions for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showOnlineWorld,
        showGlobalChat,
        showMultiplayer,
        onlineWorldState,
        onlineWorld
    };
}
