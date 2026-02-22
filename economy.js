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

// Store items
export const storeItems = [
    // === Low-tier Weapons ===
    { name: "Brass Knuckles", price: 7500, power: 10, type: "weapon", description: "Crude but effective in a street fight. +10 attack power. No ammo needed." },
    { name: "Switchblade", price: 12000, power: 20, type: "weapon", description: "Quick and concealable. +20 attack power. No ammo needed." },
    { name: "Baseball Bat", price: 18000, power: 30, type: "weapon", description: "A classic problem-solver. +30 attack power. No ammo needed." },
    // === Mid-tier Guns ===
    { name: "Pistol", price: 30000, power: 50, type: "gun", description: "Reliable sidearm for any occasion. +50 attack power. Requires Bullets." },
    { name: "Revolver", price: 45000, power: 70, type: "gun", description: "Six shots, six problems solved. +70 attack power. Requires Bullets." },
    { name: "Sawed-Off Shotgun", price: 125000, power: 90, type: "gun", description: "Devastating at close range. +90 attack power. Requires Bullets." },
    { name: "Tommy Gun", price: 150000, power: 100, type: "gun", description: "The kingpin's weapon of choice. +100 attack power. Requires Bullets." },
    { name: "Sniper Rifle", price: 250000, power: 120, type: "gun", description: "For when you need distance. +120 attack power. Requires Bullets." },
    // === Armor ===
    { name: "Leather Jacket", price: 15000, power: 15, type: "armor", description: "Looks cool, stops a knife. +15 defense power. Basic protection against melee attacks." },
    { name: "Stab Vest", price: 50000, power: 25, type: "armor", description: "Lightweight protection from blades. +25 defense power. Reduces damage from melee weapons." },
    { name: "Bulletproof Vest", price: 100000, power: 40, type: "armor", description: "Standard issue for the paranoid. +40 defense power. Reduces damage from firearms." },
    { name: "Reinforced Body Armor", price: 200000, power: 60, type: "armor", description: "Military-grade protection. +60 defense power. Best-in-class damage reduction." },
    // === Vehicles ===
    { name: "Armored Car", price: 120000, power: 25, type: "car", description: "Bulletproof windows, reinforced frame. +25 power. Requires Gasoline to operate." },
    { name: "Luxury Automobile", price: 400000, power: 50, type: "car", description: "Travel in style and power. +50 power. Requires Gasoline. Boosts respect." },
    { name: "Private Airplane", price: 1500000, power: 200, type: "vehicle", description: "Leave the country at a moment's notice. +200 power. Requires Gasoline. Unlocks escape options." },
    // === Supplies ===
    { name: "Bullets", price: 2500, power: 0, type: "ammo", description: "Standard ammunition. Required to use firearms in combat. Stock up before a fight." },
    { name: "Gasoline", price: 4000, power: 0, type: "gas", description: "Fuel for your vehicles. Required to operate cars and planes. Consumed per use." },
    // === Energy Items ===
    { name: "Strong Coffee", price: 800, power: 0, type: "energy", energyRestore: 15, description: "Cheap caffeine boost. Restores 15 energy instantly." },
    { name: "Energy Drink", price: 1500, power: 0, type: "energy", energyRestore: 30, description: "Chemical energy, slight health risk. Restores 30 energy instantly." },
    { name: "Steroids", price: 5000, power: 0, type: "energy", energyRestore: 60, description: "Serious boost, serious risk. Restores 60 energy instantly." },
    // === Utility Items ===
    { name: "Lockpick Set", price: 10000, power: 5, type: "utility", description: "Boosts stealth job success. +5 stealth power." },
    { name: "Police Scanner", price: 35000, power: 0, type: "utility", description: "Reduces wanted level gain by 10%." },
    { name: "Burner Phone", price: 8000, power: 0, type: "utility", description: "Reduces suspicion from laundering by 15%." },
    { name: "Fake ID Kit", price: 25000, power: 0, type: "utility", description: "Reduces jail time by 1 day if caught." },
    // === High-Level Drugs (Trade Goods) ===
    { name: "Crate Moonshine", price: 60000, power: 0, type: "highLevelDrug", maxPayout: 100000, requiredVehicle: "Freight Truck", description: "Bootleg gold. Trade good worth up to $100,000. Requires a Freight Truck to deliver." },
    { name: "Bag of Mary Jane", price: 120000, power: 0, type: "highLevelDrug", maxPayout: 200000, requiredVehicle: "Freight Truck", description: "The green rush. Trade good worth up to $200,000. Requires a Freight Truck to deliver." },
    { name: "Pure Cocaine", price: 200000, power: 0, type: "highLevelDrug", maxPayout: 350000, requiredVehicle: "Freight Truck", description: "White gold — high risk, high reward. Trade good worth up to $350,000. Requires a Freight Truck to deliver." }
];

// Real Estate Properties
export const realEstateProperties = [
    { 
        name: "Abandoned Warehouse", 
        price: 50000, 
        type: "hideout", 
        gangCapacity: 3, 
        description: "A run-down warehouse on the edge of town. Perfect for small operations.",
        power: 30,
        income: 0
    },
    { 
        name: "Basement Hideout", 
        price: 120000, 
        type: "hideout", 
        gangCapacity: 5, 
        description: "A secure underground hideout with multiple escape routes.",
        power: 60,
        income: 500
    },
    { 
        name: "Criminal Safehouse", 
        price: 300000, 
        type: "hideout", 
        gangCapacity: 8, 
        description: "A well-equipped safehouse with advanced security and communications.",
        power: 100,
        income: 1500
    },
    { 
        name: "Underground Bunker", 
        price: 750000, 
        type: "compound", 
        gangCapacity: 15, 
        description: "A fortified underground complex for serious criminal enterprises.",
        power: 180,
        income: 5000
    },
    { 
        name: "Criminal Fortress", 
        price: 1500000, 
        type: "compound", 
        gangCapacity: 25, 
        description: "An impenetrable fortress that serves as the ultimate criminal headquarters.",
        power: 300,
        income: 12000
    },
    { 
        name: "Luxury Penthouse", 
        price: 3000000, 
        type: "mansion", 
        gangCapacity: 20, 
        description: "A high-class penthouse that provides legitimacy and luxury for your operations.",
        power: 250,
        income: 20000
    },
    { 
        name: "Private Island", 
        price: 8000000, 
        type: "island", 
        gangCapacity: 50, 
        description: "Your own private island - the ultimate symbol of criminal success.",
        power: 500,
        income: 50000
    }
];

// Business Management System
export const businessTypes = [
    {
        id: "restaurant",
        name: "Family Restaurant",
        description: "A cozy Italian restaurant perfect for discreet meetings",
        basePrice: 2500000,
        baseIncome: 50000,
        maxLevel: 5,
        upgradeMultiplier: 1.5,
        incomeMultiplier: 1.3,
        launderingCapacity: 200000,
        legitimacy: 85,
        category: "food"
    },
    {
        id: "nightclub",
        name: "Underground Nightclub",
        description: "Where the city's nightlife meets business opportunities",
        basePrice: 5000000,
        baseIncome: 120000,
        maxLevel: 5,
        upgradeMultiplier: 1.8,
        incomeMultiplier: 1.4,
        launderingCapacity: 500000,
        legitimacy: 60,
        category: "entertainment"
    },
    {
        id: "laundromat",
        name: "24/7 Laundromat",
        description: "Clean clothes, cleaner money - everyone wins",
        basePrice: 1500000,
        baseIncome: 30000,
        maxLevel: 3,
        upgradeMultiplier: 1.4,
        incomeMultiplier: 1.2,
        launderingCapacity: 800000,
        legitimacy: 95,
        category: "service"
    },
    {
        id: "carwash",
        name: "Premium Car Wash",
        description: "Making dirty cars clean since forever",
        basePrice: 3000000,
        baseIncome: 60000,
        maxLevel: 4,
        upgradeMultiplier: 1.6,
        incomeMultiplier: 1.3,
        launderingCapacity: 400000,
        legitimacy: 90,
        category: "automotive"
    },
    {
        id: "casino",
        name: "Private Casino",
        description: "High stakes, higher rewards, highest risks",
        basePrice: 10000000,
        baseIncome: 250000,
        maxLevel: 5,
        upgradeMultiplier: 2.0,
        incomeMultiplier: 1.6,
        launderingCapacity: 1000000,
        legitimacy: 40,
        category: "gambling"
    },
    {
        id: "pawnshop",
        name: "Discount Pawn Shop",
        description: "No questions asked, fair prices given",
        basePrice: 2000000,
        baseIncome: 40000,
        maxLevel: 4,
        upgradeMultiplier: 1.5,
        incomeMultiplier: 1.25,
        launderingCapacity: 300000,
        legitimacy: 70,
        category: "retail"
    },
    {
        id: "counterfeiting",
        name: "Counterfeiting Operation",
        description: "A hidden printing press churning out fake bills — high profit, but the money needs laundering",
        basePrice: 4000000,
        baseIncome: 180000,
        maxLevel: 5,
        upgradeMultiplier: 1.7,
        incomeMultiplier: 1.5,
        launderingCapacity: 0,
        legitimacy: 10,
        category: "illegal",
        paysDirty: true
    },
    {
        id: "druglab",
        name: "Drug Lab",
        description: "A clandestine lab cooking up product in an abandoned building — massive returns, massive risk",
        basePrice: 6000000,
        baseIncome: 220000,
        maxLevel: 5,
        upgradeMultiplier: 1.8,
        incomeMultiplier: 1.5,
        launderingCapacity: 0,
        legitimacy: 5,
        category: "illegal",
        paysDirty: true
    },
    {
        id: "chopshop",
        name: "Chop Shop",
        description: "Strip stolen cars for parts and sell them on the black market — pairs well with Boost a Ride",
        basePrice: 3500000,
        baseIncome: 140000,
        maxLevel: 5,
        upgradeMultiplier: 1.6,
        incomeMultiplier: 1.4,
        launderingCapacity: 0,
        legitimacy: 15,
        category: "illegal",
        paysDirty: true
    }
];

// Loan Shark System
export const loanOptions = [
    {
        id: "small_loan",
        name: "Small Loan",
        amount: 500000,
        interestRate: 0.15, // 15% weekly
        duration: 7, // days
        description: "Quick cash for immediate needs",
        riskLevel: "low",
        collateralRequired: false
    },
    {
        id: "medium_loan",
        name: "Business Loan",
        amount: 2500000,
        interestRate: 0.20, // 20% weekly
        duration: 14, // days
        description: "Expand your operations with serious capital",
        riskLevel: "medium",
        collateralRequired: true,
        minReputation: 20
    },
    {
        id: "large_loan",
        name: "High Roller Loan",
        amount: 10000000,
        interestRate: 0.25, // 25% weekly
        duration: 21, // days
        description: "Big money for big moves - don't default",
        riskLevel: "high",
        collateralRequired: true,
        minReputation: 50,
        minPower: 200
    },
    {
        id: "emergency_loan",
        name: "Emergency Cash",
        amount: 200000,
        interestRate: 0.30, // 30% weekly (predatory)
        duration: 3, // days
        description: "Desperate times call for desperate measures",
        riskLevel: "extreme",
        collateralRequired: false,
        maxLoans: 1 // Can only have one at a time
    }
];

// Money Laundering Methods
export const launderingMethods = [
    {
        id: "casino_chips",
        name: "Casino Chips",
        description: "Convert dirty money through gambling chips",
        cleanRate: 0.85, // 85% of money comes out clean
        timeRequired: 2, // hours
        suspicionRisk: 15, // % chance of raising suspicion
        minAmount: 100000,
        maxAmount: 5000000,
        energyCost: 10,
        businessRequired: "casino"
    },
    {
        id: "restaurant_sales",
        name: "Restaurant Revenue",
        description: "Inflate restaurant sales to clean money",
        cleanRate: 0.90,
        timeRequired: 4,
        suspicionRisk: 10,
        minAmount: 50000,
        maxAmount: 2000000,
        energyCost: 15,
        businessRequired: "restaurant"
    },
    {
        id: "cash_business",
        name: "Cash Business Front",
        description: "Use cash-heavy businesses to clean money",
        cleanRate: 0.80,
        timeRequired: 6,
        suspicionRisk: 25,
        minAmount: 200000,
        maxAmount: 10000000,
        energyCost: 20,
        businessRequired: null // Any business works
    },
    {
        id: "art_auction",
        name: "Art Auction",
        description: "Buy and sell overpriced art to clean large sums",
        cleanRate: 0.75,
        timeRequired: 24,
        suspicionRisk: 30,
        minAmount: 1000000,
        maxAmount: 50000000,
        energyCost: 30,
        minReputation: 40
    },
    {
        id: "offshore_account",
        name: "Offshore Banking",
        description: "Move money through international accounts",
        cleanRate: 0.95,
        timeRequired: 48,
        suspicionRisk: 5,
        minAmount: 5000000,
        maxAmount: 100000000,
        energyCost: 25,
        minReputation: 60,
        oneTimeSetupCost: 2500000
    }
];
