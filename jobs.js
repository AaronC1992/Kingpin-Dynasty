/**
 * jobs.js
 * 
 * Manages job definitions and car theft mechanics for the mafia game.
 * Contains the jobs array with payout ranges, risk levels, energy costs, jail chances,
 * and required items. Also includes stolen car types and their properties.
 */

// Job options with risk categories, jail chances, wanted level gains, health loss, required items, and reputation requirements
export const jobs = [
    // Entry Level Job
    { name: "Street Soldier", payout: [1000, 5000], risk: "low", jailChance: 5, wantedLevelGain: 1, healthLoss: 0, requiredItems: [], reputation: 0, energyCost: 1 },
    
    // Car Stealing Job (Special mechanic)
    { name: "Boost a Ride", payout: [0, 0], risk: "medium", jailChance: 40, wantedLevelGain: 3, healthLoss: 5, requiredItems: [], reputation: 0, special: "car_theft", energyCost: 5 },
    
    // Higher Risk Job
    { name: "Store Heist", payout: [20000, 40000], risk: "high", jailChance: 30, wantedLevelGain: 4, healthLoss: 10, requiredItems: [], reputation: 10, energyCost: 10 },
    
    // NEW LATE-GAME JOBS
    
    // Drug dealing jobs
    { name: "Bootleg Run", payout: [40000, 80000], risk: "high", jailChance: 25, wantedLevelGain: 3, healthLoss: 5, requiredItems: ["Crate Moonshine"], reputation: 15, energyCost: 12 },
    { name: "Speakeasy Supply", payout: [80000, 160000], risk: "very high", jailChance: 35, wantedLevelGain: 5, healthLoss: 8, requiredItems: ["Bag of Mary Jane"], reputation: 25, energyCost: 15 },
    { name: "White Powder Distribution", payout: [160000, 300000], risk: "extreme", jailChance: 45, wantedLevelGain: 8, healthLoss: 15, requiredItems: ["Pure Cocaine"], reputation: 40, energyCost: 20 },
    
    // Weapon-based jobs
    { name: "Protection Collection", payout: [10000, 25000], risk: "medium", jailChance: 20, wantedLevelGain: 3, healthLoss: 8, requiredItems: ["Brass Knuckles"], reputation: 12, energyCost: 8 },
    { name: "Bank Job", payout: [100000, 250000], risk: "extreme", jailChance: 50, wantedLevelGain: 10, healthLoss: 20, requiredItems: ["Tommy Gun", "Bullets"], reputation: 35, energyCost: 25 },
    { name: "Hit on a Rival", payout: [60000, 120000], risk: "very high", jailChance: 40, wantedLevelGain: 6, healthLoss: 25, requiredItems: ["Pistol", "Bullets"], reputation: 30, energyCost: 18 },
    
    // High-tech/Vehicle jobs
    { name: "Luxury Car Ring", payout: [80000, 160000], risk: "high", jailChance: 30, wantedLevelGain: 4, healthLoss: 5, requiredItems: ["Luxury Automobile"], reputation: 20, energyCost: 15 },
    { name: "Cross-Border Smuggling", payout: [200000, 400000], risk: "extreme", jailChance: 35, wantedLevelGain: 7, healthLoss: 10, requiredItems: ["Private Airplane", "Gasoline"], reputation: 50, energyCost: 30 },
    
    // Gang-based jobs
    { name: "Turf War", payout: [40000, 100000], risk: "very high", jailChance: 45, wantedLevelGain: 5, healthLoss: 30, requiredItems: ["Gang Recruit"], reputation: 25, energyCost: 20 },
    { name: "Underground Boxing", payout: [30000, 70000], risk: "high", jailChance: 25, wantedLevelGain: 2, healthLoss: 40, requiredItems: ["Brass Knuckles"], reputation: 18, energyCost: 12 },
    
    // Property-based jobs
    { name: "Illegal Gambling Den", payout: [120000, 240000], risk: "very high", jailChance: 30, wantedLevelGain: 4, healthLoss: 5, requiredItems: ["Criminal Safehouse"], reputation: 35, energyCost: 22 },
    { name: "Money Laundering", payout: [1600, 3000], risk: "high", jailChance: 20, wantedLevelGain: 3, healthLoss: 0, requiredItems: ["Basement Hideout", "Luxury Automobile"], reputation: 45, energyCost: 25 },
    
    // Elite endgame jobs
    { name: "International Arms Trade", payout: [500000, 1000000], risk: "legendary", jailChance: 60, wantedLevelGain: 12, healthLoss: 10, requiredItems: ["Private Airplane", "Tommy Gun", "Bulletproof Vest"], reputation: 60, energyCost: 35 },
    { name: "Take Over the City", payout: [2000000, 5000000], risk: "legendary", jailChance: 70, wantedLevelGain: 15, healthLoss: 20, requiredItems: ["Gang Recruit", "Underground Bunker", "Tommy Gun", "Luxury Automobile"], reputation: 80, energyCost: 40 }
];

// Stolen car types with base values and damage probabilities
export const stolenCarTypes = [
    { name: "Rusty Jalopy", baseValue: 5000, damageChance: 60, rarity: 40, image: "vehicles/Rusty Jalopy.png" },
    { name: "Old Sedan", baseValue: 15000, damageChance: 45, rarity: 30, image: "vehicles/Old Sedan.png" },
    { name: "Old Ford", baseValue: 25000, damageChance: 40, rarity: 25, image: "vehicles/Old Ford.png" },
    { name: "Family Wagon", baseValue: 30000, damageChance: 35, rarity: 20, image: "vehicles/Family Wagon.png" },
    { name: "Sports Coupe", baseValue: 60000, damageChance: 25, rarity: 7, image: "vehicles/Sports Coupe.png" },
    { name: "Luxury Sedan", baseValue: 100000, damageChance: 20, rarity: 5, image: "vehicles/Luxury Sedan.png" },
    { name: "Vintage Roadster", baseValue: 150000, damageChance: 15, rarity: 3, image: "vehicles/Vintage Roadster.png" }
];
