// ==================== AUTH & CLOUD SAVE CLIENT ====================
// Handles login, registration, cloud saves, and account UI.
// Imported as ES module by game.js.

// ── Server URL (same host as multiplayer WS, but HTTP) ─────────
const AUTH_API_BASE = (function () {
    try {
        if (window.__MULTIPLAYER_SERVER_URL__) {
            return window.__MULTIPLAYER_SERVER_URL__.replace(/^ws/, 'http').replace(/\/$/, '');
        }
        const h = window.location.hostname;
        const isLocal = h === 'localhost' || h === '127.0.0.1';
        if (isLocal) return 'http://localhost:3000';
        return 'https://mafia-born.onrender.com';
    } catch {
        return 'https://mafia-born.onrender.com';
    }
})();

// ── Local state ────────────────────────────────────────────────
let authToken = localStorage.getItem('mb_auth_token') || null;
let authUsername = localStorage.getItem('mb_auth_user') || null;
let isLoggedIn = !!authToken;

// ── API helpers ────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const url = `${AUTH_API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    try {
        const resp = await fetch(url, {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
        return data;
    } catch (err) {
        // If auth is expired, clear session
        if (err.message === 'Not authenticated') {
            clearLocalAuth();
        }
        throw err;
    }
}

// ── Auth actions ───────────────────────────────────────────────
export async function register(username, password) {
    const data = await apiFetch('/api/register', {
        method: 'POST',
        body: { username, password }
    });
    setLocalAuth(data.token, data.username);
    return data;
}

export async function login(username, password) {
    const data = await apiFetch('/api/login', {
        method: 'POST',
        body: { username, password }
    });
    setLocalAuth(data.token, data.username);
    return data;
}

export async function logout() {
    try {
        await apiFetch('/api/logout', { method: 'POST' });
    } catch { /* ignore */ }
    clearLocalAuth();
}

export async function getProfile() {
    return apiFetch('/api/profile', { method: 'GET' });
}

export async function changePassword(oldPassword, newPassword) {
    return apiFetch('/api/change-password', {
        method: 'POST',
        body: { oldPassword, newPassword }
    });
}

export async function deleteAccount() {
    await apiFetch('/api/account', { method: 'DELETE' });
    clearLocalAuth();
}

// ── Cloud save / load ──────────────────────────────────────────
export async function cloudSave(saveEntry) {
    return apiFetch('/api/save', {
        method: 'POST',
        body: {
            playerName: saveEntry.playerName,
            level: saveEntry.level,
            money: saveEntry.money,
            reputation: saveEntry.reputation,
            empireRating: saveEntry.empireRating,
            playtime: saveEntry.playtime,
            gameVersion: saveEntry.gameVersion,
            data: saveEntry.data
        }
    });
}

export async function cloudLoad() {
    return apiFetch('/api/load', { method: 'GET' });
}

// ── Token management ───────────────────────────────────────────
function setLocalAuth(token, username) {
    authToken = token;
    authUsername = username;
    isLoggedIn = true;
    localStorage.setItem('mb_auth_token', token);
    localStorage.setItem('mb_auth_user', username);
}

function clearLocalAuth() {
    authToken = null;
    authUsername = null;
    isLoggedIn = false;
    localStorage.removeItem('mb_auth_token');
    localStorage.removeItem('mb_auth_user');
}

export function getAuthState() {
    return { isLoggedIn, username: authUsername, token: authToken };
}

// ── Verify saved token still valid on startup ──────────────────
export async function verifySession() {
    if (!authToken) return false;
    try {
        const info = await getProfile();
        authUsername = info.username;
        isLoggedIn = true;
        return true;
    } catch {
        clearLocalAuth();
        return false;
    }
}

// ── UI: Auth modal ─────────────────────────────────────────────
// options: { required: bool, onAuth: fn, startOnRegister: bool }
export function showAuthModal(onSuccessOrOpts) {
    let onSuccess = null;
    let required = false;
    let startOnRegister = false;
    if (typeof onSuccessOrOpts === 'function') {
        onSuccess = onSuccessOrOpts;
    } else if (onSuccessOrOpts && typeof onSuccessOrOpts === 'object') {
        onSuccess = onSuccessOrOpts.onAuth || null;
        required = !!onSuccessOrOpts.required;
        startOnRegister = !!onSuccessOrOpts.startOnRegister;
    }

    // Remove existing
    const old = document.getElementById('auth-modal-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'auth-modal-overlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
        <div class="auth-modal">
            <button class="auth-close" id="auth-close-btn" ${required ? 'style="display:none;"' : ''}>&times;</button>
            <h2 class="auth-title" id="auth-modal-title">${startOnRegister ? '📝 Create Account' : '🔐 Sign In'}</h2>
            <p class="auth-subtitle" id="auth-modal-subtitle">${required ? 'An account is required to play' : 'Play across all your devices'}</p>
            
            <div id="auth-form-area">
                <div class="auth-field">
                    <label for="auth-username">Username</label>
                    <input type="text" id="auth-username" placeholder="Enter username" maxlength="20" autocomplete="username" />
                </div>
                <div class="auth-field">
                    <label for="auth-password">Password</label>
                    <input type="password" id="auth-password" placeholder="Enter password" maxlength="64" autocomplete="current-password" />
                </div>
                <div class="auth-field" id="auth-confirm-field" style="display:${startOnRegister ? 'block' : 'none'};">
                    <label for="auth-confirm">Confirm Password</label>
                    <input type="password" id="auth-confirm" placeholder="Confirm password" maxlength="64" autocomplete="new-password" />
                </div>
                <p class="auth-error" id="auth-error"></p>
                <button class="auth-btn auth-btn-primary" id="auth-submit-btn">${startOnRegister ? 'Create Account' : 'Sign In'}</button>
                <p class="auth-toggle" id="auth-toggle">${startOnRegister ? 'Already have an account? <span class="auth-link" id="auth-switch-link">Sign in</span>' : 'Don\'t have an account? <span class="auth-link" id="auth-switch-link">Create one</span>'}</p>
            </div>

            <div id="auth-logged-in-area" style="display:none;">
                <div class="auth-profile-info">
                    <p>✅ Signed in as <strong id="auth-display-name"></strong></p>
                    <p class="auth-save-info" id="auth-save-info"></p>
                </div>
                <button class="auth-btn auth-btn-primary" id="auth-cloud-save-btn">☁️ Save to Cloud</button>
                <button class="auth-btn auth-btn-secondary" id="auth-cloud-load-btn">📥 Load from Cloud</button>
                <button class="auth-btn auth-btn-danger" id="auth-logout-btn">Sign Out</button>
                <hr style="border-color: #333; margin: 15px 0;">
                <button class="auth-btn auth-btn-danger" id="auth-delete-account-btn" style="border-color: #ff2222; margin-top: 5px;">🗑️ Delete Account & Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // State
    let isRegisterMode = !!startOnRegister;

    const closeBtn = document.getElementById('auth-close-btn');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchLink = document.getElementById('auth-switch-link');
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const confirmInput = document.getElementById('auth-confirm');
    const confirmField = document.getElementById('auth-confirm-field');
    const errorEl = document.getElementById('auth-error');
    const titleEl = document.getElementById('auth-modal-title');
    const subtitleEl = document.getElementById('auth-modal-subtitle');
    const toggleEl = document.getElementById('auth-toggle');
    const formArea = document.getElementById('auth-form-area');
    const loggedInArea = document.getElementById('auth-logged-in-area');

    const close = () => overlay.remove();

    if (!required) {
        closeBtn.onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }

    // If already logged in, show account panel
    if (isLoggedIn) {
        showLoggedInPanel();
        return;
    }

    // Toggle login / register
    switchLink.onclick = () => {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            titleEl.textContent = '📝 Create Account';
            subtitleEl.textContent = 'Save your progress across devices';
            submitBtn.textContent = 'Create Account';
            confirmField.style.display = 'block';
            toggleEl.innerHTML = 'Already have an account? <span class="auth-link" id="auth-switch-link">Sign in</span>';
        } else {
            titleEl.textContent = '🔐 Sign In';
            subtitleEl.textContent = 'Play across all your devices';
            submitBtn.textContent = 'Sign In';
            confirmField.style.display = 'none';
            toggleEl.innerHTML = 'Don\'t have an account? <span class="auth-link" id="auth-switch-link">Create one</span>';
        }
        errorEl.textContent = '';
        document.getElementById('auth-switch-link').onclick = switchLink.onclick;
    };

    // Submit
    submitBtn.onclick = async () => {
        errorEl.textContent = '';
        const user = usernameInput.value.trim();
        const pass = passwordInput.value;

        if (!user || !pass) {
            errorEl.textContent = 'Please fill in all fields';
            return;
        }

        if (isRegisterMode) {
            if (pass !== confirmInput.value) {
                errorEl.textContent = 'Passwords do not match';
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isRegisterMode ? 'Creating...' : 'Signing in...';

        try {
            if (isRegisterMode) {
                await register(user, pass);
            } else {
                await login(user, pass);
            }
            updateAuthStatusUI();

            // After a LOGIN (not register), try to auto-load the cloud save
            if (!isRegisterMode) {
                try {
                    const save = await cloudLoad();
                    if (save && save.data && typeof window.applyCloudSave === 'function') {
                        window.applyCloudSave(save);
                        if (typeof window.showBriefNotification === 'function') {
                            window.showBriefNotification('☁️ Cloud save loaded!', 'success');
                        }
                        close();
                        return; // skip onSuccess — save was loaded, game is running
                    }
                } catch (e) {
                    console.warn('[auth] No cloud save to auto-load:', e.message);
                }
            }

            if (required && onSuccess) {
                // Required-mode: close modal and fire callback immediately
                close();
                onSuccess();
            } else {
                showLoggedInPanel();
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            errorEl.textContent = err.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isRegisterMode ? 'Create Account' : 'Sign In';
        }
    };

    // Enter key submits
    const enterHandler = (e) => { if (e.key === 'Enter') submitBtn.onclick(); };
    usernameInput.addEventListener('keydown', enterHandler);
    passwordInput.addEventListener('keydown', enterHandler);
    confirmInput.addEventListener('keydown', enterHandler);

    // -- Logged-in panel --
    async function showLoggedInPanel() {
        formArea.style.display = 'none';
        loggedInArea.style.display = 'block';
        titleEl.textContent = '☁️ Cloud Account';
        subtitleEl.textContent = 'Manage your cloud saves';

        document.getElementById('auth-display-name').textContent = authUsername;

        // Fetch profile for save info
        try {
            const profile = await getProfile();
            const info = document.getElementById('auth-save-info');
            if (profile.hasSave) {
                const d = new Date(profile.saveDate);
                info.textContent = `Cloud save: ${profile.playerName || 'Unknown'} (Lvl ${profile.playerLevel || '?'}) — ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
            } else {
                info.textContent = 'No cloud save yet';
            }
        } catch {
            document.getElementById('auth-save-info').textContent = 'Could not fetch save info';
        }

        // Cloud Save button
        document.getElementById('auth-cloud-save-btn').onclick = async () => {
            const btn = document.getElementById('auth-cloud-save-btn');
            btn.disabled = true;
            btn.textContent = '☁️ Saving...';
            try {
                // Access the global save data creator from game.js
                if (typeof window.createSaveDataForCloud === 'function') {
                    const saveEntry = window.createSaveDataForCloud();
                    await cloudSave(saveEntry);
                    btn.textContent = '✅ Saved!';
                    if (typeof window.showBriefNotification === 'function') {
                        window.showBriefNotification('☁️ Progress saved to cloud!', 'success');
                    }
                    // Refresh save info
                    showLoggedInPanel();
                } else {
                    btn.textContent = '❌ No active game to save';
                }
            } catch (err) {
                btn.textContent = '❌ Save failed';
                console.error('Cloud save error:', err);
            }
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '☁️ Save to Cloud';
            }, 2000);
        };

        // Cloud Load button
        document.getElementById('auth-cloud-load-btn').onclick = async () => {
            const btn = document.getElementById('auth-cloud-load-btn');
            btn.disabled = true;
            btn.textContent = '📥 Loading...';
            try {
                const save = await cloudLoad();
                if (save && save.data) {
                    if (typeof window.applyCloudSave === 'function') {
                        const hasCurrentGame = window.player && window.player.name;
                        if (hasCurrentGame) {
                            if (!confirm(`This will replace your current game with your cloud save:\n${save.playerName || 'Unknown'} (Lvl ${save.level || '?'})\n\nContinue?`)) {
                                btn.disabled = false;
                                btn.textContent = '📥 Load from Cloud';
                                return;
                            }
                        }
                        window.applyCloudSave(save);
                        btn.textContent = '✅ Loaded!';
                        if (typeof window.showBriefNotification === 'function') {
                            window.showBriefNotification('☁️ Cloud save loaded!', 'success');
                        }
                        setTimeout(close, 1000);
                    } else {
                        btn.textContent = '❌ Game not ready';
                    }
                } else {
                    btn.textContent = '❌ No cloud save found';
                }
            } catch (err) {
                btn.textContent = err.message === 'No cloud save found' ? '❌ No cloud save' : '❌ Load failed';
                console.error('Cloud load error:', err);
            }
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '📥 Load from Cloud';
            }, 2000);
        };

        // Logout button
        document.getElementById('auth-logout-btn').onclick = async () => {
            await logout();
            updateAuthStatusUI();
            close();
            if (typeof window.showBriefNotification === 'function') {
                window.showBriefNotification('Signed out', 2000);
            }
        };

        // Delete account button
        document.getElementById('auth-delete-account-btn').onclick = async () => {
            if (!confirm('⚠️ WARNING: This will permanently delete your account and cloud save.\n\nThis cannot be undone!\n\nAre you sure?')) return;
            if (!confirm('Are you REALLY sure? All progress will be lost forever.')) return;
            const btn = document.getElementById('auth-delete-account-btn');
            btn.disabled = true;
            btn.textContent = '🗑️ Deleting...';
            try {
                await deleteAccount();
                updateAuthStatusUI();
                close();
                // Wipe local saves and return to title screen
                if (typeof window.deleteAllLocalSavesAndReset === 'function') {
                    window.deleteAllLocalSavesAndReset();
                }
            } catch (err) {
                btn.textContent = '❌ Delete failed';
                console.error('Delete account error:', err);
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '🗑️ Delete Account & Save';
                }, 2000);
            }
        };
    }
}

// ── UI: Status indicator (shown in stats bar or intro) ─────────
export function updateAuthStatusUI() {
    // Update all auth status elements
    const indicators = document.querySelectorAll('.auth-status-indicator');
    indicators.forEach(el => {
        if (isLoggedIn) {
            el.innerHTML = `<span class="auth-status-online" title="Signed in as ${authUsername}">☁️ ${authUsername}</span>`;
        } else {
            el.innerHTML = `<span class="auth-status-offline" title="Not signed in — progress saved locally only">💾 Local Only</span>`;
        }
    });

    // Update intro screen buttons if they exist
    const introLoginBtn = document.getElementById('intro-login-btn');
    if (introLoginBtn) {
        if (isLoggedIn) {
            introLoginBtn.textContent = `☁️ ${authUsername}`;
            introLoginBtn.title = 'Manage cloud account';
        } else {
            introLoginBtn.textContent = '🔐 Sign In';
            introLoginBtn.title = 'Sign in to save across devices';
        }
    }
}

// ── Auto cloud save hook (called from game.js after local save) ──
export async function autoCloudSave(saveEntry) {
    if (!isLoggedIn) return;
    try {
        await cloudSave(saveEntry);
    } catch (err) {
        console.warn('Auto cloud save failed:', err.message);
    }
}

// ── Initialize on import ───────────────────────────────────────
export async function initAuth() {
    if (authToken) {
        const valid = await verifySession();
        if (!valid) {
            console.log('[auth] Saved session expired');
        } else {
            console.log(`[auth] Restored session for ${authUsername}`);
        }
    }
    // Defer UI update to next tick so DOM is ready
    setTimeout(updateAuthStatusUI, 0);
}
