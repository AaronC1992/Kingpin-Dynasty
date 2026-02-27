# Changelog

All notable changes to From Dusk To Don (Mafia Born) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
