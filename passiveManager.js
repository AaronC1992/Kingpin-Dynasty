/**
 * passiveManager.js
 * 
 * Manages the active effects of faction passives.
 * Handles daily triggers and modifier calculations based on player's standing with factions.
 */

import { player } from './player.js';
import { crimeFamilies } from './factions.js';
// logAction is available globally via window.logAction

/**
 * Checks if a player has access to a specific faction's passive.
 * Currently, we assume access if reputation is positive or if they are "aligned" (simplified for now).
 * For this implementation, we'll check if reputation > 0.
 * @param {string} factionKey - The key of the faction (e.g., 'torrino')
 * @returns {boolean}
 */
function hasPassive(factionKey) {
    // In a full implementation, this might require a specific alliance state or perk.
    // For now, let's say you get the passive if you have > 10 reputation with them.
    return player.missions.factionReputation[factionKey] >= 10;
}

/**
 * Applies daily passive effects. Should be called once per in-game day.
 */
export function applyDailyPassives() {
    // Torrino: "The Books" - 5% interest on unspent cash (capped)
    if (hasPassive('torrino')) {
        const interestRate = crimeFamilies.torrino.passive.value;
        const maxInterest = 50000; // Hard cap to prevent runaway exponential wealth
        const interest = Math.min(maxInterest, Math.floor(player.money * interestRate));
        if (interest > 0) {
            player.money += interest;
            if (window.logAction) window.logAction(` Torrino "The Books" passive: Earned $${interest.toLocaleString()} interest on your cash.${interest >= maxInterest ? ' (capped)' : ''}`);
        }
    }

    // Kozlov: "Arms Deal" - Small chance to regen ammo
    if (hasPassive('kozlov')) {
        const regenChance = crimeFamilies.kozlov.passive.regenChance;
        if (Math.random() < regenChance) {
            const ammoGain = Math.floor(Math.random() * 5) + 1;
            player.ammo += ammoGain;
            if (window.logAction) window.logAction(` Kozlov "Arms Deal" passive: Received a shipment of ${ammoGain} ammo.`);
        }
    }

    // Chen Triad: "Smuggling Routes" - Small daily dirty money bonus from drug network
    if (hasPassive('chen')) {
        const networkBonus = Math.floor(50 + Math.random() * 150); // $50-$200 daily
        player.dirtyMoney = (player.dirtyMoney || 0) + networkBonus;
        if (window.logAction) window.logAction(`🐉 Chen "Smuggling Routes" passive: Your drug network earns $${networkBonus} dirty money overnight.`);
    }

    // Morales Cartel: "Cartel Connections" - Small daily wanted level decay
    if (hasPassive('morales')) {
        if (player.wantedLevel > 0) {
            const decay = Math.min(player.wantedLevel, Math.floor(Math.random() * 3) + 1);
            player.wantedLevel = Math.max(0, player.wantedLevel - decay);
            if (window.logAction) window.logAction(`🌮 Morales "Cartel Connections" passive: Corrupt officials scrub ${decay} from your wanted level.`);
        }
    }
}

/**
 * Calculates the price multiplier for weapons.
 * @returns {number} Multiplier (e.g., 0.9 for 10% off)
 */
export function getWeaponPriceMultiplier() {
    if (hasPassive('kozlov')) {
        return 1.0 - crimeFamilies.kozlov.passive.discount;
    }
    return 1.0;
}

/**
 * Calculates the income multiplier for drug-related jobs.
 * @returns {number} Multiplier (e.g., 1.15 for 15% bonus)
 */
export function getDrugIncomeMultiplier() {
    if (hasPassive('chen')) {
        return crimeFamilies.chen.passive.multiplier;
    }
    return 1.0;
}

/**
 * Calculates the heat generation multiplier for violent crimes.
 * @returns {number} Multiplier (e.g., 0.8 for 20% reduction)
 */
export function getViolenceHeatMultiplier() {
    if (hasPassive('morales')) {
        return 1.0 - crimeFamilies.morales.passive.reduction;
    }
    return 1.0;
}
