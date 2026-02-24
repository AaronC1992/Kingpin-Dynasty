# Mafia Born

**v1.4.3** | A deep criminal empire-building browser game where you rise from street thug to legendary kingpin. Build your crew, claim territory, run businesses, and outmanoeuvre rival crime families — all from your browser.

## **[PLAY NOW](https://mafiaborn.com/)**

No installation required. Click above and start playing instantly in your browser.

---

## About

Mafia Born is a single-page browser game built with pure HTML5, CSS3, and JavaScript. You create a character, grind jobs, recruit a gang, purchase properties and businesses, and navigate a world of rival factions, law enforcement, and dynamic events — all while managing clean and dirty money to fund your criminal empire.

The game features persistent progression via local storage and cloud saves, a full account system with secure login, progressive feature unlocking, customisable quick actions, and both local and online multiplayer modes.

---

## Features

### Criminal Career
- **18 jobs** ranging from petty street crime to legendary heists, each with unique risk/reward trade-offs
- **Dirty money system** — high-value crimes pay illicit cash that must be laundered before spending
- **Multiple laundering methods** with different conversion rates, timescales, and risk levels
- **The Fence** — a dedicated black market for selling stolen goods and contraband at premium rates

### Empire Building
- **9 businesses** (6 legitimate fronts and 3 illegal operations) generating passive income, each upgradeable to level 5
- **7 properties** from hideouts to private islands, expanding gang capacity and unlocking new jobs
- **12 map districts** to capture and control, with protection rackets and territory events
- **Loan shark** system for high-risk borrowing

### Gang & Factions
- Recruit and manage gang members with unique specializations
- **4 crime families** with reputation systems, faction missions, and mentors
- **5 rival gangs** to challenge in boss battles with unique rewards
- Loyalty mechanics, betrayal events, and gang operations

### Progression
- **Progressive unlock system** — game features unlock as you level up, from basics at level 0 to endgame content at level 15+
- **6 base skills** with 18 advanced skill tree branches
- **Perks and achievements** unlocked through gameplay milestones
- **Empire rating** system grading your criminal empire from D to Legendary
- **4 retirement paths** leading to the Hall of Fame, with legacy bonuses for future characters
- **Weekly challenges** with tiered rewards

### Law & Consequences
- **Wanted level** and **suspicion** systems that escalate law enforcement attention
- Suspicion consequences ranging from surveillance to full FBI investigation chains
- Jail, breakout attempts, guard bribery, courthouse bribes, and corrupt officials
- Police crackdowns triggered by criminal activity in your territories

### Living World
- **Dynamic weather** affecting stealth, police response, and accidents
- **Seasonal events** tied to real-world seasons
- **Random events** — police raids, lucky finds, gang disputes, news headlines
- **Story campaign** guiding you from street hustler to empire builder

### Mini-Games & Casino
- 6 arcade mini-games playable in jail or at the arcade
- Casino with slot machines, roulette, blackjack, and dice

### Customisation
- **Customisable quick actions panel** — choose which shortcut buttons appear on your screen via Settings > Personalization
- **Title screen** with options to start fresh, resume, access the tutorial, or reset all data

### Account & Cloud Saves
- **Secure account system** with login and registration
- **Cloud save/load** — your progress is saved to the server so you can pick up from any device
- **Unique character names** — enforced across all players
- **Auto cloud-save** on key actions to prevent progress loss

### Multiplayer
- **Local multiplayer** — 2-4 players on the same device with competitive, cooperative, and territory war modes
- **Online multiplayer** — real-time rooms via Node.js/WebSocket server with chat, trading, alliances, and leaderboards

---

## Getting Started

Just open [the live site](https://mafiaborn.com/) in any modern browser — no install needed. Create an account to unlock cloud saves and online features.

To run the server locally for development:

```bash
npm install
npm start
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | HTML5 + CSS3 + JavaScript (zero dependencies) |
| Server | Node.js + WebSocket |
| Storage | Browser localStorage + cloud saves via REST API |
| Mobile | Responsive design with dedicated mobile layout |

Compatible with Chrome, Firefox, Safari, Edge, and their mobile counterparts.

---

## Save System

- **Cloud saves** — sign in to save and load your progress from any device
- 10 manual local save slots plus auto-save and emergency save on browser close
- Export and import saves as JSON files
- Full persistence of all progress, achievements, and legacy data
- Save migration for older saves — new features auto-initialize on load

---

## Recent Changes (v1.4.3)

- **Economy rebalance** — tuned job payouts, energy costs, and progression curves for a better flow
- **Comprehensive layout overhaul** — fixed content alignment across all 31 game screens at every breakpoint
- **Tutorial polish** — skip button now properly cleans up after use; progress tracker removed on completion
- **Ledger polish** — sticky heading, tighter log entry spacing, gradient header
- **Consolidated CSS** — merged expanded-styles.css into a single stylesheet
- **5 runtime error hotfixes** — resolved crashes in gang, territory, faction, and UI systems
- **Responsive media query fixes** — corrected sidebar offsets, page-header positioning, and stats bar layout at all screen sizes

---

Build your legacy, expand your territory, and prove who's the ultimate Don.
