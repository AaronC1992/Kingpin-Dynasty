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
        lore: "Founded in the 1920s by Italian immigrants, the Torrino family built their empire on respect, loyalty, and swift retribution. They control the restaurant district and numerous legitimate businesses as fronts."
    },
    kozlov: {
        name: "Kozlov Bratva",
        description: "Russian crime syndicate specializing in arms dealing and smuggling operations",
        reputation: 0,
        color: "#ff6b35",
        boss: "Dimitri Kozlov",
        specialty: "Weapons trafficking and smuggling",
        lore: "Ex-military Russian operatives who brought military discipline to organized crime. They dominate the weapons trade and have connections across Eastern Europe for large-scale smuggling operations."
    },
    chen: {
        name: "Chen Triad",
        description: "Sophisticated Asian crime organization focusing on high-tech crimes and drug operations",
        reputation: 0,
        color: "#2e8b57",
        boss: "Master Chen Wei",
        specialty: "Technology crimes and drug manufacturing",
        lore: "Ancient traditions meet modern technology. The Chen Triad combines centuries-old honor codes with cutting-edge cybercrime and precision drug manufacturing. They value intelligence over brute force."
    },
    morales: {
        name: "Morales Cartel",
        description: "Powerful South American drug cartel with extensive territory control and distribution networks",
        reputation: 0,
        color: "#ff8c00",
        boss: "El Jefe Morales",
        specialty: "Drug manufacturing and distribution",
        lore: "Born from the coca fields of South America, the Morales Cartel expanded northward with ruthless efficiency. They control vast territories and have corrupted officials at every level of government."
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
