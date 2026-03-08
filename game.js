import { applyDailyPassives, getDrugIncomeMultiplier, getViolenceHeatMultiplier, getWeaponPriceMultiplier } from './passiveManager.js';
import { showEmpireOverview } from './empireOverview.js';
import { player, gainExperience, REPUTATION_TIERS, getReputationTier, getNextTier, SKILL_TREE_DEFS, getTreePointsSpent, canUnlockNode, isNodeAccessible, achievements, CHARACTER_BACKGROUNDS, CHARACTER_PERKS } from './player.js';
import { jobs, stolenCarTypes } from './jobs.js';
import { crimeFamilies, factionEffects } from './factions.js';
import { familyStories, missionProgress, factionMissions } from './missions.js?v=1.8.1';
import { narrationVariations, getRandomNarration, getFamilyNarration } from './narration.js';
import { storeItems, realEstateProperties, businessTypes, launderingMethods } from './economy.js';
import { prisonerNames, recruitNames, availableRecruits, jailPrisoners, jailbreakPrisoners, setJailPrisoners, setJailbreakPrisoners, generateJailPrisoners, generateJailbreakPrisoners, generateAvailableRecruits } from './generators.js';
import { EventBus } from './eventBus.js';
import { GameLogging } from './logging.js';
import { ui, ModalSystem } from './ui-modal.js';
import { MobileSystem, updateMobileActionLog } from './mobile-responsive.js';
import { initUIEvents } from './ui-events.js';
import { initAuth, showAuthModal, autoCloudSave, emergencyCloudSave, cloudDeleteSave, getAuthState, updateAuthStatusUI, checkPlayerName, checkAdmin, adminModify } from './auth.js';
import {
  initCasino, getCasinoWins,
  showCasino, showCasinoTab, startBlackjack, bjDeal, bjHit, bjStand, bjDouble,
  startSlots, slotSpin,
  startRoulette, rouletteAddBet, rouletteClear, rouletteSpin,
  startDiceGame, diceRoll,
  startHorseRacing, selectHorse, horseAdjustBet, horseStartRace
} from './casino.js';
import {
  initMiniGames,
  startTikTakToe, makeMove, quitTikTakToe, resetTikTakToe,
  showMiniGames, backToMiniGamesList, resetCurrentMiniGame,
  startMiniGameTikTakToe, mgStartTikTakToe, mgMakeMove, mgQuitTikTakToe, mgResetTikTakToe,
  startNumberGuessing, makeGuess,
  startRockPaperScissors, playRPS,
  startMemoryMatch, flipMemoryCard,
  startSnakeGame, restartSnake,
  startQuickDraw, startReactionTest, handleReactionClick
} from './miniGames.js';
import { DISTRICTS, getDistrict, MOVE_COOLDOWN_MS, MIN_CLAIM_LEVEL, CLAIM_COSTS, MIN_WAR_GANG_SIZE, BUSINESS_TAX_RATE, getBusinessMultiplier, getDistrictBenefit, NPC_OWNER_NAMES } from './territories.js';
import { STREET_STORIES, SIDE_QUESTS, POST_DON_ARCS, DEEP_NARRATIONS } from './storyExpansion.js';

// Expose to window for legacy compatibility
window.player = player;
window.DISTRICTS = DISTRICTS;
window.getDistrict = getDistrict;
window.MIN_CLAIM_LEVEL = MIN_CLAIM_LEVEL;
window.CLAIM_COSTS = CLAIM_COSTS;
window.NPC_OWNER_NAMES = NPC_OWNER_NAMES;
window.jobs = jobs;
window.stolenCarTypes = stolenCarTypes;
window.crimeFamilies = crimeFamilies;
window.familyStories = familyStories;
window.missionProgress = missionProgress;
window.narrationVariations = narrationVariations;
window.getRandomNarration = getRandomNarration;
window.storeItems = storeItems;

// Expose weather/season globals so narration.js can read them
Object.defineProperty(window, 'currentWeather', { get() { return currentWeather; } });
Object.defineProperty(window, 'currentSeason', { get() { return currentSeason; } });
window.realEstateProperties = realEstateProperties;
window.businessTypes = businessTypes;
window.launderingMethods = launderingMethods;
window.prisonerNames = prisonerNames;
window.recruitNames = recruitNames;
window.availableRecruits = availableRecruits;
window.jailPrisoners = jailPrisoners;
window.jailbreakPrisoners = jailbreakPrisoners;
window.SKILL_TREE_DEFS = SKILL_TREE_DEFS;
window.factionEffects = factionEffects;
window.achievements = achievements;
window.EventBus = EventBus;
window.GameLogging = GameLogging;
window.ui = ui;
window.ModalSystem = ModalSystem;
window.MobileSystem = MobileSystem;
window.updateMobileActionLog = updateMobileActionLog;
window.initUIEvents = initUIEvents;
window.showAuthModal = showAuthModal;
window.getAuthState = getAuthState;
window.updateAuthStatusUI = updateAuthStatusUI;

// HTML escape utility (mirrors the one in multiplayer.js for use in ES module scope)
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
window.escapeHTML = escapeHTML;

// ==================== THEME SYSTEM ====================
const GAME_THEMES = [
  { id: 'classic',   name: 'Classic',       colors: ['#d4af37', '#0d0b07', '#4a0e0e'] },
  { id: 'midnight',  name: 'Midnight Blue',  colors: ['#5b8dd9', '#0a0c14', '#1a2a4a'] },
  { id: 'blood',     name: 'Blood Red',      colors: ['#c43030', '#0e0606', '#3a0a0a'] },
  { id: 'emerald',   name: 'Emerald',        colors: ['#3aaa5c', '#060e08', '#0a2a10'] },
  { id: 'purple',    name: 'Royal Purple',   colors: ['#9b6ad4', '#0c0810', '#2a0e3a'] },
  { id: 'copper',    name: 'Copper',         colors: ['#c87040', '#0e0a06', '#3a1a0a'] },
  { id: 'noir',      name: 'Noir',           colors: ['#a0a0a0', '#0a0a0a', '#1a1a1a'] },
  { id: 'frost',     name: 'Frost',          colors: ['#60b8d0', '#080c10', '#0a1a2a'] },
  { id: 'oldmoney',  name: 'Old Money',      colors: ['#b8a040', '#0c0a06', '#2a2410'] },
  { id: 'inferno',   name: 'Inferno',        colors: ['#e88020', '#100804', '#3a1808'] },
  { id: 'absinthe',  name: 'Absinthe',       colors: ['#90b830', '#080c06', '#1a2a0a'] },
  { id: 'syndicate', name: 'Syndicate',      colors: ['#50b0a0', '#080c0c', '#0a2a24'] },
  { id: 'rosegold',  name: 'Rose Gold',      colors: ['#c88080', '#0e0a0a', '#2a1418'] },
];

function applyTheme(themeId) {
  const theme = GAME_THEMES.find(t => t.id === themeId);
  if (!theme) return;
  if (themeId === 'classic') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
  localStorage.setItem('mafiaTheme', themeId);
  // Highlight active swatch if picker is visible
  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.classList.toggle('active', el.dataset.theme === themeId);
  });
}
window.applyTheme = applyTheme;

function buildThemePicker() {
  return `
    <div class="theme-grid">
      ${GAME_THEMES.map((t, i) => `
        <div class="theme-swatch ${(localStorage.getItem('mafiaTheme') || 'classic') === t.id ? 'active' : ''}"
             data-theme="${t.id}" onclick="applyTheme('${t.id}')">
          <div class="theme-swatch-colors">
            <span style="background:${t.colors[0]};"></span>
            <span style="background:${t.colors[1]};"></span>
            <span style="background:${t.colors[2]};"></span>
          </div>
          <span class="theme-swatch-label">#${i + 1} ${t.name}</span>
        </div>
      `).join('')}
    </div>
  `;
}
window.buildThemePicker = buildThemePicker;

// Apply saved theme on load
(function initTheme() {
  const saved = localStorage.getItem('mafiaTheme');
  if (saved && saved !== 'classic') {
    document.documentElement.setAttribute('data-theme', saved);
  }
})();

// ==================== CRIME COOLDOWN SYSTEM ====================
// Each job has a cooldown based on its risk level. Planning skill & Quick Hands perk reduce cooldowns.
const RISK_COOLDOWNS = {
  low: 15,        // 15 seconds
  medium: 45,     // 45 seconds
  high: 120,      // 2 minutes
  'very high': 300, // 5 minutes
  extreme: 600,   // 10 minutes
  legendary: 1200  // 20 minutes
};

// Get the cooldown duration (in seconds) for a job, reduced by Planning skill, Unstoppable skill & Quick Hands perk
function getJobCooldown(job) {
  const baseCooldown = RISK_COOLDOWNS[job.risk] || 15;
  const planningLevel = (player.skillTree && player.skillTree.intelligence) ? (player.skillTree.intelligence.planning || 0) : 0;
  const unstoppableLevel = (player.skillTree && player.skillTree.endurance) ? (player.skillTree.endurance.unstoppable || 0) : 0;
  let cooldown = baseCooldown * (1 - planningLevel * 0.05); // -5% per Planning rank
  cooldown = cooldown * (1 - unstoppableLevel * 0.08); // -8% per Unstoppable rank
  if (typeof hasPlayerPerk === 'function' && hasPlayerPerk('quick_hands')) {
    cooldown = cooldown * 0.85; // Quick Hands: -15% cooldown
  }
  return Math.max(5, Math.ceil(cooldown)); // Minimum 5 seconds
}

// Check if a job is on cooldown. Returns remaining seconds or 0 if ready.
function getJobCooldownRemaining(index) {
  if (!player.jobCooldowns) player.jobCooldowns = {};
  const expires = player.jobCooldowns[index];
  if (!expires) return 0;
  const remaining = Math.ceil((expires - Date.now()) / 1000);
  if (remaining <= 0) {
    delete player.jobCooldowns[index];
    return 0;
  }
  return remaining;
}

// Set cooldown on a job after completion
function setJobCooldown(index, job) {
  if (!player.jobCooldowns) player.jobCooldowns = {};
  const cooldownSec = getJobCooldown(job);
  player.jobCooldowns[index] = Date.now() + cooldownSec * 1000;
}

// Format seconds into a human-readable string like "2m 30s" or "15s"
function formatCooldownTime(seconds) {
  if (seconds <= 0) return 'Ready';
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

// Cooldown tick — refreshes job list UI every second while any cooldown is active
let _cooldownTickInterval = null;
function startCooldownTick() {
  if (_cooldownTickInterval) return; // Already running
  _cooldownTickInterval = setInterval(() => {
    if (!player.jobCooldowns || Object.keys(player.jobCooldowns).length === 0) {
      clearInterval(_cooldownTickInterval);
      _cooldownTickInterval = null;
      return;
    }
    // Only refresh if jobs screen is visible
    if (document.getElementById('jobs-screen') && document.getElementById('jobs-screen').style.display === 'block') {
      refreshJobsList();
    }
  }, 1000);
}

// ==================== POWER RECALCULATION ====================
// Power is derived from: equipped weapon + equipped armor + equipped vehicle + real estate + gang members
// Items sitting in inventory but NOT equipped contribute NOTHING to power.
function recalculatePower() {
  let total = 0;
  // Equipped weapon
  if (player.equippedWeapon && typeof player.equippedWeapon === 'object') {
    total += player.equippedWeapon.power || 0;
  }
  // Equipped armor
  if (player.equippedArmor && typeof player.equippedArmor === 'object') {
    total += player.equippedArmor.power || 0;
  }
  // Equipped vehicle
  if (player.equippedVehicle && typeof player.equippedVehicle === 'object') {
    total += player.equippedVehicle.power || 0;
  }
  // Real estate power
  if (player.realEstate && player.realEstate.ownedProperties) {
    player.realEstate.ownedProperties.forEach(p => { total += p.power || 0; });
  }
  // Gang member power -- use explicit .power if set, otherwise derive from experience level
  if (player.gang && player.gang.gangMembers) {
    player.gang.gangMembers.forEach(m => {
      total += m.power || (Math.floor((m.experienceLevel || 1) * 2) + 5);
    });
  }
  player.power = total;

  // Sync turf power -- base 100 + total from equipment and gang
  if (player.turf) {
    player.turf.power = 100 + total;
  }
  // Keep legacy territoryPower in sync
  player.territoryPower = (player.turf?.power) || (100 + total);

  return total;
}
window.recalculatePower = recalculatePower;

// ==================== DURABILITY SYSTEM ====================
// Degrades equipped weapon, armor, and vehicle after jobs/combat.
// When durability reaches 0 the item breaks and is removed.
function degradeEquipment(context) {
  const broken = [];
  // Weapon: lose 1 durability per use
  if (player.equippedWeapon && typeof player.equippedWeapon === 'object') {
    player.equippedWeapon.durability = Math.max(0, (player.equippedWeapon.durability || 0) - 1);
    if (player.equippedWeapon.durability <= 0) {
      broken.push(player.equippedWeapon.name);
      // Remove from inventory
      const idx = player.inventory.findIndex(i => i === player.equippedWeapon);
      if (idx !== -1) player.inventory.splice(idx, 1);
      player.equippedWeapon = null;
    }
  }
  // Armor: lose 1 durability per use
  if (player.equippedArmor && typeof player.equippedArmor === 'object') {
    player.equippedArmor.durability = Math.max(0, (player.equippedArmor.durability || 0) - 1);
    if (player.equippedArmor.durability <= 0) {
      broken.push(player.equippedArmor.name);
      const idx = player.inventory.findIndex(i => i === player.equippedArmor);
      if (idx !== -1) player.inventory.splice(idx, 1);
      player.equippedArmor = null;
    }
  }
  // Vehicle: lose 1 durability per use
  if (player.equippedVehicle && typeof player.equippedVehicle === 'object') {
    player.equippedVehicle.durability = Math.max(0, (player.equippedVehicle.durability || 0) - 1);
    if (player.equippedVehicle.durability <= 0) {
      broken.push(player.equippedVehicle.name);
      const idx = player.inventory.findIndex(i => i === player.equippedVehicle);
      if (idx !== -1) player.inventory.splice(idx, 1);
      player.equippedVehicle = null;
    }
  }
  if (broken.length > 0) {
    recalculatePower();
    const msg = broken.map(n => `Your ${n} broke from wear and tear!`).join(' ');
    logAction(`${msg} You'll need to buy a replacement.`);
    if (typeof showBriefNotification === 'function') {
      showBriefNotification(`${broken.join(', ')} broke!`, 'danger');
    }
  }
}
window.degradeEquipment = degradeEquipment;

// Bridge functions for auth.js cloud save/load
window.createSaveDataForCloud = function () {
    const saveData = createSaveData();
    const empireRating = calculateEmpireRating();
    const playtime = formatPlaytime(calculatePlaytime());
    return {
        playerName: player.name,
        reputation: Math.floor(player.reputation || 0),
        money: player.money,
        empireRating: empireRating.totalScore,
        playtime: playtime,
        gameVersion: CURRENT_VERSION,
        data: saveData
    };
};

window.applyCloudSave = function (cloudEntry) {
    if (!cloudEntry || !cloudEntry.data) return;
    const saveData = cloudEntry.data;
    if (!validateSaveData(saveData)) {
        showBriefNotification('Cloud save data is corrupted or incompatible!', 'danger');
        return;
    }
    applySaveData(saveData);
    // Also store locally so local save system stays in sync
    const localEntry = {
        slotNumber: SAVE_SYSTEM.currentSlot ?? 1,
        saveName: `Cloud - ${cloudEntry.playerName || player.name}`,
        playerName: cloudEntry.playerName || player.name,
        level: cloudEntry.level || player.level,
        money: cloudEntry.money || player.money,
        reputation: cloudEntry.reputation || 0,
        empireRating: cloudEntry.empireRating || 0,
        playtime: cloudEntry.playtime || '0:00',
        saveDate: cloudEntry.saveDate || new Date().toISOString(),
        isAutoSave: false,
        gameVersion: cloudEntry.gameVersion || CURRENT_VERSION,
        data: saveData
    };
    localStorage.setItem(`gameSlot_${SAVE_SYSTEM.currentSlot ?? 1}`, JSON.stringify(localEntry));
    updateUI();
    applyUIToggles();
    applyStatBarPrefs();
    if (!gameplayActive) {
        // If on intro screen, jump into the game
        activateGameplaySystems();
        hideAllScreens();
        showCommandCenter();
    }
};

// Flag to prevent events/notifications from firing while on the title screen.
// Set to true only when the player enters actual gameplay.
let gameplayActive = false;

// Track all gameplay interval IDs so they can be cleared on game reset
const gameplayIntervals = [];

function clearAllGameplayIntervals() {
  while (gameplayIntervals.length > 0) {
    clearInterval(gameplayIntervals.pop());
  }
  stopQuestTimerTick();
}

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
    case 'turf_controlled':
      stats.territoriesControlled = player.territory; // Update to current territory count
      break;
    case 'boss_defeated':
      stats.bossesDefeated += value;
      break;
    case 'faction_mission_completed':
      stats.factionMissionsCompleted += value;
      break;
    case 'reputation_changed':
      break;
    case 'property_acquired':
      break;
  }

  // Update mission availability
  updateMissionAvailability();
}

// Function to update mission availability based on player progress
function updateMissionAvailability() {
}

// Function to show missions/story screen
async function showMissions() {
  if (player.inJail) {
    showBriefNotification("Can't access missions while in jail!", 'danger');
    return;
  }

  let missionsHTML;

  // Story-driven flow:
  // 1. No family chosen -> family story picker
  // 2. Family chosen, story in progress -> current chapter
  // 3. Don achieved -> empire dashboard (with turf/rackets access)
  const sp = player.storyProgress;
  const hasFamilyStory = player.chosenFamily && familyStories[player.chosenFamily];

  if (!hasFamilyStory) {
    // No family yet -- show cinematic family picker
    missionsHTML = renderStoryFamilyPicker();
  } else if (sp && sp.isDon) {
    // Don achieved -- show empire epilogue
    missionsHTML = renderStoryEpilogue(player.chosenFamily, familyStories[player.chosenFamily]);
  } else {
    // Story in progress -- show current chapter
    missionsHTML = renderStoryChapter();
  }

  document.getElementById("missions-content").innerHTML = `
    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #c0a062;padding-bottom:0;flex-wrap:wrap;">
      <button id="ops-tab-story" class="ops-tab active" onclick="switchOpsTab('story', this)" style="background:#c0a062;color:#000;padding:10px 18px;border:1px solid #c0a062;border-bottom:none;border-radius:8px 8px 0 0;cursor:pointer;font-family:'Georgia',serif;font-weight:bold;font-size:0.95em;">Story</button>
      <button id="ops-tab-sideops" class="ops-tab" onclick="switchOpsTab('sideops', this)" style="background:#222;color:#c0a062;padding:10px 18px;border:1px solid #c0a062;border-bottom:1px solid #c0a062;border-radius:8px 8px 0 0;cursor:pointer;font-family:'Georgia',serif;font-weight:normal;font-size:0.95em;">Side Ops</button>
      <button id="ops-tab-turf" class="ops-tab" onclick="switchOpsTab('turf', this)" style="background:#222;color:#c0a062;padding:10px 18px;border:1px solid #c0a062;border-bottom:1px solid #c0a062;border-radius:8px 8px 0 0;cursor:pointer;font-family:'Georgia',serif;font-weight:normal;font-size:0.95em;">Turf</button>
      <button id="ops-tab-superboss" class="ops-tab" onclick="switchOpsTab('superboss', this)" style="background:#222;color:#c0a062;padding:10px 18px;border:1px solid #c0a062;border-bottom:1px solid #c0a062;border-radius:8px 8px 0 0;cursor:pointer;font-family:'Georgia',serif;font-weight:normal;font-size:0.95em;">Superboss</button>
    </div>
    <div id="ops-panel-story" class="ops-panel active">${missionsHTML}</div>
    <div id="ops-panel-sideops" class="ops-panel" style="display:none;"><div id="sideops-content"><p style="color:#8a7a5a;">Loading side operations...</p></div></div>
    <div id="ops-panel-turf" class="ops-panel" style="display:none;"><div id="turf-tab-content"><p style="color:#8a7a5a;">Loading turf control...</p></div></div>
    <div id="ops-panel-superboss" class="ops-panel" style="display:none;"><div id="superboss-content"><p style="color:#8a7a5a;">Loading superboss data...</p></div></div>
  `;
  hideAllScreens();
  document.getElementById("missions-screen").style.display = "block";
}

// Switch between Operations tabs
function switchOpsTab(tabId, btn) {
  document.querySelectorAll('.ops-panel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  document.querySelectorAll('.ops-tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = '#222'; t.style.color = '#c0a062'; t.style.fontWeight = 'normal'; t.style.borderBottom = '1px solid #c0a062';
  });
  const panel = document.getElementById('ops-panel-' + tabId);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
  if (btn) {
    btn.classList.add('active');
    btn.style.background = '#c0a062'; btn.style.color = '#000'; btn.style.fontWeight = 'bold'; btn.style.borderBottom = 'none';
  }
  if (tabId === 'sideops') {
    const sideopsContainer = document.getElementById('sideops-content');
    if (sideopsContainer) {
      // Render the side quest screen content inline
      initSideQuests();
      sideopsContainer.innerHTML = renderSideOpsContent();
      startQuestTimerTick();
    }
  }
  if (tabId === 'turf') {
    const turfContainer = document.getElementById('turf-tab-content');
    if (turfContainer) {
      initTurfZones();
      turfContainer.innerHTML = renderTurfControlContent();
    }
  }
  if (tabId === 'superboss') {
    if (typeof sendMP === 'function') sendMP({ type: 'superboss_list' });
  }
}

// Toggle a family section open/closed
function toggleFamilyGroup(familyKey) {
  const header = document.querySelector(`[data-family-header="${familyKey}"]`);
  const body = document.querySelector(`[data-family-body="${familyKey}"]`);
  if (header && body) {
    header.classList.toggle('expanded');
    body.classList.toggle('expanded');
  }
}

// Toggle locked missions visibility
function toggleLockedMissions(familyKey) {
  const el = document.querySelector(`[data-locked-group="${familyKey}"]`);
  const btn = document.querySelector(`[data-locked-toggle="${familyKey}"]`);
  if (el) {
    const visible = el.style.display !== 'none';
    el.style.display = visible ? 'none' : 'block';
    if (btn) btn.textContent = visible ? 'Show locked missions...' : 'Hide locked missions';
  }
}

// ==================== STORY MODE RENDERER ====================
// Replaces old campaign/faction/turf/boss HTML generators with immersive story-driven UI

// Get the current value for a story objective
function getStoryObjectiveValue(objective) {
  const stats = player.missions.missionStats;
  switch (objective.type) {
    case 'jobs': return stats.jobsCompleted || 0;
    case 'money': return player.money || 0;
    case 'level':
    case 'reputation': return Math.floor(player.reputation || 0);
    case 'gang': return player.gang.members || 0;
    case 'properties': return (player.realEstate?.ownedProperties || []).length;
    default: return 0;
  }
}

// Check if all objectives for a chapter are met
function areStoryObjectivesMet(chapter) {
  return chapter.objectives.every(o => getStoryObjectiveValue(o) >= o.target);
}

// Render the cinematic family selection (story prologue)
function renderStoryFamilyPicker() {
  let html = `
    <div class="story-screen">
      <div class="story-title-block">
        <h1 class="story-main-title">Choose Your Destiny</h1>
        <p class="story-subtitle">Every family has a story. Every story has a price. Choose wisely -- this decision shapes your entire journey.</p>
      </div>
      <div class="story-family-grid">`;

  Object.entries(familyStories).forEach(([famKey, fam]) => {
    const rivalFam = typeof RIVAL_FAMILIES !== 'undefined' ? RIVAL_FAMILIES[famKey] : null;
    const buff = rivalFam?.buff;
    html += `
      <div class="story-family-card" style="--fam-color:${fam.color}">
        <div class="story-family-icon">${rivalFam?.name || fam.icon}</div>
        <h3 class="story-family-story-title">"${fam.storyTitle}"</h3>
        <p class="story-family-tagline">${fam.tagline}</p>
        ${buff ? `<div class="story-family-buff">${buff.name}: ${buff.description}</div>` : ''}
        <div class="story-family-chapters">25 Chapters &middot; 5 Acts</div>
        <button class="story-pledge-btn" style="background:linear-gradient(135deg,${fam.color},${fam.color}cc);" onclick="beginFamilyStory('${famKey}')">
          Begin This Story
        </button>
      </div>`;
  });

  html += `</div>
    <button class="story-back-btn" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
  </div>`;
  return html;
}

// Begin a family's story - set up player state and show first chapter
async function beginFamilyStory(familyKey) {
  const fam = familyStories[familyKey];
  if (!fam) return;
  const rivalFam = typeof RIVAL_FAMILIES !== 'undefined' ? RIVAL_FAMILIES[familyKey] : null;

  const confirmed = await ui.confirm(
    `Begin "${fam.storyTitle}" with the ${rivalFam?.name || familyKey}?\n\n` +
    `${fam.tagline}\n\n` +
    `This is permanent! You will play through this family's 25-chapter story.`
  );

  if (!confirmed) return;

  // Set family allegiance
  player.chosenFamily = familyKey;
  player.familyRank = 'associate';
  if (!player.turf) player.turf = { owned: [], power: 100, income: 0, reputation: 0 };
  player.turf.reputation = (player.turf.reputation || 0) + 10;
  player.territoryReputation = (player.territoryReputation || 0) + 10;

  // Init story progress
  player.storyProgress = {
    currentChapter: 0,
    chaptersCompleted: [],
    respect: 0,
    choices: {},
    isDon: false,
    bossesDefeated: []
  };

  showBriefNotification(`"${fam.storyTitle}" begins...`, 'success');
  logAction(`You've begun <strong>"${fam.storyTitle}"</strong> with the ${rivalFam?.name || familyKey}.`);

  updateUI();
  showMissions();
}
window.beginFamilyStory = beginFamilyStory;

// Render the current story chapter (the main story view)
function renderStoryChapter() {
  const famKey = player.chosenFamily;
  const fam = familyStories[famKey];
  if (!fam) return renderStoryFamilyPicker();

  const sp = player.storyProgress || {};
  const chapterIdx = sp.currentChapter || 0;
  const chapter = fam.chapters[chapterIdx];

  // If all chapters done (isDon), show the empire endgame screen
  if (!chapter || sp.isDon) {
    return renderStoryEpilogue(famKey, fam);
  }

  const rivalFam = typeof RIVAL_FAMILIES !== 'undefined' ? RIVAL_FAMILIES[famKey] : null;
  const chapterNum = chapterIdx + 1;
  const totalChapters = fam.chapters.length;
  const rank = player.familyRank || 'associate';

  // Check choice & boss state for this chapter
  const choiceMade = sp.choices && sp.choices[chapter.id];
  const bossDefeated = chapter.boss && sp.bossesDefeated && sp.bossesDefeated.includes(chapter.id);
  const allObjectivesMet = areStoryObjectivesMet(chapter);

  // Build narrative blocks
  let narrativeHTML = chapter.narrative.map(block => {
    if (block.type === 'scene') {
      return `<div class="story-block story-scene"><em>${block.text}</em></div>`;
    } else if (block.type === 'dialogue') {
      return `<div class="story-block story-dialogue"><span class="story-speaker">${block.speaker}:</span> ${block.text}</div>`;
    } else {
      return `<div class="story-block story-narration">${block.text}</div>`;
    }
  }).join('');

  // Build objectives list
  let objectivesHTML = chapter.objectives.map(obj => {
    const current = getStoryObjectiveValue(obj);
    const met = current >= obj.target;
    return `
      <div class="story-objective ${met ? 'obj-met' : ''}">
        <span class="obj-icon">${met ? '' : ''}</span>
        <span class="obj-label">${obj.text}</span>
        <span class="obj-val">${current.toLocaleString()} / ${obj.target.toLocaleString()}</span>
      </div>`;
  }).join('');

  // Rewards block
  const rw = chapter.rewards;
  let rewardsHTML = `<div class="story-rewards">
    ${rw.money ? `<span class="story-reward-tag">$${rw.money.toLocaleString()}</span>` : ''}
    ${rw.reputation ? `<span class="story-reward-tag">+${rw.reputation} Respect</span>` : ''}
    ${chapter.rankOnComplete ? `<span class="story-reward-tag rank-up">-> ${chapter.rankOnComplete.charAt(0).toUpperCase() + chapter.rankOnComplete.slice(1)}</span>` : ''}
  </div>`;

  // Choice UI (if this chapter has a choice and player hasn't chosen yet)
  let choiceHTML = '';
  if (chapter.choice && !choiceMade) {
    choiceHTML = `
      <div class="story-choice-block">
        <div class="story-choice-prompt">${chapter.choice.prompt}</div>
        <div class="story-choice-options">
          ${chapter.choice.options.map((opt, i) => `
            <button class="story-choice-btn" onclick="makeStoryChoice('${chapter.id}', ${i})">
              ${opt.text}
            </button>
          `).join('')}
        </div>
      </div>`;
  } else if (chapter.choice && choiceMade) {
    const chosenOpt = chapter.choice.options[choiceMade.optionIndex];
    choiceHTML = `
      <div class="story-choice-block chosen">
        <div class="story-choice-prompt">${chapter.choice.prompt}</div>
        <div class="story-choice-result"> ${chosenOpt ? chosenOpt.text : 'Choice made'}</div>
      </div>`;
  }

  // Boss fight trigger (if this chapter has a boss)
  let bossHTML = '';
  if (chapter.boss && !bossDefeated) {
    bossHTML = `
      <div class="story-boss-block">
        <div class="story-boss-header">
          <span class="boss-icon"></span>
          <span class="boss-name">${chapter.boss.name}</span>
        </div>
        <div class="story-boss-intro">${chapter.boss.dialogue.intro}</div>
        <div class="story-boss-stats">
          <span>Power: ${chapter.boss.power}</span>
          <span>Health: ${chapter.boss.health}</span>
          <span>Guards: ${chapter.boss.gangSize}</span>
        </div>
        <button class="story-boss-btn" onclick="startStoryBossFight('${chapter.id}')" ${allObjectivesMet ? '' : 'disabled'}>
          ${allObjectivesMet ? 'Face the Boss' : ' Complete objectives first'}
        </button>
      </div>`;
  } else if (chapter.boss && bossDefeated) {
    bossHTML = `
      <div class="story-boss-block defeated">
        <div class="story-boss-header">
          <span class="boss-icon"></span>
          <span class="boss-name">${chapter.boss.name} -- Defeated</span>
        </div>
        <div class="story-boss-victory">${chapter.boss.dialogue.victory}</div>
      </div>`;
  }

  // Completion / advance button
  let advanceHTML = '';
  const canComplete = allObjectivesMet && (!chapter.choice || choiceMade) && (!chapter.boss || bossDefeated);
  if (canComplete) {
    // Show completion narrative if available
    let completionNarrHTML = '';
    if (chapter.completionNarrative && chapter.completionNarrative.length > 0) {
      completionNarrHTML = `<div class="story-completion-narrative">` +
        chapter.completionNarrative.map(block => {
          if (block.type === 'scene') return `<div class="story-block story-scene"><em>${block.text}</em></div>`;
          if (block.type === 'dialogue') return `<div class="story-block story-dialogue"><span class="story-speaker">${block.speaker}:</span> ${block.text}</div>`;
          return `<div class="story-block story-narration">${block.text}</div>`;
        }).join('') +
        `</div>`;
    }
    advanceHTML = `
      ${completionNarrHTML}
      <button class="story-advance-btn" onclick="advanceStoryChapter()">
        ${chapterNum < totalChapters ? 'Continue to Next Chapter ->' : 'Claim Your Destiny'}
      </button>`;
  }

  // Assemble the full chapter view
  return `
    <div class="story-screen">
      <!-- Story Header -->
      <div class="story-header" style="--fam-color:${fam.color}">
        <div class="story-header-top">
          <div class="story-header-info">
            <h1 class="story-header-title">${fam.storyTitle}</h1>
            <div class="story-header-meta">${rivalFam?.name || fam.icon} &middot; ${rank.charAt(0).toUpperCase() + rank.slice(1)} &middot; Respect: ${sp.respect || 0}</div>
          </div>
        </div>
        <div class="story-chapter-bar">
          ${fam.chapters.map((ch, i) => {
            const done = (sp.chaptersCompleted || []).includes(ch.id);
            const current = i === chapterIdx;
            return `<div class="story-ch-pip ${done ? 'done' : ''} ${current ? 'current' : ''}" title="Ch ${i+1}: ${ch.title}"></div>`;
          }).join('')}
        </div>
      </div>

      <!-- Act & Chapter Title -->
      <div class="story-act-banner" style="border-color:${fam.color}">
        <span class="story-act-label">Act ${chapter.act}: ${chapter.actTitle}</span>
        <h2 class="story-chapter-title">Chapter ${chapterNum}: ${chapter.title}</h2>
      </div>

      <!-- Narrative -->
      <div class="story-narrative">${narrativeHTML}</div>

      <!-- Choice -->
      ${choiceHTML}

      <!-- Objectives -->
      <div class="story-objectives-panel">
        <h3 class="story-obj-header">Objectives</h3>
        ${objectivesHTML}
      </div>

      <!-- Rewards Preview -->
      ${rewardsHTML}

      <!-- Boss Fight -->
      ${bossHTML}

      <!-- Advance -->
      ${advanceHTML}

      <!-- Back Button -->
      <button class="story-back-btn" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>`;
}

// Render the post-Don epilogue / empire dashboard
function renderStoryEpilogue(famKey, fam) {
  const rivalFam = typeof RIVAL_FAMILIES !== 'undefined' ? RIVAL_FAMILIES[famKey] : null;
  const ownedZones = (player.turf?.owned || []).length;
  const totalZones = typeof TURF_ZONES !== 'undefined' ? TURF_ZONES.length : 0;

  // Determine which endgame arcs the player qualifies for
  const rep = Math.floor(player.reputation || 0);
  const questsCompleted = (player.sideQuests?.completed || []).length;
  const totalQuests = SIDE_QUESTS.length;

  // Build endgame arc cards
  let arcsHTML = '';
  const availableArcs = POST_DON_ARCS.filter(arc => {
    if (arc.conditions.minRespect && rep < arc.conditions.minRespect) return false;
    if (arc.conditions.minReputation && rep < arc.conditions.minReputation) return false;
    return true;
  });
  const lockedArcs = POST_DON_ARCS.filter(arc => !availableArcs.includes(arc));

  if (availableArcs.length > 0 || lockedArcs.length > 0) {
    arcsHTML = `
      <div style="margin:20px 0;">
        <h3 style="color:#c0a040;margin-bottom:12px;">Endgame Story Arcs</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
          ${availableArcs.map(arc => `
            <div style="background:linear-gradient(135deg,#14120a,#0d0b07);border:1px solid #c0a04055;border-radius:12px;padding:15px;cursor:pointer;" onclick="showPostDonArc('${arc.id}')">
              <div style="font-size:2em;text-align:center;">${arc.icon}</div>
              <h4 style="color:#c0a040;text-align:center;margin:8px 0 4px;">${arc.title}</h4>
              <p style="color:#aaa;font-size:0.85em;line-height:1.4;text-align:center;">${arc.description}</p>
            </div>
          `).join('')}
          ${lockedArcs.map(arc => `
            <div style="background:#111;border:1px solid #33333355;border-radius:12px;padding:15px;opacity:0.5;">
              <div style="font-size:2em;text-align:center;"></div>
              <h4 style="color:#666;text-align:center;margin:8px 0 4px;">${arc.title}</h4>
              <p style="color:#555;font-size:0.8em;text-align:center;">Requires ${arc.conditions.minRespect || '?'} Respect</p>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  return `
    <div class="story-screen">
      <div class="story-header" style="--fam-color:${fam.color}">
        <div class="story-header-top">
          <div class="story-header-info">
            <h1 class="story-header-title">${rivalFam?.name || fam.icon} -- Don</h1>
            <div class="story-header-meta">Story Complete &middot; Empire Unlocked</div>
          </div>
        </div>
      </div>

      <div class="story-epilogue-text">
        <p>You've completed <strong>"${fam.storyTitle}"</strong> and claimed leadership of the ${rivalFam?.name || famKey}.</p>
        <p style="color:#aaa;margin-top:10px;font-style:italic;">The crown is heavy. Every family in the city watches your next move. Rivals circle like sharks. The feds build their case. And somewhere in the shadows, the next you is rising -- hungry, angry, and willing to do whatever it takes.</p>
        <p style="color:#ccc;margin-top:8px;">The streets are yours. Now defend them.</p>
      </div>

      <div class="story-empire-stats">
        <div class="empire-stat"><span class="empire-stat-label">Turf Controlled</span><span class="empire-stat-val">${ownedZones} / ${totalZones}</span></div>
        <div class="empire-stat"><span class="empire-stat-label">Gang Size</span><span class="empire-stat-val">${player.gang.members}</span></div>
        <div class="empire-stat"><span class="empire-stat-label">Respect</span><span class="empire-stat-val">${rep}</span></div>
        <div class="empire-stat"><span class="empire-stat-label">Net Worth</span><span class="empire-stat-val">$${(player.money + (player.dirtyMoney || 0)).toLocaleString()}</span></div>
        <div class="empire-stat"><span class="empire-stat-label">Side Ops</span><span class="empire-stat-val">${questsCompleted} / ${totalQuests}</span></div>
      </div>

      ${arcsHTML}

      <div style="display:flex;flex-direction:column;gap:12px;margin:20px 0;">
        <button class="story-action-btn" onclick="showProtectionRackets();">Protection Rackets</button>
      </div>

      <button class="story-back-btn" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>`;
}

// ==================== STORY PROGRESSION LOGIC ====================

// Make a story choice for the current chapter
function makeStoryChoice(chapterId, optionIndex) {
  const famKey = player.chosenFamily;
  const fam = familyStories[famKey];
  if (!fam) return;

  const sp = player.storyProgress;
  if (!sp) return;

  const chapter = fam.chapters[sp.currentChapter];
  if (!chapter || chapter.id !== chapterId || !chapter.choice) return;

  // Don't allow re-choosing
  if (sp.choices[chapterId]) return;

  const option = chapter.choice.options[optionIndex];
  if (!option) return;

  // Record choice
  sp.choices[chapterId] = { optionIndex, effect: option.effect, value: option.value };

  // Apply effect
  switch (option.effect) {
    case 'money':
      player.money += option.value;
      if (option.value > 0) logAction(`Choice reward: +$${option.value.toLocaleString()}`);
      else logAction(`Choice cost: -$${Math.abs(option.value).toLocaleString()}`);
      break;
    case 'reputation':
      player.reputation += option.value;
      logAction(`Choice reward: +${option.value} respect`);
      break;
    case 'respect':
      sp.respect = (sp.respect || 0) + option.value;
      logAction(`Choice reward: +${option.value} family respect`);
      break;
  }

  showBriefNotification('Choice recorded', 'success');
  updateUI();
  showMissions();
}
window.makeStoryChoice = makeStoryChoice;

// Start a boss fight embedded in a story chapter
async function startStoryBossFight(chapterId) {
  const famKey = player.chosenFamily;
  const fam = familyStories[famKey];
  if (!fam) return;

  const sp = player.storyProgress;
  const chapter = fam.chapters[sp.currentChapter];
  if (!chapter || chapter.id !== chapterId || !chapter.boss) return;

  // Already defeated?
  if (sp.bossesDefeated.includes(chapterId)) return;

  const boss = chapter.boss;

  // Battle calculation
  const enforcerBonus = (player.skillTree.combat.enforcer || 0) * 0.15; // +15% boss power per rank
  const playerStrength = Math.floor((player.power + (player.gang.members * 8) + (player.skillTree.combat.brawler * 10)) * (1 + enforcerBonus));
  const bossStrength = boss.power + (boss.gangSize * 6);
  const successChance = Math.min(85, 30 + ((playerStrength / bossStrength) * 40));

  if (Math.random() * 100 < successChance) {
    // Victory
    player.money += boss.reward;
    sp.bossesDefeated.push(chapterId);

    logAction(`VICTORY! ${boss.name} has been defeated!`);
    logAction(boss.dialogue.victory);
    await ui.alert(`${boss.name} defeated!\n\n${boss.dialogue.victory}`);
    showBriefNotification(`${boss.name} defeated! +$${boss.reward.toLocaleString()}`, 'success');
  } else {
    // Defeat
    const healthLoss = Math.floor(Math.random() * 30) + 15;
    player.health -= healthLoss;

    logAction(`${boss.name} overpowered you!`);
    logAction(boss.dialogue.defeat);
    showBriefNotification(`Defeated by ${boss.name}! Lost ${healthLoss} health.`, 'danger');

    if (player.health <= 0) {
      showDeathScreen(`Killed fighting ${boss.name}`);
      return;
    }
  }

  updateUI();
  showMissions();
}
window.startStoryBossFight = startStoryBossFight;

// Advance to the next story chapter (called when player clicks the advance button)
function advanceStoryChapter() {
  const famKey = player.chosenFamily;
  const fam = familyStories[famKey];
  if (!fam) return;

  const sp = player.storyProgress;
  const chapterIdx = sp.currentChapter;
  const chapter = fam.chapters[chapterIdx];
  if (!chapter) return;

  // Verify completion
  const choiceMade = !chapter.choice || sp.choices[chapter.id];
  const bossDefeated = !chapter.boss || sp.bossesDefeated.includes(chapter.id);
  if (!areStoryObjectivesMet(chapter) || !choiceMade || !bossDefeated) return;

  // Mark completed
  sp.chaptersCompleted.push(chapter.id);

  // Give rewards
  player.money += chapter.rewards.money || 0;
  player.reputation = (player.reputation || 0) + (chapter.rewards.reputation || 0);
  sp.respect = (sp.respect || 0) + (chapter.respectGain || 0);

  logAction(`Chapter Complete: "${chapter.title}" -- +$${(chapter.rewards.money||0).toLocaleString()}, +${chapter.rewards.reputation||0} Respect`);

  // Rank promotion
  if (chapter.rankOnComplete) {
    player.familyRank = chapter.rankOnComplete;
    const rankName = chapter.rankOnComplete.charAt(0).toUpperCase() + chapter.rankOnComplete.slice(1);
    logAction(`Promoted to <strong>${rankName}</strong>!`);
    showBriefNotification(`Promoted to ${rankName}!`, 'success');

    if (chapter.rankOnComplete === 'don') {
      sp.isDon = true;
      logAction(`You are now the <strong>Don</strong>. The city bows to your will.`);
      showBriefNotification('You are the Don! Turf Wars unlocked!', 'success');

      // Transfer all faction-controlled territory to the player
      initTurfZones();
      const familyKey = player.chosenFamily;
      if (familyKey) {
        const familyZoneIds = RIVAL_FAMILIES[familyKey]?.turfZones || [];
        const zones = player.turf._zones || [];
        if (!player.turf.owned) player.turf.owned = [];

        zones.forEach(zone => {
          if (familyZoneIds.includes(zone.id) && !player.turf.owned.includes(zone.id)) {
            zone.controlledBy = 'player';
            zone.defendingMembers = [];
            player.turf.owned.push(zone.id);
            player.turf.reputation = (player.turf.reputation || 0) + 10;
            player.territoryReputation = (player.territoryReputation || 0) + 10;
            logAction(`<strong>${zone.name}</strong> is now under your direct control.`);
          }
        });
        recalcTurfIncome();
        checkTurfMilestoneUnlocks();
        checkTurfDominance();
        showBriefNotification(`All ${RIVAL_FAMILIES[familyKey].name} territory is now yours!`, 'success');
      }
    }
  }

  // Advance chapter
  if (chapterIdx + 1 < fam.chapters.length && !sp.isDon) {
    sp.currentChapter = chapterIdx + 1;
    const nextCh = fam.chapters[sp.currentChapter];
    logAction(`New Chapter: "${nextCh.title}" -- Act ${nextCh.act}: ${nextCh.actTitle}`);
  }

  updateUI();
  showMissions();
}
window.advanceStoryChapter = advanceStoryChapter;


// Mission execution functions
async function startFactionMission(familyKey, missionId) {
  const mission = factionMissions[familyKey].find(m => m.id === missionId);
  if (!mission) return;

  // Check requirements
  if (!hasRequiredItems(mission.requiredItems)) {
    showBriefNotification(`Need: ${mission.requiredItems.join(', ')}`, 'danger');
    return;
  }

  if (player.reputation < mission.reputation) {
    showBriefNotification(`Need ${mission.reputation} respect for this mission!`, 'danger');
    return;
  }

  // Calculate success chance
  let successChance = 60 + (player.power * 0.5) + (player.skillTree.intelligence.quick_study * 2);
  // Chen Triad reputation: intelligence network boosts mission success
  const chenMissionMod = getStreetRepBonus('chen', 0, 0.05, 0.10, 0.15);
  if (chenMissionMod !== 0) successChance += chenMissionMod * 100;
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

    // Rival respect: completing missions for a faction earns their respect
    updateFactionRivalRespect(familyKey, +5);

    logAction(`Mission "${mission.name}" completed for ${crimeFamilies[familyKey].name}! +$${earnings}, +${mission.factionRep} family respect.`);
    logAction(mission.story);

    showBriefNotification(`Mission complete! +$${earnings.toLocaleString()} & respect with ${crimeFamilies[familyKey].name}`, 'success');
    degradeEquipment('faction_mission');
  } else {
    // Mission failed
    if (Math.random() * 100 < mission.jailChance) {
      sendToJail(5, { crimeName: mission.name, riskLevel: 'high' });
      return;
    }

    logAction(`Mission "${mission.name}" failed! The ${crimeFamilies[familyKey].name} is not pleased with your performance.`);
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
    showBriefNotification(`You need 20 respect with ${family.name} to attempt their signature job.`, 'danger');
    return;
  }

  // Cooldown check
  if (!player.missions.signatureJobCooldowns) player.missions.signatureJobCooldowns = {};
  const lastRun = player.missions.signatureJobCooldowns[sigJob.id] || 0;
  const cooldownMs = (sigJob.cooldown || 24) * 60 * 60 * 1000;
  if ((Date.now() - lastRun) < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - (Date.now() - lastRun)) / 60000);
    showBriefNotification(`This signature job is on cooldown. Try again in ${remaining >= 60 ? Math.floor(remaining/60) + 'h ' + (remaining%60) + 'm' : remaining + 'm'}.`, 'warning');
    return;
  }

  // Success chance based on the signature job's type (maps to player skill tree)
  const skillMap = { charisma: player.skillTree.charisma.smooth_talker, violence: player.skillTree.combat.brawler, intelligence: player.skillTree.intelligence.quick_study, stealth: player.skillTree.stealth.shadow_step };
  const relevantSkill = skillMap[sigJob.type] || 0;
  let successChance = 40 + (relevantSkill * 3) + (player.power * 0.15) + (reputation * 0.5);
  successChance = Math.min(successChance, 90);

  if (Math.random() * 100 < successChance) {
    // Success
    const rewardMultiplier = 1 + (reputation / 100); // Higher rep => bigger reward
    const earnings = Math.floor(sigJob.baseReward * rewardMultiplier);
    player.dirtyMoney = (player.dirtyMoney || 0) + earnings;
    gainExperience(4.5);
    player.missions.factionReputation[familyKey] += 5;

    // Kozlov special bonus: random weapon on success
    if (familyKey === 'kozlov') {
      const bonusWeapons = ['Combat Knife', 'Pistol', 'Shotgun'];
      const bonusWeapon = bonusWeapons[Math.floor(Math.random() * bonusWeapons.length)];
      player.inventory.push({ name: bonusWeapon, power: 15 + Math.floor(Math.random() * 20), type: 'weapon' });
      logAction(`Kozlov bonus: You scored a ${bonusWeapon} from the convoy!`);
    }

    logAction(`Signature Job "${sigJob.name}" completed for ${family.name}! +$${earnings.toLocaleString()} (dirty), +4.5 respect, +5 family respect.`);
    flashSuccessScreen();
    showBriefNotification(`Signature job complete! Earned $${earnings.toLocaleString()} and gained standing with ${family.name}.`, 'success');
    degradeEquipment('signature_job');

    updateMissionProgress('reputation_changed');
  } else {
    // Failure
    const jailRoll = Math.random() * 100;
    if (jailRoll < 25) {
      sendToJail(3, { crimeName: sigJob.name, riskLevel: 'very high' });
      logAction(`Signature job "${sigJob.name}" went sideways -- you got pinched!`);
      return;
    }
    logAction(`Signature job "${sigJob.name}" failed. ${family.name} is disappointed but willing to give you another shot.`);
    showBriefNotification(`The ${sigJob.name} didn't go as planned.`, 'danger');
  }

  // Set cooldown regardless of outcome
  player.missions.signatureJobCooldowns[sigJob.id] = Date.now();

  updateUI();
  showMissions();
}

// ==================== GANG MANAGEMENT OVERHAUL ====================

// --- Unified Role System ---
// GANG_MEMBER_ROLES is the canonical role definition (merged from former expanded-systems.js).
// specialistRoles below maps those roles to operation/training mechanics.
// Members store BOTH: .role (expanded key) and .specialization (operations key).
// The mapping keeps them consistent -- no more conflicting role assignments.

const EXPANDED_TO_SPECIALIZATION = {
  bruiser: 'muscle',
  fixer: 'dealer', // Connected, handles dealing/networking ops
  hacker: 'technician', // Tech specialist
  enforcer: 'enforcer',
  driver: 'driver',
  scout: 'thief', // Stealth/surveillance <-' theft ops
  accountant: 'technician' // Numbers/money <-' tech ops
};

const SPECIALIZATION_TO_EXPANDED = {
  muscle: 'bruiser',
  dealer: 'fixer',
  technician: 'hacker',
  enforcer: 'enforcer',
  driver: 'driver',
  thief: 'scout'
};

// ==================== MERGED FROM EXPANDED-SYSTEMS.JS & EXPANDED-UI.JS ====================
// These systems were consolidated from separate files into the main game module.
// Contains: Gang roles/stats/traits, Expanded territory wars, Interactive events,
// Rival AI kingpins, Respect system, and all related UI screens.
// Original files deleted -- this is now the canonical source.

// ==================== CONFIGURATION ====================

const EXPANDED_SYSTEMS_CONFIG = {
    gangRolesEnabled: true,
    territoryWarsEnabled: true,
    interactiveEventsEnabled: false, // Disabled -- popup events removed
    rivalKingpinsEnabled: true,
    // Balance settings
    rivalGrowthInterval: 120000, // 2 minutes between rival actions
    territoryAttackChance: 0.15, // 15% chance of attack per check
};

// ==================== 1. GANG MEMBER ROLES & STATS ====================

const GANG_MEMBER_ROLES = {
    bruiser: {
        name: "Bruiser",
        icon: "\uD83D\uDCAA",
        description: "Muscle for hire. Excels in combat and intimidation.",
        baseStat: { violence: 15, stealth: 5, intelligence: 5 },
        cleanCashTribute: true,
        perk: {
            name: "Enforcer",
            effect: "Reduces arrest chance on violent jobs by 10%"
        }
    },
    fixer: {
        name: "Fixer",
        icon: "\uD83E\uDD1D",
        description: "Smooth talker who knows everyone worth knowing.",
        baseStat: { violence: 5, stealth: 10, intelligence: 15 },
        cleanCashTribute: false,
        perk: {
            name: "Connected",
            effect: "Reduces heat gain by 15%"
        }
    },
    hacker: {
        name: "Hacker",
        icon: "\uD83D\uDCBB",
        description: "Tech wizard specializing in breaking electronic security.",
        baseStat: { violence: 3, stealth: 15, intelligence: 20 },
        cleanCashTribute: false,
        perk: {
            name: "Digital Ghost",
            effect: "+20% success on intelligence-based jobs"
        }
    },
    enforcer: {
        name: "Enforcer",
        icon: "\uD83D\uDD2B",
        description: "Professional killer who handles the wet work.",
        baseStat: { violence: 18, stealth: 12, intelligence: 8 },
        cleanCashTribute: true,
        perk: {
            name: "Assassin",
            effect: "+15% damage in territory wars"
        }
    },
    driver: {
        name: "Wheelman",
        icon: "\uD83D\uDE97",
        description: "Master behind the wheel, perfect for getaways.",
        baseStat: { violence: 8, stealth: 15, intelligence: 10 },
        cleanCashTribute: true,
        perk: {
            name: "Fast & Furious",
            effect: "+25% escape chance when heat is high"
        }
    },
    scout: {
        name: "Scout",
        icon: "\uD83D\uDD75\uFE0F",
        description: "Expert at gathering intelligence on targets.",
        baseStat: { violence: 6, stealth: 18, intelligence: 15 },
        cleanCashTribute: false,
        perk: {
            name: "Eyes Everywhere",
            effect: "Reveals territory attack warnings 30 seconds early"
        }
    },
    accountant: {
        name: "Accountant",
        icon: "\uD83D\uDCB0",
        description: "Numbers genius who maximizes profits.",
        baseStat: { violence: 2, stealth: 10, intelligence: 22 },
        cleanCashTribute: true,
        perk: {
            name: "Money Launderer",
            effect: "+10% income from businesses and territories"
        }
    }
};

// Determine if a gang member pays clean or dirty tribute based on their role/specialization
function memberPaysCleanCash(member) {
  // Check expanded role first
  if (member.role && GANG_MEMBER_ROLES[member.role]) {
    return !!GANG_MEMBER_ROLES[member.role].cleanCashTribute;
  }
  // Fallback: check specialization via the SPECIALIZATION_TO_EXPANDED mapping
  const spec = member.specialization;
  if (spec) {
    const expandedKey = SPECIALIZATION_TO_EXPANDED[spec];
    if (expandedKey && GANG_MEMBER_ROLES[expandedKey]) {
      return !!GANG_MEMBER_ROLES[expandedKey].cleanCashTribute;
    }
    // Direct match on specialization keywords
    const cleanSpecs = ['muscle', 'enforcer', 'driver'];
    return cleanSpecs.includes(spec.toLowerCase());
  }
  return false; // default to dirty
}

// Generate a gang member with role, stats, and traits
function generateExpandedGangMember(role = null, name = null) {
    // If no role specified, pick random weighted by rarity
    if (!role) {
        const roles = Object.keys(GANG_MEMBER_ROLES);
        role = roles[Math.floor(Math.random() * roles.length)];
    }

    const roleData = GANG_MEMBER_ROLES[role];
    const member = {
        id: Date.now() + Math.random(), // Unique ID
        name: name || generateGangMemberName(),
        role: role,
        roleData: roleData,
        stats: {
            violence: roleData.baseStat.violence + Math.floor(Math.random() * 10),
            stealth: roleData.baseStat.stealth + Math.floor(Math.random() * 10),
            intelligence: roleData.baseStat.intelligence + Math.floor(Math.random() * 10)
        },
        perk: roleData.perk,
        level: 1,
        experience: 0,
        status: "active", // active, injured, jailed, dead
        assignedTo: null, // null, "territory_X", "operation_Y"
        traits: generateRandomTraits(),
        joinedDate: Date.now()
    };

    return member;
}

function generateGangMemberName() {
    const firstNames = [
        "Tommy", "Vinnie", "Angelo", "Sal", "Frankie", "Johnny", "Nicky", "Bobby",
        "Maria", "Carmela", "Rosa", "Lucia", "Gina", "Sofia", "Isabella",
        "Viktor", "Dmitri", "Ivan", "Nikolai", "Wei", "Chen", "Lin", "Carlos", "Diego"
    ];

    const lastNames = [
        "Rossi", "Lombardi", "Moretti", "Ricci", "Russo", "Conti",
        "Volkov", "Petrov", "Ivanov", "Chen", "Wu", "Zhang",
        "Martinez", "Rodriguez", "Garcia", "Hernandez"
    ];

    const nicknames = [
        "The Bull", "Two-Fingers", "The Snake", "Ice Pick", "Scarface",
        "Lucky", "The Hammer", "Knuckles", "Lefty", "Ace"
    ];

    const useNickname = Math.random() > 0.7;

    if (useNickname) {
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const nick = nicknames[Math.floor(Math.random() * nicknames.length)];
        return `${first} "${nick}"`;
    } else {
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${first} ${last}`;
    }
}

function generateRandomTraits() {
    const allTraits = [
        { name: "Hothead", effect: "+10% violence" },
        { name: "Cool Under Pressure", effect: "+10% success in high-heat jobs" },
        { name: "Loyal to the End", effect: "Never betrays, +10% morale" },
        { name: "Greedy", effect: "+15% payout demand" },
        { name: "Cautious", effect: "-10% arrest chance, -5% success" },
        { name: "Reckless", effect: "+10% success, +15% arrest chance" },
        { name: "Charming", effect: "+10% respect gains" },
        { name: "Paranoid", effect: "+20% detection of betrayals" },
        { name: "Veteran", effect: "+5 to all stats" },
        { name: "Greenhorn", effect: "-5 to all stats, gains Respect 50% faster" }
    ];

    // 30% chance of having a trait
    if (Math.random() > 0.7) {
        return [allTraits[Math.floor(Math.random() * allTraits.length)]];
    }

    return [];
}

// Calculate gang member effectiveness for a specific task type
function calculateMemberEffectiveness(member, taskType) {
    let baseScore = 0;

    switch(taskType) {
        case "violence":
            baseScore = member.stats.violence * 2 + member.stats.stealth * 0.5;
            break;
        case "stealth":
            baseScore = member.stats.stealth * 2 + member.stats.intelligence * 0.5;
            break;
        case "intelligence":
            baseScore = member.stats.intelligence * 2 + member.stats.stealth * 0.5;
            break;
        case "defense":
            baseScore = (member.stats.violence + member.stats.stealth + member.stats.intelligence) / 2;
            break;
        default:
            baseScore = (member.stats.violence + member.stats.stealth + member.stats.intelligence) / 3;
    }

    // Apply trait modifiers
    member.traits.forEach(trait => {
        if (trait.name === "Veteran") baseScore *= 1.15;
        if (trait.name === "Greenhorn") baseScore *= 0.85;
        if (trait.name === "Reckless" && taskType === "violence") baseScore *= 1.1;
        if (trait.name === "Cautious" && taskType === "stealth") baseScore *= 1.1;
    });

    return Math.floor(baseScore);
}

// ==================== 2. SINGLEPLAYER TURF SYSTEM ====================

// Turf zones -- the SP gang-war map. Each zone starts controlled by a rival family.
// These are DISTINCT from multiplayer territories (multiplayer.js cityDistricts /
// territories.js DISTRICTS which handle online PvP area control).
const TURF_ZONES = [
    {
        id: "little_italy",
        name: "Little Italy",
        icon: '',
        description: "Old-world streets lined with trattorias and back-room card games. The Torrino Family's ancestral stronghold.",
        baseIncome: 4000,
        defenseRequired: 180,
        riskLevel: "high",
        controlledBy: "torrino",
        boss: "torrino_underboss",
        don: "torrino_don",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 2
    },
    {
        id: "redlight_district",
        name: "Redlight District",
        icon: '',
        description: "Neon-soaked blocks of vice parlors, strip clubs, and underground dens. Morales Cartel territory.",
        baseIncome: 5500,
        defenseRequired: 200,
        riskLevel: "high",
        controlledBy: "morales",
        boss: "morales_underboss",
        don: "morales_don",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 2
    },
    {
        id: "chinatown",
        name: "Chinatown",
        icon: '',
        description: "A labyrinth of narrow alleys, tea houses, and hidden parlors. The Chen Triad rules from the shadows.",
        baseIncome: 4500,
        defenseRequired: 190,
        riskLevel: "high",
        controlledBy: "chen",
        boss: "chen_underboss",
        don: "chen_don",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 2
    },
    {
        id: "harbor_row",
        name: "Harbor Row",
        icon: '',
        description: "Fog-cloaked wharves where containers vanish overnight. The Kozlov Bratva's smuggling nerve center.",
        baseIncome: 5000,
        defenseRequired: 210,
        riskLevel: "very high",
        controlledBy: "kozlov",
        boss: "kozlov_underboss",
        don: "kozlov_don",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 3
    },
    {
        id: "the_slums",
        name: "The Slums",
        icon: '',
        description: "Crumbling tenements and burned-out lots. No single family controls it -- gangs fight for every block.",
        baseIncome: 1500,
        defenseRequired: 120,
        riskLevel: "low",
        controlledBy: "contested",
        boss: null,
        don: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    },
    {
        id: "midtown_heights",
        name: "Midtown Heights",
        icon: '',
        description: "Glass towers and penthouse suites. White-collar crime thrives behind boardroom doors.",
        baseIncome: 6000,
        defenseRequired: 250,
        riskLevel: "very high",
        controlledBy: "independent",
        boss: "kane_boss",
        don: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 1
    },
    {
        id: "old_quarter",
        name: "The Old Quarter",
        icon: '',
        description: "Historic cobblestone streets with speakeasies and antique shops hiding contraband.",
        baseIncome: 3000,
        defenseRequired: 140,
        riskLevel: "medium",
        controlledBy: "torrino",
        boss: "torrino_capo",
        don: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 1
    },
    {
        id: "the_sprawl",
        name: "The Sprawl",
        icon: '',
        description: "Endless suburban strip malls and quiet cul-de-sacs. Prescription drugs and suburban rackets.",
        baseIncome: 2500,
        defenseRequired: 120,
        riskLevel: "medium",
        controlledBy: "morales",
        boss: "morales_capo",
        don: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 1
    }
];

// -- Rival Family Definitions (SP Turf) ---
// Each family has a Don (final boss), an Underboss, Capos, and a player buff.
// The player sides with ONE family -- that family's turf is shared, the rest are enemies.
const RIVAL_FAMILIES = {
    torrino: {
        name: "Torrino Family",
        icon: '',
        ethnicity: "Italian",
        color: "#8b0000",
        motto: "Blood is thicker than wine.",
        don: {
            id: "torrino_don", name: "Don Salvatore Torrino",
            power: 300, health: 500, reward: 50000,
            description: "The old lion of Little Italy. Rules with an iron fist wrapped in a velvet glove."
        },
        underboss: {
            id: "torrino_underboss", name: "Vinnie 'The Hammer' Torrino",
            power: 180, health: 300, reward: 25000,
            description: "Salvatore's nephew. Brutal, loyal, and dangerously ambitious."
        },
        capos: [
            { id: "torrino_capo", name: "Carla 'Stiletto' Bianchi", power: 100, health: 200, reward: 10000, zone: "old_quarter" }
        ],
        buff: {
            id: "family_loyalty",
            name: "Omertà",
            description: "+15% income from all turf, -20% heat from jobs",
            incomeMultiplier: 1.15,
            heatReduction: 0.20
        },
        turfZones: ["little_italy", "old_quarter"],
        storyIntro: "The Torrino Family took you in when you had nothing. Don Salvatore sees potential in you -- prove you're worth the family name."
    },
    kozlov: {
        name: "Kozlov Bratva",
        icon: '',
        ethnicity: "Russian",
        color: "#4169e1",
        motto: "Strength is the only law.",
        don: {
            id: "kozlov_don", name: "Dimitri 'The Bear' Kozlov",
            power: 350, health: 550, reward: 55000,
            description: "Ex-Spetsnaz turned crime lord. His word is backed by an arsenal."
        },
        underboss: {
            id: "kozlov_underboss", name: "Nadia Kozlova",
            power: 200, health: 320, reward: 28000,
            description: "Dimitri's daughter. Colder and smarter than her father -- some say more dangerous."
        },
        capos: [],
        buff: {
            id: "bratva_discipline",
            name: "Iron Discipline",
            description: "+25% gang member effectiveness, weapons cost 15% less",
            gangEffectiveness: 1.25,
            weaponDiscount: 0.15
        },
        turfZones: ["harbor_row"],
        storyIntro: "The Bratva respects only strength. Kozlov offered you a seat at his table after you survived a test no one else walked away from."
    },
    chen: {
        name: "Chen Triad",
        icon: '',
        ethnicity: "Chinese",
        color: "#2e8b57",
        motto: "Patience is the sharpest blade.",
        don: {
            id: "chen_don", name: "Master Chen Wei",
            power: 280, health: 400, reward: 48000,
            description: "Ancient traditions, modern empire. Chen Wei plays the long game -- and always wins."
        },
        underboss: {
            id: "chen_underboss", name: "Liang 'Ghost' Zhao",
            power: 190, health: 280, reward: 26000,
            description: "Chen Wei's silent enforcer. You never see him coming."
        },
        capos: [],
        buff: {
            id: "triad_network",
            name: "Shadow Network",
            description: "+30% drug/smuggling income, +20% intel on rival moves",
            smugglingMultiplier: 1.30,
            intelBonus: 0.20
        },
        turfZones: ["chinatown"],
        storyIntro: "The Triad tested your mind before your fists. Master Chen Wei invited you to Chinatown -- not as muscle, but as a strategist."
    },
    morales: {
        name: "Morales Cartel",
        icon: '',
        ethnicity: "South American",
        color: "#ff8c00",
        motto: "Fear is the foundation of empire.",
        don: {
            id: "morales_don", name: "El Jefe Ricardo Morales",
            power: 320, health: 480, reward: 52000,
            description: "Built his empire from the coca fields to the city streets. Ruthless, charismatic, untouchable."
        },
        underboss: {
            id: "morales_underboss", name: "Sofia 'La Reina' Morales",
            power: 210, health: 340, reward: 30000,
            description: "Ricardo's wife. Runs the day-to-day with a smile that hides a killer's instinct."
        },
        capos: [
            { id: "morales_capo", name: "Diego 'El Cuchillo' Vargas", power: 110, health: 210, reward: 12000, zone: "the_sprawl" }
        ],
        buff: {
            id: "cartel_connections",
            name: "Cartel Supply Line",
            description: "Violent jobs generate 25% less heat, +15% territory defense",
            violentHeatReduction: 0.25,
            territoryDefenseBonus: 0.15
        },
        turfZones: ["redlight_district", "the_sprawl"],
        storyIntro: "The Cartel doesn't recruit -- they conscript. But Morales saw a fire in you, and offered a choice: serve willingly, or be buried with the rest."
    }
};

// Independent boss (not tied to a family the player can join)
const INDEPENDENT_BOSSES = {
    kane_boss: {
        id: "kane_boss",
        name: "Marcus 'The Jackal' Kane",
        power: 160, health: 260, reward: 18000,
        zone: "midtown_heights",
        description: "A lone wolf with corporate connections. Plays every family against each other."
    }
};

// Family rank progression
const FAMILY_RANKS = ['associate', 'soldier', 'capo', 'underboss', 'don'];
const FAMILY_RANK_REQUIREMENTS = {
    soldier: { turfOwned: 1, bossesDefeated: 0, reputation: 50 },
    capo: { turfOwned: 3, bossesDefeated: 1, reputation: 150 },
    underboss: { turfOwned: 5, bossesDefeated: 3, reputation: 350 },
    don: { turfOwned: 7, bossesDefeated: 5, reputation: 500, allDonsDefeated: true }
};

// ==================== TURF MILESTONES ====================
// Passive bonuses unlocked at zone-count thresholds.
const TURF_MILESTONES = [
  { zones: 2, label: 'Street Presence', icon: '[+]', description: '+10% respect from all sources', perk: 'rep_boost', value: 0.10 },
  { zones: 4, label: 'Neighbourhood Boss', icon: '[++]', description: 'Heat decays -6 per cycle (perk-exclusive)', perk: 'heat_reduction', value: 0.20 },
  { zones: 6, label: 'District Kingpin', icon: '[+++]', description: '+15% store sell prices & gang recruit quality', perk: 'trade_boost', value: 0.15 },
  { zones: 8, label: 'City Overlord', icon: '[*]', description: 'Exclusive Overlord weapon & +25% turf income', perk: 'overlord', value: 0.25 },
];

// Returns array of milestone objects the player has currently unlocked
function getUnlockedTurfMilestones() {
  const count = (player.turf?.owned || []).length;
  return TURF_MILESTONES.filter(m => count >= m.zones);
}

// Check whether a specific perk is active
function hasTurfPerk(perkId) {
  return getUnlockedTurfMilestones().some(m => m.perk === perkId);
}
window.hasTurfPerk = hasTurfPerk;

// ==================== TURF DOMINANCE REWARDS ====================
// Call after taking a zone to see if the player now owns every zone a family used to hold.
function checkTurfDominance(justTakenZoneId) {
  if (!player.turf.dominanceRewards) player.turf.dominanceRewards = [];

  Object.entries(RIVAL_FAMILIES).forEach(([famKey, fam]) => {
    if (famKey === player.chosenFamily) return; // Skip your own family
    if (player.turf.dominanceRewards.includes(famKey)) return; // Already claimed
    const allOwned = fam.turfZones.every(zId => (player.turf.owned || []).includes(zId));
    if (!allOwned) return;

    // --- Grant reward ---
    player.turf.dominanceRewards.push(famKey);
    const cashReward = 100000;
    const repReward = 50;
    const powerReward = 50;
    player.money += cashReward;
    player.reputation += repReward;
    player.turf.power = (player.turf.power || 100) + powerReward;
    player.turf.reputation = (player.turf.reputation || 0) + 30;
    player.territoryReputation = (player.territoryReputation || 0) + 30;

    showBriefNotification(`DOMINANCE! You control all ${fam.name} territory! +$${cashReward.toLocaleString()}, +${repReward} Respect, +${powerReward} Power`, 'success');
    logAction(`<strong>${fam.name} ELIMINATED.</strong> Every block, every alley -- yours. The streets will remember this. +$${cashReward.toLocaleString()}, +${repReward} Respect, +${powerReward} permanent Turf Power.`);
  });
}

// ==================== TURF MILESTONE NOTIFICATION ====================
// Called after zone count changes; fires a one-time notification per milestone.
function checkTurfMilestoneUnlocks() {
  if (!player.turf.milestonesNotified) player.turf.milestonesNotified = [];
  const count = (player.turf.owned || []).length;
  TURF_MILESTONES.forEach(m => {
    if (count >= m.zones && !player.turf.milestonesNotified.includes(m.perk)) {
      player.turf.milestonesNotified.push(m.perk);
      showBriefNotification(`${m.icon} MILESTONE: ${m.label} -- ${m.description}`, 'success');
      logAction(`<strong>Turf Milestone Unlocked:</strong> ${m.icon} ${m.label} -- ${m.description}`);

      // Grant the Overlord weapon once
      if (m.perk === 'overlord' && !player.inventory.some(i => i.name === 'Overlord\'s Scepter')) {
        const scepter = { name: 'Overlord\'s Scepter', type: 'weapon', power: 60, price: 0, durability: 200, maxDurability: 200, description: 'A golden cane concealing a razor blade. Earned by controlling all 8 turf zones.' };
        player.inventory.push(scepter);
        showBriefNotification(' You received the Overlord\'s Scepter! Equip it for +60 power.', 'success');
        logAction('A golden cane arrives in a velvet case. The <strong>Overlord\'s Scepter</strong> -- proof of total dominion.');
      }
    }
  });
}

// ==================== RIVAL FAMILY AI ====================
// Each rival family (except the player's) is an active AI that grows,
// attacks player-held turf, and tries to reclaim lost territory.

const RIVAL_AI_PERSONALITY = {
  torrino: { aggression: 0.6, growth: 1.0, preference: 'reclaim', label: 'methodical' },
  kozlov:  { aggression: 0.9, growth: 1.2, preference: 'strongest', label: 'aggressive' },
  chen:    { aggression: 0.4, growth: 0.8, preference: 'weakest', label: 'strategic' },
  morales: { aggression: 0.75, growth: 1.1, preference: 'reclaim', label: 'expansionist' }
};

// Initialize rival AI state on player.turf (called once; persists via save)
function initRivalAI() {
  if (!player.turf) initTurfZones();
  if (player.turf.rivalAI) return; // already initialized

  player.turf.rivalAI = {};
  Object.keys(RIVAL_FAMILIES).forEach(famKey => {
    if (famKey === player.chosenFamily) return; // player's family is allied
    const fam = RIVAL_FAMILIES[famKey];
    // Starting power = average of their bosses' power
    const bossPowers = [fam.don.power, fam.underboss.power, ...fam.capos.map(c => c.power)];
    const avgPower = Math.floor(bossPowers.reduce((a, b) => a + b, 0) / bossPowers.length);
    player.turf.rivalAI[famKey] = {
      power: avgPower,
      maxPower: Math.floor(avgPower * 2.5),
      morale: 100,           // 0-100, drops when they lose zones
      lastAttackTime: 0,
      zonesLostToPlayer: 0,  // tracks how many zones player took from them
      eliminated: false,      // true after player completes elimination mission
      atWar: false,           // true when player takes turf from this family
      warDeclaredTime: 0,     // timestamp when war was declared
      lastWarAttackTime: 0,   // timestamp of last hourly war attack check
      eliminationAvailable: false // true when all zones taken, awaiting elimination mission
    };
  });
}

// Get the 3 active rival family keys (excludes player's family)
function getActiveRivals() {
  if (!player.turf.rivalAI) initRivalAI();
  return Object.keys(player.turf.rivalAI).filter(k => !player.turf.rivalAI[k].eliminated);
}

// Rival AI grows stronger each cycle (simulates them running their own operations)
function rivalAIGrowth() {
  if (!player.turf.rivalAI) initRivalAI();
  const rivals = getActiveRivals();
  rivals.forEach(famKey => {
    const ai = player.turf.rivalAI[famKey];
    // Migrate old saves: add war fields if missing
    if (ai.atWar === undefined) { ai.atWar = false; ai.warDeclaredTime = 0; ai.lastWarAttackTime = 0; ai.eliminationAvailable = false; }
    const personality = RIVAL_AI_PERSONALITY[famKey];
    // Count how many zones this family still controls
    const familyZones = (player.turf._zones || []).filter(z => z.controlledBy === famKey);
    const zonesHeld = familyZones.length;
    // Growth: power increases each cycle based on zones held and personality
    const growthAmount = Math.floor((5 + zonesHeld * 8) * personality.growth);
    ai.power = Math.min(ai.maxPower, ai.power + growthAmount);
    // Morale recovery: slowly recovers if they hold zones
    if (zonesHeld > 0 && ai.morale < 100) {
      ai.morale = Math.min(100, ai.morale + 3 + zonesHeld * 2);
    }

    // FORTIFICATION: rivals invest in zone defenses as they grow stronger
    // Stronger families fortify faster; each zone gets harder to take over time
    familyZones.forEach(zone => {
      const baseDef = zone.baseDefenseRequired || zone.defenseRequired;
      // Cap at 2.5x the original defense
      const maxDef = Math.floor(baseDef * 2.5);
      if (zone.defenseRequired >= maxDef) return;
      // Fortification rate scales with personality growth and family power
      const powerRatio = ai.power / ai.maxPower; // 0-1, stronger = faster fortify
      const fortifyAmount = Math.floor((3 + Math.ceil(powerRatio * 8)) * personality.growth);
      zone.defenseRequired = Math.min(maxDef, zone.defenseRequired + fortifyAmount);
    });
  });
}

// Rival AI picks which zone to attack based on personality
function rivalAIPickTarget(famKey) {
  const personality = RIVAL_AI_PERSONALITY[famKey];
  const owned = player.turf.owned || [];
  if (owned.length === 0) return null;
  const fam = RIVAL_FAMILIES[famKey];

  // Priority 1: Reclaim their original turf zones that player took
  if (personality.preference === 'reclaim' || Math.random() < 0.5) {
    const reclaimTargets = owned.filter(zId => (fam.turfZones || []).includes(zId));
    if (reclaimTargets.length > 0) {
      return reclaimTargets[Math.floor(Math.random() * reclaimTargets.length)];
    }
  }

  // Priority 2: Based on personality
  if (personality.preference === 'weakest') {
    // Attack the player's least-defended zone
    let weakest = null;
    let lowestDef = Infinity;
    owned.forEach(zId => {
      const zone = (player.turf._zones || []).find(z => z.id === zId);
      if (zone) {
        const def = calculateTurfDefense(zone, player);
        if (def < lowestDef) { lowestDef = def; weakest = zId; }
      }
    });
    return weakest;
  } else if (personality.preference === 'strongest') {
    // Kozlov goes for the biggest prize
    let best = null;
    let highestIncome = 0;
    owned.forEach(zId => {
      const zone = (player.turf._zones || []).find(z => z.id === zId);
      if (zone && zone.baseIncome > highestIncome) {
        highestIncome = zone.baseIncome;
        best = zId;
      }
    });
    return best;
  }

  // Fallback: random owned zone
  return owned[Math.floor(Math.random() * owned.length)];
}

// Main rival AI attack cycle -- replaces the old generic "Rival Gang" attacks
function processRivalFamilyAttacks() {
  if (!player.chosenFamily) return;
  if (!player.turf.rivalAI) initRivalAI();

  const owned = player.turf.owned || [];
  if (owned.length === 0) return;

  const escalationTier = Math.min(owned.length, 8);
  const hasChenIntel = player.chosenFamily === 'chen';
  const chenIntelChance = hasChenIntel ? (getChosenFamilyBuff()?.intelBonus || 0.20) : 0;
  const now = Date.now();

  const rivals = getActiveRivals();
  rivals.forEach(famKey => {
    const ai = player.turf.rivalAI[famKey];
    const personality = RIVAL_AI_PERSONALITY[famKey];
    const fam = RIVAL_FAMILIES[famKey];

    // WAR STATE: families at war get a 45% attack chance every hour
    let warAttackTriggered = false;
    if (ai.atWar && !ai.eliminationAvailable) {
      const hourMs = 3600000;
      if (now - (ai.lastWarAttackTime || 0) >= hourMs) {
        ai.lastWarAttackTime = now;
        if (Math.random() < 0.45) {
          warAttackTriggered = true;
        }
      }
    }

    // Normal attack chance: based on aggression + escalation + morale
    const moraleFactor = ai.morale / 100;
    const attackChance = (0.05 + escalationTier * 0.02) * personality.aggression * moraleFactor;
    const normalAttack = Math.random() < attackChance;

    if (!warAttackTriggered && !normalAttack) return; // no attack this cycle

    // Pick target zone
    const targetZoneId = rivalAIPickTarget(famKey);
    if (!targetZoneId) return;

    const zone = (player.turf._zones || []).find(z => z.id === targetZoneId);
    if (!zone) return;

    // Chen Triad intel: chance to intercept
    if (hasChenIntel && Math.random() < chenIntelChance) {
      logAction(`Your Triad informants intercepted a <strong style="color:${fam.color}">${fam.name}</strong> ${ai.atWar ? 'war' : ''} attack on <strong>${zone.name}</strong> before it began!`);
      showBriefNotification(`${fam.name} attack on ${zone.name} foiled! Intel intercepted.`, 'success');
      return;
    }

    // War attacks are stronger
    const warBonus = warAttackTriggered ? 1.3 : 1.0;
    const variance = Math.floor(Math.random() * 40) - 20;
    const attackStrength = Math.floor(ai.power * moraleFactor * warBonus) + escalationTier * 10 + variance;

    const result = processTurfAttack(zone, famKey, attackStrength, player);
    ai.lastAttackTime = now;

    const warTag = ai.atWar ? ' <span style="color:#e74c3c;">[WAR]</span>' : '';

    if (result.lostTurf) {
      // The family reclaims the zone
      zone.controlledBy = famKey;
      ai.morale = Math.min(100, ai.morale + 15);
      // If they were cornered with eliminationAvailable, retaking a zone cancels it
      if (ai.eliminationAvailable) {
        ai.eliminationAvailable = false;
        logAction(`<strong style="color:${fam.color}">${fam.name}</strong> recaptured territory -- elimination mission cancelled!`);
      }
      logAction(`<strong style="color:${fam.color}">${fam.name}</strong> seized <strong>${zone.name}</strong>!${warTag} Their ${personality.label} assault overwhelmed your defenses.`);
      showBriefNotification(`${fam.name} took ${zone.name}!${ai.atWar ? ' [WAR]' : ''}`, 'danger');
    } else {
      // Failed attack weakens them
      ai.power = Math.max(30, ai.power - 10);
      ai.morale = Math.max(10, ai.morale - 5);
      logAction(`Defended <strong>${zone.name}</strong> from <strong style="color:${fam.color}">${fam.name}</strong> attack!${warTag} (power: ${attackStrength})`);
    }
  });
}

// Called when player takes a zone from a rival family -- triggers war and checks for elimination mission
function onPlayerTookZone(zoneId, previousOwner) {
  if (!player.turf.rivalAI) return;
  const ai = player.turf.rivalAI[previousOwner];
  if (!ai || ai.eliminated) return;
  ai.morale = Math.max(0, ai.morale - 20);
  ai.zonesLostToPlayer++;

  const fam = RIVAL_FAMILIES[previousOwner];
  if (!fam) return;

  // DECLARE WAR: taking turf from a family is an act of war
  if (!ai.atWar) {
    ai.atWar = true;
    ai.warDeclaredTime = Date.now();
    ai.lastWarAttackTime = Date.now(); // grace period -- first hourly check starts in 1 hour
    logAction(`<strong style="color:${fam.color}">${fam.name} has declared WAR!</strong> Expect relentless attacks on your territory.`);
    showBriefNotification(`${fam.name} declares WAR!`, 'danger');
  }

  // Check if all zones taken from this family -- trigger elimination mission
  const familyZonesRemaining = (player.turf._zones || []).filter(z => z.controlledBy === previousOwner).length;
  if (familyZonesRemaining === 0 && !ai.eliminationAvailable) {
    ai.eliminationAvailable = true;
    logAction(`<strong style="color:${fam.color}">${fam.name}</strong> has lost all territory! A final elimination mission is now available.`);
    showBriefNotification(`${fam.name} cornered -- Elimination mission available!`, 'success');
    // Show the elimination mission popup
    showEliminationMission(previousOwner);
  }
}

// Show the elimination mission popup for a cornered rival family
function showEliminationMission(famKey) {
  const fam = RIVAL_FAMILIES[famKey];
  const ai = player.turf.rivalAI[famKey];
  if (!fam || !ai) return;

  const donName = fam.don.name;
  const donPower = fam.don.power;
  const underbossName = fam.underboss.name;
  const underbossPower = fam.underboss.power;
  const capoNames = fam.capos.map(c => c.name).join(', ');
  const totalEnemyPower = donPower + underbossPower + fam.capos.reduce((s, c) => s + c.power, 0);

  const missionHTML = `
    <div style="text-align:center; margin-bottom:15px;">
      <div style="font-size:1.4em; color:${fam.color}; font-weight:bold; margin-bottom:8px;">${fam.name}</div>
      <div style="color:#e74c3c; font-size:1.1em; font-weight:bold;">ELIMINATION MISSION</div>
    </div>
    <div style="color:#d4c4a0; line-height:1.6; margin-bottom:15px;">
      ${fam.name} has been stripped of all territory. Their leadership is cornered and desperate.
      To end this war permanently, you must strike at their command structure -- eliminate their
      capos, their underboss, and finally their Don, <strong style="color:${fam.color}">${donName}</strong>.
    </div>
    <div style="background:rgba(139,58,58,0.2); padding:12px; border-radius:8px; margin-bottom:15px; border-left:3px solid ${fam.color};">
      <div style="color:#c0a062; font-weight:bold; margin-bottom:8px;">Mission Targets:</div>
      <div style="color:#d4c4a0; font-size:0.9em;">
        Phase 1 -- Capos: <strong>${capoNames}</strong><br>
        Phase 2 -- Underboss: <strong>${underbossName}</strong> (Power: ${underbossPower})<br>
        Phase 3 -- Don: <strong style="color:${fam.color}">${donName}</strong> (Power: ${donPower})<br>
        <div style="margin-top:6px; color:#e67e22;">Combined Enemy Strength: ${totalEnemyPower}</div>
      </div>
    </div>
    <div style="color:#8a7a5a; font-size:0.85em;">
      Warning: If ${fam.name} retakes any territory before you complete this mission, the operation will be called off.
    </div>`;

  ui.show('Elimination Mission', missionHTML, [
    {
      text: 'Launch Assault',
      class: 'modal-btn-primary',
      callback: () => { executeEliminationMission(famKey); return true; }
    },
    {
      text: 'Not Yet',
      class: 'modal-btn-secondary',
      callback: () => true
    }
  ]);
}
window.showEliminationMission = showEliminationMission;

// Execute the multi-phase elimination mission against a cornered rival family
function executeEliminationMission(famKey) {
  const fam = RIVAL_FAMILIES[famKey];
  const ai = player.turf.rivalAI[famKey];
  if (!fam || !ai) return;

  // Check elimination is still available (family might have retaken turf)
  if (!ai.eliminationAvailable) {
    showBriefNotification(`${fam.name} retook territory -- mission cancelled!`, 'danger');
    return;
  }

  const attackPower = typeof calculateTurfAttackPower === 'function' ? calculateTurfAttackPower() : (player.turf.power || 100);
  let totalDamage = 0;
  let battleLog = [];
  let missionSuccess = true;

  // Phase 1: Fight the capos
  for (const capo of fam.capos) {
    const capoStrength = capo.power + Math.floor(Math.random() * 30) - 15;
    const playerRoll = attackPower + Math.floor(Math.random() * 40) - 20;
    if (playerRoll > capoStrength) {
      battleLog.push(`<span style="color:#8a9a6a;">Eliminated Capo ${capo.name} (Power: ${capo.power})</span>`);
    } else {
      const dmg = Math.floor(Math.random() * 15) + 10;
      totalDamage += dmg;
      battleLog.push(`<span style="color:#e74c3c;">Capo ${capo.name} fought back fiercely! -${dmg} HP</span>`);
      // Capo fight failure isn't mission-ending, but costs health
    }
  }

  // Phase 2: Fight the underboss
  const ubStrength = fam.underboss.power + Math.floor(Math.random() * 40) - 20;
  const ubPlayerRoll = attackPower + Math.floor(Math.random() * 50) - 25;
  if (ubPlayerRoll > ubStrength) {
    battleLog.push(`<span style="color:#8a9a6a;">Eliminated Underboss ${fam.underboss.name} (Power: ${fam.underboss.power})</span>`);
  } else {
    const dmg = Math.floor(Math.random() * 20) + 15;
    totalDamage += dmg;
    battleLog.push(`<span style="color:#e67e22;">Underboss ${fam.underboss.name} dealt heavy damage! -${dmg} HP</span>`);
    // Check if player can survive to face the don
    if (player.health - totalDamage <= 0) {
      missionSuccess = false;
    }
  }

  // Phase 3: Fight the Don (only if still standing)
  if (missionSuccess) {
    const donStrength = fam.don.power + Math.floor(Math.random() * 50) - 25;
    // Player is weakened by accumulated damage
    const wornDown = Math.max(attackPower * 0.6, attackPower - totalDamage);
    const donPlayerRoll = wornDown + Math.floor(Math.random() * 60) - 30;
    if (donPlayerRoll > donStrength) {
      battleLog.push(`<span style="color:#c0a062; font-weight:bold;">DON ${fam.don.name} ELIMINATED!</span>`);
    } else {
      const dmg = Math.floor(Math.random() * 25) + 20;
      totalDamage += dmg;
      battleLog.push(`<span style="color:#e74c3c; font-weight:bold;">Don ${fam.don.name} overpowered you! -${dmg} HP</span>`);
      missionSuccess = false;
    }
  }

  // Apply damage
  player.health = Math.max(0, player.health - totalDamage);

  // Check for death before showing results
  if (player.health <= 0) {
    showDeathScreen(`Killed in the assault on ${fam.name}`);
    return;
  }

  // Process gang casualties from the mission
  const { casualties, injured } = processTurfAttackCasualties(missionSuccess, player.gang?.gangMembers || [], `${fam.name} Elimination`);

  if (missionSuccess) {
    // Eliminate the family
    ai.eliminated = true;
    ai.atWar = false;
    ai.eliminationAvailable = false;
    ai.morale = 0;

    // Mark don as defeated if not already
    if (!player.turf.donsDefeated) player.turf.donsDefeated = [];
    if (!player.turf.donsDefeated.includes(fam.don.id)) {
      player.turf.donsDefeated.push(fam.don.id);
    }
    // Mark underboss and capos as defeated bosses too
    if (!player.turf.bossesDefeated) player.turf.bossesDefeated = [];
    [fam.underboss, ...fam.capos].forEach(b => {
      if (!player.turf.bossesDefeated.includes(b.id)) player.turf.bossesDefeated.push(b.id);
    });

    // Rewards
    const cashReward = 50000 + Math.floor(Math.random() * 50000);
    const repReward = 50;
    player.money += cashReward;
    player.turf.reputation = (player.turf.reputation || 0) + repReward;
    player.territoryReputation = (player.territoryReputation || 0) + repReward;

    let resultHTML = `
      <div style="text-align:center; margin-bottom:12px;">
        <div style="font-size:1.3em; color:#8a9a6a; font-weight:bold;">MISSION COMPLETE</div>
        <div style="color:${fam.color}; font-size:1.1em;">${fam.name} Eliminated</div>
      </div>
      <div style="border-left:3px solid ${fam.color}; padding:10px; margin-bottom:12px; background:rgba(0,0,0,0.3); border-radius:4px;">
        ${battleLog.join('<br>')}
      </div>
      <div style="color:#d4c4a0;">
        Rewards: <span style="color:#8a9a6a;">+$${cashReward.toLocaleString()}</span> | <span style="color:#c0a062;">+${repReward} Reputation</span><br>
        Damage Taken: <span style="color:#e67e22;">${totalDamage} HP</span>
        ${casualties.length ? `<br>Lost: <span style="color:#e74c3c;">${casualties.join(', ')}</span>` : ''}
        ${injured.length ? `<br>Injured: <span style="color:#e67e22;">${injured.join(', ')}</span>` : ''}
      </div>
      <div style="margin-top:10px; color:#8a7a5a; font-size:0.9em;">
        ${fam.name} is no more. Their territory, soldiers, and operations have been absorbed. The streets remember.
      </div>`;

    ui.show(`${fam.name} Destroyed`, resultHTML);
    logAction(`<strong style="color:${fam.color}">${fam.name} has been ELIMINATED!</strong> Their empire is yours.`);
    showBriefNotification(`${fam.name} ELIMINATED!`, 'success');
  } else {
    // Mission failed
    ai.morale = Math.min(100, ai.morale + 25); // surviving boosts their morale
    ai.power = Math.min(ai.maxPower, ai.power + 30); // they regroup

    let failHTML = `
      <div style="text-align:center; margin-bottom:12px;">
        <div style="font-size:1.3em; color:#e74c3c; font-weight:bold;">MISSION FAILED</div>
        <div style="color:${fam.color}; font-size:1.1em;">${fam.name} Survives</div>
      </div>
      <div style="border-left:3px solid #e74c3c; padding:10px; margin-bottom:12px; background:rgba(0,0,0,0.3); border-radius:4px;">
        ${battleLog.join('<br>')}
      </div>
      <div style="color:#d4c4a0;">
        Damage Taken: <span style="color:#e74c3c;">${totalDamage} HP</span>
        ${casualties.length ? `<br>Lost: <span style="color:#e74c3c;">${casualties.join(', ')}</span>` : ''}
        ${injured.length ? `<br>Injured: <span style="color:#e67e22;">${injured.join(', ')}</span>` : ''}
      </div>
      <div style="margin-top:10px; color:#8a7a5a; font-size:0.9em;">
        ${fam.name}'s leadership survived the assault. They remain a threat. Regroup and try again while they still hold no territory.
      </div>`;

    ui.show('Assault Failed', failHTML);
    logAction(`<strong style="color:${fam.color}">Failed to eliminate ${fam.name}!</strong> Their leadership escaped. They will regroup.`);
    showBriefNotification(`${fam.name} elimination failed!`, 'danger');
  }

  updateUI();
  if (typeof showTurfMap === 'function') showTurfMap();
}
window.executeEliminationMission = executeEliminationMission;

// Assign gang members to defend a turf zone
function assignMembersToTurf(zoneId, memberIds, player) {
    const zone = getTurfZone(zoneId);
    if (!zone) return { success: false, message: "Turf zone not found" };

    // Remove members from their current assignments
    memberIds.forEach(memberId => {
        const member = player.gang.gangMembers.find(m => m.id === memberId);
        if (member && member.assignedTo) {
            const oldZone = getTurfZone(member.assignedTo);
            if (oldZone) {
                oldZone.defendingMembers = oldZone.defendingMembers.filter(id => id !== memberId);
            }
        }
        if (member) {
            member.assignedTo = zoneId;
        }
    });

    zone.defendingMembers = memberIds;
    const defenseStrength = calculateTurfDefense(zone, player);

    return {
        success: true,
        message: `Assigned ${memberIds.length} members to ${zone.name}`,
        defenseStrength: defenseStrength
    };
}

// Helper: look up a turf zone from the player's copy or the template
function getTurfZone(zoneId) {
    // Prefer player's live copy if it exists
    if (player.turf && player.turf._zones) {
        const z = player.turf._zones.find(t => t.id === zoneId);
        if (z) return z;
    }
    return TURF_ZONES.find(t => t.id === zoneId);
}

// Initialise the player's turf zone state (deep clone of TURF_ZONES)
function initTurfZones() {
    if (!player.turf) {
        player.turf = { owned: [], bossesDefeated: [], donsDefeated: [], income: 0, power: 100, reputation: 0, events: [], fortifications: {}, lastTributeCollection: 0 };
    }
    if (!player.turf._zones) {
        player.turf._zones = JSON.parse(JSON.stringify(TURF_ZONES));
    }
    // Store original defense values so rival fortification can be capped
    player.turf._zones.forEach(z => {
        if (z.baseDefenseRequired === undefined) z.baseDefenseRequired = z.defenseRequired;
    });
}

// Calculate total defense strength of a turf zone
// Now includes fortification from player.turf.fortifications AND player turf-power scaling.
function calculateTurfDefense(zone, player) {
    // Use the per-zone fortification the player upgrades (fortifyTurf) -- stored in player.turf.fortifications
    const fortLevel = (player.turf?.fortifications || {})[zone.id] || zone.fortificationLevel || 0;
    let totalDefense = fortLevel * 25; // Each fort level = 25 defense (was 10)

    // Gang members assigned to defend
    (zone.defendingMembers || []).forEach(memberId => {
        const member = (player.gang?.gangMembers || []).find(m => m.id === memberId);
        if (member && member.status === "active") {
            totalDefense += calculateMemberEffectiveness(member, "defense");
            if (member.role === "enforcer") totalDefense *= 1.15;
            if (member.role === "bruiser") totalDefense *= 1.10;
            if (member.role === "scout") totalDefense *= 1.05;
        }
    });

    // Power scaling: 10% of the player's turf power is added as passive defense to every zone
    const powerBonus = Math.floor((player.turf?.power || 100) * 0.10);
    totalDefense += powerBonus;

    // Turf reputation bonus: up to +20% defense at 100 reputation
    const turfRepDef = (player.turf && player.turf.reputation) || 0;
    if (turfRepDef > 0) {
      totalDefense = Math.floor(totalDefense * (1 + Math.min(turfRepDef, 100) * 0.002));
    }

    // Torrino Family reputation: high standing grants territorial protection
    const torrinoDefMod = getStreetRepBonus('torrino', 0, 0, 0.10, 0.20);
    if (torrinoDefMod !== 0) {
      totalDefense = Math.floor(totalDefense * (1 + torrinoDefMod));
    }

    // Morales Cartel Supply Line: +15% territory defense for chosen family
    const defBuff = getChosenFamilyBuff();
    if (defBuff && defBuff.territoryDefenseBonus) {
      totalDefense = Math.floor(totalDefense * (1 + defBuff.territoryDefenseBonus));
    }

    return Math.floor(totalDefense);
}

// Get the family buff for the player's chosen family
function getChosenFamilyBuff() {
    if (!player.chosenFamily) return null;
    const fam = RIVAL_FAMILIES[player.chosenFamily];
    return fam ? fam.buff : null;
}

// Check and auto-promote the player's family rank (only fires post-story to avoid conflicting with chapter rank assignments)
function checkFamilyRankUp() {
    if (!player.chosenFamily) return;
    // During the story, ranks are assigned by chapter completion (rankOnComplete) -- skip auto-promote
    if (player.storyProgress && !player.storyProgress.isDon) return;
    const currentIdx = FAMILY_RANKS.indexOf(player.familyRank || 'associate');
    const nextRank = FAMILY_RANKS[currentIdx + 1];
    if (!nextRank) return; // Already Don
    const req = FAMILY_RANK_REQUIREMENTS[nextRank];
    if (!req) return;
    const t = player.turf || {};
    const meetsOwned = (t.owned || []).length >= req.turfOwned;
    const meetsKills = (t.bossesDefeated || []).length >= req.bossesDefeated;
    const meetsLevel = (player.reputation || 0) >= req.reputation;
    const meetsDons = req.allDonsDefeated
        ? Object.keys(RIVAL_FAMILIES).every(fk => fk === player.chosenFamily || (t.donsDefeated || []).includes(RIVAL_FAMILIES[fk].don.id))
        : true;
    if (meetsOwned && meetsKills && meetsLevel && meetsDons) {
        player.familyRank = nextRank;
        logAction(`You've been promoted to <strong>${nextRank.charAt(0).toUpperCase() + nextRank.slice(1)}</strong> of the ${RIVAL_FAMILIES[player.chosenFamily].name}!`);
        if (nextRank === 'don') {
            logAction(`You are now the <strong>Don</strong>. The city bows to your will.`);
        }
    }
}

// Process a turf zone attack (NPC rival attacks player-owned turf)
function processTurfAttack(zone, attackerName, attackStrength, player) {
    const defenseStrength = calculateTurfDefense(zone, player);
    const attackSuccess = attackStrength > defenseStrength;

    const result = {
        success: !attackSuccess,
        zone: zone.name,
        attacker: attackerName,
        attackStrength, defenseStrength,
        casualties: [], injuredDefenders: [],
        lostTurf: false, rewards: {}
    };

    if (attackSuccess) {
        result.lostTurf = true;
        zone.controlledBy = attackerName;
        // Remove from player owned list
        if (player.turf) {
            player.turf.owned = (player.turf.owned || []).filter(id => id !== zone.id);
        }

        (zone.defendingMembers || []).forEach(memberId => {
            const member = player.gang.gangMembers.find(m => m.id === memberId);
            if (!member) return;
            const roll = Math.random();
            if (roll < 0.25) { member.status = "dead"; result.casualties.push(member.name); }
            else if (roll < 0.40) { member.status = "jailed"; result.casualties.push(member.name + " (arrested)"); }
            else if (roll < 0.65) { member.status = "injured"; result.injuredDefenders.push(member.name); setTimeout(() => { if (member.status === "injured") member.status = "active"; }, 300000); }
        });
        zone.defendingMembers = [];
    } else {
        result.rewards.money = Math.floor(zone.baseIncome * 0.5);
        result.rewards.respect = Math.floor(zone.baseIncome / 100);
        (zone.defendingMembers || []).forEach(memberId => {
            const member = player.gang.gangMembers.find(m => m.id === memberId);

        });
        if (Math.random() < 0.25 && zone.defendingMembers.length > 0) {
            const rand = player.gang.gangMembers.find(m => m.id === zone.defendingMembers[Math.floor(Math.random() * zone.defendingMembers.length)]);
            if (rand) {
                if (Math.random() < 0.3) { rand.status = "dead"; result.casualties.push(rand.name); }
                else { rand.status = "injured"; result.injuredDefenders.push(rand.name); setTimeout(() => { if (rand.status === "injured") rand.status = "active"; }, 300000); }
            }
        }
    }
    // Remove dead members from the gang roster
    player.gang.gangMembers = player.gang.gangMembers.filter(m => m.status !== 'dead');
    player.gang.members = player.gang.gangMembers.length;
    zone.lastAttacked = Date.now();
    return result;
}

// ==================== 3. INTERACTIVE RANDOM EVENTS ====================

const INTERACTIVE_EVENTS = [
    {
        id: "police_raid",
        title: " Police Raid!",
        description: "The cops just kicked in the door of one of your operations! They're looking for evidence.",
        choices: [
            {
                text: "Fight them off",
                requirements: { gangMembers: 3, violence: 10 },
                outcomes: {
                    success: {
                        money: 0,
                        heat: 30,
                        respect: 15,
                        message: "Your crew fought like hell. The cops retreated, but they'll be back with reinforcements."
                    },
                    failure: {
                        money: -5000,
                        heat: 50,
                        respect: -10,
                        jailChance: 40,
                        message: "The shootout went badly. Several of your guys are in cuffs, and the feds are pissed."
                    }
                },
                successChance: 0.6
            },
            {
                text: "Bribe them ($10,000)",
                requirements: { money: 10000 },
                outcomes: {
                    success: {
                        money: -10000,
                        heat: -20,
                        respect: 5,
                        message: "The cops took the money and conveniently 'lost' the evidence. Crisis averted."
                    }
                },
                successChance: 0.85
            },
            {
                text: "Lay low and cooperate",
                requirements: {},
                outcomes: {
                    success: {
                        money: -2000,
                        heat: 10,
                        respect: -5,
                        message: "They roughed up the place and took some cash, but found nothing solid. You live to fight another day."
                    }
                },
                successChance: 1.0
            }
        ]
    },
    {
        id: "betrayal_rumor",
        title: " Whispers of Betrayal",
        description: "Word on the street is that one of your crew might be talking to the feds.",
        choices: [
            {
                text: "Investigate quietly",
                requirements: { intelligence: 15 },
                outcomes: {
                    success: {
                        message: "Your investigation revealed the rat. You handled it... permanently. The crew respects your vigilance.",
                        respect: 10,
                        gangMemberLoss: 1
                    },
                    failure: {
                        message: "You found nothing. Maybe it was just paranoia... or maybe the rat is still among you."
                    }
                },
                successChance: 0.7
            },
            {
                text: "Ignore the rumors",
                requirements: {},
                outcomes: {
                    success: {
                        message: "Sometimes rumors are just rumors. The crew appreciates that you trust them."
                    },
                    failure: {
                        message: "Turns out the rumors were true. One of your guys flipped. The feds now have intel on your operations.",
                        heat: 40,
                        respect: -15,
                        gangMemberLoss: 1
                    }
                },
                successChance: 0.5
            },
            {
                text: "Make an example (kill a random member)",
                requirements: { gangMembers: 2 },
                outcomes: {
                    success: {
                        message: "You whacked someone at random as a warning. The message was received loud and clear.",
                        respect: 15,
                        heat: 20,
                        gangMemberLoss: 1
                    }
                },
                successChance: 1.0
            }
        ]
    },
    {
        id: "rival_scandal",
        title: " Rival Boss Scandal",
        description: "A rival crime boss just got caught in a compromising situation. The tabloids are having a field day.",
        choices: [
            {
                text: "Blackmail them ($15,000 payout)",
                requirements: { intelligence: 12 },
                outcomes: {
                    success: {
                        money: 15000,
                        respect: 5,
                        factionRespect: { target: "rival", change: -20 },
                        message: "They paid up to keep it quiet. Easy money."
                    },
                    failure: {
                        respect: -10,
                        factionRespect: { target: "rival", change: -30 },
                        message: "They called your bluff. Now they're gunning for you."
                    }
                },
                successChance: 0.75
            },
            {
                text: "Help cover it up",
                requirements: { money: 5000 },
                outcomes: {
                    success: {
                        money: -5000,
                        factionRespect: { target: "rival", change: 40 },
                        message: "You helped them out of a jam. They owe you one now."
                    }
                },
                successChance: 0.9
            },
            {
                text: "Leak it to the press",
                requirements: {},
                outcomes: {
                    success: {
                        respect: 10,
                        factionRespect: { target: "rival", change: -40 },
                        territoryVulnerable: "rival", // Their territories become easier to capture
                        message: "The scandal destroyed their reputation. Their operations are in chaos."
                    }
                },
                successChance: 1.0
            }
        ]
    },
    {
        id: "arms_deal",
        title: " Black Market Arms Deal",
        description: "A weapons smuggler has a shipment of military-grade hardware. First come, first served.",
        choices: [
            {
                text: "Buy the whole shipment ($25,000)",
                requirements: { money: 25000 },
                outcomes: {
                    success: {
                        money: -25000,
                        power: 50,
                        inventory: ["Military Rifles", "Body Armor", "Explosives"],
                        message: "Your crew is now heavily armed. The streets will fear you."
                    }
                },
                successChance: 1.0
            },
            {
                text: "Hijack the shipment",
                requirements: { gangMembers: 4, violence: 15 },
                outcomes: {
                    success: {
                        power: 50,
                        heat: 35,
                        inventory: ["Military Rifles", "Body Armor", "Explosives"],
                        message: "You took the weapons by force. The smuggler won't forget this."
                    },
                    failure: {
                        health: -30,
                        heat: 20,
                        gangMemberLoss: 2,
                        message: "The ambush failed. Your crew took heavy casualties."
                    }
                },
                successChance: 0.65
            },
            {
                text: "Pass on the deal",
                requirements: {},
                outcomes: {
                    success: {
                        message: "Sometimes discretion is the better part of valor. You let this one slide."
                    }
                },
                successChance: 1.0
            }
        ]
    },
    {
        id: "witness_problem",
        title: " Witness to Eliminate",
        description: "Someone saw your crew during that last job. They're set to testify in three days.",
        choices: [
            {
                text: "Send a hitter",
                requirements: { gangMembers: 1, violence: 10 },
                outcomes: {
                    success: {
                        heat: 30,
                        respect: 10,
                        message: "The witness had an unfortunate accident. Case closed."
                    },
                    failure: {
                        heat: 60,
                        respect: -15,
                        jailChance: 30,
                        message: "The hit went sideways. Now you're wanted for attempted murder too."
                    }
                },
                successChance: 0.7
            },
            {
                text: "Intimidate them ($5,000 + threats)",
                requirements: { money: 5000, charisma: 10 },
                outcomes: {
                    success: {
                        money: -5000,
                        heat: 10,
                        message: "They got the message and suddenly developed amnesia. No testimony."
                    },
                    failure: {
                        money: -5000,
                        heat: 40,
                        message: "They took the money and still testified. Now you're in deeper trouble."
                    }
                },
                successChance: 0.8
            },
            {
                text: "Relocate them (pay them off: $20,000)",
                requirements: { money: 20000 },
                outcomes: {
                    success: {
                        money: -20000,
                        heat: -10,
                        message: "You gave them enough cash to disappear. Problem solved peacefully."
                    }
                },
                successChance: 0.95
            }
        ]
    }
];

// Trigger an interactive event
function triggerInteractiveEvent(player) {
    // Classic random events only -- Street Stories are now quest-linked (v1.9)
    const allEvents = [...INTERACTIVE_EVENTS];

    // Filter events based on player status
    const availableEvents = allEvents.filter(event => {
        // Don't repeat recently triggered events
        const recentlyTriggered = (player.interactiveEvents?.eventsTriggered || []);
        const lastFive = recentlyTriggered.slice(-8);
        return !lastFive.includes(event.id);
    });

    if (availableEvents.length === 0) return null;

    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];

    return {
        ...event,
        timestamp: Date.now()
    };
}

// Process player's choice in an interactive event
function processEventChoice(event, choiceIndex, player) {
    const choice = event.choices[choiceIndex];

    if (!choice) {
        return { success: false, message: "Invalid choice" };
    }

    // Check requirements
    const meetsRequirements = checkEventRequirements(choice.requirements, player);

    if (!meetsRequirements.success) {
        return {
            success: false,
            message: `Requirements not met: ${meetsRequirements.missing.join(", ")}`
        };
    }

    // Determine success
    const roll = Math.random();
    const success = roll < choice.successChance;

    const outcome = success ? choice.outcomes.success : (choice.outcomes.failure || choice.outcomes.success);

    // Apply outcomes
    const result = applyEventOutcomes(outcome, player);

    return {
        success: true,
        eventSuccess: success,
        choice: choice.text,
        outcome: outcome,
        result: result
    };
}

function checkEventRequirements(requirements, player) {
    const missing = [];

    if (requirements.money && player.money < requirements.money) {
        missing.push(`$${requirements.money.toLocaleString()}`);
    }

    if (requirements.gangMembers && player.gang.gangMembers.filter(m => m.status === "active").length < requirements.gangMembers) {
        missing.push(`${requirements.gangMembers} gang members`);
    }

    if (requirements.violence && player.skillTree.combat.brawler < requirements.violence) {
        missing.push(`Violence ${requirements.violence}`);
    }

    if (requirements.intelligence && player.skillTree.intelligence.quick_study < requirements.intelligence) {
        missing.push(`Intelligence ${requirements.intelligence}`);
    }

    if (requirements.charisma && player.skillTree.charisma.smooth_talker < requirements.charisma) {
        missing.push(`Charisma ${requirements.charisma}`);
    }

    return {
        success: missing.length === 0,
        missing: missing
    };
}

function applyEventOutcomes(outcome, player) {
    const changes = {};

    if (outcome.money) {
        player.money += outcome.money;
        changes.money = outcome.money;
    }

    if (outcome.heat) {
        player.heat = Math.max(0, Math.min(100, player.heat + outcome.heat));
        changes.heat = outcome.heat;
    }

    if (outcome.respect) {
        player.reputation += outcome.respect;
        changes.respect = outcome.respect;
    }

    // Street stories also use 'reputation' as a separate modifier
    if (outcome.reputation) {
        player.reputation += outcome.reputation;
        changes.respect = (changes.respect || 0) + outcome.reputation;
    }

    if (outcome.gangMemberLoss && player.gang.gangMembers.length > 0) {
        const toLose = Math.min(outcome.gangMemberLoss, player.gang.gangMembers.length);
        const lostMembers = [];
        for (let i = 0; i < toLose; i++) {
            const randomIndex = Math.floor(Math.random() * player.gang.gangMembers.length);
            const member = player.gang.gangMembers[randomIndex];
            lostMembers.push(member.name);
            // Actually remove the dead member from the roster
            player.gang.gangMembers.splice(randomIndex, 1);
        }
        player.gang.members = player.gang.gangMembers.length;
        changes.lostMembers = lostMembers;
    }

    if (outcome.jailChance && Math.random() * 100 < outcome.jailChance) {
        // Trigger jail
        changes.jailed = true;
    }

    if (outcome.power) {
        // Random events can still grant/remove power via recalculation
        recalculatePower();
        changes.power = outcome.power;
    }

    if (outcome.health) {
        player.health = Math.max(0, Math.min(100, player.health + outcome.health));
        changes.health = outcome.health;
    }

    if (outcome.inventory) {
        if (!player.inventory) player.inventory = [];
        outcome.inventory.forEach(item => {
            player.inventory.push(item);
        });
        changes.addedItems = outcome.inventory;
    }

    changes.message = outcome.message;

    return changes;
}

// ==================== 4. RIVAL AI KINGPINS (LEGACY -- data now in RIVAL_FAMILIES / INDEPENDENT_BOSSES) ====================
// Kept as a lightweight lookup for any code that still references RIVAL_KINGPINS by array.
const RIVAL_KINGPINS = Object.values(RIVAL_FAMILIES).flatMap(f => {
    const list = [];
    list.push({ id: f.don.id, name: f.don.name, faction: Object.keys(RIVAL_FAMILIES).find(k => RIVAL_FAMILIES[k] === f), personality: "boss", territories: f.turfZones, gangSize: 10, powerRating: f.don.power, wealth: f.don.reward * 2, aggressiveness: 0.6, respectTowardPlayer: 0, specialAbility: "boss_fight" });
    list.push({ id: f.underboss.id, name: f.underboss.name, faction: Object.keys(RIVAL_FAMILIES).find(k => RIVAL_FAMILIES[k] === f), personality: "underboss", territories: f.turfZones, gangSize: 8, powerRating: f.underboss.power, wealth: f.underboss.reward, aggressiveness: 0.7, respectTowardPlayer: 0, specialAbility: "enforcer" });
    f.capos.forEach(c => list.push({ id: c.id, name: c.name, faction: Object.keys(RIVAL_FAMILIES).find(k => RIVAL_FAMILIES[k] === f), personality: "capo", territories: [c.zone], gangSize: 5, powerRating: c.power, wealth: c.reward, aggressiveness: 0.5, respectTowardPlayer: 0, specialAbility: "street_boss" }));
    return list;
}).concat(Object.values(INDEPENDENT_BOSSES).map(b => ({ id: b.id, name: b.name, faction: "independent", personality: "opportunistic", territories: [b.zone], gangSize: 6, powerRating: b.power, wealth: b.reward, aggressiveness: 0.9, respectTowardPlayer: 0, specialAbility: "guerrilla_warfare" })));

// ==================== SIDE QUEST SYSTEM (v1.9 -- Timers + Linked Street Stories) ====================

function initSideQuests() {
  if (!player.sideQuests) {
    player.sideQuests = {
      active: [], // quest IDs the player has accepted
      stepProgress: {}, // { questId: currentStepIndex }
      completed: [], // finished quest IDs
      timers: {}, // { questId: { startedAt: timestamp, duration: ms } }
      triggeredStories: [] // street story IDs already shown for quest linkage
    };
  }
  // Migrate older saves that lack timers/triggeredStories
  if (!player.sideQuests.timers) player.sideQuests.timers = {};
  if (!player.sideQuests.triggeredStories) player.sideQuests.triggeredStories = [];
}

function getSideQuestState(questId) {
  const sq = player.sideQuests || {};
  if ((sq.completed || []).includes(questId)) return 'completed';
  if ((sq.active || []).includes(questId)) return 'active';
  return 'available';
}

function getActiveQuestStep(quest) {
  const idx = (player.sideQuests?.stepProgress?.[quest.id]) || 0;
  return { step: quest.steps[idx], index: idx };
}

function canStartSideQuest(quest) {
  return (player.reputation || 0) >= (quest.minReputation || quest.minLevel || 0);
}

// -- Timer helpers ---
function startStepTimer(questId, step) {
  const minutes = step.timerMinutes || 1;
  player.sideQuests.timers[questId] = {
    startedAt: Date.now(),
    duration: minutes * 60000
  };
}

function getStepTimeRemaining(questId) {
  const t = player.sideQuests.timers?.[questId];
  if (!t) return 0;
  const elapsed = Date.now() - t.startedAt;
  return Math.max(0, t.duration - elapsed);
}

function isStepTimerComplete(questId) {
  return getStepTimeRemaining(questId) <= 0;
}

function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Ready!';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

// -- Linked street story trigger ---
function triggerLinkedStories(step, triggerType) {
  if (!step.linkedStories || step.linkedStories.length === 0) return;

  const storiesToShow = step.linkedStories.filter(ls => ls.trigger === triggerType);
  if (storiesToShow.length === 0) return;

  // Queue stories sequentially (each shows after the previous is dismissed)
  const queue = [...storiesToShow];
  function showNext() {
    if (queue.length === 0) return;
    const ls = queue.shift();
    // Don't repeat a story the player already saw for this quest run
    if (player.sideQuests.triggeredStories.includes(ls.storyId)) {
      showNext();
      return;
    }
    const story = STREET_STORIES.find(ss => ss.id === ls.storyId);
    if (!story) { showNext(); return; }

    player.sideQuests.triggeredStories.push(ls.storyId);

    // Convert to interactive event format and show
    const event = {
      id: story.id,
      title: story.title,
      description: story.scene + '\n\n' + story.dialogue.map(d =>
        d.speaker === 'Narrator' ? d.text : `${d.speaker}: ${d.text}`
      ).join('\n\n'),
      choices: story.choices.map(c => ({
        text: c.text,
        requirements: c.requirements || {},
        successChance: c.successChance,
        outcomes: c.outcomes
      }))
    };

    // Track in interactiveEvents for history
    if (!player.interactiveEvents) player.interactiveEvents = { eventsTriggered: [], lastEventTime: 0, eventCooldown: 300000 };
    player.interactiveEvents.eventsTriggered.push(event.id);
    player.interactiveEvents.lastEventTime = Date.now();

    // Show the event -- when dismissed, show next queued story
    currentEvent = event;
    showInteractiveEvent(event);
    // After the player makes a choice (or closes), showNext will be called by the patched close handler
    window._questStoryQueueNext = showNext;
  }
  showNext();
}

// -- Start a side quest ---
function startSideQuest(questId) {
  initSideQuests();
  const quest = SIDE_QUESTS.find(q => q.id === questId);
  if (!quest || !canStartSideQuest(quest)) return;
  if (player.sideQuests.active.includes(questId)) return;
  if (player.sideQuests.completed.includes(questId)) return;

  player.sideQuests.active.push(questId);
  player.sideQuests.stepProgress[questId] = 0;

  // Start the first step's timer
  const firstStep = quest.steps[0];
  startStepTimer(questId, firstStep);

  logAction(`Side quest started: <strong>${quest.title}</strong>`);
  showBriefNotification(`Quest Started: ${quest.title}`, 'success');
  updateUI();
  showSideQuestScreen();

  // Fire 'start' linked stories for the first step (slight delay so UI renders first)
  setTimeout(() => triggerLinkedStories(firstStep, 'start'), 600);
}
window.startSideQuest = startSideQuest;

// -- Complete a side quest step ---
function completeSideQuestStep(questId) {
  initSideQuests();
  const quest = SIDE_QUESTS.find(q => q.id === questId);
  if (!quest) return;
  const { step, index } = getActiveQuestStep(quest);
  if (!step) return;

  // Check timer
  if (!isStepTimerComplete(questId)) {
    const remaining = formatTimeRemaining(getStepTimeRemaining(questId));
    showBriefNotification(`Operation still in progress -- ${remaining} remaining`, 'danger');
    return;
  }

  // Check objective
  const obj = step.objective;
  let met = false;
  if (obj.type === 'money' && player.money >= obj.target) met = true;
  if ((obj.type === 'level' || obj.type === 'reputation') && (player.reputation || 0) >= obj.target) met = true;
  if (obj.type === 'jobs' && (player.missions?.missionStats?.jobsCompleted || 0) >= obj.target) met = true;

  if (!met) {
    showBriefNotification('Objective not yet met!', 'danger');
    return;
  }

  // Apply step reward (costs are negative money values)
  if (step.reward) {
    if (step.reward.money) player.money += step.reward.money;
    if (step.reward.respect) player.reputation += step.reward.respect;
    if (step.reward.reputation) player.reputation += step.reward.reputation;
  }

  logAction(`Quest step complete: <strong>${step.title}</strong>`);
  showBriefNotification(step.completionText, 'success');

  // Fire 'complete' linked stories for this step
  setTimeout(() => triggerLinkedStories(step, 'complete'), 600);

  // Advance or finish
  if (index + 1 < quest.steps.length) {
    player.sideQuests.stepProgress[questId] = index + 1;
    // Start next step's timer
    const nextStep = quest.steps[index + 1];
    startStepTimer(questId, nextStep);
    // Fire 'start' linked stories for the next step
    setTimeout(() => triggerLinkedStories(nextStep, 'start'), 1200);
  } else {
    // Quest complete -- clean up timer
    player.sideQuests.active = player.sideQuests.active.filter(id => id !== questId);
    player.sideQuests.completed.push(questId);
    delete player.sideQuests.stepProgress[questId];
    delete player.sideQuests.timers[questId];

    // Completion reward
    const cr = quest.completionReward;
    if (cr) {
      if (cr.money) player.money += cr.money;
      if (cr.respect) player.reputation += cr.respect;
      if (cr.reputation) player.reputation += cr.reputation;
    }

    logAction(`Side quest COMPLETE: <strong>${quest.title}</strong>!`);
    showNarrativeOverlay(quest.title + ' -- Complete', quest.completionNarrative, 'Continue');
  }

  updateUI();
  showSideQuestScreen();
}
window.completeSideQuestStep = completeSideQuestStep;

// -- Quest timer tick -- updates the quest screen countdown every second --
let _questTimerInterval = null;
function stopQuestTimerTick() {
  if (_questTimerInterval) {
    clearInterval(_questTimerInterval);
    _questTimerInterval = null;
  }
}
function startQuestTimerTick() {
  if (_questTimerInterval) return; // already running
  _questTimerInterval = setInterval(() => {
    // Only update if the quest screen is visible
    const timerEls = document.querySelectorAll('[data-quest-timer]');
    if (timerEls.length === 0) return;
    timerEls.forEach(el => {
      const qid = el.getAttribute('data-quest-timer');
      const remaining = getStepTimeRemaining(qid);
      if (remaining <= 0) {
        el.textContent = ' Ready!';
        el.style.color = '#8a9a6a';
        // Also show/enable the complete button if objective met
        const btn = document.querySelector(`[data-complete-btn="${qid}"]`);
        if (btn) btn.style.display = '';
      } else {
        el.textContent = ' ' + formatTimeRemaining(remaining);
        el.style.color = '#c0a040';
      }
    });
  }, 1000);
}

// -- Show side quest screen with timer display ---
function showSideQuestScreen() {
  initSideQuests();
  const sq = player.sideQuests;

  let html = `
    <div class="story-screen">
      <div class="story-title-block">
        <h1 class="story-main-title">Side Operations</h1>
        <p class="story-subtitle">Multi-step operations that build your empire. Each step takes time -- and triggers events on the streets.</p>
      </div>`;

  // Active quests first
  const activeQuests = SIDE_QUESTS.filter(q => sq.active.includes(q.id));
  if (activeQuests.length > 0) {
    html += `<h2 style="color:#c0a040;margin:20px 0 10px;">Active Operations</h2>`;
    activeQuests.forEach(quest => {
      const { step, index } = getActiveQuestStep(quest);
      if (!step) return;
      const obj = step.objective;
      let currentVal = 0;
      if (obj.type === 'money') currentVal = player.money;
      else if (obj.type === 'level') currentVal = Math.floor(player.reputation || 0);
      else if (obj.type === 'jobs') currentVal = player.missions?.missionStats?.jobsCompleted || 0;
      else if (obj.type === 'gang') currentVal = player.gang?.members || 0;
      else if (obj.type === 'properties') currentVal = (player.realEstate?.ownedProperties || []).length;
      else if (obj.type === 'reputation') currentVal = Math.floor(player.reputation || 0);
      const objMet = currentVal >= obj.target;
      const timerDone = isStepTimerComplete(quest.id);
      const remaining = getStepTimeRemaining(quest.id);
      const canComplete = objMet && timerDone;

      html += `
        <div class="story-family-card" style="--fam-color:#c0a040;margin-bottom:15px;">
          <div class="story-family-icon">${quest.icon}</div>
          <h2 class="story-family-name">${quest.title}</h2>
          <div style="color:#aaa;margin-bottom:8px;">Step ${index + 1} of ${quest.steps.length}</div>
          <h3 style="color:#e0c068;">${step.title}</h3>
          <p style="color:#ccc;line-height:1.5;">${step.narrative}</p>

          <div style="display:flex;gap:15px;flex-wrap:wrap;margin:10px 0;">
            <div class="story-objective ${objMet ? 'obj-met' : ''}">
              <span class="obj-icon">${objMet ? '' : ''}</span>
              <span class="obj-label">${obj.text}</span>
              <span class="obj-val">${currentVal.toLocaleString()} / ${obj.target.toLocaleString()}</span>
            </div>
            <div style="background:#14120a;border:1px solid #c0a04044;border-radius:8px;padding:8px 14px;font-size:0.95em;">
              <span data-quest-timer="${quest.id}" style="color:${timerDone ? '#8a9a6a' : '#c0a040'};">${timerDone ? ' Ready!' : ' ' + formatTimeRemaining(remaining)}</span>
              <span style="color:#888;margin-left:6px;font-size:0.85em;">(${step.timerMinutes || '?'}m operation)</span>
            </div>
          </div>

          ${canComplete
            ? `<button class="story-advance-btn" data-complete-btn="${quest.id}" onclick="completeSideQuestStep('${quest.id}')">Complete Step -></button>`
            : `<button class="story-advance-btn" data-complete-btn="${quest.id}" style="display:${objMet && !timerDone ? '' : 'none'};opacity:0.5;cursor:not-allowed;" disabled>Waiting for operation...</button>`
          }
        </div>`;
    });
  }

  // Available quests
  const availableQuests = SIDE_QUESTS.filter(q => getSideQuestState(q.id) === 'available' && canStartSideQuest(q));
  if (availableQuests.length > 0) {
    html += `<h2 style="color:#c0a062;margin:20px 0 10px;">Available Operations</h2>`;
    availableQuests.forEach(quest => {
      const totalTime = quest.steps.reduce((sum, s) => sum + (s.timerMinutes || 0), 0);
      html += `
        <div class="story-family-card" style="--fam-color:#c0a062;margin-bottom:15px;">
          <div class="story-family-icon">${quest.icon}</div>
          <h2 class="story-family-name">${quest.title}</h2>
          <p style="color:#ccc;line-height:1.5;">${quest.description}</p>
          <div style="color:#888;font-size:0.9em;">Min Respect: ${quest.minReputation || quest.minLevel || 0} &middot; ${quest.steps.length} Steps &middot; ~${totalTime}min total</div>
          <div style="color:#c0a040;font-size:0.9em;margin-top:5px;">
            Completion Reward: ${quest.completionReward.money ? '$' + quest.completionReward.money.toLocaleString() + ' ' : ''}${quest.completionReward.respect ? '+' + quest.completionReward.respect + ' Respect ' : ''}${quest.completionReward.reputation ? '+' + quest.completionReward.reputation + ' Respect' : ''}
          </div>
          <button class="story-pledge-btn" style="background:linear-gradient(135deg,#c0a062,#a08850);" onclick="startSideQuest('${quest.id}')">Accept Operation</button>
        </div>`;
    });
  }

  // Locked quests
  const lockedQuests = SIDE_QUESTS.filter(q => getSideQuestState(q.id) === 'available' && !canStartSideQuest(q));
  if (lockedQuests.length > 0) {
    html += `<h2 style="color:#666;margin:20px 0 10px;">Locked Operations</h2>`;
    lockedQuests.forEach(quest => {
      html += `
        <div class="story-family-card" style="--fam-color:#444;margin-bottom:15px;opacity:0.6;">
          <div class="story-family-icon">${quest.icon}</div>
          <h2 class="story-family-name">${quest.title}</h2>
          <p style="color:#888;">${quest.description}</p>
          <div style="color:#8b3a3a;font-size:0.9em;"> Requires ${quest.minReputation || quest.minLevel || 0} Respect</div>
        </div>`;
    });
  }

  // Completed quests
  const completedQuests = SIDE_QUESTS.filter(q => sq.completed.includes(q.id));
  if (completedQuests.length > 0) {
    html += `<h2 style="color:#8a9a6a;margin:20px 0 10px;">Completed</h2>`;
    completedQuests.forEach(quest => {
      html += `
        <div class="story-family-card" style="--fam-color:#8a9a6a;margin-bottom:15px;opacity:0.7;">
          <div class="story-family-icon">${quest.icon}</div>
          <h2 class="story-family-name">${quest.title}</h2>
          <p style="color:#888;font-style:italic;">${quest.completionNarrative.substring(0, 120)}...</p>
        </div>`;
    });
  }

  html += `
      <button class="story-back-btn" onclick="showMissions()"><- Back to Story</button>
      <button class="story-back-btn" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>`;

  document.getElementById("missions-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("missions-screen").style.display = "block";

  // Start the 1-second timer tick so countdowns update live
  startQuestTimerTick();
}
window.showSideQuestScreen = showSideQuestScreen;

// Render side ops content inline for the missions tab (returns HTML string)
function renderSideOpsContent() {
  initSideQuests();
  const sq = player.sideQuests;
  let html = `
    <div style="padding:10px 0;">
      <h2 style="color:#c0a040;margin:0 0 8px;">Side Operations</h2>
      <p style="color:#8a7a5a;margin:0 0 15px;font-size:0.9em;">Multi-step operations that build your empire. Each step takes time and triggers events on the streets.</p>`;

  // Active quests
  const activeQuests = SIDE_QUESTS.filter(q => sq.active.includes(q.id));
  if (activeQuests.length > 0) {
    html += `<h3 style="color:#c0a040;margin:15px 0 8px;">Active</h3>`;
    activeQuests.forEach(quest => {
      const { step, index } = getActiveQuestStep(quest);
      if (!step) return;
      const obj = step.objective;
      let currentVal = 0;
      if (obj.type === 'money') currentVal = player.money;
      else if (obj.type === 'level') currentVal = Math.floor(player.reputation || 0);
      else if (obj.type === 'jobs') currentVal = player.missions?.missionStats?.jobsCompleted || 0;
      else if (obj.type === 'gang') currentVal = player.gang?.members || 0;
      else if (obj.type === 'properties') currentVal = (player.realEstate?.ownedProperties || []).length;
      else if (obj.type === 'reputation') currentVal = Math.floor(player.reputation || 0);
      const objMet = currentVal >= obj.target;
      const timerDone = isStepTimerComplete(quest.id);
      const remaining = getStepTimeRemaining(quest.id);
      const canComplete = objMet && timerDone;
      html += `
        <div style="background:rgba(20,18,10,0.6);padding:12px;border-radius:8px;border-left:4px solid #c0a040;margin-bottom:10px;">
          <h4 style="color:#f5e6c8;margin:0 0 4px;">${quest.icon} ${quest.title} <span style="color:#888;font-size:0.8em;">Step ${index+1}/${quest.steps.length}</span></h4>
          <p style="color:#ccc;font-size:0.9em;margin:4px 0;">${step.narrative}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0;font-size:0.85em;">
            <span style="color:${objMet?'#8a9a6a':'#c0a040'};">${objMet?'Done':'Pending'}: ${obj.text} (${currentVal.toLocaleString()}/${obj.target.toLocaleString()})</span>
            <span data-quest-timer="${quest.id}" style="color:${timerDone?'#8a9a6a':'#c0a040'};">${timerDone?'Ready!':formatTimeRemaining(remaining)}</span>
          </div>
          ${canComplete ? `<button onclick="completeSideQuestStep('${quest.id}')" style="background:#c0a040;color:#000;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;">Complete Step</button>` : ''}
        </div>`;
    });
  }

  // Available quests
  const availableQuests = SIDE_QUESTS.filter(q => getSideQuestState(q.id) === 'available' && canStartSideQuest(q));
  if (availableQuests.length > 0) {
    html += `<h3 style="color:#c0a062;margin:15px 0 8px;">Available</h3>`;
    availableQuests.forEach(quest => {
      const totalTime = quest.steps.reduce((sum, s) => sum + (s.timerMinutes || 0), 0);
      html += `
        <div style="background:rgba(20,18,10,0.4);padding:12px;border-radius:8px;border-left:4px solid #c0a062;margin-bottom:10px;">
          <h4 style="color:#f5e6c8;margin:0 0 4px;">${quest.icon} ${quest.title}</h4>
          <p style="color:#ccc;font-size:0.9em;margin:4px 0;">${quest.description}</p>
          <div style="color:#888;font-size:0.85em;">Respect ${quest.minReputation || quest.minLevel || 0} | ${quest.steps.length} Steps | ~${totalTime}min</div>
          <button onclick="startSideQuest('${quest.id}')" style="background:linear-gradient(135deg,#c0a062,#a08850);color:#000;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;margin-top:6px;">Accept</button>
        </div>`;
    });
  }

  // Locked quests
  const lockedQuests = SIDE_QUESTS.filter(q => getSideQuestState(q.id) === 'available' && !canStartSideQuest(q));
  if (lockedQuests.length > 0) {
    html += `<h3 style="color:#666;margin:15px 0 8px;">Locked</h3>`;
    lockedQuests.forEach(quest => {
      html += `
        <div style="background:rgba(20,18,10,0.3);padding:10px;border-radius:8px;border-left:4px solid #444;margin-bottom:8px;opacity:0.6;">
          <h4 style="color:#888;margin:0 0 4px;">${quest.icon} ${quest.title}</h4>
          <p style="color:#666;font-size:0.85em;">${quest.description}</p>
          <div style="color:#8b3a3a;font-size:0.85em;">Requires ${quest.minReputation || quest.minLevel || 0} Respect</div>
        </div>`;
    });
  }

  // Completed quests
  const completedQuests = SIDE_QUESTS.filter(q => sq.completed.includes(q.id));
  if (completedQuests.length > 0) {
    html += `<h3 style="color:#8a9a6a;margin:15px 0 8px;">Completed</h3>`;
    completedQuests.forEach(quest => {
      html += `
        <div style="background:rgba(20,18,10,0.3);padding:10px;border-radius:8px;border-left:4px solid #8a9a6a;margin-bottom:8px;opacity:0.7;">
          <h4 style="color:#8a9a6a;margin:0 0 2px;">${quest.icon} ${quest.title}</h4>
          <p style="color:#666;font-size:0.85em;font-style:italic;">${quest.completionNarrative.substring(0, 120)}...</p>
        </div>`;
    });
  }

  if (activeQuests.length === 0 && availableQuests.length === 0 && lockedQuests.length === 0 && completedQuests.length === 0) {
    html += `<p style="color:#8a7a5a;font-style:italic;">No side operations discovered yet. Keep progressing through the story.</p>`;
  }

  html += `</div>`;
  return html;
}
window.renderSideOpsContent = renderSideOpsContent;

// ==================== POST-DON ENDGAME ARCS ====================

function showPostDonArc(arcId) {
  const arc = POST_DON_ARCS.find(a => a.id === arcId);
  if (!arc) return;

  let narrativeHTML = arc.narrative.map(block => {
    if (block.type === 'scene') return `<div class="story-block story-scene"><em>${block.text}</em></div>`;
    if (block.type === 'dialogue') {
      return `<div class="story-block story-dialogue"><span class="story-speaker">${block.speaker}:</span> ${block.text}</div>`;
    }
    return `<div class="story-block story-narration">${block.text}</div>`;
  }).join('');

  // Successor arc has candidate cards with selection buttons
  let candidatesHTML = '';
  if (arc.candidates) {
    // Show current chosen successor if already selected
    const currentChoice = player.storyProgress?.chosenSuccessor;
    candidatesHTML = `<h3 style="color:#c0a040;text-align:center;margin:20px 0 10px;">${currentChoice ? ' Your Chosen Successor' : ' Choose Your Successor'}</h3>`;
    candidatesHTML += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin:0 0 20px;">` +
      arc.candidates.map(c => {
        const isChosen = currentChoice === c.name;
        const borderStyle = isChosen ? 'border:2px solid #c0a040;' : 'border:1px solid #c0a04033;';
        return `
        <div style="background:#14120a;${borderStyle}border-radius:12px;padding:15px;">
          <h3 style="color:#c0a040;margin:0 0 8px;">${c.name}</h3>
          <p style="color:#ccc;font-size:0.9em;line-height:1.4;">${c.desc}</p>
          <div style="color:#8a9a6a;font-size:0.8em;margin-top:8px;">Trait: ${c.trait}</div>
          <div style="color:#8b3a3a;font-size:0.8em;margin-top:4px;">Risk: ${c.risk}</div>
          <button onclick="selectSuccessor('${c.name}', '${c.trait}')"
            style="margin-top:12px;width:100%;padding:8px;background:${isChosen ? 'linear-gradient(135deg,#c0a040,#a08830)' : 'linear-gradient(135deg,#7a8a5a,#8a9a6a)'};border:none;border-radius:8px;color:white;font-weight:bold;cursor:pointer;font-size:0.9em;">
            ${isChosen ? ' Chosen' : ' Choose'}
          </button>
        </div>`}).join('') +
      `</div>`;
  }

  let html = `
    <div class="story-screen">
      <div class="story-act-banner" style="border-color:#c0a040;">
        <span class="story-act-label">Endgame</span>
        <h2 class="story-chapter-title">${arc.icon} ${arc.title}</h2>
      </div>
      <p style="color:#aaa;line-height:1.5;margin-bottom:15px;">${arc.description}</p>
      <div class="story-narrative">${narrativeHTML}</div>
      ${candidatesHTML}
      <button class="story-back-btn" onclick="showMissions()"><- Back</button>
    </div>`;

  document.getElementById("missions-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("missions-screen").style.display = "block";
}
window.showPostDonArc = showPostDonArc;

// Select a successor for the Successor Crisis arc
function selectSuccessor(candidateName, candidateTrait) {
  if (!player.storyProgress) return;
  player.storyProgress.chosenSuccessor = candidateName;
  player.storyProgress.successorTrait = candidateTrait;

  showBriefNotification(`${candidateName} has been chosen as your successor.`, 'success');
  logAction(`You chose <strong>${candidateName}</strong> as your successor. The future of your empire is in their hands.`);

  // Re-render the arc to show the updated selection
  showPostDonArc('pda_the_successor');
}
window.selectSuccessor = selectSuccessor;

// ==================== LEVEL-UP MILESTONE NARRATIONS ====================

function checkMilestoneNarration(reputation) {
  const milestone = DEEP_NARRATIONS.reputationMilestones[reputation];
  if (milestone) {
    showNarrativeOverlay(milestone.title, milestone.text, 'Continue');
  }
}

// Hook into the world narration system -- periodic atmospheric text
let lastWorldNarrationTime = 0;
function maybeShowWorldNarration() {
  const now = Date.now();
  if (now - lastWorldNarrationTime < 600000) return; // 10 min cooldown
  if (Math.random() > 0.15) return; // 15% chance

  const texts = DEEP_NARRATIONS.worldTexts;
  const text = texts[Math.floor(Math.random() * texts.length)];
  lastWorldNarrationTime = now;

  // Show as a brief atmospheric notification
  GameLogging.logEvent('WORLD_NARRATION', { text });
}

// ==================== INTEGRATION & INITIALIZATION ==

// Initialize all expanded systems for a new game
function initializeExpandedSystems(player) {
    // Gang members
    if (!player.gang.gangMembers) {
        player.gang.gangMembers = [];
    }

    // Territories -- now handled by turf system (initTurfZones)
    // player.territoriesEx is legacy; turf data lives in player.turf
    if (!player.turf) {
        player.turf = { owned: [], bossesDefeated: [], donsDefeated: [], income: 0, power: 100, reputation: 0, events: [], fortifications: {}, lastTributeCollection: 0 };
    }

    // Rival kingpins
    if (!player.rivalKingpins) {
        player.rivalKingpins = JSON.parse(JSON.stringify(RIVAL_KINGPINS));
    }

    // Rival respect tracking -- syncs rivalKingpins.respectTowardPlayer to this map
    if (!player.relationships) {
        player.relationships = {};
        // Seed from any existing rivalKingpins data
        (player.rivalKingpins || []).forEach(r => {
            if (r.respectTowardPlayer) player.relationships[r.id] = r.respectTowardPlayer;
        });
    }

    // Event tracking
    if (!player.interactiveEvents) {
        player.interactiveEvents = {
            lastEventTime: 0,
            eventsTriggered: [],
            eventCooldown: 300000 // 5 minutes between events
        };
    }

    // Side quests
    if (!player.sideQuests) {
        player.sideQuests = {
            active: [],
            stepProgress: {},
            completed: []
        };
    }

    // Story milestones seen
    if (!player.milestonesShown) {
        player.milestonesShown = [];
    }
}

// Export all systems for use in main game
export default {
    CONFIG: EXPANDED_SYSTEMS_CONFIG,
    ROLES: GANG_MEMBER_ROLES,
    TERRITORIES: TURF_ZONES,
    EVENTS: INTERACTIVE_EVENTS,
    RIVALS: RIVAL_KINGPINS,

    // Gang functions
    generateGangMember: generateExpandedGangMember,
    calculateMemberEffectiveness,

    // Territory functions -- now use turf system
    assignMembersToTerritory: assignMembersToTurf,
    calculateTerritoryDefense: calculateTurfDefense,
    processTerritoryAttack: processTurfAttack,

    // Event functions
    triggerInteractiveEvent,
    processEventChoice,

    // Initialization
    initializeExpandedSystems
};

// ==================== EXPANDED UI SCREENS (merged from expanded-ui.js) ====================

// ==================== GANG MANAGEMENT UI ====================
// (showGangManagementScreen defined later at Crew Details section)

window.recruitGangMemberExpanded = function() {
  if (player.money < 5000) {
    ui.toast("Not enough money to recruit! Need $5,000.", 'error');
    return;
  }

  const newMember = generateExpandedGangMember();
  player.gang.gangMembers.push(newMember);
  player.gang.members++;
  player.money -= 5000;

  GameLogging.logEvent('GANG_RECRUIT', { name: newMember.name, role: newMember.roleData.name });

  showGang('roster'); // Refresh
  updateUI();
};

window.dismissMember = async function(memberId) {
  const member = player.gang.gangMembers.find(m => m.id === memberId);
  if (!member) return;

  if (!await ui.confirm(`Are you sure you want to dismiss ${member.name}? This cannot be undone.`)) {
    return;
  }

  // Remove from turf assignments if assigned
  if (member.assignedTo && player.turf) {
    // Legacy cleanup -- turf system uses zone IDs
    member.assignedTo = null;
  }

  // Actually remove from the array (setting status alone leaves ghost data)
  player.gang.gangMembers = player.gang.gangMembers.filter(m => m.id !== memberId);
  player.gang.members = player.gang.gangMembers.length;

  recalculatePower();
  GameLogging.logEvent('GANG_DISMISS', { name: member.name });
  showGang('roster');
  updateUI();
};

// ==================== INTERACTIVE EVENT UI ====================

let currentEvent = null;

function checkAndTriggerInteractiveEvent() {
  if (!EXPANDED_SYSTEMS_CONFIG.interactiveEventsEnabled) return;

  const now = Date.now();
  const lastEvent = player.interactiveEvents?.lastEventTime || 0;
  const cooldown = player.interactiveEvents?.eventCooldown || 300000;

  if (now - lastEvent < cooldown) return;

  // 20% chance per check
  if (Math.random() > 0.2) return;

  const event = triggerInteractiveEvent(player);
  if (!event) return;

  player.interactiveEvents.lastEventTime = now;
  player.interactiveEvents.eventsTriggered.push(event.id);

  showInteractiveEvent(event);
}

function showInteractiveEvent(event) {
  currentEvent = event;

  // Format description: convert newlines to paragraphs for richer display
  const descHtml = event.description.split('\n\n').map(p => `<p class="event-description">${p.trim()}</p>`).join('');

  let html = `
    <div class="interactive-event">
      <h2>${event.title}</h2>
      ${descHtml}

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

      <button onclick="closeScreenAndContinueQueue(); updateUI();" style="margin-top: 20px; padding: 12px 25px; background: #8a7a5a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;">Close</button>
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
  if (requirements.violence && player.skillTree.combat.brawler < requirements.violence) {
    return { canChoose: false, reason: `Need Violence ${requirements.violence}` };
  }
  if (requirements.intelligence && player.skillTree.intelligence.quick_study < requirements.intelligence) {
    return { canChoose: false, reason: `Need Intelligence ${requirements.intelligence}` };
  }
  if (requirements.charisma && player.skillTree.charisma.smooth_talker < requirements.charisma) {
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

  const result = processEventChoice(currentEvent, choiceIndex, player);

  if (!result.success) {
    ui.toast(result.message, 'error');
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
        ${result.result.respect ? `<div>Respect: ${result.result.respect > 0 ? '+' : ''}${result.result.respect}</div>` : ''}
        ${result.result.lostMembers ? `<div> Lost: ${result.result.lostMembers.join(', ')}</div>` : ''}
        ${result.result.jailed ? `<div> You've been arrested!</div>` : ''}
      </div>

      <button onclick="closeScreenAndContinueQueue(); updateUI();">Continue</button>
    </div>
  `;

  showCustomScreen(outcomeHtml);
  currentEvent = null;

  if (result.result.jailed) {
    setTimeout(() => {
      closeScreen();
      sendToJail(0, { crimeName: 'Story Event', riskLevel: 'medium' });
    }, 3000);
  }
};

// Close screen and advance the quest-story queue if any stories remain
window.closeScreenAndContinueQueue = function() {
  closeScreen();
  // If there are queued linked stories from a quest step, show the next one
  if (typeof window._questStoryQueueNext === 'function') {
    const next = window._questStoryQueueNext;
    window._questStoryQueueNext = null;
    setTimeout(next, 400);
  }
};

// ==================== RIVAL KINGPINS UI ====================

function showRivalActivityScreen() {
  const rivals = player.rivalKingpins || RIVAL_KINGPINS;

  let html = `
    <div class="expanded-screen rivals-screen">
      <h2> Rival Kingpins</h2>
      <p class="subtitle">Track your competitors and plan your moves</p>

      <div class="rivals-grid">
        ${rivals.map(rival => renderRival(rival)).join('')}
      </div>

      <button onclick="closeScreen()"><- Back</button>
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
        <div style="color: ${respectColor}">Respect: ${playerRespect > 0 ? '+' : ''}${playerRespect}</div>
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

// formatSpecialAbility -- already defined in main game.js code

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

// Export all UI functions (exposed via window below)

// Expose merged expanded UI functions to window (for onclick handlers in dynamic HTML)
window.showRivalActivityScreen = function() {
  if (typeof showRivalsScreen === 'function') showRivalsScreen();
};
window.closeScreen = closeScreen;

// ==================== END MERGED EXPANDED SYSTEMS ====================


// Specialist Roles for Gang Members (operations & training mechanics)
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
      healthProtection: 0.10 // 10% less health loss
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
      carTheftBonus: 0.25 // 25% better car theft success
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
      moneyBonus: 0.15 // 15% more money from drug jobs
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
      businessProtection: 0.20 // 20% better business income protection
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
      vehicleJobBonus: 0.25 // 25% bonus to vehicle-related jobs
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
      securityBypass: 0.15 // 15% better at bypassing security
    },
    requiredFor: ["hacking", "security_bypass", "money_laundering"]
  }
];

// Gang Operations - Special missions for specialist gang members
// Member XP required to reach next level (scales with current level)
function getMemberXPToLevel(currentLevel) {
  return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

// Assign a gang member to manage a business (boosts income by 15-40% based on member level)
function assignMemberToBusiness(memberIndex, businessIndex) {
  const member = player.gang.gangMembers[memberIndex];
  const business = (player.businesses || [])[businessIndex];
  if (!member || !business) return;
  if (member.onOperation || member.inTraining || member.arrested) {
    showBriefNotification(`${member.name} is not available right now.`, 'warning');
    return;
  }
  // Remove any previous business assignment from this member
  (player.businesses || []).forEach(b => { if (b.assignedMember === member.name) b.assignedMember = null; });
  // Remove any previous member from this business
  business.assignedMember = member.name;
  member.assignedTo = 'business_' + businessIndex;
  const bonus = Math.floor(15 + (member.experienceLevel || 1) * 2.5);
  showBriefNotification(`${member.name} now manages ${business.name} (+${bonus}% income).`, 'success');
  logAction(`${member.name} takes over day-to-day operations at ${business.name}. The books have never looked better.`);
  updateUI();
}
window.assignMemberToBusiness = assignMemberToBusiness;

function unassignMemberFromBusiness(businessIndex) {
  const business = (player.businesses || [])[businessIndex];
  if (!business || !business.assignedMember) return;
  const member = player.gang.gangMembers.find(m => m.name === business.assignedMember);
  if (member) member.assignedTo = null;
  const name = business.assignedMember;
  business.assignedMember = null;
  showBriefNotification(`${name} removed from ${business.name}.`, 'success');
  updateUI();
}
window.unassignMemberFromBusiness = unassignMemberFromBusiness;

// Get business income multiplier from assigned gang member
function getBusinessMemberBonus(business) {
  if (!business.assignedMember) return 1.0;
  const member = player.gang.gangMembers.find(m => m.name === business.assignedMember);
  if (!member || member.arrested || member.onOperation) return 1.0;
  // 15% base + 2.5% per member level
  return 1.0 + (0.15 + (member.experienceLevel || 1) * 0.025);
}

// Process passive income from idle gang members (called each passive cycle)
function processGangPassiveIncome() {
  if (!player.gang || !player.gang.gangMembers) return;
  const idleMembers = player.gang.gangMembers.filter(m =>
    !m.onOperation && !m.inTraining && !m.arrested && !m.assignedTo
  );
  if (idleMembers.length === 0) return;
  let totalEarned = 0;
  idleMembers.forEach(member => {
    // Each idle member runs small street-level hustles for passive income
    const memberLevel = member.experienceLevel || 1;
    const baseIncome = 50 + memberLevel * 30;
    const earnings = Math.floor(baseIncome * (0.7 + Math.random() * 0.6));
    totalEarned += earnings;
    // Small XP gain from street work
    member.xp = (member.xp || 0) + 5;
    const xpToLevel = getMemberXPToLevel(memberLevel);
    if (member.xp >= xpToLevel && Math.floor(memberLevel) < 10) {
      member.experienceLevel = Math.floor(memberLevel) + 1;
      member.xp = 0;
      if (member.stats) {
        member.stats.violence = (member.stats.violence || 0) + 1;
        member.stats.stealth = (member.stats.stealth || 0) + 1;
        member.stats.intelligence = (member.stats.intelligence || 0) + 1;
      }
      member.power = (member.power || 5) + 2;
      logAction(`${member.name} leveled up to Level ${member.experienceLevel} from street work!`);
    }
    // Small arrest risk (2%) during passive hustling
    if (Math.random() < 0.02) {
      member.arrested = true;
      member.arrestTime = Date.now() + (Math.random() * 24 + 12) * 60 * 60 * 1000;
      logAction(`${member.name} got picked up by the cops while running a hustle. They'll be out in a day or so.`);
    }
  });
  if (totalEarned > 0) {
    player.dirtyMoney = (player.dirtyMoney || 0) + totalEarned;
    logAction(`Your idle crew earned $${totalEarned.toLocaleString()} (dirty) from street hustles.`);
  }
}

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
      experience: 50
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
      experience: 75
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
      experience: 100
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
      experience: 150
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
      violence: 1
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
      stealth: 1
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
      intelligence: 1
    },
    availableFor: ["dealer", "enforcer", "technician"]
  },
  {
    id: "loyalty_building",
    name: "Team Building Retreat",
    description: "Strengthen bonds and team morale",
    cost: 400,
    duration: 6,
    skillImprovement: {
      violence: 1,
      stealth: 1
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
      intelligence: 1
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
      minHeat: 20
    },
    consequences: {
      policeRaid: true,
      heatIncrease: 15,
      moneyLoss: 0.20, // 20% of current money
      gangMemberLoss: 1
    },
    detectionChance: 70 // 70% chance to detect the betrayal
  },
  {
    id: "territory_sellout",
    name: "Turf Sellout",
    description: "A gang member sells turf information to rivals",
    triggerConditions: {
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
// Protection Racket Businesses
const protectionBusinesses = [
  {
    id: "corner_store",
    name: "Corner Store",
    type: "retail",
    basePayment: 120,
    riskLevel: "low",
    description: "Small neighborhood convenience store",
    vulnerabilities: ["theft", "vandalism"],
    maxExtortion: 240,
    category: "retail"
  },
  {
    id: "restaurant",
    name: "Family Restaurant",
    type: "food",
    basePayment: 300,
    riskLevel: "medium",
    description: "Local dining establishment",
    vulnerabilities: ["health_violations", "supply_disruption"],
    maxExtortion: 600,
    category: "food"
  },
  {
    id: "auto_shop",
    name: "Auto Repair Shop",
    type: "service",
    basePayment: 480,
    riskLevel: "medium",
    description: "Automotive repair and service",
    vulnerabilities: ["equipment_damage", "supplier_issues"],
    maxExtortion: 900,
    category: "automotive"
  },
  {
    id: "nightclub",
    name: "Nightclub",
    type: "entertainment",
    basePayment: 720,
    riskLevel: "high",
    description: "Popular nightlife venue",
    vulnerabilities: ["license_issues", "security_problems"],
    maxExtortion: 1500,
    category: "entertainment"
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    type: "medical",
    basePayment: 360,
    riskLevel: "low",
    description: "Local pharmacy and medical supplies",
    vulnerabilities: ["regulatory_issues", "theft"],
    maxExtortion: 720,
    category: "medical"
  },
  {
    id: "construction_company",
    name: "Construction Company",
    type: "industrial",
    basePayment: 900,
    riskLevel: "high",
    description: "Construction and contracting business",
    vulnerabilities: ["union_issues", "equipment_sabotage"],
    maxExtortion: 1800,
    category: "industrial"
  },
  {
    id: "jewelry_store",
    name: "Jewelry Store",
    type: "luxury",
    basePayment: 600,
    riskLevel: "high",
    description: "High-end jewelry and watches",
    vulnerabilities: ["robbery", "security_breaches"],
    maxExtortion: 1200,
    category: "luxury"
  },
  {
    id: "shipping_company",
    name: "Shipping Company",
    type: "logistics",
    basePayment: 1200,
    riskLevel: "high",
    description: "Freight and logistics operations",
    vulnerabilities: ["cargo_theft", "dock_issues"],
    maxExtortion: 2400,
    category: "logistics"
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
    name: "Rival Family Encroachment",
    description: "A rival family is pushing into your territory",
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
// buildBusinessesHTML returns the Fronts tab content as an HTML string
function buildBusinessesHTML() {
  let businessHTML = `
    <h2>Business Empire</h2>
    <p>Manage your legitimate business fronts and expand your economic influence.</p>
    <div style="margin: 15px 0; padding: 12px; border: 1px solid #6a5a3a; border-radius: 8px; background: rgba(0,0,0,0.25); display: flex; gap: 12px; align-items: center;">
      <div style="flex:1; color:#f5e6c8;">
        <strong>Bookie Service</strong><br>
        Automatically collects business income and gang tribute. Service fee applies hourly.
      </div>
      <div>
        <button onclick="toggleBookieHire()" style="background:${player.services && player.services.bookieHired ? '#8b3a3a' : '#8a9a6a'}; color:white; padding:10px 14px; border:none; border-radius:6px; cursor:pointer;">
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
            style="background: linear-gradient(135deg, #7a8a5a, #8a9a6a); color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.1em; box-shadow: 0 3px 10px rgba(138, 154, 106,0.3);">
          Collect All Income
        </button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin: 20px 0;">
        ${player.businesses.map((business, index) => {
          const businessType = businessTypes.find(bt => bt.id === business.type);
          const currentIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1));
          const upgradePrice = business.level < businessType.maxLevel ?
            Math.floor(businessType.basePrice * Math.pow(businessType.upgradeMultiplier, business.level)) : null;

          // Phase 3: district info
          const bizDistrictId = business.districtId || player.currentTerritory;
          const bizDistrict = bizDistrictId ? getDistrict(bizDistrictId) : null;
          const bizMult = getBusinessMultiplier(bizDistrictId);
          const bonusPct = Math.round((bizMult - 1) * 100);

          // Unique upgrade flavor text for illegal businesses
          const upgradeFlavorText = {
            counterfeiting: ['Better printing plates', 'UV-resistant ink', 'Distribution network', 'Master engraver hired'],
            druglab: ['Better equipment', 'Chemist recruited', 'Hidden ventilation', 'Industrial-scale production'],
            chopshop: ['Better tools', 'Expert mechanic hired', 'VIN removal tech', 'International buyer network']
          };
          const flavorTexts = upgradeFlavorText[business.type] || [];
          const nextUpgradeText = business.level < businessType.maxLevel && flavorTexts[business.level - 1]
            ? `<p style="margin: 5px 0; color: #c0a040; font-style: italic;">Next: ${flavorTexts[business.level - 1]}</p>` : '';

          // Max level perk display for illegal businesses
          const maxLevelPerks = {
            counterfeiting: 'MAX LEVEL PERK: +5% laundering conversion rate on all methods',
            druglab: 'MAX LEVEL PERK: Drug trade goods cost 35% less in the store',
            chopshop: 'MAX LEVEL PERK: +55% bonus on all stolen car sales'
          };
          const isMaxLevel = business.level >= businessType.maxLevel;
          const maxPerkText = isMaxLevel && maxLevelPerks[business.type]
            ? `<p style="margin: 8px 0; padding: 8px; background: rgba(241, 196, 15, 0.2); border: 1px solid #c0a040; border-radius: 5px; color: #c0a040; font-weight: bold;">${maxLevelPerks[business.type]}</p>` : '';

          // Color coding for illegal vs legitimate businesses
          const borderColor = businessType.paysDirty ? '#8b3a3a' : '#c0a062';
          const headerColor = businessType.paysDirty ? '#8b3a3a' : '#c0a062';

          return `
            <div style="background: rgba(20, 18, 10, 0.8); border-radius: 15px; padding: 20px; border: 2px solid ${borderColor};">
              <h4 style="color: ${headerColor}; margin-bottom: 10px;">${business.name}${businessType.paysDirty ? ' ' : ''}</h4>
              <p style="color: #f5e6c8; margin-bottom: 15px;">${businessType.description}</p>

              <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Level:</strong> ${business.level}/${businessType.maxLevel}</p>
                <p style="margin: 5px 0;"><strong>Daily Income:</strong> $${currentIncome.toLocaleString()}${businessType.paysDirty ? ' <span style="color:#8b3a3a;">(DIRTY MONEY)</span>' : ''}</p>
                <p style="margin: 5px 0;"><strong>District:</strong> ${bizDistrict ? bizDistrict.name : 'Unassigned'}${bonusPct > 0 ? ` <span style="color:#8a9a6a;">(+${bonusPct}% income bonus)</span>` : ''}</p>
                <p style="margin: 5px 0;"><strong>Laundering Capacity:</strong> $${(businessType.launderingCapacity * business.level).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Legitimacy:</strong> ${businessType.legitimacy}%</p>
                ${businessType.paysDirty ? `<p style="margin: 5px 0; color: #e67e22;"><strong>Synergy:</strong> ${business.type === 'counterfeiting' ? '+3% laundering rate' : business.type === 'druglab' ? 'Drug trade goods discount + payout boost' : 'Stolen car sale bonus'}</p>` : ''}
                ${nextUpgradeText}
                ${maxPerkText}
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="collectBusinessIncome(${index})"
                    style="background: #8a9a6a; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
                  Collect Income
                </button>
                ${business.level < businessType.maxLevel ?
                  `<button onclick="upgradeBusiness(${index})"
                      style="background: #c0a040; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;"
                      ${player.money < upgradePrice ? 'disabled title="Not enough money"' : ''}>
                    Upgrade ($${upgradePrice.toLocaleString()})
                  </button>` :
                  '<span style="color: #8a7a5a; font-style: italic;">Max Level</span>'
                }
                <button onclick="sellBusiness(${index})"
                    style="background: #8b3a3a; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer;">
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
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: rgba(20, 18, 10, 0.6); border-radius: 15px; border: 2px solid #c0a040;">
        <h3 style="color: #c0a040; margin-bottom: 15px;">No Businesses Owned</h3>
        <p style="color: #f5e6c8; margin-bottom: 20px;">Start building your business empire! Legitimate fronts provide steady income and money laundering opportunities.</p>
      </div>
    `;
  }

  // Show available businesses for purchase
  // Phase 3: district slot + bonus info
  const curDistrictId = player.currentTerritory || null;
  const curDistrict = curDistrictId ? getDistrict(curDistrictId) : null;
  const curSlots = curDistrict ? curDistrict.maxBusinesses : 0;
  const usedSlots = curDistrictId && player.businesses ? player.businesses.filter(b => b.districtId === curDistrictId).length : 0;
  const curBizMult = getBusinessMultiplier(curDistrictId);
  const curBonusPct = Math.round((curBizMult - 1) * 100);

  businessHTML += `
    <h3>Available Businesses</h3>
    ${curDistrict ? `
    <div style="margin: 10px 0 15px 0; padding: 10px 14px; background: rgba(0,0,0,0.25); border: 1px solid #c0a062; border-radius: 8px; color: #f5e6c8;">
      <strong>Your District:</strong> ${curDistrict.name} &mdash;
      Slots: ${usedSlots}/${curSlots} used${curBonusPct > 0 ? ` | <span style="color:#8a9a6a;">+${curBonusPct}% business income bonus</span>` : ''}
    </div>` : `
    <div style="margin: 10px 0 15px 0; padding: 10px 14px; background: rgba(0,0,0,0.25); border: 1px solid #8b3a3a; border-radius: 8px; color: #e67e22;">
      You must live in a district to purchase businesses. Use the Turf HUD to relocate.
    </div>`}
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin: 20px 0;">
      ${businessTypes.map(businessType => {
        const owned = player.businesses && player.businesses.some(b => b.type === businessType.id);
        const slotsFull = curSlots > 0 && usedSlots >= curSlots;
        return `
          <div style="background: rgba(20, 18, 10, 0.6); border-radius: 15px; padding: 20px; border: 2px solid ${owned ? '#8a7a5a' : '#8a9a6a'};">
            <h4 style="color: ${owned ? '#8a7a5a' : '#8a9a6a'}; margin-bottom: 10px;">${businessType.name}</h4>
            <p style="color: #f5e6c8; margin-bottom: 15px;">${businessType.description}</p>

            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Price:</strong> $${businessType.basePrice.toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Base Income:</strong> $${businessType.baseIncome.toLocaleString()}/day${businessType.paysDirty ? ' <span style="color:#8b3a3a;">(DIRTY MONEY)</span>' : ''}</p>
              <p style="margin: 5px 0;"><strong>Category:</strong> ${businessType.category}</p>
              <p style="margin: 5px 0;"><strong>Max Level:</strong> ${businessType.maxLevel}</p>
            </div>

            ${owned ?
              '<span style="color: #8a7a5a; font-style: italic;">Already Owned</span>' :
              slotsFull ? '<span style="color: #e67e22; font-style: italic;">District slots full</span>' :
              !curDistrict ? '<span style="color: #e67e22; font-style: italic;">No district selected</span>' :
              `<button onclick="purchaseBusiness('${businessType.id}')"
                  style="background: #8a9a6a; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;"
                  ${player.money < businessType.basePrice ? 'disabled title="Not enough money"' : ''}>
                Purchase Business
              </button>`
            }
          </div>
        `;
      }).join('')}
    </div>

  `;

  return businessHTML;
}

// Refresh just the fronts panel content (used by business actions)
function refreshFrontsPanel() {
  const panel = document.getElementById('panel-fronts');
  if (panel && panel.style.display !== 'none') {
    panel.innerHTML = buildBusinessesHTML();
  }
}
window.refreshFrontsPanel = refreshFrontsPanel;

// showBusinesses now redirects to Properties screen -> Fronts tab
async function showBusinesses() {
  if (player.inJail) {
    showBriefNotification("Can't manage businesses while in jail!", 'danger');
    return;
  }
  showRealEstate('fronts');
}

async function purchaseBusiness(businessTypeId) {
  const businessType = businessTypes.find(bt => bt.id === businessTypeId);
  if (!businessType) return;

  // Corruption: businessLicense discount on purchase cost
  let finalBusinessPrice = businessType.basePrice;
  const corruptBizDiscount = getCorruptionBenefit('businessLicense');
  if (corruptBizDiscount > 0) {
    finalBusinessPrice = Math.floor(finalBusinessPrice * (1 - corruptBizDiscount));
  }

  if (player.money < finalBusinessPrice) {
    showBriefNotification("You don't have enough money to purchase this business!", 'danger');
    return;
  }

  if (!player.businesses) player.businesses = [];

  // Check if already owned
  if (player.businesses.some(b => b.type === businessTypeId)) {
    showBriefNotification("You already own this type of business!", 'warning');
    return;
  }

  // Phase 3: Business placed in player's current district
  const districtId = player.currentTerritory || null;
  const district = districtId ? getDistrict(districtId) : null;

  if (!district) {
    showBriefNotification("You must live in a district before buying a business!", 'warning');
    return;
  }

  // Enforce maxBusinesses per district
  const bizInDistrict = player.businesses.filter(b => b.districtId === districtId).length;
  if (bizInDistrict >= district.maxBusinesses) {
    showBriefNotification(`${district.shortName} is full! Max ${district.maxBusinesses} businesses per district.`, 'warning');
    return;
  }

  const bizBonus = getBusinessMultiplier(districtId);
  const bonusLabel = bizBonus > 1.0 ? ` (${Math.round((bizBonus - 1) * 100)}% income bonus from ${district.shortName})` : '';

  player.money -= finalBusinessPrice;
  player.businesses.push({
    type: businessTypeId,
    name: businessType.name,
    level: 1,
    lastCollection: Date.now(),
    districtId: districtId // Phase 3: tied to district
  });

  showBriefNotification(`Purchased ${businessType.name} in ${district.shortName}!${bonusLabel}`, 'success');
  logAction(`You sign the papers and shake hands on a new business venture. ${businessType.name} is now under your control in ${district.shortName}${bonusLabel} - legitimate money incoming!`);

  updateUI();
  refreshFrontsPanel();
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
      'New printing plates installed -- the bills look even more authentic now.',
      'UV-resistant ink sourced from overseas. These fakes will pass any scanner.',
      'You expand the distribution network. More channels, more money.',
      'A master engraver joins your operation. The counterfeits are indistinguishable from the real thing.',
      'Your Counterfeiting Operation is now a world-class printing press. Even banks can\'t tell the difference.'
    ],
    druglab: [
      'Better cooking equipment means purer product and higher margins.',
      'A chemistry PhD dropout joins your team. Product quality skyrockets.',
      'Hidden ventilation installed -- no more suspicious chemical smells.',
      'Industrial-scale production begins. You\'re now a major supplier.',
      'Your Drug Lab is a state-of-the-art production facility. The cartel is impressed.'
    ],
    chopshop: [
      'Professional-grade tools speed up the dismantling process.',
      'An expert mechanic joins -- parts are now stripped with surgical precision.',
      'Advanced VIN removal technology makes every car untraceable.',
      'International buyer network established -- premium prices for premium parts.',
      'Your Chop Shop is the most efficient in the city. Cars disappear without a trace.'
    ]
  };

  const narrations = upgradeNarrations[business.type];
  if (narrations && narrations[business.level - 1]) {
    logAction(`${narrations[business.level - 1]} (${business.name} Level ${business.level})`);
  } else {
    logAction(`You invest in improvements for ${business.name}. New equipment, better staff, higher profits - the empire grows stronger (Level ${business.level}).`);
  }

  // Max level perk activation notification
  if (business.level >= businessType.maxLevel && businessType.paysDirty) {
    const perkMessages = {
      counterfeiting: 'MAX LEVEL REACHED! Your Counterfeiting Operation now provides +5% laundering conversion rate!',
      druglab: 'MAX LEVEL REACHED! Your Drug Lab now provides a massive 35% discount on drug trade goods!',
      chopshop: 'MAX LEVEL REACHED! Your Chop Shop now gives +55% bonus on all stolen car sales!'
    };
    if (perkMessages[business.type]) {
      logAction(perkMessages[business.type]);
      showBriefNotification(perkMessages[business.type], 'success');
    }
  }

  updateUI();
  refreshFrontsPanel();
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

  // Phase 3: Apply district business multiplier
  const bizMultiplier = getBusinessMultiplier(business.districtId || player.currentTerritory);

  const hourlyIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1) / 24);
  let grossIncome = Math.floor(hourlyIncome * Math.min(hoursElapsed, 48) * bizMultiplier);

  // Gang member manager bonus
  const memberBonus = getBusinessMemberBonus(business);
  if (memberBonus > 1.0) {
    grossIncome = Math.floor(grossIncome * memberBonus);
  }

  // Corruption: contractAccess boosts business income
  const corruptContractBonus = getCorruptionBenefit('contractAccess');
  if (corruptContractBonus > 0) {
    grossIncome = Math.floor(grossIncome * (1 + corruptContractBonus));
  }

  // Phase 3: Territory tax -- if business is in an owned district and owner isn't the player
  let taxAmount = 0;
  let taxOwnerName = null;
  const bizDistrict = business.districtId || player.currentTerritory;
  const tState = (typeof onlineWorldState !== 'undefined' && onlineWorldState.territories) || {};
  const terrData = tState[bizDistrict];
  const myName = (typeof onlineWorldState !== 'undefined' && onlineWorldState.username) || '';
  if (terrData && terrData.owner && terrData.owner !== myName) {
    // Use server-synced political tax rate if available, otherwise fallback
    const effectiveTaxRate = (typeof onlineWorldState !== 'undefined' && onlineWorldState.politics && onlineWorldState.politics.policies)
      ? (onlineWorldState.politics.policies.worldTaxRate || 10) / 100
      : BUSINESS_TAX_RATE;
    taxAmount = Math.floor(grossIncome * effectiveTaxRate);
    taxOwnerName = terrData.owner;
    // Notify server to credit territory owner (server recomputes authoritatively)
    if (typeof onlineWorldState !== 'undefined' && onlineWorldState.isConnected && onlineWorldState.socket) {
      onlineWorldState.socket.send(JSON.stringify({
        type: 'business_income_tax',
        district: bizDistrict,
        grossIncome: grossIncome
      }));
    }
  }

  const netIncome = grossIncome - taxAmount;

  // Illegal businesses pay dirty money; all other businesses pay clean money
  if (businessType.paysDirty) {
    player.dirtyMoney = (player.dirtyMoney || 0) + netIncome;
  } else {
    player.money += netIncome;
  }
  business.lastCollection = currentTime;

  // Track statistics
  updateStatistic('businessIncomeCollected');
  updateStatistic('totalMoneyEarned', netIncome);

  const dirtyLabel = businessType.paysDirty ? ' (dirty \u2014 must be laundered!)' : '';
  const bonusLabel = bizMultiplier > 1.0 ? ` [${Math.round((bizMultiplier - 1) * 100)}% district bonus]` : '';
  const taxLabel = taxAmount > 0 ? ` [Tax: -$${taxAmount.toLocaleString()} to ${taxOwnerName}]` : '';
  showBriefNotification(`+$${netIncome.toLocaleString()}${dirtyLabel} from ${business.name} (${hoursElapsed}h)${bonusLabel}${taxLabel}`, 'success');
  logAction(`${business.name} delivers another profitable period (+$${netIncome.toLocaleString()}${dirtyLabel}${bonusLabel}${taxLabel}).`);

  updateUI();
  refreshFrontsPanel();
}

// Collect income from ALL businesses at once
async function collectAllBusinessIncome() {
  if (!player.businesses || player.businesses.length === 0) return;

  let totalClean = 0;
  let totalDirty = 0;
  let totalTax = 0;
  let collected = 0;
  const currentTime = Date.now();
  const tState = (typeof onlineWorldState !== 'undefined' && onlineWorldState.territories) || {};
  const myName = (typeof onlineWorldState !== 'undefined' && onlineWorldState.username) || '';

  for (let i = 0; i < player.businesses.length; i++) {
    const business = player.businesses[i];
    const businessType = businessTypes.find(bt => bt.id === business.type);
    if (!businessType) continue;

    const lastCollection = business.lastCollection || currentTime;
    const hoursElapsed = Math.floor((currentTime - lastCollection) / (1000 * 60 * 60));
    if (hoursElapsed < 1) continue;

    // Phase 3: district business multiplier
    const bizMultiplier = getBusinessMultiplier(business.districtId || player.currentTerritory);

    const hourlyIncome = Math.floor(businessType.baseIncome * Math.pow(businessType.incomeMultiplier, business.level - 1) / 24);
    let grossIncome = Math.floor(hourlyIncome * Math.min(hoursElapsed, 48) * bizMultiplier);

    // Gang member manager bonus
    const memberBonus = getBusinessMemberBonus(business);
    if (memberBonus > 1.0) {
      grossIncome = Math.floor(grossIncome * memberBonus);
    }

    // Phase 3: territory tax
    let taxAmount = 0;
    const bizDistrict = business.districtId || player.currentTerritory;
    const terrData = tState[bizDistrict];
    if (terrData && terrData.owner && terrData.owner !== myName) {
      const effectiveTaxRate = (typeof onlineWorldState !== 'undefined' && onlineWorldState.politics && onlineWorldState.politics.policies)
        ? (onlineWorldState.politics.policies.worldTaxRate || 10) / 100
        : BUSINESS_TAX_RATE;
      taxAmount = Math.floor(grossIncome * effectiveTaxRate);
      if (typeof onlineWorldState !== 'undefined' && onlineWorldState.isConnected && onlineWorldState.socket) {
        onlineWorldState.socket.send(JSON.stringify({
          type: 'business_income_tax',
          district: bizDistrict,
          grossIncome: grossIncome
        }));
      }
    }
    totalTax += taxAmount;
    const netIncome = grossIncome - taxAmount;

    if (businessType.paysDirty) {
      player.dirtyMoney = (player.dirtyMoney || 0) + netIncome;
      totalDirty += netIncome;
    } else {
      player.money += netIncome;
      totalClean += netIncome;
    }
    business.lastCollection = currentTime;
    collected++;

    updateStatistic('businessIncomeCollected');
    updateStatistic('totalMoneyEarned', netIncome);
  }

  if (collected === 0) {
    showBriefNotification("No income available yet. Check back in an hour.", 'warning');
    return;
  }

  let msg = `Collected from ${collected} business${collected > 1 ? 'es' : ''}:`;
  if (totalClean > 0) msg += ` +$${totalClean.toLocaleString()} clean`;
  if (totalDirty > 0) msg += ` +$${totalDirty.toLocaleString()} dirty`;
  if (totalTax > 0) msg += ` (-$${totalTax.toLocaleString()} tax)`;

  showBriefNotification(msg, 'success');
  logAction(`\ud83d\udcb0 Collected all business income in one sweep. ${totalClean > 0 ? `$${totalClean.toLocaleString()} clean` : ''}${totalClean > 0 && totalDirty > 0 ? ', ' : ''}${totalDirty > 0 ? `$${totalDirty.toLocaleString()} dirty` : ''}${totalTax > 0 ? ` (Tax: -$${totalTax.toLocaleString()})` : ''}.`);

  updateUI();
  refreshFrontsPanel();
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
  refreshFrontsPanel();
}

// Money Laundering Functions
// Build laundering content HTML (used by both standalone screen and Properties tab)
function buildLaunderingHTML() {
  if (!player.dirtyMoney) player.dirtyMoney = 0;
  if (!player.activeLaundering) player.activeLaundering = [];

  checkLaunderingCompletions();

  let launderHTML = `
    <h2>Money Laundering</h2>
    <p>Clean your dirty money through various legitimate channels.</p>

    <div style="background: rgba(20, 18, 10, 0.6); border-radius: 10px; padding: 20px; margin: 20px 0; border: 2px solid #c0a040;">
      <h3>Current Status</h3>
      <p><strong>Dirty Money:</strong> $${player.dirtyMoney.toLocaleString()}</p>
      <p><strong>Clean Money:</strong> $${player.money.toLocaleString()}</p>
      <p><strong>Heat Level:</strong> ${player.heat || 0} / 100</p>
    </div>
  `;

  // -- Active Laundering Operations --
  if (player.activeLaundering.length > 0) {
    launderHTML += `
      <div style="background: rgba(138, 154, 106, 0.15); border-radius: 10px; padding: 20px; margin: 20px 0; border: 2px solid #8a9a6a;">
        <h3 style="color: #8a9a6a;">Active Operations</h3>
        <div id="active-laundering-ops" style="display: grid; gap: 12px;">
          ${player.activeLaundering.map(op => {
            const now = Date.now();
            const remaining = Math.max(0, op.completesAt - now);
            const totalDuration = op.completesAt - op.startedAt;
            const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - remaining) / totalDuration) * 100) : 100;
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            const isDone = remaining <= 0;

            return `
              <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 8px; border-left: 4px solid ${isDone ? '#8a9a6a' : '#c0a040'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: #f5e6c8;">${op.methodName}</strong>
                  <span style="color: ${isDone ? '#8a9a6a' : '#c0a040'}; font-weight: bold;" data-launder-timer="${op.id}">
                    ${isDone ? ' READY TO COLLECT' : `${mins}m ${secs}s remaining`}
                  </span>
                </div>
                <div style="margin: 8px 0;">
                  <div style="background: rgba(0,0,0,0.5); border-radius: 4px; height: 8px; overflow: hidden;">
                    <div data-launder-bar="${op.id}" style="height: 100%; background: ${isDone ? '#8a9a6a' : 'linear-gradient(90deg, #c0a040, #e67e22)'}; width: ${progress}%; transition: width 1s linear;"></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #aaa;">
                  <span>Dirty: $${op.amount.toLocaleString()}</span>
                  <span>Expected Clean: $${op.cleanAmount.toLocaleString()}</span>
                </div>
                ${isDone ? `<button onclick="collectLaundering('${op.id}')" style="background: #8a9a6a; color: #fff; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 8px; font-weight: bold;">Collect Clean Money</button>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (player.dirtyMoney <= 0 && player.activeLaundering.length === 0) {
    launderHTML += `
      <div style="text-align: center; margin: 40px 0; padding: 30px; background: rgba(20, 18, 10, 0.6); border-radius: 15px; border: 2px solid #8a9a6a;">
        <h3 style="color: #8a9a6a; margin-bottom: 15px;">All Money Clean</h3>
        <p style="color: #f5e6c8;">You currently have no dirty money to launder. Earn some through illegal activities first!</p>
      </div>
    `;
  } else if (player.dirtyMoney > 0) {
    launderHTML += `
      <h3>Laundering Methods</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin: 20px 0;">
        ${launderingMethods.map(method => {
          const canUse = checkLaunderingEligibility(method);
          const estimatedClean = Math.floor(Math.min(player.dirtyMoney, method.maxAmount) * method.cleanRate);

          return `
            <div style="background: rgba(20, 18, 10, 0.6); border-radius: 15px; padding: 20px; border: 2px solid ${canUse ? '#8a9a6a' : '#8a7a5a'};">
              <h4 style="color: ${canUse ? '#8a9a6a' : '#8a7a5a'};">${method.name}</h4>
              <p style="color: #f5e6c8; margin-bottom: 15px;">${method.description}</p>

              <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Clean Rate:</strong> ${(method.cleanRate * 100).toFixed(0)}%</p>
                <p style="margin: 5px 0;"><strong>Processing Time:</strong> ${method.timeRequired} min</p>
                <p style="margin: 5px 0;"><strong>Interception Risk:</strong> ${method.suspicionRisk}%</p>
                <p style="margin: 5px 0;"><strong>Range:</strong> $${method.minAmount.toLocaleString()} - $${method.maxAmount.toLocaleString()}</p>
                ${method.businessRequired ? `<p style="margin: 5px 0; color: #c0a040;"><strong>Requires:</strong> ${businessTypes.find(bt => bt.id === method.businessRequired)?.name || 'Business'}</p>` : ''}
              </div>

              ${canUse ?
                `<input type="number" id="launder-amount-${method.id}" placeholder="Amount to launder"
                    min="${method.minAmount}" max="${Math.min(player.dirtyMoney, method.maxAmount)}"
                    style="width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #d4c4a0;">
                <p style="margin: 5px 0; color: #8a9a6a;"><strong>Estimated Clean:</strong> Up to $${estimatedClean.toLocaleString()}</p>
                <button onclick="startLaundering('${method.id}')"
                    style="background: #8a9a6a; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                  Start Laundering
                </button>` :
                '<span style="color: #8b3a3a; font-style: italic;">Requirements not met</span>'
              }
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  launderHTML += `
    <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; border: 1px solid #8b3a3a; margin: 20px 0;">
      <h4 style="color: #8b3a3a;">NOTICE</h4>
      <p style="color: #f5e6c8;">Money laundering carries risks. High heat levels may attract law enforcement attention. Choose your methods carefully and don't get greedy.</p>
    </div>

    <div style="background: rgba(138, 154, 106, 0.15); padding: 20px; border-radius: 10px; border: 1px solid #8a9a6a; margin: 20px 0;">
      <h4 style="color: #8a9a6a;">TIPS</h4>
      <p style="color: #f5e6c8;">* The <strong>Money Laundering</strong> job (under Jobs) also converts dirty money to clean money at 80-95% rates.</p>
      <p style="color: #f5e6c8;">* Owning a <strong>Counterfeiting Operation</strong> business gives +3% conversion rate on the Money Laundering job.</p>
      <p style="color: #f5e6c8;">* Dirty money jobs (Bank Job, Counterfeiting Money) increase your heat level -- launder regularly!</p>
    </div>

  `;

  return launderHTML;
}

function showMoneyLaundering() {
  if (player.inJail) {
    showBriefNotification("You can't launder money while you're in jail!", 'danger');
    return;
  }

  let launderHTML = buildLaunderingHTML();
  launderHTML += `
    <div class="page-nav" style="justify-content: center;">
      <button class="nav-btn-back" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>
  `;

  document.getElementById("money-laundering-content").innerHTML = launderHTML;
  hideAllScreens();
  document.getElementById("money-laundering-screen").style.display = "block";

  startLaunderingCountdown();
}

function checkLaunderingEligibility(method) {
  if (method.minReputation && player.reputation < method.minReputation) return false;
  if (method.businessRequired && (!player.businesses || !player.businesses.some(b => b.type === method.businessRequired))) return false;
  if (method.oneTimeSetupCost && !player.launderingSetups) {
    if (player.money < method.oneTimeSetupCost) return false;
  }
  return true;
}

function startLaundering(methodId) {
  const method = launderingMethods.find(m => m.id === methodId);
  if (!method) return;

  if (!player.activeLaundering) player.activeLaundering = [];

  const amountInput = document.getElementById(`launder-amount-${methodId}`);
  const amount = parseInt(amountInput.value);

  if (!amount || amount < method.minAmount || amount > method.maxAmount) {
    showToast(`Enter a valid amount between $${method.minAmount.toLocaleString()} and $${method.maxAmount.toLocaleString()}`, 'error');
    return;
  }

  if (amount > player.dirtyMoney) {
    showToast("You don't have enough dirty money!", 'error');
    return;
  }

  // Limit concurrent operations (base 3, storage district bonus increases cap)
  const storageMult = getDistrictBenefit(player.currentTerritory, 'storage', 1);
  const maxOps = Math.floor(3 * storageMult);
  if (player.activeLaundering.length >= maxOps) {
    showToast(`You can only run ${maxOps} laundering operations at once! Wait for one to finish.`, 'error');
    return;
  }

  // Check laundering capacity from owned businesses
  const totalCapacity = (player.businesses || []).reduce((sum, biz) => {
    const bizType = businessTypes.find(bt => bt.id === biz.type);
    return sum + (bizType ? (bizType.launderingCapacity || 0) : 0);
  }, 0);
  if (totalCapacity > 0 && amount > totalCapacity) {
    showToast(`Businesses can only launder up to $${totalCapacity.toLocaleString()} at a time!`, 'error');
    return;
  }

  // One-time setup cost
  if (method.oneTimeSetupCost && (!player.launderingSetups || !player.launderingSetups.includes(methodId))) {
    if (player.money < method.oneTimeSetupCost) {
      showToast(`Need $${method.oneTimeSetupCost.toLocaleString()} for initial setup!`, 'error');
      return;
    }
    player.money -= method.oneTimeSetupCost;
    if (!player.launderingSetups) player.launderingSetups = [];
    player.launderingSetups.push(methodId);
    showToast(`Setup complete! Paid $${method.oneTimeSetupCost.toLocaleString()} for ${method.name}.`, 'success');
  }

  // Deduct dirty money
  player.dirtyMoney -= amount;

  // Roll for interception (heat-based risk)
  const riskRoll = Math.random() * 100;
  const currentHeat = player.heat || 0;
  let adjustedRisk = method.suspicionRisk + (currentHeat * 0.5);

  // Utility item: Burner Phone reduces risk by 15%
  if (hasUtilityItem('Burner Phone')) {
    adjustedRisk *= 0.85;
    logAction(`Your Burner Phone keeps communications untraceable -- interception risk reduced.`);
  }

  // International district benefit: offshore connections reduce interception risk
  const intlMult = getDistrictBenefit(player.currentTerritory, 'international', 1);
  if (intlMult > 1) {
    adjustedRisk /= intlMult; // e.g. 1.8 cuts risk nearly in half
    logAction(`International shipping connections make your money harder to trace.`);
  }

  if (riskRoll < adjustedRisk) {
    // CAUGHT -- Lose 30-70%, return the rest as dirty money
    const lossPercentage = 0.3 + (Math.random() * 0.4);
    const lost = Math.floor(amount * lossPercentage);
    const returned = amount - lost;
    const heatGain = 5 + Math.floor(Math.random() * 8);

    player.dirtyMoney += returned; // Give back the non-confiscated portion
    player.heat = Math.min(100, player.heat + heatGain);

    showToast(`Operation compromised! Lost $${lost.toLocaleString()}, $${returned.toLocaleString()} returned. +${heatGain} heat.`, 'error');
    logAction(`The operation goes sideways! Feds intercept the cash. $${lost.toLocaleString()} seized, but $${returned.toLocaleString()} dirty money was recovered. The heat is rising (+${heatGain} heat).`);
  } else {
    // SUCCESS -- Queue the laundering operation with a real timer
    const cleanAmount = Math.floor(amount * method.cleanRate);
    const heatGain = Math.floor(method.suspicionRisk * 0.05);
    const processingTimeMs = method.timeRequired * 60 * 1000; // timeRequired is in minutes (real-time)

    player.heat = Math.min(100, player.heat + heatGain);

    const operation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      methodId: method.id,
      methodName: method.name,
      amount: amount,
      cleanAmount: cleanAmount,
      startedAt: Date.now(),
      completesAt: Date.now() + processingTimeMs
    };

    player.activeLaundering.push(operation);

    const mins = Math.floor(processingTimeMs / 60000);
    const secs = Math.floor((processingTimeMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    showToast(`Laundering started! $${amount.toLocaleString()} -> $${cleanAmount.toLocaleString()} clean in ${timeStr}.`, 'success');
    logAction(`${method.name} operation initiated. $${amount.toLocaleString()} of dirty cash is being cleaned -- expect $${cleanAmount.toLocaleString()} back in ${timeStr}.`);
  }

  updateUI();
  showMoneyLaundering();
}

// Collect a completed laundering operation
function collectLaundering(opId) {
  if (!player.activeLaundering) return;

  const opIndex = player.activeLaundering.findIndex(op => op.id === opId);
  if (opIndex === -1) return;

  const op = player.activeLaundering[opIndex];
  const now = Date.now();

  if (now < op.completesAt) {
    showToast("This operation hasn't finished yet!", 'error');
    return;
  }

  // Pay out clean money -- Chen smuggling network gives bonus on collection
  let payout = op.cleanAmount;
  const collSmugBuff = getChosenFamilyBuff();
  if (collSmugBuff && collSmugBuff.smugglingMultiplier) {
    const smugBonus = Math.floor(payout * (collSmugBuff.smugglingMultiplier - 1) * 0.5); // +15% bonus
    payout += smugBonus;
    if (smugBonus > 0) logAction(`Chen Triad smuggling routes net you an extra $${smugBonus.toLocaleString()} on collection.`);
  }
  player.money += payout;
  player.activeLaundering.splice(opIndex, 1);

  // Collecting laundered money boosts underground reputation
  if (player.streetReputation) {
    player.streetReputation.underground = Math.min(100, (player.streetReputation.underground || 0) + 2);
  }

  showToast(`Collected $${payout.toLocaleString()} clean money from ${op.methodName}!`, 'success');
  logAction(`The ${op.methodName} laundering operation is complete. $${payout.toLocaleString()} of squeaky-clean cash has been added to your wallet.`);

  updateUI();
  showMoneyLaundering();
}

// Check for completed laundering operations (called periodically)
function checkLaunderingCompletions() {
  if (!player.activeLaundering || player.activeLaundering.length === 0) return;

  const now = Date.now();
  const completed = player.activeLaundering.filter(op => now >= op.completesAt);

  // Auto-collect is NOT done here -- player must manually collect via the Collect button
  // But we do notify when something finishes
  completed.forEach(op => {
    if (!op.notified) {
      op.notified = true;
      showToast(`${op.methodName} operation complete! Visit Money Laundering to collect $${op.cleanAmount.toLocaleString()}.`, 'success');
    }
  });
}

// Live countdown timer for the laundering screen
let launderingCountdownInterval = null;
function startLaunderingCountdown() {
  if (launderingCountdownInterval) {
    clearInterval(launderingCountdownInterval);
    launderingCountdownInterval = null;
  }

  if (!player.activeLaundering || player.activeLaundering.length === 0) return;

  launderingCountdownInterval = setInterval(() => {
    // If we navigated away from laundering screen, stop the timer
    const screen = document.getElementById('money-laundering-screen');
    if (!screen || screen.style.display === 'none') {
      clearInterval(launderingCountdownInterval);
      launderingCountdownInterval = null;
      return;
    }

    const now = Date.now();
    let anyChanged = false;

    player.activeLaundering.forEach(op => {
      const timerEl = document.querySelector(`[data-launder-timer="${op.id}"]`);
      const barEl = document.querySelector(`[data-launder-bar="${op.id}"]`);
      if (!timerEl) return;

      const remaining = Math.max(0, op.completesAt - now);
      const totalDuration = op.completesAt - op.startedAt;
      const progress = totalDuration > 0 ? Math.min(100, ((totalDuration - remaining) / totalDuration) * 100) : 100;

      if (remaining <= 0) {
        timerEl.textContent = ' READY TO COLLECT';
        timerEl.style.color = '#8a9a6a';
        if (barEl) {
          barEl.style.width = '100%';
          barEl.style.background = '#8a9a6a';
        }
        // Add collect button if not already there
        const parent = timerEl.closest('div[style*="background: rgba(0,0,0,0.4)"]');
        if (parent && !parent.querySelector('button')) {
          parent.style.borderLeftColor = '#8a9a6a';
          const btn = document.createElement('button');
          btn.textContent = 'Collect Clean Money';
          btn.style.cssText = 'background: #8a9a6a; color: #fff; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 8px; font-weight: bold;';
          btn.onclick = () => collectLaundering(op.id);
          parent.appendChild(btn);
          anyChanged = true;
        }
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${mins}m ${secs}s remaining`;
        if (barEl) barEl.style.width = `${progress}%`;
      }
    });
  }, 1000);
}

// Background laundering completion checker (runs every 10 seconds regardless of screen)
function startLaunderingCompletionChecker() {
  gameplayIntervals.push(setInterval(() => {
    checkLaunderingCompletions();
  }, 10000));
}

// Toast notification system for in-page feedback
function showToast(message, type = 'info') {
  // Remove old toasts
  const existing = document.querySelectorAll('.game-toast');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'game-toast';
  const bgColor = type === 'error' ? 'rgba(231, 76, 60, 0.95)'
                 : type === 'success' ? 'rgba(138, 154, 106, 0.95)'
                 : 'rgba(52, 152, 219, 0.95)';
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: ${bgColor}; color: #fff; padding: 14px 28px; border-radius: 10px;
    font-size: 1em; font-weight: bold; z-index: 99999; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    animation: toastFadeIn 0.3s ease-out; max-width: 90vw; text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// ==================== GANG MANAGEMENT OVERHAUL FUNCTIONS ====================

// Enhanced Gang Screen with Specialist Management
function showGang(activeTab) {
  if (player.inJail) {
    showBriefNotification("You can't manage your gang while you're in jail!", 'danger');
    return;
  }

  const tab = activeTab || 'roster';
  _currentGangTab = tab;

  const members = player.gang.gangMembers;
  const maxMembers = calculateMaxGangMembers();
  const power = calculateGangPower();
  const activeOps = player.gang.activeOperations.length;
  const inTraining = player.gang.trainingQueue.length;

  // Tab bar
  const tabs = [
    { id: 'roster', label: 'The Family' },
    { id: 'operations', label: 'Operations' },
    { id: 'training', label: 'Training' },
    { id: 'recruitment', label: 'Recruitment' }
  ];

  let gangHTML = `
    <div class="ops-tabs" style="margin-bottom: 0;">
      ${tabs.map(t => `<button class="ops-tab${tab === t.id ? ' active' : ''}" onclick="showGang('${t.id}')">${t.label}${t.id === 'operations' && activeOps > 0 ? `<span class="ops-tab-count" style="display:inline-block;background:#8b0000;color:#f5e6c8;font-size:0.7em;padding:1px 6px;border-radius:2px;margin-left:6px;vertical-align:middle;font-family:Arial,sans-serif;">${activeOps}</span>` : ''}${t.id === 'training' && inTraining > 0 ? `<span class="ops-tab-count" style="display:inline-block;background:#1abc9c;color:#fff;font-size:0.7em;padding:1px 6px;border-radius:2px;margin-left:6px;vertical-align:middle;font-family:Arial,sans-serif;">${inTraining}</span>` : ''}</button>`).join('')}
    </div>
  `;

  // ===== ROSTER TAB =====
  if (tab === 'roster') {
    // Overview stats row
    gangHTML += `
      <div style="display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap;">
        <div class="game-card" style="flex:1; min-width:120px; text-align:center;">
          <div style="font-size:1.6em; color:#c0a062; font-weight:bold;">${members.length}<span style="font-size:0.5em; color:#8a7a5a;">/${maxMembers}</span></div>
          <div style="font-size:0.8em; color:#8a7a5a; text-transform:uppercase; letter-spacing:1px;">Members</div>
        </div>
        <div class="game-card" style="flex:1; min-width:120px; text-align:center;">
          <div style="font-size:1.6em; color:#c0a062; font-weight:bold;">${power}</div>
          <div style="font-size:0.8em; color:#8a7a5a; text-transform:uppercase; letter-spacing:1px;">Gang Power</div>
        </div>
        <div class="game-card" style="flex:1; min-width:120px; text-align:center;">
          <div style="font-size:1.6em; color:#8b3a3a; font-weight:bold;">${activeOps}</div>
          <div style="font-size:0.8em; color:#8a7a5a; text-transform:uppercase; letter-spacing:1px;">Active Ops</div>
        </div>
        <div class="game-card" style="flex:1; min-width:120px; text-align:center;">
          <div style="font-size:1.6em; color:#1abc9c; font-weight:bold;">${inTraining}</div>
          <div style="font-size:0.8em; color:#8a7a5a; text-transform:uppercase; letter-spacing:1px;">In Training</div>
        </div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
        <button onclick="collectTribute()" class="store-buy-btn store-buy-btn--active" style="padding:10px 18px;">Collect Tribute</button>
        <button onclick="showGang('recruitment')" class="store-buy-btn store-buy-btn--active" style="padding:10px 18px; background:linear-gradient(180deg,#8a9a6a,#6a7a4a);">Recruit Members</button>
      </div>
    `;

    // Member roster
    if (members.length === 0) {
      gangHTML += `<div class="game-card" style="text-align:center; padding:40px;">
        <p style="font-size:1.2em; color:#8a7a5a;">No crew members yet.</p>
        <button onclick="showGang('recruitment')" class="store-buy-btn store-buy-btn--active" style="padding:12px 25px; margin-top:10px;">
          Recruit Your First Member
        </button>
      </div>`;
    } else {
      gangHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">';

      members.forEach((member, index) => {
        let statusText = member.arrested ? 'Arrested' :
                  member.onOperation ? 'On Operation' :
                  member.inTraining ? 'In Training' :
                  member.assignedTo && member.assignedTo.startsWith('business_') ? 'Managing Business' :
                  'Available';
        const statusColor = member.arrested ? '#8b3a3a' : member.onOperation ? '#c0a040' : member.inTraining ? '#1abc9c' : member.assignedTo && member.assignedTo.startsWith('business_') ? '#c0a062' : '#8a9a6a';

        if (member.onOperation) {
          const opData = player.gang.activeOperations.find(op => op.memberName === member.name);
          if (opData) {
            const remaining = Math.max(0, (opData.startTime + opData.duration) - Date.now());
            statusText += remaining > 0 ? ` (${formatCountdown(remaining)})` : ' (Completing...)';
          }
        }
        if (member.inTraining) {
          const trainData = player.gang.trainingQueue.find(t => t.memberName === member.name);
          if (trainData) {
            const remaining = Math.max(0, (trainData.startTime + trainData.duration) - Date.now());
            statusText += remaining > 0 ? ` (${formatCountdown(remaining)})` : ' (Completing...)';
          }
        }

        const expandedRole = member.role ? GANG_MEMBER_ROLES[member.role] : null;
        const role = specialistRoles.find(r => r.id === member.specialization);
        const roleName = expandedRole ? `${expandedRole.name}` : (role ? role.name : 'Unassigned');
        const perkText = expandedRole && expandedRole.perk ? `<div style="font-size:0.8em;color:#6a5a3a;margin-top:2px;"><em>${expandedRole.perk.name}</em> -- ${expandedRole.perk.effect}</div>` : '';
        const expLevel = member.experienceLevel || 1;
        const memberXP = member.xp || 0;
        const xpNeeded = getMemberXPToLevel(expLevel);
        const xpPct = expLevel >= 10 ? 100 : Math.min(100, Math.floor((memberXP / xpNeeded) * 100));
        const tribute = Math.floor((member.tributeMultiplier || 1) * 100);
        const daysActive = Math.floor((Date.now() - (member.joinedDate || Date.now())) / (1000 * 60 * 60 * 24));

        // Business assignment
        const businesses = player.businesses || [];
        const isManagingBusiness = member.assignedTo && member.assignedTo.startsWith('business_');
        let businessHTML = '';
        if (!member.onOperation && !member.inTraining && !member.arrested) {
          if (isManagingBusiness) {
            const bIdx = parseInt(member.assignedTo.replace('business_', ''));
            const biz = businesses[bIdx];
            businessHTML = `<div style="margin-top:6px;font-size:0.85em;color:#c0a062;">Managing: ${biz ? biz.name : 'Unknown'} <button onclick="unassignMemberFromBusiness(${bIdx});showGang('roster');" style="background:#8b3a3a;color:#f5e6c8;border:none;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:0.85em;margin-left:4px;">Remove</button></div>`;
          } else if (businesses.length > 0) {
            const unmanaged = businesses.map((b, i) => ({ b, i })).filter(({ b }) => !b.assignedMember);
            if (unmanaged.length > 0) {
              businessHTML = `<div style="margin-top:6px;"><select id="biz-assign-${index}" style="padding:3px;font-size:0.8em;width:65%;"><option value="">Assign to business...</option>${unmanaged.map(({ b, i }) => `<option value="${i}">${b.name}</option>`).join('')}</select> <button onclick="var s=document.getElementById('biz-assign-${index}');if(s.value!==''){assignMemberToBusiness(${index},parseInt(s.value));showGang('roster');}" style="background:#1abc9c;color:#fff;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:0.8em;">Assign</button></div>`;
            }
          }
        }

        gangHTML += `
          <div class="game-card game-card--accent-left" style="--card-accent:${statusColor};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <h4 style="margin:0; color:#f5e6c8; font-size:1.05em;">${member.name}</h4>
              <span style="font-size:0.8em; color:${statusColor}; font-weight:bold;">${statusText}</span>
            </div>
            <div style="font-size:0.9em; color:#d4c4a0; margin-bottom:6px;">
              <div style="display:flex; justify-content:space-between;">
                <span>Role: <strong>${roleName}</strong></span>
                <span>Lv. ${expLevel}${expLevel >= 10 ? ' (MAX)' : ''}</span>
              </div>
              <div style="background:#1a1610;border-radius:4px;height:6px;margin:4px 0;overflow:hidden;border:1px solid #3a3520;">
                <div style="height:100%;width:${xpPct}%;background:${expLevel >= 10 ? '#d4af37' : '#c0a062'};transition:width 0.3s;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.9em;">
                <span>Power: ${member.power || 5}</span>
                <span>Tribute: $${tribute}/cycle <span style="color:${memberPaysCleanCash(member) ? '#4CAF50' : '#e67e22'}; font-weight:bold;">(${memberPaysCleanCash(member) ? 'Clean' : 'Dirty'})</span></span>
              </div>
              ${perkText}
              <div style="font-size:0.8em; color:#6a5a3a; margin-top:2px;">${daysActive > 0 ? daysActive + ' day' + (daysActive > 1 ? 's' : '') + ' in crew' : 'Just joined'}</div>
            </div>
            ${businessHTML}
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:8px;">
              ${!member.onOperation && !member.inTraining && !member.arrested ? `
                <button onclick="startTraining(${index})" style="background:#1abc9c; color:white; padding:5px 10px; border:none; border-radius:3px; cursor:pointer; font-size:0.8em;">Train</button>
                <button onclick="fireGangMember(${index});showGang('roster');" style="background:#8a7a5a; color:white; padding:5px 10px; border:none; border-radius:3px; cursor:pointer; font-size:0.8em;">Fire</button>
              ` : ''}
            </div>
          </div>
        `;
      });

      gangHTML += '</div>';
    }
  }

  // ===== OPERATIONS TAB =====
  if (tab === 'operations') {
    gangHTML += `
      <div style="margin-top:20px;">
        <p style="color:#8a7a5a;">Assign crew members to criminal operations. Each operation requires a specific role.</p>
        ${generateGangOperationsHTML()}
      </div>
    `;
  }

  // ===== TRAINING TAB =====
  if (tab === 'training') {
    gangHTML += `
      <div style="margin-top:20px;">
        <p style="color:#8a7a5a;">Enroll crew members in training programs to improve their skills and level.</p>
        ${generateTrainingProgramsHTML()}
      </div>
    `;
  }

  // ===== RECRUITMENT TAB =====
  if (tab === 'recruitment') {
    if (availableRecruits.length === 0) {
      generateAvailableRecruits();
    }
    gangHTML += generateRecruitmentHTML();
  }

  gangHTML += `
    <div class="page-nav" style="justify-content: center; margin-top: 20px;">
      <button class="nav-btn-back" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>
  `;

  document.getElementById("gang-content").innerHTML = gangHTML;
  hideAllScreens();
  document.getElementById("gang-screen").style.display = "block";

  if (tab === 'roster') {
    checkForBetrayals();
  }
}

// Generate the recruitment tab content HTML (used by both showGang and showRecruitment)
function generateRecruitmentHTML() {
  let html = `
    <div style="margin-top:20px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: rgba(192, 160, 98, 0.15); border-radius: 2px; border: 1px solid rgba(192, 160, 98, 0.4);">
        <h3 style="color: #c0a062; margin: 0; font-family: var(--font-heading);">Talent Scouting Active</h3>
        <p style="margin: 10px 0 0 0; font-size: 1.05em; color: #ccc;">Find fresh blood to join your criminal organization. Higher level recruits generate more tribute but cost more.</p>
      </div>

      <div style="margin-bottom: 20px; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 2px; border: 1px solid rgba(192, 160, 98, 0.3);">
        <h4 style="color: #c0a062; margin-top: 0; font-family: var(--font-heading);">Experience Level Guide:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 10px;">
          <div class="game-card" style="border-left:3px solid #8a7a5a;">
            <strong style="color: #8a7a5a;">Levels 1-3: Rookies</strong><br>
            <small>Common (85% chance) -- Standard tribute</small>
          </div>
          <div class="game-card" style="border-left:3px solid #c0a062;">
            <strong style="color: #c0a062;">Levels 4-6: Experienced</strong><br>
            <small>Rare (12% chance) -- +20-80% tribute</small>
          </div>
          <div class="game-card" style="border-left:3px solid #8b3a3a;">
            <strong style="color: #8b3a3a;">Levels 7-10: Veterans</strong><br>
            <small>Legendary (3% chance) -- +110-200% tribute</small>
          </div>
        </div>
      </div>

      <h3 style="text-align: center; color: #c0a062; margin-bottom: 15px; font-family: var(--font-heading);">Available Recruits (${availableRecruits.length} found):</h3>

      ${window._pendingSpecialRecruit ? (() => {
        const sr = window._pendingSpecialRecruit;
        const canAffordSR = player.money >= sr.cost;
        return `
        <div class="game-card" style="margin-bottom: 20px; border: 2px solid #f0c040; box-shadow: 0 0 15px rgba(240,192,64,0.25);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="background: #f0c040; color: #1a1a1a; padding: 4px 10px; border-radius: 2px; font-weight: bold; font-size: 0.9em;">SPECIAL RECRUIT</span>
            <span style="color: #f0c040; font-size: 0.9em;">Word-of-mouth referral</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 220px;">
              <h4 style="color: #f0c040; margin: 0 0 8px 0; font-size: 1.25em;">${sr.name}</h4>
              <div style="margin-bottom: 8px;">
                <span class="game-card__badge" style="background: #c0a062; color: white;">Level ${sr.experienceLevel} Experienced</span>
                <span class="game-card__badge" style="background: rgba(20,18,10,0.8); color: white; margin-left: 8px;">${sr.skill}</span>
              </div>
              <div style="font-size: 0.95em; color: #ccc;"><strong>Power:</strong> +${sr.power} &nbsp; <strong>Tribute:</strong> ${(sr.tributeMultiplier * 100).toFixed(0)}%</div>
            </div>
            <div style="text-align: right; margin-left: 15px;">
              <div class="game-card__price" style="font-size: 1.2em; margin-bottom: 10px;">$${sr.cost.toLocaleString()}</div>
              <button onclick="hireSpecialRecruit()"
                  ${canAffordSR ? '' : 'disabled'}
                  class="store-buy-btn ${canAffordSR ? 'store-buy-btn--active' : 'store-buy-btn--disabled'}">
                ${canAffordSR ? 'Recruit' : 'Too Expensive'}
              </button>
            </div>
          </div>
        </div>`;
      })() : ''}

      <ul style="list-style: none; padding: 0; margin: 0;">
        ${availableRecruits.map((recruit, index) => {
          const canAfford = player.money >= recruit.cost;
          const levelColor = recruit.experienceLevel <= 3 ? '#8a7a5a' :
                  recruit.experienceLevel <= 6 ? '#c0a062' : '#8b3a3a';
          const levelText = recruit.experienceLevel <= 3 ? 'Rookie' :
                  recruit.experienceLevel <= 6 ? 'Experienced' : 'Veteran';
          const expandedRoleKey = SPECIALIZATION_TO_EXPANDED[recruit.specialization];
          const expandedRoleData = expandedRoleKey ? GANG_MEMBER_ROLES[expandedRoleKey] : null;
          const displayRoleName = expandedRoleData ? expandedRoleData.name : (recruit.specialization.charAt(0).toUpperCase() + recruit.specialization.slice(1));
          const isCleanMoney = expandedRoleData ? expandedRoleData.cleanCashTribute : false;
          const moneyTypeLabel = isCleanMoney ? 'Clean' : 'Dirty';
          const moneyTypeColor = isCleanMoney ? '#5a8a5a' : '#8a5a5a';

          return `
            <li class="game-card game-card--tier" style="--card-accent: ${levelColor}; margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div style="flex: 1; min-width: 220px;">
                  <h4 class="game-card__title" style="color: ${levelColor}; margin: 0 0 10px 0; font-size: 1.2em;">${recruit.name}</h4>
                  <div style="margin-bottom: 10px;">
                    <span class="game-card__badge" style="background: ${levelColor}; color: white;">Level ${recruit.experienceLevel} ${levelText}</span>
                    <span class="game-card__badge" style="background: rgba(20, 18, 10, 0.8); color: white; margin-left: 8px;">${displayRoleName}</span>
                    <span class="game-card__badge" style="background: ${moneyTypeColor}; color: white; margin-left: 8px;">${moneyTypeLabel} Money</span>
                  </div>
                  <div style="font-size: 0.95em;"><strong>Tribute:</strong> ${(recruit.tributeMultiplier * 100).toFixed(0)}%</div>
                </div>
                <div style="text-align: right; margin-left: 15px;">
                  <div class="game-card__price" style="font-size: 1.2em; margin-bottom: 10px;">$${recruit.cost.toLocaleString()}</div>
                  <button onclick="recruitMember(${index})"
                      ${canAfford ? '' : 'disabled'}
                      class="store-buy-btn ${canAfford ? 'store-buy-btn--active' : 'store-buy-btn--disabled'}">
                    ${canAfford ? 'Recruit' : 'Too Expensive'}
                  </button>
                </div>
              </div>
            </li>
          `;
        }).join('')}
      </ul>

      <div style="text-align: center; margin-top: 20px;">
        <button onclick="refreshRecruits()"
            class="store-buy-btn store-buy-btn--active" style="padding:12px 25px;">
          Look for New Recruits ($500)
        </button>
      </div>
    </div>
  `;
  return html;
}

// Crew Details screen - redirects to roster tab
function showGangManagementScreen() {
  showGang('roster');
  return;

  // LEGACY CODE BELOW - kept for reference during transition
  if (player.inJail) {
    showBriefNotification("You can't manage your gang while you're in jail!", 'warning');
    return;
  }

  const members = player.gang.gangMembers;
  const maxMembers = calculateMaxGangMembers();

  let crewHTML = `
    <h2>Crew Details</h2>
    <p>Manage individual crew members and assign specializations.</p>

    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
      <div style="background: rgba(20, 18, 10,0.8); padding: 12px 20px; border-radius: 8px; border: 1px solid #c0a062;">
        <strong style="color: #c0a062;">Roster:</strong> ${members.length} / ${maxMembers}
      </div>
      <div style="background: rgba(20, 18, 10,0.8); padding: 12px 20px; border-radius: 8px; border: 1px solid #8b6a4a;">
        <strong style="color: #8b6a4a;">Total Power:</strong> ${calculateGangPower()}
      </div>
    </div>
  `;

  if (members.length === 0) {
    crewHTML += `<div style="text-align:center; padding:40px; background:rgba(20, 18, 10,0.6); border-radius:10px;">
      <p style="font-size:1.2em;">No crew members yet.</p>
      <button onclick="showRecruitment()" style="background:#8a9a6a; color:white; padding:12px 25px; border:none; border-radius:8px; cursor:pointer; font-size:1.1em; margin-top:10px;">
        Recruit Your First Member
      </button>
    </div>`;
  } else {
    crewHTML += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">';

    members.forEach((member, index) => {
      let statusText = member.arrested ? 'Arrested' :
                member.onOperation ? 'On Operation' :
                member.inTraining ? 'In Training' : 'Available';
      const statusColor = member.arrested ? '#8b3a3a' : member.onOperation ? '#c0a040' : member.inTraining ? '#8b6a4a' : '#8a9a6a';

      // Add countdown timer to status
      if (member.onOperation) {
        const opData = player.gang.activeOperations.find(op => op.memberName === member.name);
        if (opData) {
          const remaining = Math.max(0, (opData.startTime + opData.duration) - Date.now());
          if (remaining > 0) {
            statusText += ` (${formatCountdown(remaining)})`;
          } else {
            statusText += ' (Completing...)';
          }
        }
      }
      if (member.inTraining) {
        const trainData = player.gang.trainingQueue.find(t => t.memberName === member.name);
        if (trainData) {
          const remaining = Math.max(0, (trainData.startTime + trainData.duration) - Date.now());
          if (remaining > 0) {
            statusText += ` (${formatCountdown(remaining)})`;
          } else {
            statusText += ' (Completing...)';
          }
        }
      }
      const role = member.specialization || 'none';
      const expandedRoleName = member.role && GANG_MEMBER_ROLES[member.role] ? GANG_MEMBER_ROLES[member.role].name : null;
      const roleName = expandedRoleName || (role !== 'none' ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unassigned');
      const expLevel = member.experienceLevel || 1;
      const tribute = Math.floor((member.tributeMultiplier || 1) * 100);
      const daysActive = Math.floor((Date.now() - (member.joinedDate || Date.now())) / (1000 * 60 * 60 * 24));

      crewHTML += `
        <div style="background: rgba(20, 18, 10,0.8); padding: 15px; border-radius: 10px; border-left: 4px solid #c0a062;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="margin:0; color:#f5e6c8;">${member.name}</h4>
            <span style="font-size:0.8em; color: ${statusColor};">${statusText}</span>
          </div>

          <div style="font-size:0.9em; color:#d4c4a0; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between;">
              <span>Role: <strong>${roleName}</strong></span>
              <span>Lv. ${expLevel}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Power: ${member.power || 5}</span>
              <span>Tribute: $${tribute}/cycle <span style="color: ${memberPaysCleanCash(member) ? '#4CAF50' : '#e67e22'}; font-weight: bold;">(${memberPaysCleanCash(member) ? 'Clean' : 'Dirty'})</span></span>
            </div>
            <div style="font-size:0.85em; color:#6a5a3a;">${daysActive > 0 ? daysActive + ' day' + (daysActive > 1 ? 's' : '') + ' in crew' : 'Just joined'}</div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${!member.onOperation && !member.inTraining ? `
              <button onclick="startTraining(${index})" style="background:#1abc9c; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;">
                Train
              </button>
              <button onclick="fireGangMember(${index})" style="background:#8a7a5a; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer; font-size:0.8em;">
                Fire
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    crewHTML += '</div>';
  }

  crewHTML += `
    <div class="page-nav" style="gap: 10px;">
      <button class="nav-btn-back" onclick="showGang()">
        <- Back to The Family
      </button>
      <button class="nav-btn-back" onclick="goBackToMainMenu()">
        <- Back to SafeHouse
      </button>
    </div>
  `;

  document.getElementById("gang-content").innerHTML = crewHTML;
  hideAllScreens();
  document.getElementById("gang-screen").style.display = "block";
}

// Calculate total gang power
// Accepts members with either legacy specialization or expanded role
function calculateGangPower() {
  let totalPower = 0;
  player.gang.gangMembers.forEach(member => {
    const hasLegacyRole = specialistRoles.find(r => r.id === member.specialization);
    const hasExpandedRole = member.role && EXPANDED_TO_SPECIALIZATION[member.role];
    if (hasLegacyRole || hasExpandedRole) {
      totalPower += ((member.experienceLevel || 1) * 20);
    }
  });
  // Kozlov Iron Discipline: +25% gang member effectiveness
  const gangBuff = getChosenFamilyBuff();
  if (gangBuff && gangBuff.gangEffectiveness) {
    totalPower = Math.floor(totalPower * gangBuff.gangEffectiveness);
  }
  // District benefit: recruitment boosts gang power in that district
  if (player.currentTerritory) {
    const recruitMult = getDistrictBenefit(player.currentTerritory, 'recruitment');
    if (recruitMult > 1) { totalPower = Math.floor(totalPower * recruitMult); }
  }
  return Math.floor(totalPower);
}

// Generate gang operations HTML
function generateGangOperationsHTML() {
  let html = "";

  gangOperations.forEach(operation => {
    const availableMembers = getAvailableMembersForOperation(operation.requiredRole);
    const isOnCooldown = isOperationOnCooldown(operation.id);
    // Check if this operation is currently running
    const activeOp = player.gang.activeOperations.find(op => op.operationId === operation.id);
    let activeOpStatus = '';
    if (activeOp) {
      const remaining = Math.max(0, (activeOp.startTime + activeOp.duration) - Date.now());
      activeOpStatus = `<div style="margin:6px 0;padding:6px 8px;background:rgba(192,160,98,0.15);border:1px solid #c0a040;border-radius:4px;">
        <small style="color:#c0a040;"><strong>In Progress:</strong> ${activeOp.memberName} — ${remaining > 0 ? formatCountdown(remaining) + ' remaining' : 'Completing...'}</small>
      </div>`;
    }
    let cooldownStatus = '';
    if (isOnCooldown && !activeOp) {
      const cdEnd = (player.gang.operationCooldowns || {})[operation.id] || 0;
      const cdRemaining = Math.max(0, cdEnd - Date.now());
      cooldownStatus = `<div style="margin:4px 0;"><small style="color:#8b3a3a;">Cooldown: ${formatCountdown(cdRemaining)}</small></div>`;
    }

    html += `
      <div style="margin: 10px 0; padding: 10px; background: rgba(20, 18, 10, 0.4); border-radius: 5px;">
        <h5>${operation.name}</h5>
        <p><small>${operation.description}</small></p>
        <div style="margin: 5px 0;">
          <small><strong>Required:</strong> ${(() => { const eKey = SPECIALIZATION_TO_EXPANDED[operation.requiredRole]; const eName = eKey && GANG_MEMBER_ROLES[eKey] ? GANG_MEMBER_ROLES[eKey].name : null; return eName || operation.requiredRole.charAt(0).toUpperCase() + operation.requiredRole.slice(1); })()}</small><br>
          <small><strong>Duration:</strong> ${operation.duration} hours</small><br>
          <small><strong>Reward:</strong> $${operation.rewards.money[0]}-${operation.rewards.money[1]}</small>
        </div>
        ${activeOpStatus}
        ${cooldownStatus}
        <select id="member-select-${operation.id}" style="margin: 5px 0; padding: 5px; width: 100%;">
          <option value="">Select a member</option>
          ${availableMembers.map(member => {
            const eName = member.role && GANG_MEMBER_ROLES[member.role] ? GANG_MEMBER_ROLES[member.role].name : member.specialization;
            return `<option value="${member.name}">${member.name} (${eName}, Lvl ${member.experienceLevel || 1})</option>`;
          }).join('')}
        </select>
        <button onclick="startGangOperation('${operation.id}')"
            style="background: #8b3a3a; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px; width: 100%;"
            ${availableMembers.length === 0 || isOnCooldown || activeOp ? 'disabled' : ''}>
          ${activeOp ? 'In Progress' : (isOnCooldown ? 'On Cooldown' : (availableMembers.length === 0 ? 'No Available Members' : 'Start Operation'))}
        </button>
      </div>
    `;
  });

  return html || '<p>No gang operations available</p>';
}

// Get available members for a specific operation role
// Checks both legacy specialization AND expanded role (via mapping)
function getAvailableMembersForOperation(requiredRole) {
  return player.gang.gangMembers.filter(member => {
    const matchesSpecialization = member.specialization === requiredRole;
    const expandedKey = SPECIALIZATION_TO_EXPANDED[requiredRole];
    const matchesExpandedRole = expandedKey && member.role === expandedKey;
    return (matchesSpecialization || matchesExpandedRole) &&
      !member.onOperation &&
      !member.inTraining &&
      !member.arrested;
  });
}

// Check if operation is on cooldown
function isOperationOnCooldown(operationId) {
  if (!player.gang.operationCooldowns) player.gang.operationCooldowns = {};
  const cooldownEnd = player.gang.operationCooldowns[operationId];
  if (!cooldownEnd) return false;
  if (Date.now() < cooldownEnd) return true;
  // Cooldown expired -- clean up
  delete player.gang.operationCooldowns[operationId];
  return false;
}

// Format milliseconds into a human-readable countdown string
function formatCountdown(ms) {
  if (ms <= 0) return 'Done';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Generate gang members HTML
function generateGangMembersHTML() {
  if (player.gang.gangMembers.length === 0) {
    return '<p>No gang members yet. <button onclick="showGang(\'recruitment\')">Recruit your first member</button></p>';
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px;">';

  player.gang.gangMembers.forEach((member, index) => {
    const role = specialistRoles.find(r => r.id === member.specialization);
    // Prefer expanded role name (richer info) over legacy specialization name
    const expandedRole = member.role ? GANG_MEMBER_ROLES[member.role] : null;
    const roleName = expandedRole ? `${expandedRole.icon || ''} ${expandedRole.name}`.trim() : (role ? role.name : 'Unassigned');
    const perkText = expandedRole && expandedRole.perk ? `<br><strong>Perk:</strong> <em>${expandedRole.perk.name}</em> -- ${expandedRole.perk.effect}` : '';
    let statusText = member.arrested ? 'Arrested' :
             member.onOperation ? 'On Operation' :
             member.inTraining ? 'In Training' :
             member.assignedTo && member.assignedTo.startsWith('business_') ? 'Managing Business' :
             'Available';

    // Add countdown timer to status
    if (member.onOperation) {
      const opData = player.gang.activeOperations.find(op => op.memberName === member.name);
      if (opData) {
        const remaining = Math.max(0, (opData.startTime + opData.duration) - Date.now());
        if (remaining > 0) {
          statusText += ` (${formatCountdown(remaining)})`;
        } else {
          statusText += ' (Completing...)';
        }
      }
    }
    if (member.inTraining) {
      const trainData = player.gang.trainingQueue.find(t => t.memberName === member.name);
      if (trainData) {
        const remaining = Math.max(0, (trainData.startTime + trainData.duration) - Date.now());
        if (remaining > 0) {
          statusText += ` (${formatCountdown(remaining)})`;
        } else {
          statusText += ' (Completing...)';
        }
      }
    }

    const loyaltyColor = '#c0a062';

    // XP/Level progress
    const memberLevel = Math.floor(member.experienceLevel || 1);
    const memberXP = member.xp || 0;
    const xpNeeded = getMemberXPToLevel(memberLevel);
    const xpPct = memberLevel >= 10 ? 100 : Math.min(100, Math.floor((memberXP / xpNeeded) * 100));

    // Business assignment options
    const businesses = player.businesses || [];
    const isManagingBusiness = member.assignedTo && member.assignedTo.startsWith('business_');
    let businessHTML = '';
    if (!member.onOperation && !member.inTraining && !member.arrested) {
      if (isManagingBusiness) {
        const bIdx = parseInt(member.assignedTo.replace('business_', ''));
        const biz = businesses[bIdx];
        businessHTML = `<div style="margin-top:6px;font-size:0.85em;color:#c0a062;">Managing: ${biz ? biz.name : 'Unknown'} <button onclick="unassignMemberFromBusiness(${bIdx})" style="background:#8b3a3a;color:#f5e6c8;border:none;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:0.85em;margin-left:4px;">Remove</button></div>`;
      } else if (businesses.length > 0) {
        const unmanaged = businesses.map((b, i) => ({ b, i })).filter(({ b }) => !b.assignedMember);
        if (unmanaged.length > 0) {
          businessHTML = `<div style="margin-top:6px;"><select id="biz-assign-${index}" style="padding:3px;font-size:0.8em;width:65%;"><option value="">Assign to business...</option>${unmanaged.map(({ b, i }) => `<option value="${i}">${b.name}</option>`).join('')}</select> <button onclick="var s=document.getElementById('biz-assign-${index}');if(s.value!=='')assignMemberToBusiness(${index},parseInt(s.value));" style="background:#1abc9c;color:#fff;border:none;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:0.8em;">Assign</button></div>`;
        }
      }
    }

    html += `
      <div style="background: rgba(20, 18, 10, 0.6); padding: 15px; border-radius: 8px; border-left: 4px solid ${loyaltyColor};">
        <h5 style="margin: 0 0 10px 0;">${member.name}</h5>
        <div style="font-size: 0.9em;">
          <strong>Role:</strong> ${roleName}${perkText}<br>
          <strong>Level:</strong> ${memberLevel}${memberLevel >= 10 ? ' (MAX)' : ''}<br>
          <div style="background:#1a1610;border-radius:4px;height:8px;margin:3px 0 5px;overflow:hidden;border:1px solid #3a3520;">
            <div style="height:100%;width:${xpPct}%;background:${memberLevel >= 10 ? '#d4af37' : '#c0a062'};transition:width 0.3s;"></div>
          </div>
          <small style="color:#8a7a5a;">${memberLevel >= 10 ? 'Max Level' : `XP: ${memberXP}/${xpNeeded}`}</small><br>
          <strong>Status:</strong> ${statusText}<br>
          <strong>Tribute:</strong> $${Math.floor(member.tributeMultiplier * 100)}/collection
          <span style="color: ${memberPaysCleanCash(member) ? '#4CAF50' : '#e67e22'}; font-weight: bold;">(${memberPaysCleanCash(member) ? 'Clean' : 'Dirty'})</span>
        </div>
        ${businessHTML}

        <div style="margin-top: 10px;">
          ${!member.onOperation && !member.inTraining ? `
            <button onclick="startTraining(${index})" style="background: #1abc9c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin: 2px; font-size: 0.8em;">
              Train
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
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px;">';

  trainingPrograms.forEach(program => {
    const availableMembers = getAvailableMembersForTraining(program.availableFor);

    html += `
      <div style="background: rgba(20, 18, 10, 0.6); padding: 15px; border-radius: 8px;">
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
          ${availableMembers.map(member => {
            const eName = member.role && GANG_MEMBER_ROLES[member.role] ? GANG_MEMBER_ROLES[member.role].name : member.specialization;
            return `<option value="${member.name}">${member.name} (${eName})</option>`;
          }).join('')}
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
// Checks both legacy specialization AND expanded role (via mapping)
function getAvailableMembersForTraining(availableFor) {
  return player.gang.gangMembers.filter(member => {
    const matchesSpecialization = availableFor.includes(member.specialization);
    const mappedSpec = EXPANDED_TO_SPECIALIZATION[member.role];
    const matchesExpandedRole = mappedSpec && availableFor.includes(mappedSpec);
    return (matchesSpecialization || matchesExpandedRole) &&
      !member.onOperation &&
      !member.inTraining;
  });
}

// Start a gang operation
function startGangOperation(operationId) {
  const operation = gangOperations.find(op => op.id === operationId);
  if (!operation) return;

  const memberSelect = document.getElementById(`member-select-${operationId}`);
  const selectedMemberName = memberSelect.value;

  if (!selectedMemberName) {
    showBriefNotification('Please select a gang member for this operation.', 'warning');
    return;
  }

  const member = player.gang.gangMembers.find(m => m.name === selectedMemberName);
  if (!member) return;

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

  showBriefNotification(`${member.name} has started the ${operation.name} operation. It will complete in ${operation.duration} hours.`, 'success');
  logAction(`${member.name} heads out on a ${operation.name} mission. The crew is earning their keep while you handle bigger things.`);

  updateUI();
  showGang('operations');
}

// Complete a gang operation
function completeGangOperation(operationData) {
  const operation = gangOperations.find(op => op.id === operationData.operationId);
  const member = player.gang.gangMembers.find(m => m.name === operationData.memberName);

  if (!operation || !member) return;

  member.onOperation = false;

  // Calculate success based on member stats and operation risks
  const successChance = 60 + ((member.experienceLevel || 1) * 8);
  const betrayalRoll = Math.random() * 100;
  const arrestRoll = Math.random() * 100;

  // Check for death -- operations are dangerous
  if (Math.random() < 0.08) {
    const memberIndex = player.gang.gangMembers.indexOf(member);
    if (memberIndex !== -1) {
      player.gang.gangMembers.splice(memberIndex, 1);
      player.gang.members = player.gang.gangMembers.length;
    }
    player.gang.activeOperations = player.gang.activeOperations.filter(op => op !== operationData);
    showBriefNotification(`${member.name} was killed during the ${operation.name}. The streets are unforgiving.`, 'danger');
    logAction(`${member.name} didn't make it back from the ${operation.name}. Another soldier lost to the game.`);
    updateUI();
    return;
  }

  // Check for betrayal
  if (betrayalRoll < operation.risks.betrayalRisk) {
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

  // Update member stats -- members gain XP and level up
  const xpGained = operation.rewards.experience || 50;
  member.xp = (member.xp || 0) + xpGained;
  const xpToLevel = getMemberXPToLevel(member.experienceLevel || 1);
  if (member.xp >= xpToLevel && Math.floor(member.experienceLevel || 1) < 10) {
    member.experienceLevel = Math.min(10, Math.floor(member.experienceLevel || 1) + 1);
    member.xp = 0;
    // Level-up stat boost
    if (member.stats) {
      member.stats.violence = (member.stats.violence || 0) + 1;
      member.stats.stealth = (member.stats.stealth || 0) + 1;
      member.stats.intelligence = (member.stats.intelligence || 0) + 1;
    }
    member.power = (member.power || 5) + 2;
    showBriefNotification(`${member.name} leveled up to Level ${member.experienceLevel}! Stats improved.`, 'success');
    logAction(`${member.name} is becoming a more capable operator. Their skills sharpen with every mission (Level ${member.experienceLevel}).`);
  }
  gainExperience(Math.max(0.5, Math.floor(operation.rewards.experience * 0.07 * 10) / 10)); // Rep for operations

  // Remove from active operations and record cooldown
  player.gang.activeOperations = player.gang.activeOperations.filter(op => op !== operationData);
  if (!player.gang.operationCooldowns) player.gang.operationCooldowns = {};
  player.gang.operationCooldowns[operationData.operationId] = Date.now() + (operation.cooldown * 60 * 60 * 1000);

  const moneyTag = (operation.rewards && operation.rewards.cleanMoney) ? '' : ' (dirty)';
  showBriefNotification(`${member.name} successfully completed the ${operation.name}! Earned $${moneyEarned.toLocaleString()}${moneyTag}.`, 'success');
  logAction(`${member.name} returns from the ${operation.name} with pockets full. Your crew delivers results (+$${moneyEarned.toLocaleString()}${moneyTag}).`);
  if (typeof showBriefNotification === 'function') {
    showBriefNotification(`${member.name} completed ${operation.name}: +$${moneyEarned.toLocaleString()}${moneyTag}`, 2000);
  }

  degradeEquipment('gang_operation');
  updateUI();
}

// Handle operation betrayal
function handleOperationBetrayal(member, operation) {
  const moneyLoss = Math.floor(player.money * 0.1); // 10% money loss
  player.money = Math.max(0, player.money - moneyLoss);
  player.heat += 5;

  // Clean up active operation for this member
  player.gang.activeOperations = player.gang.activeOperations.filter(op => op.memberName !== member.name);

  // Remove the betraying member
  player.gang.gangMembers = player.gang.gangMembers.filter(m => m.name !== member.name);
  player.gang.members = Math.max(0, player.gang.members - 1);

  showBriefNotification(`${member.name} betrayed the operation! They disappeared with $${moneyLoss.toLocaleString()} and tipped off the authorities.`, 'danger');
  logAction(`Betrayal! ${member.name} turns their back on the family, vanishing with your money and leaving a trail for the cops to follow. Trust is a luxury you can't afford (-$${moneyLoss.toLocaleString()}, +5 heat).`);

  updateUI();
}

// Handle operation arrest
function handleOperationArrest(member, operation) {
  // Member gets arrested, operation fails
  member.arrested = true;
  member.onOperation = false;
  member.arrestTime = Date.now() + (Math.random() * 72 + 24) * 60 * 60 * 1000; // 1-3 days
  player.heat += 3;

  // Clean up active operation for this member
  player.gang.activeOperations = player.gang.activeOperations.filter(op => op.memberName !== member.name);

  showBriefNotification(`${member.name} was arrested during the ${operation.name}! They'll be in custody for a while.`, 'danger');
  logAction(`The operation goes sideways! ${member.name} gets pinched by the law and hauled away in handcuffs. The heat is rising.`);

  updateUI();
}



// Start training for a gang member
async function startTraining(memberIndex) {
  const member = player.gang.gangMembers[memberIndex];
  if (!member || member.inTraining) return;

  // Check both legacy specialization and expanded role mapping
  const memberSpec = member.specialization || (member.role ? EXPANDED_TO_SPECIALIZATION[member.role] : null);
  const availablePrograms = trainingPrograms.filter(program =>
    memberSpec && program.availableFor.includes(memberSpec)
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
    logAction(`${member.name} hits the books and training grounds. Investment in your crew's skills pays dividends in the long run (-$${program.cost}).`);

    updateUI();
    showGang('roster');
  }
}

// Complete training for a gang member
function completeTraining(trainingData) {
  const member = player.gang.gangMembers.find(m => m.name === trainingData.memberName);
  if (!member) return;

  member.inTraining = false;

  // Apply improvements
  Object.entries(trainingData.improvements).forEach(([skill, improvement]) => {
    member[skill] = (member[skill] || 0) + improvement;
  });

  // Remove from training queue
  player.gang.trainingQueue = player.gang.trainingQueue.filter(t => t !== trainingData);

  showBriefNotification(`${member.name} has completed their training program! Their skills have improved.`, 'success');
  logAction(`${member.name} graduates from training with new skills and renewed dedication. Your investment in education pays off in capability.`);

  updateUI();
}

// Enroll a member in training
function enrollInTraining(programId) {
  const program = trainingPrograms.find(p => p.id === programId);
  if (!program) return;

  const memberSelect = document.getElementById(`training-member-${programId}`);
  const selectedMemberName = memberSelect.value;

  if (!selectedMemberName) {
    showBriefNotification('Please select a gang member for this training program.', 'success');
    return;
  }

  const member = player.gang.gangMembers.find(m => m.name === selectedMemberName);
  if (!member) return;

  if (player.money < program.cost) {
    showBriefNotification(`Insufficient funds! Need $${program.cost} for this training program.`, 'danger');
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

  showBriefNotification(`${member.name} has enrolled in ${program.name}. Training will complete in ${program.duration} hours.`, 'success');
  logAction(`${member.name} begins intensive training in ${program.name}. Skilled soldiers make for a stronger organization (-$${program.cost}).`);

  updateUI();
  showGang('training');
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

  if (conditions.minHeat && player.heat < conditions.minHeat) return false;
  if (conditions.minTerritory && (player.turf?.owned || []).length < conditions.minTerritory) return false;
  if (conditions.minBusinesses && player.businesses.length < conditions.minBusinesses) return false;
  if (conditions.minGangMembers && player.gang.gangMembers.length < conditions.minGangMembers) return false;

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

  if (consequences.heatIncrease) {
    player.heat += consequences.heatIncrease;
  }

  if (consequences.reputationLoss) {
    player.reputation = Math.max(0, player.reputation - consequences.reputationLoss);
  }

  if (consequences.powerLoss) {
    // Power is derived from equipment/gang/real estate, so recalculate
    recalculatePower();
  }

  if (consequences.territoryLoss) {
    // Reduce turf power; zone loss happens via turf attack system
    if (player.turf) player.turf.power = Math.max(0, (player.turf.power || 100) - consequences.territoryLoss * 20);
  }

  if (consequences.gangMemberLoss) {
    // Remove random members
    const shuffled = [...player.gang.gangMembers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < consequences.gangMemberLoss && shuffled.length > 0; i++) {
      player.gang.gangMembers = player.gang.gangMembers.filter(m => m !== shuffled[i]);
    }
    player.gang.members = player.gang.gangMembers.length;
  }

  if (consequences.gangSplit) {
    // Lose half the gang
    const membersToRemove = Math.floor(player.gang.gangMembers.length / 2);
    player.gang.gangMembers = player.gang.gangMembers.slice(membersToRemove);
    player.gang.members = player.gang.gangMembers.length;
  }

  // Add to betrayal history
  player.gang.betrayalHistory.push({
    eventId: event.id,
    timestamp: Date.now(),
    detected: Math.random() * 100 < event.detectionChance
  });

  // Show alert
  showBriefNotification(`BETRAYAL! ${event.name}: ${event.description}`, 'danger');
  logAction(`BETRAYAL! ${event.description} Your organization suffers from internal treachery. Trust is a luxury in this business.`);

  updateUI();
}

// ==================== TURF CONTROL FUNCTIONS (SINGLEPLAYER) ====================

// Show the main Turf Control screen
// Render turf control HTML (used by both the standalone screen and the Operations tab)
function renderTurfControlContent() {
  initTurfZones();
  const zones = player.turf._zones || [];
  const ownedZones = zones.filter(z => (player.turf.owned || []).includes(z.id));
  const fam = player.chosenFamily ? RIVAL_FAMILIES[player.chosenFamily] : null;
  const rankLabel = (player.familyRank || 'associate').charAt(0).toUpperCase() + (player.familyRank || 'associate').slice(1);

  let html = `
    <h2 style="color: #8b3a3a; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      Turf Control
    </h2>`;

  if (fam) {
    html += `
    <div style="background: linear-gradient(135deg, ${fam.color}33, ${fam.color}11); padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid ${fam.color};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <strong style="color:${fam.color}; font-size:1.1em;">${fam.icon}</strong>
          <span style="color:#d4c4a0; margin-left:10px;">Rank: <strong style="color:#c0a040;">${rankLabel}</strong></span>
        </div>
        <div style="color:#d4c4a0; font-size:0.9em;">${fam.buff.name}: ${fam.buff.description}</div>
      </div>
    </div>`;
  } else {
    html += `
    <div style="background: rgba(231,76,60,0.2); padding:20px; border-radius:10px; text-align:center; margin-bottom:20px;">
      <h3 style="color:#8b3a3a; margin:0 0 10px 0;">No Family Allegiance</h3>
      <p style="color:#d4c4a0; margin:0 0 15px 0;">Choose a family to pledge your loyalty. Each family offers a unique story and buff.</p>
      <button onclick="showFamilyChoice()" style="padding:12px 30px; background:linear-gradient(135deg,#8b3a3a,#7a2a2a); border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer; font-size:1.1em;">Choose Your Family</button>
    </div>`;
  }

  html += `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
      <div style="background: rgba(52, 152, 219, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 0.9em; color: #d4c4a0;">Turf Power</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #f5e6c8;">${player.turf.power || 100}</div>
      </div>
      <div style="background: rgba(138, 154, 106, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 0.9em; color: #d4c4a0;">Weekly Income</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #f5e6c8;">$${(player.turf.income || 0).toLocaleString()}</div>
      </div>
      <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; text-align: center; min-width: 120px;">
        <div style="font-size: 0.9em; color: #d4c4a0;">Turf Zones</div>
        <div style="font-size: 1.3em; font-weight: bold; color: #f5e6c8;">${ownedZones.length} / ${zones.length}</div>
      </div>
    </div>

    <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
      <button onclick="showTurfMap()" style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #7a8a5a, #8a9a6a); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Turf Map</button>
      <button onclick="showProtectionRackets()" style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #e67e22, #c0a040); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Protection Rackets</button>
    </div>`;

  if (ownedZones.length > 0) {
    html += `<div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;"><h3 style="color: #8b3a3a; margin-bottom: 15px;">Your Turf</h3><div style="display: grid; gap: 15px;">`;
    ownedZones.forEach(zone => {
      const income = calculateTurfZoneIncome(zone);
      const heatLevel = player.heat || 0;
      const fortLevel = (player.turf.fortifications || {})[zone.id] || 0;
      html += `<div style="background: rgba(20, 18, 10, 0.8); padding: 15px; border-radius: 10px; border-left: 4px solid ${getHeatColor(heatLevel)};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;"><h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${zone.icon} ${zone.name}</h4><p style="color: #d4c4a0; margin: 0; font-size: 0.9em;">${zone.description}</p><div style="font-size:0.8em; color:#8a7a5a; margin-top:4px;">Fort Lv ${fortLevel} | Heat: ${heatLevel}/100</div></div>
          <div style="text-align: right; min-width: 120px;"><div style="color: #8a9a6a; font-weight: bold;">$${income.toLocaleString()}/week</div></div>
        </div>
        <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="manageTurfDetails('${zone.id}')" style="padding: 5px 10px; background: #c0a062; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 0.8em;">Manage</button>
          <button onclick="fortifyTurf('${zone.id}')" style="padding: 5px 10px; background: #e67e22; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 0.8em;">Fortify</button>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  } else {
    html += `<div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;"><h3 style="color: #8b3a3a; margin: 0 0 10px 0;">No Turf Controlled</h3><p style="color: #d4c4a0; margin: 0;">Every zone is held by a rival family. Complete missions and fight for control!</p></div>`;
  }

  if ((player.turf.events || []).length > 0) {
    html += `<div style="background: rgba(230, 126, 34, 0.2); padding: 20px; border-radius: 10px; margin-bottom: 20px;"><h3 style="color: #e67e22; margin-bottom: 15px;">Turf Events</h3><div style="display: grid; gap: 10px;">`;
    player.turf.events.forEach(event => {
      html += `<div style="background: rgba(20, 18, 10, 0.8); padding: 12px; border-radius: 8px;"><div style="display: flex; justify-content: space-between; align-items: center;"><div><h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${event.name}</h4><p style="color: #d4c4a0; margin: 0; font-size: 0.9em;">${event.description}</p></div><div style="text-align: right; color: #e67e22; font-weight: bold;">${Math.ceil(event.duration)} days</div></div></div>`;
    });
    html += `</div></div>`;
  }

  if (typeof TURF_MILESTONES !== 'undefined' && TURF_MILESTONES.length > 0) {
    const unlockedIds = getUnlockedTurfMilestones().map(m => m.id);
    html += `<div style="background:rgba(155,89,182,0.15);padding:20px;border-radius:10px;margin-bottom:20px;border:1px solid rgba(155,89,182,0.3);"><h3 style="color:#bb8fce;margin-bottom:15px;">Turf Milestones</h3><div style="display:grid;gap:10px;">`;
    TURF_MILESTONES.forEach(ms => {
      const unlocked = unlockedIds.includes(ms.id);
      html += `<div style="background:rgba(20,18,10,0.8);padding:12px;border-radius:8px;border-left:4px solid ${unlocked ? '#2ecc71' : '#555'};opacity:${unlocked ? 1 : 0.6};"><div style="display:flex;justify-content:space-between;align-items:center;"><div><span style="color:${unlocked ? '#2ecc71' : '#888'};margin-right:8px;">${unlocked ? '\u2705' : '\u{1F512}'}</span><strong style="color:#f5e6c8;">${ms.name}</strong><span style="color:#8a7a5a;font-size:0.85em;margin-left:8px;">(${ms.zonesRequired} zones)</span></div><span style="color:#d4c4a0;font-size:0.85em;">${ms.description}</span></div></div>`;
    });
    html += `</div></div>`;
  }

  if (typeof RIVAL_FAMILIES !== 'undefined') {
    const domRewards = player.turf.dominanceRewards || [];
    html += `<div style="background:rgba(231,76,60,0.12);padding:20px;border-radius:10px;margin-bottom:20px;border:1px solid rgba(231,76,60,0.25);"><h3 style="color:#e74c3c;margin-bottom:15px;">Family Dominance</h3><div style="display:grid;gap:10px;">`;
    Object.entries(RIVAL_FAMILIES).forEach(([key, fam]) => {
      const famZones = fam.turfZones || [];
      const ownedOfFam = famZones.filter(zId => (player.turf.owned || []).includes(zId)).length;
      const dominated = domRewards.includes(key);
      const pct = famZones.length > 0 ? Math.floor((ownedOfFam / famZones.length) * 100) : 0;
      html += `<div style="background:rgba(20,18,10,0.8);padding:12px;border-radius:8px;border-left:4px solid ${dominated ? '#2ecc71' : fam.color || '#8b3a3a'};"><div style="display:flex;justify-content:space-between;align-items:center;"><div><strong style="color:${fam.color || '#f5e6c8'};">${fam.icon || ''} ${fam.name}</strong><span style="color:#8a7a5a;font-size:0.85em;margin-left:8px;">${ownedOfFam}/${famZones.length} zones</span></div><div style="display:flex;align-items:center;gap:10px;"><div style="width:80px;height:8px;background:#333;border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${dominated ? '#2ecc71' : fam.color || '#e74c3c'};border-radius:4px;"></div></div><span style="color:${dominated ? '#2ecc71' : '#d4c4a0'};font-size:0.85em;font-weight:bold;">${dominated ? 'DOMINATED' : pct + '%'}</span></div></div></div>`;
    });
    html += `</div></div>`;
  }

  return html;
}

function showTerritoryControl() {
  if (player.inJail) { showBriefNotification("You can't manage turf while you're in jail!", 'danger'); return; }

  const html = renderTurfControlContent() + `
    <div class="page-nav" style="justify-content: center;">
      <button class="nav-btn-back" onclick="goBackToMainMenu()"><- Back to SafeHouse</button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Show Turf Map -- all zones with ownership and actions
function showTurfMap() {
  initTurfZones();
  const zones = player.turf._zones || [];
  const owned = player.turf.owned || [];
  const fam = player.chosenFamily;
  const alliedZones = fam ? (RIVAL_FAMILIES[fam]?.turfZones || []) : [];

  const playerAtkPower = typeof calculateTurfAttackPower === 'function' ? calculateTurfAttackPower() : (player.turf.power || 100);
  const activeGangCount = (player.gang?.gangMembers || []).filter(m => m.status === 'active').length;

  let html = `
    <h2 style="color:#7a8a5a; text-align:center; margin-bottom:25px; font-size:2.2em;">Turf Map</h2>
    <div style="background:rgba(139,58,58,0.15); padding:18px; border-radius:12px; margin-bottom:20px; border:2px solid #8b3a3a;">
      <h3 style="color:#c0a062; margin:0 0 10px 0; text-align:center;">Your Combat Strength</h3>
      <div style="display:flex; justify-content:center; align-items:center; gap:30px; flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:2em; font-weight:bold; color:#f5e6c8;">${playerAtkPower}</div>
          <div style="font-size:0.85em; color:#d4c4a0;">Attack Power</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:1.4em; font-weight:bold; color:#c0a062;">${activeGangCount}</div>
          <div style="font-size:0.85em; color:#d4c4a0;">Active Crew</div>
        </div>
      </div>
      <p style="color:#aaa; text-align:center; margin:10px 0 0 0; font-size:0.8em;">You can attack any zone! Higher Attack Power vs Defense = better odds. Match their Defense for ~50% chance.</p>
    </div>`;

  // Rival Family Intelligence Panel
  if (player.turf.rivalAI) {
    html += `<div style="background:rgba(139,58,58,0.1); padding:18px; border-radius:12px; margin-bottom:20px; border:1px solid #6a5a3a;">
      <h3 style="color:#c0a062; margin:0 0 12px 0; text-align:center;">Rival Family Intelligence</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">`;
    Object.keys(player.turf.rivalAI).forEach(rKey => {
      const rAI = player.turf.rivalAI[rKey];
      const rFam = RIVAL_FAMILIES[rKey];
      if (!rFam) return;
      const rPersonality = RIVAL_AI_PERSONALITY[rKey];
      const zonesHeld = (player.turf._zones || []).filter(z => z.controlledBy === rKey).length;
      const moraleColor = rAI.morale > 60 ? '#8a9a6a' : rAI.morale > 30 ? '#e67e22' : '#e74c3c';
      let statusText;
      if (rAI.eliminated) {
        statusText = '<span style="color:#e74c3c;">ELIMINATED</span>';
      } else if (rAI.eliminationAvailable) {
        statusText = '<span style="color:#ff4444;">CORNERED -- <a href="#" onclick="showEliminationMission(\'' + rKey + '\'); return false;" style="color:#ff4444; text-decoration:underline;">Eliminate</a></span>';
      } else {
        statusText = `<span style="color:${moraleColor};">${rAI.morale}%</span>`;
      }
      html += `
        <div style="background:rgba(20,18,10,0.6); padding:12px; border-radius:8px; border-left:3px solid ${rFam.color};">
          <div style="font-weight:bold; color:${rFam.color}; margin-bottom:6px;">${rFam.name}</div>
          <div style="font-size:0.82em; color:#d4c4a0;">
            Strength: <span style="color:#f5e6c8;">${rAI.power}</span><br>
            Morale: ${statusText}<br>
            Zones: <span style="color:#f5e6c8;">${zonesHeld}</span><br>
            Style: <span style="color:#aaa;">${rPersonality.label}</span>${rAI.atWar && !rAI.eliminated ? '<br><span style="color:#e74c3c; font-weight:bold;">AT WAR</span>' : ''}
          </div>
        </div>`;
    });
    html += `</div></div>`;
  }

  html += `
    <div style="background:rgba(52,152,219,0.2);padding:15px;border-radius:10px;margin-bottom:20px;">
      <h3 style="color:#c0a062; margin:0 0 10px 0;">Legend</h3>
      <div style="display:flex; flex-wrap:wrap; gap:15px; font-size:0.9em; color:#d4c4a0;">
        <span>Your Turf</span> <span>Allied Family</span> <span>Rival Held</span> <span>Contested</span> <span>Independent</span>
      </div>
    </div>
    <div style="display:grid; gap:15px;">`;

  zones.forEach(zone => {
    const isOwned = owned.includes(zone.id);
    const isAllied = !isOwned && alliedZones.includes(zone.id) && zone.controlledBy === fam;
    const isContested = zone.controlledBy === 'contested';
    const isIndependent = zone.controlledBy === 'independent';
    const controllerFamily = (!isOwned && !isAllied && !isContested && !isIndependent) ? RIVAL_FAMILIES[zone.controlledBy] : null;

    let borderColor = isOwned ? '#8a9a6a' : isAllied ? '#c0a062' : isContested ? '#6a5a3a' : isIndependent ? '#c0a040' : '#8b3a3a';
    let statusLabel = isOwned ? 'Your Turf' : isAllied ? `${RIVAL_FAMILIES[fam]?.name || 'Allied'}` : isContested ? 'Contested' : isIndependent ? 'Independent' : `${controllerFamily?.name || zone.controlledBy}`;

    html += `
      <div style="background:rgba(20, 18, 10,0.8); padding:20px; border-radius:12px; border-left:4px solid ${borderColor};">
        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:15px;">
          <div style="flex:1; min-width:250px;">
            <h3 style="color:#f5e6c8; margin:0 0 8px 0;">${zone.icon} ${zone.name}</h3>
            <p style="color:#d4c4a0; margin:0 0 8px 0; font-size:0.95em;">${zone.description}</p>
            <div style="font-size:0.85em; color:#d4c4a0;">
              <span style="color:#8a9a6a;">Income:</span> $${zone.baseIncome.toLocaleString()}/week |
              <span style="color:${getRiskColor(zone.riskLevel)};">${zone.riskLevel}</span>
            </div>
            <div style="margin-top:5px; font-size:0.85em; color:${borderColor};">${statusLabel}</div>`;

    // Show boss info if zone has one
    if (zone.boss && !isOwned) {
      const bossInfo = findBossById(zone.boss);
      if (bossInfo && !(player.turf.bossesDefeated || []).includes(bossInfo.id)) {
        html += `<div style="margin-top:5px; font-size:0.85em; color:#8b3a3a;">Boss: ${bossInfo.name} (Power: ${bossInfo.power})</div>`;
      }
    }
    if (zone.don && !isOwned) {
      const donInfo = findBossById(zone.don);
      if (donInfo && !(player.turf.donsDefeated || []).includes(donInfo.id)) {
        html += `<div style="margin-top:5px; font-size:0.85em; color:#8b6a4a;">Don: ${donInfo.name} (Power: ${donInfo.power})</div>`;
      }
    }

    html += `</div><div style="text-align:right; min-width:150px;">`;

    if (isOwned) {
      html += `<button onclick="manageTurfDetails('${zone.id}')" style="width:100%;padding:10px;background:linear-gradient(135deg,#c0a062,#a08850);border:none;border-radius:8px;color:white;font-weight:bold;cursor:pointer;font-size:0.9em;">Manage</button>`;
    } else if (isAllied) {
      html += `<div style="color:#c0a062;font-size:0.9em;padding:10px;">Allied territory</div>`;
    } else {
      const winChance = calculateTurfWinChance(playerAtkPower, zone.defenseRequired);
      const chanceColor = winChance >= 70 ? '#2ecc71' : winChance >= 40 ? '#f1c40f' : winChance >= 15 ? '#e67e22' : '#e74c3c';
      const baseDef = zone.baseDefenseRequired || zone.defenseRequired;
      const fortBonus = zone.defenseRequired - baseDef;
      const fortText = fortBonus > 0 ? ` <span style="color:#e67e22;">(+${fortBonus} fortified)</span>` : '';
      html += `
        <div style="margin-bottom:8px;font-size:0.8em;text-align:center;">
          <div style="color:#d4c4a0;font-weight:bold;">Their Defense: ${zone.defenseRequired}${fortText}</div>
          <div style="font-size:0.9em;font-weight:bold;color:${chanceColor};">${winChance}% Win Chance</div>
        </div>
        <button onclick="attackTurfZone('${zone.id}')"
          style="width:100%;padding:10px;background:linear-gradient(135deg,#8b3a3a,#7a2a2a);border:none;border-radius:8px;color:white;font-weight:bold;cursor:pointer;font-size:0.9em;">
          Attack
        </button>`;
    }

    html += `</div></div></div>`;
  });

  html += `</div>
    <div style="text-align:center; margin-top:25px;">
      <button onclick="showTerritoryControl();" style="padding:12px 30px;background:linear-gradient(135deg,#8a7a5a,#6a5a3a);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;"><- Back to Turf</button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}
window.showTurfMap = showTurfMap;

// Helper: find a boss/don/capo by ID across all families + independents
function findBossById(bossId) {
  for (const fk of Object.keys(RIVAL_FAMILIES)) {
    const f = RIVAL_FAMILIES[fk];
    if (f.don.id === bossId) return f.don;
    if (f.underboss.id === bossId) return f.underboss;
    const capo = f.capos.find(c => c.id === bossId);
    if (capo) return capo;
  }
  return INDEPENDENT_BOSSES[bossId] || null;
}

// -- Calculate total offensive power for a turf attack --
// Gang members contribute significantly; solo attacks are possible but much harder.
function calculateTurfAttackPower() {
  let power = player.turf.power || 100;

  // Player combat stats
  power += (player.skillTree?.combat?.brawler || 0) * 4;
  power += (player.combatReflexBonus || 0) * 3;

  // Weapon / armour bonus (10% of raw power per equipped tier, roughly)
  if (player.equippedWeapon) power += 10;
  if (player.equippedArmor) power += 8;

  // Gang member offensive contribution -- the key to winning turf
  const active = (player.gang?.gangMembers || []).filter(m => m.status === 'active');
  active.forEach(m => {
    let contrib = calculateMemberEffectiveness(m, 'violence');
    // Role-specific multipliers for offence
    if (m.role === 'enforcer') contrib *= 1.20;
    if (m.role === 'bruiser') contrib *= 1.15;
    if (m.role === 'hitman') contrib *= 1.25;
    power += Math.floor(contrib);
  });

  return Math.floor(power);
}
window.calculateTurfAttackPower = calculateTurfAttackPower;

// -- Calculate win chance for turf attacks --
// At equal power: ~50%. Below: scales down to a minimum of 1%. Above: scales up toward 99%.
function calculateTurfWinChance(attackPower, defense) {
  if (defense <= 0) return 99;
  const ratio = attackPower / defense;
  // Sigmoid-style curve: 50% at ratio=1, min 1%, max 99%
  // Using logistic function: chance = 1 / (1 + e^(-k*(ratio-1)))
  const k = 4; // steepness — how fast chance changes around the 50% point
  const raw = 1 / (1 + Math.exp(-k * (ratio - 1)));
  const chance = Math.round(raw * 100);
  return Math.max(1, Math.min(99, chance));
}
window.calculateTurfWinChance = calculateTurfWinChance;

// -- Process casualties among gang members after a turf fight --
// deathChance / injuryChance are base rates; actual chance per member is randomised.
function processTurfAttackCasualties(won, gangMembers, zoneName) {
  const casualties = [];
  const injured = [];
  const active = gangMembers.filter(m => m.status === 'active');
  if (active.length === 0) return { casualties, injured };

  // Losing fights are bloodier
  const baseDeathChance = won ? 0.08 : 0.18;
  const baseInjuryChance = won ? 0.15 : 0.30;

  active.forEach(m => {
    const roll = Math.random();
    // Veteran trait halves death chance
    const deathMod = m.traits?.some(t => t.name === 'Veteran') ? 0.5 : 1;
    const injMod = m.traits?.some(t => t.name === 'Cautious') ? 0.6 : 1;

    if (roll < baseDeathChance * deathMod) {
      m.status = 'dead';
      casualties.push(m.name);
    } else if (roll < (baseDeathChance * deathMod) + (baseInjuryChance * injMod)) {
      m.status = 'injured';
      injured.push(m.name);
      // Recover after 5 minutes
      setTimeout(() => { if (m.status === 'injured') m.status = 'active'; }, 300000);
    }
  });

  // Actually remove dead members from the gang roster so they don't block recruitment
  for (let i = gangMembers.length - 1; i >= 0; i--) {
    if (gangMembers[i].status === 'dead') {
      gangMembers.splice(i, 1);
    }
  }
  if (player.gang) {
    player.gang.members = player.gang.gangMembers.length;
  }

  return { casualties, injured };
}

// Attack a rival-held turf zone
async function attackTurfZone(zoneId) {
  initTurfZones();
  const zone = (player.turf._zones || []).find(z => z.id === zoneId);
  if (!zone) { showBriefNotification('Zone not found!', 'danger'); return; }
  if ((player.turf.owned || []).includes(zoneId)) { showBriefNotification('You already own this turf!', 'danger'); return; }

  const powerNeeded = zone.defenseRequired;

  // Calculate full attack strength (player power + gang members + gear)
  const attackPower = calculateTurfAttackPower();
  const winChance = calculateTurfWinChance(attackPower, powerNeeded);
  const activeGang = (player.gang?.gangMembers || []).filter(m => m.status === 'active');
  const gangStr = activeGang.length > 0 ? `\nGang Backup: ${activeGang.length} member${activeGang.length > 1 ? 's' : ''}` : '\n No gang backup -- this will be much harder solo!';

  // Check if there's a boss guarding this zone
  const bossId = zone.boss;
  const bossInfo = bossId ? findBossById(bossId) : null;
  const bossAlive = bossInfo && !(player.turf.bossesDefeated || []).includes(bossInfo.id);

  let confirmMsg = `Attack ${zone.name}?`;
  if (bossAlive) confirmMsg += `\n\n ${bossInfo.name} guards this zone! (Power: ${bossInfo.power})`;
  confirmMsg += `\n\nYour Attack: ${attackPower} vs Their Defense: ${powerNeeded}\nWin Chance: ${winChance}%${gangStr}`;
  if (winChance < 20) confirmMsg += `\n\n This is a risky attack! You only have a ${winChance}% chance of winning.`;
  if (activeGang.length > 0) confirmMsg += `\n\n Warning: Gang members may be killed or injured in the assault.`;

  if (await ui.confirm(confirmMsg)) {
    // Boss fight if boss is alive
    if (bossAlive) {
      const result = resolveBossFight(bossInfo, attackPower);
      if (!result.won) {
        player.health = Math.max(0, player.health - result.damageTaken);
        player.turf.power = Math.max(10, (player.turf.power || 100) - 15);
        if (player.health <= 0) {
          showDeathScreen(`Killed by ${bossInfo.name} while attacking ${zone.name}`);
          return;
        }
        // Gang casualties even on boss loss
        const { casualties, injured } = processTurfAttackCasualties(false, player.gang?.gangMembers || [], zone.name);
        let lossMsg = `${bossInfo.name} defeated you! Lost 15 power and ${result.damageTaken} health.`;
        if (casualties.length) lossMsg += ` KILLED: ${casualties.join(', ')}.`;
        if (injured.length) lossMsg += ` Injured: ${injured.join(', ')}.`;
        showBriefNotification(lossMsg, 'danger');
        logAction(`You attacked ${zone.name} but ${bossInfo.name} crushed your assault. Regroup and try again.`);
        if (casualties.length) logAction(` Lost in the fight: ${casualties.join(', ')}`);
        updateUI();
        return;
      }
      // Boss defeated
      if (!player.turf.bossesDefeated) player.turf.bossesDefeated = [];
      player.turf.bossesDefeated.push(bossInfo.id);
      player.money += bossInfo.reward;
      player.turf.reputation = (player.turf.reputation || 0) + 25;
      player.territoryReputation = (player.territoryReputation || 0) + 25;
      logAction(`<strong>${bossInfo.name}</strong> has been eliminated! +$${bossInfo.reward.toLocaleString()} and +25 respect.`);

      // Update rival respect: defeating a boss lowers their faction's respect for you
      updateRivalRespect(bossInfo.id, -25);
      // Find which faction this boss belongs to
      const bossRival = (player.rivalKingpins || RIVAL_KINGPINS).find(r => r.id === bossInfo.id);
      if (bossRival && bossRival.faction && bossRival.faction !== 'independent') {
        updateFactionRivalRespect(bossRival.faction, -10);
      }

      // Check if this was a Don
      const isDon = Object.values(RIVAL_FAMILIES).some(f => f.don.id === bossInfo.id);
      if (isDon) {
        if (!player.turf.donsDefeated) player.turf.donsDefeated = [];
        player.turf.donsDefeated.push(bossInfo.id);
        logAction(`A <strong>Don</strong> has fallen! The balance of power shifts dramatically.`);
      }
    }

    // -- TURF COMBAT ROLL (chance-based) --
    // Win chance is based on attack vs defense ratio. Player can always attempt.
    // Solo penalty and corruption bonuses adjust the effective chance.
    const soloPenalty = activeGang.length === 0 ? 0.85 : 1.0;
    const zonePermitBonus = 1 + getCorruptionBenefit('zonePermits');
    const effectiveAttack = Math.floor(attackPower * soloPenalty * zonePermitBonus);
    const effectiveChance = calculateTurfWinChance(effectiveAttack, powerNeeded);
    const roll = Math.random() * 100;

    if (roll >= effectiveChance) {
      // Attack FAILED -- zone not taken
      player.health = Math.max(0, player.health - Math.floor(Math.random() * 15 + 10));
      player.turf.power = Math.max(10, (player.turf.power || 100) - 10);
      if (player.health <= 0) {
        showDeathScreen(`Killed in the failed assault on ${zone.name}`);
        return;
      }
      const { casualties, injured } = processTurfAttackCasualties(false, player.gang?.gangMembers || [], zone.name);
      let failMsg = `Attack on ${zone.name} failed! (${effectiveChance}% chance) Lost 10 power.`;
      if (casualties.length) failMsg += ` KILLED: ${casualties.join(', ')}.`;
      if (injured.length) failMsg += ` Injured: ${injured.join(', ')}.`;
      showBriefNotification(failMsg, 'danger');
      logAction(`Your assault on <strong>${zone.name}</strong> was repelled. The garrison held firm.`);
      if (casualties.length) logAction(` Lost in the fight: ${casualties.join(', ')}`);
      if (injured.length) logAction(` Injured: ${injured.join(', ')}`);
      updateUI();
      return;
    }

    // Attack SUCCEEDED -- process gang casualties (lighter on victory)
    const { casualties, injured } = processTurfAttackCasualties(true, player.gang?.gangMembers || [], zone.name);

    // Take the zone
    const previousOwner = zone.controlledBy;
    zone.controlledBy = 'player';
    zone.defendingMembers = [];
    if (!player.turf.owned) player.turf.owned = [];
    player.turf.owned.push(zone.id);
    player.heat = Math.min(100, (player.heat || 0) + 15);
    player.turf.reputation = (player.turf.reputation || 0) + 15;
    player.territoryReputation = (player.territoryReputation || 0) + 15;
    recalcTurfIncome();
    checkFamilyRankUp();
    checkTurfMilestoneUnlocks();
    checkTurfDominance(zone.id);

    // Weaken rival family AI when player takes their zone
    if (previousOwner && RIVAL_FAMILIES[previousOwner] && previousOwner !== player.chosenFamily) {
      onPlayerTookZone(zone.id, previousOwner);
    }

    // Rival respect: the faction that owned this zone loses respect for you
    const zoneRivals = (player.rivalKingpins || RIVAL_KINGPINS).filter(r => r.territories && r.territories.includes(zone.id));
    if (zoneRivals.length > 0) {
      const faction = zoneRivals[0].faction;
      if (faction && faction !== 'independent') updateFactionRivalRespect(faction, -5);
      zoneRivals.forEach(r => updateRivalRespect(r.id, -5));
    }

    let successMsg = `${zone.name} is now your turf!`;
    if (casualties.length) successMsg += ` But you lost: ${casualties.join(', ')}.`;
    if (injured.length) successMsg += ` Injured: ${injured.join(', ')}.`;
    showBriefNotification(successMsg, casualties.length ? 'warning' : 'success');
    logAction(`You seized control of <strong>${zone.name}</strong>. The streets know your name.`);
    if (casualties.length) logAction(` Fallen in the assault: ${casualties.join(', ')}`);
    if (injured.length) logAction(` Wounded: ${injured.join(', ')}`);
    updateUI();
    showTurfMap();
  }
}
window.attackTurfZone = attackTurfZone;

// Boss fight resolution -- playerPower already includes gang, gear, and skill bonuses via calculateTurfAttackPower
function resolveBossFight(bossInfo, playerPower) {
  const reflexBonus = player.combatReflexBonus || 0;
  const bossStrength = bossInfo.power + Math.floor(Math.random() * 40) - 20;
  // Don't re-add brawler/reflex -- they're already in playerPower from calculateTurfAttackPower
  const playerStrength = playerPower + Math.floor(Math.random() * 50) - 25;
  const won = playerStrength > bossStrength;
  // Reflex bonus reduces damage taken (each point = ~1 less damage)
  const rawDamage = won ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 25) + 15;
  const damageTaken = Math.max(1, rawDamage - reflexBonus);
  return { won, damageTaken, bossStrength, playerStrength };
}

// Calculate income for a single turf zone
function calculateTurfZoneIncome(zone) {
  let income = zone.baseIncome;
  const fortLevel = (player.turf.fortifications || {})[zone.id] || 0;
  income *= (1 + fortLevel * 0.1);
  const heat = player.heat || 0;
  income *= Math.max(0.3, 1 - (heat / 100) * 0.5);
  // Family buff
  const buff = getChosenFamilyBuff();
  if (buff && buff.incomeMultiplier) income *= buff.incomeMultiplier;
  // Gang member bonuses
  const enforcers = (player.gang?.gangMembers || []).filter(m => m.specialization === 'enforcer' || m.specialization === 'lieutenant');
  income *= (1 + enforcers.length * 0.05);
  // Milestone perks: trade boost (+15% income) and overlord (+25% income)
  if (typeof hasTurfPerk === 'function') {
    if (hasTurfPerk('trade_boost')) income *= 1.15;
    if (hasTurfPerk('overlord')) income *= 1.25;
  }
  // Turf reputation bonus: up to +25% income at 100 reputation
  const turfRep = (player.turf && player.turf.reputation) || 0;
  if (turfRep > 0) {
    income *= (1 + Math.min(turfRep, 100) * 0.0025);
  }
  return Math.floor(income);
}

// Recalculate total turf income
function recalcTurfIncome() {
  initTurfZones();
  const owned = player.turf.owned || [];
  const zones = (player.turf._zones || []).filter(z => owned.includes(z.id));
  player.turf.income = zones.reduce((sum, z) => sum + calculateTurfZoneIncome(z), 0);
  // Also keep legacy property in sync
  player.territoryIncome = player.turf.income;
}

// Manage a specific turf zone
function manageTurfDetails(zoneId) {
  initTurfZones();
  const zone = (player.turf._zones || []).find(z => z.id === zoneId);
  if (!zone) return;
  const income = calculateTurfZoneIncome(zone);
  const heat = player.heat || 0;
  const fort = (player.turf.fortifications || {})[zone.id] || 0;

  // Calculate defense breakdown
  const fortContrib = fort * 25;
  const defenders = (zone.defendingMembers || []).length;
  const defenderContrib = defenders * 20;
  const turfPower = player.turf.power || 0;
  const powerBonus = Math.floor(turfPower * 0.1);
  const totalDefense = fortContrib + defenderContrib + powerBonus;

  // Rival threat assessment
  const ownedCount = (player.turf.owned || []).length;
  const escalationTier = Math.min(ownedCount, 8);
  const attackChancePct = ((0.05 + escalationTier * 0.025) * 100).toFixed(1);
  const minPower = 40 + escalationTier * 15;
  const maxPower = minPower + 30 + escalationTier * 10;

  // Vulnerability status
  let vulnLabel, vulnColor;
  if (totalDefense >= maxPower) { vulnLabel = 'Well Defended'; vulnColor = '#2ecc71'; }
  else if (totalDefense >= minPower) { vulnLabel = 'At Risk'; vulnColor = '#f39c12'; }
  else { vulnLabel = 'Vulnerable'; vulnColor = '#e74c3c'; }

  // Chen Triad intel: show precise attack info instead of ranges
  const isChenTriad = player.chosenFamily === 'chen';
  const attackPowerDisplay = isChenTriad
    ? `<span style="color:#2e8b57;">${minPower} - ${maxPower} (exact)</span>`
    : `<span style="color:#e74c3c;">${minPower} - ${maxPower}</span>`;
  const chenIntelRow = isChenTriad
    ? `<div style="display:flex;justify-content:space-between;"><span style="color:#2e8b57;">Intel Foil Chance</span><span style="color:#2e8b57;font-weight:bold;">20%</span></div>`
    : '';

  let html = `
    <h2 style="color:#f5e6c8; text-align:center; margin-bottom:25px;">${zone.icon} ${zone.name}</h2>
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; margin-bottom:20px;">
      <div style="background:rgba(138,154,106,0.2);padding:12px;border-radius:10px;text-align:center;">
        <div style="font-size:0.85em;color:#d4c4a0;">Income</div>
        <div style="font-size:1.2em;font-weight:bold;color:#8a9a6a;">$${income.toLocaleString()}/wk</div>
      </div>
      <div style="background:rgba(231,76,60,0.2);padding:12px;border-radius:10px;text-align:center;">
        <div style="font-size:0.85em;color:#d4c4a0;">Heat</div>
        <div style="font-size:1.2em;font-weight:bold;color:${getHeatColor(heat)};">${heat}/100</div>
      </div>
      <div style="background:rgba(52,152,219,0.2);padding:12px;border-radius:10px;text-align:center;">
        <div style="font-size:0.85em;color:#d4c4a0;">Fortification</div>
        <div style="font-size:1.2em;font-weight:bold;color:#c0a062;">Lv ${fort}</div>
      </div>
      <div style="background:rgba(155,89,182,0.2);padding:12px;border-radius:10px;text-align:center;">
        <div style="font-size:0.85em;color:#d4c4a0;">Defense</div>
        <div style="font-size:1.2em;font-weight:bold;color:#bb8fce;">${totalDefense}</div>
      </div>
    </div>

    <div style="background:rgba(0,0,0,0.3);border:1px solid #444;border-radius:10px;padding:15px;margin-bottom:16px;">
      <h4 style="color:#bb8fce;margin:0 0 10px;">Defense Breakdown</h4>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.9em;">
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Fortification (Lv ${fort} x 25)</span><span style="color:#c0a062;">+${fortContrib}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Defenders (${defenders} members)</span><span style="color:#5dade2;">+${defenderContrib}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Power Bonus (10% of ${turfPower})</span><span style="color:#bb8fce;">+${powerBonus}</span></div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #555;padding-top:6px;font-weight:bold;"><span style="color:#f5e6c8;">Total Defense</span><span style="color:#f5e6c8;">${totalDefense}</span></div>
      </div>
    </div>

    <div style="background:rgba(0,0,0,0.3);border:1px solid #444;border-radius:10px;padding:15px;margin-bottom:20px;">
      <h4 style="color:#e74c3c;margin:0 0 10px;">Rival Threat Level</h4>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.9em;">
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Attack Chance/cycle</span><span style="color:#e74c3c;">${attackChancePct}%</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Attack Power Range</span>${attackPowerDisplay}</div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#d4c4a0;">Status</span><span style="color:${vulnColor};font-weight:bold;">${vulnLabel}</span></div>
        ${chenIntelRow}
      </div>
    </div>

    <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-bottom:20px;">
      <button onclick="fortifyTurf('${zone.id}')" style="padding:10px 20px;background:linear-gradient(135deg,#e67e22,#d35400);border:none;border-radius:8px;color:white;cursor:pointer;font-weight:bold;">Fortify ($${((fort+1)*5000).toLocaleString()})</button>
      <button onclick="reduceHeatTurf('${zone.id}')" style="padding:10px 20px;background:linear-gradient(135deg,#c0a062,#a08850);border:none;border-radius:8px;color:white;cursor:pointer;font-weight:bold;">Reduce Heat ($${Math.max(1000, Math.floor(heat*200)).toLocaleString()})</button>
      <button onclick="collectTurfTribute('${zone.id}')" style="padding:10px 20px;background:linear-gradient(135deg,#7a8a5a,#229954);border:none;border-radius:8px;color:white;cursor:pointer;font-weight:bold;">Collect Tribute</button>
    </div>
    <div style="text-align:center;">
      <button onclick="showTerritoryControl();" style="padding:12px 30px;background:linear-gradient(135deg,#8a7a5a,#6a5a3a);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;"><- Back to Turf</button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}
window.manageTurfDetails = manageTurfDetails;

// Fortify a turf zone
function fortifyTurf(zoneId) {
  if (!player.turf.fortifications) player.turf.fortifications = {};
  const current = player.turf.fortifications[zoneId] || 0;
  const cost = (current + 1) * 5000;
  if (player.money < cost) { showBriefNotification(`Need $${cost.toLocaleString()} to fortify!`, 'danger'); return; }
  player.money -= cost;
  player.turf.fortifications[zoneId] = current + 1;
  recalcTurfIncome();
  showBriefNotification(`Fortification upgraded to Lv ${current + 1}!`, 'success');
  logAction(`Fortified turf zone. Defense strengthened.`);
  updateUI();
}
window.fortifyTurf = fortifyTurf;

// Reduce global heat from turf screen
function reduceHeatTurf(zoneId) {
  const heat = player.heat || 0;
  const cost = Math.max(1000, Math.floor(heat * 200));
  if (player.money < cost) { showBriefNotification(`Need $${cost.toLocaleString()}!`, 'danger'); return; }
  if (heat <= 0) { showBriefNotification('Heat is already at 0!', 'info'); return; }
  player.money -= cost;
  player.heat = Math.max(0, heat - 10);
  recalcTurfIncome();
  showBriefNotification('Heat reduced by 10!', 'success');
  logAction(`Paid $${cost.toLocaleString()} to lay low and reduce heat.`);
  updateUI();
}
window.reduceHeatTurf = reduceHeatTurf;

// Collect tribute from turf
function collectTurfTribute(zoneId) {
  const now = Date.now();
  const lastCollection = player.turf.lastTributeCollection || 0;
  const hoursSince = (now - lastCollection) / 3600000;
  if (hoursSince < 1) { showBriefNotification(`Wait ${Math.ceil(60 - hoursSince * 60)} more minutes.`, 'info'); return; }
  initTurfZones();
  const zone = (player.turf._zones || []).find(z => z.id === zoneId);
  if (!zone) return;
  const income = calculateTurfZoneIncome(zone);
  const tribute = Math.floor(income * Math.min(hoursSince / 168, 1));
  player.dirtyMoney = (player.dirtyMoney || 0) + tribute;
  player.turf.lastTributeCollection = now;
  player.heat = Math.min(100, (player.heat || 0) + 3);
  showBriefNotification(`Collected $${tribute.toLocaleString()} in dirty tribute! (+3 heat)`, 'success');
  logAction(`Collected $${tribute.toLocaleString()} tribute from ${zone.name}.`);
  updateUI();
}
window.collectTurfTribute = collectTurfTribute;

// Process weekly turf operations (called periodically)
function processTurfOperations() {
  initTurfZones();
  const owned = player.turf.owned || [];
  if (owned.length === 0) return;

  // Weekly income (dirty money)
  recalcTurfIncome();
  if (player.turf.income > 0) {
    player.dirtyMoney = (player.dirtyMoney || 0) + player.turf.income;
    logAction(`Weekly turf tribute: +$${player.turf.income.toLocaleString()} (dirty money)`);
  }

  // Heat only decays if the player has the heat_reduction milestone perk
  if (player.heat > 0 && typeof hasTurfPerk === 'function' && hasTurfPerk('heat_reduction')) {
    player.heat = Math.max(0, player.heat - 6);
  }

  // Rival retaliation - FAMILY-BASED AI (3 rival families attack individually)
  initRivalAI();
  rivalAIGrowth();
  processRivalFamilyAttacks();

  checkFamilyRankUp();
}

// ==================== FAMILY CHOICE SYSTEM ====================

// Show family selection screen
function showFamilyChoice() {
  let html = `
    <h2 style="color:#c0a040; text-align:center; margin-bottom:10px; font-size:2.2em; text-shadow:2px 2px 4px rgba(0,0,0,0.5);">
      Choose Your Family
    </h2>
    <p style="color:#d4c4a0; text-align:center; margin-bottom:25px; font-size:1em;">
      Every player must pledge to a crime family. Your choice determines your allies, enemies, and unique advantages.<br>
      <strong style="color:#8b3a3a;">This decision is permanent.</strong>
    </p>
    <div style="display:grid; gap:20px;">`;

  Object.entries(RIVAL_FAMILIES).forEach(([famId, fam]) => {
    html += `
      <div style="background:linear-gradient(135deg, ${fam.color}22, rgba(20, 18, 10,0.9)); padding:25px; border-radius:14px; border-left:5px solid ${fam.color}; cursor:pointer; transition:transform 0.2s;"
           onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px;">
          <span style="font-size:1.4em; font-weight:bold; color:${fam.color};">${fam.icon}</span>
          <div>
            <h3 style="color:${fam.color}; margin:0; font-size:1.3em;">${fam.name}</h3>
            <div style="color:#8a7a5a; font-size:0.85em;">${fam.ethnicity} crime family</div>
          </div>
        </div>
        <p style="color:#d4c4a0; margin:0 0 12px 0; font-size:0.95em; line-height:1.4;">${fam.storyIntro}</p>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
          <div style="background:rgba(138, 154, 106,0.2); padding:6px 12px; border-radius:6px; font-size:0.85em; color:#8a9a6a;">
            ${fam.buff.name}: ${fam.buff.description}
          </div>
          <div style="background:rgba(52,152,219,0.2); padding:6px 12px; border-radius:6px; font-size:0.85em; color:#c0a062;">
            Turf: ${fam.turfZones.length} zones
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <div style="font-size:0.85em; color:#8b3a3a; margin-bottom:4px;">Don: ${fam.don.name} (Power: ${fam.don.power})</div>
          <div style="font-size:0.85em; color:#8b6a4a; margin-bottom:4px;">Underboss: ${fam.underboss.name} (Power: ${fam.underboss.power})</div>
          <div style="font-size:0.85em; color:#8a7a5a;">Capos: ${fam.capos.length}</div>
        </div>
        <button onclick="pledgeToFamily('${famId}')"
          style="width:100%;padding:12px;background:linear-gradient(135deg,${fam.color},${fam.color}cc);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;font-size:1.05em;">
          Pledge to the ${fam.name}
        </button>
      </div>`;
  });

  html += `</div>
    <div style="text-align:center; margin-top:25px;">
      <button onclick="showTerritoryControl();" style="padding:12px 30px;background:linear-gradient(135deg,#8a7a5a,#6a5a3a);border:none;border-radius:10px;color:white;font-weight:bold;cursor:pointer;"><- Back to Turf</button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}
window.showFamilyChoice = showFamilyChoice;

// Pledge allegiance to a family
async function pledgeToFamily(familyId) {
  const fam = RIVAL_FAMILIES[familyId];
  if (!fam) return;

  const confirmed = await ui.confirm(
    `Pledge your loyalty to the ${fam.name}?\n\n` +
    `Buff: ${fam.buff.name} -- ${fam.buff.description}\n` +
    `This is permanent! The other families will become your enemies.`
  );

  if (confirmed) {
    player.chosenFamily = familyId;
    player.familyRank = 'associate';
    player.turf.reputation = (player.turf.reputation || 0) + 10;
    player.territoryReputation = (player.territoryReputation || 0) + 10;

    showBriefNotification(`You've joined the ${fam.name}!`, 'success');
    logAction(`You pledged your loyalty to <strong>the ${fam.name}</strong>. ${fam.storyIntro}`);
    logAction(`Welcome to the family, Associate. The ${fam.name} expects great things from you.`);

    updateUI();
    window._opsActiveTab = 'territory';
    showMissions();
  }
}
window.pledgeToFamily = pledgeToFamily;



// Show Protection Rackets
function showProtectionRackets() {
  let html = `
    <h2 style="color: #c0a040; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      Protection Rackets
    </h2>

    <div style="background: rgba(243, 156, 18, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #c0a040; margin: 0 0 10px 0;">Protection Racket Tips</h3>
      <ul style="color: #d4c4a0; margin: 0; padding-left: 20px;">
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
        <h3 style="color: #c0a040; margin-bottom: 15px;">Active Rackets</h3>
        <div style="display: grid; gap: 15px;">`;

    player.protectionRackets.forEach(racket => {
      const business = protectionBusinesses.find(b => b.id === racket.businessId);
      // Look up zone name from turf system
      initTurfZones();
      const turfZone = (player.turf._zones || []).find(z => z.id === racket.territoryId);
      const zoneName = turfZone ? turfZone.name : 'Unknown Turf';

      html += `
        <div style="background: rgba(20, 18, 10, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${business.name}</h4>
              <p style="color: #d4c4a0; margin: 0 0 5px 0; font-size: 0.9em;">${business.description}</p>
              <div style="font-size: 0.8em; color: #8a7a5a;">${zoneName}</div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #c0a040; font-weight: bold;">$${racket.weeklyPayment.toLocaleString()}/week</div>
              <div style="color: #d4c4a0; font-size: 0.9em;">Fear: ${racket.fearLevel.toFixed(1)}</div>
            </div>
          </div>
          <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="collectProtection('${racket.id}')"
                style="padding: 5px 10px; background: #7a8a5a; border: none; border-radius: 5px;
                    color: white; cursor: pointer; font-size: 0.8em;">
              Collect
            </button>
            <button onclick="pressureBusiness('${racket.id}')"
                style="padding: 5px 10px; background: #e67e22; border: none; border-radius: 5px;
                    color: white; cursor: pointer; font-size: 0.8em;">
              Pressure
            </button>
            <button onclick="dropProtection('${racket.id}')"
                style="padding: 5px 10px; background: #8b3a3a; border: none; border-radius: 5px;
                    color: white; cursor: pointer; font-size: 0.8em;">
              Drop
            </button>
          </div>
        </div>`;
    });

    html += `</div></div>`;
  }

  // Show available businesses to approach (cache for approachBusiness lookups)
  const availableBusinesses = getAvailableBusinessesForProtection();
  _cachedAvailableBusinesses = availableBusinesses;
  if (availableBusinesses.length > 0) {
    html += `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #7a8a5a; margin-bottom: 15px;">Available Businesses</h3>
        <div style="display: grid; gap: 15px;">`;

    availableBusinesses.forEach(business => {
      html += `
        <div style="background: rgba(20, 18, 10, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${business.name}</h4>
              <p style="color: #d4c4a0; margin: 0 0 10px 0; font-size: 0.9em;">${business.description}</p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #8b3a3a;">Risk: ${business.riskLevel}</span>
                <span style="background: rgba(52, 152, 219, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #c0a062;">Type: ${business.type}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #c0a040; font-weight: bold;">$${business.basePayment.toLocaleString()}/week</div>
              <div style="color: #d4c4a0; font-size: 0.9em;">Base Rate</div>
              <button onclick="approachBusiness('${business.id}', '${business.territoryId}')"
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #7a8a5a, #8a9a6a);
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                 Approach
              </button>
            </div>
          </div>
        </div>`;
    });

    html += `</div></div>`;
  } else {
    html += `
      <div style="background: rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 3em; margin-bottom: 10px;"></div>
        <h3 style="color: #8b3a3a; margin: 0 0 10px 0;">No Available Businesses</h3>
        <p style="color: #d4c4a0; margin: 0;">Seize more turf zones to find businesses that need "protection".</p>
      </div>`;
  }

  html += `
    <div style="text-align: center; margin-top: 25px;">
      <button onclick="window._opsActiveTab='rackets'; showMissions();"
          style="padding: 12px 30px; background: linear-gradient(135deg, #8a7a5a, #6a5a3a);
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        <- Back to Operations
      </button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Get Available Businesses for Protection
function getAvailableBusinessesForProtection() {
  const availableBusinesses = [];

  // Use turf system -- owned zones generate businesses
  initTurfZones();
  const ownedZones = (player.turf._zones || []).filter(z => (player.turf.owned || []).includes(z.id));

  ownedZones.forEach(zone => {
    // Generate 2-4 businesses per zone
    const businessCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < businessCount; i++) {
      const businessInRacket = player.protectionRackets.some(racket =>
        racket.territoryId === zone.id && racket.businessIndex === i
      );

      if (!businessInRacket) {
        const randomBusiness = protectionBusinesses[Math.floor(Math.random() * protectionBusinesses.length)];
        availableBusinesses.push({
          ...randomBusiness,
          templateId: randomBusiness.id, // Preserve original template ID for racket storage
          territoryId: zone.id,
          businessIndex: i,
          id: `${zone.id}_business_${i}`
        });
      }
    }
  });

  return availableBusinesses.slice(0, 10);
}

// Show Corruption System
function showCorruption() {
  let html = `
    <h2 style="color: #8b6a4a; text-align: center; margin-bottom: 25px; font-size: 2.2em; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      Corruption Network
    </h2>

    <div style="background: rgba(155, 89, 182, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
      <h3 style="color: #8b6a4a; margin: 0 0 10px 0;">Corruption Tips</h3>
      <ul style="color: #d4c4a0; margin: 0; padding-left: 20px;">
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
        <h3 style="color: #8b6a4a; margin-bottom: 15px;"> Active Corruption</h3>
        <div style="display: grid; gap: 15px;">`;

    player.corruptedOfficials.forEach(official => {
      const target = corruptionTargets.find(t => t.id === official.targetId);
      const timeLeft = Math.max(0, (official.expirationDate - Date.now()) / (24 * 60 * 60 * 1000));

      html += `
        <div style="background: rgba(20, 18, 10, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${target.name}</h4>
              <p style="color: #d4c4a0; margin: 0 0 10px 0; font-size: 0.9em;">${target.description}</p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(155, 89, 182, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #8b6a4a;">Influence: ${target.influence}</span>
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #8b3a3a;">Risk: ${target.riskLevel}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #8b6a4a; font-weight: bold;">${timeLeft.toFixed(1)} days left</div>
              <div style="color: #d4c4a0; font-size: 0.9em;">Protection Active</div>
              <button onclick="renewCorruption('${official.id}')"
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #7a5a3a, #8b6a4a);
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">
                Renew
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
        <h3 style="color: #7a8a5a; margin-bottom: 15px;">Available Targets</h3>
        <div style="display: grid; gap: 15px;">`;

    availableTargets.forEach(target => {
      const canAfford = player.money >= target.baseCost;

      html += `
        <div style="background: rgba(20, 18, 10, 0.8); padding: 15px; border-radius: 10px;">
          <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h4 style="color: #f5e6c8; margin: 0 0 5px 0;">${target.name}</h4>
              <p style="color: #d4c4a0; margin: 0 0 10px 0; font-size: 0.9em;">${target.description}</p>

              <div style="background: rgba(0, 0, 0, 0.3); padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                <div style="font-size: 0.85em; color: #f5e6c8; margin-bottom: 5px; font-weight: bold;">Benefits:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 5px;">`;

      const benefitLabels = {
        heatReduction: 'Heat Reduction',
        crimeBonus: 'Job Success',
        evidenceDestruction: 'Evidence Destroyed',
        raidWarning: 'Raid Warning',
        businessLicense: 'Cheaper Businesses',
        zonePermits: 'Faster Turf Capture',
        sentenceReduction: 'Jail Time Reduced',
        casesDismissed: 'Cases Dismissed',
        cityWideProtection: 'City-Wide Heat Reduction',
        contractAccess: 'Better Business Contracts'
      };
      Object.entries(target.benefits).forEach(([key, value]) => {
        if (key !== 'duration') {
          const bonus = typeof value === 'number' ? Math.round(value * 100) : value;
          const label = benefitLabels[key] || key.replace(/([A-Z])/g, ' $1').toLowerCase();
          html += `<span style="background: rgba(138, 154, 106, 0.3); padding: 1px 4px; border-radius: 3px;
                  font-size: 0.75em; color: #8a9a6a;">${bonus}% ${label}</span>`;
        }
      });

      html += `
                </div>
                <div style="margin-top: 5px; font-size: 0.8em; color: #c0a040;">
                  Duration: ${target.benefits.duration} days
                </div>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(155, 89, 182, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #8b6a4a;">Influence: ${target.influence}</span>
                <span style="background: rgba(231, 76, 60, 0.3); padding: 2px 6px; border-radius: 4px;
                      font-size: 0.8em; color: #8b3a3a;">Risk: ${target.riskLevel}</span>
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="color: #c0a040; font-weight: bold; font-size: 1.1em;">$${target.baseCost.toLocaleString()}</div>
              <div style="color: #d4c4a0; font-size: 0.8em;">Bribe Cost</div>
              <button onclick="corruptOfficial('${target.id}')"
                  style="margin-top: 10px; padding: 8px 15px; background: linear-gradient(135deg, #7a5a3a, #8b6a4a);
                      border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;
                      ${!canAfford ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                Bribe
              </button>
              ${!canAfford ? `<div style="text-align: center; margin-top: 5px; font-size: 0.8em; color: #8b3a3a;">
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
      <button onclick="goBackToMainMenu()"
          style="padding: 12px 30px; background: linear-gradient(135deg, #8a7a5a, #6a5a3a);
              border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">
        <- Back to SafeHouse
      </button>
    </div>`;

  document.getElementById("territory-control-content").innerHTML = html;
  hideAllScreens();
  document.getElementById("territory-control-screen").style.display = "block";
}

// Helper Functions for Territory Control
function getHeatColor(heat) {
  if (heat < 20) return '#8a9a6a';
  if (heat < 50) return '#c0a040';
  return '#8b3a3a';
}

function getRiskColor(riskLevel) {
  switch(riskLevel) {
    case 'low': return '#8a9a6a';
    case 'medium': return '#c0a040';
    case 'high': return '#8b3a3a';
    case 'very high': return '#8b3a3a';
    case 'extreme': return '#8b6a4a';
    default: return '#d4c4a0';
  }
}

// ==================== UNIFIED OPERATIONS PANEL GENERATORS ====================

// Generate Turf Overview HTML -- combines family banner, stats, turf map, owned zones, and turf missions
function generateTurfOverviewHTML() {
  initTurfZones();
  const zones = player.turf._zones || [];
  const ownedZones = zones.filter(z => (player.turf.owned || []).includes(z.id));
  const fam = player.chosenFamily ? RIVAL_FAMILIES[player.chosenFamily] : null;
  const rankLabel = (player.familyRank || 'associate').charAt(0).toUpperCase() + (player.familyRank || 'associate').slice(1);
  const alliedZones = fam ? (fam.turfZones || []) : [];

  let html = '<div style="display:flex; flex-direction:column; gap:20px;">';

  // -- 1. Family allegiance banner --
  if (fam) {
    html += `
    <div style="background:linear-gradient(135deg, ${fam.color}33, ${fam.color}11); padding:15px; border-radius:10px; border-left:4px solid ${fam.color};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <strong style="color:${fam.color}; font-size:1.1em;">${fam.icon}</strong>
          <span style="color:#d4c4a0; margin-left:10px;">Rank: <strong style="color:#c0a040;">${rankLabel}</strong></span>
        </div>
        <div style="color:#d4c4a0; font-size:0.9em;">${fam.buff.name}: ${fam.buff.description}</div>
      </div>
    </div>`;
  } else {
    html += `
    <div style="background:rgba(231,76,60,0.2); padding:20px; border-radius:10px; text-align:center;">
      <div style="font-size:3em; margin-bottom:10px;"></div>
      <div style="color:#8b3a3a; font-weight:bold; font-size:1.1em; margin-bottom:8px;">No Family Allegiance</div>
      <p style="color:#d4c4a0; margin:0 0 15px 0;">Choose a family to pledge your loyalty. Each family offers a unique story and buff.</p>
      <button onclick="showFamilyChoice()" style="padding:12px 30px; background:linear-gradient(135deg,#8b3a3a,#7a2a2a); border:none; border-radius:10px; color:white; font-weight:bold; cursor:pointer; font-size:1.1em;">
        Choose Your Family
      </button>
    </div>`;
  }

  // -- 2. Stats bar --
  html += `
    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px;">
      <div style="flex:1; min-width:120px; background:rgba(52,152,219,0.2); padding:15px; border-radius:10px; text-align:center;">
        <div style="font-size:1.6em; color:#c0a062;"></div>
        <div style="font-size:0.9em; color:#d4c4a0;">Turf Power</div>
        <div style="font-size:1.3em; font-weight:bold; color:#f5e6c8;">${player.turf.power || 100}</div>
      </div>
      <div style="flex:1; min-width:120px; background:rgba(138, 154, 106,0.2); padding:15px; border-radius:10px; text-align:center;">
        <div style="font-size:1.6em; color:#8a9a6a;"></div>
        <div style="font-size:0.9em; color:#d4c4a0;">Weekly Income</div>
        <div style="font-size:1.3em; font-weight:bold; color:#f5e6c8;">$${(player.turf.income || 0).toLocaleString()}</div>
      </div>
      <div style="flex:1; min-width:120px; background:rgba(155,89,182,0.2); padding:15px; border-radius:10px; text-align:center;">
        <div style="font-size:1.6em; color:#8b6a4a;"></div>
        <div style="font-size:0.9em; color:#d4c4a0;">Turf Zones</div>
        <div style="font-size:1.3em; font-weight:bold; color:#f5e6c8;">${ownedZones.length} / ${zones.length}</div>
      </div>
    </div>`;

  // -- 3. Turf Map -- grid of all zones --
  html += `
    <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:10px;">
      <div style="color:#7a8a5a; font-weight:bold; font-size:1.1em; margin-bottom:10px;">Turf Map</div>
      <div style="display:flex; flex-wrap:wrap; gap:10px; font-size:0.85em; color:#d4c4a0; margin-bottom:15px;">
        <span>Yours</span> <span>Allied</span> <span>Rival</span> <span>Contested</span> <span>Independent</span>
      </div>
      <div style="display:grid; gap:15px;">`;

  zones.forEach(zone => {
    const isOwned = (player.turf.owned || []).includes(zone.id);
    const isAllied = !isOwned && alliedZones.includes(zone.id) && zone.controlledBy === player.chosenFamily;
    const isContested = zone.controlledBy === 'contested';
    const isIndependent = zone.controlledBy === 'independent';
    const controllerFamily = (!isOwned && !isAllied && !isContested && !isIndependent) ? RIVAL_FAMILIES[zone.controlledBy] : null;

    const borderColor = isOwned ? '#8a9a6a' : isAllied ? '#c0a062' : isContested ? '#6a5a3a' : isIndependent ? '#c0a040' : '#8b3a3a';
    const statusLabel = isOwned ? 'Your Turf' : isAllied ? `${fam?.name || 'Allied'}` : isContested ? 'Contested' : isIndependent ? 'Independent' : `${controllerFamily?.name || zone.controlledBy}`;
    const zoneIncome = calculateTurfZoneIncome(zone);

    html += `
      <div style="background:rgba(20, 18, 10,0.8); padding:18px; border-radius:12px; border-left:4px solid ${borderColor};">
        <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:12px;">
          <div style="flex:1; min-width:220px;">
            <div style="color:#f5e6c8; font-weight:bold; font-size:1.05em; margin-bottom:6px;">${zone.icon} ${zone.name}</div>
            <p style="color:#d4c4a0; margin:0 0 8px 0; font-size:0.9em;">${zone.description}</p>
            <div style="font-size:0.85em; color:#d4c4a0;">
              <span style="color:#8a9a6a;">$${zoneIncome.toLocaleString()}/wk</span> |
              <span style="color:${getRiskColor(zone.riskLevel)};">${zone.riskLevel}</span>
            </div>
            <div style="margin-top:4px; font-size:0.85em; color:${borderColor};">${statusLabel}</div>`;

    // Boss / Don info for unowned zones
    if (zone.boss && !isOwned) {
      const bossInfo = findBossById(zone.boss);
      if (bossInfo && !(player.turf.bossesDefeated || []).includes(bossInfo.id)) {
        html += `<div style="margin-top:4px; font-size:0.85em; color:#8b3a3a;">Boss: ${bossInfo.name} (Power: ${bossInfo.power})</div>`;
      }
    }
    if (zone.don && !isOwned) {
      const donInfo = findBossById(zone.don);
      if (donInfo && !(player.turf.donsDefeated || []).includes(donInfo.id)) {
        html += `<div style="margin-top:4px; font-size:0.85em; color:#8b6a4a;">Don: ${donInfo.name} (Power: ${donInfo.power})</div>`;
      }
    }

    html += `</div><div style="text-align:right; min-width:140px;">`;

    if (isOwned) {
      html += `<button onclick="manageTurfDetails('${zone.id}')" style="width:100%;padding:10px;background:linear-gradient(135deg,#c0a062,#a08850);border:none;border-radius:8px;color:white;font-weight:bold;cursor:pointer;font-size:0.9em;">Manage</button>`;
    } else if (isAllied) {
      html += `<div style="color:#c0a062; font-size:0.9em; padding:10px;">Allied territory</div>`;
    } else {
      const atkPower = typeof calculateTurfAttackPower === 'function' ? calculateTurfAttackPower() : (player.turf.power || 100);
      const canAttack = atkPower >= zone.defenseRequired;
      const defColor = canAttack ? '#2ecc71' : '#e74c3c';
      const baseDef2 = zone.baseDefenseRequired || zone.defenseRequired;
      const fortBonus2 = zone.defenseRequired - baseDef2;
      const fortText2 = fortBonus2 > 0 ? ` <span style="color:#e67e22;">(+${fortBonus2})</span>` : '';
      html += `
        <div style="margin-bottom:8px; font-size:0.8em; text-align:center;">
          <div style="color:${defColor};font-weight:bold;">Defense: ${zone.defenseRequired}${fortText2}</div>
          <div style="font-size:0.7em;color:#888;">${canAttack ? 'You can attack' : 'Need more power'}</div>
        </div>
        <button onclick="attackTurfZone('${zone.id}')"
          style="width:100%;padding:10px;background:linear-gradient(135deg,#8b3a3a,#7a2a2a);border:none;border-radius:8px;color:white;font-weight:bold;cursor:pointer;font-size:0.9em;${!canAttack ? 'opacity:0.6;cursor:not-allowed;' : ''}">
          Attack
        </button>`;
    }

    html += `</div></div></div>`;
  });

  html += `</div></div>`;

  // -- 4. Your Turf -- owned zones with Manage/Fortify --
  if (ownedZones.length > 0) {
    html += `
    <div style="background:rgba(0,0,0,0.3); padding:20px; border-radius:10px;">
      <div style="color:#8b3a3a; font-weight:bold; font-size:1.1em; margin-bottom:15px;">Your Turf</div>
      <div style="display:grid; gap:15px;">`;

    ownedZones.forEach(zone => {
      const income = calculateTurfZoneIncome(zone);
      const heatLevel = player.