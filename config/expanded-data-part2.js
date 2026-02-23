/**
 * expanded-data-part2.js
 * 
 * ADDITIONAL COMPREHENSIVE DATA FOR EXPANDED SYSTEMS (Part 2)
 * 
 * Contains:
 * - Collectibles catalog (expanded)
 * - Respect modifier tables
 * - Gang archetypes and starting templates
 */

// ==================== 6. COLLECTIBLES (EXPANDED CATALOG) ====================

export const COLLECTIBLE_CATEGORIES = {
    rare_cars: {
        category: "Rare Luxury Cars",
        description: "High-end vehicles that show your status and style. Each one's a masterpiece.",
        icon: "",
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
                description: "1980s supercar technology at its peak. Only 337 ever made. Yours is number 88 â€“ lucky numbers.",
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
        description: "Rare, powerful, and dangerous tools of the trade. These aren't just guns â€“ they're statements.",
        icon: "",
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
        icon: "",
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
                name: "FabergÃ© Imperial Egg",
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
        icon: "",
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
                description: "Your personal wings. Leather everything, gold fixtures, and most importantly â€“ untraceable flight plans.",
                value: 650000,
                rarity: "legendary",
                respectBonus: 80,
                mobilityBonus: 100,
                findMethod: "Purchase through shell corporation",
                displayEffect: "International operations unlocked, Escape options +50%, Travel speed Ã—3"
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
        icon: "",
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
