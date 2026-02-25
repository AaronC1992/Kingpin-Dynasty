// ==================== THE COMMISSION SYSTEM ====================

// Online world configuration
const onlineWorld = {
    maxPlayersPerServer: 100,
    // WebSocket server URL
    // Local dev -> ws://localhost:3000
    // Production -> Render.com hosted server (or override via window.__MULTIPLAYER_SERVER_URL__)
    serverUrl: (function(){
        try {
            if (window.__MULTIPLAYER_SERVER_URL__) return window.__MULTIPLAYER_SERVER_URL__;
            const hostname = window.location.hostname;
            const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
            if (isLocal) return 'ws://localhost:3000';
            // Production: connect to the dedicated WebSocket server on Render
            return 'wss://mafia-born.onrender.com';
        } catch (e) {
            return 'wss://mafia-born.onrender.com';
        }
    })(),
    updateInterval: 2000, // 2 second update interval for world state
    reconnectInterval: 5000, // 5 seconds between reconnect attempts
    events: {
        PLAYER_CONNECT: 'player_connect',
        PLAYER_DISCONNECT: 'player_disconnect',
        WORLD_UPDATE: 'world_update',
        JOB_COMPLETE: 'job_complete',
        TERRITORY_TAKEN: 'territory_taken',
        GANG_WAR_STARTED: 'gang_war_started',
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
    // Multiplayer area-control zones — controlled by real players or NPC gangs.
    // These are broad city zones for PvP territory control, separate from the
    // economic districtTypes in game.js (single-player neighborhoods) and the
    // EXPANDED_TERRITORIES in game.js (single-player gang war zones).
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
    gangWars: [],
    territories: {},   // Phase 1 unified territory state (synced from server)
    jailRoster: { realPlayers: [], bots: [], totalOnlineInJail: 0 },
    lastUpdate: null
};

// Territory income tracking
let territoryIncomeNextCollection = Date.now() + (7 * 24 * 60 * 60 * 1000); // Next weekly collection

// ==================== NOTIFICATION SOUND SYSTEM ====================
// Web Audio API-based sound effects for PvP events — no external files needed.
let _audioCtx = null;
function getAudioCtx() {
    if (!_audioCtx) {
        try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* silent */ }
    }
    return _audioCtx;
}

/**
 * Play a short synthesized notification sound.
 * Types: 'combat', 'victory', 'defeat', 'alert', 'cash', 'heist'
 */
function playNotificationSound(type) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        switch (type) {
            case 'combat':      // Short aggressive stab
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
                gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2); break;
            case 'victory':     // Rising triumphant tone
                osc.type = 'square'; osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now); osc.stop(now + 0.4); break;
            case 'defeat':      // Descending low tone
                osc.type = 'sine'; osc.frequency.setValueAtTime(330, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
                gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.start(now); osc.stop(now + 0.5); break;
            case 'alert':       // Double beep
                osc.type = 'square'; osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.15, now); gain.gain.setValueAtTime(0, now + 0.08);
                gain.gain.setValueAtTime(0.15, now + 0.12); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.start(now); osc.stop(now + 0.25); break;
            case 'cash':        // Ka-ching
                osc.type = 'triangle'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2); break;
            case 'heist':       // Tension build
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
                gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.start(now); osc.stop(now + 0.6); break;
            default:            // Generic blip
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
        }
    } catch (e) { /* AudioContext not supported or user hasn't interacted yet */ }
}

/**
 * Show a toast notification at the top of the screen.
 * Auto-dismisses after `duration` ms.
 */
function showMPToast(text, color, duration) {
    duration = duration || 4000;
    color = color || '#c0a062';
    let container = document.getElementById('mp-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mp-toast-container';
        container.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `background:rgba(0,0,0,0.92);border:1px solid ${color};color:${color};padding:12px 20px;border-radius:8px;font-family:Georgia,serif;font-size:0.95em;box-shadow:0 4px 15px rgba(0,0,0,0.5);pointer-events:auto;opacity:0;transform:translateX(30px);transition:opacity 0.3s,transform 0.3s;max-width:350px;`;
    toast.textContent = text;
    container.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

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
        window.ui.toast('You must be connected to the online world to challenge a rival Don.', 'error');
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

// ==================== HEIST SYSTEM ====================

// Heist target definitions with difficulty, reward, and requirements
const HEIST_TARGETS = [
    { id: 'jewelry_store', name: '💎 Jewelry Store', difficulty: 'Easy', reward: 50000, minLevel: 1, minCrew: 1, maxCrew: 3, successBase: 75 },
    { id: 'bank_vault', name: '🏦 Bank Vault', difficulty: 'Medium', reward: 150000, minLevel: 5, minCrew: 2, maxCrew: 4, successBase: 60 },
    { id: 'armored_truck', name: '🚛 Armored Truck', difficulty: 'Medium', reward: 200000, minLevel: 8, minCrew: 2, maxCrew: 4, successBase: 55 },
    { id: 'casino_heist', name: '🎰 Casino Vault', difficulty: 'Hard', reward: 400000, minLevel: 12, minCrew: 3, maxCrew: 5, successBase: 40 },
    { id: 'art_museum', name: '🖼️ Art Museum', difficulty: 'Hard', reward: 350000, minLevel: 10, minCrew: 2, maxCrew: 4, successBase: 45 },
    { id: 'federal_reserve', name: '🏛️ Federal Reserve', difficulty: 'Extreme', reward: 800000, minLevel: 18, minCrew: 4, maxCrew: 6, successBase: 25 },
    { id: 'drug_cartel', name: '💊 Cartel Warehouse', difficulty: 'Extreme', reward: 600000, minLevel: 15, minCrew: 3, maxCrew: 5, successBase: 30 },
];

// Show active heists available to join + create new heist
function showActiveHeists() {
    const content = document.getElementById('multiplayer-content');
    if (!content) return;
    
    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById("multiplayer-screen");
    if (mpScreen) mpScreen.style.display = 'block';
    
    const heists = onlineWorldState.activeHeists || [];
    const myPlayerId = onlineWorldState.playerId;
    
    // Check if player already has an active heist
    const myHeist = heists.find(h => h.organizerId === myPlayerId);
    
    let heistListHTML;
    if (heists.length > 0) {
        heistListHTML = heists.map(h => {
            const participantCount = Array.isArray(h.participants) ? h.participants.length : (h.participants || 0);
            const maxCount = h.maxParticipants || 4;
            const isMyHeist = h.organizerId === myPlayerId;
            const alreadyJoined = Array.isArray(h.participants) && h.participants.includes(myPlayerId);
            const isFull = participantCount >= maxCount;
            const diffColor = h.difficulty === 'Easy' ? '#2ecc71' : h.difficulty === 'Medium' ? '#f39c12' : h.difficulty === 'Hard' ? '#e74c3c' : '#ff00ff';
            
            // Get participant names from playerStates
            let crewNames = '';
            if (Array.isArray(h.participants)) {
                const names = h.participants.map(pid => {
                    const ps = Object.values(onlineWorldState.playerStates || {}).find(p => p.playerId === pid);
                    return ps ? escapeHTML(ps.name) : 'Unknown';
                });
                crewNames = names.join(', ');
            }
            
            return `
            <div style="background: rgba(0,0,0,0.6); padding: 18px; border-radius: 10px; margin: 12px 0; border: 1px solid ${isMyHeist ? '#c0a062' : '#5a0000'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1; min-width: 200px;">
                        <div style="color: #c0a062; font-weight: bold; font-size: 1.1em; font-family: 'Georgia', serif;">${escapeHTML(h.target || 'Unknown Heist')}</div>
                        <div style="margin-top: 6px;">
                            <span style="color: ${diffColor}; font-size: 0.85em; padding: 2px 8px; border: 1px solid ${diffColor}; border-radius: 4px;">${escapeHTML(h.difficulty || 'Unknown')}</span>
                            <span style="color: #2ecc71; margin-left: 10px; font-size: 0.9em;">💰 $${(h.reward || 0).toLocaleString()}</span>
                        </div>
                        <div style="color: #ccc; font-size: 0.85em; margin-top: 8px;">
                            👥 Crew: ${participantCount}/${maxCount} ${crewNames ? '— ' + crewNames : ''}
                        </div>
                        <div style="color: #888; font-size: 0.8em; margin-top: 4px;">Organized by: ${escapeHTML(h.organizer || 'Unknown')}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; min-width: 130px;">
                        ${isMyHeist ? `
                            <button onclick="manageHeist('${h.id}')" style="background: linear-gradient(180deg, #c0a062, #8b7340); color: #000; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                                ⚙️ Manage
                            </button>
                            ${participantCount >= (h.minCrew || 1) ? `
                            <button onclick="forceStartHeist('${h.id}')" style="background: linear-gradient(180deg, #27ae60, #1a7a40); color: #fff; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                                🚀 Launch!
                            </button>` : `
                            <div style="color: #ff8800; font-size: 0.8em; text-align: center;">Need ${h.minCrew || 1}+ crew</div>`}
                        ` : alreadyJoined ? `
                            <div style="color: #2ecc71; padding: 10px; text-align: center; font-weight: bold;">✅ Joined</div>
                            <button onclick="leaveHeist('${h.id}')" style="background: #333; color: #ff4444; padding: 8px 15px; border: 1px solid #ff4444; border-radius: 6px; cursor: pointer; font-size: 0.85em;">
                                Leave
                            </button>
                        ` : isFull ? `
                            <div style="color: #888; padding: 10px; text-align: center;">Crew Full</div>
                        ` : `
                            <button onclick="joinHeist('${h.id}')" style="background: linear-gradient(180deg, #8b0000, #3a0000); color: #ff4444; padding: 10px 18px; border: 1px solid #ff0000; border-radius: 6px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                                🤝 Join Crew
                            </button>
                        `}
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        heistListHTML = '<p style="color: #888; text-align: center; font-style: italic; padding: 20px;">No active heists right now. Plan one yourself!</p>';
    }
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #8b0000;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 3em;">💰</div>
                <h2 style="color: #c0a062; font-family: 'Georgia', serif; font-size: 2em; margin: 10px 0 5px 0;">Big Scores</h2>
                <p style="color: #ccc; font-style: italic; margin: 0;">Plan heists, recruit crew, and hit high-value targets together.</p>
            </div>

            <!-- Create Heist Button -->
            <div style="text-align: center; margin-bottom: 20px;">
                ${myHeist
                    ? '<div style="color: #ff8800; font-size: 0.9em;">⚠️ You already have an active heist. Manage or complete it first.</div>'
                    : `<button onclick="showCreateHeist()" style="background: linear-gradient(180deg, #c0a062, #8b7340); color: #000; padding: 14px 30px; border: none; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-size: 1.1em; font-weight: bold;">
                        📋 Plan a Heist
                    </button>`
                }
            </div>

            <!-- Active Heists List -->
            <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 10px; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 10px 0; font-family: 'Georgia', serif;">🔥 Active Heists</h3>
                ${heistListHTML}
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

// Show heist creation screen — pick a target
function showCreateHeist() {
    if (!onlineWorldState.isConnected) {
        window.ui.toast('You must be connected to the online world to plan a heist.', 'error');
        return;
    }

    const content = document.getElementById('multiplayer-content');
    if (!content) return;

    const playerLevel = player.level || 1;

    const targetsHTML = HEIST_TARGETS.map(t => {
        const locked = playerLevel < t.minLevel;
        const diffColor = t.difficulty === 'Easy' ? '#2ecc71' : t.difficulty === 'Medium' ? '#f39c12' : t.difficulty === 'Hard' ? '#e74c3c' : '#ff00ff';
        
        return `
        <div style="background: rgba(0,0,0,0.6); padding: 16px; border-radius: 10px; margin: 10px 0; border: 1px solid ${locked ? '#333' : diffColor}; opacity: ${locked ? '0.5' : '1'};">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="flex: 1; min-width: 200px;">
                    <div style="color: ${locked ? '#666' : '#c0a062'}; font-weight: bold; font-size: 1.05em;">${t.name}</div>
                    <div style="margin-top: 6px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <span style="color: ${diffColor}; font-size: 0.8em; padding: 2px 6px; border: 1px solid ${diffColor}; border-radius: 4px;">${t.difficulty}</span>
                        <span style="color: #2ecc71; font-size: 0.85em;">💰 $${t.reward.toLocaleString()}</span>
                        <span style="color: #ccc; font-size: 0.85em;">👥 ${t.minCrew}-${t.maxCrew} crew</span>
                    </div>
                    <div style="color: #888; font-size: 0.8em; margin-top: 4px;">Base success: ${t.successBase}% | Requires Level ${t.minLevel}+</div>
                </div>
                <div>
                    ${locked 
                        ? `<div style="color: #666; font-size: 0.85em;">🔒 Level ${t.minLevel}</div>`
                        : `<button onclick="createHeist('${t.id}')" style="background: linear-gradient(180deg, #8b0000, #3a0000); color: #ff4444; padding: 10px 20px; border: 1px solid #ff0000; border-radius: 6px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                            📋 Plan This
                        </button>`
                    }
                </div>
            </div>
        </div>`;
    }).join('');

    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #c0a062;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3em;">📋</div>
                <h2 style="color: #c0a062; font-family: 'Georgia', serif; font-size: 1.8em; margin: 10px 0 5px 0;">Plan a Heist</h2>
                <p style="color: #ccc; font-style: italic; margin: 0;">Choose a target. Harder targets need bigger crews but pay more.</p>
            </div>

            ${targetsHTML}

            <div style="text-align: center; margin-top: 20px;">
                <button onclick="showActiveHeists()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">← Back to Big Scores</button>
            </div>
        </div>
    `;
}

// Create a heist and send to server
async function createHeist(targetId) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast('Not connected to the server!', 'error');
        return;
    }

    const target = HEIST_TARGETS.find(t => t.id === targetId);
    if (!target) return;

    if ((player.level || 1) < target.minLevel) {
        window.ui.toast(`You need to be Level ${target.minLevel} to plan this heist.`, 'error');
        return;
    }

    // Check if already organizing a heist
    const existingHeist = (onlineWorldState.activeHeists || []).find(h => h.organizerId === onlineWorldState.playerId);
    if (existingHeist) {
        window.ui.toast('You already have an active heist! Complete or cancel it first.', 'error');
        return;
    }

    if (!await window.ui.confirm(`Plan heist on ${target.name}?\n\nReward: $${target.reward.toLocaleString()} (split among crew)\nCrew needed: ${target.minCrew}-${target.maxCrew}\nBase success: ${target.successBase}%\n\nYou'll be the organizer. Other players can join.`)) {
        return;
    }

    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_create',
        target: target.name,
        targetId: target.id,
        reward: target.reward,
        difficulty: target.difficulty,
        maxParticipants: target.maxCrew,
        minCrew: target.minCrew,
        successBase: target.successBase
    }));

    logAction(`📋 Planning heist: ${target.name}. Looking for crew...`);
    
    // Brief delay then show heists list
    setTimeout(() => showActiveHeists(), 500);
}

// Manage your own heist
function manageHeist(heistId) {
    const heist = (onlineWorldState.activeHeists || []).find(h => h.id === heistId);
    if (!heist) {
        window.ui.toast('Heist not found!', 'error');
        return;
    }

    const content = document.getElementById('multiplayer-content');
    if (!content) return;

    const participantCount = Array.isArray(heist.participants) ? heist.participants.length : 0;
    const maxCount = heist.maxParticipants || 4;
    const minCrew = heist.minCrew || 1;
    const canLaunch = participantCount >= minCrew;
    const diffColor = heist.difficulty === 'Easy' ? '#2ecc71' : heist.difficulty === 'Medium' ? '#f39c12' : heist.difficulty === 'Hard' ? '#e74c3c' : '#ff00ff';

    // Build crew list
    let crewHTML = '';
    if (Array.isArray(heist.participants)) {
        crewHTML = heist.participants.map((pid, index) => {
            const ps = Object.values(onlineWorldState.playerStates || {}).find(p => p.playerId === pid);
            const name = ps ? escapeHTML(ps.name) : 'Unknown';
            const level = ps ? ps.level || 1 : '?';
            const isOrganizer = pid === heist.organizerId;
            const isMe = pid === onlineWorldState.playerId;
            
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 6px 0; background: rgba(${isOrganizer ? '192,160,98' : '139,0,0'},0.15); border-radius: 6px; border: 1px solid ${isOrganizer ? '#c0a062' : '#3a0000'};">
                <div>
                    <span style="color: ${isOrganizer ? '#c0a062' : '#ff4444'}; font-weight: bold;">${name}</span>
                    <span style="color: #888; font-size: 0.85em;"> Lvl ${level}</span>
                    ${isOrganizer ? '<span style="color: #c0a062; font-size: 0.8em; margin-left: 8px;">👑 Leader</span>' : ''}
                    ${isMe && !isOrganizer ? '<span style="color: #2ecc71; font-size: 0.8em; margin-left: 8px;">(You)</span>' : ''}
                </div>
                ${isOrganizer || !isMe ? '' : `
                    <button onclick="leaveHeist('${heistId}')" style="background: #333; color: #ff4444; padding: 5px 12px; border: 1px solid #ff4444; border-radius: 4px; cursor: pointer; font-size: 0.85em;">Leave</button>
                `}
            </div>`;
        }).join('');
    }

    // Empty slots
    for (let i = participantCount; i < maxCount; i++) {
        crewHTML += `
        <div style="display: flex; justify-content: center; align-items: center; padding: 10px; margin: 6px 0; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px dashed #333;">
            <span style="color: #555; font-style: italic;">Empty slot</span>
        </div>`;
    }

    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #c0a062;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3em;">⚙️</div>
                <h2 style="color: #c0a062; font-family: 'Georgia', serif; font-size: 1.8em; margin: 10px 0 5px 0;">Heist Management</h2>
                <div style="color: #ccc; font-size: 1.1em; margin-top: 5px;">${escapeHTML(heist.target || 'Unknown')}</div>
            </div>

            <!-- Heist Details -->
            <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #555;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="color: #ccc;">Difficulty: <span style="color: ${diffColor}; font-weight: bold;">${escapeHTML(heist.difficulty || 'Unknown')}</span></div>
                    <div style="color: #ccc;">Reward: <span style="color: #2ecc71; font-weight: bold;">$${(heist.reward || 0).toLocaleString()}</span></div>
                    <div style="color: #ccc;">Per person: <span style="color: #2ecc71;">~$${participantCount > 0 ? Math.floor((heist.reward || 0) / participantCount).toLocaleString() : '?'}</span></div>
                    <div style="color: #ccc;">Base success: <span style="color: #f39c12;">${heist.successBase || 60}%</span></div>
                </div>
            </div>

            <!-- Crew -->
            <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 10px 0; font-family: 'Georgia', serif;">👥 Crew (${participantCount}/${maxCount})</h3>
                ${crewHTML}
            </div>

            <!-- Actions -->
            <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                ${heist.organizerId === onlineWorldState.playerId ? `
                    ${canLaunch ? `
                        <button onclick="forceStartHeist('${heistId}')" style="background: linear-gradient(180deg, #27ae60, #1a7a40); color: #fff; padding: 14px 25px; border: none; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold; font-size: 1.05em;">
                            🚀 Launch Heist!
                        </button>
                    ` : `
                        <div style="color: #ff8800; padding: 14px; text-align: center;">Need at least ${minCrew} crew member${minCrew > 1 ? 's' : ''} to launch</div>
                    `}
                    <button onclick="cancelHeist('${heistId}')" style="background: #333; color: #ff4444; padding: 14px 20px; border: 1px solid #ff4444; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                        ❌ Cancel Heist
                    </button>
                ` : `
                    <button onclick="leaveHeist('${heistId}')" style="background: #333; color: #ff4444; padding: 14px 20px; border: 1px solid #ff4444; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                        🚪 Leave Crew
                    </button>
                `}
                <button onclick="showActiveHeists()" style="background: #333; color: #c0a062; padding: 14px 20px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    ← Back
                </button>
            </div>
        </div>
    `;
}

// Force start a heist (organizer only)
async function forceStartHeist(heistId) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast('Not connected!', 'error');
        return;
    }

    const heist = (onlineWorldState.activeHeists || []).find(h => h.id === heistId);
    if (!heist) return;

    if (heist.organizerId !== onlineWorldState.playerId) {
        window.ui.toast('Only the organizer can launch the heist!', 'error');
        return;
    }

    if (!await window.ui.confirm(`Launch the heist on ${heist.target}?\n\nThis cannot be undone. Your crew will move in immediately.`)) {
        return;
    }

    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_start',
        heistId: heistId
    }));

    logAction(`🚀 Launching heist on ${heist.target}!`);
}

// Leave a heist you joined
function leaveHeist(heistId) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast('Not connected!', 'error');
        return;
    }

    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_leave',
        heistId: heistId
    }));

    // Optimistic local update
    const heist = (onlineWorldState.activeHeists || []).find(h => h.id === heistId);
    if (heist && Array.isArray(heist.participants)) {
        heist.participants = heist.participants.filter(pid => pid !== onlineWorldState.playerId);
    }

    logAction('🚪 Left the heist crew.');
    showActiveHeists();
}

// Cancel a heist (organizer only)
async function cancelHeist(heistId) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast('Not connected!', 'error');
        return;
    }

    if (!await window.ui.confirm('Cancel this heist? All crew members will be dismissed.')) return;

    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_cancel',
        heistId: heistId
    }));

    // Optimistic local removal
    onlineWorldState.activeHeists = (onlineWorldState.activeHeists || []).filter(h => h.id !== heistId);
    logAction('❌ Heist cancelled.');
    showActiveHeists();
}

// Invite a specific player to your active heist
function inviteToHeist(playerName) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }

    // Check if player has an active heist
    const myHeist = (onlineWorldState.activeHeists || []).find(h => h.organizerId === onlineWorldState.playerId);
    if (!myHeist) {
        window.ui.toast(`You don't have an active heist! Go to Big Scores and plan one first.`, 'error');
        return;
    }

    const participantCount = Array.isArray(myHeist.participants) ? myHeist.participants.length : 0;
    if (participantCount >= (myHeist.maxParticipants || 4)) {
        window.ui.toast('Your heist crew is already full!', 'error');
        return;
    }

    onlineWorldState.socket.send(JSON.stringify({
        type: 'heist_invite',
        heistId: myHeist.id,
        targetPlayer: playerName
    }));

    logAction(`📨 Sent heist invitation to ${playerName} for ${myHeist.target}`);
    if (typeof showBriefNotification === 'function') {
        showBriefNotification(`Heist invite sent to ${playerName}!`, 3000);
    } else {
        window.ui.toast(`Heist invitation sent to ${playerName}!`, 'success');
    }
}

// Join any heist by ID
function joinHeist(heistId) {
    const heist = (onlineWorldState.activeHeists || []).find(h => h.id === heistId);
    if (!heist) {
        window.ui.toast('Heist not found!', 'error');
        return;
    }
    
    const participantCount = Array.isArray(heist.participants) ? heist.participants.length : 0;
    const maxCount = heist.maxParticipants || 4;
    
    if (participantCount >= maxCount) {
        window.ui.toast('This heist crew is full!', 'error');
        return;
    }
    
    if (Array.isArray(heist.participants) && heist.participants.includes(onlineWorldState.playerId)) {
        window.ui.toast('You already joined this heist!', 'error');
        return;
    }
    
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'heist_join',
            heistId: heistId
        }));
        logAction(`🤝 Requested to join heist: ${heist.target}`);
        
        // Optimistic local update
        if (Array.isArray(heist.participants)) {
            heist.participants.push(onlineWorldState.playerId);
        }
        showActiveHeists();
    } else {
        window.ui.toast('Not connected to the server!', 'error');
    }
}

// Show heist result popup
function showHeistResult(result) {
    // Remove any existing heist result modal
    const existing = document.getElementById('heist-result-modal');
    if (existing) existing.remove();
    
    const isSuccess = result.success;
    const borderColor = isSuccess ? '#2ecc71' : '#e74c3c';
    const bgGlow = isSuccess ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)';
    
    const modal = document.createElement('div');
    modal.id = 'heist-result-modal';
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; font-family: 'Georgia', serif;`;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%); padding: 40px; border-radius: 15px; border: 3px solid ${borderColor}; max-width: 450px; width: 90%; text-align: center; box-shadow: 0 0 40px ${bgGlow};">
            <div style="font-size: 4em; margin-bottom: 15px;">${isSuccess ? '💰' : '🚔'}</div>
            <h2 style="color: ${borderColor}; margin: 0 0 10px 0; font-size: 1.8em;">${isSuccess ? 'HEIST SUCCESSFUL!' : 'HEIST FAILED!'}</h2>
            <div style="color: #ccc; font-size: 1.1em; margin-bottom: 20px;">Target: ${escapeHTML(result.target || 'Unknown')}</div>
            
            <div style="background: rgba(0,0,0,0.4); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #333;">
                ${isSuccess ? `
                    <div style="color: #2ecc71; font-size: 1.3em; font-weight: bold; margin-bottom: 8px;">
                        +$${(result.reward || 0).toLocaleString()}
                    </div>
                    <div style="color: #f39c12; font-size: 1em;">
                        +${result.repGain || 0} Reputation
                    </div>
                ` : `
                    <div style="color: #e74c3c; font-size: 1.3em; font-weight: bold; margin-bottom: 8px;">
                        No Payout
                    </div>
                    <div style="color: #e74c3c; font-size: 1em;">
                        -${result.repLoss || 0} Reputation
                    </div>
                `}
                <div style="color: #888; font-size: 0.85em; margin-top: 10px;">
                    Crew size: ${result.crewSize || '?'}
                </div>
            </div>
            
            <button onclick="document.getElementById('heist-result-modal').remove()" style="background: linear-gradient(180deg, ${isSuccess ? '#27ae60' : '#c0392b'}, ${isSuccess ? '#1a7a40' : '#7a1a1a'}); color: #fff; padding: 14px 35px; border: none; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-size: 1.1em; font-weight: bold;">
                ${isSuccess ? 'Collect & Continue' : 'Walk Away'}
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Sync player money/rep from server
    if (isSuccess && result.reward) {
        if (typeof player !== 'undefined') {
            player.money = (player.money || 0) + result.reward;
            player.reputation = (player.reputation || 0) + (result.repGain || 0);
            if (typeof updateUI === 'function') updateUI();
        }
    } else if (!isSuccess && result.repLoss) {
        if (typeof player !== 'undefined') {
            player.reputation = Math.max(0, (player.reputation || 0) - (result.repLoss || 0));
            if (typeof updateUI === 'function') updateUI();
        }
    }
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
                <div style="color: #ff4444; font-weight: bold;">${escapeHTML(w.attacker || '???')} vs ${escapeHTML(w.defender || '???')}</div>
                <div style="color: #ccc; font-size: 0.9em;">District: ${escapeHTML(w.district || 'Unknown')}</div>
                <button onclick="spectateWar('${escapeHTML(w.district)}')" style="margin-top: 8px; background: #444; color: #c0a062; padding: 8px 15px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer;">Spectate</button>
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
                    <span style="color: #f39c12; font-weight: bold;">${escapeHTML(p.name || 'Unknown')}</span>
                    <span style="color: #888; font-size: 0.85em;"> Lvl ${p.level || 1}</span>
                </div>
                <div>
                    <button onclick="challengePlayer('${escapeHTML(p.name)}')" style="background: #8b0000; color: #fff; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 0 3px;">Fight</button>
                </div>
            </div>
        `).join('')
        : '<p style="color: #888; text-align: center; font-style: italic;">No players nearby. Try exploring different districts.</p>';
    
    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #f39c12;">
            <h2 style="color: #f39c12; text-align: center; font-family: 'Georgia', serif;"> Local Crew</h2>
            <p style="color: #ccc; text-align: center;">Players in your area. Challenge or recruit them.</p>
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
            <h2 style="color: #c0a062; text-align: center; font-family: 'Georgia', serif;"> ${escapeHTML(district)}</h2>
            <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p style="color: #ccc;">Controlled by: <span style="color: #f39c12; font-weight: bold;">${escapeHTML(info.controlledBy)}</span></p>
                <p style="color: #ccc;">Defense Power: <span style="color: #e74c3c;">${info.power || 0}</span></p>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="challengeForTerritory('${escapeHTML(district)}')" style="background: #8b0000; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Attack</button>
                <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 10px 20px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; margin: 5px;">Back</button>
            </div>
        </div>
    `;
}

// Challenge for a territory (sends to server if connected)
function challengeForTerritory(district) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket) {
        window.ui.toast('You must be connected to the online world to challenge for territory.', 'error');
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

// Start a heist in a specific district — redirects to heist creation
function startDistrictHeist(districtName) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket) {
        window.ui.toast('You must be connected to the online world to start a heist.', 'error');
        return;
    }
    
    // Check if already organizing
    const existingHeist = (onlineWorldState.activeHeists || []).find(h => h.organizerId === onlineWorldState.playerId);
    if (existingHeist) {
        window.ui.toast('You already have an active heist! Complete or cancel it first.', 'error');
        showActiveHeists();
        return;
    }
    
    showCreateHeist();
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
    
    // Set up periodic state sync (only once)
    if (!window._syncIntervalStarted) {
        window._syncIntervalStarted = true;
        setInterval(() => {
            if (onlineWorldState.isConnected) {
                syncPlayerState();
            }
        }, 5000); // Sync every 5 seconds
    }
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
                    currentTerritory: player.currentTerritory || null,
                    lastTerritoryMove: player.lastTerritoryMove || 0,
                    level: player.level || 1
                }
            };
            
            onlineWorldState.socket.send(JSON.stringify(playerData));
            
            updateConnectionStatus();
            initializeWorldData();
            startWorldUpdates();
            
            logAction(` Connected to online world! Player ID: ${onlineWorldState.playerId}`);
            showWelcomeMessage();
            
            // Deferred name correction: once player data fully loads, re-send with the real name
            // This fixes the wrong name appearing briefly after login
            _scheduleNameCorrection();
        };
        
        onlineWorldState.socket.onmessage = function(event) {
            handleServerMessage(JSON.parse(event.data));
        };
        
        onlineWorldState.socket.onclose = function(event) {
            onlineWorldState.isConnected = false;
            // Only reconnect if we were previously connected (not if we failed to connect)
            if (onlineWorldState.connectionStatus === 'connected') {
                onlineWorldState.connectionStatus = 'disconnected';
                updateConnectionStatus();
                logAction(" Disconnected from online world");
                // Attempt to reconnect
                setTimeout(() => {
                    connectToOnlineWorld();
                }, onlineWorld.reconnectInterval);
            }
            // If status is 'error' or 'demo', don't loop — let demo mode handle it
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

// Fallback when server is unavailable — just update status, no fake data
function connectToLocalDemo() {
    onlineWorldState.isConnected = false;
    onlineWorldState.connectionStatus = 'offline';
    onlineWorldState.serverInfo.playerCount = 0;
    updateConnectionStatus();
    logAction('⚠️ Server unavailable — World Chat is offline. Will retry automatically.');
}

// Handle messages from the server
async function handleServerMessage(message) {
    switch(message.type) {
        case 'world_update':
            onlineWorldState.serverInfo.playerCount = message.playerCount;
            onlineWorldState.lastUpdate = new Date().toLocaleTimeString();
            
            // Sync territory state from server
            if (message.territories) {
                onlineWorldState.territories = message.territories;
            }

            // Update player states including jail status
            if (message.playerStates) {
                onlineWorldState.playerStates = message.playerStates;
                updateJailVisibility();
                updateOnlinePlayerList();

                // Also refresh the chat player list and nearby players for faster sync
                const allPlayers = Object.values(message.playerStates);
                onlineWorldState.nearbyPlayers = allPlayers.map(p => ({
                    name: p.name,
                    level: p.level || 1,
                    color: p.playerId === onlineWorldState.playerId ? '#c0a062' : '#3498db',
                    playerId: p.playerId
                }));
                const chatPlayerList = document.getElementById('chat-player-list');
                if (chatPlayerList) {
                    chatPlayerList.innerHTML = generateOnlinePlayersHTML();
                }

                // SERVER-AUTHORITATIVE SYNC: only sync jail/wanted state from
                // the server. Money, reputation, level, territory are owned by
                // the local (single-player) game engine and must NOT be
                // overwritten by the multiplayer world-update snapshot.
                const selfPs = onlineWorldState.playerStates[onlineWorldState.playerId];
                if (selfPs) {
                    // Only sync jail state from server if NOT locally counting down
                    // This prevents the server from killing the local timer
                    if (!window._jailTimerActive) {
                        player.inJail = !!selfPs.inJail;
                        player.jailTime = selfPs.jailTime || 0;
                    }
                    if (typeof selfPs.wantedLevel === 'number') player.wantedLevel = selfPs.wantedLevel;
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
                playNotificationSound('cash');
                showMPToast(`\uD83D\uDC51 You claimed ${message.district}!`, '#27ae60');
                updateUI();
            } else {
                showMPToast(`${message.playerName} claimed ${message.district}!`, '#f39c12');
            }
            break;

        // ── Phase 1 Territory System ──────────────────────────────────
        case 'territory_spawn_result':
            if (message.success) {
                player.currentTerritory = message.district;
                logAction(`🏙️ Spawned in ${message.district}.`);
            } else {
                logAction(`⚠️ Territory spawn failed: ${message.error}`);
            }
            break;

        case 'territory_move_result':
            if (message.success) {
                player.currentTerritory = message.district;
                if (typeof message.money === 'number') player.money = message.money;
                player.lastTerritoryMove = Date.now();
                logAction(`🏙️ Relocated to ${message.district}.`);
                updateUI();
            } else {
                // Revert local state on failure
                logAction(`⚠️ Relocation failed: ${message.error}`);
                if (window.ui) window.ui.toast(message.error || 'Move failed.', 'error');
            }
            break;

        case 'territory_population_update':
            // Another player moved — update cached territory data
            if (onlineWorldState.territories) {
                onlineWorldState.territories = message.territories || onlineWorldState.territories;
            }
            break;

        case 'territory_info':
            // Full territory state response — cache it
            onlineWorldState.territories = message.territories || {};
            break;

        // ── Phase 2: Territory ownership & conquest ────────────────────
        case 'territory_claim_ownership_result':
            if (message.success) {
                if (typeof message.money === 'number') player.money = message.money;
                onlineWorldState.territories = message.territories || onlineWorldState.territories;
                logAction(`👑 Claimed ownership of ${message.district}!`);
                if (window.ui) window.ui.toast(`You now own ${message.district.replace(/_/g, ' ')}! 👑`, 'success');
                updateUI();
            } else {
                logAction(`⚠️ Claim failed: ${message.error}`);
                if (window.ui) window.ui.toast(message.error || 'Claim failed.', 'error');
            }
            break;

        case 'territory_ownership_changed':
            onlineWorldState.territories = message.territories || onlineWorldState.territories;
            if (message.method === 'assassination') {
                addWorldEvent(`\uD83C\uDFAF ${message.attacker} seized ${message.seized.join(', ')} from ${message.defender} via assassination!`);
                playNotificationSound('alert');
                showMPToast(`\uD83C\uDFAF ${message.attacker} seized territory via assassination!`, '#8b0000', 6000);
            } else if (message.method === 'war') {
                addWorldEvent(`\u2694\uFE0F ${message.attacker} conquered ${message.seized.join(', ')} from ${message.defender} in a gang war!`);
                playNotificationSound('combat');
                showMPToast(`\u2694\uFE0F ${message.attacker} conquered territory in a war!`, '#8b0000', 6000);
            } else {
                addWorldEvent(`\uD83D\uDC51 ${message.attacker} claimed ${message.seized.join(', ')}!`);
            }
            break;

        case 'territory_war_result':
            if (message.victory) {
                onlineWorldState.territories = message.territories || onlineWorldState.territories;
                logAction(`\u2694\uFE0F Victory! Conquered ${message.district} from ${message.oldOwner}. Rep +${message.repGain}, lost ${message.gangMembersLost} members, HP -${message.healthDamage}.`);
                playNotificationSound('victory');
                showMPToast(`\u2694\uFE0F Victory! You conquered ${message.district}!`, '#2ecc71', 5000);
                if (typeof message.wantedLevel === 'number') player.wantedLevel = message.wantedLevel;
                if (typeof message.energy === 'number') player.energy = message.energy;
                if (typeof message.newHealth === 'number') player.health = message.newHealth;
            } else {
                logAction(`\u2694\uFE0F Defeat! Failed to take ${message.district}. Lost ${message.gangMembersLost} members, HP -${message.healthDamage}.${message.jailed ? ' Arrested!' : ''}`);
                playNotificationSound('defeat');
                showMPToast(`\u2694\uFE0F Defeat! Failed to take ${message.district}.`, '#e74c3c', 5000);
                if (typeof message.wantedLevel === 'number') player.wantedLevel = message.wantedLevel;
                if (typeof message.energy === 'number') player.energy = message.energy;
                if (typeof message.newHealth === 'number') player.health = message.newHealth;
                if (message.jailed) {
                    player.inJail = true;
                    player.jailTime = message.jailTime || 0;
                }
            }
            updateUI();
            break;

        case 'territory_war_defense_lost':
            onlineWorldState.territories = message.territories || onlineWorldState.territories;
            logAction(`\u2694\uFE0F ${message.attackerName} conquered your territory ${message.district}!`);
            playNotificationSound('defeat');
            showMPToast(`\u2694\uFE0F ${message.attackerName} seized your territory!`, '#e74c3c', 6000);
            if (window.ui) window.ui.toast(`${message.attackerName} seized ${message.district.replace(/_/g, ' ')} from you! \u2694\uFE0F`, 'error');
            break;

        case 'territory_war_defense_held':
            logAction(`\u2694\uFE0F ${message.attackerName} attacked your territory ${message.district} but your defenses held!`);
            playNotificationSound('victory');
            showMPToast(`\uD83D\uDEE1\uFE0F Defended ${message.district} from ${message.attackerName}!`, '#2ecc71', 5000);
            if (window.ui) window.ui.toast(`You repelled ${message.attackerName}'s attack on ${message.district.replace(/_/g, ' ')}! \uD83D\uDEE1\uFE0F`, 'success');
            break;

        case 'territory_tax_income':
            if (typeof message.amount === 'number') {
                if (typeof message.newMoney === 'number') player.money = message.newMoney;
                const taxSource = message.source === 'business' ? 'business income' : 'job';
                logAction(`\uD83D\uDCB0 Tax income: $${message.amount.toLocaleString()} from ${message.from}'s ${taxSource} (${message.district.replace(/_/g, ' ')}).`);
                playNotificationSound('cash');
                showMPToast(`\uD83D\uDCB0 +$${message.amount.toLocaleString()} tax from ${message.from}`, '#27ae60', 3000);
                updateUI();
            }
            break;

        case 'business_income_tax_result':
            // Server confirmed business income tax was processed
            if (message.success) {
                console.log(`[Territory] Business tax $${message.taxAmount} processed for ${message.district}`);
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
                let taxStr = '';
                if (message.taxAmount > 0) {
                    taxStr = ` (Tax: -$${message.taxAmount.toLocaleString()} to ${message.taxOwnerName})`;
                }
                logAction(` Job '${message.jobId}' completed ${earningsStr}${taxStr} (Rep +${message.repGain || 0}, Wanted +${message.wantedAdded || 0})`);
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
            // We were freed from jail by another player!
            player.inJail = false;
            player.jailTime = 0;
            if (typeof stopJailTimer === 'function') stopJailTimer();
            if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: false, jailTime: 0 });
            updateUI();
            if (typeof goBackToMainMenu === 'function') goBackToMainMenu();
            // Show the freed popup with gift option
            showFreedFromJailPopup(message.helperName, message.helperId);
            break;

        case 'jailbreak_failed_arrested':
            // We got arrested during jailbreak attempt — go straight to jail
            player.inJail = true;
            player.jailTime = message.jailTime || 15;
            player.breakoutAttempts = 3;
            if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: true, jailTime: player.jailTime });
            if (typeof updateJailTimer === 'function') updateJailTimer();
            if (typeof generateJailPrisoners === 'function') generateJailPrisoners();
            updateUI();
            if (typeof showJailScreen === 'function') showJailScreen();
            showSystemMessage(message.message || 'Jailbreak failed and you were arrested!', '#8b0000');
            break;
            
        case 'connection_established':
            // Store initial server data (leaderboard, events, etc.)
            if (message.serverInfo) {
                if (message.serverInfo.globalLeaderboard) {
                    onlineWorldState.serverInfo.globalLeaderboard = message.serverInfo.globalLeaderboard;
                }
                if (message.serverInfo.cityEvents) {
                    onlineWorldState.serverInfo.cityEvents = message.serverInfo.cityEvents;
                }
            }
            if (message.playerId) {
                onlineWorldState.playerId = message.playerId;
            }
            loadGlobalLeaderboard();
            break;

        case 'heist_broadcast':
            onlineWorldState.activeHeists.push(message.heist);
            addWorldEvent(`💰 ${message.playerName} is organizing a heist: ${message.heist ? message.heist.target : 'Unknown'}`);
            break;

        case 'heist_update':
            // Server updated a heist (player joined, left, etc.)
            if (message.heist) {
                const hIdx = onlineWorldState.activeHeists.findIndex(h => h.id === message.heist.id);
                if (hIdx >= 0) {
                    onlineWorldState.activeHeists[hIdx] = message.heist;
                } else {
                    onlineWorldState.activeHeists.push(message.heist);
                }
            }
            // Refresh heists screen if it's currently shown
            if (document.getElementById('multiplayer-content') && document.getElementById('multiplayer-content').innerHTML.includes('Big Scores')) {
                showActiveHeists();
            }
            break;

        case 'heist_cancelled':
            // Heist was removed (cancelled or completed)
            if (message.heistId) {
                onlineWorldState.activeHeists = onlineWorldState.activeHeists.filter(h => h.id !== message.heistId);
            }
            if (message.message) {
                addWorldEvent(message.message);
            }
            // Refresh heists screen if shown
            if (document.getElementById('multiplayer-content') && document.getElementById('multiplayer-content').innerHTML.includes('Big Scores')) {
                showActiveHeists();
            }
            break;

        case 'heist_completed':
            // Heist finished — show results
            if (message.heistId) {
                onlineWorldState.activeHeists = onlineWorldState.activeHeists.filter(h => h.id !== message.heistId);
            }
            addWorldEvent(message.worldMessage || (message.success ? '\uD83D\uDCB0 A heist was successful!' : '\uD83D\uDE94 A heist has failed!'));
            // Show result popup if player was involved
            if (message.involved) {
                showHeistResult(message);
                playNotificationSound(message.success ? 'cash' : 'defeat');
            } else {
                showMPToast(message.worldMessage || 'A heist just went down!', message.success ? '#2ecc71' : '#e74c3c');
            }
            // Refresh heists screen if shown
            if (document.getElementById('multiplayer-content') && document.getElementById('multiplayer-content').innerHTML.includes('Big Scores')) {
                showActiveHeists();
            }
            break;

        case 'heist_invite':
            // Someone invited you to a heist
            if (message.heistId && message.inviterName) {
                playNotificationSound('heist');
                showMPToast(`\uD83D\uDCB0 ${message.inviterName} invited you to a heist!`, '#f39c12', 8000);
                const acceptInvite = await window.ui.confirm(`${message.inviterName} invited you to a heist: ${message.target || 'Unknown'}!\n\nReward: $${(message.reward || 0).toLocaleString()}\nDifficulty: ${message.difficulty || 'Unknown'}\n\nJoin their crew?`);
                if (acceptInvite && onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
                    onlineWorldState.socket.send(JSON.stringify({
                        type: 'heist_join',
                        heistId: message.heistId
                    }));
                    logAction(`🤝 Accepted heist invitation from ${message.inviterName}`);
                }
            }
            break;
            
        case 'player_ranked':
            // Store server leaderboard data and refresh UI
            if (message.leaderboard) {
                onlineWorldState.serverInfo.globalLeaderboard = message.leaderboard;
            }
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
            
        case 'assassination_result':
            handleAssassinationResult(message);
            playNotificationSound(message.success ? 'victory' : 'defeat');
            break;

        case 'assassination_victim':
            handleAssassinationVictim(message);
            playNotificationSound('alert');
            showMPToast(`\uD83C\uDFAF ${message.attackerName} ordered a hit on you!`, '#e74c3c', 6000);
            break;

        case 'assassination_survived':
            handleAssassinationSurvived(message);
            playNotificationSound('alert');
            showMPToast(`\uD83D\uDEE1\uFE0F You survived an assassination attempt!`, '#2ecc71', 5000);
            break;

        case 'combat_result':
            // Server-authoritative PvP combat outcome — show result modal
            if (message.error) {
                showSystemMessage(message.error, '#e74c3c');
                break;
            }
            const isWinner = message.winner === (player.name || '');
            const isLoser = message.loser === (player.name || '');
            if (isWinner || isLoser) {
                showPvpResultModal(message, isWinner);
                playNotificationSound(isWinner ? 'victory' : 'defeat');
                // Sync health damage from server
                if (message.healthDamage) {
                    const myDmg = isWinner ? message.healthDamage.winner : message.healthDamage.loser;
                    if (myDmg) player.health = Math.max(1, (player.health || 100) - myDmg);
                }
                // Show bounty claim toast
                if (isWinner && message.bountyClaimed) {
                    showMPToast(`💀 Bounty collected! +$${message.bountyClaimed.reward.toLocaleString()}`, '#ff6600', 5000);
                    player.money = (player.money || 0) + message.bountyClaimed.reward;
                    playNotificationSound('cash');
                }
                // Show ELO change
                if (message.eloChange && isWinner) {
                    showMPToast(`${message.eloChange.icon} Ranked: ${message.eloChange.elo} ELO (${message.eloChange.tier})`, '#c0a062', 4000);
                }
            } else {
                // Spectator — show toast
                showMPToast(`\u2694\uFE0F ${message.winner} defeated ${message.loser}!`, '#8b0000');
            }
            // Always log in world feed for other spectators
            addWorldEvent(`\u2694\uFE0F ${message.winner} defeated ${message.loser} in combat!`);
            // Stats sync happens via next world_update
            break;

        case 'jail_roster':
            // Server-sent jail roster: real players in jail + bots
            onlineWorldState.jailRoster = {
                realPlayers: message.realPlayers || [],
                bots: message.bots || [],
                totalOnlineInJail: message.totalOnlineInJail || 0
            };
            updateJailVisibility();
            // Also update the game.js prisoner lists if they exist
            if (typeof updatePrisonerList === 'function') updatePrisonerList();
            if (typeof updateJailbreakPrisonerList === 'function') updateJailbreakPrisonerList();
            break;

        case 'jailbreak_bot_result':
            // Result of attempting to break out a jail bot
            if (message.success) {
                logAction(`🗝️ ${message.message}`);
                if (message.expReward) player.experience += message.expReward;
                if (message.cashReward) player.money += message.cashReward;
                showSystemMessage(`🎉 ${message.message}`, '#2ecc71');
                updateUI();
            } else {
                logAction(`💀 ${message.message}`);
                if (message.arrested) {
                    // Got caught — go straight to jail, no more breakout attempts
                    player.inJail = true;
                    player.jailTime = message.jailTime || 15;
                    player.breakoutAttempts = 3;
                    if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: true, jailTime: player.jailTime });
                    if (typeof updateJailTimer === 'function') updateJailTimer();
                    if (typeof generateJailPrisoners === 'function') generateJailPrisoners();
                    updateUI();
                    if (typeof showJailScreen === 'function') showJailScreen();
                    showSystemMessage(`🚔 ${message.message}`, '#e74c3c');
                } else {
                    showSystemMessage(`💀 ${message.message}`, '#f39c12');
                    updateUI();
                }
            }
            break;

        case 'gift_received':
            // Someone sent us money
            if (message.amount) {
                player.money += message.amount;
                showSystemMessage(message.message || `You received a $${message.amount.toLocaleString()} gift!`, '#c0a062');
                logAction(`💰 ${message.senderName || 'Someone'} sent you $${message.amount.toLocaleString()}!`);
                updateUI();
            }
            break;

        case 'war_bet_result':
            // Server resolved our war bet — store result for the spectator animation to display
            if (message.success) {
                window._lastWarBetResult = message;
                // Sync money immediately so HUD updates
                if (message.newMoney !== undefined) player.money = message.newMoney;
                if (typeof updateUI === 'function') updateUI();
                playNotificationSound(message.won ? 'victory' : 'defeat');
            } else {
                showSystemMessage(message.error || 'Bet failed.', '#e74c3c');
            }
            break;

        // ==================== PHASE C: COMPETITIVE FEATURE HANDLERS ====================
        case 'alliance_result':
            handleAllianceResult(message);
            break;

        case 'alliance_invite':
            handleAllianceInviteReceived(message);
            break;

        case 'alliance_info_result':
            handleAllianceInfoResult(message);
            break;

        case 'bounty_result':
            handleBountyResult(message);
            break;

        case 'bounty_alert':
            handleBountyAlert(message);
            break;

        case 'bounty_list_result':
            handleBountyListResult(message);
            break;

        case 'season_info_result':
            handleSeasonInfoResult(message);
            break;

        case 'season_reset':
            showMPToast(`🏆 Season ${message.seasonNumber} has begun!${message.champion ? ` Last champion: ${message.champion.name}` : ''}`, '#ffd700', 8000);
            playNotificationSound('victory');
            break;

        case 'siege_result':
            handleSiegeResult(message);
            break;

        case 'fortify_result':
            handleFortifyResult(message);
            break;

        case 'player_released':
            // Server says our sentence is served
            if (message.playerId === onlineWorldState.playerId) {
                if (typeof stopJailTimer === 'function') stopJailTimer();
                window._jailTimerActive = false;
                player.inJail = false;
                player.jailTime = 0;
                if (window.EventBus) {
                    try { EventBus.emit('jailStatusChanged', { inJail: false, jailTime: 0 }); } catch(e) {}
                }
                if (typeof updateUI === 'function') updateUI();
                alert('You served your sentence and are now free.');
                if (typeof goBackToMainMenu === 'function') goBackToMainMenu();
            }
            break;

        default:
            console.log('Unknown message type:', message.type);
    }
}

// Update jail visibility — no longer renders a separate section.
// The prisoner-list div (game.js updatePrisonerList) handles all display.
function updateJailVisibility() {
    const jailStatusContainer = document.getElementById('online-jail-status');
    if (jailStatusContainer) jailStatusContainer.innerHTML = '';
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
        onlinePlayers.forEach(p => {
            const statusIcon = p.inJail ? '' : '🟢';
            const statusText = p.inJail ? 'In Jail' : 'Free';
            const statusColor = p.inJail ? '#8b0000' : '#c0a062';
            
            playersHTML += `
                <div style="background: rgba(52, 73, 94, 0.3); padding: 10px; margin: 8px 0; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: ${p.playerId === onlineWorldState.playerId ? '#c0a062' : '#ecf0f1'}; font-family: 'Georgia', serif;">
                                ${escapeHTML(p.name)} ${p.playerId === onlineWorldState.playerId ? '(You)' : ''}
                            </strong>
                            <br><small style="color: ${statusColor};">${statusIcon} ${statusText}</small>
                        </div>
                        <div style="text-align: right; font-size: 0.9em;">
                            <div>Level ${p.level || 1}</div>
                            <div style="color: #95a5a6;">${p.reputation || 0} rep</div>
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
async function attemptPlayerJailbreak(targetPlayerId, targetPlayerName) {
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }
    
    if (player.inJail) {
        window.ui.toast("You can't help others break out while you're in jail yourself!", 'error');
        return;
    }
    
    if (player.energy < 15) {
        window.ui.toast("You need at least 15 energy to attempt a jailbreak!", 'error');
        return;
    }
    
    const confirmBreakout = await window.ui.confirm(`Attempt to break ${targetPlayerName} out of jail? This will cost 15 energy and has risks.`);
    
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
            window.ui.toast('Connection lost before sending jailbreak intent.', 'error');
        }
        updateUI(); // Show reduced energy immediately; success/failure will arrive via server messages
    }
}

// Request the jail roster from the server (real players + bots)
function requestJailRoster() {
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({ type: 'request_jail_roster' }));
    }
}

// Attempt to break out a jail bot (server-authoritative)
async function attemptBotJailbreak(botId, botName) {
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }

    if (player.inJail) {
        window.ui.toast("You can't help others break out while you're in jail yourself!", 'error');
        return;
    }

    if (player.energy < 15) {
        window.ui.toast("You need at least 15 energy to attempt a jailbreak!", 'error');
        return;
    }

    const confirmBreakout = await window.ui.confirm(`Attempt to break ${botName} out of jail? This will cost 15 energy and has risks.`);

    if (confirmBreakout) {
        player.energy -= 15;
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'jailbreak_bot',
                botId,
                botName,
                helperPlayerId: onlineWorldState.playerId,
                helperPlayerName: player.name || 'You'
            }));
            logAction(`🔓 Attempting to break out ${botName}...`);
        } else {
            window.ui.toast('Connection lost before sending jailbreak intent.', 'error');
        }
        updateUI();
    }
}

// Show "You've been freed!" popup with option to send a gift
function showFreedFromJailPopup(helperName, helperId) {
    // Remove any existing popup
    const existing = document.getElementById('freed-from-jail-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'freed-from-jail-popup';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';

    const giftAmounts = [500, 1000, 2500, 5000];
    let giftButtonsHTML = '';
    if (helperId) {
        giftButtonsHTML = `<p style="margin-top:12px;color:#c0a062;font-size:14px;">Want to send them a thank-you gift?</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px;">
            ${giftAmounts.map(amt => `<button onclick="sendGiftMoney('${helperId}', ${amt})" 
                style="padding:8px 14px;background:#2a5e2a;color:#c0a062;border:1px solid #c0a062;border-radius:5px;cursor:pointer;font-family:'Georgia',serif;font-size:13px;"
                onmouseover="this.style.background='#3a7e3a'" onmouseout="this.style.background='#2a5e2a'"
                >$${amt.toLocaleString()}</button>`).join('')}
        </div>`;
    }

    overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #c0a062;border-radius:10px;padding:30px;max-width:420px;width:90%;text-align:center;">
            <h2 style="color:#2ecc71;margin:0 0 10px 0;font-family:'Georgia',serif;">🔓 You're Free!</h2>
            <p style="color:#e0d5c1;font-size:16px;line-height:1.5;">
                <strong style="color:#c0a062;">${escapeHTML(helperName || 'A fellow gangster')}</strong> broke you out of jail!
            </p>
            ${giftButtonsHTML}
            <button onclick="document.getElementById('freed-from-jail-popup').remove()" 
                style="margin-top:20px;padding:10px 30px;background:#8b0000;color:#e0d5c1;border:1px solid #c0a062;border-radius:5px;cursor:pointer;font-family:'Georgia',serif;font-size:14px;display:block;width:80%;margin-left:auto;margin-right:auto;"
                onmouseover="this.style.background='#a00000'" onmouseout="this.style.background='#8b0000'"
                >Close</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Send a gift of money to another player
function sendGiftMoney(targetPlayerId, amount) {
    if (player.money < amount) {
        window.ui.toast("You don't have enough money for that gift!", 'error');
        return;
    }
    player.money -= amount;
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'send_gift',
            targetPlayerId: targetPlayerId,
            amount: amount
        }));
    }
    logAction(`💰 You sent $${amount.toLocaleString()} as a thank-you gift!`);
    updateUI();
    // Close the popup
    const popup = document.getElementById('freed-from-jail-popup');
    if (popup) popup.remove();
    if (typeof showBriefNotification === 'function') {
        showBriefNotification(`Gift of $${amount.toLocaleString()} sent!`, 'success');
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

// PvP combat result modal
function showPvpResultModal(message, isWinner) {
    let modal = document.getElementById('pvp-result-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pvp-result-modal';
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:480px;max-width:95%;background:rgba(0,0,0,0.95);border-radius:12px;font-family:Georgia,serif;color:#ecf0f1;padding:25px;';
        document.body.appendChild(modal);
    }

    const repChange = message.repChange || 5;
    const opponent = isWinner ? message.loser : message.winner;
    const myDmg = message.healthDamage ? (isWinner ? message.healthDamage.winner : message.healthDamage.loser) : 0;

    if (isWinner) {
        modal.style.border = '2px solid #2ecc71';
        modal.style.boxShadow = '0 0 30px rgba(46,204,113,0.5)';
        player.reputation = (player.reputation || 0) + repChange;

        modal.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:3em;margin-bottom:10px;">🏆</div>
                <h2 style="color:#2ecc71;margin:0;">VICTORY!</h2>
                <p style="color:#888;margin:5px 0;">You defeated <strong style="color:#e74c3c;">${escapeHTML(opponent)}</strong></p>
            </div>
            <div style="margin:20px 0;padding:15px;background:rgba(46,204,113,0.1);border:1px solid #2ecc71;border-radius:8px;">
                <div style="display:flex;justify-content:space-around;text-align:center;">
                    <div>
                        <div style="color:#2ecc71;font-size:1.5em;font-weight:bold;">+${repChange}</div>
                        <div style="color:#888;font-size:0.85em;">Reputation</div>
                    </div>
                    ${myDmg ? `<div>
                        <div style="color:#e67e22;font-size:1.5em;font-weight:bold;">-${myDmg}</div>
                        <div style="color:#888;font-size:0.85em;">Health</div>
                    </div>` : ''}
                    <div>
                        <div style="color:#f1c40f;font-size:1.5em;font-weight:bold;">⭐</div>
                        <div style="color:#888;font-size:0.85em;">Street Cred</div>
                    </div>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;text-align:center;color:#888;font-style:italic;">
                "Word on the street is you're not someone to mess with."
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('pvp-result-modal').remove();" style="background:#2ecc71;color:#1a1a1a;padding:12px 35px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;font-weight:bold;">Claim Victory</button>
            </div>
        `;

        logAction(`🏆 Victory! Defeated ${opponent} and gained ${repChange} reputation!${myDmg ? ` (HP -${myDmg})` : ''}`);
    } else {
        modal.style.border = '2px solid #e74c3c';
        modal.style.boxShadow = '0 0 30px rgba(231,76,60,0.5)';
        const repLoss = Math.min(player.reputation || 0, 3);
        player.reputation = Math.max(0, (player.reputation || 0) - repLoss);

        modal.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:3em;margin-bottom:10px;">💀</div>
                <h2 style="color:#e74c3c;margin:0;">DEFEATED</h2>
                <p style="color:#888;margin:5px 0;"><strong style="color:#2ecc71;">${escapeHTML(opponent)}</strong> came out on top</p>
            </div>
            <div style="margin:20px 0;padding:15px;background:rgba(231,76,60,0.1);border:1px solid #e74c3c;border-radius:8px;">
                <div style="display:flex;justify-content:space-around;text-align:center;">
                    <div>
                        <div style="color:#e74c3c;font-size:1.5em;font-weight:bold;">-${repLoss}</div>
                        <div style="color:#888;font-size:0.85em;">Reputation</div>
                    </div>
                    ${myDmg ? `<div>
                        <div style="color:#e67e22;font-size:1.5em;font-weight:bold;">-${myDmg}</div>
                        <div style="color:#888;font-size:0.85em;">Health</div>
                    </div>` : ''}
                    <div>
                        <div style="color:#e74c3c;font-size:1.5em;font-weight:bold;">💔</div>
                        <div style="color:#888;font-size:0.85em;">Pride</div>
                    </div>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;text-align:center;color:#888;font-style:italic;">
                "You'll get them next time. Every Don takes a loss before they rise."
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('pvp-result-modal').remove();" style="background:#e74c3c;color:#fff;padding:12px 35px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">Dust Off</button>
            </div>
        `;

        logAction(`💀 Defeated by ${opponent}. Lost ${repLoss} reputation.${myDmg ? ` (HP -${myDmg})` : ''}`);
    }

    if (typeof updateUI === 'function') updateUI();
}

// Deferred name correction — retries a few times after connect to push the real name to the server
let _nameCorrectionAttempts = 0;
function _scheduleNameCorrection() {
    _nameCorrectionAttempts = 0;
    const interval = setInterval(() => {
        _nameCorrectionAttempts++;
        const realName = player.name && player.name.trim() !== '' ? player.name.trim() : null;
        if (realName && onlineWorldState.isConnected && onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            // Push corrected name to server
            onlineWorldState.socket.send(JSON.stringify({
                type: 'player_update',
                playerId: onlineWorldState.playerId,
                playerName: realName,
                money: player.money,
                reputation: player.reputation,
                level: player.level || 1,
                territory: player.territory
            }));
            clearInterval(interval);
        } else if (_nameCorrectionAttempts >= 10) {
            clearInterval(interval); // Give up after 10 attempts (10 seconds)
        }
    }, 1000);
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
            money: player.money,
            reputation: player.reputation,
            level: player.level || 1,
            territory: player.territory,
            playerState: {
                // Display-sync stats for other players to see
                gangMembers: (player.gangMembers || []).length,
                power: typeof calculatePower === 'function' ? calculatePower() : 0
            }
        }));
    }
}

// ==================== GLOBAL CHAT SYSTEM ====================
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
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin: 30px 0;">
                
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
                
                <!-- Assassination Contract -->
                <div style="background: linear-gradient(180deg, rgba(75, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.9) 100%); padding: 25px; border-radius: 15px; border: 2px solid #ff4444; cursor: pointer; transition: transform 0.2s;" onclick="showAssassination()" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="text-align: center;">
                        <div style="font-size: 4em; margin-bottom: 15px;">🎯</div>
                        <h3 style="color: #ff4444; margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 1.5em;">Assassination</h3>
                        <p style="color: #ff8888; margin: 0 0 15px 0; font-size: 0.95em;">Hunt rivals for a cut of their wealth</p>
                        <div style="background: rgba(0, 0, 0, 0.6); padding: 12px; border-radius: 8px; margin-top: 15px;">
                            <div style="color: #ccc; font-size: 0.85em; line-height: 1.6;">
                                🔫 Requires guns, bullets & vehicle<br>
                                💰 Steal 8-20% of target's cash<br>
                                🎲 Low odds — stack the deck<br>
                                🚔 Risk: Arrest on failure
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
                        <div style="color: #3498db; font-weight: bold; font-size: 1.3em;">${(player.gang && player.gang.members) || 0}</div>
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
           (player.skills.violence * 12) + 
           (player.skills.intelligence * 6) + 
           ((player.power || 0) * 2);
}

// Helper to calculate defense power for display
function calculateDefensePower() {
    const territoryCount = countControlledTerritories();
    return (player.level * 10) + 
           (player.reputation * 0.5) + 
           ((player.power || 0) * 2) + 
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
    // If not connected and not already trying, trigger connection
    if (!onlineWorldState.isConnected && onlineWorldState.connectionStatus !== 'connecting') {
        if (typeof connectToOnlineWorld === 'function') {
            connectToOnlineWorld();
        }
    }
    showGlobalChat();
}

function showGlobalChat() {
    
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
    
    multiplayerScreen.innerHTML = chatHTML;
    multiplayerScreen.style.display = 'block';
    
    // Show mobile UI elements if on mobile
    if (window.innerWidth <= 768) {
        const mobileActions = document.querySelector('.mobile-quick-actions');
        if (mobileActions) mobileActions.style.display = 'flex';
    }
    
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
async function ensurePlayerNameForChat() {
    // First try the regular ensurePlayerName
    let name = ensurePlayerName();
    if (name) {
        return name;
    }
    
    // If no name available, prompt the user
    let userName = await window.ui.prompt('Enter your criminal name for multiplayer chat:', 'Criminal_' + Math.floor(Math.random() * 1000));
    if (userName && userName.trim() !== '') {
        // Sanitize: strip HTML tags, limit length, remove control characters
        userName = userName.trim()
            .replace(/<[^>]*>/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .substring(0, 30);
        if (userName.length === 0) {
            window.ui.toast('Invalid name. Please try again.', 'error');
            return null;
        }
        player.name = userName;
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

async function sendChatMessage() {
    // Ensure player has a valid name before sending chat (prompt if needed)
    const playerName = await ensurePlayerNameForChat();
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
async function sendQuickChat(message) {
    // Ensure player has a valid name before sending quick chat (prompt if needed)
    const playerName = await ensurePlayerNameForChat();
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
    const status = onlineWorldState.connectionStatus;
    if (onlineWorldState.isConnected || status === 'connected') {
        const count = onlineWorldState.serverInfo.playerCount || 0;
        return `<span style="color: #2ecc71; font-family: 'Georgia', serif;">🟢 Connected to World Chat — ${count} player${count !== 1 ? 's' : ''} online</span>`;
    } else if (status === 'demo' || status === 'offline') {
        return `<span style="color: #e74c3c; font-family: 'Georgia', serif;">🔴 Server offline — retrying automatically...</span>`;
    } else if (status === 'error') {
        return `<span style="color: #e74c3c; font-family: 'Georgia', serif;">🔴 Server unavailable — retrying...</span>`;
    } else {
        return `<span style="color: #f39c12; font-family: 'Georgia', serif;">⏳ Connecting to World Chat...</span>`;
    }
}

// Generate online players HTML for chat
function generateOnlinePlayersHTML() {
    if (!onlineWorldState.nearbyPlayers || onlineWorldState.nearbyPlayers.length === 0) {
        return '<p style="color: #95a5a6; text-align: center;">Loading players...</p>';
    }
    
    return onlineWorldState.nearbyPlayers.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; margin: 2px 0; background: rgba(52, 73, 94, 0.3); border-radius: 5px;">
            <span style="color: ${p.color};"> ${escapeHTML(p.name)}</span>
            <span style="color: #95a5a6; font-size: 12px;">Level ${p.level}</span>
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
                                        <strong style="color: #c0a062; font-size: 1.1em;">${escapeHTML(district.charAt(0).toUpperCase() + district.slice(1))}</strong>
                                        <div style="margin: 5px 0; font-size: 0.85em;">
                                            <div style="color: #ccc;">Controlled by: <span style="color: ${isPlayerControlled ? '#27ae60' : '#95a5a6'};">${escapeHTML(controllerName || 'Unknown')}</span></div>
                                            <div style="color: #ccc;">Defense: <span style="color: #e74c3c;">${districtData.defenseRating}</span></div>
                                            <div style="color: #ccc;">Income: <span style="color: #27ae60;">$${districtData.weeklyIncome.toLocaleString()}/week</span></div>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <button onclick="viewTerritoryDetails('${escapeHTML(district)}')" 
                                                style="background: #f39c12; color: #000; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 5px; width: 100%;">
                                             Details
                                        </button>
                                        <button onclick="challengeForTerritory('${escapeHTML(district)}')" 
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
                <button onclick="showAssassination()" style="background: linear-gradient(180deg, #4b0000 0%, #1a0000 100%); color: #ff4444; padding: 15px; border: 1px solid #ff4444; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; font-weight: bold;">
                    🎯 Assassination<br><small style="color: #ff8888;">Hunt rivals for their cash</small>
                </button>
                <button onclick="showActiveHeists()" style="background: #333; color: #8b0000; padding: 15px; border: 1px solid #8b0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                     Big Scores<br><small style="color: #ccc;">Join ongoing jobs</small>
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
                <button onclick="showAlliancePanel()" style="background: #333; color: #c0a062; padding: 15px; border: 2px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    🤝 Alliances<br><small style="color: #ccc;">Form a crew</small>
                </button>
                <button onclick="showBountyBoard()" style="background: linear-gradient(180deg, #4a2600 0%, #1a0a00 100%); color: #ff6600; padding: 15px; border: 1px solid #ff6600; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    💀 Bounty Board<br><small style="color: #ffaa66;">Put a price on heads</small>
                </button>
                <button onclick="showRankedSeason()" style="background: linear-gradient(180deg, #1a1a3a 0%, #0a0a1a 100%); color: #ffd700; padding: 15px; border: 1px solid #ffd700; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    🏆 Ranked Season<br><small style="color: #ffe066;">ELO combat rating</small>
                </button>
                <button onclick="showSiegePanel()" style="background: linear-gradient(180deg, #2a1a00 0%, #0a0600 100%); color: #e67e22; padding: 15px; border: 1px solid #e67e22; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">
                    🏰 Territory Siege<br><small style="color: #f0a050;">Fortify & conquer</small>
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

    // Also update the chat screen's connection status if it's visible
    const chatStatus = document.getElementById('chat-connection-status');
    if (chatStatus) {
        chatStatus.innerHTML = getConnectionStatusHTML();
    }
}

// Initialize world data after connection
function initializeWorldData() {
    // Real data comes from the server — just set up empty defaults
    if (!onlineWorldState.nearbyPlayers) onlineWorldState.nearbyPlayers = [];
    if (!onlineWorldState.globalChat) onlineWorldState.globalChat = [];
    if (!onlineWorldState.serverInfo.cityEvents) onlineWorldState.serverInfo.cityEvents = [];
    if (!onlineWorldState.activeHeists) onlineWorldState.activeHeists = [];
    
    onlineWorldState.lastUpdate = new Date().toLocaleTimeString();

    // Refresh chat area and player list if currently visible
    const chatArea = document.getElementById('global-chat-area');
    if (chatArea) {
        chatArea.innerHTML = generateChatHTML();
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    const playerList = document.getElementById('chat-player-list');
    if (playerList) {
        playerList.innerHTML = generateOnlinePlayersHTML();
    }
}

// Start periodic world updates
let _worldUpdateInterval = null;
function startWorldUpdates() {
    if (_worldUpdateInterval) clearInterval(_worldUpdateInterval);
    _worldUpdateInterval = setInterval(() => {
        if (onlineWorldState.isConnected) {
            updateWorldState();
        }
    }, onlineWorld.updateInterval);
}

// Update world state — only runs when connected to real server
function updateWorldState() {
    onlineWorldState.lastUpdate = new Date().toLocaleTimeString();
    updateConnectionStatus();
}

// Show welcome message when connected
function showWelcomeMessage() {
    const messages = [
        "Welcome to the criminal underworld! The city awaits your influence.",
        "Other players are active. Watch your back and seize opportunities.",
        "Territory wars are brewing. Choose your alliances wisely.",
        "The streets are dangerous. Keep your weapons loaded and your eyes open.",
        "A new criminal empire rises. Will it be yours?"
    ];
    
    const welcomeMsg = messages[Math.floor(Math.random() * messages.length)];
    
    // Show as a non-blocking log message instead of an alert
    logAction(`🌐 ${welcomeMsg}`);
}

// Generate player ID
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// District exploration
function exploreDistrict(districtName) {
    const district = onlineWorldState.cityDistricts[districtName];
    
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world to explore districts!", 'error');
        return;
    }
    
    let districtHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;"> ${escapeHTML(districtName.charAt(0).toUpperCase() + districtName.slice(1))} District</h3>
            
            <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #555;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong style="color: #c0a062;">Crime Level:</strong> <span style="color: #ccc;">${district.crimeLevel}%</span></div>
                    <div><strong style="color: #c0a062;">Controlled By:</strong> <span style="color: #ccc;">${escapeHTML(district.controlledBy || 'No one')}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 20px 0;">
                <button onclick="doDistrictJob('${escapeHTML(districtName)}')" style="background: #333; color: #c0a062; padding: 10px; border: 1px solid #c0a062; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Find Work
                </button>
                <button onclick="claimTerritory('${escapeHTML(districtName)}')" style="background: #333; color: #8b0000; padding: 10px; border: 1px solid #8b0000; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Claim Turf
                </button>
                <button onclick="findPlayersInDistrict('${escapeHTML(districtName)}')" style="background: #333; color: #f39c12; padding: 10px; border: 1px solid #f39c12; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
                     Find Crew
                </button>
                <button onclick="startDistrictHeist('${escapeHTML(districtName)}')" style="background: #333; color: #27ae60; padding: 10px; border: 1px solid #27ae60; border-radius: 5px; cursor: pointer; font-family: 'Georgia', serif;">
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
// Active leaderboard category for tab switching
let _leaderboardCategory = 'reputation';

function loadGlobalLeaderboard() {
    const leaderboardElement = document.getElementById('global-leaderboard');
    if (!leaderboardElement) return;
    
    // Server now sends multi-category leaderboard
    const serverData = onlineWorldState.serverInfo.globalLeaderboard || {};
    const playerName = player.name || 'You';

    // Backwards compatibility: if serverData is an array (old format), wrap it
    const categories = Array.isArray(serverData)
        ? { reputation: serverData, wealth: [], combat: [], territories: [], ranked: [] }
        : serverData;

    const cat = _leaderboardCategory;
    const data = categories[cat] || [];

    // Tab bar
    const tabs = [
        { key: 'reputation', label: '⭐ Rep', color: '#f39c12' },
        { key: 'wealth', label: '💰 Wealth', color: '#2ecc71' },
        { key: 'combat', label: '⚔️ Combat', color: '#e74c3c' },
        { key: 'territories', label: '🏛️ Turf', color: '#3498db' },
        { key: 'ranked', label: '🏆 ELO', color: '#ffd700' }
    ];
    const tabHTML = `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">${tabs.map(t =>
        `<button onclick="_leaderboardCategory='${t.key}';loadGlobalLeaderboard();" style="background:${_leaderboardCategory === t.key ? t.color : '#222'};color:${_leaderboardCategory === t.key ? '#000' : '#ccc'};border:1px solid ${t.color};padding:5px 10px;border-radius:4px;cursor:pointer;font-family:Georgia,serif;font-size:0.8em;">${t.label}</button>`
    ).join('')}</div>`;

    let rows = '';
    if (data.length === 0) {
        rows = '<div style="color:#888;text-align:center;padding:15px;">No entries yet.</div>';
    } else {
        rows = data.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.name === playerName;
            let detail = '';
            if (cat === 'reputation') detail = `${entry.reputation || 0} rep`;
            else if (cat === 'wealth') detail = `$${(entry.money || 0).toLocaleString()}`;
            else if (cat === 'combat') detail = `${entry.pvpWins || 0}W / ${entry.pvpLosses || 0}L`;
            else if (cat === 'territories') detail = `${entry.territories || 0} owned`;
            else if (cat === 'ranked') detail = `${entry.icon || ''} ${entry.elo || 0} ELO (${entry.tier || '?'}) ${entry.wins || 0}W/${entry.losses || 0}L`;

            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;background:rgba(0,0,0,0.3);border-radius:5px;${isMe ? 'border:2px solid #2ecc71;' : ''}">
                <div>
                    <span style="color:${rank <= 3 ? '#f39c12' : '#ecf0f1'};">#${rank}</span>
                    <strong style="margin-left:10px;color:${isMe ? '#2ecc71' : '#ecf0f1'};">${escapeHTML(entry.name)}</strong>
                </div>
                <div style="color:#95a5a6;font-size:0.9em;">${detail}</div>
            </div>`;
        }).join('');
    }

    leaderboardElement.innerHTML = tabHTML + rows;
}

// World activity functions
function loadWorldActivityFeed() {
    const feedElement = document.getElementById('world-activity-feed');
    if (!feedElement) return;
    
    feedElement.innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 10px;">No activity yet. Connect to the server to see live events.</p>';
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
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world to chat!", 'error');
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
        window.ui.toast("You need to be connected to the online world to chat!", 'error');
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
        { player: 'ShadowDealer', message: 'Watch your back out there...', color: '#e74c3c' },
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
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }

    if (player.inJail) {
        showSystemMessage("You can't work while in jail!", '#e74c3c');
        return;
    }

    const district = onlineWorldState.cityDistricts[districtName];
    if (!district) {
        showJobs();
        return;
    }

    const crimeLevel = district.crimeLevel || 50;
    const riskMultiplier = crimeLevel / 100;
    const rewardMultiplier = 1 + (riskMultiplier * 0.5); // Higher crime = 0-50% more reward
    const dangerMultiplier = 1 + (riskMultiplier * 0.4); // Higher crime = 0-40% more danger
    const energyCost = 8;

    if (player.energy < energyCost) {
        showSystemMessage(`Not enough energy! Need ${energyCost} to work in ${districtName}.`, '#e74c3c');
        return;
    }

    // District-specific job pools
    const districtJobs = {
        downtown: [
            { name: 'Shake Down a Business', baseReward: [800, 2500], xp: 20, jailChance: 0.12, flavor: 'You walked into a shop and made the owner an offer he couldn\'t refuse.' },
            { name: 'Run a Con on Tourists', baseReward: [500, 1800], xp: 15, jailChance: 0.08, flavor: 'The tourists never saw it coming — wallets, watches, the works.' },
            { name: 'Intercept a Wire Transfer', baseReward: [2000, 5000], xp: 35, jailChance: 0.2, flavor: 'Your inside man at the bank tipped you off to a fat transfer.' }
        ],
        docks: [
            { name: 'Hijack a Shipping Container', baseReward: [1500, 4000], xp: 30, jailChance: 0.18, flavor: 'The container was full of electronics — easy money on the black market.' },
            { name: 'Smuggle Contraband', baseReward: [1000, 3000], xp: 25, jailChance: 0.15, flavor: 'You slipped the goods past customs in a fishing boat.' },
            { name: 'Bribe a Dock Foreman', baseReward: [600, 1500], xp: 15, jailChance: 0.06, flavor: 'Now you\'ve got eyes and ears on every shipment that comes through.' }
        ],
        suburbs: [
            { name: 'Burglarize a McMansion', baseReward: [1200, 3500], xp: 25, jailChance: 0.14, flavor: 'Rich family on vacation — their safe wasn\'t as secure as they thought.' },
            { name: 'Run a Prescription Scam', baseReward: [400, 1200], xp: 12, jailChance: 0.08, flavor: 'Fake prescriptions across three pharmacies. Quick and clean.' },
            { name: 'Steal Luxury Cars', baseReward: [2000, 5000], xp: 30, jailChance: 0.16, flavor: 'Three luxury cars boosted from driveways overnight.' }
        ],
        industrial: [
            { name: 'Rob a Warehouse', baseReward: [1000, 3000], xp: 22, jailChance: 0.15, flavor: 'Cut the fence, loaded the van, gone in eight minutes flat.' },
            { name: 'Steal Construction Equipment', baseReward: [800, 2000], xp: 18, jailChance: 0.1, flavor: 'Heavy machinery sells well to the right buyers.' },
            { name: 'Cook Product in an Abandoned Factory', baseReward: [1500, 4500], xp: 30, jailChance: 0.22, flavor: 'Your chemist turned raw materials into serious street value.' }
        ],
        redlight: [
            { name: 'Collect Protection Money', baseReward: [600, 2000], xp: 18, jailChance: 0.1, flavor: 'The clubs pay on time when you show up with muscle.' },
            { name: 'Run an Underground Card Game', baseReward: [1000, 3500], xp: 22, jailChance: 0.12, flavor: 'You took the house cut and nobody dared complain.' },
            { name: 'Fence Stolen Goods', baseReward: [800, 2500], xp: 20, jailChance: 0.09, flavor: 'Your fence moved the merch before dawn — cash in hand.' }
        ]
    };

    const jobPool = districtJobs[districtName] || districtJobs.downtown;
    const job = jobPool[Math.floor(Math.random() * jobPool.length)];

    // Apply district crime level modifiers
    const minReward = Math.floor(job.baseReward[0] * rewardMultiplier);
    const maxReward = Math.floor(job.baseReward[1] * rewardMultiplier);
    const adjustedJailChance = Math.min(0.5, job.jailChance * dangerMultiplier);
    const adjustedXp = Math.floor(job.xp * rewardMultiplier);

    // Deduct energy
    player.energy -= energyCost;

    // Check for arrest
    const arrested = Math.random() < adjustedJailChance;

    let resultModal = document.getElementById('district-job-modal');
    if (!resultModal) {
        resultModal = document.createElement('div');
        resultModal.id = 'district-job-modal';
        resultModal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:520px;max-width:95%;background:rgba(0,0,0,0.95);border:2px solid #c0a062;border-radius:12px;font-family:Georgia,serif;color:#ecf0f1;box-shadow:0 0 25px rgba(192,160,98,0.4);padding:25px;';
        document.body.appendChild(resultModal);
    }

    if (arrested) {
        const jailTime = 10 + Math.floor(Math.random() * 15);
        player.inJail = true;
        player.jailTime = jailTime;
        player.wantedLevel = Math.min(10, (player.wantedLevel || 0) + 1);

        resultModal.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#c0a062;margin:0 0 5px 0;">🏙️ ${districtName.charAt(0).toUpperCase() + districtName.slice(1)} District Job</h3>
                <small style="color:#888;">Crime Level: ${crimeLevel}%</small>
            </div>
            <div style="margin:15px 0;padding:12px;background:rgba(231,76,60,0.15);border:1px solid #e74c3c;border-radius:8px;">
                <p style="color:#e74c3c;font-weight:bold;margin:0 0 8px 0;">🚔 Busted!</p>
                <p style="margin:0;color:#ccc;">You attempted: <strong>${job.name}</strong></p>
                <p style="margin:8px 0 0 0;color:#e74c3c;">The cops were tipped off. You've been sentenced to ${jailTime} seconds in jail.</p>
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('district-job-modal').remove();if(typeof showJailScreen==='function')showJailScreen();" style="background:#e74c3c;color:white;padding:10px 30px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">Accept Your Fate</button>
            </div>
        `;

        logAction(`🚔 Busted doing a ${job.name} in ${districtName}! Jailed for ${jailTime}s.`);
        if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: true, jailTime: jailTime });
        if (typeof updateJailTimer === 'function') updateJailTimer();
    } else {
        const earned = minReward + Math.floor(Math.random() * (maxReward - minReward));
        player.money += earned;
        player.reputation = (player.reputation || 0) + 1;
        if (typeof gainExperience === 'function') {
            gainExperience(adjustedXp);
        } else {
            player.experience = (player.experience || 0) + adjustedXp;
        }

        resultModal.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#c0a062;margin:0 0 5px 0;">🏙️ ${districtName.charAt(0).toUpperCase() + districtName.slice(1)} District Job</h3>
                <small style="color:#888;">Crime Level: ${crimeLevel}% (${crimeLevel > 60 ? 'High Risk / High Reward' : crimeLevel > 35 ? 'Moderate Risk' : 'Low Profile'})</small>
            </div>
            <div style="margin:15px 0;padding:12px;background:rgba(46,204,113,0.12);border:1px solid #2ecc71;border-radius:8px;">
                <p style="color:#2ecc71;font-weight:bold;margin:0 0 8px 0;">✅ ${job.name}</p>
                <p style="margin:0;color:#ccc;font-style:italic;">${job.flavor}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0;">
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#2ecc71;font-size:1.2em;font-weight:bold;">+$${earned.toLocaleString()}</div>
                    <div style="color:#888;font-size:0.8em;">Cash</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#9b59b6;font-size:1.2em;font-weight:bold;">+${adjustedXp} XP</div>
                    <div style="color:#888;font-size:0.8em;">Experience</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#e67e22;font-size:1.2em;font-weight:bold;">-${energyCost}</div>
                    <div style="color:#888;font-size:0.8em;">Energy</div>
                </div>
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('district-job-modal').remove();" style="background:#c0a062;color:#1a1a1a;padding:10px 30px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;font-weight:bold;">Collect</button>
            </div>
        `;

        logAction(`💼 ${job.name} in ${districtName}: earned $${earned.toLocaleString()}, +${adjustedXp} XP`);
        addWorldEvent(`💼 ${player.name || 'A player'} pulled off a job in ${districtName}!`);
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof checkLevelUp === 'function') checkLevelUp();
}

async function claimTerritory(districtName) {
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }
    
    const district = onlineWorldState.cityDistricts[districtName];
    const cost = 50000 + (district.crimeLevel * 1000);
    
    if (player.money < cost) {
        window.ui.toast(`Not enough money! Need $${cost.toLocaleString()} to claim ${districtName}.`, 'error');
        return;
    }
    
    if (await window.ui.confirm(`Claim ${districtName} district for $${cost.toLocaleString()}? This will be visible to all players.`)) {
        // SERVER-AUTHORITATIVE INTENT: Do NOT mutate local money/territory.
        // Send territory_claim intent; server will validate cost, apply changes, then broadcast territory_taken.
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            onlineWorldState.socket.send(JSON.stringify({
                type: 'territory_claim',
                district: districtName
            }));
            logAction(` Territory claim intent sent for ${districtName} ($${cost.toLocaleString()}). Awaiting authoritative confirmation...`);
        } else {
            window.ui.toast('Connection lost before sending claim intent.', 'error');
        }
    }
}

function findPlayersInDistrict(districtName) {
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }
    
    const playersInDistrict = onlineWorldState.nearbyPlayers.filter(() => Math.random() > 0.5);
    
    if (playersInDistrict.length === 0) {
        window.ui.toast(`No other players currently in ${districtName} district.`, 'info');
        return;
    }
    
    let playersHTML = `
        <div style="background: rgba(0, 0, 0, 0.9); padding: 20px; border-radius: 15px; border: 2px solid #c0a062;">
            <h3 style="color: #c0a062; font-family: 'Georgia', serif;"> Crew in ${escapeHTML(districtName.charAt(0).toUpperCase() + districtName.slice(1))}</h3>
            <div style="margin: 20px 0;">
                ${playersInDistrict.map(p => `
                    <div style="background: rgba(20, 20, 20, 0.8); padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #555;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="color: #c0a062; margin: 0; font-family: 'Georgia', serif;">${escapeHTML(p.name)}</h4>
                                <div style="display: flex; gap: 20px; font-size: 0.9em; margin: 5px 0; color: #ccc;">
                                    <span>Level ${p.level}</span>
                                    <span>Rep: ${p.reputation}</span>
                                    <span>Territory: ${escapeHTML(p.territory)}</span>
                                    <span style="color: #27ae60;">● Online</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="challengePlayer('${escapeHTML(p.name)}')" style="background: #8b0000; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
                                     Challenge
                                </button>
                                <button onclick="inviteToHeist('${escapeHTML(p.name)}')" style="background: #f39c12; color: #000; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-family: 'Georgia', serif;">
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
                                <h4 style="color: #c0a062; margin: 0; font-family: 'Georgia', serif;">${escapeHTML(event.type.replace('_', ' ').toUpperCase())}</h4>
                                <p style="margin: 5px 0; color: #ccc;">${escapeHTML(event.description)}</p>
                                <small style="color: #999;">District: ${escapeHTML(event.district.charAt(0).toUpperCase() + event.district.slice(1))}</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #f39c12; font-weight: bold;"> ${escapeHTML(event.timeLeft)}</div>
                                <button onclick="participateInEvent('${escapeHTML(event.type)}', '${escapeHTML(event.district)}')" style="background: #9b59b6; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-family: 'Georgia', serif;">
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

// ==================== ASSASSINATION SYSTEM ====================

function showAssassination() {
    if (!onlineWorldState.isConnected) {
        window.ui.toast('You must be connected to the online world to order a hit.', 'error');
        return;
    }

    const content = document.getElementById('multiplayer-content');
    if (!content) return;

    if (typeof hideAllScreens === 'function') hideAllScreens();
    const mpScreen = document.getElementById('multiplayer-screen');
    if (mpScreen) mpScreen.style.display = 'block';

    // Check cooldown
    const lastAttemptTime = window._assassinationCooldownUntil || 0;
    const now = Date.now();
    const onCooldown = now < lastAttemptTime;
    let cooldownHTML = '';
    if (onCooldown) {
        const remaining = Math.ceil((lastAttemptTime - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        cooldownHTML = `
            <div style="background: rgba(255, 68, 68, 0.15); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #ff4444; text-align: center;">
                <div style="color: #ff4444; font-weight: bold; font-size: 1.1em;">⏳ Cooldown Active</div>
                <div style="color: #ff8888; margin-top: 5px;">Next hit available in: <strong>${mins}m ${secs}s</strong></div>
            </div>
        `;
    }

    // Gather player's assassination resources
    const guns = (player.inventory || []).filter(i => i.type === 'gun');
    const vehicles = (player.inventory || []).filter(i => i.type === 'car' || i.type === 'vehicle');
    const stolenCars = player.stolenCars || [];
    const totalVehicles = vehicles.length + stolenCars.length;
    const bestGun = guns.reduce((best, g) => (g.power || 0) > (best.power || 0) ? g : best, { name: 'None', power: 0 });
    const gangCount = (player.gang && player.gang.members) || 0;
    const bullets = player.ammo || 0;
    const hasGun = guns.length > 0;
    const hasBullets = bullets >= 3;
    const hasVehicle = totalVehicles > 0;
    const canAttempt = hasGun && hasBullets && hasVehicle && !onCooldown;

    // Calculate estimated chance (mirror server logic approximately)
    let estimatedChance = 8;
    estimatedChance += Math.min(bullets * 0.5, 15);
    estimatedChance += Math.min((bestGun.power || 0) * 0.05, 6);
    estimatedChance += Math.min((guns.length - 1) * 1, 5);
    estimatedChance += Math.min(totalVehicles * 2, 6);
    estimatedChance += Math.min(gangCount * 0.5, 10);
    estimatedChance += Math.min((player.power || 0) * 0.002, 5);
    estimatedChance = Math.max(5, Math.min(Math.round(estimatedChance), 20));

    // Get online players (not self, not in jail)
    const onlinePlayers = Object.values(onlineWorldState.playerStates || {}).filter(
        p => p.playerId !== onlineWorldState.playerId && !p.inJail
    );

    const requirementColor = (met) => met ? '#2ecc71' : '#e74c3c';
    const requirementIcon = (met) => met ? '✅' : '❌';

    let targetListHTML;
    if (onlinePlayers.length === 0) {
        targetListHTML = '<p style="color: #888; text-align: center; font-style: italic;">No valid targets online right now.</p>';
    } else {
        targetListHTML = onlinePlayers.map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: rgba(139, 0, 0, 0.15); border-radius: 8px; border: 1px solid #5a0000;">
                <div>
                    <strong style="color: #ff4444; font-family: 'Georgia', serif;">${escapeHTML(p.name)}</strong>
                    <br><small style="color: #999;">Level ${p.level || 1} | ${p.reputation || 0} rep</small>
                </div>
                <button onclick="attemptAssassination('${escapeHTML(p.name)}')" 
                    style="background: ${canAttempt ? 'linear-gradient(180deg, #8b0000 0%, #3a0000 100%)' : '#333'}; color: ${canAttempt ? '#ff4444' : '#666'}; padding: 10px 20px; border: 1px solid ${canAttempt ? '#ff0000' : '#555'}; border-radius: 6px; cursor: ${canAttempt ? 'pointer' : 'not-allowed'}; font-family: 'Georgia', serif; font-weight: bold;"
                    ${canAttempt ? '' : 'disabled'}>
                    🎯 Order Hit
                </button>
            </div>
        `).join('');
    }

    content.innerHTML = `
        <div style="background: rgba(0,0,0,0.95); padding: 30px; border-radius: 15px; border: 3px solid #8b0000;">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 3em;">🎯</div>
                <h2 style="color: #ff4444; font-family: 'Georgia', serif; font-size: 2em; margin: 10px 0 5px 0;">Assassination Contract</h2>
                <p style="color: #ff6666; font-style: italic; margin: 0;">Send a message they can't refuse. Hunt a rival and take their wealth.</p>
            </div>

            <!-- Requirements Box -->
            <div style="background: rgba(0,0,0,0.6); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif;">📋 Requirements</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid ${requirementColor(hasGun)};">
                        <div style="color: ${requirementColor(hasGun)}; font-weight: bold;">${requirementIcon(hasGun)} Firearm</div>
                        <div style="color: #ccc; font-size: 0.85em; margin-top: 5px;">${hasGun ? escapeHTML(bestGun.name) + ' (+' + bestGun.power + ')' : 'Need a gun from the Store'}</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid ${requirementColor(hasBullets)};">
                        <div style="color: ${requirementColor(hasBullets)}; font-weight: bold;">${requirementIcon(hasBullets)} Bullets (3+)</div>
                        <div style="color: #ccc; font-size: 0.85em; margin-top: 5px;">You have: ${bullets} rounds</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid ${requirementColor(hasVehicle)};">
                        <div style="color: ${requirementColor(hasVehicle)}; font-weight: bold;">${requirementIcon(hasVehicle)} Getaway Vehicle</div>
                        <div style="color: #ccc; font-size: 0.85em; margin-top: 5px;">${totalVehicles} vehicle${totalVehicles !== 1 ? 's' : ''} available</div>
                    </div>
                </div>
            </div>

            <!-- Odds Breakdown -->
            <div style="background: rgba(139, 0, 0, 0.15); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #5a0000;">
                <h3 style="color: #ff4444; margin: 0 0 15px 0; font-family: 'Georgia', serif;">🎲 Your Odds</h3>
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1; background: rgba(0,0,0,0.4); border-radius: 8px; height: 30px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #8b0000, #ff4444); height: 100%; width: ${estimatedChance}%; border-radius: 8px; transition: width 0.3s;"></div>
                    </div>
                    <div style="color: #ff4444; font-weight: bold; font-size: 1.3em; min-width: 50px;">${estimatedChance}%</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85em;">
                    <div style="color: #ccc;">🔫 Guns: <span style="color: #c0a062;">${guns.length}</span> <small style="color: #888;">(+${Math.min((guns.length - 1) * 1, 5)}%)</small></div>
                    <div style="color: #ccc;">💣 Bullets: <span style="color: #c0a062;">${bullets}</span> <small style="color: #888;">(+${Math.min(Math.round(bullets * 0.5), 15)}%)</small></div>
                    <div style="color: #ccc;">🚗 Vehicles: <span style="color: #c0a062;">${totalVehicles}</span> <small style="color: #888;">(+${Math.min(totalVehicles * 2, 6)}%)</small></div>
                    <div style="color: #ccc;">👥 Gang: <span style="color: #c0a062;">${gangCount}</span> <small style="color: #888;">(+${Math.min(Math.round(gangCount * 0.5), 10)}%)</small></div>
                    <div style="color: #ccc;">💪 Power: <span style="color: #c0a062;">${player.power || 0}</span> <small style="color: #888;">(+${Math.min(Math.round((player.power || 0) * 0.002), 5)}%)</small></div>
                    <div style="color: #ccc;">⚡ Base Chance: <span style="color: #888;">8%</span></div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #5a0000;">
                <div style="color: #ff6666; font-size: 0.85em;">⚠️ Costs 30 energy + 3-5 bullets. You WILL take heavy damage. 40% arrest chance on failure.</div>
                    <div style="color: #ff6666; font-size: 0.85em; margin-top: 4px;">💀 Gang members sent may be killed in the firefight (20% each).</div>
                    <div style="color: #c0a062; font-size: 0.85em; margin-top: 4px;">💰 Steal 8-20% of target's cash on success.</div>
                    <div style="color: #ff8800; font-size: 0.85em; margin-top: 4px;">⏳ 10 minute cooldown between attempts.</div>
                </div>
            </div>

            ${cooldownHTML}

            <!-- Target List -->
            <div style="background: rgba(0,0,0,0.6); padding: 20px; border-radius: 10px; border: 1px solid #555;">
                <h3 style="color: #c0a062; margin: 0 0 15px 0; font-family: 'Georgia', serif;">🎯 Select Target</h3>
                ${targetListHTML}
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
            </div>
        </div>
    `;
}

async function attemptAssassination(targetName) {
    if (!onlineWorldState.isConnected || !onlineWorldState.socket || onlineWorldState.socket.readyState !== WebSocket.OPEN) {
        window.ui.toast('Not connected to the server!', 'error');
        return;
    }

    // Check cooldown
    const now = Date.now();
    if (window._assassinationCooldownUntil && now < window._assassinationCooldownUntil) {
        const remaining = Math.ceil((window._assassinationCooldownUntil - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        window.ui.toast(`You must wait ${mins}m ${secs}s before attempting another hit.`, 'error');
        return;
    }

    // Validate local requirements
    const guns = (player.inventory || []).filter(i => i.type === 'gun');
    const vehicles = (player.inventory || []).filter(i => i.type === 'car' || i.type === 'vehicle');
    const stolenCars = player.stolenCars || [];
    const totalVehicles = vehicles.length + stolenCars.length;
    const bestGun = guns.reduce((best, g) => (g.power || 0) > (best.power || 0) ? g : best, { name: 'None', power: 0 });
    const gangCount = (player.gang && player.gang.members) || 0;
    const bullets = player.ammo || 0;

    if (guns.length < 1) { window.ui.toast('You need at least one gun!', 'error'); return; }
    if (bullets < 3) { window.ui.toast('You need at least 3 bullets!', 'error'); return; }
    if (totalVehicles < 1) { window.ui.toast('You need a getaway vehicle!', 'error'); return; }
    if ((player.energy || 0) < 30) { window.ui.toast('Not enough energy! You need 30 energy.', 'error'); return; }

    const confirmHit = await window.ui.confirm(
        `ORDER HIT ON ${targetName}?\n\n` +
        `This will cost:\n` +
        `• 30 Energy\n` +
        `• 3-5 Bullets\n` +
        `• You WILL take heavy health damage\n` +
        `• Gang members may die in the firefight\n` +
        `• 10 minute cooldown after attempt\n\n` +
        `Success is NOT guaranteed. You could get arrested.\n` +
        `Proceed?`
    );
    if (!confirmHit) return;

    // Send assassination intent to server
    onlineWorldState.socket.send(JSON.stringify({
        type: 'assassination_attempt',
        targetPlayer: targetName,
        bullets: bullets,
        gunCount: guns.length,
        bestGunPower: bestGun.power || 0,
        vehicleCount: totalVehicles,
        gangMembers: gangCount,
        power: player.power || 0
    }));

    logAction(`🎯 Sent a hitman after ${targetName}... awaiting results.`);

    // Show waiting state
    const content = document.getElementById('multiplayer-content');
    if (content) {
        content.innerHTML = `
            <div style="background: rgba(0,0,0,0.95); padding: 60px 30px; border-radius: 15px; border: 3px solid #8b0000; text-align: center;">
                <div style="font-size: 4em; margin-bottom: 20px;">🎯</div>
                <h2 style="color: #ff4444; font-family: 'Georgia', serif;">Hit in Progress...</h2>
                <p style="color: #ff6666; font-style: italic;">Your crew is moving on ${escapeHTML(targetName)}. Stand by.</p>
                <div style="margin-top: 20px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #8b0000; border-top-color: #ff4444; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            </div>
        `;
    }
}

// Handle assassination results from server
function handleAssassinationResult(message) {
    const content = document.getElementById('multiplayer-content');

    // Handle cooldown error (server rejected due to cooldown)
    if (message.cooldownRemaining && !message.targetName) {
        const mins = Math.floor(message.cooldownRemaining / 60);
        const secs = message.cooldownRemaining % 60;
        // Sync our local cooldown
        window._assassinationCooldownUntil = Date.now() + message.cooldownRemaining * 1000;
        if (content) {
            content.innerHTML = `
                <div style="background: rgba(0,0,0,0.95); padding: 40px; border-radius: 15px; border: 3px solid #ff8800; text-align: center;">
                    <div style="font-size: 4em; margin-bottom: 15px;">⏳</div>
                    <h2 style="color: #ff8800; font-family: 'Georgia', serif;">Cooldown Active</h2>
                    <p style="color: #ccc; margin: 15px 0;">${escapeHTML(message.error || 'You must wait before ordering another hit.')}</p>
                    <p style="color: #ff8800; font-size: 1.3em; font-weight: bold;">${mins}m ${secs}s remaining</p>
                    <button onclick="showAssassination()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; margin-top: 20px;">Back</button>
                </div>
            `;
        }
        return;
    }

    if (message.success) {
        // Deduct bullets locally
        player.ammo = Math.max(0, (player.ammo || 0) - (message.bulletsUsed || 3));

        // Sync authoritative money/rep from server
        if (typeof message.newMoney === 'number') player.money = message.newMoney;
        if (typeof message.newReputation === 'number') player.reputation = message.newReputation;
        if (typeof message.wantedLevel === 'number') player.wantedLevel = message.wantedLevel;
        player.energy = Math.max(0, (player.energy || 0) - 30);

        // Apply health damage
        if (typeof message.newHealth === 'number') player.health = message.newHealth;

        // Apply gang member losses
        const gangLost = message.gangMembersLost || 0;
        if (gangLost > 0 && player.gang) {
            for (let i = 0; i < gangLost; i++) {
                if (player.gang.gangMembers && player.gang.gangMembers.length > 0) {
                    player.gang.gangMembers.pop();
                }
                if (player.gang.members > 0) player.gang.members--;
            }
        }

        // Set cooldown
        window._assassinationCooldownUntil = Date.now() + (message.cooldownSeconds || 600) * 1000;

        if (typeof updateUI === 'function') updateUI();
        // Territory seizure from assassination
        const seizedTerritories = message.territoriesSeized || [];
        if (seizedTerritories.length > 0) {
            onlineWorldState.territories = message.territories || onlineWorldState.territories;
            logAction(`👑 Seized ${seizedTerritories.join(', ')} from ${message.targetName}!`);
        }

        logAction(`🎯 HIT SUCCESSFUL! Assassinated ${message.targetName} and stole $${(message.stolenAmount || 0).toLocaleString()} (${message.stealPercent}%)! +${message.repGain} rep. Took ${message.healthDamage || 0} damage.${gangLost > 0 ? ` Lost ${gangLost} gang member${gangLost > 1 ? 's' : ''}.` : ''}`);

        if (content) {
            const seizedHTML = seizedTerritories.length > 0
                ? `<div style="color: #ffd700; margin-top: 10px; font-size: 1.1em;">👑 Seized territories: ${seizedTerritories.map(t => t.replace(/_/g, ' ')).join(', ')}</div>`
                : '';
            content.innerHTML = `
                <div style="background: rgba(0,0,0,0.95); padding: 40px; border-radius: 15px; border: 3px solid #2ecc71; text-align: center;">
                    <div style="font-size: 4em; margin-bottom: 15px;">💀</div>
                    <h2 style="color: #2ecc71; font-family: 'Georgia', serif; font-size: 2em;">HIT SUCCESSFUL</h2>
                    <p style="color: #ccc; font-size: 1.1em; margin: 15px 0;">
                        ${escapeHTML(message.targetName)} has been eliminated.
                    </p>
                    <div style="background: rgba(46, 204, 113, 0.15); padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 350px; border: 1px solid #2ecc71;">
                        <div style="color: #2ecc71; font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">+$${(message.stolenAmount || 0).toLocaleString()}</div>
                        <div style="color: #ccc;">Stole ${message.stealPercent}% of their wealth</div>
                        <div style="color: #c0a062; margin-top: 8px;">+${message.repGain} Reputation</div>
                        <div style="color: #ff6666; margin-top: 4px;">+25 Wanted Level</div>
                        <div style="color: #ff4444; margin-top: 8px;">❤️ -${message.healthDamage || 0} Health (now ${message.newHealth || '?'})</div>
                        ${(message.gangMembersLost || 0) > 0 ? '<div style="color: #ff8800; margin-top: 4px;">💀 Lost ' + message.gangMembersLost + ' gang member' + (message.gangMembersLost > 1 ? 's' : '') + ' in the firefight</div>' : ''}
                        ${seizedHTML}
                        <div style="color: #888; margin-top: 8px; font-size: 0.85em;">Hit chance was ${message.chance}% | ${message.bulletsUsed} bullets used</div>
                        <div style="color: #ff8800; margin-top: 4px; font-size: 0.85em;">⏳ Next hit available in 10 minutes</div>
                    </div>
                    <div style="margin-top: 25px;">
                        <button onclick="showAssassination()" style="background: #8b0000; color: #fff; padding: 12px 25px; border: 1px solid #ff0000; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif; margin-right: 10px;">🎯 Another Hit</button>
                        <button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: 'Georgia', serif;">Back</button>
                    </div>
                </div>
            `;
        }
    } else {
        // Failed
        player.ammo = Math.max(0, (player.ammo || 0) - (message.bulletsUsed || 3));
        player.energy = Math.max(0, (player.energy || 0) - 30);
        if (typeof message.wantedLevel === 'number') player.wantedLevel = message.wantedLevel;

        // Apply health damage
        if (typeof message.newHealth === 'number') player.health = message.newHealth;

        // Apply gang member losses
        const gangLostFail = message.gangMembersLost || 0;
        if (gangLostFail > 0 && player.gang) {
            for (let i = 0; i < gangLostFail; i++) {
                if (player.gang.gangMembers && player.gang.gangMembers.length > 0) {
                    player.gang.gangMembers.pop();
                }
                if (player.gang.members > 0) player.gang.members--;
            }
        }

        // Set cooldown
        window._assassinationCooldownUntil = Date.now() + (message.cooldownSeconds || 600) * 1000;

        if (message.arrested) {
            player.inJail = true;
            player.jailTime = message.jailTime || 25;
            player.breakoutAttempts = 3;
            if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: true, jailTime: player.jailTime });
            if (typeof updateJailTimer === 'function') updateJailTimer();
            if (typeof generateJailPrisoners === 'function') generateJailPrisoners();
        }

        if (typeof updateUI === 'function') updateUI();
        logAction(`🎯 HIT FAILED on ${message.targetName}!${message.arrested ? ' ARRESTED!' : ''} -${message.repLoss} rep. Took ${message.healthDamage || 0} damage.${(message.gangMembersLost || 0) > 0 ? ` Lost ${message.gangMembersLost} gang member${message.gangMembersLost > 1 ? 's' : ''}.` : ''}`);

        if (content) {
            content.innerHTML = `
                <div style="background: rgba(0,0,0,0.95); padding: 40px; border-radius: 15px; border: 3px solid ${message.arrested ? '#ff0000' : '#ff8800'}; text-align: center;">
                    <div style="font-size: 4em; margin-bottom: 15px;">${message.arrested ? '🚔' : '💨'}</div>
                    <h2 style="color: ${message.arrested ? '#ff4444' : '#ff8800'}; font-family: 'Georgia', serif; font-size: 2em;">
                        ${message.arrested ? 'HIT FAILED — ARRESTED!' : 'HIT FAILED — ESCAPED'}
                    </h2>
                    <p style="color: #ccc; font-size: 1.1em; margin: 15px 0;">
                        ${escapeHTML(message.error || 'The hit didn\'t go as planned.')}
                    </p>
                    <div style="background: rgba(139, 0, 0, 0.2); padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 350px; border: 1px solid #8b0000;">
                        <div style="color: #ff4444;">-${message.repLoss || 0} Reputation</div>
                        <div style="color: #ff8800; margin-top: 4px;">+15 Wanted Level</div>
                        <div style="color: #ff4444; margin-top: 4px;">❤️ -${message.healthDamage || 0} Health (now ${message.newHealth || '?'})</div>
                        ${(message.gangMembersLost || 0) > 0 ? '<div style="color: #ff8800; margin-top: 4px;">💀 Lost ' + message.gangMembersLost + ' gang member' + (message.gangMembersLost > 1 ? 's' : '') + ' in the firefight</div>' : ''}
                        <div style="color: #888; margin-top: 4px;">${message.bulletsUsed || 3} bullets wasted</div>
                        ${message.arrested ? '<div style="color: #ff0000; margin-top: 8px; font-weight: bold;">Jail Time: ' + (message.jailTime || 25) + ' seconds</div>' : ''}
                        <div style="color: #888; margin-top: 8px; font-size: 0.85em;">Hit chance was ${message.chance}%</div>
                        <div style="color: #ff8800; margin-top: 4px; font-size: 0.85em;">⏳ Next hit available in 10 minutes</div>
                    </div>
                    <div style="margin-top: 25px;">
                        ${message.arrested
                            ? '<button onclick="if(typeof showJailScreen===\'function\') showJailScreen();" style="background: #8b0000; color: #fff; padding: 12px 25px; border: 1px solid #ff0000; border-radius: 8px; cursor: pointer; font-family: \'Georgia\', serif;">Go to Jail</button>'
                            : '<button onclick="showAssassination()" style="background: #8b0000; color: #fff; padding: 12px 25px; border: 1px solid #ff0000; border-radius: 8px; cursor: pointer; font-family: \'Georgia\', serif; margin-right: 10px;">🎯 Try Again</button><button onclick="goBackToMainMenu()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: \'Georgia\', serif;">Back</button>'
                        }
                    </div>
                </div>
            `;
        }

        // If arrested, auto-redirect to jail screen after a moment
        if (message.arrested && typeof showJailScreen === 'function') {
            setTimeout(() => showJailScreen(), 3000);
        }
    }
}

function handleAssassinationVictim(message) {
    // You were assassinated by someone — show notification
    if (typeof message.newMoney === 'number') player.money = message.newMoney;
    if (typeof updateUI === 'function') updateUI();

    const stolenStr = (message.stolenAmount || 0).toLocaleString();
    logAction(`💀 You were assassinated by ${message.attackerName}! They stole $${stolenStr} (${message.stealPercent}%) of your cash!`);
    addWorldEvent(`💀 ${message.attackerName} assassinated you and stole $${stolenStr}!`);

    // Show prominent notification
    if (typeof showBriefNotification === 'function') {
        showBriefNotification(`💀 ASSASSINATED by ${message.attackerName}! Lost $${stolenStr}!`, 6000);
    } else {
        window.ui.alert(`💀 You were assassinated by ${message.attackerName}!\n\nThey stole $${stolenStr} (${message.stealPercent}%) of your cash!`);
    }
}

function handleAssassinationSurvived(message) {
    // Someone tried to kill you and failed
    logAction(`🛡️ ${message.attackerName} sent a hitman after you, but the attempt FAILED!`);
    addWorldEvent(`🛡️ Survived an assassination attempt by ${message.attackerName}!`);

    if (typeof showBriefNotification === 'function') {
        showBriefNotification(`🛡️ Survived a hit from ${message.attackerName}!`, 5000);
    } else {
        window.ui.alert(`🛡️ Someone tried to assassinate you!\n\n${message.attackerName} sent a hitman, but you survived!`);
    }
}

// Player interaction functions
function challengePlayer(playerName) {
    if (!onlineWorldState.isConnected) {
        showSystemMessage('You need to be connected to the online world!', '#e74c3c');
        return;
    }

    const energyCost = 5;
    if (player.energy < energyCost) {
        showSystemMessage(`Not enough energy! Need ${energyCost} to fight.`, '#e74c3c');
        return;
    }

    if (player.inJail) {
        showSystemMessage('You can\'t fight while in jail!', '#e74c3c');
        return;
    }

    // Show challenge confirmation modal instead of confirm()
    let modal = document.getElementById('pvp-challenge-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pvp-challenge-modal';
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:450px;max-width:95%;background:rgba(0,0,0,0.95);border:2px solid #8b0000;border-radius:12px;font-family:Georgia,serif;color:#ecf0f1;box-shadow:0 0 30px rgba(139,0,0,0.6);padding:25px;';
        document.body.appendChild(modal);
    }

    // Find target player info from nearby players
    const targetInfo = (onlineWorldState.nearbyPlayers || []).find(p => p.name === playerName);
    const targetLevel = targetInfo ? (targetInfo.level || '?') : '?';
    const targetRep = targetInfo ? (targetInfo.reputation || '?') : '?';

    modal.innerHTML = `
        <div style="text-align:center;">
            <h3 style="color:#8b0000;margin:0;">⚔️ Challenge to Combat</h3>
        </div>
        <div style="margin:20px 0;display:grid;grid-template-columns:1fr auto 1fr;gap:15px;align-items:center;">
            <div style="text-align:center;padding:15px;background:rgba(46,204,113,0.1);border:1px solid #2ecc71;border-radius:8px;">
                <div style="color:#2ecc71;font-weight:bold;font-size:1.1em;">${escapeHTML(player.name || 'You')}</div>
                <div style="color:#888;font-size:0.85em;margin-top:5px;">Lvl ${player.level || 1}</div>
                <div style="color:#888;font-size:0.85em;">Rep: ${Math.floor(player.reputation || 0)}</div>
            </div>
            <div style="color:#8b0000;font-size:1.5em;font-weight:bold;">VS</div>
            <div style="text-align:center;padding:15px;background:rgba(231,76,60,0.1);border:1px solid #e74c3c;border-radius:8px;">
                <div style="color:#e74c3c;font-weight:bold;font-size:1.1em;">${escapeHTML(playerName)}</div>
                <div style="color:#888;font-size:0.85em;margin-top:5px;">Lvl ${targetLevel}</div>
                <div style="color:#888;font-size:0.85em;">Rep: ${targetRep}</div>
            </div>
        </div>
        <div style="text-align:center;color:#888;font-size:0.85em;margin-bottom:15px;">Cost: ${energyCost} energy | Winner gains reputation</div>
        <div style="display:flex;gap:10px;justify-content:center;">
            <button onclick="executePvpChallenge('${escapeHTML(playerName)}', ${energyCost})" style="background:#8b0000;color:#fff;padding:12px 30px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">⚔️ Fight</button>
            <button onclick="document.getElementById('pvp-challenge-modal').remove();" style="background:#333;color:#c0a062;padding:12px 30px;border:1px solid #c0a062;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">Walk Away</button>
        </div>
    `;
}

function executePvpChallenge(playerName, energyCost) {
    // Remove confirmation modal
    const modal = document.getElementById('pvp-challenge-modal');
    if (modal) modal.remove();

    // Deduct energy
    player.energy -= energyCost;
    if (typeof updateUI === 'function') updateUI();

    // Send challenge to server for authoritative resolution
    // Include combat stats so server can use the balanced formula
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({
            type: 'player_challenge',
            targetPlayer: playerName,
            playerName: player.name,
            level: player.level,
            reputation: player.reputation,
            power: typeof calculatePower === 'function' ? calculatePower() : 0,
            gangMembers: (player.gangMembers || []).length
        }));

        // Show a "waiting" notification
        showSystemMessage(`⚔️ Engaging ${playerName} in combat...`, '#f39c12');
        logAction(`⚔️ Challenged ${playerName} to combat!`);
    } else {
        // Refund energy on connection failure
        player.energy += energyCost;
        showSystemMessage('Connection lost. Try reconnecting.', '#e74c3c');
        if (typeof updateUI === 'function') updateUI();
    }
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

function spectateWar(district) {
    if (!district) return;

    // Try to pull real war data from server state
    const wars = onlineWorldState.gangWars || [];
    const warData = wars.find(w => w.district === district);
    const attackerName = warData ? (warData.attacker || 'Unknown Crew') : 'Attacking Crew';
    const defenderName = warData ? (warData.defender || 'District Defenders') : 'Local Defenders';

    // Create or reuse modal container
    let modal = document.getElementById('turf-war-spectator');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'turf-war-spectator';
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:600px;max-width:95%;background:rgba(0,0,0,0.95);border:2px solid #8b0000;border-radius:12px;font-family:Georgia,serif;color:#ecf0f1;box-shadow:0 0 25px rgba(139,0,0,0.7);padding:20px;';
        document.body.appendChild(modal);
    }
    modal.innerHTML = '';

    // Initial strengths influenced by war data if available
    const attackerStrengthStart = (warData ? 70 : 60) + Math.floor(Math.random()*30);
    const defenderStrengthStart = (warData ? 65 : 55) + Math.floor(Math.random()*35);
    let attackerStrength = attackerStrengthStart;
    let defenderStrength = defenderStrengthStart;
    let tick = 0;
    const maxTicks = 12 + Math.floor(Math.random()*5);
    let playerBet = null; // track if the player placed a bet

    // Header with real names
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    header.innerHTML = `
        <div>
            <h3 style="margin:0;color:#ff4444;text-shadow:2px 2px 6px #8b0000;">⚔️ Turf War: ${escapeHTML(district)}</h3>
            <div style="font-size:0.85em;color:#ccc;margin-top:4px;"><span style="color:#ff4444;">${escapeHTML(attackerName)}</span> vs <span style="color:#00a884;">${escapeHTML(defenderName)}</span></div>
        </div>
        <button style="background:#333;color:#c0a062;padding:6px 12px;border:1px solid #c0a062;border-radius:6px;cursor:pointer;" onclick="clearInterval(window._warSpectateInterval);document.getElementById('turf-war-spectator').remove();">✕ Close</button>
    `;
    modal.appendChild(header);

    // Betting section
    const betSection = document.createElement('div');
    betSection.id = 'war-bet-section';
    betSection.style.cssText = 'margin:10px 0;padding:12px;background:rgba(192,160,98,0.1);border:1px solid #c0a062;border-radius:8px;text-align:center;';
    const betAmount = Math.min(5000, Math.max(500, Math.floor(player.money * 0.05)));
    betSection.innerHTML = `
        <div style="color:#c0a062;font-weight:bold;margin-bottom:8px;">💰 Place a Bet ($${betAmount.toLocaleString()})</div>
        <div style="display:flex;gap:10px;justify-content:center;">
            <button id="bet-attacker-btn" onclick="window._placeWarBet('attacker')" style="background:#8b0000;color:#fff;padding:8px 18px;border:none;border-radius:5px;cursor:pointer;">${escapeHTML(attackerName)}</button>
            <button id="bet-defender-btn" onclick="window._placeWarBet('defender')" style="background:#004d40;color:#fff;padding:8px 18px;border:none;border-radius:5px;cursor:pointer;">${escapeHTML(defenderName)}</button>
            <button onclick="document.getElementById('war-bet-section').style.display='none';" style="background:#333;color:#888;padding:8px 12px;border:1px solid #555;border-radius:5px;cursor:pointer;">Skip</button>
        </div>
    `;
    modal.appendChild(betSection);

    // Place bet handler — sends intent to server, server handles money
    window._placeWarBet = function(side) {
        if (playerBet) return;
        if (player.money < betAmount) {
            showSystemMessage('Not enough cash to place a bet!', '#e74c3c');
            return;
        }

        // Send bet to server for authoritative money handling
        if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
            playerBet = side; // Mark locally so we can't double-bet
            onlineWorldState.socket.send(JSON.stringify({
                type: 'war_bet',
                district: district,
                side: side,
                amount: betAmount
            }));
            betSection.innerHTML = `<div style="color:#c0a062;">💰 Bet placed: <strong>$${betAmount.toLocaleString()}</strong> on <strong>${side === 'attacker' ? escapeHTML(attackerName) : escapeHTML(defenderName)}</strong> — awaiting outcome...</div>`;
        } else {
            showSystemMessage('Not connected to server. Can\'t place bet.', '#e74c3c');
        }
    };

    const barsContainer = document.createElement('div');
    barsContainer.style.margin = '12px 0 10px 0';
    barsContainer.innerHTML = `
        <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85em;margin-bottom:3px;">
                <span style="color:#ff4444;">⚔️ ${escapeHTML(attackerName)}</span>
                <span id="attacker-strength-val">${attackerStrength}</span>
            </div>
            <div style="background:#222;height:16px;border:1px solid #444;border-radius:8px;overflow:hidden;">
                <div id="attacker-bar" style="height:100%;width:${(attackerStrength/attackerStrengthStart)*100}%;background:linear-gradient(90deg,#8b0000,#ff4444);transition:width 0.4s;"></div>
            </div>
        </div>
        <div>
            <div style="display:flex;justify-content:space-between;font-size:0.85em;margin-bottom:3px;">
                <span style="color:#00a884;">🛡️ ${escapeHTML(defenderName)}</span>
                <span id="defender-strength-val">${defenderStrength}</span>
            </div>
            <div style="background:#222;height:16px;border:1px solid #444;border-radius:8px;overflow:hidden;">
                <div id="defender-bar" style="height:100%;width:${(defenderStrength/defenderStrengthStart)*100}%;background:linear-gradient(90deg,#004d40,#00a884);transition:width 0.4s;"></div>
            </div>
        </div>
    `;
    modal.appendChild(barsContainer);

    const logArea = document.createElement('div');
    logArea.style.cssText = 'height:180px;overflow-y:auto;background:rgba(255,255,255,0.06);padding:10px;border:1px solid #444;border-radius:6px;font-size:0.85em;';
    logArea.id = 'war-event-log';
    modal.appendChild(logArea);

    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:12px;font-size:0.8em;color:#95a5a6;text-align:center;';
    footer.innerHTML = 'Live engagement feed — watch the battle unfold...';
    modal.appendChild(footer);

    // Combat event flavor text pools
    const attackerEvents = [
        `${attackerName}'s crew surges forward`,
        `${attackerName} sends in a second wave`,
        `A Molotov from ${attackerName}'s side ignites the barricade`,
        `${attackerName}'s enforcer takes out a key defender`,
        `${attackerName} flanks from the alley`
    ];
    const defenderEvents = [
        `${defenderName} dig in behind cover`,
        `${defenderName} call for backup`,
        `A sniper from ${defenderName} pins down the assault`,
        `${defenderName} launch a counter-charge`,
        `${defenderName} set up a chokepoint`
    ];
    const swingEvents = [
        'A car explodes, sending both sides scrambling!',
        'Sirens in the distance — both sides regroup.',
        'A civilian runs through the crossfire causing chaos.',
        'Reinforcements arrive from an unexpected ally!',
        'Someone shoots out the streetlights — darkness falls.'
    ];

    function log(msg) {
        const line = document.createElement('div');
        line.style.cssText = 'margin:3px 0;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
        line.textContent = msg;
        logArea.appendChild(line);
        logArea.scrollTop = logArea.scrollHeight;
    }

    log(`You take position on a rooftop overlooking ${district}...`);
    log(`${attackerName} moves in on ${defenderName}'s turf.`);

    const attackerBar = () => document.getElementById('attacker-bar');
    const defenderBar = () => document.getElementById('defender-bar');
    const attackerVal = () => document.getElementById('attacker-strength-val');
    const defenderVal = () => document.getElementById('defender-strength-val');

    const interval = setInterval(() => {
        tick++;

        const attackerHit = Math.random() < 0.55;
        const defenderHit = Math.random() < 0.5;

        if (attackerHit) {
            const dmg = 3 + Math.floor(Math.random()*6);
            defenderStrength = Math.max(0, defenderStrength - dmg);
            log(`${attackerEvents[Math.floor(Math.random()*attackerEvents.length)]} (-${dmg})`);
        }
        if (defenderHit) {
            const dmg = 2 + Math.floor(Math.random()*6);
            attackerStrength = Math.max(0, attackerStrength - dmg);
            log(`${defenderEvents[Math.floor(Math.random()*defenderEvents.length)]} (-${dmg})`);
        }

        if (Math.random() < 0.15) {
            const swingTarget = Math.random() < 0.5 ? 'attacker' : 'defender';
            const swing = 4 + Math.floor(Math.random()*5);
            log(swingEvents[Math.floor(Math.random()*swingEvents.length)]);
            if (swingTarget === 'attacker') {
                attackerStrength += swing;
            } else {
                defenderStrength += swing;
            }
        }

        const ab = attackerBar();
        const db = defenderBar();
        const av = attackerVal();
        const dv = defenderVal();
        if (!ab || !db) { clearInterval(interval); return; }
        ab.style.width = `${Math.max(0,(attackerStrength/attackerStrengthStart)*100)}%`;
        db.style.width = `${Math.max(0,(defenderStrength/defenderStrengthStart)*100)}%`;
        if (av) av.textContent = Math.max(0, attackerStrength);
        if (dv) dv.textContent = Math.max(0, defenderStrength);

        if (attackerStrength <= 0 || defenderStrength <= 0 || tick >= maxTicks) {
            clearInterval(interval);
            let outcome;
            let winningSide;
            if (attackerStrength === defenderStrength) {
                outcome = 'Stalemate — both sides withdraw, licking their wounds.';
                winningSide = null;
            } else if (attackerStrength > defenderStrength) {
                outcome = `${escapeHTML(attackerName)} overwhelms the defense — the district is theirs!`;
                winningSide = 'attacker';
                addWorldEvent?.(`⚔️ ${escapeHTML(attackerName)} seized ${escapeHTML(district)} from ${escapeHTML(defenderName)}!`);
            } else {
                outcome = `${escapeHTML(defenderName)} holds firm — ${escapeHTML(attackerName)} retreats into the night.`;
                winningSide = 'defender';
                addWorldEvent?.(`🛡️ ${escapeHTML(defenderName)} repelled ${escapeHTML(attackerName)}'s assault on ${escapeHTML(district)}.`);
            }
            log(`--- Battle concludes ---`);
            log(outcome);

            // Resolve bet — outcome was already decided server-side via war_bet_result
            // We just show the animation outcome. Actual money was handled by the server.
            let betResult = '';
            if (playerBet && window._lastWarBetResult) {
                const res = window._lastWarBetResult;
                if (res.won) {
                    betResult = `<div style="margin-top:10px;padding:10px;background:rgba(46,204,113,0.2);border:1px solid #2ecc71;border-radius:6px;color:#2ecc71;text-align:center;">💰 You won the bet! +$${(res.payout || 0).toLocaleString()}</div>`;
                    logAction(`💰 Won $${(res.payout || 0).toLocaleString()} betting on the turf war in ${escapeHTML(district)}!`);
                } else {
                    betResult = `<div style="margin-top:10px;padding:10px;background:rgba(231,76,60,0.2);border:1px solid #e74c3c;border-radius:6px;color:#e74c3c;text-align:center;">💸 You lost the bet. -$${(res.betAmount || 0).toLocaleString()}</div>`;
                    logAction(`💸 Lost $${(res.betAmount || 0).toLocaleString()} betting on the turf war in ${escapeHTML(district)}.`);
                }
                // Sync money from server
                if (res.newMoney !== undefined) player.money = res.newMoney;
                window._lastWarBetResult = null;
                if (typeof updateUI === 'function') updateUI();
            }

            footer.innerHTML = `<div style="color:#c0a062;font-weight:bold;">${outcome}</div>${betResult}`;
            logAction?.(`⚔️ Spectated turf war in ${escapeHTML(district)}: ${outcome}`);
        }
    }, 1000);
    window._warSpectateInterval = interval;
}

// Removed placeholder challengeForTerritory(district); full implementation defined later.

function participateInEvent(eventType, district) {
    if (!onlineWorldState.isConnected) {
        window.ui.toast("You need to be connected to the online world!", 'error');
        return;
    }

    // Energy cost to participate
    const energyCost = 10;
    if (player.energy < energyCost) {
        showSystemMessage(`Not enough energy! Need ${energyCost} energy to participate.`, '#e74c3c');
        return;
    }

    // Define event outcomes based on type
    const eventOutcomes = {
        police_raid: {
            title: 'Police Raid',
            icon: '🚔',
            scenarios: [
                { text: 'You slipped through the police barricade and looted an evidence lockup.', moneyMin: 800, moneyMax: 3000, xp: 30, repGain: 3, successChance: 0.5, riskText: 'But a detective spotted you fleeing the scene.', healthLoss: 15, wantedGain: 1 },
                { text: 'Chaos erupted and you picked pockets in the confusion.', moneyMin: 300, moneyMax: 1200, xp: 15, repGain: 1, successChance: 0.65, riskText: 'A stray baton caught you across the ribs.', healthLoss: 10, wantedGain: 0 },
                { text: 'You tipped off a rival gang and the cops took them down instead.', moneyMin: 500, moneyMax: 2000, xp: 25, repGain: 5, successChance: 0.55, riskText: 'The rival gang figured out who snitched.', healthLoss: 20, wantedGain: 0 }
            ]
        },
        market_crash: {
            title: 'Market Crash',
            icon: '📉',
            scenarios: [
                { text: 'You bought seized assets at rock-bottom prices and flipped them.', moneyMin: 1500, moneyMax: 5000, xp: 35, repGain: 2, successChance: 0.6, riskText: 'Turns out the assets were flagged — you lost some to seizure.', healthLoss: 0, wantedGain: 1 },
                { text: 'You shorted a corrupt businessman\'s portfolio through your contacts.', moneyMin: 2000, moneyMax: 6000, xp: 40, repGain: 4, successChance: 0.45, riskText: 'The businessman sent enforcers to collect.', healthLoss: 15, wantedGain: 0 },
                { text: 'You laundered cash through panicking banks while no one was looking.', moneyMin: 1000, moneyMax: 4000, xp: 20, repGain: 1, successChance: 0.55, riskText: 'A suspicious teller flagged the transactions.', healthLoss: 0, wantedGain: 2 }
            ]
        },
        gang_meeting: {
            title: 'Gang Meeting',
            icon: '🤝',
            scenarios: [
                { text: 'You impressed the bosses and received a cut of their operation.', moneyMin: 600, moneyMax: 2500, xp: 30, repGain: 6, successChance: 0.5, riskText: 'A rival at the meeting took offense and jumped you after.', healthLoss: 20, wantedGain: 0 },
                { text: 'You brokered a deal between two factions and took a commission.', moneyMin: 1000, moneyMax: 3500, xp: 35, repGain: 8, successChance: 0.45, riskText: 'One side felt you favored the other — they want payback.', healthLoss: 10, wantedGain: 0 },
                { text: 'You gathered intel on upcoming operations while making connections.', moneyMin: 200, moneyMax: 800, xp: 45, repGain: 4, successChance: 0.7, riskText: 'Someone noticed you eavesdropping a bit too much.', healthLoss: 5, wantedGain: 0 }
            ]
        },
        turf_war: {
            title: 'Turf War',
            icon: '⚔️',
            scenarios: [
                { text: 'You fought alongside the winning side and claimed spoils.', moneyMin: 1200, moneyMax: 4000, xp: 40, repGain: 5, successChance: 0.45, riskText: 'You caught a bullet in the crossfire.', healthLoss: 25, wantedGain: 1 },
                { text: 'You looted abandoned stash houses during the fighting.', moneyMin: 800, moneyMax: 3000, xp: 20, repGain: 2, successChance: 0.6, riskText: 'A straggler caught you raiding their stash.', healthLoss: 15, wantedGain: 0 },
                { text: 'You supplied weapons to both sides and took profit from the carnage.', moneyMin: 2000, moneyMax: 5000, xp: 30, repGain: 3, successChance: 0.5, riskText: 'Both sides realized you were playing them.', healthLoss: 30, wantedGain: 1 }
            ]
        }
    };

    // Default for unknown event types
    const eventData = eventOutcomes[eventType] || {
        title: eventType.replace(/_/g, ' '),
        icon: '🎯',
        scenarios: [
            { text: 'You got involved and made some connections.', moneyMin: 300, moneyMax: 1500, xp: 20, repGain: 2, successChance: 0.55, riskText: 'Things didn\'t go entirely smooth.', healthLoss: 10, wantedGain: 0 }
        ]
    };

    // Pick a random scenario
    const scenario = eventData.scenarios[Math.floor(Math.random() * eventData.scenarios.length)];

    // Deduct energy
    player.energy -= energyCost;

    // Level bonus: higher level = slightly better success chance
    const levelBonus = Math.min(0.15, (player.level || 1) * 0.01);
    const success = Math.random() < (scenario.successChance + levelBonus);

    // Build the result modal
    let modal = document.getElementById('event-participation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'event-participation-modal';
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:550px;max-width:95%;background:rgba(0,0,0,0.95);border:2px solid #9b59b6;border-radius:12px;font-family:Georgia,serif;color:#ecf0f1;box-shadow:0 0 25px rgba(155,89,182,0.5);padding:25px;';
        document.body.appendChild(modal);
    }

    if (success) {
        const moneyEarned = scenario.moneyMin + Math.floor(Math.random() * (scenario.moneyMax - scenario.moneyMin));
        player.money += moneyEarned;
        player.reputation = (player.reputation || 0) + scenario.repGain;
        if (typeof gainExperience === 'function') {
            gainExperience(scenario.xp);
        } else {
            player.experience = (player.experience || 0) + scenario.xp;
        }

        modal.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#9b59b6;margin:0 0 5px 0;">${eventData.icon} ${eventData.title}</h3>
                <small style="color:#888;">District: ${district.charAt(0).toUpperCase() + district.slice(1)}</small>
            </div>
            <div style="margin:20px 0;padding:15px;background:rgba(46,204,113,0.15);border:1px solid #2ecc71;border-radius:8px;">
                <p style="color:#2ecc71;font-weight:bold;margin:0 0 8px 0;">✅ Success!</p>
                <p style="margin:0;color:#ccc;">${scenario.text}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0;">
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#2ecc71;font-size:1.2em;font-weight:bold;">+$${moneyEarned.toLocaleString()}</div>
                    <div style="color:#888;font-size:0.8em;">Cash</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#9b59b6;font-size:1.2em;font-weight:bold;">+${scenario.xp} XP</div>
                    <div style="color:#888;font-size:0.8em;">Experience</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#f1c40f;font-size:1.2em;font-weight:bold;">+${scenario.repGain}</div>
                    <div style="color:#888;font-size:0.8em;">Reputation</div>
                </div>
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('event-participation-modal').remove();" style="background:#9b59b6;color:white;padding:10px 30px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">Collect Rewards</button>
            </div>
        `;

        logAction(`${eventData.icon} ${eventData.title} in ${district}: earned $${moneyEarned.toLocaleString()}, +${scenario.xp} XP, +${scenario.repGain} rep`);
        addWorldEvent(`${eventData.icon} ${player.name || 'A player'} profited from the ${eventData.title.toLowerCase()} in ${district}!`);
    } else {
        // Failure — still get partial rewards but take a hit
        const partialMoney = Math.floor(scenario.moneyMin * 0.3);
        player.money += partialMoney;
        player.health = Math.max(1, (player.health || 100) - scenario.healthLoss);
        player.wantedLevel = Math.min(10, (player.wantedLevel || 0) + scenario.wantedGain);

        modal.innerHTML = `
            <div style="text-align:center;">
                <h3 style="color:#9b59b6;margin:0 0 5px 0;">${eventData.icon} ${eventData.title}</h3>
                <small style="color:#888;">District: ${district.charAt(0).toUpperCase() + district.slice(1)}</small>
            </div>
            <div style="margin:20px 0;padding:15px;background:rgba(231,76,60,0.15);border:1px solid #e74c3c;border-radius:8px;">
                <p style="color:#e74c3c;font-weight:bold;margin:0 0 8px 0;">❌ Things went south...</p>
                <p style="margin:0 0 8px 0;color:#ccc;">${scenario.text.split('.')[0]}... but ${scenario.riskText.toLowerCase()}</p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr ${scenario.wantedGain > 0 ? '1fr' : ''};gap:10px;margin:15px 0;">
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#e67e22;font-size:1.2em;font-weight:bold;">+$${partialMoney.toLocaleString()}</div>
                    <div style="color:#888;font-size:0.8em;">Salvaged</div>
                </div>
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#e74c3c;font-size:1.2em;font-weight:bold;">-${scenario.healthLoss} HP</div>
                    <div style="color:#888;font-size:0.8em;">Health</div>
                </div>
                ${scenario.wantedGain > 0 ? `
                <div style="text-align:center;padding:10px;background:rgba(255,255,255,0.05);border-radius:6px;">
                    <div style="color:#e74c3c;font-size:1.2em;font-weight:bold;">+${scenario.wantedGain} ⭐</div>
                    <div style="color:#888;font-size:0.8em;">Wanted</div>
                </div>` : ''}
            </div>
            <div style="text-align:center;margin-top:15px;">
                <button onclick="document.getElementById('event-participation-modal').remove();" style="background:#e74c3c;color:white;padding:10px 30px;border:none;border-radius:6px;cursor:pointer;font-family:Georgia,serif;font-size:1em;">Dust Yourself Off</button>
            </div>
        `;

        logAction(`${eventData.icon} ${eventData.title} in ${district}: went wrong! ${scenario.riskText} -${scenario.healthLoss} HP`);
    }

    // Update UI
    if (typeof updateUI === 'function') updateUI();
    if (typeof checkLevelUp === 'function') checkLevelUp();
}

// ==================== PHASE C: ALLIANCE PANEL ====================

let _currentAllianceData = null;

function showAlliancePanel() {
    if (!ensureConnected()) return;

    // Request alliance info from server
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify({ type: 'alliance_info' }));
    }

    const content = document.getElementById('multiplayer-content');
    content.innerHTML = `
        <h2 style="color: #c0a062; font-family: Georgia, serif;">🤝 Alliances</h2>
        <p style="color: #ccc;">Form powerful alliances with other players. Share territory bonuses, deposit to a shared treasury, or betray your allies for personal gain.</p>
        <div id="alliance-panel-content" style="color: #888; text-align: center; padding: 30px;">Loading alliance data...</div>
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: Georgia, serif;">← Back to Commission</button>
        </div>
    `;
    hideAllScreens();
    document.getElementById('multiplayer-screen').style.display = 'block';
}

function handleAllianceInfoResult(message) {
    _currentAllianceData = message;
    const container = document.getElementById('alliance-panel-content');
    if (!container) return;

    const myAlliance = message.myAlliance;
    const allAlliances = message.allAlliances || [];

    let html = '';

    if (myAlliance) {
        // Show my alliance details
        const isLeader = myAlliance.leaderName === (player.name || '');
        html += `
            <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #c0a062; margin-bottom: 20px;">
                <h3 style="color: #c0a062; margin: 0 0 5px 0;">[${escapeHTML(myAlliance.tag)}] ${escapeHTML(myAlliance.name)}</h3>
                <p style="color: #888; font-style: italic; margin: 5px 0;">"${escapeHTML(myAlliance.motto)}"</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0;">
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                        <div style="color: #c0a062; font-size: 1.3em; font-weight: bold;">${myAlliance.memberCount}/${myAlliance.maxMembers}</div>
                        <div style="color: #888; font-size: 0.8em;">Members</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                        <div style="color: #2ecc71; font-size: 1.3em; font-weight: bold;">$${(myAlliance.treasury || 0).toLocaleString()}</div>
                        <div style="color: #888; font-size: 0.8em;">Treasury</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                        <div style="color: #f39c12; font-size: 1.3em; font-weight: bold;">👑 ${escapeHTML(myAlliance.leaderName)}</div>
                        <div style="color: #888; font-size: 0.8em;">Leader</div>
                    </div>
                </div>
                <h4 style="color: #ccc; margin: 10px 0 5px;">Members:</h4>
                ${myAlliance.members.map(m => `<div style="padding:5px;color:${m === myAlliance.leaderName ? '#ffd700' : '#ccc'};">${m === myAlliance.leaderName ? '👑' : '🤵'} ${escapeHTML(m)}</div>`).join('')}
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button onclick="allianceDeposit()" style="background: #2ecc71; color: #000; padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">💰 Deposit</button>
                    ${isLeader ? `<button onclick="allianceInvitePrompt()" style="background: #3498db; color: #fff; padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer;">➕ Invite</button>` : ''}
                    ${isLeader ? `<button onclick="allianceKickPrompt()" style="background: #e74c3c; color: #fff; padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer;">🚫 Kick</button>` : ''}
                    <button onclick="allianceLeave()" style="background: #666; color: #fff; padding: 8px 15px; border: none; border-radius: 6px; cursor: pointer;">🚪 Leave</button>
                    <button onclick="allianceBetray()" style="background: linear-gradient(180deg,#8b0000,#4a0000); color: #ff4444; padding: 8px 15px; border: 1px solid #ff0000; border-radius: 6px; cursor: pointer; font-weight: bold;">🗡️ Betray</button>
                </div>
            </div>
        `;
    } else {
        // Show create alliance form
        html += `
            <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #c0a062; margin-bottom: 20px;">
                <h3 style="color: #c0a062; margin: 0 0 10px 0;">Found an Alliance</h3>
                <p style="color: #888;">Cost: $10,000 | Max 4 members</p>
                <div style="display: grid; gap: 10px; margin: 15px 0;">
                    <input id="alliance-name-input" type="text" placeholder="Alliance Name (3-24 chars)" maxlength="24" style="padding: 10px; background: #222; color: #c0a062; border: 1px solid #c0a062; border-radius: 6px;">
                    <input id="alliance-tag-input" type="text" placeholder="Tag (2-4 chars, e.g. MAFIA)" maxlength="4" style="padding: 10px; background: #222; color: #c0a062; border: 1px solid #c0a062; border-radius: 6px; text-transform: uppercase;">
                    <input id="alliance-motto-input" type="text" placeholder="Motto (optional)" maxlength="80" style="padding: 10px; background: #222; color: #c0a062; border: 1px solid #c0a062; border-radius: 6px;">
                </div>
                <button onclick="createAlliance()" style="background: #c0a062; color: #000; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: Georgia, serif; width: 100%;">🤝 Found Alliance ($10,000)</button>
            </div>
        `;
    }

    // Show all alliances
    if (allAlliances.length > 0) {
        html += `<div style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 10px; border: 1px solid #555;">
            <h3 style="color: #ccc; margin: 0 0 10px 0;">All Active Alliances</h3>
            ${allAlliances.map(a => `
                <div style="padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid #c0a062;">
                    <strong style="color: #c0a062;">[${escapeHTML(a.tag)}] ${escapeHTML(a.name)}</strong>
                    <span style="color: #888; margin-left: 10px;">${a.memberCount}/${a.maxMembers} members | Leader: ${escapeHTML(a.leaderName)} | Treasury: $${(a.treasury || 0).toLocaleString()}</span>
                </div>
            `).join('')}
        </div>`;
    }

    container.innerHTML = html;
}

function createAlliance() {
    const name = document.getElementById('alliance-name-input')?.value?.trim();
    const tag = document.getElementById('alliance-tag-input')?.value?.trim();
    const motto = document.getElementById('alliance-motto-input')?.value?.trim();
    if (!name || !tag) { showSystemMessage('Enter a name and tag.', '#e74c3c'); return; }
    sendMP({ type: 'alliance_create', name, tag, motto });
}

function allianceInvitePrompt() {
    const target = prompt('Enter player name to invite:');
    if (target) sendMP({ type: 'alliance_invite', targetPlayer: target.trim() });
}

function allianceKickPrompt() {
    const target = prompt('Enter member name to kick:');
    if (target) sendMP({ type: 'alliance_kick', targetPlayer: target.trim() });
}

function allianceDeposit() {
    const amount = prompt('Amount to deposit into alliance treasury ($100 min):');
    if (amount) sendMP({ type: 'alliance_deposit', amount: parseInt(amount) });
}

function allianceLeave() {
    if (confirm('Leave your alliance? This cannot be undone.')) {
        sendMP({ type: 'alliance_leave' });
    }
}

function allianceBetray() {
    if (confirm('⚠️ BETRAY your alliance?!\n\nYou will steal 25% of the treasury but lose 50 reputation.\nThis is irreversible and everyone will know.')) {
        sendMP({ type: 'alliance_betray' });
    }
}

function handleAllianceResult(message) {
    if (!message.success) {
        showSystemMessage(message.error || 'Alliance action failed.', '#e74c3c');
        return;
    }

    switch (message.action) {
        case 'created':
            showMPToast(`🤝 Alliance [${message.alliance.tag}] ${message.alliance.name} founded!`, '#c0a062', 5000);
            playNotificationSound('victory');
            if (typeof updateUI === 'function') updateUI();
            showAlliancePanel(); // Refresh
            break;
        case 'invited':
            showMPToast(`✉️ Invite sent to ${message.targetPlayer}.`, '#3498db');
            break;
        case 'member_joined':
            showMPToast(`🤝 ${message.newMember} joined the alliance!`, '#2ecc71');
            playNotificationSound('alert');
            showAlliancePanel();
            break;
        case 'left':
            showMPToast(`🚪 You left ${message.allianceName}.`, '#888');
            showAlliancePanel();
            break;
        case 'kicked':
            showMPToast(`🚫 You were kicked from ${message.allianceName}!`, '#e74c3c');
            playNotificationSound('defeat');
            showAlliancePanel();
            break;
        case 'member_left':
            showMPToast(`🚪 ${message.leftMember} left the alliance.`, '#888');
            break;
        case 'member_kicked':
            showMPToast(`🚫 ${message.kickedMember} was kicked.`, '#e74c3c');
            break;
        case 'betrayed':
            showMPToast(`🗡️ ${message.traitor} BETRAYED the alliance! Stole $${(message.stolenAmount || 0).toLocaleString()}!`, '#8b0000', 7000);
            playNotificationSound('combat');
            showAlliancePanel();
            break;
        case 'betrayal_success':
            showMPToast(`🗡️ Betrayal successful! Stole $${(message.stolen || 0).toLocaleString()}!`, '#ff6600', 5000);
            playNotificationSound('cash');
            player.money = message.newMoney || player.money;
            if (typeof updateUI === 'function') updateUI();
            showAlliancePanel();
            break;
        case 'deposit':
            showMPToast(`💰 ${message.depositor} deposited $${(message.amount || 0).toLocaleString()} to treasury.`, '#2ecc71');
            if (message.alliance) _currentAllianceData = { myAlliance: message.alliance, allAlliances: _currentAllianceData?.allAlliances || [] };
            break;
    }
}

function handleAllianceInviteReceived(message) {
    playNotificationSound('alert');
    showMPToast(`✉️ ${message.inviterName} invited you to [${message.allianceTag}] ${message.allianceName}!`, '#c0a062', 10000);
    // Show accept/decline popup
    const modal = document.createElement('div');
    modal.id = 'alliance-invite-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:#1a1a1a;padding:30px;border-radius:12px;border:2px solid #c0a062;max-width:400px;text-align:center;">
            <h3 style="color:#c0a062;margin:0 0 10px;">🤝 Alliance Invite</h3>
            <p style="color:#ccc;">${escapeHTML(message.inviterName)} invited you to join:</p>
            <h2 style="color:#ffd700;margin:10px 0;">[${escapeHTML(message.allianceTag)}] ${escapeHTML(message.allianceName)}</h2>
            <div style="display:flex;gap:15px;justify-content:center;margin-top:20px;">
                <button onclick="sendMP({type:'alliance_join',allianceId:'${message.allianceId}'});document.getElementById('alliance-invite-modal').remove();" style="background:#2ecc71;color:#000;padding:12px 25px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">✅ Accept</button>
                <button onclick="document.getElementById('alliance-invite-modal').remove();" style="background:#e74c3c;color:#fff;padding:12px 25px;border:none;border-radius:8px;cursor:pointer;">❌ Decline</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== PHASE C: BOUNTY BOARD ====================

function showBountyBoard() {
    if (!ensureConnected()) return;

    // Request bounty list from server
    sendMP({ type: 'bounty_list' });

    const content = document.getElementById('multiplayer-content');
    content.innerHTML = `
        <h2 style="color: #ff6600; font-family: Georgia, serif;">💀 Bounty Board</h2>
        <p style="color: #ccc;">Place bounties on rival players. Kill the target in PvP combat to auto-collect the reward.</p>

        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #ff6600; margin-bottom: 20px;">
            <h3 style="color: #ff6600; margin: 0 0 10px;">Post a Bounty</h3>
            <div style="display: grid; gap: 10px;">
                <input id="bounty-target-input" type="text" placeholder="Target player name" style="padding: 10px; background: #222; color: #ff6600; border: 1px solid #ff6600; border-radius: 6px;">
                <input id="bounty-reward-input" type="number" placeholder="Reward ($5,000 - $500,000)" min="5000" max="500000" style="padding: 10px; background: #222; color: #ff6600; border: 1px solid #ff6600; border-radius: 6px;">
                <input id="bounty-reason-input" type="text" placeholder="Reason (optional)" maxlength="60" style="padding: 10px; background: #222; color: #ff6600; border: 1px solid #ff6600; border-radius: 6px;">
            </div>
            <button onclick="postBounty()" style="background: #ff6600; color: #000; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: Georgia, serif; width: 100%; margin-top: 10px;">💀 Post Bounty (money deducted upfront)</button>
        </div>

        <div id="bounty-list-content" style="color: #888; text-align: center; padding: 20px;">Loading bounties...</div>

        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: Georgia, serif;">← Back to Commission</button>
        </div>
    `;
    hideAllScreens();
    document.getElementById('multiplayer-screen').style.display = 'block';
}

function postBounty() {
    const target = document.getElementById('bounty-target-input')?.value?.trim();
    const reward = parseInt(document.getElementById('bounty-reward-input')?.value);
    const reason = document.getElementById('bounty-reason-input')?.value?.trim();
    if (!target) { showSystemMessage('Enter a target name.', '#e74c3c'); return; }
    if (!reward || reward < 5000) { showSystemMessage('Minimum bounty is $5,000.', '#e74c3c'); return; }
    sendMP({ type: 'post_bounty', targetPlayer: target, reward, reason });
}

function handleBountyResult(message) {
    if (!message.success) {
        showSystemMessage(message.error || 'Bounty action failed.', '#e74c3c');
        return;
    }
    if (message.action === 'posted') {
        showMPToast(`💀 Bounty posted on ${message.bounty.targetName}!`, '#ff6600', 4000);
        playNotificationSound('combat');
        player.money = message.newMoney || player.money;
        if (typeof updateUI === 'function') updateUI();
        sendMP({ type: 'bounty_list' }); // Refresh list
    } else if (message.action === 'cancelled') {
        showMPToast(`Bounty cancelled. Refund: $${(message.refund || 0).toLocaleString()} (50% cancellation fee)`, '#888', 4000);
        player.money = message.newMoney || player.money;
        if (typeof updateUI === 'function') updateUI();
        sendMP({ type: 'bounty_list' });
    }
}

function handleBountyAlert(message) {
    playNotificationSound('alert');
    showMPToast(`💀 ${message.message}`, '#ff0000', 8000);
}

function handleBountyListResult(message) {
    const container = document.getElementById('bounty-list-content');
    if (!container) return;

    const bounties = message.bounties || [];
    if (bounties.length === 0) {
        container.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">No active bounties. The streets are calm... for now.</div>';
        return;
    }

    container.innerHTML = `
        <h3 style="color: #ff6600; margin: 0 0 10px;">Active Bounties (${bounties.length})</h3>
        ${bounties.map(b => {
            const timeLeft = Math.max(0, Math.floor(b.timeLeft / 60000));
            const isMyBounty = b.posterName === (player.name || '');
            const isOnMe = b.targetName === (player.name || '');
            return `
                <div style="padding: 12px; margin: 8px 0; background: rgba(${isOnMe ? '139,0,0' : '255,102,0'},0.15); border-radius: 8px; border-left: 4px solid ${isOnMe ? '#ff0000' : '#ff6600'};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #ff6600; font-size: 1.1em;">💀 ${escapeHTML(b.targetName)}</strong>
                            ${isOnMe ? '<span style="color:#ff0000;font-weight:bold;margin-left:8px;">⚠️ THAT\'S YOU!</span>' : ''}
                            <div style="color: #888; font-size: 0.85em;">${escapeHTML(b.reason || 'Wanted dead or alive.')}</div>
                            <div style="color: #666; font-size: 0.8em;">Posted by: ${escapeHTML(b.posterName)} | Expires in ${timeLeft} min</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #2ecc71; font-size: 1.3em; font-weight: bold;">$${b.reward.toLocaleString()}</div>
                            ${isMyBounty ? `<button onclick="sendMP({type:'cancel_bounty',bountyId:'${b.id}'})" style="background:#e74c3c;color:#fff;padding:4px 10px;border:none;border-radius:4px;cursor:pointer;font-size:0.8em;margin-top:5px;">Cancel</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// ==================== PHASE C: RANKED SEASON ====================

function showRankedSeason() {
    if (!ensureConnected()) return;

    sendMP({ type: 'season_info' });

    const content = document.getElementById('multiplayer-content');
    content.innerHTML = `
        <h2 style="color: #ffd700; font-family: Georgia, serif;">🏆 Ranked Season</h2>
        <p style="color: #ccc;">Compete in ranked PvP combat. Your ELO rating determines your tier. Seasons last 30 days with soft resets.</p>
        <div id="season-info-content" style="color: #888; text-align: center; padding: 30px;">Loading season data...</div>
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: Georgia, serif;">← Back to Commission</button>
        </div>
    `;
    hideAllScreens();
    document.getElementById('multiplayer-screen').style.display = 'block';
}

function handleSeasonInfoResult(message) {
    const container = document.getElementById('season-info-content');
    if (!container) return;

    const season = message.season;
    const myRating = message.myRating;
    const topPlayers = message.topPlayers || [];
    const daysLeft = Math.max(0, Math.ceil(season.timeLeft / (24 * 60 * 60 * 1000)));

    const tiers = [
        { name: 'Bronze', min: 0, color: '#cd7f32', icon: '🥉' },
        { name: 'Silver', min: 1000, color: '#c0c0c0', icon: '🥈' },
        { name: 'Gold', min: 1500, color: '#ffd700', icon: '🥇' },
        { name: 'Diamond', min: 2000, color: '#b9f2ff', icon: '💎' },
        { name: 'Kingpin', min: 2500, color: '#ff4500', icon: '👑' }
    ];

    const currentTier = tiers.find(t => t.name === myRating.tier) || tiers[0];
    const nextTier = tiers[tiers.indexOf(currentTier) + 1];
    const eloToNext = nextTier ? nextTier.min - myRating.elo : 0;

    container.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #ffd700; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #ffd700; margin: 0;">Season ${season.number}</h3>
                <span style="color: #888;">${daysLeft} days remaining</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0;">
                <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 2px solid ${currentTier.color};">
                    <div style="font-size: 2em;">${currentTier.icon}</div>
                    <div style="color: ${currentTier.color}; font-size: 1.4em; font-weight: bold;">${myRating.elo}</div>
                    <div style="color: ${currentTier.color}; font-weight: bold;">${currentTier.name}</div>
                    ${nextTier ? `<div style="color: #888; font-size: 0.8em; margin-top: 5px;">${eloToNext} to ${nextTier.icon} ${nextTier.name}</div>` : '<div style="color: #ffd700; font-size: 0.8em; margin-top: 5px;">MAX TIER</div>'}
                </div>
                <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="color: #2ecc71; font-size: 1.8em; font-weight: bold;">${myRating.wins}</div>
                    <div style="color: #888;">Wins</div>
                </div>
                <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="color: #e74c3c; font-size: 1.8em; font-weight: bold;">${myRating.losses}</div>
                    <div style="color: #888;">Losses</div>
                </div>
            </div>
        </div>

        <div style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 10px; border: 1px solid #ffd700; margin-bottom: 15px;">
            <h3 style="color: #ffd700; margin: 0 0 10px;">Tier Progression</h3>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                ${tiers.map(t => `
                    <div style="text-align: center; padding: 8px 12px; background: ${t.name === myRating.tier ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)'}; border-radius: 6px; border: 1px solid ${t.name === myRating.tier ? t.color : '#333'};">
                        <div style="font-size: 1.3em;">${t.icon}</div>
                        <div style="color: ${t.color}; font-size: 0.85em; font-weight: bold;">${t.name}</div>
                        <div style="color: #666; font-size: 0.7em;">${t.min}+</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 10px; border: 1px solid #555;">
            <h3 style="color: #ccc; margin: 0 0 10px;">Season Leaderboard</h3>
            ${topPlayers.length === 0 ? '<div style="color:#888;text-align:center;">No ranked matches yet this season.</div>' :
              topPlayers.map((p, i) => `
                <div style="display:flex;justify-content:space-between;padding:8px;margin:4px 0;background:rgba(255,255,255,0.03);border-radius:5px;${p.name === (player.name || '') ? 'border:2px solid #ffd700;' : ''}">
                    <div><span style="color:${i < 3 ? '#ffd700' : '#ccc'};">#${i+1}</span> <strong style="color:#ecf0f1;margin-left:8px;">${escapeHTML(p.name)}</strong></div>
                    <div style="color:#888;">${p.icon} ${p.elo} ELO | ${p.wins}W/${p.losses}L</div>
                </div>
              `).join('')}
        </div>
    `;
}

// ==================== PHASE C: TERRITORY SIEGE PANEL ====================

function showSiegePanel() {
    if (!ensureConnected()) return;

    const territories = onlineWorldState.territories || {};
    const playerName = player.name || '';

    // Categorize territories
    const ownedByMe = Object.entries(territories).filter(([, t]) => t.owner === playerName);
    const attackable = Object.entries(territories).filter(([, t]) => t.owner && t.owner !== playerName);

    const content = document.getElementById('multiplayer-content');
    content.innerHTML = `
        <h2 style="color: #e67e22; font-family: Georgia, serif;">🏰 Territory Siege & Fortification</h2>
        <p style="color: #ccc;">Fortify your territories with defensive upgrades, or launch devastating siege attacks against rival Dons.</p>

        ${ownedByMe.length > 0 ? `
        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #27ae60; margin-bottom: 20px;">
            <h3 style="color: #27ae60; margin: 0 0 10px;">🏗️ Fortify Your Territories</h3>
            <p style="color: #888; font-size: 0.9em;">$500 per fortification point (max 200). Higher fortification = harder to siege.</p>
            ${ownedByMe.map(([id, t]) => `
                <div style="padding: 12px; margin: 8px 0; background: rgba(39,174,96,0.1); border-radius: 8px; border-left: 4px solid #27ae60;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #27ae60;">${id.replace(/_/g, ' ')}</strong>
                            <div style="color: #888; font-size: 0.85em;">Defense: ${t.defenseRating || 100} | Fort: ${t.fortification || 0}/200</div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="fortifyTerritory('${id}', 10)" style="background:#27ae60;color:#000;padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">+10 ($5K)</button>
                            <button onclick="fortifyTerritory('${id}', 25)" style="background:#2ecc71;color:#000;padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">+25 ($12.5K)</button>
                            <button onclick="fortifyTerritory('${id}', 50)" style="background:#1abc9c;color:#000;padding:6px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">+50 ($25K)</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>` : '<div style="background:rgba(0,0,0,0.6);padding:15px;border-radius:10px;color:#888;text-align:center;margin-bottom:20px;">You don\'t own any territories to fortify. Claim or conquer one first.</div>'}

        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 12px; border: 2px solid #e67e22; margin-bottom: 20px;">
            <h3 style="color: #e67e22; margin: 0 0 10px;">⚔️ Launch a Siege</h3>
            <p style="color: #888; font-size: 0.9em;">Cost: $5,000 + 60 energy | Requires 8+ gang members | Multi-phase battle | 1hr cooldown</p>
            ${attackable.length === 0 ? '<div style="color:#888;text-align:center;padding:15px;">No territories to siege. All are unclaimed or yours.</div>' :
              attackable.map(([id, t]) => `
                <div style="padding: 12px; margin: 8px 0; background: rgba(231,76,60,0.1); border-radius: 8px; border-left: 4px solid #e67e22;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #e67e22;">${id.replace(/_/g, ' ')}</strong>
                            <div style="color: #888; font-size: 0.85em;">Owner: ${escapeHTML(t.owner)} | Defense: ${t.defenseRating || 100} | Fort: ${t.fortification || 0}</div>
                        </div>
                        <button onclick="declareSiege('${id}')" style="background:linear-gradient(180deg,#e67e22,#a0520a);color:#fff;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🏰 Siege!</button>
                    </div>
                </div>
              `).join('')}
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <button onclick="showOnlineWorld()" style="background: #333; color: #c0a062; padding: 12px 25px; border: 1px solid #c0a062; border-radius: 8px; cursor: pointer; font-family: Georgia, serif;">← Back to Commission</button>
        </div>
    `;
    hideAllScreens();
    document.getElementById('multiplayer-screen').style.display = 'block';
}

function fortifyTerritory(districtId, points) {
    sendMP({ type: 'siege_fortify', district: districtId, points: points });
}

function declareSiege(districtId) {
    if (!confirm(`Launch a siege on ${districtId.replace(/_/g, ' ')}?\n\nCost: $5,000 + 60 energy\nRequires: 8+ gang members\n\nThis is a multi-phase assault. Casualties are expected.`)) return;

    const gangMembers = (player.gangMembers || []).length;
    const power = typeof calculatePower === 'function' ? calculatePower() : 0;

    sendMP({
        type: 'siege_declare',
        district: districtId,
        gangMembers: gangMembers,
        power: power
    });
}

function handleSiegeResult(message) {
    if (!message.success) {
        showSystemMessage(message.error || 'Siege failed.', '#e74c3c');
        return;
    }

    // Sync money/energy
    if (message.money !== undefined) player.money = message.money;
    if (message.energy !== undefined) player.energy = message.energy;

    if (message.victory) {
        playNotificationSound('victory');
        showMPToast(`🏰 SIEGE VICTORY! Conquered ${(message.district || '').replace(/_/g, ' ')}! +${message.repGain || 0} rep`, '#27ae60', 6000);
        logAction(`🏰 Your siege on ${(message.district || '').replace(/_/g, ' ')} was successful! Conquered from ${message.oldOwner}. Lost ${message.membersLost || 0} gang members.`);
    } else {
        playNotificationSound('defeat');
        const phase = message.phase === 'breach_failed' ? 'Walls held firm!' : 'Assault repelled!';
        showMPToast(`🏰 Siege failed — ${phase}${message.jailed ? ' ARRESTED!' : ''}`, '#e74c3c', 6000);
        logAction(`🏰 Siege on ${(message.district || '').replace(/_/g, ' ')} failed. ${phase} Lost ${message.membersLost || 0} gang members, -${message.repLoss || 0} rep.`);

        if (message.jailed) {
            player.inJail = true;
            player.jailTime = message.jailTime || 20;
            if (window.EventBus) EventBus.emit('jailStatusChanged', { inJail: true, jailTime: player.jailTime });
        }
    }

    // Update territories
    if (message.territories) onlineWorldState.territories = message.territories;
    if (typeof updateUI === 'function') updateUI();
}

function handleFortifyResult(message) {
    if (!message.success) {
        showSystemMessage(message.error || 'Fortification failed.', '#e74c3c');
        return;
    }
    player.money = message.money || player.money;
    showMPToast(`🏗️ ${(message.district || '').replace(/_/g, ' ')} fortified to ${message.fortification}/200!`, '#27ae60', 3000);
    playNotificationSound('cash');
    if (typeof updateUI === 'function') updateUI();
    // Update local territory data
    if (onlineWorldState.territories[message.district]) {
        onlineWorldState.territories[message.district].fortification = message.fortification;
    }
}

// ==================== UTILITY HELPERS ====================

function sendMP(msg) {
    if (onlineWorldState.socket && onlineWorldState.socket.readyState === WebSocket.OPEN) {
        onlineWorldState.socket.send(JSON.stringify(msg));
    } else {
        showSystemMessage('Not connected to server.', '#e74c3c');
    }
}

function ensureConnected() {
    if (!onlineWorldState.isConnected) {
        showSystemMessage('Connect to the online world first.', '#e74c3c');
        return false;
    }
    return true;
}

// ==================== SERVER STATUS TOOLTIP ====================
// Periodically ping the server and update the sign-in button tooltip
(function initServerStatusTooltip() {
    function updateSignInTooltip(text) {
        const introBtn = document.getElementById('intro-login-btn');
        if (introBtn) introBtn.title = text;
    }

    function checkServerStatus() {
        // If we already have an active WebSocket connection, the server is up
        if (onlineWorldState.isConnected) {
            updateSignInTooltip('Server is online \u2705');
            return;
        }
        // Quick HTTP ping to the server health endpoint (Render responds to GET /)
        const serverOrigin = onlineWorld.serverUrl.replace(/^ws/, 'http');
        fetch(serverOrigin, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
            .then(() => {
                updateSignInTooltip('Server is online \u2705');
            })
            .catch(() => {
                updateSignInTooltip('Server appears offline \u274c');
            });
    }

    // Run once DOM is ready and then every 30 seconds
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { checkServerStatus(); });
    } else {
        checkServerStatus();
    }
    setInterval(checkServerStatus, 30000);
})();
