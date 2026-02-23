/**
 * generators.js
 * 
 * Manages procedural generation of game content including:
 * - Random prisoners for jail and jailbreak missions
 * - Recruits for the gang
 * - Random encounters
 */

import { player } from './player.js';

// Random prisoner names for jail system
export const prisonerNames = [
    "Tony \"The Snake\" Marconi", "Vincent \"Vinny\" Romano", "Marco \"The Bull\" Santangelo",
    "Sal \"Scarface\" DeLuca", "Frank \"The Hammer\" Rossini", "Joey \"Two-Times\" Castellano",
    "Nick \"The Knife\" Moretti", "Rocco \"Rocky\" Benedetto", "Anthony \"Big Tony\" Genovese",
    "Michael \"Mikey\" Calabrese", "Dominic \"Dom\" Torrino", "Carlo \"The Cat\" Bianchi",
    "Gino \"The Ghost\" Falcone", "Paulie \"The Wall\" Ricci", "Luca \"Lucky\" Fontana"
];

// Random recruit names for gang recruitment
export const recruitNames = [
    "Eddie \"Fast Hands\" Murphy", "Danny \"The Crow\" Sullivan", "Rico \"Smiles\" Martinez",
    "Jimmy \"Knuckles\" O'Brien", "Carlos \"Snake Eyes\" Rivera", "Tommy \"The Kid\" Chen",
    "Vinny \"Wheels\" Rossi", "Mickey \"Slim\" Johnson", "Angelo \"The Tank\" Moreno",
    "Frankie \"Sharp\" Williams", "Bobby \"Ice\" Kowalski", "Sammy \"Brass\" Thompson",
    "Lou \"The Fixer\" Garcia", "Pete \"Whispers\" Anderson", "Jake \"Lightning\" Davis",
    "Nicky \"Smoke\" Rodriguez", "Tony \"Razors\" Bennett", "Max \"The Bull\" Jackson",
    "Sal \"Quick Draw\" Fernandez", "Leo \"Ghost\" Walker", "Ricky \"Viper\" Cruz",
    "Joey \"Phantom\" Stone", "Manny \"Torch\" Lopez", "Gio \"Shadow\" Milano"
];

// State variables
export let jailPrisoners = [];
export let jailbreakPrisoners = [];
export let availableRecruits = [];
export let randomEncounterRecruit = null;

// Setter — ES module imports are read-only, so other modules must use this
export function clearRandomEncounterRecruit() { randomEncounterRecruit = null; }

// Generate random prisoners in jail
export function generateJailPrisoners() {
    jailPrisoners = [];
    const numPrisoners = Math.floor(Math.random() * 5) + 3; // 3-7 prisoners
    
    for (let i = 0; i < numPrisoners; i++) {
        const name = prisonerNames[Math.floor(Math.random() * prisonerNames.length)];
        const sentence = Math.floor(Math.random() * 30) + 5; // 5-34 seconds
        const difficulty = Math.floor(Math.random() * 3) + 1; // 1-3 difficulty
        
        jailPrisoners.push({
            name: name,
            sentence: sentence,
            difficulty: difficulty,
            breakoutSuccess: 30 + (difficulty * 10) // 40%, 50%, 60% based on difficulty
        });
    }
    
    // Add player to jail list if they're in jail
    if (player.inJail) {
        jailPrisoners.unshift({
            name: player.name || "You",
            sentence: player.jailTime,
            difficulty: 0,
            isPlayer: true
        });
    }
    return jailPrisoners;
}

// Generate random prisoners for jailbreak missions
export function generateJailbreakPrisoners() {
    jailbreakPrisoners = [];
    const numPrisoners = Math.floor(Math.random() * 4) + 2; // 2-5 prisoners
    
    for (let i = 0; i < numPrisoners; i++) {
        const name = prisonerNames[Math.floor(Math.random() * prisonerNames.length)];
        const sentence = Math.floor(Math.random() * 50) + 10; // 10-59 seconds
        const difficulty = Math.floor(Math.random() * 4) + 1; // 1-4 difficulty levels
        const securityLevel = ["Minimum", "Medium", "Maximum", "Supermax"][difficulty - 1];
        
        jailbreakPrisoners.push({
            name: name,
            sentence: sentence,
            difficulty: difficulty,
            securityLevel: securityLevel,
            breakoutSuccess: Math.max(15, 50 - (difficulty * 10)), // 40%, 30%, 20%, 15% based on difficulty
            energyCost: 10 + (difficulty * 5), // 15, 20, 25, 30 energy
            expReward: difficulty * 20 + 15, // 35, 55, 75, 95 XP
            cashReward: difficulty * 100 + 50, // $150, $250, $350, $450
            arrestChance: 20 + (difficulty * 10) // 30%, 40%, 50%, 60% arrest chance on failure
        });
    }
    return jailbreakPrisoners;
}

// Generate available recruits for recruitment screen
export function generateAvailableRecruits() {
    availableRecruits = [];
    const numRecruits = Math.floor(Math.random() * 4) + 2; // 2-5 recruits
    
    for (let i = 0; i < numRecruits; i++) {
        const name = recruitNames[Math.floor(Math.random() * recruitNames.length)];
        
        // Experience level determines tribute generation and cost
        // 85% chance for levels 1-3, 12% for levels 4-6, 3% for levels 7-10 (made higher exp more common)
        let experienceLevel;
        const rarityRoll = Math.random() * 100;
        
        if (rarityRoll < 85) {
            experienceLevel = Math.floor(Math.random() * 3) + 1; // 1-3 (common)
        } else if (rarityRoll < 97) {
            experienceLevel = Math.floor(Math.random() * 3) + 4; // 4-6 (rare)
        } else {
            experienceLevel = Math.floor(Math.random() * 4) + 7; // 7-10 (legendary)
        }
        
        // Calculate cost and tribute based on experience level
        const baseCost = 1000;
        const cost = baseCost + (experienceLevel * 500) + Math.floor(Math.random() * 500); // Random variance
        const tributeMultiplier = 1 + (experienceLevel * 0.3); // Higher level = more tribute
        
        // Determine specialization using the new specialist roles
        const specializations = ["muscle", "thief", "dealer", "driver", "enforcer", "technician"];
        const specialization = specializations[Math.floor(Math.random() * specializations.length)];
        
        const recruit = {
            name: name,
            experienceLevel: experienceLevel,
            cost: cost,
            tributeMultiplier: tributeMultiplier,
            specialization: specialization,
            loyalty: Math.floor(Math.random() * 30) + 70, // 70-100% initial loyalty
            skills: {
                violence: Math.floor(Math.random() * 3) + 1,
                stealth: Math.floor(Math.random() * 3) + 1,
                intelligence: Math.floor(Math.random() * 3) + 1
            },
            onOperation: false,
            inTraining: false,
            arrested: false
        };
        
        availableRecruits.push(recruit);
    }
    
    return availableRecruits;
}

// Generate random encounter recruit — veterans only, chance scales with player level
export function generateRandomEncounter() {
    // Base 1% chance, +0.5% per player level (caps at ~15% around level 28)
    const playerLevel = (typeof player !== 'undefined' && player.level) ? player.level : 1;
    const encounterChance = Math.min(0.15, 0.01 + playerLevel * 0.005);
    
    if (Math.random() < encounterChance) {
        const name = recruitNames[Math.floor(Math.random() * recruitNames.length)];
        
        // Only veteran recruits — experience level 7-10
        // Higher player level slightly biases toward the top end
        const levelBonus = Math.min(2, Math.floor(playerLevel / 10)); // 0-2 bonus from player level
        let experienceLevel = Math.floor(Math.random() * 4) + 7; // 7-10 base
        experienceLevel = Math.min(10, experienceLevel + Math.floor(Math.random() * (levelBonus + 1)));
        
        const baseCost = 3000; // Veterans cost more
        const cost = baseCost + (experienceLevel * 800) + Math.floor(Math.random() * 1000);
        const tributeMultiplier = 1 + (experienceLevel * 0.3);
        
        const specializations = ["muscle", "thief", "dealer", "driver", "enforcer", "technician"];
        const specialization = specializations[Math.floor(Math.random() * specializations.length)];
        
        randomEncounterRecruit = {
            name: name,
            experienceLevel: experienceLevel,
            cost: cost,
            tributeMultiplier: tributeMultiplier,
            specialization: specialization,
            loyalty: Math.floor(Math.random() * 15) + 85, // 85-100% loyalty for veteran encounters
            encountered: true,
            skills: {
                violence: Math.floor(Math.random() * 3) + 3,
                stealth: Math.floor(Math.random() * 3) + 3,
                intelligence: Math.floor(Math.random() * 3) + 3
            },
            onOperation: false,
            inTraining: false,
            arrested: false
        };
        
        return true;
    }
    return false;
}


