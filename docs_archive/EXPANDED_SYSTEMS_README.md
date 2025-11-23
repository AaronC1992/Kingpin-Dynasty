# EXPANDED SYSTEMS - Feature Documentation

## Overview

This update adds **7 major gameplay systems** that dramatically expand "From Dusk to Don" without replacing any existing mechanics. All new features are optional and can be toggled in the configuration.

---

## 1. 🎯 Gang Member Roles, Stats & Traits

### What's New
Gang members now have **unique roles**, **detailed stats**, and **special perks** that affect their effectiveness in different tasks.

### Features
- **7 Unique Roles:**
  - 💪 **Bruiser** - Muscle for combat (Reduces arrest chance on violent jobs by 10%)
  - 🤝 **Fixer** - Smooth talker (Reduces heat gain by 15%)
  - 💻 **Hacker** - Tech wizard (+20% success on intelligence jobs)
  - 🔫 **Enforcer** - Professional killer (+15% damage in territory wars)
  - 🚗 **Wheelman** - Master driver (+25% escape chance when heat is high)
  - 👁️ **Scout** - Intelligence expert (Reveals territory attack warnings early)
  - 📊 **Accountant** - Numbers genius (+10% income from businesses and territories)

- **4 Core Stats:**
  - Violence (combat effectiveness)
  - Stealth (covert operations)
  - Intelligence (planning & hacking)
  - Loyalty (0-100, affects betrayal chance)

- **Random Traits:**
  - Hothead, Cool Under Pressure, Loyal to the End, Greedy, Cautious, Reckless, Charming, Paranoid, Veteran, Greenhorn

- **Status System:**
  - Active, Injured (heals in 5 minutes), Jailed, Dead

### How to Use
1. Navigate to **👥 Crew Details** from main menu
2. Recruit new members with randomized roles
3. View each member's stats, perks, and traits
4. Assign members to territories or operations
5. Loyalty decreases with defeats, increases with victories

### Integration
- Existing gang members are preserved
- New recruits automatically get role assignments
- Stats affect job success rates across the game
- Role perks apply passively to all relevant actions

---

## 2. 🗺️ Territory Wars & Defense System

### What's New
**5 conquerable territories** with defense mechanics, fortifications, and rival AI attacks.

### Features
- **5 Territories:**
  - Downtown District (High value, high risk) - $5,000/day
  - The Docks (Smuggling hub) - $3,500/day
  - Suburban Rackets (Safe income) - $2,000/day
  - Industrial Zone (Warehouses) - $4,000/day
  - Casino District (Gambling) - $6,000/day

- **Defense System:**
  - Assign gang members to defend territories
  - Defense strength = Member stats + Fortification level × 10
  - Role bonuses: Enforcers +15%, Bruisers +10%, Scouts +5%

- **Fortifications:**
  - Costs $10,000 per level
  - Each level adds +10 base defense

- **Attack Outcomes:**
  - **Victory:** Earn bonus money + respect, defenders gain loyalty
  - **Defeat:** Lose territory, casualties/injuries/arrests possible, defenders lose loyalty

### How to Use
1. Open **🗺️ Territory Map** from main menu
2. Claim neutral territories (costs = base income)
3. Click **👥 Manage Defenders** to assign gang members
4. Fortify territories for extra defense
5. Monitor for rival attacks (alerts appear automatically)

### Integration
- Works alongside existing territory system
- New `player.territoriesEx` array tracks detailed territory data
- Rival AI attacks occur every 2 minutes (configurable)

---

## 3. 🎲 Interactive Random Events

### What's New
**Choice-based events** that present 2-4 options with different outcomes, replacing simple random events.

### Features
- **Event Types:**
  - 🚨 Police Raid (fight, bribe, or cooperate)
  - 🐍 Whispers of Betrayal (investigate, ignore, or make an example)
  - 📰 Rival Boss Scandal (blackmail, help, or leak)
  - 🔫 Black Market Arms Deal (buy, hijack, or pass)
  - 👁️ Witness to Eliminate (send hitter, intimidate, or relocate)

- **Choice Requirements:**
  - Money thresholds
  - Gang member count
  - Skill checks (Violence, Intelligence, Charisma)

- **Dynamic Outcomes:**
  - Success/failure based on % chance
  - Affects money, heat, respect, loyalty, gang size
  - Can trigger jail, injuries, or gang member losses

### How to Use
- Events trigger automatically every 5 minutes (20% chance)
- Alert appears with event description
- Choose from available options (grayed out if requirements not met)
- See immediate outcome with all effects listed

### Integration
- Tracked in `player.interactiveEvents`
- Cooldown system prevents spam (5 minutes minimum between events)
- Can be disabled in config (`interactiveEventsEnabled: false`)

---

## 4. 🎯 Rival AI Kingpins

### What's New
**5 AI-controlled rival bosses** who grow their empires, control territories, and attack you.

### Features
- **Rival Bosses:**
  - Don Vittorio Torrino (Traditional, Old School Tactics)
  - Yuri Kozlov (Ruthless, Brutal Efficiency)
  - Chen Wei (Strategic, Financial Genius)
  - Isabella Morales (Expanding, Network Expansion)
  - Marcus "The Jackal" Kane (Opportunistic, Guerrilla Warfare)

- **AI Behaviors:**
  - Recruit gang members
  - Claim neutral territories
  - Attack player territories (based on aggressiveness rating)
  - Collect income from territories
  - Increase power over time

- **Rival Stats:**
  - Power Rating (combat strength)
  - Gang Size (member count)
  - Wealth (money pool)
  - Aggressiveness (40%-90%, determines attack frequency)
  - Territories Controlled

### How to Use
1. Open **🎯 Crime Board** from main menu
2. View all rival bosses and their stats
3. Track their territory count and power rating
4. Check your respect level with each rival
5. Defend against their attacks (automatic alerts)

### Integration
- Rivals turn every 2 minutes (configurable in `rivalGrowthInterval`)
- Territory attacks trigger `processTerritoryAttack()` function
- Results shown via alert + event log
- Stored in `player.rivalKingpins` array

---

## 5. 🏛️ Permanent Legacy Perks

### What's New
**Roguelike progression system** - earn Legacy Points on retirement, spend them on permanent bonuses for future runs.

### Features
- **10 Legacy Perks:**
  - 📈 Hustler's Edge (+15% XP gain) - 100 LP
  - 👥 Family Ties (Start with 3 loyal gang members) - 150 LP
  - 💰 Laundering Genius (25% faster, 10% less loss) - 200 LP
  - 🧊 Heat Resistant (Heat decays 50% faster) - 175 LP
  - 👑 Natural Leader (+5 max gang capacity) - 125 LP
  - 🧠 Strategic Mind (+10% job success) - 250 LP
  - 💵 Old Money (Start with $10,000) - 200 LP
  - 🔓 Iron Will (+25% breakout success) - 150 LP
  - ⭐ Master Recruiter (Recruits have +5 all stats) - 225 LP
  - 🏙️ Territory Expert (+20% territory income) - 175 LP

- **Legacy Point Calculation:**
  - 1 LP per $10,000 (max 500 from wealth)
  - 50 LP per territory controlled
  - 5 LP per active gang member
  - 1 LP per 10 respect (max 200)
  - 10 LP per player level
  - 25 LP per business owned

### How to Use
1. During retirement, Legacy Points are calculated automatically
2. Open **🏛️ Legacy Perks** from main menu
3. Spend available points on unlocks
4. Perks apply immediately on new game start
5. Points carry across multiple retirements

### Integration
- Stored in `player.legacy.permanentPerks` array
- Points tracked in `player.legacy.availableLegacyPoints`
- Applied via `applyLegacyPerks()` on game initialization
- Works with existing legacy/retirement system

---

## 6. 💎 The Don's Vault (Collectibles)

### What's New
**Collection system** with 4 categories of rare items found through events, missions, and purchases.

### Features
- **4 Categories:**
  - 🏎️ **Rare Vehicles** (4 items)
    - 1959 Cadillac Eldorado (Legendary) - $150,000
    - Armored Limousine (Epic) - $85,000
    - Ferrari 250 GT (Rare) - $120,000
    - Dodge Charger R/T (Uncommon) - $45,000
  
  - 🔫 **Exotic Weapons** (4 items)
    - Gold-Plated Tommy Gun (Legendary) - $75,000
    - Antique .44 Magnum (Epic) - $35,000
    - Suppressed Walther PPK (Rare) - $25,000
    - Lupara Shotgun (Uncommon) - $15,000
  
  - 🖼️ **Fine Art** (4 items)
    - Stolen Vermeer Painting (Legendary) - $500,000
    - Renaissance Sculpture (Epic) - $200,000
    - Modern Art Piece (Rare) - $75,000
    - Vintage Family Portrait (Uncommon) - $30,000
  
  - 💎 **Luxury Items** (4 items)
    - The Hope Diamond Replica (Legendary) - $250,000
    - Solid Gold Rolex (Epic) - $85,000
    - Pre-Embargo Cuban Cigars (Rare) - $15,000
    - 1920s Prohibition Whiskey (Uncommon) - $8,000

- **Rarity System:**
  - Legendary (Orange) - Ultra rare
  - Epic (Purple) - Very rare
  - Rare (Blue) - Uncommon
  - Uncommon (Green) - Common

### How to Use
1. Acquire collectibles through:
   - Interactive event outcomes
   - Mission rewards
   - Special purchases from black market
2. Open **💎 Don's Vault** from main menu
3. View collection progress (X/16 items)
4. Locked items show as "???"
5. Track completion percentage

### Integration
- Stored in `player.vault` object with 4 category arrays
- Items added via `ExpandedSystems.addCollectible(player, category, itemId)`
- Completion tracked for potential achievements
- No duplicates allowed

---

## 7. ⭐ Respect-Based Relationships

### What's New
**Dynamic faction system** replacing binary trust with -100 to +100 respect scores.

### Features
- **Relationship Targets:**
  - 4 Crime Families (Torrino, Kozlov, Chen, Morales)
  - 5 Rival Kingpins
  - Police Department (starts at -20)
  - Civilians
  - Criminal Underground

- **Respect Tiers:**
  - **Allied (60-100):** 20% discounts, 30% better jobs, 25% help chance, exclusive missions
  - **Friendly (20-59):** 10% discounts, 10% better jobs, 10% help chance
  - **Neutral (-19 to 19):** No modifiers
  - **Hostile (-20 to -59):** 20% markup, 15% sabotage chance
  - **Enemy (-60 to -100):** 50% markup, 35% attack chance, limited access

- **Respect Changes:**
  - Actions affect respect with relevant factions
  - Natural decay toward neutral over time (5% per period)
  - Event choices can boost or tank relationships

### How to Use
1. Open **⭐ Relationships** from main menu
2. View respect levels with all factions/rivals
3. Color-coded bars show relationship status
4. Perform actions to increase/decrease respect
5. High respect unlocks special faction missions

### Integration
- Stored in `player.relationships` object
- Modified via `ExpandedSystems.modifyRespect(player, targetId, change, reason)`
- Replaces binary `player.criminalFaction` trust system
- Effects calculated in `calculateRespectEffects()`
- Decay processed via `processRespectDecay(player)` timer

---

## Configuration

All systems can be toggled in `expanded-systems.js`:

```javascript
export const EXPANDED_SYSTEMS_CONFIG = {
    gangRolesEnabled: true,           // Gang member roles & stats
    territoryWarsEnabled: true,       // Territory defense & attacks
    interactiveEventsEnabled: true,   // Choice-based events
    rivalKingpinsEnabled: true,       // AI rival bosses
    legacyPerksEnabled: true,         // Permanent progression
    collectiblesEnabled: true,        // The Don's Vault
    respectSystemEnabled: true,       // -100 to +100 relationships
    
    rivalGrowthInterval: 120000,      // 2 minutes between rival turns
    territoryAttackChance: 0.15,      // 15% attack chance per check
    legacyPointsMultiplier: 1.0,      // Adjust legacy point rewards
    respectDecayRate: 0.95,           // Respect decay speed
};
```

---

## Technical Details

### File Structure
- `expanded-systems.js` - Core logic for all 7 systems
- `expanded-ui.js` - UI screens and components
- `expanded-styles.css` - Styles for new interfaces
- Integration in `game.js` via imports and initialization

### Data Storage
All new data is stored in the existing `player` object:
- `player.gang.gangMembers[]` - Enhanced with roles/stats
- `player.territoriesEx[]` - New territory array
- `player.rivalKingpins[]` - AI rival data
- `player.legacy.permanentPerks[]` - Unlocked perks
- `player.vault{}` - Collectible categories
- `player.relationships{}` - Respect scores
- `player.interactiveEvents{}` - Event tracking

### Backward Compatibility
- Old saves load without errors
- Legacy gang member format preserved
- New systems initialize on first load
- Config flags allow disabling any feature

---

## Future Expansion Ideas

Potential additions:
- Gang member training/leveling system
- Territory upgrade buildings (casinos, warehouses, etc.)
- More interactive event types (20+ total)
- Rival boss faction missions
- Legendary items with unique effects
- Relationship-based ending variations
- Tournament/competition modes

---

## Credits

Designed and implemented to expand "From Dusk to Don" while preserving all existing mechanics. All 7 systems integrate seamlessly with the original game loop.

**Version:** 1.0  
**Date:** 2025  
**Author:** GitHub Copilot (AI Assistant)
