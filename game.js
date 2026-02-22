import { initOnboarding, updateTracker } from './onboarding.js';
import { applyDailyPassives, getDrugIncomeMultiplier, getViolenceHeatMultiplier, getWeaponPriceMultiplier } from './passiveManager.js';
import { showEmpireOverview } from './empireOverview.js';
import { checkRetirement, triggerEnding, showRetirementMenu } from './legacy.js';
import { player, gainExperience, checkLevelUp, regenerateEnergy, startEnergyRegenTimer, startEnergyRegeneration, skillTreeDefinitions, availablePerks, achievements } from './player.js';
import { jobs, stolenCarTypes } from './jobs.js';
import { crimeFamilies, criminalHallOfFame, retirementOutcomes, factionEffects, potentialMentors } from './factions.js';
import { storyCampaigns, factionMissions, territoryMissions, bossBattles, missionProgress } from './missions.js';
import { narrationVariations, getRandomNarration } from './narration.js';
import { storeItems, realEstateProperties, businessTypes, loanOptions, launderingMethods } from './economy.js';
import { prisonerNames, recruitNames, availableRecruits, randomEncounterRecruit, jailPrisoners, jailbreakPrisoners, generateJailPrisoners, generateJailbreakPrisoners, generateAvailableRecruits, generateRandomEncounter } from './generators.js';
import { EventBus } from './eventBus.js';
import { GameLogging } from './logging.js';
import { ui, ModalSystem } from './ui-modal.js';
import { MobileSystem, updateMobileActionLog } from './mobile-responsive.js';
import { initUIEvents } from './ui-events.js';
import ExpandedSystems from './expanded-systems.js';
import ExpandedUI from './expanded-ui.js';

// Expose to window for legacy compatibility
window.player = player;
window.jobs = jobs;
window.stolenCarTypes = stolenCarTypes;
window.crimeFamilies = crimeFamilies;
window.criminalHallOfFame = criminalHallOfFame;
window.retirementOutcomes = retirementOutcomes;
window.storyCampaigns = storyCampaigns;
window.factionMissions = factionMissions;
window.territoryMissions = territoryMissions;
window.bossBattles = bossBattles;
window.missionProgress = missionProgress;
window.narrationVariations = narrationVariations;
window.getRandomNarration = getRandomNarration;
window.storeItems = storeItems;

// Expose weather/season globals so narration.js can read them
Object.defineProperty(window, 'currentWeather', { get() { return currentWeather; } });
Object.defineProperty(window, 'currentSeason', { get() { return currentSeason; } });
window.realEstateProperties = realEstateProperties;
window.businessTypes = businessTypes;
window.loanOptions = loanOptions;
window.launderingMethods = launderingMethods;
window.prisonerNames = prisonerNames;
window.recruitNames = recruitNames;
window.availableRecruits = availableRecruits;
window.randomEncounterRecruit = randomEncounterRecruit;
window.jailPrisoners = jailPrisoners;
window.jailbreakPrisoners = jailbreakPrisoners;
window.skillTreeDefinitions = skillTreeDefinitions;
window.factionEffects = factionEffects;
window.availablePerks = availablePerks;
window.potentialMentors = potentialMentors;
window.achievements = achievements;
window.EventBus = EventBus;
window.GameLogging = GameLogging;
window.ui = ui;
window.ModalSystem = ModalSystem;
window.MobileSystem = MobileSystem;
window.updateMobileActionLog = updateMobileActionLog;
window.initUIEvents = initUIEvents;
window.ExpandedSystems = ExpandedSystems;
window.ExpandedUI = ExpandedUI;

// Flag to prevent events/notifications from firing while on the title screen.
// Set to true only when the player enters actual gameplay.
let gameplayActive = false;

// Save / load related functions that are used via inline onclick handlers
// (defined later in this file, but hoisted onto window here for safety)
window.loadGameFromIntroSlot = undefined;
window.cancelLoadFromIntro = undefined;









// Faction Missions - Unique jobs for each crime family


















// ==================== MISSION SYSTEM FUNCTIONS ====================

// Function to update mission progress
function updateMissionProgress(actionType, value = 1) {
  const stats = player.missions.missionStats;
  
  switch(actionType) {
    case 'job_completed':
      stats.jobsCompleted += value;
      break;
    case 'money_earned':
      stats.moneyEarned += value;
      break;
    case 'gang_member_recruited':
      stats.gangMembersRecruited += value;
      break;
    case 'territory_controlled':
      stats.territoriesControlled = player.territory; // Update to current territory count
      break;
    case 'boss_defeated':
      stats.bossesDefeated += value;
      break;
    case 'faction_mission_completed':
      stats.factionMissionsCompleted += value;
      break;
    case 'reputation_changed':
      // No stat to update — checkCampaignProgress reads player.reputation directly
      break;
    case 'property_acquired':
      // No stat to update — checkCampaignProgress reads ownedProperties.length directly
      break;
  }
  
  // Check if current campaign chapter is completed
  checkCampaignProgress();
  
  // Update mission availability
  updateMissionAvailability();
}

// Function to check campaign progress
function checkCampaignProgress() {
  const campaign = storyCampaigns[player.missions.activeCampaign];
  if (!campaign) return;
  
  const currentChapter = campaign.chapters[player.missions.currentChapter];
  if (!currentChapter) return;
  
  let allObjectivesComplete = true;
  const stats = player.missions.missionStats;
  
  // Check each objective
  currentChapter.objectives.forEach(objective => {
    switch(objective.type) {
      case 'complete_jobs':
        objective.current = stats.jobsCompleted;
        break;
      case 'earn_money':
        objective.current = stats.moneyEarned;
        break;
      case 'recruit_members':
        objective.current = stats.gangMembersRecruited;
        break;
      case 'complete_faction_mission':
        objective.current = stats.factionMissionsCompleted;
        break;
      case 'control_territory':
        objective.current = player.territory;
        break;
      case 'win_boss_battle':
        objective.current = stats.bossesDefeated;
        break;
      case 'reach_reputation':
        objective.current = Math.floor(player.reputation);
        break;
      case 'own_properties':
        objective.current = player.realEstate.ownedProperties.length;
        break;
    }
    
    if (objective.current < objective.target) {
      allObjectivesComplete = false;
    }
  });
  
  // Complete chapter if all objectives are met
  if (allObjectivesComplete) {
    completeChapter(campaign, currentChapter);
  }
}

// Function to complete a campaign chapter
function completeChapter(campaign, chapter) {
  // Give rewards
  player.money += chapter.rewards.money || 0;
  player.experience += chapter.rewards.experience || 0;
  player.reputation += chapter.rewards.reputation || 0;
  
  // Log completion
  logAction(`Chapter Complete: "${chapter.title}"! You earned $${chapter.rewards.money || 0}, ${chapter.rewards.experience || 0} XP, and ${chapter.rewards.reputation || 0} reputation.`);
  
  // Move to next chapter
  if (chapter.nextChapter !== null) {
    player.missions.currentChapter = chapter.nextChapter;
    const nextChapter = campaign.chapters[chapter.nextChapter];
    if (nextChapter) {
      logAction(`New Chapter: "${nextChapter.title}" - ${nextChapter.description}`);
    }
  } else {
    // Campaign completed
    player.missions.completedCampaigns.push(campaign.id);
    logAction(`Campaign "${campaign.name}" completed! You've proven yourself as a true criminal mastermind.`);
  }
  
  updateUI();
}

// Function to update mission availability based on player progress
function updateMissionAvailability() {
  // Unlock faction missions based on reputation with each family
  Object.keys(factionMissions).forEach(family => {
    factionMissions[family].forEach(mission => {
      const hasItems = hasRequiredItems(mission.requiredItems);
      const hasReputation = player.missions.factionReputation[family] >= (mission.factionRep - 5);
      
      if (!mission.unlocked && hasReputation && hasItems) {
        mission.unlocked = true;
        logAction(`New ${crimeFamilies[family].name} mission available: "${mission.name}"`);
      } else if (mission.unlocked && (!hasReputation || !hasItems)) {
        mission.unlocked = false;
        // Only log if it's due to missing items, not reputation loss
        if (hasReputation && !hasItems) {
          logAction(`Mission "${mission.name}" locked - missing required items: ${mission.requiredItems.join(', ')}`);
        }
      }
    });
  });
  
  // Unlock territory missions based on gang size and reputation
  territoryMissions.forEach(mission => {
    const missionId = mission.id;
    if (!player.missions.unlockedTerritoryMissions.includes(missionId)) {
      if (player.gang.members >= mission.requiredGangMembers && player.reputation >= (mission.difficulty === 'easy' ? 15 : mission.difficulty === 'medium' ? 30 : 50)) {
        player.missions.unlockedTerritoryMissions.push(missionId);
        logAction(`New territory mission available: "${mission.name}"`);
      }
    }
  });
  
  // Unlock boss battles based on power and reputation
  bossBattles.forEach(battle => {
    if (!battle.unlocked && !player.missions.unlockedBossBattles.includes(battle.id)) {
      if (player.power >= battle.requirements.minPower && 
        player.gang.members >= battle.requirements.minGangMembers && 
        player.reputation >= battle.requirements.minReputation) {
        battle.unlocked = true;
        player.missions.unlockedBossBattles.push(battle.id);
        logAction(`Boss battle available: "${battle.name}" - ${battle.boss.name} awaits your challenge!`);
      }
    }
  });
}

// Function to show missions screen
async function showMissions() {
  if (player.inJail) {
    showBriefNotification("Can't access missions while in jail!", 'danger');
    return;
  }
  
  let missionsHTML = `
    <h2>Missions & Operations</h2>
    
    <!-- Faction Information Panel -->
    <div style="background: rgba(44, 62, 80, 0.9); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #9b59b6;">
      <h3 style="color: #9b59b6; margin-bottom: 10px;">Crime Family Intelligence</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
        ${Object.keys(crimeFamilies).map(familyKey => {
          const family = crimeFamilies[familyKey];
          const reputation = player.missions.factionReputation[familyKey];
          const missions = factionMissions[familyKey] || [];
          const unlockedCount = missions.filter(m => m.unlocked).length;
          const totalCount = missions.length;
          
          return `
            <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; border-left: 3px solid ${family.color};">
              <strong style="color: ${family.color};">${family.name}</strong>
              <br><small style="color: #bdc3c7;">Boss: ${family.boss}</small>
              <br><small style="color: #95a5a6;">${family.specialty}</small>
              <br><small style="color: #f39c12;">Reputation: ${reputation} | Missions: ${unlockedCount}/${totalCount}</small>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div style="display: flex; gap: 15px;">
      <!-- Left Column: Story Campaign -->
      <div style="flex: 1; background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; border: 2px solid #c0a062;">
        <h3 style="color: #c0a062; font-family: 'Georgia', serif;">The Story</h3>
        ${generateCampaignHTML()}
      </div>
      
      <!-- Right Column: Faction Missions (Larger) -->
      <div style="flex: 2; background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px; border: 2px solid #8b0000;">
        <h3 style="color: #8b0000; font-family: 'Georgia', serif;">Family Business</h3>
        <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
          ${generateFactionMissionsHTML()}
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
      <!-- Territory Missions -->
      <div style="background: rgba(44, 62, 80, 0.8); padding: 15px; border-radius: 10px; border: 2px solid #f39c12;">
        <h3 style="color: #f39c12;">Territory Expansion</h3>
        <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
          ${generateTerritoryMissionsHTML()}
        </div>
      </div>
      
      <!-- Boss Battles -->
      <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; border: 2px solid #9b59b6;">
        <h3 style="color: #9b59b6;">Boss Battles</h3>
        ${generateBossBattlesHTML()}
      </div>
    </div>
    
    <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">
      Back to SafeHouse
    </button>
  `;
  
  document.getElementById("missions-content").innerHTML = missionsHTML;
  hideAllScreens();
  document.getElementById("missions-screen").style.display = "block";
}

// Function to generate campaign HTML
function generateCampaignHTML() {
  const campaign = storyCampaigns[player.missions.activeCampaign];
  if (!campaign) return "<p>No active campaign</p>";
  
  const currentChapter = campaign.chapters[player.missions.currentChapter];
  if (!currentChapter) return "<p>Campaign completed!</p>";
  
  let objectivesHTML = currentChapter.objectives.map(obj => {
    const isComplete = obj.current >= obj.target;
    return `
      <div style="margin: 5px 0; padding: 8px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
        <span style="color: ${isComplete ? '#c0a062' : '#ecf0f1'}; font-family: 'Georgia', serif;">
          ${isComplete ? '✅' : '🔲'} ${obj.text} (${obj.current}/${obj.target})
        </span>
      </div>
    `;
  }).join('');
  
  return `
    <h4>${campaign.name}</h4>
    <h5 style="color: #f39c12;">Chapter ${player.missions.currentChapter + 1}: ${currentChapter.title}</h5>
    <p style="margin: 10px 0;">${currentChapter.description}</p>
    <div style="margin: 15px 0;">
      <strong>Objectives:</strong>
      ${objectivesHTML}
    </div>
    <div style="margin: 10px 0; padding: 10px; background: rgba(46, 204, 113, 0.2); border-radius: 5px;">
      <small><strong>Rewards:</strong> $${currentChapter.rewards.money || 0}, ${currentChapter.rewards.experience || 0} XP, ${currentChapter.rewards.reputation || 0} Rep</small>
    </div>
  `;
}

// Function to generate faction missions HTML
function generateFactionMissionsHTML() {
  let html = "";
  
  Object.keys(crimeFamilies).forEach(familyKey => {
    const family = crimeFamilies[familyKey];
    const missions = factionMissions[familyKey] || [];
    const reputation = player.missions.factionReputation[familyKey];
    
    // Separate unlocked and locked missions
    const unlockedMissions = missions.filter(m => m.unlocked);
    const lockedMissions = missions.filter(m => !m.unlocked);
    
    html += `
      <div style="margin: 10px 0; padding: 12px; background: rgba(52, 73, 94, 0.4); border-radius: 8px; border-left: 4px solid ${family.color};">
        <h5 style="color: ${family.color}; margin-bottom: 8px;">${family.name}</h5>
        <small style="color: #bdc3c7;">Reputation: ${reputation} | ${family.description}</small>
        
        <!-- Available Missions -->
        ${unlockedMissions.map(mission => `
          <div style="margin: 8px 0; padding: 10px; background: rgba(46, 204, 113, 0.1); border-radius: 5px; border: 1px solid rgba(46, 204, 113, 0.3);">
            <strong style="color: #c0a062; font-family: 'Georgia', serif;">✅ ${mission.name}</strong>
            <br><small style="color: #ecf0f1;">${mission.description}</small>
            <br><small style="color: #f39c12;">💰 Payout: $${mission.payout[0]}-${mission.payout[1]} | ⚡ Risk: ${mission.risk}</small>
            ${mission.requiredItems && mission.requiredItems.length > 0 ? 
              `<br><small style="color: #e67e22;">Required Items: ${mission.requiredItems.join(', ')}</small>` : ''}
            <br><small style="color: #95a5a6;">Energy: ${mission.energyCost} | Rep Needed: ${mission.reputation}</small>
            <br><button onclick="startFactionMission('${familyKey}', '${mission.id}')" 
                  style="background: ${family.color}; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-weight: bold;">
              Accept Mission
            </button>
          </div>
        `).join('')}
        
        <!-- Locked Missions -->
        ${lockedMissions.map(mission => {
          const hasItems = hasRequiredItems(mission.requiredItems);
          const hasReputation = reputation >= (mission.factionRep - 5);
          const missingItems = mission.requiredItems.filter(item => !hasRequiredItems([item]));
          const repNeeded = Math.max(0, (mission.factionRep - 5) - reputation);
          
          return `
            <div style="margin: 8px 0; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 5px; border: 1px solid rgba(231, 76, 60, 0.3);">
              <strong style="color: #8b0000; font-family: 'Georgia', serif;">LOCKED ${mission.name}</strong>
              <br><small style="color: #bdc3c7;">${mission.description}</small>
              <br><small style="color: #f39c12;">Payout: $${mission.payout[0]}-${mission.payout[1]} | Risk: ${mission.risk}</small>
              <br><small style="color: #e67e22;">Required Items: ${mission.requiredItems.join(', ') || 'None'}</small>
              <br><small style="color: #95a5a6;">Energy: ${mission.energyCost} | Rep Needed: ${mission.reputation}</small>
              <br><strong style="color: #8b0000; font-family: 'Georgia', serif;">Requirements:</strong>
              ${!hasReputation ? `<br><small style="color: #8b0000;">• Need ${repNeeded} more Respect</small>` : ''}
              ${!hasItems && mission.requiredItems.length > 0 ? `<br><small style="color: #8b0000;">• Missing items: ${missingItems.join(', ')}</small>` : ''}
              ${hasReputation && hasItems ? `<br><small style="color: #f39c12;">• Ready to unlock! Check mission availability...</small>` : ''}
            </div>
          `;
        }).join('')}
        
        ${unlockedMissions.length === 0 && lockedMissions.length === 0 ? '<p><small>No missions available</small></p>' : ''}
        
        ${(() => {
          // Signature Job - gated behind 20+ faction reputation
          const sigJob = family.signatureJob;
          if (!sigJob) return '';
          const cooldowns = player.missions.signatureJobCooldowns || {};
          const lastRun = cooldowns[sigJob.id] || 0;
          const cooldownMs = (sigJob.cooldown || 24) * 60 * 60 * 1000;
          const now = Date.now();
          const onCooldown = (now - lastRun) < cooldownMs;
          const remaining = onCooldown ? Math.ceil((cooldownMs - (now - lastRun)) / 60000) : 0;
          const hasRep = reputation >= 20;
          
          if (!hasRep) {
            return `
              <div style="margin: 8px 0; padding: 10px; background: rgba(155,89,182,0.1); border-radius: 5px; border: 1px solid rgba(155,89,182,0.3);">
                <strong style="color: #7f8c8d; font-family: 'Georgia', serif;">🔒 SIGNATURE JOB: ${sigJob.name}</strong>
                <br><small style="color: #95a5a6;">${sigJob.description}</small>
                <br><small style="color: #8b0000;">Requires 20 ${family.name} reputation (you have ${reputation})</small>
              </div>
            `;
          }
          
          return `
            <div style="margin: 8px 0; padding: 10px; background: rgba(155,89,182,0.15); border-radius: 5px; border: 1px solid rgba(155,89,182,0.5);">
              <strong style="color: #9b59b6; font-family: 'Georgia', serif;">⭐ SIGNATURE JOB: ${sigJob.name}</strong>
              <br><small style="color: #ecf0f1;">${sigJob.description}</small>
              <br><small style="color: #f39c12;">💰 $${sigJob.baseReward.toLocaleString()} | ⚡ ${sigJob.xpReward} XP | Type: ${sigJob.type}</small>
              <br>${onCooldown 
                ? `<small style="color: #e67e22;">⏳ Cooldown: ${remaining >= 60 ? Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm' : remaining + 'm'} remaining</small>`
                : `<button onclick="startSignatureJob('${familyKey}')" 
                    style="background: #9b59b6; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-weight: bold;">
                  Execute Signature Job
                </button>`
              }
            </div>
          `;
        })()}
      </div>
    `;
  });
  
  return html;
}

// Function to generate territory missions HTML
function generateTerritoryMissionsHTML() {
  let html = "";
  
  // Gang Size Requirements Overview
  html += `
    <div style="margin-bottom: 15px; padding: 12px; background: rgba(52, 73, 94, 0.6); border-radius: 8px; border: 2px solid #f39c12;">
      <h6 style="color: #f39c12; margin-bottom: 8px;">Gang Size Requirements Overview</h6>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
        <small style="color: #c0a062; font-family: 'Georgia', serif;">📍 <strong>The Streets</strong>: 3+ soldiers (Easy)</small>
        <small style="color: #f39c12;">📍 <strong>Docks</strong>: 5+ members (Medium)</small>
        <small style="color: #8b0000; font-family: 'Georgia', serif;">📍 <strong>Downtown</strong>: 8+ soldiers (Hard)</small>
      </div>
      <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px;">
        <small style="color: #bdc3c7;">
          <strong>Your Gang:</strong> ${player.gang.members} members | 
          <strong>Reputation:</strong> ${player.reputation}
        </small>
      </div>
    </div>
  `;
  
  // Separate unlocked and locked missions
  const unlockedMissions = territoryMissions.filter(mission => 
    player.missions.unlockedTerritoryMissions.includes(mission.id)
  );
  const lockedMissions = territoryMissions.filter(mission => 
    !player.missions.unlockedTerritoryMissions.includes(mission.id)
  );
  
  // Display unlocked missions
  unlockedMissions.forEach(mission => {
    const canAfford = player.gang.members >= mission.requiredGangMembers && player.energy >= mission.energyCost;
    
    html += `
      <div style="margin: 10px 0; padding: 12px; background: rgba(46, 204, 113, 0.1); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.3);">
        <h5 style="color: #c0a062; margin-bottom: 8px; font-family: 'Georgia', serif;">✅ ${mission.name}</h5>
        <p style="color: #ecf0f1; margin: 5px 0;"><small>${mission.description}</small></p>
        
        <!-- Requirements -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
          <strong style="color: #f39c12;">Requirements:</strong><br>
          <small style="color: ${player.gang.members >= mission.requiredGangMembers ? '#c0a062' : '#8b0000'};">
            Gang Members: ${player.gang.members}/${mission.requiredGangMembers}
          </small><br>
          <small style="color: ${player.energy >= mission.energyCost ? '#c0a062' : '#8b0000'};">
            Energy Cost: ${mission.energyCost}
          </small><br>
          <small style="color: #95a5a6;">Territory: ${mission.territory}</small>
        </div>
        
        <!-- Rewards -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
          <strong style="color: #c0a062; font-family: 'Georgia', serif;">The Take:</strong><br>
          <small style="color: #f39c12;">Money: $${mission.rewards.money.toLocaleString()}</small><br>
          <small style="color: #3498db;">Territory: +${mission.rewards.territory}</small><br>
          <small style="color: #9b59b6;">Reputation: +${mission.rewards.reputation}</small><br>
          <small style="color: #2ecc71;">Passive Income: +$${mission.rewards.passive_income}/tribute</small>
        </div>
        
        <!-- Risks -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(231, 76, 60, 0.2); border-radius: 5px;">
          <strong style="color: #e74c3c;">Risks:</strong><br>
          <small style="color: #e74c3c;">Jail Chance: ${mission.risks.jailChance}%</small><br>
          <small style="color: #e74c3c;">Gang Loss Risk: ${mission.risks.gangMemberLoss}%</small><br>
          <small style="color: #e74c3c;">Health Loss: ${mission.risks.healthLoss}</small>
        </div>
        
        <button onclick="startTerritoryMission('${mission.id}')" 
            style="background: ${canAfford ? '#f39c12' : '#7f8c8d'}; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; margin-top: 8px; font-weight: bold;"
            ${canAfford ? '' : 'disabled title="Check requirements above"'}>
          ${canAfford ? 'Launch Operation' : 'Requirements Not Met'}
        </button>
      </div>
    `;
  });
  
  // Display locked missions
  lockedMissions.forEach(mission => {
    const gangNeeded = Math.max(0, mission.requiredGangMembers - player.gang.members);
    const repNeeded = Math.max(0, (mission.difficulty === 'easy' ? 15 : mission.difficulty === 'medium' ? 30 : 50) - player.reputation);
    
    html += `
      <div style="margin: 10px 0; padding: 12px; background: rgba(231, 76, 60, 0.1); border-radius: 8px; border: 1px solid rgba(231, 76, 60, 0.3);">
        <h5 style="color: #e74c3c; margin-bottom: 8px;">LOCKED ${mission.name}</h5>
        <p style="color: #bdc3c7; margin: 5px 0;"><small>${mission.description}</small></p>
        
        <!-- Future Requirements -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
          <strong style="color: #f39c12;">Will Require:</strong><br>
          <small style="color: #95a5a6;">Gang Members: ${mission.requiredGangMembers}</small><br>
          <small style="color: #95a5a6;">Energy Cost: ${mission.energyCost}</small><br>
          <small style="color: #95a5a6;">Territory: ${mission.territory}</small><br>
          <small style="color: #95a5a6;">Difficulty: ${mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}</small>
        </div>
        
        <!-- Unlock Requirements -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(231, 76, 60, 0.2); border-radius: 5px;">
          <strong style="color: #e74c3c;">Unlock Requirements:</strong><br>
          ${gangNeeded > 0 ? `<small style="color: #e74c3c;">• Need ${gangNeeded} more gang members</small><br>` : ''}
          ${repNeeded > 0 ? `<small style="color: #e74c3c;">• Need ${repNeeded} more reputation</small><br>` : ''}
          ${gangNeeded === 0 && repNeeded === 0 ? `<small style="color: #f39c12;">• Ready to unlock! Check mission availability...</small>` : ''}
        </div>
        
        <!-- Future Rewards Preview -->
        <div style="margin: 8px 0; padding: 8px; background: rgba(52, 73, 94, 0.4); border-radius: 5px;">
          <strong style="color: #95a5a6;">Future Rewards:</strong><br>
          <small style="color: #95a5a6;">Money: $${mission.rewards.money.toLocaleString()}</small><br>
          <small style="color: #95a5a6;">Passive Income: +$${mission.rewards.passive_income}/tribute</small>
        </div>
      </div>
    `;
  });
  
  return html || '<p>No territory missions available</p>';
}

// Function to generate boss battles HTML
function generateBossBattlesHTML() {
  return bossBattles.filter(battle => 
    player.missions.unlockedBossBattles.includes(battle.id)
  ).map(battle => `
    <div style="margin: 10px 0; padding: 10px; background: rgba(52, 73, 94, 0.4); border-radius: 5px;">
      <h5>${battle.name}</h5>
      <p><small>${battle.description}</small></p>
      <div style="margin: 8px 0; padding: 8px; background: rgba(155, 89, 182, 0.3); border-radius: 5px;">
        <strong>${battle.boss.name}</strong><br>
        <small>Power: ${battle.boss.power} | Gang: ${battle.boss.gang_size} members</small><br>
        <small>Abilities: ${battle.boss.special_abilities.join(', ')}</small>
      </div>
      <div style="margin: 5px 0;">
        <small><strong>Rewards:</strong> $${battle.rewards.money}, +${battle.rewards.reputation} rep, +${battle.rewards.territory} territory</small>
      </div>
      <button onclick="startBossBattle('${battle.id}')" 
          style="background: #9b59b6; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;"
          ${player.power < battle.requirements.minPower || player.gang.members < battle.requirements.minGangMembers ? 'disabled title="Requirements not met"' : ''}>
        ${player.power < battle.requirements.minPower || player.gang.members < battle.requirements.minGangMembers ? 'Not Ready' : 'Challenge Boss'}
      </button>
    </div>
  `).join('') || '<p>No boss battles available</p>';
}

// Mission execution functions
async function startFactionMission(familyKey, missionId) {
  const mission = factionMissions[familyKey].find(m => m.id === missionId);
  if (!mission) return;
  
  // Check requirements
  if (player.energy < mission.energyCost) {
    showBriefNotification(`Need ${mission.energyCost} energy for this mission!`, 'danger');
    return;
  }
  
  if (!hasRequiredItems(mission.requiredItems)) {
    showBriefNotification(`Need: ${mission.requiredItems.join(', ')}`, 'danger');
    return;
  }
  
  if (player.reputation < mission.reputation) {
    showBriefNotification(`Need ${mission.reputation} reputation for this mission!`, 'danger');
    return;
  }
  
  // Consume energy
  player.energy -= mission.energyCost;
  
  // Calculate success chance
  let successChance = 60 + (player.power * 0.5) + (player.skills.intelligence * 2);
  successChance = Math.min(successChance, 95);
  
  // Execute mission
  if (Math.random() * 100 < successChance) {
    const earnings = Math.floor(Math.random() * (mission.payout[1] - mission.payout[0] + 1)) + mission.payout[0];
    player.money += earnings;
    player.reputation += mission.factionRep / 2;
    player.missions.factionReputation[familyKey] += mission.factionRep;
    
    // Mark mission as completed
    player.missions.completedMissions.push(missionId);
    updateMissionProgress('faction_mission_completed');
    updateMissionProgress('reputation_changed');
    
    logAction(`Mission "${mission.name}" completed for ${crimeFamilies[familyKey].name}! +$${earnings}, +${mission.factionRep} family reputation.`);
    logAction(mission.story);
    
    showBriefNotification(`Mission complete! +$${earnings.toLocaleString()} & rep with ${crimeFamilies[familyKey].name}`, 'success');
  } else {
    // Mission failed
    if (Math.random() * 100 < mission.jailChance) {
      sendToJail(5);
      return;
    }
    
    logAction(`💥 Mission "${mission.name}" failed! The ${crimeFamilies[familyKey].name} is not pleased with your performance.`);
    showBriefNotification("Mission failed! Try again when you're better prepared.", 'danger');
  }
  
  updateUI();
  showMissions();
}

// Execute a faction's signature job (special job with cooldown, gated by faction rep)
function startSignatureJob(familyKey) {
  const family = crimeFamilies[familyKey];
  if (!family || !family.signatureJob) return;
  
  const sigJob = family.signatureJob;
  const reputation = player.missions.factionReputation[familyKey] || 0;
  
  // Gate: require 20+ faction reputation
  if (reputation < 20) {
    alert(`You need 20 reputation with ${family.name} to attempt their signature job.`);
    return;
  }
  
  // Cooldown check
  if (!player.missions.signatureJobCooldowns) player.missions.signatureJobCooldowns = {};
  const lastRun = player.missions.signatureJobCooldowns[sigJob.id] || 0;
  const cooldownMs = (sigJob.cooldown || 24) * 60 * 60 * 1000;
  if ((Date.now() - lastRun) < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - (Date.now() - lastRun)) / 60000);
    alert(`This signature job is on cooldown. Try again in ${remaining >= 60 ? Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm' : remaining + 'm'}.`);
    return;
  }
  
  // Energy cost (flat 20)
  const energyCost = 20;
  if (player.energy < energyCost) {
    alert(`You need ${energyCost} energy for this signature job.`);
    return;
  }
  
  player.energy -= energyCost;
  startEnergyRegenTimer();
  
  // Success chance based on the signature job's type (maps to player skill)
  const skillMap = { charisma: 'charisma', violence: 'violence', intelligence: 'intelligence', stealth: 'stealth' };
  const relevantSkill = player.skills[skillMap[sigJob.type]] || 0;
  let successChance = 40 + (relevantSkill * 3) + (player.power * 0.15) + (reputation * 0.5);
  successChance = Math.min(successChance, 90);
  
  if (Math.random() * 100 < successChance) {
    // Success
    const rewardMultiplier = 1 + (reputation / 100); // Higher rep => bigger reward
    const earnings = Math.floor(sigJob.baseReward * rewardMultiplier);
    player.dirtyMoney = (player.dirtyMoney || 0) + earnings;
    player.reputation += 3;
    player.missions.factionReputation[familyKey] += 5;
    gainExperience(sigJob.xpReward);
    
    // Kozlov special bonus: random weapon on success
    if (familyKey === 'kozlov') {
      const bonusWeapons = ['Combat Knife', 'Pistol', 'Shotgun'];
      const bonusWeapon = bonusWeapons[Math.floor(Math.random() * bonusWeapons.length)];
      player.inventory.push({ name: bonusWeapon, power: 15 + Math.floor(Math.random() * 20), type: 'weapon' });
      logAction(`🔫 Kozlov bonus: You scored a ${bonusWeapon} from the convoy!`);
    }
    
    logAction(`⭐ Signature Job "${sigJob.name}" completed for ${family.name}! +$${earnings.toLocaleString()} (dirty), +${sigJob.xpReward} XP, +5 family rep.`);
    flashSuccessScreen();
    alert(`Signature job complete! Earned $${earnings.toLocaleString()} and gained standing with ${family.name}.`);
    
    updateMissionProgress('reputation_changed');
  } else {
    // Failure
    const jailRoll = Math.random() * 100;
    if (jailRoll < 25) {
      sendToJail(3);
      logAction(`⭐ Signature job "${sigJob.name}" went sideways — you got pinched!`);
      return;
    }
    logAction(`⭐ Signature job "${sigJob.name}" failed. ${family.name} is disappointed but willing to give you another shot.`);
    alert(`The ${sigJob.name} didn't go as planned. Better luck next time.`);
  }
  
  // Set cooldown regardless of outcome
  player.missions.signatureJobCooldowns[sigJob.id] = Date.now();
  
  updateUI();
  showMissions();
}

async function startTerritoryMission(missionId) {
  const mission = territoryMissions.find(m => m.id === missionId);
  if (!mission) return;
  
  // Check requirements
  if (player.energy < mission.energyCost) {
    showBriefNotification(`Need ${mission.energyCost} energy for this operation!`, 'danger');
    return;
  }
  
  if (player.gang.members < mission.requiredGangMembers) {
    showBriefNotification(`Need at least ${mission.requiredGangMembers} gang members!`, 'danger');
    return;
  }
  
  // Consume energy
  player.energy -= mission.energyCost;
  
  // Calculate success chance based on gang size and power
  let successChance = 40 + (player.gang.members * 3) + (player.power * 0.3);
  successChance = Math.min(successChance, 85);
  
  // Execute mission
  if (Math.random() * 100 < successChance) {
    // Success
    player.money += mission.rewards.money;
    player.territory += mission.rewards.territory;
    player.reputation += mission.rewards.reputation;
    
    // Remove from available missions
    player.missions.unlockedTerritoryMissions = player.missions.unlockedTerritoryMissions.filter(id => id !== missionId);
    player.missions.completedMissions.push(missionId);
    updateMissionProgress('territory_controlled');
    
    logAction(`Territory mission "${mission.name}" successful! You now control ${mission.territory}. +$${mission.rewards.money}, +${mission.rewards.territory} territory.`);
    logAction(mission.story);
    
    showBriefNotification(`Territory secured! +$${mission.rewards.passive_income}/tribute from ${mission.territory}`, 'success');
  } else {
    // Mission failed
    if (Math.random() * 100 < mission.risks.jailChance) {
      sendToJail(10);
      return;
    }
    
    // Potential gang member loss
    if (Math.random() * 100 < mission.risks.gangMemberLoss && player.gang.gangMembers.length > 0) {
      const lostMember = player.gang.gangMembers.pop();
      player.gang.members = Math.max(0, player.gang.members - 1);
      player.power -= (lostMember.power || 5);
      logAction(`${lostMember.name} was lost during the failed territory operation. The streets claimed another soldier.`);
    }
    
    // Health loss
    const healthLoss = Math.floor(Math.random() * mission.risks.healthLoss) + 5;
    player.health -= healthLoss;
    
    logAction(`💥 Territory mission "${mission.name}" failed! You retreat with casualties and learn the hard lesson of overreach.`);
    showBriefNotification(`Mission failed! Lost ${healthLoss} health.`, 'danger');
    
    if (player.health <= 0) {
      showDeathScreen(`Killed during the "${mission.name}" territory mission`);
      return;
    }
  }
  
  updateUI();
  showMissions();
}

async function startBossBattle(battleId) {
  const battle = bossBattles.find(b => b.id === battleId);
  if (!battle) return;
  
  // Check requirements
  if (player.energy < battle.energyCost) {
    showBriefNotification(`Need ${battle.energyCost} energy for this confrontation!`, 'danger');
    return;
  }
  
  if (player.power < battle.requirements.minPower) {
    showBriefNotification(`Need ${battle.requirements.minPower} power to challenge ${battle.boss.name}!`, 'danger');
    return;
  }
  
  if (player.gang.members < battle.requirements.minGangMembers) {
    showBriefNotification(`Need ${battle.requirements.minGangMembers} gang members for this battle!`, 'danger');
    return;
  }
  
  // Consume energy
  player.energy -= battle.energyCost;
  
  // Calculate battle outcome
  const playerStrength = player.power + (player.gang.members * 8) + (player.skills.violence * 10);
  const bossStrength = battle.boss.power + (battle.boss.gang_size * 6);
  
  const successChance = Math.min(85, 30 + ((playerStrength / bossStrength) * 40));
  
  // Execute battle
  if (Math.random() * 100 < successChance) {
    // Victory!
    player.money += battle.rewards.money;
    player.reputation += battle.rewards.reputation;
    player.territory += battle.rewards.territory;
    player.experience += battle.rewards.experience;
    updateMissionProgress('reputation_changed');
    
    // Add unique item if exists
    if (battle.rewards.unique_item) {
      player.inventory.push({ name: battle.rewards.unique_item, power: 75, type: "unique_weapon" });
      logAction(`You claimed ${battle.boss.name}'s legendary weapon: ${battle.rewards.unique_item}!`);
    }
    
    // Reduce wanted level if specified
    if (battle.rewards.wanted_level_reduction) {
      player.wantedLevel = Math.max(0, player.wantedLevel - battle.rewards.wanted_level_reduction);
    }
    
    // Remove from available battles
    player.missions.unlockedBossBattles = player.missions.unlockedBossBattles.filter(id => id !== battleId);
    player.missions.completedMissions.push(battleId);
    updateMissionProgress('boss_defeated');
    
    logAction(`VICTORY! ${battle.boss.name} has fallen! Your reputation echoes through every corner of the criminal underworld. +$${battle.rewards.money}, +${battle.rewards.reputation} reputation.`);
    logAction(battle.story);
    
    await ui.alert(`${battle.boss.name} defeated! You've proven your dominance and earned legendary status in the underworld.`);
  } else {
    // Defeat
    if (Math.random() * 100 < battle.risks.jailChance) {
      sendToJail(15);
      return;
    }
    
    // Gang casualties
    const gangLosses = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < gangLosses && player.gang.gangMembers.length > 0; i++) {
      const lostMember = player.gang.gangMembers.pop();
      player.gang.members = Math.max(0, player.gang.members - 1);
      player.power -= (lostMember.power || 5);
    }
    
    // Health loss
    const healthLoss = Math.floor(Math.random() * battle.risks.healthLoss) + 10;
    player.health -= healthLoss;
    
    logAction(`DEFEAT! ${battle.boss.name} proved too powerful. You retreat with heavy casualties, bloodied but alive to fight another day.`);
    await ui.alert(`Boss battle failed! Lost ${healthLoss} health and ${gangLosses} gang members. Regroup and try again when you're stronger.`);
    
    if (player.health <= 0) {
      showDeathScreen(`Slain by ${battle.boss.name} in a boss battle`);
      return;
    }
  }
  
  updateUI();
  showMissions();
}

// ==================== GANG MANAGEMENT OVERHAUL ====================

// Specialist Roles for Gang Members
const specialistRoles = [
  {
    id: "muscle",
    name: "Muscle",
    description: "Physical intimidation and protection",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 500,
    trainingTime: 24, // hours
    benefits: {
      jobSuccessBonus: 0.15, // 15% bonus to violent jobs
      healthProtection: 0.10, // 10% less health loss
      gangLoyalty: 0.05 // 5% loyalty bonus
    },
    requiredFor: ["territory_war", "protection_racket", "rival_assassination"]
  },
  {
    id: "thief",
    name: "Thief",
    description: "Stealth operations and burglary",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 400,
    trainingTime: 18,
    benefits: {
      stealthBonus: 0.20, // 20% less jail chance on stealth jobs
      carTheftBonus: 0.25, // 25% better car theft success
      gangLoyalty: 0.03
    },
    requiredFor: ["car_theft", "burglary", "heist"]
  },
  {
    id: "dealer",
    name: "Dealer",
    description: "Drug operations and street sales",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 600,
    trainingTime: 20,
    benefits: {
      drugJobBonus: 0.30, // 30% bonus to drug-related jobs
      moneyBonus: 0.15, // 15% more money from drug jobs
      gangLoyalty: 0.04
    },
    requiredFor: ["drug_lab", "street_dealing", "smuggling"]
  },
  {
    id: "enforcer",
    name: "Enforcer",
    description: "Debt collection and intimidation",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 700,
    trainingTime: 30,
    benefits: {
      intimidationBonus: 0.25, // 25% bonus to intimidation jobs
      businessProtection: 0.20, // 20% better business income protection
      gangLoyalty: 0.06
    },
    requiredFor: ["debt_collection", "business_protection", "territory_control"]
  },
  {
    id: "driver",
    name: "Driver",
    description: "Vehicle operations and getaway specialist",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 450,
    trainingTime: 16,
    benefits: {
      escapeBonus: 0.20, // 20% better escape chance
      vehicleJobBonus: 0.25, // 25% bonus to vehicle-related jobs
      gangLoyalty: 0.03
    },
    requiredFor: ["getaway_driver", "smuggling_run", "car_theft_ring"]
  },
  {
    id: "technician",
    name: "Technician",
    description: "Electronic security and hacking",
    baseEfficiency: 1.0,
    maxLevel: 5,
    trainingCost: 800,
    trainingTime: 36,
    benefits: {
      techJobBonus: 0.35, // 35% bonus to tech jobs
      securityBypass: 0.15, // 15% better at bypassing security
      gangLoyalty: 0.07
    },
    requiredFor: ["hacking", "security_bypass", "money_laundering"]
  }
];

// Gang Operations - Special missions for specialist gang members
const gangOperations = [
  {
    id: "protection_racket",
    name: "Protection Racket",
    description: "Collect protection money from local businesses",
    requiredRole: "enforcer",
    duration: 4, // hours
    energy: 0, // Gang member energy, not player
    rewards: {
      money: [500, 1200],
      experience: 50,
      loyalty: 2
    },
    risks: {
      arrestChance: 15,
      betrayalRisk: 5,
      healthLoss: 10
    },
    cooldown: 12 // hours
  },
  {
    id: "car_theft_ring",
    name: "Car Theft Ring",
    description: "Organized vehicle theft operation",
    requiredRole: "thief",
    duration: 6,
    energy: 0,
    rewards: {
      money: [800, 1500],
      vehicle: true, // Chance to get a stolen car
      experience: 75,
      loyalty: 3
    },
    risks: {
      arrestChance: 25,
      betrayalRisk: 8,
      healthLoss: 5
    },
    cooldown: 18
  },
  {
    id: "drug_lab_operation",
    name: "Drug Lab Operation",
    description: "Manage underground drug manufacturing",
    requiredRole: "dealer",
    duration: 8,
    energy: 0,
    rewards: {
      money: [1200, 2500],
      dirtyMoney: [400, 800], // Generates dirty money
      experience: 100,
      loyalty: 1 // Risky work, lower loyalty gain
    },
    risks: {
      arrestChance: 35,
      betrayalRisk: 12,
      healthLoss: 15
    },
    cooldown: 24
  },
  {
    id: "tech_heist",
    name: "Tech Heist",
    description: "High-tech corporate espionage and theft",
    requiredRole: "technician",
    duration: 12,
    energy: 0,
    rewards: {
      money: [2000, 4000],
      experience: 150,
      loyalty: 5 // High-skill work increases loyalty
    },
    risks: {
      arrestChance: 20,
      betrayalRisk: 3,
      healthLoss: 5
    },
    cooldown: 48
  }
];

// Training Programs for Gang Members
const trainingPrograms = [
  {
    id: "basic_combat",
    name: "Basic Combat Training",
    description: "Improve fighting skills and intimidation",
    cost: 300,
    duration: 12, // hours
    skillImprovement: {
      violence: 1,
      loyalty: 2
    },
    availableFor: ["muscle", "enforcer"]
  },
  {
    id: "stealth_training",
    name: "Stealth Training",
    description: "Learn advanced sneaking and lockpicking",
    cost: 250,
    duration: 8,
    skillImprovement: {
      stealth: 1,
      loyalty: 1
    },
    availableFor: ["thief", "driver"]
  },
  {
    id: "business_course",
    name: "Business Operations",
    description: "Understanding legitimate business operations",
    cost: 500,
    duration: 16,
    skillImprovement: {
      intelligence: 1,
      loyalty: 3
    },
    availableFor: ["dealer", "enforcer", "technician"]
  },
  {
    id: "loyalty_building",
    name: "Team Building Retreat",
    description: "Strengthen bonds and gang loyalty",
    cost: 400,
    duration: 6,
    skillImprovement: {
      loyalty: 5
    },
    availableFor: ["muscle", "thief", "dealer", "enforcer", "driver", "technician"]
  },
  {
    id: "advanced_tactics",
    name: "Advanced Tactical Training",
    description: "Military-grade tactical training",
    cost: 1000,
    duration: 24,
    skillImprovement: {
      violence: 2,
      intelligence: 1,
      loyalty: 3
    },
    availableFor: ["muscle", "enforcer"],
    prerequisite: { violence: 3 }
  }
];

// Betrayal Events and Triggers
const betrayalEvents = [
  {
    id: "police_informant",
    name: "Police Informant",
    description: "A gang member has been feeding information to the police",
    triggerConditions: {
      maxLoyalty: 30,
      minWantedLevel: 20
    },
    consequences: {
      policeRaid: true,
      wantedLevelIncrease: 15,
      moneyLoss: 0.20, // 20% of current money
      gangMemberLoss: 1
    },
    detectionChance: 70 // 70% chance to detect the betrayal
  },
  {
    id: "territory_sellout",
    name: "Territory Sellout",
    description: "A gang member sells territory information to rivals",
    triggerConditions: {
      maxLoyalty: 40,
      minTerritory: 2
    },
    consequences: {
      territoryLoss: 1,
      reputationLoss: 10,
      gangMemberLoss: 1,
      rivalAttack: true
    },
    detectionChance: 60
  },
  {
    id: "business_sabotage",
    name: "Business Sabotage",
    description: "A disloyal member sabotages your business operations",
    triggerConditions: {
      maxLoyalty: 25,
      minBusinesses: 1
    },
    consequences: {
      businessDamage: true,
      incomeLoss: 0.30, // 30% income loss for 3 days
      gangMemberLoss: 1
    },
    detectionChance: 50
  },
  {
    id: "coup_attempt",
    name: "Gang Coup",
    description: "Multiple members attempt to overthrow your leadership",
    triggerConditions: {
      maxLoyalty: 20,
      minGangMembers: 8
    },
    consequences: {
      gangSplit: true, // Lose 50% of gang members
      powerLoss: 50,
      reputationLoss: 25
    },
    detectionChance: 40
  }
];

// ==================== TERRITORY CONTROL SYSTEM ====================

// District Types with Different Benefits
const districtTypes = [
  {
    id: "residential_low",
    name: "Low-Income Residential",
    description: "Working-class neighborhoods with modest protection opportunities",
    baseIncome: 150,
    maxBusinesses: 3,
    riskLevel: "low",
    policePresence: 20,
    benefits: {
      drugSales: 1.2, // 20% bonus to drug operations
      recruitment: 1.3, // 30% better recruitment rates
      heatReduction: 0.1 // 10% less police attention
    },
    acquisitionCost: 8000,
    maintenanceCost: 200,
    category: "residential"
  },
  {
    id: "residential_middle",
    name: "Middle-Class Residential",
    description: "Suburban areas with better protection money potential",
    baseIncome: 300,
    maxBusinesses: 5,
    riskLevel: "medium",
    policePresence: 35,
    benefits: {
      protection: 1.4, // 40% better protection racket income
      legitimacy: 1.2, // 20% better business legitimacy
      recruitment: 1.1
    },
    acquisitionCost: 15000,
    maintenanceCost: 400,
    category: "residential"
  },
  {
    id: "residential_upscale",
    name: "Upscale Residential",
    description: "Wealthy neighborhoods with high-value targets but heavy security",
    baseIncome: 600,
    maxBusinesses: 4,
    riskLevel: "high",
    policePresence: 60,
    benefits: {
      protection: 1.8, // 80% better protection income
      heistRewards: 1.5, // 50% better heist payouts
      corruption: 1.3 // 30% more effective bribes
    },
    acquisitionCost: 35000,
    maintenanceCost: 800,
    category: "residential"
  },
  {
    id: "commercial_downtown",
    name: "Downtown Commercial",
    description: "Business district with shops, restaurants, and offices",
    baseIncome: 800,
    maxBusinesses: 8,
    riskLevel: "medium",
    policePresence: 45,
    benefits: {
      business: 1.5, // 50% better business income
      laundering: 1.4, // 40% better money laundering
      networking: 1.6 // 60% better faction relationships
    },
    acquisitionCost: 25000,
    maintenanceCost: 600,
    category: "commercial"
  },
  {
    id: "commercial_shopping",
    name: "Shopping District",
    description: "Retail area with stores, malls, and consumer businesses",
    baseIncome: 500,
    maxBusinesses: 6,
    riskLevel: "low",
    policePresence: 30,
    benefits: {
      theft: 1.3, // 30% better theft operations
      smuggling: 1.2, // 20% better smuggling
      business: 1.3
    },
    acquisitionCost: 18000,
    maintenanceCost: 350,
    category: "commercial"
  },
  {
    id: "industrial_warehouse",
    name: "Warehouse District",
    description: "Industrial area perfect for smuggling and large operations",
    baseIncome: 400,
    maxBusinesses: 4,
    riskLevel: "medium",
    policePresence: 25,
    benefits: {
      smuggling: 1.8, // 80% better smuggling operations
      weapons: 1.5, // 50% better weapons trafficking
      storage: 1.4 // 40% more storage capacity
    },
    acquisitionCost: 20000,
    maintenanceCost: 300,
    category: "industrial"
  },
  {
    id: "industrial_port",
    name: "Port District",
    description: "Docks and shipping facilities for international operations",
    baseIncome: 1000,
    maxBusinesses: 5,
    riskLevel: "high",
    policePresence: 50,
    benefits: {
      smuggling: 2.0, // 100% better smuggling
      international: 1.8, // 80% better international crime
      weapons: 1.6,
      corruption: 1.4
    },
    acquisitionCost: 50000,
    maintenanceCost: 1000,
    category: "industrial"
  },
  {
    id: "entertainment_nightlife",
    name: "Nightlife District",
    description: "Bars, clubs, and entertainment venues",
    baseIncome: 700,
    maxBusinesses: 6,
    riskLevel: "medium",
    policePresence: 40,
    benefits: {
      vice: 1.6, // 60% better vice operations
      recruitment: 1.4, // 40% better recruitment
      information: 1.5, // 50% better intel gathering
      laundering: 1.3
    },
    acquisitionCost: 30000,
    maintenanceCost: 500,
    category: "entertainment"
  }
];

// Protection Racket Businesses
const protectionBusinesses = [
  {
    id: "corner_store",
    name: "Corner Store",
    type: "retail",
    basePayment: 200,
    riskLevel: "low",
    description: "Small neighborhood convenience store",
    vulnerabilities: ["theft", "vandalism"],
    maxExtortion: 400,
    category: "retail"
  },
  {
    id: "restaurant",
    name: "Family Restaurant",
    type: "food",
    basePayment: 500,
    riskLevel: "medium",
    description: "Local dining establishment",
    vulnerabilities: ["health_violations", "supply_disruption"],
    maxExtortion: 1000,
    category: "food"
  },
  {
    id: "auto_shop",
    name: "Auto Repair Shop",
    type: "service",
    basePayment: 800,
    riskLevel: "medium",
    description: "Automotive repair and service",
    vulnerabilities: ["equipment_damage", "supplier_issues"],
    maxExtortion: 1500,
    category: "automotive"
  },
  {
    id: "nightclub",
    name: "Nightclub",
    type: "entertainment",
    basePayment: 1200,
    riskLevel: "high",
    description: "Popular nightlife venue",
    vulnerabilities: ["license_issues", "security_problems"],
    maxExtortion: 2500,
    category: "entertainment"
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    type: "medical",
    basePayment: 600,
    riskLevel: "low",
    description: "Local pharmacy and medical supplies",
    vulnerabilities: ["regulatory_issues", "theft"],
    maxExtortion: 1200,
    category: "medical"
  },
  {
    id: "construction_company",
    name: "Construction Company",
    type: "industrial",
    basePayment: 1500,
    riskLevel: "high",
    description: "Construction and contracting business",
    vulnerabilities: ["union_issues", "equipment_sabotage"],
    maxExtortion: 3000,
    category: "industrial"
  },
  {
    id: "jewelry_store",
    name: "Jewelry Store",
    type: "luxury",
    basePayment: 1000,
    riskLevel: "high",
    description: "High-end jewelry and watches",
    vulnerabilities: ["robbery", "security_breaches"],
    maxExtortion: 2000,
    category: "luxury"
  },
  {
    id: "shipping_company",
    name: "Shipping Company",
    type: "logistics",
    basePayment: 2000,
    riskLevel: "high",
    description: "Freight and logistics operations",
    vulnerabilities: ["cargo_theft", "dock_issues"],
    maxExtortion: 4000,
    category: "logistics"
  }
];

// Rival AI Gangs
const rivalGangs = [
  {
    id: "iron_wolves",
    name: "Iron Wolves MC",
    description: "Motorcycle gang specializing in drug trafficking",
    power: 150,
    territories: 2,
    specialties: ["drugs", "weapons"],
    aggressiveness: 0.7,
    color: "#8b4513",
    boss: "Steel Murphy",
    preferredDistricts: ["industrial_warehouse", "entertainment_nightlife"]
  },
  {
    id: "jade_serpents",
    name: "Jade Serpents",
    description: "Asian crime syndicate focused on smuggling",
    power: 200,
    territories: 3,
    specialties: ["smuggling", "tech_crime"],
    aggressiveness: 0.5,
    color: "#228b22",
    boss: "Master Liu",
    preferredDistricts: ["industrial_port", "commercial_downtown"]
  },
  {
    id: "crimson_brotherhood",
    name: "Crimson Brotherhood",
    description: "Violent street gang controlling drug corners",
    power: 120,
    territories: 1,
    specialties: ["violence", "territory_control"],
    aggressiveness: 0.9,
    color: "#dc143c",
    boss: "Blood Martinez",
    preferredDistricts: ["residential_low", "commercial_shopping"]
  },
  {
    id: "golden_eagles",
    name: "Golden Eagles",
    description: "Well-connected gang with political ties",
    power: 250,
    territories: 4,
    specialties: ["corruption", "white_collar"],
    aggressiveness: 0.3,
    color: "#ffd700",
    boss: "Don Aurelius",
    preferredDistricts: ["residential_upscale", "commercial_downtown"]
  },
  {
    id: "shadow_syndicate",
    name: "Shadow Syndicate",
    description: "Mysterious organization with unknown goals",
    power: 300,
    territories: 2,
    specialties: ["assassination", "espionage"],
    aggressiveness: 0.4,
    color: "#2f4f4f",
    boss: "The Phantom",
    preferredDistricts: ["industrial_port", "entertainment_nightlife"]
  }
];

// Corruption Targets
const corruptionTargets = [
  {
    id: "patrol_officer",
    name: "Patrol Officer",
    type: "police",
    baseCost: 500,
    influence: "low",
    benefits: {
      heatReduction: 0.1, // 10% less heat in controlled territories
      crimeBonus: 0.05, // 5% better crime success rates
      duration: 7 // days
    },
    description: "Beat cop who can look the other way",
    riskLevel: "low"
  },
  {
    id: "detective",
    name: "Detective",
    type: "police",
    baseCost: 2000,
    influence: "medium",
    benefits: {
      heatReduction: 0.25,
      evidenceDestruction: 0.3, // 30% chance to destroy evidence
      duration: 14
    },
    description: "Investigator who can lose files",
    riskLevel: "medium"
  },
  {
    id: "police_captain",
    name: "Police Captain",
    type: "police",
    baseCost: 8000,
    influence: "high",
    benefits: {
      heatReduction: 0.4,
      raidWarning: 0.8, // 80% chance of raid warnings
      duration: 30
    },
    description: "High-ranking officer with district authority",
    riskLevel: "high"
  },
  {
    id: "city_councilman",
    name: "City Councilman",
    type: "political",
    baseCost: 5000,
    influence: "medium",
    benefits: {
      businessLicense: 0.5, // 50% cheaper business costs
      zonePermits: 0.3, // 30% faster territory acquisition
      duration: 21
    },
    description: "Local politician with zoning influence",
    riskLevel: "medium"
  },
  {
    id: "judge",
    name: "District Judge",
    type: "judicial",
    baseCost: 15000,
    influence: "very_high",
    benefits: {
      sentenceReduction: 0.6, // 60% reduced jail time
      casesDismissed: 0.4, // 40% chance cases get dismissed
      duration: 60
    },
    description: "Judge who can influence court outcomes",
    riskLevel: "extreme"
  },
  {
    id: "mayor",
    name: "Mayor",
    type: "political",
    baseCost: 25000,
    influence: "extreme",
    benefits: {
      cityWideProtection: 0.3, // 30% less heat city-wide
      contractAccess: 0.5, // 50% better business opportunities
      duration: 90
    },
    description: "The mayor - ultimate political protection",
    riskLevel: "extreme"
  }
];

// Territory Events
const territoryEvents = [
  {
    id: "police_crackdown",
    name: "Police Crackdown",
    description: "Increased police presence in the area",
    effects: {
      heatIncrease: 0.3,
      incomeReduction: 0.2,
      duration: 7
    },
    probability: 0.15,
    category: "law_enforcement"
  },
  {
    id: "rival_encroachment",
    name: "Rival Gang Encroachment",
    description: "Another gang is trying to move into your territory",
    effects: {
      incomeReduction: 0.4,
      conflictRisk: 0.6,
      duration: 14
    },
    probability: 0.2,
    category: "gang_conflict"
  },
  {
    id: "business_closure",
    name: "Business Closure",
    description: "One of your protection racket businesses has closed",
    effects: {
      incomeReduction: 0.3,
      businessLoss: 1,
      duration: 30
    },
    probability: 0.1,
    category: "economic"
  },
  {
    id: "community_resistance",
    name: "Community Resistance",
    description: "Local residents are organizing against criminal activity",
    effects: {
      heatIncrease: 0.2,
      recruitmentPenalty: 0.3,
      duration: 21
    },
    probability: 0.12,
    category: "social"
  },
  {
    id: "opportunity_expansion",
    name: "Expansion Opportunity",
    description: "New businesses opening in the area",
    effects: {
      incomeIncrease: 0.25,
      businessOpportunity: 2,
      duration: 14
    },
    probability: 0.08,
    category: "opportunity"
  }
];

// ==================== ENHANCED ECONOMY FUNCTIONS ====================

// Business Management Functions
async function showBusinesses() {
  if (player.inJail) {
    showBriefNotification("Can't manage businesses while in jail!", 'danger');
    return;
  }
  
  let businessHTML = `
    <h2>Business Empire</h2>
    <p>Manage your legitimate business fronts and expand your economic influence.</p>
    <div style="margin: 15px 0; padding: 12px; border: 1px solid #7f8c8d; border-radius: 8px; background: rgba(0,0,0,0.25); display: flex; gap: 12px; align-items: center;">
      <div style="flex:1; color:#ecf0f1;">
        <strong>Bookie Service</strong><br>
        Automatically collects business income and gang tribute. Service fee applies hourly.
      </div>
      <div>
        <button onclick="toggleBookieHire()" style="background:${player.services && player.services.bookieHired ? '#e74c3c' : '#2ecc71'}; color:white; padding:10px 14px; border:none; border-radius:6px; cursor:pointer;">
          ${player.services && player.services.bookieHired ? 'Dismiss Bookie' : 'Hire Bookie ($5,000/day)'}
        </button>
      </div>
    </div>
  `;
  
  // Show owned businesses
  if (player.businesses && player.businesses.length > 0) {
    businessHTML += `
      <h3>Your Businesses</h3>
      <div style="margin: 10px 0;">
        <button onclick="collectAllBusinessIncome()" 
            style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.1em; box-shadow: 0 3px 10px rgba(46,204,113,0.3);">
          💰 Collect All Income
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0;">
        ${player.businesses.map((business, index) => {
          const businessType = businessTypes.find(bt => bt.id === business.type);
          const currentIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1));
          const upgradePrice = business.level < businessType.maxLevel ? 
            Math.floor(businessType.basePrice * Math.pow(businessType.upgradeMultiplier, business.level)) : null;
          
          // Unique upgrade flavor text for illegal businesses
          const upgradeFlavorText = {
            counterfeiting: ['Better printing plates', 'UV-resistant ink', 'Distribution network', 'Master engraver hired'],
            druglab: ['Better equipment', 'Chemist recruited', 'Hidden ventilation', 'Industrial-scale production'],
            chopshop: ['Better tools', 'Expert mechanic hired', 'VIN removal tech', 'International buyer network']
          };
          const flavorTexts = upgradeFlavorText[business.type] || [];
          const nextUpgradeText = business.level < businessType.maxLevel && flavorTexts[business.level - 1] 
            ? `<p style="margin: 5px 0; color: #f39c12; font-style: italic;">Next: ${flavorTexts[business.level - 1]}</p>` : '';
          
          // Max level perk display for illegal businesses
          const maxLevelPerks = {
            counterfeiting: '🏆 MAX LEVEL PERK: +5% laundering conversion rate on all methods',
            druglab: '🏆 MAX LEVEL PERK: Drug trade goods cost 35% less in the store',
            chopshop: '🏆 MAX LEVEL PERK: +55% bonus on all stolen car sales'
          };
          const isMaxLevel = business.level >= businessType.maxLevel;
          const maxPerkText = isMaxLevel && maxLevelPerks[business.type] 
            ? `<p style="margin: 8px 0; padding: 8px; background: rgba(241, 196, 15, 0.2); border: 1px solid #f1c40f; border-radius: 5px; color: #f1c40f; font-weight: bold;">${maxLevelPerks[business.type]}</p>` : '';
          
          // Color coding for illegal vs legitimate businesses
          const borderColor = businessType.paysDirty ? '#e74c3c' : '#3498db';
          const headerColor = businessType.paysDirty ? '#e74c3c' : '#3498db';
          
          return `
            <div style="background: rgba(44, 62, 80, 0.8); border-radius: 15px; padding: 20px; border: 2px solid ${borderColor};">
              <h4 style="color: ${headerColor}; margin-bottom: 10px;">${business.name}${businessType.paysDirty ? ' ⚠️' : ''}</h4>
              <p style="color: #ecf0f1; margin-bottom: 15px;">${businessType.description}</p>
              
              <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Level:</strong> ${business.level}/${businessType.maxLevel}</p>
                <p style="margin: 5px 0;"><strong>Daily Income:</strong> $${currentIncome.toLocaleString()}${businessType.paysDirty ? ' <span style="color:#e74c3c;">(DIRTY MONEY)</span>' : ''}</p>
                <p style="margin: 5px 0;"><strong>Laundering Capacity:</strong> $${(businessType.launderingCapacity * business.level).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Legitimacy:</strong> ${businessType.legitimacy}%</p>
                ${businessType.paysDirty ? `<p style="margin: 5px 0; color: #e67e22;"><strong>Synergy:</strong> ${business.type === 'counterfeiting' ? '+3% laundering rate' : business.type === 'druglab' ? 'Drug trade goods discount + payout boost' : 'Stolen car sale bonus'}</p>` : ''}
                ${nextUpgradeText}
                ${maxPerkText}
              </div>
              
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="collectBusinessIncome(${index})" 
                    style="background: #2ecc71; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                  Collect Income
                </button>
                ${business.level < businessType.maxLevel ? 
                  `<button onclick="upgradeBusiness(${index})" 
                      style="background: #f39c12; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;"
                      ${player.money < upgradePrice ? 'disabled title="Not enough money"' : ''}>
                    Upgrade ($${upgradePrice.toLocaleString()})
                  </button>` : 
                  '<span style="color: #95a5a6; font-style: italic;">Max Level</span>'
                }
                <button onclick="sellBusiness(${index})" 
                    style="background: #e74c3c; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                  Sell Business
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    businessHTML += `
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: rgba(52, 73, 94, 0.6); border-radius: 15px; border: 2px solid #f39c12;">
        <h3 style="color: #f39c12; margin-bottom: 15px;">No Businesses Owned</h3>
        <p style="color: #ecf0f1; margin-bottom: 20px;">Start building your business empire! Legitimate fronts provide steady income and money laundering opportunities.</p>
      </div>
    `;
  }
  
  // Show available businesses for purchase
  businessHTML += `
    <h3>Available Businesses</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0;">
      ${businessTypes.map(businessType => {
        const owned = player.businesses && player.businesses.some(b => b.type === businessType.id);
        return `
          <div style="background: rgba(52, 73, 94, 0.6); border-radius: 15px; padding: 20px; border: 2px solid ${owned ? '#95a5a6' : '#2ecc71'};">
            <h4 style="color: ${owned ? '#95a5a6' : '#2ecc71'}; margin-bottom: 10px;">${businessType.name}</h4>
            <p style="color: #ecf0f1; margin-bottom: 15px;">${businessType.description}</p>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Price:</strong> $${businessType.basePrice.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Base Income:</strong> $${businessType.baseIncome.toLocaleString()}/day${businessType.paysDirty ? ' <span style="color:#e74c3c;">(DIRTY MONEY)</span>' : ''}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${businessType.category}</p>
              <p style="margin: 5px 0;"><strong>Max Level:</strong> ${businessType.maxLevel}</p>
            </div>
            
            ${owned ? 
              '<span style="color: #95a5a6; font-style: italic;">Already Owned</span>' :
              `<button onclick="purchaseBusiness('${businessType.id}')" 
                  style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;"
                  ${player.money < businessType.basePrice ? 'disabled title="Not enough money"' : ''}>
                Purchase Business
              </button>`
            }
          </div>
        `;
      }).join('')}
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
              border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("business-content").innerHTML = businessHTML;
  hideAllScreens();
  document.getElementById("business-screen").style.display = "block";
}

async function purchaseBusiness(businessTypeId) {
  const businessType = businessTypes.find(bt => bt.id === businessTypeId);
  if (!businessType) return;
  
  if (player.money < businessType.basePrice) {
    showBriefNotification("You don't have enough money to purchase this business!", 'danger');
    return;
  }
  
  if (!player.businesses) player.businesses = [];
  
  // Check if already owned
  if (player.businesses.some(b => b.type === businessTypeId)) {
    showBriefNotification("You already own this type of business!", 'warning');
    return;
  }
  
  player.money -= businessType.basePrice;
  player.businesses.push({
    type: businessTypeId,
    name: businessType.name,
    level: 1,
    lastCollection: Date.now()
  });
  
  showBriefNotification(`Purchased ${businessType.name}! Income starts now.`, 'success');
  logAction(`You sign the papers and shake hands on a new business venture. ${businessType.name} is now under your control - legitimate money incoming!`);
  
  updateUI();
  showBusinesses();
}

async function upgradeBusiness(businessIndex) {
  if (!player.businesses || businessIndex >= player.businesses.length) return;
  
  const business = player.businesses[businessIndex];
  const businessType = businessTypes.find(bt => bt.id === business.type);
  
  if (business.level >= businessType.maxLevel) {
    showBriefNotification("This business is already at maximum level!", 'warning');
    return;
  }
  
  const upgradePrice = Math.floor(businessType.basePrice * Math.pow(businessType.upgradeMultiplier, business.level));
  
  if (player.money < upgradePrice) {
    showBriefNotification("Not enough money to upgrade this business!", 'danger');
    return;
  }
  
  player.money -= upgradePrice;
  business.level++;
  
  const newIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1));
  
  showBriefNotification(`${business.name} upgraded to Lv${business.level}! Income: $${newIncome.toLocaleString()}/day`, 'success');
  
  // Unique upgrade narration for illegal businesses
  const upgradeNarrations = {
    counterfeiting: [
      'New printing plates installed — the bills look even more authentic now.',
      'UV-resistant ink sourced from overseas. These fakes will pass any scanner.',
      'You expand the distribution network. More channels, more money.',
      'A master engraver joins your operation. The counterfeits are indistinguishable from the real thing.',
      'Your Counterfeiting Operation is now a world-class printing press. Even banks can\'t tell the difference.'
    ],
    druglab: [
      'Better cooking equipment means purer product and higher margins.',
      'A chemistry PhD dropout joins your team. Product quality skyrockets.',
      'Hidden ventilation installed — no more suspicious chemical smells.',
      'Industrial-scale production begins. You\'re now a major supplier.',
      'Your Drug Lab is a state-of-the-art production facility. The cartel is impressed.'
    ],
    chopshop: [
      'Professional-grade tools speed up the dismantling process.',
      'An expert mechanic joins — parts are now stripped with surgical precision.',
      'Advanced VIN removal technology makes every car untraceable.',
      'International buyer network established — premium prices for premium parts.',
      'Your Chop Shop is the most efficient in the city. Cars disappear without a trace.'
    ]
  };
  
  const narrations = upgradeNarrations[business.type];
  if (narrations && narrations[business.level - 1]) {
    logAction(`🔧 ${narrations[business.level - 1]} (${business.name} Level ${business.level})`);
  } else {
    logAction(`You invest in improvements for ${business.name}. New equipment, better staff, higher profits - the empire grows stronger (Level ${business.level}).`);
  }
  
  // Max level perk activation notification
  if (business.level >= businessType.maxLevel && businessType.paysDirty) {
    const perkMessages = {
      counterfeiting: '🏆 MAX LEVEL REACHED! Your Counterfeiting Operation now provides +5% laundering conversion rate!',
      druglab: '🏆 MAX LEVEL REACHED! Your Drug Lab now provides a massive 35% discount on drug trade goods!',
      chopshop: '🏆 MAX LEVEL REACHED! Your Chop Shop now gives +55% bonus on all stolen car sales!'
    };
    if (perkMessages[business.type]) {
      logAction(perkMessages[business.type]);
      alert(perkMessages[business.type]);
    }
  }
  
  updateUI();
  showBusinesses();
}

async function collectBusinessIncome(businessIndex) {
  if (!player.businesses || businessIndex >= player.businesses.length) return;
  
  const business = player.businesses[businessIndex];
  const businessType = businessTypes.find(bt => bt.id === business.type);
  
  const currentTime = Date.now();
  const lastCollection = business.lastCollection || currentTime;
  const hoursElapsed = Math.floor((currentTime - lastCollection) / (1000 * 60 * 60));
  
  if (hoursElapsed < 1) {
    showBriefNotification("No income available yet. Check back in an hour.", 'warning');
    return;
  }
  
  const hourlyIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1) / 24);
  const totalIncome = hourlyIncome * Math.min(hoursElapsed, 48); // Cap at 48 hours
  
  // Illegal businesses (Counterfeiting, Drug Lab, Chop Shop) pay dirty money; all other businesses pay clean money
  if (businessType.paysDirty) {
    player.dirtyMoney = (player.dirtyMoney || 0) + totalIncome;
  } else {
    player.money += totalIncome;
  }
  business.lastCollection = currentTime;
  
  // Track statistics
  updateStatistic('businessIncomeCollected');
  updateStatistic('totalMoneyEarned', totalIncome);
  
  const dirtyLabel = businessType.paysDirty ? ' (dirty — must be laundered!)' : '';
  showBriefNotification(`+$${totalIncome.toLocaleString()}${dirtyLabel} from ${business.name} (${hoursElapsed}h)`, 'success');
  logAction(`${business.name} delivers another profitable period (+$${totalIncome.toLocaleString()}${dirtyLabel}).`);
  
  updateUI();
  showBusinesses();
}

// Collect income from ALL businesses at once
async function collectAllBusinessIncome() {
  if (!player.businesses || player.businesses.length === 0) return;
  
  let totalClean = 0;
  let totalDirty = 0;
  let collected = 0;
  const currentTime = Date.now();
  
  for (let i = 0; i < player.businesses.length; i++) {
    const business = player.businesses[i];
    const businessType = businessTypes.find(bt => bt.id === business.type);
    if (!businessType) continue;
    
    const lastCollection = business.lastCollection || currentTime;
    const hoursElapsed = Math.floor((currentTime - lastCollection) / (1000 * 60 * 60));
    if (hoursElapsed < 1) continue;
    
    const hourlyIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1) / 24);
    const totalIncome = hourlyIncome * Math.min(hoursElapsed, 48);
    
    if (businessType.paysDirty) {
      player.dirtyMoney = (player.dirtyMoney || 0) + totalIncome;
      totalDirty += totalIncome;
    } else {
      player.money += totalIncome;
      totalClean += totalIncome;
    }
    business.lastCollection = currentTime;
    collected++;
    
    updateStatistic('businessIncomeCollected');
    updateStatistic('totalMoneyEarned', totalIncome);
  }
  
  if (collected === 0) {
    showBriefNotification("No income available yet. Check back in an hour.", 'warning');
    return;
  }
  
  let msg = `Collected from ${collected} business${collected > 1 ? 'es' : ''}:`;
  if (totalClean > 0) msg += ` +$${totalClean.toLocaleString()} clean`;
  if (totalDirty > 0) msg += ` +$${totalDirty.toLocaleString()} dirty`;
  
  showBriefNotification(msg, 'success');
  logAction(`💰 Collected all business income in one sweep. ${totalClean > 0 ? `$${totalClean.toLocaleString()} clean` : ''}${totalClean > 0 && totalDirty > 0 ? ', ' : ''}${totalDirty > 0 ? `$${totalDirty.toLocaleString()} dirty` : ''}.`);
  
  updateUI();
  showBusinesses();
}

async function sellBusiness(businessIndex) {
  if (!player.businesses || businessIndex >= player.businesses.length) return;
  
  const business = player.businesses[businessIndex];
  const businessType = businessTypes.find(bt => bt.id === business.type);
  
  const salePrice = Math.floor(businessType.basePrice * 0.6 * business.level); // 60% of investment back
  
  if (!await ui.confirm(`Are you sure you want to sell ${business.name}?<br><br>You will receive: $${salePrice.toLocaleString()}<br><br>This action cannot be undone.`)) {
    return;
  }
  
  player.money += salePrice;
  player.businesses.splice(businessIndex, 1);
  
  showBriefNotification(`Sold ${business.name} for $${salePrice.toLocaleString()}`, 'success');
  logAction(`You sign the final papers and hand over the keys. ${business.name} is no longer yours, but the cash cushions the loss (+$${salePrice.toLocaleString()}).`);
  
  updateUI();
  showBusinesses();
}

// Loan Shark Functions
async function showLoanShark() {
  if (player.inJail) {
    showBriefNotification("Can't visit the loan shark while in jail!", 'danger');
    return;
  }
  
  let loanHTML = `
    <h2>🦈 Tony's Loan Office</h2>
    <p style="color: #f39c12;">Need cash fast? Tony's got you covered... for a price.</p>
  `;
  
  // Show active loans
  if (player.activeLoans && player.activeLoans.length > 0) {
    loanHTML += `
      <h3 style="color: #e74c3c;">Active Loans</h3>
      <div style="margin: 20px 0;">
        ${player.activeLoans.map((loan, index) => {
          const daysRemaining = Math.ceil((loan.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysRemaining < 0;
          
          return `
            <div style="background: rgba(231, 76, 60, 0.3); border-radius: 10px; padding: 15px; margin: 10px 0; border: 2px solid #e74c3c;">
              <h4>${loan.name}</h4>
              <p><strong>Amount Owed:</strong> $${loan.amountOwed.toLocaleString()}</p>
              <p><strong>Original Loan:</strong> $${loan.originalAmount.toLocaleString()}</p>
              <p style="color: ${isOverdue ? '#e74c3c' : '#f39c12'};">
                <strong>Status:</strong> ${isOverdue ? `OVERDUE by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
              </p>
              <div style="margin-top: 10px;">
                <button onclick="repayLoan(${index})" 
                    style="background: #2ecc71; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                  Repay Loan ($${loan.amountOwed.toLocaleString()})
                </button>
                ${player.money < loan.amountOwed && player.money > 0 ? 
                  `<button onclick="repayLoan(${index})" 
                      style="background: #f39c12; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    Pay What You Can ($${player.money.toLocaleString()})
                  </button>` : ''
                }
                ${isOverdue ? 
                  '<span style="color: #e74c3c; font-weight: bold;">OVERDUE - Consequences incoming!</span>' : 
                  ''
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Show available loans
  loanHTML += `
    <h3>Available Loans</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
      ${loanOptions.map(loanOption => {
        const canTake = checkLoanEligibility(loanOption);
        const existingLoan = player.activeLoans && player.activeLoans.find(l => l.id === loanOption.id && loanOption.maxLoans === 1);
        
        return `
          <div style="background: rgba(52, 73, 94, 0.6); border-radius: 15px; padding: 20px; border: 2px solid ${canTake && !existingLoan ? '#2ecc71' : '#95a5a6'};">
            <h4 style="color: ${canTake && !existingLoan ? '#2ecc71' : '#95a5a6'};">${loanOption.name}</h4>
            <p style="color: #ecf0f1; margin-bottom: 15px;">${loanOption.description}</p>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${loanOption.amount.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Interest Rate:</strong> ${(loanOption.interestRate * 100).toFixed(0)}% per week</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${loanOption.duration} days</p>
              <p style="margin: 5px 0;"><strong>Risk Level:</strong> 
                <span style="color: ${loanOption.riskLevel === 'low' ? '#2ecc71' : loanOption.riskLevel === 'medium' ? '#f39c12' : loanOption.riskLevel === 'high' ? '#e67e22' : '#e74c3c'};">
                  ${loanOption.riskLevel.toUpperCase()}
                </span>
              </p>
              ${loanOption.collateralRequired ? '<p style="margin: 5px 0; color: #e74c3c;"><strong>Collateral Required</strong></p>' : ''}
            </div>
            
            ${existingLoan ? 
              '<span style="color: #95a5a6; font-style: italic;">Already have this loan type</span>' :
              canTake ? 
                `<button onclick="takeLoan('${loanOption.id}')" 
                    style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                  Take Loan
                </button>` :
                '<span style="color: #e74c3c; font-style: italic;">Requirements not met</span>'
            }
          </div>
        `;
      }).join('')}
    </div>
    
    <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; border: 1px solid #e74c3c; margin: 20px 0;">
      <h4 style="color: #e74c3c;">⚠️ WARNING</h4>
      <p style="color: #ecf0f1;">Failing to repay loans on time will result in serious consequences including reputation loss, health damage, and potentially losing gang members or property. Tony doesn't mess around.</p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
              border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("loan-shark-content").innerHTML = loanHTML;
  hideAllScreens();
  document.getElementById("loan-shark-screen").style.display = "block";
}

function checkLoanEligibility(loanOption) {
  if (loanOption.minReputation && player.reputation < loanOption.minReputation) return false;
  if (loanOption.minPower && player.power < loanOption.minPower) return false;
  return true;
}

async function takeLoan(loanId) {
  const loanOption = loanOptions.find(lo => lo.id === loanId);
  if (!loanOption) return;
  
  if (!checkLoanEligibility(loanOption)) {
    showBriefNotification("You don't meet the requirements for this loan!", 'danger');
    return;
  }
  
  if (!player.activeLoans) player.activeLoans = [];
  
  // Check if already have this type of loan (for limited loans)
  if (loanOption.maxLoans && player.activeLoans.filter(l => l.id === loanId).length >= loanOption.maxLoans) {
    showBriefNotification("You already have the maximum number of this loan type!", 'warning');
    return;
  }
  
  const totalOwed = Math.floor(loanOption.amount * (1 + loanOption.interestRate * (loanOption.duration / 7)));
  const dueDate = Date.now() + (loanOption.duration * 24 * 60 * 60 * 1000);
  
  if (!await ui.confirm(`Confirm loan details:<br><br>Loan Amount: $${loanOption.amount.toLocaleString()}<br>Total to Repay: $${totalOwed.toLocaleString()}<br>Due Date: ${Math.ceil(loanOption.duration)} days from now<br><br>Are you sure you want to take this loan?`)) {
    return;
  }
  
  player.money += loanOption.amount;
  player.activeLoans.push({
    id: loanId,
    name: loanOption.name,
    originalAmount: loanOption.amount,
    amountOwed: totalOwed,
    dueDate: dueDate,
    riskLevel: loanOption.riskLevel
  });
  
  showBriefNotification(`Loan approved! +$${loanOption.amount.toLocaleString()} — repay $${totalOwed.toLocaleString()} in ${loanOption.duration} days`, 'success');
  logAction(`Tony slides the cash across the table with a knowing smile. Easy money... for now. The clock starts ticking on your ${loanOption.name} (+$${loanOption.amount.toLocaleString()}).`);
  
  updateUI();
  showLoanShark();
}

function repayLoan(loanIndex) {
  if (!player.activeLoans || loanIndex >= player.activeLoans.length) return;
  
  const loan = player.activeLoans[loanIndex];
  
  if (player.money < loan.amountOwed) {
    // Offer partial repayment
    const partialAmount = Math.min(player.money, loan.amountOwed);
    if (partialAmount <= 0) {
      alert("You don't have any money to put towards this loan!");
      return;
    }
    const partialConfirm = confirm(`You don't have enough to pay the full $${loan.amountOwed.toLocaleString()}.\n\nPay $${partialAmount.toLocaleString()} (all your cash) to reduce the debt?\n\nRemaining after payment: $${(loan.amountOwed - partialAmount).toLocaleString()}`);
    if (!partialConfirm) return;
    
    player.money -= partialAmount;
    loan.amountOwed -= partialAmount;
    
    showBriefNotification(`Partial payment of $${partialAmount.toLocaleString()}. Remaining: $${loan.amountOwed.toLocaleString()}`, 'warning');
    logAction(`🤝 You hand over what you can — $${partialAmount.toLocaleString()}. Tony nods. "It's a start." You still owe $${loan.amountOwed.toLocaleString()}.`);
    
    updateUI();
    showLoanShark();
    return;
  }
  
  player.money -= loan.amountOwed;
  player.activeLoans.splice(loanIndex, 1);
  player.reputation += 2;
  
  alert(`Loan repaid! You paid $${loan.amountOwed.toLocaleString()} to clear your debt. Your reputation with the underworld improves.`);
  logAction(`🤝 You slide the money back to Tony with interest. He nods approvingly - you're good for your word. Reputation intact, debt cleared (-$${loan.amountOwed.toLocaleString()}).`);
  
  updateUI();
  showLoanShark();
}

// Money Laundering Functions
function showMoneyLaundering() {
  if (player.inJail) {
    alert("You can't launder money while you're in jail!");
    return;
  }
  
  if (!player.dirtyMoney) player.dirtyMoney = 0;
  
  let launderHTML = `
    <h2>💧 Money Laundering</h2>
    <p>Clean your dirty money through various legitimate channels.</p>
    
    <div style="background: rgba(52, 73, 94, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0; border: 2px solid #f39c12;">
      <h3>Current Status</h3>
      <p><strong>Dirty Money:</strong> $${player.dirtyMoney.toLocaleString()}</p>
      <p><strong>Clean Money:</strong> $${player.money.toLocaleString()}</p>
      <p><strong>Suspicion Level:</strong> ${player.suspicionLevel || 0}%</p>
    </div>
  `;
  
  if (player.dirtyMoney <= 0) {
    launderHTML += `
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: rgba(52, 73, 94, 0.6); border-radius: 15px; border: 2px solid #2ecc71;">
        <h3 style="color: #2ecc71; margin-bottom: 15px;">All Money Clean</h3>
        <p style="color: #ecf0f1;">You currently have no dirty money to launder. Earn some through illegal activities first!</p>
      </div>
    `;
  } else {
    launderHTML += `
      <h3>Laundering Methods</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin: 20px 0;">
        ${launderingMethods.map(method => {
          const canUse = checkLaunderingEligibility(method);
          const estimatedClean = Math.floor(Math.min(player.dirtyMoney, method.maxAmount) * method.cleanRate);
          
          return `
            <div style="background: rgba(52, 73, 94, 0.6); border-radius: 15px; padding: 20px; border: 2px solid ${canUse ? '#2ecc71' : '#95a5a6'};">
              <h4 style="color: ${canUse ? '#2ecc71' : '#95a5a6'};">${method.name}</h4>
              <p style="color: #ecf0f1; margin-bottom: 15px;">${method.description}</p>
              
              <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Clean Rate:</strong> ${(method.cleanRate * 100).toFixed(0)}%</p>
                <p style="margin: 5px 0;"><strong>Time Required:</strong> ${method.timeRequired} hours</p>
                <p style="margin: 5px 0;"><strong>Suspicion Risk:</strong> ${method.suspicionRisk}%</p>
                <p style="margin: 5px 0;"><strong>Range:</strong> $${method.minAmount.toLocaleString()} - $${method.maxAmount.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Energy Cost:</strong> ${method.energyCost}</p>
                ${method.businessRequired ? `<p style="margin: 5px 0; color: #f39c12;"><strong>Requires:</strong> ${businessTypes.find(bt => bt.id === method.businessRequired)?.name || 'Business'}</p>` : ''}
              </div>
              
              ${canUse ? 
                `<input type="number" id="launder-amount-${method.id}" placeholder="Amount to launder" 
                    min="${method.minAmount}" max="${Math.min(player.dirtyMoney, method.maxAmount)}" 
                    style="width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #bdc3c7;">
                <p style="margin: 5px 0; color: #2ecc71;"><strong>Estimated Clean:</strong> Up to $${estimatedClean.toLocaleString()}</p>
                <button onclick="startLaundering('${method.id}')" 
                    style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                  Start Laundering
                </button>` :
                '<span style="color: #e74c3c; font-style: italic;">Requirements not met</span>'
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  launderHTML += `
    <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; border: 1px solid #e74c3c; margin: 20px 0;">
      <h4 style="color: #e74c3c;">⚠️ NOTICE</h4>
      <p style="color: #ecf0f1;">Money laundering carries risks. High suspicion levels may attract law enforcement attention. Choose your methods carefully and don't get greedy.</p>
    </div>
    
    <div style="background: rgba(46, 204, 113, 0.15); padding: 20px; border-radius: 10px; border: 1px solid #2ecc71; margin: 20px 0;">
      <h4 style="color: #2ecc71;">💡 TIPS</h4>
      <p style="color: #ecf0f1;">• The <strong>Money Laundering</strong> job (under Jobs) also converts dirty money to clean money at 80-95% rates.</p>
      <p style="color: #ecf0f1;">• Owning a <strong>Counterfeiting Operation</strong> business gives +3% conversion rate on the Money Laundering job.</p>
      <p style="color: #ecf0f1;">• Dirty money jobs (Bank Job, Counterfeiting Money) increase your suspicion level — launder regularly!</p>
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
              border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("money-laundering-content").innerHTML = launderHTML;
  hideAllScreens();
  document.getElementById("money-laundering-screen").style.display = "block";
}

function checkLaunderingEligibility(method) {
  if (method.minReputation && player.reputation < method.minReputation) return false;
  if (method.businessRequired && (!player.businesses || !player.businesses.some(b => b.type === method.businessRequired))) return false;
  if (method.oneTimeSetupCost && !player.launderingSetups) {
    if (player.money < method.oneTimeSetupCost) return false;
  }
  if (player.energy < method.energyCost) return false;
  return true;
}

function startLaundering(methodId) {
  const method = launderingMethods.find(m => m.id === methodId);
  if (!method) return;
  
  const amountInput = document.getElementById(`launder-amount-${methodId}`);
  const amount = parseInt(amountInput.value);
  
  if (!amount || amount < method.minAmount || amount > method.maxAmount) {
    alert(`Please enter a valid amount between $${method.minAmount.toLocaleString()} and $${method.maxAmount.toLocaleString()}`);
    return;
  }
  
  if (amount > player.dirtyMoney) {
    alert("You don't have enough dirty money to launder this amount!");
    return;
  }
  
  if (player.energy < method.energyCost) {
    alert("You don't have enough energy for this laundering operation!");
    return;
  }
  
  // One-time setup cost
  if (method.oneTimeSetupCost && (!player.launderingSetups || !player.launderingSetups.includes(methodId))) {
    if (player.money < method.oneTimeSetupCost) {
      alert(`You need $${method.oneTimeSetupCost.toLocaleString()} for the initial setup of this laundering method!`);
      return;
    }
    player.money -= method.oneTimeSetupCost;
    if (!player.launderingSetups) player.launderingSetups = [];
    player.launderingSetups.push(methodId);
    alert(`Setup complete! Paid $${method.oneTimeSetupCost.toLocaleString()} for ${method.name} setup.`);
  }
  
  player.energy -= method.energyCost;
  player.dirtyMoney -= amount;
  
  // Calculate success and clean amount
  const suspicionRoll = Math.random() * 100;
  const currentSuspicion = player.suspicionLevel || 0;
  let adjustedSuspicionRisk = method.suspicionRisk + (currentSuspicion * 0.5);
  
  // Utility item: Burner Phone reduces suspicion risk by 15%
  if (hasUtilityItem('Burner Phone')) {
    adjustedSuspicionRisk *= 0.85;
    logAction(`📱 Your Burner Phone keeps communications untraceable — suspicion risk reduced.`);
  }
  
  if (suspicionRoll < adjustedSuspicionRisk) {
    // Caught! Lose money and gain suspicion
    const lossPercentage = 0.3 + (Math.random() * 0.4); // 30-70% loss
    const lost = Math.floor(amount * lossPercentage);
    const suspicionGain = 10 + Math.floor(Math.random() * 15);
    
    player.suspicionLevel = (player.suspicionLevel || 0) + suspicionGain;
    player.wantedLevel += Math.floor(suspicionGain / 2);
    
    alert(`Laundering operation compromised! Lost $${lost.toLocaleString()} and gained ${suspicionGain} suspicion. Law enforcement is getting closer.`);
    logAction(`The operation goes sideways! Suspicious transactions trigger alerts and your money vanishes into bureaucratic black holes. The heat is rising (-$${lost.toLocaleString()}, +${suspicionGain} suspicion).`);
  } else {
    // Success! Clean the money
    const cleanAmount = Math.floor(amount * method.cleanRate);
    const suspicionGain = Math.floor(method.suspicionRisk * 0.1); // Small suspicion even on success
    
    player.money += cleanAmount;
    player.suspicionLevel = (player.suspicionLevel || 0) + suspicionGain;
    
    // Schedule completion (for now, instant completion)
    alert(`Laundering successful! Cleaned $${cleanAmount.toLocaleString()} through ${method.name}. Operation completed.`);
    logAction(`💧 Money flows through legitimate channels like water through a sieve. The dirty cash emerges clean and untraceable (+$${cleanAmount.toLocaleString()} clean money).`);
  }
  
  updateUI();
  showMoneyLaundering();
}

// ==================== GANG MANAGEMENT OVERHAUL FUNCTIONS ====================

// Enhanced Gang Screen with Specialist Management
function showGang() {
  if (player.inJail) {
    alert("You can't manage your gang while you're in jail!");
    return;
  }
  
  let gangHTML = `
    <h2>Gang Management</h2>
    <p>Command your criminal organization and assign specialists to operations.</p>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
      
      <!-- Gang Overview -->
      <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; border: 2px solid #3498db;">
        <h3 style="color: #3498db;">Gang Overview</h3>
        <div style="margin: 10px 0;">
          <strong>Total Members:</strong> ${player.gang.gangMembers.length} / ${calculateMaxGangMembers()}<br>
          <strong>Average Loyalty:</strong> ${getAverageLoyalty()}%<br>
          <strong>Gang Power:</strong> ${calculateGangPower()}<br>
          <strong>Active Operations:</strong> ${player.gang.activeOperations.length}<br>
          <strong>In Training:</strong> ${player.gang.trainingQueue.length}
        </div>
        
        <div style="margin: 15px 0;">
          <button onclick="showRecruitment()" style="background: #2ecc71; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            Recruit Members
          </button>
          <button onclick="collectTribute()" style="background: #f39c12; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
            Collect Tribute
          </button>
        </div>
      </div>
      
      <!-- Gang Operations -->
      <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; border: 2px solid #e74c3c;">
        <h3 style="color: #e74c3c;">Gang Operations</h3>
        ${generateGangOperationsHTML()}
      </div>
    </div>
    
    <!-- Gang Members List -->
    <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; border: 2px solid #9b59b6; margin: 20px 0;">
      <h3 style="color: #9b59b6;">Gang Members</h3>
      ${generateGangMembersHTML()}
    </div>
    
    <!-- Training Programs -->
    <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; border: 2px solid #1abc9c; margin: 20px 0;">
      <h3 style="color: #1abc9c;">🎓 Training Programs</h3>
      ${generateTrainingProgramsHTML()}
    </div>
    
    <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; margin-top: 20px;">
      Back to SafeHouse
    </button>
  `;
  
  document.getElementById("gang-content").innerHTML = gangHTML;
  hideAllScreens();
  document.getElementById("gang-screen").style.display = "block";
  
  // Check for betrayals
  checkForBetrayals();
}

// Crew Details screen - detailed gang member management with individual stats
function showGangManagementScreen() {
  if (player.inJail) {
    showBriefNotification("You can't manage your gang while you're in jail!", 'warning');
    return;
  }
  
  const members = player.gang.gangMembers;
  const maxMembers = calculateMaxGangMembers();
  
  let crewHTML = `
    <h2>👥 Crew Details</h2>
    <p>Manage individual crew members, boost loyalty, and assign specializations.</p>
    
    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
      <div style="background: rgba(52,73,94,0.8); padding: 12px 20px; border-radius: 8px; border: 1px solid #3498db;">
        <strong style="color: #3498db;">Roster:</strong> ${members.length} / ${maxMembers}
      </div>
      <div style="background: rgba(52,73,94,0.8); padding: 12px 20px; border-radius: 8px; border: 1px solid ${getAverageLoyalty() > 60 ? '#2ecc71' : '#e74c3c'};">
        <strong style="color: #f39c12;">Avg Loyalty:</strong> ${getAverageLoyalty()}%
      </div>
      <div style="background: rgba(52,73,94,0.8); padding: 12px 20px; border-radius: 8px; border: 1px solid #9b59b6;">
        <strong style="color: #9b59b6;">Total Power:</strong> ${calculateGangPower()}
      </div>
    </div>
  `;
  
  if (members.length === 0) {
    crewHTML += `<div style="text-align:center; padding:40px; background:rgba(44,62,80,0.6); border-radius:10px;">
      <p style="font-size:1.2em;">No crew members yet.</p>
      <button onclick="showRecruitment()" style="background:#2ecc71; color:white; padding:12px 25px; border:none; border-radius:8px; cursor:pointer; font-size:1.1em; margin-top:10px;">
        Recruit Your First Member
      </button>
    </div>`;
  } else {
    crewHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">';
    
    members.forEach((member, index) => {
      const loyaltyColor = member.loyalty > 70 ? '#2ecc71' : member.loyalty > 40 ? '#f39c12' : '#e74c3c';
      const loyaltyBar = Math.min(100, Math.max(0, member.loyalty));
      const statusText = member.onOperation ? '⚔️ On Operation' : 
                member.inTraining ? '🎓 In Training' : '✅ Available';
      const role = member.specialization || 'none';
      const roleName = role !== 'none' ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unassigned';
      const expLevel = member.experienceLevel || 1;
      const tribute = Math.floor((member.tributeMultiplier || 1) * 100);
      const daysActive = Math.floor((Date.now() - (member.joinedDate || Date.now())) / (1000 * 60 * 60 * 24));
      
      crewHTML += `
        <div style="background: rgba(44,62,80,0.8); padding: 15px; border-radius: 10px; border-left: 4px solid ${loyaltyColor};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="margin:0; color:#ecf0f1;">${member.name}</h4>
            <span style="font-size:0.8em; color: #95a5a6;">${statusText}</span>
          </div>
          
          <div style="font-size:0.9em; color:#bdc3c7; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between;">
              <span>Role: <strong>${roleName}</strong></span>
              <span>Lv. ${expLevel}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Power: ${member.power || 5}</span>
              <span>Tribute: $${tribute}/cycle</span>
            </div>
            <div style="font-size:0.85em; color:#7f8c8d;">${daysActive > 0 ? daysActive + ' day' + (daysActive > 1 ? 's' : '') + ' in crew' : 'Just joined'}</div>
          </div>
          
          <div style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85em;">
              <span>Loyalty</span>
              <span style="color:${loyaltyColor};">${member.loyalty}%</span>
            </div>
            <div style="background:rgba(0,0,0,0.3); border-radius:4px; height:8px; overflow:hidden;">
              <div style="background:${loyaltyColor}; width:${loyaltyBar}%; height:100%; border-radius:4px; transition: width 0.3s;"></div>
            </div>
          </div>
          
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${!member.onOperation && !member.inTraining ? `
              <button onclick="boostMemberLoyalty(${index})" style="background:#f39c12; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;" title="Pay to increase loyalty">
                💰 Pay Respect
              </button>
              <button onclick="startTraining(${index})" style="background:#1abc9c; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;">
                🎓 Train
              </button>
              <button onclick="fireGangMember(${index})" style="background:#95a5a6; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;">
                🚪 Fire
              </button>
            ` : ''}
            ${member.loyalty < 30 ? `
              <button onclick="dealWithDisloyalty(${index})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;">
                ⚠️ Discipline
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    crewHTML += '</div>';
  }
  
  crewHTML += `
    <div style="margin-top: 20px; display: flex; gap: 10px;">
      <button onclick="showGang()" style="background: #3498db; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">
        ← Gang Operations
      </button>
      <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">
        Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("gang-content").innerHTML = crewHTML;
  hideAllScreens();
  document.getElementById("gang-screen").style.display = "block";
}

// Boost a gang member's loyalty by paying them
function boostMemberLoyalty(memberIndex) {
  const member = player.gang.gangMembers[memberIndex];
  if (!member) return;
  
  const cost = Math.floor(500 + (member.experienceLevel || 1) * 200);
  
  if (player.money < cost) {
    showBriefNotification(`Need $${cost.toLocaleString()} to pay respects to ${member.name}.`, 'warning');
    return;
  }
  
  player.money -= cost;
  const loyaltyGain = Math.min(100 - member.loyalty, Math.floor(10 + Math.random() * 10));
  member.loyalty = Math.min(100, member.loyalty + loyaltyGain);
  
  showBriefNotification(`${member.name}'s loyalty increased by ${loyaltyGain}% (now ${member.loyalty}%). Cost: $${cost.toLocaleString()}`, 'success');
  logAction(`Paid $${cost.toLocaleString()} in respects to ${member.name}. Loyalty +${loyaltyGain}%.`);
  
  updateUI();
  showGangManagementScreen();
}

// Calculate average loyalty of gang members
function getAverageLoyalty() {
  if (player.gang.gangMembers.length === 0) return 100;
  const totalLoyalty = player.gang.gangMembers.reduce((sum, member) => sum + member.loyalty, 0);
  return Math.floor(totalLoyalty / player.gang.gangMembers.length);
}

// Calculate total gang power
function calculateGangPower() {
  let totalPower = 0;
  player.gang.gangMembers.forEach(member => {
    const role = specialistRoles.find(r => r.id === member.specialization);
    if (role) {
      totalPower += (member.experienceLevel * 20) + (member.loyalty * 0.5);
    }
  });
  return Math.floor(totalPower);
}

// Generate gang operations HTML
function generateGangOperationsHTML() {
  let html = "";
  
  gangOperations.forEach(operation => {
    const availableMembers = getAvailableMembersForOperation(operation.requiredRole);
    const isOnCooldown = isOperationOnCooldown(operation.id);
    
    html += `
      <div style="margin: 10px 0; padding: 10px; background: rgba(52, 73, 94, 0.4); border-radius: 5px;">
        <h5>${operation.name}</h5>
        <p><small>${operation.description}</small></p>
        <div style="margin: 5px 0;">
          <small><strong>Required:</strong> ${operation.requiredRole.charAt(0).toUpperCase() + operation.requiredRole.slice(1)}</small><br>
          <small><strong>Duration:</strong> ${operation.duration} hours</small><br>
          <small><strong>Reward:</strong> $${operation.rewards.money[0]}-${operation.rewards.money[1]}</small>
        </div>
        <select id="member-select-${operation.id}" style="margin: 5px 0; padding: 5px; width: 100%;">
          <option value="">Select a ${operation.requiredRole}</option>
          ${availableMembers.map(member => 
            `<option value="${member.name}">${member.name} (Level ${member.experienceLevel}, ${member.loyalty}% loyal)</option>`
          ).join('')}
        </select>
        <button onclick="startGangOperation('${operation.id}')" 
            style="background: #e74c3c; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px; width: 100%;"
            ${availableMembers.length === 0 || isOnCooldown ? 'disabled' : ''}>
          ${isOnCooldown ? 'On Cooldown' : (availableMembers.length === 0 ? 'No Available Members' : 'Start Operation')}
        </button>
      </div>
    `;
  });
  
  return html || '<p>No gang operations available</p>';
}

// Get available members for a specific operation role
function getAvailableMembersForOperation(requiredRole) {
  return player.gang.gangMembers.filter(member => 
    member.specialization === requiredRole && 
    !member.onOperation && 
    !member.inTraining &&
    member.loyalty > 20 // Minimum loyalty required
  );
}

// Check if operation is on cooldown
function isOperationOnCooldown(operationId) {
  const now = Date.now();
  return player.gang.activeOperations.some(op => 
    op.operationId === operationId && 
    (now - op.startTime) < (op.cooldown * 60 * 60 * 1000)
  );
}

// Generate gang members HTML
function generateGangMembersHTML() {
  if (player.gang.gangMembers.length === 0) {
    return '<p>No gang members yet. <button onclick="showRecruitment()">Recruit your first member</button></p>';
  }
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">';
  
  player.gang.gangMembers.forEach((member, index) => {
    const role = specialistRoles.find(r => r.id === member.specialization);
    const statusText = member.onOperation ? 'On Operation' : 
             member.inTraining ? '🎓 In Training' : 
             '✅ Available';
    
    const loyaltyColor = member.loyalty > 70 ? '#2ecc71' : 
              member.loyalty > 40 ? '#f39c12' : '#e74c3c';
    
    html += `
      <div style="background: rgba(52, 73, 94, 0.6); padding: 15px; border-radius: 8px; border-left: 4px solid ${loyaltyColor};">
        <h5 style="margin: 0 0 10px 0;">${member.name}</h5>
        <div style="font-size: 0.9em;">
          <strong>Role:</strong> ${role ? role.name : 'Unassigned'}<br>
          <strong>Level:</strong> ${member.experienceLevel}<br>
          <strong>Loyalty:</strong> <span style="color: ${loyaltyColor};">${member.loyalty}%</span><br>
          <strong>Status:</strong> ${statusText}<br>
          <strong>Tribute:</strong> $${Math.floor(member.tributeMultiplier * 100)}/collection
        </div>
        
        <div style="margin-top: 10px;">
          ${!member.onOperation && !member.inTraining ? `
            <button onclick="assignRole(${index})" style="background: #3498db; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin: 2px; font-size: 0.8em;">
              Assign Role
            </button>
            <button onclick="startTraining(${index})" style="background: #1abc9c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin: 2px; font-size: 0.8em;">
              Train
            </button>
          ` : ''}
          
          ${member.loyalty < 30 ? `
            <button onclick="dealWithDisloyalty(${index})" style="background: #e74c3c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin: 2px; font-size: 0.8em;">
              Address Loyalty
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Generate training programs HTML
function generateTrainingProgramsHTML() {
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">';
  
  trainingPrograms.forEach(program => {
    const availableMembers = getAvailableMembersForTraining(program.availableFor);
    
    html += `
      <div style="background: rgba(52, 73, 94, 0.6); padding: 15px; border-radius: 8px;">
        <h5>${program.name}</h5>
        <p style="font-size: 0.9em; margin: 5px 0;">${program.description}</p>
        <div style="font-size: 0.8em; margin: 10px 0;">
          <strong>Cost:</strong> $${program.cost}<br>
          <strong>Duration:</strong> ${program.duration} hours<br>
          <strong>Benefits:</strong> ${Object.entries(program.skillImprovement).map(([skill, value]) => 
            `+${value} ${skill}`).join(', ')}<br>
          <strong>Available for:</strong> ${program.availableFor.join(', ')}
        </div>
        
        <select id="training-member-${program.id}" style="width: 100%; padding: 5px; margin: 5px 0;">
          <option value="">Select a member</option>
          ${availableMembers.map(member => 
            `<option value="${member.name}">${member.name} (${member.specialization})</option>`
          ).join('')}
        </select>
        
        <button onclick="enrollInTraining('${program.id}')" 
            style="background: #1abc9c; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; width: 100%;"
            ${availableMembers.length === 0 || player.money < program.cost ? 'disabled' : ''}>
          ${player.money < program.cost ? 'Insufficient Funds' : 
           (availableMembers.length === 0 ? 'No Available Members' : `Enroll ($${program.cost})`)}
        </button>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Get available members for training
function getAvailableMembersForTraining(availableFor) {
  return player.gang.gangMembers.filter(member => 
    availableFor.includes(member.specialization) && 
    !member.onOperation && 
    !member.inTraining
  );
}

// Start a gang operation
function startGangOperation(operationId) {
  const operation = gangOperations.find(op => op.id === operationId);
  if (!operation) return;
  
  const memberSelect = document.getElementById(`member-select-${operationId}`);
  const selectedMemberName = memberSelect.value;
  
  if (!selectedMemberName) {
    alert('Please select a gang member for this operation.');
    return;
  }
  
  const member = player.gang.gangMembers.find(m => m.name === selectedMemberName);
  if (!member) return;
  
  // Check member loyalty
  if (member.loyalty < 20) {
    alert(`${member.name} is too disloyal to be trusted with this operation!`);
    return;
  }
  
  // Start the operation
  member.onOperation = true;
  const operationData = {
    operationId: operationId,
    memberName: selectedMemberName,
    startTime: Date.now(),
    duration: operation.duration * 60 * 60 * 1000, // Convert hours to milliseconds
    cooldown: operation.cooldown
  };
  
  player.gang.activeOperations.push(operationData);
  
  // Schedule completion
  setTimeout(() => {
    completeGangOperation(operationData);
  }, operationData.duration);
  
  alert(`${member.name} has started the ${operation.name} operation. It will complete in ${operation.duration} hours.`);
  logAction(`${member.name} heads out on a ${operation.name} mission. The crew is earning their keep while you handle bigger things.`);
  
  updateUI();
  showGang();
}

// Complete a gang operation
function completeGangOperation(operationData) {
  const operation = gangOperations.find(op => op.id === operationData.operationId);
  const member = player.gang.gangMembers.find(m => m.name === operationData.memberName);
  
  if (!operation || !member) return;
  
  member.onOperation = false;
  
  // Calculate success based on member stats and operation risks
  const successChance = 60 + (member.experienceLevel * 8) + (member.loyalty * 0.3);
  const betrayalRoll = Math.random() * 100;
  const arrestRoll = Math.random() * 100;
  
  // Check for betrayal first
  if (betrayalRoll < operation.risks.betrayalRisk && member.loyalty < 50) {
    handleOperationBetrayal(member, operation);
    return;
  }
  
  // Check for arrest
  if (arrestRoll < operation.risks.arrestChance) {
    handleOperationArrest(member, operation);
    return;
  }
  
  // Operation success
  const moneyEarned = Math.floor(operation.rewards.money[0] + 
    (Math.random() * (operation.rewards.money[1] - operation.rewards.money[0])));
  
  // Operation spoils: treat as dirty unless marked as clean money
  if (operation.rewards && operation.rewards.cleanMoney) {
    player.money += moneyEarned;
  } else {
    player.dirtyMoney = (player.dirtyMoney || 0) + moneyEarned;
  }
  
  if (operation.rewards.dirtyMoney) {
    const dirtyMoney = Math.floor(operation.rewards.dirtyMoney[0] + 
      (Math.random() * (operation.rewards.dirtyMoney[1] - operation.rewards.dirtyMoney[0])));
    player.dirtyMoney += dirtyMoney;
  }
  
  if (operation.rewards.vehicle && Math.random() < 0.3) {
    // 30% chance to get a stolen car
    stealRandomCar();
  }
  
  // Update member stats
  member.experienceLevel = Math.min(10, member.experienceLevel + 0.1);
  member.loyalty = Math.min(100, member.loyalty + operation.rewards.loyalty);
  player.experience += Math.floor(operation.rewards.experience * 0.7); // Reduce XP for operations
  
  // Remove from active operations
  player.gang.activeOperations = player.gang.activeOperations.filter(op => op !== operationData);
  
  const moneyTag = (operation.rewards && operation.rewards.cleanMoney) ? '' : ' (dirty)';
  alert(`${member.name} successfully completed the ${operation.name}! Earned $${moneyEarned.toLocaleString()}${moneyTag}.`);
  logAction(`${member.name} returns from the ${operation.name} with pockets full and loyalty stronger. Your crew delivers results (+$${moneyEarned.toLocaleString()}${moneyTag}).`);
  if (typeof showBriefNotification === 'function') {
    showBriefNotification(`${member.name} completed ${operation.name}: +$${moneyEarned.toLocaleString()}${moneyTag}`, 2000);
  }
  
  updateUI();
}

// Handle operation betrayal
function handleOperationBetrayal(member, operation) {
  const moneyLoss = Math.floor(player.money * 0.1); // 10% money loss
  player.money = Math.max(0, player.money - moneyLoss);
  player.wantedLevel += 5;
  
  // Remove the betraying member
  player.gang.gangMembers = player.gang.gangMembers.filter(m => m.name !== member.name);
  player.gang.members = Math.max(0, player.gang.members - 1);
  
  alert(`${member.name} betrayed the operation! They disappeared with $${moneyLoss.toLocaleString()} and tipped off the authorities.`);
  logAction(`Betrayal! ${member.name} turns their back on the family, vanishing with your money and leaving a trail for the cops to follow. Trust is a luxury you can't afford (-$${moneyLoss.toLocaleString()}, +5 wanted level).`);
  
  updateUI();
}

// Handle operation arrest
function handleOperationArrest(member, operation) {
  // Member gets arrested, loses loyalty, operation fails
  member.arrested = true;
  member.arrestTime = Date.now() + (Math.random() * 72 + 24) * 60 * 60 * 1000; // 1-3 days
  member.loyalty = Math.max(0, member.loyalty - 15);
  player.wantedLevel += 3;
  
  alert(`${member.name} was arrested during the ${operation.name}! They'll be in custody for a while.`);
  logAction(`The operation goes sideways! ${member.name} gets pinched by the law and hauled away in handcuffs. The heat is rising and loyalty takes a hit.`);
  
  updateUI();
}

// Assign or change a gang member's specialist role
async function assignRole(memberIndex) {
  const member = player.gang.gangMembers[memberIndex];
  if (!member) return;
  
  let roleOptions = specialistRoles.map(role => 
    `<option value="${role.id}">${role.name} - ${role.description}</option>`
  ).join('');
  
  const selectedRole = await ui.prompt(`Assign ${member.name} to a specialist role:<br><br>Available roles:<br>${specialistRoles.map(r => `${r.name}: ${r.description}`).join('<br>')}<br><br>Enter role ID (muscle, thief, dealer, enforcer, driver, technician):`);
  
  if (selectedRole && specialistRoles.find(r => r.id === selectedRole)) {
    member.specialization = selectedRole;
    member.loyalty += 3; // Small loyalty boost for getting a specialized role
    
    showBriefNotification(`${member.name} assigned as ${specialistRoles.find(r => r.id === selectedRole).name}!`, 'success');
    logAction(`${member.name} takes on the role of ${specialistRoles.find(r => r.id === selectedRole).name}. Specialization brings focus and loyalty to your organization.`);
    
    updateUI();
    showGang();
  }
}

// Start training for a gang member
async function startTraining(memberIndex) {
  const member = player.gang.gangMembers[memberIndex];
  if (!member || member.inTraining) return;
  
  const availablePrograms = trainingPrograms.filter(program => 
    program.availableFor.includes(member.specialization)
  );
  
  if (availablePrograms.length === 0) {
    showBriefNotification(`No training programs for ${member.name}'s role.`, 'warning');
    return;
  }
  
  let programList = availablePrograms.map((program, index) => 
    `${index + 1}. ${program.name} - $${program.cost} (${program.duration}h)`
  ).join('<br>');
  
  const choice = await ui.prompt(`Select training program for ${member.name}:<br><br>${programList}<br><br>Enter program number:`);
  if (!choice) return;

  const programIndex = parseInt(choice) - 1;
  
  if (programIndex >= 0 && programIndex < availablePrograms.length) {
    const program = availablePrograms[programIndex];
    
    if (player.money < program.cost) {
      showBriefNotification(`Need $${program.cost} for this training!`, 'danger');
      return;
    }
    
    // Check prerequisites
    if (program.prerequisite) {
      const hasPrereq = Object.entries(program.prerequisite).every(([skill, level]) => 
        member[skill] >= level
      );
      
      if (!hasPrereq) {
        showBriefNotification(`${member.name} doesn't meet the prerequisites for this training.`, 'warning');
        return;
      }
    }
    
    player.money -= program.cost;
    member.inTraining = true;
    
    const trainingData = {
      memberName: member.name,
      programId: program.id,
      startTime: Date.now(),
      duration: program.duration * 60 * 60 * 1000,
      improvements: program.skillImprovement
    };
    
    player.gang.trainingQueue.push(trainingData);
    
    // Schedule completion
    setTimeout(() => {
      completeTraining(trainingData);
    }, trainingData.duration);
    
    showBriefNotification(`${member.name} started ${program.name} training (${program.duration}h)`, 'success');
    logAction(`🎓 ${member.name} hits the books and training grounds. Investment in your crew's skills pays dividends in the long run (-$${program.cost}).`);
    
    updateUI();
    showGang();
  }
}

// Complete training for a gang member
function completeTraining(trainingData) {
  const member = player.gang.gangMembers.find(m => m.name === trainingData.memberName);
  if (!member) return;
  
  member.inTraining = false;
  
  // Apply improvements
  Object.entries(trainingData.improvements).forEach(([skill, improvement]) => {
    if (skill === 'loyalty') {
      member.loyalty = Math.min(100, member.loyalty + improvement);
    } else {
      member[skill] = (member[skill] || 0) + improvement;
    }
  });
  
  // Remove from training queue
  player.gang.trainingQueue = player.gang.trainingQueue.filter(t => t !== trainingData);
  
  alert(`${member.name} has completed their training program! Their skills have improved.`);
  logAction(`🎓 ${member.name} graduates from training with new skills and renewed dedication. Your investment in education pays off in capability and loyalty.`);
  
  updateUI();
}

// Enroll a member in training
function enrollInTraining(programId) {
  const program = trainingPrograms.find(p => p.id === programId);
  if (!program) return;
  
  const memberSelect = document.getElementById(`training-member-${programId}`);
  const selectedMemberName = memberSelect.value;
  
  if (!selectedMemberName) {
    alert('Please select a gang member for this training program.');
    return;
  }
  
  const member = player.gang.gangMembers.find(m => m.name === selectedMemberName);
  if (!member) return;
  
  if (player.money < program.cost) {
    alert(`Insufficient funds! Need $${program.cost} for this training program.`);
    return;
  }
  
  player.money -= program.cost;
  member.inTraining = true;
  
  const trainingData = {
    memberName: member.name,
    programId: program.id,
    startTime: Date.now(),
    duration: program.duration * 60 * 60 * 1000,
    improvements: program.skillImprovement
  };
  
  player.gang.trainingQueue.push(trainingData);
  
  setTimeout(() => {
    completeTraining(trainingData);
  }, trainingData.duration);
  
  alert(`${member.name} has enrolled in ${program.name}. Training will complete in ${program.duration} hours.`);
  logAction(`🎓 ${member.name} begins intensive training in ${program.name}. Skilled soldiers make for a stronger organization (-$${program.cost}).`);
  
  updateUI();
  showGang();
}

// Deal with disloyal gang members
async function dealWithDisloyalty(memberIndex) {
  const member = player.gang.gangMembers[memberIndex];
  if (!member) return;
  
  const choice = await ui.show(
    `Handle Disloyalty: ${member.name}`,
    `${member.name} has low loyalty (${member.loyalty}%). How do you want to handle this?`,
    [
      { text: 'Heart-to-heart ($500)', class: 'modal-btn-secondary', value: '1' },
      { text: 'Bonus Payment ($1000)', class: 'modal-btn-secondary', value: '2' },
      { text: 'Threaten', class: 'modal-btn-secondary', value: '3' },
      { text: 'Kick Out', class: 'modal-btn-danger', value: '4' },
      { text: 'Cancel', class: 'modal-btn-secondary', value: null }
    ]
  );
  
  if (!choice) return;

  switch(choice) {
    case "1":
      if (player.money >= 500) {
        player.money -= 500;
        member.loyalty = Math.min(100, member.loyalty + 10);
        showBriefNotification(`Heart-to-heart with ${member.name}: +10 loyalty`, 'success');
        logAction(`💬 A heart-to-heart with ${member.name} over drinks and cigars. Sometimes the personal touch works better than intimidation (+10 loyalty, -$500).`);
      } else {
        showBriefNotification("Not enough money for this approach.", 'danger');
      }
      break;
      
    case "2":
      if (player.money >= 1000) {
        player.money -= 1000;
        member.loyalty = Math.min(100, member.loyalty + 15);
        showBriefNotification(`Bonus for ${member.name}: +15 loyalty`, 'success');
        logAction(`A generous bonus for ${member.name} shows that loyalty is rewarded in your organization. Money talks, and loyalty listens (+15 loyalty, -$1000).`);
      } else {
        showBriefNotification("Not enough money for this approach.", 'danger');
      }
      break;
      
    case "3":
      if (Math.random() < 0.3) {
        // 30% chance they leave
        player.gang.gangMembers = player.gang.gangMembers.filter((_, index) => index !== memberIndex);
        player.gang.members = Math.max(0, player.gang.members - 1);
        showBriefNotification(`${member.name} left the gang after your threats!`, 'danger');
        logAction(`${member.name} doesn't take kindly to threats and walks away from the organization. Heavy-handed tactics sometimes backfire.`);
      } else {
        member.loyalty = Math.min(100, member.loyalty + 5);
        showBriefNotification(`${member.name} falls in line. +5 loyalty`, 'warning');
        logAction(`👊 A firm word and steely gaze reminds ${member.name} who's in charge. Fear can be a motivator, but it's a double-edged sword (+5 loyalty).`);
      }
      break;
      
    case "4":
      if (await ui.confirm(`Are you sure you want to kick out ${member.name}? This action cannot be undone.`)) {
        player.gang.gangMembers = player.gang.gangMembers.filter((_, index) => index !== memberIndex);
        player.gang.members = Math.max(0, player.gang.members - 1);
        showBriefNotification(`${member.name} removed from the gang.`, 'warning');
        logAction(`${member.name} is shown the door. Sometimes cutting loose the disloyal is necessary for the health of the organization.`);
      }
      break;
  }
  
  updateUI();
  showGang();
}

// Check for betrayal events
function checkForBetrayals() {
  const now = Date.now();
  const timeSinceLastCheck = now - (player.gang.lastBetrayalCheck || 0);
  
  // Check every 30 minutes of real time
  if (timeSinceLastCheck < 30 * 60 * 1000) return;
  
  player.gang.lastBetrayalCheck = now;
  
  // Check each betrayal event
  betrayalEvents.forEach(event => {
    if (shouldTriggerBetrayal(event)) {
      if (Math.random() * 100 < 10) { // 10% chance when conditions are met
        triggerBetrayalEvent(event);
      }
    }
  });
}

// Check if betrayal should trigger
function shouldTriggerBetrayal(event) {
  const conditions = event.triggerConditions;
  
  // Check if any gang member meets the disloyalty threshold
  if (conditions.maxLoyalty) {
    const hasDisloyalMember = player.gang.gangMembers.some(member => member.loyalty <= conditions.maxLoyalty);
    if (!hasDisloyalMember) return false;
  }
  
  if (conditions.minWantedLevel && player.wantedLevel < conditions.minWantedLevel) return false;
  if (conditions.minTerritory && player.territory < conditions.minTerritory) return false;
  if (conditions.minBusinesses && player.businesses.length < conditions.minBusinesses) return false;
  if (conditions.minGangMembers && player.gang.members < conditions.minGangMembers) return false;
  
  return true;
}

// Trigger a betrayal event
function triggerBetrayalEvent(event) {
  const consequences = event.consequences;
  
  // Apply consequences
  if (consequences.moneyLoss) {
    const loss = Math.floor(player.money * consequences.moneyLoss);
    player.money = Math.max(0, player.money - loss);
  }
  
  if (consequences.wantedLevelIncrease) {
    player.wantedLevel += consequences.wantedLevelIncrease;
  }
  
  if (consequences.reputationLoss) {
    player.reputation = Math.max(0, player.reputation - consequences.reputationLoss);
  }
  
  if (consequences.powerLoss) {
    player.power = Math.max(0, player.power - consequences.powerLoss);
  }
  
  if (consequences.territoryLoss) {
    player.territory = Math.max(0, player.territory - consequences.territoryLoss);
  }
  
  if (consequences.gangMemberLoss) {
    // Remove the most disloyal members
    const sorted = player.gang.gangMembers.sort((a, b) => a.loyalty - b.loyalty);
    for (let i = 0; i < consequences.gangMemberLoss && sorted.length > 0; i++) {
      player.gang.gangMembers = player.gang.gangMembers.filter(m => m !== sorted[i]);
      player.gang.members = Math.max(0, player.gang.members - 1);
    }
  }
  
  if (consequences.gangSplit) {
    // Lose half the gang
    const membersToRemove = Math.floor(player.gang.members / 2);
    player.gang.gangMembers = player.gang.gangMembers.slice(membersToRemove);
    player.gang.members = Math.max(0, player.gang.members - membersToRemove);
  }
  
  // Add to betrayal history
  player.gang.betrayalHistory.push({
    eventId: event.id,
    timestamp: Date.now(),
    detected: Math.random() * 100 < event.detectionChance
  });
  
  // Show alert
  alert(`BETRAYAL! ${event.name}: ${event.description}`);
  logAction(`BETRAYAL! ${event.description} Your organization suffers from internal treachery. Trust is a luxury in this business.`);
  
  updateUI();
}

// ==================== TERRITORY CONTROL FUNCTIONS ====================

// Show Territory Control Screen
function showTerritoryControl() {
  if (player.inJail) {
    alert("You can't manage territories while you're in jail!");
    return;
  }
  
  let html = `
    <h2 style="color: #e74c3c; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      🏛️ Territory Control
    </h2>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
      <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 1.8em; color: #3498db;">Trophy</div>
        <div style="font-size: 0.9em; color: #bdc3c7;">Territory Power</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #ecf0f1;">${player.territoryPower}</div>
      </div>
      <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 1.8em; color: #2ecc71;">Cash</div>
        <div style="font-size: 0.9em; color: #bdc3c7;">Weekly Income</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #ecf0f1;">$${player.territoryIncome.toLocaleString()}</div>
      </div>
      <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 1.8em; color: #9b59b6;">Map</div>
        <div style="font-size: 0.9em; color: #bdc3c7;">Territories</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #ecf0f1;">${player.territories.length}</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
      <button onclick="showAvailableTerritories()" 
          style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #27ae60, #2ecc71); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; 
              box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">
        Expand Territory
      </button>
      <button onclick="showProtectionRackets()" 
          style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #e67e22, #f39c12); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; 
              box-shadow: 0 5px 15px rgba(243, 156, 18, 0.3); transition: all 0.3s ease;">
        Protection Rackets
      </button>
      <button onclick="showCorruption()" 
          style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #8e44ad, #9b59b6); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; 
              box-shadow: 0 5px 15px rgba(155, 89, 182, 0.3); transition: all 0.3s ease;">
        Corruption
      </button>
    </div>`;
  
  // Show controlled territories
  if (player.territories.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #e74c3c; margin-bottom: 15px;">Controlled Territories</h3>
        <div style="display: grid; gap: 15px;">`;
    
    player.territories.forEach(territory => {
      const districtType = districtTypes.find(d => d.id === territory.districtId);
      const income = calculateTerritoryIncome(territory);
      const heatLevel = player.territoryHeat[territory.id] || 0;
      
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 15px; border-radius: 10px; 
              border-left: 4px solid ${getHeatColor(heatLevel)};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${districtType.name}</h4>
              <p style="color: #bdc3c7; margin: 0; font-size: 0.9em;">${districtType.description}</p>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #2ecc71; font-weight: bold;">$${income.toLocaleString()}/week</div>
              <div style="color: ${getHeatColor(heatLevel)}; font-size: 0.9em;">Heat: ${heatLevel.toFixed(1)}</div>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="manageTerritoryDetails('${territory.id}')" 
                style="padding: 5px 10px; background: #3498db; border: none; border-radius: 5px; 
                    color: white; cursor: pointer; font-size: 0.8em;">
              Manage
            </button>
            <button onclick="fortifyTerritory('${territory.id}')" 
                style="padding: 5px 10px; background: #e67e22; border: none; border-radius: 5px; 
                    color: white; cursor: pointer; font-size: 0.8em;">
              Fortify
            </button>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  } else {
    html += `
      <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 3em; margin-bottom: 10px;">🗺️</div>
        <h3 style="color: #e74c3c; margin: 0 0 10px 0;">No Territories Controlled</h3>
        <p style="color: #bdc3c7; margin: 0;">Start expanding your influence by acquiring territories. Control brings power, income, and respect.</p>
      </div>`;
  }
  
  // Show active territory events
  if (player.territoryEvents.length > 0) {
    html += `
      <div style="background: rgba(230, 126, 34, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #e67e22; margin-bottom: 15px;">⚠️ Territory Events</h3>
        <div style="display: grid; gap: 10px;">`;
    
    player.territoryEvents.forEach(event => {
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${event.name}</h4>
              <p style="color: #bdc3c7; margin: 0; font-size: 0.9em;">${event.description}</p>
            </div>
            <div style="text-align: right; color: #e67e22; font-weight: bold;">
              ${Math.ceil(event.duration)} days left
            </div>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  }
  
  html += `
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="goBackToMainMenu()" 
          style="padding: 12px 30px; background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        ←Back to SafeHouse
      </button>
    </div>`;
  
  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Show Available Territories for Expansion
function showAvailableTerritories() {
  let html = `
    <h2 style="color: #27ae60; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      🎯 Territory Expansion
    </h2>
    
    <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #3498db; margin: 0 0 10px 0;">💡 Territory Control Tips</h3>
      <ul style="color: #bdc3c7; margin: 0; padding-left: 20px;">
        <li>Higher-income territories require more gang power to control</li>
        <li>Some territories may be controlled by rival gangs</li>
        <li>Territory benefits stack with your existing operations</li>
        <li>Police presence affects operational risk in territories</li>
      </ul>
    </div>
    
    <div style="display: grid; gap: 15px;">`;
  
  // Show available territories (not yet controlled)
  const controlledTerritoryIds = player.territories.map(t => t.districtId);
  const availableTerritories = districtTypes.filter(district => !controlledTerritoryIds.includes(district.id));
  
  availableTerritories.forEach(district => {
    const canAfford = player.money >= district.acquisitionCost;
    const hasEnoughPower = player.territoryPower >= (district.acquisitionCost / 100); // Simple power requirement
    const isControlled = rivalGangs.some(gang => gang.preferredDistricts.includes(district.id) && Math.random() < 0.3);
    
    html += `
      <div style="background: rgba(52, 73, 94, 0.8); padding: 20px; border-radius: 12px; 
            border-left: 4px solid ${getRiskColor(district.riskLevel)};">
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 15px;">
          <div style="flex: 1; min-width: 250px;">
            <h3 style="color: #ecf0f1; margin: 0 0 8px 0;">${district.name}</h3>
            <p style="color: #bdc3c7; margin: 0 0 12px 0; font-size: 0.95em;">${district.description}</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px;">
              <div style="font-size: 0.85em; color: #bdc3c7;">
                <span style="color: #2ecc71;">💰 Income:</span> $${district.baseIncome}/week
              </div>
              <div style="font-size: 0.85em; color: #bdc3c7;">
                <span style="color: #3498db;">🏢 Max Businesses:</span> ${district.maxBusinesses}
              </div>
              <div style="font-size: 0.85em; color: #bdc3c7;">
                <span style="color: ${getRiskColor(district.riskLevel)}">⚠️ Risk:</span> ${district.riskLevel}
              </div>
              <div style="font-size: 0.85em; color: #bdc3c7;">
                <span style="color: #e74c3c;">👮 Police:</span> ${district.policePresence}%
              </div>
            </div>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px;">
              <div style="font-size: 0.9em; color: #ecf0f1; margin-bottom: 5px; font-weight: bold;">Benefits:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">`;
    
    Object.entries(district.benefits).forEach(([key, value]) => {
      const bonus = Math.round((value - 1) * 100);
      html += `<span style="background: rgba(46, 204, 113, 0.3); padding: 2px 6px; border-radius: 4px; 
              font-size: 0.8em; color: #2ecc71;">+${bonus}% ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>`;
    });
    
    html += `
              </div>
            </div>
          </div>
          
          <div style="text-align: right; min-width: 150px;">
            <div style="background: rgba(0, 0, 0, 0.4); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
              <div style="color: #f39c12; font-weight: bold; font-size: 1.1em;">$${district.acquisitionCost.toLocaleString()}</div>
              <div style="color: #bdc3c7; font-size: 0.8em;">Acquisition Cost</div>
              <div style="color: #e67e22; font-size: 0.9em; margin-top: 5px;">$${district.maintenanceCost}/week</div>
              
              <div style="border-top: 1px solid rgba(255,255,255,0.2); margin: 8px 0; padding-top: 8px;">
                <div style="color: #9b59b6; font-size: 0.85em;">
                  <div style="margin-bottom: 2px;">🎯 Gang Power: ${Math.ceil(district.acquisitionCost / 100)}</div>
                  <div style="font-size: 0.75em; color: #bdc3c7;">(You have: ${player.territoryPower})</div>
                </div>
              </div>
            </div>`;
    
    if (isControlled) {
      const turfWarPower = Math.ceil(district.acquisitionCost / 50);
      const canWar = player.territoryPower >= turfWarPower;
      html += `
            <div style="margin-bottom: 8px; font-size: 0.8em; text-align: center;">
              <div style="color: #9b59b6;">🔥 War Power: ${turfWarPower}</div>
              <div style="font-size: 0.75em; color: #bdc3c7;">(You have: ${player.territoryPower})</div>
            </div>
            <button onclick="initiateTurfWar('${district.id}')" 
                style="width: 100%; padding: 10px; background: linear-gradient(135deg, #e74c3c, #c0392b); 
                    border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; 
                    font-size: 0.9em; ${!canWar ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
              ⚔️ Turf War
            </button>
            <div style="text-align: center; margin-top: 5px; font-size: 0.8em; color: #e74c3c;">
              Controlled by rivals
            </div>`;
    } else {
      html += `
            <button onclick="acquireTerritory('${district.id}')" 
                style="width: 100%; padding: 10px; background: linear-gradient(135deg, #27ae60, #2ecc71); 
                    border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; 
                    font-size: 0.9em; ${!canAfford || !hasEnoughPower ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
              🎯 Acquire
            </button>`;
      
      if (!canAfford) {
        html += `<div style="text-align: center; margin-top: 5px; font-size: 0.8em; color: #e74c3c;">Need $${(district.acquisitionCost - player.money).toLocaleString()} more</div>`;
      } else if (!hasEnoughPower) {
        const requiredPower = Math.ceil(district.acquisitionCost / 100);
        html += `<div style="text-align: center; margin-top: 5px; font-size: 0.8em; color: #e74c3c;">Need ${requiredPower - player.territoryPower} more gang power</div>`;
      }
    }
    
    html += `
          </div>
        </div>
      </div>`;
  });
  
  html += `
    </div>
    
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="showTerritoryControl()" 
          style="padding: 12px 30px; background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        ← Back to Territory Control
      </button>
    </div>`;
  
  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Acquire Territory Function
async function acquireTerritory(districtId) {
  const district = districtTypes.find(d => d.id === districtId);
  const canAfford = player.money >= district.acquisitionCost;
  const hasEnoughPower = player.territoryPower >= (district.acquisitionCost / 100);
  
  if (!canAfford) {
    showBriefNotification(`Need $${district.acquisitionCost.toLocaleString()} to acquire ${district.name}!`, 'danger');
    return;
  }
  
  if (!hasEnoughPower) {
    const requiredPower = Math.ceil(district.acquisitionCost / 100);
    showBriefNotification(`Not enough power for ${district.name}! Need ${requiredPower}, have ${player.territoryPower}.`, 'danger');
    return;
  }
  
  if (await ui.confirm(`Acquire ${district.name} for $${district.acquisitionCost.toLocaleString()}?`)) {
    player.money -= district.acquisitionCost;
    
    const newTerritory = {
      id: `territory_${Date.now()}`,
      districtId: district.id,
      acquisitionDate: Date.now(),
      defenseLevel: 1,
      businesses: [],
      lastIncomeCollection: Date.now()
    };
    
    player.territories.push(newTerritory);
    player.territoryHeat[newTerritory.id] = district.policePresence / 100;
    player.territoryReputation += 10;
    
    // Update territory income
    calculateTotalTerritoryIncome();
    
    showBriefNotification(`Territory acquired: ${district.name}!`, 'success');
    logAction(`🏛️ Territory acquired: ${district.name}. Your criminal empire expands its reach. The streets whisper your name with newfound respect.`);
    
    updateUI();
    showAvailableTerritories(); // Refresh the display
  }
}

// Calculate Territory Income
function calculateTerritoryIncome(territory) {
  const district = districtTypes.find(d => d.id === territory.districtId);
  if (!district) return 0;
  
  let income = district.baseIncome;
  
  // Apply defense level bonus
  income *= (1 + (territory.defenseLevel - 1) * 0.1);
  
  // Apply heat penalty
  const heat = player.territoryHeat[territory.id] || 0;
  income *= Math.max(0.3, 1 - heat * 0.5);
  
  // Apply gang member bonuses
  const relevantMembers = player.gang.gangMembers.filter(member => 
    member.specialization === 'enforcer' || member.specialization === 'lieutenant'
  );
  income *= (1 + relevantMembers.length * 0.05);
  
  return Math.floor(income);
}

// Calculate Total Territory Income
function calculateTotalTerritoryIncome() {
  player.territoryIncome = player.territories.reduce((total, territory) => {
    return total + calculateTerritoryIncome(territory);
  }, 0);
  
  // Subtract maintenance costs
  const maintenanceCosts = player.territories.reduce((total, territory) => {
    const district = districtTypes.find(d => d.id === territory.districtId);
    return total + (district ? district.maintenanceCost : 0);
  }, 0);
  
  player.territoryIncome = Math.max(0, player.territoryIncome - maintenanceCosts);
}

// Show Protection Rackets
function showProtectionRackets() {
  let html = `
    <h2 style="color: #f39c12; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      🏪 Protection Rackets
    </h2>
    
    <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #f39c12; margin: 0 0 10px 0;">💡 Protection Racket Tips</h3>
      <ul style="color: #bdc3c7; margin: 0; padding-left: 20px;">
        <li>Businesses in your territories pay protection money</li>
        <li>Over-extortion can cause businesses to close or call police</li>
        <li>Regular collections maintain fear and respect</li>
        <li>Different business types have different vulnerabilities</li>
      </ul>
    </div>`;
  
  // Show current protection rackets
  if (player.protectionRackets.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #f39c12; margin-bottom: 15px;">💰 Active Rackets</h3>
        <div style="display: grid; gap: 15px;">`;
    
    player.protectionRackets.forEach(racket => {
      const business = protectionBusinesses.find(b => b.id === racket.businessId);
      const territory = player.territories.find(t => t.id === racket.territoryId);
      const district = territory ? districtTypes.find(d => d.id === territory.districtId) : null;
      
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${business.name}</h4>
              <p style="color: #bdc3c7; margin: 0 0 5px 0; font-size: 0.9em;">${business.description}</p>
              <div style="font-size: 0.8em; color: #95a5a6;">📍 ${district ? district.name : 'Unknown Territory'}</div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #f39c12; font-weight: bold;">$${racket.weeklyPayment.toLocaleString()}/week</div>
              <div style="color: #bdc3c7; font-size: 0.9em;">Fear: ${racket.fearLevel.toFixed(1)}</div>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="collectProtection('${racket.id}')" 
                style="padding: 5px 10px; background: #27ae60; border: none; border-radius: 5px; 
                    color: white; cursor: pointer; font-size: 0.8em;">
              💰 Collect
            </button>
            <button onclick="pressureBusiness('${racket.id}')" 
                style="padding: 5px 10px; background: #e67e22; border: none; border-radius: 5px; 
                    color: white; cursor: pointer; font-size: 0.8em;">
              👊 Pressure
            </button>
            <button onclick="dropProtection('${racket.id}')" 
                style="padding: 5px 10px; background: #e74c3c; border: none; border-radius: 5px; 
                    color: white; cursor: pointer; font-size: 0.8em;">
              ❌ Drop
            </button>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  }
  
  // Show available businesses to approach
  const availableBusinesses = getAvailableBusinessesForProtection();
  if (availableBusinesses.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #27ae60; margin-bottom: 15px;">🎯 Available Businesses</h3>
        <div style="display: grid; gap: 15px;">`;
    
    availableBusinesses.forEach(business => {
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${business.name}</h4>
              <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 0.9em;">${business.description}</p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #e74c3c;">Risk: ${business.riskLevel}</span>
                <span style="background: rgba(52, 152, 219, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #3498db;">Type: ${business.type}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #f39c12; font-weight: bold;">$${business.basePayment.toLocaleString()}/week</div>
              <div style="color: #bdc3c7; font-size: 0.9em;">Base Rate</div>
              <button onclick="approachBusiness('${business.id}', '${business.territoryId}')" 
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #27ae60, #2ecc71); 
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                🤝 Approach
              </button>
            </div>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  } else {
    html += `
      <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 3em; margin-bottom: 10px;">🏪</div>
        <h3 style="color: #e74c3c; margin: 0 0 10px 0;">No Available Businesses</h3>
        <p style="color: #bdc3c7; margin: 0;">Acquire more territories to find businesses that need "protection".</p>
      </div>`;
  }
  
  html += `
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="showTerritoryControl()" 
          style="padding: 12px 30px; background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        ← Back to Territory Control
      </button>
    </div>`;
  
  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Get Available Businesses for Protection
function getAvailableBusinessesForProtection() {
  const availableBusinesses = [];
  
  player.territories.forEach(territory => {
    const district = districtTypes.find(d => d.id === territory.districtId);
    if (!district) return;
    
    // Generate 2-4 businesses per territory
    const businessCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < businessCount; i++) {
      // Check if this business is already in a protection racket
      const businessInRacket = player.protectionRackets.some(racket => 
        racket.territoryId === territory.id && racket.businessIndex === i
      );
      
      if (!businessInRacket) {
        const randomBusiness = protectionBusinesses[Math.floor(Math.random() * protectionBusinesses.length)];
        availableBusinesses.push({
          ...randomBusiness,
          territoryId: territory.id,
          businessIndex: i,
          id: `${territory.id}_business_${i}`
        });
      }
    }
  });
  
  return availableBusinesses.slice(0, 10); // Limit to 10 for display
}

// Show Corruption System
function showCorruption() {
  let html = `
    <h2 style="color: #9b59b6; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      💼 Corruption Network
    </h2>
    
    <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #9b59b6; margin: 0 0 10px 0;">💡 Corruption Tips</h3>
      <ul style="color: #bdc3c7; margin: 0; padding-left: 20px;">
        <li>Corrupt officials provide ongoing benefits while active</li>
        <li>Higher-ranking officials cost more but provide better protection</li>
        <li>Corruption has risks - some officials may betray you</li>
        <li>Benefits apply to all your criminal activities</li>
      </ul>
    </div>`;
  
  // Show active corruption
  if (player.corruptedOfficials.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #9b59b6; margin-bottom: 15px;">🤝 Active Corruption</h3>
        <div style="display: grid; gap: 15px;">`;
    
    player.corruptedOfficials.forEach(official => {
      const target = corruptionTargets.find(t => t.id === official.targetId);
      const timeLeft = Math.max(0, (official.expirationDate - Date.now()) / (24 * 60 * 60 * 1000));
      
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${target.name}</h4>
              <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 0.9em;">${target.description}</p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(155, 89, 182, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #9b59b6;">Influence: ${target.influence}</span>
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #e74c3c;">Risk: ${target.riskLevel}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #9b59b6; font-weight: bold;">${timeLeft.toFixed(1)} days left</div>
              <div style="color: #bdc3c7; font-size: 0.9em;">Protection Active</div>
              <button onclick="renewCorruption('${official.id}')" 
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #8e44ad, #9b59b6); 
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                🔄 Renew
              </button>
            </div>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  }
  
  // Show available corruption targets
  const availableTargets = corruptionTargets.filter(target => 
    !player.corruptedOfficials.some(official => official.targetId === target.id)
  );
  
  if (availableTargets.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #27ae60; margin-bottom: 15px;">🎯 Available Targets</h3>
        <div style="display: grid; gap: 15px;">`;
    
    availableTargets.forEach(target => {
      const canAfford = player.money >= target.baseCost;
      
      html += `
        <div style="background: rgba(52, 73, 94, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">${target.name}</h4>
              <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 0.9em;">${target.description}</p>
              
              <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <div style="font-size: 0.85em; color: #ecf0f1; margin-bottom: 5px; font-weight: bold;">Benefits:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">`;
      
      Object.entries(target.benefits).forEach(([key, value]) => {
        if (key !== 'duration') {
          const bonus = typeof value === 'number' ? Math.round(value * 100) : value;
          html += `<span style="background: rgba(46, 204, 113, 0.3); padding: 1px 4px; border-radius: 3px; 
                  font-size: 0.75em; color: #2ecc71;">${bonus}% ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>`;
        }
      });
      
      html += `
                </div>
                <div style="margin-top: 5px; font-size: 0.8em; color: #f39c12;">
                  Duration: ${target.benefits.duration} days
                </div>
              </div>
              
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(155, 89, 182, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #9b59b6;">Influence: ${target.influence}</span>
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px; 
                      font-size: 0.8em; color: #e74c3c;">Risk: ${target.riskLevel}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #f39c12; font-weight: bold; font-size: 1.1em;">$${target.baseCost.toLocaleString()}</div>
              <div style="color: #bdc3c7; font-size: 0.8em;">Bribe Cost</div>
              <button onclick="corruptOfficial('${target.id}')" 
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #8e44ad, #9b59b6); 
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;
                      ${!canAfford ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                💰 Bribe
              </button>
              ${!canAfford ? `<div style="text-align: center; margin-top: 5px; font-size: 0.8em; color: #e74c3c;">
                Need $${(target.baseCost - player.money).toLocaleString()} more
              </div>` : ''}
            </div>
          </div>
        </div>`;
    });
    
    html += `</div></div>`;
  }
  
  html += `
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="showTerritoryControl()" 
          style="padding: 12px 30px; background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        ← Back to Territory Control
      </button>
    </div>`;
  
  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Helper Functions for Territory Control
function getHeatColor(heat) {
  if (heat < 0.3) return '#2ecc71';
  if (heat < 0.6) return '#f39c12';
  return '#e74c3c';
}

function getRiskColor(riskLevel) {
  switch(riskLevel) {
    case 'low': return '#2ecc71';
    case 'medium': return '#f39c12';
    case 'high': return '#e74c3c';
    default: return '#bdc3c7';
  }
}

// Territory Control Action Functions
async function corruptOfficial(targetId) {
  const target = corruptionTargets.find(t => t.id === targetId);
  if (!target) return;
  
  if (player.money < target.baseCost) {
    showBriefNotification(`Need $${target.baseCost.toLocaleString()} to bribe the ${target.name}!`, 'danger');
    return;
  }
  
  if (await ui.confirm(`Bribe ${target.name} for $${target.baseCost.toLocaleString()}? Duration: ${target.benefits.duration} days`)) {
    player.money -= target.baseCost;
    
    const corruption = {
      id: `corruption_${Date.now()}`,
      targetId: target.id,
      startDate: Date.now(),
      expirationDate: Date.now() + (target.benefits.duration * 24 * 60 * 60 * 1000),
      benefits: target.benefits
    };
    
    player.corruptedOfficials.push(corruption);
    
    // Risk of getting caught
    if (Math.random() < (target.riskLevel === 'extreme' ? 0.3 : target.riskLevel === 'high' ? 0.2 : 0.1)) {
      player.wantedLevel += Math.floor(Math.random() * 20) + 10;
      showBriefNotification(`Bribe successful, but someone may have noticed...`, 'warning');
      logAction(`💼 ${target.name} has been corrupted, but you sense eyes watching your every move. The price of power is constant vigilance.`);
    } else {
      showBriefNotification(`${target.name} corrupted successfully!`, 'success');
      logAction(`💼 ${target.name} is now in your pocket. Money talks, and corruption walks. Your influence grows in the shadows.`);
    }
    
    updateUI();
    showCorruption();
  }
}

function approachBusiness(businessId, territoryId) {
  const business = protectionBusinesses.find(b => businessId.includes(b.id.split('_')[0]));
  if (!business) return;
  
  // Success chance based on gang reputation and territory power
  const successChance = Math.min(0.9, 0.4 + (player.territoryReputation / 100) + (player.territoryPower / 1000));
  
  if (Math.random() < successChance) {
    const racket = {
      id: `racket_${Date.now()}`,
      businessId: business.id,
      territoryId: territoryId,
      businessIndex: parseInt(businessId.split('_').pop()),
      weeklyPayment: business.basePayment,
      fearLevel: 5.0,
      lastCollection: Date.now()
    };
    
    player.protectionRackets.push(racket);
    player.territoryReputation += 5;
    
    showBriefNotification(`${business.name} pays $${business.basePayment.toLocaleString()}/week for protection`, 'success');
    logAction(`🏪 ${business.name} now pays tribute. Fear is the foundation of respect, and respect is the currency of power.`);
  } else {
    // Failed approach - business calls police or refuses
    if (Math.random() < 0.3) {
      player.wantedLevel += Math.floor(Math.random() * 15) + 5;
      showBriefNotification(`${business.name} called the police! Wanted level up.`, 'danger');
      logAction(`🚨 ${business.name} refused your offer and called the authorities. Sometimes the sheep bite back.`);
    } else {
      showBriefNotification(`${business.name} refused your offer.`, 'warning');
      logAction(`❌ ${business.name} shows no fear. Some prey require a different approach.`);
    }
  }
  
  updateUI();
  showProtectionRackets();
}

function collectProtection(racketId) {
  const racket = player.protectionRackets.find(r => r.id === racketId);
  if (!racket) return;
  
  const business = protectionBusinesses.find(b => b.id === racket.businessId);
  const timeSinceLastCollection = Date.now() - racket.lastCollection;
  const weeksElapsed = Math.floor(timeSinceLastCollection / (7 * 24 * 60 * 60 * 1000));
  
  if (weeksElapsed < 1) {
    alert("You already collected from this business recently. Give them time to make money first.");
    return;
  }
  
  const totalPayment = racket.weeklyPayment * weeksElapsed;
  player.money += totalPayment;
  racket.lastCollection = Date.now();
  
  // Maintain fear level
  racket.fearLevel = Math.min(10, racket.fearLevel + 0.5);
  
  alert(`Collected $${totalPayment.toLocaleString()} from ${business.name} (${weeksElapsed} week${weeksElapsed > 1 ? 's' : ''})`);
  logAction(`💰 ${business.name} pays their tribute without question. Fear keeps the money flowing like clockwork.`);
  
  updateUI();
  showProtectionRackets();
}

function pressureBusiness(racketId) {
  const racket = player.protectionRackets.find(r => r.id === racketId);
  if (!racket) return;
  
  const business = protectionBusinesses.find(b => b.id === racket.businessId);
  
  if (Math.random() < 0.7) {
    // Successful pressure - increase payment
    const increase = Math.floor(business.basePayment * 0.2);
    racket.weeklyPayment = Math.min(business.maxExtortion, racket.weeklyPayment + increase);
    racket.fearLevel = Math.min(10, racket.fearLevel + 1);
    
    alert(`${business.name} agrees to pay more! Weekly payment increased by $${increase.toLocaleString()}.`);
    logAction(`👊 Applied pressure to ${business.name}. A reminder of consequences speaks louder than words.`);
  } else {
    // Pressure backfires
    if (Math.random() < 0.4) {
      // Business calls police
      player.wantedLevel += Math.floor(Math.random() * 20) + 10;
      alert(`Your pressure tactics backfired! ${business.name} called the police.`);
      logAction(`🚨 ${business.name} cracked under pressure and called the cops. Sometimes intimidation cuts both ways.`);
    } else {
      // Business closes down
      player.protectionRackets = player.protectionRackets.filter(r => r.id !== racketId);
      alert(`You pushed too hard! ${business.name} closed down and left the area.`);
      logAction(`📉 ${business.name} shuttered their doors permanently. You killed the golden goose.`);
    }
  }
  
  updateUI();
  showProtectionRackets();
}

async function dropProtection(racketId) {
  if (await ui.confirm("Are you sure you want to drop this protection racket?")) {
    player.protectionRackets = player.protectionRackets.filter(r => r.id !== racketId);
    showBriefNotification("Protection racket dropped.", 'warning');
    logAction("📤 Released a business from your protection. Sometimes mercy has its own rewards.");
    
    showProtectionRackets();
  }
}

async function initiateTurfWar(districtId) {
  const district = districtTypes.find(d => d.id === districtId);
  if (!district) return;
  
  const hasEnoughPower = player.territoryPower >= (district.acquisitionCost / 50); // Turf wars need more power
  
  if (!hasEnoughPower) {
    const requiredPower = Math.ceil(district.acquisitionCost / 50);
    showBriefNotification(`Need ${requiredPower} power for turf war over ${district.name}! Have ${player.territoryPower}.`, 'danger');
    return;
  }
  
  // Find which rival gang controls this territory
  const controllingGang = rivalGangs.find(gang => 
    gang.preferredDistricts.includes(districtId) && Math.random() < 0.5
  ) || rivalGangs[Math.floor(Math.random() * rivalGangs.length)];
  
  if (await ui.confirm(`Initiate turf war against ${controllingGang.name} for control of ${district.name}? This will be violent and costly.`)) {
    // Turf war calculation
    const playerPower = player.territoryPower + (player.gang.gangMembers.length * 10);
    const enemyPower = controllingGang.power + Math.floor(Math.random() * 100);
    
    const powerRatio = playerPower / (playerPower + enemyPower);
    const success = Math.random() < powerRatio;
    
    // Costs of war
    const casualties = Math.floor(Math.random() * 3) + 1;
    const moneyCost = Math.floor(Math.random() * 10000) + 5000;
    
    player.money = Math.max(0, player.money - moneyCost);
    player.wantedLevel += Math.floor(Math.random() * 30) + 20;
    player.territoryPower = Math.max(50, player.territoryPower - 20);
    
    // Remove gang members (casualties)
    for (let i = 0; i < casualties && player.gang.gangMembers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * player.gang.gangMembers.length);
      const lostMember = player.gang.gangMembers[randomIndex];
      player.gang.gangMembers.splice(randomIndex, 1);
      // Also decrement legacy member count
      if (player.gang.members > 0) {
        player.gang.members = Math.max(0, player.gang.members - 1);
      }
      // Reduce territory power for lost member
      const powerLoss = Math.floor((lostMember.experienceLevel || 1) * 2) + 5;
      player.territoryPower = Math.max(50, player.territoryPower - powerLoss);
    }
    
    if (success) {
      // Victory - acquire territory
      const newTerritory = {
        id: `territory_${Date.now()}`,
        districtId: district.id,
        acquisitionDate: Date.now(),
        defenseLevel: 1,
        businesses: [],
        lastIncomeCollection: Date.now()
      };
      
      player.territories.push(newTerritory);
      player.territoryHeat[newTerritory.id] = district.policePresence / 100;
      player.territoryReputation += 25;
      
      calculateTotalTerritoryIncome();
      
      showBriefNotification(`Victory! Took ${district.name} from ${controllingGang.name}! -$${moneyCost.toLocaleString()}, ${casualties} casualties`, 'success');
      logAction(`⚔️ Turf war victory! ${district.name} now flies your colors. Victory tastes sweet, but it's seasoned with blood and gold.`);
    } else {
      // Defeat
      showBriefNotification(`Defeat! ${controllingGang.name} held ${district.name}. -$${moneyCost.toLocaleString()}, ${casualties} casualties`, 'danger');
      logAction(`💀 Turf war defeat against ${controllingGang.name}. The streets remember losses longer than victories.`);
    }
    
    updateUI();
    showAvailableTerritories();
  }
}

function manageTerritoryDetails(territoryId) {
  const territory = player.territories.find(t => t.id === territoryId);
  if (!territory) return;
  
  const district = districtTypes.find(d => d.id === territory.districtId);
  if (!district) return;
  
  const heat = player.territoryHeat[territoryId] || 0;
  const income = calculateTerritoryIncome(territory);
  const upgradeCost = territory.defenseLevel * 5000;
  const ownedDays = Math.floor((Date.now() - territory.acquisitionDate) / (1000 * 60 * 60 * 24));
  
  // Count assigned gang members (enforcers/lieutenants)
  const assignedMembers = player.gang.gangMembers ? player.gang.gangMembers.filter(m => 
    m.specialization === 'enforcer' || m.specialization === 'lieutenant'
  ).length : 0;
  
  // Heat level description and color
  let heatDesc, heatColor;
  if (heat < 0.2) { heatDesc = 'Low'; heatColor = '#2ecc71'; }
  else if (heat < 0.5) { heatDesc = 'Moderate'; heatColor = '#f39c12'; }
  else if (heat < 0.8) { heatDesc = 'High'; heatColor = '#e67e22'; }
  else { heatDesc = 'Critical'; heatColor = '#e74c3c'; }

  hideAllScreens();
  document.getElementById("map-screen").style.display = "block";
  
  let html = `
    <h2>${district.icon || '🏛️'} ${district.name} — Territory Management</h2>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin: 20px 0;">
      <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; text-align: center;">
        <div style="font-size: 2em;">💰</div>
        <div style="color: #bdc3c7; font-size: 0.9em;">Weekly Income</div>
        <div style="color: #2ecc71; font-size: 1.4em; font-weight: bold;">$${income.toLocaleString()}</div>
      </div>
      <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; text-align: center;">
        <div style="font-size: 2em;">🛡️</div>
        <div style="color: #bdc3c7; font-size: 0.9em;">Defense Level</div>
        <div style="color: #3498db; font-size: 1.4em; font-weight: bold;">Level ${territory.defenseLevel}</div>
      </div>
      <div style="background: rgba(231, 76, 60, 0.15); padding: 15px; border-radius: 10px; text-align: center;">
        <div style="font-size: 2em;">🔥</div>
        <div style="color: #bdc3c7; font-size: 0.9em;">Heat Level</div>
        <div style="color: ${heatColor}; font-size: 1.4em; font-weight: bold;">${heatDesc} (${(heat * 100).toFixed(0)}%)</div>
      </div>
      <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; text-align: center;">
        <div style="font-size: 2em;">👥</div>
        <div style="color: #bdc3c7; font-size: 0.9em;">Enforcers/Lieutenants</div>
        <div style="color: #9b59b6; font-size: 1.4em; font-weight: bold;">${assignedMembers}</div>
      </div>
    </div>
    
    <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin: 15px 0;">
      <h3 style="color: #f39c12; margin: 0 0 12px 0;">📊 Territory Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; color: #bdc3c7;">
        <div>Base Income: <span style="color: #f1c40f;">$${district.baseIncome.toLocaleString()}/wk</span></div>
        <div>Defense Bonus: <span style="color: #3498db;">+${((territory.defenseLevel - 1) * 10)}%</span></div>
        <div>Heat Penalty: <span style="color: ${heatColor};">-${Math.round(Math.min(70, heat * 50))}%</span></div>
        <div>Crew Bonus: <span style="color: #9b59b6;">+${assignedMembers * 5}%</span></div>
        <div>Owned For: <span style="color: #ecf0f1;">${ownedDays} day${ownedDays !== 1 ? 's' : ''}</span></div>
        <div>Total Businesses: <span style="color: #e67e22;">${territory.businesses ? territory.businesses.length : 0}</span></div>
      </div>
    </div>
    
    <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin: 15px 0;">
      <h3 style="color: #3498db; margin: 0 0 12px 0;">⚙️ Actions</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        <button onclick="fortifyTerritory('${territoryId}')" style="background: #2980b9; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; flex: 1; min-width: 180px;">
          🛡️ Fortify ($${upgradeCost.toLocaleString()})
        </button>
        <button onclick="reduceHeatTerritory('${territoryId}')" style="background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; flex: 1; min-width: 180px;">
          🧊 Reduce Heat ($${Math.floor(heat * 10000).toLocaleString()})
        </button>
        <button onclick="collectTerritoryTribute('${territoryId}')" style="background: #f39c12; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; flex: 1; min-width: 180px;">
          💰 Collect Tribute Now
        </button>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="showMap()" style="background: #3498db; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🗺️ Back to Map
      </button>
      <button onclick="showTerritoryControl()" style="background: #8e44ad; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🏛️ Territory Management
      </button>
      <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🏠 SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("map-content").innerHTML = html;
}

function reduceHeatTerritory(territoryId) {
  const heat = player.territoryHeat[territoryId] || 0;
  const cost = Math.floor(heat * 10000);
  
  if (cost <= 0 || heat < 0.05) {
    showBriefNotification("Heat is already minimal!", 'info');
    return;
  }
  
  if (player.money < cost) {
    showBriefNotification(`Need $${cost.toLocaleString()} to bribe officials and reduce heat!`, 'danger');
    return;
  }
  
  player.money -= cost;
  player.territoryHeat[territoryId] = Math.max(0, heat - 0.3);
  
  showBriefNotification("🧊 Heat reduced! Officials have been paid off.", 'success');
  logAction("🧊 Bribed local officials to reduce territory heat. The streets cool down... for now.");
  updateUI();
  manageTerritoryDetails(territoryId);
}

function collectTerritoryTribute(territoryId) {
  const territory = player.territories.find(t => t.id === territoryId);
  if (!territory) return;
  
  const timeSinceLast = Date.now() - territory.lastIncomeCollection;
  const minInterval = 60 * 60 * 1000; // 1 hour minimum between collections
  
  if (timeSinceLast < minInterval) {
    const minutesLeft = Math.ceil((minInterval - timeSinceLast) / (60 * 1000));
    showBriefNotification(`Tribute not ready yet. Wait ${minutesLeft} min.`, 'warning');
    return;
  }
  
  const income = calculateTerritoryIncome(territory);
  const fraction = Math.min(1, timeSinceLast / (7 * 24 * 60 * 60 * 1000)); // Scale by time waited (max 1 week)
  const collected = Math.floor(income * fraction);
  
  player.dirtyMoney = (player.dirtyMoney || 0) + collected;
  territory.lastIncomeCollection = Date.now();
  
  // Collecting early increases heat slightly
  player.territoryHeat[territoryId] = (player.territoryHeat[territoryId] || 0) + 0.05;
  
  showBriefNotification(`💰 Collected $${collected.toLocaleString()} in tribute (dirty money)!`, 'success');
  logAction(`💰 Collected $${collected.toLocaleString()} in territory tribute. Early collections attract attention.`);
  updateUI();
  manageTerritoryDetails(territoryId);
}

async function fortifyTerritory(territoryId) {
  const territory = player.territories.find(t => t.id === territoryId);
  if (!territory) return;
  
  const upgradeCost = territory.defenseLevel * 5000;
  
  if (player.money < upgradeCost) {
    showBriefNotification(`Need $${upgradeCost.toLocaleString()} to fortify this territory!`, 'danger');
    return;
  }
  
  if (await ui.confirm(`Fortify territory for $${upgradeCost.toLocaleString()}? This will increase income and reduce heat.`)) {
    player.money -= upgradeCost;
    territory.defenseLevel += 1;
    
    // Reduce heat slightly
    if (player.territoryHeat[territoryId]) {
      player.territoryHeat[territoryId] = Math.max(0, player.territoryHeat[territoryId] - 0.1);
    }
    
    calculateTotalTerritoryIncome();
    
    showBriefNotification("Territory fortified! Defense up, heat reduced.", 'success');
    logAction("🛡️ Territory fortifications improved. A strong defense makes for a profitable offense.");
    
    updateUI();
    showTerritoryControl();
  }
}

// Process Territory Events and Income (called periodically)
function processTerritoryOperations() {
  // Collect territory income
  const currentTime = Date.now();
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  
  player.territories.forEach(territory => {
    if (currentTime - territory.lastIncomeCollection >= weekInMs) {
      const income = calculateTerritoryIncome(territory);
      // Territory tribute is dirty money that must be laundered
      player.dirtyMoney = (player.dirtyMoney || 0) + income;
      territory.lastIncomeCollection = currentTime;
      
      if (income > 0) {
        logAction(`💰 Territory tribute collected: $${income.toLocaleString()} (dirty) from your controlled areas.`);
      }
    }
  });
  
  // Process territory events
  if (player.territories.length > 0 && Math.random() < 0.1) { // 10% chance per check
    generateTerritoryEvent();
  }
  
  // Expire corrupted officials
  player.corruptedOfficials = player.corruptedOfficials.filter(official => {
    if (official.expirationDate <= currentTime) {
      const target = corruptionTargets.find(t => t.id === official.targetId);
      logAction(`💼 ${target.name} is no longer under your influence. Corruption requires constant maintenance.`);
      return false;
    }
    return true;
  });
  
  // Decay territory heat over time
  Object.keys(player.territoryHeat).forEach(territoryId => {
    player.territoryHeat[territoryId] = Math.max(0, player.territoryHeat[territoryId] - 0.05);
  });
  
  calculateTotalTerritoryIncome();
}

function generateTerritoryEvent() {
  if (player.territories.length === 0) return;
  
  const randomEvent = territoryEvents[Math.floor(Math.random() * territoryEvents.length)];
  const randomTerritory = player.territories[Math.floor(Math.random() * player.territories.length)];
  
  const event = {
    id: `event_${Date.now()}`,
    territoryId: randomTerritory.id,
    name: randomEvent.name,
    description: randomEvent.description,
    effects: randomEvent.effects,
    duration: randomEvent.effects.duration,
    startTime: Date.now()
  };
  
  player.territoryEvents.push(event);
  
  alert(`Territory Event: ${event.name}\n${event.description}`);
  logAction(`📰 Territory event: ${event.name}. ${event.description} The game never stops changing.`);
}

// Function to update money, power, inventory, health, and wanted level UI
function updateUI() {
  // Synchronize gang member counts to prevent drift
  if (player.gang && player.gang.gangMembers) {
    // Ensure legacy count matches actual array length
    player.gang.members = player.gang.gangMembers.length;
    
    // Recalculate territory power based on gang members if it seems too low
    if (player.territoryPower < 150 && player.gang.gangMembers.length > 0) {
      let calculatedPower = 100; // Base power
      player.gang.gangMembers.forEach(member => {
        calculatedPower += Math.floor((member.experienceLevel || 1) * 2) + 5;
      });
      player.territoryPower = Math.max(player.territoryPower, calculatedPower);
    }
  }
  
  // Update player portrait and name
  if (player.name) {
    const nameDisplay = document.getElementById("player-name-display");
    if (nameDisplay) {
      nameDisplay.textContent = player.name;
    }
  }
  
  if (player.portrait) {
    const portraitDisplay = document.getElementById("player-portrait");
    if (portraitDisplay) {
      const testImg = new Image();
      testImg.onload = function() {
        portraitDisplay.src = player.portrait;
        portraitDisplay.style.display = 'block';
      };
      testImg.onerror = function() {
        portraitDisplay.style.display = 'none';
      };
      testImg.src = player.portrait;
    }
  }
  
  // Emit state change events (pub/sub)
  const dirty = (player.dirtyMoney || 0);
  try {
    if (window.EventBus) {
      if (!window.__lastEventSnapshot) {
        window.__lastEventSnapshot = {
          money: player.money,
          dirtyMoney: dirty,
          reputation: player.reputation,
          wantedLevel: player.wantedLevel,
          energy: player.energy,
          health: player.health,
          inJail: player.inJail,
          jailTime: player.jailTime,
          territoryCount: player.territories.length,
          level: player.level,
          experience: player.experience
        };
      }
      const snap = window.__lastEventSnapshot;
      const emitNum = (key, value, evt) => {
        const old = snap[key];
        if (old !== value) {
          EventBus.emit(evt, { oldValue: old, newValue: value });
          snap[key] = value;
        }
      };
      if (snap.inJail !== player.inJail) {
        EventBus.emit('jailStatusChanged', { inJail: player.inJail, jailTime: player.jailTime });
        snap.inJail = player.inJail;
      }
      if (snap.jailTime !== player.jailTime) {
        EventBus.emit('jailTimeUpdated', { jailTime: player.jailTime });
        snap.jailTime = player.jailTime;
      }
      emitNum('money', player.money, 'moneyChanged');
      emitNum('dirtyMoney', dirty, 'dirtyMoneyChanged');
      emitNum('reputation', Math.floor(player.reputation), 'reputationChanged');
      emitNum('wantedLevel', player.wantedLevel, 'wantedLevelChanged');
      emitNum('energy', player.energy, 'energyChanged');
      emitNum('health', player.health, 'healthChanged');
      emitNum('territoryCount', player.territories.length, 'territoryChanged');
      emitNum('level', player.level, 'levelChanged');
      emitNum('experience', player.experience, 'experienceChanged');
    }
  } catch (e) { /* no-op */ }

  // Check for newly unlocked menu items
  checkForNewUnlocks();

  // Money and wanted level HUD updates handled via EventBus subscribers
  
  // Update dirty money display in stats bar (always visible)
  const dirtyMoneyDisplay = document.getElementById("dirty-money-display");
  if (dirtyMoneyDisplay) {
    const dirtyAmount = player.dirtyMoney || 0;
    dirtyMoneyDisplay.innerText = `Dirty Money: $${dirtyAmount.toLocaleString()}`;
  }
  
  // Update suspicion display in stats bar
  const suspicionDisplay = document.getElementById("suspicion-display");
  if (suspicionDisplay) {
    const suspicion = player.suspicionLevel || 0;
    suspicionDisplay.innerText = `Suspicion: ${suspicion}%`;
    // Color-code based on danger thresholds
    if (suspicion >= 75) {
      suspicionDisplay.style.color = '#e74c3c'; // Red - critical
    } else if (suspicion >= 50) {
      suspicionDisplay.style.color = '#e67e22'; // Orange - high
    } else if (suspicion >= 25) {
      suspicionDisplay.style.color = '#f1c40f'; // Yellow - moderate
    } else {
      suspicionDisplay.style.color = '#2ecc71'; // Green - safe
    }
    suspicionDisplay.style.display = suspicion > 0 ? 'block' : 'none';
  }
  
  document.getElementById("power-display").innerText = `Power: ${player.power}`;
  
  // Add territory display if player has territories
  const territoryDisplay = document.getElementById("territory-display");
  if (territoryDisplay) {
    if (player.territories.length > 0) {
      territoryDisplay.innerText = `Territories: ${player.territories.length} | Income: $${player.territoryIncome.toLocaleString()}/week`;
      territoryDisplay.style.display = 'block';
    } else {
      territoryDisplay.style.display = 'none';
    }
  }
  
  document.getElementById("health-display").innerText = `Health: ${player.health}`;
  
  // Update energy display with timer (compact format)
  let energyText = `Energy: ${player.energy}/${player.maxEnergy}`;
  if (player.energy < player.maxEnergy && !player.inJail) {
    energyText += ` (${player.energyRegenTimer}s)`;
  } else if (player.energy >= player.maxEnergy) {
    energyText += ` ✓`;
  } else if (player.inJail) {
    energyText += ` ❌`;
  }
  document.getElementById("energy-display").innerText = energyText;
  
  // Update Empire Rating (passive calculation)
  calculateEmpireRating();
  
  // Add new UI elements if they exist
  if (document.getElementById("level-display")) {
    document.getElementById("level-display").innerText = `Level: ${player.level}`;
  }
  if (document.getElementById("experience-display")) {
    const xpNeeded = Math.floor(player.level * 500 + Math.pow(player.level, 2) * 80 + Math.pow(player.level, 3) * 5);
    document.getElementById("experience-display").innerText = `XP: ${player.experience}/${xpNeeded}`;
  }
  if (document.getElementById("skill-points-display")) {
    document.getElementById("skill-points-display").innerText = `Skill Points: ${player.skillPoints}`;
  }
  if (document.getElementById("season-display")) {
    document.getElementById("season-display").innerText = `Season: ${currentSeason}`;
  }
  
  // Update weather HUD
  const weatherDisplay = document.getElementById("weather-display");
  if (weatherDisplay) {
    const weather = weatherEffects[currentWeather];
    if (weather) {
      weatherDisplay.innerText = `Weather: ${weather.icon} ${weather.name}`;
    }
  }
  
  // Update active events HUD
  const eventsDisplay = document.getElementById("active-events-display");
  if (eventsDisplay) {
    if (activeEvents && activeEvents.length > 0) {
      const eventNames = activeEvents.map(e => `${e.icon || '📰'} ${e.name}`).join(', ');
      eventsDisplay.innerText = `Events: ${eventNames}`;
      eventsDisplay.style.display = 'block';
    } else {
      eventsDisplay.style.display = 'none';
    }
  }

  // Update right panel
  updateRightPanel();
  updateRightPanelExtras();
  updateQuickActions();

  if (player.inJail) {
    showJailScreen(); // Ensure jail screen is shown when in jail
  }

  // Refresh current screen if it depends on energy/money/stats
  refreshCurrentScreen();

  // Check for level up
  checkLevelUp();
  // Check for achievements
  checkAchievements();
  // Recalculate empire rating
  calculateEmpireRating();
  // Check weekly challenges (less frequent)
  if (Math.random() < 0.1) { // 10% chance per UI update to avoid too frequent checks
    checkWeeklyChallenges();
  }

  // Refresh onboarding tracker text if tutorial still active
  updateTracker();
}

// ==================== CHEAT / DEBUG FUNCTION ====================
function cheatGrantResources() {
  try {
    const cleanAmount = 100000;
    const dirtyAmount = 100000;
    const skillPointsAmount = 100;
    const xpAmount = 100000;
    player.money += cleanAmount;
    player.dirtyMoney = (player.dirtyMoney || 0) + dirtyAmount;
    player.skillPoints = (player.skillPoints || 0) + skillPointsAmount;
    player.experience = (player.experience || 0) + xpAmount;
    logAction(`🧪 Cheat activated: +$${cleanAmount.toLocaleString()} clean, +$${dirtyAmount.toLocaleString()} dirty, +${skillPointsAmount} skill points, +${xpAmount.toLocaleString()} XP.`);
    updateUI();
  } catch (e) {
    console.error('Cheat function error:', e);
  }
}
if (typeof window !== 'undefined') {
  window.cheatGrantResources = cheatGrantResources;
}

// Function to refresh the currently active screen
// IMPORTANT: This runs every ~1 second via the energy regen loop.
// Never do a full innerHTML rebuild here — only patch individual elements
// to avoid destroying hover/focus states and causing visible flicker.
function refreshCurrentScreen() {
  // Check if jobs screen is visible — patch buttons only
  const jobsScreen = document.getElementById("jobs-screen");
  if (jobsScreen && jobsScreen.style.display !== "none") {
    refreshJobsButtons();
    return;
  }
  
  // If store is open, only refresh dynamic elements to avoid flicker
  const storeScreen = document.getElementById("store-screen");
  if (storeScreen && storeScreen.style.display !== "none") {
    if (typeof refreshStoreDynamicElements === 'function') {
      refreshStoreDynamicElements();
    }
    return;
  }
  
  // Skills — no per-second refresh needed (points update in HUD bar)
  // Gang — no per-second refresh needed
  // Business — no per-second refresh needed
}

// Lightweight per-second refresh: only patch job button text / color / disabled
// without replacing any DOM nodes. This prevents hover-state flicker.
function refreshJobsButtons() {
  const jobListElement = document.getElementById("job-list");
  if (!jobListElement) return;

  const buttons = jobListElement.querySelectorAll('button[data-job-index]');
  buttons.forEach(btn => {
    const index = parseInt(btn.getAttribute('data-job-index'), 10);
    const job = jobs[index];
    if (!job) return;

    const hasRequirements = hasRequiredItems(job.requiredItems) && player.reputation >= job.reputation;
    const actualEnergyCost = Math.max(1, job.energyCost - player.skills.endurance);

    let buttonColor = "green";
    let buttonText = "Work";
    let isDisabled = false;

    if (!hasRequirements) {
      buttonColor = "red";
      buttonText = "Requirements Not Met";
      isDisabled = true;
    } else if (player.energy < actualEnergyCost) {
      buttonColor = "orange";
      buttonText = `Need ${actualEnergyCost} Energy`;
      isDisabled = true;
    } else if (job.risk === "high") {
      buttonColor = "gold";
      buttonText = "Execute";
    }

    // Only touch the DOM if something actually changed
    if (btn.style.backgroundColor !== buttonColor) btn.style.backgroundColor = buttonColor;
    if (btn.disabled !== isDisabled) btn.disabled = isDisabled;
    if (btn.textContent.trim() !== buttonText) btn.textContent = buttonText;
  });
}

// Full job-list rebuild — called by showJobs() and energy-purchase helpers.
// NOT called on the per-second timer.
function refreshJobsList() {
  const jobListElement = document.getElementById("job-list");
  if (!jobListElement) {
    showJobs();
    return;
  }

  if (player.inJail) {
    jobListElement.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">You cannot work while in jail!</p>';
    return;
  }

  let jobListHTML = jobs.map((job, index) => {
    const hasRequirements = hasRequiredItems(job.requiredItems) && player.reputation >= job.reputation;
    const requirementsText = job.requiredItems.length > 0 ? `Required Items: ${job.requiredItems.join(", ")}` : "No required items";
    const actualEnergyCost = Math.max(1, job.energyCost - player.skills.endurance);

    let payoutText = "";
    if (job.special === "car_theft") {
      payoutText = "Steal random car to sell";
    } else if (job.paysDirty) {
      payoutText = `<span style="color:#e74c3c;">$${job.payout[0].toLocaleString()} to $${job.payout[1].toLocaleString()} (DIRTY MONEY)</span>`;
    } else {
      payoutText = `$${job.payout[0].toLocaleString()} to $${job.payout[1].toLocaleString()}`;
    }

    let buttonColor = "green";
    let buttonText = "Work";
    let isDisabled = false;

    if (!hasRequirements) {
      buttonColor = "red";
      buttonText = "Requirements Not Met";
      isDisabled = true;
    } else if (player.energy < actualEnergyCost) {
      buttonColor = "orange";
      buttonText = `Need ${actualEnergyCost} Energy`;
      isDisabled = true;
    } else if (job.risk === "high") {
      buttonColor = "gold";
      buttonText = "Execute";
    }

    let energyDisplay = actualEnergyCost < job.energyCost ?
      `${actualEnergyCost} (reduced from ${job.energyCost})` :
      `${actualEnergyCost}`;

    return `
      <li>
        <strong>${job.name}</strong> - ${payoutText}
        <br><small>Risk: ${job.risk.toUpperCase()} | Energy Cost: ${energyDisplay}</small>
        <button data-job-index="${index}" style="background-color: ${buttonColor};"
            onclick="startJob(${index})"
            ${isDisabled ? 'disabled' : ''}
            title="Reputation Required: ${job.reputation}\n${requirementsText}\nJail Chance: ${job.jailChance}%\nHealth Loss: Up to ${job.healthLoss}\nWanted Level Gain: ${job.wantedLevelGain}\nEnergy Cost: ${actualEnergyCost}">
          ${buttonText}
        </button>
      </li>
    `;
  }).join('');

  jobListElement.innerHTML = jobListHTML;
}

// Function to update the right panel
function updateRightPanel() {
  // Quick stats removed; guard retained for future restore
  
  // Update energy bar
  if (document.getElementById("energy-fill")) {
    const energyPercentage = (player.energy / player.maxEnergy) * 100;
    document.getElementById("energy-fill").style.width = energyPercentage + "%";
  }
  if (document.getElementById("energy-text")) {
    document.getElementById("energy-text").innerText = `${player.energy}/${player.maxEnergy}`;
  }
}

// Quick Actions panel — respects the progressive unlock system
// Default shortcuts shown before the player customizes
const DEFAULT_QUICK_ACTIONS = ['jobs', 'store', 'missions', 'gang', 'businesses', 'territory', 'casino', 'skills'];

function getQuickActionIds() {
  if (player.quickActionPrefs && player.quickActionPrefs.length > 0) {
    return player.quickActionPrefs;
  }
  return DEFAULT_QUICK_ACTIONS;
}

function updateQuickActions() {
  const container = document.getElementById('quick-actions-list');
  if (!container) return;

  const ids = getQuickActionIds();

  let html = `<button onclick="goBackToMainMenu()" class="quick-btn main-menu-btn">SafeHouse</button>`;

  ids.forEach(id => {
    const item = menuUnlockConfig.find(m => m.id === id);
    if (item && isMenuItemUnlocked(item)) {
      html += `<button onclick="${item.fn}" class="quick-btn">${item.label}</button>`;
    }
  });

  html += `<button onclick="saveGame()" class="quick-btn save-btn">Save Records</button>`;

  container.innerHTML = html;
}
window.updateQuickActions = updateQuickActions;

// ==================== QUICK ACTION CUSTOMIZER ====================

function showQuickActionCustomizer() {
  const unlocked = menuUnlockConfig.filter(item => isMenuItemUnlocked(item));
  const current = getQuickActionIds();

  let html = `
    <div class="page-header">
      <h1><span class="icon"></span> Quick Actions</h1>
      <div class="breadcrumb">
        <a href="#" onclick="goBackToMainMenu(); return false;">SafeHouse</a>
        <span class="separator">›</span>
        <a href="#" onclick="showOptions(); return false;">Settings</a>
        <span class="separator">›</span>
        <span class="current">Quick Actions</span>
      </div>
    </div>

    <div style="max-width:700px;margin:0 auto;">
      <p style="color:#bdc3c7;text-align:center;margin-bottom:20px;font-size:0.95em;">Pick which shortcuts appear in the right-hand panel.<br>SafeHouse and Save Records are always shown.</p>

      <div id="qa-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:25px;">
        ${unlocked.map(item => {
          const active = current.includes(item.id);
          return `<label data-qaid="${item.id}" onclick="toggleQuickActionPref('${item.id}')" 
            style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;cursor:pointer;transition:all 0.2s;
            background:${active ? 'rgba(46,204,113,0.15)' : 'rgba(52,73,94,0.5)'};
            border:2px solid ${active ? '#2ecc71' : '#555'};">
            <span style="font-size:1.4em;">${active ? '✅' : '⬜'}</span>
            <span style="color:#ecf0f1;font-weight:bold;">${item.label}</span>
          </label>`;
        }).join('')}
      </div>

      <div style="text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button onclick="resetQuickActionPrefs()" style="background:#95a5a6;color:#fff;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-size:1em;">↩ Reset to Default</button>
        <button onclick="showOptions()" style="background:linear-gradient(135deg,#d4af37,#b8962e);color:#1a1a2e;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1em;">✔ Done</button>
      </div>
    </div>`;

  hideAllScreens();
  // Re-use the statistics screen as a general-purpose display area
  const screen = document.getElementById('statistics-screen');
  screen.style.display = 'block';
  const content = document.getElementById('statistics-content') || screen;
  content.innerHTML = html;
}
window.showQuickActionCustomizer = showQuickActionCustomizer;

function toggleQuickActionPref(id) {
  if (!player.quickActionPrefs) {
    player.quickActionPrefs = [...DEFAULT_QUICK_ACTIONS];
  }
  const idx = player.quickActionPrefs.indexOf(id);
  if (idx !== -1) {
    player.quickActionPrefs.splice(idx, 1);
  } else {
    player.quickActionPrefs.push(id);
  }
  updateQuickActions();
  // Re-render the customizer grid to reflect the toggle
  showQuickActionCustomizer();
}
window.toggleQuickActionPref = toggleQuickActionPref;

function resetQuickActionPrefs() {
  player.quickActionPrefs = [...DEFAULT_QUICK_ACTIONS];
  updateQuickActions();
  showQuickActionCustomizer();
}
window.resetQuickActionPrefs = resetQuickActionPrefs;

// Update remaining right-panel elements (energy timer, quick buy labels, etc.)
function updateRightPanelExtras() {
  // Update energy timer
  if (document.getElementById("energy-timer")) {
    if (player.energy < player.maxEnergy && !player.inJail) {
      document.getElementById("energy-timer").innerText = `${player.energyRegenTimer}s`;
    } else if (player.energy >= player.maxEnergy) {
      document.getElementById("energy-timer").innerText = "Full";
    } else {
      document.getElementById("energy-timer").innerText = "Paused";
    }
  }

  // Update quick buy labels for energy options
  const energyDrink = storeItems.find(item => item.name === "Energy Drink");
  const strongCoffee = storeItems.find(item => item.name === "Strong Coffee");
  const steroids = storeItems.find(item => item.name === "Steroids");

  if (document.getElementById('quick-buy-energydrink') && energyDrink) {
    document.getElementById('quick-buy-energydrink').innerText = `${energyDrink.name} ($${formatShortMoney(energyDrink.price)})`;
  }
  if (document.getElementById('quick-buy-coffee') && strongCoffee) {
    document.getElementById('quick-buy-coffee').innerText = `${strongCoffee.name} ($${formatShortMoney(strongCoffee.price)})`;
  }
  if (document.getElementById('quick-buy-steroids') && steroids) {
    document.getElementById('quick-buy-steroids').innerText = `${steroids.name} ($${formatShortMoney(steroids.price)})`;
  }
  
  // Update jail status
  if (document.getElementById("jail-status")) {
    document.getElementById("jail-status").innerText = player.inJail ? `${player.jailTime}s` : "Free";
  }
  
  // Update cars count
  if (document.getElementById("cars-count")) {
    document.getElementById("cars-count").innerText = player.stolenCars.length;
  }
}

// Quick energy purchase functions
function buyEnergyDrink() {
  const energyDrink = storeItems.find(item => item.name === "Energy Drink");
  if (player.money >= energyDrink.price) {
    // Enforce daily limit on energy drink usage
    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    if (!player.dailyCounters) player.dailyCounters = {};
    if (player.dailyCounters.energyDrinksDay !== dayKey) {
      player.dailyCounters.energyDrinksDay = dayKey;
      player.dailyCounters.energyDrinksUsed = 0;
    }
    const MAX_ENERGY_DRINKS_PER_DAY = 5;
    if ((player.dailyCounters.energyDrinksUsed || 0) >= MAX_ENERGY_DRINKS_PER_DAY) {
      alert(`You've reached today's limit for Energy Drinks (${MAX_ENERGY_DRINKS_PER_DAY}). Try coffee or rest up.`);
      return;
    }

    const energyBefore = player.energy;
    player.money -= energyDrink.price;
    player.energy = Math.min(player.maxEnergy, player.energy + energyDrink.energyRestore);
    player.health = Math.max(0, player.health - 1); // Health penalty
    
    const energyGained = player.energy - energyBefore;
    player.dailyCounters.energyDrinksUsed = (player.dailyCounters.energyDrinksUsed || 0) + 1;
    
    alert(`Bought Energy Drink! Restored ${energyGained} energy but ${getRandomNarration('healthLoss')}\n\nNew Energy: ${player.energy}/${player.maxEnergy}`);
    logAction(`⚗️ ${getRandomNarration('healthLoss')} The chemical rush comes with a price, but the energy boost might be worth it.`);
    logAction("🥤 You chug down the energy drink. The caffeine hits your bloodstream like liquid lightning, but your body pays the price (+30 energy, -1 health).");
    
    if (player.health <= 0) {
      showDeathScreen('Overdosed on energy drinks');
    }
    updateUI(); // This will now refresh the jobs screen if it's visible
  } else {
    alert("You don't have enough money!");
  }
}

function buyCoffee() {
  const coffee = storeItems.find(item => item.name === "Strong Coffee");
  if (player.money >= coffee.price) {
    const energyBefore = player.energy;
    player.money -= coffee.price;
    player.energy = Math.min(player.maxEnergy, player.energy + coffee.energyRestore);
    
    const energyGained = player.energy - energyBefore;
    
    alert(`Bought Strong Coffee! Restored ${energyGained} energy.\n\nNew Energy: ${player.energy}/${player.maxEnergy}`);
    logAction("☕ Hot coffee burns your throat as you down it in one gulp. The warmth spreads through your chest, pushing back the exhaustion (+15 energy).");
    updateUI(); // This will now refresh the jobs screen if it's visible
  } else {
    alert("You don't have enough money!");
  }
}

function buySteroids() {
  const steroid = storeItems.find(item => item.name === "Steroids");
  if (!steroid) {
    alert("Steroids are not available right now.");
    return;
  }

  if (player.money >= steroid.price) {
    const energyBefore = player.energy;
    player.money -= steroid.price;
    player.energy = Math.min(player.maxEnergy, player.energy + (steroid.energyRestore || 60));
    // Steroids are risky — small health cost and suspicion bump
    player.health = Math.max(0, player.health - 5);
    player.suspicionLevel = Math.min(100, player.suspicionLevel + 5);

    const energyGained = player.energy - energyBefore;
    alert(`Bought Steroids! Restored ${energyGained} energy but it's risky.
\nNew Energy: ${player.energy}/${player.maxEnergy}`);
    logAction(`Steroids used for a quick boost. ${getRandomNarration('healthLoss')}`);

    if (player.health <= 0) {
      showDeathScreen('Heart failure from steroid abuse');
    }
    updateUI();
  } else {
    alert("You don't have enough money!");
  }
}

// Function to check if the player has required items for a job
function hasRequiredItems(requiredItems) {
  return requiredItems.every(item => {
    if (item === "ammo") return player.ammo > 0;
    if (item === "gas") return player.gas > 0;
    
    // Check for real estate properties
    const realEstateNames = realEstateProperties.map(prop => prop.name);
    if (realEstateNames.includes(item)) {
      return player.realEstate.ownedProperties.some(prop => prop.name === item);
    }
    
    return player.inventory.some(invItem => invItem.name === item);
  });
}

// Function to hide all screens
function hideAllScreens() {
  // Always scroll to top on screen transitions
  window.scrollTo(0, 0);
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameplay").style.display = "none";
  document.getElementById("jobs-screen").style.display = "none";
  document.getElementById("store-screen").style.display = "none";
  document.getElementById("real-estate-screen").style.display = "none";
  document.getElementById("skills-screen").style.display = "none";
  document.getElementById("gang-screen").style.display = "none";
  document.getElementById("stolen-cars-screen").style.display = "none";
  document.getElementById("jail-screen").style.display = "none";
  document.getElementById("court-house-screen").style.display = "none";
  document.getElementById("inventory-screen").style.display = "none";
  document.getElementById("hospital-screen").style.display = "none";
  document.getElementById("death-screen").style.display = "none";
  document.getElementById("achievements-screen").style.display = "none";
  document.getElementById("jailbreak-screen").style.display = "none";
  document.getElementById("recruitment-screen").style.display = "none";
  document.getElementById("casino-screen").style.display = "none";
  document.getElementById("pharmacy-screen").style.display = "none";
  document.getElementById("mini-games-screen").style.display = "none";
  document.getElementById("missions-screen").style.display = "none";
  document.getElementById("business-screen").style.display = "none";
  document.getElementById("loan-shark-screen").style.display = "none";
  document.getElementById("money-laundering-screen").style.display = "none";
  const fenceScreen = document.getElementById("fence-screen");
  if (fenceScreen) fenceScreen.style.display = "none";
  document.getElementById("territory-control-screen").style.display = "none";
  document.getElementById("events-screen").style.display = "none";
  document.getElementById("map-screen").style.display = "none";
  document.getElementById("calendar-screen").style.display = "none";
  document.getElementById("statistics-screen").style.display = "none";
  document.getElementById("options-screen").style.display = "none";
  const playerStatsScreen = document.getElementById("player-stats-screen");
  if (playerStatsScreen) playerStatsScreen.style.display = "none";
  const cmdCenter = document.getElementById("safehouse");
  if (cmdCenter) cmdCenter.style.display = "none";
}

// Function to show jobs
function showJobs() {
  if (player.inJail) {
    alert("You can't work while you're in jail!");
    return;
  }

  let jobListHTML = `
    <h3>Available Jobs</h3>
    <ul>
      ${jobs.map((job, index) => {
        const hasRequirements = hasRequiredItems(job.requiredItems) && player.reputation >= job.reputation;
        const requirementsText = job.requiredItems.length > 0 ? `Required Items: ${job.requiredItems.join(", ")}` : "No required items";
        
        // Calculate actual energy cost with endurance skill
        const actualEnergyCost = Math.max(1, job.energyCost - player.skills.endurance);
        
        let payoutText = "";
        if (job.special === "car_theft") {
          payoutText = "Steal random car to sell";
        } else if (job.paysDirty) {
          payoutText = `<span style="color:#e74c3c;">$${job.payout[0].toLocaleString()} to $${job.payout[1].toLocaleString()} (DIRTY MONEY)</span>`;
        } else {
          payoutText = `$${job.payout[0].toLocaleString()} to $${job.payout[1].toLocaleString()}`;
        }
        
        let buttonColor = "green";
        let buttonText = "Work";
        let isDisabled = false;
        
        if (!hasRequirements) {
          buttonColor = "red";
          buttonText = "Requirements Not Met";
          isDisabled = true;
        } else if (player.energy < actualEnergyCost) {
          buttonColor = "orange";
          buttonText = `Need ${actualEnergyCost} Energy`;
          isDisabled = true;
        } else if (job.risk === "legendary") {
          buttonColor = "#9b59b6";
          buttonText = "Legendary Hit";
        } else if (job.risk === "extreme") {
          buttonColor = "#c0392b";
          buttonText = "Go All In";
        } else if (job.risk === "very high") {
          buttonColor = "#e67e22";
          buttonText = "High Stakes";
        } else if (job.risk === "high") {
          buttonColor = "gold";
          buttonText = "Execute";
        }
        
        let energyDisplay = actualEnergyCost < job.energyCost ? 
          `${actualEnergyCost} (reduced from ${job.energyCost})` : 
          `${actualEnergyCost}`;
        
        return `
          <li>
            <strong>${job.name}</strong> - ${payoutText}
            <br><small>Risk: ${job.risk.toUpperCase()} | Energy Cost: ${energyDisplay}</small>
            <button data-job-index="${index}" style="background-color: ${buttonColor};" 
                onclick="startJob(${index})" 
                ${isDisabled ? 'disabled' : ''}
                title="Reputation Required: ${job.reputation}\n${requirementsText}\nJail Chance: ${job.jailChance}%\nHealth Loss: Up to ${job.healthLoss}\nWanted Level Gain: ${job.wantedLevelGain}\nEnergy Cost: ${actualEnergyCost}">
              ${buttonText}
            </button>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  document.getElementById("job-list").innerHTML = jobListHTML;
  hideAllScreens();
  document.getElementById("jobs-screen").style.display = "block";
}

// Function to log actions
// Remove emojis from UI strings
function stripEmoji(str) {
  if (!str) return str;
  try {
    return str
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/\uFE0F/gu, '')
      .replace(/[\u2600-\u27BF]/g, '');
  } catch (e) {
    return str.replace(/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '');
  }
}

// Format money to short form (e.g., 1500 -> 1.5K, 1500000 -> 1.5M)
function formatShortMoney(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return amount;
  if (amount >= 1000000) {
    const val = Math.round((amount / 1000000) * 10) / 10;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M';
  }
  if (amount >= 1000) {
    const val = Math.round((amount / 1000) * 10) / 10;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K';
  }
  return amount.toLocaleString();
}

function logAction(message) {
  const logList = document.getElementById("log-list");
  const logItem = document.createElement("li");
  logItem.innerText = stripEmoji(message);
  logList.appendChild(logItem);
  logItem.scrollIntoView({ behavior: "smooth" }); // Scroll to the new log item
  
  // Update mobile action log if mobile system is loaded
  updateMobileActionLog();
}

// Advanced Skills Integration Functions

function trackJobPlaystyle(job, success = true) {
  if (!success) return; // Only track successful jobs for playstyle
  
  // Determine job type and update playstyle stats
  const jobName = job.name.toLowerCase();
  
  if (jobName.includes('stealth') || jobName.includes('sneak') || jobName.includes('infiltrat') || 
    jobName.includes('pickpocket') || jobName.includes('burglar')) {
    player.playstyleStats.stealthyJobs = (player.playstyleStats.stealthyJobs || 0) + 1;
  }
  
  if (jobName.includes('fight') || jobName.includes('rob') || jobName.includes('assault') || 
    jobName.includes('extort') || jobName.includes('intimidat') || jobName.includes('violent')) {
    player.playstyleStats.violentJobs = (player.playstyleStats.violentJobs || 0) + 1;
  }
  
  if (jobName.includes('negotiate') || jobName.includes('bribe') || jobName.includes('charm') || 
    jobName.includes('persuad') || jobName.includes('diplomat')) {
    player.playstyleStats.diplomaticActions = (player.playstyleStats.diplomaticActions || 0) + 1;
  }
  
  if (jobName.includes('hack') || jobName.includes('cyber') || jobName.includes('digital') || 
    jobName.includes('computer') || jobName.includes('tech')) {
    player.playstyleStats.hackingAttempts = (player.playstyleStats.hackingAttempts || 0) + 1;
  }
  
  // Check for newly unlocked perks
  checkForNewPerks();
}

function applySkillTreeBonuses(job, successChance) {
  let bonuses = 0;
  const jobName = job.name.toLowerCase();
  
  // Apply skill tree bonuses based on job type
  if (jobName.includes('stealth') || jobName.includes('sneak')) {
    bonuses += player.skillTrees.stealth.infiltration * 5; // 5% per level
    bonuses += player.skillTrees.stealth.surveillance * 4; // 4% per level
  }
  
  if (jobName.includes('fight') || jobName.includes('rob') || jobName.includes('assault') || 
    jobName.includes('protection') || jobName.includes('extortion') || jobName.includes('heist')) {
    bonuses += player.skillTrees.violence.firearms * 6; // 6% per level
    bonuses += player.skillTrees.violence.melee * 4; // 4% per level
    bonuses += player.skillTrees.violence.intimidation * 5; // 5% per level - NEW!
  }
  
  if (jobName.includes('negotiate') || jobName.includes('bribe')) {
    bonuses += player.skillTrees.charisma.negotiation * 3; // 3% per level
    bonuses += player.skillTrees.charisma.manipulation * 4; // 4% per level
  }
  
  if (jobName.includes('hack') || jobName.includes('cyber') || jobName.includes('heist') || 
    jobName.includes('plan') || jobName.includes('intel')) {
    bonuses += player.skillTrees.intelligence.hacking * 7; // 7% per level
    bonuses += player.skillTrees.intelligence.planning * 4; // 4% per level
    bonuses += player.skillTrees.intelligence.forensics * 3; // 3% per level - helps with clean execution
  }
  
  // Apply perk bonuses
  if (player.unlockedPerks.includes('shadowWalker') && 
    (jobName.includes('stealth') || jobName.includes('sneak'))) {
    bonuses += 10; // Additional stealth bonus
  }
  
  if (player.unlockedPerks.includes('warMachine') && 
    (jobName.includes('fight') || jobName.includes('rob'))) {
    bonuses += 15; // Additional violence bonus
  }
  
  if (player.unlockedPerks.includes('silverTongue') && 
    (jobName.includes('negotiate') || jobName.includes('bribe'))) {
    bonuses += 20; // Additional charisma bonus
  }
  
  if (player.unlockedPerks.includes('digitalGod') && 
    (jobName.includes('hack') || jobName.includes('cyber'))) {
    bonuses += 25; // Additional hacking bonus
  }
  
  return Math.min(bonuses, 50); // Cap at 50% bonus
}

function updateFactionReputation(job, success) {
  if (!success) return;
  
  const jobName = job.name.toLowerCase();
  let reputationChanges = {};
  
  // Different jobs affect different factions
  if (jobName.includes('italian') || jobName.includes('pizza') || jobName.includes('restaurant')) {
    reputationChanges.torrino = success ? 1 : -2;
  }
  
  if (jobName.includes('russian') || jobName.includes('vodka') || jobName.includes('bratva')) {
    reputationChanges.kozlov = success ? 1 : -2;
  }
  
  if (jobName.includes('chinese') || jobName.includes('triad') || jobName.includes('chinatown')) {
    reputationChanges.chen = success ? 1 : -2;
  }
  
  if (jobName.includes('cartel') || jobName.includes('drug') || jobName.includes('border')) {
    reputationChanges.morales = success ? 1 : -2;
  }
  
  // Police reputation changes based on job visibility
  if (job.wantedLevelGain > 2) {
    reputationChanges.police = -1; // High-profile crimes hurt police relations
  }
  
  // Apply reputation changes
  Object.entries(reputationChanges).forEach(([faction, change]) => {
    if (player.streetReputation[faction] !== undefined) {
      player.streetReputation[faction] = Math.max(-100, Math.min(100, 
        player.streetReputation[faction] + change));
    }
  });
}

function checkForNewPerks() {
  Object.entries(availablePerks).forEach(([perkId, perk]) => {
    if (!player.unlockedPerks.includes(perkId) && checkPerkRequirements(perk.requirements)) {
      // Auto-unlock if requirements are met (some perks might require manual unlock)
      if (perk.autoUnlock !== false) {
        player.unlockedPerks.push(perkId);
        logAction(`⭐ New Perk Unlocked: ${perk.name} - ${perk.description}`);
        applyPerkEffects(perkId);
      }
    }
  });
}

function getReputationPriceModifier(faction) {
  const reputation = player.streetReputation[faction] || 0;
  if (reputation >= 50) return 0.85; // 15% discount for high positive reputation
  if (reputation >= 25) return 0.90; // 10% discount for medium positive reputation
  if (reputation <= -50) return 1.25; // 25% markup for high negative reputation
  if (reputation <= -25) return 1.15; // 15% markup for medium negative reputation
  return 1.0; // No change for neutral reputation
}

// Check if the player has a specific utility item in their inventory
function hasUtilityItem(name) {
  return player.inventory && player.inventory.some(i => i.name === name);
}

// Function to start a job
async function startJob(index) {
  if (player.inJail) {
    alert("You can't work while you're in jail!");
    return;
  }

  let job = jobs[index];

  // Get active events and weather effects early
  const activeEffects = getActiveEffects();

  // Calculate actual energy cost with endurance skill reduction
  let actualEnergyCost = Math.max(1, job.energyCost - player.skills.endurance); // Minimum 1 energy
  
  // Apply event effects to energy cost
  if (activeEffects.energyReduction) {
    const reducedCost = Math.floor(actualEnergyCost * (1 - activeEffects.energyReduction));
    const energySaved = actualEnergyCost - reducedCost;
    actualEnergyCost = Math.max(1, reducedCost); // Still minimum 1 energy
    if (energySaved > 0) {
      logAction(`🌤️ Favorable conditions make the job less taxing (${energySaved} energy saved)!`);
    }
  }

  // Check if the player has enough energy
  if (player.energy < actualEnergyCost) {
    alert(`You don't have enough energy to do this job! You need ${actualEnergyCost} energy but only have ${player.energy}. Wait for energy to regenerate or buy an energy drink.`);
    return;
  }

  // Check if the player has required items
  if (!hasRequiredItems(job.requiredItems)) {
    alert(`You need the following items to perform this job: ${job.requiredItems.join(", ")}`);
    return;
  }

  // Check reputation requirement
  if (player.reputation < job.reputation) {
    alert(`You need ${job.reputation} reputation to perform this job. You currently have ${Math.floor(player.reputation)}.`);
    return;
  }

  // ---- JOB DEPTH: Approach choices for mid & elite tier jobs ----
  let approachBonus = 0;
  let approachLabel = '';
  
  if (job.risk === 'high' || job.risk === 'very high') {
    // Mid-tier: choose approach — "Go Loud" or "Stay Quiet"
    const modal = new ModalSystem();
    const choice = await modal.show(
      `Plan the ${job.name}`,
      `<p>This is a <strong>${job.risk.toUpperCase()}</strong> risk job. How do you want to play it?</p>
       <p style="color:#e74c3c;"><strong>Go Loud</strong> — Brute force. Higher success using <em>violence</em>, but more heat & injury risk.</p>
       <p style="color:#3498db;"><strong>Stay Quiet</strong> — Stealth approach. Higher success using <em>stealth</em>, but lower payout if things go sideways.</p>`,
      [
        { text: 'Go Loud', class: 'modal-btn-primary', value: 'loud', callback: () => true },
        { text: 'Stay Quiet', class: 'modal-btn-secondary', value: 'quiet', callback: () => true },
        { text: 'Abort', class: 'modal-btn-secondary', value: 'abort', callback: () => true }
      ]
    );
    
    if (!choice || choice === 'abort') return;
    
    if (choice === 'loud') {
      approachBonus = player.skills.violence * 3;
      approachLabel = 'Loud';
      logAction(`💥 You gear up for a loud approach on the ${job.name}. Violence is your friend today.`);
    } else {
      approachBonus = player.skills.stealth * 3;
      approachLabel = 'Quiet';
      logAction(`🤫 You plan a stealthy approach for the ${job.name}. Patience is key.`);
    }
  } else if (job.risk === 'extreme' || job.risk === 'legendary') {
    // Elite-tier: briefing panel with crew & vehicle readiness
    const gangReady = player.gang.members >= 3;
    const carReady = player.selectedCar !== null && player.selectedCar < player.stolenCars.length;
    const gangStatus = gangReady 
      ? `<span style="color:#2ecc71;">&#10004; ${player.gang.members} soldiers standing by</span>` 
      : `<span style="color:#e74c3c;">&#10008; Need at least 3 gang members (have ${player.gang.members})</span>`;
    const carStatus = carReady 
      ? `<span style="color:#2ecc71;">&#10004; Getaway vehicle selected: ${player.stolenCars[player.selectedCar].name}</span>` 
      : `<span style="color:#e67e22;">&#10008; No getaway vehicle selected (optional but recommended)</span>`;
    
    const modal = new ModalSystem();
    const choice = await modal.show(
      `${job.risk.toUpperCase()} BRIEFING: ${job.name}`,
      `<div style="padding:8px;">
        <p>This is a <strong style="color:#9b59b6;">${job.risk.toUpperCase()}</strong> operation. Review your readiness:</p>
        <div style="margin:10px 0; padding:10px; background:rgba(0,0,0,0.3); border-radius:5px;">
          <strong>Crew:</strong> ${gangStatus}<br>
          <strong>Vehicle:</strong> ${carStatus}<br>
          <strong>Your Power:</strong> ${player.power} | <strong>Health:</strong> ${player.health}
        </div>
        <p style="color:#f39c12;">Gang members provide a bonus to success chance. A getaway vehicle boosts your odds further.</p>
       </div>`,
      [
        { text: 'Launch Operation', class: 'modal-btn-primary', value: 'go', callback: () => true },
        { text: 'Stand Down', class: 'modal-btn-secondary', value: 'abort', callback: () => true }
      ]
    );
    
    if (!choice || choice === 'abort') return;
    
    // Crew bonus for elite jobs
    if (gangReady) {
      approachBonus = Math.min(player.gang.members * 2, 20); // Up to +20% from crew
      logAction(`👥 Your crew of ${player.gang.members} rolls out with you — strength in numbers.`);
    }
    approachLabel = 'Briefed';
  }

  // OFFLINE / FALLBACK: proceed with legacy local simulation
  player.energy -= actualEnergyCost;
  startEnergyRegenTimer(); // Start the regeneration timer

  // Calculate job success chance based on player's power level and skills
  let successChance;
  let skillBonus = (player.skills.intelligence + player.skills.luck) * 2;
  let carBonus = 0;
  
  // Apply advanced skill tree bonuses
  let advancedBonus = applySkillTreeBonuses(job, 0);
  
  let eventBonus = 0;
  
  // Apply event effects to job success
  if (activeEffects.jobSuccessBonus) {
    eventBonus += activeEffects.jobSuccessBonus * 100;
    logAction(`🌟 Current events favor your operations (+${(activeEffects.jobSuccessBonus * 100).toFixed(0)}% success chance)!`);
  }
  
  if (activeEffects.stealthBonus && job.name.toLowerCase().includes('stealth')) {
    eventBonus += activeEffects.stealthBonus * 100;
    logAction(`🌫️ Weather conditions provide excellent cover for stealth operations!`);
  }
  
  if (activeEffects.violentJobBonus && (job.name.toLowerCase().includes('fight') || job.name.toLowerCase().includes('rob'))) {
    eventBonus += activeEffects.violentJobBonus * 100;
    logAction(`🌡️ The current atmosphere makes people more aggressive - perfect for violent jobs!`);
  }
  
  // Utility item: Lockpick Set gives +10% success on all jobs
  let utilityBonus = 0;
  if (hasUtilityItem('Lockpick Set')) {
    utilityBonus += 10;
    logAction(`🔓 Your Lockpick Set gives you an edge on this job (+10% success).`);
  }
  
  // Car bonus for jobs (if player has selected a car)
  if (player.selectedCar !== null && player.selectedCar < player.stolenCars.length) {
    let selectedCar = player.stolenCars[player.selectedCar];
    carBonus = Math.floor((selectedCar.baseValue / 100) * (1 - selectedCar.damagePercentage / 100));
    
    // Apply weather effects to car usage
    if (activeEffects.carAccidents) {
      carBonus = Math.floor(carBonus * (1 - activeEffects.carAccidents));
      logAction(`🚗⚠️ Weather conditions make driving more dangerous - car effectiveness reduced!`);
    }
    
    logAction(`🚗 You slide into your ${selectedCar.name}, its familiar rumble giving you confidence. The streets feel different with good wheels beneath you (+${carBonus}% success chance).`);
  }
  
  if (job.risk === "low") {
    successChance = 30 + player.power * 0.3 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  } else if (job.risk === "medium") {
    successChance = 20 + player.power * 0.2 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  } else if (job.risk === "high") {
    successChance = 10 + player.power * 0.1 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  } else if (job.risk === "very high") {
    successChance = 5 + player.power * 0.08 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  } else if (job.risk === "extreme") {
    successChance = 3 + player.power * 0.05 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  } else if (job.risk === "legendary") {
    successChance = 1 + player.power * 0.03 + skillBonus + carBonus + advancedBonus + eventBonus + utilityBonus + approachBonus;
  }

  // Cap success chance at 95%
  successChance = Math.min(successChance, 95);

  // Mastermind perk: 25% chance for jobs to auto-succeed
  if (player.unlockedPerks.includes('mastermind') && Math.random() < 0.25) {
    logAction(`🧠 Mastermind instinct kicks in — you see the perfect opportunity and execute flawlessly!`);
    successChance = 100; // Guarantee success
  }

  // Fear Monger perk: intimidation-related jobs get +30% chance
  if (player.unlockedPerks.includes('fearMonger')) {
    const jn = job.name.toLowerCase();
    if (jn.includes('extortion') || jn.includes('protection') || jn.includes('shakedown') || jn.includes('intimidat')) {
      successChance = Math.min(successChance + 30, 99);
      logAction(`😈 Your fearsome reputation makes the target comply more easily (+30% success).`);
    }
  }

  // Random chance for job success
  if (Math.random() * 100 > successChance) {
    // Handle failure with advanced skills considerations
    updateFactionReputation(job, false);
    trackJobPlaystyle(job, false);
    
    // Check for Shadow Walker perk (25% chance to avoid consequences)
    if (player.unlockedPerks.includes('shadowWalker') && Math.random() < 0.25) {
      logAction(`👻 Your Shadow Walker abilities activate! You slip away undetected despite the failed attempt, avoiding all consequences.`);
      gainExperience(4); // Bonus experience for avoiding consequences
      updateUI();
      return;
    }
    
    alert(`${getRandomNarration('jobFailure')} You lost ${actualEnergyCost} energy.`);
    logAction(getRandomNarration('jobFailure'));
    // Still gain some experience for trying
    gainExperience(2);
    updateUI();
    return;
  }

  // Handle special car theft job
  if (job.special === "car_theft") {
    handleCarTheft(job, actualEnergyCost);
    updateUI(); // Update UI after energy consumption
    return;
  }

  // Handle special money laundering job — converts dirty money to clean money
  if (job.special === "launder_money") {
    handleLaunderMoneyJob(job, approachLabel);
    updateUI();
    return;
  }

  let earnings;
  if (Array.isArray(job.payout)) {
    earnings = Math.floor(Math.random() * (job.payout[1] - job.payout[0] + 1)) + job.payout[0];
    // Luck skill can increase earnings
    earnings += Math.floor(earnings * (player.skills.luck * 0.02));
  } else {
    earnings = job.payout;
  }

  // Chen Triad passive: drug/smuggling jobs earn 15% more
  const jn = job.name.toLowerCase();
  if (jn.includes('drug') || jn.includes('smuggl') || jn.includes('dealer') || jn.includes('transport')) {
    const drugMultiplier = getDrugIncomeMultiplier();
    if (drugMultiplier > 1) {
      const bonus = Math.floor(earnings * (drugMultiplier - 1));
      earnings += bonus;
      logAction(`🐉 Chen Triad smuggling routes boost your earnings by $${bonus.toLocaleString()}.`);
    }
  }
  
  // Drug Lab synergy: owning a Drug Lab boosts drug job payouts by 10-25%
  if (jn.includes('bootleg') || jn.includes('speakeasy') || jn.includes('powder') || jn.includes('drug') || jn.includes('distribution')) {
    if (player.businesses && player.businesses.some(b => b.type === 'druglab')) {
      const drugLab = player.businesses.find(b => b.type === 'druglab');
      const boostPercent = 0.08 + (drugLab.level * 0.035); // 11.5% at Lv1, up to 25.5% at Lv5
      const drugLabBonus = Math.floor(earnings * boostPercent);
      earnings += drugLabBonus;
      logAction(`🧪 Your Drug Lab provides better product for distribution — payout boosted by $${drugLabBonus.toLocaleString()}.`);
    }
  }

  // Calculate jail chance with stealth skill reducing it
  let stealthBonus = player.skills.stealth * 2;
  stealthBonus += player.skillTrees.stealth.escape * 3; // Advanced escape skills
  stealthBonus += player.skillTrees.stealth.infiltration * 2; // Advanced infiltration skills
  
  let adjustedJailChance = Math.max(1, job.jailChance - stealthBonus);
  let jailChance = Math.random() * 100;

  if (jailChance <= adjustedJailChance) {
    sendToJail(job.wantedLevelGain);
    logAction(`🚔 Sirens wail behind you! Cold metal cuffs bite into your wrists as the cops drag you away. The ${job.name} was a setup all along...`);
    return;
  }

  // Only Bank Job and Counterfeiting Money pay dirty money; all other jobs pay clean money
  if (job.paysDirty) {
    player.dirtyMoney = (player.dirtyMoney || 0) + earnings;
    // Dirty money jobs raise suspicion — the feds notice large illegal cash flows
    const dirtySuspicion = 5 + Math.floor(Math.random() * 11); // 5-15 suspicion
    player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + dirtySuspicion);
    logAction(`🔍 Handling that much dirty cash raises eyebrows... (+${dirtySuspicion} suspicion)`);
  } else {
    player.money += earnings;
  }
  
  // Apply intimidation to reduce wanted level gain (witnesses too scared to report)
  let wantedLevelGain = job.wantedLevelGain;
  
  // Approach consequence: "Go Loud" adds 30% more heat
  if (approachLabel === 'Loud') {
    wantedLevelGain = Math.ceil(wantedLevelGain * 1.3);
  }
  
  let intimidationReduction = player.skillTrees.violence.intimidation * 0.1; // 10% reduction per level
  wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * (1 - intimidationReduction)));
  
  // Ghost Protocol perk: reduce heat generation by 50%
  if (player.unlockedPerks.includes('ghostProtocol')) {
    wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * 0.5));
  }
  
  // Utility item: Police Scanner reduces wanted level gain by 20%
  if (hasUtilityItem('Police Scanner')) {
    wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * 0.8));
    logAction(`📡 Your Police Scanner intercepts radio chatter — you dodge the heat (+20% wanted reduction).`);
  }
  
  // Morales Cartel passive: violent crimes generate 20% less heat
  if (job.name && (job.name.toLowerCase().includes('fight') || job.name.toLowerCase().includes('rob') || 
      job.name.toLowerCase().includes('assault') || job.name.toLowerCase().includes('heist'))) {
    const heatMultiplier = getViolenceHeatMultiplier();
    if (heatMultiplier < 1) {
      wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * heatMultiplier));
    }
  }
  
  player.wantedLevel += wantedLevelGain;
  
  // Log intimidation effect if it reduced wanted level
  if (intimidationReduction > 0 && wantedLevelGain < job.wantedLevelGain) {
    logAction(`😨 Your intimidating presence makes witnesses think twice about reporting the crime!`);
  }
  
  // Apply forensics skill for evidence cleanup
  if (player.skillTrees.intelligence.forensics > 0) {
    let forensicsSuccess = Math.random() * 100;
    let forensicsChance = player.skillTrees.intelligence.forensics * 8; // 8% chance per level
    
    if (forensicsSuccess < forensicsChance) {
      let evidenceReduction = Math.min(2, Math.floor(player.skillTrees.intelligence.forensics / 3)); // 1-2 wanted level reduction
      player.wantedLevel = Math.max(0, player.wantedLevel - evidenceReduction);
      logAction(`🧹 Your forensics expertise helps you clean up evidence, reducing heat by ${evidenceReduction}!`);
    }
  }
  
  // Track statistics
  updateStatistic('jobsCompleted');
  updateStatistic('totalMoneyEarned', earnings);
  trackJobCompletion(job.name); // Track individual job completion for favorite crime
  _jobsWithoutArrest++; // Track consecutive clean jobs for ghost achievement
  
  // Advanced Skills System Integration
  trackJobPlaystyle(job, true);
  updateFactionReputation(job, true);
  
  // Apply War Machine perk bonus (50% more money for violent jobs)
  if (player.unlockedPerks.includes('warMachine') && 
    (job.name.toLowerCase().includes('fight') || job.name.toLowerCase().includes('rob'))) {
    const bonus = Math.floor(earnings * 0.5);
    if (job.paysDirty) {
      player.dirtyMoney = (player.dirtyMoney || 0) + bonus;
      logAction(`⚔️ War Machine bonus: Your reputation for violence earns you an extra $${bonus.toLocaleString()} (dirty)!`);
    } else {
      player.money += bonus;
      logAction(`⚔️ War Machine bonus: Your reputation for violence earns you an extra $${bonus.toLocaleString()}!`);
    }
  }
  
  // Update mission progress
  updateMissionProgress('job_completed', 1);
  updateMissionProgress('money_earned', earnings);

  // Calculate chance of getting hurt based on job risk and player's power
  let hurtChance;
  let maxHealthLoss;
  if (job.risk === "low") {
    hurtChance = Math.max(0, 1 - player.power * 0.01 - player.skills.violence * 0.5);
    maxHealthLoss = 5;
    player.reputation += 0.3;
    gainExperience(2);
  } else if (job.risk === "medium") {
    hurtChance = Math.max(0, 5 - player.power * 0.05 - player.skills.violence * 0.5);
    maxHealthLoss = 20;
    player.reputation += 0.5;
    gainExperience(6);
  } else if (job.risk === "high") {
    hurtChance = Math.max(0, 10 - player.power * 0.1 - player.skills.violence * 0.5);
    maxHealthLoss = 50;
    player.reputation += 1;
    gainExperience(14);
  } else if (job.risk === "very high") {
    hurtChance = Math.max(0, 15 - player.power * 0.12 - player.skills.violence * 0.5);
    maxHealthLoss = 60;
    player.reputation += 1.5;
    gainExperience(22);
  } else if (job.risk === "extreme") {
    hurtChance = Math.max(0, 20 - player.power * 0.15 - player.skills.violence * 0.5);
    maxHealthLoss = 75;
    player.reputation += 2.5;
    gainExperience(35);
  } else if (job.risk === "legendary") {
    hurtChance = Math.max(0, 25 - player.power * 0.18 - player.skills.violence * 0.5);
    maxHealthLoss = 90;
    player.reputation += 4;
    gainExperience(50);
  }

  // Track reputation changes for campaign objectives
  updateMissionProgress('reputation_changed');

  // Check if the player gets hurt
  if (Math.random() * 100 < hurtChance) {
    let healthLoss = Math.floor(Math.random() * maxHealthLoss) + 1;
    player.health -= healthLoss;
    flashHurtScreen();
    alert(`${getRandomNarration('healthLoss')} You have ${player.health} health left.`, true);
    logAction(`${getRandomNarration('healthLoss')} (-${healthLoss} health).`);
  }

  // Deduct ammo and gas if used
  if (job.requiredItems.includes("ammo")) player.ammo--;
  if (job.requiredItems.includes("gas")) player.gas--;

  // Check for first job achievement
  if (!achievements.find(a => a.id === "first_job").unlocked) {
    unlockAchievement("first_job");
  }

  // Handle car damage if car was used
  let carCatastrophe = false;
  if (player.selectedCar !== null) {
    let damageAmount = Math.floor(Math.random() * 15) + 5; // 5-20% damage per use
    if (job.risk === "high") damageAmount += 10;
    else if (job.risk === "very high") damageAmount += 15;
    else if (job.risk === "extreme") damageAmount += 20;
    else if (job.risk === "legendary") damageAmount += 30;
    
    carCatastrophe = damageCar(player.selectedCar, damageAmount);
    if (!carCatastrophe) {
      logAction(`${getRandomNarration('carDamage')} (-${damageAmount}% condition).`);
    }
    player.selectedCar = null; // Reset selected car after use
  }

  if (!carCatastrophe) { // Only show success message if car didn't explode/break down
    const moneyType = job.paysDirty ? ' (dirty money — must be laundered!)' : '';
    flashSuccessScreen();
    alert(`You completed the job as a ${job.name} (${job.risk} risk) and earned $${earnings.toLocaleString()}${moneyType}!`);
    logAction(`${getRandomNarration('jobSuccess')} (+$${earnings.toLocaleString()}${moneyType}).`);
  }

  updateUI();
  // Only refresh the job list instead of reloading the entire jobs screen to prevent flashing
  if (document.getElementById("jobs-screen").style.display === "block") {
    refreshJobsList();
  }

  // Check for random recruit encounters after successful jobs
  if (generateRandomEncounter()) {
    // Small delay to let the job success message show first
    setTimeout(() => {
      handleRandomRecruitEncounter();
    }, 1000);
  }

  if (player.health <= 0) {
    showDeathScreen(`Killed on the job as a ${job.name}`);
  }
}

// Function to handle car theft
function handleCarTheft(job, actualEnergyCost) {
  // Calculate jail chance with stealth skill reducing it
  let adjustedJailChance = Math.max(10, job.jailChance - (player.skills.stealth * 2));
  let jailChance = Math.random() * 100;

  if (jailChance <= adjustedJailChance) {
    sendToJail(job.wantedLevelGain);
    logAction(`🚔 Busted! You barely get the door open before the cops swarm you. The owner was watching from their window the whole time (-${actualEnergyCost} energy).`);
    return;
  }

  // Check if player actually finds a car to steal (30% base chance)
  let findCarChance = 30 + (player.skills.luck * 3); // Luck skill helps find cars
  if (Math.random() * 100 > findCarChance) {
    alert(`${getRandomNarration('carTheftFailure')} Lost ${actualEnergyCost} energy.`);
    logAction(`🔍 ${getRandomNarration('carTheftFailure')} The streets can be unforgiving to those seeking easy rides.`);
    player.wantedLevel += 1; // Small wanted level increase for suspicious activity
    gainExperience(2);
    updateUI();
    // Only refresh the job list instead of reloading the entire jobs screen to prevent flashing
    if (document.getElementById("jobs-screen").style.display === "block") {
      refreshJobsList();
    }
    return;
  }

  // Successfully found a car - determine which type based on rarity
  let totalRarity = stolenCarTypes.reduce((sum, car) => sum + car.rarity, 0);
  let randomValue = Math.random() * totalRarity;
  let currentSum = 0;
  let selectedCar = stolenCarTypes[0]; // Default fallback
  
  for (let car of stolenCarTypes) {
    currentSum += car.rarity;
    if (randomValue <= currentSum) {
      selectedCar = car;
      break;
    }
  }

  // Calculate initial damage percentage based on vehicle type
  let damagePercentage = 0;
  
  // Broken vehicles: 95-100% damage (0-5% health left)
  if (selectedCar.name.toLowerCase().includes('broken')) {
    damagePercentage = Math.floor(Math.random() * 6) + 95; // 95-100% damage
  }
  // Rusted/Rusty vehicles: 50-94% damage (6-50% health left)  
  else if (selectedCar.name.toLowerCase().includes('rust')) {
    damagePercentage = Math.floor(Math.random() * 45) + 50; // 50-94% damage
  }
  // All other vehicles: random damage based on damageChance
  else if (Math.random() * 100 < selectedCar.damageChance) {
    damagePercentage = Math.floor(Math.random() * 40) + 10; // 10-50% initial damage
  } else {
    damagePercentage = Math.floor(Math.random() * 15); // 0-15% minimal damage for "pristine" cars
  }

  let currentValue = Math.floor(selectedCar.baseValue * (1 - damagePercentage / 100));
  // Even totaled cars have scrap value (5-15% of base)
  const scrapMin = Math.floor(selectedCar.baseValue * 0.05);
  if (currentValue < scrapMin) currentValue = Math.floor(selectedCar.baseValue * (0.05 + Math.random() * 0.10));

  let stolenCar = {
    name: selectedCar.name,
    baseValue: selectedCar.baseValue,
    currentValue: currentValue,
    damagePercentage: damagePercentage,
    usageCount: 0
  };

  player.wantedLevel += job.wantedLevelGain;
  player.reputation += 0.5;
  gainExperience(8);

  // Check if player gets hurt during theft
  if (Math.random() * 100 < 15) { // 15% chance of getting hurt
    let healthLoss = Math.floor(Math.random() * job.healthLoss) + 1;
    player.health -= healthLoss;
    flashHurtScreen();
    showCarTheftChoiceResult(stolenCar, true, healthLoss);
    logAction(`🚗💥 You grab the ${stolenCar.name} but the owner puts up a fight! Keys in hand, blood on your knuckles - it's yours now, but the price was pain (${damagePercentage}% damaged).`);
  } else {
    flashSuccessScreen();
    showCarTheftChoiceResult(stolenCar, false);
    logAction(`🚗✨ Like taking candy from a baby! You slip into the ${stolenCar.name} and drive off into the night. The engine purrs under your control (${damagePercentage}% damaged).`);
  }

  // Note: updateUI, achievement check, showJobs, and health check are now handled in handleStolenCarChoice
}

// Function to handle money laundering job — converts dirty money to clean money
function handleLaunderMoneyJob(job, approachLabel) {
  // Check if player actually has dirty money to launder
  if (!player.dirtyMoney || player.dirtyMoney <= 0) {
    alert("You don't have any dirty money to launder! Earn dirty money from Bank Jobs or Counterfeiting first.");
    return;
  }

  // Deduct energy
  let actualEnergyCost = job.energyCost;
  if (player.unlockedPerks && player.unlockedPerks.includes('streetSmart')) {
    actualEnergyCost = Math.max(1, Math.floor(actualEnergyCost * 0.8));
  }
  player.energy -= actualEnergyCost;

  // Calculate how much dirty money we can launder this run (based on job payout range + luck)
  let launderCapacity;
  if (Array.isArray(job.payout)) {
    launderCapacity = Math.floor(Math.random() * (job.payout[1] - job.payout[0] + 1)) + job.payout[0];
    launderCapacity += Math.floor(launderCapacity * (player.skills.luck * 0.02));
  } else {
    launderCapacity = job.payout;
  }

  // Approach modifies launder capacity BEFORE capping
  if (approachLabel === 'Loud') {
    launderCapacity = Math.floor(launderCapacity * 1.40); // Loud: +40% capacity (bulk laundering)
  } else if (approachLabel === 'Stealth') {
    launderCapacity = Math.floor(launderCapacity * 0.75); // Stealth: -25% capacity (smaller batches, less risky)
  }
  // Smart: no capacity change (balanced)

  // Can't launder more than you have
  const amountToLaunder = Math.min(launderCapacity, player.dirtyMoney);

  // Jail check — stealth skills reduce the chance
  let stealthBonus = player.skills.stealth * 2;
  stealthBonus += player.skillTrees.stealth.escape * 3;
  stealthBonus += player.skillTrees.stealth.infiltration * 2;
  let adjustedJailChance = Math.max(1, job.jailChance - stealthBonus);
  
  // Approach modifies jail chance
  if (approachLabel === 'Stealth') {
    adjustedJailChance = Math.max(1, Math.floor(adjustedJailChance * 0.5)); // Stealth: 50% less jail chance
  } else if (approachLabel === 'Loud') {
    adjustedJailChance = Math.floor(adjustedJailChance * 1.3); // Loud: 30% more jail chance
  }

  if (Math.random() * 100 <= adjustedJailChance) {
    // Caught! Lose the dirty money being laundered and go to jail
    const seized = Math.floor(amountToLaunder * (0.3 + Math.random() * 0.4)); // Feds seize 30-70%
    player.dirtyMoney = Math.max(0, player.dirtyMoney - seized);
    player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + 15);
    sendToJail(job.wantedLevelGain);
    logAction(`🚔💰 The feds bust your laundering operation! $${seized.toLocaleString()} in dirty money seized as evidence. You're dragged away in cuffs.`);
    return;
  }

  // Success! Convert dirty money to clean money with a conversion rate
  // Base rate 80-90%, improved by intelligence skills
  let conversionRate = 0.80 + (Math.random() * 0.10);

  // Intelligence skill improves conversion rate
  conversionRate += player.skills.intelligence * 0.005; // +0.5% per level
  conversionRate += (player.skillTrees.intelligence.forensics || 0) * 0.01; // +1% per forensics level

  // Approach bonus: each approach has distinct trade-offs
  if (approachLabel === 'Smart') {
    conversionRate += 0.07; // Smart: +7% conversion rate (expert financial maneuvers)
    // Smart approach also reduces suspicion gain
  }
  if (approachLabel === 'Loud') {
    conversionRate -= 0.03; // Loud: -3% conversion (sloppy but fast)
    player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + 8); // +8 suspicion
    logAction(`📢 Going loud draws attention — the feds notice the large cash movements.`);
  }
  if (approachLabel === 'Stealth') {
    conversionRate += 0.02; // Stealth: +2% conversion (careful handling)
    // Stealth approach reduces suspicion gain later
  }

  // Owning a Counterfeiting Operation improves conversion (mixing fake with real bills)
  if (player.businesses && player.businesses.some(b => b.id === 'counterfeiting')) {
    conversionRate += 0.03; // +3% if you own the Counterfeiting Operation
    logAction(`🏭 Your Counterfeiting Operation helps mix the bills — improved conversion rate.`);
  }

  // Cap at 95%
  conversionRate = Math.min(0.95, conversionRate);

  const cleanAmount = Math.floor(amountToLaunder * conversionRate);
  const fee = amountToLaunder - cleanAmount;

  // Deduct dirty, add clean
  player.dirtyMoney -= amountToLaunder;
  player.money += cleanAmount;

  // Wanted level gain (reduced by perks/skills)
  let wantedLevelGain = job.wantedLevelGain;
  if (approachLabel === 'Loud') {
    wantedLevelGain = Math.ceil(wantedLevelGain * 1.3);
  }
  let intimidationReduction = player.skillTrees.violence.intimidation * 0.1;
  wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * (1 - intimidationReduction)));
  if (player.unlockedPerks.includes('ghostProtocol')) {
    wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * 0.5));
  }
  if (hasUtilityItem('Police Scanner')) {
    wantedLevelGain = Math.max(1, Math.floor(wantedLevelGain * 0.8));
    logAction(`📡 Your Police Scanner intercepts radio chatter — you dodge the heat.`);
  }
  player.wantedLevel += wantedLevelGain;

  // Small suspicion gain even on success (modified by approach)
  let baseSuspicionGain = 2 + Math.floor(Math.random() * 4); // 2-5 suspicion
  if (approachLabel === 'Smart') {
    baseSuspicionGain = Math.max(0, baseSuspicionGain - 2); // Smart: reduced suspicion
  } else if (approachLabel === 'Stealth') {
    baseSuspicionGain = Math.max(0, Math.floor(baseSuspicionGain * 0.3)); // Stealth: minimal suspicion
  }
  // Loud suspicion already added above
  player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + baseSuspicionGain);

  // Reputation and XP based on risk level
  player.reputation += 1.5;
  gainExperience(30);

  // Track statistics
  updateStatistic('jobsCompleted');
  updateStatistic('totalMoneyEarned', cleanAmount);
  trackJobCompletion(job.name);

  // Advanced Skills System Integration
  trackJobPlaystyle(job, true);
  updateFactionReputation(job, true);

  // Update mission progress
  updateMissionProgress('job_completed', 1);
  updateMissionProgress('money_earned', cleanAmount);

  // Forensics skill can reduce evidence trail
  if (player.skillTrees.intelligence.forensics > 0) {
    let forensicsChance = player.skillTrees.intelligence.forensics * 8;
    if (Math.random() * 100 < forensicsChance) {
      let evidenceReduction = Math.min(2, Math.floor(player.skillTrees.intelligence.forensics / 3));
      player.wantedLevel = Math.max(0, player.wantedLevel - evidenceReduction);
      logAction(`🧹 Your forensics expertise helps you cover the paper trail, reducing heat by ${evidenceReduction}!`);
    }
  }

  const ratePercent = Math.round(conversionRate * 100);
  flashSuccessScreen();
  alert(`💰 Laundering successful! Cleaned $${cleanAmount.toLocaleString()} from $${amountToLaunder.toLocaleString()} dirty money (${ratePercent}% rate, $${fee.toLocaleString()} in fees).`);
  logAction(`💧💰 The dirty bills flow through shell companies and emerge squeaky clean. $${amountToLaunder.toLocaleString()} dirty → $${cleanAmount.toLocaleString()} clean (${ratePercent}% rate). The laundering fee of $${fee.toLocaleString()} vanishes into the ether.`);

  // Refresh jobs UI if visible
  if (document.getElementById("jobs-screen").style.display === "block") {
    refreshJobsList();
  }

  if (player.health <= 0) {
    showDeathScreen("Killed during a laundering operation gone wrong");
  }
}

// Function to show car theft result with sell/store choice
function showCarTheftChoiceResult(stolenCar, wasHurt = false, healthLoss = 0) {
  const carImageSrc = `vehicles/${stolenCar.name}.png`;
  
  const resultHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); 
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; overflow-y: auto;">
      <div style="max-width: 550px; width: 100%; max-height: 90vh; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
            padding: 30px; border-radius: 20px; border: 2px solid ${wasHurt ? '#e74c3c' : '#2ecc71'}; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); 
            text-align: center; color: white; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #3498db rgba(52, 73, 94, 0.5);">
        <h2 style="color: ${wasHurt ? '#e74c3c' : '#2ecc71'}; margin-bottom: 20px; font-size: 2em;">
          ${wasHurt ? '🚗💥 Stolen but Bloodied!' : '🚗✨ Successful Theft!'}
        </h2>
        
        <div style="margin: 20px 0; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 15px; border: 2px solid #34495e;">
          <img src="${carImageSrc}" alt="${stolenCar.name}" 
             style="width: 200px; height: 150px; border-radius: 10px; object-fit: cover; 
                border: 3px solid #ecf0f1; margin-bottom: 15px;" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM3ZjhjOGQiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';">
          <h3 style="color: #ecf0f1; margin: 10px 0;">${stolenCar.name}</h3>
        </div>
        
        <div style="text-align: left; margin: 20px 0; padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
          <p style="margin: 5px 0;"><strong>💰 Current Value:</strong> $${stolenCar.currentValue.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>🔧 Damage:</strong> ${stolenCar.damagePercentage}%</p>
          <p style="margin: 5px 0;"><strong>📈 Base Value:</strong> $${stolenCar.baseValue.toLocaleString()}</p>
          ${wasHurt ? `<p style="margin: 5px 0; color: #e74c3c;"><strong>💔 Health Lost:</strong> ${healthLoss}</p>` : ''}
        </div>
        
        <div style="margin: 20px 0; padding: 20px; background: rgba(241, 196, 15, 0.2); border-radius: 10px; border: 2px solid #f1c40f;">
          <h3 style="color: #f1c40f; margin-bottom: 15px;">🤔 What do you want to do with this vehicle?</h3>
          <p style="margin: 10px 0; color: #ecf0f1; font-size: 1.1em;">
            ${wasHurt ? getRandomNarration('carTheftDamaged') : getRandomNarration('carTheftSuccess')}
          </p>
        </div>
        
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 25px;">
          <button onclick="handleStolenCarChoice('sell', '${stolenCar.name}', ${stolenCar.baseValue}, ${stolenCar.currentValue}, ${stolenCar.damagePercentage})" 
              style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 15px 25px; border: none; 
                  border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; min-width: 140px;
                  transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);">
            💵 Sell Now<br><small>+$${stolenCar.currentValue.toLocaleString()}</small>
          </button>
          <button onclick="handleStolenCarChoice('store', '${stolenCar.name}', ${stolenCar.baseValue}, ${stolenCar.currentValue}, ${stolenCar.damagePercentage})" 
              style="background: linear-gradient(45deg, #2ecc71, #27ae60); color: white; padding: 15px 25px; border: none; 
                  border-radius: 12px; font-size: 1.1em; font-weight: bold; cursor: pointer; min-width: 140px;
                  transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);">
            🏠 Store in Garage<br><small>Use for jobs</small>
          </button>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: rgba(52, 73, 94, 0.4); border-radius: 8px;">
          <p style="margin: 0; color: #bdc3c7; font-size: 0.9em;">
            <strong>💡 Tip:</strong> Selling gives instant cash, storing lets you use the vehicle for job bonuses (but it may get damaged over time).
          </p>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  const resultScreen = document.createElement('div');
  resultScreen.id = 'car-theft-choice-screen';
  resultScreen.innerHTML = resultHTML;
  document.body.appendChild(resultScreen);
  
  // Add custom scrollbar styling for webkit browsers
  const style = document.createElement('style');
  style.textContent = `
    #car-theft-choice-screen div::-webkit-scrollbar {
      width: 8px;
    }
    #car-theft-choice-screen div::-webkit-scrollbar-track {
      background: rgba(52, 73, 94, 0.5);
      border-radius: 4px;
    }
    #car-theft-choice-screen div::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 4px;
    }
    #car-theft-choice-screen div::-webkit-scrollbar-thumb:hover {
      background: #2980b9;
    }
  `;
  document.head.appendChild(style);
}

// Function to handle the player's choice for stolen car (sell or store)
function handleStolenCarChoice(choice, carName, baseValue, currentValue, damagePercentage) {
  // Find the car type to get the image
  const carType = stolenCarTypes.find(c => c.name === carName);
  
  // Create the car object
  const stolenCar = {
    name: carName,
    baseValue: baseValue,
    currentValue: currentValue,
    damagePercentage: damagePercentage,
    usageCount: 0,
    image: carType ? carType.image : `vehicles/${carName}.png`
  };
  
  if (choice === 'sell') {
    // Chop Shop synergy: owning a Chop Shop gives +35% sell price for stolen cars
    let sellPrice = currentValue;
    let chopShopBonus = 0;
    if (player.businesses && player.businesses.some(b => b.type === 'chopshop')) {
      const chopShop = player.businesses.find(b => b.type === 'chopshop');
      const bonusPercent = 0.25 + (chopShop.level * 0.05); // 30% at Lv1, up to 50% at Lv5
      chopShopBonus = Math.floor(sellPrice * bonusPercent);
      sellPrice += chopShopBonus;
    }
    
    // Sell the car immediately
    player.money += sellPrice;
    
    // Track statistics
    updateStatistic('carsStolen');
    updateStatistic('carsSold');
    updateStatistic('totalMoneyEarned', sellPrice);
    
    if (chopShopBonus > 0) {
      alert(`You sold the ${carName} for $${sellPrice.toLocaleString()}! (Chop Shop bonus: +$${chopShopBonus.toLocaleString()})`);
      logAction(`💸🔧 Your Chop Shop strips the ${carName} for premium parts before the sale. Black market buyers pay top dollar (+$${sellPrice.toLocaleString()}, Chop Shop bonus: +$${chopShopBonus.toLocaleString()}).`);
    } else {
      alert(`You sold the ${carName} immediately for $${sellPrice.toLocaleString()}!`);
      logAction(`💸 Quick cash! You find a buyer in the shadows and hand over the keys on the spot. The ${carName} disappears into the black market (+$${sellPrice.toLocaleString()}).`);
    }
  } else if (choice === 'store') {
    // Store the car in garage
    player.stolenCars.push(stolenCar);
    
    // Track statistics
    updateStatistic('carsStolen');
    
    alert(`The ${carName} has been stored in your garage!`);
    logAction(`🏠 Smart move! You drive the ${carName} to your garage, adding another ride to your growing collection. It's ready for future jobs.`);
  }
  
  // Close the choice screen
  closeCarTheftChoiceResult();
  
  // Update UI and continue
  updateUI();
  
  // Check for first job achievement
  if (!achievements.find(a => a.id === "first_job").unlocked) {
    unlockAchievement("first_job");
  }
  
  // Only refresh the job list instead of reloading the entire jobs screen to prevent flashing
  if (document.getElementById("jobs-screen").style.display === "block") {
    refreshJobsList();
  }

  if (player.health <= 0) {
    showDeathScreen('Killed during a car theft gone wrong');
  }
}

// Function to close car theft choice screen
function closeCarTheftChoiceResult() {
  const resultScreen = document.getElementById('car-theft-choice-screen');
  if (resultScreen) {
    resultScreen.remove();
  }
  
  // Remove the added scrollbar styles
  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    if (style.textContent.includes('#car-theft-choice-screen')) {
      style.remove();
    }
  });
}

// Function to show car theft result with vehicle photo
function showCarTheftResult(stolenCar, wasHurt = false, healthLoss = 0) {
  const carImageSrc = `vehicles/${stolenCar.name}.png`;
  
  const resultHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); 
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; overflow-y: auto;">
      <div style="max-width: 500px; width: 100%; max-height: 90vh; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
            padding: 30px; border-radius: 20px; border: 2px solid ${wasHurt ? '#e74c3c' : '#2ecc71'}; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); 
            text-align: center; color: white; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #3498db rgba(52, 73, 94, 0.5);">
        <h2 style="color: ${wasHurt ? '#e74c3c' : '#2ecc71'}; margin-bottom: 20px; font-size: 2em;">
          ${wasHurt ? '🚗💥 Stolen but Bloodied!' : '🚗✨ Successful Theft!'}
        </h2>
        
        <div style="margin: 20px 0; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 15px; border: 2px solid #34495e;">
          <img src="${carImageSrc}" alt="${stolenCar.name}" 
             style="width: 200px; height: 150px; border-radius: 10px; object-fit: cover; 
                border: 3px solid #ecf0f1; margin-bottom: 15px;" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiM3ZjhjOGQiLz48dGV4dCB4PSIxMDAiIHk9Ijc1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNlY2YwZjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPlZlaGljbGUgSW1hZ2U8L3RleHQ+PC9zdmc+';" />
          <h3 style="color: #ecf0f1; margin: 10px 0;">${stolenCar.name}</h3>
        </div>
        
        <div style="text-align: left; margin: 20px 0; padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
          <p style="margin: 5px 0;"><strong>💰 Current Value:</strong> $${stolenCar.currentValue.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>🔧 Damage:</strong> ${stolenCar.damagePercentage}%</p>
          <p style="margin: 5px 0;"><strong>📈 Base Value:</strong> $${stolenCar.baseValue.toLocaleString()}</p>
          ${wasHurt ? `<p style="margin: 5px 0; color: #e74c3c;"><strong>💔 Health Lost:</strong> ${healthLoss}</p>` : ''}
        </div>
        
        <p style="margin: 20px 0; font-size: 1.1em; color: #ecf0f1;">
          ${wasHurt ? getRandomNarration('carTheftDamaged') : getRandomNarration('carTheftSuccess')}
        </p>
        
        <button onclick="closeCarTheftResult()" 
            style="background: ${wasHurt ? '#e74c3c' : '#2ecc71'}; color: white; padding: 15px 30px; border: none; 
                border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-top: 15px;">
          ${wasHurt ? 'Patch Up & Continue' : 'Continue'}
        </button>
      </div>
    </div>
  `;
  
  // Add to document
  const resultScreen = document.createElement('div');
  resultScreen.id = 'car-theft-result-screen';
  resultScreen.innerHTML = resultHTML;
  document.body.appendChild(resultScreen);
  
  // Add custom scrollbar styling for webkit browsers
  const style = document.createElement('style');
  style.textContent = `
    #car-theft-result-screen div::-webkit-scrollbar {
      width: 8px;
    }
    #car-theft-result-screen div::-webkit-scrollbar-track {
      background: rgba(52, 73, 94, 0.5);
      border-radius: 4px;
    }
    #car-theft-result-screen div::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 4px;
    }
    #car-theft-result-screen div::-webkit-scrollbar-thumb:hover {
      background: #2980b9;
    }
  `;
  document.head.appendChild(style);
}

// Function to close car theft result screen
function closeCarTheftResult() {
  const resultScreen = document.getElementById('car-theft-result-screen');
  if (resultScreen) {
    resultScreen.remove();
  }
  
  // Remove the added scrollbar styles
  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    if (style.textContent.includes('#car-theft-result-screen')) {
      style.remove();
    }
  });
}

// Function to show stolen cars
function showStolenCars() {
  if (player.inJail) {
    alert("You can't access your garage while you're in jail!");
    return;
  }

  let carsHTML = `
    <h2>🏠 Vehicle Garage</h2>
    <p>Your collection of acquired vehicles. Sell them for cash or use them for jobs!</p>
  `;

  if (player.stolenCars.length === 0) {
    carsHTML += `
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: rgba(52, 73, 94, 0.6); border-radius: 15px; border: 2px solid #f39c12;">
        <h3 style="color: #f39c12; margin-bottom: 15px;">🚗 Empty Garage</h3>
        <p style="color: #ecf0f1; margin-bottom: 20px;">Your garage is currently empty. Start stealing cars through jobs to build your vehicle collection!</p>
        <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px; border: 1px solid #f39c12; margin: 20px 0;">
          <p style="color: #ecf0f1; margin: 0;"><strong>💡 Tip:</strong> Look for "Car Theft" jobs to acquire vehicles. Cars can be sold for money or used to improve job success rates!</p>
        </div>
      </div>
    `;
  } else {
    carsHTML += `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; margin: 25px 0;">
        ${player.stolenCars.map((car, index) => {
          let conditionText = car.damagePercentage <= 15 ? 'PRISTINE' : 
                   car.damagePercentage <= 50 ? 'DAMAGED' : 'HEAVILY DAMAGED';
          let conditionColor = car.damagePercentage <= 15 ? '#2ecc71' : 
                    car.damagePercentage <= 50 ? '#f39c12' : '#e74c3c';
          const carImageSrc = car.image || `vehicles/${car.name}.png`;
          
          return `
            <div style="background: rgba(44, 62, 80, 0.8); border-radius: 15px; padding: 25px; border: 2px solid #34495e; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5); transition: transform 0.3s ease;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${carImageSrc}" alt="${car.name}" 
                   style="width: 220px; height: 165px; border-radius: 12px; object-fit: cover; 
                      border: 3px solid #ecf0f1; margin-bottom: 15px; transition: transform 0.3s ease;" 
                   onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE2NSIgdmlld0JveD0iMCAwIDIyMCAxNjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIyMCIgaGVpZ2h0PSIxNjUiIGZpbGw9IiM3ZjhjOGQiLz48dGV4dCB4PSIxMTAiIHk9IjgyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2VjZjBmMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VmVoaWNsZSBJbWFnZTwvdGV4dD48L3N2Zz4=';" />
                <h3 style="color: #ecf0f1; margin: 15px 0; font-size: 1.3em;">${car.name}</h3>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                  <p style="margin: 8px 0; color: ${conditionColor}; font-weight: bold; font-size: 1.1em;">
                    🔧 ${conditionText} (${car.damagePercentage}% damaged)
                  </p>
                  <p style="margin: 8px 0; color: #f39c12; font-size: 1.05em;"><strong>💰 Current Value:</strong> $${car.currentValue.toLocaleString()}</p>
                  <p style="margin: 8px 0; color: #3498db; font-size: 1.05em;"><strong>📊 Base Value:</strong> $${car.baseValue.toLocaleString()}</p>
                  <p style="margin: 8px 0; color: #95a5a6; font-size: 1.05em;"><strong>🔄 Times Used:</strong> ${car.usageCount}</p>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                  <button onclick="sellStolenCar(${index})" 
                      style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 12px 18px; 
                          border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 15px; 
                          transition: all 0.3s ease; min-width: 120px;">
                    💵 Sell ($${car.currentValue.toLocaleString()})
                  </button>
                  <button onclick="useCar(${index}, 'job')" ${car.damagePercentage >= 90 ? 'disabled' : ''}
                      style="background: ${car.damagePercentage >= 90 ? '#7f8c8d' : 'linear-gradient(45deg, #2ecc71, #27ae60)'}; 
                          color: white; padding: 12px 18px; border: none; border-radius: 10px; 
                          font-weight: bold; cursor: ${car.damagePercentage >= 90 ? 'not-allowed' : 'pointer'}; font-size: 15px;
                          transition: all 0.3s ease; min-width: 120px;">
                    ${car.damagePercentage >= 90 ? '🚫 Too Damaged' : '🚗 Use for Job'}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  carsHTML += `
    <div style="text-align: center; margin-top: 40px;">
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
              border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;
              transition: all 0.3s ease;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;

  document.getElementById("stolen-cars-content").innerHTML = carsHTML;
  hideAllScreens();
  document.getElementById("stolen-cars-screen").style.display = "block";
}

// Function to use a car for jobs
function useCar(index, purpose) {
  if (index >= 0 && index < player.stolenCars.length) {
    let car = player.stolenCars[index];
    
    if (car.damagePercentage >= 90) {
      alert("This car is too damaged to use safely!");
      return;
    }
    
    if (purpose === 'job') {
      player.selectedCar = index;
      alert(`Selected ${car.name} (${car.damagePercentage}% damaged) for your next job. It will provide bonuses but may take damage.`);
      logAction(`🔑 You pat the hood of your ${car.name} with a grin. This beauty will be your ride for the next job. Time to put it to work.`);
      showStolenCars(); // Refresh the display
    }
  }
}

// Function to damage a car and handle consequences
function damageCar(carIndex, damageAmount) {
  if (carIndex === null || carIndex >= player.stolenCars.length) return false;
  
  let car = player.stolenCars[carIndex];
  car.damagePercentage += damageAmount;
  car.usageCount++;
  
  // Recalculate current value (minimum scrap value of 5-15%)
  car.currentValue = Math.floor(car.baseValue * (1 - car.damagePercentage / 100));
  const scrapFloor = Math.floor(car.baseValue * 0.05);
  if (car.currentValue < scrapFloor) car.currentValue = Math.floor(car.baseValue * (0.05 + Math.random() * 0.10));
  
  if (car.damagePercentage >= 100) {
    // Car is completely destroyed
    let catastrophe = Math.random();
    
    if (catastrophe < 0.4) { // 40% chance - explosion
      player.health -= 30;
      alert(`Your car exploded! ${getRandomNarration('healthLoss')} The vehicle is destroyed!`, true);
      logAction(`💥 ${getRandomNarration('healthLoss')} Sometimes taking risks with damaged equipment backfires spectacularly.`);
      logAction(`💥🔥 BOOM! The car erupts in flames! You dive clear as metal and glass rain down around you. The explosion echoes through the streets (-30 health).`);
      flashHurtScreen();
    } else if (catastrophe < 0.7) { // 30% chance - breakdown and caught
      sendToJail(5);
      alert("Your car broke down and you were caught by police!");
      logAction("🚔💨 The engine dies with a pathetic wheeze. Steam rises from the hood as cop cars surround you. Should've maintained your ride better!");
    } else { // 30% chance - just destroyed
      alert("Your car finally gave out and is completely destroyed.");
      logAction("🔧💀 The car finally gives up the ghost. Metal grinds against metal as it dies. You walk away from the smoking wreck - time to find new wheels.");
    }
    
    // Remove the destroyed car
    player.stolenCars.splice(carIndex, 1);
    player.selectedCar = null;
    
    return true; // Indicates catastrophic failure
  }
  
  return false; // Normal damage
}

// Function to flash the screen red when the player gets hurt
function flashHurtScreen() {
  const hurtFlash = document.getElementById("hurt-flash");
  hurtFlash.style.display = "block";
  setTimeout(() => {
    hurtFlash.style.display = "none";
  }, 200);
}

function flashSuccessScreen() {
  const flash = document.getElementById("success-flash");
  if (!flash) return;
  flash.style.display = "block";
  // Reset animation by forcing reflow
  flash.style.animation = 'none';
  flash.offsetHeight; // trigger reflow
  flash.style.animation = '';
  setTimeout(() => {
    flash.style.display = "none";
  }, 500);
}

// Override the alert function to support red alerts
function alert(message, isRed = false) {
  const alertBox = document.createElement("div");
  alertBox.className = "alert-box";
  if (isRed) {
    alertBox.classList.add("red-alert");
  }
  alertBox.innerText = message;
  document.body.appendChild(alertBox);
  setTimeout(() => {
    document.body.removeChild(alertBox);
  }, 3000);
}

// Function to send player to jail
function sendToJail(wantedLevelLoss) {
  stopJailTimer();
  
  player.inJail = true;
  _jobsWithoutArrest = 0; // Reset consecutive clean jobs on arrest
  // Jail time scales with wanted level but caps at 90 seconds. Escape skill reduces time.
  const escapeReduction = (player.skillTrees.stealth.escape || 0) * 2; // -2s per escape level
  const baseJailTime = Math.min(90, 15 + Math.floor(player.wantedLevel * 0.8));
  let calculatedJailTime = Math.max(10, baseJailTime - escapeReduction);
  
  // Utility item: Fake ID Kit reduces jail time by 5 seconds
  if (hasUtilityItem('Fake ID Kit')) {
    calculatedJailTime = Math.max(5, calculatedJailTime - 5);
    logAction(`🪪 Your Fake ID Kit confuses the booking officers — shorter sentence!`);
  }
  
  player.jailTime = calculatedJailTime;

  if (window.EventBus) {
    try { EventBus.emit('jailStatusChanged', { inJail: true, jailTime: player.jailTime }); } catch(e) {}
  }
  
  player.wantedLevel -= wantedLevelLoss; // Lose wanted level when in jail
  player.wantedLevel = Math.max(0, player.wantedLevel); // Ensure wanted level doesn't go negative
  
  player.reputation = Math.max(0, player.reputation - 1); // Lose 1 reputation point, but not below 0
  player.breakoutAttempts = 3; // Reset breakout attempts
  
  // Update statistics
  updateStatistic('timesArrested', 1);
  
  generateJailPrisoners(); // Generate random prisoners in jail
  updateUI(); // Update UI
  updateJailUI(); // Ensure jail-specific UI elements are synced
  updateJailTimer(); // Start the jail timer
  logAction(getRandomNarration('jailSentences'));
  
  // Show the jail screen
  showJailScreen();
}

// Bribe guard to get released early
function bribeGuard() {
  const bribeCost = Math.floor(1000 + player.level * 500 + player.wantedLevel * 200);
  
  if (player.money < bribeCost) {
    showBriefNotification(`You need $${bribeCost.toLocaleString()} to bribe the guard. You only have $${Math.floor(player.money).toLocaleString()}.`, 'warning');
    return;
  }
  
  player.money -= bribeCost;
  player.inJail = false;
  player.jailTime = 0;
  player.breakoutAttempts = 3;
  
  stopJailTimer();
  
  if (window.EventBus) {
    try { EventBus.emit('jailStatusChanged', { inJail: false, jailTime: 0 }); } catch(e) {}
  }
  
  updateUI();
  showBriefNotification(`You slipped the guard $${bribeCost.toLocaleString()} and walked out the back door.`, 'success');
  logAction(`Bribed a guard $${bribeCost.toLocaleString()} to get out of jail early.`);
  goBackToMainMenu();
}

// Jail breakout attempt
function attemptBreakout() {
  if (player.breakoutAttempts <= 0) {
    alert("You have no breakout attempts left!");
    return;
  }

  player.breakoutAttempts--;
  player.wantedLevel++; // Increase wanted level with each breakout attempt

  // Stealth skill improves breakout chance
  let adjustedBreakoutChance = player.breakoutChance + (player.skills.stealth * 3);
  let success = Math.random() * 100 < adjustedBreakoutChance;
  
  if (success) {
    player.inJail = false;
    player.jailTime = 0;
    player.breakoutAttempts = 3; // Reset breakout attempts

    stopJailTimer();

    if (window.EventBus) {
      try { EventBus.emit('jailStatusChanged', { inJail: false, jailTime: 0 }); } catch(e) {}
    }
    
    // Update statistics
    updateStatistic('timesEscaped', 1);
    
    updateUI();
    alert(`${getRandomNarration('jailBreakouts')}`);
    logAction(getRandomNarration('jailBreakouts'));
    
    // Check for jail break achievement
    if (!achievements.find(a => a.id === "jail_break").unlocked) {
      unlockAchievement("jail_break");
    }
    
    goBackToMainMenu();
  } else {
    player.jailTime += 10; // Add 10 seconds to jail time on failed breakout attempt
    updateUI();
    alert(`${getRandomNarration('jailBreakoutFailure')} Additional time has been added to your sentence.`);
    logAction("⚡ The guard's flashlight catches you red-handed! Alarms blare as they drag you back to your cell. Some lessons are learned the hard way.");
    
    showJailScreen(); // Update the breakout button text
  }
}

// Function to show skill system
function showSkills() {
  if (player.inJail) {
    alert("You can't access skills while you're in jail!");
    return;
  }

  let skillsHTML = `
    <div style="background: linear-gradient(135deg, #2c3e50, #34495e); padding: 30px; border-radius: 15px; color: #ecf0f1;">
      <h2 style="text-align: center; color: #3498db; margin-bottom: 20px; font-size: 2.5em;">
        🧠 Advanced Skills System
      </h2>
      
      <div style="text-align: center; margin-bottom: 30px; padding: 15px; background: rgba(52, 152, 219, 0.2); border-radius: 10px;">
        <h3 style="color: #f39c12; margin: 0;">Skill Points Available: ${player.skillPoints}</h3>
        ${player.skillPoints === 0 ? 
          '<p style="color: #e67e22; margin: 10px 0;"><strong>💡 Complete jobs and missions to earn skill points!</strong></p>' : 
          '<p style="color: #2ecc71; margin: 10px 0;">💎 Spend your points wisely to unlock powerful abilities!</p>'
        }
      </div>
      
      <!-- Navigation Tabs -->
      <div style="display: flex; justify-content: center; margin-bottom: 30px; gap: 10px; flex-wrap: wrap;">
        <button onclick="showSkillTab('basic')" id="tab-basic" class="skill-tab active-tab">
          📚 Basic Skills
        </button>
        <button onclick="showSkillTab('trees')" id="tab-trees" class="skill-tab">
          🌳 Skill Trees
        </button>
        <button onclick="showSkillTab('reputation')" id="tab-reputation" class="skill-tab">
          🏆 Reputation
        </button>
        <button onclick="showSkillTab('mentors')" id="tab-mentors" class="skill-tab">
          🎓 Mentors
        </button>
        <button onclick="showSkillTab('perks')" id="tab-perks" class="skill-tab">
          ⭐ Perks
        </button>
      </div>
      
      <!-- Tab Content -->
      <div id="skill-tab-content">
        <!-- Content will be loaded by showSkillTab function -->
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); 
              color: white; padding: 15px 30px; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;">
          ←Back to SafeHouse
        </button>
      </div>
    </div>
    
    <style>
      .skill-tab {
        background: rgba(52, 73, 94, 0.8);
        color: #bdc3c7;
        border: 2px solid #7f8c8d;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      
      .skill-tab:hover {
        background: rgba(52, 152, 219, 0.3);
        border-color: #3498db;
        color: #ecf0f1;
      }
      
      .active-tab {
        background: linear-gradient(135deg, #3498db, #2980b9) !important;
        border-color: #3498db !important;
        color: white !important;
      }
      
      .skill-card {
        background: rgba(44, 62, 80, 0.9);
        border: 2px solid #7f8c8d;
        border-radius: 12px;
        padding: 20px;
        margin: 15px 0;
        transition: all 0.3s ease;
      }
      
      .skill-card:hover {
        border-color: #3498db;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
      }
      
      .skill-tree-branch {
        background: rgba(52, 73, 94, 0.6);
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        border-left: 4px solid #3498db;
      }
      
      .reputation-bar {
        width: 100%;
        height: 20px;
        background: rgba(52, 73, 94, 0.8);
        border-radius: 10px;
        overflow: hidden;
        margin: 10px 0;
      }
      
      .reputation-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.3s ease;
      }
      
      .mentor-card {
        background: rgba(44, 62, 80, 0.9);
        border-radius: 10px;
        padding: 20px;
        margin: 15px 0;
        border: 2px solid #8e44ad;
      }
      
      .perk-card {
        background: rgba(241, 196, 15, 0.1);
        border: 2px solid #f1c40f;
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
      }
      
      .perk-unlocked {
        background: rgba(46, 204, 113, 0.2);
        border-color: #2ecc71;
      }
    </style>
  `;

  document.getElementById("skills-content").innerHTML = skillsHTML;
  hideAllScreens();
  document.getElementById("skills-screen").style.display = "block";
  
  // Show basic skills tab by default
  showSkillTab('basic');
}

// Function to upgrade skills
// Advanced Skills System Functions

function showSkillTab(tabName) {
  // Update tab appearance
  document.querySelectorAll('.skill-tab').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  document.getElementById(`tab-${tabName}`).classList.add('active-tab');

  // Failsafe: always reset skill upgrade lock when showing skill tab
  window.upgradingSkill = false;

  // Load tab content
  let content = '';

  switch(tabName) {
    case 'basic':
      content = generateBasicSkillsContent();
      break;
    case 'trees':
      content = generateSkillTreesContent();
      break;
    case 'reputation':
      content = generateReputationContent();
      break;
    case 'mentors':
      checkMentorDiscovery(); // Check for newly qualified mentors
      content = generateMentorsContent();
      break;
    case 'perks':
      content = generatePerksContent();
      break;
  }

  document.getElementById('skill-tab-content').innerHTML = content;
}

function generateBasicSkillsContent() {
  let content = `
    <h3 style="color: #3498db; text-align: center; margin-bottom: 25px;">📚 Foundation Skills</h3>
    <p style="text-align: center; color: #bdc3c7; margin-bottom: 30px;">
      Master these fundamental abilities to unlock specialized skill trees.
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
  `;
  
  Object.entries(player.skills).forEach(([skillName, level]) => {
    const skillDef = skillTreeDefinitions[skillName];
    const canUpgrade = player.skillPoints > 0;
    const nextLevelCost = Math.floor(level / 5) + 1; // Increasing cost every 5 levels
    
    content += `
      <div class="skill-card">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 2em; margin-right: 15px;">${skillDef.icon}</span>
          <div>
            <h4 style="color: ${skillDef.color}; margin: 0;">${skillDef.name}</h4>
            <p style="color: #bdc3c7; margin: 5px 0; font-size: 0.9em;">Level ${level}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <div style="background: rgba(52, 73, 94, 0.5); height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: ${skillDef.color}; height: 100%; width: ${Math.min((level % 5) * 20, 100)}%; transition: width 0.3s ease;"></div>
          </div>
          <p style="font-size: 0.8em; color: #95a5a6; margin: 5px 0;">Progress to next milestone: ${level % 5}/5</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="color: #ecf0f1; font-size: 0.9em; margin: 0;">
            ${getSkillDescription(skillName, level)}
          </p>
        </div>
        
        <button onclick="upgradeSkill('${skillName}')" 
            style="background: ${canUpgrade ? `linear-gradient(135deg, ${skillDef.color}, ${skillDef.color}cc)` : '#7f8c8d'}; 
                color: white; border: none; padding: 10px 20px; border-radius: 8px; 
                cursor: ${canUpgrade ? 'pointer' : 'not-allowed'}; font-weight: bold; width: 100%;"
            ${!canUpgrade ? 'disabled' : ''}>
          ${canUpgrade ? `Upgrade (${nextLevelCost} point${nextLevelCost > 1 ? 's' : ''})` : 'No Points Available'}
        </button>
        
        ${level >= 5 && level % 5 === 0 ? `
          <div style="margin-top: 10px; padding: 8px; background: rgba(46, 204, 113, 0.2); border-radius: 5px; border: 1px solid #2ecc71;">
            <p style="color: #2ecc71; font-size: 0.8em; margin: 0; text-align: center;">
              🎉 Milestone reached! Skill tree branches unlocked!
            </p>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  content += `</div>`;
  return content;
}

function generateSkillTreesContent() {
  let content = `
    <h3 style="color: #3498db; text-align: center; margin-bottom: 25px;">🌳 Specialized Skill Trees</h3>
    <p style="text-align: center; color: #bdc3c7; margin-bottom: 30px;">
      Unlock and master specialized branches to become a true expert in your chosen fields.
    </p>
  `;
  
  Object.entries(skillTreeDefinitions).forEach(([skillName, skillDef]) => {
    const mainSkillLevel = player.skills[skillName];
    const isUnlocked = mainSkillLevel >= 5;
    
    content += `
      <div class="skill-card" style="margin-bottom: 30px;">
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <span style="font-size: 2.5em; margin-right: 15px;">${skillDef.icon}</span>
          <div>
            <h3 style="color: ${skillDef.color}; margin: 0;">${skillDef.name} Tree</h3>
            <p style="color: #bdc3c7; margin: 5px 0;">
              ${isUnlocked ? 'Unlocked' : `Requires ${skillName} level 5 (currently ${mainSkillLevel})`}
            </p>
          </div>
        </div>
        
        ${isUnlocked ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${Object.entries(skillDef.branches).map(([branchName, branch]) => {
              const currentLevel = player.skillTrees[skillName][branchName];
              const canUpgrade = player.skillPoints > 0 && currentLevel < branch.maxLevel;
              
              return `
                <div class="skill-tree-branch">
                  <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 1.5em; margin-right: 10px;">${branch.icon}</span>
                    <div>
                      <h4 style="color: #ecf0f1; margin: 0;">${branch.name}</h4>
                      <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Level ${currentLevel}/${branch.maxLevel}</p>
                    </div>
                  </div>
                  
                  <p style="color: #bdc3c7; font-size: 0.9em; margin-bottom: 10px;">
                    ${branch.description}
                  </p>
                  
                  <div style="background: rgba(52, 73, 94, 0.5); height: 6px; border-radius: 3px; margin-bottom: 10px;">
                    <div style="background: ${skillDef.color}; height: 100%; width: ${(currentLevel / branch.maxLevel) * 100}%; border-radius: 3px;"></div>
                  </div>
                  
                  <p style="color: #f39c12; font-size: 0.8em; margin-bottom: 15px;">
                    ${branch.benefits(currentLevel)}
                  </p>
                  
                  <button onclick="upgradeSkillTree('${skillName}', '${branchName}')"
                      style="background: ${canUpgrade ? `linear-gradient(135deg, ${skillDef.color}, ${skillDef.color}cc)` : '#7f8c8d'}; 
                          color: white; border: none; padding: 8px 15px; border-radius: 5px; 
                          cursor: ${canUpgrade ? 'pointer' : 'not-allowed'}; font-size: 0.9em; width: 100%;"
                      ${!canUpgrade ? 'disabled' : ''}>
                    ${currentLevel >= branch.maxLevel ? 'Maxed' : canUpgrade ? 'Upgrade (2 pts)' : 'No Points'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 40px; background: rgba(52, 73, 94, 0.3); border-radius: 10px;">
            <span style="font-size: 3em; opacity: 0.5;">🔒</span>
            <p style="color: #95a5a6; margin: 10px 0;">This skill tree is locked.</p>
            <p style="color: #bdc3c7; font-size: 0.9em;">Reach level 5 in ${skillName} to unlock specialized branches.</p>
          </div>
        `}
      </div>
    `;
  });
  
  return content;
}

function generateReputationContent() {
  let content = `
    <h3 style="color: #3498db; text-align: center; margin-bottom: 25px;">🏆 Street Reputation</h3>
    <p style="text-align: center; color: #bdc3c7; margin-bottom: 30px;">
      Your standing with different factions affects prices, opportunities, and survival.
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
  `;
  
  Object.entries(factionEffects).forEach(([factionId, faction]) => {
    const reputation = player.streetReputation[factionId] || 0;
    const reputationPercent = Math.min(Math.abs(reputation), 100);
    const isPositive = reputation >= 0;
    const color = isPositive ? '#2ecc71' : '#e74c3c';
    
    // Get current effects
    const currentEffects = [];
    const effects = isPositive ? faction.positiveEffects : faction.negativeEffects;
    effects.forEach(effect => {
      if (Math.abs(reputation) >= effect.level) {
        currentEffects.push(effect.effect);
      }
    });
    
    content += `
      <div class="skill-card">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 2em; margin-right: 15px;">${faction.icon}</span>
          <div style="flex: 1;">
            <h4 style="color: #ecf0f1; margin: 0;">${faction.name}</h4>
            <p style="color: ${color}; margin: 5px 0; font-weight: bold;">
              ${reputation > 0 ? '+' : ''}${reputation} / 100
            </p>
          </div>
        </div>
        
        <div class="reputation-bar">
          <div class="reputation-fill" style="background: ${color}; width: ${reputationPercent}%;"></div>
        </div>
        
        <div style="margin-top: 15px;">
          <h5 style="color: #f39c12; margin: 0 0 10px 0;">Current Effects:</h5>
          ${currentEffects.length > 0 ? 
            currentEffects.map(effect => `
              <p style="color: ${color}; font-size: 0.9em; margin: 5px 0; padding: 5px; background: rgba(${isPositive ? '46, 204, 113' : '231, 76, 60'}, 0.1); border-radius: 5px;">
                ${isPositive ? '✓' : '✗'} ${effect}
              </p>
            `).join('') : 
            '<p style="color: #95a5a6; font-style: italic;">No effects active</p>'
          }
        </div>
        
        <div style="margin-top: 15px;">
          <h5 style="color: #3498db; margin: 0 0 10px 0;">Next Milestone:</h5>
          ${(() => {
            const nextMilestone = effects.find(effect => Math.abs(reputation) < effect.level);
            if (nextMilestone) {
              return `
                <p style="color: #bdc3c7; font-size: 0.9em;">
                  At ${isPositive ? '+' : '-'}${nextMilestone.level}: ${nextMilestone.effect}
                </p>
              `;
            } else {
              return '<p style="color: #f39c12; font-size: 0.9em;">Maximum level reached!</p>';
            }
          })()}
        </div>
      </div>
    `;
  });
  
  content += `</div>`;
  return content;
}

function generateMentorsContent() {
  let content = `
    <h3 class="skill-tab-title">🎓 Mentorship Program</h3>
    <p class="skill-tab-subtitle">
      Learn from captured rivals and enemy specialists to unlock unique techniques.
    </p>
  `;
  
  if (player.mentors.length === 0) {
    content += `
      <div style="text-align: center; padding: 40px; background: rgba(52, 73, 94, 0.3); border-radius: 15px;">
        <span style="font-size: 4em; opacity: 0.5;">👨‍🏫</span>
        <h4 style="color: #95a5a6; margin: 20px 0;">No Mentors Available</h4>
        <p style="color: #bdc3c7; margin: 0;">
          Build your skills and reputation to attract mentors, or capture rival gang members during gang wars.<br>
          Each mentor teaches specialized techniques from their faction.
        </p>
        <div style="margin-top: 20px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
          <h5 style="color: #f39c12; margin-bottom: 10px;">🔍 Known Mentors in the Underground:</h5>
          ${potentialMentors.map(m => {
            const reqs = m.requirements || {};
            const reqText = Object.entries(reqs).map(([k, v]) => `${k}: ${v}`).join(', ');
            const met = Object.entries(reqs).every(([k, v]) => {
              if (k === 'reputation') return player.reputation >= v;
              return (player.skills[k] || 0) >= v;
            });
            return `<div style="padding: 6px 10px; margin: 4px 0; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid ${met ? '#2ecc71' : '#7f8c8d'};">
              <span style="color: ${met ? '#2ecc71' : '#ecf0f1'};">${m.name}</span>
              <span style="color: #95a5a6; font-size: 0.85em; float: right;">Requires: ${reqText}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    content += `<div class="skill-grid">`;
    
    player.mentors.forEach(mentor => {
      const mentoringCost = 100 + (mentor.sessionsCompleted * 25);
      const canAfford = player.money >= mentoringCost;
      const isAvailable = !mentor.lastSession || (Date.now() - mentor.lastSession) > 24 * 60 * 60 * 1000;
      
      content += `
        <div class="mentor-card">
          <div class="mentor-card-header">
            <span class="mentor-card-icon">${factionEffects[mentor.faction].icon}</span>
            <div>
              <h4 class="mentor-card-name">${mentor.name}</h4>
              <p class="mentor-card-faction">${factionEffects[mentor.faction].name}</p>
            </div>
          </div>
          
          <p class="mentor-card-quote">"${mentor.dialogue.teaching}"</p>
          
          <div style="margin-bottom: 15px;">
            <h5 class="mentor-specialties-title">Specialties:</h5>
            ${mentor.specialties.map(specialty => {
              const [skill, branch] = specialty.split('.');
              const skillDef = skillTreeDefinitions[skill];
              const branchDef = skillDef.branches[branch];
              return `
                <div class="mentor-specialty-item">
                  <span class="mentor-specialty-icon">${branchDef.icon}</span>
                  <span class="mentor-specialty-name">${branchDef.name}</span>
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="mentor-session-info">
            <p>Sessions completed: ${mentor.sessionsCompleted || 0}/10<br>
            Next session cost: $${mentoringCost.toLocaleString()}</p>
          </div>
          
          <button onclick="startMentoring('${mentor.id}')"
              class="mentor-train-btn ${canAfford && isAvailable ? 'available' : ''}"
              ${!canAfford || !isAvailable ? 'disabled' : ''}>
            ${!isAvailable ? 'Available in 24h' : !canAfford ? 'Insufficient Funds' : 'Start Training Session'}
          </button>
        </div>
      `;
    });
    
    content += `</div>`;
  }
  
  content += `
    <div class="mentor-tips">
      <h4>💡 Mentorship Tips</h4>
      <ul>
        <li>Build skills to attract mentors, or capture them during gang wars</li>
        <li>Each mentor teaches 2-3 specialized skill tree branches</li>
        <li>Training sessions have a 24-hour cooldown</li>
        <li>Completing 10 sessions with a mentor unlocks special bonuses</li>
        <li>Your reputation with their faction affects their willingness to teach</li>
      </ul>
    </div>
  `;
  
  return content;
}

function generatePerksContent() {
  let content = `
    <h3 class="skill-tab-title">⭐ Perks & Achievements</h3>
    <p class="skill-tab-subtitle">
      Unlock powerful passive abilities based on your playstyle and achievements.
    </p>
    
    <div class="skill-grid-narrow">
  `;
  
  Object.entries(availablePerks).forEach(([perkId, perk]) => {
    const isUnlocked = player.unlockedPerks.includes(perkId);
    const meetsRequirements = checkPerkRequirements(perk.requirements);
    
    content += `
      <div class="perk-card ${isUnlocked ? 'perk-unlocked' : ''}">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 2em; margin-right: 15px; ${!isUnlocked && !meetsRequirements ? 'opacity: 0.5;' : ''}">${perk.icon}</span>
          <div>
            <h4 style="color: ${isUnlocked ? '#2ecc71' : meetsRequirements ? '#f39c12' : '#95a5a6'}; margin: 0;">${perk.name}</h4>
            <p style="color: #bdc3c7; margin: 5px 0; font-size: 0.9em;">
              ${isUnlocked ? 'UNLOCKED' : meetsRequirements ? 'AVAILABLE' : 'LOCKED'}
            </p>
          </div>
        </div>
        
        <p style="color: #ecf0f1; font-size: 0.9em; margin-bottom: 15px;">
          ${perk.description}
        </p>
        
        <div style="margin-bottom: 15px; padding: 10px; background: rgba(52, 73, 94, 0.5); border-radius: 5px;">
          <p style="color: #3498db; font-size: 0.9em; margin: 0; font-weight: bold;">Effect:</p>
          <p style="color: #bdc3c7; font-size: 0.9em; margin: 5px 0 0 0;">${perk.effects}</p>
        </div>
        
        <div>
          <h5 style="color: #e67e22; margin: 0 0 10px 0;">Requirements:</h5>
          ${Object.entries(perk.requirements).map(([req, value]) => {
            let reqText = '';
            let isMet = false;
            
            switch(req) {
              case 'playstyle':
                const count = perk.requirements.count;
                const current = player.playstyleStats[value] || 0;
                isMet = current >= count;
                reqText = `${value.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${current}/${count}`;
                break;
              case 'skills':
                const skillEntries = Object.entries(value);
                isMet = skillEntries.every(([skill, level]) => player.skills[skill] >= level);
                reqText = skillEntries.map(([skill, level]) => `${skill} ${player.skills[skill]}/${level}`).join(', ');
                break;
              case 'skillTree':
                const [skill, branch] = value.split('.');
                const reqLevel = perk.requirements.level;
                const currentLevel = player.skillTrees[skill][branch];
                isMet = currentLevel >= reqLevel;
                reqText = `${skill}.${branch}: ${currentLevel}/${reqLevel}`;
                break;
              case 'reputation':
                isMet = player.reputation >= value;
                reqText = `reputation: ${player.reputation}/${value}`;
                break;
              case 'level':
                isMet = player.level >= value;
                reqText = `level: ${player.level}/${value}`;
                break;
              case 'territories':
                const territoryCount = player.territories ? player.territories.length : 0;
                isMet = territoryCount >= value;
                reqText = `territories: ${territoryCount}/${value}`;
                break;
              case 'mentors':
                const mentorCount = player.mentors ? player.mentors.length : 0;
                isMet = mentorCount >= value;
                reqText = `mentors: ${mentorCount}/${value}`;
                break;
            }
            
            return `
              <p style="color: ${isMet ? '#2ecc71' : '#e74c3c'}; font-size: 0.8em; margin: 2px 0;">
                ${isMet ? '✓' : '✗'} ${reqText}
              </p>
            `;
          }).join('')}
        </div>
        
        ${meetsRequirements && !isUnlocked ? `
          <button onclick="unlockPerk('${perkId}')" 
              style="background: linear-gradient(135deg, #f39c12, #e67e22); 
                  color: white; border: none; padding: 10px 15px; border-radius: 8px; 
                  cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px;">
            Unlock Perk
          </button>
        ` : ''}
      </div>
    `;
  });
  
  content += `</div>`;
  return content;
}

function getSkillDescription(skillName, level) {
  const nextLevel = level + 1;
  const descriptions = {
    stealth: `<strong>Current:</strong> -${level * 2}% arrest chance | <strong>Next level:</strong> -${nextLevel * 2}%<br><em style="color:#95a5a6;">Each level: -2% arrest chance, better stealth jobs</em>`,
    violence: `<strong>Current:</strong> +${level * 5}% combat effectiveness | <strong>Next level:</strong> +${nextLevel * 5}%<br><em style="color:#95a5a6;">Each level: +5% combat power, reduced injuries</em>`,
    charisma: `<strong>Current:</strong> +${level * 3}% negotiation, -${level * 2}% store prices | <strong>Next level:</strong> +${nextLevel * 3}%, -${nextLevel * 2}%<br><em style="color:#95a5a6;">Each level: +3% negotiation, -2% prices</em>`,
    intelligence: `<strong>Current:</strong> +${level * 4}% job success | <strong>Next level:</strong> +${nextLevel * 4}%<br><em style="color:#95a5a6;">Each level: +4% success rate, advanced planning</em>`,
    luck: `<strong>Current:</strong> +${level * 6}% event rewards | <strong>Next level:</strong> +${nextLevel * 6}%<br><em style="color:#95a5a6;">Each level: +6% random event rewards, better gambling</em>`,
    endurance: `<strong>Current:</strong> -${level} energy cost, +${level * 2} max energy | <strong>Next level:</strong> -${nextLevel}, +${nextLevel * 2}<br><em style="color:#95a5a6;">Each level: -1 energy cost, +2 max energy</em>`
  };
  
  return descriptions[skillName] || 'Unknown skill effect.';
}

function upgradeSkillTree(skillName, branchName) {
  const currentLevel = player.skillTrees[skillName][branchName];
  const maxLevel = skillTreeDefinitions[skillName].branches[branchName].maxLevel;
  
  // Cost scales: 1 point for levels 1-3, 2 for 4-6, 3 for 7+
  const cost = currentLevel < 3 ? 1 : (currentLevel < 6 ? 2 : 3);
  
  if (player.skillPoints < cost) {
    showBriefNotification(`Need ${cost} skill point${cost > 1 ? 's' : ''} to upgrade ${branchName} (you have ${player.skillPoints}).`, 'warning');
    return;
  }
  
  if (currentLevel < maxLevel) {
    player.skillTrees[skillName][branchName]++;
    player.skillPoints -= cost;
    player.playstyleStats.mentoringSessions++; // Track skill tree usage
    
    const newLevel = currentLevel + 1;
    
    // Milestone feedback at max level
    if (newLevel >= maxLevel) {
      showBriefNotification(`🏆 MASTERED: ${branchName}! You've reached the pinnacle.`, 'success');
      logAction(`🏆 ${branchName} MASTERED! You've reached level ${newLevel} — the absolute peak of this discipline.`);
    } else {
      logAction(`🌟 Specialized training complete! Your ${branchName} skills have improved significantly (Level ${newLevel}).`);
    }
    updateUI();
    showSkillTab('trees'); // Refresh the trees view
  } else {
    showBriefNotification(`${branchName} is already at max level!`, 'warning');
  }
}

function startMentoring(mentorId) {
  const mentor = player.mentors.find(m => m.id === mentorId);
  if (!mentor) return;
  
  const cost = 100 + (mentor.sessionsCompleted * 25);
  if (player.money < cost) {
    alert("You don't have enough money for this training session!");
    return;
  }
  
  const isAvailable = !mentor.lastSession || (Date.now() - mentor.lastSession) > 24 * 60 * 60 * 1000;
  if (!isAvailable) {
    alert("This mentor needs time to prepare the next lesson. Come back in 24 hours.");
    return;
  }
  
  player.money -= cost;
  mentor.lastSession = Date.now();
  mentor.sessionsCompleted = (mentor.sessionsCompleted || 0) + 1;
  player.playstyleStats.mentoringSessions++;
  
  // Randomly improve one of the mentor's specialty skills
  const specialty = mentor.specialties[Math.floor(Math.random() * mentor.specialties.length)];
  const [skillName, branchName] = specialty.split('.');
  
  if (player.skillTrees[skillName][branchName] < skillTreeDefinitions[skillName].branches[branchName].maxLevel) {
    player.skillTrees[skillName][branchName]++;
    logAction(`🎓 ${mentor.name} shares ancient wisdom! Your ${branchName} techniques have improved through their teachings.`);
  } else {
    // Give skill points if branch is maxed
    player.skillPoints += 2;
    logAction(`🎓 ${mentor.name} is impressed by your mastery and grants you additional training points to allocate as you see fit.`);
  }
  
  // Small reputation boost with mentor's faction
  if (player.streetReputation[mentor.faction] !== undefined) {
    player.streetReputation[mentor.faction] = Math.min(100, player.streetReputation[mentor.faction] + 2);
  }
  
  updateUI();
  showSkillTab('mentors'); // Refresh the mentors view
}

// Check if player qualifies for any new mentors based on skill requirements
function checkMentorDiscovery() {
  if (!potentialMentors || !player.mentors) return;
  
  const existingMentorNames = player.mentors.map(m => m.name);
  
  potentialMentors.forEach(mentorDef => {
    // Skip if already have this mentor
    if (existingMentorNames.includes(mentorDef.name)) return;
    
    // Check requirements
    const reqs = mentorDef.requirements || {};
    let qualified = true;
    
    for (const [key, value] of Object.entries(reqs)) {
      if (key === 'reputation') {
        if (player.reputation < value) qualified = false;
      } else if (player.skills[key] !== undefined) {
        if (player.skills[key] < value) qualified = false;
      }
    }
    
    if (!qualified) return;
    
    // Unlock this mentor!
    const newMentor = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: mentorDef.name,
      faction: mentorDef.faction,
      specialties: mentorDef.specialties,
      dialogue: mentorDef.dialogue,
      sessionsCompleted: 0,
      lastSession: null
    };
    
    player.mentors.push(newMentor);
    existingMentorNames.push(mentorDef.name);
    
    showBriefNotification(`🎓 New Mentor: ${mentorDef.name} has agreed to train you!`, 'success', 5000);
    logAction(`🎓 ${mentorDef.unlockMessage || `${mentorDef.name} recognizes your skills and offers to mentor you.`}`);
  });
}

function checkPerkRequirements(requirements) {
  return Object.entries(requirements).every(([req, value]) => {
    switch(req) {
      case 'playstyle':
        const count = requirements.count;
        return (player.playstyleStats[value] || 0) >= count;
      case 'skills':
        return Object.entries(value).every(([skill, level]) => player.skills[skill] >= level);
      case 'skillTree':
        const [skill, branch] = value.split('.');
        const reqLevel = requirements.level;
        return player.skillTrees[skill][branch] >= reqLevel;
      case 'reputation':
        return player.reputation >= value;
      case 'level':
        return player.level >= value;
      case 'territories':
        return (player.territories ? player.territories.length : 0) >= value;
      case 'mentors':
        return (player.mentors ? player.mentors.length : 0) >= value;
      case 'count':
      case 'level':
        return true; // These are handled by other requirements
      default:
        return false;
    }
  });
}

function unlockPerk(perkId) {
  const perk = availablePerks[perkId];
  if (!perk || player.unlockedPerks.includes(perkId)) return;
  
  if (checkPerkRequirements(perk.requirements)) {
    player.unlockedPerks.push(perkId);
    logAction(`⭐ Perk Unlocked! ${perk.name}: ${perk.description}`);
    updateUI();
    showSkillTab('perks'); // Refresh the perks view
    
    // Apply immediate perk effects if needed
    applyPerkEffects(perkId);
  }
}

function applyPerkEffects(perkId) {
  // Apply any immediate effects when perks are unlocked
  switch(perkId) {
    case 'kingmaker':
      // Boost all gang member loyalty to max
      if (player.gang && player.gang.gangMembers) {
        player.gang.gangMembers.forEach(member => {
          member.loyalty = 100;
        });
      }
      logAction("👑 Kingmaker unlocked! All gang members are now fiercely loyal.");
      break;
    case 'legendaryStatus':
      // Unlock special content or abilities
      logAction("🌟 Your legendary status opens doors that were previously closed to mortal criminals...");
      break;
    case 'ghostProtocol':
      logAction("👻 Ghost Protocol active! You leave no trace — heat generation reduced by 50%.");
      break;
    case 'fearMonger':
      logAction("😈 Fear Monger unlocked! Your reputation precedes you — intimidation +30% success.");
      break;
    case 'mastermind':
      logAction("🧠 Mastermind unlocked! 25% of jobs now auto-succeed with zero risk.");
      break;
    case 'masterTeacher':
      logAction("📖 Master Teacher unlocked! All skill gains increased by 25%.");
      break;
    case 'shadowWalker':
      logAction("🌑 Shadow Walker unlocked! 25% chance to avoid consequences on failed stealth jobs.");
      break;
    case 'warMachine':
      logAction("⚔️ War Machine unlocked! Combat jobs pay 50% more.");
      break;
    case 'silverTongue':
      logAction("🗣️ Silver Tongue unlocked! Negotiation jobs get massive success bonus.");
      break;
    case 'digitalGod':
      logAction("💻 Digital God unlocked! Hacking jobs get massive success bonus.");
      break;
    case 'fortuneSon':
      logAction("🍀 Fortune's Son unlocked! Gambling odds permanently improved.");
      break;
  }
}

function upgradeSkill(skillName) {
  // Prevent rapid clicking
  if (window.upgradingSkill) {
    // Failsafe: if stuck for more than 1 second, reset
    setTimeout(() => { window.upgradingSkill = false; }, 1000);
    return;
  }
  
  const currentLevel = player.skills[skillName];
  const cost = Math.floor(currentLevel / 5) + 1; // Increasing cost every 5 levels
  
  if (player.skillPoints >= cost) {
    window.upgradingSkill = true;
    player.skills[skillName]++;
    player.skillPoints -= cost;
    
    // Master Teacher perk: 25% bonus — chance to gain an extra skill level
    if (player.unlockedPerks.includes('masterTeacher') && Math.random() < 0.25) {
      player.skills[skillName]++;
      logAction(`📖 Master Teacher instinct! You gain an extra level in ${skillName}!`);
    }
    
    // Check for milestone achievements
    const newLevel = player.skills[skillName];
    if (newLevel % 5 === 0) {
      logAction(`🎉 Milestone reached! ${skillName} level ${newLevel} unlocks specialized skill trees and new opportunities!`);
    }
    
    logAction(`📚 Hours of practice pay off! Your ${skillName} skills sharpen like a blade. Every lesson learned in blood and sweat (Level ${newLevel}).`);
    updateUI();
    showSkillTab('basic'); // Refresh the current tab
    
    // Reset the cooldown after a short delay
    setTimeout(() => {
      window.upgradingSkill = false;
    }, 100);
    // Extra failsafe: reset after 1 second in case of UI issues
    setTimeout(() => {
      window.upgradingSkill = false;
    }, 1000);
  } else {
    alert(`You need ${cost} skill point${cost > 1 ? 's' : ''} to upgrade this skill!`);
  }
}

// Function to show gang management
// (Removed duplicate showGang function)

// Gang management functions
function collectTribute() {
  if (player.gang.members === 0) {
    alert("You need gang members to collect tribute!");
    return;
  }
  
  // Check cooldown (5 minutes = 300 seconds)
  const tributeCooldown = 300;
  const currentTime = Date.now();
  const timeSinceLastTribute = Math.floor((currentTime - player.gang.lastTributeTime) / 1000);
  
  if (timeSinceLastTribute < tributeCooldown) {
    const timeRemaining = tributeCooldown - timeSinceLastTribute;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    alert(`You must wait ${minutes}:${seconds.toString().padStart(2, '0')} before collecting tribute again.`);
    return;
  }
  
  // Calculate tribute based on individual gang member experience levels
  const baseTributePerMember = 200;
  let tribute = 0;
  
  // Calculate tribute from each gang member individually
  if (player.gang.gangMembers.length > 0) {
    player.gang.gangMembers.forEach(member => {
      const memberTribute = Math.floor(baseTributePerMember * member.tributeMultiplier);
      tribute += memberTribute;
    });
  } else {
    // Fallback for old save files without individual gang members
    tribute = player.gang.members * 250;
  }
  
  // Bonus based on territory controlled
  const territoryBonus = player.territory * 50;
  tribute += territoryBonus;
  
  // Loyalty affects tribute amount
  const loyaltyMultiplier = player.gang.loyalty / 100;
  tribute = Math.floor(tribute * loyaltyMultiplier);
  
  // Tribute is dirty cash
  player.dirtyMoney = (player.dirtyMoney || 0) + tribute;
  player.gang.lastTributeTime = currentTime;
  
  // Track statistics
  updateStatistic('tributeCollected');
  updateStatistic('totalMoneyEarned', tribute);
  
  let bonusText = "";
  if (territoryBonus > 0) {
    bonusText += ` (+$${territoryBonus} territory bonus)`;
  }
  if (loyaltyMultiplier < 1) {
    bonusText += ` (${Math.floor((1 - loyaltyMultiplier) * 100)}% reduced due to low loyalty)`;
  }
  
  alert(`Your gang collected $${tribute.toLocaleString()} in tribute (dirty)!${bonusText}`);
  logAction(`💰 Your crew comes through! Envelopes stuffed with cash find their way to you. The family business is paying dividends (+$${tribute.toLocaleString()} dirty${bonusText}).`);
  updateUI();
  showGang(); // Refresh the gang screen to show new cooldown
}

function expandTerritory() {
  const actualGangSize = player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members;
  
  if (actualGangSize < 5) {
    showBriefNotification("You need at least 5 gang members to expand territory!", 'warning');
    return;
  }
  
  // Territory expansion costs energy and money
  const energyCost = 15;
  const moneyCost = Math.floor(2000 + player.territories.length * 3000); // Scales with holdings
  
  if (player.energy < energyCost) {
    showBriefNotification(`Need ${energyCost} energy to expand territory. You have ${player.energy}.`, 'warning');
    return;
  }
  if (player.money < moneyCost) {
    showBriefNotification(`Need $${moneyCost.toLocaleString()} to fund the expansion. You have $${Math.floor(player.money).toLocaleString()}.`, 'warning');
    return;
  }
  
  player.energy -= energyCost;
  player.money -= moneyCost;
  
  // Success chance scales: 70% base, +3% per gang member beyond 5, +2% per leadership level, cap at 95%
  const leadershipLevel = (player.skillTrees.charisma && player.skillTrees.charisma.leadership) || 0;
  const successChance = Math.min(0.95, 0.70 + (actualGangSize - 5) * 0.03 + leadershipLevel * 0.02);
  
  if (Math.random() < successChance) {
    player.territory++;
    player.reputation += 5;
    
    // Income bonus from new territory
    const incomeGain = Math.floor(500 + Math.random() * 1500 + player.territories.length * 200);
    player.territoryIncome += incomeGain;
    
    // Track statistics
    updateStatistic('territoriesExpanded');
    
    // Update mission progress
    updateMissionProgress('territory_controlled');
    
    showBriefNotification(`Territory expanded! +$${incomeGain.toLocaleString()}/week income.`, 'success');
    logAction("🗺️ Your influence spreads like ink in water. New blocks fall under your protection, new corners pay tribute. The empire grows one street at a time.");
  } else {
    let losses = Math.floor(Math.random() * 3) + 1;
    player.gang.members = Math.max(0, player.gang.members - losses);
    
    // Also remove from detailed gang members array
    for (let i = 0; i < losses && player.gang.gangMembers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * player.gang.gangMembers.length);
      const lostMember = player.gang.gangMembers[randomIndex];
      player.gang.gangMembers.splice(randomIndex, 1);
      // Reduce territory power for lost member
      const powerLoss = Math.floor((lostMember.experienceLevel || 1) * 2) + 5;
      player.territoryPower = Math.max(50, player.territoryPower - powerLoss);
    }
    // Keep members count in sync
    player.gang.members = player.gang.gangMembers.length;
    
    showBriefNotification(`Expansion failed! Lost ${losses} gang members in the turf war.`, 'danger');
    logAction(`Failed territory expansion, lost ${losses} members.`);
  }
  updateUI();
  showGang();
}

function gangWar() {
  const actualGangSize = player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members;
  
  if (actualGangSize < 10) {
    alert("You need at least 10 gang members to start a gang war!");
    return;
  }
  
  let powerLevel = player.power + (actualGangSize * 10);
  
  // Car bonus for gang wars
  let carBonus = 0;
  if (player.selectedCar !== null && player.selectedCar < player.stolenCars.length) {
    let selectedCar = player.stolenCars[player.selectedCar];
    carBonus = Math.floor(selectedCar.baseValue / 10);
    powerLevel += carBonus;
    logAction(`Using ${selectedCar.name} in gang war for +${carBonus} power.`);
  }
  
  let enemyPower = Math.floor(Math.random() * 1000) + 500;
  
  if (powerLevel > enemyPower) {
    let winnings = Math.floor(Math.random() * 50000) + 25000;
    // Gang war winnings are illicit funds
    player.dirtyMoney = (player.dirtyMoney || 0) + winnings;
    player.reputation += 10;
    player.wantedLevel += 15;
    
    // Chance to capture a mentor (20% base chance, increased by charisma and leadership skills)
    let captureChance = 0.20;
    captureChance += player.skills.charisma * 0.02; // +2% per charisma level
    captureChance += player.skillTrees.charisma.leadership * 0.03; // +3% per leadership level
    captureChance += player.skillTrees.violence.intimidation * 0.025; // +2.5% per intimidation level
    
    if (Math.random() < captureChance && player.mentors.length < 4) {
      const availableMentors = potentialMentors.filter(mentor => 
        !player.mentors.some(existing => existing.name === mentor.name) &&
        player.skills.violence >= (mentor.requirements.violence || 0) &&
        player.skills.stealth >= (mentor.requirements.stealth || 0) &&
        player.skills.charisma >= (mentor.requirements.charisma || 0) &&
        player.skills.intelligence >= (mentor.requirements.intelligence || 0) &&
        player.reputation >= (mentor.requirements.reputation || 0)
      );
      
      if (availableMentors.length > 0) {
        const capturedMentor = availableMentors[Math.floor(Math.random() * availableMentors.length)];
        const newMentor = {
          ...capturedMentor,
          id: Date.now().toString(),
          sessionsCompleted: 0,
          lastSession: null
        };
        
        player.mentors.push(newMentor);
        logAction(`🎓 Mentor Captured! ${capturedMentor.name} has been taken prisoner. "${capturedMentor.dialogue.first}"`);
        alert(`🎓 Mentor Captured!\n\n${capturedMentor.name} from the ${factionEffects[capturedMentor.faction].name} has been captured!\n\n"${capturedMentor.dialogue.first}"\n\nThey can now teach you advanced techniques in the Skills menu.`);
      }
    }
    
    alert(`Gang war victory! Earned $${winnings.toLocaleString()} (dirty) and gained territory!`);
    logAction(`⚔️ Victorious in gang warfare! The streets echo with your name as you claim $${winnings.toLocaleString()} (dirty) and expand your domain.`);
    player.territory += 2;
    
    // Track violent playstyle
    player.playstyleStats.violentJobs = (player.playstyleStats.violentJobs || 0) + 1;
    
    // Car takes heavy damage in gang war
    if (player.selectedCar !== null) {
      let damageAmount = Math.floor(Math.random() * 25) + 15; // 15-40% damage
      let carCatastrophe = damageCar(player.selectedCar, damageAmount);
      if (!carCatastrophe) {
        logAction(`🚗 Your ride bears the scars of war - ${damageAmount}% damage from the intense firefight.`);
      }
      player.selectedCar = null;
    }
  } else {
    let losses = Math.floor(actualGangSize * 0.3);
    player.gang.members = Math.max(0, player.gang.members - losses);
    
    // Also remove from detailed gang members array
    for (let i = 0; i < losses && player.gang.gangMembers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * player.gang.gangMembers.length);
      const lostMember = player.gang.gangMembers[randomIndex];
      player.gang.gangMembers.splice(randomIndex, 1);
      // Reduce territory power for lost member
      const powerLoss = Math.floor((lostMember.experienceLevel || 1) * 2) + 5;
      player.territoryPower = Math.max(50, player.territoryPower - powerLoss);
    }
    
    player.gang.loyalty = Math.max(50, player.gang.loyalty - 20);
    alert(`Gang war defeat! Lost ${losses} members and loyalty decreased.`);
    logAction(`Lost gang war, lost ${losses} members.`);
    
    // Car takes extreme damage in defeat
    if (player.selectedCar !== null) {
      let damageAmount = Math.floor(Math.random() * 35) + 25; // 25-60% damage
      let carCatastrophe = damageCar(player.selectedCar, damageAmount);
      if (!carCatastrophe) {
        logAction(`Car took extreme damage (${damageAmount}%) in the failed gang war.`);
      }
      player.selectedCar = null;
    }
  }
  updateUI();
  showGang();
}

// Function to fire a gang member
async function fireGangMember(memberIndex) {
  if (memberIndex < 0 || memberIndex >= player.gang.gangMembers.length) {
    showBriefNotification("Invalid gang member selection.", 'warning');
    return;
  }
  
  const member = player.gang.gangMembers[memberIndex];
  
  // Confirm firing
  if (!await ui.confirm(`Are you sure you want to fire ${member.name}?<br><br>You will lose:<br>• ${member.power || 5} power<br>• Their tribute generation<br><br>This action cannot be undone.`)) {
    return;
  }
  
  // Calculate loyalty impact based on how the member is treated
  const loyaltyImpact = Math.min(15, Math.floor(member.loyalty / 10)); // Higher loyalty members cause more impact when fired
  
  // Remove power contribution
  player.power -= (member.power || 5);
  
  // Reduce territory power for fired member
  const powerLoss = Math.floor((member.experienceLevel || 1) * 2) + 5;
  player.territoryPower = Math.max(50, player.territoryPower - powerLoss);
  
  // Remove the member from the gang
  player.gang.gangMembers.splice(memberIndex, 1);
  
  // Update legacy member count if it exists
  if (player.gang.members > 0) {
    player.gang.members = Math.max(0, player.gang.members - 1);
  }
  
  // Reduce loyalty due to firing someone (shows you're ruthless)
  player.gang.loyalty = Math.max(30, player.gang.loyalty - loyaltyImpact);
  
  // Update UI and refresh gang screen
  updateUI();
  showGang();
  
  // Log the action with some flavor text
  const fireReasons = [
    "performance issues", "disloyalty", "unreliability", "insubordination", 
    "being a liability", "not meeting expectations", "poor judgment", "security concerns"
  ];
  const reason = fireReasons[Math.floor(Math.random() * fireReasons.length)];
  
  logAction(`🔥 ${member.name} has been terminated from your organization due to ${reason}. Word spreads quickly in the underworld - sometimes tough decisions must be made (-${member.power || 5} power, -${loyaltyImpact} loyalty).`);
  
  // Achievement check in case this affects any achievements
  checkAchievements();
}

// Function to show the jail screen
function showJailScreen() {
  document.getElementById("jail-screen").style.display = "block";
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameplay").style.display = "none";
  document.getElementById("jobs-screen").style.display = "none";
  document.getElementById("missions-screen").style.display = "none"; // Hide missions screen
  document.getElementById("store-screen").style.display = "none";
  document.getElementById("real-estate-screen").style.display = "none";
  document.getElementById("jailbreak-screen").style.display = "none"; // Hide jailbreak screen

  // Show player portrait behind bars
  displayPlayerJailPortrait();

  const breakoutButton = document.getElementById("breakout-button");
  if (player.breakoutAttempts > 0) {
    breakoutButton.innerText = `Try to Break Out (${player.breakoutAttempts} attempts left)`;
    breakoutButton.style.display = "block";
  } else {
    breakoutButton.style.display = "none";
  }
  
  // Bribe guard button - costs scale with level and wanted level
  const bribeButton = document.getElementById("bribe-button");
  const bribeCostEl = document.getElementById("bribe-cost");
  if (bribeButton) {
    const bribeCost = Math.floor(1000 + player.level * 500 + player.wantedLevel * 200);
    bribeButton.innerText = `💰 Bribe Guard ($${bribeCost.toLocaleString()})`;
    bribeButton.style.display = player.money >= bribeCost ? "inline-block" : "inline-block";
    bribeButton.style.opacity = player.money >= bribeCost ? "1" : "0.5";
    if (bribeCostEl) {
      bribeCostEl.textContent = player.money >= bribeCost ? "Grease some palms and walk free" : `Need $${bribeCost.toLocaleString()} (you have $${Math.floor(player.money).toLocaleString()})`;
    }
  }
  
  // Display prisoner list
  updatePrisonerList();
  
  // Reset and show TikTakToe game section
  resetTikTakToe();
  const tiktaktoeSection = document.getElementById("tiktaktoe-section");
  if (tiktaktoeSection) {
    tiktaktoeSection.style.display = "block";
  }
}

// Function to display player's portrait behind bars in jail
function displayPlayerJailPortrait() {
  const portraitContainer = document.getElementById("player-jail-portrait");
  if (!portraitContainer) return;
  
  let portraitHTML = "";
  
  if (player.portrait && player.name) {
    portraitHTML = `
      <div style="position: relative; display: inline-block; margin: 20px auto;">
        <div style="background: linear-gradient(135deg, #34495e, #2c3e50); padding: 20px; border-radius: 15px; border: 3px solid #7f8c8d; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <h3 style="color: #e74c3c; margin: 0 0 15px 0; text-align: center;">Prisoner #${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</h3>
          <div style="position: relative; display: inline-block;">
            <img src="${player.portrait}" alt="${player.name}" 
               style="width: 120px; height: 120px; border-radius: 10px; object-fit: cover; 
                  border: 3px solid #95a5a6; filter: grayscale(20%) brightness(0.8);" />
            
            <!-- Prison bars overlay -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                  background: repeating-linear-gradient(90deg, 
                    transparent 0px, transparent 8px, 
                    rgba(149, 165, 166, 0.8) 8px, rgba(149, 165, 166, 0.8) 12px); 
                  border-radius: 10px; pointer-events: none;"></div>
            
            <!-- Additional dark overlay for prison effect -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                  background: rgba(0, 0, 0, 0.3); border-radius: 10px; pointer-events: none;"></div>
          </div>
          <p style="color: #ecf0f1; margin: 15px 0 0 0; text-align: center; font-weight: bold; font-size: 1.1em;">${player.name}</p>
          <p style="color: #95a5a6; margin: 5px 0 0 0; text-align: center; font-size: 0.9em; font-style: italic;">
            Level ${player.level} Criminal
          </p>
        </div>
      </div>
    `;
  } else {
    portraitHTML = `
      <div style="text-align: center; padding: 20px; background: rgba(52, 73, 94, 0.6); border-radius: 10px; border: 2px solid #7f8c8d; margin: 20px;">
        <h3 style="color: #e74c3c;">🔒 Behind Bars</h3>
        <p style="color: #ecf0f1;">You sit in your cell, contemplating your choices...</p>
      </div>
    `;
  }
  
  portraitContainer.innerHTML = portraitHTML;
}

// Function to update the prisoner list in jail
function updatePrisonerList() {
  const prisonerListContainer = document.getElementById("prisoner-list");
  if (!prisonerListContainer) return;
  
  let prisonerHTML = "";
  
  jailPrisoners.forEach((prisoner, index) => {
    if (prisoner.isPlayer) {
      prisonerHTML += `
        <div style="background: rgba(231, 76, 60, 0.3); padding: 15px; margin: 10px 0; border-radius: 8px; border: 2px solid #e74c3c;">
          <strong>${prisoner.name}</strong> - Sentence: ${prisoner.sentence} seconds
          <br><span style="color: #e74c3c;">That's you!</span>
        </div>
      `;
    } else {
      const expReward = prisoner.difficulty * 6 + 4; // 10, 16, or 22 exp
      const difficultyText = ["Easy", "Medium", "Hard"][prisoner.difficulty - 1];
      prisonerHTML += `
        <div style="background: rgba(52, 73, 94, 0.6); padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #3498db;">
          <strong>${prisoner.name}</strong> - Sentence: ${prisoner.sentence} seconds
          <br>Difficulty: <span style="color: ${prisoner.difficulty === 1 ? '#2ecc71' : prisoner.difficulty === 2 ? '#f39c12' : '#e74c3c'}">${difficultyText}</span>
          <br>Reward: ${expReward} XP
          ${player.inJail ? 
            '<br><p style="color: #95a5a6; margin-top: 10px; font-style: italic;">Cannot help others while imprisoned yourself</p>' : 
            `<br><button onclick="breakoutPrisoner(${index})" style="margin-top: 10px;">Break Out (${prisoner.breakoutSuccess}% success)</button>`
          }
        </div>
      `;
    }
  });
  
  if (prisonerHTML === "") {
    prisonerHTML = "<p>No other prisoners in this cell block.</p>";
  }
  
  prisonerListContainer.innerHTML = prisonerHTML;
}

// Function to attempt breaking out another prisoner
function breakoutPrisoner(prisonerIndex) {
  // Prevent breaking out others while player is in jail
  if (player.inJail) {
    alert("You can't help other prisoners while you're locked up yourself!");
    return;
  }
  
  const prisoner = jailPrisoners[prisonerIndex];
  if (!prisoner || prisoner.isPlayer) return;
  
  const successChance = prisoner.breakoutSuccess + (player.skills.stealth * 2);
  const success = Math.random() * 100 < successChance;
  
  if (success) {
  const expReward = prisoner.difficulty * 3 + 2;
  player.experience += expReward;
    
    // Check for level up
    checkLevelUp();
    
    alert(`${getRandomNarration('prisonerBreakoutSuccess')} You helped ${prisoner.name} escape! Gained ${expReward} XP.`);
    logAction(`🤝 You slip ${prisoner.name} the keys and watch them disappear into the night. Honor among thieves - your reputation on the streets grows (+${expReward} XP).`);
    
    // Remove prisoner from list
    jailPrisoners.splice(prisonerIndex, 1);
    updatePrisonerList();
    updateUI();
    
  } else {
    // Failed breakout - chance of getting caught
    const caughtChance = 40 - (player.skills.stealth * 3);
    if (Math.random() * 100 < caughtChance) {
      alert(`${getRandomNarration('prisonerBreakoutFailure')} You've been caught and sent to jail!`);
      logAction(`⚡ Busted! The guards catch you red-handed helping ${prisoner.name}. They're dragging you to a cell of your own.`);
      
      // Send player to jail properly
      sendToJail(2); // Lose 2 wanted levels and go to jail
      
      // Add additional jail time for the failed breakout attempt (minimum 20 seconds)
      player.jailTime += Math.max(20, 15);
      
      // Ensure jail screen is shown after sendToJail
      setTimeout(() => {
        showJailScreen();
      }, 100); // Small delay to ensure proper screen switching
      
      return; // Exit early since player is now in jail
    } else {
      alert(`${getRandomNarration('prisonerBreakoutFailure')} But you weren't caught.`);
      logAction(`😔 The plan falls apart. ${prisoner.name} stays locked up, but at least you kept your head down. Sometimes discretion is the better part of valor.`);
    }
    updateUI();
  }
}

// TikTakToe Game Variables
let tiktaktoeBoard = ['', '', '', '', '', '', '', '', ''];
let tiktaktoeCurrentPlayer = 'X';
let tiktaktoeGameActive = false;

// TikTakToe Game Functions
function startTikTakToe() {
  // Initialize game
  tiktaktoeBoard = ['', '', '', '', '', '', '', '', ''];
  tiktaktoeCurrentPlayer = 'X';
  tiktaktoeGameActive = true;
  
  // Show game board and hide start screen
  document.getElementById('tiktaktoe-start').style.display = 'none';
  document.getElementById('tiktaktoe-game').style.display = 'block';
  
  // Update UI
  updateTikTakToeDisplay();
  
  // Clear board
  const cells = document.querySelectorAll('.tiktaktoe-cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#34495e';
  });
  
  logAction(`🎮 You challenge a cellmate to TikTakToe. Time to see who has the sharper mind in this concrete jungle!`);
}

function makeMove(cellIndex) {
  if (!tiktaktoeGameActive || tiktaktoeBoard[cellIndex] !== '') {
    return;
  }
  
  // Player move
  tiktaktoeBoard[cellIndex] = 'X';
  const cell = document.querySelectorAll('.tiktaktoe-cell')[cellIndex];
  cell.textContent = 'X';
  cell.style.color = '#2ecc71';
  cell.disabled = true;
  
  // Check for game end
  const result = checkTikTakToeWinner();
  if (result) {
    endTikTakToeGame(result);
    return;
  }
  
  // Switch to AI turn
  tiktaktoeCurrentPlayer = 'O';
  updateTikTakToeDisplay();
  
  // AI move after short delay
  setTimeout(() => {
    makeAIMove();
  }, 500);
}

function makeAIMove() {
  if (!tiktaktoeGameActive) return;
  
  // Simple AI: Try to win, block player, or make random move
  let aiMove = findBestAIMove();
  
  if (aiMove !== -1) {
    tiktaktoeBoard[aiMove] = 'O';
    const cell = document.querySelectorAll('.tiktaktoe-cell')[aiMove];
    cell.textContent = 'O';
    cell.style.color = '#e74c3c';
    cell.disabled = true;
    
    // Check for game end
    const result = checkTikTakToeWinner();
    if (result) {
      endTikTakToeGame(result);
      return;
    }
    
    // Switch back to player
    tiktaktoeCurrentPlayer = 'X';
    updateTikTakToeDisplay();
  }
}

function findBestAIMove() {
  // First, try to win
  for (let i = 0; i < 9; i++) {
    if (tiktaktoeBoard[i] === '') {
      tiktaktoeBoard[i] = 'O';
      if (checkWinningMove('O')) {
        tiktaktoeBoard[i] = '';
        return i;
      }
      tiktaktoeBoard[i] = '';
    }
  }
  
  // Second, try to block player from winning
  for (let i = 0; i < 9; i++) {
    if (tiktaktoeBoard[i] === '') {
      tiktaktoeBoard[i] = 'X';
      if (checkWinningMove('X')) {
        tiktaktoeBoard[i] = '';
        return i;
      }
      tiktaktoeBoard[i] = '';
    }
  }
  
  // Third, take center if available
  if (tiktaktoeBoard[4] === '') {
    return 4;
  }
  
  // Fourth, take corners
  const corners = [0, 2, 6, 8];
  for (let corner of corners) {
    if (tiktaktoeBoard[corner] === '') {
      return corner;
    }
  }
  
  // Finally, take any available space
  for (let i = 0; i < 9; i++) {
    if (tiktaktoeBoard[i] === '') {
      return i;
    }
  }
  
  return -1;
}

function checkWinningMove(player) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  
  return winPatterns.some(pattern => 
    pattern.every(index => tiktaktoeBoard[index] === player)
  );
}

function checkTikTakToeWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  
  // Check for winner
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (tiktaktoeBoard[a] && 
      tiktaktoeBoard[a] === tiktaktoeBoard[b] && 
      tiktaktoeBoard[a] === tiktaktoeBoard[c]) {
      return tiktaktoeBoard[a];
    }
  }
  
  // Check for tie
  if (tiktaktoeBoard.every(cell => cell !== '')) {
    return 'tie';
  }
  
  return null;
}

function endTikTakToeGame(result) {
  tiktaktoeGameActive = false;
  
  let message = '';
  
  if (result === 'X') {
    // Player wins - reduce sentence and boost gang respect
    const timeReduction = Math.min(10, Math.floor(player.jailTime * 0.2));
    player.jailTime -= timeReduction;
    
    if (!player.gangRespect) player.gangRespect = 0;
    player.gangRespect = Math.min(100, player.gangRespect + 2);
    
    message = `🎉 Victory! You outsmarted your cellmate with superior strategy. Word spreads fast - your sentence is reduced by ${timeReduction} seconds and you gain +2 Gang Respect!`;
    logAction(`🏆 TikTakToe victory! You proved your mental superiority over your cellmate. Sentence reduced by ${timeReduction}s. Gang Respect +2. Even in confinement, the criminal mastermind shines.`);
  } else if (result === 'O') {
    // AI wins
    message = `😔 Defeat! Your cellmate outplayed you this time. Sometimes the student becomes the teacher.`;
    logAction(`� TikTakToe defeat! Your cellmate's cunning exceeded your own this round. A humbling reminder that every criminal has something to learn.`);
  } else {
    // Tie - small gang respect boost
    if (!player.gangRespect) player.gangRespect = 0;
    player.gangRespect = Math.min(100, player.gangRespect + 1);
    
    message = `🤝 Stalemate! Neither you nor your cellmate could claim victory. Respect earned on both sides (+1 Gang Respect).`;
    logAction(`🤝 TikTakToe stalemate! Both players showed equal skill in this battle of wits. Gang Respect +1. Honor among thieves indeed.`);
  }
  
  alert(message);
  
  // Disable all cells
  const cells = document.querySelectorAll('.tiktaktoe-cell');
  cells.forEach(cell => {
    cell.disabled = true;
  });
  
  // Reset game after 3 seconds
  setTimeout(() => {
    resetTikTakToe();
  }, 3000);
}

function updateTikTakToeDisplay() {
  const currentPlayerElement = document.getElementById('current-player');
  const gameStatusElement = document.getElementById('game-status');
  
  if (tiktaktoeCurrentPlayer === 'X') {
    currentPlayerElement.textContent = 'Your turn (X)';
    currentPlayerElement.style.color = '#2ecc71';
    gameStatusElement.textContent = 'Make your move!';
  } else {
    currentPlayerElement.textContent = 'Cellmate\'s turn (O)';
    currentPlayerElement.style.color = '#e74c3c';
    gameStatusElement.textContent = 'Waiting for cellmate...';
  }
}

function quitTikTakToe() {
  if (tiktaktoeGameActive) {
    // If quitting mid-game, just end it
    alert(`You forfeit the game and walk away. Your cellmate chuckles at your strategic retreat.`);
    logAction(`🏃 You quit the TikTakToe game mid-match. Sometimes knowing when to fold is the mark of a true strategist.`);
  }
  
  resetTikTakToe();
}

function resetTikTakToe() {
  tiktaktoeGameActive = false;
  tiktaktoeBoard = ['', '', '', '', '', '', '', '', ''];
  tiktaktoeCurrentPlayer = 'X';
  
  // Show start screen and hide game
  document.getElementById('tiktaktoe-start').style.display = 'block';
  document.getElementById('tiktaktoe-game').style.display = 'none';
  
  // Clear and reset board
  const cells = document.querySelectorAll('.tiktaktoe-cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#34495e';
    cell.style.color = 'white';
  });
}

// Mini Games System
let currentMiniGame = null;
let mgTikTakToeBoard = ['', '', '', '', '', '', '', '', ''];
let mgTikTakToeCurrentPlayer = 'X';
let mgTikTakToeGameActive = false;

// Mini Games Variables for other games
let numberGuessingTarget = 0;
let numberGuessingAttempts = 0;
let rpsPlayerScore = 0;
let rpsAIScore = 0;
let rpsRoundsPlayed = 0;
let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryStartTime = 0;
let memoryPersonalBest = null;
let snakeGame = null;
let quickDrawStartTime = 0;
let quickDrawWaiting = false;
let quickDrawPersonalBest = null;

// Mini-game cooldown and stat tracking
let miniGameCooldowns = {
  memory: 0,
  quickDraw: 0,
  snake: 0,
  tiktaktoe: 0,
  tiktaktoeJail: 0
};
const MINIGAME_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const DAILY_GAME_LIMIT = 10; // Max plays per game per day
let miniGameDailyPlays = {
  memory: { count: 0, lastReset: Date.now() },
  quickDraw: { count: 0, lastReset: Date.now() },
  snake: { count: 0, lastReset: Date.now() },
  tiktaktoe: { count: 0, lastReset: Date.now() },
  tiktaktoeJail: { count: 0, lastReset: Date.now() }
};

// Recruitment event variables
let activeRecruitment = null;
let recruitmentTimer = null;

// Helper to check and reset daily play counts
function checkDailyReset(gameType) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  if (now - miniGameDailyPlays[gameType].lastReset > dayInMs) {
    miniGameDailyPlays[gameType].count = 0;
    miniGameDailyPlays[gameType].lastReset = now;
  }
}

// Check if mini-game is available (cooldown + daily limit)
function canPlayMiniGame(gameType) {
  checkDailyReset(gameType);
  const now = Date.now();
  if (miniGameCooldowns[gameType] > now) {
    const remaining = Math.ceil((miniGameCooldowns[gameType] - now) / 1000 / 60);
    alert(`⏳ Cool down! You need to wait ${remaining} more minute(s) before playing this again.`);
    return false;
  }
  if (miniGameDailyPlays[gameType].count >= DAILY_GAME_LIMIT) {
    alert(`🚫 Daily limit reached! You've played this game ${DAILY_GAME_LIMIT} times today. Come back tomorrow!`);
    return false;
  }
  return true;
}

// Track a mini-game play
function trackMiniGamePlay(gameType) {
  miniGameCooldowns[gameType] = Date.now() + MINIGAME_COOLDOWN_MS;
  miniGameDailyPlays[gameType].count++;
}

// ==================== EVENTS & RANDOMIZATION SYSTEM ====================

// Global event system state
let activeEvents = [];
let newsTimer = null;
let weatherTimer = null;
let currentWeather = "clear";
let currentSeason = "spring";

// Seasonal Events System
const seasonalEvents = {
  spring: [
    {
      id: "spring_festival",
      name: "Spring Festival",
      description: "The city celebrates spring with festivities - perfect cover for operations",
      effects: {
        jobSuccessBonus: 0.15,
        policeDistraction: 0.2,
        duration: 3 * 24 * 60 * 60 * 1000 // 3 days
      },
      probability: 0.3,
      icon: "🌸"
    },
    {
      id: "tax_season",
      name: "Tax Season Chaos",
      description: "Tax season creates financial desperation - more potential recruits and targets",
      effects: {
        recruitmentBonus: 0.25,
        storeDiscounts: 0.1,
        duration: 7 * 24 * 60 * 60 * 1000 // 1 week
      },
      probability: 0.4,
      icon: "💸"
    }
  ],
  summer: [
    {
      id: "summer_tourism",
      name: "Tourist Season",
      description: "Tourists flood the city with cash and distractions",
      effects: {
        moneyMultiplier: 1.3,
        pickpocketOpportunities: 0.2,
        duration: 2 * 7 * 24 * 60 * 60 * 1000 // 2 weeks
      },
      probability: 0.5,
      icon: "🏖️"
    },
    {
      id: "heat_wave",
      name: "Heat Wave",
      description: "Extreme heat makes everyone irritable - more violence, less police patrols",
      effects: {
        violentJobBonus: 0.2,
        policeEfficiency: -0.15,
        energyDrain: 1.1,
        duration: 5 * 24 * 60 * 60 * 1000 // 5 days
      },
      probability: 0.3,
      icon: "🌡️"
    }
  ],
  autumn: [
    {
      id: "harvest_festival",
      name: "Harvest Festival",
      description: "Harvest celebrations create opportunities for smuggling and black market sales",
      effects: {
        drugPrices: 1.4,
        smugglingSuccess: 0.25,
        duration: 4 * 24 * 60 * 60 * 1000 // 4 days
      },
      probability: 0.35,
      icon: "🍂"
    },
    {
      id: "back_to_school",
      name: "Back to School",
      description: "Students return to campus - new drug markets and young recruits",
      effects: {
        drugDemand: 1.5,
        youngRecruits: 0.3,
        duration: 2 * 7 * 24 * 60 * 60 * 1000 // 2 weeks
      },
      probability: 0.4,
      icon: "🎓"
    }
  ],
  winter: [
    {
      id: "holiday_chaos",
      name: "Holiday Shopping Chaos",
      description: "Holiday shopping creates perfect conditions for theft and pickpocketing",
      effects: {
        theftSuccess: 0.3,
        storeTraffic: 1.5,
        policeOverwhelmed: 0.2,
        duration: 3 * 7 * 24 * 60 * 60 * 1000 // 3 weeks
      },
      probability: 0.6,
      icon: "🎄"
    },
    {
      id: "cold_snap",
      name: "Cold Snap",
      description: "Bitter cold drives people indoors - fewer witnesses but harder movement",
      effects: {
        witnessReduction: 0.4,
        movementPenalty: 0.15,
        heatingCosts: 1.2,
        duration: 1 * 7 * 24 * 60 * 60 * 1000 // 1 week
      },
      probability: 0.25,
      icon: "❄️"
    }
  ]
};

// Weather Effects System
const weatherEffects = {
  clear: {
    name: "Clear Skies",
    description: "Perfect conditions for operations",
    effects: {},
    icon: "☀️"
  },
  overcast: {
    name: "Overcast",
    description: "Grey skies keep people indoors — fewer witnesses on the streets",
    effects: {
      witnessReduction: 0.1,
      stealthBonus: 0.05
    },
    icon: "☁️"
  },
  rain: {
    name: "Rain",
    description: "Rain provides cover but makes movement difficult",
    effects: {
      stealthBonus: 0.15,
      carAccidents: 0.1,
      witnessReduction: 0.2,
      energyCost: 1.1
    },
    icon: "🌧️"
  },
  drizzle: {
    name: "Light Drizzle",
    description: "A light rain dampens the streets — slight cover for shady dealings",
    effects: {
      stealthBonus: 0.08,
      witnessReduction: 0.1
    },
    icon: "🌦️"
  },
  snow: {
    name: "Snow",
    description: "Snow covers tracks but slows everything down",
    effects: {
      evidenceReduction: 0.3,
      movementSpeed: -0.2,
      heatingCosts: 1.3,
      carDamage: 1.2
    },
    icon: "🌨️"
  },
  blizzard: {
    name: "Blizzard",
    description: "A brutal blizzard — the city grinds to a halt, police can barely patrol",
    effects: {
      policeResponse: -0.4,
      stealthBonus: 0.3,
      carDamage: 1.8,
      energyCost: 1.5,
      businessDisruption: 0.5,
      movementSpeed: -0.35
    },
    icon: "❄️"
  },
  sleet: {
    name: "Sleet",
    description: "Icy rain makes roads treacherous and keeps citizens off the streets",
    effects: {
      carAccidents: 0.2,
      carDamage: 1.4,
      witnessReduction: 0.25,
      energyCost: 1.2
    },
    icon: "🧊"
  },
  fog: {
    name: "Fog",
    description: "Dense fog provides excellent cover for covert operations",
    effects: {
      stealthBonus: 0.25,
      witnessReduction: 0.35,
      carAccidents: 0.15,
      jobSuccessBonus: 0.1
    },
    icon: "🌫️"
  },
  storm: {
    name: "Storm",
    description: "Severe weather disrupts normal activity and police patrols",
    effects: {
      policeResponse: -0.3,
      stealthBonus: 0.2,
      carDamage: 1.5,
      energyCost: 1.3,
      businessDisruption: 0.4
    },
    icon: "⛈️"
  },
  heatwave: {
    name: "Heatwave",
    description: "Scorching heat frays tempers — more street fights, less police foot patrol",
    effects: {
      policeResponse: -0.15,
      energyCost: 1.25,
      witnessReduction: 0.15
    },
    icon: "🔥"
  },
  humid: {
    name: "Humid & Muggy",
    description: "Thick, oppressive air hangs over the city — everyone moves slower",
    effects: {
      energyCost: 1.15,
      movementSpeed: -0.1
    },
    icon: "🌡️"
  }
};

// Season-specific weather probability tables
// Each season maps weather types to their relative probability weight
const seasonalWeatherWeights = {
  spring: {
    clear: 20,
    overcast: 15,
    rain: 25,
    drizzle: 20,
    fog: 12,
    storm: 8
  },
  summer: {
    clear: 35,
    overcast: 10,
    rain: 10,
    drizzle: 5,
    storm: 12,
    heatwave: 18,
    humid: 10
  },
  autumn: {
    clear: 12,
    overcast: 20,
    rain: 22,
    drizzle: 15,
    fog: 20,
    storm: 8,
    sleet: 3
  },
  winter: {
    overcast: 15,
    snow: 30,
    blizzard: 10,
    sleet: 15,
    fog: 10,
    storm: 8,
    clear: 5,
    drizzle: 7
  }
};

// News Events System
const newsEvents = [
  {
    id: "police_budget_cut",
    name: "Police Budget Cuts",
    description: "City council cuts police funding, reducing patrol frequency",
    effects: {
      policeEfficiency: -0.25,
      arrestChance: -0.15,
      duration: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    probability: 0.1,
    category: "law_enforcement",
    icon: "💰"
  },
  {
    id: "new_police_chief",
    name: "New Police Chief Appointed",
    description: "Reform-minded police chief promises to crack down on organized crime",
    effects: {
      policeEfficiency: 0.3,
      arrestChance: 0.2,
      corruptionCost: 1.5,
      duration: 60 * 24 * 60 * 60 * 1000 // 60 days
    },
    probability: 0.08,
    category: "law_enforcement",
    icon: "👮"
  },
  {
    id: "economic_boom",
    name: "Economic Boom",
    description: "City experiences economic growth - more money in circulation",
    effects: {
      moneyMultiplier: 1.25,
      storeExpansion: 0.2,
      recruitmentCost: 1.15,
      duration: 45 * 24 * 60 * 60 * 1000 // 45 days
    },
    probability: 0.12,
    category: "economic",
    icon: "📈"
  },
  {
    id: "gang_violence_spike",
    name: "Gang Violence Surge",
    description: "Recent gang activity puts all criminals under increased scrutiny",
    effects: {
      wantedLevelGain: 1.4,
      policePresence: 0.3,
      territoryRisk: 0.25,
      duration: 14 * 24 * 60 * 60 * 1000 // 2 weeks
    },
    probability: 0.15,
    category: "crime",
    icon: "🔫"
  },
  {
    id: "festival_announcement",
    name: "Major Festival Announced",
    description: "City announces major cultural festival - opportunities and distractions",
    effects: {
      crowdCover: 0.3,
      pickpocketChance: 0.25,
      policeDistraction: 0.2,
      duration: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    probability: 0.2,
    category: "social",
    icon: "🎪"
  },
  {
    id: "tech_surveillance",
    name: "New Surveillance Technology",
    description: "Police deploy advanced surveillance systems throughout the city",
    effects: {
      stealthPenalty: 0.2,
      jobDifficulty: 1.15,
      corruptionValue: 1.3,
      duration: 90 * 24 * 60 * 60 * 1000 // 90 days
    },
    probability: 0.06,
    category: "technology",
    icon: "📹"
  }
];

// ==================== SUSPICION CONSEQUENCES SYSTEM ====================
// Checks player.suspicionLevel thresholds and triggers escalating consequences
// Called periodically from the energy regeneration loop

let lastSuspicionCheck = 0; // Timestamp of last check to throttle frequency

function checkSuspicionConsequences() {
  const suspicion = player.suspicionLevel || 0;
  const now = Date.now();
  
  // Only check every 60 seconds to prevent spam
  if (now - lastSuspicionCheck < 60000) return;
  lastSuspicionCheck = now;
  
  if (suspicion < 25) return; // No consequences below 25
  
  // Threshold 1: 25+ Suspicion — Minor consequences (random spot checks)
  if (suspicion >= 25 && suspicion < 50) {
    if (Math.random() < 0.08) { // 8% chance per check
      const events = [
        { msg: "🔍 An unmarked car has been spotted watching your businesses. The feds are taking notice.", moneyLoss: 0, wantedGain: 2 },
        { msg: "📱 Your burner phone intercepted a police radio call mentioning your name. Stay careful.", moneyLoss: 0, wantedGain: 1 },
        { msg: "🕵️ A suspicious person was asking questions about you in the neighborhood. Word is getting around.", moneyLoss: 0, wantedGain: 3 }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      player.wantedLevel += event.wantedGain;
      logAction(event.msg);
    }
  }
  
  // Threshold 2: 50+ Suspicion — Business raids (temporary income loss)
  if (suspicion >= 50 && suspicion < 75) {
    if (Math.random() < 0.06) { // 6% chance per check
      if (player.businesses && player.businesses.length > 0) {
        // Raid a random business — reset its collection timer (losing income)
        const raidedIndex = Math.floor(Math.random() * player.businesses.length);
        const raidedBusiness = player.businesses[raidedIndex];
        raidedBusiness.lastCollection = Date.now(); // Reset timer, losing accumulated income
        
        const dirtyLoss = Math.floor((player.dirtyMoney || 0) * (0.05 + Math.random() * 0.10)); // Seize 5-15% dirty money
        player.dirtyMoney = Math.max(0, (player.dirtyMoney || 0) - dirtyLoss);
        player.wantedLevel += 5;
        
        const lossMsg = dirtyLoss > 0 ? ` They seize $${dirtyLoss.toLocaleString()} in suspicious cash.` : '';
        logAction(`🚨 POLICE RAID! Officers descend on your ${raidedBusiness.name} with a search warrant.${lossMsg} Business income reset while they investigate.`);
        alert(`🚨 POLICE RAID!\n\nYour ${raidedBusiness.name} was raided by law enforcement!\n${dirtyLoss > 0 ? `$${dirtyLoss.toLocaleString()} in dirty money seized.\n` : ''}Business income timer has been reset.\n\nYour suspicion level is too high — lay low!`);
      } else {
        // No businesses to raid — just seize some dirty money
        const dirtyLoss = Math.floor((player.dirtyMoney || 0) * (0.10 + Math.random() * 0.15)); // 10-25%
        player.dirtyMoney = Math.max(0, (player.dirtyMoney || 0) - dirtyLoss);
        if (dirtyLoss > 0) {
          player.wantedLevel += 3;
          logAction(`🚔 Police search your vehicle at a checkpoint and confiscate $${dirtyLoss.toLocaleString()} in dirty cash.`);
        }
      }
    }
  }
  
  // Threshold 3: 75+ Suspicion — Severe consequences (asset seizure, business shutdown)
  if (suspicion >= 75 && suspicion < 100) {
    if (Math.random() < 0.05) { // 5% chance per check
      const severity = Math.random();
      
      if (severity < 0.4 && player.businesses && player.businesses.length > 0) {
        // Business temporarily shut down (force sell at reduced price)
        const targetIndex = Math.floor(Math.random() * player.businesses.length);
        const targetBusiness = player.businesses[targetIndex];
        const businessType = businessTypes.find(bt => bt.id === targetBusiness.type);
        
        // Seize the business — player loses it but gets partial refund (30-50% of base price)
        const refund = Math.floor(businessType.basePrice * (0.3 + Math.random() * 0.2));
        player.money += refund;
        const businessName = targetBusiness.name;
        player.businesses.splice(targetIndex, 1);
        
        logAction(`⚖️ ASSET SEIZURE! The government seizes your ${businessName} under RICO statutes! You recover $${refund.toLocaleString()} through your lawyer.`);
        alert(`⚖️ ASSET SEIZURE!\n\nThe federal government has seized your ${businessName}!\n\nYour lawyer negotiates a partial recovery of $${refund.toLocaleString()}.\n\nSuspicion at ${suspicion}% — the feds are closing in!`);
        
      } else if (severity < 0.7) {
        // Major dirty money seizure (25-40%)
        const seizureRate = 0.25 + Math.random() * 0.15;
        const seized = Math.floor((player.dirtyMoney || 0) * seizureRate);
        if (seized > 0) {
          player.dirtyMoney = Math.max(0, (player.dirtyMoney || 0) - seized);
          player.wantedLevel += 8;
          logAction(`🏦 Federal agents freeze your accounts and seize $${seized.toLocaleString()} in dirty money! Your lawyer is working overtime.`);
          alert(`🏦 ACCOUNT FREEZE!\n\n$${seized.toLocaleString()} in dirty money has been seized by federal agents!\n\nWanted level increased significantly.`);
        }
      } else {
        // Forced arrest — go directly to jail
        player.wantedLevel += 10;
        const suspicionJailTime = 15 + Math.floor(suspicion / 5); // 15-35 seconds
        logAction(`🚔 FBI ARREST! A tactical team ambushes you — there's no escape. You're taken into federal custody.`);
        alert(`🚔 FBI ARREST!\n\nA federal tactical team takes you down!\nYou're being held on suspicion of racketeering.\n\nJail time: ${suspicionJailTime} seconds`);
        sendToJail(10);
      }
      
      // Reduce suspicion after major consequences (they "got" something)
      player.suspicionLevel = Math.max(0, player.suspicionLevel - 15);
    }
  }
  
  // Threshold 4: 100 Suspicion — Guaranteed arrest
  if (suspicion >= 100) {
    // Massive crackdown — lose everything dirty and go to jail
    const allDirty = player.dirtyMoney || 0;
    player.dirtyMoney = 0;
    player.wantedLevel += 20;
    
    logAction(`🚨🚨🚨 FULL FEDERAL CRACKDOWN! The FBI, DEA, and local police coordinate a massive operation against your empire. All $${allDirty.toLocaleString()} in dirty money is seized as evidence!`);
    alert(`🚨 FULL FEDERAL CRACKDOWN! 🚨\n\nYour suspicion hit 100% — the feds bring the hammer down!\n\nAll dirty money ($${allDirty.toLocaleString()}) SEIZED!\nWanted level massively increased!\n\nYou're going away for a long time...`);
    
    // Reduce suspicion significantly after the crackdown
    player.suspicionLevel = 30; // Reset to moderate, they'll still be watching
    
    sendToJail(20);
  }
  
  updateUI();
}

// ==================== FBI INVESTIGATION EVENT CHAIN ====================
// Multi-step investigation that escalates through stages when suspicion is high
// Stages: 0 = None, 1 = Surveillance, 2 = Evidence Gathering, 3 = Grand Jury, 4 = Raid

function checkFBIInvestigation() {
  const suspicion = player.suspicionLevel || 0;
  
  // Initialize FBI investigation tracker
  if (!player.fbiInvestigation) {
    player.fbiInvestigation = { stage: 0, progress: 0, lastEscalation: 0 };
  }
  
  const fbi = player.fbiInvestigation;
  const now = Date.now();
  
  // Don't escalate if already at max or recently escalated (5 min cooldown)
  if (now - fbi.lastEscalation < 300000) return;
  
  // Investigation starts at suspicion 60+
  if (suspicion >= 60 && fbi.stage === 0) {
    fbi.stage = 1;
    fbi.progress = 0;
    fbi.lastEscalation = now;
    
    showFBIEventOverlay(
      '🔍 FBI SURVEILLANCE DETECTED',
      'Your contacts in law enforcement tip you off — the FBI has opened a file on your operations. Agents have been spotted photographing your businesses and associates.',
      [
        { label: '🕵️ Lay Low (costs $50K)', action: 'laylow', cost: 50000 },
        { label: '🔥 Destroy Evidence (costs 15 energy)', action: 'destroy', energyCost: 15 },
        { label: '😤 Ignore It', action: 'ignore' }
      ],
      1
    );
    return;
  }
  
  // Escalate investigation if suspicion stays high
  if (suspicion >= 70 && fbi.stage === 1) {
    // Progress builds over time
    fbi.progress += 10 + Math.floor(suspicion / 10);
    if (fbi.progress >= 100) {
      fbi.stage = 2;
      fbi.progress = 0;
      fbi.lastEscalation = now;
      
      showFBIEventOverlay(
        '📋 FBI EVIDENCE GATHERING',
        'The investigation has escalated. Federal agents are interviewing your associates and subpoenaing financial records. They\'re building a RICO case against you.',
        [
          { label: '💰 Bribe a Contact ($200K)', action: 'bribe', cost: 200000 },
          { label: '🔥 Burn the Books (costs 25 energy)', action: 'burn', energyCost: 25 },
          { label: '⚖️ Hire a Lawyer ($100K)', action: 'lawyer', cost: 100000 },
          { label: '😤 Let Them Try', action: 'ignore' }
        ],
        2
      );
    }
    return;
  }
  
  if (suspicion >= 80 && fbi.stage === 2) {
    fbi.progress += 15 + Math.floor(suspicion / 8);
    if (fbi.progress >= 100) {
      fbi.stage = 3;
      fbi.progress = 0;
      fbi.lastEscalation = now;
      
      showFBIEventOverlay(
        '⚖️ GRAND JURY CONVENED',
        'A federal grand jury has been convened to hear evidence against you. Indictments are imminent. Your lawyer says you have one last chance to act before they move in.',
        [
          { label: '✈️ Flee the Country ($500K)', action: 'flee', cost: 500000 },
          { label: '🤝 Cut a Deal (lose 50% dirty money)', action: 'deal' },
          { label: '💰 Bribe the Jury ($350K)', action: 'bribejury', cost: 350000 },
          { label: '⚔️ Go to War', action: 'war' }
        ],
        3
      );
    }
    return;
  }
  
  if (fbi.stage === 3 && suspicion >= 85) {
    fbi.progress += 20;
    if (fbi.progress >= 80) {
      // Stage 4: The Raid — automatic, no choices
      fbi.stage = 4;
      fbi.lastEscalation = now;
      executeFBIRaid();
    }
  }
}

function showFBIEventOverlay(title, description, choices, stage) {
  // Remove existing overlay if any
  const existing = document.getElementById('fbi-event-overlay');
  if (existing) existing.remove();
  
  const stageColors = { 1: '#f39c12', 2: '#e67e22', 3: '#e74c3c', 4: '#c0392b' };
  const color = stageColors[stage] || '#e74c3c';
  
  let choiceHTML = choices.map(c => {
    let disabled = '';
    let tooltip = '';
    if (c.cost && player.money < c.cost) { disabled = 'disabled'; tooltip = `title="Need $${c.cost.toLocaleString()}"`; }
    if (c.energyCost && player.energy < c.energyCost) { disabled = 'disabled'; tooltip = `title="Need ${c.energyCost} energy"`; }
    return `<button onclick="handleFBIChoice('${c.action}', ${c.cost || 0}, ${c.energyCost || 0})" 
              style="background: ${disabled ? '#7f8c8d' : color}; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: ${disabled ? 'not-allowed' : 'pointer'}; font-size: 1em; min-width: 200px;"
              ${disabled} ${tooltip}>
      ${c.label}
    </button>`;
  }).join('');
  
  const overlay = document.createElement('div');
  overlay.id = 'fbi-event-overlay';
  overlay.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); 
          display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; box-sizing: border-box;">
      <div style="max-width: 550px; width: 100%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
            padding: 30px; border-radius: 20px; border: 3px solid ${color}; box-shadow: 0 0 40px ${color}40; text-align: center; color: white;">
        <h2 style="color: ${color}; margin-bottom: 15px; font-size: 1.5em;">${title}</h2>
        <p style="color: #bdc3c7; margin-bottom: 8px; font-size: 0.9em;">Investigation Stage: ${stage}/4</p>
        <div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 10px; height: 8px; margin-bottom: 20px;">
          <div style="width: ${stage * 25}%; background: ${color}; border-radius: 10px; height: 100%; transition: width 0.5s;"></div>
        </div>
        <p style="color: #ecf0f1; margin-bottom: 25px; line-height: 1.6;">${description}</p>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
          ${choiceHTML}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function handleFBIChoice(action, cost, energyCost) {
  const fbi = player.fbiInvestigation;
  const overlay = document.getElementById('fbi-event-overlay');
  if (overlay) overlay.remove();
  
  switch (action) {
    case 'laylow':
      if (player.money >= cost) {
        player.money -= cost;
        player.suspicionLevel = Math.max(0, player.suspicionLevel - 10);
        fbi.progress = Math.max(0, fbi.progress - 30);
        logAction(`🕵️ You pay $${cost.toLocaleString()} to your contacts and lay low. The FBI loses some interest (-10 suspicion).`);
      }
      break;
      
    case 'destroy':
      if (player.energy >= energyCost) {
        player.energy -= energyCost;
        player.suspicionLevel = Math.max(0, player.suspicionLevel - 15);
        fbi.progress = Math.max(0, fbi.progress - 50);
        logAction(`🔥 You destroy financial records and evidence. The paper trail goes cold (-15 suspicion).`);
      }
      break;
      
    case 'bribe':
      if (player.money >= cost) {
        player.money -= cost;
        player.suspicionLevel = Math.max(0, player.suspicionLevel - 20);
        fbi.stage = Math.max(0, fbi.stage - 1);
        fbi.progress = 0;
        logAction(`💰 Your $${cost.toLocaleString()} bribe reaches the right person. The investigation is downgraded (-20 suspicion, stage reduced).`);
      }
      break;
      
    case 'burn':
      if (player.energy >= energyCost) {
        player.energy -= energyCost;
        player.suspicionLevel = Math.max(0, player.suspicionLevel - 12);
        fbi.progress = Math.max(0, fbi.progress - 40);
        logAction(`🔥 You spend the night burning books and destroying hard drives. Key evidence disappears (-12 suspicion).`);
      }
      break;
      
    case 'lawyer':
      if (player.money >= cost) {
        player.money -= cost;
        fbi.progress = Math.max(0, fbi.progress - 60);
        player.suspicionLevel = Math.max(0, player.suspicionLevel - 8);
        logAction(`⚖️ Your high-powered lawyer files motions to suppress evidence and delay proceedings. It buys you time.`);
      }
      break;
      
    case 'flee':
      if (player.money >= cost) {
        player.money -= cost;
        fbi.stage = 0;
        fbi.progress = 0;
        player.suspicionLevel = Math.max(10, player.suspicionLevel - 40);
        // Lose some businesses during absence
        if (player.businesses && player.businesses.length > 1) {
          const lostBusiness = player.businesses.pop();
          logAction(`📦 While you were gone, your ${lostBusiness.name} was seized.`);
        }
        logAction(`✈️ You spend $${cost.toLocaleString()} to flee the country. After weeks abroad, you return when things cool down. Investigation dropped (-40 suspicion, lost a business).`);
      }
      break;
      
    case 'deal':
      // Lose 50% dirty money, suspicion drops significantly, investigation ends
      const dealCost = Math.floor((player.dirtyMoney || 0) * 0.5);
      player.dirtyMoney = Math.max(0, (player.dirtyMoney || 0) - dealCost);
      fbi.stage = 0;
      fbi.progress = 0;
      player.suspicionLevel = Math.max(5, player.suspicionLevel - 50);
      logAction(`🤝 You cooperate with the feds, surrendering $${dealCost.toLocaleString()} in dirty money. The investigation is closed in exchange for your "cooperation." (-50 suspicion)`);
      break;
      
    case 'bribejury':
      if (player.money >= cost) {
        player.money -= cost;
        if (Math.random() < 0.65) { // 65% chance of success
          fbi.stage = 1;
          fbi.progress = 0;
          player.suspicionLevel = Math.max(10, player.suspicionLevel - 25);
          logAction(`💰 Your jury bribe works! Key jurors refuse to indict. The investigation is set back to surveillance (-25 suspicion).`);
        } else {
          // Bribe discovered — makes things worse
          player.suspicionLevel = Math.min(100, player.suspicionLevel + 15);
          fbi.progress += 30;
          player.wantedLevel += 10;
          logAction(`💰🚨 The jury bribe is DISCOVERED! An honest juror reports the attempt. Obstruction of justice charges added (+15 suspicion, +10 wanted).`);
        }
      }
      break;
      
    case 'war':
      // Violent resistance — high risk, high reward
      player.wantedLevel += 15;
      player.suspicionLevel = Math.min(100, player.suspicionLevel + 10);
      if (player.power > 300 && Math.random() < 0.4) {
        fbi.stage = 0;
        fbi.progress = 0;
        player.suspicionLevel = Math.max(20, player.suspicionLevel - 30);
        logAction(`⚔️ Your organization wages a shadow war against the investigation. Witnesses recant, evidence disappears, agents are reassigned. The investigation collapses — for now.`);
      } else {
        executeFBIRaid();
        return;
      }
      break;
      
    case 'ignore':
    default:
      fbi.progress += 20;
      logAction(`😤 You ignore the FBI's investigation. Risky move — they're not going away.`);
      break;
  }
  
  updateUI();
}

function executeFBIRaid() {
  const fbi = player.fbiInvestigation;
  
  // Full FBI raid — severe consequences
  const dirtySeized = player.dirtyMoney || 0;
  player.dirtyMoney = 0;
  
  // Seize 10-20% of clean money too
  const cleanSeized = Math.floor(player.money * (0.10 + Math.random() * 0.10));
  player.money = Math.max(0, player.money - cleanSeized);
  
  // Possibly lose a business
  let lostBusinessName = 'none';
  if (player.businesses && player.businesses.length > 0) {
    // Target illegal businesses first
    const illegalIdx = player.businesses.findIndex(b => {
      const bt = businessTypes.find(t => t.id === b.type);
      return bt && bt.paysDirty;
    });
    if (illegalIdx >= 0) {
      lostBusinessName = player.businesses[illegalIdx].name;
      player.businesses.splice(illegalIdx, 1);
    } else if (Math.random() < 0.3) {
      const idx = Math.floor(Math.random() * player.businesses.length);
      lostBusinessName = player.businesses[idx].name;
      player.businesses.splice(idx, 1);
    }
  }
  
  player.wantedLevel += 20;
  player.suspicionLevel = 25; // Reset after the crackdown
  fbi.stage = 0;
  fbi.progress = 0;
  
  const businessMsg = lostBusinessName !== 'none' ? `\n🏢 ${lostBusinessName} SEIZED by the feds!` : '';
  logAction(`🚨🚨 FBI RAID! Tactical teams swarm your operations! $${dirtySeized.toLocaleString()} dirty money confiscated, $${cleanSeized.toLocaleString()} in assets frozen.${businessMsg}`);
  alert(`🚨 FBI RAID! 🚨\n\nThe feds bring the full weight of the law!\n\n💰 Dirty money seized: $${dirtySeized.toLocaleString()}\n💵 Assets frozen: $${cleanSeized.toLocaleString()}${businessMsg}\n\nYou're going to federal prison...`);
  
  sendToJail(25);
  updateUI();
}

// Police Crackdown System
const crackdownTypes = [
  {
    id: "drug_crackdown",
    name: "Drug Enforcement Crackdown",
    description: "Special task force targets drug operations",
    effects: {
      drugRisk: 0.4,
      drugPrices: 0.7,
      arrestChance: 0.25,
      duration: 10 * 24 * 60 * 60 * 1000 // 10 days
    },
    triggers: ["high_drug_activity", "public_pressure"],
    severity: "high",
    icon: "💊"
  },
  {
    id: "gang_crackdown",
    name: "Gang Activity Crackdown",
    description: "Joint task force targets organized crime",
    effects: {
      gangOperationRisk: 0.5,
      recruitmentRisk: 0.3,
      territoryHeat: 0.4,
      duration: 14 * 24 * 60 * 60 * 1000 // 2 weeks
    },
    triggers: ["territory_violence", "gang_visibility"],
    severity: "extreme",
    icon: "👥"
  },
  {
    id: "vehicle_crackdown",
    name: "Auto Theft Crackdown",
    description: "Police increase patrols and vehicle tracking",
    effects: {
      carTheftRisk: 0.35,
      vehicleEvidence: 0.3,
      chopShopRisk: 0.4,
      duration: 7 * 24 * 60 * 60 * 1000 // 1 week
    },
    triggers: ["car_theft_reports", "insurance_pressure"],
    severity: "medium",
    icon: "🚗"
  },
  {
    id: "corruption_investigation",
    name: "Corruption Investigation",
    description: "Internal affairs investigates police corruption",
    effects: {
      corruptionRisk: 0.6,
      corruptionCost: 2.0,
      officialTurnover: 0.4,
      duration: 21 * 24 * 60 * 60 * 1000 // 3 weeks
    },
    triggers: ["corruption_exposure", "political_pressure"],
    severity: "extreme",
    icon: "🔍"
  }
];

// ==================== END EVENTS & RANDOMIZATION SYSTEM ====================

// ==================== EVENT SYSTEM FUNCTIONS ====================

// Initialize the events system
function initializeEventsSystem() {
  // Determine current season based on date
  updateCurrentSeason();
  
  // Set initial weather
  changeWeather();
  
  // Start event timers
  startEventTimers();
  
  // Add events to player data if not exists
  if (!player.activeEvents) {
    player.activeEvents = [];
  }
  
  if (gameplayActive) {
    logAction("🌍 The city awakens with new possibilities. Events and weather will now shape your criminal empire.");
  }
}

// Determine current season
function updateCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) currentSeason = "spring";
  else if (month >= 5 && month <= 7) currentSeason = "summer";
  else if (month >= 8 && month <= 10) currentSeason = "autumn";
  else currentSeason = "winter";
  
  // Update background based on season
  updateSeasonalBackground();
}

// Update the background to match the current season
function updateSeasonalBackground() {
  const body = document.body;
  
  // Remove all existing season classes
  body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
  
  // Add the current season class
  body.classList.add(`season-${currentSeason}`);
  
  // Update the UI to reflect the new season
  updateUI();
  
  // Log the season change for player awareness (only during gameplay)
  if (gameplayActive) {
    logAction(`🌍 The city transforms with the changing seasons - now experiencing ${currentSeason}.`);
  }
}

// Weather system functions — season-aware
function changeWeather() {
  // Get the weather weights for the current season
  const weights = seasonalWeatherWeights[currentSeason] || seasonalWeatherWeights.spring;
  const weatherTypes = Object.keys(weights);
  const probabilities = weatherTypes.map(type => weights[type]);
  
  // Weighted random selection
  let totalProb = probabilities.reduce((sum, prob) => sum + prob, 0);
  let random = Math.random() * totalProb;
  let currentProb = 0;
  
  for (let i = 0; i < weatherTypes.length; i++) {
    currentProb += probabilities[i];
    if (random <= currentProb) {
      const newWeather = weatherTypes[i];
      if (newWeather !== currentWeather) {
        currentWeather = newWeather;
        const weather = weatherEffects[currentWeather];
        if (gameplayActive) {
          showWeatherAlert(weather);
          logAction(`🌤️ Weather update: ${weather.name}. ${weather.description}`);
        }
      }
      break;
    }
  }
}

// Show weather alert
function showWeatherAlert(weather) {
  const effects = Object.keys(weather.effects).length > 0 ? 
    Object.keys(weather.effects).map(effect => {
      const value = weather.effects[effect];
      const sign = value > 0 ? '+' : '';
      return `${effect}: ${sign}${(value * 100).toFixed(0)}%`;
    }).join(', ') : 'No special effects';
  
  alert(`${weather.icon} Weather Change: ${weather.name}\n${weather.description}\n\nEffects: ${effects}`);
}

// Trigger seasonal events
function checkSeasonalEvents() {
  const seasonEvents = seasonalEvents[currentSeason];
  if (!seasonEvents) return;
  
  seasonEvents.forEach(event => {
    if (Math.random() < event.probability / 30) { // Divided by 30 for daily probability
      if (!isEventActive(event.id)) {
        triggerSeasonalEvent(event);
      }
    }
  });
}

// Trigger a seasonal event
function triggerSeasonalEvent(event) {
  const activeEvent = {
    ...event,
    startTime: Date.now(),
    endTime: Date.now() + event.effects.duration,
    type: 'seasonal'
  };
  
  activeEvents.push(activeEvent);
  player.activeEvents = activeEvents;
  
  showEventAlert(activeEvent);
  logAction(`${event.icon} ${event.name}: ${event.description} The city offers new opportunities for the opportunistic.`);
}

// Trigger news events
function triggerNewsEvent() {
  const availableEvents = newsEvents.filter(event => 
    Math.random() < event.probability && !isEventActive(event.id)
  );
  
  if (availableEvents.length > 0) {
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    const activeEvent = {
      ...event,
      startTime: Date.now(),
      endTime: Date.now() + event.effects.duration,
      type: 'news'
    };
    
    activeEvents.push(activeEvent);
    player.activeEvents = activeEvents;
    
    showNewsAlert(activeEvent);
    logAction(`📰 Breaking News: ${event.name}. ${event.description} The game changes once again.`);
  }
}

// Trigger police crackdowns
function triggerPoliceCrackdown() {
  // Check triggers for crackdowns
  const validCrackdowns = crackdownTypes.filter(crackdown => {
    return crackdown.triggers.some(trigger => {
      switch(trigger) {
        case 'high_drug_activity': return player.experience > 100;
        case 'public_pressure': return player.wantedLevel > 30;
        case 'territory_violence': return player.territories.length > 2;
        case 'gang_visibility': return player.gang.members > 5;
        case 'car_theft_reports': return player.stolenCars.length > 3;
        case 'insurance_pressure': return player.stolenCars.length > 5;
        case 'corruption_exposure': return player.corruptedOfficials.length > 2;
        case 'political_pressure': return player.wantedLevel > 50;
        default: return false;
      }
    });
  });
  
  if (validCrackdowns.length > 0 && Math.random() < 0.1) { // 10% chance when conditions are met
    const crackdown = validCrackdowns[Math.floor(Math.random() * validCrackdowns.length)];
    
    if (!isEventActive(crackdown.id)) {
      const activeEvent = {
        ...crackdown,
        startTime: Date.now(),
        endTime: Date.now() + crackdown.effects.duration,
        type: 'crackdown'
      };
      
      activeEvents.push(activeEvent);
      player.activeEvents = activeEvents;
      
      showCrackdownAlert(activeEvent);
      logAction(`🚨 ${crackdown.name}: ${crackdown.description} The heat is rising - stay vigilant.`);
    }
  }
}

// Show event alerts
function showEventAlert(event) {
  const effects = Object.keys(event.effects).filter(key => key !== 'duration').map(effect => {
    const value = event.effects[effect];
    const sign = value > 0 ? '+' : '';
    return `${effect}: ${sign}${(value * 100).toFixed(0)}%`;
  }).join('\n');
  
  alert(`${event.icon} ${event.name}\n\n${event.description}\n\nEffects:\n${effects}\n\nDuration: ${Math.ceil(event.effects.duration / (24 * 60 * 60 * 1000))} days`);
}

function showNewsAlert(event) {
  const effects = Object.keys(event.effects).filter(key => key !== 'duration').map(effect => {
    const value = event.effects[effect];
    const sign = value > 0 ? '+' : '';
    return `${effect}: ${sign}${(value * 100).toFixed(0)}%`;
  }).join('\n');
  
  alert(`${event.icon} BREAKING NEWS: ${event.name}\n\n${event.description}\n\nEffects:\n${effects}\n\nDuration: ${Math.ceil(event.effects.duration / (24 * 60 * 60 * 1000))} days`);
}

function showCrackdownAlert(event) {
  const effects = Object.keys(event.effects).filter(key => key !== 'duration').map(effect => {
    const value = event.effects[effect];
    const sign = value > 0 ? '+' : '';
    return `${effect}: ${sign}${(value * 100).toFixed(0)}%`;
  }).join('\n');
  
  alert(`🚨 POLICE CRACKDOWN: ${event.name}\n\n${event.description}\n\nEffects:\n${effects}\n\nDuration: ${Math.ceil(event.effects.duration / (24 * 60 * 60 * 1000))} days`);
}

// Check if an event is currently active
function isEventActive(eventId) {
  return activeEvents.some(event => event.id === eventId);
}

// Get combined effects from all active events and weather
function getActiveEffects() {
  let combinedEffects = { ...weatherEffects[currentWeather].effects };
  
  activeEvents.forEach(event => {
    Object.keys(event.effects).forEach(effect => {
      if (effect !== 'duration') {
        combinedEffects[effect] = (combinedEffects[effect] || 0) + event.effects[effect];
      }
    });
  });
  
  return combinedEffects;
}

// Clean up expired events
function cleanupExpiredEvents() {
  const currentTime = Date.now();
  const expiredEvents = activeEvents.filter(event => currentTime > event.endTime);
  
  expiredEvents.forEach(event => {
    logAction(`⏰ ${event.name} has ended. The city returns to its normal rhythm.`);
  });
  
  activeEvents = activeEvents.filter(event => currentTime <= event.endTime);
  player.activeEvents = activeEvents;
}

// Start event system timers
function startEventTimers() {
  // Weather changes every 15-45 minutes
  weatherTimer = setInterval(() => {
    if (!gameplayActive) return;
    changeWeather();
  }, (Math.random() * 30 + 15) * 60 * 1000);
  
  // News events check every 30 minutes
  newsTimer = setInterval(() => {
    if (!gameplayActive) return;
    triggerNewsEvent();
  }, 30 * 60 * 1000);
  
  // Seasonal events check every hour
  setInterval(() => {
    if (!gameplayActive) return;
    checkSeasonalEvents();
  }, 60 * 60 * 1000);
  
  // Police crackdowns check every 20 minutes
  setInterval(() => {
    if (!gameplayActive) return;
    triggerPoliceCrackdown();
  }, 20 * 60 * 1000);
  
  // Cleanup expired events every 5 minutes
  setInterval(() => {
    if (!gameplayActive) return;
    cleanupExpiredEvents();
  }, 5 * 60 * 1000);
  
  // Suspicion consequences check every 60 seconds
  setInterval(() => {
    if (!gameplayActive) return;
    checkSuspicionConsequences();
  }, 60 * 1000);
  
  // FBI investigation escalation check every 90 seconds
  setInterval(() => {
    if (!gameplayActive) return;
    checkFBIInvestigation();
  }, 90 * 1000);
}

// Function to show current events and weather status
function showEventsStatus() {
  hideAllScreens();
  document.getElementById("events-screen").style.display = "block";
  
  const weather = weatherEffects[currentWeather];
  const seasonName = currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1);
  const effects = getActiveEffects();
  
  let statusHTML = `
    <h2>🌍 City Status & Events</h2>
    
    <!-- Current Weather -->
    <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #3498db;">
      <h3 style="color: #3498db; margin-bottom: 15px;">${weather.icon} Current Weather: ${weather.name}</h3>
      <p style="margin-bottom: 10px;">${weather.description}</p>
      <p style="margin-bottom: 10px;"><strong>Season:</strong> ${seasonName}</p>
    </div>
    
    <!-- Active Events -->
    <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #e74c3c;">
      <h3 style="color: #e74c3c; margin-bottom: 15px;">📰 Active Events</h3>
  `;
  
  if (activeEvents.length === 0) {
    statusHTML += `<p style="color: #95a5a6;">No special events currently active.</p>`;
  } else {
    activeEvents.forEach(event => {
      const timeLeft = Math.max(0, event.endTime - Date.now());
      const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
      const typeColor = event.type === 'crackdown' ? '#e74c3c' : 
               event.type === 'news' ? '#f39c12' : '#2ecc71';
      
      statusHTML += `
        <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${typeColor};">
          <h4 style="color: ${typeColor}; margin-bottom: 8px;">${event.icon || '�'} ${event.name}</h4>
          <p style="margin-bottom: 8px;">${event.description}</p>
          <p style="color: #f39c12; margin: 0;"><strong>Time Left:</strong> ${hoursLeft} hour(s)</p>
        </div>
      `;
    });
  }
  
  statusHTML += `
    </div>
    
    <!-- Combined Effects Summary -->
    <div style="background: rgba(44, 62, 80, 0.8); padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #9b59b6;">
      <h3 style="color: #9b59b6; margin-bottom: 15px;">⚡ Current Effects Summary</h3>
  `;
  
  if (Object.keys(effects).length === 0 || Object.values(effects).every(value => value === 0)) {
    statusHTML += `<p style="color: #95a5a6;">No special effects currently active - standard operations apply.</p>`;
  } else {
    Object.keys(effects).forEach(effect => {
      const value = effects[effect];
      if (value !== 0) {
        const sign = value > 0 ? '+' : '';
        const color = value > 0 ? '#2ecc71' : '#e74c3c';
        statusHTML += `<p style="color: ${color}; margin: 5px 0;"><strong>${effect}:</strong> ${sign}${(value * 100).toFixed(0)}%</p>`;
      }
    });
  }
  
  statusHTML += `
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button onclick="triggerRandomWeatherChange()" style="background: #3498db; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🌦️ Check Weather Update
      </button>
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 18px 35px; 
              border: none; border-radius: 12px; font-size: 1.3em; font-weight: bold; cursor: pointer;
              transition: all 0.3s ease;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("events-content").innerHTML = statusHTML;
}

function triggerRandomWeatherChange() {
  // Randomly change weather with some probability
  if (Math.random() < 0.7) { // 70% chance of weather change
    changeWeather();
    logAction(`🌦️ The weather is shifting across the city...`);
    showEventsStatus(); // Refresh the screen
  } else {
    logAction(`🌤️ The weather remains stable for now.`);
  }
}

// ==================== END EVENT SYSTEM FUNCTIONS ====================

// Function to show mini games screen
function showMiniGames() {
  if (player.inJail) {
    alert("You can't access mini games while you're in jail!");
    return;
  }
  
  hideAllScreens();
  document.getElementById("mini-games-screen").style.display = "block";
  
  // Hide all individual game areas
  document.getElementById("minigame-tiktaktoe").style.display = "none";
  document.getElementById("other-minigames").style.display = "none";
  
  logAction("🎮 You step into the Criminal's Arcade. Time to test your skills in games that don't involve actual crimes!");
}

// Function to go back to mini games list
function backToMiniGamesList() {
  // Reset any active games
  if (currentMiniGame) {
    resetCurrentMiniGame();
  }
  
  // Hide all game areas and show main list
  document.getElementById("minigame-tiktaktoe").style.display = "none";
  document.getElementById("other-minigames").style.display = "none";
  
  // Scroll back to the top of the mini-games screen
  setTimeout(() => {
    document.getElementById("mini-games-screen").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  currentMiniGame = null;
}

// Function to reset current mini game
function resetCurrentMiniGame() {
  switch(currentMiniGame) {
    case 'tiktaktoe':
      mgResetTikTakToe();
      break;
    case 'number-guessing':
      // Reset number guessing
      break;
    case 'rps':
      rpsPlayerScore = 0;
      rpsAIScore = 0;
      rpsRoundsPlayed = 0;
      break;
    case 'memory':
      memoryCards = [];
      memoryFlippedCards = [];
      memoryMatchedPairs = 0;
      if (window.memoryTimerInterval) {
        clearInterval(window.memoryTimerInterval);
        window.memoryTimerInterval = null;
      }
      break;
    case 'snake':
      if (snakeGame) {
        clearInterval(snakeGame.gameLoop);
        // Clean up event listeners
        document.removeEventListener('keydown', handleSnakeControls);
        if (snakeGame.canvas) {
          snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
          snakeGame.canvas.removeEventListener('mouseenter', () => snakeGame.mouseInCanvas = true);
          snakeGame.canvas.removeEventListener('mouseleave', () => snakeGame.mouseInCanvas = false);
        }
        snakeGame = null;
      }
      break;
    case 'quick-draw':
      quickDrawWaiting = false;
      break;
  }
}

// TikTakToe Mini Game Functions (Modified for Mini Games Screen)
function startMiniGameTikTakToe() {
  currentMiniGame = 'tiktaktoe';
  document.getElementById("minigame-tiktaktoe").style.display = "block";
  mgResetTikTakToe();
  
  // Scroll to the game area
  setTimeout(() => {
    document.getElementById("minigame-tiktaktoe").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  logAction("🎯 You sit down for a strategic game of TikTakToe. Time to prove your tactical superiority!");
}

function mgStartTikTakToe() {
  mgTikTakToeBoard = ['', '', '', '', '', '', '', '', ''];
  mgTikTakToeCurrentPlayer = 'X';
  mgTikTakToeGameActive = true;
  
  document.getElementById('mg-tiktaktoe-start').style.display = 'none';
  document.getElementById('mg-tiktaktoe-game').style.display = 'block';
  
  mgUpdateTikTakToeDisplay();
  
  const cells = document.querySelectorAll('.mg-tiktaktoe-cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#34495e';
  });
}

function mgMakeMove(cellIndex) {
  if (!mgTikTakToeGameActive || mgTikTakToeBoard[cellIndex] !== '') {
    return;
  }
  
  mgTikTakToeBoard[cellIndex] = 'X';
  const cell = document.querySelectorAll('.mg-tiktaktoe-cell')[cellIndex];
  cell.textContent = 'X';
  cell.style.color = '#2ecc71';
  cell.disabled = true;
  
  const result = mgCheckTikTakToeWinner();
  if (result) {
    mgEndTikTakToeGame(result);
    return;
  }
  
  mgTikTakToeCurrentPlayer = 'O';
  mgUpdateTikTakToeDisplay();
  
  setTimeout(() => {
    mgMakeAIMove();
  }, 500);
}

function mgMakeAIMove() {
  if (!mgTikTakToeGameActive) return;
  
  let aiMove = mgFindBestAIMove();
  
  if (aiMove !== -1) {
    mgTikTakToeBoard[aiMove] = 'O';
    const cell = document.querySelectorAll('.mg-tiktaktoe-cell')[aiMove];
    cell.textContent = 'O';
    cell.style.color = '#e74c3c';
    cell.disabled = true;
    
    const result = mgCheckTikTakToeWinner();
    if (result) {
      mgEndTikTakToeGame(result);
      return;
    }
    
    mgTikTakToeCurrentPlayer = 'X';
    mgUpdateTikTakToeDisplay();
  }
}

function mgFindBestAIMove() {
  // Same AI logic as before
  for (let i = 0; i < 9; i++) {
    if (mgTikTakToeBoard[i] === '') {
      mgTikTakToeBoard[i] = 'O';
      if (mgCheckWinningMove('O')) {
        mgTikTakToeBoard[i] = '';
        return i;
      }
      mgTikTakToeBoard[i] = '';
    }
  }
  
  for (let i = 0; i < 9; i++) {
    if (mgTikTakToeBoard[i] === '') {
      mgTikTakToeBoard[i] = 'X';
      if (mgCheckWinningMove('X')) {
        mgTikTakToeBoard[i] = '';
        return i;
      }
      mgTikTakToeBoard[i] = '';
    }
  }
  
  if (mgTikTakToeBoard[4] === '') {
    return 4;
  }
  
  const corners = [0, 2, 6, 8];
  for (let corner of corners) {
    if (mgTikTakToeBoard[corner] === '') {
      return corner;
    }
  }
  
  for (let i = 0; i < 9; i++) {
    if (mgTikTakToeBoard[i] === '') {
      return i;
    }
  }
  
  return -1;
}

function mgCheckWinningMove(player) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  return winPatterns.some(pattern => 
    pattern.every(index => mgTikTakToeBoard[index] === player)
  );
}

function mgCheckTikTakToeWinner() {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (mgTikTakToeBoard[a] && 
      mgTikTakToeBoard[a] === mgTikTakToeBoard[b] && 
      mgTikTakToeBoard[a] === mgTikTakToeBoard[c]) {
      return mgTikTakToeBoard[a];
    }
  }
  
  if (mgTikTakToeBoard.every(cell => cell !== '')) {
    return 'tie';
  }
  
  return null;
}

function mgEndTikTakToeGame(result) {
  mgTikTakToeGameActive = false;
  
  let message = '';
  
  if (result === 'X') {
    // Player wins
    player.money += 100;
    gainExperience('intelligence', 50);
    
    // Track statistics
    updateStatistic('miniGamesWon');
    updateStatistic('totalMoneyEarned', 100);
    
    updateUI();
    message = `🎉 Victory! You've proven your strategic superiority and earned $100! Your mind is as sharp as your criminal instincts! (Intelligence +50 XP)`;
    logAction(`🏆 TikTakToe victory! Your strategic thinking pays off with $100 earned and increased Intelligence.`);
  } else if (result === 'O') {
    message = `😔 Defeat! The AI outmaneuvered you this time. Even master criminals can learn from failure.`;
    logAction(`💭 TikTakToe defeat! The AI proves its worth, but every loss is a lesson learned.`);
  } else {
    message = `🤝 Stalemate! Neither player could claim victory. A battle of equals!`;
    logAction(`🤝 TikTakToe stalemate! Sometimes the greatest victories are knowing when to call it even.`);
  }
  
  alert(message);
  
  const cells = document.querySelectorAll('.mg-tiktaktoe-cell');
  cells.forEach(cell => {
    cell.disabled = true;
  });
  
  setTimeout(() => {
    mgResetTikTakToe();
  }, 3000);
}

function mgUpdateTikTakToeDisplay() {
  const currentPlayerElement = document.getElementById('mg-current-player');
  const gameStatusElement = document.getElementById('mg-game-status');
  
  if (mgTikTakToeCurrentPlayer === 'X') {
    currentPlayerElement.textContent = 'Your turn (X)';
    currentPlayerElement.style.color = '#2ecc71';
    gameStatusElement.textContent = 'Make your move!';
  } else {
    currentPlayerElement.textContent = 'AI\'s turn (O)';
    currentPlayerElement.style.color = '#e74c3c';
    gameStatusElement.textContent = 'AI is thinking...';
  }
}

function mgQuitTikTakToe() {
  mgResetTikTakToe();
}

function mgResetTikTakToe() {
  mgTikTakToeGameActive = false;
  mgTikTakToeBoard = ['', '', '', '', '', '', '', '', ''];
  mgTikTakToeCurrentPlayer = 'X';
  
  document.getElementById('mg-tiktaktoe-start').style.display = 'block';
  document.getElementById('mg-tiktaktoe-game').style.display = 'none';
  
  const cells = document.querySelectorAll('.mg-tiktaktoe-cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#34495e';
    cell.style.color = 'white';
  });
}

// Number Guessing Game
function startNumberGuessing() {
  currentMiniGame = 'number-guessing';
  document.getElementById("other-minigames").style.display = "block";
  
  numberGuessingTarget = Math.floor(Math.random() * 100) + 1;
  numberGuessingAttempts = 0;
  
  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #2ecc71; text-align: center; margin-bottom: 20px;">🔢 Number Hunter</h3>
    <div style="text-align: center;">
      <p style="font-size: 1.2em; margin-bottom: 20px;">I'm thinking of a number between 1 and 100!</p>
      <p>Attempts: <span id="guess-attempts">0</span></p>
      <div style="margin: 20px 0;">
        <input type="number" id="guess-input" min="1" max="100" placeholder="Enter your guess..." 
            style="padding: 10px; font-size: 16px; border-radius: 5px; border: 2px solid #2ecc71; width: 150px; text-align: center;"
            onkeypress="if(event.key==='Enter') makeGuess()">
        <button onclick="makeGuess()" style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
          Guess!
        </button>
      </div>
      <div id="guess-feedback" style="font-size: 1.1em; margin-top: 20px; min-height: 30px;"></div>
    </div>
  `;
  
  // Scroll to the game area and focus input
  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    document.getElementById("guess-input").focus();
  }, 100);
  
  logAction("🔢 You challenge yourself to a game of Number Hunter. Can your intuition guide you to victory?");
}

function makeGuess() {
  const input = document.getElementById('guess-input');
  const guess = parseInt(input.value);
  
  if (isNaN(guess) || guess < 1 || guess > 100) {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #e74c3c;">Please enter a number between 1 and 100!</span>';
    return;
  }
  
  numberGuessingAttempts++;
  document.getElementById('guess-attempts').textContent = numberGuessingAttempts;
  
  if (guess === numberGuessingTarget) {
    // Scale reward with player level
    const baseReward = 100 + (player.level * 50);
    const attemptBonus = Math.max(0, (10 - numberGuessingAttempts) * Math.floor(baseReward * 0.1));
    const totalReward = baseReward + attemptBonus;
    player.money += totalReward;
    gainExperience('luck', 50);
    
    // Track statistics
    updateStatistic('miniGamesWon');
    updateStatistic('totalMoneyEarned', totalReward);
    
    updateUI();
    document.getElementById('guess-feedback').innerHTML = `<span style="color: #2ecc71;">🎉 Correct! You found ${numberGuessingTarget} in ${numberGuessingAttempts} attempts and earned $${totalReward.toLocaleString()}! (Luck +50 XP)</span>`;
    logAction(`🎯 Number Hunter victory! Found the target ${numberGuessingTarget} in ${numberGuessingAttempts} attempts and earned $${totalReward.toLocaleString()}. Your intuition is razor-sharp. (Luck +50 XP)`);
    setTimeout(() => startNumberGuessing(), 3000);
  } else if (guess < numberGuessingTarget) {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #f39c12;">📈 Too low! Go higher!</span>';
  } else {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #f39c12;">📉 Too high! Go lower!</span>';
  }
  
  input.value = '';
  input.focus();
}

// Rock Paper Scissors
function startRockPaperScissors() {
  currentMiniGame = 'rps';
  document.getElementById("other-minigames").style.display = "block";
  
  rpsPlayerScore = 0;
  rpsAIScore = 0;
  rpsRoundsPlayed = 0;
  
  updateRPSDisplay();
  
  // Scroll to the game area
  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  logAction("✂️ You challenge the AI to Rock Paper Scissors. Best of 5 rounds - may the best strategist win!");
}

function updateRPSDisplay() {
  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #e74c3c; text-align: center; margin-bottom: 20px;">✂️ Rock Paper Scissors</h3>
    <div style="text-align: center;">
      <p style="font-size: 1.2em; margin-bottom: 20px;">Best of 5 Rounds</p>
      <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        <div>
          <h4>You</h4>
          <p style="font-size: 2em;">${rpsPlayerScore}</p>
        </div>
        <div>
          <h4>Round</h4>
          <p style="font-size: 1.5em;">${rpsRoundsPlayed + 1}/5</p>
        </div>
        <div>
          <h4>AI</h4>
          <p style="font-size: 2em;">${rpsAIScore}</p>
        </div>
      </div>
      ${rpsPlayerScore < 3 && rpsAIScore < 3 ? `
        <div style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
          <button onclick="playRPS('rock')" style="background: #95a5a6; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            🪨 Rock
          </button>
          <button onclick="playRPS('paper')" style="background: #3498db; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            📄 Paper
          </button>
          <button onclick="playRPS('scissors')" style="background: #e74c3c; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            ✂️ Scissors
          </button>
        </div>
      ` : `
        <div style="margin: 30px 0;">
          <h3>${rpsPlayerScore > rpsAIScore ? '🎉 You Won the Match! +$' + (100 + (player.level * 50)).toLocaleString() : '😔 AI Won the Match!'}</h3>
          <button onclick="startRockPaperScissors()" style="background: #2ecc71; color: white; padding: 15px 25px; border: none; border-radius: 8px; cursor: pointer; margin-top: 15px;">
            Play Again
          </button>
        </div>
      `}
      <div id="rps-result" style="font-size: 1.2em; margin-top: 20px; min-height: 40px;"></div>
    </div>
  `;
}

function playRPS(playerChoice) {
  const choices = ['rock', 'paper', 'scissors'];
  const aiChoice = choices[Math.floor(Math.random() * 3)];
  
  const choiceEmojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
  
  let result = '';
  if (playerChoice === aiChoice) {
    result = `Tie! Both chose ${choiceEmojis[playerChoice]}`;
  } else if (
    (playerChoice === 'rock' && aiChoice === 'scissors') ||
    (playerChoice === 'paper' && aiChoice === 'rock') ||
    (playerChoice === 'scissors' && aiChoice === 'paper')
  ) {
    result = `You win! ${choiceEmojis[playerChoice]} beats ${choiceEmojis[aiChoice]}`;
    rpsPlayerScore++;
  } else {
    result = `AI wins! ${choiceEmojis[aiChoice]} beats ${choiceEmojis[playerChoice]}`;
    rpsAIScore++;
  }
  
  document.getElementById('rps-result').innerHTML = result;
  rpsRoundsPlayed++;
  
  setTimeout(() => {
    updateRPSDisplay();
    if (rpsPlayerScore >= 3) {
      const rpsReward = 100 + (player.level * 50);
      player.money += rpsReward;
      gainExperience('charisma', 50);
      updateUI();
      logAction(`🏆 Rock Paper Scissors champion! Your tactical mind proves superior in this classic game of psychology and earned $${rpsReward.toLocaleString()}. (Charisma +50 XP)`);
    } else if (rpsAIScore >= 3) {
      logAction("💔 The AI outplays you in Rock Paper Scissors. Sometimes the algorithms know best.");
    }
  }, 1500);
}

// Memory Match Game
function startMemoryMatch() {
  if (!canPlayMiniGame('memory')) return;
  
  currentMiniGame = 'memory';
  document.getElementById("other-minigames").style.display = "block";
  
  const symbols = ['🎯', '💰', '🔫', '🚗', '💎', '🎰', '🔓', '⚡'];
  memoryCards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  memoryFlippedCards = [];
  memoryMatchedPairs = 0;
  memoryStartTime = Date.now();
  
  const bestTimeText = memoryPersonalBest ? `Personal Best: ${memoryPersonalBest}s` : 'No personal best yet';
  
  let cardHTML = '<h3 style="color: #f39c12; text-align: center; margin-bottom: 20px;">🧠 Memory Match</h3>';
  cardHTML += '<p style="text-align: center; margin-bottom: 10px;">Find all pairs in under 60s for $100! Beat your best time for $500!</p>';
  cardHTML += '<p style="text-align: center; margin-bottom: 5px; color: #9b59b6; font-weight: bold;">🥷 Rewards: Stealth & Planning XP boost</p>';
  cardHTML += `<p style="text-align: center; margin-bottom: 10px; color: #f39c12; font-weight: bold;">${bestTimeText}</p>`;
  cardHTML += '<p style="text-align: center; margin-bottom: 20px;">Time: <span id="memory-timer" style="color: #e74c3c; font-weight: bold;">60</span>s | Pairs: <span id="memory-score">0</span>/8</p>';
  cardHTML += '<div style="display: grid; grid-template-columns: repeat(4, 80px); gap: 10px; justify-content: center; margin: 20px auto;">';
  
  for (let i = 0; i < 16; i++) {
    cardHTML += `
      <button id="memory-card-${i}" onclick="flipMemoryCard(${i})" 
          style="width: 80px; height: 80px; font-size: 32px; background: #34495e; color: white; 
              border: 2px solid #7f8c8d; border-radius: 8px; cursor: pointer;">
        ?
      </button>
    `;
  }
  
  cardHTML += '</div>';
  
  document.getElementById("minigame-content").innerHTML = cardHTML;
  
  // Start timer
  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - memoryStartTime) / 1000);
    const remaining = Math.max(0, 60 - elapsed);
    document.getElementById('memory-timer').textContent = remaining;
    
    if (remaining <= 0 && memoryMatchedPairs < 8) {
      clearInterval(timerInterval);
      alert('⏰ Time\'s up! Try again for the bonuses.');
      logAction("⏰ Memory Match: Time ran out! Practice makes perfect in the criminal mind game.");
      setTimeout(() => startMemoryMatch(), 2000);
    }
  }, 1000);
  
  // Store timer interval for cleanup
  window.memoryTimerInterval = timerInterval;
  
  // Scroll to the game area
  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  logAction("🧠 You test your memory with a challenging card matching game. Beat the clock and your records for maximum rewards!");
}

function flipMemoryCard(index) {
  if (memoryFlippedCards.length >= 2 || memoryFlippedCards.includes(index)) return;
  
  const card = document.getElementById(`memory-card-${index}`);
  card.textContent = memoryCards[index];
  card.style.background = '#3498db';
  card.disabled = true;
  
  memoryFlippedCards.push(index);
  
  if (memoryFlippedCards.length === 2) {
    setTimeout(() => {
      const [first, second] = memoryFlippedCards;
      if (memoryCards[first] === memoryCards[second]) {
        // Match found
        memoryMatchedPairs++;
        document.getElementById('memory-score').textContent = memoryMatchedPairs;
        
        if (memoryMatchedPairs === 8) {
          // Clear timer
          if (window.memoryTimerInterval) {
            clearInterval(window.memoryTimerInterval);
          }
          
          const totalTime = Math.floor((Date.now() - memoryStartTime) / 1000);
          let bonusMessage = '';
          let earnedTimeBonus = false;
          let earnedPersonalBest = false;
          let totalEarned = 0;
          
          // Scale memory match rewards with player level
          const memoryBaseReward = 200 + (player.level * 100);
          
          // Check for personal best
          if (memoryPersonalBest === null || totalTime < memoryPersonalBest) {
            memoryPersonalBest = totalTime;
            earnedPersonalBest = true;
            const bestBonus = Math.floor(memoryBaseReward * 2.5);
            totalEarned += bestBonus;
            player.money += bestBonus;
          }
          
          // Check for time bonus
          if (totalTime <= 60) {
            earnedTimeBonus = true;
            totalEarned += memoryBaseReward;
            player.money += memoryBaseReward;
          }
          
          // Grant skill XP bonuses for memory/planning (XP only, not direct skill tree levels)
          gainExperience('stealth', totalTime <= 40 ? 60 : (totalTime <= 60 ? 40 : 20));
          gainExperience('intelligence', totalTime <= 40 ? 60 : (totalTime <= 60 ? 40 : 20));
          
          gainExperience('intelligence', 50);

          if (totalEarned > 0) {
            updateUI();
          }
          
          trackMiniGamePlay('memory');
          
          // Create bonus message
          if (earnedPersonalBest && earnedTimeBonus) {
            bonusMessage = ` 🏆 NEW PERSONAL BEST! You earned $600 total ($500 + $100)!`;
            logAction(`🏆 Memory Match master! New personal best of ${totalTime}s under the time limit, earning you $600 total + Stealth/Planning XP for exceptional memory skills!`);
          } else if (earnedPersonalBest) {
            bonusMessage = ` 🏆 NEW PERSONAL BEST! You earned $500!`;
            logAction(`🏆 Memory Match: New personal best of ${totalTime}s! Your improving memory earned you $500!`);
          } else if (earnedTimeBonus) {
            bonusMessage = ` You completed it in time and earned $100!`;
            logAction(`🏆 Memory Match completed in ${totalTime}s under the time limit, earning you $100 + Stealth/Planning XP for your sharp criminal intellect!`);
          } else {
            logAction(`🧠 Memory Match completed in ${totalTime}s. Good memory, but you needed to be faster for bonuses.`);
          }
          
          alert(`🎉 All pairs found in ${totalTime} seconds!${bonusMessage}\nPersonal Best: ${memoryPersonalBest}s`);
          setTimeout(() => startMemoryMatch(), 2000);
        }
      } else {
        // No match, flip back
        document.getElementById(`memory-card-${first}`).textContent = '?';
        document.getElementById(`memory-card-${first}`).style.background = '#34495e';
        document.getElementById(`memory-card-${first}`).disabled = false;
        document.getElementById(`memory-card-${second}`).textContent = '?';
        document.getElementById(`memory-card-${second}`).style.background = '#34495e';
        document.getElementById(`memory-card-${second}`).disabled = false;
      }
      memoryFlippedCards = [];
    }, 1000);
  }
}

// Snake Game
function startSnakeGame() {
  if (!canPlayMiniGame('snake')) return;
  
  currentMiniGame = 'snake';
  document.getElementById("other-minigames").style.display = "block";
  
  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #9b59b6; text-align: center; margin-bottom: 20px;">🐍 Snake</h3>
    <div style="text-align: center;">
      <p style="margin-bottom: 5px; color: #27ae60; font-weight: bold;">💪 Rewards: Stamina & Endurance boost</p>
      <p>Score: <span id="snake-score">0</span></p>
      <canvas id="snake-canvas" width="400" height="400" 
          style="border: 2px solid #9b59b6; background: #2c3e50; margin: 20px auto; display: block; cursor: crosshair;"></canvas>
      <p style="margin-top: 10px; color: #ecf0f1;">
        <strong>Controls:</strong> Use WASD keys or move your mouse in the canvas to start and guide the snake<br>
        <small>W = Up, A = Left, S = Down, D = Right | Game starts when you give input</small>
      </p>
      <button onclick="restartSnake()" style="background: #9b59b6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
        Restart Game
      </button>
    </div>
  `;
  
  // Scroll to the game area
  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  initSnakeGame();
  logAction("🐍 You start a classic game of Snake. Precision and planning will keep you alive and growing!");
}

function initSnakeGame() {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');
  
  // Clean up any existing event listeners
  document.removeEventListener('keydown', handleSnakeControls);
  
  snakeGame = {
    canvas: canvas,
    ctx: ctx,
    gridSize: 20,
    snake: [{x: 200, y: 200}],
    direction: {x: 0, y: 0},
    food: {x: 0, y: 0},
    score: 0,
    gameLoop: null,
    mousePos: {x: 0, y: 0},
    lastDirection: {x: 0, y: 0},
    gameStarted: false
  };
  
  generateFood();
  drawSnake(); // Initial draw
  
  // Controls - WASD keys
  document.addEventListener('keydown', handleSnakeControls);
  
  // Mouse controls
  canvas.addEventListener('mousemove', handleSnakeMouseMove);
  canvas.addEventListener('mouseenter', () => snakeGame.mouseInCanvas = true);
  canvas.addEventListener('mouseleave', () => snakeGame.mouseInCanvas = false);
  
  // Don't start the game loop until player gives input
}

function generateFood() {
  snakeGame.food = {
    x: Math.floor(Math.random() * (snakeGame.canvas.width / snakeGame.gridSize)) * snakeGame.gridSize,
    y: Math.floor(Math.random() * (snakeGame.canvas.height / snakeGame.gridSize)) * snakeGame.gridSize
  };
}

function handleSnakeControls(e) {
  if (currentMiniGame !== 'snake') return;
  
  let newDirection = null;
  
  switch(e.key.toLowerCase()) {
    case 'w':
      if (snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: -snakeGame.gridSize};
      }
      break;
    case 's':
      if (snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: snakeGame.gridSize};
      }
      break;
    case 'a':
      if (snakeGame.direction.x === 0) {
        newDirection = {x: -snakeGame.gridSize, y: 0};
      }
      break;
    case 'd':
      if (snakeGame.direction.x === 0) {
        newDirection = {x: snakeGame.gridSize, y: 0};
      }
      break;
  }
  
  if (newDirection) {
    snakeGame.direction = newDirection;
    snakeGame.lastDirection = newDirection;
    
    // Start the game loop if it hasn't started yet
    if (!snakeGame.gameStarted) {
      snakeGame.gameStarted = true;
      snakeGame.gameLoop = setInterval(updateSnake, 150);
    }
  }
}

function handleSnakeMouseMove(e) {
  if (currentMiniGame !== 'snake') return;
  
  const rect = snakeGame.canvas.getBoundingClientRect();
  snakeGame.mousePos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  // Only change direction if mouse is inside canvas and snake is moving
  if (snakeGame.mouseInCanvas && (snakeGame.direction.x !== 0 || snakeGame.direction.y !== 0 || !snakeGame.gameStarted)) {
    const head = snakeGame.snake[0];
    const deltaX = snakeGame.mousePos.x - (head.x + snakeGame.gridSize / 2);
    const deltaY = snakeGame.mousePos.y - (head.y + snakeGame.gridSize / 2);
    
    let newDirection = null;
    
    // Determine dominant direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement
      if (deltaX > 0 && snakeGame.direction.x === 0) {
        newDirection = {x: snakeGame.gridSize, y: 0};
      } else if (deltaX < 0 && snakeGame.direction.x === 0) {
        newDirection = {x: -snakeGame.gridSize, y: 0};
      }
    } else {
      // Vertical movement
      if (deltaY > 0 && snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: snakeGame.gridSize};
      } else if (deltaY < 0 && snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: -snakeGame.gridSize};
      }
    }
    
    if (newDirection) {
      snakeGame.direction = newDirection;
      
      // Start the game loop if it hasn't started yet
      if (!snakeGame.gameStarted) {
        snakeGame.gameStarted = true;
        snakeGame.gameLoop = setInterval(updateSnake, 150);
      }
    }
  }
}

function updateSnake() {
  const head = {x: snakeGame.snake[0].x + snakeGame.direction.x, y: snakeGame.snake[0].y + snakeGame.direction.y};
  
  // Check wall collision
  if (head.x < 0 || head.x >= snakeGame.canvas.width || head.y < 0 || head.y >= snakeGame.canvas.height) {
    gameOverSnake();
    return;
  }
  
  // Check self collision
  for (let segment of snakeGame.snake) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOverSnake();
      return;
    }
  }
  
  snakeGame.snake.unshift(head);
  
  // Check food collision
  if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
    snakeGame.score++;
    document.getElementById('snake-score').textContent = snakeGame.score;
    generateFood();
  } else {
    snakeGame.snake.pop();
  }
  
  drawSnake();
}

function drawSnake() {
  snakeGame.ctx.clearRect(0, 0, snakeGame.canvas.width, snakeGame.canvas.height);
  
  // Draw snake
  snakeGame.ctx.fillStyle = '#2ecc71';
  for (let segment of snakeGame.snake) {
    snakeGame.ctx.fillRect(segment.x, segment.y, snakeGame.gridSize, snakeGame.gridSize);
  }
  
  // Draw food
  snakeGame.ctx.fillStyle = '#e74c3c';
  snakeGame.ctx.fillRect(snakeGame.food.x, snakeGame.food.y, snakeGame.gridSize, snakeGame.gridSize);
}

function gameOverSnake() {
  clearInterval(snakeGame.gameLoop);
  
  // Clean up event listeners
  document.removeEventListener('keydown', handleSnakeControls);
  if (snakeGame.canvas) {
    snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
    snakeGame.canvas.removeEventListener('mouseenter', () => snakeGame.mouseInCanvas = true);
    snakeGame.canvas.removeEventListener('mouseleave', () => snakeGame.mouseInCanvas = false);
  }
  
  // Scale reward with player level: $50 base per food + level bonus
  const perFoodReward = 50 + (player.level * 25);
  let earnings = snakeGame.score * perFoodReward;
  let bonusMessage = '';
  
  // Grant stamina/endurance boost based on score (capped, diminishing returns)
  const staminaBonus = Math.min(2, Math.floor(snakeGame.score / 5));
  if (!player.maxEnergy) player.maxEnergy = 100;
  player.maxEnergy = Math.min(120, player.maxEnergy + staminaBonus);
  
  const enduranceXP = Math.floor(snakeGame.score * 2);
  if (enduranceXP > 0) {
    gainExperience('endurance', enduranceXP);
  }

  if (snakeGame.score > 0) {
    player.money += earnings;
    updateUI();
    bonusMessage = ` You earned $${earnings.toLocaleString()} ($${perFoodReward} per food)${staminaBonus > 0 ? ` + ${staminaBonus} max energy` : ''}! (Endurance +${enduranceXP} XP)`;
    logAction(`🐍 Snake game over! Final score: ${snakeGame.score}. Your reflexes earned you $${earnings.toLocaleString()}${staminaBonus > 0 ? ' + stamina boost' : ''}! (Endurance +${enduranceXP} XP)`);
  } else {
    logAction(`🐍 Snake game over! Final score: ${snakeGame.score}. Your reflexes were tested and measured.`);
  }
  
  trackMiniGamePlay('snake');
  
  alert(`Game Over! Final Score: ${snakeGame.score}${bonusMessage}`);
}

function restartSnake() {
  if (snakeGame && snakeGame.gameLoop) {
    clearInterval(snakeGame.gameLoop);
    // Clean up event listeners
    document.removeEventListener('keydown', handleSnakeControls);
    if (snakeGame.canvas) {
      snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
      snakeGame.canvas.removeEventListener('mouseenter', () => snakeGame.mouseInCanvas = true);
      snakeGame.canvas.removeEventListener('mouseleave', () => snakeGame.mouseInCanvas = false);
    }
  }
  initSnakeGame();
}

// Quick Draw Reaction Game
function startQuickDraw() {
  if (!canPlayMiniGame('quickDraw')) return;
  
  currentMiniGame = 'quick-draw';
  document.getElementById("other-minigames").style.display = "block";
  
  const bestTimeText = quickDrawPersonalBest ? `Personal Best: ${quickDrawPersonalBest}ms` : 'No personal best yet';
  
  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #1abc9c; text-align: center; margin-bottom: 20px;">⚡ Quick Draw</h3>
    <div style="text-align: center;">
      <p style="margin-bottom: 10px;">React under 300ms for cash | Beat your best time for bonus!</p>
      <p style="margin-bottom: 5px; color: #8b0000; font-weight: bold;">🔫 Rewards: Combat Reflex boost (better violent job success)</p>
      <p style="margin-bottom: 20px; color: #f39c12; font-weight: bold;">${bestTimeText}</p>
      <div id="reaction-area" onclick="handleReactionClick()" 
         style="width: 300px; height: 200px; margin: 20px auto; border: 3px solid #1abc9c; 
            border-radius: 10px; background: #e74c3c; display: flex; align-items: center; 
            justify-content: center; cursor: pointer; font-size: 24px; color: white;">
        Click when GREEN!
      </div>
      <p id="reaction-instruction">Wait for the area to turn green, then click as fast as you can!</p>
      <p id="reaction-result" style="font-size: 1.2em; margin-top: 20px; min-height: 30px;"></p>
      <button onclick="startReactionTest()" style="background: #1abc9c; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">
        Start Test
      </button>
    </div>
  `;
  
  // Scroll to the game area
  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
  
  logAction("⚡ You prepare for a Quick Draw test. Lightning reflexes and personal records await the truly skilled!");
}

function startReactionTest() {
  const area = document.getElementById('reaction-area');
  const instruction = document.getElementById('reaction-instruction');
  const result = document.getElementById('reaction-result');
  
  quickDrawWaiting = false;
  area.style.background = '#e74c3c';
  area.textContent = 'Wait...';
  instruction.textContent = 'Get ready...';
  result.textContent = '';
  
  // Random delay between 1-5 seconds
  const delay = Math.random() * 4000 + 1000;
  
  setTimeout(() => {
    if (currentMiniGame === 'quick-draw') {
      area.style.background = '#2ecc71';
      area.textContent = 'CLICK NOW!';
      instruction.textContent = 'CLICK THE GREEN AREA!';
      quickDrawStartTime = Date.now();
      quickDrawWaiting = true;
    }
  }, delay);
}

function handleReactionClick() {
  if (!quickDrawWaiting) {
    document.getElementById('reaction-result').innerHTML = '<span style="color: #e74c3c;">Too early! Wait for green!</span>';
    return;
  }
  
  const reactionTime = Date.now() - quickDrawStartTime;
  quickDrawWaiting = false;
  
  const area = document.getElementById('reaction-area');
  area.style.background = '#95a5a6';
  area.textContent = 'Click when GREEN!';
  
  let message = '';
  let color = '';
  let earnedMoney = false;
  let personalBestBonus = false;
  let totalEarned = 0;
  
  // Scale quick draw rewards with player level
  const qdBaseReward = 100 + (player.level * 50);
  
  // Check for personal best
  if (quickDrawPersonalBest === null || reactionTime < quickDrawPersonalBest) {
    quickDrawPersonalBest = reactionTime;
    personalBestBonus = true;
    const bestBonus = Math.floor(qdBaseReward * 3);
    totalEarned += bestBonus;
    player.money += bestBonus;
  }
  
  // Check for time-based reward
  if (reactionTime < 300) {
    earnedMoney = true;
    totalEarned += qdBaseReward;
    player.money += qdBaseReward;
    
    if (reactionTime < 200) {
      message = '🚀 Lightning fast!';
      color = '#2ecc71';
    } else {
      message = '⚡ Excellent reflexes!';
      color = '#3498db';
    }
  } else if (reactionTime < 500) {
    message = '👍 Good reaction time!';
    color = '#f39c12';
  } else {
    message = '🐌 Could be faster...';
    color = '#e74c3c';
  }
  
  // Grant combat reflex bonus (improves violent job success)
  if (!player.combatReflexBonus) player.combatReflexBonus = 0;
  const reflexBonus = reactionTime < 200 ? 3 : (reactionTime < 300 ? 2 : 1);
  player.combatReflexBonus = Math.min(20, player.combatReflexBonus + reflexBonus);
  
  if (reactionTime < 500) {
    gainExperience('violence', 50);
  }

  if (totalEarned > 0) {
    updateUI();
  }
  
  trackMiniGamePlay('quickDraw');
  
  let bonusText = '';
  if (personalBestBonus && earnedMoney) {
    bonusText = `<br><span style="color: #2ecc71;">🏆 NEW PERSONAL BEST! +$500!</span><br><span style="color: #2ecc71;">⚡ Sub-300ms reflexes! +$100!</span><br><span style="color: #f1c40f;">Total earned: $${totalEarned}</span><br><span style="color: #e74c3c;">Violence +50 XP</span>`;
  } else if (personalBestBonus) {
    bonusText = `<br><span style="color: #2ecc71;">🏆 NEW PERSONAL BEST! +$500!</span><br><span style="color: #e74c3c;">Violence +50 XP</span>`;
  } else if (earnedMoney) {
    bonusText = `<br><span style="color: #2ecc71;">⚡ Sub-300ms reflexes! +$100!</span><br><span style="color: #e74c3c;">Violence +50 XP</span>`;
  }
  
  document.getElementById('reaction-result').innerHTML = 
    `<span style="color: ${color};">${message}</span><br>Reaction Time: ${reactionTime}ms<br>Personal Best: ${quickDrawPersonalBest}ms${bonusText}`;
  
  // Log the result
  if (personalBestBonus && earnedMoney) {
    logAction(`⚡ Quick Draw: ${reactionTime}ms - NEW PERSONAL BEST! Lightning reflexes earned you $600 total + Combat Reflex boost! (Violence +50 XP)`);
  } else if (personalBestBonus) {
    logAction(`⚡ Quick Draw: ${reactionTime}ms - NEW PERSONAL BEST! You earned $500 + Combat Reflex boost! (Violence +50 XP)`);
  } else if (earnedMoney) {
    logAction(`⚡ Quick Draw: ${reactionTime}ms - Sub-300ms reflexes earned you $100 + Combat Reflex boost! (Violence +50 XP)`);
  } else {
    logAction(`⚡ Quick Draw: ${reactionTime}ms - ${message.replace(/[🚀⚡👍🐌]/g, '').trim()} Combat Reflex improved slightly.`);
  }
}

// ==================== PROGRESSIVE UNLOCK SYSTEM ====================
// Menu items unlock as the player progresses, reducing initial overwhelm

const menuUnlockConfig = [
  // === ALWAYS AVAILABLE (Level 0) ===
  { id: 'jobs',        fn: 'showJobs()',              label: 'Jobs',           tip: 'Complete tasks for cash & XP',     level: 0 },
  { id: 'store',       fn: 'showStore()',             label: 'Black Market',   tip: 'Buy weapons, armor & supplies',    level: 0 },
  { id: 'inventory',   fn: 'showInventory()',         label: 'Stash',          tip: 'View & equip your items',          level: 0 },
  { id: 'hospital',    fn: 'showHospital()',          label: 'The Doctor',     tip: 'Heal your injuries',               level: 0 },
  { id: 'options',     fn: 'showOptions()',           label: 'Settings',       tip: 'Save, load & game options',        level: 0 },

  // === EARLY GAME (Level 2-3) ===
  { id: 'skills',      fn: 'showSkills()',            label: 'Expertise',      tip: 'Spend skill points & upgrade',     level: 2 },
  { id: 'playerstats', fn: 'showPlayerStats()',       label: 'Player Stats',   tip: 'View your current stats & bonuses', level: 2 },
  { id: 'cars',        fn: 'showStolenCars()',        label: 'Motor Pool',     tip: 'Manage your stolen vehicles',      level: 2 },
  { id: 'realestate',  fn: 'showRealEstate()',        label: 'Properties',     tip: 'Buy hideouts & safe houses',       level: 3 },
  { id: 'missions',    fn: 'showMissions()',          label: 'Operations',     tip: 'Story missions & special ops',     level: 3 },

  // === MID GAME (Level 5-8) ===
  { id: 'gang',        fn: 'showGang()',              label: 'The Family',     tip: 'Recruit & manage your crew',       level: 5 },
  { id: 'courthouse',  fn: 'showCourtHouse()',        label: 'Legal Aid',      tip: 'Pay to reduce your wanted level',  level: 5 },
  { id: 'events',      fn: 'showEventsStatus()',      label: 'Events',         tip: 'Current weather & world events',   level: 5 },
  { id: 'minigames',   fn: 'showMiniGames()',         label: 'Pastimes',       tip: 'Arcade games & entertainment',     level: 6 },
  { id: 'casino',      fn: 'showCasino()',            label: 'Gambling',       tip: 'Slots, roulette & card games',     level: 0 },
  { id: 'fence',       fn: 'showFence()',             label: 'The Fence',      tip: 'Sell stolen goods at premium rates',level: 7 },
  { id: 'gangmgmt',    fn: 'showGangManagementScreen()', label: 'Crew Details', tip: 'Train, equip & assign your gang', level: 8 },
  { id: 'jailbreak',   fn: 'showJailbreak()',         label: 'Breakout',       tip: 'Break allies out of prison',       level: 8 },

  // === LATE GAME (Level 10-15) ===
  { id: 'businesses',  fn: 'showBusinesses()',        label: 'Fronts',         tip: 'Buy & manage businesses',          level: 10 },
  { id: 'territory',   fn: 'showTerritoryControl()',  label: 'Turf Wars',      tip: 'Capture & control districts',      level: 10 },
  { id: 'territorymap',fn: 'showTerritoryMapScreen()',label: 'Territory Map',  tip: 'View your territory on the map',   level: 10 },
  { id: 'loanshark',   fn: 'showLoanShark()',         label: 'Shylock',        tip: 'Borrow money (high interest)',     level: 10 },
  { id: 'relationships',fn:'showRelationshipsScreen()',label:'Relationships',  tip: 'Faction standing & alliances',     level: 12 },
  { id: 'rivals',      fn: 'showRivalsScreen()',      label: 'Rivals',         tip: 'Challenge rival gang bosses',      level: 12 },
  { id: 'laundering',  fn: 'showMoneyLaundering()',   label: 'The Wash',       tip: 'Launder dirty money into clean cash', level: 12 },

  // === ENDGAME (Level 15+) ===
  { id: 'empire',      fn: 'showEmpireRating()',      label: 'Empire Rating',  tip: 'Track your criminal empire score', level: 15 },
  { id: 'halloffame',  fn: 'showHallOfFame()',        label: 'Made Men',       tip: 'Hall of Fame & retired legends',   level: 15 },
  { id: 'legacyperks', fn: 'showLegacyPerkShop()',    label: 'Legacy Perks',   tip: 'Spend legacy points on bonuses',   level: 15 },
];

function isMenuItemUnlocked(item) {
  return (player.level || 1) >= item.level;
}

function getUnlockedItems() {
  return menuUnlockConfig.filter(item => isMenuItemUnlocked(item));
}

function getLockedItems() {
  return menuUnlockConfig.filter(item => !isMenuItemUnlocked(item));
}

function getNextUnlocks() {
  const currentLevel = player.level || 1;
  const locked = getLockedItems();
  if (locked.length === 0) return [];
  const nextLevel = Math.min(...locked.map(i => i.level));
  return locked.filter(i => i.level === nextLevel);
}

// Check for newly unlocked items and show notification
function checkForNewUnlocks() {
  if (!player.unlocksNotified) player.unlocksNotified = [];
  
  const newlyUnlocked = menuUnlockConfig.filter(item => 
    isMenuItemUnlocked(item) && !player.unlocksNotified.includes(item.id)
  );
  
  // On first load, mark everything currently available as already notified (no spam)
  if (player.unlocksNotified.length === 0) {
    menuUnlockConfig.forEach(item => {
      if (isMenuItemUnlocked(item)) player.unlocksNotified.push(item.id);
    });
    return;
  }
  
  if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach(item => {
      player.unlocksNotified.push(item.id);
    });
    
    const names = newlyUnlocked.map(i => i.label).join(', ');
    showUnlockToast(newlyUnlocked);
    logAction(`🔓 NEW UNLOCKED in SafeHouse: ${names}! Check it out.`);
  }
}

function showUnlockToast(items) {
  // Remove existing toast if present
  const existing = document.getElementById('unlock-toast');
  if (existing) existing.remove();
  
  const itemList = items.map(i => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(212,175,55,0.2);">
    <strong style="color:#d4af37;">${i.label}</strong>
    <small style="color:#bdc3c7;">${i.tip}</small>
  </div>`).join('');
  
  const toast = document.createElement('div');
  toast.id = 'unlock-toast';
  toast.innerHTML = `
    <div style="position:fixed;top:20px;right:20px;z-index:3000;max-width:350px;width:90%;
          background:linear-gradient(135deg,rgba(44,62,80,0.98),rgba(52,73,94,0.98));
          border:2px solid #d4af37;border-radius:12px;padding:18px;
          box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 20px rgba(212,175,55,0.2);
          animation:slideInRight 0.4s ease-out;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="color:#d4af37;margin:0;font-size:1.1em;">🔓 New Unlocks!</h3>
        <button onclick="document.getElementById('unlock-toast').remove()" 
                style="background:none;border:none;color:#95a5a6;cursor:pointer;font-size:1.2em;padding:0 4px;">✕</button>
      </div>
      ${itemList}
      <p style="color:#7f8c8d;font-size:0.8em;margin:8px 0 0;text-align:center;">Visit the SafeHouse to explore</p>
    </div>
  `;
  document.body.appendChild(toast);
  
  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    const el = document.getElementById('unlock-toast');
    if (el) el.style.opacity = '0';
    setTimeout(() => { const el2 = document.getElementById('unlock-toast'); if (el2) el2.remove(); }, 500);
  }, 8000);
}

// Function to show the SafeHouse (full menu with all options)
function showCommandCenter() {
  hideAllScreens();
  document.getElementById("safehouse").style.display = "block";
  
  const grid = document.getElementById("safehouse-grid");
  if (!grid) return;
  
  const unlocked = getUnlockedItems();
  const locked = getLockedItems();
  const nextUnlocks = getNextUnlocks();
  
  let html = '';
  
  // Render unlocked buttons with tooltips
  unlocked.forEach(item => {
    html += `<button class="menu-btn-unlocked" onclick="${item.fn}">
      <span class="menu-btn-label">${item.label}</span>
      <span class="menu-btn-tip">${item.tip}</span>
    </button>`;
  });
  
  // Show next unlock preview (teaser for locked items)
  if (nextUnlocks.length > 0) {
    const nextLevel = nextUnlocks[0].level;
    html += `<div class="menu-locked-section">
      <div class="menu-locked-header">🔒 Unlocks at Level ${nextLevel} (${nextUnlocks.length} feature${nextUnlocks.length > 1 ? 's' : ''})</div>`;
    nextUnlocks.forEach(item => {
      html += `<button class="menu-btn-locked" disabled>
        <span class="menu-btn-label">🔒 ${item.label}</span>
        <span class="menu-btn-tip">Reach level ${item.level} to unlock</span>
      </button>`;
    });
    html += `</div>`;
  }
  
  // Show remaining locked count
  const remainingLocked = locked.length - nextUnlocks.length;
  if (remainingLocked > 0) {
    html += `<div class="menu-locked-remaining">
      +${remainingLocked} more feature${remainingLocked > 1 ? 's' : ''} to discover as you level up
    </div>`;
  }
  
  grid.innerHTML = html;
}
window.showCommandCenter = showCommandCenter;

// ========================
// PLAYER STATS SCREEN
// ========================
function showPlayerStats() {
  hideAllScreens();
  document.getElementById("player-stats-screen").style.display = "block";

  const s = player.skills;
  const t = player.skillTrees;

  // --- Helper: stat row ---
  function row(label, value, color) {
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:#bdc3c7;">${label}</span>
      <span style="color:${color || '#ecf0f1'};font-weight:600;">${value}</span>
    </div>`;
  }

  // --- Helper: section card ---
  function card(title, icon, content) {
    return `<div style="background:rgba(44,62,80,0.6);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:16px;margin-bottom:14px;">
      <h3 style="color:#d4af37;margin:0 0 10px;font-size:1.05em;">${icon} ${title}</h3>
      ${content}
    </div>`;
  }

  // ---- SECTION 1: Core Stats ----
  const maxEnergy = 100 + (s.endurance * 2) + (t.endurance.stamina * 3);
  const coreHTML = [
    row('Level', player.level, '#d4af37'),
    row('XP', `${player.experience} / ${player.level * 500 + Math.pow(player.level, 2) * 80 + Math.pow(player.level, 3) * 5}`, '#3498db'),
    row('Health', `${player.health !== undefined ? player.health : 100} / 100`, '#e74c3c'),
    row('Energy', `${player.energy !== undefined ? player.energy : maxEnergy} / ${maxEnergy}`, '#2ecc71'),
    row('Cash', `$${(player.money || 0).toLocaleString()}`, '#27ae60'),
    row('Dirty Money', `$${(player.dirtyMoney || 0).toLocaleString()}`, '#c0392b'),
    row('Power', player.power || 0, '#e67e22'),
    row('Reputation', player.reputation || 0, '#9b59b6'),
    row('Wanted Level', `${player.wantedLevel || 0} / 100`, '#e74c3c'),
    row('Suspicion', `${player.suspicionLevel || 0}%`, '#e67e22'),
    row('Skill Points', player.skillPoints || 0, '#d4af37'),
  ].join('');

  // ---- SECTION 2: Base Skills ----
  const skillLabels = {
    stealth: { icon: '🕵️', desc: '-2% arrest chance per level' },
    violence: { icon: '⚔️', desc: '+5% combat power per level' },
    charisma: { icon: '🗣️', desc: '+3% negotiation per level' },
    intelligence: { icon: '🧠', desc: '+4% job success per level' },
    luck: { icon: '🍀', desc: '+6% event rewards per level' },
    endurance: { icon: '💪', desc: '+2 max energy per level' }
  };
  const baseSkillsHTML = Object.entries(s).map(([name, level]) => {
    const info = skillLabels[name] || { icon: '❓', desc: '' };
    const pctMap = { stealth: level * 2, violence: level * 5, charisma: level * 3, intelligence: level * 4, luck: level * 6, endurance: level * 2 };
    const bonusVal = name === 'endurance' ? `+${pctMap[name]} max energy` : (name === 'stealth' ? `-${pctMap[name]}%` : `+${pctMap[name]}%`);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="color:#bdc3c7;">${info.icon} ${name.charAt(0).toUpperCase() + name.slice(1)}</span>
      <span style="color:#ecf0f1;">Lv ${level}</span>
      <span style="color:#d4af37;font-weight:600;">${bonusVal}</span>
    </div>`;
  }).join('');

  // ---- SECTION 3: Skill Tree Branches ----
  let treeBranchesHTML = '';
  for (const [skillName, branches] of Object.entries(t)) {
    const def = skillTreeDefinitions[skillName];
    if (!def) continue;
    for (const [branchName, level] of Object.entries(branches)) {
      const branchDef = def.branches[branchName];
      if (!branchDef) continue;
      const bonusText = level > 0 ? branchDef.benefits(level) : 'Not started';
      treeBranchesHTML += `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="color:#bdc3c7;">${branchDef.icon} ${branchDef.name}</span>
        <span style="color:#ecf0f1;">Lv ${level}/${branchDef.maxLevel}</span>
        <span style="color:${level > 0 ? '#d4af37' : '#7f8c8d'};font-size:0.85em;">${bonusText}</span>
      </div>`;
    }
  }

  // ---- SECTION 4: Gang & Territory ----
  const gangHTML = [
    row('Gang Members', (player.gang.gangMembers || []).length, '#3498db'),
    row('Gang Loyalty', `${player.gang.loyalty || 100}%`, '#2ecc71'),
    row('Max Gang Size', player.realEstate.maxGangMembers || 5, '#ecf0f1'),
    row('Territories Held', (player.territories || []).length, '#e67e22'),
    row('Territory Power', player.territoryPower || 100, '#e74c3c'),
    row('Territory Rep', player.territoryReputation || 0, '#9b59b6'),
    row('Properties Owned', (player.realEstate.ownedProperties || []).length, '#d4af37'),
    row('Businesses Owned', (player.businesses || []).length, '#27ae60'),
  ].join('');

  // ---- SECTION 5: Faction Reputation ----
  const factionLabels = { torrino: 'Torrino Family', kozlov: 'Kozlov Bratva', chen: 'Chen Triad', morales: 'Morales Cartel', police: 'Police', civilians: 'Civilians', underground: 'Underground' };
  const factionHTML = Object.entries(player.streetReputation || {}).map(([f, val]) => {
    const label = factionLabels[f] || f;
    const color = val > 0 ? '#2ecc71' : (val < 0 ? '#e74c3c' : '#7f8c8d');
    return row(label, val > 0 ? `+${val}` : val, color);
  }).join('');

  // ---- SECTION 6: Equipment Bonuses ----
  let equipHTML = '';
  if (player.equippedWeapon) {
    const w = player.equippedWeapon;
    equipHTML += row('Weapon', `${w.name || 'Unknown'} (+${w.power || w.attack || 0} power)`, '#e74c3c');
  } else {
    equipHTML += row('Weapon', 'None equipped', '#7f8c8d');
  }
  if (player.equippedArmor) {
    const a = player.equippedArmor;
    equipHTML += row('Armor', `${a.name || 'Unknown'} (+${a.defense || 0} defense)`, '#3498db');
  } else {
    equipHTML += row('Armor', 'None equipped', '#7f8c8d');
  }
  if (player.equippedVehicle) {
    const v = player.equippedVehicle;
    equipHTML += row('Vehicle', `${v.name || 'Unknown'}`, '#e67e22');
  } else {
    equipHTML += row('Vehicle', 'None', '#7f8c8d');
  }

  // ---- SECTION 7: Playstyle Stats ----
  const ps = player.playstyleStats || {};
  const playstyleHTML = [
    row('Stealthy Jobs', ps.stealthyJobs || 0),
    row('Violent Jobs', ps.violentJobs || 0),
    row('Diplomatic Actions', ps.diplomaticActions || 0),
    row('Hacking Attempts', ps.hackingAttempts || 0),
    row('Gambling Wins', ps.gamblingWins || 0),
    row('Training Sessions', ps.mentoringSessions || 0),
  ].join('');

  // ---- Assemble full page ----
  const content = document.getElementById("player-stats-content");
  content.innerHTML = `
    <h2 style="color:#d4af37;text-align:center;margin:10px 0 18px;">📊 Player Stats Overview</h2>
    ${card('Core Stats', '🏛️', coreHTML)}
    ${card('Base Skills', '📈', baseSkillsHTML)}
    ${card('Skill Specializations', '🌳', treeBranchesHTML)}
    ${card('Gang & Territory', '🏴', gangHTML)}
    ${card('Faction Reputation', '🤝', factionHTML)}
    ${card('Equipment', '🗡️', equipHTML)}
    ${card('Playstyle', '🎮', playstyleHTML)}
  `;
}
window.showPlayerStats = showPlayerStats;

// Function to go back to the main menu
function goBackToMainMenu() {
  // Prevent leaving jail when incarcerated
  if (player.inJail) {
    alert("You can't leave while you're in jail! You must serve your time or attempt a breakout.");
    return;
  }
  
  // Remove any mobile-specific back buttons first
  const mobileBackBtns = document.querySelectorAll('button[style*="position: fixed"]');
  mobileBackBtns.forEach(btn => {
    if (btn.innerHTML === '← Back') {
      btn.remove();
    }
  });
  
  hideAllScreens();
  
  // Explicitly hide these screens as backup (with null checks)
  const screensToHide = [
    "jail-screen", "dark-web-screen", "court-house-screen", 
    "inventory-screen", "hospital-screen", "death-screen", 
    "achievements-screen", "jailbreak-screen", "recruitment-screen"
  ];
  
  screensToHide.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) screen.style.display = "none";
  });
  
  // Go directly to SafeHouse (replaces old main menu)
  showCommandCenter();
  
  // Ensure mobile UI elements are properly managed
  if (window.innerWidth <= 768) {
    const mobileActions = document.querySelector('.mobile-quick-actions');
    if (mobileActions) mobileActions.style.display = 'flex';
    
    const mobileMenu = document.querySelector('.mobile-slide-menu');
    if (mobileMenu) mobileMenu.style.display = 'block';
  }
}

// Function to show the jailbreak screen
function showJailbreak() {
  if (player.inJail) {
    alert("You can't run jailbreak operations while you're locked up yourself!");
    return;
  }

  // Generate prisoners if list is empty
  if (jailbreakPrisoners.length === 0) {
    generateJailbreakPrisoners();
  }

  document.getElementById("menu").style.display = "none";
  document.getElementById("jailbreak-screen").style.display = "block";
  updateJailbreakPrisonerList();
}

// Function to update the jailbreak prisoner list
function updateJailbreakPrisonerList() {
  const prisonerListContainer = document.getElementById("jailbreak-prisoner-list");
  if (!prisonerListContainer) return;
  
  let prisonerHTML = "";
  
  if (jailbreakPrisoners.length === 0) {
    prisonerHTML = `
      <div style="text-align: center; padding: 20px; background: rgba(149, 165, 166, 0.3); border-radius: 8px; border: 1px solid #95a5a6;">
        <h4>🔍 No Active Targets</h4>
        <p>The jails are quiet tonight. Check back later or scout for new opportunities.</p>
      </div>
    `;
  } else {
    jailbreakPrisoners.forEach((prisoner, index) => {
      const difficultyColor = ["#2ecc71", "#f39c12", "#e67e22", "#e74c3c"][prisoner.difficulty - 1];
      const energyCheck = player.energy >= prisoner.energyCost;
      const buttonState = energyCheck ? "" : "disabled";
      const buttonText = energyCheck ? "Attempt Breakout" : "Not Enough Energy";
      
      prisonerHTML += `
        <div style="background: rgba(52, 73, 94, 0.6); padding: 20px; margin: 15px 0; border-radius: 10px; border: 2px solid ${difficultyColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px;">
              <h3 style="color: ${difficultyColor}; margin: 0 0 10px 0;">${prisoner.name}</h3>
              <p><strong>Security Level:</strong> <span style="color: ${difficultyColor}">${prisoner.securityLevel}</span></p>
              <p><strong>Sentence Remaining:</strong> ${prisoner.sentence} seconds</p>
              <p><strong>Energy Cost:</strong> ${prisoner.energyCost} energy</p>
            </div>
            <div style="text-align: center; min-width: 200px;">
              <p><strong>Success Rate:</strong> <span style="color: #3498db">${prisoner.breakoutSuccess + (player.skills.stealth * 2)}%</span></p>
              <p><strong>XP Reward:</strong> <span style="color: #f39c12">${prisoner.expReward}</span></p>
              <p><strong>Cash Reward:</strong> <span style="color: #2ecc71">$${prisoner.cashReward}</span></p>
              <button onclick="attemptJailbreak(${index})" ${buttonState} style="margin-top: 10px; width: 100%;">
                ${buttonText} (${prisoner.breakoutSuccess + (player.skills.stealth * 2)}%)
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  prisonerListContainer.innerHTML = prisonerHTML;
}

// Function to attempt a jailbreak mission
function attemptJailbreak(prisonerIndex) {
  const prisoner = jailbreakPrisoners[prisonerIndex];
  if (!prisoner) return;
  
  // Check energy
  if (player.energy < prisoner.energyCost) {
    alert("You don't have enough energy for this jailbreak attempt!");
    return;
  }
  
  // Consume energy
  player.energy = Math.max(0, player.energy - prisoner.energyCost);
  
  // Calculate success chance with stealth bonus
  const successChance = prisoner.breakoutSuccess + (player.skills.stealth * 2);
  const success = Math.random() * 100 < successChance;
  
  if (success) {
    // Successful jailbreak
  player.experience += Math.floor(prisoner.expReward * 0.6); // Reduce XP for jailbreaks
    player.money += prisoner.cashReward;
    player.reputation += Math.floor(prisoner.difficulty * 1.5);
    
    // Check for level up
    checkLevelUp();
    
    logAction(`🗝️ Mission accomplished! You freed ${prisoner.name} from ${prisoner.securityLevel} security. Your reputation on the streets grows (+${prisoner.expReward} XP, +$${prisoner.cashReward}).`);
    alert(`${getRandomNarration('prisonerBreakoutSuccess')} You helped ${prisoner.name} escape from ${prisoner.securityLevel} security. Gained ${prisoner.expReward} XP and $${prisoner.cashReward}!`);
    
    // Remove prisoner from list
    jailbreakPrisoners.splice(prisonerIndex, 1);
    
  } else {
    // Failed jailbreak - chance of getting arrested
    const arrestChance = prisoner.arrestChance - (player.skills.stealth * 3);
    
    if (Math.random() * 100 < arrestChance) {
      // Got caught - go to jail
      logAction(`🚔 Busted during the ${prisoner.name} jailbreak! Guards swarm you as alarms blare. The operation was blown from the start.`);
      alert(`${getRandomNarration('prisonerBreakoutFailure')} You're being arrested.`);
      sendToJail(prisoner.difficulty + 2);
      return;
    } else {
      // Failed but escaped
      logAction(`💨 The plan falls apart! You slip away in the chaos as ${prisoner.name} stays locked up. Sometimes you live to fight another day.`);
      alert(`${getRandomNarration('prisonerBreakoutFailure')} But you managed to escape without being caught.`);
    }
  }
  
  updateJailbreakPrisonerList();
  updateUI();
}

// Function to refresh the prisoner list
function refreshPrisoners() {
  if (player.energy < 5) {
    alert("You need at least 5 energy to scout for new prisoners!");
    return;
  }
  
  player.energy = Math.max(0, player.energy - 5);
  generateJailbreakPrisoners();
  updateJailbreakPrisonerList();
  updateUI();
  
  logAction("🔍 You spend time casing the local detention facilities. Fresh intelligence reveals new opportunities for liberation.");
  alert("You've gathered intel on new prisoners. The list has been updated!");
}

// Function to show recruitment screen
function showRecruitment() {
  if (player.inJail) {
    alert("You can't recruit gang members while you're in jail!");
    return;
  }
  
  // Generate recruits if list is empty
  if (availableRecruits.length === 0) {
    generateAvailableRecruits();
  }

  let recruitsHTML = `
    <h2>🕴️ Street Recruitment</h2>
    <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: rgba(46, 204, 113, 0.2); border-radius: 8px; border: 2px solid #2ecc71;">
      <h3 style="color: #2ecc71; margin: 0;">📍 Talent Scouting Active</h3>
      <p style="margin: 10px 0 0 0; font-size: 1.1em;">You're on the hunt for fresh blood to join your criminal organization</p>
    </div>
    
    <p style="font-size: 1.1em; text-align: center; margin-bottom: 25px;">Find new talent willing to join your criminal organization. Higher level recruits generate more tribute but cost significantly more.</p>
    
    <div style="margin-bottom: 25px; padding: 20px; background: rgba(52, 73, 94, 0.6); border-radius: 8px; border: 1px solid #f39c12;">
      <h4 style="color: #f39c12; margin-top: 0;">📊 Experience Level Guide:</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px;">
        <div style="padding: 10px; background: rgba(149, 165, 166, 0.2); border: 1px solid #95a5a6; border-radius: 5px;">
          <strong style="color: #95a5a6;">Levels 1-3: Rookies</strong><br>
          <small>Common (85% chance)<br>Standard tribute</small>
        </div>
        <div style="padding: 10px; background: rgba(52, 152, 219, 0.2); border: 1px solid #3498db; border-radius: 5px;">
          <strong style="color: #3498db;">Levels 4-6: Experienced</strong><br>
          <small>Rare (12% chance)<br>+20-80% tribute</small>
        </div>
        <div style="padding: 10px; background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; border-radius: 5px;">
          <strong style="color: #e74c3c;">Levels 7-10: Veterans</strong><br>
          <small>Legendary (3% chance)<br>+110-200% tribute</small>
        </div>
      </div>
    </div>
    
    <h3 style="text-align: center; color: #ecf0f1; margin-bottom: 20px;">🎯 Available Recruits (${availableRecruits.length} found):</h3>
    <ul>
      ${availableRecruits.map((recruit, index) => {
        const canAfford = player.money >= recruit.cost;
        const levelColor = recruit.experienceLevel <= 3 ? '#95a5a6' : 
                recruit.experienceLevel <= 6 ? '#3498db' : '#e74c3c';
        const levelText = recruit.experienceLevel <= 3 ? 'Rookie' : 
                recruit.experienceLevel <= 6 ? 'Experienced' : 'Veteran';
        
        return `
          <li style="margin: 15px 0; padding: 20px; background: rgba(44, 62, 80, 0.8); border-radius: 12px; border: 2px solid ${levelColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 250px;">
                <h4 style="color: ${levelColor}; margin: 0 0 10px 0; font-size: 1.3em;">${recruit.name}</h4>
                <div style="margin-bottom: 10px;">
                  <span style="background: ${levelColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">
                    Level ${recruit.experienceLevel} ${levelText}
                  </span>
                  <span style="background: rgba(52, 73, 94, 0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; margin-left: 8px;">
                    ${recruit.specialization}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95em;">
                  <div><strong>💎 Loyalty:</strong> ${recruit.loyalty}%</div>
                  <div><strong>💰 Tribute:</strong> ${(recruit.tributeMultiplier * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div style="text-align: right; margin-left: 15px;">
                <div style="font-size: 1.2em; font-weight: bold; color: #f39c12; margin-bottom: 10px;">
                  $${recruit.cost.toLocaleString()}
                </div>
                <button onclick="recruitMember(${index})" 
                    ${canAfford ? '' : 'disabled'} 
                    style="background: ${canAfford ? 'linear-gradient(45deg, #2ecc71, #27ae60)' : '#7f8c8d'}; 
                        color: white; padding: 12px 20px; border: none; border-radius: 8px; 
                        font-weight: bold; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; 
                        font-size: 16px; transition: all 0.3s ease;">
                  ${canAfford ? '🤝 Recruit' : '💸 Too Expensive'}
                </button>
              </div>
            </div>
          </li>
        `;
      }).join('')}
    </ul>
    
    <div style="text-align: center; margin-top: 30px; padding: 20px; background: rgba(52, 73, 94, 0.4); border-radius: 8px;">
      <button onclick="refreshRecruits()" 
          style="background: linear-gradient(45deg, #3498db, #2980b9); color: white; padding: 15px 25px; 
              border: none; border-radius: 8px; font-weight: bold; cursor: pointer; 
              font-size: 16px; margin: 0 10px; transition: all 0.3s ease;">
        🔍 Look for New Recruits ($500)
      </button>
      <button onclick="goBackToMainMenu()" 
          style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 25px; 
              border: none; border-radius: 8px; font-weight: bold; cursor: pointer; 
              font-size: 16px; margin: 0 10px; transition: all 0.3s ease;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;

  document.getElementById("recruitment-content").innerHTML = recruitsHTML;
  
  // Hide all other screens
  document.getElementById("menu").style.display = "none";
  document.getElementById("gang-screen").style.display = "none";
  document.getElementById("jobs-screen").style.display = "none";
  document.getElementById("store-screen").style.display = "none";
  document.getElementById("skills-screen").style.display = "none";
  document.getElementById("achievements-screen").style.display = "none";
  document.getElementById("stolen-cars-screen").style.display = "none";
  document.getElementById("jailbreak-screen").style.display = "none";
  document.getElementById("real-estate-screen").style.display = "none";
  
  // Show recruitment screen with prominence
  document.getElementById("recruitment-screen").style.display = "block";
  
  // Scroll to top to ensure user sees the screen
  window.scrollTo(0, 0);
  
  // Add a visual notification to make sure player notices
  alert("🕴️ Recruitment Screen Opened! Browse available gang members below.");
}

// Function to recruit a gang member
function recruitMember(index) {
  const recruit = availableRecruits[index];
  if (!recruit) {
    alert("Recruit not found!");
    return;
  }

  // Check gang capacity
  const maxCapacity = calculateMaxGangMembers();
  if (player.gang.gangMembers.length >= maxCapacity) {
    alert(`You've reached your gang capacity limit of ${maxCapacity} members! Purchase more real estate to house additional gang members.`);
    return;
  }

  if (player.money >= recruit.cost) {
    player.money -= recruit.cost;
    player.gang.members++;
    
    // Initialize gangMembers array if it doesn't exist (for older saves)
    if (!player.gang.gangMembers) {
      player.gang.gangMembers = [];
    }
    
    // EXPANDED: Create enhanced gang member with role system if enabled
    let newMember;
    if (ExpandedSystems && ExpandedSystems.CONFIG.gangRolesEnabled) {
      // Generate expanded gang member with role
      newMember = ExpandedSystems.generateGangMember(null, recruit.name);
      
      // Merge with legacy data
      newMember.experienceLevel = recruit.experienceLevel;
      newMember.tributeMultiplier = recruit.tributeMultiplier;
      newMember.specialization = recruit.specialization;
      newMember.onOperation = false;
      newMember.inTraining = false;
      newMember.arrested = false;
    } else {
      // Legacy gang member format
      newMember = {
        name: recruit.name,
        experienceLevel: recruit.experienceLevel,
        tributeMultiplier: recruit.tributeMultiplier,
        specialization: recruit.specialization,
        loyalty: recruit.loyalty,
        skills: recruit.skills || {
          violence: Math.floor(Math.random() * 3) + 1,
          stealth: Math.floor(Math.random() * 3) + 1,
          intelligence: Math.floor(Math.random() * 3) + 1
        },
        onOperation: false,
        inTraining: false,
        arrested: false
      };
    }
    
    player.gang.gangMembers.push(newMember);
    
    // Increase territory power based on recruit's experience level
    const powerGain = Math.floor(recruit.experienceLevel * 2) + 5; // 7-25 power depending on level
    player.territoryPower += powerGain;

    // Remove recruited member from available list
    availableRecruits.splice(index, 1);

    const roleInfo = newMember.roleData ? ` as a ${newMember.roleData.icon} ${newMember.roleData.name}` : '';
    alert(`${getRandomNarration('recruitmentSuccess')} ${recruit.name}${roleInfo} will start generating tribute in the next collection.`);
    logAction(`🤝 ${recruit.name} joins your crew! The ${recruit.specialization} brings level ${recruit.experienceLevel} skills to your organization. Your empire grows stronger.`);
    
    // Update mission progress
    updateMissionProgress('gang_member_recruited', 1);
    
    updateUI();
    showRecruitment(); // Refresh the screen
  } else {
    alert(`You need $${recruit.cost.toLocaleString()} to recruit ${recruit.name}, but you only have $${player.money.toLocaleString()}.`);
  }
}

// Function to refresh available recruits
function refreshRecruits() {
  const cost = 500;
  
  if (player.money >= cost) {
    player.money -= cost;
    generateAvailableRecruits();
    updateUI();
    showRecruitment();
    logAction("🔍 You hit the streets looking for fresh talent. Word spreads that you're hiring - new faces emerge from the shadows.");
    alert("New recruits have been found!");
  } else {
    alert("You need $500 to scout for new recruits!");
  }
}

// Function to handle random recruit encounters
function handleRandomRecruitEncounter() {
  if (!randomEncounterRecruit) return;

  const recruit = randomEncounterRecruit;
  const levelColor = recruit.experienceLevel <= 7 ? '#e67e22' : 
           recruit.experienceLevel <= 8 ? '#3498db' : '#e74c3c';
  const levelText = 'Veteran';

  showRecruitEncounterDialog(recruit, levelText, levelColor);
}

// Function to show custom recruit encounter dialog
function showRecruitEncounterDialog(recruit, levelText, levelColor) {
  const encounterHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); 
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box;">
      <div style="max-width: 500px; width: 100%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%); 
            padding: 30px; border-radius: 15px; border: 2px solid #f39c12; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7); 
            text-align: center; color: white;">
        <h2 style="color: #f39c12; margin-bottom: 20px; font-size: 1.8em;">
          🎲 Random Encounter!
        </h2>
        
        <div style="margin: 20px 0; padding: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
          <p style="margin: 10px 0; font-size: 1.1em; color: #ecf0f1;">
            You bump into <strong style="color: #3498db;">${recruit.name}</strong>, a <strong style="color: ${levelColor};">${levelText}</strong> ${recruit.specialization} looking for work.
          </p>
        </div>
        
        <div style="text-align: left; margin: 20px 0; padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
          <p style="margin: 8px 0;"><strong>👤 Specialization:</strong> ${recruit.specialization}</p>
          <p style="margin: 8px 0;"><strong>⭐ Experience Level:</strong> <span style="color: ${levelColor};">${recruit.experienceLevel} (${levelText})</span></p>
          <p style="margin: 8px 0;"><strong>❤️ Loyalty:</strong> <span style="color: #2ecc71;">${recruit.loyalty}%</span></p>
          <p style="margin: 8px 0;"><strong>💰 Tribute Multiplier:</strong> <span style="color: #f39c12;">${(recruit.tributeMultiplier * 100).toFixed(0)}%</span></p>
          <p style="margin: 8px 0;"><strong>💵 Cost:</strong> <span style="color: #e74c3c;">$${recruit.cost.toLocaleString()}</span></p>
        </div>
        
        <p style="margin: 20px 0; font-size: 1.1em; color: #ecf0f1;">
          Do you want to recruit them immediately?
        </p>
        
        <div style="display: flex; gap: 20px; justify-content: center; margin-top: 25px;">
          <button onclick="handleRecruitChoice(true)" 
              style="background: linear-gradient(45deg, #2ecc71, #27ae60); color: white; padding: 15px 30px; border: none; 
                  border-radius: 10px; font-size: 1.1em; font-weight: bold; cursor: pointer; min-width: 120px;
                  transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);">
            👤 Hire
          </button>
          <button onclick="handleRecruitChoice(false)" 
              style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; 
                  border-radius: 10px; font-size: 1.1em; font-weight: bold; cursor: pointer; min-width: 120px;
                  transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(149, 165, 166, 0.4);">
            🚶 Ignore
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  const encounterScreen = document.createElement('div');
  encounterScreen.id = 'recruit-encounter-screen';
  encounterScreen.innerHTML = encounterHTML;
  document.body.appendChild(encounterScreen);
}

// Function to handle recruit choice (hire or ignore)
function handleRecruitChoice(shouldHire) {
  const recruit = randomEncounterRecruit;
  
  // Close the encounter dialog
  const encounterScreen = document.getElementById('recruit-encounter-screen');
  if (encounterScreen) {
    encounterScreen.remove();
  }
  
  if (shouldHire) {
    // Check gang capacity
    const maxCapacity = calculateMaxGangMembers();
    if (player.gang.gangMembers.length >= maxCapacity) {
      alert(`You've reached your gang capacity limit of ${maxCapacity} members! Purchase more real estate to house additional gang members.`);
      randomEncounterRecruit = null;
      return;
    }
    
    if (player.money >= recruit.cost) {
      player.money -= recruit.cost;
      player.gang.members++;
      player.gang.gangMembers.push({
        name: recruit.name,
        experienceLevel: recruit.experienceLevel,
        tributeMultiplier: recruit.tributeMultiplier,
        specialization: recruit.specialization,
        loyalty: recruit.loyalty
      });

      alert(`${getRandomNarration('recruitmentSuccess')} ${recruit.name} from the streets!`);
      logAction(`🎲 Fate brings opportunity! ${recruit.name} was looking for exactly what you're offering. The ${recruit.specialization} joins your ranks with ${recruit.experienceLevel} levels of experience.`);
      updateUI();
    } else {
      alert(`You don't have enough money ($${recruit.cost.toLocaleString()}) to recruit ${recruit.name}.`);
      logAction(`💸 A golden opportunity slips away. ${recruit.name} wanted to join, but you couldn't meet their price. Easy come, easy go.`);
    }
  } else {
    logAction(`🚶 You decline ${recruit.name}'s offer to join. Sometimes it's better to be selective about who you trust.`);
  }

  randomEncounterRecruit = null; // Clear the encounter
}

// Function to show the store
function showStore() {
  if (player.inJail) {
    alert("You can't shop while you're in jail!");
    return;
  }

  let storeListHTML = storeItems.map((item, index) => {
    let finalPrice = Math.floor(item.price * (1 - player.skills.charisma * 0.02));
    let discountText = player.skills.charisma > 0 ? ` (${((1 - finalPrice/item.price) * 100).toFixed(0)}% off!)` : '';
    
    let itemDescription = "";
    if (item.type === "energy") {
      itemDescription = `(Restores ${item.energyRestore} energy, -1 health)`;
    } else {
      itemDescription = `(Power: ${item.power})`;
    }
    
    // Item comparison: show upgrade/downgrade vs currently owned items of same type
    let comparisonHTML = "";
    if (item.power > 0 && item.type !== "energy" && item.type !== "ammo" && item.type !== "gas") {
      const ownedSameType = player.inventory.filter(inv => inv.type === item.type);
      if (ownedSameType.length > 0) {
        const bestOwned = ownedSameType.reduce((best, cur) => cur.power > best.power ? cur : best, ownedSameType[0]);
        const diff = item.power - bestOwned.power;
        if (diff > 0) {
          comparisonHTML = `<div style="margin-top: 4px; color: #2ecc71; font-size: 0.85em;">▲ +${diff} power vs your ${bestOwned.name}</div>`;
        } else if (diff < 0) {
          comparisonHTML = `<div style="margin-top: 4px; color: #e74c3c; font-size: 0.85em;">▼ ${diff} power vs your ${bestOwned.name}</div>`;
        } else {
          comparisonHTML = `<div style="margin-top: 4px; color: #95a5a6; font-size: 0.85em;">= Same power as your ${bestOwned.name}</div>`;
        }
      }
    }
    const alreadyOwned = player.inventory.some(inv => inv.name === item.name);
    const ownedBadge = alreadyOwned ? `<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; margin-left: 8px;">OWNED</span>` : '';
    
    // Check vehicle requirement
    let requirementMet = true;
    let requirementText = "";
    if (item.requiredVehicle) {
      const hasVehicle = player.garage && player.garage.some(car => car.name === item.requiredVehicle);
      requirementMet = hasVehicle;
      requirementText = `<div style="margin-top: 5px; color: ${hasVehicle ? '#2ecc71' : '#e74c3c'}; font-size: 0.9em;">
        ${hasVehicle ? '✓' : '🚫'} Requires: ${item.requiredVehicle}
      </div>`;
    }
    
    // Resolve image source with case-safe mapping
    const imageSrc = getItemImage(item.name);
    
    return `
      <li style="display: flex; align-items: center; gap: 15px; padding: 15px; margin: 10px 0; background: rgba(52, 73, 94, 0.6); border-radius: 8px; border-left: 4px solid #3498db;">
        <div style="flex-shrink: 0;">
          <img src="${imageSrc}" alt="${item.name}" 
             style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; 
                border: 2px solid #ecf0f1; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div style="display: none; width: 80px; height: 80px; border-radius: 8px; 
                background: #7f8c8d; align-items: center; justify-content: center; 
                font-size: 12px; color: white; border: 2px solid #ecf0f1; text-align: center;">
            ${item.name}
          </div>
        </div>
        <div style="flex: 1;">
          <div style="margin-bottom: 5px;">
            <strong style="color: #ecf0f1; font-size: 1.1em;">${item.name}</strong>${ownedBadge}
          </div>
          <div style="margin-bottom: 8px; color: #bdc3c7;">
            ${itemDescription}
          </div>
          ${comparisonHTML}
          ${requirementText}
          <div id="store-price-${index}" data-base-price="${item.price}" style="color: #f1c40f; font-weight: bold; font-size: 1.1em;">
            $${finalPrice.toLocaleString()}${discountText}
          </div>
        </div>
        <div style="flex-shrink: 0;">
          <button id="buy-btn-${index}" onclick="buyItem(${index})" 
              style="background: ${player.money >= finalPrice && requirementMet ? '#27ae60' : '#7f8c8d'}; 
                  color: white; padding: 12px 20px; border: none; border-radius: 6px; 
                  cursor: ${player.money >= finalPrice && requirementMet ? 'pointer' : 'not-allowed'}; 
                  font-weight: bold; font-size: 14px; min-width: 120px;
                  transition: all 0.3s ease;"
              ${player.money >= finalPrice && requirementMet ? '' : 'disabled'}
              onmouseover="if(!this.disabled) this.style.background='#229954'"
              onmouseout="if(!this.disabled) this.style.background='#27ae60'">
            ${player.money >= finalPrice ? 'Purchase' : 'Too Expensive'}
          </button>
        </div>
      </li>
    `;
  }).join('');

  let inventoryListHTML = player.inventory.map(item => {
    const imageSrc = getItemImage(item.name);
    return `
      <li style="display: flex; align-items: center; gap: 10px; padding: 10px; margin: 5px 0; 
            background: rgba(39, 174, 96, 0.3); border-radius: 6px; border-left: 3px solid #2ecc71;">
        <div style="flex-shrink: 0;">
          <img src="${imageSrc}" alt="${item.name}" 
             style="width: 50px; height: 50px; border-radius: 6px; object-fit: cover; 
                border: 2px solid #2ecc71; box-shadow: 0 2px 6px rgba(0,0,0,0.2);" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div style="display: none; width: 50px; height: 50px; border-radius: 6px; 
                background: #27ae60; align-items: center; justify-content: center; 
                font-size: 10px; color: white; border: 2px solid #2ecc71; text-align: center;">
            ${item.name.substring(0, 6)}
          </div>
        </div>
        <div style="flex: 1; color: #ecf0f1;">
          <strong>${item.name}</strong><br>
          <small style="color: #bdc3c7;">Power: ${item.power}</small>
        </div>
      </li>
    `;
  }).join('');

  document.getElementById("item-list").innerHTML = storeListHTML;
  document.getElementById("inventory-list").innerHTML = inventoryListHTML;
  hideAllScreens();
  document.getElementById("store-screen").style.display = "block";
}

// Refresh only dynamic elements on the store (prices, button states)
function refreshStoreDynamicElements() {
  if (!document.getElementById("store-screen") || document.getElementById("store-screen").style.display === 'none') return;
  storeItems.forEach((item, index) => {
    const priceEl = document.getElementById(`store-price-${index}`);
    const btnEl = document.getElementById(`buy-btn-${index}`);
    if (!priceEl || !btnEl) return;
    const base = parseInt(priceEl.getAttribute('data-base-price'), 10) || item.price;
    const finalPrice = Math.floor(base * (1 - player.skills.charisma * 0.02));
    const discountText = player.skills.charisma > 0 ? ` (${((1 - finalPrice/base) * 100).toFixed(0)}% off!)` : '';
    priceEl.textContent = `$${finalPrice.toLocaleString()}${discountText}`;
    if (player.money >= finalPrice) {
      btnEl.disabled = false;
      btnEl.style.background = '#27ae60';
      btnEl.style.cursor = 'pointer';
      btnEl.textContent = 'Purchase';
    } else {
      btnEl.disabled = true;
      btnEl.style.background = '#7f8c8d';
      btnEl.style.cursor = 'not-allowed';
      btnEl.textContent = 'Too Expensive';
    }
  });
}

// Function to buy an item
async function buyItem(index) {
  let item = storeItems[index];
  
  // Check if item requires a specific vehicle
  if (item.requiredVehicle) {
    const hasRequiredVehicle = player.garage && player.garage.some(car => car.name === item.requiredVehicle);
    if (!hasRequiredVehicle) {
      alert(`You need a ${item.requiredVehicle} to transport this item! Purchase one from the store first.`);
      return;
    }
  }
  
  // Apply charisma discount
  let finalPrice = Math.floor(item.price * (1 - player.skills.charisma * 0.02));
  
  // Kozlov Bratva passive: weapons cost 10% less
  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'ammo') {
    finalPrice = Math.floor(finalPrice * getWeaponPriceMultiplier());
  }
  
  // Drug Lab synergy: owning a Drug Lab reduces trade goods purchase price by 15-30%
  if (item.type === 'highLevelDrug' && player.businesses && player.businesses.some(b => b.type === 'druglab')) {
    const drugLab = player.businesses.find(b => b.type === 'druglab');
    const discount = 0.10 + (drugLab.level * 0.04); // 14% at Lv1, up to 30% at Lv5
    const savings = Math.floor(finalPrice * discount);
    finalPrice = Math.floor(finalPrice * (1 - discount));
    logAction(`🧪 Your Drug Lab provides a supply chain discount — saved $${savings.toLocaleString()} on ${item.name}.`);
  }
  
  if (player.money >= finalPrice) {
    // Confirmation for expensive purchases (over $100K)
    if (finalPrice >= 100000 && item.type !== "ammo" && item.type !== "gas" && item.type !== "energy") {
      const pctOfWallet = ((finalPrice / player.money) * 100).toFixed(0);
      const confirmed = confirm(`Purchase ${item.name} for $${finalPrice.toLocaleString()}?\n\nThis is ${pctOfWallet}% of your wallet ($${player.money.toLocaleString()}).`);
      if (!confirmed) return;
    }
    
    player.money -= finalPrice;
    if (item.type === "ammo") {
      player.ammo++;
    } else if (item.type === "gas") {
      player.gas++;
    } else if (item.type === "health") {
      player.health = Math.min(player.health + item.healthRestore, 100);
    } else if (item.type === "energy") {
      player.energy = Math.min(player.energy + item.energyRestore, player.maxEnergy);
      // Energy drinks take a toll on your health
      player.health = Math.max(player.health - 1, 0);
      // Reset timer if energy is now full
      if (player.energy >= player.maxEnergy) {
        player.energyRegenTimer = 0;
      }
      alert(`You consumed ${item.name} and restored ${item.energyRestore} energy! The rush comes with a cost (-1 health).`);
      logAction(`⚡ You down the ${item.name} in one gulp. The caffeine and chemicals surge through your veins - energy restored but your body pays the price (+${item.energyRestore} energy, -1 health).`);
    } else if (item.type === "utility") {
      // Utility items go to inventory and provide passive bonuses
      player.inventory.push(item);
      player.power += item.power;
      alert(`You bought a ${item.name} for $${finalPrice.toLocaleString()}.`);
      logAction(`🔧 You acquired a ${item.name} — a useful tool for any serious criminal enterprise.`);
    } else {
      player.inventory.push(item);
      player.power += item.power;
      
      // Show vehicle photo for car/vehicle purchases
      if (item.type === "car" || item.type === "vehicle") {
        showVehiclePurchaseResult(item, finalPrice);
      }
    }
    
    if (item.type !== "energy" && item.type !== "car" && item.type !== "vehicle" && item.type !== "utility") {
      alert(`You bought a ${item.name} for $${finalPrice.toLocaleString()}.`);
      logAction(`🛒 Deal sealed with a firm handshake. The ${item.name} is yours now - power on the streets costs $${finalPrice.toLocaleString()}, but respect is priceless.`);
    }
    
    updateUI();
    updateMissionAvailability(); // Check if any missions can now be unlocked
    showStore();
  } else {
    alert("You don't have enough money to buy this item.");
  }
}

// Function to show vehicle purchase result with photo
function showVehiclePurchaseResult(item, finalPrice) {
  const vehicleImageSrc = getItemImage(item.name);
  
  const resultHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); 
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box;">
      <div style="max-width: 500px; width: 100%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
            padding: 30px; border-radius: 20px; border: 2px solid #2ecc71; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); text-align: center; color: white;">
        <h2 style="color: #2ecc71; margin-bottom: 20px; font-size: 2em;">
          🛒💰 Vehicle Purchased!
        </h2>
        
        <div style="margin: 20px 0; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 15px; border: 2px solid #34495e;">
          <img src="${vehicleImageSrc}" alt="${item.name}" 
             style="width: 200px; height: 150px; border-radius: 10px; object-fit: cover; 
                border: 3px solid #ecf0f1; margin-bottom: 15px;" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display: none; width: 200px; height: 150px; border-radius: 10px; 
                background: #7f8c8d; margin: 0 auto 15px auto; display: flex; align-items: center; 
                justify-content: center; font-size: 14px; color: white; border: 3px solid #ecf0f1;">
            ${item.name}
          </div>
          <h3 style="color: #ecf0f1; margin: 10px 0;">${item.name}</h3>
        </div>
        
        <div style="text-align: left; margin: 20px 0; padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
          <p style="margin: 5px 0;"><strong>💰 Purchase Price:</strong> $${finalPrice.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>⚡ Power Bonus:</strong> +${item.power}</p>
          <p style="margin: 5px 0;"><strong>📊 Type:</strong> ${item.type === "vehicle" ? "Aircraft" : "Automobile"}</p>
        </div>
        
        <p style="margin: 20px 0; font-size: 1.1em; color: #ecf0f1;">
          Congratulations! This vehicle has been added to your inventory and will boost your power for jobs.
        </p>
        
        <button onclick="closeVehiclePurchaseResult()" 
            style="background: #2ecc71; color: white; padding: 15px 30px; border: none; 
                border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-top: 15px;">
          Continue Shopping
        </button>
      </div>
    </div>
  `;
  
  // Add to document
  const resultScreen = document.createElement('div');
  resultScreen.id = 'vehicle-purchase-result-screen';
  resultScreen.innerHTML = resultHTML;
  document.body.appendChild(resultScreen);
  
  // Log the purchase
  logAction(`🛒✨ Transaction complete! The ${item.name} is now yours. The keys feel heavy in your hand - this machine will serve you well on the streets (+${item.power} power).`);
}

// Function to close vehicle purchase result screen
function closeVehiclePurchaseResult() {
  const resultScreen = document.getElementById('vehicle-purchase-result-screen');
  if (resultScreen) {
    resultScreen.remove();
  }
}

// (Removed duplicate gainExperience and checkLevelUp; using imported versions from player.js)

// Function to show level up screen effects
function showLevelUpEffects() {
  // Milestone rewards at key levels
  const milestones = {
    5:  { title: 'Street Hustler',     bonus: 2000,   msg: 'You\'re making a name for yourself.' },
    10: { title: 'Made Man',           bonus: 10000,  msg: 'The families are starting to notice you.' },
    15: { title: 'Shot Caller',        bonus: 25000,  msg: 'Your word carries weight now.' },
    20: { title: 'Underboss',          bonus: 50000,  msg: 'Half the city answers to you.' },
    25: { title: 'Crime Lord',         bonus: 100000, msg: 'Your empire spans the underworld.' },
    30: { title: 'Shadow King',        bonus: 200000, msg: 'Even the cops pay tribute to you.' },
    40: { title: 'Legend of the Streets', bonus: 500000, msg: 'Songs are written about your reign.' },
    50: { title: 'Mafia Born',    bonus: 1000000, msg: 'You ARE the dynasty. History remembers.' }
  };
  
  const milestone = milestones[player.level];
  let milestoneHTML = '';
  if (milestone) {
    player.money += milestone.bonus;
    milestoneHTML = `
      <div style="margin: 15px 0; padding: 15px 25px; background: rgba(241, 196, 15, 0.15); border: 2px solid #f1c40f; border-radius: 10px;">
        <div style="font-size: 1.6em; color: #f1c40f; font-weight: bold;">🏆 ${milestone.title}</div>
        <div style="font-size: 1.1em; color: #ecf0f1; margin-top: 8px; font-style: italic;">${milestone.msg}</div>
        <div style="font-size: 1.3em; color: #2ecc71; margin-top: 8px;">💰 +$${milestone.bonus.toLocaleString()} Bonus</div>
      </div>
    `;
    logAction(`🏆 Milestone reached: ${milestone.title}! Earned $${milestone.bonus.toLocaleString()} bonus.`);
  }
  
  // Create level up overlay
  const levelUpOverlay = document.createElement('div');
  levelUpOverlay.id = 'level-up-overlay';
  levelUpOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle, rgba(231, 76, 60, 0.9) 0%, rgba(0, 0, 0, 0.95) 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: levelUpFadeIn 0.5s ease-out;
  `;
  
  // Create level up content
  levelUpOverlay.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="font-size: 6em; font-weight: bold; color: #f1c40f; text-shadow: 0 0 30px #f39c12; 
            animation: levelUpPulse 1s ease-in-out infinite alternate, levelUpGlow 2s ease-in-out infinite;">
        LEVEL UP!
      </div>
      <div style="font-size: 3em; margin: 20px 0; color: #e74c3c; text-shadow: 0 0 20px #c0392b;">
        Level ${player.level}
      </div>
      <div style="font-size: 1.5em; margin: 15px 0; color: #ecf0f1;">
        🌟 +2 Skill Points Earned!
      </div>
      ${milestoneHTML}
      <div style="font-size: 1.2em; color: #95a5a6; margin-top: ${milestone ? '15px' : '30px'};">
        ${milestone ? '' : 'Your reputation in the underworld grows...'}
      </div>
      <button onclick="closeLevelUpOverlay()" 
          style="margin-top: 40px; padding: 15px 40px; font-size: 1.3em; 
              background: linear-gradient(45deg, #e74c3c, #c0392b); 
              color: white; border: none; border-radius: 10px; cursor: pointer;
              box-shadow: 0 5px 15px rgba(231, 76, 60, 0.5);
              transition: all 0.3s ease;">
        Continue Your Rise 🚀
      </button>
    </div>
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes levelUpFadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes levelUpPulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }
    
    @keyframes levelUpGlow {
      0% { text-shadow: 0 0 30px #f39c12, 0 0 60px #f39c12; }
      50% { text-shadow: 0 0 50px #f1c40f, 0 0 80px #f1c40f, 0 0 100px #f39c12; }
      100% { text-shadow: 0 0 30px #f39c12, 0 0 60px #f39c12; }
    }
    
    #level-up-overlay button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(231, 76, 60, 0.7);
    }
    
    @keyframes screenShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .level-up-screen-shake {
      animation: screenShake 0.5s ease-in-out 2;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(levelUpOverlay);
  
  // Add screen shake effect to the main content
  const body = document.body;
  body.classList.add('level-up-screen-shake');
  
  // Create floating particles effect
  createLevelUpParticles();
  
  // Remove shake effect after animation
  setTimeout(() => {
    body.classList.remove('level-up-screen-shake');
  }, 1000);
}

// Function to create floating particles for level up
function createLevelUpParticles() {
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${Math.random() > 0.5 ? '#f1c40f' : '#e74c3c'};
        border-radius: 50%;
        z-index: 9999;
        pointer-events: none;
        left: ${Math.random() * 100}vw;
        top: 100vh;
        animation: floatUp 3s ease-out forwards;
        box-shadow: 0 0 10px currentColor;
      `;
      
      // Add floating animation if not already added
      if (!document.getElementById('particle-styles')) {
        const particleStyle = document.createElement('style');
        particleStyle.id = 'particle-styles';
        particleStyle.textContent = `
          @keyframes floatUp {
            to {
              transform: translateY(-120vh) rotate(360deg);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(particleStyle);
      }
      
      document.body.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 3000);
    }, i * 20); // Stagger particle creation
  }
}

// Function to show narrative overlay with callback
function showNarrativeOverlay(title, message, buttonText = "Continue", callback = null) {
  // Create narrative overlay
  const narrativeOverlay = document.createElement('div');
  narrativeOverlay.id = 'narrative-overlay';
  narrativeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle, rgba(52, 73, 94, 0.95) 0%, rgba(0, 0, 0, 0.98) 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: narrativeFadeIn 0.5s ease-out;
  `;
  
  // Create narrative content
  narrativeOverlay.innerHTML = `
    <div style="text-align: center; color: white; max-width: 600px; padding: 40px;">
      <div style="font-size: 3em; font-weight: bold; color: #f39c12; text-shadow: 0 0 20px #e67e22; margin-bottom: 30px;">
        ${title}
      </div>
      <div style="font-size: 1.4em; color: #ecf0f1; line-height: 1.6; margin-bottom: 40px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
        ${message}
      </div>
      <button onclick="closeNarrativeOverlay()" 
          style="padding: 15px 40px; font-size: 1.3em; 
              background: linear-gradient(45deg, #34495e, #2c3e50); 
              color: white; border: none; border-radius: 10px; cursor: pointer;
              box-shadow: 0 5px 15px rgba(52, 73, 94, 0.5);
              transition: all 0.3s ease;">
        ${buttonText} ➤
      </button>
    </div>
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes narrativeFadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    #narrative-overlay button:hover {
      background: linear-gradient(45deg, #2c3e50, #34495e);
      transform: translateY(-2px);
      box-shadow: 0 7px 20px rgba(52, 73, 94, 0.7);
    }
  `;
  document.head.appendChild(style);
  
  // Store callback for later use
  window.narrativeCallback = callback;
  
  document.body.appendChild(narrativeOverlay);
}

// Function to close narrative overlay
function closeNarrativeOverlay() {
  const overlay = document.getElementById('narrative-overlay');
  if (overlay) {
    overlay.style.animation = 'narrativeFadeIn 0.3s ease-out reverse';
    setTimeout(() => {
      overlay.remove();
      // Execute callback if provided
      if (window.narrativeCallback && typeof window.narrativeCallback === 'function') {
        window.narrativeCallback();
        window.narrativeCallback = null;
      }
    }, 300);
  }
}

// Function to close level up overlay
function closeLevelUpOverlay() {
  const overlay = document.getElementById('level-up-overlay');
  if (overlay) {
    overlay.style.animation = 'levelUpFadeIn 0.3s ease-out reverse';
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
  
  // Check if any mentors can be unlocked at this new level
  checkMentorDiscovery();
  
  // Show alert with level up info
  alert(`Level Up! You are now level ${player.level}. You gained 3 skill points!`);
}

// Function to unlock achievements
function unlockAchievement(achievementId) {
  const achievement = achievements.find(a => a.id === achievementId);
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    // Achievements are for fun — no money or XP rewards
    showBriefNotification(`🏆 ${achievement.name}: ${achievement.description}`, 4000);
    logAction(`🏆 Achievement Unlocked: "${achievement.name}" — ${achievement.description}.`);
  }
}

// Track for streak-based achievements
let _jobsWithoutArrest = 0;
let _casinoWins = 0;

// Function to check achievements — called after most player actions
function checkAchievements() {
  const m = player.money;
  const g = player.gang.members;
  const w = player.wantedLevel;
  const r = player.reputation;
  const l = player.level;
  const t = player.territories ? player.territories.length : 0;
  const stats = player.missions.missionStats;
  const fRep = player.missions.factionReputation;
  const maxFRep = Math.max(fRep.torrino || 0, fRep.kozlov || 0, fRep.chen || 0, fRep.morales || 0);
  const maxSkill = Math.max(player.skills.stealth, player.skills.violence, player.skills.charisma, player.skills.intelligence, player.skills.luck, player.skills.endurance);
  const ac = id => !achievements.find(a => a.id === id)?.unlocked;

  // Money milestones
  if (m >= 100000 && ac('millionaire')) unlockAchievement('millionaire');
  if (m >= 500000 && ac('half_mil')) unlockAchievement('half_mil');
  if (m >= 1000000 && ac('true_millionaire')) unlockAchievement('true_millionaire');
  if (m >= 10000000 && ac('multi_millionaire')) unlockAchievement('multi_millionaire');
  if (m >= 100000000 && ac('billionaire')) unlockAchievement('billionaire');
  // Gang milestones
  if (g >= 1 && ac('first_recruit')) unlockAchievement('first_recruit');
  if (g >= 10 && ac('gang_leader')) unlockAchievement('gang_leader');
  if (g >= 25 && ac('crime_family')) unlockAchievement('crime_family');
  if (g >= 50 && ac('army')) unlockAchievement('army');
  // Combat & criminal
  if (w >= 50 && ac('most_wanted')) unlockAchievement('most_wanted');
  if (r >= 100 && ac('reputation_max')) unlockAchievement('reputation_max');
  if (_jobsWithoutArrest >= 10 && ac('ghost')) unlockAchievement('ghost');
  if (stats.bossesDefeated >= 1 && ac('boss_slayer')) unlockAchievement('boss_slayer');
  // Progression
  if (l >= 10 && ac('level_10')) unlockAchievement('level_10');
  if (l >= 25 && ac('level_25')) unlockAchievement('level_25');
  if (l >= 50 && ac('level_50')) unlockAchievement('level_50');
  if (maxSkill >= 20 && ac('skill_master')) unlockAchievement('skill_master');
  // Faction
  if (maxFRep >= 25 && ac('faction_friend')) unlockAchievement('faction_friend');
  if (maxFRep >= 50 && ac('faction_ally')) unlockAchievement('faction_ally');
  // Empire
  if (t >= 3 && ac('territory_3')) unlockAchievement('territory_3');
  if (t >= 10 && ac('territory_10')) unlockAchievement('territory_10');
  if (player.businesses && player.businesses.length >= 1 && ac('business_owner')) unlockAchievement('business_owner');
  // Items
  if (player.inventory.some(i => i.type === 'weapon' || i.type === 'gun') && ac('armed_dangerous')) unlockAchievement('armed_dangerous');
  if (player.realEstate && player.realEstate.ownedProperties && player.realEstate.ownedProperties.length >= 1 && ac('property_owner')) unlockAchievement('property_owner');
  if (player.stolenCars && player.stolenCars.length >= 1 && ac('wheels')) unlockAchievement('wheels');
  // Jobs
  if (stats.jobsCompleted >= 50 && ac('jobs_50')) unlockAchievement('jobs_50');
  if (stats.jobsCompleted >= 200 && ac('jobs_200')) unlockAchievement('jobs_200');
  // Casino
  if (_casinoWins >= 3 && ac('lucky_streak')) unlockAchievement('lucky_streak');
  if (_casinoWins >= 10 && ac('gambler')) unlockAchievement('gambler');
}

// Fully reset the player object for a brand-new profile
function resetPlayerForNewGame() {
  Object.assign(player, {
    name: "",
    gender: "",
    ethnicity: "",
    portrait: "",
    money: 0,
    inventory: [],
    stolenCars: [],
    selectedCar: null,
    energy: 100,
    maxEnergy: 100,
    energyRegenTimer: 0,
    ammo: 0,
    gas: 0,
    health: 100,
    inJail: false,
    jailTime: 0,
    breakoutChance: 45,
    breakoutAttempts: 3,
    power: 0,
    wantedLevel: 0,
    reputation: 0,
    level: 1,
    experience: 0,
    skillPoints: 0,
    skills: {
      stealth: 0,
      violence: 0,
      charisma: 0,
      intelligence: 0,
      luck: 0,
      endurance: 0
    },
    skillTrees: {
      stealth: { infiltration: 0, escape: 0, surveillance: 0 },
      violence: { firearms: 0, melee: 0, intimidation: 0 },
      charisma: { negotiation: 0, leadership: 0, manipulation: 0 },
      intelligence: { hacking: 0, planning: 0, forensics: 0 },
      luck: { gambling: 0, fortune: 0, serendipity: 0 },
      endurance: { stamina: 0, recovery: 0, resistance: 0 }
    },
    mentors: [],
    streetReputation: {
      torrino: 0,
      kozlov: 0,
      chen: 0,
      morales: 0,
      police: 0,
      civilians: 0,
      underground: 0
    },
    unlockedPerks: [],
    playstyleStats: {
      stealthyJobs: 0,
      violentJobs: 0,
      diplomaticActions: 0,
      hackingAttempts: 0,
      gamblingWins: 0,
      mentoringSessions: 0
    },
    territory: 0,
    gang: {
      members: 0,
      loyalty: 100,
      lastTributeTime: 0,
      gangMembers: [],
      activeOperations: [],
      trainingQueue: [],
      betrayalHistory: [],
      lastBetrayalCheck: 0
    },
    realEstate: {
      ownedProperties: [],
      maxGangMembers: 5
    },
    missions: {
      activeCampaign: "risingThroughRanks",
      currentChapter: 0,
      completedMissions: [],
      completedCampaigns: [],
      factionReputation: {
        torrino: 0,
        kozlov: 0,
        chen: 0,
        morales: 0
      },
      unlockedTerritoryMissions: ["suburbs_expansion"],
      unlockedBossBattles: [],
      signatureJobCooldowns: {},
      missionStats: {
        jobsCompleted: 0,
        moneyEarned: 0,
        gangMembersRecruited: 0,
        territoriesControlled: 0,
        bossesDefeated: 0,
        factionMissionsCompleted: 0
      }
    },
    businesses: [],
    activeLoans: [],
    dirtyMoney: 0,
    suspicionLevel: 0,
    launderingSetups: [],
    businessLastCollected: {},
    territories: [],
    protectionRackets: [],
    territoryIncome: 0,
    corruptedOfficials: [],
    territoryEvents: [],
    territoryHeat: {},
    territoryPower: 100,
    territoryReputation: 0,
    quickActionPrefs: []
  });
}

// Function to start the game (always creates a NEW profile)
function startGame() {
  // Whenever the player clicks "Join the Family", we treat it as
  // creating a brand-new profile, regardless of any loaded state.
  resetPlayerForNewGame();
  showSimpleCharacterCreation();
}

// Simplified character creation system
async function showSimpleCharacterCreation() {
  // Hide main menu and intro screen during character creation
  document.getElementById("menu").style.display = "none";
  document.getElementById("intro-screen").style.display = "none";
  
  // Ensure player is in a clean state for character creation
  if (player.name && player.name.trim() !== "") {
    resetPlayerForNewGame();
  }
  
  // First ask for name
  const playerName = await ui.prompt("What's your name, tough guy?");
  
  if (!playerName || playerName.trim() === "") {
    ui.alert("You need a name to make it in this world!");
    // Re-prompt — new players must create a character
    showSimpleCharacterCreation();
    return;
  }
  
  player.name = playerName.trim();
  
  // Initialize playtime tracking
  if (!player.startTime) {
    player.startTime = Date.now();
  }
  
  // Now show portrait selection screen
  showPortraitSelection();
}

// Character creation helper variable
let selectedPortraitFile = '';

// Function to select portrait during character creation
function selectPortraitForCreation(portraitFile) {
  selectedPortraitFile = portraitFile;
  
  // Update button states
  document.querySelectorAll('.portrait-option').forEach(btn => {
    btn.classList.remove('selected');
  });
  const selectedBtn = document.querySelector(`[data-portrait="${portraitFile}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
  
  // Update preview
  updateCharacterPreview();
}

// Function to update character preview
function updateCharacterPreview() {
  const nameInput = document.getElementById('character-name');
  const previewName = document.getElementById('preview-name');
  const selectedPortrait = document.getElementById('selected-portrait');
  const createBtn = document.getElementById('create-character-btn');
  
  if (nameInput && previewName) {
    const name = nameInput.value.trim();
    previewName.textContent = name ? `Name: ${name}` : 'Name: Unknown';
  }
  
  // Show portrait if selected
  if (selectedPortraitFile && selectedPortrait) {
    selectedPortrait.src = selectedPortraitFile;
    selectedPortrait.style.display = 'block';
  }
  
  // Enable create button if portrait selected and name entered
  if (createBtn && nameInput) {
    const name = nameInput.value.trim();
    createBtn.disabled = !(selectedPortraitFile && name.length > 0);
  }
}

// Function to load portrait grid in character creation
function loadPortraitGrid() {
  const portraitGrid = document.getElementById('portrait-grid');
  if (!portraitGrid) return;
  
  const portraitOptions = [
    "profile_pics/White male.png",
    "profile_pics/White female.png",
    "profile_pics/Black male.png",
    "profile_pics/Black female.png",
    "profile_pics/Asian male.png",
    "profile_pics/Asian female.png",
    "profile_pics/Mexican male.png",
    "profile_pics/Mexican female.png",
    "profile_pics/Old Male.png",
    "profile_pics/Old Female.png",
    "profile_pics/Stylized White Male.png",
    "profile_pics/Stylized White Female.png",
    "profile_pics/Stylized Black Male.png",
    "profile_pics/Stylized Black Female.png",
    "profile_pics/Stylized Asian Male.png",
    "profile_pics/Stylized Asian Female.png",
    "profile_pics/Stylized Hispanic Male.png",
    "profile_pics/Stylized Hispanic Female.png"
  ];
  
  portraitGrid.innerHTML = portraitOptions.map(portrait => `
    <button class="portrait-option" data-portrait="${portrait}" onclick="selectPortraitForCreation('${portrait}')">
      <img src="${portrait}" alt="Portrait" />
    </button>
  `).join('');
}

// Function to create character after all selections made
function createCharacter() {
  const nameInput = document.getElementById('character-name');
  const name = nameInput ? nameInput.value.trim() : '';
  
  if (!name) {
    alert('Enter your name first.');
    return;
  }
  
  if (!selectedPortraitFile) {
    alert('Select a portrait.');
    return;
  }
  
  // Set player data
  player.name = name;
  player.portrait = selectedPortraitFile;
  
  // Set default current slot for new character
  SAVE_SYSTEM.currentSlot = 1;
  saveSaveSystemPrefs();
  
  // Hide character creation screen
  const charScreen = document.getElementById('character-creation');
  if (charScreen) {
    charScreen.style.display = 'none';
  }
  
  // Log character creation
  logAction(`🎭 ${player.name} emerges from the shadows - ready to conquer the criminal underworld.`);
  
  // Show intro narrative
  showIntroNarrative();
}

// Function to go back to intro/title screen from character creation
function goBackToIntro() {
  const charCreationScreen = document.getElementById('character-creation-screen');
  if (charCreationScreen) {
    charCreationScreen.style.display = 'none';
  }
  
  // Remove portrait selection overlay if present
  const portraitScreen = document.getElementById('portrait-selection-screen');
  if (portraitScreen) {
    portraitScreen.remove();
  }
  
  // Reset selections
  selectedPortraitFile = '';
  const nameInput = document.getElementById('character-name');
  if (nameInput) {
    nameInput.value = '';
  }
  
  // Return to the title screen
  document.getElementById('intro-screen').style.display = 'block';
}

function showPortraitSelection() {
  // Hide intro screen and show portrait selection
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("character-creation-screen").style.display = "none";
  
  // Create portrait selection HTML
  const portraitOptions = [
    { file: "profile_pics/White male.png", label: "White Male" },
    { file: "profile_pics/White female.png", label: "White Female" },
    { file: "profile_pics/Black male.png", label: "Black Male" },
    { file: "profile_pics/Black female.png", label: "Black Female" },
    { file: "profile_pics/Asian male.png", label: "Asian Male" },
    { file: "profile_pics/Asian female.png", label: "Asian Female" },
    { file: "profile_pics/Mexican male.png", label: "Hispanic Male" },
    { file: "profile_pics/Mexican female.png", label: "Hispanic Female" },
    { file: "profile_pics/Old Male.png", label: "Old Male" },
    { file: "profile_pics/Old Female.png", label: "Old Female" },
    { file: "profile_pics/Stylized White Male.png", label: "Stylized White Male" },
    { file: "profile_pics/Stylized White Female.png", label: "Stylized White Female" },
    { file: "profile_pics/Stylized Black Male.png", label: "Stylized Black Male" },
    { file: "profile_pics/Stylized Black Female.png", label: "Stylized Black Female" },
    { file: "profile_pics/Stylized Asian Male.png", label: "Stylized Asian Male" },
    { file: "profile_pics/Stylized Asian Female.png", label: "Stylized Asian Female" },
    { file: "profile_pics/Stylized Hispanic Male.png", label: "Stylized Hispanic Male" },
    { file: "profile_pics/Stylized Hispanic Female.png", label: "Stylized Hispanic Female" }
  ];
  
  let portraitHTML = `
    <div class="portrait-selection-overlay">
      <div class="portrait-selection-container">
        <h1 style="color: #e74c3c; font-size: 3em; margin-bottom: 15px; text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);">
          Choose Your Identity, ${player.name}
        </h1>
        <p style="font-size: 1.2em; margin-bottom: 30px;">Select your appearance for the criminal underworld</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0;">
          ${portraitOptions.map((option, index) => `
            <button onclick="selectPortrait('${option.file}', '${option.label}')" 
                style="padding: 10px; border: 3px solid #7f8c8d; border-radius: 15px; 
                    background: rgba(52, 73, 94, 0.6); color: white; cursor: pointer; 
                    transition: all 0.3s ease; min-height: 180px; display: flex; 
                    flex-direction: column; align-items: center; justify-content: center;
                    box-sizing: border-box;">
              <img src="${option.file}" alt="${option.label}" 
                 style="width: 120px; height: 120px; border-radius: 15px; object-fit: cover; 
                    border: 3px solid #ecf0f1;" />
            </button>
          `).join('')}
        </div>
        
        <button onclick="goBackToIntro()" 
            style="background: #7f8c8d; color: white; padding: 15px 30px; border: none; 
                border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-top: 20px;">
          ← Back
        </button>
      </div>
    </div>
  `;
  
  // Add to document
  const portraitScreen = document.createElement('div');
  portraitScreen.id = 'portrait-selection-screen';
  portraitScreen.innerHTML = portraitHTML;
  document.body.appendChild(portraitScreen);
}

function selectPortrait(portraitFile, portraitLabel) {
  // Save portrait data
  player.portrait = portraitFile;
  
  // Parse gender and ethnicity from filename for internal tracking only
  const parts = portraitFile.toLowerCase().replace('.png', '').split(' ');
  player.ethnicity = parts[0]; // white, black, asian, mexican
  player.gender = parts[1]; // male, female
  
  // Set default current slot for new character (slot 1)
  SAVE_SYSTEM.currentSlot = 1;
  saveSaveSystemPrefs();
  
  // Remove portrait selection screen
  const portraitScreen = document.getElementById('portrait-selection-screen');
  if (portraitScreen) {
    portraitScreen.remove();
  }
  
  // Log character creation
  logAction(`🎭 ${player.name} emerges from the shadows - ready to conquer the criminal underworld.`);
  
  // Show intro narrative
  showIntroNarrative();
}

// Function to show the intro narrative
function showIntroNarrative() {
  const introText = `
    <div style="text-align: center; padding: 30px; background: rgba(44, 62, 80, 0.9); color: white; border-radius: 15px; margin: 20px; border: 2px solid #e74c3c;">
      <h2 style="color: #e74c3c; margin-bottom: 20px;">🌃 Welcome to the Streets, ${player.name}</h2>
      
      <div style="text-align: left; max-width: 600px; margin: 0 auto; line-height: 1.6; font-size: 16px;">
        <p style="margin-bottom: 15px;">
          <strong>${player.name}</strong>, you're standing at the edge of a vast criminal empire waiting to be built. The city sprawls before you like a dark ocean, full of opportunities for those bold enough to seize them.
        </p>
        
        <p style="margin-bottom: 15px;">
          You start with <span style="color: #e74c3c;">nothing</span> - zero dollars, zero reputation, zero respect. But in this city, empires aren't built with what you have, they're built with what you're willing to risk and how smart you are about taking it.
        </p>
        
        <p style="margin-bottom: 15px;">
          The streets are your classroom, <strong>${player.name}</strong>. Every job teaches you something new. Every arrest makes you tougher. Every betrayal sharpens your instincts. You'll build crews, control territory, and compete with other rising criminal minds.
        </p>
        
        <p style="margin-bottom: 15px;">
          Some will remember you as a cautionary tale - another wannabe who burned out fast. Others will whisper your name in the same breath as legends. The choice is yours to make, but choose wisely - this world has a long memory.
        </p>
        
        <p style="margin-bottom: 15px; color: #f39c12;">
          <strong>Your empire awaits:</strong> Start small with street jobs, recruit loyal gang members, buy properties to expand your influence, and maybe one day your name will earn a place in the Hall of Fame. Compete with other criminal masterminds and leave a legacy that spans generations.
        </p>
        
        <p style="margin-bottom: 20px; color: #3498db;">
          <strong>The game has evolved:</strong> Multiple save slots protect your progress, weekly challenges test your skills, and an objective tracker guides your path to power. Use quick actions for instant navigation, track your missions in real-time, and compete in the online criminal underworld. Your empire awaits.
        </p>
        
        <p style="text-align: center; font-style: italic; color: #95a5a6; margin-bottom: 15px;">
          Welcome to your new life, ${player.name}. The underworld is waiting.
        </p>
        
        <p style="text-align: center; font-weight: bold; color: #2ecc71;">
          Every choice matters. Every risk counts. Your legend starts now.
        </p>
      </div>
      
      <button onclick="finishIntro()" style="margin-top: 25px; padding: 15px 30px; background: #e74c3c; color: white; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold;">
        Begin Your Empire
      </button>
    </div>
  `;
  
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("tutorial-screen").style.display = "none";
  document.getElementById("intro-narrative").innerHTML = introText;
  document.getElementById("intro-narrative").style.display = "block";
}

// Function to finish the intro and start the game proper
function finishIntro() {
  document.getElementById("intro-narrative").style.display = "none";
  
  // Ask player if they want to do the tutorial
  showTutorialPrompt();
}

// Function to show tutorial option prompt
function showTutorialPrompt() {
  const tutorialPromptHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); 
          display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="max-width: 600px; width: 90%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
            padding: 40px; border-radius: 20px; border: 2px solid #e74c3c; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); 
            text-align: center; color: white;">
        <h2 style="color: #e74c3c; font-size: 2.5em; margin-bottom: 20px; text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);">
          🎓 Tutorial
        </h2>
        <p style="font-size: 1.3em; margin-bottom: 30px; line-height: 1.6;">
          Welcome to the criminal underworld, <strong style="color: #f39c12;">${player.name}</strong>!
        </p>
        <p style="font-size: 1.1em; margin-bottom: 30px; color: #ecf0f1;">
          Would you like to learn the ropes through an interactive tutorial, or are you ready to dive straight into the action?
        </p>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
          <button onclick="startTutorialFromIntro()" 
              style="background: #2ecc71; color: white; padding: 15px 30px; border: none; 
                  border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; 
                  transition: all 0.3s ease; min-width: 180px;">
            📚 Start Tutorial
          </button>
          <button onclick="skipTutorialAndStartGame()" 
              style="background: #e74c3c; color: white; padding: 15px 30px; border: none; 
                  border-radius: 10px; font-size: 1.2em; font-weight: bold; cursor: pointer; 
                  transition: all 0.3s ease; min-width: 180px;">
            🚀 Skip Tutorial
          </button>
        </div>
        <p style="font-size: 0.9em; margin-top: 20px; color: #95a5a6; font-style: italic;">
          Don't worry - you can always access the tutorial later from the SafeHouse!
        </p>
      </div>
    </div>
  `;
  
  // Add to document
  const tutorialPromptScreen = document.createElement('div');
  tutorialPromptScreen.id = 'tutorial-prompt-screen';
  tutorialPromptScreen.innerHTML = tutorialPromptHTML;
  document.body.appendChild(tutorialPromptScreen);
}

// Function to start tutorial from intro
function startTutorialFromIntro() {
  // Remove tutorial prompt screen
  const tutorialPromptScreen = document.getElementById('tutorial-prompt-screen');
  if (tutorialPromptScreen) {
    tutorialPromptScreen.remove();
  }
  
  // Set flag that tutorial is not from menu (new game tutorial)
  tutorialFromMenu = false;
  
  // Start the tutorial
  startTutorial();
}

// Function to skip tutorial and start game
function skipTutorialAndStartGame() {
  // Remove tutorial prompt screen
  const tutorialPromptScreen = document.getElementById('tutorial-prompt-screen');
  if (tutorialPromptScreen) {
    tutorialPromptScreen.remove();
  }
  
  // Start the game directly
  startGameAfterIntro();
}

// Function to start the game after intro (extracted from original finishIntro)
function startGameAfterIntro() {
  // Activate all gameplay systems (events, timers, etc.) on first entry
  activateGameplaySystems();

  // Clean up any remaining character creation elements
  const portraitScreen = document.getElementById('portrait-selection-screen');
  if (portraitScreen) {
    portraitScreen.remove();
  }
  
  const tutorialPromptScreen = document.getElementById('tutorial-prompt-screen');
  if (tutorialPromptScreen) {
    tutorialPromptScreen.remove();
  }
  
  // Clear any tutorial highlights that might affect positioning
  clearTutorialHighlights();
  
  // Use the same screen cleanup as goBackToMainMenu for consistency
  hideAllScreens();
  
  // Show the SafeHouse directly (replaces old main menu)
  showCommandCenter();
  
  // Generate random prisoners for the first time
  generateJailPrisoners();
  generateJailbreakPrisoners();
  
  // Update UI with the player's name and initial state
  updateUI();
  
  // Log the beginning of the journey
  logAction(`🌆 ${player.name} steps into the shadows of the city. The streets whisper promises of power and wealth, but first... survival.`);
  
  // Show version update notification
  checkAndShowVersionUpdate();
}

// ==================== VERSION UPDATE SYSTEM ====================

const CURRENT_VERSION = "1.3.8";
const VERSION_UPDATES = {
  "1.3.8": {
    title: "June 2025 Update - SafeHouse & Polish",
    date: "June 2025",
    changes: [
      "Command Center renamed to SafeHouse throughout the game",
      "New Player Stats screen — view detailed skill, combat, and career statistics (unlocks at level 2)",
      "Skill descriptions now show accurate current and next-level bonuses instead of 0%",
      "Fixed job button flickering caused by per-second UI rebuilds",
      "Screen transitions now scroll to the top automatically",
      "Slower XP progression curve for a more rewarding grind",
      "Veteran recruit rework — experienced gang members cost more but start stronger",
      "Season-aware weather system with real-world date-based seasons",
      "Weather and season-aware narration for immersive job stories",
      "Mobile responsiveness improvements across all screens",
      "Payout balance pass — adjusted job rewards for better progression",
      "Tutorial updated to reflect all current game features and SafeHouse rename",
      "Numerous bug fixes including property purchase and status bar display issues"
    ]
  },
  "1.3.0": {
    title: "February 2026 Update - Dirty Money Overhaul",
    date: "February 21, 2026",
    changes: [
      "Dirty Money rework — only Bank Job and Counterfeiting Money produce dirty money; all other jobs now pay clean cash",
      "Money Laundering job reworked — now converts dirty money to clean money at 80-95% rate instead of paying cash",
      "Dirty money jobs now raise Suspicion Level (+5-15 per job), making laundering more urgent",
      "New Business: Counterfeiting Operation — $4M, $180K/day dirty income, +3% laundering job bonus",
      "New Business: Drug Lab — $6M, $220K/day dirty income, the highest-earning illegal business",
      "New Business: Chop Shop — $3.5M, $140K/day dirty income, pairs with Boost a Ride",
      "New Job: Counterfeiting Money — extreme risk, $200K-$500K payout (dirty), requires Basement Hideout & Fake ID Kit",
      "Jobs and businesses that pay dirty money are now clearly labeled in red (DIRTY MONEY)",
      "Money Laundering screen now shows tips about the laundering job, Counterfeiting synergy, and suspicion",
      "Comprehensive 16-step tutorial rewritten to match all current game mechanics including dirty money",
      "Complete README overhaul with accurate game data for all 18 jobs, 9 businesses, and store prices",
      "Save migration for older saves — dirty money, suspicion level, and laundering setups auto-initialize",
      "Play Now button restored to project page"
    ]
  },
  "1.2.0": {
    title: "November 2025 Update - Quality of Life Improvements",
    date: "November 23, 2025",
    changes: [
      "Fixed mobile portrait selection - no more cut-off images!",
      "Fixed load game system - loading slots now properly starts your game",
      "Fixed back button in load screen",
      "Added 35+ vehicle variants to car theft (broken, rusty, and pristine conditions)",
      "Added new weapons: Switchblade, Revolver, and Sawed-Off Shotgun",
      "Updated tutorial content to reflect current game features",
      "Added objective tracker to help guide your criminal career",
      "Improved money display and stat tracking",
      "Increased Street Soldier job risk (20% jail chance)",
      "Enhanced mobile UI with better quick access bar"
    ]
  }
};

function checkAndShowVersionUpdate() {
  const lastSeenVersion = localStorage.getItem('lastSeenVersion');
  
  // Show update if it's a new version or first time playing
  if (lastSeenVersion !== CURRENT_VERSION) {
    showVersionUpdateNotification();
    localStorage.setItem('lastSeenVersion', CURRENT_VERSION);
  }
}

function showVersionUpdateNotification() {
  const updateInfo = VERSION_UPDATES[CURRENT_VERSION];
  if (!updateInfo) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'version-update-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    box-sizing: border-box;
    animation: fadeIn 0.3s ease;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    max-width: 700px;
    width: 100%;
    background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%);
    padding: 40px;
    border-radius: 20px;
    border: 3px solid #c0a062;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
    color: white;
    max-height: 90vh;
    overflow-y: auto;
  `;
  
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="color: #c0a062; font-size: 2.5em; margin: 0 0 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
        What's New in Mafia Born
      </h2>
      <h3 style="color: #3498db; font-size: 1.5em; margin: 0;">
        ${updateInfo.title}
      </h3>
      <p style="color: #c0a062; font-weight: bold; font-size: 1.1em; margin: 5px 0;">
        Version ${CURRENT_VERSION}
      </p>
      <p style="color: #95a5a6; font-size: 0.9em; margin: 10px 0 0 0;">
        Released: ${updateInfo.date}
      </p>
    </div>
    
    <div style="background: rgba(0, 0, 0, 0.3); padding: 25px; border-radius: 15px; margin-bottom: 30px;">
      <h4 style="color: #2ecc71; font-size: 1.3em; margin: 0 0 15px 0; text-align: center;">
        Update Highlights
      </h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${updateInfo.changes.map(change => `
          <li style="
            background: rgba(52, 152, 219, 0.1);
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
            font-size: 1.05em;
            line-height: 1.5;
          ">
            ${change}
          </li>
        `).join('')}
      </ul>
    </div>
    
    <div style="text-align: center;">
      <button 
        onclick="closeVersionUpdate()" 
        style="
          background: linear-gradient(to bottom, #c0a062, #8b7545);
          color: #1a1a1a;
          font-weight: bold;
          padding: 15px 40px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1.2em;
          box-shadow: 0 4px 15px rgba(192, 160, 98, 0.4);
          transition: all 0.3s ease;
        "
        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(192, 160, 98, 0.6)';"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(192, 160, 98, 0.4)';"
      >
        Let's Get Started!
      </button>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <p style="color: #95a5a6; font-size: 0.85em;">
        Tip: You can always check the latest updates in the game menu
      </p>
    </div>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

function closeVersionUpdate() {
  const overlay = document.getElementById('version-update-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }
}

// Tutorial system
let currentTutorialStep = 0;
let tutorialFromMenu = false; // Flag to track if tutorial was opened from main menu
const tutorialSteps = [
  {
    title: "Welcome to the Criminal Underworld",
    showUI: "none",
    content: `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="gamelogo.png" alt="Mafia Born Logo" 
           style="max-width: 300px; width: 80%; height: auto; border-radius: 10px; 
              box-shadow: 0 5px 15px rgba(0,0,0,0.5); border: 2px solid #e74c3c;" />
      </div>
      <p>You're about to embark on a journey from street-level thug to criminal mastermind. This world is unforgiving, but with cunning, courage, and the right strategy, you can rise to the top.</p>
      <p><strong>Your Goal:</strong> Build your criminal empire, gain reputation, manage your gang, acquire territory, run businesses, and leave a lasting legacy in the underworld.</p>
      <p><strong>Warning:</strong> Every choice has consequences. Poor planning could land you in jail, bankrupt, or worse. But smart players can build empires that span generations — and even retire!</p>
      <p style="margin-top: 20px; padding: 15px; background: rgba(52, 152, 219, 0.2); border-radius: 8px; border: 1px solid #3498db;">
        <strong>This tutorial covers all the major game systems. Pay attention — mastering these mechanics is the difference between surviving and thriving!</strong>
      </p>
    `
  },
  {
    title: "Understanding Your Stats",
    showUI: "stats",
    content: `
      <h3>Your Criminal Profile</h3>
      <p><strong>Look at the top of your screen!</strong> The stats bar shows your current status:</p>
      <ul>
        <li><strong>Money:</strong> Your cash on hand — needed for equipment, properties, and bribes</li>
        <li><strong>Energy:</strong> Required for every job — regenerates 1 point every 20 seconds (improved by Recovery skill)</li>
        <li><strong>Health:</strong> Starts at 100. Risky jobs and combat drain it. Visit the hospital to heal</li>
        <li><strong>Wanted Level:</strong> Rises from criminal activity. Higher wanted = longer jail time and police crackdowns</li>
        <li><strong>Reputation:</strong> Unlocks higher-tier jobs and faction missions as it grows</li>
        <li><strong>Level & XP:</strong> Earn XP from jobs. Each level-up grants 3 skill points</li>
        <li><strong>Power:</strong> Increased by weapons, armor, vehicles, and properties. Needed for boss battles</li>
        <li><strong>Suspicion:</strong> 0-100 scale — affects how closely law enforcement watches your operations</li>
      </ul>
      <p style="background: rgba(231, 76, 60, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Pro Tip:</strong> Watch the objective tracker on the right side to see your current goals. Use letter hotkeys (J, S, G, K, etc.) for fast navigation!</p>
    `
  },
  {
    title: "The Action Log",
    showUI: "log",
    content: `
      <h3>Your Criminal Chronicle</h3>
      <p><strong>Look to the left side of your screen!</strong> The Action Log is your criminal story being written in real-time:</p>
      <ul>
        <li>Every job you pull gets recorded with immersive narration</li>
        <li>Success and failure stories show the consequences of your choices</li>
        <li>Random events — police raids, lucky finds, gang recruitment offers — all appear here</li>
        <li>Weather changes, seasonal events, and news headlines scroll through as the world evolves</li>
        <li>Gang operations, business deals, territory expansions, and boss battle results are all documented</li>
      </ul>
      <p style="background: rgba(46, 204, 113, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> The action log tracks your entire criminal career, including milestones, achievements, and faction standing changes!
      </p>
    `
  },
  {
    title: "Jobs & Energy Management",
    showUI: "jobs",
    content: `
      <h3>Your Criminal Career — 18 Jobs</h3>
      <p><strong>This is the Jobs screen!</strong> Your primary source of income and XP. Jobs scale from entry-level to legendary:</p>
      <ul>
        <li><strong>Street Soldier (1 Energy):</strong> Low risk, low reward — $1K-$5K payouts to get started</li>
        <li><strong>Boost a Ride (5 Energy):</strong> Steal cars to sell or keep. Risky but no cash needed upfront</li>
        <li><strong>Store Heist (10 Energy):</strong> $20K-$40K payouts — requires 10 reputation</li>
        <li><strong>Drug Jobs:</strong> Bootleg Run, Speakeasy Supply, White Powder Distribution — buy the product from the store, sell it on the street for big profit</li>
        <li><strong>Weapon Jobs:</strong> Protection Collection, Bank Job, Hit on a Rival — require weapons and ammo</li>
        <li><strong>Dirty Money Jobs:</strong> <span style="color:#e74c3c;">Bank Job</span> and <span style="color:#e74c3c;">Counterfeiting Money</span> pay only dirty money that must be laundered! These also raise your suspicion level</li>
        <li><strong>Money Laundering Job:</strong> Converts dirty money to clean money (80-95% rate). Owning a Counterfeiting Operation business boosts the rate!</li>
        <li><strong>Elite Jobs:</strong> International Arms Trade ($500K-$1M) and Take Over the City ($2M-$5M) — legendary risk, legendary reward</li>
      </ul>
      <p><strong>Energy System:</strong> Energy regenerates 1 point every 20 seconds (base). The <strong>Recovery</strong> skill tree reduces this timer, and the <strong>Endurance</strong> skill reduces energy costs per job!</p>
      <p style="background: rgba(52, 152, 219, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Strategy:</strong> Every job shows its jail chance, wanted level gain, and health loss. Check the requirements — some need specific items, weapons, or reputation!
      </p>
    `
  },
  {
    title: "The Store & Equipment",
    showUI: "store",
    content: `
      <h3>The Underground Marketplace</h3>
      <p><strong>This is the Store!</strong> Everything you need to build your criminal empire:</p>
      <ul>
        <li><strong>Weapons:</strong> Brass Knuckles ($7.5K) > Switchblade > Baseball Bat > Pistol ($30K) > Revolver > Sawed-Off > Tommy Gun ($150K) > Sniper Rifle ($250K)</li>
        <li><strong>Armor:</strong> Leather Jacket ($15K) > Stab Vest > Bulletproof Vest ($100K) > Reinforced Body Armor ($200K)</li>
        <li><strong>Vehicles:</strong> Armored Car ($120K), Luxury Automobile ($400K), Private Airplane ($1.5M)</li>
        <li><strong>Energy:</strong> Strong Coffee (+15, $800), Energy Drink (+30, $1.5K), Steroids (+60, $5K)</li>
        <li><strong>Utility:</strong> Lockpick Set, Police Scanner, Burner Phone, Fake ID Kit — each provides unique passive bonuses</li>
        <li><strong>Drugs (Trade Goods):</strong> Buy Moonshine/Mary Jane/Cocaine to use in distribution jobs for profit. Require a Freight Truck to transport!</li>
      </ul>
      <p><strong>Charisma skill</strong> gives you better prices (2% discount per level). Plan your purchases around your job goals!</p>
      <p style="background: rgba(230, 126, 34, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Investment Tip:</strong> Weapons and armor increase your Power stat permanently. Utility items provide passive bonuses that compound over time!
      </p>
    `
  },
  {
    title: "Skills & Skill Trees",
    showUI: "skills",
    content: `
      <h3>Building Your Criminal Expertise</h3>
      <p><strong>Welcome to the Skills screen!</strong> You earn 3 skill points per level-up. Invest them in 6 base skills:</p>
      <ul>
        <li><strong>Stealth:</strong> Reduces jail chance and improves breakout success</li>
        <li><strong>Violence:</strong> Boosts combat job success rates</li>
        <li><strong>Charisma:</strong> Better store prices (2%/level), reduced suspicion from laundering</li>
        <li><strong>Intelligence:</strong> Better overall job success and faster learning</li>
        <li><strong>Luck:</strong> Better random events, payouts, and gambling odds</li>
        <li><strong>Endurance:</strong> Reduces energy cost for all jobs (-1 per level!)</li>
      </ul>
      <h4>18 Skill Tree Branches</h4>
      <p>Each base skill unlocks <strong>3 specialized branches</strong> (max level 10 each, 2 skill points per upgrade):</p>
      <ul>
        <li><strong>Stealth:</strong> Infiltration, Escape Artist, Surveillance</li>
        <li><strong>Combat:</strong> Firearms, Melee Combat, Intimidation</li>
        <li><strong>Social:</strong> Negotiation, Leadership, Manipulation</li>
        <li><strong>Mental:</strong> Hacking, Strategic Planning, Forensics (decays wanted level passively!)</li>
        <li><strong>Fortune:</strong> Gambling, Fortune, Serendipity</li>
        <li><strong>Physical:</strong> Stamina (+3 max energy/level), Recovery (faster energy regen), Resistance</li>
      </ul>
      <p style="background: rgba(155, 89, 182, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Strategy:</strong> Focus on Endurance early to reduce energy costs, then branch into skills that match your playstyle!
      </p>
    `
  },
  {
    title: "Gang, Properties & Territory",
    showUI: "menu",
    content: `
      <h3>Building Your Criminal Organization</h3>
      <p><strong>Gang System:</strong></p>
      <ul>
        <li><strong>Recruit members</strong> with random specializations: muscle, thief, dealer, driver, enforcer, technician</li>
        <li><strong>Loyalty (0-100)</strong> — low loyalty triggers betrayal events: police informants, territory sellouts, coups</li>
        <li><strong>Tribute:</strong> Collect income from your gang members (5-minute cooldown, boosted by territory)</li>
        <li><strong>Operations:</strong> Send specialists on timed missions — Protection Rackets, Car Theft Rings, Drug Labs, Tech Heists</li>
        <li><strong>Training:</strong> 5 programs from Basic Combat ($300) to Advanced Tactical ($1,000) to improve your crew</li>
      </ul>
      <p><strong>Real Estate (7 Properties):</strong> From Abandoned Warehouse ($2.5K, +3 gang capacity) up to Private Island ($200K, +50 capacity). You need properties to house more gang members!</p>
      <p><strong>Territory (12 Districts):</strong> Capture districts, set up protection rackets ($200-$2,000/week), and corrupt officials from Patrol Officers ($500) to the Mayor ($25K). Beware of territory heat and rival gang encroachment!</p>
      <p style="background: rgba(231, 76, 60, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Empire Tip:</strong> Buy a Warehouse first > recruit gang > capture territory > set up rackets. This is your income engine!
      </p>
    `
  },
  {
    title: "Factions, Mentors & Boss Battles",
    showUI: "menu",
    content: `
      <h3>The Criminal Underworld Powers</h3>
      <p><strong>4 Crime Families</strong> control the city. Your standing with each affects what you can access:</p>
      <ul>
        <li><strong>Torrino Family</strong> (Don Salvatore) — Protection rackets & loan sharking</li>
        <li><strong>Kozlov Bratva</strong> (Dimitri Kozlov) — Weapons trafficking & smuggling</li>
        <li><strong>Chen Triad</strong> (Master Chen Wei) — Tech crimes & drug manufacturing</li>
        <li><strong>Morales Cartel</strong> (El Jefe Morales) — Drug manufacturing & distribution</li>
      </ul>
      <p><strong>Reputation tiers</strong> at 25/50/75/100 unlock bonuses (exclusive shops, backup, smuggling routes). Drop below -25/-50/-75/-100 and face bounties, asset freezes, and assassination orders.</p>
      <p><strong>Mentors:</strong> Train under 4 faction-aligned mentors for stat boosts (10 sessions max, 24hr cooldown).</p>
      <p><strong>Boss Battles:</strong> Challenge powerful rivals when your power and gang are strong enough:</p>
      <ul>
        <li><strong>Carlos "El Martillo" Santos</strong> — Requires 100 power, 8 gang, 40 rep. Reward: $8K + Santos' Golden Pistol</li>
        <li><strong>Chief Margaret Morrison</strong> — Requires 80 power, 6 gang, 30 rep. Reward: $6K + wanted level reduction</li>
      </ul>
      <p style="background: rgba(52, 152, 219, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> Complete faction missions to build reputation. High standing with one family may lower it with rivals!
      </p>
    `
  },
  {
    title: "Businesses & Money Laundering",
    showUI: "menu",
    content: `
      <h3>Building Legitimate Fronts & Illegal Operations</h3>
      <p><strong>9 Business Types</strong> — 6 legitimate fronts and 3 illegal operations:</p>
      <h4>Legitimate Businesses (pay clean money):</h4>
      <ul>
        <li><strong>24/7 Laundromat</strong> — $1.5M, $30K/day (95% legit, best laundering capacity)</li>
        <li><strong>Discount Pawn Shop</strong> — $2M, $40K/day (70% legit)</li>
        <li><strong>Family Restaurant</strong> — $2.5M, $50K/day (85% legit)</li>
        <li><strong>Premium Car Wash</strong> — $3M, $60K/day (90% legit)</li>
        <li><strong>Underground Nightclub</strong> — $5M, $120K/day (60% legit)</li>
        <li><strong>Private Casino</strong> — $10M, $250K/day (40% legit)</li>
      </ul>
      <h4 style="color: #e74c3c;">Illegal Businesses (pay DIRTY money):</h4>
      <ul>
        <li><strong>Chop Shop</strong> — $3.5M, $140K/day (pairs with Boost a Ride jobs)</li>
        <li><strong>Counterfeiting Operation</strong> — $4M, $180K/day (boosts Money Laundering job rate +3%)</li>
        <li><strong>Drug Lab</strong> — $6M, $220K/day (highest illegal income)</li>
      </ul>
      <p><strong>Money Laundering:</strong> Two ways to clean dirty money:</p>
      <ul>
        <li><strong>Laundering Menu:</strong> 5 methods from Casino Chips (85% clean, 2hr) to Offshore Banking (95% clean, 48hr)</li>
        <li><strong>Money Laundering Job:</strong> Converts dirty to clean at 80-95% rate. Faster but burns energy</li>
      </ul>
      <p><strong>Loan Shark:</strong> Borrow $200K-$10M at 15-30% weekly interest. Miss payments and face consequences.</p>
      <p style="background: rgba(46, 204, 113, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> Illegal businesses earn more but pay dirty money you must launder. Balance risk and reward!
      </p>
    `
  },
  {
    title: "Advanced Activities",
    showUI: "menu",
    content: `
      <h3>Beyond the Basics</h3>
      <p><strong>As your reputation grows, you'll unlock:</strong></p>
      <ul>
        <li><strong>Stolen Cars:</strong> Over 30 vehicle types from Broken Family Wagons ($800) to Police Cruisers ($250K). Sell or keep your collection</li>
        <li><strong>Jailbreak Operations:</strong> Free NPCs from prison for cash, XP, and reputation</li>
        <li><strong>Casino (4 games):</strong> Slot Machine, Roulette, Blackjack (hit, stand, double down), and Dice. The Gambling skill tree boosts your odds across all games</li>
        <li><strong>6 Mini-Games:</strong> Tic-Tac-Toe, Number Guessing, Rock Paper Scissors, Memory Match, Snake, Quick Draw — earn $50-$500 per win</li>
        <li><strong>Story Campaign:</strong> "Rising Through the Ranks" — 4 chapters from street hustler to empire builder</li>
        <li><strong>Money Laundering:</strong> Clean your dirty money through 5 methods at varying speeds and rates</li>
      </ul>
      <p style="background: rgba(52, 152, 219, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Pro Tip:</strong> Mini-games reset your personal bests for bonus payouts. The casino is risky but the Gambling skill tree makes it much more profitable!
      </p>
    `
  },
  {
    title: "Law Enforcement & Survival",
    showUI: "none",
    content: `
      <h3>Staying Out of Trouble</h3>
      <p><strong>The law is always watching.</strong> Here's how the system works:</p>
      <ul>
        <li><strong>Jail Time:</strong> Sentence = max(15, 10 + wanted level) seconds. Higher wanted = longer lockup</li>
        <li><strong>Breakout:</strong> 3 attempts per sentence. 45% base chance + Stealth bonuses. Failed attempts add 10 seconds</li>
        <li><strong>Bribe the Guard:</strong> Pay to walk free immediately — amount scales with your wanted level</li>
        <li><strong>Courthouse:</strong> Pay wanted level x $500 to clear your record (must serve jail time first)</li>
        <li><strong>Police Crackdowns:</strong> Drug enforcement, gang sweeps, auto theft ops, corruption investigations — triggered randomly</li>
        <li><strong>Suspicion System:</strong> Dirty money jobs and illegal businesses raise your suspicion (0-100). High suspicion triggers FBI surveillance and investigation chains</li>
        <li><strong>Bribery:</strong> Corrupt 6 tiers of officials. A corrupted Mayor ($25K) provides maximum protection</li>
        <li><strong>Forensics Skill:</strong> Passively decays your wanted level over time (3% chance per level per energy tick)</li>
      </ul>
      <p style="background: rgba(231, 76, 60, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Survival Tip:</strong> Keep your wanted level manageable! Use the courthouse when it gets high, and invest in Stealth for better breakout odds.
      </p>
    `
  },
  {
    title: "Dynamic World & Events",
    showUI: "none",
    content: `
      <h3>A Living, Breathing City</h3>
      <p><strong>The world changes around you:</strong></p>
      <ul>
        <li><strong>Weather System (5 types):</strong> Changes every 15-45 minutes. Rain (+15% stealth), Snow (+30% evidence reduction), Fog (+25% stealth), Storm (-30% police response)</li>
        <li><strong>Seasons:</strong> Based on real-world date. Spring Festival, Tourist Season, Harvest Festival, Holiday Shopping Chaos, and more</li>
        <li><strong>News Events:</strong> Police Budget Cuts, New Police Chief, Economic Boom, Gang Violence Surge, New Surveillance Technology — each changes gameplay</li>
        <li><strong>Random Events:</strong> Police Raids, Lucky Finds ($100-$500+), Random Sales (30% off for 2 min), Gang Recruitment offers, Territory Disputes</li>
      </ul>
      <p style="background: rgba(52, 152, 219, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> Pay attention to weather — Rain and Fog are great for stealth-based jobs. Storms keep the police occupied!
      </p>
    `
  },
  {
    title: "Empire Rating & Retirement",
    showUI: "menu",
    content: `
      <h3>The Endgame</h3>
      <p><strong>Empire Rating</strong> (max 10,000 points) measures your overall criminal success across 6 categories: Money, Gang, Territory, Business, Reputation, and Skills.</p>
      <p><strong>Grades:</strong> D > C > B > A > A+ > S > S+ > <span style="color: #f1c40f;">LEGENDARY</span> (9,000+)</p>
      <p><strong>4 Retirement Paths:</strong></p>
      <ul>
        <li><strong>Going Legitimate:</strong> $1M clean money, 10 businesses, low heat</li>
        <li><strong>Exile to Paradise:</strong> $5M, private airplane, low wanted level</li>
        <li><strong>Family Business Empire:</strong> 20 gang members, 15 territories, 15 businesses</li>
        <li><strong>Underground Kingpin:</strong> 10,000 empire rating, all factions maxed</li>
      </ul>
      <p>Retired characters enter the <strong>Hall of Fame</strong> and grant <strong>Legacy Bonuses</strong> to your next character (starting money, skills, inherited gang/territory)!</p>
      <p><strong>Weekly Challenges:</strong> 3 random challenges per week with tiered rewards — Bronze ($50K) to Platinum ($500K).</p>
      <p style="background: rgba(155, 89, 182, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Long-term Goal:</strong> Build an empire worthy of Legendary status and retire to leave bonuses for your next criminal dynasty!
      </p>
    `
  },
  {
    title: "Saves & Hotkeys",
    showUI: "none",
    content: `
      <h3>Protecting Your Empire & Fast Navigation</h3>
      <p><strong>Save System:</strong></p>
      <ul>
        <li><strong>10 manual save slots</strong> + auto-save slot + emergency save on browser close</li>
        <li><strong>Auto-save</strong> runs every 60 seconds</li>
        <li><strong>Export/Import</strong> saves as JSON files for backup</li>
        <li>Access via Options menu or press <strong>F5</strong></li>
      </ul>
      <p><strong>Quick Actions Panel:</strong> The right side of your screen shows shortcut buttons for common actions. You can customise which buttons appear in Settings > Personalization.</p>
      <p><strong>Hotkeys for Desktop:</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>J</strong> — Jobs</td><td style="padding: 4px 8px; color: #3498db;"><strong>S</strong> — Store</td><td style="padding: 4px 8px; color: #3498db;"><strong>G</strong> — Gang</td></tr>
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>K</strong> — Skills</td><td style="padding: 4px 8px; color: #3498db;"><strong>C</strong> — Cars</td><td style="padding: 4px 8px; color: #3498db;"><strong>B</strong> — Businesses</td></tr>
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>T</strong> — Territory</td><td style="padding: 4px 8px; color: #3498db;"><strong>M</strong> — Map</td><td style="padding: 4px 8px; color: #3498db;"><strong>L</strong> — Calendar</td></tr>
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>Z</strong> — Statistics</td><td style="padding: 4px 8px; color: #3498db;"><strong>R</strong> — Empire Rating</td><td style="padding: 4px 8px; color: #3498db;"><strong>O</strong> — Empire Overview</td></tr>
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>H</strong> — Hall of Fame</td><td style="padding: 4px 8px; color: #3498db;"><strong>E</strong> — Buy Energy Drink</td><td style="padding: 4px 8px; color: #3498db;"><strong>ESC</strong> — SafeHouse</td></tr>
        <tr><td style="padding: 4px 8px; color: #3498db;"><strong>F5</strong> — Save System</td><td style="padding: 4px 8px; color: #3498db;"><strong>F7</strong> — Competition</td><td></td></tr>
      </table>
      <p style="background: rgba(46, 204, 113, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> Use multiple save slots and JSON exports to protect your progress!
      </p>
    `
  },
  {
    title: "Progressive Unlocks & Quick Actions",
    showUI: "none",
    content: `
      <h3>Growing Your Empire Step by Step</h3>
      <p><strong>Progressive Unlock System:</strong> Not everything is available from the start. Game features unlock as you level up:</p>
      <ul>
        <li><strong>Level 0 (Start):</strong> Jobs, Black Market, Stash, The Doctor, Settings, Gambling</li>
        <li><strong>Level 2-3:</strong> Expertise (Skills), Motor Pool (Cars), Properties, Operations (Missions)</li>
        <li><strong>Level 5-8:</strong> The Family (Gang), Legal Aid, Events, Pastimes, The Fence, Crew Details, Breakout</li>
        <li><strong>Level 10-12:</strong> Fronts (Businesses), Turf Wars, Territory Map, Shylock (Loans), Relationships, Rivals, The Wash (Laundering)</li>
        <li><strong>Level 15+:</strong> Empire Rating, Made Men (Hall of Fame), Legacy Perks</li>
      </ul>
      <p>You'll see a notification when new features unlock. Locked features are hidden from menus until you reach the required level.</p>
      <p><strong>Customisable Quick Actions:</strong> The right side panel shows shortcut buttons for your most-used actions. Head to <strong>Settings > Personalization</strong> to choose which buttons appear. Only unlocked features can be added.</p>
      <p style="background: rgba(52, 152, 219, 0.2); padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Tip:</strong> Focus on levelling up early to unlock more game systems. Customise your quick actions to match your current playstyle!
      </p>
    `
  },
  {
    title: "Your Criminal Empire Awaits",
    showUI: "none",
    content: `
      <h3>Ready to Rule the Underworld</h3>
      <p>You now understand all the major systems that will define your criminal career:</p>
      <ul>
        <li><strong>Build Power:</strong> Jobs > Money > Equipment > Gang > Territory > Businesses</li>
        <li><strong>Develop Skills:</strong> Invest 3 skill points per level into base skills and 18 specialized branches</li>
        <li><strong>Expand Empire:</strong> Buy properties, recruit gang, capture territory, set up rackets</li>
        <li><strong>Navigate Factions:</strong> Build standing with 4 crime families for exclusive rewards</li>
        <li><strong>Challenge Bosses:</strong> Take down rival leaders for unique weapons and territory</li>
        <li><strong>Run Businesses:</strong> Generate passive income and launder your dirty money</li>
        <li><strong>Complete Challenges:</strong> Weekly competitions, story campaign, and achievements</li>
        <li><strong>Leave a Legacy:</strong> Achieve a Legendary empire rating and retire to the Hall of Fame</li>
      </ul>
      <p style="background: rgba(231, 76, 60, 0.2); padding: 15px; border-radius: 8px; margin-top: 20px;">
        <strong>Remember:</strong> Every choice matters. Manage risk vs reward, watch your wanted level, keep your gang loyal, and always have an escape plan!
      </p>
      <p style="text-align: center; margin-top: 30px; padding: 20px; background: rgba(46, 204, 113, 0.2); border-radius: 10px; border: 2px solid #2ecc71;">
        <strong style="font-size: 1.3em; color: #2ecc71;">From street thug to criminal legend...</strong><br>
        <span style="font-size: 1.1em; color: #ecf0f1;">Your dynasty begins now. Make every decision count.</span>
      </p>
    `
  }
];

function startTutorial() {
  currentTutorialStep = 0;
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("tutorial-screen").style.display = "block";
  updateTutorialDisplay();
}

function updateTutorialDisplay() {
  const step = tutorialSteps[currentTutorialStep];
  document.getElementById("tutorial-title").innerText = step.title;
  document.getElementById("tutorial-text").innerHTML = step.content;
  document.getElementById("tutorial-step").innerText = currentTutorialStep + 1;
  document.getElementById("tutorial-total").innerText = tutorialSteps.length;
  
  // Show appropriate UI elements for educational purposes
  showTutorialUI(step.showUI);
  
  // Update button visibility
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  
  prevBtn.style.display = currentTutorialStep > 0 ? "inline-block" : "none";
  
  if (currentTutorialStep === tutorialSteps.length - 1) {
    if (tutorialFromMenu) {
      nextBtn.innerText = "Back to Menu";
      nextBtn.onclick = () => completeTutorialFromMenu();
    } else {
      nextBtn.innerText = "Start Playing!";
      nextBtn.onclick = () => completeTutorial();
    }
  } else {
    nextBtn.innerText = "Next";
    nextBtn.onclick = () => nextTutorialStep();
  }
}

// Real Estate Functions
function showRealEstate() {
  if (player.inJail) {
    alert("You can't view real estate while you're in jail!");
    return;
  }
  
  hideAllScreens();
  // Show real estate screen
  document.getElementById("real-estate-screen").style.display = "block";
  updateRealEstateDisplay();
}

function updateRealEstateDisplay() {
  const content = document.getElementById("real-estate-content");
  
  // Calculate current gang capacity
  const currentCapacity = calculateMaxGangMembers();
  
  // Calculate total real estate rental income
  let totalRentIncome = 0;
  if (player.realEstate && player.realEstate.ownedProperties) {
    player.realEstate.ownedProperties.forEach(p => { if (p.income) totalRentIncome += p.income; });
  }
  
  let html = `
    <div style="margin-bottom: 20px; padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
      <h3 style="color: #ecf0f1;">📊 Property Overview</h3>
      <p><strong>Current Gang Capacity:</strong> ${currentCapacity} members</p>
      <p><strong>Current Gang Size:</strong> ${player.gang.gangMembers.length} members</p>
      <p><strong>Properties Owned:</strong> ${player.realEstate.ownedProperties.length}</p>
      ${totalRentIncome > 0 ? `<p><strong>Rental Income:</strong> <span style="color: #f1c40f;">$${totalRentIncome.toLocaleString()}</span> per cycle (collected automatically)</p>` : ''}
    </div>
  `;
  
  if (player.realEstate.ownedProperties.length > 0) {
    html += `
      <div style="margin-bottom: 20px; padding: 15px; background: rgba(39, 174, 96, 0.3); border-radius: 10px;">
        <h3 style="color: #2ecc71;">🏠 Your Properties</h3>
        ${player.realEstate.ownedProperties.map(property => `
          <div style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">
            <strong>${property.name}</strong><br>
            <small>${property.description}</small><br>
            <span style="color: #3498db;">Gang Capacity: +${property.gangCapacity}</span> |
            <span style="color: #e74c3c;">Power: +${property.power}</span>
            ${property.income > 0 ? `| <span style="color: #f1c40f;">Income: $${property.income}/tribute</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
  
  html += `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #ecf0f1;">🏢 Available Properties</h3>
      <div style="display: grid; gap: 15px;">
        ${realEstateProperties.map((property, index) => {
          const isOwned = player.realEstate.ownedProperties.some(owned => owned.name === property.name);
          const canAfford = player.money >= property.price;
          
          return `
            <div style="padding: 15px; background: rgba(52, 73, 94, 0.6); border-radius: 10px; border: 2px solid ${isOwned ? '#2ecc71' : (canAfford ? '#3498db' : '#e74c3c')};">
              <h4 style="color: ${isOwned ? '#2ecc71' : '#ecf0f1'}; margin-bottom: 10px;">
                ${property.name} ${isOwned ? '✅' : ''}
              </h4>
              <p style="color: #bdc3c7; margin-bottom: 10px;">${property.description}</p>
              <div style="margin-bottom: 10px;">
                <span style="color: #f1c40f; font-weight: bold;">$${property.price.toLocaleString()}</span> |
                <span style="color: #3498db;">Gang Capacity: +${property.gangCapacity}</span> |
                <span style="color: #e74c3c;">Power: +${property.power}</span>
                ${property.income > 0 ? `| <span style="color: #f1c40f;">Income: $${property.income}/tribute</span>` : ''}
              </div>
              ${!isOwned ? `
                <button onclick="buyProperty(${index})" 
                    style="background: ${canAfford ? '#27ae60' : '#7f8c8d'}; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-weight: bold;"
                    ${!canAfford ? 'disabled' : ''}>
                  ${canAfford ? 'Purchase' : 'Too Expensive'}
                </button>
              ` : `
                <span style="color: #2ecc71; font-weight: bold;">✓ OWNED</span>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  content.innerHTML = html;
}

function calculateMaxGangMembers() {
  let capacity = player.realEstate.maxGangMembers; // Base capacity
  
  // Add capacity from owned properties
  player.realEstate.ownedProperties.forEach(property => {
    capacity += property.gangCapacity;
  });
  
  return capacity;
}

function buyProperty(index) {
  const property = realEstateProperties[index];
  
  // Check if already owned
  if (player.realEstate.ownedProperties.some(owned => owned.name === property.name)) {
    alert("You already own this property!");
    return;
  }
  
  // Check if can afford
  if (player.money < property.price) {
    alert("You don't have enough money!");
    return;
  }
  
  // Purchase the property
  player.money -= property.price;
  player.power += property.power;
  player.realEstate.ownedProperties.push({...property});
  
  // Update UI
  updateUI();
  updateRealEstateDisplay();
  
  alert(`Congratulations! You now own ${property.name}. Your gang capacity has increased by ${property.gangCapacity} members!`);
  logAction(`🏢 Real estate empire grows! You've acquired ${property.name} for $${property.price.toLocaleString()}. Your criminal organization now has more room to expand.`);
  
  // Track mission progress for property ownership
  updateMissionProgress('property_acquired');
  
  // Check achievements
  checkAchievements();
}

// Function to show appropriate UI elements during tutorial
function showTutorialUI(uiType) {
  // First hide all tutorial-related UI highlights
  clearTutorialHighlights();
  
  // Hide all game screens
  const screens = ['menu', 'jobs-screen', 'store-screen', 'skills-screen', 'gang-screen', 
          'achievements-screen', 'stolen-cars-screen', 'jailbreak-screen'];
  screens.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) screen.style.display = "none";
  });
  
  // Get tutorial content box for positioning
  const tutorialContent = document.getElementById("tutorial-content");
  
  switch(uiType) {
    case "stats":
      // Highlight the stats bar
      const statsBar = document.getElementById("stats-bar");
      statsBar.style.border = "3px solid #3498db";
      statsBar.style.boxShadow = "0 0 20px rgba(52, 152, 219, 0.8)";
      statsBar.style.zIndex = "800";
      statsBar.style.position = "relative";
      // Position tutorial on right side, below stats bar
      if (tutorialContent) {
        tutorialContent.style.marginTop = "120px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "log":
      // Highlight the action log
      const actionLog = document.getElementById("action-log");
      actionLog.style.border = "3px solid #2ecc71";
      actionLog.style.boxShadow = "0 0 20px rgba(46, 204, 113, 0.8)";
      actionLog.style.zIndex = "800";
      actionLog.style.position = "relative";
      // Position tutorial on right side to avoid blocking action log
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "jobs":
      // Show jobs screen in background
      updateJobsList(); // Make sure jobs are populated
      const jobsScreen = document.getElementById("jobs-screen");
      jobsScreen.style.display = "block";
      jobsScreen.style.opacity = "1";
      jobsScreen.style.pointerEvents = "none";
      jobsScreen.style.border = "3px solid #e74c3c";
      jobsScreen.style.boxShadow = "0 0 20px rgba(231, 76, 60, 0.8)";
      jobsScreen.style.zIndex = "800";
      jobsScreen.style.position = "relative";
      // Position tutorial on right side
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "store":
      // Show store screen in background
      updateStoreDisplay(); // Make sure store is populated
      const storeScreen = document.getElementById("store-screen");
      storeScreen.style.display = "block";
      storeScreen.style.opacity = "1";
      storeScreen.style.pointerEvents = "none";
      storeScreen.style.border = "3px solid #f39c12";
      storeScreen.style.boxShadow = "0 0 20px rgba(243, 156, 18, 0.8)";
      storeScreen.style.zIndex = "800";
      storeScreen.style.position = "relative";
      // Position tutorial on right side
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "skills":
      // Show skills screen in background
      updateSkillsScreenDisplay(); // Make sure skills are populated
      const skillsScreen = document.getElementById("skills-screen");
      skillsScreen.style.display = "block";
      skillsScreen.style.opacity = "1";
      skillsScreen.style.pointerEvents = "none";
      skillsScreen.style.border = "3px solid #9b59b6";
      skillsScreen.style.boxShadow = "0 0 20px rgba(155, 89, 182, 0.8)";
      skillsScreen.style.zIndex = "800";
      skillsScreen.style.position = "relative";
      // Position tutorial on right side
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "menu":
      // Show command center in background (replaces old main menu)
      showCommandCenter();
      const cmdCenterScreen = document.getElementById("safehouse");
      if (cmdCenterScreen) {
        cmdCenterScreen.style.opacity = "1";
        cmdCenterScreen.style.pointerEvents = "none";
        cmdCenterScreen.style.border = "3px solid #e74c3c";
        cmdCenterScreen.style.boxShadow = "0 0 20px rgba(231, 76, 60, 0.8)";
        cmdCenterScreen.style.zIndex = "800";
        cmdCenterScreen.style.position = "relative";
      }
      // Position tutorial on right side
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
      
    case "none":
    default:
      // No special UI to show, keep default right position
      if (tutorialContent) {
        tutorialContent.style.marginTop = "80px";
        tutorialContent.style.marginRight = "20px";
      }
      break;
  }
}

// Function to clear all tutorial highlights
function clearTutorialHighlights() {
  // Clear stats bar highlighting
  const statsBar = document.getElementById("stats-bar");
  if (statsBar) {
    statsBar.style.border = "3px solid #e74c3c"; // Original border
    statsBar.style.boxShadow = "none";
    statsBar.style.zIndex = "10"; // Original z-index
    statsBar.style.position = "fixed"; // Original position
  }
  
  // Clear action log highlighting
  const actionLog = document.getElementById("action-log");
  if (actionLog) {
    actionLog.style.border = "2px solid rgba(52, 152, 219, 0.3)"; // Original border
    actionLog.style.boxShadow = "none";
    actionLog.style.zIndex = "10"; // Original z-index
    actionLog.style.position = "fixed"; // Original position
  }
  
  // Clear all game screen highlighting and reset styles
  const screens = ['menu', 'jobs-screen', 'store-screen', 'skills-screen', 'gang-screen', 
          'achievements-screen', 'stolen-cars-screen', 'jailbreak-screen'];
  screens.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.border = "1px solid rgba(52, 152, 219, 0.3)"; // Original border
      screen.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"; // Original shadow
      screen.style.opacity = "1";
      screen.style.pointerEvents = "auto";
      screen.style.zIndex = "auto"; // Reset z-index
      // Don't change position for menu and other main screens - they need to stay fixed
    }
  });
}

// Helper functions to populate content for tutorial
function updateJobsList() {
  let jobListHTML = `
    <h3>Available Jobs</h3>
    <ul>
      ${jobs.map((job, index) => {
        const hasRequirements = hasRequiredItems(job.requiredItems) && player.reputation >= job.reputation;
        const requirementsText = job.requiredItems.length > 0 ? `Required Items: ${job.requiredItems.join(", ")}` : "No required items";
        
        // Calculate actual energy cost with endurance skill
        const actualEnergyCost = Math.max(1, job.energyCost - player.skills.endurance);
        
        let payoutText = "";
        if (job.special === "car_theft") {
          payoutText = "Steal random car to sell";
        } else {
          payoutText = `$${job.payout[0]} to $${job.payout[1]}`;
        }
        
        return `
          <li style="margin: 10px 0; padding: 10px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
            <strong>${job.name}</strong><br>
            💰 Payout: ${payoutText}<br>
            ⚡ Energy Cost: ${actualEnergyCost}<br>
            🚨 Risk: ${job.risk} (${job.jailChance}% jail chance)<br>
            ⭐ Required Reputation: ${job.reputation}<br>
            ${requirementsText}
          </li>
        `;
      }).join('')}
    </ul>
  `;
  document.getElementById("job-list").innerHTML = jobListHTML;
}

function updateStoreDisplay() {
  let storeListHTML = `
    <h3>Available Items</h3>
    <ul>
      ${storeItems.slice(0, 8).map((item, index) => { // Show first 8 items for tutorial
        let description = "";
        if (item.type === "energy") {
          description = `Restores ${item.energyRestore} energy (⚠️ -1 health)`;
        } else if (item.power > 0) {
          description = `+${item.power} power`;
        } else if (item.type === "ammo") {
          description = "Ammunition for guns";
        } else if (item.type === "gas") {
          description = "Fuel for vehicles";
        }
        
        return `
          <li style="margin: 10px 0; padding: 10px; background: rgba(52, 73, 94, 0.6); border-radius: 5px;">
            <strong>${item.name}</strong> - $${item.price}<br>
            ${description}
          </li>
        `;
      }).join('')}
    </ul>
  `;
  document.getElementById("item-list").innerHTML = storeListHTML;
}

function updateSkillsScreenDisplay() {
  let skillsHTML = `
    <h2>Skills</h2>
    <div class="skills-container">
  `;
  
  for (const skill in player.skills) {
    const level = player.skills[skill];
    const cost = level + 1;
    let description = "";
    
    switch (skill) {
      case "stealth":
        description = "Reduces jail chances and improves breakouts";
        break;
      case "violence":
        description = "Increases success rates for combat jobs";
        break;
      case "charisma":
        description = "Better store prices and reduced suspicion";
        break;
      case "intelligence":
        description = "Better success rates overall";
        break;
      case "luck":
        description = "Better random events and payouts";
        break;
      case "endurance":
        description = "Reduces energy costs for all jobs";
        break;
    }
    
    skillsHTML += `
      <div class="skill">
        <h3>${skill.charAt(0).toUpperCase() + skill.slice(1)}</h3>
        <p><strong>Level:</strong> ${level}</p>
        <p><strong>Effect:</strong> ${description}</p>
        <p><strong>Upgrade Cost:</strong> ${cost} skill points</p>
      </div>
    `;
  }
  
  skillsHTML += `
    </div>
    <p><strong>Available Skill Points:</strong> ${player.skillPoints}</p>
    <button onclick="goBackToMainMenu()">Back to SafeHouse</button>
  `;
  
  document.getElementById("skills-content").innerHTML = skillsHTML;
}

function nextTutorialStep() {
  if (currentTutorialStep < tutorialSteps.length - 1) {
    currentTutorialStep++;
    updateTutorialDisplay();
  }
}

function previousTutorialStep() {
  if (currentTutorialStep > 0) {
    currentTutorialStep--;
    updateTutorialDisplay();
  }
}

async function skipTutorial() {
  if (await ui.confirm("Are you sure you want to skip the tutorial? You can always refer to the action log for guidance during gameplay.")) {
    clearTutorialHighlights(); // Clear any tutorial highlighting
    if (tutorialFromMenu) {
      completeTutorialFromMenu();
    } else {
      completeTutorial();
    }
  }
}

function completeTutorial() {
  document.getElementById("tutorial-screen").style.display = "none";
  clearTutorialHighlights(); // Clear any tutorial highlighting
  logAction("🎓 Tutorial completed. You're ready to make your mark on the criminal underworld. Stay sharp out there.");
  
  // If tutorial was started from intro (new game), start the game proper
  // If tutorial was from menu, we should return to main menu
  if (tutorialFromMenu) {
    completeTutorialFromMenu();
  } else {
    startGameAfterIntro();
  }
}

// Function to show tutorial from main menu
function showTutorialFromMenu() {
  // Hide main menu
  goBackToMainMenu();
  document.getElementById("menu").style.display = "none";
  
  // Set flag to indicate tutorial opened from menu
  tutorialFromMenu = true;
  
  // Start tutorial
  currentTutorialStep = 0;
  document.getElementById("tutorial-screen").style.display = "block";
  updateTutorialDisplay();
}

// Function to complete tutorial and return to main menu (for menu-initiated tutorials)
function completeTutorialFromMenu() {
  document.getElementById("tutorial-screen").style.display = "none";
  clearTutorialHighlights(); // Clear any tutorial highlighting
  tutorialFromMenu = false; // Reset the flag
  logAction("🎓 Tutorial reviewed. Time to get back to business.");
  goBackToMainMenu();
}

// Emergency jail release function (for debugging stuck jail issues)
function forceReleaseFromJail() {
  player.inJail = false;
  player.jailTime = 0;
  stopJailTimer();
  updateUI();
  
  logAction("🚨 Emergency release from jail executed!");
  alert("You have been released from jail (emergency override).");
  goBackToMainMenu();
}

// Function to update all jail-related UI elements
function updateJailUI() {
  // Update status bar jail status
  const jailStatusElement = document.getElementById("jail-status");
  if (jailStatusElement) {
    jailStatusElement.innerText = player.inJail ? `${player.jailTime}s` : "Free";
  }
  
  // Update jail screen jail time display
  const jailTimeElement = document.getElementById("jail-time");
  if (jailTimeElement) {
    jailTimeElement.innerText = player.jailTime;
  }
  
}

// Function to update the jail timer
let jailTimerInterval = null;

function stopJailTimer() {
  if (jailTimerInterval) {
    clearInterval(jailTimerInterval);
    jailTimerInterval = null;
  }
}

function updateJailTimer() {
  stopJailTimer();

  if (!player.inJail) {
    return;
  }

  jailTimerInterval = setInterval(() => {
    if (!player.inJail) {
      stopJailTimer();
      return;
    }

    if (player.jailTime > 0) {
      updateJailUI();
      player.jailTime--;

      if (window.EventBus) {
        try { EventBus.emit('jailTimeUpdated', { jailTime: player.jailTime }); } catch (e) {}
      }

      updateJailUI();

      jailPrisoners = jailPrisoners.filter(prisoner => {
        if (prisoner.isPlayer) {
          prisoner.sentence = player.jailTime;
          return true;
        } else {
          prisoner.sentence--;
          if (prisoner.sentence <= 0) {
            logAction(`🚪 ${prisoner.name} walks out the front door, sentence served. They nod at you with respect - you might see them on the streets again.`);
            return false;
          }
          return true;
        }
      });
    } else {
      stopJailTimer();
      player.inJail = false;
      player.jailTime = 0;
      if (window.EventBus) {
        try { EventBus.emit('jailStatusChanged', { inJail: false, jailTime: 0 }); } catch (e) {}
      }
      updateUI();

      alert("You served your sentence and are now free.");
      goBackToMainMenu();
    }
  }, 1000);
}

// Function to show the Court House screen
function showCourtHouse() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("court-house-screen").style.display = "block";
  updateCourtHouseCost();
}

// Function to update the cost of resetting wanted level based on the player's current wanted level
function updateCourtHouseCost() {
  const cost = player.wantedLevel * 500; // Cost based on wanted level
  const resetButton = document.getElementById("reset-wanted-level-court-house");
  resetButton.innerText = `Reset Wanted Level for $${cost}`;
}

// Function to reset wanted level via Court House
function resetWantedLevelCourtHouse() {
  const cost = player.wantedLevel * 500; // Cost based on wanted level
  if (player.money >= cost) {
    player.money -= cost;
    player.wantedLevel = 0;
    updateUI();
    
    // Show narrative message with callback to send to jail
    showNarrativeOverlay(
      "⚖️ Fine Paid Successfully! ⚖️",
      "💰 You've successfully paid your fine to the court and your wanted level has been cleared.<br><br>🏛️ However, as part of your sentence, you must still serve jail time to pay your debt to society.<br><br>🚔 You'll be transferred to your cell immediately to begin serving your sentence.",
      "Report to Jail",
      function() {
        // This callback executes after player clicks the button
        sendToJail(1); // Serve a base jail time since fine was paid
        logAction("⚖️ You walk into the courthouse with cash in hand. Justice may be blind, but it's not deaf to the sound of money. Fine paid, but time must still be served.");
      }
    );
  } else {
    alert("You don't have enough money to reset your wanted level.");
  }
}

// Function to show the inventory screen
function showInventory() {
  hideAllScreens();
  document.getElementById("inventory-screen").style.display = "block";
  
  // Categorize items
  const weapons = player.inventory.filter(i => i.type === 'weapon');
  const armor = player.inventory.filter(i => i.type === 'armor');
  const vehicles = player.inventory.filter(i => i.type === 'car' || i.type === 'vehicle');
  const other = player.inventory.filter(i => !['weapon','armor','car','vehicle'].includes(i.type));
  
  const totalPower = player.inventory.reduce((sum, i) => sum + (i.power || 0), 0);
  
  let html = `
    <h2>🎒 Inventory</h2>
    <div style="padding: 10px; background: rgba(52,73,94,0.6); border-radius: 10px; margin-bottom: 15px;">
      <strong>Total Items:</strong> ${player.inventory.length} | 
      <strong>Total Power:</strong> ${totalPower} | 
      <strong>Ammo:</strong> ${player.ammo} | 
      <strong>Gas:</strong> ${player.gas}
    </div>`;
  
  function renderCategory(title, icon, items) {
    if (items.length === 0) return `<div style="margin-bottom:15px;"><h3 style="color:#95a5a6;">${icon} ${title} <small>(empty)</small></h3></div>`;
    let s = `<div style="margin-bottom:15px;"><h3 style="color:#e67e22;">${icon} ${title}</h3><div style="display:grid;gap:8px;">`;
    items.forEach((item, idx) => {
      const globalIdx = player.inventory.indexOf(item);
      const equipped = player.equippedWeapon === item.name || player.equippedArmor === item.name;
      const sellPrice = Math.floor((item.price || 0) * 0.4);
      s += `<div style="padding:10px;background:rgba(0,0,0,0.4);border-radius:8px;border:2px solid ${equipped ? '#2ecc71' : '#34495e'};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="color:${equipped ? '#2ecc71' : '#ecf0f1'};">${item.name} ${equipped ? '✅ EQUIPPED' : ''}</strong><br>
          <small style="color:#bdc3c7;">Power: +${item.power || 0}${item.price ? ` | Value: $${sellPrice.toLocaleString()}` : ''}</small>
        </div>
        <div style="display:flex;gap:8px;">
          ${(item.type === 'weapon' || item.type === 'armor') && !equipped ? 
            `<button onclick="equipItem(${globalIdx})" style="background:#3498db;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Equip</button>` : ''}
          ${equipped ? 
            `<button onclick="unequipItem(${globalIdx})" style="background:#e67e22;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Unequip</button>` : ''}
          <button onclick="sellItem(${globalIdx})" style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Sell $${sellPrice.toLocaleString()}</button>
        </div>
      </div>`;
    });
    s += '</div></div>';
    return s;
  }
  
  html += renderCategory('Weapons', '🔫', weapons);
  html += renderCategory('Armor', '🛡️', armor);
  html += renderCategory('Vehicles', '🚗', vehicles);
  html += renderCategory('Other Items', '📦', other);
  
  if (player.stolenCars && player.stolenCars.length > 0) {
    html += `<div style="margin-bottom:15px;"><h3 style="color:#e67e22;">🏎️ Stolen Cars (${player.stolenCars.length})</h3><div style="display:grid;gap:8px;">`;
    player.stolenCars.forEach((car, idx) => {
      const selected = player.selectedCar === idx;
      html += `<div style="padding:10px;background:rgba(0,0,0,0.4);border-radius:8px;border:2px solid ${selected ? '#2ecc71' : '#34495e'};display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="color:${selected ? '#2ecc71' : '#ecf0f1'};">${car.name} ${selected ? '🚗 SELECTED' : ''}</strong><br>
          <small style="color:#bdc3c7;">Value: $${car.baseValue.toLocaleString()} | Condition: ${(100 - car.damagePercentage).toFixed(0)}%</small>
        </div>
        <div style="display:flex;gap:8px;">
          ${!selected ? `<button onclick="selectCar(${idx})" style="background:#3498db;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Select</button>` : ''}
          <button onclick="sellStolenCar(${idx})" style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;">Sell</button>
        </div>
      </div>`;
    });
    html += '</div></div>';
  }
  
  html += `<div style="text-align:center;margin-top:20px;">
    <button onclick="goBackToMainMenu()" style="background:#95a5a6;color:white;padding:12px 25px;border:none;border-radius:8px;cursor:pointer;">🏠 Back to Menu</button>
  </div>`;
  
  document.getElementById("inventory-list").innerHTML = html;
}

function equipItem(index) {
  const item = player.inventory[index];
  if (!item) return;
  if (item.type === 'weapon') {
    player.equippedWeapon = item.name;
    logAction(`🔫 Equipped ${item.name}.`);
  } else if (item.type === 'armor') {
    player.equippedArmor = item.name;
    logAction(`🛡️ Equipped ${item.name}.`);
  }
  showInventory();
}

function unequipItem(index) {
  const item = player.inventory[index];
  if (!item) return;
  if (item.type === 'weapon' && player.equippedWeapon === item.name) {
    player.equippedWeapon = null;
    logAction(`Unequipped ${item.name}.`);
  } else if (item.type === 'armor' && player.equippedArmor === item.name) {
    player.equippedArmor = null;
    logAction(`Unequipped ${item.name}.`);
  }
  showInventory();
}

function sellItem(index) {
  const item = player.inventory[index];
  if (!item) return;
  // Unequip if currently equipped
  if (player.equippedWeapon === item.name) player.equippedWeapon = null;
  if (player.equippedArmor === item.name) player.equippedArmor = null;
  
  const sellPrice = Math.floor((item.price || 0) * 0.4);
  player.money += sellPrice;
  player.power -= (item.power || 0);
  player.inventory.splice(index, 1);
  logAction(`💰 Sold ${item.name} for $${sellPrice.toLocaleString()}.`);
  updateUI();
  showInventory();
}

function selectCar(index) {
  player.selectedCar = index;
  showInventory();
}

function sellStolenCar(index) {
  const car = player.stolenCars[index];
  if (!car) return;
  // Minimum scrap value of 5-15% even if totaled
  const rawValue = Math.floor(car.baseValue * ((100 - car.damagePercentage) / 100) * 0.6);
  const scrapValue = Math.floor(car.baseValue * (0.05 + Math.random() * 0.10) * 0.6);
  const sellPrice = Math.max(rawValue, scrapValue);
  player.money += sellPrice;
  if (player.selectedCar === index) player.selectedCar = null;
  else if (player.selectedCar > index) player.selectedCar--;
  player.stolenCars.splice(index, 1);
  logAction(`🏎️ Sold ${car.name} for $${sellPrice.toLocaleString()}.`);
  updateUI();
  showInventory();
}

// ==================== THE FENCE — BLACK MARKET SELL SCREEN ====================
// Dedicated screen for selling stolen goods, contraband, and inventory at premium rates

// Fence price multiplier fluctuates based on various factors
function getFenceMultiplier() {
  const baseRate = 0.55; // Base 55% of item value (vs 40% at regular sell)
  let bonus = 0;
  
  // Negotiation skill equivalent — charisma-like bonus from reputation
  bonus += Math.min(0.15, player.reputation / 10000 * 0.15); // Up to +15% at 10K rep
  
  // Chop Shop synergy — better rates for cars
  const chopShop = (player.businesses || []).find(b => b.type === 'chopshop');
  const chopBonus = chopShop ? 0.05 + (chopShop.level * 0.03) : 0; // 8-20%
  
  // Heat penalty — suspicious sellers get worse deals
  const heatPenalty = Math.min(0.15, (player.suspicionLevel || 0) / 100 * 0.15);
  
  // Random market fluctuation (-5% to +10%)
  const marketFlux = -0.05 + Math.random() * 0.15;
  
  return {
    items: Math.max(0.35, baseRate + bonus - heatPenalty + marketFlux),
    cars: Math.max(0.45, baseRate + bonus + chopBonus - heatPenalty + marketFlux),
    drugs: Math.max(0.50, 0.65 + bonus - heatPenalty + marketFlux), // Drugs sell at premium
    chopBonus: chopBonus,
    heatPenalty: heatPenalty,
    marketCondition: marketFlux > 0.05 ? 'Hot' : marketFlux > -0.02 ? 'Normal' : 'Cold'
  };
}

function showFence() {
  hideAllScreens();
  const fenceScreen = document.getElementById("fence-screen");
  if (!fenceScreen) return;
  fenceScreen.style.display = "block";
  
  const rates = getFenceMultiplier();
  const container = document.getElementById("fence-content");
  if (!container) return;
  
  // Market condition colors
  const condColor = rates.marketCondition === 'Hot' ? '#2ecc71' : rates.marketCondition === 'Cold' ? '#e74c3c' : '#f39c12';
  
  let html = `
    <div style="background: linear-gradient(135deg, rgba(44, 62, 80, 0.9), rgba(52, 73, 94, 0.9)); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #8e44ad;">
      <h3 style="color: #8e44ad; margin-bottom: 10px;">📊 Today's Fence Rates</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center;">
          <div style="color: #bdc3c7; font-size: 0.8em;">Items</div>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">${Math.round(rates.items * 100)}%</div>
        </div>
        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center;">
          <div style="color: #bdc3c7; font-size: 0.8em;">Vehicles</div>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">${Math.round(rates.cars * 100)}%</div>
        </div>
        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center;">
          <div style="color: #bdc3c7; font-size: 0.8em;">Contraband</div>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">${Math.round(rates.drugs * 100)}%</div>
        </div>
        <div style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center;">
          <div style="color: #bdc3c7; font-size: 0.8em;">Market</div>
          <div style="color: ${condColor}; font-size: 1.2em; font-weight: bold;">${rates.marketCondition}</div>
        </div>
      </div>
      ${rates.heatPenalty > 0.03 ? `<p style="color: #e74c3c; font-size: 0.85em; margin-top: 8px;">⚠️ Your heat is bringing down prices. Lay low to get better deals.</p>` : ''}
      ${rates.chopBonus > 0 ? `<p style="color: #2ecc71; font-size: 0.85em; margin-top: 4px;">🔧 Chop Shop connection: +${Math.round(rates.chopBonus * 100)}% on vehicle sales</p>` : ''}
    </div>`;
  
  // === STOLEN CARS SECTION ===
  const stolenCars = player.stolenCars || [];
  html += `<div style="margin-bottom: 20px;">
    <h3 style="color: #e67e22; margin-bottom: 10px;">🏎️ Hot Wheels (${stolenCars.length})</h3>`;
  
  if (stolenCars.length === 0) {
    html += `<div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; text-align: center; color: #7f8c8d;">
      <p>No stolen vehicles to move. Boost some rides first.</p>
    </div>`;
  } else {
    html += `<div style="display: grid; gap: 8px;">`;
    stolenCars.forEach((car, idx) => {
      const condition = 100 - car.damagePercentage;
      const fencePrice = Math.floor(car.baseValue * (condition / 100) * rates.cars);
      const regularPrice = Math.floor(car.baseValue * (condition / 100) * 0.6);
      const premium = fencePrice - regularPrice;
      const condColor = condition > 70 ? '#2ecc71' : condition > 40 ? '#f39c12' : '#e74c3c';
      
      html += `<div style="padding: 12px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid #34495e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: #ecf0f1;">${car.name}</strong><br>
          <small style="color: #bdc3c7;">
            Base: $${car.baseValue.toLocaleString()} | Condition: <span style="color: ${condColor};">${condition.toFixed(0)}%</span>
          </small><br>
          <small style="color: #8e44ad;">Fence price: $${fencePrice.toLocaleString()} <span style="color: #2ecc71;">(+$${premium.toLocaleString()} vs street)</span></small>
        </div>
        <button onclick="fenceSellCar(${idx})" style="background: #8e44ad; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; white-space: nowrap;">
          Sell $${fencePrice.toLocaleString()}
        </button>
      </div>`;
    });
    html += `</div>`;
    if (stolenCars.length > 1) {
      html += `<button onclick="fenceSellAllCars()" style="background: #c0392b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; font-weight: bold;">
        🏎️ Sell All Vehicles ($${stolenCars.reduce((sum, car) => sum + Math.floor(car.baseValue * ((100 - car.damagePercentage) / 100) * rates.cars), 0).toLocaleString()})
      </button>`;
    }
  }
  html += `</div>`;
  
  // === SELLABLE INVENTORY ITEMS ===
  const sellableItems = (player.inventory || []).filter(item => {
    return item.price && item.price > 0 && item.name !== player.equippedWeapon && item.name !== player.equippedArmor;
  });
  
  // Separate drugs from regular items
  const drugItems = sellableItems.filter(i => i.type === 'highLevelDrug');
  const regularItems = sellableItems.filter(i => i.type !== 'highLevelDrug');
  
  // Drug contraband section
  html += `<div style="margin-bottom: 20px;">
    <h3 style="color: #e74c3c; margin-bottom: 10px;">💊 Contraband (${drugItems.length})</h3>`;
  if (drugItems.length === 0) {
    html += `<div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; text-align: center; color: #7f8c8d;">
      <p>No contraband to move. Buy from the Black Market or cook in your Drug Lab.</p>
    </div>`;
  } else {
    html += `<div style="display: grid; gap: 8px;">`;
    drugItems.forEach(item => {
      const globalIdx = player.inventory.indexOf(item);
      const fencePrice = Math.floor(item.price * rates.drugs);
      const maxPayout = item.maxPayout || Math.floor(item.price * 1.5);
      
      html += `<div style="padding: 12px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid #e74c3c40; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: #ecf0f1;">${item.name}</strong><br>
          <small style="color: #bdc3c7;">Bought at: $${item.price.toLocaleString()} | Max street value: $${maxPayout.toLocaleString()}</small><br>
          <small style="color: #8e44ad;">Fence price: $${fencePrice.toLocaleString()}</small>
        </div>
        <button onclick="fenceSellItem(${globalIdx}, 'drug')" style="background: #e74c3c; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; white-space: nowrap;">
          Sell $${fencePrice.toLocaleString()}
        </button>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  
  // Regular items section
  html += `<div style="margin-bottom: 20px;">
    <h3 style="color: #3498db; margin-bottom: 10px;">📦 Merchandise (${regularItems.length})</h3>`;
  if (regularItems.length === 0) {
    html += `<div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; text-align: center; color: #7f8c8d;">
      <p>No merchandise to fence. Equipped items can't be sold here — unequip first.</p>
    </div>`;
  } else {
    html += `<div style="display: grid; gap: 8px;">`;
    regularItems.forEach(item => {
      const globalIdx = player.inventory.indexOf(item);
      const fencePrice = Math.floor(item.price * rates.items);
      const regularSellPrice = Math.floor(item.price * 0.4);
      const premium = fencePrice - regularSellPrice;
      
      html += `<div style="padding: 12px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid #34495e; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: #ecf0f1;">${item.name}</strong> ${item.power ? `<small style="color: #bdc3c7;">(+${item.power} Power)</small>` : ''}<br>
          <small style="color: #bdc3c7;">Value: $${item.price.toLocaleString()} | Regular sell: $${regularSellPrice.toLocaleString()}</small><br>
          <small style="color: #8e44ad;">Fence price: $${fencePrice.toLocaleString()} <span style="color: #2ecc71;">(+$${premium.toLocaleString()})</span></small>
        </div>
        <button onclick="fenceSellItem(${globalIdx}, 'item')" style="background: #8e44ad; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; white-space: nowrap;">
          Sell $${fencePrice.toLocaleString()}
        </button>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  
  // Suspicion warning
  html += `<div style="padding: 12px; background: rgba(142, 68, 173, 0.15); border-radius: 10px; border: 1px solid #8e44ad40; margin-bottom: 15px; text-align: center;">
    <small style="color: #bdc3c7;">⚠️ Selling through the fence adds +1 suspicion per transaction. Move product carefully.</small>
  </div>`;
  
  html += `<div style="text-align: center;">
    <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">🏠 Back to Menu</button>
  </div>`;
  
  container.innerHTML = html;
}

function fenceSellItem(index, type) {
  const item = player.inventory[index];
  if (!item) return;
  
  const rates = getFenceMultiplier();
  const rate = type === 'drug' ? rates.drugs : rates.items;
  const fencePrice = Math.floor(item.price * rate);
  
  // Unequip if equipped
  if (player.equippedWeapon === item.name) player.equippedWeapon = null;
  if (player.equippedArmor === item.name) player.equippedArmor = null;
  
  player.money += fencePrice;
  player.power -= (item.power || 0);
  player.inventory.splice(index, 1);
  player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + 1);
  
  if (player.statistics) {
    player.statistics.totalEarnings = (player.statistics.totalEarnings || 0) + fencePrice;
  }
  
  logAction(`🤫 Fenced ${item.name} for $${fencePrice.toLocaleString()} (${Math.round(rate * 100)}% rate). +1 suspicion.`);
  updateUI();
  showFence();
}

function fenceSellCar(index) {
  const car = player.stolenCars[index];
  if (!car) return;
  
  const rates = getFenceMultiplier();
  const condition = 100 - car.damagePercentage;
  const fencePrice = Math.floor(car.baseValue * (condition / 100) * rates.cars);
  
  player.money += fencePrice;
  if (player.selectedCar === index) player.selectedCar = null;
  else if (player.selectedCar > index) player.selectedCar--;
  player.stolenCars.splice(index, 1);
  player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + 1);
  
  if (player.statistics) {
    player.statistics.totalEarnings = (player.statistics.totalEarnings || 0) + fencePrice;
    player.statistics.carsStolen = (player.statistics.carsStolen || 0); // Already tracked
  }
  
  logAction(`🤫 Fenced ${car.name} for $${fencePrice.toLocaleString()} through the Fence. +1 suspicion.`);
  updateUI();
  showFence();
}

function fenceSellAllCars() {
  const rates = getFenceMultiplier();
  let totalEarned = 0;
  let count = player.stolenCars.length;
  
  player.stolenCars.forEach(car => {
    const condition = 100 - car.damagePercentage;
    totalEarned += Math.floor(car.baseValue * (condition / 100) * rates.cars);
  });
  
  player.money += totalEarned;
  player.stolenCars = [];
  player.selectedCar = null;
  player.suspicionLevel = Math.min(100, (player.suspicionLevel || 0) + Math.ceil(count * 0.5));
  
  if (player.statistics) {
    player.statistics.totalEarnings = (player.statistics.totalEarnings || 0) + totalEarned;
  }
  
  logAction(`🤫 Bulk fenced ${count} vehicles for $${totalEarned.toLocaleString()} through the Fence. +${Math.ceil(count * 0.5)} suspicion.`);
  updateUI();
  showFence();
}

// Function to show the hospital screen
function showHospital() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("hospital-screen").style.display = "block";
  renderHospitalContent();
}

function renderHospitalContent() {
  const container = document.getElementById("hospital-content");
  if (!container) return;
  
  const missingHealth = 100 - player.health;
  const fullHealCost = missingHealth * 10;
  const partialHealAmount = 25;
  const partialHealCost = Math.min(missingHealth, partialHealAmount) * 8; // Slightly cheaper per HP
  const restHealAmount = Math.min(15, missingHealth);
  const restEnergyCost = 20;
  
  // Health bar color
  const healthColor = player.health > 60 ? '#2ecc71' : player.health > 30 ? '#f39c12' : '#e74c3c';
  const healthBar = `<div style="background: #333; border-radius: 8px; height: 24px; margin: 10px 0 20px; overflow: hidden; border: 1px solid #555;">
    <div style="background: ${healthColor}; height: 100%; width: ${player.health}%; transition: width 0.5s; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85em; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
      ${player.health}/100 HP
    </div>
  </div>`;
  
  let html = `<div class="content-card">${healthBar}`;
  
  if (player.health >= 100) {
    html += `<p style="color: #2ecc71; text-align: center; font-size: 1.1em;">✅ You're in perfect health. No treatment needed.</p>`;
  } else {
    html += `<div class="hospital-services">`;
    
    // Full heal
    html += `<div class="hospital-option">
      <div class="hospital-option-header">
        <span class="hospital-icon">💉</span>
        <div>
          <strong>Full Treatment</strong>
          <p>The doc patches you up completely. No questions asked.</p>
        </div>
      </div>
      <div class="hospital-option-footer">
        <span class="hospital-cost">$${fullHealCost.toLocaleString()}</span>
        <button onclick="healAtHospital('full')" ${player.money < fullHealCost ? 'disabled' : ''}>
          ${player.money < fullHealCost ? 'Can\'t Afford' : `Heal to 100% (+${missingHealth} HP)`}
        </button>
      </div>
    </div>`;
    
    // Partial heal (if missing more than 25)
    if (missingHealth > 10) {
      html += `<div class="hospital-option">
        <div class="hospital-option-header">
          <span class="hospital-icon">🩹</span>
          <div>
            <strong>Quick Patch-Up</strong>
            <p>A hasty job — bandages and painkillers. Gets you back on the street fast.</p>
          </div>
        </div>
        <div class="hospital-option-footer">
          <span class="hospital-cost">$${partialHealCost.toLocaleString()}</span>
          <button onclick="healAtHospital('partial')" ${player.money < partialHealCost ? 'disabled' : ''}>
            ${player.money < partialHealCost ? 'Can\'t Afford' : `Patch Up (+${Math.min(missingHealth, partialHealAmount)} HP)`}
          </button>
        </div>
      </div>`;
    }
    
    // Rest option (free but costs energy)
    html += `<div class="hospital-option">
      <div class="hospital-option-header">
        <span class="hospital-icon">🛏️</span>
        <div>
          <strong>Rest & Recover</strong>
          <p>Lay low for a while. Free, but drains your energy.</p>
        </div>
      </div>
      <div class="hospital-option-footer">
        <span class="hospital-cost" style="color: #3498db;">⚡ ${restEnergyCost} Energy</span>
        <button onclick="healAtHospital('rest')" ${player.energy < restEnergyCost || restHealAmount <= 0 ? 'disabled' : ''}>
          ${player.energy < restEnergyCost ? 'Not Enough Energy' : restHealAmount <= 0 ? 'Too Healthy to Rest' : `Rest (+${restHealAmount} HP)`}
        </button>
      </div>
    </div>`;
    
    html += `</div>`; // close hospital-services
  }
  
  html += `</div>`; // close content-card
  container.innerHTML = html;
}

// Function to heal player at the hospital
function healAtHospital(healType) {
  const missingHealth = 100 - player.health;
  
  if (healType === 'full') {
    const cost = missingHealth * 10;
    if (player.money < cost) {
      alert("You don't have enough money to heal to full health.");
      return;
    }
    player.money -= cost;
    player.health = 100;
    alert("You have been healed to full health.");
    logAction("🏥 Clean white sheets and the smell of antiseptic. The doc patches you up with no questions asked — some debts are paid in silence (Full health restored).");
  } else if (healType === 'partial') {
    const healAmount = Math.min(missingHealth, 25);
    const cost = healAmount * 8;
    if (player.money < cost) {
      alert("You don't have enough money for this treatment.");
      return;
    }
    player.money -= cost;
    player.health = Math.min(100, player.health + healAmount);
    alert(`Quick patch-up done. Restored ${healAmount} health.`);
    logAction(`🩹 A quick patch job — bandages, painkillers and a shot of whiskey. Good enough to get back on the streets (+${healAmount} HP).`);
  } else if (healType === 'rest') {
    if (player.energy < 20) {
      alert("You're too exhausted to rest effectively.");
      return;
    }
    const healAmount = Math.min(15, missingHealth);
    player.energy -= 20;
    player.health = Math.min(100, player.health + healAmount);
    alert(`You rested and recovered ${healAmount} health.`);
    logAction(`🛏️ You find a quiet corner and lay low for a while. Sleep does its work slowly but surely (+${healAmount} HP, -20 energy).`);
  }
  
  updateUI();
  renderHospitalContent();
}

// Function to show the death screen
function showDeathScreen(causeOfDeath) {
  // PERMADEATH: Delete the save file
  if (typeof SAVE_SYSTEM !== 'undefined' && SAVE_SYSTEM.currentSlot) {
    try {
      localStorage.removeItem(`gameSlot_${SAVE_SYSTEM.currentSlot}`);
      
      // Disable autosave to prevent resurrection
      SAVE_SYSTEM.autoSaveEnabled = false;
    } catch (e) {
      console.error("Failed to delete save on death:", e);
    }
  }

  // Build obituary
  const cause = causeOfDeath || "Died on the streets";
  const totalCrimes = (player.playstyleStats.stealthyJobs || 0) + (player.playstyleStats.violentJobs || 0) + (player.playstyleStats.diplomaticActions || 0);
  const gangSize = player.gang ? player.gang.members : 0;
  const territoriesOwned = player.territories ? player.territories.length : 0;
  const businessCount = player.businesses ? player.businesses.length : 0;
  const propertiesOwned = player.realEstate ? player.realEstate.ownedProperties.length : 0;
  const highestSkill = Object.entries(player.skills).reduce((a, b) => b[1] > a[1] ? b : a, ['none', 0]);

  // Determine legacy title
  let legacyTitle = 'Street Rat';
  if (player.level >= 50) legacyTitle = 'Legendary Kingpin';
  else if (player.level >= 35) legacyTitle = 'Crime Lord';
  else if (player.level >= 25) legacyTitle = 'Underboss';
  else if (player.level >= 15) legacyTitle = 'Made Man';
  else if (player.level >= 10) legacyTitle = 'Enforcer';
  else if (player.level >= 5) legacyTitle = 'Hustler';

  // Flavor text based on how they died
  const flavorTexts = [
    "The streets always collect their debt.",
    "Another name etched into the city's dark history.",
    "They'll pour one out for you... maybe.",
    "The empire crumbles. The throne sits empty.",
    "In this business, everyone's time runs out eventually."
  ];
  const flavorEl = document.getElementById('death-flavor');
  if (flavorEl) flavorEl.textContent = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];

  const obituaryEl = document.getElementById('death-obituary');
  if (obituaryEl) {
    obituaryEl.innerHTML = `
      <div class="obituary-card">
        <div class="obituary-header">
          <div class="obituary-portrait">${player.portrait || '💀'}</div>
          <div class="obituary-name-block">
            <h3>${player.name || 'Unknown'}</h3>
            <span class="obituary-title">${legacyTitle} — Level ${player.level}</span>
          </div>
        </div>
        <div class="obituary-cause">☠️ ${cause}</div>
        <div class="obituary-stats">
          <div class="obit-stat"><span class="obit-label">💰 Net Worth</span><span class="obit-value">$${(player.money || 0).toLocaleString()}</span></div>
          <div class="obit-stat"><span class="obit-label">⚔️ Crimes Committed</span><span class="obit-value">${totalCrimes}</span></div>
          <div class="obit-stat"><span class="obit-label">👥 Gang Size</span><span class="obit-value">${gangSize}</span></div>
          <div class="obit-stat"><span class="obit-label">🏘️ Territories</span><span class="obit-value">${territoriesOwned}</span></div>
          <div class="obit-stat"><span class="obit-label">🏢 Businesses</span><span class="obit-value">${businessCount}</span></div>
          <div class="obit-stat"><span class="obit-label">🏠 Properties</span><span class="obit-value">${propertiesOwned}</span></div>
          <div class="obit-stat"><span class="obit-label">⭐ Best Skill</span><span class="obit-value">${highestSkill[0]} (${highestSkill[1]})</span></div>
          <div class="obit-stat"><span class="obit-label">🎰 Gambling Wins</span><span class="obit-value">${player.playstyleStats.gamblingWins || 0}</span></div>
        </div>
      </div>
    `;
  }

  // Hall of Fame - save to localStorage
  const hallOfFame = JSON.parse(localStorage.getItem('kingpinHallOfFame') || '[]');
  hallOfFame.push({
    name: player.name || 'Unknown',
    level: player.level,
    title: legacyTitle,
    money: player.money || 0,
    cause: cause,
    date: new Date().toLocaleDateString()
  });
  hallOfFame.sort((a, b) => b.level - a.level || b.money - a.money);
  if (hallOfFame.length > 10) hallOfFame.length = 10; // Keep top 10
  localStorage.setItem('kingpinHallOfFame', JSON.stringify(hallOfFame));

  const hofEl = document.getElementById('death-hall-of-fame');
  if (hofEl && hallOfFame.length > 0) {
    hofEl.innerHTML = `
      <div class="hof-section">
        <h4>🏛️ Hall of Fallen Kingpins</h4>
        <div class="hof-list">
          ${hallOfFame.map((entry, i) => `
            <div class="hof-entry ${entry.name === player.name && entry.date === new Date().toLocaleDateString() ? 'hof-current' : ''}">
              <span class="hof-rank">#${i + 1}</span>
              <span class="hof-name">${entry.name}</span>
              <span class="hof-detail">Lv.${entry.level} ${entry.title}</span>
              <span class="hof-money">$${entry.money.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById("menu").style.display = "none";
  document.getElementById("death-screen").style.display = "flex";
}

// Function to restart the game
function restartGame() {
  resetPlayerForNewGame();
  stopJailTimer();
  
  // Clear jail prisoners
  jailPrisoners = [];
  jailbreakPrisoners = [];
  
  // Reset achievements
  achievements.forEach(achievement => achievement.unlocked = false);
  
  // Reset weekly challenges
  if (typeof weeklyChallenges !== 'undefined') {
    weeklyChallenges.length = 0;
  }
  
  updateUI();
  logAction("🔄 The slate is wiped clean. Back to the bottom of the food chain, but every kingpin started somewhere. Time to climb again.");
  
  // Start fresh character creation (intro screen removed)
  document.getElementById("death-screen").style.display = "none";
  startGame();
}

// Function to show achievements
function showAchievements() {
  if (player.inJail) {
    showBriefNotification("You can't view achievements while in jail!", 'warning');
    return;
  }
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPct = Math.floor((unlockedCount / totalCount) * 100);
  
  // Group achievements by category
  const categories = [
    { name: 'Early Game', icon: '🌱', ids: ['first_job','first_blood','wheels','armed_dangerous','property_owner'] },
    { name: 'Money Milestones', icon: '💰', ids: ['millionaire','half_mil','true_millionaire','multi_millionaire','billionaire'] },
    { name: 'Gang & Social', icon: '👥', ids: ['first_recruit','gang_leader','crime_family','army','faction_friend','faction_ally'] },
    { name: 'Combat & Crime', icon: '⚔️', ids: ['jail_break','most_wanted','ghost','boss_slayer'] },
    { name: 'Progression', icon: '📈', ids: ['reputation_max','level_10','level_25','level_50','skill_master'] },
    { name: 'Empire', icon: '🏛️', ids: ['territory_3','territory_10','business_owner','jobs_50','jobs_200'] },
    { name: 'Mini-Games', icon: '🎮', ids: ['lucky_streak','gambler','snake_king','quick_draw'] }
  ];
  
  let achievementsHTML = `
    <h2>🏆 Achievements</h2>
    
    <!-- Progress bar -->
    <div style="margin: 15px 0 25px; background: rgba(0,0,0,0.3); border-radius: 10px; padding: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #f1c40f; font-weight: bold;">${unlockedCount} / ${totalCount} Unlocked</span>
        <span style="color: #95a5a6;">${progressPct}%</span>
      </div>
      <div style="background: rgba(0,0,0,0.4); border-radius: 6px; height: 12px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #f39c12, #f1c40f); height: 100%; width: ${progressPct}%; border-radius: 6px; transition: width 0.5s;"></div>
      </div>
    </div>
  `;
  
  categories.forEach(cat => {
    const catAchievements = cat.ids.map(id => achievements.find(a => a.id === id)).filter(Boolean);
    const catUnlocked = catAchievements.filter(a => a.unlocked).length;
    
    achievementsHTML += `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #f39c12; border-bottom: 1px solid rgba(243,156,18,0.3); padding-bottom: 8px; margin-bottom: 12px;">
          ${cat.icon} ${cat.name} <span style="font-size: 0.7em; color: #95a5a6;">(${catUnlocked}/${catAchievements.length})</span>
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px;">
          ${catAchievements.map(a => {
            return `
              <div style="background: ${a.unlocked ? 'rgba(46, 204, 113, 0.15)' : 'rgba(0,0,0,0.3)'}; 
                    padding: 12px; border-radius: 8px; 
                    border: 1px solid ${a.unlocked ? '#2ecc71' : '#555'}; 
                    opacity: ${a.unlocked ? '1' : '0.7'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: ${a.unlocked ? '#2ecc71' : '#ecf0f1'};">${a.name}</strong>
                  <span style="font-size: 1.2em;">${a.unlocked ? '✅' : '🔒'}</span>
                </div>
                <p style="color: #bdc3c7; font-size: 0.85em; margin: 5px 0 3px;">${a.description}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });
  
  achievementsHTML += `
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="showHallOfFame()" style="background: linear-gradient(45deg, #f39c12, #e67e22); color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">🏛️ Hall of Fame</button>
      <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">🏠 SafeHouse</button>
    </div>
  `;

  document.getElementById("achievements-content").innerHTML = achievementsHTML;
  hideAllScreens();
  document.getElementById("achievements-screen").style.display = "block";
}

// Function to trigger random events
function triggerRandomEvent() {
  // Weighted events: higher weight = more likely. Balanced mix of positive/negative/neutral.
  const events = [
    { name: "Police Raid", action: policeRaid, message: null, weight: 10 },
    { name: "Black Market Sale", action: randomSale, message: null, weight: 8 },
    { name: "Lucky Find", action: luckyFind, message: null, weight: 12 },
    { name: "Gang Recruitment", action: gangRecruitment, message: null, weight: 10 },
    { name: "Territory Dispute", action: territoryDispute, message: null, weight: 8 },
    { name: "Police Informant", action: policeInformant, message: null, weight: 6 },
    { name: "Mysterious Tip", action: mysteriousTip, message: null, weight: 10 },
    { name: "Health Scare", action: healthScare, message: null, weight: 7 },
    { name: "Rival Offer", action: rivalOffer, message: null, weight: 6 },
    { name: "Street Cred", action: streetCredEvent, message: null, weight: 8 },
    { name: "Equipment Bonus", action: equipmentBonus, message: null, weight: 5 }
  ];

  // Weighted random selection
  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = events[0];
  for (const e of events) {
    roll -= e.weight;
    if (roll <= 0) { selected = e; break; }
  }

  selected.action();
  if (selected.message) {
    showBriefNotification(selected.message, 3000);
    logAction(selected.message);
  }
}

// Enhanced random event functions
function policeRaid() {
  let wantedIncrease = Math.floor(Math.random() * 5) + 1;
  // Stealth skill can reduce the impact
  wantedIncrease = Math.max(1, wantedIncrease - player.skills.stealth);
  player.wantedLevel += wantedIncrease;
  showBriefNotification(`🚨 Police Raid! Wanted +${wantedIncrease}`, 3000);
  logAction(`🚨 A police raid sweeps through your area! Wanted level increased by ${wantedIncrease}. ${player.skills.stealth > 0 ? 'Your stealth skills minimized the damage.' : ''}`);
  updateUI();
}

// Store original prices so sales can be restored cleanly
let _originalStorePrices = null;
let _saleActive = false;

function randomSale() {
  if (_saleActive) return; // Don't stack sales
  _saleActive = true;
  // Save original prices on first sale
  _originalStorePrices = storeItems.map(item => item.price);
  storeItems.forEach(item => {
    item.price = Math.floor(item.price * 0.7); // Reduce prices by 30%
  });
  showBriefNotification('💰 Black Market Flash Sale! Store prices reduced 30% for 2 minutes!', 4000);
  logAction('💰 A Black Market Flash Sale has started! Store prices are reduced by 30% for the next 2 minutes.');
  setTimeout(() => {
    // Restore exact original prices
    if (_originalStorePrices) {
      storeItems.forEach((item, i) => {
        item.price = _originalStorePrices[i];
      });
      _originalStorePrices = null;
    }
    _saleActive = false;
    showBriefNotification('💰 Flash Sale has ended. Prices are back to normal.', 2000);
  }, 120000);
}

function luckyFind() {
  // Scale lucky find with player level so it stays relevant
  const base = 75 + player.level * 25;
  let found = Math.floor(Math.random() * base) + base;
  found += Math.floor(found * (player.skills.luck * 0.05));
  player.money += found;
  showBriefNotification(`💵 Lucky find! +$${found.toLocaleString()}`, 3000);
  logAction(`💵 You stumble upon a hidden stash on the street. $${found.toLocaleString()} richer!`);
  updateUI();
}

// === NEW RANDOM EVENTS ===

function mysteriousTip() {
  // Gives the player a small XP boost and a bit of reputation
  const xpGain = 4 + player.level * 1;
  const repGain = Math.floor(Math.random() * 2) + 1;
  gainExperience(xpGain);
  player.reputation += repGain;
  showBriefNotification(`💬 Mysterious tip! +${xpGain} XP, +${repGain} Rep`, 3000);
  logAction(`💬 An informant slips you a useful tip about the city's operations. You gain insight (+${xpGain} XP) and your name spreads further (+${repGain} reputation).`);
  updateUI();
}

function healthScare() {
  // Small random health loss, offset by endurance skill
  const baseLoss = Math.floor(Math.random() * 15) + 5;
  const reduction = Math.min(baseLoss - 1, player.skills.endurance * 2);
  const actualLoss = Math.max(1, baseLoss - reduction);
  player.health = Math.max(1, player.health - actualLoss);
  showBriefNotification(`🩸 Health scare! -${actualLoss} HP`, 3000);
  logAction(`🩸 A rough night takes its toll. You lose ${actualLoss} health. ${reduction > 0 ? 'Your endurance training softened the blow.' : 'Take it easy.'}`);
  updateUI();
}

function rivalOffer() {
  // A rival offers you a quick cash deal - take it and lose some rep, or ignore it
  const cashOffer = Math.floor(5000 + player.level * 1500 + Math.random() * 5000);
  const repCost = Math.floor(Math.random() * 3) + 2;
  player.money += cashOffer;
  player.reputation = Math.max(0, player.reputation - repCost);
  showBriefNotification(`🤝 Rival offer: +$${cashOffer.toLocaleString()}, -${repCost} rep`, 3000);
  logAction(`🤝 A rival gang approaches with a cash offer you can't refuse. You pocket $${cashOffer.toLocaleString()}, but it costs you ${repCost} reputation on the streets.`);
  updateUI();
}

function streetCredEvent() {
  // Pure reputation boost based on current standing
  const repGain = Math.floor(Math.random() * 5) + 2 + Math.floor(player.level / 5);
  player.reputation += repGain;
  showBriefNotification(`⭐ Street cred! +${repGain} reputation`, 3000);
  logAction(`⭐ Word of your exploits spreads through the underworld. Your reputation grows by ${repGain}.`);
  updateUI();
}

function equipmentBonus() {
  // Free ammo or gas based on what the player has
  const roll = Math.random();
  if (roll < 0.5) {
    const ammoGain = Math.floor(Math.random() * 5) + 2;
    player.ammo += ammoGain;
    showBriefNotification(`📦 Supply drop! +${ammoGain} ammo`, 3000);
    logAction(`📦 One of your contacts leaves a package at the dead drop. Inside: ${ammoGain} rounds of ammunition.`);
  } else {
    const gasGain = Math.floor(Math.random() * 3) + 1;
    player.gas += gasGain;
    showBriefNotification(`⛽ Supply drop! +${gasGain} gas`, 3000);
    logAction(`⛽ A friendly mechanic tops off your fuel reserves. +${gasGain} gasoline.`);
  }
  updateUI();
}

function gangRecruitment() {
  if (player.reputation >= 20 && Math.random() < 0.3) {
    // Clear any existing recruitment event
    if (activeRecruitment) {
      clearTimeout(recruitmentTimer);
      activeRecruitment = null;
    }
    
    // Generate a random recruit
    const recruitNames = [
      "Tony 'The Hammer'", "Silky Sullivan", "Mad Dog Martinez", "Fast Eddie", 
      "Lucky Lucia", "Ice Cold Ivan", "Smoky Joe", "Diamond Diana", 
      "Razor Ramon", "Ghost Garcia", "Knuckles Kelly", "Viper Vince"
    ];
    
    const skills = ['lockpicking', 'getaway driving', 'intimidation', 'street smarts', 'connections', 'muscle'];
    
    const recruit = {
      name: recruitNames[Math.floor(Math.random() * recruitNames.length)],
      skill: skills[Math.floor(Math.random() * skills.length)],
      cost: Math.floor(Math.random() * 3000) + 1000, // $1,000 - $4,000
      loyalty: Math.floor(Math.random() * 30) + 70, // 70-100 loyalty
      power: Math.floor(Math.random() * 15) + 5 // 5-20 power
    };
    
    activeRecruitment = recruit;
    
    // Create clickable action log entry
    const recruitmentId = 'recruitment-' + Date.now();
    logAction(`🤝 <strong>${recruit.name}</strong> approaches you in the shadows. They've heard about your reputation and want to join your crew for <strong>$${recruit.cost.toLocaleString()}</strong>. 
          Specializes in <em>${recruit.skill}</em> (+${recruit.power} power, ${recruit.loyalty}% loyalty). 
          <button id="${recruitmentId}" onclick="hireRandomRecruit('${recruitmentId}')" style="background: #27ae60; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; font-weight: bold;">
            Hire for $${recruit.cost.toLocaleString()}
          </button>
          <span id="${recruitmentId}-timer" style="color: #e74c3c; margin-left: 10px; font-weight: bold;">2:00</span>`);
    
    // Start 2-minute countdown
    let timeLeft = 120; // 2 minutes in seconds
    recruitmentTimer = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timerElement = document.getElementById(`${recruitmentId}-timer`);
      
      if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
          timerElement.style.color = '#e74c3c'; // Red for last 30 seconds
        } else if (timeLeft <= 60) {
          timerElement.style.color = '#f39c12'; // Orange for last minute
        }
      }
      
      if (timeLeft <= 0) {
        clearTimeout(recruitmentTimer);
        activeRecruitment = null;
        
        // Disable button and show expired message
        const buttonElement = document.getElementById(recruitmentId);
        if (buttonElement) {
          buttonElement.disabled = true;
          buttonElement.style.background = '#7f8c8d';
          buttonElement.style.cursor = 'not-allowed';
          buttonElement.textContent = 'Opportunity Expired';
        }
        
        if (timerElement) {
          timerElement.textContent = 'EXPIRED';
          timerElement.style.color = '#7f8c8d';
        }
        
        logAction(`💨 ${recruit.name} grows impatient and disappears into the night. The opportunity has passed.`);
      }
    }, 1000);
  }
}

// Function to hire a random recruit from the action log
async function hireRandomRecruit(buttonId) {
  if (!activeRecruitment) {
    alert("This recruitment opportunity has expired.");
    return;
  }
  
  const recruit = activeRecruitment;
  
  // Check if player can afford
  if (player.money < recruit.cost) {
    alert(`You need $${recruit.cost.toLocaleString()} to hire ${recruit.name}.`);
    return;
  }
  
  // Check gang capacity
  const maxMembers = calculateMaxGangMembers();
  if (player.gang.gangMembers.length >= maxMembers) {
    alert(`Your gang is at capacity (${maxMembers} members). You need more properties to expand.`);
    return;
  }
  
  // Hire the recruit
  player.money -= recruit.cost;
  player.power += recruit.power;
  
  // Track statistics
  updateStatistic('gangMembersRecruited');
  
  // Add to gang
  const newMember = {
    name: recruit.name,
    skill: recruit.skill,
    loyalty: recruit.loyalty,
    power: recruit.power,
    joinedDate: Date.now()
  };
  player.gang.gangMembers.push(newMember);
  player.gang.members = player.gang.gangMembers.length; // Keep count in sync
  
  // Clear the recruitment event
  clearTimeout(recruitmentTimer);
  activeRecruitment = null;
  
  // Update button to show hired
  const buttonElement = document.getElementById(buttonId);
  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.style.background = '#2ecc71';
    buttonElement.style.cursor = 'not-allowed';
    buttonElement.textContent = '✓ HIRED';
  }
  
  // Update timer display
  const timerElement = document.getElementById(`${buttonId}-timer`);
  if (timerElement) {
    timerElement.textContent = 'HIRED';
    timerElement.style.color = '#2ecc71';
  }
  
  updateUI();
  logAction(`🎉 ${recruit.name} joins your crew! Their expertise in ${recruit.skill} will serve you well. (+${recruit.power} power, ${recruit.loyalty}% loyalty)`);
  
  // Check achievements
  checkAchievements();
}

function territoryDispute() {
  if (player.territory > 0 && Math.random() < 0.4) {
    if (player.power + (player.gang.members * 10) > Math.random() * 500) {
      player.reputation += 3;
      showBriefNotification('⚔️ Territory defended! +3 rep', 3000);
      logAction('⚔️ A rival gang tried to move in on your turf, but your crew held the line. +3 reputation.');
    } else {
      player.territory = Math.max(0, player.territory - 1);
      player.gang.loyalty = Math.max(50, player.gang.loyalty - 10);
      showBriefNotification('⚔️ Lost territory to rivals!', 3000);
      logAction('⚔️ A rival gang overwhelmed your defenses! You lost 1 territory and gang loyalty dropped.');
    }
    updateUI();
  }
}

function policeInformant() {
  const wantedGain = Math.floor(Math.random() * 10) + 5;
  player.wantedLevel += wantedGain;
  player.reputation = Math.max(0, player.reputation - 2);
  showBriefNotification(`🐀 Informant! Wanted +${wantedGain}, Rep -2`, 3000);
  logAction(`🐀 Someone snitched to the Feds! Your wanted level spiked by ${wantedGain} and you lost 2 reputation. Find the rat.`);
  updateUI();
}

// (Removed duplicate regenerateEnergy, startEnergyRegenTimer, startEnergyRegeneration; using player.js exports)

// Passive income system
function generatePassiveIncome() {
  let income = 0;
  
  // Gang members generate income
  income += player.gang.members * 50;
  
  // Territory generates income
  income += player.territory * 200;
  
  // Business properties generate income
  const businesses = player.inventory.filter(item => item.type === "business");
  businesses.forEach(business => {
    income += business.income || 0;
  });
  
  // Real estate properties generate rental income
  let realEstateIncome = 0;
  if (player.realEstate && player.realEstate.ownedProperties) {
    player.realEstate.ownedProperties.forEach(prop => {
      if (prop.income && prop.income > 0) {
        realEstateIncome += prop.income;
      }
    });
  }
  income += realEstateIncome;
  
  if (income > 0) {
    player.money += income;
    let msg = `Passive income: +$${income.toLocaleString()}`;
    if (realEstateIncome > 0) msg += ` (includes $${realEstateIncome.toLocaleString()} rent)`;
    logAction(msg);
    updateUI();
  }
}

// Start passive income generation
function startPassiveIncomeGenerator() {
  setInterval(() => {
    generatePassiveIncome();
    processTerritoryOperations(); // Process territory income and events
    applyDailyPassives(); // Apply faction passives (interest, ammo regen, etc.)
    
    // Auto-collect helpers when Bookie is hired
    if (!player.services) player.services = {};
    if (player.services.bookieHired) {
      try {
        autoCollectBusinessesAndTribute();
        chargeBookieFeeHourly();
      } catch (e) { console.warn('Auto-collect error', e); }
    }
  }, 300000); // Every 5 minutes
}

// Hire/Dismiss Bookie
function toggleBookieHire() {
  if (!player.services) player.services = {};
  if (player.services.bookieHired) {
    player.services.bookieHired = false;
    logAction('📉 You dismiss the bookie. You will need to collect income and tribute manually.');
    if (typeof showBriefNotification === 'function') showBriefNotification('Bookie dismissed', 1200);
  } else {
    player.services.bookieHired = true;
    player.services.bookieLastPaid = Date.now();
    logAction('📈 You hire a trusted bookie to keep the cash flowing. Income and tribute will be auto-collected.');
    if (typeof showBriefNotification === 'function') showBriefNotification('Bookie hired', 1200);
  }
  // Refresh businesses screen if open
  if (document.getElementById('business-screen')?.style.display === 'block') {
    showBusinesses();
  }
}

// Auto-collect business income and gang tribute if available
function autoCollectBusinessesAndTribute() {
  let collected = 0;
  // Businesses: collect if at least 1 hour passed
  if (player.businesses && player.businesses.length > 0) {
    const now = Date.now();
    player.businesses.forEach(biz => {
      const businessType = businessTypes.find(bt => bt.id === biz.type);
      if (!businessType) return;
      const last = biz.lastCollection || now;
      const hoursElapsed = Math.floor((now - last) / (1000 * 60 * 60));
      if (hoursElapsed >= 1) {
        const hourlyIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, biz.level - 1) / 24);
        const totalIncome = hourlyIncome * Math.min(hoursElapsed, 48);
        if (totalIncome > 0) {
          if (businessType.paysDirty) {
            player.dirtyMoney = (player.dirtyMoney || 0) + totalIncome; // illegal business income is dirty
          } else {
            player.money += totalIncome; // business income is clean
          }
          biz.lastCollection = now;
          collected += totalIncome;
        }
      }
    });
  }
  // Tribute: collect if cooldown elapsed
  const tributeCooldownMs = 300 * 1000;
  if (player.gang && (player.gang.members > 0 || (player.gang.gangMembers && player.gang.gangMembers.length > 0))) {
    const last = player.gang.lastTributeTime || 0;
    const now = Date.now();
    if (now - last >= tributeCooldownMs) {
      // replicate collectTribute math without UI
      const baseTributePerMember = 200;
      let tribute = 0;
      if (player.gang.gangMembers && player.gang.gangMembers.length > 0) {
        player.gang.gangMembers.forEach(member => {
          tribute += Math.floor(baseTributePerMember * member.tributeMultiplier);
        });
      } else {
        tribute = (player.gang.members || 0) * 250;
      }
      const territoryBonus = player.territory * 50;
      tribute += territoryBonus;
      const loyaltyMultiplier = player.gang.loyalty / 100;
      tribute = Math.floor(tribute * loyaltyMultiplier);
      if (tribute > 0) {
        player.dirtyMoney = (player.dirtyMoney || 0) + tribute;
        player.gang.lastTributeTime = now;
        collected += tribute;
      }
    }
  }
  if (collected > 0 && typeof showBriefNotification === 'function') {
    showBriefNotification(`Bookie collected $${collected.toLocaleString()}`, 1200);
  }
}

// Deduct bookie fee hourly (5000/day)
function chargeBookieFeeHourly() {
  const HOURLY_FEE = Math.ceil(5000 / 24);
  if (!player.services) player.services = {};
  const now = Date.now();
  const last = player.services.bookieLastPaid || 0;
  if (now - last >= 60 * 60 * 1000) {
    if (player.money >= HOURLY_FEE) {
      player.money -= HOURLY_FEE;
      player.services.bookieLastPaid = now;
    } else {
      // Can't pay fee -> dismiss
      player.services.bookieHired = false;
      logAction('💸 Your bookie quits – no funds to cover fees.');
      if (typeof showBriefNotification === 'function') showBriefNotification('Bookie dismissed (unpaid)', 1500);
    }
  }
}

// Function to periodically check for random events
function startRandomEventChecker() {
  setInterval(() => {
    if (!gameplayActive) return;
    if (Math.random() < 0.05) { // 5% chance every minute for better balance
      triggerRandomEvent();
    }
  }, 60000); // Check every minute
}

// Function to update gang tribute timer display
// NOTE: Removed per-second full re-render (caused hover flicker).
// Gang screen is now refreshed by the slow-refresh timer below.
function startGangTributeTimer() {
  // intentionally empty – kept for backward compat with initGame()
}

// Function to refresh current screen with live timers
function startScreenRefreshTimer() {
  // --- Fast timer (1 s) – only screens with visible per-second countdowns ---
  setInterval(() => {
    if (document.getElementById("jail-screen").style.display === "block") {
      updatePrisonerList(); // Update jail prisoner countdown
    }
    if (document.getElementById("jailbreak-screen").style.display === "block") {
      updateJailbreakPrisonerTimers(); // Update jailbreak prisoner countdown
    }
  }, 1000);

  // --- Slow timer (30 s) – screens that only need occasional data refresh ---
  // Full innerHTML rebuilds on a 1-second loop destroy DOM elements mid-hover,
  // causing the "screen flash" bug. 30 s is frequent enough to catch passive
  // income changes without disrupting interaction.
  setInterval(() => {
    if (document.getElementById("gang-screen").style.display === "block") {
      showGang();
    }
    if (document.getElementById("real-estate-screen").style.display === "block") {
      updateRealEstateDisplay();
    }
    if (document.getElementById("store-screen").style.display === "block") {
      showStore();
    }
  }, 30000);
}

// Function to update jailbreak prisoner timers (separate from display)
function updateJailbreakPrisonerTimers() {
  // Update prisoner sentences and remove those who are freed
  // Can't reassign imported variable, so modify array in place
  for (let i = jailbreakPrisoners.length - 1; i >= 0; i--) {
    jailbreakPrisoners[i].sentence--;
    if (jailbreakPrisoners[i].sentence <= 0) {
      jailbreakPrisoners.splice(i, 1); // Remove prisoner
    }
  }
  
  // Refresh the display
  updateJailbreakPrisonerList();
}

// Function to show the Casino screen
function showCasino() {
  if (player.inJail) {
    alert("You can't visit the casino while you're in jail!");
    return;
  }
  
  hideAllScreens();
  document.getElementById("casino-screen").style.display = "block";
  updateCasinoWallet();
  
  // Reset game area and show game select
  const gameArea = document.getElementById('casino-game-area');
  if (gameArea) gameArea.innerHTML = '';
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'block';
}

function updateCasinoWallet() {
  const walletEl = document.getElementById('casino-wallet');
  if (walletEl) walletEl.textContent = player.money.toLocaleString();
}

// Helper: get casino bet scaling
function getCasinoBetRange() {
  const minBet = Math.floor(100 + player.level * 50);
  const maxBet = Math.floor(minBet * 20);
  return { minBet, maxBet, defaultBet: minBet };
}

// Helper: apply gambling skill bonuses
function getGamblingLuckBonus() {
  let bonus = player.skillTrees.luck.gambling * 0.01;
  if (player.unlockedPerks.includes('fortuneSon')) bonus += 0.05;
  return bonus;
}

function casinoWin(winnings) {
  player.money += winnings;
  player.playstyleStats.gamblingWins = (player.playstyleStats.gamblingWins || 0) + 1;
  _casinoWins++;
  checkForNewPerks();
  updateUI();
  updateCasinoWallet();
}

// =============== BLACKJACK ===============
// State stored in closure via window._bjState
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_NAMES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function bjNewDeck() {
  const deck = [];
  for (const suit of CARD_SUITS) {
    for (let v = 0; v < 13; v++) {
      deck.push({ name: CARD_NAMES[v], suit, value: Math.min(10, v + 1) });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjHandValue(hand) {
  let total = hand.reduce((s, c) => s + c.value, 0);
  let aces = hand.filter(c => c.value === 1).length;
  while (aces > 0 && total + 10 <= 21) { total += 10; aces--; }
  return total;
}

function bjCardHTML(card, hidden) {
  if (hidden) return `<div style="display:inline-block;width:70px;height:100px;background:#2c3e50;border:2px solid #7f8c8d;border-radius:8px;margin:3px;text-align:center;line-height:100px;font-size:1.5em;color:#95a5a6;">?</div>`;
  const color = (card.suit === '♥' || card.suit === '♦') ? '#e74c3c' : '#1a1a2e';
  return `<div style="display:inline-block;width:70px;height:100px;background:linear-gradient(135deg,#fff,#f5f5f5);border:2px solid #444;border-radius:8px;margin:3px;padding:4px;text-align:center;position:relative;box-sizing:border-box;">
    <div style="position:absolute;top:4px;left:6px;font-size:0.9em;color:${color};font-weight:bold;line-height:1;">${card.name}<br>${card.suit}</div>
    <div style="font-size:2em;color:${color};line-height:100px;">${card.suit}</div>
    <div style="position:absolute;bottom:4px;right:6px;font-size:0.9em;color:${color};font-weight:bold;line-height:1;transform:rotate(180deg);">${card.name}<br>${card.suit}</div>
  </div>`;
}

function startBlackjack() {
  const { minBet, maxBet, defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';
  
  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🃏 Blackjack</h3>
      <p style="color: #bdc3c7;">Place your bet:</p>
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('bj-bet-input').value=Math.max(${minBet},parseInt(document.getElementById('bj-bet-input').value||0)-${minBet})" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:1.1em;">−</button>
        <input id="bj-bet-input" type="number" min="${minBet}" max="${maxBet}" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.3em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('bj-bet-input').value=Math.min(${maxBet},parseInt(document.getElementById('bj-bet-input').value||0)+${minBet})" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:1.1em;">+</button>
      </div>
      <div style="color:#7f8c8d;font-size:0.85em;margin-bottom:10px;">Min: $${minBet.toLocaleString()} | Max: $${maxBet.toLocaleString()}</div>
      <button onclick="bjDeal()" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;padding:12px 30px;border:none;border-radius:8px;cursor:pointer;font-size:1.2em;font-weight:bold;">Deal Cards</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back to Games</button>
    </div>`;
}

function bjDeal() {
  const betInput = document.getElementById('bj-bet-input');
  const { minBet, maxBet } = getCasinoBetRange();
  let bet = parseInt(betInput.value) || minBet;
  bet = Math.max(minBet, Math.min(maxBet, bet));
  
  if (player.money < bet) {
    showBriefNotification(`Need $${bet.toLocaleString()} to play!`, 'danger');
    return;
  }
  
  player.money -= bet;
  updateUI();
  updateCasinoWallet();
  
  const deck = bjNewDeck();
  const pHand = [deck.pop(), deck.pop()];
  const dHand = [deck.pop(), deck.pop()];
  
  window._bjState = { deck, pHand, dHand, bet, doubled: false, done: false };
  
  // Check for natural blackjack
  if (bjHandValue(pHand) === 21) {
    window._bjState.done = true;
    bjStand(); // Auto-resolve
    return;
  }
  
  bjRender();
}

function bjRender() {
  const s = window._bjState;
  const gameArea = document.getElementById('casino-game-area');
  const pVal = bjHandValue(s.pHand);
  const canDouble = !s.doubled && s.pHand.length === 2 && player.money >= s.bet;
  
  let html = `<div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">`;
  
  // Dealer
  html += `<div style="text-align:center;margin-bottom:20px;">
    <h4 style="color:#e74c3c;margin-bottom:8px;">Dealer ${s.done ? '(' + bjHandValue(s.dHand) + ')' : ''}</h4>
    <div>${s.dHand.map((c,i) => bjCardHTML(c, !s.done && i > 0)).join('')}</div>
  </div>`;
  
  // Divider
  html += `<hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">`;
  
  // Player
  html += `<div style="text-align:center;margin-bottom:15px;">
    <h4 style="color:#2ecc71;margin-bottom:8px;">Your Hand (${pVal})${pVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.pHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;
  
  // Bet info
  html += `<div style="text-align:center;color:#f1c40f;margin-bottom:12px;">Bet: $${(s.bet * (s.doubled ? 2 : 1)).toLocaleString()}</div>`;
  
  // Actions
  if (!s.done && pVal < 21) {
    html += `<div style="text-align:center;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
      <button onclick="bjHit()" style="background:#e67e22;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">🃏 Hit</button>
      <button onclick="bjStand()" style="background:#2980b9;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">✋ Stand</button>
      ${canDouble ? `<button onclick="bjDouble()" style="background:#8e44ad;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">💰 Double Down</button>` : ''}
    </div>`;
  }
  
  html += `</div>`;
  gameArea.innerHTML = html;
}

function bjHit() {
  const s = window._bjState;
  if (s.done) return;
  s.pHand.push(s.deck.pop());
  if (bjHandValue(s.pHand) >= 21) {
    s.done = true;
    bjResolve();
    return;
  }
  bjRender();
}

function bjStand() {
  const s = window._bjState;
  s.done = true;
  // Dealer draws to 17
  while (bjHandValue(s.dHand) < 17) {
    s.dHand.push(s.deck.pop());
  }
  bjResolve();
}

function bjDouble() {
  const s = window._bjState;
  if (player.money < s.bet) return;
  player.money -= s.bet;
  s.doubled = true;
  updateUI();
  updateCasinoWallet();
  // Draw exactly one card then stand
  s.pHand.push(s.deck.pop());
  s.done = true;
  while (bjHandValue(s.dHand) < 17) {
    s.dHand.push(s.deck.pop());
  }
  bjResolve();
}

function bjResolve() {
  const s = window._bjState;
  s.done = true;
  const pVal = bjHandValue(s.pHand);
  const dVal = bjHandValue(s.dHand);
  const totalBet = s.bet * (s.doubled ? 2 : 1);
  const luckBonus = getGamblingLuckBonus();
  
  const gameArea = document.getElementById('casino-game-area');
  let html = `<div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">`;
  
  // Dealer
  html += `<div style="text-align:center;margin-bottom:20px;">
    <h4 style="color:#e74c3c;margin-bottom:8px;">Dealer (${dVal})${dVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.dHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;
  html += `<hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">`;
  html += `<div style="text-align:center;margin-bottom:15px;">
    <h4 style="color:#2ecc71;margin-bottom:8px;">Your Hand (${pVal})${pVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.pHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;
  
  let resultMsg = '';
  let resultColor = '';
  
  if (pVal > 21) {
    resultMsg = `💔 Busted! Lost $${totalBet.toLocaleString()}`;
    resultColor = '#e74c3c';
    logAction(`🃏 Busted at ${pVal}. Lost $${totalBet.toLocaleString()} at the blackjack table.`);
  } else if (pVal === 21 && s.pHand.length === 2) {
    // Natural blackjack pays 2.5x
    let winnings = Math.floor(totalBet * 2.5);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultMsg = `🎉 BLACKJACK! Won $${winnings.toLocaleString()}!`;
    resultColor = '#f1c40f';
    logAction(`🃏 Natural Blackjack! Won $${winnings.toLocaleString()}!`);
  } else if (dVal > 21 || pVal > dVal) {
    let winnings = Math.floor(totalBet * 2);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultMsg = `🎉 You win $${winnings.toLocaleString()}!`;
    resultColor = '#2ecc71';
    logAction(`🃏 Blackjack win! ${pVal} vs dealer ${dVal}. Won $${winnings.toLocaleString()}!`);
  } else if (pVal === dVal) {
    player.money += totalBet;
    updateUI();
    updateCasinoWallet();
    resultMsg = `🤝 Push! Bet returned.`;
    resultColor = '#f39c12';
    logAction(`🃏 Blackjack push. ${pVal} tied with dealer.`);
  } else {
    resultMsg = `💔 Dealer wins. Lost $${totalBet.toLocaleString()}`;
    resultColor = '#e74c3c';
    logAction("🃏 The dealer's hand beats yours. Better luck next time.");
  }
  
  html += `<div style="text-align:center;margin:15px 0;"><p style="color:${resultColor};font-size:1.4em;font-weight:bold;">${resultMsg}</p></div>`;
  html += `<div style="text-align:center;display:flex;justify-content:center;gap:10px;">
    <button onclick="startBlackjack()" style="background:#27ae60;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Play Again</button>
    <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Back to Games</button>
  </div>`;
  html += `</div>`;
  gameArea.innerHTML = html;
}

// =============== SLOTS ===============
const SLOT_SYMBOLS = ['🍒','🍋','🍊','🍇','💎','7️⃣','🔔','⭐'];
const SLOT_PAYOUTS = { '7️⃣': 10, '💎': 7, '⭐': 5, '🔔': 4, '🍇': 3, '🍊': 2, '🍋': 1.5, '🍒': 1 };

function startSlots() {
  const { minBet, maxBet, defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';
  
  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(40,20,60,0.8), rgba(80,30,60,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e67e22; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🎰 Slot Machine</h3>
      <div id="slot-reels" style="display:flex;justify-content:center;gap:8px;margin:20px 0;padding:20px;background:rgba(0,0,0,0.4);border-radius:12px;border:3px solid #d4af37;">
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
      </div>
      <div id="slot-result" style="min-height:30px;margin:10px 0;color:#f1c40f;font-size:1.2em;font-weight:bold;"></div>
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('slot-bet-input').value=Math.max(${minBet},parseInt(document.getElementById('slot-bet-input').value||0)-${minBet})" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">−</button>
        <input id="slot-bet-input" type="number" min="${minBet}" max="${maxBet}" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.2em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('slot-bet-input').value=Math.min(${maxBet},parseInt(document.getElementById('slot-bet-input').value||0)+${minBet})" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">+</button>
      </div>
      <button id="slot-spin-btn" onclick="slotSpin()" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;padding:14px 40px;border:none;border-radius:10px;cursor:pointer;font-size:1.3em;font-weight:bold;">🎰 SPIN!</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back</button>
      <div style="margin-top:15px;color:#7f8c8d;font-size:0.8em;">
        Payouts: 7️⃣=10x | 💎=7x | ⭐=5x | 🔔=4x | 🍇=3x | 2-match=1.5x
      </div>
    </div>`;
}

function slotSpin() {
  const { minBet, maxBet } = getCasinoBetRange();
  let bet = parseInt(document.getElementById('slot-bet-input').value) || minBet;
  bet = Math.max(minBet, Math.min(maxBet, bet));
  
  if (player.money < bet) {
    showBriefNotification(`Need $${bet.toLocaleString()} to spin!`, 'danger');
    return;
  }
  
  player.money -= bet;
  updateUI();
  updateCasinoWallet();
  
  const spinBtn = document.getElementById('slot-spin-btn');
  if (spinBtn) spinBtn.disabled = true;
  
  const reels = document.querySelectorAll('.slot-reel');
  const resultEl = document.getElementById('slot-result');
  resultEl.textContent = '';
  
  // Pre-determine final symbols
  let winChance = 0.12 + player.skillTrees.luck.gambling * 0.008;
  if (player.unlockedPerks.includes('fortuneSon')) winChance *= 1.5;
  winChance = Math.min(0.30, winChance);
  
  let finalSymbols;
  if (Math.random() < winChance * 0.4) {
    // Triple match (jackpot)
    const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    finalSymbols = [sym, sym, sym];
  } else if (Math.random() < winChance) {
    // Two match
    const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    const otherIdx = Math.floor(Math.random() * 3);
    finalSymbols = [sym, sym, sym];
    finalSymbols[otherIdx] = SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(sym) + 1 + Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))) % SLOT_SYMBOLS.length];
  } else {
    // All different
    const shuffled = [...SLOT_SYMBOLS].sort(() => Math.random() - 0.5);
    finalSymbols = [shuffled[0], shuffled[1], shuffled[2]];
  }
  
  // Animate reels with staggered stops
  let animIntervals = [];
  reels.forEach((reel, i) => {
    let ticks = 0;
    const stopAt = 8 + i * 6; // Stagger: reel 0 stops first
    const interval = setInterval(() => {
      reel.textContent = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      ticks++;
      if (ticks >= stopAt) {
        clearInterval(interval);
        reel.textContent = finalSymbols[i];
        reel.style.transform = 'scale(1.1)';
        setTimeout(() => { reel.style.transform = 'scale(1)'; }, 150);
        
        // Last reel stopped? Resolve
        if (i === 2) {
          setTimeout(() => slotResolve(finalSymbols, bet), 300);
        }
      }
    }, 80);
    animIntervals.push(interval);
  });
}

function slotResolve(symbols, bet) {
  const spinBtn = document.getElementById('slot-spin-btn');
  if (spinBtn) spinBtn.disabled = false;
  
  const resultEl = document.getElementById('slot-result');
  const luckBonus = getGamblingLuckBonus();
  
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    // Triple match!
    const multiplier = SLOT_PAYOUTS[symbols[0]] || 3;
    let winnings = Math.floor(bet * multiplier);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultEl.innerHTML = `<span style="color:#f1c40f;font-size:1.4em;">🎉 JACKPOT! ${symbols[0]}${symbols[0]}${symbols[0]} — Won $${winnings.toLocaleString()}!</span>`;
    logAction(`🎰 JACKPOT! Triple ${symbols[0]} on the slots — $${winnings.toLocaleString()} in your pocket!`);
  } else if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
    // Two match
    let winnings = Math.floor(bet * 1.5);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultEl.innerHTML = `<span style="color:#2ecc71;">Nice! Two match — Won $${winnings.toLocaleString()}</span>`;
    logAction(`🎰 Two matching symbols! Small win of $${winnings.toLocaleString()} on the slots.`);
  } else {
    resultEl.innerHTML = `<span style="color:#e74c3c;">No match. Lost $${bet.toLocaleString()}</span>`;
    logAction("🎰 The slots mock you with their silence. Your money disappears into the machine's hungry maw.");
  }
  updateUI();
  updateCasinoWallet();
}

// =============== ROULETTE ===============
const ROULETTE_REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function startRoulette() {
  const { minBet, maxBet, defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';
  
  window._rouletteState = { bets: [], totalBet: 0 };
  
  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(100,0,0,0.6), rgba(40,0,0,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e74c3c;">
      <h3 style="color: #f1c40f; text-align:center; margin-bottom: 15px;">🎡 Roulette</h3>
      <p style="color:#bdc3c7;text-align:center;margin-bottom:10px;">Choose your bet type, set amount, then spin!</p>
      
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:10px 0;">
        <span style="color:#f1c40f;">Bet Amount:</span>
        <input id="rou-bet-input" type="number" min="${minBet}" max="${maxBet}" value="${defaultBet}" style="width:110px;text-align:center;font-size:1.1em;padding:6px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
      </div>
      
      <div style="margin:15px 0;">
        <div style="color:#d4af37;font-weight:bold;margin-bottom:8px;text-align:center;">Quick Bets (2x payout):</div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
          <button onclick="rouletteAddBet('red')" style="background:#c0392b;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🔴 Red</button>
          <button onclick="rouletteAddBet('black')" style="background:#2c3e50;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">⚫ Black</button>
          <button onclick="rouletteAddBet('odd')" style="background:#8e44ad;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Odd</button>
          <button onclick="rouletteAddBet('even')" style="background:#2980b9;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Even</button>
          <button onclick="rouletteAddBet('low')" style="background:#27ae60;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">1-18</button>
          <button onclick="rouletteAddBet('high')" style="background:#e67e22;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">19-36</button>
        </div>
      </div>
      
      <div style="margin:15px 0;">
        <div style="color:#d4af37;font-weight:bold;margin-bottom:8px;text-align:center;">Pick a Number (35x payout):</div>
        <div id="roulette-numbers" style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:500px;margin:0 auto;">
          <button onclick="rouletteAddBet(0)" style="background:#27ae60;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;min-width:36px;">0</button>
          ${Array.from({length:36},(_, i) => {
            const n = i+1;
            const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
            return `<button onclick="rouletteAddBet(${n})" style="background:${isRed ? '#c0392b' : '#2c3e50'};color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;min-width:36px;">${n}</button>`;
          }).join('')}
        </div>
      </div>
      
      <div id="roulette-bets-display" style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin:15px 0;min-height:40px;text-align:center;color:#bdc3c7;">
        No bets placed yet
      </div>
      
      <div style="text-align:center;display:flex;justify-content:center;gap:10px;">
        <button onclick="rouletteSpin()" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;padding:14px 35px;border:none;border-radius:10px;cursor:pointer;font-size:1.2em;font-weight:bold;">🎡 SPIN!</button>
        <button onclick="rouletteClear()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;">Clear Bets</button>
        <button onclick="showCasino()" style="background:#555;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;">Back</button>
      </div>
    </div>`;
}

function rouletteAddBet(type) {
  const { minBet, maxBet } = getCasinoBetRange();
  let amount = parseInt(document.getElementById('rou-bet-input').value) || minBet;
  amount = Math.max(minBet, Math.min(maxBet, amount));
  
  const s = window._rouletteState;
  if (s.totalBet + amount > player.money) {
    showBriefNotification("Not enough money for this bet!", 'danger');
    return;
  }
  
  s.bets.push({ type, amount });
  s.totalBet += amount;
  
  // Update display
  const display = document.getElementById('roulette-bets-display');
  const betLabels = s.bets.map(b => `<span style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:4px;margin:2px;">${typeof b.type === 'number' ? '#' + b.type : b.type} $${b.amount.toLocaleString()}</span>`);
  display.innerHTML = `<div style="color:#f1c40f;margin-bottom:5px;">Total Wagered: $${s.totalBet.toLocaleString()}</div>` + betLabels.join(' ');
}

function rouletteClear() {
  window._rouletteState = { bets: [], totalBet: 0 };
  const display = document.getElementById('roulette-bets-display');
  if (display) display.innerHTML = 'No bets placed yet';
}

function rouletteSpin() {
  const s = window._rouletteState;
  if (s.bets.length === 0) {
    showBriefNotification("Place at least one bet first!", 'warning');
    return;
  }
  if (player.money < s.totalBet) {
    showBriefNotification("Not enough money for your bets!", 'danger');
    return;
  }
  
  // Deduct total bet
  player.money -= s.totalBet;
  updateUI();
  updateCasinoWallet();
  
  // Spin result
  const result = Math.floor(Math.random() * 37); // 0-36
  const isRed = ROULETTE_REDS.includes(result);
  const isBlack = result > 0 && !isRed;
  const luckBonus = getGamblingLuckBonus();
  
  // Calculate winnings
  let totalWinnings = 0;
  let betResults = [];
  
  for (const bet of s.bets) {
    let won = false;
    let multiplier = 0;
    
    if (typeof bet.type === 'number') {
      won = result === bet.type;
      multiplier = 35;
    } else {
      switch(bet.type) {
        case 'red': won = isRed; multiplier = 2; break;
        case 'black': won = isBlack; multiplier = 2; break;
        case 'odd': won = result > 0 && result % 2 === 1; multiplier = 2; break;
        case 'even': won = result > 0 && result % 2 === 0; multiplier = 2; break;
        case 'low': won = result >= 1 && result <= 18; multiplier = 2; break;
        case 'high': won = result >= 19 && result <= 36; multiplier = 2; break;
      }
    }
    
    if (won) {
      let payout = Math.floor(bet.amount * multiplier);
      payout += Math.floor(payout * luckBonus);
      totalWinnings += payout;
      betResults.push({ ...bet, won: true, payout });
    } else {
      betResults.push({ ...bet, won: false, payout: 0 });
    }
  }
  
  if (totalWinnings > 0) {
    casinoWin(totalWinnings);
  }
  
  // Display result
  const resultColor = result === 0 ? '#27ae60' : isRed ? '#e74c3c' : '#ecf0f1';
  const resultLabel = result === 0 ? '0 GREEN' : `${result} ${isRed ? 'RED' : 'BLACK'}`;
  
  const gameArea = document.getElementById('casino-game-area');
  let html = `<div style="background: linear-gradient(135deg, rgba(100,0,0,0.6), rgba(40,0,0,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e74c3c; text-align:center;">`;
  html += `<h3 style="color: #f1c40f;">🎡 Roulette Result</h3>`;
  html += `<div style="font-size:3em;margin:20px 0;"><span style="background:${result === 0 ? '#27ae60' : isRed ? '#c0392b' : '#2c3e50'};padding:15px 30px;border-radius:50%;border:4px solid #d4af37;color:white;">${result}</span></div>`;
  html += `<p style="color:${resultColor};font-size:1.3em;font-weight:bold;">${resultLabel}</p>`;
  
  // Bet breakdown
  html += `<div style="margin:15px 0;text-align:left;max-width:400px;margin:15px auto;">`;
  for (const br of betResults) {
    const label = typeof br.type === 'number' ? `#${br.type}` : br.type;
    html += `<div style="padding:4px 0;color:${br.won ? '#2ecc71' : '#e74c3c'};">${br.won ? '✅' : '❌'} ${label} ($${br.amount.toLocaleString()}) → ${br.won ? `+$${br.payout.toLocaleString()}` : 'Lost'}</div>`;
  }
  html += `</div>`;
  
  const netResult = totalWinnings - s.totalBet;
  if (netResult > 0) {
    html += `<p style="color:#2ecc71;font-size:1.4em;font-weight:bold;">Net Win: +$${netResult.toLocaleString()}</p>`;
    logAction(`🎡 Roulette lands on ${result}! Net win of $${netResult.toLocaleString()}!`);
  } else if (netResult === 0) {
    html += `<p style="color:#f39c12;font-size:1.3em;">Break even!</p>`;
  } else {
    html += `<p style="color:#e74c3c;font-size:1.3em;">Net Loss: -$${Math.abs(netResult).toLocaleString()}</p>`;
    logAction(`🎡 Roulette lands on ${result}. Lost $${Math.abs(netResult).toLocaleString()}.`);
  }
  
  html += `<div style="margin-top:15px;display:flex;justify-content:center;gap:10px;">
    <button onclick="startRoulette()" style="background:#c0392b;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Play Again</button>
    <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Back to Games</button>
  </div>`;
  html += `</div>`;
  gameArea.innerHTML = html;
  
  // Reset state
  window._rouletteState = { bets: [], totalBet: 0 };
  updateUI();
  updateCasinoWallet();
}

// =============== DICE ===============
function startDiceGame() {
  const { minBet, maxBet, defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';
  
  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(0,0,60,0.6), rgba(0,0,100,0.4)); padding: 25px; border-radius: 15px; border: 2px solid #3498db; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🎲 Dice Game</h3>
      <p style="color:#bdc3c7;">Roll higher than the dealer to win. Doubles beat everything!</p>
      
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('dice-bet-input').value=Math.max(${minBet},parseInt(document.getElementById('dice-bet-input').value||0)-${minBet})" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">−</button>
        <input id="dice-bet-input" type="number" min="${minBet}" max="${maxBet}" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.2em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('dice-bet-input').value=Math.min(${maxBet},parseInt(document.getElementById('dice-bet-input').value||0)+${minBet})" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">+</button>
      </div>
      
      <div id="dice-reels" style="display:flex;justify-content:center;gap:30px;margin:20px 0;">
        <div>
          <div style="color:#2ecc71;margin-bottom:8px;font-weight:bold;">Your Dice</div>
          <div style="display:flex;gap:5px;">
            <span id="p-die-1" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
            <span id="p-die-2" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;font-size:1.5em;color:#f1c40f;font-weight:bold;">VS</div>
        <div>
          <div style="color:#e74c3c;margin-bottom:8px;font-weight:bold;">Dealer Dice</div>
          <div style="display:flex;gap:5px;">
            <span id="d-die-1" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
            <span id="d-die-2" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
          </div>
        </div>
      </div>
      <div id="dice-result" style="min-height:30px;margin:10px 0;color:#f1c40f;font-size:1.2em;font-weight:bold;"></div>
      
      <button id="dice-roll-btn" onclick="diceRoll()" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;padding:14px 35px;border:none;border-radius:10px;cursor:pointer;font-size:1.3em;font-weight:bold;">🎲 ROLL!</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back</button>
    </div>`;
}

function diceRoll() {
  const { minBet, maxBet } = getCasinoBetRange();
  let bet = parseInt(document.getElementById('dice-bet-input').value) || minBet;
  bet = Math.max(minBet, Math.min(maxBet, bet));
  
  if (player.money < bet) {
    showBriefNotification(`Need $${bet.toLocaleString()} to roll!`, 'danger');
    return;
  }
  
  player.money -= bet;
  updateUI();
  updateCasinoWallet();
  
  const rollBtn = document.getElementById('dice-roll-btn');
  if (rollBtn) rollBtn.disabled = true;
  
  const resultEl = document.getElementById('dice-result');
  resultEl.textContent = '';
  
  const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const roll = () => Math.floor(Math.random() * 6) + 1;
  
  let pDice = [roll(), roll()];
  let dDice = [roll(), roll()];
  
  // Lucky reroll from gambling skill
  const luckBonus = getGamblingLuckBonus();
  if (Math.random() < luckBonus * 3) {
    const minIdx = pDice[0] <= pDice[1] ? 0 : 1;
    pDice[minIdx] = roll();
  }
  
  // Animate dice
  let ticks = 0;
  const maxTicks = 15;
  const animInterval = setInterval(() => {
    document.getElementById('p-die-1').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('p-die-2').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('d-die-1').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('d-die-2').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(animInterval);
      // Show final results
      document.getElementById('p-die-1').textContent = DICE_FACES[pDice[0] - 1];
      document.getElementById('p-die-2').textContent = DICE_FACES[pDice[1] - 1];
      document.getElementById('d-die-1').textContent = DICE_FACES[dDice[0] - 1];
      document.getElementById('d-die-2').textContent = DICE_FACES[dDice[1] - 1];
      
      diceResolve(pDice, dDice, bet);
    }
  }, 80);
}

function diceResolve(pDice, dDice, bet) {
  const rollBtn = document.getElementById('dice-roll-btn');
  if (rollBtn) rollBtn.disabled = false;
  
  const resultEl = document.getElementById('dice-result');
  const luckBonus = getGamblingLuckBonus();
  
  const pTotal = pDice[0] + pDice[1];
  const dTotal = dDice[0] + dDice[1];
  const pDoubles = pDice[0] === pDice[1];
  const dDoubles = dDice[0] === dDice[1];
  
  let won = false;
  
  if (pDoubles && !dDoubles) {
    let winnings = Math.floor(bet * 3);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    won = true;
    resultEl.innerHTML = `<span style="color:#f1c40f;font-size:1.3em;">🎯 DOUBLES! (${pTotal} vs ${dTotal}) Won $${winnings.toLocaleString()}!</span>`;
    logAction(`🎲 Rolled doubles (${pDice[0]}+${pDice[1]})! Won $${winnings.toLocaleString()}!`);
  } else if (pTotal > dTotal && !(dDoubles && !pDoubles)) {
    let winnings = Math.floor(bet * 2);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    won = true;
    resultEl.innerHTML = `<span style="color:#2ecc71;font-size:1.3em;">🎉 You win! (${pTotal} vs ${dTotal}) +$${winnings.toLocaleString()}</span>`;
    logAction(`🎲 Your dice beat the dealer! ${pTotal} vs ${dTotal}. Won $${winnings.toLocaleString()}!`);
  } else if (pTotal === dTotal && pDoubles === dDoubles) {
    player.money += bet;
    updateUI();
    updateCasinoWallet();
    resultEl.innerHTML = `<span style="color:#f39c12;font-size:1.2em;">🤝 Tie! (${pTotal} vs ${dTotal}) Bet returned.</span>`;
    logAction("🎲 Dice tied. Bet returned.");
  } else {
    resultEl.innerHTML = `<span style="color:#e74c3c;font-size:1.2em;">💔 Dealer wins! (${dTotal}${dDoubles ? ' DOUBLES' : ''} vs ${pTotal}) Lost $${bet.toLocaleString()}</span>`;
    logAction("🎲 The dice betray you. Dealer's roll wins.");
  }
}


// Function to show the Options screen
function showOptions() {
  hideAllScreens();
  document.getElementById("options-screen").style.display = "block";
  
  // Display version on settings screen
  const settingsVersion = document.getElementById('settings-version');
  if (settingsVersion) {
    settingsVersion.textContent = `Version ${CURRENT_VERSION}`;
  }
}

// Function to save the game
function saveGame() {
  // Show the save system interface instead of directly saving
  showSaveSystem();
}

// Function to load the saved game - now shows a list of saves to choose from
function loadGame() {
  // Get all available save slots
  const slots = getAllSaveSlots();
  const availableSaves = slots.filter(slot => !slot.empty);
  
  if (availableSaves.length === 0) {
    alert("No saved games found! Start a new game to begin your criminal empire.");
    return;
  }
  
  // Create a save selection interface
  showSaveSelectionInterface(availableSaves);
}

function showSaveSelectionInterface(saves) {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const content = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; color: #3498db; font-size: 2.5em; margin-bottom: 30px;">
        📂 Load Game
      </h2>
      
      <p style="text-align: center; color: #ecf0f1; font-size: 1.2em; margin-bottom: 30px;">
        Select a saved game to load:
      </p>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        ${saves.map(save => `
          <div style="background: rgba(52, 73, 94, 0.8); border: 2px solid #3498db; border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" 
             onclick="if(loadGameFromSlot(${save.slotNumber})) { hideAllScreens(); showCommandCenter(); }"
             onmouseover="this.style.background='rgba(52, 152, 219, 0.3)'; this.style.borderColor='#2ecc71';"
             onmouseout="this.style.background='rgba(52, 73, 94, 0.8)'; this.style.borderColor='#3498db';">
            
            <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr; gap: 20px; align-items: center;">
              <div>
                <h3 style="color: #3498db; margin: 0; font-size: 1.1em;">
                  ${save.slotNumber === 0 ? '🔄 Auto-Save' : `💾 Slot ${save.slotNumber}`}
                </h3>
              </div>
              
              <div>
                <h4 style="color: #2ecc71; margin: 0 0 5px 0; font-size: 1.2em;">${save.saveName}</h4>
                <p style="color: #bdc3c7; margin: 0; font-size: 0.9em;">${save.playerName} - Level ${save.level}</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #f39c12; margin: 0; font-weight: bold;">$${save.money.toLocaleString()}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Money</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #e74c3c; margin: 0; font-weight: bold;">${Math.floor(save.reputation)}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Reputation</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #3498db; margin: 0; font-size: 0.9em;">${save.playtime}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">${formatTimestamp(save.saveDate)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center;">
        <button onclick="exitLoadInterface('menu')" style="background: #95a5a6; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.1em;">
          ←Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
  const statsContent = document.getElementById('statistics-content');
  if (statsContent) {
    statsContent.dataset.loadContext = 'loadGame';
  }
}

// Function to load game from intro screen - use the new save selection interface
function loadGameFromIntro() {
  // Get all available save slots
  const slots = getAllSaveSlots();
  const availableSaves = slots.filter(slot => !slot.empty);
  
  if (availableSaves.length === 0) {
    alert("No saved games found! Start a new game to begin your criminal empire.");
    return;
  }
  
  // Hide intro screen and create a temporary save selection screen
  document.getElementById('intro-screen').style.display = 'none';
  
  // Create a temporary save selection interface
  showSaveSelectionFromIntro(availableSaves);
}

function showSaveSelectionFromIntro(saves) {
  // Create a temporary overlay for save selection from intro
  const overlay = document.createElement('div');
  overlay.id = 'intro-save-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  const content = `
    <div style="max-width: 1000px; width: 100%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
          padding: 40px; border-radius: 20px; border: 2px solid #e74c3c; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); text-align: center; color: white;">
      <h2 style="color: #3498db; font-size: 2.5em; margin-bottom: 30px;">
        📂 Load Game
      </h2>
      
      <p style="color: #ecf0f1; font-size: 1.2em; margin-bottom: 30px;">
        Select a saved game to load:
      </p>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        ${saves.map(save => `
          <div style="background: rgba(52, 73, 94, 0.8); border: 2px solid #3498db; border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" 
             onclick="loadGameFromIntroSlot(${save.slotNumber})"
             onmouseover="this.style.background='rgba(52, 152, 219, 0.3)'; this.style.borderColor='#2ecc71';"
             onmouseout="this.style.background='rgba(52, 73, 94, 0.8)'; this.style.borderColor='#3498db';">
            
            <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr; gap: 20px; align-items: center;">
              <div>
                <h3 style="color: #3498db; margin: 0; font-size: 1.1em;">
                  ${save.slotNumber === 0 ? '🔄 Auto-Save' : `💾 Slot ${save.slotNumber}`}
                </h3>
              </div>
              
              <div>
                <h4 style="color: #2ecc71; margin: 0 0 5px 0; font-size: 1.2em;">${save.saveName}</h4>
                <p style="color: #bdc3c7; margin: 0; font-size: 0.9em;">${save.playerName} - Level ${save.level}</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #f39c12; margin: 0; font-weight: bold;">$${save.money.toLocaleString()}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Money</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #e74c3c; margin: 0; font-weight: bold;">${Math.floor(save.reputation)}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Reputation</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #3498db; margin: 0; font-size: 0.9em;">${save.playtime}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">${formatTimestamp(save.saveDate)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center;">
        <button onclick="cancelLoadFromIntro()" style="background: #95a5a6; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.1em;">
          ← Back to Main Screen
        </button>
      </div>
    </div>
  `;
  
  overlay.innerHTML = content;
  document.body.appendChild(overlay);
}

function exitLoadInterface(target = 'menu') {
  const overlay = document.getElementById('intro-save-overlay');
  if (overlay) {
    overlay.remove();
  }

  const statsScreen = document.getElementById('statistics-screen');
  if (statsScreen) {
    statsScreen.style.display = 'none';
  }

  const statsContent = document.getElementById('statistics-content');
  if (statsContent && statsContent.dataset.loadContext === 'loadGame') {
    statsContent.innerHTML = '';
    delete statsContent.dataset.loadContext;
  }

  hideAllScreens();
  // Always go to SafeHouse (intro screen removed)
  showCommandCenter();
}

function loadGameFromIntroSlot(slotNumber) {
  // Load the game from the selected slot
  if (loadGameFromSlot(slotNumber)) {
    // Activate all gameplay systems (events, timers, etc.) on first entry
    activateGameplaySystems();

    // Remove the overlay
    const overlay = document.getElementById('intro-save-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Show SafeHouse directly (bypass character creation)
    document.getElementById('intro-screen').style.display = 'none';
    
    // Update UI to reflect loaded player data
    updateUI();
    showCommandCenter();
    
    // Show welcome back message with player name
    const playerName = player.name || "Criminal";
    logAction(`🎮 Welcome back, ${playerName}! Your criminal empire has been restored.`);
    
    // Show brief notification
    showBriefNotification(`✅ Loaded: ${playerName}'s saved game`, 2000);
  } else {
    // Load failed - show error to user
    alert("Failed to load save data! The save may be corrupted or incompatible with the current version.");
  }
}

function cancelLoadFromIntro() {
  // Remove the load overlay and return to the title screen
  const overlay = document.getElementById('intro-save-overlay');
  if (overlay) {
    overlay.remove();
  }
  document.getElementById('intro-screen').style.display = 'block';
}

// Expose intro load helpers for inline onclick handlers
window.loadGameFromIntroSlot = loadGameFromIntroSlot;
window.cancelLoadFromIntro = cancelLoadFromIntro;

// Helper function to check for slot saves
function checkForSlotSaves() {
  for (let i = 1; i <= 10; i++) {
    if (localStorage.getItem(`gameSlot_${i}`)) {
      return true;
    }
  }
  return false;
}

// Helper function to find the most recent save slot
function findMostRecentSaveSlot() {
  let mostRecentSlot = null;
  let mostRecentTime = 0;
  
  for (let i = 1; i <= 10; i++) {
    const saveEntryStr = localStorage.getItem(`gameSlot_${i}`);
    if (saveEntryStr) {
      try {
        const saveEntry = JSON.parse(saveEntryStr);
        if (saveEntry.timestamp > mostRecentTime) {
          mostRecentTime = saveEntry.timestamp;
          mostRecentSlot = i;
        }
      } catch (e) {
        console.error(`Error reading save slot ${i}:`, e);
      }
    }
  }
  
  return mostRecentSlot;
}

// Function to delete the saved game - now shows save selection
function deleteSavedGame() {
  showDeleteSaveSelection();
}

// Function to force a fresh start - now shows save selection for deletion
function forceNewGame() {
  showDeleteSaveSelection();
}

function showDeleteSaveSelection() {
  // Get all available save slots
  const slots = getAllSaveSlots();
  const availableSaves = slots.filter(slot => !slot.empty);
  
  if (availableSaves.length === 0) {
    alert("No saved games found to delete!");
    return;
  }
  
  // Hide current screen
  const currentScreen = getCurrentScreen();
  if (currentScreen) {
    currentScreen.style.display = 'none';
  }
  
  // Create a temporary overlay for save deletion selection
  showDeleteSelectionInterface(availableSaves);
}

function showDeleteSelectionInterface(saves) {
  // Create a temporary overlay for save deletion
  const overlay = document.createElement('div');
  overlay.id = 'delete-save-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
  `;
  
  const content = `
    <div style="max-width: 1000px; width: 100%; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); 
          padding: 40px; border-radius: 20px; border: 2px solid #e74c3c; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8); text-align: center; color: white;">
      <h2 style="color: #e74c3c; font-size: 2.5em; margin-bottom: 30px;">
        🗑️ Delete Save Game
      </h2>
      
      <p style="color: #ecf0f1; font-size: 1.2em; margin-bottom: 30px;">
        ⚠️ <strong>WARNING:</strong> This action cannot be undone! Select a saved game to permanently delete:
      </p>
      
      <div style="display: grid; gap: 15px; margin-bottom: 30px;">
        ${saves.map(save => `
          <div style="background: rgba(52, 73, 94, 0.8); border: 2px solid #e74c3c; border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" 
             onclick="confirmDeleteSave(${save.slotNumber})"
             onmouseover="this.style.background='rgba(231, 76, 60, 0.3)'; this.style.borderColor='#c0392b';"
             onmouseout="this.style.background='rgba(52, 73, 94, 0.8)'; this.style.borderColor='#e74c3c';">
            
            <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr 1fr; gap: 20px; align-items: center;">
              <div>
                <h3 style="color: #e74c3c; margin: 0; font-size: 1.1em;">
                  ${save.slotNumber === 0 ? '🔄 Auto-Save' : `💾 Slot ${save.slotNumber}`}
                </h3>
              </div>
              
              <div>
                <h4 style="color: #2ecc71; margin: 0 0 5px 0; font-size: 1.2em;">${save.saveName}</h4>
                <p style="color: #bdc3c7; margin: 0; font-size: 0.9em;">${save.playerName} - Level ${save.level}</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #f39c12; margin: 0; font-weight: bold;">$${save.money.toLocaleString()}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Money</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #e74c3c; margin: 0; font-weight: bold;">${Math.floor(save.reputation)}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">Reputation</p>
              </div>
              
              <div style="text-align: center;">
                <p style="color: #3498db; margin: 0; font-size: 0.9em;">${save.playtime}</p>
                <p style="color: #95a5a6; margin: 0; font-size: 0.8em;">${formatTimestamp(save.saveDate)}</p>
              </div>
            </div>
            
            <div style="margin-top: 15px; text-align: center;">
              <span style="color: #e74c3c; font-weight: bold; font-size: 0.9em;">🗑️ Click to DELETE this save</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center;">
        <button onclick="cancelDeleteSave()" style="background: #95a5a6; color: white; padding: 15px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.1em;">
          ← Cancel
        </button>
      </div>
    </div>
  `;
  
  overlay.innerHTML = content;
  document.body.appendChild(overlay);
}

function confirmDeleteSave(slotNumber) {
  const slot = getSaveEntry(slotNumber);
  if (!slot || slot.empty) {
    alert("Save slot not found!");
    return;
  }
  
  const slotName = slotNumber === 0 ? 'Auto-Save' : `Slot ${slotNumber}`;
  const confirmMessage = `Are you absolutely sure you want to permanently delete ${slotName}?\n\nSave: ${slot.saveName}\nPlayer: ${slot.playerName}\nLevel: ${slot.level}\n\nThis action cannot be undone!`;
  
  if (confirm(confirmMessage)) {
    deleteSaveSlot(slotNumber);
    
    // Remove the overlay
    const overlay = document.getElementById('delete-save-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Show success message
    alert(`${slotName} has been permanently deleted!\n\nYou have been returned to the start screen where you can begin a new criminal empire.`);
    
    // Always return to intro screen after deletion so player can restart
    returnToIntroScreen();
    
    logAction(`🗑️ Deleted save: ${slotName} (${slot.saveName})`);
  }
}

function cancelDeleteSave() {
  // Remove the overlay
  const overlay = document.getElementById('delete-save-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // Return to previous screen (this preserves the original behavior for canceling)
  restorePreviousScreen();
}

function getCurrentScreen() {
  // Find the currently visible screen
  const screens = document.querySelectorAll('.game-screen, #intro-screen, #character-creation-screen, #tutorial-screen');
  for (let screen of screens) {
    if (screen.style.display !== 'none') {
      return screen;
    }
  }
  return null;
}

function restorePreviousScreen() {
  // Always go to command center (intro screen removed)
  const optionsScreen = document.getElementById('options-screen');
  if (optionsScreen && optionsScreen.style.display !== 'none') {
    optionsScreen.style.display = 'block';
  } else {
    showCommandCenter();
  }
}

function returnToIntroScreen() {
  // Hide all game screens
  const allScreens = document.querySelectorAll('.game-screen');
  allScreens.forEach(screen => {
    screen.style.display = 'none';
  });
  
  // Hide other specific screens
  const otherScreens = [
    'character-creation-screen',
    'tutorial-screen', 
    'intro-narrative',
    'menu'
  ];
  
  otherScreens.forEach(screenId => {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.style.display = 'none';
    }
  });
  
  // Show the command center (intro screen removed)
  showCommandCenter();
  
  logAction(`🏠 Returned to SafeHouse - ready to start a new criminal empire!`);
}

// Function to confirm reset game
async function confirmResetGame() {
  if (await ui.confirm("Are you sure you want to reset the game? This will delete all progress.")) {
    resetGame();
  }
}

// Function to reset the game
function resetGame() {
  resetPlayerForNewGame();
  stopJailTimer();
  
  // Reset achievements
  achievements.forEach(achievement => achievement.unlocked = false);
  
  // Reset weekly challenges
  if (typeof weeklyChallenges !== 'undefined') {
    weeklyChallenges.length = 0;
  }
  
  updateUI();
  logAction("Game restarted.");
  goBackToMainMenu();
}

// Removed duplicate initialization - now using window.onload initGame() function

// Add some quality of life improvements
document.addEventListener('keydown', function(event) {
  // Tutorial navigation
  if (document.getElementById("tutorial-screen").style.display !== "none") {
    if (event.key === "ArrowRight" || event.key === "Enter") {
      event.preventDefault();
      if (currentTutorialStep === tutorialSteps.length - 1) {
        completeTutorial();
      } else {
        nextTutorialStep();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousTutorialStep();
    } else if (event.key === "Escape") {
      event.preventDefault();
      skipTutorial();
    }
    return; // Don't process other keys during tutorial
  }
  
  // Cheats: '=' for $100,000, '-' for 10 level ups (dev mode only)
  // To enable: open browser console and type: window.DEV_MODE = true
  if (window.DEV_MODE) {
    if (event.key === '=') {
      player.money += 100000;
      showBriefNotification("Cheat: +$100,000!", 'success');
      logAction("Cheat: You received $100,000!");
      updateUI();
    }
    if (event.key === '-') {
      for (let i = 0; i < 10; i++) {
        player.experience += Math.floor(player.level * 250 + Math.pow(player.level, 2) * 30);
        checkLevelUp();
      }
      showBriefNotification("Cheat: +10 level ups!", 'success');
      logAction("Cheat: You gained 10 level ups!");
      updateUI();
    }
  }
  
  // Quick navigation
  if (event.key === 'j' || event.key === 'J') {
    const cmdCenter = document.getElementById("safehouse");
    if (cmdCenter && cmdCenter.style.display === "block") {
      showJobs();
    }
  }
  if (event.key === 's' || event.key === 'S') {
    const cmdCenter = document.getElementById("safehouse");
    if (cmdCenter && cmdCenter.style.display === "block") {
      showStore();
    }
  }
  if (event.key === 'Escape') {
    goBackToMainMenu();
  }
});

// Initialize the game when the page loads
function initGame() {
  // Display version on title screen
  const introVersion = document.getElementById('intro-version');
  if (introVersion) {
    introVersion.textContent = `Version ${CURRENT_VERSION}`;
  }

  // Start only silent/essential systems; noisy gameplay systems are deferred
  // until the player actually enters the game (see activateGameplaySystems).
  initializeSaveSystem(); // Initialize save system
  initializeInterfaceImprovements(); // Initialize interface improvements (hotkeys)
  initializeLegacyBonuses(); // Initialize legacy system bonuses

  // Silently determine season & weather without logging
  updateCurrentSeason();
  changeWeather();
  if (!player.activeEvents) { player.activeEvents = []; }

  // Generate initial prisoners and recruits
  generateJailPrisoners();
  generateJailbreakPrisoners();
  generateAvailableRecruits();
  
  // Initialize mission system
  updateMissionAvailability();
  
  // Initialize territory system
  calculateTotalTerritoryIncome();
  
  // Start energy regeneration if needed
  if (player.energy < player.maxEnergy && !player.inJail) {
    startEnergyRegenTimer();
  }
  
  // Show the title screen and let the player choose
  document.getElementById("menu").style.display = "none";
  document.getElementById("intro-screen").style.display = "block";
  
  // Add event listener for character name input
  const charNameInput = document.getElementById('character-name');
  if (charNameInput) {
    charNameInput.addEventListener('input', updateCharacterPreview);
  }
  
  // Load portrait grid when character creation is available
  setTimeout(() => {
    loadPortraitGrid();
  }, 100);
}

// ==================== ACTIVATE GAMEPLAY SYSTEMS ====================
// Called once when the player actually enters the game (not on title screen).
// This starts all the noisy event/timer systems that were deferred from initGame().
function activateGameplaySystems() {
  if (gameplayActive) return; // Already activated
  gameplayActive = true;

  // Start event & timer systems
  startRandomEventChecker();
  startPassiveIncomeGenerator();
  startEnergyRegeneration();
  startGangTributeTimer();
  startScreenRefreshTimer();
  initializeEventsSystem();
  initializeCompetitionSystem();

  // Initialize expanded systems (gang roles, territory wars, etc.)
  ExpandedSystems.initializeExpandedSystems(player);

  // Start rival AI and interactive events
  ExpandedUI.startRivalAISystem();
  setInterval(() => { if (gameplayActive) ExpandedUI.checkAndTriggerInteractiveEvent(); }, 60000);

  // Initialize UI Events
  if (typeof initUIEvents === 'function') {
    initUIEvents();
  }

  // Initialize Onboarding (Act 0 Guide)
  initOnboarding();
}

// Call initialization when page loads
// ==================== INTERFACE IMPROVEMENTS SYSTEM ====================

// Interface Improvements and Hotkey System
function initializeInterfaceImprovements() {
  // Initialize hotkey system
  initializeHotkeys();
  
  // Initialize player statistics if not exists
  if (!player.statistics) {
    player.statistics = initializePlayerStatistics();
  }
  
  if (gameplayActive) {
    logAction("🎮 Interface improvements activated - hotkeys available!");
  }
}

// Hotkey system
function initializeHotkeys() {
  document.addEventListener('keydown', function(event) {
    // Don't trigger hotkeys if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const key = event.key.toLowerCase();
    
    // Prevent default behavior for our hotkeys
    const hotkeyMap = {
      'j': () => showJobs(),
      's': () => showStore(), 
      'g': () => showGang(),
      'c': () => showStolenCars(),
      'k': () => showSkills(),
      'b': () => showBusinesses(),
      't': () => showTerritoryControl(),
      'l': () => showCalendar(),
      'm': () => showMap(),
      'z': () => showStatistics(),
      'r': () => showEmpireRating(),
      'o': () => showEmpireOverview(), // New hotkey for Empire Overview
      'h': () => showHallOfFame(),
      'f5': () => showSaveSystem(),
      'f7': () => showCompetition(),
      'e': () => buyEnergyDrink(),
      'escape': () => goBackToMainMenu()
    };
    
    if (hotkeyMap[key]) {
      event.preventDefault();
      hotkeyMap[key]();
    }
  });
}

// Map System
function showMap() {
  hideAllScreens();
  document.getElementById("map-screen").style.display = "block";
  
  let mapHTML = `
    <h2>🗺️ Territory Map</h2>
    <p>Visual representation of your criminal empire and available territories</p>
    
    <div style="margin: 20px 0; padding: 15px; background: rgba(52, 152, 219, 0.2); border-radius: 10px;">
      <h3 style="color: #3498db; margin: 0 0 10px 0;">💡 Map Legend</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div style="color: #2ecc71;">🟢 Controlled Territory</div>
        <div style="color: #f39c12;">🟠 Available Territory</div>
        <div style="color: #e74c3c;">🔴 Rival Gang Territory</div>
        <div style="color: #95a5a6;">⚫ Locked Territory</div>
      </div>
    </div>
    
    <div class="map-container">`;
  
  // Get all district types for the map
  const allDistricts = [
    {id: 'downtown', name: 'Downtown', icon: '🏙️', baseIncome: 5000, acquisitionCost: 50000},
    {id: 'warehouse', name: 'Warehouse District', icon: '🏭', baseIncome: 3000, acquisitionCost: 30000},
    {id: 'residential', name: 'Residential', icon: '🏘️', baseIncome: 2000, acquisitionCost: 20000},
    {id: 'commercial', name: 'Commercial', icon: '🏬', baseIncome: 4000, acquisitionCost: 40000},
    {id: 'docks', name: 'The Docks', icon: '⚓', baseIncome: 6000, acquisitionCost: 60000},
    {id: 'chinatown', name: 'Chinatown', icon: '🏮', baseIncome: 3500, acquisitionCost: 35000},
    {id: 'industrial', name: 'Industrial Zone', icon: '🏗️', baseIncome: 4500, acquisitionCost: 45000},
    {id: 'uptown', name: 'Uptown', icon: '🏛️', baseIncome: 7000, acquisitionCost: 70000},
    {id: 'suburbs', name: 'Suburbs', icon: '🏡', baseIncome: 2500, acquisitionCost: 25000},
    {id: 'redlight', name: 'Red Light District', icon: '🌃', baseIncome: 5500, acquisitionCost: 55000},
    {id: 'university', name: 'University District', icon: '🎓', baseIncome: 3000, acquisitionCost: 30000},
    {id: 'airport', name: 'Airport Area', icon: '✈️', baseIncome: 8000, acquisitionCost: 80000}
  ];
  
  allDistricts.forEach(district => {
    const isControlled = player.territories && player.territories.some(t => t.districtId === district.id);
    const canAfford = player.money >= district.acquisitionCost;
    const hasEnoughPower = player.territoryPower >= (district.acquisitionCost / 100);
    
    let tileClass = 'territory-tile ';
    let statusText = '';
    let clickAction = '';
    
    if (isControlled) {
      tileClass += 'territory-controlled';
      statusText = 'CONTROLLED';
      clickAction = `onclick="manageTerritoryDetails('${district.id}')"`;
    } else if (canAfford && hasEnoughPower) {
      tileClass += 'territory-available';
      statusText = `$${(district.acquisitionCost / 1000)}K`;
      clickAction = `onclick="acquireTerritory('${district.id}')"`;
    } else {
      // Deterministic rival check: districts costing more than player level * 5000 are rival-held
      const isRivalTerritory = district.acquisitionCost > player.level * 5000;
      tileClass += isRivalTerritory ? 'territory-rival' : 'territory-available';
      statusText = isRivalTerritory ? 'RIVAL GANG' : 'LOCKED';
      clickAction = `onclick="showTerritoryInfo('${district.id}')"`;
    }
    
    mapHTML += `
      <div class="${tileClass}" ${clickAction} title="Click for details">
        <div class="territory-icon">${district.icon}</div>
        <div class="territory-name">${district.name}</div>
        <div class="territory-info">
          <div style="color: ${isControlled ? '#2ecc71' : canAfford ? '#f39c12' : '#e74c3c'}; font-weight: bold;">
            ${statusText}
          </div>
          <div style="font-size: 0.8em;">
            Income: $${district.baseIncome.toLocaleString()}/week
          </div>
        </div>
      </div>
    `;
  });
  
  mapHTML += `
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button onclick="showTerritoryControl()" style="background: #3498db; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🏛️ Territory Management
      </button>
      <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("map-content").innerHTML = mapHTML;
}

function showTerritoryInfo(districtId) {
  const districtInfo = {
    'downtown': {name: 'Downtown', description: 'The heart of the city with high-value targets and heavy police presence.'},
    'warehouse': {name: 'Warehouse District', description: 'Industrial area perfect for smuggling operations and storage.'},
    'residential': {name: 'Residential', description: 'Quiet neighborhoods ideal for protection rackets.'},
    'commercial': {name: 'Commercial', description: 'Shopping areas with steady income from businesses.'},
    'docks': {name: 'The Docks', description: 'Import/export hub for international criminal activities.'},
    'chinatown': {name: 'Chinatown', description: 'Cultural district with unique criminal opportunities.'},
  };
  
  const info = districtInfo[districtId] || {name: 'Unknown Territory', description: 'No information available.'};
  alert(`${info.name}\n\n${info.description}\n\nThis territory is currently not available for acquisition.`);
}

// Calendar System
function showCalendar() {
  hideAllScreens();
  document.getElementById("calendar-screen").style.display = "block";
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  let calendarHTML = `
    <h2>📅 Criminal Calendar</h2>
    <p>Track your tribute collections, events, and important dates</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <h3>${monthNames[currentMonth]} ${currentYear}</h3>
    </div>
    
    <div class="calendar-grid">
      <div class="calendar-header">Sun</div>
      <div class="calendar-header">Mon</div>
      <div class="calendar-header">Tue</div>
      <div class="calendar-header">Wed</div>
      <div class="calendar-header">Thu</div>
      <div class="calendar-header">Fri</div>
      <div class="calendar-header">Sat</div>
  `;
  
  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += `<div class="calendar-day" style="opacity: 0.3;"></div>`;
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDay;
    const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
    
    // Check for events on this day
    let events = [];
    
    // Territory tribute collection (every 7 days)
    if (player.territories && player.territories.length > 0 && day % 7 === 0) {
      events.push('<div class="calendar-event">💰 Tribute Collection</div>');
    }
    
    // Gang operations on days matching gang size pattern (deterministic)
    if (player.gang && player.gang.gangMembers && player.gang.gangMembers.length > 0 && day % Math.max(2, 8 - player.gang.gangMembers.length) === 0) {
      events.push('<div class="calendar-event">👥 Gang Operation</div>');
    }
    
    // Business income day (every 5 days if player has businesses)
    if (player.businesses && player.businesses.length > 0 && day % 5 === 0) {
      events.push('<div class="calendar-event">🏭 Business Income</div>');
    }
    
    // Real estate collection (1st and 15th if player owns properties)
    if (player.realEstate && player.realEstate.ownedProperties && player.realEstate.ownedProperties.length > 0 && (day === 1 || day === 15)) {
      events.push('<div class="calendar-event">🏠 Rent Collection</div>');
    }
    
    // Special events
    if (day === 15) {
      events.push('<div class="calendar-event">🌟 Monthly Review</div>');
    }
    
    calendarHTML += `
      <div class="${dayClass}" onclick="showDayDetails(${day}, ${currentMonth}, ${currentYear})">
        <div style="font-weight: bold; margin-bottom: 5px;">${day}</div>
        ${events.join('')}
      </div>
    `;
  }
  
  calendarHTML += `
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background: rgba(52, 73, 94, 0.6); border-radius: 10px;">
      <h3 style="color: #f39c12; margin-bottom: 15px;">📋 Upcoming Events</h3>
      <div style="display: grid; gap: 10px;">
  `;
  
  // Show upcoming events
  const upcomingEvents = [];
  
  if (player.territories && player.territories.length > 0) {
    const nextTribute = Math.ceil(currentDay / 7) * 7;
    if (nextTribute <= daysInMonth) {
      upcomingEvents.push(`💰 Next tribute collection: ${monthNames[currentMonth]} ${nextTribute}`);
    }
  }
  
  if (activeEvents && activeEvents.length > 0) {
    activeEvents.forEach(event => {
      const endDate = new Date(event.endTime);
      upcomingEvents.push(`${event.icon || '📰'} ${event.name} ends: ${endDate.toLocaleDateString()}`);
    });
  }
  
  if (upcomingEvents.length === 0) {
    upcomingEvents.push("📅 No scheduled events - perfect time to plan your next move");
  }
  
  upcomingEvents.forEach(event => {
    calendarHTML += `<div style="padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;">${event}</div>`;
  });
  
  calendarHTML += `
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("calendar-content").innerHTML = calendarHTML;
}

function showDayDetails(day, month, year) {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  let details = `${monthNames[month]} ${day}, ${year}\n\n`;
  
  // Add any special events for this day
  if (player.territories && player.territories.length > 0 && day % 7 === 0) {
    details += "💰 Territory tribute collection day\n";
  }
  
  if (day === 15) {
    details += "🌟 Monthly criminal empire review\n";
  }
  
  details += "\nClick on other days to see their events.";
  
  alert(details);
}

// Statistics System
function initializePlayerStatistics() {
  return {
    jobsCompleted: 0,
    jobsFailed: 0,
    totalMoneyEarned: 0,
    totalMoneySpent: 0,
    timesArrested: 0,
    timesEscaped: 0,
    carsStolen: 0,
    carsSold: 0,
    businessesOwned: 0,
    territoriesControlled: 0,
    gangMembersRecruited: 0,
    enemiesEliminated: 0,
    bribesGiven: 0,
    hospitalVisits: 0,
    skillPointsEarned: 0,
    achievementsUnlocked: 0,
    playTimeMinutes: 0,
    startDate: Date.now(),
    highestWantedLevel: 0,
    longestJailTime: 0,
    bestJobStreak: 0,
    currentJobStreak: 0,
    favoriteCrime: "None",
    jobCounts: {}, // Track how many times each job/crime has been completed
    luckiestDay: "Never",
    busiestHour: 0
  };
}

function showStatistics() {
  hideAllScreens();
  document.getElementById("statistics-screen").style.display = "block";
  
  if (!player.statistics) {
    player.statistics = initializePlayerStatistics();
  }
  
  const stats = player.statistics;
  const playTime = Math.floor((Date.now() - stats.startDate) / (1000 * 60));
  stats.playTimeMinutes = playTime;
  
  // Calculate some derived statistics
  const successRate = stats.jobsCompleted + stats.jobsFailed > 0 ? 
    ((stats.jobsCompleted / (stats.jobsCompleted + stats.jobsFailed)) * 100).toFixed(1) : 0;
  const escapeRate = stats.timesArrested > 0 ? 
    ((stats.timesEscaped / stats.timesArrested) * 100).toFixed(1) : 0;
  const profitMargin = stats.totalMoneySpent > 0 ? 
    (((stats.totalMoneyEarned - stats.totalMoneySpent) / stats.totalMoneyEarned) * 100).toFixed(1) : 0;
  
  let statisticsHTML = `
    <h2>📊 Criminal Career Statistics</h2>
    <p>Detailed analysis of your rise through the criminal underworld</p>
    
    <div class="stats-grid">
      <div class="stat-category">
        <h3>🎯 Job Performance</h3>
        <div class="stat-item">
          <span class="stat-label">Jobs Completed:</span>
          <span class="stat-value">${stats.jobsCompleted}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Jobs Failed:</span>
          <span class="stat-value">${stats.jobsFailed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Success Rate:</span>
          <span class="stat-highlight">${successRate}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Best Job Streak:</span>
          <span class="stat-value">${stats.bestJobStreak}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Streak:</span>
          <span class="stat-value">${stats.currentJobStreak}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Favorite Crime:</span>
          <span class="stat-value">${stats.favoriteCrime}</span>
        </div>
      </div>
      
      <div class="stat-category">
        <h3>💰 Financial Empire</h3>
        <div class="stat-item">
          <span class="stat-label">Total Money Earned:</span>
          <span class="stat-highlight">$${stats.totalMoneyEarned.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Money Spent:</span>
          <span class="stat-value">$${stats.totalMoneySpent.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Money:</span>
          <span class="stat-value">$${player.money.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Profit Margin:</span>
          <span class="stat-highlight">${profitMargin}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Businesses Owned:</span>
          <span class="stat-value">${player.businesses ? player.businesses.length : 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Territories Controlled:</span>
          <span class="stat-value">${player.territories ? player.territories.length : 0}</span>
        </div>
      </div>
      
      <div class="stat-category">
        <h3>🚔 Law Enforcement</h3>
        <div class="stat-item">
          <span class="stat-label">Times Arrested:</span>
          <span class="stat-value">${stats.timesArrested}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Times Escaped:</span>
          <span class="stat-value">${stats.timesEscaped}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Escape Rate:</span>
          <span class="stat-highlight">${escapeRate}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Highest Wanted Level:</span>
          <span class="stat-value">${Math.max(stats.highestWantedLevel, player.wantedLevel)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Longest Jail Time:</span>
          <span class="stat-value">${stats.longestJailTime}s</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Hospital Visits:</span>
          <span class="stat-value">${stats.hospitalVisits}</span>
        </div>
      </div>
      
      <div class="stat-category">
        <h3>🚗 Criminal Assets</h3>
        <div class="stat-item">
          <span class="stat-label">Cars Stolen:</span>
          <span class="stat-value">${stats.carsStolen}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Cars Sold:</span>
          <span class="stat-value">${stats.carsSold}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Garage Size:</span>
          <span class="stat-value">${player.stolenCars.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Gang Members:</span>
          <span class="stat-value">${player.gang && player.gang.gangMembers ? player.gang.gangMembers.length : 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Members Recruited:</span>
          <span class="stat-value">${stats.gangMembersRecruited}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Enemies Eliminated:</span>
          <span class="stat-value">${stats.enemiesEliminated}</span>
        </div>
      </div>
      
      <div class="stat-category">
        <h3>📈 Character Development</h3>
        <div class="stat-item">
          <span class="stat-label">Current Level:</span>
          <span class="stat-highlight">${player.level}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Experience:</span>
          <span class="stat-value">${player.experience}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Skill Points Earned:</span>
          <span class="stat-value">${stats.skillPointsEarned}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Reputation:</span>
          <span class="stat-value">${Math.floor(player.reputation)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Achievements Unlocked:</span>
          <span class="stat-value">${achievements.filter(a => a.unlocked).length}/${achievements.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Power:</span>
          <span class="stat-value">${player.power}</span>
        </div>
      </div>
      
      <div class="stat-category">
        <h3>⏰ Time & Activity</h3>
        <div class="stat-item">
          <span class="stat-label">Play Time:</span>
          <span class="stat-value">${Math.floor(playTime / 60)}h ${playTime % 60}m</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Career Started:</span>
          <span class="stat-value">${new Date(stats.startDate).toLocaleDateString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Luckiest Day:</span>
          <span class="stat-value">${stats.luckiestDay}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Most Active Hour:</span>
          <span class="stat-value">${stats.busiestHour}:00</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Status:</span>
          <span class="stat-value">${player.inJail ? 'In Jail' : 'Free'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Current Health:</span>
          <span class="stat-value">${player.health}/100</span>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <button onclick="exportStatistics()" style="background: #3498db; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        📋 Export Stats
      </button>
      <button onclick="resetStatistics()" style="background: #e74c3c; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🔄 Reset Stats
      </button>
      <button onclick="goBackToMainMenu()" style="background: #95a5a6; color: white; padding: 12px 25px; margin: 5px; border: none; border-radius: 8px; cursor: pointer;">
        🏠Back to SafeHouse
      </button>
    </div>
  `;
  
  document.getElementById("statistics-content").innerHTML = statisticsHTML;
}

function exportStatistics() {
  const stats = player.statistics;
  const exportData = {
    playerName: player.name,
    level: player.level,
    money: player.money,
    reputation: player.reputation,
    statistics: stats,
    exportDate: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${player.name || 'Criminal'}_stats_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  
  logAction("📊 Statistics exported successfully!");
}

async function resetStatistics() {
  if (await ui.confirm("Are you sure you want to reset all statistics? This action cannot be undone.")) {
    player.statistics = initializePlayerStatistics();
    showStatistics(); // Refresh the display
    logAction("📊 Statistics reset successfully!");
  }
}

// Track individual job/crime completions
function trackJobCompletion(jobName) {
  if (!player.statistics) {
    player.statistics = initializePlayerStatistics();
  }
  
  // Initialize jobCounts if it doesn't exist (for older saves)
  if (!player.statistics.jobCounts) {
    player.statistics.jobCounts = {};
  }
  
  // Increment the count for this specific job
  player.statistics.jobCounts[jobName] = (player.statistics.jobCounts[jobName] || 0) + 1;
  
  // Update favorite crime by finding the most completed job
  let maxCount = 0;
  let favoriteCrime = "None";
  
  for (const [jobName, count] of Object.entries(player.statistics.jobCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCrime = jobName;
    }
  }
  
  player.statistics.favoriteCrime = favoriteCrime;
}

// Update statistics tracking functions
function updateStatistic(stat, value = 1) {
  if (!player.statistics) {
    player.statistics = initializePlayerStatistics();
  }
  
  if (typeof player.statistics[stat] === 'number') {
    player.statistics[stat] += value;
    
    // Update derived statistics
    if (stat === 'timesArrested') {
      player.statistics.highestWantedLevel = Math.max(player.statistics.highestWantedLevel, player.wantedLevel);
      // Update longest jail time if current jail time is longer
      if (player.jailTime > player.statistics.longestJailTime) {
        player.statistics.longestJailTime = player.jailTime;
      }
    }
    
    if (stat === 'jobsCompleted') {
      player.statistics.currentJobStreak++;
      player.statistics.bestJobStreak = Math.max(player.statistics.bestJobStreak, player.statistics.currentJobStreak);
    }
    
    if (stat === 'jobsFailed') {
      player.statistics.currentJobStreak = 0;
    }
  }
}

// ==================== END INTERFACE IMPROVEMENTS SYSTEM ====================

// ==================== LONG-TERM GOALS SYSTEM ====================

// Criminal Empire Rating Calculation
function calculateEmpireRating() {
  if (!player.empireRating) {
    player.empireRating = {
      totalScore: 0,
      moneyPower: 0,
      gangPower: 0,
      territoryPower: 0,
      businessPower: 0,
      reputationPower: 0,
      skillPower: 0
    };
  }

  // Money Power (max 2000 points)
  player.empireRating.moneyPower = Math.min(2000, Math.floor(player.money / 1000));
  
  // Gang Power (max 1500 points)
  const gangSize = player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members;
  player.empireRating.gangPower = Math.min(1500, gangSize * 50 + (player.gang.loyalty || 0) * 10);
  
  // Territory Power (max 1500 points)
  player.empireRating.territoryPower = Math.min(1500, player.territory * 100);
  
  // Business Power (max 1500 points)
  const businessCount = player.businesses ? player.businesses.length : 0;
  player.empireRating.businessPower = Math.min(1500, businessCount * 100);
  
  // Reputation Power (max 2000 points)
  player.empireRating.reputationPower = Math.min(2000, Math.floor(player.reputation) * 5);
  
  // Skill Power (max 1500 points)
  const totalSkills = Object.values(player.skills).reduce((sum, skill) => sum + skill, 0);
  player.empireRating.skillPower = Math.min(1500, totalSkills * 10);
  
  // Calculate total score
  player.empireRating.totalScore = 
    player.empireRating.moneyPower +
    player.empireRating.gangPower +
    player.empireRating.territoryPower +
    player.empireRating.businessPower +
    player.empireRating.reputationPower +
    player.empireRating.skillPower;
  
  return player.empireRating;
}

// Get Empire Rating Grade
function getEmpireRatingGrade(score) {
  if (score >= 9000) return { grade: "LEGENDARY", color: "#ff6b35", description: "Criminal Mastermind" };
  if (score >= 7500) return { grade: "S+", color: "#f39c12", description: "Underworld Kingpin" };
  if (score >= 6000) return { grade: "S", color: "#e74c3c", description: "Crime Boss" };
  if (score >= 4500) return { grade: "A+", color: "#9b59b6", description: "Mob Lieutenant" };
  if (score >= 3000) return { grade: "A", color: "#3498db", description: "Gang Leader" };
  if (score >= 1500) return { grade: "B", color: "#2ecc71", description: "Street Captain" };
  if (score >= 750) return { grade: "C", color: "#95a5a6", description: "Thug" };
  return { grade: "D", color: "#7f8c8d", description: "Street Criminal" };
}

// Check retirement eligibility
function checkRetirementEligibility() {
  const rating = calculateEmpireRating();
  const eligibleOptions = [];
  
  for (const [key, outcome] of Object.entries(retirementOutcomes)) {
    let eligible = true;
    const reqs = outcome.requirements;
    
    // All funds are now clean-only in player.money; dirty is separate
    if (reqs.cleanMoney && player.money < reqs.cleanMoney) eligible = false;
    if (reqs.money && player.money < reqs.money) eligible = false;
    if (reqs.businessEmpire && (!player.businesses || player.businesses.length < reqs.businessEmpire)) eligible = false;
    if (reqs.lowHeat && player.wantedLevel > 20) eligible = false;
    if (reqs.privateAirplane && !player.inventory.some(item => item.name === "Private Airplane")) eligible = false;
    if (reqs.lowWantedLevel && player.wantedLevel > 10) eligible = false;
    if (reqs.gangMembers && (!player.gang.gangMembers || player.gang.gangMembers.length < reqs.gangMembers)) eligible = false;
    if (reqs.territories && player.territory < reqs.territories) eligible = false;
    if (reqs.businesses && (!player.businesses || player.businesses.length < reqs.businesses)) eligible = false;
    if (reqs.empireRating && rating.totalScore < reqs.empireRating) eligible = false;
    
    if (eligible) {
      eligibleOptions.push({ key, ...outcome });
    }
  }
  
  player.retirementPlan.available = eligibleOptions.length > 0;
  return eligibleOptions;
}

// Execute retirement plan
function executeRetirement(retirementKey) {
  const outcome = retirementOutcomes[retirementKey];
  if (!outcome) return;
  
  // Calculate final character data for hall of fame
  const rating = calculateEmpireRating();
  const characterData = {
    name: player.name || "Anonymous Criminal",
    retirementType: outcome.name,
    empireRating: rating.totalScore,
    finalMoney: player.money,
    gangSize: player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members,
    territories: player.territory,
    businesses: player.businesses ? player.businesses.length : 0,
    reputation: Math.floor(player.reputation),
    level: player.level,
    playTime: Date.now() - player.startTime,
    retirementDate: new Date().toISOString(),
    statistics: player.statistics ? {...player.statistics} : {},
    generationNumber: player.legacy ? player.legacy.generationNumber : 1
  };
  
  // Add to criminal hall of fame
  addToHallOfFame(characterData);
  
  // Apply legacy bonuses to next character
  applyLegacyBonus(outcome.legacyBonus);
  
  // Show retirement screen
  showRetirementOutcome(characterData, outcome);
}

// Add character to hall of fame
function addToHallOfFame(characterData) {
  if (!criminalHallOfFame) {
    criminalHallOfFame = [];
  }
  
  criminalHallOfFame.push(characterData);
  
  // Keep only top 50 characters to prevent storage bloat
  criminalHallOfFame.sort((a, b) => b.empireRating - a.empireRating);
  criminalHallOfFame = criminalHallOfFame.slice(0, 50);
  
  // Save to localStorage
  localStorage.setItem('criminalHallOfFame', JSON.stringify(criminalHallOfFame));
}

// Apply legacy bonus to new character
function applyLegacyBonus(legacyBonus) {
  const legacyData = {
    bonuses: legacyBonus,
    familyReputation: (player.legacy ? player.legacy.familyReputation : 0) + (legacyBonus.familyReputation || 0),
    generationNumber: (player.legacy ? player.legacy.generationNumber : 1) + 1,
    previousCharacters: player.legacy ? [...player.legacy.previousCharacters, player.name] : [player.name]
  };
  
  localStorage.setItem('criminalLegacy', JSON.stringify(legacyData));
}

// Initialize legacy bonuses for new character
function initializeLegacyBonuses() {
  const legacyData = JSON.parse(localStorage.getItem('criminalLegacy'));
  if (!legacyData) return;
  
  player.legacy = {
    inheritanceBonus: 0,
    familyReputation: legacyData.familyReputation || 0,
    generationNumber: legacyData.generationNumber || 1,
    previousCharacters: legacyData.previousCharacters || []
  };
  
  // Apply bonuses from previous character
  const bonuses = legacyData.bonuses;
  if (bonuses) {
    if (bonuses.startingMoney) {
      player.money += bonuses.startingMoney;
      player.legacy.inheritanceBonus += bonuses.startingMoney;
    }
    if (bonuses.skillBonus) {
      Object.keys(player.skills).forEach(skill => {
        player.skills[skill] += bonuses.skillBonus;
      });
    }
    if (bonuses.inheritedGang) {
      player.gang.members += bonuses.inheritedGang;
      for (let i = 0; i < bonuses.inheritedGang; i++) {
        const member = generateLegacyGangMember();
        player.gang.gangMembers.push(member);
      }
    }
    if (bonuses.inheritedTerritory) {
      player.territory += bonuses.inheritedTerritory;
    }
    if (bonuses.inheritedBusiness) {
      // Add inherited businesses
      for (let i = 0; i < bonuses.inheritedBusiness; i++) {
        const business = generateLegacyBusiness();
        player.businesses.push(business);
      }
    }
  }
  
  // Log legacy start
  if (player.legacy.generationNumber > 1) {
    logAction(`🏛️ Generation ${player.legacy.generationNumber} begins! The ${player.legacy.previousCharacters[player.legacy.previousCharacters.length - 1]} family legacy continues with ${player.name}.`);
  }
}

// Generate legacy gang member
function generateLegacyGangMember() {
  const names = ["Tony Jr.", "Little Mike", "Cousin Sal", "Family Friend", "Inherited Muscle"];
  return {
    name: names[Math.floor(Math.random() * names.length)],
    skill: "Inherited Loyalty",
    loyalty: 80 + Math.floor(Math.random() * 20), // 80-100 loyalty
    power: 15 + Math.floor(Math.random() * 10), // 15-25 power
    experienceLevel: 3 + Math.floor(Math.random() * 4), // 3-7 experience
    tributeMultiplier: 1.2, // Better tribute than normal
    joinedDate: Date.now()
  };
}

// Generate legacy business
function generateLegacyBusiness() {
  const legacyBusinesses = [
    { type: "restaurant", name: "Family Restaurant", level: 2 },
    { type: "garage", name: "Inherited Garage", level: 2 },
    { type: "warehouse", name: "Family Warehouse", level: 1 }
  ];
  
  const template = legacyBusinesses[Math.floor(Math.random() * legacyBusinesses.length)];
  return {
    type: template.type,
    name: template.name,
    level: template.level,
    lastCollection: Date.now() - (1000 * 60 * 60 * Math.floor(Math.random() * 12)) // 0-12 hours ago
  };
}

// Show Criminal Empire Rating screen
function showEmpireRating() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const rating = calculateEmpireRating();
  const grade = getEmpireRatingGrade(rating.totalScore);
  const eligibleRetirements = checkRetirementEligibility();
  
  const content = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; color: ${grade.color}; font-size: 2.5em; margin-bottom: 10px;">
        ⭐ Empire Rating ⭐
      </h2>
      
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 15px; border: 3px solid ${grade.color};">
        <h1 style="color: ${grade.color}; font-size: 4em; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          ${grade.grade}
        </h1>
        <h3 style="color: #ecf0f1; margin: 5px 0;">${grade.description}</h3>
        <p style="color: #bdc3c7; font-size: 1.3em; margin: 10px 0;">
          Total Empire Score: <span style="color: ${grade.color}; font-weight: bold;">${rating.totalScore.toLocaleString()}</span>
        </p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="rating-category">
          <h3 style="color: #2ecc71;">💰 Money Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.moneyPower/2000)*100}%; background: #2ecc71;"></div>
          </div>
          <p>${rating.moneyPower}/2000 points</p>
        </div>
        
        <div class="rating-category">
          <h3 style="color: #e74c3c;">👥 Gang Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.gangPower/1500)*100}%; background: #e74c3c;"></div>
          </div>
          <p>${rating.gangPower}/1500 points</p>
        </div>
        
        <div class="rating-category">
          <h3 style="color: #f39c12;">🏛️ Territory Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.territoryPower/1500)*100}%; background: #f39c12;"></div>
          </div>
          <p>${rating.territoryPower}/1500 points</p>
        </div>
        
        <div class="rating-category">
          <h3 style="color: #9b59b6;">🏭 Business Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.businessPower/1500)*100}%; background: #9b59b6;"></div>
          </div>
          <p>${rating.businessPower}/1500 points</p>
        </div>
        
        <div class="rating-category">
          <h3 style="color: #3498db;">⭐ Reputation Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.reputationPower/2000)*100}%; background: #3498db;"></div>
          </div>
          <p>${rating.reputationPower}/2000 points</p>
        </div>
        
        <div class="rating-category">
          <h3 style="color: #1abc9c;">🧠 Skill Power</h3>
          <div class="progress-bar">
            <div style="width: ${(rating.skillPower/1500)*100}%; background: #1abc9c;"></div>
          </div>
          <p>${rating.skillPower}/1500 points</p>
        </div>
      </div>
      
      ${eligibleRetirements.length > 0 ? `
        <div style="margin-top: 30px; padding: 20px; background: rgba(46, 204, 113, 0.2); border-radius: 15px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; text-align: center;">🌅 Retirement Options Available</h3>
          <p style="text-align: center; color: #ecf0f1;">You've built an empire worthy of retirement. Choose your legacy:</p>
          <div style="display: grid; gap: 15px; margin-top: 20px;">
            ${eligibleRetirements.map(retirement => `
              <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; border: 1px solid #2ecc71;">
                <h4 style="color: #2ecc71; margin: 0 0 10px 0;">${retirement.name}</h4>
                <p style="margin: 0 0 15px 0; color: #bdc3c7;">${retirement.description}</p>
                <button onclick="confirmRetirement('${retirement.key}')" 
                    style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                  Choose This Path
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="showHallOfFame()" style="background: linear-gradient(45deg, #f39c12, #e67e22); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          🏆 Hall of Fame
        </button>
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

// Show Criminal Hall of Fame
function showHallOfFame() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const hallOfFame = JSON.parse(localStorage.getItem('criminalHallOfFame')) || [];
  
  const content = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2 style="text-align: center; color: #f39c12; font-size: 2.5em; margin-bottom: 20px;">
        🏆 Criminal Hall of Fame 🏆
      </h2>
      <p style="text-align: center; color: #bdc3c7; margin-bottom: 30px;">
        Legends of the underworld - characters who built empires and chose their destiny
      </p>
      
      ${hallOfFame.length === 0 ? `
        <div style="text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 15px;">
          <h3 style="color: #95a5a6;">No legends yet...</h3>
          <p style="color: #7f8c8d;">Build your empire and retire to become the first legend!</p>
        </div>
      ` : `
        <div style="display: grid; gap: 15px;">
          ${hallOfFame.map((character, index) => {
            const grade = getEmpireRatingGrade(character.empireRating);
            const playTimeHours = Math.floor((character.playTime || 0) / (1000 * 60 * 60));
            return `
              <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 15px; border: 2px solid ${grade.color}; display: grid; grid-template-columns: auto 1fr auto; gap: 20px; align-items: center;">
                <div style="text-align: center;">
                  <h2 style="color: ${grade.color}; margin: 0; font-size: 2em;">#${index + 1}</h2>
                  <p style="color: ${grade.color}; margin: 5px 0; font-weight: bold;">${grade.grade}</p>
                </div>
                
                <div>
                  <h3 style="color: #ecf0f1; margin: 0 0 10px 0;">
                    ${character.name} ${character.generationNumber > 1 ? `(Gen ${character.generationNumber})` : ''}
                  </h3>
                  <p style="color: #3498db; margin: 5px 0; font-weight: bold;">${character.retirementType}</p>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 10px;">
                    <div><span style="color: #2ecc71;">💰</span> $${character.finalMoney.toLocaleString()}</div>
                    <div><span style="color: #e74c3c;">👥</span> ${character.gangSize} members</div>
                    <div><span style="color: #f39c12;">🏛️</span> ${character.territories} territories</div>
                    <div><span style="color: #9b59b6;">🏭</span> ${character.businesses} businesses</div>
                    <div><span style="color: #3498db;">⭐</span> ${character.reputation} reputation</div>
                    <div><span style="color: #1abc9c;">📈</span> Level ${character.level}</div>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <h2 style="color: ${grade.color}; margin: 0; font-size: 1.8em;">${character.empireRating.toLocaleString()}</h2>
                  <p style="color: #bdc3c7; margin: 5px 0; font-size: 0.9em;">Empire Score</p>
                  <p style="color: #95a5a6; margin: 5px 0; font-size: 0.8em;">${playTimeHours}h played</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="showEmpireRating()" style="background: linear-gradient(45deg, #3498db, #2980b9); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          ⭐ Current Rating
        </button>
        <button onclick="showAchievements()" style="background: linear-gradient(45deg, #f39c12, #e67e22); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          🏆 Achievements
        </button>
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

// Confirm retirement choice
function confirmRetirement(retirementKey) {
  const outcome = retirementOutcomes[retirementKey];
  if (!outcome) return;
  
  const confirmMessage = `Are you sure you want to retire with "${outcome.name}"?\n\nThis will end your current character's story and start a new generation with legacy bonuses.\n\nThis action cannot be undone!`;
  
  if (confirm(confirmMessage)) {
    executeRetirement(retirementKey);
  }
}

// Show retirement outcome screen
function showRetirementOutcome(characterData, outcome) {
  const grade = getEmpireRatingGrade(characterData.empireRating);
  
  // Create retirement screen overlay
  const retirementHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 2000; overflow-y: auto; padding: 20px; box-sizing: border-box;">
      <div style="max-width: 800px; margin: 50px auto; padding: 40px; background: linear-gradient(135deg, rgba(44, 62, 80, 0.98) 0%, rgba(52, 73, 94, 0.98) 100%); border-radius: 20px; border: 3px solid ${grade.color}; text-align: center; color: white;">
        <h1 style="color: ${grade.color}; font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          🌅 ${outcome.name}
        </h1>
        
        <h2 style="color: #ecf0f1; margin-bottom: 30px;">
          The ${characterData.name} Legacy Ends
        </h2>
        
        <div style="padding: 30px; background: rgba(0,0,0,0.4); border-radius: 15px; margin-bottom: 30px;">
          <h3 style="color: ${grade.color}; margin-bottom: 20px;">Final Empire Rating: ${grade.grade}</h3>
          <p style="font-size: 2em; color: ${grade.color}; margin: 0;">${characterData.empireRating.toLocaleString()} Points</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
          <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px;">
            <h4 style="color: #2ecc71; margin: 0;">💰 Final Wealth</h4>
            <p style="margin: 5px 0; font-size: 1.2em;">$${characterData.finalMoney.toLocaleString()}</p>
          </div>
          <div style="background: rgba(231, 76, 60, 0.2); padding: 15px; border-radius: 10px;">
            <h4 style="color: #e74c3c; margin: 0;">👥 Gang Size</h4>
            <p style="margin: 5px 0; font-size: 1.2em;">${characterData.gangSize} members</p>
          </div>
          <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px;">
            <h4 style="color: #f39c12; margin: 0;">🏛️ Territories</h4>
            <p style="margin: 5px 0; font-size: 1.2em;">${characterData.territories}</p>
          </div>
          <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px;">
            <h4 style="color: #9b59b6; margin: 0;">🏭 Businesses</h4>
            <p style="margin: 5px 0; font-size: 1.2em;">${characterData.businesses}</p>
          </div>
        </div>
        
        <div style="padding: 20px; background: rgba(46, 204, 113, 0.2); border-radius: 15px; margin-bottom: 30px;">
          <h3 style="color: #2ecc71; margin-bottom: 15px;">🎁 Legacy Bonuses for Next Character</h3>
          <div style="text-align: left;">
            ${Object.entries(outcome.legacyBonus).map(([key, value]) => {
              const bonusText = {
                startingMoney: `Starting Money: +$${value.toLocaleString()}`,
                businessDiscount: `Business Discount: ${(value * 100)}%`,
                familyReputation: `Family Reputation: +${value}`,
                skillBonus: `All Skills: +${value}`,
                luxuryStart: `Luxury Starting Items`,
                inheritedGang: `Inherited Gang Members: ${value}`,
                inheritedTerritory: `Inherited Territories: ${value}`,
                inheritedBusiness: `Inherited Businesses: ${value}`,
                legendaryStart: `Legendary Starting Package`,
                allSkillsBonus: `All Skills: +${value}`,
                startingEmpire: `Starting Empire Package`
              };
              return `<p style="margin: 5px 0; color: #ecf0f1;">• ${bonusText[key] || `${key}: ${value}`}</p>`;
            }).join('')}
          </div>
        </div>
        
        <p style="color: #bdc3c7; margin-bottom: 30px; font-style: italic;">
          "${outcome.description}"
        </p>
        
        <button onclick="startNewGeneration()" style="background: linear-gradient(45deg, #2ecc71, #27ae60); color: white; padding: 20px 40px; border: none; border-radius: 15px; font-size: 1.5em; font-weight: bold; cursor: pointer;">
          🌟 Begin New Generation
        </button>
      </div>
    </div>
  `;
  
  // Add to document
  const retirementScreen = document.createElement('div');
  retirementScreen.id = 'retirement-outcome-screen';
  retirementScreen.innerHTML = retirementHTML;
  document.body.appendChild(retirementScreen);
}

// Start new generation
function startNewGeneration() {
  // Clear current game data but preserve legacy
  const currentLegacy = JSON.parse(localStorage.getItem('criminalLegacy'));
  
  // Clear all game saves
  localStorage.removeItem('gameState');
  localStorage.removeItem('playerData');
  
  // Restart the game
  location.reload();
}

// ==================== END LONG-TERM GOALS SYSTEM ====================

// ==================== SAVE SYSTEM ====================

// Save system configuration
const SAVE_SYSTEM = {
  maxSlots: 10,
  autoSaveInterval: 60000, // 60 seconds
  currentSlot: 1,
  autoSaveEnabled: true,
  lastAutoSave: 0
};

// Initialize save system
function initializeSaveSystem() {
  // Load save system preferences
  const savePrefs = localStorage.getItem('saveSystemPrefs');
  if (savePrefs) {
    Object.assign(SAVE_SYSTEM, JSON.parse(savePrefs));
  }
  
  // Start auto-save if enabled
  if (SAVE_SYSTEM.autoSaveEnabled) {
    startAutoSave();
  }
  
  // Add window beforeunload handler for emergency save
  window.addEventListener('beforeunload', function(e) {
    if (SAVE_SYSTEM.autoSaveEnabled) {
      emergencySave();
    }
  });
}

// Auto-save functionality
function startAutoSave() {
  setInterval(() => {
    if (SAVE_SYSTEM.autoSaveEnabled && player && player.name) {
      autoSave();
    }
  }, SAVE_SYSTEM.autoSaveInterval);
}

function autoSave() {
  try {
    const currentTime = Date.now();
    // Auto-save to the currently loaded slot instead of always slot 0
    const targetSlot = SAVE_SYSTEM.currentSlot || 1; // Default to slot 1 if no current slot set
    saveGameToSlot(targetSlot, `${player.name} - ${getCurrentDateString()}`, true);
    SAVE_SYSTEM.lastAutoSave = currentTime;
    
    // Show brief auto-save notification
    showBriefNotification(`💾 Auto-saved to Slot ${targetSlot}`, 1000);
    
  } catch (error) {
    console.error("Auto-save failed:", error);
  }
}

function emergencySave() {
  try {
    if (player && player.name) {
      saveGameToSlot(-1, `Emergency - ${player.name}`, true); // Slot -1 is emergency save
    }
  } catch (error) {
    console.error("Emergency save failed:", error);
  }
}

// Core save/load functions
function saveGameToSlot(slotNumber, customName = null, isAutoSave = false) {
  try {
    // Validate player data before saving
    if (!player || !player.name || player.name.trim() === "") {
      console.error("Save failed: Player name is missing or empty");
      if (!isAutoSave) {
        alert("Save failed! Player name is missing. Please create a character first.");
      }
      return false;
    }
    
    const saveData = createSaveData();
    const saveName = customName || `${player.name} - ${getCurrentDateString()}`;
    const empireRating = calculateEmpireRating();
    const playtime = formatPlaytime(calculatePlaytime());
    
    const saveEntry = {
      slotNumber: slotNumber,
      saveName: saveName,
      playerName: player.name,
      level: player.level,
      money: player.money,
      reputation: Math.floor(player.reputation),
      empireRating: empireRating.totalScore,
      playtime: playtime,
      saveDate: new Date().toISOString(),
      isAutoSave: isAutoSave,
      gameVersion: "1.3.8",
      data: saveData
    };
    
    // Save to localStorage
    localStorage.setItem(`gameSlot_${slotNumber}`, JSON.stringify(saveEntry));
    
    // Update save slots list
    updateSaveSlotsList();
    
    if (!isAutoSave) {
      SAVE_SYSTEM.currentSlot = slotNumber;
      saveSaveSystemPrefs();
      logAction(`💾 Game saved to slot ${slotNumber}: ${saveName}`);
    }
    
    return true;
  } catch (error) {
    console.error("Save failed:", error);
    console.error("Player object:", player);
    if (!isAutoSave) {
      alert(`Save failed! Error: ${error.message}`);
    }
    return false;
  }
}

function loadGameFromSlot(slotNumber) {
  try {
    const saveEntryStr = localStorage.getItem(`gameSlot_${slotNumber}`);
    if (!saveEntryStr) {
      alert("No save data found in this slot!");
      return false;
    }
    
    const saveEntry = JSON.parse(saveEntryStr);
    const saveData = saveEntry.data;
    
    // Validate save data
    if (!validateSaveData(saveData)) {
      alert("Save data is corrupted or incompatible!");
      return false;
    }
    
    // Apply save data to current game
    applySaveData(saveData);
    
    // Update current slot
    SAVE_SYSTEM.currentSlot = slotNumber;
    saveSaveSystemPrefs();
    
    // Update UI
    updateUI();
    
    // Don't automatically navigate to any screen - let the caller handle that
    // Note: If player is in jail, applySaveData() already showed the jail screen
    
    logAction(`💾 Game loaded from slot ${slotNumber}: ${saveEntry.saveName}`);
    showBriefNotification(`✅ Loaded: ${saveEntry.saveName}`, 2000);
    
    return true;
  } catch (error) {
    console.error("Load failed:", error);
    alert("Failed to load save data!");
    return false;
  }
}

async function deleteGameSlot(slotNumber) {
  if (slotNumber === 0) {
    showBriefNotification("Cannot delete auto-save slot!", 'warning');
    return;
  }
  
  const saveEntry = getSaveEntry(slotNumber);
  if (!saveEntry) {
    showBriefNotification("No save data in this slot!", 'warning');
    return;
  }
  
  if (await ui.confirm(`Delete save "${saveEntry.saveName}"?<br><br>This action cannot be undone!`)) {
    localStorage.removeItem(`gameSlot_${slotNumber}`);
    updateSaveSlotsList();
    logAction(`🗑️ Deleted save from slot ${slotNumber}`);
    showBriefNotification("🗑️ Save deleted", 1500);
  }
}

// Save data creation and validation

// Export all save data as a downloadable JSON file
function exportSaveData() {
  try {
    const allSaves = {};
    for (let i = 0; i <= 10; i++) {
      const key = `gameSlot_${i}`;
      const data = localStorage.getItem(key);
      if (data) allSaves[key] = data;
    }
    // Also export hall of fame and legacy
    const hof = localStorage.getItem('criminalHallOfFame');
    if (hof) allSaves['criminalHallOfFame'] = hof;
    const legacy = localStorage.getItem('criminalLegacy');
    if (legacy) allSaves['criminalLegacy'] = legacy;
    
    const blob = new Blob([JSON.stringify(allSaves, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MafiaBorn_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showBriefNotification('📦 Save data exported successfully!', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showBriefNotification('Export failed: ' + error.message, 'danger');
  }
}

// Import save data from a JSON file
function importSaveData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const allSaves = JSON.parse(event.target.result);
        
        if (typeof allSaves !== 'object' || allSaves === null) {
          showBriefNotification('Invalid save file format.', 'danger');
          return;
        }
        
        // Validate it has at least one save slot
        const hasSlot = Object.keys(allSaves).some(k => k.startsWith('gameSlot_'));
        if (!hasSlot) {
          showBriefNotification('No save slots found in file.', 'danger');
          return;
        }
        
        // Import all data
        Object.entries(allSaves).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        showBriefNotification('📦 Save data imported! Refreshing...', 'success');
        logAction('📦 Imported save backup file.');
        
        // Refresh save system display
        setTimeout(() => showSaveSystem(), 500);
      } catch (err) {
        console.error('Import failed:', err);
        showBriefNotification('Import failed: invalid JSON file.', 'danger');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function createSaveData() {
  const saveData = {
    // Core player data
    player: {
      ...player,
      // Add save timestamp
      lastSaved: Date.now()
    },
    
    // Global game state
    achievements: achievements.map(a => ({
      id: a.id,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt
    })),
    
    // Events and randomization state (safely handle undefined variables)
    currentEvents: (typeof currentEvents !== 'undefined') ? currentEvents : [],
    eventHistory: (typeof eventHistory !== 'undefined') ? eventHistory : [],
    
    // Criminal hall of fame (shared across saves)
    hallOfFame: JSON.parse(localStorage.getItem('criminalHallOfFame') || '[]'),
    
    // Legacy data (shared across saves)
    legacy: JSON.parse(localStorage.getItem('criminalLegacy') || 'null'),
    
    // Save metadata
    saveVersion: "1.0",
    saveTimestamp: Date.now()
  };
  
  return saveData;
}

function validateSaveData(saveData) {
  if (!saveData || typeof saveData !== 'object') return false;
  if (!saveData.player || typeof saveData.player !== 'object') return false;
  if (!saveData.player.name || typeof saveData.player.name !== 'string') return false;
  if (typeof saveData.player.money !== 'number') return false;
  if (typeof saveData.player.level !== 'number') return false;
  
  return true;
}

function applySaveData(saveData) {
  // Apply player data
  Object.assign(player, saveData.player);
  
  // Apply achievements
  if (saveData.achievements) {
    saveData.achievements.forEach(savedAchievement => {
      const achievement = achievements.find(a => a.id === savedAchievement.id);
      if (achievement) {
        achievement.unlocked = savedAchievement.unlocked;
        achievement.unlockedAt = savedAchievement.unlockedAt;
      }
    });
  }
  
  // Apply events state (initialize globals if they don't exist)
  if (typeof window.currentEvents === 'undefined') {
    window.currentEvents = [];
  }
  if (typeof window.eventHistory === 'undefined') {
    window.eventHistory = [];
  }
  
  if (saveData.currentEvents) {
    window.currentEvents = saveData.currentEvents;
  }
  
  if (saveData.eventHistory) {
    window.eventHistory = saveData.eventHistory;
  }
  
  // Handle jail state restoration
  if (player.inJail) {
    if (player.jailTime > 0) {
      // Player was in jail when saved, restart the jail timer and show jail screen
      setTimeout(() => {
        hideAllScreens();
        showJailScreen();
        updateJailUI();
      }, 100);
      
      updateJailTimer();
      logAction("🔒 Resuming jail sentence...");
    } else {
      // Jail time expired, release player
      player.inJail = false;
      logAction("🚪 Jail sentence completed while away.");
    }
  } else {
    stopJailTimer();
  }
  
  // Initialize missing data structures for older saves
  initializeMissingData();
}

function initializeMissingData() {
  // Initialize statistics if missing
  if (!player.statistics) {
    player.statistics = initializePlayerStatistics();
  }
  
  // Initialize jobCounts if missing (for older saves)
  if (!player.statistics.jobCounts) {
    player.statistics.jobCounts = {};
  }
  
  // Initialize empire rating if missing
  if (!player.empireRating) {
    calculateEmpireRating();
  }
  
  // Initialize legacy if missing
  if (!player.legacy) {
    initializeLegacyBonuses();
  }

  // v1.3.0 — Dirty Money system migration for older saves
  if (player.dirtyMoney === undefined || player.dirtyMoney === null) {
    player.dirtyMoney = 0;
  }
  if (player.suspicionLevel === undefined || player.suspicionLevel === null) {
    player.suspicionLevel = 0;
  }
  if (!player.launderingSetups) {
    player.launderingSetups = [];
  }
  if (!player.fbiInvestigation) {
    player.fbiInvestigation = { stage: 0, progress: 0, lastEscalation: 0 };
  }
  if (!player.unlocksNotified) {
    player.unlocksNotified = [];
  }
}

// Save slots management
function getSaveEntry(slotNumber) {
  const saveEntryStr = localStorage.getItem(`gameSlot_${slotNumber}`);
  return saveEntryStr ? JSON.parse(saveEntryStr) : null;
}

function getAllSaveSlots() {
  const slots = [];
  
  // Add auto-save slot (0)
  const autoSave = getSaveEntry(0);
  if (autoSave) {
    slots.push(autoSave);
  }
  
  // Add regular slots (1-10)
  for (let i = 1; i <= SAVE_SYSTEM.maxSlots; i++) {
    const saveEntry = getSaveEntry(i);
    slots.push(saveEntry || { slotNumber: i, empty: true });
  }
  
  return slots;
}

function deleteSaveSlot(slotNumber) {
  try {
    const key = `gameSlot_${slotNumber}`;
    
    // Check if the slot exists
    const existingData = localStorage.getItem(key);
    if (!existingData) {
      console.warn(`No save data found in slot ${slotNumber}`);
      return false;
    }
    
    // Remove the save slot
    localStorage.removeItem(key);
    
    // If this was the current slot, clear the current slot reference
    if (SAVE_SYSTEM.currentSlot === slotNumber) {
      SAVE_SYSTEM.currentSlot = -1;
      saveSaveSystemPrefs();
    }
    
    // Update the save slots list if it's currently displayed
    updateSaveSlotsList();
    
    return true;
    
  } catch (error) {
    console.error(`Failed to delete save slot ${slotNumber}:`, error);
    return false;
  }
}

function updateSaveSlotsList() {
  // This will be called to refresh the save slots UI
  if (document.getElementById('save-slots-container')) {
    showSaveSystem();
  }
}

// UI Functions
function showSaveSystem() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const slots = getAllSaveSlots();
  const currentPlaytime = calculatePlaytime();
  
  const content = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2 style="text-align: center; color: #3498db; font-size: 2.5em; margin-bottom: 20px;">
        💾 Save System
      </h2>
      
      <!-- Save System Controls -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #3498db;">
          <h3 style="color: #3498db; margin: 0 0 10px 0;">🔄 Auto-Save</h3>
          <label style="display: flex; align-items: center; color: #ecf0f1;">
            <input type="checkbox" ${SAVE_SYSTEM.autoSaveEnabled ? 'checked' : ''} onchange="toggleAutoSave(this.checked)" style="margin-right: 8px;">
            Auto-save every ${SAVE_SYSTEM.autoSaveInterval/1000}s
          </label>
          <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #bdc3c7;">
            Last: ${SAVE_SYSTEM.lastAutoSave ? formatTimestamp(SAVE_SYSTEM.lastAutoSave) : 'Never'}
          </p>
        </div>
        <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; margin: 0 0 10px 0;">📦 Backup</h3>
          <button onclick="exportSaveData()" style="background:#2ecc71; color:white; padding:8px 14px; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin:3px; width:100%;">
            Export Save
          </button>
          <button onclick="importSaveData()" style="background:#3498db; color:white; padding:8px 14px; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin:3px; width:100%;">
            Import Save
          </button>
        </div>
      </div>
      
      <!-- Save Slots -->
      <div id="save-slots-container">
        <h3 style="color: #ecf0f1; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">
          💾 Save Slots
        </h3>
        
        <div style="display: grid; gap: 15px;">
          ${slots.map(slot => {
            if (slot.empty) {
              return `
                <div style="padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; border: 2px dashed #7f8c8d; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4 style="color: #95a5a6; margin: 0;">Slot ${slot.slotNumber} - Empty</h4>
                    <p style="color: #7f8c8d; margin: 5px 0 0 0;">No save data</p>
                  </div>
                  <button onclick="saveToSlot(${slot.slotNumber})" style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Save Here
                  </button>
                </div>
              `;
            } else {
              const isAutoSave = slot.slotNumber === 0;
              const isCurrent = slot.slotNumber === SAVE_SYSTEM.currentSlot;
              const borderColor = isAutoSave ? '#f39c12' : isCurrent ? '#2ecc71' : '#3498db';
              
              return `
                <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; border: 2px solid ${borderColor}; display: grid; grid-template-columns: 1fr auto auto auto; gap: 15px; align-items: center;">
                  <div>
                    <h4 style="color: #ecf0f1; margin: 0 0 5px 0;">
                      ${isAutoSave ? '🔄 ' : ''}${slot.saveName}
                      ${isCurrent ? ' (Current)' : ''}
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 10px 0;">
                      <div><span style="color: #2ecc71;">💰</span> $${slot.money.toLocaleString()}</div>
                      <div><span style="color: #3498db;">📈</span> Level ${slot.level}</div>
                      <div><span style="color: #e74c3c;">⭐</span> ${slot.reputation}</div>
                      <div><span style="color: #f39c12;">🏆</span> ${slot.empireRating.toLocaleString()}</div>
                    </div>
                    <p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 0.9em;">
                      ${formatTimestamp(new Date(slot.saveDate).getTime())} • ${formatPlaytime(slot.playtime)}
                    </p>
                  </div>
                  
                  <button onclick="loadGameFromSlot(${slot.slotNumber})" style="background: #3498db; color: white; padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    Load
                  </button>
                  
                  ${!isAutoSave ? `
                    <button onclick="saveToSlot(${slot.slotNumber})" style="background: #2ecc71; color: white; padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                      Overwrite
                    </button>
                    
                    <button onclick="deleteGameSlot(${slot.slotNumber})" style="background: #e74c3c; color: white; padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                      Delete
                    </button>
                  ` : `
                    <div></div>
                    <div style="color: #f39c12; font-size: 0.9em; text-align: center;">Auto-Save</div>
                  `}
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

// Helper functions
// Function to map item names to their image paths in the new folder structure
function getItemImage(itemName) {
  // Mapping for weapons and armor
  const weaponsArmor = {
    "Brass Knuckles": "weapons&armor/Brass knuckles.png",
    "Switchblade": "weapons&armor/Switchblade.png",
    "Pistol": "weapons&armor/Pistol.png",
    "Revolver": "weapons&armor/Revolver.png",
    "Sawed-Off Shotgun": "weapons&armor/Sawed-Off Shotgun.png",
    "Leather Jacket": "weapons&armor/Leather Jacket.png",
    "Bulletproof Vest": "weapons&armor/Bulletproof Vest.png",
    "Tommy Gun": "weapons&armor/Tommy gun.png",
    "Bullets": "weapons&armor/Bullets.png"
  };
  
  // Mapping for vehicles
  const vehicles = {
    "Armored Car": "vehicles/Armored car.png",
    "Luxury Automobile": "vehicles/Luxury Automobile.png",
    "Private Airplane": "vehicles/Private Airplane.png",
    "Rusty Jalopy": "vehicles/Rusty Jalopy.png",
    "Old Sedan": "vehicles/Old Sedan.png",
    "Old Ford": "vehicles/Old Ford.png",
    "Family Wagon": "vehicles/Family Wagon.png",
    "Sports Coupe": "vehicles/Sports Coupe.png",
    "High-End Roadster": "vehicles/High-End Roadster.png",
    "Taxi": "vehicles/Taxi.png",
    "Hearse": "vehicles/Hearse.png",
    "Motorcycle": "vehicles/Motorcycle.png",
    "Pickup Truck": "vehicles/Pickup Truck.png",
    "Delivery Truck": "vehicles/Delivery Truck.png",
    "Freight Truck": "vehicles/Freight Truck.png",
    "Luxury Sedan": "vehicles/luxury sedan.png",
    "Luxury Town Car": "vehicles/Luxury Town Car.png",
    "Speedboat": "vehicles/Speedboat.png",
    "Limousine": "vehicles/Limousine.png",
    "Party Bus": "vehicles/Party Bus.png",
    "Police Cruiser": "vehicles/Police Cruiser.png"
  };
  
  // Mapping for items (energy drinks, drugs, etc.)
  const items = {
    "Energy Drink": "items/Energy Drink.png",
    "Strong Coffee": "items/Strong Coffee.png",
    "Steroids": "items/Steroids.png",
    "Gasoline": "items/Gasoline.png",
    "Bag of Mary Jane": "items/Bag of Mary Jane.png",
    "Crate Moonshine": "items/Crate Moonshine.png",
    "Pure Cocaine": "items/Pure Cocaine.png"
  };
  
  // Check if the item is in weapons/armor
  if (weaponsArmor[itemName]) {
    return weaponsArmor[itemName];
  }
  
  // Check if the item is a vehicle
  if (vehicles[itemName]) {
    return vehicles[itemName];
  }
  
  // Check if the item is in items folder
  if (items[itemName]) {
    return items[itemName];
  }
  
  // Default fallback - return a placeholder or the item name
  return `missing-item.png`;
}

function saveToSlot(slotNumber) {
  if (!player.name || player.name.trim() === "") {
    alert("You must create a character before saving! Click 'Start Game' to create your character first.");
    return;
  }
  
  const customName = prompt(`Enter a name for this save:`, `${player.name} - ${getCurrentDateString()}`);
  if (customName !== null) {
    const result = saveGameToSlot(slotNumber, customName);
    if (result) {
      alert("Game saved successfully!");
    }
  }
}

function toggleAutoSave(enabled) {
  SAVE_SYSTEM.autoSaveEnabled = enabled;
  saveSaveSystemPrefs();
  
  if (enabled) {
    startAutoSave();
    logAction("🔄 Auto-save enabled");
  } else {
    logAction("⏸️ Auto-save disabled");
  }
}

function saveSaveSystemPrefs() {
  localStorage.setItem('saveSystemPrefs', JSON.stringify(SAVE_SYSTEM));
}

function getCurrentDateString() {
  return new Date().toLocaleDateString();
}

function calculatePlaytime() {
  if (!player.startTime) {
    player.startTime = Date.now();
    return 0;
  }
  return Date.now() - player.startTime;
}

function formatPlaytime(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showBriefNotification(message, durationOrType = 2000) {
  // Support type strings as second arg: 'success', 'warning', 'danger', or a number for duration
  let duration = 2000;
  let borderColor = '#3498db';
  let bgColor = 'rgba(44, 62, 80, 0.95)';
  
  if (typeof durationOrType === 'string') {
    duration = 3000;
    switch (durationOrType) {
      case 'success': borderColor = '#2ecc71'; bgColor = 'rgba(39, 174, 96, 0.15)'; break;
      case 'warning': borderColor = '#f39c12'; bgColor = 'rgba(243, 156, 18, 0.15)'; break;
      case 'danger':  borderColor = '#e74c3c'; bgColor = 'rgba(231, 76, 60, 0.15)'; break;
    }
    bgColor = 'rgba(44, 62, 80, 0.95)'; // keep dark bg for readability
  } else if (typeof durationOrType === 'number') {
    duration = durationOrType;
  }
  
  // Stack notifications so they don't overlap
  const existing = document.querySelectorAll('.kd-notification');
  const topOffset = 20 + existing.length * 65;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'kd-notification';
  notification.style.cssText = `
    position: fixed;
    top: ${topOffset}px;
    right: 20px;
    background: rgba(44, 62, 80, 0.95);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    border: 2px solid ${borderColor};
    z-index: 10000;
    font-weight: bold;
    max-width: 400px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  
  // Add animation keyframes
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// ==================== END SAVE SYSTEM ====================

// ==================== COMPETITION SYSTEM ====================

// Competition system configuration
const COMPETITION_SYSTEM = {
  leaderboardCategories: [
    { id: 'empire', name: 'Empire Rating', icon: '⭐', description: 'Overall criminal power and influence' },
    { id: 'wealth', name: 'Criminal Wealth', icon: '💰', description: 'Total money accumulated' },
    { id: 'reputation', name: 'Street Reputation', icon: '👑', description: 'Respect in the criminal underworld' },
    { id: 'territory', name: 'Territory Control', icon: '🏛️', description: 'Areas under criminal influence' },
    { id: 'gang', name: 'Gang Power', icon: '👥', description: 'Size and loyalty of criminal organization' },
    { id: 'business', name: 'Business Empire', icon: '🏭', description: 'Number of criminal enterprises' },
    { id: 'longevity', name: 'Career Longevity', icon: '⏰', description: 'Time survived in the criminal world' }
  ],
  maxLeaderboardEntries: 50,
  submissionCooldown: 60000, // 1 minute
  lastSubmission: 0
};

// Weekly challenges configuration
const WEEKLY_CHALLENGES = {
  currentWeek: null,
  completedChallenges: [],
  weeklyRewards: {
    bronze: { money: 50000, experience: 500, reputation: 25 },
    silver: { money: 100000, experience: 1000, reputation: 50 },
    gold: { money: 200000, experience: 2000, reputation: 100 },
    platinum: { money: 500000, experience: 5000, reputation: 250 }
  },
  challengeTypes: [
    {
      id: 'money_maker',
      name: 'Money Maker',
      description: 'Earn {target} in a single week',
      icon: '💰',
      targets: { easy: 100000, medium: 500000, hard: 1000000, extreme: 5000000 },
      checkProgress: (target) => player.statistics.totalMoneyEarned >= target
    },
    {
      id: 'job_master',
      name: 'Job Master',
      description: 'Complete {target} jobs successfully',
      icon: '🎯',
      targets: { easy: 10, medium: 25, hard: 50, extreme: 100 },
      checkProgress: (target) => player.statistics.jobsCompleted >= target
    },
    {
      id: 'empire_builder',
      name: 'Empire Builder',
      description: 'Reach empire rating of {target}',
      icon: '⭐',
      targets: { easy: 2000, medium: 4000, hard: 6000, extreme: 8000 },
      checkProgress: (target) => calculateEmpireRating().totalScore >= target
    },
    {
      id: 'gang_leader',
      name: 'Gang Leader',
      description: 'Recruit {target} gang members',
      icon: '👥',
      targets: { easy: 5, medium: 15, hard: 30, extreme: 50 },
      checkProgress: (target) => (player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members) >= target
    },
    {
      id: 'territory_king',
      name: 'Territory King',
      description: 'Control {target} territories',
      icon: '🏛️',
      targets: { easy: 3, medium: 8, hard: 15, extreme: 25 },
      checkProgress: (target) => player.territory >= target
    },
    {
      id: 'business_mogul',
      name: 'Business Mogul',
      description: 'Own {target} businesses',
      icon: '🏭',
      targets: { easy: 2, medium: 5, hard: 10, extreme: 20 },
      checkProgress: (target) => (player.businesses ? player.businesses.length : 0) >= target
    },
    {
      id: 'escape_artist',
      name: 'Escape Artist',
      description: 'Escape from jail {target} times',
      icon: '🔓',
      targets: { easy: 2, medium: 5, hard: 10, extreme: 20 },
      checkProgress: (target) => player.statistics.timesEscaped >= target
    },
    {
      id: 'car_thief',
      name: 'Car Thief',
      description: 'Steal {target} vehicles',
      icon: '🚗',
      targets: { easy: 10, medium: 25, hard: 50, extreme: 100 },
      checkProgress: (target) => player.statistics.carsStolen >= target
    }
  ]
};

// Initialize competition system
function initializeCompetitionSystem() {
  // Load competition data
  loadCompetitionData();
  
  // Initialize weekly challenges
  initializeWeeklyChallenges();
  
  // Start challenge checker
  startChallengeChecker();
}

function loadCompetitionData() {
  // Load leaderboards
  const leaderboards = localStorage.getItem('criminalLeaderboards');
  if (leaderboards) {
    window.criminalLeaderboards = JSON.parse(leaderboards);
  } else {
    window.criminalLeaderboards = {};
    COMPETITION_SYSTEM.leaderboardCategories.forEach(category => {
      window.criminalLeaderboards[category.id] = [];
    });
  }
  
  // Load completed challenges
  const completedChallenges = localStorage.getItem('completedWeeklyChallenges');
  if (completedChallenges) {
    WEEKLY_CHALLENGES.completedChallenges = JSON.parse(completedChallenges);
  }
}

function saveCompetitionData() {
  localStorage.setItem('criminalLeaderboards', JSON.stringify(window.criminalLeaderboards));
  localStorage.setItem('completedWeeklyChallenges', JSON.stringify(WEEKLY_CHALLENGES.completedChallenges));
}

// Leaderboard system
function submitToLeaderboards() {
  const now = Date.now();
  if (now - COMPETITION_SYSTEM.lastSubmission < COMPETITION_SYSTEM.submissionCooldown) {
    showBriefNotification("⏰ Please wait before submitting again", 3000);
    return;
  }
  
  const empireRating = calculateEmpireRating();
  const playTime = calculatePlaytime();
  
  const playerEntry = {
    name: player.name || "Anonymous Criminal",
    level: player.level,
    submissionDate: now,
    values: {
      empire: empireRating.totalScore,
      wealth: player.money,
      reputation: Math.floor(player.reputation),
      territory: player.territory,
      gang: player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members,
      business: player.businesses ? player.businesses.length : 0,
      longevity: playTime
    }
  };
  
  // Submit to each leaderboard category
  COMPETITION_SYSTEM.leaderboardCategories.forEach(category => {
    const leaderboard = window.criminalLeaderboards[category.id];
    
    // Remove any existing entry from this player
    const existingIndex = leaderboard.findIndex(entry => entry.name === playerEntry.name);
    if (existingIndex !== -1) {
      leaderboard.splice(existingIndex, 1);
    }
    
    // Add new entry
    leaderboard.push({
      ...playerEntry,
      score: playerEntry.values[category.id]
    });
    
    // Sort by score (descending) and keep only top entries
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > COMPETITION_SYSTEM.maxLeaderboardEntries) {
      leaderboard.splice(COMPETITION_SYSTEM.maxLeaderboardEntries);
    }
  });
  
  COMPETITION_SYSTEM.lastSubmission = now;
  saveCompetitionData();
  
  const message = isConnected 
    ? "🏆 Successfully submitted to GLOBAL leaderboards!" 
    : "💾 Rankings saved locally";
  showBriefNotification(message, 3000);
}

function getPlayerRanking(categoryId) {
  const leaderboard = window.criminalLeaderboards[categoryId];
  const playerName = player.name || "Anonymous Criminal";
  
  const playerIndex = leaderboard.findIndex(entry => entry.name === playerName);
  return playerIndex !== -1 ? playerIndex + 1 : null;
}

// Weekly challenges system
function rebuildChallengeProgressFunctions(challenges) {
  // After JSON.parse, checkProgress functions are lost. Rebuild from templateId.
  if (!challenges) return;
  challenges.forEach(challenge => {
    if (typeof challenge.checkProgress !== 'function' && challenge.templateId) {
      const template = WEEKLY_CHALLENGES.challengeTypes.find(t => t.id === challenge.templateId);
      if (template) {
        challenge.checkProgress = template.checkProgress;
      }
    }
  });
}

function initializeWeeklyChallenges() {
  const currentWeekKey = getCurrentWeekKey();
  const storedWeek = localStorage.getItem('currentWeeklyChallenge');
  
  if (!storedWeek || JSON.parse(storedWeek).weekKey !== currentWeekKey) {
    generateWeeklyChallenges();
  } else {
    WEEKLY_CHALLENGES.currentWeek = JSON.parse(storedWeek);
    // Rebuild checkProgress functions lost during JSON serialization
    rebuildChallengeProgressFunctions(WEEKLY_CHALLENGES.currentWeek.challenges);
  }
}

function getCurrentWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${week}`;
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function generateWeeklyChallenges() {
  const weekKey = getCurrentWeekKey();
  const numChallenges = 3;
  const selectedChallenges = [];
  const availableChallenges = [...WEEKLY_CHALLENGES.challengeTypes];
  
  // Randomly select challenges for the week
  for (let i = 0; i < numChallenges && availableChallenges.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableChallenges.length);
    const challengeTemplate = availableChallenges.splice(randomIndex, 1)[0];
    
    // Randomly select difficulty
    const difficulties = ['easy', 'medium', 'hard', 'extreme'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const target = challengeTemplate.targets[difficulty];
    
    const challenge = {
      id: `${challengeTemplate.id}_${weekKey}`,
      templateId: challengeTemplate.id,
      name: challengeTemplate.name,
      description: challengeTemplate.description.replace('{target}', target.toLocaleString()),
      icon: challengeTemplate.icon,
      difficulty: difficulty,
      target: target,
      reward: WEEKLY_CHALLENGES.weeklyRewards[difficulty === 'easy' ? 'bronze' : 
                          difficulty === 'medium' ? 'silver' : 
                          difficulty === 'hard' ? 'gold' : 'platinum'],
      checkProgress: challengeTemplate.checkProgress,
      completed: false,
      completedAt: null
    };
    
    selectedChallenges.push(challenge);
  }
  
  WEEKLY_CHALLENGES.currentWeek = {
    weekKey: weekKey,
    startDate: new Date().toISOString(),
    challenges: selectedChallenges
  };
  
  localStorage.setItem('currentWeeklyChallenge', JSON.stringify(WEEKLY_CHALLENGES.currentWeek));
  showBriefNotification("🎯 New weekly challenges available!", 4000);
}

function checkWeeklyChallenges() {
  if (!WEEKLY_CHALLENGES.currentWeek) return;
  
  const challenges = WEEKLY_CHALLENGES.currentWeek.challenges;
  let newCompletions = 0;
  
  challenges.forEach(challenge => {
    // Safely check if checkProgress function exists and call it
    const hasProgress = challenge.checkProgress && typeof challenge.checkProgress === 'function' 
      ? challenge.checkProgress(challenge.target) 
      : false;
      
    if (!challenge.completed && hasProgress) {
      challenge.completed = true;
      challenge.completedAt = new Date().toISOString();
      
      // Award rewards
      if (challenge.reward.money) {
        player.money += challenge.reward.money;
      }
      if (challenge.reward.experience) {
        player.experience += challenge.reward.experience;
      }
      if (challenge.reward.reputation) {
        player.reputation += challenge.reward.reputation;
      }
      
      // Track completion
      WEEKLY_CHALLENGES.completedChallenges.push({
        challengeId: challenge.id,
        name: challenge.name,
        difficulty: challenge.difficulty,
        completedAt: challenge.completedAt,
        reward: challenge.reward
      });
      
      newCompletions++;
      showBriefNotification(`🎯 Challenge Complete: ${challenge.name}!`, 4000);
      logAction(`🏆 Completed weekly challenge: ${challenge.name}. Earned $${challenge.reward.money.toLocaleString()}, ${challenge.reward.experience} XP, and ${challenge.reward.reputation} reputation!`);
    }
  });
  
  if (newCompletions > 0) {
    localStorage.setItem('currentWeeklyChallenge', JSON.stringify(WEEKLY_CHALLENGES.currentWeek));
    saveCompetitionData();
    updateUI();
  }
}

function startChallengeChecker() {
  // Check challenges every 30 seconds
  setInterval(checkWeeklyChallenges, 30000);
}

// Character showcase system
function createCharacterShowcase() {
  const empireRating = calculateEmpireRating();
  const grade = getEmpireRatingGrade(empireRating.totalScore);
  const playTime = calculatePlaytime();
  
  const showcase = {
    characterName: player.name || "Anonymous Criminal",
    level: player.level,
    empireRating: empireRating.totalScore,
    empireGrade: grade.grade,
    empireDescription: grade.description,
    
    // Core stats
    money: player.money,
    reputation: Math.floor(player.reputation),
    power: player.power,
    territory: player.territory,
    
    // Organizations
    gangSize: player.gang.gangMembers ? player.gang.gangMembers.length : player.gang.members,
    businessCount: player.businesses ? player.businesses.length : 0,
    
    // Achievements
    totalJobs: player.statistics ? player.statistics.jobsCompleted : 0,
    totalEarnings: player.statistics ? player.statistics.totalMoneyEarned : 0,
    escapeRate: player.statistics && player.statistics.timesArrested > 0 ? 
      Math.round((player.statistics.timesEscaped / player.statistics.timesArrested) * 100) : 0,
    
    // Character story elements
    playTime: playTime,
    generation: player.legacy ? player.legacy.generationNumber : 1,
    legacyFamily: player.legacy ? player.legacy.previousCharacters : [],
    
    // Challenge completions
    challengesCompleted: WEEKLY_CHALLENGES.completedChallenges.length,
    
    // Creation info
    createdAt: new Date().toISOString(),
    showcaseId: `showcase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  return showcase;
}

function exportCharacterShowcase() {
  try {
    const showcase = createCharacterShowcase();
    
    const showcaseData = {
      type: 'character_showcase',
      version: '1.0',
      showcase: showcase,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(showcaseData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${showcase.characterName.replace(/[^a-zA-Z0-9]/g, '_')}_showcase_${getCurrentDateString()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showBriefNotification("📋 Character showcase exported successfully!", 3000);
    logAction("📋 Character showcase exported for sharing!");
    
  } catch (error) {
    console.error('Export showcase error:', error);
    showBriefNotification("❌ Failed to export character showcase", 3000);
  }
}

function importCharacterShowcase() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importData = JSON.parse(e.target.result);
        
        if (importData.type !== 'character_showcase' || !importData.showcase) {
          throw new Error('Invalid showcase file format');
        }
        
        displayImportedShowcase(importData.showcase);
        
      } catch (error) {
        console.error('Import showcase error:', error);
        alert('Failed to import character showcase. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

function displayImportedShowcase(showcase) {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const gradeColor = getEmpireRatingGrade(showcase.empireRating).color;
  
  const content = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; color: #3498db; font-size: 2.5em; margin-bottom: 20px;">
        📋 Character Showcase
      </h2>
      
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, rgba(44, 62, 80, 0.8) 0%, rgba(52, 73, 94, 0.8) 100%); border-radius: 15px; border: 3px solid ${gradeColor};">
        <h1 style="color: ${gradeColor}; font-size: 3em; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          ${showcase.characterName}
        </h1>
        <h3 style="color: #ecf0f1; margin: 10px 0;">Level ${showcase.level} ${showcase.empireDescription}</h3>
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 15px;">
          <span style="color: ${gradeColor}; font-size: 2em; font-weight: bold;">Grade ${showcase.empireGrade}</span>
          <span style="color: #bdc3c7;">Empire Rating: ${showcase.empireRating.toLocaleString()}</span>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: rgba(46, 204, 113, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; margin: 0 0 15px 0;">💰 Financial Empire</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Current Wealth:</span>
              <span style="color: #2ecc71; font-weight: bold;">$${showcase.money.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Total Earned:</span>
              <span style="color: #2ecc71;">$${showcase.totalEarnings.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Businesses:</span>
              <span style="color: #2ecc71;">${showcase.businessCount}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #e74c3c;">
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">👥 Criminal Organization</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Gang Members:</span>
              <span style="color: #e74c3c; font-weight: bold;">${showcase.gangSize}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Territory Control:</span>
              <span style="color: #e74c3c;">${showcase.territory}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Reputation:</span>
              <span style="color: #e74c3c;">${showcase.reputation}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(52, 152, 219, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #3498db;">
          <h3 style="color: #3498db; margin: 0 0 15px 0;">🎯 Criminal Record</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Jobs Completed:</span>
              <span style="color: #3498db; font-weight: bold;">${showcase.totalJobs}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Escape Rate:</span>
              <span style="color: #3498db;">${showcase.escapeRate}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Power Level:</span>
              <span style="color: #3498db;">${showcase.power}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(155, 89, 182, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #9b59b6;">
          <h3 style="color: #9b59b6; margin: 0 0 15px 0;">⏰ Career Timeline</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Play Time:</span>
              <span style="color: #9b59b6; font-weight: bold;">${formatPlaytime(showcase.playTime)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Generation:</span>
              <span style="color: #9b59b6;">${showcase.generation}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Challenges:</span>
              <span style="color: #9b59b6;">${showcase.challengesCompleted}</span>
            </div>
          </div>
        </div>
      </div>
      
      ${showcase.legacyFamily && showcase.legacyFamily.length > 0 ? `
        <div style="background: rgba(243, 156, 18, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #f39c12; margin-bottom: 30px;">
          <h3 style="color: #f39c12; margin: 0 0 15px 0;">👨‍👩‍👧‍👦 Criminal Legacy</h3>
          <p style="color: #ecf0f1; margin: 0;">
            Part of the ${showcase.legacyFamily[0]} criminal dynasty. 
            Previous generations: ${showcase.legacyFamily.join(', ')}
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

// Competition UI Functions
function showRivalsScreen() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const rivals = player.rivalKingpins || (window.ExpandedSystems ? window.ExpandedSystems.RIVALS : []);
  const playerRankings = {};
  COMPETITION_SYSTEM.leaderboardCategories.forEach(category => {
    playerRankings[category.id] = getPlayerRanking(category.id);
  });
  
  const content = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2 style="text-align: center; color: #e74c3c; font-size: 2.5em; margin-bottom: 20px;">
        🏆 Rivals & Competition
      </h2>
      
      <!-- Local Rankings -->
      <div style="background: rgba(46, 204, 113, 0.2); 
                  padding: 15px; border-radius: 10px; margin-bottom: 20px; 
                  border: 2px solid #2ecc71; text-align: center;">
        <h3 style="color: #2ecc71; margin: 0 0 5px 0;">
          🏆 Local Rankings
        </h3>
        <p style="margin: 0; color: #ecf0f1; font-size: 0.9em;">
          Compete against AI rivals and climb the leaderboards
        </p>
      </div>
      
      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #34495e; padding-bottom: 10px;">
        <button onclick="showRivalsTab()" id="rivals-tab-btn" style="flex: 1; background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 12px; border: none; border-radius: 8px 8px 0 0; cursor: pointer; font-weight: bold;">
          🎯 AI Rivals
        </button>
        <button onclick="showCompetitionTab()" id="competition-tab-btn" style="flex: 1; background: rgba(52, 73, 94, 0.6); color: #95a5a6; padding: 12px; border: none; border-radius: 8px 8px 0 0; cursor: pointer; font-weight: bold;">
          🏆 Leaderboards
        </button>
      </div>
      
      <!-- Content Area -->
      <div id="rivals-content-area">
        <!-- Tab content will be inserted here -->
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠 Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
  showRivalsTab(); // Default to AI rivals tab
}

function showRivalsTab() {
  // Update tab buttons
  document.getElementById('rivals-tab-btn').style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
  document.getElementById('rivals-tab-btn').style.color = 'white';
  document.getElementById('competition-tab-btn').style.background = 'rgba(52, 73, 94, 0.6)';
  document.getElementById('competition-tab-btn').style.color = '#95a5a6';
  
  const rivals = player.rivalKingpins || (window.ExpandedSystems ? window.ExpandedSystems.RIVALS : []);
  
  const content = `
    <div>
      <h3 style="color: #ecf0f1; margin-bottom: 15px; text-align: center;">Track your AI competitors and plan your moves</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${rivals.map(rival => {
          const playerRespect = player.relationships?.[rival.id] || 0;
          const respectColor = playerRespect > 20 ? '#2ecc71' : playerRespect < -20 ? '#e74c3c' : '#7f8c8d';
          
          return `
            <div style="background: rgba(44, 62, 80, 0.6); padding: 20px; border-radius: 15px; border: 2px solid #34495e;">
              <h3 style="color: #e74c3c; margin: 0 0 5px 0;">${rival.name}</h3>
              <div style="color: #95a5a6; font-size: 0.9em; margin-bottom: 15px;">${rival.faction.toUpperCase()}</div>
              
              <div style="display: grid; gap: 8px; margin-bottom: 15px;">
                <div style="color: #ecf0f1;">💪 Power: ${rival.powerRating}</div>
                <div style="color: #ecf0f1;">👥 Gang Size: ${rival.gangSize}</div>
                <div style="color: #ecf0f1;">💰 Wealth: $${rival.wealth.toLocaleString()}</div>
                <div style="color: #ecf0f1;">🗺️ Territories: ${rival.territories.length}</div>
                <div style="color: ${respectColor};">⭐ Respect: ${playerRespect > 0 ? '+' : ''}${playerRespect}</div>
              </div>
              
              <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <div style="color: #95a5a6; font-size: 0.9em; margin-bottom: 5px;"><strong>Personality:</strong> ${rival.personality}</div>
                <div style="color: #f39c12;">⚔️ Aggressiveness: ${Math.floor(rival.aggressiveness * 100)}%</div>
              </div>
              
              <div style="background: rgba(155, 89, 182, 0.3); padding: 10px; border-radius: 8px; border: 1px solid #9b59b6;">
                <div style="color: #ecf0f1; font-size: 0.9em;"><strong>🌟 Special:</strong> ${formatSpecialAbility(rival.specialAbility)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  document.getElementById('rivals-content-area').innerHTML = content;
}

function showCompetitionTab() {
  // Update tab buttons
  document.getElementById('rivals-tab-btn').style.background = 'rgba(52, 73, 94, 0.6)';
  document.getElementById('rivals-tab-btn').style.color = '#95a5a6';
  document.getElementById('competition-tab-btn').style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
  document.getElementById('competition-tab-btn').style.color = 'white';
  
  const playerRankings = {};
  COMPETITION_SYSTEM.leaderboardCategories.forEach(category => {
    playerRankings[category.id] = getPlayerRanking(category.id);
  });
  
  const currentChallenges = WEEKLY_CHALLENGES.currentWeek ? WEEKLY_CHALLENGES.currentWeek.challenges : [];
  const canSubmit = Date.now() - COMPETITION_SYSTEM.lastSubmission >= COMPETITION_SYSTEM.submissionCooldown;
  
  const content = `
    <div>
      <!-- Competition Overview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #3498db;">
          <h3 style="color: #3498db; margin: 0 0 10px 0;">🏆 Leaderboards</h3>
          <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 0.9em;">Compare your criminal empire with others worldwide</p>
          <button onclick="showLeaderboards()" style="background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
            View Rankings
          </button>
        </div>
        
        <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #f39c12;">
          <h3 style="color: #f39c12; margin: 0 0 10px 0;">🎯 Weekly Challenges</h3>
          <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 0.9em;">Complete special objectives for unique rewards</p>
          <button onclick="showWeeklyChallenges()" style="background: #f39c12; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
            View Challenges
          </button>
        </div>
        
        <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #9b59b6;">
          <h3 style="color: #9b59b6; margin: 0 0 10px 0;">📋 Character Showcase</h3>
          <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 0.9em;">Share your criminal's story and achievements</p>
          <button onclick="showCharacterShowcase()" style="background: #9b59b6; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
            My Showcase
          </button>
        </div>
        
        <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; margin: 0 0 10px 0;">📤 Submit Rankings</h3>
          <p style="margin: 0 0 10px 0; color: #ecf0f1; font-size: 0.9em;">Update your position on the leaderboards</p>
          <button onclick="submitToLeaderboards()" ${canSubmit ? '' : 'disabled'} 
              style="background: ${canSubmit ? '#2ecc71' : '#7f8c8d'}; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: ${canSubmit ? 'pointer' : 'not-allowed'}; width: 100%;">
            ${canSubmit ? 'Submit Now' : 'Cooldown...'}
          </button>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div style="background: rgba(44, 62, 80, 0.6); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
        <h3 style="color: #ecf0f1; margin: 0 0 15px 0;">📊 Your Competition Stats</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${COMPETITION_SYSTEM.leaderboardCategories.map(category => `
            <div style="text-align: center; padding: 10px;">
              <div style="font-size: 1.5em; margin-bottom: 5px;">${category.icon}</div>
              <div style="color: #ecf0f1; font-size: 0.9em;">${category.name}</div>
              <div style="color: ${playerRankings[category.id] ? '#2ecc71' : '#7f8c8d'}; font-weight: bold;">
                ${playerRankings[category.id] ? `#${playerRankings[category.id]}` : 'Unranked'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Current Weekly Challenges Preview -->
      ${currentChallenges.length > 0 ? `
        <div style="background: rgba(243, 156, 18, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #f39c12; margin-bottom: 30px;">
          <h3 style="color: #f39c12; margin: 0 0 15px 0;">🎯 This Week's Challenges</h3>
          <div style="display: grid; gap: 10px;">
            ${currentChallenges.map(challenge => `
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px; ${challenge.completed ? 'border: 2px solid #2ecc71;' : ''}">
                <span style="font-size: 1.5em; margin-right: 10px;">${challenge.icon}</span>
                <div style="flex: 1;">
                  <div style="color: #ecf0f1; font-weight: bold;">${challenge.name}</div>
                  <div style="color: #bdc3c7; font-size: 0.9em;">${challenge.description}</div>
                </div>
                <div style="color: ${challenge.completed ? '#2ecc71' : '#f39c12'}; font-weight: bold;">
                  ${challenge.completed ? '✅ Complete' : challenge.difficulty.toUpperCase()}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('rivals-content-area').innerHTML = content;
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

// Legacy function for backwards compatibility
function showCompetition() {
  showRivalsScreen();
  // Automatically switch to competition tab after a brief delay
  setTimeout(() => {
    if (document.getElementById('competition-tab-btn')) {
      showCompetitionTab();
    }
  }, 100);
}

function showLeaderboards() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const content = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h2 style="text-align: center; color: #3498db; font-size: 2.5em; margin-bottom: 20px;">
        🏆 Criminal Leaderboards
      </h2>
      
      <div style="margin-bottom: 20px;">
        <select id="leaderboard-category" onchange="updateLeaderboardDisplay()" style="background: rgba(44, 62, 80, 0.8); color: #ecf0f1; border: 2px solid #3498db; padding: 10px 15px; border-radius: 8px; font-size: 1em; margin-right: 10px;">
          ${COMPETITION_SYSTEM.leaderboardCategories.map(category => `
            <option value="${category.id}">${category.icon} ${category.name}</option>
          `).join('')}
        </select>
        <button onclick="submitToLeaderboards()" style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer;">
          📤 Update My Rankings
        </button>
      </div>
      
      <div id="leaderboard-display">
        <!-- Leaderboard content will be inserted here -->
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="showCompetition()" style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          🏆 Back to Competition
        </button>
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
  updateLeaderboardDisplay();
}

function updateLeaderboardDisplay() {
  const categorySelect = document.getElementById('leaderboard-category');
  const categoryId = categorySelect.value;
  const category = COMPETITION_SYSTEM.leaderboardCategories.find(c => c.id === categoryId);
  const leaderboard = window.criminalLeaderboards[categoryId];
  const playerName = player.name || "Anonymous Criminal";
  
  const content = `
    <div style="background: rgba(44, 62, 80, 0.6); padding: 20px; border-radius: 15px;">
      <h3 style="color: #3498db; margin: 0 0 10px 0;">${category.icon} ${category.name}</h3>
      <p style="color: #bdc3c7; margin: 0 0 20px 0; font-style: italic;">${category.description}</p>
      
      ${leaderboard.length === 0 ? `
        <div style="text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 10px;">
          <h4 style="color: #95a5a6;">No rankings yet!</h4>
          <p style="color: #7f8c8d;">Be the first to submit your criminal empire to this leaderboard.</p>
        </div>
      ` : `
        <div style="display: grid; gap: 8px;">
          ${leaderboard.map((entry, index) => {
            const isPlayer = entry.name === playerName;
            const rankColor = index === 0 ? '#f1c40f' : index === 1 ? '#95a5a6' : index === 2 ? '#cd7f32' : '#ecf0f1';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            
            return `
              <div style="display: flex; align-items: center; padding: 12px; background: ${isPlayer ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.3)'}; border-radius: 8px; ${isPlayer ? 'border: 2px solid #2ecc71;' : ''}">
                <div style="color: ${rankColor}; font-weight: bold; font-size: 1.2em; margin-right: 15px; min-width: 40px;">
                  ${rankIcon}
                </div>
                <div style="flex: 1;">
                  <div style="color: ${isPlayer ? '#2ecc71' : '#ecf0f1'}; font-weight: bold; font-size: 1.1em;">
                    ${entry.name} ${isPlayer ? '(You)' : ''}
                  </div>
                  <div style="color: #bdc3c7; font-size: 0.9em;">
                    Level ${entry.level} • Submitted ${formatTimestamp(entry.submissionDate)}
                  </div>
                </div>
                <div style="color: ${rankColor}; font-weight: bold; font-size: 1.3em;">
                  ${entry.score.toLocaleString()}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
  
  document.getElementById('leaderboard-display').innerHTML = content;
}

function showWeeklyChallenges() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const currentChallenges = WEEKLY_CHALLENGES.currentWeek ? WEEKLY_CHALLENGES.currentWeek.challenges : [];
  const completedThisWeek = currentChallenges.filter(c => c.completed).length;
  const recentCompletions = WEEKLY_CHALLENGES.completedChallenges.slice(-10);
  
  const content = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; color: #f39c12; font-size: 2.5em; margin-bottom: 20px;">
        🎯 Weekly Challenges
      </h2>
      
      <!-- Challenge Overview -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #f39c12; text-align: center;">
          <h3 style="color: #f39c12; margin: 0 0 10px 0;">📅 Current Week</h3>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">
            ${WEEKLY_CHALLENGES.currentWeek ? WEEKLY_CHALLENGES.currentWeek.weekKey : 'No challenges'}
          </div>
        </div>
        
        <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #2ecc71; text-align: center;">
          <h3 style="color: #2ecc71; margin: 0 0 10px 0;">✅ Completed</h3>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">
            ${completedThisWeek} / ${currentChallenges.length}
          </div>
        </div>
        
        <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #9b59b6; text-align: center;">
          <h3 style="color: #9b59b6; margin: 0 0 10px 0;">🏆 Total Completed</h3>
          <div style="color: #ecf0f1; font-size: 1.2em; font-weight: bold;">
            ${WEEKLY_CHALLENGES.completedChallenges.length}
          </div>
        </div>
      </div>
      
      <!-- Current Week's Challenges -->
      ${currentChallenges.length > 0 ? `
        <div style="background: rgba(44, 62, 80, 0.6); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
          <h3 style="color: #f39c12; margin: 0 0 20px 0;">🎯 This Week's Challenges</h3>
          <div style="display: grid; gap: 15px;">
            ${currentChallenges.map(challenge => {
              const progress = challenge.checkProgress ? challenge.checkProgress(challenge.target) : false;
              const difficultyColors = {
                easy: '#2ecc71',
                medium: '#f39c12', 
                hard: '#e74c3c',
                extreme: '#9b59b6'
              };
              
              return `
                <div style="padding: 20px; background: ${challenge.completed ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.3)'}; border-radius: 12px; border: 2px solid ${challenge.completed ? '#2ecc71' : difficultyColors[challenge.difficulty]};">
                  <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 2em; margin-right: 15px;">${challenge.icon}</span>
                    <div style="flex: 1;">
                      <h4 style="color: #ecf0f1; margin: 0; font-size: 1.3em;">${challenge.name}</h4>
                      <p style="color: #bdc3c7; margin: 5px 0 0 0;">${challenge.description}</p>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${difficultyColors[challenge.difficulty]}; font-weight: bold; font-size: 1.1em; text-transform: uppercase;">
                        ${challenge.difficulty}
                      </div>
                      <div style="color: ${challenge.completed ? '#2ecc71' : '#bdc3c7'}; font-size: 0.9em;">
                        ${challenge.completed ? '✅ Complete' : (progress ? '⚡ Ready!' : '⏳ In Progress')}
                      </div>
                    </div>
                  </div>
                  
                  <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
                    <h5 style="color: #f39c12; margin: 0 0 10px 0;">🎁 Rewards</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                      <div style="text-align: center;">
                        <div style="color: #2ecc71; font-weight: bold;">💰 Money</div>
                        <div style="color: #ecf0f1;">$${challenge.reward.money.toLocaleString()}</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="color: #3498db; font-weight: bold;">⭐ Experience</div>
                        <div style="color: #ecf0f1;">${challenge.reward.experience.toLocaleString()} XP</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="color: #e74c3c; font-weight: bold;">👑 Reputation</div>
                        <div style="color: #ecf0f1;">+${challenge.reward.reputation}</div>
                      </div>
                    </div>
                  </div>
                  
                  ${challenge.completed ? `
                    <div style="text-align: center; margin-top: 15px; color: #2ecc71; font-weight: bold;">
                      ✅ Completed on ${new Date(challenge.completedAt).toLocaleDateString()}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div style="text-align: center; padding: 50px; background: rgba(0,0,0,0.3); border-radius: 15px; margin-bottom: 30px;">
          <h3 style="color: #95a5a6;">No challenges available</h3>
          <p style="color: #7f8c8d;">Check back soon for new weekly challenges!</p>
        </div>
      `}
      
      <!-- Recent Completions -->
      ${recentCompletions.length > 0 ? `
        <div style="background: rgba(155, 89, 182, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #9b59b6;">
          <h3 style="color: #9b59b6; margin: 0 0 15px 0;">🏆 Recent Completions</h3>
          <div style="display: grid; gap: 8px;">
            ${recentCompletions.map(completion => `
              <div style="display: flex; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div style="flex: 1;">
                  <div style="color: #ecf0f1; font-weight: bold;">${completion.name}</div>
                  <div style="color: #bdc3c7; font-size: 0.9em;">
                    ${completion.difficulty.toUpperCase()} • Completed ${new Date(completion.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style="color: #9b59b6; font-weight: bold;">
                  $${completion.reward.money.toLocaleString()}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="showRivalsScreen()" style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          🏆 Back to Rivals
        </button>
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

function showCharacterShowcase() {
  hideAllScreens();
  document.getElementById('statistics-screen').style.display = 'block';
  
  const showcase = createCharacterShowcase();
  const gradeColor = getEmpireRatingGrade(showcase.empireRating).color;
  
  const content = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2 style="text-align: center; color: #9b59b6; font-size: 2.5em; margin-bottom: 20px;">
        📋 Character Showcase
      </h2>
      
      <!-- Export/Import Controls -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
        <div style="background: rgba(46, 204, 113, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; margin: 0 0 10px 0;">📤 Export</h3>
          <button onclick="exportCharacterShowcase()" style="background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
            Export My Story
          </button>
        </div>
        
        <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; border: 2px solid #3498db;">
          <h3 style="color: #3498db; margin: 0 0 10px 0;">📥 Import</h3>
          <button onclick="importCharacterShowcase()" style="background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
            View Others' Stories
          </button>
        </div>
      </div>
      
      <!-- Character Showcase Display -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, rgba(44, 62, 80, 0.8) 0%, rgba(52, 73, 94, 0.8) 100%); border-radius: 15px; border: 3px solid ${gradeColor};">
        <h1 style="color: ${gradeColor}; font-size: 3em; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
          ${showcase.characterName}
        </h1>
        <h3 style="color: #ecf0f1; margin: 10px 0;">Level ${showcase.level} ${showcase.empireDescription}</h3>
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 15px;">
          <span style="color: ${gradeColor}; font-size: 2em; font-weight: bold;">Grade ${showcase.empireGrade}</span>
          <span style="color: #bdc3c7;">Empire Rating: ${showcase.empireRating.toLocaleString()}</span>
        </div>
      </div>
      
      <!-- Stats Grid (same as displayImportedShowcase) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: rgba(46, 204, 113, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #2ecc71;">
          <h3 style="color: #2ecc71; margin: 0 0 15px 0;">💰 Financial Empire</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Current Wealth:</span>
              <span style="color: #2ecc71; font-weight: bold;">$${showcase.money.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Total Earned:</span>
              <span style="color: #2ecc71;">$${showcase.totalEarnings.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Businesses:</span>
              <span style="color: #2ecc71;">${showcase.businessCount}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #e74c3c;">
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">👥 Criminal Organization</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Gang Members:</span>
              <span style="color: #e74c3c; font-weight: bold;">${showcase.gangSize}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Territory Control:</span>
              <span style="color: #e74c3c;">${showcase.territory}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Reputation:</span>
              <span style="color: #e74c3c;">${showcase.reputation}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(52, 152, 219, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #3498db;">
          <h3 style="color: #3498db; margin: 0 0 15px 0;">🎯 Criminal Record</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Jobs Completed:</span>
              <span style="color: #3498db; font-weight: bold;">${showcase.totalJobs}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Escape Rate:</span>
              <span style="color: #3498db;">${showcase.escapeRate}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Power Level:</span>
              <span style="color: #3498db;">${showcase.power}</span>
            </div>
          </div>
        </div>
        
        <div style="background: rgba(155, 89, 182, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #9b59b6;">
          <h3 style="color: #9b59b6; margin: 0 0 15px 0;">⏰ Career Timeline</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Play Time:</span>
              <span style="color: #9b59b6; font-weight: bold;">${formatPlaytime(showcase.playTime)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Generation:</span>
              <span style="color: #9b59b6;">${showcase.generation}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Challenges:</span>
              <span style="color: #9b59b6;">${showcase.challengesCompleted}</span>
            </div>
          </div>
        </div>
      </div>
      
      ${showcase.legacyFamily && showcase.legacyFamily.length > 0 ? `
        <div style="background: rgba(243, 156, 18, 0.2); padding: 20px; border-radius: 15px; border: 2px solid #f39c12; margin-bottom: 30px;">
          <h3 style="color: #f39c12; margin: 0 0 15px 0;">👨‍👩‍👧‍👦 Criminal Legacy</h3>
          <p style="color: #ecf0f1; margin: 0;">
            Part of the ${showcase.legacyFamily[0]} criminal dynasty. 
            Previous generations: ${showcase.legacyFamily.join(', ')}
          </p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="showRivalsScreen()" style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer; margin-right: 15px;">
          🏆 Back to Rivals
        </button>
        <button onclick="goBackToMainMenu()" style="background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; padding: 15px 30px; border: none; border-radius: 12px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
          🏠Back to SafeHouse
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('statistics-content').innerHTML = content;
}

// ==================== END COMPETITION SYSTEM ====================

// Start the game when the page is fully loaded
if (document.readyState === 'complete') {
  startLoadingSequence();
} else {
  window.addEventListener('load', startLoadingSequence);
}

// Loading sequence with progress updates
function startLoadingSequence() {
  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress');
  const loadingPercentage = document.getElementById('loading-percentage');
  
  let progress = 0;
  const loadingSteps = [
    { text: "Initializing the underworld...", duration: 300 },
    { text: "Detecting screen dimensions...", duration: 500 },
    { text: "Loading crime families...", duration: 400 },
    { text: "Setting up territories...", duration: 300 },
    { text: "Calibrating weapons...", duration: 400 },
    { text: "Establishing connections...", duration: 600 },
    { text: "Finalizing preparations...", duration: 300 }
  ];
  
  let currentStep = 0;
  let loadingStartTime = Date.now();
  
  // Add timeout check for stuck loading
  const maxLoadingTime = 10000; // 10 seconds max
  setTimeout(() => {
    if (currentStep < loadingSteps.length) {
      console.warn('Loading appears to be stuck. Forcing completion...');
      loadingText.textContent = "Loading took longer than expected, proceeding anyway...";
      loadingPercentage.textContent = '100%';
      setTimeout(completeLoading, 1000);
    }
  }, maxLoadingTime);
  
  function updateLoading() {
    if (currentStep < loadingSteps.length) {
      const step = loadingSteps[currentStep];
      loadingText.textContent = step.text;
      progress = Math.round(((currentStep + 1) / loadingSteps.length) * 100);
      loadingProgress.style.width = progress + '%';
      loadingPercentage.textContent = progress + '%';
      
      setTimeout(() => {
        currentStep++;
        updateLoading();
      }, step.duration);
    } else {
      // Loading complete, initialize game
      completeLoading();
    }
  }
  
  // Start loading sequence after brief delay
  setTimeout(updateLoading, 500);
}

function completeLoading() {
  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress');
  const loadingPercentage = document.getElementById('loading-percentage');
  
  // Final loading state
  loadingText.textContent = "Welcome to the underworld!";
  loadingProgress.style.width = '100%';
  loadingPercentage.textContent = '100%';
  
  // Initialize game systems
  initGame();
  
  // Initialize mobile system if available
  if (typeof window.MobileSystem !== 'undefined') {
    window.MobileSystem.init();
  }
  
  // Hide loading screen and show game
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    const gameDiv = document.getElementById('game');
    
    // Fade out loading screen
    loadingScreen.style.transition = 'opacity 1s ease-out, visibility 1s ease-out';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    
    // Show game
    gameDiv.style.display = 'block';
    gameDiv.style.opacity = '0';
    gameDiv.style.transition = 'opacity 1s ease-in';
    
    // Fade in game after brief delay
    setTimeout(() => {
      gameDiv.style.opacity = '1';
    }, 100);
    
    // Remove loading screen from DOM after animation
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen);
      }
    }, 1500);
  }, 800);
}

// ==================== EXPOSE FUNCTIONS TO GLOBAL SCOPE ====================
// This is required because this file is now a module, but the HTML onclick handlers
// expect these functions to be available on the window object.

// Core Game Loop & Initialization
window.startGame = startGame;
window.updateUI = updateUI;
window.logAction = logAction;
window.alert = alert; // Overriding/wrapping standard alert if defined, or exposing custom one
window.cheatGrantResources = cheatGrantResources;
window.refreshCurrentScreen = refreshCurrentScreen;
window.hideAllScreens = hideAllScreens;
window.goBackToMainMenu = goBackToMainMenu;

// Jobs & Missions
window.showJobs = showJobs;
window.refreshJobsList = refreshJobsList;
window.startJob = startJob;
window.updateMissionProgress = updateMissionProgress;
window.checkCampaignProgress = checkCampaignProgress;
window.completeChapter = completeChapter;
window.updateMissionAvailability = updateMissionAvailability;
window.showMissions = showMissions;
window.generateCampaignHTML = generateCampaignHTML;
window.generateFactionMissionsHTML = generateFactionMissionsHTML;
window.generateTerritoryMissionsHTML = generateTerritoryMissionsHTML;
window.generateBossBattlesHTML = generateBossBattlesHTML;
window.startFactionMission = startFactionMission;
window.startSignatureJob = startSignatureJob;
window.startTerritoryMission = startTerritoryMission;
window.startBossBattle = startBossBattle;

// Business & Economy
window.showBusinesses = showBusinesses;
window.purchaseBusiness = purchaseBusiness;
window.upgradeBusiness = upgradeBusiness;
window.collectBusinessIncome = collectBusinessIncome;
window.sellBusiness = sellBusiness;
window.showLoanShark = showLoanShark;
window.checkLoanEligibility = checkLoanEligibility;
window.takeLoan = takeLoan;
window.repayLoan = repayLoan;
window.showMoneyLaundering = showMoneyLaundering;
window.checkLaunderingEligibility = checkLaunderingEligibility;
window.startLaundering = startLaundering;
window.showStore = showStore;
window.buyItem = buyItem;
window.refreshStoreDynamicElements = refreshStoreDynamicElements;
window.buyEnergyDrink = buyEnergyDrink;
window.buyCoffee = buyCoffee;
window.buySteroids = buySteroids;
window.showVehiclePurchaseResult = showVehiclePurchaseResult;
window.closeVehiclePurchaseResult = closeVehiclePurchaseResult;

// Gang & Territory
window.showGang = showGang;
window.getAverageLoyalty = getAverageLoyalty;
window.calculateGangPower = calculateGangPower;
window.generateGangOperationsHTML = generateGangOperationsHTML;
window.getAvailableMembersForOperation = getAvailableMembersForOperation;
window.isOperationOnCooldown = isOperationOnCooldown;
window.generateGangMembersHTML = generateGangMembersHTML;
window.generateTrainingProgramsHTML = generateTrainingProgramsHTML;
window.getAvailableMembersForTraining = getAvailableMembersForTraining;
window.startGangOperation = startGangOperation;
window.completeGangOperation = completeGangOperation;
window.handleOperationBetrayal = handleOperationBetrayal;
window.handleOperationArrest = handleOperationArrest;
window.completeTraining = completeTraining;
window.enrollInTraining = enrollInTraining;
window.checkForBetrayals = checkForBetrayals;
window.shouldTriggerBetrayal = shouldTriggerBetrayal;
window.triggerBetrayalEvent = triggerBetrayalEvent;
window.showTerritoryControl = showTerritoryControl;
window.showAvailableTerritories = showAvailableTerritories;
window.calculateTerritoryIncome = calculateTerritoryIncome;
window.calculateTotalTerritoryIncome = calculateTotalTerritoryIncome;
window.showProtectionRackets = showProtectionRackets;
window.getAvailableBusinessesForProtection = getAvailableBusinessesForProtection;
window.showCorruption = showCorruption;
window.getHeatColor = getHeatColor;
window.getRiskColor = getRiskColor;
window.approachBusiness = approachBusiness;
window.collectProtection = collectProtection;
window.pressureBusiness = pressureBusiness;
window.manageTerritoryDetails = manageTerritoryDetails;
window.reduceHeatTerritory = reduceHeatTerritory;
window.collectTerritoryTribute = collectTerritoryTribute;
window.processTerritoryOperations = processTerritoryOperations;
window.generateTerritoryEvent = generateTerritoryEvent;
window.collectTribute = collectTribute;
window.expandTerritory = expandTerritory;
window.gangWar = gangWar;
window.corruptOfficial = corruptOfficial;
window.initiateTurfWar = initiateTurfWar;
window.dropProtection = dropProtection;
window.fortifyTerritory = fortifyTerritory;
window.acquireTerritory = acquireTerritory;
window.fireGangMember = fireGangMember;
window.dealWithDisloyalty = dealWithDisloyalty;
window.startTraining = startTraining;
window.assignRole = assignRole;
window.hireRandomRecruit = hireRandomRecruit;
window.showGangManagementScreen = showGangManagementScreen;
window.deleteGameSlot = deleteGameSlot;

// Skills & Progression
window.showSkills = showSkills;
window.showSkillTab = showSkillTab;
window.generateBasicSkillsContent = generateBasicSkillsContent;
window.generateSkillTreesContent = generateSkillTreesContent;
window.generateReputationContent = generateReputationContent;
window.generateMentorsContent = generateMentorsContent;
window.generatePerksContent = generatePerksContent;
window.getSkillDescription = getSkillDescription;
window.upgradeSkillTree = upgradeSkillTree;
window.startMentoring = startMentoring;
window.checkPerkRequirements = checkPerkRequirements;
window.unlockPerk = unlockPerk;
window.applyPerkEffects = applyPerkEffects;
window.upgradeSkill = upgradeSkill;
window.gainExperience = gainExperience;
window.checkLevelUp = checkLevelUp;
window.showLevelUpEffects = showLevelUpEffects;
window.createLevelUpParticles = createLevelUpParticles;
window.showNarrativeOverlay = showNarrativeOverlay;
window.closeNarrativeOverlay = closeNarrativeOverlay;
window.closeLevelUpOverlay = closeLevelUpOverlay;
window.unlockAchievement = unlockAchievement;
window.checkAchievements = checkAchievements;

// FBI Investigation
window.handleFBIChoice = handleFBIChoice;

// The Fence
window.showFence = showFence;
window.fenceSellItem = fenceSellItem;
window.fenceSellCar = fenceSellCar;
window.fenceSellAllCars = fenceSellAllCars;

// Car Theft
window.handleCarTheft = handleCarTheft;
window.showCarTheftChoiceResult = showCarTheftChoiceResult;
window.handleStolenCarChoice = handleStolenCarChoice;
window.closeCarTheftChoiceResult = closeCarTheftChoiceResult;
window.showCarTheftResult = showCarTheftResult;
window.closeCarTheftResult = closeCarTheftResult;
window.sellStolenCar = sellStolenCar;
window.showStolenCars = showStolenCars;
window.useCar = useCar;
window.damageCar = damageCar;

// Jail & Legal
window.showJailScreen = showJailScreen;
window.displayPlayerJailPortrait = displayPlayerJailPortrait;
window.updatePrisonerList = updatePrisonerList;
window.breakoutPrisoner = breakoutPrisoner;
window.sendToJail = sendToJail;
window.attemptBreakout = attemptBreakout;
window.showJailbreak = showJailbreak;
window.updateJailbreakPrisonerList = updateJailbreakPrisonerList;
window.attemptJailbreak = attemptJailbreak;
window.refreshPrisoners = refreshPrisoners;
window.showCourtHouse = showCourtHouse;
window.resetWantedLevelCourtHouse = resetWantedLevelCourtHouse;

// Recruitment
window.showRecruitment = showRecruitment;
window.recruitMember = recruitMember;
window.refreshRecruits = refreshRecruits;
window.handleRandomRecruitEncounter = handleRandomRecruitEncounter;
window.showRecruitEncounterDialog = showRecruitEncounterDialog;
window.handleRecruitChoice = handleRecruitChoice;

// Events & World
window.initializeEventsSystem = initializeEventsSystem;
window.updateCurrentSeason = updateCurrentSeason;
window.updateSeasonalBackground = updateSeasonalBackground;
window.changeWeather = changeWeather;
window.showWeatherAlert = showWeatherAlert;
window.checkSeasonalEvents = checkSeasonalEvents;
window.triggerSeasonalEvent = triggerSeasonalEvent;
window.triggerNewsEvent = triggerNewsEvent;
window.triggerPoliceCrackdown = triggerPoliceCrackdown;
window.showEventAlert = showEventAlert;
window.showNewsAlert = showNewsAlert;
window.showCrackdownAlert = showCrackdownAlert;
window.isEventActive = isEventActive;
window.getActiveEffects = getActiveEffects;
window.cleanupExpiredEvents = cleanupExpiredEvents;
window.startEventTimers = startEventTimers;
window.showEventsStatus = showEventsStatus;
window.triggerRandomWeatherChange = triggerRandomWeatherChange;

// Mini Games
window.showMiniGames = showMiniGames;
window.backToMiniGamesList = backToMiniGamesList;
window.resetCurrentMiniGame = resetCurrentMiniGame;
window.startMiniGameTikTakToe = startMiniGameTikTakToe;
window.mgStartTikTakToe = mgStartTikTakToe;
window.mgMakeMove = mgMakeMove;
window.mgMakeAIMove = mgMakeAIMove;
window.mgFindBestAIMove = mgFindBestAIMove;
window.mgCheckWinningMove = mgCheckWinningMove;
window.mgCheckTikTakToeWinner = mgCheckTikTakToeWinner;
window.mgEndTikTakToeGame = mgEndTikTakToeGame;
window.mgUpdateTikTakToeDisplay = mgUpdateTikTakToeDisplay;
window.mgQuitTikTakToe = mgQuitTikTakToe;
window.mgResetTikTakToe = mgResetTikTakToe;
window.startNumberGuessing = startNumberGuessing;
window.makeGuess = makeGuess;
window.startRockPaperScissors = startRockPaperScissors;
window.updateRPSDisplay = updateRPSDisplay;
window.playRPS = playRPS;
window.startMemoryMatch = startMemoryMatch;
window.flipMemoryCard = flipMemoryCard;
window.startSnakeGame = startSnakeGame;
window.initSnakeGame = initSnakeGame;
window.generateFood = generateFood;
window.handleSnakeControls = handleSnakeControls;
window.handleSnakeMouseMove = handleSnakeMouseMove;
window.updateSnake = updateSnake;
window.drawSnake = drawSnake;
window.gameOverSnake = gameOverSnake;
window.restartSnake = restartSnake;
window.startQuickDraw = startQuickDraw;
window.startReactionTest = startReactionTest;
window.handleReactionClick = handleReactionClick;
window.startTikTakToe = startTikTakToe;
window.makeMove = makeMove;
window.makeAIMove = makeAIMove;
window.findBestAIMove = findBestAIMove;
window.checkWinningMove = checkWinningMove;
window.checkTikTakToeWinner = checkTikTakToeWinner;
window.endTikTakToeGame = endTikTakToeGame;
window.updateTikTakToeDisplay = updateTikTakToeDisplay;
window.quitTikTakToe = quitTikTakToe;
window.resetTikTakToe = resetTikTakToe;
window.checkDailyReset = checkDailyReset;
window.canPlayMiniGame = canPlayMiniGame;
window.trackMiniGamePlay = trackMiniGamePlay;
window.startBlackjack = startBlackjack;
window.bjDeal = bjDeal;
window.bjHit = bjHit;
window.bjStand = bjStand;
window.bjDouble = bjDouble;
window.startSlots = startSlots;
window.slotSpin = slotSpin;
window.startRoulette = startRoulette;
window.rouletteAddBet = rouletteAddBet;
window.rouletteClear = rouletteClear;
window.rouletteSpin = rouletteSpin;
window.startDiceGame = startDiceGame;
window.diceRoll = diceRoll;

// UI & Helpers
window.stripEmoji = stripEmoji;
window.formatShortMoney = formatShortMoney;
window.trackJobPlaystyle = trackJobPlaystyle;
window.applySkillTreeBonuses = applySkillTreeBonuses;
window.updateFactionReputation = updateFactionReputation;
window.checkForNewPerks = checkForNewPerks;
window.getReputationPriceModifier = getReputationPriceModifier;
window.hasRequiredItems = hasRequiredItems;
window.flashHurtScreen = flashHurtScreen;
window.updateRightPanel = updateRightPanel;

// Save/Load & Options
window.saveGame = saveGame;
window.loadGame = loadGame;
window.deleteSavedGame = deleteSavedGame;
window.confirmResetGame = confirmResetGame;
window.showSaveSystem = showSaveSystem;
window.showOptions = showOptions;
window.restartGame = restartGame;
window.forceNewGame = forceNewGame;
window.saveToSlot = saveToSlot;
window.loadGameFromSlot = loadGameFromSlot;
window.exitLoadInterface = exitLoadInterface;
window.confirmDeleteSave = confirmDeleteSave;
window.cancelDeleteSave = cancelDeleteSave;
window.showDeleteSelectionInterface = showDeleteSelectionInterface;
window.exportSaveData = exportSaveData;
window.importSaveData = importSaveData;
window.bribeGuard = bribeGuard;

// Version Updates
window.closeVersionUpdate = closeVersionUpdate;

// Intro & Tutorial
window.showPortraitSelection = showPortraitSelection;
window.selectPortrait = selectPortrait;
window.showIntroNarrative = showIntroNarrative;
window.finishIntro = finishIntro;
window.showTutorialPrompt = showTutorialPrompt;
window.startTutorialFromIntro = startTutorialFromIntro;
window.skipTutorialAndStartGame = skipTutorialAndStartGame;
window.startGameAfterIntro = startGameAfterIntro;
window.startTutorial = startTutorial;
window.updateTutorialDisplay = updateTutorialDisplay;
window.showTutorialFromMenu = showTutorialFromMenu;
window.loadGameFromIntro = loadGameFromIntro;
window.selectPortraitForCreation = selectPortraitForCreation;
window.loadPortraitGrid = loadPortraitGrid;
window.createCharacter = createCharacter;
window.goBackToIntro = goBackToIntro;
window.previousTutorialStep = previousTutorialStep;
window.nextTutorialStep = nextTutorialStep;
window.skipTutorial = skipTutorial;

// Other Locations
window.showRealEstate = showRealEstate;
window.buyProperty = buyProperty;
window.showInventory = showInventory;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.sellItem = sellItem;
window.selectCar = selectCar;
window.sellStolenCar = sellStolenCar;
window.showEmpireRating = showEmpireRating;
window.showHallOfFame = showHallOfFame;
window.showRivalsScreen = showRivalsScreen;
window.showRivalsTab = showRivalsTab;
window.showCompetitionTab = showCompetitionTab;
window.showCompetition = showCompetition; // Legacy support
window.showHospital = showHospital;
window.showCasino = showCasino;
window.healAtHospital = healAtHospital;
window.renderHospitalContent = renderHospitalContent;
window.checkMentorDiscovery = checkMentorDiscovery;


