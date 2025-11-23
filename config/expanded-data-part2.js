/**
 * expanded-data-part2.js
 * 
 * ADDITIONAL COMPREHENSIVE DATA FOR EXPANDED SYSTEMS (Part 2)
 * 
 * Contains:
 * - Legacy perks (extended tree)
 * - Collectibles catalog (expanded)
 * - Respect modifier tables
 * - Gang archetypes and starting templates
 */

// ==================== 5. LEGACY PERKS (EXTENDED) ====================

export const LEGACY_PERKS = {
    // ===== TIER 1: FOUNDATION PERKS (0-50 Legacy Points) =====
    hustlers_edge: {
        id: "hustlers_edge",
        name: "Hustler's Edge",
        tier: 1,
        cost: 10,
        description: "You know every shortcut, every angle, every way to squeeze extra profit from the streets. Built different from day one.",
        icon: "💵",
        effects: {
            incomeMultiplier: 1.10,
            jobSuccessBonus: 0.05
        },
        requirements: {}
    },
    
    family_ties: {
        id: "family_ties",
        name: "Family Ties",
        tier: 1,
        cost: 15,
        description: "Blood is thicker than water. Your crew's loyalty runs deep, passed down from your father's generation.",
        icon: "👨‍👩‍👧",
        effects: {
            gangLoyaltyBonus: 15,
            loyaltyDecayReduction: 0.25
        },
        requirements: {}
    },
    
    street_smart: {
        id: "street_smart",
        name: "Street Smart",
        tier: 1,
        cost: 12,
        description: "You learned the game young. Reading people, spotting danger, knowing when to fold. These instincts can't be taught.",
        icon: "🧠",
        effects: {
            heatReduction: 0.10,
            eventSuccessBonus: 0.10
        },
        requirements: {}
    },
    
    born_leader: {
        id: "born_leader",
        name: "Born Leader",
        tier: 1,
        cost: 15,
        description: "People naturally follow you. Even as a kid, you were organizing the neighborhood. It's in your blood.",
        icon: "👑",
        effects: {
            maxGangMembers: 5,
            recruitmentCostReduction: 0.10
        },
        requirements: {}
    },
    
    // ===== TIER 2: SKILLED OPERATOR (50-150 Legacy Points) =====
    money_laundering_genius: {
        id: "laundering_genius",
        name: "Money Laundering Genius",
        tier: 2,
        cost: 25,
        description: "Your family's accountant taught you the art of making dirty money clean. You could launder cash in your sleep.",
        icon: "💼",
        effects: {
            launderingSpeed: 1.30,
            launderingLossReduction: 0.15
        },
        requirements: { legacyPoints: 50 }
    },
    
    heat_resistant: {
        id: "heat_resistant",
        name: "Heat Resistant",
        tier: 2,
        cost: 30,
        description: "Your family's lawyer has gotten you out of more jams than you can count. The feds know your name but can't make anything stick.",
        icon: "🔥",
        effects: {
            heatDecayMultiplier: 1.40,
            jailTimeReduction: 0.25
        },
        requirements: { legacyPoints: 50 }
    },
    
    natural_leader: {
        id: "natural_leader",
        name: "Natural Leader",
        tier: 2,
        cost: 35,
        description: "Your father led with respect, not fear. You inherited that gift. Men would die for you.",
        icon: "👥",
        effects: {
            maxGangMembers: 10,
            gangEffectivenessBonus: 0.15,
            respectGainMultiplier: 1.20
        },
        requirements: { legacyPoints: 75, prerequisite: "born_leader" }
    },
    
    strategic_mind: {
        id: "strategic_mind",
        name: "Strategic Mind",
        tier: 2,
        cost: 40,
        description: "Like a chess master, you see moves others don't. Your grandfather was the same – always three steps ahead.",
        icon: "♟️",
        effects: {
            jobPlanningBonus: 0.20,
            eventPreviewDuration: 300,
            territoryDefenseBonus: 0.15
        },
        requirements: { legacyPoints: 100 }
    },
    
    old_money: {
        id: "old_money",
        name: "Old Money",
        tier: 2,
        cost: 50,
        description: "Your family's been in the game for three generations. You started with connections and capital others can only dream of.",
        icon: "💰",
        effects: {
            startingCash: 50000,
            incomeMultiplier: 1.15,
            businessPurchaseDiscount: 0.20
        },
        requirements: { legacyPoints: 120 }
    },
    
    // ===== TIER 3: MASTER CRIMINAL (150-300 Legacy Points) =====
    iron_will: {
        id: "iron_will",
        name: "Iron Will",
        tier: 3,
        cost: 60,
        description: "Your family never breaks. The feds tried to flip your uncle for 15 years. He did his time and never said a word. You inherited that backbone.",
        icon: "🛡️",
        effects: {
            gangLoyaltyBonus: 30,
            betrayalChance: -0.50,
            interrogationResistance: 0.75
        },
        requirements: { legacyPoints: 150, prerequisite: "family_ties" }
    },
    
    master_recruiter: {
        id: "master_recruiter",
        name: "Master Recruiter",
        tier: 3,
        cost: 75,
        description: "You can spot talent a mile away. The best soldiers, the smartest operators – they all want to work for you.",
        icon: "🎯",
        effects: {
            maxGangMembers: 20,
            recruitmentCostReduction: 0.25,
            specializedRecruitChance: 0.30,
            gangStatBonus: 2
        },
        requirements: { legacyPoints: 175, prerequisite: "natural_leader" }
    },
    
    territory_expert: {
        id: "territory_expert",
        name: "Territory Expert",
        tier: 3,
        cost: 70,
        description: "Your family controlled half the city once. You know every street, every contact, every vulnerability. Time to reclaim your legacy.",
        icon: "🗺️",
        effects: {
            territoryIncomeBonus: 0.25,
            territoryClaimCostReduction: 0.30,
            territoryDefenseBonus: 0.25,
            maxTerritories: 5
        },
        requirements: { legacyPoints: 200 }
    },
    
    shadow_empire: {
        id: "shadow_empire",
        name: "Shadow Empire",
        tier: 3,
        cost: 80,
        description: "Your family built an empire that operated in the shadows. Legitimate fronts, offshore accounts, untraceable networks. You know the blueprint.",
        icon: "🕶️",
        effects: {
            heatGenerationReduction: 0.30,
            businessProfitBonus: 0.35,
            federalInvestigationResistance: 0.40
        },
        requirements: { legacyPoints: 250, prerequisite: "laundering_genius" }
    },
    
    // ===== TIER 4: DYNASTY (300+ Legacy Points) =====
    untouchable: {
        id: "untouchable",
        name: "Untouchable",
        tier: 4,
        cost: 100,
        description: "Your family has judges, senators, and police chiefs in their pocket. The law bends around you like gravity around a black hole.",
        icon: "⚖️",
        effects: {
            jailChanceReduction: 0.60,
            heatDecayMultiplier: 2.0,
            policeRaidChance: -0.75,
            corruptionEffectiveness: 1.50
        },
        requirements: { legacyPoints: 300, prerequisite: "heat_resistant" }
    },
    
    kingpin_legacy: {
        id: "kingpin_legacy",
        name: "Kingpin Legacy",
        tier: 4,
        cost: 150,
        description: "Your family name is legend. Your grandfather was a kingpin, your father expanded the empire, and now it's your turn to surpass them both.",
        icon: "👑",
        effects: {
            respectGainMultiplier: 1.50,
            maxGangMembers: 50,
            allStatsBonus: 5,
            incomeMultiplier: 1.25,
            territoryLimit: 10,
            specialDialogueOptions: true
        },
        requirements: { 
            legacyPoints: 500, 
            prerequisite: "master_recruiter",
            territories: 5,
            respect: 100
        }
    },
    
    empire_builder: {
        id: "empire_builder",
        name: "Empire Builder",
        tier: 4,
        cost: 120,
        description: "You don't just run a gang – you build dynasties. Legitimate businesses, political connections, international operations. The whole package.",
        icon: "🏛️",
        effects: {
            businessSlots: 10,
            businessProfitBonus: 0.50,
            internationalOperationsUnlocked: true,
            politicalInfluenceGeneration: true
        },
        requirements: { legacyPoints: 400, money: 500000 }
    },
    
    the_godfather: {
        id: "the_godfather",
        name: "The Godfather",
        tier: 4,
        cost: 200,
        description: "Ultimate power. Ultimate respect. You ARE the law in this city. Your family's legacy spans generations, and your name will echo through history.",
        icon: "🎩",
        effects: {
            allBonusesDoubled: true,
            immortalLegacy: true,
            cityControl: true,
            endGameUnlocked: true
        },
        requirements: { 
            legacyPoints: 1000,
            territories: 10,
            respect: 200,
            money: 2000000,
            prerequisite: "kingpin_legacy"
        }
    },
    
    // ===== SPECIALIZED PERKS =====
    assassins_creed: {
        id: "assassins_creed",
        name: "Assassin's Creed",
        tier: 2,
        cost: 35,
        description: "Your family specialized in the wet work. You learned from the best killers in the business. Death follows your orders.",
        icon: "🗡️",
        effects: {
            hitSuccessRate: 1.40,
            enforcerEffectiveness: 1.30,
            intimidationBonus: 0.50
        },
        requirements: { legacyPoints: 80 }
    },
    
    smugglers_routes: {
        id: "smugglers_routes",
        name: "Smuggler's Routes",
        tier: 2,
        cost: 30,
        description: "Your uncle ran guns across three borders. You know every route, every contact, every way to move contraband invisibly.",
        icon: "🚢",
        effects: {
            smugglingProfitBonus: 0.40,
            smugglingSuccessRate: 0.25,
            borderCrossingSpeed: 2.0
        },
        requirements: { legacyPoints: 90 }
    },
    
    digital_age: {
        id: "digital_age",
        name: "Digital Age Kingpin",
        tier: 3,
        cost: 65,
        description: "While old-timers were counting cash, your family was building digital empires. Cryptocurrency, hacking, cyber crime – you own the future.",
        icon: "💻",
        effects: {
            hackerEffectiveness: 1.50,
            digitalCrimeUnlocked: true,
            cryptoLaunderingAvailable: true,
            cyberIntelligenceBonus: 0.40
        },
        requirements: { legacyPoints: 180 }
    },
    
    political_machine: {
        id: "political_machine",
        name: "Political Machine",
        tier: 3,
        cost: 70,
        description: "Your family doesn't just bribe politicians – they OWN them. City council, DA's office, even the mayor... all in your pocket.",
        icon: "🏛️",
        effects: {
            policeInterferenceReduction: 0.50,
            legalProtection: 1.60,
            zoningManipulation: true,
            politicalFavorsAvailable: true
        },
        requirements: { legacyPoints: 220, money: 200000 }
    }
};

// ==================== 6. COLLECTIBLES (EXPANDED CATALOG) ====================

export const COLLECTIBLE_CATEGORIES = {
    rare_cars: {
        category: "Rare Luxury Cars",
        description: "High-end vehicles that show your status and style. Each one's a masterpiece.",
        icon: "🚗",
        items: [
            {
                id: "ferrari_f40",
                name: "1987 Ferrari F40",
                description: "The last car Enzo Ferrari personally approved. Raw power, no frills. A true driver's machine. Red, naturally.",
                value: 150000,
                rarity: "rare",
                respectBonus: 25,
                stylePoints: 40,
                findMethod: "Win illegal street race tournament",
                displayEffect: "Crew morale +10%, Recruitment attraction +15%"
            },
            {
                id: "lambo_countach",
                name: "1985 Lamborghini Countach",
                description: "The poster on every kid's wall in the 80s. Scissor doors, wedge shape, pure cocaine excess. Still turns every head.",
                value: 120000,
                rarity: "rare",
                respectBonus: 20,
                stylePoints: 35,
                findMethod: "Purchase from underground auction",
                displayEffect: "Territory income +5%"
            },
            {
                id: "rolls_phantom",
                name: "Rolls-Royce Phantom (Armored)",
                description: "Bulletproof glass, reinforced chassis, and leather seats worth more than most people's houses. Roll like royalty.",
                value: 200000,
                rarity: "epic",
                respectBonus: 35,
                stylePoints: 50,
                defenseBonus: 20,
                findMethod: "Steal from rival kingpin's garage",
                displayEffect: "Intimidation +25%, Survival chance in attacks +15%"
            },
            {
                id: "porsche_959",
                name: "Porsche 959",
                description: "1980s supercar technology at its peak. Only 337 ever made. Yours is number 88 – lucky numbers.",
                value: 180000,
                rarity: "epic",
                respectBonus: 30,
                stylePoints: 45,
                findMethod: "Complete 'The German Job' heist mission",
                displayEffect: "Escape success +20%, Speed-based jobs +15%"
            },
            {
                id: "delorean_gold",
                name: "24K Gold-Plated DeLorean",
                description: "Utterly impractical, completely ridiculous, and absolutely unforgettable. Commissioned by a Saudi prince, stolen by you.",
                value: 250000,
                rarity: "legendary",
                respectBonus: 50,
                stylePoints: 75,
                findMethod: "Legendary heist: 'Back to the Vault'",
                displayEffect: "Respect generation +30%, Media attention +100%"
            },
            {
                id: "batmobile_replica",
                name: "Custom 'Batmobile' (1989 Design)",
                description: "A movie-accurate replica with some... modifications. Armor plating, hidden weapons, and a flamethrower. Because why not?",
                value: 300000,
                rarity: "legendary",
                respectBonus: 60,
                stylePoints: 90,
                combatBonus: 30,
                findMethod: "Commission from underground vehicle modifier",
                displayEffect: "Intimidation +40%, Combat effectiveness +20%"
            }
        ]
    },
    
    exotic_weapons: {
        category: "Exotic Weapons",
        description: "Rare, powerful, and dangerous tools of the trade. These aren't just guns – they're statements.",
        icon: "🔫",
        items: [
            {
                id: "gold_desert_eagle",
                name: "24K Gold Desert Eagle",
                description: "Pure excess. .50 caliber hand cannon with gold plating and diamond-encrusted grip. More art than weapon, but it still kills.",
                value: 75000,
                rarity: "rare",
                respectBonus: 15,
                powerBonus: 10,
                findMethod: "Win from cartel boss in poker game",
                displayEffect: "Violence stat +3, Intimidation +15%"
            },
            {
                id: "tommy_gun_capone",
                name: "Al Capone's Thompson Submachine Gun",
                description: "Legend says this was carried during the St. Valentine's Day Massacre. Whether that's true or not, it's got history.",
                value: 150000,
                rarity: "epic",
                respectBonus: 35,
                powerBonus: 15,
                historicalValue: true,
                findMethod: "Recover from museum heist",
                displayEffect: "Gang loyalty +15%, Historical respect +25"
            },
            {
                id: "yakuza_katana",
                name: "Yakuza Oyabun's Katana",
                description: "400-year-old samurai blade, passed down through generations of Yakuza bosses. Taking it from them... that's a story.",
                value: 200000,
                rarity: "legendary",
                respectBonus: 50,
                powerBonus: 20,
                honorBonus: 30,
                findMethod: "Defeat Yakuza boss in honor duel",
                displayEffect: "Melee combat +30%, Asian faction respect +40"
            },
            {
                id: "golden_ak47",
                name: "Saddam Hussein's Golden AK-47",
                description: "Recovered from a Baghdad palace. Solid gold furniture, custom engravings. Dictator chic at its finest.",
                value: 180000,
                rarity: "epic",
                respectBonus: 40,
                powerBonus: 18,
                findMethod: "Purchase from black market arms dealer",
                displayEffect: "Weapon deals +20% profit, International respect +25"
            },
            {
                id: "spy_pistol",
                name: "CIA Covert Ops Pistol (Suppressed)",
                description: "Untraceable, silent, deadly. Stolen from a retired agency asset. Comes with 3 confirmed kills on its record.",
                value: 90000,
                rarity: "rare",
                respectBonus: 20,
                powerBonus: 25,
                stealthBonus: 35,
                findMethod: "Complete 'Agency Black' mission",
                displayEffect: "Stealth kills +35%, Heat generation -15%"
            },
            {
                id: "rocket_launcher",
                name: "Russian RPG-7 (Gold Trim)",
                description: "When subtlety isn't an option. Custom-painted with gold accents because even heavy ordnance can have style.",
                value: 120000,
                rarity: "epic",
                respectBonus: 45,
                powerBonus: 50,
                destructionBonus: 100,
                findMethod: "Hijack military convoy",
                displayEffect: "Territory attacks +50% damage, Intimidation +30%"
            },
            {
                id: "sniper_rifle_custom",
                name: "Custom .50 Cal Sniper Rifle",
                description: "Built by a former Marine sniper. Accurate to 2000 yards. Three confirmed rival boss eliminations. Your signature weapon.",
                value: 110000,
                rarity: "epic",
                respectBonus: 35,
                powerBonus: 40,
                rangeBonus: 200,
                findMethod: "Commission from master gunsmith",
                displayEffect: "Assassination success +40%, Long-range hits +50%"
            }
        ]
    },
    
    artwork_treasures: {
        category: "Stolen Art & Treasures",
        description: "Priceless works of art, liberated from those who couldn't appreciate them properly.",
        icon: "🖼️",
        items: [
            {
                id: "van_gogh_sunflowers",
                name: "Van Gogh's 'Sunflowers' (Stolen)",
                description: "One of the most famous paintings in the world. Currently 'missing' from a Paris museum. Currently hanging in your penthouse.",
                value: 500000,
                rarity: "legendary",
                respectBonus: 75,
                cultureBonus: 100,
                heatRisk: 40,
                findMethod: "Complete 'The Paris Job' heist",
                displayEffect: "Prestige +50, Art dealer contacts unlocked, FBI interest +40%"
            },
            {
                id: "mona_lisa_replica",
                name: "'Perfect' Mona Lisa Replica",
                description: "So good that even experts can't tell it apart from the original. You know which one is in the Louvre... and which one isn't.",
                value: 250000,
                rarity: "epic",
                respectBonus: 45,
                intelligenceBonus: 10,
                findMethod: "Commission from master forger",
                displayEffect: "Forgery operations +25%, Art scam success +40%"
            },
            {
                id: "egyptian_artifact",
                name: "Ancient Egyptian Scarab",
                description: "3000 years old, solid gold, covered in hieroglyphics. Probably cursed. Definitely stolen from the British Museum.",
                value: 180000,
                rarity: "epic",
                respectBonus: 40,
                mysteryBonus: 50,
                findMethod: "Museum heist: 'The Mummy's Curse'",
                displayEffect: "Antiquities contacts unlocked, Black market access improved"
            },
            {
                id: "faberge_egg",
                name: "Fabergé Imperial Egg",
                description: "Made for Russian royalty before the revolution. One of only 50 ever created. Encrusted with diamonds and rubies. Worth a fortune.",
                value: 350000,
                rarity: "legendary",
                respectBonus: 60,
                luxuryBonus: 80,
                findMethod: "Steal from oligarch's private collection",
                displayEffect: "Russian faction respect +30, Luxury goods market access"
            },
            {
                id: "hope_diamond_replica",
                name: "Hope Diamond (Perfect Replica)",
                description: "The world's most famous cursed diamond... or is it? Your jeweler friend is VERY good at his job. No one knows for sure.",
                value: 200000,
                rarity: "epic",
                respectBonus: 45,
                mysteryBonus: 60,
                findMethod: "Smithsonian heist (classified details)",
                displayEffect: "Jewelry heist +30%, Fence prices +20%"
            },
            {
                id: "ancient_manuscript",
                name: "Leonardo da Vinci's Lost Journal",
                description: "A previously unknown manuscript containing sketches and notes from the Renaissance master. Historians would kill for this. So would you.",
                value: 400000,
                rarity: "legendary",
                respectBonus: 70,
                intelligenceBonus: 15,
                historicalValue: true,
                findMethod: "Recover from Vatican secret archives",
                displayEffect: "Scholar contacts, Historical artifact market access, Intelligence +5"
            }
        ]
    },
    
    luxury_items: {
        category: "Luxury Items & Status Symbols",
        description: "The finest things money can buy (or steal). Because living like a king is the whole point.",
        icon: "💎",
        items: [
            {
                id: "patek_philippe_watch",
                name: "Patek Philippe Grandmaster Chime",
                description: "The most complicated watch ever made. Only 7 exist. Yours was 'liberated' from a Swiss banker. $31 million retail value.",
                value: 310000,
                rarity: "legendary",
                respectBonus: 65,
                timeBonus: 50,
                findMethod: "Swiss bank vault heist",
                displayEffect: "Prestige +40, Banking contacts unlocked, Time-sensitive operations +10%"
            },
            {
                id: "private_jet",
                name: "Gulfstream G650 Private Jet",
                description: "Your personal wings. Leather everything, gold fixtures, and most importantly – untraceable flight plans.",
                value: 650000,
                rarity: "legendary",
                respectBonus: 80,
                mobilityBonus: 100,
                findMethod: "Purchase through shell corporation",
                displayEffect: "International operations unlocked, Escape options +50%, Travel speed ×3"
            },
            {
                id: "rolex_rainbow",
                name: "Rolex Daytona 'Rainbow'",
                description: "Bezel set with sapphires in every color. Diamonds everywhere else. Subtle? No. Stunning? Absolutely.",
                value: 95000,
                rarity: "rare",
                respectBonus: 25,
                stylePoints: 40,
                findMethod: "Win in high-stakes poker game",
                displayEffect: "Gambling luck +10%, Intimidation +15%"
            },
            {
                id: "diamond_grill",
                name: "24K Gold & Diamond Grill",
                description: "Custom-made teeth grills with VS1 diamonds. Ridiculous, ostentatious, and exactly the image you want to project.",
                value: 75000,
                rarity: "rare",
                respectBonus: 30,
                stylePoints: 50,
                intimidationBonus: 25,
                findMethod: "Commission from celebrity jeweler",
                displayEffect: "Street cred +30%, Music industry contacts unlocked"
            },
            {
                id: "tiger_pet",
                name: "White Bengal Tiger (Pet)",
                description: "Because every proper crime lord needs a giant murder cat lounging in their mansion. His name is Tony.",
                value: 120000,
                rarity: "epic",
                respectBonus: 55,
                intimidationBonus: 60,
                maintenanceCost: 5000,
                findMethod: "Purchase from exotic animal smuggler",
                displayEffect: "Intimidation +60%, Home defense +40%, Monthly costs +$5K"
            },
            {
                id: "vineyard_france",
                name: "French Vineyard Estate",
                description: "400-acre vineyard in Bordeaux. Produces award-winning wine. Perfect for laundering millions. The French lifestyle suits you.",
                value: 800000,
                rarity: "legendary",
                respectBonus: 70,
                incomeGeneration: 15000,
                launderingBonus: 50,
                findMethod: "Purchase through legitimate business fronts",
                displayEffect: "Monthly income +$15K, Money laundering +50% efficiency, European connections"
            },
            {
                id: "penthouse_suite",
                name: "Manhattan Penthouse (Central Park View)",
                description: "Top floor of a 5th Avenue high-rise. Floor-to-ceiling windows overlooking Central Park. The ultimate power move.",
                value: 1200000,
                rarity: "legendary",
                respectBonus: 90,
                luxuryBonus: 100,
                safetyBonus: 30,
                findMethod: "Purchase with clean money",
                displayEffect: "Prestige +60, Safe house unlocked, VIP meetings enabled, Property value appreciates"
            },
            {
                id: "yacht_custom",
                name: "150ft Custom Yacht 'Don's Retreat'",
                description: "Your floating palace. Helipad, submarine dock, and a panic room. Perfect for entertaining... or fleeing the country.",
                value: 950000,
                rarity: "legendary",
                respectBonus: 85,
                mobilityBonus: 80,
                safetyBonus: 50,
                findMethod: "Commission from Dutch shipyard",
                displayEffect: "Escape route unlocked, Coastal operations +40%, International smuggling enabled"
            }
        ]
    },
    
    rare_memorabilia: {
        category: "Crime History Memorabilia",
        description: "Pieces of criminal history. Items that once belonged to legends of the underworld.",
        icon: "🏆",
        items: [
            {
                id: "capone_suit",
                name: "Al Capone's Personal Suit",
                description: "The three-piece suit Capone wore during his 1931 trial. Bullet hole in the left shoulder from a previous 'disagreement.'",
                value: 85000,
                rarity: "rare",
                respectBonus: 40,
                historicalValue: true,
                findMethod: "Private auction",
                displayEffect: "Historical respect +30, Mafia contacts improved"
            },
            {
                id: "dillinger_gun",
                name: "John Dillinger's Escape Pistol",
                description: "The wooden gun he carved to escape from prison. A testament to ingenuity and balls of steel.",
                value: 120000,
                rarity: "epic",
                respectBonus: 45,
                escapeBonus: 30,
                findMethod: "Smithsonian 'midnight acquisition'",
                displayEffect: "Escape attempts +30%, Resourcefulness inspired"
            },
            {
                id: "gotti_ring",
                name: "John Gotti's Pinky Ring",
                description: "The 'Dapper Don' never left home without it. Now it's on YOUR hand. The symbolism isn't lost on anyone.",
                value: 95000,
                rarity: "epic",
                respectBonus: 50,
                mafiaBonus: 60,
                findMethod: "Inherited from retiring capo",
                displayEffect: "Italian mob respect +50, Old-school cred +40"
            },
            {
                id: "escobar_throne",
                name: "Pablo Escobar's Gold Throne",
                description: "Solid gold chair from Pablo's compound. Gaudy as hell, heavy as sin, and dripping with cocaine cartel energy.",
                value: 250000,
                rarity: "legendary",
                respectBonus: 70,
                intimidationBonus: 50,
                findMethod: "Colombian connection special deal",
                displayEffect: "Cartel respect +60, Drug trade bonuses +25%"
            },
            {
                id: "bonnie_clyde_car",
                name: "Bonnie & Clyde's Death Car",
                description: "The bullet-riddled 1934 Ford that became their tomb. Morbid? Yes. Historic? Absolutely. Priceless? You bet.",
                value: 300000,
                rarity: "legendary",
                respectBonus: 65,
                historicalValue: true,
                notorietyBonus: 80,
                findMethod: "Black market collector sale",
                displayEffect: "Notoriety +80, Museum heist contacts, Media fascination"
            }
        ]
    }
};

// Continue with respect modifiers...
