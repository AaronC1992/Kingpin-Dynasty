/**
 * legacy.js
 * 
 * Manages the "End Game" state, retirement, and legacy system.
 * Displays the run summary screen and handles the transition to a new game (New Game+).
 */

import { player } from './player.js';
import { retirementOutcomes, criminalHallOfFame } from './factions.js';

export function checkRetirement() {
    // Check if any retirement condition is met
    // This function should be called periodically or when opening the retirement menu
    
    const availableOptions = [];
    
    // Check Legitimate
    if (player.money >= retirementOutcomes.legitimate.requirements.cleanMoney &&
        player.businesses.length >= retirementOutcomes.legitimate.requirements.businessEmpire) {
        availableOptions.push('legitimate');
    }
    
    // Check Exile
    if (player.money >= retirementOutcomes.exile.requirements.money) {
        // Simplified check for now
        availableOptions.push('exile');
    }
    
    // Check Family Business
    if (player.gang.members >= retirementOutcomes.familyBusiness.requirements.gangMembers &&
        player.territory >= retirementOutcomes.familyBusiness.requirements.territories) {
        availableOptions.push('familyBusiness');
    }
    
    // Check Underground King
    if (player.empireRating.totalScore >= retirementOutcomes.undergroundKing.requirements.empireRating) {
        availableOptions.push('undergroundKing');
    }
    
    return availableOptions;
}

export function triggerEnding(endingKey) {
    const outcome = retirementOutcomes[endingKey];
    if (!outcome) return;

    // Save to Hall of Fame
    const entry = {
        name: player.name,
        date: new Date().toLocaleDateString(),
        ending: outcome.name,
        score: calculateFinalScore(),
        stats: {
            money: player.money,
            level: player.level,
            territory: player.territory
        }
    };
    
    criminalHallOfFame.push(entry);
    localStorage.setItem('criminalHallOfFame', JSON.stringify(criminalHallOfFame));

    // Show Summary Screen
    showRunSummary(outcome, entry);
}

function calculateFinalScore() {
    return Math.floor(
        player.money / 1000 + 
        player.reputation * 10 + 
        player.territory * 50 + 
        player.level * 100
    );
}

function showRunSummary(outcome, entry) {
    const modalId = 'legacy-summary-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = '#000';
    modal.style.zIndex = '3000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.color = '#fff';
    modal.style.fontFamily = 'serif';

    modal.innerHTML = `
        <h1 style="color: #d4af37; font-size: 3em; margin-bottom: 10px;">${outcome.name}</h1>
        <p style="font-size: 1.5em; color: #aaa; margin-bottom: 40px;">"${outcome.description}"</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; width: 80%; max-width: 800px;">
            <div style="text-align: right; border-right: 1px solid #444; padding-right: 20px;">
                <h3 style="color: #888;">Final Stats</h3>
                <p>Net Worth: <span style="color: #4caf50;">$${player.money.toLocaleString()}</span></p>
                <p>Territory: <span style="color: #2196f3;">${player.territory} Blocks</span></p>
                <p>Street Level: <span style="color: #ff9800;">${player.level}</span></p>
            </div>
            <div style="text-align: left; padding-left: 20px;">
                <h3 style="color: #888;">Legacy</h3>
                <p>Final Score: <strong style="color: #d4af37; font-size: 1.2em;">${entry.score}</strong></p>
                <p>Hall of Fame Rank: #${criminalHallOfFame.length}</p>
            </div>
        </div>

        <div style="margin-top: 50px;">
            <button onclick="location.reload()" style="
                background: #d4af37; 
                color: #000; 
                border: none; 
                padding: 15px 40px; 
                font-size: 1.2em; 
                cursor: pointer; 
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
            ">Start New Legacy</button>
        </div>
    `;

    document.body.appendChild(modal);
}

export function showRetirementMenu() {
    const options = checkRetirement();
    const modalId = 'retirement-menu-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.95)';
    modal.style.zIndex = '2500';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.color = '#fff';
    modal.style.fontFamily = 'serif';

    let html = `
        <h1 style="color: #d4af37; margin-bottom: 20px;">End of the Line</h1>
        <p style="color: #aaa; margin-bottom: 40px; max-width: 600px; text-align: center;">
            Every Don has to know when to walk away. Choose your legacy.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 80%; max-width: 1000px;">
    `;

    // Always show options, but disable if not met
    Object.keys(retirementOutcomes).forEach(key => {
        const outcome = retirementOutcomes[key];
        const isAvailable = options.includes(key);
        
        html += `
            <div style="
                background: ${isAvailable ? '#1a1a1a' : '#111'}; 
                border: 1px solid ${isAvailable ? '#d4af37' : '#333'}; 
                padding: 20px; 
                border-radius: 5px; 
                opacity: ${isAvailable ? '1' : '0.5'};
                text-align: center;
            ">
                <h3 style="color: ${isAvailable ? '#d4af37' : '#666'};">${outcome.name}</h3>
                <p style="font-size: 0.9em; color: #888; margin: 10px 0;">${outcome.description}</p>
                <button onclick="triggerEnding('${key}')" 
                    style="
                        background: ${isAvailable ? '#d4af37' : '#333'}; 
                        color: ${isAvailable ? '#000' : '#555'}; 
                        border: none; 
                        padding: 10px 20px; 
                        margin-top: 15px; 
                        cursor: ${isAvailable ? 'pointer' : 'not-allowed'};
                        font-weight: bold;
                    "
                    ${!isAvailable ? 'disabled' : ''}
                >
                    ${isAvailable ? 'Retire' : 'Locked'}
                </button>
            </div>
        `;
    });

    html += `
        </div>
        <button onclick="document.getElementById('${modalId}').remove()" style="margin-top: 40px; background: none; border: 1px solid #555; color: #aaa; padding: 10px 30px; cursor: pointer;">
            Not Yet
        </button>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// Expose to window
window.triggerEnding = triggerEnding;
window.showRetirementMenu = showRetirementMenu;
