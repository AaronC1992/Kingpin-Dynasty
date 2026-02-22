# Kingpin Dynasty

A deep criminal empire-building game where you rise from street thug to legendary kingpin. Features a full progression system with jobs, gangs, territories, businesses, skill trees, boss battles, faction politics, mini-games, and both local and online multiplayer.

## 🎮 **[PLAY NOW - Live Demo](https://aaronc1992.github.io/Kingpin-Dynasty/)**

Click the link above to play the game instantly in your browser — no installation required!

---

## 🎮 Core Gameplay

### Character Creation
- Choose your **name**, **gender**, and **ethnicity** (8 unique portraits)
- Interactive **16-step tutorial** to learn all game systems
- Persistent progression saved via local storage

### Player Stats
| Stat | Description |
|------|-------------|
| **Money** | Your clean cash on hand — earned from jobs, businesses, and hustles |
| **Dirty Money** | Illicit cash from Bank Jobs, Counterfeiting, and illegal businesses — must be laundered! |
| **Health** | Starts at 100. Lost from risky jobs and combat. Heal at the hospital |
| **Energy** | Starts at 100. Every job costs energy. Regenerates 1 per 20 seconds |
| **Power** | Increased by weapons, armor, vehicles, and properties |
| **Reputation** | Unlocks higher-tier jobs and faction missions |
| **Wanted Level** | Raised by criminal activity. Increases jail time and police attention |
| **Suspicion** | 0–100 scale affecting law enforcement interest in your operations. Dirty money jobs raise it |

### Leveling & XP
- Earn XP from completing jobs (higher risk = more XP)
- Level up every `level × 100` XP
- Each level-up awards **3 skill points**

---

## 💼 Jobs (18 Total)

Jobs range from low-risk errands to legendary criminal operations. Each has a payout range, energy cost, jail chance, wanted level gain, health loss, reputation requirement, and optional required items.

| Tier | Job | Payout | Energy | Jail % | Requires |
|------|-----|--------|--------|--------|----------|
| Entry | Street Soldier | $1K–$5K | 1 | 20% | — |
| Special | Boost a Ride | Stolen car | 5 | 40% | — |
| Mid | Store Heist | $20K–$40K | 10 | 30% | Rep 10 |
| Drug | Bootleg Run | $40K–$80K | 12 | 25% | Crate Moonshine, Rep 15 |
| Drug | Speakeasy Supply | $80K–$160K | 15 | 35% | Bag of Mary Jane, Rep 25 |
| Drug | White Powder Distribution | $160K–$300K | 20 | 45% | Pure Cocaine, Rep 40 |
| Weapon | Protection Collection | $10K–$25K | 8 | 20% | Brass Knuckles, Rep 12 |
| Weapon | Bank Job 💰 | $100K–$250K | 25 | 50% | Tommy Gun + Bullets, Rep 35 |
| Weapon | Hit on a Rival | $60K–$120K | 18 | 40% | Pistol + Bullets, Rep 30 |
| Vehicle | Luxury Car Ring | $80K–$160K | 15 | 30% | Luxury Automobile, Rep 20 |
| Vehicle | Cross-Border Smuggling | $200K–$400K | 30 | 35% | Private Airplane + Gasoline, Rep 50 |
| Gang | Turf War | $40K–$100K | 20 | 45% | Gang Recruit, Rep 25 |
| Gang | Underground Boxing | $30K–$70K | 12 | 25% | Brass Knuckles, Rep 18 |
| Business | Illegal Gambling Den | $120K–$240K | 22 | 30% | Criminal Safehouse, Rep 35 |
| Special | Money Laundering 💧 | Converts dirty→clean | 25 | 20% | Basement Hideout + Luxury Auto, Rep 45 |
| Dirty | Counterfeiting Money 💰 | $200K–$500K | 20 | 45% | Basement Hideout + Fake ID Kit, Rep 40 |
| Legendary | International Arms Trade | $500K–$1M | 35 | 60% | Private Airplane + Tommy Gun + Bulletproof Vest, Rep 60 |
| Legendary | Take Over the City | $2M–$5M | 40 | 70% | Gang Recruit + Underground Bunker + Tommy Gun + Luxury Auto, Rep 80 |

> 💰 = Pays **dirty money** only (must be laundered) | 💧 = Converts dirty money to clean money (80–95% rate)

---

## 💰 Dirty Money System

Certain high-value criminal activities pay **dirty money** instead of clean cash. Dirty money cannot be spent directly — it must be laundered first.

### How Dirty Money Works
- **Bank Job** and **Counterfeiting Money** jobs pay dirty money and raise your suspicion level (+5–15 per job)
- **Illegal businesses** (Counterfeiting Operation, Drug Lab, Chop Shop) generate dirty passive income
- **Money Laundering job** converts dirty → clean money at 80–95% rate (Intelligence skills improve the rate)
- **Laundering Menu** offers 5 methods from Casino Chips (85% rate) to Offshore Banking (95% rate)
- **Owning a Counterfeiting Operation** boosts the Money Laundering job's conversion rate by +3%
- **High suspicion** increases risk of failed laundering attempts and law enforcement attention

---

## 🎯 Skill System

### 6 Base Skills
Leveled using skill points. Cost increases every 5 levels.

| Skill | Effect |
|-------|--------|
| **Stealth** | Reduces jail chance, improves breakout success |
| **Violence** | Increases combat job success rate |
| **Charisma** | Store discounts (2%/level), reduced suspicion |
| **Intelligence** | Overall job success boost, better laundering rates |
| **Luck** | Better random event outcomes and payouts |
| **Endurance** | Reduces energy cost per job (-1/level) |

### 18 Skill Tree Branches (Max Level 10 Each)
Each branch costs 2 skill points per upgrade.

| Tree | Branch 1 | Branch 2 | Branch 3 |
|------|----------|----------|----------|
| **Stealth Mastery** | Infiltration | Escape Artist | Surveillance |
| **Combat Prowess** | Firearms | Melee Combat | Intimidation |
| **Social Influence** | Negotiation | Leadership | Manipulation |
| **Mental Acuity** | Hacking | Strategic Planning | Forensics |
| **Fortune's Favor** | Gambling | Fortune | Serendipity |
| **Physical Resilience** | Stamina | Recovery | Resistance |

---

## 🏘️ Territory System

### 12 Map Districts
Downtown, Warehouse District, Residential, Commercial, The Docks, Chinatown, Industrial Zone, Uptown, Suburbs, Red Light District, University District, Airport Area

### Purchasable District Types (8)
Range from Low-Income Residential ($8K) to Port District ($50K)

### Territory Mechanics
- **Capture territories** through dedicated territory missions (require gang members)
- **Protection rackets** on 8 business types ($200–$2,000/week income)
- **Territory heat** — each territory accumulates heat from criminal activity
- **Territory events** — Police Crackdowns, Rival Encroachment, Expansion Opportunities, and more
- **Corrupt officials** — Bribe 6 tiers from Patrol Officer ($500) to Mayor ($25,000)

---

## 👥 Gang System

### Recruitment & Management
- Recruit gang members with random levels (1–10) and specializations: **muscle, thief, dealer, driver, enforcer, technician**
- **Loyalty system** (0–100) — low loyalty triggers betrayal events (informants, coups, sabotage)
- **Tribute collection** — $200 × multiplier per member, with territory bonuses

### Gang Operations (4)
| Operation | Specialist | Duration |
|-----------|-----------|----------|
| Protection Racket | Enforcer | 4 hours |
| Car Theft Ring | Thief | 6 hours |
| Drug Lab Operation | Dealer | 8 hours |
| Tech Heist | Technician | 12 hours |

### Training Programs (5)
Basic Combat, Stealth Training, Business Operations, Team Building, and Advanced Tactical ($250–$1,000)

### Rival Gangs (5)
| Gang | Power | Boss |
|------|-------|------|
| Iron Wolves MC | 150 | Steel Murphy |
| Jade Serpents | 200 | Master Liu |
| Crimson Brotherhood | 120 | Blood Martinez |
| Golden Eagles | 250 | Don Aurelius |
| Shadow Syndicate | 300 | The Phantom |

---

## 🏢 Business & Money Laundering

### Businesses (9 Total)

#### Legitimate Businesses (pay clean money)
| Business | Cost | Income/Day | Legitimacy |
|----------|------|-----------|------------|
| 24/7 Laundromat | $1.5M | $30K | 95% |
| Discount Pawn Shop | $2M | $40K | 70% |
| Family Restaurant | $2.5M | $50K | 85% |
| Premium Car Wash | $3M | $60K | 90% |
| Underground Nightclub | $5M | $120K | 60% |
| Private Casino | $10M | $250K | 40% |

#### Illegal Businesses (pay DIRTY money 💰)
| Business | Cost | Income/Day | Legitimacy |
|----------|------|-----------|------------|
| Chop Shop | $3.5M | $140K | 15% |
| Counterfeiting Operation | $4M | $180K | 10% |
| Drug Lab | $6M | $220K | 5% |

> Illegal business income is dirty money and must be laundered before spending!

### Money Laundering (5 Methods)
Casino Chips (85% clean, 2hr), Restaurant Revenue (90%, 4hr), Cash Business Front (80%, 6hr), Art Auction (75%, 24hr), Offshore Banking (95%, 48hr)

### Loan Shark System
Borrow $200K–$10M with 15–30% weekly interest. Miss payments at your own risk.

---

## 🏠 Real Estate Properties (7)

| Property | Cost | Gang Capacity |
|----------|------|---------------|
| Abandoned Warehouse | $2,500 | +3 |
| Basement Hideout | $6,000 | +5 |
| Criminal Safehouse | $12,000 | +8 |
| Underground Bunker | $25,000 | +15 |
| Criminal Fortress | $50,000 | +25 |
| Luxury Penthouse | $80,000 | +20 |
| Private Island | $200,000 | +50 |

---

## 🛒 Store Items

### Weapons
| Weapon | Price | Power |
|--------|-------|-------|
| Brass Knuckles | $7,500 | 10 |
| Switchblade | $12,000 | 20 |
| Baseball Bat | $18,000 | 30 |
| Pistol | $30,000 | 50 |
| Revolver | $45,000 | 70 |
| Sawed-Off Shotgun | $125,000 | 90 |
| Tommy Gun | $150,000 | 100 |
| Sniper Rifle | $250,000 | 120 |

### Armor
| Armor | Price | Power |
|-------|-------|-------|
| Leather Jacket | $15,000 | 15 |
| Stab Vest | $50,000 | 25 |
| Bulletproof Vest | $100,000 | 40 |
| Reinforced Body Armor | $200,000 | 60 |

### Vehicles
| Vehicle | Price | Power |
|---------|-------|-------|
| Armored Car | $120,000 | 25 |
| Luxury Automobile | $400,000 | 50 |
| Private Airplane | $1,500,000 | 200 |

### Consumables & Supplies
| Item | Price | Effect |
|------|-------|--------|
| Strong Coffee | $800 | +15 energy |
| Energy Drink | $1,500 | +30 energy |
| Steroids | $5,000 | +60 energy |
| Bullets | $2,500 | Ammo for guns |
| Gasoline | $4,000 | Fuel for vehicles |

### Utility Items
| Item | Price | Effect |
|------|-------|--------|
| Lockpick Set | $10,000 | +5 stealth power |
| Burner Phone | $8,000 | -15% laundering suspicion |
| Fake ID Kit | $25,000 | -1 day jail time |
| Police Scanner | $35,000 | -20% wanted level gain |

### Drugs (Trade Goods for Distribution Jobs)
| Drug | Price | Required Vehicle |
|------|-------|-----------------|
| Crate Moonshine | $60,000 | Freight Truck |
| Bag of Mary Jane | $120,000 | Freight Truck |
| Pure Cocaine | $200,000 | Freight Truck |

### Stolen Cars (30+ Types)
Steal cars via the **Boost a Ride** job. Vehicles range from Broken Family Wagons ($800) to Police Cruisers ($250,000). Cars take damage during theft and can be sold immediately or stored in your collection.

---

## 🤝 Faction System (4 Crime Families)

| Family | Boss | Specialty |
|--------|------|-----------|
| **Torrino Family** | Don Salvatore Torrino | Protection rackets & loan sharking |
| **Kozlov Bratva** | Dimitri Kozlov | Weapons trafficking & smuggling |
| **Chen Triad** | Master Chen Wei | Technology crimes & drug manufacturing |
| **Morales Cartel** | El Jefe Morales | Drug manufacturing & distribution |

### Faction Reputation
- **7 factions** tracked: Torrino, Kozlov, Chen, Morales, Police, Civilians, Underground
- **4 positive tiers** (25/50/75/100) granting bonuses like exclusive shops, backup in wars, smuggling routes
- **4 negative tiers** (-25/-50/-75/-100) with consequences like bounties, asset freezes, and assassination orders
- Unique **faction missions** for each family with scaling rewards

### Mentors (4)
Train under faction-aligned mentors for stat boosts ($100+ per session, 10 max sessions, 24hr cooldown):
- Viktor "The Blade" Petrov (Kozlov)
- Isabella "La Sombra" Martinez (Morales)
- Jin "Digital Dragon" Chen (Chen)
- Anthony "The Fixer" Torrino (Torrino)

---

## ⚔️ Boss Battles

High-stakes confrontations with rival leaders:

| Boss | Power | Requirements | Top Reward |
|------|-------|-------------|------------|
| Carlos "El Martillo" Santos | 150 | 100 power, 8 gang, 40 rep | $8,000 + Santos' Golden Pistol |
| Chief Margaret Morrison | 120 | 80 power, 6 gang, 30 rep | $6,000 + wanted level reduction |

---

## ⚖️ Law Enforcement & Jail

- **Jail sentences** scale with wanted level: `max(15, 10 + wantedLevel)` seconds
- **3 breakout attempts** per sentence (45% base + Stealth bonuses)
- **Courthouse** — pay `wantedLevel × $500` to clear your record
- **Police crackdowns** — Drug enforcement, gang activity sweeps, auto theft operations, corruption investigations
- **Bribery** — corrupt officials from patrol officers to the mayor for protection

---

## 🌦️ Dynamic World Events

### Weather System (5 Types)
Changes every 15–45 minutes with gameplay effects:
- **Rain**: +15% stealth, +10% accidents
- **Snow**: +30% evidence reduction
- **Fog**: +25% stealth bonus
- **Storm**: -30% police response time

### Seasonal Events (8)
Real-world season-based events: Spring Festival, Tax Season Chaos, Tourist Season, Heat Wave, Harvest Festival, Back to School, Holiday Shopping Chaos, Cold Snap

### Random Events
Police Raids, Lucky Finds ($100–$500+), Random Sales (30% off for 2 min), Gang Recruitment offers, Territory Disputes, Police Informant drama

### News Events
Police Budget Cuts, New Police Chief, Economic Boom, Gang Violence Surge, Major Festival, New Surveillance Technology

---

## 🎰 Mini-Games (6)

| Game | Where | Reward |
|------|-------|--------|
| Tic-Tac-Toe | Jail & Arcade | $100 per win |
| Number Guessing | Arcade | $100 |
| Rock Paper Scissors | Arcade | $100 (best of 5) |
| Memory Match | Arcade | $100 (personal best: $500) |
| Snake | Arcade | $50 per food |
| Quick Draw | Arcade | $100 if < 300ms (personal best: $500) |

### Casino
- **Slot Machine** — $100 per spin, ~2% jackpot chance ($10,000)
- **Roulette** — $200 per spin, ~1% jackpot chance ($500,000)

---

## 🏆 Empire Rating & Victory

### Kingpin Score (Max 10,000)
| Category | Max Points | Based On |
|----------|-----------|----------|
| Money Power | 2,000 | Cash reserves |
| Gang Power | 1,500 | Members + loyalty |
| Territory Power | 1,500 | Controlled territories |
| Business Power | 1,500 | Owned businesses |
| Reputation Power | 2,000 | Reputation level |
| Skill Power | 1,500 | Total skill levels |

### Empire Grades
D → C → B → A → A+ → S → S+ → **LEGENDARY** (9,000+)

### Retirement Paths (4 Endings)
| Ending | Requirements |
|--------|-------------|
| Going Legitimate | $1M clean money, 10 businesses, low heat |
| Exile to Paradise | $5M, private airplane, low wanted level |
| Family Business Empire | 20 gang, 15 territories, 15 businesses |
| Underground Kingpin | 10,000 empire rating, all factions maxed |

Retired characters enter the **Hall of Fame** and grant **legacy bonuses** to your next character.

---

## 🏅 Perks & Achievements

### Perks (11)
Shadow Walker, Ghost Protocol, Fear Monger, War Machine, Silver Tongue, Kingmaker, Mastermind, Digital God, Fortune's Son, Master Teacher, Legendary Status

### Achievements (6)
| Achievement | Condition | Reward |
|-------------|-----------|--------|
| First Day on the Job | Complete first job | $1,000 + 50 XP |
| Big Shot | Earn $100K | $1,000 + 50 XP |
| Great Escape | Escape from jail | $1,000 + 50 XP |
| Gang Leader | Recruit 10 members | $1,000 + 50 XP |
| Most Wanted | Reach wanted level 50 | $1,000 + 50 XP |
| Legendary Criminal | Reach 100 reputation | $1,000 + 50 XP |

### Weekly Challenges
3 random challenges per week across 8 categories. Tiered rewards: Bronze ($50K), Silver ($100K), Gold ($200K), Platinum ($500K).

---

## 📖 Story Campaign

**"Rising Through the Ranks"** — A 4-chapter narrative campaign with progressive requirements and rewards, guiding you from street-level hustler to empire builder.

---

## 💾 Save System

- **10 manual save slots** + auto-save + emergency save
- **Auto-save** every 60 seconds
- **Emergency save** on browser close
- **Export/import** saves as JSON files
- Full state persistence including achievements, hall of fame, and legacy data

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| J | Jobs | B | Businesses |
| S | Store | T | Territory |
| G | Gang | L | Calendar |
| C | Cars | M | Map |
| K | Skills | Z | Statistics |
| R | Empire Rating | H | Hall of Fame |
| E | Buy Energy Drink | F5 | Save System |
| F7 | Competition | ESC | Main Menu |

---

## 🌐 Multiplayer

### Local Multiplayer (No Setup Required)
- 2–4 players on the same device (hot-seat)
- Competitive, Cooperative, and Territory War modes
- Turn-based with resource trading

### Online Multiplayer (Server Required)

#### Prerequisites
- Node.js (version 14+)
- Internet connection

#### Setup
```bash
npm install
npm start
```

Server starts on **port 3000** (HTTP) and **port 8080** (WebSocket). One player creates a room and shares the invite code. Up to 4 players per room.

#### Multiplayer Modes
| Mode | Goal |
|------|------|
| **Competitive** | First to reach target money/reputation/territory |
| **Cooperative** | Shared goals — team wealth, empire building, survival |
| **Territory War** | Control the most districts |

#### Features
- Real-time notifications for jobs, territory changes, and transactions
- In-game chat, trade negotiations, and alliance proposals
- Leaderboards and statistical comparisons

---

## 🔧 Technical Details

| Layer | Tech |
|-------|------|
| **Client** | Pure HTML5 + CSS3 + JavaScript (no dependencies) |
| **Server** | Node.js + WebSocket |
| **Storage** | localStorage for saves |
| **Protocol** | JSON messages with auto-reconnect and anti-cheat |
| **Mobile** | Responsive design with dedicated mobile system |

### Browser Compatibility
Chrome 60+, Firefox 55+, Safari 11+, Edge 16+, iOS Safari, Chrome Mobile

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Game not responding | Refresh and restart |
| Can't connect to server | Ensure server is running, check ports 3000/8080 |
| Room not found | Verify room code and server status |
| Save issues | Check browser localStorage permissions |
| Lag/Disconnects | Check internet stability |
| Server crashes | Restart with `npm start` |

**General fixes:** Clear browser cache, disable extensions, check Windows Firewall for Node.js, try a different browser.

---

## 📚 Strategy Tips

- **Early Game** — Grind Street Soldier for safe cash ($1K–$5K). Buy Strong Coffee ($800) to extend your runs. Save up for Brass Knuckles ($7,500) to unlock Protection Collection.
- **Mid Game** — Invest in a Basement Hideout ($6K) and start recruiting gang members. Buy drugs wholesale and run distribution jobs for major profit. Train your Stealth and Endurance skills.
- **Late Game** — Acquire businesses (start with Laundromat at $1.5M), set up protection rackets, and corrupt officials. Push faction reputation for exclusive perks. Consider illegal businesses for high dirty money income, but keep laundering it!
- **Endgame** — Pursue one of the 4 retirement paths to enter the Hall of Fame and unlock legacy bonuses for your next character.

---

Build your legacy, expand your territory, and prove who's the ultimate Don! 🏛️👑