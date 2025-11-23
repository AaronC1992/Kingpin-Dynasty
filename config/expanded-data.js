/**
 * expanded-data.js
 * 
 * COMPREHENSIVE DATA FOR EXPANDED SYSTEMS
 * 
 * Contains all configuration data for:
 * - Gang member roles and types
 * - Territory definitions
 * - Rival kingpin profiles
 * - Interactive event templates
 * - Legacy perk tree
 * - Collectibles catalog
 * - Respect modifier tables
 */

// ==================== 1. GANG MEMBER ROLES ====================

export const GANG_MEMBER_ROLES = {
    bruiser: {
        name: "Bruiser",
        icon: "💪",
        description: "Pure muscle. When you need someone hurt, intimidated, or broken, this is your guy. Not the sharpest tool, but the heaviest hammer.",
        baseStat: { 
            violence: 18, 
            stealth: 5, 
            intelligence: 4, 
            loyalty: 55 
        },
        perk: {
            name: "Enforcer",
            effect: "Reduces arrest chance on violent jobs by 15%. Intimidation attempts always succeed."
        },
        recruitCost: 5000,
        tributeMultiplier: 1.2
    },
    
    fixer: {
        name: "Fixer",
        icon: "🤝",
        description: "The smooth operator who knows everyone worth knowing. Can talk their way out of anything and has connections in high places.",
        baseStat: { 
            violence: 6, 
            stealth: 12, 
            intelligence: 17, 
            loyalty: 65 
        },
        perk: {
            name: "Connected",
            effect: "Reduces heat gain by 20%. Unlocks special dialogue options in events."
        },
        recruitCost: 8000,
        tributeMultiplier: 1.5
    },
    
    hacker: {
        name: "Hacker",
        icon: "💻",
        description: "Digital ghost who can crack any system. Perfect for high-tech heists and covering your digital tracks.",
        baseStat: { 
            violence: 3, 
            stealth: 16, 
            intelligence: 22, 
            loyalty: 50 
        },
        perk: {
            name: "Digital Ghost",
            effect: "+25% success on intelligence-based jobs. Can disable security systems."
        },
        recruitCost: 10000,
        tributeMultiplier: 1.8
    },
    
    enforcer: {
        name: "Enforcer",
        icon: "🔫",
        description: "Professional killer. Cold, efficient, and utterly ruthless. Handles the wet work without asking questions.",
        baseStat: { 
            violence: 20, 
            stealth: 14, 
            intelligence: 8, 
            loyalty: 40 
        },
        perk: {
            name: "Assassin",
            effect: "+20% damage in territory wars. Guaranteed kills on hit contracts."
        },
        recruitCost: 12000,
        tributeMultiplier: 2.0
    },
    
    wheelman: {
        name: "Wheelman",
        icon: "🚗",
        description: "Master driver who can outrun anyone. Perfect for getaways, smuggling runs, and high-speed chases.",
        baseStat: { 
            violence: 8, 
            stealth: 16, 
            intelligence: 11, 
            loyalty: 70 
        },
        perk: {
            name: "Fast & Furious",
            effect: "+30% escape chance when heat is high. Vehicle jobs have bonus success."
        },
        recruitCost: 7000,
        tributeMultiplier: 1.3
    },
    
    scout: {
        name: "Scout",
        icon: "👁️",
        description: "Expert observer who knows how to stay invisible. Gathers intelligence and watches your enemies.",
        baseStat: { 
            violence: 6, 
            stealth: 20, 
            intelligence: 16, 
            loyalty: 75 
        },
        perk: {
            name: "Eyes Everywhere",
            effect: "Reveals territory attack warnings 60 seconds early. +15% ambush detection."
        },
        recruitCost: 6000,
        tributeMultiplier: 1.2
    },
    
    accountant: {
        name: "Accountant",
        icon: "📊",
        description: "Numbers wizard who can make money appear and disappear. Expert at laundering and maximizing profits.",
        baseStat: { 
            violence: 2, 
            stealth: 10, 
            intelligence: 24, 
            loyalty: 80 
        },
        perk: {
            name: "Money Launderer",
            effect: "+15% income from all sources. Money laundering is 25% faster with 10% less loss."
        },
        recruitCost: 15000,
        tributeMultiplier: 2.5
    },
    
    consigliere: {
        name: "Consigliere",
        icon: "🎩",
        description: "Your trusted advisor. Wise, experienced, and loyal to the end. Provides strategic guidance and counsel.",
        baseStat: { 
            violence: 10, 
            stealth: 14, 
            intelligence: 20, 
            loyalty: 95 
        },
        perk: {
            name: "Strategic Mind",
            effect: "+10% success to all jobs. Gang loyalty decays 50% slower."
        },
        recruitCost: 20000,
        tributeMultiplier: 3.0
    },
    
    smuggler: {
        name: "Smuggler",
        icon: "📦",
        description: "Knows every border crossing, port, and hidden route. Moves goods where they need to go, no questions asked.",
        baseStat: { 
            violence: 9, 
            stealth: 18, 
            intelligence: 15, 
            loyalty: 60 
        },
        perk: {
            name: "Border Runner",
            effect: "+20% profits from smuggling jobs. Can access black market goods 20% cheaper."
        },
        recruitCost: 9000,
        tributeMultiplier: 1.6
    },
    
    medic: {
        name: "Street Medic",
        icon: "⚕️",
        description: "Patched up more gunshot wounds than any ER doc. Keeps your crew alive when things go south.",
        baseStat: { 
            violence: 4, 
            stealth: 8, 
            intelligence: 19, 
            loyalty: 85 
        },
        perk: {
            name: "Combat Medic",
            effect: "Injured gang members recover 50% faster. +20% crew survival in failed jobs."
        },
        recruitCost: 11000,
        tributeMultiplier: 1.7
    },
    
    safecracker: {
        name: "Safecracker",
        icon: "🔓",
        description: "Can open anything with a lock. Old-school master of the trade with steady hands and patience.",
        baseStat: { 
            violence: 5, 
            stealth: 17, 
            intelligence: 18, 
            loyalty: 65 
        },
        perk: {
            name: "Master Cracker",
            effect: "+25% success on heist jobs. Vault jobs yield 30% more cash."
        },
        recruitCost: 8500,
        tributeMultiplier: 1.5
    },
    
    forger: {
        name: "Forger",
        icon: "✍️",
        description: "Artist of deception. Can create flawless documents, IDs, and certificates. The pen is mightier than the sword.",
        baseStat: { 
            violence: 3, 
            stealth: 12, 
            intelligence: 21, 
            loyalty: 70 
        },
        perk: {
            name: "Master Forger",
            effect: "Reduces police evidence by 25%. Can create fake identities for $5,000."
        },
        recruitCost: 9500,
        tributeMultiplier: 1.6
    }
};

// ==================== 2. TERRITORIES ====================

export const TERRITORIES = {
    downtown_district: {
        id: "downtown_district",
        name: "Downtown Financial District",
        description: "Heart of the city's banking and commerce. High-value targets but heavy security and police presence.",
        baseIncome: 8000,
        defenseRequired: 250,
        riskLevel: "very high",
        heatMultiplier: 1.5,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 15000,
        claimCost: 50000,
        specialFeatures: ["Bank Heists Available", "Stock Market Access", "Corporate Blackmail"],
        factionInfluence: {
            torrino: 30,
            kozlov: 10,
            chen: 40,
            morales: 20
        }
    },
    
    docks: {
        id: "docks",
        name: "The Docks & Waterfront",
        description: "Perfect for smuggling operations. Control here means control over what comes in and out of the city by sea.",
        baseIncome: 6000,
        defenseRequired: 180,
        riskLevel: "high",
        heatMultiplier: 1.2,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 12000,
        claimCost: 35000,
        specialFeatures: ["Smuggling Routes", "Cargo Theft", "Union Control"],
        factionInfluence: {
            torrino: 20,
            kozlov: 50,
            chen: 15,
            morales: 15
        }
    },
    
    suburbs: {
        id: "suburbs",
        name: "Suburban Neighborhoods",
        description: "Safe, quiet streets with steady income from protection rackets. Low risk but lower rewards.",
        baseIncome: 3000,
        defenseRequired: 100,
        riskLevel: "low",
        heatMultiplier: 0.8,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 8000,
        claimCost: 15000,
        specialFeatures: ["Protection Rackets", "Drug Distribution", "Loan Sharking"],
        factionInfluence: {
            torrino: 40,
            kozlov: 10,
            chen: 10,
            morales: 40
        }
    },
    
    industrial_zone: {
        id: "industrial_zone",
        name: "Industrial Manufacturing Zone",
        description: "Warehouses, factories, and chop shops. Perfect for stolen goods and illegal manufacturing.",
        baseIncome: 5500,
        defenseRequired: 160,
        riskLevel: "medium",
        heatMultiplier: 1.0,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 10000,
        claimCost: 28000,
        specialFeatures: ["Chop Shops", "Counterfeit Operations", "Weapons Manufacturing"],
        factionInfluence: {
            torrino: 25,
            kozlov: 25,
            chen: 25,
            morales: 25
        }
    },
    
    casino_district: {
        id: "casino_district",
        name: "Casino & Entertainment District",
        description: "Where high rollers lose fortunes. Control means access to gambling, prostitution, and money laundering.",
        baseIncome: 10000,
        defenseRequired: 300,
        riskLevel: "very high",
        heatMultiplier: 1.4,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 20000,
        claimCost: 60000,
        specialFeatures: ["High Stakes Gambling", "Underground Casino", "VIP Money Laundering"],
        factionInfluence: {
            torrino: 30,
            kozlov: 20,
            chen: 35,
            morales: 15
        }
    },
    
    chinatown: {
        id: "chinatown",
        name: "Chinatown",
        description: "Tight-knit community with its own rules. Chen Triad's home turf. Taking it won't be easy.",
        baseIncome: 4500,
        defenseRequired: 200,
        riskLevel: "high",
        heatMultiplier: 1.1,
        controlledBy: "chen",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 3,
        fortificationCost: 11000,
        claimCost: 32000,
        specialFeatures: ["Heroin Trade", "Exotic Import/Export", "Underground Gambling Dens"],
        factionInfluence: {
            torrino: 5,
            kozlov: 10,
            chen: 75,
            morales: 10
        }
    },
    
    little_italy: {
        id: "little_italy",
        name: "Little Italy",
        description: "Old-school mob territory. The Torrino family's ancestral stronghold. Expect fierce resistance.",
        baseIncome: 5000,
        defenseRequired: 220,
        riskLevel: "high",
        heatMultiplier: 1.0,
        controlledBy: "torrino",
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 4,
        fortificationCost: 11000,
        claimCost: 35000,
        specialFeatures: ["Traditional Rackets", "Political Connections", "Restaurant Fronts"],
        factionInfluence: {
            torrino: 80,
            kozlov: 5,
            chen: 5,
            morales: 10
        }
    },
    
    red_light_district: {
        id: "red_light_district",
        name: "Red Light District",
        description: "Vice, sin, and everything illegal. Prostitution, drugs, and dirty money flow freely here.",
        baseIncome: 7000,
        defenseRequired: 190,
        riskLevel: "high",
        heatMultiplier: 1.3,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 13000,
        claimCost: 40000,
        specialFeatures: ["Prostitution Rings", "Drug Dealing", "Strip Clubs"],
        factionInfluence: {
            torrino: 20,
            kozlov: 30,
            chen: 20,
            morales: 30
        }
    },
    
    university_district: {
        id: "university_district",
        name: "University District",
        description: "Young, wealthy students with more money than sense. Perfect for dealing drugs and running scams.",
        baseIncome: 4000,
        defenseRequired: 120,
        riskLevel: "medium",
        heatMultiplier: 0.9,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 9000,
        claimCost: 22000,
        specialFeatures: ["Drug Distribution", "Identity Theft", "Party Supply Routes"],
        factionInfluence: {
            torrino: 15,
            kozlov: 20,
            chen: 15,
            morales: 50
        }
    },
    
    airport: {
        id: "airport",
        name: "International Airport",
        description: "Control the skies. Perfect for smuggling, human trafficking, and moving goods internationally.",
        baseIncome: 9000,
        defenseRequired: 280,
        riskLevel: "very high",
        heatMultiplier: 1.6,
        controlledBy: null,
        defendingMembers: [],
        lastAttacked: 0,
        fortificationLevel: 0,
        fortificationCost: 18000,
        claimCost: 55000,
        specialFeatures: ["International Smuggling", "Customs Control", "Private Flights"],
        factionInfluence: {
            torrino: 20,
            kozlov: 30,
            chen: 25,
            morales: 25
        }
    }
};

// ==================== 3. RIVAL KINGPINS ====================

export const RIVAL_KINGPINS = {
    vittorio_torrino: {
        id: "vittorio_torrino",
        name: "Don Vittorio Torrino",
        title: "The Old Lion",
        faction: "torrino",
        personality: "traditional",
        description: "Old-school Mafia don who believes in honor, tradition, and famiglia. Slow to anger but unforgiving once crossed.",
        portrait: "👴",
        
        startingStats: {
            territories: ["little_italy"],
            gangSize: 12,
            powerRating: 180,
            wealth: 75000,
            respect: 60
        },
        
        aggressiveness: 0.5,
        expansion: 0.4,
        diplomacy: 0.7,
        
        growthStyle: {
            preferredTargets: ["suburbs", "downtown_district"],
            recruitmentRate: "slow",
            incomePreference: "protection_rackets",
            attackPattern: "defensive"
        },
        
        specialAbility: {
            name: "Old School Tactics",
            effect: "+15% defense in controlled territories. Gang loyalty never drops below 50%."
        },
        
        dialogue: {
            greeting: "Ah, {player}. You show respect by coming here. Perhaps there's hope for you yet.",
            hostile: "You dare challenge the Torrino family? We've buried better men than you.",
            allied: "You've proven yourself, {player}. The family remembers its friends.",
            betrayed: "You spit on our friendship. This insult will be answered in blood."
        }
    },
    
    yuri_kozlov: {
        id: "yuri_kozlov",
        name: "Yuri Kozlov",
        title: "The Butcher",
        faction: "kozlov",
        personality: "ruthless",
        description: "Former KGB operative turned crime lord. Brutal, efficient, and utterly without mercy. Fear is his favorite weapon.",
        portrait: "🧔",
        
        startingStats: {
            territories: ["docks"],
            gangSize: 15,
            powerRating: 220,
            wealth: 60000,
            respect: 40
        },
        
        aggressiveness: 0.85,
        expansion: 0.8,
        diplomacy: 0.2,
        
        growthStyle: {
            preferredTargets: ["industrial_zone", "airport"],
            recruitmentRate: "fast",
            incomePreference: "smuggling",
            attackPattern: "aggressive_expansion"
        },
        
        specialAbility: {
            name: "Brutal Efficiency",
            effect: "+20% attack power. Territory attacks cost 25% less. Enemies fear his reputation."
        },
        
        dialogue: {
            greeting: "What do you want? Speak quickly or leave.",
            hostile: "I will crush you like bug. Your empire will be ash.",
            allied: "You are useful. For now. Do not disappoint me.",
            betrayed: "You make grave mistake. I will make you example for others."
        }
    },
    
    chen_wei: {
        id: "chen_wei",
        name: "Chen Wei",
        title: "The Dragon",
        faction: "chen",
        personality: "strategic",
        description: "Brilliant strategist and master of the long game. Controls vast underground networks. Patient, cunning, and always three steps ahead.",
        portrait: "🧑‍💼",
        
        startingStats: {
            territories: ["chinatown", "casino_district"],
            gangSize: 10,
            powerRating: 160,
            wealth: 120000,
            respect: 75
        },
        
        aggressiveness: 0.4,
        expansion: 0.6,
        diplomacy: 0.8,
        
        growthStyle: {
            preferredTargets: ["downtown_district", "casino_district"],
            recruitmentRate: "moderate",
            incomePreference: "gambling_and_drugs",
            attackPattern: "calculated_strikes"
        },
        
        specialAbility: {
            name: "Financial Genius",
            effect: "+30% income from all sources. Can see rival kingpin plans 24 hours in advance."
        },
        
        dialogue: {
            greeting: "Welcome, {player}. A wise person knows when to listen and when to speak.",
            hostile: "You play a dangerous game. The Dragon does not forget insults.",
            allied: "You have wisdom beyond your years. Together, we can prosper.",
            betrayed: "Your betrayal was... unexpected. A mistake you will not live to repeat."
        }
    },
    
    isabella_morales: {
        id: "isabella_morales",
        name: "Isabella Morales",
        title: "La Reina",
        faction: "morales",
        personality: "ambitious",
        description: "Rising star of the cartel world. Young, ruthless, and hungry for power. Building an empire from the ground up.",
        portrait: "👸",
        
        startingStats: {
            territories: ["university_district", "red_light_district"],
            gangSize: 13,
            powerRating: 170,
            wealth: 50000,
            respect: 45
        },
        
        aggressiveness: 0.7,
        expansion: 0.9,
        diplomacy: 0.5,
        
        growthStyle: {
            preferredTargets: ["suburbs", "university_district", "airport"],
            recruitmentRate: "very_fast",
            incomePreference: "drug_trade",
            attackPattern: "rapid_expansion"
        },
        
        specialAbility: {
            name: "Network Expansion",
            effect: "Recruits gang members 50% cheaper. Territories generate 20% more income."
        },
        
        dialogue: {
            greeting: "Ah, {player}. You have ambition. I can respect that.",
            hostile: "You stand in my way. That's unfortunate... for you.",
            allied: "We can help each other rise. Don't make me regret this trust.",
            betrayed: "You chose poorly. I'll enjoy watching you fall."
        }
    },
    
    marcus_kane: {
        id: "marcus_kane",
        name: "Marcus 'The Jackal' Kane",
        title: "The Jackal",
        faction: "independent",
        personality: "opportunistic",
        description: "Unpredictable wildcard who plays all sides. No loyalty, no honor, just profit. Strikes when you least expect it.",
        portrait: "😈",
        
        startingStats: {
            territories: [],
            gangSize: 8,
            powerRating: 130,
            wealth: 40000,
            respect: 20
        },
        
        aggressiveness: 0.95,
        expansion: 0.7,
        diplomacy: 0.3,
        
        growthStyle: {
            preferredTargets: ["any_weak_territory"],
            recruitmentRate: "opportunistic",
            incomePreference: "theft_and_raids",
            attackPattern: "guerrilla_warfare"
        },
        
        specialAbility: {
            name: "Guerrilla Warfare",
            effect: "Surprise attacks deal double damage. Can attack same territory twice in 24 hours."
        },
        
        dialogue: {
            greeting: "Well, well... {player}. Looking for trouble, or profit?",
            hostile: "Nothing personal, just business. Your business is about to be mine.",
            allied: "Partners... for now. Just remember, loyalty has a price.",
            betrayed: "Hah! You think you betrayed ME? I was three steps ahead, friend."
        }
    }
};

// ==================== 4. INTERACTIVE EVENTS ====================

export const INTERACTIVE_EVENTS = [
    {
        id: "police_raid_warehouse",
        title: "🚨 POLICE RAID: Warehouse Bust",
        category: "law_enforcement",
        description: "The cops just kicked in the door of your main warehouse! They've got a warrant and they're tearing the place apart looking for evidence. Your crew is scrambling.",
        rarity: "common",
        
        choices: [
            {
                text: "🔫 Fight them off (Violent Response)",
                requirements: { gangMembers: 5, violence: 12 },
                successChance: 0.55,
                outcomes: {
                    success: {
                        money: 0,
                        heat: 35,
                        respect: 20,
                        loyalty: 15,
                        message: "Your crew fought like demons. The cops retreated under heavy fire, but they'll be back with SWAT teams. The streets are talking about your crew's boldness."
                    },
                    failure: {
                        money: -8000,
                        heat: 65,
                        respect: -15,
                        loyalty: -20,
                        jailChance: 45,
                        gangMemberLoss: 2,
                        message: "The shootout went badly. Multiple crew members are in cuffs, evidence was seized, and the feds are building a RICO case. This is bad."
                    }
                }
            },
            {
                text: "💰 Bribe the lead detective ($15,000)",
                requirements: { money: 15000, intelligence: 10 },
                successChance: 0.80,
                outcomes: {
                    success: {
                        money: -15000,
                        heat: -25,
                        respect: 10,
                        message: "You pull the detective aside and have a 'conversation.' Money changes hands, evidence mysteriously disappears, and the warrant gets 'lost in paperwork.' Crisis averted."
                    },
                    failure: {
                        money: -15000,
                        heat: 80,
                        respect: -25,
                        jailChance: 60,
                        message: "The detective was wearing a wire. You just bribed a fed on tape. The DA is salivating. Your lawyer is already calling this 'the worst case scenario.'"
                    }
                }
            },
            {
                text: "🙏 Cooperate and take the hit",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        money: -5000,
                        heat: 15,
                        respect: -10,
                        message: "You let them search. They confiscate some cash and product, but find nothing major. A slap on the wrist compared to what could have happened. Sometimes you gotta take the L."
                    }
                }
            },
            {
                text: "🔥 Burn the evidence (Destroy warehouse)",
                requirements: { money: 10000, intelligence: 8 },
                successChance: 0.70,
                outcomes: {
                    success: {
                        money: -10000,
                        heat: 20,
                        respect: 15,
                        message: "You torch the place before they can secure it. The evidence goes up in smoke along with your warehouse. Cops are pissed but they've got nothing. Insurance will cover it... mostly."
                    },
                    failure: {
                        money: -10000,
                        heat: 50,
                        respect: -15,
                        gangMemberLoss: 1,
                        message: "The fire spread too fast. One of your crew didn't make it out. The cops still found enough evidence in the ashes, and now you're wanted for arson and manslaughter."
                    }
                }
            }
        ]
    },
    
    {
        id: "betrayal_rumor",
        title: "🐍 Whispers of Betrayal",
        category: "loyalty",
        description: "Word on the street is that someone in your crew is talking to the feds. Your consigliere hands you a list of three names. One of them is a rat.",
        rarity: "common",
        
        choices: [
            {
                text: "🔍 Investigate quietly (Intelligence check)",
                requirements: { intelligence: 18 },
                successChance: 0.75,
                outcomes: {
                    success: {
                        message: "You tap phones, follow leads, and check bank accounts. Three days later, you find the rat. They're dealt with... permanently. The crew respects your thoroughness.",
                        respect: 15,
                        loyalty: 20,
                        gangMemberLoss: 1,
                        heat: 10
                    },
                    failure: {
                        message: "Your investigation turns up nothing concrete. Either you missed something, or the informant is better than you thought. The paranoia spreads through your crew.",
                        loyalty: -15,
                        respect: -5
                    }
                }
            },
            {
                text: "❓ Ignore the rumors (Risk it)",
                requirements: {},
                successChance: 0.40,
                outcomes: {
                    success: {
                        message: "Turns out it was just paranoia. No rat, just rumors. Your crew appreciates that you trusted them instead of going on a witch hunt.",
                        loyalty: 15,
                        respect: 5
                    },
                    failure: {
                        message: "Big mistake. The rat was real and just handed the feds a detailed map of your entire operation. Multiple indictments are coming down. Your empire is burning.",
                        heat: 60,
                        respect: -25,
                        loyalty: -30,
                        gangMemberLoss: 3,
                        money: -20000
                    }
                }
            },
            {
                text: "💀 Make an example (Kill a random suspect)",
                requirements: { gangMembers: 3 },
                successChance: 1.0,
                outcomes: {
                    success: {
                        message: "You pick one of the three names and have them whacked in front of the whole crew. Message received: nobody talks. The remaining crew is terrified... but obedient.",
                        respect: 20,
                        loyalty: -35,
                        heat: 25,
                        gangMemberLoss: 1,
                        factionRespect: { target: "all", change: -10 }
                    }
                }
            },
            {
                text: "💰 Buy loyalty (Pay everyone $5,000 bonus)",
                requirements: { money: 50000 },
                successChance: 0.85,
                outcomes: {
                    success: {
                        money: -50000,
                        loyalty: 25,
                        message: "You call a meeting and hand out envelopes of cash. 'This is what loyalty looks like,' you say. The crew eats it up. If there was a rat, the money might have bought their silence."
                    },
                    failure: {
                        money: -50000,
                        loyalty: -10,
                        message: "The money doesn't help. The rat takes the bonus and still sings to the feds. You just paid someone to betray you. Brutal."
                    }
                }
            }
        ]
    },
    
    {
        id: "rival_scandal",
        title: "📰 Rival Boss Caught in Scandal",
        category: "opportunity",
        description: "A rival crime boss just got caught in a very public, very embarrassing scandal. Photos, witnesses, the works. The tabloids are having a field day. This is your chance to capitalize.",
        rarity: "uncommon",
        
        choices: [
            {
                text: "💀 Blackmail them ($25,000 payout)",
                requirements: { intelligence: 15 },
                successChance: 0.70,
                outcomes: {
                    success: {
                        money: 25000,
                        respect: 10,
                        factionRespect: { target: "random_rival", change: -30 },
                        message: "You make the call. They pay up to keep the worst details quiet. It's good money, but you've made an enemy. Watch your back."
                    },
                    failure: {
                        respect: -15,
                        factionRespect: { target: "random_rival", change: -50 },
                        heat: 20,
                        message: "They call your bluff and leak everything to the press anyway. Now they're humiliated AND gunning for you. Congratulations, you played yourself."
                    }
                }
            },
            {
                text: "🤝 Help them cover it up ($10,000 cost)",
                requirements: { money: 10000 },
                successChance: 0.90,
                outcomes: {
                    success: {
                        money: -10000,
                        factionRespect: { target: "random_rival", change: 50 },
                        message: "You help them bury the scandal. Witnesses disappear, evidence gets lost, and the story dies. They won't forget this favor. You've got a powerful friend."
                    }
                }
            },
            {
                text: "📢 Leak everything to the press",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        respect: 15,
                        factionRespect: { target: "random_rival", change: -60 },
                        territoryVulnerable: "rival_territory",
                        message: "You dump everything you have to every news outlet. The scandal explodes. Their reputation is destroyed, their empire is in chaos, and their territories are vulnerable. Time to move in."
                    }
                }
            },
            {
                text: "🤐 Stay out of it (Do nothing)",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        message: "Not your circus, not your monkeys. You stay out of it and let the scandal play out naturally. Sometimes the smart move is no move at all."
                    }
                }
            }
        ]
    },
    
    {
        id: "arms_deal",
        title: "🔫 Black Market Arms Deal",
        category: "opportunity",
        description: "A Serbian arms dealer has a container ship full of military-grade hardware sitting in the harbor. Assault rifles, grenades, body armor – the works. He's looking for buyers. First come, first served.",
        rarity: "rare",
        
        choices: [
            {
                text: "💰 Buy the entire shipment ($40,000)",
                requirements: { money: 40000 },
                successChance: 1.0,
                outcomes: {
                    success: {
                        money: -40000,
                        power: 75,
                        inventory: ["Military Rifles (×20)", "Body Armor (×15)", "Grenades (×30)", "Night Vision Goggles"],
                        message: "You buy everything. Your crew is now the best-armed gang in the city. Territory wars just got a lot easier. Rivals better think twice before crossing you."
                    }
                }
            },
            {
                text: "🏴‍☠️ Hijack the shipment (Violent)",
                requirements: { gangMembers: 6, violence: 18 },
                successChance: 0.60,
                outcomes: {
                    success: {
                        power: 75,
                        heat: 45,
                        respect: 25,
                        inventory: ["Military Rifles (×20)", "Body Armor (×15)", "Grenades (×30)", "Night Vision Goggles"],
                        message: "You ambush the deal and take everything by force. The Serbian escapes, swearing revenge in three languages, but you've got the guns. Your reputation as a bold operator spreads."
                    },
                    failure: {
                        health: -40,
                        heat: 30,
                        gangMemberLoss: 3,
                        money: -10000,
                        message: "The ambush turns into a massacre. The Serbs were expecting trouble and came prepared. Multiple crew members are down, and you barely escape with your life. Costly mistake."
                    }
                }
            },
            {
                text: "🤝 Split the deal with a rival ($20,000 each)",
                requirements: { money: 20000, intelligence: 12 },
                successChance: 0.85,
                outcomes: {
                    success: {
                        money: -20000,
                        power: 35,
                        factionRespect: { target: "chosen_rival", change: 30 },
                        inventory: ["Military Rifles (×10)", "Body Armor (×8)", "Grenades (×15)"],
                        message: "You broker a deal to split the shipment with a rival boss. Both crews get armed, and you've built a valuable alliance. Sometimes sharing is smarter than fighting."
                    },
                    failure: {
                        money: -20000,
                        heat: 25,
                        factionRespect: { target: "chosen_rival", change: -40 },
                        message: "The rival takes the guns and runs, leaving you with nothing. They got armed for half price while you got played. Trust is expensive."
                    }
                }
            },
            {
                text: "🚨 Tip off the cops (Anonymous call)",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        heat: -15,
                        factionRespect: { target: "police", change: 20 },
                        message: "You make an anonymous call. The cops raid the deal and seize everything. The Serbian and whoever showed up to buy are all arrested. You stay clean and earn some goodwill with the law."
                    }
                }
            }
        ]
    },
    
    {
        id: "witness_elimination",
        title: "👁️ The Witness Problem",
        category: "crisis",
        description: "A civilian witnessed your crew during that last heist. They're cooperating with the DA and set to testify in 72 hours. If they talk, multiple crew members go away for 10-20 years. The clock is ticking.",
        rarity: "uncommon",
        
        choices: [
            {
                text: "💀 Send a hitter (Assassinate)",
                requirements: { gangMembers: 1, violence: 15 },
                successChance: 0.65,
                outcomes: {
                    success: {
                        heat: 35,
                        respect: 15,
                        loyalty: 10,
                        message: "The witness has a tragic 'accident.' The case falls apart without their testimony. Your crew walks. The message is clear: don't talk."
                    },
                    failure: {
                        heat: 75,
                        respect: -20,
                        jailChance: 40,
                        gangMemberLoss: 1,
                        message: "The hit goes sideways. The hitter gets arrested at the scene, the witness survives, and now you're facing a murder charge on top of everything else. This is a disaster."
                    }
                }
            },
            {
                text: "😨 Intimidate them ($8,000 + threats)",
                requirements: { money: 8000, violence: 10 },
                successChance: 0.75,
                outcomes: {
                    success: {
                        money: -8000,
                        heat: 15,
                        message: "You send some guys to 'explain the situation.' Photos of their family, their home, their daily route. The witness suddenly develops amnesia. No testimony, no case."
                    },
                    failure: {
                        money: -8000,
                        heat: 55,
                        respect: -15,
                        message: "They report the intimidation to the feds. Now you've got witness tampering charges AND the original case. Plus the witness gets protection. Brilliant move."
                    }
                }
            },
            {
                text: "💰 Relocate them ($35,000 buyout)",
                requirements: { money: 35000 },
                successChance: 0.95,
                outcomes: {
                    success: {
                        money: -35000,
                        heat: -10,
                        message: "You offer them enough cash to disappear and start over somewhere else. New name, new life, no testimony. They take the money and vanish. Problem solved cleanly."
                    }
                }
            },
            {
                text: "⚖️ Let your lawyer handle it (Legal approach)",
                requirements: { money: 20000, intelligence: 14 },
                successChance: 0.60,
                outcomes: {
                    success: {
                        money: -20000,
                        heat: -5,
                        message: "Your lawyer tears the witness apart in depositions. Credibility destroyed, testimony thrown out, case dismissed. The legal system works... if you can afford it."
                    },
                    failure: {
                        money: -20000,
                        jailChance: 30,
                        gangMemberLoss: 2,
                        message: "The witness holds up under cross-examination. Your crew gets convicted. Sometimes the law actually works against you."
                    }
                }
            }
        ]
    },
    
    {
        id: "shipment_opportunity",
        title: "📦 High-Value Shipment",
        category: "opportunity",
        description: "Your inside man at the port just tipped you off: there's a container coming through tomorrow worth $100,000. Problem is, it belongs to a major crime family and they'll know if it goes missing.",
        rarity: "uncommon",
        
        choices: [
            {
                text: "🏴‍☠️ Steal it (High risk, high reward)",
                requirements: { gangMembers: 5, stealth: 15 },
                successChance: 0.50,
                outcomes: {
                    success: {
                        money: 100000,
                        heat: 40,
                        respect: 30,
                        factionRespect: { target: "shipment_owner", change: -70 },
                        message: "Your crew pulls off the heist perfectly. The container vanishes without a trace. You've got $100K in goods, but you've made a powerful enemy. They WILL retaliate."
                    },
                    failure: {
                        heat: 60,
                        gangMemberLoss: 2,
                        factionRespect: { target: "shipment_owner", change: -90 },
                        message: "It was a setup. The container was bait. Your crew walks into an ambush. Multiple casualties, and now you're at war with a major crime family."
                    }
                }
            },
            {
                text: "🤝 Negotiate a cut (Diplomacy)",
                requirements: { intelligence: 16 },
                successChance: 0.70,
                outcomes: {
                    success: {
                        money: 30000,
                        factionRespect: { target: "shipment_owner", change: 20 },
                        message: "You approach them respectfully and offer to 'help with security' in exchange for a cut. They appreciate the honesty and give you 30%. Everyone wins."
                    },
                    failure: {
                        factionRespect: { target: "shipment_owner", change: -30 },
                        message: "They're offended you even asked. 'You want a cut of OUR shipment?' Relations are strained now. Should've kept your mouth shut."
                    }
                }
            },
            {
                text: "🚨 Alert the owners (Build goodwill)",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        factionRespect: { target: "shipment_owner", change: 50 },
                        money: 10000,
                        message: "You tip them off that someone's planning to hit their shipment. They beef up security and catch the would-be thieves. In gratitude, they send you $10K and an offer of future cooperation."
                    }
                }
            },
            {
                text: "🤐 Stay out of it (Safe choice)",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        message: "Not worth the risk. You let the shipment pass unmolested. Sometimes the smart play is no play at all."
                    }
                }
            }
        ]
    },
    
    {
        id: "turf_war_provocation",
        title: "⚔️ Rival Gang Provocation",
        category: "conflict",
        description: "A rival gang just jumped two of your guys in broad daylight. One's in the hospital, the other's in the morgue. The whole city's watching to see how you respond. Show weakness now and you're finished.",
        rarity: "common",
        
        choices: [
            {
                text: "💀 Retaliate immediately (All-out war)",
                requirements: { gangMembers: 8, violence: 16 },
                successChance: 0.65,
                outcomes: {
                    success: {
                        respect: 40,
                        heat: 50,
                        loyalty: 20,
                        factionRespect: { target: "attacker", change: -80 },
                        gangMemberLoss: 2,
                        message: "You hit back hard and fast. Within 24 hours, three of theirs are dead and their safehouse is ashes. The streets know: you don't fuck with your crew. War has begun."
                    },
                    failure: {
                        respect: -30,
                        heat: 60,
                        loyalty: -25,
                        gangMemberLoss: 5,
                        money: -30000,
                        message: "Your retaliation fails spectacularly. More of your crew ends up dead or arrested. You look weak and your empire is bleeding. This could be the beginning of the end."
                    }
                }
            },
            {
                text: "🤝 Demand a sit-down (Negotiate)",
                requirements: { intelligence: 14, respect: 30 },
                successChance: 0.70,
                outcomes: {
                    success: {
                        money: 50000,
                        factionRespect: { target: "attacker", change: 10 },
                        message: "You arrange a meeting. They pay blood money for your dead soldier and agree to boundaries. It's not satisfying, but it prevents a costly war. Pragmatism over pride."
                    },
                    failure: {
                        respect: -25,
                        message: "They refuse to meet or pay. Your attempt to negotiate makes you look weak. The streets are saying you're soft. Your reputation takes a hit."
                    }
                }
            },
            {
                text: "💰 Hire professional hitters ($25,000)",
                requirements: { money: 25000 },
                successChance: 0.85,
                outcomes: {
                    success: {
                        money: -25000,
                        respect: 20,
                        heat: 25,
                        factionRespect: { target: "attacker", change: -50 },
                        message: "You hire professionals. Clean, quiet, efficient. The rival boss and his top lieutenant are found floating in the river. Message sent, hands clean."
                    },
                    failure: {
                        money: -25000,
                        heat: 40,
                        message: "The hitters botch the job and get caught. Turns out they were undercover ATF agents running a sting. You just tried to hire federal agents to commit murder. Outstanding."
                    }
                }
            },
            {
                text: "😔 Let it go (Show restraint)",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        respect: -40,
                        loyalty: -30,
                        message: "You do nothing. Your crew is furious. They think you're weak. Rivals smell blood. This decision might cost you everything in the long run. Was peace worth it?"
                    }
                }
            }
        ]
    },
    
    {
        id: "corrupt_cop_offer",
        title: "👮 Corrupt Cop on the Take",
        category: "opportunity",
        description: "A detective from the Major Crimes unit approaches you with an offer. He can feed you intel on investigations, warn you about raids, and lose evidence... for the right price.",
        rarity: "rare",
        
        choices: [
            {
                text: "💰 Put him on the payroll ($10,000/month)",
                requirements: { money: 10000 },
                successChance: 0.75,
                outcomes: {
                    success: {
                        money: -10000,
                        heat: -20,
                        specialAbility: "corrupt_cop_monthly",
                        message: "You've got a dirty cop in your pocket. Every month he'll cost you $10K, but he'll warn you about raids, tip you off to investigations, and make evidence disappear. Worth every penny."
                    },
                    failure: {
                        money: -10000,
                        heat: 80,
                        jailChance: 50,
                        message: "It was a sting operation. That 'corrupt cop' was Internal Affairs. You're caught on tape offering a bribe to a police officer. The DA just got an early Christmas present."
                    }
                }
            },
            {
                text: "🎥 Record him and use as blackmail",
                requirements: { intelligence: 18 },
                successChance: 0.80,
                outcomes: {
                    success: {
                        heat: -30,
                        specialAbility: "cop_blackmailed",
                        message: "You record the whole conversation. Now you own him. He'll do what you want for free, because the alternative is losing his pension and going to prison. Smart play."
                    },
                    failure: {
                        heat: 40,
                        message: "He finds the recording device. Now he's gunning for you, and you've made an enemy with a badge. Every traffic stop becomes a shakedown. Every investigation gets your name attached."
                    }
                }
            },
            {
                text: "🚨 Report him to Internal Affairs",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        heat: -25,
                        factionRespect: { target: "police", change: 30 },
                        message: "You report him. He gets arrested and you earn goodwill with the honest cops (the few that exist). They might look the other way on smaller stuff now. Playing the long game."
                    }
                }
            },
            {
                text: "❌ Decline and walk away",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        message: "You politely decline. Maybe he's legit, maybe it's a trap. Either way, you're not risking it. He walks away disappointed but you sleep better at night."
                    }
                }
            }
        ]
    },
    
    {
        id: "family_emergency",
        title: "👨‍👩‍👧 Family Crisis",
        category: "personal",
        description: "Your sister calls in tears. Her husband's gambling debts have attracted the wrong kind of attention. Loan sharks are threatening violence if he doesn't pay $30,000 by tomorrow. She's begging for your help.",
        rarity: "uncommon",
        
        choices: [
            {
                text: "💰 Pay the debt ($30,000)",
                requirements: { money: 30000 },
                successChance: 1.0,
                outcomes: {
                    success: {
                        money: -30000,
                        loyalty: 10,
                        message: "Family comes first. You pay the debt. Your brother-in-law promises to quit gambling (sure he does), and your sister is grateful. You're broke, but you kept your family safe."
                    }
                }
            },
            {
                text: "💀 'Talk' to the loan sharks",
                requirements: { gangMembers: 4, violence: 12 },
                successChance: 0.70,
                outcomes: {
                    success: {
                        respect: 15,
                        loyalty: 15,
                        message: "You pay the sharks a visit with your crew. After a 'friendly conversation,' they agree to forget the debt. Your brother-in-law lives another day. Family appreciates it."
                    },
                    failure: {
                        heat: 35,
                        gangMemberLoss: 1,
                        money: -30000,
                        message: "The loan sharks were connected to a bigger outfit. Your intimidation starts a war. Now you're paying the debt anyway AND you've got new enemies. Great job."
                    }
                }
            },
            {
                text: "🤝 Negotiate a payment plan",
                requirements: { intelligence: 12 },
                successChance: 0.60,
                outcomes: {
                    success: {
                        money: -10000,
                        message: "You negotiate: $10K now, rest over 6 months. Sharks agree. It costs you less upfront and gives your idiot brother-in-law time to get his act together. Compromise works."
                    },
                    failure: {
                        loyalty: -15,
                        money: -30000,
                        message: "They refuse to negotiate. It's full amount now or your sister's husband disappears. You're forced to pay the whole thing anyway. Should've just paid upfront."
                    }
                }
            },
            {
                text: "❌ Refuse to help",
                requirements: {},
                successChance: 1.0,
                outcomes: {
                    success: {
                        loyalty: -30,
                        message: "You tell your sister no. It's harsh, but he made his choices. Your crew sees you prioritizing business over family. Loyalty wavers. Your sister won't talk to you anymore."
                    }
                }
            }
        ]
    },
    
    {
        id: "territory_expansion_opportunity",
        title: "🗺️ Weak Territory Detected",
        category: "expansion",
        description: "Your scouts report that a key territory is poorly defended right now. The current owner's crew is depleted from a recent battle. This is your window to strike and claim it before they recover.",
        rarity: "uncommon",
        
        choices: [
            {
                text: "⚔️ Attack now (Strike fast)",
                requirements: { gangMembers: 8, violence: 14 },
                successChance: 0.75,
                outcomes: {
                    success: {
                        territoryGained: "random_weak",
                        respect: 25,
                        heat: 30,
                        loyalty: 10,
                        message: "Your crew sweeps in and takes the territory with minimal resistance. It's yours now. The previous owner is too weak to take it back. Expansion successful."
                    },
                    failure: {
                        heat: 40,
                        gangMemberLoss: 3,
                        respect: -15,
                        message: "It was a trap. They were waiting for you. The 'weak defense' was bait. Your crew walks into an ambush and gets decimated. Costly failure."
                    }
                }
            },
            {
                text: "🤝 Make an offer to buy it ($50,000)",
                requirements: { money: 50000, intelligence: 14 },
                successChance: 0.80,
                outcomes: {
                    success: {
                        money: -50000,
                        territoryGained: "random_weak",
                        factionRespect: { target: "territory_owner", change: 20 },
                        message: "You make a fair offer and they accept. The territory changes hands peacefully. No war, no casualties, just business. Sometimes money talks louder than violence."
                    },
                    failure: {
                        money: -50000,
                        message: "They take your money and then attack you anyway while you're counting the loss. You got played. The territory is still theirs and you're $50K poorer."
                    }
                }
            },
            {
                text: "⏰ Wait for backup (Cautious approach)",
                requirements: {},
                successChance: 0.50,
                outcomes: {
                    success: {
                        message: "You wait to gather more forces. By the time you're ready, they've reinforced their defenses. The opportunity is lost, but at least you didn't risk your crew unnecessarily."
                    },
                    failure: {
                        territoryLost: "random_yours",
                        message: "While you waited, THEY struck one of YOUR territories. You were so focused on attacking that you left your own turf vulnerable. Amateur mistake."
                    }
                }
            }
        ]
    }
];

// Continue in next file due to length...
