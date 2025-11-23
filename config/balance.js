/**
 * balance.js - Game Balancing Configuration
 * 
 * Central repository for all game balance values including:
 * - Job payouts, risks, and energy costs
 * - Faction mission rewards and requirements
 * - Territory expansion costs and benefits
 * - Boss battle stats and rewards
 * - XP and progression curves
 * 
 * IMPORTANT: Tweak these values to adjust game difficulty and progression.
 * All monetary values, chances, and costs should be defined here, not hardcoded in game logic.
 */

(function(){
  // ==================== CORE PROGRESSION ====================
  
  /**
   * XP required per level (formula: level * 150)
   * Increased multiplier to slow down leveling and make progression more of a grind.
   */
  const xpPerLevel = (level) => level * 150;
  
  /**
   * Base energy regeneration rate (seconds per 1 energy point)
   * Lower = faster regeneration. Increased to slow down pacing.
   */
  const energyRegenRate = 90; // 1 energy per 90 seconds
  
  /**
   * Jail base duration and mechanics
   */
  const jail = {
    baseDuration: 120, // seconds
    breakoutBaseChance: 45, // percent
    maxBreakoutAttempts: 3,
    durationMultiplier: 1.5 // multiplier per wanted level
  };
  
  // ==================== JOBS ====================
  
  /**
   * Job configuration
   * Each job has: payoutMin/Max, jailChance, wantedLevelGain, healthLoss, reputation, energyCost
   * 
   * BALANCING TIPS:
   * - Higher payouts should have higher risks (jail chance, health loss)
   * - Energy costs prevent job spam
   * - Reputation gates progression to harder content
   */
  const jobs = {
    // Early game: lower payouts, slightly higher energy to slow snowballing
    streetSoldier: { payoutMin: 700, payoutMax: 3500, jailChance: 7, wantedLevelGain: 1, healthLoss: 0, reputation: 0, energyCost: 2 },
    boostRide: { payoutMin: 0, payoutMax: 0, jailChance: 40, wantedLevelGain: 3, healthLoss: 5, reputation: 0, energyCost: 6 },
    storeHeist: { payoutMin: 14000, payoutMax: 28000, jailChance: 32, wantedLevelGain: 4, healthLoss: 10, reputation: 10, energyCost: 12 },
    bootlegRun: { payoutMin: 28000, payoutMax: 56000, jailChance: 27, wantedLevelGain: 3, healthLoss: 5, reputation: 15, energyCost: 14 },
    speakeasySupply: { payoutMin: 56000, payoutMax: 120000, jailChance: 37, wantedLevelGain: 5, healthLoss: 8, reputation: 25, energyCost: 18 },
    whitePowder: { payoutMin: 120000, payoutMax: 240000, jailChance: 48, wantedLevelGain: 8, healthLoss: 15, reputation: 40, energyCost: 24 },
    protectionCollection: { payoutMin: 7000, payoutMax: 20000, jailChance: 22, wantedLevelGain: 3, healthLoss: 8, reputation: 12, energyCost: 10 },
    bankJob: { payoutMin: 75000, payoutMax: 200000, jailChance: 52, wantedLevelGain: 10, healthLoss: 20, reputation: 35, energyCost: 30 },
    hitOnRival: { payoutMin: 45000, payoutMax: 100000, jailChance: 42, wantedLevelGain: 6, healthLoss: 25, reputation: 30, energyCost: 22 },
    luxuryCarRing: { payoutMin: 60000, payoutMax: 130000, jailChance: 32, wantedLevelGain: 4, healthLoss: 5, reputation: 20, energyCost: 18 },
    crossBorderSmuggling: { payoutMin: 150000, payoutMax: 320000, jailChance: 38, wantedLevelGain: 7, healthLoss: 10, reputation: 50, energyCost: 36 },
    turfWar: { payoutMin: 30000, payoutMax: 80000, jailChance: 48, wantedLevelGain: 5, healthLoss: 30, reputation: 25, energyCost: 24 },
    undergroundBoxing: { payoutMin: 22000, payoutMax: 55000, jailChance: 28, wantedLevelGain: 2, healthLoss: 40, reputation: 18, energyCost: 14 },
    illegalGamblingDen: { payoutMin: 90000, payoutMax: 200000, jailChance: 32, wantedLevelGain: 4, healthLoss: 5, reputation: 35, energyCost: 26 },
    moneyLaundering: { payoutMin: 1200, payoutMax: 2400, jailChance: 22, wantedLevelGain: 3, healthLoss: 0, reputation: 45, energyCost: 30 },
    // Late game: bigger numbers but more expensive and rarer so players grind longer
    internationalArmsTrade: { payoutMin: 375000, payoutMax: 800000, jailChance: 62, wantedLevelGain: 12, healthLoss: 10, reputation: 60, energyCost: 45 },
    takeOverCity: { payoutMin: 1500000, payoutMax: 4000000, jailChance: 72, wantedLevelGain: 15, healthLoss: 20, reputation: 80, energyCost: 55 }
  };
  
  // ==================== FACTION MISSIONS ====================
  
  /**
   * Faction-specific missions with reputation requirements
   * Higher tier missions require better faction standing
   */
  const factionMissions = {
    torrino_0: { payoutMin: 200000, payoutMax: 350000, jailChance: 5, energyCost: 8, reputation: 5, factionRep: 3 },
    torrino_1: { payoutMin: 300000, payoutMax: 600000, jailChance: 20, energyCost: 15, reputation: 10, factionRep: 5 },
    torrino_2: { payoutMin: 500000, payoutMax: 1000000, jailChance: 30, energyCost: 20, reputation: 25, factionRep: 10 },
    kozlov_0: { payoutMin: 200000, payoutMax: 400000, jailChance: 10, energyCost: 10, reputation: 5, factionRep: 3 },
    kozlov_1: { payoutMin: 800000, payoutMax: 1200000, jailChance: 35, energyCost: 25, reputation: 20, factionRep: 8 },
    kozlov_2: { payoutMin: 1500000, payoutMax: 2500000, jailChance: 45, energyCost: 35, reputation: 50, factionRep: 15 },
    chen_0:    { payoutMin: 300000, payoutMax: 500000, jailChance: 5, energyCost: 8, reputation: 5, factionRep: 4 },
    chen_1:    { payoutMin: 600000, payoutMax: 1100000, jailChance: 25, energyCost: 20, reputation: 30, factionRep: 10 },
    morales_0: { payoutMin: 250000, payoutMax: 450000, jailChance: 15, energyCost: 12, reputation: 8, factionRep: 5 },
    morales_1: { payoutMin: 700000, payoutMax: 1300000, jailChance: 40, energyCost: 30, reputation: 35, factionRep: 12 }
  };
  
  // ==================== TERRITORY & EXPANSION ====================
  
  /**
   * Territory missions require gang members and provide passive income
   */
  const territoryMissions = {
    // Reduced passive income to slow long-term snowballing and make territory grindier
    docks_expansion: { requiredGangMembers: 5, energyCost: 30, rewards: { money: 1600000, territory: 1, reputation: 15, passive_income: 60000 }, risks: { jailChance: 38, gangMemberLoss: 15, healthLoss: 20 } },
    downtown_expansion: { requiredGangMembers: 8, energyCost: 40, rewards: { money: 3200000, territory: 2, reputation: 25, passive_income: 120000 }, risks: { jailChance: 48, gangMemberLoss: 25, healthLoss: 30 } },
    suburbs_expansion: { requiredGangMembers: 3, energyCost: 20, rewards: { money: 1200000, territory: 1, reputation: 10, passive_income: 50000 }, risks: { jailChance: 28, gangMemberLoss: 10, healthLoss: 15 } }
  };
  
  // ==================== BOSS BATTLES ====================
  
  /**
   * High-stakes encounters with rival bosses
   * Require minimum power, gang size, and reputation
   */
  const bossBattles = {
    rival_boss_santos: {
      boss: { power: 150, health: 200, gang_size: 12 },
      requirements: { minPower: 100, minGangMembers: 8, minReputation: 40 },
      energyCost: 50,
      rewards: { money: 8000000, reputation: 35, territory: 2, experience: 500 },
      risks: { jailChance: 60, gangMemberLoss: 30, healthLoss: 50 }
    },
    police_chief_morrison: {
      boss: { power: 120, health: 150, gang_size: 20 },
      requirements: { minPower: 80, minGangMembers: 6, minReputation: 30 },
      energyCost: 40,
      rewards: { money: 6000000, reputation: 30, experience: 400, wanted_level_reduction: 20 },
      risks: { jailChance: 70, gangMemberLoss: 25, healthLoss: 40 }
    }
  };
  
  // ==================== EXPORT CONFIGURATION ====================
  
  // Expose globally for classic script usage
  window.GameBalance = { 
    // Core systems
    xpPerLevel,
    energyRegenRate,
    jail,
    // Content
    jobs, 
    factionMissions, 
    territoryMissions, 
    bossBattles 
  };
})();