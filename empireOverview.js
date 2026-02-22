/**
 * empireOverview.js
 * 
 * Displays the "Don Dashboard" - a high-level summary of the player's criminal empire.
 * Shows income, territory, reputation, and key assets in one view.
 */

import { player } from './player.js';
import { crimeFamilies } from './factions.js';
import { businessTypes } from './economy.js';

export function showEmpireOverview() {
    // Create modal container
    const modalId = 'empire-overview-modal';
    let modal = document.getElementById(modalId);
    
    if (modal) {
        modal.remove(); // Refresh if already open
    }

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.color = '#fff';
    modal.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';

    // Calculate totals
    const totalRep = Object.values(player.missions.factionReputation).reduce((a, b) => a + b, 0);
    const totalTerritory = player.territory; // Assuming this is a number
    const dailyIncome = calculateDailyIncome();

    const content = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 10px; border: 2px solid #d4af37; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #d4af37;"> Empire Overview: ${player.name || "The Don"}</h2>
                <button onclick="document.getElementById('${modalId}').remove()" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">&times;</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: #2c2c2c; padding: 15px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2em;"></div>
                    <div style="color: #aaa; font-size: 0.9em;">Liquid Assets</div>
                    <div style="font-size: 1.5em; color: #4caf50;">$${player.money.toLocaleString()}</div>
                </div>
                <div style="background: #2c2c2c; padding: 15px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2em;"></div>
                    <div style="color: #aaa; font-size: 0.9em;">Territory Controlled</div>
                    <div style="font-size: 1.5em; color: #2196f3;">${totalTerritory} Blocks</div>
                </div>
                <div style="background: #2c2c2c; padding: 15px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2em;"></div>
                    <div style="color: #aaa; font-size: 0.9em;">Est. Daily Income</div>
                    <div style="font-size: 1.5em; color: #ffeb3b;">$${dailyIncome.toLocaleString()}</div>
                </div>
                <div style="background: #2c2c2c; padding: 15px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2em;"></div>
                    <div style="color: #aaa; font-size: 0.9em;">Total Influence</div>
                    <div style="font-size: 1.5em; color: #9c27b0;">${totalRep} Rep</div>
                </div>
            </div>

            <h3 style="border-bottom: 1px solid #444; padding-bottom: 10px;">Faction Relations</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                ${generateFactionCards()}
            </div>

            <h3 style="border-bottom: 1px solid #444; padding-bottom: 10px;">Active Passives</h3>
            <div style="background: #252525; padding: 15px; border-radius: 5px;">
                ${generatePassivesList()}
            </div>
        </div>
    `;

    modal.innerHTML = content;
    document.body.appendChild(modal);
}

function calculateDailyIncome() {
    let income = 0;

    // Territory income: $100 per block controlled
    income += (player.territory || 0) * 100;

    // Business income (legitimate + illegal)
    if (player.businesses && player.businesses.length > 0) {
        player.businesses.forEach(business => {
            const bt = businessTypes.find(t => t.id === business.type);
            if (bt) {
                const dailyIncome = Math.floor(bt.baseIncome * Math.pow(bt.incomeMultiplier, (business.level || 1) - 1));
                income += dailyIncome;
            }
        });
    }

    // Protection racket income
    if (player.protectionRackets && player.protectionRackets.length > 0) {
        player.protectionRackets.forEach(racket => {
            income += racket.weeklyIncome ? Math.floor(racket.weeklyIncome / 7) : 0;
        });
    }

    // Gang tribute income (territory-based passive income)
    if (player.territoryIncome) {
        income += Math.floor(player.territoryIncome / 7); // Weekly → daily
    }

    // Torrino Family passive: 5% daily interest on cash holdings
    if (player.missions && player.missions.factionReputation && player.missions.factionReputation.torrino >= 10) {
        income += Math.floor(player.money * 0.05);
    }

    // Real estate passive income
    if (player.realEstate && player.realEstate.ownedProperties) {
        player.realEstate.ownedProperties.forEach(prop => {
            income += prop.income || 0;
        });
    }

    return income;
}

function generateFactionCards() {
    let html = '';
    const factions = ['torrino', 'kozlov', 'chen', 'morales'];
    
    factions.forEach(key => {
        const fam = crimeFamilies[key];
        const rep = player.missions.factionReputation[key] || 0;
        const color = fam.color;
        
        html += `
            <div style="background: #2c2c2c; padding: 10px; border-left: 4px solid ${color}; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: ${color};">${fam.name}</strong>
                    <div style="font-size: 0.8em; color: #ccc;">${fam.boss}</div>
                </div>
                <div style="font-weight: bold; ${rep >= 0 ? 'color: #4caf50' : 'color: #f44336'}">
                    ${rep > 0 ? '+' : ''}${rep}
                </div>
            </div>
        `;
    });
    return html;
}

function generatePassivesList() {
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    let hasPassives = false;
    
    const factions = ['torrino', 'kozlov', 'chen', 'morales'];
    factions.forEach(key => {
        if (player.missions.factionReputation[key] >= 10) {
            const passive = crimeFamilies[key].passive;
            html += `
                <li style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                    <strong style="color: #d4af37;">${passive.name}</strong> (${crimeFamilies[key].name})<br>
                    <span style="color: #aaa; font-size: 0.9em;">${passive.description}</span>
                </li>
            `;
            hasPassives = true;
        }
    });

    if (!hasPassives) {
        html += '<li style="color: #666; font-style: italic;">No active faction passives. Gain reputation to unlock bonuses.</li>';
    }

    html += '</ul>';
    return html;
}

// Expose to window
window.showEmpireOverview = showEmpireOverview;
