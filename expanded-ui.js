/**
 * expanded-ui.js
 * 
 * UI SCREENS AND COMPONENTS FOR EXPANDED SYSTEMS
 * 
 * Provides all interface elements for:
 * - Gang member management with roles/stats
 * - Territory map and defense assignments
 * - Interactive event choices
 * - Rival kingpin activity tracking
 * - Legacy perk shop
 * - The Don's Vault collectibles
 * - Respect/relationship viewer
 */

import ExpandedSystems from './expanded-systems.js';
import { player } from './player.js';
import { EventBus } from './eventBus.js';
import { GameLogging } from './logging.js';

// ==================== GANG MANAGEMENT UI ====================

export function showGangManagementScreen() {
  const gangMembers = player.gang.gangMembers || [];
  
  let html = `
    <div class="expanded-screen gang-management-screen">
      <h2> Gang Management</h2>
      <div class="gang-stats">
        <p><strong>Active Members:</strong> ${gangMembers.filter(m => m.status === "active").length}</p>
        <p><strong>Total Gang Size:</strong> ${gangMembers.length}</p>
        <p><strong>Average Loyalty:</strong> ${calculateAverageLoyalty(gangMembers)}%</p>
      </div>
      
      <div class="member-list">
        ${gangMembers.map(member => renderGangMember(member)).join('')}
      </div>
      
      <div class="gang-actions">
        <button onclick="recruitGangMemberExpanded()"> Recruit New Member ($5,000)</button>
        <button onclick="closeScreen()">← Back</button>
      </div>
    </div>
  `;
  
  showCustomScreen(html);
}

function renderGangMember(member) {
  const roleData = member.roleData || { name: "Soldier", icon: "" };
  const statusIcon = {
    "active": "",
    "injured": "",
    "jailed": "",
    "dead": ""
  }[member.status] || "";
  
  const loyaltyColor = member.stats.loyalty > 70 ? "green" : 
             member.stats.loyalty > 40 ? "orange" : "red";
  
  return `
    <div class="gang-member-card ${member.status}">
      <div class="member-header">
        <h3>${roleData.icon} ${member.name}</h3>
        <span class="status-badge">${statusIcon} ${member.status}</span>
      </div>
      
      <div class="member-role">
        <strong>${roleData.name}</strong> - Level ${member.level}
      </div>
      
      <div class="member-stats">
        <div class="stat"> Violence: ${member.stats.violence}</div>
        <div class="stat"> Stealth: ${member.stats.stealth}</div>
        <div class="stat"> Intelligence: ${member.stats.intelligence}</div>
        <div class="stat" style="color: ${loyaltyColor}"> Loyalty: ${member.stats.loyalty}%</div>
      </div>
      
      ${member.perk ? `
        <div class="member-perk">
          <strong> ${member.perk.name}:</strong> ${member.perk.effect}
        </div>
      ` : ''}
      
      ${member.traits && member.traits.length > 0 ? `
        <div class="member-traits">
          ${member.traits.map(t => `<span class="trait-badge">${t.name}</span>`).join('')}
        </div>
      ` : ''}
      
      ${member.assignedTo ? `
        <div class="assignment"> Assigned to: ${member.assignedTo}</div>
      ` : ''}
      
      ${member.status === "active" ? `
        <div class="member-actions">
          <button onclick="assignMemberToTerritory('${member.id}')"> Assign to Territory</button>
          <button onclick="dismissMember('${member.id}')"> Dismiss</button>
        </div>
      ` : ''}
    </div>
  `;
}

function calculateAverageLoyalty(members) {
  if (members.length === 0) return 0;
  const activeMembers = members.filter(m => m.status === "active");
  if (activeMembers.length === 0) return 0;
  
  const total = activeMembers.reduce((sum, m) => sum + m.stats.loyalty, 0);
  return Math.floor(total / activeMembers.length);
}

window.recruitGangMemberExpanded = function() {
  if (player.money < 5000) {
    alert("Not enough money to recruit! Need $5,000.");
    return;
  }
  
  const newMember = ExpandedSystems.generateGangMember();
  player.gang.gangMembers.push(newMember);
  player.gang.members++;
  player.money -= 5000;
  
  GameLogging.logEvent(`Recruited ${newMember.roleData.icon} ${newMember.name} (${newMember.roleData.name}) to your gang!`);
  
  showGangManagementScreen(); // Refresh
  updateUI();
};

window.dismissMember = function(memberId) {
  const member = player.gang.gangMembers.find(m => m.id === memberId);
  if (!member) return;
  
  if (!confirm(`Are you sure you want to dismiss ${member.name}? This cannot be undone.`)) {
    return;
  }
  
  // Remove from territories if assigned
  if (member.assignedTo && player.territoriesEx) {
    const territory = player.territoriesEx.find(t => t.id === member.assignedTo);
    if (territory) {
      territory.defendingMembers = territory.defendingMembers.filter(id => id !== memberId);
    }
  }
  
  member.status = "dismissed";
  player.gang.members--;
  
  GameLogging.logEvent(`${member.name} has been dismissed from your gang.`);
  showGangManagementScreen();
  updateUI();
};

// ==================== TERRITORY MAP UI ====================

export function showTerritoryMapScreen() {
  const territories = player.territoriesEx || ExpandedSystems.TERRITORIES;
  
  let html = `
    <div class="expanded-screen territory-map-screen">
      <h2> Territory Control Map</h2>
      <p class="subtitle">Assign gang members to defend your territories from rival attacks</p>
      
      <div class="territory-grid">
        ${territories.map(territory => renderTerritory(territory)).join('')}
      </div>
      
      <div class="territory-legend">
        <h3>Risk Levels:</h3>
        <span class="risk-low">Low Risk</span>
        <span class="risk-medium">Medium Risk</span>
        <span class="risk-high">High Risk</span>
        <span class="risk-very-high">Very High Risk</span>
      </div>
      
      <button onclick="closeScreen()">← Back</button>
    </div>
  `;
  
  showCustomScreen(html);
}

function renderTerritory(territory) {
  const isControlled = territory.controlledBy === "player";
  const defenseStrength = isControlled ? ExpandedSystems.calculateTerritoryDefense(territory, player) : 0;
  const defenders = territory.defendingMembers || [];
  
  return `
    <div class="territory-card ${territory.riskLevel.replace(' ', '-')} ${isControlled ? 'controlled' : 'uncontrolled'}">
      <h3>${territory.name}</h3>
      <p class="territory-description">${territory.description}</p>
      
      <div class="territory-info">
        <div> Income: $${territory.baseIncome.toLocaleString()}/day</div>
        <div> Defense Required: ${territory.defenseRequired}</div>
        <div> Risk: ${territory.riskLevel}</div>
      </div>
      
      ${isControlled ? `
        <div class="territory-status controlled">
          <strong> CONTROLLED</strong>
          <div> Defense Strength: ${defenseStrength}</div>
          <div> Fortification Level: ${territory.fortificationLevel}</div>
          <div> Defenders: ${defenders.length}</div>
        </div>
        
        <div class="territory-actions">
          <button onclick="manageDefenders('${territory.id}')"> Manage Defenders</button>
          <button onclick="fortifyTerritory('${territory.id}')"> Fortify ($10,000)</button>
        </div>
      ` : `
        <div class="territory-status uncontrolled">
          <strong> Not Controlled</strong>
          ${territory.controlledBy ? `<div>Held by: ${territory.controlledBy}</div>` : `<div>Available for takeover</div>`}
        </div>
        
        ${!territory.controlledBy ? `
          <button onclick="claimTerritory('${territory.id}')"> Claim Territory ($${territory.baseIncome})</button>
        ` : ''}
      `}
    </div>
  `;
}

window.manageDefenders = function(territoryId) {
  const territory = player.territoriesEx.find(t => t.id === territoryId);
  if (!territory) return;
  
  const availableMembers = player.gang.gangMembers.filter(m => m.status === "active");
  const currentDefenders = territory.defendingMembers || [];
  
  let html = `
    <div class="defender-manager">
      <h2> Manage Defenders: ${territory.name}</h2>
      <p>Select gang members to defend this territory</p>
      
      <div class="current-defenders">
        <h3>Current Defenders (${currentDefenders.length}):</h3>
        ${currentDefenders.map(id => {
          const member = player.gang.gangMembers.find(m => m.id === id);
          return member ? `
            <div class="defender-item">
              ${member.roleData.icon} ${member.name} (${member.roleData.name})
              <button onclick="removeDefender('${territoryId}', '${id}')">Remove</button>
            </div>
          ` : '';
        }).join('')}
      </div>
      
      <div class="available-members">
        <h3>Available Members:</h3>
        ${availableMembers.filter(m => !currentDefenders.includes(m.id)).map(member => `
          <div class="member-item">
            ${member.roleData.icon} ${member.name} (${member.roleData.name})
            - Effectiveness: ${ExpandedSystems.calculateMemberEffectiveness(member, 'defense')}
            <button onclick="addDefender('${territoryId}', '${member.id}')">Add</button>
          </div>
        `).join('')}
      </div>
      
      <button onclick="showTerritoryMapScreen()">← Back to Map</button>
    </div>
  `;
  
  showCustomScreen(html);
};

window.addDefender = function(territoryId, memberId) {
  const result = ExpandedSystems.assignMembersToTerritory(territoryId, [memberId], player);
  if (result.success) {
    GameLogging.logEvent(result.message);
  }
  manageDefenders(territoryId);
  updateUI();
};

window.removeDefender = function(territoryId, memberId) {
  const territory = player.territoriesEx.find(t => t.id === territoryId);
  if (!territory) return;
  
  territory.defendingMembers = territory.defendingMembers.filter(id => id !== memberId);
  
  const member = player.gang.gangMembers.find(m => m.id === memberId);
  if (member) {
    member.assignedTo = null;
  }
  
  GameLogging.logEvent(`Removed ${member.name} from ${territory.name} defense`);
  manageDefenders(territoryId);
  updateUI();
};

window.fortifyTerritory = function(territoryId) {
  if (player.money < 10000) {
    alert("Not enough money! Fortifications cost $10,000.");
    return;
  }
  
  const territory = player.territoriesEx.find(t => t.id === territoryId);
  if (!territory) return;
  
  player.money -= 10000;
  territory.fortificationLevel++;
  
  GameLogging.logEvent(`Fortified ${territory.name}! Defense +10`);
  showTerritoryMapScreen();
  updateUI();
};

window.claimTerritory = function(territoryId) {
  const territory = player.territoriesEx.find(t => t.id === territoryId);
  if (!territory) return;
  
  if (player.money < territory.baseIncome) {
    alert(`Not enough money to claim this territory! Need $${territory.baseIncome.toLocaleString()}`);
    return;
  }
  
  player.money -= territory.baseIncome;
  territory.controlledBy = "player";
  
  GameLogging.logEvent(` Claimed ${territory.name}! Now earning $${territory.baseIncome}/day.`);
  showTerritoryMapScreen();
  updateUI();
};

// ==================== INTERACTIVE EVENT UI ====================

let currentEvent = null;

export function checkAndTriggerInteractiveEvent() {
  if (!ExpandedSystems.CONFIG.interactiveEventsEnabled) return;
  
  const now = Date.now();
  const lastEvent = player.interactiveEvents?.lastEventTime || 0;
  const cooldown = player.interactiveEvents?.eventCooldown || 300000;
  
  if (now - lastEvent < cooldown) return;
  
  // 20% chance per check
  if (Math.random() > 0.2) return;
  
  const event = ExpandedSystems.triggerInteractiveEvent(player);
  if (!event) return;
  
  player.interactiveEvents.lastEventTime = now;
  player.interactiveEvents.eventsTriggered.push(event.id);
  
  showInteractiveEvent(event);
}

function showInteractiveEvent(event) {
  currentEvent = event;
  
  let html = `
    <div class="interactive-event">
      <h2>${event.title}</h2>
      <p class="event-description">${event.description}</p>
      
      <div class="event-choices">
        ${event.choices.map((choice, index) => {
          const reqCheck = checkChoiceRequirements(choice.requirements);
          const disabled = !reqCheck.canChoose;
          
          return `
            <div class="event-choice ${disabled ? 'disabled' : ''}" 
               onclick="${disabled ? '' : `makeEventChoice(${index})`}">
              <h3>${choice.text}</h3>
              ${choice.successChance < 1 ? `<div class="success-chance">Success Chance: ${Math.floor(choice.successChance * 100)}%</div>` : ''}
              ${renderRequirements(choice.requirements)}
              ${disabled ? `<div class="requirements-not-met"> ${reqCheck.reason}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <button onclick="closeScreen(); updateUI();" style="margin-top: 20px; padding: 12px 25px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">Close</button>
    </div>
  `;
  
  showCustomScreen(html);
}

function checkChoiceRequirements(requirements) {
  if (requirements.money && player.money < requirements.money) {
    return { canChoose: false, reason: `Need $${requirements.money.toLocaleString()}` };
  }
  if (requirements.gangMembers && player.gang.gangMembers.filter(m => m.status === "active").length < requirements.gangMembers) {
    return { canChoose: false, reason: `Need ${requirements.gangMembers} gang members` };
  }
  if (requirements.violence && player.skills.violence < requirements.violence) {
    return { canChoose: false, reason: `Need Violence ${requirements.violence}` };
  }
  if (requirements.intelligence && player.skills.intelligence < requirements.intelligence) {
    return { canChoose: false, reason: `Need Intelligence ${requirements.intelligence}` };
  }
  if (requirements.charisma && player.skills.charisma < requirements.charisma) {
    return { canChoose: false, reason: `Need Charisma ${requirements.charisma}` };
  }
  
  return { canChoose: true };
}

function renderRequirements(requirements) {
  const reqs = [];
  if (requirements.money) reqs.push(` $${requirements.money.toLocaleString()}`);
  if (requirements.gangMembers) reqs.push(` ${requirements.gangMembers} members`);
  if (requirements.violence) reqs.push(` Violence ${requirements.violence}`);
  if (requirements.intelligence) reqs.push(` Intelligence ${requirements.intelligence}`);
  if (requirements.charisma) reqs.push(` Charisma ${requirements.charisma}`);
  
  return reqs.length > 0 ? `<div class="requirements">Requires: ${reqs.join(', ')}</div>` : '';
}

window.makeEventChoice = function(choiceIndex) {
  if (!currentEvent) return;
  
  const result = ExpandedSystems.processEventChoice(currentEvent, choiceIndex, player);
  
  if (!result.success) {
    alert(result.message);
    return;
  }
  
  // Show outcome
  const outcome = result.outcome;
  let outcomeHtml = `
    <div class="event-outcome ${result.eventSuccess ? 'success' : 'failure'}">
      <h2>${result.eventSuccess ? ' SUCCESS!' : ' FAILURE!'}</h2>
      <p class="outcome-message">${outcome.message}</p>
      
      <div class="outcome-effects">
        ${result.result.money ? `<div> Money: ${result.result.money > 0 ? '+' : ''}$${result.result.money.toLocaleString()}</div>` : ''}
        ${result.result.heat ? `<div> Heat: ${result.result.heat > 0 ? '+' : ''}${result.result.heat}</div>` : ''}
        ${result.result.respect ? `<div>⭐ Respect: ${result.result.respect > 0 ? '+' : ''}${result.result.respect}</div>` : ''}
        ${result.result.loyalty ? `<div> Gang Loyalty: ${result.result.loyalty > 0 ? '+' : ''}${result.result.loyalty}%</div>` : ''}
        ${result.result.lostMembers ? `<div> Lost: ${result.result.lostMembers.join(', ')}</div>` : ''}
        ${result.result.jailed ? `<div> You've been arrested!</div>` : ''}
      </div>
      
      <button onclick="closeScreen(); updateUI();">Continue</button>
    </div>
  `;
  
  showCustomScreen(outcomeHtml);
  currentEvent = null;
  
  if (result.result.jailed) {
    setTimeout(() => {
      closeScreen();
      sendToJail();
    }, 3000);
  }
};

// ==================== RIVAL KINGPINS UI ====================

export function showRivalActivityScreen() {
  const rivals = player.rivalKingpins || ExpandedSystems.RIVALS;
  
  let html = `
    <div class="expanded-screen rivals-screen">
      <h2> Rival Kingpins</h2>
      <p class="subtitle">Track your competitors and plan your moves</p>
      
      <div class="rivals-grid">
        ${rivals.map(rival => renderRival(rival)).join('')}
      </div>
      
      <button onclick="closeScreen()">← Back</button>
    </div>
  `;
  
  showCustomScreen(html);
}

function renderRival(rival) {
  const playerRespect = player.relationships?.[rival.id] || 0;
  const respectColor = playerRespect > 20 ? 'green' : playerRespect < -20 ? 'red' : 'gray';
  
  return `
    <div class="rival-card">
      <h3>${rival.name}</h3>
      <div class="rival-faction">${rival.faction.toUpperCase()}</div>
      
      <div class="rival-stats">
        <div> Power: ${rival.powerRating}</div>
        <div> Gang Size: ${rival.gangSize}</div>
        <div> Wealth: $${rival.wealth.toLocaleString()}</div>
        <div> Territories: ${rival.territories.length}</div>
        <div style="color: ${respectColor}">⭐ Respect: ${playerRespect > 0 ? '+' : ''}${playerRespect}</div>
      </div>
      
      <div class="rival-personality">
        <strong>Personality:</strong> ${rival.personality}
        <div> Aggressiveness: ${Math.floor(rival.aggressiveness * 100)}%</div>
      </div>
      
      <div class="rival-ability">
        <strong> Special:</strong> ${formatSpecialAbility(rival.specialAbility)}
      </div>
    </div>
  `;
}

function formatSpecialAbility(ability) {
  const abilities = {
    "old_school_tactics": "Old School Tactics - +10% defense",
    "brutal_efficiency": "Brutal Efficiency - +15% attack power",
    "financial_genius": "Financial Genius - +25% income",
    "network_expansion": "Network Expansion - Grows faster",
    "guerrilla_warfare": "Guerrilla Warfare - Surprise attacks"
  };
  return abilities[ability] || ability;
}

// ==================== LEGACY PERK SHOP UI ====================

export function showLegacyPerkShop() {
  const availablePoints = player.legacy?.availableLegacyPoints || 0;
  const unlockedPerks = player.legacy?.permanentPerks || [];
  
  let html = `
    <div class="expanded-screen legacy-shop-screen">
      <h2> Legacy Perk Shop</h2>
      <p class="subtitle">Permanent upgrades that carry over between runs</p>
      
      <div class="legacy-points">
        <h3> Available Legacy Points: ${availablePoints}</h3>
      </div>
      
      <div class="perks-grid">
        ${Object.values(ExpandedSystems.LEGACY_PERKS).map(perk => {
          const isUnlocked = unlockedPerks.includes(perk.id);
          const canAfford = availablePoints >= perk.cost;
          
          return `
            <div class="perk-card ${isUnlocked ? 'unlocked' : ''} ${canAfford ? '' : 'locked'}">
              <h3>${perk.icon} ${perk.name}</h3>
              <p>${perk.description}</p>
              <div class="perk-cost"> Cost: ${perk.cost} LP</div>
              
              ${isUnlocked ? `
                <div class="perk-status"> UNLOCKED</div>
              ` : canAfford ? `
                <button onclick="purchaseLegacyPerk('${perk.id}')">Purchase</button>
              ` : `
                <div class="perk-status"> Not enough Legacy Points</div>
              `}
            </div>
          `;
        }).join('')}
      </div>
      
      <button onclick="closeScreen()">← Back</button>
    </div>
  `;
  
  showCustomScreen(html);
}

window.purchaseLegacyPerk = function(perkId) {
  const perk = ExpandedSystems.LEGACY_PERKS[perkId];
  if (!perk) return;
  
  if (!player.legacy) player.legacy = { permanentPerks: [], availableLegacyPoints: 0 };
  
  if (player.legacy.availableLegacyPoints < perk.cost) {
    alert("Not enough Legacy Points!");
    return;
  }
  
  if (player.legacy.permanentPerks.includes(perkId)) {
    alert("Already unlocked!");
    return;
  }
  
  player.legacy.availableLegacyPoints -= perk.cost;
  player.legacy.permanentPerks.push(perkId);
  
  GameLogging.logEvent(` Unlocked Legacy Perk: ${perk.name}!`);
  showLegacyPerkShop();
  updateUI();
};

// ==================== THE DON'S VAULT UI ====================

// ==================== RESPECT/RELATIONSHIPS UI ====================

export function showRelationshipsScreen() {
  const relationships = player.relationships || {};
  
  let html = `
    <div class="expanded-screen relationships-screen">
      <h2>⭐ Relationships & Respect</h2>
      <p class="subtitle">Your standing with factions and rivals</p>
      
      <div class="relationships-grid">
        ${Object.entries(relationships).map(([targetId, respect]) => {
          return renderRelationship(targetId, respect);
        }).join('')}
      </div>
      
      <div class="respect-legend">
        <h3>Respect Levels:</h3>
        <div class="legend-item"><span class="respect-bar very-high"></span> 60-100: Allied</div>
        <div class="legend-item"><span class="respect-bar high"></span> 20-59: Friendly</div>
        <div class="legend-item"><span class="respect-bar neutral"></span> -19 to 19: Neutral</div>
        <div class="legend-item"><span class="respect-bar low"></span> -20 to -59: Hostile</div>
        <div class="legend-item"><span class="respect-bar very-low"></span> -60 to -100: Enemy</div>
      </div>
      
      <button onclick="closeScreen()">← Back</button>
    </div>
  `;
  
  showCustomScreen(html);
}

function renderRelationship(targetId, respect) {
  const respectLevel = 
    respect >= 60 ? 'very-high' :
    respect >= 20 ? 'high' :
    respect >= -19 ? 'neutral' :
    respect >= -60 ? 'low' : 'very-low';
  
  const respectLabel =
    respect >= 60 ? ' Allied' :
    respect >= 20 ? ' Friendly' :
    respect >= -19 ? ' Neutral' :
    respect >= -60 ? ' Hostile' : ' Enemy';
  
  return `
    <div class="relationship-card ${respectLevel}">
      <h3>${formatTargetName(targetId)}</h3>
      <div class="respect-value">${respectLabel} (${respect > 0 ? '+' : ''}${respect})</div>
      <div class="respect-bar-container">
        <div class="respect-bar-fill ${respectLevel}" style="width: ${Math.abs(respect)}%; ${respect < 0 ? 'transform: scaleX(-1);' : ''}"></div>
      </div>
    </div>
  `;
}

function formatTargetName(targetId) {
  const names = {
    "torrino": "Torrino Family",
    "kozlov": "Kozlov Bratva",
    "chen": "Chen Triad",
    "morales": "Morales Cartel",
    "police": "Police Department",
    "torrino_boss": "Don Vittorio Torrino",
    "kozlov_boss": "Yuri Kozlov",
    "chen_boss": "Chen Wei",
    "morales_boss": "Isabella Morales",
    "independent_boss": "Marcus 'The Jackal' Kane",
    "civilians": "Civilians",
    "underground": "Criminal Underground"
  };
  
  return names[targetId] || targetId;
}

// ==================== UTILITY FUNCTIONS ====================

function showCustomScreen(html) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'expanded-screen-overlay';
  overlay.className = 'expanded-screen-overlay';
  overlay.innerHTML = html;
  
  document.body.appendChild(overlay);
}

window.closeScreen = function() {
  const overlay = document.getElementById('expanded-screen-overlay');
  if (overlay) {
    overlay.remove();
  }
};

// Start rival AI turns
let rivalTurnInterval = null;

export function startRivalAISystem() {
  if (!ExpandedSystems.CONFIG.rivalKingpinsEnabled) return;
  
  if (rivalTurnInterval) clearInterval(rivalTurnInterval);
  
  rivalTurnInterval = setInterval(() => {
    const rivals = player.rivalKingpins || [];
    const territories = player.territoriesEx || [];
    
    rivals.forEach(rival => {
      const actions = ExpandedSystems.processRivalTurn(rival, territories, player);
      
      actions.forEach(action => {
        if (typeof action === 'string') {
          GameLogging.logEvent(action);
        } else if (action.type === 'territory_attack') {
          // Process territory attack
          const result = ExpandedSystems.processTerritoryAttack(
            action.territory,
            action.attacker,
            action.attackStrength,
            player
          );
          
          // Show alert
          showTerritoryAttackAlert(result);
        }
      });
    });
  }, ExpandedSystems.CONFIG.rivalGrowthInterval);
}

function showTerritoryAttackAlert(result) {
  const message = result.lostTerritory ? 
    ` TERRITORY LOST! ${result.attacker} has taken ${result.territory}!
    Casualties: ${result.casualties.join(', ') || 'None'}
    Injured: ${result.injuredDefenders.join(', ') || 'None'}` :
    ` ATTACK REPELLED! Successfully defended ${result.territory} against ${result.attacker}!
    Reward: $${result.rewards.money}, +${result.rewards.respect} respect
    Injured: ${result.injuredDefenders.join(', ') || 'None'}`;
  
  alert(message);
  GameLogging.logEvent(message);
  updateUI();
}

// Export all UI functions
export default {
  showGangManagementScreen,
  showTerritoryMapScreen,
  showInteractiveEvent,
  checkAndTriggerInteractiveEvent,
  showRivalActivityScreen,
  showLegacyPerkShop,
  showRelationshipsScreen,
  startRivalAISystem
};

// Expose to window
window.showGangManagementScreen = showGangManagementScreen;
window.showTerritoryMapScreen = showTerritoryMapScreen;
// showRivalActivityScreen now redirects to unified Rivals screen in game.js
window.showRivalActivityScreen = () => {
  if (window.showRivalsScreen) {
    window.showRivalsScreen();
  }
};
window.showLegacyPerkShop = showLegacyPerkShop;
window.showRelationshipsScreen = showRelationshipsScreen;
