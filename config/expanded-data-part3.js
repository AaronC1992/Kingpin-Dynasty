/**
 * expanded-data-part3.js
 * 
 * COMPREHENSIVE DATA FOR EXPANDED SYSTEMS (Part 3 - Final)
 * 
 * Contains:
 * - Respect modifier tables
 * - Gang archetype templates
 * - Special events calendar
 * - Rival AI behavior patterns
 */

// ==================== 7. RESPECT MODIFIER TABLES ====================

export const RESPECT_MODIFIERS = {
    // ===== JOB ACTIONS =====
    jobs: {
        mug_someone: { base: 1, description: "Small-time stuff. Nobody cares." },
        shakedown: { base: 2, description: "Classic protection racket." },
        steal_car: { base: 3, description: "Decent hustle." },
        burglary: { base: 5, description: "Breaking and entering like a pro." },
        robbery: { base: 8, description: "Armed robbery gets attention." },
        heist: { base: 15, description: "Big scores = big respect." },
        bank_heist: { base: 25, description: "The big leagues." },
        
        // Multipliers
        success_multiplier: 1.0,
        failure_multiplier: -0.5,
        clean_getaway_bonus: 1.25,
        crew_size_bonus: 0.1, // per member involved
        violence_used_multiplier: 1.15
    },
    
    // ===== TERRITORY CONTROL =====
    territory: {
        claim_territory: { base: 20, description: "Taking ground is a power move." },
        defend_territory: { base: 10, description: "Holding what's yours shows strength." },
        lose_territory: { base: -30, description: "Major L. The streets notice weakness." },
        fortify_territory: { base: 5, description: "Building defenses shows you're here to stay." },
        
        // Territory-specific modifiers
        high_value_territory_multiplier: 1.5,
        contested_territory_multiplier: 1.3,
        first_territory_bonus: 10,
        fifth_territory_bonus: 25,
        tenth_territory_bonus: 50
    },
    
    // ===== GANG WARFARE =====
    combat: {
        kill_rival_member: { base: 8, description: "Body count matters in this game." },
        kill_rival_boss: { base: 50, description: "Taking out a boss is legendary." },
        win_turf_war: { base: 30, description: "Warfare victory establishes dominance." },
        lose_turf_war: { base: -25, description: "Public defeat damages reputation." },
        successful_ambush: { base: 15, description: "Tactical brilliance is respected." },
        failed_ambush: { base: -10, description: "Walking into a trap looks amateur." },
        
        // Combat modifiers
        outnumbered_victory_bonus: 20,
        overwhelming_victory_multiplier: 1.4,
        minimal_casualties_bonus: 10,
        total_wipe_achievement: 35
    },
    
    // ===== RELATIONSHIPS & DIPLOMACY =====
    diplomacy: {
        form_alliance: { base: 15, description: "Strong allies = strong empire." },
        break_alliance: { base: -20, description: "Betrayal damages your word." },
        successful_negotiation: { base: 10, description: "Talking your way out shows intelligence." },
        pay_tribute: { base: -15, description: "Paying others makes you look weak." },
        receive_tribute: { base: 12, description: "Others paying you = respect." },
        broker_peace: { base: 8, description: "Peacemaking shows influence." },
        start_war: { base: -5, description: "Aggression without cause seems reckless." }
    },
    
    // ===== WEALTH & STATUS =====
    wealth: {
        reach_100k: { base: 10, description: "First major milestone." },
        reach_500k: { base: 25, description: "Now you're a player." },
        reach_1mil: { base: 50, description: "Million-dollar kingpin status." },
        reach_5mil: { base: 100, description: "True empire-level wealth." },
        
        // Display of wealth
        purchase_luxury_car: { base: 8, description: "Flexing brings respect." },
        purchase_collectible: { base: 12, description: "Showing culture and taste." },
        buy_business: { base: 15, description: "Legitimate fronts = smart boss." },
        go_bankrupt: { base: -40, description: "Going broke is the ultimate embarrassment." }
    },
    
    // ===== CREW MANAGEMENT =====
    crew: {
        recruit_specialist: { base: 5, description: "Quality hires show you're building smart." },
        lose_crew_member_betrayal: { base: -12, description: "Rats in your crew = weak leadership." },
        lose_crew_member_death: { base: -5, description: "Casualties happen, but losses hurt morale." },
        crew_reaches_10: { base: 15, description: "Building a proper army." },
        crew_reaches_25: { base: 35, description: "Running a full organization." },
        crew_reaches_50: { base: 60, description: "Commanding an empire." },
        
        // Loyalty events
        prevent_betrayal: { base: 10, description: "Catching rats early shows vigilance." },
        high_loyalty_maintained: { base: 5, description: "Monthly bonus for 90%+ loyalty." }
    },
    
    // ===== LAW ENFORCEMENT =====
    heat: {
        escape_police: { base: 5, description: "Slipping through their fingers builds legend." },
        bribe_cop: { base: 8, description: "Corrupting the law shows power." },
        beat_charges: { base: 20, description: "Walking free after arrest = respect." },
        go_to_jail: { base: -30, description: "Getting locked up is a major setback." },
        
        // Heat management
        maintain_low_heat: { base: 5, description: "Monthly bonus for heat < 25." },
        survive_raid: { base: 15, description: "Fighting off the law successfully." },
        evidence_destroyed: { base: 10, description: "Covering your tracks like a pro." }
    },
    
    // ===== SPECIAL EVENTS =====
    events: {
        legendary_heist: { base: 40, description: "Pulling off the impossible." },
        eliminate_witness: { base: 12, description: "Ruthless pragmatism." },
        successful_blackmail: { base: 15, description: "Playing the angles." },
        help_community: { base: 20, description: "Robin Hood effect - respectedby the people." },
        betray_partner: { base: -25, description: "Your word means nothing now." },
        
        // Event outcomes
        perfect_event_outcome: { base: 25, description: "Optimal decision-making." },
        disaster_event_outcome: { base: -20, description: "Everything went wrong." }
    },
    
    // ===== COLLECTIBLES & ACHIEVEMENTS =====
    achievements: {
        first_collectible: { base: 10, description: "Starting the collection." },
        complete_car_collection: { base: 50, description: "All rare cars obtained." },
        complete_weapon_collection: { base: 45, description: "Arsenal complete." },
        complete_art_collection: { base: 60, description: "Cultural kingpin status." },
        complete_all_collections: { base: 150, description: "The ultimate collector." },
        
        // Milestones
        first_territory: { base: 15, description: "First step to empire." },
        first_business: { base: 12, description: "Going legitimate." },
        first_rival_defeated: { base: 35, description: "Eliminating competition." },
        city_domination: { base: 200, description: "Control 100% of territories." }
    },
    
    // ===== PASSIVE MODIFIERS =====
    passive: {
        per_territory_owned: 3,
        per_business_owned: 2,
        per_10_crew_members: 5,
        per_100k_wealth: 2,
        per_legacy_perk: 4,
        per_collectible: 3,
        
        // Decay
        weekly_decay_base: -2,
        inactivity_penalty: -5, // per week of no major actions
        arrest_ongoing_penalty: -10 // while in jail
    },
    
    // ===== FACTION-SPECIFIC =====
    factions: {
        torrino: {
            honor_actions_bonus: 1.3,
            betrayal_penalty: 2.0,
            family_loyalty_bonus: 1.4
        },
        kozlov: {
            violence_bonus: 1.5,
            mercy_penalty: 0.5,
            territory_expansion_bonus: 1.3
        },
        chen: {
            intelligence_bonus: 1.4,
            strategy_bonus: 1.3,
            patience_bonus: 1.2
        },
        morales: {
            ambition_bonus: 1.4,
            rapid_growth_bonus: 1.3,
            drug_trade_bonus: 1.5
        },
        independent: {
            unpredictability_bonus: 1.2,
            opportunism_bonus: 1.3
        }
    }
};

// ==================== 8. GANG ARCHETYPES ====================

export const GANG_ARCHETYPES = {
    traditional_mafia: {
        id: "traditional_mafia",
        name: "Traditional Mafia Family",
        description: "Old-school organized crime. Honor, tradition, and the famiglia come first. You build respect through loyalty and calculated moves.",
        icon: "",
        
        startingBonus: {
            respect: 25,
            loyalty: 75,
            money: 15000,
            heat: 20
        },
        
        startingCrew: [
            { role: "consigliere", name: "Salvatore 'Sal' Romano" },
            { role: "enforcer", name: "Marco 'The Bull' Vitelli" },
            { role: "fixer", name: "Anthony 'Tony Suits' Greco" }
        ],
        
        playstyleModifiers: {
            respectGainMultiplier: 1.25,
            loyaltyDecayReduction: 0.40,
            heatFromViolence: 0.85,
            territoryDefenseBonus: 0.20
        },
        
        specialAbility: {
            name: "Family Honor",
            description: "Gang members never betray you if loyalty is above 60%. Respect loss from failed jobs is reduced by 50%."
        },
        
        recommendedStrategy: "Focus on building loyalty and respect. Take territories strategically and defend them fiercely. Old-school methods still work."
    },
    
    ruthless_cartel: {
        id: "ruthless_cartel",
        name: "Ruthless Drug Cartel",
        description: "Violence and fear are your tools. You're building an empire on cocaine and blood. Expand fast, hit hard, show no mercy.",
        icon: "",
        
        startingBonus: {
            respect: 15,
            loyalty: 50,
            money: 25000,
            heat: 40,
            violence: 5
        },
        
        startingCrew: [
            { role: "enforcer", name: "Diego 'El Diablo' Mendez" },
            { role: "smuggler", name: "Rosa 'La Serpiente' Vargas" },
            { role: "bruiser", name: "Carlos 'Cabeza' Martinez" }
        ],
        
        playstyleModifiers: {
            violenceEffectiveness: 1.40,
            drugTradeProfit: 1.50,
            expansionSpeed: 1.35,
            heatGeneration: 1.30
        },
        
        specialAbility: {
            name: "Reign of Terror",
            description: "Intimidation always succeeds. Territory attacks deal 30% more damage. Fear is your greatest weapon."
        },
        
        recommendedStrategy: "Expand aggressively. Use violence liberally. Control drug trade. Manage heat carefully or you'll attract the DEA."
    },
    
    tech_savvy_syndicate: {
        id: "tech_syndicate",
        name: "Tech-Savvy Cyber Syndicate",
        description: "The future of crime is digital. You run sophisticated cyber operations, identity theft, and cryptocurrency schemes. Brains over brawn.",
        icon: "",
        
        startingBonus: {
            respect: 10,
            loyalty: 60,
            money: 20000,
            heat: 15,
            intelligence: 8
        },
        
        startingCrew: [
            { role: "hacker", name: "Alex 'Cipher' Chen" },
            { role: "hacker", name: "Nina 'Ghost' Volkov" },
            { role: "fixer", name: "Marcus 'Proxy' Washington" }
        ],
        
        playstyleModifiers: {
            intelligenceJobBonus: 1.45,
            heatReduction: 0.70,
            cyberCrimeUnlocked: true,
            digitalLaunderingBonus: 1.60
        },
        
        specialAbility: {
            name: "Digital Dominance",
            description: "Can hack rival operations to steal intel. Heat from intelligence-based crimes reduced by 40%. Access to crypto laundering."
        },
        
        recommendedStrategy: "Focus on high-intelligence jobs. Build a network of hackers. Stay under the radar. Profit through sophistication, not violence."
    },
    
    street_hustlers: {
        id: "street_hustlers",
        name: "Street Hustlers Crew",
        description: "You came from nothing and you're hungry. Small-time hustles, quick profits, and street-level operations. Scrappy and resourceful.",
        icon: "",
        
        startingBonus: {
            respect: 5,
            loyalty: 65,
            money: 5000,
            heat: 10,
            stealth: 5
        },
        
        startingCrew: [
            { role: "scout", name: "Jamal 'Eyes' Johnson" },
            { role: "bruiser", name: "DeAndre 'Big D' Williams" }
        ],
        
        playstyleModifiers: {
            smallJobProfit: 1.50,
            recruitmentCostReduction: 0.30,
            stealthBonus: 1.25,
            startingScrappy: true
        },
        
        specialAbility: {
            name: "Underdog Hustle",
            description: "Small jobs (under $5K payout) have double success chance. Crew members cost 30% less to recruit. Grind to greatness."
        },
        
        recommendedStrategy: "Start small and build up. Focus on low-risk, high-volume operations. Recruit cheap and train them up. Bootstrap your empire."
    },
    
    international_network: {
        id: "international_network",
        name: "International Crime Network",
        description: "Your operation spans continents. Smuggling, arms dealing, human trafficking. You're connected to every major crime family worldwide.",
        icon: "",
        
        startingBonus: {
            respect: 30,
            loyalty: 55,
            money: 40000,
            heat: 35,
            intelligence: 5
        },
        
        startingCrew: [
            { role: "smuggler", name: "Dmitri 'The Russian' Volkov" },
            { role: "fixer", name: "Isabella 'Bella' Conti" },
            { role: "consigliere", name: "Kenji 'The Dragon' Tanaka" }
        ],
        
        playstyleModifiers: {
            smugglingProfit: 1.60,
            internationalConnectionsUnlocked: true,
            blackMarketAccess: true,
            heatFromFeds: 1.25
        },
        
        specialAbility: {
            name: "Global Empire",
            description: "Access to international job contracts. Can purchase exotic weapons and vehicles. Border operations available."
        },
        
        recommendedStrategy: "Leverage international connections. Focus on high-value smuggling. Build relationships with foreign crime families."
    },
    
    political_powerbrokers: {
        id: "political_brokers",
        name: "Political Power Brokers",
        description: "Crime and politics are the same game. You control politicians, judges, and cops. The legal system is your weapon.",
        icon: "",
        
        startingBonus: {
            respect: 35,
            loyalty: 70,
            money: 30000,
            heat: 5,
            intelligence: 8
        },
        
        startingCrew: [
            { role: "fixer", name: "Senator James Hartwell (Compromised)" },
            { role: "consigliere", name: "Attorney Rebecca Stone" },
            { role: "accountant", name: "David 'The Cleaner' Moss" }
        ],
        
        playstyleModifiers: {
            heatReduction: 0.50,
            legalProtection: 1.80,
            corruptionEffectiveness: 1.75,
            violenceReduction: 0.70
        },
        
        specialAbility: {
            name: "Above the Law",
            description: "Can bribe judges to dismiss cases. Police raids reduced by 60%. Politicians provide insider information and protection."
        },
        
        recommendedStrategy: "Play the long game. Build political connections. Use legal manipulation instead of violence. Control the system from within."
    }
};

// ==================== 9. SPECIAL EVENTS CALENDAR ====================

export const SPECIAL_EVENTS_CALENDAR = {
    // Monthly special events
    january: {
        id: "new_year_opportunity",
        name: "New Year, New Opportunities",
        description: "The holiday hangover creates openings. Security is lax, people are careless, and you're ready to capitalize.",
        bonuses: {
            heistSuccess: 0.15,
            securityReduction: 0.20
        }
    },
    
    february: {
        id: "valentines_massacre",
        name: "Valentine's Day Massacre Anniversary",
        description: "Old-school mobsters celebrate the infamous 1929 event. Traditional families show respect to the old ways.",
        bonuses: {
            mafiaRespect: 20,
            traditionalJobBonus: 0.15
        }
    },
    
    april: {
        id: "tax_season",
        name: "Tax Season Chaos",
        description: "Everyone's scrambling to file taxes. Perfect time for identity theft, fraud, and financial crimes.",
        bonuses: {
            fraudSuccess: 0.25,
            financialCrimeProfit: 0.30
        }
    },
    
    july: {
        id: "independence_day",
        name: "Independence Day Fireworks",
        description: "Fireworks mask gunshots. Chaos provides cover. The perfect night for settling old scores.",
        bonuses: {
            violenceDetectionReduction: 0.40,
            heatReduction: 0.25
        }
    },
    
    october: {
        id: "halloween_heist",
        name: "Halloween Heist Season",
        description: "Masks are everywhere, everyone's in disguise. Robberies and heists blend into the festivities.",
        bonuses: {
            disguiseEffectiveness: 0.35,
            heistSuccess: 0.20,
            escapeBonus: 0.15
        }
    },
    
    december: {
        id: "christmas_score",
        name: "Christmas Shopping Rush",
        description: "Stores full of cash, distracted shoppers, stressed security. The season of giving... yourself a bonus.",
        bonuses: {
            robberyProfit: 0.40,
            storeHeistSuccess: 0.25,
            policeResponseTime: 1.5
        }
    },
    
    // Special occurrence events (random chance monthly)
    random_events: [
        {
            id: "police_corruption_scandal",
            name: "Police Corruption Scandal",
            chance: 0.05,
            description: "Major police corruption exposed. The department is in chaos, investigations are stalled.",
            effects: {
                heatDecay: 2.0,
                policeEffectiveness: 0.50,
                duration: "1 month"
            }
        },
        {
            id: "economic_boom",
            name: "Economic Boom",
            chance: 0.08,
            description: "The economy is booming. More money flowing means more opportunities for you.",
            effects: {
                allIncome: 1.30,
                heistPayouts: 1.25,
                duration: "2 months"
            }
        },
        {
            id: "gang_war_erupts",
            name: "Citywide Gang War",
            chance: 0.06,
            description: "Two major gangs go to war. The city descends into chaos. Pick a side or stay neutral.",
            effects: {
                territoryVulnerability: 1.50,
                opportunityAttacks: true,
                duration: "1 month"
            }
        },
        {
            id: "federal_crackdown",
            name: "Federal Task Force Crackdown",
            chance: 0.04,
            description: "FBI, DEA, and ATF form joint task force targeting organized crime. Heat is way up.",
            effects: {
                heatGeneration: 1.75,
                arrestChance: 1.50,
                raidFrequency: 2.0,
                duration: "3 months"
            }
        },
        {
            id: "political_election",
            name: "Mayoral Election",
            chance: 0.10,
            description: "New mayor election. Time to invest in the right candidate... or blackmail them all.",
            effects: {
                politicalInfluenceOpportunity: true,
                corruptionCostReduction: 0.30,
                duration: "Election cycle"
            }
        }
    ]
};

// ==================== 10. RIVAL AI BEHAVIOR PATTERNS ====================

export const RIVAL_AI_PATTERNS = {
    // Vittorio Torrino - The Old Lion
    vittorio_torrino: {
        decisionWeights: {
            expand_territory: 0.25,
            fortify_defense: 0.40,
            recruit_members: 0.20,
            form_alliance: 0.30,
            attack_player: 0.15,
            economic_growth: 0.35
        },
        
        responsePatterns: {
            player_attacks_territory: "defensive_retaliation",
            player_kills_member: "measured_response",
            player_shows_respect: "reciprocate_respect",
            player_betrays: "blood_vendetta",
            allied_faction_attacked: "honor_bound_support"
        },
        
        growthStrategy: {
            preferredIncome: ["protection_rackets", "legitimate_business", "political_connections"],
            expansionStyle: "slow_and_steady",
            conflictAvoidance: 0.65,
            alliancePreference: 0.75
        }
    },
    
    // Yuri Kozlov - The Butcher
    yuri_kozlov: {
        decisionWeights: {
            expand_territory: 0.60,
            fortify_defense: 0.15,
            recruit_members: 0.50,
            form_alliance: 0.10,
            attack_player: 0.55,
            economic_growth: 0.25
        },
        
        responsePatterns: {
            player_attacks_territory: "overwhelming_force",
            player_kills_member: "brutal_retaliation",
            player_shows_respect: "suspicious_acknowledgment",
            player_betrays: "total_war",
            allied_faction_attacked: "ignore_unless_beneficial"
        },
        
        growthStrategy: {
            preferredIncome: ["smuggling", "arms_dealing", "extortion"],
            expansionStyle: "aggressive_blitzkrieg",
            conflictAvoidance: 0.10,
            alliancePreference: 0.15
        }
    },
    
    // Chen Wei - The Dragon
    chen_wei: {
        decisionWeights: {
            expand_territory: 0.35,
            fortify_defense: 0.30,
            recruit_members: 0.25,
            form_alliance: 0.45,
            attack_player: 0.20,
            economic_growth: 0.55
        },
        
        responsePatterns: {
            player_attacks_territory: "calculated_counter",
            player_kills_member: "strategic_patience_then_strike",
            player_shows_respect: "build_relationship",
            player_betrays: "long_term_destruction_plan",
            allied_faction_attacked: "evaluate_then_assist"
        },
        
        growthStrategy: {
            preferredIncome: ["gambling", "drugs", "money_laundering", "investments"],
            expansionStyle: "strategic_opportunism",
            conflictAvoidance: 0.50,
            alliancePreference: 0.65
        }
    },
    
    // Isabella Morales - La Reina
    isabella_morales: {
        decisionWeights: {
            expand_territory: 0.65,
            fortify_defense: 0.20,
            recruit_members: 0.60,
            form_alliance: 0.35,
            attack_player: 0.45,
            economic_growth: 0.50
        },
        
        responsePatterns: {
            player_attacks_territory: "aggressive_counter",
            player_kills_member: "escalate_immediately",
            player_shows_respect: "test_loyalty_then_cooperate",
            player_betrays: "vengeful_destruction",
            allied_faction_attacked: "support_if_advantageous"
        },
        
        growthStrategy: {
            preferredIncome: ["drug_trade", "smuggling", "territory_expansion"],
            expansionStyle: "rapid_aggressive_growth",
            conflictAvoidance: 0.25,
            alliancePreference: 0.40
        }
    },
    
    // Marcus Kane - The Jackal
    marcus_kane: {
        decisionWeights: {
            expand_territory: 0.50,
            fortify_defense: 0.10,
            recruit_members: 0.30,
            form_alliance: 0.15,
            attack_player: 0.70,
            economic_growth: 0.40
        },
        
        responsePatterns: {
            player_attacks_territory: "unpredictable_response",
            player_kills_member: "guerrilla_warfare",
            player_shows_respect: "exploit_perceived_weakness",
            player_betrays: "respect_the_hustle",
            allied_faction_attacked: "capitalize_on_chaos"
        },
        
        growthStrategy: {
            preferredIncome: ["theft", "raids", "opportunistic_heists"],
            expansionStyle: "chaotic_opportunistic",
            conflictAvoidance: 0.05,
            alliancePreference: 0.10
        }
    }
};

// Export all data structures
export default {
    RESPECT_MODIFIERS,
    GANG_ARCHETYPES,
    SPECIAL_EVENTS_CALENDAR,
    RIVAL_AI_PATTERNS
};
