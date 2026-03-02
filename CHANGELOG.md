# Changelog

All notable changes to From Dusk To Don (Mafia Born) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.5] - 2026-03-01

### Changed — Safehouse UX & Ledger Filters
- **Safehouse buttons reorganized** — Operations first, then Jobs, Black Market, Stash, Doctor, Gambling, with progression unlocks after and Settings last
- **New safehouse tip** — one-time dismissible popup guides new players to start with Jobs and Operations
- **Ledger filter buttons** — All, Environment, and World Chat filters let players control what appears in the ledger
- **World Chat in ledger** — multiplayer chat messages and player connection/disconnect notices now appear in the ledger under the World Chat filter
- **Color-coded ledger entries** — gold border (environment), blue (chat), purple (online status)
- **Faction names replace abbreviations** — ITA/RUS/CHN/MEX replaced with full names: Torrino Family, Kozlov Bratva, Chen Triad, Morales Cartel across all files
- **Ethnicity added to faction data** — family choice screen now correctly shows "Italian/Russian/Chinese/South American crime family"
- **Passive log messages fixed** — removed broken flag emojis from Chen and Morales passive log entries

## [1.11.4] - 2026-03-01

### Changed — Tutorial & Help Overhaul
- **Tutorial starts after changelog** — the safehouse tutorial now automatically appears after the "What's New" changelog is dismissed on first play
- **Safehouse tutorial expanded** — 6 detailed sections covering Status Bar stats, The Ledger, Quick Actions Bar, Navigation Buttons, and Getting Started tips
- **All 13 screen tutorials rewritten** — more detail, tips, and full explanations for every screen (Jobs, Store, Missions, Gang, Properties, Casino, Stash, Hospital, Skills, Stats, Territory, Settings)
- **Help guide expanded from 17 to 21 topics** — new topics: UI Guide (HUD), Combat & Equipment, Dirty Money & Laundering, Seasons & Weather
- **Every help topic rewritten** — added sub-headings, detailed explanations, strategy tips, and complete mechanic breakdowns
- **Heat system guide** — now explains 5 granular tiers (Cool/Warm/Hot/Scorching/Inferno) with causes and reduction methods
- **Energy guide** — covers all 3 consumable types with grinding strategy tips
- **Skills guide** — explains what each of the 6 talent trees is best suited for

## [1.11.3] - 2026-03-01

### Changed — Emoji Cleanup & Faction Flag Fix
- **Removed ~65 decorative emojis** — tabs, buttons, headers, notifications, and log messages cleaned up across game.js and index.html
- **Faction flags fixed for PC** — replaced flag emojis (invisible on Windows desktop) with text abbreviations: ITA, RUS, CHN, MEX
- **Help guide icons cleared** — removed emoji icons from 15+ help topics
- **Functional emojis kept** — lock indicators, toggle checkmarks, map legend, store categories, achievements, weather, districts, leaderboards, weekly challenges

## [1.11.2] - 2026-03-01

### Added — Change Portrait from Settings
- **Change Portrait button** in Settings > Personalization section
- Portrait picker reuses gender-organized Male/Female sections from character creation
- Changing portrait also updates ethnicity and gender fields and auto-saves

## [1.11.1] - 2026-03-01

### Changed — Profile Picture Organization
- **Portrait grid organized by gender** — Male and Female sections with clear headers
- Both portrait selection screens (new game + settings) use gender-sorted layout
- Portrait grid CSS updated for responsive columns (6-col desktop, 3-col tablet, 2-col phone)

## [1.11.0] - 2026-03-XX

### Changed — Omerta-Style Economy Rebalance
- **Energy regen slowed** — 45s base interval (was 20s), min 25s (was 10s). Full refill ~75 min.
- **Job energy costs increased** — Street Soldier 3 (was 1), Boost a Ride 8 (was 5), Store Heist 14 (was 10), all others +20-30%
- **Early job payouts reduced** — Street Soldier $40-180 (was $60-300), Store Heist $800-2,200 (was $1,200-3,000), Protection $500-1,400 (was $600-1,600)
- **XP curve steepened ~50%** — formula now `level*600 + level²*120 + level³*8` (Level 1: 728 XP, Level 10: 20,000 XP)
- **XP rewards reduced** — low: 2, medium: 4 (was 6), high: 10 (was 14), very high: 16 (was 22), extreme: 25 (was 35), legendary: 40 (was 50)
- **Reputation gains slowed ~40%** — low: 0.2 (was 0.3), medium: 0.3 (was 0.5), high: 0.6 (was 1.0), etc.
- **Hospital costs increased** — full heal $25/HP (was $10), patch $20/HP (was $8), rest 25 energy for 12 HP (was 20 energy for 15 HP)
- **Store prices increased ~30%** — Brass Knuckles $10K (was $7.5K), Pistol $40K (was $30K), Tommy Gun $200K (was $150K), all armor/vehicles up
- **Energy items 2.5x more expensive** — Coffee $2,500 (was $1K), Energy Drink $6K (was $2.5K), Steroids $10K (was $4K)
- **Utility items increased** — Lockpick $15K (was $10K), Police Scanner $50K (was $35K), Fake ID $35K (was $25K)
- **Trade goods increased** — Moonshine $75K (was $60K), Mary Jane $150K (was $120K), Cocaine $250K (was $200K)
- **Property income halved** — Basement Hideout $250/cycle (was $500), Private Island $8K (was $15K)
- **Business income halved** — all 9 business types base income reduced 50%
- **Passive income reduced** — gang members $25/cycle (was $50), territory $100 (was $200)
- **Casino min bet $100** — all games now enforce $100 minimum (was $1)
- **Failure XP reduced** — 1 XP on job failure (was 2)

## [1.8.4] - 2026-03-01

### Changed
- **Black Market restructured** — now has 3 top-level tabs: Buy, The Fence, and Player Market
- **Fence merged into Black Market** — no more separate Fence screen; fence functionality lives under the Fence tab
- **Player Market tab added** — trade vehicles with other players directly from Black Market
- Fence sell functions now use Heat (Wanted Level) instead of the removed Suspicion system
- `getFenceMultiplier()` heat penalty now based on `wantedLevel`

### Removed
- Fence nav sidebar button — one fewer menu button
- ~400 lines of commented-out dead code (old suspicion / FBI investigation block)
- `suspicionTimer` / `fbiTimer` references in event timer system
- `fence-screen` div from HTML

## [1.8.3] - 2026-03-01

### Changed
- **Suspicion system removed** — all suspicion gains now route through the existing Heat (Wanted Level) system
- **Motor Pool merged into Stash** — new Stash & Motor Pool screen with tabs
- **Skills/Expertise merged into Stats** — Stats screen now has 6 tabs

### Removed
- FBI Investigation popups, suspicion timers, and suspicion-based consequences
- Expertise and Motor Pool nav buttons — fewer buttons, less clutter
- 'c' and 'k' keyboard shortcuts (now accessed through Stash and Stats tabs)

## [1.8.2] - 2026-03-01

### Changed
- **Stats screen consolidation** — Empire Rating & Empire Overview merged into Player Stats as tabs (5 tabs: Player Stats, Career Statistics, Character Showcase, Empire Rating, Empire Overview)
- **Properties screen consolidation** — Business Fronts merged into Properties as a Fronts tab (2 tabs: Properties, Fronts)
- **Gambling screen consolidation** — Mini Games (Pastimes) merged into Gambling as a Mini Games tab (2 tabs: Gambling, Mini Games)
- Reduced nav menu clutter — 3 fewer sidebar buttons (Empire Rating, Fronts/Businesses, Pastimes removed)
- Mobile nav casino label renamed from "Casino" to "Games"

### Removed
- **Popup random events** — interactive event modals (STREET_STORIES + INTERACTIVE_EVENTS) no longer fire on timer
- **FBI investigation popup chain** — suspicion timer and FBI escalation timer disabled
- Old `mini-games-screen` HTML (content moved into `casino-screen`)

## [1.8.1] - 2026-03-01

### Added
- **Political System** — Top Don (player/alliance with most territories) can set 5 server-wide policies: worldTaxRate, marketFee, crimeBonus, jailTimeMod, heistBonus
- **Alliance Discipline** — leaders can warn, fine, demote, or kick members with full audit logging
- **Energy items in mobile navbar** — quick access to energy consumables from bottom nav

### Fixed
- Gang member dismissal now calls `recalculatePower()` — previously referenced non-existent `recalculateGangPower()`
- Political worldTaxRate above 10% now works — server computes business tax authoritatively from grossIncome instead of trusting client-sent taxAmount
- Client business tax display uses server-synced political tax rate instead of hardcoded `BUSINESS_TAX_RATE`

### Removed
- Dead `const TAX_RATE = 0.10` from server.js (replaced by dynamic political rate)
- Dead `export const TAX_RATE` from territories.js (never imported)
- Stale TODO comments about updating TAX_RATE dynamically

## [1.8.0] - 2026-03-01

### Added
- **Unified RPG Talent Tree** — replaced basic skills and old skill trees with a single talent tree system across 6 branches (Muscle, Stealth, Business, Street Smarts, Leadership, Racketeer)
- **16 Street Story encounters** — rich random events with dialogue, scene-setting, and branching choices (old debts, journalist, FBI approach, funeral, wedding, hospital visit, dock strike, etc.)
- **5 Multi-Step Side Quest chains** — Informant Network, Safe Houses, Ghost Money, Code of Honor, Nightlife Empire — each with 3 progressive steps and escalating rewards
- **4 Post-Don Endgame Story Arcs** — The Successor, The Commission, The Reckoning (RICO), Legacy — unlocked by reputation thresholds
- **Level milestone narrations** at levels 5, 10, 15, 20, 25, 30 with immersive story overlays
- **Atmospheric world narrations** — 16 dynamic street atmosphere texts displayed on a rolling timer
- **Family-specific narrations** — Torrino, Kozlov, Chen, and Morales families now have unique job success/failure/atmosphere flavour text
- **storyExpansion.js** — new central content module for all story expansion content
- **Side quest UI system** — full screen with active/available/locked/completed quest views and progress bars

### Changed
- Re-enabled interactive events system with expanded event pool (original 5 + 16 street stories) and deduplication
- Job success/failure narrations now use family-aware text when player has chosen a family
- Post-Don epilogue screen expanded with endgame arc cards and side operations access
- Interactive event descriptions now render as multi-paragraph formatted text
- Story chapter view now includes Side Operations button

## [1.7.6] - 2026-03-01

### Changed
- **README.md** fully updated to v1.7.6 — removed mentions of loans, mentors, loyalty, perks; added current features (laundering, horse racing, vehicle system, weather)
- Cleaned stale onboarding/tutorial references from mobile nav customizer
- Updated Recent Changes section to reflect phases 25-31

## [1.7.5] - 2026-03-01

### Removed
- **Mentorship Program** — potentialMentors data, startMentoring(), checkMentorDiscovery(), mentor capture in gang wars, Mentors expertise tab
- **Expertise Perks System** — availablePerks data (11 perks), all perk effect checks (mastermind, fearMonger, shadowWalker, ghostProtocol, warMachine, streetSmart, fortuneSon, masterTeacher), Perks expertise tab, checkForNewPerks(), unlockPerk(), applyPerkEffects()
- **Gang Loyalty System** — loyalty stats from all 7 specialist roles, loyalty bars/buttons in crew UI, loyalty calculations in gang power/operations/betrayal/tribute, boostMemberLoyalty(), getAverageLoyalty(), updateMemberLoyalty(), dealWithDisloyalty(), loyalty_building training program, 35+ change areas cleaned
- **Loan Shark System** — showLoanShark(), takeLoan(), repayLoan(), checkLoanEligibility(), loanOptions data (4 loan types), Shylock SafeHouse menu entry, loan-shark-screen HTML

### Changed
- **Gang Member Death Rates Increased** — Turf defense death chance 10%→25%, territory expansion losses 1-3→2-5 members, gang war defeat losses 30%→45% of gang
- Gang operations now have 8% chance of member death (previously only arrest/betrayal)
- Turf defense victories now 25% chance of injury/death with 30% death sub-chance (was 15% injury only)
- Expertise screen now has 3 tabs: Basic Skills, Skill Trees, Reputation
- Faction selection text updated ("unique perks" → "unique advantages")
- Jailbreak description updated ("builds loyalty" → "earns respect")

## [1.7.4] - 2026-03-01

### Fixed
- **PowerShell Corruption Repair** — fixed 6 corrupted emoji expressions in multiplayer.js PvP result popup
- **dismissMember() Ghost Bug** — members now properly removed from array instead of just flagged, counter synced
- **137 bare alert() converted** to themed `showBriefNotification()` toasts with danger/success/warning classification
- **3 bare confirm() converted** to themed `ui.confirm()` modal dialogs (territory functions made async)
- **3 fragile gangSize calculations** fixed to use `gangMembers.length` directly
- **Dead legacy alert override function** removed (superseded by showBriefNotification)

## [1.7.3] - 2025-06-14

### Added
- **Territories SafeHouse Button** — new "Territories" button in the SafeHouse (unlocks at Level 5) to manage all owned territories from one screen
- **Territory Management Screen** — shows all owned SP Turf Zones (from Turf Wars) and MP Online Districts with stats: income, fortification, defense rating, tax revenue, residents list
- **Territory Summary Dashboard** — at-a-glance stats showing total territories, turf zones, online districts, total residents, and tax revenue
- **Alliance Territories Tab** — new "Alliance Territories" tab in the Alliance panel showing all districts owned by alliance members collectively
- **Alliance Territory Stats** — summary bar in alliance territories tab showing districts held, total residents, total tax revenue, and number of territory holders
- Server now includes alliance territory data in `alliance_info_result` response for faster initial load
- Territory info auto-refreshes when server sends updated territory data

## [1.6.9] - 2026-02-28

### Added
- NPC rival bosses control all 8 territories by default — players must fight to take over
- 8 themed NPC boss names (Vinnie 'The Rat' Morello, Don Castellano, Nikolai 'The Bear' Volkov, etc.)
- RIVAL BOSS badge on NPC-owned territories with distinct brown styling
- Scaled NPC defense per district difficulty (80–200 base defense rating)
- Persistence migration — existing unclaimed territories automatically get NPC bosses on server start

### Fixed
- Challenge button now sends correct `territory_war` message (was sending old `territory_claim` to wrong handler)
- Client-side gang member & energy pre-validation before sending war challenge

### Changed
- Territories help text updated to reflect NPC-first design
- No territories start unclaimed — Claim button never appears, only Challenge

## [1.6.8] - 2026-02-28

### Added
- Horse Racing casino game — 6 horses with different odds (2x–12x), animated racetrack, adjustable bets ($10–$50k)

### Changed
- Leaderboard tab label from "Turf" to "Territories"
- District explorer button from "Claim Turf" to "Claim Territory"
- Chat tab placeholder from "Loading street news..." to "Loading activity..."

### Removed
- Turf Wars (dead feature — gang wars array was always empty, never triggered)
- Street News / City Events system from Activities tab
- Objective tracker sidebar ("Current Objective" section in bottom-right)
- Onboarding tutorial system disabled (initOnboarding / updateTracker calls removed from game.js)
- spectateWar() animated battle/betting modal (~230 lines)
- showGangWars() and showCityEvents() functions from multiplayer.js

## [1.6.7] - 2026-02-28

### Added
- Black Market now has 8 category tabs (All, Consumables, Weapons, Armor, Tools, Vehicles, Luxury, Special) for easier browsing

### Fixed
- Black Market no longer resets scroll position after purchasing an item
- Jail timer now syncs from server authority, preventing early releases in multiplayer
- Rebalanced energy items: Coffee $1,000/15E, Energy Drink $2,500/30E, Steroids $4,000/60E

### Removed
- Removed redundant walkthrough tutorial system from game.js (onboarding.js preserved)
- Removed ~200 lines of dead respect/relationships UI code (showRelationshipsScreen, renderRelationship, formatTargetName)
- Removed stale respect system config flags (respectSystemEnabled, respectDecayRate)
- Removed clearTutorialHighlights() and dead tutorial-prompt-screen cleanup code
- Updated "tutorial" references to "onboarding" in mobile nav customizer

## [1.6.5] - 2026-02-27

### Fixed
- Delete save from Settings now correctly returns to the title screen
- `returnToIntroScreen()` rewritten to use `hideAllScreens()` for comprehensive cleanup
- `confirmDeleteSave()` wrapped in try-catch so errors can't silently prevent redirect

### Added
- Server health ping during loading — game stays on loading screen while Render server wakes from sleep
- "Waking up the server..." status message shown during cold start, with 30-second timeout fallback

### Changed
- Operations unlocked from level 0 (was level 3)
- Updated tutorial "Progressive Unlocks" step to match actual unlock levels
- Updated README version and recent changes section

## [1.6.4] - 2026-02-27

### Fixed
- Fixed PVP and Online World screens breaking after visiting World Chat
- World Chat was replacing the entire multiplayer-screen innerHTML, destroying the multiplayer-content div
- World Chat now correctly renders inside multiplayer-content and restores it if missing

## [1.6.3] - 2026-02-27

### Removed
- Removed unused respect-based relationship system (initializeRespectSystem, modifyRespect, calculateRespectEffects, processRespectDecay)
- Removed legacy redirect stubs (generateCampaignHTML, generateFactionMissionsHTML, generateBossBattlesHTML, territory redirect functions)
- Removed corresponding window.* assignments for deleted functions

### Changed
- Consolidated duplicate Character Showcase — showCharacterShowcase() now reuses buildCharacterShowcaseHTML()
- Consolidated duplicate Save/Load slot card templates into shared renderLoadSlotCards() helper
- showRecruitment() now uses hideAllScreens() instead of 9 manual getElementById calls

## [1.6.2] - 2026-02-27

### Fixed
- Fixed SafeHouse header clipping when stats bar wraps to multiple rows
- All screen headers, sidebars, and content padding now adapt to actual stats bar height

### Changed
- Replaced 31 hardcoded `44px` references with dynamic `--stats-bar-h` CSS variable
- Added `ResizeObserver` on stats bar to keep layout in sync

## [1.6.1] - 2026-02-27

### Fixed
- Removed duplicate "Back to SafeHouse" button from Stash screen
- Fixed Fence screen header clipping — added section header and page-nav
- Added null safety to all multiplayer DOM lookups (prevents console errors when elements missing)

### Changed
- Unified all Pastimes play buttons to consistent gold style matching Number Hunter
- Merged Crew Details into Family screen via "Manage Crew" button (removed redundant SafeHouse entry)
- Standardized 25+ inline back buttons across all screens to unified `nav-btn-back` class

## [1.6.0] - 2026-02-27

### Added
- **Turf System Overhaul** — complete replacement of SP territory system with 8 unique zones: Little Italy, Redlight District, Chinatown, Harbor Row, The Slums, Midtown Heights, Old Quarter, The Sprawl
- **Rival Families** — 4 crime families (Torrino, Kozlov, Chen, Morales) each with unique gameplay buffs
- **Family Allegiance** — choose which family to side with and rise through ranks from Associate to Don
- **Turf Missions & Boss Fights** — new mission chains tied to each zone, with boss encounters for turf control
- **Family Rank Progression** — earn promotions through reputation, missions completed, and zones controlled

### Fixed
- Critical missing comma in player.js that caused SyntaxError on game load
- 13 broken `addLog()` calls replaced with correct `logAction()` function
- Removed ~218 lines of duplicate function definitions (manageTurfDetails, fortifyTurf, etc.)
- `getRiskColor` now handles 'extreme' and 'very high' risk levels correctly
- Territory rewards properly route through turf system instead of being silently overwritten by updateUI()
- `startTurfMission` now correctly adds conquered zones to player.turf.owned
- Territory dispute event uses turf system checks instead of legacy counter

### Changed
- All SP "Territory" labels renamed to "Turf" across UI, missions, narration, and empire overview
- Mission IDs updated to match new TURF_ZONES (harbor_row_expansion, midtown_expansion, etc.)
- Cross-file references updated in missions.js, narration.js, empireOverview.js, index.html

## [1.5.9] - 2026-02-26

### Added
- **Status Bar customisation** — new section in Settings lets players toggle visibility of every HUD stat (Cash, Health, Energy, Heat, Rank, Dirty Money, Suspicion, Influence, Turf, District, XP, Skill Points, Season, Weather)
- Preferences stored in localStorage and applied on every UI update and game load

### Removed
- **Interactive random encounters** — disabled the popup events system (police raid choice, rival scandal / blackmail, arms deal, betrayal rumor, witness problem) that interrupted gameplay

## [1.5.8] - 2026-02-26

### Added
- **Durability system** — weapons, armor, and vehicles now have durability that degrades with each job, mission, or battle; items break when durability reaches 0
- **One-of-each limit** — players can only own one of each specific weapon, armor, or vehicle at a time
- **Vehicle equipping** — vehicles can now be equipped/unequipped from inventory, contributing power when equipped
- **Durability bars** — inventory screen shows visual durability indicators with color-coded health (green/yellow/red)
- **Equipment info in stats** — stats display now shows equipped item durability alongside power
- **Store "Already Owned"** — purchase buttons disabled for equippable items already in inventory

### Changed
- **Power system overhaul** — power is now calculated from equipped items + real estate + gang members only; unequipped inventory items no longer contribute power
- **Item type unification** — all guns now use type "weapon" (was "gun"), all cars now use type "vehicle" (was "car")
- **Equipment stores objects** — equipped weapon/armor/vehicle now store the full item object instead of just the name string
- **All `player.power` manipulations** replaced with centralized `recalculatePower()` function

### Fixed
- **Stats display** — equipment section now correctly reads item objects instead of treating strings as objects
- **Achievement check** — removed obsolete `type === 'gun'` check (now just "weapon")
- **Save migration** — old saves automatically get durability values, fixed types, and migrated equipped items from strings to objects

## [1.5.7] - 2026-02-26

### Added
- **Admin Panel** — server-verified admin controls in Settings with quick grants, stat editing, jail controls, and skill management (replaces old cheat system)
- **UI Toggles** — checkboxes in Settings to show/hide Quick Actions Panel and Mobile Nav Bar; preferences saved in localStorage

### Changed
- **Mission economy rebalance** — all mission rewards reduced ~90% for a slower grind (story campaigns, faction ops, territory conquests, boss battles, and objective targets)
- **Version sync** — gameVersion in cloud saves now uses the `CURRENT_VERSION` constant instead of hardcoded strings; updated package.json, server default, README, and CHANGELOG

### Fixed
- **Mobile nav on PC** — nav bar no longer appears on desktop after skipping tutorial (added mobile/tablet guard)
- **Admin panel visibility** — admin flag now set immediately on login/register via client-side fallback; showOptions refreshes admin status asynchronously

## [1.5.5] - 2026-02-26

### Fixed
- **Emoji encoding** — fixed ~920 lines of corrupted emoji characters (double-encoded UTF-8 mojibake) displaying as garbled symbols
- **Check for Updates** — now uses `fetch(asset, { cache: 'reload' })` on all 25+ game files to properly bust the browser HTTP cache before reloading, so updates actually take effect
- Cleaned up stale `?_cb=` URL params left by previous force-refresh logic

### Changed
- **Assassination odds lowered** — base chance 8%→5%, max cap 20%→15%, all bonuses reduced, target defense increased

## [1.5.4] - 2026-02-26

### Changed
- **Operations UI redesign** — replaced single-page wall of content with tabbed navigation (Story, Family Ops, Territory, Bosses)
- Mission cards now use proper CSS classes with color-coded borders, status badges, and inline requirement tags
- Crime families in Family Ops tab are collapsible accordion groups
- Locked missions hidden behind a toggle to reduce visual clutter
- Story campaign panel now shows a chapter progress bar with completion percentage
- Compact faction intel strip at top shows all family reputations at a glance

### Removed
- Random encounters system removed from generators.js and game.js

### Fixed
- Bot jailbreak button now shows visible alert feedback on success/failure
- Online players in jail now sync to server so other players can see them in jail lists
- Added `syncJailStatus()` client function and `handleJailStatusSync()` server handler

## [1.5.3] - 2026-02-25

### Fixed
- **Ghost UI** — fixed `.page-header` breadcrumbs remaining visible on screen after navigating away on mobile (position: fixed elements escaping hidden parent)
- **Check for Updates** — replaced deprecated `window.location.reload(true)` with `forceHardReload()` that clears service workers, Cache Storage API, then redirects with a `?_cb=` cache-buster to bypass GitHub Pages CDN
- **Mobile page-header** — added `.mobile-device .page-header` CSS rule so header spans full width instead of using desktop sidebar offsets

### Added
- `forceHardReload()` utility function for reliable cache-busting across all modern browsers
- `.screen-active` class system with MutationObserver to auto-hide fixed-position elements inside inactive screens
- Force Refresh button shown after version check reports you're up to date

## [1.5.2] - 2026-02-25

### Fixed
- **Version sync** — PC and mobile now display the same version number (1.5.2)
- **Duplicate code block** in game.js (`resetQuickActionPrefs` body appeared twice) — orphaned statements ran at module scope on load, potentially crashing initialization and breaking all Settings buttons on mobile
- **Mobile nav bar customizer** and **quick action customizer** buttons in Settings now work reliably
- **Save system** gameVersion now uses the `CURRENT_VERSION` constant instead of a hardcoded string
- **Server cloud save** default version updated from 1.3.8 to current release

## [1.4.3] - 2026-02-24

### Fixed
- **Comprehensive layout overhaul** — raised base `.game-screen` padding so all 31 screens clear the page-header at every breakpoint
- **Responsive media queries** — corrected sidebar top offsets (44px), page-header left/right values, and stats bar flex layout across 768px and 480px breakpoints
- **clearTutorialHighlights()** — now clears inline styles instead of setting incorrect z-index and border values
- **Tutorial skip button** persisting after skipping or completing the tutorial
- **5 runtime error hotfixes** — resolved crashes in gang, territory, faction, and UI systems
- **Stolen-cars screen** double-indent from conflicting margin and padding rules
- **Corrupted CSS block** with literal `\n` characters replaced with actual newlines

### Changed
- **Economy rebalance** — tuned job payouts, energy costs, and XP progression curves for better flow
- **Ledger polish** — sticky heading with gradient background, tighter log entry spacing
- **Merged expanded-styles.css** into styles.css — single stylesheet for all game CSS
- Removed `<link>` to expanded-styles.css from index.html
- Version bumped to 1.4.3

## [0.2.0] - 2025-11-21

### Added
- **Configuration System**
  - `config/meta.js` - Centralized game name, version, and metadata
  - `config/balance.js` - All balancing values (jobs, missions, XP, energy) in one place with detailed comments
  - Easy tuning of payouts, jail chances, energy costs, and progression curves

- **Event System**
  - `eventBus.js` - Decoupled event system for UI updates
  - `ui-events.js` - UI listeners subscribe to game state changes
  - Events: `moneyChanged`, `xpChanged`, `jailStatusChanged`, `wantedLevelChanged`, `reputationChanged`, `territoryChanged`

- **Logging & Debugging**
  - `logging.js` - Structured client-side logging system
  - Toggle via `GameLogging.setEnabled(true)` or `window.DEBUG_MODE`
  - Log key events: job completion, jail, territory capture, multiplayer errors
  - Debug panel accessible via `GameLogging.showDebugPanel()`

- **Server Improvements**
  - `worldPersistence.js` - JSON-based world state persistence
  - Automatic save/load for territories, city events, and leaderboards
  - Saves to `world-state.json` with error handling and throttling
  - Enhanced security with rate limiting and input validation
  - Profanity filter for player names and chat

- **Development Tools**
  - ESLint configuration for code quality
  - npm scripts: `npm run lint`, `npm run check`, `npm run dev`
  - Better error handling and logging throughout

### Changed
- Refactored configuration for easier balancing
- Improved code organization and documentation
- Enhanced server stability and security
- Updated package.json with correct version and metadata

### Technical
- All balance values centralized in `config/balance.js`
- Event-driven UI updates reduce coupling
- Server-side world state persistence
- Foundation for server-authoritative multiplayer

## [0.1.0] - Initial Release

### Added
- Core criminal empire gameplay
- Single player progression system
- Local multiplayer support
- Job system with risk/reward mechanics
- Territory control
- Gang management
- Faction missions
- Character customization
- Save/load functionality
