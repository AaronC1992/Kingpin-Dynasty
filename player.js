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
    // More gradual XP curve: quadratic scaling
    let requiredXP = Math.floor(player.level * 150 + Math.pow(player.level, 2) * 10);
    if (player.experience >= requiredXP) {
        player.level++;
        player.experience -= requiredXP;
        player.skillPoints += 2; // Gain 2 skill points per level (slower progression)
        
        // Show dramatic level up screen effects
        if (typeof showLevelUpEffects === 'function') {
            showLevelUpEffects();
        }
        
        if (typeof logAction === 'function') {
            logAction(`🎉 The streets recognize your growing power! You've clawed your way up to level ${player.level}. Every scar tells a story, every skill hard-earned.`);
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
            const extraPerTick = Math.floor(recoveryLevel / 5); // +1 energy per 5 recovery levels
            const energyGain = Math.max(1, 1 + extraPerTick);
            player.energy = Math.min(player.energy + energyGain, player.maxEnergy);
            player.energyRegenTimer = 30; // Reset timer to 30 seconds
            
            if (typeof logAction === 'function') {
                logAction(`💤 You catch your breath in the shadows. The adrenaline fades and your strength slowly returns. (+${energyGain} energy)`);
            }
            
            // Forensics skill: Advanced wanted level decay
            if (player.wantedLevel > 0 && player.skillTrees.intelligence.forensics > 0) {
                let forensicsDecayChance = player.skillTrees.intelligence.forensics * 3; // 3% chance per level
                if (Math.random() * 100 < forensicsDecayChance) {
                    player.wantedLevel = Math.max(0, player.wantedLevel - 1);
                    if (typeof logAction === 'function') {
                        logAction("🔬 Your forensics expertise helps eliminate evidence over time. Heat level decreased by 1!");
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
        player.energyRegenTimer = 30; // Start 30-second countdown
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
