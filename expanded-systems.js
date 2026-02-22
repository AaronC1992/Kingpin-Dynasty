/**
 * expanded-systems.js
 * 
 * EXPANDED GAMEPLAY SYSTEMS FOR "FROM DUSK TO DON"
 * 
 * This module extends existing systems with:
 * 1. Gang Member Roles, Stats & Traits
 * 2. Territory Wars & Defense
 * 3. Interactive Random Events
 * 4. Rival AI Kingpins
 * 5. Permanent Legacy Perks
 * 6. Respect-Based Relationship System
 * 
 * All features integrate with existing systems without replacing them.
 */

// ==================== CONFIGURATION ====================

export const EXPANDED_SYSTEMS_CONFIG = {
    gangRolesEnabled: true,
    territoryWarsEnabled: true,
    interactiveEventsEnabled: true,
    rivalKingpinsEnabled: true,
    legacyPerksEnabled: true,
    respectSystemEnabled: true,
    
    // Balance settings
    rivalGrowthInterval: 120000, // 2 minutes between rival actions
    territoryAttackChance: 0.15, // 15% chance of attack per check
    legacyPointsMultiplier: 1.0,
    respectDecayRate: 0.95, // Respect naturally decays to neutral over time
};

// ==================== 1. GANG MEMBER ROLES & STATS ====================

export const GANG_MEMBER_ROLES = {
    bruiser: {
        name: "Bruiser",
        icon: "",
        description: "Muscle for hire. Excels in combat and intimidation.",
        baseStat: { violence: 15, stealth: 5, intelligence: 5, loyalty: 50 },
        perk: {
            name: "Enforcer",
            effect: "Reduces arrest chance on violent jobs by 10%"
        }
    },
    fixer: {
        name: "Fixer",
        icon: "",
        description: "Smooth talker who knows everyone worth knowing.",
        baseStat: { violence: 5, stealth: 10, intelligence: 15, loyalty: 60 },
        perk: {
            name: "Connected",
            effect: "Reduces heat gain by 15%"
        }
    },
    hacker: {
        name: "Hacker",
        icon: "",
        description: "Tech wizard specializing in breaking electronic security.",
        baseStat: { violence: 3, stealth: 15, intelligence: 20, loyalty: 55 },
        perk: {
            name: "Digital Ghost",
            effect: "+20% success on intelligence-based jobs"
        }
    },
    enforcer: {
        name: "Enforcer",
        icon: "",
        description: "Professional killer who handles the wet work.",
        baseStat: { violence: 18, stealth: 12, intelligence: 8, loyalty: 45 },
        perk: {
            name: "Assassin",
            effect: "+15% damage in territory wars"
        }
    },
    driver: {
        name: "Wheelman",
        icon: "",
        description: "Master behind the wheel, perfect for getaways.",
        baseStat: { violence: 8, stealth: 15, intelligence: 10, loyalty: 65 },
        perk: {
            name: "Fast & Furious",
            effect: "+25% escape chance when heat is high"
        }
    },
    scout: {
        name: "Scout",
        icon: "",
        description: "Expert at gathering intelligence on targets.",
        baseStat: { violence: 6, stealth: 18, intelligence: 15, loyalty: 70 },
        perk: {
            name: "Eyes Everywhere",
            effect: "Reveals territory attack warnings 30 seconds early"
        }
    },
    accountant: {
        name: "Accountant",
        icon: "",
        description: "Numbers genius who maximizes profits.",
        baseStat: { violence: 2, stealth: 10, intelligence: 22, loyalty: 75 },
        perk: {
            name: "Money Launderer",
            effect: "+10% income from businesses and territories"
        }
    }
};

// Generate a gang member with role, stats, and traits
export function generateGangMember(role = null, name = null) {
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
            intelligence: roleData.baseStat.intelligence + Math.floor(Math.random() * 10),
            loyalty: roleData.baseStat.loyalty + Math.floor(Math.random() * 20) - 10
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
        { name: "Hothead", effect: "+10% violence, -5% loyalty" },
        { name: "Cool Under Pressure", effect: "+10% success in high-heat jobs" },
        { name: "Loyal to the End", effect: "Never betrays, +10% loyalty" },
        { name: "Greedy", effect: "+15% payout demand, -10% loyalty" },
        { name: "Cautious", effect: "-10% arrest chance, -5% success" },
        { name: "Reckless", effect: "+10% success, +15% arrest chance" },
        { name: "Charming", effect: "+10% reputation gains" },
        { name: "Paranoid", effect: "+20% detection of betrayals" },
        { name: "Veteran", effect: "+5 to all stats" },
        { name: "Greenhorn", effect: "-5 to all stats, gains XP 50% faster" }
    ];
    
    // 30% chance of having a trait
    if (Math.random() > 0.7) {
        return [allTraits[Math.floor(Math.random() * allTraits.length)]];
    }
    
    return [];
}

// Calculate gang member effectiveness for a specific task type
export function calculateMemberEffectiveness(member, taskType) {
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
    
    // Apply loyalty modifier
    const loyaltyMod = member.stats.loyalty / 100;
    baseScore *= (0.5 + loyaltyMod * 0.5); // 50% to 100% effectiveness based on loyalty
    
    // Apply trait modifiers
    member.traits.forEach(trait => {
        if (trait.name === "Veteran") baseScore *= 1.15;
        if (trait.name === "Greenhorn") baseScore *= 0.85;
        if (trait.name === "Reckless" && taskType === "violence") baseScore *= 1.1;
        if (trait.name === "Cautious" && taskType === "stealth") baseScore *= 1.1;
    });
    
    return Math.floor(baseScore);
}

// Update gang member loyalty
export function updateMemberLoyalty(member, change, reason = "") {
    member.stats.loyalty = Math.max(0, Math.min(100, member.stats.loyalty + change));
    
    // Check for betrayal if loyalty too low
    if (member.stats.loyalty < 20 && Math.random() < 0.3) {
        return { betrayed: true, member: member };
    }
    
    return { betrayed: false, loyaltyChange: change };
}

// ==================== 2. TERRITORY WARS & DEFENSE ====================

export const TERRITORIES = [
    {
        id: "downtown",
        name: "Downtown District",
        description: "Heart of the city with high-value targets",
        baseIncome: 5000,
        defenseRequired: 200,
        riskLevel: "high",
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    },
    {
        id: "docks",
        name: "The Docks",
        description: "Perfect for smuggling operations",
        baseIncome: 3500,
        defenseRequired: 150,
        riskLevel: "medium",
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    },
    {
        id: "suburbs",
        name: "Suburban Rackets",
        description: "Safe neighborhoods with steady income",
        baseIncome: 2000,
        defenseRequired: 100,
        riskLevel: "low",
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    },
    {
        id: "industrial",
        name: "Industrial Zone",
        description: "Warehouses and chop shops",
        baseIncome: 4000,
        defenseRequired: 175,
        riskLevel: "medium",
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    },
    {
        id: "casino_district",
        name: "Casino District",
        description: "High rollers and underground gambling",
        baseIncome: 6000,
        defenseRequired: 250,
        riskLevel: "very high",
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0
    }
];

// Assign gang members to defend a territory
export function assignMembersToTerritory(territoryId, memberIds, player) {
    const territory = TERRITORIES.find(t => t.id === territoryId);
    if (!territory) return { success: false, message: "Territory not found" };
    
    // Remove members from their current assignments
    memberIds.forEach(memberId => {
        const member = player.gang.gangMembers.find(m => m.id === memberId);
        if (member && member.assignedTo) {
            // Remove from previous territory
            const oldTerritory = TERRITORIES.find(t => t.id === member.assignedTo);
            if (oldTerritory) {
                oldTerritory.defendingMembers = oldTerritory.defendingMembers.filter(id => id !== memberId);
            }
        }
        if (member) {
            member.assignedTo = territoryId;
        }
    });
    
    territory.defendingMembers = memberIds;
    
    const defenseStrength = calculateTerritoryDefense(territory, player);
    
    return {
        success: true,
        message: `Assigned ${memberIds.length} members to ${territory.name}`,
        defenseStrength: defenseStrength
    };
}

// Calculate total defense strength of a territory
export function calculateTerritoryDefense(territory, player) {
    let totalDefense = territory.fortificationLevel * 10; // Fortifications add base defense
    
    territory.defendingMembers.forEach(memberId => {
        const member = player.gang.gangMembers.find(m => m.id === memberId);
        if (member && member.status === "active") {
            totalDefense += calculateMemberEffectiveness(member, "defense");
            
            // Apply role bonuses
            if (member.role === "enforcer") totalDefense *= 1.15;
            if (member.role === "bruiser") totalDefense *= 1.10;
            if (member.role === "scout") totalDefense *= 1.05;
        }
    });
    
    return Math.floor(totalDefense);
}

// Process a territory attack
export function processTerritoryAttack(territory, attackerName, attackStrength, player) {
    const defenseStrength = calculateTerritoryDefense(territory, player);
    const attackSuccess = attackStrength > defenseStrength;
    
    const result = {
        success: !attackSuccess, // Player success = attack failed
        territory: territory.name,
        attacker: attackerName,
        attackStrength: attackStrength,
        defenseStrength: defenseStrength,
        casualties: [],
        injuredDefenders: [],
        lostTerritory: false,
        rewards: {}
    };
    
    if (attackSuccess) {
        // Attack succeeded - territory lost
        result.lostTerritory = true;
        territory.controlledBy = attackerName;
        
        // Chance of casualties/injuries
        territory.defendingMembers.forEach(memberId => {
            const member = player.gang.gangMembers.find(m => m.id === memberId);
            if (!member) return;
            
            const casualtyRoll = Math.random();
            if (casualtyRoll < 0.1) {
                // 10% chance of death
                member.status = "dead";
                result.casualties.push(member.name);
            } else if (casualtyRoll < 0.3) {
                // 20% chance of jail
                member.status = "jailed";
                result.casualties.push(member.name + " (arrested)");
            } else if (casualtyRoll < 0.6) {
                // 30% chance of injury
                member.status = "injured";
                result.injuredDefenders.push(member.name);
                // Auto-heal after 5 minutes
                setTimeout(() => {
                    if (member.status === "injured") member.status = "active";
                }, 300000);
            }
            
            // Loyalty hit from losing
            updateMemberLoyalty(member, -10, "Lost territory defense");
        });
        
        territory.defendingMembers = [];
        
    } else {
        // Defense successful
        result.rewards.money = Math.floor(territory.baseIncome * 0.5);
        result.rewards.respect = Math.floor(territory.baseIncome / 100);
        
        // Loyalty boost for defenders
        territory.defendingMembers.forEach(memberId => {
            const member = player.gang.gangMembers.find(m => m.id === memberId);
            if (member) {
                updateMemberLoyalty(member, 5, "Successfully defended territory");
            }
        });
        
        // Small chance of minor casualties even in victory
        if (Math.random() < 0.15 && territory.defendingMembers.length > 0) {
            const randomDefender = player.gang.gangMembers.find(
                m => m.id === territory.defendingMembers[Math.floor(Math.random() * territory.defendingMembers.length)]
            );
            if (randomDefender) {
                randomDefender.status = "injured";
                result.injuredDefenders.push(randomDefender.name);
                setTimeout(() => {
                    if (randomDefender.status === "injured") randomDefender.status = "active";
                }, 300000);
            }
        }
    }
    
    territory.lastAttacked = Date.now();
    
    return result;
}

// ==================== 3. INTERACTIVE RANDOM EVENTS ====================

export const INTERACTIVE_EVENTS = [
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
                        loyalty: 10,
                        message: "Your crew fought like hell. The cops retreated, but they'll be back with reinforcements."
                    },
                    failure: {
                        money: -5000,
                        heat: 50,
                        respect: -10,
                        loyalty: -15,
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
                        loyalty: 15,
                        gangMemberLoss: 1
                    },
                    failure: {
                        message: "You found nothing. Maybe it was just paranoia... or maybe the rat is still among you.",
                        loyalty: -5
                    }
                },
                successChance: 0.7
            },
            {
                text: "Ignore the rumors",
                requirements: {},
                outcomes: {
                    success: {
                        message: "Sometimes rumors are just rumors. The crew appreciates that you trust them.",
                        loyalty: 5
                    },
                    failure: {
                        message: "Turns out the rumors were true. One of your guys flipped. The feds now have intel on your operations.",
                        heat: 40,
                        respect: -15,
                        loyalty: -20,
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
                        loyalty: -25,
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
export function triggerInteractiveEvent(player) {
    // Filter events based on player status
    const availableEvents = INTERACTIVE_EVENTS.filter(event => {
        // Add any event-specific availability logic here
        return true;
    });
    
    if (availableEvents.length === 0) return null;
    
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    
    return {
        ...event,
        timestamp: Date.now()
    };
}

// Process player's choice in an interactive event
export function processEventChoice(event, choiceIndex, player) {
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
    
    if (requirements.violence && player.skills.violence < requirements.violence) {
        missing.push(`Violence ${requirements.violence}`);
    }
    
    if (requirements.intelligence && player.skills.intelligence < requirements.intelligence) {
        missing.push(`Intelligence ${requirements.intelligence}`);
    }
    
    if (requirements.charisma && player.skills.charisma < requirements.charisma) {
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
        player.wantedLevel = Math.max(0, Math.min(100, player.wantedLevel + outcome.heat));
        changes.heat = outcome.heat;
    }
    
    if (outcome.respect) {
        player.reputation += outcome.respect;
        changes.respect = outcome.respect;
    }
    
    if (outcome.loyalty) {
        player.gang.gangMembers.forEach(member => {
            if (member.status === "active") {
                updateMemberLoyalty(member, outcome.loyalty);
            }
        });
        changes.loyalty = outcome.loyalty;
    }
    
    if (outcome.gangMemberLoss && player.gang.gangMembers.length > 0) {
        const toLose = Math.min(outcome.gangMemberLoss, player.gang.gangMembers.length);
        const lostMembers = [];
        for (let i = 0; i < toLose; i++) {
            const randomIndex = Math.floor(Math.random() * player.gang.gangMembers.length);
            const member = player.gang.gangMembers[randomIndex];
            member.status = "dead";
            lostMembers.push(member.name);
        }
        changes.lostMembers = lostMembers;
    }
    
    if (outcome.jailChance && Math.random() * 100 < outcome.jailChance) {
        // Trigger jail
        changes.jailed = true;
    }
    
    if (outcome.power) {
        player.power += outcome.power;
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

// ==================== 4. RIVAL AI KINGPINS ====================

export const RIVAL_KINGPINS = [
    {
        id: "torrino_boss",
        name: "Don Vittorio Torrino",
        faction: "torrino",
        personality: "traditional",
        territories: ["industrial"],
        gangSize: 8,
        powerRating: 150,
        wealth: 50000,
        aggressiveness: 0.6,
        respectTowardPlayer: 0,
        specialAbility: "old_school_tactics"
    },
    {
        id: "kozlov_boss",
        name: "Yuri Kozlov",
        faction: "kozlov",
        personality: "ruthless",
        territories: ["docks"],
        gangSize: 10,
        powerRating: 180,
        wealth: 75000,
        aggressiveness: 0.8,
        respectTowardPlayer: 0,
        specialAbility: "brutal_efficiency"
    },
    {
        id: "chen_boss",
        name: "Chen Wei",
        faction: "chen",
        personality: "strategic",
        territories: ["casino_district"],
        gangSize: 7,
        powerRating: 140,
        wealth: 100000,
        aggressiveness: 0.4,
        respectTowardPlayer: 0,
        specialAbility: "financial_genius"
    },
    {
        id: "morales_boss",
        name: "Isabella Morales",
        faction: "morales",
        personality: "expanding",
        territories: ["suburbs"],
        gangSize: 9,
        powerRating: 160,
        wealth: 60000,
        aggressiveness: 0.7,
        respectTowardPlayer: 0,
        specialAbility: "network_expansion"
    },
    {
        id: "independent_boss",
        name: "Marcus 'The Jackal' Kane",
        faction: "independent",
        personality: "opportunistic",
        territories: [],
        gangSize: 6,
        powerRating: 120,
        wealth: 30000,
        aggressiveness: 0.9,
        respectTowardPlayer: 0,
        specialAbility: "guerrilla_warfare"
    }
];

// Rival AI turn - called periodically
export function processRivalTurn(rival, allTerritories, player) {
    const actions = [];
    
    // 1. Grow gang (if has money)
    if (rival.wealth > 5000 && rival.gangSize < 20 && Math.random() < 0.4) {
        rival.gangSize += 1;
        rival.wealth -= 5000;
        actions.push(`${rival.name} recruited a new soldier`);
    }
    
    // 2. Attempt territory expansion
    if (Math.random() < rival.aggressiveness * 0.5) {
        const uncontrolledTerritories = allTerritories.filter(t => 
            !t.controlledBy || (t.controlledBy !== rival.id && t.controlledBy !== "player")
        );
        
        if (uncontrolledTerritories.length > 0) {
            const target = uncontrolledTerritories[Math.floor(Math.random() * uncontrolledTerritories.length)];
            
            // Attempt to claim neutral territory
            if (!target.controlledBy) {
                target.controlledBy = rival.id;
                rival.territories.push(target.id);
                actions.push(`${rival.name} claimed ${target.name}`);
            }
        }
    }
    
    // 3. Attack player territory (if aggressive enough and player has territories)
    const playerTerritories = allTerritories.filter(t => t.controlledBy === "player");
    
    if (playerTerritories.length > 0 && Math.random() < rival.aggressiveness * EXPANDED_SYSTEMS_CONFIG.territoryAttackChance) {
        const target = playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
        const attackStrength = rival.powerRating + (rival.gangSize * 15);
        
        actions.push({
            type: "territory_attack",
            attacker: rival.name,
            attackerId: rival.id,
            territory: target,
            attackStrength: attackStrength
        });
    }
    
    // 4. Collect income from territories
    rival.territories.forEach(territoryId => {
        const territory = allTerritories.find(t => t.id === territoryId);
        if (territory) {
            rival.wealth += territory.baseIncome * 0.5; // Half income as they're AI
        }
    });
    
    // 5. Increase power over time
    rival.powerRating += Math.floor(Math.random() * 5);
    
    return actions;
}

// ==================== 5. PERMANENT LEGACY PERKS ====================

export const LEGACY_PERKS = {
    hustlers_edge: {
        id: "hustlers_edge",
        name: "Hustler's Edge",
        description: "+15% XP gain from all sources",
        cost: 100,
        effect: { xpMultiplier: 1.15 },
        icon: ""
    },
    family_ties: {
        id: "family_ties",
        name: "Family Ties",
        description: "Start with 3 loyal gang members",
        cost: 150,
        effect: { startingGangMembers: 3 },
        icon: ""
    },
    laundering_genius: {
        id: "laundering_genius",
        name: "Laundering Genius",
        description: "Launder money 25% faster with 10% less loss",
        cost: 200,
        effect: { launderSpeed: 1.25, launderLoss: 0.9 },
        icon: ""
    },
    heat_resistant: {
        id: "heat_resistant",
        name: "Heat Resistant",
        description: "Heat decays 50% faster",
        cost: 175,
        effect: { heatDecay: 1.5 },
        icon: ""
    },
    natural_leader: {
        id: "natural_leader",
        name: "Natural Leader",
        description: "+5 max gang capacity",
        cost: 125,
        effect: { maxGangBonus: 5 },
        icon: ""
    },
    strategic_mind: {
        id: "strategic_mind",
        name: "Strategic Mind",
        description: "+10% success chance on all jobs",
        cost: 250,
        effect: { jobSuccessBonus: 0.1 },
        icon: ""
    },
    old_money: {
        id: "old_money",
        name: "Old Money",
        description: "Start each run with $10,000",
        cost: 200,
        effect: { startingMoney: 10000 },
        icon: ""
    },
    iron_will: {
        id: "iron_will",
        name: "Iron Will",
        description: "+25% breakout success chance",
        cost: 150,
        effect: { breakoutBonus: 0.25 },
        icon: ""
    },
    master_recruiter: {
        id: "master_recruiter",
        name: "Master Recruiter",
        description: "Recruited gang members have +5 to all stats",
        cost: 225,
        effect: { recruitStatBonus: 5 },
        icon: "⭐"
    },
    territory_expert: {
        id: "territory_expert",
        name: "Territory Expert",
        description: "+20% income from all territories",
        cost: 175,
        effect: { territoryIncomeBonus: 1.2 },
        icon: ""
    }
};

// Calculate legacy points earned from a run
export function calculateLegacyPoints(player) {
    let points = 0;
    
    // Wealth (1 point per $10,000, max 500)
    points += Math.min(Math.floor(player.money / 10000), 500);
    
    // Territories (50 points each)
    if (player.territories) {
        points += player.territories.filter(t => t.controlledBy === "player").length * 50;
    }
    
    // Gang strength (5 points per active member)
    if (player.gang.gangMembers) {
        points += player.gang.gangMembers.filter(m => m.status === "active").length * 5;
    }
    
    // Respect/Reputation (1 point per 10 respect, max 200)
    points += Math.min(Math.floor(player.reputation / 10), 200);
    
    // Level (10 points per level)
    points += player.level * 10;
    
    // Businesses (25 points each)
    if (player.businesses) {
        points += player.businesses.length * 25;
    }
    
    // Apply multiplier from config
    points = Math.floor(points * EXPANDED_SYSTEMS_CONFIG.legacyPointsMultiplier);
    
    return points;
}

// Apply legacy perks to a new game
export function applyLegacyPerks(player, unlockedPerks) {
    unlockedPerks.forEach(perkId => {
        const perk = LEGACY_PERKS[perkId];
        if (!perk) return;
        
        const effect = perk.effect;
        
        if (effect.startingMoney) {
            player.money += effect.startingMoney;
        }
        
        if (effect.startingGangMembers) {
            for (let i = 0; i < effect.startingGangMembers; i++) {
                const member = generateGangMember();
                player.gang.gangMembers.push(member);
                player.gang.members++;
            }
        }
        
        if (effect.maxGangBonus) {
            player.realEstate.maxGangMembers += effect.maxGangBonus;
        }
        
        // Other effects are applied dynamically during gameplay
    });
}

// ==================== 6. RESPECT-BASED RELATIONSHIP SYSTEM ====================

// Initialize respect for all factions/rivals
export function initializeRespectSystem(player) {
    if (!player.relationships) {
        player.relationships = {
            // Factions
            torrino: 0,
            kozlov: 0,
            chen: 0,
            morales: 0,
            police: -20, // Starts slightly negative
            
            // Rival kingpins
            torrino_boss: 0,
            kozlov_boss: 0,
            chen_boss: 0,
            morales_boss: 0,
            independent_boss: 0,
            
            // Special groups
            civilians: 0,
            underground: 0
        };
    }
}

// Modify respect with a faction/rival
export function modifyRespect(player, targetId, change, reason = "") {
    if (!player.relationships) initializeRespectSystem(player);
    
    const oldValue = player.relationships[targetId] || 0;
    const newValue = Math.max(-100, Math.min(100, oldValue + change));
    
    player.relationships[targetId] = newValue;
    
    // Respect affects related outcomes
    const effects = calculateRespectEffects(targetId, newValue);
    
    return {
        target: targetId,
        oldValue: oldValue,
        newValue: newValue,
        change: change,
        reason: reason,
        effects: effects
    };
}

// Calculate benefits/penalties from respect level
function calculateRespectEffects(targetId, respectValue) {
    const effects = {
        priceModifier: 1.0,
        jobAccessModifier: 1.0,
        attackChance: 0,
        supportChance: 0,
        specialMissionsAvailable: false
    };
    
    // High respect (60-100)
    if (respectValue >= 60) {
        effects.priceModifier = 0.8; // 20% discount
        effects.jobAccessModifier = 1.3; // 30% better jobs
        effects.supportChance = 0.25; // 25% chance they'll help in crisis
        effects.specialMissionsAvailable = true;
    }
    // Moderate respect (20-59)
    else if (respectValue >= 20) {
        effects.priceModifier = 0.9; // 10% discount
        effects.jobAccessModifier = 1.1; // 10% better jobs
        effects.supportChance = 0.1;
    }
    // Neutral (-19 to 19)
    else if (respectValue >= -19) {
        // No modifiers
    }
    // Low respect (-20 to -59)
    else if (respectValue >= -60) {
        effects.priceModifier = 1.2; // 20% markup
        effects.attackChance = 0.15; // 15% chance of sabotage
    }
    // Very low respect (-60 to -100)
    else {
        effects.priceModifier = 1.5; // 50% markup
        effects.attackChance = 0.35; // 35% chance of attacks
        effects.jobAccessModifier = 0.7; // Limited access
    }
    
    return effects;
}

// Natural respect decay toward neutral over time
export function processRespectDecay(player) {
    if (!player.relationships) return;
    
    Object.keys(player.relationships).forEach(targetId => {
        const current = player.relationships[targetId];
        
        // Decay toward 0 (neutral)
        if (current > 0) {
            player.relationships[targetId] = Math.floor(current * EXPANDED_SYSTEMS_CONFIG.respectDecayRate);
        } else if (current < 0) {
            player.relationships[targetId] = Math.ceil(current * EXPANDED_SYSTEMS_CONFIG.respectDecayRate);
        }
    });
}

// ==================== INTEGRATION & INITIALIZATION ====================

// Initialize all expanded systems for a new game
export function initializeExpandedSystems(player) {
    // Gang members
    if (!player.gang.gangMembers) {
        player.gang.gangMembers = [];
    }
    
    // Territories
    if (!player.territoriesEx) {
        player.territoriesEx = JSON.parse(JSON.stringify(TERRITORIES)); // Deep clone
    }
    
    // Rival kingpins
    if (!player.rivalKingpins) {
        player.rivalKingpins = JSON.parse(JSON.stringify(RIVAL_KINGPINS));
    }
    
    // Legacy system
    if (!player.legacy.permanentPerks) {
        player.legacy.permanentPerks = [];
        player.legacy.availableLegacyPoints = 0;
    }
    
    // Respect system removed — factions use streetReputation in player.js
    // initializeRespectSystem(player);
    
    // Event tracking
    if (!player.interactiveEvents) {
        player.interactiveEvents = {
            lastEventTime: 0,
            eventsTriggered: [],
            eventCooldown: 300000 // 5 minutes between events
        };
    }
}

// Export all systems for use in main game
export default {
    CONFIG: EXPANDED_SYSTEMS_CONFIG,
    ROLES: GANG_MEMBER_ROLES,
    TERRITORIES: TERRITORIES,
    EVENTS: INTERACTIVE_EVENTS,
    RIVALS: RIVAL_KINGPINS,
    LEGACY_PERKS: LEGACY_PERKS,
    
    // Gang functions
    generateGangMember,
    calculateMemberEffectiveness,
    updateMemberLoyalty,
    
    // Territory functions
    assignMembersToTerritory,
    calculateTerritoryDefense,
    processTerritoryAttack,
    
    // Event functions
    triggerInteractiveEvent,
    processEventChoice,
    
    // Rival functions
    processRivalTurn,
    
    // Legacy functions
    calculateLegacyPoints,
    applyLegacyPerks,
    
    // Respect functions
    initializeRespectSystem,
    modifyRespect,
    processRespectDecay,
    
    // Initialization
    initializeExpandedSystems
};
