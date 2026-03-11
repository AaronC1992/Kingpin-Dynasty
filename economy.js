/**
 * economy.js
 * 
 * Manages the game's economic systems, including:
 * - Store items (weapons, armor, vehicles)
 * - Real estate properties
 * - Business types and management
 * - Loans and debt
 * - Money laundering mechanics
 */

// Store items — v1.11.0 Rebalance: Prices increased for Omerta-style tight economy
export const storeItems = [
    // === Low-tier Weapons (melee) ===
    { name: 'Brass Knuckles', price: 10000, power: 10, type: 'weapon', durability: 40, maxDurability: 40, description: 'Crude but effective in a street fight. +10 attack power. No ammo needed.' },
    { name: 'Switchblade', price: 16000, power: 20, type: 'weapon', durability: 35, maxDurability: 35, description: 'Quick and concealable. +20 attack power. No ammo needed.' },
    { name: 'Baseball Bat', price: 24000, power: 30, type: 'weapon', durability: 50, maxDurability: 50, description: 'A classic problem-solver. +30 attack power. No ammo needed.' },
    // === Mid-tier Guns ===
    { name: 'Pistol', price: 40000, power: 50, type: 'weapon', durability: 30, maxDurability: 30, description: 'Reliable sidearm for any occasion. +50 attack power. Requires Bullets.' },
    { name: 'Revolver', price: 60000, power: 70, type: 'weapon', durability: 35, maxDurability: 35, description: 'Six shots, six problems solved. +70 attack power. Requires Bullets.' },
    { name: 'Sawed-Off Shotgun', price: 165000, power: 90, type: 'weapon', durability: 25, maxDurability: 25, description: 'Devastating at close range. +90 attack power. Requires Bullets.' },
    { name: 'Tommy Gun', price: 200000, power: 100, type: 'weapon', durability: 20, maxDurability: 20, description: "The kingpin's weapon of choice. +100 attack power. Requires Bullets." },
    { name: 'Sniper Rifle', price: 325000, power: 120, type: 'weapon', durability: 15, maxDurability: 15, description: 'For when you need distance. +120 attack power. Requires Bullets.' },
    // === Armor ===
    { name: 'Leather Jacket', price: 20000, power: 15, type: 'armor', durability: 50, maxDurability: 50, description: 'Looks cool, stops a knife. +15 defense power. Basic protection against melee attacks.' },
    { name: 'Stab Vest', price: 65000, power: 25, type: 'armor', durability: 40, maxDurability: 40, description: 'Lightweight protection from blades. +25 defense power. Reduces damage from melee weapons.' },
    { name: 'Bulletproof Vest', price: 130000, power: 40, type: 'armor', durability: 30, maxDurability: 30, description: 'Standard issue for the paranoid. +40 defense power. Reduces damage from firearms.' },
    { name: 'Reinforced Body Armor', price: 260000, power: 60, type: 'armor', durability: 25, maxDurability: 25, description: 'Military-grade protection. +60 defense power. Best-in-class damage reduction.' },
    // === Supplies ===
    { name: 'Bullets', price: 100000, power: 0, type: 'ammo', description: 'Premium black-market ammunition. Extremely scarce — only 10 rounds hit the streets each day. Required for firearms.' },
    { name: 'Gasoline', price: 50000, power: 0, type: 'gas', description: 'Fuel for your vehicles. Hard to come by on the black market. Required to operate cars and planes. Consumed per use.' },
    // === Utility Items ===
    { name: 'Lockpick Set', price: 15000, power: 0, type: 'utility', description: 'Passively reduces jail time by 5 seconds when arrested.' },
    { name: 'Police Scanner', price: 50000, power: 0, type: 'utility', description: 'Passively reduces heat gain by 20% on every job and combat action while owned.' },
    { name: 'Burner Phone', price: 12000, power: 0, type: 'utility', description: 'Passively reduces suspicion risk by 15% when laundering money while owned.' },
    { name: 'Fake ID Kit', price: 35000, power: 0, type: 'utility', description: 'Passively grants +10% success chance on all jobs while owned. Also required for the Counterfeiting Money job.' },
    // === High-Level Drugs (Trade Goods) ===
    { name: 'Crate Moonshine', price: 75000, power: 0, type: 'highLevelDrug', maxPayout: 100000, requiredVehicle: 'Freight Truck', description: 'Bootleg gold. Trade good worth up to $100,000. Requires a Freight Truck to deliver.' },
    { name: 'Bag of Mary Jane', price: 150000, power: 0, type: 'highLevelDrug', maxPayout: 200000, requiredVehicle: 'Freight Truck', description: 'The green rush. Trade good worth up to $200,000. Requires a Freight Truck to deliver.' },
    { name: 'Pure Cocaine', price: 250000, power: 0, type: 'highLevelDrug', maxPayout: 350000, requiredVehicle: 'Freight Truck', description: 'White gold — high risk, high reward. Trade good worth up to $350,000. Requires a Freight Truck to deliver.' }
];

// Real Estate Properties
export const realEstateProperties = [
    { 
        name: 'Abandoned Warehouse', 
        price: 50000, 
        type: 'hideout', 
        gangCapacity: 3, 
        description: 'A run-down warehouse on the edge of town. Perfect for small operations.',
        power: 30,
        income: 0
    },
    { 
        name: 'Basement Hideout', 
        price: 120000, 
        type: 'hideout', 
        gangCapacity: 5, 
        description: 'A secure underground hideout with multiple escape routes.',
        power: 60,
        income: 250
    },
    { 
        name: 'Criminal Safehouse', 
        price: 300000, 
        type: 'hideout', 
        gangCapacity: 8, 
        description: 'A well-equipped safehouse with advanced security and communications.',
        power: 100,
        income: 750
    },
    { 
        name: 'Underground Bunker', 
        price: 750000, 
        type: 'compound', 
        gangCapacity: 15, 
        description: 'A fortified underground complex for serious criminal enterprises.',
        power: 180,
        income: 2500
    },
    { 
        name: 'Criminal Fortress', 
        price: 1500000, 
        type: 'compound', 
        gangCapacity: 25, 
        description: 'An impenetrable fortress that serves as the ultimate criminal headquarters.',
        power: 300,
        income: 2500
    },
    { 
        name: 'Luxury Penthouse', 
        price: 3000000, 
        type: 'mansion', 
        gangCapacity: 20, 
        description: 'A high-class penthouse that provides legitimacy and luxury for your operations.',
        power: 250,
        income: 4000
    },
    { 
        name: 'Private Island', 
        price: 8000000, 
        type: 'island', 
        gangCapacity: 50, 
        description: 'Your own private island - the ultimate symbol of criminal success.',
        power: 500,
        income: 8000
    },
    { 
        name: 'Back-Alley Clinic', 
        price: 500000, 
        type: 'hospital', 
        gangCapacity: 0, 
        description: 'A discreet medical facility that patches up your crew -- no questions asked. Upgradeable.',
        power: 20,
        income: 0,
        maxLevel: 5,
        upgradeMultiplier: 1.6
    }
];

// Business Management System
export const businessTypes = [
    {
        id: 'restaurant',
        name: 'Family Restaurant',
        description: 'A cozy Italian restaurant perfect for discreet meetings',
        basePrice: 2500000,
        baseIncome: 25000,
        maxLevel: 5,
        upgradeMultiplier: 1.5,
        incomeMultiplier: 1.3,
        launderingCapacity: 200000,
        legitimacy: 85,
        category: 'food'
    },
    {
        id: 'nightclub',
        name: 'Underground Nightclub',
        description: "Where the city's nightlife meets business opportunities",
        basePrice: 5000000,
        baseIncome: 60000,
        maxLevel: 5,
        upgradeMultiplier: 1.8,
        incomeMultiplier: 1.4,
        launderingCapacity: 500000,
        legitimacy: 60,
        category: 'entertainment'
    },
    {
        id: 'laundromat',
        name: '24/7 Laundromat',
        description: 'Clean clothes, cleaner money - everyone wins',
        basePrice: 1500000,
        baseIncome: 15000,
        maxLevel: 3,
        upgradeMultiplier: 1.4,
        incomeMultiplier: 1.2,
        launderingCapacity: 800000,
        legitimacy: 95,
        category: 'service'
    },
    {
        id: 'carwash',
        name: 'Premium Car Wash',
        description: 'Making dirty cars clean since forever',
        basePrice: 3000000,
        baseIncome: 30000,
        maxLevel: 4,
        upgradeMultiplier: 1.6,
        incomeMultiplier: 1.3,
        launderingCapacity: 400000,
        legitimacy: 90,
        category: 'automotive'
    },
    {
        id: 'casino',
        name: 'Private Casino',
        description: 'High stakes, higher rewards, highest risks',
        basePrice: 10000000,
        baseIncome: 125000,
        maxLevel: 5,
        upgradeMultiplier: 2.0,
        incomeMultiplier: 1.3,
        launderingCapacity: 1000000,
        legitimacy: 40,
        category: 'gambling'
    },
    {
        id: 'pawnshop',
        name: 'Discount Pawn Shop',
        description: 'No questions asked, fair prices given',
        basePrice: 2000000,
        baseIncome: 20000,
        maxLevel: 4,
        upgradeMultiplier: 1.5,
        incomeMultiplier: 1.25,
        launderingCapacity: 300000,
        legitimacy: 70,
        category: 'retail'
    },
    {
        id: 'counterfeiting',
        name: 'Counterfeiting Operation',
        description: 'A hidden printing press churning out fake bills — high profit, but the money needs laundering',
        basePrice: 4000000,
        baseIncome: 60000,
        maxLevel: 5,
        upgradeMultiplier: 1.7,
        incomeMultiplier: 1.3,
        launderingCapacity: 0,
        legitimacy: 10,
        category: 'illegal',
        paysDirty: true
    },
    {
        id: 'druglab',
        name: 'Drug Lab',
        description: 'A clandestine lab cooking up product in an abandoned building — massive returns, massive risk',
        basePrice: 6000000,
        baseIncome: 75000,
        maxLevel: 5,
        upgradeMultiplier: 1.8,
        incomeMultiplier: 1.3,
        launderingCapacity: 0,
        legitimacy: 5,
        category: 'illegal',
        paysDirty: true
    },
    {
        id: 'chopshop',
        name: 'Chop Shop',
        description: 'Strip stolen cars for parts and sell them on the black market — pairs well with Boost a Ride',
        basePrice: 3500000,
        baseIncome: 45000,
        maxLevel: 5,
        upgradeMultiplier: 1.6,
        incomeMultiplier: 1.25,
        launderingCapacity: 0,
        legitimacy: 15,
        category: 'illegal',
        paysDirty: true
    }
];

// Money Laundering Methods
// timeRequired is in real-time MINUTES (displayed as "Processing Time")
export const launderingMethods = [
    {
        id: 'casino_chips',
        name: 'Casino Chips',
        description: 'Convert dirty money through gambling chips',
        cleanRate: 0.85, // 85% of money comes out clean
        timeRequired: 2, // 2 minutes real-time
        suspicionRisk: 15, // % chance of raising suspicion
        minAmount: 100000,
        maxAmount: 5000000,
        businessRequired: 'casino'
    },
    {
        id: 'restaurant_sales',
        name: 'Restaurant Revenue',
        description: 'Inflate restaurant sales to clean money',
        cleanRate: 0.90,
        timeRequired: 4, // 4 minutes
        suspicionRisk: 10,
        minAmount: 50000,
        maxAmount: 2000000,
        businessRequired: 'restaurant'
    },
    {
        id: 'cash_business',
        name: 'Cash Business Front',
        description: 'Use cash-heavy businesses to clean money',
        cleanRate: 0.80,
        timeRequired: 6, // 6 minutes
        suspicionRisk: 25,
        minAmount: 200000,
        maxAmount: 10000000,
        requiresAnyBusiness: true // Must own at least one business
    },
    {
        id: 'art_auction',
        name: 'Art Auction',
        description: 'Buy and sell overpriced art to clean large sums',
        cleanRate: 0.75,
        timeRequired: 10, // 10 minutes
        suspicionRisk: 30,
        minAmount: 1000000,
        maxAmount: 50000000,
        minReputation: 40,
        requiresAnyBusiness: true // Must own at least one business
    },
    {
        id: 'offshore_account',
        name: 'Offshore Banking',
        description: 'Move money through international accounts',
        cleanRate: 0.95,
        timeRequired: 15, // 15 minutes
        suspicionRisk: 5,
        minAmount: 5000000,
        maxAmount: 100000000,
        minReputation: 60,
        oneTimeSetupCost: 2500000,
        requiresAnyBusiness: true // Must own at least one business
    }
];
