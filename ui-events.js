import { EventBus } from './eventBus.js';
import { player } from './player.js';

function formatMoney(n) {
    try {
        return n.toLocaleString();
    } catch {
        return String(n);
    }
}

function refreshMoneyDisplay() {
    const moneyEl = document.getElementById('money-display');
    if (!moneyEl) return;
    
    if (player.inJail) {
        moneyEl.innerText = `In Jail for ${player.jailTime} seconds`;
    } else {
        const dirty = player.dirtyMoney || 0;
        const money = player.money || 0;
        moneyEl.innerText = `Money: $${formatMoney(money)} | Dirty: $${formatMoney(dirty)}`;
    }
}

export function initUIEvents() {
    EventBus.on('moneyChanged', ({ oldValue, newValue }) => {
        // Only update cash HUD when not in jail (jail handler takes precedence)
        if (player.inJail) return;
        refreshMoneyDisplay();
    });

    EventBus.on('wantedLevelChanged', ({ oldValue, newValue }) => {
        const el = document.getElementById('wanted-level-display');
        if (el) el.innerText = `Wanted Level: ${newValue}`;
    });

    EventBus.on('reputationChanged', ({ oldValue, newValue }) => {
        const el = document.getElementById('reputation-display');
        if (el) el.innerText = `Reputation: ${newValue}`;
    });

    EventBus.on('jailStatusChanged', ({ inJail, jailTime }) => {
        const jailStatus = document.getElementById('jail-status');
        if (jailStatus) jailStatus.innerText = inJail ? `${jailTime}s` : 'Free';
        refreshMoneyDisplay();
    });

    EventBus.on('jailTimeUpdated', ({ jailTime }) => {
        const jailStatus = document.getElementById('jail-status');
        if (jailStatus && player.inJail) jailStatus.innerText = `${jailTime}s`;
        // Keep top bar in sync while jailed
        if (player.inJail) refreshMoneyDisplay();
    });

    // Initial paint
    refreshMoneyDisplay();
    const wanted = document.getElementById('wanted-level-display');
    if (wanted) wanted.innerText = `Wanted Level: ${player.wantedLevel}`;
}

