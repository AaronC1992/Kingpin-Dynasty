# Changelog

All notable changes to From Dusk To Don (Mafia Born) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
