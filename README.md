# From Dusk to Don

A deep criminal empire-building game where you rise from street thug to legendary kingpin. Features a full progression system with jobs, gangs, territories, businesses, skill trees, boss battles, faction politics, mini-games, and both local and online multiplayer.

---

## 🎮 Core Gameplay

### Character Creation
- Choose your **name**, **gender**, and **ethnicity** (8 unique portraits)
- Interactive **12-step tutorial** to learn all game systems
- Persistent progression saved via local storage

### Player Stats
| Stat | Description |
|------|-------------|
| **Money** | Your cash on hand — earned from jobs, businesses, and hustles |
| **Health** | Starts at 100. Lost from risky jobs and combat. Heal at the hospital |
| **Energy** | Starts at 100. Every job costs energy. Regenerates 1 per 30 seconds |
| **Power** | Increased by weapons, armor, vehicles, and properties |
| **Reputation** | Unlocks higher-tier jobs and faction missions |
| **Wanted Level** | Raised by criminal activity. Increases jail time and police attention |
| **Suspicion** | 0–100 scale affecting law enforcement interest in your operations |

### Leveling & XP
- Earn XP from completing jobs (higher risk = more XP)
- Level up every `level × 100` XP
- Each level-up awards **3 skill points**

---

## 💼 Jobs (17 Total)

Jobs range from low-risk errands to legendary criminal operations. Each has a payout range, energy cost, jail chance, wanted level gain, health loss, reputation requirement, and optional required items.

| Tier | Job | Payout | Energy | Jail % | Requires |
|------|-----|--------|--------|--------|----------|
| Entry | Street Corner Lookout | $1–15 | 1 | 5% | — |
| Special | Steal Car | Stolen car | 5 | 40% | — |
| Mid | Armed Robbery | $50–100 | 10 | 30% | Rep 10 |
| Drug | Moonshine Distribution | $200–400 | 12 | 25% | Crate Moonshine |
| Drug | Underground Weed Operation | $400–800 | 15 | 35% | Bag of Mary Jane |
| Drug | High-Stakes Cocaine Deal | $800–1,500 | 20 | 45% | Pure Cocaine |
| Weapon | Protection Racket | $100–250 | 8 | 20% | Brass Knuckles |
| Weapon | Bank Heist | $500–1,200 | 25 | 50% | Tommy Gun + Bullets |
| Weapon | Rival Gang Assassination | $300–600 | 18 | 40% | Pistol + Bullets |
| Vehicle | Luxury Car Theft Ring | $400–800 | 15 | 30% | Luxury Automobile |
| Vehicle | Cross-State Smuggling | $1,000–2,000 | 30 | 35% | Private Airplane + Gasoline |
| Gang | Territory War | $200–500 | 20 | 45% | Gang Recruit |
| Gang | Underground Fighting Ring | $150–350 | 12 | 25% | Brass Knuckles |
| Business | Illegal Casino Operation | $600–1,200 | 22 | 30% | Criminal Safehouse |
| Business | Money Laundering Scheme | $800–1,500 | 25 | 20% | Basement Hideout + Luxury Automobile |
| Legendary | International Arms Deal | $1,500–3,000 | 35 | 60% | Private Airplane + Tommy Gun + Bulletproof Vest |
| Legendary | Criminal Empire Takeover | $2,000–4,000 | 40 | 70% | Gang Recruit + Underground Bunker + Tommy Gun + Luxury Automobile |

---

## 🎯 Skill System

### 6 Base Skills
Leveled using skill points. Cost increases every 5 levels.

| Skill | Effect |
|-------|--------|
| **Stealth** | Reduces jail chance, improves breakout success |
| **Violence** | Increases combat job success rate |
| **Charisma** | Store discounts (2%/level), reduced suspicion |
| **Intelligence** | Overall job success boost |
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

### Businesses (6)
| Business | Cost | Income/Day | Legitimacy |
|----------|------|-----------|------------|
| Family Restaurant | $25K | $500 | 85% |
| Underground Nightclub | $50K | $1,200 | 60% |
| 24/7 Laundromat | $15K | $300 | 95% |
| Premium Car Wash | $30K | $600 | 90% |
| Private Casino | $100K | $2,500 | 40% |
| Discount Pawn Shop | $20K | $400 | 70% |

### Money Laundering (5 Methods)
Casino Chips (85% clean, 2hr), Restaurant Revenue (90%, 4hr), Cash Business Front (80%, 6hr), Art Auction (75%, 24hr), Offshore Banking (95%, 48hr)

### Loan Shark System
Borrow $2K–$100K with 15–30% weekly interest. Miss payments at your own risk.

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

### Weapons & Armor
Brass Knuckles ($75), Pistol ($300), Tommy Gun ($1,500), Leather Jacket ($150), Bulletproof Vest ($1,000)

### Vehicles
Armored Car ($1,200), Luxury Automobile ($4,000), Private Airplane ($15,000)

### Consumables
Energy Drink ($15, +30 energy), Strong Coffee ($8, +15 energy), Steroids ($50, +60 energy), Bullets ($25), Gasoline ($40)

### Drugs (for distribution jobs)
Crate Moonshine ($600), Bag of Mary Jane ($1,200), Pure Cocaine ($2,000)

### Stolen Cars (7 Types)
Steal and sell cars ranging from Rusty Jalopy ($50) to High-End Roadster ($2,000). Cars can take damage and suffer catastrophic failures.

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

- **Early Game** — Grind Street Corner Lookout for safe cash. Buy an Energy Drink to extend your runs. Save up for Brass Knuckles to unlock Protection Racket.
- **Mid Game** — Invest in a Basement Hideout and start recruiting gang members. Buy drugs wholesale and run distribution jobs for major profit. Train your Stealth and Endurance skills.
- **Late Game** — Acquire properties, set up protection rackets, and corrupt officials. Push faction reputation for exclusive perks. Challenge rival bosses when your power is high enough.
- **Endgame** — Pursue one of the 4 retirement paths to enter the Hall of Fame and unlock legacy bonuses for your next character.

---

Build your legacy, expand your territory, and prove who's the ultimate Don! 🏛️👑
