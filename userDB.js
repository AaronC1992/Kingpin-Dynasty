// ==================== USER DATABASE - JSON FILE PERSISTENCE ====================
// Simple JSON-file based user storage for accounts & cloud saves.
// Same pattern as worldPersistence.js — swap for a real DB for production scale.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'users.json');
const SAVE_THROTTLE_MS = 3000;

let db = { users: {} };
let saveTimer = null;
let isDirty = false;

// ── Bootstrap ──────────────────────────────────────────────────
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(raw);
            if (!db.users) db.users = {};
            console.log(`✅ User DB loaded — ${Object.keys(db.users).length} accounts`);
        } else {
            db = { users: {} };
            saveDBImmediate();
            console.log('📄 Created new user DB');
        }
    } catch (err) {
        console.error('❌ Failed to load user DB:', err.message);
        db = { users: {} };
    }
}

function saveDB() {
    isDirty = true;
    if (!saveTimer) {
        saveTimer = setTimeout(() => {
            saveTimer = null;
            if (isDirty) saveDBImmediate();
        }, SAVE_THROTTLE_MS);
    }
}

function saveDBImmediate() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
        isDirty = false;
    } catch (err) {
        console.error('❌ Failed to save user DB:', err.message);
    }
}

function flushDB() {
    if (isDirty) saveDBImmediate();
}

// ── Password hashing (PBKDF2 — no external deps) ──────────────
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return check === hash;
}

// ── Session tokens ─────────────────────────────────────────────
const sessions = new Map(); // token -> { username, expiresAt }
const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function createSession(username) {
    // Invalidate any existing sessions for this user
    for (const [tok, sess] of sessions) {
        if (sess.username === username) sessions.delete(tok);
    }
    const token = generateToken();
    sessions.set(token, {
        username,
        expiresAt: Date.now() + TOKEN_LIFETIME_MS
    });
    return token;
}

function validateToken(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    return session.username;
}

function destroySession(token) {
    sessions.delete(token);
}

// Periodically clean expired sessions (every 30 min)
setInterval(() => {
    const now = Date.now();
    for (const [tok, sess] of sessions) {
        if (now > sess.expiresAt) sessions.delete(tok);
    }
}, 30 * 60 * 1000);

// ── User CRUD ──────────────────────────────────────────────────
function createUser(username, password) {
    const key = username.toLowerCase();
    if (db.users[key]) return { ok: false, error: 'Username already taken' };
    if (username.length < 3 || username.length > 20) return { ok: false, error: 'Username must be 3-20 characters' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { ok: false, error: 'Username can only contain letters, numbers, and underscores' };

    db.users[key] = {
        username: username,           // preserve original casing
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        saveData: null                // cloud save slot
    };
    saveDB();
    return { ok: true };
}

function authenticateUser(username, password) {
    const key = username.toLowerCase();
    const user = db.users[key];
    if (!user) return { ok: false, error: 'Invalid username or password' };
    if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: 'Invalid username or password' };

    user.lastLogin = new Date().toISOString();
    saveDB();
    return { ok: true, username: user.username };
}

function getUserSave(username) {
    const key = username.toLowerCase();
    const user = db.users[key];
    if (!user) return null;
    return user.saveData;
}

function setUserSave(username, saveData) {
    const key = username.toLowerCase();
    const user = db.users[key];
    if (!user) return false;
    user.saveData = saveData;
    saveDB();
    return true;
}

function changePassword(username, oldPassword, newPassword) {
    const key = username.toLowerCase();
    const user = db.users[key];
    if (!user) return { ok: false, error: 'User not found' };
    if (!verifyPassword(oldPassword, user.passwordHash)) return { ok: false, error: 'Current password is incorrect' };
    if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters' };

    user.passwordHash = hashPassword(newPassword);
    saveDB();
    return { ok: true };
}

function deleteUser(username) {
    const key = username.toLowerCase();
    if (!db.users[key]) return false;
    delete db.users[key];
    saveDB();
    return true;
}

function getUserInfo(username) {
    const key = username.toLowerCase();
    const user = db.users[key];
    if (!user) return null;
    return {
        username: user.username,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        hasSave: !!user.saveData,
        saveDate: user.saveData ? user.saveData.saveDate : null,
        playerName: user.saveData ? (user.saveData.playerName || null) : null,
        playerLevel: user.saveData ? (user.saveData.level || null) : null
    };
}

// ── Initialize on require ──────────────────────────────────────
loadDB();

module.exports = {
    createUser,
    authenticateUser,
    getUserSave,
    setUserSave,
    changePassword,
    deleteUser,
    getUserInfo,
    createSession,
    validateToken,
    destroySession,
    flushDB
};
