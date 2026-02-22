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
    { name: "Street Soldier", payout: [120, 600], risk: "low", jailChance: 20, wantedLevelGain: 1, healthLoss: 0, requiredItems: [], reputation: 0, energyCost: 1 },
    
    // Car Stealing Job (Special mechanic)
    { name: "Boost a Ride", payout: [0, 0], risk: "medium", jailChance: 40, wantedLevelGain: 3, healthLoss: 5, requiredItems: [], reputation: 0, special: "car_theft", energyCost: 5 },
    
    // Higher Risk Job
    { name: "Store Heist", payout: [2500, 6000], risk: "high", jailChance: 30, wantedLevelGain: 4, healthLoss: 10, requiredItems: [], reputation: 10, energyCost: 10 },
    
    // NEW LATE-GAME JOBS
    
    // Drug dealing jobs
    { name: "Bootleg Run", payout: [5000, 12000], risk: "high", jailChance: 25, wantedLevelGain: 3, healthLoss: 5, requiredItems: ["Crate Moonshine"], reputation: 15, energyCost: 12 },
    { name: "Speakeasy Supply", payout: [10000, 22000], risk: "very high", jailChance: 35, wantedLevelGain: 5, healthLoss: 8, requiredItems: ["Bag of Mary Jane"], reputation: 25, energyCost: 15 },
    { name: "White Powder Distribution", payout: [20000, 45000], risk: "extreme", jailChance: 45, wantedLevelGain: 8, healthLoss: 15, requiredItems: ["Pure Cocaine"], reputation: 40, energyCost: 20 },
    
    // Weapon-based jobs
    { name: "Protection Collection", payout: [1200, 3200], risk: "medium", jailChance: 20, wantedLevelGain: 3, healthLoss: 8, requiredItems: ["Brass Knuckles"], reputation: 12, energyCost: 8 },
    { name: "Bank Job", payout: [14000, 35000], risk: "extreme", jailChance: 50, wantedLevelGain: 10, healthLoss: 20, requiredItems: ["Tommy Gun", "Bullets"], reputation: 35, energyCost: 25, paysDirty: true },
    { name: "Hit on a Rival", payout: [8000, 18000], risk: "very high", jailChance: 40, wantedLevelGain: 6, healthLoss: 25, requiredItems: ["Pistol", "Bullets"], reputation: 30, energyCost: 18 },
    
    // High-tech/Vehicle jobs
    { name: "Luxury Car Ring", payout: [10000, 22000], risk: "high", jailChance: 30, wantedLevelGain: 4, healthLoss: 5, requiredItems: ["Luxury Automobile"], reputation: 20, energyCost: 15 },
    { name: "Cross-Border Smuggling", payout: [25000, 55000], risk: "extreme", jailChance: 35, wantedLevelGain: 7, healthLoss: 10, requiredItems: ["Private Airplane", "Gasoline"], reputation: 50, energyCost: 30 },
    
    // Gang-based jobs
    { name: "Turf War", payout: [5000, 14000], risk: "very high", jailChance: 45, wantedLevelGain: 5, healthLoss: 30, requiredItems: ["Gang Recruit"], reputation: 25, energyCost: 20 },
    { name: "Underground Boxing", payout: [4000, 10000], risk: "high", jailChance: 25, wantedLevelGain: 2, healthLoss: 40, requiredItems: ["Brass Knuckles"], reputation: 18, energyCost: 12 },
    
    // Property-based jobs
    { name: "Illegal Gambling Den", payout: [16000, 35000], risk: "very high", jailChance: 30, wantedLevelGain: 4, healthLoss: 5, requiredItems: ["Criminal Safehouse"], reputation: 35, energyCost: 22 },
    { name: "Money Laundering", payout: [20000, 48000], risk: "high", jailChance: 20, wantedLevelGain: 3, healthLoss: 0, requiredItems: ["Basement Hideout", "Luxury Automobile"], reputation: 45, energyCost: 25, special: "launder_money" },
    
    // Counterfeiting job (pays dirty money only)
    { name: "Counterfeiting Money", payout: [25000, 70000], risk: "extreme", jailChance: 45, wantedLevelGain: 8, healthLoss: 0, requiredItems: ["Basement Hideout", "Fake ID Kit"], reputation: 40, energyCost: 20, paysDirty: true },
    
    // Elite endgame jobs
    { name: "International Arms Trade", payout: [70000, 140000], risk: "legendary", jailChance: 60, wantedLevelGain: 12, healthLoss: 10, requiredItems: ["Private Airplane", "Tommy Gun", "Bulletproof Vest"], reputation: 60, energyCost: 35 },
    { name: "Take Over the City", payout: [280000, 700000], risk: "legendary", jailChance: 70, wantedLevelGain: 15, healthLoss: 20, requiredItems: ["Gang Recruit", "Underground Bunker", "Tommy Gun", "Luxury Automobile"], reputation: 80, energyCost: 40 }
];

// Stolen car types with base values and damage probabilities
export const stolenCarTypes = [
    // Broken vehicles (most common, lowest value)
    { name: "Broken Family Wagon", baseValue: 800, damageChance: 80, rarity: 50, image: "vehicles/Broken Family Wagon.png" },
    { name: "Broken Delivery Van", baseValue: 1200, damageChance: 75, rarity: 48, image: "vehicles/Broken Delivery Van.png" },
    { name: "Broken Street Racer Coupe", baseValue: 2000, damageChance: 70, rarity: 45, image: "vehicles/Broken Street Racer Coupe.png" },
    { name: "Broken Luxury Town Car", baseValue: 3500, damageChance: 65, rarity: 42, image: "vehicles/Broken Luxury Town Car.png" },
    { name: "Broken High-End Roadster", baseValue: 4000, damageChance: 68, rarity: 40, image: "vehicles/broken version of the High-End Roadster.png" },
    { name: "Broken Armored Truck", baseValue: 5000, damageChance: 70, rarity: 38, image: "vehicles/broken version of the armored truck.png" },
    
    // Rusty vehicles (less common, moderate value)
    { name: "Rusty Jalopy", baseValue: 5000, damageChance: 60, rarity: 35, image: "vehicles/Rusty Jalopy.png" },
    { name: "Rusty Delivery Van", baseValue: 8000, damageChance: 55, rarity: 32, image: "vehicles/rusty version of the Delivery Van.png" },
    { name: "Rusted Family Wagon", baseValue: 12000, damageChance: 50, rarity: 30, image: "vehicles/Rusted Family Wagon.png" },
    { name: "Rusty Street Racer Coupe", baseValue: 18000, damageChance: 48, rarity: 28, image: "vehicles/Rusty Street Racer Coupe.png" },
    { name: "Rusty Luxury Town Car", baseValue: 25000, damageChance: 45, rarity: 25, image: "vehicles/Rusty Luxury Town Car.png" },
    { name: "Rusty High-End Roadster", baseValue: 30000, damageChance: 42, rarity: 22, image: "vehicles/rusted High-End Roadster.png" },
    { name: "Rusty Armored Truck", baseValue: 35000, damageChance: 40, rarity: 20, image: "vehicles/Rusty Armored Truck.png" },
    
    // Normal vehicles (less common, good value)
    { name: "Old Sedan", baseValue: 15000, damageChance: 45, rarity: 18, image: "vehicles/Old Sedan.png" },
    { name: "Old Ford", baseValue: 25000, damageChance: 40, rarity: 16, image: "vehicles/Old Ford.png" },
    { name: "Taxi", baseValue: 28000, damageChance: 38, rarity: 15, image: "vehicles/Taxi.png" },
    { name: "Delivery Van", baseValue: 32000, damageChance: 35, rarity: 14, image: "vehicles/Delivery Van.png" },
    { name: "Family Wagon", baseValue: 30000, damageChance: 35, rarity: 13, image: "vehicles/Family Wagon.png" },
    { name: "Hearse", baseValue: 35000, damageChance: 33, rarity: 12, image: "vehicles/Hearse.png" },
    { name: "Motorcycle", baseValue: 45000, damageChance: 50, rarity: 11, image: "vehicles/Motorcycle.png" },
    { name: "Pickup Truck", baseValue: 50000, damageChance: 30, rarity: 10, image: "vehicles/Pickup Truck.png" },
    { name: "Sports Coupe", baseValue: 60000, damageChance: 25, rarity: 9, image: "vehicles/Sports Coupe.png" },
    { name: "Street Racer Coupe", baseValue: 70000, damageChance: 28, rarity: 8, image: "vehicles/Street Racer Coupe.png" },
    
    // Rare vehicles
    { name: "Delivery Truck", baseValue: 75000, damageChance: 28, rarity: 7, image: "vehicles/Delivery Truck.png" },
    { name: "Freight Truck", baseValue: 85000, damageChance: 32, rarity: 6, image: "vehicles/Freight Truck.png" },
    { name: "Luxury Sedan", baseValue: 100000, damageChance: 20, rarity: 5, image: "vehicles/luxury sedan.png" },
    { name: "Luxury Town Car", baseValue: 120000, damageChance: 18, rarity: 4, image: "vehicles/Luxury Town Car.png" },
    
    // Very rare vehicles
    { name: "Speedboat", baseValue: 140000, damageChance: 22, rarity: 3, image: "vehicles/Speedboat.png" },
    { name: "High-End Roadster", baseValue: 150000, damageChance: 15, rarity: 3, image: "vehicles/High-End Roadster.png" },
    { name: "Limousine", baseValue: 180000, damageChance: 16, rarity: 2, image: "vehicles/Limousine.png" },
    { name: "Party Bus", baseValue: 200000, damageChance: 25, rarity: 2, image: "vehicles/Party Bus.png" },
    
    // Super rare vehicles
    { name: "Police Cruiser", baseValue: 250000, damageChance: 10, rarity: 0.5, image: "vehicles/Police Cruiser.png" }
];
