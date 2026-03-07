/**
 * player.js
 * 
 * Manages the player character's state, stats, skills, progression, and related functions.
 * This is the core data structure for the player's criminal empire, including:
 * - Basic stats (money, health, level, experience)
 * - Skills and skill trees (stealth, violence, charisma, intelligence, luck, endurance)
 * - Jail status and breakout mechanics
 * - Gang, territory, and business management
 * - Player progression functions (XP, level up)
 */

// ── CHARACTER BACKGROUNDS ──────────────────────────────────────
// Chosen at character creation. Each gives a small one-time starting bonus.
export const CHARACTER_BACKGROUNDS = [
  {
    id: 'street_rat',
    name: 'Street Rat',
    icon: '🐀',
    description: 'Grew up in the gutter. You know every alley and shortcut in the city.',
    flavor: 'The streets raised you — and the streets never forget their own.',
    bonus: { stealth: 2 },
    bonusText: '+2 Stealth'
  },
  {
    id: 'ex_cop',
    name: 'Disgraced Cop',
    icon: '🚔',
    description: 'Kicked off the force for corruption. You know how the law thinks.',
    flavor: 'You swore to protect and serve — now you serve yourself.',
    bonus: { intelligence: 2, reputation: 5 },
    bonusText: '+2 Intelligence, +5 Starting Reputation'
  },
  {
    id: 'trust_fund',
    name: 'Trust Fund Kid',
    icon: '💎',
    description: 'Born rich, bored of luxury. You crave the thrill of the underworld.',
    flavor: 'Money can\'t buy street cred — but it can buy a head start.',
    bonus: { money: 5000, charisma: 1 },
    bonusText: '+$5,000 Starting Cash, +1 Charisma'
  },
  {
    id: 'ex_con',
    name: 'Ex-Con',
    icon: '⛓️',
    description: 'Fresh out of prison with debts to pay and scores to settle.',
    flavor: 'Three years behind bars taught you more than any school ever could.',
    bonus: { violence: 2, power: 5 },
    bonusText: '+2 Violence, +5 Starting Power'
  },
  {
    id: 'immigrant',
    name: 'Immigrant Outsider',
    icon: '🌍',
    description: 'Came to this country with nothing. You\'ll take everything.',
    flavor: 'They said the streets had no room for outsiders. They were wrong.',
    bonus: { endurance: 2, luck: 1 },
    bonusText: '+2 Endurance, +1 Luck'
  },
  {
    id: 'hustler',
    name: 'Born Hustler',
    icon: '🎲',
    description: 'You\'ve been running cons since grade school. It\'s in your blood.',
    flavor: 'Everyone\'s a mark. Everyone\'s an opportunity.',
    bonus: { charisma: 1, luck: 1, money: 2000 },
    bonusText: '+1 Charisma, +1 Luck, +$2,000 Starting Cash'
  }
];

// ── CHARACTER PERKS ───────────────────────────────────────────
// Chosen at character creation. Permanent passive buffs that affect gameplay.
export const CHARACTER_PERKS = [
  {
    id: 'iron_will',
    name: 'Iron Will',
    icon: '🔥',
    description: 'Your willpower is unbreakable. You resist jail time better than anyone.',
    effect: 'Jail sentences reduced by 25%. +10% breakout success chance.',
    color: '#8b3a3a'
  },
  {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    icon: '🗣️',
    description: 'You could sell ice to a penguin. People trust you — that\'s their mistake.',
    effect: '+15% better prices when selling. +10% bribe & negotiation success.',
    color: '#c0a040'
  },
  {
    id: 'quick_hands',
    name: 'Quick Hands',
    icon: '🤚',
    description: 'Lightning-fast reflexes. You act before others can react.',
    effect: '-15% crime cooldown on all jobs. +10% car theft success.',
    color: '#c0a062'
  },
  {
    id: 'street_smarts',
    name: 'Street Smarts',
    icon: '🧠',
    description: 'You read people and situations like an open book.',
    effect: '+15% job success chance. +10% XP from all sources.',
    color: '#8a9a6a'
  },
  {
    id: 'lucky_devil',
    name: 'Lucky Devil',
    icon: '🍀',
    description: 'Fortune favors you. Lucky breaks seem to follow you everywhere.',
    effect: '+20% casino winnings. +10% chance for bonus loot on jobs.',
    color: '#8b6a4a'
  },
  {
    id: 'thick_skin',
    name: 'Thick Skin',
    icon: '🛡️',
    description: 'You can take a beating and keep on ticking.',
    effect: '-25% health loss from jobs. +15 max health.',
    color: '#1abc9c'
  }
];

// Global player stats
export const player = {
  name: "", // Player's name
  gender: "", // Player's gender: "male" or "female"
  ethnicity: "", // Player's ethnicity: "white", "black", "asian", "mexican"
  portrait: "", // Path to player's portrait image
  background: null, // CHARACTER_BACKGROUNDS id chosen at creation
  perk: null,       // CHARACTER_PERKS id chosen at creation
  storyProgress: null, // Set when player begins a family story
  money: 0, // Starting with no money for maximum challenge
  inventory: [],
  stolenCars: [], // Array to store stolen cars
  selectedCar: null, // Currently selected car for jobs
  jobCooldowns: {}, // Crime cooldown timers: { jobIndex: endTimestamp }
  ammo: 0, // Player's ammo count
  gas: 0, // Player's gas count
  health: 100, // Player's health
  inJail: false,
  jailTime: 0, // Time left in jail in seconds
  breakoutChance: 45, // Breakout chance (in percent), decreased slightly
  breakoutAttempts: 3, // Number of breakout attempts left
  power: 0, // Player's power level
  wantedLevel: 0, // Player's wanted level
  reputation: 0, // Player's reputation
  level: 1, // Player's level
  experience: 0, // Player's experience points
  skillPoints: 0, // Legacy (kept for save compat) — training now uses money
  activeTraining: null, // Gym-style: { tree, node, startTime, duration }
  activeHealing: null, // Hospital timer: { type, startTime, duration, healAmount }
  bountyBoard: { targets: [], lastRefresh: 0 }, // Bounty board state
  // ── Unified RPG Skill Tree ──
  // 6 trees × 6 nodes each (2 per tier). Tier 1: max 10, Tier 2: max 10, Tier 3: max 5.
  skillTree: {
    stealth:      { shadow_step: 0, light_feet: 0, infiltration: 0, escape_artist: 0, ghost_protocol: 0, surveillance: 0 },
    combat:       { brawler: 0, toughness: 0, firearms: 0, melee_mastery: 0, intimidation: 0, enforcer: 0 },
    charisma:     { smooth_talker: 0, street_cred: 0, negotiation: 0, leadership: 0, manipulation: 0, kingpin_aura: 0 },
    intelligence: { quick_study: 0, awareness: 0, hacking: 0, planning: 0, forensics: 0, mastermind: 0 },
    luck:         { fortune: 0, serendipity: 0, gambling: 0, scavenger: 0, jackpot: 0, lucky_break: 0 },
    endurance:    { vitality: 0, conditioning: 0, recovery: 0, resilience: 0, resistance: 0, unstoppable: 0 }
  },
  streetReputation: {
    torrino: 0, // Torrino Family reputation
    kozlov: 0, // Kozlov Bratva reputation
    chen: 0, // Chen Triad reputation
    morales: 0, // Morales Cartel reputation
    police: 0, // Police corruption level
    civilians: 0, // Public respect
    underground: 0 // Standing in the Commission
  },
  playstyleStats: {
    stealthyJobs: 0,
    violentJobs: 0,
    diplomaticActions: 0,
    hackingAttempts: 0,
    gamblingWins: 0
  },
  territory: 0, // Legacy — kept for backward compat; see turf system below
  currentTerritory: null, // District ID where the player currently lives (MP spawn/relocation)
  lastTerritoryMove: 0,   // Timestamp of last territory relocation (cooldown tracking)

  // ── Singleplayer Turf System ──────────────────────────────────
  chosenFamily: null,       // Family ID the player sided with ('torrino','kozlov','chen','morales')
  familyRank: 'associate',  // associate → soldier → capo → underboss → don
  turf: {                   // All SP turf data lives here
    owned: [],              // Array of turf zone IDs the player controls
    bossesDefeated: [],     // Boss IDs killed (each only once)
    donsDefeated: [],       // Don IDs killed (each only once)
    income: 0,              // Weekly turf tribute total
    heat: {},               // Heat per zone ID
    power: 100,             // Player's overall turf power
    reputation: 0,          // Street rep from turf activity
    events: [],             // Active turf war events
    fortifications: {},     // { zoneId: level } for fortified turf
    lastTributeCollection: 0 // Timestamp
  },
  gang: {
    members: 0,
    loyalty: 100,
    lastTributeTime: 0, // Timestamp of last tribute collection
    gangMembers: [], // Array to store individual soldiers
    activeOperations: [], // Array to store ongoing family business
    trainingQueue: [], // Array to store associates in training
    betrayalHistory: [], // Track past betrayal events
    lastBetrayalCheck: 0 // Timestamp of last loyalty check
  },
  realEstate: {
    ownedProperties: [], // Array to store owned properties
    maxGangMembers: 5 // Base capacity without any safehouses
  },
  missions: {
    currentChapter: 0,
    completedMissions: [],
    completedCampaigns: [],
    factionReputation: {
      torrino: 0,
      kozlov: 0,
      chen: 0,
      morales: 0
    },
    unlockedTurfMissions: [],
    unlockedBossBattles: [],
    missionStats: {
      jobsCompleted: 0,
      moneyEarned: 0,
      gangMembersRecruited: 0,
      turfControlled: 0,
      bossesDefeated: 0,
      donsDefeated: 0,
      factionMissionsCompleted: 0
    }
  },
  businesses: [], // Array to store owned fronts
  dirtyMoney: 0, // Cash that needs to be cleaned
  launderingSetups: [], // Array to store active wash cycles
  activeLaundering: [], // Array of pending laundering ops {id, methodId, methodName, amount, cleanAmount, startedAt, completesAt}
  businessLastCollected: {}, // Object to track last collection time for each front
  
  // Territory Control — legacy props kept for updateUI sync
  protectionRackets: [], // Active protection rackets
  territoryIncome: 0, // Weekly tribute
  corruptedOfficials: [], // Bribed officials with expiration
  territoryPower: 100, // Overall territory power
  territoryReputation: 0, // Territory reputation score
  
  // Long-term Goals System
  empireRating: {
    totalScore: 0,
    moneyPower: 0,
    gangPower: 0,
    turfPower: 0,
    businessPower: 0,
    reputationPower: 0,
    skillPower: 0
  },

  // === Social System ===
  friends: [],          // Array of { name, addedAt }
  blocked: [],          // Array of { name, blockedAt }
  crewId: null,         // Crew the player belongs to (ID)
  crewRole: null,       // 'leader' | 'officer' | 'member'
  title: null,          // Currently equipped achievement title string

  // === Daily Login Rewards ===
  dailyLogin: {
    lastClaimDate: null,  // ISO date string of last claim
    streak: 0,            // Current consecutive days
    totalDays: 0          // Total days claimed ever
  },

  // === Active Buffs (from daily rewards / consumables) ===
  activeBuffs: [],  // Array of { id, name, effect, value, expiresAt (timestamp) }

  // === Skill Respec ===
  respecCount: 0,  // Number of times player has respecced (cost scales)

  // === Economy Upkeep ===
  lastUpkeepCollection: null,  // ISO date string for daily upkeep deductions

  // === Superboss System ===
  superbossesDefeated: [],  // Array of superboss IDs defeated
  superbossInvites: [],     // Pending superboss fight invites from other players

  // === Seasonal Event Participation ===
  seasonalEventProgress: {} // { eventId: { score, completedObjectives[] } }
};

/**
 * Grant experience points to the player and check for level up
 * @param {number} amount - Amount of XP to grant
 */
export function gainExperience(amount) {
  // Street Smarts perk: +10% XP from all sources
  if (player.perk === 'street_smarts') {
    amount = Math.floor(amount * 1.10);
  }
  // Turf milestone perk: +10% XP (Street Presence — 2 zones)
  if (typeof window !== 'undefined' && typeof window.hasTurfPerk === 'function' && window.hasTurfPerk('xp_boost')) {
    amount = Math.floor(amount * 1.10);
  }
  // Mastermind: +10% XP per rank
  const mastermindLevel = (player.skillTree && player.skillTree.intelligence && player.skillTree.intelligence.mastermind) || 0;
  if (mastermindLevel > 0) {
    amount = Math.floor(amount * (1 + mastermindLevel * 0.10));
  }
  player.experience += amount;
  // Note: logAction is defined in game.js and exposed via window.logAction
  if (typeof window !== 'undefined' && typeof window.logAction === 'function') {
    window.logAction(`You gained ${amount} experience points.`);
  }
  checkLevelUp();
}

/**
 * Check if player has enough XP to level up and process the level up
 */
export function checkLevelUp() {
  // v1.16.2 Rebalance: Further lowered XP curve for faster level-ups
  let requiredXP = Math.floor(player.level * 200 + Math.pow(player.level, 2) * 40 + Math.pow(player.level, 3) * 2);
  if (player.experience >= requiredXP) {
    player.level++;
    player.experience -= requiredXP;
    player.reputation = (player.reputation || 0) + 5; // Gain 5 reputation per level up
    
    // Show dramatic level up screen effects
    if (typeof window !== 'undefined' && typeof window.showLevelUpEffects === 'function') {
      window.showLevelUpEffects();
    }
    
    if (typeof window !== 'undefined' && typeof window.logAction === 'function') {
      window.logAction(` The streets recognize your growing power! You've clawed your way up to level ${player.level}. Every scar tells a story, every skill hard-earned.`);
    }
  }
}

// Energy system removed — replaced by crime cooldown timers.
// Legacy stubs kept for backward compatibility with old saves.
export function regenerateEnergy() {}
export function startEnergyRegenTimer() {}
export function startEnergyRegeneration() {}

// ── Unified Skill Tree Definitions ──────────────────────────────
// RPG-style talent trees with 3 tiers per discipline.
// Tier 1: Foundation skills (max 10 ranks, no prereqs)
// Tier 2: Specializations (max 10 ranks, require tier 1 node at rank 3 + 5 pts in tree)
// Tier 3: Masteries (max 5 ranks, require tier 2 node at rank 5 + 20 pts in tree)
export const SKILL_TREE_DEFS = {
  stealth: {
    name: "Shadow Arts",
    icon: "🕵️",
    color: "#8b6a4a",
    desc: "Move unseen, strike unheard. The art of the invisible hand.",
    nodes: {
      shadow_step:    { tier: 1, name: "Shadow Step",    icon: "🌑", maxRank: 10, desc: "Move unseen through the criminal underworld", effect: "-2% arrest chance per rank", prereqs: [] },
      light_feet:     { tier: 1, name: "Light Feet",     icon: "👣", maxRank: 10, desc: "Move silently through enemy territory", effect: "-3% detection chance per rank", prereqs: [] },
      infiltration:   { tier: 2, name: "Infiltration",   icon: "🔓", maxRank: 10, desc: "Break into secured locations with ease", effect: "+5% stealth job success per rank", prereqs: [{ node: "shadow_step", rank: 3 }] },
      escape_artist:  { tier: 2, name: "Escape Artist",  icon: "💨", maxRank: 10, desc: "Slip out of the tightest situations", effect: "-2s jail time, +3% breakout per rank", prereqs: [{ node: "light_feet", rank: 3 }] },
      ghost_protocol: { tier: 3, name: "Ghost Protocol", icon: "👻", maxRank: 5,  desc: "Become a phantom — practically invisible", effect: "-4% heat gain per rank", prereqs: [{ node: "infiltration", rank: 5 }] },
      surveillance:   { tier: 3, name: "Surveillance",   icon: "👁️", maxRank: 5,  desc: "Gather intel and stay ahead of enemies", effect: "+4% job intel per rank", prereqs: [{ node: "escape_artist", rank: 5 }] }
    }
  },
  combat: {
    name: "Combat",
    icon: "⚔️",
    color: "#8b3a3a",
    desc: "Raw power, deadly precision. Violence is a language you speak fluently.",
    nodes: {
      brawler:       { tier: 1, name: "Brawler",       icon: "👊", maxRank: 10, desc: "Raw fighting power and combat instincts", effect: "+5% combat power per rank", prereqs: [] },
      toughness:     { tier: 1, name: "Toughness",     icon: "🛡️", maxRank: 10, desc: "Shrug off hits that would drop lesser men", effect: "-2% hurt chance per rank", prereqs: [] },
      firearms:      { tier: 2, name: "Firearms",      icon: "🔫", maxRank: 10, desc: "Master the art of the gun", effect: "+6% armed job success per rank", prereqs: [{ node: "brawler", rank: 3 }] },
      melee_mastery: { tier: 2, name: "Melee Mastery", icon: "🗡️", maxRank: 10, desc: "Deadly in close quarters combat", effect: "+4% unarmed job success per rank", prereqs: [{ node: "brawler", rank: 3 }] },
      intimidation:  { tier: 3, name: "Intimidation",  icon: "😈", maxRank: 5,  desc: "Your reputation alone strikes terror", effect: "-10% wanted gain per rank", prereqs: [{ node: "firearms", rank: 5 }] },
      enforcer:      { tier: 3, name: "Enforcer",      icon: "💀", maxRank: 5,  desc: "The ultimate weapon of the underworld", effect: "+15% boss fight power per rank", prereqs: [{ node: "melee_mastery", rank: 5 }] }
    }
  },
  charisma: {
    name: "Influence",
    icon: "🗣️",
    color: "#c0a040",
    desc: "Words sharper than knives. Bend the world to your will without lifting a finger.",
    nodes: {
      smooth_talker: { tier: 1, name: "Smooth Talker",  icon: "💬", maxRank: 10, desc: "Words are your greatest weapon", effect: "+3% negotiation per rank", prereqs: [] },
      street_cred:   { tier: 1, name: "Street Cred",    icon: "🏆", maxRank: 10, desc: "Build your name on the streets", effect: "+2% reputation gain per rank", prereqs: [] },
      negotiation:   { tier: 2, name: "Negotiation",    icon: "🤝", maxRank: 10, desc: "Secure better deals and prices", effect: "+3% sell prices per rank", prereqs: [{ node: "smooth_talker", rank: 3 }] },
      leadership:    { tier: 2, name: "Leadership",     icon: "👑", maxRank: 10, desc: "Command respect and loyalty from your crew", effect: "+5% gang loyalty per rank", prereqs: [{ node: "street_cred", rank: 3 }] },
      manipulation:  { tier: 3, name: "Manipulation",   icon: "🎭", maxRank: 5,  desc: "Pull the strings from the shadows", effect: "+4% faction mission success per rank", prereqs: [{ node: "negotiation", rank: 5 }] },
      kingpin_aura:  { tier: 3, name: "Kingpin Aura",   icon: "💎", maxRank: 5,  desc: "Your presence commands every room", effect: "+5% all income per rank", prereqs: [{ node: "leadership", rank: 5 }] }
    }
  },
  intelligence: {
    name: "Intellect",
    icon: "🧠",
    color: "#c0a062",
    desc: "Outsmart, outplan, outmaneuver. The mind is the deadliest weapon.",
    nodes: {
      mastermind:  { tier: 1, name: "Mastermind",     icon: "🎯", maxRank: 5,  desc: "The brain behind every operation", effect: "+10% XP gain per rank", prereqs: [] },
      quick_study: { tier: 1, name: "Quick Study",   icon: "📚", maxRank: 10, desc: "A sharp mind that learns from every job", effect: "+4% job success per rank", prereqs: [] },
      awareness:   { tier: 1, name: "Awareness",     icon: "🔍", maxRank: 10, desc: "Nothing escapes your notice", effect: "+2% luck-based outcomes per rank", prereqs: [] },
      hacking:     { tier: 2, name: "Hacking",       icon: "💻", maxRank: 10, desc: "Master of digital infiltration", effect: "+7% cyber job success per rank", prereqs: [{ node: "quick_study", rank: 3 }] },
      planning:    { tier: 2, name: "Planning",       icon: "📋", maxRank: 10, desc: "Every detail accounted for", effect: "-5% crime cooldown per rank", prereqs: [{ node: "quick_study", rank: 3 }] },
      forensics:   { tier: 3, name: "Forensics",     icon: "🔬", maxRank: 5,  desc: "Clean up evidence like a professional", effect: "8% chance per rank to reduce wanted", prereqs: [{ node: "planning", rank: 5 }] }
    }
  },
  luck: {
    name: "Fortune",
    icon: "🍀",
    color: "#8a9a6a",
    desc: "Fortune favors the bold — and sometimes, the downright reckless.",
    nodes: {
      fortune:     { tier: 1, name: "Fortune",       icon: "🌟", maxRank: 10, desc: "The universe favors the bold", effect: "+2% earnings per rank", prereqs: [] },
      serendipity: { tier: 1, name: "Serendipity",   icon: "✨", maxRank: 10, desc: "Stumble into unexpected opportunities", effect: "+1% rare event chance per rank", prereqs: [] },
      gambling:    { tier: 2, name: "Gambling",       icon: "🎰", maxRank: 10, desc: "Turn the odds in your favor", effect: "+1% casino win rate per rank", prereqs: [{ node: "fortune", rank: 3 }] },
      scavenger:   { tier: 2, name: "Scavenger",      icon: "🔎", maxRank: 10, desc: "Find valuables others overlook", effect: "+3% bonus loot per rank", prereqs: [{ node: "serendipity", rank: 3 }] },
      jackpot:     { tier: 3, name: "Jackpot",        icon: "💰", maxRank: 5,  desc: "When you win, you win BIG", effect: "+4% critical success chance per rank", prereqs: [{ node: "gambling", rank: 5 }] },
      lucky_break: { tier: 3, name: "Lucky Break",    icon: "🍀", maxRank: 5,  desc: "Dodge bullets that fate aimed at your head", effect: "+5% avoid negative events per rank", prereqs: [{ node: "scavenger", rank: 5 }] }
    }
  },
  endurance: {
    name: "Endurance",
    icon: "💪",
    color: "#1abc9c",
    desc: "Outlast them all. When everyone else drops, you're still standing.",
    nodes: {
      vitality:     { tier: 1, name: "Vitality",      icon: "❤️", maxRank: 10, desc: "Raw physical toughness and stamina", effect: "-2% damage taken per rank", prereqs: [] },
      conditioning: { tier: 1, name: "Conditioning",  icon: "🏃", maxRank: 10, desc: "Push your body past its limits", effect: "+2 max health recovery per rank", prereqs: [] },
      recovery:     { tier: 2, name: "Recovery",       icon: "❤️‍🩹", maxRank: 10, desc: "Bounce back from anything", effect: "-5% hospital treatment time per rank", prereqs: [{ node: "vitality", rank: 3 }] },
      resilience:   { tier: 2, name: "Resilience",     icon: "🦾", maxRank: 10, desc: "Reduce the impact of injuries", effect: "-3% injury severity per rank", prereqs: [{ node: "conditioning", rank: 3 }] },
      resistance:   { tier: 3, name: "Resistance",     icon: "🛡️", maxRank: 5,  desc: "Nearly immune to punishment", effect: "-5% all damage taken per rank", prereqs: [{ node: "resilience", rank: 5 }] },
      unstoppable:  { tier: 3, name: "Unstoppable",    icon: "⚡", maxRank: 5,  desc: "An unstoppable force of nature", effect: "-8% all cooldowns per rank", prereqs: [{ node: "recovery", rank: 5 }] }
    }
  }
};

// Helper: get total points invested in a skill tree
export function getTreePointsSpent(treeName) {
  const tree = player.skillTree[treeName];
  if (!tree) return 0;
  return Object.values(tree).reduce((sum, v) => sum + v, 0);
}

// Helper: check if a node's prerequisites are met
export function canUnlockNode(treeName, nodeId) {
  const treeDef = SKILL_TREE_DEFS[treeName];
  if (!treeDef) return false;
  const nodeDef = treeDef.nodes[nodeId];
  if (!nodeDef) return false;
  const currentRank = player.skillTree[treeName][nodeId] || 0;
  if (currentRank >= nodeDef.maxRank) return false;
  // Tier point requirements: tier 2 needs 5 pts in tree, tier 3 needs 20 pts
  const ptsInTree = getTreePointsSpent(treeName);
  if (nodeDef.tier === 2 && ptsInTree < 5) return false;
  if (nodeDef.tier === 3 && ptsInTree < 20) return false;
  // Check prerequisite nodes
  for (const req of nodeDef.prereqs) {
    if ((player.skillTree[treeName][req.node] || 0) < req.rank) return false;
  }
  return true;
}

// Helper: check if a node is visible (prerequisites partially met or met)
export function isNodeAccessible(treeName, nodeId) {
  const treeDef = SKILL_TREE_DEFS[treeName];
  if (!treeDef) return false;
  const nodeDef = treeDef.nodes[nodeId];
  if (!nodeDef) return false;
  if (nodeDef.tier === 1) return true;
  // For tier 2+, show if at least one prereq node has been started
  for (const req of nodeDef.prereqs) {
    if ((player.skillTree[treeName][req.node] || 0) > 0) return true;
  }
  return false;
}

// Perk System removed — Phase 31

// Achievements system
export const achievements = [
  // === Early Game ===
  { id: "first_job", name: "First Day on the Job", description: "Complete your first job", unlocked: false, reward: { money: 500, xp: 25 }, title: "The Rookie" },
  { id: "first_blood", name: "First Blood", description: "Win your first fight or heist", unlocked: false, reward: { money: 1000, xp: 50 }, title: "Blooded" },
  { id: "wheels", name: "Hot Wheels", description: "Steal your first car", unlocked: false, reward: { money: 2000, xp: 50 }, title: "Wheelman" },
  { id: "armed_dangerous", name: "Armed & Dangerous", description: "Buy your first weapon", unlocked: false, reward: { money: 1000, xp: 30 }, title: "Armed" },
  { id: "property_owner", name: "Property Mogul", description: "Buy your first property", unlocked: false, reward: { money: 5000, xp: 100 }, title: "Landlord" },
  // === Money Milestones ===
  { id: "millionaire", name: "Big Shot", description: "Have $100,000", unlocked: false, reward: { money: 10000, xp: 100 }, title: "Big Shot" },
  { id: "half_mil", name: "High Roller", description: "Have $500,000", unlocked: false, reward: { money: 25000, xp: 200 }, title: "High Roller" },
  { id: "true_millionaire", name: "Millionaire", description: "Have $1,000,000", unlocked: false, reward: { money: 50000, xp: 500 }, title: "Millionaire" },
  { id: "multi_millionaire", name: "Multi-Millionaire", description: "Have $10,000,000", unlocked: false, reward: { money: 500000, xp: 1000 }, title: "Tycoon" },
  { id: "billionaire", name: "Criminal Tycoon", description: "Have $100,000,000", unlocked: false, reward: { money: 5000000, xp: 5000 }, title: "Criminal Tycoon" },
  // === Gang & Social ===
  { id: "first_recruit", name: "Right Hand Man", description: "Recruit your first gang member", unlocked: false, reward: { money: 2000, xp: 75 }, title: "Recruiter" },
  { id: "gang_leader", name: "Gang Leader", description: "Have 10 gang members", unlocked: false, reward: { money: 15000, xp: 200 }, title: "Gang Leader" },
  { id: "crime_family", name: "Crime Family", description: "Have 25 gang members", unlocked: false, reward: { money: 50000, xp: 500 }, title: "Crime Boss" },
  { id: "army", name: "Criminal Army", description: "Have 50 gang members", unlocked: false, reward: { money: 200000, xp: 1000 }, title: "Warlord" },
  { id: "faction_friend", name: "Friend of the Family", description: "Reach 25 reputation with any faction", unlocked: false, reward: { money: 10000, xp: 150 }, title: "Connected" },
  { id: "faction_ally", name: "Made Man", description: "Reach 50 reputation with any faction", unlocked: false, reward: { money: 50000, xp: 300 }, title: "Made Man" },
  // === Combat & Crime ===
  { id: "jail_break", name: "Great Escape", description: "Successfully break out of jail", unlocked: false, reward: { money: 5000, xp: 100 }, title: "Escape Artist" },
  { id: "most_wanted", name: "Most Wanted", description: "Reach wanted level 50", unlocked: false, reward: { money: 25000, xp: 300 }, title: "Most Wanted" },
  { id: "ghost", name: "Ghost", description: "Complete 10 jobs without getting arrested", unlocked: false, reward: { money: 20000, xp: 250 }, title: "The Ghost" },
  { id: "boss_slayer", name: "Boss Slayer", description: "Defeat your first rival boss", unlocked: false, reward: { money: 100000, xp: 500 }, title: "Boss Slayer" },
  // === Progression ===
  { id: "reputation_max", name: "Legendary Criminal", description: "Reach 100 reputation", unlocked: false, reward: { money: 100000, xp: 500 }, title: "Legendary" },
  { id: "level_10", name: "Rising Star", description: "Reach level 10", unlocked: false, reward: { money: 15000, xp: 200 }, title: "Rising Star" },
  { id: "level_25", name: "Veteran", description: "Reach level 25", unlocked: false, reward: { money: 100000, xp: 500 }, title: "Veteran" },
  { id: "level_50", name: "Kingpin", description: "Reach level 50", unlocked: false, reward: { money: 500000, xp: 2000 }, title: "Kingpin" },
  { id: "skill_master", name: "Skill Master", description: "Max out any base skill (20+)", unlocked: false, reward: { money: 25000, xp: 300 }, title: "Specialist" },
  // === Empire ===
  { id: "territory_3", name: "Neighborhood Boss", description: "Control 3 territories", unlocked: false, reward: { money: 30000, xp: 200 }, title: "Block Captain" },
  { id: "territory_10", name: "District King", description: "Control 10 territories", unlocked: false, reward: { money: 200000, xp: 500 }, title: "District King" },
  { id: "business_owner", name: "Legitimate Businessman", description: "Own your first business front", unlocked: false, reward: { money: 50000, xp: 200 }, title: "Businessman" },
  { id: "jobs_50", name: "Workhorse", description: "Complete 50 jobs", unlocked: false, reward: { money: 25000, xp: 300 }, title: "Workhorse" },
  { id: "jobs_200", name: "Professional", description: "Complete 200 jobs", unlocked: false, reward: { money: 100000, xp: 500 }, title: "Professional" },
  // === Mini-games ===
  { id: "lucky_streak", name: "Lucky Streak", description: "Win at the casino 3 times", unlocked: false, reward: { money: 10000, xp: 100 }, title: "Lucky" },
  { id: "gambler", name: "High Stakes Gambler", description: "Win at the casino 10 times", unlocked: false, reward: { money: 50000, xp: 250 }, title: "Gambler" },
  { id: "snake_king", name: "Snake King", description: "Score 20+ in Snake mini-game", unlocked: false, reward: { money: 15000, xp: 150 }, title: "Snake King" },
  { id: "quick_draw", name: "Fastest Gun", description: "React under 200ms in Quick Draw", unlocked: false, reward: { money: 20000, xp: 200 }, title: "Quickdraw" },
  // === Superboss ===
  { id: "superboss_first", name: "Giant Slayer", description: "Defeat your first Superboss", unlocked: false, reward: { money: 500000, xp: 3000 }, title: "Giant Slayer" },
  { id: "superboss_all", name: "Unstoppable", description: "Defeat all Superbosses", unlocked: false, reward: { money: 2000000, xp: 10000 }, title: "The Unstoppable" },
  // === Social/Multiplayer ===
  { id: "first_friend", name: "Networking", description: "Add your first friend", unlocked: false, reward: { money: 1000, xp: 50 }, title: "Social" },
  { id: "crew_founder", name: "Crew Founder", description: "Create a crew", unlocked: false, reward: { money: 10000, xp: 200 }, title: "Founder" },
  { id: "daily_7", name: "Dedicated", description: "Login 7 days in a row", unlocked: false, reward: { money: 25000, xp: 500 }, title: "Dedicated" },
  { id: "daily_30", name: "Loyal Soldier", description: "Login 30 days in a row", unlocked: false, reward: { money: 100000, xp: 2000 }, title: "Loyal Soldier" },
  { id: "hit_man", name: "Contract Killer", description: "Complete 5 anonymous hit contracts", unlocked: false, reward: { money: 50000, xp: 500 }, title: "Contract Killer" },
  { id: "poker_shark", name: "Card Shark", description: "Win 10 player poker hands", unlocked: false, reward: { money: 50000, xp: 300 }, title: "Card Shark" }
];
