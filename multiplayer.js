// ==================== ONLINE WORLD SYSTEM ====================

// Online world configuration
const onlineWorld = {
    maxPlayersPerServer: 100,
    serverUrl: 'wss://a6685efdc4b7.ngrok-free.app', // Updated ngrok tunnel for online testing
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
        serverName: 'From Dusk to Don - Main Server',
        cityEvents: [],
        globalLeaderboard: []
    },
    nearbyPlayers: [],
    globalChat: [],
    cityDistricts: {
        downtown: { controlledBy: null, crimeLevel: 50 },
        docks: { controlledBy: null, crimeLevel: 75 },
        suburbs: { controlledBy: null, crimeLevel: 25 },
        industrial: { controlledBy: null, crimeLevel: 60 },
        redlight: { controlledBy: null, crimeLevel: 90 }
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
                messageDiv.innerHTML = `<strong style="color: ${chatMessage.color};">${chatMessage.player}:</strong> ${chatMessage.message} <small style="color: #95a5a6; float: right;">${chatMessage.time}</small>`;
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
                showSystemMessage(jailbreakMsg, message.success ? '#2ecc71' : '#e74c3c');
            }
            break;
            
        case 'player_arrested':
            // Notify when another player gets arrested
            const arrestMsg = `🚔 ${message.playerName} was arrested and sent to jail!`;
            addWorldEvent(arrestMsg);
            
            if (document.getElementById('global-chat-area')) {
                showSystemMessage(arrestMsg, '#e74c3c');
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
    
    let jailHTML = '<h4 style="color: #e74c3c; margin: 0 0 15px 0;">🔒 Players in Jail</h4>';
    
    const playersInJail = Object.values(onlineWorldState.playerStates || {}).filter(p => p.inJail);
    
    if (playersInJail.length === 0) {
        jailHTML += '<div style="color: #95a5a6; font-style: italic; text-align: center;">No players currently in jail</div>';
    } else {
        playersInJail.forEach(prisoner => {
            const timeLeft = Math.max(0, Math.ceil(prisoner.jailTime));
            jailHTML += `
                <div style="background: rgba(231, 76, 60, 0.2); padding: 10px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #e74c3c;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #e74c3c;">${prisoner.name}</strong>
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
    
    let playersHTML = '<h4 style="color: #3498db; margin: 0 0 15px 0;">👥 Online Players</h4>';
    
    const onlinePlayers = Object.values(onlineWorldState.playerStates || {});
    
    if (onlinePlayers.length === 0) {
        playersHTML += '<div style="color: #95a5a6; font-style: italic; text-align: center;">Loading player list...</div>';
    } else {
        onlinePlayers.forEach(player => {
            const statusIcon = player.inJail ? '🔒' : '🟢';
            const statusText = player.inJail ? 'In Jail' : 'Free';
            const statusColor = player.inJail ? '#e74c3c' : '#2ecc71';
            
            playersHTML += `
                <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; margin: 8px 0; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: ${player.playerId === onlineWorldState.playerId ? '#2ecc71' : '#ecf0f1'};">
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
        messageDiv.innerHTML = `<strong style="color: ${color};">System:</strong> ${message} <small style="color: #95a5a6; float: right;">${new Date().toLocaleTimeString()}</small>`;
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
            <h2>💬 Global Chat</h2>
            <p>Chat with players from around the criminal underworld in real-time!</p>
            
            <!-- Connection Status -->
            <div id="chat-connection-status" style="background: rgba(44, 62, 80, 0.8); padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                ${getConnectionStatusHTML()}
            </div>
            
            <!-- Chat Area -->
            <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #9b59b6; margin-bottom: 20px;">
                <div id="global-chat-area" style="height: 400px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #7f8c8d;">
                    ${generateChatHTML()}
                </div>
                
                <!-- Chat Input -->
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="chat-input" placeholder="Type your message..." 
                           style="flex: 1; padding: 12px; border: 2px solid #9b59b6; border-radius: 8px; background: rgba(52, 73, 94, 0.8); color: white; font-size: 14px;"
                           onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()" 
                            style="padding: 12px 20px; background: linear-gradient(45deg, #9b59b6, #8e44ad); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        💬 Send
                    </button>
                </div>
                
                <!-- Quick Chat Options -->
                <div style="margin-top: 15px;">
                    <h4 style="color: #9b59b6; margin-bottom: 10px;">⚡ Quick Chat</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                        <button onclick="sendQuickChat('Hey there!')" style="padding: 8px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">👋 Hey there!</button>
                        <button onclick="sendQuickChat('Anyone up for a job?')" style="padding: 8px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">💼 Looking for work</button>
                        <button onclick="sendQuickChat('Need backup!')" style="padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🚨 Need backup!</button>
                        <button onclick="sendQuickChat('GG everyone!')" style="padding: 8px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🎯 GG everyone!</button>
                        <button onclick="sendQuickChat('Anyone in jail need a breakout?')" style="padding: 8px; background: #9b59b6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🔓 Offering jailbreak</button>
                        <button onclick="sendQuickChat('Thanks for the help!')" style="padding: 8px; background: #1abc9c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">🙏 Thanks!</button>
                    </div>
                </div>
            </div>
            
            <!-- Online Players List -->
            <div style="background: rgba(44, 62, 80, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="color: #3498db; margin-bottom: 10px;">👥 Players Online</h4>
                <div id="chat-player-list" style="max-height: 150px; overflow-y: auto;">
                    ${generateOnlinePlayersHTML()}
                </div>
            </div>
            
            <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: bold;">
                🏠 Back to Main Menu
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
            mobileBackBtn.style.cssText = 'position: fixed; top: 10px; left: 10px; background: #e74c3c; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; z-index: 1000;';
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
            <strong style="color: ${msg.color};">${msg.player}:</strong> ${msg.message} 
            <small style="color: #95a5a6; float: right;">${msg.time}</small>
        </div>
    `).join('');
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
        addChatMessage(playerName, message, '#3498db');
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
        addChatMessage(player.name || 'You', message, '#3498db');
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
        return `<span style="color: #2ecc71;">🟢 Connected to Global Chat</span>`;
    } else {
        return `<span style="color: #e74c3c;">🔴 Connecting to Chat...</span>`;
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
    let worldHTML = `
        <h2>🌐 Online World</h2>
        <p>Welcome to the persistent criminal underworld! Compete and cooperate with players worldwide.</p>
        
        <!-- Connection Status -->
        <div id="world-connection-status" style="background: rgba(44, 62, 80, 0.8); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <!-- Status content will be updated by updateConnectionStatus() -->
        </div>
        
        <!-- Online Players & Jail Status -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            
            <!-- Online Players List -->
            <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #3498db;">
                <div id="online-player-list">
                    <h4 style="color: #3498db; margin: 0 0 15px 0;">👥 Online Players</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Loading players...</div>
                </div>
            </div>
            
            <!-- Players in Jail -->
            <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #e74c3c;">
                <div id="online-jail-status">
                    <h4 style="color: #e74c3c; margin: 0 0 15px 0;">🔒 Players in Jail</h4>
                    <div style="color: #95a5a6; font-style: italic; text-align: center;">Loading jail status...</div>
                </div>
            </div>
        </div>
        
        <!-- World Overview -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            
            <!-- City Districts -->
            <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #f39c12;">
                <h3 style="color: #f39c12; text-align: center; margin-bottom: 15px;">🏙️ City Districts</h3>
                <div id="city-districts">
                    ${Object.keys(onlineWorldState.cityDistricts).map(district => {
                        const districtData = onlineWorldState.cityDistricts[district];
                        return `
                            <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; margin: 8px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${district.charAt(0).toUpperCase() + district.slice(1)}</strong>
                                    <br><small>Crime Level: ${districtData.crimeLevel}%</small>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: ${districtData.controlledBy ? '#2ecc71' : '#95a5a6'};">
                                        ${districtData.controlledBy || 'Unclaimed'}
                                    </div>
                                    <button onclick="exploreDistrict('${district}')" style="background: #3498db; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                                        Explore
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Global Leaderboard -->
            <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #2ecc71;">
                <h3 style="color: #2ecc71; text-align: center; margin-bottom: 15px;">🏆 Global Leaderboard</h3>
                <div id="global-leaderboard">
                    <div style="color: #95a5a6; text-align: center; font-style: italic;">
                        Loading rankings...
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Online Activities -->
        <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 15px; border: 2px solid #2ecc71; margin: 20px 0;">
            <h3 style="color: #2ecc71; text-align: center; margin-bottom: 15px;">⚡ Live Activities</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <button onclick="showGlobalChat()" style="background: #3498db; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    💬 Global Chat<br><small>Talk with all players</small>
                </button>
                <button onclick="showActiveHeists()" style="background: #e74c3c; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    💰 Active Heists<br><small>Join ongoing heists</small>
                </button>
                <button onclick="showTradeMarket()" style="background: #1abc9c; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    🛒 Trade Market<br><small>Buy/sell with players</small>
                </button>
                <button onclick="showGangWars()" style="background: #8e44ad; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    ⚔️ Gang Wars<br><small>Territory battles</small>
                </button>
                <button onclick="showNearbyPlayers()" style="background: #f39c12; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    👥 Nearby Players<br><small>Players in your area</small>
                </button>
                <button onclick="showCityEvents()" style="background: #9b59b6; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer;">
                    🎯 City Events<br><small>Special opportunities</small>
                </button>
            </div>
        </div>
        
        <!-- Quick Chat Access -->
        <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #3498db;">
            <h4 style="color: #3498db; margin: 0 0 10px 0;">💬 Quick Chat</h4>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="quick-chat-input" placeholder="Send a message to all players..." 
                       style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid #bdc3c7;"
                       onkeypress="if(event.key==='Enter') sendQuickChatMessage()" maxlength="200">
                <button onclick="sendQuickChatMessage()" style="background: #3498db; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    Send
                </button>
            </div>
            <div style="margin-top: 10px; max-height: 120px; overflow-y: auto; background: rgba(0, 0, 0, 0.2); padding: 8px; border-radius: 5px;">
                <div id="quick-chat-messages">
                    ${onlineWorldState.globalChat.slice(-3).map(msg => `
                        <div style="margin: 4px 0; font-size: 0.9em;">
                            <strong style="color: ${msg.color || '#3498db'};">${msg.player}:</strong> ${msg.message}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Recent World Activity -->
        <div style="background: rgba(44, 62, 80, 0.6); padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h3>📊 Recent World Activity</h3>
            <div id="world-activity-feed" style="height: 200px; overflow-y: auto; background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
                <div style="color: #95a5a6; font-style: italic;">Loading world events...</div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <button onclick="goBackToMainMenu()" 
                    style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
                           border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;">
                🏠 Back to Main Menu
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
                    <h4 style="color: #2ecc71;">✅ Connected to Online World</h4>
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px; max-width: 600px; margin: 20px auto;">
            <h3 style="color: #e74c3c;">🏙️ ${districtName.charAt(0).toUpperCase() + districtName.slice(1)} District</h3>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><strong>Crime Level:</strong> ${district.crimeLevel}%</div>
                    <div><strong>Controlled By:</strong> ${district.controlledBy || 'No one'}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0;">
                <button onclick="doDistrictJob('${districtName}')" style="background: #3498db; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
                    💼 Find Jobs
                </button>
                <button onclick="claimTerritory('${districtName}')" style="background: #e74c3c; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
                    🏛️ Claim Territory
                </button>
                <button onclick="findPlayersInDistrict('${districtName}')" style="background: #f39c12; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
                    👥 Find Players
                </button>
                <button onclick="startDistrictHeist('${districtName}')" style="background: #8e44ad; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">
                    💰 Start Heist
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back to World Overview
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
        newEvent.innerHTML = `${event} <small style="color: #95a5a6; float: right;">Just now</small>`;
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
                <strong style="color: ${msg.color || '#3498db'};">${msg.player}:</strong> ${msg.message}
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
        messageDiv.innerHTML = `<strong style="color: ${response.color};">${response.player}:</strong> ${response.message} <small style="color: #95a5a6; float: right;">${response.time}</small>`;
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <h3>👥 Players in ${districtName.charAt(0).toUpperCase() + districtName.slice(1)}</h3>
            <div style="margin: 20px 0;">
                ${playersInDistrict.map(p => `
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${p.name}</strong> (Level ${p.level})
                            <br><small>Rep: ${p.reputation} | Territory: ${p.territory}</small>
                        </div>
                        <div>
                            <button onclick="challengePlayer('${p.name}')" style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 2px;">
                                ⚔️ Challenge
                            </button>
                            <button onclick="tradeWithPlayer('${p.name}')" style="background: #1abc9c; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 2px;">
                                🤝 Trade
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center;">
                <button onclick="exploreDistrict('${districtName}')" style="background: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #e74c3c;">💰 Active Heists</h3>
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.activeHeists.length === 0 ? `
                    <div style="text-align: center; color: #95a5a6; font-style: italic; padding: 40px;">
                        No active heists at the moment. Start one in a district!
                    </div>
                ` : onlineWorldState.activeHeists.map(heist => `
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; margin: 10px 0; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #e74c3c; margin: 0;">${heist.target}</h4>
                                <p style="margin: 5px 0;">Organized by: <strong>${heist.organizer}</strong></p>
                                <div style="display: flex; gap: 20px; font-size: 0.9em;">
                                    <span>👥 ${heist.participants}/${heist.maxParticipants}</span>
                                    <span>🎯 ${heist.difficulty}</span>
                                    <span>💰 $${heist.reward.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                ${heist.organizer === (player.name || 'You') ? `
                                    <button onclick="manageHeist('${heist.id}')" style="background: #f39c12; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;">
                                        ⚙️ Manage
                                    </button>
                                ` : `
                                    <button onclick="joinHeist('${heist.id}')" style="background: #2ecc71; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer;" ${heist.participants >= heist.maxParticipants ? 'disabled' : ''}>
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #1abc9c;">🛒 Player Trade Market</h3>
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px;">
                    <h4>🛍️ Buy from Players</h4>
                    <div style="margin: 15px 0;">
                        <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div><strong>Bulletproof Vest</strong><br><small>Seller: CrimeBoss42</small></div>
                            <div><button onclick="buyFromPlayer('vest', 2500)" style="background: #2ecc71; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">$2,500</button></div>
                        </div>
                        <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div><strong>Tommy Gun</strong><br><small>Seller: ShadowDealer</small></div>
                            <div><button onclick="buyFromPlayer('tommy', 15000)" style="background: #2ecc71; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">$15,000</button></div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px;">
                    <h4>💰 Sell to Players</h4>
                    <div style="margin: 15px 0;">
                        <p>List your items for other players to buy:</p>
                        <button onclick="listItemForSale()" style="background: #f39c12; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #8e44ad;">⚔️ Gang Wars</h3>
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back
                </button>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin: 20px 0;">
                <h4>🏛️ Territory Battles</h4>
                <p>Fight other players for control of city districts. Winners gain territory and reputation.</p>
                
                <div style="margin: 15px 0;">
                    <div style="background: rgba(142, 68, 173, 0.3); padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>Downtown District War</strong>
                                <br><small>CrimeBoss42 vs ShadowDealer</small>
                            </div>
                            <button onclick="spectateWar('downtown')" style="background: #3498db; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                👁️ Spectate
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: rgba(142, 68, 173, 0.3); padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>Docks District</strong>
                                <br><small>Challenge the current owner</small>
                            </div>
                            <button onclick="challengeForTerritory('docks')" style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #f39c12;">👥 Nearby Players</h3>
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.nearbyPlayers.map(p => `
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; margin: 10px 0; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #f39c12; margin: 0;">${p.name}</h4>
                                <div style="display: flex; gap: 20px; font-size: 0.9em; margin: 5px 0;">
                                    <span>Level ${p.level}</span>
                                    <span>Rep: ${p.reputation}</span>
                                    <span>Territory: ${p.territory}</span>
                                    <span style="color: #2ecc71;">● Online</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="challengePlayer('${p.name}')" style="background: #e74c3c; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                    ⚔️ Challenge
                                </button>
                                <button onclick="tradeWithPlayer('${p.name}')" style="background: #1abc9c; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">
                                    🤝 Trade
                                </button>
                                <button onclick="inviteToHeist('${p.name}')" style="background: #8e44ad; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer;">
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
        <div style="background: rgba(44, 62, 80, 0.9); padding: 20px; border-radius: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #9b59b6;">🎯 City Events</h3>
                <button onclick="showOnlineWorld()" style="background: #95a5a6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                    ← Back
                </button>
            </div>
            
            <div style="margin: 20px 0;">
                ${onlineWorldState.serverInfo.cityEvents.map(event => `
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; margin: 10px 0; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #9b59b6; margin: 0;">${event.type.replace('_', ' ').toUpperCase()}</h4>
                                <p style="margin: 5px 0;">${event.description}</p>
                                <small>District: ${event.district.charAt(0).toUpperCase() + event.district.slice(1)}</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #f39c12; font-weight: bold;">⏰ ${event.timeLeft}</div>
                                <button onclick="participateInEvent('${event.type}', '${event.district}')" style="background: #9b59b6; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                                    🎯 Participate
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
    alert(`👁️ Spectating gang war in ${district}... (Real-time battle view would show here)`);
}

function challengeForTerritory(district) {
    alert(`⚔️ Challenging for ${district} territory... (PvP battle system would activate here)`);
}

function participateInEvent(eventType, district) {
    alert(`🎯 Participating in ${eventType.replace('_', ' ')} event in ${district}...`);
    logAction(`🎯 Joined city event: ${eventType} in ${district}`);
}

// Keep compatibility with existing game integration
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
window.testGlobalFunctions = testGlobalFunctions; // Add debug function
window.connectMultiplayerAfterGame = connectMultiplayerAfterGame; // Add connection function

// Also make them available after a slight delay to ensure everything is loaded
setTimeout(() => {
    window.showGlobalChat = showGlobalChat;
    window.showOnlineWorld = showOnlineWorld;
    window.showMultiplayer = showMultiplayer;
    window.testGlobalFunctions = testGlobalFunctions;
    console.log('Global functions assigned:', {
        showGlobalChat: typeof window.showGlobalChat,
        showOnlineWorld: typeof window.showOnlineWorld,
        showMultiplayer: typeof window.showMultiplayer,
        testGlobalFunctions: typeof window.testGlobalFunctions
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
