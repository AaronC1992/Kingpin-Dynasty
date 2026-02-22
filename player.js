/**
 * player.js
 * 
 * Manages the player character's state, stats, skills, progression, and related functions.
 * This is the core data structure for the player's criminal empire, including:
 * - Basic stats (money, health, energy, level, experience)
 * - Skills and skill trees (stealth, violence, charisma, intelligence, luck, endurance)
 * - Jail status and breakout mechanics
 * - Gang, territory, and business management
 * - Legacy and retirement systems
 * - Player progression functions (XP, level up, energy regeneration)
 */

// Global player stats
export const player = {
  name: "", // Player's name
  gender: "", // Player's gender: "male" or "female"
  ethnicity: "", // Player's ethnicity: "white", "black", "asian", "mexican"
  portrait: "", // Path to player's portrait image
  money: 0, // Starting with no money for maximum challenge
  inventory: [],
  stolenCars: [], // Array to store stolen cars
  selectedCar: null, // Currently selected car for jobs
  energy: 100, // Player's energy (max 100)
  maxEnergy: 100, // Maximum energy capacity
  energyRegenTimer: 0, // Timer for energy regeneration (in seconds)
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
  skillPoints: 0, // Available skill points
  skills: {
    stealth: 0, // Reduces jail chance
    violence: 0, // Increases success chance for combat jobs
    charisma: 0, // Better prices and reduced suspicion
    intelligence: 0, // Better success rates overall
    luck: 0, // Better random events and payouts
    endurance: 0 // Reduces energy costs for jobs
  },
  // Advanced Skills System
  skillTrees: {
    stealth: {
      infiltration: 0, // Breaking into secured locations
      escape: 0, // Evading the Feds
      surveillance: 0 // Gathering intel on rivals
    },
    violence: {
      firearms: 0, // Tommy gun proficiency
      melee: 0, // Brass knuckles and bats
      intimidation: 0 // Making them an offer they can't refuse
    },
    charisma: {
      negotiation: 0, // Better deals with the Don
      leadership: 0, // Commanding your soldiers
      manipulation: 0 // Pulling the strings
    },
    intelligence: {
      hacking: 0, // Cracking safes and codes
      planning: 0, // Orchestrating the perfect hit
      forensics: 0 // Cleaning up the mess
    },
    luck: {
      gambling: 0, // Winning at the tables
      fortune: 0, // The devil's luck
      serendipity: 0 // Finding opportunities in chaos
    },
    endurance: {
      stamina: 0, // Outlasting the competition
      recovery: 0, // Bouncing back from a beating
      resistance: 0 // Tough as nails
    }
  },
  mentors: [], // Array of captured rivals who can teach skills
  streetReputation: {
    torrino: 0, // Torrino Family reputation
    kozlov: 0, // Kozlov Bratva reputation
    chen: 0, // Chen Triad reputation
    morales: 0, // Morales Cartel reputation
    police: 0, // Police corruption level
    civilians: 0, // Public respect
    underground: 0 // Standing in the Commission
  },
  unlockedPerks: [], // Array of unlocked perks based on playstyle
  playstyleStats: {
    stealthyJobs: 0,
    violentJobs: 0,
    diplomaticActions: 0,
    hackingAttempts: 0,
    gamblingWins: 0,
    mentoringSessions: 0
  },
  territory: 0, // Controlled turf
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
    missionStats: {
      jobsCompleted: 0,
      moneyEarned: 0,
      gangMembersRecruited: 0,
      territoriesControlled: 0,
      bossesDefeated: 0,
      factionMissionsCompleted: 0
    }
  },
  businesses: [], // Array to store owned fronts
  activeLoans: [], // Array to store active debts
  dirtyMoney: 0, // Cash that needs to be cleaned
  suspicionLevel: 0, // 0-100, affects Fed attention
  launderingSetups: [], // Array to store active wash cycles
  businessLastCollected: {}, // Object to track last collection time for each front
  
  // Territory Control System
  territories: [], // Controlled neighborhoods
  protectionRackets: [], // Active protection rackets
  territoryIncome: 0, // Weekly tribute from turf
  corruptedOfficials: [], // Bribed officials with expiration
  territoryEvents: [], // Active turf wars
  territoryHeat: {}, // Heat level per neighborhood
  territoryPower: 100, // Overall family power
  territoryReputation: 0, // Reputation on the streets
  
  // Long-term Goals System
  empireRating: {
    totalScore: 0,
    moneyPower: 0,
    gangPower: 0,
    territoryPower: 0,
    businessPower: 0,
    reputationPower: 0,
    skillPower: 0
  },
  legacy: {
    inheritanceBonus: 0, // Bonus from previous Dons
    familyReputation: 0, // Name recognition
    generationNumber: 1, // Which generation this Don is
    previousCharacters: [] // Array of previous Dons
  },
  retirementPlan: {
    available: false,
    legitimateAssets: 0,
    cleanMoney: 0,
    familyConnections: 0,
    exitStrategy: null
  }
};

/**
 * Grant experience points to the player and check for level up
 * @param {number} amount - Amount of XP to grant
 */
export function gainExperience(amount) {
  player.experience += amount;
  // Note: logAction is defined in game.js - will be available when modules are imported
  if (typeof logAction === 'function') {
    logAction(`You gained ${amount} experience points.`);
  }
  checkLevelUp();
}

/**
 * Check if player has enough XP to level up and process the level up
 */
export function checkLevelUp() {
  // Very steep XP curve for 60+ hour gameplay: high base + strong cubic scaling
  let requiredXP = Math.floor(player.level * 500 + Math.pow(player.level, 2) * 80 + Math.pow(player.level, 3) * 5);
  if (player.experience >= requiredXP) {
    player.level++;
    player.experience -= requiredXP;
    player.skillPoints += 2; // Gain 2 skill points per level (slower progression)
    
    // Bonus skill point at milestone levels (every 5 levels)
    if (player.level % 5 === 0) {
      player.skillPoints += 1; // Extra point at milestones
    }
    
    // Show dramatic level up screen effects
    if (typeof showLevelUpEffects === 'function') {
      showLevelUpEffects();
    }
    
    if (typeof logAction === 'function') {
      logAction(` The streets recognize your growing power! You've clawed your way up to level ${player.level}. Every scar tells a story, every skill hard-earned.`);
    }
  }
}

/**
 * Regenerate player energy over time (passive regeneration)
 * Called by the energy regeneration interval
 */
export function regenerateEnergy() {
  if (player.energy < player.maxEnergy && !player.inJail) {
    player.energyRegenTimer--;
    
    if (player.energyRegenTimer <= 0) {
      // Base 1 energy per tick; Recovery skill increases energy gained per tick
      const recoveryLevel = (player.skillTrees && player.skillTrees.endurance && player.skillTrees.endurance.recovery) || 0;
      const extraPerTick = Math.floor(recoveryLevel / 3); // +1 energy per 3 recovery levels (was 5)
      const energyGain = Math.max(1, 1 + extraPerTick);
      
      // Max energy scales with stamina skill tree (base 100 + 3 per stamina level)
      const staminaLevel = (player.skillTrees && player.skillTrees.endurance && player.skillTrees.endurance.stamina) || 0;
      player.maxEnergy = 100 + staminaLevel * 3;
      
      player.energy = Math.min(player.energy + energyGain, player.maxEnergy);
      
      // Regen interval: 20s base, reduced by 1s per 2 recovery levels (min 10s)
      const regenInterval = Math.max(10, 20 - Math.floor(recoveryLevel / 2));
      player.energyRegenTimer = regenInterval;
      
      if (typeof logAction === 'function') {
        logAction(` You catch your breath in the shadows. The adrenaline fades and your strength slowly returns. (+${energyGain} energy)`);
      }
      
      // Forensics skill: Advanced wanted level decay
      if (player.wantedLevel > 0 && player.skillTrees.intelligence.forensics > 0) {
        let forensicsDecayChance = player.skillTrees.intelligence.forensics * 3; // 3% chance per level
        if (Math.random() * 100 < forensicsDecayChance) {
          player.wantedLevel = Math.max(0, player.wantedLevel - 1);
          if (typeof logAction === 'function') {
            logAction(" Your forensics expertise helps eliminate evidence over time. Heat level decreased by 1!");
          }
        }
      }
      
      // Suspicion decay: suspicion slowly decreases when not doing dirty jobs
      // Base 15% chance per energy tick to lose 1 suspicion, boosted by forensics and stealth
      if (player.suspicionLevel && player.suspicionLevel > 0) {
        let decayChance = 15; // 15% base chance per energy tick
        const forensicsLevel = (player.skillTrees && player.skillTrees.intelligence && player.skillTrees.intelligence.forensics) || 0;
        const stealthLevel = (player.skills && player.skills.stealth) || 0;
        decayChance += forensicsLevel * 3; // +3% per forensics level
        decayChance += stealthLevel * 1; // +1% per stealth level
        
        if (Math.random() * 100 < decayChance) {
          const decayAmount = 1 + Math.floor(forensicsLevel / 4); // 1 base, +1 per 4 forensics levels
          player.suspicionLevel = Math.max(0, player.suspicionLevel - decayAmount);
          if (typeof logAction === 'function' && decayAmount > 0 && player.suspicionLevel > 0) {
            logAction(`🕵️ Time passes and the feds lose interest... suspicion decreased by ${decayAmount}.`);
          }
        }
      }
    }
    
    if (typeof updateUI === 'function') {
      updateUI();
    }
  }
}

/**
 * Start the energy regeneration timer when energy is consumed
 */
export function startEnergyRegenTimer() {
  if (player.energyRegenTimer === 0 && player.energy < player.maxEnergy) {
    const recoveryLevel = (player.skillTrees && player.skillTrees.endurance && player.skillTrees.endurance.recovery) || 0;
    const regenInterval = Math.max(10, 20 - Math.floor(recoveryLevel / 2));
    player.energyRegenTimer = regenInterval;
  }
}

/**
 * Initialize the energy regeneration interval (1 energy per 30 seconds)
 * Should be called once when the game starts
 */
export function startEnergyRegeneration() {
  setInterval(() => {
    regenerateEnergy();
  }, 1000); // Update every second for timer display
}

// Advanced Skills System Definitions

// Skill Tree Specializations
export const skillTreeDefinitions = {
  stealth: {
    name: "Stealth Mastery",
    icon: "🕵️",
    color: "#9b59b6",
    branches: {
      infiltration: {
        name: "Infiltration",
        icon: "🔓",
        description: "Master the art of breaking into secured locations",
        maxLevel: 10,
        benefits: level => `+${level * 5}% success on stealth jobs, +${level * 2}% lockpicking success`
      },
      escape: {
        name: "Escape Artist",
        icon: "💨",
        description: "Become a master of getting out of sticky situations",
        maxLevel: 10,
        benefits: level => `+${level * 3}% breakout success, -${level * 2}% arrest chance`
      },
      surveillance: {
        name: "Surveillance",
        icon: "👁️",
        description: "Gather intel and stay ahead of enemies",
        maxLevel: 10,
        benefits: level => `+${level * 4}% mission intel, +${level}% critical hit chance`
      }
    }
  },
  violence: {
    name: "Combat Prowess",
    icon: "⚔️",
    color: "#8b0000",
    branches: {
      firearms: {
        name: "Firearms",
        icon: "🔫",
        description: "Master the use of guns and ranged weapons",
        maxLevel: 10,
        benefits: level => `+${level * 6}% combat job success, +${level * 3}% headshot chance`
      },
      melee: {
        name: "Melee Combat",
        icon: "👊",
        description: "Excel in hand-to-hand combat situations",
        maxLevel: 10,
        benefits: level => `+${level * 4}% unarmed damage, +${level * 2}% disarm chance`
      },
      intimidation: {
        name: "Intimidation",
        icon: "😈",
        description: "Use fear as your weapon",
        maxLevel: 10,
        benefits: level => `+${level * 5}% extortion success, +${level * 3}% reputation gain`
      }
    }
  },
  charisma: {
    name: "Social Influence",
    icon: "🗣️",
    color: "#c0a062",
    branches: {
      negotiation: {
        name: "Negotiation",
        icon: "🤝",
        description: "Secure better deals and prices",
        maxLevel: 10,
        benefits: level => `+${level * 3}% better prices, +${level * 2}% bribe success`
      },
      leadership: {
        name: "Leadership",
        icon: "👑",
        description: "Command respect and loyalty from your gang",
        maxLevel: 10,
        benefits: level => `+${level * 5}% gang loyalty, +${level}% gang member capacity`
      },
      manipulation: {
        name: "Manipulation",
        icon: "🎭",
        description: "Control others through psychological tactics",
        maxLevel: 10,
        benefits: level => `+${level * 4}% information extraction, +${level * 2}% defection resistance`
      }
    }
  },
  intelligence: {
    name: "Mental Acuity",
    icon: "🧠",
    color: "#c0a062",
    branches: {
      hacking: {
        name: "Hacking",
        icon: "💻",
        description: "Master digital infiltration and cyber warfare",
        maxLevel: 10,
        benefits: level => `+${level * 7}% hacking success, +${level * 3}% digital heist rewards`
      },
      planning: {
        name: "Strategic Planning",
        icon: "📋",
        description: "Perfect preparation prevents poor performance",
        maxLevel: 10,
        benefits: level => `+${level * 4}% mission success, +${level * 2}% backup plan chance`
      },
      forensics: {
        name: "Forensics",
        icon: "🔬",
        description: "Clean up evidence and avoid detection",
        maxLevel: 10,
        benefits: level => `+${level * 5}% evidence cleanup, -${level * 3}% investigation heat`
      }
    }
  },
  luck: {
    name: "Fortune's Favor",
    icon: "🍀",
    color: "#f39c12",
    branches: {
      gambling: {
        name: "Gambling",
        icon: "🎰",
        description: "Turn the odds in your favor",
        maxLevel: 10,
        benefits: level => `+${level * 6}% casino winnings, +${level * 2}% jackpot chance`
      },
      fortune: {
        name: "Fortune",
        icon: "🌟",
        description: "Improve random events and discoveries",
        maxLevel: 10,
        benefits: level => `+${level * 4}% positive events, +${level * 3}% rare item finds`
      },
      serendipity: {
        name: "Serendipity",
        icon: "✨",
        description: "Find unexpected opportunities",
        maxLevel: 10,
        benefits: level => `+${level * 5}% bonus opportunities, +${level * 2}% special job unlocks`
      }
    }
  },
  endurance: {
    name: "Physical Resilience",
    icon: "💪",
    color: "#1abc9c",
    branches: {
      stamina: {
        name: "Stamina",
        icon: "🏃",
        description: "Perform longer operations without fatigue",
        maxLevel: 10,
        benefits: level => `+${level * 3} max energy, -${level * 2}% energy costs`
      },
      recovery: {
        name: "Recovery",
        icon: "❤️‍🩹",
        description: "Heal faster and recover energy more quickly",
        maxLevel: 10,
        benefits: level => `+${level * 5}% healing rate, +${level * 3}% energy regen`
      },
      resistance: {
        name: "Resistance",
        icon: "🛡️",
        description: "Resist drugs, poisons, and environmental hazards",
        maxLevel: 10,
        benefits: level => `+${level * 4}% poison resistance, +${level * 3}% drug tolerance`
      }
    }
  }
};

// Perk System
export const availablePerks = {
  // Stealth-based perks
  shadowWalker: {
    name: "Shadow Walker",
    icon: "🌑",
    description: "Your stealth expertise is legendary",
    requirements: { playstyle: "stealthyJobs", count: 25, skills: { stealth: 15 } },
    effects: "25% chance to avoid all negative consequences from failed stealth jobs"
  },
  ghostProtocol: {
    name: "Ghost Protocol",
    icon: "👻",
    description: "You leave no trace behind",
    requirements: { playstyle: "stealthyJobs", count: 50, skillTree: "stealth.surveillance", level: 5 },
    effects: "Automatically clean up evidence after jobs, reducing heat generation by 50%"
  },
  
  // Violence-based perks
  fearMonger: {
    name: "Fear Monger",
    icon: "😱",
    description: "Your reputation precedes you",
    requirements: { playstyle: "violentJobs", count: 25, skills: { violence: 15 } },
    effects: "Intimidation attempts have 30% higher success rate, enemies may flee before combat"
  },
  warMachine: {
    name: "War Machine",
    icon: "💣",
    description: "Violence is your language",
    requirements: { playstyle: "violentJobs", count: 50, skillTree: "violence.firearms", level: 7 },
    effects: "Combat jobs pay 50% more, but attract 25% more police attention"
  },
  
  // Charisma-based perks
  silverTongue: {
    name: "Silver Tongue",
    icon: "👄",
    description: "You could sell ice to an eskimo",
    requirements: { playstyle: "diplomaticActions", count: 30, skills: { charisma: 18 } },
    effects: "All negotiation attempts automatically succeed on first try"
  },
  kingmaker: {
    name: "Kingmaker",
    icon: "👑",
    description: "Leaders are made, not born",
    requirements: { playstyle: "diplomaticActions", count: 45, skillTree: "charisma.leadership", level: 8 },
    effects: "Gang members gain experience 100% faster, loyalty never decreases"
  },
  
  // Intelligence-based perks
  mastermind: {
    name: "Mastermind",
    icon: "🧪",
    description: "Always three steps ahead",
    requirements: { playstyle: "hackingAttempts", count: 20, skills: { intelligence: 20 } },
    effects: "25% chance for jobs to succeed automatically without risk"
  },
  digitalGod: {
    name: "Digital God",
    icon: "🔱",
    description: "The internet bends to your will",
    requirements: { playstyle: "hackingAttempts", count: 40, skillTree: "intelligence.hacking", level: 9 },
    effects: "Can hack any system for massive payouts, but creates digital traces"
  },
  
  // Luck-based perks
  fortuneSon: {
    name: "Fortune's Son",
    icon: "🌟",
    description: "Lady Luck is your mistress",
    requirements: { playstyle: "gamblingWins", count: 15, skills: { luck: 12 } },
    effects: "Random events are always positive, critical failures become critical successes"
  },
  
  // Mentorship perks
  masterTeacher: {
    name: "Master Teacher",
    icon: "🎓",
    description: "Knowledge shared is power multiplied",
    requirements: { playstyle: "mentoringSessions", count: 10, mentors: 3 },
    effects: "Can teach skills to gang members, all skill gains increased by 25%"
  },
  
  // Universal perks
  legendaryStatus: {
    name: "Legendary Status",
    icon: "⭐",
    description: "Your name is whispered in fear and respect",
    requirements: { reputation: 1000, level: 25, territories: 5 },
    effects: "All faction reputations change 50% faster, special legendary jobs unlock"
  }
};

// Achievements system
export const achievements = [
  // === Early Game ===
  { id: "first_job", name: "First Day on the Job", description: "Complete your first job", unlocked: false, reward: { money: 500, xp: 25 } },
  { id: "first_blood", name: "First Blood", description: "Win your first fight or heist", unlocked: false, reward: { money: 1000, xp: 50 } },
  { id: "wheels", name: "Hot Wheels", description: "Steal your first car", unlocked: false, reward: { money: 2000, xp: 50 } },
  { id: "armed_dangerous", name: "Armed & Dangerous", description: "Buy your first weapon", unlocked: false, reward: { money: 1000, xp: 30 } },
  { id: "property_owner", name: "Property Mogul", description: "Buy your first property", unlocked: false, reward: { money: 5000, xp: 100 } },
  // === Money Milestones ===
  { id: "millionaire", name: "Big Shot", description: "Have $100,000", unlocked: false, reward: { money: 10000, xp: 100 } },
  { id: "half_mil", name: "High Roller", description: "Have $500,000", unlocked: false, reward: { money: 25000, xp: 200 } },
  { id: "true_millionaire", name: "Millionaire", description: "Have $1,000,000", unlocked: false, reward: { money: 50000, xp: 500 } },
  { id: "multi_millionaire", name: "Multi-Millionaire", description: "Have $10,000,000", unlocked: false, reward: { money: 500000, xp: 1000 } },
  { id: "billionaire", name: "Criminal Tycoon", description: "Have $100,000,000", unlocked: false, reward: { money: 5000000, xp: 5000 } },
  // === Gang & Social ===
  { id: "first_recruit", name: "Right Hand Man", description: "Recruit your first gang member", unlocked: false, reward: { money: 2000, xp: 75 } },
  { id: "gang_leader", name: "Gang Leader", description: "Have 10 gang members", unlocked: false, reward: { money: 15000, xp: 200 } },
  { id: "crime_family", name: "Crime Family", description: "Have 25 gang members", unlocked: false, reward: { money: 50000, xp: 500 } },
  { id: "army", name: "Criminal Army", description: "Have 50 gang members", unlocked: false, reward: { money: 200000, xp: 1000 } },
  { id: "faction_friend", name: "Friend of the Family", description: "Reach 25 reputation with any faction", unlocked: false, reward: { money: 10000, xp: 150 } },
  { id: "faction_ally", name: "Made Man", description: "Reach 50 reputation with any faction", unlocked: false, reward: { money: 50000, xp: 300 } },
  // === Combat & Crime ===
  { id: "jail_break", name: "Great Escape", description: "Successfully break out of jail", unlocked: false, reward: { money: 5000, xp: 100 } },
  { id: "most_wanted", name: "Most Wanted", description: "Reach wanted level 50", unlocked: false, reward: { money: 25000, xp: 300 } },
  { id: "ghost", name: "Ghost", description: "Complete 10 jobs without getting arrested", unlocked: false, reward: { money: 20000, xp: 250 } },
  { id: "boss_slayer", name: "Boss Slayer", description: "Defeat your first rival boss", unlocked: false, reward: { money: 100000, xp: 500 } },
  // === Progression ===
  { id: "reputation_max", name: "Legendary Criminal", description: "Reach 100 reputation", unlocked: false, reward: { money: 100000, xp: 500 } },
  { id: "level_10", name: "Rising Star", description: "Reach level 10", unlocked: false, reward: { money: 15000, xp: 200 } },
  { id: "level_25", name: "Veteran", description: "Reach level 25", unlocked: false, reward: { money: 100000, xp: 500 } },
  { id: "level_50", name: "Kingpin", description: "Reach level 50", unlocked: false, reward: { money: 500000, xp: 2000 } },
  { id: "skill_master", name: "Skill Master", description: "Max out any base skill (20+)", unlocked: false, reward: { money: 25000, xp: 300 } },
  // === Empire ===
  { id: "territory_3", name: "Neighborhood Boss", description: "Control 3 territories", unlocked: false, reward: { money: 30000, xp: 200 } },
  { id: "territory_10", name: "District King", description: "Control 10 territories", unlocked: false, reward: { money: 200000, xp: 500 } },
  { id: "business_owner", name: "Legitimate Businessman", description: "Own your first business front", unlocked: false, reward: { money: 50000, xp: 200 } },
  { id: "jobs_50", name: "Workhorse", description: "Complete 50 jobs", unlocked: false, reward: { money: 25000, xp: 300 } },
  { id: "jobs_200", name: "Professional", description: "Complete 200 jobs", unlocked: false, reward: { money: 100000, xp: 500 } },
  // === Mini-games ===
  { id: "lucky_streak", name: "Lucky Streak", description: "Win at the casino 3 times", unlocked: false, reward: { money: 10000, xp: 100 } },
  { id: "gambler", name: "High Stakes Gambler", description: "Win at the casino 10 times", unlocked: false, reward: { money: 50000, xp: 250 } },
  { id: "snake_king", name: "Snake King", description: "Score 20+ in Snake mini-game", unlocked: false, reward: { money: 15000, xp: 150 } },
  { id: "quick_draw", name: "Fastest Gun", description: "React under 200ms in Quick Draw", unlocked: false, reward: { money: 20000, xp: 200 } }
];
