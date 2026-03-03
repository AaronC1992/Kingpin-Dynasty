// ==================== MAFIA BORN - MULTIPLAYER SERVER ====================
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
// JSON file persistence utilities
const { loadWorldState, saveWorldState, flushWorldState } = require('./worldPersistence');
// User accounts & authentication
const userDB = require('./userDB');

// ── Admin accounts (lowercase usernames) ───────────────────────
const ADMIN_USERNAMES = new Set(['admin']);
function isAdmin(username) {
    return username && ADMIN_USERNAMES.has(username.toLowerCase());
}

// ── Rate limiter for auth endpoints ────────────────────────────
const authRateLimits = new Map(); // IP -> { count, resetTime }
const AUTH_RATE_LIMIT = 5;        // max attempts per window
const AUTH_RATE_WINDOW = 60000;   // 1 minute window (ms)

function checkAuthRateLimit(ip) {
    const now = Date.now();
    const entry = authRateLimits.get(ip);
    if (!entry || now > entry.resetTime) {
        authRateLimits.set(ip, { count: 1, resetTime: now + AUTH_RATE_WINDOW });
        return true; // allowed
    }
    entry.count++;
    if (entry.count > AUTH_RATE_LIMIT) {
        return false; // blocked
    }
    return true;
}

// Periodically clean up expired rate limit entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of authRateLimits) {
        if (now > entry.resetTime) authRateLimits.delete(ip);
    }
}, 5 * 60 * 1000);

// ── Allowed fields for admin modifications ─────────────────────
const ADMIN_ALLOWED_FIELDS = new Set([
    'money', 'level', 'experience', 'health', 'energy', 'maxEnergy',
    'power', 'reputation', 'wantedLevel', 'ammo', 'gas', 'skillPoints',
    'territory', 'dirtyMoney'
]);

// Server configuration
const PORT = process.env.PORT || 3000;
// Allowed origins for CORS (game website)
const ALLOWED_ORIGINS = [
    'https://mafiaborn.com',
    'http://mafiaborn.com',
    'https://www.mafiaborn.com',
    'http://www.mafiaborn.com',
    'https://aaronc1992.github.io',
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
            const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            const status = {
                status: 'ok',
                version: pkg.version,
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
            // ── GET /api/version ────────────────────────────
            if (urlPath === '/api/version' && req.method === 'GET') {
                const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
                return json(200, { version: pkg.version });
            }

            // ── POST /api/register ─────────────────────────
            if (urlPath === '/api/register' && req.method === 'POST') {
                const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
                if (!checkAuthRateLimit(clientIP)) return json(429, { error: 'Too many attempts. Please wait a minute.' });
                const { username, password } = await readBody();
                if (!username || !password) return json(400, { error: 'Username and password required' });
                const result = userDB.createUser(username.trim(), password);
                if (!result.ok) return json(400, { error: result.error });
                const token = userDB.createSession(username.trim().toLowerCase());
                return json(201, { ok: true, token, username: username.trim() });
            }

            // ── POST /api/login ────────────────────────────
            if (urlPath === '/api/login' && req.method === 'POST') {
                const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
                if (!checkAuthRateLimit(clientIP)) return json(429, { error: 'Too many attempts. Please wait a minute.' });
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
                info.isAdmin = isAdmin(username);
                return json(200, info);
            }

            // ── GET /api/admin/check ───────────────────────
            if (urlPath === '/api/admin/check' && req.method === 'GET') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                return json(200, { isAdmin: isAdmin(username) });
            }

            // ── POST /api/admin/modify ─────────────────────
            if (urlPath === '/api/admin/modify' && req.method === 'POST') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                if (!isAdmin(username)) return json(403, { error: 'Forbidden' });
                const body = await readBody();
                // Validate: only allow known safe fields with numeric values
                const sanitized = {};
                for (const [key, value] of Object.entries(body)) {
                    if (!ADMIN_ALLOWED_FIELDS.has(key)) continue;
                    if (typeof value !== 'number' || !isFinite(value)) continue;
                    sanitized[key] = value;
                }
                if (Object.keys(sanitized).length === 0) {
                    return json(400, { error: 'No valid modifications provided. Allowed fields: ' + [...ADMIN_ALLOWED_FIELDS].join(', ') });
                }
                return json(200, { ok: true, modifications: sanitized });
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
                    gameVersion: body.gameVersion || '1.12.0',
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

            // ── DELETE /api/save ────────────────────────────
            if (urlPath === '/api/save' && req.method === 'DELETE') {
                const username = userDB.validateToken(getToken());
                if (!username) return json(401, { error: 'Not authenticated' });
                userDB.clearUserSave(username);
                return json(200, { ok: true });
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
    // Strip query strings so ?v=1.6.2 cache-busters don't break file lookup
    reqPath = reqPath.split('?')[0];

    // Redirect /favicon.ico to GameLogo.png (browsers request this automatically)
    if (reqPath === '/favicon.ico') reqPath = '/GameLogo.png';
    
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
        console.log(` Attempted path traversal: ${req.url} -> ${filePath}`);
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
                console.log(` File not found: ${filePath}`);
                const safeUrl = req.url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1> Mafia Born - Multiplayer Server</h1>
                    <p>File not found: ${safeUrl}</p>
                    <p><a href="/"> Go to Game</a></p>
                    <hr>
                    <p>Server Status: Online | Players Connected: ${clients.size}</p>
                `, 'utf-8');
            } else {
                console.log(` Server error for ${filePath}:`, error);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Add CORS and cache-control headers
            // no-cache forces browsers to revalidate with the server every time,
            // so players always get the latest version after an update
            const headers = { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            res.writeHead(200, headers);
            // Don't specify encoding for binary files (images, etc.)
            if (contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('json')) {
                res.end(content, 'utf-8');
            } else {
                res.end(content);
            }
            console.log(` Served: ${filePath} (${contentType})`);
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
  clearInterval(jailTickInterval);
});

// Server-side jail timer: decrement jailTime every second for all jailed players
const jailTickInterval = setInterval(function jailTick() {
    let changed = false;
    gameState.playerStates.forEach((state, id) => {
        if (state.inJail && state.jailTime > 0) {
            state.jailTime--;
            if (state.jailTime <= 0) {
                state.jailTime = 0;
                state.inJail = false;
                changed = true;
                const p = gameState.players.get(id);
                const pName = p ? p.name : 'Unknown';
                console.log(` ${pName} served their sentence (server-side release)`);
                addGlobalChatMessage('System', ` ${pName} was released from jail!`, '#2ecc71');
                // Notify the specific client
                const ws = clients.get(id);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'player_released', playerId: id, playerName: pName }));
                }
            }
        }
    });
    // Also decrement bot sentences
    gameState.jailBots.forEach(bot => {
        if (bot.sentence > 0) bot.sentence--;
    });
    // Remove expired bots and refill
    const beforeLen = gameState.jailBots.length;
    gameState.jailBots = gameState.jailBots.filter(b => b.sentence > 0);
    if (gameState.jailBots.length !== beforeLen) {
        updateJailBots();
        changed = true;
    }
    if (changed) {
        broadcastPlayerStates();
        broadcastJailRoster();
    }
}, 1000);

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
    // Vehicle Marketplace — player-to-player vehicle trading
    marketplace: [], // { id, sellerId, sellerName, vehicleName, baseValue, currentValue, damagePercentage, image, usageCount, price, listedAt }
    // Phase C: Competitive Features
    alliances: new Map(), // id -> { id, name, tag, leader, members[], createdAt, treasury, motto }
    bounties: [], // { id, posterId, posterName, targetId, targetName, reward, reason, postedAt, expiresAt }
    season: { // Ranked season state
        number: 1,
        startedAt: Date.now(),
        endsAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        ratings: new Map() // playerId -> { elo, tier, wins, losses }
    },
    // Political system — Top Don controls server-wide policies
    politics: {
        topDonName: null, // player name of the Top Don
        topDonClientId: null, // clientId (null if offline)
        territoryCount: 0, // how many territories the Top Don controls
        isAlliance: false, // true if an alliance leader holds the seat
        allianceName: null, // alliance name if applicable
        allianceTag: null, // alliance tag if applicable
        policies: {
            worldTaxRate: 10, // % territory tax on resident earnings (5-25)
            marketFee: 5, // % fee on vehicle marketplace sales (0-15)
            crimeBonus: 0, // % bonus to all job/crime earnings (0-20)
            jailTimeMod: 0, // % jail time modification (-30 to +30)
            heistBonus: 0 // % bonus to heist payouts (0-25)
        },
        lastRecalc: Date.now(),
        policyChangedAt: 0 // cooldown tracking
    },
    // Weather system — server-authoritative, synced to all players every 30 minutes
    currentWeather: 'clear',
    currentSeason: 'spring',
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
const MOVE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// NPC bosses — every territory starts under rival NPC control
const NPC_TERRITORY_BOSSES = {
    residential_low: { name: "Vinnie 'The Rat' Morello", defenseRating: 80 },
    residential_middle: { name: "Fat Tony Deluca", defenseRating: 120 },
    residential_upscale: { name: "Don Castellano", defenseRating: 180 },
    commercial_downtown: { name: "Marco 'The Banker' Ricci", defenseRating: 160 },
    commercial_shopping: { name: "Luca 'Fingers' Bianchi", defenseRating: 100 },
    industrial_warehouse: { name: "Big Sal Ferrara", defenseRating: 140 },
    industrial_port: { name: "Nikolai 'The Bear' Volkov", defenseRating: 200 },
    entertainment_nightlife: { name: "Johnny 'Neon' Cavallo", defenseRating: 150 }
};
const NPC_OWNER_NAMES = new Set(Object.values(NPC_TERRITORY_BOSSES).map(b => b.name));

function buildDefaultTerritories() {
    const t = {};
    for (const id of TERRITORY_IDS) {
        const boss = NPC_TERRITORY_BOSSES[id];
        t[id] = {
            owner: boss ? boss.name : null,
            residents: [],
            defenseRating: boss ? boss.defenseRating : 100,
            taxCollected: 0
        };
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

    // Load politics (preserve policies across restarts)
    if (persisted.politics && persisted.politics.policies) {
        gameState.politics.policies = Object.assign(gameState.politics.policies, persisted.politics.policies);
        gameState.politics.policyChangedAt = persisted.politics.policyChangedAt || 0;
    }

    // Load alliances (Map)
    if (persisted.alliances && typeof persisted.alliances === 'object') {
        for (const [id, data] of Object.entries(persisted.alliances)) {
            gameState.alliances.set(id, data);
        }
    }

    // Load bounties
    if (Array.isArray(persisted.bounties)) {
        gameState.bounties = persisted.bounties;
    }

    // Load marketplace
    if (Array.isArray(persisted.marketplace)) {
        gameState.marketplace = persisted.marketplace;
    }

    // Load season ratings (Map)
    if (persisted.season) {
        if (persisted.season.number) gameState.season.number = persisted.season.number;
        if (persisted.season.startedAt) gameState.season.startedAt = persisted.season.startedAt;
        if (persisted.season.endsAt) gameState.season.endsAt = persisted.season.endsAt;
        if (persisted.season.ratings && typeof persisted.season.ratings === 'object') {
            for (const [id, data] of Object.entries(persisted.season.ratings)) {
                gameState.season.ratings.set(id, data);
            }
        }
    }

    // Migration: assign NPC bosses to any territory still unclaimed (owner: null)
    for (const id of TERRITORY_IDS) {
        const terr = gameState.territories[id];
        if (terr && !terr.owner) {
            const boss = NPC_TERRITORY_BOSSES[id];
            if (boss) {
                terr.owner = boss.name;
                terr.defenseRating = Math.max(terr.defenseRating || 0, boss.defenseRating);
                console.log(` Migrated ${id} → NPC boss ${boss.name}`);
            }
        }
    }

    console.log(' World state loaded from world-state.json');
} catch (e) {
    console.log(' Failed to load world state; using defaults');
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
                territories: gameState.territories,
                politics: gameState.politics,
                alliances: Object.fromEntries(gameState.alliances),
                bounties: gameState.bounties,
                marketplace: gameState.marketplace,
                season: {
                    number: gameState.season.number,
                    startedAt: gameState.season.startedAt,
                    endsAt: gameState.season.endsAt,
                    ratings: Object.fromEntries(gameState.season.ratings)
                }
            });
        } catch (err) {
            console.error(' Error during world save:', err.message);
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
    // Fallback if empty or profane (admins bypass the filter)
    if (!name || (isProfane(name) && !ADMIN_USERNAMES.has(name.toLowerCase()))) {
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

console.log(' Mafia Born - Multiplayer Server Starting...');

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    // SERVER-SIDE IDENTITY: assign server-generated playerId and bind to this WebSocket
    const clientId = generateClientId();
    clients.set(clientId, ws);
    sessions.set(ws, { playerId: clientId, playerName: null });
    gameState.serverStats.totalConnections++;
    
    console.log(` Player connected: ${clientId} (Total: ${clients.size})`);
    
    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleClientMessage(clientId, message, ws);
        } catch (error) {
            console.error(' Error parsing message:', error);
        }
    });
    
    // Heartbeat setup
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log(` Player disconnected: ${clientId}`);
        
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

        case 'jail_status_sync':
            handleJailStatusSync(clientId, message);
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

        case 'business_income_tax':
            handleBusinessIncomeTax(clientId, message);
            break;

        case 'war_bet':
            handleWarBet(clientId, message);
            break;

        // ==================== PHASE C: COMPETITIVE FEATURES ====================
        case 'alliance_create':
            handleAllianceCreate(clientId, message);
            break;
        case 'alliance_invite':
            handleAllianceInvite(clientId, message);
            break;
        case 'alliance_join':
            handleAllianceJoin(clientId, message);
            break;
        case 'alliance_leave':
            handleAllianceLeave(clientId, message);
            break;
        case 'alliance_kick':
            handleAllianceKick(clientId, message);
            break;
        case 'alliance_info':
            handleAllianceInfo(clientId, message);
            break;
        case 'alliance_deposit':
            handleAllianceDeposit(clientId, message);
            break;
        case 'alliance_discipline':
            handleAllianceDiscipline(clientId, message);
            break;

        // ==================== POLITICAL SYSTEM ====================
        case 'politics_info':
            handlePoliticsInfo(clientId);
            break;
        case 'politics_set_policy':
            handlePoliticsSetPolicy(clientId, message);
            break;

        case 'post_bounty':
            handlePostBounty(clientId, message);
            break;
        case 'cancel_bounty':
            handleCancelBounty(clientId, message);
            break;
        case 'bounty_list':
            handleBountyList(clientId, message);
            break;
        case 'season_info':
            handleSeasonInfo(clientId, message);
            break;
        case 'siege_declare':
            handleSiegeDeclare(clientId, message);
            break;
        case 'siege_fortify':
            handleSiegeFortify(clientId, message);
            break;

        // ==================== VEHICLE MARKETPLACE ====================
        case 'marketplace_list_vehicle':
            handleMarketplaceList(clientId, message);
            break;
        case 'marketplace_buy_vehicle':
            handleMarketplaceBuy(clientId, message);
            break;
        case 'marketplace_cancel_listing':
            handleMarketplaceCancel(clientId, message);
            break;
        case 'marketplace_get_listings':
            handleMarketplaceGetListings(clientId);
            break;

        case 'player_death':
            handlePlayerDeath(clientId, message);
            break;

        case 'admin_kill_player':
            handleAdminKillPlayer(clientId, message);
            break;

        default:
            console.log(` Unknown message type: ${message.type}`);
    }
}

// Player connection handler
function handlePlayerConnect(clientId, message, ws) {
    // Sanitize and enforce uniqueness on desired name
    const desiredName = sanitizePlayerName(message.playerName || `Player_${clientId.slice(-4)}`);

    // ── Stale-connection cleanup ──────────────────────────────────
    // On mobile, minimizing the app may open a new WebSocket before the old one
    // has fully closed.  If a player with the exact same name already exists under
    // a *different* clientId, evict that ghost entry so the reconnecting player
    // gets their real name instead of "Name#2".
    for (const [existingId, existingPlayer] of gameState.players.entries()) {
        if (existingId !== clientId && existingPlayer.name === desiredName) {
            const oldWs = clients.get(existingId);
            // Silently tear down the stale connection
            if (oldWs) {
                try { oldWs.close(); } catch (_) { /* already closed */ }
                clients.delete(existingId);
                sessions.delete(oldWs);
            }
            // Remove from territory residents
            if (existingPlayer.currentTerritory && gameState.territories[existingPlayer.currentTerritory]) {
                const residents = gameState.territories[existingPlayer.currentTerritory].residents;
                const idx = residents.indexOf(existingPlayer.name);
                if (idx !== -1) residents.splice(idx, 1);
            }
            gameState.players.delete(existingId);
            gameState.playerStates.delete(existingId);
            console.log(` Evicted stale connection for "${desiredName}" (old ID: ${existingId})`);
            break; // only one ghost expected
        }
    }

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
    
    console.log(` Player registered: ${player.name} (ID: ${clientId}) ${playerState.inJail ? '[IN JAIL]' : ''}`);
    
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
        playerStates: Object.fromEntries(gameState.playerStates),
        weather: gameState.currentWeather,
        season: gameState.currentSeason,
        politics: sanitizePolitics()
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
    
    console.log(` ${player.name}: ${sanitizedMessage}`);
    
    // Broadcast to all players
    broadcastToAll({
        type: 'global_chat',
        playerId: clientId,
        playerName: player.name,
        message: sanitizedMessage,
        timestamp: chatMessage.timestamp,
        color: '#c0a062' // Default color for other players
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
        
        console.log(` ${player.name} claimed ${district} for $${cost}`);
        
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
        addGlobalChatMessage('System', ` ${player.name} claimed ${district} district!`, '#e74c3c');
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

    console.log(` ${player.name} spawned in ${districtId}`);

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

    addGlobalChatMessage('System', ` ${player.name} set up shop in ${districtId.replace(/_/g, ' ')}!`, '#c0a062');
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

    console.log(` ${player.name} moved from ${oldId} to ${targetId} ($${moveCost})`);

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

    addGlobalChatMessage('System', ` ${player.name} relocated to ${targetId.replace(/_/g, ' ')}!`, '#9b59b6');
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
    // If owned by NPC or another player, redirect to war path
    if (terr.owner) return fail(`This district is controlled by ${terr.owner}. Challenge them for control!`);

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

    console.log(` ${player.name} claimed ownership of ${districtId} for $${cost.toLocaleString()}`);

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

    addGlobalChatMessage('System', ` ${player.name} claimed ownership of ${districtId.replace(/_/g, ' ')}!`, '#d4af37');
    recalcTopDon();
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
    } else if (NPC_OWNER_NAMES.has(terr.owner)) {
        // NPC boss — defense scales with territory difficulty
        defenseScore += Math.floor((terr.defenseRating || 100) * 1.5);
    } else {
        // Offline real player — moderate resistance
        defenseScore += 150;
    }

    // Alliance defense bonus: +15% if defender is in an alliance, +5% per online ally
    const defenderAlliance = defenderId ? findPlayerAlliance(defenderId) : null;
    if (defenderAlliance) {
        defenseScore = Math.floor(defenseScore * 1.15); // Base alliance defense bonus
        const onlineAllies = defenderAlliance.members.filter(mId => mId !== defenderId && clients.has(mId));
        defenseScore += onlineAllies.length * Math.floor(defenseScore * 0.05); // +5% per online ally
    }

    // Fortification bonus (from siege_fortify upgrades)
    defenseScore += (terr.fortification || 0);

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

        console.log(`TERRITORY WAR: ${attacker.name} conquered ${districtId}${oldOwner ? ` from ${oldOwner}` : ''} (ATK ${attackScore} > DEF ${defenseScore})`);

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

        addGlobalChatMessage('System', `${attacker.name} conquered ${districtId.replace(/_/g, ' ')}${oldOwner ? ` from ${oldOwner}` : ''} in a gang war!`, '#8b0000');
        recalcTopDon();
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

        console.log(` TERRITORY WAR FAILED: ${attacker.name} failed to take ${districtId} (ATK ${attackScore} ≤ DEF ${defenseScore})${jailed ? ' — ARRESTED' : ''}`);

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
            addGlobalChatMessage('System', ` ${attacker.name} attacked ${districtId.replace(/_/g, ' ')} and was repelled — then arrested!`, '#e74c3c');
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
    
    console.log(` ${player.name} created heist: ${heist.target}`);
    
    // Broadcast heist creation
    broadcastToAll({
        type: 'heist_broadcast',
        heist: heist,
        playerName: player.name,
        playerId: clientId
    });
    
    // Add to global chat
    addGlobalChatMessage('System', ` ${player.name} is organizing a heist: ${heist.target}!`, '#8e44ad');
}

// Heist join handler
function handleHeistJoin(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    if (heist.participants.length < heist.maxParticipants && !heist.participants.includes(clientId)) {
        heist.participants.push(clientId);
        
        console.log(` ${player.name} joined heist: ${heist.target}`);
        
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
// PvP challenge cooldowns — 30 seconds between fights
const pvpCooldowns = new Map();
const PVP_COOLDOWN_MS = 30 * 1000;

function handlePlayerChallenge(clientId, message) {
    const challenger = gameState.players.get(clientId);
    const challengerState = gameState.playerStates.get(clientId);
    if (!challenger || !challengerState) return;

    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'combat_result', error: err })); };

    // Find target
    let targetId = null, targetPlayer = null, targetState = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === message.targetPlayer && id !== clientId) {
            targetId = id;
            targetPlayer = p;
            targetState = gameState.playerStates.get(id);
            break;
        }
    }
    if (!targetPlayer || !targetState) return fail('Target not found or offline.');

    // Alliance protection — can't fight alliance members
    const challengerAlliance = findPlayerAlliance(clientId);
    const targetAlliance = findPlayerAlliance(targetId);
    if (challengerAlliance && targetAlliance && challengerAlliance.id === targetAlliance.id) {
        return fail('You can\'t fight a member of your own alliance.');
    }

    // Cooldown check
    const now = Date.now();
    const lastFight = pvpCooldowns.get(clientId) || 0;
    if (now - lastFight < PVP_COOLDOWN_MS) {
        const secs = Math.ceil((PVP_COOLDOWN_MS - (now - lastFight)) / 1000);
        return fail(`Wait ${secs}s before fighting again.`);
    }

    // Can't fight while in jail
    if (challengerState.inJail) return fail('You can\'t fight while in jail.');
    if (targetState.inJail) return fail('Target is in jail — protected by the feds.');

    // Energy check — server validates, costs 5
    const energyCost = 5;
    if ((challengerState.energy || 0) < energyCost) return fail('Not enough energy.');
    challengerState.energy = Math.max(0, (challengerState.energy || 100) - energyCost);

    // Set cooldown
    pvpCooldowns.set(clientId, now);

    // === BALANCED COMBAT FORMULA ===
    // Factors: level (~25%), reputation (~15%), gear/power (~25%), gang (~15%), health/energy (~10%), randomness (~10%)
    // Client-reported stats (power, gangMembers) are capped server-side to prevent inflated values.
    const cLevel = challenger.level || 1;
    const tLevel = targetPlayer.level || 1;
    const cRep = challenger.reputation || 0;
    const tRep = targetPlayer.reputation || 0;

    // Cap client-reported stats to sane maximums
    const cPower = Math.max(0, Math.min(message.power || 0, 5000));
    const cGang = Math.max(0, Math.min(message.gangMembers || 0, 100));
    const cHealth = Math.max(0, Math.min(challengerState.health || 100, 200));
    const cEnergy = Math.max(0, Math.min(challengerState.energy || 100, 200));

    // Target stats from server-authoritative state (no client trust)
    const tPower = Math.max(0, Math.min(targetState.power || 0, 5000));
    const tGang = Math.max(0, Math.min(targetState.gangMembers || 0, 100));
    const tHealth = Math.max(0, Math.min(targetState.health || 100, 200));
    const tEnergy = Math.max(0, Math.min(targetState.energy || 100, 200));

    // Composite combat score
    function combatScore(lvl, rep, power, gang, hp, en) {
        return (lvl * 5) // Level: max ~250 @ lvl 50
             + (rep * 0.3) // Reputation: max ~150 @ 500 rep
             + (power * 0.08) // Gear power: max ~400 @ 5000
             + (gang * 3) // Gang: max ~300 @ 100 members
             + ((hp / 100) * 20) // Health: max ~40 @ 200 HP
             + ((en / 100) * 10) // Energy: max ~20 @ 200
             + (Math.random() * 40); // Randomness: 0-40 (upset factor)
    }

    const challengerScore = combatScore(cLevel, cRep, cPower, cGang, cHealth, cEnergy);
    const targetScore = combatScore(tLevel, tRep, tPower, tGang, tHealth, tEnergy);
    const victory = challengerScore > targetScore;

    // Health damage from the fight (both take damage)
    const winnerDmg = 5 + Math.floor(Math.random() * 10); // 5-14
    const loserDmg = 10 + Math.floor(Math.random() * 15); // 10-24

    if (victory) {
        const repGain = 5 + Math.floor(Math.random() * 10);
        const repLoss = 3 + Math.floor(Math.random() * 3);
        challenger.reputation = (challenger.reputation || 0) + repGain;
        challengerState.reputation = challenger.reputation;
        targetPlayer.reputation = Math.max(0, (targetPlayer.reputation || 0) - repLoss);
        targetState.reputation = targetPlayer.reputation;

        // Track PvP wins/losses for leaderboard
        challenger.pvpWins = (challenger.pvpWins || 0) + 1;
        targetPlayer.pvpLosses = (targetPlayer.pvpLosses || 0) + 1;

        // Update ELO ratings (ranked season)
        updateElo(clientId, targetId, true);

        // Auto-claim bounties on the defeated player
        const bountyClaim = autoClaimBounty(clientId, targetId);

        // Apply health damage
        challengerState.health = Math.max(1, (challengerState.health || 100) - winnerDmg);
        targetState.health = Math.max(1, (targetState.health || 100) - loserDmg);

        console.log(` ${challenger.name} defeated ${targetPlayer.name} (${Math.round(challengerScore)} vs ${Math.round(targetScore)})`);

        broadcastToAll({
            type: 'combat_result',
            winner: challenger.name,
            loser: targetPlayer.name,
            repChange: repGain,
            healthDamage: { winner: winnerDmg, loser: loserDmg },
            bountyClaimed: bountyClaim || null,
            eloChange: getEloChange(clientId)
        });

        addGlobalChatMessage('System', ` ${challenger.name} defeated ${targetPlayer.name} in combat!`, '#e74c3c');
        if (bountyClaim) addGlobalChatMessage('System', ` ${challenger.name} claimed a $${bountyClaim.reward.toLocaleString()} bounty on ${targetPlayer.name}!`, '#ff6600');
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    } else {
        const repLoss = 2 + Math.floor(Math.random() * 5);
        const repGain = 3 + Math.floor(Math.random() * 3);
        challenger.reputation = Math.max(0, (challenger.reputation || 0) - repLoss);
        challengerState.reputation = challenger.reputation;
        targetPlayer.reputation = (targetPlayer.reputation || 0) + repGain;
        targetState.reputation = targetPlayer.reputation;

        // Track PvP wins/losses
        targetPlayer.pvpWins = (targetPlayer.pvpWins || 0) + 1;
        challenger.pvpLosses = (challenger.pvpLosses || 0) + 1;

        // Update ELO ratings (ranked season)
        updateElo(targetId, clientId, true);

        // Auto-claim bounties on the defeated player
        const bountyClaim = autoClaimBounty(targetId, clientId);

        // Apply health damage
        challengerState.health = Math.max(1, (challengerState.health || 100) - loserDmg);
        targetState.health = Math.max(1, (targetState.health || 100) - winnerDmg);

        console.log(` ${targetPlayer.name} defeated ${challenger.name} (${Math.round(targetScore)} vs ${Math.round(challengerScore)})`);

        broadcastToAll({
            type: 'combat_result',
            winner: targetPlayer.name,
            loser: challenger.name,
            repChange: repGain,
            healthDamage: { winner: winnerDmg, loser: loserDmg },
            bountyClaimed: bountyClaim || null,
            eloChange: getEloChange(targetId)
        });

        addGlobalChatMessage('System', ` ${targetPlayer.name} defeated ${challenger.name} in combat!`, '#e74c3c');
        if (bountyClaim) addGlobalChatMessage('System', ` ${targetPlayer.name} claimed a $${bountyClaim.reward.toLocaleString()} bounty on ${challenger.name}!`, '#ff6600');
        persistedLeaderboard = generateLeaderboard();
        broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
        scheduleWorldSave();
    }

    // Broadcast updated states so both players see HP/energy changes
    broadcastPlayerStates();
}

// Heist start handler (organizer manually starts)
function handleHeistStart(clientId, message) {
    const heist = gameState.activeHeists.find(h => h.id === message.heistId);
    if (!heist) return;
    
    // Only organizer can start
    if (heist.organizerId !== clientId) return;
    
    // Must have minimum crew
    if (heist.participants.length < (heist.minCrew || 1)) return;
    
    console.log(` ${heist.organizer} launched heist: ${heist.target} with ${heist.participants.length} crew`);
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
    console.log(` ${player ? player.name : clientId} left heist: ${heist.target}`);
    
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
    
    console.log(` ${heist.organizer} cancelled heist: ${heist.target}`);
    
    broadcastToAll({
        type: 'heist_cancelled',
        heistId: heist.id,
        message: ` ${heist.organizer} cancelled the heist on ${heist.target}.`
    });
    
    addGlobalChatMessage('System', ` ${heist.organizer} cancelled their heist on ${heist.target}.`, '#e67e22');
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
    
    // Allow name correction (e.g. Anonymous_xxx -> real name after game loads)
    if (message.playerName && message.playerName.trim() !== '' && !message.playerName.startsWith('Anonymous_')) {
        const newName = sanitizePlayerName(message.playerName);
        if (newName && newName !== player.name) {
            player.name = ensureUniqueName(newName);
            const sess = sessions.get(clients.get(clientId));
            if (sess) sess.playerName = player.name;
            // Also update playerState name
            const ps = gameState.playerStates.get(clientId);
            if (ps) ps.name = player.name;
            console.log(` Player name updated: ${player.name} (ID: ${clientId})`);
        }
    }
    
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
    // SECURITY: gameplay-sensitive fields (health, energy, inJail, jailTime, wantedLevel)
    // are only updated by server-side handlers (jobs, combat, jailbreak, etc.)
    if (message.playerState) {
        // Display-sync only — these help other clients see you accurately
        // but are NOT used for server-side combat/economy calculations.
        const displayOnly = ['gangMembers', 'power'];
        for (const key of displayOnly) {
            if (message.playerState[key] !== undefined) {
                playerState[key] = message.playerState[key];
            }
        }
        // Enforce server-side identity
        playerState.playerId = clientId;
        playerState.name = player.name;
        playerState.lastUpdate = Date.now();
    }
    
    console.log(` Updated player state: ${player.name} ${playerState.inJail ? '[IN JAIL]' : ''}`);
    
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
            
            addGlobalChatMessage('System', ` ${player.name} was arrested and sent to jail!`, '#e74c3c');
        } else {
            // Player was released or escaped
            broadcastToAll({
                type: 'player_released',
                playerId: clientId,
                playerName: player.name
            });
            
            addGlobalChatMessage('System', ` ${player.name} was released from jail!`, '#2ecc71');
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

// Handle jail status sync from client (when player is jailed/released locally)
function handleJailStatusSync(clientId, message) {
    const player = gameState.players.get(clientId);
    const playerState = gameState.playerStates.get(clientId);
    if (!player || !playerState) return;

    const wasInJail = !!playerState.inJail;
    const isNowInJail = !!message.inJail;

    playerState.inJail = isNowInJail;
    playerState.jailTime = message.jailTime || 0;

    if (wasInJail !== isNowInJail) {
        if (isNowInJail) {
            console.log(` ${player.name} jail status synced: IN JAIL (${playerState.jailTime}s)`);
            addGlobalChatMessage('System', ` ${player.name} was arrested and sent to jail!`, '#e74c3c');
            broadcastToAll({
                type: 'player_arrested',
                playerId: clientId,
                playerName: player.name,
                jailTime: playerState.jailTime
            });
        } else {
            console.log(` ${player.name} jail status synced: RELEASED`);
            addGlobalChatMessage('System', ` ${player.name} was released from jail!`, '#2ecc71');
            broadcastToAll({
                type: 'player_released',
                playerId: clientId,
                playerName: player.name
            });
        }

        playerState.previousInJail = isNowInJail;
        updateJailBots();
        broadcastPlayerStates();
        broadcastJailRoster();
    }
}

// Handle jailbreak attempts
function handleJailbreakAttempt(clientId, message) {
    const helper = gameState.players.get(clientId);
    const helperState = gameState.playerStates.get(clientId);
    const targetState = gameState.playerStates.get(message.targetPlayerId);
    
    if (!helper || !helperState || !targetState) {
        console.log(' Invalid jailbreak attempt - missing player data');
        return;
    }
    
    if (helperState.inJail) {
        console.log(` ${helper.name} tried to help jailbreak while in jail themselves`);
        return;
    }
    
    const targetName = targetState.name || (gameState.players.get(message.targetPlayerId)?.name) || 'Unknown';
    if (!targetState.inJail) {
        console.log(` ${helper.name} tried to break out ${targetName} who isn't in jail`);
        return;
    }
    
    gameState.serverStats.jailbreakAttempts++;
    
    console.log(` ${helper.name} attempting to break out ${targetName}`);
    
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
        
        console.log(` Jailbreak successful! ${helper.name} freed ${targetName}`);
        
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
        
        addGlobalChatMessage('System', ` ${helper.name} successfully broke ${targetName} out of jail!`, '#2ecc71');
    } else {
        // Failed jailbreak
        const arrestChance = 30; // 30% chance helper gets arrested
        if (Math.random() * 100 < arrestChance) {
            // Helper gets arrested
            helperState.inJail = true;
            helperState.jailTime = 15 + Math.floor(Math.random() * 10); // 15-24 seconds
            helperState.wantedLevel = (helperState.wantedLevel || 0) + 2;
            
            console.log(` Jailbreak failed! ${helper.name} was arrested`);
            
            // Notify helper
            const helperClient = clients.get(clientId);
            if (helperClient && helperClient.readyState === WebSocket.OPEN) {
                helperClient.send(JSON.stringify({
                    type: 'jailbreak_failed_arrested',
                    jailTime: helperState.jailTime,
                    message: 'Jailbreak failed and you were caught! You\'ve been arrested.'
                }));
            }
            
            addGlobalChatMessage('System', ` ${helper.name} failed to break out ${targetName} and was arrested!`, '#e74c3c');
        } else {
            console.log(` Jailbreak failed but ${helper.name} escaped`);
            
            addGlobalChatMessage('System', ` ${helper.name} failed to break out ${targetName} but escaped undetected.`, '#f39c12');
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

        console.log(` Bot jailbreak: ${helper.name} freed ${bot.name}`);

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

        addGlobalChatMessage('System', ` ${helper.name} busted ${bot.name} out of jail!`, '#2ecc71');

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

            console.log(` Bot jailbreak failed: ${helper.name} was arrested`);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'jailbreak_bot_result',
                    success: false,
                    arrested: true,
                    jailTime: helperState.jailTime,
                    message: `Failed to break out ${bot.name} — you got caught!`
                }));
            }

            addGlobalChatMessage('System', ` ${helper.name} was caught trying to break out ${bot.name}!`, '#e74c3c');
            updateJailBots(); // Recheck — new real player in jail
        } else {
            console.log(` Bot jailbreak failed: ${helper.name} escaped`);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'jailbreak_bot_result',
                    success: false,
                    arrested: false,
                    message: `Failed to break out ${bot.name}, but you slipped away undetected.`
                }));
            }

            addGlobalChatMessage('System', ` ${helper.name} failed to break out ${bot.name} but escaped.`, '#f39c12');
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

    // Prune expired bounties on world state request
    pruneExpiredBounties();
    checkSeasonRotation();

    ws.send(JSON.stringify({
        type: 'world_update',
        playerCount: gameState.players.size,
        playerStates: playerStatesObj,
        cityDistricts: gameState.cityDistricts,
        cityEvents: gameState.cityEvents,
        activeHeists: gameState.activeHeists,
        territories: gameState.territories,
        activeBounties: gameState.bounties.length,
        seasonNumber: gameState.season.number,
        seasonEndsAt: gameState.season.endsAt,
        politics: sanitizePolitics()
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

    addGlobalChatMessage('System', ` ${sender.name} sent a $${amount.toLocaleString()} gift to ${targetPlayer.name}!`, '#c0a062');
    console.log(` Gift: ${sender.name} -> ${targetPlayer.name}: $${amount}`);
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
    let grossEarnings = Math.floor(jobDef.base * variance);

    // Apply Top Don crime bonus policy
    const crimeBonus = gameState.politics.policies.crimeBonus || 0;
    if (crimeBonus > 0) {
        grossEarnings = Math.floor(grossEarnings * (1 + crimeBonus / 100));
    }

    // ── Phase 2: Territory Tax (uses Top Don worldTaxRate policy) ──
    const effectiveTaxRate = (gameState.politics.policies.worldTaxRate || 10) / 100;
    let taxAmount = 0;
    let taxOwnerName = null;
    const playerTerritory = player.currentTerritory;
    if (playerTerritory && gameState.territories[playerTerritory]) {
        const terr = gameState.territories[playerTerritory];
        if (terr.owner && terr.owner !== player.name) {
            taxAmount = Math.floor(grossEarnings * effectiveTaxRate);
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
        ps.jailTime = applyJailTimeMod(15 + Math.floor(Math.random() * 20)); // 15-34 seconds base
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
        addGlobalChatMessage('System', ` ${player.name} was arrested after a ${jobId} job!`, '#e74c3c');
    }

    broadcastPlayerStates();
    persistedLeaderboard = generateLeaderboard();
    broadcastToAll({ type: 'player_ranked', leaderboard: persistedLeaderboard });
    scheduleWorldSave();
}

// ── Phase 3: Business Income Tax Handler ────────────────────────
function handleBusinessIncomeTax(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;

    const { district, grossIncome } = message;
    if (!district || !grossIncome || grossIncome <= 0) return;

    const terr = gameState.territories[district];
    if (!terr || !terr.owner || terr.owner === player.name) return;

    // Server-authoritative: compute tax from grossIncome using political worldTaxRate
    const politicalTaxRate = (gameState.politics.policies.worldTaxRate || 10) / 100;
    const safeTax = Math.floor(grossIncome * politicalTaxRate);
    if (safeTax <= 0) return;

    terr.taxCollected = (terr.taxCollected || 0) + safeTax;

    // Credit tax to territory owner
    for (const [ownerId, ownerPlayer] of gameState.players.entries()) {
        if (ownerPlayer.name === terr.owner) {
            ownerPlayer.money = (ownerPlayer.money || 0) + safeTax;
            const ownerPs = gameState.playerStates.get(ownerId);
            if (ownerPs) { ownerPs.money = ownerPlayer.money; ownerPs.lastUpdate = Date.now(); }
            // Notify territory owner
            const ownerWs = clients.get(ownerId);
            if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
                ownerWs.send(JSON.stringify({
                    type: 'territory_tax_income',
                    from: player.name,
                    district: district,
                    amount: safeTax,
                    source: 'business',
                    newMoney: ownerPlayer.money,
                    totalCollected: terr.taxCollected
                }));
            }
            break;
        }
    }

    // Acknowledge to sender
    const ws = clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'business_income_tax_result',
            success: true,
            district: district,
            taxAmount: safeTax
        }));
    }

    scheduleWorldSave();
}

// Broadcast player states to all clients
function broadcastPlayerStates() {
    broadcastToAll({
        type: 'world_update',
        playerCount: clients.size,
        playerStates: Object.fromEntries(gameState.playerStates),
        politics: sanitizePolitics(),
        timestamp: Date.now()
    });
}

// Execute heist — uses difficulty-based success rate
function executeHeist(heist) {
    console.log(` Executing heist: ${heist.target} (${heist.participants.length} crew)`);
    
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
        // Apply Top Don heist bonus policy
        const heistBonusMod = gameState.politics.policies.heistBonus || 0;
        const effectiveReward = heistBonusMod > 0 ? Math.floor(heist.reward * (1 + heistBonusMod / 100)) : heist.reward;
        const rewardPerPlayer = Math.floor(effectiveReward / heist.participants.length);
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
                    worldMessage: ` Heist on ${heist.target} was successful! Crew: ${participantNames}`
                }));
            }
        });
        
        // Broadcast to non-participants
        broadcastToAll({
            type: 'heist_completed',
            heistId: heist.id,
            success: true,
            involved: false,
            worldMessage: ` Heist on ${heist.target} was successful! Crew: ${participantNames}`
        });
        
        addGlobalChatMessage('System', ` Heist successful! ${heist.target} netted $${heist.reward.toLocaleString()}!`, '#2ecc71');
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
                    worldMessage: ` Heist on ${heist.target} failed! The crew barely escaped.`
                }));
            }
        });
        
        // Broadcast to non-participants
        broadcastToAll({
            type: 'heist_completed',
            heistId: heist.id,
            success: false,
            involved: false,
            worldMessage: ` Heist on ${heist.target} failed! The crew barely escaped.`
        });
        
        addGlobalChatMessage('System', ` Heist failed! ${heist.target} was too well defended.`, '#e74c3c');
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

// ── Server-Authoritative Weather System ──
// Weather types per season with probability weights (mirrors game.js definitions)
const SERVER_WEATHER_WEIGHTS = {
    spring: { clear: 20, overcast: 15, rain: 25, drizzle: 20, fog: 12, storm: 8 },
    summer: { clear: 35, overcast: 10, rain: 10, drizzle: 5, storm: 12, heatwave: 18, humid: 10 },
    autumn: { clear: 12, overcast: 20, rain: 22, drizzle: 15, fog: 18, storm: 8, sleet: 5 },
    winter: { clear: 10, overcast: 18, snow: 25, blizzard: 8, sleet: 15, fog: 14, storm: 10 }
};

function serverChangeWeather() {
    const weights = SERVER_WEATHER_WEIGHTS[gameState.currentSeason] || SERVER_WEATHER_WEIGHTS.spring;
    const types = Object.keys(weights);
    const total = types.reduce((s, t) => s + weights[t], 0);
    let roll = Math.random() * total;
    let chosen = types[0];
    for (const t of types) {
        roll -= weights[t];
        if (roll <= 0) { chosen = t; break; }
    }
    if (chosen !== gameState.currentWeather) {
        gameState.currentWeather = chosen;
        broadcastToAll({ type: 'weather_update', weather: chosen, season: gameState.currentSeason });
        console.log(` Weather changed to: ${chosen}`);
    }
}

// Update season based on real-world month
function serverUpdateSeason() {
    const month = new Date().getMonth(); // 0-11
    const seasons = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
    gameState.currentSeason = seasons[month];
}

// Start weather timer — changes every 30 minutes
serverUpdateSeason();
serverChangeWeather(); // Set initial weather
setInterval(() => {
    serverUpdateSeason();
    serverChangeWeather();
}, 30 * 60 * 1000); // 30 minutes

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

// ==================== PLAYER DEATH NEWSPAPER ====================
function handlePlayerDeath(clientId, message) {
    const playerData = gameState.players.get(clientId);
    if (!playerData) return;
    const nd = message.newspaperData;
    if (!nd || !nd.name) return;

    // Sanitize the newspaper data (don't trust client blindly)
    const sanitized = {
        name: String(nd.name).slice(0, 30),
        portrait: nd.portrait ? String(nd.portrait).slice(0, 200) : '',
        level: Math.max(1, Math.min(100, parseInt(nd.level) || 1)),
        legacyTitle: String(nd.legacyTitle || 'Street Rat').slice(0, 30),
        causeOfDeath: String(nd.causeOfDeath || 'Died on the streets').slice(0, 100),
        money: Math.max(0, parseInt(nd.money) || 0),
        totalCrimes: Math.max(0, parseInt(nd.totalCrimes) || 0),
        gangSize: Math.max(0, parseInt(nd.gangSize) || 0),
        territories: Math.max(0, parseInt(nd.territories) || 0),
        businesses: Math.max(0, parseInt(nd.businesses) || 0),
        properties: Math.max(0, parseInt(nd.properties) || 0),
        bestSkill: String(nd.bestSkill || 'None').slice(0, 30),
        bestSkillRank: Math.max(0, parseInt(nd.bestSkillRank) || 0),
        gamblingWins: Math.max(0, parseInt(nd.gamblingWins) || 0),
        family: String(nd.family || 'Unaffiliated').slice(0, 30),
        timestamp: Date.now()
    };

    // Send chat announcement
    addGlobalChatMessage('The Daily Racketeer', ` EXTRA! EXTRA! Read all about it! ${sanitized.name} is DEAD! "${sanitized.causeOfDeath}" — Click to read the full story!`, '#c0a040');

    // Broadcast the newspaper data to all connected clients so they can view the popup
    broadcastToAll({
        type: 'player_death_newspaper',
        newspaperData: sanitized
    });
}

// ==================== ADMIN KILL PLAYER ====================
function handleAdminKillPlayer(clientId, message) {
    // Validate the auth token to confirm this is an admin
    const authToken = message.authToken;
    if (!authToken) {
        console.log(` Admin kill rejected: no auth token from ${clientId}`);
        return;
    }
    const username = userDB.validateToken(authToken);
    if (!username || !isAdmin(username)) {
        console.log(` Admin kill rejected: ${username || 'unknown'} is not admin`);
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'system_message', message: 'You do not have admin privileges.', color: '#e74c3c' }));
        }
        return;
    }

    const targetPlayerId = message.targetPlayerId;
    const causeOfDeath = String(message.causeOfDeath || 'Executed by order of the Don').slice(0, 100);

    // Find the target player
    const targetPlayer = gameState.players.get(targetPlayerId);
    const targetState = gameState.playerStates.get(targetPlayerId);
    const targetWs = clients.get(targetPlayerId);

    if (!targetPlayer || !targetWs || targetWs.readyState !== 1) {
        const ws = clients.get(clientId);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'system_message', message: 'Target player not found or disconnected.', color: '#e74c3c' }));
        }
        return;
    }

    console.log(` ADMIN KILL: ${username} executed ${targetPlayer.name} (${targetPlayerId}) — "${causeOfDeath}"`);

    // Send kill command to the target client — includes basic player info for newspaper
    targetWs.send(JSON.stringify({
        type: 'admin_killed',
        causeOfDeath: causeOfDeath,
        killedBy: 'The Don'
    }));

    // Build a server-side newspaper for the broadcast to all other clients
    const serverNewspaper = {
        name: targetPlayer.name,
        portrait: '',
        level: targetState ? targetState.level || 1 : 1,
        legacyTitle: 'Criminal',
        causeOfDeath: causeOfDeath,
        money: targetState ? targetState.money || 0 : 0,
        totalCrimes: 0,
        gangSize: 0,
        territories: 0,
        businesses: 0,
        properties: 0,
        bestSkill: 'Unknown',
        bestSkillRank: 0,
        gamblingWins: 0,
        family: 'Unknown',
        timestamp: Date.now()
    };

    // Announce in world chat
    addGlobalChatMessage('The Daily Racketeer', ` EXTRA! EXTRA! Read all about it! ${targetPlayer.name} is DEAD! "${causeOfDeath}" — Click to read the full story!`, '#c0a040');

    // Broadcast the newspaper to ALL clients so everyone sees the death popup
    broadcastToAll({
        type: 'player_death_newspaper',
        newspaperData: serverNewspaper
    });

    // Also broadcast as global chat
    broadcastToAll({
        type: 'global_chat',
        playerId: 'SYSTEM',
        playerName: 'The Daily Racketeer',
        message: ` EXTRA! EXTRA! ${targetPlayer.name} is DEAD! "${causeOfDeath}" — Click to read the full story!`,
        timestamp: Date.now(),
        color: '#c0a040'
    });

    // Confirm to admin
    const adminWs = clients.get(clientId);
    if (adminWs && adminWs.readyState === 1) {
        adminWs.send(JSON.stringify({ type: 'system_message', message: `Kill order executed: ${targetPlayer.name} is dead.`, color: '#c0a040' }));
    }
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
    // Base: 5% — assassination is extremely difficult
    let chance = 5;

    // Bullets: +0.3% per bullet, max +9% (30 bullets)
    chance += Math.min(bulletsSent * 0.3, 9);

    // Best gun power: +0.03% per power point, max +4% (133 power)
    chance += Math.min(bestGunPower * 0.03, 4);

    // Extra guns: +0.5% per extra gun after the first, max +3%
    chance += Math.min((gunCount - 1) * 0.5, 3);

    // Vehicles: +1% per vehicle, max +3% (3 vehicles)
    chance += Math.min(vehicleCount * 1, 3);

    // Gang members: +0.3% per member, max +6% (20 members)
    chance += Math.min(gangMembers * 0.3, 6);

    // Level advantage: +0.3% per level above target, max +3%
    const levelDiff = attackerLevel - (target.level || 1);
    if (levelDiff > 0) chance += Math.min(levelDiff * 0.3, 3);

    // Total power bonus: +0.001% per power, max +3%
    chance += Math.min(attackPower * 0.001, 3);

    // Target defense: higher level targets are harder
    const targetLevel = target.level || 1;
    chance -= Math.min(targetLevel * 0.4, 12);

    // Clamp to 3%-15% — always risky, never guaranteed
    chance = Math.max(3, Math.min(chance, 15));

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
                console.log(` TERRITORY SEIZED: ${attacker.name} took ${tId} from ${target.name} via assassination`);
            }
        }
        if (territoriesSeized.length > 0) {
            addGlobalChatMessage('System', ` ${attacker.name} seized ${territoriesSeized.length} territory(s) from ${target.name}!`, '#d4af37');
            broadcastToAll({
                type: 'territory_ownership_changed',
                territories: gameState.territories,
                attacker: attacker.name,
                defender: target.name,
                seized: territoriesSeized,
                method: 'assassination'
            });
            recalcTopDon();
            scheduleWorldSave();
        }

        console.log(` ASSASSINATION: ${attacker.name} killed ${target.name} and stole $${stolenAmount.toLocaleString()} (${stealPercent}%) | HP -${healthDamage} | ${gangMembersLost} gang lost`);

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
        addGlobalChatMessage('System', ` ${attacker.name} successfully assassinated ${target.name} and stole $${stolenAmount.toLocaleString()}!`, '#8b0000');

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

        console.log(` ASSASSINATION FAILED: ${attacker.name} failed to kill ${target.name}${arrested ? ' and was ARRESTED' : ''} | HP -${healthDamage} | ${gangMembersLost} gang lost`);

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
            addGlobalChatMessage('System', ` ${attacker.name} botched a hit on ${target.name} and was arrested!`, '#8b0000');
        }
    }

    broadcastPlayerStates();
    scheduleWorldSave();
}

// ==================== WAR BETTING (SERVER-AUTHORITATIVE) ====================
// Server deducts the bet, generates a sealed outcome, and sends it back.
// Client animates the war to match, then the server resolves the payout.
function handleWarBet(clientId, message) {
    const player = gameState.players.get(clientId);
    const ps = gameState.playerStates.get(clientId);
    if (!player || !ps) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'war_bet_result', success: false, error: err })); };

    const { district, side, amount } = message;
    if (!district || !side || !amount) return fail('Invalid bet.');
    if (side !== 'attacker' && side !== 'defender') return fail('Invalid side.');

    const betAmount = Math.max(0, Math.min(parseInt(amount) || 0, 10000)); // Cap at $10k
    if (betAmount < 100) return fail('Minimum bet is $100.');
    if (player.money < betAmount) return fail('Not enough cash.');

    // Deduct bet
    player.money -= betAmount;
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    // Generate sealed outcome — ~50/50 with slight defender advantage
    const attackerWinChance = 0.48;
    const roll = Math.random();
    const winningSide = roll < attackerWinChance ? 'attacker' : 'defender';

    // Calculate payout (1.9x — slight house edge)
    let payout = 0;
    let won = false;
    if (winningSide === side) {
        payout = Math.floor(betAmount * 1.9);
        player.money += payout;
        won = true;
    } else if (winningSide === 'stalemate') {
        // Refund on stalemate (rare)
        player.money += betAmount;
        payout = betAmount;
    }

    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    console.log(` WAR BET: ${player.name} bet $${betAmount} on ${side} in ${district} — ${won ? 'WON' : 'LOST'} ($${payout})`);

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'war_bet_result',
            success: true,
            won: won,
            winningSide: winningSide,
            betAmount: betAmount,
            payout: payout,
            newMoney: player.money,
            district: district
        }));
    }

    broadcastPlayerStates();
    scheduleWorldSave();
}

// ==================== PHASE C: ALLIANCE SYSTEM ====================
// Player-created alliances (max 4 members). Server-authoritative.

const MAX_ALLIANCE_SIZE = 4;
const ALLIANCE_CREATE_COST = 10000;

function findPlayerAlliance(playerId) {
    for (const [, alliance] of gameState.alliances) {
        if (alliance.members.includes(playerId)) return alliance;
    }
    return null;
}

function handleAllianceCreate(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    if (findPlayerAlliance(clientId)) return fail('You are already in an alliance. Leave first.');

    const name = (message.name || '').trim().substring(0, 24);
    const tag = (message.tag || '').trim().substring(0, 4).toUpperCase();
    if (!name || name.length < 3) return fail('Alliance name must be 3-24 characters.');
    if (!tag || tag.length < 2) return fail('Alliance tag must be 2-4 characters.');

    // Check name uniqueness
    for (const [, a] of gameState.alliances) {
        if (a.name.toLowerCase() === name.toLowerCase() || a.tag === tag) {
            return fail('An alliance with that name or tag already exists.');
        }
    }

    // Cost check
    if ((player.money || 0) < ALLIANCE_CREATE_COST) return fail(`Creating an alliance costs $${ALLIANCE_CREATE_COST.toLocaleString()}.`);
    player.money -= ALLIANCE_CREATE_COST;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    const allianceId = 'ally_' + Date.now() + '_' + clientId.slice(-4);
    const alliance = {
        id: allianceId,
        name: name,
        tag: tag,
        leader: clientId,
        members: [clientId],
        createdAt: Date.now(),
        treasury: 0,
        motto: (message.motto || 'United we stand.').substring(0, 80)
    };
    gameState.alliances.set(allianceId, alliance);

    console.log(` ALLIANCE CREATED: [${tag}] ${name} by ${player.name}`);

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'created', alliance: sanitizeAlliance(alliance) }));
    }

    addGlobalChatMessage('System', ` ${player.name} founded the alliance [${tag}] ${name}!`, '#c0a062');
    broadcastPlayerStates();
    scheduleWorldSave();
}

function handleAllianceInvite(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    const alliance = findPlayerAlliance(clientId);
    if (!alliance) return fail('You are not in an alliance.');
    if (alliance.leader !== clientId) return fail('Only the leader can invite members.');
    if (alliance.members.length >= MAX_ALLIANCE_SIZE) return fail(`Alliance is full (max ${MAX_ALLIANCE_SIZE}).`);

    // Find target player
    const targetName = message.targetPlayer;
    let targetId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === targetName && id !== clientId) { targetId = id; break; }
    }
    if (!targetId) return fail('Player not found or offline.');
    if (findPlayerAlliance(targetId)) return fail('That player is already in an alliance.');

    // Send invite to target
    const tgtWs = clients.get(targetId);
    if (tgtWs && tgtWs.readyState === 1) {
        tgtWs.send(JSON.stringify({
            type: 'alliance_invite',
            allianceId: alliance.id,
            allianceName: alliance.name,
            allianceTag: alliance.tag,
            inviterName: player.name
        }));
    }

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'invited', targetPlayer: targetName }));
    }
}

function handleAllianceJoin(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    if (findPlayerAlliance(clientId)) return fail('You are already in an alliance.');

    const alliance = gameState.alliances.get(message.allianceId);
    if (!alliance) return fail('Alliance not found.');
    if (alliance.members.length >= MAX_ALLIANCE_SIZE) return fail('Alliance is full.');

    alliance.members.push(clientId);

    console.log(` ${player.name} joined [${alliance.tag}] ${alliance.name}`);

    // Notify all alliance members
    alliance.members.forEach(mId => {
        const mWs = clients.get(mId);
        if (mWs && mWs.readyState === 1) {
            mWs.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'member_joined', alliance: sanitizeAlliance(alliance), newMember: player.name }));
        }
    });

    addGlobalChatMessage('System', ` ${player.name} joined [${alliance.tag}] ${alliance.name}!`, '#c0a062');
    scheduleWorldSave();
}

function handleAllianceLeave(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    const alliance = findPlayerAlliance(clientId);
    if (!alliance) return fail('You are not in an alliance.');

    alliance.members = alliance.members.filter(id => id !== clientId);

    if (alliance.members.length === 0) {
        // Alliance dissolved
        gameState.alliances.delete(alliance.id);
        addGlobalChatMessage('System', ` [${alliance.tag}] ${alliance.name} has been dissolved.`, '#e74c3c');
    } else if (alliance.leader === clientId) {
        // Transfer leadership to next member
        alliance.leader = alliance.members[0];
        const newLeaderName = gameState.players.get(alliance.leader)?.name || 'Unknown';
        addGlobalChatMessage('System', ` ${newLeaderName} is now leader of [${alliance.tag}] ${alliance.name}.`, '#c0a062');
    }

    // Notify remaining members
    alliance.members.forEach(mId => {
        const mWs = clients.get(mId);
        if (mWs && mWs.readyState === 1) {
            mWs.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'member_left', alliance: sanitizeAlliance(alliance), leftMember: player.name }));
        }
    });

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'left', allianceName: alliance.name }));
    }

    console.log(` ${player.name} left [${alliance.tag}] ${alliance.name}`);
    scheduleWorldSave();
}

function handleAllianceKick(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    const alliance = findPlayerAlliance(clientId);
    if (!alliance) return fail('You are not in an alliance.');
    if (alliance.leader !== clientId) return fail('Only the leader can kick members.');

    // Find target
    let targetId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === message.targetPlayer && id !== clientId) { targetId = id; break; }
    }
    if (!targetId || !alliance.members.includes(targetId)) return fail('Player not in your alliance.');

    alliance.members = alliance.members.filter(id => id !== targetId);

    // Notify kicked player
    const tgtWs = clients.get(targetId);
    if (tgtWs && tgtWs.readyState === 1) {
        tgtWs.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'kicked', allianceName: alliance.name }));
    }

    // Notify remaining members
    alliance.members.forEach(mId => {
        const mWs = clients.get(mId);
        if (mWs && mWs.readyState === 1) {
            mWs.send(JSON.stringify({ type: 'alliance_result', success: true, action: 'member_kicked', alliance: sanitizeAlliance(alliance), kickedMember: message.targetPlayer }));
        }
    });

    addGlobalChatMessage('System', ` ${message.targetPlayer} was kicked from [${alliance.tag}] ${alliance.name}.`, '#e74c3c');
    scheduleWorldSave();
}

// ==================== ALLIANCE DISCIPLINE ====================
const DISCIPLINE_TYPES = {
    warning: {
        name: 'Formal Warning',
        icon: '',
        color: '#f39c12',
        broadcastTemplate: (leader, target, alliance, reason) =>
            ` ALLIANCE NOTICE — ${leader}, leader of [${alliance.tag}] ${alliance.name}, has issued a FORMAL WARNING to ${target}.${reason ? ` Reason: "${reason}"` : ''} — Watch yourself.`,
    },
    humiliation: {
        name: 'Public Humiliation',
        icon: '',
        color: '#e74c3c',
        broadcastTemplate: (leader, target, alliance, reason) =>
            ` PUBLIC HUMILIATION — ${target} of [${alliance.tag}] ${alliance.name} has been publicly shamed by ${leader}.${reason ? ` "${reason}"` : ''} — The streets are watching.`,
    },
    punishment: {
        name: 'Serious Punishment',
        icon: '',
        color: '#8b0000',
        broadcastTemplate: (leader, target, alliance, reason) =>
            ` PUNISHMENT DEALT — ${leader} of [${alliance.tag}] ${alliance.name} has made an example of ${target}.${reason ? ` "${reason}"` : ''} — Let this be a lesson to all.`,
    }
};

const disciplineCooldowns = new Map(); // clientId -> timestamp
const DISCIPLINE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between disciplines

function handleAllianceDiscipline(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_discipline_result', success: false, error: err })); };

    const alliance = findPlayerAlliance(clientId);
    if (!alliance) return fail('You are not in an alliance.');
    if (alliance.leader !== clientId) return fail('Only the alliance leader can discipline members.');

    const disciplineType = DISCIPLINE_TYPES[message.disciplineType];
    if (!disciplineType) return fail('Invalid discipline type.');

    // Cooldown check
    const lastDiscipline = disciplineCooldowns.get(clientId) || 0;
    const now = Date.now();
    if (now - lastDiscipline < DISCIPLINE_COOLDOWN_MS) {
        const remaining = Math.ceil((DISCIPLINE_COOLDOWN_MS - (now - lastDiscipline)) / 1000);
        return fail(`Discipline is on cooldown. Wait ${remaining}s.`);
    }

    // Find target player
    const targetName = (message.targetPlayer || '').trim();
    if (!targetName) return fail('No target specified.');
    if (targetName === player.name) return fail('You cannot discipline yourself.');

    let targetId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === targetName && id !== clientId) { targetId = id; break; }
    }
    if (!targetId || !alliance.members.includes(targetId)) return fail('That player is not in your alliance.');

    // Sanitize reason
    const reason = (message.reason || '').trim().slice(0, 100);

    // Set cooldown
    disciplineCooldowns.set(clientId, now);

    // Build broadcast message
    const broadcastMsg = disciplineType.broadcastTemplate(player.name, targetName, alliance, reason);

    // Blast to global chat for ALL players to see
    addGlobalChatMessage('System', broadcastMsg, disciplineType.color);

    // Send targeted notification to the victim
    const tgtWs = clients.get(targetId);
    if (tgtWs && tgtWs.readyState === 1) {
        tgtWs.send(JSON.stringify({
            type: 'alliance_discipline_result',
            success: true,
            action: 'received',
            disciplineType: message.disciplineType,
            disciplineName: disciplineType.name,
            icon: disciplineType.icon,
            leaderName: player.name,
            allianceName: alliance.name,
            allianceTag: alliance.tag,
            reason: reason
        }));
    }

    // Confirm to the leader
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'alliance_discipline_result',
            success: true,
            action: 'issued',
            disciplineType: message.disciplineType,
            disciplineName: disciplineType.name,
            icon: disciplineType.icon,
            targetPlayer: targetName,
            reason: reason
        }));
    }

    // Notify other alliance members
    alliance.members.forEach(mId => {
        if (mId === clientId || mId === targetId) return;
        const mWs = clients.get(mId);
        if (mWs && mWs.readyState === 1) {
            mWs.send(JSON.stringify({
                type: 'alliance_discipline_result',
                success: true,
                action: 'witnessed',
                disciplineType: message.disciplineType,
                disciplineName: disciplineType.name,
                icon: disciplineType.icon,
                leaderName: player.name,
                targetPlayer: targetName,
                allianceName: alliance.name,
                reason: reason
            }));
        }
    });

    console.log(` Alliance discipline: ${player.name} → ${targetName} (${message.disciplineType}) in [${alliance.tag}]`);
}

// ==================== POLITICAL SYSTEM — TOP DON ====================
// The player (or alliance leader) who controls the most territories becomes
// the "Top Don" and can set server-wide policies that affect all players.

const POLICY_LIMITS = {
    worldTaxRate: { min: 5, max: 25, label: 'World Tax Rate', unit: '%', icon: '' },
    marketFee: { min: 0, max: 15, label: 'Market Fee', unit: '%', icon: '' },
    crimeBonus: { min: 0, max: 20, label: 'Crime Bonus', unit: '%', icon: '' },
    jailTimeMod: { min: -30, max: 30, label: 'Jail Time Modifier', unit: '%', icon: '' },
    heistBonus: { min: 0, max: 25, label: 'Heist Bonus', unit: '%', icon: '' }
};
const POLICY_CHANGE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between policy changes
const MIN_TERRITORIES_FOR_TOP_DON = 1; // Need at least 1 territory to qualify

// Sanitize politics for client consumption (no internal IDs)
function sanitizePolitics() {
    const p = gameState.politics;
    return {
        topDonName: p.topDonName,
        territoryCount: p.territoryCount,
        isAlliance: p.isAlliance,
        allianceName: p.allianceName,
        allianceTag: p.allianceTag,
        policies: { ...p.policies },
        policyLimits: POLICY_LIMITS
    };
}

// Apply Top Don jail time modifier to a base jail time
function applyJailTimeMod(baseTime) {
    const mod = gameState.politics.policies.jailTimeMod || 0;
    if (mod === 0) return baseTime;
    return Math.max(5, Math.round(baseTime * (1 + mod / 100)));
}

// Recalculate who is the Top Don based on territory ownership
function recalcTopDon() {
    const ownerCounts = {}; // playerName -> count of territories owned
    for (const [, terr] of Object.entries(gameState.territories)) {
        if (terr.owner && !NPC_OWNER_NAMES.has(terr.owner)) {
            ownerCounts[terr.owner] = (ownerCounts[terr.owner] || 0) + 1;
        }
    }

    // Also count alliance-wide territories (sum all members' territories)
    const allianceCounts = {}; // allianceId -> { count, leaderName, leaderId, name, tag }
    for (const [allianceId, alliance] of gameState.alliances) {
        let total = 0;
        for (const memberId of alliance.members) {
            const memberPlayer = gameState.players.get(memberId);
            if (memberPlayer && ownerCounts[memberPlayer.name]) {
                total += ownerCounts[memberPlayer.name];
            }
        }
        if (total > 0) {
            const leaderPlayer = gameState.players.get(alliance.leader);
            allianceCounts[allianceId] = {
                count: total,
                leaderName: leaderPlayer ? leaderPlayer.name : 'Unknown',
                leaderId: alliance.leader,
                name: alliance.name,
                tag: alliance.tag
            };
        }
    }

    // Find the best candidate: individual players first, then alliances
    let bestName = null;
    let bestCount = 0;
    let bestClientId = null;
    let bestIsAlliance = false;
    let bestAllianceName = null;
    let bestAllianceTag = null;

    // Check individual players
    for (const [playerName, count] of Object.entries(ownerCounts)) {
        if (count > bestCount) {
            bestCount = count;
            bestName = playerName;
            bestIsAlliance = false;
            bestAllianceName = null;
            bestAllianceTag = null;
            // Find clientId for this player name
            for (const [cid, p] of gameState.players) {
                if (p.name === playerName) { bestClientId = cid; break; }
            }
        }
    }

    // Check alliances (alliance total must beat individual to take over)
    for (const [, adata] of Object.entries(allianceCounts)) {
        if (adata.count > bestCount) {
            bestCount = adata.count;
            bestName = adata.leaderName;
            bestClientId = adata.leaderId;
            bestIsAlliance = true;
            bestAllianceName = adata.name;
            bestAllianceTag = adata.tag;
        }
    }

    const oldTopDon = gameState.politics.topDonName;

    if (bestCount >= MIN_TERRITORIES_FOR_TOP_DON) {
        gameState.politics.topDonName = bestName;
        gameState.politics.topDonClientId = bestClientId;
        gameState.politics.territoryCount = bestCount;
        gameState.politics.isAlliance = bestIsAlliance;
        gameState.politics.allianceName = bestAllianceName;
        gameState.politics.allianceTag = bestAllianceTag;
    } else {
        gameState.politics.topDonName = null;
        gameState.politics.topDonClientId = null;
        gameState.politics.territoryCount = 0;
        gameState.politics.isAlliance = false;
        gameState.politics.allianceName = null;
        gameState.politics.allianceTag = null;
    }

    gameState.politics.lastRecalc = Date.now();

    // Announce if Top Don changed
    if (gameState.politics.topDonName && gameState.politics.topDonName !== oldTopDon) {
        const allianceStr = gameState.politics.isAlliance ? ` ([${gameState.politics.allianceTag}] ${gameState.politics.allianceName})` : '';
        addGlobalChatMessage('System', ` ${gameState.politics.topDonName}${allianceStr} has risen to Top Don with ${gameState.politics.territoryCount} territories! They now control the city's policies.`, '#ffd700');
        console.log(` Top Don changed: ${oldTopDon || 'None'} → ${gameState.politics.topDonName}`);
    } else if (!gameState.politics.topDonName && oldTopDon) {
        addGlobalChatMessage('System', ` The city has no Top Don — all territories are under NPC control. Conquer to rule!`, '#888');
        console.log(` Top Don vacated (was ${oldTopDon})`);
    }
}

function handlePoliticsInfo(clientId) {
    const ws = clients.get(clientId);
    if (!ws || ws.readyState !== 1) return;

    ws.send(JSON.stringify({
        type: 'politics_info_result',
        politics: sanitizePolitics(),
        isTopDon: gameState.politics.topDonClientId === clientId,
        cooldownRemaining: Math.max(0, (gameState.politics.policyChangedAt + POLICY_CHANGE_COOLDOWN_MS) - Date.now())
    }));
}

function handlePoliticsSetPolicy(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'politics_policy_result', success: false, error: err })); };

    // Must be the Top Don
    if (gameState.politics.topDonClientId !== clientId) {
        return fail('Only the Top Don can set city policies.');
    }

    const { policy, value } = message;
    if (!policy || !POLICY_LIMITS[policy]) return fail('Invalid policy.');

    const limits = POLICY_LIMITS[policy];
    const numVal = parseInt(value);
    if (isNaN(numVal) || numVal < limits.min || numVal > limits.max) {
        return fail(`${limits.label} must be between ${limits.min}${limits.unit} and ${limits.max}${limits.unit}.`);
    }

    // Cooldown check
    const now = Date.now();
    const timeSinceLastChange = now - (gameState.politics.policyChangedAt || 0);
    if (timeSinceLastChange < POLICY_CHANGE_COOLDOWN_MS) {
        const remaining = Math.ceil((POLICY_CHANGE_COOLDOWN_MS - timeSinceLastChange) / 60000);
        return fail(`Policy changes are on cooldown. Wait ${remaining} more minute(s).`);
    }

    const oldValue = gameState.politics.policies[policy];
    gameState.politics.policies[policy] = numVal;
    gameState.politics.policyChangedAt = now;


    console.log(` Policy changed: ${limits.label} ${oldValue}→${numVal} by ${player.name}`);

    // Notify the Top Don
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'politics_policy_result',
            success: true,
            policy: policy,
            oldValue: oldValue,
            newValue: numVal,
            cooldownRemaining: POLICY_CHANGE_COOLDOWN_MS
        }));
    }

    // Broadcast to everyone
    const changeMsg = numVal > oldValue
        ? ` Top Don ${player.name} raised ${limits.label} from ${oldValue}${limits.unit} to ${numVal}${limits.unit}!`
        : ` Top Don ${player.name} lowered ${limits.label} from ${oldValue}${limits.unit} to ${numVal}${limits.unit}!`;
    addGlobalChatMessage('System', changeMsg, '#ffd700');

    // Broadcast updated politics to all
    broadcastToAll({
        type: 'politics_update',
        politics: sanitizePolitics()
    });

    scheduleWorldSave();
}

function handleAllianceInfo(clientId, message) {
    const ws = clients.get(clientId);
    if (!ws || ws.readyState !== 1) return;

    const alliance = findPlayerAlliance(clientId);
    const allAlliances = [];
    for (const [, a] of gameState.alliances) {
        allAlliances.push(sanitizeAlliance(a));
    }

    // Gather territory data for alliance members
    let allianceTerritories = {};
    if (alliance) {
        const memberNames = alliance.members.map(id => {
            const p = gameState.players.get(id);
            return p ? p.name : null;
        }).filter(Boolean);

        for (const [distId, terr] of Object.entries(gameState.territories)) {
            if (terr.owner && memberNames.includes(terr.owner)) {
                allianceTerritories[distId] = {
                    owner: terr.owner,
                    residents: terr.residents || [],
                    defenseRating: terr.defenseRating || 100,
                    taxCollected: terr.taxCollected || 0
                };
            }
        }
    }

    ws.send(JSON.stringify({
        type: 'alliance_info_result',
        myAlliance: alliance ? sanitizeAlliance(alliance) : null,
        allAlliances: allAlliances,
        allianceTerritories: allianceTerritories
    }));
}

function handleAllianceDeposit(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'alliance_result', success: false, error: err })); };

    const alliance = findPlayerAlliance(clientId);
    if (!alliance) return fail('You are not in an alliance.');

    const amount = Math.max(0, Math.min(parseInt(message.amount) || 0, 100000));
    if (amount < 100) return fail('Minimum deposit is $100.');
    if ((player.money || 0) < amount) return fail('Not enough cash.');

    player.money -= amount;
    alliance.treasury += amount;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    // Notify all alliance members
    const sanitized = sanitizeAlliance(alliance);
    alliance.members.forEach(mId => {
        const mWs = clients.get(mId);
        if (mWs && mWs.readyState === 1) {
            const payload = {
                type: 'alliance_result', success: true, action: 'deposit',
                alliance: sanitized, depositor: player.name, amount: amount
            };
            // Send the depositor their updated money balance
            if (mId === clientId) payload.newMoney = player.money;
            mWs.send(JSON.stringify(payload));
        }
    });

    console.log(` ${player.name} deposited $${amount} into [${alliance.tag}] treasury`);
    scheduleWorldSave();
}

function sanitizeAlliance(alliance) {
    const memberNames = alliance.members.map(id => {
        const p = gameState.players.get(id);
        return p ? p.name : 'Offline';
    });
    return {
        id: alliance.id,
        name: alliance.name,
        tag: alliance.tag,
        leaderName: gameState.players.get(alliance.leader)?.name || 'Unknown',
        members: memberNames,
        memberCount: alliance.members.length,
        maxMembers: MAX_ALLIANCE_SIZE,
        treasury: alliance.treasury,
        motto: alliance.motto,
        createdAt: alliance.createdAt
    };
}

// ==================== PHASE C: BOUNTY BOARD ====================
// Players post bounties on other players. Bounties auto-claim on PvP defeat.

const BOUNTY_MIN = 5000;
const BOUNTY_MAX = 500000;
const BOUNTY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ACTIVE_BOUNTIES = 20;

function handlePostBounty(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'bounty_result', success: false, error: err })); };

    const targetName = (message.targetPlayer || '').trim();
    const reward = Math.max(0, Math.min(parseInt(message.reward) || 0, BOUNTY_MAX));
    const reason = (message.reason || 'Wanted dead or alive.').substring(0, 60);

    if (!targetName) return fail('Specify a target player.');
    if (reward < BOUNTY_MIN) return fail(`Minimum bounty is $${BOUNTY_MIN.toLocaleString()}.`);
    if ((player.money || 0) < reward) return fail('Not enough cash for the bounty.');

    // Find target
    let targetId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === targetName && id !== clientId) { targetId = id; break; }
    }
    if (!targetId) return fail('Target not found or offline.');

    // Check duplicate bounty on same target by same poster
    const existing = gameState.bounties.find(b => b.posterId === clientId && b.targetId === targetId);
    if (existing) return fail('You already have a bounty on this player.');

    // Prune expired bounties
    pruneExpiredBounties();

    if (gameState.bounties.length >= MAX_ACTIVE_BOUNTIES) return fail('Bounty board is full. Try again later.');

    // Deduct money upfront
    player.money -= reward;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    const bounty = {
        id: 'bounty_' + Date.now() + '_' + clientId.slice(-4),
        posterId: clientId,
        posterName: player.name,
        targetId: targetId,
        targetName: targetName,
        reward: reward,
        reason: reason,
        postedAt: Date.now(),
        expiresAt: Date.now() + BOUNTY_DURATION_MS
    };
    gameState.bounties.push(bounty);

    console.log(` BOUNTY POSTED: ${player.name} placed $${reward.toLocaleString()} bounty on ${targetName}`);

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'bounty_result', success: true, action: 'posted', bounty: bounty, newMoney: player.money }));
    }

    // Notify target
    const tgtWs = clients.get(targetId);
    if (tgtWs && tgtWs.readyState === 1) {
        tgtWs.send(JSON.stringify({
            type: 'bounty_alert',
            bounty: bounty,
            message: `${player.name} put a $${reward.toLocaleString()} bounty on your head!`
        }));
    }

    addGlobalChatMessage('System', ` ${player.name} placed a $${reward.toLocaleString()} bounty on ${targetName}! Reason: "${reason}"`, '#ff6600');
    broadcastPlayerStates();
    scheduleWorldSave();
}

function handleCancelBounty(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'bounty_result', success: false, error: err })); };

    const bountyIdx = gameState.bounties.findIndex(b => b.id === message.bountyId && b.posterId === clientId);
    if (bountyIdx === -1) return fail('Bounty not found or you are not the poster.');

    // Refund 50% (cancellation fee)
    const bounty = gameState.bounties[bountyIdx];
    const refund = Math.floor(bounty.reward * 0.5);
    player.money = (player.money || 0) + refund;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    gameState.bounties.splice(bountyIdx, 1);

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'bounty_result', success: true, action: 'cancelled', refund: refund, newMoney: player.money }));
    }

    console.log(` ${player.name} cancelled bounty on ${bounty.targetName} (refund: $${refund})`);
    scheduleWorldSave();
}

function handleBountyList(clientId, message) {
    const ws = clients.get(clientId);
    if (!ws || ws.readyState !== 1) return;

    pruneExpiredBounties();

    ws.send(JSON.stringify({
        type: 'bounty_list_result',
        bounties: gameState.bounties.map(b => ({
            id: b.id,
            posterName: b.posterName,
            targetName: b.targetName,
            reward: b.reward,
            reason: b.reason,
            postedAt: b.postedAt,
            expiresAt: b.expiresAt,
            timeLeft: Math.max(0, b.expiresAt - Date.now())
        }))
    }));
}

function autoClaimBounty(winnerId, loserId) {
    // Called after PvP combat — winner claims any active bounties on the loser
    const winner = gameState.players.get(winnerId);
    if (!winner) return null;

    pruneExpiredBounties();

    // Find all bounties on the loser (can claim multiple)
    let totalReward = 0;
    const claimed = [];
    gameState.bounties = gameState.bounties.filter(b => {
        if (b.targetId === loserId) {
            totalReward += b.reward;
            claimed.push({ posterName: b.posterName, reward: b.reward, targetName: b.targetName });
            return false; // Remove claimed bounty
        }
        return true;
    });

    if (totalReward > 0) {
        winner.money = (winner.money || 0) + totalReward;
        const ps = gameState.playerStates.get(winnerId);
        if (ps) { ps.money = winner.money; ps.lastUpdate = Date.now(); }
        console.log(` BOUNTY CLAIMED: ${winner.name} collected $${totalReward} in bounties`);
        return { reward: totalReward, count: claimed.length };
    }
    return null;
}

function pruneExpiredBounties() {
    const now = Date.now();
    const expired = gameState.bounties.filter(b => b.expiresAt <= now);

    // Refund expired bounties to posters
    expired.forEach(b => {
        const poster = gameState.players.get(b.posterId);
        if (poster) {
            poster.money = (poster.money || 0) + b.reward;
            const ps = gameState.playerStates.get(b.posterId);
            if (ps) { ps.money = poster.money; ps.lastUpdate = Date.now(); }
            console.log(` Bounty on ${b.targetName} expired — refunded $${b.reward} to ${poster.name}`);
        }
    });

    if (expired.length > 0) {
        gameState.bounties = gameState.bounties.filter(b => b.expiresAt > now);
    }
}

// ==================== PHASE C: RANKED SEASON & ELO ====================
// ELO-based combat rating with rank tiers. Seasons last 30 days.

const ELO_K = 32;
const ELO_TIERS = [
    { name: 'Bronze', min: 0, icon: '' },
    { name: 'Silver', min: 1000, icon: '' },
    { name: 'Gold', min: 1500, icon: '' },
    { name: 'Diamond', min: 2000, icon: '' },
    { name: 'Kingpin', min: 2500, icon: '' }
];

function getOrCreateRating(playerId) {
    if (!gameState.season.ratings.has(playerId)) {
        gameState.season.ratings.set(playerId, { elo: 1000, tier: 'Bronze', wins: 0, losses: 0 });
    }
    return gameState.season.ratings.get(playerId);
}

function getEloTier(elo) {
    for (let i = ELO_TIERS.length - 1; i >= 0; i--) {
        if (elo >= ELO_TIERS[i].min) return ELO_TIERS[i];
    }
    return ELO_TIERS[0];
}

function updateElo(winnerId, loserId, isRanked) {
    if (!isRanked) return;

    const winnerRating = getOrCreateRating(winnerId);
    const loserRating = getOrCreateRating(loserId);

    // Standard ELO calculation
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating.elo - winnerRating.elo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating.elo - loserRating.elo) / 400));

    winnerRating.elo = Math.max(0, Math.round(winnerRating.elo + ELO_K * (1 - expectedWinner)));
    loserRating.elo = Math.max(0, Math.round(loserRating.elo + ELO_K * (0 - expectedLoser)));

    winnerRating.wins++;
    loserRating.losses++;

    // Update tiers
    winnerRating.tier = getEloTier(winnerRating.elo).name;
    loserRating.tier = getEloTier(loserRating.elo).name;
}

function getEloChange(playerId) {
    const rating = gameState.season.ratings.get(playerId);
    if (!rating) return null;
    const tier = getEloTier(rating.elo);
    return { elo: rating.elo, tier: tier.name, icon: tier.icon };
}

function handleSeasonInfo(clientId, message) {
    const ws = clients.get(clientId);
    if (!ws || ws.readyState !== 1) return;

    checkSeasonRotation();

    const myRating = getOrCreateRating(clientId);
    const myTier = getEloTier(myRating.elo);

    // Build top players by ELO
    const topRatings = [];
    for (const [pId, r] of gameState.season.ratings) {
        const p = gameState.players.get(pId);
        if (p) {
            const t = getEloTier(r.elo);
            topRatings.push({ name: p.name, elo: r.elo, tier: t.name, icon: t.icon, wins: r.wins, losses: r.losses });
        }
    }
    topRatings.sort((a, b) => b.elo - a.elo);

    ws.send(JSON.stringify({
        type: 'season_info_result',
        season: {
            number: gameState.season.number,
            startedAt: gameState.season.startedAt,
            endsAt: gameState.season.endsAt,
            timeLeft: Math.max(0, gameState.season.endsAt - Date.now())
        },
        myRating: { elo: myRating.elo, tier: myTier.name, icon: myTier.icon, wins: myRating.wins, losses: myRating.losses },
        topPlayers: topRatings.slice(0, 10)
    }));
}

function checkSeasonRotation() {
    if (Date.now() < gameState.season.endsAt) return;

    // Season over — record results and start new season
    console.log(` Season ${gameState.season.number} ended!`);

    // Broadcast season end
    const topRatings = [];
    for (const [pId, r] of gameState.season.ratings) {
        const p = gameState.players.get(pId);
        if (p) topRatings.push({ name: p.name, elo: r.elo, tier: getEloTier(r.elo).name });
    }
    topRatings.sort((a, b) => b.elo - a.elo);
    const champion = topRatings[0];

    if (champion) {
        addGlobalChatMessage('System', ` Season ${gameState.season.number} is over! Champion: ${champion.name} (${champion.elo} ELO, ${champion.tier})!`, '#ffd700');
    }

    // Soft reset: regress all ELOs toward 1200
    for (const [, r] of gameState.season.ratings) {
        r.elo = Math.round(r.elo * 0.6 + 1200 * 0.4); // Weighted toward 1200
        r.wins = 0;
        r.losses = 0;
        r.tier = getEloTier(r.elo).name;
    }

    gameState.season.number++;
    gameState.season.startedAt = Date.now();
    gameState.season.endsAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

    broadcastToAll({
        type: 'season_reset',
        seasonNumber: gameState.season.number,
        champion: champion || null
    });

    scheduleWorldSave();
}

// ==================== PHASE C: TERRITORY SIEGE & FORTIFICATION ====================
// Enhanced territory control: fortify territories, multi-phase siege attacks.

const FORTIFY_COST_PER_POINT = 500; // $500 per defense point
const FORTIFY_MAX = 200; // Max fortification bonus
const SIEGE_ENERGY_COST = 60;
const SIEGE_MONEY_COST = 5000;
const SIEGE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const siegeCooldowns = new Map();

function handleSiegeDeclare(clientId, message) {
    const attacker = gameState.players.get(clientId);
    const attackerState = gameState.playerStates.get(clientId);
    if (!attacker || !attackerState) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'siege_result', success: false, error: err })); };

    // Cooldown
    const lastSiege = siegeCooldowns.get(clientId) || 0;
    const now = Date.now();
    if (now - lastSiege < SIEGE_COOLDOWN_MS) {
        const remaining = Math.ceil((SIEGE_COOLDOWN_MS - (now - lastSiege)) / 60000);
        return fail(`Siege cooldown — wait ${remaining} more minute(s).`);
    }

    const districtId = message.district;
    if (!districtId || !TERRITORY_IDS.includes(districtId)) return fail('Invalid district.');
    const terr = gameState.territories[districtId];
    if (!terr) return fail('Territory data missing.');
    if (!terr.owner) return fail('No owner — claim it instead.');
    if (terr.owner === attacker.name) return fail('You own this territory.');

    // Jail check
    if (attackerState.inJail) return fail('Can\'t siege from jail.');

    // Resource checks
    if ((attackerState.energy || 0) < SIEGE_ENERGY_COST) return fail(`Not enough energy (${SIEGE_ENERGY_COST} required).`);
    if ((attacker.money || 0) < SIEGE_MONEY_COST) return fail(`Siege costs $${SIEGE_MONEY_COST.toLocaleString()}.`);

    const gangMembers = Math.max(0, Math.min(message.gangMembers || 0, 100));
    const attackPower = Math.max(0, Math.min(message.power || 0, 5000));
    if (gangMembers < 8) return fail('Need at least 8 gang members for a siege.');

    // Deduct resources
    attackerState.energy = Math.max(0, (attackerState.energy || 100) - SIEGE_ENERGY_COST);
    attacker.money -= SIEGE_MONEY_COST;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = attacker.money; ps.lastUpdate = Date.now(); }

    siegeCooldowns.set(clientId, now);

    // === MULTI-PHASE SIEGE CALCULATION ===
    // Phase 1: Breach (attacker power vs fortification)
    const fortScore = (terr.defenseRating || 100) + (terr.fortification || 0);
    const breachPower = attackPower + (gangMembers * 12) + Math.floor(Math.random() * 150);
    const breachSuccess = breachPower > fortScore;

    if (!breachSuccess) {
        // Siege repelled at the walls
        const repLoss = 8 + Math.floor(Math.random() * 8);
        attacker.reputation = Math.max(0, (attacker.reputation || 0) - repLoss);
        if (ps) ps.reputation = attacker.reputation;

        const healthDmg = 20 + Math.floor(Math.random() * 20);
        attackerState.health = Math.max(1, (attackerState.health || 100) - healthDmg);
        attackerState.wantedLevel = Math.min(100, (attackerState.wantedLevel || 0) + 15);

        // Fortification slightly damaged even on defense success
        terr.fortification = Math.max(0, (terr.fortification || 0) - 10);

        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: 'siege_result', success: true, victory: false, phase: 'breach_failed',
                district: districtId, owner: terr.owner, repLoss, healthDamage: healthDmg,
                energy: attackerState.energy, money: attacker.money
            }));
        }

        // Notify defender
        notifySiegeDefender(terr.owner, districtId, attacker.name, false);

        addGlobalChatMessage('System', ` ${attacker.name}'s siege on ${districtId.replace(/_/g, ' ')} was repelled!`, '#27ae60');
        broadcastPlayerStates();
        scheduleWorldSave();
        return;
    }

    // Phase 2: Assault (attacker vs defender combat strength)
    let defenseScore = (terr.defenseRating || 100);
    let defenderId = null;
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === terr.owner) {
            defenderId = id;
            const defState = gameState.playerStates.get(id);
            defenseScore += (p.level || 1) * 15;
            defenseScore += Math.floor((p.reputation || 0) * 0.5);
            break;
        }
    }
    if (!defenderId) defenseScore += 150; // Offline bonus

    // Alliance defense bonus during siege
    if (defenderId) {
        const defAlliance = findPlayerAlliance(defenderId);
        if (defAlliance) {
            const onlineAllies = defAlliance.members.filter(mId => mId !== defenderId && clients.has(mId));
            defenseScore += onlineAllies.length * 50; // Each online ally adds +50 defense
        }
    }

    const assaultScore = attackPower + (gangMembers * 15) + (attacker.level || 1) * 8 + Math.floor(Math.random() * 200);
    defenseScore += Math.floor(Math.random() * 200);
    const siegeVictory = assaultScore > defenseScore;

    // Casualties
    let membersLost = 0;
    const casualtyRate = siegeVictory ? 0.15 : 0.35;
    for (let i = 0; i < gangMembers; i++) {
        if (Math.random() < casualtyRate) membersLost++;
    }

    const healthDmg = siegeVictory
        ? 15 + Math.floor(Math.random() * 20)
        : 30 + Math.floor(Math.random() * 30);
    attackerState.health = Math.max(1, (attackerState.health || 100) - healthDmg);
    attackerState.wantedLevel = Math.min(100, (attackerState.wantedLevel || 0) + (siegeVictory ? 25 : 15));

    if (siegeVictory) {
        const oldOwner = terr.owner;
        terr.owner = attacker.name;
        terr.defenseRating = Math.max(50, (terr.defenseRating || 100) - 30);
        terr.fortification = Math.max(0, (terr.fortification || 0) - Math.floor((terr.fortification || 0) * 0.5));

        const repGain = 20 + Math.floor(Math.random() * 15);
        attacker.reputation = (attacker.reputation || 0) + repGain;
        if (ps) ps.reputation = attacker.reputation;

        // Update ELO if both players are online
        if (defenderId) updateElo(clientId, defenderId, true);

        console.log(` SIEGE SUCCESS: ${attacker.name} conquered ${districtId} from ${oldOwner}`);

        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: 'siege_result', success: true, victory: true, phase: 'conquered',
                district: districtId, oldOwner, repGain, membersLost, healthDamage: healthDmg,
                energy: attackerState.energy, money: attacker.money,
                territories: gameState.territories
            }));
        }

        notifySiegeDefender(oldOwner, districtId, attacker.name, true);

        broadcastToAll({
            type: 'territory_ownership_changed',
            territories: gameState.territories,
            attacker: attacker.name, defender: oldOwner, seized: [districtId], method: 'siege'
        });

        addGlobalChatMessage('System', ` ${attacker.name} laid siege to ${districtId.replace(/_/g, ' ')} and conquered it from ${oldOwner}!`, '#8b0000');
        recalcTopDon();
    } else {
        terr.defenseRating = Math.min(300, (terr.defenseRating || 100) + 15);

        const repLoss = 10 + Math.floor(Math.random() * 10);
        attacker.reputation = Math.max(0, (attacker.reputation || 0) - repLoss);
        if (ps) ps.reputation = attacker.reputation;

        // 40% arrest chance on siege failure
        let jailed = false, jailTime = 0;
        if (Math.random() < 0.40) {
            jailTime = 20 + Math.floor(Math.random() * 25);
            attackerState.inJail = true;
            attackerState.jailTime = jailTime;
            jailed = true;
        }

        console.log(` SIEGE FAILED: ${attacker.name} failed to siege ${districtId}${jailed ? ' — ARRESTED' : ''}`);

        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                type: 'siege_result', success: true, victory: false, phase: 'assault_failed',
                district: districtId, owner: terr.owner, repLoss, membersLost, healthDamage: healthDmg,
                energy: attackerState.energy, money: attacker.money, jailed, jailTime
            }));
        }

        notifySiegeDefender(terr.owner, districtId, attacker.name, false);

        addGlobalChatMessage('System', ` ${attacker.name}'s siege on ${districtId.replace(/_/g, ' ')} failed!${jailed ? ' Arrested!' : ''}`, '#e74c3c');
    }

    broadcastPlayerStates();
    scheduleWorldSave();
}

function notifySiegeDefender(ownerName, districtId, attackerName, lost) {
    for (const [id, p] of gameState.players.entries()) {
        if (p.name === ownerName) {
            const defWs = clients.get(id);
            if (defWs && defWs.readyState === 1) {
                defWs.send(JSON.stringify({
                    type: lost ? 'territory_war_defense_lost' : 'territory_war_defense_held',
                    district: districtId,
                    attackerName: attackerName,
                    method: 'siege',
                    territories: lost ? gameState.territories : undefined
                }));
            }
            break;
        }
    }
}

function handleSiegeFortify(clientId, message) {
    const player = gameState.players.get(clientId);
    if (!player) return;
    const ws = clients.get(clientId);
    const fail = (err) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'fortify_result', success: false, error: err })); };

    const districtId = message.district;
    if (!districtId || !TERRITORY_IDS.includes(districtId)) return fail('Invalid district.');
    const terr = gameState.territories[districtId];
    if (!terr) return fail('Territory data missing.');
    if (terr.owner !== player.name) return fail('You don\'t own this territory.');

    const points = Math.max(1, Math.min(parseInt(message.points) || 1, 50)); // Max 50 points at once
    const currentFort = terr.fortification || 0;
    if (currentFort >= FORTIFY_MAX) return fail(`Territory already at maximum fortification (${FORTIFY_MAX}).`);

    const actualPoints = Math.min(points, FORTIFY_MAX - currentFort);
    const cost = actualPoints * FORTIFY_COST_PER_POINT;
    if ((player.money || 0) < cost) return fail(`Not enough cash. ${actualPoints} points costs $${cost.toLocaleString()}.`);

    player.money -= cost;
    terr.fortification = currentFort + actualPoints;
    const ps = gameState.playerStates.get(clientId);
    if (ps) { ps.money = player.money; ps.lastUpdate = Date.now(); }

    console.log(` ${player.name} fortified ${districtId} +${actualPoints} (now ${terr.fortification})`);

    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
            type: 'fortify_result', success: true,
            district: districtId, fortification: terr.fortification,
            cost: cost, money: player.money
        }));
    }

    scheduleWorldSave();
}

// ==================== VEHICLE MARKETPLACE HANDLERS ====================

function handleMarketplaceList(clientId, message) {
    const seller = gameState.players.get(clientId);
    const ws = clients.get(clientId);
    if (!seller || !ws) return;
    
    const fail = (err) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'marketplace_error', error: err }));
        }
    };
    
    const vehicleName = message.vehicleName;
    const price = parseInt(message.price);
    if (!vehicleName || !price || price < 100) return fail('Invalid listing. Set a price of at least $100.');
    if (price > (message.baseValue || 500000) * 3) return fail('Price too high. Max 3x base value.');
    
    // Limit active listings per player to 5
    const existingListings = gameState.marketplace.filter(l => l.sellerId === clientId);
    if (existingListings.length >= 5) return fail('Max 5 active listings at a time.');
    
    const listing = {
        id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sellerId: clientId,
        sellerName: seller.name,
        vehicleName: vehicleName,
        baseValue: message.baseValue || 0,
        currentValue: message.currentValue || 0,
        damagePercentage: message.damagePercentage || 0,
        image: message.image || `vehicles/${vehicleName}.png`,
        usageCount: message.usageCount || 0,
        vehicleIndex: message.vehicleIndex,
        price: price,
        listedAt: Date.now()
    };
    
    gameState.marketplace.push(listing);
    
    console.log(` ${seller.name} listed ${vehicleName} for $${price.toLocaleString()}`);
    
    // Confirm to seller
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'marketplace_listed',
            vehicleName: vehicleName,
            price: price,
            listings: gameState.marketplace
        }));
    }
    
    // Broadcast to all connected players
    addGlobalChatMessage('System', ` ${seller.name} listed a ${vehicleName} for $${price.toLocaleString()} on the marketplace!`, '#a08850');
}

function handleMarketplaceBuy(clientId, message) {
    const buyer = gameState.players.get(clientId);
    const ws = clients.get(clientId);
    if (!buyer || !ws) return;
    
    const fail = (err) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'marketplace_error', error: err }));
        }
    };
    
    const listingId = message.listingId;
    const listingIdx = gameState.marketplace.findIndex(l => l.id === listingId);
    if (listingIdx === -1) return fail('Listing no longer available.');
    
    const listing = gameState.marketplace[listingIdx];
    
    if (listing.sellerId === clientId) return fail('You can\'t buy your own listing!');
    if ((buyer.money || 0) < listing.price) return fail('Not enough money.');
    
    // Process the transaction
    const marketFeeRate = (gameState.politics.policies.marketFee || 5) / 100;
    const feeAmount = Math.floor(listing.price * marketFeeRate);
    const sellerReceives = listing.price - feeAmount;
    buyer.money -= listing.price;
    
    // Give money to seller (minus market fee)
    const sellerPlayer = gameState.players.get(listing.sellerId);
    if (sellerPlayer) {
        sellerPlayer.money = (sellerPlayer.money || 0) + sellerReceives;
        const sellerState = gameState.playerStates.get(listing.sellerId);
        if (sellerState) { sellerState.money = sellerPlayer.money; sellerState.lastUpdate = Date.now(); }
    }
    
    // Update buyer state
    const buyerState = gameState.playerStates.get(clientId);
    if (buyerState) { buyerState.money = buyer.money; buyerState.lastUpdate = Date.now(); }
    
    // Remove the listing
    gameState.marketplace.splice(listingIdx, 1);
    
    console.log(` ${buyer.name} bought ${listing.vehicleName} from ${listing.sellerName} for $${listing.price.toLocaleString()}`);
    
    // Notify buyer — vehicle transfer
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'marketplace_purchased',
            vehicle: {
                vehicleName: listing.vehicleName,
                baseValue: listing.baseValue,
                currentValue: listing.currentValue,
                damagePercentage: listing.damagePercentage,
                image: listing.image,
                usageCount: listing.usageCount
            },
            sellerName: listing.sellerName,
            amount: listing.price,
            listings: gameState.marketplace
        }));
    }
    
    // Notify seller
    const sellerWs = clients.get(listing.sellerId);
    if (sellerWs && sellerWs.readyState === WebSocket.OPEN) {
        sellerWs.send(JSON.stringify({
            type: 'marketplace_sold',
            vehicleName: listing.vehicleName,
            buyerName: buyer.name,
            amount: listing.price,
            listings: gameState.marketplace
        }));
    }
    
    addGlobalChatMessage('System', ` ${buyer.name} bought ${listing.vehicleName} from ${listing.sellerName} for $${listing.price.toLocaleString()}!`, '#27ae60');
    scheduleWorldSave();
}

function handleMarketplaceCancel(clientId, message) {
    const player = gameState.players.get(clientId);
    const ws = clients.get(clientId);
    if (!player || !ws) return;
    
    const fail = (err) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'marketplace_error', error: err }));
        }
    };
    
    const listingId = message.listingId;
    const listingIdx = gameState.marketplace.findIndex(l => l.id === listingId && l.sellerId === clientId);
    if (listingIdx === -1) return fail('Listing not found or not yours.');
    
    const listing = gameState.marketplace[listingIdx];
    gameState.marketplace.splice(listingIdx, 1);
    
    console.log(` ${player.name} cancelled listing for ${listing.vehicleName}`);
    
    // Return vehicle to seller
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'marketplace_cancelled',
            vehicle: {
                vehicleName: listing.vehicleName,
                baseValue: listing.baseValue,
                currentValue: listing.currentValue,
                damagePercentage: listing.damagePercentage,
                image: listing.image,
                usageCount: listing.usageCount
            },
            listings: gameState.marketplace
        }));
    }
}

function handleMarketplaceGetListings(clientId) {
    const ws = clients.get(clientId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    // Clean up expired listings (older than 24 hours)
    const now = Date.now();
    const expiry = 24 * 60 * 60 * 1000; // 24 hours
    gameState.marketplace = gameState.marketplace.filter(l => (now - l.listedAt) < expiry);
    
    ws.send(JSON.stringify({
        type: 'marketplace_listings',
        listings: gameState.marketplace
    }));
}

function generateLeaderboard() {
    const players = Array.from(gameState.players.values());

    // Reputation leaders (primary ranking)
    const byReputation = players
        .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
        .slice(0, 10)
        .map(p => ({ name: p.name, reputation: p.reputation || 0, territory: p.territory || 0 }));

    // Wealthiest players
    const byWealth = players
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 10)
        .map(p => ({ name: p.name, money: p.money || 0 }));

    // Top fighters (by PvP wins)
    const byPvpWins = players
        .filter(p => (p.pvpWins || 0) > 0)
        .sort((a, b) => (b.pvpWins || 0) - (a.pvpWins || 0))
        .slice(0, 10)
        .map(p => ({ name: p.name, pvpWins: p.pvpWins || 0, pvpLosses: p.pvpLosses || 0 }));

    // Territory lords (most territories owned)
    const territoryOwners = {};
    for (const [tId, tData] of Object.entries(gameState.territories || {})) {
        if (tData.owner) {
            territoryOwners[tData.owner] = (territoryOwners[tData.owner] || 0) + 1;
        }
    }
    const byTerritories = Object.entries(territoryOwners)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, territories: count }));

    // ELO ranked leaders (Season)
    const byElo = [];
    for (const [pId, r] of gameState.season.ratings) {
        const p = gameState.players.get(pId);
        if (p && (r.wins + r.losses) > 0) {
            const t = getEloTier(r.elo);
            byElo.push({ name: p.name, elo: r.elo, tier: t.name, icon: t.icon, wins: r.wins, losses: r.losses });
        }
    }
    byElo.sort((a, b) => b.elo - a.elo);

    return {
        reputation: byReputation,
        wealth: byWealth,
        combat: byPvpWins,
        territories: byTerritories,
        ranked: byElo.slice(0, 10)
    };
}

// Helper to generate client ID
function generateClientId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    // Initialize jail bots on startup
    updateJailBots();
    console.log(` Jail bots initialized: ${gameState.jailBots.length} inmates`);
    // Calculate Top Don on startup based on existing territories
    recalcTopDon();
    if (gameState.politics.topDonName) {
        console.log(` Top Don: ${gameState.politics.topDonName} (${gameState.politics.territoryCount} territories)`);
    }
});

// ==================== GRACEFUL SHUTDOWN ====================
// Handle server shutdown to save world state
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('\n Server shutting down gracefully...');
    
    // Flush any pending world state changes
    try {
        flushWorldState();
        userDB.flushDB();
        console.log(' World state & user DB flushed to disk');
    } catch (err) {
        console.error(' Error flushing data:', err.message);
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
        console.log(' Server shut down successfully');
        process.exit(0);
    });
    
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
        console.error(' Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}
