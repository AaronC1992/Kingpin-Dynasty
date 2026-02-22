/**
 * missions.js
 * 
 * Manages story campaigns, faction missions, territory expansion, and boss battles.
 * Contains all mission definitions, objectives, rewards, and progression logic
 * for the game's narrative and mission systems.
 */

// Story Campaigns - Multi-part missions with narrative progression
export const storyCampaigns = {
    risingThroughRanks: {
        id: "risingThroughRanks",
        name: "Rising Through the Ranks",
        description: "Your journey from street thug to criminal mastermind",
        currentChapter: 0,
        unlocked: true,
        chapters: [
            {
                title: "First Steps",
                description: "Prove yourself on the streets",
                objectives: [
                    { type: "complete_jobs", target: 5, current: 0, text: "Complete 5 jobs" },
                    { type: "earn_money", target: 500, current: 0, text: "Earn $500" }
                ],
                rewards: { money: 5000, experience: 100, reputation: 5 },
                nextChapter: 1
            },
            {
                title: "Building Connections",
                description: "Start building your criminal network",
                objectives: [
                    { type: "recruit_members", target: 3, current: 0, text: "Recruit 3 gang members" },
                    { type: "complete_faction_mission", target: 1, current: 0, text: "Complete 1 faction mission" }
                ],
                rewards: { money: 25000, experience: 200, reputation: 15 },
                nextChapter: 2
            },
            {
                title: "Territory Wars",
                description: "Expand your influence across the city",
                objectives: [
                    { type: "control_territory", target: 3, current: 0, text: "Control 3 territories" },
                    { type: "win_boss_battle", target: 1, current: 0, text: "Defeat a rival boss" }
                ],
                rewards: { money: 100000, experience: 500, reputation: 30 },
                nextChapter: 3
            },
            {
                title: "Criminal Empire",
                description: "Establish yourself as a major player",
                objectives: [
                    { type: "reach_reputation", target: 75, current: 0, text: "Reach 75 reputation" },
                    { type: "own_properties", target: 3, current: 0, text: "Own 3 properties" }
                ],
                rewards: { money: 500000, experience: 1000, reputation: 50 },
                nextChapter: null // Final chapter
            }
        ]
    }
};

// Faction Missions - Unique jobs for each crime family
export const factionMissions = {
    torrino: [
        {
            id: "torrino_0",
            name: "Message Delivery",
            description: "Deliver an important message to a family associate across town. No questions asked.",
            payout: [200000, 350000],
            risk: "low",
            jailChance: 5,
            energyCost: 8,
            requiredItems: [],
            reputation: 5,
            factionRep: 3,
            unlocked: true,
            story: "The Torrino family values loyalty and discretion. Prove you can handle simple tasks first."
        },
        {
            id: "torrino_1",
            name: "Collect Overdue Debt",
            description: "A local shopkeeper hasn't paid protection money. Remind them of their obligations.",
            payout: [300000, 600000],
            risk: "medium",
            jailChance: 20,
            energyCost: 15,
            requiredItems: ["Brass Knuckles"],
            reputation: 10,
            factionRep: 5,
            unlocked: true,
            story: "The Torrino family values loyalty and prompt payment. Show them what happens when debts go unpaid."
        },
        {
            id: "torrino_2",
            name: "Intimidate Rival Business",
            description: "A competing restaurant is cutting into family profits. Make them reconsider their location.",
            payout: [500000, 1000000],
            risk: "high",
            jailChance: 30,
            energyCost: 20,
            requiredItems: ["Pistol", "Bullets"],
            reputation: 25,
            factionRep: 10,
            unlocked: false,
            story: "Old-school methods for old-school problems. Sometimes business negotiations require... persuasion."
        }
    ],
    kozlov: [
        {
            id: "kozlov_0",
            name: "Street Information",
            description: "Gather information about police patrol routes in the industrial district.",
            payout: [200000, 400000],
            risk: "low",
            jailChance: 10,
            energyCost: 10,
            requiredItems: [],
            reputation: 5,
            factionRep: 3,
            unlocked: true,
            story: "The Bratva values reliable informants. Prove you can keep your eyes and ears open."
        },
        {
            id: "kozlov_1",
            name: "Weapons Smuggling Run",
            description: "Transport a shipment of illegal weapons across the city without getting caught.",
            payout: [800000, 1200000],
            risk: "high",
            jailChance: 35,
            energyCost: 25,
            requiredItems: ["Luxury Automobile", "Gasoline"],
            reputation: 20,
            factionRep: 8,
            unlocked: true,
            story: "The Bratva needs reliable drivers for their arms business. Prove you can handle the heat."
        },
        {
            id: "kozlov_2",
            name: "Border Crossing Operation",
            description: "Help smuggle goods across international borders using your connections.",
            payout: [1500000, 2500000],
            risk: "extreme",
            jailChance: 45,
            energyCost: 35,
            requiredItems: ["Private Airplane", "Tommy Gun"],
            reputation: 50,
            factionRep: 15,
            unlocked: false,
            story: "Big risks, bigger rewards. The Kozlovs trust only their most proven associates with this operation."
        }
    ],
    chen: [
        {
            id: "chen_0",
            name: "Digital Surveillance",
            description: "Monitor communications for suspicious activities using basic hacking tools.",
            payout: [300000, 500000],
            risk: "low",
            jailChance: 5,
            energyCost: 8,
            requiredItems: [],
            reputation: 5,
            factionRep: 4,
            unlocked: true,
            story: "The Triad appreciates those who can work with technology and discretion."
        },
        {
            id: "chen_1",
            name: "High-Tech Heist",
            description: "Steal cutting-edge technology from a corporate facility using advanced techniques.",
            payout: [600000, 1100000],
            risk: "high",
            jailChance: 25,
            energyCost: 20,
            requiredItems: ["Bulletproof Vest"],
            reputation: 30,
            factionRep: 10,
            unlocked: true,
            story: "The Chen Triad values intelligence and precision. Show them you can handle sophisticated operations."
        }
    ],
    morales: [
        {
            id: "morales_0",
            name: "Neighborhood Watch",
            description: "Keep an eye on rival gang movements in cartel territory and report back.",
            payout: [250000, 450000],
            risk: "low",
            jailChance: 15,
            energyCost: 12,
            requiredItems: [],
            reputation: 8,
            factionRep: 5,
            unlocked: true,
            story: "El Jefe needs loyal eyes on the street. Show the cartel you can be trusted with their territory."
        },
        {
            id: "morales_1",
            name: "Drug Lab Protection",
            description: "Guard a secret drug manufacturing facility from rival gangs and police raids.",
            payout: [700000, 1300000],
            risk: "very high",
            jailChance: 40,
            energyCost: 30,
            requiredItems: ["Tommy Gun", "Bullets"],
            reputation: 35,
            factionRep: 12,
            unlocked: true,
            story: "The cartel's operations must be protected at all costs. Are you ready to defend their interests?"
        }
    ]
};

// Territory Missions - Specific missions to expand into new areas
export const territoryMissions = [
    {
        id: "docks_expansion",
        name: "Secure the Docks",
        description: "Take control of the lucrative shipping district from rival gangs.",
        territory: "Industrial Docks",
        difficulty: "medium",
        requiredGangMembers: 5,
        energyCost: 25,
        rewards: {
            money: 2000000,
            territory: 1,
            reputation: 15,
            passive_income: 100000 // Per tribute collection
        },
        risks: {
            jailChance: 35,
            gangMemberLoss: 15, // Chance to lose a gang member
            healthLoss: 20
        },
        story: "The docks control all smuggling operations. Whoever controls the ports controls the city's underground economy."
    },
    {
        id: "downtown_expansion",
        name: "Downtown Takeover",
        description: "Establish dominance in the city's business district.",
        territory: "Downtown Business District",
        difficulty: "hard",
        requiredGangMembers: 8,
        energyCost: 35,
        rewards: {
            money: 4000000,
            territory: 2,
            reputation: 25,
            passive_income: 200000
        },
        risks: {
            jailChance: 45,
            gangMemberLoss: 25,
            healthLoss: 30
        },
        story: "The heart of the city's economy. Control here means influence over legitimate businesses and underground operations alike."
    },
    {
        id: "suburbs_expansion",
        name: "Suburban Influence",
        description: "Expand operations into the wealthy suburban areas.",
        territory: "Wealthy Suburbs",
        difficulty: "easy",
        requiredGangMembers: 3,
        energyCost: 15,
        rewards: {
            money: 1500000,
            territory: 1,
            reputation: 10,
            passive_income: 75000
        },
        risks: {
            jailChance: 25,
            gangMemberLoss: 10,
            healthLoss: 15
        },
        story: "Rich neighborhoods mean rich targets. But suburban security is tight, and the police response is swift."
    }
];

// Boss Battles - High-stakes confrontations with rival leaders
export const bossBattles = [
    {
        id: "rival_boss_santos",
        name: "Eliminate Carlos Santos",
        description: "Take down the leader of a rival gang threatening your territory.",
        boss: {
            name: "Carlos 'El Martillo' Santos",
            power: 150,
            health: 200,
            gang_size: 12,
            special_abilities: ["Bulletproof Vest", "Loyal Guards"]
        },
        requirements: {
            minPower: 100,
            minGangMembers: 8,
            minReputation: 40
        },
        energyCost: 50,
        rewards: {
            money: 8000000,
            reputation: 35,
            territory: 2,
            experience: 500,
            unique_item: "Santos' Golden Pistol" // Special weapon
        },
        risks: {
            jailChance: 60,
            gangMemberLoss: 30,
            healthLoss: 50
        },
        story: "Santos has been muscling in on your territory for months. It's time to send a message that echoes through every street corner.",
        unlocked: false
    },
    {
        id: "police_chief_morrison",
        name: "Corrupt Police Chief Morrison",
        description: "The police chief has been taking bribes but now threatens to expose your operations.",
        boss: {
            name: "Chief Margaret Morrison",
            power: 120,
            health: 150,
            gang_size: 20, // Police officers
            special_abilities: ["Police Backup", "Legal Immunity"]
        },
        requirements: {
            minPower: 80,
            minGangMembers: 6,
            minReputation: 30
        },
        energyCost: 40,
        rewards: {
            money: 6000000,
            reputation: 30,
            wanted_level_reduction: 20, // Reduces wanted level
            experience: 400
        },
        risks: {
            jailChance: 70, // High risk fighting police
            gangMemberLoss: 25,
            healthLoss: 40
        },
        story: "Morrison has been playing both sides for years. Now she's gotten greedy and threatens to bring down your entire operation.",
        unlocked: false
    }
];

// Mission Progress Tracking
export const missionProgress = {
    activeCampaign: "risingThroughRanks",
    completedMissions: [],
    availableFactionMissions: {},
    unlockedTerritoryMissions: ["suburbs_expansion"],
    unlockedBossBattles: [],
    factionReputation: {
        torrino: 0,
        kozlov: 0,
        chen: 0,
        morales: 0
    }
};
