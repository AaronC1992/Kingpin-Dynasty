# Changelog

All notable changes to From Dusk To Don (Kingpin Dynasty) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
