/**
 * factions.js
 * 
 * Manages crime family factions, their reputations, and legacy/retirement systems.
 * Contains the crimeFamilies object with each family's details, retirement outcome data,
 * and the Criminal Hall of Fame legacy system.
 */

// Crime Families and Factions
export const crimeFamilies = {
    torrino: {
        name: "Torrino Family",
        description: "Old-school Italian mafia family with traditional values and brutal enforcement",
        reputation: 0, // Player's standing with this family (-100 to 100)
        color: "#8b0000",
        boss: "Don Salvatore Torrino",
        specialty: "Protection rackets and loan sharking",
        lore: "Founded in the 1920s by Italian immigrants, the Torrino family built their empire on respect, loyalty, and swift retribution. They control the restaurant district and numerous legitimate businesses as fronts.",
        passive: {
            name: "The Books",
            description: "Earn 5% interest on unspent cash daily.",
            effectId: "interest_cash",
            value: 0.05
        },
        signatureJob: {
            id: "torrino_shakedown",
            name: "Union Shake-down",
            type: "charisma",
            description: "Force the local union boss to pay up protection money.",
            baseReward: 5000,
            xpReward: 150,
            cooldown: 24 // hours
        }
    },
    kozlov: {
        name: "Kozlov Bratva",
        description: "Russian crime syndicate specializing in arms dealing and smuggling operations",
        reputation: 0,
        color: "#ff6b35",
        boss: "Dimitri Kozlov",
        specialty: "Weapons trafficking and smuggling",
        lore: "Ex-military Russian operatives who brought military discipline to organized crime. They dominate the weapons trade and have connections across Eastern Europe for large-scale smuggling operations.",
        passive: {
            name: "Arms Deal",
            description: "Weapons cost 10% less. Small chance to regen ammo daily.",
            effectId: "cheap_weapons_ammo_regen",
            discount: 0.10,
            regenChance: 0.25
        },
        signatureJob: {
            id: "kozlov_convoy",
            name: "Military Convoy Heist",
            type: "violence",
            description: "Ambush a military transport for high-grade weapons.",
            baseReward: 3000, // Plus weapons
            xpReward: 200,
            cooldown: 24
        }
    },
    chen: {
        name: "Chen Triad",
        description: "Sophisticated Asian crime organization focusing on high-tech crimes and drug operations",
        reputation: 0,
        color: "#2e8b57",
        boss: "Master Chen Wei",
        specialty: "Technology crimes and drug manufacturing",
        lore: "Ancient traditions meet modern technology. The Chen Triad combines centuries-old honor codes with cutting-edge cybercrime and precision drug manufacturing. They value intelligence over brute force.",
        passive: {
            name: "Smuggling Routes",
            description: "Drug sales and transport jobs earn 15% more.",
            effectId: "bonus_drug_income",
            multiplier: 1.15
        },
        signatureJob: {
            id: "chen_cyber_raid",
            name: "Cyber-Bank Raid",
            type: "intelligence",
            description: "Hack into a major bank's server farm for a massive transfer.",
            baseReward: 8000,
            xpReward: 180,
            cooldown: 24
        }
    },
    morales: {
        name: "Morales Cartel",
        description: "Powerful South American drug cartel with extensive territory control and distribution networks",
        reputation: 0,
        color: "#ff8c00",
        boss: "El Jefe Morales",
        specialty: "Drug manufacturing and distribution",
        lore: "Born from the coca fields of South America, the Morales Cartel expanded northward with ruthless efficiency. They control vast territories and have corrupted officials at every level of government.",
        passive: {
            name: "Cartel Connections",
            description: "Violent crimes generate 20% less heat.",
            effectId: "reduced_heat_violence",
            reduction: 0.20
        },
        signatureJob: {
            id: "morales_border_run",
            name: "Border Crossing Run",
            type: "stealth",
            description: "Smuggle a major shipment across the border undetected.",
            baseReward: 6000,
            xpReward: 160,
            cooldown: 24
        }
    }
};

// Criminal Hall of Fame - Legacy System
export let criminalHallOfFame = JSON.parse(localStorage.getItem('criminalHallOfFame')) || [];

// Retirement outcomes and legacy bonuses
export const retirementOutcomes = {
    legitimate: {
        name: "Going Legitimate",
        description: "Clean up your act and start fresh",
        requirements: {
            cleanMoney: 1000000,
            businessEmpire: 10,
            lowHeat: true
        },
        legacyBonus: {
            startingMoney: 10000,
            businessDiscount: 0.2,
            familyReputation: 50
        }
    },
    exile: {
        name: "Exile to Paradise",
        description: "Flee to a tropical island with your wealth",
        requirements: {
            money: 5000000,
            privateAirplane: true,
            lowWantedLevel: true
        },
        legacyBonus: {
            startingMoney: 50000,
            skillBonus: 1,
            luxuryStart: true
        }
    },
    familyBusiness: {
        name: "Family Business Empire",
        description: "Pass the empire to the next generation",
        requirements: {
            gangMembers: 20,
            territories: 15,
            businesses: 15
        },
        legacyBonus: {
            inheritedGang: 5,
            inheritedTerritory: 3,
            inheritedBusiness: 2,
            familyReputation: 100
        }
    },
    undergroundKing: {
        name: "Underground Kingpin",
        description: "Rule the criminal underworld forever",
        requirements: {
            empireRating: 10000,
            allFactions: true,
            criminalMastermind: true
        },
        legacyBonus: {
            legendaryStart: true,
            allSkillsBonus: 2,
            startingEmpire: true,
            familyReputation: 200
        }
    }
};

// Faction Reputation Effects
export const factionEffects = {
    torrino: {
        name: "Torrino Family",
        icon: "🤵",
        positiveEffects: [
            { level: 25, effect: "15% better prices at Italian businesses" },
            { level: 50, effect: "Access to Torrino weapon dealers" },
            { level: 75, effect: "Protection from rival family attacks" },
            { level: 100, effect: "Made member status - major power boost" }
        ],
        negativeEffects: [
            { level: -25, effect: "15% higher prices at Italian businesses" },
            { level: -50, effect: "Targeted by Torrino enforcers" },
            { level: -75, effect: "Active bounty on your head" },
            { level: -100, effect: "Marked for death by the family" }
        ]
    },
    kozlov: {
        name: "Kozlov Bratva",
        icon: "🐻",
        positiveEffects: [
            { level: 25, effect: "Access to Russian weapons and vehicles" },
            { level: 50, effect: "Bratva backup in gang wars" },
            { level: 75, effect: "Smuggling route access" },
            { level: 100, effect: "Vor status - criminal elite recognition" }
        ],
        negativeEffects: [
            { level: -25, effect: "Russian businesses refuse service" },
            { level: -50, effect: "Bratva enforcers hunt you" },
            { level: -75, effect: "Assets frozen by Russian contacts" },
            { level: -100, effect: "Siberian vacation - permanent" }
        ]
    },
    chen: {
        name: "Chen Triad",
        icon: "🐉",
        positiveEffects: [
            { level: 25, effect: "Access to Triad drug networks" },
            { level: 50, effect: "Ancient martial arts training" },
            { level: 75, effect: "Protection money from Chinatown" },
            { level: 100, effect: "Dragon Head status - ultimate honor" }
        ],
        negativeEffects: [
            { level: -25, effect: "Banned from Chinatown businesses" },
            { level: -50, effect: "Triad assassins pursue you" },
            { level: -75, effect: "Cursed by ancestral spirits" },
            { level: -100, effect: "Dishonor demands blood payment" }
        ]
    },
    morales: {
        name: "Morales Cartel",
        icon: "🌮",
        positiveEffects: [
            { level: 25, effect: "Cartel drug discounts and access" },
            { level: 50, effect: "Border smuggling routes" },
            { level: 75, effect: "Sicario training programs" },
            { level: 100, effect: "Patrón status - empire builder" }
        ],
        negativeEffects: [
            { level: -25, effect: "Cartel prices increase 20%" },
            { level: -50, effect: "Sicarios target your operations" },
            { level: -75, effect: "All cartel territory becomes hostile" },
            { level: -100, effect: "Blood feud - no quarter given" }
        ]
    },
    police: {
        name: "Police Corruption",
        icon: "👮",
        positiveEffects: [
            { level: 25, effect: "10% reduced arrest chance" },
            { level: 50, effect: "Inside information on raids" },
            { level: 75, effect: "Evidence tampering available" },
            { level: 100, effect: "Police protection and cover-ups" }
        ],
        negativeEffects: [
            { level: -25, effect: "Increased police attention" },
            { level: -50, effect: "No plea bargains available" },
            { level: -75, effect: "Maximum sentences always given" },
            { level: -100, effect: "Shoot on sight orders issued" }
        ]
    },
    civilians: {
        name: "Public Opinion",
        icon: "👥",
        positiveEffects: [
            { level: 25, effect: "Citizens provide tips and intel" },
            { level: 50, effect: "Public refuses to cooperate with police" },
            { level: 75, effect: "Neighborhood watch protects you" },
            { level: 100, effect: "Folk hero status - untouchable" }
        ],
        negativeEffects: [
            { level: -25, effect: "Citizens report suspicious activity" },
            { level: -50, effect: "Vigilante groups form against you" },
            { level: -75, effect: "Civilian militia actively hunts you" },
            { level: -100, effect: "Public enemy #1 - nowhere to hide" }
        ]
    },
    underground: {
        name: "Criminal Underworld",
        icon: "🕳️",
        positiveEffects: [
            { level: 25, effect: "Access to black market deals" },
            { level: 50, effect: "Criminal contacts provide jobs" },
            { level: 75, effect: "Underworld protection and alliances" },
            { level: 100, effect: "Kingpin status - rules the shadows" }
        ],
        negativeEffects: [
            { level: -25, effect: "Higher prices in black markets" },
            { level: -50, effect: "Criminal contacts avoid you" },
            { level: -75, effect: "Bounty hunters target you" },
            { level: -100, effect: "Marked by all criminal organizations" }
        ]
    }
};

// Mentor definitions for captured rivals
export const potentialMentors = [
    {
        name: "Viktor 'The Blade' Petrov",
        faction: "kozlov",
        specialties: ["violence.melee", "stealth.escape"],
        personality: "Gruff but honorable, respects strength",
        dialogue: {
            first: "You think you can learn from me, малыш? Prove you're worthy first.",
            teaching: "In Siberia, we learn to fight with whatever we have. Let me show you...",
            mastered: "You have exceeded even my expectations. Go, make the Bratva proud."
        },
        requirements: { violence: 10, reputation: 250 },
        unlockMessage: "Viktor grudgingly agrees to teach you after seeing your combat prowess"
    },
    {
        name: "Isabella 'La Sombra' Martinez",
        faction: "morales",
        specialties: ["stealth.infiltration", "charisma.manipulation"],
        personality: "Cunning and patient, tests your resolve",
        dialogue: {
            first: "Ah, another street rat thinks they can learn the art of shadows...",
            teaching: "Patience, mijo. The shadows reveal their secrets only to those who wait.",
            mastered: "You move like smoke now. Even I didn't see that coming."
        },
        requirements: { stealth: 12, charisma: 8 },
        unlockMessage: "Isabella is impressed by your subtlety and agrees to share her techniques"
    },
    {
        name: "Jin 'Digital Dragon' Chen",
        faction: "chen",
        specialties: ["intelligence.hacking", "intelligence.forensics"],
        personality: "Analytical and philosophical, speaks in riddles",
        dialogue: {
            first: "The ancient masters say: 'Know yourself and know your enemy...'",
            teaching: "Code is like water - it flows around obstacles, finds every weakness.",
            mastered: "You have transcended the physical realm. The digital world bows to you."
        },
        requirements: { intelligence: 15, technology: 5 },
        unlockMessage: "Jin recognizes your intellectual potential and offers to expand your mind"
    },
    {
        name: "Anthony 'The Fixer' Torrino",
        faction: "torrino",
        specialties: ["charisma.negotiation", "intelligence.planning"],
        personality: "Smooth-talking family man who values respect",
        dialogue: {
            first: "In this business, reputation is everything. What's yours worth?",
            teaching: "It's not about what you know, it's about who you know. Let me introduce you...",
            mastered: "You understand now - this isn't just crime, it's an art form."
        },
        requirements: { charisma: 14, reputation: 500 },
        unlockMessage: "Anthony sees potential in you and offers to teach you the family business"
    }
];
