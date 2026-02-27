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
                rewards: { money: 500, experience: 50, reputation: 2 },
                dialogue: {
                    intro: "Every empire starts with a single step. The streets are watching — show them what you're made of.",
                    success: "Not bad, kid. You've got guts. But guts alone won't build an empire."
                },
                nextChapter: 1
            },
            {
                title: "Building Connections",
                description: "Start building your criminal network",
                objectives: [
                    { type: "recruit_members", target: 3, current: 0, text: "Recruit 3 gang members" },
                    { type: "complete_faction_mission", target: 1, current: 0, text: "Complete 1 faction mission" }
                ],
                rewards: { money: 2500, experience: 100, reputation: 5 },
                dialogue: {
                    intro: "You can't do this alone. Every boss needs soldiers, and every soldier needs a reason to follow.",
                    success: "Word on the street is you're putting together a crew. People are starting to pay attention."
                },
                nextChapter: 2
            },
            {
                title: "Turf Wars",
                description: "Expand your influence across the city",
                objectives: [
                    { type: "control_turf", target: 3, current: 0, text: "Control 3 turf zones" },
                    { type: "win_boss_battle", target: 1, current: 0, text: "Defeat a rival boss" }
                ],
                rewards: { money: 10000, experience: 250, reputation: 10 },
                dialogue: {
                    intro: "Lines on a map mean nothing without blood and money behind them. Time to carve out your slice of the city.",
                    success: "Three blocks under your flag. A rival boss sent running. You're not just a player anymore — you're a threat."
                },
                nextChapter: 3
            },
            {
                title: "Criminal Empire",
                description: "Establish yourself as a major player",
                objectives: [
                    { type: "reach_reputation", target: 75, current: 0, text: "Reach 75 reputation" },
                    { type: "own_properties", target: 3, current: 0, text: "Own 3 properties" }
                ],
                rewards: { money: 50000, experience: 500, reputation: 20 },
                dialogue: {
                    intro: "Reputation. Property. Power. The three pillars of any criminal dynasty. Time to build yours.",
                    success: "Look at you — properties across the city, a name that opens doors and closes caskets. But this is just the beginning..."
                },
                nextChapter: null // Final chapter
            }
        ]
    },

    empireOfShadows: {
        id: "empireOfShadows",
        name: "Empire of Shadows",
        description: "Build a criminal empire that operates from every shadow in the city",
        currentChapter: 0,
        unlocked: false,
        unlockRequirements: { reputation: 50, completedCampaign: "risingThroughRanks" },
        chapters: [
            {
                title: "The Laundry Problem",
                description: "Your money is dirty and the feds are sniffing around. Time to go legitimate — on paper.",
                objectives: [
                    { type: "own_businesses", target: 2, current: 0, text: "Own 2 businesses" },
                    { type: "launder_money", target: 10000, current: 0, text: "Launder $10,000" }
                ],
                rewards: { money: 25000, experience: 200, reputation: 8 },
                dialogue: {
                    intro: "\"Money's no good if you can't spend it,\" your accountant mutters, sliding a folder across the desk. \"The IRS has questions. We need fronts — and we need them yesterday.\"",
                    success: "The books are clean. The businesses look legit. But your accountant's nervous smile tells you this is a tightrope walk.",
                    choice: {
                        prompt: "Your accountant suggests two approaches to the laundering operation:",
                        options: [
                            { text: "🏪 Go slow and careful — Small amounts through multiple businesses (Safer, less suspicion)", effect: "suspicion_decrease", value: -5 },
                            { text: "💰 Push it all through fast — Maximum throughput, higher risk (More money, more heat)", effect: "money_bonus", value: 10000 }
                        ]
                    }
                },
                nextChapter: 1
            },
            {
                title: "Rats in the Walls",
                description: "Someone in your organization is feeding information to the police.",
                objectives: [
                    { type: "reach_level", target: 15, current: 0, text: "Reach level 15" },
                    { type: "recruit_members", target: 8, current: 0, text: "Have 8 gang members" }
                ],
                rewards: { money: 50000, experience: 300, reputation: 10 },
                dialogue: {
                    intro: "\"Boss, we got a problem.\" Your lieutenant's face is grim. \"Two of our stash houses got raided last night. Same time. That ain't coincidence — someone's talking.\"",
                    success: "The rat is found face-down in the river. Your crew tightens ranks. Trust is earned in blood now.",
                    choice: {
                        prompt: "You've identified the informant. How do you handle it?",
                        options: [
                            { text: "🔪 Make an example — Let everyone see what happens to rats (+Intimidation, +Suspicion)", effect: "intimidation_bonus", value: 10 },
                            { text: "🤫 Quiet disappearance — No body, no questions, no drama (Safer, cleaner)", effect: "suspicion_decrease", value: -10 }
                        ]
                    }
                },
                nextChapter: 2
            },
            {
                title: "The Five Families Summit",
                description: "The crime families are meeting to divide the city. You need a seat at that table.",
                objectives: [
                    { type: "reach_reputation", target: 100, current: 0, text: "Reach 100 reputation" },
                    { type: "complete_faction_mission", target: 5, current: 0, text: "Complete 5 faction missions" },
                    { type: "control_turf", target: 5, current: 0, text: "Control 5 turf zones" }
                ],
                rewards: { money: 25000, experience: 750, reputation: 20 },
                dialogue: {
                    intro: "An unmarked envelope arrives at your safehouse. Inside: a gold-embossed card with a time, a place, and five words — \"Your presence is required. Come alone.\"",
                    success: "You walk out of the summit as one of the five. The other bosses eye you with a mix of respect and calculation. Welcome to the big leagues.",
                    choice: {
                        prompt: "At the summit, you must choose your alliance carefully:",
                        options: [
                            { text: "🤝 Ally with the Torrinos — Old money, old power, old loyalty (+Torrino Rep)", effect: "faction_rep", value: { torrino: 25 } },
                            { text: "🐻 Side with the Kozlovs — Brutal efficiency, expanding fast (+Kozlov Rep)", effect: "faction_rep", value: { kozlov: 25 } },
                            { text: "🐉 Join the Chen network — Technology and global reach (+Chen Rep)", effect: "faction_rep", value: { chen: 25 } }
                        ]
                    }
                },
                nextChapter: 3
            },
            {
                title: "Shadow King",
                description: "Control the city from the shadows. True power is invisible.",
                objectives: [
                    { type: "own_properties", target: 5, current: 0, text: "Own 5 properties" },
                    { type: "own_businesses", target: 5, current: 0, text: "Own 5 businesses" },
                    { type: "earn_money", target: 500000, current: 0, text: "Accumulate $500,000" }
                ],
                rewards: { money: 75000, experience: 1500, reputation: 30, title: "Shadow King" },
                dialogue: {
                    intro: "\"They don't even know your name,\" your advisor whispers. \"The mayor dances on your strings. The police chief takes your calls. And yet — no one can touch you.\"",
                    success: "The city breathes because you allow it. Every deal, every dollar, every decision flows through your invisible hand. You are the Shadow King."
                },
                nextChapter: null
            }
        ]
    },

    theDonsGambit: {
        id: "theDonsGambit",
        name: "The Don's Gambit",
        description: "The ultimate power play — take the throne or lose everything",
        currentChapter: 0,
        unlocked: false,
        unlockRequirements: { reputation: 120, completedCampaign: "empireOfShadows" },
        chapters: [
            {
                title: "The Old Guard Falls",
                description: "The current Don is dying. Every family smells blood in the water.",
                objectives: [
                    { type: "win_boss_battle", target: 2, current: 0, text: "Defeat 2 rival bosses" },
                    { type: "reach_reputation", target: 150, current: 0, text: "Reach 150 reputation" }
                ],
                rewards: { money: 50000, experience: 1000, reputation: 15 },
                dialogue: {
                    intro: "\"Don Castellano is on his deathbed,\" your consigliere informs you. \"Every family is positioning. The Torrinos think it's their birthright. The Kozlovs are sharpening knives. And the Chen Triad... they're already three moves ahead.\"",
                    success: "Two rival bosses lie broken. The remaining families whisper your name with fear and respect."
                },
                nextChapter: 1
            },
            {
                title: "Blood Money",
                description: "Fund a war chest that will make the other families think twice about opposing you.",
                objectives: [
                    { type: "earn_money", target: 2000000, current: 0, text: "Accumulate $2,000,000" },
                    { type: "own_businesses", target: 8, current: 0, text: "Own 8 businesses" },
                    { type: "launder_money", target: 500000, current: 0, text: "Launder $500,000" }
                ],
                rewards: { money: 100000, experience: 1500, reputation: 20 },
                dialogue: {
                    intro: "\"Wars are won with money before they're won with bullets,\" your war advisor says, spreading financial reports across the table. \"We need a chest deep enough to drown our enemies in.\"",
                    success: "Your war chest bulges. Mercenaries answer your calls. Politicians pocket your envelopes. The stage is set.",
                    choice: {
                        prompt: "With your war chest ready, how do you approach the other families?",
                        options: [
                            { text: "💰 Buy loyalty — Bribe key lieutenants to switch sides (Expensive but bloodless)", effect: "money_cost", value: -500000 },
                            { text: "⚔️ Show strength — Launch raids on rival operations (Free but increases heat)", effect: "suspicion_increase", value: 15 }
                        ]
                    }
                },
                nextChapter: 2
            },
            {
                title: "The Coronation",
                description: "The final power play. One will sit on the throne. The rest will kneel — or die.",
                objectives: [
                    { type: "control_turf", target: 10, current: 0, text: "Control 10 turf zones" },
                    { type: "reach_reputation", target: 200, current: 0, text: "Reach 200 reputation" },
                    { type: "win_boss_battle", target: 3, current: 0, text: "Defeat 3 total bosses" }
                ],
                rewards: { money: 500000, experience: 5000, reputation: 50, title: "The Don" },
                dialogue: {
                    intro: "\"It's time,\" you say, standing at the window overlooking the city skyline. Below, your empire stretches to the horizon. Every light, every street, every soul — yours to command. The final meeting is tonight. Only one walks out as Don.\"",
                    success: "They kneel. Every family, every boss, every soldier. The ring is kissed, the oath is sworn. You are The Don — and from dusk to dawn, this city answers to you."
                },
                nextChapter: null
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
            payout: [300, 800],
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
            payout: [600, 1600],
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
            name: "Intimidate Ritual Business",
            description: "A competing restaurant is cutting into family profits. Make them reconsider their location.",
            payout: [1200, 3000],
            risk: "high",
            jailChance: 30,
            energyCost: 20,
            requiredItems: ["Pistol", "Bullets"],
            reputation: 25,
            factionRep: 10,
            unlocked: false,
            story: "Old-school methods for old-school problems. Sometimes business negotiations require... persuasion."
        },
        {
            id: "torrino_3",
            name: "The Consigliere's Favor",
            description: "Don Torrino's advisor needs a personal matter handled. A judge's family is being... difficult about a court case.",
            payout: [2500, 5500],
            risk: "high",
            jailChance: 35,
            energyCost: 25,
            requiredItems: ["Luxury Automobile"],
            reputation: 40,
            factionRep: 15,
            unlocked: false,
            story: "\"The judge rules tomorrow. We need him to remember who his friends are,\" the Consigliere says with a thin smile. \"Persuade the family. No blood — we're not animals.\""
        },
        {
            id: "torrino_4",
            name: "Sunday Dinner",
            description: "The Don has invited you to the family's weekly dinner. But there's a test hidden in the hospitality.",
            payout: [4000, 8000],
            risk: "medium",
            jailChance: 10,
            energyCost: 15,
            requiredItems: [],
            reputation: 60,
            factionRep: 20,
            unlocked: false,
            story: "\"You'll sit at our table. You'll eat our food. You'll answer our questions.\" The invitation is silk over steel. One wrong word and this dinner becomes your last.",
            dialogue: {
                intro: "The Torrino estate. White tablecloths, expensive wine, the smell of fresh pasta. Don Torrino sits at the head, watching you with eyes that have sentenced men to death.",
                choices: [
                    { text: "Be humble — respect the old ways", effect: "factionRep", value: 5 },
                    { text: "Be bold — show you're an equal, not a servant", effect: "reputation", value: 10 }
                ]
            }
        }
    ],
    kozlov: [
        {
            id: "kozlov_0",
            name: "Street Information",
            description: "Gather information about police patrol routes in the industrial district.",
            payout: [400, 1000],
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
            payout: [1800, 4000],
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
            payout: [5000, 10000],
            risk: "extreme",
            jailChance: 45,
            energyCost: 35,
            requiredItems: ["Private Airplane", "Tommy Gun"],
            reputation: 50,
            factionRep: 15,
            unlocked: false,
            story: "Big risks, bigger rewards. The Kozlovs trust only their most proven associates with this operation."
        },
        {
            id: "kozlov_3",
            name: "The Warehouse Job",
            description: "Raid a rival gang's weapons cache hidden in an abandoned warehouse. Take everything.",
            payout: [3000, 6500],
            risk: "very high",
            jailChance: 40,
            energyCost: 30,
            requiredItems: ["Tommy Gun", "Bulletproof Vest", "Bullets"],
            reputation: 35,
            factionRep: 12,
            unlocked: false,
            story: "\"We know where the Colombians keep their guns,\" Viktor growls, spreading a blueprint on the table. \"We go in hard, we go in fast, and we take everything that isn't bolted to the floor.\""
        },
        {
            id: "kozlov_4",
            name: "Red Winter",
            description: "The Bratva's Moscow contact has gone silent. Find out what happened — and clean up the mess.",
            payout: [7000, 14000],
            risk: "extreme",
            jailChance: 50,
            energyCost: 40,
            requiredItems: ["Private Airplane", "Bulletproof Vest"],
            reputation: 70,
            factionRep: 20,
            unlocked: false,
            story: "\"Dmitri hasn't called in three days,\" Viktor's face is stone. \"Either he's dead or he's turned. Either way, someone needs to visit Moscow.\"",
            dialogue: {
                intro: "A freezing warehouse in the industrial district. Viktor Kozlov stares at a map with red pins marking disappeared associates.",
                choices: [
                    { text: "Go in guns blazing — Bratva style", effect: "power", value: 5 },
                    { text: "Investigate quietly first — gather intel", effect: "intelligence", value: 5 }
                ]
            }
        }
    ],
    chen: [
        {
            id: "chen_0",
            name: "Digital Surveillance",
            description: "Monitor communications for suspicious activities using basic hacking tools.",
            payout: [400, 1200],
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
            payout: [1500, 3500],
            risk: "high",
            jailChance: 25,
            energyCost: 20,
            requiredItems: ["Bulletproof Vest"],
            reputation: 30,
            factionRep: 10,
            unlocked: true,
            story: "The Chen Triad values intelligence and precision. Show them you can handle sophisticated operations."
        },
        {
            id: "chen_2",
            name: "Ghost in the Machine",
            description: "Hack into the city's banking network and reroute funds through untraceable shell companies.",
            payout: [2200, 5000],
            risk: "medium",
            jailChance: 20,
            energyCost: 18,
            requiredItems: [],
            reputation: 25,
            factionRep: 8,
            unlocked: false,
            story: "\"The money never existed,\" Wei Chen says, adjusting his glasses. \"At least, that's what the banks will think. We just need someone to run the algorithm while our team handles the physical infiltration.\""
        },
        {
            id: "chen_3",
            name: "Silk Road 2.0",
            description: "Establish a dark web marketplace for the Triad's international operations. Handle the logistics.",
            payout: [4500, 9000],
            risk: "high",
            jailChance: 30,
            energyCost: 25,
            requiredItems: ["Laptop"],
            reputation: 50,
            factionRep: 15,
            unlocked: false,
            story: "The old ways of smuggling are dying. The Chen Triad sees the future: digital, borderless, invisible. They need someone to build the bridge between worlds."
        },
        {
            id: "chen_4",
            name: "The Dragon's Eye",
            description: "Steal a legendary jade artifact from a museum vault — the Triad's ancestral treasure, stolen decades ago.",
            payout: [10000, 20000],
            risk: "extreme",
            jailChance: 45,
            energyCost: 35,
            requiredItems: ["Bulletproof Vest", "Lockpicks"],
            reputation: 75,
            factionRep: 25,
            unlocked: false,
            story: "\"Our family's honor hangs in a glass case in Room 47,\" Wei says, his usual calm cracking for the first time. \"The Dragon's Eye was taken from us in 1949. It's time it came home.\"",
            dialogue: {
                intro: "Wei Chen shows you museum blueprints, security rotation schedules, and a centuries-old painting of the jade artifact. His eyes burn with rare emotion.",
                choices: [
                    { text: "Plan a stealth infiltration at night — patience and precision", effect: "stealth", value: 5 },
                    { text: "Stage a distraction during a gala — chaos is its own kind of cover", effect: "charisma", value: 5 }
                ]
            }
        }
    ],
    morales: [
        {
            id: "morales_0",
            name: "Neighborhood Watch",
            description: "Keep an eye on rival gang movements in cartel territory and report back.",
            payout: [350, 900],
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
            payout: [2000, 4500],
            risk: "very high",
            jailChance: 40,
            energyCost: 30,
            requiredItems: ["Tommy Gun", "Bullets"],
            reputation: 35,
            factionRep: 12,
            unlocked: true,
            story: "The cartel's operations must be protected at all costs. Are you ready to defend their interests?"
        },
        {
            id: "morales_2",
            name: "The Tunnel Project",
            description: "Oversee construction of a smuggling tunnel beneath the old industrial district.",
            payout: [2800, 6000],
            risk: "medium",
            jailChance: 25,
            energyCost: 20,
            requiredItems: ["Gasoline"],
            reputation: 30,
            factionRep: 10,
            unlocked: false,
            story: "\"We need a supply line the feds can't see,\" El Jefe's lieutenant explains, unrolling excavation plans. \"Three hundred meters of tunnel, reinforced, ventilated, with rail. You're overseeing construction.\""
        },
        {
            id: "morales_3",
            name: "Festival of the Dead",
            description: "During the annual street festival, the cartel moves its biggest shipment of the year. Ensure it arrives safely.",
            payout: [6500, 13000],
            risk: "extreme",
            jailChance: 50,
            energyCost: 35,
            requiredItems: ["Tommy Gun", "Bulletproof Vest", "Luxury Automobile"],
            reputation: 60,
            factionRep: 18,
            unlocked: false,
            story: "\"Día de los Muertos. The whole city celebrates while we move product worth more than this neighborhood,\" El Jefe says, lighting a cigar. \"The DEA expects us to be quiet during the festival. We won't be.\""
        },
        {
            id: "morales_4",
            name: "El Jefe's Trust",
            description: "El Jefe has a personal request — his daughter has been kidnapped by a rival cartel. Get her back alive.",
            payout: [12000, 25000],
            risk: "extreme",
            jailChance: 55,
            energyCost: 45,
            requiredItems: ["Tommy Gun", "Bulletproof Vest", "Bullets"],
            reputation: 80,
            factionRep: 30,
            unlocked: false,
            story: "El Jefe's voice cracks for the first time you've ever heard. \"They have Isabella. Bring her home, and you are family. Fail, and...\" He doesn't finish the sentence. He doesn't need to.",
            dialogue: {
                intro: "A dimly lit study. El Jefe holds a photo of a young woman, his hand trembling. Maps, phone records, and ransom notes cover his desk.",
                choices: [
                    { text: "Pay the ransom and ambush the exchange", effect: "money_cost", value: -1000000 },
                    { text: "Storm the compound — no negotiation with kidnappers", effect: "power", value: 5 }
                ]
            }
        }
    ]
};

// Turf Missions - Specific missions to expand into new turf zones
export const turfMissions = [
    {
        id: "harbor_row_expansion",
        name: "Secure the Docks",
        description: "Take control of the lucrative shipping district from rival gangs.",
        territory: "Harbor Row",
        difficulty: "medium",
        requiredGangMembers: 5,
        energyCost: 25,
        rewards: {
            money: 40000,
            territory: 1,
            reputation: 15,
            passive_income: 2500 // Per tribute collection
        },
        risks: {
            jailChance: 35,
            gangMemberLoss: 15, // Chance to lose a gang member
            healthLoss: 20
        },
        story: "The docks control all smuggling operations. Whoever controls the ports controls the city's underground economy."
    },
    {
        id: "midtown_expansion",
        name: "Downtown Takeover",
        description: "Establish dominance in the city's business district.",
        territory: "Midtown Heights",
        difficulty: "hard",
        requiredGangMembers: 8,
        energyCost: 35,
        rewards: {
            money: 80000,
            territory: 2,
            reputation: 25,
            passive_income: 5000
        },
        risks: {
            jailChance: 45,
            gangMemberLoss: 25,
            healthLoss: 30
        },
        story: "The heart of the city's economy. Control here means influence over legitimate businesses and underground operations alike."
    },
    {
        id: "old_quarter_expansion",
        name: "Suburban Influence",
        description: "Expand operations into the wealthy suburban areas.",
        territory: "Old Quarter",
        difficulty: "easy",
        requiredGangMembers: 3,
        energyCost: 15,
        rewards: {
            money: 25000,
            territory: 1,
            reputation: 10,
            passive_income: 1500
        },
        risks: {
            jailChance: 25,
            gangMemberLoss: 10,
            healthLoss: 15
        },
        story: "Rich neighborhoods mean rich targets. But suburban security is tight, and the police response is swift."
    },
    {
        id: "chinatown_expansion",
        name: "Chinatown Alliance",
        description: "Negotiate or fight your way into Chinatown's tight-knit criminal ecosystem.",
        territory: "Chinatown",
        difficulty: "hard",
        requiredGangMembers: 7,
        energyCost: 30,
        rewards: {
            money: 60000,
            territory: 2,
            reputation: 20,
            passive_income: 3500
        },
        risks: {
            jailChance: 40,
            gangMemberLoss: 20,
            healthLoss: 25
        },
        story: "Chinatown has been Chen territory for decades. To enter, you'll need an invitation — or an army."
    },
    {
        id: "the_sprawl_expansion",
        name: "Airport Corridor",
        description: "Control the smuggling routes through the international airport's cargo terminals.",
        territory: "The Sprawl",
        difficulty: "extreme",
        requiredGangMembers: 12,
        energyCost: 45,
        rewards: {
            money: 120000,
            territory: 3,
            reputation: 35,
            passive_income: 8000
        },
        risks: {
            jailChance: 55,
            gangMemberLoss: 30,
            healthLoss: 40
        },
        story: "The airport is the gateway to international operations. Control it and you control what comes in and out of this city."
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
            money: 150000,
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
        dialogue: {
            intro: "\"You think you can just walk into MY city?\" Santos snarls, gold chains glinting. A dozen armed men flank him in the abandoned warehouse.",
            victory: "Santos crashes to the ground, his empire shattering with him. His men scatter like roaches when the lights come on.",
            defeat: "Santos' men drag you out, bloody but alive. \"Tell your boss,\" Santos laughs, \"this city has a king. And it ain't him.\""
        },
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
            money: 100000,
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
        dialogue: {
            intro: "\"You should have kept paying,\" Morrison says from behind her desk, badge gleaming. \"Now I have enough evidence to bury you. Unless... we renegotiate.\"",
            victory: "The evidence burns. Morrison \"retires\" to a beach house you bought her. A new, more pliable chief takes her place.",
            defeat: "Sirens wail as Morrison's officers close in. She stands at the window, smiling. \"I told you — you can't fight City Hall.\""
        },
        unlocked: false
    },
    {
        id: "shadow_boss_phantom",
        name: "The Phantom",
        description: "A mysterious crime lord has been manipulating all the families from the shadows. Unmask and eliminate them.",
        boss: {
            name: "The Phantom",
            power: 300,
            health: 350,
            gang_size: 30,
            special_abilities: ["Shadow Network", "Double Agent", "Escape Routes"]
        },
        requirements: {
            minPower: 200,
            minGangMembers: 15,
            minReputation: 100
        },
        energyCost: 60,
        rewards: {
            money: 500000,
            reputation: 75,
            territory: 5,
            experience: 2000,
            unique_item: "The Phantom's Mask",
            title: "Ghost Killer"
        },
        risks: {
            jailChance: 75,
            gangMemberLoss: 40,
            healthLoss: 60
        },
        story: "For years, someone has been pulling strings — starting wars between families, manipulating the police, controlling judges. They call them The Phantom. No one has ever seen their face and lived.",
        dialogue: {
            intro: "A distorted voice crackles through the speaker: \"You've been entertaining, I'll give you that. But you're a pawn who thinks he's a king. Allow me to correct that misconception.\"",
            victory: "The mask falls away revealing a face you recognize — someone you trusted. The betrayal stings, but their empire is now yours. Every shadow in this city answers to you.",
            defeat: "\"Disappointing,\" the voice sighs as your vision fades. \"I expected more from someone with your reputation. Sleep now. When you wake, you'll find your empire... redistributed.\""
        },
        unlocked: false
    }
];

// Mission Progress Tracking
export const missionProgress = {
    activeCampaign: "risingThroughRanks",
    completedCampaigns: [],
    completedMissions: [],
    availableFactionMissions: {},
    unlockedTurfMissions: ["old_quarter_expansion"],
    unlockedBossBattles: [],
    factionReputation: {
        torrino: 0,
        kozlov: 0,
        chen: 0,
        morales: 0
    }
};

