// Centralized balancing configuration
// Exposes window.GameBalance for classic script usage
(function(){
  const jobs = {
    streetSoldier: { payoutMin: 1000, payoutMax: 5000, jailChance: 5, wantedLevelGain: 1, healthLoss: 0, reputation: 0, energyCost: 1 },
    boostRide: { payoutMin: 0, payoutMax: 0, jailChance: 40, wantedLevelGain: 3, healthLoss: 5, reputation: 0, energyCost: 5 },
    storeHeist: { payoutMin: 20000, payoutMax: 40000, jailChance: 30, wantedLevelGain: 4, healthLoss: 10, reputation: 10, energyCost: 10 },
    bootlegRun: { payoutMin: 40000, payoutMax: 80000, jailChance: 25, wantedLevelGain: 3, healthLoss: 5, reputation: 15, energyCost: 12 },
    speakeasySupply: { payoutMin: 80000, payoutMax: 160000, jailChance: 35, wantedLevelGain: 5, healthLoss: 8, reputation: 25, energyCost: 15 },
    whitePowder: { payoutMin: 160000, payoutMax: 300000, jailChance: 45, wantedLevelGain: 8, healthLoss: 15, reputation: 40, energyCost: 20 },
    protectionCollection: { payoutMin: 10000, payoutMax: 25000, jailChance: 20, wantedLevelGain: 3, healthLoss: 8, reputation: 12, energyCost: 8 },
    bankJob: { payoutMin: 100000, payoutMax: 250000, jailChance: 50, wantedLevelGain: 10, healthLoss: 20, reputation: 35, energyCost: 25 },
    hitOnRival: { payoutMin: 60000, payoutMax: 120000, jailChance: 40, wantedLevelGain: 6, healthLoss: 25, reputation: 30, energyCost: 18 },
    luxuryCarRing: { payoutMin: 80000, payoutMax: 160000, jailChance: 30, wantedLevelGain: 4, healthLoss: 5, reputation: 20, energyCost: 15 },
    crossBorderSmuggling: { payoutMin: 200000, payoutMax: 400000, jailChance: 35, wantedLevelGain: 7, healthLoss: 10, reputation: 50, energyCost: 30 },
    turfWar: { payoutMin: 40000, payoutMax: 100000, jailChance: 45, wantedLevelGain: 5, healthLoss: 30, reputation: 25, energyCost: 20 },
    undergroundBoxing: { payoutMin: 30000, payoutMax: 70000, jailChance: 25, wantedLevelGain: 2, healthLoss: 40, reputation: 18, energyCost: 12 },
    illegalGamblingDen: { payoutMin: 120000, payoutMax: 240000, jailChance: 30, wantedLevelGain: 4, healthLoss: 5, reputation: 35, energyCost: 22 },
    moneyLaundering: { payoutMin: 1600, payoutMax: 3000, jailChance: 20, wantedLevelGain: 3, healthLoss: 0, reputation: 45, energyCost: 25 },
    internationalArmsTrade: { payoutMin: 500000, payoutMax: 1000000, jailChance: 60, wantedLevelGain: 12, healthLoss: 10, reputation: 60, energyCost: 35 },
    takeOverCity: { payoutMin: 2000000, payoutMax: 5000000, jailChance: 70, wantedLevelGain: 15, healthLoss: 20, reputation: 80, energyCost: 40 }
  };

  window.GameBalance = { jobs };
})();
